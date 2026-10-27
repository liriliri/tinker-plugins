import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'

interface UnpackedBadgeProps {
  size?: 'sm' | 'md'
}

export default function UnpackedBadge({ size = 'sm' }: UnpackedBadgeProps) {
  const { t } = useTranslation()

  return (
    <span
      className={className(
        'leading-none rounded shrink-0',
        size === 'sm' ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5',
        tw.unpackedBadge,
      )}
      title={t('unpackedHint')}
    >
      {t('unpacked')}
    </span>
  )
}
