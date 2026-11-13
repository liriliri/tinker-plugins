import { contextBridge } from 'electron'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import cmpVersion from 'licia/cmpVersion'
import contain from 'licia/contain'
import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import isFinite from 'licia/isFinite'
import isStr from 'licia/isStr'
import keys from 'licia/keys'
import ltrim from 'licia/ltrim'
import map from 'licia/map'
import replaceAll from 'licia/replaceAll'
import safeGet from 'licia/safeGet'
import startWith from 'licia/startWith'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import type {
  DownloadResult,
  PackageDetail,
  PackageSearchItem,
} from '../common/types'

const execFileAsync = promisify(execFile)

const REGISTRY = 'https://registry.npmjs.org'
const UA = 'tinker-npm/0.1.0'

function encodePackageName(name: string) {
  if (startWith(name, '@') && contain(name, '/')) {
    const slash = name.indexOf('/')
    return `${name.slice(0, slash)}%2F${encodeURIComponent(name.slice(slash + 1))}`
  }
  return encodeURIComponent(name)
}

function safeDirName(name: string, version: string) {
  return `${replaceAll(ltrim(name, '@'), '/', '-')}-${version}`
}

function npmBin() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

async function downloadFile(url: string, dest: string) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 120000)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    await fs.promises.writeFile(dest, buf)
  } finally {
    clearTimeout(timer)
  }
}

async function runNpm(args: string[]) {
  try {
    const { stdout, stderr } = await execFileAsync(npmBin(), args, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      env: process.env,
      shell: process.platform === 'win32',
    })
    return { stdout: stdout || '', stderr: stderr || '' }
  } catch (err) {
    const error = err as Error & { stdout?: string; stderr?: string }
    const detail = trim(error.stderr || error.stdout || error.message || '')
    throw new Error(detail || 'npm command failed')
  }
}

interface RegistrySearchResponse {
  objects?: Array<{
    downloads?: { weekly?: number }
    dependents?: number | string
    package?: {
      name?: string
      version?: string
      description?: string
      date?: string
      keywords?: string[]
      publisher?: { username?: string }
    }
  }>
  total?: number
}

function toCount(value: unknown) {
  const n = toNum(value)
  return isFinite(n) ? n : 0
}

interface RegistryPackage {
  name?: string
  description?: string
  license?: string | { type?: string }
  homepage?: string
  repository?: string | { url?: string }
  keywords?: string[]
  maintainers?: Array<{ name?: string }>
  time?: Record<string, string>
  readme?: string
  'dist-tags'?: Record<string, string>
  versions?: Record<
    string,
    {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      dist?: { tarball?: string; unpackedSize?: number }
      readme?: string
    }
  >
}

function repoUrl(repo: RegistryPackage['repository']): string {
  if (!repo) return ''
  if (isStr(repo)) return repo
  return safeGet(repo, 'url') || ''
}

function licenseText(license: RegistryPackage['license']): string {
  if (!license) return ''
  if (isStr(license)) return license
  return safeGet(license, 'type') || ''
}

function sortVersionsDesc(versions: string[]) {
  return [...versions].sort((a, b) => cmpVersion(b, a))
}

const packageCache = new Map<string, RegistryPackage>()

async function fetchPackageMeta(name: string): Promise<RegistryPackage> {
  const cached = packageCache.get(name)
  if (cached) return cached
  const data = await fetchJson<RegistryPackage>(
    `${REGISTRY}/${encodePackageName(name)}`,
  )
  packageCache.set(name, data)
  return data
}

const api = {
  async search(
    query: string,
    from = 0,
    size = 20,
  ): Promise<{ items: PackageSearchItem[]; total: number }> {
    const q = trim(query)
    if (!q) return { items: [], total: 0 }

    const url = `${REGISTRY}/-/v1/search?text=${encodeURIComponent(q)}&size=${size}&from=${from}`
    const data = await fetchJson<RegistrySearchResponse>(url)
    const items = filter(
      map(data.objects || [], (obj) => {
        const pkg = obj.package || {}
        return {
          name: pkg.name || '',
          version: pkg.version || '',
          description: pkg.description || '',
          date: pkg.date || '',
          publisher: safeGet(pkg, 'publisher.username') || '',
          keywords: pkg.keywords || [],
          weeklyDownloads: toCount(safeGet(obj, 'downloads.weekly')),
          dependents: toCount(obj.dependents),
        }
      }),
      (item) => !isEmpty(item.name),
    )

    return { items, total: data.total || items.length }
  },

  async getPackage(name: string, version?: string): Promise<PackageDetail> {
    const pkgName = trim(name)
    if (!pkgName) throw new Error('Package name is required')

    const data = await fetchPackageMeta(pkgName)
    const versionsMap = data.versions || {}
    const versionIds = sortVersionsDesc(keys(versionsMap))
    if (isEmpty(versionIds)) throw new Error('No versions found')

    const latest = data['dist-tags']?.latest || versionIds[0]
    const selected = version && versionsMap[version] ? version : latest
    const meta = versionsMap[selected] || {}
    const timeMap = data.time || {}

    return {
      name: data.name || pkgName,
      description: data.description || '',
      license: licenseText(data.license),
      homepage: data.homepage || '',
      repository: repoUrl(data.repository),
      latest,
      versions: versionIds,
      keywords: data.keywords || [],
      maintainers: filter(
        map(data.maintainers || [], (m) => m.name || ''),
        (name) => !isEmpty(name),
      ),
      time: timeMap[selected] || timeMap.modified || '',
      dependencies: meta.dependencies || {},
      devDependencies: meta.devDependencies || {},
      unpackedSize: meta.dist?.unpackedSize || 0,
      tarball: meta.dist?.tarball || '',
      readme: trim(meta.readme || data.readme || ''),
    }
  },

  async installGlobal(name: string, version?: string): Promise<void> {
    const pkgName = trim(name)
    if (!pkgName) throw new Error('Package name is required')
    const spec = version ? `${pkgName}@${trim(version)}` : pkgName
    await runNpm(['install', '-g', spec])
  },

  async downloadAndExtract(
    name: string,
    version: string,
    destDir: string,
  ): Promise<DownloadResult> {
    const pkgName = trim(name)
    const ver = trim(version)
    if (!pkgName || !ver) throw new Error('Package name and version required')
    if (!destDir) throw new Error('Destination directory required')

    const detail = await api.getPackage(pkgName, ver)
    if (!detail.tarball) throw new Error('Tarball URL not found')

    const base = safeDirName(detail.name, ver)
    const tarballPath = path.join(destDir, `${base}.tgz`)
    const extractPath = path.join(destDir, base)

    await downloadFile(detail.tarball, tarballPath)
    await fs.promises.rm(extractPath, { recursive: true, force: true })
    await fs.promises.mkdir(extractPath, { recursive: true })

    await execFileAsync('tar', ['-xzf', tarballPath, '-C', extractPath], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    })

    const packageDir = path.join(extractPath, 'package')
    try {
      await fs.promises.access(packageDir)
      const entries = await fs.promises.readdir(packageDir)
      for (const entry of entries) {
        await fs.promises.rename(
          path.join(packageDir, entry),
          path.join(extractPath, entry),
        )
      }
      await fs.promises.rmdir(packageDir)
    } catch {
      // keep extracted layout as-is when npm "package/" folder is absent
    }

    return { tarballPath, extractPath }
  },
}

contextBridge.exposeInMainWorld('npmApi', api)

declare global {
  const npmApi: typeof api
}
