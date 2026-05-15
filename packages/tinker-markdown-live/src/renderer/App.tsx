import { useCallback, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import '@milkdown/crepe/theme/frame-dark.css'
import store from './store'
import { tw } from './theme'

const DEFAULT_CONTENT = `# Welcome to Markdown Live

Start writing your markdown here...
`

const App = observer(() => {
  const { t } = useTranslation()
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)

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

  useEffect(() => {
    initEditor(DEFAULT_CONTENT)
    return () => {
      crepeRef.current?.destroy()
    }
  }, [initEditor])

  const handleOpen = useCallback(async () => {
    const result = await markdown.showOpenDialog()
    if (result && result.length > 0) {
      const path = result[0]
      const content = await markdown.readFile(path)
      store.setFilePath(path)
      tinker.setTitle(store.fileName)
      await initEditor(content)
    }
  }, [initEditor])

  const handleSave = useCallback(async () => {
    let savePath = store.filePath
    if (!savePath) {
      const result = await markdown.showSaveDialog()
      if (!result) return
      savePath = result
      store.setFilePath(savePath)
    }
    await markdown.writeFile(savePath, store.content)
    tinker.setTitle(store.fileName)
  }, [])

  const handleNew = useCallback(async () => {
    store.setFilePath(null)
    tinker.setTitle('Markdown Live')
    await initEditor('')
  }, [initEditor])

  return (
    <div className={`h-screen flex flex-col ${store.isDark ? 'dark' : ''}`}>
      <div
        className={`flex items-center gap-1 px-2 py-1 border-b shrink-0 ${tw.toolbar.border} ${tw.toolbar.bg}`}
      >
        <button
          onClick={handleNew}
          className={`px-2 py-1 text-xs rounded ${tw.toolbarBtn.hover} ${tw.toolbarBtn.text}`}
        >
          {t('new')}
        </button>
        <button
          onClick={handleOpen}
          className={`px-2 py-1 text-xs rounded ${tw.toolbarBtn.hover} ${tw.toolbarBtn.text}`}
        >
          {t('open')}
        </button>
        <button
          onClick={handleSave}
          className={`px-2 py-1 text-xs rounded ${tw.toolbarBtn.hover} ${tw.toolbarBtn.text}`}
        >
          {t('save')}
        </button>
        <span className="ml-2 text-xs text-stone-400 truncate">
          {store.filePath || t('untitled')}
        </span>
      </div>
      <div ref={editorRef} className={`flex-1 overflow-auto ${tw.editor.bg}`} />
    </div>
  )
})

export default App
