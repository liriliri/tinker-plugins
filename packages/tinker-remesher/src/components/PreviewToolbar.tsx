import { observer } from 'mobx-react-lite'
import { FolderOpen, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import map from 'licia/map'
import pascalCase from 'licia/pascalCase'
import {
  DISPLAY_MODES,
  PREVIEW_VIEWS,
  type DisplayMode,
  type PreviewView,
} from '../types'
import store from '../store'
import { tw } from '../theme'

interface SegmentProps {
  children: React.ReactNode
}

function Segment({ children }: SegmentProps) {
  return <div className="flex items-center p-0.5 gap-0.5">{children}</div>
}

interface SegmentBtnProps {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function SegmentBtn({ active, disabled, onClick, children }: SegmentBtnProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={className(
        'h-6 shrink-0 px-2 rounded-[5px] text-[11px] font-medium whitespace-nowrap transition-colors disabled:opacity-35',
        active
          ? tw.segment.active
          : className(tw.segment.inactive, 'cursor-pointer'),
      )}
    >
      {children}
    </button>
  )
}

const PreviewToolbar = observer(function PreviewToolbar() {
  const { t } = useTranslation()
  const busy = store.isProcessing || store.isLoading

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 max-w-[calc(100%-1.5rem)]">
      <div
        className={className(
          'flex items-center flex-nowrap gap-0.5 px-1 py-1 overflow-x-auto',
          tw.chrome,
        )}
      >
        <button
          type="button"
          title={t('open')}
          disabled={busy}
          onClick={() => store.openFileDialog()}
          className={tw.button.icon}
        >
          <FolderOpen className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          title={t('save')}
          disabled={!store.canSave}
          onClick={() => {
            void store.saveResult()
          }}
          className={tw.button.icon}
        >
          <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>

        <div className={className('w-px h-4 mx-0.5', tw.divider)} />

        <Segment>
          {map(DISPLAY_MODES, (mode: DisplayMode) => (
            <SegmentBtn
              key={mode}
              active={store.displayMode === mode}
              onClick={() => store.setDisplayMode(mode)}
            >
              {t(`display${pascalCase(mode)}`)}
            </SegmentBtn>
          ))}
        </Segment>

        <div className={className('w-px h-4 mx-0.5', tw.divider)} />

        <Segment>
          {map(PREVIEW_VIEWS, (view: PreviewView) => (
            <SegmentBtn
              key={view}
              active={store.previewView === view}
              disabled={view === 'remeshed' && !store.remeshedUrl}
              onClick={() => store.setPreviewView(view)}
            >
              {t(`preview${pascalCase(view)}`)}
            </SegmentBtn>
          ))}
        </Segment>
      </div>
    </div>
  )
})

export default PreviewToolbar
