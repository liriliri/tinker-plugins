import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { LINKABLE_AGENTS } from '../common/types'
import type { AgentDef, SkillAgentLink } from '../common/types'
import {
  ensureSymlink,
  isLinkToTarget,
  isSymlink,
  pathExists,
  removePath,
} from './syncSkills'

async function resolveConfigDir(agent: AgentDef): Promise<string | null> {
  const home = os.homedir()
  const candidates = [agent.configDir, ...(agent.altConfigDirs ?? [])]
  for (const dir of candidates) {
    const full = path.join(home, dir)
    if (await pathExists(full)) return full
  }
  return null
}

export async function resolveAgentSkillsDir(
  agent: AgentDef,
): Promise<{ configDir: string; skillsDir: string; detected: boolean }> {
  const home = os.homedir()
  const existing = await resolveConfigDir(agent)
  if (existing) {
    return {
      configDir: existing,
      skillsDir: path.join(existing, 'skills'),
      detected: true,
    }
  }
  const configDir = path.join(home, agent.configDir)
  return {
    configDir,
    skillsDir: path.join(configDir, 'skills'),
    detected: false,
  }
}

export async function getSkillAgentLinks(
  skillPath: string,
): Promise<SkillAgentLink[]> {
  const folderName = path.basename(skillPath)
  const canonical = await fs.realpath(skillPath).catch(() => skillPath)

  const links: SkillAgentLink[] = []
  for (const agent of LINKABLE_AGENTS) {
    const { skillsDir, detected } = await resolveAgentSkillsDir(agent)
    const linkPath = path.join(skillsDir, folderName)
    const enabled = await isLinkToTarget(linkPath, canonical)
    links.push({
      id: agent.id,
      name: agent.name,
      skillsDir,
      detected: detected || enabled,
      enabled,
    })
  }
  return links
}

export async function setSkillAgentLink(
  skillPath: string,
  agentId: string,
  enabled: boolean,
): Promise<SkillAgentLink[]> {
  const agent = LINKABLE_AGENTS.find((item) => item.id === agentId)
  if (!agent) throw new Error(`Unknown agent: ${agentId}`)

  const folderName = path.basename(skillPath)
  const canonical = await fs.realpath(skillPath).catch(() => skillPath)
  const { skillsDir } = await resolveAgentSkillsDir(agent)
  const linkPath = path.join(skillsDir, folderName)

  if (enabled) {
    await ensureSymlink(canonical, linkPath)
  } else if (await isSymlink(linkPath)) {
    if (await isLinkToTarget(linkPath, canonical)) {
      await removePath(linkPath)
    }
  }

  return getSkillAgentLinks(skillPath)
}

export async function removeSkillAgentLinks(skillPath: string): Promise<void> {
  const folderName = path.basename(skillPath)
  const canonical = await fs.realpath(skillPath).catch(() => skillPath)

  for (const agent of LINKABLE_AGENTS) {
    const { skillsDir } = await resolveAgentSkillsDir(agent)
    const linkPath = path.join(skillsDir, folderName)
    if (
      (await isSymlink(linkPath)) &&
      (await isLinkToTarget(linkPath, canonical))
    ) {
      await removePath(linkPath)
    }
  }
}
