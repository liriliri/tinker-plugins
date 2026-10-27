import lowerCase from 'licia/lowerCase'
import splitPath from 'licia/splitPath'

const TEXT_EXTENSIONS = new Set([
  'js',
  'cjs',
  'mjs',
  'json',
  'html',
  'htm',
  'css',
  'txt',
  'md',
  'xml',
  'map',
  'ts',
  'tsx',
  'jsx',
  'less',
  'scss',
  'sass',
  'yaml',
  'yml',
  'vue',
  'log',
  'csv',
  'svg',
  'plist',
])

export function getExtension(path: string): string {
  const ext = splitPath(path).ext
  return ext ? lowerCase(ext.slice(1)) : ''
}

export function isTextExtension(ext: string): boolean {
  return TEXT_EXTENSIONS.has(ext)
}

const MONACO_LANGUAGE: Record<string, string> = {
  js: 'javascript',
  cjs: 'javascript',
  mjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  map: 'json',
  xml: 'xml',
  html: 'html',
  htm: 'html',
  svg: 'xml',
  css: 'css',
  scss: 'scss',
  less: 'less',
  sass: 'scss',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  vue: 'html',
  txt: 'plaintext',
  log: 'plaintext',
  csv: 'plaintext',
  plist: 'xml',
}

export function getMonacoLanguage(ext: string): string {
  return MONACO_LANGUAGE[ext] ?? 'plaintext'
}

const FILE_ACCENT: Record<string, string> = {
  js: '--as-file-js',
  cjs: '--as-file-js',
  mjs: '--as-file-js',
  jsx: '--as-file-js',
  ts: '--as-file-js',
  tsx: '--as-file-js',
  json: '--as-file-json',
  map: '--as-file-json',
  xml: '--as-file-html',
  html: '--as-file-html',
  htm: '--as-file-html',
  svg: '--as-file-html',
  css: '--as-file-css',
  scss: '--as-file-css',
  less: '--as-file-css',
}

export function getFileAccentVar(ext: string): string {
  return FILE_ACCENT[ext] ?? '--as-ink-faint'
}

export function isProbablyText(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 512))
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i]
    if (byte === 0) {
      return false
    }
    if (byte < 9 || (byte > 13 && byte < 32)) {
      return false
    }
  }
  return true
}
