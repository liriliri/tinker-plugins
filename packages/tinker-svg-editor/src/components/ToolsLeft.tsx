import { useRef, type FormEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import type { LucideIcon } from 'lucide-react'
import {
  Circle,
  Hand,
  MousePointer2,
  PenTool,
  Pencil,
  Repeat2,
  Slash,
  Square,
  Type,
  ZoomIn,
} from 'lucide-react'
import store from '../store'
import { COLOR_INPUT_FILL, COLOR_INPUT_STROKE, tw } from '../theme'
import type { ColorTarget, ToolMode } from '../types'

interface ToolDef {
  mode: ToolMode
  titleKey: string
  shortcut: string
  icon: LucideIcon
}

interface ColorChipProps {
  type: ColorTarget
  title: string
  value: string
  display: string
  fallback: string
}

const tools: ToolDef[] = [
  {
    mode: 'select',
    titleKey: 'toolSelect',
    shortcut: 'V',
    icon: MousePointer2,
  },
  {
    mode: 'pan',
    titleKey: 'toolPan',
    shortcut: 'H',
    icon: Hand,
  },
  {
    mode: 'fhpath',
    titleKey: 'toolPencil',
    shortcut: 'Q',
    icon: Pencil,
  },
  {
    mode: 'line',
    titleKey: 'toolLine',
    shortcut: 'L',
    icon: Slash,
  },
  {
    mode: 'rect',
    titleKey: 'toolRect',
    shortcut: 'R',
    icon: Square,
  },
  {
    mode: 'ellipse',
    titleKey: 'toolEllipse',
    shortcut: 'O',
    icon: Circle,
  },
  {
    mode: 'path',
    titleKey: 'toolPath',
    shortcut: 'P',
    icon: PenTool,
  },
  {
    mode: 'text',
    titleKey: 'toolText',
    shortcut: 'T',
    icon: Type,
  },
  {
    mode: 'zoom',
    titleKey: 'toolZoom',
    shortcut: 'Z',
    icon: ZoomIn,
  },
]

/** React fires onChange continuously for type=color; coalesce into one undo step. */
const ColorChip = observer(
  ({ type, title, value, display, fallback }: ColorChipProps) => {
    const dragging = useRef(false)

    function apply(color: string, noUndo: boolean) {
      store.setColorTarget(type)
      store.applyColor(type, color, noUndo)
    }

    function onInput(e: FormEvent<HTMLInputElement>) {
      const color = (e.target as HTMLInputElement).value
      if (!dragging.current) {
        dragging.current = true
        apply(color, false)
      } else {
        apply(color, true)
      }
    }

    return (
      <div
        className={className('color_chip', `color_chip_${type}`, {
          active: store.colorTarget === type,
        })}
        title={title}
      >
        <input
          type="color"
          value={value === 'none' ? fallback : value}
          onInput={onInput}
          onChange={onInput}
          onBlur={() => {
            dragging.current = false
          }}
          onFocus={() => store.setColorTarget(type)}
          onClick={() => store.setColorTarget(type)}
        />
        <div
          className="color_chip_paint"
          style={{ backgroundColor: display }}
        />
      </div>
    )
  },
)

const ToolsLeft = observer(() => {
  const { t } = useTranslation()

  return (
    <div
      id="tools_left"
      className={className(
        '[grid-area:tools] z-[3] flex flex-col items-center gap-0.5 py-2',
        tw.border.right,
        tw.background.primary,
      )}
    >
      {tools.map(({ mode, titleKey, shortcut, icon: Icon }) => {
        const current = store.mode === mode
        return (
          <div
            key={mode}
            className={className(
              'flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[var(--radius)] transition-[background,color,transform] duration-150',
              'hover:-translate-y-px motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&_svg]:shrink-0',
              current
                ? className(
                    tw.background.toolCurrent,
                    tw.text.toolCurrent,
                    tw.shadow.toolCurrent,
                    'hover:translate-y-0',
                  )
                : className(tw.text.tool, tw.background.toolHover),
            )}
            title={`${t(titleKey)} [${shortcut}]`}
            onClick={() => store.setMode(mode)}
          >
            <Icon size={16} strokeWidth={1.75} />
          </div>
        )
      })}

      <div id="color_tools">
        <button
          type="button"
          id="tool_switch"
          title={t('swapColors')}
          onClick={() => store.swapColors()}
        >
          <Repeat2 size={12} />
        </button>

        <ColorChip
          type="fill"
          title={t('fillColor')}
          value={store.fill}
          display={store.fillDisplay}
          fallback={COLOR_INPUT_FILL}
        />
        <ColorChip
          type="stroke"
          title={t('strokeColor')}
          value={store.stroke}
          display={store.strokeDisplay}
          fallback={COLOR_INPUT_STROKE}
        />
      </div>
    </div>
  )
})

export default ToolsLeft
