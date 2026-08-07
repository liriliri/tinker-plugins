import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Save } from 'lucide-react'
import className from 'licia/className'
import { tw } from '../theme'

interface PanelActionsProps {
  disabled: boolean
  onCopy: () => Promise<void>
  onSave: () => Promise<void>
}

const PanelActions = ({ disabled, onCopy, onSave }: PanelActionsProps) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleCopy = async () => {
    if (disabled) return
    await onCopy()
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        title={t('copy')}
        disabled={disabled}
        className={className(
          'inline-flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-colors duration-150',
          tw.button.icon,
          'disabled:opacity-30 disabled:cursor-not-allowed',
        )}
        onClick={handleCopy}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
      <button
        type="button"
        title={t('save')}
        disabled={disabled}
        className={className(
          'inline-flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-colors duration-150',
          tw.button.icon,
          'disabled:opacity-30 disabled:cursor-not-allowed',
        )}
        onClick={() => {
          if (!disabled) void onSave()
        }}
      >
        <Save className="w-3 h-3" />
      </button>
    </div>
  )
}

export default PanelActions
