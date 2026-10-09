import { useEffect, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import './ContextMenu.scss'

export type ContextMenuItem = {
  label?: string
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'
  checked?: boolean
  enabled?: boolean
  click?: () => void
  submenu?: ContextMenuItem[]
}

type MenuState = {
  open: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  /** Remount key so floating-ui remeasures at the new point. */
  key: number
}

let state: MenuState = { open: false, x: 0, y: 0, items: [], key: 0 }
let nextKey = 0
const listeners = new Set<() => void>()
let mounted = false

function setMenuState(next: Partial<MenuState>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

function ensureMounted() {
  if (mounted) return
  mounted = true
  const el = document.createElement('div')
  document.body.appendChild(el)
  createRoot(el).render(<ContextMenuHost />)
}

function ItemRow({
  label,
  checked,
  caret,
}: {
  label?: string
  checked?: boolean
  caret?: boolean
}) {
  return (
    <>
      <span className="tinker-ctx-indicator">{checked ? '✓' : ''}</span>
      <span className="tinker-ctx-label">{label}</span>
      {caret ? <span className="tinker-ctx-caret">›</span> : null}
    </>
  )
}

function renderItems(items: ContextMenuItem[]): ReactNode[] {
  const nodes: ReactNode[] = []
  let i = 0

  while (i < items.length) {
    const item = items[i]

    if (item.type === 'separator') {
      nodes.push(
        <DropdownMenu.Separator key={i} className="tinker-ctx-sep" />,
      )
      i += 1
      continue
    }

    if (item.type === 'radio') {
      const group: ContextMenuItem[] = []
      const start = i
      while (i < items.length && items[i].type === 'radio') {
        group.push(items[i])
        i += 1
      }
      const checkedIdx = group.findIndex((g) => g.checked)
      nodes.push(
        <DropdownMenu.RadioGroup
          key={start}
          value={checkedIdx >= 0 ? String(checkedIdx) : undefined}
        >
          {group.map((g, j) => (
            <DropdownMenu.RadioItem
              key={j}
              className="tinker-ctx-item"
              value={String(j)}
              disabled={g.enabled === false}
              onSelect={() => g.click?.()}
            >
              <ItemRow label={g.label} checked={g.checked} />
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>,
      )
      continue
    }

    if (item.type === 'submenu' || item.submenu?.length) {
      nodes.push(
        <DropdownMenu.Sub key={i}>
          <DropdownMenu.SubTrigger
            className="tinker-ctx-sub-trigger"
            disabled={item.enabled === false}
          >
            <ItemRow label={item.label} caret />
          </DropdownMenu.SubTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.SubContent className="tinker-ctx-sub" sideOffset={4}>
              {renderItems(item.submenu || [])}
            </DropdownMenu.SubContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Sub>,
      )
      i += 1
      continue
    }

    if (item.type === 'checkbox') {
      nodes.push(
        <DropdownMenu.CheckboxItem
          key={i}
          className="tinker-ctx-item"
          checked={!!item.checked}
          disabled={item.enabled === false}
          onSelect={() => item.click?.()}
        >
          <ItemRow label={item.label} checked={item.checked} />
        </DropdownMenu.CheckboxItem>,
      )
      i += 1
      continue
    }

    nodes.push(
      <DropdownMenu.Item
        key={i}
        className="tinker-ctx-item"
        disabled={item.enabled === false}
        onSelect={() => item.click?.()}
      >
        <ItemRow label={item.label} />
      </DropdownMenu.Item>,
    )
    i += 1
  }

  return nodes
}

function ContextMenuHost() {
  const [, tick] = useState(0)

  useEffect(() => {
    const listener = () => tick((n) => n + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const { open, x, y, items, key } = state

  return (
    <DropdownMenu.Root
      key={key}
      modal={false}
      open={open}
      onOpenChange={(next) => setMenuState({ open: next })}
    >
      <DropdownMenu.Trigger asChild>
        <span
          aria-hidden
          style={{
            position: 'fixed',
            left: x,
            top: y,
            width: 1,
            height: 1,
            padding: 0,
            margin: 0,
            border: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="tinker-ctx-content"
          side="bottom"
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {renderItems(items)}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/**
 * Show a context menu at (x, y).
 * Uses `tinker.showContextMenu` inside TINKER; falls back to Radix Dropdown Menu in the browser.
 */
export function showContextMenu(
  x: number,
  y: number,
  items: ContextMenuItem[],
) {
  if (typeof tinker !== 'undefined') {
    tinker.showContextMenu(x, y, items)
    return
  }

  nextKey += 1
  setMenuState({ open: true, x, y, items, key: nextKey })
  ensureMounted()
}
