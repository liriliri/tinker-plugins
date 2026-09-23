import fs from 'node:fs'
import os from 'node:os'
import some from 'licia/some'
import { CATALOG } from '../common/catalog'
import type { Backend, DownloadSource, PluginState } from '../common/types'
import { getStatePath } from './paths'

function defaultBackend(): Backend {
  return os.platform() === 'darwin' ? 'metal' : 'cpu'
}

const DEFAULT_STATE: PluginState = {
  backend: defaultBackend(),
  downloadSource: 'modelscope',
  selectedModelId: 'index-2.5-q8',
}

export function loadState(): PluginState {
  try {
    const raw = fs.readFileSync(getStatePath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<PluginState>
    return {
      backend: (parsed.backend as Backend) || DEFAULT_STATE.backend,
      downloadSource:
        (parsed.downloadSource as DownloadSource) ||
        DEFAULT_STATE.downloadSource,
      selectedModelId:
        parsed.selectedModelId &&
        some(CATALOG, (m) => m.id === parsed.selectedModelId)
          ? parsed.selectedModelId
          : DEFAULT_STATE.selectedModelId,
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveState(state: PluginState) {
  fs.writeFileSync(getStatePath(), JSON.stringify(state, null, 2), 'utf-8')
}

export function updateState(
  patch: Partial<PluginState> | ((prev: PluginState) => PluginState),
): PluginState {
  const prev = loadState()
  const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
  saveState(next)
  return next
}
