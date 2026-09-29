import { useEffect, type MouseEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import fullscreen from 'licia/fullscreen'
import lowerCase from 'licia/lowerCase'
import store from '../store'
import { tw } from '../theme'

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  store.prev()
}

const TestStage = observer(function TestStage() {
  const { t } = useTranslation()
  const {
    index,
    total,
    hintVisible,
    slideNameKey,
    stageStyle,
    hintStyle,
    hintAccentStyle,
  } = store

  useEffect(() => {
    const onChange = () => {
      if (!fullscreen.isActive()) store.stop()
    }
    fullscreen.on('change', onChange)
    return () => {
      fullscreen.off('change', onChange)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (fullscreen.isActive()) fullscreen.exit()
        else store.stop()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        store.next()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        store.prev()
        return
      }
      if (lowerCase(e.key) === 'h') {
        e.preventDefault()
        store.showHint()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const name = t(slideNameKey)

  return (
    <div
      className={className(tw.appShell, 'cursor-none')}
      style={stageStyle}
      onClick={() => store.next()}
      onContextMenu={onContextMenu}
    >
      <div
        className={className(
          tw.hint,
          hintVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
        )}
        style={hintStyle}
      >
        <span style={hintAccentStyle}>◆ </span>
        {t('hint', { name, current: index + 1, total })}
      </div>
    </div>
  )
})

export default TestStage
