import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import store from './store'
import { tw } from './theme'
import type { PinyinStyle, ChineseMode, Tool, OptionItem } from './types'
import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import ToolTabs from './components/ToolTabs'
import OptionButtons from './components/OptionButtons'
import FlowIndicator from './components/FlowIndicator'
import CopyButton from './components/CopyButton'
import './index.scss'

const pinyinStyles: OptionItem<PinyinStyle>[] = [
  { key: 'tone', label: 'tone' },
  { key: 'toneNum', label: 'toneNum' },
  { key: 'normal', label: 'normal' },
]

const chineseModes: OptionItem<ChineseMode>[] = [
  { key: 'toTraditional', label: 'toTraditional' },
  { key: 'toSimplified', label: 'toSimplified' },
]

const placeholderKeys: Record<Tool, string> = {
  pinyin: 'pinyinPlaceholder',
  rmb: 'rmbPlaceholder',
  chinese: 'chinesePlaceholder',
}

const App = observer(() => {
  const { t } = useTranslation()

  const placeholder = t(placeholderKeys[store.currentTool])

  return (
    <div
      className={className(
        'h-screen flex flex-col p-3 gap-2',
        tw.background.primary,
      )}
    >
      <div className="flex items-center justify-between gap-2 shrink-0">
        <ToolTabs />

        <div className="animate-fade-in">
          {store.currentTool === 'pinyin' && (
            <OptionButtons
              items={pinyinStyles}
              value={store.pinyinStyle}
              onChange={(key) => store.setPinyinStyle(key)}
            />
          )}

          {store.currentTool === 'chinese' && (
            <OptionButtons
              items={chineseModes}
              value={store.chineseMode}
              onChange={(key) => store.setChineseMode(key)}
            />
          )}
        </div>
      </div>

      <textarea
        value={store.input}
        onChange={(e) => store.setInput(e.target.value)}
        placeholder={placeholder}
        className={className(
          'flex-1 min-h-[100px] resize-none rounded-lg p-3.5 text-sm leading-relaxed outline-none',
          'transition-colors duration-200',
          tw.background.secondary,
          tw.text.primary,
          tw.text.placeholder,
          tw.border.primary,
          tw.border.focus,
        )}
      />

      <FlowIndicator />

      <div
        className={className(
          'flex-1 min-h-[80px] rounded-lg p-3.5 relative overflow-auto',
          tw.background.secondary,
          tw.border.primary,
        )}
      >
        <div
          className={className(
            'text-sm leading-relaxed select-text break-all',
            store.currentResult ? tw.text.primary : tw.text.muted,
          )}
        >
          {store.currentResult || placeholder}
        </div>
        <CopyButton />
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
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
