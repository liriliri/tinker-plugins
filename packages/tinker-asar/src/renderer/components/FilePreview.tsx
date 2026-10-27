import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { FileCode2, FileWarning, FolderOutput, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatSize, getBasename } from '../../common/format'
import { getExtension, getMonacoLanguage } from '../../common/fileType'
import store from '../store'
import { tw } from '../theme'
import TextPreview from './TextPreview'
import UnpackedBadge from './UnpackedBadge'

const FilePreview = observer(() => {
  const { t } = useTranslation()
  const { selectedPath, preview, modifiedPaths } = store

  if (!selectedPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8">
        <FileCode2
          className={className('w-8 h-8', tw.text.faint)}
          strokeWidth={1.5}
        />
        <p className={className('text-sm', tw.text.muted)}>{t('selectFile')}</p>
      </div>
    )
  }

  const fileName = getBasename(selectedPath)
  const language = getMonacoLanguage(getExtension(selectedPath))
  const isModified = modifiedPaths.has(selectedPath)
  const isUnpacked = store.isUnpacked(selectedPath)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className={className(
          'shrink-0 flex items-center gap-3 px-4 h-9 border-b min-w-0',
          tw.surfaceRaised,
          tw.border.subtle,
        )}
      >
        <span
          className={className(
            'text-sm font-medium truncate',
            tw.mono,
            tw.text.primary,
          )}
        >
          {fileName}
        </span>

        {isModified && (
          <span
            className={className('text-[10px] font-medium', tw.text.modified)}
          >
            ●
          </span>
        )}

        <span
          className={className(
            'text-[10px] px-1.5 py-0.5 rounded',
            tw.badge,
            tw.mono,
          )}
        >
          {language}
        </span>

        {isUnpacked && <UnpackedBadge size="md" />}

        {preview?.size != null && (
          <span className={className('text-[10px] shrink-0', tw.text.faint)}>
            {formatSize(preview.size)}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={() => store.extractToDialog([selectedPath])}
            disabled={store.extracting}
            className={className(
              tw.btn.icon,
              tw.btn.iconAccent,
              'disabled:opacity-45 disabled:cursor-not-allowed',
            )}
            title={t('extract')}
            aria-label={t('extract')}
          >
            <FolderOutput className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={() => store.requestDelete(selectedPath, false, fileName)}
            className={className(tw.btn.icon, tw.btn.iconDanger)}
            title={t('delete')}
            aria-label={t('delete')}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {!preview?.success && (
          <div className="flex items-center justify-center h-full p-6">
            <p className={className('text-sm', tw.text.muted)}>
              {preview?.error ?? t('previewFailed')}
            </p>
          </div>
        )}

        {preview?.success &&
          preview.type === 'text' &&
          preview.content != null && (
            <TextPreview
              key={selectedPath}
              path={selectedPath}
              language={language}
              value={preview.content}
            />
          )}

        {preview?.success && preview.type === 'unsupported' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className={className(
                'w-12 h-12 rounded-full flex items-center justify-center mb-4 border',
                tw.surfaceRaised,
                tw.border.default,
              )}
            >
              <FileWarning className={className('w-5 h-5', tw.text.faint)} />
            </div>
            <p
              className={className('text-sm font-medium mb-1', tw.text.primary)}
            >
              {t('unsupportedPreview')}
            </p>
            {preview.size != null && (
              <p className={className('text-xs', tw.text.faint)}>
                {formatSize(preview.size)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default FilePreview
