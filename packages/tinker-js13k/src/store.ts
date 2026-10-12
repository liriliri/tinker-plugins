import { makeAutoObservable } from 'mobx'
import { setTitle } from 'tinker-share/lib/util'

import type { Game } from './types'

const DEFAULT_TITLE = 'JS13K Games'

class Store {
  activeGame: Game | null = null

  constructor() {
    makeAutoObservable(this)
  }

  openGame(game: Game) {
    this.activeGame = game
    setTitle(game.name, DEFAULT_TITLE)
  }

  closeGame() {
    this.activeGame = null
    setTitle('', DEFAULT_TITLE)
  }
}

const store = new Store()
export default store
