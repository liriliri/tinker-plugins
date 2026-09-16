import type { SearchCategory } from '../../common/types'

export const CATEGORIES: SearchCategory[] = ['all', 'apps', 'plugins', 'files']

export const CATEGORY_LABEL: Record<SearchCategory, string> = {
  all: 'categoryAll',
  apps: 'categoryApps',
  plugins: 'categoryPlugins',
  files: 'categoryFiles',
}
