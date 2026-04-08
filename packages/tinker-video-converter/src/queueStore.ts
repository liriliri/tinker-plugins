import { makeAutoObservable } from 'mobx'
import type {
  QueueItem,
  ConversionSettings,
  ConversionProgress,
  SourceFile,
  QueueStats,
} from './types'
import { QueueItemStatus } from './types'
import {
  generateQueueItemId,
  saveQueueToDisk,
  loadQueueFromDisk,
  calculateQueueStats,
  getNextPendingJob,
  findQueueItemById,
  findQueueItemIndexById,
  getCurrentlyRunningJob,
  hasRunningJob,
  hasPendingJobs,
  createQueueItem,
  shouldAutoStartNextJob,
} from './lib/queueUtils'

class QueueStore {
  items: QueueItem[] = []
  isQueueVisible = false
  isPaused = false
  currentActiveTab: 'queue' | 'stats' | 'logs' = 'queue'

  constructor() {
    makeAutoObservable(this)
    this.loadQueue()
  }

  get stats(): QueueStats {
    return calculateQueueStats(this.items)
  }

  get currentJob(): QueueItem | null {
    return getCurrentlyRunningJob(this.items)
  }

  get nextPendingJob(): QueueItem | null {
    return getNextPendingJob(this.items)
  }

  get hasRunning(): boolean {
    return hasRunningJob(this.items)
  }

  get hasPending(): boolean {
    return hasPendingJobs(this.items)
  }

  get isEmpty(): boolean {
    return this.items.length === 0
  }

  get shouldAutoStart(): boolean {
    return shouldAutoStartNextJob(this.items)
  }

  get canStartQueue(): boolean {
    return this.hasPending && !this.hasRunning && !this.isPaused
  }

  get canPauseQueue(): boolean {
    return this.hasRunning && !this.isPaused
  }

  get canResumeQueue(): boolean {
    return this.hasRunning && this.isPaused
  }

  addItem(sourceFile: SourceFile, settings: ConversionSettings): QueueItem {
    const item = createQueueItem(sourceFile, settings)
    this.items.push(item)
    this.saveQueue()
    return item
  }

  removeItem(id: string): boolean {
    const index = findQueueItemIndexById(this.items, id)
    if (index === -1) return false

    const item = this.items[index]
    if (item.status === QueueItemStatus.IN_PROGRESS) {
      return false
    }

    this.items.splice(index, 1)
    this.saveQueue()
    return true
  }

  moveItem(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.items.length) return false
    if (toIndex < 0 || toIndex >= this.items.length) return false
    if (fromIndex === toIndex) return true

    const [item] = this.items.splice(fromIndex, 1)
    this.items.splice(toIndex, 0, item)
    this.saveQueue()
    return true
  }

  updateItemStatus(id: string, status: QueueItemStatus): boolean {
    const item = findQueueItemById(this.items, id)
    if (!item) return false

    item.status = status

    if (status === QueueItemStatus.IN_PROGRESS && item.startedAt === null) {
      item.startedAt = Date.now()
    }
    if (
      (status === QueueItemStatus.DONE ||
        status === QueueItemStatus.FAILED ||
        status === QueueItemStatus.CANCELED) &&
      item.completedAt === null
    ) {
      item.completedAt = Date.now()
    }

    this.saveQueue()
    return true
  }

  updateItemProgress(id: string, progress: ConversionProgress): boolean {
    const item = findQueueItemById(this.items, id)
    if (!item) return false
    item.progress = progress
    return true
  }

  updateItemError(id: string, error: string): boolean {
    const item = findQueueItemById(this.items, id)
    if (!item) return false
    item.error = error
    return true
  }

  updateItemOutputPath(id: string, outputPath: string): boolean {
    const item = findQueueItemById(this.items, id)
    if (!item) return false
    item.outputPath = outputPath
    return true
  }

  completeItem(id: string, outputPath: string): boolean {
    const item = findQueueItemById(this.items, id)
    if (!item) return false
    item.status = QueueItemStatus.DONE
    item.outputPath = outputPath
    if (item.completedAt === null) {
      item.completedAt = Date.now()
    }
    this.saveQueue()
    return true
  }

  failItem(id: string, error: string): boolean {
    const item = findQueueItemById(this.items, id)
    if (!item) return false
    item.status = QueueItemStatus.FAILED
    item.error = error
    if (item.completedAt === null) {
      item.completedAt = Date.now()
    }
    this.saveQueue()
    return true
  }

  clearQueue(): void {
    this.items = []
    this.saveQueue()
  }

  removeCompletedItems(): void {
    this.items = this.items.filter(
      (item) => item.status !== QueueItemStatus.DONE,
    )
    this.saveQueue()
  }

  removeFailedItems(): void {
    this.items = this.items.filter(
      (item) => item.status !== QueueItemStatus.FAILED,
    )
    this.saveQueue()
  }

  resetFailedItems(): void {
    for (const item of this.items) {
      if (item.status === QueueItemStatus.FAILED) {
        item.status = QueueItemStatus.PENDING
        item.error = null
        item.progress = null
        item.startedAt = null
        item.completedAt = null
      }
    }
    this.saveQueue()
  }

  resetAllItems(): void {
    for (const item of this.items) {
      item.status = QueueItemStatus.PENDING
      item.error = null
      item.progress = null
      item.startedAt = null
      item.completedAt = null
    }
    this.saveQueue()
  }

  pauseQueue(): void {
    this.isPaused = true
  }

  resumeQueue(): void {
    this.isPaused = false
  }

  toggleQueueVisibility(): void {
    this.isQueueVisible = !this.isQueueVisible
  }

  setActiveTab(tab: 'queue' | 'stats' | 'logs'): void {
    this.currentActiveTab = tab
  }

  private saveQueue(): void {
    saveQueueToDisk(this.items)
  }

  private loadQueue(): void {
    this.items = loadQueueFromDisk()
  }
}

export default new QueueStore()
