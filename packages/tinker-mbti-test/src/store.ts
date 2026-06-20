import { makeAutoObservable } from 'mobx'
import type { Choice, MBTIType, Screen } from './types'
import { getQuestions, computeMBTIType } from './data/questions'
import findIdx from 'licia/findIdx'
import keys from 'licia/keys'

class Store {
  screen: Screen = 'intro'
  currentQuestion = 0
  answers: Record<number, Choice> = {}
  resultType: MBTIType | null = null

  constructor() {
    makeAutoObservable(this)
  }

  get totalQuestions() {
    return getQuestions('en-US').length
  }

  get answeredCount() {
    return keys(this.answers).length
  }

  get progress() {
    return this.totalQuestions > 0
      ? this.answeredCount / this.totalQuestions
      : 0
  }

  get isComplete() {
    return this.answeredCount === this.totalQuestions
  }

  get currentAnswer(): Choice | undefined {
    const q = getQuestions('en-US')[this.currentQuestion]
    return q ? this.answers[q.id] : undefined
  }

  get dimensionScores() {
    return computeMBTIType(this.answers)
  }

  startTest() {
    this.screen = 'question'
    this.currentQuestion = 0
    this.answers = {}
    this.resultType = null
  }

  answer(questionId: number, choice: Choice) {
    this.answers[questionId] = choice

    const qs = getQuestions('en-US')
    const currentIdx = findIdx(qs, (q) => q.id === questionId)
    if (currentIdx < this.totalQuestions - 1) {
      this.currentQuestion = currentIdx + 1
    }
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.totalQuestions) {
      this.currentQuestion = index
    }
  }

  goToPrev() {
    if (this.currentQuestion > 0) {
      this.currentQuestion--
    }
  }

  goToNext() {
    if (this.currentQuestion < this.totalQuestions - 1) {
      this.currentQuestion++
    }
  }

  showResult() {
    const { type } = this.dimensionScores
    this.resultType = type as MBTIType
    this.screen = 'result'
  }

  restart() {
    this.screen = 'intro'
    this.currentQuestion = 0
    this.answers = {}
    this.resultType = null
  }
}

export const store = new Store()
