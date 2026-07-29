import { useEffect, useState, type MouseEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { PALETTE_COLORS } from '../lib/paletteColors'
import { tw } from '../theme'

const Palette = observer(() => {
  const { t } = useTranslation()
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    if (!picking) return
    const stop = () => setPicking(false)
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [picking])

  function pick(color: string, e: MouseEvent, noUndo: boolean) {
    e.preventDefault()
    const isStroke = store.colorTarget === 'stroke' || e.shiftKey
    store.applyColor(isStroke ? 'stroke' : 'fill', color, noUndo)
  }

  return (
    <div
      id="palette"
      className={className(
        '[grid-area:palette] z-[5] grid h-[var(--palette-h)] grid-cols-[repeat(35,1fr)] grid-rows-2 gap-px px-[3px] pb-[3px] pt-0.5',
        tw.border.top,
        tw.background.palette,
      )}
      title={t('paletteHint')}
    >
      {PALETTE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={className(
            'relative m-0 min-h-0 min-w-0 cursor-crosshair rounded-sm border-0 p-0 transition-transform duration-100',
            'hover:z-[1] hover:scale-[1.08] motion-reduce:transition-none motion-reduce:hover:scale-100',
            tw.shadow.paletteItem,
            tw.shadow.paletteItemHover,
            { 'palette-transparent': color === 'none' },
          )}
          style={color === 'none' ? undefined : { backgroundColor: color }}
          onMouseDown={(e) => {
            setPicking(true)
            pick(color, e, false)
          }}
          onMouseEnter={(e) => {
            if (!picking) return
            pick(color, e, true)
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
      ))}
    </div>
  )
})

export default Palette
