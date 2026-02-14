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

// Category name mapping from Chinese to English keys
export const categoryKeyMap: Record<string, string> = {
  笑脸和情感: 'smileysEmotion',
  other: 'other',
  人类和身体: 'peopleBody',
  动物和自然: 'animalsNature',
  食物和饮料: 'foodDrink',
  旅行和地点: 'travelPlaces',
  活动: 'activities',
  物品: 'objects',
  符号: 'symbols',
  旗帜: 'flags',
}

export const allEmojis: EmojiData[] = [
  ...smileys_emotion,
  ...other,
  ...people_body,
  ...animals_nature,
  ...food_drink,
  ...travel_places,
  ...activities,
  ...objects,
  ...symbols,
  ...flags,
]

export default allEmojis
