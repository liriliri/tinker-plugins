export const tw = {
  background:
    'bg-[radial-gradient(circle_at_50%_18%,rgba(42,92,190,0.32),transparent_42%),linear-gradient(180deg,#0a1730_0%,#050c1e_68%,#02060f_100%)]',
  // Sits under the panel, so sliding the panel out simply covers it instead of
  // leaving a stray gear on top of the panel's own header.
  cornerBtn:
    'absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-100/15 bg-slate-900/55 text-cyan-50/80 backdrop-blur-md transition duration-200 hover:border-cyan-100/35 hover:bg-slate-900/75 hover:text-cyan-50 focus-visible:opacity-100',
  panel:
    'absolute right-0 top-0 z-20 flex h-full w-64 flex-col border-l border-cyan-100/10 bg-slate-950/72 backdrop-blur-xl transition-transform duration-300 ease-out',
  panelHeader:
    'flex shrink-0 items-center justify-between border-b border-cyan-100/10 px-4 py-3',
  panelTitle:
    'text-[11px] font-medium uppercase tracking-[0.14em] text-cyan-50/50',
  panelBody: 'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4',
  section: 'flex flex-col gap-3',
  sectionTitle:
    'text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-50/40',
  fieldLabel: 'flex items-baseline justify-between text-xs text-cyan-50/75',
  fieldValue: 'font-mono text-[11px] text-cyan-50/45',
  slider:
    'h-1 w-full cursor-pointer appearance-none rounded-full bg-cyan-100/15 accent-cyan-300 outline-none',
  actionBtn:
    'mt-1 w-full rounded-md border border-cyan-100/15 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-50/85 transition hover:border-cyan-100/35 hover:bg-cyan-400/20',
  viewBtn:
    'rounded-md border border-cyan-100/15 bg-cyan-400/10 py-2 text-xs text-cyan-50/85 transition hover:border-cyan-100/35 hover:bg-cyan-400/20',
  viewBtnOn:
    'rounded-md border border-cyan-100/40 bg-cyan-400/25 py-2 text-xs text-cyan-50 transition',
}
