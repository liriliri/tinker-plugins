import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import className from 'licia/className'
import findKey from 'licia/findKey'
import { tw } from '../theme'
import { store } from '../store'
import { getPortraits } from '../data/portraits'
import type { MBTIType } from '../types'

const typeImages = import.meta.glob<{ default: string }>('../assets/*.png', {
  eager: true,
})

const getTypeImage = (type: MBTIType): string | undefined => {
  const path = findKey(typeImages, (_val, key) => key.includes(`/${type}.png`))
  return path ? typeImages[path].default : undefined
}

const DIMENSION_PAIRS: [string, string, string][] = [
  ['E', 'I', 'EI'],
  ['S', 'N', 'SN'],
  ['T', 'F', 'TF'],
  ['J', 'P', 'JP'],
]

function DimensionRow({
  left,
  right,
  leftLabel,
  rightLabel,
  dimLabel,
}: {
  left: number
  right: number
  leftLabel: string
  rightLabel: string
  dimLabel: string
}) {
  const total = left + right
  const leftPct = total > 0 ? (left / total) * 100 : 50
  const leftWins = left >= right

  return (
    <div>
      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">
        {dimLabel}
      </div>
      <div className="grid grid-cols-[1.25rem_1fr_1.25rem] gap-x-1.5 items-center">
        <span
          className={className(
            'text-xs font-medium tabular-nums',
            leftWins
              ? 'text-accent-500 dark:text-accent-400'
              : tw.text.inactive,
          )}
        >
          {leftLabel}
        </span>
        <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex">
          <div
            className="h-full bg-accent-500 dark:bg-accent-400 transition-all duration-500"
            style={{ width: `${leftPct}%` }}
          />
          <div
            className="h-full bg-zinc-300 dark:bg-zinc-600 transition-all duration-500"
            style={{ width: `${100 - leftPct}%` }}
          />
        </div>
        <span
          className={className(
            'text-xs font-medium tabular-nums text-right',
            !leftWins
              ? 'text-accent-500 dark:text-accent-400'
              : tw.text.inactive,
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

function TraitList({
  title,
  items,
  bulletColor,
}: {
  title: string
  items: string[]
  bulletColor: 'accent' | 'rose'
}) {
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
                bulletColor === 'accent' ? 'text-accent-500' : 'text-rose-400',
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
    { left: scores.E, right: scores.I, leftLabel: 'E', rightLabel: 'I' },
    { left: scores.S, right: scores.N, leftLabel: 'S', rightLabel: 'N' },
    { left: scores.T, right: scores.F, leftLabel: 'T', rightLabel: 'F' },
    { left: scores.J, right: scores.P, leftLabel: 'J', rightLabel: 'P' },
  ]

  return (
    <div className="flex flex-col min-h-full px-3 py-3 overflow-y-auto">
      <div className="flex items-center gap-3 mb-3">
        {typeImage && (
          <img
            src={typeImage}
            alt={store.resultType}
            className="w-14 h-14 shrink-0 rounded-lg"
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={className(
              'text-2xl font-bold tracking-wider leading-none',
              tw.text.primary,
            )}
          >
            {store.resultType}
          </div>
          {portrait && (
            <div
              className={className('text-xs mt-0.5 truncate', tw.text.inactive)}
            >
              {portrait.nickname}
            </div>
          )}
        </div>
        <button
          onClick={() => store.restart()}
          title={t('resultRestartButton')}
          className={className(
            'shrink-0 p-2 rounded-md transition-all duration-200',
            tw.border.primary,
            tw.text.inactive,
            'hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200',
            'active:scale-95',
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

        {portrait && (
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
        )}
      </div>
    </div>
  )
})
