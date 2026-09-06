import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Download, LoaderCircle, Play, Square, X } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import { formatCount, getPetPreviewUrl, progressLabel } from '../lib/util'
import PetPreview from './PetPreview'

const DetailPanel = observer(function DetailPanel() {
  const { t } = useTranslation()
  const pet = store.detailPet
  if (!pet) return null

  const installing = store.installingSlugs.has(pet.slug)
  const installed = store.installedSlugSet.has(pet.slug)
  const active = store.storage.activeSlug === pet.slug && store.storage.enabled

  return (
    <div
      className={`${tw.overlay.backdrop} flex justify-end`}
      onClick={() => store.setDetailPet(null)}
    >
      <aside className={tw.overlay.drawer} onClick={(e) => e.stopPropagation()}>
        <div className="relative shrink-0">
          <button
            type="button"
            className={`${tw.button.iconOnMedia} absolute top-3 right-3 z-10`}
            onClick={() => store.setDetailPet(null)}
          >
            <X className="w-4 h-4" />
          </button>
          <div
            className={tw.card.stage}
            style={
              {
                ['--pet-accent' as string]:
                  pet.dominantColor || tw.brand.accent,
              } as React.CSSProperties
            }
          >
            <PetPreview
              src={getPetPreviewUrl(pet.slug, pet.previewUrl)}
              fallbackSrc={pet.spritesheetPath}
              label={pet.displayName}
              className="w-full max-h-44 object-contain mx-auto drop-shadow-md"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5 flex flex-col gap-3">
          <span
            className={`text-[11px] font-extrabold uppercase tracking-wider ${tw.text.muted}`}
          >
            {t(`kind.${pet.kind}`)} ·{' '}
            {t('spriteVersion', { n: pet.spriteVersionNumber })}
          </span>
          <h2
            className={`text-[22px] font-extrabold m-0 leading-tight ${tw.text.primary}`}
          >
            {pet.displayName}
          </h2>
          <p
            className={`m-0 text-[13px] leading-relaxed font-semibold ${tw.text.muted}`}
          >
            {pet.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[...pet.vibes, ...pet.tags].slice(0, 8).map((tag) => (
              <span key={tag} className={tw.card.tag}>
                {tag}
              </span>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-3 m-0 text-sm">
            <div className={tw.card.meta}>
              <dt className={`text-[11px] font-bold ${tw.text.muted}`}>
                {t('author')}
              </dt>
              <dd className={`m-0 mt-0.5 font-extrabold ${tw.text.primary}`}>
                {pet.submittedBy.name}
              </dd>
            </div>
            <div className={tw.card.meta}>
              <dt className={`text-[11px] font-bold ${tw.text.muted}`}>
                {t('installs')}
              </dt>
              <dd className={`m-0 mt-0.5 font-extrabold ${tw.text.primary}`}>
                {formatCount(pet.metrics.installCount)}
              </dd>
            </div>
          </dl>
        </div>

        <div className={tw.overlay.footer}>
          {!installed ? (
            <button
              type="button"
              className={`${tw.button.primary} w-full !h-10 !text-[13px]`}
              disabled={installing}
              onClick={() => void store.installPet(pet)}
            >
              {installing ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {installing
                ? progressLabel(store.downloadProgress.get(pet.slug))
                : t('downloadPet')}
            </button>
          ) : active ? (
            <button
              type="button"
              className={`${tw.button.secondary} w-full !h-10 !text-[13px]`}
              onClick={() => void store.disablePet()}
            >
              <Square className="w-4 h-4" />
              {t('closePet')}
            </button>
          ) : (
            <button
              type="button"
              className={`${tw.button.primary} w-full !h-10 !text-[13px]`}
              onClick={() => void store.enablePet(pet.slug)}
            >
              <Play className="w-4 h-4" />
              {t('enablePet')}
            </button>
          )}
        </div>
      </aside>
    </div>
  )
})

export default DetailPanel
