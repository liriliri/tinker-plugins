export const tw = {
  appBg: (isDark: boolean) =>
    isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-zinc-900',
  waitingRing: 'border-cyan-400',
  waitingRingDim: 'border-cyan-400/30',
  waitingText: 'text-cyan-400',
  connectHint: (isDark: boolean) =>
    isDark ? 'text-zinc-600' : 'text-zinc-500',
  sectionLabel: 'text-zinc-500',
  connectedDot: 'bg-emerald-400',
  connectedText: 'text-emerald-400',
}

export const CONNECTED_GLOW = '0 0 6px rgba(52,211,153,0.8)'

export const colors = {
  accent: (isDark: boolean) => (isDark ? '#00e5ff' : '#1a5cff'),
  accentDim: (isDark: boolean) =>
    isDark ? 'rgba(0,229,255,0.12)' : 'rgba(26,92,255,0.10)',
  accentGlow: (isDark: boolean) =>
    isDark ? '0 0 6px rgba(0,229,255,0.5)' : '0 0 6px rgba(26,92,255,0.4)',
  panelBg: (isDark: boolean) =>
    isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
  panelBorder: (isDark: boolean) =>
    isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)',
  gridPattern: (isDark: boolean) =>
    isDark
      ? 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)'
      : 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
  axisBar: (isDark: boolean) =>
    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
  valueText: (isDark: boolean) => (isDark ? 'text-zinc-300' : 'text-zinc-700'),
  btnUnpressedText: (isDark: boolean) => (isDark ? '#52525b' : '#a1a1aa'),
  xboxBody: (isDark: boolean) => (isDark ? '#18182a' : '#eff0f8'),
  xboxStroke: (isDark: boolean) => (isDark ? '#35355a' : '#9898be'),
  gridColor: (isDark: boolean) =>
    isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
  dotColor: (isDark: boolean) => (isDark ? '#e2e8f0' : '#1e1e2e'),
  clearBtnText: (isDark: boolean) => (isDark ? '#52525b' : '#94a3b8'),
  clearBtnBorder: (isDark: boolean) =>
    isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
  stickAlpha: (isDark: boolean, alpha: number) =>
    isDark
      ? `rgba(0,229,255,${alpha * 0.6})`
      : `rgba(26,92,255,${alpha * 0.5})`,
  triggerAlpha: (isDark: boolean, alpha: number) =>
    isDark
      ? `rgba(0,229,255,${alpha * 0.7})`
      : `rgba(26,92,255,${alpha * 0.6})`,
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
