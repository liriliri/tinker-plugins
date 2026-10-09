import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import extend from 'licia/extend'
import { slides, slideStyle, slideThumbStyle } from '../lib/slides'
import type { Slide } from '../types'
import { bezelStyle, colors, mistStyle, raisedStyle, tw } from '../theme'

interface SwatchDotProps {
  slide: Slide
  active: boolean
}

function SwatchDot({ slide, active }: SwatchDotProps) {
  const style = extend({}, slideThumbStyle(slide), {
    borderColor: colors.line,
    boxShadow: active ? `0 0 0 1px ${colors.signal}` : 'none',
  })

  return (
    <span
      className={className(
        'h-2.5 w-2.5 shrink-0 rounded-[2px] border',
        active ? 'opacity-100' : 'opacity-45',
      )}
      style={style}
    />
  )
}

function PreviewBezel() {
  const { t } = useTranslation()
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion) return

    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length)
    }, 1600)
    return () => window.clearInterval(id)
  }, [])

  const slide = slides[slideIndex]
  const swatchStyle = slideStyle(slide)

  return (
    <div className={tw.panePad}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className={tw.label} style={mistStyle}>
          {t('preview')}
        </span>
        <span className={tw.mono} style={mistStyle}>
          {t(slide.nameKey)}
        </span>
      </div>

      <div className={tw.bezel} style={bezelStyle}>
        <div
          className="min-h-[140px] flex-1 transition-[background] duration-500 ease-out"
          style={swatchStyle}
        />
        <div
          className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5"
          style={raisedStyle}
        >
          {slides.map((s, i) => (
            <SwatchDot key={s.id} slide={s} active={i === slideIndex} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PreviewBezel
