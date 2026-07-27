export const tw = {
  background: {
    primary: 'bg-[#F2F3F1] dark:bg-[#0E1114]',
    card: 'bg-white dark:bg-[#161A1F]',
    hover: 'hover:bg-[#EBEEEA] dark:hover:bg-[#1C2229]',
    inset: 'bg-[#EBEEEA] dark:bg-[#12161B]',
  },

  text: {
    primary: 'text-[#12161B] dark:text-[#E8EBE7]',
    secondary: 'text-[#5A635C] dark:text-[#9AA39B]',
    tertiary: 'text-[#8A938C] dark:text-[#6B746D]',
  },

  border: {
    card: 'border border-[#D6DBD4] dark:border-[#2A3138]',
    divider: 'border-[#D6DBD4] dark:border-[#2A3138]',
  },

  overlay: 'bg-black/45',

  button: {
    primary: {
      base: 'bg-[#C2410C] text-white rounded-sm px-3.5 py-1.5 text-sm font-medium tracking-wide',
      hover: 'hover:bg-[#EA580C] active:bg-[#C2410C]',
      disabled: 'disabled:opacity-40 disabled:cursor-not-allowed',
      transition: 'transition-colors duration-150',
    },
    secondary: {
      base: 'bg-transparent text-[#5A635C] dark:text-[#9AA39B] rounded-sm px-3.5 py-1.5 text-sm font-medium border border-[#D6DBD4] dark:border-[#2A3138]',
      hover:
        'hover:bg-[#EBEEEA] dark:hover:bg-[#1C2229] hover:text-[#12161B] dark:hover:text-[#E8EBE7]',
      transition: 'transition-colors duration-150',
    },
    ghost: {
      base: 'bg-transparent text-[#8A938C] dark:text-[#6B746D] rounded-sm px-2 py-1 text-xs font-medium',
      hover:
        'hover:text-[#12161B] dark:hover:text-[#E8EBE7] hover:bg-[#EBEEEA] dark:hover:bg-[#1C2229]',
      transition: 'transition-colors duration-150',
    },
  },

  input: {
    base: 'bg-white dark:bg-[#12161B] border border-[#D6DBD4] dark:border-[#2A3138] rounded-sm px-3 py-2 text-sm text-[#12161B] dark:text-[#E8EBE7] outline-none w-full placeholder:text-[#8A938C] dark:placeholder:text-[#6B746D]',
    focus:
      'focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]/30 dark:focus:ring-[#FB923C]/25',
  },

  progress: {
    track: 'bg-[#D6DBD4] dark:bg-[#2A3138]',
    bar: 'bg-[#C2410C] dark:bg-[#FB923C]',
  },

  accent: {
    text: 'text-[#C2410C] dark:text-[#FB923C]',
    tab: {
      active:
        'text-[#C2410C] dark:text-[#FB923C] border-[#C2410C] dark:border-[#FB923C]',
      inactive:
        'border-transparent hover:text-[#12161B] dark:hover:text-[#E8EBE7]',
    },
    badge: {
      active: 'bg-[#C2410C] text-white',
      inactive:
        'bg-[#EBEEEA] dark:bg-[#1C2229] text-[#8A938C] dark:text-[#6B746D]',
    },
  },

  status: {
    iconMerging: 'text-[#A16207] dark:text-[#EAB308]',
    textDone: 'text-[#2563EB] dark:text-[#60A5FA]',
    textError: 'text-[#DC2626]',
    deleteButton:
      'text-[#8A938C] hover:text-[#DC2626] dark:text-[#6B746D] dark:hover:text-[#F87171]',
  },

  scrollbar: {
    thumb: 'bg-[#D6DBD4] dark:bg-[#2A3138]',
    area: [
      '[scrollbar-width:thin]',
      '[scrollbar-color:#D6DBD4_transparent]',
      'dark:[scrollbar-color:#2A3138_transparent]',
      '[&::-webkit-scrollbar]:w-1.5',
      '[&::-webkit-scrollbar]:h-1.5',
      '[&::-webkit-scrollbar-track]:bg-transparent',
      '[&::-webkit-scrollbar-thumb]:rounded-sm',
      '[&::-webkit-scrollbar-thumb]:bg-[#D6DBD4]',
      'dark:[&::-webkit-scrollbar-thumb]:bg-[#2A3138]',
    ].join(' '),
  },

  cover: {
    placeholder: 'bg-[#EBEEEA] dark:bg-[#1C2229]',
    gradient: 'bg-gradient-to-t from-black/80 via-black/25 to-transparent',
    title: 'text-white',
    meta: 'text-white/65',
    metaMuted: 'text-white/60',
    metaSep: 'text-white/30',
  },

  format: {
    active:
      'border-[#C2410C] bg-[#FFF7ED] dark:border-[#FB923C] dark:bg-[#7C2D12]/35',
    inactive: 'border-[#D6DBD4] dark:border-[#2A3138]',
  },

  label: {
    section:
      'text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A938C] dark:text-[#6B746D]',
  },

  toast: {
    root: 'bg-white dark:bg-[#161A1F] border border-[#D6DBD4] dark:border-[#2A3138] rounded-sm shadow-lg px-4 py-3 flex items-start gap-3',
    info: 'text-[#C2410C] dark:text-[#FB923C]',
    error: 'text-[#DC2626]',
    success: 'text-[#2563EB] dark:text-[#60A5FA]',
    title: 'text-[12px] font-semibold tracking-wide',
    description:
      'text-[12px] text-[#5A635C] dark:text-[#9AA39B] mt-0.5 break-words leading-relaxed',
    close:
      'text-[#8A938C] hover:text-[#12161B] dark:hover:text-[#E8EBE7] cursor-pointer bg-transparent border-none p-0',
    viewport:
      'fixed bottom-4 right-4 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] z-[100]',
  },

  modal: {
    shell:
      'rounded-sm shadow-2xl outline-none overflow-hidden border border-[#D6DBD4] dark:border-[#2A3138]',
  },
}
