export const tw = {
  background: {
    app: 'bg-white dark:bg-zinc-950',
    toolbar: 'bg-zinc-50 dark:bg-zinc-900',
    sidebar: 'bg-zinc-50/80 dark:bg-zinc-900/60',
    content: 'bg-white dark:bg-zinc-950',
  },

  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    secondary: 'text-zinc-500 dark:text-zinc-400',
    placeholder: 'placeholder-zinc-300 dark:placeholder-zinc-600',
    muted: 'text-zinc-300 dark:text-zinc-600',
  },

  border: {
    divider: 'border-zinc-200 dark:border-zinc-800',
  },

  button: {
    icon: {
      default: 'text-zinc-400 dark:text-zinc-500',
      hover:
        'hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800',
    },
    primary: {
      default: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
      hover: 'hover:bg-zinc-800 dark:hover:bg-zinc-200',
    },
  },

  list: {
    item: 'text-zinc-600 dark:text-zinc-400',
    itemHover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60',
    itemActive: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
  },

  toast: {
    root: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg px-4 py-3 flex items-start gap-3',
    title: 'text-[12.5px] font-semibold text-red-600 dark:text-red-400',
    description: 'text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5',
    close:
      'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
}
