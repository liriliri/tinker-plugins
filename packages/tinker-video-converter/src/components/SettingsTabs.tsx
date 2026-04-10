import { useState, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { X, Terminal } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { tw } from '../theme'
import store from '../store'
import {
  CONTAINERS,
  AUDIO_CODECS,
  AUDIO_BITRATES,
  ENCODER_TUNES,
  ENCODER_PROFILES,
  ENCODER_LEVELS,
  ENCODER_PRESETS,
  QUALITY_TYPES,
  RESOLUTIONS,
  FRAMERATES,
  FRAMERATE_MODES,
  AUDIO_SAMPLE_RATES,
  AUDIO_MIXDOWNS,
  DEINTERLACE_OPTIONS,
  DENOISE_OPTIONS,
  SHARPEN_OPTIONS,
  CODECS_WITH_QUALITY,
  CODECS_WITH_MULTIPASS,
  isAudioReencoding,
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
    className={`${tw.input.select} ${cls || ''}`}
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

const VideoTab = observer(() => {
  const { t } = useTranslation()
  const codec = store.videoEncoder
  const isGif = store.container === 'gif'
  const hasPreset = codec in ENCODER_PRESETS
  const hasQuality = CODECS_WITH_QUALITY.has(codec)
  const hasTune = codec in ENCODER_TUNES
  const hasProfile = codec in ENCODER_PROFILES
  const hasLevel = codec in ENCODER_LEVELS
  const showMultiPass =
    store.qualityType === 'abr' && CODECS_WITH_MULTIPASS.has(codec)

  return (
    <div className="flex flex-col gap-2.5">
      <FieldRow label={t('container')}>
        <Select
          value={store.container}
          onChange={(v) => store.setContainer(v)}
          options={CONTAINERS.map((c) => ({ value: c.value, label: c.label }))}
          disabled={store.isConverting}
          className="w-full"
        />
      </FieldRow>
      {!isGif && (
        <FieldRow label={t('encoder')}>
          <Select
            value={store.videoEncoder}
            onChange={(v) => store.setVideoEncoder(v)}
            options={store.availableEncoders.map((e) => ({
              value: e.value,
              label: e.label,
            }))}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
      {!isGif && hasPreset && (
        <FieldRow label={t('encoderPreset')}>
          <Select
            value={store.preset}
            onChange={(v) => store.setPreset(v)}
            options={ENCODER_PRESETS[codec]}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
      {!isGif && hasQuality && (
        <FieldRow label={t('qualityType')}>
          <Select
            value={store.qualityType}
            onChange={(v) => store.setQualityType(v as 'crf' | 'abr')}
            options={QUALITY_TYPES}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
      {!isGif && hasQuality && store.qualityType === 'crf' && (
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
            <span
              className={`text-xs font-mono ${tw.accent.text} w-7 text-right tabular-nums`}
            >
              {store.crf}
            </span>
          </div>
        </FieldRow>
      )}
      {!isGif && hasQuality && store.qualityType === 'abr' && (
        <FieldRow label={t('avgBitrate')}>
          <div className="flex items-center gap-2 w-full">
            <input
              type="number"
              min={100}
              max={100000}
              step={100}
              value={store.avgBitrate}
              onChange={(e) =>
                store.setAvgBitrate(parseInt(e.target.value, 10) || 2500)
              }
              disabled={store.isConverting}
              className={`flex-1 ${tw.input.select}`}
            />
            <span className={`text-[11px] font-mono ${tw.text.muted} shrink-0`}>
              kbps
            </span>
          </div>
        </FieldRow>
      )}
      {!isGif && showMultiPass && (
        <FieldRow label={t('multiPass')}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={store.multiPass}
              onChange={(e) => store.setMultiPass(e.target.checked)}
              disabled={store.isConverting}
              className="accent-teal-500"
            />
            <span className={`text-xs ${tw.text.label}`}>
              {t('multiPassDesc')}
            </span>
          </label>
        </FieldRow>
      )}
      {!isGif && hasTune && (
        <FieldRow label={t('tune')}>
          <Select
            value={store.encoderTune}
            onChange={(v) => store.setEncoderTune(v)}
            options={ENCODER_TUNES[codec]}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
      {!isGif && hasProfile && (
        <FieldRow label={t('profile')}>
          <Select
            value={store.encoderProfile}
            onChange={(v) => store.setEncoderProfile(v)}
            options={ENCODER_PROFILES[codec]}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
      {!isGif && hasLevel && (
        <FieldRow label={t('level')}>
          <Select
            value={store.encoderLevel}
            onChange={(v) => store.setEncoderLevel(v)}
            options={ENCODER_LEVELS[codec]}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
    </div>
  )
})

const PictureTab = observer(() => {
  const { t } = useTranslation()
  const isGif = store.container === 'gif'

  return (
    <div className="flex flex-col gap-2.5">
      <FieldRow label={t('resolution')}>
        <Select
          value={store.resolution}
          onChange={(v) => store.setResolution(v)}
          options={RESOLUTIONS}
          disabled={store.isConverting}
          className="w-full"
        />
      </FieldRow>
      {!isGif && (
        <FieldRow label={t('framerate')}>
          <Select
            value={store.framerate}
            onChange={(v) => store.setFramerate(v)}
            options={FRAMERATES}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
      {!isGif && store.framerate !== 'auto' && (
        <FieldRow label={t('framerateMode')}>
          <Select
            value={store.framerateMode}
            onChange={(v) => store.setFramerateMode(v)}
            options={FRAMERATE_MODES}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
    </div>
  )
})

const FiltersTab = observer(() => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2.5">
      <FieldRow label={t('deinterlace')}>
        <Select
          value={store.deinterlace}
          onChange={(v) => store.setDeinterlace(v)}
          options={DEINTERLACE_OPTIONS}
          disabled={store.isConverting}
          className="w-full"
        />
      </FieldRow>
      <FieldRow label={t('denoise')}>
        <Select
          value={store.denoise}
          onChange={(v) => store.setDenoise(v)}
          options={DENOISE_OPTIONS}
          disabled={store.isConverting}
          className="w-full"
        />
      </FieldRow>
      <FieldRow label={t('sharpen')}>
        <Select
          value={store.sharpen}
          onChange={(v) => store.setSharpen(v)}
          options={SHARPEN_OPTIONS}
          disabled={store.isConverting}
          className="w-full"
        />
      </FieldRow>
    </div>
  )
})

const AudioTab = observer(() => {
  const { t } = useTranslation()
  const showAudioOptions = isAudioReencoding(store.audioCodec)

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
      {showAudioOptions && (
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
      {showAudioOptions && (
        <FieldRow label={t('sampleRate')}>
          <Select
            value={store.audioSampleRate}
            onChange={(v) => store.setAudioSampleRate(v)}
            options={AUDIO_SAMPLE_RATES}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
      {showAudioOptions && (
        <FieldRow label={t('mixdown')}>
          <Select
            value={store.audioMixdown}
            onChange={(v) => store.setAudioMixdown(v)}
            options={AUDIO_MIXDOWNS}
            disabled={store.isConverting}
            className="w-full"
          />
        </FieldRow>
      )}
    </div>
  )
})

type TabKey = 'video' | 'picture' | 'filters' | 'audio'

const TAB_KEYS: TabKey[] = ['video', 'picture', 'filters', 'audio']

const TAB_COMPONENTS: Record<TabKey, React.ComponentType> = {
  video: VideoTab,
  picture: PictureTab,
  filters: FiltersTab,
  audio: AudioTab,
}

const CommandModal = observer(({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const command = store.ffmpegCommand

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = () => {
    if (!command) return
    navigator.clipboard.writeText(command)
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 ${tw.bg.panel} rounded-xl shadow-2xl border ${tw.border} w-[520px] max-w-[90vw] max-h-[70vh] flex flex-col data-[state=open]:animate-scale-in`}
          aria-describedby={undefined}
        >
          <Dialog.Title
            className={`flex items-center justify-between px-4 py-3 border-b ${tw.border}`}
          >
            <span className={`text-sm font-semibold ${tw.text.primary}`}>
              {t('ffmpegCommand')}
            </span>
            <Dialog.Close asChild>
              <button className={`${tw.button.ghost} rounded-md p-1`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </Dialog.Close>
          </Dialog.Title>
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {command ? (
              <pre
                className={`text-xs font-mono leading-relaxed ${tw.text.secondary} whitespace-pre-wrap break-all select-all ${tw.bg.surface} rounded-lg p-3`}
              >
                {command}
              </pre>
            ) : (
              <p className={`text-xs ${tw.text.muted} text-center py-6`}>
                {t('noSourceForCommand')}
              </p>
            )}
          </div>
          {command && (
            <div className={`px-4 py-3 border-t ${tw.border} flex justify-end`}>
              <button
                onClick={handleCopy}
                className={`${tw.button.secondary} rounded-md px-3 py-1.5 text-xs font-medium transition-colors`}
              >
                {copied ? t('copied') : t('copy')}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default observer(function SettingsTabs() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>('video')
  const [showCommand, setShowCommand] = useState(false)

  const isGif = store.container === 'gif'
  const visibleTabs = isGif
    ? TAB_KEYS.filter((k) => k !== 'audio' && k !== 'filters')
    : TAB_KEYS

  const ActiveComponent = TAB_COMPONENTS[activeTab]

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div
        className={`flex items-center border-b ${tw.border} px-2 gap-0.5 shrink-0`}
      >
        {visibleTabs.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition-colors relative ${
              activeTab === key
                ? `${tw.text.accent}`
                : `${tw.text.muted} hover:text-stone-600 dark:hover:text-stone-300`
            }`}
          >
            {t(key)}
            {activeTab === key && (
              <div className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-teal-500" />
            )}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowCommand(true)}
          className={`${tw.button.ghost} rounded-md p-1.5 transition-colors`}
          title={t('ffmpegCommand')}
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div
          className="p-4 animate-slide-up"
          style={{ animationDelay: '50ms' }}
        >
          <ActiveComponent />
        </div>
      </div>
      {showCommand && <CommandModal onClose={() => setShowCommand(false)} />}
    </div>
  )
})
