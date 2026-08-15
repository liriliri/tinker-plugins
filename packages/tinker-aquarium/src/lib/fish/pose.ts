import * as THREE from 'three'
import type { FishState } from './types'

const worldUp = new THREE.Vector3(0, 1, 0)
const tmpForward = new THREE.Vector3()
const tmpDorsal = new THREE.Vector3()
const tmpRight = new THREE.Vector3()
const tmpBasis = new THREE.Matrix4()

export function writeFishOrientationQuaternion(
  fish: FishState,
  target: THREE.Quaternion,
  flattenPitch = false,
) {
  const pitch = flattenPitch ? 0 : fish.pitch
  const cosPitch = Math.cos(pitch)
  tmpForward.set(
    Math.cos(fish.angle) * cosPitch,
    Math.sin(pitch),
    Math.sin(fish.angle) * cosPitch,
  )

  tmpDorsal.copy(worldUp).addScaledVector(tmpForward, -worldUp.dot(tmpForward))
  tmpDorsal.normalize()
  tmpRight.crossVectors(tmpForward, tmpDorsal).normalize()
  tmpDorsal.crossVectors(tmpRight, tmpForward).normalize()
  tmpBasis.makeBasis(tmpRight, tmpForward, tmpDorsal)
  return target.setFromRotationMatrix(tmpBasis)
}
