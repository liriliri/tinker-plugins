import { contextBridge } from 'electron'
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
    return synthesizeText(text, options, onProgress)
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
