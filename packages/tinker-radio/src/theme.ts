export interface GlobePalette {
  sky: [number, number, number]
  glow: [number, number, number]
  star: [number, number, number]
  land: [number, number, number]
  haze: [number, number, number]
  station: [number, number, number]
  active: [number, number, number]
  additive: boolean
}

export const globe: GlobePalette = {
  sky: [0.031, 0.039, 0.063],
  glow: [0.006, 0.008, 0.016],
  star: [0.14, 0.15, 0.18],
  land: [0.08, 0.1, 0.14],
  haze: [0.008, 0.01, 0.018],
  station: [0.95, 0.9, 0.82],
  active: [0.953, 0.42, 0.271],
  additive: true,
}

export const tw = {
  background: {
    app: 'bg-night',
    surface: 'bg-night-card',
    row: 'hover:bg-cream/[0.05]',
    rowActive: 'bg-signal/15',
  },
  text: {
    primary: 'text-cream',
    muted: 'text-cream-dim',
    signal: 'text-signal',
    serif: 'font-serif',
    meta: 'font-mono text-[11px] tracking-wide',
  },
  border: {
    soft: 'border-line',
  },
  button: {
    primary:
      'bg-signal text-white hover:bg-signal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/70',
    ghost:
      'text-cream-dim hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/70',
  },
  play: 'grid place-items-center w-[60px] h-[60px] rounded-full text-dial border-[1.5px] border-dial/90 bg-dial/10 shadow-[0_0_30px_-6px_rgba(228,192,122,0.55)] hover:bg-dial/20',
  icon: 'grid place-items-center w-9 h-11 cursor-pointer text-cream-dim hover:text-cream',
  iconOn:
    'grid place-items-center w-9 h-11 cursor-pointer text-signal hover:text-signal',
  panel: 'bg-night-card/80 backdrop-blur-md border border-cream/10',
  sky: '[text-shadow:0_1px_14px_rgba(6,8,12,0.7)]',
  breathe: 'origin-center motion-safe:animate-breathe',
  orbit: 'motion-safe:animate-orbit',
  placeholder: 'placeholder:text-cream-dim',
  menuScroll:
    '[&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content [&::-webkit-scrollbar-thumb]:bg-cream/35 hover:[&::-webkit-scrollbar-thumb]:bg-cream/60 [&::-webkit-scrollbar-button]:hidden',
}
