import isStr from 'licia/isStr'
import trim from 'licia/trim'

export async function translateWithAI(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  const fromLabel = from === 'auto' ? 'auto-detected' : from
  const systemPrompt = `You are a professional translator. Translate the user's text from ${fromLabel} to ${to}. Output only the translated text without any explanation or extra content.`

  const result = await tinker.callAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
  })

  if (!isStr(result.content) || !result.content) {
    throw new Error('Invalid AI response')
  }

  return trim(result.content)
}
