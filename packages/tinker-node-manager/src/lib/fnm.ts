import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import compact from 'licia/compact'
import contain from 'licia/contain'
import filter from 'licia/filter'
import map from 'licia/map'
import stripAnsi from 'licia/stripAnsi'
import trim from 'licia/trim'
import type { INodeVersion, IRemoteVersion } from '../common/types'

const execFileAsync = promisify(execFile)

const fnmPath = require('fnm-static') as string | null

export function getFnmBinaryPath() {
  if (!fnmPath) {
    throw new Error('fnm binary not found for this platform')
  }
  return fnmPath
}

async function runFnm(
  args: string[],
  opts?: { timeout?: number },
): Promise<{ stdout: string; stderr: string }> {
  const bin = getFnmBinaryPath()
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      timeout: opts?.timeout ?? 0,
      env: process.env,
    })
    return { stdout: stdout || '', stderr: stderr || '' }
  } catch (err) {
    const error = err as Error & { stdout?: string; stderr?: string }
    const detail = trim(
      stripAnsi(error.stderr || error.stdout || error.message || ''),
    )
    throw new Error(detail || 'fnm command failed')
  }
}

function parseVersionLine(line: string): INodeVersion | null {
  const body = trim(stripAnsi(line).replace(/^\*\s+/, ''))
  if (!body) return null

  const match = body.match(/^(\S+)(?:\s+(.*))?$/)
  if (!match) return null

  const version = match[1]
  const aliases = match[2]
    ? compact(map(match[2].split(','), (part) => trim(part)))
    : []

  return {
    id: version,
    version,
    aliases,
    isDefault: contain(aliases, 'default'),
    isSystem: version === 'system',
  }
}

export async function listVersions(): Promise<INodeVersion[]> {
  const { stdout } = await runFnm(['list', '--log-level', 'quiet'])
  return filter(
    map(stdout.split('\n'), (line) => parseVersionLine(line)),
    (item): item is INodeVersion => item !== null,
  )
}

export async function installVersion(version: string): Promise<void> {
  const target = trim(version)
  if (!target) throw new Error('Version is required')

  const args = ['install', '--progress', 'never', '--log-level', 'info']
  if (target === 'lts') {
    args.push('--lts')
  } else if (target === 'latest') {
    args.push('--latest')
  } else {
    args.push(target)
  }

  await runFnm(args, { timeout: 10 * 60 * 1000 })
}

export async function uninstallVersion(version: string): Promise<void> {
  const target = trim(version)
  if (!target) throw new Error('Version is required')
  if (target === 'system') throw new Error('Cannot uninstall system Node')
  await runFnm(['uninstall', target, '--log-level', 'info'])
}

export async function setDefaultVersion(version: string): Promise<void> {
  const target = trim(version)
  if (!target) throw new Error('Version is required')
  if (target === 'system')
    throw new Error('Cannot set system as default via fnm')
  await runFnm(['default', target, '--log-level', 'info'])
}

function parseRemoteLine(line: string): IRemoteVersion | null {
  const body = trim(stripAnsi(line))
  if (!body) return null

  const match = body.match(/^(\S+)(?:\s+\(([^)]+)\))?$/)
  if (!match) return null

  const version = match[1]
  return {
    id: version,
    version,
    lts: match[2] ? trim(match[2]) : null,
  }
}

export async function listRemoteVersions(opts?: {
  ltsOnly?: boolean
}): Promise<IRemoteVersion[]> {
  const args = ['list-remote', '--sort', 'desc', '--log-level', 'quiet']
  if (opts?.ltsOnly) args.splice(1, 0, '--lts')

  const { stdout } = await runFnm(args)
  return filter(
    map(stdout.split('\n'), (line) => parseRemoteLine(line)),
    (item): item is IRemoteVersion => item !== null,
  )
}
