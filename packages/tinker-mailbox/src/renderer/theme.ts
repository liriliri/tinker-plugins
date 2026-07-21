export const tw = {
  background: {
    app: 'bg-[var(--mb-paper)]',
    rail: 'bg-[var(--mb-rail)]',
    muted: 'bg-[var(--mb-reader)]',
    selected:
      'bg-rose-100 dark:bg-[rgba(190,18,60,0.28)] shadow-[inset_2px_0_0_0_var(--mb-red)] dark:shadow-[inset_2px_0_0_0_var(--mb-red-bright)]',
    hover: 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    secondary: 'text-zinc-600 dark:text-zinc-300',
    muted: 'text-zinc-400 dark:text-zinc-500',
    accent: 'text-[var(--mb-red)] dark:text-[var(--mb-red-bright)]',
    unread: 'text-zinc-950 dark:text-zinc-50 font-semibold',
  },
  border: {
    divider: 'border-zinc-200/90 dark:border-zinc-800',
  },
  input: {
    base: 'w-full bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg px-3 h-9 text-sm outline-none border border-transparent focus:border-[var(--mb-red)] focus:bg-white dark:focus:bg-zinc-900 transition-colors',
    select:
      'w-full bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 rounded-lg px-3 h-9 text-sm outline-none border border-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus:border-[var(--mb-red)] transition-colors',
    compose:
      'w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-none px-0 h-9 text-sm outline-none border-0 focus:outline-none',
    composeEditor:
      'w-full h-full min-h-full bg-transparent text-zinc-900 dark:text-zinc-100 text-sm leading-6 outline-none border-0 py-3 px-4',
    composeFontSize:
      'h-7 px-1.5 rounded-md text-xs font-medium bg-transparent border border-zinc-200/90 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 outline-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-0 focus-visible:outline-none focus:border-[var(--mb-red)] dark:focus:border-[var(--mb-red-bright)]',
  },
  button: {
    icon: 'flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-[var(--mb-red)] dark:hover:text-[var(--mb-red-bright)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
    format:
      'flex items-center justify-center w-7 h-7 rounded-md bg-transparent border-none cursor-pointer text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors',
    formatActive:
      'bg-[var(--mb-red-soft)] dark:bg-[var(--mb-red-soft-dark)] text-[var(--mb-red)] dark:text-[var(--mb-red-bright)]',
    primary:
      'flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-lg bg-[var(--mb-red)] hover:bg-[var(--mb-red-deep)] text-white text-sm font-medium border-none cursor-pointer shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
    secondary:
      'flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
    danger:
      'flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg bg-transparent border border-[var(--mb-red)]/30 hover:bg-[var(--mb-red-soft)] dark:hover:bg-[var(--mb-red-soft-dark)] text-[var(--mb-red)] dark:text-[var(--mb-red-bright)] text-sm font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
  },
  toast: {
    root: 'bg-[var(--mb-panel)] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-[0_12px_40px_rgba(24,24,27,0.12)] px-4 py-3 flex items-start gap-3',
    titleError:
      'text-[12.5px] font-semibold text-[var(--mb-red)] dark:text-[var(--mb-red-bright)]',
    titleSuccess:
      'text-[12.5px] font-semibold text-teal-600 dark:text-teal-400',
    description: 'text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5',
    close:
      'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-[100]',
  },
  dialog: {
    overlay: 'fixed inset-0 z-40 bg-zinc-950/45 backdrop-blur-[2px]',
    content:
      'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(560px,92vw)] max-h-[90vh] overflow-auto rounded-2xl bg-[var(--mb-panel)] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_24px_80px_rgba(24,24,27,0.22)] p-6',
  },
  list: {
    item: 'block w-full text-left px-3 py-2.5 cursor-pointer transition-colors relative',
    itemActive:
      'bg-[var(--mb-red-soft)] dark:bg-[var(--mb-red-soft-dark)] text-[var(--mb-red-deep)] dark:text-[var(--mb-red-bright)]',
    itemIdle:
      'bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]',
  },
  shell: {
    toolbar:
      'h-[3.25rem] shrink-0 flex items-center gap-3 px-4 border-b border-zinc-200/90 dark:border-zinc-800 bg-[var(--mb-panel)]/95 backdrop-blur-md',
    composeBar:
      'h-14 shrink-0 flex items-center gap-3 px-4 border-b border-zinc-200/90 dark:border-zinc-800 bg-[var(--mb-panel)]',
    composeSection:
      'rounded-md border border-zinc-200/90 dark:border-zinc-700 bg-[var(--mb-panel)] overflow-hidden',
    composeField:
      'flex items-center gap-3 px-4 min-h-11 border-b border-zinc-200/90 dark:border-zinc-700 last:border-b-0',
    composeToolbar:
      'flex items-center gap-0.5 shrink-0 px-2 py-1.5 border-b border-zinc-200/90 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/40',
    composeToolbarDivider: 'w-px h-4 mx-1 bg-zinc-200 dark:bg-zinc-700',
    composeBody: 'bg-[var(--mb-panel)] [&>div]:min-h-full',
    folder:
      'w-[11.5rem] shrink-0 flex flex-col border-r border-zinc-200/90 dark:border-zinc-800 bg-[var(--mb-panel)]',
    messages:
      'w-[19rem] shrink-0 flex flex-col border-r border-zinc-200/90 dark:border-zinc-800 bg-[var(--mb-rail)]',
  },
  emptyIcon:
    'flex items-center justify-center w-12 h-12 rounded-full border border-[var(--mb-red)]/20 bg-[var(--mb-red-soft)] dark:bg-[var(--mb-red-soft-dark)] text-[var(--mb-red)] dark:text-[var(--mb-red-bright)]',
  readerFrame: 'w-full overflow-hidden bg-[var(--mb-reader)]',
  readerBg: {
    light: '#ffffff',
    dark: '#1c1c1f',
  },
  bodyText:
    'whitespace-pre-wrap break-words text-[13.5px] leading-7 text-zinc-900 dark:text-zinc-100 font-[family-name:var(--mb-sans)]',
  dialogTitle: 'text-base font-semibold mb-4 text-zinc-900 dark:text-zinc-50',
  dropdown: {
    content:
      'z-50 min-w-[14rem] max-w-[20rem] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-[var(--mb-panel)] dark:bg-zinc-900 p-1 shadow-[0_12px_40px_rgba(24,24,27,0.14)]',
    item: 'flex w-full cursor-pointer select-none flex-col gap-0.5 rounded-md px-3 py-2 text-left outline-none border-none bg-transparent data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800',
    itemActive:
      'bg-[var(--mb-red-soft)] dark:bg-[var(--mb-red-soft-dark)] data-[highlighted]:bg-[var(--mb-red-soft)] dark:data-[highlighted]:bg-[var(--mb-red-soft-dark)]',
    itemName:
      'truncate text-[12.5px] font-medium text-zinc-900 dark:text-zinc-100',
    itemEmail: 'truncate text-[11px] text-zinc-500 dark:text-zinc-400',
  },
  tabs: {
    list: 'flex gap-1 p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 mb-3',
    trigger:
      'flex-1 h-8 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 data-[state=active]:bg-[var(--mb-panel)] dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[var(--mb-red)] dark:data-[state=active]:text-[var(--mb-red-bright)] data-[state=active]:shadow-sm',
    content: 'space-y-3 outline-none',
  },
  empty:
    'flex-1 flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 text-sm',
  spinner:
    'w-5 h-5 border-2 border-zinc-200 dark:border-zinc-700 border-t-[var(--mb-red)] dark:border-t-[var(--mb-red-bright)] rounded-full animate-spin',
  label:
    'block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400 mb-1.5',
  labelInline:
    'shrink-0 w-14 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400',
  tooltip:
    'text-xs px-2 py-1 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-md',
  scrollArea: {
    root: 'min-h-0 flex-1 overflow-hidden',
    viewport: 'h-full w-full [&>div]:!block',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-colors data-[orientation=vertical]:w-1.5',
    thumb:
      'relative flex-1 rounded-full bg-zinc-300/80 dark:bg-zinc-600/80 hover:bg-zinc-400 dark:hover:bg-zinc-500',
  },
}
