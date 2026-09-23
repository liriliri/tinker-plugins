import fs from 'node:fs'
import path from 'node:path'
import map from 'licia/map'
import {
  CATALOG,
  findModel,
  modelDownloadUrl,
  modelFileName,
  modelRelativeDir,
} from '../common/catalog'
import type {
  Backend,
  DownloadItem,
  DownloadSource,
  ModelPackage,
  ModelStatus,
} from '../common/types'
import { getModelsDir } from './paths'
import { loadState, updateState } from './state'

function existsFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

export function getExpectedModelPath(model: ModelPackage): string {
  return path.join(
    getModelsDir(),
    modelRelativeDir(model),
    modelFileName(model),
  )
}

export function resolveModelPath(modelId: string): string | null {
  const model = findModel(modelId)
  if (!model) return null
  const expected = getExpectedModelPath(model)
  return existsFile(expected) ? expected : null
}

export function listModels(): ModelStatus[] {
  return map(CATALOG, (pkg) => {
    const installedPath = getExpectedModelPath(pkg)
    const installed = existsFile(installedPath)
    return {
      ...pkg,
      installed,
      installedPath: installed ? installedPath : undefined,
    }
  })
}

export function getSettings() {
  const state = loadState()
  return {
    backend: state.backend,
    downloadSource: state.downloadSource,
    selectedModelId: state.selectedModelId,
  }
}

export function setBackend(backend: Backend) {
  return updateState({ backend })
}

export function setDownloadSource(source: DownloadSource) {
  return updateState({ downloadSource: source })
}

export function setSelectedModelId(id: string) {
  if (!findModel(id)) throw new Error('modelUnsupported')
  return updateState({ selectedModelId: id })
}

export function getDownloadItem(modelId: string): DownloadItem {
  const model = findModel(modelId)
  if (!model) throw new Error('modelUnsupported')
  const state = loadState()
  return {
    id: model.id,
    url: modelDownloadUrl(model, state.downloadSource),
    fileName: modelFileName(model),
    relativeDir: modelRelativeDir(model),
  }
}

export function resolveDownloadPath(item: DownloadItem): string {
  const modelsDir = getModelsDir()
  const saveDir = item.relativeDir
    ? path.join(modelsDir, item.relativeDir)
    : modelsDir
  fs.mkdirSync(saveDir, { recursive: true })
  return path.join(saveDir, item.fileName)
}
