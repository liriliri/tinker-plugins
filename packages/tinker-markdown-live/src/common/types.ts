export type MarkdownFolderFile = {
  path: string
  name: string
  relativePath: string
  kind?: 'folder'
  modifiedAt?: number
  createdAt?: number
}

export type FileWatchEventType =
  | 'add'
  | 'addDir'
  | 'change'
  | 'unlink'
  | 'unlinkDir'

export interface IFileWatchEvent {
  type: FileWatchEventType
  path: string
}
