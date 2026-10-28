import { useRef, useState, type DragEvent } from 'react'
import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import contain from 'licia/contain'
import endWith from 'licia/endWith'
import find from 'licia/find'
import lowerCase from 'licia/lowerCase'
import toArr from 'licia/toArr'
import { FolderOutput, Loader2, PackageOpen, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getBasename } from '../../common/format'
import store from '../store'
import { tw } from '../theme'
import FileList from './FileList'
import FilePreview from './FilePreview'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import CreateNameDialog from './CreateNameDialog'
import ErrorToast from './ErrorToast'

function isPackageFile(file: File): boolean {
  return endWith(lowerCase(file.name), '.asar')
}

const AsarViewer = observer(() => {
  const { t } = useTranslation()
  const { asarPath, loading, files, extracting } = store
  const hasPackage = Boolean(asarPath)
  const packageName = asarPath ? getBasename(asarPath) : undefined
  const [dragging, setDragging] = useState(false)
  const dragDepth = useRef(0)

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current += 1
    if (contain(toArr(e.dataTransfer.types), 'Files')) {
      setDragging(true)
    }
  }

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current -= 1
    if (dragDepth.current <= 0) {
      dragDepth.current = 0
      setDragging(false)
    }
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepth.current = 0
    setDragging(false)

    if (store.loading) {
      return
    }

    const file = find(toArr(e.dataTransfer.files), isPackageFile)
    if (!file) {
      store.showToast(t('dropInvalid'))
      return
    }

    const filePath = tinker.getPathForFile(file)
    if (!filePath) {
      store.showToast(t('dropPathUnavailable'))
      return
    }

    void store.openFile(filePath)
  }

  return (
    <Toast.Provider duration={4000}>
      <div
        className={className('relative h-screen flex flex-col', tw.app)}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {dragging && (
          <div
            className={className(
              'absolute inset-0 z-50 flex items-center justify-center pointer-events-none',
              tw.dropOverlay,
            )}
          >
            <p
              className={className(
                'text-xs font-medium px-3 py-1.5 rounded',
                tw.surfaceRaised,
                tw.text.accent,
              )}
            >
              {t('dropHint')}
            </p>
          </div>
        )}
        <DeleteConfirmDialog />
        <CreateNameDialog />
        <header
          className={className(
            'shrink-0 flex items-center gap-2 px-2.5 h-9 border-b',
            tw.surface,
            tw.border.subtle,
          )}
        >
          <button
            onClick={() => store.openDialog()}
            disabled={loading}
            className={className(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium',
              'transition-colors duration-100',
              tw.focusRing,
              tw.btn.primary,
              'disabled:cursor-not-allowed',
            )}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <PackageOpen className="w-3 h-3" strokeWidth={2.2} />
            )}
            {t('openFile')}
          </button>

          {packageName && (
            <span
              className={className(
                'text-[11px] truncate max-w-[200px]',
                tw.mono,
                tw.text.muted,
              )}
              title={packageName}
            >
              {packageName}
            </span>
          )}

          {hasPackage && (
            <div className="ml-auto flex items-center gap-1.5">
              <span
                className={className(
                  'text-[10px] font-medium px-1.5 py-px rounded',
                  tw.badge,
                )}
              >
                {t('fileCount', { count: files.length })}
              </span>
              <button
                onClick={() => store.extractAllToDialog()}
                disabled={extracting || files.length === 0}
                className={className(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium',
                  'transition-colors duration-100',
                  tw.focusRing,
                  tw.btn.secondary,
                  'disabled:opacity-45 disabled:cursor-not-allowed',
                )}
              >
                {extracting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <FolderOutput className="w-3 h-3" strokeWidth={2.2} />
                )}
                {extracting ? t('extracting') : t('extractAll')}
              </button>
              <button
                onClick={() => store.save()}
                disabled={!store.isDirty || store.saving}
                className={className(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium',
                  'transition-colors duration-100',
                  tw.focusRing,
                  store.isDirty ? tw.btn.primary : tw.btn.secondary,
                  'disabled:opacity-45 disabled:cursor-not-allowed',
                )}
              >
                {store.saving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" strokeWidth={2.2} />
                )}
                {store.saving ? t('saving') : t('save')}
              </button>
            </div>
          )}
        </header>

        {!hasPackage && !loading && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center max-w-xs">
              <h2
                className={className(
                  'text-sm font-semibold mb-1 tracking-tight',
                  tw.text.primary,
                )}
              >
                {t('emptyTitle')}
              </h2>
              <p className={className('text-[11px] mb-4', tw.text.muted)}>
                {t('emptyDescription')}
              </p>
              <button
                onClick={() => store.openDialog()}
                className={className(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium',
                  'transition-colors duration-100',
                  tw.focusRing,
                  tw.btn.primary,
                )}
              >
                <PackageOpen className="w-3.5 h-3.5" strokeWidth={2.2} />
                {t('openFile')}
              </button>
            </div>
          </div>
        )}

        {hasPackage && (
          <div className="flex-1 flex min-h-0">
            <aside
              className={className(
                'w-[220px] shrink-0 flex flex-col border-r',
                tw.sidebar,
                tw.border.subtle,
              )}
            >
              <FileList />
            </aside>

            <main className="flex-1 min-w-0 flex flex-col">
              <FilePreview />
            </main>
          </div>
        )}

        {loading && !hasPackage && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Loader2
              className={className('w-4 h-4 animate-spin', tw.text.accent)}
            />
            <p className={className('text-[11px]', tw.text.muted)}>
              {t('opening')}
            </p>
          </div>
        )}
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

export default AsarViewer
