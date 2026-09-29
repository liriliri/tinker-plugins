import { makeAutoObservable, runInAction } from 'mobx'
import contain from 'licia/contain'
import isFinite from 'licia/isFinite'
import isStr from 'licia/isStr'
import max from 'licia/max'
import raf from 'licia/raf'
import some from 'licia/some'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import type {
  SpeedProgressEvent,
  SpeedTestNodeInfo,
  SpeedTestPhase,
  SpeedUnit,
} from '../common/types'
import { formatMs, formatSpeed } from './lib/format'

const NODE_KEY = 'node'
const UNIT_KEY = 'unit'

class Store extends BaseStore {
  nodes: SpeedTestNodeInfo[] = []
  nodeId = 'ookla-3633'
  unit: SpeedUnit = 'mbps'
  phase: SpeedTestPhase = 'idle'
  running = false

  ip = '--'
  pingMs = NaN
  jitterMs = NaN
  downloadMbps = NaN
  uploadMbps = NaN
  liveMbps = NaN
  progress = 0

  toastOpen = false
  toastMsg = ''

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get unitLabel() {
    return this.unit === 'mbs' ? 'MB/s' : 'Mbps'
  }

  get isPingPhase() {
    return this.phase === 'latency'
  }

  get liveValue() {
    if (isFinite(this.liveMbps)) return this.liveMbps
    if (this.phase === 'done') {
      return max(this.downloadMbps || 0, this.uploadMbps || 0)
    }
    return NaN
  }

  get displayNumeric() {
    return this.isPingPhase ? this.pingMs : this.liveValue
  }

  get displayLabel() {
    return this.isPingPhase
      ? formatMs(this.pingMs)
      : formatSpeed(this.liveValue, this.unit)
  }

  get displayUnit() {
    return this.isPingPhase ? 'ms' : this.unitLabel
  }

  init() {
    this.nodes = speedTest.nodes
    const savedNode = storage.get(NODE_KEY)
    if (isStr(savedNode) && some(this.nodes, (n) => n.id === savedNode)) {
      this.nodeId = savedNode
    }
    const savedUnit = storage.get(UNIT_KEY)
    if (isStr(savedUnit) && contain(['mbps', 'mbs'], savedUnit)) {
      this.unit = savedUnit as SpeedUnit
    }
  }

  setNodeId(id: string) {
    if (this.running) return
    this.nodeId = id
    storage.set(NODE_KEY, id)
  }

  setUnit(unit: SpeedUnit) {
    this.unit = unit
    storage.set(UNIT_KEY, unit)
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  showError(msg: string) {
    this.toastMsg = msg
    this.toastOpen = false
    raf(() => {
      this.toastOpen = true
    })
  }

  applyProgress(event: SpeedProgressEvent) {
    switch (event.type) {
      case 'phase':
        this.phase = event.phase
        if (event.phase === 'download' || event.phase === 'upload') {
          this.liveMbps = 0
          this.progress = 0
        }
        break
      case 'ip':
        this.ip = event.ip
        break
      case 'latency':
        this.pingMs = event.pingMs
        this.jitterMs = event.jitterMs
        this.progress = event.done / event.total
        break
      case 'download':
        this.liveMbps = event.mbps
        this.progress = event.progress
        if (event.final) this.downloadMbps = event.mbps
        break
      case 'upload':
        this.liveMbps = event.mbps
        this.progress = event.progress
        if (event.final) this.uploadMbps = event.mbps
        break
    }
  }

  resetResults() {
    this.ip = '--'
    this.pingMs = NaN
    this.jitterMs = NaN
    this.downloadMbps = NaN
    this.uploadMbps = NaN
    this.liveMbps = NaN
    this.progress = 0
  }

  async start() {
    if (this.running) return
    this.running = true
    this.resetResults()
    this.phase = 'ip'

    try {
      const result = await speedTest.run(this.nodeId, (event) => {
        runInAction(() => this.applyProgress(event))
      })
      runInAction(() => {
        this.ip = result.ip
        this.pingMs = result.pingMs
        this.jitterMs = result.jitterMs
        this.downloadMbps = result.downloadMbps
        this.uploadMbps = result.uploadMbps
        this.phase = 'done'
        this.progress = 1
        this.liveMbps = NaN
      })
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError'
      runInAction(() => {
        this.phase = 'idle'
        this.liveMbps = NaN
        if (!aborted) this.showError(errorMessage(error))
      })
    } finally {
      runInAction(() => {
        this.running = false
      })
    }
  }

  stop() {
    if (!this.running) return
    speedTest.cancel()
  }

  toggle() {
    if (this.running) this.stop()
    else void this.start()
  }
}

const store = new Store()

export default store
