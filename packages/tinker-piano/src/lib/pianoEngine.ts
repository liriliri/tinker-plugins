import { Piano } from '@tonejs/piano/build/piano/Piano.js'
import { Gain, start as startTone } from 'tone'
import each from 'licia/each'

const SAMPLE_URL = 'https://tambien.github.io/Piano/audio/'
/** Timed release after key-up so notes don't cut off abruptly. */
const SUSTAIN_MS = 1000

class PianoEngine {
  private piano: Piano | null = null
  private gain: Gain | null = null
  private loadPromise: Promise<void> | null = null
  private held = new Set<number>()
  private releaseTimers = new Map<number, ReturnType<typeof setTimeout>>()

  preload() {
    if (!this.loadPromise) {
      this.loadPromise = this.init()
    }
    return this.loadPromise
  }

  private async init() {
    this.gain = new Gain(0.8).toDestination()
    this.piano = new Piano({
      velocities: 4,
      release: true,
      pedal: false,
      url: SAMPLE_URL,
    })
    this.piano.connect(this.gain)
    await this.piano.load()
  }

  async noteOn(midi: number, velocity = 0.8) {
    await this.preload()
    await startTone()
    if (!this.piano) return
    this.clearRelease(midi)
    if (this.held.has(midi)) {
      this.piano.keyUp({ midi })
    }
    this.held.add(midi)
    this.piano.keyDown({ midi, velocity })
  }

  noteOff(midi: number, immediate = false) {
    if (!this.piano || !this.held.has(midi)) return
    if (immediate) {
      this.releaseNow(midi)
      return
    }
    this.scheduleRelease(midi, SUSTAIN_MS)
  }

  stopAll() {
    each([...this.releaseTimers.keys()], (midi) => this.clearRelease(midi))
    if (!this.piano) return
    each([...this.held], (midi) => {
      this.piano?.keyUp({ midi })
    })
    this.held.clear()
  }

  dispose() {
    this.stopAll()
    this.piano?.dispose()
    this.gain?.dispose()
    this.piano = null
    this.gain = null
    this.loadPromise = null
  }

  private scheduleRelease(midi: number, ms: number) {
    this.clearRelease(midi)
    this.releaseTimers.set(
      midi,
      setTimeout(() => {
        this.releaseTimers.delete(midi)
        this.releaseNow(midi)
      }, ms),
    )
  }

  private clearRelease(midi: number) {
    const timer = this.releaseTimers.get(midi)
    if (!timer) return
    clearTimeout(timer)
    this.releaseTimers.delete(midi)
  }

  private releaseNow(midi: number) {
    this.clearRelease(midi)
    if (!this.piano || !this.held.has(midi)) return
    this.held.delete(midi)
    this.piano.keyUp({ midi })
  }
}

const pianoEngine = new PianoEngine()

export default pianoEngine
