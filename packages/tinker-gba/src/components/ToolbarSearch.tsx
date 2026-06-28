import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { tw } from '../theme'

export interface ToolbarSearchDropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface Props {
  isDark: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
  dropdownItems?: ToolbarSearchDropdownItem[]
  onDropdownSelect?: (item: ToolbarSearchDropdownItem) => void
}

export default function ToolbarSearch({
  isDark,
  value,
  onChange,
  placeholder,
  dropdownItems,
  onDropdownSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const showDropdown =
    isFocused && value.trim() && dropdownItems && dropdownItems.length > 0

  useEffect(() => {
    setActiveIndex(-1)
  }, [dropdownItems])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || !dropdownItems) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, dropdownItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      onDropdownSelect?.(dropdownItems[activeIndex])
    } else if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    setIsFocused(false)
  }

  return (
    <div ref={containerRef} className="relative w-44" onBlur={handleBlur}>
      <Search
        size={12}
        className={`absolute left-2 top-1/2 -translate-y-1/2 ${tw.searchIcon(isDark)}`}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={tw.searchInput(isDark)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${tw.searchClear(isDark)}`}
        >
          <X size={12} />
        </button>
      )}
      {showDropdown && (
        <div className={tw.searchDropdown(isDark)}>
          {dropdownItems?.map((item, index) => (
            <button
              key={item.id}
              tabIndex={-1}
              className={tw.searchDropdownItem(isDark, index === activeIndex)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onDropdownSelect?.(item)}
              title={item.description}
            >
              {item.icon && (
                <span
                  className={`flex-shrink-0 ${tw.searchDropdownIcon(isDark)}`}
                >
                  {item.icon}
                </span>
              )}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
