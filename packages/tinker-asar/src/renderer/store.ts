import { makeAutoObservable } from 'mobx'
import contain from 'licia/contain'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import i18n from 'i18next'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import some from 'licia/some'
import sortBy from 'licia/sortBy'
import startWith from 'licia/startWith'
import BaseStore from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import type {
  AsarFileInfo,
  FilePreviewResult,
  PendingCreate,
  PendingDelete,
} from '../common/types'
import { getBasename } from '../common/format'
import { joinPath, validateEntryName } from '../common/path'
import { createMcpApi } from './mcp'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  asarPath: string | null = null
  files: AsarFileInfo[] = []
  virtualDirectories: string[] = []
  selectedPath: string | null = null
  preview: FilePreviewResult | null = null
  modifiedPaths = new Set<string>()
  isDirty = false
  loading = false
  saving = false
  extracting = false
  toastOpen = false
  toastMsg = ''
  pendingDelete: PendingDelete | null = null
  pendingCreate: PendingCreate | null = null
  createError: string | null = null
  lastCreatedPath: string | null = null

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  showToast(msg: string) {
    this.toastMsg = msg
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  private markModified(path: string) {
    const next = new Set(this.modifiedPaths)
    next.add(path)
    this.modifiedPaths = next
  }

  private unmarkModified(path: string) {
    if (!this.modifiedPaths.has(path)) {
      return
    }
    const next = new Set(this.modifiedPaths)
    next.delete(path)
    this.modifiedPaths = next
  }

  private clearModified() {
    this.modifiedPaths = new Set()
  }

  clearLastCreatedPath() {
    this.lastCreatedPath = null
  }

  private resetPackageState() {
    this.preview = null
    this.selectedPath = null
    this.clearModified()
    this.isDirty = false
    this.pendingDelete = null
    this.pendingCreate = null
    this.createError = null
    this.virtualDirectories = []
    this.lastCreatedPath = null
  }

  private sortFiles() {
    this.files = sortBy(this.files, (file) => file.path)
  }

  private fileExists(path: string): boolean {
    return some(this.files, (file) => file.path === path)
  }

  private directoryExists(path: string): boolean {
    if (contain(this.virtualDirectories, path)) {
      return true
    }

    return some(
      this.files,
      (file) => file.path === path || startWith(file.path, `${path}/`),
    )
  }

  private removeVirtualDirectoriesUnder(path: string) {
    this.virtualDirectories = filter(this.virtualDirectories, (dirPath) => {
      if (dirPath === path) {
        return false
      }
      if (startWith(path, `${dirPath}/`)) {
        return false
      }
      if (startWith(dirPath, `${path}/`)) {
        return false
      }
      return true
    })
  }

  private validationError(code: string | null): string | null {
    if (!code) {
      return null
    }

    switch (code) {
      case 'empty':
        return i18n.t('nameRequired')
      case 'invalidChars':
        return i18n.t('nameInvalidChars')
      case 'invalid':
        return i18n.t('nameInvalid')
      default:
        return i18n.t('createFailed')
    }
  }

  isUnpacked(path: string): boolean {
    return Boolean(find(this.files, (file) => file.path === path)?.unpacked)
  }

  async openDialog() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'asar', extensions: ['asar'] }],
    })

    if (result.canceled || !result.filePaths[0]) {
      return
    }

    await this.openFile(result.filePaths[0])
  }

  async openFile(
    path: string,
  ): Promise<{ success: true } | { success: false; error: string }> {
    this.loading = true
    this.resetPackageState()

    try {
      const result = await asarApi.open(path)
      if (!result.success) {
        this.asarPath = null
        this.files = []
        const error = result.error ?? i18n.t('unknownError')
        this.showToast(error)
        return { success: false, error }
      }

      this.asarPath = result.path ?? path
      this.files = result.files ?? []
      this.virtualDirectories = result.emptyDirectories ?? []
      if (this.files.length > 0) {
        this.selectFile(this.files[0].path)
      }
      return { success: true }
    } catch (error) {
      this.asarPath = null
      this.files = []
      const message = errorMessage(error)
      this.showToast(message)
      return { success: false, error: message }
    } finally {
      this.loading = false
    }
  }

  async extractFiles(paths: string[], outputDir: string): Promise<string[]> {
    const result = await asarApi.extract(paths, outputDir)
    if (!result.success || !result.extracted) {
      const message = result.error ?? i18n.t('extractFailed')
      this.showToast(message)
      throw new Error(message)
    }
    return result.extracted
  }

  async extractToDialog(paths: string[]) {
    if (!this.asarPath || this.extracting || isEmpty(paths)) {
      return
    }

    const result = await tinker.showOpenDialog({
      title: i18n.t('extractPickDir'),
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || !result.filePaths[0]) {
      return
    }

    this.extracting = true
    try {
      const extracted = await this.extractFiles(paths, result.filePaths[0])
      tinker.showNotification(
        i18n.t('extractDone', { count: extracted.length }),
      )
      tinker.showItemInPath(result.filePaths[0])
    } catch {
      // toast already shown in extractFiles
    } finally {
      this.extracting = false
    }
  }

  async extractAllToDialog() {
    if (!this.asarPath) {
      return
    }
    await this.extractToDialog(map(this.files, (file) => file.path))
  }

  selectFile(path: string) {
    this.selectedPath = path
    this.preview = asarApi.getPreview(path)
  }

  updateFileContent(path: string, content: string) {
    const result = asarApi.updateFile(path, content)
    if (!result.success) {
      return
    }

    this.isDirty = true
    this.markModified(path)

    const file = find(this.files, (item) => item.path === path)
    if (file && result.size != null) {
      file.size = result.size
    }

    if (this.selectedPath === path && this.preview?.type === 'text') {
      this.preview = {
        ...this.preview,
        content,
        size: result.size,
      }
    }
  }

  requestCreate(type: PendingCreate['type'], parentPath: string | null) {
    this.createError = null
    this.pendingCreate = { type, parentPath }
  }

  cancelCreate() {
    this.pendingCreate = null
    this.createError = null
  }

  clearCreateError() {
    this.createError = null
  }

  confirmCreate(name: string) {
    if (!this.pendingCreate) {
      return
    }

    const validation = this.validationError(validateEntryName(name))
    if (validation) {
      this.createError = validation
      return
    }

    const { type, parentPath } = this.pendingCreate
    const fullPath = joinPath(parentPath, name)

    if (this.fileExists(fullPath) || this.directoryExists(fullPath)) {
      this.createError = i18n.t('entryExists')
      return
    }

    this.pendingCreate = null
    this.createError = null

    if (type === 'file') {
      this.createFileEntry(fullPath)
    } else {
      this.createDirectoryEntry(fullPath)
    }
  }

  private createFileEntry(path: string) {
    const result = asarApi.createFile(path, '')
    if (!result.success || !result.path) {
      this.showToast(result.error ?? i18n.t('createFailed'))
      return
    }

    this.files.push({ path: result.path, size: result.size ?? 0 })
    this.sortFiles()
    this.removeVirtualDirectoriesUnder(result.path)
    this.isDirty = true
    this.markModified(result.path)
    this.lastCreatedPath = result.path
    this.selectFile(result.path)
  }

  private createDirectoryEntry(path: string) {
    const result = asarApi.createDirectory(path)
    if (!result.success || !result.path) {
      this.showToast(result.error ?? i18n.t('createFailed'))
      return
    }

    this.virtualDirectories = sortBy([...this.virtualDirectories, result.path])
    this.isDirty = true
    this.lastCreatedPath = result.path
  }

  requestDelete(path: string, isDirectory: boolean, name: string) {
    this.pendingDelete = { path, isDirectory, name }
  }

  cancelDelete() {
    this.pendingDelete = null
  }

  confirmDelete() {
    if (!this.pendingDelete) {
      return
    }

    const { path, isDirectory } = this.pendingDelete
    this.pendingDelete = null
    this.deleteEntry(path, isDirectory)
  }

  deleteEntry(path: string, isDirectory: boolean) {
    const wasVirtualOnly = isDirectory && contain(this.virtualDirectories, path)

    const result = asarApi.deleteEntry(path, isDirectory)
    if (!result.success) {
      this.showToast(result.error ?? i18n.t('deleteFailed'))
      return
    }

    if (wasVirtualOnly && isEmpty(result.deleted)) {
      this.virtualDirectories = filter(
        this.virtualDirectories,
        (dirPath) => dirPath !== path && !startWith(dirPath, `${path}/`),
      )
      this.isDirty = true
      return
    }

    if (isEmpty(result.deleted)) {
      this.showToast(result.error ?? i18n.t('deleteFailed'))
      return
    }

    const deleted = result.deleted!
    const deletedSet = new Set(deleted)
    this.files = filter(this.files, (file) => !deletedSet.has(file.path))
    this.virtualDirectories = filter(this.virtualDirectories, (dirPath) => {
      if (dirPath === path || startWith(dirPath, `${path}/`)) {
        return false
      }
      if (deletedSet.has(dirPath)) {
        return false
      }
      return !some(deleted, (deletedPath) =>
        startWith(dirPath, `${deletedPath}/`),
      )
    })

    each(deleted, (filePath) => {
      this.unmarkModified(filePath)
    })

    this.isDirty = true

    if (this.selectedPath && deletedSet.has(this.selectedPath)) {
      if (!isEmpty(this.files)) {
        this.selectFile(this.files[0].path)
      } else {
        this.selectedPath = null
        this.preview = null
      }
    }
  }

  async save() {
    if (!this.isDirty || this.saving) {
      return
    }

    this.saving = true

    try {
      const result = await asarApi.save()
      if (!result.success) {
        this.showToast(result.error ?? i18n.t('saveFailed'))
        return
      }

      this.isDirty = false
      this.clearModified()
      tinker.showNotification(
        this.asarPath ? getBasename(this.asarPath) : i18n.t('saved'),
      )
    } catch (error) {
      this.showToast(errorMessage(error))
    } finally {
      this.saving = false
    }
  }
}

const store = new Store()

export default store
