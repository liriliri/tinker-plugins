export type MarkdownFolderFile = {
  path: string
  name: string
  relativePath: string
  kind?: 'folder'
  modifiedAt?: number
  createdAt?: number
}
