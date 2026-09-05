export type ModelFormat = 'model3' | 'model2'

export interface InstalledModel {
  /** UUID directory name under ~/.tinker/tinker-live2d/models/ */
  id: string
  displayName: string
  format: ModelFormat
  /** Relative path from model root to entry json (e.g. Haru/Haru.model3.json) */
  modelFileName: string
  /** file:// URL to the entry json */
  modelUrl?: string
  /** file:// URL to thumbnail.png when present */
  thumbnailUrl?: string | null
  installedAt: string
}

export interface ModelPreviewInfo {
  /** Absolute path to the source model json */
  sourcePath: string
  displayName: string
  format: ModelFormat
  modelUrl: string
  basePath: string
  modelName: string
}

export interface ModelWindowPayload {
  model: InstalledModel
  /** Absolute file:// URL to entry json */
  modelUrl: string
  /** file:// base path for Live2dV3 (parent of model folder) */
  basePath: string
  /** Folder / stem name expected by Live2dV3 */
  modelName: string
  format: ModelFormat
}

export interface PetStorage {
  activeId: string | null
  enabled: boolean
  scale: number
  opacity: number
  alwaysOnTop: boolean
  position: { x: number; y: number } | null
}

export const DEFAULT_STORAGE: PetStorage = {
  activeId: null,
  enabled: false,
  scale: 0.85,
  opacity: 1,
  alwaysOnTop: true,
  position: null,
}

export type PetOverlay = 'settings' | 'preview'

const MODEL_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LEGACY_MODEL_ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/

/** Accepts current UUID ids and older slug-style ids. */
export function isModelId(value: string) {
  return MODEL_ID_RE.test(value) || LEGACY_MODEL_ID_RE.test(value)
}

export interface Live2dApi {
  listModels(): Promise<InstalledModel[]>
  resolveModels(paths: string[]): Promise<ModelPreviewInfo[]>
  installModel(
    sourcePath: string,
    thumbnailDataUrl?: string | null,
    displayName?: string | null,
  ): Promise<InstalledModel>
  uninstallModel(id: string): Promise<void>
  getModelWindowPayload(id: string): Promise<ModelWindowPayload>
  clearPreviewStaging(): Promise<void>
}
