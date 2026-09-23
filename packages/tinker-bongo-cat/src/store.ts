import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import clamp from 'licia/clamp'
import contain from 'licia/contain'
import each from 'licia/each'
import filter from 'licia/filter'
import isEqual from 'licia/isEqual'
import isFinite from 'licia/isFinite'
import map from 'licia/map'
import now from 'licia/now'
import randomItem from 'licia/randomItem'
import range from 'licia/range'
import sleep from 'licia/sleep'
import toBool from 'licia/toBool'
import toNum from 'licia/toNum'
import { FACE_COUNT, keyboardIndex, resolveKeyboardId } from './lib/keymap'
import { computeRightHand, cursorToTip } from './lib/rightHand'
import {
  closeFloatWindow,
  openFloatWindow,
  readFloatWindowPosition,
  resizeFloatWindow,
  setFloatWindowClosedListener,
  setFloatWindowPositionListener,
  type FloatPosition,
} from './lib/floatWindow'

const storage = new LocalStore('tinker-bongo-cat')
const STORAGE_FLOAT_SCALE = 'floatScale'
const STORAGE_FLOAT_X = 'floatX'
const STORAGE_FLOAT_Y = 'floatY'
const STORAGE_FLOATING = 'floating'
const AUTO_RELEASE_MS = 3000
const FACE_DURATION_MS = 2000
const DEFAULT_FLOAT_SCALE = 1
const MIN_FLOAT_SCALE = 0.5
const MAX_FLOAT_SCALE = 1.5

function loadFloatPosition(): FloatPosition | null {
  const x = toNum(storage.get(STORAGE_FLOAT_X))
  const y = toNum(storage.get(STORAGE_FLOAT_Y))
  if (!isFinite(x) || !isFinite(y)) return null
  return { x: Math.round(x), y: Math.round(y) }
}

class Store {
  floating = false
  floatScale = DEFAULT_FLOAT_SCALE
  floatPosition: FloatPosition | null = null
  pressedKeys = new Set<string>()
  handIndex = -1
  faceIndexActive = -1
  mouseLeft = false
  mouseRight = false
  mouseSide = false
  cursorX = 0
  cursorY = 0
  screenW = typeof window !== 'undefined' ? window.screen.width || 1920 : 1920
  screenH = typeof window !== 'undefined' ? window.screen.height || 1080 : 1080

  private offs: Array<() => void> = []
  private releaseTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private handPressedAt = new Map<string, number>()
  private faceTimer: ReturnType<typeof setTimeout> | null = null
  private shuttingDown = false

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    const saved = toNum(storage.get(STORAGE_FLOAT_SCALE))
    this.floatScale = isFinite(saved)
      ? clamp(saved, MIN_FLOAT_SCALE, MAX_FLOAT_SCALE)
      : DEFAULT_FLOAT_SCALE
    this.floatPosition = loadFloatPosition()
    void this.startInput()
    setFloatWindowClosedListener(() => {
      // Parent teardown often kills the float before pagehide/dispose.
      // Never persist floating=false here — only toggleFloat does that.
      if (this.shuttingDown) return
      runInAction(() => {
        this.floating = false
      })
    })
    setFloatWindowPositionListener((position) => {
      runInAction(() => {
        this.setFloatPosition(position.x, position.y)
      })
    })
    window.addEventListener('pagehide', this.handlePageHide)
  }

  get tip() {
    return cursorToTip(this.cursorX, this.cursorY, this.screenW, this.screenH)
  }

  get rightHand() {
    return computeRightHand(this.tip.x, this.tip.y)
  }

  get drumming() {
    return (
      this.pressedKeys.size > 0 ||
      this.handIndex >= 0 ||
      this.mouseLeft ||
      this.mouseRight ||
      this.mouseSide
    )
  }

  get activeKeyboardIndexes(): number[] {
    return filter(
      map([...this.pressedKeys], (id) => keyboardIndex(id)),
      (idx) => idx >= 0,
    )
  }

  setFloatScale(scale: number) {
    this.floatScale = clamp(scale, MIN_FLOAT_SCALE, MAX_FLOAT_SCALE)
    storage.set(STORAGE_FLOAT_SCALE, this.floatScale)
    if (this.floating) resizeFloatWindow(this.floatScale)
  }

  setFloatPosition(x: number, y: number) {
    const next = { x: Math.round(x), y: Math.round(y) }
    if (isEqual(this.floatPosition, next)) return
    this.floatPosition = next
    storage.set(STORAGE_FLOAT_X, next.x)
    storage.set(STORAGE_FLOAT_Y, next.y)
  }

  setFloating(value: boolean) {
    this.floating = value
    storage.set(STORAGE_FLOATING, value)
  }

  playRandomFace() {
    const faces =
      this.faceIndexActive < 0
        ? range(FACE_COUNT)
        : filter(range(FACE_COUNT), (i) => i !== this.faceIndexActive)
    this.faceIndexActive = randomItem(faces)
    if (this.faceTimer) clearTimeout(this.faceTimer)
    this.faceTimer = setTimeout(() => {
      runInAction(() => {
        this.faceTimer = null
        this.faceIndexActive = -1
      })
    }, FACE_DURATION_MS)
  }

  openFloat() {
    if (this.floating) return true
    const win = openFloatWindow(this.floatScale, this.floatPosition)
    if (!win) return false
    this.setFloating(true)
    return true
  }

  async restoreFloatIfNeeded() {
    if (!toBool(storage.get(STORAGE_FLOATING))) return
    await sleep(150)
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) await sleep(80 * attempt)
      if (this.openFloat()) return
    }
  }

  toggleFloat() {
    if (this.floating) {
      const pos = readFloatWindowPosition()
      if (pos) this.setFloatPosition(pos.x, pos.y)
      closeFloatWindow()
      this.setFloating(false)
      return
    }
    this.openFloat()
  }

  dispose() {
    this.shuttingDown = true
    window.removeEventListener('pagehide', this.handlePageHide)
    setFloatWindowClosedListener(null)
    setFloatWindowPositionListener(null)
    const pos = readFloatWindowPosition()
    if (pos) this.setFloatPosition(pos.x, pos.y)
    if (this.floating) storage.set(STORAGE_FLOATING, true)
    closeFloatWindow()
    each(this.offs, (off) => off())
    this.offs = []
    each([...this.releaseTimers.values()], clearTimeout)
    this.releaseTimers.clear()
    if (this.faceTimer) {
      clearTimeout(this.faceTimer)
      this.faceTimer = null
    }
  }

  private handlePageHide = () => {
    this.shuttingDown = true
    if (!this.floating) return
    storage.set(STORAGE_FLOATING, true)
    const pos = readFloatWindowPosition()
    if (pos) this.setFloatPosition(pos.x, pos.y)
  }

  private async startInput() {
    try {
      const offKeyDown = await tinker.registerKeyboard('down', (event) => {
        this.onKey(event.key, event.keycode, true)
      })
      const offKeyUp = await tinker.registerKeyboard('up', (event) => {
        this.onKey(event.key, event.keycode, false)
      })
      const offMouseDown = await tinker.registerMouse('down', (event) => {
        this.onMouseButton(event.button, true)
      })
      const offMouseUp = await tinker.registerMouse('up', (event) => {
        this.onMouseButton(event.button, false)
      })
      const offMouseMove = await tinker.registerMouse('move', (event) => {
        runInAction(() => {
          this.cursorX = event.x
          this.cursorY = event.y
          this.screenW = window.screen.width || this.screenW
          this.screenH = window.screen.height || this.screenH
        })
      })
      this.offs.push(
        offKeyDown,
        offKeyUp,
        offMouseDown,
        offMouseUp,
        offMouseMove,
      )
    } catch {
      // Global hooks unavailable — idle cat still shows.
    }
  }

  private onKey(key: string, keycode: number, pressed: boolean) {
    const id = resolveKeyboardId(key, keycode)
    if (!id || keyboardIndex(id) < 0) return

    if (pressed) {
      this.pressKey(id)
      this.scheduleRelease(id, AUTO_RELEASE_MS)
    } else {
      this.releaseKey(id)
    }
  }

  private pressKey(id: string) {
    this.pressedKeys.add(id)
    this.handPressedAt.set(id, now())
    this.recomputeHand()
  }

  private releaseKey(id: string) {
    const timer = this.releaseTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.releaseTimers.delete(id)
    }
    this.pressedKeys.delete(id)
    this.handPressedAt.delete(id)
    this.recomputeHand()
  }

  private scheduleRelease(id: string, wait: number) {
    const prev = this.releaseTimers.get(id)
    if (prev) clearTimeout(prev)
    this.releaseTimers.set(
      id,
      setTimeout(() => {
        this.releaseTimers.delete(id)
        this.releaseKey(id)
      }, wait),
    )
  }

  private recomputeHand() {
    let bestId: string | null = null
    let bestAt = -1
    each([...this.handPressedAt], ([id, at]) => {
      if (at >= bestAt) {
        bestAt = at
        bestId = id
      }
    })
    this.handIndex = bestId ? keyboardIndex(bestId) : -1
  }

  private onMouseButton(button: string, pressed: boolean) {
    if (button === 'left') this.mouseLeft = pressed
    else if (button === 'right') this.mouseRight = pressed
    else if (contain(['back', 'forward'], button)) this.mouseSide = pressed
  }
}

const store = new Store()

export default store
