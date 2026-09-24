import isErr from 'licia/isErr'
import isStr from 'licia/isStr'
import toStr from 'licia/toStr'

export function errorMessage(err: unknown): string {
  if (isErr(err)) return err.message
  if (isStr(err) && err) return err
  return toStr(err)
}
