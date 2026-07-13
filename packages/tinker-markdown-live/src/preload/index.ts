import { contextBridge } from 'electron'
import { listMarkdownFilesForPath, watchPaths } from './markdownFiles'
import {
  createMarkdownTreeFile,
  createMarkdownTreeFolder,
  deleteMarkdownTreeFile,
  renameMarkdownTreeFile,
} from './markdownTreeOps'

const api = {
  listMarkdownFilesForPath,
  watchPaths,
  createMarkdownTreeFile,
  createMarkdownTreeFolder,
  renameMarkdownTreeFile,
  deleteMarkdownTreeFile,
}

contextBridge.exposeInMainWorld('markdownLive', api)

declare global {
  const markdownLive: typeof api
}
