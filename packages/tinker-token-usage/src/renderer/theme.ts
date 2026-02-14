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

  gradient: {
    blue: 'from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500',
    green: 'from-green-500 to-green-600 dark:from-green-400 dark:to-green-500',
    purple:
      'from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500',
    orange:
      'from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500',
  },

  button: {
    primary: {
      base: 'bg-gradient-to-br from-[#df754f] to-[#d66638] dark:from-[#f08a65] dark:to-[#df754f]',
      hover: 'hover:scale-105 active:scale-95',
      disabled:
        'disabled:from-neutral-300 disabled:to-neutral-400 dark:disabled:from-neutral-700 dark:disabled:to-neutral-800 disabled:shadow-none disabled:cursor-not-allowed disabled:scale-100',
      transition: 'transition-all duration-200',
    },
  },

  select: {
    trigger: {
      focus:
        'focus:outline-none focus:ring-2 focus:ring-[#df754f] dark:focus:ring-[#f08a65]',
    },
    item: {
      highlighted:
        'data-[highlighted]:bg-[#df754f] dark:data-[highlighted]:bg-[#f08a65] data-[highlighted]:text-white',
    },
  },

  error: {
    background:
      'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20',
    border: 'border border-red-200 dark:border-red-800/50',
    icon: {
      background: 'bg-red-100 dark:bg-red-900/30',
      border: 'border border-red-200 dark:border-red-800',
      text: 'text-red-600 dark:text-red-400',
    },
    text: {
      title: 'text-red-900 dark:text-red-300',
      content: 'text-red-800 dark:text-red-400',
    },
  },
}
