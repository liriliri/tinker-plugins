import { contextBridge } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { exec } from 'node:child_process'
import * as cheerio from 'cheerio'
import got from 'got'
import type { Wallpaper, ImageOption } from '../common/types'

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Referer: 'https://www.bizhihui.com/',
}

async function fetchUrl(
  url: string,
  timeout = 10000,
): Promise<{ status: number; body: string }> {
  const res = await got(url, {
    headers: defaultHeaders,
    timeout: { request: timeout },
    followRedirect: false,
    throwHttpErrors: false,
  })
  return { status: res.statusCode, body: res.body }
}

function extractWallpapers(html: string): Wallpaper[] {
  const $ = cheerio.load(html)
  const results: Wallpaper[] = []
  const seen = new Set<string>()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (!/\.html(\?|$)/i.test(href)) return
    const lower = href.toLowerCase()
    if (lower.includes('/about') || lower.includes('/contact')) return

    let fullHref = href
    if (!/^https?:\/\//i.test(href)) {
      fullHref = `https://www.bizhihui.com${href.startsWith('/') ? '' : '/'}${href}`
    }

    let thumb = ''
    const img = $(el).find('img').first()
    if (img.length) {
      const src =
        img.attr('data-original') ||
        img.attr('data-src') ||
        img.attr('data-lazy-src') ||
        img.attr('src') ||
        ''
      if (src && !/^data:/i.test(src)) {
        thumb = /^https?:\/\//i.test(src)
          ? src
          : `https://www.bizhihui.com${src.startsWith('/') ? '' : '/'}${src}`
      }
    }

    if (!thumb || seen.has(fullHref)) return
    seen.add(fullHref)
    results.push({ thumb, detail: fullHref })
  })

  return results
}

function extractImageOptions(html: string, pageUrl: string): ImageOption[] {
  const $ = cheerio.load(html)
  const options: ImageOption[] = []
  const seen = new Set<string>()

  function normalizeUrl(u: string): string {
    try {
      if (/^https?:\/\//i.test(u)) return u
      if (u.startsWith('//')) return 'https:' + u
      return new URL(u, pageUrl).toString()
    } catch {
      return u
    }
  }

  function pushOption(url: string, label: string) {
    const normalized = normalizeUrl(url)
    if (seen.has(normalized)) return
    if (
      /(logo|favicon|sprite|banner|header|footer|watermark|placeholder)/i.test(
        normalized,
      )
    )
      return
    seen.add(normalized)
    options.push({ label, url: normalized })
  }

  // Primary: parse labeled download links like "下载原图尺寸壁纸（3840 x 2160）"
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (!/\.(jpe?g|png|webp|gif|bmp)(?:$|[?#])/i.test(href)) return
    const text = $(el).text().trim()

    // Extract resolution from link text e.g. "（ 3840 x 2160 ）" or "(1920x1080)"
    const resMatch = text.match(/[（(]\s*(\d+)\s*[x×]\s*(\d+)\s*[）)]/)
    if (resMatch) {
      const label = `${resMatch[1]}×${resMatch[2]}`
      pushOption(href, label)
      return
    }

    // Extract resolution from OSS resize param e.g. w_1920,h_1080
    const ossMatch = href.match(/w_(\d+),h_(\d+)/)
    if (ossMatch) {
      const label = `${ossMatch[1]}×${ossMatch[2]}`
      pushOption(href, label)
      return
    }
  })

  // Fallback: extract best image from page if no labeled links found
  if (options.length === 0) {
    $('img').each((_, el) => {
      const $el = $(el)
      for (const attr of [
        'data-original',
        'data-src',
        'data-zoom',
        'data-full',
        'src',
      ]) {
        const val = $el.attr(attr)
        if (
          val &&
          /\.(jpe?g|png|webp|gif)/i.test(val) &&
          !/thumb|small|preview|arthumbs|pcthumbs/i.test(val)
        ) {
          pushOption(val, 'Original')
          break
        }
      }
    })
  }

  return options
}

async function fetchImageData(url: string): Promise<Buffer> {
  return got(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      Referer: 'https://www.bizhihui.com/',
    },
    timeout: { request: 60000 },
    responseType: 'buffer',
  }).buffer()
}

function execAsync(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout) => {
      if (err) return reject(err)
      resolve(stdout)
    })
  })
}

async function setWallpaperFromFile(filePath: string): Promise<void> {
  const platform = process.platform
  if (platform === 'darwin') {
    await fs.promises.access(filePath)
    const posixPath = filePath.replace(/\\/g, '/')
    const script = `tell application "System Events" to tell every desktop to set picture to POSIX file "${posixPath}"`
    const cmd = `osascript -e "${script.replace(/"/g, '\\"')}"`
    await execAsync(cmd)
  } else if (platform === 'win32') {
    const transcodedPath = path.join(
      process.env.APPDATA || '',
      'Microsoft',
      'Windows',
      'Themes',
      'TranscodedWallpaper.jpg',
    )
    await fs.promises.mkdir(path.dirname(transcodedPath), { recursive: true })
    await fs.promises.copyFile(filePath, transcodedPath)
    const psEscape = (v: string) => v.replace(/'/g, "''")
    const ps = `[void][System.Runtime.InteropServices.Marshal]; Add-Type -MemberDefinition '[DllImport(\"user32.dll\")] public static extern bool SystemParametersInfo(int a,int b,string c,int d);' -Name W -Namespace W; [W.W]::SystemParametersInfo(20,0,'${psEscape(transcodedPath)}',3)`
    await execAsync(
      `powershell -NoProfile -NonInteractive -Command "${ps.replace(/"/g, '\\"')}"`,
    )
  } else {
    throw new Error('setWallpaper not supported on platform: ' + platform)
  }
}

const wallpaperObj = {
  async search(query: string, page = 1): Promise<Wallpaper[]> {
    const q = query.trim()
    const url = q
      ? `https://www.bizhihui.com/search.php?q=${encodeURIComponent(q)}&page=${page}`
      : `https://www.bizhihui.com/page/${page}/`
    const res = await fetchUrl(url)
    if (res.status !== 200) throw new Error('fetch failed: ' + res.status)
    return extractWallpapers(res.body)
  },

  async getOriginalUrls(detailUrl: string): Promise<ImageOption[]> {
    const res = await fetchUrl(detailUrl)
    if (res.status !== 200) throw new Error('fetch failed: ' + res.status)
    const options = extractImageOptions(res.body, detailUrl)
    if (!options.length) throw new Error('no image found')
    return options
  },

  async getThumbLocal(url: string): Promise<string> {
    const buf = await fetchImageData(url)
    const mime = url.match(/\.png($|[?#])/i) ? 'image/png' : 'image/jpeg'
    return `data:${mime};base64,${buf.toString('base64')}`
  },

  async fetchImageBase64(url: string): Promise<string> {
    const buf = await fetchImageData(url)
    return buf.toString('base64')
  },

  async setWallpaper(base64: string): Promise<void> {
    const buf = Buffer.from(base64, 'base64')
    const tmpFile = path.join(os.tmpdir(), `tinker-wallpaper-${Date.now()}.jpg`)
    await fs.promises.writeFile(tmpFile, buf)
    await setWallpaperFromFile(tmpFile)
  },
}

contextBridge.exposeInMainWorld('wallpaper', wallpaperObj)

declare global {
  const wallpaper: typeof wallpaperObj
}
