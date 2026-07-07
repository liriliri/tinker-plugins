import type { WeatherIconType } from './types'

const headerDecor =
  'relative overflow-hidden before:content-[""] before:absolute before:top-[-50%] before:right-[-30%] before:w-[200px] before:h-[200px] before:rounded-full before:bg-white/[0.08] before:pointer-events-none after:content-[""] after:absolute after:bottom-[-40%] after:left-[-20%] after:w-[160px] after:h-[160px] after:rounded-full after:bg-white/[0.05] after:pointer-events-none'

export const tw = {
  header: {
    base: headerDecor,
    default:
      'bg-gradient-to-br from-[#38bdf8] to-[#7dd3fc] dark:from-[#0c4a6e] dark:to-[#0369a1]',
    sun: 'bg-gradient-to-br from-[#c2410c] via-[#d97706] to-[#b45309] dark:from-[#b45309] dark:to-[#d97706]',
    cloud:
      'bg-gradient-to-br from-[#64748b] via-[#94a3b8] to-[#cbd5e1] dark:from-[#334155] dark:to-[#475569]',
    rain: 'bg-gradient-to-br from-[#64748b] via-[#38bdf8] to-[#0284c7] dark:from-[#1e293b] dark:via-[#0c4a6e] dark:to-[#075985]',
    snow: 'bg-gradient-to-br from-[#7dd3fc] via-[#e0f2fe] to-[#f8fafc] dark:from-[#0c4a6e] dark:to-[#0284c7]',
    thunder:
      'bg-gradient-to-br from-[#78716c] via-[#44403c] to-[#0c4a6e] dark:from-[#1c1917] dark:via-[#292524] dark:to-[#082f49]',
    fog: 'bg-gradient-to-br from-[#9ca3af] via-[#d1d5db] to-[#e5e7eb] dark:from-[#4b5563] dark:to-[#6b7280]',
    byIcon: {
      sun: 'bg-gradient-to-br from-[#c2410c] via-[#d97706] to-[#b45309] dark:from-[#b45309] dark:to-[#d97706]',
      cloud:
        'bg-gradient-to-br from-[#64748b] via-[#94a3b8] to-[#cbd5e1] dark:from-[#334155] dark:to-[#475569]',
      rain: 'bg-gradient-to-br from-[#64748b] via-[#38bdf8] to-[#0284c7] dark:from-[#1e293b] dark:via-[#0c4a6e] dark:to-[#075985]',
      drizzle:
        'bg-gradient-to-br from-[#94a3b8] via-[#7dd3fc] to-[#0ea5e9] dark:from-[#334155] dark:via-[#0369a1] dark:to-[#075985]',
      snow: 'bg-gradient-to-br from-[#7dd3fc] via-[#e0f2fe] to-[#f8fafc] dark:from-[#0c4a6e] dark:to-[#0284c7]',
      thunder:
        'bg-gradient-to-br from-[#78716c] via-[#44403c] to-[#0c4a6e] dark:from-[#1c1917] dark:via-[#292524] dark:to-[#082f49]',
      fog: 'bg-gradient-to-br from-[#9ca3af] via-[#d1d5db] to-[#e5e7eb] dark:from-[#4b5563] dark:to-[#6b7280]',
      wind: 'bg-gradient-to-br from-[#64748b] via-[#94a3b8] to-[#cbd5e1] dark:from-[#334155] dark:to-[#475569]',
    } satisfies Record<WeatherIconType, string>,
  },
  glass: {
    card: 'bg-white/15 backdrop-blur-xl border border-white/20 dark:bg-white/10 dark:border-white/[0.15]',
    cardDark:
      'bg-black/20 backdrop-blur-xl border border-white/15 dark:bg-black/30 dark:border-white/10',
  },
  text: {
    onHeader: 'text-white',
    onHeaderLight: 'text-zinc-800 dark:text-white',
    error: 'text-red-200 dark:text-red-300',
  },
  tempBar:
    'h-full rounded-full bg-gradient-to-r from-[#38bdf8] via-[#f59e0b] to-[#ef4444]',
  animation: {
    fadeInUp: 'animate-fade-in-up',
    fadeInUpDelay1: 'animate-fade-in-up-delay-1',
    fadeInUpDelay2: 'animate-fade-in-up-delay-2',
    spinSlow: 'animate-spin-slow',
    pulseSlow: 'animate-pulse-slow',
  },
}
