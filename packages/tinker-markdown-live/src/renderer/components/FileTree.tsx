import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react'
import type { MarkdownFolderFile } from '../../common/types'
import {
  buildFileTree,
  collectFolderPaths,
  type TreeNode,
} from '../lib/fileTree'
import { tw } from '../theme'

interface FileTreeProps {
  currentPath: string | null
  files: MarkdownFolderFile[]
  open: boolean
  rootName: string
  rootPath: string | null
  width: number
  onOpenFile: (file: MarkdownFolderFile) => void
  onOpenFolder: () => void
}

interface FileTreeNodesProps {
  currentPath: string | null
  nodes: TreeNode[]
  expandedFolders: Set<string>
  onOpenFile: (file: MarkdownFolderFile) => void
  onToggleFolder: (relativePath: string) => void
}

function FileTreeNodes({
  currentPath,
  nodes,
  expandedFolders,
  onOpenFile,
  onToggleFolder,
}: FileTreeNodesProps) {
  return (
    <ol className="m-0 list-none p-0" role="tree">
      {nodes.map((node) => {
        if (node.type === 'folder') {
          const expanded = expandedFolders.has(node.relativePath)

          return (
            <li key={node.relativePath}>
              <button
                className={`flex h-8 w-full items-center gap-1 border-0 py-0 pr-2 pl-4 text-left text-[13px] leading-none focus-visible:outline-none ${tw.sidebar.text} ${tw.sidebar.hover}`}
                type="button"
                aria-expanded={expanded}
                onClick={() => onToggleFolder(node.relativePath)}
              >
                {expanded ? (
                  <ChevronDown
                    aria-hidden="true"
                    className="shrink-0"
                    size={13}
                  />
                ) : (
                  <ChevronRight
                    aria-hidden="true"
                    className="shrink-0"
                    size={13}
                  />
                )}
                <Folder aria-hidden="true" className="shrink-0" size={15} />
                <span className="min-w-0 truncate">{node.name}</span>
              </button>
              {expanded ? (
                <ol
                  className={`m-0 list-none border-l p-0 pl-3 ${tw.sidebar.folderBorder}`}
                  role="group"
                >
                  <FileTreeNodes
                    currentPath={currentPath}
                    expandedFolders={expandedFolders}
                    nodes={node.children}
                    onOpenFile={onOpenFile}
                    onToggleFolder={onToggleFolder}
                  />
                </ol>
              ) : null}
            </li>
          )
        }

        const active = node.file.path === currentPath

        return (
          <li key={node.file.path}>
            <button
              className={`grid h-8 w-full grid-cols-[15px_minmax(0,1fr)] items-center gap-1.5 border-0 py-0 pr-2 pl-4 text-left text-[13px] leading-none focus-visible:outline-none ${tw.sidebar.text} ${tw.sidebar.hover} ${active ? tw.sidebar.active : ''}`}
              type="button"
              aria-current={active ? 'page' : undefined}
              title={node.file.path}
              onClick={() => onOpenFile(node.file)}
            >
              <FileText aria-hidden="true" className="shrink-0" size={15} />
              <span className="min-w-0 truncate">{node.name}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export default function FileTree({
  currentPath,
  files,
  open,
  rootName,
  rootPath,
  width,
  onOpenFile,
  onOpenFolder,
}: FileTreeProps) {
  const { t } = useTranslation()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(),
  )

  const tree = useMemo(() => buildFileTree(files, rootPath), [files, rootPath])
  const folderPaths = useMemo(() => collectFolderPaths(tree), [tree])
  const visibleExpandedFolders = useMemo(
    () =>
      expandedFolders.size > 0
        ? expandedFolders
        : new Set(folderPaths.slice(0, 1)),
    [expandedFolders, folderPaths],
  )

  const toggleFolder = (relativePath: string) => {
    setExpandedFolders((current) => {
      const next = new Set(current)
      if (next.has(relativePath)) {
        next.delete(relativePath)
      } else {
        next.add(relativePath)
      }
      return next
    })
  }

  if (!open) {
    return null
  }

  return (
    <aside
      className={`flex h-full min-h-0 shrink-0 flex-col border-r ${tw.sidebar.border} ${tw.sidebar.bg}`}
      style={{ width, minWidth: width, maxWidth: width }}
      aria-label={t('fileTree')}
    >
      <div
        className={`flex h-9 shrink-0 items-center gap-1 border-b px-4 text-[13px] ${tw.sidebar.border} ${tw.sidebar.text}`}
      >
        <Folder aria-hidden="true" size={15} />
        <button
          className={`min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left ${tw.sidebar.text} ${tw.sidebar.hover}`}
          type="button"
          title={rootPath ?? undefined}
          onClick={onOpenFolder}
        >
          {rootName || t('openFolder')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4 pt-2">
        {tree.length > 0 ? (
          <FileTreeNodes
            currentPath={currentPath}
            expandedFolders={visibleExpandedFolders}
            nodes={tree}
            onOpenFile={onOpenFile}
            onToggleFolder={toggleFolder}
          />
        ) : rootPath ? (
          <p className={`m-0 px-4 py-3 text-xs ${tw.sidebar.muted}`}>
            {t('noMarkdownFiles')}
          </p>
        ) : (
          <p className={`m-0 px-4 py-3 text-xs ${tw.sidebar.muted}`}>
            {t('openFolder')}
          </p>
        )}
      </div>
    </aside>
  )
}
