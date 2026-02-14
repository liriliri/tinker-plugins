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

export const emojisByCategory = {
  笑脸和情感: smileys_emotion as EmojiData[],
  other: other as EmojiData[],
  人类和身体: people_body as EmojiData[],
  动物和自然: animals_nature as EmojiData[],
  食物和饮料: food_drink as EmojiData[],
  旅行和地点: travel_places as EmojiData[],
  活动: activities as EmojiData[],
  物品: objects as EmojiData[],
  符号: symbols as EmojiData[],
  旗帜: flags as EmojiData[],
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
