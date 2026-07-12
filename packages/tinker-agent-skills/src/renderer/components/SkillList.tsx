import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Settings2, Sparkles, Trash2 } from 'lucide-react'
import className from 'licia/className'
import filter from 'licia/filter'
import type { SkillAgentLink, SkillInfo } from '../../common/types'
import { tw } from '../theme'
import store from '../store'
import AppScrollArea from './AppScrollArea'

interface SkillCardProps {
  skill: SkillInfo
}

interface AgentPatchProps {
  agents: SkillAgentLink[]
}

function AgentPatch({ agents }: AgentPatchProps) {
  const { t } = useTranslation()
  const enabledAgents = filter(agents, (agent) => agent.enabled)

  if (enabledAgents.length === 0) {
    return (
      <span className={className('text-[12px]', tw.text.muted)}>
        {t('noAgentsLinked')}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {enabledAgents.map((agent) => (
        <span
          key={agent.id}
          title={agent.name}
          className={className(
            'inline-flex items-center h-[22px] px-2 text-[11px] font-medium rounded-md',
            tw.tag.linked,
          )}
        >
          {agent.name}
        </span>
      ))}
    </div>
  )
}

const SkillCard = observer(function SkillCard({ skill }: SkillCardProps) {
  const { t } = useTranslation()
  const linked = skill.agents.some((agent) => agent.enabled)
  const deleting = store.deletingPath === skill.path

  function openInFolder(e?: React.MouseEvent) {
    e?.stopPropagation()
    tinker.showItemInPath(skill.path)
  }

  function openConfig(e: React.MouseEvent) {
    e.stopPropagation()
    store.openConfig(skill)
  }

  function removeSkill(e?: React.MouseEvent) {
    e?.stopPropagation()
    store.requestDelete(skill)
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('configure'),
        click: () => store.openConfig(skill),
      },
      {
        label: t('showInFolder'),
        click: () => openInFolder(),
      },
      { type: 'separator' },
      {
        label: t('delete'),
        click: () => removeSkill(),
      },
    ])
  }

  return (
    <div
      className={className(
        'group relative flex flex-col rounded-lg border overflow-hidden transition-all duration-200 cursor-default',
        linked ? tw.background.cardLinked : tw.background.card,
        tw.border.card,
        tw.border.cardHover,
        deleting && 'opacity-50 pointer-events-none',
      )}
      onContextMenu={handleContextMenu}
      onDoubleClick={() => openInFolder()}
    >
      <div className="flex flex-col gap-1 px-3.5 pt-3 pb-2.5">
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            {skill.name.toLowerCase() !== skill.folderName.toLowerCase() ? (
              <div
                className={className(
                  'text-[10px] font-medium tracking-[0.08em] uppercase mb-1 truncate font-mono',
                  tw.text.folder,
                )}
                title={skill.folderName}
              >
                {skill.folderName}
              </div>
            ) : null}
            <h3
              className={className(
                'text-[15px] font-semibold leading-snug tracking-tight truncate m-0',
                tw.text.primary,
              )}
              title={skill.name}
            >
              {skill.name}
            </h3>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 -mr-1 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              title={t('configure')}
              aria-label={t('configure')}
              onClick={openConfig}
              className={className(
                'inline-flex items-center justify-center w-7 h-7 rounded-md border-none bg-transparent cursor-pointer transition-colors',
                tw.button.icon.default,
                tw.button.icon.hover,
              )}
            >
              <Settings2 className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <button
              type="button"
              title={t('showInFolder')}
              aria-label={t('showInFolder')}
              onClick={openInFolder}
              className={className(
                'inline-flex items-center justify-center w-7 h-7 rounded-md border-none bg-transparent cursor-pointer transition-colors',
                tw.button.icon.default,
                tw.button.icon.hover,
              )}
            >
              <FolderOpen className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <button
              type="button"
              title={t('delete')}
              aria-label={t('delete')}
              disabled={deleting}
              onClick={removeSkill}
              className={className(
                'inline-flex items-center justify-center w-7 h-7 rounded-md border-none bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                tw.button.icon.danger,
              )}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <p
          className={className(
            'text-[13px] leading-relaxed line-clamp-2 m-0',
            tw.text.secondary,
          )}
          title={skill.description || undefined}
        >
          {skill.description || t('noDescription')}
        </p>
      </div>

      <div
        className={className(
          'mt-auto px-3.5 py-2 border-t flex flex-wrap gap-1.5 items-center min-h-[36px]',
          tw.border.divider,
        )}
      >
        <AgentPatch agents={skill.agents} />
      </div>
    </div>
  )
})

interface EmptyStateProps {
  title: string
  hint?: string
}

function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        className={className(
          'flex items-center justify-center w-11 h-11 rounded-2xl',
          tw.background.emptyIcon,
        )}
      >
        <Sparkles
          className={className('w-5 h-5', tw.accent.icon)}
          strokeWidth={1.75}
        />
      </div>
      <div className="flex flex-col gap-1 max-w-xs">
        <p className={className('text-sm font-medium m-0', tw.text.primary)}>
          {title}
        </p>
        {hint ? (
          <p className={className('text-[12px] leading-relaxed m-0', tw.empty)}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}

const SkillList = observer(() => {
  const { t } = useTranslation()
  const skills = store.filteredSkills

  if (store.isLoading && store.skills.length === 0) {
    return <EmptyState title={t('loading')} />
  }

  if (store.error && store.skills.length === 0) {
    return <EmptyState title={store.error} />
  }

  if (skills.length === 0) {
    return (
      <EmptyState
        title={store.query ? t('noMatch') : t('noSkills')}
        hint={store.query ? t('noMatchHint') : t('noSkillsHint')}
      />
    )
  }

  return (
    <AppScrollArea viewportClassName="p-4">
      <div className="grid gap-3 grid-cols-1 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-3 min-[1400px]:grid-cols-4">
        {skills.map((skill) => (
          <SkillCard key={skill.path} skill={skill} />
        ))}
      </div>
    </AppScrollArea>
  )
})

export default SkillList
