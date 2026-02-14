// Auto-generated file - do not edit manually
import type { EmojiData } from '../types'

import smileys_emotion from './smileys-emotion.json'
import other from './other.json'
import people_body from './people-body.json'
import animals_nature from './animals-nature.json'
import food_drink from './food-drink.json'
import travel_places from './travel-places.json'
import activities from './activities.json'
import objects from './objects.json'
import symbols from './symbols.json'
import flags from './flags.json'

// Category name mapping from English keys to Chinese display names
export const categoryKeyMap: Record<string, string> = {
  smileysEmotion: '笑脸和情感',
  other: '其他',
  peopleBody: '人类和身体',
  animalsNature: '动物和自然',
  foodDrink: '食物和饮料',
  travelPlaces: '旅行和地点',
  activities: '活动',
  objects: '物品',
  symbols: '符号',
  flags: '旗帜',
}

// 为每个分类的 emoji 添加 category 字段
const addCategory = (emojis: any[], category: string): EmojiData[] =>
  emojis.map((emoji) => ({ ...emoji, category }))

export const allEmojis: EmojiData[] = [
  ...addCategory(smileys_emotion, 'smileysEmotion'),
  ...addCategory(other, 'other'),
  ...addCategory(people_body, 'peopleBody'),
  ...addCategory(animals_nature, 'animalsNature'),
  ...addCategory(food_drink, 'foodDrink'),
  ...addCategory(travel_places, 'travelPlaces'),
  ...addCategory(activities, 'activities'),
  ...addCategory(objects, 'objects'),
  ...addCategory(symbols, 'symbols'),
  ...addCategory(flags, 'flags'),
]

export default allEmojis
