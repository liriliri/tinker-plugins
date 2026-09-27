import contain from 'licia/contain'
import filter from 'licia/filter'
import lowerCase from 'licia/lowerCase'
import trim from 'licia/trim'
import type { Game } from '../types'

export function filterGames(games: Game[], query: string): Game[] {
  const q = lowerCase(trim(query))
  if (!q) return games
  return filter(
    games,
    (g) =>
      contain(lowerCase(g.name), q) ||
      contain(lowerCase(g.author), q) ||
      contain(lowerCase(g.description), q),
  )
}
