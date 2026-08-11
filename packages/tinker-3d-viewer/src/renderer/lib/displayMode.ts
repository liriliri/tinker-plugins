import type { ModelViewerElement } from '@google/model-viewer'
import {
  Color,
  Mesh,
  MeshBasicMaterial,
  SkinnedMesh,
  type Material,
  type Object3D,
} from 'three'
import type { DisplayMode } from '../types'
import { DEFAULT_WIREFRAME_COLOR } from '../types'

const OVERLAY_NAME = '__tinkerWireOverlay'

interface MeshBackup {
  mesh: Mesh
  materials: Material[]
}

interface DisplayModeController {
  apply: (mode: DisplayMode, wireframeColor?: string) => void
  dispose: () => void
}

function getScene(el: ModelViewerElement):
  | (Object3D & {
      queueRender?: () => void
      target?: Object3D
    })
  | null {
  const sceneSymbol = Object.getOwnPropertySymbols(el).find(
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
    if (obj instanceof Mesh && obj.material && obj.name !== OVERLAY_NAME) {
      meshes.push(obj)
    }
  })
  return meshes
}

function materialList(material: Material | Material[]): Material[] {
  return Array.isArray(material) ? material : [material]
}

function captureBackups(meshes: Mesh[]): MeshBackup[] {
  return meshes.map((mesh) => ({
    mesh,
    materials: materialList(mesh.material).map((material) => material.clone()),
  }))
}

function disposeMaterials(material: Material | Material[]) {
  for (const item of materialList(material)) {
    item.dispose()
  }
}

function clearOverlays(mesh: Mesh) {
  const overlays = mesh.children.filter(
    (child) => child.name === OVERLAY_NAME,
  ) as Mesh[]
  for (const overlay of overlays) {
    mesh.remove(overlay)
    disposeMaterials(overlay.material)
  }
}

function restoreBackups(backups: MeshBackup[]) {
  for (const { mesh, materials } of backups) {
    clearOverlays(mesh)
    disposeMaterials(mesh.material)
    mesh.material =
      materials.length === 1
        ? materials[0].clone()
        : materials.map((material) => material.clone())
  }
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
  for (const { mesh, materials } of backups) {
    clearOverlays(mesh)
    disposeMaterials(mesh.material)
    const next = materials.map(() => createWireMaterial(color))
    mesh.material = next.length === 1 ? next[0] : next
  }
}

function applyShadedWireframe(backups: MeshBackup[], wireframeColor: string) {
  const color = new Color(wireframeColor)
  for (const { mesh } of backups) {
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
  }
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

  const requestRender = () => {
    scene.queueRender?.()
  }

  return {
    apply(mode, wireframeColor = DEFAULT_WIREFRAME_COLOR) {
      restoreBackups(backups)
      if (mode === 'wireframe') {
        applyWireframe(backups, wireframeColor)
      } else if (mode === 'shadedWireframe') {
        applyShadedWireframe(backups, wireframeColor)
      }
      requestRender()
    },
    dispose() {
      restoreBackups(backups)
      for (const { materials } of backups) {
        disposeMaterials(materials)
      }
      requestRender()
    },
  }
}
