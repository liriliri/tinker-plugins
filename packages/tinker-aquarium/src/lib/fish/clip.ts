import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import clamp from 'licia/clamp'
import each from 'licia/each'
import map from 'licia/map'
import toArr from 'licia/toArr'
import { fishConfig, GUPPY_CAPACITY } from './config'
import { readFishModel, type FishModelId } from './catalog'
import {
  hardenFishMaterial,
  loadFishGltf,
  prepareAnimatedTemplate,
} from './model'
import { writeFishOrientationQuaternion } from './pose'
import { FishSchoolSimulation } from './simulation'
import type { FishBounds, FishSchool, FishState } from './types'
import type { ReefObstacle } from '../reef/types'

const tmpQuaternion = new THREE.Quaternion()

interface ClipVisual {
  root: THREE.Object3D
  mixer: THREE.AnimationMixer
  action: THREE.AnimationAction | null
}

export function createClipFishSchool(
  id: FishModelId,
  bounds: FishBounds,
  count: number,
  decorateMaterial?: (material: THREE.Material) => void,
): FishSchool {
  const species = readFishModel(id)
  const capacity = GUPPY_CAPACITY
  const group = new THREE.Group()
  group.name = species.id
  const simulation = new FishSchoolSimulation(bounds, species)
  simulation.reset(Math.min(count, capacity), 91)

  const visuals: ClipVisual[] = []
  let template: THREE.Object3D | null = null
  let clips: THREE.AnimationClip[] = []
  let disposed = false

  loadFishGltf(id)
    .then((gltf) => {
      if (disposed) return
      clips = gltf.animations
      const prepared = prepareAnimatedTemplate(gltf.scene, species)
      prepared.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.castShadow = true
        object.receiveShadow = true
        object.frustumCulled = false
        const material = hardenFishMaterial(object.material, {
          keepColor: true,
          doubleSide: true,
        })
        object.material = material
      })
      template = prepared
      syncVisuals()
    })
    .catch(() => {})

  const addVisual = (fish: FishState) => {
    const model = cloneSkeleton(template!)
    model.traverse((object) => {
      object.frustumCulled = false
      if (!(object instanceof THREE.Mesh)) return
      const materials = toArr(object.material) as THREE.Material[]
      const next = map(materials, (material: THREE.Material) => {
        const cloned = material.clone()
        decorateMaterial?.(cloned)
        if ('color' in cloned && cloned.color instanceof THREE.Color) {
          cloned.color.setRGB(fish.tint.r, fish.tint.g, fish.tint.b)
        }
        return cloned
      })
      object.material = next.length === 1 ? next[0] : next
    })
    const root = new THREE.Group()
    root.frustumCulled = false
    root.add(model)
    const mixer = new THREE.AnimationMixer(model)
    const clip = clips[0] ?? null
    const action = clip ? mixer.clipAction(clip) : null
    if (action && clip) {
      action.play()
      action.time = (visuals.length * 0.37) % Math.max(clip.duration, 0.001)
    }
    group.add(root)
    visuals.push({ root, mixer, action })
  }

  const syncVisuals = () => {
    if (!template) return
    while (visuals.length > simulation.fish.length) {
      const visual = visuals.pop()
      if (!visual) break
      visual.mixer.stopAllAction()
      group.remove(visual.root)
    }
    while (visuals.length < simulation.fish.length) {
      addVisual(simulation.fish[visuals.length])
    }
  }

  return {
    group,
    update(dt) {
      const step = Math.min(dt, 1 / 30)
      simulation.update(step)
      each(simulation.fish, (fish, i) => {
        const visual = visuals[i]
        if (!visual) return
        writeFishOrientationQuaternion(fish, tmpQuaternion)
        visual.root.position.set(
          fish.position.x,
          fish.position.y,
          fish.position.z,
        )
        visual.root.quaternion.copy(tmpQuaternion)
        visual.root.scale.set(fish.scale.x, fish.scale.y, fish.scale.z)
        if (visual.action) {
          visual.action.timeScale = THREE.MathUtils.lerp(
            0.55,
            2.15,
            fish.kickTime > 0
              ? THREE.MathUtils.inverseLerp(
                  fishConfig.kickFrequency.min,
                  fishConfig.kickFrequency.max,
                  fish.kickFrequency,
                )
              : 0.18,
          )
        }
        visual.mixer.update(step)
      })
    },
    setCount(next) {
      simulation.setCount(clamp(next, 0, capacity))
      syncVisuals()
    },
    setObstacles(obstacles: ReefObstacle[]) {
      simulation.setObstacles(obstacles)
    },
    dispose() {
      disposed = true
      each(visuals, (visual) => {
        visual.mixer.stopAllAction()
        group.remove(visual.root)
      })
      visuals.length = 0
      template?.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        each(toArr(object.material), (material: THREE.Material) => {
          material.dispose()
        })
      })
      template = null
    },
  }
}
