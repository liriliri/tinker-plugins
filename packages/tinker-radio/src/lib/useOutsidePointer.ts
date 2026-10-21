import { useEffect, useRef, type RefObject } from 'react'

export function useOutsidePointer<T extends HTMLElement>(
  active: boolean,
  ref: RefObject<T | null>,
  onOutside: () => void,
) {
  const onOutsideRef = useRef(onOutside)
  onOutsideRef.current = onOutside

  useEffect(() => {
    if (!active) return
    const onDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node) || ref.current?.contains(target)) return
      onOutsideRef.current()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [active, ref])
}
