export const tw = {
  background: {
    app: 'bg-zinc-200 dark:bg-zinc-900',
    sidebar: 'bg-zinc-50 dark:bg-zinc-800',
    recessed: 'bg-zinc-200/70 dark:bg-zinc-900',
    card: 'bg-white dark:bg-zinc-800',
    divider: 'bg-zinc-300/70 dark:bg-zinc-700/80',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    muted: 'text-zinc-400 dark:text-zinc-500',
    caption: 'text-[11px] text-zinc-500 dark:text-zinc-400',
    label:
      'text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400',
    accent: 'text-[#0b7470] dark:text-[#2ec4bc]',
  },
  border: {
    color: 'border-zinc-300/80 dark:border-zinc-800',
    soft: 'border-zinc-200 dark:border-zinc-700/80',
    focus:
      'focus:border-[#0e8f8a] dark:focus:border-[#2ec4bc] focus:ring-2 focus:ring-[#0e8f8a]/18 dark:focus:ring-[#2ec4bc]/22',
  },
  button: {
    primary:
      'bg-[#0e8f8a] hover:bg-[#0c7d79] dark:bg-[#1aa9a2] dark:hover:bg-[#2ec4bc] text-white shadow-none border border-[#0b7470]/30 dark:border-[#2ec4bc]/25 transition-colors duration-120',
    ghost:
      'bg-transparent hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400 border border-transparent transition-colors duration-120',
    danger:
      'bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-zinc-300 dark:border-zinc-700 transition-colors duration-120',
  },
  wave: {
    color: '#d4d4d8',
    colorDark: '#52525b',
    progress: '#0e8f8a',
    progressDark: '#2ec4bc',
  },
  textarea: {
    placeholder: 'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
  },
  toast: {
    root: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg px-3 py-2.5 flex items-start gap-3',
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
      'sfx-select text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed transition-[border-color,background-color] duration-120',
  },
  field: {
    control:
      'border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 transition-[border-color,box-shadow] duration-120',
  },
  card: {
    hover:
      'hover:border-[#0e8f8a]/45 dark:hover:border-[#2ec4bc]/35 transition-colors duration-120',
  },
  spin: 'text-[#0e8f8a] dark:text-[#2ec4bc]',
  input: {
    range: 'sfx-range accent-[#0e8f8a] dark:accent-[#2ec4bc]',
  },
}
