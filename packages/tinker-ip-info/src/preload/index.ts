import { contextBridge } from 'electron'
import os from 'node:os'
import { publicIpv4 } from 'public-ip'
import { internalIpV4 } from 'internal-ip'
import each from 'licia/each'
import map from 'licia/map'
import omit from 'licia/omit'
import some from 'licia/some'
import contain from 'licia/contain'
import startWith from 'licia/startWith'
import lowerCase from 'licia/lowerCase'
import sortBy from 'licia/sortBy'
import toStr from 'licia/toStr'
import now from 'licia/now'
import type { LanInterface } from '../common/types'

const PREFERRED_IFACE = ['wi-fi', 'wifi', 'wlan']
const VIRTUAL_IFACE = [
  'bridge',
  'docker',
  'vbox',
  'vmnet',
  'hyper-v',
  'virtual',
  'utun',
  'tun',
  'tap',
]

function normalizeFamily(family: string | number): string {
  if (family === 4 || family === 'IPv4') return 'IPv4'
  if (family === 6 || family === 'IPv6') return 'IPv6'
  return toStr(family)
}

function scoreLanInterface(name: string, address: string): number {
  let score = 0
  const lowerName = lowerCase(name)

  if (
    some(PREFERRED_IFACE, (key) => contain(lowerName, key)) ||
    lowerName === 'en0' ||
    startWith(lowerName, 'eth')
  ) {
    score += 50
  }

  if (some(VIRTUAL_IFACE, (key) => contain(lowerName, key))) {
    score -= 100
  }

  if (startWith(address, '192.168.')) {
    score += 20
  } else if (startWith(address, '10.')) {
    score += 15
  } else if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) {
    score += 10
  }

  return score
}

function listLanIPv4Interfaces(): LanInterface[] {
  const result: Array<LanInterface & { score: number }> = []

  each(os.networkInterfaces(), (iface, name) => {
    if (!iface) return
    each(iface, (item) => {
      if (normalizeFamily(item.family) !== 'IPv4') return
      if (item.internal || !item.address) return
      if (item.address === '127.0.0.1' || startWith(item.address, '169.254.')) {
        return
      }

      result.push({
        id: `${name}::${item.address}`,
        name: toStr(name),
        address: item.address,
        cidr: item.cidr || '',
        score: scoreLanInterface(toStr(name), item.address),
      })
    })
  })

  return map(
    sortBy(result, (item) => -item.score),
    (item) => omit(item, 'score'),
  )
}

async function fetchWithTimeout(
  url: string,
  timeout = 8000,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'curl/8.1.2',
        Accept: '*/*',
      },
    })
  } finally {
    clearTimeout(timer)
  }
}

const api = {
  getLanInterfaces(): LanInterface[] {
    return listLanIPv4Interfaces()
  },

  async getPreferredLanIp(): Promise<string> {
    try {
      return (await internalIpV4()) || ''
    } catch {
      return ''
    }
  },

  async getPublicIpDns(): Promise<string> {
    return publicIpv4({ timeout: 3000 })
  },

  async fetchText(url: string, timeout = 8000): Promise<string> {
    const res = await fetchWithTimeout(url, timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  },

  async fetchJson<T = unknown>(url: string, timeout = 8000): Promise<T> {
    const res = await fetchWithTimeout(url, timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<T>
  },

  async measureLatency(url: string, timeout = 10000): Promise<number> {
    const start = now()
    const res = await fetchWithTimeout(url, timeout)
    await res.arrayBuffer().catch(() => undefined)
    return now() - start
  },
}

contextBridge.exposeInMainWorld('ipInfo', api)

declare global {
  const ipInfo: typeof api
}
