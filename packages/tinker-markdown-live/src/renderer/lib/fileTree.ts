import compact from 'licia/compact'
import each from 'licia/each'
import type { MarkdownFolderFile } from '../../common/types'
import { joinNativePath } from '../../common/path'

type FolderNode = {
  type: 'folder'
  name: string
  path: string
  relativePath: string
  children: TreeNode[]
}

type FileNode = {
  type: 'file'
  file: MarkdownFolderFile
  name: string
  relativePath: string
}

export type TreeNode = FolderNode | FileNode

function nodeNameSort(left: TreeNode, right: TreeNode) {
  return left.name.localeCompare(right.name, undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

function sortTreeNodes(nodes: TreeNode[]) {
  nodes.sort((left, right) => {
    if (left.type !== right.type) return left.type === 'folder' ? -1 : 1
    return nodeNameSort(left, right)
  })

  each(nodes, (node) => {
    if (node.type === 'folder') sortTreeNodes(node.children)
  })
}

export function buildFileTree(
  files: MarkdownFolderFile[],
  rootPath: string | null,
) {
  const rootNodes: TreeNode[] = []
  const folders = new Map<string, FolderNode>()

  const ensureFolder = (
    relativePath: string,
    siblings: TreeNode[],
    folderName: string,
    folderPath: string | null,
  ) => {
    let folder = folders.get(relativePath)

    if (!folder) {
      folder = {
        type: 'folder',
        name: folderName,
        path: folderPath ?? relativePath,
        relativePath,
        children: [],
      }
      folders.set(relativePath, folder)
      siblings.push(folder)
    } else if (!folder.path && folderPath) {
      folder.path = folderPath
    }

    return folder
  }

  files.forEach((file) => {
    const parts = compact(file.relativePath.split(/[\\/]/))
    if (parts.length === 0) return

    let siblings = rootNodes
    let parentPath = ''

    parts.slice(0, -1).forEach((folderName) => {
      const relativePath = parentPath
        ? `${parentPath}/${folderName}`
        : folderName
      const folder = ensureFolder(
        relativePath,
        siblings,
        folderName,
        rootPath ? joinNativePath(rootPath, relativePath) : file.path,
      )

      siblings = folder.children
      parentPath = relativePath
    })

    if (file.kind === 'folder') {
      ensureFolder(
        file.relativePath,
        siblings,
        parts.at(-1) ?? file.name,
        file.path,
      )
      return
    }

    siblings.push({
      type: 'file',
      file,
      name: parts.at(-1) ?? file.name,
      relativePath: file.relativePath,
    })
  })

  sortTreeNodes(rootNodes)
  return rootNodes
}

export function collectFolderPaths(nodes: TreeNode[]) {
  const paths: string[] = []

  const collect = (treeNodes: TreeNode[]) => {
    each(treeNodes, (node) => {
      if (node.type !== 'folder') return
      paths.push(node.relativePath)
      collect(node.children)
    })
  }

  collect(nodes)
  return paths
}
