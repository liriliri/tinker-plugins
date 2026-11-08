import { contextBridge } from 'electron'
import { errorMessage } from 'tinker-share/lib/util'
import { recognizeOnnx } from './onnxOcr'

const api = {
  async recognize(data: ArrayBuffer): Promise<string> {
    try {
      return await recognizeOnnx(new Uint8Array(data))
    } catch (err) {
      throw errorMessage(err)
    }
  },
}

contextBridge.exposeInMainWorld('ocrApi', api)

declare global {
  const ocrApi: typeof api
}
