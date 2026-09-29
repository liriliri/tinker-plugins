export const tw = {
  app: 'bg-[var(--st-chrome)] text-[var(--st-ink)]',
  chrome:
    'bg-[var(--st-panel)] border-b border-[var(--st-line)] shadow-[0_1px_0_var(--st-shine)]',
  panel:
    'bg-[var(--st-panel)] border border-[var(--st-line)] shadow-[inset_0_1px_0_var(--st-shine)]',
  panelHeader:
    'flex items-center justify-between border-b border-[var(--st-line)] px-3 py-2',
  cell: 'bg-[var(--st-cell)] border border-[var(--st-line)]',
  label:
    'font-[family-name:var(--st-ui)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--st-muted)]',
  mono: 'font-[family-name:var(--st-mono)] tabular-nums',
  muted: 'text-[var(--st-muted)]',
  ink: 'text-[var(--st-ink)]',
  tick: 'text-[var(--st-tick)]',
  toneDown: 'text-[var(--st-accent)]',
  toneUp: 'text-[var(--st-up)]',
  select:
    'h-7 min-w-[9.5rem] rounded-[3px] border border-[var(--st-line)] bg-[var(--st-field)] px-2 text-[12px] text-[var(--st-ink)] outline-none focus:border-[var(--st-accent)] disabled:opacity-40',
  btnPrimary:
    'h-7 min-w-[4.5rem] rounded-[3px] border border-[var(--st-accent-edge)] bg-[var(--st-accent)] px-3 text-[12px] font-semibold text-white outline-none hover:brightness-105 active:brightness-95 disabled:opacity-40',
  btnStop:
    'h-7 min-w-[4.5rem] rounded-[3px] border border-[var(--st-danger-edge)] bg-[var(--st-danger)] px-3 text-[12px] font-semibold text-white outline-none hover:brightness-105 active:brightness-95',
  statusDot:
    'h-1.5 w-1.5 rounded-full bg-[var(--st-tick)] data-[state=running]:bg-[var(--st-accent)] data-[state=running]:shadow-[0_0_6px_var(--st-accent)] data-[state=running]:animate-pulse data-[state=done]:bg-[var(--st-up)]',
  lcd: 'bg-[var(--st-lcd)] text-[var(--st-lcd-glow)]',
  lcdValue:
    'text-[42px] font-semibold leading-none tracking-tight [text-shadow:0_0_18px_color-mix(in_srgb,var(--st-lcd-glow)_35%,transparent)]',
  lcdUnit:
    'mt-1 text-[12px] uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--st-lcd-glow)_65%,transparent)]',
  meterTrack: 'relative h-3 rounded-[2px] bg-[var(--st-track)]',
  meterFill:
    'absolute inset-y-0 left-0 rounded-[2px] bg-[var(--st-accent)] transition-[width] duration-150 data-[live=true]:shadow-[0_0_8px_color-mix(in_srgb,var(--st-accent)_45%,transparent)]',
  meterNeedle:
    'absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-[var(--st-ink)] transition-[left] duration-150',
  toast: {
    root: 'bg-[var(--st-panel)] border border-[var(--st-line)] rounded-[4px] shadow-lg px-3 py-2.5 flex items-start gap-2',
    title: 'text-[12px] font-semibold text-[var(--st-danger)]',
    description: 'text-[12px] text-[var(--st-muted)] mt-0.5',
    close: 'text-[var(--st-muted)] hover:text-[var(--st-ink)] cursor-pointer',
    viewport: 'fixed bottom-3 right-3 flex flex-col gap-2 w-72 z-50',
  },
}
