import path from 'node:path'
import fs from 'node:fs/promises'
import { watch, type FSWatcher } from 'chokidar'
import debounce from 'licia/debounce'
import normalizePath from 'licia/normalizePath'
import type {
  MarkdownFolderFile,
  FileWatchEventType,
  IFileWatchEvent,
} from '../common/types'
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

const WATCH_EVENTS = new Set<FileWatchEventType>([
  'add',
  'addDir',
  'change',
  'unlink',
  'unlinkDir',
])

let watchSession = 0
let watcher: FSWatcher | null = null
let flushDebounced: (() => void) | null = null
let pendingEvents: IFileWatchEvent[] = []

export function watchPaths(
  paths: string[],
  onChange: (events: IFileWatchEvent[]) => void,
): () => void {
  const session = ++watchSession

  flushDebounced = null
  pendingEvents = []
  void watcher?.close()
  watcher = null

  if (paths.length === 0) {
    return () => {
      ++watchSession
      flushDebounced = null
      pendingEvents = []
      void watcher?.close()
      watcher = null
    }
  }

  flushDebounced = debounce(() => {
    if (session !== watchSession) return
    const events = pendingEvents
    pendingEvents = []
    if (events.length > 0) {
      onChange(events)
    }
  }, 300)

  const w = watch(paths, {
    ignoreInitial: true,
    persistent: true,
    depth: 0,
    ignorePermissionErrors: true,
  })

  w.on('all', (event, filePath) => {
    if (!WATCH_EVENTS.has(event as FileWatchEventType)) return
    pendingEvents.push({
      type: event as FileWatchEventType,
      path: normalizePath(filePath),
    })
    flushDebounced?.()
  })

  watcher = w

  return () => {
    ++watchSession
    flushDebounced = null
    pendingEvents = []
    void w.close()
    watcher = null
  }
}
