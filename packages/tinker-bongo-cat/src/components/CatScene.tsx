import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import min from 'licia/min'
import store from '../store'
import { tw } from '../theme'
import { assetUrl, HEAD_HIT, SCENE_HEIGHT, SCENE_WIDTH } from '../lib/keymap'
import { drawArmFill, drawArmOutline } from '../lib/rightHand'

const OFFSET = { x: 10, y: -10 }
const MOUSE_SIZE = { w: 104, h: 103 }

interface CatSceneProps {
  fill?: boolean
  /** Drive rAF from the float popup so motion keeps running if the opener is hidden. */
  animWindow?: Window
}

function scenePoint(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * SCENE_WIDTH,
    y: ((clientY - rect.top) / rect.height) * SCENE_HEIGHT,
  }
}

function hitsHead(el: HTMLElement, clientX: number, clientY: number) {
  const { x, y } = scenePoint(el, clientX, clientY)
  return (
    x >= HEAD_HIT.left &&
    x < HEAD_HIT.left + HEAD_HIT.width &&
    y >= HEAD_HIT.top &&
    y < HEAD_HIT.top + HEAD_HIT.height
  )
}

function CatScene({ fill = false, animWindow }: CatSceneProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const patternRef = useRef<CanvasPattern | null>(null)
  const [scale, setScale] = useState(1)
  const [overHead, setOverHead] = useState(false)
  // Keep React layers (mouse/hand) ticking off the visible popup clock.
  const [, setAnimTick] = useState(0)

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const update = () => {
      if (fill) {
        setScale(shell.clientWidth / SCENE_WIDTH)
        return
      }
      const fit = min(
        shell.clientWidth / SCENE_WIDTH,
        shell.clientHeight / SCENE_HEIGHT,
      )
      setScale(min(store.floatScale, fit))
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(shell)
    return () => ro.disconnect()
  }, [fill, store.floatScale])

  useEffect(() => {
    const img = new Image()
    img.src = assetUrl('arm.png')
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      patternRef.current = ctx.createPattern(img, 'repeat')
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Same as tinker-agent-pet: opener rAF throttles hard while the plugin page
    // is hidden — drive the loop from the visible popup when floating.
    const anim = animWindow ?? window
    let frame = 0
    const paint = () => {
      if (animWindow?.closed) return
      const { polygon } = store.rightHand
      ctx.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT)
      ctx.save()
      drawArmFill(ctx, polygon, patternRef.current)
      drawArmOutline(ctx, polygon, tw.arm.stroke)
      ctx.restore()
      if (animWindow) setAnimTick((n) => (n + 1) % 1_000_000)
      frame = anim.requestAnimationFrame(paint)
    }
    frame = anim.requestAnimationFrame(paint)
    return () => anim.cancelAnimationFrame(frame)
  }, [animWindow])

  const { mouseX, mouseY } = store.rightHand
  const deviceStyle = {
    left: mouseX + -38 + OFFSET.x,
    top: mouseY + -50 + OFFSET.y,
    width: MOUSE_SIZE.w,
    height: MOUSE_SIZE.h,
  }

  const handSrc =
    store.handIndex >= 0
      ? assetUrl(`hand/${store.handIndex}.png`)
      : assetUrl('up.png')

  const sceneBox = {
    width: fill ? '100%' : SCENE_WIDTH * scale,
    height: fill ? '100%' : SCENE_HEIGHT * scale,
  }

  const layerStyle = {
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    transform: `scale(${scale})`,
  }

  const mouseOverlays: Array<[boolean, string]> = [
    [store.mouseLeft, 'mouse_left.png'],
    [store.mouseRight, 'mouse_right.png'],
    [store.mouseSide, 'mouse_side.png'],
  ]

  return (
    <div
      ref={shellRef}
      className={className(
        'w-full h-full min-h-0',
        fill ? '' : 'flex items-center justify-center',
      )}
    >
      <div
        ref={wrapRef}
        className={className(
          'relative overflow-hidden select-none',
          fill ? 'size-full' : '',
          overHead ? 'cursor-pointer' : 'cursor-default',
        )}
        style={sceneBox}
        onPointerMove={(e) => {
          const el = wrapRef.current
          if (!el) return
          setOverHead(hitsHead(el, e.clientX, e.clientY))
        }}
        onPointerLeave={() => setOverHead(false)}
        onPointerDown={(e) => {
          const el = wrapRef.current
          if (!el || e.button !== 0) return
          if (hitsHead(el, e.clientX, e.clientY)) e.stopPropagation()
        }}
        onClick={(e) => {
          const el = wrapRef.current
          if (!el) return
          if (hitsHead(el, e.clientX, e.clientY)) store.playRandomFace()
        }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 origin-top-left"
          style={layerStyle}
        >
          <img
            src={assetUrl('mousebg.png')}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full"
          />

          <img
            src={assetUrl('mouse.png')}
            alt=""
            draggable={false}
            className="absolute"
            style={deviceStyle}
          />
          {mouseOverlays.map(([on, file]) =>
            on ? (
              <img
                key={file}
                src={assetUrl(file)}
                alt=""
                draggable={false}
                className="absolute"
                style={deviceStyle}
              />
            ) : null,
          )}

          <canvas
            ref={canvasRef}
            width={SCENE_WIDTH}
            height={SCENE_HEIGHT}
            className="absolute inset-0"
          />

          {store.activeKeyboardIndexes.map((idx) => (
            <img
              key={idx}
              src={assetUrl(`keyboard/${idx}.png`)}
              alt=""
              draggable={false}
              className="absolute inset-0 size-full"
            />
          ))}

          <img
            src={handSrc}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full"
          />

          {store.faceIndexActive >= 0 ? (
            <img
              src={assetUrl(`face/${store.faceIndexActive}.png`)}
              alt=""
              draggable={false}
              className="absolute inset-0 size-full"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default observer(CatScene)
