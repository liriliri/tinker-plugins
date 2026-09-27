import fileSize from 'licia/fileSize'
import normalizePath from 'licia/normalizePath'
import rtrim from 'licia/rtrim'
import splitPath from 'licia/splitPath'
import toNum from 'licia/toNum'
import type { GltfItem } from '../../common/types'

function getStemName(inputPath: string): string {
  const { name, ext } = splitPath(inputPath)
  if (ext && name.endsWith(ext)) {
    return name.slice(0, -ext.length)
  }
  return name
}

function normalizeDir(dir: string): string {
  return rtrim(normalizePath(dir), '/').toLowerCase()
}

export function getOutputPath(inputPath: string, outputDir: string): string {
  const { dir } = splitPath(inputPath)
  const sourceDir = normalizeDir(dir)
  const baseDir = rtrim(outputDir || dir, ['/', '\\'])
  const stem = getStemName(inputPath)
  const sameDir = !outputDir || normalizeDir(outputDir) === sourceDir
  const fileName = sameDir ? `${stem}_optimized.glb` : `${stem}.glb`

  return `${baseDir}/${fileName}`
}

export function getReduction(item: GltfItem): string {
  if (!item.originalSize || !item.outputSize) return ''
  const ratio = toNum(
    ((1 - item.outputSize / item.originalSize) * 100).toFixed(1),
  )
  return `${ratio > 0 ? '-' : '+'}${Math.abs(ratio)}%`
}

export function isSmaller(item: GltfItem): boolean {
  return item.originalSize > 0 && item.outputSize < item.originalSize
}

export function formatSize(bytes: number): string {
  return bytes > 0 ? fileSize(bytes) : '--'
}
