import { useState, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import * as Toast from '@radix-ui/react-toast'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import { tw } from './theme'
import AgentToolbar from './components/AgentToolbar'
import AgentSection from './components/AgentSection'
import './index.scss'

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN },
  },
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
})

const App = observer(() => {
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    clearTimeout(toastTimer.current)
    setToastMsg(msg)
    setToastType(type)
    setToastOpen(false)
    requestAnimationFrame(() => {
      setToastOpen(true)
      toastTimer.current = setTimeout(() => setToastOpen(false), 3000)
    })
  }, [])

  const previewSound = useCallback((url: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const audio = new Audio(url)
    audio.play().catch(console.error)
  }, [])

  return (
    <Toast.Provider swipeDirection="right" duration={Infinity}>
      <div
        className={className(
          'h-screen flex flex-col p-5 overflow-auto',
          tw.background.primary,
        )}
      >
        <div className="mx-auto max-w-xl w-full flex flex-col gap-5">
          <AgentToolbar showToast={showToast} />
          <AgentSection previewSound={previewSound} />
        </div>
      </div>

      <Toast.Root
        className={className(
          'toast-root px-4 py-3 rounded-md shadow-lg',
          toastType === 'success' ? tw.toast.success : tw.toast.error,
        )}
        open={toastOpen}
        onOpenChange={setToastOpen}
      >
        <Toast.Description className="text-sm font-medium">
          {toastMsg}
        </Toast.Description>
      </Toast.Root>

      <Toast.Viewport className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80 outline-none" />
    </Toast.Provider>
  )
})

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
