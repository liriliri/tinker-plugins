import { makeAutoObservable } from 'mobx'
import { SolarMonth } from 'lunar-javascript'
import isEqual from 'licia/isEqual'
import {
  buildMonthGrid,
  buildDateInfo,
  getTodaySolar,
  getGanZhiYearShengXiao,
} from './lib/util'
import type { DayCell, DateInfo } from './types'
import { createMcpApi } from './mcp'

export class Store {
  readonly mcp = createMcpApi(() => this)

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
    makeAutoObservable(this, {
      mcp: false,
    })
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

  selectDate(year: number, month: number, day: number) {
    if (
      isEqual(
        { year, month, day },
        {
          year: this.selectedYear,
          month: this.selectedMonth,
          day: this.selectedDay,
        },
      )
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

  get ganZhiYearShengXiao() {
    return getGanZhiYearShengXiao(this.currentYear, this.currentMonth)
  }
}

const store = new Store()
export default store
