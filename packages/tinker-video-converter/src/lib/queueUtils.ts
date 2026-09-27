import isArr from 'licia/isArr'
import { storage } from 'tinker-share/store/Base'
import type {
  QueueItem,
  QueueStats,
  ConversionSettings,
  SourceFile,
} from '../types'
import { QueueItemStatus } from '../types'

const QUEUE_STORAGE_KEY = 'queue'

export function generateQueueItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function saveQueueToDisk(queue: QueueItem[]): void {
  storage.set(QUEUE_STORAGE_KEY, queue)
}

export function loadQueueFromDisk(): QueueItem[] {
  const data = storage.get(QUEUE_STORAGE_KEY)
  return isArr(data) ? (data as QueueItem[]) : []
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

export function shouldAutoStartNextJob(queue: QueueItem[]): boolean {
  const hasRunning = hasRunningJob(queue)
  const hasPending = hasPendingJobs(queue)
  return !hasRunning && hasPending
}
