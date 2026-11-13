export const tw = {
  background: {
    app: 'bg-[var(--window)]',
    chrome: 'bg-[var(--chrome)]',
    panel: 'bg-[var(--panel)]',
    row: 'bg-[var(--window)] hover:bg-[var(--hover)]',
    rowActive: 'bg-[var(--row-active)] hover:bg-[var(--row-active-hover)]',
  },
  text: {
    primary: 'text-[var(--ink)]',
    secondary: 'text-[var(--muted)]',
    accent: 'text-[var(--accent)]',
    link: 'text-[var(--accent)] hover:underline',
    package:
      'text-[var(--accent)] hover:text-[var(--accent-strong)] group-hover:underline',
    packageActive: 'text-[var(--accent-strong)]',
    stat: 'text-[var(--stat)]',
  },
  border: {
    divider: 'border-[var(--line)]',
  },
  input:
    'h-9 pl-9 pr-3 text-[13px] rounded-sm outline-none border border-transparent bg-[var(--input)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]',
  button: {
    icon: 'inline-flex items-center justify-center w-7 h-7 rounded-sm border-none cursor-default bg-transparent text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--ink)]',
  },
  badge:
    'inline-flex items-center px-1.5 h-[18px] rounded-sm text-[10px] font-medium bg-[var(--badge)] text-[var(--badge-text)]',
  keyword:
    'inline-flex items-center px-1.5 h-[18px] rounded-sm text-[10px] font-medium border border-[var(--line)] text-[var(--muted)] bg-transparent',
  toast: {
    root: 'bg-[var(--window)] border border-[var(--line)] rounded-sm shadow-md px-3 py-2 flex items-center gap-2',
    success: 'text-[var(--ink)]',
    error: 'text-[var(--danger)]',
    description: 'flex-1 min-w-0 text-[12px]',
    close:
      'text-[var(--muted)] hover:text-[var(--ink)] cursor-default bg-transparent border-none p-0',
    viewport: 'fixed bottom-3 right-3 flex flex-col gap-1.5 w-72 z-50',
  },
  scrollArea: {
    root: 'min-h-0 flex-1 overflow-hidden',
    viewport: 'h-full w-full [&>div]:!block',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-opacity duration-200 data-[orientation=vertical]:w-1.5 data-[state=visible]:opacity-100 data-[state=hidden]:opacity-0',
    thumb:
      'relative flex-1 rounded-full bg-[color-mix(in_srgb,var(--muted)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--muted)_60%,transparent)]',
  },
  searchIcon:
    'absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)] pointer-events-none',
  empty: 'text-[var(--muted)]',
  tab: {
    list: 'flex items-center gap-0 px-4 border-b shrink-0 bg-[var(--window)]',
    triggers: 'flex items-center gap-0 min-w-0',
    actions: 'ml-auto flex items-center gap-1.5 shrink-0 pl-2',
    trigger:
      'px-3 h-11 text-[12px] border-none cursor-default bg-transparent text-[var(--muted)] hover:text-[var(--ink)] border-b-2 border-transparent -mb-px',
    triggerActive:
      'px-3 h-11 text-[12px] border-none cursor-default bg-transparent text-[var(--ink)] font-semibold border-b-2 border-[var(--accent)] -mb-px',
  },
  tabSelect:
    'h-8 max-w-[140px] px-2 text-[11px] rounded-sm outline-none border border-[var(--line)] bg-[var(--input)] text-[var(--ink)] focus:border-[var(--accent)]',
  tabPrimaryIcon:
    'inline-flex items-center justify-center w-8 h-8 rounded-sm border-none cursor-default bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-strong)] disabled:opacity-40 disabled:cursor-default',
  tabSecondaryIcon:
    'inline-flex items-center justify-center w-8 h-8 rounded-sm border border-[var(--line)] cursor-default bg-[var(--window)] text-[var(--ink)] hover:bg-[var(--hover)] disabled:opacity-40 disabled:cursor-default',
}
