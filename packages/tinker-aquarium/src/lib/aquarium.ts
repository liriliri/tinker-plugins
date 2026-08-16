import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import clamp from 'licia/clamp'
import each from 'licia/each'
import isArr from 'licia/isArr'
import { createBubbles } from './bubbles'
import {
  createAngelfishSchool,
  createGoldfishSchool,
  createGuppySchool,
  createNeonTetraSchool,
  DEFAULT_ANGELFISH_COUNT,
  DEFAULT_FISH_COUNT,
  DEFAULT_GUPPY_COUNT,
  DEFAULT_NEON_COUNT,
} from './fish'
import { createGlassDirt } from './glassDirt'
import { createReef } from './reef'
import { DEFAULT_REEF, type ReefOptions } from './reef/types'
import { mulberry32 } from './reef/util'
import { createWaterSystem } from './water'
import {
  DEFAULT_LIGHTING,
  DEFAULT_RENDER_SCALE,
  type CameraView,
  type LightingOptions,
  type PerfStats,
} from '../types'

const TANK = {
  width: 18,
  height: 10,
  depth: 11,
  floorY: -5,
  waterY: 4.25,
}

const SAND_THICKNESS = 0.7
// A hair above the inner bottom face, so the two coplanar slabs do not z-fight.
const SAND_BASE_Y = TANK.floorY + 0.006
const SAND_TOP_Y = TANK.floorY + SAND_THICKNESS
// Sand textures live in the plugin's `public/images/` folder; missing files
// fall back to the procedural sand color below.
const SAND_TEXTURE_URL = 'images/sand.jpg'
const SAND_NORMAL_URL = 'images/sand_normal.jpg'
// Repeats per world unit rather than per face: a box face's UVs always run 0..1
// over its own size, so a shared repeat would stretch the grain across the thin
// sides. One tile spans ~11 units at this density.
const SAND_GRAIN_DENSITY = 0.088

function createGlassShell(thickness: number, envMap: THREE.Texture) {
  const { width, height, depth } = TANK
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.04,
    metalness: 0,
    transmission: 1,
    thickness: 0.12,
    ior: 1.45,
    attenuationColor: 0xd8eaf8,
    attenuationDistance: 24,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMap,
    envMapIntensity: 1.35,
    specularIntensity: 1,
    transparent: true,
    opacity: 0.08,
    side: THREE.FrontSide,
    depthWrite: false,
  })
  const group = new THREE.Group()
  group.name = 'Glass'

  const addPanel = (
    geometry: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.renderOrder = 3
    group.add(mesh)
  }

  addPanel(
    new THREE.BoxGeometry(thickness, height, depth + thickness * 2),
    -(width / 2 + thickness / 2),
    0,
    0,
  )
  addPanel(
    new THREE.BoxGeometry(thickness, height, depth + thickness * 2),
    width / 2 + thickness / 2,
    0,
    0,
  )
  addPanel(
    new THREE.BoxGeometry(width, height, thickness),
    0,
    0,
    depth / 2 + thickness / 2,
  )
  addPanel(
    new THREE.BoxGeometry(width, height, thickness),
    0,
    0,
    -(depth / 2 + thickness / 2),
  )

  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(
      width + thickness * 2,
      thickness,
      depth + thickness * 2,
    ),
    new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.92,
      metalness: 0,
    }),
  )
  bottom.position.set(0, -(height / 2 + thickness / 2), 0)
  group.add(bottom)

  const outer = new THREE.BoxGeometry(
    width + thickness * 2,
    height + thickness,
    depth + thickness * 2,
  )
  outer.translate(0, -thickness / 2, 0)
  const inner = new THREE.BoxGeometry(width, height, depth)
  const edgeGeometry = mergeGeometries([
    new THREE.EdgesGeometry(outer),
    new THREE.EdgesGeometry(inner),
  ])!
  outer.dispose()
  inner.dispose()

  return { group, edgeGeometry }
}

export interface Aquarium {
  setReef: (options: ReefOptions) => void
  setFishCount: (count: number) => void
  setAngelfishCount: (count: number) => void
  setGuppyCount: (count: number) => void
  setNeonTetraCount: (count: number) => void
  setLighting: (lighting: LightingOptions) => void
  setView: (view: CameraView) => void
  setRenderScale: (scale: number) => void
  dispose: () => void
}

export function createAquarium(
  canvas: HTMLCanvasElement,
  reefOptions: ReefOptions = DEFAULT_REEF,
  fishCount = DEFAULT_FISH_COUNT,
  angelfishCount = DEFAULT_ANGELFISH_COUNT,
  guppyCount = DEFAULT_GUPPY_COUNT,
  neonTetraCount = DEFAULT_NEON_COUNT,
  lighting: LightingOptions = DEFAULT_LIGHTING,
  view?: CameraView | null,
  renderScale = DEFAULT_RENDER_SCALE,
  onViewChange?: (view: CameraView) => void,
  onFps?: (stats: PerfStats) => void,
): Aquarium {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  })
  let maxRenderScale = renderScale
  const applyPixelRatio = () => {
    renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, maxRenderScale))
  }
  applyPixelRatio()
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.88
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x06122c, 0.018)

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
  camera.position.set(15, 9, 22)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.055
  controls.target.set(0, 0.2, 0)
  controls.minDistance = 15
  controls.maxDistance = 38
  controls.maxPolarAngle = Math.PI * 0.82
  if (view) {
    camera.position.fromArray(view.position)
    controls.target.fromArray(view.target)
    controls.update()
  }

  let saveViewTimer = 0
  let suppressViewPersist = 0
  const persistView = () => {
    if (suppressViewPersist > 0) return
    onViewChange?.({
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controls.target.x, controls.target.y, controls.target.z],
    })
  }
  const onControlsChange = () => {
    window.clearTimeout(saveViewTimer)
    saveViewTimer = window.setTimeout(persistView, 250)
  }
  controls.addEventListener('change', onControlsChange)

  // The fill is all that survives inside a shadow, so a cyan tint here turns every
  // shadowed patch of warm sand olive. A blue-grey bounce keeps them as cool shade.
  const KEY_INTENSITY = 2
  const HEMI_INTENSITY = 0.78
  const hemiLight = new THREE.HemisphereLight(
    0xe6eeff,
    0x232c46,
    HEMI_INTENSITY,
  )
  scene.add(hemiLight)
  const keyLight = new THREE.DirectionalLight(0xf4f9ff, KEY_INTENSITY)
  keyLight.position.set(-8, 7.5, 9)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  // Tight bounds around the tank; a default-sized shadow camera would spend most
  // of its resolution on empty space and leave the bed blocky.
  const shadowCamera = keyLight.shadow.camera
  shadowCamera.left = -TANK.width * 0.75
  shadowCamera.right = TANK.width * 0.75
  shadowCamera.top = TANK.width * 0.75
  shadowCamera.bottom = -TANK.width * 0.75
  shadowCamera.near = 0.5
  shadowCamera.far = 40
  shadowCamera.updateProjectionMatrix()
  // The sand's normal map perturbs shading, not geometry, so the offset has to
  // follow the surface normal or the bed self-shadows into stripes.
  keyLight.shadow.normalBias = 0.02
  keyLight.shadow.bias = -0.0002
  scene.add(keyLight)

  const skyTint = new THREE.Color()
  const applyLighting = (next: LightingOptions) => {
    const sat = next.saturation
    const bright = next.brightness
    keyLight.color.setHSL(next.hue, sat, 0.52 + (1 - sat) * 0.38)
    keyLight.intensity = KEY_INTENSITY * bright
    skyTint.setHSL(next.hue, sat * 0.42, 0.78)
    hemiLight.color.copy(skyTint)
    hemiLight.intensity = HEMI_INTENSITY * (0.4 + bright * 0.6)
    renderer.toneMappingExposure = 0.4 + bright * 0.58
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.setHSL(next.hue, sat * 0.22, 0.08)
    }
  }
  applyLighting(lighting)

  const tank = new THREE.Group()
  scene.add(tank)

  const environment = new RoomEnvironment()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envMap = pmrem.fromScene(environment, 0.04).texture
  environment.dispose()
  pmrem.dispose()
  scene.environment = envMap
  scene.environmentIntensity = 0.16

  const GLASS_THICKNESS = 0.12
  const glass = createGlassShell(GLASS_THICKNESS, envMap)
  tank.add(glass.group)

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xc6dbff,
    transparent: true,
    opacity: 0.5,
    linewidth: 2,
  })
  const edges = new THREE.LineSegments(glass.edgeGeometry, edgeMaterial)
  tank.add(edges)

  const createSandMaterial = () =>
    new THREE.MeshStandardMaterial({
      color: 0xc9b489,
      roughness: 0.9,
      metalness: 0.02,
    })
  const sandMaterial = createSandMaterial()
  const sandSideXMaterial = createSandMaterial()
  const sandSideZMaterial = createSandMaterial()

  const sandHeight = SAND_TOP_Y - SAND_BASE_Y
  const sandWidth = TANK.width - 0.012
  const sandDepth = TANK.depth - 0.012
  const sandFaceSizes = {
    top: new THREE.Vector2(sandWidth, sandDepth),
    sideX: new THREE.Vector2(sandDepth, sandHeight),
    sideZ: new THREE.Vector2(sandWidth, sandHeight),
  }
  const sandTopY = SAND_TOP_Y + 0.004
  const halfW = sandWidth / 2
  const halfD = sandDepth / 2
  const createDuneHeight = (seed: number) => {
    const random = mulberry32(seed + 203)
    const f1u = THREE.MathUtils.lerp(1.5, 2.9, random())
    const f1v = THREE.MathUtils.lerp(1.15, 2.5, random())
    const p1 = random() * Math.PI * 2
    const a1 = THREE.MathUtils.lerp(0.12, 0.2, random())
    const f2u = THREE.MathUtils.lerp(4.2, 7.4, random())
    const f2v = THREE.MathUtils.lerp(3.3, 5.9, random())
    const p2 = random() * Math.PI * 2
    const a2 = THREE.MathUtils.lerp(0.06, 0.12, random())
    const f3 = THREE.MathUtils.lerp(2.4, 4.8, random())
    const p3 = random() * Math.PI * 2
    const a3 = THREE.MathUtils.lerp(0.035, 0.07, random())
    const mix = THREE.MathUtils.lerp(0.7, 1.45, random())
    const base = THREE.MathUtils.lerp(0.08, 0.14, random())
    return (u: number, v: number) =>
      THREE.MathUtils.clamp(
        base +
          Math.sin(u * Math.PI * f1u + p1) * Math.cos(v * Math.PI * f1v) * a1 +
          Math.sin(u * Math.PI * f2u + p2) * Math.sin(v * Math.PI * f2v) * a2 +
          Math.sin((u * mix + v) * Math.PI * f3 + p3) * a3,
        0.04,
        0.34,
      )
  }
  const createSandSkirt = (
    count: number,
    nx: number,
    nz: number,
    heightAt: (u: number, v: number) => number,
    at: (t: number) => { x: number; z: number; u: number; v: number },
  ) => {
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    for (let i = 0; i <= count; i += 1) {
      const t = i / count
      const point = at(t)
      const topY = sandTopY + heightAt(point.u, point.v)
      positions.push(point.x, SAND_BASE_Y, point.z, point.x, topY, point.z)
      uvs.push(t, 0, t, 1)
    }
    for (let i = 0; i < count; i += 1) {
      const a = i * 2
      indices.push(a, a + 2, a + 3, a, a + 3, a + 1)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    )
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    const first = geometry.attributes.normal
    if (first.getX(0) * nx + first.getZ(0) * nz < 0) {
      for (let i = 0; i < indices.length; i += 3) {
        const swap = indices[i + 1]
        indices[i + 1] = indices[i + 2]
        indices[i + 2] = swap
      }
      geometry.setIndex(indices)
      geometry.computeVertexNormals()
    }
    return geometry
  }

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(sandWidth, sandDepth, 72, 44),
    sandMaterial,
  )
  sand.position.y = sandTopY
  sand.receiveShadow = true
  sand.castShadow = true
  const sandSideZPos = new THREE.Mesh(
    new THREE.BufferGeometry(),
    sandSideZMaterial,
  )
  const sandSideZNeg = new THREE.Mesh(
    new THREE.BufferGeometry(),
    sandSideZMaterial,
  )
  const sandSideXPos = new THREE.Mesh(
    new THREE.BufferGeometry(),
    sandSideXMaterial,
  )
  const sandSideXNeg = new THREE.Mesh(
    new THREE.BufferGeometry(),
    sandSideXMaterial,
  )
  const sandSides = [sandSideZPos, sandSideZNeg, sandSideXPos, sandSideXNeg]
  const rebuildSand = (seed: number) => {
    const heightAt = createDuneHeight(seed)
    const topGeometry = new THREE.PlaneGeometry(sandWidth, sandDepth, 72, 44)
    topGeometry.rotateX(-Math.PI / 2)
    const topPos = topGeometry.attributes.position
    for (let i = 0; i < topPos.count; i += 1) {
      const x = topPos.getX(i)
      const z = topPos.getZ(i)
      topPos.setY(i, heightAt(x / sandWidth + 0.5, z / sandDepth + 0.5))
    }
    topGeometry.computeVertexNormals()
    sand.geometry.dispose()
    sand.geometry = topGeometry
    const nextSkirts = [
      createSandSkirt(72, 0, 1, heightAt, (t) => ({
        x: -halfW + t * sandWidth,
        z: halfD,
        u: t,
        v: 1,
      })),
      createSandSkirt(72, 0, -1, heightAt, (t) => ({
        x: halfW - t * sandWidth,
        z: -halfD,
        u: 1 - t,
        v: 0,
      })),
      createSandSkirt(44, 1, 0, heightAt, (t) => ({
        x: halfW,
        z: halfD - t * sandDepth,
        u: 1,
        v: 1 - t,
      })),
      createSandSkirt(44, -1, 0, heightAt, (t) => ({
        x: -halfW,
        z: -halfD + t * sandDepth,
        u: 0,
        v: t,
      })),
    ]
    each(sandSides, (side, index) => {
      side.geometry.dispose()
      side.geometry = nextSkirts[index]
    })
  }
  rebuildSand(reefOptions.seed)

  const sandGroup = new THREE.Group()
  sandGroup.add(sand)
  each([sandSideZPos, sandSideZNeg, sandSideXPos, sandSideXNeg], (side) => {
    side.receiveShadow = true
    sandGroup.add(side)
  })
  tank.add(sandGroup)

  const water = createWaterSystem(
    renderer,
    TANK.width,
    TANK.depth,
    TANK.waterY,
    SAND_TOP_Y + 0.02,
  )
  tank.add(water.group)
  water.applyCaustics(sandMaterial)
  // The shell wraps the water, so it must not appear in what the surface samples.
  water.hideFromCapture(glass.group, edges)

  const glassDirt = createGlassDirt(
    TANK.width,
    TANK.height,
    TANK.depth,
    TANK.waterY,
    TANK.floorY,
  )
  tank.add(glassDirt.group)
  water.hideFromCapture(glassDirt.group)

  const sandTextures: THREE.Texture[] = []
  const textureLoader = new THREE.TextureLoader()
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
  // Clones share the loaded image, so each face can carry its own repeat without
  // a second upload.
  const tileTexture = (texture: THREE.Texture, faceSize: THREE.Vector2) => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.copy(faceSize).multiplyScalar(SAND_GRAIN_DENSITY)
    texture.anisotropy = maxAnisotropy
    sandTextures.push(texture)
    return texture
  }
  const applySandSides = (
    source: THREE.Texture,
    assign: (material: THREE.MeshStandardMaterial, map: THREE.Texture) => void,
  ) => {
    assign(sandSideXMaterial, tileTexture(source.clone(), sandFaceSizes.sideX))
    assign(sandSideZMaterial, tileTexture(source.clone(), sandFaceSizes.sideZ))
  }

  textureLoader.load(
    SAND_TEXTURE_URL,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      tileTexture(texture, sandFaceSizes.top)
      sandMaterial.map = texture
      sandMaterial.color.set(0xffffff)
      sandMaterial.needsUpdate = true
      water.setFloorMap(texture)

      applySandSides(texture, (material, map) => {
        material.map = map
        material.color.set(0xffffff)
        material.needsUpdate = true
      })
    },
    undefined,
    () => {},
  )
  textureLoader.load(
    SAND_NORMAL_URL,
    (texture) => {
      tileTexture(texture, sandFaceSizes.top)
      sandMaterial.normalMap = texture
      sandMaterial.normalScale.set(1.8, 1.8)
      sandMaterial.needsUpdate = true

      applySandSides(texture, (material, map) => {
        material.normalMap = map
        material.normalScale.set(1.2, 1.2)
        material.needsUpdate = true
      })
    },
    undefined,
    () => {},
  )

  const buildReef = (options: ReefOptions) => {
    const reef = createReef({
      ...options,
      floorY: SAND_TOP_Y,
      halfWidth: TANK.width / 2,
      halfDepth: TANK.depth / 2,
      envMap,
    })
    tank.add(reef.group)
    each(reef.materials, (material) => {
      if (material instanceof THREE.MeshPhysicalMaterial) return
      water.applyCaustics(material)
    })
    return reef
  }
  let coral = buildReef(reefOptions)

  let bubbleDropSkip = 0
  const spawnBubbles = (seed: number) =>
    createBubbles(
      SAND_TOP_Y,
      TANK.waterY,
      envMap,
      seed,
      TANK.width / 2,
      TANK.depth / 2,
      (x, z, size) => {
        if (bubbleDropSkip++ % 4 !== 0) return
        water.addDrop(x, z, 0.0022 + size * 0.0012, 0.012)
      },
    )
  let bubbles = spawnBubbles(reefOptions.seed)
  tank.add(bubbles.mesh)

  const fishBounds = {
    min: new THREE.Vector3(
      -TANK.width / 2 + 0.8,
      SAND_TOP_Y + 0.55,
      -TANK.depth / 2 + 0.8,
    ),
    max: new THREE.Vector3(
      TANK.width / 2 - 0.8,
      TANK.waterY - 0.32,
      TANK.depth / 2 - 0.8,
    ),
  }
  const goldfish = createGoldfishSchool(fishBounds, fishCount, (material) =>
    water.applyCaustics(material),
  )
  tank.add(goldfish.group)
  goldfish.setObstacles(coral.obstacles)

  const angelfish = createAngelfishSchool(
    fishBounds,
    angelfishCount,
    (material) => water.applyCaustics(material),
  )
  tank.add(angelfish.group)
  angelfish.setObstacles(coral.obstacles)

  const guppies = createGuppySchool(fishBounds, guppyCount, (material) =>
    water.applyCaustics(material),
  )
  tank.add(guppies.group)
  guppies.setObstacles(coral.obstacles)

  const tetras = createNeonTetraSchool(fishBounds, neonTetraCount, (material) =>
    water.applyCaustics(material),
  )
  tank.add(tetras.group)
  tetras.setObstacles(coral.obstacles)

  goldfish.setNeighbors([angelfish.fish, guppies.fish])
  angelfish.setNeighbors([goldfish.fish, guppies.fish])
  guppies.setNeighbors([goldfish.fish, angelfish.fish])
  tetras.setNeighbors([goldfish.fish, angelfish.fish, guppies.fish])

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TANK.waterY)
  const intersection = new THREE.Vector3()

  const getWaterPoint = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    )
    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.ray.intersectPlane(waterPlane, intersection)) return null
    if (
      Math.abs(intersection.x) > TANK.width / 2 ||
      Math.abs(intersection.z) > TANK.depth / 2
    ) {
      return null
    }

    return intersection
  }

  let strokePointerId: number | null = null

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (strokePointerId !== null) return

    const point = getWaterPoint(event)
    if (!point) return

    // Claim the gesture before OrbitControls sees it so dragging the water
    // ripples the surface instead of rotating the view.
    event.stopPropagation()
    event.preventDefault()
    strokePointerId = event.pointerId
    controls.enabled = false
    water.addDrop(point.x, point.z, 0.01)
    startleFish(point.x, point.z)
  }

  const startleFish = (x: number, z: number) => {
    goldfish.scare(x, TANK.waterY, z)
    angelfish.scare(x, TANK.waterY, z)
    guppies.scare(x, TANK.waterY, z)
    tetras.scare(x, TANK.waterY, z)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== strokePointerId) return
    const point = getWaterPoint(event)
    if (!point) return
    water.addDrop(point.x, point.z, 0.01)
    startleFish(point.x, point.z)
  }

  const onPointerEnd = (event: PointerEvent) => {
    if (event.pointerId !== strokePointerId) return
    strokePointerId = null
    controls.enabled = true
  }

  canvas.addEventListener('pointerdown', onPointerDown, { capture: true })
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerEnd)
  window.addEventListener('pointercancel', onPointerEnd)

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth)
    const height = Math.max(1, canvas.clientHeight)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  const clock = new THREE.Clock()
  let fpsFrames = 0
  let fpsStamp = performance.now()
  let fishMsAcc = 0
  let captureMsAcc = 0
  let waterMsAcc = 0
  let sceneMsAcc = 0
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta()
    const fishStart = performance.now()
    goldfish.update(dt)
    angelfish.update(dt)
    guppies.update(dt)
    tetras.update(dt)
    coral.update(dt)
    bubbles.update(clock.getElapsedTime())
    fishMsAcc += performance.now() - fishStart
    const waterStart = performance.now()
    const waterCost = water.update(camera, scene)
    waterMsAcc += performance.now() - waterStart
    captureMsAcc += waterCost.captureMs
    controls.update()
    if (suppressViewPersist > 0) suppressViewPersist -= 1
    renderer.info.reset()
    const sceneStart = performance.now()
    renderer.render(scene, camera)
    sceneMsAcc += performance.now() - sceneStart
    fpsFrames += 1
    const now = performance.now()
    const elapsed = now - fpsStamp
    if (elapsed >= 500) {
      const cpuMs =
        (fishMsAcc + waterMsAcc + sceneMsAcc) / Math.max(fpsFrames, 1)
      onFps?.({
        fps: Math.round((fpsFrames * 1000) / elapsed),
        fishMs: fishMsAcc / fpsFrames,
        captureMs: captureMsAcc / fpsFrames,
        waterMs: waterMsAcc / fpsFrames,
        sceneMs: sceneMsAcc / fpsFrames,
        cpuMs,
        draws: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        pixelRatio: renderer.getPixelRatio(),
        width: renderer.domElement.width,
        height: renderer.domElement.height,
      })
      fpsFrames = 0
      fpsStamp = now
      fishMsAcc = 0
      captureMsAcc = 0
      waterMsAcc = 0
      sceneMsAcc = 0
    }
  })

  return {
    setReef(options) {
      tank.remove(coral.group)
      coral.dispose()
      coral = buildReef(options)
      goldfish.setObstacles(coral.obstacles)
      angelfish.setObstacles(coral.obstacles)
      guppies.setObstacles(coral.obstacles)
      tetras.setObstacles(coral.obstacles)
      tank.remove(bubbles.mesh)
      bubbles.dispose()
      bubbles = spawnBubbles(options.seed)
      tank.add(bubbles.mesh)
      rebuildSand(options.seed)
      water.invalidateCapture()
    },
    setFishCount(count) {
      goldfish.setCount(count)
    },
    setAngelfishCount(count) {
      angelfish.setCount(count)
    },
    setGuppyCount(count) {
      guppies.setCount(count)
    },
    setNeonTetraCount(count) {
      tetras.setCount(count)
    },
    setLighting(next) {
      applyLighting(next)
    },
    setView(next) {
      suppressViewPersist = 12
      camera.position.fromArray(next.position)
      controls.target.fromArray(next.target)
      controls.update()
    },
    setRenderScale(scale) {
      maxRenderScale = scale
      applyPixelRatio()
      resize()
    },
    dispose() {
      renderer.setAnimationLoop(null)
      window.clearTimeout(saveViewTimer)
      persistView()
      controls.removeEventListener('change', onControlsChange)
      resizeObserver.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown, {
        capture: true,
      })
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
      controls.dispose()
      water.dispose()
      coral.dispose()
      goldfish.dispose()
      angelfish.dispose()
      guppies.dispose()
      tetras.dispose()
      bubbles.dispose()
      glassDirt.dispose()
      envMap.dispose()
      each(sandTextures, (texture) => texture.dispose())
      tank.remove(water.group)
      tank.remove(coral.group)
      tank.remove(goldfish.group)
      tank.remove(angelfish.group)
      tank.remove(guppies.group)
      tank.remove(tetras.group)
      tank.remove(bubbles.mesh)
      scene.traverse((object) => {
        if (!(
          object instanceof THREE.Mesh || object instanceof THREE.LineSegments
        )) {
          return
        }
        object.geometry.dispose()
        const materials = isArr(object.material)
          ? object.material
          : [object.material]
        each(materials, (material) => material.dispose())
      })
      renderer.dispose()
    },
  }
}
