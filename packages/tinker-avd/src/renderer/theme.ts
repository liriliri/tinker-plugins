export const tw = {
  background: {
    app: 'bg-[var(--window)]',
    toolbar: 'bg-[var(--toolbar)]',
    header: 'bg-[var(--header)]',
    row: 'bg-[var(--window)] hover:bg-[var(--hover)]',
    rowSelected: 'bg-[var(--select)]',
    dialog: 'bg-[var(--window)]',
  },
  text: {
    primary: 'text-[var(--ink)]',
    secondary: 'text-[var(--muted)]',
    onSelect: 'text-[var(--select-text)]',
    onSelectMuted: 'text-[var(--select-muted)]',
  },
  border: {
    divider: 'border-[var(--line)]',
    separator: 'bg-[var(--line)]',
  },
  button: {
    icon: 'flex items-center justify-center w-6 h-6 rounded-sm bg-transparent border-none cursor-default text-[var(--ink)] hover:bg-[var(--hover)] active:bg-[var(--line)] disabled:opacity-40 disabled:cursor-default',
    secondary:
      'px-3 h-6 min-w-[64px] rounded-sm text-[12px] border border-[var(--line)] cursor-default bg-[var(--toolbar)] text-[var(--ink)] hover:bg-[var(--hover)] disabled:opacity-40',
    danger:
      'px-3 h-6 min-w-[64px] rounded-sm text-[12px] border border-transparent cursor-default bg-[var(--danger)] text-[var(--danger-text)] hover:brightness-110 disabled:opacity-40',
  },
  input:
    'h-6 px-2 text-[12px] rounded-sm outline-none border border-[var(--line)] bg-[var(--input)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--select)]',
  toast: {
    root: 'bg-[var(--window)] border border-[var(--line)] rounded-sm shadow-md px-3 py-2 flex items-center gap-2',
    success: 'text-[var(--ink)]',
    error: 'text-[var(--danger)]',
    description: 'flex-1 min-w-0 text-[12px]',
    close:
      'text-[var(--muted)] hover:text-[var(--ink)] cursor-default bg-transparent border-none p-0',
    viewport: 'fixed bottom-3 right-3 flex flex-col gap-1.5 w-64 z-50',
  },
  overlay: 'bg-black/35',
  tooltip:
    'bg-[var(--ink)] text-[var(--window)] text-[11px] px-1.5 py-0.5 rounded-sm shadow select-none z-50',
  empty: 'text-[var(--muted)]',
}
