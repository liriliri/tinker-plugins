import { contextBridge } from 'electron'
import path from 'node:path'

const soundsDir = path.resolve(__dirname, '..', 'sounds')

const agentBell = {
  getSoundsDir: () => soundsDir,
}

contextBridge.exposeInMainWorld('agentBell', agentBell)

declare global {
  const agentBell: typeof agentBell
}
