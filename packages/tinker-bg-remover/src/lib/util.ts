interface WritableFileStream {
  write(data: Blob): Promise<void>
  close(): Promise<void>
}

interface SaveFileHandle {
  createWritable(): Promise<WritableFileStream>
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: { description: string; accept: Record<string, string[]> }[]
}

declare global {
  interface Window {
    showSaveFilePicker?: (
      options?: SaveFilePickerOptions,
    ) => Promise<SaveFileHandle>
  }
}

/** Browser file picker — the web counterpart of `tinker.showOpenDialog`. */
export function pickImageFileWeb(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}

/** Browser download — the web counterpart of `tinker.showSaveDialog`. */
export async function saveBlobWeb(blob: Blob, filename: string): Promise<void> {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          { description: 'PNG Image', accept: { 'image/png': ['.png'] } },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err) {
      // 用户取消 → 不做处理;其它失败(如缺少用户手势)→ 回落到直接下载
      if ((err as Error).name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
