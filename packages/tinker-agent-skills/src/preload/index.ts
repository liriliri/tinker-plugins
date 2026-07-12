import { contextBridge } from 'electron'
import type { Dirent } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import type { SkillInfo } from '../common/types'
import {
  getSkillAgentLinks,
  removeSkillAgentLinks,
  setSkillAgentLink,
} from './agents'
import {
  cancelRepoSession,
  installRepoSkills,
  resolveRepoSkills,
} from './installFromRepo'
import { installSkillFromPath } from './installSkill'
import { installMarketplaceSkill, searchMarketplace } from './marketplace'
import { parseFrontmatter } from './parseSkillMd'
import { AGENTS_SKILLS_DIR, removePath, syncSkillsToAgents } from './syncSkills'

async function isDirOrSymlinkToDir(
  entry: { isDirectory(): boolean; isSymbolicLink(): boolean },
  entryPath: string,
): Promise<boolean> {
  if (entry.isDirectory()) return true
  if (!entry.isSymbolicLink()) return false
  try {
    return (await fs.stat(entryPath)).isDirectory()
  } catch {
    return false
  }
}

async function listCanonicalSkills(): Promise<SkillInfo[]> {
  let entries: Dirent[]
  try {
    entries = await fs.readdir(AGENTS_SKILLS_DIR, { withFileTypes: true })
  } catch {
    return []
  }

  const skills: SkillInfo[] = []

  for (const entry of entries) {
    if (startWith(entry.name, '.')) continue
    const skillDir = path.join(AGENTS_SKILLS_DIR, entry.name)
    if (!(await isDirOrSymlinkToDir(entry, skillDir))) continue

    let content: string
    try {
      content = await fs.readFile(path.join(skillDir, 'SKILL.md'), 'utf-8')
    } catch {
      continue
    }

    const meta = parseFrontmatter(content)
    const agents = await getSkillAgentLinks(skillDir)
    skills.push({
      name: trim(meta.name || '') || entry.name,
      description: trim(meta.description || ''),
      path: skillDir,
      folderName: entry.name,
      agents,
    })
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

const agentSkillsObj = {
  async listSkills(): Promise<SkillInfo[]> {
    await syncSkillsToAgents()
    return listCanonicalSkills()
  },

  getSkillAgents: (skillPath: string) => getSkillAgentLinks(skillPath),

  setSkillAgent: (skillPath: string, agentId: string, enabled: boolean) =>
    setSkillAgentLink(skillPath, agentId, enabled),

  installSkill: (sourcePath: string) => installSkillFromPath(sourcePath),

  searchMarketplace: (query: string, cursor?: string | null) =>
    searchMarketplace(query, cursor),

  installMarketplaceSkill: (skill: {
    slug: string
    name: string
    author?: string
    version?: string
  }) => installMarketplaceSkill(skill),

  resolveRepoSkills: (source: string) => resolveRepoSkills(source),

  installRepoSkills: (sessionId: string, skillIds: string[]) =>
    installRepoSkills(sessionId, skillIds),

  cancelRepoSession: (sessionId: string) => cancelRepoSession(sessionId),

  async deleteSkill(skillPath: string): Promise<void> {
    const resolved = path.resolve(skillPath)
    const root = path.resolve(AGENTS_SKILLS_DIR)
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new Error('errDeleteForbidden')
    }
    if (startWith(path.basename(resolved), '.')) {
      throw new Error('errDeleteForbidden')
    }
    await removeSkillAgentLinks(resolved)
    await removePath(resolved)
  },
}

contextBridge.exposeInMainWorld('agentSkills', agentSkillsObj)

declare global {
  const agentSkills: typeof agentSkillsObj
}
