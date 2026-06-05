import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import { initReactI18next, useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import mermaid from 'mermaid'
import { uuid } from 'licia'
import type { MarkdownFolderFile } from '../common/types'
import EmptyEditor from './components/EmptyEditor'
import FileTree from './components/FileTree'
import Toolbar from './components/Toolbar'
import { useFileTree } from './hooks/useFileTree'
import { isPathUnder } from '../common/path'
import { pickMarkdownSavePath } from './lib/dialog'
import { getMarkdownOutline } from './lib/markdownOutline'
import { selectOutlineHeading } from './lib/outlineNavigation'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

let mermaidQueue: Promise<unknown> = Promise.resolve()
let panZoomSetup = false

function setupMermaidPanZoom() {
  if (panZoomSetup) return
  panZoomSetup = true

  const MIN_SCALE = 0.5
  const MAX_SCALE = 10
  const ZOOM_FACTOR = 0.001

  let isPanning = false
  let currentWrapper: HTMLElement | null = null
  let currentContent: HTMLElement | null = null
  let startX = 0
  let startY = 0
  let translateX = 0
  let translateY = 0
  let scale = 1

  function transformToState(transform: string) {
    const tMatch = transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/)
    const sMatch = transform.match(/scale\(([\d.]+)\)/)
    return {
      tx: tMatch ? parseFloat(tMatch[1]) : 0,
      ty: tMatch ? parseFloat(tMatch[2]) : 0,
      s: sMatch ? parseFloat(sMatch[1]) : 1,
    }
  }

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    const wrapper = (e.target as Element).closest(
      '.mermaid-wrapper',
    ) as HTMLElement | null
    if (!wrapper) return

    if (e.ctrlKey || e.metaKey) return

    e.preventDefault()
    isPanning = true
    currentWrapper = wrapper
    currentContent = wrapper.querySelector('.mermaid-content') as HTMLElement
    startX = e.clientX
    startY = e.clientY

    const state = transformToState(currentContent.style.transform)
    translateX = state.tx
    translateY = state.ty
    scale = state.s

    currentWrapper.style.cursor = 'grabbing'
  })

  document.addEventListener('mousemove', (e) => {
    if (!isPanning || !currentContent) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    currentContent.style.transform = `translate(${translateX + dx}px, ${translateY + dy}px) scale(${scale})`
  })

  document.addEventListener('mouseup', () => {
    if (isPanning && currentWrapper) {
      currentWrapper.style.cursor = 'grab'
    }
    isPanning = false
    currentWrapper = null
    currentContent = null
  })

  document.addEventListener(
    'wheel',
    (e) => {
      const wrapper = (e.target as Element).closest(
        '.mermaid-wrapper',
      ) as HTMLElement | null
      if (!wrapper) return

      e.preventDefault()
      e.stopPropagation()

      const content = wrapper.querySelector('.mermaid-content') as HTMLElement
      const state = transformToState(content.style.transform)
      scale = state.s
      translateX = state.tx
      translateY = state.ty

      const rect = wrapper.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const delta = -e.deltaY * ZOOM_FACTOR
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, scale * (1 + delta)),
      )

      const scaleFactor = newScale / scale
      translateX = mouseX - (mouseX - translateX) * scaleFactor
      translateY = mouseY - (mouseY - translateY) * scaleFactor
      scale = newScale

      content.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
    },
    { passive: false },
  )
}

const App = observer(() => {
  const { t } = useTranslation()
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const reloadTriggerRef = useRef(0)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const handleFileChanged = useCallback(async (filePath: string) => {
    if (filePath !== store.filePath) return
    const content = await tinker.readFile(filePath, 'utf-8')
    store.setContent(content)
    store.markSaved()
    reloadTriggerRef.current++
    setReloadTrigger(reloadTriggerRef.current)
  }, [])

  const fileTree = useFileTree({
    openFilePath: store.filePath,
    onFileChanged: handleFileChanged,
  })
  const outlineItems = useMemo(
    () => getMarkdownOutline(store.content),
    [store.content],
  )

  const renderMermaid = useCallback(
    (content: string, applyPreview: (html: string) => void) => {
      const id = `mermaid-${uuid()}`
      const renderTask = async () => {
        try {
          const renderResult = await Promise.race([
            mermaid.render(id, content),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error('Mermaid render timeout')),
                15000,
              ),
            ),
          ])
          applyPreview(
            `<div class="mermaid-wrapper" style="position:relative;overflow:hidden;cursor:grab;border:1px solid transparent;border-radius:4px;margin-bottom:1em;min-height:100px;background:var(--crepe-color-surface,transparent);">` +
              `<div class="mermaid-content" style="transform-origin:0 0;">${renderResult.svg}</div>` +
              `</div>`,
          )
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          console.error('[mermaid] render error:', e)
          applyPreview(
            `<pre class="mermaid-error"><code>${message}</code></pre>`,
          )
        }
      }
      mermaidQueue = mermaidQueue.then(renderTask).catch(renderTask)
    },
    [],
  )

  const initEditor = useCallback(
    async (content: string) => {
      if (!editorRef.current) return
      if (crepeRef.current) {
        await crepeRef.current.destroy()
        editorRef.current.innerHTML = ''
      }

      const crepe = new Crepe({
        root: editorRef.current,
        defaultValue: content,
        features: {
          [CrepeFeature.CodeMirror]: true,
          [CrepeFeature.ListItem]: true,
          [CrepeFeature.LinkTooltip]: true,
          [CrepeFeature.ImageBlock]: true,
          [CrepeFeature.BlockEdit]: true,
          [CrepeFeature.Toolbar]: true,
          [CrepeFeature.Placeholder]: true,
          [CrepeFeature.Table]: true,
          [CrepeFeature.Latex]: true,
          [CrepeFeature.Cursor]: true,
        },
        featureConfigs: {
          [CrepeFeature.CodeMirror]: {
            renderPreview: (language, content, applyPreview) => {
              if (language === 'mermaid' && content) {
                return renderMermaid(content, applyPreview)
              }
              return null
            },
          },
          [CrepeFeature.Placeholder]: {
            text: t('placeholder'),
          },
        },
      })

      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, markdown) => {
          store.setContent(markdown)
        })
      })

      await crepe.create()
      crepeRef.current = crepe
    },
    [t, renderMermaid],
  )

  const openFile = useCallback(async (path: string) => {
    const content = await tinker.readFile(path, 'utf-8')
    store.setContent(content)
    store.setFilePath(path)
    store.markSaved()
  }, [])

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: store.isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
      themeVariables: {
        fontFamily:
          '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
        fontSize: '16px',
      },
    })
    setupMermaidPanZoom()
  }, [store.isDark])

  useEffect(() => {
    if (!store.filePath) return

    void initEditor(store.content)

    return () => {
      void crepeRef.current?.destroy()
      crepeRef.current = null
      if (editorRef.current) {
        editorRef.current.innerHTML = ''
      }
    }
  }, [store.filePath, reloadTrigger, initEditor])

  const handleOpenFolder = useCallback(async () => {
    await fileTree.openMarkdownFolder()
  }, [fileTree])

  const handleSave = useCallback(async () => {
    let savePath = store.filePath
    if (!savePath) {
      savePath = await pickMarkdownSavePath()
      if (!savePath) return
      store.setFilePath(savePath)
    }
    fileTree.markSavedPath(savePath)
    await tinker.writeFile(savePath, store.content)
    store.markSaved()
    if (fileTree.sourcePath) {
      await fileTree.refresh()
    } else {
      fileTree.setRootFromFilePath(savePath)
    }
  }, [fileTree])

  const handleOpenTreeFile = useCallback(
    async (file: MarkdownFolderFile) => {
      await openFile(file.path)
    },
    [openFile],
  )

  const handleCreateFile = useCallback(
    async (fileName: string, parentPath: string | null = null) => {
      const file = await fileTree.createFile(fileName, parentPath)
      if (file) await openFile(file.path)
    },
    [fileTree, openFile],
  )

  const handleCreateFolder = useCallback(
    async (folderName: string, parentPath: string | null = null) => {
      await fileTree.createFolder(folderName, parentPath)
    },
    [fileTree],
  )

  const handleRenameFile = useCallback(
    async (file: MarkdownFolderFile, fileName: string) => {
      const renamed = await fileTree.renameFile(file, fileName)
      if (!renamed) return
      if (store.filePath === file.path) {
        store.setFilePath(renamed.path)
      }
    },
    [fileTree],
  )

  const handleDeleteFile = useCallback(
    async (file: MarkdownFolderFile) => {
      const isFolder = file.kind === 'folder'
      const confirmed = window.confirm(
        t(
          isFolder
            ? 'confirmDeleteMarkdownFolder'
            : 'confirmDeleteMarkdownFile',
          { name: file.name },
        ),
      )
      if (!confirmed) return

      const deleted = await fileTree.deleteFile(file)
      if (!deleted || !store.filePath) return

      const currentPath = store.filePath
      if (
        currentPath === file.path ||
        (isFolder && isPathUnder(currentPath, file.path))
      ) {
        store.setFilePath(null)
        store.setContent('')
      }
    },
    [fileTree, t],
  )

  const handleSelectOutlineItem = useCallback(
    (item: (typeof outlineItems)[number], index: number) => {
      if (!crepeRef.current || !editorRef.current) return
      selectOutlineHeading(crepeRef.current, item, index, editorRef.current)
    },
    [],
  )

  return (
    <div className={`flex h-screen flex-col ${tw.app.bg}`}>
      <Toolbar
        fileName={store.fileName}
        fileTreeOpen={fileTree.open}
        isDirty={store.isDirty}
        onOpenFolder={handleOpenFolder}
        onSave={handleSave}
        onToggleFileTree={() => fileTree.toggle(store.filePath)}
      />
      <div className="flex min-h-0 flex-1">
        <FileTree
          currentPath={store.filePath}
          expandedFolders={fileTree.expandedFolders}
          files={fileTree.files}
          open={fileTree.open}
          rootPath={fileTree.sourcePath}
          width={fileTree.width}
          outlineItems={outlineItems}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteFile={handleDeleteFile}
          onOpenFile={handleOpenTreeFile}
          onOpenFolder={handleOpenFolder}
          onRenameFile={handleRenameFile}
          onSelectOutlineItem={handleSelectOutlineItem}
          onToggleFolder={fileTree.toggleFolder}
        />
        {store.filePath ? (
          <div
            ref={editorRef}
            className={`flex-1 overflow-auto ${tw.editor.bg}`}
          />
        ) : (
          <EmptyEditor />
        )}
      </div>
    </div>
  )
})

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN },
  },
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
})
;(async function () {
  const [language] = await Promise.all([tinker.getLanguage(), store.init()])
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
