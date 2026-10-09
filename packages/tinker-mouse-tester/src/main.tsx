import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import { MouseVisual } from './components/MouseVisual'
import { MouseInfo } from './components/MouseInfo'
import store from './store'
import { colors, tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { padGlow } = store
  const panelRef = useRef<HTMLDivElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      store.press(e.button)
    }

    const onMouseUp = (e: MouseEvent) => {
      store.release(e.button)
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = panel.getBoundingClientRect()
      store.move(
        Math.round(e.clientX - rect.left),
        Math.round(e.clientY - rect.top),
        e.movementX,
        e.movementY,
      )
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      store.wheelScroll(e.deltaY < 0)
    }

    const onDblClick = () => store.markDoubleClick()
    const onContextMenu = (e: Event) => e.preventDefault()
    const onBlur = () => store.blur()

    panel.addEventListener('mousedown', onMouseDown)
    panel.addEventListener('mouseup', onMouseUp)
    panel.addEventListener('mousemove', onMouseMove)
    panel.addEventListener('wheel', onWheel, { passive: false })
    panel.addEventListener('dblclick', onDblClick)
    panel.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('blur', onBlur)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      panel.removeEventListener('mousedown', onMouseDown)
      panel.removeEventListener('mouseup', onMouseUp)
      panel.removeEventListener('mousemove', onMouseMove)
      panel.removeEventListener('wheel', onWheel)
      panel.removeEventListener('dblclick', onDblClick)
      panel.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div
      ref={panelRef}
      className={className(
        'h-screen overflow-hidden relative select-none',
        tw.appShell,
      )}
      style={{
        background: `radial-gradient(ellipse 80% 60% at 40% 45%, ${colors.void} 0%, ${colors.voidDeep} 100%)`,
        color: colors.chalk,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative h-full flex items-center justify-center gap-12 px-8 flex-wrap">
        <div
          className={className(
            'relative w-[360px] h-[360px] flex items-center justify-center shrink-0 transition-all duration-700',
            entered ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          )}
        >
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: colors.padFill,
              border: `1px solid ${colors.padRingDim}`,
              boxShadow: `inset 0 0 60px ${colors.padDim}, 0 0 ${40 + padGlow * 50}px ${colors.padGlow}`,
              opacity: 0.85 + padGlow * 0.15,
              transition: 'box-shadow 120ms ease, opacity 120ms ease',
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 280,
              height: 280,
              border: `1.5px dashed ${colors.padRing}`,
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 200,
              height: 200,
              border: `1.5px solid ${colors.padRing}`,
            }}
          />
          <MouseVisual />
        </div>

        <div
          className={className(
            'shrink-0 transition-all duration-700 delay-200',
            entered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
          )}
        >
          <MouseInfo />
        </div>
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
