export const tw = {
  background: {
    primary:
      'bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950',
    card: 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl',
    hover: 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
  },

  text: {
    primary: 'text-neutral-900 dark:text-neutral-100',
    secondary: 'text-neutral-700 dark:text-neutral-300',
    tertiary: 'text-neutral-600 dark:text-neutral-400',
    white: 'text-white',
  },

  border: {
    card: 'border border-neutral-300 dark:border-neutral-700',
  },

  button: {
    primary: {
      base: 'bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-400 dark:to-pink-500 text-white rounded-lg px-4 py-2 font-medium',
      hover: 'hover:opacity-90 active:scale-95',
      disabled:
        'disabled:from-neutral-300 disabled:to-neutral-400 dark:disabled:from-neutral-700 dark:disabled:to-neutral-800 disabled:cursor-not-allowed disabled:scale-100',
      transition: 'transition-all duration-200',
    },
    secondary: {
      base: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg px-4 py-2 font-medium',
      hover: 'hover:bg-neutral-200 dark:hover:bg-neutral-700',
      transition: 'transition-all duration-200',
    },
  },

  input: {
    base: 'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none w-full',
    focus:
      'focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent',
  },

  progress: {
    track: 'bg-neutral-200 dark:bg-neutral-700 rounded-full',
    bar: 'bg-gradient-to-r from-pink-500 to-pink-400 rounded-full',
  },

  error: {
    background:
      'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20',
    border: 'border border-red-200 dark:border-red-800/50',
    text: {
      title: 'text-red-900 dark:text-red-300',
      content: 'text-red-800 dark:text-red-400',
    },
  },

  bilibili: {
    accent: 'text-pink-500 dark:text-pink-400',
    accentGradient:
      'from-pink-500 to-pink-600 dark:from-pink-400 dark:to-pink-500',
  },
}
