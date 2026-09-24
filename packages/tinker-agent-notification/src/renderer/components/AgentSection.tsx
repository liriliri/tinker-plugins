import className from 'licia/className'
import fileUrl from 'licia/fileUrl'
import splitPath from 'licia/splitPath'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AudioLines, Bell, FolderOpen } from 'lucide-react'
import store, { soundPackIds } from '../store'
import { tw } from '../theme'
import Select from './Select'
import PreviewButton from './PreviewButton'
import SectionHeader from './SectionHeader'
import ToggleSwitch from './ToggleSwitch'

interface AgentSectionProps {
  previewSound: (url: string, e?: React.MouseEvent) => void
}

const AgentSection = observer(({ previewSound }: AgentSectionProps) => {
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
          icon={<AudioLines size={14} />}
          title={t('soundPacks')}
        />
        <Select
          value={agentStore.selectedPack}
          onChange={(e) => agentStore.setSelectedPack(e.target.value)}
          flex
        >
          {soundPackIds.map((id) => (
            <option key={id} value={id}>
              {t(`soundPack_${id}`)}
            </option>
          ))}
          <option value="custom">{t('customSelected')}</option>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader icon={<Bell size={14} />} title={t('events')} />
        <div className="flex flex-col gap-1">
          {agentStore.enabledHookTypes.map((h) => (
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
                      ? splitPath(agentStore.customSoundPaths[h.id]).name
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
                  <FolderOpen size={13} />
                </button>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <PreviewButton
                  onClick={(e) => {
                    e.stopPropagation()
                    if (agentStore.selectedPack === 'custom') {
                      if (agentStore.customSoundPaths[h.id]) {
                        previewSound(fileUrl(agentStore.customSoundPaths[h.id]))
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
})

export default AgentSection
