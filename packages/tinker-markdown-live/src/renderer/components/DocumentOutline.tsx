import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TableOfContents } from 'lucide-react'
import type { MarkdownOutlineItem } from '../lib/markdownOutline'
import { tw } from '../theme'

interface DocumentOutlineProps {
  items: MarkdownOutlineItem[]
  onSelectItem: (item: MarkdownOutlineItem, index: number) => void
}

export default function DocumentOutline({
  items,
  onSelectItem,
}: DocumentOutlineProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <section
      className={`flex min-h-0 flex-col border-t ${tw.sidebar.border} ${open ? 'max-h-[40%] min-h-20 flex-[0_1_40%]' : 'h-9 shrink-0'}`}
    >
      <button
        aria-expanded={open}
        aria-label={open ? t('hideOutline') : t('showOutline')}
        className={`flex h-9 w-full shrink-0 items-center gap-1 border-0 px-4 text-left focus-visible:outline-none ${tw.sidebar.text} ${tw.sidebar.hover}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <TableOfContents aria-hidden="true" className="shrink-0" size={15} />
        <span className="min-w-0 flex-1 truncate text-[13px] leading-none font-medium">
          {t('outline')}
        </span>
      </button>
      {open ? (
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          {items.length > 0 ? (
            <ol className="m-0 list-none p-0" aria-label={t('documentOutline')}>
              {items.map((item, index) => (
                <li key={`${item.level}-${item.title}-${index}`}>
                  <button
                    className={`h-8 w-full cursor-pointer truncate border-0 bg-transparent py-0 pr-3 text-left text-[13px] leading-none focus-visible:outline-none ${tw.sidebar.text} ${tw.sidebar.hover}`}
                    style={{ paddingLeft: `${12 + (item.level - 1) * 14}px` }}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onSelectItem(item, index)}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className={`m-0 px-4 py-3 text-xs ${tw.sidebar.muted}`}>
              {t('noHeadings')}
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}
