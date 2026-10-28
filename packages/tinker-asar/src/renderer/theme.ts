export const tw = {
  app: 'bg-[var(--as-bg)] text-[var(--as-ink)]',

  surface: 'bg-[var(--as-surface)]',
  surfaceRaised: 'bg-[var(--as-surface-raised)]',
  sidebar: 'bg-[var(--as-sidebar)]',

  text: {
    primary: 'text-[var(--as-ink)]',
    muted: 'text-[var(--as-ink-muted)]',
    faint: 'text-[var(--as-ink-faint)]',
    accent: 'text-[var(--as-accent)]',
    error: 'text-[var(--as-error)]',
    modified: 'text-[var(--as-modified)]',
  },

  border: {
    default: 'border-[var(--as-border)]',
    subtle: 'border-[var(--as-border-subtle)]',
  },

  btn: {
    primary:
      'bg-[var(--as-accent)] hover:bg-[var(--as-accent-hover)] text-white disabled:opacity-45 dark:text-[#0e1013]',
    secondary:
      'bg-[var(--as-surface-raised)] text-[var(--as-ink-muted)] border border-[var(--as-border)] hover:bg-[var(--as-sidebar)]',
    danger: 'bg-[var(--as-error)] hover:opacity-90 text-white',
    icon: 'p-0.5 rounded text-[var(--as-ink-faint)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1',
    iconAccent:
      'hover:text-[var(--as-accent)] hover:bg-[var(--as-accent-dim)] focus-visible:ring-[var(--as-accent-glow)]',
    iconDanger:
      'hover:text-[var(--as-error)] hover:bg-[var(--as-error-dim)] focus-visible:ring-[var(--as-error)]',
  },

  input:
    'bg-[var(--as-surface)] border border-[var(--as-border)] text-[var(--as-ink)] placeholder:text-[var(--as-ink-faint)] focus:border-[var(--as-accent)] focus:ring-1 focus:ring-[var(--as-accent-glow)]',

  treeSelected:
    'bg-[var(--as-accent-dim)] text-[var(--as-ink)] shadow-[inset_2px_0_0_var(--as-accent)]',

  treeHover: 'hover:bg-[var(--as-surface-raised)]',

  badge:
    'bg-[var(--as-accent-dim)] text-[var(--as-accent)] border border-[var(--as-accent-glow)]',

  unpackedBadge:
    'bg-[var(--as-unpacked-dim)] text-[var(--as-unpacked)] border border-[var(--as-unpacked)]/25',

  dropOverlay:
    'bg-[var(--as-accent-dim)] border-2 border-dashed border-[var(--as-accent)]',

  focusRing:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--as-accent-glow)]',

  focusRingSm:
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--as-accent-glow)]',

  focusRingDanger:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--as-error)]',

  modifiedDot: 'bg-[var(--as-modified)]',

  toast: {
    root: 'bg-[var(--as-surface)] border border-[var(--as-border)] rounded shadow-[0_8px_24px_rgba(0,0,0,0.1)] px-3 py-2 flex items-start gap-2',
    title: 'text-[11px] font-semibold text-[var(--as-error)]',
    description: 'text-[11px] text-[var(--as-ink-muted)] mt-0.5',
    close:
      'text-[var(--as-ink-faint)] hover:text-[var(--as-ink-muted)] cursor-pointer',
    viewport: 'fixed bottom-3 right-3 flex flex-col gap-1.5 w-64 z-[100]',
  },

  mono: 'font-[family-name:var(--as-font-mono)]',

  scrollbar: {
    thumb: 'bg-[var(--as-border)] hover:bg-[var(--as-ink-faint)]',
  },
}
