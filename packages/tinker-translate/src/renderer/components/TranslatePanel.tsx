import { Loader2 } from 'lucide-react'
import className from 'licia/className'

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
        <div className="flex flex-col">
          <textarea
            value={sourceText}
            onChange={(e) => onSourceTextChange(e.target.value)}
            placeholder="输入要翻译的文字..."
            className={className(
              'flex-1 w-full px-4 py-3 text-sm resize-none outline-none h-full',
              'bg-white dark:bg-neutral-800',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder-neutral-400 dark:placeholder-neutral-500',
              'border-r border-neutral-200 dark:border-neutral-700',
            )}
          />
        </div>

        <div className="px-4 py-3 text-sm overflow-y-auto bg-neutral-50 dark:bg-neutral-800/50">
          {isTranslating ? (
            <div className="flex items-center gap-2 text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>翻译中...</span>
            </div>
          ) : translatedText ? (
            <p className="whitespace-pre-wrap text-neutral-900 dark:text-neutral-100">
              {translatedText}
            </p>
          ) : (
            <p className="text-neutral-400 dark:text-neutral-500">
              翻译结果将显示在这里...
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-md text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 shrink-0">
          {error}
        </div>
      )}
    </>
  )
}

export default TranslatePanel
