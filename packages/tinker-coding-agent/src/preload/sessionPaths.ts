import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

/** Root data directory for this plugin: ~/.tinker/tinker-coding-agent */
const AGENT_DIR = join(homedir(), '.tinker', 'tinker-coding-agent')

/**
 * pi-style session directory for a workspace:
 * ~/.tinker/tinker-coding-agent/sessions/--encoded-cwd--/
 */
export function getWorkspaceSessionDir(cwd: string): string {
  const resolvedCwd = resolve(cwd)
  const safePath = `--${resolvedCwd.replace(/^[/\\]/, '').replace(/[/\\:]/g, '-')}--`
  const dir = join(AGENT_DIR, 'sessions', safePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}
