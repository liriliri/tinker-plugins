import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import { initReactI18next, useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
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

const App = observer(() => {
  const { t } = useTranslation()
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const fileTree = useFileTree()
  const outlineItems = useMemo(
    () => getMarkdownOutline(store.content),
    [store.content],
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
    [t],
  )

  const openFile = useCallback(async (path: string) => {
    const content = await tinker.readFile(path, 'utf-8')
    store.setContent(content)
    store.setFilePath(path)
  }, [])

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
  }, [store.filePath, initEditor])

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
    await tinker.writeFile(savePath, store.content)
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
        onOpenFolder={handleOpenFolder}
        onSave={handleSave}
        onToggleFileTree={() => fileTree.toggle(store.filePath)}
      />
      <div className="flex min-h-0 flex-1">
        <FileTree
          currentPath={store.filePath}
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
