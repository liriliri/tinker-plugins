import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import clamp from 'licia/clamp'
import each from 'licia/each'
import toArr from 'licia/toArr'
import { createReef } from './reef'
import { DEFAULT_REEF, type ReefOptions } from './reef/types'
import { createWaterSystem } from './water'

const TANK = {
  width: 18,
  height: 10,
  depth: 11,
  floorY: -5,
  waterY: 4.25,
}

const SAND_THICKNESS = 0.7
// Kept clear of the glass bottom face, otherwise the coplanar faces z-fight.
const SAND_BASE_Y = TANK.floorY + 0.03
const SAND_TOP_Y = TANK.floorY + SAND_THICKNESS
// Sand textures live in the plugin's `public/images/` folder; missing files
// fall back to the procedural sand color below.
const SAND_TEXTURE_URL = 'images/sand.jpg'
const SAND_NORMAL_URL = 'images/sand_normal.jpg'
// Repeats per world unit rather than per face: a box face's UVs always run 0..1
// over its own size, so a shared repeat would stretch the grain across the thin
// sides. One tile spans ~11 units at this density.
const SAND_GRAIN_DENSITY = 0.088

export interface Aquarium {
  setReef: (options: ReefOptions) => void
  dispose: () => void
}

export function createAquarium(
  canvas: HTMLCanvasElement,
  reefOptions: ReefOptions = DEFAULT_REEF,
): Aquarium {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  })
  renderer.setPixelRatio(clamp(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
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

  // The fill is all that survives inside a shadow, so a cyan tint here turns every
  // shadowed patch of warm sand olive. A blue-grey bounce keeps them as cool shade.
  scene.add(new THREE.HemisphereLight(0xe6eeff, 0x232c46, 1))
  // A grazing key light is what makes the sand's normal map read as relief;
  // a steep one flattens it because N·L barely changes.
  const keyLight = new THREE.DirectionalLight(0xf4f9ff, 2.6)
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

  const tank = new THREE.Group()
  scene.add(tank)

  const glassGeometry = new THREE.BoxGeometry(
    TANK.width,
    TANK.height,
    TANK.depth,
  )
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9cc2ff,
    transparent: true,
    opacity: 0.075,
    roughness: 0.08,
    metalness: 0,
    transmission: 0.35,
    thickness: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const glass = new THREE.Mesh(glassGeometry, glassMaterial)
  tank.add(glass)

  const edgeGeometry = new THREE.EdgesGeometry(glassGeometry)
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xc6dbff,
    transparent: true,
    opacity: 0.38,
  })
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
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
  // Never in view, so it stays untextured.
  const sandBottomMaterial = new THREE.MeshStandardMaterial({
    color: 0xa38d66,
    roughness: 1,
    metalness: 0,
  })

  const sandHeight = SAND_TOP_Y - SAND_BASE_Y
  const sandWidth = TANK.width - 0.1
  const sandDepth = TANK.depth - 0.1
  // The world size each face's UVs are stretched over.
  const sandFaceSizes = {
    top: new THREE.Vector2(sandWidth, sandDepth),
    sideX: new THREE.Vector2(sandDepth, sandHeight),
    sideZ: new THREE.Vector2(sandWidth, sandHeight),
  }

  const sand = new THREE.Mesh(
    new THREE.BoxGeometry(sandWidth, sandHeight, sandDepth),
    // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z.
    [
      sandSideXMaterial,
      sandSideXMaterial,
      sandMaterial,
      sandBottomMaterial,
      sandSideZMaterial,
      sandSideZMaterial,
    ],
  )
  sand.position.y = SAND_BASE_Y + sandHeight / 2
  sand.receiveShadow = true
  tank.add(sand)

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
  water.hideFromCapture(glass, edges)

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
    })
    tank.add(reef.group)
    // Same light bands the bed gets, otherwise the colonies float free of the scene.
    each(reef.materials, (material) => water.applyCaustics(material))
    return reef
  }
  let coral = buildReef(reefOptions)

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
  }

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== strokePointerId) return
    const point = getWaterPoint(event)
    if (!point) return
    water.addDrop(point.x, point.z, 0.01)
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

  renderer.setAnimationLoop(() => {
    water.update(camera, scene)
    controls.update()
    renderer.render(scene, camera)
  })

  return {
    setReef(options) {
      tank.remove(coral.group)
      coral.dispose()
      coral = buildReef(options)
      water.invalidateCapture()
    },
    dispose() {
      renderer.setAnimationLoop(null)
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
      each(sandTextures, (texture) => texture.dispose())
      tank.remove(water.group)
      tank.remove(coral.group)
      scene.traverse((object) => {
        if (!(
          object instanceof THREE.Mesh || object instanceof THREE.LineSegments
        )) {
          return
        }
        object.geometry.dispose()
        each(toArr(object.material), (material) => material.dispose())
      })
      renderer.dispose()
    },
  }
}
