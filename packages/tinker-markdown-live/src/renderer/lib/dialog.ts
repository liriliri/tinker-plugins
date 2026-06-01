const markdownFileFilter = {
  name: 'Markdown',
  extensions: ['md', 'markdown'],
} as const

export async function pickFolderPath() {
  const result = await tinker.showOpenDialog({
    properties: ['openDirectory'],
  })
  if (result.canceled || !result.filePaths.length) return null
  return result.filePaths[0]
}

export async function pickMarkdownSavePath() {
  const result = await tinker.showSaveDialog({
    filters: [markdownFileFilter],
  })
  if (result.canceled || !result.filePath) return null
  return result.filePath
}
