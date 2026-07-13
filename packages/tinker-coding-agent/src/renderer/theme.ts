export const tw = {
  background: {
    app: 'bg-stone-100 dark:bg-stone-950',
    toolbar: 'bg-white dark:bg-stone-900',
    tool: 'bg-stone-50 dark:bg-stone-900',
  },
  text: {
    primary: 'text-stone-900 dark:text-stone-100',
    muted: 'text-stone-400 dark:text-stone-500',
    danger: 'text-red-600 dark:text-red-400',
  },
  border: {
    divider: 'border-stone-200 dark:border-stone-700',
  },
  gradient: {
    composerFooter:
      'bg-gradient-to-t from-stone-100 via-stone-100 to-transparent dark:from-stone-950 dark:via-stone-950',
  },
  bubble: {
    user: 'bg-emerald-500 text-white',
  },
  select: {
    item: 'px-2 py-1.5 text-sm rounded cursor-pointer outline-none data-[highlighted]:bg-stone-100 dark:data-[highlighted]:bg-stone-800',
  },
  button: {
    icon: 'flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-none cursor-pointer text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
    primary:
      'flex items-center justify-center gap-1.5 px-3 h-8 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
    secondary:
      'flex items-center justify-center gap-1.5 px-3 h-8 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
  },
  toast: {
    root: 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg px-4 py-3 flex items-start gap-3',
    title: 'text-[12.5px] font-semibold text-red-600 dark:text-red-400',
    description: 'text-[12px] text-stone-500 dark:text-stone-400 mt-0.5',
    close:
      'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-50',
  },
}
