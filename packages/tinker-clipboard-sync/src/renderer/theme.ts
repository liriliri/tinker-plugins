export const tw = {
  background: {
    app: 'bg-zinc-50 dark:bg-zinc-950',
    toolbar: 'bg-white dark:bg-zinc-900',
  },

  text: {
    primary: 'text-zinc-800 dark:text-zinc-200',
    secondary: 'text-zinc-500 dark:text-zinc-400',
    placeholder: 'placeholder-zinc-300 dark:placeholder-zinc-600',
    empty: 'text-zinc-300 dark:text-zinc-600 italic',
  },

  border: {
    divider: 'border-zinc-200 dark:border-zinc-800',
    separator: 'bg-zinc-200 dark:bg-zinc-700',
  },

  input: {
    toolbar:
      'bg-transparent text-zinc-800 dark:text-zinc-200 text-sm outline-none truncate',
  },

  checkbox:
    'w-3.5 h-3.5 accent-orange-500 dark:accent-orange-400 cursor-pointer',

  button: {
    icon: {
      default: 'text-zinc-500 dark:text-zinc-400',
      hover:
        'hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800',
    },
    sync: {
      idle: 'bg-orange-500 dark:bg-orange-600 text-white hover:bg-orange-600 dark:hover:bg-orange-500',
      active:
        'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-500/25',
    },
  },

  toast: {
    root: 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3',
    title: 'text-[12.5px] font-semibold text-red-600 dark:text-red-400',
    description: 'text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5',
    close:
      'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
}
