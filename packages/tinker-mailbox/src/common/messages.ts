import sortBy from 'licia/sortBy'
import type { MessageHeader } from './types'

export function sortMessagesByDateDesc<T extends Pick<MessageHeader, 'date'>>(
  messages: T[],
): T[] {
  return sortBy(messages, (m) => -(m.date ? Date.parse(m.date) : 0))
}
