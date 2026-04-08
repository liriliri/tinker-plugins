export const tw = {
  background: {
    app: 'bg-neutral-100 dark:bg-neutral-950',
    sidebar: 'bg-white dark:bg-neutral-900',
    preview: 'bg-neutral-50 dark:bg-neutral-950',
  },

  text: {
    primary: 'text-neutral-800 dark:text-neutral-100',
    secondary: 'text-neutral-500 dark:text-neutral-300',
    muted: 'text-neutral-400 dark:text-neutral-400',
    label: 'text-neutral-600 dark:text-neutral-200',
  },

  button: {
    primary: {
      default: 'bg-teal-500 dark:bg-teal-500 text-white dark:text-white',
      hover: 'hover:bg-teal-600 dark:hover:bg-teal-400 active:scale-[0.97]',
      disabled:
        'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed',
    },
    secondary: {
      default:
        'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-200',
      hover:
        'hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-[0.97]',
    },
  },

  radio: {
    inactive:
      'border-neutral-300 dark:border-neutral-600 bg-transparent text-neutral-500 dark:text-neutral-300',
    active:
      'border-teal-500 dark:border-teal-400 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-300',
    dot: {
      active: 'border-teal-500 dark:border-teal-400',
      inactive: 'border-neutral-300 dark:border-neutral-600',
    },
  },

  overlay: {
    processing: 'bg-neutral-900/30 dark:bg-black/50 backdrop-blur-sm',
  },

  dropzone: {
    default:
      'border-2 border-dashed border-neutral-200 dark:border-neutral-700',
    hover:
      'border-teal-400 dark:border-teal-500 bg-teal-50/40 dark:bg-teal-950/20',
  },

  accent: {
    bg: 'bg-teal-500 dark:bg-teal-400 text-white dark:text-neutral-900',
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconText: 'text-teal-500 dark:text-teal-400',
    dot: 'bg-teal-500 dark:bg-teal-400',
  },

  divider: 'bg-neutral-200 dark:bg-neutral-700',

  dropzoneIcon: {
    default: 'bg-neutral-200/60 dark:bg-neutral-800',
  },
}
