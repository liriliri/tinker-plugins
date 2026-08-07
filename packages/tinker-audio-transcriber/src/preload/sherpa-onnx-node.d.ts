declare module 'sherpa-onnx-node' {
  export interface WaveObject {
    samples: Float32Array
    sampleRate: number
  }

  export interface OfflineRecognizerResult {
    text: string
    tokens?: string[]
    timestamps?: number[]
    lang?: string
    emotion?: string
    event?: string
  }

  export interface OfflineStream {
    acceptWaveform(obj: { samples: Float32Array; sampleRate: number }): void
  }

  export class OfflineRecognizer {
    constructor(config: Record<string, unknown>)
    createStream(): OfflineStream
    decode(stream: OfflineStream): void
    getResult(stream: OfflineStream): OfflineRecognizerResult
  }

  export interface SpeechSegment {
    start: number
    samples: Float32Array
  }

  export class Vad {
    constructor(config: Record<string, unknown>, bufferSizeInSeconds: number)
    acceptWaveform(samples: Float32Array): void
    isEmpty(): boolean
    pop(): void
    front(enableExternalBuffer?: boolean): SpeechSegment
    flush(): void
  }

  export function readWave(
    filename: string,
    enableExternalBuffer?: boolean,
  ): WaveObject
}
