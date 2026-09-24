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
 * Subclasses should call `makeAutoObservable(this)` themselves.
 */
export default class BaseStore {
  isDark = false

  constructor() {
    this.initTheme()
  }

  setIsDark(isDark: boolean) {
    this.isDark = isDark
  }

  protected async initTheme() {
    try {
      const theme = await tinker.getTheme()
      this.setIsDark(theme === 'dark')

      tinker.on('changeTheme', async () => {
        const next = await tinker.getTheme()
        this.setIsDark(next === 'dark')
      })
    } catch (err) {
      console.error('Failed to initialize theme:', err)
    }
  }
}
