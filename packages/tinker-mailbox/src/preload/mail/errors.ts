import isErr from 'licia/isErr'

export function toErrorMessage(err: unknown): string {
  if (isErr(err)) {
    const detail = (err as Error & { responseText?: string }).responseText
    return detail ? `${err.message}: ${detail}` : err.message
  }
  return String(err)
}
