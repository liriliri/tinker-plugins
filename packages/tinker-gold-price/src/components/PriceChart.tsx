import { useMemo, type ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Loader } from 'lucide-react'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import isFinite from 'licia/isFinite'
import last from 'licia/last'
import map from 'licia/map'
import max from 'licia/max'
import min from 'licia/min'
import pluck from 'licia/pluck'
import store from '../store'
import { formatPrice, formatTimeLabel } from '../lib/format'
import { chartColors, tw } from '../theme'

const WIDTH = 480
const HEIGHT = 180
const PAD_X = 4
const PAD_Y = 10
const GRID_RATIOS = [0.25, 0.5, 0.75]

interface ChartStatusProps {
  children: ReactNode
  error?: boolean
}

function ChartStatus({ children, error }: ChartStatusProps) {
  return (
    <div
      className={className(
        'h-full flex items-center justify-center text-[13px]',
        error ? tw.text.error : tw.text.muted,
      )}
    >
      {children}
    </div>
  )
}

const PriceChart = observer(() => {
  const { t } = useTranslation()
  const { points, chartLoading, chartError, quote } = store

  const chart = useMemo(() => {
    if (isEmpty(points)) return null

    const prices = pluck(points, 'price') as number[]
    let yMin = min(...prices)
    let yMax = max(...prices)
    if (quote && isFinite(quote.preClose)) {
      yMin = min(yMin, quote.preClose)
      yMax = max(yMax, quote.preClose)
    }
    const span = yMax - yMin || 1
    yMin -= span * 0.06
    yMax += span * 0.06
    const range = yMax - yMin

    const coords = map(points, (p, i) => {
      const x =
        PAD_X +
        (points.length === 1
          ? (WIDTH - PAD_X * 2) / 2
          : (i / (points.length - 1)) * (WIDTH - PAD_X * 2))
      const y = PAD_Y + ((yMax - p.price) / range) * (HEIGHT - PAD_Y * 2)
      return { x, y, point: p }
    })

    const line = map(
      coords,
      (c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`,
    ).join(' ')
    const lastCoord = last(coords)!
    const area = `${line} L${lastCoord.x.toFixed(2)},${HEIGHT - PAD_Y} L${coords[0].x.toFixed(2)},${HEIGHT - PAD_Y} Z`

    const up = !quote || quote.change >= 0
    const stroke = up ? chartColors.up : chartColors.down
    const fill = up ? chartColors.fillUp : chartColors.fillDown

    let baseline: number | null = null
    if (quote && isFinite(quote.preClose)) {
      baseline =
        PAD_Y + ((yMax - quote.preClose) / range) * (HEIGHT - PAD_Y * 2)
    }

    return {
      line,
      area,
      stroke,
      fill,
      baseline,
      yMin,
      yMax,
      labels: [coords[0], coords[Math.floor(coords.length / 2)], lastCoord],
      last: lastCoord,
    }
  }, [points, quote])

  return (
    <section className={tw.chart}>
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className={tw.label}>{t('realtime')}</span>
        <span className={className(tw.chartMeta, tw.text.muted)}>
          {chart
            ? `${formatPrice(chart.yMin)} – ${formatPrice(chart.yMax)}`
            : ''}
        </span>
      </div>

      <div className={tw.chartFrame}>
        {chartLoading && (
          <div className={tw.chartOverlay}>
            <Loader
              size={18}
              className={className(tw.animation.spinSlow, tw.text.muted)}
            />
          </div>
        )}

        {chartError ? (
          <ChartStatus error>{t('chartError')}</ChartStatus>
        ) : !chart ? (
          <ChartStatus>{chartLoading ? t('loading') : t('noData')}</ChartStatus>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {map(GRID_RATIOS, (ratio) => (
              <line
                key={ratio}
                x1={PAD_X}
                x2={WIDTH - PAD_X}
                y1={PAD_Y + (HEIGHT - PAD_Y * 2) * ratio}
                y2={PAD_Y + (HEIGHT - PAD_Y * 2) * ratio}
                stroke={chartColors.grid}
                strokeWidth="1"
              />
            ))}

            {chart.baseline !== null && (
              <line
                x1={PAD_X}
                x2={WIDTH - PAD_X}
                y1={chart.baseline}
                y2={chart.baseline}
                stroke={chartColors.baseline}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            <path d={chart.area} fill={chart.fill} />
            <path
              d={chart.line}
              fill="none"
              stroke={chart.stroke}
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={chart.last.x}
              cy={chart.last.y}
              r="2.5"
              fill={chart.stroke}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {chart && (
        <div className={className(tw.chartAxis, tw.text.muted)}>
          {map(chart.labels, (item, i) => (
            <span key={`${item.point.time}-${i}`}>
              {formatTimeLabel(item.point.time)}
            </span>
          ))}
        </div>
      )}
    </section>
  )
})

export default PriceChart
