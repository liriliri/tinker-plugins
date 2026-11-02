import type { ModelViewerElement } from '@google/model-viewer'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import map from 'licia/map'
import toArr from 'licia/toArr'
import {
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  SRGBColorSpace,
  TextureLoader,
  type Material,
  type Object3D,
  type Texture,
} from 'three'
import porcelainMatcapUrl from '../assets/matcaps/porcelain.png'
import type { DisplayMode } from '../types'

const OVERLAY_NAME = '__tinkerWireOverlay'
const WIREFRAME_COLOR = 0x9aa3ad

interface MeshBackup {
  mesh: Mesh
  materials: Material[]
}

export interface DisplayModeController {
  apply: (mode: DisplayMode) => void
  dispose: () => void
}

let matcapTexture: Texture | null = null

function getMatcapTexture(onLoad?: () => void): Texture {
  if (matcapTexture) return matcapTexture
  matcapTexture = new TextureLoader().load(porcelainMatcapUrl, () => onLoad?.())
  matcapTexture.colorSpace = SRGBColorSpace
  return matcapTexture
}

function getScene(
  el: ModelViewerElement,
): (Object3D & { queueRender?: () => void; target?: Object3D }) | null {
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

function materialList(material: Material | Material[]): Material[] {
  return toArr(material)
}

function assignMaterials(mesh: Mesh, materials: Material[]) {
  mesh.material = materials.length === 1 ? materials[0] : materials
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

function collectMeshes(root: Object3D): Mesh[] {
  const meshes: Mesh[] = []
  root.traverse((obj) => {
    if (!(obj instanceof Mesh) || !obj.material) return
    if (obj.name === OVERLAY_NAME) return
    meshes.push(obj)
  })
  return meshes
}

function captureBackups(meshes: Mesh[]): MeshBackup[] {
  return map(meshes, (mesh) => ({
    mesh,
    materials: map(materialList(mesh.material), (material) => material.clone()),
  }))
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

function applyClay(backups: MeshBackup[], texture: Texture) {
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

function createWireMaterial() {
  return new MeshBasicMaterial({
    color: WIREFRAME_COLOR,
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

function applyWireframeOverlay(backups: MeshBackup[]) {
  each(backups, ({ mesh }) => {
    clearOverlays(mesh)
    const overlay = new Mesh(mesh.geometry, createWireMaterial())
    overlay.name = OVERLAY_NAME
    overlay.frustumCulled = mesh.frustumCulled
    overlay.renderOrder = (mesh.renderOrder || 0) + 1
    mesh.add(overlay)
  })
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

  const matcap = getMatcapTexture(requestRender)

  return {
    apply(mode) {
      restoreBackups(backups)
      if (mode === 'wireframe') {
        applyClay(backups, matcap)
        applyWireframeOverlay(backups)
      } else {
        applyClay(backups, matcap)
      }
      requestRender()
    },
    dispose() {
      restoreBackups(backups)
      each(backups, ({ materials }) => disposeMaterials(materials))
      requestRender()
    },
  }
}
