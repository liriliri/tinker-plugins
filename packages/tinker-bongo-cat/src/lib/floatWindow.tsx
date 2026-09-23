import { openPopupWindow } from './popupWindow'
import { getFloatWindowSize } from './keymap'
import FloatCatWindow from '../components/FloatCatWindow'

export type FloatPosition = { x: number; y: number }

let floatWindow: Window | null = null
const intentionalCloses = new WeakSet<Window>()
let onClosed: (() => void) | null = null
let onPosition: ((position: FloatPosition) => void) | null = null

function hasLiveWindow() {
  return Boolean(floatWindow && !floatWindow.closed)
}

function getDefaultPosition(size: { width: number; height: number }) {
  const screen = window.screen as Screen & {
    availLeft?: number
    availTop?: number
  }
  const left = screen.availLeft || 0
  const top = screen.availTop || 0
  return {
    x: Math.round(left + window.screen.availWidth - size.width - 48),
    y: Math.round(top + window.screen.availHeight - size.height - 48),
  }
}

function readPosition(win: Window): FloatPosition {
  return {
    x: Math.round(win.screenX),
    y: Math.round(win.screenY),
  }
}

function clearRefs(closed: Window) {
  if (floatWindow === closed || floatWindow?.closed) {
    floatWindow = null
  }
}

export function setFloatWindowClosedListener(handler: (() => void) | null) {
  onClosed = handler
}

export function setFloatWindowPositionListener(
  handler: ((position: FloatPosition) => void) | null,
) {
  onPosition = handler
}

export function readFloatWindowPosition(): FloatPosition | null {
  if (!hasLiveWindow() || !floatWindow) return null
  return readPosition(floatWindow)
}

export function closeFloatWindow() {
  if (!hasLiveWindow() || !floatWindow) {
    floatWindow = null
    return
  }
  const closing = floatWindow
  intentionalCloses.add(closing)
  closing.close()
  clearRefs(closing)
}

export function resizeFloatWindow(scale: number) {
  if (!hasLiveWindow() || !floatWindow) return
  const size = getFloatWindowSize(scale)
  floatWindow.resizeTo(size.width, size.height)
}

export function openFloatWindow(
  scale: number,
  savedPosition?: FloatPosition | null,
) {
  if (hasLiveWindow()) {
    resizeFloatWindow(scale)
    return floatWindow
  }

  const size = getFloatWindowSize(scale)
  const position = savedPosition ?? getDefaultPosition(size)

  const created = openPopupWindow(
    {
      width: size.width,
      height: size.height,
      x: position.x,
      y: position.y,
      alwaysOnTop: true,
      resizable: false,
      transparent: true,
    },
    (popup) => <FloatCatWindow popup={popup} />,
  )

  if (!created || created.closed) return null

  created.addEventListener('beforeunload', () => {
    if (!created.closed) {
      onPosition?.(readPosition(created))
    }
    if (intentionalCloses.has(created)) {
      intentionalCloses.delete(created)
    } else {
      onClosed?.()
    }
    clearRefs(created)
  })

  floatWindow = created
  return created
}
