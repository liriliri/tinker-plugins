export const tw = {
  background: {
    primary: 'bg-[#F4F5F7] dark:bg-[#18191C]',
    card: 'bg-white dark:bg-[#212225] shadow-sm dark:shadow-none',
    hover: 'hover:bg-[#F4F5F7] dark:hover:bg-[#2C2D30]',
  },

  text: {
    primary: 'text-[#18191C] dark:text-[#E3E5E7]',
    secondary: 'text-[#61666D] dark:text-[#9499A0]',
    tertiary: 'text-[#9499A0] dark:text-[#61666D]',
    white: 'text-white',
  },

  border: {
    card: 'dark:border dark:border-[#303030]',
    divider: 'border-[#E3E5E7] dark:border-[#303030]',
  },

  button: {
    primary: {
      base: 'bg-[#FB7299] text-white rounded-full px-4 py-2 font-medium',
      hover: 'hover:bg-[#FC8BAB] active:scale-95',
      disabled:
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
      transition: 'transition-all duration-150',
    },
    secondary: {
      base: 'bg-[#F4F5F7] dark:bg-[#2C2D30] text-[#61666D] dark:text-[#9499A0] rounded-full px-4 py-2 font-medium',
      hover: 'hover:bg-[#E3E5E7] dark:hover:bg-[#303030]',
      transition: 'transition-all duration-150',
    },
  },

  input: {
    base: 'bg-white dark:bg-[#2C2D30] border border-[#E3E5E7] dark:border-transparent rounded-full px-4 py-2 text-sm text-[#18191C] dark:text-[#E3E5E7] outline-none w-full placeholder:text-[#9499A0]',
    focus: 'focus:ring-2 focus:ring-[#FB7299] focus:ring-opacity-30',
  },

  progress: {
    track: 'bg-[#E3E5E7] dark:bg-[#303030]',
    bar: 'bg-gradient-to-r from-[#FB7299] to-[#FC8BAB]',
  },

  bilibili: {
    accent: 'text-[#FB7299]',
    accentBg: 'bg-[#FB7299]',
    accentGradient: 'from-[#FB7299] to-[#FC8BAB]',
    accentCheckbox: 'accent-[#FB7299]',
    tab: {
      active: 'text-[#FB7299] border-[#FB7299]',
      inactive: 'border-transparent hover:text-[#FB7299]',
    },
    badge: {
      active: 'bg-[#FB7299] text-white',
      inactive: 'bg-[#E3E5E7] dark:bg-[#303030] text-[#9499A0]',
    },
    qualityButton: {
      active: 'bg-[#FB7299] text-white',
      inactive:
        'bg-[#F4F5F7] dark:bg-[#2C2D30] text-[#61666D] dark:text-[#9499A0] hover:bg-[#E3E5E7] dark:hover:bg-[#303030]',
    },
  },

  status: {
    downloading: 'border-l-[3px] border-l-[#FB7299]',
    merging: 'border-l-[3px] border-l-[#FAAB53]',
    done: 'border-l-[3px] border-l-[#52C41A]',
    error: 'border-l-[3px] border-l-[#FF4D4F]',
    pending: 'border-l-[3px] border-l-[#E3E5E7] dark:border-l-[#303030]',
    iconMerging: 'text-[#FAAB53]',
    iconDownloading: 'text-[#FB7299]',
    textDone: 'text-[#52C41A]',
    textError: 'text-[#FF4D4F]',
    deleteButton: 'text-[#9499A0] hover:text-[#FF4D4F]',
  },

  scrollbar: {
    thumb: 'bg-[#E3E5E7] dark:bg-[#303030]',
    track:
      'data-[state=unchecked]:bg-[#E3E5E7] dark:data-[state=unchecked]:bg-[#303030]',
  },
}
