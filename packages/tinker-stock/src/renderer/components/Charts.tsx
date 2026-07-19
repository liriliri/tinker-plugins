import { useEffect, useMemo, useRef } from 'react'
import {
  dispose,
  init,
  type Chart,
  type CandleType,
  type DeepPartial,
  type KLineData,
  type Period,
  type Styles,
} from 'klinecharts'
import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import isNaN from 'licia/isNaN'
import map from 'licia/map'
import sortBy from 'licia/sortBy'
import { tw } from '../theme'
import type { KlineBar, KlinePeriod, MinutePoint } from '../../common/types'

const UP = '#d12b3a'
const DOWN = '#0d8a6a'
const FLAT = '#737373'
const BRASS = '#2f5bd8'
const MINUTE_PERIOD: Period = { span: 1, type: 'minute' }

const PERIOD_MAP: Record<KlinePeriod, Period> = {
  day: { span: 1, type: 'day' },
  week: { span: 1, type: 'week' },
  month: { span: 1, type: 'month' },
  season: { span: 3, type: 'month' },
  year: { span: 1, type: 'year' },
}

function dateToTimestamp(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return NaN
  return new Date(y, m - 1, d).getTime()
}

function minuteTimeToTimestamp(time: string): number {
  const digits = time.replace(/\D/g, '').padStart(4, '0')
  const hh = Number(digits.slice(0, 2))
  const mm = Number(digits.slice(2, 4))
  const day = new Date()
  day.setHours(hh, mm, 0, 0)
  return day.getTime()
}

function barsToData(bars: KlineBar[]): KLineData[] {
  return filter(
    map(
      sortBy(bars, (bar) => bar.date),
      (bar) => ({
        timestamp: dateToTimestamp(bar.date),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.last,
        volume: bar.volume,
        turnover: bar.amount,
      }),
    ),
    (bar) => !isNaN(bar.timestamp),
  )
}

function pointsToData(points: MinutePoint[]): KLineData[] {
  return filter(
    map(points, (point) => ({
      timestamp: minuteTimeToTimestamp(point.time),
      open: point.price,
      high: point.price,
      low: point.price,
      close: point.price,
      volume: point.volume,
      turnover: point.amount,
    })),
    (bar) => !isNaN(bar.timestamp),
  )
}

function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark')
}

function buildStyles(
  dark: boolean,
  candleType: CandleType,
  areaColor: string,
): DeepPartial<Styles> {
  const grid = dark ? '#2c2c2c' : '#e4e4e4'
  const text = dark ? '#969696' : '#737373'
  const axis = dark ? '#2c2c2c' : '#e4e4e4'
  const tooltipBg = dark ? '#1f1f1f' : '#ffffff'
  return {
    grid: {
      horizontal: { color: grid },
      vertical: { color: grid },
    },
    candle: {
      type: candleType,
      bar: {
        upColor: UP,
        downColor: DOWN,
        noChangeColor: FLAT,
        upBorderColor: UP,
        downBorderColor: DOWN,
        noChangeBorderColor: FLAT,
        upWickColor: UP,
        downWickColor: DOWN,
        noChangeWickColor: FLAT,
      },
      area: {
        lineSize: 1.75,
        lineColor: areaColor,
        smooth: false,
        value: 'close',
        backgroundColor: [
          { offset: 0, color: `${areaColor}03` },
          { offset: 1, color: `${areaColor}33` },
        ],
        point: {
          show: false,
          animation: false,
        },
      },
      priceMark: {
        high: { color: text },
        low: { color: text },
        last: {
          upColor: UP,
          downColor: DOWN,
          noChangeColor: FLAT,
        },
      },
      tooltip: {
        rect: {
          color: tooltipBg,
          borderColor: grid,
        },
        title: { color: text },
        legend: { color: text },
      },
    },
    xAxis: {
      axisLine: { color: axis },
      tickText: { color: text },
      tickLine: { color: axis },
    },
    yAxis: {
      axisLine: { color: axis },
      tickText: { color: text },
      tickLine: { color: axis },
    },
    separator: { color: axis },
    crosshair: {
      horizontal: {
        line: { color: text },
        text: { borderColor: text, backgroundColor: text },
      },
      vertical: {
        line: { color: text },
        text: { borderColor: text, backgroundColor: text },
      },
    },
  }
}

interface ChartCanvasProps {
  data: KLineData[]
  symbol: string
  period: Period
  candleType: CandleType
  areaColor?: string
  prevClose?: number
}

function ChartCanvas({
  data,
  symbol,
  period,
  candleType,
  areaColor = UP,
  prevClose,
}: ChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const dataRef = useRef(data)
  const styleRef = useRef({ candleType, areaColor })
  const overlayIdRef = useRef<string | null>(null)
  dataRef.current = data
  styleRef.current = { candleType, areaColor }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const chart = init(el, {
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
      styles: buildStyles(isDarkTheme(), candleType, areaColor),
      layout: {
        barSpaceLimit: { min: 1, max: 36 },
      },
    })
    if (!chart) return
    chartRef.current = chart

    chart.setSymbol({
      ticker: symbol || 'STOCK',
      pricePrecision: 2,
      volumePrecision: 0,
    })
    chart.setPeriod(period)
    chart.setDataLoader({
      getBars: ({ callback }) => {
        callback(dataRef.current)
      },
    })

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)

    const syncTheme = () => {
      const { candleType: type, areaColor: color } = styleRef.current
      chart.setStyles(buildStyles(isDarkTheme(), type, color))
    }
    const mo = new MutationObserver(syncTheme)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      mo.disconnect()
      ro.disconnect()
      dispose(el)
      chartRef.current = null
      overlayIdRef.current = null
    }
    // Chart instance is created once; later prop changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    chart.setSymbol({
      ticker: symbol || 'STOCK',
      pricePrecision: 2,
      volumePrecision: 0,
    })
  }, [symbol])

  useEffect(() => {
    chartRef.current?.setPeriod(period)
  }, [period])

  useEffect(() => {
    chartRef.current?.setStyles(
      buildStyles(isDarkTheme(), candleType, areaColor),
    )
  }, [candleType, areaColor])

  useEffect(() => {
    chartRef.current?.resetData()
  }, [data])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    if (overlayIdRef.current) {
      chart.removeOverlay({ id: overlayIdRef.current })
      overlayIdRef.current = null
    }
    if (!prevClose || isEmpty(data)) return
    const id = chart.createOverlay({
      name: 'priceLine',
      lock: true,
      points: [{ timestamp: data[0].timestamp, value: prevClose }],
      styles: {
        line: {
          color: BRASS,
          style: 'dashed',
          size: 1,
          dashedValue: [4, 4],
        },
        text: {
          color: '#ffffff',
          backgroundColor: FLAT,
          borderColor: FLAT,
        },
      },
    })
    if (typeof id === 'string') overlayIdRef.current = id
  }, [data, prevClose])

  return <div ref={containerRef} className="w-full h-56" />
}

function EmptyChart() {
  return (
    <div
      className={`h-56 flex items-center justify-center border ${tw.border.default}`}
    >
      <span className={tw.text.muted}>--</span>
    </div>
  )
}

interface MinuteChartProps {
  points: MinutePoint[]
  prevClose?: number
  symbol?: string
}

export function MinuteChart({
  points,
  prevClose,
  symbol = 'STOCK',
}: MinuteChartProps) {
  const data = useMemo(() => pointsToData(points), [points])
  const areaColor = useMemo(() => {
    const last = data[data.length - 1]?.close
    if (!prevClose || isNaN(prevClose) || last == null) return UP
    return last >= prevClose ? UP : DOWN
  }, [data, prevClose])

  if (isEmpty(data)) return <EmptyChart />

  return (
    <div className={`border ${tw.border.default} overflow-hidden rounded-sm`}>
      <ChartCanvas
        data={data}
        symbol={symbol}
        period={MINUTE_PERIOD}
        candleType="area"
        areaColor={areaColor}
        prevClose={prevClose}
      />
    </div>
  )
}

interface KlineChartProps {
  bars: KlineBar[]
  period?: KlinePeriod
  symbol?: string
}

export function KlineChart({
  bars,
  period = 'day',
  symbol = 'STOCK',
}: KlineChartProps) {
  const data = useMemo(() => barsToData(bars), [bars])

  if (isEmpty(data)) return <EmptyChart />

  return (
    <div className={`border ${tw.border.default} overflow-hidden rounded-sm`}>
      <ChartCanvas
        data={data}
        symbol={symbol}
        period={PERIOD_MAP[period]}
        candleType="candle_solid"
      />
    </div>
  )
}
