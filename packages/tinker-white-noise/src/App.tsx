import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import LunaShaderToyPlayer from 'luna-shader-toy-player/react'
import 'luna-shader-toy-player/css'
import fullscreen from 'licia/fullscreen'
import snowy from './lib/snowy'
import rainy from './lib/rainy'
import seaside from './lib/seaside'
import fire from './lib/fire'
import deepOcean from './lib/deepOcean'
import night from './lib/night'
import store from './store'

const scenes = { snowy, rainy, seaside, fire, deepOcean, night }
const MAX_SIZE = 1024

function calcShaderSize(w: number, h: number) {
  const scale = Math.min(1, MAX_SIZE / w, MAX_SIZE / h)
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
    scale: 1 / scale,
  }
}

const App = observer(() => {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement>(null)
  const { scene, volume } = store
  const [size, setSize] = useState(() =>
    calcShaderSize(window.innerWidth, window.innerHeight),
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.play()
  }, [scene])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    function onResize() {
      setSize(calcShaderSize(window.innerWidth, window.innerHeight))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    const volumeLevels = [
      { label: t('mute'), value: 0 },
      { label: '25%', value: 0.25 },
      { label: '50%', value: 0.5 },
      { label: '75%', value: 0.75 },
      { label: '100%', value: 1 },
    ]
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('snowy'),
        type: 'radio',
        checked: scene === 'snowy',
        click: () => store.setScene('snowy'),
      },
      {
        label: t('rainy'),
        type: 'radio',
        checked: scene === 'rainy',
        click: () => store.setScene('rainy'),
      },
      {
        label: t('seaside'),
        type: 'radio',
        checked: scene === 'seaside',
        click: () => store.setScene('seaside'),
      },
      {
        label: t('fire'),
        type: 'radio',
        checked: scene === 'fire',
        click: () => store.setScene('fire'),
      },
      {
        label: t('deepOcean'),
        type: 'radio',
        checked: scene === 'deepOcean',
        click: () => store.setScene('deepOcean'),
      },
      {
        label: t('night'),
        type: 'radio',
        checked: scene === 'night',
        click: () => store.setScene('night'),
      },
      { type: 'separator' },
      {
        label: t('volume'),
        submenu: volumeLevels.map(({ label, value }) => ({
          label,
          type: 'radio',
          checked: volume === value,
          click: () => store.setVolume(value),
        })),
      },
      { type: 'separator' },
      {
        label: t('fullscreen'),
        click: () => fullscreen.toggle(),
      },
    ])
  }

  const current = scenes[scene]
  const { width, height, scale } = size
  const shaderStyle = {
    width,
    height,
    transformOrigin: '0 0',
    transform: scale === 1 ? undefined : `scale(${scale})`,
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden"
      onContextMenu={onContextMenu}
    >
      <audio key={scene} ref={audioRef} src={current.audio} loop />
      <LunaShaderToyPlayer
        renderPass={current.renderPass}
        controls={false}
        style={shaderStyle}
      />
    </div>
  )
})

export default App
