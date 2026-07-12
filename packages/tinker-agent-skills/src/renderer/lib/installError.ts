import contain from 'licia/contain'
import isErr from 'licia/isErr'
import startWith from 'licia/startWith'
import toStr from 'licia/toStr'

const INSTALL_ERROR_KEYS = [
  'errNoSkillMd',
  'errInvalidSkillMd',
  'errAmbiguousZip',
  'errSourceMissing',
  'errUnsupportedSource',
  'errDropPath',
  'errMarketplaceNetwork',
  'errMarketplaceDetail',
  'errMarketplaceAmbiguous',
  'errMarketplaceDownload',
  'errMarketplaceInstall',
  'errRepoInvalidSource',
  'errRepoNotFound',
  'errRepoDownload',
  'errRepoSessionExpired',
  'errRepoNoSelection',
  'errRepoSkillNotFound',
  'errDeleteForbidden',
  'errDeleteFailed',
]

/** Map thrown errors (including Electron-wrapped messages) to i18n keys. */
export function toErrorKey(err: unknown, fallback: string): string {
  const message = isErr(err) ? err.message : toStr(err)
  if (contain(INSTALL_ERROR_KEYS, message) || startWith(message, 'err')) {
    return message
  }
  for (const key of INSTALL_ERROR_KEYS) {
    if (contain(message, key)) return key
  }
  return fallback
}
