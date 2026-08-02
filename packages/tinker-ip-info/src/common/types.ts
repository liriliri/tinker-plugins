export interface LanInterface {
  id: string
  name: string
  address: string
  cidr: string
}

export interface PublicIpInfo {
  ip: string
  addr: string
  isp: string
  net: string
}

export type SpeedTestRegion = 'domestic' | 'overseas'

export interface SpeedTestTarget {
  id: string
  nameKey: string
  region: SpeedTestRegion
  url: string
}

export interface SpeedTestResult {
  id: string
  latency: number | null
  error: boolean
}

export interface DnsExitInfo {
  ip: string
  geo: string
}
