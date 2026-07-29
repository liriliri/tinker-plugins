import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import lowerCase from 'licia/lowerCase'
import startWith from 'licia/startWith'
import store from './store'
import { tw } from './theme'
import Toolbar from './components/Toolbar'
import ToolsLeft from './components/ToolsLeft'
import WorkArea from './components/WorkArea'
import Palette from './components/Palette'
import SourceDialog from './components/SourceDialog'
import type { ToolMode } from './types'

const MODE_KEYS: Record<string, ToolMode> = {
  v: 'select',
  q: 'fhpath',
  l: 'line',
  r: 'rect',
  o: 'ellipse',
  p: 'path',
  t: 'text',
  z: 'zoom',
  h: 'pan',
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  )
}

const App = observer(() => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || store.sourceOpen) return

      const mod = e.metaKey || e.ctrlKey
      const key = lowerCase(e.key)

      if (e.code === 'Space' && !mod) {
        e.preventDefault()
        store.startSpacePan()
        return
      }
      if (mod && key === 'n') {
        e.preventDefault()
        store.newDocument()
        return
      }
      if (mod && key === 'o') {
        e.preventDefault()
        void store.openSvg()
        return
      }
      if (mod && key === 's') {
        e.preventDefault()
        void store.saveSvg()
        return
      }
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        store.undo()
        return
      }
      if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault()
        store.redo()
        return
      }
      if (mod && key === 'x') {
        e.preventDefault()
        store.cut()
        return
      }
      if (mod && key === 'c') {
        e.preventDefault()
        store.copy()
        return
      }
      if (mod && key === 'v') {
        e.preventDefault()
        store.paste()
        return
      }
      if (mod && key === 'd') {
        e.preventDefault()
        store.duplicate()
        return
      }
      if (mod && key === 'a') {
        e.preventDefault()
        store.selectAll()
        return
      }
      if (mod && key === 'g' && !e.shiftKey) {
        e.preventDefault()
        store.group()
        return
      }
      if (mod && key === 'g' && e.shiftKey) {
        e.preventDefault()
        store.ungroup()
        return
      }
      if (key === 'backspace' || key === 'delete') {
        e.preventDefault()
        store.deleteSelected()
        return
      }
      if (!mod && MODE_KEYS[key]) {
        e.preventDefault()
        store.setMode(MODE_KEYS[key])
        return
      }
      if (startWith(key, 'arrow') && store.hasSelection) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const map: Record<string, [number, number]> = {
          arrowleft: [-step, 0],
          arrowright: [step, 0],
          arrowup: [0, -step],
          arrowdown: [0, step],
        }
        const delta = map[key]
        if (delta) {
          if (mod && e.shiftKey) {
            if (key === 'arrowup') store.moveToTop()
            else if (key === 'arrowdown') store.moveToBottom()
          } else if (mod) {
            if (key === 'arrowup') store.moveUp()
            else if (key === 'arrowdown') store.moveDown()
          } else {
            store.moveSelected(delta[0], delta[1])
          }
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        store.stopSpacePan()
      }
    }

    const onBlur = () => store.stopSpacePan()

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return (
    <div
      id="svg-editor"
      className={className(
        'relative h-full w-full grid grid-cols-[var(--tools-w)_1fr] grid-rows-[var(--toolbar-h)_1fr_var(--palette-h)]',
        "[grid-template-areas:'toolbar_toolbar'_'tools_workarea'_'palette_palette']",
        tw.background.primary,
      )}
    >
      <Toolbar />
      <ToolsLeft />
      <WorkArea />
      <Palette />
      <SourceDialog />
    </div>
  )
})

export default App
