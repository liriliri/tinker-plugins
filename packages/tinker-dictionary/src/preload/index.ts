import { contextBridge } from 'electron'
import { MDX, MDD } from 'js-mdict'
import AdmZip from 'adm-zip'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import crypto from 'node:crypto'
import mime from 'licia/mime'
import type { WordEntry, DictLookupResult, DictInfo } from '../common/types'

interface DictInstance {
  mdx: InstanceType<typeof MDX>
  mdd: InstanceType<typeof MDD> | null
  info: DictInfo
  extraCss?: string
  tempDir?: string
}

const dicts = new Map<string, DictInstance>()

function getInfo(
  mdx: InstanceType<typeof MDX>,
  mdxPath: string,
): Pick<DictInfo, 'title' | 'description'> {
  const header = mdx.header
  const rawTitle = (header.Title as string) || ''
  const isValidTitle =
    rawTitle && !/no html code allowed/i.test(rawTitle) && rawTitle !== 'Title'
  return {
    title: isValidTitle ? rawTitle : path.basename(mdxPath, '.mdx'),
    description: (header.Description as string) || '',
  }
}

async function loadMdxDictionary(mdxPath: string): Promise<DictInfo | null> {
  if (dicts.has(mdxPath)) return dicts.get(mdxPath)!.info
  try {
    const mdx = new MDX(mdxPath)
    let mdd: InstanceType<typeof MDD> | null = null
    const mddPath = mdxPath.replace(/\.mdx$/i, '.mdd')
    try {
      await fs.access(mddPath)
      mdd = new MDD(mddPath)
    } catch {}
    const { title, description } = getInfo(mdx, mdxPath)
    const info: DictInfo = { title, description, path: mdxPath }
    dicts.set(mdxPath, { mdx, mdd, info })
    return info
  } catch (err) {
    console.error('Failed to load dictionary:', err)
    return null
  }
}

function getZipCacheDir(zipPath: string): string {
  const hash = crypto.createHash('md5').update(zipPath).digest('hex')
  return path.join(os.tmpdir(), `tinker-dict-${hash}`)
}

async function findCachedFile(
  dir: string,
  ext: string,
): Promise<string | null> {
  try {
    const files = await fs.readdir(dir)
    const match = files.find((f) => f.toLowerCase().endsWith(ext))
    return match ? path.join(dir, match) : null
  } catch {
    return null
  }
}

async function loadZipDictionary(zipPath: string): Promise<DictInfo | null> {
  if (dicts.has(zipPath)) return dicts.get(zipPath)!.info
  try {
    const cacheDir = getZipCacheDir(zipPath)
    const cached = await findCachedFile(cacheDir, '.mdx')

    if (cached) {
      const result = await loadFromCache(zipPath, cacheDir, cached)
      if (result) return result
    }

    // Cache miss or incomplete, re-extract
    await fs.rm(cacheDir, { recursive: true, force: true }).catch(() => {})
    return await extractAndLoad(zipPath, cacheDir)
  } catch (err) {
    console.error('Failed to load zip dictionary:', err)
    return null
  }
}

async function loadFromCache(
  zipPath: string,
  cacheDir: string,
  mdxPath: string,
): Promise<DictInfo | null> {
  try {
    const mdx = new MDX(mdxPath)
    const mddPath = await findCachedFile(cacheDir, '.mdd')
    const mdd = mddPath ? new MDD(mddPath) : null
    const { title, description } = getInfo(mdx, mdxPath)

    let icon: string | undefined
    const iconPath = await findCachedFile(cacheDir, '.icon')
    if (iconPath) {
      try {
        icon = await fs.readFile(iconPath, 'utf-8')
      } catch {}
    }

    let extraCss: string | undefined
    const cssPath = await findCachedFile(cacheDir, '.extracss')
    if (cssPath) {
      try {
        extraCss = await fs.readFile(cssPath, 'utf-8')
      } catch {}
    }

    const info: DictInfo = { title, description, path: zipPath, icon }
    dicts.set(zipPath, { mdx, mdd, info, extraCss, tempDir: cacheDir })
    return info
  } catch {
    return null
  }
}

async function extractAndLoad(
  zipPath: string,
  cacheDir: string,
): Promise<DictInfo | null> {
  const zip = new AdmZip(zipPath)
  const entries = zip.getEntries()

  let mdxEntry: AdmZip.IZipEntry | null = null
  let mddEntry: AdmZip.IZipEntry | null = null
  let iconEntry: AdmZip.IZipEntry | null = null
  let firstImageEntry: AdmZip.IZipEntry | null = null
  const cssEntries: AdmZip.IZipEntry[] = []

  for (const entry of entries) {
    if (entry.isDirectory) continue
    const name = entry.entryName.toLowerCase()
    const ext = path.extname(name)
    if (ext === '.mdx' && !mdxEntry) {
      mdxEntry = entry
    } else if (ext === '.mdd' && !mddEntry) {
      mddEntry = entry
    } else if (mime(ext.slice(1))) {
      if (!firstImageEntry) firstImageEntry = entry
      if (!iconEntry && (name.includes('icon') || name.includes('logo'))) {
        iconEntry = entry
      }
    } else if (ext === '.css') {
      cssEntries.push(entry)
    }
  }
  if (!iconEntry) iconEntry = firstImageEntry

  if (!mdxEntry) {
    console.error('No .mdx file found in zip:', zipPath)
    return null
  }

  await fs.mkdir(cacheDir, { recursive: true })

  const mdxCachePath = path.join(cacheDir, path.basename(mdxEntry.entryName))
  await fs.writeFile(mdxCachePath, zip.readFile(mdxEntry)!)

  let mdd: InstanceType<typeof MDD> | null = null
  if (mddEntry) {
    const mddCachePath = path.join(cacheDir, path.basename(mddEntry.entryName))
    await fs.writeFile(mddCachePath, zip.readFile(mddEntry)!)
    mdd = new MDD(mddCachePath)
  }

  const mdx = new MDX(mdxCachePath)
  const { title, description } = getInfo(mdx, mdxCachePath)

  let icon: string | undefined
  if (iconEntry) {
    const buf = zip.readFile(iconEntry)
    if (buf) {
      const ext = path.extname(iconEntry.entryName.toLowerCase())
      const mimeType = mime(ext.slice(1))
      if (mimeType) {
        icon = `data:${mimeType};base64,${buf.toString('base64')}`
        await fs.writeFile(path.join(cacheDir, 'cached.icon'), icon)
      }
    }
  }

  let extraCss: string | undefined
  if (cssEntries.length > 0) {
    extraCss = cssEntries.map((e) => zip.readAsText(e, 'utf-8')).join('\n')
    await fs.writeFile(path.join(cacheDir, 'cached.extracss'), extraCss)
  }

  const info: DictInfo = { title, description, path: zipPath, icon }
  dicts.set(zipPath, { mdx, mdd, info, extraCss, tempDir: cacheDir })
  return info
}

const dictionaryObj = {
  loadDictionary: async (dictPath: string): Promise<DictInfo | null> => {
    if (/\.zip$/i.test(dictPath)) {
      return loadZipDictionary(dictPath)
    }
    return loadMdxDictionary(dictPath)
  },

  removeDictionary: async (dictPath: string): Promise<boolean> => {
    const entry = dicts.get(dictPath)
    if (entry?.tempDir) {
      try {
        await fs.rm(entry.tempDir, { recursive: true, force: true })
      } catch {}
    }
    return dicts.delete(dictPath)
  },

  search: (word: string, limit = 50, dictPaths?: string[]): WordEntry[] => {
    if (!word.trim() || dicts.size === 0) return []
    const seen = new Set<string>()
    const results: WordEntry[] = []
    const entries: DictInstance[] = dictPaths
      ? (dictPaths.map((p) => dicts.get(p)).filter(Boolean) as DictInstance[])
      : Array.from(dicts.values())
    try {
      for (const entry of entries) {
        const items = entry.mdx.prefix(word)
        for (const item of items) {
          if (!seen.has(item.keyText)) {
            seen.add(item.keyText)
            results.push({ keyText: item.keyText })
            if (results.length >= limit) return results
          }
        }
      }
    } catch (err) {
      console.error('Search failed:', err)
    }
    return results
  },

  lookup: (word: string, dictPaths?: string[]): DictLookupResult[] => {
    const results: DictLookupResult[] = []
    const entries: DictInstance[] = dictPaths
      ? (dictPaths.map((p) => dicts.get(p)).filter(Boolean) as DictInstance[])
      : Array.from(dicts.values())
    for (const entry of entries) {
      try {
        const result = entry.mdx.lookup(word)
        if (result.definition) {
          results.push({
            dictPath: entry.info.path,
            dictTitle: entry.info.title,
            keyText: result.keyText,
            definition: result.definition,
          })
        }
      } catch (err) {
        console.error(`Lookup failed in ${entry.info.title}:`, err)
      }
    }
    return results
  },

  lookupResource: (dictPath: string, resourceKey: string): string | null => {
    const entry = dicts.get(dictPath)
    if (!entry?.mdd) return null
    try {
      const result = entry.mdd.locate(resourceKey)
      return result.definition
    } catch (err) {
      console.error('Resource lookup failed:', err)
      return null
    }
  },

  getExtraCss: (dictPath: string): string | null => {
    const entry = dicts.get(dictPath)
    return entry?.extraCss ?? null
  },

  getDictList: (): DictInfo[] => {
    return Array.from(dicts.values()).map((e) => e.info)
  },
}

contextBridge.exposeInMainWorld('dictionary', dictionaryObj)

declare global {
  const dictionary: typeof dictionaryObj
}
