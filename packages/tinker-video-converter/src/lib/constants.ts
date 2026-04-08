import type { VideoFormat } from '../types'

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

export const VIDEO_OUTPUT_FORMATS: VideoFormat[] = [
  { value: 'mp4-h264', ext: 'mp4', codec: 'h264', label: 'MP4 (H.264)' },
  { value: 'mp4-h265', ext: 'mp4', codec: 'h265', label: 'MP4 (H.265)' },
  { value: 'mp4-av1', ext: 'mp4', codec: 'av1', label: 'MP4 (AV1)' },
  { value: 'mkv-h264', ext: 'mkv', codec: 'h264', label: 'MKV (H.264)' },
  { value: 'mkv-h265', ext: 'mkv', codec: 'h265', label: 'MKV (H.265)' },
  { value: 'mkv-vp9', ext: 'mkv', codec: 'vp9', label: 'MKV (VP9)' },
  { value: 'mkv-av1', ext: 'mkv', codec: 'av1', label: 'MKV (AV1)' },
  { value: 'webm-vp9', ext: 'webm', codec: 'vp9', label: 'WebM (VP9)' },
  { value: 'webm-vp8', ext: 'webm', codec: 'vp8', label: 'WebM (VP8)' },
  { value: 'webm-av1', ext: 'webm', codec: 'av1', label: 'WebM (AV1)' },
  { value: 'mov-h264', ext: 'mov', codec: 'h264', label: 'MOV (H.264)' },
  { value: 'mov-h265', ext: 'mov', codec: 'h265', label: 'MOV (H.265)' },
  { value: 'mov-prores', ext: 'mov', codec: 'prores', label: 'MOV (ProRes)' },
  { value: 'avi-h264', ext: 'avi', codec: 'h264', label: 'AVI (H.264)' },
  { value: 'avi-xvid', ext: 'avi', codec: 'xvid', label: 'AVI (Xvid)' },
  { value: 'gif', ext: 'gif', codec: 'gif', label: 'GIF' },
]

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

export const AUDIO_CODECS: { value: string; label: string }[] = [
  { value: 'aac', label: 'AAC' },
  { value: 'mp3', label: 'MP3' },
  { value: 'opus', label: 'Opus' },
  { value: 'copy', label: 'Copy' },
  { value: 'none', label: 'None' },
]

export const AUDIO_BITRATES = ['64k', '96k', '128k', '192k', '256k', '320k']
