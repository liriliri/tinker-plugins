export const tw = {
  background: {
    app: 'bg-[var(--gm-panel)]',
    toolbar: 'bg-[var(--gm-chrome)] border-[var(--gm-edge)]',
    content: 'bg-[var(--gm-panel)]',
  },
  border: {
    divider: 'border-[var(--gm-edge)]',
  },
  text: {
    accent: 'text-[var(--gm-led)]',
  },
  font: {
    ui: 'font-[family-name:var(--gm-font-ui)]',
  },
  input: {
    base: 'bg-[var(--gm-input)] text-[var(--gm-ink)] placeholder-[var(--gm-muted)] rounded-sm px-3 h-8 text-sm outline-none border border-[var(--gm-edge-soft)] focus:border-[var(--gm-led)] transition-colors font-[family-name:var(--gm-font-ui)]',
  },
  button: {
    icon: 'flex items-center justify-center w-8 h-8 rounded-sm border border-transparent cursor-pointer text-[var(--gm-steel)] hover:text-[var(--gm-ink)] hover:bg-[var(--gm-hover)] hover:border-[var(--gm-edge-soft)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
    iconCabinet:
      'flex items-center justify-center w-7 h-7 rounded-sm border border-[var(--gm-edge)] cursor-pointer text-[var(--gm-on-cabinet-muted)] hover:text-[var(--gm-led)] hover:border-[var(--gm-led)]/50 hover:bg-[var(--gm-cabinet-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
  },
  sidebar: {
    wrap: 'w-[11.5rem] shrink-0 border-r border-[var(--gm-edge)] bg-[var(--gm-cabinet)] overflow-y-auto',
    group:
      'flex w-full items-center gap-1.5 px-2.5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gm-hud)] border-none cursor-pointer bg-transparent hover:text-[var(--gm-led)] transition-colors font-[family-name:var(--gm-font-hud)]',
    groupCount:
      'text-[10px] tabular-nums text-[var(--gm-on-cabinet-muted)] font-normal tracking-normal',
    item: 'w-full text-left px-3 py-1.5 text-[13px] border-none cursor-pointer rounded-sm transition-colors font-[family-name:var(--gm-font-ui)]',
    itemIdle:
      'text-[var(--gm-on-cabinet-muted)] hover:text-[var(--gm-on-cabinet)] hover:bg-[var(--gm-cabinet-hover)]',
    itemActive:
      'text-[var(--gm-led)] bg-[var(--gm-cabinet-active)] font-medium',
  },
  song: {
    gameHeader:
      'sticky top-0 z-[1] flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium border-none cursor-pointer bg-[var(--gm-header)] text-[var(--gm-ink)] hover:bg-[var(--gm-header-hover)] border-b border-[var(--gm-edge-soft)] font-[family-name:var(--gm-font-ui)]',
    row: 'flex w-full items-center gap-2 pl-3 pr-3 py-1.5 text-left border-none cursor-pointer transition-colors font-[family-name:var(--gm-font-ui)]',
    rowIdle: 'hover:bg-[var(--gm-hover)]',
    rowActive: 'bg-[var(--gm-active-row)]',
  },
  toast: {
    root: 'bg-[var(--gm-chrome)] border border-[var(--gm-edge)] rounded-sm px-4 py-3 flex items-start gap-3 shadow-md',
    title:
      'text-[12.5px] font-semibold text-red-600 dark:text-red-400 font-[family-name:var(--gm-font-ui)]',
    description:
      'text-[12px] text-[var(--gm-steel)] mt-0.5 font-[family-name:var(--gm-font-ui)]',
    close: 'text-[var(--gm-muted)] hover:text-[var(--gm-ink)] cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-50',
  },
  searchIcon:
    'absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--gm-muted)] pointer-events-none',
  meta: 'text-[11px] shrink-0 tabular-nums tracking-wide text-[var(--gm-steel)] font-[family-name:var(--gm-font-hud)]',
  songMeta:
    'shrink-0 max-w-[28%] truncate text-[11px] text-[var(--gm-muted)] font-[family-name:var(--gm-font-hud)]',
  songSize:
    'shrink-0 text-[11px] tabular-nums text-[var(--gm-muted)] font-[family-name:var(--gm-font-hud)]',
  songTitle: 'flex-1 min-w-0 truncate text-[13px] text-[var(--gm-ink)]',
  gameCount:
    'text-[11px] tabular-nums text-[var(--gm-steel)] font-[family-name:var(--gm-font-hud)]',
  playIcon: 'shrink-0 w-4 flex justify-center text-[var(--gm-led)]',
  player: {
    shell:
      'shrink-0 border-t border-[var(--gm-edge)] bg-[var(--gm-cabinet)] px-2.5 pt-1 pb-1.5 flex flex-col gap-1',
    blink: 'w-1.5 h-1.5 shrink-0 bg-[var(--gm-led)] gm-blink',
    blinkIdle:
      'w-1.5 h-1.5 shrink-0 bg-[var(--gm-on-cabinet-muted)] opacity-40',
    line: 'flex items-baseline gap-1.5 min-w-0',
    title:
      'text-[12px] truncate font-medium text-[var(--gm-on-cabinet)] font-[family-name:var(--gm-font-ui)]',
    sep: 'text-[var(--gm-on-cabinet-muted)] shrink-0 text-[11px]',
    subtitle:
      'text-[11px] truncate text-[var(--gm-on-cabinet-muted)] font-[family-name:var(--gm-font-hud)]',
    idle: 'text-[12px] text-[var(--gm-on-cabinet-muted)] font-[family-name:var(--gm-font-ui)]',
    time: 'text-[10px] tabular-nums shrink-0 text-[var(--gm-led)] font-[family-name:var(--gm-font-hud)] tracking-wider',
    eq: 'flex items-end gap-0.5 h-3 shrink-0',
    eqBar: 'w-0.5 bg-[var(--gm-led)] rounded-sm gm-eq',
  },
  seek: {
    track: 'group relative h-2.5',
    enabled: 'cursor-pointer',
    disabled: 'cursor-default opacity-40',
    rail: 'absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-sm bg-[var(--gm-seek-rail)] gm-seek-rail',
    fill: 'absolute top-1/2 -translate-y-1/2 h-1 rounded-sm bg-[var(--gm-led)] pointer-events-none',
    thumb:
      'absolute top-1/2 -translate-y-1/2 w-1.5 h-2 rounded-sm bg-[var(--gm-led)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
  },
  empty:
    'flex-1 flex flex-col items-center justify-center gap-2 text-sm text-[var(--gm-steel)] font-[family-name:var(--gm-font-ui)]',
  emptyHint:
    'text-[11px] tracking-[0.14em] uppercase text-[var(--gm-muted)] font-[family-name:var(--gm-font-hud)]',
}
