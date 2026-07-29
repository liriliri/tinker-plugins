/** Theme-aware Tailwind tokens only. Layout/spacing go inline in components. */
export const tw = {
  background: {
    primary: 'bg-[var(--chrome)]',
    secondary: 'bg-[var(--panel)]',
    raised: 'bg-[var(--panel-raised)]',
    hover: 'hover:bg-[var(--chrome-hover)]',
    well: 'bg-[var(--well)]',
    toolbar:
      'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--chrome-raised)_70%,transparent)_0%,var(--chrome)_100%)]',
    palette:
      'bg-[linear-gradient(0deg,color-mix(in_srgb,var(--accent)_8%,var(--chrome))_0%,var(--chrome)_100%)]',
    fieldHover:
      'hover:bg-[var(--chrome-hover)] focus-within:bg-[var(--chrome-hover)]',
    toolHover: 'hover:bg-[var(--chrome-hover)]',
    toolCurrent: 'bg-[var(--accent)] hover:bg-[var(--accent-soft)]',
    btnActive: 'bg-[color-mix(in_srgb,var(--accent)_18%,var(--chrome-hover))]',
    dialogBtn: 'bg-[var(--panel)] hover:bg-[var(--chrome-hover)]',
    dialogBtnPrimary: 'bg-[var(--accent)] hover:bg-[var(--accent-soft)]',
  },
  text: {
    primary: 'text-[var(--ink)]',
    secondary: 'text-[var(--ink-secondary)]',
    muted: 'text-[var(--ink-muted)]',
    accent: 'text-[var(--accent)]',
    accentInk: 'text-[var(--accent-ink)]',
    btn: 'text-[var(--ink-secondary)] enabled:hover:text-[var(--ink)]',
    tool: 'text-[var(--ink-secondary)] hover:text-[var(--ink)]',
    toolCurrent: 'text-[var(--accent-ink)] hover:text-[var(--accent-ink)]',
  },
  border: {
    primary: 'border border-[var(--line)]',
    line: 'border-[var(--line)]',
    soft: 'border-[var(--line-soft)]',
    bottom: 'border-b border-[var(--line)]',
    right: 'border-r border-[var(--line)]',
    top: 'border-t border-[var(--line)]',
    sep: 'bg-[var(--line)]',
    accent: 'border-[var(--accent)] hover:border-[var(--accent-soft)]',
  },
  focus:
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-0',
  shadow: {
    toolCurrent:
      'shadow-[var(--shadow-tool),0_0_0_1px_color-mix(in_srgb,var(--accent-soft)_55%,transparent)]',
    dialog:
      'shadow-[0_18px_48px_rgba(0,0,0,0.32),0_0_0_1px_color-mix(in_srgb,var(--accent)_18%,transparent)]',
    paletteItem: 'shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.14)]',
    paletteItemHover: 'hover:shadow-[inset_0_0_0_1.5px_var(--ink)]',
  },
  overlay: 'bg-[rgba(12,16,22,0.55)]',
}

/** Fallback hex for `<input type="color">` when paint is `none`. */
export const COLOR_INPUT_FILL = '#ffffff'
export const COLOR_INPUT_STROKE = '#000000'
