import { contextBridge } from 'electron'
import { cancelSpeedTest, listNodes, runSpeedTest } from './engine'
import type { SpeedProgressEvent, SpeedTestResult } from '../common/types'

const api = {
  nodes: listNodes(),
  run: (
    nodeId: string | undefined,
    onProgress: (event: SpeedProgressEvent) => void,
  ): Promise<SpeedTestResult> => runSpeedTest(nodeId, onProgress),
  cancel: () => cancelSpeedTest(),
}

contextBridge.exposeInMainWorld('speedTest', api)

declare global {
  const speedTest: typeof api
}
