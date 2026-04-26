import { contextBridge } from 'electron'
import path from 'node:path'

const soundsDir = path.resolve(__dirname, '..', 'sounds')

const agentNotificationObj = {
  getSoundsDir: () => soundsDir,
}

contextBridge.exposeInMainWorld('agentNotification', agentNotificationObj)

declare global {
  const agentNotification: typeof agentNotificationObj
}
