export interface SourceColorTokens {
  card: string
  cardBg: string
  header: string
  headerBorder: string
  name: string
  badge: string
  dot: string
  refreshBtn: string
  contentBg: string
}

export const SOURCE_COLORS: Record<string, SourceColorTokens> = {
  orange: {
    card: '',
    cardBg: 'bg-orange-400/40 dark:bg-orange-500/25',
    header: '',
    headerBorder: 'border-black/[.08] dark:border-white/[.08]',
    name: 'text-orange-900 dark:text-orange-100',
    badge: 'bg-black/10 dark:bg-white/10',
    dot: 'bg-orange-500 dark:bg-orange-400',
    refreshBtn:
      'text-orange-900/60 dark:text-orange-100/60 hover:text-orange-900 dark:hover:text-orange-100 hover:bg-black/10 dark:hover:bg-white/10',
    contentBg: 'bg-white/80 dark:bg-stone-900/85',
  },
  neutral: {
    card: '',
    cardBg: 'bg-stone-400/35 dark:bg-stone-500/20',
    header: '',
    headerBorder: 'border-black/[.08] dark:border-white/[.08]',
    name: 'text-stone-900 dark:text-stone-100',
    badge: 'bg-black/10 dark:bg-white/10',
    dot: 'bg-stone-500 dark:bg-stone-400',
    refreshBtn:
      'text-stone-900/60 dark:text-stone-100/60 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-black/10 dark:hover:bg-white/10',
    contentBg: 'bg-white/80 dark:bg-stone-900/85',
  },
  blue: {
    card: '',
    cardBg: 'bg-blue-400/40 dark:bg-blue-500/25',
    header: '',
    headerBorder: 'border-black/[.08] dark:border-white/[.08]',
    name: 'text-blue-900 dark:text-blue-100',
    badge: 'bg-black/10 dark:bg-white/10',
    dot: 'bg-blue-500 dark:bg-blue-400',
    refreshBtn:
      'text-blue-900/60 dark:text-blue-100/60 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-black/10 dark:hover:bg-white/10',
    contentBg: 'bg-white/80 dark:bg-stone-900/85',
  },
  red: {
    card: '',
    cardBg: 'bg-red-400/40 dark:bg-red-500/25',
    header: '',
    headerBorder: 'border-black/[.08] dark:border-white/[.08]',
    name: 'text-red-900 dark:text-red-100',
    badge: 'bg-black/10 dark:bg-white/10',
    dot: 'bg-red-500 dark:bg-red-400',
    refreshBtn:
      'text-red-900/60 dark:text-red-100/60 hover:text-red-900 dark:hover:text-red-100 hover:bg-black/10 dark:hover:bg-white/10',
    contentBg: 'bg-white/80 dark:bg-stone-900/85',
  },
  slate: {
    card: '',
    cardBg: 'bg-slate-400/35 dark:bg-slate-500/20',
    header: '',
    headerBorder: 'border-black/[.08] dark:border-white/[.08]',
    name: 'text-slate-900 dark:text-slate-100',
    badge: 'bg-black/10 dark:bg-white/10',
    dot: 'bg-slate-500 dark:bg-slate-400',
    refreshBtn:
      'text-slate-900/60 dark:text-slate-100/60 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-black/10 dark:hover:bg-white/10',
    contentBg: 'bg-white/80 dark:bg-stone-900/85',
  },
  green: {
    card: '',
    cardBg: 'bg-green-400/40 dark:bg-green-500/25',
    header: '',
    headerBorder: 'border-black/[.08] dark:border-white/[.08]',
    name: 'text-green-900 dark:text-green-100',
    badge: 'bg-black/10 dark:bg-white/10',
    dot: 'bg-green-500 dark:bg-green-400',
    refreshBtn:
      'text-green-900/60 dark:text-green-100/60 hover:text-green-900 dark:hover:text-green-100 hover:bg-black/10 dark:hover:bg-white/10',
    contentBg: 'bg-white/80 dark:bg-stone-900/85',
  },
}

export function getColors(color: string): SourceColorTokens {
  return SOURCE_COLORS[color] ?? SOURCE_COLORS.neutral
}

export const tw = {
  bg: {
    app: 'bg-stone-100 dark:bg-stone-900',
    toolbar: 'bg-stone-50/95 dark:bg-stone-800/95',
    card: 'bg-white dark:bg-stone-800',
  },
  text: {
    primary: 'text-stone-800 dark:text-stone-200',
    secondary: 'text-stone-500 dark:text-stone-400',
    muted: 'text-stone-400 dark:text-stone-500',
    title: 'text-stone-800 dark:text-stone-200',
    titleHover: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
    error: 'text-red-500 dark:text-red-400',
  },
  border: {
    divider: 'border-stone-200 dark:border-stone-700',
  },
  list: {
    itemHover: 'hover:bg-black/[.05] dark:hover:bg-white/[.06]',
  },
  timeline: {
    border: 'border-neutral-300 dark:border-neutral-600',
    dot: 'bg-neutral-400 dark:bg-neutral-500',
  },
  button: {
    icon: 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-md p-1.5 disabled:opacity-40 cursor-pointer transition-colors duration-150',
  },
  dropdown: {
    panel:
      'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl overflow-hidden',
    item: 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800',
  },
  dialog: {
    removeBtn:
      'bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40',
    listItemHover: 'hover:bg-black/[.05] dark:hover:bg-white/[.06]',
    dotInactive: 'bg-stone-300 dark:bg-stone-600',
    inputPlaceholder:
      'placeholder:text-stone-400 dark:placeholder:text-stone-500',
  },
}
