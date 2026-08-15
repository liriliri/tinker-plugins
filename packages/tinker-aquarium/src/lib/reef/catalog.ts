import filter from 'licia/filter'
import findIdx from 'licia/findIdx'
import range from 'licia/range'
import type { ReefType } from './types'
import {
  createBrainCoral,
  createGrassTuft,
  createKelp,
  createOrganPipe,
  createRubble,
  createSoftFinger,
  createStaghorn,
  createVaseCoral,
} from './shapes'

// Warm and mid-tone hues carry this tank's dim, blue-biased light; violets sit
// too close to the water's own colour and sink into it, so the spread runs from
// deep reds through peach, amber and yellow into greens, teals and a cream that
// stands in for bleached coral.
export const PALETTE = [
  0xb8474e, 0xd4674f, 0xe07a35, 0xe0855f, 0xe89a80, 0xd9a03f, 0xe3c840,
  0xc9b94a, 0x8fb04a, 0x53a86a, 0x3fa39a, 0x2f93a8, 0x4c8fbe, 0x5fa8d9,
  0xd45f76, 0xdcd0a4,
]
export const STONE_PALETTE = [0xd2c8b8, 0xc4b9a8, 0xb8aea0, 0xcdc2b0]
export const PLANT_PALETTE = [
  0x3f7a3a, 0x4d8f42, 0x2f6b35, 0x5a9a48, 0x6b8f3a, 0x457a50,
]

/** Every growable bed item. Coral, rubble, and plants share the same instancing path. */
export const REEF_TYPES: ReefType[] = [
  {
    kind: 'coral',
    build: createStaghorn,
    size: [1.8, 2.7],
    sink: 0.03,
    surface: 0,
  },
  {
    kind: 'coral',
    build: createSoftFinger,
    size: [1.4, 2.1],
    sink: 0.05,
    surface: 1,
  },
  {
    kind: 'coral',
    build: createBrainCoral,
    size: [1.1, 1.8],
    sink: 0.08,
    surface: 1,
  },
  {
    kind: 'coral',
    build: createOrganPipe,
    size: [1.4, 2.1],
    sink: 0.04,
    surface: 0,
  },
  {
    kind: 'coral',
    build: createVaseCoral,
    size: [1.1, 1.7],
    sink: 0.03,
    surface: 0,
    doubleSide: true,
  },
  { kind: 'rubble', build: createRubble, size: [0.35, 0.7], sink: 0.25 },
  {
    kind: 'plant',
    build: createKelp,
    size: [1.8, 2.9],
    sink: 0.02,
    doubleSide: true,
  },
  {
    kind: 'plant',
    build: createGrassTuft,
    size: [0.9, 1.5],
    sink: 0.04,
    doubleSide: true,
  },
]

export const CORAL_TYPE_INDICES = filter(
  range(REEF_TYPES.length),
  (index) => REEF_TYPES[index].kind === 'coral',
)

export const RUBBLE_TYPE_INDEX = findIdx(
  REEF_TYPES,
  (type) => type.kind === 'rubble',
)

export const PLANT_TYPE_INDICES = filter(
  range(REEF_TYPES.length),
  (index) => REEF_TYPES[index].kind === 'plant',
)
