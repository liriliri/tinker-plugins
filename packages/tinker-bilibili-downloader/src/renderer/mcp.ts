import type { Store } from './store'
import type { TaskData } from './types'
import filter from 'licia/filter'
import map from 'licia/map'
import sortBy from 'licia/sortBy'
import trim from 'licia/trim'
import values from 'licia/values'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    switch (name) {
      case 'query':
        return query(getStore(), args as { url: string })
      case 'download':
        return download(
          getStore(),
          args as { quality?: number; pages?: number[]; downloadPath?: string },
        )
      case 'get_progress':
        return getProgress(getStore(), args as { taskId?: string })
      default:
        throw new Error(`Unknown tool "${name}"`)
    }
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function query(store: Store, args: { url: string }) {
  const prev = store.videoInfo
  store.setShowVideoModal(false)
  store.setUrlInput(trim(args.url))
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
  args: { quality?: number; pages?: number[]; downloadPath?: string },
) {
  if (!store.videoInfo) {
    throw new Error('No video queried. Call query first.')
  }

  const downloadPath = trim(args.downloadPath || '')
  if (!downloadPath && !store.settings.downloadPath) {
    throw new Error(
      'downloadPath is required when no download directory is set in the UI.',
    )
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
  await store.startDownload({
    downloadPath: downloadPath || undefined,
  })

  const newIds = filter([...store.tasks.keys()], (id) => !beforeIds.has(id))
  if (newIds.length === 0) {
    throw new Error('No download tasks were created')
  }

  return {
    taskIds: newIds,
    tasks: map(newIds, (id) => serializeTask(store.tasks.get(id)!)),
  }
}

function serializeTask(task: TaskData) {
  return {
    taskId: task.id,
    title: task.title,
    status: task.status,
    progress: task.progress,
    outputPath: task.outputPath,
    qualityLabel: task.qualityLabel,
    bvid: task.bvid,
    error: task.error,
  }
}

function getProgress(store: Store, args: { taskId?: string }) {
  const taskId = trim(args.taskId || '')
  if (taskId) {
    const task = store.tasks.get(taskId)
    if (!task) {
      throw new Error(`Unknown taskId: ${taskId}`)
    }
    return serializeTask(task)
  }

  return {
    tasks: map(
      sortBy(values(store.tasks), (task) => -task.createdTime),
      serializeTask,
    ),
  }
}
