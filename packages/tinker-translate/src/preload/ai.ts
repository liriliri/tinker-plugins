import safeGet from 'licia/safeGet'
import trim from 'licia/trim'
import type { TranslateResult } from './types'

export async function translateWithAI(
  text: string,
  from: string,
  to: string,
): Promise<TranslateResult> {
  const fromLabel = from === 'auto' ? 'auto-detected' : from
  const systemPrompt = `You are a professional translator. Translate the user's text from ${fromLabel} to ${to}. Output only the translated text without any explanation or extra content.`

  const result = await tinker.callAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
  })

  const content = safeGet(result, 'data.content')
  if (!result.success || !content) {
    throw new Error(result.error ?? 'Invalid AI response')
  }

  return { text: trim(content as string) }
}
