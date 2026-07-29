import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import trim from 'licia/trim'
import store from '../store'
import { updateRulers } from '../lib/rulers'

const WorkArea = observer(() => {
  const { t } = useTranslation()
  const workareaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLInputElement>(null)
  const rulerXCanvasRef = useRef<HTMLCanvasElement>(null)
  const rulerYCanvasRef = useRef<HTMLCanvasElement>(null)
  const rulerXRef = useRef<HTMLDivElement>(null)
  const rulerYRef = useRef<HTMLDivElement>(null)
  const [shiftHeld, setShiftHeld] = useState(false)

  function showCanvasContextMenu(e: MouseEvent) {
    e.preventDefault()
    const hasSel = store.hasSelection
    const canGroup = store.isMulti
    const canUngroup = store.selection.panel === 'g'
    const relativeTo = store.isMulti ? 'selected' : 'page'
    const { clientX, clientY } = e

    const alignSubmenu = [
      {
        label: t('alignLeft'),
        click: () => store.align('l', relativeTo),
      },
      {
        label: t('alignCenter'),
        click: () => store.align('c', relativeTo),
      },
      {
        label: t('alignRight'),
        click: () => store.align('r', relativeTo),
      },
      { type: 'separator' as const },
      {
        label: t('alignTop'),
        click: () => store.align('t', relativeTo),
      },
      {
        label: t('alignMiddle'),
        click: () => store.align('m', relativeTo),
      },
      {
        label: t('alignBottom'),
        click: () => store.align('b', relativeTo),
      },
    ]

    tinker.showContextMenu(clientX, clientY, [
      {
        label: t('cut'),
        enabled: hasSel,
        click: () => store.cut(),
      },
      {
        label: t('copy'),
        enabled: hasSel,
        click: () => store.copy(),
      },
      {
        label: t('paste'),
        click: () => store.paste(clientX, clientY),
      },
      {
        label: t('duplicate'),
        enabled: hasSel,
        click: () => store.duplicate(),
      },
      {
        label: t('delete'),
        enabled: hasSel,
        click: () => store.deleteSelected(),
      },
      { type: 'separator' },
      {
        label: t('bringFront'),
        enabled: hasSel,
        click: () => store.moveToTop(),
      },
      {
        label: t('bringForward'),
        enabled: hasSel,
        click: () => store.moveUp(),
      },
      {
        label: t('sendBackward'),
        enabled: hasSel,
        click: () => store.moveDown(),
      },
      {
        label: t('sendBack'),
        enabled: hasSel,
        click: () => store.moveToBottom(),
      },
      { type: 'separator' },
      {
        label: t('align'),
        enabled: hasSel,
        submenu: alignSubmenu,
      },
      { type: 'separator' },
      {
        label: t('group'),
        enabled: canGroup,
        click: () => store.group(),
      },
      {
        label: t('ungroup'),
        enabled: canUngroup,
        click: () => store.ungroup(),
      },
    ])
  }

  useEffect(() => {
    if (!workareaRef.current || !canvasRef.current || !textRef.current) return
    store.init(canvasRef.current, workareaRef.current, textRef.current)
    return () => store.dispose()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(false)
    }
    const clear = () => setShiftHeld(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clear)
    }
  }, [])

  useEffect(() => {
    const workarea = workareaRef.current
    if (!workarea) return

    const onScroll = () => {
      if (rulerXRef.current) rulerXRef.current.scrollLeft = workarea.scrollLeft
      if (rulerYRef.current) rulerYRef.current.scrollTop = workarea.scrollTop
    }

    workarea.addEventListener('scroll', onScroll)
    return () => workarea.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!store.ready) return
    const canvas = store.canvas
    const svgCanvasEl = canvasRef.current
    const rulerXCanvas = rulerXCanvasRef.current
    const rulerYCanvas = rulerYCanvasRef.current
    if (!canvas || !svgCanvasEl || !rulerXCanvas || !rulerYCanvas) return

    const tickColor = trim(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--ink-muted',
      ),
    )

    updateRulers({
      svgCanvasEl,
      contentEl: canvas.getSvgContent(),
      zoom: canvas.getZoom(),
      rulerXCanvas,
      rulerYCanvas,
      tickColor,
    })

    // updateRulers clones canvases; keep refs pointing at live nodes
    const xEl = rulerXRef.current?.querySelector('canvas')
    const yEl = rulerYRef.current?.querySelector('canvas')
    if (xEl) rulerXCanvasRef.current = xEl
    if (yEl) rulerYCanvasRef.current = yEl

    if (rulerXRef.current && workareaRef.current) {
      rulerXRef.current.scrollLeft = workareaRef.current.scrollLeft
    }
    if (rulerYRef.current && workareaRef.current) {
      rulerYRef.current.scrollTop = workareaRef.current.scrollTop
    }
  }, [
    store.ready,
    store.rulersVersion,
    store.canvasSize.width,
    store.canvasSize.height,
  ])

  return (
    <div id="workspace" className="with-rulers">
      <div id="ruler_corner" />
      <div id="ruler_x" ref={rulerXRef}>
        <div className="ruler_canvas_wrap">
          <canvas ref={rulerXCanvasRef} />
        </div>
      </div>
      <div id="ruler_y" ref={rulerYRef}>
        <div className="ruler_canvas_wrap">
          <canvas ref={rulerYCanvasRef} />
        </div>
      </div>
      <div
        id="workarea"
        ref={workareaRef}
        className={className(store.mode, {
          out: store.mode === 'zoom' && shiftHeld,
          pan: store.mode === 'pan' || store.spacePan,
          dragging: store.isPanning,
        })}
        onContextMenu={showCanvasContextMenu}
      >
        <div id="svgcanvas" ref={canvasRef} />
      </div>
      {/* Outside #workarea so focus() does not scroll the canvas */}
      <input
        id="text"
        ref={textRef}
        type="text"
        autoComplete="off"
        onFocus={(e) => {
          const el = store.canvas?.getSelectedElements()?.[0]
          if (el?.tagName === 'text') {
            e.currentTarget.value = el.textContent || ''
          }
        }}
        onInput={(e) => {
          store.setTextContent((e.target as HTMLInputElement).value)
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape' || e.key === 'Enter') {
            e.preventDefault()
            store.finishTextEdit()
          }
        }}
      />
    </div>
  )
})

export default WorkArea
