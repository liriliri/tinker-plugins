import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import {
  VRMAnimationLoaderPlugin,
  createVRMAnimationClip,
  type VRMAnimation,
} from '@pixiv/three-vrm-animation'
import clamp from 'licia/clamp'
import compact from 'licia/compact'
import map from 'licia/map'
import noop from 'licia/noop'
import trim from 'licia/trim'
import type { VrmInfo } from '../types'
import appearingUrl from '../assets/appearing.vrma?url'
import waitingUrl from '../assets/waiting.vrma?url'

export interface VrmViewer {
  load(buffer: ArrayBuffer): Promise<VrmInfo>
  setAutoRotate(enabled: boolean): void
  resetCamera(): void
  dispose(): void
}

function readInfo(vrm: VRM, fallbackName: string): VrmInfo {
  const meta = vrm.meta
  if (!meta) {
    return { name: fallbackName, version: '', authors: '' }
  }

  if (meta.metaVersion === '0') {
    return {
      name: trim(meta.title || '') || fallbackName,
      version: trim(meta.version || '') || meta.metaVersion,
      authors: trim(meta.author || ''),
    }
  }

  return {
    name: trim(meta.name || '') || fallbackName,
    version: trim(meta.version || '') || meta.metaVersion,
    authors: compact(map(meta.authors, (a) => trim(a))).join(', '),
  }
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 1.4, 2.4)
const DEFAULT_CONTROLS_TARGET = new THREE.Vector3(0, 1, 0)

function resetCameraView(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
) {
  camera.position.copy(DEFAULT_CAMERA_POS)
  controls.target.copy(DEFAULT_CONTROLS_TARGET)
  controls.update()
}

function frameCamera(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) {
    resetCameraView(camera, controls)
    return
  }

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.5)
  const fov = (camera.fov * Math.PI) / 180
  const distance = (maxDim / (2 * Math.tan(fov / 2))) * 1.55

  camera.near = Math.max(distance / 100, 0.01)
  camera.far = Math.max(distance * 100, 100)
  camera.updateProjectionMatrix()
  camera.position.set(center.x, center.y + size.y * 0.05, center.z + distance)
  controls.target.copy(center)
  controls.minDistance = maxDim * 0.35
  controls.maxDistance = maxDim * 8
  controls.update()
}

async function loadVrma(url: string): Promise<VRMAnimation> {
  const loader = new GLTFLoader()
  loader.register((parser) => new VRMAnimationLoaderPlugin(parser))
  const gltf = await loader.loadAsync(url)
  const anims = gltf.userData.vrmAnimations as VRMAnimation[] | undefined
  const anim = anims?.[0]
  if (!anim) {
    throw new Error('invalidVrma')
  }
  return anim
}

function createContactShadow(): THREE.Mesh {
  const size = 256
  const canvasEl = document.createElement('canvas')
  canvasEl.width = size
  canvasEl.height = size
  const ctx = canvasEl.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.06,
      size / 2,
      size / 2,
      size / 2,
    )
    gradient.addColorStop(0, 'rgba(20, 24, 32, 0.38)')
    gradient.addColorStop(0.4, 'rgba(20, 24, 32, 0.16)')
    gradient.addColorStop(1, 'rgba(20, 24, 32, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  const texture = new THREE.CanvasTexture(canvasEl)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = -1
  mesh.visible = false
  return mesh
}

function placeContactShadow(shadow: THREE.Mesh, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) {
    shadow.visible = false
    return
  }

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const span = Math.max(size.x, size.z, 0.35) * 1.55
  shadow.scale.set(span, span, 1)
  shadow.position.set(center.x, box.min.y + 0.002, center.z)
  shadow.visible = true
}

const presetAnims = Promise.all([
  loadVrma(appearingUrl),
  loadVrma(waitingUrl),
]).then(([appearing, waiting]) => ({ appearing, waiting }))

export function createVrmViewer(
  canvas: HTMLCanvasElement,
  fileName: string,
): VrmViewer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  })
  renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1

  const scene = new THREE.Scene()
  const syncBackground = () => {
    const raw = trim(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--vrm-preview',
      ),
    )
    const color = new THREE.Color(raw || '#e4dde8')
    scene.background = color
    renderer.setClearColor(color, 1)
  }
  syncBackground()
  const themeObserver = new MutationObserver(syncBackground)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.copy(DEFAULT_CAMERA_POS)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.target.copy(DEFAULT_CONTROLS_TARGET)
  controls.autoRotateSpeed = 1.2

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb0b4bc, 1.1)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xffffff, 1.35)
  key.position.set(1.4, 2.2, 1.8)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xdde4ff, 0.45)
  fill.position.set(-1.6, 1.2, -1.2)
  scene.add(fill)

  const contactShadow = createContactShadow()
  scene.add(contactShadow)

  const loader = new GLTFLoader()
  loader.register((parser) => new VRMLoaderPlugin(parser))

  const clock = new THREE.Clock()
  let vrm: VRM | null = null
  let mixer: THREE.AnimationMixer | null = null
  let raf = 0
  let disposed = false
  let shadowTick = 0

  const resize = () => {
    const parent = canvas.parentElement
    if (!parent) return
    const width = parent.clientWidth
    const height = parent.clientHeight
    if (width < 1 || height < 1) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const onResize = () => resize()
  window.addEventListener('resize', onResize)
  resize()

  const stopAnimations = () => {
    mixer?.stopAllAction()
    mixer = null
  }

  const playPresetAnimations = async (target: VRM) => {
    stopAnimations()
    const { appearing, waiting } = await presetAnims
    if (disposed || vrm !== target) return

    const nextMixer = new THREE.AnimationMixer(target.scene)
    mixer = nextMixer

    const appearClip = createVRMAnimationClip(appearing, target)
    const waitClip = createVRMAnimationClip(waiting, target)

    const appearAction = nextMixer.clipAction(appearClip)
    appearAction.setLoop(THREE.LoopOnce, 1)
    appearAction.clampWhenFinished = true

    const waitAction = nextMixer.clipAction(waitClip)
    waitAction.setLoop(THREE.LoopRepeat, Infinity)

    const onFinished = (event: { action: THREE.AnimationAction }) => {
      if (event.action !== appearAction || mixer !== nextMixer) return
      nextMixer.removeEventListener('finished', onFinished)
      appearAction.fadeOut(0.25)
      waitAction.reset().fadeIn(0.25).play()
    }
    nextMixer.addEventListener('finished', onFinished)
    appearAction.play()
  }

  const tick = () => {
    if (disposed) return
    raf = requestAnimationFrame(tick)
    const delta = clock.getDelta()
    mixer?.update(delta)
    vrm?.update(delta)
    shadowTick += 1
    if (vrm && shadowTick % 2 === 0) {
      placeContactShadow(contactShadow, vrm.scene)
    }
    controls.update()
    renderer.render(scene, camera)
  }
  tick()

  const clearModel = () => {
    stopAnimations()
    contactShadow.visible = false
    if (!vrm) return
    scene.remove(vrm.scene)
    VRMUtils.deepDispose(vrm.scene)
    vrm = null
  }

  return {
    async load(buffer) {
      clearModel()

      const gltf = await loader.parseAsync(buffer, '')
      const next = gltf.userData.vrm as VRM | undefined
      if (!next) {
        throw new Error('notVrm')
      }

      VRMUtils.removeUnnecessaryVertices(gltf.scene)
      VRMUtils.combineSkeletons(gltf.scene)
      VRMUtils.rotateVRM0(next)

      next.scene.traverse((obj) => {
        obj.frustumCulled = false
      })

      scene.add(next.scene)
      vrm = next
      placeContactShadow(contactShadow, next.scene)
      frameCamera(next.scene, camera, controls)
      void playPresetAnimations(next).catch(noop)
      return readInfo(next, fileName)
    },

    setAutoRotate(enabled) {
      controls.autoRotate = enabled
    },

    resetCamera() {
      if (vrm) {
        frameCamera(vrm.scene, camera, controls)
        return
      }
      resetCameraView(camera, controls)
    },

    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      themeObserver.disconnect()
      clearModel()
      scene.remove(contactShadow)
      const shadowMaterial = contactShadow.material as THREE.MeshBasicMaterial
      shadowMaterial.map?.dispose()
      shadowMaterial.dispose()
      contactShadow.geometry.dispose()
      controls.dispose()
      renderer.dispose()
    },
  }
}
