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
  chrome: 'var(--st-chrome)',
  panel: 'var(--st-panel)',
  sidebar: 'var(--st-sidebar)',
  panelRaised: 'var(--st-panel-raised)',
  line: 'var(--st-line)',
  chalk: 'var(--st-chalk)',
  mist: 'var(--st-mist)',
  signal: 'var(--st-signal)',
  signalOn: 'var(--st-signal-on)',
  signalRing: 'var(--st-signal-ring)',
  bezel: 'var(--st-bezel)',
  bezelInset: 'var(--st-bezel-inset)',
  keycapBg: 'var(--st-keycap-bg)',
  keycapBorder: 'var(--st-keycap-border)',
  hintBg: 'rgba(10,16,24,0.92)',
  hintFg: '#e4eaf2',
  hintAccent: '#6b9ef5',
}

export const hintStyle = { background: colors.hintBg, color: colors.hintFg }
export const hintAccentStyle = { color: colors.hintAccent }
export const chromeStyle = {
  background: colors.chrome,
  color: colors.chalk,
}
export const panelStyle = {
  background: colors.panel,
  borderColor: colors.line,
}
export const sidebarStyle = {
  background: colors.sidebar,
  borderColor: colors.line,
}
export const raisedStyle = {
  background: colors.panelRaised,
  borderColor: colors.line,
}
export const mistStyle = { color: colors.mist }
export const chalkStyle = { color: colors.chalk }
export const signalBtnStyle = {
  background: colors.signal,
  color: colors.signalOn,
  outlineColor: colors.signalRing,
}
export const keycapStyle = {
  background: colors.keycapBg,
  borderColor: colors.keycapBorder,
  color: colors.chalk,
}
export const bezelStyle = {
  background: colors.bezel,
  borderColor: colors.line,
  boxShadow: colors.bezelInset,
}
