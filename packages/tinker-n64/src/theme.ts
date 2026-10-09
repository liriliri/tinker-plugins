export const tw = {
  appBg: 'bg-[#f6f4ef] text-gray-700 dark:bg-[#1e1c18] dark:text-gray-200',
  toolbar:
    'bg-[#ebe8e0] border-[#ddd8ce] dark:bg-[#262420] dark:border-[#3a3630]',
  btn: 'flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 text-gray-500 hover:text-[#c4920a] hover:bg-[#c4920a]/10 dark:text-gray-400 dark:hover:text-[#e6c04a] dark:hover:bg-[#c4920a]/15',
  btnActive:
    'flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tracking-wider rounded transition-all duration-100 active:scale-95 text-[#c4920a] bg-[#c4920a]/10 dark:text-[#e6c04a] dark:bg-[#c4920a]/15',
  divider: 'w-px h-4 mx-0.5 bg-gray-300 dark:bg-gray-600',
  emptyText: 'text-gray-400 dark:text-gray-600',
  dragOverlay:
    'absolute inset-0 z-20 flex items-center justify-center bg-black/70 border-2 border-dashed border-[#c4920a]/50 pointer-events-none',
  dragText: 'text-[#c4920a] dark:text-[#e6c04a]',
  dialogOverlay: 'bg-black/30 dark:bg-black/60',
  dialogBg:
    'bg-[#f6f4ef] border-[#ddd8ce] text-gray-700 dark:bg-[#262420] dark:border-[#3a3630] dark:text-gray-200',
  dialogBorder: 'border-[#ddd8ce] dark:border-[#3a3630]',
  tableBg: 'bg-[#f0ece4] dark:bg-[#1e1c18]',
  tableHeader: 'text-gray-400 dark:text-gray-500',
  dialogBindingBtn: (active: boolean) =>
    `flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
      active
        ? 'bg-[#c4920a]/15 text-[#c4920a] animate-pulse dark:bg-[#c4920a]/25 dark:text-[#e6c04a]'
        : 'bg-gray-200 text-gray-500 hover:bg-[#c4920a]/10 hover:text-[#c4920a] dark:bg-gray-700/40 dark:text-gray-400 dark:hover:bg-[#c4920a]/15 dark:hover:text-[#e6c04a]'
    }`,
  dialogSaveBtn: 'bg-[#c4920a] text-white hover:bg-[#d4a817]',
  searchInput:
    'w-full pl-7 pr-7 py-1 text-[10px] tracking-wide rounded border focus:outline-none focus:ring-1 bg-white border-[#ddd8ce] text-gray-700 placeholder:text-gray-400 focus:ring-[#c4920a]/30 focus:border-[#c4920a]/50 dark:bg-[#1e1c18] dark:border-[#3a3630] dark:text-gray-200 dark:placeholder:text-gray-600 dark:focus:ring-[#c4920a]/50 dark:focus:border-[#c4920a]/50',
  searchIcon: 'text-gray-400 dark:text-gray-600',
  searchClear:
    'text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-300',
  searchDropdown:
    'absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded border shadow-lg z-50 bg-white border-[#ddd8ce] dark:bg-[#262420] dark:border-[#3a3630]',
  searchDropdownItem: (active: boolean) =>
    `w-full text-left px-3 py-1.5 flex items-center gap-2 text-[10px] cursor-pointer ${
      active
        ? 'bg-[#c4920a]/10 text-[#c4920a] dark:bg-[#c4920a]/20 dark:text-[#e6c04a]'
        : 'text-gray-600 hover:bg-[#c4920a]/10 hover:text-[#c4920a] dark:text-gray-300 dark:hover:bg-[#c4920a]/10 dark:hover:text-[#e6c04a]'
    }`,
  searchDropdownIcon: 'text-gray-400 dark:text-gray-500',
  sidebar:
    'flex flex-col w-52 shrink-0 border-r overflow-hidden bg-[#ebe8e0] border-[#ddd8ce] dark:bg-[#262420] dark:border-[#3a3630]',
  sidebarItem: (active: boolean) =>
    `flex items-center gap-1 px-3 py-2 text-[10px] transition-colors ${
      active
        ? 'bg-[#c4920a]/10 text-[#c4920a] dark:bg-[#c4920a]/20 dark:text-[#e6c04a]'
        : 'text-gray-600 hover:bg-[#c4920a]/10 hover:text-[#c4920a] dark:text-gray-300 dark:hover:bg-[#c4920a]/10 dark:hover:text-[#e6c04a]'
    }`,
  sidebarItemBtn:
    'flex-1 min-w-0 flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer',
  sidebarDeleteBtn:
    'shrink-0 p-0.5 rounded text-gray-400 hover:text-[#c4920a] dark:text-gray-500 dark:hover:text-[#e6c04a]',
  sidebarItemIcon: 'text-gray-400 shrink-0 dark:text-gray-500',
  sidebarEmpty: 'text-center text-[10px] text-gray-400 dark:text-gray-600',
  toast: {
    root: 'rounded border shadow-lg px-4 py-3 flex items-start gap-3 bg-white border-[#ddd8ce] dark:bg-[#262420] dark:border-[#3a3630]',
    title:
      'text-[10px] font-semibold tracking-wide text-[#c4920a] dark:text-[#e6c04a]',
    description: 'text-[10px] mt-0.5 text-gray-500 dark:text-gray-400',
    close:
      'text-gray-400 hover:text-gray-600 cursor-pointer dark:text-gray-500 dark:hover:text-gray-300',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
  scrollArea: {
    root: 'flex flex-col flex-1 min-h-0 overflow-hidden',
    viewport: 'flex-1 min-h-0 w-full [&>div]:!block',
    scrollbar:
      'flex select-none touch-none p-0.5 transition-colors data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2 bg-transparent',
    thumb:
      'flex-1 rounded-full relative bg-[#ddd8ce] hover:bg-[#c4920a]/40 dark:bg-[#3a3630] dark:hover:bg-[#c4920a]/50',
  },
}
