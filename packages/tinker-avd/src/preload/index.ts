import { contextBridge } from 'electron'
import { getAvds, startAvd, stopAvd, wipeAvdData } from '../lib/avd'
import type { IAvd } from '../common/types'

const api = {
  getAvds: (forceRefresh?: boolean): Promise<IAvd[]> => getAvds(forceRefresh),
  startAvd: (avdId: string): Promise<void> => startAvd(avdId),
  stopAvd: (avdId: string): Promise<void> => stopAvd(avdId),
  wipeAvdData: (avdId: string): Promise<void> => wipeAvdData(avdId),
}

contextBridge.exposeInMainWorld('avd', api)

declare global {
  const avd: typeof api
}
