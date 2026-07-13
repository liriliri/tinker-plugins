import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Model } from '@earendil-works/pi-ai'

function findPackageRoot(name: string): string {
  let current = __dirname
  for (;;) {
    const nested = path.join(current, 'node_modules', name)
    if (fs.existsSync(path.join(nested, 'package.json'))) {
      return nested
    }
    const sibling = path.join(current, name)
    if (
      path.basename(path.dirname(current)) === 'node_modules' &&
      fs.existsSync(path.join(sibling, 'package.json'))
    ) {
      return sibling
    }
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  throw new Error(`Cannot find package ${name}`)
}

export async function loadCodingTools(cwd: string) {
  const root = findPackageRoot('@earendil-works/pi-coding-agent')
  const toolsMod = await import(
    pathToFileURL(path.join(root, 'dist/core/tools/index.js')).href
  )
  return [
    toolsMod.createReadTool(cwd),
    toolsMod.createBashTool(cwd),
    toolsMod.createEditTool(cwd),
    toolsMod.createWriteTool(cwd),
  ]
}

export function createTinkerModel(
  provider: string,
  modelId: string,
): Model<'openai-completions'> {
  return {
    id: modelId,
    name: modelId,
    api: 'openai-completions',
    provider: provider as Model<'openai-completions'>['provider'],
    baseUrl: '',
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }
}
