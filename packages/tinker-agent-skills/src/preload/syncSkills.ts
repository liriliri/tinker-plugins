import type { Dirent } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const HOME = os.homedir()
const AGENTS_SKILLS_DIR = path.join(HOME, '.agents', 'skills')
const CODEBUDDY_ROOT = path.join(HOME, '.codebuddy')
const CODEBUDDY_SKILLS_DIR = path.join(CODEBUDDY_ROOT, 'skills')
const SKILLS_MANAGER_DIR = path.join(HOME, '.skills-manager', 'skills')

export async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

export async function isSymlink(target: string): Promise<boolean> {
  try {
    return (await fs.lstat(target)).isSymbolicLink()
  } catch {
    return false
  }
}

export async function isRealDirectory(target: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(target)
    return stats.isDirectory() && !stats.isSymbolicLink()
  } catch {
    return false
  }
}

export async function removePath(target: string): Promise<void> {
  const stats = await fs.lstat(target)
  if (stats.isDirectory() && !stats.isSymbolicLink()) {
    await fs.rm(target, { recursive: true, force: true })
  } else {
    await fs.rm(target, { force: true })
  }
}

async function hasSkillMdAt(dir: string): Promise<boolean> {
  try {
    const stats = await fs.stat(path.join(dir, 'SKILL.md'))
    return stats.isFile()
  } catch {
    return false
  }
}

/** Resolve a usable content directory for a skill entry (handles broken symlinks). */
async function resolveContentDir(
  skillDir: string,
  name: string,
): Promise<string | null> {
  if (await hasSkillMdAt(skillDir)) {
    try {
      return await fs.realpath(skillDir)
    } catch {
      return skillDir
    }
  }

  if (await isSymlink(skillDir)) {
    try {
      const link = await fs.readlink(skillDir)
      const target = path.resolve(path.dirname(skillDir), link)
      if (await hasSkillMdAt(target)) return target
    } catch {
      // continue to fallbacks
    }
  }

  const fallbacks = [
    path.join(AGENTS_SKILLS_DIR, name),
    path.join(SKILLS_MANAGER_DIR, name),
  ]
  for (const fallback of fallbacks) {
    if (fallback === skillDir) continue
    if (await hasSkillMdAt(fallback)) return fallback
  }

  return null
}

async function collectSkillSources(
  rootDir: string,
  discovered: Map<string, string>,
): Promise<void> {
  let entries: Dirent[]
  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const skillDir = path.join(rootDir, entry.name)

    const isCandidate =
      entry.isDirectory() ||
      entry.isSymbolicLink() ||
      (await isSymlink(skillDir))
    if (!isCandidate) continue

    const contentDir = await resolveContentDir(skillDir, entry.name)
    if (!contentDir) continue

    if (!discovered.has(entry.name)) {
      discovered.set(entry.name, contentDir)
    }
  }
}

export async function materializeToAgents(
  name: string,
  contentSource: string,
): Promise<string> {
  const dest = path.join(AGENTS_SKILLS_DIR, name)

  if (await isRealDirectory(dest)) {
    if (await hasSkillMdAt(dest)) return dest
  }

  let source = contentSource
  try {
    source = await fs.realpath(contentSource)
  } catch {
    // keep contentSource
  }

  if (!(await hasSkillMdAt(source))) {
    throw new Error(`Skill content not found: ${source}`)
  }

  // Same real directory — already canonical
  try {
    if (
      (await isRealDirectory(dest)) &&
      (await fs.realpath(dest)) === (await fs.realpath(source))
    ) {
      return dest
    }
  } catch {
    // continue copy
  }

  const tmp = path.join(AGENTS_SKILLS_DIR, `.tmp-${name}-${Date.now()}`)
  try {
    await fs.cp(source, tmp, { recursive: true, dereference: true })

    if ((await pathExists(dest)) || (await isSymlink(dest))) {
      // Never delete source while it still is the only copy
      const destReal = await fs.realpath(dest).catch(() => dest)
      const tmpReal = await fs.realpath(tmp)
      if (destReal === (await fs.realpath(source).catch(() => source))) {
        // source lives at dest; tmp already has the copy
      }
      if (destReal !== tmpReal) {
        await removePath(dest)
      }
    }

    await fs.rename(tmp, dest)
  } catch (err) {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {})
    throw err
  }

  return dest
}

export async function ensureSymlink(
  target: string,
  linkPath: string,
): Promise<void> {
  const absoluteTarget = path.resolve(target)

  if (path.resolve(linkPath) === absoluteTarget) return

  try {
    if ((await fs.realpath(linkPath)) === (await fs.realpath(absoluteTarget))) {
      return
    }
  } catch {
    // continue
  }

  if (await isSymlink(linkPath)) {
    try {
      const current = await fs.readlink(linkPath)
      const resolved = path.resolve(path.dirname(linkPath), current)
      const [realCurrent, realTarget] = await Promise.all([
        fs.realpath(resolved).catch(() => resolved),
        fs.realpath(absoluteTarget).catch(() => absoluteTarget),
      ])
      if (realCurrent === realTarget) return
    } catch {
      // recreate below
    }
    await removePath(linkPath)
  } else if (await pathExists(linkPath)) {
    await removePath(linkPath)
  }

  await fs.mkdir(path.dirname(linkPath), { recursive: true })

  if (process.platform === 'win32') {
    await fs.symlink(absoluteTarget, linkPath, 'junction')
  } else {
    await fs.symlink(absoluteTarget, linkPath)
  }
}

export async function isLinkToTarget(
  linkPath: string,
  target: string,
): Promise<boolean> {
  if (!(await isSymlink(linkPath))) return false
  try {
    const current = await fs.readlink(linkPath)
    const resolved = path.resolve(path.dirname(linkPath), current)
    const [realCurrent, realTarget] = await Promise.all([
      fs.realpath(resolved).catch(() => resolved),
      fs.realpath(target).catch(() => path.resolve(target)),
    ])
    return realCurrent === realTarget
  } catch {
    return false
  }
}

/** Copy skills into ~/.agents/skills; restore CodeBuddy links only when already present. */
export async function syncSkillsToAgents(): Promise<void> {
  await fs.mkdir(AGENTS_SKILLS_DIR, { recursive: true })

  const fromAgents = new Map<string, string>()
  const fromCodebuddy = new Map<string, string>()
  await collectSkillSources(AGENTS_SKILLS_DIR, fromAgents)
  await collectSkillSources(CODEBUDDY_SKILLS_DIR, fromCodebuddy)

  const codebuddyInstalled = await pathExists(CODEBUDDY_ROOT)
  if (codebuddyInstalled) {
    await fs.mkdir(CODEBUDDY_SKILLS_DIR, { recursive: true })
  }

  const names = new Set([...fromAgents.keys(), ...fromCodebuddy.keys()])

  for (const name of names) {
    try {
      const contentSource = fromAgents.get(name) || fromCodebuddy.get(name)!
      const canonical = await materializeToAgents(name, contentSource)
      if (
        codebuddyInstalled &&
        (fromCodebuddy.has(name) ||
          (await isSymlink(path.join(CODEBUDDY_SKILLS_DIR, name))))
      ) {
        await ensureSymlink(canonical, path.join(CODEBUDDY_SKILLS_DIR, name))
      }
    } catch (err) {
      console.error(`Failed to sync skill "${name}":`, err)
    }
  }
}

export { AGENTS_SKILLS_DIR, CODEBUDDY_SKILLS_DIR }
