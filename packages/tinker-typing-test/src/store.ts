import { makeAutoObservable, runInAction } from 'mobx'
import random from 'licia/random'
import { articles } from './data/articles'
import {
  analyzeTyping,
  calculateWPM,
  calculateCPM,
  calculateAccuracy,
  normalizeSpecialChars,
} from './lib/typing'

interface CpmHistoryPoint {
  time: number
  cpm: number
  accuracy: number
}

type Status = 'idle' | 'running' | 'finished'

const DURATION = 60

class Store {
  status: Status = 'idle'
  displayText = ''
  typedText = ''
  correctChars = 0
  errors = 0
  wpm = 0
  cpm = 0
  accuracy = 100
  timeLeft = DURATION
  startTime: number | null = null
  cpmHistory: CpmHistoryPoint[] = []
  lastCorrectChars = 0
  language = 'en-US'

  private timerHandle: ReturnType<typeof setInterval> | null = null

  constructor() {
    makeAutoObservable(this)
  }

  get isEnglish() {
    return this.language !== 'zh-CN'
  }

  get normalizedDisplay() {
    return normalizeSpecialChars(this.displayText).normalize('NFC')
  }

  get normalizedTyped() {
    return normalizeSpecialChars(this.typedText).normalize('NFC')
  }

  get chars(): string[] {
    return [...this.normalizedDisplay]
  }

  setLanguage(lang: string) {
    this.language = lang
    this.initTest()
  }

  initTest() {
    this.stopTimer()

    const pool = this.isEnglish ? articles.en : articles.zh
    const text = pool[random(0, pool.length - 1)]

    this.status = 'idle'
    this.displayText = normalizeSpecialChars(text).normalize('NFC')
    this.typedText = ''
    this.correctChars = 0
    this.errors = 0
    this.wpm = 0
    this.cpm = 0
    this.accuracy = 100
    this.timeLeft = DURATION
    this.startTime = null
    this.cpmHistory = []
    this.lastCorrectChars = 0
  }

  startTest() {
    this.status = 'running'
    this.startTime = Date.now()
    this.startTimer()
  }

  handleInput(char: string) {
    if (this.status === 'finished') return
    if (this.typedText.length >= this.displayText.length) return

    if (this.status === 'idle') {
      this.startTest()
    }

    this.typedText += char
    this.updateTypingStats()
  }

  handleBackspace() {
    if (this.status === 'finished' || this.typedText.length === 0) return

    this.typedText = this.typedText.slice(0, -1)
    this.updateTypingStats()
  }

  tick() {
    if (this.status !== 'running') return

    const newTimeLeft = this.timeLeft - 1
    const elapsedSeconds = this.startTime
      ? (Date.now() - this.startTime) / 1000
      : 0

    this.wpm = this.isEnglish
      ? calculateWPM(this.correctChars, elapsedSeconds)
      : 0
    this.cpm = calculateCPM(this.correctChars, elapsedSeconds)

    const charsDelta = this.correctChars - this.lastCorrectChars
    const instantCpm = Math.max(0, Math.round(charsDelta * 60))

    this.cpmHistory = [
      ...this.cpmHistory,
      {
        time: Math.floor(elapsedSeconds),
        cpm: instantCpm,
        accuracy: this.accuracy,
      },
    ]
    this.lastCorrectChars = this.correctChars

    if (newTimeLeft <= 0) {
      this.timeLeft = 0
      this.finishTest()
    } else {
      this.timeLeft = newTimeLeft
    }
  }

  finishTest() {
    this.status = 'finished'
    this.stopTimer()
  }

  resetTest() {
    this.initTest()
  }

  private startTimer() {
    this.stopTimer()
    this.timerHandle = setInterval(() => {
      runInAction(() => this.tick())
    }, 1000)
  }

  private updateTypingStats() {
    const analysis = analyzeTyping(this.displayText, this.typedText)
    this.correctChars = analysis.correctChars
    this.errors = analysis.errors
    this.accuracy = calculateAccuracy(
      analysis.correctChars,
      analysis.totalTyped,
    )
  }

  private stopTimer() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle)
      this.timerHandle = null
    }
  }
}

const store = new Store()
export default store
