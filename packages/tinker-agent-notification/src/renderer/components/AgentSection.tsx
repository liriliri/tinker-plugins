import className from 'licia/className'
import fileUrl from 'licia/fileUrl'
import map from 'licia/map'
import splitPath from 'licia/splitPath'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AudioLines, Bell, FolderOpen } from 'lucide-react'
import store, { soundPackIds } from '../store'
import { tw } from '../theme'
import IconButton from './IconButton'
import PreviewButton from './PreviewButton'
import SectionHeader from './SectionHeader'
import Select from './Select'
import ToggleSwitch from './ToggleSwitch'

interface AgentSectionProps {
  previewSound: (url: string) => void
}

const AgentSection = observer(({ previewSound }: AgentSectionProps) => {
  const { t } = useTranslation()
  const agentStore = store.selectedAgentStore
  const isCustom = agentStore.selectedPack === 'custom'

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
          {map(soundPackIds, (id) => (
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
          {map(agentStore.enabledHookTypes, (h) => {
            const soundPath = agentStore.getSoundAbsolutePath(h.id)
            return (
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
                  {isCustom && (
                    <span
                      className={className(
                        'text-xs truncate font-mono',
                        tw.text.muted,
                      )}
                    >
                      {soundPath ? splitPath(soundPath).name : ''}
                    </span>
                  )}
                </div>
                {isCustom && (
                  <IconButton
                    onClick={() => agentStore.selectCustomSound(h.id)}
                  >
                    <FolderOpen size={13} />
                  </IconButton>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <PreviewButton
                    onClick={() => {
                      if (soundPath) previewSound(fileUrl(soundPath))
                    }}
                  />
                  <ToggleSwitch
                    checked={agentStore.enabledHooks[h.id]}
                    onChange={() => agentStore.toggleHook(h.id)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default AgentSection
