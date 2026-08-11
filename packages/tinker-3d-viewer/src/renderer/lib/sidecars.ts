import each from 'licia/each'
import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import last from 'licia/last'
import lowerCase from 'licia/lowerCase'
import ltrim from 'licia/ltrim'
import map from 'licia/map'
import normalizePath from 'licia/normalizePath'
import rtrim from 'licia/rtrim'
import some from 'licia/some'
import sortBy from 'licia/sortBy'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import unique from 'licia/unique'
import {
  getBaseName,
  getExtension,
  isModelFileName,
  isTextureFileName,
  MODEL_EXTENSIONS,
} from './formats'

function dirname(filePath: string): string {
  return rtrim(splitPath(filePath).dir, '/\\')
}

function joinPath(dir: string, rel: string): string {
  const left = rtrim(normalizePath(dir), '/')
  const right = ltrim(normalizePath(rel), '/')
  return left ? `${left}/${right}` : right
}

/** Load a model path (file or directory) and referenced sidecars. */
export async function filesFromPath(filePath: string): Promise<File[]> {
  const stat = await tinker.fstat(filePath)
  if (stat.isDirectory) {
    const modelPath = await findModelInDirectory(filePath)
    if (!modelPath) {
      throw new Error('noModelInFolder')
    }
    return filesFromModelPath(modelPath)
  }
  return filesFromModelPath(filePath)
}

async function filesFromModelPath(modelPath: string): Promise<File[]> {
  const fileName = getBaseName(modelPath)
  const buffer = (await tinker.readFile(modelPath)) as unknown as ArrayBuffer
  const main = new File([buffer], fileName)
  const ext = getExtension(fileName)

  if (ext === 'gltf') {
    return expandGltfSidecars(main, modelPath)
  }

  if (ext === 'obj') {
    return expandObjSidecars(main, modelPath)
  }

  if (ext === 'fbx' || ext === 'dae' || ext === '3mf') {
    return expandTextureCompanions(main, modelPath)
  }

  return [main]
}

async function expandGltfSidecars(
  gltfFile: File,
  gltfPath: string,
): Promise<File[]> {
  const gltfBuffer = await gltfFile.arrayBuffer()
  const text = new TextDecoder().decode(gltfBuffer)
  let json: {
    images?: { uri?: string }[]
    buffers?: { uri?: string }[]
  }
  try {
    json = JSON.parse(text)
  } catch {
    return [new File([gltfBuffer], getBaseName(gltfPath))]
  }

  const uris = unique(
    filter(
      map(
        [...(json.buffers || []), ...(json.images || [])],
        (item) => item.uri,
      ),
      (uri): uri is string => !!uri && !isDataUri(uri),
    ),
    (a, b) => lowerCase(getBaseName(a)) === lowerCase(getBaseName(b)),
  )

  const dir = dirname(gltfPath)
  const files: File[] = [new File([gltfBuffer], getBaseName(gltfPath))]

  for (const uri of uris) {
    try {
      const buffer = (await tinker.readFile(
        joinPath(dir, uri),
      )) as unknown as ArrayBuffer
      files.push(new File([buffer], getBaseName(uri)))
    } catch {
      // Missing sidecar — O3DV will report it.
    }
  }

  return files
}

async function expandObjSidecars(
  objFile: File,
  objPath: string,
): Promise<File[]> {
  const files: File[] = [objFile]
  const seen = new Set<string>([lowerCase(getBaseName(objPath))])
  const dir = dirname(objPath)

  const mtlCandidates = [objPath.replace(/\.obj$/i, '.mtl')]
  const objText = new TextDecoder().decode(await objFile.arrayBuffer())
  each(objText.split(/\r?\n/), (line) => {
    const trimmed = trim(line)
    if (!startWith(lowerCase(trimmed), 'mtllib ')) return
    const name = trim(trimmed.slice(7))
    if (name) mtlCandidates.push(joinPath(dir, name))
  })

  for (const mtlPath of unique(
    mtlCandidates,
    (a, b) => lowerCase(getBaseName(a)) === lowerCase(getBaseName(b)),
  )) {
    const key = lowerCase(getBaseName(mtlPath))
    if (seen.has(key)) continue
    try {
      const buffer = (await tinker.readFile(mtlPath)) as unknown as ArrayBuffer
      files.push(new File([buffer], getBaseName(mtlPath)))
      seen.add(key)

      const mtlText = new TextDecoder().decode(buffer)
      for (const line of mtlText.split(/\r?\n/)) {
        const match = trim(line).match(/^(?:map_\w+|bump|disp|decal)\s+(.+)$/i)
        if (!match) continue
        const texName = last(trim(match[1]).split(/\s+/)) as string
        if (!texName || startWith(texName, '-')) continue
        const texKey = lowerCase(getBaseName(texName))
        if (seen.has(texKey)) continue
        try {
          const texBuffer = (await tinker.readFile(
            joinPath(dirname(mtlPath), texName),
          )) as unknown as ArrayBuffer
          files.push(new File([texBuffer], getBaseName(texName)))
          seen.add(texKey)
        } catch {
          // optional texture
        }
      }
    } catch {
      // optional mtl
    }
  }

  const withFolderTextures = await expandTextureCompanions(
    files[0],
    objPath,
    files,
  )
  return withFolderTextures
}

/**
 * Pull loose textures from the model folder and common `textures/` sidecars
 * (Sketchfab-style packages: source/model.fbx + textures/*.png).
 */
async function expandTextureCompanions(
  main: File,
  modelPath: string,
  existing: File[] = [main],
): Promise<File[]> {
  const files = [...existing]
  const seen = new Set(map(files, (file) => lowerCase(getBaseName(file.name))))
  const dir = dirname(modelPath)
  const parent = dirname(dir)
  const searchDirs = filter(
    [
      dir,
      joinPath(dir, 'textures'),
      parent ? joinPath(parent, 'textures') : '',
    ],
    (item) => !!item,
  )

  for (const searchDir of unique(searchDirs)) {
    try {
      const results = await tinker.searchFile('*', {
        dirs: [searchDir],
        exts: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tga', 'tif', 'tiff'],
        maxResults: 100,
      })
      for (const item of results) {
        if (!isTextureFileName(item.path)) continue
        const key = lowerCase(getBaseName(item.path))
        if (seen.has(key)) continue
        if (dirname(normalizePath(item.path)) !== normalizePath(searchDir)) {
          continue
        }
        try {
          const buffer = (await tinker.readFile(
            item.path,
          )) as unknown as ArrayBuffer
          files.push(new File([buffer], getBaseName(item.path)))
          seen.add(key)
        } catch {
          // optional
        }
      }
    } catch {
      // search unavailable
    }
  }

  return files
}

async function findModelInDirectory(dir: string): Promise<string | null> {
  const preferred = [
    'scene.gltf',
    'scene.glb',
    'model.gltf',
    'model.glb',
    'model.fbx',
    'model.obj',
  ]
  const roots = [dir, joinPath(dir, 'source'), joinPath(dir, 'models')]
  for (const root of roots) {
    for (const name of preferred) {
      const candidate = joinPath(root, name)
      try {
        const stat = await tinker.fstat(candidate)
        if (stat.isFile) return candidate
      } catch {
        // continue
      }
    }
  }

  try {
    const results = await tinker.searchFile('*', {
      dirs: [dir],
      exts: filter(MODEL_EXTENSIONS, (ext) => ext !== 'zip'),
      maxResults: 50,
    })
    const order = ['glb', 'gltf', 'fbx', 'obj']
    const models = sortBy(
      filter(results, (item) => isModelFileName(item.path)),
      (item) => {
        const idx = order.indexOf(getExtension(item.path))
        return idx === -1 ? 99 : idx
      },
    )
    if (isEmpty(models)) return null
    return models[0].path
  } catch {
    return null
  }
}

function isDataUri(uri: string): boolean {
  return startWith(lowerCase(uri.slice(0, 5)), 'data:')
}

export function mergeFilesByName(files: File[]): File[] {
  return unique(
    files,
    (a, b) => lowerCase(getBaseName(a.name)) === lowerCase(getBaseName(b.name)),
  )
}

export function hasModelFile(files: File[]): boolean {
  return some(files, (file) => isModelFileName(file.name))
}
