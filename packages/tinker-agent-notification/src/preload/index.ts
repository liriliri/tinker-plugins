import { contextBridge } from 'electron'
import path from 'node:path'

const soundsDir = path.resolve(__dirname, '..', 'sounds')
const playScript = path.resolve(soundsDir, 'play.ps1')

const agentNotificationObj = {
  getSoundsDir: () => soundsDir,
  getPlayScript: () => playScript,
}

contextBridge.exposeInMainWorld('agentNotification', agentNotificationObj)

declare global {
  const agentNotification: typeof agentNotificationObj
}
