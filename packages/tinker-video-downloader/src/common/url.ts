import trim from 'licia/trim'
import lowerCase from 'licia/lowerCase'
import contain from 'licia/contain'

export function isYouTubeUrl(url: string): boolean {
  const u = lowerCase(trim(url))
  return contain(u, 'youtube.com') || contain(u, 'youtu.be')
}

export function isBilibiliUrl(url: string): boolean {
  const u = lowerCase(trim(url))
  return contain(u, 'bilibili.com') || contain(u, 'b23.tv')
}
