import clamp from 'licia/clamp'
import map from 'licia/map'
import some from 'licia/some'
import toInt from 'licia/toInt'
import * as THREE from 'three'
import {
  CORAL_TYPE_BAG,
  PALETTE,
  PLANT_PALETTE,
  PLANT_TYPE_INDICES,
  RUBBLE_TYPE_INDEX,
  STONE_PALETTE,
} from './catalog'
import { REEF_DENSITY_RANGE, type Random, type Spot } from './types'
import { lerp, pick, sizeVariation } from './util'

/**
 * Places coral in colonies, then scatters rubble and denser green plants
 * around each centre so colonies do not meet the sand at a hard edge. Extra
 * plant patches fill the open sand. `count` is a density budget; rubble and
 * plants are extra.
 */
export function layoutReef(
  random: Random,
  count: number,
  vibrance: number,
  halfWidth: number,
  halfDepth: number,
  inset: number,
): Spot[] {
  const t = clamp(
    (count - REEF_DENSITY_RANGE[0]) /
      (REEF_DENSITY_RANGE[1] - REEF_DENSITY_RANGE[0]),
    0,
    1,
  )
  const pack = lerp(1.05, 0.32, t)
  const spots: Spot[] = []
  const spanX = halfWidth - inset
  const spanZ = halfDepth - inset
  const fits = (x: number, z: number, radius: number) =>
    Math.abs(x) <= spanX &&
    Math.abs(z) <= spanZ &&
    !some(spots, (spot) => {
      const dx = spot.x - x
      const dz = spot.z - z
      const reach = (spot.radius + radius) * pack
      return dx * dx + dz * dz < reach * reach
    })

  const palette = map(PALETTE, (hex) => new THREE.Color(hex))
  const stones = map(STONE_PALETTE, (hex) => new THREE.Color(hex))
  const greens = map(PLANT_PALETTE, (hex) => new THREE.Color(hex))
  const shiftHsl = (
    base: THREE.Color,
    hueJitter: number,
    satJitter: number,
    satMin: number,
    satMax: number,
    lightJitter: number,
    lightMin: number,
    lightMax: number,
    satScale = 1,
  ) => {
    const color = base.clone()
    const hsl = { h: 0, s: 0, l: 0 }
    color.getHSL(hsl)
    return color.setHSL(
      (hsl.h + (hueJitter ? (random() - 0.5) * hueJitter : 0) + 1) % 1,
      clamp((hsl.s + (random() - 0.5) * satJitter) * satScale, satMin, satMax),
      clamp(hsl.l + (random() - 0.5) * lightJitter, lightMin, lightMax),
    )
  }
  const tinted = (base: THREE.Color) =>
    shiftHsl(base, 0.07, 0.14, 0.02, 0.78, 0.12, 0.34, 0.62, vibrance)
  const rubbleColor = () =>
    shiftHsl(pick(stones, random), 0, 0.06, 0.02, 0.2, 0.08, 0.72, 0.92)
  const plantColor = () =>
    shiftHsl(
      pick(greens, random),
      0.04,
      0.1,
      0.25,
      0.7,
      0.1,
      0.28,
      0.5,
      vibrance,
    )
  const pickCoralType = () => pick(CORAL_TYPE_BAG, random)
  const pickPlantType = () => pick(PLANT_TYPE_INDICES, random)
  const placePlant = (x: number, z: number) => {
    const type = pickPlantType()
    const scale = sizeVariation(random, 0.45, 1.9)
    const radius = lerp(0.35, 0.7, random()) * scale
    if (!fits(x, z, radius)) return false
    spots.push({
      x,
      z,
      radius,
      scale,
      type,
      color: plantColor(),
    })
    return true
  }

  let coralCount = 0
  let plantCount = 0
  const coralTarget = Math.max(4, toInt(lerp(5, 108, t)))
  const plantTarget = Math.max(3, toInt(lerp(4, 86, t)))
  // The bed saturates well before a high count is reached, and every candidate can
  // then be rejected, so colony attempts are capped rather than looping on hope.
  const maxColonies = coralTarget * 4
  for (
    let colony = 0;
    colony < maxColonies && coralCount < coralTarget;
    colony += 1
  ) {
    const centerX = (random() * 2 - 1) * spanX
    const centerZ = (random() * 2 - 1) * spanZ
    // A colony shares a type and a hue; a stray of each keeps it from looking tiled.
    const colonyType = pickCoralType()
    const colonyHue = pick(palette, random)
    const members = 2 + toInt(random() * 3)

    for (let i = 0; i < members && coralCount < coralTarget; i += 1) {
      const angle = random() * Math.PI * 2
      const spread = random() * 1.05
      const x = centerX + Math.cos(angle) * spread
      const z = centerZ + Math.sin(angle) * spread
      const type = random() < 0.78 ? colonyType : pickCoralType()
      const scale = sizeVariation(random, 0.42, 2.15)
      // Spacing tracks the drawn size, so a giant claims room and a runt can
      // tuck into a gap the old fixed radius would have rejected.
      const radius = lerp(0.55, 1.05, random()) * scale * lerp(1.08, 0.7, t)
      if (!fits(x, z, radius)) continue
      spots.push({
        x,
        z,
        radius,
        scale,
        type,
        // Colonies still read as one hue, but a few more strays mixed in keep a
        // wider palette from looking sorted into tidy single-colour patches.
        color: tinted(random() < 0.76 ? colonyHue : pick(palette, random)),
      })
      coralCount += 1
    }

    // Rubble is its own kind: fill around the colony, outside the coral budget.
    // Three tries because the small end now fits gaps a fixed size could not.
    for (let i = 0; i < 3; i += 1) {
      const angle = random() * Math.PI * 2
      const spread = 1.2 + random() * 1.4
      const x = centerX + Math.cos(angle) * spread
      const z = centerZ + Math.sin(angle) * spread
      const scale = sizeVariation(random, 0.2, 2.4)
      const radius = 0.32 * scale
      if (!fits(x, z, radius)) continue
      spots.push({
        x,
        z,
        radius,
        scale,
        type: RUBBLE_TYPE_INDEX,
        color: rubbleColor(),
      })
    }

    // Green plants around the same centre; taller kelp leans farther out than
    // the grass tufts that tuck into the near gaps.
    const plantTries = 1 + toInt(lerp(1, 5, t))
    for (let i = 0; i < plantTries; i += 1) {
      const angle = random() * Math.PI * 2
      const spread = 0.7 + random() * 1.8
      const x = centerX + Math.cos(angle) * spread
      const z = centerZ + Math.sin(angle) * spread
      if (placePlant(x, z)) plantCount += 1
    }
  }

  // Plant-only patches on the open sand so the bed is grassy rather than coral-led.
  const maxPlantPatches = plantTarget * 3
  for (
    let patch = 0;
    patch < maxPlantPatches && plantCount < plantTarget;
    patch += 1
  ) {
    const centerX = (random() * 2 - 1) * spanX
    const centerZ = (random() * 2 - 1) * spanZ
    const members = 2 + toInt(random() * 3)
    for (let i = 0; i < members && plantCount < plantTarget; i += 1) {
      const angle = random() * Math.PI * 2
      const spread = random() * 1.2
      const x = centerX + Math.cos(angle) * spread
      const z = centerZ + Math.sin(angle) * spread
      if (placePlant(x, z)) plantCount += 1
    }
  }

  return spots
}
