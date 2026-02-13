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
    quaternary: 'text-neutral-500 dark:text-neutral-400',
    mono: 'font-mono text-neutral-700 dark:text-neutral-300',
    cost: 'text-[#df754f] dark:text-[#f08a65]',
    white: 'text-white',
  },

  border: {
    card: 'border border-neutral-200/50 dark:border-neutral-800/50',
    table: 'border-b border-neutral-200 dark:border-neutral-700',
    tableRow: 'border-b border-neutral-100 dark:border-neutral-800',
    section: 'border-b border-neutral-200/50 dark:border-neutral-800/50',
  },

  shadow: {
    card: 'shadow-lg shadow-neutral-200/50 dark:shadow-neutral-950/50',
    cardLarge: 'shadow-xl shadow-neutral-200/50 dark:shadow-neutral-950/50',
    button: 'shadow-lg shadow-[#df754f]/30 dark:shadow-[#df754f]/20',
    buttonHover:
      'hover:shadow-xl hover:shadow-[#df754f]/40 dark:hover:shadow-[#df754f]/30',
    tooltip: 'shadow-xl',
  },

  gradient: {
    title:
      'bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-50 dark:to-neutral-300 bg-clip-text text-transparent',
    divider: 'bg-gradient-to-r from-[#df754f]/50 to-transparent',
    blue: 'from-[#df754f] to-[#d66638] dark:from-[#f08a65] dark:to-[#df754f]',
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

  table: {
    header:
      'text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pb-3',
    headerRight:
      'text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pb-3',
    cell: 'py-3 font-mono text-sm text-neutral-700 dark:text-neutral-300',
    cellRight:
      'py-3 text-right font-mono text-sm text-neutral-700 dark:text-neutral-300',
    cellBold:
      'py-3 text-right font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100',
    row: 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
  },

  card: {
    container: 'rounded-lg p-6',
    containerLarge: 'rounded-lg',
    label:
      'text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2',
    value: 'text-3xl font-bold bg-gradient-to-br bg-clip-text text-transparent',
  },

  scrollbar: {
    track:
      'flex select-none touch-none p-0.5 bg-neutral-100 dark:bg-neutral-800 transition-colors duration-150 ease-out hover:bg-neutral-200 dark:hover:bg-neutral-700',
    thumb:
      "flex-1 bg-neutral-400 dark:bg-neutral-600 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]",
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

  tooltip: {
    content:
      'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-2 rounded-md text-xs font-medium',
    arrow: 'fill-neutral-900 dark:fill-neutral-100',
  },
}
