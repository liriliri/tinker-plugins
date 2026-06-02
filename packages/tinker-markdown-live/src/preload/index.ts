import { contextBridge } from 'electron'
import { listMarkdownFilesForPath, watchMarkdownTree } from './markdownFiles'
import {
  createMarkdownTreeFile,
  createMarkdownTreeFolder,
  deleteMarkdownTreeFile,
  renameMarkdownTreeFile,
} from './markdownTreeOps'

const markdownLiveObj = {
  listMarkdownFilesForPath,
  watchMarkdownTree,
  createMarkdownTreeFile,
  createMarkdownTreeFolder,
  renameMarkdownTreeFile,
  deleteMarkdownTreeFile,
}

contextBridge.exposeInMainWorld('markdownLive', markdownLiveObj)

declare global {
  const markdownLive: typeof markdownLiveObj
}
