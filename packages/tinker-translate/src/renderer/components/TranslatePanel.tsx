interface TranslatePanelProps {
  sourceText: string
  translatedText: string
  isTranslating: boolean
  error: string
  onSourceTextChange: (v: string) => void
}

function TranslatePanel({
  sourceText,
  translatedText,
  isTranslating,
  error,
  onSourceTextChange,
}: TranslatePanelProps) {
  return (
    <>
      <div className="grid grid-cols-2 flex-1 min-h-0">
        {/* Source panel */}
        <div className="flex flex-col bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800">
          <textarea
            value={sourceText}
            onChange={(e) => onSourceTextChange(e.target.value)}
            placeholder="输入要翻译的文字..."
            className="flex-1 w-full px-4 py-3.5 text-[13px] leading-[1.75] resize-none outline-none border-none bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-700"
          />
        </div>

        {/* Target panel */}
        <div className="flex flex-col bg-stone-50 dark:bg-stone-900/50">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5">
            {isTranslating ? (
              <div className="flex items-center gap-2 text-stone-400 dark:text-stone-600 text-[12.5px]">
                <span className="flex items-center gap-0.75 h-3">
                  <span className="dot dot-1" />
                  <span className="dot dot-2" />
                  <span className="dot dot-3" />
                </span>
                <span>翻译中</span>
              </div>
            ) : translatedText ? (
              <p className="animate-fade-up text-[13px] leading-[1.75] whitespace-pre-wrap text-stone-900 dark:text-stone-100">
                {translatedText}
              </p>
            ) : (
              <p className="text-[13px] italic text-stone-300 dark:text-stone-700">
                翻译结果将显示在这里...
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="animate-fade-up mx-2.5 mb-2 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 shrink-0">
          {error}
        </div>
      )}
    </>
  )
}

export default TranslatePanel
