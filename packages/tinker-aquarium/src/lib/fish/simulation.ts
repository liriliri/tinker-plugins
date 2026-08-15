import * as THREE from 'three'
import { mulberry32 } from '../reef/util'
import { fishConfig, simulationSettings as defaults } from './config'
import { sampleFishLook } from './catalog'
import type {
  FishBounds,
  FishModelDef,
  FishState,
  SimulationSettings,
} from './types'
import type { ReefObstacle } from '../reef/types'

const TWO_PI = Math.PI * 2
const SPAWN_RETRIES = 24
const MIN_SPAWN_GAP = 2.6

function wrapAngle(angle: number) {
  let next = angle % TWO_PI
  if (next < 0) next += TWO_PI
  return next
}

function shortestDelta(from: number, to: number) {
  let delta = (to - from) % TWO_PI
  if (delta > Math.PI) delta -= TWO_PI
  if (delta < -Math.PI) delta += TWO_PI
  return delta
}

function headingX(angle: number, pitch: number) {
  return Math.cos(angle) * Math.cos(pitch)
}

function headingY(pitch: number) {
  return Math.sin(pitch)
}

function headingZ(angle: number, pitch: number) {
  return Math.sin(angle) * Math.cos(pitch)
}

function kickStrength(frequency: number) {
  return THREE.MathUtils.inverseLerp(
    fishConfig.kickFrequency.min,
    fishConfig.kickFrequency.max,
    frequency,
  )
}

function kickLength(duration: number) {
  return THREE.MathUtils.inverseLerp(
    fishConfig.kickDuration.min,
    fishConfig.kickDuration.max,
    duration,
  )
}

export class FishSchoolSimulation {
  bounds: FishBounds
  settings: SimulationSettings
  species: FishModelDef
  fish: FishState[] = []
  private random = mulberry32(42)
  private obstacles: ReefObstacle[] = []

  constructor(
    bounds: FishBounds,
    species: FishModelDef,
    settings: SimulationSettings = defaults,
  ) {
    this.bounds = bounds
    this.species = species
    this.settings = settings
  }

  reset(count: number, seed = 42) {
    this.fish.length = 0
    this.random = mulberry32(seed)
    for (let i = 0; i < count; i += 1) {
      this.fish.push(this.createFish(i))
    }
  }

  setObstacles(obstacles: ReefObstacle[]) {
    this.obstacles = obstacles
    for (const fish of this.fish) {
      this.nudgeOut(fish)
      if (this.blocked(fish.dest.x, fish.dest.y, fish.dest.z, fish.scale)) {
        this.retarget(fish)
      }
    }
  }

  setCount(count: number) {
    const target = Math.max(0, Math.floor(count))
    if (target < this.fish.length) {
      this.fish.length = target
      return
    }
    while (this.fish.length < target) {
      this.fish.push(this.createFish(this.fish.length))
    }
  }

  update(dt: number) {
    if (dt > 0.1) return
    const settings = this.settings

    for (const fish of this.fish) {
      fish.t += dt

      const dx = fish.dest.x - fish.position.x
      const dy = fish.dest.y - fish.position.y
      const dz = fish.dest.z - fish.position.z
      if (dx * dx + dy * dy + dz * dz < settings.arriveDistance ** 2) {
        this.retarget(fish)
      } else {
        this.aim(fish)
      }

      const turnStep = settings.turnSpeed * dt
      const headingDelta = THREE.MathUtils.clamp(
        shortestDelta(fish.angle, fish.targetAngle),
        -turnStep,
        turnStep,
      )
      fish.angle = wrapAngle(fish.angle + headingDelta)
      const pitchStep = settings.pitchSpeed * dt
      fish.pitch = THREE.MathUtils.clamp(
        fish.pitch +
          THREE.MathUtils.clamp(
            fish.targetPitch - fish.pitch,
            -pitchStep,
            pitchStep,
          ),
        -settings.maxPitch,
        settings.maxPitch,
      )

      const hx = headingX(fish.angle, fish.pitch)
      const hy = headingY(fish.pitch)
      const hz = headingZ(fish.angle, fish.pitch)

      fish.kickTime = Math.max(0, fish.kickTime - dt)
      if (fish.kickTime <= 0) {
        fish.speed *= Math.exp(-settings.damping * dt)
        if (fish.speed <= settings.minSpeed) {
          this.kick(fish)
        }
      }

      fish.velocity.x = hx * fish.speed
      fish.velocity.y = hy * fish.speed
      fish.velocity.z = hz * fish.speed
      fish.position.x += fish.velocity.x * dt
      fish.position.y += fish.velocity.y * dt
      fish.position.z += fish.velocity.z * dt

      this.keepInside(fish)
      if (this.nudgeOut(fish)) this.steerAway(fish)
      if (this.separateFromOthers(fish)) this.keepInside(fish)

      const turnEase = 1 - Math.exp(-5 * dt)
      fish.turnRate +=
        (headingDelta / Math.max(dt, 1e-4) - fish.turnRate) * turnEase
      const targetBend = THREE.MathUtils.clamp(
        fish.turnRate * 0.22,
        -fishConfig.curveDeformationMax,
        fishConfig.curveDeformationMax,
      )
      fish.curveBendWorld.x += (targetBend - fish.curveBendWorld.x) * turnEase
      fish.curveBendWorld.y = 0
      fish.curveBendWorld.z = 0
      const drive =
        fish.kickTime > 0
          ? THREE.MathUtils.lerp(0.42, 1, kickStrength(fish.kickFrequency))
          : THREE.MathUtils.lerp(0.18, 0.34, fish.speed / settings.maxSpeed)
      fish.swimDrive += (drive - fish.swimDrive) * (1 - Math.exp(-6 * dt))
      const frequency =
        fish.kickTime > 0 ? fish.kickFrequency : fishConfig.coastFrequency
      fish.swimPhase = (fish.swimPhase + frequency * TWO_PI * dt) % TWO_PI
    }
  }

  private retarget(fish: FishState) {
    const dest = this.randomPoint(fish)
    fish.dest = dest
    const dx = dest.x - fish.position.x
    const dy = dest.y - fish.position.y
    const dz = dest.z - fish.position.z
    fish.targetAngle = wrapAngle(Math.atan2(dz, dx))
    const horizontal = Math.hypot(dx, dz)
    fish.targetPitch = THREE.MathUtils.clamp(
      Math.atan2(dy, Math.max(horizontal, 0.001)),
      -this.settings.maxPitch,
      this.settings.maxPitch,
    )
    this.kick(fish)
  }

  private aim(fish: FishState) {
    if (this.blocked(fish.dest.x, fish.dest.y, fish.dest.z, fish.scale)) {
      fish.dest = this.randomPoint(fish)
    }
    const look = 2.4 + fish.speed * 2.6
    const hx = headingX(fish.angle, fish.pitch)
    const hy = headingY(fish.pitch)
    const hz = headingZ(fish.angle, fish.pitch)
    if (this.steerFromWalls(fish, hx, hy, hz, look)) return
    const hit = this.obstacleAhead(fish, hx, hy, hz, look)
    if (hit) {
      this.glideAround(fish, hit.x, hit.z)
      if (fish.position.y > hit.topY - 0.45) {
        fish.targetPitch = this.settings.maxPitch
      }
      return
    }
    const other = this.nearestAhead(fish, hx, hy, hz, look)
    if (other) {
      this.glideAround(fish, other.position.x, other.position.z)
      return
    }
    if (fish.t < fish.avoidUntil) return
    const dx = fish.dest.x - fish.position.x
    const dy = fish.dest.y - fish.position.y
    const dz = fish.dest.z - fish.position.z
    fish.targetAngle = wrapAngle(Math.atan2(dz, dx))
    const horizontal = Math.hypot(dx, dz)
    fish.targetPitch = THREE.MathUtils.clamp(
      Math.atan2(dy, Math.max(horizontal, 0.001)),
      -this.settings.maxPitch,
      this.settings.maxPitch,
    )
  }

  private kick(fish: FishState) {
    const dart = this.random() < fishConfig.dartChance
    const duration = dart
      ? THREE.MathUtils.lerp(0.28, 0.5, this.random())
      : THREE.MathUtils.lerp(
          fishConfig.kickDuration.min,
          fishConfig.kickDuration.max,
          this.random(),
        )
    const frequency = dart
      ? THREE.MathUtils.lerp(2.55, fishConfig.kickFrequency.max, this.random())
      : THREE.MathUtils.lerp(
          fishConfig.kickFrequency.min,
          1.85,
          this.random() ** 1.8,
        )
    fish.kickTime = duration
    fish.kickFrequency = frequency
    if (dart) {
      fish.speed = THREE.MathUtils.lerp(
        this.settings.maxSpeed * 1.55,
        this.settings.maxSpeed * 2.4,
        kickStrength(frequency) * 0.7 + kickLength(duration) * 0.3,
      )
      return
    }
    const burst = kickStrength(frequency) * 0.75 + kickLength(duration) * 0.25
    fish.speed = THREE.MathUtils.lerp(
      this.settings.minSpeed,
      this.settings.maxSpeed * 0.78,
      THREE.MathUtils.clamp(burst, 0, 1),
    )
  }

  private keepInside(fish: FishState) {
    const { min, max } = this.bounds
    let hitX = 0
    let hitZ = 0
    if (fish.position.x > max.x) {
      fish.position.x = max.x
      hitX = 1
    } else if (fish.position.x < min.x) {
      fish.position.x = min.x
      hitX = -1
    }
    if (fish.position.z > max.z) {
      fish.position.z = max.z
      hitZ = 1
    } else if (fish.position.z < min.z) {
      fish.position.z = min.z
      hitZ = -1
    }
    if (fish.position.y > this.depthMax()) {
      fish.position.y = this.depthMax()
    } else if (fish.position.y < this.depthMin()) {
      fish.position.y = this.depthMin()
    }
    if (!hitX && !hitZ) return
    if (fish.t < fish.avoidUntil) return
    if (hitX && hitZ) {
      fish.targetAngle = wrapAngle(fish.angle + Math.PI)
    } else if (hitX) {
      fish.targetAngle = wrapAngle(Math.PI - fish.angle)
    } else {
      fish.targetAngle = wrapAngle(-fish.angle)
    }
    fish.avoidUntil = fish.t + 0.7
    fish.dest = this.randomPoint(fish)
  }

  private createFish(index: number): FishState {
    const depthBand = this.pickDepthBand()
    const look = sampleFishLook(this.species.look, this.random)
    const position = this.spawnPosition(depthBand, look.scale)
    const angle = this.random() * TWO_PI
    const speed = THREE.MathUtils.lerp(
      this.settings.minSpeed,
      this.settings.maxSpeed,
      this.random(),
    )
    const fish: FishState = {
      position,
      velocity: {
        x: headingX(angle, 0) * speed,
        y: 0,
        z: headingZ(angle, 0) * speed,
      },
      angle,
      pitch: 0,
      targetAngle: angle,
      targetPitch: 0,
      dest: { ...position },
      speed,
      kickTime: 0,
      kickFrequency: fishConfig.coastFrequency,
      t: this.random() * 20,
      scale: look.scale,
      swimPhase: index * 1.7,
      swimDrive: 0.28,
      curveBendWorld: { x: 0, y: 0, z: 0 },
      avoidUntil: 0,
      turnRate: 0,
      tint: look.tint,
      depthBand,
    }
    this.retarget(fish)
    fish.kickTime = this.random() * 1.8
    fish.speed = THREE.MathUtils.lerp(
      this.settings.minSpeed,
      this.settings.maxSpeed * 0.55,
      this.random(),
    )
    return fish
  }

  private pickDepthBand(): FishState['depthBand'] {
    if (this.species.depthRange) return 'high'
    const pick = this.random()
    if (pick < 0.42) return 'low'
    if (pick < 0.74) return 'mid'
    return 'high'
  }

  private depthMin() {
    const { min, max } = this.bounds
    const range = this.species.depthRange
    if (!range) return min.y
    return min.y + (max.y - min.y) * range.min
  }

  private depthMax() {
    const { min, max } = this.bounds
    const range = this.species.depthRange
    if (!range) return max.y
    return min.y + (max.y - min.y) * range.max
  }

  private depthY(band: FishState['depthBand']) {
    if (this.species.depthRange) {
      return THREE.MathUtils.lerp(
        this.depthMin(),
        this.depthMax(),
        1 - this.random() ** 1.7,
      )
    }
    const { min, max } = this.bounds
    const span = max.y - min.y
    if (band === 'low') {
      return THREE.MathUtils.lerp(
        min.y + 0.08,
        min.y + span * 0.48,
        this.random(),
      )
    }
    if (band === 'high') {
      return THREE.MathUtils.lerp(
        max.y - span * 0.36,
        max.y - 0.1,
        this.random(),
      )
    }
    return THREE.MathUtils.lerp(
      min.y + span * 0.34,
      max.y - span * 0.34,
      this.random(),
    )
  }

  private randomPoint(fish: FishState) {
    const { min, max } = this.bounds
    const inset = 1.4
    const point = { x: 0, y: 0, z: 0 }
    for (let attempt = 0; attempt < SPAWN_RETRIES; attempt += 1) {
      point.x = THREE.MathUtils.lerp(
        min.x + inset,
        max.x - inset,
        this.random(),
      )
      point.y = this.depthY(fish.depthBand)
      point.z = THREE.MathUtils.lerp(
        min.z + inset,
        max.z - inset,
        this.random(),
      )
      if (!this.blocked(point.x, point.y, point.z, fish.scale))
        return { ...point }
    }
    return point
  }

  private spawnPosition(
    band: FishState['depthBand'],
    scale: FishState['scale'],
  ) {
    const inset = 0.9
    const { min, max } = this.bounds
    const position = { x: 0, y: 0, z: 0 }
    for (let attempt = 0; attempt < SPAWN_RETRIES; attempt += 1) {
      position.x = THREE.MathUtils.lerp(
        min.x + inset,
        max.x - inset,
        this.random(),
      )
      position.y = this.depthY(band)
      position.z = THREE.MathUtils.lerp(
        min.z + inset,
        max.z - inset,
        this.random(),
      )
      if (
        this.isClear(position, MIN_SPAWN_GAP) &&
        !this.blocked(position.x, position.y, position.z, scale)
      ) {
        return { ...position }
      }
    }
    return position
  }

  private isClear(position: { x: number; y: number; z: number }, gap: number) {
    const gapSq = gap * gap
    for (const other of this.fish) {
      const dx = other.position.x - position.x
      const dy = other.position.y - position.y
      const dz = other.position.z - position.z
      if (dx * dx + dy * dy + dz * dz < gapSq) return false
    }
    return true
  }

  private fishRadius(scale: FishState['scale']) {
    return this.species.length * 0.2 * Math.max(scale.x, scale.y) + 0.08
  }

  private blocked(x: number, y: number, z: number, scale: FishState['scale']) {
    const pad = this.fishRadius(scale)
    for (const obstacle of this.obstacles) {
      if (y > obstacle.topY + pad) continue
      const dx = x - obstacle.x
      const dz = z - obstacle.z
      const reach = obstacle.radius + pad
      if (dx * dx + dz * dz < reach * reach) return true
    }
    return false
  }

  private hitObstacle(
    x: number,
    y: number,
    z: number,
    scale: FishState['scale'],
    extra = 0,
  ) {
    const pad = this.fishRadius(scale) + extra
    for (const obstacle of this.obstacles) {
      if (y > obstacle.topY + pad) continue
      const dx = x - obstacle.x
      const dz = z - obstacle.z
      const reach = obstacle.radius + pad
      if (dx * dx + dz * dz < reach * reach) return obstacle
    }
    return null
  }

  private nudgeOut(fish: FishState) {
    let pushed = false
    const pad = this.fishRadius(fish.scale)
    for (const obstacle of this.obstacles) {
      if (fish.position.y > obstacle.topY + pad) continue
      const dx = fish.position.x - obstacle.x
      const dz = fish.position.z - obstacle.z
      const reach = obstacle.radius + pad
      const distSq = dx * dx + dz * dz
      if (distSq >= reach * reach) continue
      const dist = Math.sqrt(Math.max(distSq, 1e-6))
      const push = (reach - dist) * 0.35
      fish.position.x += (dx / dist) * push
      fish.position.z += (dz / dist) * push
      pushed = true
    }
    return pushed
  }

  private steerAway(fish: FishState) {
    const hit = this.hitObstacle(
      fish.position.x,
      fish.position.y,
      fish.position.z,
      fish.scale,
    )
    if (!hit) return
    this.glideAround(fish, hit.x, hit.z)
    if (fish.position.y > hit.topY - 0.45) {
      fish.targetPitch = this.settings.maxPitch
    }
  }

  private glideAround(fish: FishState, cx: number, cz: number) {
    if (fish.t < fish.avoidUntil) {
      fish.avoidUntil = fish.t + 0.28
      return
    }
    const rx = fish.position.x - cx
    const rz = fish.position.z - cz
    const hx = headingX(fish.angle, 0)
    const hz = headingZ(fish.angle, 0)
    const left = hx * rz - hz * rx >= 0
    fish.targetAngle = wrapAngle(
      left ? Math.atan2(rx, -rz) : Math.atan2(-rx, rz),
    )
    fish.avoidUntil = fish.t + 0.85
    fish.speed = Math.min(fish.speed, this.settings.maxSpeed * 0.55)
  }

  private steerFromWalls(
    fish: FishState,
    hx: number,
    hy: number,
    hz: number,
    look: number,
  ) {
    const { min, max } = this.bounds
    const pad = this.fishRadius(fish.scale) + 0.55
    const x = fish.position.x + hx * look
    const y = fish.position.y + hy * look
    const z = fish.position.z + hz * look
    let hitX = 0
    let hitZ = 0
    if (x > max.x - pad) hitX = 1
    else if (x < min.x + pad) hitX = -1
    if (z > max.z - pad) hitZ = 1
    else if (z < min.z + pad) hitZ = -1
    if (y > max.y - 0.35) fish.targetPitch = -this.settings.maxPitch
    else if (y < min.y + 0.35) fish.targetPitch = this.settings.maxPitch
    if (!hitX && !hitZ) return false
    if (fish.t < fish.avoidUntil) return true
    if (hitX && hitZ) {
      fish.targetAngle = wrapAngle(fish.angle + Math.PI)
    } else if (hitX) {
      fish.targetAngle = wrapAngle(Math.PI - fish.angle)
    } else {
      fish.targetAngle = wrapAngle(-fish.angle)
    }
    fish.avoidUntil = fish.t + 0.55
    return true
  }

  private obstacleAhead(
    fish: FishState,
    hx: number,
    hy: number,
    hz: number,
    look: number,
  ) {
    const extra = 0.95
    for (let step = 1; step <= 4; step += 1) {
      const t = (step / 4) * look
      const hit = this.hitObstacle(
        fish.position.x + hx * t,
        fish.position.y + hy * t,
        fish.position.z + hz * t,
        fish.scale,
        extra,
      )
      if (hit) return hit
    }
    return null
  }

  private nearestAhead(
    fish: FishState,
    hx: number,
    hy: number,
    hz: number,
    look: number,
  ) {
    const reach = this.fishRadius(fish.scale) + 0.85
    let nearest: FishState | null = null
    let nearestSq = Infinity
    for (let step = 1; step <= 4; step += 1) {
      const t = (step / 4) * look
      const lx = fish.position.x + hx * t
      const ly = fish.position.y + hy * t
      const lz = fish.position.z + hz * t
      for (const other of this.fish) {
        if (other === fish) continue
        const dx = lx - other.position.x
        const dy = ly - other.position.y
        const dz = lz - other.position.z
        const minDist = reach + this.fishRadius(other.scale)
        const distSq = dx * dx + dy * dy + dz * dz
        if (distSq >= minDist * minDist || distSq >= nearestSq) continue
        nearest = other
        nearestSq = distSq
      }
    }
    return nearest
  }

  private separateFromOthers(fish: FishState) {
    let pushed = false
    const r0 = this.fishRadius(fish.scale)
    for (const other of this.fish) {
      if (other === fish) continue
      const dx = fish.position.x - other.position.x
      const dy = fish.position.y - other.position.y
      const dz = fish.position.z - other.position.z
      const minDist = r0 + this.fishRadius(other.scale) + 0.28
      const distSq = dx * dx + dy * dy + dz * dz
      if (distSq >= minDist * minDist) continue
      const dist = Math.sqrt(Math.max(distSq, 1e-6))
      const push = (minDist - dist) * 0.6
      fish.position.x += (dx / dist) * push
      fish.position.y += (dy / dist) * push * 0.45
      fish.position.z += (dz / dist) * push
      this.glideAround(fish, other.position.x, other.position.z)
      pushed = true
    }
    return pushed
  }
}
