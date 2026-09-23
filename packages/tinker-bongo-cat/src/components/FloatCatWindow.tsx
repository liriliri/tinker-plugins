import { useRef, type PointerEvent } from 'react'
import { observer } from 'mobx-react-lite'
import store from '../store'
import CatScene from './CatScene'

interface FloatCatWindowProps {
  popup: Window
}

const DRAG_THRESHOLD = 4

export default observer(function FloatCatWindow({
  popup,
}: FloatCatWindowProps) {
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    winX: 0,
    winY: 0,
  })

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.screenX,
      startY: e.screenY,
      winX: popup.screenX,
      winY: popup.screenY,
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d.active) return
    const dx = e.screenX - d.startX
    const dy = e.screenY - d.startY
    if (
      !d.moved &&
      (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
    ) {
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (d.moved) {
      popup.moveTo(d.winX + dx, d.winY + dy)
    }
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (d.active && d.moved && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      store.setFloatPosition(popup.screenX, popup.screenY)
    }
    d.active = false
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden cursor-grab active:cursor-grabbing bg-transparent"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <CatScene fill animWindow={popup} />
    </div>
  )
})
