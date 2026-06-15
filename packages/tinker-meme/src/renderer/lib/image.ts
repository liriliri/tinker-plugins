function getExtFromUrl(url: string): string {
  const match = url.match(/\.(jpe?g|png|gif|webp)($|[?#])/i)
  if (!match) return 'gif'

  const ext = match[1].toLowerCase()
  return ext === 'jpeg' ? 'jpg' : ext
}

export async function saveImage(url: string): Promise<void> {
  const ext = getExtFromUrl(url)
  const result = await tinker.showSaveDialog({
    defaultPath: `meme.${ext}`,
    filters: [{ name: 'Image', extensions: ['jpg', 'png', 'gif', 'webp'] }],
  })

  if (result.canceled || !result.filePath) return

  await meme.saveImage(url, result.filePath)
}
