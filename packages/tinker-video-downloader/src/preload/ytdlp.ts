import { spawn, execFileSync, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import trim from 'licia/trim'
import map from 'licia/map'
import filter from 'licia/filter'
import last from 'licia/last'
import compact from 'licia/compact'
import contain from 'licia/contain'
import unique from 'licia/unique'
import toStr from 'licia/toStr'
import isErr from 'licia/isErr'
import randomId from 'licia/randomId'
import isWindows from 'licia/isWindows'
import type {
  VideoInfo,
  VideoFormat,
  CookieEntry,
  ParseOptions,
  DownloadOptions,
  DownloadProgress,
  DownloadResult,
  YtDlpStatus,
} from '../common/types'
import { serializeCookiesTxt } from '../common/cookies'
import { isYouTubeUrl, isBilibiliUrl } from '../common/url'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const activeDownloads = new Map<
  string,
  { child: ChildProcess | null; cancelled: boolean }
>()

function which(cmd: string): string | null {
  try {
    const finder = isWindows ? 'where' : 'which'
    const out = trim(
      execFileSync(finder, [cmd], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
    )
    const first = trim(out.split(/\r?\n/)[0] || '')
    return first && existsSync(first) ? first : null
  } catch {
    return null
  }
}

function resolveYtDlpPath(custom?: string): string {
  const customPath = trim(custom || '')
  if (customPath && existsSync(customPath)) {
    return customPath
  }
  const name = isWindows ? 'yt-dlp.exe' : 'yt-dlp'
  return which(name) || which('yt-dlp') || name
}

export function ensureDir(dir: string): string {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function deleteFiles(paths: string[]): void {
  for (const p of paths) {
    try {
      if (p && existsSync(p)) unlinkSync(p)
    } catch {
      // ignore
    }
  }
}

export function safeFileName(title: string): string {
  return title.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 120) || 'video'
}

export function checkYtDlp(ytDlpPath?: string): YtDlpStatus {
  const path = resolveYtDlpPath(ytDlpPath)
  try {
    const version = trim(
      execFileSync(path, ['--version'], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      }),
    ).split(/\r?\n/)[0]
    return { available: true, path, version }
  } catch {
    return { available: false, path, version: '' }
  }
}

function getAvailableBrowser(): string {
  const home = homedir()

  if (isWindows) {
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      join(
        home,
        'AppData',
        'Local',
        'Google',
        'Chrome',
        'Application',
        'chrome.exe',
      ),
    ]
    for (const p of chromePaths) {
      if (existsSync(p)) return 'chrome'
    }
    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      join(
        home,
        'AppData',
        'Local',
        'Microsoft',
        'Edge',
        'Application',
        'msedge.exe',
      ),
    ]
    for (const p of edgePaths) {
      if (existsSync(p)) return 'edge'
    }
    return ''
  }

  if (process.platform === 'darwin') {
    if (
      existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    ) {
      return 'chrome'
    }
    if (
      existsSync(
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      )
    ) {
      return 'edge'
    }
    if (existsSync('/Applications/Safari.app/Contents/MacOS/Safari')) {
      return 'safari'
    }
    return ''
  }

  if (
    which('google-chrome') ||
    which('google-chrome-stable') ||
    which('chromium') ||
    which('chromium-browser')
  ) {
    return 'chrome'
  }
  return ''
}

function writeTempCookiesFile(cookies: CookieEntry[]): string {
  const path = join(tmpdir(), `tinker-vd-cookies-${randomId(12)}.txt`)
  writeFileSync(path, serializeCookiesTxt(cookies), 'utf8')
  return path
}

function removeTempFile(path?: string) {
  if (!path) return
  try {
    unlinkSync(path)
  } catch {
    // ignore
  }
}

function lastNonEmptyLine(text: string): string {
  return last(compact(map(text.split('\n'), (line) => trim(line)))) || ''
}

function buildCommonArgs(options: {
  cookiesFile?: string
  url: string
}): string[] {
  const args = ['--no-playlist', '--no-check-certificates', '--user-agent', UA]

  const cookiesFile = trim(options.cookiesFile || '')
  if (cookiesFile && existsSync(cookiesFile)) {
    args.push('--cookies', cookiesFile)
  } else if (isYouTubeUrl(options.url) || isBilibiliUrl(options.url)) {
    const browser = getAvailableBrowser()
    if (browser) {
      args.push('--cookies-from-browser', browser)
    }
  }

  if (isYouTubeUrl(options.url)) {
    const nodePath = which(isWindows ? 'node.exe' : 'node')
    if (nodePath) {
      args.push('--js-runtimes', `node:${nodePath}`)
    }
  }

  return args
}

function prepareCookieArgs(options: { cookies?: CookieEntry[]; url: string }): {
  args: string[]
  tempCookiesFile?: string
} {
  const cookies = filter(
    options.cookies || [],
    (c) => !!trim(c.domain) && !!trim(c.name),
  )
  if (cookies.length) {
    const tempCookiesFile = writeTempCookiesFile(cookies)
    return {
      args: buildCommonArgs({
        cookiesFile: tempCookiesFile,
        url: options.url,
      }),
      tempCookiesFile,
    }
  }
  return { args: buildCommonArgs({ url: options.url }) }
}

interface YtDlpRawFormat {
  format_id?: string | number
  quality_label?: string
  resolution?: string
  format_note?: string
  ext?: string
  video_ext?: string
  filesize?: number
  filesize_approx?: number
  tbr?: number
  vbr?: number
  width?: number
  height?: number
  fps?: number
  vcodec?: string
  acodec?: string
  protocol?: string
}

interface YtDlpRawInfo {
  id?: string
  title?: string
  description?: string
  thumbnail?: string
  duration?: number
  uploader?: string
  webpage_url?: string
  formats?: YtDlpRawFormat[]
}

interface MappedFormat extends VideoFormat {
  _tbr: number
}

function mapFormats(info: YtDlpRawInfo): VideoFormat[] {
  const formats: MappedFormat[] = filter(
    map(
      filter(info.formats || [], (f) => {
        const hasVideo =
          !!f.vcodec && f.vcodec !== 'none' && !!f.height && f.height > 0
        const isM3u8 = !!f.protocol && contain(toStr(f.protocol), 'm3u8')
        return hasVideo && !isM3u8
      }),
      (f) => {
        let filesize = f.filesize || f.filesize_approx || 0
        if (!filesize && f.tbr && info.duration) {
          filesize = Math.floor((f.tbr * 1000 * info.duration) / 8)
        }
        return {
          formatId: toStr(f.format_id || ''),
          quality:
            f.quality_label || f.resolution || f.format_note || `${f.height}p`,
          ext: f.ext || f.video_ext || 'mp4',
          filesize,
          width: f.width || 0,
          height: f.height || 0,
          fps: f.fps || 0,
          hasAudio: !!(f.acodec && f.acodec !== 'none'),
          _tbr: f.tbr || f.vbr || 0,
        }
      },
    ),
    (f) => !!f.quality && f.quality !== 'undefinedp',
  )
  formats.sort((a, b) => {
    const heightDiff = (b.height || 0) - (a.height || 0)
    if (heightDiff !== 0) return heightDiff
    if (a.hasAudio && !b.hasAudio) return -1
    if (!a.hasAudio && b.hasAudio) return 1
    return (b._tbr || 0) - (a._tbr || 0)
  })

  return map(
    unique(formats, (a, b) => a.quality === b.quality),
    ({ _tbr: _bitrate, ...rest }) => rest,
  )
}

export function parseVideo(
  url: string,
  options: ParseOptions = {},
): Promise<VideoInfo> {
  return new Promise((resolvePromise, reject) => {
    const ytdlpPath = resolveYtDlpPath(options.ytDlpPath)
    const status = checkYtDlp(options.ytDlpPath)
    if (!status.available) {
      reject(
        new Error(
          'yt-dlp not found. Please install yt-dlp and ensure it is on PATH.',
        ),
      )
      return
    }

    const { args: commonArgs, tempCookiesFile } = prepareCookieArgs({
      cookies: options.cookies,
      url,
    })
    const args = ['--dump-json', ...commonArgs, url]

    const child = spawn(ytdlpPath, args, {
      cwd: dirname(ytdlpPath) === '.' ? undefined : dirname(ytdlpPath),
    })
    let output = ''
    let errorOutput = ''

    child.stdout?.on('data', (data: Buffer) => {
      output += data.toString()
    })
    child.stderr?.on('data', (data: Buffer) => {
      errorOutput += data.toString()
    })

    child.on('error', (err) => {
      removeTempFile(tempCookiesFile)
      reject(
        new Error(
          contain(err.message, 'ENOENT')
            ? 'yt-dlp not found. Please install yt-dlp and ensure it is on PATH.'
            : err.message,
        ),
      )
    })

    child.on('close', (code) => {
      removeTempFile(tempCookiesFile)
      if (code !== 0) {
        reject(
          new Error(lastNonEmptyLine(errorOutput) || 'Failed to parse video'),
        )
        return
      }

      try {
        const info = JSON.parse(output) as YtDlpRawInfo
        resolvePromise({
          id: info.id || '',
          title: info.title || 'Untitled',
          description: info.description || '',
          thumbnail: info.thumbnail || '',
          duration: info.duration || 0,
          uploader: info.uploader || '',
          webpageUrl: info.webpage_url || url,
          formats: mapFormats(info),
        })
      } catch (e: unknown) {
        reject(
          new Error(
            `Failed to parse response: ${isErr(e) ? e.message : toStr(e)}`,
          ),
        )
      }
    })
  })
}

function runYtDlpDownload(options: {
  ytdlpPath: string
  format: string
  outputTemplate: string
  url: string
  commonArgs: string[]
  taskId: string
  onProgress?: (data: DownloadProgress) => void
  progressOffset: number
  progressSpan: number
}): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const entry = activeDownloads.get(options.taskId)
    if (!entry || entry.cancelled) {
      reject(new Error('Download cancelled'))
      return
    }

    const args = [
      '-f',
      options.format,
      '-o',
      options.outputTemplate,
      '--newline',
      '--encoding',
      'utf-8',
      ...options.commonArgs,
      options.url,
    ]

    const child = spawn(options.ytdlpPath, args, {
      cwd:
        dirname(options.ytdlpPath) === '.'
          ? undefined
          : dirname(options.ytdlpPath),
    })
    entry.child = child

    let downloadedFile = ''
    let lastProgress = -1
    let errorOutput = ''

    const progressPatterns = [
      /\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*(\d+\.?\d*\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+(\d+:\d+)/,
      /\[download\]\s+(\d+\.?\d*)%\s+of\s+(\d+\.?\d*\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+(\d+:\d+)/,
      /\[download\]\s+(\d+\.?\d*)%/,
    ]

    const reportProgress = (
      percent: number,
      extra?: Partial<DownloadProgress>,
    ) => {
      const scaled =
        options.progressOffset + (percent / 100) * options.progressSpan
      if (Math.abs(scaled - lastProgress) < 0.2) return
      lastProgress = scaled
      options.onProgress?.({
        taskId: options.taskId,
        percent: scaled,
        status: 'downloading',
        ...extra,
      })
    }

    child.stdout?.on('data', (data: Buffer) => {
      const line = data.toString()

      for (const pattern of progressPatterns) {
        const match = line.match(pattern)
        if (match) {
          reportProgress(parseFloat(match[1]), {
            totalSize: match[2] || '',
            speed: match[3] || '',
            eta: match[4] || '',
          })
          break
        }
      }

      const destMatch = line.match(/\[download\] Destination: (.+)/)
      if (destMatch) {
        downloadedFile = resolve(trim(destMatch[1]))
      }

      const existsMatch = line.match(
        /\[download\] (.+) has already been downloaded/,
      )
      if (existsMatch) {
        downloadedFile = resolve(trim(existsMatch[1]))
      }
    })

    child.stderr?.on('data', (data: Buffer) => {
      const line = data.toString()
      errorOutput += line
      const percentMatch = line.match(/(\d+\.?\d*)%/)
      if (percentMatch) {
        reportProgress(parseFloat(percentMatch[1]))
      }
    })

    child.on('error', (err) => {
      entry.child = null
      reject(
        new Error(
          contain(err.message, 'ENOENT')
            ? 'yt-dlp not found. Please install yt-dlp and ensure it is on PATH.'
            : err.message,
        ),
      )
    })

    child.on('close', (code) => {
      entry.child = null

      if (entry.cancelled) {
        reject(new Error('Download cancelled'))
        return
      }

      if (code !== 0) {
        const errLine = lastNonEmptyLine(errorOutput)
        if (contain(errLine, '429') || contain(errLine, 'Too Many Requests')) {
          reject(new Error('Too many requests (HTTP 429). Please retry later.'))
        } else {
          reject(new Error(errLine || 'Download failed'))
        }
        return
      }

      if (!downloadedFile) {
        reject(new Error('Download finished but output file was not found'))
        return
      }

      resolvePromise(downloadedFile)
    })
  })
}

export async function downloadVideo(
  options: DownloadOptions,
  onProgress?: (data: DownloadProgress) => void,
): Promise<DownloadResult> {
  const ytdlpPath = resolveYtDlpPath(options.ytDlpPath)
  const status = checkYtDlp(options.ytDlpPath)
  if (!status.available) {
    throw new Error(
      'yt-dlp not found. Please install yt-dlp and ensure it is on PATH.',
    )
  }

  const outputDir = ensureDir(options.outputDir)
  const tempDir = ensureDir(options.tempDir)
  const entry = { child: null as ChildProcess | null, cancelled: false }
  activeDownloads.set(options.taskId, entry)

  const { args: commonArgs, tempCookiesFile } = prepareCookieArgs({
    cookies: options.cookies,
    url: options.url,
  })

  onProgress?.({
    taskId: options.taskId,
    percent: 0,
    status: 'downloading',
  })

  try {
    if (options.hasAudio) {
      const filePath = await runYtDlpDownload({
        ytdlpPath,
        format: options.formatId,
        outputTemplate: join(outputDir, '%(title)s.%(ext)s'),
        url: options.url,
        commonArgs,
        taskId: options.taskId,
        onProgress,
        progressOffset: 0,
        progressSpan: 100,
      })
      onProgress?.({
        taskId: options.taskId,
        percent: 100,
        status: 'completed',
      })
      return { videoPath: filePath, needsMerge: false }
    }

    const videoPath = await runYtDlpDownload({
      ytdlpPath,
      format: options.formatId,
      outputTemplate: join(tempDir, `${options.taskId}.video.%(ext)s`),
      url: options.url,
      commonArgs,
      taskId: options.taskId,
      onProgress,
      progressOffset: 0,
      progressSpan: 55,
    })

    const audioPath = await runYtDlpDownload({
      ytdlpPath,
      format: 'bestaudio[ext=m4a]/bestaudio/best',
      outputTemplate: join(tempDir, `${options.taskId}.audio.%(ext)s`),
      url: options.url,
      commonArgs,
      taskId: options.taskId,
      onProgress,
      progressOffset: 55,
      progressSpan: 40,
    })

    onProgress?.({
      taskId: options.taskId,
      percent: 95,
      status: 'merging',
      message: 'Merging',
    })

    return { videoPath, audioPath, needsMerge: true }
  } finally {
    activeDownloads.delete(options.taskId)
    removeTempFile(tempCookiesFile)
  }
}

export function cancelDownload(taskId: string): boolean {
  const download = activeDownloads.get(taskId)
  if (!download) return false
  download.cancelled = true
  try {
    download.child?.kill()
  } catch {
    // ignore
  }
  return true
}
