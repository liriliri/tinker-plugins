import type { PortMapping } from './types'

export type ClientMessage =
  | { type: 'auth'; token: string }
  | { type: 'map'; mappings: PortMapping[] }
  | { type: 'accept'; id: string }
  | { type: 'ping' }

export type ServerMessage =
  | { type: 'ok' }
  | { type: 'error'; message: string }
  | { type: 'mapped'; remotes: number[] }
  | { type: 'connect'; id: string; remotePort: number }
  | { type: 'pong' }

export function encodeMessage(msg: ClientMessage | ServerMessage): Buffer {
  return Buffer.from(`${JSON.stringify(msg)}\n`, 'utf8')
}

export class LineReader {
  private buffer = Buffer.alloc(0)

  push(chunk: Buffer): string[] {
    this.buffer = Buffer.concat([this.buffer, chunk])
    const lines: string[] = []

    while (true) {
      const idx = this.buffer.indexOf(0x0a)
      if (idx < 0) break
      const line = this.buffer.subarray(0, idx).toString('utf8').trim()
      this.buffer = this.buffer.subarray(idx + 1)
      if (line) lines.push(line)
    }

    return lines
  }

  rest(): Buffer {
    return this.buffer
  }
}

export function parseClientMessage(line: string): ClientMessage | null {
  try {
    const msg = JSON.parse(line) as ClientMessage
    if (!msg || typeof msg !== 'object' || !('type' in msg)) return null
    return msg
  } catch {
    return null
  }
}

export function parseServerMessage(line: string): ServerMessage | null {
  try {
    const msg = JSON.parse(line) as ServerMessage
    if (!msg || typeof msg !== 'object' || !('type' in msg)) return null
    return msg
  } catch {
    return null
  }
}
