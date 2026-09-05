import { createRoot } from 'react-dom/client'
import type { ReactNode } from 'react'

interface PopupWindowOptions {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  x?: number
  y?: number
  alwaysOnTop?: boolean
  resizable?: boolean
  webviewTag?: boolean
  transparent?: boolean
}

/** Same helper as Tinker share/lib/popupWindow (music-player MiniMode). */
export function openPopupWindow(
  options: PopupWindowOptions,
  render: (popup: Window, onClose: () => void) => ReactNode,
): Window | null {
  const {
    width,
    height,
    minWidth,
    minHeight,
    x,
    y,
    alwaysOnTop = true,
    resizable = true,
    webviewTag,
    transparent = false,
  } = options

  const features = [
    `width=${width}`,
    `height=${height}`,
    minWidth != null ? `minWidth=${minWidth}` : '',
    minHeight != null ? `minHeight=${minHeight}` : '',
    `alwaysOnTop=${alwaysOnTop}`,
    `resizable=${resizable ? 'yes' : 'no'}`,
    'frame=no',
    webviewTag ? 'webviewTag=true' : '',
    transparent ? 'transparent=true' : '',
    x != null ? `left=${x}` : '',
    y != null ? `top=${y}` : '',
  ]
    .filter(Boolean)
    .join(',')

  const popup = window.open('', '_blank', features)
  if (!popup) return null

  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    popup.document.head.appendChild(node.cloneNode(true))
  })

  const container = popup.document.createElement('div')
  container.id = 'popup-root'
  popup.document.body.style.margin = '0'
  popup.document.body.style.overflow = 'hidden'
  if (transparent) {
    popup.document.documentElement.style.backgroundColor = 'transparent'
    popup.document.body.style.backgroundColor = 'transparent'
  }
  popup.document.documentElement.className = document.documentElement.className
  popup.document.body.appendChild(container)

  const root = createRoot(container)
  root.render(render(popup, () => popup.close()))

  const unsubscribe = tinker.on('changeTheme', async () => {
    if (popup.closed) return
    const theme = await tinker.getTheme()
    popup.document.documentElement.classList.toggle('dark', theme === 'dark')
  })

  popup.addEventListener('beforeunload', () => {
    root.unmount()
    unsubscribe()
  })

  return popup
}
