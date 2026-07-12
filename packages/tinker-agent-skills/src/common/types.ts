export interface AgentDef {
  id: string
  name: string
  /** Path relative to home directory */
  configDir: string
  altConfigDirs?: string[]
}

/** Agents that can receive symlinks from ~/.agents/skills */
export const LINKABLE_AGENTS: AgentDef[] = [
  { id: 'codebuddy', name: 'CodeBuddy', configDir: '.codebuddy' },
  { id: 'claude', name: 'Claude', configDir: '.claude' },
  { id: 'codex', name: 'Codex', configDir: '.codex' },
  {
    id: 'opencode',
    name: 'OpenCode',
    configDir: '.config/opencode',
    altConfigDirs: ['.opencode'],
  },
]

export interface SkillAgentLink {
  id: string
  name: string
  skillsDir: string
  detected: boolean
  enabled: boolean
}

export interface SkillInfo {
  name: string
  description: string
  path: string
  /** Folder name under ~/.agents/skills */
  folderName: string
  agents: SkillAgentLink[]
}

export interface MarketplaceSkill {
  id: string
  slug: string
  name: string
  description: string
  author: string
  installCount: number | null
  version: string
  installed: boolean
}

export interface MarketplaceSearchResult {
  skills: MarketplaceSkill[]
  nextCursor: string | null
  hasMore: boolean
}

export interface RepoSkillCandidate {
  id: string
  name: string
  description: string
  folderName: string
}
