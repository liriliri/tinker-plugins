import className from 'licia/className'
import isFinite from 'licia/isFinite'
import map from 'licia/map'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import {
  cellFormat,
  columnLabel,
  visibleColumns,
  type CellFormat,
} from '../lib/columns'
import {
  changeTone,
  formatAmount,
  formatCompactCount,
  formatPct,
  formatPrice,
  formatSignedAmount,
  formatSignedCount,
} from '../lib/format'

interface DataTableProps {
  columns: string[]
  rows: Record<string, string>[]
  title?: string
  maxCols?: number
  prefer?: 'fund' | 'dividend' | 'shareholder'
}

function DataTable({ columns, rows, title, maxCols, prefer }: DataTableProps) {
  const { i18n } = useTranslation()
  const visibleCols = visibleColumns(columns, {
    prefer,
    maxCols: maxCols ?? (prefer ? 20 : 12),
  })

  if (rows.length === 0 || visibleCols.length === 0) {
    return null
  }

  return (
    <div className={`border-y ${tw.border.default} overflow-hidden`}>
      {title ? (
        <div className={`px-1 py-2 ${tw.label} border-b ${tw.border.default}`}>
          {title}
        </div>
      ) : null}
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className={`sticky top-0 ${tw.bg.panel}`}>
            <tr>
              {map(visibleCols, (col) => (
                <th
                  key={col}
                  className={`px-2 py-2 font-medium whitespace-nowrap tracking-wide ${tw.text.muted} border-b ${tw.border.default}`}
                >
                  {columnLabel(col, i18n.language)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {map(rows, (row, idx) => (
              <tr
                key={idx}
                className={`border-b ${tw.border.default} last:border-0 ${tw.bg.hover}`}
              >
                {map(visibleCols, (col) => {
                  const raw = row[col]
                  const { text, tone } = formatCell(raw, cellFormat(col), col)
                  return (
                    <td
                      key={col}
                      className={className(
                        'px-2 py-2 whitespace-nowrap font-mono tabular-nums',
                        tone || tw.text.primary,
                      )}
                    >
                      {text}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function parseNumber(value: string): number {
  return Number(value.replace(/,/g, ''))
}

function formatCell(
  value: string | undefined,
  format: CellFormat,
  column?: string,
): { text: string; tone?: string } {
  if (!value || value === '-') return { text: '--' }
  if (/^[\[{]/.test(value.trim())) return { text: '--' }

  const key = column || ''
  if (/Date$|date$|EndDate|PayDate|regDate|reportEndDate/i.test(key)) {
    return { text: formatDateValue(value) }
  }

  if (format === 'text') {
    const num = parseNumber(value)
    if (
      isFinite(num) &&
      Math.abs(num) >= 1e4 &&
      !/Date|Year|Period|Currency|Type|Mark|Code|Unit|Flag/i.test(key)
    ) {
      return { text: formatAmount(num) }
    }
    return { text: value }
  }

  const num = parseNumber(value)
  if (!isFinite(num)) return { text: value }

  if (format === 'signedMoney') {
    return {
      text: formatSignedAmount(num),
      tone: changeTone(num).text,
    }
  }
  if (format === 'money') {
    if (
      /PerShare|cashDiviRMB|cashDivPerShare|^dividend$|EPS|BPS|SalesPs|PS$/i.test(
        key,
      ) &&
      Math.abs(num) < 1e4
    ) {
      return { text: formatPrice(num) }
    }
    if (Math.abs(num) < 1e4) {
      return {
        text: num.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      }
    }
    return { text: formatAmount(num) }
  }
  if (format === 'price') {
    return { text: formatPrice(num) }
  }
  if (format === 'pct') {
    const holding = /holdPct|holdingPct|^pct$/i.test(key)
    const pct = holding || Math.abs(num) > 1 ? num : num * 100
    return {
      text: holding ? `${pct.toFixed(2)}%` : formatPct(pct),
      tone: holding ? undefined : changeTone(pct).text,
    }
  }
  if (format === 'count') {
    if (/avgHoldShares/i.test(key) && Math.abs(num) < 1e4) {
      return {
        text: num.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      }
    }
    return { text: formatCompactCount(num) }
  }
  if (format === 'signedCount') {
    return {
      text: formatSignedCount(num),
      tone: changeTone(num).text,
    }
  }
  if (format === 'rank') {
    return { text: String(Math.round(num)) }
  }
  return { text: value }
}

function formatDateValue(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }
  return value
}

export default DataTable
