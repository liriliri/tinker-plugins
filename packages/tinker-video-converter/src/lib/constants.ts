import type {
  ContainerFormat,
  VideoEncoder,
  ConversionSettings,
} from '../types'

export const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.webm',
  '.flv',
  '.wmv',
  '.m4v',
  '.3gp',
  '.ts',
])

// --- Container / Encoder (split like HandBrake) ---

export const CONTAINERS: ContainerFormat[] = [
  { value: 'mp4', ext: 'mp4', label: 'MP4' },
  { value: 'mkv', ext: 'mkv', label: 'MKV' },
  { value: 'webm', ext: 'webm', label: 'WebM' },
  { value: 'mov', ext: 'mov', label: 'MOV' },
  { value: 'avi', ext: 'avi', label: 'AVI' },
  { value: 'gif', ext: 'gif', label: 'GIF' },
]

export const VIDEO_ENCODERS: VideoEncoder[] = [
  { value: 'h264', label: 'H.264 (x264)' },
  { value: 'h265', label: 'H.265 (x265)' },
  { value: 'av1', label: 'AV1 (SVT-AV1)' },
  { value: 'vp9', label: 'VP9' },
  { value: 'vp8', label: 'VP8' },
  { value: 'prores', label: 'ProRes' },
  { value: 'xvid', label: 'Xvid' },
  { value: 'gif', label: 'GIF' },
]

export const CONTAINER_ENCODERS: Record<string, string[]> = {
  mp4: ['h264', 'h265', 'av1'],
  mkv: ['h264', 'h265', 'vp9', 'av1'],
  webm: ['vp9', 'vp8', 'av1'],
  mov: ['h264', 'h265', 'prores'],
  avi: ['h264', 'xvid'],
  gif: ['gif'],
}

export function getEncodersForContainer(container: string): VideoEncoder[] {
  const allowed = CONTAINER_ENCODERS[container] || []
  return VIDEO_ENCODERS.filter((e) => allowed.includes(e.value))
}

export function getDefaultEncoder(container: string): string {
  const encoders = CONTAINER_ENCODERS[container]
  return encoders?.[0] || 'h264'
}

export const PRESETS = [
  'ultrafast',
  'superfast',
  'veryfast',
  'faster',
  'fast',
  'medium',
  'slow',
  'slower',
  'veryslow',
]

export const AV1_PRESETS = [
  '13',
  '12',
  '11',
  '10',
  '9',
  '8',
  '7',
  '6',
  '5',
  '4',
  '3',
  '2',
  '1',
  '0',
]

export const ENCODER_PRESETS: Record<
  string,
  { value: string; label: string }[]
> = {
  h264: PRESETS.map((p) => ({ value: p, label: p })),
  h265: PRESETS.map((p) => ({ value: p, label: p })),
  av1: AV1_PRESETS.map((p) => ({
    value: p,
    label: `${p} ${parseInt(p) >= 10 ? '(Faster)' : parseInt(p) >= 6 ? '(Balanced)' : '(Slower)'}`,
  })),
}

export const CODECS_WITH_QUALITY = new Set([
  'h264',
  'h265',
  'vp9',
  'vp8',
  'av1',
])
export const CODECS_WITH_MULTIPASS = new Set(['h264', 'h265', 'av1'])

export function isAudioReencoding(codec: string): boolean {
  return codec !== 'none' && codec !== 'copy'
}

export const QUALITY_TYPES: { value: string; label: string }[] = [
  { value: 'crf', label: 'Constant Quality (CRF)' },
  { value: 'abr', label: 'Average Bitrate (kbps)' },
]

export const AVG_BITRATE_PRESETS = [
  500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 15000,
  20000, 30000, 50000,
]

export const AUDIO_CODECS: { value: string; label: string }[] = [
  { value: 'aac', label: 'AAC' },
  { value: 'mp3', label: 'MP3' },
  { value: 'opus', label: 'Opus' },
  { value: 'copy', label: 'Copy' },
  { value: 'none', label: 'None' },
]

export const AUDIO_BITRATES = ['64k', '96k', '128k', '192k', '256k', '320k']

// --- Encoder Tune / Profile / Level (aligned with HandBrake) ---

export const ENCODER_TUNES: Record<string, { value: string; label: string }[]> =
  {
    h264: [
      { value: 'none', label: 'None' },
      { value: 'film', label: 'Film' },
      { value: 'animation', label: 'Animation' },
      { value: 'grain', label: 'Grain' },
      { value: 'stillimage', label: 'Still Image' },
      { value: 'psnr', label: 'PSNR' },
      { value: 'ssim', label: 'SSIM' },
      { value: 'fastdecode', label: 'Fast Decode' },
      { value: 'zerolatency', label: 'Zero Latency' },
    ],
    h265: [
      { value: 'none', label: 'None' },
      { value: 'psnr', label: 'PSNR' },
      { value: 'ssim', label: 'SSIM' },
      { value: 'grain', label: 'Grain' },
      { value: 'zerolatency', label: 'Zero Latency' },
      { value: 'fastdecode', label: 'Fast Decode' },
      { value: 'animation', label: 'Animation' },
    ],
    av1: [
      { value: 'none', label: 'None' },
      { value: 'vq', label: 'VQ' },
      { value: 'psnr', label: 'PSNR' },
      { value: 'ssim', label: 'SSIM' },
    ],
  }

export const ENCODER_PROFILES: Record<
  string,
  { value: string; label: string }[]
> = {
  h264: [
    { value: 'auto', label: 'Auto' },
    { value: 'baseline', label: 'Baseline' },
    { value: 'main', label: 'Main' },
    { value: 'high', label: 'High' },
  ],
  h265: [
    { value: 'auto', label: 'Auto' },
    { value: 'main', label: 'Main' },
    { value: 'main10', label: 'Main 10' },
  ],
  av1: [
    { value: 'auto', label: 'Auto' },
    { value: 'main', label: 'Main' },
  ],
}

export const H264_LEVELS: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '1.0', label: '1.0' },
  { value: '1b', label: '1b' },
  { value: '1.1', label: '1.1' },
  { value: '1.2', label: '1.2' },
  { value: '1.3', label: '1.3' },
  { value: '2.0', label: '2.0' },
  { value: '2.1', label: '2.1' },
  { value: '2.2', label: '2.2' },
  { value: '3.0', label: '3.0' },
  { value: '3.1', label: '3.1' },
  { value: '3.2', label: '3.2' },
  { value: '4.0', label: '4.0' },
  { value: '4.1', label: '4.1' },
  { value: '4.2', label: '4.2' },
  { value: '5.0', label: '5.0' },
  { value: '5.1', label: '5.1' },
  { value: '5.2', label: '5.2' },
  { value: '6.0', label: '6.0' },
  { value: '6.1', label: '6.1' },
  { value: '6.2', label: '6.2' },
]

export const H265_LEVELS: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '1.0', label: '1.0' },
  { value: '2.0', label: '2.0' },
  { value: '2.1', label: '2.1' },
  { value: '3.0', label: '3.0' },
  { value: '3.1', label: '3.1' },
  { value: '4.0', label: '4.0' },
  { value: '4.1', label: '4.1' },
  { value: '5.0', label: '5.0' },
  { value: '5.1', label: '5.1' },
  { value: '5.2', label: '5.2' },
  { value: '6.0', label: '6.0' },
  { value: '6.1', label: '6.1' },
  { value: '6.2', label: '6.2' },
]

export const AV1_LEVELS: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '2.0', label: '2.0' },
  { value: '2.1', label: '2.1' },
  { value: '2.2', label: '2.2' },
  { value: '2.3', label: '2.3' },
  { value: '3.0', label: '3.0' },
  { value: '3.1', label: '3.1' },
  { value: '3.2', label: '3.2' },
  { value: '3.3', label: '3.3' },
  { value: '4.0', label: '4.0' },
  { value: '4.1', label: '4.1' },
  { value: '4.2', label: '4.2' },
  { value: '4.3', label: '4.3' },
  { value: '5.0', label: '5.0' },
  { value: '5.1', label: '5.1' },
  { value: '5.2', label: '5.2' },
  { value: '5.3', label: '5.3' },
  { value: '6.0', label: '6.0' },
  { value: '6.1', label: '6.1' },
  { value: '6.2', label: '6.2' },
  { value: '6.3', label: '6.3' },
]

export const ENCODER_LEVELS: Record<
  string,
  { value: string; label: string }[]
> = {
  h264: H264_LEVELS,
  h265: H265_LEVELS,
  av1: AV1_LEVELS,
}

// --- Resolution & Framerate ---

export const RESOLUTIONS: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '2160p', label: '2160p (4K)' },
  { value: '1440p', label: '1440p (2.5K)' },
  { value: '1080p', label: '1080p' },
  { value: '720p', label: '720p' },
  { value: '576p', label: '576p' },
  { value: '480p', label: '480p' },
]

export const RESOLUTION_HEIGHT: Record<string, number> = {
  '2160p': 2160,
  '1440p': 1440,
  '1080p': 1080,
  '720p': 720,
  '576p': 576,
  '480p': 480,
}

export const FRAMERATES: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '15', label: '15' },
  { value: '23.976', label: '23.976 (NTSC Film)' },
  { value: '24', label: '24' },
  { value: '25', label: '25 (PAL)' },
  { value: '29.97', label: '29.97 (NTSC)' },
  { value: '30', label: '30' },
  { value: '50', label: '50' },
  { value: '59.94', label: '59.94' },
  { value: '60', label: '60' },
]

export const FRAMERATE_MODES: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto (VFR)' },
  { value: 'cfr', label: 'Constant (CFR)' },
  { value: 'pfr', label: 'Peak Limited (PFR)' },
]

// --- Audio Sample Rate & Mixdown ---

export const AUDIO_SAMPLE_RATES: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '22050', label: '22.05 kHz' },
  { value: '24000', label: '24 kHz' },
  { value: '32000', label: '32 kHz' },
  { value: '44100', label: '44.1 kHz' },
  { value: '48000', label: '48 kHz' },
]

export const AUDIO_MIXDOWNS: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'mono', label: 'Mono' },
  { value: 'stereo', label: 'Stereo' },
  { value: '5.1', label: '5.1 Surround' },
]

// --- Video Filters ---

export const DEINTERLACE_OPTIONS: { value: string; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'yadif', label: 'Yadif' },
  { value: 'bwdif', label: 'Bwdif' },
]

export const DENOISE_OPTIONS: { value: string; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'nlmeans-light', label: 'NLMeans (Light)' },
  { value: 'nlmeans-medium', label: 'NLMeans (Medium)' },
  { value: 'nlmeans-strong', label: 'NLMeans (Strong)' },
  { value: 'hqdn3d-light', label: 'HQDN3D (Light)' },
  { value: 'hqdn3d-medium', label: 'HQDN3D (Medium)' },
  { value: 'hqdn3d-strong', label: 'HQDN3D (Strong)' },
]

export const SHARPEN_OPTIONS: { value: string; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'unsharp-light', label: 'Unsharp (Light)' },
  { value: 'unsharp-medium', label: 'Unsharp (Medium)' },
  { value: 'unsharp-strong', label: 'Unsharp (Strong)' },
]

// --- Global Presets (like HandBrake, sets all params at once) ---

type PresetSettings = Omit<ConversionSettings, 'outputDir'>

export interface GlobalPreset {
  name: string
  description: string
  settings: PresetSettings
}

const BASE_SETTINGS: PresetSettings = {
  container: 'mp4',
  videoEncoder: 'h264',
  preset: 'medium',
  qualityType: 'crf',
  crf: 23,
  avgBitrate: 2500,
  multiPass: false,
  encoderTune: 'none',
  encoderProfile: 'auto',
  encoderLevel: 'auto',
  resolution: 'auto',
  framerate: 'auto',
  framerateMode: 'auto',
  audioCodec: 'aac',
  audioBitrate: '128k',
  audioSampleRate: 'auto',
  audioMixdown: 'auto',
  deinterlace: 'off',
  denoise: 'off',
  sharpen: 'off',
}

export const GLOBAL_PRESETS: GlobalPreset[] = [
  {
    name: 'Very Fast 1080p30',
    description: 'H.264, 1080p, very fast encoding',
    settings: {
      ...BASE_SETTINGS,
      preset: 'veryfast',
      crf: 24,
      encoderProfile: 'main',
      encoderLevel: '4.0',
      resolution: '1080p',
      framerate: '30',
      framerateMode: 'pfr',
      audioBitrate: '160k',
      audioMixdown: 'stereo',
    },
  },
  {
    name: 'Fast 1080p30',
    description: 'H.264, 1080p, balanced speed/quality',
    settings: {
      ...BASE_SETTINGS,
      preset: 'fast',
      crf: 22,
      encoderProfile: 'main',
      encoderLevel: '4.0',
      resolution: '1080p',
      framerate: '30',
      framerateMode: 'pfr',
      audioBitrate: '160k',
      audioMixdown: 'stereo',
    },
  },
  {
    name: 'HQ 1080p30 Surround',
    description: 'H.264, 1080p, high quality, slow',
    settings: {
      ...BASE_SETTINGS,
      preset: 'slow',
      crf: 20,
      encoderProfile: 'high',
      encoderLevel: '4.0',
      resolution: '1080p',
      framerate: '30',
      framerateMode: 'pfr',
      audioBitrate: '160k',
      audioMixdown: 'stereo',
    },
  },
  {
    name: 'Fast 720p30',
    description: 'H.264, 720p, balanced speed/quality',
    settings: {
      ...BASE_SETTINGS,
      preset: 'fast',
      crf: 22,
      encoderProfile: 'main',
      encoderLevel: '3.1',
      resolution: '720p',
      framerate: '30',
      framerateMode: 'pfr',
      audioBitrate: '128k',
      audioMixdown: 'stereo',
    },
  },
  {
    name: 'Fast 480p30',
    description: 'H.264, 480p, small file size',
    settings: {
      ...BASE_SETTINGS,
      preset: 'fast',
      crf: 22,
      encoderProfile: 'main',
      encoderLevel: '3.1',
      resolution: '480p',
      framerate: '30',
      framerateMode: 'pfr',
      audioBitrate: '128k',
      audioMixdown: 'stereo',
    },
  },
  {
    name: 'Very Fast 2160p60 4K HEVC',
    description: 'H.265, 4K 60fps, very fast encoding',
    settings: {
      ...BASE_SETTINGS,
      videoEncoder: 'h265',
      preset: 'veryfast',
      crf: 24,
      encoderProfile: 'main',
      resolution: '2160p',
      framerate: '60',
      framerateMode: 'pfr',
      audioBitrate: '160k',
      audioMixdown: 'stereo',
    },
  },
  {
    name: 'Fast 1080p30 HEVC',
    description: 'H.265, 1080p, smaller files than H.264',
    settings: {
      ...BASE_SETTINGS,
      videoEncoder: 'h265',
      preset: 'fast',
      crf: 22,
      encoderProfile: 'main',
      encoderLevel: '4.0',
      resolution: '1080p',
      framerate: '30',
      framerateMode: 'pfr',
      audioBitrate: '160k',
      audioMixdown: 'stereo',
    },
  },
  {
    name: 'Very Fast 2160p60 4K AV1',
    description: 'AV1, 4K 60fps, modern codec',
    settings: {
      ...BASE_SETTINGS,
      videoEncoder: 'av1',
      preset: '7',
      crf: 32,
      encoderTune: 'none',
      encoderProfile: 'main',
      resolution: '2160p',
      framerate: '60',
      framerateMode: 'pfr',
      audioBitrate: '160k',
      audioMixdown: 'stereo',
    },
  },
  {
    name: 'Fast 1080p30 AV1',
    description: 'AV1, 1080p, best compression',
    settings: {
      ...BASE_SETTINGS,
      videoEncoder: 'av1',
      preset: '6',
      crf: 30,
      encoderProfile: 'main',
      resolution: '1080p',
      framerate: '30',
      framerateMode: 'pfr',
      audioBitrate: '160k',
      audioMixdown: 'stereo',
    },
  },
  {
    name: 'WebM VP9 1080p',
    description: 'VP9 in WebM, web-friendly',
    settings: {
      ...BASE_SETTINGS,
      container: 'webm',
      videoEncoder: 'vp9',
      crf: 23,
      resolution: '1080p',
      framerate: '30',
      framerateMode: 'pfr',
      audioCodec: 'opus',
      audioBitrate: '128k',
      audioMixdown: 'stereo',
    },
  },
]
