import LocalStore from 'licia/LocalStore'

const STORAGE_PROP = '__TINKER_PLUGIN_STORAGE__'

type StorageHolder = Window & {
  [STORAGE_PROP]?: LocalStore
}

/**
 * Plugin-scoped persistent storage (namespace = plugin id from URL).
 * Child windows opened via window.open reuse the opener's LocalStore so
 * in-memory cache and localStorage stay in sync.
 */
function createPluginStorage(): LocalStore {
  const w = window as StorageHolder
  try {
    const fromOpener = (window.opener as StorageHolder | null)?.[STORAGE_PROP]
    if (fromOpener) {
      w[STORAGE_PROP] = fromOpener
      return fromOpener
    }
  } catch {
    // Cross-origin opener
  }

  if (!w[STORAGE_PROP]) {
    w[STORAGE_PROP] = new LocalStore(location.host)
  }
  return w[STORAGE_PROP]
}

export const storage = createPluginStorage()

/**
 * Base store for Tinker plugins: theme management.
 * Subclasses should call `makeObservable` / `makeAutoObservable` themselves.
 */
export default class BaseStore {
  isDark = false

  constructor() {
    this.initTheme()
  }

  setIsDark(isDark: boolean) {
    this.isDark = isDark
    // Tinker injects html.dark; browser preview does not.
    if (typeof tinker === 'undefined') {
      document.documentElement.classList.toggle('dark', isDark)
    }
  }

  protected async initTheme() {
    if (typeof tinker !== 'undefined') {
      try {
        const theme = await tinker.getTheme()
        this.setIsDark(theme === 'dark')

        tinker.on('changeTheme', async () => {
          const next = await tinker.getTheme()
          this.setIsDark(next === 'dark')
        })
        return
      } catch (err) {
        console.error('Failed to initialize theme:', err)
      }
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    this.setIsDark(mq.matches)
    mq.addEventListener('change', (e) => this.setIsDark(e.matches))
  }
}
