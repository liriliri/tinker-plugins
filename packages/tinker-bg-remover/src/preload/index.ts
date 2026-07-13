import path from 'path'
import { contextBridge } from 'electron'
import { removeBackground } from '@imgly/background-removal-node'
import dataUrl from 'licia/dataUrl'
import type { ModelSize } from '../common/types'

const publicPath = `file://${path.dirname(require.resolve('@imgly/background-removal-node'))}/`
const OUTPUT_MIME = 'image/png'

const api = {
  removeBackground: async (
    inputDataUrl: string,
    model: ModelSize = 'medium',
  ): Promise<string> => {
    const parsed = dataUrl.parse(inputDataUrl)
    const blob = new Blob(
      [Buffer.from(parsed?.data || inputDataUrl, 'base64')],
      {
        type: parsed?.mime || OUTPUT_MIME,
      },
    )

    const resultBlob = await removeBackground(blob, {
      publicPath,
      model,
      output: {
        format: 'image/png',
        quality: 0.8,
      },
    })

    const arrayBuffer = await resultBlob.arrayBuffer()
    return dataUrl.stringify(
      Buffer.from(arrayBuffer).toString('base64'),
      OUTPUT_MIME,
      {
        base64: true,
      },
    )
  },
}

contextBridge.exposeInMainWorld('bgRemover', api)

declare global {
  const bgRemover: typeof api
}
