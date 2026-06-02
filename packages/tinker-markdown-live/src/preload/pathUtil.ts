import path from 'node:path'

export function toRelativePath(root: string, target: string) {
  return path.relative(root, target).split(path.sep).join('/')
}
