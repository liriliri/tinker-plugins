import { removeBackground as removeBackgroundRaw } from '@imgly/background-removal'
import type { BgRemoverProgress, ModelSize } from '../types'

/**
 * The web build hosts both the segmentation models and the onnxruntime-web
 * wasm on a CDN. Leave empty to use the URL baked into the package; set a
 * mirror to speed up the download.
 */
const RESOURCE_BASE_URL = ''

/** small/medium map to the fp16 and full ISNet models of the node build. */
const MODEL_MAP: Record<ModelSize, 'isnet_fp16' | 'isnet'> = {
  small: 'isnet_fp16',
  medium: 'isnet',
}

export async function removeBackground(
  image: Blob,
  model: ModelSize = 'medium',
  onProgress?: (progress: BgRemoverProgress) => void,
): Promise<Blob> {
  return removeBackgroundRaw(image, {
    ...(RESOURCE_BASE_URL ? { publicPath: RESOURCE_BASE_URL } : {}),
    model: MODEL_MAP[model],
    output: {
      format: 'image/png',
      quality: 0.8,
    },
    progress: (key, current, total) => {
      onProgress?.({
        stage: key.startsWith('fetch:') ? 'download' : 'inference',
        current,
        total,
      })
    },
  })
}
