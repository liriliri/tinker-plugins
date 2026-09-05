import { contextBridge } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import dataUrl from 'licia/dataUrl'
import endWith from 'licia/endWith'
import startWith from 'licia/startWith'
import {
  isModelId,
  type InstalledModel,
  type Live2dApi,
  type ModelFormat,
  type ModelPreviewInfo,
  type ModelWindowPayload,
} from '../common/types'

const STORAGE_DIRECTORY_NAME = 'tinker-live2d'
const META_FILE = 'meta.json'
const THUMBNAIL_FILE = 'thumbnail.png'

function assertModelId(id: string) {
  if (!isModelId(id)) {
    throw new Error('Invalid model id')
  }
}

function isModel3(name: string) {
  return endWith(name, '.model3.json')
}

/** Cubism 2 settings: model.json / *.model.json / index.json (web/Bilibili packs). */
function isModel2Candidate(name: string) {
  return (
    name === 'model.json' ||
    name === 'index.json' ||
    endWith(name, '.model.json')
  )
}

function detectFormat(fileName: string): ModelFormat {
  return isModel3(fileName) ? 'model3' : 'model2'
}

/** index.json is common elsewhere — only treat as Live2D when it looks like settings. */
async function isLive2dModel2File(filePath: string): Promise<boolean> {
  const name = path.basename(filePath)
  if (name === 'model.json' || endWith(name, '.model.json')) return true
  if (name !== 'index.json') return false
  try {
    const raw = await fsp.readFile(filePath, 'utf-8')
    const json = JSON.parse(raw) as Record<string, unknown>
    if (!json || typeof json !== 'object') return false
    if (json.type === 'Live2D Model Setting') return true
    return typeof json.model === 'string' && Array.isArray(json.textures)
  } catch {
    return false
  }
}

async function readModel2DisplayName(
  modelJsonPath: string,
  fallback: string,
): Promise<string> {
  try {
    const raw = await fsp.readFile(modelJsonPath, 'utf-8')
    const json = JSON.parse(raw) as Record<string, unknown>
    for (const key of ['label', 'name'] as const) {
      const value = json[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  } catch {
    // ignore
  }
  return fallback
}

async function getStorageRoot(): Promise<string> {
  const root = path.join(homedir(), '.tinker', STORAGE_DIRECTORY_NAME)
  fs.mkdirSync(root, { recursive: true })
  return root
}

async function getModelsRoot(): Promise<string> {
  const root = path.join(await getStorageRoot(), 'models')
  fs.mkdirSync(root, { recursive: true })
  return root
}

async function getPreviewRoot(): Promise<string> {
  const root = path.join(await getStorageRoot(), '.preview')
  fs.mkdirSync(root, { recursive: true })
  return root
}

async function walkForModelFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  let entries
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true })
  } catch {
    return results
  }
  for (const entry of entries) {
    if (startWith(entry.name, '.') || entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await walkForModelFiles(full)))
    } else if (isModel3(entry.name)) {
      results.push(full)
    } else if (isModel2Candidate(entry.name)) {
      // Prefer model.json over index.json in the same folder.
      if (
        entry.name === 'index.json' &&
        fs.existsSync(path.join(dir, 'model.json'))
      ) {
        continue
      }
      if (await isLive2dModel2File(full)) results.push(full)
    }
  }
  return results
}

async function resolveModelJsonPaths(inputPath: string): Promise<string[]> {
  let stats
  try {
    stats = await fsp.stat(inputPath)
  } catch {
    return []
  }
  if (stats.isFile()) {
    const name = path.basename(inputPath)
    if (isModel3(name)) return [inputPath]
    if (isModel2Candidate(name) && (await isLive2dModel2File(inputPath))) {
      return [inputPath]
    }
    return []
  }
  if (stats.isDirectory()) return walkForModelFiles(inputPath)
  return []
}

function describeModel(modelJsonPath: string) {
  const format = detectFormat(path.basename(modelJsonPath))
  const sourceDir = path.dirname(modelJsonPath)
  const folderName = path.basename(sourceDir)
  const modelName =
    format === 'model3'
      ? path.basename(modelJsonPath, '.model3.json')
      : folderName
  const expectedJson =
    format === 'model3'
      ? `${modelName}.model3.json`
      : path.basename(modelJsonPath)
  const needsStage =
    format === 'model3' &&
    (folderName !== modelName || path.basename(modelJsonPath) !== expectedJson)
  return { format, sourceDir, folderName, modelName, needsStage, expectedJson }
}

function toFileUrl(filePath: string) {
  return pathToFileURL(filePath).href
}

function parentDirUrl(dirPath: string) {
  return toFileUrl(dirPath).replace(/\/?$/, '')
}

async function buildPreviewInfo(
  modelJsonPath: string,
): Promise<ModelPreviewInfo> {
  const desc = describeModel(modelJsonPath)
  const displayName =
    desc.format === 'model2'
      ? await readModel2DisplayName(
          modelJsonPath,
          desc.modelName || desc.folderName,
        )
      : desc.modelName || desc.folderName
  if (desc.format === 'model2' || !desc.needsStage) {
    return {
      sourcePath: modelJsonPath,
      displayName,
      format: desc.format,
      modelUrl: toFileUrl(modelJsonPath),
      basePath: parentDirUrl(path.dirname(desc.sourceDir)),
      modelName: desc.modelName || desc.folderName,
    }
  }

  const previewRoot = await getPreviewRoot()
  const stageId = crypto.randomUUID()
  const stageRoot = path.join(previewRoot, stageId)
  const stagedModelDir = path.join(stageRoot, desc.modelName)
  await fsp.mkdir(stageRoot, { recursive: true })
  await fsp.cp(desc.sourceDir, stagedModelDir, { recursive: true })
  const current = path.basename(modelJsonPath)
  if (current !== desc.expectedJson) {
    const from = path.join(stagedModelDir, current)
    const to = path.join(stagedModelDir, desc.expectedJson)
    if (fs.existsSync(from) && !fs.existsSync(to)) {
      await fsp.rename(from, to)
    }
  }
  const stagedJson = path.join(stagedModelDir, desc.expectedJson)
  return {
    sourcePath: modelJsonPath,
    displayName,
    format: desc.format,
    modelUrl: toFileUrl(stagedJson),
    basePath: parentDirUrl(stageRoot),
    modelName: desc.modelName,
  }
}

function parseThumbnail(input: string): Buffer | null {
  const parsed = dataUrl.parse(input)
  if (!parsed?.base64 || !parsed.data) return null
  try {
    return Buffer.from(parsed.data, 'base64')
  } catch {
    return null
  }
}

async function installModel(
  sourcePath: string,
  thumbnailDataUrl?: string | null,
  displayName?: string | null,
): Promise<InstalledModel> {
  const modelsRoot = await getModelsRoot()
  const resolved = path.resolve(sourcePath)
  const stats = await fsp.stat(resolved).catch(() => null)
  if (!stats?.isFile()) throw new Error('Model file not found')

  const desc = describeModel(resolved)
  const modelName = desc.modelName || desc.folderName
  const label = (displayName || '').trim() || modelName
  const id = crypto.randomUUID()
  const destRoot = path.join(modelsRoot, id)
  const tmpRoot = path.join(modelsRoot, `.${id}.install`)

  try {
    await fsp.mkdir(tmpRoot, { recursive: true })
    const tmpModelDir = path.join(tmpRoot, modelName)
    await fsp.cp(desc.sourceDir, tmpModelDir, { recursive: true })

    if (desc.format === 'model3') {
      const current = path.basename(resolved)
      if (current !== desc.expectedJson) {
        const from = path.join(tmpModelDir, current)
        const to = path.join(tmpModelDir, desc.expectedJson)
        if (fs.existsSync(from) && !fs.existsSync(to)) {
          await fsp.rename(from, to)
        }
      }
    }

    const modelFileName =
      desc.format === 'model3'
        ? path.join(modelName, desc.expectedJson)
        : path.join(modelName, path.basename(resolved))

    if (thumbnailDataUrl) {
      const buffer = parseThumbnail(thumbnailDataUrl)
      if (buffer) {
        await fsp.writeFile(path.join(tmpRoot, THUMBNAIL_FILE), buffer)
      }
    }

    const meta: InstalledModel = {
      id,
      displayName: label,
      format: desc.format,
      modelFileName: modelFileName.split(path.sep).join('/'),
      installedAt: new Date().toISOString(),
    }
    await fsp.writeFile(
      path.join(tmpRoot, META_FILE),
      JSON.stringify(meta, null, 2),
      'utf-8',
    )

    await fsp.rename(tmpRoot, destRoot)
    const thumbnailPath = path.join(destRoot, THUMBNAIL_FILE)
    return {
      ...meta,
      modelUrl: toFileUrl(path.join(destRoot, meta.modelFileName)),
      thumbnailUrl: fs.existsSync(thumbnailPath)
        ? toFileUrl(thumbnailPath)
        : null,
    }
  } catch (error) {
    await fsp.rm(tmpRoot, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

async function readMeta(dir: string): Promise<InstalledModel | null> {
  try {
    const raw = await fsp.readFile(path.join(dir, META_FILE), 'utf-8')
    const meta = JSON.parse(raw) as InstalledModel & { slug?: string }
    const id = meta.id || meta.slug
    if (!id || !meta?.modelFileName) return null
    const modelPath = path.join(dir, meta.modelFileName)
    if (!fs.existsSync(modelPath)) return null
    const thumbnailPath = path.join(dir, THUMBNAIL_FILE)
    return {
      ...meta,
      id,
      modelUrl: toFileUrl(modelPath),
      thumbnailUrl: fs.existsSync(thumbnailPath)
        ? toFileUrl(thumbnailPath)
        : null,
    }
  } catch {
    return null
  }
}

async function listModels(): Promise<InstalledModel[]> {
  const modelsRoot = await getModelsRoot()
  const entries = await fsp.readdir(modelsRoot, { withFileTypes: true })
  const models: InstalledModel[] = []
  for (const entry of entries) {
    if (!entry.isDirectory() || startWith(entry.name, '.')) continue
    const meta = await readMeta(path.join(modelsRoot, entry.name))
    if (meta) models.push(meta)
  }
  models.sort((a, b) => b.installedAt.localeCompare(a.installedAt))
  return models
}

async function resolveModels(paths: string[]): Promise<ModelPreviewInfo[]> {
  const jsonPaths = new Set<string>()
  for (const input of paths) {
    for (const found of await resolveModelJsonPaths(input)) {
      jsonPaths.add(path.resolve(found))
    }
  }
  if (jsonPaths.size === 0) {
    throw new Error(
      'No Live2D model found (.model3.json / model.json / index.json)',
    )
  }
  if (jsonPaths.size > 1) {
    throw new Error('ONLY_ONE_MODEL')
  }
  const jsonPath = [...jsonPaths][0]
  return [await buildPreviewInfo(jsonPath)]
}

async function clearPreviewStaging(): Promise<void> {
  const previewRoot = await getPreviewRoot()
  await fsp.rm(previewRoot, { recursive: true, force: true }).catch(() => {})
}

async function uninstallModel(id: string): Promise<void> {
  assertModelId(id)
  const dir = path.join(await getModelsRoot(), id)
  await fsp.rm(dir, { recursive: true, force: true })
}

async function getModelWindowPayload(id: string): Promise<ModelWindowPayload> {
  assertModelId(id)
  const modelsRoot = await getModelsRoot()
  const dir = path.join(modelsRoot, id)
  const model = await readMeta(dir)
  if (!model) throw new Error('Model not found')

  const modelPath = path.join(dir, model.modelFileName)
  const modelDir = path.dirname(modelPath)
  const modelName = path.basename(modelDir)

  return {
    model,
    modelUrl: toFileUrl(modelPath),
    basePath: parentDirUrl(path.dirname(modelDir)),
    modelName,
    format: model.format,
  }
}

const api: Live2dApi = {
  listModels,
  resolveModels,
  installModel,
  uninstallModel,
  getModelWindowPayload,
  clearPreviewStaging,
}

contextBridge.exposeInMainWorld('live2d', api)

declare global {
  const live2d: typeof api
}
