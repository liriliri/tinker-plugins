const CHARS_PER_WORD = 5

export function normalizeSpecialChars(text: string): string {
  return text
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u00AB\u00BB]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
}

export function analyzeTyping(
  targetText: string,
  typedText: string,
): { correctChars: number; errors: number; totalTyped: number } {
  const normalizedTarget = normalizeSpecialChars(targetText).normalize('NFC')
  const normalizedTyped = normalizeSpecialChars(typedText).normalize('NFC')

  let correctChars = 0
  let errors = 0

  for (let i = 0; i < normalizedTyped.length; i++) {
    if (
      i < normalizedTarget.length &&
      normalizedTyped[i] === normalizedTarget[i]
    ) {
      correctChars++
    } else {
      errors++
    }
  }

  return { correctChars, errors, totalTyped: normalizedTyped.length }
}

export function calculateWPM(
  correctChars: number,
  elapsedSeconds: number,
): number {
  if (elapsedSeconds <= 0) return 0
  const minutes = elapsedSeconds / 60
  return Math.round(correctChars / CHARS_PER_WORD / minutes)
}

export function calculateCPM(
  correctChars: number,
  elapsedSeconds: number,
): number {
  if (elapsedSeconds <= 0) return 0
  return Math.round(correctChars / (elapsedSeconds / 60))
}

export function calculateAccuracy(
  correctChars: number,
  totalChars: number,
): number {
  if (totalChars <= 0) return 100
  return Math.round((correctChars / totalChars) * 100)
}
