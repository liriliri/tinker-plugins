import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'
import {
  VIDEO_OUTPUT_FORMATS,
  PRESETS,
  AUDIO_CODECS,
  AUDIO_BITRATES,
} from '../lib/constants'

const Select = ({
  value,
  onChange,
  options,
  disabled,
  className: cls,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  className?: string
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className={`select-styled border-stone-700 bg-stone-800/80 text-stone-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed ${cls || ''}`}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
)

const FieldRow = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex items-center gap-3">
    <span
      className={`text-[11px] font-mono ${tw.text.muted} w-20 shrink-0 uppercase tracking-wider`}
    >
      {label}
    </span>
    <div className="flex-1 flex items-center">{children}</div>
  </div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-1 h-3.5 rounded-full bg-amber-500/60" />
    <span
      className={`text-[11px] font-semibold uppercase tracking-widest ${tw.text.accent}`}
    >
      {children}
    </span>
  </div>
)

const VideoSettings = observer(() => {
  const { t } = useTranslation()
  const fmt = store.outputFormatConfig
  const isGif = fmt?.ext === 'gif'
  const hasPreset = ['h264', 'h265'].includes(fmt?.codec || '')
  const hasCrf = ['h264', 'h265', 'vp9', 'av1'].includes(fmt?.codec || '')

  return (
    <div className="flex flex-col gap-2.5">
      <FieldRow label={t('format')}>
        <Select
          value={store.outputFormat}
          onChange={(v) => store.setOutputFormat(v)}
          options={VIDEO_OUTPUT_FORMATS.map((f) => ({
            value: f.value,
            label: f.label,
          }))}
          disabled={store.isConverting}
          className="w-full"
        />
      </FieldRow>
      {!isGif && hasPreset && (
        <FieldRow label={t('preset')}>
          <Select
            value={store.preset}
            onChange={(v) => store.setPreset(v)}
            options={PRESETS.map((p) => ({ value: p, label: p }))}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
      {!isGif && hasCrf && (
        <FieldRow label={t('quality')}>
          <div className="flex items-center gap-2.5 w-full">
            <input
              type="range"
              min={0}
              max={51}
              value={store.crf}
              onChange={(e) => store.setCrf(parseInt(e.target.value, 10))}
              disabled={store.isConverting}
              className="flex-1"
            />
            <span className="text-xs font-mono text-amber-400 w-7 text-right tabular-nums">
              {store.crf}
            </span>
          </div>
        </FieldRow>
      )}
    </div>
  )
})

const AudioSettings = observer(() => {
  const { t } = useTranslation()
  const fmt = store.outputFormatConfig
  if (fmt?.ext === 'gif') return null

  const showBitrate = store.audioCodec !== 'none' && store.audioCodec !== 'copy'

  return (
    <div className="flex flex-col gap-2.5">
      <FieldRow label={t('audioCodec')}>
        <Select
          value={store.audioCodec}
          onChange={(v) => store.setAudioCodec(v)}
          options={AUDIO_CODECS}
          disabled={store.isConverting}
          className="w-full"
        />
      </FieldRow>
      {showBitrate && (
        <FieldRow label={t('audioBitrate')}>
          <Select
            value={store.audioBitrate}
            onChange={(v) => store.setAudioBitrate(v)}
            options={AUDIO_BITRATES.map((b) => ({ value: b, label: b }))}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
    </div>
  )
})

export default observer(function SettingsTabs() {
  const { t } = useTranslation()

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div
        className="p-4 flex flex-col gap-5 animate-slide-up"
        style={{ animationDelay: '50ms' }}
      >
        <div>
          <SectionTitle>{t('video')}</SectionTitle>
          <VideoSettings />
        </div>
        <div className={`h-px bg-stone-800`} />
        <div>
          <SectionTitle>{t('audio')}</SectionTitle>
          <AudioSettings />
        </div>
      </div>
    </div>
  )
})
