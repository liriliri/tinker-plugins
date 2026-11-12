import fs from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import contain from 'licia/contain'
import endWith from 'licia/endWith'
import rtrim from 'licia/rtrim'
import type { IShellSetupPreview, IShellSetupResult } from '../common/types'
import { getFnmBinaryPath } from './fnm'

const BEGIN = '# >>> tinker-node-manager >>>'
const END = '# <<< tinker-node-manager <<<'
const STABLE_DIR = path.join(homedir(), '.tinker', 'tinker-node-manager', 'bin')

function shellName(shellPath: string) {
  const base = path.basename(shellPath).toLowerCase()
  if (contain(base, 'zsh')) return 'zsh'
  if (contain(base, 'bash')) return 'bash'
  if (contain(base, 'fish')) return 'fish'
  return base || 'sh'
}

function resolveRcPath(shell: string, home: string) {
  if (shell === 'zsh') return path.join(home, '.zshrc')
  if (shell === 'fish') return path.join(home, '.config', 'fish', 'config.fish')
  if (shell === 'bash') {
    return path.join(home, '.bashrc')
  }
  return path.join(home, '.profile')
}

function buildInitBlock(shell: string, fnmBin: string) {
  const quoted = JSON.stringify(fnmBin)
  const body =
    shell === 'fish'
      ? `${quoted} env --shell fish | source`
      : `eval "$(${quoted} env)"`
  return `${BEGIN}\n${body}\n${END}`
}

function upsertBlock(content: string, block: string) {
  const start = content.indexOf(BEGIN)
  const end = content.indexOf(END)
  if (start !== -1 && end !== -1 && end > start) {
    const before = content.slice(0, start)
    const after = content.slice(end + END.length).replace(/^\n/, '')
    const merged = `${before}${block}\n${after}`
    return endWith(merged, '\n') ? merged : `${merged}\n`
  }
  const base = rtrim(content)
  if (!base) return `${block}\n`
  return `${base}\n\n${block}\n`
}

async function installStableFnm(source: string) {
  await fs.mkdir(STABLE_DIR, { recursive: true })
  const target = path.join(
    STABLE_DIR,
    process.platform === 'win32' ? 'fnm.exe' : 'fnm',
  )
  try {
    await fs.unlink(target)
  } catch {
    // missing is fine
  }
  try {
    await fs.symlink(source, target)
  } catch {
    await fs.copyFile(source, target)
    await fs.chmod(target, 0o755)
  }
  return target
}

export function getShellSetupPreview(): IShellSetupPreview {
  const home = homedir()
  const shell = shellName(process.env.SHELL || '/bin/zsh')
  return {
    shell,
    rcPath: resolveRcPath(shell, home),
  }
}

export async function setupShellEnv(): Promise<IShellSetupResult> {
  const source = getFnmBinaryPath()
  const preview = getShellSetupPreview()
  const fnmPath = await installStableFnm(source)
  const block = buildInitBlock(preview.shell, fnmPath)

  if (preview.shell === 'fish') {
    await fs.mkdir(path.dirname(preview.rcPath), { recursive: true })
  }

  let existing = ''
  try {
    existing = await fs.readFile(preview.rcPath, 'utf8')
  } catch {
    existing = ''
  }

  await fs.writeFile(preview.rcPath, upsertBlock(existing, block), 'utf8')

  return {
    ...preview,
    fnmPath,
  }
}
