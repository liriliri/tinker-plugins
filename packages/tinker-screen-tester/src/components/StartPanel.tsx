import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'
import {
  chalkStyle,
  chromeStyle,
  mistStyle,
  panelStyle,
  raisedStyle,
  signalBtnStyle,
  sidebarStyle,
  tw,
} from '../theme'
import PreviewBezel from './PreviewBezel'
import Keycap from './Keycap'

interface StartPanelProps {
  onStart: () => void
}

interface ShortcutProps {
  keys: string
  label: string
}

function Shortcut({ keys, label }: ShortcutProps) {
  return (
    <div className={tw.shortcutRow} style={raisedStyle}>
      <span className={tw.body} style={chalkStyle}>
        {label}
      </span>
      <Keycap label={keys} />
    </div>
  )
}

function StartPanel({ onStart }: StartPanelProps) {
  const { t } = useTranslation()

  return (
    <div className={tw.appShell} style={chromeStyle}>
      <div className={tw.main}>
        <section className={tw.pane} style={panelStyle}>
          <PreviewBezel />
        </section>

        <section className={tw.panePad} style={sidebarStyle}>
          <span className={tw.label} style={mistStyle}>
            {t('controls')}
          </span>
          <p className={`${tw.body} mt-2`} style={mistStyle}>
            {t('description')}
          </p>

          <div className={tw.shortcutGrid}>
            <Shortcut keys={t('keysNext')} label={t('keyNext')} />
            <Shortcut keys={t('keysPrev')} label={t('keyPrev')} />
            <Shortcut keys={t('keysExit')} label={t('keyExit')} />
            <Shortcut keys={t('keysHint')} label={t('keyHint')} />
          </div>

          <div className="mt-auto flex justify-center pt-6">
            <button
              type="button"
              className={tw.startBtn}
              style={signalBtnStyle}
              onClick={onStart}
            >
              <Play size={16} strokeWidth={2.25} fill="currentColor" />
              {t('start')}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default StartPanel
