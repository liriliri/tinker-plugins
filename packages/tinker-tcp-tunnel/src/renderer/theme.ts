export const tw = {
  background: {
    app: 'bg-[#f4f4f5] dark:bg-[#1a1a1a]',
    toolbar: 'bg-[#e4e4e7] dark:bg-[#27272a]',
    sidebar: 'bg-[#ececee] dark:bg-[#202022]',
    card: 'bg-white dark:bg-[#252528]',
    accentSoft: 'bg-[#b45309]/12 dark:bg-[#fbbf24]/14',
  },
  text: {
    primary: 'text-[#18181b] dark:text-[#f4f4f5]',
    secondary: 'text-[#3f3f46] dark:text-[#d4d4d8]',
    muted: 'text-[#71717a] dark:text-[#71717a]',
    accent: 'text-[#b45309] dark:text-[#fbbf24]',
    good: 'text-[#047857] dark:text-[#34d399]',
    bad: 'text-[#b91c1c] dark:text-[#f87171]',
  },
  border: {
    toolbar: 'border-[#d4d4d8] dark:border-[#3f3f46]',
    card: 'border-[#e4e4e7] dark:border-[#3f3f46]',
  },
  fill: {
    accent: 'bg-[#d97706] dark:bg-[#fbbf24]',
    good: 'bg-[#059669] dark:bg-[#34d399]',
    bad: 'bg-[#dc2626] dark:bg-[#f87171]',
    idle: 'bg-[#a1a1aa] dark:bg-[#52525b]',
  },
  button: {
    toolbar:
      'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-[5px] text-xs font-medium text-[#18181b] dark:text-[#f4f4f5] bg-white dark:bg-[#2f2f33] border border-[#d4d4d8] dark:border-[#3f3f46] hover:border-[#d97706]/55 dark:hover:border-[#fbbf24]/45 hover:text-[#b45309] dark:hover:text-[#fbbf24] transition-colors disabled:opacity-40',
    primary:
      'inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-[5px] text-xs font-medium text-white bg-[#d97706] hover:bg-[#b45309] dark:bg-[#f59e0b] dark:hover:bg-[#fbbf24] dark:text-[#422006] transition-colors disabled:opacity-40',
    danger:
      'inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-[5px] text-xs font-medium text-white bg-[#dc2626] hover:bg-[#b91c1c] transition-colors disabled:opacity-40',
    ghost:
      'inline-flex items-center justify-center h-7 w-7 rounded-[5px] text-[#71717a] dark:text-[#71717a] hover:bg-[#d97706]/12 dark:hover:bg-[#fbbf24]/14 hover:text-[#b45309] dark:hover:text-[#fbbf24] transition-colors disabled:opacity-40',
  },
  input:
    'h-8 w-full rounded-[5px] border border-[#d4d4d8] dark:border-[#3f3f46] bg-white dark:bg-[#2f2f33] px-2.5 text-xs font-mono tabular-nums text-[#18181b] dark:text-[#f4f4f5] outline-none focus:border-[#d97706] dark:focus:border-[#fbbf24] focus:ring-1 focus:ring-[#d97706]/25 dark:focus:ring-[#fbbf24]/25 disabled:opacity-50 caret-[#d97706] dark:caret-[#fbbf24]',
  label:
    'text-[10px] font-semibold uppercase tracking-[0.06em] text-[#71717a] dark:text-[#71717a]',
  sidebar: {
    item: 'hover:bg-[#e4e4e7]/90 dark:hover:bg-[#2a2a2e]/90',
    itemActive:
      'bg-white dark:bg-[#2f2f33] shadow-sm ring-1 ring-[#d97706]/30 dark:ring-[#fbbf24]/28',
  },
  cardLive: 'ring-1 ring-[#d97706]/35 dark:ring-[#fbbf24]/30',
  dialog: {
    overlay: 'fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]',
    content:
      'fixed left-1/2 top-1/2 z-50 w-[min(92vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#d4d4d8] dark:border-[#3f3f46] bg-white dark:bg-[#252528] p-4 shadow-xl focus:outline-none',
    title:
      'text-[13px] font-semibold tracking-tight text-[#18181b] dark:text-[#f4f4f5]',
    cancel:
      'inline-flex items-center justify-center px-3 h-8 rounded-[5px] text-xs font-medium text-[#3f3f46] dark:text-[#d4d4d8] bg-[#f4f4f5] dark:bg-[#2f2f33] hover:bg-[#e4e4e7] dark:hover:bg-[#3f3f46] transition-colors',
  },
  status: {
    badge:
      'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
  },
}
