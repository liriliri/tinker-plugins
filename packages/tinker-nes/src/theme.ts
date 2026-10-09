export const tw = {
  appBg: 'bg-[#f5f5f6] text-gray-700 dark:bg-[#1c1c1f] dark:text-gray-200',
  toolbar:
    'bg-[#eaeaec] border-[#d8d8dc] dark:bg-[#242428] dark:border-[#333337]',
  btn: 'flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 text-gray-500 hover:text-[#af1c29] hover:bg-[#af1c29]/10 dark:text-gray-400 dark:hover:text-[#d4545f] dark:hover:bg-[#af1c29]/15',
  btnActive:
    'flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 text-[#af1c29] bg-[#af1c29]/10 dark:text-[#d4545f] dark:bg-[#af1c29]/15',
  divider: 'w-px h-4 mx-0.5 bg-gray-300 dark:bg-gray-600',
  emptyText: 'text-gray-400 dark:text-gray-600',
  dragOverlay:
    'absolute inset-0 z-20 flex items-center justify-center bg-black/70 border-2 border-dashed border-[#af1c29]/50 pointer-events-none',
  dragText: 'text-[#af1c29] dark:text-[#d4545f]',
  dialogOverlay: 'bg-black/30 dark:bg-black/60',
  dialogBg:
    'bg-[#f5f5f6] border-[#d8d8dc] text-gray-700 dark:bg-[#242428] dark:border-[#333337] dark:text-gray-200',
  dialogBorder: 'border-[#d8d8dc] dark:border-[#333337]',
  tableBg: 'bg-[#ededef] dark:bg-[#1c1c1f]',
  tableHeader: 'text-gray-400 dark:text-gray-500',
  dialogBindingBtn: (active: boolean) =>
    `flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
      active
        ? 'bg-[#af1c29]/15 text-[#af1c29] animate-pulse dark:bg-[#af1c29]/25 dark:text-[#d4545f]'
        : 'bg-gray-200 text-gray-500 hover:bg-[#af1c29]/10 hover:text-[#af1c29] dark:bg-gray-700/40 dark:text-gray-400 dark:hover:bg-[#af1c29]/15 dark:hover:text-[#d4545f]'
    }`,
  dialogSaveBtn: 'bg-[#af1c29] text-white hover:bg-[#c4303d]',
  searchInput:
    'w-full pl-7 pr-7 py-1 text-[10px] tracking-wide rounded border focus:outline-none focus:ring-1 bg-white border-[#d8d8dc] text-gray-700 placeholder:text-gray-400 focus:ring-[#af1c29]/30 focus:border-[#af1c29]/50 dark:bg-[#1c1c1f] dark:border-[#333337] dark:text-gray-200 dark:placeholder:text-gray-600 dark:focus:ring-[#af1c29]/50 dark:focus:border-[#af1c29]/50',
  searchIcon: 'text-gray-400 dark:text-gray-600',
  searchClear:
    'text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-300',
  searchDropdown:
    'absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded border shadow-lg z-50 bg-white border-[#d8d8dc] dark:bg-[#242428] dark:border-[#333337]',
  searchDropdownItem: (active: boolean) =>
    `w-full text-left px-3 py-1.5 flex items-center gap-2 text-[10px] cursor-pointer ${
      active
        ? 'bg-[#af1c29]/10 text-[#af1c29] dark:bg-[#af1c29]/20 dark:text-[#d4545f]'
        : 'text-gray-600 hover:bg-[#af1c29]/10 hover:text-[#af1c29] dark:text-gray-300 dark:hover:bg-[#af1c29]/10 dark:hover:text-[#d4545f]'
    }`,
  searchDropdownIcon: 'text-gray-400 dark:text-gray-500',
  sidebar:
    'flex flex-col w-52 shrink-0 border-r overflow-hidden bg-[#eaeaec] border-[#d8d8dc] dark:bg-[#242428] dark:border-[#333337]',
  sidebarItem: (active: boolean) =>
    `flex items-center gap-1 px-3 py-2 text-[10px] transition-colors ${
      active
        ? 'bg-[#af1c29]/10 text-[#af1c29] dark:bg-[#af1c29]/20 dark:text-[#d4545f]'
        : 'text-gray-600 hover:bg-[#af1c29]/10 hover:text-[#af1c29] dark:text-gray-300 dark:hover:bg-[#af1c29]/10 dark:hover:text-[#d4545f]'
    }`,
  sidebarItemBtn:
    'flex-1 min-w-0 flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer',
  sidebarDeleteBtn:
    'shrink-0 p-0.5 rounded text-gray-400 hover:text-[#af1c29] dark:text-gray-500 dark:hover:text-[#d4545f]',
  sidebarItemIcon: 'text-gray-400 shrink-0 dark:text-gray-500',
  sidebarEmpty: 'text-center text-[10px] text-gray-400 dark:text-gray-600',
  toast: {
    root: 'rounded border shadow-lg px-4 py-3 flex items-start gap-3 bg-white border-[#d8d8dc] dark:bg-[#242428] dark:border-[#333337]',
    title:
      'text-[10px] font-semibold tracking-wide text-[#af1c29] dark:text-[#d4545f]',
    description: 'text-[10px] mt-0.5 text-gray-500 dark:text-gray-400',
    close:
      'text-gray-400 hover:text-gray-600 cursor-pointer dark:text-gray-500 dark:hover:text-gray-300',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
}
