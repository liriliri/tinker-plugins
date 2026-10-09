export const tw = {
  appBg: 'bg-slate-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100',
  waitingRing: 'border-cyan-400',
  waitingRingDim: 'border-cyan-400/30',
  waitingText: 'text-cyan-400',
  connectHint: 'text-zinc-500 dark:text-zinc-600',
  sectionLabel: 'text-zinc-500',
  connectedDot: 'bg-emerald-400',
  connectedText: 'text-emerald-400',
  valueText: 'text-zinc-700 dark:text-zinc-300',
}

export const CONNECTED_GLOW = '0 0 6px rgba(52,211,153,0.8)'

export const colors = {
  accent: 'var(--gp-accent)',
  accentDim: 'var(--gp-accent-dim)',
  accentGlow: 'var(--gp-accent-glow)',
  panelBg: 'var(--gp-panel-bg)',
  panelBorder: 'var(--gp-panel-border)',
  gridPattern: 'var(--gp-grid-pattern)',
  axisBar: 'var(--gp-axis-bar)',
  btnUnpressedText: 'var(--gp-btn-unpressed)',
  xboxBody: 'var(--gp-xbox-body)',
  xboxStroke: 'var(--gp-xbox-stroke)',
  gridColor: 'var(--gp-grid-color)',
  dotColor: 'var(--gp-dot-color)',
  clearBtnText: 'var(--gp-clear-btn-text)',
  clearBtnBorder: 'var(--gp-clear-btn-border)',
  stickAlpha: (alpha: number) => {
    const mul = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--gp-stick-alpha-mul',
      ),
    )
    return `rgba(var(--gp-accent-rgb), ${alpha * (mul || 0.5)})`
  },
  triggerAlpha: (alpha: number) => {
    const mul = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--gp-trigger-alpha-mul',
      ),
    )
    return `rgba(var(--gp-accent-rgb), ${alpha * (mul || 0.6)})`
  },
}

export const BUTTON_COLORS: Record<
  number,
  { bg: string; border: string; text: string; glow: string }
> = {
  0: {
    bg: 'rgba(34,197,94,0.15)',
    border: '#22c55e',
    text: '#22c55e',
    glow: '0 0 8px rgba(34,197,94,0.5)',
  },
  1: {
    bg: 'rgba(239,68,68,0.15)',
    border: '#ef4444',
    text: '#ef4444',
    glow: '0 0 8px rgba(239,68,68,0.5)',
  },
  2: {
    bg: 'rgba(59,130,246,0.15)',
    border: '#3b82f6',
    text: '#3b82f6',
    glow: '0 0 8px rgba(59,130,246,0.5)',
  },
  3: {
    bg: 'rgba(234,179,8,0.15)',
    border: '#eab308',
    text: '#eab308',
    glow: '0 0 8px rgba(234,179,8,0.5)',
  },
}

export const ABXY_COLORS = {
  A: BUTTON_COLORS[0].border,
  B: BUTTON_COLORS[1].border,
  X: BUTTON_COLORS[2].border,
  Y: BUTTON_COLORS[3].border,
}
