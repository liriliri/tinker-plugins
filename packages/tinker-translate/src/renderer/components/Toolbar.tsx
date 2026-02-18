import * as Tooltip from '@radix-ui/react-tooltip'
import { ArrowLeftRight, Check, Copy } from 'lucide-react'
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
  canCopy: boolean
  isTranslating: boolean
  copied: boolean
  onServiceChange: (s: Service) => void
  onSourceLangChange: (v: string) => void
  onTargetLangChange: (v: string) => void
  onSwap: () => void
  onClear: () => void
  onTranslate: () => void
  onCopy: () => void
}

function Toolbar({
  service,
  sourceLang,
  targetLang,
  currentLanguages,
  canSwap,
  canClear,
  canTranslate,
  canCopy,
  isTranslating,
  copied,
  onServiceChange,
  onSourceLangChange,
  onTargetLangChange,
  onSwap,
  onClear,
  onTranslate,
  onCopy,
}: ToolbarProps) {
  return (
    <div className="flex items-center px-2.5 py-2 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0 min-h-11.5">
      {/* Left: service toggle — flex-1 so it balances the right side */}
      <div className="flex-1 flex items-center">
        <div className="relative flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg p-0.75 shrink-0">
          <div
            className={className(
              'service-pill bg-white dark:bg-stone-700 shadow-sm dark:shadow-none ring-[0.5px] ring-black/5 dark:ring-white/5',
              service === 'bing' && 'service-pill--bing',
            )}
          />
          {services.map((s) => (
            <button
              key={s.value}
              onClick={() => onServiceChange(s.value)}
              className={className(
                'relative z-10 px-2.5 py-0.5 text-[11.5px] font-semibold rounded-[5px] transition-colors duration-150 cursor-pointer border-none bg-transparent',
                service === s.value
                  ? 'text-stone-900 dark:text-stone-100'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center: language row — not flex-1, so it stays truly centered */}
      <div className="flex items-center gap-0.5">
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
                'swap-btn flex items-center justify-center w-7 h-7 rounded-md border-none bg-transparent transition-colors duration-150 shrink-0 cursor-pointer',
                canSwap
                  ? 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  : 'text-stone-300 dark:text-stone-700 cursor-not-allowed',
              )}
            >
              <ArrowLeftRight className="swap-icon w-3.5 h-3.5" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md"
              sideOffset={5}
            >
              交换语言
              <Tooltip.Arrow className="fill-stone-900 dark:fill-stone-100" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <LangSelect
          value={targetLang}
          onValueChange={onTargetLangChange}
          langs={currentLanguages}
          excludeAuto
        />
      </div>

      {/* Right: actions — flex-1 + justify-end to mirror the left side */}
      <div className="flex-1 flex items-center justify-end gap-1.5">
        <button
          onClick={onCopy}
          disabled={!canCopy}
          className={className(
            'flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium rounded-md border transition-all duration-150 cursor-pointer bg-transparent',
            canCopy
              ? copied
                ? 'border-emerald-400 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200'
              : 'border-stone-100 dark:border-stone-800 text-stone-300 dark:text-stone-700 cursor-not-allowed',
          )}
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? '已复制' : '复制'}
        </button>
        <button
          onClick={onClear}
          disabled={!canClear}
          className={className(
            'px-2.5 py-1 text-[11.5px] font-medium rounded-md border transition-colors duration-150 cursor-pointer bg-transparent',
            canClear
              ? 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200'
              : 'border-stone-100 dark:border-stone-800 text-stone-300 dark:text-stone-700 cursor-not-allowed',
          )}
        >
          清空
        </button>
        <button
          onClick={onTranslate}
          disabled={!canTranslate}
          className={className(
            'px-3 py-1 text-[11.5px] font-semibold rounded-md border-none transition-all duration-150 min-w-13 flex items-center justify-center gap-1 cursor-pointer',
            canTranslate
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300 hover:-translate-y-px active:translate-y-0'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600 cursor-not-allowed',
          )}
        >
          {isTranslating ? (
            <span className="flex items-center gap-0.75 h-3">
              <span className="dot dot-1" />
              <span className="dot dot-2" />
              <span className="dot dot-3" />
            </span>
          ) : (
            '翻译'
          )}
        </button>
      </div>
    </div>
  )
}

export default Toolbar
