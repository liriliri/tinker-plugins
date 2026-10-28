import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useState } from 'react'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import className from 'licia/className'
import contain from 'licia/contain'
import filter from 'licia/filter'
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatSize } from '../../common/format'
import { getExtension, getFileAccentVar } from '../../common/fileType'
import {
  buildFileTree,
  collectFolderPaths,
  getParentPaths,
  type FileTreeNode,
} from '../../common/fileTree'
import store from '../store'
import { tw } from '../theme'
import UnpackedBadge from './UnpackedBadge'

interface TreeNodeProps {
  node: FileTreeNode
  depth: number
  expanded: Set<string>
  selectedPath: string | null
  isModified: (path: string) => boolean
  onToggle: (path: string) => void
  onSelect: (path: string) => void
  onCreateFile: (parentPath: string) => void
  onCreateDirectory: (parentPath: string) => void
  onExtract: (node: FileTreeNode) => void
  onDelete: (node: FileTreeNode) => void
}

function TreeNode({
  node,
  depth,
  expanded,
  selectedPath,
  isModified,
  onToggle,
  onSelect,
  onCreateFile,
  onCreateDirectory,
  onExtract,
  onDelete,
}: TreeNodeProps) {
  const { t } = useTranslation()
  const isDirectory = node.type === 'directory'
  const isExpanded = isDirectory && expanded.has(node.path)
  const isSelected = !isDirectory && node.path === selectedPath
  const isFileModified = !isDirectory && isModified(node.path)
  const ext = getExtension(node.path)
  const accentVar = getFileAccentVar(ext)

  const handleClick = () => {
    if (isDirectory) {
      onToggle(node.path)
      return
    }
    onSelect(node.path)
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const items = isDirectory
      ? [
          { label: t('newFile'), click: () => onCreateFile(node.path) },
          { label: t('newFolder'), click: () => onCreateDirectory(node.path) },
          { label: t('extract'), click: () => onExtract(node) },
          { label: t('delete'), click: () => onDelete(node) },
        ]
      : [
          { label: t('extract'), click: () => onExtract(node) },
          { label: t('delete'), click: () => onDelete(node) },
        ]

    tinker.showContextMenu(event.clientX, event.clientY, items)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={className(
          'group w-full flex items-center gap-1 py-[3px] pr-1.5 text-left',
          'transition-colors duration-100',
          tw.focusRingSm,
          isSelected ? tw.treeSelected : className(tw.text.muted, tw.treeHover),
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-2.5 h-2.5 shrink-0 opacity-50" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5 shrink-0 opacity-50" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3 h-3 shrink-0 opacity-55" />
            ) : (
              <Folder className="w-3 h-3 shrink-0 opacity-55" />
            )}
            <span className={className('truncate text-[11px]', tw.mono)}>
              {node.name}
            </span>
          </>
        ) : (
          <>
            <span className="w-2.5 shrink-0" />
            <span
              className="w-1 h-1 rounded-full shrink-0"
              style={{ backgroundColor: `var(${accentVar})` }}
            />
            <span
              className={className(
                'min-w-0 flex-1 truncate text-[11px]',
                tw.mono,
                isSelected ? tw.text.primary : tw.text.muted,
                isFileModified && tw.text.modified,
              )}
            >
              {node.name}
            </span>
            {node.unpacked && <UnpackedBadge />}
            {isFileModified && (
              <span
                className={className(
                  'w-1 h-1 rounded-full shrink-0',
                  tw.modifiedDot,
                )}
                aria-label="modified"
              />
            )}
            {node.size != null && (
              <span
                className={className(
                  'text-[9px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                  tw.text.faint,
                )}
              >
                {formatSize(node.size)}
              </span>
            )}
          </>
        )}
      </button>

      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedPath={selectedPath}
              isModified={isModified}
              onToggle={onToggle}
              onSelect={onSelect}
              onCreateFile={onCreateFile}
              onCreateDirectory={onCreateDirectory}
              onExtract={onExtract}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const FileList = observer(() => {
  const { t } = useTranslation()
  const {
    selectedPath,
    files,
    asarPath,
    virtualDirectories,
    lastCreatedPath,
    modifiedPaths,
  } = store
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const tree = useMemo(
    () => buildFileTree(files, virtualDirectories),
    [files, virtualDirectories],
  )

  useEffect(() => {
    if (!asarPath) {
      setExpanded(new Set())
      return
    }

    const folderPaths = collectFolderPaths(tree)
    setExpanded(new Set(filter(folderPaths, (path) => !contain(path, '/'))))
  }, [asarPath, tree])

  useEffect(() => {
    const expandPath = lastCreatedPath ?? selectedPath
    if (!expandPath) {
      return
    }

    setExpanded((prev) => {
      const next = new Set(prev)
      for (const path of getParentPaths(expandPath)) {
        next.add(path)
      }
      if (lastCreatedPath) {
        next.add(lastCreatedPath)
      }
      return next
    })

    if (lastCreatedPath) {
      store.clearLastCreatedPath()
    }
  }, [selectedPath, lastCreatedPath])

  const handleToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleDelete = (node: FileTreeNode) => {
    const isDirectory = node.type === 'directory'
    store.requestDelete(
      node.path,
      isDirectory,
      isDirectory ? node.path : node.name,
    )
  }

  const handleExtract = (node: FileTreeNode) => {
    void store.extractToDialog([node.path])
  }

  const handleRootContextMenu = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button')) {
      return
    }

    event.preventDefault()
    tinker.showContextMenu(event.clientX, event.clientY, [
      { label: t('newFile'), click: () => store.requestCreate('file', null) },
      {
        label: t('newFolder'),
        click: () => store.requestCreate('directory', null),
      },
    ])
  }

  return (
    <ScrollArea.Root className="flex-1 min-h-0">
      <ScrollArea.Viewport
        className="h-full w-full"
        onContextMenu={handleRootContextMenu}
      >
        <div className="py-1">
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              expanded={expanded}
              selectedPath={selectedPath}
              isModified={(path) => modifiedPaths.has(path)}
              onToggle={handleToggle}
              onSelect={(path) => store.selectFile(path)}
              onCreateFile={(parentPath) =>
                store.requestCreate('file', parentPath)
              }
              onCreateDirectory={(parentPath) =>
                store.requestCreate('directory', parentPath)
              }
              onExtract={handleExtract}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="flex w-1.5 touch-none select-none p-0.5"
      >
        <ScrollArea.Thumb
          className={className(
            'relative flex-1 rounded-full',
            tw.scrollbar.thumb,
          )}
        />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
})

export default FileList
