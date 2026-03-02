import { useTranslation } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useMemo, useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import className from 'licia/className'
import { formatNumber, formatDate } from '../lib/format'
import store from '../store'
import { tw } from '../theme'

const DailyChart = observer(() => {
  const { t, i18n } = useTranslation()
  const { usageData } = store
  const [zoom, setZoom] = useState<{ start: number; end: number } | null>(null)

  const chartData = useMemo(() => {
    if (!usageData || !usageData.byDay || usageData.byDay.length === 0) {
      return null
    }

    // Use the current i18n language for date formatting
    const locale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US'
    const dates = usageData.byDay.map((day) => formatDate(day.date, locale))
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
  }, [usageData, i18n.language])

  // Reset zoom when data changes
  useEffect(() => {
    setZoom(null)
  }, [usageData])

  const handleDataZoom = (params: {
    batch?: Array<{ start: number; end: number }>
    start?: number
    end?: number
  }) => {
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
      <div className={className('p-8 flex justify-center items-center')}>
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          style={{
            borderColor: `${tw.chart.spinner} transparent ${tw.chart.spinner} transparent`,
          }}
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    )
  }

  const chartOption = {
    backgroundColor: 'transparent',
    color: tw.chart.colors,
    tooltip: {
      trigger: 'axis',
      backgroundColor: tw.chart.tooltip.background,
      borderColor: tw.chart.tooltip.border,
      textStyle: { color: tw.chart.tooltip.text },
      formatter: (
        params: Array<{
          axisValue: string
          marker: string
          seriesName: string
          value: number
        }>,
      ) => {
        let result = `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].axisValue}</div>`
        params.forEach((param) => {
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
        borderColor: tw.chart.zoom.border,
        fillerColor: tw.chart.zoom.filler,
        handleStyle: { color: tw.chart.zoom.handle },
        start: zoom?.start,
        end: zoom?.end,
      },
    ],
    xAxis: {
      type: 'category',
      data: chartData.dates,
      axisLabel: { hideOverlap: true, color: tw.chart.axis.label },
      axisLine: { lineStyle: { color: tw.chart.axis.line } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'tokens',
        position: 'left',
        axisLabel: {
          color: tw.chart.axis.label,
          formatter: (value: number) => formatNumber(value),
        },
        splitLine: { lineStyle: { color: tw.chart.axis.split } },
      },
      {
        type: 'value',
        name: t('sessionCount'),
        position: 'right',
        axisLabel: {
          color: tw.chart.axis.label,
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
        itemStyle: { color: tw.chart.colors[0] },
        lineStyle: { color: tw.chart.colors[0] },
      },
      store.seriesVisibility.outputTokens && {
        name: t('outputTokens'),
        type: 'line',
        smooth: true,
        data: chartData.outputTokens,
        yAxisIndex: 0,
        itemStyle: { color: tw.chart.colors[1] },
        lineStyle: { color: tw.chart.colors[1] },
      },
      store.seriesVisibility.totalTokens && {
        name: t('totalTokens'),
        type: 'line',
        smooth: true,
        data: chartData.totalTokens,
        yAxisIndex: 0,
        itemStyle: { color: tw.chart.colors[2] },
        lineStyle: { color: tw.chart.colors[2] },
      },
      store.seriesVisibility.sessionCount && {
        name: t('sessionCount'),
        type: 'line',
        smooth: true,
        data: chartData.sessionCounts,
        yAxisIndex: 1,
        itemStyle: { color: tw.chart.colors[3] },
        lineStyle: { color: tw.chart.colors[3] },
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
