import splitPath from 'licia/splitPath'
import type { SearchResultItem } from '../../common/types'
import { buildSearchText } from './match'

export interface AppEntry {
  name: string
  path: string
  icon: string
  searchText: string
}

export interface PluginEntry {
  id: string
  name: string
  description: string
  icon: string
  searchText: string
}

export function toAppEntry(app: tinker.AppInfo): AppEntry {
  return {
    name: app.name,
    path: app.path,
    icon: app.icon,
    searchText: buildSearchText(app.name),
  }
}

export function toPluginEntry(plugin: tinker.PluginInfo): PluginEntry {
  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    icon: plugin.icon,
    searchText: buildSearchText(plugin.name, plugin.id),
  }
}

function fileName(filePath: string) {
  return splitPath(filePath).name || filePath
}

export function toAppItem(app: AppEntry): SearchResultItem {
  return {
    id: `app:${app.path}`,
    category: 'apps',
    title: app.name,
    subtitle: app.path,
    icon: app.icon,
  }
}

export function toPluginItem(plugin: PluginEntry): SearchResultItem {
  return {
    id: `plugin:${plugin.id}`,
    category: 'plugins',
    title: plugin.name,
    subtitle: plugin.description || plugin.id,
    icon: plugin.icon,
  }
}

export function toFileItem(
  file: tinker.SearchFileResult,
  icon?: string,
): SearchResultItem {
  return {
    id: `file:${file.path}`,
    category: 'files',
    title: fileName(file.path),
    subtitle: file.path,
    icon,
  }
}
