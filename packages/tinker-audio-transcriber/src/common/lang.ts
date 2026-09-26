import lowerCase from 'licia/lowerCase'
import startWith from 'licia/startWith'
import trim from 'licia/trim'

/** Normalize SenseVoice tags like `<|zh|>` and config codes like `zh`. */
function normalizeAsrLang(lang?: string | null): string {
  if (!lang) return ''
  return lowerCase(trim(lang.replace(/[<>|]/g, '')))
}

function isChineseLang(lang?: string | null): boolean {
  const code = normalizeAsrLang(lang)
  return code === 'yue' || startWith(code, 'zh')
}

/** Secondary split + punct strip: SenseVoice + detected Chinese only. */
export function shouldRefineChineseSubtitles(
  family?: string | null,
  lang?: string | null,
): boolean {
  return family === 'sense_voice' && isChineseLang(lang)
}
