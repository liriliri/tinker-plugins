import { useCallback, useEffect, useRef, useState } from 'react'
import splitPath from 'licia/splitPath'
import type { MarkdownFolderFile } from '../../common/types'
import { pickFolderPath } from '../lib/dialog'
import store from '../store'

const FILE_TREE_DEFAULT_WIDTH = 240

function folderNameFromPath(folderPath: string) {
  const { name } = splitPath(folderPath)
  return name || folderPath
}

export function useFileTree() {
  const [files, setFiles] = useState<MarkdownFolderFile[]>([])
  const [rootName, setRootName] = useState('')
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
        setFiles(await markdown.listMarkdownFilesForPath(path))
      } catch {
        setFiles([])
      }
    },
    [sourcePath],
  )

  const openFolderPath = useCallback(async (path: string) => {
    const folderName = folderNameFromPath(path)

    try {
      const nextFiles = await markdown.listMarkdownFilesForPath(path)
      loadedSourcePathRef.current = path
      setSourcePath(path)
      setRootName(folderName)
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
    setRootName(folderNameFromPath(dir))
    setOpen(true)
    store.setLastFolderPath(dir)
    store.setRootFolderName(folderNameFromPath(dir))
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
    markdown
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

    const unwatch = markdown.watchMarkdownTree(sourcePath, () => {
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

  return {
    files,
    open,
    openMarkdownFolder,
    refresh,
    rootName,
    setRootFromFilePath,
    sourcePath,
    toggle,
    width: FILE_TREE_DEFAULT_WIDTH,
  }
}
