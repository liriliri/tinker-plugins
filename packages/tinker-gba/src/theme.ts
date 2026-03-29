export const tw = {
  appBg: (isDark: boolean) =>
    isDark ? 'bg-[#1a1a1e] text-gray-200' : 'bg-[#f0f0f2] text-gray-800',
  toolbar: (isDark: boolean) =>
    isDark ? 'bg-[#222226] border-[#333338]' : 'bg-[#e4e4e8] border-[#d0d0d6]',
  btn: (isDark: boolean) =>
    `flex items-center gap-1.5 px-2 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 ${
      isDark
        ? 'text-gray-400 hover:text-[#8a94c0] hover:bg-[#4b5691]/15'
        : 'text-gray-500 hover:text-[#4b5691] hover:bg-[#4b5691]/10'
    }`,
  divider: (isDark: boolean) =>
    `w-px h-4 mx-0.5 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`,
  emptyText: () => 'text-gray-400',
  dragOverlay:
    'absolute inset-0 z-20 flex items-center justify-center bg-black/80 border-2 border-dashed border-[#4b5691]/60 pointer-events-none',
  dragText: (isDark: boolean) => (isDark ? 'text-[#8a94c0]' : 'text-[#4b5691]'),
  dialogOverlay: (isDark: boolean) => (isDark ? 'bg-black/60' : 'bg-black/30'),
  dialogBg: (isDark: boolean) =>
    isDark
      ? 'bg-[#222226] border-[#333338] text-gray-200'
      : 'bg-[#f0f0f2] border-[#d0d0d6] text-gray-800',
  dialogBorder: (isDark: boolean) =>
    isDark ? 'border-[#333338]' : 'border-[#d0d0d6]',
  tableBg: (isDark: boolean) => (isDark ? 'bg-[#1a1a1e]' : 'bg-[#e8e8ec]'),
  tableHeader: (isDark: boolean) =>
    isDark ? 'text-gray-500' : 'text-gray-400',
  dialogBindingBtn: (isDark: boolean, active: boolean) =>
    `flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
      active
        ? isDark
          ? 'bg-[#4b5691]/25 text-[#8a94c0] animate-pulse'
          : 'bg-[#4b5691]/15 text-[#4b5691] animate-pulse'
        : isDark
          ? 'bg-gray-700/40 text-gray-400 hover:bg-[#4b5691]/15 hover:text-[#8a94c0]'
          : 'bg-gray-200 text-gray-500 hover:bg-[#4b5691]/10 hover:text-[#4b5691]'
    }`,
  dialogSaveBtn: () => 'bg-[#4b5691] text-white hover:bg-[#5a67a5]',
}
