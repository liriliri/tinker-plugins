import sleep from 'licia/sleep'
import waitUntil from 'licia/waitUntil'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'search') {
      return search(getStore(), args as { query: string })
    }
    if (name === 'locate') {
      return locate(getStore())
    }
    if (name === 'list_bookmarks') {
      return listBookmarks(getStore())
    }
    if (name === 'add_bookmark') {
      return addBookmark(
        getStore(),
        args as { name: string; lat: number; lng: number },
      )
    }
    if (name === 'remove_bookmark') {
      return removeBookmark(getStore(), args as { id: string })
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function search(store: Store, args: { query: string }) {
  store.setSearch(args.query.trim())
  await sleep(550)
  await waitUntil(() => !store.searching, 0, 50)

  return {
    query: store.searchQuery,
    locations: store.locations.map((loc, index) => ({
      index,
      id: loc.id,
      name: loc.name,
      description: loc.description,
      lat: loc.lat,
      lng: loc.lng,
    })),
  }
}

async function locate(store: Store) {
  const coords = await store.locateMe()
  if (!coords) {
    throw new Error('Failed to determine current location')
  }
  return {
    lat: coords.lat,
    lng: coords.lng,
  }
}

function listBookmarks(store: Store) {
  return {
    bookmarks: store.bookmarks,
  }
}

function addBookmark(
  store: Store,
  args: { name: string; lat: number; lng: number },
) {
  store.openBookmarkDialog({ lat: args.lat, lng: args.lng })
  store.addBookmark(args.name)
  if (store.pendingBookmark) {
    store.closeBookmarkDialog()
    throw new Error('Failed to add bookmark. Name must not be blank.')
  }
  return listBookmarks(store)
}

function removeBookmark(store: Store, args: { id: string }) {
  const exists = store.bookmarks.some((b) => b.id === args.id)
  if (!exists) {
    throw new Error(`Bookmark not found: ${args.id}`)
  }
  store.removeBookmark(args.id)
  return listBookmarks(store)
}
