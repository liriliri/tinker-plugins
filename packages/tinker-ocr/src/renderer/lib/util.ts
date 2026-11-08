import replaceAll from 'licia/replaceAll'

const CHI_SPACE_RE =
  /(?<=[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]) +(?=[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef])/g

/** PP-OCR often inserts spaces between CJK glyphs; strip those only. */
export function cleanChiSpaces(text: string) {
  return text.replace(CHI_SPACE_RE, '')
}

export function formatOcrText(text: string, stripNewlines: boolean) {
  const cleaned = cleanChiSpaces(text)
  return stripNewlines ? replaceAll(cleaned, '\n', '') : cleaned
}
