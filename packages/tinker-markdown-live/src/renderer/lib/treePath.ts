import type { MarkdownFolderFile } from '../../common/types'
import { normalizeTrimmedPath, parentPathFromPath } from '../../common/path'
import type { TreeNode } from './fileTree'

export const normalizeCreateParentPath = normalizeTrimmedPath

export { parentPathFromPath }

export function folderNodeAsFile(node: Extract<TreeNode, { type: 'folder' }>) {
  return {
    path: node.path,
    name: node.name,
    relativePath: node.relativePath,
    kind: 'folder' as const,
  } satisfies MarkdownFolderFile
}
