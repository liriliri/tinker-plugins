import type { SpeedTestPhase } from '../../common/types'

const PHASE_I18N: Record<SpeedTestPhase, string> = {
  idle: 'phaseIdle',
  ip: 'phaseIp',
  latency: 'phaseLatency',
  download: 'phaseDownload',
  upload: 'phaseUpload',
  done: 'phaseDone',
}

export function phaseI18nKey(phase: SpeedTestPhase): string {
  return PHASE_I18N[phase]
}
