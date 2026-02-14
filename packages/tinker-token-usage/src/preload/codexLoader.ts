import { readFile, stat } from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'

// Constants
const CODEX_HOME_ENV = 'CODEX_HOME'
const DEFAULT_CODEX_DIR = path.join(os.homedir(), '.codex')
const DEFAULT_SESSION_SUBDIR = 'sessions'

type RawUsage = {
  input_tokens: number
  cached_input_tokens: number
  output_tokens: number
  reasoning_output_tokens: number
  total_tokens: number
}

type TokenUsageEvent = {
  sessionId: string
  timestamp: string
  model: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningOutputTokens: number
  totalTokens: number
  isFallbackModel?: boolean
}

function ensureNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function normalizeRawUsage(value: unknown): RawUsage | null {
  if (value == null || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const input = ensureNumber(record.input_tokens)
  const cached = ensureNumber(
    record.cached_input_tokens ?? record.cache_read_input_tokens,
  )
  const output = ensureNumber(record.output_tokens)
  const reasoning = ensureNumber(record.reasoning_output_tokens)
  const total = ensureNumber(record.total_tokens)

  return {
    input_tokens: input,
    cached_input_tokens: cached,
    output_tokens: output,
    reasoning_output_tokens: reasoning,
    total_tokens: total > 0 ? total : input + output,
  }
}

function subtractRawUsage(
  current: RawUsage,
  previous: RawUsage | null,
): RawUsage {
  return {
    input_tokens: Math.max(
      current.input_tokens - (previous?.input_tokens ?? 0),
      0,
    ),
    cached_input_tokens: Math.max(
      current.cached_input_tokens - (previous?.cached_input_tokens ?? 0),
      0,
    ),
    output_tokens: Math.max(
      current.output_tokens - (previous?.output_tokens ?? 0),
      0,
    ),
    reasoning_output_tokens: Math.max(
      current.reasoning_output_tokens -
        (previous?.reasoning_output_tokens ?? 0),
      0,
    ),
    total_tokens: Math.max(
      current.total_tokens - (previous?.total_tokens ?? 0),
      0,
    ),
  }
}

function convertToDelta(
  raw: RawUsage,
): Omit<TokenUsageEvent, 'sessionId' | 'timestamp' | 'model'> {
  const total =
    raw.total_tokens > 0
      ? raw.total_tokens
      : raw.input_tokens + raw.output_tokens
  const cached = Math.min(raw.cached_input_tokens, raw.input_tokens)

  return {
    inputTokens: raw.input_tokens,
    cachedInputTokens: cached,
    outputTokens: raw.output_tokens,
    reasoningOutputTokens: raw.reasoning_output_tokens,
    totalTokens: total,
  }
}

function extractModel(value: unknown): string | undefined {
  if (value == null || typeof value !== 'object') {
    return undefined
  }

  const payload = value as Record<string, unknown>

  // Check info field
  if (payload.info != null && typeof payload.info === 'object') {
    const info = payload.info as Record<string, unknown>
    const directCandidates = [info.model, info.model_name]
    for (const candidate of directCandidates) {
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate.trim()
      }
    }

    if (info.metadata != null && typeof info.metadata === 'object') {
      const metadata = info.metadata as Record<string, unknown>
      if (typeof metadata.model === 'string' && metadata.model.trim() !== '') {
        return metadata.model.trim()
      }
    }
  }

  // Check direct model field
  if (typeof payload.model === 'string' && payload.model.trim() !== '') {
    return payload.model.trim()
  }

  // Check metadata field
  if (payload.metadata != null && typeof payload.metadata === 'object') {
    const metadata = payload.metadata as Record<string, unknown>
    if (typeof metadata.model === 'string' && metadata.model.trim() !== '') {
      return metadata.model.trim()
    }
  }

  return undefined
}

async function findSessionFiles(sessionDir: string): Promise<string[]> {
  try {
    const { glob } = await import('tinyglobby')
    return await glob('**/*.jsonl', {
      cwd: sessionDir,
      absolute: true,
    })
  } catch {
    return []
  }
}

export async function loadCodexTokenUsageEvents(): Promise<TokenUsageEvent[]> {
  const codexHomeEnv = process.env[CODEX_HOME_ENV]?.trim()
  const codexHome =
    codexHomeEnv != null && codexHomeEnv !== ''
      ? path.resolve(codexHomeEnv)
      : DEFAULT_CODEX_DIR
  const sessionDir = path.join(codexHome, DEFAULT_SESSION_SUBDIR)

  // Check if directory exists
  try {
    const stats = await stat(sessionDir)
    if (!stats.isDirectory()) {
      return []
    }
  } catch {
    return []
  }

  const files = await findSessionFiles(sessionDir)
  const events: TokenUsageEvent[] = []
  const LEGACY_FALLBACK_MODEL = 'gpt-5'

  for (const file of files) {
    const relativeSessionPath = path.relative(sessionDir, file)
    const normalizedSessionPath = relativeSessionPath.split(path.sep).join('/')
    const sessionId = normalizedSessionPath.replace(/\.jsonl$/i, '')

    try {
      const fileContent = await readFile(file, 'utf8')
      let previousTotals: RawUsage | null = null
      let currentModel: string | undefined
      let currentModelIsFallback = false

      const lines = fileContent.split(/\r?\n/)
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed === '') continue

        let parsed: unknown
        try {
          parsed = JSON.parse(trimmed)
        } catch {
          continue
        }

        if (parsed == null || typeof parsed !== 'object') continue
        const entry = parsed as Record<string, unknown>

        const entryType = entry.type
        const payload = entry.payload
        const timestamp = entry.timestamp

        // Handle turn_context for model info
        if (entryType === 'turn_context') {
          if (payload != null && typeof payload === 'object') {
            const contextModel = extractModel(payload)
            if (contextModel != null) {
              currentModel = contextModel
              currentModelIsFallback = false
            }
          }
          continue
        }

        // Only process event_msg with token_count
        if (entryType !== 'event_msg') continue
        if (payload == null || typeof payload !== 'object') continue

        const payloadObj = payload as Record<string, unknown>
        if (payloadObj.type !== 'token_count') continue
        if (typeof timestamp !== 'string') continue

        const info = payloadObj.info
        if (info == null || typeof info !== 'object') continue

        const infoObj = info as Record<string, unknown>
        const lastUsage = normalizeRawUsage(infoObj.last_token_usage)
        const totalUsage = normalizeRawUsage(infoObj.total_token_usage)

        let raw = lastUsage
        if (raw == null && totalUsage != null) {
          raw = subtractRawUsage(totalUsage, previousTotals)
        }

        if (totalUsage != null) {
          previousTotals = totalUsage
        }

        if (raw == null) continue

        const delta = convertToDelta(raw)
        if (
          delta.inputTokens === 0 &&
          delta.cachedInputTokens === 0 &&
          delta.outputTokens === 0 &&
          delta.reasoningOutputTokens === 0
        ) {
          continue
        }

        const extractionSource = Object.assign({}, payloadObj, { info })
        const extractedModel = extractModel(extractionSource)
        let isFallbackModel = false

        if (extractedModel != null) {
          currentModel = extractedModel
          currentModelIsFallback = false
        }

        let model = extractedModel ?? currentModel
        if (model == null) {
          model = LEGACY_FALLBACK_MODEL
          isFallbackModel = true
          currentModel = model
          currentModelIsFallback = true
        } else if (extractedModel == null && currentModelIsFallback) {
          isFallbackModel = true
        }

        const event: TokenUsageEvent = {
          sessionId,
          timestamp,
          model,
          ...delta,
        }

        if (isFallbackModel) {
          event.isFallbackModel = true
        }

        events.push(event)
      }
    } catch (error) {
      console.debug('Failed to read Codex session file', error)
      continue
    }
  }

  events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  return events
}
