import type { SkillInfo } from '../common/types'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'install_from_github') {
      return installFromGithub(getStore(), args as { source: string })
    }
    if (name === 'list') {
      return listSkills(getStore(), args as { skill?: string })
    }
    if (name === 'link') {
      return linkSkill(
        getStore(),
        args as { skill: string; agent: string; enabled: boolean },
      )
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function installFromGithub(store: Store, args: { source: string }) {
  const trimmed = args.source.trim()
  if (!trimmed) throw new Error('errRepoInvalidSource')

  store.openRepoDialog()
  store.setRepoSource(trimmed)
  await store.resolveRepoSkills()
  assertRepoOk(store)

  if (store.repoSessionId) {
    await store.installRepoSkills()
    assertRepoOk(store)
  }

  return {
    source: trimmed,
    skills: store.skills.map(toSkillSummary),
  }
}

async function listSkills(store: Store, args: { skill?: string }) {
  await store.loadSkills()
  assertStoreOk(store)

  const filter = args.skill?.trim()
  const skills = filter ? [findSkill(store, filter)] : store.skills

  return {
    skills: skills.map(toSkillSummary),
  }
}

async function linkSkill(
  store: Store,
  args: { skill: string; agent: string; enabled: boolean },
) {
  if (store.skills.length === 0) {
    await store.loadSkills()
  }

  const skill = findSkill(store, args.skill)
  await store.openConfig(skill)
  await store.toggleSkillAgent(args.agent, args.enabled)
  assertStoreOk(store)

  const updated = store.skills.find((item) => item.path === skill.path) ?? skill
  const agents = store.configAgents
  store.closeConfig()

  return {
    skill: toSkillSummary(updated),
    agents,
  }
}

function findSkill(store: Store, query: string): SkillInfo {
  const q = query.trim()
  const skill = store.skills.find(
    (item) => item.folderName === q || item.name === q || item.path === q,
  )
  if (!skill) throw new Error(`Skill not found: ${query}`)
  return skill
}

function assertRepoOk(store: Store) {
  if (store.repoError) throw new Error(store.repoError)
}

function assertStoreOk(store: Store) {
  if (store.error) throw new Error(store.error)
}

function toSkillSummary(skill: SkillInfo) {
  return {
    name: skill.name,
    description: skill.description,
    folderName: skill.folderName,
    path: skill.path,
    agents: skill.agents,
  }
}
