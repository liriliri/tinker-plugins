import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Expand, Shrink } from 'lucide-react'
import fullscreen from 'licia/fullscreen'
import store from '../store'
import { useScreencast } from '../lib/hooks'

interface ScreencastViewProps {
  pageId: string
}

export default observer(function ScreencastView({
  pageId,
}: ScreencastViewProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(fullscreen.isActive())
  const {
    canvasRef,
    pasteText,
    onMouse,
    onWheel,
    onKeyDown,
    onKeyUp,
    onPaste,
  } = useScreencast(pageId)

  useEffect(() => {
    const onChange = () => setIsFullscreen(fullscreen.isActive())
    fullscreen.on('change', onChange)
    return () => {
      fullscreen.off('change', onChange)
    }
  }, [])

  const statusLabel = store.statusKey ? t(store.statusKey) : ''
  const errorLabel = store.screencastErrorRaw
    ? store.screencastErrorRaw
    : store.screencastErrorKey
      ? t(store.screencastErrorKey)
      : ''

  return (
    <div
      ref={rootRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 28,
          padding: '0 8px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
          flexShrink: 0,
        }}
      >
        <a
          href={store.screencastBackHref}
          style={{
            color: 'var(--secondary)',
            textDecoration: 'none',
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          ← {t('back')}
        </a>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 11,
            color: 'var(--muted)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
          title={store.pageUrl || pageId}
        >
          {store.pageUrl || pageId}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--primary)',
            background: 'var(--primary-soft)',
            borderRadius: 3,
            padding: '1px 5px',
            flexShrink: 0,
          }}
        >
          {statusLabel}
        </span>
        {fullscreen.isEnabled() ? (
          <button
            type="button"
            title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              border: 0,
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
            onClick={() => fullscreen.toggle(rootRef.current || undefined)}
          >
            {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
          </button>
        ) : null}
      </header>

      {errorLabel ? (
        <div
          style={{
            padding: '4px 8px',
            background: 'var(--error-bg)',
            color: 'var(--error)',
            borderBottom: '1px solid var(--border)',
            fontSize: 11,
          }}
        >
          {errorLabel}
        </div>
      ) : null}

      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          background: 'var(--canvas)',
        }}
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            outline: 'none',
            touchAction: 'none',
            userSelect: 'none',
            background: 'var(--canvas)',
          }}
          onMouseDown={onMouse}
          onMouseUp={onMouse}
          onMouseMove={onMouse}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onPaste={onPaste}
          onContextMenu={(e) => e.preventDefault()}
        />
        {!store.screencastActive ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--overlay)',
              color: 'var(--overlay-text)',
              fontSize: 18,
            }}
          >
            {t('notActive')}
          </div>
        ) : null}
      </div>

      <form
        style={{
          display: 'flex',
          gap: 0,
          height: 26,
          alignItems: 'stretch',
          margin: 0,
          padding: 0,
          borderTop: '1px solid var(--border)',
          background: 'var(--panel)',
          flexShrink: 0,
        }}
        onSubmit={(event) => {
          event.preventDefault()
          if (!store.screencastActive || !text) return
          pasteText(text)
          setText('')
        }}
      >
        <input
          style={{
            flex: 1,
            minWidth: 0,
            margin: 0,
            padding: '0 8px',
            border: 0,
            borderRadius: 0,
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: 11,
            outline: 'none',
          }}
          type="text"
          value={text}
          placeholder={t('inputText')}
          disabled={!store.screencastActive}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          type="submit"
          disabled={!store.screencastActive || !text}
          style={{
            margin: 0,
            padding: '0 10px',
            border: 0,
            borderRadius: 0,
            background: 'var(--primary)',
            color: 'var(--on-primary)',
            fontSize: 11,
            cursor: 'pointer',
            flexShrink: 0,
            opacity: !store.screencastActive || !text ? 0.5 : 1,
          }}
        >
          {t('send')}
        </button>
      </form>
    </div>
  )
})
