export const tw = {
  background: {
    app: 'bg-[#f4f6f8] dark:bg-[#0b1017]',
    toolbar: 'bg-[#eef1f5]/90 dark:bg-[#121821]/90 backdrop-blur-md',
    card: 'bg-white/90 dark:bg-[#151c27]/90',
    cardLinked:
      'bg-white dark:bg-[#151c27] shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:shadow-none',
    search: 'bg-white dark:bg-[#0f1520]',
    dialog: 'bg-white dark:bg-[#151c27]',
    dialogRow: 'hover:bg-slate-100/80 dark:hover:bg-white/[0.04]',
    emptyIcon: 'bg-teal-500/10 dark:bg-teal-400/10',
  },
  text: {
    primary: 'text-slate-900 dark:text-slate-100',
    secondary: 'text-slate-500 dark:text-slate-400',
    muted: 'text-slate-400 dark:text-slate-500',
    placeholder: 'placeholder-slate-400 dark:placeholder-slate-600',
    folder: 'text-slate-400 dark:text-slate-500',
  },
  border: {
    divider: 'border-slate-200/90 dark:border-white/[0.06]',
    card: 'border-slate-200/80 dark:border-white/[0.07]',
    cardHover:
      'hover:border-teal-500/35 dark:hover:border-teal-400/30 hover:bg-white dark:hover:bg-[#182131]',
    search: 'border-slate-200 dark:border-white/[0.08]',
    searchFocus:
      'focus-within:border-teal-500/50 dark:focus-within:border-teal-400/40 focus-within:ring-2 focus-within:ring-teal-500/15 dark:focus-within:ring-teal-400/15',
    dialog: 'border-slate-200 dark:border-white/[0.08]',
  },
  accent: {
    barMuted: 'bg-slate-200 dark:bg-white/10',
    dot: 'bg-teal-500 dark:bg-teal-400',
    icon: 'text-teal-600 dark:text-teal-400',
  },
  button: {
    icon: {
      default: 'text-slate-400 dark:text-slate-500',
      hover:
        'hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-white/[0.06]',
      danger:
        'text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-400/10',
    },
    done: 'bg-teal-600 dark:bg-teal-500 text-white hover:bg-teal-700 dark:hover:bg-teal-400',
    danger:
      'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-400',
    secondary:
      'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1]',
    ghost:
      'text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 dark:hover:bg-teal-400/10',
  },
  toggle: {
    on: 'bg-teal-600 dark:bg-teal-500',
    off: 'bg-slate-300 dark:bg-slate-600',
    thumb: 'bg-white dark:bg-slate-950',
  },
  tag: {
    linked:
      'bg-teal-500/10 text-teal-800 dark:bg-teal-400/10 dark:text-teal-200 border border-teal-500/15 dark:border-teal-400/20',
  },
  empty: 'text-slate-400 dark:text-slate-500',
  overlay: 'bg-slate-950/45 dark:bg-black/60',
  dropzone: {
    idle: 'border-slate-300 dark:border-white/15 bg-slate-50/80 dark:bg-white/[0.03] hover:border-teal-500/40 dark:hover:border-teal-400/35 hover:bg-teal-500/[0.04] dark:hover:bg-teal-400/[0.06]',
    active:
      'border-teal-500 dark:border-teal-400 bg-teal-500/10 dark:bg-teal-400/10',
  },
  checkbox: 'accent-teal-600 dark:accent-teal-400',
  scrollArea: {
    root: 'min-h-0 flex-1 basis-0 overflow-hidden',
    viewport: 'h-full w-full [&>div]:!block',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-colors data-[orientation=vertical]:w-1.5 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:flex-col',
    thumb:
      'relative flex-1 rounded-full bg-slate-300/90 dark:bg-slate-600/70 hover:bg-slate-400 dark:hover:bg-slate-500',
  },
  toast: {
    root: 'bg-white dark:bg-[#151c27] border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-lg px-4 py-3 flex items-center gap-3',
    success: 'text-slate-700 dark:text-slate-200',
    error: 'text-red-600 dark:text-red-400',
    description: 'flex-1 min-w-0 text-[13px] font-medium',
    close:
      'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer bg-transparent border-none p-0',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-[100]',
  },
}
