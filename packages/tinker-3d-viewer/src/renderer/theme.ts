export const tw = {
  background: {
    app: 'bg-[var(--window)]',
    toolbar: 'bg-[var(--window)]/92 backdrop-blur-sm',
    panel: 'bg-[var(--window)]/95 backdrop-blur-sm',
    well: 'bg-[var(--well)] bg-[length:14px_14px] bg-[position:0_0] [background-image:radial-gradient(var(--grid-dot)_1px,transparent_1px)]',
  },
  text: {
    primary: 'text-[var(--ink)]',
    secondary: 'text-[var(--muted)]',
    muted: 'text-[var(--muted)]',
  },
  border: {
    divider: 'border-[var(--line)]',
  },
  button: {
    icon: 'flex items-center justify-center w-6 h-6 rounded-sm bg-transparent border-none cursor-default text-[var(--ink)] hover:bg-[var(--hover)] active:bg-[var(--line)] disabled:opacity-40 disabled:cursor-default',
    iconActive:
      'flex items-center justify-center w-6 h-6 rounded-sm border-none cursor-default bg-[var(--select-soft)] text-[var(--select)] hover:bg-[var(--select-soft)] active:brightness-95 disabled:opacity-40 disabled:cursor-default',
    primary:
      'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-sm text-[12px] border border-transparent cursor-default bg-[var(--select)] text-[var(--select-text)] hover:brightness-110 active:brightness-95',
    panelItem:
      'w-full text-left text-[12px] px-2 py-1.5 rounded-sm border-none cursor-default bg-transparent text-[var(--ink)] hover:bg-[var(--hover)]',
    panelItemActive:
      'w-full text-left text-[12px] px-2 py-1.5 rounded-sm border-none cursor-default bg-[var(--select-soft)] text-[var(--select)]',
  },
  swatch: {
    default:
      'w-5 h-5 rounded-sm border border-[var(--line)] cursor-default hover:brightness-110 p-0',
    active:
      'w-5 h-5 rounded-sm border-2 border-[var(--select)] cursor-default p-0',
    custom:
      'relative w-5 h-5 rounded-sm border border-dashed border-[var(--muted)] cursor-default overflow-hidden bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]',
  },
  toast: {
    root: 'bg-[var(--window)] border border-[var(--line)] rounded-sm shadow-md px-3 py-2 flex items-start gap-2',
    title: 'text-[12px] font-semibold text-[var(--danger)]',
    description: 'text-[12px] text-[var(--muted)] mt-0.5 break-words',
    close:
      'text-[var(--muted)] hover:text-[var(--ink)] cursor-default bg-transparent border-none p-0 shrink-0',
    viewport: 'fixed bottom-3 right-3 flex flex-col gap-1.5 w-64 z-50',
  },
  overlay: 'bg-black/35',
  spinner:
    'border-[var(--select)] border-t-transparent motion-reduce:animate-none',
  dropzoneActive: 'ring-2 ring-inset ring-[var(--select)]',
  tooltip:
    'bg-[var(--ink)] text-[var(--window)] text-[11px] px-1.5 py-0.5 rounded-sm shadow select-none z-50',
}
