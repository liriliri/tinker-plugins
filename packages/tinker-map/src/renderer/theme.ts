const text = {
  muted: 'text-zinc-500 dark:text-zinc-400',
  subtle: 'text-zinc-400 dark:text-zinc-500',
  primary: 'text-zinc-800 dark:text-zinc-200',
  danger: 'text-red-500 dark:text-red-400',
}

export const tw = {
  app: {
    bg: 'bg-zinc-50 dark:bg-zinc-900',
    border: 'border-zinc-200 dark:border-zinc-700/60',
  },
  sidebar: {
    bg: 'bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/30 dark:border-zinc-600/30 shadow-xl shadow-black/5 dark:shadow-black/20',
  },
  input: {
    base: 'border-zinc-200/80 dark:border-zinc-600/50',
    bg: 'bg-white/80 dark:bg-zinc-800/60',
    text: 'text-zinc-900 dark:text-white',
    placeholder: 'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    focus:
      'focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 focus:border-blue-400 dark:focus:border-blue-500',
    icon: text.subtle,
  },
  clearBtn:
    'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors duration-150',
  list: {
    heading: `${text.muted} border-b border-zinc-200/60 dark:border-zinc-700/40`,
    itemText: 'text-zinc-900 dark:text-white',
    itemHover: 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
    itemSelected:
      'bg-blue-50/80 dark:bg-blue-900/30 border-l-2 border-blue-500 dark:border-blue-400',
    itemDefault: 'border-l-2 border-transparent',
    descDefault: text.muted,
    descSelected: 'text-blue-600/80 dark:text-blue-300/80',
    coordText: text.muted,
    nameDefault: text.primary,
    nameSelected: 'text-blue-700 dark:text-blue-300',
    markerDefault: text.subtle,
    markerSelected: 'text-blue-600 dark:text-blue-400',
    bookmarkIcon: text.danger,
    deleteBtn: 'text-zinc-400 hover:text-red-500 dark:hover:text-red-400',
  },
  controlBtn: {
    active:
      'bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:shadow-blue-500/20',
    inactive:
      'bg-white/85 text-zinc-600 hover:bg-white hover:text-zinc-900 dark:bg-zinc-800/85 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white backdrop-blur-sm',
  },
  layerDivider: 'border-zinc-200/50 dark:border-zinc-600/50',
  empty: {
    icon: 'text-zinc-300 dark:text-zinc-600',
    text: text.subtle,
    spinner: 'text-blue-500/60 dark:text-blue-400/60',
  },
  popup: {
    coordText: text.muted,
  },
  dialog: {
    content:
      'bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80',
    title: 'text-zinc-800 dark:text-zinc-100',
    description: text.subtle,
    iconBg: 'bg-red-50 dark:bg-red-900/30',
    iconColor: text.danger,
    cancelBtn: `${text.muted} hover:bg-zinc-100 dark:hover:bg-zinc-700/60`,
    submitDisabled:
      'bg-zinc-100 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed',
  },
}
