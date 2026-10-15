import { Midi } from '@tonejs/midi'
import clamp from 'licia/clamp'
import Emitter from 'licia/Emitter'
import flatten from 'licia/flatten'
import map from 'licia/map'
import min from 'licia/min'
import * as Tone from 'tone'

class MidiPlayer extends Emitter {
  private synth: Tone.PolySynth | null = null
  private part: Tone.Part | null = null
  private endId: number | null = null
  duration = 0
  songId: string | null = null

  constructor() {
    super()
  }

  private notify() {
    this.emit('change')
  }

  get currentTime() {
    return min(Tone.Transport.seconds, this.duration)
  }

  get isPlaying() {
    return Tone.Transport.state === 'started'
  }

  async play(buffer: ArrayBuffer, songId: string) {
    await Tone.start()
    this.stop(false)
    this.songId = songId

    const midi = new Midi(buffer)
    this.duration = midi.duration || 1

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 },
    }).toDestination()
    this.synth.maxPolyphony = 64
    this.synth.volume.value = -8

    const notes = flatten(map(midi.tracks, (t) => t.notes))
    this.part = new Tone.Part(
      (time, note) => {
        this.synth?.triggerAttackRelease(
          note.name,
          note.duration,
          time,
          note.velocity,
        )
      },
      map(notes, (n) => ({
        time: n.time,
        name: n.name,
        duration: n.duration,
        velocity: n.velocity,
      })),
    )
    this.part.start(0)

    Tone.Transport.position = 0
    this.endId = Tone.Transport.scheduleOnce(() => {
      Tone.Transport.pause()
      this.notify()
    }, this.duration)

    Tone.Transport.start()
    this.notify()
  }

  pause() {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause()
      this.notify()
    }
  }

  resume() {
    if (Tone.Transport.state === 'paused') {
      Tone.Transport.start()
      this.notify()
    }
  }

  toggle() {
    if (this.isPlaying) this.pause()
    else this.resume()
  }

  seek(seconds: number) {
    if (!this.part || this.duration <= 0) return
    const t = clamp(seconds, 0, this.duration)
    const wasPlaying = this.isPlaying

    this.synth?.releaseAll()

    if (this.endId !== null) {
      Tone.Transport.clear(this.endId)
      this.endId = null
    }

    Tone.Transport.seconds = t

    if (t >= this.duration) {
      Tone.Transport.pause()
      this.notify()
      return
    }

    this.endId = Tone.Transport.scheduleOnce(() => {
      Tone.Transport.pause()
      this.endId = null
      this.notify()
    }, this.duration)

    if (wasPlaying) Tone.Transport.start()
    this.notify()
  }

  stop(notify = true) {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    if (this.endId !== null) {
      this.endId = null
    }
    this.part?.dispose()
    this.part = null
    this.synth?.dispose()
    this.synth = null
    this.duration = 0
    this.songId = null
    if (notify) this.notify()
  }
}

const midiPlayer = new MidiPlayer()
export default midiPlayer
