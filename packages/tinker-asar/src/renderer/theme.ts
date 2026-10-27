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
      'bg-[var(--as-accent)] hover:bg-[var(--as-accent-hover)] text-white shadow-[0_1px_2px_var(--as-accent-glow)] disabled:opacity-45 disabled:shadow-none',
    secondary:
      'bg-[var(--as-surface-raised)] text-[var(--as-ink-muted)] border border-[var(--as-border)] hover:bg-[var(--as-sidebar)]',
    danger: 'bg-[var(--as-error)] hover:opacity-90 text-white',
    icon: 'p-1 rounded text-[var(--as-ink-faint)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1',
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
    root: 'bg-[var(--as-surface)] border border-[var(--as-border)] rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.12)] px-4 py-3 flex items-start gap-3',
    title: 'text-xs font-semibold text-[var(--as-error)]',
    description: 'text-xs text-[var(--as-ink-muted)] mt-0.5',
    close:
      'text-[var(--as-ink-faint)] hover:text-[var(--as-ink-muted)] cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-72 z-[100]',
  },

  mono: 'font-[family-name:var(--as-font-mono)]',

  scrollbar: {
    thumb: 'bg-[var(--as-border)] hover:bg-[var(--as-ink-faint)]',
  },
}
