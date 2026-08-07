import endWith from 'licia/endWith'
import map from 'licia/map'
import some from 'licia/some'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import { shouldRefineChineseSubtitles } from './lang'
import type { TranscriptSegment } from './types'

interface TimedToken {
  text: string
  start: number
  end: number
}

interface SentenceGroupingOptions {
  maxDurationSec: number
  pauseThresholdSec: number
  sentenceEnders: string[]
  mergeAdjacentDigitTokens: boolean
}

const DEFAULT_SENTENCE_GROUPING_OPTIONS: SentenceGroupingOptions = {
  maxDurationSec: 10,
  pauseThresholdSec: 0.6,
  sentenceEnders: [
    '.',
    '!',
    '?',
    '。',
    '！',
    '？',
    '…',
    '；',
    ';',
    ',',
    '，',
    ' ',
  ],
  mergeAdjacentDigitTokens: true,
}

const PUNCTUATION_ONLY_RE = /^[.?。！？…；;，、:：""''（）()]+$/u

function endsSentence(text: string, sentenceEnders: string[]): boolean {
  const trimmed = text.trimEnd()
  return some(sentenceEnders, (ender) => {
    if (ender === ' ') {
      return endWith(text, ' ') || trimmed !== text
    }
    return endWith(trimmed, ender)
  })
}

function isDigitOnly(text: string): boolean {
  const trimmed = trim(text)
  return trimmed.length > 0 && /^\d+$/.test(trimmed)
}

function isSkippableToken(token: string): boolean {
  const trimmed = trim(token)
  return (
    !trimmed ||
    trimmed === '<s>' ||
    trimmed === '</s>' ||
    trimmed === '<unk>' ||
    (startWith(trimmed, '<') && endWith(trimmed, '>'))
  )
}

function normalizeTokenText(token: string): string {
  const trimmed = trim(token)
  if (endWith(trimmed, '@@') && trimmed.length > 2) {
    return trimmed.slice(0, -2)
  }
  return trimmed
}

function isPunctuationOnly(text: string): boolean {
  const trimmed = trim(text)
  return trimmed.length > 0 && PUNCTUATION_ONLY_RE.test(trimmed)
}

function mergeAdjacentDigitTokens(chunks: TimedToken[]): TimedToken[] {
  const merged: TimedToken[] = []
  for (const chunk of chunks) {
    const last = merged[merged.length - 1]
    if (last && isDigitOnly(last.text) && isDigitOnly(chunk.text)) {
      last.text += chunk.text
      last.end = chunk.end
      continue
    }
    merged.push({ ...chunk })
  }
  return merged
}

function tokenEndSec(
  timestamps: number[],
  index: number,
  segmentStartSec: number,
  segmentEndSec: number,
): number {
  if (index + 1 < timestamps.length) {
    return segmentStartSec + timestamps[index + 1]
  }
  return segmentEndSec
}

function tokensToTimedChunks(
  tokens: string[],
  timestamps: number[],
  segmentStartSec: number,
  segmentEndSec: number,
): TimedToken[] {
  if (!tokens.length || tokens.length !== timestamps.length) return []

  const chunks: TimedToken[] = []
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (isSkippableToken(token)) continue

    const text = normalizeTokenText(token)
    if (!text) continue

    const start = segmentStartSec + timestamps[index]
    let end = tokenEndSec(timestamps, index, segmentStartSec, segmentEndSec)
    if (end <= start) {
      end = Math.min(start + 0.05, segmentEndSec)
    }

    if (isPunctuationOnly(text)) {
      const last = chunks[chunks.length - 1]
      if (last) {
        last.text += text
        last.end = end
        continue
      }
    }

    chunks.push({ text, start, end })
  }

  return chunks
}

function groupWordsIntoSentences(
  words: TimedToken[],
  lang: string | undefined,
  family: string | undefined,
  options: SentenceGroupingOptions = DEFAULT_SENTENCE_GROUPING_OPTIONS,
): TranscriptSegment[] {
  if (!words.length) return []

  const normalized = options.mergeAdjacentDigitTokens
    ? mergeAdjacentDigitTokens(words)
    : words

  const sentences: TranscriptSegment[] = []
  let current: TimedToken[] = []

  for (let i = 0; i < normalized.length; i++) {
    const word = normalized[i]
    current.push(word)

    const isLast = i === normalized.length - 1
    const next = isLast ? null : normalized[i + 1]
    const currentDuration = current[current.length - 1].end - current[0].start
    const pauseToNext = next ? next.start - word.end : 0
    const shouldEnd =
      isLast ||
      currentDuration >= options.maxDurationSec ||
      pauseToNext >= options.pauseThresholdSec ||
      endsSentence(word.text, options.sentenceEnders)

    if (shouldEnd && current.length > 0) {
      const text = trim(map(current, (c) => c.text).join(''))
      if (text) {
        sentences.push({
          start: current[0].start,
          end: current[current.length - 1].end,
          text,
          lang,
          family,
        })
      }
      current = []
    }
  }

  return sentences
}

function fallbackSegment(
  start: number,
  end: number,
  text: string,
  lang?: string,
  family?: string,
): TranscriptSegment[] {
  return [{ start, end, text, lang, family }]
}

export function splitSegmentByTokenTimestamps(
  tokens: string[] | undefined,
  timestamps: number[] | undefined,
  segmentStartSec: number,
  segmentEndSec: number,
  fallbackText: string,
  lang?: string,
  family?: string,
): TranscriptSegment[] {
  const fallback = () =>
    fallbackSegment(segmentStartSec, segmentEndSec, fallbackText, lang, family)

  if (!shouldRefineChineseSubtitles(family, lang)) return fallback()
  if (!tokens?.length || !timestamps?.length) return fallback()

  const words = tokensToTimedChunks(
    tokens,
    timestamps,
    segmentStartSec,
    segmentEndSec,
  )
  if (!words.length) return fallback()

  const sentences = groupWordsIntoSentences(words, lang, family)
  return sentences.length ? sentences : fallback()
}
