import { useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import LunaShaderToyPlayer from 'luna-shader-toy-player/react'
import 'luna-shader-toy-player/css'
import fullscreen from 'licia/fullscreen'
import renderApp from 'tinker-share/lib/renderApp'
import { showContextMenu } from 'tinker-share/components/ContextMenu'
import snowy from './lib/snowy'
import rainy from './lib/rainy'
import seaside from './lib/seaside'
import fire from './lib/fire'
import deepOcean from './lib/deepOcean'
import night from './lib/night'
import store from './store'
import { SCENES } from './types'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

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

const VOLUME_VALUES = [0, 0.25, 0.5, 0.75, 1] as const

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
    void audio.play()
  }, [scene, volume])

  useEffect(() => {
    function onResize() {
      setSize(calcShaderSize(window.innerWidth, window.innerHeight))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, [
      ...SCENES.map((key) => ({
        label: t(key),
        type: 'radio' as const,
        checked: scene === key,
        click: () => store.setScene(key),
      })),
      { type: 'separator' },
      {
        label: t('volume'),
        submenu: VOLUME_VALUES.map((value) => ({
          label: value === 0 ? t('mute') : `${value * 100}%`,
          type: 'radio' as const,
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
  const shaderStyle = useMemo(
    () => ({
      width,
      height,
      transformOrigin: '0 0',
      transform: scale === 1 ? undefined : `scale(${scale})`,
    }),
    [width, height, scale],
  )

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

void renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
