import trim from 'licia/trim'
import map from 'licia/map'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'lookup') {
      return lookup(getStore(), args as { word: string })
    }
    if (name === 'list_dictionaries') {
      return listDictionaries(getStore())
    }
    if (name === 'select_dictionary') {
      return selectDictionary(getStore(), args as { path?: string })
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function lookup(store: Store, args: { word: string }) {
  if (store.dictList.length === 0) {
    throw new Error('No dictionaries loaded. Add an MDX dictionary first.')
  }
  await store.lookupWith(args.word)
  return {
    word: store.selectedWord,
    searchText: store.searchText,
    suggestions: map(store.suggestions, (s) => s.keyText),
    definitions: map(store.definitions, (d) => ({
      dictTitle: d.dictTitle,
      dictPath: d.dictPath,
      definition: d.definition,
    })),
  }
}

function listDictionaries(store: Store) {
  return {
    dictionaries: map(store.dictList, (d) => ({
      title: d.title,
      description: d.description,
      path: d.path,
    })),
    selectedDictPath: store.selectedDictPath,
  }
}

function selectDictionary(store: Store, args: { path?: string }) {
  const path = args.path ? trim(args.path) : null
  if (path && !store.dictList.some((d) => d.path === path)) {
    throw new Error(`Dictionary not found: ${path}`)
  }
  store.selectDict(path)
  return listDictionaries(store)
}
