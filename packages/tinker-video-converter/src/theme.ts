export const tw = {
  bg: {
    app: 'bg-stone-100 dark:bg-stone-950',
    panel: 'bg-white dark:bg-stone-900',
    surface: 'bg-stone-100 dark:bg-stone-900/60',
    input: 'bg-stone-100 dark:bg-stone-800/60',
    hover: 'hover:bg-stone-200 dark:hover:bg-stone-800',
    toolbar: 'bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm',
  },
  text: {
    primary: 'text-stone-900 dark:text-stone-100',
    secondary: 'text-stone-500 dark:text-stone-400',
    muted: 'text-stone-400 dark:text-stone-500',
    accent: 'text-teal-600 dark:text-teal-400',
  },
  border: 'border-stone-200 dark:border-stone-800',
  borderLight: 'border-stone-200/60 dark:border-stone-700/50',
  accent: {
    bg: 'bg-teal-500',
    bgHover: 'hover:bg-teal-400',
    bgSubtle: 'bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/30',
  },
  button: {
    primary:
      'bg-teal-500 hover:bg-teal-400 text-white dark:text-stone-950 font-semibold',
    secondary:
      'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700',
    danger: 'bg-red-500/80 hover:bg-red-500 text-white',
    disabled:
      'bg-stone-200/50 dark:bg-stone-800/50 text-stone-400 dark:text-stone-600 cursor-not-allowed',
    ghost:
      'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200',
  },
  tag: {
    default:
      'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700',
    accent:
      'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
    success:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    error:
      'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20',
  },
}
