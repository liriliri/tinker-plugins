import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import map from 'licia/map'
import pascalCase from 'licia/pascalCase'
import {
  MAX_TARGET_QUADS,
  MAX_TARGET_TRIS,
  REMESH_MODES,
  type RemeshMode,
} from '../types'
import store from '../store'
import { tw } from '../theme'
import NumberField from './NumberField'

const Sidebar = observer(function Sidebar() {
  const { t } = useTranslation()
  const busy = store.isProcessing || store.isLoading

  return (
    <div
      className={className(
        'w-[280px] shrink-0 flex flex-col border-l',
        tw.background.sidebar,
        tw.border.sidebar,
      )}
    >
      <div className="flex-1 px-3.5 pt-3.5 pb-3 flex flex-col gap-4 overflow-y-auto">
        <div className="flex flex-col gap-3.5">
          {store.mode === 'quad' ? (
            <>
              <NumberField
                label={t('sharpEdge')}
                value={store.sharpEdgeDegrees}
                min={30}
                max={180}
                step={1}
                disabled={busy}
                title={t('sharpEdgeHint')}
                onChange={(v) => store.setSharpEdgeDegrees(v)}
              />
              <NumberField
                label={t('smoothNormal')}
                value={store.smoothNormalDegrees}
                min={0}
                max={180}
                step={1}
                disabled={busy}
                title={t('smoothNormalHint')}
                onChange={(v) => store.setSmoothNormalDegrees(v)}
              />
              <NumberField
                label={t('adaptivity')}
                value={store.adaptivity}
                min={0}
                max={1}
                step={0.01}
                decimals={2}
                disabled={busy}
                title={t('adaptivityHint')}
                onChange={(v) => store.setAdaptivity(v)}
              />
              <NumberField
                label={t('anisotropy')}
                value={store.anisotropy}
                min={0}
                max={1}
                step={0.01}
                decimals={2}
                disabled={busy}
                title={t('anisotropyHint')}
                onChange={(v) => store.setAnisotropy(v)}
              />
              <NumberField
                label={t('targetQuads')}
                value={store.targetQuads}
                min={100}
                max={MAX_TARGET_QUADS}
                step={100}
                disabled={busy}
                onChange={(v) => store.setTargetQuads(v)}
              />
              <NumberField
                label={t('edgeScaling')}
                value={store.edgeScaling}
                min={1}
                max={4}
                step={0.1}
                decimals={2}
                disabled={busy}
                onChange={(v) => store.setEdgeScaling(v)}
              />
            </>
          ) : (
            <>
              <NumberField
                label={t('targetTriangles')}
                value={store.targetTriangles}
                min={100}
                max={MAX_TARGET_TRIS}
                step={100}
                disabled={busy}
                onChange={(v) => store.setTargetTriangles(v)}
              />
              <NumberField
                label={t('iterations')}
                value={store.iterations}
                min={1}
                max={20}
                step={1}
                disabled={busy}
                onChange={(v) => store.setIterations(v)}
              />
              <NumberField
                label={t('sharpEdge')}
                value={store.sharpEdgeDegrees}
                min={30}
                max={180}
                step={1}
                disabled={busy}
                title={t('sharpEdgeHint')}
                onChange={(v) => store.setSharpEdgeDegrees(v)}
              />
            </>
          )}
        </div>

        <button
          onClick={() => store.remesh()}
          disabled={!store.canRemesh}
          className={className(
            'w-full h-8 rounded-[6px] text-[12px] font-semibold tracking-wide transition-all',
            store.canRemesh
              ? className(
                  'cursor-pointer',
                  tw.button.primary.default,
                  tw.button.primary.hover,
                )
              : tw.button.primary.disabled,
          )}
        >
          {t('regenerate')}
        </button>

        <div className="flex-1 min-h-2" />

        <div
          className={className('flex p-0.5 rounded-[7px]', tw.segment.track)}
        >
          {map(REMESH_MODES, (mode: RemeshMode) => (
            <button
              key={mode}
              disabled={busy}
              onClick={() => store.setMode(mode)}
              className={className(
                'flex-1 h-7 rounded-[5px] text-[11px] font-medium transition-all disabled:opacity-40',
                store.mode === mode
                  ? tw.segment.active
                  : className(tw.segment.inactive, 'cursor-pointer'),
              )}
            >
              {t(`mode${pascalCase(mode)}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default Sidebar
