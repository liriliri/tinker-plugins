import { makeAutoObservable } from 'mobx'
import { isOnline } from 'tinker-share/lib/util'

import type { Game } from './types'

const DEFAULT_TITLE = 'JS13K Games'

function setWindowTitle(title: string) {
  if (!isOnline()) {
    tinker.setTitle(title)
    return
  }
  document.title = title || DEFAULT_TITLE
}

class Store {
  activeGame: Game | null = null

  constructor() {
    makeAutoObservable(this)
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
