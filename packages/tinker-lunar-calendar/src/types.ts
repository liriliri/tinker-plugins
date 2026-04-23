export interface DayCell {
  year: number
  month: number
  day: number
  lunarLabel: string
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  isHoliday: boolean
  isWorkday: boolean
  hasFestival: boolean
}

export interface DateInfo {
  weekday: number
  lunarFull: string
  ganZhiYear: string
  ganZhiMonth: string
  ganZhiDay: string
  shengXiao: string
  xingZuo: string
  jieQi: string
  yi: string[]
  ji: string[]
  chong: string
  sha: string
  pengZu: string
}

export interface TodayRef {
  year: number
  month: number
  day: number
}
