import type {
  QueueItem,
  QueueStats,
  ConversionSettings,
  SourceFile,
} from '../types'
import { QueueItemStatus } from '../types'

const QUEUE_STORAGE_KEY = 'tinker-video-converter:queue'

export function generateQueueItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function saveQueueToDisk(queue: QueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.error('Failed to save queue to disk:', err)
  }
}

export function loadQueueFromDisk(): QueueItem[] {
  try {
    const data = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data) as QueueItem[]
  } catch (err) {
    console.error('Failed to load queue from disk:', err)
    return []
  }
}

export function calculateQueueStats(queue: QueueItem[]): QueueStats {
  const stats: QueueStats = {
    total: queue.length,
    pending: 0,
    inProgress: 0,
    done: 0,
    failed: 0,
    canceled: 0,
  }

  for (const item of queue) {
    switch (item.status) {
      case QueueItemStatus.PENDING:
        stats.pending++
        break
      case QueueItemStatus.IN_PROGRESS:
        stats.inProgress++
        break
      case QueueItemStatus.DONE:
        stats.done++
        break
      case QueueItemStatus.FAILED:
        stats.failed++
        break
      case QueueItemStatus.CANCELED:
        stats.canceled++
        break
    }
  }

  return stats
}

export function getNextPendingJob(queue: QueueItem[]): QueueItem | null {
  return queue.find((item) => item.status === QueueItemStatus.PENDING) || null
}

export function findQueueItemById(
  queue: QueueItem[],
  id: string,
): QueueItem | null {
  return queue.find((item) => item.id === id) || null
}

export function findQueueItemIndexById(queue: QueueItem[], id: string): number {
  return queue.findIndex((item) => item.id === id)
}

export function getCurrentlyRunningJob(queue: QueueItem[]): QueueItem | null {
  return (
    queue.find((item) => item.status === QueueItemStatus.IN_PROGRESS) || null
  )
}

export function hasRunningJob(queue: QueueItem[]): boolean {
  return queue.some((item) => item.status === QueueItemStatus.IN_PROGRESS)
}

export function hasPendingJobs(queue: QueueItem[]): boolean {
  return queue.some((item) => item.status === QueueItemStatus.PENDING)
}

export function createQueueItem(
  sourceFile: SourceFile,
  settings: ConversionSettings,
): QueueItem {
  return {
    id: generateQueueItemId(),
    sourceFile,
    settings,
    status: QueueItemStatus.PENDING,
    progress: null,
    error: null,
    outputPath: null,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
  }
}

export function getConversionDuration(item: QueueItem): number {
  if (item.startedAt === null || item.completedAt === null) {
    return 0
  }
  return item.completedAt - item.startedAt
}

export function shouldAutoStartNextJob(queue: QueueItem[]): boolean {
  const hasRunning = hasRunningJob(queue)
  const hasPending = hasPendingJobs(queue)
  return !hasRunning && hasPending
}

export function getQueueSummaryString(stats: QueueStats): string {
  if (stats.total === 0) {
    return 'Queue empty'
  }
  return `Queue: ${stats.inProgress + stats.pending}/${stats.total}`
}
