import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Pause, Play } from 'lucide-react'
import className from 'licia/className'
import WaveSurfer from 'wavesurfer.js'
import store from '../store'
import { tw } from '../theme'

interface WaveSurferPlayerProps {
  url: string
  height?: number
}

function waveColors(dark: boolean) {
  return {
    waveColor: dark ? tw.wave.colorDark : tw.wave.color,
    progressColor: dark ? tw.wave.progressDark : tw.wave.progress,
    cursorColor: dark ? tw.wave.progressDark : tw.wave.progress,
  }
}

const WaveSurferPlayer = observer(function WaveSurferPlayer({
  url,
  height = 36,
}: WaveSurferPlayerProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !url) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url,
      height,
      ...waveColors(store.isDark),
      cursorWidth: 1,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      interact: true,
    })
    wavesurferRef.current = ws
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    ws.on('play', onPlay)
    ws.on('pause', onPause)
    ws.on('finish', onPause)

    return () => {
      ws.destroy()
      wavesurferRef.current = null
      setPlaying(false)
    }
  }, [url, height])

  useEffect(() => {
    wavesurferRef.current?.setOptions(waveColors(store.isDark))
  }, [store.isDark])

  return (
    <div className="flex items-center gap-2 w-full">
      <button
        type="button"
        className={className(
          'inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 cursor-pointer',
          tw.button.primary,
          'border-none',
        )}
        aria-label={playing ? t('pause') : t('play')}
        onClick={() => void wavesurferRef.current?.playPause()}
      >
        {playing ? (
          <Pause size={12} fill="currentColor" />
        ) : (
          <Play size={12} fill="currentColor" className="translate-x-px" />
        )}
      </button>
      <div className="flex-1 min-w-0" ref={containerRef} />
    </div>
  )
})

export default WaveSurferPlayer
