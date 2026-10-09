import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import isNaN from 'licia/isNaN'
import toNum from 'licia/toNum'
import BaseStore, { storage } from 'tinker-share/store/Base'

const STORAGE_BIRTHDAY = 'birthday'
const STORAGE_LIFESPAN = 'lifespan'
const MS_PER_DAY = 86400000
const DEFAULT_BIRTHDAY = '1990-01-01'
const DEFAULT_LIFESPAN = 80

class Store extends BaseStore {
  birthday = DEFAULT_BIRTHDAY
  lifespan = DEFAULT_LIFESPAN
  now = new Date()
  showSettings = false

  constructor() {
    super()
    makeObservable(this, {
      birthday: observable,
      lifespan: observable,
      now: observable,
      showSettings: observable,
      birthDate: computed,
      deathDate: computed,
      totalLifeDays: computed,
      livedDays: computed,
      lifeProgress: computed,
      lifeDaysLeft: computed,
      livedYears: computed,
      yearStart: computed,
      yearEnd: computed,
      yearTotalDays: computed,
      yearPassedDays: computed,
      yearProgress: computed,
      yearDaysLeft: computed,
      dayProgress: computed,
      dayHoursLeft: computed,
      weekDay: computed,
      weekProgress: computed,
      weekDaysLeft: computed,
      monthStart: computed,
      monthEnd: computed,
      monthTotalDays: computed,
      monthPassedDays: computed,
      monthProgress: computed,
      monthDaysLeft: computed,
      setShowSettings: action,
      saveSettings: action,
    })
    this.loadStorage()
    this.startTimer()
  }

  get birthDate() {
    return new Date(this.birthday)
  }

  get deathDate() {
    const d = new Date(this.birthDate)
    d.setFullYear(d.getFullYear() + this.lifespan)
    return d
  }

  get totalLifeDays() {
    return Math.floor(
      (this.deathDate.getTime() - this.birthDate.getTime()) / MS_PER_DAY,
    )
  }

  get livedDays() {
    return Math.floor(
      (this.now.getTime() - this.birthDate.getTime()) / MS_PER_DAY,
    )
  }

  get lifeProgress() {
    return Math.min(Math.max(this.livedDays / this.totalLifeDays, 0), 1)
  }

  get lifeDaysLeft() {
    return Math.max(this.totalLifeDays - this.livedDays, 0)
  }

  get livedYears() {
    return Math.floor(this.livedDays / 365)
  }

  get yearStart() {
    return new Date(this.now.getFullYear(), 0, 1)
  }

  get yearEnd() {
    return new Date(this.now.getFullYear() + 1, 0, 1)
  }

  get yearTotalDays() {
    return Math.floor(
      (this.yearEnd.getTime() - this.yearStart.getTime()) / MS_PER_DAY,
    )
  }

  get yearPassedDays() {
    return Math.floor(
      (this.now.getTime() - this.yearStart.getTime()) / MS_PER_DAY,
    )
  }

  get yearProgress() {
    return this.yearPassedDays / this.yearTotalDays
  }

  get yearDaysLeft() {
    return this.yearTotalDays - this.yearPassedDays
  }

  get dayProgress() {
    return (this.now.getHours() * 60 + this.now.getMinutes()) / 1440
  }

  get dayHoursLeft() {
    return 24 - this.now.getHours()
  }

  get weekDay() {
    return this.now.getDay() === 0 ? 7 : this.now.getDay()
  }

  get weekProgress() {
    return (this.weekDay - 1 + this.dayProgress) / 7
  }

  get weekDaysLeft() {
    return 7 - this.weekDay
  }

  get monthStart() {
    return new Date(this.now.getFullYear(), this.now.getMonth(), 1)
  }

  get monthEnd() {
    return new Date(this.now.getFullYear(), this.now.getMonth() + 1, 1)
  }

  get monthTotalDays() {
    return Math.floor(
      (this.monthEnd.getTime() - this.monthStart.getTime()) / MS_PER_DAY,
    )
  }

  get monthPassedDays() {
    return this.now.getDate() - 1
  }

  get monthProgress() {
    return this.monthPassedDays / this.monthTotalDays
  }

  get monthDaysLeft() {
    return this.monthTotalDays - this.monthPassedDays
  }

  setShowSettings(show: boolean) {
    this.showSettings = show
  }

  saveSettings(birthday: string, lifespan: number) {
    this.birthday = birthday
    this.lifespan = clamp(lifespan, 1, 150)
    this.showSettings = false
    storage.set(STORAGE_BIRTHDAY, this.birthday)
    storage.set(STORAGE_LIFESPAN, this.lifespan)
  }

  private loadStorage() {
    const birthday = storage.get(STORAGE_BIRTHDAY)
    if (birthday) this.birthday = birthday

    const lifespan = storage.get(STORAGE_LIFESPAN)
    if (lifespan != null) {
      const value = clamp(toNum(lifespan), 1, 150)
      if (!isNaN(value)) this.lifespan = value
    }
  }

  private startTimer() {
    setInterval(() => {
      runInAction(() => {
        this.now = new Date()
      })
    }, 60000)
  }
}

const store = new Store()
export default store
