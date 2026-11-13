import { lazy, Suspense } from 'react'
import { observer } from 'mobx-react-lite'
import { Download, PackagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import trim from 'licia/trim'
import { formatDate, formatSize } from '../lib/format'
import { tw } from '../theme'
import store from '../store'
import AppScrollArea from './AppScrollArea'
import LoadingSpinner from './LoadingSpinner'

const ReadmeMarkdown = lazy(() => import('./ReadmeMarkdown'))

interface MetaRowProps {
  label: string
  children: React.ReactNode
}

function MetaRow({ label, children }: MetaRowProps) {
  return (
    <div
      className={className(
        'flex gap-3 text-[12px] py-1.5 border-b last:border-b-0',
        tw.border.divider,
      )}
    >
      <dt
        className={className(
          'w-28 shrink-0 font-medium uppercase tracking-wide text-[10px] pt-0.5',
          tw.text.secondary,
        )}
      >
        {label}
      </dt>
      <dd className={className('min-w-0 break-all', tw.text.primary)}>
        {children}
      </dd>
    </div>
  )
}

interface DepListProps {
  title: string
  names: string[]
  versions: Record<string, string>
}

function DepList({ title, names, versions }: DepListProps) {
  const { t } = useTranslation()
  return (
    <section className="mt-5">
      <h3
        className={className(
          'text-[11px] font-semibold uppercase tracking-wide mb-2',
          tw.text.secondary,
        )}
      >
        {title}
      </h3>
      {isEmpty(names) ? (
        <p className={className('text-[12px]', tw.empty)}>{t('none')}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {map(names, (name) => (
            <li key={name}>
              <button
                type="button"
                className={className(
                  'border-none cursor-default pkg-name text-[11px]',
                  tw.badge,
                  'hover:brightness-95',
                )}
                onClick={() => {
                  store.setQuery(name)
                  void store.search()
                  void store.selectPackage(name)
                }}
                title={`${name}@${versions[name]}`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const PackageDetail = observer(function PackageDetail() {
  const { t } = useTranslation()
  const detail = store.detail

  if (!store.detailOpen) return null

  if (!detail) {
    return (
      <aside
        className={className(
          'relative flex-1 min-w-0 flex flex-col border-l',
          tw.border.divider,
          tw.background.app,
        )}
      >
        <button
          type="button"
          className={className(tw.button.icon, 'absolute top-3 right-3 z-10')}
          title={t('close')}
          onClick={() => store.closeDetail()}
        >
          <X className="w-4 h-4" />
        </button>
        <LoadingSpinner />
      </aside>
    )
  }

  const hasReadme = !isEmpty(trim(detail.readme))
  const installTitle = store.isInstalling ? t('installing') : t('install')
  const downloadTitle = store.isDownloading ? t('downloading') : t('download')

  return (
    <aside
      className={className(
        'flex-1 min-w-0 flex flex-col border-l',
        tw.border.divider,
        tw.background.app,
      )}
    >
      <div
        className={className('px-5 py-4 border-b shrink-0', tw.border.divider)}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2
              className={className(
                'pkg-name text-[20px] font-bold truncate pr-1 leading-tight',
                tw.text.accent,
              )}
            >
              {detail.name}
            </h2>
            {detail.description ? (
              <p
                className={className(
                  'mt-1.5 text-[13px] leading-snug',
                  tw.text.primary,
                )}
              >
                {detail.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={className(tw.button.icon, 'shrink-0 -mt-0.5 -mr-1')}
            title={t('close')}
            onClick={() => store.closeDetail()}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={className(tw.tab.list, tw.border.divider)}>
        <div className={tw.tab.triggers}>
          <button
            type="button"
            className={
              store.detailTab === 'readme'
                ? tw.tab.triggerActive
                : tw.tab.trigger
            }
            onClick={() => store.setDetailTab('readme')}
          >
            {t('readme')}
          </button>
          <button
            type="button"
            className={
              store.detailTab === 'overview'
                ? tw.tab.triggerActive
                : tw.tab.trigger
            }
            onClick={() => store.setDetailTab('overview')}
          >
            {t('overview')}
          </button>
        </div>
        <div className={tw.tab.actions}>
          <select
            className={tw.tabSelect}
            value={store.selectedVersion}
            onChange={(e) => store.setSelectedVersion(e.target.value)}
            disabled={store.isBusy}
            aria-label={t('version')}
          >
            {map(detail.versions, (ver) => (
              <option key={ver} value={ver}>
                {ver}
                {ver === detail.latest ? ` (${t('latest')})` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={tw.tabPrimaryIcon}
            disabled={store.isBusy}
            title={installTitle}
            onClick={() => void store.installGlobal()}
          >
            <PackagePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className={tw.tabSecondaryIcon}
            disabled={store.isBusy}
            title={downloadTitle}
            onClick={() => void store.downloadAndExtract()}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AppScrollArea viewportClassName="px-5 py-4">
        {store.detailTab === 'readme' ? (
          hasReadme ? (
            <Suspense
              fallback={<LoadingSpinner className="min-h-[50vh] flex-none" />}
            >
              <ReadmeMarkdown content={detail.readme} />
            </Suspense>
          ) : (
            <p className={className('text-[12px]', tw.empty)}>
              {t('noReadme')}
            </p>
          )
        ) : (
          <>
            <dl>
              <MetaRow label={t('version')}>{store.selectedVersion}</MetaRow>
              {detail.license ? (
                <MetaRow label={t('license')}>{detail.license}</MetaRow>
              ) : null}
              {detail.time ? (
                <MetaRow label={t('published')}>
                  {formatDate(detail.time)}
                </MetaRow>
              ) : null}
              {!isEmpty(detail.maintainers) ? (
                <MetaRow label={t('publisher')}>
                  {detail.maintainers.join(', ')}
                </MetaRow>
              ) : null}
              {detail.unpackedSize ? (
                <MetaRow label={t('size')}>
                  {formatSize(detail.unpackedSize)}
                </MetaRow>
              ) : null}
              {detail.homepage ? (
                <MetaRow label={t('homepage')}>
                  <a
                    className={tw.text.link}
                    href={detail.homepage}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {detail.homepage}
                  </a>
                </MetaRow>
              ) : null}
              {detail.repository ? (
                <MetaRow label={t('repository')}>
                  <span className="break-all">{detail.repository}</span>
                </MetaRow>
              ) : null}
              {!isEmpty(detail.keywords) ? (
                <MetaRow label={t('keywords')}>
                  <div className="flex flex-wrap gap-1">
                    {map(detail.keywords, (kw) => (
                      <span key={kw} className={tw.keyword}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </MetaRow>
              ) : null}
            </dl>

            <DepList
              title={t('dependencies')}
              names={store.dependencyNames}
              versions={detail.dependencies}
            />
            <DepList
              title={t('devDependencies')}
              names={store.devDependencyNames}
              versions={detail.devDependencies}
            />
          </>
        )}
      </AppScrollArea>
    </aside>
  )
})

export default PackageDetail
