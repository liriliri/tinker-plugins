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
  searchInput: (isDark: boolean) =>
    `w-full pl-7 pr-7 py-1 text-[10px] tracking-wide rounded border focus:outline-none focus:ring-1 ${
      isDark
        ? 'bg-[#1a1a1e] border-[#333338] text-gray-200 placeholder:text-gray-600 focus:ring-[#4b5691]/50 focus:border-[#4b5691]/50'
        : 'bg-white border-[#d0d0d6] text-gray-800 placeholder:text-gray-400 focus:ring-[#4b5691]/30 focus:border-[#4b5691]/50'
    }`,
  searchIcon: (isDark: boolean) => (isDark ? 'text-gray-600' : 'text-gray-400'),
  searchClear: (isDark: boolean) =>
    isDark
      ? 'text-gray-600 hover:text-gray-300'
      : 'text-gray-400 hover:text-gray-600',
  searchDropdown: (isDark: boolean) =>
    `absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded border shadow-lg z-50 ${
      isDark ? 'bg-[#222226] border-[#333338]' : 'bg-white border-[#d0d0d6]'
    }`,
  searchDropdownItem: (isDark: boolean, active: boolean) =>
    `w-full text-left px-3 py-1.5 flex items-center gap-2 text-[10px] cursor-pointer ${
      active
        ? isDark
          ? 'bg-[#4b5691]/20 text-[#8a94c0]'
          : 'bg-[#4b5691]/10 text-[#4b5691]'
        : isDark
          ? 'text-gray-300 hover:bg-[#4b5691]/10 hover:text-[#8a94c0]'
          : 'text-gray-600 hover:bg-[#4b5691]/10 hover:text-[#4b5691]'
    }`,
  searchDropdownIcon: (isDark: boolean) =>
    isDark ? 'text-gray-500' : 'text-gray-400',
  btnActive: (isDark: boolean) =>
    `flex items-center gap-1.5 px-2 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 ${
      isDark
        ? 'text-[#8a94c0] bg-[#4b5691]/15'
        : 'text-[#4b5691] bg-[#4b5691]/10'
    }`,
  sidebar: (isDark: boolean) =>
    `flex flex-col w-52 shrink-0 border-r overflow-hidden ${
      isDark ? 'bg-[#222226] border-[#333338]' : 'bg-[#e4e4e8] border-[#d0d0d6]'
    }`,
  sidebarItem: (isDark: boolean, active: boolean) =>
    `w-full text-left px-3 py-2 flex items-center gap-2 text-[10px] transition-colors ${
      active
        ? isDark
          ? 'bg-[#4b5691]/20 text-[#8a94c0]'
          : 'bg-[#4b5691]/10 text-[#4b5691]'
        : isDark
          ? 'text-gray-300 hover:bg-[#4b5691]/10 hover:text-[#8a94c0]'
          : 'text-gray-600 hover:bg-[#4b5691]/10 hover:text-[#4b5691]'
    }`,
  sidebarItemIcon: (isDark: boolean) =>
    isDark ? 'text-gray-500 shrink-0' : 'text-gray-400 shrink-0',
  sidebarEmpty: (isDark: boolean) =>
    `text-center text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`,
}
