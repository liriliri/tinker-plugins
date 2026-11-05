export type LabelMode = 'none' | 'name' | 'key'
export type PlayMode = 'free' | 'demo'
export type KeyVisualState = 'idle' | 'down'

export interface Song {
  id: string
  nameKey: string
  midiUrl: string
}

export interface DemoEvent {
  midi: number
  at: number
  velocity: number
  holdMs: number
  softRelease: boolean
  step: number
}

export interface OptionItem<T extends string> {
  value: T
  labelKey: string
}
