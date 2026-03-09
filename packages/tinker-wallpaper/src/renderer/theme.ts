export const tw = {
  background: {
    app: 'bg-stone-100 dark:bg-stone-950',
    toolbar: 'bg-white dark:bg-stone-900',
  },
  text: {
    primary: 'text-stone-900 dark:text-stone-100',
    muted: 'text-stone-400 dark:text-stone-500',
  },
  border: {
    divider: 'border-stone-200 dark:border-stone-700',
  },
  input: {
    base: 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-md px-3 h-8 text-sm outline-none border border-transparent focus:border-emerald-500 transition-colors',
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
  thumb: {
    wrapper:
      'relative overflow-hidden rounded-md bg-stone-200 dark:bg-stone-800 cursor-pointer border-none p-0 w-full aspect-video hover:opacity-90 transition-opacity',
    skeleton: 'absolute inset-0 bg-stone-200 dark:bg-stone-800 animate-pulse',
    spinner:
      'w-5 h-5 border-2 border-stone-300 dark:border-stone-600 border-t-emerald-500 rounded-full animate-spin',
  },
  grid: {
    empty:
      'flex-1 flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm',
    progress: 'h-full bg-emerald-500 animate-progress',
  },
  searchIcon:
    'absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-stone-500 pointer-events-none',
  tooltip: {
    content:
      'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 text-xs px-2 py-1 rounded-md shadow-md select-none z-50',
    arrow: 'fill-stone-900 dark:fill-stone-100',
  },
  scrollArea: {
    root: 'flex-1 overflow-hidden',
    viewport: '[&>div]:!block',
    scrollbar:
      'flex select-none touch-none p-0.5 transition-colors data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2',
    thumb: 'flex-1 bg-stone-300 dark:bg-stone-600 rounded-full relative',
  },
  viewer: {
    overlay: 'fixed inset-0 z-50 bg-black/60 backdrop-blur-xl',
    content:
      'fixed inset-0 z-50 flex flex-col focus:outline-none data-[state=open]:animate-fade-up',
    toolbar:
      'absolute top-0 left-0 right-0 z-10 flex items-center gap-1 px-3 py-2 bg-gradient-to-b from-black/40 to-transparent',
    iconBtn:
      'flex items-center justify-center w-8 h-8 rounded-md border-none cursor-pointer text-white bg-black/30 hover:bg-black/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
    select:
      'flex items-center gap-1.5 px-2.5 h-7 rounded-md border-none cursor-pointer text-white bg-black/30 hover:bg-black/50 text-xs font-medium transition-colors outline-none',
    selectContent:
      'bg-stone-900/90 backdrop-blur-md border border-white/10 rounded-md shadow-xl overflow-hidden z-50 min-w-[100px]',
    selectItem:
      'flex items-center px-3 h-7 text-xs text-white/80 cursor-pointer hover:bg-white/10 hover:text-white outline-none data-[highlighted]:bg-white/10 data-[highlighted]:text-white transition-colors',
    spinner:
      'w-6 h-6 border-2 border-stone-600 border-t-white rounded-full animate-spin',
  },
}
