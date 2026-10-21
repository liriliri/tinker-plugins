import compact from 'licia/compact'
import contain from 'licia/contain'
import each from 'licia/each'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import trim from 'licia/trim'
import unique from 'licia/unique'

const TAGS: Record<string, string> = {
  english: 'en',
  'american english': 'en',
  'british english': 'en',
  'english uk': 'en',
  spanish: 'es',
  español: 'es',
  españa: 'es',
  castilian: 'es',
  castellano: 'es',
  'español internacional': 'es',
  'español argentina': 'es',
  'castellano. español': 'es',
  'español - latinoamerica': 'es',
  german: 'de',
  deutsch: 'de',
  french: 'fr',
  francia: 'fr',
  dutch: 'nl',
  flemish: 'nl',
  flammish: 'nl',
  nederland: 'nl',
  hollands: 'nl',
  nederlandstalig: 'nl',
  portuguese: 'pt',
  'brazilian portuguese': 'pt',
  'português (brasil)': 'pt',
  italian: 'it',
  italia: 'it',
  polish: 'pl',
  russian: 'ru',
  turkish: 'tr',
  greek: 'el',
  arabic: 'ar',
  chinese: 'zh',
  mandarin: 'zh',
  cantonese: 'yue',
  japanese: 'ja',
  korean: 'ko',
  hindi: 'hi',
  swedish: 'sv',
  norwegian: 'no',
  danish: 'da',
  finnish: 'fi',
  czech: 'cs',
  hungarian: 'hu',
  romanian: 'ro',
  romania: 'ro',
  română: 'ro',
  românä: 'ro',
  ukrainian: 'uk',
  serbian: 'sr',
  croatian: 'hr',
  bulgarian: 'bg',
  indonesian: 'id',
  'bahasa indonesia': 'id',
  thai: 'th',
  vietnamese: 'vi',
  hebrew: 'he',
  persian: 'fa',
  catalan: 'ca',
  slovak: 'sk',
  slovenian: 'sl',
  lithuanian: 'lt',
  latvian: 'lv',
  estonian: 'et',
  tagalog: 'tl',
  filipino: 'tl',
}

const LOCALES = [
  'en',
  'zh-CN',
  'es',
  'pt',
  'pt-BR',
  'fr',
  'de',
  'it',
  'nl',
  'ru',
  'pl',
  'tr',
  'ar',
  'ja',
  'ko',
  'hi',
  'uk',
  'ro',
  'sv',
  'nb',
  'da',
  'fi',
  'el',
  'he',
  'th',
  'id',
  'vi',
  'cs',
  'hu',
  'bg',
  'hr',
  'sk',
  'sr',
  'ca',
  'et',
  'lt',
  'lv',
  'sl',
  'lb',
]

const DEPRECATED = new Set(['in', 'iw', 'ji', 'jw', 'mo'])

const CANONICAL: Record<string, string> = {
  nb: 'no',
  nn: 'no',
  cmn: 'zh',
  in: 'id',
  iw: 'he',
  ji: 'yi',
  jw: 'jv',
  mo: 'ro',
}

const displayNames = new Map<string, Intl.DisplayNames>()
const codeCache = new Map<string, string[]>()

let nameIndex: Record<string, string> | null = null
let fuzzyKeys: string[] = []

function namesFor(locale: string) {
  const found = displayNames.get(locale)
  if (found) return found
  const next = new Intl.DisplayNames([locale], { type: 'language' })
  displayNames.set(locale, next)
  return next
}

function fold(value: string) {
  return lowerCase(value)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function canonical(code: string) {
  const primary = code.split('-')[0]
  return CANONICAL[primary] || primary
}

function englishName(code: string) {
  try {
    return namesFor('en').of(code) || ''
  } catch {
    return ''
  }
}

function isNamed(code: string) {
  const label = fold(englishName(code))
  return !!label && label !== code
}

function setName(table: Record<string, string>, label: string, code: string) {
  const key = fold(label)
  if (!key || key === code) return
  const prev = table[key]
  if (!prev) {
    table[key] = code
    return
  }
  if (prev === code) return
  if (fold(englishName(code)) === key && fold(englishName(prev)) !== key) {
    table[key] = code
  }
}

function names() {
  if (nameIndex) return nameIndex
  const table: Record<string, string> = {}
  const codes: string[] = []
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      codes.push(String.fromCharCode(97 + i, 97 + j))
    }
  }
  each(LOCALES, (locale) => {
    let display: Intl.DisplayNames
    try {
      display = namesFor(locale)
    } catch {
      return
    }
    each(codes, (code) => {
      if (DEPRECATED.has(code)) return
      try {
        setName(table, display.of(code) || '', code)
      } catch {
        return
      }
    })
  })
  each(Object.keys(TAGS), (name) => {
    table[fold(name)] = TAGS[name]
  })
  const folded: Record<string, string> = {}
  each(Object.keys(table), (key) => {
    folded[key] = canonical(table[key])
  })
  fuzzyKeys = []
  each(Object.keys(folded), (key) => {
    if (key.length >= 5 && !contain(key, ' ')) fuzzyKeys.push(key)
  })
  nameIndex = folded
  return folded
}

function titleCase(value: string) {
  if (value !== lowerCase(value)) return value
  return map(value.split(' '), (word) =>
    word ? word.charAt(0).toUpperCase() + word.slice(1) : word,
  ).join(' ')
}

function withinOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  if (a.length > b.length) return withinOne(b, a)
  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a.charAt(i) === b.charAt(j)) {
      i += 1
      j += 1
      continue
    }
    if (edits === 1) return false
    edits += 1
    if (
      a.length === b.length &&
      i + 1 < a.length &&
      a.charAt(i) === b.charAt(j + 1) &&
      a.charAt(i + 1) === b.charAt(j)
    ) {
      i += 2
      j += 2
      continue
    }
    if (a.length === b.length) {
      i += 1
      j += 1
    } else {
      j += 1
    }
  }
  if (i < a.length || j < b.length) edits += 1
  return edits === 1
}

function fuzzyCode(word: string) {
  if (word.length < 5 || contain(word, ' ')) return ''
  const table = names()
  let best = ''
  let bestScore = -1
  let tied = false
  each(fuzzyKeys, (name) => {
    if (!withinOne(word, name)) return
    let score = 0
    const limit = Math.min(word.length, name.length)
    while (score < limit && word.charAt(score) === name.charAt(score)) {
      score += 1
    }
    if (score > bestScore) {
      best = name
      bestScore = score
      tied = false
    } else if (score === bestScore) {
      tied = true
    }
  })
  if (!best || tied) return ''
  return table[best]
}

function fromTag(key: string) {
  if (!/^[a-z]{2,3}(?:-[a-z0-9]+)*$/.test(key)) return ''
  const primary = key.split('-')[0]
  if (primary.length === 3) {
    const via = names()[fold(englishName(primary))]
    if (via) return canonical(via)
  }
  if (!isNamed(primary)) return ''
  return canonical(primary)
}

function phraseCodes(folded: string) {
  const table = names()
  const words = folded.split(' ').filter(Boolean)
  const taken: boolean[] = []
  each(words, () => {
    taken.push(false)
  })
  const found: string[] = []
  for (let size = words.length; size >= 1; size--) {
    for (let i = 0; i <= words.length - size; i++) {
      let blocked = false
      for (let k = i; k < i + size; k++) {
        if (taken[k]) blocked = true
      }
      if (blocked) continue
      const code = table[words.slice(i, i + size).join(' ')]
      if (!code) continue
      found.push(code)
      for (let k = i; k < i + size; k++) taken[k] = true
    }
  }
  return found
}

function knownCodes(key: string) {
  const tag = fromTag(key)
  if (tag) return [tag]
  const folded = fold(key)
  if (!folded) return []
  const phrases = phraseCodes(folded)
  if (phrases.length) return phrases
  const fuzzy = fuzzyCode(folded)
  return fuzzy ? [fuzzy] : []
}

function cleanPart(part: string) {
  let value = lowerCase(trim(part))
  const http = value.indexOf('http')
  if (http >= 0) value = trim(value.slice(0, http))
  value = trim(value.replace(/\([^)]*\)?/g, ' '))
  return trim(value.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
}

function codesForPiece(piece: string) {
  const key = cleanPart(piece)
  if (!key) return [] as string[]
  const sides = key.split(/\s+-\s+/)
  if (sides.length > 1) {
    const known: string[] = []
    each(sides, (side) => {
      each(knownCodes(side), (code) => {
        known.push(code)
      })
    })
    if (known.length) return known
    return [key]
  }
  const known = knownCodes(key)
  return known.length ? known : [key]
}

export function languageCodes(raw: string) {
  const cached = codeCache.get(raw)
  if (cached) return cached
  const codes: string[] = []
  const source = String(raw || '').replace(/https?:\/\/\S+/gi, ' ')
  each(source.split(/[,;/|،，+]+|\s+&\s+|\s+and\s+/), (piece) => {
    each(codesForPiece(piece), (code) => {
      codes.push(code)
    })
  })
  const result = unique(compact(codes) as string[]) as string[]
  codeCache.set(raw, result)
  return result
}

function oneName(value: string, locale: string) {
  const key = lowerCase(trim(value))
  const tag =
    TAGS[key] ||
    (/^[a-z]{2,3}$/.test(key) && isNamed(key) ? canonical(key) : '')
  if (!tag) return titleCase(value)
  try {
    return namesFor(locale).of(tag) || titleCase(value)
  } catch {
    return titleCase(value)
  }
}

export function languageName(raw: string, locale: string) {
  const parts = map(raw.split(','), (part) => trim(part)).filter(
    Boolean,
  ) as string[]
  if (!parts.length) return raw
  const joiner = lowerCase(locale).startsWith('zh') ? '、' : ', '
  return map(parts, (part) => oneName(part, locale)).join(joiner)
}
