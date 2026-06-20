import type { Choice, Dimension } from '../types'
import questionsEn from './questions.en-US.json'
import questionsZh from './questions.zh-CN.json'
import each from 'licia/each'

export interface Question {
  id: number
  text: string
  optionA: string
  optionB: string
  dimension: Dimension
}

type LocaleQuestions = Record<string, Question[]>

const localeQuestions: LocaleQuestions = {
  'en-US': questionsEn as Question[],
  'zh-CN': questionsZh as Question[],
} as const

export function getQuestions(locale: string): Question[] {
  return localeQuestions[locale] || questionsEn
}

export function computeMBTIType(
  answers: Record<number, Choice>,
  locale = 'en-US',
) {
  const questions = getQuestions(locale)
  let E = 0,
    I = 0,
    S = 0,
    N = 0,
    T = 0,
    F = 0,
    J = 0,
    P = 0

  each(questions, (q) => {
    const choice = answers[q.id]
    if (choice == null) return

    switch (q.dimension) {
      case 'EI':
        choice === 'a' ? E++ : I++
        break
      case 'SN':
        choice === 'a' ? S++ : N++
        break
      case 'TF':
        choice === 'a' ? T++ : F++
        break
      case 'JP':
        choice === 'a' ? J++ : P++
        break
    }
  })

  return {
    type: `${E > I ? 'E' : 'I'}${S > N ? 'S' : 'N'}${T > F ? 'T' : 'F'}${J > P ? 'J' : 'P'}`,
    scores: { E, I, S, N, T, F, J, P },
  }
}
