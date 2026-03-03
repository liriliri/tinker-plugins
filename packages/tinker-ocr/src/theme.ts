export const tw = {
  background: {
    primary: 'bg-white dark:bg-zinc-900',
    secondary: 'bg-zinc-50 dark:bg-zinc-800',
    results: 'bg-zinc-50 dark:bg-zinc-800',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    secondary: 'text-zinc-600 dark:text-zinc-400',
    muted: 'text-zinc-500 dark:text-zinc-400',
    icon: 'text-zinc-400 dark:text-zinc-500',
    groupHoverBlue: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
  },
  border: {
    color: 'border-zinc-200 dark:border-zinc-700',
    muted: 'border-zinc-300 dark:border-zinc-600',
    hoverBlue: 'hover:border-blue-400 dark:hover:border-blue-500',
    groupHoverBlue:
      'group-hover:border-blue-400 dark:group-hover:border-blue-500',
  },
  accent: {
    bg: 'bg-blue-500 dark:bg-blue-600',
    text: 'text-white',
    blue: 'text-blue-500 dark:text-blue-400',
    border: 'border-blue-500 dark:border-blue-400',
  },
  select: {
    trigger:
      'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700',
    chevron: 'text-zinc-400 dark:text-zinc-500',
    content: 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800',
    item: 'text-zinc-700 dark:text-zinc-300 data-highlighted:bg-zinc-100 dark:data-highlighted:bg-zinc-700',
    itemChecked:
      'data-[state=checked]:text-blue-600 dark:data-[state=checked]:text-blue-400',
    itemIndicator: 'text-blue-500 dark:text-blue-400',
    shadow:
      'shadow-[0_8px_24px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]',
  },
  button: {
    icon: 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700',
    disabled: 'cursor-not-allowed text-zinc-300 dark:text-zinc-600',
    activeToggle:
      'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  },
  divider: 'bg-zinc-200 dark:bg-zinc-700',
}
