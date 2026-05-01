export const tw = {
  background: {
    primary: 'bg-white dark:bg-zinc-900',
    secondary: 'bg-zinc-50 dark:bg-zinc-800',
    hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
    scrollbarHover: 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50',
    selectItemHover: 'hover:bg-zinc-200 dark:hover:bg-zinc-700',
    selectItemHighlight:
      'data-highlighted:bg-zinc-200 dark:data-highlighted:bg-zinc-700',
    gradient:
      'bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950',
    card: 'bg-white/70 dark:bg-zinc-800/70',
    tag: 'bg-zinc-100 dark:bg-zinc-700/50',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    secondary: 'text-zinc-600 dark:text-zinc-400',
    muted: 'text-zinc-500 dark:text-zinc-400',
    icon: 'text-zinc-400 dark:text-zinc-500',
    placeholder: 'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    white: 'text-white',
    error: 'text-red-600 dark:text-red-400',
  },
  border: {
    primary: 'border border-zinc-200 dark:border-zinc-700',
    card: 'border border-zinc-100 dark:border-zinc-700/50',
    focus: 'focus:border-yellow-400 dark:focus:border-yellow-500',
    button:
      'border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
  },
  accent: {
    bg: 'bg-yellow-400 dark:bg-yellow-500',
    text: 'text-zinc-900',
    focusRing: 'focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500',
  },
  scrollbar: {
    thumb: 'bg-zinc-300 dark:bg-zinc-600',
  },
  tooltip: {
    bg: 'bg-zinc-800 dark:bg-zinc-700',
    arrow: 'fill-zinc-800 dark:fill-zinc-700',
  },
  input: {
    base: 'border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50',
  },
  dialog: {
    overlay: 'bg-black/50',
    content:
      'border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900',
  },
  progressBar: {
    track: 'bg-zinc-100 dark:bg-zinc-700/50',
  },
  button: {
    settingsHover: 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
  },
}
