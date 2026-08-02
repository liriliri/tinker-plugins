import { makeAutoObservable, runInAction } from 'mobx'
import find from 'licia/find'
import filter from 'licia/filter'
import map from 'licia/map'
import concat from 'licia/concat'
import delay from 'licia/delay'
import isEmpty from 'licia/isEmpty'
import type {
  DnsExitInfo,
  LanInterface,
  PublicIpInfo,
  SpeedTestResult,
  SpeedTestTarget,
} from '../common/types'
import { EMPTY_PUBLIC, fetchDomesticIp, fetchOverseasIp } from './lib/publicIp'
import { queryDnsExits } from './lib/dnsExit'
import { getSpeedTestTargets, runSpeedTests } from './lib/speedTest'

class Store {
  lanInterfaces: LanInterface[] = []

  domestic: PublicIpInfo = EMPTY_PUBLIC
  overseas: PublicIpInfo = EMPTY_PUBLIC
  domesticLoading = true
  overseasLoading = true
  domesticError = ''
  overseasError = ''

  language = 'en-US'
  speedTargets: SpeedTestTarget[] = getSpeedTestTargets('en-US')
  speedResults: SpeedTestResult[] = []
  speedLoading = true

  dnsExits: DnsExitInfo[] = []
  dnsLoading = true

  copiedKey: string = ''

  constructor() {
    makeAutoObservable(this)
  }

  setLanguage(language: string) {
    if (this.language === language) return
    this.language = language
    this.speedTargets = getSpeedTestTargets(language)
    void this.refreshSpeedTests()
  }

  async init(language?: string) {
    if (language) {
      this.language = language
      this.speedTargets = getSpeedTestTargets(language)
    }
    void this.refreshLan()
    void this.refreshPublicIps()
    void this.refreshSpeedTests()
    void this.refreshDnsExits()
  }

  async refreshLan() {
    const interfaces = ipInfo.getLanInterfaces()
    const preferred = await ipInfo.getPreferredLanIp().catch(() => '')
    const preferredItem = preferred
      ? find(interfaces, (item) => item.address === preferred)
      : undefined

    runInAction(() => {
      this.lanInterfaces = preferredItem
        ? concat(
            [preferredItem],
            filter(interfaces, (item) => item.id !== preferredItem.id),
          )
        : interfaces
    })
  }

  async refreshPublicIps() {
    runInAction(() => {
      this.domesticLoading = true
      this.overseasLoading = true
      this.domesticError = ''
      this.overseasError = ''
    })

    await Promise.all([
      this.loadPublicIp(fetchDomesticIp, (info, error) => {
        this.domestic = info
        this.domesticError = error
        this.domesticLoading = false
      }),
      this.loadPublicIp(fetchOverseasIp, (info, error) => {
        this.overseas = info
        this.overseasError = error
        this.overseasLoading = false
      }),
    ])
  }

  private async loadPublicIp(
    fetch: () => Promise<PublicIpInfo>,
    apply: (info: PublicIpInfo, error: string) => void,
  ) {
    try {
      const info = await fetch()
      runInAction(() => apply(info, ''))
    } catch {
      runInAction(() => apply(EMPTY_PUBLIC, 'networkError'))
    }
  }

  async refreshSpeedTests() {
    const targets = this.speedTargets
    runInAction(() => {
      this.speedLoading = true
      this.speedResults = map(targets, (item) => ({
        id: item.id,
        latency: null,
        error: false,
      }))
    })

    const results = await runSpeedTests(targets)
    runInAction(() => {
      this.speedResults = results
      this.speedLoading = false
    })
  }

  async refreshDnsExits() {
    runInAction(() => {
      this.dnsLoading = true
    })
    try {
      const exits = await queryDnsExits()
      runInAction(() => {
        this.dnsExits = exits
        this.dnsLoading = false
      })
    } catch {
      runInAction(() => {
        this.dnsExits = []
        this.dnsLoading = false
      })
    }
  }

  async refreshAll() {
    await Promise.all([
      this.refreshLan(),
      this.refreshPublicIps(),
      this.refreshSpeedTests(),
      this.refreshDnsExits(),
    ])
  }

  async copyText(text: string, key: string) {
    if (isEmpty(text)) return
    try {
      await navigator.clipboard.writeText(text)
      runInAction(() => {
        this.copiedKey = key
      })
      delay(() => {
        runInAction(() => {
          if (this.copiedKey === key) this.copiedKey = ''
        })
      }, 1500)
    } catch {
      // clipboard may be unavailable
    }
  }

  getSpeedResult(id: string): SpeedTestResult | undefined {
    return find(this.speedResults, (item) => item.id === id)
  }
}

const store = new Store()

export default store
