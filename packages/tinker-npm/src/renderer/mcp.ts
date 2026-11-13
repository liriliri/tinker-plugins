import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import sleep from 'licia/sleep'
import trim from 'licia/trim'
import waitUntil from 'licia/waitUntil'
import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import type { PackageDetail, PackageSearchItem } from '../common/types'
import type { Store } from './store'

const NO_PACKAGE =
  'No package selected. Call search first, then get_package with an index or name.'

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    search,
    get_package: getPackage,
    install_global: installGlobal,
    download,
  })
}

async function search(store: Store, args: { query: string }) {
  const query = trim(args.query)
  if (!query) throw new Error('query is required')

  clearToast(store)
  store.setQuery(query)
  await sleep(350)
  await waitUntil(() => !store.isSearching, 0, 50)
  assertNoToastError(store)

  return {
    query: store.query,
    total: store.total,
    hasMore: store.hasMore,
    packages: map(store.results, (item, index) => ({
      index,
      ...toSearchSummary(item),
    })),
  }
}

async function getPackage(
  store: Store,
  args: { name?: string; index?: number; version?: string },
) {
  await ensurePackage(store, args)
  return toDetailSummary(store.detail!, store.selectedVersion)
}

async function installGlobal(
  store: Store,
  args: { name?: string; index?: number; version?: string },
) {
  await ensurePackage(store, args)
  clearToast(store)
  await store.installGlobal()
  await waitUntil(() => !store.isInstalling, 0, 50)
  assertNoToastError(store)
  if (store.toastType !== 'success' || store.toastMsg !== 'installSuccess') {
    throw new Error('Install did not complete')
  }
  return {
    installed: true,
    name: store.detail!.name,
    version: store.selectedVersion,
  }
}

async function download(
  store: Store,
  args: { path: string; name?: string; index?: number; version?: string },
) {
  const destDir = trim(args.path)
  if (!destDir) throw new Error('path is required')

  await ensurePackage(store, args)
  clearToast(store)
  const extractPath = await store.downloadAndExtractTo(destDir)
  await waitUntil(() => !store.isDownloading, 0, 50)
  assertNoToastError(store)
  if (!extractPath) {
    throw new Error('Download did not complete')
  }
  return {
    downloaded: true,
    name: store.detail!.name,
    version: store.selectedVersion,
    extractPath,
  }
}

async function ensurePackage(
  store: Store,
  args: { name?: string; index?: number; version?: string },
) {
  const version = args.version ? trim(args.version) : ''
  let name = trim(args.name || '')

  if (!name && args.index != null) {
    const item = store.results[args.index]
    if (!item) {
      throw new Error(
        `Invalid package index: ${args.index}. Call search first and use an index from the results.`,
      )
    }
    name = item.name
  }

  if (!name) {
    if (!store.selectedName || !store.detail) {
      throw new Error(NO_PACKAGE)
    }
    name = store.selectedName
  }

  clearToast(store)
  store.selectedName = name
  await store.loadDetail(name, version || undefined, { resetTab: true })
  await waitUntil(() => !store.isLoadingDetail, 0, 50)
  assertNoToastError(store)

  if (!store.detail || store.selectedName !== name) {
    throw new Error(`Failed to load package: ${name}`)
  }

  if (version && store.selectedVersion !== version) {
    throw new Error(`Version not found: ${version}`)
  }
}

function toSearchSummary(item: PackageSearchItem) {
  return {
    name: item.name,
    version: item.version,
    description: item.description,
    publisher: item.publisher,
    date: item.date,
    weeklyDownloads: item.weeklyDownloads,
    dependents: item.dependents,
  }
}

function toDetailSummary(detail: PackageDetail, version: string) {
  return {
    name: detail.name,
    description: detail.description,
    version,
    latest: detail.latest,
    license: detail.license,
    homepage: detail.homepage,
    repository: detail.repository,
    keywords: detail.keywords,
    maintainers: detail.maintainers,
    time: detail.time,
    unpackedSize: detail.unpackedSize,
    versions: detail.versions,
    dependencies: detail.dependencies,
    devDependencies: detail.devDependencies,
    hasReadme: !isEmpty(trim(detail.readme)),
  }
}

function clearToast(store: Store) {
  store.toastOpen = false
  store.toastMsg = ''
  store.toastType = 'success'
}

function assertNoToastError(store: Store) {
  if (store.toastType === 'error' && store.toastMsg) {
    throw new Error(store.toastMsg)
  }
}
