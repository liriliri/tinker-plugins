import { observer } from 'mobx-react-lite'
import { tw } from '../theme'
import store from '../store'

const TranslatePanel = observer(() => {
  return (
    <div className="grid grid-cols-2 flex-1 min-h-0">
      {/* Source panel */}
      <div
        className={`flex flex-col ${tw.background.sourcePanel} border-r ${tw.border.divider}`}
      >
        <textarea
          value={store.sourceText}
          onChange={(e) => store.setSourceText(e.target.value)}
          placeholder="输入要翻译的文字..."
          className={`flex-1 w-full px-4 py-3.5 text-[13px] leading-[1.75] resize-none outline-none border-none bg-transparent ${tw.text.primary} ${tw.text.placeholder}`}
        />
      </div>

      {/* Target panel */}
      <div className={`flex flex-col ${tw.background.targetPanel}`}>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5">
          {store.isTranslating ? (
            <div
              className={`flex items-center gap-2 ${tw.text.translating} text-[12.5px]`}
            >
              <span className="flex items-center gap-0.75 h-3">
                <span className="dot dot-1" />
                <span className="dot dot-2" />
                <span className="dot dot-3" />
              </span>
              <span>翻译中</span>
            </div>
          ) : store.translatedText ? (
            <p
              className={`animate-fade-up text-[13px] leading-[1.75] whitespace-pre-wrap ${tw.text.primary}`}
            >
              {store.translatedText}
            </p>
          ) : (
            <p className={`text-[13px] italic ${tw.text.muted}`}>
              翻译结果将显示在这里...
            </p>
          )}
        </div>
      </div>
    </div>
  )
})

export default TranslatePanel
