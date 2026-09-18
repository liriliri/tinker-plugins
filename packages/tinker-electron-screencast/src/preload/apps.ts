import fs from 'fs'
import path from 'path'
import process from 'process'
import { spawn, type ChildProcess } from 'child_process'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import getPort from 'licia/getPort'
import randomId from 'licia/randomId'
import sleep from 'licia/sleep'
import some from 'licia/some'
import startWith from 'licia/startWith'
import type { AppInfo, PageInfo } from '../common/types'

function isElectronAppMac(appPath: string): boolean {
  return fs.existsSync(
    path.join(appPath, 'Contents/Frameworks/Electron Framework.framework'),
  )
}

function isElectronAppWin(exePath: string): boolean {
  const dir = path.dirname(exePath)
  const resourcesDir = path.join(dir, 'resources')
  if (!fs.existsSync(resourcesDir)) return false
  return some(
    ['electron.asar', 'default_app.asar', 'app.asar', 'app.asar.unpacked'],
    (file) => fs.existsSync(path.join(resourcesDir, file)),
  )
}

function isElectronAppLinux(exePath: string): boolean {
  return (
    fs.existsSync(path.join(exePath, '../resources/electron.asar')) ||
    fs.existsSync(path.join(exePath, '../LICENSE.electron.txt')) ||
    fs.existsSync(path.join(exePath, '../chrome-sandbox'))
  )
}

function isElectronApp(appPathOrExePath: string): boolean {
  const platform = process.platform
  if (platform === 'darwin') return isElectronAppMac(appPathOrExePath)
  if (platform === 'win32') return isElectronAppWin(appPathOrExePath)
  return isElectronAppLinux(appPathOrExePath)
}

export async function listElectronApps(): Promise<AppInfo[]> {
  const all = await tinker.getApps()
  return filter(all, (app) => isElectronApp(app.path))
}

async function getPages(port: number): Promise<PageInfo[]> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`http://127.0.0.1:${port}/json`, {
      signal: controller.signal,
    })
    clearTimeout(timer)
    const pages = (await res.json()) as PageInfo[]
    return filter(
      pages,
      (p) =>
        !!p.webSocketDebuggerUrl &&
        (p.type === 'page' || p.type === 'webview') &&
        !startWith(p.url, 'devtools://'),
    )
  } catch {
    return []
  }
}

interface LaunchedApp {
  sessionId: string
  appPath: string
  appName: string
  nodePort: number
  windowPort: number
  process: ChildProcess
  pages: PageInfo[]
  pollTimer: ReturnType<typeof setInterval> | null
}

const sessions = new Map<string, LaunchedApp>()
const pathToSession = new Map<string, string>()

export function getSession(sessionId: string) {
  return sessions.get(sessionId)
}

function getSessionByPath(appPath: string) {
  const id = pathToSession.get(appPath)
  return id ? sessions.get(id) : undefined
}

export function listSessions() {
  return [...sessions.values()]
}

function isProcessAlive(child: ChildProcess) {
  return !child.killed && child.exitCode === null && child.signalCode === null
}

export async function launchElectronApp(
  app: AppInfo,
  onClose: (sessionId: string, pages: PageInfo[]) => void,
): Promise<{ session: LaunchedApp; reused: boolean }> {
  const existing = getSessionByPath(app.path)
  if (existing && isProcessAlive(existing.process)) {
    existing.pages = await getPages(existing.windowPort)
    return { session: existing, reused: true }
  }
  if (existing) {
    cleanupSession(existing.sessionId)
  }

  const [nodePort, windowPort] = await Promise.all([
    getPort(0, '127.0.0.1'),
    getPort(0, '127.0.0.1'),
  ])

  let exePath = app.path
  if (process.platform === 'darwin') {
    const macosDir = path.join(app.path, 'Contents/MacOS')
    if (fs.existsSync(macosDir)) {
      const files = fs.readdirSync(macosDir)
      if (files[0]) exePath = path.join(macosDir, files[0])
    }
  }

  const cwd = process.platform === 'win32' ? path.dirname(exePath) : '/'
  const sessionId = randomId(10)
  const child = spawn(
    exePath,
    [
      `--inspect=${nodePort}`,
      `--remote-debugging-port=${windowPort}`,
      '--remote-allow-origins=devtools://devtools',
    ],
    { cwd },
  )

  const session: LaunchedApp = {
    sessionId,
    appPath: app.path,
    appName: app.name,
    nodePort,
    windowPort,
    process: child,
    pages: [],
    pollTimer: null,
  }

  child.on('close', () => {
    const pages = session.pages
    cleanupSession(sessionId)
    onClose(sessionId, pages)
  })

  sessions.set(sessionId, session)
  pathToSession.set(app.path, sessionId)

  const poll = async () => {
    const pages = await getPages(windowPort)
    const current = sessions.get(sessionId)
    if (current) current.pages = pages
  }
  session.pollTimer = setInterval(poll, 1500)
  await poll()

  return { session, reused: false }
}

function cleanupSession(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return
  if (session.pollTimer) {
    clearInterval(session.pollTimer)
    session.pollTimer = null
  }
  pathToSession.delete(session.appPath)
  sessions.delete(sessionId)
}

export function stopElectronApp(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return
  try {
    session.process.kill()
  } catch {
    // ignore
  }
  cleanupSession(sessionId)
}

export function stopAllElectronApps() {
  each([...sessions.keys()], (id) => stopElectronApp(id))
}

export async function waitForPages(
  sessionId: string,
  timeoutMs = 20000,
): Promise<PageInfo[]> {
  const start = Date.now()
  let stableSince = 0
  let lastCount = -1
  while (Date.now() - start < timeoutMs) {
    const session = sessions.get(sessionId)
    if (!session) return []
    const count = session.pages.length
    if (count > 0) {
      if (count === lastCount) {
        if (!stableSince) stableSince = Date.now()
        if (Date.now() - stableSince >= 1500) {
          return session.pages
        }
      } else {
        stableSince = 0
        lastCount = count
      }
    }
    await sleep(400)
  }
  return sessions.get(sessionId)?.pages || []
}

function findPageEntry(pageId: string): {
  session: LaunchedApp
  page: PageInfo
} | null {
  for (const session of sessions.values()) {
    const page = find(session.pages, (p) => p.id === pageId)
    if (page) return { session, page }
  }
  return null
}

export function findPage(pageId: string): PageInfo | null {
  return findPageEntry(pageId)?.page ?? null
}

export function findSessionByPageId(pageId: string): LaunchedApp | null {
  return findPageEntry(pageId)?.session ?? null
}
