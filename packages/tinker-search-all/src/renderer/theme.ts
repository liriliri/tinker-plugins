export const tw = {
  app: 'relative bg-[var(--sa-mist)] text-[var(--sa-ink)]',
  content: 'relative z-10',
  query: {
    wrap: 'border-b border-[var(--sa-border)]',
    input:
      'bg-transparent text-[var(--sa-ink)] caret-[var(--sa-accent)] outline-none border-none placeholder:text-[var(--sa-ash)]/70',
    clear:
      'text-[var(--sa-ash)] hover:text-[var(--sa-ink)] hover:bg-[var(--sa-ink)]/8',
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
}
