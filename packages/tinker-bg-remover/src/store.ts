import { makeAutoObservable, runInAction } from 'mobx'
import base64 from 'licia/base64'
import dataUrl from 'licia/dataUrl'
import splitPath from 'licia/splitPath'
import BaseStore from 'tinker-share/store/Base'
import { errorMessage, isOnline } from 'tinker-share/lib/util'
import type { BgRemoverProgress, ModelSize } from './types'
import { bytesToDataUrl, blobToDataUrl, toBlob, toPng } from './lib/image'
import { removeBackground } from './lib/removeBackground'
import { pickImageFileWeb, saveBlobWeb } from './lib/util'

class Store extends BaseStore {
  originalImage: string | null = null
  resultImage: string | null = null
  isProcessing = false
  model: ModelSize = 'medium'
  originalName = ''
  progress: BgRemoverProgress | null = null

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get canRemove() {
    return !!this.originalImage && !this.isProcessing && !this.resultImage
  }

  get displayImage() {
    return this.resultImage || this.originalImage
  }

  setOriginalImage(dataUrl: string, name = '') {
    this.originalImage = dataUrl
    this.resultImage = null
    this.originalName = name
  }

  setModel(model: ModelSize) {
    this.model = model
    this.resultImage = null
  }

  reset() {
    this.originalImage = null
    this.resultImage = null
    this.isProcessing = false
    this.progress = null
  }

  async removeBackground() {
    if (!this.originalImage || this.isProcessing) return

    this.isProcessing = true
    this.resultImage = null
    this.progress = null

    try {
      const input = await toBlob(await toPng(this.originalImage))
      const result = await removeBackground(input, this.model, (progress) => {
        runInAction(() => {
          this.progress = progress
        })
      })
      this.resultImage = await blobToDataUrl(result)
    } catch (err) {
      console.error('Background removal failed:', errorMessage(err))
    } finally {
      this.isProcessing = false
      this.progress = null
    }
  }

  async openFile() {
    if (isOnline()) {
      const file = await pickImageFileWeb()
      if (!file) return
      await this.loadImageFile(file)
      return
    }

    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] },
      ],
    })

    if (result.canceled || !result.filePaths.length) return

    const filePath = result.filePaths[0]
    const fileName = splitPath(filePath).name
    const buffer = (await tinker.readFile(filePath)) as unknown as ArrayBuffer
    this.setOriginalImage(
      bytesToDataUrl(new Uint8Array(buffer), filePath),
      fileName,
    )
  }

  async saveResult() {
    if (!this.resultImage) return

    const parsed = dataUrl.parse(this.resultImage)

    if (!parsed || !parsed.base64) return

    const buffer = new Uint8Array(base64.decode(parsed.data))
    const { name, ext } = splitPath(this.originalName)
    const fileName = `${name.slice(0, name.length - ext.length)}.png`

    if (isOnline()) {
      await saveBlobWeb(new Blob([buffer], { type: 'image/png' }), fileName)
      return
    }

    const result = await tinker.showSaveDialog({
      defaultPath: fileName,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    })

    if (result.canceled || !result.filePath) return

    await tinker.writeFile(result.filePath, buffer)
  }

  async handleDrop(file: File) {
    await this.loadImageFile(file)
  }

  private async loadImageFile(file: File) {
    const arrayBuffer = await file.arrayBuffer()
    this.setOriginalImage(
      bytesToDataUrl(new Uint8Array(arrayBuffer), file.name),
      file.name,
    )
  }
}

const store = new Store()

export default store
