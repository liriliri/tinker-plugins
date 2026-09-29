import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import BaseStore from 'tinker-share/store/Base'
import { slides, slideStyle } from './lib/slides'
import { colors } from './theme'

class Store extends BaseStore {
  active = false
  index = 0
  hintVisible = false

  hideHint = debounce(() => {
    runInAction(() => {
      this.hintVisible = false
    })
  }, 6000)

  constructor() {
    super()
    makeAutoObservable(this, {
      hideHint: false,
    })
  }

  get total() {
    return slides.length
  }

  get slide() {
    return slides[this.index]
  }

  get slideNameKey() {
    return this.slide.nameKey
  }

  get stageStyle() {
    return slideStyle(this.slide)
  }

  get hintStyle() {
    return { background: colors.hintBg, color: colors.hintFg }
  }

  get hintAccentStyle() {
    return { color: colors.hintAccent }
  }

  get chromeStyle() {
    return {
      background: colors.chrome(this.isDark),
      color: colors.chalk(this.isDark),
    }
  }

  get panelStyle() {
    return {
      background: colors.panel(this.isDark),
      borderColor: colors.line(this.isDark),
    }
  }

  get sidebarStyle() {
    return {
      background: colors.sidebar(this.isDark),
      borderColor: colors.line(this.isDark),
    }
  }

  get raisedStyle() {
    return {
      background: colors.panelRaised(this.isDark),
      borderColor: colors.line(this.isDark),
    }
  }

  get mistStyle() {
    return { color: colors.mist(this.isDark) }
  }

  get chalkStyle() {
    return { color: colors.chalk(this.isDark) }
  }

  get signalBtnStyle() {
    return {
      background: colors.signal(this.isDark),
      color: colors.signalOn(this.isDark),
      outlineColor: colors.signalRing(this.isDark),
    }
  }

  get keycapStyle() {
    return {
      background: colors.keycapBg(this.isDark),
      borderColor: colors.keycapBorder(this.isDark),
      color: colors.chalk(this.isDark),
    }
  }

  get bezelStyle() {
    return {
      background: colors.bezel(this.isDark),
      borderColor: colors.line(this.isDark),
      boxShadow: colors.bezelInset(this.isDark),
    }
  }

  start() {
    this.index = 0
    this.active = true
    this.showHint()
  }

  stop() {
    this.active = false
    this.hintVisible = false
  }

  next() {
    this.index = (this.index + 1) % this.total
    if (this.hintVisible) this.showHint()
  }

  prev() {
    this.index = (this.index - 1 + this.total) % this.total
    if (this.hintVisible) this.showHint()
  }

  showHint() {
    this.hintVisible = true
    this.hideHint()
  }
}

const store = new Store()

export default store
