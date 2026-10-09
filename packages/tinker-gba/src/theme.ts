export const tw = {
  appBg: 'bg-[#f0f0f2] text-gray-800 dark:bg-[#1a1a1e] dark:text-gray-200',
  toolbar:
    'bg-[#e4e4e8] border-[#d0d0d6] dark:bg-[#222226] dark:border-[#333338]',
  btn: 'flex items-center gap-1.5 px-2 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 text-gray-500 hover:text-[#4b5691] hover:bg-[#4b5691]/10 dark:text-gray-400 dark:hover:text-[#8a94c0] dark:hover:bg-[#4b5691]/15',
  btnActive:
    'flex items-center gap-1.5 px-2 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 text-[#4b5691] bg-[#4b5691]/10 dark:text-[#8a94c0] dark:bg-[#4b5691]/15',
  divider: 'w-px h-4 mx-0.5 bg-gray-300 dark:bg-gray-600',
  emptyText: 'text-gray-400',
  dragOverlay:
    'absolute inset-0 z-20 flex items-center justify-center bg-black/80 border-2 border-dashed border-[#4b5691]/60 pointer-events-none',
  dragText: 'text-[#4b5691] dark:text-[#8a94c0]',
  dialogOverlay: 'bg-black/30 dark:bg-black/60',
  dialogBg:
    'bg-[#f0f0f2] border-[#d0d0d6] text-gray-800 dark:bg-[#222226] dark:border-[#333338] dark:text-gray-200',
  dialogBorder: 'border-[#d0d0d6] dark:border-[#333338]',
  tableBg: 'bg-[#e8e8ec] dark:bg-[#1a1a1e]',
  tableHeader: 'text-gray-400 dark:text-gray-500',
  dialogBindingBtn: (active: boolean) =>
    `flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
      active
        ? 'bg-[#4b5691]/15 text-[#4b5691] animate-pulse dark:bg-[#4b5691]/25 dark:text-[#8a94c0]'
        : 'bg-gray-200 text-gray-500 hover:bg-[#4b5691]/10 hover:text-[#4b5691] dark:bg-gray-700/40 dark:text-gray-400 dark:hover:bg-[#4b5691]/15 dark:hover:text-[#8a94c0]'
    }`,
  dialogSaveBtn: 'bg-[#4b5691] text-white hover:bg-[#5a67a5]',
  searchInput:
    'w-full pl-7 pr-7 py-1 text-[10px] tracking-wide rounded border focus:outline-none focus:ring-1 bg-white border-[#d0d0d6] text-gray-800 placeholder:text-gray-400 focus:ring-[#4b5691]/30 focus:border-[#4b5691]/50 dark:bg-[#1a1a1e] dark:border-[#333338] dark:text-gray-200 dark:placeholder:text-gray-600 dark:focus:ring-[#4b5691]/50 dark:focus:border-[#4b5691]/50',
  searchIcon: 'text-gray-400 dark:text-gray-600',
  searchClear:
    'text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-300',
  searchDropdown:
    'absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded border shadow-lg z-50 bg-white border-[#d0d0d6] dark:bg-[#222226] dark:border-[#333338]',
  searchDropdownItem: (active: boolean) =>
    `w-full text-left px-3 py-1.5 flex items-center gap-2 text-[10px] cursor-pointer ${
      active
        ? 'bg-[#4b5691]/10 text-[#4b5691] dark:bg-[#4b5691]/20 dark:text-[#8a94c0]'
        : 'text-gray-600 hover:bg-[#4b5691]/10 hover:text-[#4b5691] dark:text-gray-300 dark:hover:bg-[#4b5691]/10 dark:hover:text-[#8a94c0]'
    }`,
  searchDropdownIcon: 'text-gray-400 dark:text-gray-500',
  sidebar:
    'flex flex-col w-52 shrink-0 border-r overflow-hidden bg-[#e4e4e8] border-[#d0d0d6] dark:bg-[#222226] dark:border-[#333338]',
  sidebarItem: (active: boolean) =>
    `flex items-center gap-1 px-3 py-2 text-[10px] transition-colors ${
      active
        ? 'bg-[#4b5691]/10 text-[#4b5691] dark:bg-[#4b5691]/20 dark:text-[#8a94c0]'
        : 'text-gray-600 hover:bg-[#4b5691]/10 hover:text-[#4b5691] dark:text-gray-300 dark:hover:bg-[#4b5691]/10 dark:hover:text-[#8a94c0]'
    }`,
  sidebarItemBtn:
    'flex-1 min-w-0 flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer',
  sidebarDeleteBtn:
    'shrink-0 p-0.5 rounded text-gray-400 hover:text-[#4b5691] dark:text-gray-500 dark:hover:text-[#8a94c0]',
  sidebarItemIcon: 'text-gray-400 shrink-0 dark:text-gray-500',
  sidebarEmpty: 'text-center text-[10px] text-gray-400 dark:text-gray-600',
  toast: {
    root: 'rounded border shadow-lg px-4 py-3 flex items-start gap-3 bg-white border-[#d0d0d6] dark:bg-[#222226] dark:border-[#333338]',
    title:
      'text-[10px] font-semibold tracking-wide text-[#4b5691] dark:text-[#8a94c0]',
    description: 'text-[10px] mt-0.5 text-gray-500 dark:text-gray-400',
    close:
      'text-gray-400 hover:text-gray-600 cursor-pointer dark:text-gray-500 dark:hover:text-gray-300',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
}
