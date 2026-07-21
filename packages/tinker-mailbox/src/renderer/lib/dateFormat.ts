import i18n from 'i18next'

function locale(): string {
  return i18n.language || navigator.language || 'en-US'
}

function hourCycle(): 'h23' | 'h12' {
  return locale().toLowerCase().startsWith('zh') ? 'h23' : 'h12'
}

function shortTimeString(datetime: Date): string {
  const now = Date.now()
  const diffDays = (now - datetime.getTime()) / 86400000
  const sameDay = datetime.toDateString() === new Date(now).toDateString()
  const opts: Intl.DateTimeFormatOptions = { hourCycle: hourCycle() }

  if (diffDays <= 1 && sameDay) {
    opts.hour = 'numeric'
    opts.minute = '2-digit'
    return datetime.toLocaleTimeString(locale(), opts)
  }

  if (diffDays < 5 && !sameDay) {
    opts.weekday = 'short'
    opts.hour = 'numeric'
    opts.minute = '2-digit'
    return datetime.toLocaleTimeString(locale(), opts)
  }

  if (diffDays < 365) {
    opts.month = 'short'
    opts.day = 'numeric'
  } else {
    opts.year = 'numeric'
    opts.month = 'short'
    opts.day = 'numeric'
  }
  return datetime.toLocaleDateString(locale(), opts)
}

function mediumTimeString(datetime: Date): string {
  return datetime.toLocaleString(locale(), {
    hourCycle: hourCycle(),
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function fullTimeString(datetime: Date): string {
  return datetime.toLocaleString(locale(), {
    hourCycle: hourCycle(),
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatMessageDate(
  iso: string | null,
  style: 'short' | 'medium' = 'short',
): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return style === 'medium' ? mediumTimeString(d) : shortTimeString(d)
}
