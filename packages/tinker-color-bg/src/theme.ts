export const tw = {
  text: {
    secondary: 'text-[color:var(--cb-text-dim)]',
    muted: 'text-[color:var(--cb-text-mute)]',
  },
  surface: {
    footer:
      'border-t border-[color:var(--cb-line)] bg-[color:var(--cb-panel-solid)]/70',
  },
  divider: 'h-px w-full bg-[color:var(--cb-line)]',

  scrollArea: {
    root: 'min-h-0 flex-1 overflow-hidden',
    viewport: 'h-full w-full [&>div]:!block',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-opacity duration-200 data-[orientation=vertical]:w-1.5 data-[state=visible]:opacity-100 data-[state=hidden]:opacity-0',
    thumb:
      'relative flex-1 rounded-full bg-[color:var(--cb-line-hi)] hover:bg-[color:var(--cb-accent)]',
  },
}
