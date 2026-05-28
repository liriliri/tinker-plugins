import { makeAutoObservable } from 'mobx'
import base64 from 'licia/base64'
import type { ModelSize } from '../common/types'
import { bytesToDataUrl, parseImageDataUrl, toPng } from './image'

class Store {
  originalImage: string | null = null
  resultImage: string | null = null
  isProcessing = false
  model: ModelSize = 'medium'
  originalName = ''

  constructor() {
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
  }

  async removeBackground() {
    if (!this.originalImage || this.isProcessing) return

    this.isProcessing = true
    this.resultImage = null

    try {
      const input = await toPng(this.originalImage)
      const result = await bgRemover.removeBackground(input, this.model)
      this.resultImage = result
    } catch (err) {
      console.error('Background removal failed:', err)
    } finally {
      this.isProcessing = false
    }
  }

  async openFile() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] },
      ],
    })

    if (result.canceled || !result.filePaths.length) return

    const filePath = result.filePaths[0]
    const fileName = filePath.split(/[/\\]/).pop() || ''
    const buffer = (await tinker.readFile(filePath)) as ArrayBuffer
    this.setOriginalImage(
      bytesToDataUrl(new Uint8Array(buffer), filePath),
      fileName,
    )
  }

  async saveResult() {
    if (!this.resultImage) return

    const defaultName = this.originalName
      ? this.originalName.replace(/\.[^.]+$/, '') + '.png'
      : undefined

    const result = await tinker.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    })

    if (result.canceled || !result.filePath) return

    const parsed = parseImageDataUrl(this.resultImage)

    if (!parsed || !parsed.base64) return

    const buffer = new Uint8Array(base64.decode(parsed.data))
    await tinker.writeFile(result.filePath, buffer)
  }

  async handleDrop(file: File) {
    const arrayBuffer = await file.arrayBuffer()
    this.setOriginalImage(
      bytesToDataUrl(new Uint8Array(arrayBuffer), file.name),
      file.name,
    )
  }
}

const store = new Store()

export default store
