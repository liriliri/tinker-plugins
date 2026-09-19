import net, { type Socket } from 'node:net'
import Emitter from 'licia/Emitter'
import clone from 'licia/clone'
import type { PortMapping, TunnelConfig, TunnelStatus } from '../common/types'
import {
  LineReader,
  encodeMessage,
  parseServerMessage,
} from '../common/protocol'
import { pipeSockets } from '../common/pipe'

const HEARTBEAT_MS = 15000
const RECONNECT_MS = 3000

export class TunnelClient extends Emitter {
  private config: TunnelConfig
  private control: Socket | null = null
  private status: TunnelStatus = {
    state: 'disconnected',
    message: '',
    activeRemotes: [],
  }
  private heartbeat: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldRun = false
  private connectPromise: Promise<void> | null = null

  constructor(config: TunnelConfig) {
    super()
    this.config = clone(config)
  }

  getConfig(): TunnelConfig {
    return clone(this.config)
  }

  getStatus(): TunnelStatus {
    return clone(this.status)
  }

  updateConfig(partial: Partial<TunnelConfig>) {
    this.config = {
      ...this.config,
      ...partial,
      mappings: partial.mappings
        ? clone(partial.mappings)
        : this.config.mappings,
    }
  }

  async connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise

    this.shouldRun = true
    this.clearReconnect()
    this.connectPromise = this.openControl()
      .catch((err) => {
        this.shouldRun = false
        const message = err instanceof Error ? err.message : String(err)
        this.setStatus('error', message)
        throw err
      })
      .finally(() => {
        this.connectPromise = null
      })

    return this.connectPromise
  }

  disconnect() {
    this.shouldRun = false
    this.clearReconnect()
    this.stopHeartbeat()
    if (this.control && !this.control.destroyed) {
      this.control.destroy()
    }
    this.control = null
    this.setStatus('disconnected', '')
  }

  async applyMappings(mappings: PortMapping[]) {
    this.config.mappings = clone(mappings)
    if (
      this.control &&
      !this.control.destroyed &&
      this.status.state === 'connected'
    ) {
      this.control.write(encodeMessage({ type: 'map', mappings }))
    }
  }

  private openControl(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setStatus('connecting', '')
      const socket = net.connect({
        host: this.config.relayHost,
        port: this.config.relayPort,
      })

      let settled = false
      const reader = new LineReader()

      const fail = (err: Error) => {
        if (settled) return
        settled = true
        socket.destroy()
        reject(err)
      }

      socket.setKeepAlive(true)
      socket.once('error', (err) => fail(err))
      socket.once('connect', () => {
        this.control = socket
        socket.write(
          encodeMessage({ type: 'auth', token: this.config.token || '' }),
        )
      })

      const onData = (chunk: Buffer) => {
        const lines = reader.push(chunk)
        for (const line of lines) {
          const msg = parseServerMessage(line)
          if (!msg) continue

          if (msg.type === 'error') {
            fail(new Error(msg.message))
            return
          }

          if (msg.type === 'ok') {
            socket.write(
              encodeMessage({ type: 'map', mappings: this.config.mappings }),
            )
            continue
          }

          if (msg.type === 'mapped') {
            if (!settled) {
              settled = true
              this.setStatus('connected', '', msg.remotes)
              this.startHeartbeat()
              resolve()
            } else {
              this.setStatus('connected', '', msg.remotes)
            }
            continue
          }

          if (msg.type === 'connect') {
            void this.acceptConnection(msg.id, msg.remotePort)
            continue
          }

          if (msg.type === 'pong') {
            continue
          }
        }
      }

      socket.on('data', onData)
      socket.on('close', () => {
        this.stopHeartbeat()
        this.control = null
        if (!settled) {
          fail(new Error('connection closed'))
          return
        }
        if (this.shouldRun) {
          this.setStatus('connecting', 'reconnecting')
          this.scheduleReconnect()
        } else {
          this.setStatus('disconnected', '')
        }
      })
    })
  }

  private acceptConnection(id: string, remotePort: number) {
    const mapping = this.config.mappings.find(
      (m) => m.remotePort === remotePort,
    )
    if (!mapping) return

    const dataSocket = net.connect({
      host: this.config.relayHost,
      port: this.config.relayPort,
    })

    dataSocket.once('connect', () => {
      dataSocket.write(encodeMessage({ type: 'accept', id }))

      const local = net.connect({
        host: mapping.localHost,
        port: mapping.localPort,
      })

      local.once('connect', () => pipeSockets(dataSocket, local))
      local.on('error', () => dataSocket.destroy())
      dataSocket.on('error', () => local.destroy())
    })

    dataSocket.on('error', () => {})
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeat = setInterval(() => {
      if (!this.control || this.control.destroyed) return
      this.control.write(encodeMessage({ type: 'ping' }))
    }, HEARTBEAT_MS)
  }

  private stopHeartbeat() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat)
      this.heartbeat = null
    }
  }

  private scheduleReconnect() {
    this.clearReconnect()
    this.reconnectTimer = setTimeout(() => {
      if (!this.shouldRun) return
      void this.connect().catch(() => {
        if (this.shouldRun) this.scheduleReconnect()
      })
    }, RECONNECT_MS)
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setStatus(
    state: TunnelStatus['state'],
    message: string,
    activeRemotes?: number[],
  ) {
    this.status = {
      state,
      message,
      activeRemotes:
        activeRemotes !== undefined
          ? activeRemotes
          : state === 'disconnected'
            ? []
            : this.status.activeRemotes,
    }
    this.emit('status', this.getStatus())
  }
}
