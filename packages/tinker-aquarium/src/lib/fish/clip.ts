import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import clamp from 'licia/clamp'
import each from 'licia/each'
import filter from 'licia/filter'
import map from 'licia/map'
import { fishConfig, GUPPY_CAPACITY, neonSimulationSettings } from './config'
import { readFishModel, type FishModelId } from './catalog'
import {
  hardenFishMaterial,
  isFishMesh,
  loadFishGltf,
  meshMaterials,
  prepareAnimatedTemplate,
} from './model'
import { writeFishOrientationQuaternion } from './pose'
import { FishSchoolSimulation } from './simulation'
import type { FishBounds, FishSchool, FishState } from './types'
import type { ReefObstacle } from '../reef/types'

const tmpQuaternion = new THREE.Quaternion()

function stripClipRootMotion(
  clips: THREE.AnimationClip[],
  scene: THREE.Object3D,
) {
  const roots = new Set<string>([scene.name])
  scene.traverse((object) => {
    const skinned = object as THREE.SkinnedMesh
    if (!skinned.isSkinnedMesh || !skinned.skeleton) return
    const bones = skinned.skeleton.bones
    for (let i = 0; i < Math.min(3, bones.length); i += 1) {
      const name = bones[i].name
      if (
        i < 2 ||
        /rootjoint/i.test(name) ||
        /^Bone_Armature(_\d+)?$/i.test(name)
      ) {
        roots.add(name)
      }
    }
  })
  each(clips, (clip) => {
    clip.tracks = filter(clip.tracks, (track) => {
      const dot = track.name.lastIndexOf('.')
      if (dot < 0) return true
      const node = track.name.slice(0, dot)
      const prop = track.name.slice(dot + 1)
      if (!roots.has(node)) return true
      return prop !== 'position' && prop !== 'quaternion'
    })
  })
}

function disposeVisual(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!isFishMesh(object)) return
    each(meshMaterials(object), (material) => {
      material.dispose()
    })
  })
}

interface ClipVisual {
  root: THREE.Object3D
  mixer: THREE.AnimationMixer
  action: THREE.AnimationAction | null
  bind: THREE.Object3D
  bindPos: THREE.Vector3
  bindQuat: THREE.Quaternion
}

export function createClipFishSchool(
  id: FishModelId,
  bounds: FishBounds,
  count: number,
  decorateMaterial?: (material: THREE.Material) => void,
  options: { capacity?: number; seed?: number } = {},
): FishSchool {
  const species = readFishModel(id)
  const capacity = options.capacity ?? GUPPY_CAPACITY
  const group = new THREE.Group()
  group.name = species.id
  const simulation = new FishSchoolSimulation(
    bounds,
    species,
    species.schooling ? neonSimulationSettings : undefined,
  )
  simulation.reset(Math.min(count, capacity), options.seed ?? 91)

  const visuals: ClipVisual[] = []
  let template: THREE.Object3D | null = null
  let clips: THREE.AnimationClip[] = []
  let disposed = false
  const maxSpeed = simulation.settings.maxSpeed

  loadFishGltf(id)
    .then((gltf) => {
      if (disposed) return
      clips = gltf.animations
      stripClipRootMotion(clips, gltf.scene)
      const prepared = prepareAnimatedTemplate(gltf.scene, species)
      prepared.traverse((object) => {
        if (!isFishMesh(object)) return
        object.castShadow = true
        object.receiveShadow = false
        object.frustumCulled = false
        const next = map(meshMaterials(object), (material) => {
          const hardened = hardenFishMaterial(material, {
            keepColor: true,
            doubleSide: true,
          })
          return hardened
        })
        object.material = next.length === 1 ? next[0] : next
      })
      template = prepared
      syncVisuals()
    })
    .catch(() => {})

  const addVisual = (fish: FishState) => {
    const model = cloneSkeleton(template!)
    model.traverse((object) => {
      if (!isFishMesh(object)) return
      object.frustumCulled = false
      const next = map(meshMaterials(object), (material) => {
        const cloned = material.clone()
        decorateMaterial?.(cloned)
        if ('color' in cloned && cloned.color instanceof THREE.Color) {
          cloned.color.setRGB(fish.tint.r, fish.tint.g, fish.tint.b)
        }
        return cloned
      })
      object.material = next.length === 1 ? next[0] : next
    })
    const bind = model.children[0]?.children[0] ?? model
    const mixer = new THREE.AnimationMixer(model)
    let action: THREE.AnimationAction | null = null
    each(clips, (clip, index) => {
      const next = mixer.clipAction(clip)
      next.setLoop(THREE.LoopRepeat, Infinity)
      next.play()
      if (index === 0) {
        next.time = (visuals.length * 0.37) % Math.max(clip.duration, 0.001)
        action = next
      }
    })
    const root = new THREE.Group()
    root.add(model)
    group.add(root)
    visuals.push({
      root,
      mixer,
      action,
      bind,
      bindPos: bind.position.clone(),
      bindQuat: bind.quaternion.clone(),
    })
  }

  const dropVisual = (visual: ClipVisual) => {
    visual.mixer.stopAllAction()
    group.remove(visual.root)
    disposeVisual(visual.root)
  }

  const syncVisuals = () => {
    if (!template) return
    while (visuals.length > simulation.fish.length) {
      const visual = visuals.pop()
      if (visual) dropVisual(visual)
    }
    while (visuals.length < simulation.fish.length) {
      addVisual(simulation.fish[visuals.length])
    }
  }

  return {
    group,
    fish: simulation.fish,
    update(dt) {
      const step = Math.min(dt, 1 / 30)
      simulation.update(step)
      const schooling = species.schooling === true
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
          const tempo = THREE.MathUtils.clamp(fish.speed / maxSpeed, 0.15, 3.4)
          const energy = THREE.MathUtils.clamp(
            Math.max(
              (tempo - 0.2) / 2.8,
              fish.kickTime > 0
                ? THREE.MathUtils.inverseLerp(
                    fishConfig.kickFrequency.min,
                    fishConfig.kickFrequency.max,
                    fish.kickFrequency,
                  )
                : 0,
            ),
            0,
            1,
          )
          visual.action.timeScale = schooling
            ? THREE.MathUtils.lerp(1.5, 4.6, energy)
            : THREE.MathUtils.lerp(0.55, 4.9, energy)
        }
        visual.mixer.update(step)
        visual.bind.position.copy(visual.bindPos)
        visual.bind.quaternion.copy(visual.bindQuat)
      })
    },
    setCount(next) {
      simulation.setCount(clamp(next, 0, capacity))
      syncVisuals()
    },
    setObstacles(obstacles: ReefObstacle[]) {
      simulation.setObstacles(obstacles)
    },
    setNeighbors(groups) {
      simulation.setNeighbors(groups)
    },
    scare(x, y, z) {
      simulation.scare(x, y, z)
    },
    dispose() {
      disposed = true
      each(visuals, dropVisual)
      visuals.length = 0
      if (template) {
        template.traverse((object) => {
          if (!isFishMesh(object)) return
          object.geometry.dispose()
          each(meshMaterials(object), (material) => {
            material.dispose()
          })
        })
      }
      template = null
    },
  }
}
