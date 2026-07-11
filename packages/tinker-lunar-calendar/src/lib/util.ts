import { Solar, Lunar, SolarMonth, HolidayUtil } from 'lunar-javascript'
import map from 'licia/map'
import range from 'licia/range'
import concat from 'licia/concat'
import contain from 'licia/contain'
import isEmpty from 'licia/isEmpty'
import isEqual from 'licia/isEqual'
import type { DayCell, DateInfo, TodayRef } from '../types'

const CALENDAR_CELL_COUNT = 42

function buildDayCell(
  solar: ReturnType<typeof Solar.fromYmd>,
  isCurrentMonth: boolean,
  today: TodayRef,
): DayCell {
  const year = solar.getYear()
  const month = solar.getMonth()
  const day = solar.getDay()
  const lunar = Lunar.fromSolar(solar)
  const weekday = solar.getWeek()

  const solarFestivals: string[] = solar.getFestivals()
  const lunarFestivals: string[] = lunar.getFestivals()
  const festival = solarFestivals[0] || lunarFestivals[0] || ''
  const jieQi = lunar.getJieQi()

  let lunarLabel = festival || jieQi
  if (isEmpty(lunarLabel)) {
    lunarLabel =
      lunar.getDay() === 1
        ? lunar.getMonthInChinese() + '月'
        : lunar.getDayInChinese()
  }

  const holiday = HolidayUtil.getHoliday(year, month, day)
  const isWorkday = !!(holiday && holiday.isWork())
  const isHoliday = !!(holiday && !holiday.isWork())

  return {
    year,
    month,
    day,
    lunarLabel,
    isCurrentMonth,
    isToday: isEqual({ year, month, day }, today),
    isWeekend: contain([0, 6], weekday),
    isHoliday,
    isWorkday,
    hasFestival: !isEmpty(festival) || !isEmpty(jieQi),
  }
}

export function buildMonthGrid(year: number, month: number): DayCell[] {
  const today = getTodaySolar()
  const thisMonth = SolarMonth.fromYm(year, month)
  const firstWeekday = Solar.fromYmd(year, month, 1).getWeek()
  const startOffset = firstWeekday === 0 ? 7 : firstWeekday

  const prevMonthObj = thisMonth.next(-1)
  const prevYear = prevMonthObj.getYear()
  const prevMonth = prevMonthObj.getMonth()
  const prevMonthDays = new Date(prevYear, prevMonth, 0).getDate()

  const prevCells = map(range(startOffset - 1, 0, -1), (i) =>
    buildDayCell(
      Solar.fromYmd(prevYear, prevMonth, prevMonthDays - i + 1),
      false,
      today,
    ),
  )

  const currentCells = map(thisMonth.getDays(), (solar) =>
    buildDayCell(solar, true, today),
  )

  const nextMonthObj = thisMonth.next(1)
  const nextYear = nextMonthObj.getYear()
  const nextMonth = nextMonthObj.getMonth()
  const remaining = CALENDAR_CELL_COUNT - prevCells.length - currentCells.length

  const nextCells = map(range(1, remaining + 1), (i) =>
    buildDayCell(Solar.fromYmd(nextYear, nextMonth, i), false, today),
  )

  return concat(prevCells, currentCells, nextCells)
}

export function buildDateInfo(
  year: number,
  month: number,
  day: number,
): DateInfo {
  const solar = Solar.fromYmd(year, month, day)
  const lunar = Lunar.fromSolar(solar)

  let jieQiStr = lunar.getJieQi()
  if (isEmpty(jieQiStr)) {
    const prev = lunar.getPrevJieQi()
    const next = lunar.getNextJieQi()
    if (prev && next) jieQiStr = `${prev.getName()} → ${next.getName()}`
  }

  return {
    weekday: solar.getWeek(),
    lunarFull: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganZhiYear: lunar.getYearInGanZhi(),
    ganZhiMonth: lunar.getMonthInGanZhi(),
    ganZhiDay: lunar.getDayInGanZhi(),
    shengXiao: lunar.getYearShengXiao(),
    xingZuo: solar.getXingZuo(),
    jieQi: jieQiStr,
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
    chong: lunar.getDayChongDesc(),
    sha: lunar.getDaySha(),
    pengZu: lunar.getPengZuGan() + ' ' + lunar.getPengZuZhi(),
  }
}

export function getGanZhiYearShengXiao(
  year: number,
  month: number,
): { ganZhiYear: string; shengXiao: string } {
  const lunar = Lunar.fromSolar(Solar.fromYmd(year, month, 1))
  return {
    ganZhiYear: lunar.getYearInGanZhi(),
    shengXiao: lunar.getYearShengXiao(),
  }
}

export function getTodaySolar(): TodayRef {
  const today = Solar.fromDate(new Date())
  return {
    year: today.getYear(),
    month: today.getMonth(),
    day: today.getDay(),
  }
}
