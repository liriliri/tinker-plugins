import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  LoaderCircle,
  Play,
  Plus,
  Settings,
  Square,
  Trash2,
} from 'lucide-react'
import compact from 'licia/compact'
import map from 'licia/map'
import toArr from 'licia/toArr'
import store from '../store'
import { tw } from '../theme'
import AppScrollArea from './AppScrollArea'

const ModelList = observer(function ModelList() {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (store.installing) return

    const paths = compact(
      map(toArr(e.dataTransfer.files) as File[], (file) =>
        tinker.getPathForFile(file),
      ),
    )
    if (paths.length === 0) {
      store.showError(t('dropPathFailed'))
      return
    }
    await store.openPreviewFromPaths(paths)
  }

  const isEmpty = store.models.length === 0

  return (
    <section
      className="relative flex-1 min-h-0 flex flex-col"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isEmpty ? (
        <button
          type="button"
          onClick={() => void store.addModelsFromDialog()}
          className={`drop-stage flex-1 min-h-0 w-full rounded-none flex flex-col items-center justify-center gap-3 cursor-pointer ${
            isDragging ? 'is-hot' : ''
          }`}
        >
          <strong
            className={`stage-title text-[22px] font-normal ${tw.text.primary}`}
          >
            {t('dropTitle')}
          </strong>
          <p className={`text-[12px] font-medium ${tw.text.muted}`}>
            {t('dropHint')}
          </p>
          <span className="drop-cta">{t('addModel')}</span>
        </button>
      ) : (
        <AppScrollArea viewportClassName="p-3">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
            {store.models.map((model) => {
              const active =
                store.storage.activeId === model.id && store.storage.enabled
              return (
                <article
                  key={model.id}
                  className={active ? tw.card.active : tw.card.base}
                >
                  <div className={tw.card.stage}>
                    {active ? (
                      <span className={tw.card.ribbon}>{t('onStage')}</span>
                    ) : null}
                    {model.thumbnailUrl ? (
                      <img
                        src={model.thumbnailUrl}
                        alt={model.displayName}
                        className="relative z-[1] w-full aspect-[3/3.8] object-contain object-bottom"
                        draggable={false}
                      />
                    ) : (
                      <div
                        className={`relative z-[1] w-full aspect-[3/3.8] flex items-center justify-center text-[20px] font-extrabold ${tw.text.muted}`}
                      >
                        {model.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      className={`absolute top-1.5 right-1.5 z-[2] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 ${tw.button.iconOnMedia} !w-7 !h-7`}
                      title={t('uninstall')}
                      onClick={() => store.requestDelete(model.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="px-2 py-2 flex items-center gap-1.5 min-w-0">
                    <strong
                      className={`stage-title flex-1 min-w-0 truncate text-[12px] font-normal leading-tight ${tw.text.primary}`}
                    >
                      {model.displayName}
                    </strong>
                    {active ? (
                      <button
                        type="button"
                        className={`${tw.button.secondary} !h-7 !px-2 !text-[11px] shrink-0`}
                        onClick={() => void store.disablePet()}
                      >
                        <Square className="w-3 h-3" />
                        {t('close')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${tw.button.action} !h-7 !px-2 !text-[11px] shrink-0`}
                        onClick={() => void store.enableModel(model.id)}
                      >
                        <Play className="w-3 h-3" />
                        {t('enable')}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </AppScrollArea>
      )}

      {!isEmpty ? (
        <>
          <button
            type="button"
            className={`${tw.button.primary} !fixed bottom-4 left-4 z-30 !w-11 !h-11 !px-0`}
            title={t('addModel')}
            disabled={store.installing}
            onClick={() => void store.addModelsFromDialog()}
          >
            {store.installing ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" strokeWidth={2.75} />
            )}
          </button>
          <button
            type="button"
            className={`${tw.button.action} !fixed bottom-4 right-4 z-30 !w-11 !h-11 !px-0`}
            title={t('tabs.settings')}
            onClick={() => store.setOverlay('settings')}
          >
            <Settings className="w-4 h-4" />
          </button>
        </>
      ) : null}
    </section>
  )
})

export default ModelList
