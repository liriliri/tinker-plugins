import { contextBridge } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { requestCancelTranscribe, transcribeWav } from './asr'
import {
  ensureModelsDir,
  getDownloadItems,
  getModelsStatus,
  getTempDir,
  resolveDownloadPath,
} from './models'
import type {
  DownloadItem,
  TranscribeProgress,
  TranscriptResult,
} from '../common/types'

const api = {
  getModelsStatus(modelId?: string) {
    ensureModelsDir()
    return getModelsStatus(modelId)
  },

  getDownloadItems(modelId?: string) {
    return getDownloadItems(modelId)
  },

  resolveDownloadSaveDir(item: DownloadItem): string {
    return path.dirname(resolveDownloadPath(item))
  },

  async createTempPath(fileName: string): Promise<string> {
    return path.join(getTempDir(), fileName)
  },

  async removeTempFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath)
    } catch {
      // ignore
    }
  },

  async transcribe(
    wavPath: string,
    onProgress?: (progress: TranscribeProgress) => void,
    modelId?: string,
  ): Promise<TranscriptResult> {
    return transcribeWav(wavPath, onProgress, modelId)
  },

  cancelTranscribe() {
    requestCancelTranscribe()
  },
}

contextBridge.exposeInMainWorld('audioTranscriber', api)

declare global {
  const audioTranscriber: typeof api
}
