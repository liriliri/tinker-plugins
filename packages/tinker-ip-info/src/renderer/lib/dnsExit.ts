import map from 'licia/map'
import flatten from 'licia/flatten'
import each from 'licia/each'
import contain from 'licia/contain'
import compact from 'licia/compact'
import pairs from 'licia/pairs'
import randomId from 'licia/randomId'
import type { DnsExitInfo } from '../../common/types'

const SUBDOMAIN_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

async function fromIpApi(): Promise<DnsExitInfo[]> {
  const subdomain = randomId(32, SUBDOMAIN_CHARS)
  const data = await ipInfo.fetchJson<{
    dns?: { ip?: string; geo?: string }
  }>(`https://${subdomain}.edns.ip-api.com/json?lang=zh-CN`)

  if (!data.dns?.ip) return []
  return [{ ip: data.dns.ip, geo: data.dns.geo || '' }]
}

async function fromSurfshark(): Promise<DnsExitInfo[]> {
  const data = await ipInfo.fetchJson<
    Record<string, { Country?: string; City?: string; ISP?: string }>
  >('https://o8wqrg29oc8.ipv4.surfsharkdns.com')

  return map(pairs(data), ([ip, details]) => ({
    ip,
    geo: compact([details.Country, details.City, details.ISP]).join(' '),
  }))
}

export async function queryDnsExits(): Promise<DnsExitInfo[]> {
  const settled = await Promise.allSettled([
    fromSurfshark(),
    fromIpApi(),
    fromIpApi(),
    fromIpApi(),
  ])

  const batches: DnsExitInfo[][] = []
  each(settled, (item) => {
    if (item.status === 'fulfilled') batches.push(item.value)
  })

  const results: DnsExitInfo[] = []
  const seen: string[] = []
  each(flatten(batches), (item) => {
    if (!item.ip || contain(seen, item.ip)) return
    seen.push(item.ip)
    results.push(item)
  })
  return results
}
