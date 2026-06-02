import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { tw } from '../theme'

export default function EmptyEditor() {
  const { t } = useTranslation()

  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-3 ${tw.editor.bg}`}
    >
      <FileText
        aria-hidden="true"
        className={tw.empty.icon}
        size={32}
        strokeWidth={1.5}
      />
      <p className={`m-0 max-w-xs text-center text-sm ${tw.empty.text}`}>
        {t('emptyEditorHint')}
      </p>
    </div>
  )
}
