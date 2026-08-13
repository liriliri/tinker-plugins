import type { ModelViewerElement } from '@google/model-viewer'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import map from 'licia/map'
import {
  Bone,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  SRGBColorSpace,
  SkinnedMesh,
  SphereGeometry,
  TextureLoader,
  Vector3,
  type Material,
  type Object3D,
  type Texture,
} from 'three'
import {
  DEFAULT_MATCAP_PRESET,
  DEFAULT_WIREFRAME_COLOR,
  MATCAP_PRESETS,
  type DisplayMode,
  type MatcapPresetId,
} from '../types'

const OVERLAY_NAME = '__tinkerWireOverlay'
const SKELETON_NAME = '__tinkerSkeletonPart'
const BONE_COLOR = '#5b9dff'
const JOINT_COLOR = '#f59e0b'
const SHADING_LIGHT = new Vector3(0.5, 0.8, 0.35).normalize()

interface MeshBackup {
  mesh: Mesh
  materials: Material[]
}

interface SkeletonVisual {
  dispose: () => void
}

interface DisplayModeController {
  hasSkeleton: boolean
  apply: (
    mode: DisplayMode,
    wireframeColor?: string,
    matcapPreset?: MatcapPresetId,
  ) => void
  dispose: () => void
}

function getScene(el: ModelViewerElement):
  | (Object3D & {
      queueRender?: () => void
      target?: Object3D
    })
  | null {
  const sceneSymbol = find(
    Object.getOwnPropertySymbols(el),
    (symbol) => symbol.description === 'scene',
  )
  if (!sceneSymbol) return null
  return (el as unknown as Record<symbol, unknown>)[sceneSymbol] as Object3D & {
    queueRender?: () => void
    target?: Object3D
  }
}

function collectMeshes(root: Object3D): Mesh[] {
  const meshes: Mesh[] = []
  root.traverse((obj) => {
    if (!(obj instanceof Mesh) || !obj.material) return
    if (obj.name === OVERLAY_NAME || obj.name === SKELETON_NAME) return
    meshes.push(obj)
  })
  return meshes
}

function collectBones(root: Object3D): Bone[] {
  const bones: Bone[] = []
  root.traverse((obj) => {
    if (obj instanceof Bone) bones.push(obj)
  })
  return bones
}

function materialList(material: Material | Material[]): Material[] {
  return Array.isArray(material) ? material : [material]
}

function assignMaterials(mesh: Mesh, materials: Material[]) {
  mesh.material = materials.length === 1 ? materials[0] : materials
}

function captureBackups(meshes: Mesh[]): MeshBackup[] {
  return map(meshes, (mesh) => ({
    mesh,
    materials: map(materialList(mesh.material), (material) => material.clone()),
  }))
}

function disposeMaterials(material: Material | Material[]) {
  each(materialList(material), (item) => item.dispose())
}

function clearOverlays(mesh: Mesh) {
  const overlays = filter(
    mesh.children,
    (child) => child.name === OVERLAY_NAME,
  ) as Mesh[]
  each(overlays, (overlay) => {
    mesh.remove(overlay)
    disposeMaterials(overlay.material)
  })
}

function restoreBackups(backups: MeshBackup[]) {
  each(backups, ({ mesh, materials }) => {
    clearOverlays(mesh)
    disposeMaterials(mesh.material)
    assignMaterials(
      mesh,
      map(materials, (material) => material.clone()),
    )
  })
}

function replaceMaterials(
  backups: MeshBackup[],
  create: (source: Material) => Material,
) {
  each(backups, ({ mesh, materials }) => {
    clearOverlays(mesh)
    disposeMaterials(mesh.material)
    assignMaterials(mesh, map(materials, create))
  })
}

function createWireMaterial(color: Color) {
  return new MeshBasicMaterial({
    color: color.clone(),
    wireframe: true,
    depthTest: true,
    depthWrite: false,
    transparent: true,
    opacity: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })
}

function applyWireframe(backups: MeshBackup[], wireframeColor: string) {
  const color = new Color(wireframeColor)
  replaceMaterials(backups, () => createWireMaterial(color))
}

function applyShadedWireframe(backups: MeshBackup[], wireframeColor: string) {
  const color = new Color(wireframeColor)
  each(backups, ({ mesh }) => {
    clearOverlays(mesh)
    const material = createWireMaterial(color)
    let overlay: Mesh
    if (mesh instanceof SkinnedMesh) {
      const skinned = new SkinnedMesh(mesh.geometry, material)
      skinned.bind(mesh.skeleton, mesh.bindMatrix)
      overlay = skinned
    } else {
      overlay = new Mesh(mesh.geometry, material)
    }
    overlay.name = OVERLAY_NAME
    overlay.frustumCulled = mesh.frustumCulled
    overlay.renderOrder = (mesh.renderOrder || 0) + 1
    mesh.add(overlay)
  })
}

function applyMatcap(backups: MeshBackup[], texture: Texture) {
  replaceMaterials(
    backups,
    (source) =>
      new MeshMatcapMaterial({
        name: source.name,
        matcap: texture,
        side: source.side,
        transparent: source.transparent,
        opacity: source.opacity,
        depthTest: source.depthTest,
        depthWrite: source.depthWrite,
      }),
  )
}

// Bakes directional shading into vertex colors so the helper reads as a solid
// shape without depending on the scene lighting.
function bakeShading(geometry: BufferGeometry, color: string) {
  const base = new Color(color)
  const normals = geometry.getAttribute('normal')
  const colors = new Float32Array(normals.count * 3)
  const normal = new Vector3()
  for (let i = 0; i < normals.count; i += 1) {
    normal.fromBufferAttribute(normals, i)
    const shade = 0.55 + 0.45 * (normal.dot(SHADING_LIGHT) * 0.5 + 0.5)
    colors[i * 3] = base.r * shade
    colors[i * 3 + 1] = base.g * shade
    colors[i * 3 + 2] = base.b * shade
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
}

// Blender style octahedral bone: unit length along +Y, unit half width on X/Z.
function createBoneGeometry(): BufferGeometry {
  const base = [0, 0, 0]
  const tip = [0, 1, 0]
  const ring = [
    [1, 0.14, 0],
    [0, 0.14, 1],
    [-1, 0.14, 0],
    [0, 0.14, -1],
  ]
  const positions: number[] = []
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    positions.push(...base, ...a, ...b)
    positions.push(...tip, ...b, ...a)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  )
  geometry.computeVertexNormals()
  return geometry
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function createSkeletonVisual(root: Object3D): SkeletonVisual | null {
  const bones = collectBones(root)
  if (bones.length === 0) return null

  root.updateMatrixWorld(true)

  const lengths: number[] = []
  for (const bone of bones) {
    const scale = bone.matrixWorld.getMaxScaleOnAxis()
    for (const child of bone.children) {
      if (!(child instanceof Bone)) continue
      const length = child.position.length() * scale
      if (length > 0) lengths.push(length)
    }
  }
  const modelSize = new Box3()
    .setFromObject(root)
    .getSize(new Vector3())
    .length()
  const jointRadius = lengths.length ? median(lengths) * 0.12 : modelSize * 0.01

  const boneGeometry = createBoneGeometry()
  const jointGeometry = new SphereGeometry(1, 16, 10)
  bakeShading(boneGeometry, BONE_COLOR)
  bakeShading(jointGeometry, JOINT_COLOR)
  // Opaque so the parts depth sort against each other, while the model itself
  // is drawn without depth writes and therefore never hides them.
  const material = new MeshBasicMaterial({ vertexColors: true })

  const parts: Mesh[] = []
  const addPart = (part: Mesh, parent: Object3D) => {
    part.name = SKELETON_NAME
    part.frustumCulled = false
    parent.add(part)
    parts.push(part)
  }

  const up = new Vector3(0, 1, 0)
  const direction = new Vector3()
  for (const bone of bones) {
    const scale = bone.matrixWorld.getMaxScaleOnAxis() || 1
    const joint = new Mesh(jointGeometry, material)
    joint.scale.setScalar(jointRadius / scale)
    addPart(joint, bone)

    for (const child of bone.children) {
      if (!(child instanceof Bone)) continue
      const length = child.position.length()
      if (length <= 0) continue
      const width = Math.min(length * 0.16, (jointRadius * 1.4) / scale)
      const segment = new Mesh(boneGeometry, material)
      segment.quaternion.setFromUnitVectors(
        up,
        direction.copy(child.position).normalize(),
      )
      segment.scale.set(width, length, width)
      addPart(segment, bone)
    }
  }

  return {
    dispose() {
      each(parts, (part) => part.removeFromParent())
      parts.length = 0
      boneGeometry.dispose()
      jointGeometry.dispose()
      material.dispose()
    },
  }
}

function applySkeleton(
  backups: MeshBackup[],
  root: Object3D,
): SkeletonVisual | null {
  replaceMaterials(
    backups,
    () =>
      new MeshBasicMaterial({
        color: 0x9ca3af,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
  )
  return createSkeletonVisual(root)
}

export function createDisplayModeController(
  el: ModelViewerElement,
): DisplayModeController | null {
  const scene = getScene(el)
  if (!scene) return null

  const root = scene.target ?? scene
  const meshes = collectMeshes(root)
  if (meshes.length === 0) return null

  const backups = captureBackups(meshes)
  const loader = new TextureLoader()
  const textureCache = new Map<MatcapPresetId, Texture>()
  let skeletonVisual: SkeletonVisual | null = null

  const requestRender = () => {
    scene.queueRender?.()
  }

  const getMatcapTexture = (presetId: MatcapPresetId) => {
    const cached = textureCache.get(presetId)
    if (cached) return cached
    const preset =
      find(MATCAP_PRESETS, (item) => item.id === presetId) ?? MATCAP_PRESETS[0]
    const texture = loader.load(preset.url, requestRender)
    texture.colorSpace = SRGBColorSpace
    textureCache.set(preset.id, texture)
    return texture
  }

  return {
    hasSkeleton: collectBones(root).length > 0,
    apply(
      mode,
      wireframeColor = DEFAULT_WIREFRAME_COLOR,
      matcapPreset = DEFAULT_MATCAP_PRESET,
    ) {
      restoreBackups(backups)
      skeletonVisual?.dispose()
      skeletonVisual = null
      if (mode === 'wireframe') {
        applyWireframe(backups, wireframeColor)
      } else if (mode === 'shadedWireframe') {
        applyShadedWireframe(backups, wireframeColor)
      } else if (mode === 'matcap') {
        applyMatcap(backups, getMatcapTexture(matcapPreset))
      } else if (mode === 'matcapWireframe') {
        applyMatcap(backups, getMatcapTexture(matcapPreset))
        applyShadedWireframe(backups, wireframeColor)
      } else if (mode === 'skeleton') {
        skeletonVisual = applySkeleton(backups, root)
      }
      requestRender()
    },
    dispose() {
      skeletonVisual?.dispose()
      skeletonVisual = null
      restoreBackups(backups)
      each(backups, ({ materials }) => disposeMaterials(materials))
      each([...textureCache.values()], (texture) => texture.dispose())
      textureCache.clear()
      requestRender()
    },
  }
}
