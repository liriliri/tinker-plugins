import { useEffect, useState, type PropsWithChildren } from 'react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { InstanceIdContext } from './useSortable'
import type { SourceId } from '../../../common/types'

interface DndContextProps {
  onDrop: (fromId: SourceId, toId: SourceId) => void
}

let idCounter = 0

export function DndContext({
  children,
  onDrop,
}: PropsWithChildren<DndContextProps>) {
  const [instanceId] = useState(() => `dnd-${idCounter++}`)

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor({ source }) {
          return source.data.instanceId === instanceId
        },
        onDrop({ location, source }) {
          const target = location.current.dropTargets[0]
          if (!target?.data || !source?.data) return
          const fromId = source.data.id as SourceId
          const toId = target.data.id as SourceId
          if (fromId !== toId) {
            onDrop(fromId, toId)
          }
        },
      }),
    )
  }, [instanceId, onDrop])

  return (
    <InstanceIdContext.Provider value={instanceId}>
      {children}
    </InstanceIdContext.Provider>
  )
}
