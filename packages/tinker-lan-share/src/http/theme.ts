export const tw = {
  background: {
    app: 'bg-neutral-100 dark:bg-neutral-900',
    panel: 'bg-white dark:bg-neutral-800',
    drop: 'bg-neutral-50 dark:bg-neutral-900',
    dropActive: 'bg-emerald-50 dark:bg-emerald-950/40',
    icon: 'bg-emerald-50 dark:bg-emerald-950/50',
    rowHover: 'hover:bg-neutral-50 dark:hover:bg-neutral-700/40',
  },
  text: {
    primary: 'text-neutral-900 dark:text-neutral-100',
    secondary: 'text-neutral-500 dark:text-neutral-400',
    muted: 'text-neutral-400 dark:text-neutral-500',
    link: 'text-[#059669] dark:text-[#34d399]',
    danger: 'text-rose-600 dark:text-rose-400',
    folder: 'text-amber-600 dark:text-amber-400',
  },
  border: {
    divider: 'border-neutral-200 dark:border-neutral-700',
    drop: 'border-neutral-200 dark:border-neutral-700',
    dropActive: 'border-[#059669] dark:border-[#34d399]',
  },
  button: {
    primary: 'bg-[#059669] hover:bg-[#047857] text-white disabled:opacity-50',
    ghost:
      'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200',
    icon: 'text-neutral-400 hover:text-[#059669] dark:hover:text-[#34d399]',
    iconDanger: 'text-neutral-400 hover:text-rose-500',
  },
  progress: {
    track: 'bg-neutral-200 dark:bg-neutral-700',
    fill: 'bg-[#059669] dark:bg-[#34d399] origin-left transition-transform',
  },
  toast:
    'bg-neutral-900/90 dark:bg-neutral-100/90 text-white dark:text-neutral-900',
}
