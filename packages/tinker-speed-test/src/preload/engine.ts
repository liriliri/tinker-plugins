import { randomBytes } from 'node:crypto'
import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'
import find from 'licia/find'
import map from 'licia/map'
import max from 'licia/max'
import min from 'licia/min'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import type {
  SpeedProgressEvent,
  SpeedServerKind,
  SpeedTestNodeInfo,
  SpeedTestResult,
} from '../common/types'

type NodeDef = SpeedTestNodeInfo & {
  baseUrl: string
  hostHeader?: string
}

const NODES: NodeDef[] = [
  {
    id: 'ookla-3633',
    name: 'Shanghai Telecom (Ookla)',
    nameZh: '上海电信（Ookla）',
    kind: 'ookla',
    baseUrl: 'http://222.68.195.2:8080',
    hostHeader: 'sh-ct.online.sh.cn',
  },
  {
    id: 'ookla-13623',
    name: 'Singapore Singtel (Ookla)',
    nameZh: '新加坡 Singtel（Ookla）',
    kind: 'ookla',
    baseUrl: 'https://server-13623.prod.hosts.ooklaserver.net:8080',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    nameZh: 'Cloudflare（境外）',
    kind: 'cloudflare',
    baseUrl: 'https://speed.cloudflare.com',
  },
]

const OVERHEAD = 1.06
const PING_COUNT = 24
const DOWNLOAD_SECONDS = 10
const UPLOAD_SECONDS = 8
const DOWNLOAD_STREAMS = 4
const UPLOAD_STREAMS = 3
const DOWNLOAD_CHUNK_MIB = 100
const CF_DOWNLOAD_BYTES = 25_000_000
const CF_UPLOAD_CHUNK = 32 * 1024 * 1024
const UPLOAD_CHUNK = 1 * 1024 * 1024
const OOKLA_SIZES = [4000, 3000, 2000, 1000]
const MAX_FAILS = 8
const LATENCY_MAX_FAILS = 5
const HEADER_TIMEOUT_MS = 8000
const DOWNLOAD_HEADER_TIMEOUT_MS = 12000
const DOWNLOAD_STALL_S = 5
const UPLOAD_STALL_S = 6
const CF_TRACE = 'https://speed.cloudflare.com/cdn-cgi/trace'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Tinker-SpeedTest/1.0'

export function listNodes(): SpeedTestNodeInfo[] {
  return map(NODES, ({ id, name, nameZh, kind }) => ({
    id,
    name,
    nameZh,
    kind,
  }))
}

function bitsToMbps(bytes: number, seconds: number): number {
  if (seconds <= 0.02 || bytes <= 0) return 0
  return ((bytes * 8) / 1e6 / seconds) * OVERHEAD
}

function backoffMs(fails: number): number {
  return min(1600, 60 << min(fails - 1, 5))
}

function getNode(id?: string): NodeDef {
  return find(NODES, (n) => n.id === id) ?? NODES[0]
}

function cryptoRandom(): string {
  return randomBytes(16).toString('hex')
}

function uploadChunkSize(kind: SpeedServerKind): number {
  return kind === 'cloudflare' ? CF_UPLOAD_CHUNK : UPLOAD_CHUNK
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function abortError(): Error {
  const err = new Error('Aborted')
  err.name = 'AbortError'
  return err
}

type HttpResult = {
  status: number
  headers: http.IncomingHttpHeaders
  stream: NodeJS.ReadableStream
  text: () => Promise<string>
}

function request(
  urlStr: string,
  opts: {
    method?: string
    headers?: Record<string, string>
    body?: Uint8Array
    signal?: AbortSignal
    headerTimeoutMs?: number
    hostHeader?: string
  } = {},
): Promise<HttpResult> {
  const url = new URL(urlStr)
  const lib = url.protocol === 'https:' ? https : http
  const headers: Record<string, string> = {
    'user-agent': UA,
    ...opts.headers,
  }
  if (opts.hostHeader) headers.host = opts.hostHeader
  if (opts.body) headers['content-length'] = String(opts.body.byteLength)

  return new Promise((resolve, reject) => {
    if (opts.signal?.aborted) {
      reject(abortError())
      return
    }

    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: opts.method || 'GET',
        headers,
        timeout: opts.headerTimeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = []
        let collected = false
        const result: HttpResult = {
          status: res.statusCode || 0,
          headers: res.headers,
          stream: res,
          text: async () => {
            if (!collected) {
              for await (const chunk of res) chunks.push(chunk as Buffer)
              collected = true
            }
            return Buffer.concat(chunks).toString('utf8')
          },
        }
        resolve(result)
      },
    )

    const onAbort = () => {
      req.destroy(abortError())
    }
    opts.signal?.addEventListener('abort', onAbort, { once: true })

    req.on('timeout', () => {
      req.destroy(new Error('Header timeout'))
    })
    req.on('error', (err) => {
      opts.signal?.removeEventListener('abort', onAbort)
      reject(err)
    })

    if (opts.body) req.write(opts.body)
    req.end()
  })
}

async function readStream(
  stream: NodeJS.ReadableStream,
  add: (n: number) => void,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }
    const destroyable = stream as NodeJS.ReadableStream & {
      destroy?: (err?: Error) => void
    }
    const onAbort = () => {
      destroyable.destroy?.(abortError())
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
    stream.on('data', (chunk: Buffer) => add(chunk.byteLength))
    stream.on('end', () => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    })
    stream.on('error', (err) => {
      signal.removeEventListener('abort', onAbort)
      if (signal.aborted) reject(abortError())
      else reject(err)
    })
  })
}

async function getIpFromTrace(
  url: string,
  signal: AbortSignal,
): Promise<string> {
  const resp = await request(url, {
    signal,
    headerTimeoutMs: HEADER_TIMEOUT_MS,
  })
  if (resp.status < 200 || resp.status >= 300) {
    throw new Error(`HTTP ${resp.status}`)
  }
  const text = await resp.text()
  for (const line of text.split('\n')) {
    if (startWith(line, 'ip=')) return trim(line.slice(3))
  }
  throw new Error('Unable to parse public IP')
}

async function getPublicIp(
  node: NodeDef,
  signal: AbortSignal,
): Promise<string> {
  if (node.kind === 'ookla') return getIpFromTrace(CF_TRACE, signal)

  if (node.kind === 'librespeed') {
    const resp = await request(`${node.baseUrl}/getIP.php`, {
      signal,
      headerTimeoutMs: HEADER_TIMEOUT_MS,
      hostHeader: node.hostHeader,
    })
    if (resp.status < 200 || resp.status >= 300) {
      throw new Error(`HTTP ${resp.status}`)
    }
    return trim(await resp.text())
  }

  try {
    const metaResp = await request(`${node.baseUrl}/meta`, {
      signal,
      headerTimeoutMs: HEADER_TIMEOUT_MS,
    })
    if (metaResp.status >= 200 && metaResp.status < 300) {
      const meta = JSON.parse(await metaResp.text()) as { clientIp?: string }
      if (meta.clientIp) return trim(meta.clientIp)
    }
  } catch (e) {
    if (signal.aborted) throw e
  }

  return getIpFromTrace(`${node.baseUrl}/cdn-cgi/trace`, signal)
}

function latencyUrl(node: NodeDef): string {
  const r = cryptoRandom()
  if (node.kind === 'cloudflare') return `${node.baseUrl}/__down?bytes=0&r=${r}`
  if (node.kind === 'ookla')
    return `${node.baseUrl}/speedtest/latency.txt?x=${r}`
  return `${node.baseUrl}/empty.php?cors=true&r=${r}`
}

function downloadUrl(node: NodeDef, ooklaSize: number): string {
  if (node.kind === 'cloudflare') {
    return `${node.baseUrl}/__down?bytes=${CF_DOWNLOAD_BYTES}`
  }
  if (node.kind === 'ookla') {
    return `${node.baseUrl}/speedtest/random${ooklaSize}x${ooklaSize}.jpg?x=${cryptoRandom()}`
  }
  return `${node.baseUrl}/garbage.php?ckSize=${DOWNLOAD_CHUNK_MIB}`
}

function uploadUrl(node: NodeDef): string {
  if (node.kind === 'cloudflare') return `${node.baseUrl}/__up`
  if (node.kind === 'ookla') return `${node.baseUrl}/speedtest/upload.php`
  return `${node.baseUrl}/empty.php`
}

async function measureLatency(
  node: NodeDef,
  onProgress: (e: SpeedProgressEvent) => void,
  signal: AbortSignal,
): Promise<{ pingMs: number; jitterMs: number }> {
  const samples: number[] = []
  let diffSum = 0
  let diffCount = 0
  let consecutiveFails = 0

  for (let i = 0; i < PING_COUNT; i++) {
    if (signal.aborted) throw abortError()
    const start = performance.now()
    try {
      const resp = await request(latencyUrl(node), {
        signal,
        headerTimeoutMs: HEADER_TIMEOUT_MS,
        hostHeader: node.hostHeader,
      })
      resp.stream.resume()
      consecutiveFails = 0
    } catch (e) {
      if (signal.aborted) throw e
      consecutiveFails++
      if (consecutiveFails >= LATENCY_MAX_FAILS) {
        throw new Error(
          `Latency probe failed ${consecutiveFails} times on ${node.name}`,
        )
      }
      await sleep(120, signal)
      continue
    }

    const ms = max(0.01, performance.now() - start)
    samples.push(ms)
    if (samples.length >= 2) {
      diffSum += Math.abs(ms - samples[samples.length - 2])
      diffCount++
    }

    onProgress({
      type: 'latency',
      pingMs: median(samples),
      jitterMs: diffCount > 0 ? diffSum / diffCount : 0,
      done: samples.length,
      total: PING_COUNT,
    })
    await sleep(15, signal)
  }

  if (!samples.length) throw new Error(`No latency samples from ${node.name}`)
  return {
    pingMs: median(samples),
    jitterMs: diffCount > 0 ? diffSum / diffCount : 0,
  }
}

type PhaseEnd = 'normal' | 'streams-dead' | 'stalled'

async function runSampler(opts: {
  getBytes: () => number
  totalSeconds: number
  stallSeconds: number
  alive: { count: number }
  phaseCtrl: AbortController
  onLive: (mbps: number, progress: number, seconds: number) => void
  startedAt: number
}): Promise<PhaseEnd> {
  const window: Array<{ t: number; bytes: number }> = []
  let lastBytes = -1
  let lastProgressAt = 0
  let end: PhaseEnd = 'normal'

  try {
    while (true) {
      await sleep(120, opts.phaseCtrl.signal)
      const now = (performance.now() - opts.startedAt) / 1000
      const b = opts.getBytes()
      window.push({ t: now, bytes: b })
      while (window.length > 1 && now - window[0].t > 1) window.shift()

      let liveMbps = 0
      const oldest = window[0]
      const dt = now - oldest.t
      if (dt >= 0.2 && b >= oldest.bytes) {
        liveMbps = max(0, bitsToMbps(b - oldest.bytes, dt))
      }
      opts.onLive(liveMbps, min(1, now / opts.totalSeconds), now)

      if (opts.alive.count <= 0) {
        end = 'streams-dead'
        break
      }

      if (b !== lastBytes) {
        lastBytes = b
        lastProgressAt = now
      } else if (now - lastProgressAt >= opts.stallSeconds) {
        end = 'stalled'
        break
      }

      if (now >= opts.totalSeconds) break
    }
  } catch {
    /* cancelled */
  }

  opts.phaseCtrl.abort()
  return end
}

function throwIfAbortedPhase(end: PhaseEnd, name: string, bytes: number) {
  if (end === 'streams-dead') {
    throw new Error(
      bytes > 0
        ? `${name} rejected connections mid-test; try again or switch node`
        : `${name} rejected all requests; try again or switch node`,
    )
  }
  if (end === 'stalled') {
    throw new Error(`${name} stalled; try again or switch node`)
  }
}

async function downloadWorker(
  node: NodeDef,
  signal: AbortSignal,
  add: (n: number) => void,
): Promise<void> {
  let sizeIdx = 0
  let fails = 0
  while (!signal.aborted && fails < MAX_FAILS) {
    try {
      const resp = await request(downloadUrl(node, OOKLA_SIZES[sizeIdx]), {
        signal,
        headerTimeoutMs: DOWNLOAD_HEADER_TIMEOUT_MS,
        hostHeader: node.hostHeader,
      })
      if (resp.status < 200 || resp.status >= 300) {
        fails++
        if (node.kind === 'ookla' && sizeIdx < OOKLA_SIZES.length - 1) sizeIdx++
        await sleep(backoffMs(fails), signal)
        continue
      }
      fails = 0
      await readStream(resp.stream, add, signal)
    } catch (e) {
      if (signal.aborted) break
      fails++
      try {
        await sleep(backoffMs(fails), signal)
      } catch {
        break
      }
    }
  }
}

async function uploadWorker(
  node: NodeDef,
  chunk: Uint8Array,
  userSignal: AbortSignal,
  stopNewSignal: AbortSignal,
  add: (n: number) => void,
): Promise<void> {
  const target = uploadUrl(node)
  let fails = 0
  while (!stopNewSignal.aborted && fails < MAX_FAILS) {
    try {
      // Node http buffers the body before send; count the chunk after the response starts.
      const resp = await request(target, {
        method: 'POST',
        body: chunk,
        signal: userSignal,
        hostHeader: node.hostHeader,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      })
      resp.stream.resume()
      add(chunk.byteLength)
      fails = 0
    } catch {
      if (userSignal.aborted || stopNewSignal.aborted) break
      fails++
      try {
        await sleep(backoffMs(fails), userSignal)
      } catch {
        break
      }
    }
  }
}

async function measureDownload(
  node: NodeDef,
  onProgress: (e: SpeedProgressEvent) => void,
  signal: AbortSignal,
): Promise<number> {
  const phaseCtrl = new AbortController()
  const onAbort = () => phaseCtrl.abort()
  signal.addEventListener('abort', onAbort, { once: true })

  let bytes = 0
  const alive = { count: DOWNLOAD_STREAMS }
  const start = performance.now()
  const workers = Array.from({ length: DOWNLOAD_STREAMS }, () =>
    downloadWorker(node, phaseCtrl.signal, (n) => {
      bytes += n
    }).finally(() => {
      alive.count -= 1
    }),
  )

  try {
    const end = await runSampler({
      getBytes: () => bytes,
      totalSeconds: DOWNLOAD_SECONDS,
      stallSeconds: DOWNLOAD_STALL_S,
      alive,
      phaseCtrl,
      onLive: (mbps, progress, seconds) =>
        onProgress({ type: 'download', mbps, progress, seconds }),
      startedAt: start,
    })

    await Promise.race([
      Promise.allSettled(workers),
      sleep(end === 'normal' ? 2500 : 1200, signal).catch(() => undefined),
    ])
    if (signal.aborted) throw abortError()
    throwIfAbortedPhase(end, node.name, bytes)
    if (bytes <= 0) throw new Error(`No download data from ${node.name}`)
    const mbps = bitsToMbps(bytes, (performance.now() - start) / 1000)
    onProgress({
      type: 'download',
      mbps,
      progress: 1,
      seconds: DOWNLOAD_SECONDS,
      final: true,
    })
    return mbps
  } finally {
    phaseCtrl.abort()
    signal.removeEventListener('abort', onAbort)
  }
}

async function measureUpload(
  node: NodeDef,
  onProgress: (e: SpeedProgressEvent) => void,
  signal: AbortSignal,
): Promise<number> {
  const phaseCtrl = new AbortController()
  const onAbort = () => phaseCtrl.abort()
  signal.addEventListener('abort', onAbort, { once: true })

  let sent = 0
  const alive = { count: UPLOAD_STREAMS }
  const start = performance.now()
  const chunk = randomBytes(uploadChunkSize(node.kind))
  const workers = Array.from({ length: UPLOAD_STREAMS }, () =>
    uploadWorker(node, chunk, signal, phaseCtrl.signal, (n) => {
      sent += n
    }).finally(() => {
      alive.count -= 1
    }),
  )

  try {
    const end = await runSampler({
      getBytes: () => sent,
      totalSeconds: UPLOAD_SECONDS,
      stallSeconds: UPLOAD_STALL_S,
      alive,
      phaseCtrl,
      onLive: (mbps, progress, seconds) =>
        onProgress({ type: 'upload', mbps, progress, seconds }),
      startedAt: start,
    })

    await Promise.race([
      Promise.allSettled(workers),
      sleep(end === 'normal' ? 6000 : 1200, signal).catch(() => undefined),
    ])
    if (signal.aborted) throw abortError()
    throwIfAbortedPhase(end, node.name, sent)
    if (sent <= 0) throw new Error(`No upload data from ${node.name}`)
    const mbps = bitsToMbps(sent, (performance.now() - start) / 1000)
    onProgress({
      type: 'upload',
      mbps,
      progress: 1,
      seconds: UPLOAD_SECONDS,
      final: true,
    })
    return mbps
  } finally {
    phaseCtrl.abort()
    signal.removeEventListener('abort', onAbort)
  }
}

let activeCtrl: AbortController | null = null

export function cancelSpeedTest() {
  activeCtrl?.abort()
  activeCtrl = null
}

export async function runSpeedTest(
  nodeId: string | undefined,
  onProgress: (e: SpeedProgressEvent) => void,
): Promise<SpeedTestResult> {
  cancelSpeedTest()
  const ctrl = new AbortController()
  activeCtrl = ctrl
  const node = getNode(nodeId)
  const { signal } = ctrl

  try {
    onProgress({ type: 'phase', phase: 'ip' })
    let ip = '--'
    try {
      ip = await getPublicIp(node, signal)
      onProgress({ type: 'ip', ip })
    } catch (e) {
      if (signal.aborted) throw e
      onProgress({ type: 'ip', ip: '--' })
    }

    onProgress({ type: 'phase', phase: 'latency' })
    const { pingMs, jitterMs } = await measureLatency(node, onProgress, signal)

    onProgress({ type: 'phase', phase: 'download' })
    const downloadMbps = await measureDownload(node, onProgress, signal)

    onProgress({ type: 'phase', phase: 'upload' })
    const uploadMbps = await measureUpload(node, onProgress, signal)

    onProgress({ type: 'phase', phase: 'done' })
    return {
      nodeId: node.id,
      ip,
      pingMs,
      jitterMs,
      downloadMbps,
      uploadMbps,
    }
  } finally {
    if (activeCtrl === ctrl) activeCtrl = null
  }
}
