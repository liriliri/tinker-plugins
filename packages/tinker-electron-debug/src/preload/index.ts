import { contextBridge } from 'electron'
import fs from 'fs'
import path from 'path'
import process from 'process'
import { spawn } from 'child_process'
import got from 'got'
import getPort from 'licia/getPort'
import WebSocket from 'ws'

function isElectronAppMac(appPath: string): boolean {
  return fs.existsSync(
    path.join(appPath, 'Contents/Frameworks/Electron Framework.framework'),
  )
}

function isElectronAppWin(exePath: string): boolean {
  const dir = path.dirname(exePath)
  const resourcesDir = path.join(dir, 'resources')
  if (!fs.existsSync(resourcesDir)) return false
  return [
    'electron.asar',
    'default_app.asar',
    'app.asar',
    'app.asar.unpacked',
  ].some((file) => fs.existsSync(path.join(resourcesDir, file)))
}

function isElectronAppLinux(exePath: string): boolean {
  return (
    fs.existsSync(path.join(exePath, '../resources/electron.asar')) ||
    fs.existsSync(path.join(exePath, '../LICENSE.electron.txt')) ||
    fs.existsSync(path.join(exePath, '../chrome-sandbox'))
  )
}

interface Session {
  nodePort: number
  windowPort: number
  kill: () => void
}

const sessions = new Map<string, Session>()

function sendDevToolsCommand(
  wsUrl: string,
  method: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, {
      headers: { Origin: 'devtools://devtools' },
    })
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method, params }))
    })
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.id === 1) {
          ws.close()
          resolve(msg)
        }
      } catch {
        // ignore non-json messages
      }
    })
    ws.on('error', reject)
    setTimeout(() => {
      ws.terminate()
      reject(new Error('timeout'))
    }, 5000)
  })
}

const electronDebugObj = {
  isElectronApp: (appPathOrExePath: string): boolean => {
    const platform = process.platform
    if (platform === 'darwin') {
      return isElectronAppMac(appPathOrExePath)
    } else if (platform === 'win32') {
      return isElectronAppWin(appPathOrExePath)
    } else {
      return isElectronAppLinux(appPathOrExePath)
    }
  },

  launchApp: async (
    sessionId: string,
    appPath: string,
    onLog: (chunk: string) => void,
    onClose: () => void,
  ): Promise<{ nodePort: number; windowPort: number }> => {
    const [nodePort, windowPort] = await Promise.all([
      getPort(0, '127.0.0.1'),
      getPort(0, '127.0.0.1'),
    ])

    let exePath = appPath
    if (process.platform === 'darwin') {
      const macosDir = path.join(appPath, 'Contents/MacOS')
      if (fs.existsSync(macosDir)) {
        const files = fs.readdirSync(macosDir)
        if (files[0]) exePath = path.join(macosDir, files[0])
      }
    }

    const cwd = process.platform === 'win32' ? path.dirname(exePath) : '/'
    const sp = spawn(
      exePath,
      [
        `--inspect=${nodePort}`,
        `--remote-debugging-port=${windowPort}`,
        '--remote-allow-origins=devtools://devtools',
      ],
      { cwd },
    )

    const handleData = (chunk: Buffer) => onLog(chunk.toString())
    sp.stdout?.on('data', handleData)
    sp.stderr?.on('data', handleData)
    sp.on('close', () => {
      sessions.delete(sessionId)
      onClose()
    })

    sessions.set(sessionId, { nodePort, windowPort, kill: () => sp.kill() })

    return { nodePort, windowPort }
  },

  stopApp: (sessionId: string): void => {
    sessions.get(sessionId)?.kill()
    sessions.delete(sessionId)
  },

  getPages: async (port: number): Promise<unknown[]> => {
    try {
      return await got(`http://127.0.0.1:${port}/json`, {
        timeout: { request: 2000 },
      }).json()
    } catch {
      return []
    }
  },

  openDevTools: async (
    nodePort: number,
    devtoolsFrontendUrl: string,
  ): Promise<void> => {
    const pages: Array<{ webSocketDebuggerUrl: string }> = await got(
      `http://127.0.0.1:${nodePort}/json`,
      { timeout: { request: 2000 } },
    ).json()

    const nodeTarget = pages[0]
    if (!nodeTarget?.webSocketDebuggerUrl) {
      throw new Error('No node target found')
    }

    const devtoolsUrl = devtoolsFrontendUrl
      .replace(/^\/devtools/, 'devtools://devtools/bundled')
      .replace(/^chrome-devtools:\/\//, 'devtools://')

    const code = `
      (function() {
        const { BrowserWindow } = process.mainModule.require('electron');
        const win = new BrowserWindow({
          width: 1280,
          height: 800,
          webPreferences: { nodeIntegration: false }
        });
        win.loadURL(${JSON.stringify(devtoolsUrl)});
        win.show();
      })()
    `

    const result = (await sendDevToolsCommand(
      nodeTarget.webSocketDebuggerUrl,
      'Runtime.evaluate',
      { expression: code, awaitPromise: false },
    )) as { exceptionDetails?: { exception?: { description?: string }; text: string } }
    if (result?.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text,
      )
    }
  },
}

contextBridge.exposeInMainWorld('electronDebug', electronDebugObj)

declare global {
  const electronDebug: typeof electronDebugObj
}
