import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Select from '@radix-ui/react-select'
import { ArrowLeftRight, Check, ChevronDown, Copy } from 'lucide-react'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import LangSelect from './LangSelect'
import {
  languages,
  bingLanguages,
  services,
  type Service,
} from '../lib/languages'
import { tw } from '../theme'
import store from '../store'

const Toolbar = observer(() => {
  const { t } = useTranslation()
  const currentLanguages = store.service === 'bing' ? bingLanguages : languages

  return (
    <div
      className={`flex items-center px-2.5 py-2 ${tw.background.toolbar} border-b ${tw.border.divider} shrink-0 min-h-11.5`}
    >
      {/* Left: service select — flex-1 so it balances the right side */}
      <div className="flex-1 flex items-center">
        <Select.Root
          value={store.service}
          onValueChange={(v) => store.handleServiceChange(v as Service)}
        >
          <Select.Trigger
            className={`inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium rounded-md border bg-transparent ${tw.select.trigger} ${tw.border.divider} transition-colors duration-150 cursor-pointer outline-none focus:outline-none`}
          >
            <Select.Value />
            <Select.Icon className="ml-auto shrink-0">
              <ChevronDown className={`w-3 h-3 ${tw.select.chevron}`} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className={`overflow-hidden rounded-xl border ${tw.select.content} shadow-[0_8px_24px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-50`}
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport className="p-1">
                {services.map((s) => (
                  <Select.Item
                    key={s.value}
                    value={s.value}
                    className={`relative flex items-center px-2 py-1.25 pl-6.5 text-[12px] rounded-md cursor-pointer outline-none ${tw.select.item} data-[state=checked]:font-semibold ${tw.select.itemChecked} transition-colors duration-75`}
                  >
                    <Select.ItemIndicator
                      className={`absolute left-2 flex items-center ${tw.select.itemIndicator}`}
                    >
                      <Check className="w-3 h-3" />
                    </Select.ItemIndicator>
                    <Select.ItemText>{s.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Center: language row — not flex-1, so it stays truly centered */}
      <div className="flex items-center gap-0.5">
        <LangSelect
          value={store.sourceLang}
          onValueChange={(v) => store.setSourceLang(v)}
          langs={currentLanguages}
        />

        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => store.handleSwapLanguages()}
              disabled={!store.canSwap}
              className={className(
                'swap-btn flex items-center justify-center w-7 h-7 rounded-md border-none bg-transparent transition-colors duration-150 shrink-0 cursor-pointer',
                store.canSwap
                  ? `${tw.button.icon.default} ${tw.button.icon.hover}`
                  : `${tw.button.icon.disabled} cursor-not-allowed`,
              )}
            >
              <ArrowLeftRight className="swap-icon w-3.5 h-3.5" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className={`px-2 py-1 text-[11px] font-medium rounded-md ${tw.tooltip.content} shadow-md`}
              sideOffset={5}
            >
              {t('swapLanguages')}
              <Tooltip.Arrow className={tw.tooltip.arrow} />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <LangSelect
          value={store.targetLang}
          onValueChange={(v) => store.setTargetLang(v)}
          langs={currentLanguages}
          excludeAuto
        />
      </div>

      {/* Right: actions — flex-1 + justify-end to mirror the left side */}
      <div className="flex-1 flex items-center justify-end gap-1.5">
        <button
          onClick={() => store.handleCopy()}
          disabled={!store.canCopy}
          className={className(
            'flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium rounded border transition-all duration-150 cursor-pointer bg-transparent',
            store.canCopy
              ? store.copied
                ? tw.button.copy.copied
                : `${tw.button.outlined.default} ${tw.button.outlined.hover}`
              : `${tw.button.outlined.disabled} cursor-not-allowed`,
          )}
        >
          {store.copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {store.copied ? t('copied') : t('copy')}
        </button>
        <button
          onClick={() => store.handleClear()}
          disabled={!store.canClear}
          className={className(
            'px-2.5 py-1 text-[11.5px] font-medium rounded border transition-colors duration-150 cursor-pointer bg-transparent',
            store.canClear
              ? `${tw.button.outlined.default} ${tw.button.outlined.hover}`
              : `${tw.button.outlined.disabled} cursor-not-allowed`,
          )}
        >
          {t('clear')}
        </button>
        <button
          onClick={() => store.handleTranslate()}
          disabled={!store.canTranslate}
          className={className(
            'px-3 h-[26px] text-[11.5px] font-semibold rounded border-none transition-all duration-150 min-w-13 flex items-center justify-center gap-1 cursor-pointer',
            store.canTranslate
              ? `${tw.button.primary.default} ${tw.button.primary.hover}`
              : `${tw.button.primary.disabled} cursor-not-allowed`,
          )}
        >
          {store.isTranslating ? (
            <span className="flex items-center gap-0.75 h-3">
              <span className="dot dot-1" />
              <span className="dot dot-2" />
              <span className="dot dot-3" />
            </span>
          ) : (
            t('translate')
          )}
        </button>
      </div>
    </div>
  )
})

export default Toolbar
