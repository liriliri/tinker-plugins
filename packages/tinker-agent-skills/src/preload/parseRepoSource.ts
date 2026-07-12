import contain from 'licia/contain'
import endWith from 'licia/endWith'
import startWith from 'licia/startWith'
import trim from 'licia/trim'

interface ParsedRepoSource {
  owner: string
  repo: string
  ref?: string
  subpath?: string
  skillFilter?: string
}

function sanitizeSubpath(subpath: string): string {
  const normalized = subpath.replace(/\\/g, '/')
  for (const segment of normalized.split('/')) {
    if (segment === '..') {
      throw new Error('errRepoInvalidSource')
    }
  }
  return trim(normalized, '/')
}

function decodeFragmentValue(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function stripGitSuffix(repo: string): string {
  return endWith(repo, '.git') ? repo.slice(0, -4) : repo
}

/**
 * Parse GitHub shorthand / URLs into owner/repo (+ optional ref, subpath, skill filter).
 * Examples: owner/repo, owner/repo@skill, owner/repo/path, github.com/.../tree/ref/path
 */
export function parseRepoSource(raw: string): ParsedRepoSource {
  const input = trim(raw)
  if (!input) throw new Error('errRepoInvalidSource')

  let working = input
  let fragmentRef: string | undefined
  let fragmentSkill: string | undefined

  const hashIndex = working.indexOf('#')
  if (hashIndex >= 0) {
    const fragment = working.slice(hashIndex + 1)
    working = working.slice(0, hashIndex)
    const atIndex = fragment.indexOf('@')
    if (atIndex === -1) {
      if (fragment) fragmentRef = decodeFragmentValue(fragment)
    } else {
      const ref = fragment.slice(0, atIndex)
      const skill = fragment.slice(atIndex + 1)
      if (ref) fragmentRef = decodeFragmentValue(ref)
      if (skill) fragmentSkill = decodeFragmentValue(skill)
    }
  }

  const githubPrefix = working.match(/^github:(.+)$/i)
  if (githubPrefix) working = githubPrefix[1]

  const treeWithPath = working.match(
    /github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/,
  )
  if (treeWithPath) {
    const [, owner, repo, ref, subpath] = treeWithPath
    return {
      owner,
      repo: stripGitSuffix(repo),
      ref: ref || fragmentRef,
      subpath: sanitizeSubpath(subpath),
      ...(fragmentSkill ? { skillFilter: fragmentSkill } : {}),
    }
  }

  const treeOnly = working.match(
    /github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)$/,
  )
  if (treeOnly) {
    const [, owner, repo, ref] = treeOnly
    return {
      owner,
      repo: stripGitSuffix(repo),
      ref: ref || fragmentRef,
      ...(fragmentSkill ? { skillFilter: fragmentSkill } : {}),
    }
  }

  const githubUrl = working.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (githubUrl) {
    const [, owner, repo] = githubUrl
    return {
      owner,
      repo: stripGitSuffix(repo),
      ...(fragmentRef ? { ref: fragmentRef } : {}),
      ...(fragmentSkill ? { skillFilter: fragmentSkill } : {}),
    }
  }

  const atSkill = working.match(/^([^/]+)\/([^/@]+)@(.+)$/)
  if (atSkill && !contain(working, ':')) {
    const [, owner, repo, skillFilter] = atSkill
    return {
      owner,
      repo,
      ...(fragmentRef ? { ref: fragmentRef } : {}),
      skillFilter: fragmentSkill || skillFilter,
    }
  }

  const shorthand = working.match(/^([^/]+)\/([^/]+)(?:\/(.+?))?\/?$/)
  if (shorthand && !contain(working, ':') && !startWith(working, '.')) {
    const [, owner, repo, subpath] = shorthand
    return {
      owner,
      repo,
      ...(fragmentRef ? { ref: fragmentRef } : {}),
      ...(subpath ? { subpath: sanitizeSubpath(subpath) } : {}),
      ...(fragmentSkill ? { skillFilter: fragmentSkill } : {}),
    }
  }

  throw new Error('errRepoInvalidSource')
}
