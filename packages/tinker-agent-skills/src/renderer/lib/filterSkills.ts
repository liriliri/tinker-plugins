import contain from 'licia/contain'
import filter from 'licia/filter'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import trim from 'licia/trim'
import type { SkillInfo } from '../../common/types'

export function filterSkills(skills: SkillInfo[], query: string): SkillInfo[] {
  const q = lowerCase(trim(query))
  if (!q) return skills

  return filter(skills, (skill) => {
    const agentText = map(
      filter(skill.agents, (agent) => agent.enabled),
      (agent) => agent.name,
    ).join(' ')
    const haystack = lowerCase(
      [skill.name, skill.description, skill.path, agentText].join(' '),
    )
    return contain(haystack, q)
  })
}
