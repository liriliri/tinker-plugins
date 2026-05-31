import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import type { ModelSize } from '../../common/types'
import { tw } from '../theme'

const MODEL_OPTIONS: ModelSize[] = ['small', 'medium']

const ModelSelector = observer(() => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5">
      {MODEL_OPTIONS.map((m) => (
        <button
          key={m}
          onClick={() => store.setModel(m)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all duration-150 border ${
            store.model === m ? tw.radio.active : tw.radio.inactive
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
              store.model === m ? tw.radio.dot.active : tw.radio.dot.inactive
            }`}
          >
            {store.model === m && (
              <div className={`w-1.5 h-1.5 rounded-full ${tw.accent.dot}`} />
            )}
          </div>
          {t(`model_${m}`)}
        </button>
      ))}
    </div>
  )
})

export default ModelSelector
