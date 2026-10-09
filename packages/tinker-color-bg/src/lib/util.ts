import base64 from 'licia/base64'
import clamp from 'licia/clamp'
import dataUrl from 'licia/dataUrl'
import extend from 'licia/extend'
import now from 'licia/now'
import toInt from 'licia/toInt'
import { createBg, destroyBg, waitFrames } from './backgrounds'
import type { BgConfig } from '../types'

export function toPositiveInt(value: number) {
  return clamp(toInt(value) || 1, 1, Number.MAX_SAFE_INTEGER)
}

function dataUrlToBytes(url: string): Uint8Array {
  const parsed = dataUrl.parse(url)
  if (!parsed || !parsed.base64) {
    throw new Error('Invalid image data')
  }
  return new Uint8Array(base64.decode(parsed.data))
}

async function renderToPngDataUrl(
  config: BgConfig,
  width: number,
  height: number,
): Promise<string> {
  const container = document.createElement('div')
  const id = `color-bg-export-${now()}`
  container.id = id
  container.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    `width:${width}px`,
    `height:${height}px`,
    'overflow:hidden',
    'pointer-events:none',
  ].join(';')
  document.body.appendChild(container)

  const bg = createBg(id, extend({}, config, { loop: false }))
  await waitFrames(3)

  const canvas = bg.gl.canvas
  const url = canvas.toDataURL('image/png')
  destroyBg(bg)
  container.remove()

  return url
}

export async function exportPng(
  config: BgConfig,
  width: number,
  height: number,
) {
  const filename = `color-bg-${config.style}.png`

  if (typeof tinker !== 'undefined') {
    const { filePath, canceled } = await tinker.showSaveDialog({
      defaultPath: filename,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    })
    if (canceled || !filePath) return false
    await tinker.writeFile(
      filePath,
      dataUrlToBytes(await renderToPngDataUrl(config, width, height)),
    )
    return true
  }

  const el = document.createElement('a')
  el.href = await renderToPngDataUrl(config, width, height)
  el.download = filename
  el.click()
  return true
}
