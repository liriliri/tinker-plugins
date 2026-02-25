export const tw = {
  background: {
    app: 'bg-stone-50 dark:bg-stone-950',
    toolbar: 'bg-white dark:bg-stone-900',
    sourcePanel: 'bg-white dark:bg-stone-900',
    targetPanel: 'bg-stone-50 dark:bg-stone-950',
  },

  text: {
    primary: 'text-stone-900 dark:text-stone-100',
    placeholder: 'placeholder-stone-300 dark:placeholder-stone-600',
    muted: 'text-stone-300 dark:text-stone-600',
    translating: 'text-stone-400 dark:text-stone-500',
  },

  border: {
    divider: 'border-stone-200 dark:border-stone-700',
  },

  button: {
    icon: {
      default: 'text-stone-400 dark:text-stone-400',
      hover:
        'hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800',
      disabled: 'text-stone-300 dark:text-stone-600',
    },
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
    copy: {
      copied:
        'border-emerald-400 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
    },
  },

  select: {
    trigger:
      'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800',
    chevron: 'text-stone-400 dark:text-stone-500',
    content:
      'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800',
    item: 'text-stone-700 dark:text-stone-300 data-highlighted:bg-stone-100 dark:data-highlighted:bg-stone-700',
    itemChecked:
      'data-[state=checked]:text-blue-600 dark:data-[state=checked]:text-blue-400',
    itemIndicator: 'text-blue-500 dark:text-blue-400',
  },

  tooltip: {
    content: 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900',
    arrow: 'fill-stone-900 dark:fill-stone-100',
  },

  toast: {
    root: 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3',
    title: 'text-[12.5px] font-semibold text-red-600 dark:text-red-400',
    description: 'text-[12px] text-stone-500 dark:text-stone-400 mt-0.5',
    close:
      'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
}
