import { contextBridge } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { OptimizeOptions } from '../common/types'
import { optimizeGltf } from './optimize'

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
    const result = await optimizeGltf(new Uint8Array(input), options)

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
