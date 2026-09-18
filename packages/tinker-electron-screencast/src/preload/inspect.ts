import { CdpClient } from './cdp'

interface InspectorTarget {
  type?: string
  webSocketDebuggerUrl?: string
}

async function getMainInspectorUrl(nodePort: number): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2000)
  try {
    const res = await fetch(`http://127.0.0.1:${nodePort}/json`, {
      signal: controller.signal,
    })
    const targets = (await res.json()) as InspectorTarget[]
    const target =
      targets.find((t) => t.webSocketDebuggerUrl && t.type === 'node') ||
      targets.find((t) => t.webSocketDebuggerUrl)
    return target?.webSocketDebuggerUrl || null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function evaluateInMain(
  nodePort: number,
  expression: string,
): Promise<unknown> {
  const wsUrl = await getMainInspectorUrl(nodePort)
  if (!wsUrl) {
    throw new Error(`Main inspector not available on port ${nodePort}`)
  }

  const cdp = new CdpClient(wsUrl, () => {}, null)
  try {
    await cdp.connect()
    try {
      await cdp.send('Runtime.enable')
    } catch {
      // ignore
    }
    const result = (await cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })) as {
      result?: { value?: unknown }
      exceptionDetails?: { text?: string; exception?: { description?: string } }
    }
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text ||
          'Main process evaluate failed',
      )
    }
    return result.result?.value ?? null
  } finally {
    cdp.close()
  }
}

const ACTIVATE_MAIN = `(() => {
  let electron
  try {
    electron = require('electron')
  } catch (_) {
    try {
      electron = process.mainModule.require('electron')
    } catch (_) {
      return false
    }
  }
  const { BrowserWindow, app } = electron
  try {
    if (typeof app.focus === 'function') {
      try {
        app.focus({ steal: true })
      } catch (_) {
        app.focus()
      }
    }
  } catch (_) {}
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (win.isDestroyed()) continue
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }
  return windows.length > 0
})()`

export async function activateMainWindows(nodePort: number) {
  return evaluateInMain(nodePort, ACTIVATE_MAIN)
}
