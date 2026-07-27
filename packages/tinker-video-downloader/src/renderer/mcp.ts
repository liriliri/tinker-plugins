import type { Store } from './store'
import type { TaskData } from './types'
import map from 'licia/map'
import filter from 'licia/filter'
import trim from 'licia/trim'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'query') {
      return query(getStore(), args as { url: string })
    }
    if (name === 'download') {
      return download(
        getStore(),
        args as { formatId?: string; downloadPath?: string },
      )
    }
    if (name === 'get_progress') {
      return getProgress(getStore(), args as { taskId?: string })
    }
    throw new Error(`Unknown tool "${name}"`)
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
    id: info.id,
    thumbnail: info.thumbnail,
    duration: info.duration,
    uploader: info.uploader,
    formats: info.formats,
    selectedFormatId: store.selectedFormat?.formatId,
  }
}

async function download(
  store: Store,
  args: { formatId?: string; downloadPath?: string },
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

  if (args.formatId) {
    const format = store.videoInfo.formats.find(
      (f) => f.formatId === args.formatId,
    )
    if (!format) {
      throw new Error(`Unknown formatId: ${args.formatId}`)
    }
    store.setSelectedFormat(format)
  }

  if (!store.selectedFormat) {
    throw new Error('No format selected')
  }

  const beforeIds = new Set(store.tasks.keys())
  await store.startDownload({
    downloadPath: downloadPath || undefined,
  })

  const newIds = filter([...store.tasks.keys()], (id) => !beforeIds.has(id))
  if (newIds.length === 0) {
    throw new Error('No download tasks were created')
  }

  const taskId = newIds[0]
  const task = store.tasks.get(taskId)

  return {
    taskId,
    title: task?.title,
    status: task?.status,
    progress: task?.progress ?? 0,
    outputPath: task?.outputPath,
  }
}

function serializeTask(task: TaskData) {
  return {
    taskId: task.id,
    title: task.title,
    status: task.status,
    progress: task.progress,
    speed: task.speed,
    eta: task.eta,
    outputPath: task.outputPath,
    qualityLabel: task.qualityLabel,
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

  const tasks = map(
    [...store.tasks.values()].sort((a, b) => b.createdTime - a.createdTime),
    serializeTask,
  )

  return { tasks }
}
