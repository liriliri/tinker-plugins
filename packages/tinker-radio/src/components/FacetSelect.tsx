import { useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import className from 'licia/className'
import contain from 'licia/contain'
import map from 'licia/map'
import { useOutsidePointer } from '../lib/useOutsidePointer'
import { tw } from '../theme'

interface FacetItem {
  code: string
  label: string
  count: number
}

interface FacetSelectProps {
  allLabel: string
  selectedLabel: string
  items: FacetItem[]
  selected: string[]
  total: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggle: (code: string) => void
  onClear: () => void
}

interface FacetOptionProps {
  label: string
  count: number
  active: boolean
  onSelect: () => void
}

function FacetOption({ label, count, active, onSelect }: FacetOptionProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={className(
        'relative flex w-full min-w-0 cursor-pointer items-center gap-3 py-2 pl-7 pr-3 text-left text-sm',
        tw.background.row,
      )}
    >
      {active ? (
        <span
          className={className(
            'absolute left-[11px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full',
            tw.dot,
          )}
        />
      ) : null}
      <span className={className('min-w-0 flex-1 truncate', tw.text.primary)}>
        {label}
      </span>
      <span className={className('shrink-0', tw.text.meta, tw.text.muted)}>
        {count}
      </span>
    </button>
  )
}

function FacetSelect({
  allLabel,
  selectedLabel,
  items,
  selected,
  total,
  open,
  onOpenChange,
  onToggle,
  onClear,
}: FacetSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  useOutsidePointer(open, rootRef, () => onOpenChangeRef.current(false))

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChangeRef.current(false)
    }
    document.addEventListener('keydown', onKey)
    rootRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' })
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={allLabel}
        onClick={() => onOpenChange(!open)}
        className={className(
          'flex h-9 max-w-44 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs',
          tw.panel,
          selected.length ? tw.text.primary : tw.text.muted,
        )}
      >
        <span className="truncate">
          {selected.length ? selectedLabel : allLabel}
        </span>
        <ChevronDown
          className={className(
            'h-3.5 w-3.5 shrink-0 motion-safe:transition-transform',
            open ? 'rotate-180' : '',
          )}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div
          className={className(
            'absolute left-0 top-11 w-64 overflow-hidden rounded-lg',
            tw.panel,
          )}
        >
          <div
            role="listbox"
            aria-multiselectable="true"
            aria-label={allLabel}
            className={className(
              'max-h-80 overflow-x-hidden overflow-y-auto',
              tw.menuScroll,
            )}
          >
            <FacetOption
              label={allLabel}
              count={total}
              active={!selected.length}
              onSelect={() => {
                onClear()
                onOpenChange(false)
              }}
            />
            {map(items, (item) => (
              <FacetOption
                key={item.code}
                label={item.label}
                count={item.count}
                active={contain(selected, item.code)}
                onSelect={() => onToggle(item.code)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FacetSelect
