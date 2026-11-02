import {
  Document,
  Primitive,
  WebIO,
  type mat4,
  type Node,
  type vec3,
} from '@gltf-transform/core'
import {
  EXTMeshoptCompression,
  KHRDracoMeshCompression,
  KHRONOS_EXTENSIONS,
} from '@gltf-transform/extensions'
import { dequantize, normals, weld } from '@gltf-transform/functions'
import { mat4 as Mat4, vec3 as Vec3 } from 'gl-matrix'
import filter from 'licia/filter'
import map from 'licia/map'
import { MeshoptDecoder } from 'meshoptimizer'
import type { MeshStats } from '../types'

export type TriangleMesh = {
  vertices: Float64Array
  indices: Uint32Array
  stats: MeshStats
}

const TRIANGLES = Primitive.Mode.TRIANGLES

const READ_EXTENSIONS = [
  ...filter(
    KHRONOS_EXTENSIONS,
    (extension) => extension !== KHRDracoMeshCompression,
  ),
  EXTMeshoptCompression,
]

let readIoPromise: Promise<WebIO> | null = null
const writeIo = new WebIO()

async function getReadIO() {
  if (!readIoPromise) {
    readIoPromise = MeshoptDecoder.ready.then(() =>
      new WebIO().registerExtensions(READ_EXTENSIONS).registerDependencies({
        'meshopt.decoder': MeshoptDecoder,
      }),
    )
  }
  return readIoPromise
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

function transformPoint(out: vec3, m: mat4, x: number, y: number, z: number) {
  Vec3.transformMat4(out, [x, y, z], m)
}

function appendTransformedPrimitive(
  node: Node,
  vertices: number[],
  indices: number[],
  vertexBase: number,
): number {
  const mesh = node.getMesh()
  if (!mesh) return vertexBase

  const skin = node.getSkin()
  const world = node.getWorldMatrix()
  const jointMatrices: mat4[] | null = skin
    ? map(skin.listJoints(), (joint) => joint.getWorldMatrix())
    : null
  const inverseBind = skin?.getInverseBindMatrices()?.getArray() ?? null

  for (const prim of mesh.listPrimitives()) {
    if (prim.getMode() !== TRIANGLES) {
      throw new Error('Only triangle primitives are supported')
    }

    const position = prim.getAttribute('POSITION')
    if (!position) continue
    const posArray = position.getArray()
    if (!posArray) continue

    const joints = prim.getAttribute('JOINTS_0')?.getArray()
    const weights = prim.getAttribute('WEIGHTS_0')?.getArray()
    const count = position.getCount()
    const tmp = [0, 0, 0] as vec3
    const skinned = [0, 0, 0] as vec3
    const scratch = Mat4.create()

    for (let i = 0; i < count; i++) {
      const ox = posArray[i * 3]
      const oy = posArray[i * 3 + 1]
      const oz = posArray[i * 3 + 2]

      if (skin && joints && weights && inverseBind && jointMatrices) {
        skinned[0] = 0
        skinned[1] = 0
        skinned[2] = 0
        for (let j = 0; j < 4; j++) {
          const weight = weights[i * 4 + j]
          if (!weight) continue
          const jointIndex = joints[i * 4 + j]
          const ibmOffset = jointIndex * 16
          const ibm = inverseBind.slice(ibmOffset, ibmOffset + 16) as mat4
          Mat4.multiply(scratch, jointMatrices[jointIndex], ibm)
          transformPoint(tmp, scratch, ox, oy, oz)
          skinned[0] += tmp[0] * weight
          skinned[1] += tmp[1] * weight
          skinned[2] += tmp[2] * weight
        }
        transformPoint(tmp, world, skinned[0], skinned[1], skinned[2])
      } else {
        transformPoint(tmp, world, ox, oy, oz)
      }

      vertices.push(tmp[0], tmp[1], tmp[2])
    }

    const indexAccessor = prim.getIndices()
    if (indexAccessor) {
      const indexArray = indexAccessor.getArray()
      if (indexArray) {
        for (let i = 0; i < indexArray.length; i++) {
          indices.push(indexArray[i] + vertexBase)
        }
      }
    } else {
      for (let i = 0; i < count; i++) {
        indices.push(vertexBase + i)
      }
    }

    vertexBase += count
  }

  return vertexBase
}

function visitNode(
  node: Node,
  vertices: number[],
  indices: number[],
  vertexBase: number,
): number {
  vertexBase = appendTransformedPrimitive(node, vertices, indices, vertexBase)
  for (const child of node.listChildren()) {
    vertexBase = visitNode(child, vertices, indices, vertexBase)
  }
  return vertexBase
}

export function extractTriangleMesh(doc: Document): TriangleMesh {
  const vertices: number[] = []
  const indices: number[] = []
  let vertexBase = 0

  const scenes = doc.getRoot().listScenes()
  if (scenes.length > 0) {
    for (const scene of scenes) {
      for (const node of scene.listChildren()) {
        vertexBase = visitNode(node, vertices, indices, vertexBase)
      }
    }
  } else {
    for (const node of doc.getRoot().listNodes()) {
      if (node.getParentNode()) continue
      vertexBase = visitNode(node, vertices, indices, vertexBase)
    }
  }

  if (vertices.length === 0 || indices.length === 0) {
    throw new Error('No triangle mesh found in GLB')
  }
  if (indices.length % 3 !== 0) {
    throw new Error('Mesh indices are not a multiple of 3')
  }

  return {
    vertices: Float64Array.from(vertices),
    indices: Uint32Array.from(indices),
    stats: {
      vertexCount: vertices.length / 3,
      triangleCount: indices.length / 3,
    },
  }
}

export function quadsToTriangles(quads: Uint32Array): Uint32Array {
  const triangles = new Uint32Array((quads.length / 4) * 6)
  let offset = 0
  for (let i = 0; i + 3 < quads.length; i += 4) {
    const a = quads[i]
    const b = quads[i + 1]
    const c = quads[i + 2]
    const d = quads[i + 3]
    triangles[offset++] = a
    triangles[offset++] = b
    triangles[offset++] = c
    triangles[offset++] = a
    triangles[offset++] = c
    triangles[offset++] = d
  }
  return triangles
}

export function meshSurfaceArea(
  vertices: ArrayLike<number>,
  triangleIndices: ArrayLike<number>,
): number {
  let area = 0
  for (let i = 0; i + 2 < triangleIndices.length; i += 3) {
    const a = triangleIndices[i] * 3
    const b = triangleIndices[i + 1] * 3
    const c = triangleIndices[i + 2] * 3
    const ax = vertices[a]
    const ay = vertices[a + 1]
    const az = vertices[a + 2]
    const ux = vertices[b] - ax
    const uy = vertices[b + 1] - ay
    const uz = vertices[b + 2] - az
    const vx = vertices[c] - ax
    const vy = vertices[c + 1] - ay
    const vz = vertices[c + 2] - az
    area +=
      0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx)
  }
  return area
}

export async function buildGlb(
  vertices: ArrayLike<number>,
  triangleIndices: ArrayLike<number>,
): Promise<ArrayBuffer> {
  const doc = new Document()
  const buffer = doc.createBuffer()

  const position = doc
    .createAccessor()
    .setArray(new Float32Array(vertices))
    .setType('VEC3')
    .setBuffer(buffer)

  const indices = doc
    .createAccessor()
    .setArray(new Uint32Array(triangleIndices))
    .setType('SCALAR')
    .setBuffer(buffer)

  const material = doc
    .createMaterial('Remeshed')
    .setBaseColorFactor([0.78, 0.8, 0.84, 1])
    .setMetallicFactor(0.05)
    .setRoughnessFactor(0.75)

  const primitive = doc
    .createPrimitive()
    .setAttribute('POSITION', position)
    .setIndices(indices)
    .setMaterial(material)

  const mesh = doc.createMesh('Remeshed').addPrimitive(primitive)
  const node = doc.createNode('Remeshed').setMesh(mesh)
  doc.createScene('Scene').addChild(node)

  await doc.transform(normals(), weld())

  const bytes = await writeIo.writeBinary(doc)
  return toArrayBuffer(bytes)
}

export async function readGlbBytes(bytes: Uint8Array): Promise<TriangleMesh> {
  const io = await getReadIO()
  const doc = await io.readBinary(bytes)
  await doc.transform(dequantize())
  return extractTriangleMesh(doc)
}
