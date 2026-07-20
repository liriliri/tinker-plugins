import type { AddressObject } from 'mailparser'
import contain from 'licia/contain'
import filter from 'licia/filter'
import flatten from 'licia/flatten'
import isArr from 'licia/isArr'
import map from 'licia/map'
import stripHtmlTag from 'licia/stripHtmlTag'
import toArr from 'licia/toArr'
import trim from 'licia/trim'
import truncate from 'licia/truncate'
import type { FolderRole, MailAddress, MessageHeader } from '../../common/types'

const SNIPPET_MAX = 140

export function mapRole(specialUse?: string | false): FolderRole | undefined {
  if (!specialUse) return undefined
  const roles: Record<string, FolderRole> = {
    '\\Inbox': 'inbox',
    '\\Sent': 'sent',
    '\\Drafts': 'drafts',
    '\\Trash': 'trash',
    '\\Junk': 'junk',
    '\\Archive': 'archive',
    '\\All': 'all',
  }
  return roles[specialUse]
}

export function mapAddresses(
  list: { name?: string; address?: string }[] | undefined,
): MailAddress[] {
  if (!list) return []
  return map(
    filter(list, (a) => !!a.address),
    (a) => ({
      name: a.name || undefined,
      address: a.address as string,
    }),
  )
}

export function fromAddressObject(
  value: AddressObject | AddressObject[] | undefined,
): MailAddress[] {
  if (!value) return []
  return mapAddresses(flatten(map(toArr(value), (item) => item.value)))
}

export function flagsToArray(
  flags: Set<string> | string[] | undefined,
): string[] {
  if (!flags) return []
  return isArr(flags) ? flags : [...flags]
}

export function makeSnippet(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const text = trim(stripHtmlTag(raw).replace(/\s+/g, ' '))
  if (!text) return undefined
  return truncate(text, SNIPPET_MAX, { ellipsis: '…', separator: ' ' })
}

export function headerFromFetched(msg: {
  uid: number
  flags?: Set<string> | string[]
  envelope?: {
    subject?: string
    from?: { name?: string; address?: string }[]
    to?: { name?: string; address?: string }[]
    date?: Date
  }
  bodyParts?: Map<string, Buffer>
}): MessageHeader {
  const flags = flagsToArray(msg.flags)
  const textPart = msg.bodyParts?.get('TEXT')
  return {
    uid: msg.uid,
    subject: msg.envelope?.subject || '',
    from: mapAddresses(msg.envelope?.from),
    to: mapAddresses(msg.envelope?.to),
    date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : null,
    flags,
    unseen: !contain(flags, '\\Seen'),
    snippet: makeSnippet(textPart?.toString('utf8')),
  }
}
