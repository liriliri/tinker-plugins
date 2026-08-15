import each from 'licia/each'
import fill from 'licia/fill'
import filter from 'licia/filter'
import map from 'licia/map'
import * as THREE from 'three'
import { REEF_TYPES } from './catalog'
import { layoutReef } from './layout'
import { shadeGeometry } from './shapes'
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

export function createReef({
  count = DEFAULT_REEF.count,
  size: sizeScale = DEFAULT_REEF.size,
  vibrance = DEFAULT_REEF.vibrance,
  seed = DEFAULT_REEF.seed,
  floorY,
  halfWidth,
  halfDepth,
  inset = 1.1,
}: ReefBuildOptions): Reef {
  const group = new THREE.Group()
  group.name = 'Reef'

  const shapeRandom = mulberry32(seed)
  const materials = map(REEF_TYPES, (type) => {
    if (type.kind === 'plant') {
      // Smooth leaf blades; coral pore maps would only muddy the green.
      return new THREE.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        roughness: 0.78,
        metalness: 0,
        side: THREE.DoubleSide,
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
  )
  const perType = map(
    REEF_TYPES,
    (_, index) => filter(spots, (spot) => spot.type === index).length,
  )

  const meshes = map(REEF_TYPES, (type, index) => {
    const geometry =
      type.kind === 'rubble'
        ? // Rock albedo already carries its own shading; baking coral-style AO
          // on top only crushed the map into flat black pebbles.
          type.build(shapeRandom)
        : shadeGeometry(type.build(shapeRandom), shapeRandom)
    const mesh = new THREE.InstancedMesh(
      geometry,
      materials[index],
      Math.max(1, perType[index]),
    )
    mesh.count = 0
    mesh.frustumCulled = false
    mesh.castShadow = true
    // Colonies sit close enough to shade each other, which is most of what makes
    // the bed read as having depth.
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
    const base = lerp(type.size[0], type.size[1], layoutRandom())
    const size = base * spot.scale * sizeScale
    tmpPosition.set(spot.x, floorY - size * type.sink, spot.z)
    tmpQuaternion.setFromAxisAngle(Y_AXIS, layoutRandom() * Math.PI * 2)
    // Plants lean more than coral; a stiff vertical clump reads as a bottle brush.
    const lean =
      type.kind === 'plant' ? layoutRandom() * 0.38 : layoutRandom() * 0.12
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
        : lerp(0.88, 1.12, layoutRandom())
    const height =
      type.kind === 'plant'
        ? lerp(0.95, 1.2, layoutRandom())
        : lerp(0.9, 1.15, layoutRandom())
    tmpScale.set(size * girth, size * height, size * girth)
    tmpMatrix.compose(tmpPosition, tmpQuaternion, tmpScale)
    mesh.setMatrixAt(index, tmpMatrix)
    mesh.setColorAt(index, type.kind === 'rubble' ? tmpWhite : spot.color)
    if (type.kind !== 'plant') {
      obstacles.push({
        x: spot.x,
        z: spot.z,
        radius: Math.max(spot.radius * 0.72, size * girth * 0.34) + 0.22,
        topY: floorY + size * height * (1 - type.sink) * 0.9,
      })
    }
  }

  each(meshes, (mesh, i) => {
    mesh.count = placed[i]
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return {
    group,
    materials,
    obstacles,
    dispose() {
      group.clear()
      each(meshes, (mesh) => mesh.geometry.dispose())
      each(materials, (material) => material.dispose())
    },
  }
}
