export interface AppInfo {
  name: string
  icon: string
  path: string
}

export interface PageInfo {
  id: string
  title: string
  type: string
  url: string
  webSocketDebuggerUrl: string
}

export interface ServerConfig {
  host: string
  port: number
  username: string
  password: string
}

export interface ServerStatus {
  running: boolean
  host: string
  port: number
  url: string
  lanUrls: string[]
  authRequired: boolean
}

export interface LogEntry {
  id: string
  time: number
  level: 'info' | 'warn' | 'error'
  message: string
}

export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  host: '0.0.0.0',
  port: 9223,
  username: '',
  password: '',
}
