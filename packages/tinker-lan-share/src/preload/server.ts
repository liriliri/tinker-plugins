import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'
import Url from 'licia/Url'
import each from 'licia/each'
import getPort from 'licia/getPort'
import map from 'licia/map'
import mime from 'licia/mime'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import values from 'licia/values'
import { errorMessage } from 'tinker-share/lib/util'
import type { ServerConfig, ServerStatus } from '../common/types'
import {
  clearAll,
  contentTypeOf,
  fileCount,
  getChangeVersion,
  getShareDir,
  initShareDir,
  listSharedFiles,
  onShareChanged,
  removePath,
  resolveSharePath,
  saveUpload,
} from './share'

interface ServerState {
  config: ServerConfig
  host: string
  port: number
  server: http.Server
  eventClients: Set<http.ServerResponse>
}

let state: ServerState | null = null

function displayHost(host: string) {
  return host === '0.0.0.0' ? '127.0.0.1' : host
}

function getLanAddresses(): string[] {
  const result: string[] = []
  each(values(os.networkInterfaces()), (entries) => {
    if (!entries) return
    each(entries, (entry) => {
      if (entry.family === 'IPv4' && !entry.internal) {
        result.push(entry.address)
      }
    })
  })
  return result
}

function getHttpRoot() {
  return path.join(__dirname, '../http')
}

function pathnameOf(url: string) {
  return Url.parse(url || '/').pathname || '/'
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  const raw = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Content-Length': Buffer.byteLength(raw),
  })
  res.end(raw)
}

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function contentTypeForAsset(filePath: string) {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  if (ext === 'ico') return 'image/x-icon'
  const type = mime(ext)
  if (!type) return 'application/octet-stream'
  if (
    startWith(type, 'text/') ||
    type === 'application/javascript' ||
    type === 'application/json' ||
    type === 'image/svg+xml'
  ) {
    return `${type}; charset=utf-8`
  }
  return type
}

function serveStatic(res: http.ServerResponse, filePath: string) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404).end('Not Found')
    return
  }
  const data = fs.readFileSync(filePath)
  res.writeHead(200, {
    'Content-Type': contentTypeForAsset(filePath),
    'Cache-Control': 'no-cache',
  })
  res.end(data)
}

function serveSpa(res: http.ServerResponse) {
  const root = getHttpRoot()
  const indexPath = path.join(root, 'index.html')
  const altPath = path.join(root, 'http.html')
  if (fs.existsSync(indexPath)) {
    serveStatic(res, indexPath)
    return
  }
  serveStatic(res, altPath)
}

async function handleApi(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string,
) {
  if (pathname === '/api/info' && req.method === 'GET') {
    let language = 'en-US'
    let theme = 'light'
    try {
      ;[language, theme] = await Promise.all([
        tinker.getLanguage(),
        tinker.getTheme(),
      ])
    } catch {
      // ignore
    }
    const status = getServerStatus()
    const lanUrl = status.lanUrls[0] || status.url
    const ip =
      lanUrl.replace(/^https?:\/\//, '').split(':')[0] ||
      displayHost(status.host)
    sendJson(res, 200, {
      ip,
      port: status.port,
      url: lanUrl || status.url,
      language,
      theme,
    })
    return
  }

  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
    })
    res.write(`data: ${getChangeVersion()}\n\n`)
    state?.eventClients.add(res)
    const unsubscribe = onShareChanged((version) => {
      if (!res.writableEnded) res.write(`data: ${version}\n\n`)
    })
    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(': ping\n\n')
    }, 15000)
    const cleanup = () => {
      clearInterval(heartbeat)
      unsubscribe()
      state?.eventClients.delete(res)
    }
    req.on('close', cleanup)
    req.on('error', cleanup)
    return
  }

  if (pathname === '/api/files' && req.method === 'GET') {
    sendJson(res, 200, listSharedFiles())
    return
  }

  if (pathname === '/api/files' && req.method === 'DELETE') {
    const raw = await readBody(req)
    let body: { path?: string }
    try {
      body = JSON.parse(raw.toString('utf8'))
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' })
      return
    }
    const relativePath = trim(body.path || '')
    if (!relativePath) {
      sendJson(res, 400, { error: 'path is required' })
      return
    }
    removePath(relativePath)
    sendJson(res, 200, { ok: true })
    return
  }

  if (pathname === '/api/clear' && req.method === 'DELETE') {
    clearAll()
    sendJson(res, 200, { ok: true })
    return
  }

  if (pathname === '/api/upload' && req.method === 'POST') {
    const headerName = req.headers['x-file-name']
    const fileName = decodeURIComponent(
      Array.isArray(headerName) ? headerName[0] || '' : headerName || '',
    )
    if (!fileName) {
      sendJson(res, 400, { error: 'X-File-Name is required' })
      return
    }
    await saveUpload(fileName, req)
    sendJson(res, 200, { ok: true })
    return
  }

  sendJson(res, 404, { error: 'Not Found' })
}

async function serveDownload(res: http.ServerResponse, encodedPath: string) {
  const relativePath = decodeURIComponent(encodedPath)
  let full: string
  try {
    full = resolveSharePath(relativePath)
  } catch {
    res.writeHead(400).end('Bad Request')
    return
  }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404).end('Not Found')
    return
  }
  const stat = fs.statSync(full)
  const fileName = path.basename(full)
  res.writeHead(200, {
    'Content-Type': contentTypeOf(full),
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  })
  fs.createReadStream(full).pipe(res)
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const pathname = pathnameOf(req.url || '/')

  if (startWith(pathname, '/api/')) {
    try {
      await handleApi(req, res, pathname)
    } catch (err: unknown) {
      sendJson(res, 500, { error: errorMessage(err) })
    }
    return
  }

  if (startWith(pathname, '/download/')) {
    try {
      await serveDownload(res, pathname.slice('/download/'.length))
    } catch (err: unknown) {
      sendJson(res, 500, { error: errorMessage(err) })
    }
    return
  }

  if (pathname === '/' || pathname === '/index.html') {
    serveSpa(res)
    return
  }

  const filePath = path.join(getHttpRoot(), pathname.replace(/^\//, ''))
  if (startWith(path.resolve(filePath), path.resolve(getHttpRoot()))) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      serveStatic(res, filePath)
      return
    }
  }

  serveSpa(res)
}

export async function startServer(config: ServerConfig): Promise<ServerStatus> {
  if (state) {
    await stopServer()
  }

  await initShareDir()

  const host = config.host || '0.0.0.0'
  const preferredPort = config.port || 18080
  const port = await getPort(preferredPort, host)
  if (preferredPort && port !== preferredPort) {
    throw new Error(`Port ${preferredPort} is already in use`)
  }

  const server = http.createServer((req, res) => {
    void handleRequest(req, res)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.once('listening', () => resolve())
    server.listen(port, host)
  })

  state = { config, host, port, server, eventClients: new Set() }
  return getServerStatus()
}

export async function stopServer() {
  if (!state) return
  const current = state
  state = null
  each(current.eventClients, (client) => {
    try {
      client.end()
    } catch {
      // ignore
    }
  })
  current.eventClients.clear()
  if (typeof current.server.closeAllConnections === 'function') {
    current.server.closeAllConnections()
  }
  await new Promise<void>((resolve) => {
    current.server.close(() => resolve())
  })
}

export function getServerStatus(): ServerStatus {
  if (!state) {
    return {
      running: false,
      host: '',
      port: 0,
      url: '',
      lanUrls: [],
      shareDir: getShareDir(),
      fileCount: getShareDir() ? fileCount() : 0,
    }
  }
  const shown = displayHost(state.host)
  const lanUrls =
    state.host === '0.0.0.0'
      ? map(getLanAddresses(), (ip) => `http://${ip}:${state!.port}`)
      : []
  return {
    running: true,
    host: state.host,
    port: state.port,
    url: `http://${shown}:${state.port}`,
    lanUrls,
    shareDir: getShareDir(),
    fileCount: fileCount(),
  }
}
