import compact from 'licia/compact'
import contain from 'licia/contain'
import filter from 'licia/filter'
import findIdx from 'licia/findIdx'
import lowerCase from 'licia/lowerCase'
import pluck from 'licia/pluck'
import some from 'licia/some'
import trim from 'licia/trim'
import unique from 'licia/unique'
import type { EmojiData } from '../types'

function matchesQuery(emoji: EmojiData, query: string): boolean {
  return (
    contain(lowerCase(emoji.name), query) ||
    contain(lowerCase(emoji.description.zh), query) ||
    contain(lowerCase(emoji.description.en), query) ||
    some(emoji.keywords.zh, (k) => contain(lowerCase(k), query)) ||
    some(emoji.keywords.en, (k) => contain(lowerCase(k), query))
  )
}

export function buildCategoryList(emojis: EmojiData[]): string[] {
  const categoryKeys = unique(compact(pluck(emojis, 'category')))
  const otherIndex = findIdx(categoryKeys, (cat) => cat === 'other')
  if (otherIndex !== -1) {
    categoryKeys.splice(otherIndex, 1)
    categoryKeys.push('other')
  }
  return categoryKeys
}

export function filterEmojis(
  emojis: EmojiData[],
  category: string,
  searchQuery: string,
): EmojiData[] {
  const result =
    category === 'all' ? emojis : filter(emojis, (e) => e.category === category)

  const query = lowerCase(trim(searchQuery))
  if (!query) {
    return result
  }

  return filter(result, (emoji) => matchesQuery(emoji, query))
}
