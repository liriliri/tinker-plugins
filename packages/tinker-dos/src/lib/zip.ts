import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate'
import endWith from 'licia/endWith'
import lowerCase from 'licia/lowerCase'
import splitPath from 'licia/splitPath'
import contain from 'licia/contain'
import trim from 'licia/trim'

const RUNNABLE_EXTS = ['.exe', '.com', '.bat']

const SKIP_BASE_NAMES = [
  'install',
  'setup',
  'uninstall',
  'uninstal',
  'config',
  'configure',
  'js3',
  'joymouse',
  'ctmouse',
  'mouse',
  'himem',
  'emm386',
  'smartdrv',
  'doskey',
  'sdlpal',
]

/** Characters that break DOSBox -c / command parsing. */
const UNSAFE_NAME_RE = /[!$&*()\[\]{}<>|`^=;,'"]/

function isRunnable(name: string) {
  const lower = lowerCase(name)
  return RUNNABLE_EXTS.some((ext) => endWith(lower, ext))
}

function baseName(path: string) {
  const parts = path.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || path
}

function dirName(path: string) {
  const normalized = path.replace(/\\/g, '/')
  const idx = normalized.lastIndexOf('/')
  return idx === -1 ? '' : normalized.slice(0, idx + 1)
}

function stem(name: string) {
  return lowerCase(baseName(name).replace(/\.[^.]+$/, ''))
}

function depth(path: string) {
  return path.replace(/\\/g, '/').split('/').filter(Boolean).length
}

function isSkippedUtility(name: string) {
  return contain(SKIP_BASE_NAMES, stem(name))
}

function hasUnsafeName(name: string) {
  return UNSAFE_NAME_RE.test(baseName(name))
}

function normalizeKey(name: string) {
  return lowerCase(name.replace(/\\/g, '/'))
}

/** PAL!.EXE → PAL_.EXE (keep cracked bytes under a DOSBox-safe name). */
function toSafeFileName(name: string) {
  return baseName(name).replace(UNSAFE_NAME_RE, '_')
}

function fileIndex(files: Record<string, Uint8Array>) {
  const index = new Map<string, string>()
  for (const path of Object.keys(files)) {
    if (path.endsWith('/')) continue
    index.set(normalizeKey(path), path)
    index.set(normalizeKey(baseName(path)), path)
  }
  return index
}

function resolveInZip(
  index: Map<string, string>,
  command: string,
): string | null {
  const raw = baseName(trim(command).split(/\s+/)[0] || '')
  if (!raw || !isRunnable(raw)) return null

  // Prefer the exact autoexec target (e.g. cracked PAL!.EXE), not a same-stem original.
  const exact = index.get(normalizeKey(raw))
  if (exact) return exact

  const sanitized = raw.replace(UNSAFE_NAME_RE, '')
  if (sanitized && sanitized !== raw) {
    const safe = index.get(normalizeKey(sanitized))
    if (safe) return safe
  }

  return null
}

function parseAutoexecCommands(conf: string): string[] {
  const match = conf.match(/\[autoexec\]([\s\S]*?)(?=\n\[|$)/i)
  if (!match) return []
  return match[1]
    .split(/\r?\n/)
    .map((line) => trim(line.replace(/^\s*@/, '')))
    .filter((line) => {
      if (!line) return false
      const lower = lowerCase(line)
      if (lower.startsWith('rem ')) return false
      if (lower === 'echo off' || lower === 'echo on') return false
      if (lower.startsWith('mount ')) return false
      if (lower.startsWith('imgmount ')) return false
      if (/^[a-z]:$/.test(lower)) return false
      if (lower.startsWith('cd ')) return false
      if (lower.startsWith('cls')) return false
      return true
    })
}

function findAutoexecExecutable(
  files: Record<string, Uint8Array>,
): string | null {
  const index = fileIndex(files)
  for (const path of Object.keys(files)) {
    if (!endWith(lowerCase(path), 'dosbox.conf')) continue
    const commands = parseAutoexecCommands(strFromU8(files[path]))
    for (let i = commands.length - 1; i >= 0; i--) {
      const resolved = resolveInZip(index, commands[i])
      if (resolved) return resolved.replace(/\//g, '\\')
    }
  }
  return null
}

function rankCandidate(name: string) {
  const isBat = endWith(lowerCase(name), '.bat')
  // Prefer cracked copies (PAL!.EXE) over original CD-check builds.
  const crackBonus = hasUnsafeName(name) ? -30 : 0
  const batPenalty = isBat ? 40 : 0
  const utilityPenalty = isSkippedUtility(name) ? 80 : 0
  return utilityPenalty + batPenalty + crackBonus + depth(name) * 10
}

/**
 * Copy an unsafe-named binary (e.g. PAL!.EXE) to a safe name (PAL_.EXE)
 * so DosBoxLoader.startExe / -c can launch it.
 */
function materializeSafeExecutable(
  files: Record<string, Uint8Array>,
  startExe: string,
): { files: Record<string, Uint8Array>; startExe: string; changed: boolean } {
  const path = startExe.replace(/\\/g, '/')
  if (!hasUnsafeName(path) || !files[path]) {
    return { files, startExe, changed: false }
  }

  const safeBase = toSafeFileName(path)
  let safePath = dirName(path) + safeBase
  const index = fileIndex(files)
  let n = 1
  while (
    index.has(normalizeKey(safePath)) &&
    index.get(normalizeKey(safePath)) !== path
  ) {
    const extMatch = safeBase.match(/(\.[^.]+)$/)
    const ext = extMatch ? extMatch[1] : ''
    const stemPart = ext ? safeBase.slice(0, -ext.length) : safeBase
    safePath = dirName(path) + `${stemPart}${n}${ext}`
    n += 1
  }

  const next = { ...files, [safePath]: files[path] }
  return {
    files: next,
    startExe: safePath.replace(/\//g, '\\'),
    changed: true,
  }
}

export function createShellZip(): Uint8Array {
  return zipSync({
    'START.BAT': strToU8('@ECHO OFF\r\n'),
  })
}

export function createProgramZip(
  fileName: string,
  data: Uint8Array,
): Uint8Array {
  const name = splitPath(fileName).name || fileName
  return zipSync({
    [name]: data,
  })
}

function findExecutableInZip(files: Record<string, Uint8Array>): string | null {
  const fromAutoexec = findAutoexecExecutable(files)
  if (fromAutoexec) return fromAutoexec

  const candidates = Object.keys(files).filter(
    (name) =>
      !name.endsWith('/') && isRunnable(name) && !isSkippedUtility(name),
  )
  if (candidates.length === 0) {
    const fallback = Object.keys(files).filter(
      (name) => !name.endsWith('/') && isRunnable(name),
    )
    if (fallback.length === 0) return null
    fallback.sort(
      (a, b) => rankCandidate(a) - rankCandidate(b) || a.localeCompare(b),
    )
    return fallback[0].replace(/\//g, '\\')
  }

  candidates.sort(
    (a, b) => rankCandidate(a) - rankCandidate(b) || a.localeCompare(b),
  )
  return candidates[0].replace(/\//g, '\\')
}

function clearAutoexec(conf: string) {
  if (!/\[autoexec\]/i.test(conf)) {
    return conf.replace(/\s*$/, '\n\n[autoexec]\necho off\n')
  }
  return conf.replace(
    /\[autoexec\][\s\S]*?(?=\n\[|$)/i,
    '[autoexec]\necho off\n',
  )
}

/**
 * Unpack a game zip, pick a launch executable, and strip jsdos/autoexec
 * so Emularity's startExe is not overridden by a broken command (e.g. PAL!.EXE).
 * Cracked names like PAL!.EXE are copied to PAL_.EXE for DOSBox -c.
 */
export function prepareGameZip(data: Uint8Array): {
  zipData: Uint8Array
  startExe: string
} | null {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(data)
  } catch {
    return null
  }

  let startExe = findExecutableInZip(files)
  if (!startExe) return null

  const materialized = materializeSafeExecutable(files, startExe)
  files = materialized.files
  startExe = materialized.startExe
  let changed = materialized.changed

  for (const path of Object.keys(files)) {
    if (!endWith(lowerCase(path), 'dosbox.conf')) continue
    const next = strToU8(clearAutoexec(strFromU8(files[path])))
    files[path] = next
    changed = true
  }

  return {
    zipData: changed ? zipSync(files) : data,
    startExe,
  }
}

export function isDosProgramName(name: string) {
  const lower = lowerCase(name)
  return (
    endWith(lower, '.zip') ||
    endWith(lower, '.exe') ||
    endWith(lower, '.com') ||
    endWith(lower, '.bat')
  )
}

export function isZipName(name: string) {
  return endWith(lowerCase(name), '.zip')
}
