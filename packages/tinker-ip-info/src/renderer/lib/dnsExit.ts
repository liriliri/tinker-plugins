import map from 'licia/map'
import flatten from 'licia/flatten'
import each from 'licia/each'
import contain from 'licia/contain'
import compact from 'licia/compact'
import pairs from 'licia/pairs'
import randomId from 'licia/randomId'
import range from 'licia/range'
import type { DnsExitInfo } from '../../common/types'

const SUBDOMAIN_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const SURFSHARK_QUERIES = 4
const IPAPI_QUERIES = 2
const DNS_TIMEOUT = 12000

async function fromIpApi(): Promise<DnsExitInfo[]> {
  const subdomain = randomId(32, SUBDOMAIN_CHARS)
  // Free EDNS endpoint is HTTP-only; HTTPS fails the TLS handshake.
  const data = await ipInfo.fetchJson<{
    dns?: { ip?: string; geo?: string }
  }>(`http://${subdomain}.edns.ip-api.com/json`, DNS_TIMEOUT)

  if (!data.dns?.ip) return []
  return [{ ip: data.dns.ip, geo: data.dns.geo || '' }]
}

async function fromSurfshark(): Promise<DnsExitInfo[]> {
  // Unique subdomain per request — a shared ID mixes other users' DNS into results.
  const id = randomId(12, SUBDOMAIN_CHARS)
  const data = await ipInfo.fetchJson<
    Record<string, { Country?: string; City?: string; ISP?: string }>
  >(`https://${id}.ipv4.surfsharkdns.com`, DNS_TIMEOUT)

  return map(pairs(data), ([ip, details]) => ({
    ip,
    geo: compact([details.Country, details.City, details.ISP]).join(' '),
  }))
}

export async function queryDnsExits(): Promise<DnsExitInfo[]> {
  const settled = await Promise.allSettled([
    ...map(range(SURFSHARK_QUERIES), () => fromSurfshark()),
    ...map(range(IPAPI_QUERIES), () => fromIpApi()),
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
