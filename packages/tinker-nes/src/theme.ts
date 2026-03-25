export const tw = {
  appBg: (isDark: boolean) =>
    isDark ? 'bg-[#0a0a0a] text-zinc-100' : 'bg-[#e8e4dc] text-zinc-900',
  toolbar: (isDark: boolean) =>
    isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-[#d4d0c8] border-[#b0aca4]',
  btn: (isDark: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 ${
      isDark
        ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/8'
        : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/8'
    }`,
  divider: (isDark: boolean) =>
    `w-px h-4 mx-0.5 ${isDark ? 'bg-zinc-700' : 'bg-zinc-400'}`,
  emptyText: (isDark: boolean) => (isDark ? 'text-zinc-700' : 'text-zinc-400'),
  dragOverlay:
    'absolute inset-0 z-20 flex items-center justify-center bg-black/70 border-2 border-dashed border-red-600 pointer-events-none',
}
