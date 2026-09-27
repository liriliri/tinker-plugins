import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import className from 'licia/className'
import findKey from 'licia/findKey'
import { tw } from '../theme'
import store from '../store'
import { getPortraits } from '../data/portraits'
import type { MBTIType } from '../types'

const typeImages = import.meta.glob<{ default: string }>('../assets/*.png', {
  eager: true,
})

function getTypeImage(type: MBTIType): string | undefined {
  const path = findKey(typeImages, (_val, key) => key.includes(`/${type}.png`))
  return path ? typeImages[path].default : undefined
}

const DIMENSION_PAIRS: [string, string, string][] = [
  ['E', 'I', 'EI'],
  ['S', 'N', 'SN'],
  ['T', 'F', 'TF'],
  ['J', 'P', 'JP'],
]

interface DimensionRowProps {
  left: number
  right: number
  leftLabel: string
  rightLabel: string
  dimLabel: string
}

function DimensionRow({
  left,
  right,
  leftLabel,
  rightLabel,
  dimLabel,
}: DimensionRowProps) {
  const total = left + right
  const leftPct = total > 0 ? (left / total) * 100 : 50
  const leftWins = left >= right

  return (
    <div>
      <div className={className('text-[10px] mb-0.5', tw.text.muted)}>
        {dimLabel}
      </div>
      <div className="grid grid-cols-[1.25rem_1fr_1.25rem] gap-x-1.5 items-center">
        <span
          className={className(
            'text-xs font-medium tabular-nums',
            leftWins ? tw.text.accent : tw.text.inactive,
          )}
        >
          {leftLabel}
        </span>
        <div
          className={className(
            'h-1.5 rounded-full overflow-hidden flex',
            tw.background.track,
          )}
        >
          <div
            className={className(
              'h-full transition-all duration-500',
              tw.background.accent,
            )}
            style={{ width: `${leftPct}%` }}
          />
          <div
            className={className(
              'h-full transition-all duration-500',
              tw.background.trackMuted,
            )}
            style={{ width: `${100 - leftPct}%` }}
          />
        </div>
        <span
          className={className(
            'text-xs font-medium tabular-nums text-right',
            !leftWins ? tw.text.accent : tw.text.inactive,
          )}
        >
          {rightLabel}
        </span>
      </div>
      <div className="grid grid-cols-[1.25rem_1fr_1.25rem] gap-x-1.5 mt-0.5">
        <span
          className={className(
            'text-[10px] tabular-nums',
            leftWins ? tw.text.primary : tw.text.inactive,
          )}
        >
          {left}
        </span>
        <span />
        <span
          className={className(
            'text-[10px] tabular-nums text-right',
            !leftWins ? tw.text.primary : tw.text.inactive,
          )}
        >
          {right}
        </span>
      </div>
    </div>
  )
}

interface TraitListProps {
  title: string
  items: string[]
  bulletColor: 'accent' | 'rose'
}

function TraitList({ title, items, bulletColor }: TraitListProps) {
  return (
    <div>
      <div
        className={className('text-[10px] font-medium mb-1', tw.text.inactive)}
      >
        {title}
      </div>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li
            key={i}
            className={className(
              'text-xs leading-snug pl-2.5 relative',
              tw.text.primary,
            )}
          >
            <span
              className={className(
                'absolute left-0 top-0',
                bulletColor === 'accent' ? tw.text.accent : tw.text.rose,
              )}
            >
              ·
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export const ResultScreen = observer(() => {
  const { t, i18n } = useTranslation()

  if (!store.resultType) return null

  const portraits = getPortraits(i18n.language)
  const { scores } = store.dimensionScores
  const portrait = portraits[store.resultType]
  const typeImage = getTypeImage(store.resultType)

  const dimensionScoresData = [
    { left: scores.E, right: scores.I },
    { left: scores.S, right: scores.N },
    { left: scores.T, right: scores.F },
    { left: scores.J, right: scores.P },
  ]

  return (
    <div className="flex flex-col min-h-full px-3 py-3 overflow-y-auto">
      <div className="flex items-center gap-3 mb-3">
        {typeImage ? (
          <img
            src={typeImage}
            alt={store.resultType}
            className="w-14 h-14 shrink-0 rounded-lg"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div
            className={className(
              'text-2xl font-bold tracking-wider leading-none',
              tw.text.primary,
            )}
          >
            {store.resultType}
          </div>
          {portrait ? (
            <div
              className={className('text-xs mt-0.5 truncate', tw.text.inactive)}
            >
              {portrait.nickname}
            </div>
          ) : null}
        </div>
        <button
          onClick={() => store.restart()}
          title={t('resultRestartButton')}
          className={className(
            'shrink-0 p-2 rounded-md transition-all duration-200 active:scale-95',
            tw.border.primary,
            tw.text.inactive,
            tw.background.iconHover,
            tw.text.iconHover,
          )}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div
        className={className(
          'rounded-lg p-3 space-y-3',
          tw.background.secondary,
          tw.border.primary,
        )}
      >
        <section>
          <div
            className={className(
              'text-[10px] font-medium mb-2',
              tw.text.inactive,
            )}
          >
            {t('resultDimensionScores')}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {DIMENSION_PAIRS.map(([a, b, dim], i) => {
              const { left, right } = dimensionScoresData[i]
              return (
                <DimensionRow
                  key={dim}
                  left={left}
                  right={right}
                  leftLabel={a}
                  rightLabel={b}
                  dimLabel={t(`dimensions${dim}`)}
                />
              )
            })}
          </div>
        </section>

        {portrait ? (
          <>
            <div className={className('h-px', tw.divider.line)} />

            <section>
              <div
                className={className(
                  'text-[10px] font-medium mb-1',
                  tw.text.inactive,
                )}
              >
                {t('resultDescription')}
              </div>
              <p className={className('text-xs leading-snug', tw.text.primary)}>
                {portrait.description}
              </p>
            </section>

            <div className={className('h-px', tw.divider.line)} />

            <section className="grid grid-cols-2 gap-3">
              <TraitList
                title={t('resultStrengths')}
                items={portrait.strengths}
                bulletColor="accent"
              />
              <TraitList
                title={t('resultWeaknesses')}
                items={portrait.weaknesses}
                bulletColor="rose"
              />
            </section>

            <div className={className('h-px', tw.divider.line)} />

            <section>
              <div
                className={className(
                  'text-[10px] font-medium mb-1',
                  tw.text.inactive,
                )}
              >
                {t('resultCareer')}
              </div>
              <p className={className('text-xs leading-snug', tw.text.primary)}>
                {portrait.career}
              </p>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
})
