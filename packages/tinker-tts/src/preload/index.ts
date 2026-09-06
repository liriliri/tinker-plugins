import { contextBridge } from 'electron'
import { errorMessage } from '../common/util'
import {
  copyAudio,
  listVoices,
  readAudioDataUrl,
  removeTempFile,
  requestCancelSynthesize,
  synthesizeText,
} from './tts'
import type {
  SynthesizeOptions,
  SynthesizeProgress,
  SynthesizeResult,
} from '../common/types'

const api = {
  listVoices() {
    return listVoices()
  },

  async synthesize(
    text: string,
    options: SynthesizeOptions,
    onProgress?: (progress: SynthesizeProgress) => void,
  ): Promise<SynthesizeResult> {
    try {
      return await synthesizeText(text, options, onProgress)
    } catch (err) {
      // contextBridge drops Error fields; reject with a plain string.
      throw errorMessage(err)
    }
  },

  cancelSynthesize() {
    requestCancelSynthesize()
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

contextBridge.exposeInMainWorld('tts', api)

declare global {
  const tts: typeof api
}
