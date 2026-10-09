import { action, makeObservable, observable } from 'mobx'

import type { Game } from './types'

const DEFAULT_TITLE = 'JS13K Games'

function setWindowTitle(title: string) {
  if (typeof tinker !== 'undefined') {
    tinker.setTitle(title)
    return
  }
  document.title = title || DEFAULT_TITLE
}

class Store {
  activeGame: Game | null = null

  constructor() {
    makeObservable(this, {
      activeGame: observable,
      openGame: action,
      closeGame: action,
    })
  }

  openGame(game: Game) {
    this.activeGame = game
    setWindowTitle(game.name)
  }

  closeGame() {
    this.activeGame = null
    setWindowTitle('')
  }
}

const store = new Store()
export default store
