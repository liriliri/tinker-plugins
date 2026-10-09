import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import BaseStore from 'tinker-share/store/Base'
import { slides, slideStyle } from './lib/slides'

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
    makeObservable(this, {
      active: observable,
      index: observable,
      hintVisible: observable,
      total: computed,
      slide: computed,
      slideNameKey: computed,
      stageStyle: computed,
      start: action,
      stop: action,
      next: action,
      prev: action,
      showHint: action,
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
