import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import className from 'licia/className'
import waitUntil from 'licia/waitUntil'
import renderApp from 'tinker-share/lib/renderApp'
import Controls from './components/Controls'
import LinkMeter from './components/LinkMeter'
import MetricRail from './components/MetricRail'
import { formatMs, formatSpeed } from './lib/format'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t } = useTranslation()

  const metricCells = [
    {
      label: t('ping'),
      value: formatMs(store.pingMs),
      unit: 'ms',
    },
    {
      label: t('jitter'),
      value: formatMs(store.jitterMs),
      unit: 'ms',
    },
    {
      label: t('download'),
      value: formatSpeed(store.downloadMbps, store.unit),
      unit: store.unitLabel,
      tone: 'down' as const,
    },
    {
      label: t('upload'),
      value: formatSpeed(store.uploadMbps, store.unit),
      unit: store.unitLabel,
      tone: 'up' as const,
    },
  ]

  return (
    <Toast.Provider duration={4000}>
      <div
        className={className('flex h-screen flex-col overflow-hidden', tw.app)}
      >
        <Controls />

        <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
          <div className="flex w-full max-w-[560px] flex-col gap-3">
            <LinkMeter
              valueLabel={store.displayLabel}
              unit={store.displayUnit}
              numericValue={store.displayNumeric}
              progress={store.progress}
              running={store.running}
              isPing={store.isPingPhase}
              hint={t('gaugeHint')}
            />
            <MetricRail cells={metricCells} />
          </div>
        </main>
      </div>

      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        className={`${tw.toast.root} data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity`}
      >
        <div className="min-w-0 flex-1">
          <Toast.Title className={tw.toast.title}>{t('error')}</Toast.Title>
          <Toast.Description className={tw.toast.description}>
            {store.toastMsg}
          </Toast.Description>
        </div>
        <Toast.Close className={tw.toast.close}>
          <X className="h-3.5 w-3.5" />
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className={tw.toast.viewport} />
    </Toast.Provider>
  )
})

void (async () => {
  await waitUntil(() => typeof speedTest !== 'undefined')
  store.init()
  await renderApp(App, {
    'en-US': enUS,
    'zh-CN': zhCN,
  })
})()
