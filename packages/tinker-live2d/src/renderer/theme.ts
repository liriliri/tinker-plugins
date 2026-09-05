/** AIGODLIKE-inspired tokens — yellow CTA + blue/green accents. */
export const tw = {
  background: {
    app: 'app-stage',
    field: 'bg-[var(--pet-field)]',
  },
  text: {
    primary: 'text-[var(--pet-ink)]',
    muted: 'text-[var(--pet-muted)]',
    danger: 'text-[var(--pet-coral)]',
  },
  border: {
    divide: 'divide-[var(--pet-line)]',
  },
  button: {
    icon: 'flex items-center justify-center w-8 h-8 rounded-full bg-transparent border-none cursor-pointer text-[var(--pet-muted)] hover:bg-[var(--pet-field-hot)] hover:text-[var(--pet-ink)] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
    iconOnMedia:
      'flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer bg-black/45 text-white hover:bg-black/65 transition-colors duration-150',
    primary:
      'inline-flex items-center justify-center gap-1 px-3.5 h-8 rounded-full bg-[var(--pet-pop)] hover:bg-[var(--pet-pop-hot)] text-[var(--pet-pop-ink)] text-[12px] font-bold border-none cursor-pointer shadow-[0_2px_0_var(--pet-pop-shadow)] active:translate-y-px active:shadow-none transition-[transform,box-shadow,background-color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0',
    action:
      'inline-flex items-center justify-center gap-1 px-3.5 h-8 rounded-full bg-[var(--pet-sky)] hover:brightness-110 text-white text-[12px] font-bold border-none cursor-pointer shadow-[0_2px_0_#1e5fa8] active:translate-y-px active:shadow-none transition-[transform,box-shadow,filter] duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0',
    secondary:
      'inline-flex items-center justify-center gap-1 px-3.5 h-8 rounded-full bg-[var(--pet-field-hot)] hover:bg-[var(--pet-line)] text-[var(--pet-ink)] text-[12px] font-bold border-none cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
    danger:
      'inline-flex items-center justify-center gap-1 px-3.5 h-8 rounded-full bg-[var(--pet-coral)] hover:brightness-110 text-white text-[12px] font-bold border-none cursor-pointer transition-[filter] duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
  },
  card: {
    base: 'group char-card',
    active: 'group char-card is-active',
    stage: 'char-stage',
    ribbon: 'char-ribbon',
  },
  preview: {
    stage:
      'relative rounded-2xl bg-[var(--pet-stage)] overflow-hidden flex items-center justify-center',
    loading:
      'absolute inset-0 z-[1] flex items-center justify-center bg-[color-mix(in_srgb,var(--pet-stage)_65%,transparent)]',
    name: 'stage-title w-full max-w-[200px] bg-transparent border-none outline-none text-center text-[14px] font-normal text-[var(--pet-ink)] placeholder:text-[var(--pet-muted)]',
  },
  overlay: {
    backdrop: 'fixed inset-0 z-40 bg-black/55',
    panel: 'overlay-sheet flex flex-col',
    header: 'overlay-sheet-header shrink-0',
  },
  toast: {
    root: 'bg-[var(--pet-paper)] border border-[var(--pet-line)] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] px-4 py-3 flex items-start gap-3',
    title: 'text-[12.5px] font-bold text-[var(--pet-coral)]',
    description: 'text-[12px] text-[var(--pet-muted)] mt-0.5',
    close: 'text-[var(--pet-muted)] hover:text-[var(--pet-ink)] cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-50',
  },
  scrollArea: {
    root: 'min-h-0 flex-1 overflow-hidden',
    viewport: 'h-full w-full [&>div]:!block',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-opacity duration-200 data-[orientation=vertical]:w-1.5 data-[state=visible]:opacity-100 data-[state=hidden]:opacity-0',
    thumb:
      'relative flex-1 rounded-full bg-[color-mix(in_srgb,var(--pet-muted)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--pet-muted)_70%,transparent)]',
  },
}
