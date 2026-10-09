const focus =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-sky-400/60'

export const tw = {
  background:
    'bg-[radial-gradient(circle_at_50%_12%,rgba(56,120,168,0.22),transparent_46%),linear-gradient(180deg,#0a1730_0%,#050c1e_68%,#02060f_100%)]',
  cornerBtn: `absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-slate-950/50 text-white/70 backdrop-blur-md transition duration-200 hover:border-white/25 hover:bg-slate-950/70 hover:text-white/90 ${focus}`,
  fpsOverlay:
    'pointer-events-none absolute left-3 top-3 z-10 font-mono text-[11px] leading-4 tabular-nums text-white/70',

  panel:
    'absolute right-0 top-0 z-20 flex h-full w-64 flex-col border-l border-slate-200/80 bg-white/85 backdrop-blur-xl transition-transform duration-300 ease-out dark:border-white/8 dark:bg-slate-950/70',
  panelHeader:
    'flex shrink-0 items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/8',
  panelTitle: 'text-[13px] font-medium text-slate-700 dark:text-white/70',
  panelBody:
    'aq-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4',
  section: 'flex flex-col gap-3',
  sectionTitle: 'text-[11px] font-medium text-slate-400 dark:text-white/40',
  closeBtn: `flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-white/40 dark:hover:bg-white/8 dark:hover:text-white/80 ${focus}`,
  fieldLabel:
    'flex items-baseline justify-between text-xs text-slate-600 dark:text-white/65',
  fieldValue: 'font-mono text-[11px] text-slate-400 dark:text-white/35',
  fieldRow:
    'flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-white/65',
  slider: 'aq-slider',
  actionBtn: `mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 ${focus}`,
  viewBtn: `rounded-md border border-slate-200 bg-slate-50 py-2 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white/65 dark:hover:border-white/20 dark:hover:text-white/85 ${focus}`,
  viewBtnOn:
    'rounded-md border border-sky-400/50 bg-sky-100 py-2 text-xs text-sky-800 dark:border-sky-300/35 dark:bg-sky-400/15 dark:text-white/90',
  toggle: `relative h-5 w-9 shrink-0 rounded-full transition ${focus}`,
  toggleOn: 'bg-sky-400/70 dark:bg-sky-400/45',
  toggleOff: 'bg-slate-200 dark:bg-white/12',
  toggleThumb:
    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white/90 transition-transform',
  toggleThumbOn: 'translate-x-4',
  toggleThumbOff: 'translate-x-0',
}
