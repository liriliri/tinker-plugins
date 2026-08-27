import { contextBridge } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { optimizer } from 'gltf-optimizer'
import type { OptimizeOptions } from '../common/types'

async function resolveSavePath(filePath: string): Promise<string> {
  try {
    await fs.access(filePath)
  } catch {
    return filePath
  }

  const { dir, name, ext } = path.parse(filePath)
  let index = 1

  while (true) {
    const candidate = path.join(dir, `${name} (${index})${ext}`)
    try {
      await fs.access(candidate)
      index++
    } catch {
      return candidate
    }
  }
}

const api = {
  async optimize(
    inputPath: string,
    outputPath: string,
    options: OptimizeOptions,
  ): Promise<string> {
    const input = await fs.readFile(inputPath)
    const result = await optimizer.node(new Uint8Array(input), {
      transform: {
        draco: { method: options.dracoMethod },
        simplify: {
          enabled: true,
          ratio: options.simplifyRatio,
        },
        texture: {
          resize: {
            resolution: options.textureResolution,
            filter: 'LANCZOS3',
          },
        },
      },
    })

    const finalPath = await resolveSavePath(outputPath)
    await fs.mkdir(path.dirname(finalPath), { recursive: true })
    await fs.writeFile(finalPath, result)
    return finalPath
  },
}

contextBridge.exposeInMainWorld('gltfOptimizer', api)

declare global {
  const gltfOptimizer: typeof api
}
