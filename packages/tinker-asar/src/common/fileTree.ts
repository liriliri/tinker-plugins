import each from 'licia/each'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import type { AsarFileInfo } from './types'

export interface FileTreeNode {
  name: string
  path: string
  type: 'directory' | 'file'
  size?: number
  unpacked?: boolean
  children?: FileTreeNode[]
}

function ensureDirectory(root: FileTreeNode[], dirPath: string) {
  if (isEmpty(dirPath)) {
    return
  }

  const parts = dirPath.split('/')
  let current = root

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const fullPath = parts.slice(0, i + 1).join('/')
    let node = find(current, (item) => item.name === part)

    if (!node) {
      node = {
        name: part,
        path: fullPath,
        type: 'directory',
        children: [],
      }
      current.push(node)
    } else if (node.type === 'file') {
      node.type = 'directory'
      node.size = undefined
      node.children = node.children ?? []
    }

    if (!node.children) {
      node.children = []
    }
    current = node.children
  }
}

export function buildFileTree(
  files: AsarFileInfo[],
  virtualDirectories: string[] = [],
): FileTreeNode[] {
  const root: FileTreeNode[] = []

  each(virtualDirectories, (dirPath) => {
    ensureDirectory(root, dirPath)
  })

  each(files, (file) => {
    const parts = file.path.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const fullPath = parts.slice(0, i + 1).join('/')

      let node = find(current, (item) => item.name === part)

      if (!node) {
        node = {
          name: part,
          path: fullPath,
          type: isFile ? 'file' : 'directory',
          size: isFile ? file.size : undefined,
          unpacked: isFile ? Boolean(file.unpacked) : undefined,
          children: isFile ? undefined : [],
        }
        current.push(node)
      } else if (isFile) {
        node.type = 'file'
        node.size = file.size
        node.unpacked = Boolean(file.unpacked)
        node.children = undefined
      }

      if (!isFile) {
        if (!node.children) {
          node.children = []
        }
        current = node.children
      }
    }
  })

  return sortTree(root)
}

function sortTree(nodes: FileTreeNode[]): FileTreeNode[] {
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  each(nodes, (node) => {
    if (node.children) {
      sortTree(node.children)
    }
  })

  return nodes
}

export function collectFolderPaths(nodes: FileTreeNode[]): string[] {
  const paths: string[] = []

  each(nodes, (node) => {
    if (node.type === 'directory' && node.children) {
      paths.push(node.path)
      paths.push(...collectFolderPaths(node.children))
    }
  })

  return paths
}

export function getParentPaths(path: string): string[] {
  const parts = path.split('/')
  const parents: string[] = []

  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join('/'))
  }

  return parents
}
