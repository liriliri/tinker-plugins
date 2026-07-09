import { observer } from 'mobx-react-lite'
import { Save, FolderOpen, Eraser, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import SectionLabel from './SectionLabel'
import ModelSelector from './ModelSelector'

const Sidebar = observer(() => {
  const { t } = useTranslation()
  return (
    <div
      className={`w-[200px] shrink-0 ${tw.background.sidebar} flex flex-col border-r ${tw.border.sidebar}`}
    >
      <div className="flex-1 p-4 flex flex-col gap-5">
        <div className="animate-slide-in-left [animation-delay:0ms]">
          <button
            onClick={() => store.openFile()}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${tw.button.secondary.default} ${tw.button.secondary.hover}`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            {t('openImage')}
          </button>
        </div>

        <div className="animate-slide-in-left [animation-delay:50ms]">
          <SectionLabel>{t('model')}</SectionLabel>
          <ModelSelector />
        </div>

        <div className={`h-px ${tw.divider}`} />

        <div className="flex flex-col gap-2 animate-slide-in-left [animation-delay:100ms]">
          <button
            onClick={() => store.removeBackground()}
            disabled={!store.canRemove}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              store.canRemove
                ? `cursor-pointer ${tw.button.primary.default} ${tw.button.primary.hover}`
                : tw.button.primary.disabled
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            {t('removeBackground')}
          </button>

          {store.resultImage && (
            <button
              onClick={() => store.saveResult()}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 animate-float-in ${tw.button.primary.default} ${tw.button.primary.hover}`}
            >
              <Save className="w-3.5 h-3.5" />
              {t('save')}
            </button>
          )}
        </div>
      </div>

      {store.originalImage && (
        <div className="p-4 pt-0">
          <button
            onClick={() => store.reset()}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all duration-150 ${tw.button.secondary.default} ${tw.button.secondary.hover}`}
          >
            <RotateCcw className="w-3 h-3" />
            {t('reset')}
          </button>
        </div>
      )}
    </div>
  )
})

export default Sidebar
