export const tw = {
  appBg: (isDark: boolean) =>
    isDark ? 'bg-[#1e1c18] text-gray-200' : 'bg-[#f6f4ef] text-gray-700',
  toolbar: (isDark: boolean) =>
    isDark ? 'bg-[#262420] border-[#3a3630]' : 'bg-[#ebe8e0] border-[#ddd8ce]',
  btn: (isDark: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 ${
      isDark
        ? 'text-gray-400 hover:text-[#e6c04a] hover:bg-[#c4920a]/15'
        : 'text-gray-500 hover:text-[#c4920a] hover:bg-[#c4920a]/10'
    }`,
  divider: (isDark: boolean) =>
    `w-px h-4 mx-0.5 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`,
  emptyText: (isDark: boolean) => (isDark ? 'text-gray-600' : 'text-gray-400'),
  dragOverlay:
    'absolute inset-0 z-20 flex items-center justify-center bg-black/70 border-2 border-dashed border-[#c4920a]/50 pointer-events-none',
  dragText: (isDark: boolean) => (isDark ? 'text-[#e6c04a]' : 'text-[#c4920a]'),
  dialogOverlay: (isDark: boolean) => (isDark ? 'bg-black/60' : 'bg-black/30'),
  dialogBg: (isDark: boolean) =>
    isDark
      ? 'bg-[#262420] border-[#3a3630] text-gray-200'
      : 'bg-[#f6f4ef] border-[#ddd8ce] text-gray-700',
  dialogBorder: (isDark: boolean) =>
    isDark ? 'border-[#3a3630]' : 'border-[#ddd8ce]',
  tableBg: (isDark: boolean) => (isDark ? 'bg-[#1e1c18]' : 'bg-[#f0ece4]'),
  tableHeader: (isDark: boolean) =>
    isDark ? 'text-gray-500' : 'text-gray-400',
  dialogBindingBtn: (isDark: boolean, active: boolean) =>
    `flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
      active
        ? isDark
          ? 'bg-[#c4920a]/25 text-[#e6c04a] animate-pulse'
          : 'bg-[#c4920a]/15 text-[#c4920a] animate-pulse'
        : isDark
          ? 'bg-gray-700/40 text-gray-400 hover:bg-[#c4920a]/15 hover:text-[#e6c04a]'
          : 'bg-gray-200 text-gray-500 hover:bg-[#c4920a]/10 hover:text-[#c4920a]'
    }`,
  dialogSaveBtn: 'bg-[#c4920a] text-white hover:bg-[#d4a817]',
  searchInput: (isDark: boolean) =>
    `w-full pl-7 pr-7 py-1 text-[10px] tracking-wide rounded border focus:outline-none focus:ring-1 ${
      isDark
        ? 'bg-[#1e1c18] border-[#3a3630] text-gray-200 placeholder:text-gray-600 focus:ring-[#c4920a]/50 focus:border-[#c4920a]/50'
        : 'bg-white border-[#ddd8ce] text-gray-700 placeholder:text-gray-400 focus:ring-[#c4920a]/30 focus:border-[#c4920a]/50'
    }`,
  searchIcon: (isDark: boolean) => (isDark ? 'text-gray-600' : 'text-gray-400'),
  searchClear: (isDark: boolean) =>
    isDark
      ? 'text-gray-600 hover:text-gray-300'
      : 'text-gray-400 hover:text-gray-600',
  searchDropdown: (isDark: boolean) =>
    `absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded border shadow-lg z-50 ${
      isDark ? 'bg-[#262420] border-[#3a3630]' : 'bg-white border-[#ddd8ce]'
    }`,
  searchDropdownItem: (isDark: boolean, active: boolean) =>
    `w-full text-left px-3 py-1.5 flex items-center gap-2 text-[10px] cursor-pointer ${
      active
        ? isDark
          ? 'bg-[#c4920a]/20 text-[#e6c04a]'
          : 'bg-[#c4920a]/10 text-[#c4920a]'
        : isDark
          ? 'text-gray-300 hover:bg-[#c4920a]/10 hover:text-[#e6c04a]'
          : 'text-gray-600 hover:bg-[#c4920a]/10 hover:text-[#c4920a]'
    }`,
  searchDropdownIcon: (isDark: boolean) =>
    isDark ? 'text-gray-500' : 'text-gray-400',
  btnActive: (isDark: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 ${
      isDark
        ? 'text-[#e6c04a] bg-[#c4920a]/15'
        : 'text-[#c4920a] bg-[#c4920a]/10'
    }`,
  sidebar: (isDark: boolean) =>
    `flex flex-col w-52 shrink-0 border-r overflow-hidden ${
      isDark ? 'bg-[#262420] border-[#3a3630]' : 'bg-[#ebe8e0] border-[#ddd8ce]'
    }`,
  sidebarItem: (isDark: boolean, active: boolean) =>
    `flex items-center gap-1 px-3 py-2 text-[10px] transition-colors ${
      active
        ? isDark
          ? 'bg-[#c4920a]/20 text-[#e6c04a]'
          : 'bg-[#c4920a]/10 text-[#c4920a]'
        : isDark
          ? 'text-gray-300 hover:bg-[#c4920a]/10 hover:text-[#e6c04a]'
          : 'text-gray-600 hover:bg-[#c4920a]/10 hover:text-[#c4920a]'
    }`,
  sidebarItemBtn:
    'flex-1 min-w-0 flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer',
  sidebarDeleteBtn: (isDark: boolean) =>
    `shrink-0 p-0.5 rounded ${
      isDark
        ? 'text-gray-500 hover:text-[#e6c04a]'
        : 'text-gray-400 hover:text-[#c4920a]'
    }`,
  sidebarItemIcon: (isDark: boolean) =>
    isDark ? 'text-gray-500 shrink-0' : 'text-gray-400 shrink-0',
  sidebarEmpty: (isDark: boolean) =>
    `text-center text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`,
  toast: {
    root: (isDark: boolean) =>
      `rounded border shadow-lg px-4 py-3 flex items-start gap-3 ${
        isDark ? 'bg-[#262420] border-[#3a3630]' : 'bg-white border-[#ddd8ce]'
      }`,
    title: (isDark: boolean) =>
      `text-[10px] font-semibold tracking-wide ${
        isDark ? 'text-[#e6c04a]' : 'text-[#c4920a]'
      }`,
    description: (isDark: boolean) =>
      `text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    close: (isDark: boolean) =>
      isDark
        ? 'text-gray-500 hover:text-gray-300 cursor-pointer'
        : 'text-gray-400 hover:text-gray-600 cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
  scrollArea: {
    root: 'flex flex-col flex-1 min-h-0 overflow-hidden',
    viewport: 'flex-1 min-h-0 w-full [&>div]:!block',
    scrollbar: (isDark: boolean) =>
      `flex select-none touch-none p-0.5 transition-colors data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2 ${
        isDark ? 'bg-transparent' : 'bg-transparent'
      }`,
    thumb: (isDark: boolean) =>
      `flex-1 rounded-full relative ${
        isDark
          ? 'bg-[#3a3630] hover:bg-[#c4920a]/50'
          : 'bg-[#ddd8ce] hover:bg-[#c4920a]/40'
      }`,
  },
}
