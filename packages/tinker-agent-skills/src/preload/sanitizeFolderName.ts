import trim from 'licia/trim'

export function sanitizeFolderName(name: string): string {
  return trim(
    trim(name)
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/^\.+/, '')
      .replace(/-+/g, '-'),
    '-',
  ).slice(0, 80)
}
