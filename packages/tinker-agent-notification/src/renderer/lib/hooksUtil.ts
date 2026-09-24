import startWith from 'licia/startWith'
import trim from 'licia/trim'
import type { Hook } from '../types'

export function extractSoundPath(command: string): string | null {
  if (startWith(command, 'afplay ')) {
    return trim(command.replace('afplay ', ''), '"')
  }
  const match = command.match(/play\.ps1"\s+"([^"]+)"/)
  if (match) {
    return match[1]
  }
  return null
}

export function isSoundHook(hook: Hook): boolean {
  return (
    hook.type === 'command' &&
    typeof hook.command === 'string' &&
    extractSoundPath(hook.command) !== null
  )
}
