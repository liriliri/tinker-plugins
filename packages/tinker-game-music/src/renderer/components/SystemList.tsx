import { observer } from 'mobx-react-lite'
import { ChevronDown, ChevronRight } from 'lucide-react'
import map from 'licia/map'
import { tw } from '../theme'
import store from '../store'

const SystemList = observer(() => {
  return (
    <aside className={tw.sidebar.wrap}>
      {map(store.systemGroups, ({ group, systems }) => {
        const expanded = store.isSystemGroupExpanded(group)
        return (
          <div key={group}>
            <button
              className={tw.sidebar.group}
              onClick={() => store.toggleSystemGroup(group)}
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
              ) : (
                <ChevronRight className="w-3 h-3 shrink-0 opacity-70" />
              )}
              <span className="flex-1 min-w-0 truncate text-left">{group}</span>
              <span className={tw.sidebar.groupCount}>{systems.length}</span>
            </button>
            {expanded && (
              <div className="px-1.5 pb-1 flex flex-col gap-0.5">
                {map(systems, (sys) => {
                  const active = sys.id === store.systemId
                  return (
                    <button
                      key={sys.id}
                      className={`${tw.sidebar.item} ${active ? tw.sidebar.itemActive : tw.sidebar.itemIdle}`}
                      onClick={() => void store.selectSystem(sys.id)}
                    >
                      {sys.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
})

export default SystemList
