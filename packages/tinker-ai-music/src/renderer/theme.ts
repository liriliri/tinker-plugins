export const tw = {
  background: {
    app: 'bg-[#f3f3f5] dark:bg-[#141416]',
    panel: 'bg-[#fafafa] dark:bg-[#18181b]',
    sidebar: 'bg-white dark:bg-[#1c1c1f]',
    recessed: 'bg-[#f3f3f5] dark:bg-[#141416]',
    card: 'bg-white dark:bg-[#242428]',
  },
  text: {
    primary: 'text-zinc-900 dark:text-[#f2f2f2]',
    muted: 'text-zinc-500 dark:text-[#7a7a7a]',
    label: 'text-[11px] font-medium text-zinc-500 dark:text-[#9a9a9a]',
    accent: 'text-[#e03d12] dark:text-[#ff5e33]',
  },
  border: {
    color: 'border-zinc-200 dark:border-white/8',
    soft: 'border-zinc-200/90 dark:border-white/6',
    focus:
      'focus:border-[#ff4d1a]/55 dark:focus:border-[#ff4d1a]/55 focus:ring-2 focus:ring-[#ff4d1a]/15 dark:focus:ring-[#ff4d1a]/18',
  },
  button: {
    primary:
      'bg-[#ff4d1a] hover:bg-[#ff5e33] text-white border border-[#ff4d1a]/40 shadow-none transition-colors duration-150',
    accent:
      'bg-[#ff4d1a] hover:bg-[#ff5e33] text-white border border-[#ff4d1a]/40 shadow-none transition-colors duration-150',
    ghost:
      'bg-transparent hover:bg-zinc-100 dark:hover:bg-white/8 text-zinc-500 dark:text-[#9a9a9a] hover:text-zinc-900 dark:hover:text-[#f2f2f2] border border-transparent transition-colors duration-150',
    danger:
      'bg-red-50 hover:bg-red-100 dark:bg-[#2a1818] dark:hover:bg-[#3a1f1f] text-red-600 dark:text-[#ff6b6b] border border-zinc-200 dark:border-white/8 transition-colors duration-150',
  },
  wave: {
    color: '#d4d4d8',
    colorDark: '#3a3a3a',
    progress: '#ff4d1a',
    progressDark: '#ff5e33',
  },
  textarea: {
    placeholder: 'placeholder:text-zinc-400 dark:placeholder:text-[#5c5c5c]',
  },
  toast: {
    root: 'bg-white dark:bg-[#242428] border border-zinc-200 dark:border-white/10 rounded-lg shadow-lg px-3 py-2.5 flex items-start gap-3',
    title: 'text-[12px] font-semibold tracking-wide',
    error: 'text-red-600 dark:text-[#ff6b6b]',
    description:
      'text-[12px] text-zinc-600 dark:text-[#9a9a9a] mt-0.5 break-words leading-relaxed',
    close:
      'text-zinc-400 hover:text-zinc-800 dark:text-[#7a7a7a] dark:hover:text-[#f2f2f2] cursor-pointer bg-transparent border-none p-0 shrink-0',
    viewport:
      'fixed bottom-3 right-3 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] z-[100] outline-none',
  },
  select: {
    trigger:
      'music-select text-zinc-700 dark:text-[#e8e8e8] border border-zinc-200 dark:border-white/8 bg-white dark:bg-[#202024] hover:border-zinc-300 dark:hover:border-white/16 disabled:opacity-50 disabled:cursor-not-allowed transition-[border-color,background-color] duration-150',
  },
  field: {
    control:
      'border border-zinc-200 dark:border-white/6 bg-white dark:bg-[#202024] transition-[border-color,box-shadow] duration-150',
  },
  card: {
    hover:
      'hover:border-zinc-300 dark:hover:border-white/14 transition-colors duration-150',
  },
  spin: 'text-[#ff4d1a]',
  input: {
    range: 'music-range accent-[#ff4d1a]',
  },
  scrollArea: {
    root: 'flex-1 min-h-0 overflow-hidden',
    viewport: 'h-full w-full',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-colors data-[orientation=vertical]:w-1.5 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:flex-col',
    thumb:
      'relative flex-1 rounded-full bg-zinc-300/90 hover:bg-zinc-400/90 dark:bg-white/14 dark:hover:bg-white/22',
  },
}
