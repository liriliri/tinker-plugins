import { contextBridge } from 'electron'
import { packGltfPackageToGlb, writeGltfDirectory } from './export'
import { convertSpecGlossGlb, convertSpecGlossGltfPackage } from './specGloss'

const api = {
  convertSpecGlossGlb,
  convertSpecGlossGltfPackage,
  packGltfPackageToGlb,
  writeGltfDirectory,
}

contextBridge.exposeInMainWorld('modelViewer', api)

declare global {
  const modelViewer: {
    convertSpecGlossGlb(buffer: ArrayBuffer): Promise<ArrayBuffer>
    convertSpecGlossGltfPackage(payload: {
      gltfJson: string
      resources: Record<string, ArrayBuffer>
    }): Promise<ArrayBuffer>
    packGltfPackageToGlb(payload: {
      gltfJson: string
      resources: Record<string, ArrayBuffer>
    }): Promise<ArrayBuffer>
    writeGltfDirectory(dir: string, buffer: ArrayBuffer): Promise<string>
  }
}
