const BANDS = 64
const audio = new Audio()
const direct = new Audio()
audio.crossOrigin = 'anonymous'

let routed: HTMLAudioElement = audio
let recovering = false
let playGen = 0
let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let freq = new Uint8Array(0)
const bands = new Float32Array(BANDS)
const shaped = new Float32Array(BANDS)
const edges = Array.from(
  { length: BANDS + 1 },
  (_, index) => 32 * 500 ** (index / BANDS),
)
let level = 0
let peak = 0.25

export function armAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    const source = audioCtx.createMediaElementSource(audio)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.7
    source.connect(analyser)
    analyser.connect(audioCtx.destination)
    freq = new Uint8Array(analyser.frequencyBinCount)
  }
  void audioCtx.resume()
}

export function setOutputVolume(volume: number) {
  audio.volume = volume
  direct.volume = volume
}

export function setOutputMuted(muted: boolean) {
  audio.muted = muted
  direct.muted = muted
}

export function pauseOutput() {
  audio.pause()
  direct.pause()
}

export function resumeOutput() {
  armAudio()
  return routed.play()
}

export function onOutputError(handler: () => void) {
  const listener = (event: Event) => {
    if (recovering) return
    const element = event.currentTarget
    if (!(element instanceof HTMLAudioElement)) return
    if (!element.getAttribute('src')) return
    handler()
  }
  audio.addEventListener('error', listener)
  direct.addEventListener('error', listener)
}

function release(element: HTMLAudioElement) {
  element.pause()
  if (!element.getAttribute('src')) return
  element.removeAttribute('src')
  element.load()
}

export async function playSource(src: string) {
  const gen = ++playGen
  pauseOutput()
  recovering = true
  routed = audio
  audio.src = src
  try {
    await audio.play()
    if (gen !== playGen) return
    release(direct)
  } catch (err) {
    if (gen !== playGen) return
    const blocked =
      err instanceof DOMException && err.name === 'NotAllowedError'
    if (blocked) throw err
    release(audio)
    routed = direct
    direct.src = src
    await direct.play()
    if (gen !== playGen && routed !== direct) release(direct)
  } finally {
    if (gen === playGen) recovering = false
  }
}

function shapeBands(readBin: (index: number) => number) {
  let maxBin = 0
  for (let i = 0; i < BANDS; i++) {
    const value = readBin(i)
    shaped[i] = value
    if (value > maxBin) maxBin = value
  }
  peak += (Math.max(maxBin, 0.25) - peak) * (maxBin > peak ? 0.08 : 0.01)
  for (let i = 0; i < BANDS; i++) {
    bands[i] = Math.min(1, (shaped[i] * 0.8) / peak)
  }
}

export function readSound() {
  const playing = !routed.paused && !routed.ended
  const metered = routed === audio
  let real = false
  if (analyser && audioCtx && playing && metered) {
    analyser.getByteFrequencyData(freq)
    let energy = 0
    for (let i = 0; i < freq.length; i++) energy += freq[i]
    real = energy > freq.length * 4
    if (real) {
      const hz = audioCtx.sampleRate / analyser.fftSize
      shapeBands((index) => {
        const start = Math.max(1, (edges[index] / hz) | 0)
        const end = Math.max(start + 1, (edges[index + 1] / hz) | 0)
        let loudest = 0
        for (let bin = start; bin < end && bin < freq.length; bin++) {
          if (freq[bin] > loudest) loudest = freq[bin]
        }
        return (
          (Math.max(0, loudest / 255 - 0.18) / 0.82) ** 1.5 *
          (1 + (index / BANDS) * 0.9)
        )
      })
    }
  }
  level += ((playing ? 1 : 0.15) - level) * 0.05
  if (!real) {
    const t = performance.now() / 1000
    if (playing) {
      shapeBands((index) => {
        if (Math.sin(index * 12.9898) < 0.45) return 0
        const wave = Math.sin(t * (0.55 + (index % 9) * 0.07) + index * 1.3)
        return Math.max(0, wave) ** 1.5 * (0.3 + (index % 5) * 0.06)
      })
    } else {
      const flat = 0.04 * (1 + 0.02 * Math.sin(t * 1.2))
      for (let i = 0; i < BANDS; i++) bands[i] += (flat - bands[i]) * 0.15
    }
  }
  return { bands, level }
}
