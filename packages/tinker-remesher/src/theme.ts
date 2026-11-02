export const tw = {
  background: {
    app: 'bg-[var(--rm-app)]',
    sidebar: 'bg-[var(--rm-panel)]',
    preview: 'bg-[var(--rm-app)]',
    well: 'bg-[var(--rm-well)] bg-[length:14px_14px] bg-[position:0_0] [background-image:radial-gradient(var(--rm-grid)_1px,transparent_1px)]',
  },

  text: {
    primary: 'text-[var(--rm-ink)]',
    muted: 'text-[var(--rm-muted)]',
    secondary: 'text-[var(--rm-secondary)]',
    danger: 'text-white dark:text-white',
  },

  toast: {
    error: 'bg-[var(--rm-danger)]/92',
  },

  button: {
    primary: {
      default:
        'bg-[var(--rm-accent)] text-[var(--rm-on-accent)] shadow-[0_1px_0_rgba(0,0,0,0.06)]',
      hover:
        'hover:brightness-[1.05] active:brightness-[0.96] active:translate-y-px',
      disabled:
        'bg-[var(--rm-fill)] text-[var(--rm-muted)] cursor-not-allowed shadow-none',
    },
    icon: 'flex items-center justify-center h-7 w-7 rounded-[5px] border-none bg-transparent text-[var(--rm-secondary)] transition-colors hover:bg-[var(--rm-hover)] hover:text-[var(--rm-ink)] disabled:opacity-35 disabled:pointer-events-none cursor-pointer',
  },

  overlay: {
    processing: 'bg-[var(--rm-ink)]/35 backdrop-blur-[2px]',
    ring: 'border-[var(--rm-accent)]/35',
    icon: 'text-white',
    pulse: 'bg-[var(--rm-accent)]',
  },

  dropzone: {
    default:
      'border border-dashed border-[var(--rm-line)] bg-[var(--rm-well)]/40',
    hover: 'border-[var(--rm-accent)] bg-[var(--rm-accent-soft)] border-solid',
  },

  accent: {
    iconBg: 'bg-[var(--rm-accent-soft)]',
    iconText: 'text-[var(--rm-accent)]',
  },

  border: {
    sidebar: 'border-[var(--rm-line)]',
    input: 'border-[var(--rm-line)]',
    chrome: 'border-[var(--rm-line)]',
  },

  input:
    'bg-[var(--rm-fill)] text-[var(--rm-ink)] border border-[var(--rm-line)] focus:border-[var(--rm-accent)] focus:ring-1 focus:ring-[var(--rm-accent-soft)]',

  divider: 'bg-[var(--rm-line)]',

  dropzoneIcon: {
    default: 'bg-[var(--rm-fill)]',
  },

  mono: 'font-[family-name:var(--rm-mono)] tabular-nums tracking-tight',

  label:
    'text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--rm-muted)]',

  segment: {
    track: 'bg-[var(--rm-fill)]',
    active:
      'bg-[var(--rm-panel)] text-[var(--rm-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
    inactive: 'text-[var(--rm-secondary)] hover:text-[var(--rm-ink)]',
  },

  chrome:
    'rounded-[8px] border border-[var(--rm-line)] bg-[var(--rm-chrome)] shadow-[0_4px_20px_rgba(15,18,24,0.08)] backdrop-blur-md',
}
