import { useState, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import contain from 'licia/contain'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import { RotateCcw } from 'lucide-react'
import store from './store'
import { tw } from './theme'
import Select from './components/Select'
import AgentSection from './components/AgentSection'

const App = observer(() => {
  const { t } = useTranslation()
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const agentStore = store.selectedAgentStore

  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

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

  const handleApply = async () => {
    await agentStore.applyConfig()
    if (contain(agentStore.message, '✓')) {
      showToast(t('applySuccess'), 'success')
    } else {
      showToast(t('applyFailed'), 'error')
    }
  }

  const handleRemove = async () => {
    await agentStore.removeConfig()
    if (contain(agentStore.message, '✓')) {
      showToast(t('removeSuccess'), 'success')
    } else {
      showToast(t('removeFailed'), 'error')
    }
  }

  return (
    <Toast.Provider swipeDirection="right" duration={Infinity}>
      <div
        className={className(
          'h-screen flex flex-col p-5 overflow-auto',
          tw.background.primary,
        )}
      >
        <div className="mx-auto max-w-xl w-full flex flex-col gap-5 animate-fade-in">
          <div
            className={className(
              'flex items-center gap-2.5 px-5 py-2.5 rounded-md',
              tw.border.card,
              tw.background.secondary,
            )}
          >
            <Select
              value={store.selectedAgentId}
              onChange={(e) => store.setSelectedAgent(e.target.value)}
            >
              {store.visibleAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </Select>
            <div className="flex-1" />
            <button
              className={className(
                'flex items-center justify-center w-8 h-8 rounded',
                'transition-all duration-200',
                agentStore.isConfigured
                  ? [
                      'cursor-pointer',
                      tw.text.icon,
                      tw.accent.hoverText,
                      tw.accent.hoverBg,
                      'active:scale-90',
                    ]
                  : 'invisible',
              )}
              disabled={agentStore.saving || !agentStore.isConfigured}
              onClick={handleRemove}
            >
              <RotateCcw size={14} />
            </button>
            <button
              className={className(
                'min-w-20 px-3.5 py-1.5 rounded text-xs font-semibold',
                'transition-all duration-200',
                agentStore.canApply
                  ? tw.button.applyEnabled
                  : tw.button.applyDisabled,
              )}
              disabled={!agentStore.canApply || agentStore.saving}
              onClick={handleApply}
            >
              {agentStore.saving ? t('saving') : t('apply')}
            </button>
          </div>

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

export default App
