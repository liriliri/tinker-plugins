export const tw = {
  background:
    'bg-[radial-gradient(circle_at_50%_12%,rgba(56,120,168,0.22),transparent_46%),linear-gradient(180deg,#0a1730_0%,#050c1e_68%,#02060f_100%)]',
  cornerBtn:
    'absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-slate-950/50 text-white/70 backdrop-blur-md transition duration-200 hover:border-white/25 hover:bg-slate-950/70 hover:text-white/90 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-sky-300/60',
  panel:
    'absolute right-0 top-0 z-20 flex h-full w-64 flex-col border-l border-white/8 bg-slate-950/70 backdrop-blur-xl transition-transform duration-300 ease-out',
  panelHeader:
    'flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3',
  panelTitle: 'text-[13px] font-medium text-white/70',
  panelBody:
    'aq-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4',
  section: 'flex flex-col gap-3',
  sectionTitle: 'text-[11px] font-medium text-white/40',
  closeBtn:
    'flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/8 hover:text-white/80 focus-visible:outline focus-visible:outline-1 focus-visible:outline-sky-300/60',
  fieldLabel: 'flex items-baseline justify-between text-xs text-white/65',
  fieldValue: 'font-mono text-[11px] text-white/35',
  slider: 'aq-slider',
  actionBtn:
    'mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-sky-300/60',
  viewBtn:
    'rounded-md border border-white/10 bg-white/5 py-2 text-xs text-white/65 transition hover:border-white/20 hover:text-white/85 focus-visible:outline focus-visible:outline-1 focus-visible:outline-sky-300/60',
  viewBtnOn:
    'rounded-md border border-sky-300/35 bg-sky-400/15 py-2 text-xs text-white/90',
}
