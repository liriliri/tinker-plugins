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
const SPAWN_RETRIES = 40
const MIN_SPAWN_GAP = 1.05
const BOID_PERCEPTION = 2.6
const BOID_AVOID = 1.15
const BOID_ALIGN = 1.05
const BOID_COHESION = 0.55
const BOID_SEPARATE = 1.85
const BOID_WANDER = 0.5
const BOID_OTHER = 1.15

function wrapAngle(angle: number) {
  let next = angle % TWO_PI
  if (next < 0) next += TWO_PI
  return next
}

function mixAngle(from: number, to: number, t: number) {
  return wrapAngle(from + shortestDelta(from, to) * t)
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
  private neighbors: FishState[][] = []
  private schoolAnchor = { x: 0, y: 0, z: 0 }
  private schoolHeading = 0
  private schoolPitch = 0
  private schoolTurn = 0
  private schoolPace = 0.28
  private schoolPaceTarget = 0.28
  private schoolPaceTimer = 0
  private spawnColShift = 0
  private boidAngle: number[] = []
  private boidPitch: number[] = []
  private boidSide: number[] = []

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
    this.schoolHeading = this.random() * TWO_PI
    this.schoolPitch = 0
    this.schoolTurn = 0
    this.schoolPace = 0.28
    this.schoolPaceTarget = 0.28
    this.schoolPaceTimer = 0.6
    this.spawnColShift = Math.floor(this.random() * 7)
    for (let i = 0; i < count; i += 1) {
      this.fish.push(this.createFish(i, count))
    }
  }

  setNeighbors(groups: FishState[][]) {
    this.neighbors = groups
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
      this.fish.push(this.createFish(this.fish.length, target))
    }
  }

  scare(x: number, y: number, z: number) {
    const horizRadius = 5
    const vertRadius = 12.5
    const { min, max } = this.bounds
    for (const fish of this.fish) {
      let dx = fish.position.x - x
      const dy = fish.position.y - y
      let dz = fish.position.z - z
      const nx = dx / horizRadius
      const ny = dy / vertRadius
      const nz = dz / horizRadius
      const dist = Math.sqrt(nx * nx + ny * ny + nz * nz)
      if (dist >= 1) continue
      const strength = (1 - dist) ** 2
      if (strength < 0.06) continue
      const burst = this.species.schooling ? 2.85 : 5.4
      const scareSpeed =
        this.settings.maxSpeed * THREE.MathUtils.lerp(1.55, burst, strength)
      if (fish.t < fish.avoidUntil) {
        fish.speed = Math.max(fish.speed, scareSpeed)
        fish.kickTime = Math.max(fish.kickTime, 0.4 + strength * 0.75)
        continue
      }
      const horiz = Math.hypot(dx, dz)
      if (horiz < 0.14) {
        dx = -headingX(fish.angle, 0)
        dz = -headingZ(fish.angle, 0)
      } else {
        dx /= horiz
        dz /= horiz
      }
      const hx = headingX(fish.angle, 0)
      const hz = headingZ(fish.angle, 0)
      const facingSplash = dx * hx + dz * hz < 0.2
      const snapTurn = facingSplash ? this.random() < 0.82 : this.random() < 0.4
      if (!snapTurn) {
        dx = hx
        dz = hz
      } else {
        const yaw = (this.random() - 0.5) * 0.7
        const flee = wrapAngle(Math.atan2(dz, dx) + yaw)
        dx = Math.cos(flee)
        dz = Math.sin(flee)
      }
      const run = 1.1 + strength * 5.4
      fish.dest = {
        x: THREE.MathUtils.clamp(
          fish.position.x + dx * run,
          min.x + 0.6,
          max.x - 0.6,
        ),
        y: THREE.MathUtils.clamp(
          fish.position.y - (snapTurn ? 1.1 * strength : 0),
          this.depthMin(),
          this.depthMax(),
        ),
        z: THREE.MathUtils.clamp(
          fish.position.z + dz * run,
          min.z + 0.6,
          max.z - 0.6,
        ),
      }
      fish.avoidUntil = fish.t + 0.55 + strength * 1.05
      fish.kickTime = Math.max(fish.kickTime, 0.4 + strength * 0.75)
      fish.kickFrequency = THREE.MathUtils.lerp(
        fishConfig.kickFrequency.min,
        fishConfig.kickFrequency.max,
        0.55 + strength * 0.45,
      )
      fish.speed = Math.max(fish.speed, scareSpeed)
      if (snapTurn) {
        fish.targetAngle = wrapAngle(Math.atan2(dz, dx))
        fish.targetPitch = -this.settings.maxPitch * 0.85 * strength
        fish.angle = fish.targetAngle
      }
    }
  }

  update(dt: number) {
    if (dt > 0.1) return
    if (this.species.schooling) {
      this.updateBoids(dt)
      return
    }
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
      if (this.species.schooling) {
        fish.speed = THREE.MathUtils.lerp(
          fish.speed,
          settings.maxSpeed,
          1 - Math.exp(-4 * dt),
        )
      } else if (fish.kickTime <= 0) {
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
      if (this.separateFromOthers(fish)) {
        this.keepInside(fish)
        this.snapTowardTarget(fish, 0.45)
      }
      fish.velocity.x = headingX(fish.angle, fish.pitch) * fish.speed
      fish.velocity.y = headingY(fish.pitch) * fish.speed
      fish.velocity.z = headingZ(fish.angle, fish.pitch) * fish.speed

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
      const tempo = THREE.MathUtils.clamp(
        fish.speed / Math.max(settings.maxSpeed, 1e-4),
        0.2,
        3.3,
      )
      const drive =
        tempo > 1.2
          ? 1
          : fish.kickTime > 0
            ? THREE.MathUtils.lerp(0.42, 1, kickStrength(fish.kickFrequency))
            : THREE.MathUtils.lerp(0.18, 0.34, Math.min(tempo, 1))
      fish.swimDrive += (drive - fish.swimDrive) * (1 - Math.exp(-6 * dt))
      const frequency =
        (fish.kickTime > 0 ? fish.kickFrequency : fishConfig.coastFrequency) *
        Math.max(1, tempo)
      fish.swimPhase = (fish.swimPhase + frequency * TWO_PI * dt) % TWO_PI
    }
  }

  private updateBoids(dt: number) {
    const settings = this.settings
    const count = this.fish.length
    while (this.boidAngle.length < count) {
      this.boidAngle.push(0)
      this.boidPitch.push(0)
      this.boidSide.push(0)
    }

    this.schoolTurn -= dt
    if (this.schoolTurn <= 0) {
      this.schoolHeading = wrapAngle(
        this.schoolHeading + (this.random() - 0.5) * 0.48,
      )
      this.schoolPitch = THREE.MathUtils.clamp(
        this.schoolPitch + (this.random() - 0.5) * 0.22,
        -settings.maxPitch,
        settings.maxPitch,
      )
      this.schoolTurn = 2.8 + this.random() * 2.6
    }

    this.schoolPaceTimer -= dt
    if (this.schoolPaceTimer <= 0) {
      const burst = this.random() < 0.3
      this.schoolPaceTarget = burst
        ? THREE.MathUtils.lerp(0.7, 1, this.random())
        : THREE.MathUtils.lerp(0.06, 0.4, this.random())
      this.schoolPaceTimer = burst
        ? THREE.MathUtils.lerp(0.4, 1.05, this.random())
        : THREE.MathUtils.lerp(1.6, 4.4, this.random())
    }
    this.schoolPace +=
      (this.schoolPaceTarget - this.schoolPace) * (1 - Math.exp(-2.4 * dt))

    const perceptionSq = BOID_PERCEPTION * BOID_PERCEPTION
    const avoidSq = BOID_AVOID * BOID_AVOID
    const wx = headingX(this.schoolHeading, this.schoolPitch)
    const wy = headingY(this.schoolPitch)
    const wz = headingZ(this.schoolHeading, this.schoolPitch)

    for (let i = 0; i < count; i += 1) {
      const fish = this.fish[i]
      let n = 0
      let cx = 0
      let cy = 0
      let cz = 0
      let hx = 0
      let hy = 0
      let hz = 0
      let sx = 0
      let sy = 0
      let sz = 0
      let sep = 0

      for (let j = 0; j < count; j += 1) {
        if (i === j) continue
        const other = this.fish[j]
        const dx = other.position.x - fish.position.x
        const dy = other.position.y - fish.position.y
        const dz = other.position.z - fish.position.z
        const distSq = dx * dx + dy * dy + dz * dz
        if (distSq > perceptionSq) continue
        n += 1
        cx += other.position.x
        cy += other.position.y
        cz += other.position.z
        hx += headingX(other.angle, other.pitch)
        hy += headingY(other.pitch)
        hz += headingZ(other.angle, other.pitch)
        if (distSq < avoidSq) {
          const dist = Math.sqrt(Math.max(distSq, 1e-6))
          const weight = 1 / dist
          sx -= dx * weight
          sy -= dy * weight
          sz -= dz * weight
          sep += 1
        }
      }

      const fhx = headingX(fish.angle, fish.pitch)
      const fhz = headingZ(fish.angle, fish.pitch)
      let passing = false
      this.forOthers(fish, (other) => {
        if (this.fish.includes(other)) return
        const dx = other.position.x - fish.position.x
        const dy = other.position.y - fish.position.y
        const dz = other.position.z - fish.position.z
        const distSq = dx * dx + dy * dy + dz * dz
        const reach = this.avoidRadius(fish, other)
        if (distSq >= reach * reach) return
        const dist = Math.sqrt(Math.max(distSq, 1e-6))
        const weight = (1 - dist / reach) * BOID_OTHER
        sx -= (dx / dist) * weight
        sy -= (dy / dist) * weight * 0.35
        sz -= (dz / dist) * weight
        const aside = this.asideFrom(
          fish,
          other.position.x,
          other.position.z,
          i,
        )
        sx += aside.x * weight * 1.25
        sz += aside.z * weight * 1.25
        sep += 1
        passing = true
      })

      let vx = headingX(fish.angle, fish.pitch) + wx * BOID_WANDER
      let vy = headingY(fish.pitch) + wy * BOID_WANDER
      let vz = headingZ(fish.angle, fish.pitch) + wz * BOID_WANDER

      if (n > 0) {
        vx += (hx / n) * BOID_ALIGN
        vy += (hy / n) * BOID_ALIGN
        vz += (hz / n) * BOID_ALIGN
        cx /= n
        cy /= n
        cz /= n
        const cdx = cx - fish.position.x
        const cdy = cy - fish.position.y
        const cdz = cz - fish.position.z
        const clen = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz) || 1
        vx += (cdx / clen) * BOID_COHESION
        vy += (cdy / clen) * BOID_COHESION * 0.42
        vz += (cdz / clen) * BOID_COHESION
      }
      if (sep > 0) {
        const slen = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1
        vx += (sx / slen) * BOID_SEPARATE
        vy += (sy / slen) * BOID_SEPARATE
        vz += (sz / slen) * BOID_SEPARATE
      }

      const { min, max } = this.bounds
      const margin = 2.1
      if (fish.position.x > max.x - margin) {
        vx -= ((fish.position.x - (max.x - margin)) / margin) * 2.4
      } else if (fish.position.x < min.x + margin) {
        vx += ((min.x + margin - fish.position.x) / margin) * 2.4
      }
      if (fish.position.z > max.z - margin) {
        vz -= ((fish.position.z - (max.z - margin)) / margin) * 2.4
      } else if (fish.position.z < min.z + margin) {
        vz += ((min.z + margin - fish.position.z) / margin) * 2.4
      }
      const top = this.depthMax()
      const bottom = this.depthMin()
      if (fish.position.y > top - 0.35) {
        vy -= ((fish.position.y - (top - 0.35)) / 0.35) * 1.4
      } else if (fish.position.y < bottom + 0.28) {
        vy += ((bottom + 0.28 - fish.position.y) / 0.28) * 1.4
      }

      const weave = this.species.weave === true
      for (const obstacle of this.obstacles) {
        if (fish.position.y > obstacle.topY + 0.35) continue
        const odx = fish.position.x - obstacle.x
        const odz = fish.position.z - obstacle.z
        const odist = Math.hypot(odx, odz) || 1e-4
        const danger =
          obstacle.radius + (weave ? this.fishRadius(fish.scale) + 0.12 : 1.45)
        if (odist >= danger) continue
        const weight = (1 - odist / danger) * (weave ? 1.6 : 3.1)
        vx += (odx / odist) * weight
        vz += (odz / odist) * weight
        if (!weave && fish.position.y > obstacle.topY - 0.55) {
          vy += weight * 0.45
        }
      }

      const look = 1.15 + fish.speed * 0.28
      const fhy = headingY(fish.pitch)
      const hit = this.obstacleAhead(fish, fhx, fhy, fhz, look)
      if (hit) {
        const aside = this.asideFrom(fish, hit.x, hit.z, i)
        vx += aside.x * 1.8
        vz += aside.z * 1.8
        if (!weave && fish.position.y > hit.topY - 0.45) vy += 0.55
        passing = true
      }
      const other = this.fishAhead(fish, fhx, fhy, fhz, look)
      if (other) {
        const aside = this.asideFrom(
          fish,
          other.position.x,
          other.position.z,
          i,
        )
        vx += aside.x * 1.6
        vz += aside.z * 1.6
        passing = true
      }
      if (!passing) this.boidSide[i] = 0

      if (fish.t < fish.avoidUntil) {
        const fx = fish.dest.x - fish.position.x
        const fz = fish.dest.z - fish.position.z
        const flen = Math.hypot(fx, fz) || 1
        vx += (fx / flen) * 2.6
        vz += (fz / flen) * 2.6
        vy += (fish.dest.y - fish.position.y) * 0.55
      }

      const desiredAngle = wrapAngle(Math.atan2(vz, vx))
      const horizontal = Math.hypot(vx, vz)
      const desiredPitch = THREE.MathUtils.clamp(
        Math.atan2(vy, Math.max(horizontal, 0.001)),
        -settings.maxPitch,
        settings.maxPitch,
      )
      const ease = 1 - Math.exp(-1.8 * dt)
      this.boidAngle[i] = mixAngle(fish.targetAngle, desiredAngle, ease)
      this.boidPitch[i] = THREE.MathUtils.lerp(
        fish.targetPitch,
        desiredPitch,
        ease,
      )
    }

    for (let i = 0; i < count; i += 1) {
      const fish = this.fish[i]
      fish.t += dt
      fish.targetAngle = this.boidAngle[i]
      fish.targetPitch = this.boidPitch[i]

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

      if (fish.t >= fish.avoidUntil) {
        fish.speed = THREE.MathUtils.lerp(
          fish.speed,
          THREE.MathUtils.lerp(
            settings.minSpeed,
            settings.maxSpeed,
            this.schoolPace,
          ),
          1 - Math.exp(-3.2 * dt),
        )
      }
      const hx = headingX(fish.angle, fish.pitch)
      const hy = headingY(fish.pitch)
      const hz = headingZ(fish.angle, fish.pitch)
      fish.velocity.x = hx * fish.speed
      fish.velocity.y = hy * fish.speed
      fish.velocity.z = hz * fish.speed
      fish.position.x += fish.velocity.x * dt
      fish.position.y += fish.velocity.y * dt
      fish.position.z += fish.velocity.z * dt

      this.keepInside(fish)
      if (this.nudgeOut(fish)) this.steerAway(fish)
      this.separateFromOthers(fish)
      this.keepInside(fish)
      fish.velocity.x = headingX(fish.angle, fish.pitch) * fish.speed
      fish.velocity.y = headingY(fish.pitch) * fish.speed
      fish.velocity.z = headingZ(fish.angle, fish.pitch) * fish.speed

      const turnEase = 1 - Math.exp(-5 * dt)
      fish.turnRate +=
        (headingDelta / Math.max(dt, 1e-4) - fish.turnRate) * turnEase
      const tempo = THREE.MathUtils.clamp(
        fish.speed / Math.max(settings.maxSpeed, 1e-4),
        0.2,
        3.2,
      )
      fish.swimDrive +=
        (THREE.MathUtils.lerp(0.4, 1, Math.min(tempo, 1)) - fish.swimDrive) *
        (1 - Math.exp(-6 * dt))
      fish.swimPhase =
        (fish.swimPhase +
          THREE.MathUtils.lerp(1.1, 5.1, Math.min((tempo - 0.3) / 2.7, 1)) *
            TWO_PI *
            dt) %
        TWO_PI
    }
  }

  private retarget(fish: FishState) {
    if (this.species.schooling) {
      this.retargetSchool(fish)
      return
    }
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

  private retargetSchool(fish: FishState) {
    const lead = this.fish[0]
    if (!lead || fish === lead) {
      this.schoolAnchor = this.randomPoint(fish)
      for (const member of this.fish) {
        this.applySchoolDest(member)
        this.kick(member)
      }
      if (this.fish.indexOf(fish) < 0) {
        this.applySchoolDest(fish)
        this.kick(fish)
      }
      return
    }
    this.applySchoolDest(fish)
    this.kick(fish)
  }

  private applySchoolDest(fish: FishState) {
    const spread = 0.34
    fish.dest = {
      x: this.schoolAnchor.x + (this.random() - 0.5) * spread,
      y: this.schoolAnchor.y + (this.random() - 0.5) * spread * 0.35,
      z: this.schoolAnchor.z + (this.random() - 0.5) * spread,
    }
    const dx = this.schoolAnchor.x - fish.position.x
    const dy = this.schoolAnchor.y - fish.position.y
    const dz = this.schoolAnchor.z - fish.position.z
    fish.targetAngle = wrapAngle(Math.atan2(dz, dx))
    const horizontal = Math.hypot(dx, dz)
    fish.targetPitch = THREE.MathUtils.clamp(
      Math.atan2(dy, Math.max(horizontal, 0.001)),
      -this.settings.maxPitch,
      this.settings.maxPitch,
    )
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
    const dart = this.isNimble() && this.random() < fishConfig.dartChance
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
    fish.targetAngle = this.alongWall(fish.angle, hitX, hitZ)
    fish.avoidUntil = fish.t + 1.1
    fish.dest = this.randomPoint(fish, true)
    if (this.isNimble()) this.snapTowardTarget(fish, 0.55)
    else fish.angle = mixAngle(fish.angle, fish.targetAngle, 0.22)
  }

  private createFish(index: number, total = index + 1): FishState {
    const depthBand = this.pickDepthBand()
    const look = sampleFishLook(this.species.look, this.random)
    const position = this.spawnPosition(depthBand, look.scale, index, total)
    const angle =
      this.species.schooling && this.fish[0]
        ? this.fish[0].angle + (this.random() - 0.5) * 0.35
        : this.random() * TWO_PI
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
    if (this.species.schooling) {
      fish.speed = THREE.MathUtils.lerp(
        this.settings.minSpeed,
        this.settings.maxSpeed * 0.4,
        this.random(),
      )
      fish.kickTime = 0
    } else {
      fish.kickTime = this.random() * 1.8
      fish.speed = THREE.MathUtils.lerp(
        this.settings.minSpeed,
        this.settings.maxSpeed * 0.55,
        this.random(),
      )
    }
    return fish
  }

  private pickDepthBand(): FishState['depthBand'] {
    const pick = this.random()
    if (this.species.depthRange) {
      if (this.species.depthRange.min >= 0.45) return 'high'
      if (pick < 0.34) return 'low'
      if (pick < 0.67) return 'mid'
      return 'high'
    }
    if (pick < 0.34) return 'low'
    if (pick < 0.67) return 'mid'
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
    const range = this.species.depthRange
    if (range) {
      let t = this.random()
      if (range.min >= 0.45) t = 1 - this.random() ** 1.6
      return THREE.MathUtils.lerp(this.depthMin(), this.depthMax(), t)
    }
    const { min, max } = this.bounds
    const span = max.y - min.y
    if (band === 'low') {
      return THREE.MathUtils.lerp(
        min.y + 0.06,
        min.y + span * 0.38,
        this.random(),
      )
    }
    if (band === 'high') {
      return THREE.MathUtils.lerp(
        max.y - span * 0.4,
        max.y - 0.08,
        this.random(),
      )
    }
    return THREE.MathUtils.lerp(
      min.y + span * 0.28,
      max.y - span * 0.28,
      this.random(),
    )
  }

  private randomPoint(fish: FishState, inward = false) {
    const { min, max } = this.bounds
    const inset = 1.4
    const point = { x: 0, y: 0, z: 0 }
    const cx = (min.x + max.x) * 0.5 - fish.position.x
    const cz = (min.z + max.z) * 0.5 - fish.position.z
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
      if (this.blocked(point.x, point.y, point.z, fish.scale)) continue
      if (attempt < SPAWN_RETRIES - 8) {
        const dx = point.x - fish.position.x
        const dz = point.z - fish.position.z
        if (inward) {
          if (dx * cx + dz * cz < 0) continue
        } else if (!this.isNimble()) {
          const hx = headingX(fish.angle, 0)
          const hz = headingZ(fish.angle, 0)
          if (dx * hx + dz * hz < 0) continue
        }
      }
      return { ...point }
    }
    return point
  }

  private spawnPosition(
    band: FishState['depthBand'],
    scale: FishState['scale'],
    index: number,
    total: number,
  ) {
    const inset = 0.85
    const { min, max } = this.bounds
    const spanX = Math.max(max.x - min.x - inset * 2, 0.001)
    const spanZ = Math.max(max.z - min.z - inset * 2, 0.001)
    const cols = Math.max(2, Math.ceil(Math.sqrt(total * (spanX / spanZ))))
    const rows = Math.max(1, Math.ceil(total / cols))
    const gap = this.species.schooling ? 0.34 : MIN_SPAWN_GAP
    let best = { x: 0, y: this.depthY(band), z: 0 }
    let bestScore = -1

    for (let attempt = 0; attempt < SPAWN_RETRIES; attempt += 1) {
      const slot = attempt < 10 ? index : Math.floor(this.random() * total)
      const col = (slot + this.spawnColShift) % cols
      const row = Math.floor(slot / cols) % rows
      const position = {
        x: THREE.MathUtils.lerp(
          min.x + inset,
          max.x - inset,
          (col + 0.12 + this.random() * 0.76) / cols,
        ),
        y: this.depthY(band),
        z: THREE.MathUtils.lerp(
          min.z + inset,
          max.z - inset,
          (row + 0.12 + this.random() * 0.76) / rows,
        ),
      }
      if (this.blocked(position.x, position.y, position.z, scale)) continue
      if (!this.isClear(position, gap)) continue
      const score = this.spawnSpreadScore(position)
      if (score > bestScore) {
        best = position
        bestScore = score
        if (score > gap * 1.6) return { ...position }
      }
    }
    return { ...best }
  }

  private spawnSpreadScore(position: { x: number; y: number; z: number }) {
    let nearest = 64
    let any = false
    this.forOthers(null, (other) => {
      any = true
      const dx = other.position.x - position.x
      const dy = other.position.y - position.y
      const dz = other.position.z - position.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < nearest) nearest = dist
    })
    return any ? nearest : 64
  }

  private isClear(position: { x: number; y: number; z: number }, gap: number) {
    const gapSq = gap * gap
    let clear = true
    this.forOthers(null, (other) => {
      const dx = other.position.x - position.x
      const dy = other.position.y - position.y
      const dz = other.position.z - position.z
      if (dx * dx + dy * dy + dz * dz < gapSq) clear = false
    })
    return clear
  }

  private forOthers(fish: FishState | null, visit: (other: FishState) => void) {
    for (const other of this.fish) {
      if (other === fish) continue
      visit(other)
    }
    for (const group of this.neighbors) {
      for (const other of group) visit(other)
    }
  }

  private fishRadius(scale: FishState['scale']) {
    return this.species.length * 0.2 * Math.max(scale.x, scale.y) + 0.08
  }

  private avoidRadius(fish: FishState, other: FishState) {
    const own = this.fishRadius(fish.scale)
    if (this.fish.includes(other)) {
      return own + this.fishRadius(other.scale) + 0.12
    }
    const bulk = Math.max(other.scale.x, other.scale.y, other.scale.z)
    return own + bulk * 0.26 + 0.16
  }

  private fishAhead(
    fish: FishState,
    hx: number,
    hy: number,
    hz: number,
    look: number,
  ): FishState | null {
    let nearest: FishState | null = null
    let nearestSq = Infinity
    for (let step = 1; step <= 6; step += 1) {
      const t = (step / 6) * look
      const lx = fish.position.x + hx * t
      const ly = fish.position.y + hy * t
      const lz = fish.position.z + hz * t
      this.forOthers(fish, (other) => {
        const dx = lx - other.position.x
        const dy = ly - other.position.y
        const dz = lz - other.position.z
        const minDist = this.avoidRadius(fish, other)
        const distSq = dx * dx + dy * dy + dz * dz
        if (distSq >= minDist * minDist || distSq >= nearestSq) return
        nearest = other
        nearestSq = distSq
      })
      if (nearest) return nearest
    }
    return nearest
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
      const push = (reach - dist) * 0.7
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

  private asideFrom(fish: FishState, cx: number, cz: number, index?: number) {
    const rx = fish.position.x - cx
    const rz = fish.position.z - cz
    const hx = headingX(fish.angle, fish.pitch)
    const hz = headingZ(fish.angle, fish.pitch)
    let side = index === undefined ? 0 : this.boidSide[index]
    if (side === 0) {
      side = -rz * hx + rx * hz >= 0 ? 1 : -1
      if (index !== undefined) this.boidSide[index] = side
    }
    const tx = -rz * side
    const tz = rx * side
    const len = Math.hypot(tx, tz)
    if (len < 1e-5) {
      return { x: -hz * side, z: hx * side }
    }
    return { x: tx / len, z: tz / len }
  }

  private glideAround(fish: FishState, cx: number, cz: number) {
    const aside = this.asideFrom(fish, cx, cz)
    const heading = wrapAngle(Math.atan2(aside.z, aside.x))
    fish.targetAngle = this.isNimble()
      ? heading
      : this.limitTurn(fish.angle, heading, 0.85)
    fish.avoidUntil = fish.t + 0.4
    if (!this.species.schooling) {
      fish.speed = Math.min(fish.speed, this.settings.maxSpeed * 0.55)
    }
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
    fish.targetAngle = this.alongWall(fish.angle, hitX, hitZ)
    fish.dest = this.randomPoint(fish, true)
    fish.avoidUntil = fish.t + 0.85
    return true
  }

  private obstacleAhead(
    fish: FishState,
    hx: number,
    hy: number,
    hz: number,
    look: number,
  ) {
    const extra = this.species.weave
      ? 0.08
      : Math.min(0.85, this.species.length * 0.4)
    for (let step = 1; step <= 6; step += 1) {
      const t = (step / 6) * look
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
  ): FishState | null {
    const reach = this.fishRadius(fish.scale) + 0.85
    let nearest: FishState | null = null
    let nearestSq = Infinity
    for (let step = 1; step <= 4; step += 1) {
      const t = (step / 4) * look
      const lx = fish.position.x + hx * t
      const ly = fish.position.y + hy * t
      const lz = fish.position.z + hz * t
      this.forOthers(fish, (other) => {
        if (this.species.schooling && this.fish.includes(other)) return
        const dx = lx - other.position.x
        const dy = ly - other.position.y
        const dz = lz - other.position.z
        const minDist = reach + this.fishRadius(other.scale)
        const distSq = dx * dx + dy * dy + dz * dz
        if (distSq >= minDist * minDist || distSq >= nearestSq) return
        nearest = other
        nearestSq = distSq
      })
    }
    return nearest
  }

  private alongWall(angle: number, hitX: number, hitZ: number) {
    let tx = headingX(angle, 0)
    let tz = headingZ(angle, 0)
    if (hitX) tx = -hitX
    if (hitZ) tz = -hitZ
    if (Math.hypot(tx, tz) < 1e-4) {
      tx = hitX ? -hitX : headingX(angle, 0)
      tz = hitZ ? -hitZ : headingZ(angle, 0)
    }
    return wrapAngle(Math.atan2(tz, tx))
  }

  private isNimble() {
    return this.species.weave === true || this.species.schooling === true
  }

  private snapTowardTarget(fish: FishState, amount: number) {
    if (!this.isNimble()) return
    fish.angle = mixAngle(fish.angle, fish.targetAngle, amount)
  }

  private limitTurn(from: number, to: number, maxDelta: number) {
    return wrapAngle(
      from +
        THREE.MathUtils.clamp(shortestDelta(from, to), -maxDelta, maxDelta),
    )
  }

  private separateFromOthers(fish: FishState) {
    let pushed = false
    this.forOthers(fish, (other) => {
      const dx = fish.position.x - other.position.x
      const dy = fish.position.y - other.position.y
      const dz = fish.position.z - other.position.z
      const sameSchool = this.fish.includes(other)
      const minDist = sameSchool
        ? this.fishRadius(fish.scale) + this.fishRadius(other.scale) + 0.1
        : this.fishRadius(fish.scale) +
          Math.max(other.scale.x, other.scale.y, other.scale.z) * 0.22 +
          0.12
      const distSq = dx * dx + dy * dy + dz * dz
      if (distSq >= minDist * minDist) return
      const dist = Math.sqrt(Math.max(distSq, 1e-6))
      const push = (minDist - dist) * (sameSchool ? 0.45 : 0.28)
      fish.position.x += (dx / dist) * push
      fish.position.y += (dy / dist) * push * 0.35
      fish.position.z += (dz / dist) * push
      if (!this.species.schooling) {
        this.glideAround(fish, other.position.x, other.position.z)
      }
      pushed = true
    })
    return pushed
  }
}
