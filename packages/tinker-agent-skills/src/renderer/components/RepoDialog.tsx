import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Github, LoaderCircle, X } from 'lucide-react'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'
import AppScrollArea from './AppScrollArea'

const RepoDialog = observer(() => {
  const { t } = useTranslation()
  const busy = store.repoResolving || store.repoInstalling
  const hasSkills = store.repoSkills.length > 0
  const selectedCount = store.repoSelectedIds.length

  return (
    <Dialog.Root
      open={store.repoDialogOpen}
      onOpenChange={(next) => {
        if (!next) store.closeRepoDialog()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={className(
            'fixed inset-0 z-40 backdrop-blur-[2px]',
            tw.overlay,
          )}
        />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[calc(100vw-2.5rem)] max-w-lg',
            'flex flex-col rounded-2xl shadow-2xl overflow-hidden outline-none border',
            hasSkills ? 'h-[min(560px,calc(100vh-3rem))]' : '',
            tw.background.dialog,
            tw.border.dialog,
          )}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
            <div className="min-w-0">
              <Dialog.Title
                className={className(
                  'text-[15px] font-semibold tracking-tight',
                  tw.text.primary,
                )}
              >
                {t('repoTitle')}
              </Dialog.Title>
              <Dialog.Description
                className={className('text-[12px] mt-1 m-0', tw.text.muted)}
              >
                {hasSkills
                  ? t('repoSelectHint', {
                      repo: store.repoSourceLabel,
                      count: store.repoSkills.length,
                    })
                  : t('repoHint')}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className={className(
                'flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent cursor-pointer shrink-0',
                tw.button.icon.default,
                tw.button.icon.hover,
              )}
              disabled={busy}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </Dialog.Close>
          </div>

          <div className="px-5 pb-4 shrink-0">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void store.resolveRepoSkills()
              }}
            >
              <div
                className={className(
                  'flex items-center flex-1 gap-2 px-2.5 py-1.5 rounded-lg border transition-shadow',
                  tw.border.search,
                  tw.border.searchFocus,
                  tw.background.search,
                )}
              >
                <Github
                  className={className('w-3.5 h-3.5 shrink-0', tw.text.muted)}
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={store.repoSource}
                  onChange={(e) => store.setRepoSource(e.target.value)}
                  placeholder={t('repoPlaceholder')}
                  disabled={busy}
                  autoFocus
                  className={className(
                    'flex-1 text-[13px] bg-transparent outline-none border-none',
                    tw.text.primary,
                    tw.text.placeholder,
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={busy || !store.repoSource.trim()}
                className={className(
                  'inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-medium border-none cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed',
                  tw.button.secondary,
                )}
              >
                {store.repoResolving ? (
                  <LoaderCircle
                    className="w-3.5 h-3.5 animate-spin"
                    strokeWidth={2}
                  />
                ) : null}
                {t('repoFetch')}
              </button>
            </form>
            {store.repoError ? (
              <p className={className('text-[12px] m-0 mt-2', tw.toast.error)}>
                {t(store.repoError)}
              </p>
            ) : null}
          </div>

          {hasSkills ? (
            <>
              <div className="flex items-center justify-between gap-2 px-5 pb-2 shrink-0">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    store.toggleAllRepoSkills(
                      selectedCount < store.repoSkills.length,
                    )
                  }
                  className={className(
                    'text-[12px] border-none bg-transparent cursor-pointer px-0',
                    tw.button.ghost,
                  )}
                >
                  {selectedCount < store.repoSkills.length
                    ? t('repoSelectAll')
                    : t('repoSelectNone')}
                </button>
                <span className={className('text-[11px]', tw.text.muted)}>
                  {t('repoSelectedCount', { count: selectedCount })}
                </span>
              </div>

              <AppScrollArea className="px-2 pb-2">
                <div className="flex flex-col gap-0.5 px-3">
                  {store.repoSkills.map((skill) => {
                    const checked = store.repoSelectedIds.includes(skill.id)
                    return (
                      <label
                        key={skill.id}
                        className={className(
                          'flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                          tw.background.dialogRow,
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={busy}
                          onChange={() => store.toggleRepoSkill(skill.id)}
                          className={className('mt-0.5', tw.checkbox)}
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className={className(
                              'text-[13px] font-medium truncate',
                              tw.text.primary,
                            )}
                          >
                            {skill.name}
                          </div>
                          <p
                            className={className(
                              'text-[12px] leading-relaxed line-clamp-2 m-0 mt-0.5',
                              tw.text.secondary,
                            )}
                          >
                            {skill.description || t('noDescription')}
                          </p>
                          <div
                            className={className(
                              'text-[11px] font-mono mt-1 truncate',
                              tw.text.muted,
                            )}
                          >
                            {skill.folderName}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </AppScrollArea>

              <div
                className={className(
                  'flex items-center justify-end gap-2 px-5 py-4 border-t shrink-0',
                  tw.border.divider,
                )}
              >
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => store.closeRepoDialog()}
                  className={className(
                    'h-8 px-3 rounded-lg text-[12px] font-medium border-none cursor-pointer',
                    tw.button.secondary,
                  )}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={busy || selectedCount === 0}
                  onClick={() => store.installRepoSkills()}
                  className={className(
                    'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                    tw.button.done,
                  )}
                >
                  {store.repoInstalling ? (
                    <LoaderCircle
                      className="w-3.5 h-3.5 animate-spin"
                      strokeWidth={2}
                    />
                  ) : null}
                  {store.repoInstalling
                    ? t('repoInstalling')
                    : t('repoInstall', { count: selectedCount })}
                </button>
              </div>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default RepoDialog
