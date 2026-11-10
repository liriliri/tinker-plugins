import { contextBridge } from 'electron'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import contain from 'licia/contain'
import startWith from 'licia/startWith'
import { errorMessage } from 'tinker-share/lib/util'
import type {
  DownloadItem,
  DownloadSource,
  GenerateOptions,
  GenerateProgress,
  GenerateResult,
} from '../common/types'
import { generateSound, requestCancelGenerate, stopEngine } from './engine'
import {
  getDownloadItem,
  getSettings,
  listModels,
  resolveDownloadPath,
  setDownloadSource,
  setSelectedModelId,
} from './models'
import { getTempDir } from './paths'

function readAudioDataUrl(filePath: string, mimeType: string): string {
  const buf = fs.readFileSync(filePath)
  return `data:${mimeType};base64,${buf.toString('base64')}`
}

async function copyAudio(srcPath: string, destPath: string) {
  await fsp.copyFile(srcPath, destPath)
}

async function removeTempFile(filePath: string) {
  const tempRoot = path.resolve(getTempDir())
  const resolved = path.resolve(filePath)
  if (!startWith(resolved, tempRoot + path.sep) && resolved !== tempRoot) {
    if (
      !contain(
        resolved,
        `${path.sep}.tinker${path.sep}tinker-sound-effect${path.sep}`,
      )
    ) {
      return
    }
  }
  await fsp.unlink(resolved).catch(() => undefined)
}

const api = {
  listModels() {
    return listModels()
  },

  getSettings() {
    return getSettings()
  },

  setDownloadSource(source: DownloadSource) {
    return setDownloadSource(source)
  },

  setSelectedModelId(id: string) {
    return setSelectedModelId(id)
  },

  getDownloadItem(modelId: string) {
    return getDownloadItem(modelId)
  },

  resolveDownloadSaveDir(item: DownloadItem): string {
    return path.dirname(resolveDownloadPath(item))
  },

  async generate(
    options: GenerateOptions,
    onProgress?: (progress: GenerateProgress) => void,
  ): Promise<GenerateResult> {
    try {
      return await generateSound(options, onProgress)
    } catch (err) {
      throw errorMessage(err)
    }
  },

  cancelGenerate() {
    requestCancelGenerate()
  },

  stopEngine() {
    stopEngine()
  },

  readAudioDataUrl(filePath: string, mimeType: string): string {
    return readAudioDataUrl(filePath, mimeType)
  },

  async saveAudio(srcPath: string, destPath: string): Promise<void> {
    await copyAudio(srcPath, destPath)
  },

  async removeTempFile(filePath: string): Promise<void> {
    await removeTempFile(filePath)
  },
}

contextBridge.exposeInMainWorld('soundEffect', api)

declare global {
  const soundEffect: typeof api
}
