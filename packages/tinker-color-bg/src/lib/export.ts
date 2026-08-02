import base64 from 'licia/base64'
import dataUrl from 'licia/dataUrl'
import now from 'licia/now'
import extend from 'licia/extend'
import { createBg, destroyBg, waitFrames } from './backgrounds'
import type { BgConfig } from '../types'

function dataUrlToBytes(url: string): Uint8Array {
  const parsed = dataUrl.parse(url)
  if (!parsed || !parsed.base64) {
    throw new Error('Invalid image data')
  }
  return new Uint8Array(base64.decode(parsed.data))
}

async function renderToPng(
  config: BgConfig,
  width: number,
  height: number,
): Promise<Uint8Array> {
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

  return dataUrlToBytes(url)
}

export async function exportPng(
  config: BgConfig,
  width: number,
  height: number,
) {
  const { filePath, canceled } = await tinker.showSaveDialog({
    defaultPath: `color-bg-${config.style}.png`,
    filters: [{ name: 'PNG Image', extensions: ['png'] }],
  })
  if (canceled || !filePath) return false

  const bytes = await renderToPng(config, width, height)
  await tinker.writeFile(filePath, bytes)
  return true
}
