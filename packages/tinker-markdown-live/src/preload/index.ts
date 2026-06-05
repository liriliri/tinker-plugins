import { contextBridge } from 'electron'
import { listMarkdownFilesForPath, watchPaths } from './markdownFiles'
import {
  createMarkdownTreeFile,
  createMarkdownTreeFolder,
  deleteMarkdownTreeFile,
  renameMarkdownTreeFile,
} from './markdownTreeOps'

const markdownLiveObj = {
  listMarkdownFilesForPath,
  watchPaths,
  createMarkdownTreeFile,
  createMarkdownTreeFolder,
  renameMarkdownTreeFile,
  deleteMarkdownTreeFile,
}

contextBridge.exposeInMainWorld('markdownLive', markdownLiveObj)

declare global {
  const markdownLive: typeof markdownLiveObj
}
