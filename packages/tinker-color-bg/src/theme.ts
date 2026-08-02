export const tw = {
  stage:
    "relative h-full w-full overflow-hidden bg-[#eef1f6] dark:bg-[#0b0d12] text-[#12151c] dark:text-[#eef1f6] [font-family:'Avenir_Next','Segoe_UI',ui-sans-serif,system-ui,sans-serif] antialiased tracking-[-0.01em]",

  text: {
    secondary: 'text-[rgba(18,21,28,0.62)] dark:text-[rgba(238,241,246,0.68)]',
    muted: 'text-[rgba(18,21,28,0.4)] dark:text-[rgba(238,241,246,0.42)]',
  },

  panel: {
    base: 'absolute top-3 bottom-3 z-10 flex flex-col overflow-hidden rounded-[20px] border border-[rgba(18,21,28,0.1)] dark:border-[rgba(232,236,244,0.1)] bg-white/80 dark:bg-[rgba(16,18,24,0.78)] backdrop-blur-[22px] backdrop-saturate-[1.2] shadow-[0_18px_50px_rgba(18,21,28,0.18)] dark:shadow-[0_22px_60px_rgba(0,0,0,0.45)] motion-reduce:animate-none',
    left: 'left-3 w-[min(280px,calc(100%-24px))] animate-[cb-panel-in_0.45s_cubic-bezier(0.22,1,0.36,1)_both]',
    right:
      'right-3 w-[min(260px,calc(100%-24px))] animate-[cb-panel-in-right_0.45s_cubic-bezier(0.22,1,0.36,1)_both]',
    footer:
      'border-t border-[rgba(18,21,28,0.1)] dark:border-[rgba(232,236,244,0.1)] bg-[#f7f8fb]/70 dark:bg-[#12151c]/70',
  },

  divider:
    'h-px w-full bg-[rgba(18,21,28,0.1)] dark:bg-[rgba(232,236,244,0.1)]',

  styleFab:
    'absolute left-4 bottom-4 z-10 size-14 p-0 rounded-full overflow-hidden cursor-pointer border-2 border-white/55 bg-[#f7f8fb] dark:bg-[#12151c] shadow-[0_18px_50px_rgba(18,21,28,0.18),0_0_0_3px_rgba(225,29,72,0.12)] dark:shadow-[0_22px_60px_rgba(0,0,0,0.45),0_0_0_3px_rgba(251,113,133,0.16)] transition-[transform,box-shadow] duration-200 ease-out hover:scale-105 hover:shadow-[0_18px_50px_rgba(18,21,28,0.18),0_0_0_4px_rgba(225,29,72,0.12)] dark:hover:shadow-[0_22px_60px_rgba(0,0,0,0.45),0_0_0_4px_rgba(251,113,133,0.16)] animate-[cb-fab-in_0.35s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none motion-reduce:transition-none',

  styleCard: {
    base: 'relative overflow-hidden rounded-xl border border-transparent cursor-pointer transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 group',
    active:
      'border-[#e11d48] dark:border-[#fb7185] shadow-[0_0_0_1px_#e11d48,0_8px_20px_rgba(225,29,72,0.12)] dark:shadow-[0_0_0_1px_#fb7185,0_8px_20px_rgba(251,113,133,0.16)]',
    name: 'absolute inset-x-0 bottom-0 px-2 pt-[18px] pb-1.5 text-[10px] font-semibold tracking-[-0.01em] text-white bg-gradient-to-t from-black/70 to-transparent whitespace-nowrap overflow-hidden text-ellipsis',
  },

  paletteRow:
    'flex items-center gap-2 w-full px-2 py-1.5 rounded-[10px] border border-transparent bg-transparent cursor-pointer transition-[background,border-color] duration-150 hover:bg-[rgba(225,29,72,0.12)] dark:hover:bg-[rgba(251,113,133,0.16)]',

  swatch:
    'size-3.5 rounded-full border border-black/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]',

  colorDot:
    'relative size-7 rounded-full overflow-hidden border-2 border-[rgba(18,21,28,0.18)] dark:border-[rgba(232,236,244,0.2)] cursor-pointer transition-[transform,border-color] duration-150 hover:scale-110 hover:border-[#e11d48] dark:hover:border-[#fb7185] motion-reduce:transition-none',

  input:
    'w-full h-[30px] px-2.5 rounded-[10px] border border-[rgba(18,21,28,0.1)] dark:border-[rgba(232,236,244,0.1)] bg-[#f7f8fb] dark:bg-[#12151c] text-[#12151c] dark:text-[#eef1f6] font-mono text-xs outline-none transition-colors focus:border-[#e11d48] dark:focus:border-[#fb7185]',

  iconBtn:
    'inline-flex items-center justify-center size-[30px] rounded-[10px] border border-[rgba(18,21,28,0.1)] dark:border-[rgba(232,236,244,0.1)] bg-[#f7f8fb] dark:bg-[#12151c] text-[rgba(18,21,28,0.62)] dark:text-[rgba(238,241,246,0.68)] cursor-pointer transition-colors hover:text-[#e11d48] dark:hover:text-[#fb7185] hover:border-[#e11d48] dark:hover:border-[#fb7185] hover:bg-[rgba(225,29,72,0.12)] dark:hover:bg-[rgba(251,113,133,0.16)]',

  toggle: {
    track:
      'relative w-[34px] h-5 shrink-0 rounded-full bg-[rgba(18,21,28,0.18)] dark:bg-[rgba(232,236,244,0.2)] transition-colors peer-checked:bg-[#e11d48] dark:peer-checked:bg-[#fb7185]',
    thumb:
      'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform peer-checked:translate-x-[14px]',
  },

  range:
    'w-full h-1 rounded-full appearance-none outline-none cursor-pointer bg-[rgba(18,21,28,0.1)] dark:bg-[rgba(232,236,244,0.1)] accent-[#e11d48] dark:accent-[#fb7185]',

  exportBtn:
    'flex items-center justify-center gap-2 w-full h-[38px] border-0 rounded-xl bg-gradient-to-br from-[#e11d48] to-[#be123c] dark:from-[#fb7185] dark:to-[#e11d48] text-white dark:text-[#12151c] text-[13px] font-semibold tracking-[-0.01em] cursor-pointer shadow-[0_8px_18px_rgba(225,29,72,0.12)] dark:shadow-[0_8px_18px_rgba(251,113,133,0.16)] transition-[transform,filter,opacity] duration-150 hover:enabled:-translate-y-px hover:enabled:brightness-105 disabled:opacity-55 disabled:cursor-not-allowed motion-reduce:transition-none',

  mono: 'font-mono tabular-nums',

  scrollArea: {
    root: 'min-h-0 flex-1 overflow-hidden',
    viewport: 'h-full w-full [&>div]:!block',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-opacity duration-200 data-[orientation=vertical]:w-1.5 data-[state=visible]:opacity-100 data-[state=hidden]:opacity-0',
    thumb:
      'relative flex-1 rounded-full bg-[rgba(18,21,28,0.18)] dark:bg-[rgba(232,236,244,0.2)] hover:bg-[#e11d48] dark:hover:bg-[#fb7185]',
  },
}
