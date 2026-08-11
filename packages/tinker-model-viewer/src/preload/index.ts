import { contextBridge } from 'electron'
import { convertSpecGlossGlb, convertSpecGlossGltfPackage } from './specGloss'

const api = {
  convertSpecGlossGlb,
  convertSpecGlossGltfPackage,
}

contextBridge.exposeInMainWorld('modelViewer', api)

declare global {
  const modelViewer: {
    convertSpecGlossGlb(buffer: ArrayBuffer): Promise<ArrayBuffer>
    convertSpecGlossGltfPackage(payload: {
      gltfJson: string
      resources: Record<string, ArrayBuffer>
    }): Promise<ArrayBuffer>
  }
}
