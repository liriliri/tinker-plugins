import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Download, Play, Square, Trash2 } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import { getPetPreviewUrl } from '../lib/util'
import PetPreview from './PetPreview'

const Installed = observer(function Installed() {
  const { t } = useTranslation()

  if (store.installedPets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8">
        <div className={tw.empty.iconWrap}>
          <Download className={`w-5 h-5 ${tw.text.muted}`} />
        </div>
        <strong className={`text-sm font-bold ${tw.text.primary}`}>
          {t('emptyInstalled')}
        </strong>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {store.installedPets.map((pet) => {
        const active =
          store.runtimeConfig.activeSlug === pet.slug &&
          store.runtimeConfig.enabled
        return (
          <article key={pet.slug} className={tw.card.row}>
            <div
              className={`rounded-xl overflow-hidden border ${tw.border.divider} ${tw.card.stage} shrink-0`}
              style={
                {
                  ['--pet-accent' as string]: tw.brand.accent,
                } as React.CSSProperties
              }
            >
              <PetPreview
                src={getPetPreviewUrl(pet.slug)}
                fallbackSrc={pet.spritesheetUrl}
                label={pet.displayName}
                className="w-9 h-10"
              />
            </div>
            <div className="min-w-0 flex-1">
              <strong
                className={`block truncate text-[12px] font-extrabold ${tw.text.primary}`}
              >
                {pet.displayName}
              </strong>
              <span className={`text-[10px] font-semibold ${tw.text.muted}`}>
                {t('spriteVersion', { n: pet.spriteVersionNumber })} ·{' '}
                {pet.slug}
              </span>
            </div>
            {active ? (
              <button
                type="button"
                className={`${tw.button.secondary} !h-7 !px-2.5 !text-[11px]`}
                onClick={() => void store.disablePet()}
              >
                <Square className="w-3 h-3" />
                {t('close')}
              </button>
            ) : (
              <button
                type="button"
                className={`${tw.button.primary} !h-7 !px-2.5 !text-[11px]`}
                onClick={() => void store.enablePet(pet.slug)}
              >
                <Play className="w-3 h-3" />
                {t('enable')}
              </button>
            )}
            <button
              type="button"
              className={tw.button.iconDanger}
              title={t('uninstall')}
              onClick={() => void store.uninstallPet(pet.slug)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </article>
        )
      })}
    </div>
  )
})

export default Installed
