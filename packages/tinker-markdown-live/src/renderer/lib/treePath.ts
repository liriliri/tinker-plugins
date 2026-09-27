import type { MarkdownFolderFile } from '../../common/types'
import type { TreeNode } from './fileTree'

export function folderNodeAsFile(node: Extract<TreeNode, { type: 'folder' }>) {
  return {
    path: node.path,
    name: node.name,
    relativePath: node.relativePath,
    kind: 'folder' as const,
  } satisfies MarkdownFolderFile
}
