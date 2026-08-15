import * as THREE from 'three'
import clamp from 'licia/clamp'
import { fishConfig } from './config'
import type { FishState } from './types'

const FISH_CURVE_BEND_ATTRIBUTE = 'fishCurveBend'
const FISH_CURVE_MOTION_ATTRIBUTE = 'fishCurveMotion'

const fishCurveDeformationChunk = `
attribute vec4 fishCurveBend;
attribute vec4 fishCurveMotion;

float fishCurveAlong(vec3 localPosition) {
  float halfLength = max(fishCurveMotion.z, 0.0001);
  return clamp((halfLength - localPosition.y) / (halfLength * 2.0), 0.0, 1.0);
}

vec2 readFishCurveBend(vec3 localPosition) {
  float along = fishCurveAlong(localPosition);
  float rear = smoothstep(0.32, 0.9, along);
  float tail = smoothstep(0.58, 0.98, along);
  float swimDrive = clamp(fishCurveMotion.y, 0.0, 1.0);
  float phase = fishCurveMotion.x + along * 4.8;
  float bodyWave = sin(phase);
  float tailWave = sin(phase - 1.05);
  vec2 bend = vec2(fishCurveBend.x, 0.0) * rear;
  bend.x += bodyWave * fishCurveBend.z * rear * swimDrive;
  bend.x += tailWave * fishCurveBend.z * 1.3 * tail * max(swimDrive, 0.22);
  return clamp(bend, vec2(-fishCurveBend.w), vec2(fishCurveBend.w));
}

mat3 readFishCurveFrame(vec3 localPosition) {
  vec2 bend = readFishCurveBend(localPosition);
  float fromHead = max(fishCurveAlong(localPosition) - 0.16, 0.0);
  vec3 tangent = normalize(vec3(-bend.x * fromHead, 1.0, 0.0));
  vec3 right = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
  vec3 dorsal = normalize(cross(right, tangent));
  return mat3(right, tangent, dorsal);
}

vec3 deformFishCurvePosition(vec3 localPosition) {
  vec2 bend = readFishCurveBend(localPosition);
  mat3 frame = readFishCurveFrame(localPosition);
  float halfLength = max(fishCurveMotion.z, 0.0001);
  float fromHead = max(fishCurveAlong(localPosition) - 0.16, 0.0);
  vec3 centerline = vec3(
    bend.x * fromHead * fromHead * halfLength,
    localPosition.y,
    0.0
  );
  return centerline + frame[0] * localPosition.x + frame[2] * localPosition.z;
}

vec3 deformFishCurveNormal(vec3 localNormal, vec3 localPosition) {
  return normalize(readFishCurveFrame(localPosition) * localNormal);
}
`

interface FishCurveAttributes {
  bend: THREE.InstancedBufferAttribute | null
  motion: THREE.InstancedBufferAttribute | null
}

export function addFishCurveAttributes(
  geometry: THREE.BufferGeometry,
  count: number,
  length: number,
) {
  const curveBend = new THREE.InstancedBufferAttribute(
    new Float32Array(count * 4),
    4,
  )
  const curveMotion = new THREE.InstancedBufferAttribute(
    new Float32Array(count * 4),
    4,
  )
  const halfLength = length * 0.5
  for (let i = 0; i < count; i += 1) {
    curveBend.setXYZW(
      i,
      0,
      0,
      fishConfig.swimCurveStrength,
      fishConfig.curveDeformationMax,
    )
    curveMotion.setXYZW(i, 0, 0, halfLength, 0)
  }
  geometry.setAttribute(FISH_CURVE_BEND_ATTRIBUTE, curveBend)
  geometry.setAttribute(FISH_CURVE_MOTION_ATTRIBUTE, curveMotion)
}

export function enableFishCurveDeformation(material: THREE.Material) {
  const previousOnBeforeCompile = material.onBeforeCompile
  material.customProgramCacheKey = () => 'fish-curve-headlock'
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile?.call(material, shader, renderer)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\n${fishCurveDeformationChunk}`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `
vec3 objectNormal = deformFishCurveNormal(normal, position);
#ifdef USE_TANGENT
  vec3 objectTangent = deformFishCurveNormal(tangent.xyz, position);
#endif
`,
      )
      .replace(
        '#include <begin_vertex>',
        'vec3 transformed = deformFishCurvePosition(position);',
      )
  }
  material.needsUpdate = true
}

export function readFishCurveAttributes(
  geometry: THREE.BufferGeometry,
): FishCurveAttributes {
  return {
    bend: geometry.getAttribute(
      FISH_CURVE_BEND_ATTRIBUTE,
    ) as THREE.InstancedBufferAttribute | null,
    motion: geometry.getAttribute(
      FISH_CURVE_MOTION_ATTRIBUTE,
    ) as THREE.InstancedBufferAttribute | null,
  }
}

export function updateFishCurveAttributes(
  attributes: FishCurveAttributes,
  index: number,
  fish: FishState,
  length: number,
) {
  attributes.bend?.setXYZW(
    index,
    clamp(
      fish.curveBendWorld.x,
      -fishConfig.curveDeformationMax,
      fishConfig.curveDeformationMax,
    ),
    0,
    fishConfig.swimCurveStrength,
    fishConfig.curveDeformationMax,
  )
  attributes.motion?.setXYZW(
    index,
    fish.swimPhase,
    clamp(fish.swimDrive, 0, 1),
    length * 0.5,
    0,
  )
}

export function markFishCurveAttributesNeedsUpdate(
  attributes: FishCurveAttributes,
) {
  if (attributes.bend) attributes.bend.needsUpdate = true
  if (attributes.motion) attributes.motion.needsUpdate = true
}
