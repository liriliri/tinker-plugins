import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import delay from 'licia/delay'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'
import { saveImage } from '../lib/image'
import type { MemeItem } from '../types'

interface MemeCardProps {
  item: MemeItem
}

type Feedback = 'copied' | 'failed' | null

const MemeCard = observer(({ item }: MemeCardProps) => {
  const { t } = useTranslation()
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [failed, setFailed] = useState(false)

  if (failed) return null

  const showFeedback = (type: Feedback) => {
    setFeedback(type)
    delay(setFeedback, 1200, null)
  }

  const handleClick = async () => {
    try {
      await meme.copyImage(item.url)
      showFeedback('copied')
    } catch {
      showFeedback('failed')
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('save'),
        click: () => saveImage(item.url),
      },
    ])
  }

  const handleError = () => {
    setFailed(true)
    store.removeMeme(item.url)
  }

  return (
    <div
      className={className(
        'relative group cursor-pointer rounded-lg overflow-hidden aspect-square',
        tw.background.secondary,
        tw.border.primary,
        'transition-all hover:shadow-md focus:outline-none',
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <img
        src={item.url}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={handleError}
        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
      />

      {feedback && (
        <div
          className={className(
            'absolute inset-0 flex items-center justify-center',
            feedback === 'copied'
              ? className(tw.accent.bg, tw.accent.text)
              : tw.feedback.failed,
          )}
        >
          <span className="text-sm font-semibold">
            {feedback === 'copied' ? t('copied') : t('copyFailed')}
          </span>
        </div>
      )}
    </div>
  )
})

export default MemeCard
