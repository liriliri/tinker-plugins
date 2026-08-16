import each from 'licia/each'
import fill from 'licia/fill'
import filter from 'licia/filter'
import map from 'licia/map'
import * as THREE from 'three'
import { REEF_TYPES } from './catalog'
import { layoutReef } from './layout'
import {
  createGlassShell,
  createGlassSwirl,
  createKelp,
  shadeGeometry,
} from './shapes'
import { loadCoralSurface, loadRockSurface } from './surfaces'
import {
  DEFAULT_REEF,
  type Reef,
  type ReefBuildOptions,
  type ReefObstacle,
} from './types'
import {
  Y_AXIS,
  lerp,
  mulberry32,
  tmpMatrix,
  tmpPosition,
  tmpQuaternion,
  tmpScale,
  tmpTilt,
  tmpVector,
} from './util'

const tmpWhite = new THREE.Color(0xffffff)
const GLASS_LIGHT_DIR = new THREE.Vector3(8, -7.5, -9).normalize()

function createRadialTexture(stops: Array<[number, string]>, size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  each(stops, ([t, color]) => {
    gradient.addColorStop(t, color)
  })
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function enablePlantSway(material: THREE.MeshStandardMaterial) {
  const plantSway = { value: 0 }
  material.userData.plantSway = plantSway
  const previous = material.onBeforeCompile
  const previousKey = material.customProgramCacheKey
  material.customProgramCacheKey = () =>
    `${previousKey?.call(material) ?? ''}|plantSway`
  material.onBeforeCompile = (shader, renderer) => {
    previous?.call(material, shader, renderer)
    shader.uniforms.plantSway = plantSway
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float plantSway;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         {
           float h = max(transformed.y, 0.0);
           float amp = h * h * 0.1;
           float phase = 0.0;
           #ifdef USE_INSTANCING
             phase = instanceMatrix[3].x * 1.73 + instanceMatrix[3].z * 2.09;
             amp *= max(instanceMatrix[1].y, 0.6);
           #endif
           float wave = sin(plantSway * 0.34 + phase);
           transformed.x += wave * amp;
           transformed.z += cos(plantSway * 0.27 + phase * 0.65) * amp * 0.35;
         }`,
      )
  }
}

export function createReef({
  count = DEFAULT_REEF.count,
  size: sizeScale = DEFAULT_REEF.size,
  vibrance = DEFAULT_REEF.vibrance,
  seed = DEFAULT_REEF.seed,
  floorY,
  halfWidth,
  halfDepth,
  inset = 1.1,
  envMap,
  sandY,
}: ReefBuildOptions): Reef {
  const group = new THREE.Group()
  group.name = 'Reef'

  const shapeRandom = mulberry32(seed)
  const materials = map(REEF_TYPES, (type) => {
    if (type.kind === 'plant') {
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        roughness: 0.78,
        metalness: 0,
        side: THREE.DoubleSide,
      })
      if (type.build === createKelp) enablePlantSway(material)
      return material
    }

    if (type.kind === 'glass') {
      return new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.08,
        metalness: 0,
        transmission: 1,
        thickness: 0.45,
        ior: 1.4,
        reflectivity: 0.45,
        clearcoat: 0.35,
        clearcoatRoughness: 0.08,
        envMap,
        envMapIntensity: 1.15,
        specularIntensity: 0.7,
        transparent: true,
        opacity: 1,
        side: THREE.BackSide,
        depthWrite: true,
        fog: false,
      })
    }

    const { map, normalMap, normalScale } =
      type.kind === 'rubble'
        ? loadRockSurface()
        : loadCoralSurface(type.surface ?? 0)
    return new THREE.MeshStandardMaterial({
      // Rock albedo is already shaded; a >1 multiply lifts the dark slate so
      // ridges and the normal map still read under the tank's soft fill.
      color:
        type.kind === 'rubble' ? new THREE.Color(1.85, 1.75, 1.65) : 0xffffff,
      vertexColors: type.kind !== 'rubble',
      map,
      roughness: type.kind === 'rubble' ? 0.92 : 0.82,
      metalness: 0.02,
      // Adds a lit highlight on the ridges to complement the baked-in pits.
      normalMap,
      normalScale: new THREE.Vector2(normalScale, normalScale),
      side: type.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    })
  })

  const layoutRandom = mulberry32(seed + 17)
  const spots = layoutReef(
    layoutRandom,
    count,
    vibrance,
    halfWidth,
    halfDepth,
    inset,
    sandY,
  )
  const perType = map(
    REEF_TYPES,
    (_, index) => filter(spots, (spot) => spot.type === index).length,
  )

  const glassShellGeo = createGlassShell()
  const extraMaterials: THREE.Material[] = []
  const glassFrontMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.04,
    metalness: 0,
    reflectivity: 0.7,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMap,
    envMapIntensity: 1.7,
    specularIntensity: 1,
    transparent: true,
    opacity: 0.16,
    side: THREE.FrontSide,
    depthWrite: false,
    fog: false,
  })
  extraMaterials.push(glassFrontMat)
  const glassSwirlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.32,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    envMapIntensity: 0,
    fog: false,
  })
  extraMaterials.push(glassSwirlMat)
  const extraGeometries: THREE.BufferGeometry[] = []
  const causticMap = createRadialTexture([
    [0, 'rgba(255,255,255,0.35)'],
    [0.32, 'rgba(255,255,255,0.14)'],
    [0.7, 'rgba(255,255,255,0.03)'],
    [1, 'rgba(255,255,255,0)'],
  ])
  const shadeMap = createRadialTexture([
    [0, 'rgba(0,0,0,0.05)'],
    [0.42, 'rgba(0,0,0,0.22)'],
    [0.78, 'rgba(0,0,0,0.12)'],
    [1, 'rgba(0,0,0,0)'],
  ])
  const glassShadeMat = new THREE.MeshBasicMaterial({
    map: shadeMap,
    transparent: true,
    depthWrite: false,
    fog: false,
  })
  extraMaterials.push(glassShadeMat)
  const glassSpotGeo = new THREE.CircleGeometry(0.5, 24)
  extraGeometries.push(glassSpotGeo)

  const meshes = map(REEF_TYPES, (type, index) => {
    if (type.kind === 'glass') return null
    const geometry =
      type.kind === 'rubble'
        ? type.build(shapeRandom)
        : shadeGeometry(type.build(shapeRandom), shapeRandom)
    const mesh = new THREE.InstancedMesh(
      geometry,
      materials[index],
      Math.max(1, perType[index]),
    )
    mesh.count = 0
    mesh.frustumCulled = false
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  })

  const placed = fill(new Array(REEF_TYPES.length), 0)
  const obstacles: ReefObstacle[] = []
  for (const spot of spots) {
    const type = REEF_TYPES[spot.type]
    const mesh = meshes[spot.type]
    const index = placed[spot.type]
    placed[spot.type] += 1

    // The type range is the intrinsic spread; the spot's skewed scale is what
    // gives the bed a hierarchy instead of one uniform mid-size everywhere.
    const base =
      type.kind === 'glass'
        ? type.size[0]
        : lerp(type.size[0], type.size[1], layoutRandom())
    const size = base * spot.scale * sizeScale
    const restY =
      type.kind === 'glass' && sandY
        ? sandY(spot.x, spot.z) - size * 0.028
        : floorY
    tmpPosition.set(spot.x, restY - size * type.sink, spot.z)
    tmpQuaternion.setFromAxisAngle(Y_AXIS, layoutRandom() * Math.PI * 2)
    // Plants lean more than coral; a stiff vertical clump reads as a bottle brush.
    const lean =
      type.kind === 'plant'
        ? layoutRandom() * 0.38
        : type.kind === 'glass'
          ? 0
          : layoutRandom() * 0.12
    tmpTilt.setFromAxisAngle(
      tmpVector.set(layoutRandom() - 0.5, 0, layoutRandom() - 0.5).normalize(),
      lean,
    )
    tmpQuaternion.premultiply(tmpTilt)
    // Slight girth variation keeps repeats of one prototype from lining up.
    // Plants stay thin on XZ so ribbons do not fatten into pads.
    const girth =
      type.kind === 'plant'
        ? lerp(0.85, 1.05, layoutRandom())
        : type.kind === 'glass'
          ? 1
          : lerp(0.88, 1.12, layoutRandom())
    const height =
      type.kind === 'plant'
        ? lerp(0.95, 1.2, layoutRandom())
        : type.kind === 'glass'
          ? 1
          : lerp(0.9, 1.15, layoutRandom())
    tmpScale.set(size * girth, size * height, size * girth)
    tmpMatrix.compose(tmpPosition, tmpQuaternion, tmpScale)
    if (type.kind === 'glass') {
      const orb = new THREE.Group()
      const swirlColors = [spot.color]
      if (layoutRandom() < 0.16) {
        swirlColors.push(spot.color.clone().offsetHSL(0.18, 0.06, 0.02))
      }
      const swirlGeo = createGlassSwirl(layoutRandom, swirlColors)
      extraGeometries.push(swirlGeo)
      const swirl = new THREE.Mesh(swirlGeo, glassSwirlMat)
      swirl.renderOrder = 3
      swirl.position.set(0, 0.5, 0)
      swirl.rotation.set(
        layoutRandom() * Math.PI * 2,
        layoutRandom() * Math.PI * 2,
        layoutRandom() * Math.PI * 2,
      )
      orb.add(swirl)
      const back = new THREE.Mesh(glassShellGeo, materials[spot.type])
      back.renderOrder = 1
      const front = new THREE.Mesh(glassShellGeo, glassFrontMat)
      front.renderOrder = 5
      orb.add(back)
      orb.add(front)
      orb.applyMatrix4(tmpMatrix)
      group.add(orb)

      const radius = size * 0.5
      const travel = (restY + 0.014 - (restY + radius)) / GLASS_LIGHT_DIR.y
      const shadowX = spot.x + GLASS_LIGHT_DIR.x * travel
      const shadowZ = spot.z + GLASS_LIGHT_DIR.z * travel
      const shadeY = sandY ? sandY(shadowX, shadowZ) : floorY
      const shade = new THREE.Mesh(glassSpotGeo, glassShadeMat)
      shade.rotation.x = -Math.PI / 2
      shade.position.set(shadowX, shadeY + 0.012, shadowZ)
      shade.scale.setScalar(size * 1.35)
      shade.renderOrder = 0
      group.add(shade)
      const causticMat = new THREE.MeshBasicMaterial({
        map: causticMap,
        color: spot.color,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.45,
        fog: false,
      })
      extraMaterials.push(causticMat)
      const caustic = new THREE.Mesh(glassSpotGeo, causticMat)
      caustic.rotation.x = -Math.PI / 2
      caustic.position.set(shadowX, shadeY + 0.014, shadowZ)
      caustic.scale.setScalar(size * 0.82)
      caustic.renderOrder = 1
      group.add(caustic)
    } else {
      mesh!.setMatrixAt(index, tmpMatrix)
      mesh!.setColorAt(index, type.kind === 'rubble' ? tmpWhite : spot.color)
    }
    if (type.kind !== 'plant') {
      obstacles.push({
        x: spot.x,
        z: spot.z,
        radius: Math.max(spot.radius * 0.72, size * girth * 0.34) + 0.22,
        topY: restY + size * height * (1 - type.sink) * 0.9,
      })
    }
  }

  each(meshes, (mesh, i) => {
    if (!mesh) return
    mesh.count = placed[i]
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return {
    group,
    materials,
    obstacles,
    update(dt: number) {
      each(materials, (material) => {
        const sway = material.userData.plantSway as
          { value: number } | undefined
        if (sway) sway.value += dt
      })
    },
    dispose() {
      group.clear()
      each(meshes, (mesh) => {
        if (!mesh) return
        mesh.geometry.dispose()
      })
      each(materials, (material) => material.dispose())
      each(extraMaterials, (material) => material.dispose())
      glassShellGeo.dispose()
      causticMap.dispose()
      shadeMap.dispose()
      each(extraGeometries, (geometry) => geometry.dispose())
    },
  }
}
