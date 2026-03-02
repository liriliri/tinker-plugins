export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

export const formatDate = (
  dateStr: string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      ...options,
    })
  } catch {
    return dateStr
  }
}
