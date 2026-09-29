export const tw = {
  appShell:
    'h-screen overflow-hidden relative select-none antialiased flex flex-col font-sans',
  label: 'text-[10px] font-medium uppercase tracking-[0.16em]',
  body: 'text-[13px] leading-relaxed',
  mono: 'font-mono tabular-nums text-[12px]',
  main: 'flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_200px]',
  pane: 'min-h-0 flex flex-col border-b md:border-b-0 md:border-r',
  panePad: 'flex-1 min-h-0 p-4 flex flex-col',
  keycap:
    'inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded border text-[11px] font-mono leading-none',
  startBtn:
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md text-[13px] font-medium transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  hint: 'pointer-events-none absolute top-8 right-8 z-20 max-w-md rounded-md px-4 py-2.5 text-[13px] font-medium shadow-lg transition-all duration-300',
  bezel:
    'relative flex-1 min-h-[180px] rounded-md border overflow-hidden flex flex-col',
  shortcutGrid: 'mt-3 flex flex-col gap-1.5',
  shortcutRow:
    'flex items-center justify-between gap-2 rounded-md border px-2.5 py-2',
}

export const colors = {
  chrome: (isDark: boolean) => (isDark ? '#141820' : '#e8edf3'),
  panel: (isDark: boolean) => (isDark ? '#151a24' : '#e4eaf1'),
  sidebar: (isDark: boolean) => (isDark ? '#222a38' : '#f7f9fc'),
  panelRaised: (isDark: boolean) => (isDark ? '#2a3344' : '#ffffff'),
  line: (isDark: boolean) =>
    isDark ? 'rgba(140,190,210,0.12)' : 'rgba(24,40,56,0.10)',
  chalk: (isDark: boolean) => (isDark ? '#e4eaf2' : '#182032'),
  mist: (isDark: boolean) => (isDark ? '#8492a6' : '#5a6a7e'),
  signal: (isDark: boolean) => (isDark ? '#6b9ef5' : '#3b6fd4'),
  signalOn: (isDark: boolean) => (isDark ? '#0a1224' : '#f5f8ff'),
  signalRing: (isDark: boolean) =>
    isDark ? 'rgba(107,158,245,0.45)' : 'rgba(59,111,212,0.40)',
  bezel: (isDark: boolean) => (isDark ? '#0e1218' : '#d0d8e2'),
  bezelInset: (isDark: boolean) =>
    isDark
      ? 'inset 0 0 0 1px rgba(140,190,210,0.06)'
      : 'inset 0 0 0 1px rgba(24,40,56,0.06)',
  keycapBg: (isDark: boolean) => (isDark ? '#141820' : '#ffffff'),
  keycapBorder: (isDark: boolean) =>
    isDark ? 'rgba(140,190,210,0.18)' : 'rgba(24,40,56,0.14)',
  hintBg: 'rgba(10,16,24,0.92)',
  hintFg: '#e4eaf2',
  hintAccent: '#6b9ef5',
}
