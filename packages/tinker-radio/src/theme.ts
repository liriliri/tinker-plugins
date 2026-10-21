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
    row: 'hover:bg-cream/[0.05]',
  },
  text: {
    primary: 'text-cream',
    muted: 'text-cream-dim',
    serif: 'font-serif',
    meta: 'font-mono text-[11px] tracking-wide',
  },
  button: {
    primary:
      'bg-signal text-white hover:bg-signal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/70',
  },
  play: 'grid place-items-center w-[60px] h-[60px] rounded-full text-dial border-[1.5px] border-dial/90 bg-dial/10 shadow-[0_0_30px_-6px_rgba(228,192,122,0.55)] hover:bg-dial/20',
  icon: 'grid place-items-center w-9 h-11 cursor-pointer text-cream-dim hover:text-cream',
  iconOn:
    'grid place-items-center w-9 h-11 cursor-pointer text-signal hover:text-signal',
  bar: 'bg-cream',
  dot: 'bg-signal',
  panel: 'bg-night-card/80 backdrop-blur-md border border-cream/10',
  sky: '[text-shadow:0_1px_14px_rgba(6,8,12,0.7)]',
  breathe: 'origin-center motion-safe:animate-breathe',
  volume:
    'm-0 h-[18px] w-[72px] cursor-pointer appearance-none bg-transparent focus-visible:outline-none [&::-webkit-slider-runnable-track]:h-0.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:[background:linear-gradient(90deg,#e4c07a_var(--p,0%),rgb(245_241_232/22%)_var(--p,0%))] [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-cream hover:[&::-webkit-slider-thumb]:bg-white focus-visible:[&::-webkit-slider-thumb]:bg-white focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgb(228_192_122/35%)] [&::-moz-range-track]:h-0.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-cream/22 [&::-moz-range-progress]:h-0.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-dial [&::-moz-range-thumb]:size-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-cream',
  menuScroll:
    '[&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content [&::-webkit-scrollbar-thumb]:bg-cream/35 hover:[&::-webkit-scrollbar-thumb]:bg-cream/60 [&::-webkit-scrollbar-button]:hidden',
}
