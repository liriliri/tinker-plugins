export const tw = {
  app: 'relative bg-[var(--sa-mist)] text-[var(--sa-ink)]',
  content: 'relative z-10',
  iconBtn:
    'flex items-center justify-center w-6 h-6 rounded-md border-none bg-transparent cursor-pointer transition-colors text-[var(--sa-ash)] hover:text-[var(--sa-ink)] hover:bg-[var(--sa-ink)]/8',
  query: {
    wrap: 'border-b border-[var(--sa-border)]',
    input:
      'bg-transparent text-[var(--sa-ink)] caret-[var(--sa-accent)] outline-none border-none placeholder:text-[var(--sa-ash)]/70',
  },
  chip: {
    base: 'text-[var(--sa-ash)] hover:text-[var(--sa-ink)] hover:bg-[var(--sa-ink)]/6',
    active: 'text-[var(--sa-ink)] bg-[var(--sa-ink)]/10',
  },
  section: 'text-[var(--sa-ash)]',
  row: {
    idle: 'text-[var(--sa-ink)] hover:bg-[var(--sa-ink)]/5',
    active: 'bg-[var(--sa-signal)] text-[var(--sa-on-signal)]',
    title: 'text-[var(--sa-ink)]',
    titleActive: 'text-[var(--sa-on-signal)]',
    subtitle: 'text-[var(--sa-ash)]',
    subtitleActive: 'text-[var(--sa-on-signal)]/80',
    iconFallback: 'text-[var(--sa-ash)]',
  },
  empty: 'text-[var(--sa-ash)]',
  footer: {
    bar: 'bg-[var(--sa-bar)] text-[var(--sa-ash)] border-[var(--sa-border)]',
    kbd: 'bg-[var(--sa-kbd)] text-[var(--sa-ink)]/70',
  },
  dialog: {
    overlay: 'sa-dialog-overlay',
    content: 'sa-dialog-content',
    header:
      'flex items-center justify-between gap-3 px-4 pt-3.5 pb-3 border-b border-[var(--sa-border)]',
    title:
      'text-[12px] font-semibold tracking-[0.04em] uppercase text-[var(--sa-ash)]',
    body: 'p-3',
    row: 'w-full flex items-center justify-between gap-4 rounded-xl border border-[var(--sa-border)] bg-[var(--sa-panel-row)] px-3.5 py-3 cursor-pointer transition-colors hover:border-[color-mix(in_srgb,var(--sa-accent)_35%,var(--sa-border))]',
    rowStatic:
      'w-full flex items-center justify-between gap-4 rounded-xl border border-[var(--sa-border)] bg-[var(--sa-panel-row)] px-3.5 py-3',
    rowTitle: 'text-[13px] font-medium text-[var(--sa-ink)] leading-tight',
    rowHint: 'text-[11px] text-[var(--sa-ash)] leading-snug mt-1',
    rowError: 'text-[11px] text-[var(--sa-danger)] leading-snug mt-1',
    kbd: 'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-medium bg-[var(--sa-kbd)] text-[var(--sa-ink)]/70',
    toggle:
      'relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 border-none p-0 cursor-pointer',
    toggleOn: 'bg-[var(--sa-accent)]',
    toggleOff: 'bg-[var(--sa-toggle)]',
    thumb:
      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200',
    thumbOn: 'translate-x-4',
    thumbOff: 'translate-x-0',
  },
  hotkey: {
    input:
      'min-w-[120px] shrink-0 px-2.5 py-1.5 text-[12px] font-medium text-center border rounded-lg cursor-pointer select-none transition-colors outline-none',
    idle: 'bg-[var(--sa-mist)] border-[var(--sa-border)] text-[var(--sa-ink)] hover:border-[color-mix(in_srgb,var(--sa-accent)_40%,var(--sa-border))]',
    recording:
      'bg-[color-mix(in_srgb,var(--sa-accent)_12%,var(--sa-panel))] border-[var(--sa-accent)] text-[var(--sa-accent)] animate-pulse',
  },
}
