import path from 'node:path'
import fs from 'node:fs/promises'
import trim from 'licia/trim'
import type { MarkdownFolderFile } from '../common/types'
import { normalizeTrimmedPath } from '../common/path'
import { toRelativePath } from './pathUtil'

function resolveRoot(rootPath: string) {
  return path.resolve(rootPath)
}

function ensureWithinRoot(root: string, target: string) {
  const resolved = path.resolve(target)
  const relative = path.relative(root, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path is outside workspace')
  }
  return resolved
}

function resolveParent(root: string, parentPath: string | null) {
  if (!parentPath) return root
  return ensureWithinRoot(root, parentPath)
}

function normalizeMarkdownFileName(fileName: string) {
  const trimmed = trim(fileName)
  if (!trimmed) throw new Error('File name is required')
  if (/[\\/]/.test(trimmed)) throw new Error('Invalid file name')
  if (!/\.(md|markdown)$/i.test(trimmed)) return `${trimmed}.md`
  return trimmed
}

function normalizeFolderName(folderName: string) {
  const trimmed = trim(folderName)
  if (!trimmed) throw new Error('Folder name is required')
  if (/[\\/]/.test(trimmed)) throw new Error('Invalid folder name')
  return trimmed
}

async function toFolderFile(
  root: string,
  targetPath: string,
  kind?: MarkdownFolderFile['kind'],
): Promise<MarkdownFolderFile> {
  const stats = await fs.stat(targetPath)
  return {
    path: targetPath,
    name: path.basename(targetPath),
    relativePath: toRelativePath(root, targetPath),
    kind: kind ?? (stats.isDirectory() ? 'folder' : undefined),
    modifiedAt: stats.mtimeMs,
    createdAt: stats.birthtimeMs,
  }
}

async function ensureTargetAvailable(targetPath: string, sourcePath?: string) {
  try {
    await fs.access(targetPath)
    if (!sourcePath || targetPath !== sourcePath) {
      throw new Error('Path already exists')
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

export async function createMarkdownTreeFile(
  rootPath: string,
  fileName: string,
  options: { parentPath?: string | null; contents?: string } = {},
) {
  const root = resolveRoot(rootPath)
  const parent = resolveParent(root, normalizeTrimmedPath(options.parentPath))
  const targetPath = path.join(parent, normalizeMarkdownFileName(fileName))

  ensureWithinRoot(root, targetPath)
  await ensureTargetAvailable(targetPath)
  await fs.mkdir(parent, { recursive: true })
  await fs.writeFile(targetPath, options.contents ?? '', 'utf8')
  return toFolderFile(root, targetPath)
}

export async function createMarkdownTreeFolder(
  rootPath: string,
  folderName: string,
  parentPath: string | null = null,
) {
  const root = resolveRoot(rootPath)
  const parent = resolveParent(root, normalizeTrimmedPath(parentPath))
  const targetPath = path.join(parent, normalizeFolderName(folderName))

  ensureWithinRoot(root, targetPath)
  await ensureTargetAvailable(targetPath)
  await fs.mkdir(targetPath)
  return toFolderFile(root, targetPath, 'folder')
}

export async function renameMarkdownTreeFile(
  rootPath: string,
  filePath: string,
  fileName: string,
) {
  const root = resolveRoot(rootPath)
  const sourcePath = ensureWithinRoot(root, filePath)
  const trimmed = trim(fileName)
  if (!trimmed) throw new Error('Name is required')
  if (/[\\/]/.test(trimmed)) throw new Error('Invalid name')

  const stats = await fs.stat(sourcePath)
  const normalizedName = stats.isFile()
    ? normalizeMarkdownFileName(trimmed)
    : normalizeFolderName(trimmed)
  const targetPath = path.join(path.dirname(sourcePath), normalizedName)

  ensureWithinRoot(root, targetPath)
  await ensureTargetAvailable(targetPath, sourcePath)
  await fs.rename(sourcePath, targetPath)
  return toFolderFile(root, targetPath)
}

export async function deleteMarkdownTreeFile(
  rootPath: string,
  filePath: string,
) {
  const root = resolveRoot(rootPath)
  const sourcePath = ensureWithinRoot(root, filePath)
  const stats = await fs.stat(sourcePath)

  if (stats.isDirectory()) {
    await fs.rm(sourcePath, { recursive: true, force: true })
  } else {
    await fs.unlink(sourcePath)
  }
}
