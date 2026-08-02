export const tw = {
  shell: 'app-shell relative h-screen flex flex-col overflow-hidden',
  panel:
    'relative z-10 flex-1 min-h-0 flex flex-col bg-[var(--panel)] overflow-hidden',
  quote: 'relative z-10 px-4 py-4 border-b border-[var(--line)]',
  stats:
    'relative z-10 grid grid-cols-4 border-b border-[var(--line)] divide-x divide-[var(--line)]',
  chart: 'relative z-10 flex-1 min-h-0 flex flex-col p-3',
  chartFrame:
    'relative flex-1 min-h-[160px] border border-[var(--line)] bg-[var(--chart-bg)]',
  chartOverlay:
    'absolute inset-0 z-10 flex items-center justify-center bg-[color-mix(in_srgb,var(--panel)_70%,transparent)]',
  chartMeta: 'font-mono text-[11px]',
  chartAxis: 'mt-1.5 flex justify-between font-mono text-[10px] tracking-wide',
  text: {
    muted: 'text-[var(--mist)]',
    error: 'text-[var(--up)]',
  },
  up: 'text-[var(--up)]',
  down: 'text-[var(--down)]',
  flat: 'text-[var(--flat)]',
  label:
    'text-[10px] font-medium tracking-[0.1em] uppercase text-[var(--mist)]',
  button:
    'inline-flex items-center gap-1.5 h-7 px-2 text-[12px] text-[var(--brass)] hover:text-[var(--ink)] hover:bg-[var(--brass-soft)] rounded-sm disabled:opacity-40 cursor-pointer transition-colors duration-150',
  price: 'font-mono tabular-nums tracking-[-0.04em] leading-none',
  animation: {
    fadeIn: 'animate-fade-in',
    spinSlow: 'animate-spin-slow',
  },
}

export const chartColors = {
  up: 'var(--chart-line)',
  down: 'var(--chart-line-down)',
  fillUp: 'var(--chart-fill)',
  fillDown: 'var(--chart-fill-down)',
  grid: 'var(--chart-grid)',
  baseline: 'var(--chart-baseline)',
}
