import mime from 'licia/mime'
import startWith from 'licia/startWith'
import trim from 'licia/trim'

const FONT_MIME: Record<string, string> = {
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
}

function resourceMime(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  return mime(ext) || FONT_MIME[ext] || 'application/octet-stream'
}

function isExternalUrl(src: string) {
  return (
    startWith(src, 'data:') ||
    startWith(src, 'http://') ||
    startWith(src, 'https://') ||
    startWith(src, '//') ||
    startWith(src, '#')
  )
}

/** Rewrite CSS `url(...)` to data URLs from the dictionary MDD. */
export function inlineCssUrls(css: string, dictPath: string): string {
  return css.replace(
    /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
    (match, _quote: string, raw: string) => {
      const src = trim(raw)
      if (!src || isExternalUrl(src)) return match
      const data = dictionary.lookupResource(dictPath, src)
      if (!data) return match
      return `url("data:${resourceMime(src)};base64,${data}")`
    },
  )
}

export function inlineDefinitionResources(
  html: string,
  dictPath: string,
): string {
  let processed = html

  const hasHtmlTags = /<[a-z][\s\S]*?>/i.test(processed)
  if (!hasHtmlTags) {
    processed = processed.replace(/\r\n|\r|\n/g, '<br>')
  }

  processed = processed.replace(
    /<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
    (_match, cssFile: string) => {
      const cssData = dictionary.lookupResource(dictPath, cssFile)
      if (!cssData) return ''
      return `<style>${inlineCssUrls(atob(cssData), dictPath)}</style>`
    },
  )

  processed = processed.replace(
    /(<img\s+[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
    (_match, prefix: string, src: string, suffix: string) => {
      if (isExternalUrl(src)) return _match
      const imgData = dictionary.lookupResource(dictPath, src)
      if (!imgData) return _match
      return `${prefix}data:${resourceMime(src)};base64,${imgData}${suffix}`
    },
  )

  return processed
}
