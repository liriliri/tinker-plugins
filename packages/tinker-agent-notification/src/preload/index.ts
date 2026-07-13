import { contextBridge } from 'electron'
import path from 'node:path'

const soundsDir = path.resolve(__dirname, '..', 'sounds')
const playScript = path.resolve(soundsDir, 'play.ps1')

const api = {
  getSoundsDir: () => soundsDir,
  getPlayScript: () => playScript,
}

contextBridge.exposeInMainWorld('agentNotification', api)

declare global {
  const agentNotification: typeof api
}
