import type { SourceFile, ConversionSettings } from '../types'
import { CONTAINERS, RESOLUTION_HEIGHT, isAudioReencoding } from './constants'

function getVideoEncoderLib(codec: string): string {
  switch (codec) {
    case 'vp9':
      return 'libvpx-vp9'
    case 'vp8':
      return 'libvpx'
    case 'av1':
      return 'libsvtav1'
    case 'prores':
      return 'prores_ks'
    case 'xvid':
      return 'libxvid'
    case 'h265':
      return 'libx265'
    default:
      return 'libx264'
  }
}

interface VideoCodecOpts {
  codec: string
  ext: string
  qualityType: 'crf' | 'abr'
  crf: number
  avgBitrate: number
  multiPass: boolean
  preset: string
}

function getVideoCodecArgs(opts: VideoCodecOpts): string[] {
  const { codec, ext, qualityType, crf, avgBitrate, multiPass, preset } = opts
  const args: string[] = ['-c:v', getVideoEncoderLib(codec)]

  switch (codec) {
    case 'vp9': {
      if (qualityType === 'abr') {
        args.push('-b:v', `${avgBitrate}k`)
      } else {
        args.push('-crf', String(crf), '-b:v', '0')
      }
      args.push('-deadline', 'good', '-cpu-used', '2')
      break
    }
    case 'vp8': {
      if (qualityType === 'abr') {
        args.push('-b:v', `${avgBitrate}k`)
      } else {
        args.push('-crf', String(crf), '-b:v', '1M')
      }
      break
    }
    case 'av1': {
      args.push('-preset', preset)
      if (qualityType === 'abr') {
        args.push('-b:v', `${avgBitrate}k`)
        if (multiPass) {
          args.push('-pass', '1')
        }
      } else {
        args.push('-crf', String(crf))
      }
      break
    }
    case 'prores': {
      args.push('-profile:v', '3')
      break
    }
    case 'xvid': {
      args.push('-vtag', 'xvid')
      if (qualityType === 'abr') {
        args.push('-b:v', `${avgBitrate}k`)
      } else {
        args.push('-qscale:v', '4')
      }
      break
    }
    case 'h265':
    case 'h264':
    default: {
      args.push('-preset', preset)
      if (qualityType === 'abr') {
        args.push('-b:v', `${avgBitrate}k`)
        if (multiPass) {
          args.push('-pass', '1')
        }
      } else {
        args.push('-crf', String(crf))
      }
      if (ext !== 'ts') {
        args.push('-pix_fmt', 'yuv420p')
      }
      break
    }
  }

  return args
}

function getEncoderTuneArgs(codec: string, tune: string): string[] {
  if (!tune || tune === 'none') return []
  if (codec === 'av1') {
    return [
      '-svtav1-params',
      `tune=${tune === 'vq' ? '0' : tune === 'psnr' ? '1' : '3'}`,
    ]
  }
  if (codec === 'h264' || codec === 'h265') {
    return ['-tune', tune]
  }
  return []
}

function getEncoderProfileArgs(codec: string, profile: string): string[] {
  if (!profile || profile === 'auto') return []
  if (codec === 'h264' || codec === 'h265' || codec === 'av1') {
    return ['-profile:v', profile]
  }
  return []
}

function getEncoderLevelArgs(codec: string, level: string): string[] {
  if (!level || level === 'auto') return []
  if (codec === 'h264' || codec === 'h265') {
    return ['-level:v', level]
  }
  if (codec === 'av1') {
    return ['-level', level]
  }
  return []
}

function getAudioArgs(audioCodec: string, audioBitrate: string): string[] {
  if (audioCodec === 'none') return ['-an']
  if (audioCodec === 'copy') return ['-c:a', 'copy']
  if (audioCodec === 'mp3') return ['-c:a', 'libmp3lame', '-b:a', audioBitrate]
  if (audioCodec === 'opus') return ['-c:a', 'libopus', '-b:a', audioBitrate]
  return ['-c:a', 'aac', '-b:a', audioBitrate]
}

function getAudioSampleRateArgs(sampleRate: string): string[] {
  if (!sampleRate || sampleRate === 'auto') return []
  return ['-ar', sampleRate]
}

function getAudioMixdownArgs(mixdown: string): string[] {
  if (!mixdown || mixdown === 'auto') return []
  switch (mixdown) {
    case 'mono':
      return ['-ac', '1']
    case 'stereo':
      return ['-ac', '2']
    case '5.1':
      return ['-ac', '6']
    default:
      return []
  }
}

function buildScaleFilter(resolution: string): string | null {
  if (!resolution || resolution === 'auto') return null
  const height = RESOLUTION_HEIGHT[resolution]
  if (!height) return null
  return `scale=-2:'min(${height},ih)'`
}

const DENOISE_FILTERS: Record<string, string> = {
  'nlmeans-light': 'nlmeans=s=3:p=7:r=5',
  'nlmeans-medium': 'nlmeans=s=6:p=7:r=5',
  'nlmeans-strong': 'nlmeans=s=10:p=7:r=5',
  'hqdn3d-light': 'hqdn3d=2:1:2:3',
  'hqdn3d-medium': 'hqdn3d=4:3:6:4.5',
  'hqdn3d-strong': 'hqdn3d=7:7:12:8',
}

const SHARPEN_FILTERS: Record<string, string> = {
  'unsharp-light': 'unsharp=3:3:0.5:3:3:0.5',
  'unsharp-medium': 'unsharp=5:5:1.0:5:5:1.0',
  'unsharp-strong': 'unsharp=7:7:1.5:7:7:1.5',
}

function buildVideoFilters(opts: {
  resolution: string
  framerate: string
  framerateMode: string
  deinterlace: string
  denoise: string
  sharpen: string
}): string[] {
  const filters: string[] = []

  if (opts.deinterlace && opts.deinterlace !== 'off') {
    filters.push(opts.deinterlace)
  }

  if (opts.denoise && opts.denoise !== 'off') {
    const filter = DENOISE_FILTERS[opts.denoise]
    if (filter) filters.push(filter)
  }

  if (opts.resolution && opts.resolution !== 'auto') {
    const scale = buildScaleFilter(opts.resolution)
    if (scale) {
      filters.push(scale)
    }
  }

  if (opts.sharpen && opts.sharpen !== 'off') {
    const filter = SHARPEN_FILTERS[opts.sharpen]
    if (filter) filters.push(filter)
  }

  if (
    opts.framerate &&
    opts.framerate !== 'auto' &&
    opts.framerateMode === 'pfr'
  ) {
    filters.push(`fps=fps=${opts.framerate}`)
  }

  return filters
}

function getFramerateArgs(framerate: string, framerateMode: string): string[] {
  if (!framerate || framerate === 'auto') {
    return framerateMode === 'cfr' ? [] : ['-vsync', 'vfr']
  }

  if (framerateMode === 'cfr') {
    return ['-r', framerate]
  }

  if (framerateMode === 'pfr') {
    return []
  }

  return ['-vsync', 'vfr']
}

export interface ConvertOptions extends ConversionSettings {
  source: SourceFile
}

export function buildFFmpegArgs(opts: ConvertOptions): {
  args: string[]
  outputPath: string
} {
  const containerDef = CONTAINERS.find((c) => c.value === opts.container)
  if (!containerDef) throw new Error('Unknown container')

  const ext = containerDef.ext
  const codec = opts.videoEncoder
  const baseName = opts.source.fileName.replace(/\.[^.]+$/, '')
  const outputPath = opts.outputDir
    ? `${opts.outputDir}/${baseName}.${ext}`
    : opts.source.filePath.replace(/\.[^.]+$/, `.${ext}`)

  const args = ['-i', opts.source.filePath]

  if (codec === 'gif') {
    const gifFilters = ['fps=15']

    const scale = buildScaleFilter(opts.resolution)
    if (scale) {
      gifFilters.push(scale)
    }

    gifFilters.push('split[s0][s1]', '[s0]palettegen[p]', '[s1][p]paletteuse')
    args.push('-vf', gifFilters.join(','), '-loop', '0')
  } else {
    const codecArgs = getVideoCodecArgs({
      codec,
      ext,
      qualityType: opts.qualityType,
      crf: opts.crf,
      avgBitrate: opts.avgBitrate,
      multiPass: opts.multiPass,
      preset: opts.preset,
    })
    args.push(...codecArgs)

    args.push(...getEncoderTuneArgs(codec, opts.encoderTune))
    args.push(...getEncoderProfileArgs(codec, opts.encoderProfile))
    args.push(...getEncoderLevelArgs(codec, opts.encoderLevel))

    const vf = buildVideoFilters({
      resolution: opts.resolution,
      framerate: opts.framerate,
      framerateMode: opts.framerateMode,
      deinterlace: opts.deinterlace,
      denoise: opts.denoise,
      sharpen: opts.sharpen,
    })
    if (vf.length > 0) {
      args.push('-vf', vf.join(','))
    }

    args.push(...getFramerateArgs(opts.framerate, opts.framerateMode))

    args.push(...getAudioArgs(opts.audioCodec, opts.audioBitrate))

    if (isAudioReencoding(opts.audioCodec)) {
      args.push(...getAudioSampleRateArgs(opts.audioSampleRate))
      args.push(...getAudioMixdownArgs(opts.audioMixdown))
    }
  }

  if (ext === 'mp4' || ext === 'm4v') {
    args.push('-movflags', '+faststart')
  }

  args.push('-y', outputPath)
  return { args, outputPath }
}
