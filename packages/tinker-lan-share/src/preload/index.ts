import { contextBridge, shell } from 'electron'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import type { ServerConfig, ServerStatus } from '../common/types'
import { getServerStatus, startServer, stopServer } from './server'
import { clearAll, getShareDir, initShareDir } from './share'

function plainConfig(config: ServerConfig): ServerConfig {
  return {
    host: toStr(config.host) || '0.0.0.0',
    port: toNum(config.port) || 18080,
  }
}

const api = {
  getStatus: (): ServerStatus => getServerStatus(),

  start: async (config: ServerConfig): Promise<ServerStatus> => {
    return startServer(plainConfig(config))
  },

  stop: async (): Promise<void> => {
    await stopServer()
  },

  clear: (): void => {
    clearAll()
  },

  openShareDir: async (): Promise<void> => {
    const dir = getShareDir() || (await initShareDir())
    await shell.openPath(dir)
  },

  openUrl: async (url: string): Promise<void> => {
    await shell.openExternal(url)
  },
}

contextBridge.exposeInMainWorld('lanShare', api)

declare global {
  const lanShare: typeof api
}
