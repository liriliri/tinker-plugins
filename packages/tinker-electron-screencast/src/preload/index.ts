import { contextBridge } from 'electron'
import type {
  AppInfo,
  LogEntry,
  ServerConfig,
  ServerStatus,
} from '../common/types'
import { listElectronApps } from './apps'
import { clearLogs, getLogs, offLog, onLog } from './logger'
import { getServerStatus, startServer, stopServer } from './server'

function plainConfig(config: ServerConfig): ServerConfig {
  return {
    host: String(config.host || '0.0.0.0'),
    port: Number(config.port) || 9223,
    username: String(config.username || ''),
    password: String(config.password || ''),
  }
}

const api = {
  listApps: (): Promise<AppInfo[]> => listElectronApps(),

  getStatus: (): ServerStatus => getServerStatus(),

  start: async (config: ServerConfig): Promise<ServerStatus> => {
    return startServer(plainConfig(config))
  },

  stop: async (): Promise<void> => {
    await stopServer()
  },

  getLogs: (): LogEntry[] => getLogs(),
  clearLogs: (): void => {
    clearLogs()
  },
  onLog: (listener: (entry: LogEntry) => void): void => {
    onLog(listener)
  },
  offLog: (listener: (entry: LogEntry) => void): void => {
    offLog(listener)
  },
}

contextBridge.exposeInMainWorld('electronScreencast', api)

declare global {
  const electronScreencast: typeof api
}
