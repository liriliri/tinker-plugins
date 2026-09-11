import isErr from 'licia/isErr'
import toStr from 'licia/toStr'

export function errorMessage(err: unknown): string {
  return isErr(err) ? err.message : toStr(err)
}
