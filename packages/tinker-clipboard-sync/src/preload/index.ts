import { contextBridge, clipboard } from 'electron'
import fs from 'node:fs'

let timer: ReturnType<typeof setInterval> | null = null
let lastClipboardText = ''
let lastFileMtime = 0

let onChange: ((text: string) => void) | null = null

interface ClipboardSync {
  start(filePath: string, interval?: number): void
  stop(): void
  isRunning(): boolean
  readClipboard(): string
  onClipboardChange(callback: (text: string) => void): void
}

const api: ClipboardSync = {
  start(filePath: string, interval: number = 500) {
    this.stop()
    lastClipboardText = clipboard.readText()
    lastFileMtime = 0

    timer = setInterval(() => {
      const currentText = clipboard.readText()
      if (currentText && currentText !== lastClipboardText) {
        lastClipboardText = currentText
        fs.writeFileSync(
          filePath,
          JSON.stringify({ text: currentText }),
          'utf-8',
        )
        lastFileMtime = fs.statSync(filePath).mtimeMs
        onChange?.(currentText)
      }

      try {
        const stat = fs.statSync(filePath)
        if (stat.mtimeMs !== lastFileMtime) {
          lastFileMtime = stat.mtimeMs
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
          if (content.text && content.text !== lastClipboardText) {
            lastClipboardText = content.text
            clipboard.writeText(content.text)
            onChange?.(content.text)
          }
        }
      } catch {}
    }, interval)
  },
  stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  },
  isRunning() {
    return timer !== null
  },
  readClipboard() {
    return clipboard.readText()
  },
  onClipboardChange(callback: (text: string) => void) {
    onChange = callback
  },
}

contextBridge.exposeInMainWorld('clipboardSync', api)

declare global {
  const clipboardSync: ClipboardSync
}
