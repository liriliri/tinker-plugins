import { useState, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import fileUrl from 'licia/fileUrl'
import contain from 'licia/contain'
import last from 'licia/last'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import {
  RotateCcw,
  Bell,
  FolderOpen,
  Play,
  AudioLines,
  ChevronDown,
} from 'lucide-react'
import store, { soundPacks, hookTypes } from './store'
import { tw } from './theme'

const WaveformIcon = ({ size = 16 }: { size?: number }) => (
  <AudioLines size={size} />
)

const BellIcon = () => <Bell size={14} />

const FolderIcon = () => <FolderOpen size={13} />

const Select = ({
  value,
  onChange,
  children,
  flex,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  flex?: boolean
}) => (
  <div
    className={className(
      'relative inline-flex items-center rounded-md',
      flex ? 'flex-1' : '',
      tw.border.card,
      tw.background.primary,
    )}
  >
    <select
      className={className(
        'appearance-none pl-3 pr-8 py-2 rounded-md text-sm border-0 outline-none',
        'bg-transparent',
        'cursor-pointer',
        flex ? 'w-full' : '',
        tw.text.primary,
      )}
      value={value}
      onChange={onChange}
    >
      {children}
    </select>
    <ChevronDown
      size={14}
      className={className(
        'absolute right-2.5 pointer-events-none',
        tw.text.muted,
      )}
    />
  </div>
)

const PreviewButton = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void
}) => (
  <button
    className={className(
      'group/play relative w-8 h-8 rounded flex items-center justify-center',
      'transition-all duration-200',
      tw.text.icon,
      tw.accent.hoverText,
      tw.accent.hoverBg,
      'active:scale-90',
    )}
    onClick={onClick}
  >
    <Play size={14} fill="currentColor" />
  </button>
)

const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) => (
  <div className="flex items-center gap-2 mb-2">
    <span className={tw.accent.icon}>{icon}</span>
    <h3
      className={className(
        'text-xs font-semibold uppercase tracking-wider',
        tw.text.muted,
      )}
    >
      {title}
    </h3>
  </div>
)

const ToggleSwitch = observer(
  ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      className={className(
        'relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer',
        'focus:outline-none',
        checked ? tw.toggle.on : tw.toggle.off,
      )}
      onClick={onChange}
    >
      <div
        className={className(
          'absolute top-0.5 w-4 h-4 rounded-full shadow-sm',
          tw.toggle.thumb,
          'transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  ),
)

const AgentSection = observer(
  ({
    previewSound,
  }: {
    previewSound: (url: string, e?: React.MouseEvent) => void
  }) => {
    const { t } = useTranslation()
    const agentStore = store.selectedAgentStore

    return (
      <div
        className={className(
          'flex flex-col gap-5 p-5 rounded-lg',
          tw.border.card,
          tw.background.secondary,
          tw.shadow.card,
        )}
      >
        <div className="flex flex-col gap-1.5">
          <SectionHeader
            icon={<WaveformIcon size={14} />}
            title={t('soundPacks')}
          />
          <Select
            value={agentStore.selectedPack}
            onChange={(e) => agentStore.setSelectedPack(e.target.value)}
            flex
          >
            {soundPacks.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {t(`soundPack_${pack.id}`)}
              </option>
            ))}
            <option value="custom">{t('customSelected')}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <SectionHeader icon={<BellIcon />} title={t('events')} />
          <div className="flex flex-col gap-1">
            {hookTypes.map((h) => (
              <div
                key={h.id}
                className={className(
                  'flex items-center px-3.5 py-2.5 rounded-md gap-2',
                  'transition-colors duration-200',
                  tw.list.itemHover,
                )}
              >
                <span
                  className={className(
                    'text-sm shrink-0 cursor-pointer',
                    tw.text.primary,
                  )}
                  onClick={() => agentStore.toggleHook(h.id)}
                >
                  {t(`hookType_${h.id}`)}
                </span>
                <div className="flex items-center min-w-0 flex-1">
                  {agentStore.selectedPack === 'custom' && (
                    <span
                      className={className(
                        'text-xs truncate font-mono',
                        tw.text.muted,
                      )}
                    >
                      {agentStore.customSoundPaths[h.id]
                        ? last(agentStore.customSoundPaths[h.id].split('/'))
                        : ''}
                    </span>
                  )}
                </div>
                {agentStore.selectedPack === 'custom' && (
                  <button
                    className={className(
                      'flex items-center justify-center w-8 h-8 rounded shrink-0',
                      'transition-all duration-200',
                      tw.text.icon,
                      tw.accent.hoverText,
                      tw.accent.hoverBg,
                      'active:scale-90',
                    )}
                    onClick={() => agentStore.selectCustomSound(h.id)}
                  >
                    <FolderIcon />
                  </button>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <PreviewButton
                    onClick={(e) => {
                      e.stopPropagation()
                      if (agentStore.selectedPack === 'custom') {
                        if (agentStore.customSoundPaths[h.id]) {
                          previewSound(
                            fileUrl(agentStore.customSoundPaths[h.id]),
                          )
                        }
                      } else {
                        previewSound(
                          fileUrl(
                            store.getSoundAbsolutePath(
                              agentStore.selectedPack,
                              h.file,
                            ),
                          ),
                        )
                      }
                    }}
                  />
                  <ToggleSwitch
                    checked={agentStore.enabledHooks[h.id]}
                    onChange={() => agentStore.toggleHook(h.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
)

const App = observer(() => {
  const { t } = useTranslation()
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const agentStore = store.selectedAgentStore

  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    clearTimeout(toastTimer.current)
    setToastMsg(msg)
    setToastType(type)
    setToastOpen(false)
    requestAnimationFrame(() => {
      setToastOpen(true)
      toastTimer.current = setTimeout(() => setToastOpen(false), 3000)
    })
  }, [])

  const previewSound = useCallback((url: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const audio = new Audio(url)
    audio.play().catch(console.error)
  }, [])

  const handleApply = async () => {
    await agentStore.applyConfig()
    if (contain(agentStore.message, '✓')) {
      showToast(t('applySuccess'), 'success')
    } else {
      showToast(t('applyFailed'), 'error')
    }
  }

  const handleRemove = async () => {
    await agentStore.removeConfig()
    if (contain(agentStore.message, '✓')) {
      showToast(t('removeSuccess'), 'success')
    } else {
      showToast(t('removeFailed'), 'error')
    }
  }

  return (
    <Toast.Provider swipeDirection="right" duration={Infinity}>
      <div
        className={className(
          'h-screen flex flex-col p-5 overflow-auto',
          tw.background.primary,
        )}
      >
        <div className="mx-auto max-w-xl w-full flex flex-col gap-5 animate-fade-in">
          <div
            className={className(
              'flex items-center gap-2.5 px-5 py-2.5 rounded-md',
              tw.border.card,
              tw.background.secondary,
            )}
          >
            <Select
              value={store.selectedAgentId}
              onChange={(e) => store.setSelectedAgent(e.target.value)}
            >
              {store.visibleAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </Select>
            <div className="flex-1" />
            <button
              className={className(
                'flex items-center justify-center w-8 h-8 rounded',
                'transition-all duration-200',
                agentStore.isConfigured
                  ? [
                      'cursor-pointer',
                      tw.text.icon,
                      tw.accent.hoverText,
                      tw.accent.hoverBg,
                      'active:scale-90',
                    ]
                  : 'invisible',
              )}
              disabled={agentStore.saving || !agentStore.isConfigured}
              onClick={handleRemove}
            >
              <RotateCcw size={14} />
            </button>
            <button
              className={className(
                'min-w-20 px-3.5 py-1.5 rounded text-xs font-semibold',
                'transition-all duration-200',
                agentStore.canApply
                  ? tw.button.applyEnabled
                  : tw.button.applyDisabled,
              )}
              disabled={!agentStore.canApply || agentStore.saving}
              onClick={handleApply}
            >
              {agentStore.saving ? t('saving') : t('apply')}
            </button>
          </div>

          <AgentSection previewSound={previewSound} />
        </div>
      </div>

      <Toast.Root
        className={className(
          'toast-root px-4 py-3 rounded-md shadow-lg',
          toastType === 'success' ? tw.toast.success : tw.toast.error,
        )}
        open={toastOpen}
        onOpenChange={setToastOpen}
      >
        <Toast.Description className="text-sm font-medium">
          {toastMsg}
        </Toast.Description>
      </Toast.Root>

      <Toast.Viewport className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80 outline-none" />
    </Toast.Provider>
  )
})

export default App
