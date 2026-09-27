import { makeAutoObservable, runInAction } from 'mobx'
import filter from 'licia/filter'
import some from 'licia/some'
import startWith from 'licia/startWith'
import BaseStore from 'tinker-share/store/Base'
import type { AppInfo, PageInfo, Session } from './types'

class Store extends BaseStore {
  apps: AppInfo[] = []
  loading = false
  sessions: Map<string, Session> = new Map()
  activeSessionId: string | null = null
  dialogApp: AppInfo | null = null

  private pollTimers: Map<string, ReturnType<typeof setInterval>> = new Map()

  constructor() {
    super()
    makeAutoObservable(this)
  }

  async loadApps() {
    this.loading = true
    try {
      const all = await tinker.getApps()
      this.apps = filter(all, (app) => electronDebug.isElectronApp(app.path))
    } finally {
      this.loading = false
    }
  }

  openDialog(app: AppInfo) {
    this.dialogApp = app
  }

  closeDialog() {
    this.dialogApp = null
  }

  async launchApp(app: AppInfo) {
    const sessionId = `${Date.now()}`

    const { nodePort, windowPort } = await electronDebug.launchApp(
      sessionId,
      app.path,
      (chunk) => {
        runInAction(() => {
          const session = this.sessions.get(sessionId)
          if (session) session.log += chunk
        })
      },
      () => {
        runInAction(() => {
          this.sessions.delete(sessionId)
          this.stopPolling(sessionId)
          if (this.activeSessionId === sessionId) this.selectFirstSession()
        })
      },
    )

    runInAction(() => {
      this.sessions.set(sessionId, {
        sessionId,
        appName: app.name,
        nodePort,
        windowPort,
        log: '',
        pages: [],
      })
      this.activeSessionId = sessionId
    })

    this.startPolling(sessionId, nodePort, windowPort)
  }

  private startPolling(
    sessionId: string,
    nodePort: number,
    windowPort: number,
  ) {
    const poll = async () => {
      const [nodePages, winPages] = await Promise.all([
        electronDebug.getPages(nodePort),
        electronDebug.getPages(windowPort),
      ])
      runInAction(() => {
        const session = this.sessions.get(sessionId)
        if (session) {
          const newPages = filter(
            [...nodePages, ...winPages] as PageInfo[],
            (p) => !startWith(p.url, 'devtools://'),
          )
          const changed =
            newPages.length !== session.pages.length ||
            some(newPages, (p, i) => p.id !== session.pages[i].id)
          if (changed) session.pages = newPages
        }
      })
    }

    const timer = setInterval(poll, 2000)
    this.pollTimers.set(sessionId, timer)
    void poll()
  }

  private stopPolling(sessionId: string) {
    const timer = this.pollTimers.get(sessionId)
    if (timer) {
      clearInterval(timer)
      this.pollTimers.delete(sessionId)
    }
  }

  stopAllSessions() {
    for (const sessionId of this.sessions.keys()) {
      electronDebug.stopApp(sessionId)
      this.stopPolling(sessionId)
    }
    this.sessions.clear()
    this.activeSessionId = null
  }

  private selectFirstSession() {
    this.activeSessionId = [...this.sessions.keys()][0] ?? null
  }

  get activeSession(): Session | null {
    return this.activeSessionId
      ? (this.sessions.get(this.activeSessionId) ?? null)
      : null
  }
}

const store = new Store()

export default store
