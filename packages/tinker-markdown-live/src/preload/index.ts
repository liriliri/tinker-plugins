import { contextBridge } from 'electron'

const markdownObj = {
  readFile: (path: string) => tinker.readFile(path, 'utf8'),
  writeFile: (path: string, content: string) => tinker.writeFile(path, content),
  showOpenDialog: () =>
    tinker.showOpenDialog({
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    }),
  showSaveDialog: () =>
    tinker.showSaveDialog({
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    }),
}

contextBridge.exposeInMainWorld('markdown', markdownObj)

declare global {
  const markdown: typeof markdownObj
}
