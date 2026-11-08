import { contextBridge } from 'electron'
import { errorMessage } from 'tinker-share/lib/util'
import { recognizeBytes, recognizePath } from './onnxOcr'

const api = {
  async recognize(data: ArrayBuffer): Promise<string> {
    try {
      return await recognizeBytes(new Uint8Array(data))
    } catch (err) {
      throw errorMessage(err)
    }
  },

  async recognizePath(filePath: string): Promise<string> {
    try {
      return await recognizePath(filePath)
    } catch (err) {
      throw errorMessage(err)
    }
  },
}

contextBridge.exposeInMainWorld('ocrApi', api)

declare global {
  const ocrApi: typeof api
}
