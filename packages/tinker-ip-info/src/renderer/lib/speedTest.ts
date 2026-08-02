import filter from 'licia/filter'
import map from 'licia/map'
import type { SpeedTestResult, SpeedTestTarget } from '../../common/types'

const SPEED_TEST_TARGETS: SpeedTestTarget[] = [
  {
    id: 'baidu',
    nameKey: 'siteBaidu',
    region: 'domestic',
    url: 'https://www.baidu.com',
  },
  {
    id: 'netease',
    nameKey: 'siteNetease',
    region: 'domestic',
    url: 'https://music.163.com',
  },
  {
    id: 'aliyun',
    nameKey: 'siteAliyun',
    region: 'domestic',
    url: 'https://www.aliyun.com',
  },
  {
    id: 'tencent',
    nameKey: 'siteTencent',
    region: 'domestic',
    url: 'https://cloud.tencent.com',
  },
  {
    id: 'github',
    nameKey: 'siteGithub',
    region: 'overseas',
    url: 'https://github.com',
  },
  {
    id: 'google',
    nameKey: 'siteGoogle',
    region: 'overseas',
    url: 'https://www.google.com',
  },
  {
    id: 'youtube',
    nameKey: 'siteYoutube',
    region: 'overseas',
    url: 'https://www.youtube.com',
  },
  {
    id: 'amazon',
    nameKey: 'siteAmazon',
    region: 'overseas',
    url: 'https://www.amazon.com',
  },
]

export function getSpeedTestTargets(language: string): SpeedTestTarget[] {
  const region = language === 'zh-CN' ? 'domestic' : 'overseas'
  return filter(SPEED_TEST_TARGETS, (item) => item.region === region)
}

export async function runSpeedTests(
  targets: SpeedTestTarget[],
): Promise<SpeedTestResult[]> {
  return Promise.all(
    map(targets, async (target) => {
      try {
        const latency = await ipInfo.measureLatency(target.url)
        return { id: target.id, latency, error: false }
      } catch {
        return { id: target.id, latency: null, error: true }
      }
    }),
  )
}
