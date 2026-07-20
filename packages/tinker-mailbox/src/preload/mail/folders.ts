import filter from 'licia/filter'
import map from 'licia/map'
import type { FolderInfo } from '../../common/types'
import { mapRole } from './parse'
import { ensureClient } from './session'

export async function listFolders(): Promise<FolderInfo[]> {
  const c = await ensureClient()
  const list = await c.list()
  return map(
    filter(list, (box) => !box.flags?.has('\\Noselect')),
    (box) => ({
      path: box.path,
      name: box.name || box.path,
      role: mapRole(box.specialUse),
      delimiter: box.delimiter,
    }),
  )
}
