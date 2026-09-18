import {
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type WheelEvent,
} from 'react'
import defaults from 'licia/defaults'
import each from 'licia/each'
import nextTick from 'licia/nextTick'
import store from '../store'
import { wsUrl } from './auth'
import {
  BUTTONS,
  FrameMetadata,
  insertTextForKey,
  isTouchClient,
  modifiersForEvent,
  paintFrame,
  toScreenPoint,
  toScreenPointFromOffset,
  touchCanvasOffset,
} from './screencast'

export function useScreencast(
  pageId: string,
  onInputText?: (text: string | null) => void,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const metaRef = useRef<FrameMetadata>({})
  const zoomRef = useRef(1)
  const offsetTopRef = useRef(0)
  const activeOffsetTopRef = useRef<number | null>(null)
  const touchModeRef = useRef(isTouchClient())
  const onInputTextRef = useRef(onInputText)
  onInputTextRef.current = onInputText

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return
    const result = paintFrame(canvas, image, metaRef.current)
    if (!result) return
    zoomRef.current = result.zoom
    offsetTopRef.current = result.offsetTop
  }, [])

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
    }
  }, [])

  const sendResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false
    const cssWidth = canvas.clientWidth
    const cssHeight = canvas.clientHeight
    if (cssWidth <= 0 || cssHeight <= 0) return false
    const dpr = window.devicePixelRatio || 1
    send({
      type: 'resize',
      width: Math.floor(cssWidth * dpr),
      height: Math.floor(cssHeight * dpr),
    })
    return true
  }, [send])

  const sendMouse = useCallback(
    (
      eventType: string,
      point: { x: number; y: number },
      options: {
        button?: string
        buttons?: number
        clickCount?: number
        modifiers?: number
        deltaX?: number
        deltaY?: number
      } = {},
    ) => {
      send(
        defaults(
          {
            type: 'mouse',
            eventType,
            x: point.x,
            y: point.y,
            button: options.button,
            buttons: options.buttons,
            clickCount: options.clickCount,
            modifiers: options.modifiers,
            deltaX: options.deltaX,
            deltaY: options.deltaY,
          },
          {
            button: 'none',
            buttons: 0,
            clickCount: 0,
            modifiers: 0,
          },
        ),
      )
    },
    [send],
  )

  useEffect(() => {
    if (!pageId) return
    store.resetScreencast()

    const ws = new WebSocket(
      wsUrl(`/ws/${encodeURIComponent(pageId)}`, store.credentials),
    )
    wsRef.current = ws

    const tryStartScreencast = () => {
      if (sendResize()) {
        paint()
        return true
      }
      return false
    }

    ws.onopen = () => {
      store.setStatusKey('connected')
      store.setScreencastErrorKey('')
      if (touchModeRef.current) {
        send({ type: 'touchMode', enabled: true })
      }
      // Canvas often still has 0 size on open; retry until layout settles.
      if (!tryStartScreencast()) {
        let attempts = 0
        const tick = () => {
          attempts += 1
          if (tryStartScreencast() || attempts >= 30) return
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
      nextTick(() => canvasRef.current?.focus())
    }

    ws.onmessage = (event) => {
      let msg: {
        type?: string
        data?: string
        metadata?: FrameMetadata
        message?: string
        visible?: boolean
        url?: string
        text?: string | null
      }
      try {
        msg = JSON.parse(String(event.data))
      } catch {
        return
      }
      if (msg.type === 'page') {
        if (msg.url) store.setPageUrl(msg.url)
        return
      }
      if (msg.type === 'frame' && msg.data) {
        metaRef.current = msg.metadata || {}
        const image = new Image()
        image.onload = () => {
          imageRef.current = image
          paint()
        }
        image.src = `data:image/jpeg;base64,${msg.data}`
        return
      }
      if (msg.type === 'visibility') {
        store.setScreencastActive(!!msg.visible)
        return
      }
      if (msg.type === 'inputText') {
        onInputTextRef.current?.(msg.text ?? null)
        return
      }
      if (msg.type === 'error') {
        if (msg.message) store.setScreencastErrorRaw(msg.message)
        else store.setScreencastErrorKey('unknownError')
        return
      }
      if (msg.type === 'closed') {
        location.replace('/')
        return
      }
    }

    ws.onclose = () => store.setStatusKey('disconnected')
    ws.onerror = () => store.setScreencastErrorKey('wsFailed')

    const onResize = () => {
      paint()
      sendResize()
    }
    window.addEventListener('resize', onResize)

    let observer: ResizeObserver | null = null
    const setupObserver = () => {
      const canvas = canvasRef.current
      if (!canvas || observer || typeof ResizeObserver === 'undefined') return
      let lastW = 0
      let lastH = 0
      observer = new ResizeObserver(() => {
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        if (w === lastW && h === lastH) return
        lastW = w
        lastH = h
        if (w > 0 && h > 0) {
          paint()
          sendResize()
        }
      })
      observer.observe(canvas)
      if (canvas.parentElement) observer.observe(canvas.parentElement)
    }
    setupObserver()
    const rafId = requestAnimationFrame(setupObserver)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
      observer?.disconnect()
      ws.close()
      wsRef.current = null
    }
  }, [pageId, paint, send, sendResize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !touchModeRef.current) return

    const pointFromTouch = (touch: Touch) => {
      const { offsetX, offsetY } = touchCanvasOffset(touch, canvas)
      return toScreenPointFromOffset(
        offsetX,
        offsetY,
        canvas,
        zoomRef.current || 1,
        activeOffsetTopRef.current ?? offsetTopRef.current,
      )
    }

    const onTouchStart = (event: TouchEvent) => {
      event.preventDefault()
      if (!store.screencastActive) return
      const touch = event.changedTouches[0]
      if (!touch) return
      activeOffsetTopRef.current = offsetTopRef.current
      canvas.focus()
      sendMouse('mousedown', pointFromTouch(touch), {
        button: 'left',
        buttons: 1,
        clickCount: 1,
      })
    }

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      if (!store.screencastActive) return
      const touch = event.changedTouches[0]
      if (!touch) return
      if (activeOffsetTopRef.current === null) {
        activeOffsetTopRef.current = offsetTopRef.current
      }
      sendMouse('mousemove', pointFromTouch(touch), {
        button: 'left',
        buttons: 1,
        clickCount: 0,
      })
    }

    const onTouchEnd = (event: TouchEvent) => {
      event.preventDefault()
      if (!store.screencastActive) return
      const touch = event.changedTouches[0]
      if (!touch) return
      sendMouse('mouseup', pointFromTouch(touch), {
        button: 'left',
        buttons: 0,
        clickCount: 1,
      })
      activeOffsetTopRef.current = null
    }

    const touchEvents = [
      'touchstart',
      'touchmove',
      'touchend',
      'touchcancel',
    ] as const
    const handlers = {
      touchstart: onTouchStart,
      touchmove: onTouchMove,
      touchend: onTouchEnd,
      touchcancel: onTouchEnd,
    }
    each(touchEvents, (type) => {
      canvas.addEventListener(type, handlers[type], { passive: false })
    })
    return () => {
      each(touchEvents, (type) => {
        canvas.removeEventListener(type, handlers[type])
      })
    }
  }, [sendMouse])

  const pasteText = useCallback(
    (value: string) => {
      if (!value) return
      send({ type: 'insertText', text: value })
    },
    [send],
  )

  const pullFocusedInput = useCallback(() => {
    send({ type: 'getInputText' })
  }, [send])

  const pushFocusedInput = useCallback(
    (value: string) => {
      send({ type: 'setInputText', text: value })
    },
    [send],
  )

  const activatePage = useCallback(() => {
    send({ type: 'activate' })
  }, [send])

  const onMouse = (event: MouseEvent<HTMLCanvasElement>) => {
    const native = event.nativeEvent as unknown as {
      sourceCapabilities?: { firesTouchEvents?: boolean }
    }
    if (native.sourceCapabilities?.firesTouchEvents) return
    event.preventDefault()
    if (!store.screencastActive) return
    const canvas = canvasRef.current
    if (!canvas) return
    if (event.type === 'mousedown') {
      activeOffsetTopRef.current = offsetTopRef.current
      canvas.focus()
    }
    const point = toScreenPoint(
      event.nativeEvent,
      canvas,
      zoomRef.current || 1,
      activeOffsetTopRef.current ?? offsetTopRef.current,
    )
    sendMouse(event.type, point, {
      button: BUTTONS[event.button] || 'none',
      buttons: event.buttons,
      clickCount: event.detail,
      modifiers: modifiersForEvent(event.nativeEvent),
    })
    if (event.type === 'mouseup') activeOffsetTopRef.current = null
  }

  const onWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    if (!store.screencastActive) return
    const canvas = canvasRef.current
    if (!canvas) return
    if (activeOffsetTopRef.current === null) {
      activeOffsetTopRef.current = offsetTopRef.current
    }
    const zoom = zoomRef.current || 1
    const point = toScreenPoint(
      event.nativeEvent,
      canvas,
      zoom,
      activeOffsetTopRef.current ?? offsetTopRef.current,
    )
    sendMouse('wheel', point, {
      button: BUTTONS[event.button] || 'none',
      buttons: event.buttons,
      clickCount: event.detail,
      modifiers: modifiersForEvent(event.nativeEvent),
      deltaX: event.deltaX / zoom,
      deltaY: event.deltaY / zoom,
    })
  }

  const onPaste = (event: ClipboardEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!store.screencastActive) return
    pasteText(event.clipboardData.getData('text/plain'))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    event.stopPropagation()
    if (!store.screencastActive) return
    if (
      (event.metaKey || event.ctrlKey) &&
      !event.altKey &&
      event.key.toLowerCase() === 'v'
    ) {
      return
    }
    event.preventDefault()
    const modifiers = modifiersForEvent(event.nativeEvent)
    const base = {
      type: 'key' as const,
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      modifiers,
      autoRepeat: event.repeat,
      location: event.location,
    }
    send({ ...base, eventType: 'keydown' })
    const text = insertTextForKey(event)
    if (text) send({ ...base, eventType: 'char', text })
  }

  const onKeyUp = (event: KeyboardEvent<HTMLCanvasElement>) => {
    event.stopPropagation()
    if (!store.screencastActive) return
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
      return
    }
    event.preventDefault()
    send({
      type: 'key',
      eventType: 'keyup',
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      modifiers: modifiersForEvent(event.nativeEvent),
      autoRepeat: event.repeat,
      location: event.location,
    })
  }

  return {
    canvasRef,
    pullFocusedInput,
    pushFocusedInput,
    activatePage,
    onMouse,
    onWheel,
    onKeyDown,
    onKeyUp,
    onPaste,
  }
}
