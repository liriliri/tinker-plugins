import type { ModelViewerElement } from '@google/model-viewer'
import clamp from 'licia/clamp'

const LOOK_SENSITIVITY = 0.0022
const MIN_PHI = 0.05
const MAX_PHI = Math.PI - 0.05
const LOOK_AHEAD_RATIO = 0.05
const MIN_LOOK_AHEAD = 0.15
const MOVE_SPEED_RATIO = 0.14
const MOVE_RESPONSIVENESS = 12
const STOP_EPSILON = 1e-5

export interface FirstPersonState {
  eyeX: number
  eyeY: number
  eyeZ: number
  velX: number
  velY: number
  velZ: number
  theta: number
  phi: number
  radius: number
  moveSpeed: number
}

function modelSpan(el: ModelViewerElement) {
  const dims = el.getDimensions()
  return Math.max(dims.x, dims.y, dims.z, 1)
}

function lookAheadRadius(span: number) {
  return Math.max(MIN_LOOK_AHEAD, span * LOOK_AHEAD_RATIO)
}

function orbitOffset(theta: number, phi: number, radius: number) {
  return {
    x: radius * Math.sin(phi) * Math.sin(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.cos(theta),
  }
}

function wrapTheta(theta: number) {
  const dual = Math.PI * 2
  return ((((theta + Math.PI) % dual) + dual) % dual) - Math.PI
}

function baseState(
  eyeX: number,
  eyeY: number,
  eyeZ: number,
  theta: number,
  phi: number,
  span: number,
): FirstPersonState {
  return {
    eyeX,
    eyeY,
    eyeZ,
    velX: 0,
    velY: 0,
    velZ: 0,
    theta: wrapTheta(theta),
    phi,
    radius: lookAheadRadius(span),
    moveSpeed: span * MOVE_SPEED_RATIO,
  }
}

export function prepareFirstPersonViewer(el: ModelViewerElement) {
  el.autoRotate = false
  el.removeAttribute('camera-controls')
  el.interpolationDecay = 0
  el.minCameraOrbit = 'auto auto 0.01m'
}

/** Enter FP from the current camera so the view does not jump. */
export function createFirstPersonState(
  el: ModelViewerElement,
): FirstPersonState {
  const orbit = el.getCameraOrbit()
  const target = el.getCameraTarget()
  const span = modelSpan(el)
  const offset = orbitOffset(orbit.theta, orbit.phi, orbit.radius)

  return baseState(
    target.x + offset.x,
    target.y + offset.y,
    target.z + offset.z,
    orbit.theta,
    clamp(orbit.phi, MIN_PHI, MAX_PHI),
    span,
  )
}

export function applyFirstPersonState(
  el: ModelViewerElement,
  state: FirstPersonState,
  snap = false,
) {
  const offset = orbitOffset(state.theta, state.phi, state.radius)

  el.cameraTarget = `${state.eyeX - offset.x}m ${state.eyeY - offset.y}m ${state.eyeZ - offset.z}m`
  el.cameraOrbit = `${state.theta}rad ${state.phi}rad ${state.radius}m`
  if (snap) {
    el.jumpCameraToGoal()
  }
}

export function lookFirstPerson(
  state: FirstPersonState,
  deltaX: number,
  deltaY: number,
) {
  // Same as most FPS games: angles += raw relative mouse delta * sensitivity.
  // Do not scale by dt — movementX/Y are already per-event distances.
  state.theta = wrapTheta(state.theta - deltaX * LOOK_SENSITIVITY)
  state.phi = clamp(state.phi - deltaY * LOOK_SENSITIVITY, MIN_PHI, MAX_PHI)
}

export function stepFirstPerson(
  state: FirstPersonState,
  keys: ReadonlySet<string>,
  dt: number,
) {
  let forward = 0
  let strafe = 0

  if (keys.has('KeyW') || keys.has('ArrowUp')) forward += 1
  if (keys.has('KeyS') || keys.has('ArrowDown')) forward -= 1
  if (keys.has('KeyD') || keys.has('ArrowRight')) strafe += 1
  if (keys.has('KeyA') || keys.has('ArrowLeft')) strafe -= 1

  const sinPhi = Math.sin(state.phi)
  const cosPhi = Math.cos(state.phi)
  const sinTheta = Math.sin(state.theta)
  const cosTheta = Math.cos(state.theta)
  const fx = -sinPhi * sinTheta
  const fy = -cosPhi
  const fz = -sinPhi * cosTheta
  const rx = cosTheta
  const rz = -sinTheta

  let wishX = fx * forward + rx * strafe
  let wishY = fy * forward
  let wishZ = fz * forward + rz * strafe
  const wishLen = Math.hypot(wishX, wishY, wishZ)
  if (wishLen > 0) {
    const scale = state.moveSpeed / wishLen
    wishX *= scale
    wishY *= scale
    wishZ *= scale
  }

  const blend = 1 - Math.exp(-MOVE_RESPONSIVENESS * dt)
  state.velX += (wishX - state.velX) * blend
  state.velY += (wishY - state.velY) * blend
  state.velZ += (wishZ - state.velZ) * blend

  if (
    Math.abs(state.velX) < STOP_EPSILON &&
    Math.abs(state.velY) < STOP_EPSILON &&
    Math.abs(state.velZ) < STOP_EPSILON &&
    wishLen === 0
  ) {
    state.velX = 0
    state.velY = 0
    state.velZ = 0
    return false
  }

  state.eyeX += state.velX * dt
  state.eyeY += state.velY * dt
  state.eyeZ += state.velZ * dt
  return true
}
