import Editor from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

interface TextPreviewProps {
  path: string
  language: string
  value: string
}

const EDITOR_OPTIONS = {
  readOnly: false,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 12,
  lineHeight: 20,
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  lineNumbers: 'on' as const,
  wordWrap: 'on' as const,
  automaticLayout: true,
  folding: true,
  renderWhitespace: 'selection' as const,
  padding: { top: 12, bottom: 12 },
  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
}

const TextPreview = observer(({ path, language, value }: TextPreviewProps) => {
  const { t } = useTranslation()

  return (
    <Editor
      path={path}
      height="100%"
      language={language}
      defaultValue={value}
      theme={store.isDark ? 'asar-dark' : 'asar-light'}
      onChange={(content) => {
        if (content != null) {
          store.updateFileContent(path, content)
        }
      }}
      options={EDITOR_OPTIONS}
      loading={
        <div
          className={className(
            'flex items-center justify-center h-full',
            tw.surfaceRaised,
          )}
        >
          <span className={className('text-xs', tw.mono, tw.text.faint)}>
            {t('loadingEditor')}
          </span>
        </div>
      }
    />
  )
})

export default TextPreview
