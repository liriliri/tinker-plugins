import safeGet from 'licia/safeGet'
import type { ToastKind } from './types'

export const tw = {
  background: {
    primary: 'bg-panel dark:bg-panel-dark',
    secondary: 'bg-surface dark:bg-surface-dark',
    header: 'bg-panel dark:bg-[#1e2126]',
    segmented: 'bg-panel dark:bg-[#2a2d33]',
    rowHover: 'hover:bg-probe-dim/60 dark:hover:bg-probe-dark-dim/40',
    rowSelected: 'bg-probe-dim/80 dark:bg-probe-dark-dim/50',
  },
  text: {
    primary: 'text-ink dark:text-ink-dark',
    muted: 'text-ink-faint dark:text-[#6b7280]',
    secondary: 'text-ink-mute dark:text-[#9ca3af]',
    placeholder: 'placeholder:text-ink-faint dark:placeholder:text-[#6b7280]',
  },
  border: {
    primary: 'border border-line dark:border-line-dark',
    hairline: 'border-b border-line/80 dark:border-line-dark/80',
    focus: 'focus:border-probe dark:focus:border-probe-dark',
    divide: 'border-l border-line dark:border-line-dark',
  },
  segmented: {
    active:
      'bg-surface dark:bg-[#3a3e46] text-ink dark:text-ink-dark font-medium',
    inactive:
      'text-ink-mute dark:text-[#9ca3af] hover:text-ink dark:hover:text-ink-dark',
  },
  brand: {
    Nvidia: 'text-[#76b900] dark:text-[#9acd32]',
    AMD: 'text-[#c81e1e] dark:text-[#f07178]',
    Intel: 'text-[#0072c6] dark:text-[#5eb0ef]',
    Apple: 'text-ink-mute dark:text-[#c0c4cc]',
    Qualcomm: 'text-[#5b3fc9] dark:text-[#a78bfa]',
    Other: 'text-ink-faint dark:text-[#6b7280]',
  },
  rank: {
    gold: 'text-[#b45309] dark:text-[#fbbf24]',
    silver: 'text-[#57534e] dark:text-[#d6d3d1]',
    bronze: 'text-[#9a3412] dark:text-[#fb923c]',
  },
  score: {
    active: 'text-probe dark:text-probe-dark font-semibold',
    idle: 'text-ink dark:text-ink-dark',
    dim: 'text-ink-faint dark:text-[#6b7280]',
  },
  button: {
    ghost:
      'text-ink-mute dark:text-[#9ca3af] hover:text-ink dark:hover:text-ink-dark hover:bg-black/5 dark:hover:bg-white/5',
  },
  sortHeader: {
    idle: 'text-ink-faint dark:text-[#6b7280] hover:text-ink dark:hover:text-ink-dark',
    active: 'text-probe dark:text-probe-dark',
  },
  select: {
    trigger:
      'text-ink dark:text-ink-dark hover:bg-black/5 dark:hover:bg-white/5',
    chevron: 'text-ink-faint dark:text-[#6b7280]',
    content:
      'border-line dark:border-line-dark bg-surface dark:bg-surface-dark',
    item: 'text-ink dark:text-ink-dark data-highlighted:bg-probe-dim/70 dark:data-highlighted:bg-probe-dark-dim/50',
    indicator: 'text-probe dark:text-probe-dark',
  },
  toast: {
    root: 'bg-surface dark:bg-surface-dark border border-line dark:border-line-dark rounded-lg shadow-lg px-3 py-2.5 flex items-start gap-2.5',
    titleInfo: 'text-[12px] font-semibold text-probe dark:text-probe-dark',
    titleSuccess:
      'text-[12px] font-semibold text-emerald-600 dark:text-emerald-400',
    titleError: 'text-[12px] font-semibold text-red-600 dark:text-red-400',
    titleWarning:
      'text-[12px] font-semibold text-amber-600 dark:text-amber-400',
    description: 'text-[11px] text-ink-mute dark:text-[#9ca3af] mt-0.5',
    close:
      'text-ink-faint dark:text-[#6b7280] hover:text-ink dark:hover:text-ink-dark cursor-pointer',
    viewport:
      'fixed bottom-3 right-3 flex flex-col gap-2 w-72 max-w-[calc(100%-1.5rem)] z-50',
  },
}

export function brandTextClass(brand: string): string {
  return safeGet(tw.brand, brand) || tw.brand.Other
}

export function rankTextClass(rank: number): string {
  return (
    ([tw.rank.gold, tw.rank.silver, tw.rank.bronze][rank - 1] as
      string | undefined) || tw.text.muted
  )
}

export function scoreClass(value: number, active: boolean): string {
  if (value <= 0) return tw.score.dim
  return active ? tw.score.active : tw.score.idle
}

const TOAST_TITLE_CLASS: Record<ToastKind, string> = {
  info: tw.toast.titleInfo,
  success: tw.toast.titleSuccess,
  error: tw.toast.titleError,
  warning: tw.toast.titleWarning,
}

export function toastTitleClass(kind: ToastKind): string {
  return TOAST_TITLE_CLASS[kind]
}
