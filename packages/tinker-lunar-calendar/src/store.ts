import { makeAutoObservable } from 'mobx'
import { SolarMonth } from 'lunar-javascript'
import { buildMonthGrid, buildDateInfo, getTodaySolar } from './lib/util'
import type { DayCell, DateInfo } from './types'

class Store {
  currentYear: number
  currentMonth: number
  selectedYear: number
  selectedMonth: number
  selectedDay: number

  constructor() {
    const today = getTodaySolar()
    this.currentYear = today.year
    this.currentMonth = today.month
    this.selectedYear = today.year
    this.selectedMonth = today.month
    this.selectedDay = today.day
    makeAutoObservable(this)
  }

  prevMonth() {
    const m = SolarMonth.fromYm(this.currentYear, this.currentMonth).next(-1)
    this.currentYear = m.getYear()
    this.currentMonth = m.getMonth()
  }

  nextMonth() {
    const m = SolarMonth.fromYm(this.currentYear, this.currentMonth).next(1)
    this.currentYear = m.getYear()
    this.currentMonth = m.getMonth()
  }

  goToday() {
    const today = getTodaySolar()
    this.selectDate(today.year, today.month, today.day)
  }

  selectDate(year: number, month: number, day: number) {
    if (
      year === this.selectedYear &&
      month === this.selectedMonth &&
      day === this.selectedDay
    ) {
      return
    }
    this.selectedYear = year
    this.selectedMonth = month
    this.selectedDay = day
    if (month !== this.currentMonth || year !== this.currentYear) {
      this.currentYear = year
      this.currentMonth = month
    }
  }

  get calendarDays(): DayCell[] {
    return buildMonthGrid(this.currentYear, this.currentMonth)
  }

  get selectedDateInfo(): DateInfo {
    return buildDateInfo(
      this.selectedYear,
      this.selectedMonth,
      this.selectedDay,
    )
  }
}

const store = new Store()
export default store
