import { makeAutoObservable } from 'mobx'
import base64 from 'licia/base64'
import type { ModelSize } from '../common/types'
import { bytesToDataUrl, parseImageDataUrl } from '../lib/image'

const DIRECTLY_SUPPORTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

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

  private async toPng(dataUrl: string): Promise<string> {
    const parsed = parseImageDataUrl(dataUrl)

    if (parsed && DIRECTLY_SUPPORTED_TYPES.has(parsed.mime)) return dataUrl

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = dataUrl
    })
  }

  async removeBackground() {
    if (!this.originalImage || this.isProcessing) return

    this.isProcessing = true
    this.resultImage = null

    try {
      const input = await this.toPng(this.originalImage)
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
    const buffer = await tinker.readFile(filePath)
    this.setOriginalImage(
      bytesToDataUrl(
        new Uint8Array(buffer as unknown as ArrayBuffer),
        filePath,
      ),
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
