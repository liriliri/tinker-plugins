import type { SourceFile, ConversionSettings } from '../types'
import { VIDEO_OUTPUT_FORMATS } from './constants'

function getVideoCodecArgs(codec: string, ext: string): string[] {
  switch (codec) {
    case 'vp9':
      return [
        '-c:v',
        'libvpx-vp9',
        '-crf',
        '23',
        '-b:v',
        '0',
        '-deadline',
        'good',
        '-cpu-used',
        '2',
      ]
    case 'vp8':
      return ['-c:v', 'libvpx', '-crf', '10', '-b:v', '1M']
    case 'av1':
      return ['-c:v', 'libsvtav1', '-crf', '30', '-preset', '6']
    case 'prores':
      return ['-c:v', 'prores_ks', '-profile:v', '3']
    case 'xvid':
      return ['-c:v', 'libxvid', '-vtag', 'xvid', '-qscale:v', '4']
    case 'h265':
    default: {
      const lib = codec === 'h265' ? 'libx265' : 'libx264'
      const base = ['-c:v', lib, '-preset', 'medium', '-crf', '23']
      return ext === 'ts' ? base : [...base, '-pix_fmt', 'yuv420p']
    }
  }
}

function getAudioArgs(audioCodec: string, audioBitrate: string): string[] {
  if (audioCodec === 'none') return ['-an']
  if (audioCodec === 'copy') return ['-c:a', 'copy']
  if (audioCodec === 'mp3') return ['-c:a', 'libmp3lame', '-b:a', audioBitrate]
  if (audioCodec === 'opus') return ['-c:a', 'libopus', '-b:a', audioBitrate]
  return ['-c:a', 'aac', '-b:a', audioBitrate]
}

export interface ConvertOptions extends ConversionSettings {
  source: SourceFile
}

export function buildFFmpegArgs(opts: ConvertOptions): {
  args: string[]
  outputPath: string
} {
  const fmt = VIDEO_OUTPUT_FORMATS.find((f) => f.value === opts.outputFormat)
  if (!fmt) throw new Error('Unknown format')

  const ext = fmt.ext
  const codec = fmt.codec
  const baseName = opts.source.fileName.replace(/\.[^.]+$/, '')
  const outputPath = opts.outputDir
    ? `${opts.outputDir}/${baseName}.${ext}`
    : opts.source.filePath.replace(/\.[^.]+$/, `.${ext}`)

  const args = ['-i', opts.source.filePath]

  if (ext === 'gif') {
    args.push(
      '-vf',
      'fps=15,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
      '-loop',
      '0',
    )
  } else {
    const codecArgs = getVideoCodecArgs(codec, ext)
    const presetIdx = codecArgs.indexOf('-preset')
    if (presetIdx !== -1) {
      codecArgs[presetIdx + 1] = opts.preset
    }
    const crfIdx = codecArgs.indexOf('-crf')
    if (crfIdx !== -1) {
      codecArgs[crfIdx + 1] = String(opts.crf)
    }
    args.push(...codecArgs)
    args.push(...getAudioArgs(opts.audioCodec, opts.audioBitrate))
  }

  if (ext === 'mp4' || ext === 'm4v') {
    args.push('-movflags', '+faststart')
  }

  args.push('-y', outputPath)
  return { args, outputPath }
}
