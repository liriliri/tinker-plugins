import { useTranslation } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useMemo, useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import className from 'licia/className'
import { tw } from '../theme'
import { formatNumber, formatDate } from '../utils/format'
import store from '../store'

const DailyChart = observer(() => {
  const { t } = useTranslation()
  const { usageData } = store
  const [zoom, setZoom] = useState<{ start: number; end: number } | null>(null)

  const chartData = useMemo(() => {
    if (!usageData || !usageData.byDay || usageData.byDay.length === 0) {
      return null
    }

    const dates = usageData.byDay.map((day) => formatDate(day.date))
    const rawDates = usageData.byDay.map((day) => day.date)
    const inputTokens = usageData.byDay.map((day) => day.inputTokens)
    const outputTokens = usageData.byDay.map((day) => day.outputTokens)
    const totalTokens = usageData.byDay.map((day) => day.totalTokens)
    const sessionCounts = usageData.byDay.map((day) => day.sessionCount)

    return {
      dates,
      rawDates,
      inputTokens,
      outputTokens,
      totalTokens,
      sessionCounts,
    }
  }, [usageData])

  // Reset zoom when data changes
  useEffect(() => {
    setZoom(null)
  }, [usageData])

  const handleDataZoom = (params: any) => {
    const payload = Array.isArray(params?.batch) ? params.batch[0] : params
    const start = typeof payload?.start === 'number' ? payload.start : null
    const end = typeof payload?.end === 'number' ? payload.end : null
    if (start == null || end == null || !chartData) return

    setZoom({ start, end })

    // Calculate date range based on zoom percentage
    if (chartData.rawDates.length > 0) {
      const totalDays = chartData.rawDates.length
      const startIndex = Math.floor((start / 100) * totalDays)
      const endIndex = Math.min(
        Math.ceil((end / 100) * totalDays) - 1,
        totalDays - 1,
      )

      const startDate = chartData.rawDates[startIndex]
      const endDate = chartData.rawDates[endIndex]
      store.setDateRange(startDate, endDate)
    }
  }

  if (!chartData) {
    return (
      <div className={className('p-8 text-center', tw.text.tertiary)}>
        {t('loading')}
      </div>
    )
  }

  const chartOption = {
    backgroundColor: 'transparent',
    color: ['#3b82f6', '#10b981', '#a855f7', '#f59e0b'],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
      textStyle: { color: '#0f172a' },
      formatter: (params: any) => {
        let result = `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].axisValue}</div>`
        params.forEach((param: any) => {
          result += `<div style="margin: 2px 0;">${param.marker} ${param.seriesName}: ${formatNumber(param.value)}</div>`
        })
        return result
      },
    },
    grid: { left: 60, right: 60, top: 30, bottom: 80 },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        start: zoom?.start,
        end: zoom?.end,
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 24,
        bottom: 20,
        borderColor: 'rgba(148, 163, 184, 0.35)',
        fillerColor: 'rgba(59, 130, 246, 0.12)',
        handleStyle: { color: 'rgba(59, 130, 246, 0.6)' },
        start: zoom?.start,
        end: zoom?.end,
      },
    ],
    xAxis: {
      type: 'category',
      data: chartData.dates,
      axisLabel: { hideOverlap: true, color: '#64748b' },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.35)' } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'tokens',
        position: 'left',
        axisLabel: {
          color: '#64748b',
          formatter: (value: number) => formatNumber(value),
        },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      {
        type: 'value',
        name: t('sessionCount'),
        position: 'right',
        axisLabel: {
          color: '#64748b',
          formatter: (value: number) => formatNumber(value),
        },
        splitLine: { show: false },
      },
    ],
    series: [
      store.seriesVisibility.inputTokens && {
        name: t('inputTokens'),
        type: 'line',
        smooth: true,
        data: chartData.inputTokens,
        yAxisIndex: 0,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { color: '#3b82f6' },
      },
      store.seriesVisibility.outputTokens && {
        name: t('outputTokens'),
        type: 'line',
        smooth: true,
        data: chartData.outputTokens,
        yAxisIndex: 0,
        itemStyle: { color: '#10b981' },
        lineStyle: { color: '#10b981' },
      },
      store.seriesVisibility.totalTokens && {
        name: t('totalTokens'),
        type: 'line',
        smooth: true,
        data: chartData.totalTokens,
        yAxisIndex: 0,
        itemStyle: { color: '#a855f7' },
        lineStyle: { color: '#a855f7' },
      },
      store.seriesVisibility.sessionCount && {
        name: t('sessionCount'),
        type: 'line',
        smooth: true,
        data: chartData.sessionCounts,
        yAxisIndex: 1,
        itemStyle: { color: '#f59e0b' },
        lineStyle: { color: '#f59e0b' },
      },
    ].filter(Boolean),
  }

  return (
    <div>
      <ReactECharts
        style={{ height: 400 }}
        onEvents={{
          dataZoom: handleDataZoom,
        }}
        option={chartOption}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  )
})

export default DailyChart
