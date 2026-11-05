import { Midi } from '@tonejs/midi'
import clamp from 'licia/clamp'
import flatten from 'licia/flatten'
import map from 'licia/map'
import max from 'licia/max'
import type { DemoEvent } from '../types'

const LEAD_IN_MS = 240

export function parseMidiBuffer(data: ArrayBuffer | Uint8Array): DemoEvent[] {
  const midi = new Midi(data)
  const notes = flatten(map(midi.tracks, (track) => track.notes)).sort(
    (a, b) => a.time - b.time || a.midi - b.midi,
  )

  return map(notes, (note, index) => {
    const holdMs = max(50, note.duration * 1000)
    return {
      midi: note.midi,
      at: LEAD_IN_MS + note.time * 1000,
      velocity: clamp(note.velocity, 0.25, 1),
      holdMs,
      softRelease: note.duration >= 0.45,
      step: index,
    }
  })
}

export async function loadMidiDemo(url: string): Promise<DemoEvent[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load MIDI (${res.status})`)
  return parseMidiBuffer(await res.arrayBuffer())
}
