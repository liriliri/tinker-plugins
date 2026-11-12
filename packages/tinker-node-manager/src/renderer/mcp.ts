import contain from 'licia/contain'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import type { INodeVersion, IRemoteVersion } from '../common/types'
import type { Store } from './store'

function serializeVersion(item: INodeVersion) {
  return {
    id: item.id,
    version: item.version,
    aliases: item.aliases,
    isDefault: item.isDefault,
    isSystem: item.isSystem,
  }
}

function serializeRemoteVersion(item: IRemoteVersion, store: Store) {
  return {
    id: item.id,
    version: item.version,
    lts: item.lts,
    installed: store.isRemoteInstalled(item),
  }
}

function findVersion(store: Store, version: string) {
  const key = trim(version)
  const item =
    find(store.versions, (v) => v.id === key) ||
    find(store.versions, (v) => v.version === key) ||
    find(store.versions, (v) => `v${key}` === v.version)
  if (!item) {
    throw new Error(`Node version not found: ${version}`)
  }
  return item
}

function matchesVersion(item: INodeVersion, requested: string) {
  const key = trim(requested)
  if (!key || key === 'lts' || key === 'latest') return false
  return (
    item.id === key ||
    item.version === key ||
    item.version === `v${key}` ||
    startWith(item.version, `${key}.`) ||
    startWith(item.version, `v${key}.`) ||
    contain(item.aliases, key)
  )
}

async function ensureVersions(store: Store) {
  if (isEmpty(store.versions)) {
    await store.loadVersions({ silent: true })
  }
}

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    list_versions: listVersions,
    list_remote_versions: listRemoteVersions,
    install_version: installVersion,
    uninstall_version: uninstallVersion,
    set_default: setDefault,
  })
}

async function listVersions(store: Store) {
  await store.loadVersions({ silent: true })
  return {
    versions: map(store.versions, serializeVersion),
  }
}

async function listRemoteVersions(
  store: Store,
  args: { lts_only?: boolean; filter?: string } = {},
) {
  await store.loadRemoteVersions({ silent: true, force: true })
  let versions = store.remoteVersions
  if (args.lts_only) {
    versions = filter(versions, (item) => Boolean(item.lts))
  }
  const q = lowerCase(trim(args.filter || ''))
  if (q) {
    versions = filter(versions, (item) => {
      const haystack = lowerCase([item.version, item.lts || ''].join(' '))
      return contain(haystack, q)
    })
  }
  return {
    count: versions.length,
    versions: map(versions, (item) => serializeRemoteVersion(item, store)),
  }
}

async function installVersion(store: Store, args: { version: string }) {
  await store.installVersion(args.version)
  const item = find(store.versions, (v) => matchesVersion(v, args.version))
  return {
    installed: true,
    version: item ? serializeVersion(item) : { requested: trim(args.version) },
  }
}

async function uninstallVersion(store: Store, args: { version: string }) {
  await ensureVersions(store)
  const item = findVersion(store, args.version)
  await store.uninstallVersion(item.id)
  return {
    uninstalled: true,
    version: serializeVersion(item),
  }
}

async function setDefault(store: Store, args: { version: string }) {
  await ensureVersions(store)
  const item = findVersion(store, args.version)
  await store.setDefault(item.id)
  return {
    defaultSet: true,
    version: serializeVersion(
      find(store.versions, (v) => v.id === item.id) ?? item,
    ),
  }
}
