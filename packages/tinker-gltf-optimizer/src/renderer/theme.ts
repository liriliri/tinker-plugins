export const tw = {
  bg: {
    app: 'bg-[var(--go-base)]',
    toolbar: 'bg-[var(--go-chrome)]',
    surface: 'bg-[var(--go-surface)]',
    row: 'bg-[var(--go-surface)] hover:bg-[var(--go-row-hover)]',
    rowBusy: 'bg-[var(--go-accent-soft)]',
    input: 'bg-[var(--go-inset)]',
    iconWell: 'bg-[var(--go-inset)]',
  },
  text: {
    primary: 'text-[var(--go-ink)]',
    secondary: 'text-[var(--go-muted)]',
    muted: 'text-[var(--go-faint)]',
  },
  border: 'border-[var(--go-line)]',
  accent: {
    text: 'text-[var(--go-accent)]',
    soft: 'bg-[var(--go-accent-soft)]',
    bar: 'bg-[var(--go-accent)]',
  },
  button: {
    primary:
      'bg-[var(--go-accent)] hover:bg-[var(--go-accent-hover)] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
    secondary:
      'bg-[var(--go-inset)] hover:bg-[var(--go-row-hover)] text-[var(--go-ink)] border border-[var(--go-line)]',
    icon: 'text-[var(--go-muted)] hover:text-[var(--go-ink)] hover:bg-[var(--go-inset)]',
    iconDisabled:
      'disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--go-muted)]',
  },
  status: {
    success: 'text-[var(--go-ok)]',
    error: 'text-[var(--go-err)]',
  },
  select: {
    trigger:
      'text-[var(--go-ink)] border-[var(--go-line)] bg-[var(--go-inset)] hover:border-[var(--go-line-strong)]',
    chevron: 'text-[var(--go-muted)]',
    dropdown:
      'bg-[var(--go-surface)] border border-[var(--go-line)] rounded-md shadow-lg z-50',
    itemRow:
      'relative flex items-center px-7 py-1.5 text-xs rounded text-[var(--go-ink)] cursor-pointer outline-none data-[highlighted]:bg-[var(--go-accent-soft)] data-[highlighted]:text-[var(--go-accent)]',
    itemIndicator: 'text-[var(--go-accent)]',
  },
  dropzone: {
    active: 'bg-[var(--go-accent-soft)]',
    frame: 'border-[var(--go-line-strong)]',
    frameActive: 'border-[var(--go-accent)]',
  },
  panel: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:shadow-none',
  separator: 'bg-[var(--go-line)]',
  checkbox:
    'size-3.5 shrink-0 accent-[var(--go-accent)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
  mono: 'font-mono tabular-nums tracking-tight',
  focus:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--go-accent)]/35',
  placeholder: 'placeholder:text-[var(--go-faint)]',
  meshGrid:
    'bg-[length:24px_24px] bg-[position:center] [background-image:linear-gradient(var(--go-line)_1px,transparent_1px),linear-gradient(90deg,var(--go-line)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_45%,black_20%,transparent_75%)]',
  busyBar: 'animate-go-pulse',
}
