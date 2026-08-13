const ACCENT = {
  light: 'text-[#b45309]',
  dark: 'text-[#f0a53f]',
}

export const tw = {
  appBg: (isDark: boolean) =>
    isDark ? 'bg-[#17171a] text-gray-200' : 'bg-[#f4f4f6] text-gray-700',
  toolbar: (isDark: boolean) =>
    `border-b ${
      isDark ? 'bg-[#1f1f24] border-[#313137]' : 'bg-[#eeeef1] border-[#d7d7dd]'
    }`,
  btn: (isDark: boolean) =>
    `flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-100 active:scale-95 ${
      isDark
        ? 'text-gray-400 hover:text-gray-100 hover:bg-white/8'
        : 'text-gray-500 hover:text-gray-900 hover:bg-black/6'
    }`,
  btnActive: (isDark: boolean) =>
    `flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-100 active:scale-95 ${
      isDark ? 'text-gray-100 bg-white/10' : 'text-gray-900 bg-black/8'
    }`,
  divider: (isDark: boolean) =>
    `w-px h-4 mx-1.5 ${isDark ? 'bg-[#35353c]' : 'bg-[#d7d7dd]'}`,
  sidebar: (isDark: boolean) =>
    `flex flex-col w-56 shrink-0 border-r ${
      isDark ? 'bg-[#292930] border-[#35353c]' : 'bg-[#e4e4ea] border-[#d0d0d8]'
    }`,
  sidebarItem: (isDark: boolean) =>
    `group flex items-center gap-1.5 px-2.5 py-1 cursor-default transition-colors ${
      isDark
        ? 'text-gray-300 hover:bg-white/5'
        : 'text-gray-600 hover:bg-black/4'
    }`,
  sidebarItemBtn:
    'flex-1 min-w-0 truncate text-left font-mono text-[11px] uppercase bg-transparent border-none p-0 cursor-default',
  sidebarItemIcon: (isDark: boolean) =>
    `shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`,
  sidebarDeleteBtn: (isDark: boolean) =>
    `shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${
      isDark
        ? 'text-gray-500 hover:text-[#f0a53f]'
        : 'text-gray-400 hover:text-[#b45309]'
    }`,
  sidebarEmpty: (isDark: boolean) =>
    `px-6 text-center text-[11px] leading-relaxed ${
      isDark ? 'text-gray-600' : 'text-gray-400'
    }`,
  sidebarEmptyIcon: (isDark: boolean) =>
    isDark ? 'text-[#2f2f36]' : 'text-[#dcdce3]',
  screenText: (isDark: boolean) => (isDark ? 'text-gray-400' : 'text-gray-300'),
  loadingTrack: 'relative w-32 h-px overflow-hidden bg-white/12',
  loadingBar: (isDark: boolean) =>
    `absolute inset-y-0 left-0 w-1/3 animate-sweep ${
      isDark ? 'bg-[#f0a53f]' : 'bg-[#b45309]'
    }`,
  toast: {
    root: (isDark: boolean) =>
      `rounded-md border shadow-lg px-4 py-3 flex items-start gap-3 ${
        isDark ? 'bg-[#232328] border-[#35353c]' : 'bg-white border-[#d7d7dd]'
      }`,
    title: (isDark: boolean) =>
      `text-[11px] font-semibold tracking-wide ${
        isDark ? ACCENT.dark : ACCENT.light
      }`,
    description: (isDark: boolean) =>
      `text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    close: (isDark: boolean) =>
      isDark
        ? 'text-gray-500 hover:text-gray-300 cursor-pointer'
        : 'text-gray-400 hover:text-gray-600 cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-50',
  },
}
