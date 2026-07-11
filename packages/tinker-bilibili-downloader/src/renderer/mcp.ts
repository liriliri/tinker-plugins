import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'query') {
      return query(getStore(), args as { url: string })
    }
    if (name === 'download') {
      return download(
        getStore(),
        args as { quality?: number; pages?: number[] },
      )
    }
    if (name === 'get_settings') {
      return getSettings(getStore())
    }
    if (name === 'set_settings') {
      return setSettings(
        getStore(),
        args as {
          downloadPath?: string
          sessdata?: string
        },
      )
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function query(store: Store, args: { url: string }) {
  const prev = store.videoInfo
  store.setShowVideoModal(false)
  store.setUrlInput(args.url.trim())
  await store.parseUrl()

  const info = store.videoInfo
  if (!info || info === prev) {
    throw new Error('Failed to parse video')
  }

  return {
    title: info.title,
    bvid: info.bvid,
    cover: info.cover,
    duration: info.duration,
    up: info.up,
    pages: info.page,
    qualityOptions: info.qualityOptions,
    selectedQuality: store.selectedQuality,
    selectedPages: store.selectedPages,
  }
}

async function download(
  store: Store,
  args: { quality?: number; pages?: number[] },
) {
  if (!store.videoInfo) {
    throw new Error('No video queried. Call query first.')
  }
  if (!store.settings.downloadPath) {
    throw new Error('Please set a download path in settings first.')
  }

  if (args.quality != null) {
    store.setSelectedQuality(args.quality)
  }

  if (args.pages != null) {
    store.deselectAllPages()
    for (const page of args.pages) {
      store.togglePageSelection(page)
    }
  }

  if (store.selectedPages.length === 0) {
    throw new Error('No pages selected')
  }

  const beforeIds = new Set(store.tasks.keys())
  await store.startDownload()

  const newIds = [...store.tasks.keys()].filter((id) => !beforeIds.has(id))
  if (newIds.length === 0) {
    throw new Error('No download tasks were created')
  }

  await waitForTasks(store, newIds)

  return {
    tasks: newIds.map((id) => store.tasks.get(id)),
  }
}

function getSettings(store: Store) {
  return {
    downloadPath: store.settings.downloadPath,
    sessdata: store.settings.sessdata,
  }
}

function setSettings(
  store: Store,
  args: {
    downloadPath?: string
    sessdata?: string
  },
) {
  store.updateSettings(args)
  return getSettings(store)
}

function waitForTasks(store: Store, ids: string[]) {
  return new Promise<void>((resolve) => {
    const tick = () => {
      const pending = ids.some((id) => {
        const t = store.tasks.get(id)
        return t && t.status !== 'done' && t.status !== 'error'
      })
      if (!pending) {
        resolve()
        return
      }
      setTimeout(tick, 300)
    }
    tick()
  })
}
