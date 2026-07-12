import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import AdmZip from 'adm-zip'
import endWith from 'licia/endWith'
import filter from 'licia/filter'
import lowerCase from 'licia/lowerCase'
import startWith from 'licia/startWith'
import { assertValidSkillDir } from './parseSkillMd'
import { sanitizeFolderName } from './sanitizeFolderName'
import { AGENTS_SKILLS_DIR, materializeToAgents } from './syncSkills'

async function folderNameForInstall(
  skillDir: string,
  options: { preferBasename: boolean; fallback: string },
): Promise<string> {
  const meta = await assertValidSkillDir(skillDir)
  if (options.preferBasename) {
    const fromDir = sanitizeFolderName(path.basename(skillDir))
    if (fromDir) return fromDir
  }
  const fromMeta = sanitizeFolderName(meta.name)
  if (fromMeta) return fromMeta
  const fromFallback = sanitizeFolderName(options.fallback)
  if (fromFallback) return fromFallback
  throw new Error('errInvalidSkillMd')
}

async function findSkillRoot(extractRoot: string): Promise<string> {
  try {
    await assertValidSkillDir(extractRoot)
    return extractRoot
  } catch {
    // look one level down
  }

  const entries = await fs.readdir(extractRoot, { withFileTypes: true })
  const dirs = filter(
    entries,
    (entry: { isDirectory(): boolean; name: string }) =>
      entry.isDirectory() &&
      !startWith(entry.name, '.') &&
      entry.name !== '__MACOSX',
  )

  const candidates: string[] = []
  for (const dir of dirs) {
    const full = path.join(extractRoot, dir.name)
    try {
      await assertValidSkillDir(full)
      candidates.push(full)
    } catch {
      // not a skill dir
    }
  }

  if (candidates.length === 1) return candidates[0]
  if (candidates.length > 1) throw new Error('errAmbiguousZip')
  throw new Error('errNoSkillMd')
}

async function installFromDir(
  sourceDir: string,
): Promise<{ folderName: string }> {
  const folderName = await folderNameForInstall(sourceDir, {
    preferBasename: true,
    fallback: path.basename(sourceDir),
  })
  await fs.mkdir(AGENTS_SKILLS_DIR, { recursive: true })
  await materializeToAgents(folderName, sourceDir)
  return { folderName }
}

async function installFromZip(
  zipPath: string,
): Promise<{ folderName: string }> {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tinker-skill-'))
  try {
    const zip = new AdmZip(zipPath)
    zip.extractAllTo(tmpRoot, true)
    const skillRoot = await findSkillRoot(tmpRoot)
    const atRoot = path.resolve(skillRoot) === path.resolve(tmpRoot)
    const folderName = await folderNameForInstall(skillRoot, {
      preferBasename: !atRoot,
      fallback: path.basename(zipPath, path.extname(zipPath)),
    })
    await fs.mkdir(AGENTS_SKILLS_DIR, { recursive: true })
    await materializeToAgents(folderName, skillRoot)
    return { folderName }
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => {})
  }
}

export async function installSkillFromPath(
  sourcePath: string,
): Promise<{ folderName: string }> {
  let stats
  try {
    stats = await fs.stat(sourcePath)
  } catch {
    throw new Error('errSourceMissing')
  }

  if (stats.isDirectory()) {
    return installFromDir(sourcePath)
  }

  if (stats.isFile() && endWith(lowerCase(sourcePath), '.zip')) {
    return installFromZip(sourcePath)
  }

  throw new Error('errUnsupportedSource')
}
