import WebSocket from 'ws'

type Pending = {
  resolve: (result: unknown) => void
  reject: (err: Error) => void
}

type CdpEventHandler = (method: string, params: unknown) => void

export class CdpClient {
  private ws: WebSocket | null = null
  private nextId = 1
  private pending = new Map<number, Pending>()
  private closed = false

  constructor(
    private readonly wsUrl: string,
    private readonly onEvent: CdpEventHandler,
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl, {
        headers: { Origin: 'devtools://devtools' },
      })
      this.ws = ws

      ws.on('open', () => resolve())
      ws.on('error', (err) => {
        if (!this.closed) reject(err)
      })
      ws.on('close', () => {
        this.rejectAll(new Error('CDP connection closed'))
        this.ws = null
      })
      ws.on('message', (data) => {
        let msg: {
          id?: number
          method?: string
          params?: unknown
          result?: unknown
          error?: { message?: string }
        }
        try {
          msg = JSON.parse(data.toString())
        } catch {
          return
        }
        if (msg.id != null) {
          const pending = this.pending.get(msg.id)
          if (!pending) return
          this.pending.delete(msg.id)
          if (msg.error) {
            pending.reject(new Error(msg.error.message || 'CDP error'))
          } else {
            pending.resolve(msg.result)
          }
          return
        }
        if (msg.method) {
          this.onEvent(msg.method, msg.params)
        }
      })
    })
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const ws = this.ws
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('CDP not connected'))
    }
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.closed = true
    this.rejectAll(new Error('CDP closed'))
    try {
      this.ws?.close()
    } catch {
      // ignore
    }
    this.ws = null
  }

  get connected() {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN
  }

  private rejectAll(err: Error) {
    for (const pending of this.pending.values()) {
      pending.reject(err)
    }
    this.pending.clear()
  }
}
