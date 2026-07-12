import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import className from 'licia/className'
import filter from 'licia/filter'
import { tw } from '../theme'
import store from '../store'
import ToggleSwitch from './ToggleSwitch'
import AppScrollArea from './AppScrollArea'

const ConfigDialog = observer(() => {
  const { t } = useTranslation()
  const skill = store.configSkill
  const open = Boolean(skill)

  const enabledCount = filter(
    store.configAgents,
    (agent) => agent.enabled,
  ).length

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) store.closeConfig()
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
            'w-[calc(100vw-2.5rem)] max-w-md h-[min(520px,80vh)]',
            'flex flex-col rounded-2xl shadow-2xl overflow-hidden outline-none border',
            tw.background.dialog,
            tw.border.dialog,
          )}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
            <div className="min-w-0">
              <Dialog.Title
                className={className(
                  'text-[15px] font-semibold tracking-tight truncate',
                  tw.text.primary,
                )}
              >
                {t('configureTitle')}
              </Dialog.Title>
              <Dialog.Description
                className={className(
                  'mt-1.5 text-[12px] leading-relaxed',
                  tw.text.secondary,
                )}
              >
                {t('configureDesc', {
                  skill: skill?.name ?? '',
                  enabled: enabledCount,
                  total: store.configAgents.length,
                })}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className={className(
                'flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent cursor-pointer shrink-0',
                tw.button.icon.default,
                tw.button.icon.hover,
              )}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </Dialog.Close>
          </div>

          <AppScrollArea viewportClassName="px-3 pb-2">
            {store.configLoading ? (
              <div
                className={className(
                  'px-3 py-10 text-center text-sm',
                  tw.empty,
                )}
              >
                {t('loading')}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {store.configAgents.map((agent) => {
                  const saving = store.configSavingId === agent.id
                  const available = agent.detected || agent.enabled
                  return (
                    <div
                      key={agent.id}
                      className={className(
                        'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                        tw.background.dialogRow,
                        !available && 'opacity-50',
                      )}
                    >
                      <div
                        className={className(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          agent.enabled ? tw.accent.dot : tw.accent.barMuted,
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={className(
                            'text-[13px] font-medium truncate',
                            tw.text.primary,
                          )}
                        >
                          {agent.name}
                        </div>
                        <div
                          className={className(
                            'text-[11px] truncate mt-0.5 font-mono',
                            tw.text.muted,
                          )}
                          title={agent.skillsDir}
                        >
                          {available ? agent.skillsDir : t('agentNotDetected')}
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={agent.enabled}
                        disabled={saving}
                        onChange={() =>
                          store.toggleSkillAgent(agent.id, !agent.enabled)
                        }
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </AppScrollArea>

          <div
            className={className(
              'flex justify-end px-5 py-3.5 border-t shrink-0',
              tw.border.divider,
            )}
          >
            <Dialog.Close
              className={className(
                'px-4 h-8 rounded-lg text-[12px] font-medium border-none cursor-pointer transition-colors',
                tw.button.done,
              )}
            >
              {t('done')}
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default ConfigDialog
