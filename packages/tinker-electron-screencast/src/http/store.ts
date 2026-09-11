import { makeAutoObservable, runInAction } from 'mobx'
import i18n from 'i18next'
import {
  apiFetch,
  BasicCredentials,
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from './lib/auth'
import { errorMessage } from './lib/util'

interface RemoteApp {
  name: string
  path: string
  icon: string
}

interface RemotePage {
  id: string
  title: string
  url: string
  type: string
}

function pageIdFromPath() {
  const match = location.pathname.match(/^\/s\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : null
}

function sessionIdFromPath() {
  const match = location.pathname.match(/^\/a\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : null
}

const SESSION_KEY = 'tinker-electron-screencast-session'

class Store {
  apps: RemoteApp[] = []
  error = ''
  pageId: string | null = pageIdFromPath()
  sessionId: string | null = sessionIdFromPath()
  pages: RemotePage[] = []
  pagesLoading = false
  launching = false

  authRequired = false
  authenticated = false
  authError = ''
  authReady = false
  credentials: BasicCredentials | null = loadCredentials()

  pageUrl = ''
  statusKey = 'connecting'
  screencastErrorKey = ''
  screencastErrorRaw = ''
  screencastActive = true

  private refreshTimer: number | null = null
  private pagesTimer: number | null = null

  constructor() {
    makeAutoObservable(this)
    if (this.pageId && !this.sessionId) {
      this.sessionId = sessionStorage.getItem(SESSION_KEY)
    }
    void this.initAuth()
  }

  get needsLogin() {
    return this.authReady && this.authRequired && !this.authenticated
  }

  get selectingPages() {
    return !!this.sessionId && !this.pageId
  }

  setStatusKey(key: string) {
    this.statusKey = key
  }

  setPageUrl(url: string) {
    this.pageUrl = url
  }

  setScreencastErrorKey(key: string) {
    this.screencastErrorKey = key
    this.screencastErrorRaw = ''
  }

  setScreencastErrorRaw(message: string) {
    this.screencastErrorKey = ''
    this.screencastErrorRaw = message
  }

  setScreencastActive(active: boolean) {
    this.screencastActive = active
  }

  resetScreencast() {
    this.pageUrl = ''
    this.statusKey = 'connecting'
    this.screencastErrorKey = ''
    this.screencastErrorRaw = ''
    this.screencastActive = true
  }

  async initAuth() {
    try {
      const res = await apiFetch('/api/auth')
      const data = res.ok
        ? ((await res.json()) as {
            required?: boolean
            language?: string
            theme?: string
          })
        : { required: false }
      if (data.language) {
        void i18n.changeLanguage(data.language)
      }
      document.documentElement.classList.toggle('dark', data.theme === 'dark')
      document.documentElement.style.colorScheme =
        data.theme === 'dark' ? 'dark' : 'light'
      const required = !!data.required
      runInAction(() => {
        this.authRequired = required
      })
      if (!required) {
        runInAction(() => {
          this.authenticated = true
          this.authReady = true
          this.credentials = null
        })
        clearCredentials()
        this.startData()
        return
      }
      if (this.credentials) {
        const ok = await this.verifyCredentials(this.credentials)
        if (ok) {
          runInAction(() => {
            this.authenticated = true
            this.authReady = true
          })
          this.startData()
          return
        }
        clearCredentials()
        runInAction(() => {
          this.credentials = null
        })
      }
      if (this.pageId || this.sessionId) {
        location.replace('/')
        return
      }
      runInAction(() => {
        this.authenticated = false
        this.authReady = true
      })
    } catch {
      runInAction(() => {
        this.authRequired = false
        this.authenticated = true
        this.authReady = true
      })
      this.startData()
    }
  }

  async verifyCredentials(creds: BasicCredentials) {
    const res = await apiFetch('/api/apps', {}, creds)
    return res.ok
  }

  async login(username: string, password: string) {
    const creds = { username, password }
    runInAction(() => {
      this.authError = ''
    })
    const ok = await this.verifyCredentials(creds)
    if (!ok) {
      runInAction(() => {
        this.authError = 'loginErr'
        this.authenticated = false
      })
      return false
    }
    saveCredentials(creds)
    runInAction(() => {
      this.credentials = creds
      this.authenticated = true
      this.authError = ''
    })
    this.startData()
    return true
  }

  private startData() {
    if (this.pageId) return
    if (this.sessionId) {
      void this.refreshPages()
      if (this.pagesTimer === null) {
        this.pagesTimer = window.setInterval(() => this.refreshPages(), 2000)
      }
      return
    }
    void this.refresh()
    if (this.refreshTimer === null) {
      this.refreshTimer = window.setInterval(() => this.refresh(), 5000)
    }
  }

  async refresh() {
    if (this.authRequired && !this.authenticated) return
    try {
      const res = await apiFetch('/api/apps', {}, this.credentials)
      if (res.status === 401) {
        clearCredentials()
        runInAction(() => {
          this.credentials = null
          this.authenticated = false
          this.authError = 'loginErr'
        })
        if (this.pageId || this.sessionId) location.replace('/')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as RemoteApp[]
      runInAction(() => {
        this.apps = data
        this.error = ''
      })
    } catch (err: unknown) {
      runInAction(() => {
        this.error = errorMessage(err)
      })
    }
  }

  async refreshPages() {
    if (!this.sessionId) return
    if (this.authRequired && !this.authenticated) return
    this.pagesLoading = this.pages.length === 0
    try {
      const res = await apiFetch(
        `/api/sessions/${encodeURIComponent(this.sessionId)}`,
        {},
        this.credentials,
      )
      if (res.status === 404) {
        runInAction(() => {
          this.error = 'sessionGone'
          this.pages = []
        })
        return
      }
      if (res.status === 401) {
        clearCredentials()
        runInAction(() => {
          this.credentials = null
          this.authenticated = false
          this.authError = 'loginErr'
        })
        location.replace('/')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as {
        pages: RemotePage[]
      }
      runInAction(() => {
        this.pages = data.pages
        this.error = ''
        this.pagesLoading = false
      })
    } catch (err: unknown) {
      runInAction(() => {
        this.error = errorMessage(err)
        this.pagesLoading = false
      })
    }
  }

  async launchApp(app: RemoteApp) {
    if (this.launching) return
    this.launching = true
    this.error = ''
    try {
      const res = await apiFetch(
        '/api/launch',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: app.path }),
        },
        this.credentials,
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      const data = (await res.json()) as {
        sessionId: string
        pageId: string | null
        pages: RemotePage[]
        appName: string
      }
      if (!data.sessionId) {
        throw new Error('noPages')
      }
      sessionStorage.setItem(SESSION_KEY, data.sessionId)
      if (data.pages.length === 1 && data.pageId) {
        location.assign(`/s/${encodeURIComponent(data.pageId)}`)
        return
      }
      location.assign(`/a/${encodeURIComponent(data.sessionId)}`)
    } catch (err: unknown) {
      runInAction(() => {
        this.error = errorMessage(err)
      })
    } finally {
      runInAction(() => {
        this.launching = false
      })
    }
  }

  openPage(page: RemotePage) {
    if (this.sessionId) {
      sessionStorage.setItem(SESSION_KEY, this.sessionId)
    }
    location.assign(`/s/${encodeURIComponent(page.id)}`)
  }

  get screencastBackHref() {
    const sessionId = this.sessionId || sessionStorage.getItem(SESSION_KEY)
    if (sessionId) return `/a/${encodeURIComponent(sessionId)}`
    return '/'
  }

  dispose() {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    if (this.pagesTimer !== null) {
      window.clearInterval(this.pagesTimer)
      this.pagesTimer = null
    }
  }
}

const store = new Store()
export default store
