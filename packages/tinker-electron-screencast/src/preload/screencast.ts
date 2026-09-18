import { WebSocket } from 'ws'
import clamp from 'licia/clamp'
import defaults from 'licia/defaults'
import each from 'licia/each'
import isStr from 'licia/isStr'
import toBool from 'licia/toBool'
import toNum from 'licia/toNum'
import { CdpClient } from './cdp'
import { findPage, findSessionByPageId } from './apps'
import { activateMainWindows } from './inspect'
import { addLog } from './logger'
import { errorMessage } from './util'

interface PageSession {
  pageId: string
  url: string
  cdp: CdpClient
  clients: Set<WebSocket>
  screencastOn: boolean
  touchMode: boolean
  cdpVisible: boolean
}

const pageSessions = new Map<string, PageSession>()

function broadcast(session: PageSession, payload: unknown) {
  const raw = JSON.stringify(payload)
  each([...session.clients], (client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw)
    }
  })
}

function broadcastVisibility(session: PageSession) {
  broadcast(session, {
    type: 'visibility',
    visible: session.cdpVisible,
  })
}

function broadcastPageInfo(session: PageSession, client?: WebSocket) {
  const payload = { type: 'page', url: session.url }
  if (client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload))
    }
    return
  }
  broadcast(session, payload)
}

async function stopScreencast(session: PageSession) {
  if (!session.screencastOn) return
  session.screencastOn = false
  try {
    if (session.cdp.connected) {
      await session.cdp.send('Page.stopScreencast')
    }
  } catch {
    // ignore
  }
}

async function startScreencast(
  session: PageSession,
  width?: number,
  height?: number,
) {
  const w = Math.floor(clamp(width || 1280, 1, 2048))
  const h = Math.floor(clamp(height || 800, 1, 2048))
  await stopScreencast(session)
  await session.cdp.send('Page.enable')
  await session.cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 80,
    maxWidth: w,
    maxHeight: h,
    everyNthFrame: 1,
  })
  session.screencastOn = true
}

async function setTouchMode(session: PageSession, enabled: boolean) {
  if (session.touchMode === enabled) return
  if (!session.cdp.connected) return
  await session.cdp.send('Emulation.setTouchEmulationEnabled', {
    enabled,
    maxTouchPoints: 1,
  })
  await session.cdp.send('Emulation.setEmitTouchEventsForMouse', {
    enabled,
    configuration: 'mobile',
  })
  session.touchMode = enabled
}

async function evaluate(session: PageSession, expression: string) {
  if (!session.cdp.connected) return null
  const result = (await session.cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  })) as { result?: { value?: unknown } }
  return result?.result?.value ?? null
}

async function getFocusedInputText(session: PageSession) {
  return evaluate(
    session,
    `(() => {
      const el = document.activeElement
      if (!el) return null
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (el.type === 'password') return ''
        return el.value
      }
      if (el.isContentEditable) return el.innerText
      return null
    })()`,
  )
}

async function setFocusedInputText(session: PageSession, text: string) {
  const value = JSON.stringify(text)
  return evaluate(
    session,
    `((text) => {
      const el = document.activeElement
      if (!el) return false
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const proto =
          el instanceof HTMLInputElement
            ? HTMLInputElement.prototype
            : HTMLTextAreaElement.prototype
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
        if (setter) setter.call(el, text)
        else el.value = text
        el.dispatchEvent(new Event('input', { bubbles: true }))
        return true
      }
      if (el.isContentEditable) {
        el.textContent = text
        el.dispatchEvent(new Event('input', { bubbles: true }))
        return true
      }
      return false
    })(${value})`,
  )
}

async function activatePage(session: PageSession) {
  const app = findSessionByPageId(session.pageId)
  if (!app) {
    throw new Error('Session not found for page')
  }
  const ok = await activateMainWindows(app.nodePort)
  if (!ok) {
    throw new Error('No BrowserWindow found in main process')
  }
  addLog(`Activated main windows for page ${session.pageId}`)
}

export function disposePageSession(pageId: string) {
  const session = pageSessions.get(pageId)
  if (!session) return
  pageSessions.delete(pageId)

  for (const client of session.clients) {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'closed' }))
      }
      client.close()
    } catch {
      // ignore
    }
  }
  session.clients.clear()
  void stopScreencast(session).finally(() => {
    session.cdp.close()
  })
}

export function disposeAllPageSessions() {
  each([...pageSessions.keys()], (id) => {
    disposePageSession(id)
  })
}

async function ensurePageSession(pageId: string): Promise<PageSession> {
  const existing = pageSessions.get(pageId)
  if (existing?.cdp.connected) return existing
  if (existing) disposePageSession(pageId)

  const page = findPage(pageId)
  if (!page?.webSocketDebuggerUrl) {
    throw new Error(`Page not found: ${pageId}`)
  }

  const clients = new Set<WebSocket>()
  let session!: PageSession

  const cdp = new CdpClient(page.webSocketDebuggerUrl, (method, params) => {
    if (method === 'Page.screencastFrame') {
      const frame = params as {
        data: string
        metadata: unknown
        sessionId: number
      }
      void cdp
        .send('Page.screencastFrameAck', { sessionId: frame.sessionId })
        .catch(() => {})
      broadcast(session, {
        type: 'frame',
        data: frame.data,
        metadata: frame.metadata,
      })
      return
    }

    if (method === 'Page.screencastVisibilityChanged') {
      const { visible } = params as { visible: boolean }
      session.cdpVisible = toBool(visible)
      broadcastVisibility(session)
      return
    }

    if (method === 'Page.frameNavigated') {
      const frame = params as {
        frame?: { url?: string; name?: string; parentId?: string }
      }
      if (frame.frame?.parentId) return
      if (frame.frame?.url) {
        session.url = frame.frame.url
        broadcastPageInfo(session)
      }
    }
  })

  await cdp.connect()
  session = {
    pageId,
    url: page.url || '',
    cdp,
    clients,
    screencastOn: false,
    touchMode: false,
    cdpVisible: true,
  }
  pageSessions.set(pageId, session)
  try {
    await cdp.send('Page.enable')
  } catch {
    // ignore
  }
  return session
}

async function handleClientMessage(
  session: PageSession,
  raw: string,
  ws: WebSocket,
) {
  let msg: {
    type?: string
    width?: number
    height?: number
    enabled?: boolean
    eventType?: string
    x?: number
    y?: number
    button?: string
    buttons?: number
    clickCount?: number
    modifiers?: number
    deltaX?: number
    deltaY?: number
    key?: string
    code?: string
    text?: string
    keyCode?: number
    autoRepeat?: boolean
    location?: number
  }
  try {
    msg = JSON.parse(raw)
  } catch {
    return
  }

  if (!msg.type) return

  if (msg.type === 'resize') {
    await startScreencast(session, msg.width, msg.height)
    return
  }

  if (msg.type === 'touchMode') {
    await setTouchMode(session, toBool(msg.enabled))
    return
  }

  if (msg.type === 'activate') {
    await activatePage(session)
    return
  }

  if (!session.cdpVisible) return

  if (msg.type === 'getInputText') {
    const text = await getFocusedInputText(session)
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'inputText', text }))
    }
    return
  }

  if (msg.type === 'setInputText') {
    if (!isStr(msg.text)) return
    await setFocusedInputText(session, msg.text)
    return
  }

  if (msg.type === 'mouse') {
    const typeMap: Record<string, string> = {
      mousedown: 'mousePressed',
      mouseup: 'mouseReleased',
      mousemove: 'mouseMoved',
      wheel: 'mouseWheel',
    }
    const type = typeMap[msg.eventType || '']
    if (!type) return
    const params = defaults(
      {
        type,
        x: Math.round(toNum(msg.x) || 0),
        y: Math.round(toNum(msg.y) || 0),
        modifiers: msg.modifiers,
        button: msg.button,
        buttons: msg.buttons,
        clickCount: msg.clickCount,
      },
      {
        modifiers: 0,
        button: 'none',
        buttons: 0,
        clickCount: 0,
      },
    ) as Record<string, unknown>
    if (type === 'mouseWheel') {
      params.deltaX = toNum(msg.deltaX) || 0
      params.deltaY = toNum(msg.deltaY) || 0
    }
    await session.cdp.send('Input.dispatchMouseEvent', params)
    return
  }

  if (msg.type === 'insertText') {
    if (!isStr(msg.text) || !msg.text) return
    await session.cdp.send('Input.insertText', { text: msg.text })
    return
  }

  if (msg.type === 'key') {
    const typeMap: Record<string, string> = {
      keydown: 'keyDown',
      keyup: 'keyUp',
      keypress: 'char',
      char: 'char',
    }
    const type = typeMap[msg.eventType || '']
    if (!type) return
    const text =
      type === 'char'
        ? msg.text || (msg.key && msg.key.length === 1 ? msg.key : undefined)
        : undefined
    await session.cdp.send('Input.dispatchKeyEvent', {
      type,
      modifiers: toNum(msg.modifiers) || 0,
      text,
      unmodifiedText: text ? text.toLowerCase() : undefined,
      code: msg.code,
      key: msg.key,
      windowsVirtualKeyCode: msg.keyCode,
      nativeVirtualKeyCode: msg.keyCode,
      autoRepeat: toBool(msg.autoRepeat),
      location: toNum(msg.location) || 0,
    })
  }
}

export async function handleScreencastUpgrade(
  pageId: string,
  ws: WebSocket,
  clientLabel: string,
) {
  let session: PageSession
  try {
    session = await ensurePageSession(pageId)
  } catch (err: unknown) {
    const message = errorMessage(err)
    addLog(`Screencast attach failed (${clientLabel}): ${message}`, 'error')
    ws.send(JSON.stringify({ type: 'error', message }))
    ws.close()
    return
  }

  session.clients.add(ws)
  addLog(`Screencast connected: ${clientLabel} → page ${pageId}`)
  broadcastPageInfo(session, ws)
  broadcastVisibility(session)

  // Start with a default viewport so the first frames arrive before
  // the client measures its canvas and sends resize.
  if (!session.screencastOn) {
    void startScreencast(session).catch((err: unknown) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: errorMessage(err),
          }),
        )
      }
    })
  }

  ws.on('message', (raw) => {
    void handleClientMessage(session, raw.toString(), ws).catch(
      (err: unknown) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: errorMessage(err),
            }),
          )
        }
      },
    )
  })

  ws.on('close', () => {
    session.clients.delete(ws)
    addLog(`Screencast disconnected: ${clientLabel} → page ${pageId}`)
    if (session.clients.size === 0) {
      disposePageSession(pageId)
    }
  })
}
