export const tw = {
  background: {
    app: 'bg-[radial-gradient(ellipse_90%_55%_at_100%_-8%,hsl(var(--glow)/0.18),transparent_55%),radial-gradient(ellipse_70%_45%_at_-5%_105%,hsl(var(--glow)/0.12),transparent_50%),hsl(var(--background))]',
    toolbar: 'bg-card',
    sidebar:
      'bg-[linear-gradient(180deg,hsl(var(--sidebar))_0%,hsl(var(--background)/0.92)_100%)]',
    welcomeAction:
      'bg-card/80 hover:bg-accent hover:border-primary/40 dark:hover:border-primary/35',
    welcomeRecent: 'bg-card/60 hover:bg-accent/70',
    composer:
      'bg-[var(--composer-bg)] border-border/80 focus-within:border-primary/45 focus-within:shadow-[0_0_0_1px_hsl(var(--primary)/0.18)] dark:border-border dark:focus-within:border-primary/40',
    composerInput: 'placeholder:text-muted-foreground/70',
    scrollToBottom:
      'border-border bg-card/90 text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:bg-card/80 dark:hover:bg-accent',
    threadFooter:
      'bg-gradient-to-t from-background via-background/85 to-transparent',
  },
  text: {
    primary: 'text-foreground',
    muted: 'text-muted-foreground',
    secondary: 'text-muted-foreground',
    tertiary: 'text-muted-foreground',
    accent: 'text-primary',
    danger: 'text-destructive',
  },
  border: {
    divider: 'border-border',
  },
  hover: {
    recent: 'hover:bg-accent/60',
  },
  session: {
    item: 'bg-transparent text-muted-foreground hover:bg-accent/55 hover:text-foreground',
    active:
      'bg-accent text-accent-foreground border-l-2 border-l-primary rounded-l-none',
  },
  workspace: {
    label:
      'min-w-0 flex-1 bg-transparent border-none cursor-pointer px-1 py-0 text-sm font-semibold tracking-tight text-foreground text-left truncate hover:text-primary transition-colors',
  },
  select: {
    item: 'px-2 py-1.5 text-sm rounded-sm cursor-pointer outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
  },
  button: {
    icon: 'flex items-center justify-center w-8 h-8 rounded-sm bg-transparent border-none cursor-pointer text-muted-foreground hover:bg-accent hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
    send: 'flex size-8 items-center justify-center rounded-sm border-none bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40',
    action:
      'flex size-7 items-center justify-center rounded-sm border-none bg-transparent text-muted-foreground hover:bg-accent hover:text-primary',
  },
  message: {
    userBubble:
      'bg-accent text-accent-foreground rounded-md px-3.5 py-2 border border-primary/15',
    assistant: 'text-foreground border-l-2 border-primary/25 pl-3.5 ml-0.5',
    tool: 'border-border bg-card/70 text-muted-foreground rounded-md',
  },
  toast: {
    root: 'bg-popover text-popover-foreground border border-border rounded-md shadow-lg px-4 py-3 flex items-start gap-3',
    title: 'text-[12.5px] font-semibold text-destructive',
    description: 'text-[12px] text-muted-foreground mt-0.5',
    close: 'text-muted-foreground hover:text-foreground cursor-pointer',
    viewport: 'fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-50',
  },
}
