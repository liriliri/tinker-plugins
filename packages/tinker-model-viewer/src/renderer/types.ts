export type LoadStatus = 'idle' | 'loading' | 'ready'

export type ViewMode = 'orbit' | 'firstPerson'

export interface ModelInfo {
  fileName: string
  sourceFormat: string
  byteLength: number
}
