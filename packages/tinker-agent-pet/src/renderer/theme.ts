/** Shared visual tokens — desk chrome + sticker-card pets. */
export const tw = {
  brand: {
    solid:
      'bg-[var(--pet-pop)] hover:bg-[var(--pet-pop-hot)] text-white shadow-[0_2px_0_var(--pet-pop-shadow)] active:translate-y-px active:shadow-none',
    accent: '#ff7a45',
    pop: 'text-[var(--pet-pop)]',
  },
  background: {
    app: 'bg-[var(--pet-desk)]',
    toolbar: 'bg-[var(--pet-paper)]/90 backdrop-blur-md',
    field: 'bg-[var(--pet-field)]',
    rule: 'bg-[var(--pet-line)]',
  },
  text: {
    primary: 'text-[var(--pet-ink)]',
    muted: 'text-[var(--pet-muted)]',
    mutedHover:
      'text-[var(--pet-muted)] hover:text-[var(--pet-ink)] cursor-pointer',
  },
  border: {
    divider: 'border-[var(--pet-line)]',
    divide: 'divide-[var(--pet-line)]',
  },
  input: {
    base: 'bg-[var(--pet-field)] text-[var(--pet-ink)] placeholder-[var(--pet-muted)] rounded-xl px-3 h-8 text-[13px] font-medium outline-none border-2 border-transparent focus:border-[var(--pet-pop)] transition-[border-color,box-shadow] duration-150',
  },
  button: {
    icon: 'flex items-center justify-center w-8 h-8 rounded-xl bg-transparent border-none cursor-pointer text-[var(--pet-muted)] hover:bg-[var(--pet-field)] hover:text-[var(--pet-ink)] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
    iconDanger:
      'flex items-center justify-center w-7 h-7 rounded-xl bg-transparent border-none cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors duration-150',
    iconOnMedia:
      'flex items-center justify-center w-8 h-8 rounded-xl border-none cursor-pointer bg-[var(--pet-ink)]/35 text-white hover:bg-[var(--pet-ink)]/55 hover:text-white transition-colors duration-150',
    primary:
      'inline-flex items-center justify-center gap-1 px-3 h-8 rounded-xl bg-[var(--pet-pop)] hover:bg-[var(--pet-pop-hot)] text-white text-[12px] font-bold border-none cursor-pointer shadow-[0_2px_0_var(--pet-pop-shadow)] active:translate-y-px active:shadow-none transition-[transform,box-shadow,background-color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0',
    secondary:
      'inline-flex items-center justify-center gap-1 px-3 h-8 rounded-xl bg-[var(--pet-field)] hover:bg-[var(--pet-field-hot)] text-[var(--pet-ink)] text-[12px] font-bold border-none cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
  },
  card: {
    base: 'group rounded-2xl border-2 border-[var(--pet-line)] bg-[var(--pet-paper)] overflow-hidden flex flex-col shadow-[0_2px_0_var(--pet-line)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--pet-line)]',
    row: 'flex items-center gap-2.5 rounded-2xl border-2 border-[var(--pet-line)] bg-[var(--pet-field)] px-2.5 py-2',
    stage:
      'bg-[color-mix(in_srgb,var(--pet-accent)_16%,var(--pet-paper))] [background-image:radial-gradient(var(--pet-dot)_1px,transparent_1px)] [background-size:8px_8px]',
    badge:
      'absolute bottom-1.5 left-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg bg-[var(--pet-ink)]/70 text-white backdrop-blur-sm',
    meta: 'rounded-2xl border-2 border-[var(--pet-line)] bg-[var(--pet-field)] p-3',
    tag: 'text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[var(--pet-field)] text-[var(--pet-muted)] border border-[var(--pet-line)]',
  },
  select: {
    trigger:
      'inline-flex items-center gap-1.5 h-8 pr-2 rounded-xl bg-[var(--pet-field)] text-[var(--pet-ink)] text-[13px] font-medium border-2 border-transparent outline-none cursor-pointer hover:bg-[var(--pet-field-hot)] focus:border-[var(--pet-pop)] data-[state=open]:border-[var(--pet-pop)] transition-colors',
    icon: 'shrink-0 text-[var(--pet-muted)] flex items-center',
    chevron: 'shrink-0 flex items-center text-[var(--pet-muted)]',
    content:
      'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border-2 border-[var(--pet-line)] bg-[var(--pet-paper)] shadow-[0_8px_24px_rgba(36,48,71,0.14)] animate-fade-up',
    item: 'relative flex items-center gap-2 h-8 pl-8 pr-3 rounded-xl text-[13px] font-semibold text-[var(--pet-ink)] outline-none cursor-pointer select-none data-[highlighted]:bg-[var(--pet-field)] data-[state=checked]:text-[var(--pet-pop-ink)]',
    indicator: 'absolute left-2.5 flex items-center text-[var(--pet-pop)]',
  },
  overlay: {
    backdrop: 'fixed inset-0 z-40 bg-[var(--pet-ink)]/35 backdrop-blur-[2px]',
    panel:
      'rounded-3xl border-2 border-[var(--pet-line)] bg-[var(--pet-paper)] shadow-[0_12px_40px_rgba(36,48,71,0.18)] flex flex-col overflow-hidden animate-fade-up',
    header:
      'flex items-center justify-between gap-3 px-4 py-3 border-b-2 border-[var(--pet-line)] shrink-0 bg-[var(--pet-field)]',
    drawer:
      'w-full max-w-md h-full bg-[var(--pet-paper)] border-l-2 border-[var(--pet-line)] shadow-[-8px_0_32px_rgba(36,48,71,0.12)] flex flex-col overflow-hidden',
    footer:
      'shrink-0 p-4 border-t-2 border-[var(--pet-line)] bg-[var(--pet-field)]',
  },
  alert: {
    error:
      'flex items-center justify-between gap-2 rounded-xl border-2 border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 px-3 py-2 text-sm font-medium',
  },
  empty: {
    iconWrap:
      'w-12 h-12 rounded-2xl border-2 border-dashed border-[var(--pet-line)] flex items-center justify-center',
  },
  toast: {
    root: 'bg-[var(--pet-paper)] border-2 border-[var(--pet-line)] rounded-2xl shadow-[0_8px_24px_rgba(36,48,71,0.12)] px-4 py-3 flex items-start gap-3',
    title: 'text-[12.5px] font-bold text-red-500',
    description: 'text-[12px] text-[var(--pet-muted)] mt-0.5',
    close: 'text-[var(--pet-muted)] hover:text-[var(--pet-ink)] cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-50',
  },
}
