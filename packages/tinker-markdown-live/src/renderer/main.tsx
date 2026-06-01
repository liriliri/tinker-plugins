import { useCallback, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import { initReactI18next, useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import FileTree from './components/FileTree'
import Toolbar from './components/Toolbar'
import { useFileTree } from './hooks/useFileTree'
import { pickMarkdownSavePath } from './lib/dialog'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const DEFAULT_CONTENT = `# Welcome to Markdown Live

Start writing your markdown here...
`

const App = observer(() => {
  const { t } = useTranslation()
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const fileTree = useFileTree()

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

  const openFile = useCallback(
    async (path: string) => {
      const content = await markdown.readFile(path)
      store.setFilePath(path)
      await initEditor(content)
    },
    [initEditor],
  )

  useEffect(() => {
    initEditor(DEFAULT_CONTENT)
    return () => {
      crepeRef.current?.destroy()
    }
  }, [initEditor])

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
    await markdown.writeFile(savePath, store.content)
    if (fileTree.sourcePath) {
      await fileTree.refresh()
    } else {
      fileTree.setRootFromFilePath(savePath)
    }
  }, [fileTree])

  const handleNew = useCallback(async () => {
    store.setFilePath(null)
    await initEditor('')
  }, [initEditor])

  const handleOpenTreeFile = useCallback(
    async (file: { path: string }) => {
      await openFile(file.path)
    },
    [openFile],
  )

  return (
    <div className={`flex h-screen flex-col ${tw.app.bg}`}>
      <Toolbar
        fileName={store.fileName}
        fileTreeOpen={fileTree.open}
        onNew={handleNew}
        onOpenFolder={handleOpenFolder}
        onSave={handleSave}
        onToggleFileTree={() => fileTree.toggle(store.filePath)}
      />
      <div className="flex min-h-0 flex-1">
        <FileTree
          currentPath={store.filePath}
          files={fileTree.files}
          open={fileTree.open}
          rootName={fileTree.rootName}
          rootPath={fileTree.sourcePath}
          width={fileTree.width}
          onOpenFile={handleOpenTreeFile}
          onOpenFolder={handleOpenFolder}
        />
        <div
          ref={editorRef}
          className={`flex-1 overflow-auto ${tw.editor.bg}`}
        />
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
