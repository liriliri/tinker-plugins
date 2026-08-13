import isMac from 'licia/isMac'

export function getPluginBaseUrl() {
  return new URL('.', window.location.href).href
}

export function shortcutLabel(key: string): string {
  return isMac ? `⌘${key}` : `Ctrl+${key}`
}
