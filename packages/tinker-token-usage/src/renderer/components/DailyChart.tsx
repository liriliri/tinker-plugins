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
    const costs = usageData.byDay.map((day) => day.totalCost)

    return {
      dates,
      rawDates,
      inputTokens,
      outputTokens,
      totalTokens,
      costs,
    }
  }, [usageData])

  // Initialize with full date range
  useEffect(() => {
    if (chartData && chartData.rawDates.length > 0) {
      const startDate = chartData.rawDates[0]
      const endDate = chartData.rawDates[chartData.rawDates.length - 1]
      store.setDateRange(startDate, endDate)
    }
  }, [chartData])

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

  return (
    <div className="p-4">
      <ReactECharts
        style={{ height: 400 }}
        onEvents={{
          dataZoom: handleDataZoom,
        }}
        option={{
          backgroundColor: 'transparent',
          color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'],
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'rgba(148, 163, 184, 0.35)',
            textStyle: { color: '#0f172a' },
            formatter: (params: any) => {
              let result = `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].axisValue}</div>`
              params.forEach((param: any) => {
                if (param.seriesName === t('cost')) {
                  result += `<div style="margin: 2px 0;">${param.marker} ${param.seriesName}: $${param.value.toFixed(4)}</div>`
                } else {
                  result += `<div style="margin: 2px 0;">${param.marker} ${param.seriesName}: ${formatNumber(param.value)}</div>`
                }
              })
              return result
            },
          },
          legend: {
            data: [
              t('inputTokens'),
              t('outputTokens'),
              t('totalTokens'),
              t('cost'),
            ],
            selected: {
              [t('inputTokens')]: true,
              [t('outputTokens')]: true,
              [t('totalTokens')]: false,
              [t('cost')]: true,
            },
            textStyle: { color: '#64748b' },
            top: 10,
            left: 'center',
          },
          grid: { left: 60, right: 60, top: 50, bottom: 80 },
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
              name: 'cost ($)',
              position: 'right',
              axisLabel: {
                color: '#64748b',
                formatter: (value: number) => `$${value.toFixed(4)}`,
              },
              splitLine: { show: false },
            },
          ],
          series: [
            {
              name: t('inputTokens'),
              type: 'line',
              smooth: true,
              data: chartData.inputTokens,
              yAxisIndex: 0,
            },
            {
              name: t('outputTokens'),
              type: 'line',
              smooth: true,
              data: chartData.outputTokens,
              yAxisIndex: 0,
            },
            {
              name: t('totalTokens'),
              type: 'line',
              smooth: true,
              data: chartData.totalTokens,
              yAxisIndex: 0,
            },
            {
              name: t('cost'),
              type: 'line',
              smooth: true,
              data: chartData.costs,
              yAxisIndex: 1,
            },
          ],
        }}
      />
    </div>
  )
})

export default DailyChart
