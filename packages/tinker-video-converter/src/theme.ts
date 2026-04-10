export const tw = {
  bg: {
    app: 'bg-stone-100 dark:bg-stone-950',
    panel: 'bg-white dark:bg-stone-900',
    surface: 'bg-stone-100 dark:bg-stone-900/60',
    input: 'bg-stone-100 dark:bg-stone-800/60',
    hover: 'hover:bg-stone-200 dark:hover:bg-stone-800',
    toolbar: 'bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm',
    card: 'bg-white dark:bg-stone-950',
    sidebar: 'bg-stone-50/40 dark:bg-stone-900/40',
    headerBar: 'bg-stone-50/80 dark:bg-stone-900/80',
    dropdown:
      'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700',
    progressTrack: 'bg-stone-200 dark:bg-stone-800',
    queueActive: 'bg-teal-500/5 dark:bg-stone-800/40',
    queueHover: 'hover:bg-stone-100 dark:hover:bg-stone-800/20',
    badge: 'bg-stone-100 dark:bg-stone-800/80',
  },
  text: {
    primary: 'text-stone-900 dark:text-stone-100',
    secondary: 'text-stone-500 dark:text-stone-400',
    muted: 'text-stone-400 dark:text-stone-500',
    accent: 'text-teal-600 dark:text-teal-400',
    label: 'text-stone-600 dark:text-stone-300',
    heading: 'text-stone-800 dark:text-stone-200',
    body: 'text-stone-700 dark:text-stone-200',
    placeholder: 'placeholder:text-stone-400 dark:placeholder:text-stone-600',
    dimmed: 'text-stone-300 dark:text-stone-600',
  },
  border: 'border-stone-200 dark:border-stone-800',
  borderLight: 'border-stone-200/60 dark:border-stone-700/50',
  borderInput: 'border-stone-300 dark:border-stone-700',
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
  status: {
    success: 'text-emerald-500 dark:text-emerald-400',
    error: 'text-red-500 dark:text-red-400',
    errorMuted: 'text-red-500/80 dark:text-red-400/80',
    accentIcon: 'text-teal-500 dark:text-teal-400',
  },
  input: {
    select:
      'select-styled border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800/80 text-stone-700 dark:text-stone-200 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed',
  },
  link: {
    subtle:
      'text-stone-500 dark:text-stone-400 hover:text-teal-600 dark:hover:text-teal-400',
    icon: 'text-stone-400 dark:text-stone-500 hover:text-teal-600 dark:hover:text-teal-400',
    danger:
      'text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400',
    clear:
      'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300',
  },
  dropdown: {
    item: 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-800 dark:hover:text-stone-100',
    itemDanger:
      'text-red-500 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-red-600 dark:hover:text-red-300',
    divider: 'border-stone-200 dark:border-stone-700',
  },
  dropzone: {
    iconIdle: 'text-stone-400 dark:text-stone-500',
    iconHover: 'text-teal-500 dark:text-teal-400',
    borderIdle: 'border-stone-300/50 dark:border-stone-700/50',
    bgIdle: 'bg-stone-200/60 dark:bg-stone-800/60',
    textIdle: 'text-stone-500 dark:text-stone-400',
    textHover: 'text-stone-700 dark:text-stone-200',
  },
  progress: {
    gradient: 'bg-gradient-to-r from-teal-600 to-teal-400',
  },
}
