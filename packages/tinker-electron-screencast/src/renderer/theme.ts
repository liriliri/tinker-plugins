export const tw = {
  background: {
    app: 'bg-neutral-100 dark:bg-neutral-900',
    panel: 'bg-white dark:bg-neutral-800',
    inset: 'bg-neutral-50 dark:bg-neutral-950',
    log: 'bg-neutral-900 dark:bg-black',
    input: 'bg-white dark:bg-neutral-900',
  },

  text: {
    primary: 'text-neutral-900 dark:text-neutral-100',
    secondary: 'text-neutral-500 dark:text-neutral-400',
    muted: 'text-neutral-400 dark:text-neutral-500',
    error: 'text-rose-600 dark:text-rose-400',
    warn: 'text-amber-600 dark:text-amber-400',
    log: 'text-neutral-200',
    logTime: 'text-neutral-500',
  },

  loading: {
    dot: 'bg-[#2f6fed]/60 dark:bg-[#6b9bff]/50',
  },

  appCard: {
    base: 'border border-transparent',
    hover:
      'hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800',
  },

  border: {
    divider: 'border-neutral-200 dark:border-neutral-700',
    input: 'border-neutral-200 dark:border-neutral-700',
    focus: 'focus:border-[#2f6fed] dark:focus:border-[#6b9bff]',
  },

  button: {
    primary:
      'bg-[#2f6fed] hover:bg-[#2459d1] text-white disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400',
    danger:
      'bg-rose-500 hover:bg-rose-600 text-white disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400',
    icon: 'text-neutral-400 hover:text-[#2f6fed] dark:hover:text-[#6b9bff]',
  },
}
