import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import every from 'licia/every'
import map from 'licia/map'
import {
  getAsrModel,
  getModelDownloadItems,
  getRecognizerFiles,
  normalizeAsrModelId,
  SILERO_VAD_FILE,
} from '../common/models'
import type {
  AsrModelId,
  DownloadItem,
  ModelFileStatus,
  ModelsStatus,
} from '../common/types'

function getModelsDir(): string {
  return path.join(os.homedir(), '.tinker', 'models')
}

export function resolveModelId(modelId?: string): AsrModelId {
  return normalizeAsrModelId(modelId)
}

export function getModelDir(modelId: AsrModelId): string {
  return path.join(getModelsDir(), getAsrModel(modelId).relativeDir)
}

function getModelFilePath(modelId: AsrModelId, fileName: string): string {
  return path.join(getModelDir(modelId), fileName)
}

export function getSileroVadPath(): string {
  return path.join(getModelsDir(), SILERO_VAD_FILE)
}

export function ensureModelsDir(): string {
  const dir = getModelsDir()
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function resolveDownloadPath(item: DownloadItem): string {
  const modelsDir = getModelsDir()
  const saveDir = item.relativeDir
    ? path.join(modelsDir, item.relativeDir)
    : modelsDir
  fs.mkdirSync(saveDir, { recursive: true })
  return path.join(saveDir, item.fileName)
}

function exists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

export function getModelsStatus(modelId?: string): ModelsStatus {
  const id = resolveModelId(modelId)
  const model = getAsrModel(id)
  const modelsDir = getModelsDir()
  const items: ModelFileStatus[] = map(
    getRecognizerFiles(model.recognizer),
    (fileName) => ({
      id: `${id}:${fileName}`,
      name: fileName,
      ready: exists(getModelFilePath(id, fileName)),
      path: getModelFilePath(id, fileName),
    }),
  )

  items.push({
    id: 'silero-vad',
    name: 'Silero VAD',
    ready: exists(getSileroVadPath()),
    path: getSileroVadPath(),
  })

  return {
    modelsDir,
    modelId: id,
    ready: every(items, (item) => item.ready),
    items,
  }
}

export function getDownloadItems(modelId?: string) {
  return getModelDownloadItems(resolveModelId(modelId))
}

export function getTempDir(): string {
  const dir = path.join(os.tmpdir(), 'tinker-audio-transcriber')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}
