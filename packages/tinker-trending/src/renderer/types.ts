import type { SourceId } from '../common/types'

export type SourceType = 'hottest' | 'realtime'

export interface SourceMeta {
  id: SourceId
  name: string
  color: string
  type: SourceType
  home: string
  favicon: string
}
