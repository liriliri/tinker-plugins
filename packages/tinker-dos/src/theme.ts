export const tw = {
  appBg: 'bg-[#f4f4f6] text-gray-700 dark:bg-[#17171a] dark:text-gray-200',
  toolbar:
    'border-b bg-[#eeeef1] border-[#d7d7dd] dark:bg-[#1f1f24] dark:border-[#313137]',
  btn: 'flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-100 active:scale-95 text-gray-500 hover:text-gray-900 hover:bg-black/6 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-white/8',
  btnActive:
    'flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-100 active:scale-95 text-gray-900 bg-black/8 dark:text-gray-100 dark:bg-white/10',
  divider: 'w-px h-4 mx-1.5 bg-[#d7d7dd] dark:bg-[#35353c]',
  sidebar:
    'flex flex-col w-56 shrink-0 border-r bg-[#e4e4ea] border-[#d0d0d8] dark:bg-[#292930] dark:border-[#35353c]',
  sidebarItem:
    'group flex items-center gap-1.5 px-2.5 py-1 cursor-default transition-colors text-gray-600 hover:bg-black/4 dark:text-gray-300 dark:hover:bg-white/5',
  sidebarItemBtn:
    'flex-1 min-w-0 truncate text-left font-mono text-[11px] uppercase bg-transparent border-none p-0 cursor-default',
  sidebarItemIcon: 'shrink-0 text-gray-400 dark:text-gray-600',
  sidebarDeleteBtn:
    'shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-gray-400 hover:text-[#b45309] dark:text-gray-500 dark:hover:text-[#f0a53f]',
  sidebarEmpty:
    'px-6 text-center text-[11px] leading-relaxed text-gray-400 dark:text-gray-600',
  sidebarEmptyIcon: 'text-[#dcdce3] dark:text-[#2f2f36]',
  screenText: 'text-gray-300 dark:text-gray-400',
  loadingTrack: 'relative w-32 h-px overflow-hidden bg-white/12',
  loadingBar:
    'absolute inset-y-0 left-0 w-1/3 animate-sweep bg-[#b45309] dark:bg-[#f0a53f]',
  toast: {
    root: 'rounded-md border shadow-lg px-4 py-3 flex items-start gap-3 bg-white border-[#d7d7dd] dark:bg-[#232328] dark:border-[#35353c]',
    title:
      'text-[11px] font-semibold tracking-wide text-[#b45309] dark:text-[#f0a53f]',
    description: 'text-[11px] mt-0.5 text-gray-500 dark:text-gray-400',
    close:
      'text-gray-400 hover:text-gray-600 cursor-pointer dark:text-gray-500 dark:hover:text-gray-300',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
}
