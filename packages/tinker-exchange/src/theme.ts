export const tw = {
  background: {
    primary: 'bg-white dark:bg-zinc-900',
    secondary: 'bg-zinc-50 dark:bg-zinc-800',
    hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
    scrollbarHover: 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50',
    selectItemHover: 'hover:bg-zinc-200 dark:hover:bg-zinc-700',
    selectItemHighlight:
      'data-highlighted:bg-zinc-200 dark:data-highlighted:bg-zinc-700',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    secondary: 'text-zinc-600 dark:text-zinc-400',
    muted: 'text-zinc-500 dark:text-zinc-400',
    icon: 'text-zinc-400 dark:text-zinc-500',
    placeholder: 'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    white: 'text-white',
    error: 'text-red-600 dark:text-red-400',
    accent: 'text-blue-500 dark:text-blue-400',
  },
  border: {
    primary: 'border border-zinc-200 dark:border-zinc-700',
    focus: 'focus:border-blue-400 dark:focus:border-blue-500',
    accent: 'border border-blue-400/30 dark:border-blue-500/20',
  },
  accent: {
    bg: 'bg-blue-500 dark:bg-blue-500',
    bgSubtle: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-white',
    focusRing: 'focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500',
    hoverText: 'hover:text-blue-500 dark:hover:text-blue-400',
  },
  danger: {
    hoverText: 'hover:text-red-500 dark:hover:text-red-400',
  },
  scrollbar: {
    thumb: 'bg-zinc-300 dark:bg-zinc-600',
  },
  tooltip: {
    bg: 'bg-zinc-800 dark:bg-zinc-700',
    arrow: 'fill-zinc-800 dark:fill-zinc-700',
  },
}
