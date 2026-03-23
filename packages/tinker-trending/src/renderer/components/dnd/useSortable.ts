import { createContext, useContext, useEffect, useState } from 'react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source'

export const InstanceIdContext = createContext<string | null>(null)

interface DraggableState {
  type: 'idle' | 'dragging'
  container?: HTMLElement
}

export function useSortable(id: string) {
  const instanceId = useContext(InstanceIdContext)
  const [state, setState] = useState<DraggableState>({ type: 'idle' })
  const [handleEl, setHandleEl] = useState<HTMLElement | null>(null)
  const [nodeEl, setNodeEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (state.type === 'idle') {
      document.documentElement.classList.remove('cursor-grabbing')
    } else {
      setTimeout(() => {
        document.documentElement.classList.add('cursor-grabbing')
      }, 50)
    }
  }, [state])

  useEffect(() => {
    if (!handleEl || !nodeEl) return
    return combine(
      draggable({
        element: nodeEl,
        dragHandle: handleEl,
        getInitialData: () => ({ id, instanceId }),
        onGenerateDragPreview({ nativeSetDragImage, location }) {
          setCustomNativeDragPreview({
            getOffset: preserveOffsetOnSource({
              element: nodeEl,
              input: location.current.input,
            }),
            render({ container }) {
              container.style.width = `${nodeEl.clientWidth}px`
              container.style.height = `${nodeEl.clientHeight}px`
              setState({ type: 'dragging', container })
            },
            nativeSetDragImage,
          })
        },
        onDrop: () => setState({ type: 'idle' }),
      }),
      dropTargetForElements({
        element: nodeEl,
        getData: () => ({ id }),
        getIsSticky: () => true,
        canDrop: ({ source }) => source.data.instanceId === instanceId,
      }),
    )
  }, [id, instanceId, handleEl, nodeEl])

  return {
    setHandleRef: setHandleEl,
    setNodeRef: setNodeEl,
    isDragging: state.type === 'dragging',
    overlayContainer: state.container,
  }
}
