import { useEffect, useState, type CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import ScreencastView from './components/ScreencastView'
import store from './store'

export default observer(function App() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => store.dispose()
  }, [])

  if (!store.authReady) {
    return null
  }

  if (store.needsLogin) {
    return (
      <div style={shellStyle}>
        <div style={{ maxWidth: 360, margin: '0 auto', padding: '28px 16px' }}>
          <form
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            onSubmit={async (event) => {
              event.preventDefault()
              setSubmitting(true)
              try {
                await store.login(username, password)
              } finally {
                setSubmitting(false)
              }
            }}
          >
            <label style={labelStyle}>
              <span>{t('username')}</span>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span>{t('password')}</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </label>
            {store.authError ? (
              <div style={{ color: 'var(--error)', fontSize: 12 }}>
                {t(store.authError)}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...primaryBtnStyle,
                opacity: submitting ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              {t('login')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (store.pageId) {
    return <ScreencastView pageId={store.pageId} />
  }

  if (store.selectingPages) {
    return <PagePicker />
  }

  const errorText =
    store.error === 'noPages'
      ? t('noPages')
      : store.error === 'sessionGone'
        ? t('sessionGone')
        : store.error
          ? store.error
          : ''

  return (
    <div style={shellStyle}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 12px' }}>
        {errorText ? <div style={errorBoxStyle}>{errorText}</div> : null}

        {store.apps.length === 0 ? (
          <div style={emptyStyle}>
            {store.launching ? t('launching') : t('noApps')}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
              gap: 4,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 6,
            }}
          >
            {store.apps.map((app) => (
              <button
                key={app.path}
                type="button"
                disabled={store.launching}
                title={app.path}
                onClick={() => store.launchApp(app)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: 8,
                  border: '1px solid transparent',
                  borderRadius: 6,
                  background: 'transparent',
                  cursor: store.launching ? 'wait' : 'pointer',
                  color: 'var(--text)',
                }}
              >
                <img
                  src={app.icon}
                  alt={app.name}
                  width={36}
                  height={36}
                  style={{ objectFit: 'contain' }}
                  draggable={false}
                />
                <span
                  style={{
                    fontSize: 11,
                    textAlign: 'center',
                    lineHeight: 1.25,
                    color: 'var(--secondary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

const PagePicker = observer(function PagePicker() {
  const { t } = useTranslation()
  const errorText =
    store.error === 'sessionGone'
      ? t('sessionGone')
      : store.error
        ? store.error
        : ''

  return (
    <div style={shellStyle}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 12px' }}>
        <div style={{ marginBottom: 12 }}>
          <a href="/" style={backStyle}>
            ← {t('back')}
          </a>
        </div>

        {errorText ? <div style={errorBoxStyle}>{errorText}</div> : null}

        {store.pages.length === 0 ? (
          <div style={emptyStyle}>
            {store.pagesLoading || !errorText
              ? t('waitingWindows')
              : t('noPages')}
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {store.pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => store.openPage(page)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    background: 'var(--panel)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {page.title || page.url || page.id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
})

const shellStyle: CSSProperties = {
  minHeight: '100%',
  background: 'var(--bg)',
}

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 11,
  color: 'var(--muted)',
}

const inputStyle: CSSProperties = {
  height: 30,
  padding: '0 8px',
  border: '1px solid var(--border)',
  borderRadius: 5,
  background: 'var(--panel)',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
}

const primaryBtnStyle: CSSProperties = {
  height: 30,
  border: 0,
  borderRadius: 5,
  background: 'var(--primary)',
  color: 'var(--on-primary)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}

const backStyle: CSSProperties = {
  color: 'var(--secondary)',
  textDecoration: 'none',
  fontSize: 12,
  flexShrink: 0,
}

const emptyStyle: CSSProperties = {
  padding: 14,
  textAlign: 'center',
  color: 'var(--muted)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  background: 'var(--panel)',
  fontSize: 12,
}

const errorBoxStyle: CSSProperties = {
  marginBottom: 10,
  padding: 8,
  borderRadius: 6,
  background: 'var(--error-bg)',
  color: 'var(--error)',
  fontSize: 12,
}
