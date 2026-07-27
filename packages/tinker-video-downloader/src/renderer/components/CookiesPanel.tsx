import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Trash2 } from 'lucide-react'
import className from 'licia/className'
import uuid from 'licia/uuid'
import trim from 'licia/trim'
import filter from 'licia/filter'
import findIdx from 'licia/findIdx'
import isErr from 'licia/isErr'
import toStr from 'licia/toStr'
import store from '../store'
import { tw } from '../theme'
import { parseCookiesTxt } from '../../common/cookies'
import type { CookieEntry } from '../../common/types'

const CookiesPanel = observer(() => {
  const { t } = useTranslation()
  const cookies = store.settings.cookies
  const [domain, setDomain] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')

  const handleAdd = () => {
    const d = trim(domain)
    const n = trim(name)
    if (!d || !n) return

    const next = [...cookies]
    const existing = findIdx(next, (c) => c.domain === d && c.name === n)
    const entry: CookieEntry = {
      id: existing >= 0 ? next[existing].id : uuid(),
      domain: d,
      name: n,
      value,
    }
    if (existing >= 0) {
      next[existing] = entry
    } else {
      next.push(entry)
    }
    store.setCookies(next)
    setDomain('')
    setName('')
    setValue('')
  }

  const handleRemove = (id: string) => {
    store.setCookies(filter(cookies, (c) => c.id !== id))
  }

  const handleClear = () => {
    store.setCookies([])
  }

  const handleImport = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Cookies', extensions: ['txt'] },
        { name: 'All', extensions: ['*'] },
      ],
    })
    const filePath = result?.filePaths?.[0]
    if (!filePath) return

    try {
      const content = await tinker.readFile(filePath, 'utf-8')
      const parsed = parseCookiesTxt(toStr(content))
      if (parsed.length === 0) {
        store.showToast('cookiesImportEmpty', 'error')
        return
      }

      const byKey = new Map<string, CookieEntry>()
      for (const c of cookies) {
        byKey.set(`${c.domain}\0${c.name}`, c)
      }
      for (const c of parsed) {
        const key = `${c.domain}\0${c.name}`
        const prev = byKey.get(key)
        byKey.set(key, {
          id: prev?.id || uuid(),
          domain: c.domain,
          name: c.name,
          value: c.value,
        })
      }
      store.setCookies(Array.from(byKey.values()))
      store.showToast('cookiesImportOk', 'success')
    } catch (err: unknown) {
      store.showToast(isErr(err) ? err.message : toStr(err), 'error')
    }
  }

  return (
    <Dialog.Root open onOpenChange={() => store.setShowCookies(false)}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={className('fixed inset-0 z-50', tw.overlay)}
        />
        <Dialog.Content
          className={className(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'z-50 w-[520px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-auto',
            tw.modal.shell,
            tw.background.card,
          )}
          aria-describedby={undefined}
        >
          <div className={className('px-4 py-3 border-b', tw.border.divider)}>
            <Dialog.Title
              className={className(
                'text-xs font-semibold uppercase tracking-[0.1em]',
                tw.text.primary,
              )}
            >
              {t('cookies')}
            </Dialog.Title>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-[1.2fr_1fr_1.4fr_auto] gap-2">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder={t('cookieDomain')}
                className={className(tw.input.base, tw.input.focus, 'text-xs')}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('cookieName')}
                className={className(tw.input.base, tw.input.focus, 'text-xs')}
              />
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('cookieValue')}
                className={className(tw.input.base, tw.input.focus, 'text-xs')}
              />
              <button
                onClick={handleAdd}
                disabled={!trim(domain) || !trim(name)}
                className={className(
                  tw.button.primary.base,
                  tw.button.primary.hover,
                  tw.button.primary.disabled,
                  tw.button.primary.transition,
                  'whitespace-nowrap',
                )}
              >
                {t('add')}
              </button>
            </div>

            <p className={className('text-[11px]', tw.text.tertiary)}>
              {t('cookiesHint')}
            </p>

            <div
              className={className(
                'rounded-sm border overflow-hidden',
                tw.border.divider,
              )}
            >
              <div
                className={className(
                  'grid grid-cols-[1.2fr_1fr_1.4fr_auto] gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em]',
                  tw.background.inset,
                  tw.text.tertiary,
                )}
              >
                <span>{t('cookieDomain')}</span>
                <span>{t('cookieName')}</span>
                <span>{t('cookieValue')}</span>
                <span />
              </div>
              {cookies.length === 0 ? (
                <div
                  className={className(
                    'px-3 py-6 text-center text-xs',
                    tw.text.tertiary,
                  )}
                >
                  {t('noCookies')}
                </div>
              ) : (
                <ul
                  className={className(
                    'max-h-56 overflow-y-auto',
                    tw.scrollbar.area,
                  )}
                >
                  {cookies.map((c) => (
                    <li
                      key={c.id}
                      className={className(
                        'grid grid-cols-[1.2fr_1fr_1.4fr_auto] gap-2 px-3 py-2 text-xs border-t items-center',
                        tw.border.divider,
                      )}
                    >
                      <span
                        className={className(
                          'font-mono truncate',
                          tw.text.primary,
                        )}
                        title={c.domain}
                      >
                        {c.domain}
                      </span>
                      <span
                        className={className(
                          'font-mono truncate',
                          tw.text.secondary,
                        )}
                        title={c.name}
                      >
                        {c.name}
                      </span>
                      <span
                        className={className(
                          'font-mono truncate',
                          tw.text.tertiary,
                        )}
                        title={c.value}
                      >
                        {c.value}
                      </span>
                      <button
                        onClick={() => handleRemove(c.id)}
                        className={className(
                          tw.button.ghost.base,
                          tw.button.ghost.hover,
                          tw.button.ghost.transition,
                          tw.status.deleteButton,
                          'px-1.5',
                        )}
                        title={t('delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div
            className={className(
              'px-4 py-3 border-t flex items-center justify-between gap-2',
              tw.border.divider,
            )}
          >
            <div className="flex gap-2">
              <button
                onClick={() => void handleImport()}
                className={className(
                  tw.button.secondary.base,
                  tw.button.secondary.hover,
                  tw.button.secondary.transition,
                )}
              >
                {t('importCookiesTxt')}
              </button>
              {cookies.length > 0 && (
                <button
                  onClick={handleClear}
                  className={className(
                    tw.button.secondary.base,
                    tw.button.secondary.hover,
                    tw.button.secondary.transition,
                  )}
                >
                  {t('clearAll')}
                </button>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className={className(
                  tw.button.primary.base,
                  tw.button.primary.hover,
                  tw.button.primary.transition,
                )}
              >
                {t('confirm')}
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default CookiesPanel
