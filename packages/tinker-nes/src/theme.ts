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
  searchInput: (isDark: boolean) =>
    `w-full pl-7 pr-7 py-1 text-[10px] tracking-wide rounded border focus:outline-none focus:ring-1 ${
      isDark
        ? 'bg-[#1c1c1f] border-[#333337] text-gray-200 placeholder:text-gray-600 focus:ring-[#af1c29]/50 focus:border-[#af1c29]/50'
        : 'bg-white border-[#d8d8dc] text-gray-700 placeholder:text-gray-400 focus:ring-[#af1c29]/30 focus:border-[#af1c29]/50'
    }`,
  searchIcon: (isDark: boolean) => (isDark ? 'text-gray-600' : 'text-gray-400'),
  searchClear: (isDark: boolean) =>
    isDark
      ? 'text-gray-600 hover:text-gray-300'
      : 'text-gray-400 hover:text-gray-600',
  searchDropdown: (isDark: boolean) =>
    `absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded border shadow-lg z-50 ${
      isDark ? 'bg-[#242428] border-[#333337]' : 'bg-white border-[#d8d8dc]'
    }`,
  searchDropdownItem: (isDark: boolean, active: boolean) =>
    `w-full text-left px-3 py-1.5 flex items-center gap-2 text-[10px] cursor-pointer ${
      active
        ? isDark
          ? 'bg-[#af1c29]/20 text-[#d4545f]'
          : 'bg-[#af1c29]/10 text-[#af1c29]'
        : isDark
          ? 'text-gray-300 hover:bg-[#af1c29]/10 hover:text-[#d4545f]'
          : 'text-gray-600 hover:bg-[#af1c29]/10 hover:text-[#af1c29]'
    }`,
  searchDropdownIcon: (isDark: boolean) =>
    isDark ? 'text-gray-500' : 'text-gray-400',
  btnActive: (isDark: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 ${
      isDark
        ? 'text-[#d4545f] bg-[#af1c29]/15'
        : 'text-[#af1c29] bg-[#af1c29]/10'
    }`,
  sidebar: (isDark: boolean) =>
    `flex flex-col w-52 shrink-0 border-r overflow-hidden ${
      isDark ? 'bg-[#242428] border-[#333337]' : 'bg-[#eaeaec] border-[#d8d8dc]'
    }`,
  sidebarItem: (isDark: boolean, active: boolean) =>
    `flex items-center gap-1 px-3 py-2 text-[10px] transition-colors ${
      active
        ? isDark
          ? 'bg-[#af1c29]/20 text-[#d4545f]'
          : 'bg-[#af1c29]/10 text-[#af1c29]'
        : isDark
          ? 'text-gray-300 hover:bg-[#af1c29]/10 hover:text-[#d4545f]'
          : 'text-gray-600 hover:bg-[#af1c29]/10 hover:text-[#af1c29]'
    }`,
  sidebarItemBtn:
    'flex-1 min-w-0 flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer',
  sidebarDeleteBtn: (isDark: boolean) =>
    `shrink-0 p-0.5 rounded ${
      isDark
        ? 'text-gray-500 hover:text-[#d4545f]'
        : 'text-gray-400 hover:text-[#af1c29]'
    }`,
  sidebarItemIcon: (isDark: boolean) =>
    isDark ? 'text-gray-500 shrink-0' : 'text-gray-400 shrink-0',
  sidebarEmpty: (isDark: boolean) =>
    `text-center text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`,
  toast: {
    root: (isDark: boolean) =>
      `rounded border shadow-lg px-4 py-3 flex items-start gap-3 ${
        isDark ? 'bg-[#242428] border-[#333337]' : 'bg-white border-[#d8d8dc]'
      }`,
    title: (isDark: boolean) =>
      `text-[10px] font-semibold tracking-wide ${
        isDark ? 'text-[#d4545f]' : 'text-[#af1c29]'
      }`,
    description: (isDark: boolean) =>
      `text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    close: (isDark: boolean) =>
      isDark
        ? 'text-gray-500 hover:text-gray-300 cursor-pointer'
        : 'text-gray-400 hover:text-gray-600 cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
}
