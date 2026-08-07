export const tw = {
  background: {
    app: 'bg-zinc-100 dark:bg-zinc-950',
    toolbar: 'bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-sm',
    panel: 'bg-zinc-50 dark:bg-zinc-900',
    panelHeader: 'bg-zinc-100/90 dark:bg-zinc-900/80',
    surface: 'bg-zinc-100 dark:bg-zinc-900/50',
    segmentHover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    secondary: 'text-zinc-600 dark:text-zinc-400',
    muted: 'text-zinc-400 dark:text-zinc-500',
    label: 'text-zinc-500 dark:text-zinc-400',
    accent: 'text-blue-600 dark:text-blue-400',
    time: 'text-blue-700 dark:text-blue-300',
  },
  border: {
    color: 'border-zinc-200 dark:border-zinc-800',
    soft: 'border-zinc-200/80 dark:border-zinc-800/80',
  },
  button: {
    secondary:
      'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700',
    icon: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-200/80 dark:hover:bg-zinc-800',
  },
  progress: {
    track: 'bg-zinc-200 dark:bg-zinc-800',
    bar: 'bg-blue-500 dark:bg-blue-400',
  },
  scrollArea: {
    root: 'min-h-0 flex-1 overflow-hidden',
    viewport: 'h-full w-full [&>div]:!block',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-opacity duration-200 data-[orientation=vertical]:w-1.5 data-[state=visible]:opacity-100 data-[state=hidden]:opacity-0',
    thumb:
      'relative flex-1 rounded-full bg-zinc-300/80 dark:bg-zinc-600/70 hover:bg-zinc-400 dark:hover:bg-zinc-500',
  },
  empty: {
    icon: 'text-zinc-300 dark:text-zinc-600',
    iconHover: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
    ring: 'border-zinc-200 dark:border-zinc-700',
    zoneFill:
      'bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900/80',
    dragActive:
      'bg-blue-500/8 dark:bg-blue-500/15 ring-2 ring-inset ring-blue-500/40 dark:ring-blue-400/40',
  },
  toast: {
    root: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg px-4 py-3 flex items-start gap-3',
    title: 'text-[12px] font-semibold tracking-wide',
    error: 'text-red-600 dark:text-red-400',
    description:
      'text-[12px] text-zinc-600 dark:text-zinc-400 mt-0.5 break-words leading-relaxed',
    close:
      'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 cursor-pointer bg-transparent border-none p-0 shrink-0',
    viewport:
      'fixed bottom-4 right-4 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] z-[100] outline-none',
  },
  select: {
    trigger:
      'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
    chevron: 'text-zinc-400 dark:text-zinc-500',
    dropdown:
      'overflow-hidden rounded-lg border z-50 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg',
    itemRow:
      'relative flex items-center gap-2 px-2 py-1.5 pl-7 pr-2 text-[11px] rounded-md cursor-pointer outline-none text-zinc-700 dark:text-zinc-300 data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800 data-[state=checked]:font-semibold data-[state=checked]:text-blue-600 dark:data-[state=checked]:text-blue-400',
    itemIndicator: 'text-blue-500 dark:text-blue-400',
    hint: 'text-zinc-400 dark:text-zinc-500',
  },
}
