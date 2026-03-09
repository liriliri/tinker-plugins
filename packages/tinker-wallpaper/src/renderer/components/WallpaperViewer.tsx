import { observer } from 'mobx-react-lite'
import { useState, useEffect } from 'react'
import { X, Save, Monitor, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Select from '@radix-ui/react-select'
import { tw } from '../theme'
import store from '../store'

interface IconBtnProps {
  tooltip: string
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}

function IconBtn({ tooltip, onClick, disabled, children }: IconBtnProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          className={tw.viewer.iconBtn}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={tw.tooltip.content} sideOffset={6}>
          {tooltip}
          <Tooltip.Arrow className={tw.tooltip.arrow} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

const WallpaperViewer = observer(() => {
  const { t } = useTranslation()
  const [imgLoaded, setImgLoaded] = useState(false)
  const w = store.selectedWallpaper

  useEffect(() => {
    setImgLoaded(false)
  }, [store.originalUrl])

  const options = store.imageOptions
  const showSelect = options.length > 1

  return (
    <Tooltip.Provider delayDuration={600}>
      <Dialog.Root
        open={!!w}
        onOpenChange={(open) => {
          if (!open) store.setSelectedWallpaper(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={tw.viewer.overlay} />
          <Dialog.Content
            className={tw.viewer.content}
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">{t('preview')}</Dialog.Title>

            <div className={tw.viewer.toolbar}>
              {showSelect && (
                <Select.Root
                  value={String(store.selectedUrlIndex)}
                  onValueChange={(v) => store.selectUrl(Number(v))}
                >
                  <Select.Trigger className={tw.viewer.select}>
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      className={tw.viewer.selectContent}
                      position="popper"
                      sideOffset={6}
                    >
                      <Select.Viewport>
                        <Select.Item
                          value="-1"
                          className={tw.viewer.selectItem}
                        >
                          <Select.ItemText>{t('auto')}</Select.ItemText>
                        </Select.Item>
                        {options.map((opt, i) => (
                          <Select.Item
                            key={i}
                            value={String(i)}
                            className={tw.viewer.selectItem}
                          >
                            <Select.ItemText>{opt.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              )}

              <div className="flex-1" />

              <IconBtn
                tooltip={t('saveTooltip')}
                onClick={() => store.save()}
                disabled={!store.originalUrl || store.isSaving}
              >
                <Save className="w-4 h-4" />
              </IconBtn>
              <IconBtn
                tooltip={t('setWallpaperTooltip')}
                onClick={() => store.setWallpaper()}
                disabled={!store.originalUrl || store.isSetting}
              >
                <Monitor className="w-4 h-4" />
              </IconBtn>
              <Dialog.Close asChild>
                <button className={tw.viewer.iconBtn}>
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="w-full h-full flex items-center justify-center">
              {store.isLoadingOriginal && <div className={tw.viewer.spinner} />}
              {store.originalUrl && (
                <img
                  src={store.originalUrl}
                  className={`w-full h-full object-contain transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImgLoaded(true)}
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Tooltip.Provider>
  )
})

export default WallpaperViewer
