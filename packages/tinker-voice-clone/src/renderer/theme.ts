export const tw = {
  background: {
    app: 'bg-zinc-200 dark:bg-zinc-950',
    panel: 'bg-zinc-100 dark:bg-zinc-900',
    sidebar: 'bg-zinc-50 dark:bg-zinc-900',
    recessed: 'bg-zinc-200/70 dark:bg-zinc-950',
    card: 'bg-white dark:bg-zinc-800',
    divider: 'bg-zinc-300/70 dark:bg-zinc-700/80',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    muted: 'text-zinc-400 dark:text-zinc-500',
    label: 'text-zinc-500 dark:text-zinc-400',
  },
  border: {
    color: 'border-zinc-300/80 dark:border-zinc-800',
    soft: 'border-zinc-200 dark:border-zinc-700/80',
    focus:
      'focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 dark:focus:ring-amber-400/20',
  },
  button: {
    primary:
      'bg-amber-500 hover:bg-amber-400 dark:bg-amber-500 dark:hover:bg-amber-400 text-zinc-950 shadow-sm shadow-amber-600/20 border border-amber-600/15 transition-colors duration-150',
    ghost:
      'bg-transparent hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400 border border-transparent transition-colors duration-150',
    danger:
      'bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-zinc-300 dark:border-zinc-700 transition-colors duration-150',
  },
  wave: {
    color: '#d4d4d8',
    colorDark: '#52525b',
    progress: '#f59e0b',
    progressDark: '#fbbf24',
  },
  textarea: {
    placeholder: 'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
  },
  toast: {
    root: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg px-3 py-2.5 flex items-start gap-3',
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
      'vc-select text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-[border-color,box-shadow,background-color] duration-150',
  },
  field: {
    control:
      'border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-sm transition-[border-color,box-shadow] duration-150',
  },
  card: {
    hover:
      'hover:border-amber-400/55 dark:hover:border-amber-500/40 transition-colors duration-150',
  },
  spin: 'text-amber-500 dark:text-amber-400',
  input: {
    range: 'vc-range accent-amber-500 dark:accent-amber-400',
  },
}
