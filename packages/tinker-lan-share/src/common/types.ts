export interface SharedFile {
  relativePath: string
  fileName: string
  size: number
  lastModified: string
  contentType: string
}

export interface ServerConfig {
  host: string
  port: number
}

export interface ServerStatus {
  running: boolean
  host: string
  port: number
  url: string
  lanUrls: string[]
  shareDir: string
  fileCount: number
}

export interface ShareInfo {
  ip: string
  port: number
  url: string
  language: string
  theme: string
}

export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  host: '0.0.0.0',
  port: 18080,
}
