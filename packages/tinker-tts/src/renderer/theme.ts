export const tw = {
  background: {
    app: 'bg-zinc-200 dark:bg-zinc-950',
    panel: 'bg-zinc-50 dark:bg-zinc-900',
    panelHeader: 'bg-zinc-100 dark:bg-zinc-900/90',
    player: 'bg-zinc-100 dark:bg-zinc-900',
    field: 'bg-white dark:bg-zinc-950',
    divider: 'bg-zinc-200 dark:bg-zinc-800',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    muted: 'text-zinc-400 dark:text-zinc-500',
    label: 'text-zinc-500 dark:text-zinc-400',
  },
  border: {
    color: 'border-zinc-300 dark:border-zinc-700',
    soft: 'border-zinc-200 dark:border-zinc-800',
  },
  button: {
    primary:
      'bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white border border-blue-700/20 dark:border-blue-300/10',
    ghost:
      'bg-transparent hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-transparent',
    danger:
      'bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-zinc-300 dark:border-zinc-700',
  },
  progress: {
    track: 'bg-zinc-300 dark:bg-zinc-700',
    bar: 'bg-blue-500 dark:bg-blue-400',
  },
  input: {
    range: 'accent-blue-500 dark:accent-blue-400',
  },
  textarea: {
    placeholder: 'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
  },
  toast: {
    root: 'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-md px-3 py-2.5 flex items-start gap-3',
    title: 'text-[12px] font-semibold tracking-wide',
    error: 'text-red-600 dark:text-red-400',
    description:
      'text-[12px] text-zinc-600 dark:text-zinc-400 mt-0.5 break-words leading-relaxed',
    close:
      'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 cursor-pointer bg-transparent border-none p-0 shrink-0',
    viewport:
      'fixed bottom-3 right-3 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] z-[100] outline-none',
  },
  select: {
    trigger:
      'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950',
    chevron: 'text-zinc-400 dark:text-zinc-500',
  },
}
