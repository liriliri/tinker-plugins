import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import debounce from 'licia/debounce'
import { buttonName } from './lib/util'
import type { MousePoint, WheelDirection } from './types'

class Store {
  isDark = false
  pressed = new Set<number>()
  wheel: WheelDirection = null
  lastButton: string | null = null
  position: MousePoint = { x: 0, y: 0 }
  delta: MousePoint = { x: 0, y: 0 }
  scroll: WheelDirection = null
  doubleClick = false
  activity = 0

  private resetActivity = debounce(() => {
    runInAction(() => {
      this.activity = 0
    })
  }, 140)

  private resetWheel = debounce(() => {
    runInAction(() => {
      this.wheel = null
    })
  }, 160)

  constructor() {
    makeAutoObservable(this)
    this.initTheme()
  }

  get tracking() {
    return this.activity > 0.04
  }

  get padGlow() {
    return clamp(this.activity, 0, 1)
  }

  press(button: number) {
    this.pressed.add(button)
    this.lastButton = buttonName(button)
  }

  release(button: number) {
    this.pressed.delete(button)
  }

  move(x: number, y: number, dx: number, dy: number) {
    this.position = { x, y }
    this.delta = { x: dx, y: dy }
    this.activity = clamp(Math.hypot(dx, dy) / 28, 0, 1)
    this.resetActivity()
  }

  wheelScroll(up: boolean) {
    const dir: WheelDirection = up ? 'up' : 'down'
    this.wheel = dir
    this.scroll = dir
    this.resetWheel()
  }

  markDoubleClick() {
    this.doubleClick = true
  }

  blur() {
    this.pressed.clear()
    this.wheel = null
    this.activity = 0
  }

  private async initTheme() {
    this.isDark = (await tinker.getTheme()) === 'dark'

    tinker.on('changeTheme', async () => {
      this.isDark = (await tinker.getTheme()) === 'dark'
    })
  }
}

const store = new Store()

export default store
