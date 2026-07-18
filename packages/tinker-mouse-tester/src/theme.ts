export const tw = {
  appShell: 'font-sans antialiased',
  label: 'font-sans text-[11px] uppercase tracking-[0.18em]',
  value: 'font-mono tabular-nums',
}

export const colors = {
  void: (isDark: boolean) => (isDark ? '#12151a' : '#d8dde6'),
  voidDeep: (isDark: boolean) => (isDark ? '#0c0e12' : '#c5ccd8'),
  surfaceRaised: (isDark: boolean) => (isDark ? '#232933' : '#f7f8fb'),
  chalk: (isDark: boolean) => (isDark ? '#e8ecf2' : '#1a1f28'),
  mist: (isDark: boolean) => (isDark ? '#8b95a5' : '#5c6678'),
  line: (isDark: boolean) =>
    isDark ? 'rgba(232,236,242,0.10)' : 'rgba(26,31,40,0.10)',
  copper: (isDark: boolean) => (isDark ? '#e8956a' : '#c45f32'),
  copperGlow: (isDark: boolean) =>
    isDark ? 'rgba(232,149,106,0.45)' : 'rgba(196,95,50,0.35)',
  copperDim: (isDark: boolean) =>
    isDark ? 'rgba(232,149,106,0.14)' : 'rgba(196,95,50,0.12)',
  teal: (isDark: boolean) => (isDark ? '#5eb8a8' : '#2f8f82'),
  mouseShell: (isDark: boolean) => (isDark ? '#2a303a' : '#3a4150'),
  mouseShellLit: (isDark: boolean) => (isDark ? '#343b48' : '#4a5264'),
  mouseStroke: (isDark: boolean) => (isDark ? '#0a0c10' : '#1a1f28'),
  mouseBtn: (isDark: boolean) => (isDark ? '#323844' : '#454d5e'),
  mouseBtnPressed: (isDark: boolean) => (isDark ? '#e8956a' : '#c45f32'),
  mouseBtnText: (isDark: boolean) => (isDark ? '#9aa3b2' : '#c5ccd8'),
  mouseBtnTextOn: (isDark: boolean) => (isDark ? '#1a120e' : '#fff8f4'),
  padFill: (isDark: boolean) => (isDark ? '#3a5368' : '#6e92b0'),
  padRing: (isDark: boolean) =>
    isDark ? 'rgba(168,196,216,0.55)' : 'rgba(232,240,246,0.70)',
  padRingDim: (isDark: boolean) =>
    isDark ? 'rgba(168,196,216,0.28)' : 'rgba(232,240,246,0.45)',
  padGlow: (isDark: boolean) =>
    isDark ? 'rgba(110,146,176,0.55)' : 'rgba(110,146,176,0.40)',
  padDim: (isDark: boolean) =>
    isDark ? 'rgba(20,36,48,0.35)' : 'rgba(40,70,95,0.18)',
}
