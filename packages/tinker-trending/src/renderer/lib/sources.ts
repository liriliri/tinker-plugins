import type { SourceId } from '../../common/types'
import type { SourceMeta } from '../types'
import hackernewsFavicon from '../assets/hackernews.ico'
import githubFavicon from '../assets/github.ico'
import zhihuFavicon from '../assets/zhihu.ico'
import weiboFavicon from '../assets/weibo.ico'
import bilibiliFavicon from '../assets/bilibili.ico'
import doubanFavicon from '../assets/douban.ico'
import juejinFavicon from '../assets/juejin.ico'
import toutiaoFavicon from '../assets/toutiao.ico'
import sspaiFavicon from '../assets/sspai.ico'
import tiebaFavicon from '../assets/tieba.ico'
import v2exFavicon from '../assets/v2ex.ico'
import steamFavicon from '../assets/steam.ico'

export const SOURCES: SourceMeta[] = [
  {
    id: 'hackernews',
    name: 'Hacker News',
    color: 'orange',
    type: 'hottest',
    home: 'https://news.ycombinator.com',
    favicon: hackernewsFavicon,
  },
  {
    id: 'github',
    name: 'GitHub',
    color: 'neutral',
    type: 'hottest',
    home: 'https://github.com',
    favicon: githubFavicon,
  },
  {
    id: 'zhihu',
    name: '知乎',
    color: 'blue',
    type: 'hottest',
    home: 'https://www.zhihu.com',
    favicon: zhihuFavicon,
  },
  {
    id: 'weibo',
    name: '微博',
    color: 'red',
    type: 'hottest',
    home: 'https://weibo.com',
    favicon: weiboFavicon,
  },
  {
    id: 'bilibili',
    name: 'B站热搜',
    color: 'blue',
    type: 'hottest',
    home: 'https://www.bilibili.com',
    favicon: bilibiliFavicon,
  },
  {
    id: 'douban',
    name: '豆瓣电影',
    color: 'green',
    type: 'hottest',
    home: 'https://movie.douban.com',
    favicon: doubanFavicon,
  },
  {
    id: 'juejin',
    name: '掘金',
    color: 'blue',
    type: 'hottest',
    home: 'https://juejin.cn',
    favicon: juejinFavicon,
  },
  {
    id: 'toutiao',
    name: '今日头条',
    color: 'red',
    type: 'hottest',
    home: 'https://www.toutiao.com',
    favicon: toutiaoFavicon,
  },
  {
    id: 'sspai',
    name: '少数派',
    color: 'red',
    type: 'hottest',
    home: 'https://sspai.com',
    favicon: sspaiFavicon,
  },
  {
    id: 'tieba',
    name: '百度贴吧',
    color: 'blue',
    type: 'hottest',
    home: 'https://tieba.baidu.com',
    favicon: tiebaFavicon,
  },
  {
    id: 'v2ex',
    name: 'V2EX',
    color: 'slate',
    type: 'realtime',
    home: 'https://v2ex.com',
    favicon: v2exFavicon,
  },
  {
    id: 'steam',
    name: 'Steam',
    color: 'blue',
    type: 'hottest',
    home: 'https://store.steampowered.com',
    favicon: steamFavicon,
  },
]

export const SOURCE_MAP = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
) as Record<SourceId, SourceMeta>
