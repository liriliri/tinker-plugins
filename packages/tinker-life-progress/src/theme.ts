export const progressColors = {
  'bg-rose-500': {
    track: 'text-rose-200/60 dark:text-rose-900/60',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'text-rose-500',
    gradient: 'from-rose-400 to-rose-600',
  },
  'bg-amber-500': {
    track: 'text-amber-200/60 dark:text-amber-900/60',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'text-amber-500',
    gradient: 'from-amber-400 to-amber-600',
  },
  'bg-emerald-500': {
    track: 'text-emerald-200/60 dark:text-emerald-900/60',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'text-emerald-500',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  'bg-purple-500': {
    track: 'text-purple-200/60 dark:text-purple-900/60',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'text-purple-500',
    gradient: 'from-purple-400 to-purple-600',
  },
  'bg-blue-500': {
    track: 'text-blue-200/60 dark:text-blue-900/60',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'text-blue-500',
    gradient: 'from-blue-400 to-blue-600',
  },
}

export type ProgressColorKey = keyof typeof progressColors

export const tw = {
  background: {
    gradient:
      'bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950',
    card: 'bg-white/70 dark:bg-zinc-800/70',
    tag: 'bg-zinc-100 dark:bg-zinc-700/50',
  },
  text: {
    primary: 'text-zinc-900 dark:text-zinc-100',
    secondary: 'text-zinc-600 dark:text-zinc-400',
    muted: 'text-zinc-500 dark:text-zinc-400',
  },
  border: {
    card: 'border border-zinc-100 dark:border-zinc-700/50',
    button:
      'border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
  },
  input: {
    base: 'border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50',
  },
  dialog: {
    content:
      'border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900',
  },
  progressBar: {
    track: 'bg-zinc-100 dark:bg-zinc-700/50',
  },
  button: {
    settingsHover: 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
  },
}
