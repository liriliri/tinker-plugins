import fs from 'node:fs/promises'
import path from 'node:path'
import AdmZip from 'adm-zip'
import trim from 'licia/trim'
import type { MarketplaceSearchResult, MarketplaceSkill } from '../common/types'
import { sanitizeFolderName } from './sanitizeFolderName'
import { AGENTS_SKILLS_DIR, pathExists, removePath } from './syncSkills'

const CLAWHUB_API = 'https://clawhub.ai/api/v1'
const PAGE_SIZE = 40
const USER_AGENT = 'tinker-agent-skills'

interface ClawhubListItem {
  slug: string
  displayName?: string | null
  summary?: string | null
  latestVersion?: { version?: string | null } | null
  tags?: { latest?: string | null } | null
  stats?: { installs?: number | null; downloads?: number | null } | null
}

interface ClawhubSearchItem {
  slug: string
  displayName?: string | null
  summary?: string | null
  version?: string | null
  downloads?: number | null
  ownerHandle?: string | null
}

interface ClawhubDetail {
  skill?: { slug?: string }
  latestVersion?: { version?: string } | null
  owner?: { handle?: string } | null
}

interface ClawhubAmbiguous {
  matches?: Array<{ ownerHandle?: string }>
}

async function isInstalled(slug: string, name: string): Promise<boolean> {
  const candidates = [
    sanitizeFolderName(slug),
    sanitizeFolderName(name),
  ].filter(Boolean)
  for (const folder of candidates) {
    const dir = path.join(AGENTS_SKILLS_DIR, folder)
    if (await pathExists(path.join(dir, 'SKILL.md'))) return true
    try {
      const entries = await fs.readdir(dir)
      if (entries.some((entry) => entry.toLowerCase() === 'skill.md'))
        return true
    } catch {
      // continue
    }
  }
  return false
}

async function mapListItem(item: ClawhubListItem): Promise<MarketplaceSkill> {
  const slug = item.slug
  const name = trim(item.displayName || '') || slug
  const version =
    trim(item.latestVersion?.version || '') ||
    trim(item.tags?.latest || '') ||
    ''
  return {
    id: `clawhub::${slug}`,
    slug,
    name,
    description: trim(item.summary || ''),
    author: '',
    installCount: item.stats?.installs ?? item.stats?.downloads ?? null,
    version,
    installed: await isInstalled(slug, name),
  }
}

async function mapSearchItem(
  item: ClawhubSearchItem,
): Promise<MarketplaceSkill> {
  const slug = item.slug
  const name = trim(item.displayName || '') || slug
  const author = trim(item.ownerHandle || '')
  return {
    id: `clawhub::${slug}${author ? `::${author}` : ''}`,
    slug,
    name,
    description: trim(item.summary || ''),
    author,
    installCount: item.downloads ?? null,
    version: trim(item.version || ''),
    installed: await isInstalled(slug, name),
  }
}

async function clawhubFetch(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })
  return res
}

async function resolveOwnerAndVersion(
  slug: string,
  owner: string,
  version: string,
): Promise<{ owner: string; version: string }> {
  let currentOwner = owner
  let currentVersion = version

  if (currentOwner && currentVersion) {
    return { owner: currentOwner, version: currentVersion }
  }

  const detailUrl = new URL(`${CLAWHUB_API}/skills/${encodeURIComponent(slug)}`)
  if (currentOwner) detailUrl.searchParams.set('owner', currentOwner)

  let res = await clawhubFetch(detailUrl.toString())

  if (res.status === 409) {
    const ambiguous = (await res.json()) as ClawhubAmbiguous
    const match = ambiguous.matches?.[0]?.ownerHandle
    if (!match) throw new Error('errMarketplaceAmbiguous')
    currentOwner = match
    detailUrl.searchParams.set('owner', currentOwner)
    res = await clawhubFetch(detailUrl.toString())
  }

  if (!res.ok) throw new Error('errMarketplaceDetail')

  const detail = (await res.json()) as ClawhubDetail
  if (!currentOwner) {
    currentOwner = trim(detail.owner?.handle || '')
  }
  if (!currentVersion) {
    currentVersion = trim(detail.latestVersion?.version || '')
  }
  if (!currentOwner || !currentVersion) throw new Error('errMarketplaceDetail')

  return { owner: currentOwner, version: currentVersion }
}

function stripArchivePrefix(entryName: string, slug: string): string {
  const normalized = entryName.replace(/\\/g, '/').replace(/^\.\//, '')
  const prefix = `${slug}/`
  if (normalized.startsWith(prefix)) return normalized.slice(prefix.length)
  return normalized
}

export async function searchMarketplace(
  query: string,
  cursor?: string | null,
): Promise<MarketplaceSearchResult> {
  const q = trim(query)

  if (q) {
    const url = new URL(`${CLAWHUB_API}/search`)
    url.searchParams.set('q', q)
    const res = await clawhubFetch(url.toString())
    if (!res.ok) throw new Error('errMarketplaceNetwork')
    const body = (await res.json()) as { results?: ClawhubSearchItem[] }
    const skills = await Promise.all(
      (body.results || []).map((item) => mapSearchItem(item)),
    )
    return { skills, nextCursor: null, hasMore: false }
  }

  const url = new URL(`${CLAWHUB_API}/skills`)
  url.searchParams.set('limit', String(PAGE_SIZE))
  url.searchParams.set('sort', 'installs')
  if (cursor) url.searchParams.set('cursor', cursor)

  const res = await clawhubFetch(url.toString())
  if (!res.ok) throw new Error('errMarketplaceNetwork')
  const body = (await res.json()) as {
    items?: ClawhubListItem[]
    nextCursor?: string | null
  }
  const skills = await Promise.all(
    (body.items || []).map((item) => mapListItem(item)),
  )
  const nextCursor = body.nextCursor || null
  return { skills, nextCursor, hasMore: Boolean(nextCursor) }
}

export async function installMarketplaceSkill(skill: {
  slug: string
  name: string
  author?: string
  version?: string
}): Promise<{ folderName: string }> {
  const slug = trim(skill.slug)
  if (!slug) throw new Error('errMarketplaceInstall')

  const { owner, version } = await resolveOwnerAndVersion(
    slug,
    trim(skill.author || ''),
    trim(skill.version || ''),
  )

  const downloadUrl = new URL(`${CLAWHUB_API}/download`)
  downloadUrl.searchParams.set('slug', slug)
  downloadUrl.searchParams.set('version', version)
  downloadUrl.searchParams.set('ownerHandle', owner)

  const res = await fetch(downloadUrl.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!res.ok) throw new Error('errMarketplaceDownload')

  const buffer = Buffer.from(await res.arrayBuffer())
  const zip = new AdmZip(buffer)
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory)

  const folderName =
    sanitizeFolderName(slug) || sanitizeFolderName(skill.name) || 'skill'
  const dest = path.join(AGENTS_SKILLS_DIR, folderName)

  await fs.mkdir(AGENTS_SKILLS_DIR, { recursive: true })
  if (await pathExists(dest)) {
    await removePath(dest)
  }
  await fs.mkdir(dest, { recursive: true })

  let wroteSkillMd = false
  for (const entry of entries) {
    const name = entry.entryName.replace(/\\/g, '/')
    if (
      name.includes('__MACOSX/') ||
      name.endsWith('_meta.json') ||
      name.endsWith('skill-card.md')
    ) {
      continue
    }
    const relative = stripArchivePrefix(name, slug)
    if (!relative || relative === '.') continue
    const target = path.join(dest, relative)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, entry.getData())
    if (path.basename(relative).toLowerCase() === 'skill.md') {
      wroteSkillMd = true
    }
  }

  if (!wroteSkillMd) {
    await removePath(dest).catch(() => {})
    throw new Error('errNoSkillMd')
  }

  return { folderName }
}
