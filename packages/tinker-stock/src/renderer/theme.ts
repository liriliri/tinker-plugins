import { marketChipClass as marketChipKey } from '../common/market'

export const tw = {
  bg: {
    app: 'app-shell',
    header: 'bg-[var(--header)]',
    panel: 'bg-[var(--panel)]',
    rail: 'bg-[var(--rail)]',
    muted: 'bg-[color-mix(in_srgb,var(--mist)_10%,transparent)]',
    hover: 'hover:bg-[color-mix(in_srgb,var(--brass)_7%,transparent)]',
    active:
      'shadow-[inset_2px_0_0_var(--brass)] bg-[color-mix(in_srgb,var(--brass)_8%,transparent)]',
    input: 'bg-[var(--input)]',
  },
  text: {
    primary: 'text-[var(--ink)]',
    secondary: 'text-[var(--mist)]',
    muted: 'text-[color-mix(in_srgb,var(--mist)_80%,transparent)]',
    brass: 'text-[var(--brass)]',
  },
  border: {
    default: 'border-[var(--line)]',
    brass: 'border-[var(--brass)]',
  },
  accent: {
    bg: 'bg-[var(--brass-soft)]',
    text: 'text-[var(--brass)]',
  },
  up: {
    text: 'text-[var(--up)]',
    bg: 'bg-[color-mix(in_srgb,var(--up)_12%,transparent)]',
  },
  down: {
    text: 'text-[var(--down)]',
    bg: 'bg-[color-mix(in_srgb,var(--down)_12%,transparent)]',
  },
  flat: {
    text: 'text-[var(--flat)]',
    bg: 'bg-[color-mix(in_srgb,var(--flat)_12%,transparent)]',
  },
  button: {
    ghost:
      'text-[var(--mist)] hover:text-[var(--ink)] hover:bg-[var(--brass-soft)] rounded-sm p-1 disabled:opacity-40 cursor-pointer transition-colors duration-150',
    tab: 'px-2.5 py-1 text-[12px] tracking-wide cursor-pointer transition-colors duration-150 rounded-sm',
    tabActive: 'bg-[var(--brass-soft)] text-[var(--brass)] font-semibold',
    tabIdle:
      'text-[var(--mist)] hover:text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--mist)_10%,transparent)]',
    period:
      'px-2 py-0.5 text-[11px] font-mono tracking-[0.1em] cursor-pointer transition-colors duration-150 border-b-2',
    periodActive: 'text-[var(--ink)] border-[var(--ink)] font-semibold',
    periodIdle: 'text-[var(--mist)] border-transparent hover:text-[var(--ink)]',
    detailTab:
      'relative px-2.5 py-1.5 text-[12px] tracking-wide cursor-pointer transition-colors duration-150',
    detailTabActive:
      'text-[var(--ink)] font-semibold after:absolute after:left-2.5 after:right-2.5 after:bottom-0 after:h-[2px] after:bg-[var(--brass)]',
    detailTabIdle: 'text-[var(--mist)] hover:text-[var(--ink)]',
  },
  chip: {
    base: 'inline-flex items-center font-mono text-[9px] tracking-[0.06em] uppercase px-1 py-px leading-none border',
    a: 'border-[var(--mkt-a)] text-[var(--mkt-a)] bg-[color-mix(in_srgb,var(--mkt-a)_10%,transparent)]',
    hk: 'border-[var(--mkt-hk)] text-[var(--mkt-hk)] bg-[color-mix(in_srgb,var(--mkt-hk)_10%,transparent)]',
    us: 'border-[var(--mkt-us)] text-[var(--mkt-us)] bg-[color-mix(in_srgb,var(--mkt-us)_10%,transparent)]',
    other:
      'border-[var(--line)] text-[var(--mist)] bg-[color-mix(in_srgb,var(--mist)_8%,transparent)]',
  },
  listRow:
    'w-full flex items-center gap-2 h-14 px-3 text-left cursor-pointer transition-colors duration-150 border-b border-[var(--line)]',
  ledPrice: 'tracking-[-0.04em] [font-feature-settings:"tnum"_1]',
  label: 'text-[10px] font-semibold tracking-[0.08em] text-[var(--mist)]',
  empty:
    'flex h-full w-full items-center justify-center text-center text-sm px-4 text-[var(--mist)]',
}

export function marketChip(code: string): string {
  return `${tw.chip.base} ${tw.chip[marketChipKey(code)]}`
}
