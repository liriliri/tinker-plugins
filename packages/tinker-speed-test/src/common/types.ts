export type SpeedServerKind = 'librespeed' | 'cloudflare' | 'ookla'

export type SpeedTestNodeInfo = {
  id: string
  name: string
  nameZh: string
  kind: SpeedServerKind
}

export type SpeedTestPhase =
  'idle' | 'ip' | 'latency' | 'download' | 'upload' | 'done'

export type SpeedProgressEvent =
  | { type: 'phase'; phase: SpeedTestPhase }
  | { type: 'ip'; ip: string }
  | {
      type: 'latency'
      pingMs: number
      jitterMs: number
      done: number
      total: number
    }
  | {
      type: 'download'
      mbps: number
      progress: number
      seconds: number
      final?: boolean
    }
  | {
      type: 'upload'
      mbps: number
      progress: number
      seconds: number
      final?: boolean
    }

export type SpeedTestResult = {
  nodeId: string
  ip: string
  pingMs: number
  jitterMs: number
  downloadMbps: number
  uploadMbps: number
}

export type SpeedUnit = 'mbps' | 'mbs'
