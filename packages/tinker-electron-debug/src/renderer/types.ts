export interface AppInfo {
  name: string
  icon: string
  path: string
}

export interface PageInfo {
  id: string
  title: string
  type: string
  devtoolsFrontendUrl: string
  url: string
}

export interface Session {
  sessionId: string
  appName: string
  nodePort: number
  windowPort: number
  log: string
  pages: PageInfo[]
}
