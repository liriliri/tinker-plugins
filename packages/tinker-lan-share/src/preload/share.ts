import fs from 'fs'
import os from 'os'
import path from 'path'
import each from 'licia/each'
import mime from 'licia/mime'
import startWith from 'licia/startWith'
import type { SharedFile } from '../common/types'

const STORAGE_NAME = 'tinker-lan-share'

let shareDir = ''
let changeVersion = 0
const changeListeners = new Set<(version: number) => void>()

export function getShareDir() {
  return shareDir
}

export function getChangeVersion() {
  return changeVersion
}

export function onShareChanged(listener: (version: number) => void) {
  changeListeners.add(listener)
  return () => {
    changeListeners.delete(listener)
  }
}

function notifyShareChanged() {
  changeVersion += 1
  each([...changeListeners], (listener) => {
    listener(changeVersion)
  })
}

export async function initShareDir() {
  if (shareDir) {
    await fs.promises.mkdir(shareDir, { recursive: true })
    return shareDir
  }
  shareDir = path.join(os.homedir(), '.tinker', STORAGE_NAME)
  await fs.promises.mkdir(shareDir, { recursive: true })
  return shareDir
}

export function resolveSharePath(relativePath: string) {
  const root = path.resolve(shareDir)
  const full = path.resolve(root, relativePath.replace(/\//g, path.sep))
  if (full !== root && !startWith(full, root + path.sep)) {
    throw new Error('Invalid path')
  }
  return full
}

function contentTypeFor(filePath: string) {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  return mime(ext) || 'application/octet-stream'
}

export function listSharedFiles(): SharedFile[] {
  if (!shareDir || !fs.existsSync(shareDir)) return []

  const files: SharedFile[] = []

  const walk = (dir: string) => {
    each(fs.readdirSync(dir, { withFileTypes: true }), (entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        return
      }
      if (!entry.isFile()) return
      const relativePath = path
        .relative(shareDir, full)
        .split(path.sep)
        .join('/')
      const stat = fs.statSync(full)
      files.push({
        relativePath,
        fileName: entry.name,
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
        contentType: contentTypeFor(entry.name),
      })
    })
  }

  walk(shareDir)
  return files
}

export async function saveUpload(
  relativePath: string,
  data: Buffer | NodeJS.ReadableStream,
) {
  await initShareDir()
  const safeRel = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!safeRel || safeRel.includes('..')) {
    throw new Error('Invalid file name')
  }
  const dest = resolveSharePath(safeRel)
  await fs.promises.mkdir(path.dirname(dest), { recursive: true })
  if (Buffer.isBuffer(data)) {
    await fs.promises.writeFile(dest, data)
    notifyShareChanged()
    return
  }
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createWriteStream(dest)
    data.pipe(stream)
    stream.on('finish', () => resolve())
    stream.on('error', reject)
    data.on('error', reject)
  })
  notifyShareChanged()
}

export function removePath(relativePath: string) {
  const full = resolveSharePath(relativePath)
  if (fs.existsSync(full)) {
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true })
    } else {
      fs.unlinkSync(full)
    }
    notifyShareChanged()
  }
}

export function clearAll() {
  if (!shareDir) return
  if (fs.existsSync(shareDir)) {
    fs.rmSync(shareDir, { recursive: true, force: true })
  }
  fs.mkdirSync(shareDir, { recursive: true })
  notifyShareChanged()
}

export function fileCount() {
  return listSharedFiles().length
}

export function contentTypeOf(filePath: string) {
  return contentTypeFor(filePath)
}
