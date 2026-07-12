import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import AdmZip from 'adm-zip'
import contain from 'licia/contain'
import filter from 'licia/filter'
import flatten from 'licia/flatten'
import kebabCase from 'licia/kebabCase'
import map from 'licia/map'
import startWith from 'licia/startWith'
import type { RepoSkillCandidate } from '../common/types'
import { assertValidSkillDir } from './parseSkillMd'
import { parseRepoSource } from './parseRepoSource'
import { sanitizeFolderName } from './sanitizeFolderName'
import { AGENTS_SKILLS_DIR, pathExists, removePath } from './syncSkills'

const USER_AGENT = 'tinker-agent-skills'
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '__pycache__',
  '__MACOSX',
])

interface RepoSession {
  rootDir: string
  skills: Array<RepoSkillCandidate & { dir: string }>
}

const sessions = new Map<string, RepoSession>()

async function downloadGithubZip(
  owner: string,
  repo: string,
  ref?: string,
): Promise<Buffer> {
  const refs = ref ? [ref] : ['main', 'master']
  let lastStatus = 0

  for (const branch of refs) {
    const url = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${encodeURIComponent(branch)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    })
    lastStatus = res.status
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer())
    }

    // Tag / commit SHA fallback when branch path fails
    if (ref) {
      const tagUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/tags/${encodeURIComponent(ref)}`
      const tagRes = await fetch(tagUrl, {
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      })
      if (tagRes.ok) {
        return Buffer.from(await tagRes.arrayBuffer())
      }
      const shaUrl = `https://codeload.github.com/${owner}/${repo}/zip/${encodeURIComponent(ref)}`
      const shaRes = await fetch(shaUrl, {
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      })
      if (shaRes.ok) {
        return Buffer.from(await shaRes.arrayBuffer())
      }
      break
    }
  }

  if (lastStatus === 404) throw new Error('errRepoNotFound')
  throw new Error('errRepoDownload')
}

async function findSkillDirs(
  dir: string,
  depth = 0,
  maxDepth = 5,
): Promise<string[]> {
  if (depth > maxDepth) return []

  try {
    await assertValidSkillDir(dir)
    return [dir]
  } catch {
    // keep searching
  }

  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const nested = await Promise.all(
    map(
      filter(
        entries,
        (entry: { isDirectory(): boolean; name: string }) =>
          entry.isDirectory() && !SKIP_DIRS.has(entry.name),
      ),
      (entry: { name: string }) =>
        findSkillDirs(path.join(dir, entry.name), depth + 1, maxDepth),
    ),
  )
  return flatten(nested)
}

async function resolveExtractRoot(tmpRoot: string): Promise<string> {
  const entries = await fs.readdir(tmpRoot, { withFileTypes: true })
  const dirs = filter(
    entries,
    (entry: { isDirectory(): boolean; name: string }) =>
      entry.isDirectory() &&
      !startWith(entry.name, '.') &&
      entry.name !== '__MACOSX',
  )
  if (dirs.length === 1) return path.join(tmpRoot, dirs[0].name)
  return tmpRoot
}

async function cleanupSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId)
  if (!session) return
  sessions.delete(sessionId)
  await fs.rm(session.rootDir, { recursive: true, force: true }).catch(() => {})
}

export async function resolveRepoSkills(source: string): Promise<{
  sessionId: string
  sourceLabel: string
  skills: RepoSkillCandidate[]
  targeted: boolean
}> {
  const parsed = parseRepoSource(source)
  const zip = await downloadGithubZip(parsed.owner, parsed.repo, parsed.ref)

  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tinker-repo-'))
  let committed = false
  try {
    new AdmZip(zip).extractAllTo(tmpRoot, true)
    const extractRoot = await resolveExtractRoot(tmpRoot)
    const searchRoot = parsed.subpath
      ? path.join(extractRoot, parsed.subpath)
      : extractRoot

    const skillDirs = await findSkillDirs(searchRoot)
    if (skillDirs.length === 0) {
      throw new Error(
        parsed.skillFilter || parsed.subpath
          ? 'errRepoSkillNotFound'
          : 'errNoSkillMd',
      )
    }

    const usedFolders = new Set<string>()
    const skills: Array<RepoSkillCandidate & { dir: string }> = []

    for (const dir of skillDirs) {
      const meta = await assertValidSkillDir(dir)
      if (
        parsed.skillFilter &&
        kebabCase(meta.name) !== kebabCase(parsed.skillFilter) &&
        kebabCase(path.basename(dir)) !== kebabCase(parsed.skillFilter)
      ) {
        continue
      }

      let folderName =
        sanitizeFolderName(path.basename(dir)) || sanitizeFolderName(meta.name)
      if (!folderName) continue

      if (usedFolders.has(folderName)) {
        const alt = sanitizeFolderName(meta.name)
        folderName =
          alt && !usedFolders.has(alt)
            ? alt
            : `${folderName}-${skills.length + 1}`
      }
      usedFolders.add(folderName)

      skills.push({
        id: folderName,
        name: meta.name,
        description: meta.description,
        folderName,
        dir,
      })
    }

    if (skills.length === 0) {
      throw new Error('errRepoSkillNotFound')
    }

    const sessionId = randomUUID()
    sessions.set(sessionId, { rootDir: tmpRoot, skills })
    committed = true

    const targeted = Boolean(parsed.skillFilter || parsed.subpath)
    const sourceLabel = parsed.skillFilter
      ? `${parsed.owner}/${parsed.repo}@${parsed.skillFilter}`
      : parsed.subpath
        ? `${parsed.owner}/${parsed.repo}/${parsed.subpath}`
        : `${parsed.owner}/${parsed.repo}`

    return {
      sessionId,
      sourceLabel,
      targeted,
      skills: map(skills, ({ id, name, description, folderName }) => ({
        id,
        name,
        description,
        folderName,
      })),
    }
  } catch (err) {
    if (!committed) {
      await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => {})
    }
    throw err
  }
}

export async function installRepoSkills(
  sessionId: string,
  skillIds: string[],
): Promise<{ folderNames: string[] }> {
  const session = sessions.get(sessionId)
  if (!session) throw new Error('errRepoSessionExpired')

  const toInstall = filter(session.skills, (skill) =>
    contain(skillIds, skill.id),
  )
  if (toInstall.length === 0) throw new Error('errRepoNoSelection')

  await fs.mkdir(AGENTS_SKILLS_DIR, { recursive: true })
  const folderNames: string[] = []

  for (const skill of toInstall) {
    const dest = path.join(AGENTS_SKILLS_DIR, skill.folderName)
    if (await pathExists(dest)) {
      await removePath(dest)
    }
    await fs.cp(skill.dir, dest, { recursive: true, dereference: true })
    folderNames.push(skill.folderName)
  }

  // Only drop the temp extract after a successful copy so the user can retry
  await cleanupSession(sessionId)
  return { folderNames }
}

export async function cancelRepoSession(sessionId: string): Promise<void> {
  await cleanupSession(sessionId)
}
