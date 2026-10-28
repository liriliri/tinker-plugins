import * as asar from '@electron/asar'
import contain from 'licia/contain'
import isWindows from 'licia/isWindows'
import each from 'licia/each'
import endWith from 'licia/endWith'
import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import randomId from 'licia/randomId'
import some from 'licia/some'
import sortBy from 'licia/sortBy'
import startWith from 'licia/startWith'
import unique from 'licia/unique'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { errorMessage } from 'tinker-share/lib/util'
import type {
  AsarFileInfo,
  CreateFileResult,
  DeleteEntryResult,
  ExtractFilesResult,
  FilePreviewResult,
  OpenAsarResult,
  SaveAsarResult,
  UpdateFileResult,
} from '../common/types'
import { getBasename } from '../common/format'
import {
  getExtension,
  isProbablyText,
  isTextExtension,
} from '../common/fileType'
import { normalizePackagePath } from '../common/path'

interface FileEntry {
  size: number
  unpacked: boolean
  data?: Buffer
}

function isUnpackedEntry(entry: object): boolean {
  return (
    'unpacked' in entry && (entry as { unpacked?: boolean }).unpacked === true
  )
}

let asarPath: string | null = null
let files = new Map<string, FileEntry>()
let emptyDirectories: string[] = []

function isDirectoryEntry(entry: object): boolean {
  return 'files' in entry
}

// @electron/asar traverses with path.sep; on Windows dirs stat with `/`, files with `\`.
function withAsarPackagePath<T>(
  packagePath: string,
  run: (resolvedPath: string) => T,
): T {
  if (!isWindows) {
    return run(packagePath)
  }
  try {
    return run(packagePath)
  } catch {
    return run(packagePath.replace(/\//g, '\\'))
  }
}

function getFileData(packagePath: string): Buffer | null {
  const entry = files.get(packagePath)
  if (!entry) {
    return null
  }
  if (entry.data) {
    return entry.data
  }
  if (!asarPath) {
    return null
  }
  const data = withAsarPackagePath(packagePath, (p) =>
    asar.extractFile(asarPath, p),
  )
  entry.data = data
  return data
}

function resolveExtractTargets(requested: string[]): string[] {
  const matched = new Set<string>()

  each(requested, (raw) => {
    const req = normalizePackagePath(raw)
    if (!req) {
      return
    }

    if (files.has(req)) {
      matched.add(req)
      return
    }

    const prefix = endWith(req, '/') ? req : `${req}/`
    each([...files.keys()], (key) => {
      if (startWith(key, prefix)) {
        matched.add(key)
      }
    })
  })

  return sortBy([...matched])
}

export async function openAsar(filePath: string): Promise<OpenAsarResult> {
  try {
    asar.uncache(filePath)
    const listed = asar.listPackage(filePath, { isPack: false })
    files = new Map()
    emptyDirectories = []
    asarPath = filePath

    const list: AsarFileInfo[] = []
    each(listed, (raw) => {
      const packagePath = normalizePackagePath(raw)
      if (!packagePath) {
        return
      }

      const stat = withAsarPackagePath(packagePath, (p) =>
        asar.statFile(filePath, p),
      )
      if (isDirectoryEntry(stat)) {
        if (isEmpty(stat.files)) {
          emptyDirectories.push(packagePath)
        }
        return
      }

      const unpacked = isUnpackedEntry(stat)
      files.set(packagePath, { size: stat.size, unpacked })
      list.push({ path: packagePath, size: stat.size, unpacked })
    })

    emptyDirectories = sortBy(emptyDirectories)
    await tinker.setTitle(getBasename(filePath))

    return {
      success: true,
      path: filePath,
      files: sortBy(list, 'path'),
      emptyDirectories,
    }
  } catch (error) {
    asarPath = null
    files = new Map()
    emptyDirectories = []
    return {
      success: false,
      error: errorMessage(error),
    }
  }
}

export function getFilePreview(filePath: string): FilePreviewResult {
  try {
    const entry = files.get(filePath)
    if (!entry) {
      return { success: false, error: 'File not found' }
    }

    const data = getFileData(filePath)
    if (!data) {
      return { success: false, error: 'Failed to read file' }
    }

    const ext = getExtension(filePath)
    if (isTextExtension(ext) || isProbablyText(data)) {
      return {
        success: true,
        type: 'text',
        content: data.toString('utf8'),
        size: data.length,
      }
    }

    return {
      success: true,
      type: 'unsupported',
      size: data.length,
    }
  } catch (error) {
    return { success: false, error: errorMessage(error) }
  }
}

export function createFile(filePath: string, content = ''): CreateFileResult {
  const normalized = normalizePackagePath(filePath)
  if (!normalized) {
    return { success: false, error: 'Invalid path' }
  }

  if (files.has(normalized)) {
    return { success: false, error: 'File already exists' }
  }

  const data = Buffer.from(content, 'utf8')
  files.set(normalized, { size: data.length, unpacked: false, data })
  emptyDirectories = filter(
    emptyDirectories,
    (dir) => dir !== normalized && !startWith(normalized, `${dir}/`),
  )
  return { success: true, path: normalized, size: data.length }
}

export function createDirectory(dirPath: string): CreateFileResult {
  const normalized = normalizePackagePath(dirPath)
  if (!normalized) {
    return { success: false, error: 'Invalid path' }
  }

  if (files.has(normalized)) {
    return { success: false, error: 'File already exists' }
  }

  if (contain(emptyDirectories, normalized)) {
    return { success: false, error: 'Directory already exists' }
  }

  if (some([...files.keys()], (key) => startWith(key, `${normalized}/`))) {
    return { success: true, path: normalized, size: 0 }
  }

  emptyDirectories = sortBy([...emptyDirectories, normalized])
  return { success: true, path: normalized, size: 0 }
}

export function updateFile(
  filePath: string,
  content: string,
): UpdateFileResult {
  const entry = files.get(filePath)
  if (!entry) {
    return { success: false, error: 'File not found' }
  }

  const data = Buffer.from(content, 'utf8')
  entry.data = data
  entry.size = data.length
  return { success: true, size: data.length }
}

export function deleteEntry(
  filePath: string,
  isDirectory: boolean,
): DeleteEntryResult {
  const keys = [...files.keys()]
  const toDelete = isDirectory
    ? filter(keys, (key) => key === filePath || startWith(key, `${filePath}/`))
    : filter(keys, (key) => key === filePath)

  if (isDirectory) {
    emptyDirectories = filter(
      emptyDirectories,
      (dir) => dir !== filePath && !startWith(dir, `${filePath}/`),
    )
  }

  if (isEmpty(toDelete) && !isDirectory) {
    return { success: false, error: 'Not found' }
  }

  each(toDelete, (key) => {
    files.delete(key)
  })

  return { success: true, deleted: toDelete }
}

export async function extractFiles(
  paths: string[],
  outputDir: string,
): Promise<ExtractFilesResult> {
  if (!asarPath) {
    return { success: false, error: 'No package open' }
  }

  const targets = resolveExtractTargets(paths)
  if (isEmpty(targets)) {
    return { success: false, error: 'No matching files' }
  }

  try {
    const root = path.resolve(outputDir)
    await fs.mkdir(root, { recursive: true })

    const extracted: string[] = []
    for (const filePath of targets) {
      const data = getFileData(filePath)
      if (!data) {
        continue
      }

      const outPath = path.join(root, ...filePath.split('/'))
      await fs.mkdir(path.dirname(outPath), { recursive: true })
      await fs.writeFile(outPath, data)
      extracted.push(filePath)
    }

    return { success: true, extracted }
  } catch (error) {
    return {
      success: false,
      error: errorMessage(error),
    }
  }
}

export async function saveAsar(): Promise<SaveAsarResult> {
  if (!asarPath) {
    return { success: false, error: 'No package open' }
  }

  const dest = asarPath
  const stamp = randomId(10)
  const tmpDir = path.join(os.tmpdir(), `tinker-asar-src-${stamp}`)
  const tmpPath = path.join(os.tmpdir(), `tinker-asar-${stamp}.asar`)

  try {
    await fs.mkdir(tmpDir, { recursive: true })

    for (const dirPath of emptyDirectories) {
      await fs.mkdir(path.join(tmpDir, ...dirPath.split('/')), {
        recursive: true,
      })
    }

    const unpackedPaths: string[] = []
    for (const filePath of sortBy([...files.keys()])) {
      const entry = files.get(filePath)
      const data = getFileData(filePath)
      if (!data || !entry) {
        throw new Error(`Failed to read ${filePath}`)
      }
      if (entry.unpacked) {
        unpackedPaths.push(filePath)
      }
      const outPath = path.join(tmpDir, ...filePath.split('/'))
      await fs.mkdir(path.dirname(outPath), { recursive: true })
      await fs.writeFile(outPath, data)
    }

    if (!isEmpty(unpackedPaths)) {
      // @electron/asar matches unpack with { matchBase: true }
      const names = unique(
        map(unpackedPaths, (filePath) => path.posix.basename(filePath)),
      )
      const unpack = names.length === 1 ? names[0] : `{${names.join(',')}}`
      await asar.createPackageWithOptions(tmpDir, tmpPath, { unpack })
    } else {
      await asar.createPackage(tmpDir, tmpPath)
    }

    asar.uncache(dest)
    await fs.copyFile(tmpPath, dest)

    const destUnpacked = `${dest}.unpacked`
    const tmpUnpacked = `${tmpPath}.unpacked`
    await fs.rm(destUnpacked, { recursive: true, force: true }).catch(() => {})
    try {
      await fs.access(tmpUnpacked)
      await fs.cp(tmpUnpacked, destUnpacked, { recursive: true })
    } catch {
      // archive may have no .unpacked sibling
    }

    asarPath = dest

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: errorMessage(error),
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    await fs.unlink(tmpPath).catch(() => {})
    await fs
      .rm(`${tmpPath}.unpacked`, { recursive: true, force: true })
      .catch(() => {})
  }
}
