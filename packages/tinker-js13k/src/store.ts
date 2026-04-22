import { makeAutoObservable } from 'mobx'
import type { Game } from './types'

class Store {
  activeGame: Game | null = null

  constructor() {
    makeAutoObservable(this)
  }

  openGame(game: Game) {
    this.activeGame = game
    tinker.setTitle(game.name)
  }

  closeGame() {
    this.activeGame = null
    tinker.setTitle('')
  }
}

const store = new Store()
export default store
