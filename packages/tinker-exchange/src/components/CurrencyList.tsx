import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { X } from 'lucide-react'
import store from '../store'
import Flag from './Flag'
import { tw } from '../theme'

const CurrencyList = observer(() => {
  return (
    <div className="flex flex-col gap-1.5">
      {store.targetCodes.map((code) => {
        const amount = store.convert(code)
        return (
          <div
            key={code}
            className={className(
              'group flex items-stretch rounded-lg px-3 py-1.5 transition-colors',
              tw.background.secondary,
              tw.background.hover,
            )}
          >
            <span className="flex items-center shrink-0 mr-2 text-4xl">
              <Flag code={code} />
            </span>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={className(
                    'text-sm font-bold shrink-0',
                    tw.text.accent,
                  )}
                >
                  {code}
                </span>
                <span
                  className={className('text-xs truncate', tw.text.secondary)}
                >
                  {store.getCurrencyName(code)}
                </span>
              </div>
              <div
                className={className('text-xs font-mono', tw.text.secondary)}
              >
                {store.formatAmount(store.baseAmount)} {code} ={' '}
                {store.formatAmount(store.reverseConvert(code))}{' '}
                {store.baseCurrency}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={className(
                  'text-lg font-mono cursor-pointer transition-colors',
                  tw.accent.hoverText,
                )}
                onClick={() => store.swapBase(code)}
              >
                {store.formatAmount(amount)}
              </span>
              <button
                onClick={() => store.removeCurrency(code)}
                className={className(
                  'p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                  tw.text.secondary,
                  tw.danger.hoverText,
                )}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default CurrencyList
