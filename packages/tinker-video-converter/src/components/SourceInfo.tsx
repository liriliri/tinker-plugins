import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Film } from 'lucide-react'
import fileSize from 'licia/fileSize'
import { tw } from '../theme'
import store from '../store'
import { GLOBAL_PRESETS } from '../lib/constants'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '--'
  return fileSize(bytes)
}

const Tag = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'accent'
}) => (
  <span
    className={`tag ${variant === 'accent' ? tw.tag.accent : tw.tag.default}`}
  >
    {children}
  </span>
)

export default observer(function SourceInfo() {
  const { t } = useTranslation()
  const source = store.source
  if (!source) return null

  const { videoInfo, audioInfo } = source

  return (
    <div
      className={`px-4 py-3 ${tw.bg.panel} border-b ${tw.border} animate-slide-up noise-texture`}
    >
      <div className="relative flex items-start gap-3">
        {videoInfo?.thumbnail ? (
          <div className="relative flex-shrink-0 rounded-lg overflow-hidden shadow-lg shadow-black/30">
            <img
              src={videoInfo.thumbnail}
              className="w-40 h-[90px] object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg" />
          </div>
        ) : (
          <div
            className={`w-40 h-[90px] flex items-center justify-center rounded-lg ${tw.bg.surface} border ${tw.border}`}
          >
            <Film className={`w-6 h-6 ${tw.text.muted}`} />
          </div>
        )}

        <div className="flex-1 min-w-0 py-0.5">
          <div
            className={`text-[13px] font-semibold ${tw.text.primary} truncate mb-2`}
          >
            {source.fileName}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {videoInfo && (
              <>
                <Tag variant="accent">{videoInfo.codec.toUpperCase()}</Tag>
                <Tag>
                  {videoInfo.width}×{videoInfo.height}
                </Tag>
                <Tag>{Math.round(videoInfo.fps)}fps</Tag>
                <Tag>{formatDuration(videoInfo.duration)}</Tag>
                {videoInfo.bitrate && (
                  <Tag>{Math.round(videoInfo.bitrate)}kbps</Tag>
                )}
              </>
            )}
            {audioInfo && (
              <Tag>
                {audioInfo.codec.toUpperCase()}
                {audioInfo.bitrate
                  ? ` ${Math.round(audioInfo.bitrate)}kbps`
                  : ''}
              </Tag>
            )}
            <Tag>{formatSize(source.size)}</Tag>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <select
              value={store.activePresetName}
              onChange={(e) => {
                const preset = GLOBAL_PRESETS.find(
                  (p) => p.name === e.target.value,
                )
                if (preset) store.applyPreset(preset)
              }}
              disabled={store.isConverting}
              className={`${tw.input.select} text-[11px] flex-1`}
            >
              <option value="">{t('customPreset')}</option>
              {GLOBAL_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
})
