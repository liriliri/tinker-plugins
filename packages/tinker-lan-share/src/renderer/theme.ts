export const tw = {
  background: {
    app: 'bg-neutral-100 dark:bg-neutral-900',
    panel: 'bg-white dark:bg-neutral-800',
    iframe: 'bg-white dark:bg-neutral-950',
    input: 'bg-white dark:bg-neutral-900',
  },

  text: {
    primary: 'text-neutral-900 dark:text-neutral-100',
    secondary: 'text-neutral-500 dark:text-neutral-400',
    muted: 'text-neutral-400 dark:text-neutral-500',
    link: 'text-[#059669] dark:text-[#34d399]',
    error: 'text-rose-600 dark:text-rose-400',
    success: 'text-emerald-600 dark:text-emerald-400',
  },

  border: {
    divider: 'border-neutral-200 dark:border-neutral-700',
    input: 'border border-neutral-200 dark:border-neutral-700',
    focus: 'focus:border-[#059669] dark:focus:border-[#34d399]',
  },

  button: {
    primary:
      'bg-[#059669] hover:bg-[#047857] text-white disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400',
    ghost:
      'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 disabled:opacity-50',
    danger:
      'bg-rose-500 hover:bg-rose-600 text-white disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400',
    icon: 'text-neutral-400 hover:text-[#059669] dark:hover:text-[#34d399]',
  },

  dialog: {
    overlay: 'fixed inset-0 z-40 bg-black/40 dark:bg-black/60',
    content:
      'z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
  },
}
