import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    open: openSvg,
    get,
    set: setSvg,
    save: saveSvg,
    export_png: exportPng,
  })
}

function get(store: Store) {
  if (!store.ready || !store.canvas) {
    throw new Error('SVG canvas is not ready')
  }
  return {
    content: store.getSvgString(),
    fileName: store.fileName,
    filePath: store.filePath,
    canvasSize: { ...store.canvasSize },
    mode: store.mode,
    hasSelection: store.hasSelection,
    selectionCount: store.selection.elements.length,
    canUndo: store.canUndo,
    canRedo: store.canRedo,
    fill: store.fill,
    stroke: store.stroke,
    strokeWidth: store.strokeWidth,
  }
}

async function openSvg(store: Store, args: { path: string }) {
  await store.openSvgFromPath(args.path)
  return get(store)
}

function setSvg(store: Store, args: { content: string }) {
  store.setSvgContent(args.content)
  return get(store)
}

async function saveSvg(store: Store, args: { path?: string }) {
  const path = args.path ?? store.filePath ?? undefined
  if (!path) {
    throw new Error('path is required when no file is open')
  }
  const savedPath = await store.saveSvgToPath(path)
  return {
    savedPath,
    ...get(store),
  }
}

async function exportPng(store: Store, args: { path: string }) {
  const savedPath = await store.exportPngToPath(args.path)
  return {
    savedPath,
    width: store.canvasSize.width,
    height: store.canvasSize.height,
  }
}
