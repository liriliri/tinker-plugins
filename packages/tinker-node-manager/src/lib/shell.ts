import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import contain from 'licia/contain'
import endWith from 'licia/endWith'
import isWindows from 'licia/isWindows'
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
  if (contain(base, 'pwsh') || contain(base, 'powershell')) return 'powershell'
  return base || 'sh'
}

function detectShell() {
  const fromEnv = process.env.SHELL || ''
  const name = shellName(fromEnv)
  if (isWindows) {
    if (name === 'bash' || name === 'zsh' || name === 'fish') return name
    return 'powershell'
  }
  return fromEnv ? name : 'zsh'
}

function resolvePowerShellProfile(home: string) {
  const docs = path.join(home, 'Documents')
  const pwsh = path.join(docs, 'PowerShell', 'Microsoft.PowerShell_profile.ps1')
  const winPs = path.join(
    docs,
    'WindowsPowerShell',
    'Microsoft.PowerShell_profile.ps1',
  )
  if (existsSync(winPs) && !existsSync(pwsh)) return winPs
  return pwsh
}

function resolveRcPath(shell: string, home: string) {
  if (shell === 'powershell') return resolvePowerShellProfile(home)
  if (shell === 'zsh') return path.join(home, '.zshrc')
  if (shell === 'fish') return path.join(home, '.config', 'fish', 'config.fish')
  if (shell === 'bash') return path.join(home, '.bashrc')
  return path.join(home, '.profile')
}

function quotePwsh(filePath: string) {
  return `'${filePath.replace(/'/g, "''")}'`
}

function buildInitBlock(shell: string, fnmBin: string) {
  let body: string
  if (shell === 'powershell') {
    body = `(& ${quotePwsh(fnmBin)} env --shell powershell) | Out-String | Invoke-Expression`
  } else if (shell === 'fish') {
    body = `${JSON.stringify(fnmBin)} env --shell fish | source`
  } else {
    body = `eval "$(${JSON.stringify(fnmBin)} env)"`
  }
  return `${BEGIN}\n${body}\n${END}`
}

function upsertBlock(content: string, block: string) {
  const start = content.indexOf(BEGIN)
  const end = content.indexOf(END)
  let next: string
  if (start !== -1 && end !== -1 && end > start) {
    const before = content.slice(0, start)
    const after = content.slice(end + END.length).replace(/^\n/, '')
    next = `${before}${block}\n${after}`
  } else {
    const base = rtrim(content)
    next = base ? `${base}\n\n${block}\n` : `${block}\n`
  }
  return endWith(next, '\n') ? next : `${next}\n`
}

async function installStableFnm(source: string) {
  await fs.mkdir(STABLE_DIR, { recursive: true })
  const target = path.join(STABLE_DIR, isWindows ? 'fnm.exe' : 'fnm')
  try {
    await fs.unlink(target)
  } catch {
    // missing is fine
  }
  try {
    await fs.symlink(source, target)
  } catch {
    await fs.copyFile(source, target)
    if (!isWindows) await fs.chmod(target, 0o755)
  }
  return target
}

export function getShellSetupPreview(): IShellSetupPreview {
  const home = homedir()
  const shell = detectShell()
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

  await fs.mkdir(path.dirname(preview.rcPath), { recursive: true })

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
