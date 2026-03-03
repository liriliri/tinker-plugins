import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEffect, useState, useRef } from 'react'
import { Camera, Copy, Check, Save, WrapText } from 'lucide-react'
import store from './store'
import { tw } from './theme'
import className from 'licia/className'
import ImageUpload from './components/ImageUpload'
import ResultPanel from './components/ResultPanel'
import LangSelect from './components/LangSelect'

const App = observer(() => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const captureScreen = async () => {
    const url = await tinker.captureScreen()
    if (url) {
      store.setImage(url)
      store.recognize()
    }
  }

  const copyText = () => {
    if (!store.result) return
    navigator.clipboard.writeText(store.displayResult)
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 1500)
  }

  const saveText = async () => {
    if (!store.result) return
    const { filePath } = await tinker.showSaveDialog({
      defaultPath: 'ocr-result.txt',
      filters: [{ name: 'Text', extensions: ['txt'] }],
    })
    if (filePath) await tinker.writeFile(filePath, store.displayResult)
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            const url = URL.createObjectURL(file)
            store.setImage(url)
            store.recognize()
          }
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  return (
    <div
      className={className(
        'h-screen flex flex-col',
        tw.background.primary,
        tw.text.primary,
      )}
    >
      <div
        className={className(
          'flex items-center gap-2 px-4 h-11 shrink-0 border-b',
          tw.border.color,
          tw.background.results,
        )}
      >
        <button
          title={t('screenshot')}
          className={className(
            'p-1.5 rounded cursor-pointer transition-colors duration-150',
            tw.button.icon,
          )}
          onClick={captureScreen}
        >
          <Camera className="w-4 h-4" />
        </button>
        {store.imageUrl && (
          <button
            disabled={store.isRecognizing}
            className={className(
              'text-xs px-3 py-1 rounded cursor-pointer font-medium transition-all duration-150',
              tw.accent.bg,
              tw.accent.text,
              'hover:brightness-105',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            onClick={() => store.recognize()}
          >
            {store.isRecognizing ? t('recognizing') : t('recognize')}
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            title={t('stripNewlines')}
            className={className(
              'p-1.5 rounded cursor-pointer transition-colors duration-150',
              store.stripNewlines ? tw.button.activeToggle : tw.button.icon,
            )}
            onClick={() => store.toggleStripNewlines()}
          >
            <WrapText className="w-4 h-4" />
          </button>
          <div className={className('w-px h-3.5 mx-1', tw.divider)} />
          <LangSelect />
          <div className={className('w-px h-3.5 mx-1', tw.divider)} />
          <button
            title={copied ? t('copied') : t('copy')}
            disabled={!store.result}
            className={className(
              'p-1.5 rounded transition-colors duration-150',
              store.result
                ? `cursor-pointer ${tw.button.icon}`
                : tw.button.disabled,
            )}
            onClick={copyText}
          >
            {copied ? (
              <Check className={className('w-4 h-4', tw.accent.blue)} />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            title={t('save')}
            disabled={!store.result}
            className={className(
              'p-1.5 rounded transition-colors duration-150',
              store.result
                ? `cursor-pointer ${tw.button.icon}`
                : tw.button.disabled,
            )}
            onClick={saveText}
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 p-3">
          <ImageUpload />
        </div>
        <div
          className={className(
            'w-1/2 shrink-0 flex flex-col border-l',
            tw.border.color,
            tw.background.results,
          )}
        >
          <ResultPanel />
        </div>
      </div>
    </div>
  )
})

export default App
