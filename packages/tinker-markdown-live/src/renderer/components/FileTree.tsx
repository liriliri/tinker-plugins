import trim from 'licia/trim'
import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react'
import type { MarkdownFolderFile } from '../../common/types'
import type { MarkdownOutlineItem } from '../lib/markdownOutline'
import DocumentOutline from './DocumentOutline'
import {
  buildFileTree,
  collectFolderPaths,
  type TreeNode,
} from '../lib/fileTree'
import {
  folderNodeAsFile,
  normalizeCreateParentPath,
  parentPathFromPath,
} from '../lib/treePath'
import { tw } from '../theme'

interface FileTreeProps {
  currentPath: string | null
  files: MarkdownFolderFile[]
  open: boolean
  rootPath: string | null
  width: number
  outlineItems: MarkdownOutlineItem[]
  onCreateFile: (
    fileName: string,
    parentPath?: string | null,
  ) => void | Promise<void>
  onCreateFolder: (
    folderName: string,
    parentPath?: string | null,
  ) => void | Promise<void>
  onDeleteFile: (file: MarkdownFolderFile) => void | Promise<void>
  onOpenFile: (file: MarkdownFolderFile) => void
  onOpenFolder: () => void
  onRenameFile: (
    file: MarkdownFolderFile,
    fileName: string,
  ) => void | Promise<void>
  onSelectOutlineItem: (item: MarkdownOutlineItem, index: number) => void
}

interface FileTreeNodesProps {
  creatingFile: boolean
  creatingFolder: boolean
  creatingParentPath: string | null
  currentPath: string | null
  expandedFolders: Set<string>
  newFileName: string
  newFolderName: string
  nodes: TreeNode[]
  renameFileName: string
  renamingPath: string | null
  onCommitCreateFile: () => void
  onCommitCreateFolder: () => void
  onCommitRenameFile: (file: MarkdownFolderFile) => void
  onOpenContextMenu: (
    event: ReactMouseEvent,
    file?: MarkdownFolderFile,
    targetFolderPath?: string | null,
  ) => void
  onOpenFile: (file: MarkdownFolderFile) => void
  onRenameFileNameChange: (value: string) => void
  onSetNewFileName: (value: string) => void
  onSetNewFolderName: (value: string) => void
  onToggleFolder: (relativePath: string) => void
  parentPath?: string | null
  depth?: number
}

function creatingAtParentPath(
  parentPath: string | null | undefined,
  creatingParentPath: string | null,
  depth = 0,
) {
  const normalizedParentPath = normalizeCreateParentPath(parentPath)
  if (!normalizedParentPath && depth > 0) return false
  return normalizedParentPath === creatingParentPath
}

function FileTreeNodes({
  creatingFile,
  creatingFolder,
  creatingParentPath,
  currentPath,
  expandedFolders,
  newFileName,
  newFolderName,
  nodes,
  renameFileName,
  renamingPath,
  onCommitCreateFile,
  onCommitCreateFolder,
  onCommitRenameFile,
  onOpenContextMenu,
  onOpenFile,
  onRenameFileNameChange,
  onSetNewFileName,
  onSetNewFolderName,
  onToggleFolder,
  parentPath = null,
  depth = 0,
}: FileTreeNodesProps) {
  const { t } = useTranslation()
  const showCreateRows =
    (creatingFile || creatingFolder) &&
    creatingAtParentPath(parentPath, creatingParentPath, depth)

  return (
    <ol className="m-0 list-none p-0" role={depth === 0 ? 'tree' : 'group'}>
      {showCreateRows ? (
        <>
          {creatingFile ? (
            <li key="__creating-file">
              <div className="grid h-8 grid-cols-[15px_minmax(0,1fr)] items-center gap-1.5 py-0 pr-2 pl-4">
                <FileText aria-hidden="true" className="shrink-0" size={15} />
                <input
                  aria-label={t('newMarkdownFileName')}
                  autoFocus
                  className={tw.sidebar.input}
                  placeholder={`${t('untitled')}.md`}
                  type="text"
                  value={newFileName}
                  onChange={(event) => onSetNewFileName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onCommitCreateFile()
                    }
                  }}
                />
              </div>
            </li>
          ) : null}
          {creatingFolder ? (
            <li key="__creating-folder">
              <div className="grid h-8 grid-cols-[15px_minmax(0,1fr)] items-center gap-1.5 py-0 pr-2 pl-4">
                <Folder aria-hidden="true" className="shrink-0" size={15} />
                <input
                  aria-label={t('newMarkdownFolderName')}
                  autoFocus
                  className={tw.sidebar.input}
                  placeholder={t('newMarkdownFolder')}
                  type="text"
                  value={newFolderName}
                  onChange={(event) => onSetNewFolderName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onCommitCreateFolder()
                    }
                  }}
                />
              </div>
            </li>
          ) : null}
        </>
      ) : null}
      {nodes.map((node) => {
        if (node.type === 'folder') {
          const expanded =
            expandedFolders.has(node.relativePath) ||
            ((creatingFile || creatingFolder) &&
              creatingAtParentPath(node.path, creatingParentPath, depth + 1))
          const folderFile = folderNodeAsFile(node)
          const renaming = renamingPath === node.path

          return (
            <li key={node.relativePath}>
              {renaming ? (
                <div className="grid h-8 grid-cols-[15px_minmax(0,1fr)] items-center gap-1.5 py-0 pr-2 pl-4">
                  <Folder aria-hidden="true" className="shrink-0" size={15} />
                  <input
                    aria-label={t('renameMarkdownItem')}
                    autoFocus
                    className={tw.sidebar.input}
                    type="text"
                    value={renameFileName}
                    onChange={(event) =>
                      onRenameFileNameChange(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        onCommitRenameFile(folderFile)
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  className={`flex h-8 w-full items-center gap-1 border-0 py-0 pr-2 pl-4 text-left text-[13px] leading-none focus-visible:outline-none ${tw.sidebar.text} ${tw.sidebar.hover}`}
                  type="button"
                  aria-expanded={expanded}
                  onContextMenu={(event) =>
                    onOpenContextMenu(event, folderFile, node.path)
                  }
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
              )}
              {expanded ? (
                <ol
                  className={`m-0 list-none border-l p-0 pl-3 ${tw.sidebar.folderBorder}`}
                >
                  <FileTreeNodes
                    creatingFile={creatingFile}
                    creatingFolder={creatingFolder}
                    creatingParentPath={creatingParentPath}
                    currentPath={currentPath}
                    depth={depth + 1}
                    expandedFolders={expandedFolders}
                    newFileName={newFileName}
                    newFolderName={newFolderName}
                    nodes={node.children}
                    parentPath={node.path}
                    renameFileName={renameFileName}
                    renamingPath={renamingPath}
                    onCommitCreateFile={onCommitCreateFile}
                    onCommitCreateFolder={onCommitCreateFolder}
                    onCommitRenameFile={onCommitRenameFile}
                    onOpenContextMenu={onOpenContextMenu}
                    onOpenFile={onOpenFile}
                    onRenameFileNameChange={onRenameFileNameChange}
                    onSetNewFileName={onSetNewFileName}
                    onSetNewFolderName={onSetNewFolderName}
                    onToggleFolder={onToggleFolder}
                  />
                </ol>
              ) : null}
            </li>
          )
        }

        const active = node.file.path === currentPath
        const renaming = renamingPath === node.file.path

        return (
          <li key={node.file.path}>
            {renaming ? (
              <div className="grid h-8 grid-cols-[15px_minmax(0,1fr)] items-center gap-1.5 py-0 pr-2 pl-4">
                <FileText aria-hidden="true" className="shrink-0" size={15} />
                <input
                  aria-label={t('renameMarkdownItem')}
                  autoFocus
                  className={tw.sidebar.input}
                  type="text"
                  value={renameFileName}
                  onChange={(event) =>
                    onRenameFileNameChange(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onCommitRenameFile(node.file)
                    }
                  }}
                />
              </div>
            ) : (
              <button
                className={`grid h-8 w-full grid-cols-[15px_minmax(0,1fr)] items-center gap-1.5 border-0 py-0 pr-2 pl-4 text-left text-[13px] leading-none focus-visible:outline-none ${tw.sidebar.text} ${tw.sidebar.hover} ${active ? tw.sidebar.active : ''}`}
                type="button"
                aria-current={active ? 'page' : undefined}
                title={node.file.path}
                onContextMenu={(event) => onOpenContextMenu(event, node.file)}
                onClick={() => onOpenFile(node.file)}
              >
                <FileText
                  aria-hidden="true"
                  className={`shrink-0 ${active ? tw.sidebar.fileIconActive : ''}`}
                  size={15}
                />
                <span className="min-w-0 truncate">{node.name}</span>
              </button>
            )}
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
  rootPath,
  width,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onOpenFile,
  onOpenFolder,
  onRenameFile,
  onSelectOutlineItem,
  outlineItems,
}: FileTreeProps) {
  const { t } = useTranslation()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(),
  )
  const [creatingFile, setCreatingFile] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [creatingParentPath, setCreatingParentPath] = useState<string | null>(
    null,
  )
  const [newFileName, setNewFileName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renameFileName, setRenameFileName] = useState('')

  const tree = useMemo(() => buildFileTree(files, rootPath), [files, rootPath])
  const folderPaths = useMemo(() => collectFolderPaths(tree), [tree])

  useEffect(() => {
    setExpandedFolders(new Set())
  }, [rootPath])

  useEffect(() => {
    if (!rootPath || folderPaths.length === 0) return

    setExpandedFolders((current) => {
      if (current.size > 0) return current
      return new Set(folderPaths.slice(0, 1))
    })
  }, [rootPath, folderPaths])

  const cancelInputs = () => {
    setCreatingFile(false)
    setCreatingFolder(false)
    setCreatingParentPath(null)
    setNewFileName('')
    setNewFolderName('')
    setRenamingPath(null)
    setRenameFileName('')
  }

  const startCreatingFile = (parentPath: string | null = null) => {
    setCreatingFolder(false)
    setNewFolderName('')
    setRenamingPath(null)
    setRenameFileName('')
    setCreatingParentPath(normalizeCreateParentPath(parentPath))
    setCreatingFile(true)
    setNewFileName('')
  }

  const startCreatingFolder = (parentPath: string | null = null) => {
    setCreatingFile(false)
    setNewFileName('')
    setRenamingPath(null)
    setRenameFileName('')
    setCreatingParentPath(normalizeCreateParentPath(parentPath))
    setCreatingFolder(true)
    setNewFolderName('')
  }

  const startRenamingFile = (file: MarkdownFolderFile) => {
    cancelInputs()
    setRenamingPath(file.path)
    setRenameFileName(file.name)
  }

  const commitCreateFile = () => {
    const normalizedName = trim(newFileName)
    if (!normalizedName) {
      cancelInputs()
      return
    }

    void onCreateFile(normalizedName, creatingParentPath)
    cancelInputs()
  }

  const commitCreateFolder = () => {
    const normalizedName = trim(newFolderName)
    if (!normalizedName) {
      cancelInputs()
      return
    }

    void onCreateFolder(normalizedName, creatingParentPath)
    cancelInputs()
  }

  const commitRenameFile = (file: MarkdownFolderFile) => {
    const normalizedName = trim(renameFileName)
    if (!normalizedName || normalizedName === file.name) {
      cancelInputs()
      return
    }

    void onRenameFile(file, normalizedName)
    cancelInputs()
  }

  const openContextMenu = (
    event: ReactMouseEvent,
    file?: MarkdownFolderFile,
    targetFolderPath?: string | null,
  ) => {
    if (!rootPath) return

    event.preventDefault()
    event.stopPropagation()

    const createTargetPath = normalizeCreateParentPath(
      targetFolderPath ??
        (file
          ? file.kind === 'folder'
            ? file.path
            : parentPathFromPath(file.path)
          : null),
    )
    const menuItems: Electron.MenuItemConstructorOptions[] = [
      {
        label: t('newMarkdownFile'),
        click: () => startCreatingFile(createTargetPath),
      },
      {
        label: t('newMarkdownFolder'),
        click: () => startCreatingFolder(createTargetPath),
      },
    ]

    if (file) {
      menuItems.push({ type: 'separator' })
      menuItems.push({
        label: t('renameMarkdownFile'),
        click: () => startRenamingFile(file),
      })
      menuItems.push({
        label: t('deleteMarkdownFile'),
        click: () => {
          void onDeleteFile(file)
        },
      })
    }

    tinker.showContextMenu(event.clientX, event.clientY, menuItems)
  }

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

  const handleBlankAreaMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('button, input')) return
    cancelInputs()
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
      {rootPath ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <section
            className="min-h-0 flex-1 overflow-y-auto pb-4"
            onContextMenu={(event) => openContextMenu(event)}
            onMouseDown={handleBlankAreaMouseDown}
          >
            {tree.length > 0 || creatingFile || creatingFolder ? (
              <FileTreeNodes
                creatingFile={creatingFile}
                creatingFolder={creatingFolder}
                creatingParentPath={creatingParentPath}
                currentPath={currentPath}
                expandedFolders={expandedFolders}
                newFileName={newFileName}
                newFolderName={newFolderName}
                nodes={tree}
                renameFileName={renameFileName}
                renamingPath={renamingPath}
                onCommitCreateFile={commitCreateFile}
                onCommitCreateFolder={commitCreateFolder}
                onCommitRenameFile={commitRenameFile}
                onOpenContextMenu={openContextMenu}
                onOpenFile={onOpenFile}
                onRenameFileNameChange={setRenameFileName}
                onSetNewFileName={setNewFileName}
                onSetNewFolderName={setNewFolderName}
                onToggleFolder={toggleFolder}
              />
            ) : (
              <p className={`m-0 px-4 py-3 text-xs ${tw.sidebar.muted}`}>
                {t('noMarkdownFiles')}
              </p>
            )}
          </section>
          <DocumentOutline
            items={outlineItems}
            onSelectItem={onSelectOutlineItem}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <button
            className={`flex cursor-pointer flex-col items-center gap-2 border-0 bg-transparent px-4 text-center text-xs focus-visible:outline-none ${tw.sidebar.emptyAction}`}
            type="button"
            onClick={onOpenFolder}
          >
            <FolderOpen
              aria-hidden="true"
              className={tw.empty.icon}
              size={24}
              strokeWidth={1.5}
            />
            {t('openFolder')}
          </button>
        </div>
      )}
    </aside>
  )
}
