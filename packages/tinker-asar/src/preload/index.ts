import { contextBridge } from 'electron'
import {
  createDirectory,
  createFile,
  deleteEntry,
  extractFiles,
  getFilePreview,
  openAsar,
  saveAsar,
  updateFile,
} from './asar'
import type {
  CreateFileResult,
  DeleteEntryResult,
  ExtractFilesResult,
  FilePreviewResult,
  OpenAsarResult,
  SaveAsarResult,
  UpdateFileResult,
} from '../common/types'

const asarApi = {
  open: (path: string): Promise<OpenAsarResult> => openAsar(path),
  getPreview: (path: string): FilePreviewResult => getFilePreview(path),
  createFile: (path: string, content?: string): CreateFileResult =>
    createFile(path, content),
  createDirectory: (path: string): CreateFileResult => createDirectory(path),
  updateFile: (path: string, content: string): UpdateFileResult =>
    updateFile(path, content),
  deleteEntry: (path: string, isDirectory: boolean): DeleteEntryResult =>
    deleteEntry(path, isDirectory),
  extract: (paths: string[], outputDir: string): Promise<ExtractFilesResult> =>
    extractFiles(paths, outputDir),
  save: (): Promise<SaveAsarResult> => saveAsar(),
}

contextBridge.exposeInMainWorld('asarApi', asarApi)

declare global {
  const asarApi: typeof asarApi
}
