import { useCallback, useEffect, useRef, useState } from 'react'
import splitPath from 'licia/splitPath'
import type { MarkdownFolderFile } from '../../common/types'
import { folderBaseName } from '../../common/path'
import { pickFolderPath } from '../lib/dialog'
import store from '../store'

const FILE_TREE_DEFAULT_WIDTH = 240

export function useFileTree() {
  const [files, setFiles] = useState<MarkdownFolderFile[]>([])
  const [sourcePath, setSourcePath] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const loadedSourcePathRef = useRef<string | null>(null)

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
        if (nextOpen) refresh(fallbackPath)
        return nextOpen
      })
    },
    [refresh],
  )

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

  useEffect(() => {
    if (!sourcePath) return

    let active = true

    const unwatch = markdownLive.watchMarkdownTree(sourcePath, () => {
      if (active) refresh(sourcePath)
    })

    return () => {
      active = false
      unwatch()
    }
  }, [refresh, sourcePath])

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
    files,
    open,
    openMarkdownFolder,
    refresh,
    renameFile,
    setRootFromFilePath,
    sourcePath,
    toggle,
    width: FILE_TREE_DEFAULT_WIDTH,
  }
}
