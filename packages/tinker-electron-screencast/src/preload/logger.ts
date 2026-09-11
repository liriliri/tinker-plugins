import type { LogEntry } from '../common/types'
import each from 'licia/each'
import now from 'licia/now'
import randomId from 'licia/randomId'

type LogListener = (entry: LogEntry) => void

const listeners = new Set<LogListener>()
const recent: LogEntry[] = []
const MAX_LOGS = 200

export function addLog(
  message: string,
  level: LogEntry['level'] = 'info',
): LogEntry {
  const entry: LogEntry = {
    id: randomId(8),
    time: now(),
    level,
    message,
  }
  recent.push(entry)
  if (recent.length > MAX_LOGS) {
    recent.splice(0, recent.length - MAX_LOGS)
  }
  each([...listeners], (listener) => listener(entry))
  return entry
}

export function getLogs(): LogEntry[] {
  return [...recent]
}

export function clearLogs() {
  recent.length = 0
}

export function onLog(listener: LogListener): void {
  listeners.add(listener)
}

export function offLog(listener: LogListener): void {
  listeners.delete(listener)
}
