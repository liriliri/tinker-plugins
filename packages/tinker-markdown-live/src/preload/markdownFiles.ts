import path from 'node:path'
import { watch } from 'node:fs'
import fs from 'node:fs/promises'
import debounce from 'licia/debounce'
import type { MarkdownFolderFile } from '../common/types'
import { toRelativePath } from './pathUtil'

const SKIP_DIRS = new Set(['.git', 'node_modules', 'target', 'dist', 'build'])

function isMarkdownFile(filePath: string) {
  return /\.(md|markdown)$/i.test(filePath)
}

async function collectMarkdownFiles(
  root: string,
  directory: string,
  files: MarkdownFolderFile[],
) {
  let entries
  try {
    entries = await fs.readdir(directory, { withFileTypes: true })
  } catch {
    return
  }

  entries.sort((left, right) =>
    left.name.localeCompare(right.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  )

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)

    try {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue

        const stats = await fs.stat(fullPath)
        files.push({
          path: fullPath,
          name: entry.name,
          relativePath: toRelativePath(root, fullPath),
          kind: 'folder',
          modifiedAt: stats.mtimeMs,
          createdAt: stats.birthtimeMs,
        })
        await collectMarkdownFiles(root, fullPath, files)
        continue
      }

      if (entry.isFile() && isMarkdownFile(entry.name)) {
        const stats = await fs.stat(fullPath)
        files.push({
          path: fullPath,
          name: entry.name,
          relativePath: toRelativePath(root, fullPath),
          modifiedAt: stats.mtimeMs,
          createdAt: stats.birthtimeMs,
        })
      }
    } catch {
      continue
    }
  }
}

export async function listMarkdownFilesForPath(rootPath: string) {
  const stat = await fs.stat(rootPath)
  if (!stat.isDirectory()) {
    throw new Error('Path is not a directory')
  }

  const files: MarkdownFolderFile[] = []
  await collectMarkdownFiles(rootPath, rootPath, files)
  return files
}

export function watchMarkdownTree(rootPath: string, onChange: () => void) {
  const notify = debounce(onChange, 200)

  try {
    const watcher = watch(rootPath, { recursive: true }, () => {
      notify()
    })

    return () => {
      watcher.close()
    }
  } catch {
    return () => {}
  }
}
