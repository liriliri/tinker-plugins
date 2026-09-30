import { useEffect, useMemo, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import dateFormat from 'licia/dateFormat'
import fileSize from 'licia/fileSize'
import isMobile from 'licia/isMobile'
import map from 'licia/map'
import {
  Download,
  File,
  Folder,
  FolderPlus,
  RotateCw,
  Share2,
  Trash2,
  Upload,
} from 'lucide-react'
import store from './store'
import { tw } from './theme'

const btnClass =
  'h-8 px-3 rounded-md text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed'

export default observer(function App() {
  const { t, i18n } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const mobile = useMemo(() => isMobile(), [])
  const embedded = useMemo(
    () => new URLSearchParams(window.location.search).has('embed'),
    [],
  )

  useEffect(() => {
    void store.init().then(() => {
      const lang = store.info?.language
      if (lang && lang !== i18n.language) {
        void i18n.changeLanguage(lang)
      }
    })
    return () => store.dispose()
  }, [i18n])

  const toastLabel = useMemo(() => {
    if (!store.toast) return ''
    const known = ['deleted', 'uploaded', 'uploadFailed', 'updated']
    return known.includes(store.toast) ? t(store.toast) : store.toast
  }, [store.toast, t])

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) void store.uploadFiles(e.target.files)
    e.target.value = ''
  }

  if (!store.ready) return null

  return (
    <div
      className={className(
        'min-h-full flex flex-col',
        tw.background.app,
        tw.text.primary,
      )}
    >
      {embedded ? null : (
        <header
          className={className(
            'border-b px-5 py-3.5 sticky top-0 z-10 backdrop-blur-md',
            tw.border.divider,
            tw.background.panel,
          )}
        >
          <div className="flex items-center gap-2.5 max-w-5xl mx-auto">
            <div
              className={className(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                tw.background.icon,
                tw.text.link,
              )}
            >
              <Share2 size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold leading-tight">
                {t('title')}
              </h1>
              <p className={className('text-[12px] mt-0.5', tw.text.secondary)}>
                {t('subtitle')}
              </p>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 w-full max-w-5xl mx-auto px-5 py-5 flex flex-col gap-4">
        {store.error ? (
          <div className={className('text-[13px]', tw.text.danger)}>
            {t('loadError')}: {store.error}
          </div>
        ) : null}

        <section className="flex flex-wrap items-center gap-2">
          <nav
            className={className(
              'min-h-5 min-w-0 flex-1 text-[13px] flex flex-wrap items-center gap-1',
              tw.text.secondary,
            )}
          >
            {store.breadcrumb.length ? (
              <button
                type="button"
                className={tw.text.link}
                onClick={() => store.navigateTo('')}
              >
                {t('root')}
              </button>
            ) : (
              <span className={tw.text.primary}>{t('root')}</span>
            )}
            {map(store.breadcrumb, (part, index) => {
              const path = store.breadcrumb.slice(0, index + 1).join('/')
              const isLast = index === store.breadcrumb.length - 1
              return (
                <span key={path} className="inline-flex items-center gap-1">
                  <span>/</span>
                  {isLast ? (
                    <span className={tw.text.primary}>{part}</span>
                  ) : (
                    <button
                      type="button"
                      className={tw.text.link}
                      onClick={() => store.navigateTo(path)}
                    >
                      {part}
                    </button>
                  )}
                </span>
              )
            })}
          </nav>
          {store.currentItems.length ? (
            <span className={className('text-[12px]', tw.text.muted)}>
              {t('itemCount', { count: store.currentItems.length })}
            </span>
          ) : null}
          <button
            type="button"
            className={className(btnClass, tw.button.primary)}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            {t('addFiles')}
          </button>
          {mobile ? null : (
            <button
              type="button"
              className={className(btnClass, tw.button.ghost)}
              onClick={() => folderInputRef.current?.click()}
            >
              <FolderPlus size={14} />
              {t('addFolder')}
            </button>
          )}
          <button
            type="button"
            className={className(btnClass, tw.button.ghost)}
            title={t('refresh')}
            onClick={() => void store.refreshFiles()}
          >
            <RotateCw size={14} />
            {t('refresh')}
          </button>
        </section>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onPickFiles}
        />
        {mobile ? null : (
          <input
            ref={(node) => {
              folderInputRef.current = node
              if (node) node.setAttribute('webkitdirectory', '')
            }}
            type="file"
            className="hidden"
            onChange={onPickFiles}
          />
        )}

        {mobile ? null : (
          <div
            className={className(
              'rounded-lg border border-dashed px-4 py-6 text-center transition-colors cursor-pointer',
              store.dragOver ? tw.border.dropActive : tw.border.drop,
              store.dragOver ? tw.background.dropActive : tw.background.drop,
            )}
            onDragOver={(e) => {
              e.preventDefault()
              store.setDragOver(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              store.setDragOver(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              store.setDragOver(false)
              if (e.dataTransfer.files.length) {
                void store.uploadFiles(e.dataTransfer.files)
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload
              size={22}
              className={className('mx-auto mb-2', tw.text.muted)}
            />
            <div className="text-[13px] font-medium">{t('dropTitle')}</div>
            <div className={className('text-[12px] mt-1', tw.text.muted)}>
              {t('dropHint')}
            </div>
          </div>
        )}

        <FileList />
      </main>

      {store.uploading ? (
        <div
          className={className(
            'fixed bottom-4 right-4 w-64 rounded-lg border p-3 shadow-lg',
            tw.border.divider,
            tw.background.panel,
          )}
        >
          <div className="text-[13px] mb-2">
            {t('uploading', { percent: store.uploadPercent })}
          </div>
          <div
            className={className(
              'h-1.5 rounded overflow-hidden',
              tw.progress.track,
            )}
          >
            <div
              className={className('h-full w-full', tw.progress.fill)}
              style={store.uploadFillStyle}
            />
          </div>
        </div>
      ) : null}

      {toastLabel ? (
        <div
          className={className(
            'fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md text-[13px]',
            tw.toast,
          )}
        >
          {toastLabel}
        </div>
      ) : null}
    </div>
  )
})

const FileList = observer(function FileList() {
  const { t } = useTranslation()
  const items = store.currentItems

  if (!items.length) {
    return (
      <div
        className={className(
          'rounded-lg border px-4 py-10 text-center text-[13px]',
          tw.border.divider,
          tw.background.panel,
          tw.text.muted,
        )}
      >
        {store.currentPath ? t('emptyFolder') : t('empty')}
      </div>
    )
  }

  return (
    <div
      className={className(
        'rounded-lg border overflow-hidden',
        tw.border.divider,
        tw.background.panel,
      )}
    >
      <div
        className={className(
          'hidden sm:grid grid-cols-[24px_1fr_80px_128px_56px] gap-2 px-3 py-2 text-[11px] border-b',
          tw.border.divider,
          tw.text.muted,
        )}
      >
        <span />
        <span>{t('name')}</span>
        <span>{t('size')}</span>
        <span>{t('modified')}</span>
        <span />
      </div>
      {map(items, (item) => (
        <div
          key={item.relativePath}
          className={className(
            'grid grid-cols-[24px_1fr_auto] sm:grid-cols-[24px_1fr_80px_128px_56px] gap-2 items-center px-3 py-2.5 border-b last:border-b-0 text-[13px]',
            tw.border.divider,
            tw.background.rowHover,
          )}
        >
          <span className={item.isFolder ? tw.text.folder : tw.text.muted}>
            {item.isFolder ? <Folder size={15} /> : <File size={15} />}
          </span>
          {item.isFolder ? (
            <button
              type="button"
              className={className('text-left truncate', tw.text.link)}
              onClick={() => store.navigateTo(item.relativePath)}
            >
              {item.name}
            </button>
          ) : (
            <span className="truncate">{item.name}</span>
          )}
          <span
            className={className('hidden sm:block text-[12px]', tw.text.muted)}
          >
            {item.isFolder ? '—' : fileSize(item.size)}
          </span>
          <span
            className={className('hidden sm:block text-[12px]', tw.text.muted)}
          >
            {item.lastModified
              ? dateFormat(new Date(item.lastModified), 'yyyy-mm-dd HH:MM')
              : '—'}
          </span>
          <span className="flex items-center justify-end gap-3">
            {item.isFolder ? null : (
              <a
                className={tw.button.icon}
                href={`/download/${encodeURIComponent(item.relativePath)}`}
                title={t('download')}
              >
                <Download size={14} />
              </a>
            )}
            <button
              type="button"
              className={tw.button.iconDanger}
              title={t('delete')}
              onClick={() => void store.deletePath(item.relativePath)}
            >
              <Trash2 size={14} />
            </button>
          </span>
        </div>
      ))}
    </div>
  )
})
