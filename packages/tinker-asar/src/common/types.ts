export interface AsarFileInfo {
  path: string
  size: number
  unpacked?: boolean
}

export interface FilePreviewResult {
  success: boolean
  error?: string
  type?: 'text' | 'unsupported'
  content?: string
  size?: number
}

export interface OpenAsarResult {
  success: boolean
  path?: string
  files?: AsarFileInfo[]
  emptyDirectories?: string[]
  error?: string
}

export interface UpdateFileResult {
  success: boolean
  error?: string
  size?: number
}

export interface DeleteEntryResult {
  success: boolean
  error?: string
  deleted?: string[]
}

export interface SaveAsarResult {
  success: boolean
  error?: string
}

export interface ExtractFilesResult {
  success: boolean
  error?: string
  extracted?: string[]
}

export interface CreateFileResult {
  success: boolean
  error?: string
  path?: string
  size?: number
}

export interface PendingDelete {
  path: string
  name: string
  isDirectory: boolean
}

export interface PendingCreate {
  type: 'file' | 'directory'
  parentPath: string | null
}
