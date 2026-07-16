export const tw = {
  background: {
    app: 'bg-[radial-gradient(ellipse_80%_50%_at_100%_-10%,hsl(var(--glow)/0.08),transparent_55%),radial-gradient(ellipse_60%_40%_at_0%_100%,hsl(var(--glow)/0.05),transparent_50%),hsl(var(--background))]',
    toolbar: 'bg-card',
    sidebar: 'bg-[hsl(var(--sidebar))]',
    welcomeAction:
      'bg-card/90 hover:bg-accent hover:border-border dark:hover:border-border',
    welcomeRecent: 'bg-card/70 hover:bg-accent/80',
    composer:
      'bg-[var(--composer-bg)] border-border/80 focus-within:border-ring/50 focus-within:shadow-[0_0_0_1px_hsl(var(--ring)/0.16)] dark:border-border dark:focus-within:border-ring/40',
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
    recent: 'hover:bg-accent/70',
  },
  session: {
    item: 'bg-transparent text-muted-foreground hover:bg-background/55 hover:text-foreground',
    active:
      'bg-background/80 text-foreground border-l-2 border-l-primary rounded-l-none shadow-sm',
  },
  workspace: {
    label:
      'min-w-0 flex-1 bg-transparent border-none cursor-pointer px-1 py-0 text-sm font-semibold tracking-tight text-foreground text-left truncate hover:text-primary transition-colors',
  },
  select: {
    item: 'px-2 py-1.5 text-sm rounded-sm cursor-pointer outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
  },
  popover: {
    root: 'rounded-md border border-border bg-popover text-popover-foreground shadow-lg',
    item: 'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-start outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
  },
  markdown: {
    link: 'text-primary underline underline-offset-2 hover:text-primary/80',
    blockquote:
      'my-3 border-s-2 border-muted-foreground/30 ps-4 text-muted-foreground',
    listMarker: 'marker:text-muted-foreground',
    hr: 'my-3 border-muted-foreground/20',
    th: 'bg-muted px-3 py-1.5 text-start font-medium first:rounded-ss-md last:rounded-se-md',
    td: 'border-b border-s border-muted-foreground/20 px-3 py-1.5 text-start last:border-e',
    codeHeader: 'border-border bg-muted/50',
    codeBlock:
      'overflow-x-auto rounded-b-md rounded-t-none border border-t-0 border-border bg-muted/30 p-3.5 font-mono text-[13px] leading-relaxed',
    inlineCode: 'rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em]',
  },
  button: {
    icon: 'flex items-center justify-center w-8 h-8 rounded-sm bg-transparent border-none cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
    send: 'flex size-8 items-center justify-center rounded-sm border-none bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40',
    action:
      'flex size-7 items-center justify-center rounded-sm border-none bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
  },
  message: {
    userBubble:
      'bg-secondary text-secondary-foreground rounded-md px-3.5 py-2 border border-border',
    assistant: 'text-foreground',
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
