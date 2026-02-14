import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import type { EmojiData } from '../types'
import store from '../store'
import { useState } from 'react'

interface EmojiCardProps {
  emoji: EmojiData
}

const EmojiCard = observer(({ emoji }: EmojiCardProps) => {
  const { i18n, t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleClick = () => {
    store.copyToClipboard(emoji.emoji)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  const description =
    i18n.language === 'zh-CN' ? emoji.description.zh : emoji.description.en

  return (
    <Tooltip.Provider delayDuration={400}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className={className(
              'relative group cursor-pointer rounded-lg p-2.5 transition-all',
              tw.background.transparent,
              tw.background.hover,
              'active:scale-95',
              'focus:outline-none',
              tw.accent.focusRing,
            )}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick()
              }
            }}
          >
            {/* Emoji */}
            <div className="text-3xl text-center mb-1.5">{emoji.emoji}</div>

            {/* Description */}
            <div
              className={className(
                'text-[10px] text-center truncate leading-tight',
                tw.text.muted,
              )}
            >
              {description || emoji.name}
            </div>

            {/* Copied indicator */}
            {copied && (
              <div
                className={className(
                  'absolute inset-0 flex items-center justify-center rounded-lg',
                  tw.accent.bg,
                  tw.accent.text,
                  'text-xs font-medium',
                )}
              >
                {t('copied')}
              </div>
            )}
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className={className(
              'px-2.5 py-1.5 rounded-md shadow-lg z-50',
              tw.tooltip.bg,
              tw.text.white,
              'text-xs',
              'animate-in fade-in-0 zoom-in-95',
            )}
            sideOffset={5}
          >
            {`:${emoji.name}:`}
            <Tooltip.Arrow className={tw.tooltip.arrow} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
})

export default EmojiCard
