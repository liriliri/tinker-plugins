export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

export const formatDate = (dateStr: string, locale?: string): string => {
  try {
    // ccusage returns date in YYYY-MM-DD format
    const date = new Date(dateStr)

    // Use locale-aware formatting
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
