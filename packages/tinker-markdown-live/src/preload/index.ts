import { contextBridge } from 'electron'
import { listMarkdownFilesForPath, watchMarkdownTree } from './markdownFiles'

const markdownObj = {
  readFile: (path: string) => tinker.readFile(path, 'utf8'),
  writeFile: (path: string, content: string) => tinker.writeFile(path, content),
  listMarkdownFilesForPath,
  watchMarkdownTree,
}

contextBridge.exposeInMainWorld('markdown', markdownObj)

declare global {
  const markdown: typeof markdownObj
}
