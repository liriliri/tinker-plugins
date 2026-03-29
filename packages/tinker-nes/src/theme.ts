export const tw = {
  appBg: (isDark: boolean) =>
    isDark ? 'bg-[#1c1c1f] text-gray-200' : 'bg-[#f5f5f6] text-gray-700',
  toolbar: (isDark: boolean) =>
    isDark ? 'bg-[#242428] border-[#333337]' : 'bg-[#eaeaec] border-[#d8d8dc]',
  btn: (isDark: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 ${
      isDark
        ? 'text-gray-400 hover:text-[#d4545f] hover:bg-[#af1c29]/15'
        : 'text-gray-500 hover:text-[#af1c29] hover:bg-[#af1c29]/10'
    }`,
  divider: (isDark: boolean) =>
    `w-px h-4 mx-0.5 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`,
  emptyText: (isDark: boolean) => (isDark ? 'text-gray-600' : 'text-gray-400'),
  dragOverlay:
    'absolute inset-0 z-20 flex items-center justify-center bg-black/70 border-2 border-dashed border-[#af1c29]/50 pointer-events-none',
  dragText: (isDark: boolean) => (isDark ? 'text-[#d4545f]' : 'text-[#af1c29]'),
  dialogOverlay: (isDark: boolean) => (isDark ? 'bg-black/60' : 'bg-black/30'),
  dialogBg: (isDark: boolean) =>
    isDark
      ? 'bg-[#242428] border-[#333337] text-gray-200'
      : 'bg-[#f5f5f6] border-[#d8d8dc] text-gray-700',
  dialogBorder: (isDark: boolean) =>
    isDark ? 'border-[#333337]' : 'border-[#d8d8dc]',
  tableBg: (isDark: boolean) => (isDark ? 'bg-[#1c1c1f]' : 'bg-[#ededef]'),
  tableHeader: (isDark: boolean) =>
    isDark ? 'text-gray-500' : 'text-gray-400',
  dialogBindingBtn: (isDark: boolean, active: boolean) =>
    `flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
      active
        ? isDark
          ? 'bg-[#af1c29]/25 text-[#d4545f] animate-pulse'
          : 'bg-[#af1c29]/15 text-[#af1c29] animate-pulse'
        : isDark
          ? 'bg-gray-700/40 text-gray-400 hover:bg-[#af1c29]/15 hover:text-[#d4545f]'
          : 'bg-gray-200 text-gray-500 hover:bg-[#af1c29]/10 hover:text-[#af1c29]'
    }`,
  dialogSaveBtn: 'bg-[#af1c29] text-white hover:bg-[#c4303d]',
}
