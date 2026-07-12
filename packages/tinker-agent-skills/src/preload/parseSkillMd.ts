import fs from 'node:fs/promises'
import path from 'node:path'
import endWith from 'licia/endWith'
import find from 'licia/find'
import lowerCase from 'licia/lowerCase'
import startWith from 'licia/startWith'
import trim from 'licia/trim'

function trimQuotes(value: string): string {
  if (
    (startWith(value, '"') && endWith(value, '"')) ||
    (startWith(value, "'") && endWith(value, "'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

export function parseFrontmatter(raw: string): {
  name?: string
  description?: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const block = match[1]
  const result: { name?: string; description?: string } = {}

  const nameMatch = block.match(/^name:\s*(.+)$/m)
  if (nameMatch) result.name = trimQuotes(trim(nameMatch[1]))

  const descLine = block.match(/^description:\s*(.*)$/m)
  if (descLine) {
    const value = trim(descLine[1])
    if (value === '|' || value === '>' || value === '>-' || value === '|-') {
      const lines = block.split(/\r?\n/)
      const start = lines.findIndex((line) => /^description:\s/.test(line))
      const parts: string[] = []
      for (let i = start + 1; i < lines.length; i++) {
        const line = lines[i]
        if (/^\S/.test(line)) break
        parts.push(line.replace(/^\s+/, ''))
      }
      result.description = trim(parts.join(' '))
    } else if (value) {
      result.description = trimQuotes(value)
    }
  }

  return result
}

async function findSkillMdPath(dir: string): Promise<string | null> {
  let entries: string[]
  try {
    entries = await fs.readdir(dir)
  } catch {
    return null
  }

  const match = find(entries, (name: string) => lowerCase(name) === 'skill.md')
  if (!match) return null

  const full = path.join(dir, match)
  try {
    const stats = await fs.stat(full)
    return stats.isFile() ? full : null
  } catch {
    return null
  }
}

function isValidSkillMd(raw: string): boolean {
  const meta = parseFrontmatter(raw)
  return Boolean(trim(meta.name || ''))
}

export async function assertValidSkillDir(dir: string): Promise<{
  name: string
  description: string
}> {
  const skillMd = await findSkillMdPath(dir)
  if (!skillMd) throw new Error('errNoSkillMd')

  const content = await fs.readFile(skillMd, 'utf-8')
  if (!isValidSkillMd(content)) throw new Error('errInvalidSkillMd')

  const meta = parseFrontmatter(content)
  return {
    name: trim(meta.name!),
    description: trim(meta.description || ''),
  }
}
