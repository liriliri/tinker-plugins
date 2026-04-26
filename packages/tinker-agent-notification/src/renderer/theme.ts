export const tw = {
  background: {
    primary: 'bg-white dark:bg-zinc-900',
    secondary: 'bg-zinc-100/70 dark:bg-zinc-800/80',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    muted: 'text-zinc-500 dark:text-zinc-400',
    icon: 'text-zinc-400 dark:text-zinc-500',
  },
  border: {
    card: 'border border-zinc-200 dark:border-zinc-700',
  },
  accent: {
    icon: 'text-indigo-500 dark:text-indigo-400',
    hoverText: 'hover:text-indigo-600 dark:hover:text-indigo-400',
    hoverBg: 'hover:bg-indigo-500/10 dark:hover:bg-indigo-500/15',
  },
  toggle: {
    on: 'bg-indigo-500 dark:bg-indigo-500',
    off: 'bg-zinc-300 dark:bg-zinc-600',
    thumb: 'bg-white dark:bg-white',
  },
  shadow: {
    card: 'shadow-sm dark:shadow-none',
  },
  button: {
    applyEnabled:
      'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white cursor-pointer shadow-sm shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]',
    applyDisabled:
      'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed',
  },
  list: {
    itemHover: 'hover:bg-zinc-100 dark:hover:bg-zinc-700/50',
  },
  toast: {
    success:
      'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700',
    error:
      'bg-zinc-50 dark:bg-zinc-800 text-red-600 dark:text-red-400 border border-zinc-200 dark:border-zinc-700',
  },
}
