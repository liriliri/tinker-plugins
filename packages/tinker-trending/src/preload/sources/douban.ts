import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'

interface DoubanMovieItem {
  id: string
  title: string
  card_subtitle: string
}

interface DoubanResponse {
  items: DoubanMovieItem[]
}

export async function fetchDouban(): Promise<NewsItem[]> {
  const data = await httpsGet(
    'https://m.douban.com/rexxar/api/v2/subject/recent_hot/movie',
    { Referer: 'https://movie.douban.com/' },
  )
  const json = JSON.parse(data) as DoubanResponse
  return json.items.map((movie) => ({
    id: movie.id,
    title: movie.title,
    url: `https://movie.douban.com/subject/${movie.id}`,
    extra: {
      info: movie.card_subtitle.split(' / ').slice(0, 3).join(' / '),
      hover: movie.card_subtitle,
    },
  }))
}
