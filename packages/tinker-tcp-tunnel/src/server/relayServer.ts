import net, { type Server, type Socket } from 'node:net'
import each from 'licia/each'
import map from 'licia/map'
import filter from 'licia/filter'
import isInt from 'licia/isInt'
import trim from 'licia/trim'
import type { PortMapping } from '../common/types'
import {
  LineReader,
  encodeMessage,
  parseClientMessage,
  type ServerMessage,
} from '../common/protocol'
import { pipeSockets } from '../common/pipe'
import { DEFAULT_MAX_PORTS, isSensitivePort } from './portPolicy'

function connId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

interface RelayServerOptions {
  /** Public bind for mapped remote ports (default 0.0.0.0). */
  proxyHost?: string
  port: number
  token: string
  maxPorts?: number
  allowSensitive?: boolean
  onLog?: (message: string) => void
}

interface PendingPublic {
  socket: Socket
  remotePort: number
  timer: ReturnType<typeof setTimeout>
}

interface ClientSession {
  socket: Socket
  authenticated: boolean
  mappings: PortMapping[]
  listeners: Map<number, Server>
}

const CONTROL_HOST = '0.0.0.0'

export class RelayServer {
  private server: Server | null = null
  private readonly clients = new Set<ClientSession>()
  private readonly pending = new Map<string, PendingPublic>()
  private readonly occupied = new Map<number, ClientSession>()
  private readonly proxyHost: string
  private readonly port: number
  private readonly token: string
  private readonly maxPorts: number
  private readonly allowSensitive: boolean
  private readonly log: (message: string) => void

  constructor(options: RelayServerOptions) {
    const token = trim(options.token)
    if (!token) {
      throw new Error('token is required')
    }
    this.proxyHost = options.proxyHost || '0.0.0.0'
    this.port = options.port
    this.token = token
    this.maxPorts = options.maxPorts ?? DEFAULT_MAX_PORTS
    this.allowSensitive = !!options.allowSensitive
    this.log = options.onLog || (() => {})
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = net.createServer((socket) => this.onConnection(socket))
      server.on('error', reject)
      server.listen(this.port, CONTROL_HOST, () => {
        this.server = server
        this.log(
          `control ${CONTROL_HOST}:${this.port}, proxy ${this.proxyHost} (maxPorts=${this.maxPorts}, allowSensitive=${this.allowSensitive})`,
        )
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    each([...this.pending.values()], (item) => {
      clearTimeout(item.timer)
      item.socket.destroy()
    })
    this.pending.clear()

    each([...this.clients], (client) => this.dropClient(client))

    const server = this.server
    this.server = null
    if (!server) return

    await new Promise<void>((resolve) => server.close(() => resolve()))
  }

  private onConnection(socket: Socket) {
    socket.setKeepAlive(true)
    const reader = new LineReader()
    let settled = false

    const onData = (chunk: Buffer) => {
      if (settled) return
      const lines = reader.push(chunk)
      if (!lines.length) return

      settled = true
      socket.off('data', onData)

      const first = parseClientMessage(lines[0])
      if (!first) {
        socket.destroy()
        return
      }

      if (first.type === 'accept') {
        this.handleAccept(socket, first.id, reader.rest())
        return
      }

      const session: ClientSession = {
        socket,
        authenticated: false,
        mappings: [],
        listeners: new Map(),
      }
      this.clients.add(session)
      this.log(`client connected from ${socket.remoteAddress}`)

      this.handleControlMessage(session, first)

      const leftover = reader.rest()
      const controlReader = new LineReader()
      if (leftover.length) {
        each(controlReader.push(leftover), (line) => {
          const msg = parseClientMessage(line)
          if (msg) this.handleControlMessage(session, msg)
        })
      }

      socket.on('data', (buf) => {
        each(controlReader.push(buf), (line) => {
          const msg = parseClientMessage(line)
          if (msg) this.handleControlMessage(session, msg)
        })
      })

      socket.on('close', () => this.dropClient(session))
      socket.on('error', () => this.dropClient(session))
    }

    socket.on('data', onData)
    socket.on('error', () => {})
  }

  private handleAccept(socket: Socket, id: string, leftover: Buffer) {
    const pending = this.pending.get(id)
    if (!pending) {
      socket.destroy()
      return
    }

    this.pending.delete(id)
    clearTimeout(pending.timer)

    if (leftover.length) {
      pending.socket.write(leftover)
    }

    this.log(`paired connection ${id} on :${pending.remotePort}`)
    pipeSockets(pending.socket, socket)
  }

  private handleControlMessage(
    session: ClientSession,
    msg: ReturnType<typeof parseClientMessage>,
  ) {
    if (!msg) return

    if (msg.type === 'auth') {
      if (msg.token !== this.token) {
        this.send(session.socket, { type: 'error', message: 'invalid token' })
        session.socket.destroy()
        return
      }
      session.authenticated = true
      this.send(session.socket, { type: 'ok' })
      return
    }

    if (!session.authenticated) {
      this.send(session.socket, { type: 'error', message: 'auth required' })
      session.socket.destroy()
      return
    }

    if (msg.type === 'ping') {
      this.send(session.socket, { type: 'pong' })
      return
    }

    if (msg.type === 'map') {
      void this.applyMappings(session, msg.mappings)
      return
    }
  }

  private async applyMappings(session: ClientSession, mappings: PortMapping[]) {
    const cleaned = filter(
      mappings,
      (m) =>
        isInt(m.remotePort) &&
        m.remotePort > 0 &&
        m.remotePort < 65536 &&
        isInt(m.localPort) &&
        m.localPort > 0 &&
        m.localPort < 65536 &&
        !!m.localHost,
    )

    const byPort = new Map<number, PortMapping>()
    each(cleaned, (m) => {
      byPort.set(m.remotePort, m)
    })
    const uniqueMappings = [...byPort.values()]
    const remotePorts = map(uniqueMappings, (m) => m.remotePort)

    if (remotePorts.length > this.maxPorts) {
      this.send(session.socket, {
        type: 'error',
        message: `too many ports (max ${this.maxPorts})`,
      })
      return
    }

    for (const port of remotePorts) {
      if (port === this.port) {
        this.send(session.socket, {
          type: 'error',
          message: `port ${port} is reserved for relay control`,
        })
        return
      }
      if (!this.allowSensitive && isSensitivePort(port)) {
        this.send(session.socket, {
          type: 'error',
          message: `port ${port} is blocked (sensitive)`,
        })
        return
      }
      const owner = this.occupied.get(port)
      if (owner && owner !== session) {
        this.send(session.socket, {
          type: 'error',
          message: `port ${port} already in use`,
        })
        return
      }
    }

    this.clearListeners(session)

    try {
      for (const m of uniqueMappings) {
        await this.listenRemote(session, m)
      }
    } catch (err) {
      this.clearListeners(session)
      const message = err instanceof Error ? err.message : String(err)
      this.send(session.socket, { type: 'error', message })
      return
    }

    session.mappings = uniqueMappings
    this.send(session.socket, { type: 'mapped', remotes: remotePorts })
    this.log(`mapped ports: ${remotePorts.join(', ') || '(none)'}`)
  }

  private listenRemote(session: ClientSession, mapping: PortMapping) {
    return new Promise<void>((resolve, reject) => {
      const listener = net.createServer((publicSocket) => {
        this.onPublicConnection(session, mapping.remotePort, publicSocket)
      })

      listener.once('error', reject)
      listener.listen(mapping.remotePort, this.proxyHost, () => {
        listener.off('error', reject)
        session.listeners.set(mapping.remotePort, listener)
        this.occupied.set(mapping.remotePort, session)
        resolve()
      })
    })
  }

  private onPublicConnection(
    session: ClientSession,
    remotePort: number,
    publicSocket: Socket,
  ) {
    if (session.socket.destroyed) {
      publicSocket.destroy()
      return
    }

    const id = connId()
    const timer = setTimeout(() => {
      this.pending.delete(id)
      publicSocket.destroy()
    }, 15000)

    this.pending.set(id, { socket: publicSocket, remotePort, timer })
    this.send(session.socket, { type: 'connect', id, remotePort })
  }

  private clearListeners(session: ClientSession) {
    each([...session.listeners.entries()], ([port, listener]) => {
      listener.close()
      if (this.occupied.get(port) === session) {
        this.occupied.delete(port)
      }
    })
    session.listeners.clear()
  }

  private dropClient(session: ClientSession) {
    if (!this.clients.has(session)) return
    this.clients.delete(session)
    this.clearListeners(session)
    if (!session.socket.destroyed) session.socket.destroy()
    this.log('client disconnected')
  }

  private send(socket: Socket, msg: ServerMessage) {
    if (socket.destroyed) return
    socket.write(encodeMessage(msg))
  }
}
