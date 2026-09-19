import type { Socket } from 'node:net'

export function pipeSockets(a: Socket, b: Socket) {
  const closeBoth = () => {
    if (!a.destroyed) a.destroy()
    if (!b.destroyed) b.destroy()
  }

  a.on('error', closeBoth)
  b.on('error', closeBoth)
  a.on('close', closeBoth)
  b.on('close', closeBoth)

  a.pipe(b)
  b.pipe(a)
}
