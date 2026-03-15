export const xtermTheme = {
  light: { background: '#fafaf9', foreground: '#1c1917' },
  dark: { background: '#0c0a09', foreground: '#d6d3d1' },
}

export const tw = {
  background: {
    app: 'bg-stone-50 dark:bg-stone-900',
    toolbar: 'bg-white dark:bg-stone-800',
    term: 'bg-white dark:bg-stone-950',
  },

  text: {
    primary: 'text-stone-900 dark:text-stone-100',
    secondary: 'text-stone-500 dark:text-stone-400',
    muted: 'text-stone-400 dark:text-stone-600',
  },

  pageType: {
    node: 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-400',
    page: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    other: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  },

  border: {
    divider: 'border-stone-200 dark:border-stone-800',
    statusIndicator: 'border-white dark:border-stone-900',
  },

  button: {
    inspect:
      'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-500 dark:hover:bg-cyan-500 hover:text-white dark:hover:text-white hover:border-transparent',
    outlined: {
      default:
        'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400',
      hover:
        'hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200',
      disabled:
        'border-stone-100 dark:border-stone-700 text-stone-300 dark:text-stone-600',
    },
    primary: {
      default: 'bg-blue-500 dark:bg-blue-600 text-white',
      hover:
        'hover:bg-blue-600 dark:hover:bg-blue-500 hover:-translate-y-px active:translate-y-0',
      disabled:
        'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500',
    },
  },
}
