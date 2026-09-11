import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'
import { WebSocketServer } from 'ws'
import contain from 'licia/contain'
import find from 'licia/find'
import getPort from 'licia/getPort'
import map from 'licia/map'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import type { PageInfo, ServerConfig, ServerStatus } from '../common/types'
import { checkRequestAuth, resolveAuth, type HttpAuth } from './auth'
import {
  getSession,
  launchElectronApp,
  listElectronApps,
  listSessions,
  stopAllElectronApps,
  stopElectronApp,
  waitForPages,
} from './apps'
import { addLog } from './logger'
import {
  disposeAllPageSessions,
  disposePageSession,
  handleScreencastUpgrade,
} from './screencast'
import { errorMessage } from './util'

interface ServerState {
  config: ServerConfig
  host: string
  port: number
  server: http.Server
  wss: WebSocketServer
  auth?: HttpAuth
}

let state: ServerState | null = null

function displayHost(host: string) {
  return host === '0.0.0.0' ? '127.0.0.1' : host
}

function getLanAddresses(): string[] {
  const result: string[] = []
  const ifaces = os.networkInterfaces()
  for (const entries of Object.values(ifaces)) {
    if (!entries) continue
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        result.push(entry.address)
      }
    }
  }
  return result
}

function getHttpRoot() {
  return path.join(__dirname, '../http')
}

function pathnameOf(url: string) {
  return (url || '/').split('?')[0]
}

function clientLabel(req: http.IncomingMessage) {
  const ip =
    trim((req.headers['x-forwarded-for'] as string)?.split(',')[0] || '') ||
    req.socket.remoteAddress ||
    'unknown'
  return ip
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  const raw = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Content-Length': Buffer.byteLength(raw),
  })
  res.end(raw)
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function contentTypeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.ico') return 'image/x-icon'
  if (ext === '.woff') return 'font/woff'
  if (ext === '.woff2') return 'font/woff2'
  return 'application/octet-stream'
}

function serveStatic(res: http.ServerResponse, filePath: string) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404).end('Not Found')
    return
  }
  const data = fs.readFileSync(filePath)
  res.writeHead(200, {
    'Content-Type': contentTypeFor(filePath),
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

const PUBLIC_PATHS = ['/', '/index.html', '/api/auth']

function isPublicPath(pathname: string) {
  return (
    contain(PUBLIC_PATHS, pathname) ||
    startWith(pathname, '/assets/') ||
    pathname === '/favicon.ico'
  )
}

function serializePages(pages: PageInfo[]) {
  return map(pages, (p) => ({
    id: p.id,
    title: p.title,
    url: p.url,
    type: p.type,
  }))
}

async function handleApi(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string,
  auth: HttpAuth | undefined,
) {
  if (pathname === '/api/auth' && req.method === 'GET') {
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
    sendJson(res, 200, { required: !!auth, language, theme })
    return
  }

  if (pathname === '/api/icon' && req.method === 'GET') {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const iconPath = url.searchParams.get('path') || ''
    if (!iconPath || !fs.existsSync(iconPath)) {
      res.writeHead(404).end('Not Found')
      return
    }
    serveStatic(res, iconPath)
    return
  }

  if (auth && !checkRequestAuth(req, auth)) {
    sendJson(res, 401, { error: 'Unauthorized' })
    return
  }

  if (pathname === '/api/apps' && req.method === 'GET') {
    const apps = await listElectronApps()
    const activePaths = new Set(map(listSessions(), (s) => s.appPath))
    sendJson(
      res,
      200,
      map(apps, (app) => ({
        name: app.name,
        path: app.path,
        icon: `/api/icon?path=${encodeURIComponent(app.icon)}`,
        running: activePaths.has(app.path),
      })),
    )
    return
  }

  if (pathname === '/api/sessions' && req.method === 'GET') {
    sendJson(
      res,
      200,
      map(listSessions(), (s) => ({
        sessionId: s.sessionId,
        appName: s.appName,
        appPath: s.appPath,
        pages: serializePages(s.pages),
      })),
    )
    return
  }

  if (pathname === '/api/launch' && req.method === 'POST') {
    const raw = await readBody(req)
    let body: { path?: string }
    try {
      body = JSON.parse(raw)
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' })
      return
    }
    const appPath = body.path
    if (!appPath) {
      sendJson(res, 400, { error: 'path is required' })
      return
    }
    const apps = await listElectronApps()
    const app = find(apps, (item) => item.path === appPath)
    if (!app) {
      sendJson(res, 404, { error: 'App not found' })
      return
    }

    addLog(`Launch request from ${clientLabel(req)}: ${app.name}`)
    const { session, reused } = await launchElectronApp(
      app,
      (sessionId, pages) => {
        addLog(`App closed: ${app.name} (${sessionId})`)
        for (const page of pages) {
          disposePageSession(page.id)
        }
      },
    )
    const pages = reused ? session.pages : await waitForPages(session.sessionId)
    addLog(
      reused
        ? `Reuse session: ${app.name} — ${pages.length} page(s) (${session.sessionId})`
        : `App launched: ${app.name} — ${pages.length} page(s) (${session.sessionId})`,
    )
    sendJson(res, 200, {
      sessionId: session.sessionId,
      appName: session.appName,
      reused,
      pages: serializePages(pages),
      pageId: pages[0]?.id || null,
    })
    return
  }

  const stopMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/stop$/)
  if (stopMatch && req.method === 'POST') {
    const sessionId = decodeURIComponent(stopMatch[1])
    const session = getSession(sessionId)
    if (!session) {
      sendJson(res, 404, { error: 'Session not found' })
      return
    }
    addLog(`Stop request from ${clientLabel(req)}: ${session.appName}`)
    for (const page of session.pages) {
      disposePageSession(page.id)
    }
    stopElectronApp(sessionId)
    sendJson(res, 200, { ok: true })
    return
  }

  const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/)
  if (sessionMatch && req.method === 'GET') {
    const sessionId = decodeURIComponent(sessionMatch[1])
    const session = getSession(sessionId)
    if (!session) {
      sendJson(res, 404, { error: 'Session not found' })
      return
    }
    sendJson(res, 200, {
      sessionId: session.sessionId,
      appName: session.appName,
      appPath: session.appPath,
      pages: serializePages(session.pages),
    })
    return
  }

  sendJson(res, 404, { error: 'Not Found' })
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  auth: HttpAuth | undefined,
) {
  const pathname = pathnameOf(req.url || '/')

  if (startWith(pathname, '/api/')) {
    try {
      await handleApi(req, res, pathname, auth)
    } catch (err: unknown) {
      const message = errorMessage(err)
      addLog(`API error: ${message}`, 'error')
      sendJson(res, 500, { error: message })
    }
    return
  }

  if (auth && !isPublicPath(pathname) && !checkRequestAuth(req, auth)) {
    // Allow static assets without auth so login UI can load; protect SPA
    // deep links by serving index (login handled in client).
    if (req.method === 'GET' && !startWith(pathname, '/api/')) {
      serveSpa(res)
      return
    }
    sendJson(res, 401, { error: 'Unauthorized' })
    return
  }

  if (
    pathname === '/' ||
    pathname === '/index.html' ||
    startWith(pathname, '/s/') ||
    startWith(pathname, '/a/')
  ) {
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

  const host = config.host || '0.0.0.0'
  const preferredPort = config.port || 9223
  const port = await getPort(preferredPort, host)
  if (preferredPort && port !== preferredPort) {
    throw new Error(`Port ${preferredPort} is already in use`)
  }

  const auth = resolveAuth(config.username, config.password)
  const wss = new WebSocketServer({ noServer: true })
  const server = http.createServer((req, res) => {
    void handleRequest(req, res, auth)
  })

  server.on('upgrade', (req, socket, head) => {
    const pathname = pathnameOf(req.url || '/')
    const match = pathname.match(/^\/ws\/([^/]+)\/?$/)
    if (!match) {
      socket.destroy()
      return
    }

    if (auth && !checkRequestAuth(req, auth)) {
      socket.write(
        'HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n',
      )
      socket.destroy()
      return
    }

    const pageId = decodeURIComponent(match[1])
    wss.handleUpgrade(req, socket, head, (ws) => {
      void handleScreencastUpgrade(pageId, ws, clientLabel(req))
    })
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.once('listening', () => resolve())
    server.listen(port, host)
  })

  state = { config, host, port, server, wss, auth }
  const status = getServerStatus()
  addLog(`Server started at ${status.url}${auth ? ' (auth enabled)' : ''}`)
  for (const url of status.lanUrls) {
    if (url !== status.url) addLog(`LAN: ${url}`)
  }
  return status
}

export async function stopServer() {
  disposeAllPageSessions()
  stopAllElectronApps()
  if (!state) return
  const current = state
  state = null
  await new Promise<void>((resolve) => {
    current.wss.close()
    current.server.close(() => resolve())
  })
  addLog('Server stopped')
}

export function getServerStatus(): ServerStatus {
  if (!state) {
    return {
      running: false,
      host: '',
      port: 0,
      url: '',
      lanUrls: [],
      authRequired: false,
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
    authRequired: !!state.auth,
  }
}
