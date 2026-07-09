export const tw = {
  background: {
    app: 'bg-neutral-100 dark:bg-neutral-950',
    sidebar: 'bg-white dark:bg-neutral-900',
    preview: 'bg-neutral-50 dark:bg-neutral-950',
  },

  text: {
    muted: 'text-neutral-400 dark:text-neutral-400',
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
    ring: 'border-teal-400/30 dark:border-teal-400/30',
    icon: 'text-white dark:text-white',
  },

  checkerboard:
    'bg-[length:14px_14px] [background-image:repeating-conic-gradient(#e0e0e0_0%_25%,#f5f5f5_0%_50%)] dark:[background-image:repeating-conic-gradient(#333_0%_25%,#2a2a2a_0%_50%)]',

  dropzone: {
    default:
      'border-2 border-dashed border-neutral-200 dark:border-neutral-700',
    hover:
      'border-teal-400 dark:border-teal-500 bg-teal-50/40 dark:bg-teal-950/20',
  },

  accent: {
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconText: 'text-teal-500 dark:text-teal-400',
    dot: 'bg-teal-500 dark:bg-teal-400',
  },

  border: {
    sidebar: 'border-neutral-200 dark:border-neutral-800',
  },

  divider: 'bg-neutral-200 dark:bg-neutral-700',

  dropzoneIcon: {
    default: 'bg-neutral-200/60 dark:bg-neutral-800',
  },
}
