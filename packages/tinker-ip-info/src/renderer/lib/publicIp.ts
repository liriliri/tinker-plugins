import compact from 'licia/compact'
import map from 'licia/map'
import trim from 'licia/trim'
import type { PublicIpInfo } from '../../common/types'

export const EMPTY_PUBLIC: PublicIpInfo = {
  ip: '',
  addr: '',
  isp: '',
  net: '',
}

async function trySources(
  sources: Array<() => Promise<PublicIpInfo>>,
): Promise<PublicIpInfo> {
  for (const source of sources) {
    try {
      const info = await source()
      if (info.ip) return info
    } catch {
      // try next source
    }
  }
  throw new Error('networkError')
}

async function fromMyIp(): Promise<PublicIpInfo> {
  const data = await ipInfo.fetchJson<{
    data?: {
      ip?: string
      country?: string
      province?: string
      city?: string
      district?: string
      isp?: string
    }
  }>('https://my.ip.cn/json/')

  const d = data.data
  if (!d?.ip) throw new Error('empty')
  return {
    ip: d.ip,
    addr: compact([d.country, d.province, d.city, d.district]).join(' '),
    isp: d.isp || '',
    net: d.isp || '',
  }
}

async function fromIpSb(): Promise<PublicIpInfo> {
  const data = await ipInfo.fetchJson<{
    ip?: string
    country?: string
    region?: string
    city?: string
    isp?: string
    organization?: string
  }>('https://api.ip.sb/geoip')

  if (!data.ip) throw new Error('empty')
  return {
    ip: data.ip,
    addr: compact([data.country, data.region, data.city]).join(' '),
    isp: data.isp || data.organization || '',
    net: data.organization || data.isp || '',
  }
}

async function fromPing0(): Promise<PublicIpInfo> {
  const text = await ipInfo.fetchText('https://ping0.cc/geo')
  const lines = map(text.split(/\r?\n/), (line) => trim(line))
  if (!lines[0]) throw new Error('empty')
  return {
    ip: lines[0],
    addr: lines[1] || '',
    isp: lines[2] || '',
    net: lines[3] || '',
  }
}

async function fromIpInfo(): Promise<PublicIpInfo> {
  const data = await ipInfo.fetchJson<{
    ip?: string
    country?: string
    region?: string
    city?: string
    org?: string
  }>('https://ipinfo.io/json')

  if (!data.ip) throw new Error('empty')
  return {
    ip: data.ip,
    addr: compact([data.country, data.region, data.city]).join(' '),
    isp: data.org || '',
    net: data.org || '',
  }
}

async function fromIpify(): Promise<PublicIpInfo> {
  const data = await ipInfo.fetchJson<{ ip?: string }>(
    'https://api.ipify.org?format=json',
  )
  if (!data.ip) throw new Error('empty')
  return { ...EMPTY_PUBLIC, ip: data.ip }
}

async function fromPublicIpPkg(): Promise<PublicIpInfo> {
  const ip = await ipInfo.getPublicIpDns()
  if (!ip) throw new Error('empty')
  return { ...EMPTY_PUBLIC, ip }
}

export function fetchDomesticIp(): Promise<PublicIpInfo> {
  return trySources([fromMyIp, fromIpSb, fromIpify, fromPublicIpPkg])
}

export function fetchOverseasIp(): Promise<PublicIpInfo> {
  return trySources([
    fromPing0,
    fromIpInfo,
    fromIpSb,
    fromIpify,
    fromPublicIpPkg,
  ])
}
