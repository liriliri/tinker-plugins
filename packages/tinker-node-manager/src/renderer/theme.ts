export const tw = {
  background: {
    app: 'bg-[var(--window)]',
    toolbar: 'bg-[var(--toolbar)]',
    header: 'bg-[var(--header)]',
    row: 'bg-[var(--window)] hover:bg-[var(--hover)]',
    rowDefault: 'bg-[var(--row-default)] hover:bg-[var(--row-default-hover)]',
    dialog: 'bg-[var(--window)]',
  },
  text: {
    primary: 'text-[var(--ink)]',
    secondary: 'text-[var(--muted)]',
  },
  border: {
    divider: 'border-[var(--line)]',
  },
  button: {
    icon: 'flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none cursor-default text-[var(--ink)] hover:bg-[var(--hover)] hover:text-[var(--select-strong)] active:bg-[var(--line)] disabled:opacity-40 disabled:cursor-default disabled:hover:text-[var(--ink)]',
    secondary:
      'px-3 h-6 min-w-[64px] rounded-md text-[12px] border border-[var(--line)] cursor-default bg-[var(--toolbar)] text-[var(--ink)] hover:bg-[var(--hover)] disabled:opacity-40',
    danger:
      'px-3 h-6 min-w-[64px] rounded-md text-[12px] border border-transparent cursor-default bg-[var(--danger)] text-[var(--danger-text)] hover:brightness-110 disabled:opacity-40',
  },
  badgeLts:
    'inline-flex items-center px-1.5 h-[18px] rounded-full text-[10px] font-semibold tracking-wide bg-[var(--badge-lts)] text-[var(--badge-lts-text)]',
  progress: {
    track: 'h-1 w-full rounded-full overflow-hidden bg-[var(--progress-track)]',
    bar: 'h-full w-2/5 rounded-full bg-[var(--select)] progress-indeterminate',
  },
  input:
    'h-8 px-2.5 text-[12px] rounded-md outline-none border border-[var(--line)] bg-[var(--input)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--select)] focus:shadow-[inset_0_0_0_1px_var(--select),0_0_0_3px_var(--focus-ring)]',
  toast: {
    root: 'bg-[var(--window)] border border-[var(--line)] rounded-md shadow-md px-3 py-2 flex items-center gap-2',
    success: 'text-[var(--ink)]',
    error: 'text-[var(--danger)]',
    description: 'flex-1 min-w-0 text-[12px]',
    close:
      'text-[var(--muted)] hover:text-[var(--ink)] cursor-default bg-transparent border-none p-0',
    viewport: 'fixed bottom-3 right-3 flex flex-col gap-1.5 w-64 z-50',
  },
  overlay: 'bg-black/35',
  tooltip:
    'bg-[var(--ink)] text-[var(--window)] text-[11px] px-1.5 py-0.5 rounded-md shadow select-none z-50',
  scrollArea: {
    root: 'min-h-0 flex-1 overflow-hidden',
    viewport: 'h-full w-full [&>div]:!block',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-opacity duration-200 data-[orientation=vertical]:w-1.5 data-[state=visible]:opacity-100 data-[state=hidden]:opacity-0',
    thumb:
      'relative flex-1 rounded-full bg-[color-mix(in_srgb,var(--muted)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--muted)_60%,transparent)]',
  },
  empty: 'text-[var(--muted)]',
}
