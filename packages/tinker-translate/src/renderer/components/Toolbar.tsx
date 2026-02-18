import * as Tooltip from '@radix-ui/react-tooltip'
import { ArrowLeftRight } from 'lucide-react'
import className from 'licia/className'
import LangSelect from './LangSelect'
import { services, type Language, type Service } from '../lib/languages'

interface ToolbarProps {
  service: Service
  sourceLang: string
  targetLang: string
  currentLanguages: Language[]
  canSwap: boolean
  canClear: boolean
  canTranslate: boolean
  isTranslating: boolean
  onServiceChange: (s: Service) => void
  onSourceLangChange: (v: string) => void
  onTargetLangChange: (v: string) => void
  onSwap: () => void
  onClear: () => void
  onTranslate: () => void
}

function Toolbar({
  service,
  sourceLang,
  targetLang,
  currentLanguages,
  canSwap,
  canClear,
  canTranslate,
  isTranslating,
  onServiceChange,
  onSourceLangChange,
  onTargetLangChange,
  onSwap,
  onClear,
  onTranslate,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 shrink-0 bg-neutral-100 dark:bg-[#303030]">
      {/* Service toggle */}
      <div className="flex items-center rounded-md border border-neutral-300 dark:border-neutral-700 overflow-hidden mr-1">
        {services.map((s) => (
          <button
            key={s.value}
            onClick={() => onServiceChange(s.value)}
            className={className(
              'px-3 py-1 text-sm font-medium transition-colors',
              service === s.value
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <LangSelect
        value={sourceLang}
        onValueChange={onSourceLangChange}
        langs={currentLanguages}
      />

      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={onSwap}
            disabled={!canSwap}
            className={className(
              'p-1.5 rounded-md transition-colors',
              canSwap
                ? 'text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20'
                : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed',
            )}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="px-2 py-1 text-xs rounded bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 shadow"
            sideOffset={4}
          >
            Swap languages
            <Tooltip.Arrow className="fill-neutral-800 dark:fill-neutral-200" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <LangSelect
        value={targetLang}
        onValueChange={onTargetLangChange}
        langs={currentLanguages}
        excludeAuto
      />

      <div className="flex gap-2 ml-auto">
        <button
          onClick={onClear}
          disabled={!canClear}
          className={className(
            'px-3 py-1 rounded-md text-sm font-medium transition-colors border',
            canClear
              ? 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-600 cursor-not-allowed',
          )}
        >
          清空
        </button>
        <button
          onClick={onTranslate}
          disabled={!canTranslate}
          className={className(
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            canTranslate
              ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed',
          )}
        >
          {isTranslating ? '翻译中...' : '翻译'}
        </button>
      </div>
    </div>
  )
}

export default Toolbar
