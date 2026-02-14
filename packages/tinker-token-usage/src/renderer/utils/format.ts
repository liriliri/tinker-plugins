export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

export const formatDate = (dateStr: string): string => {
  try {
    // ccusage returns date in YYYY-MM-DD format
    const date = new Date(dateStr)

    // Use locale-aware formatting
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
