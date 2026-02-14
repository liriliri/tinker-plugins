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
              'bg-transparent',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500',
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
                'text-zinc-500 dark:text-zinc-400',
              )}
            >
              {description || emoji.name}
            </div>

            {/* Copied indicator */}
            {copied && (
              <div
                className={className(
                  'absolute inset-0 flex items-center justify-center rounded-lg',
                  'bg-yellow-400 dark:bg-yellow-500',
                  'text-zinc-900',
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
              'px-2.5 py-2 rounded-md shadow-lg z-50',
              'bg-zinc-800 dark:bg-zinc-700',
              'text-white',
              'text-xs max-w-xs',
              'animate-in fade-in-0 zoom-in-95',
            )}
            sideOffset={5}
          >
            <div className="font-medium mb-0.5">
              {emoji.emoji} {description}
            </div>
            <div className="opacity-60 text-[10px]">{emoji.shortcode}</div>
            <Tooltip.Arrow className="fill-zinc-800 dark:fill-zinc-700" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
})

export default EmojiCard
