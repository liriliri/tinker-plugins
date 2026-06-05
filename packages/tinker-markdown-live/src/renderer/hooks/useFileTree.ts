import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import splitPath from 'licia/splitPath'
import type { MarkdownFolderFile } from '../../common/types'
import { folderBaseName } from '../../common/path'
import { pickFolderPath } from '../lib/dialog'
import { buildFileTree, collectFolderPaths } from '../lib/fileTree'
import store from '../store'

const FILE_TREE_DEFAULT_WIDTH = 240

interface UseFileTreeParams {
  openFilePath: string | null
  onFileChanged: (path: string) => void
}

export function useFileTree({
  openFilePath,
  onFileChanged,
}: UseFileTreeParams) {
  const [files, setFiles] = useState<MarkdownFolderFile[]>([])
  const [sourcePath, setSourcePath] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(),
  )
  const loadedSourcePathRef = useRef<string | null>(null)
  const recentlySavedPathsRef = useRef<Map<string, number>>(new Map())

  const refresh = useCallback(
    async (fallbackPath: string | null = null) => {
      const path = sourcePath ?? fallbackPath
      if (!path) {
        setFiles([])
        return
      }

      try {
        setFiles(await markdownLive.listMarkdownFilesForPath(path))
      } catch {
        setFiles([])
      }
    },
    [sourcePath],
  )

  const openFolderPath = useCallback(async (path: string) => {
    const folderName = folderBaseName(path)

    try {
      const nextFiles = await markdownLive.listMarkdownFilesForPath(path)
      loadedSourcePathRef.current = path
      setSourcePath(path)
      setFiles(nextFiles)
      setOpen(true)
      store.setLastFolderPath(path)
      store.setRootFolderName(folderName)
    } catch {
      store.clearLastFolderPath()
    }
  }, [])

  const openMarkdownFolder = useCallback(async () => {
    const path = await pickFolderPath()
    if (!path) return
    await openFolderPath(path)
  }, [openFolderPath])

  const setRootFromFilePath = useCallback((filePath: string) => {
    const { dir } = splitPath(filePath)
    if (!dir) return

    loadedSourcePathRef.current = dir
    setSourcePath(dir)
    setOpen(true)
    store.setLastFolderPath(dir)
    store.setRootFolderName(folderBaseName(dir))
  }, [])

  const toggle = useCallback(
    (fallbackPath: string | null = null) => {
      setOpen((currentOpen) => {
        const nextOpen = !currentOpen
        if (nextOpen) void refresh(fallbackPath)
        return nextOpen
      })
    },
    [refresh],
  )

  const markSavedPath = useCallback((filePath: string) => {
    recentlySavedPathsRef.current.set(filePath, Date.now())
  }, [])

  const toggleFolder = useCallback((relativePath: string) => {
    setExpandedFolders((current) => {
      const next = new Set(current)
      if (next.has(relativePath)) {
        next.delete(relativePath)
      } else {
        next.add(relativePath)
      }
      return next
    })
  }, [])

  // Build a stable key for expanded folders to use in effect deps
  const expandedDirsKey = useMemo(
    () => [...expandedFolders].sort().join('\0'),
    [expandedFolders],
  )

  // Clear expanded folders when root path changes
  useEffect(() => {
    setExpandedFolders(new Set())
  }, [sourcePath])

  // Auto-expand first folder
  useEffect(() => {
    if (!sourcePath || files.length === 0) return
    const tree = buildFileTree(files, sourcePath)
    const folderPaths = collectFolderPaths(tree)
    if (folderPaths.length === 0) return

    setExpandedFolders((current) => {
      if (current.size > 0) return current
      return new Set(folderPaths.slice(0, 1))
    })
  }, [sourcePath, files])

  // Load files when sourcePath changes (ignores initial mount)
  useEffect(() => {
    let active = true

    if (!sourcePath) {
      loadedSourcePathRef.current = null
      setFiles([])
      return () => {
        active = false
      }
    }

    if (loadedSourcePathRef.current === sourcePath) {
      return () => {
        active = false
      }
    }

    loadedSourcePathRef.current = sourcePath
    markdownLive
      .listMarkdownFilesForPath(sourcePath)
      .then((nextFiles) => {
        if (active) setFiles(nextFiles)
      })
      .catch(() => {
        if (active) setFiles([])
      })

    return () => {
      active = false
    }
  }, [sourcePath])

  // On-demand file watching with chokidar
  useEffect(() => {
    if (!sourcePath) return
    let active = true

    const watchPaths: string[] = [sourcePath]
    for (const rp of expandedFolders) {
      watchPaths.push(sourcePath + '/' + rp)
    }
    if (openFilePath) {
      watchPaths.push(openFilePath)
    }

    const unwatch = markdownLive.watchPaths(watchPaths, (events) => {
      if (!active) return

      let shouldRefresh = false

      for (const event of events) {
        if (event.type === 'change') {
          if (event.path !== openFilePath) continue
          const savedAt = recentlySavedPathsRef.current.get(event.path)
          if (savedAt && Date.now() - savedAt < 500) {
            recentlySavedPathsRef.current.delete(event.path)
            continue
          }
          onFileChanged(event.path)
          continue
        }

        shouldRefresh = true
      }

      if (shouldRefresh) void refresh(sourcePath)
    })

    return () => {
      active = false
      unwatch()
    }
  }, [sourcePath, expandedDirsKey, openFilePath, onFileChanged, refresh])

  // Auto-open last folder on mount
  useEffect(() => {
    const path = store.getLastFolderPath()
    if (!path) return
    void openFolderPath(path)
  }, [openFolderPath])

  const createFile = useCallback(
    async (
      fileName: string,
      parentPath: string | null = null,
      contents?: string,
    ) => {
      if (!sourcePath) return null

      try {
        const file = await markdownLive.createMarkdownTreeFile(
          sourcePath,
          fileName,
          {
            parentPath,
            contents,
          },
        )
        await refresh(sourcePath)
        return file
      } catch {
        return null
      }
    },
    [refresh, sourcePath],
  )

  const createFolder = useCallback(
    async (folderName: string, parentPath: string | null = null) => {
      if (!sourcePath) return null

      try {
        const folder = await markdownLive.createMarkdownTreeFolder(
          sourcePath,
          folderName,
          parentPath,
        )
        await refresh(sourcePath)
        return folder
      } catch {
        return null
      }
    },
    [refresh, sourcePath],
  )

  const renameFile = useCallback(
    async (file: MarkdownFolderFile, fileName: string) => {
      if (!sourcePath) return null

      try {
        const renamedFile = await markdownLive.renameMarkdownTreeFile(
          sourcePath,
          file.path,
          fileName,
        )
        await refresh(sourcePath)
        return renamedFile
      } catch {
        return null
      }
    },
    [refresh, sourcePath],
  )

  const deleteFile = useCallback(
    async (file: MarkdownFolderFile) => {
      if (!sourcePath) return false

      try {
        await markdownLive.deleteMarkdownTreeFile(sourcePath, file.path)
        await refresh(sourcePath)
        return true
      } catch {
        return false
      }
    },
    [refresh, sourcePath],
  )

  return {
    createFile,
    createFolder,
    deleteFile,
    expandedFolders,
    files,
    markSavedPath,
    open,
    openMarkdownFolder,
    refresh,
    renameFile,
    setRootFromFilePath,
    sourcePath,
    toggle,
    toggleFolder,
    width: FILE_TREE_DEFAULT_WIDTH,
  }
}
