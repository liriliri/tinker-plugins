import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import isNaN from 'licia/isNaN'
import toNum from 'licia/toNum'
import type { LucideIcon } from 'lucide-react'
import {
  Bold,
  CodeXml,
  FilePlus2,
  FolderOpen,
  ImageDown,
  Italic,
  Redo2,
  Save,
  Undo2,
} from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import CanvasSizeDialog from './CanvasSizeDialog'

interface ToolbarAction {
  id: string
  titleKey: string
  icon: LucideIcon
  action: () => void
  disabled?: boolean
  active?: boolean
}

interface ToolbarGroup {
  id: string
  items: ToolbarAction[]
}

interface ToolbarFieldProps {
  label: string
  value: string | number
  min?: number
  step?: number
  onChange: (value: number) => void
}

function ToolbarField({
  label,
  value,
  min,
  step = 1,
  onChange,
}: ToolbarFieldProps) {
  return (
    <label
      className={className(
        'box-border m-0 inline-flex h-[30px] items-center gap-1 rounded-[var(--radius-sm)] border-0 bg-transparent px-1.5',
        tw.text.secondary,
        tw.background.fieldHover,
      )}
    >
      <span
        className={className(
          'whitespace-nowrap text-[11px] font-medium',
          tw.text.secondary,
        )}
      >
        {label}
      </span>
      <input
        type="number"
        className={className(
          'h-5 w-9 border-0 bg-transparent p-0 outline-none font-[family-name:var(--font-ui)] text-xs font-medium tabular-nums [appearance:textfield]',
          '[&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none',
          '[&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none',
          tw.text.primary,
        )}
        value={value}
        min={min}
        step={step}
        onChange={(e) => {
          const n = toNum(e.target.value)
          if (isNaN(n)) return
          onChange(n)
        }}
      />
    </label>
  )
}

const Toolbar = observer(() => {
  const { t } = useTranslation()
  const [showSizeDialog, setShowSizeDialog] = useState(false)
  const { selection } = store
  const panel = selection.panel
  const showStroke = store.hasSelection && panel !== 'canvas'
  const showRoundness = panel === 'rect'
  const showText = panel === 'text'
  const showContext = showStroke || showRoundness || showText

  const groups: ToolbarGroup[] = [
    {
      id: 'file',
      items: [
        {
          id: 'new',
          titleKey: 'newDoc',
          icon: FilePlus2,
          action: () => store.newDocument(),
        },
        {
          id: 'open',
          titleKey: 'openSvg',
          icon: FolderOpen,
          action: () => void store.openSvg(),
        },
        {
          id: 'save',
          titleKey: 'saveSvg',
          icon: Save,
          action: () => void store.saveSvg(),
        },
        {
          id: 'exportPng',
          titleKey: 'exportPng',
          icon: ImageDown,
          action: () => void store.exportPng(),
        },
      ],
    },
    {
      id: 'edit',
      items: [
        {
          id: 'undo',
          titleKey: 'undo',
          icon: Undo2,
          action: () => store.undo(),
          disabled: !store.canUndo,
        },
        {
          id: 'redo',
          titleKey: 'redo',
          icon: Redo2,
          action: () => store.redo(),
          disabled: !store.canRedo,
        },
      ],
    },
    {
      id: 'source',
      items: [
        {
          id: 'source',
          titleKey: 'viewSource',
          icon: CodeXml,
          action: () => store.openSource(),
        },
      ],
    },
  ]

  function btnClass(active?: boolean, label?: boolean) {
    return className(
      'inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border-0 bg-transparent p-0 transition-colors duration-150',
      'disabled:cursor-default disabled:opacity-30',
      tw.text.btn,
      tw.background.hover,
      tw.focus,
      label &&
        'w-auto whitespace-nowrap px-2.5 font-[family-name:var(--font-ui)] text-xs font-medium tabular-nums',
      active && className(tw.background.btnActive, tw.text.accent),
    )
  }

  return (
    <>
      <div
        id="toolbar"
        className={className(
          '[grid-area:toolbar] z-[5] flex items-center gap-0.5 py-0 pl-2.5 pr-3',
          tw.border.bottom,
          tw.background.toolbar,
        )}
      >
        {groups.map((group, index) => (
          <div
            key={group.id}
            className={className('flex items-center gap-0.5', {
              'ml-auto': group.id === 'source',
            })}
          >
            {index > 0 && group.id !== 'source' && (
              <div
                className={className(
                  'mx-2 h-[18px] w-px opacity-85',
                  tw.border.sep,
                )}
              />
            )}
            {group.id === 'source' && (
              <button
                type="button"
                className={btnClass(false, true)}
                title={t('setCanvasSize')}
                onClick={() => setShowSizeDialog(true)}
              >
                {store.canvasSize.width} × {store.canvasSize.height}
              </button>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  className={btnClass(item.active)}
                  title={t(item.titleKey)}
                  disabled={item.disabled}
                  aria-pressed={item.active}
                  onClick={() => {
                    if (item.disabled) return
                    item.action()
                  }}
                >
                  <Icon size={16} strokeWidth={1.75} />
                </button>
              )
            })}
            {group.id === 'edit' && showContext && (
              <>
                <div
                  className={className(
                    'mx-2 h-[18px] w-px opacity-85',
                    tw.border.sep,
                  )}
                />
                {showStroke && (
                  <ToolbarField
                    label={t('stroke')}
                    value={store.strokeWidth}
                    min={0}
                    step={0.5}
                    onChange={(n) => store.setStrokeWidth(n)}
                  />
                )}
                {showRoundness && (
                  <ToolbarField
                    label={t('roundness')}
                    value={selection.attrs.rx || 0}
                    min={0}
                    onChange={(n) => store.setRoundness(n)}
                  />
                )}
                {showText && (
                  <>
                    <ToolbarField
                      label={t('fontSize')}
                      value={selection.fontSize}
                      min={1}
                      onChange={(n) => store.setFontSize(n)}
                    />
                    <button
                      type="button"
                      className={btnClass(selection.isBold)}
                      title={t('bold')}
                      aria-pressed={selection.isBold}
                      onClick={() => store.toggleBold()}
                    >
                      <Bold size={16} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className={btnClass(selection.isItalic)}
                      title={t('italic')}
                      aria-pressed={selection.isItalic}
                      onClick={() => store.toggleItalic()}
                    >
                      <Italic size={16} strokeWidth={1.75} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <CanvasSizeDialog
        open={showSizeDialog}
        onClose={() => setShowSizeDialog(false)}
        onConfirm={(width, height) => store.setCanvasSize(width, height)}
        currentWidth={store.canvasSize.width}
        currentHeight={store.canvasSize.height}
      />
    </>
  )
})

export default Toolbar
