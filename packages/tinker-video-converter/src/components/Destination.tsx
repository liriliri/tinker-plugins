import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Folder, X } from 'lucide-react'
import { tw } from '../theme'
import store from '../store'

export default observer(function Destination() {
  const { t } = useTranslation()

  return (
    <div
      className={`px-4 py-2.5 border-t ${tw.border} ${tw.bg.panel} animate-slide-up`}
      style={{ animationDelay: '100ms' }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`text-[11px] font-mono ${tw.text.muted} shrink-0 uppercase tracking-wider`}
        >
          {t('destination')}
        </span>
        <div
          className={`flex items-center flex-1 px-2 py-[5px] text-xs rounded-md border border-stone-300 dark:border-stone-700 ${tw.bg.input} transition-colors focus-within:border-teal-500/40`}
        >
          <button
            onClick={() => store.browseOutputDir()}
            className="text-stone-400 dark:text-stone-500 hover:text-teal-600 dark:hover:text-teal-400 shrink-0 mr-1.5 transition-colors"
          >
            <Folder className="w-3.5 h-3.5" />
          </button>
          <input
            type="text"
            value={store.outputDir}
            onChange={(e) => store.setOutputDir(e.target.value)}
            placeholder={t('outputDir')}
            className={`flex-1 min-w-0 bg-transparent text-stone-700 dark:text-stone-200 focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600 text-xs font-mono`}
          />
          {store.outputDir && (
            <button
              onClick={() => store.setOutputDir('')}
              className="text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 shrink-0 ml-1 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
