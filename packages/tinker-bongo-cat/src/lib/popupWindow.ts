import { createRoot } from 'react-dom/client'
import type { ReactNode } from 'react'
import compact from 'licia/compact'
import each from 'licia/each'

interface PopupWindowOptions {
  width: number
  height: number
  x?: number
  y?: number
  alwaysOnTop?: boolean
  resizable?: boolean
  transparent?: boolean
}

/** Same pattern as tinker-live2d / Tinker share popupWindow. */
export function openPopupWindow(
  options: PopupWindowOptions,
  render: (popup: Window, onClose: () => void) => ReactNode,
): Window | null {
  const {
    width,
    height,
    x,
    y,
    alwaysOnTop = true,
    resizable = false,
    transparent = true,
  } = options

  const features = compact([
    `width=${width}`,
    `height=${height}`,
    `alwaysOnTop=${alwaysOnTop}`,
    `resizable=${resizable ? 'yes' : 'no'}`,
    'frame=no',
    transparent ? 'transparent=true' : '',
    x != null ? `left=${x}` : '',
    y != null ? `top=${y}` : '',
  ]).join(',')

  const popup = window.open('', '_blank', features)
  if (!popup) return null

  each(document.querySelectorAll('style, link[rel="stylesheet"]'), (node) => {
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
