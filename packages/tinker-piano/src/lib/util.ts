import contain from 'licia/contain'
import each from 'licia/each'
import endWith from 'licia/endWith'
import find from 'licia/find'
import last from 'licia/last'
import lowerCase from 'licia/lowerCase'
import max from 'licia/max'
import range from 'licia/range'
import replaceAll from 'licia/replaceAll'
import toInt from 'licia/toInt'
import castleMidiUrl from '../assets/castle-in-the-sky.mid?url'
import hesAPirateMidiUrl from '../assets/hes-a-pirate.mid?url'
import type { Song } from '../types'

const NOTE_NAMES = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B',
] as const

const BLACK_PC = [1, 3, 6, 8, 10]

export function isBlackKey(midi: number) {
  return contain(BLACK_PC, midi % 12)
}

export function midiName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${toInt(midi / 12) - 1}`
}

export interface KeyLayout {
  whites: number[]
  blacks: { midi: number; pos: number }[]
  whitePct: number
}

export function keyLayout(lowMidi: number, highMidi: number): KeyLayout {
  const whites: number[] = []
  const blacks: { midi: number; pos: number }[] = []
  each(range(lowMidi, highMidi + 1), (midi) => {
    if (isBlackKey(midi)) blacks.push({ midi, pos: whites.length })
    else whites.push(midi)
  })
  return {
    whites,
    blacks,
    whitePct: 100 / max(whites.length, 1),
  }
}

export function keyXRatio(
  midi: number,
  layout: KeyLayout,
  lowMidi: number,
  highMidi: number,
) {
  const { whites, blacks, whitePct } = layout
  if (isBlackKey(midi)) {
    const black = find(blacks, (b) => b.midi === midi)
    if (black) return (black.pos * whitePct) / 100
  } else {
    const index = whites.indexOf(midi)
    if (index >= 0) return ((index + 0.5) * whitePct) / 100
  }
  const span = max(highMidi - lowMidi, 1)
  return (midi - lowMidi) / span
}

export function preferStartOctave(visibleOctaves: number) {
  if (visibleOctaves >= 4) return 2
  if (visibleOctaves === 3) return 3
  return 4
}

export function fileLabel(path: string) {
  const base = last(replaceAll(path, '\\', '/').split('/')) || 'MIDI'
  const lower = base.toLowerCase()
  if (endWith(lower, '.midi')) return base.slice(0, -5)
  if (endWith(lower, '.mid')) return base.slice(0, -4)
  return base
}

export function toArrayBuffer(
  data: Buffer | Uint8Array | ArrayBuffer,
): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer
}

export function isMidiFile(file: File) {
  const name = lowerCase(file.name)
  return (
    endWith(name, '.mid') ||
    endWith(name, '.midi') ||
    contain(['audio/midi', 'audio/x-midi'], file.type)
  )
}

export function pickMidiFileWeb(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.mid,.midi,audio/midi,audio/x-midi'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}

export const SONGS: Song[] = [
  {
    id: 'hesAPirate',
    nameKey: 'songHesAPirate',
    midiUrl: hesAPirateMidiUrl,
  },
  {
    id: 'castle',
    nameKey: 'songCastle',
    midiUrl: castleMidiUrl,
  },
]

export function getSong(id: string) {
  return find(SONGS, (song) => song.id === id) ?? SONGS[0]
}
