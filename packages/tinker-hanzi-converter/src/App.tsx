import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { Copy, Check, ArrowDown } from 'lucide-react'
import store from './store'
import { tw } from './theme'
import type { PinyinStyle, ChineseMode, Tool } from './types'

const tools: { key: Tool; label: string; icon: string }[] = [
  { key: 'pinyin', label: 'tabPinyin', icon: '拼' },
  { key: 'rmb', label: 'tabRmb', icon: '¥' },
  { key: 'chinese', label: 'tabChinese', icon: '繁' },
]

const pinyinStyles: { key: PinyinStyle; label: string }[] = [
  { key: 'tone', label: 'tone' },
  { key: 'toneNum', label: 'toneNum' },
  { key: 'normal', label: 'normal' },
]

const chineseModes: { key: ChineseMode; label: string }[] = [
  { key: 'toTraditional', label: 'toTraditional' },
  { key: 'toSimplified', label: 'toSimplified' },
]

const ToolTabs = observer(() => {
  const { t } = useTranslation()

  return (
    <div
      className={className(
        'flex gap-1 p-0.5 rounded-lg',
        tw.background.segmented,
      )}
    >
      {tools.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => store.setCurrentTool(key)}
          className={className(
            'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200',
            store.currentTool === key
              ? `${tw.background.segmentedActive} font-medium ${tw.text.segmentedActive}`
              : `${tw.text.inactive} ${tw.text.inactiveHover}`,
          )}
        >
          <span
            className={className(
              'text-xs font-bold w-5 h-5 flex items-center justify-center rounded',
              store.currentTool === key ? tw.badge.active : tw.badge.inactive,
            )}
          >
            {icon}
          </span>
          {t(label)}
        </button>
      ))}
    </div>
  )
})

const OptionButtons = observer(
  ({
    items,
    value,
    onChange,
  }: {
    items: { key: string; label: string }[]
    value: string
    onChange: (key: string) => void
  }) => {
    const { t } = useTranslation()

    return (
      <div
        className={className(
          'flex gap-0.5 p-0.5 rounded-md',
          tw.background.segmented,
        )}
      >
        {items.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={className(
              'px-2.5 py-1 text-xs rounded transition-all duration-200',
              value === key
                ? `${tw.background.segmentedActive} font-medium ${tw.text.segmentedOptionActive}`
                : `${tw.text.inactive} ${tw.text.inactiveHover}`,
            )}
          >
            {t(label)}
          </button>
        ))}
      </div>
    )
  },
)

const CopyButton = observer(() => {
  const { t } = useTranslation()

  if (!store.currentResult) return null

  return (
    <button
      onClick={() => store.copyResult()}
      className={className(
        'absolute top-2.5 right-2.5 p-1.5 rounded-md transition-all duration-200',
        store.copied ? tw.copy.copied : tw.copy.idle,
      )}
      title={t('copy')}
    >
      {store.copied ? (
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  )
})

const FlowIndicator = () => (
  <div className="flex items-center justify-center shrink-0 py-0.5">
    <div className="flex items-center gap-2">
      <div className={className('h-px w-6', tw.divider.line)} />
      <ArrowDown size={12} className={tw.text.divider} />
      <div className={className('h-px w-6', tw.divider.line)} />
    </div>
  </div>
)

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
              onChange={(key) => store.setPinyinStyle(key as PinyinStyle)}
            />
          )}

          {store.currentTool === 'chinese' && (
            <OptionButtons
              items={chineseModes}
              value={store.chineseMode}
              onChange={(key) => store.setChineseMode(key as ChineseMode)}
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

export default App
