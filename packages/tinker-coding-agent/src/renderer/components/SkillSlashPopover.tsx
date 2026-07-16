import { useMemo, type FC } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  ComposerPrimitive,
  useAui,
  unstable_useSlashCommandAdapter,
  type Unstable_SlashCommand,
} from '@assistant-ui/react'
import { PuzzleIcon } from 'lucide-react'
import className from 'licia/className'
import map from 'licia/map'
import { tw } from '../theme'
import store from '../store'

export const SkillSlashPopover: FC = observer(function SkillSlashPopover() {
  const { t } = useTranslation()
  const aui = useAui()

  const commands = useMemo<readonly Unstable_SlashCommand[]>(
    () =>
      map(store.skills, (skill) => ({
        id: `skill:${skill.name}`,
        label: skill.name,
        description: skill.description,
        execute: () => {
          aui.composer().setText(`/${skill.name} `)
        },
      })),
    [store.skills, aui],
  )

  const slash = unstable_useSlashCommandAdapter({
    commands,
    removeOnExecute: true,
  })

  return (
    <ComposerPrimitive.Unstable_TriggerPopover
      char="/"
      adapter={slash.adapter}
      className={className(
        'absolute start-0 bottom-full z-50 mb-2 max-h-64 w-72 overflow-y-auto',
        tw.popover.root,
      )}
    >
      <ComposerPrimitive.Unstable_TriggerPopover.Action {...slash.action} />
      <ComposerPrimitive.Unstable_TriggerPopoverItems>
        {(items) => (
          <div className="flex flex-col py-1">
            {items.length === 0 ? (
              <div className={className('px-3 py-2 text-sm', tw.text.muted)}>
                {t('noSkills')}
              </div>
            ) : (
              map(items, (item, index) => (
                <ComposerPrimitive.Unstable_TriggerPopoverItem
                  key={item.id}
                  item={item}
                  index={index}
                  className={className(tw.popover.item, tw.hover.recent)}
                >
                  <PuzzleIcon
                    className={className('size-3.5 shrink-0', tw.text.accent)}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className={className('font-medium', tw.text.primary)}>
                      {item.label}
                    </span>
                    {item.description && (
                      <span className={tw.text.muted}>
                        {' — '}
                        {item.description}
                      </span>
                    )}
                  </span>
                </ComposerPrimitive.Unstable_TriggerPopoverItem>
              ))
            )}
          </div>
        )}
      </ComposerPrimitive.Unstable_TriggerPopoverItems>
    </ComposerPrimitive.Unstable_TriggerPopover>
  )
})
