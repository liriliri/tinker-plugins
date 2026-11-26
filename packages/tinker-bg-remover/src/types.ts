export type ModelSize = 'small' | 'medium'

type BgRemoverStage = 'download' | 'inference'

export type BgRemoverProgress = {
  stage: BgRemoverStage
  current: number
  total: number
}
