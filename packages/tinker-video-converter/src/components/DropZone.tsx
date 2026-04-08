import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Film } from 'lucide-react'
import store from '../store'

export default function DropZone() {
  const { t } = useTranslation()
  const [hovering, setHovering] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setHovering(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setHovering(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setHovering(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      store.handleDrop(file as File & { path?: string })
    }
  }, [])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => store.openFile()}
      className="flex-1 flex items-center justify-center cursor-pointer relative overflow-hidden film-strip-bg film-perf-left film-perf-right"
    >
      <div
        className={`flex flex-col items-center gap-5 transition-transform duration-300 ${
          hovering ? 'scale-105' : 'scale-100'
        }`}
      >
        <div
          className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            hovering
              ? 'bg-amber-500/15 shadow-[0_0_40px_rgba(245,158,11,0.15)]'
              : 'bg-stone-800/60'
          }`}
        >
          <Film
            className={`w-8 h-8 transition-colors duration-300 ${
              hovering ? 'text-amber-400' : 'text-stone-500'
            }`}
            strokeWidth={1.5}
          />
          <div
            className={`absolute inset-0 rounded-2xl border transition-colors duration-300 ${
              hovering ? 'border-amber-500/40' : 'border-stone-700/50'
            }`}
          />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <p
            className={`text-sm font-medium transition-colors duration-300 ${
              hovering ? 'text-stone-200' : 'text-stone-400'
            }`}
          >
            {t('dropHint')}
          </p>
          <p className="text-[11px] text-stone-600 font-mono">
            MP4 · MKV · AVI · MOV · WebM
          </p>
        </div>
      </div>
    </div>
  )
}
