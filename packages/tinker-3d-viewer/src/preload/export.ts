import fs from 'node:fs'
import path from 'node:path'
import { createIo, readGltfPackageDocument, toArrayBuffer } from './specGloss'

function safeJoin(dir: string, uri: string): string {
  const root = path.resolve(dir)
  const dest = path.resolve(root, uri)
  const prefix = root.endsWith(path.sep) ? root : root + path.sep
  if (dest !== root && !dest.startsWith(prefix)) {
    throw new Error('saveFailed')
  }
  return dest
}

export async function packGltfPackageToGlb(payload: {
  gltfJson: string
  resources: Record<string, ArrayBuffer>
}): Promise<ArrayBuffer> {
  const document = await readGltfPackageDocument(payload)
  return toArrayBuffer(await createIo().writeBinary(document))
}

export async function writeGltfDirectory(
  dir: string,
  buffer: ArrayBuffer,
): Promise<string> {
  fs.mkdirSync(dir, { recursive: true })
  const io = createIo()
  const document = await io.readBinary(new Uint8Array(buffer))
  const { json, resources } = await io.writeJSON(document)
  const gltfPath = path.join(dir, `${path.basename(dir)}.gltf`)
  fs.writeFileSync(gltfPath, JSON.stringify(json, null, 2))

  for (const [uri, bytes] of Object.entries(resources)) {
    if (!uri || uri.startsWith('data:')) continue
    const dest = safeJoin(dir, uri)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, bytes)
  }

  return gltfPath
}
