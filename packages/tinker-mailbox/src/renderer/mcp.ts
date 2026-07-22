import find from 'licia/find'
import isStrBlank from 'licia/isStrBlank'
import map from 'licia/map'
import trim from 'licia/trim'
import waitUntil from 'licia/waitUntil'
import type { Account, FolderInfo, MessageHeader } from '../common/types'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    const store = getStore()
    switch (name) {
      case 'list_accounts':
        return listAccounts(store)
      case 'select_account':
        return selectAccount(store, args as { account: string })
      case 'list_folders':
        return listFolders(store)
      case 'list_messages':
        return listMessages(store, args as { folder: string })
      case 'read_message':
        return readMessage(store, args as { uid: number; folder?: string })
      case 'refresh_messages':
        return refreshMessages(store)
      case 'send_mail':
        return sendMail(
          store,
          args as { to: string; subject?: string; text: string; cc?: string },
        )
      default:
        throw new Error(`Unknown tool "${name}"`)
    }
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

function accountSummary(account: Account) {
  return {
    id: account.id,
    name: account.name,
    emailAddress: account.emailAddress,
  }
}

function messageSummary(msg: MessageHeader) {
  return {
    uid: msg.uid,
    subject: msg.subject,
    from: msg.from,
    to: msg.to,
    date: msg.date,
    unseen: msg.unseen,
    snippet: msg.snippet,
  }
}

function listAccounts(store: Store) {
  return {
    accounts: map(store.accounts, accountSummary),
    activeAccountId: store.account?.id ?? null,
  }
}

async function selectAccount(store: Store, args: { account: string }) {
  const key = trim(args.account)
  const account =
    find(store.accounts, (a) => a.id === key) ||
    find(
      store.accounts,
      (a) => a.emailAddress.toLowerCase() === key.toLowerCase(),
    )
  if (!account) {
    throw new Error(`Account not found: ${args.account}`)
  }
  clearToast(store)
  await store.selectAccount(account)
  await waitUntil(() => !store.connecting && !store.loadingFolders, 0, 50)
  assertNoToastError(store)
  return {
    account: accountSummary(account),
    folders: map(store.folders, folderSummary),
    currentFolder: store.currentFolder,
  }
}

async function listFolders(store: Store) {
  requireAccount(store)
  clearToast(store)
  await store.refreshFolders()
  await waitUntil(() => !store.loadingFolders, 0, 50)
  assertNoToastError(store)
  return {
    account: store.account ? accountSummary(store.account) : null,
    folders: map(store.folders, folderSummary),
    currentFolder: store.currentFolder,
  }
}

async function listMessages(store: Store, args: { folder: string }) {
  requireAccount(store)
  const path = resolveFolder(store.folders, args.folder)
  const ok = await store.selectFolder(path)
  if (!ok) {
    throw new Error(store.toastMsg || `Failed to open folder: ${args.folder}`)
  }
  return {
    folder: path,
    messages: map(store.messages, messageSummary),
  }
}

async function readMessage(
  store: Store,
  args: { uid: number; folder?: string },
) {
  requireAccount(store)
  if (args.folder) {
    const path = resolveFolder(store.folders, args.folder)
    const ok = await store.selectFolder(path)
    if (!ok) {
      throw new Error(store.toastMsg || `Failed to open folder: ${args.folder}`)
    }
  }
  if (!store.currentFolder) {
    throw new Error('No folder selected')
  }
  await store.selectMessage(args.uid)
  await waitUntil(() => !store.loadingMessage, 0, 50)
  if (!store.message || store.message.uid !== args.uid) {
    throw new Error(store.toastMsg || `Failed to read message uid ${args.uid}`)
  }
  const msg = store.message
  return {
    folder: store.currentFolder,
    uid: msg.uid,
    subject: msg.subject,
    from: msg.from,
    to: msg.to,
    cc: msg.cc,
    date: msg.date,
    size: msg.size,
    text: msg.text,
    html: msg.html,
  }
}

async function refreshMessages(store: Store) {
  requireAccount(store)
  if (!store.currentFolder) {
    throw new Error('No folder selected')
  }
  clearToast(store)
  await store.refreshMessages()
  await waitUntil(() => !store.loadingMessages, 0, 50)
  assertNoToastError(store)
  return {
    folder: store.currentFolder,
    messages: map(store.messages, messageSummary),
  }
}

async function sendMail(
  store: Store,
  args: { to: string; subject?: string; text: string; cc?: string },
) {
  requireAccount(store)
  const to = trim(args.to)
  if (isStrBlank(to)) {
    throw new Error('Recipient (to) is required')
  }
  const ok = await store.send({
    to,
    cc: args.cc ? trim(args.cc) || undefined : undefined,
    subject: args.subject ? trim(args.subject) : '',
    text: args.text,
  })
  if (!ok) {
    throw new Error(store.toastMsg || 'Failed to send mail')
  }
  return {
    sent: true,
    to,
    subject: args.subject ? trim(args.subject) : '',
  }
}

function folderSummary(folder: FolderInfo) {
  return {
    path: folder.path,
    name: folder.name,
    role: folder.role,
  }
}

function resolveFolder(folders: FolderInfo[], folder: string) {
  const key = trim(folder)
  const byPath = find(folders, (f) => f.path === key)
  if (byPath) return byPath.path
  const byRole = find(folders, (f) => f.role === key)
  if (byRole) return byRole.path
  const lower = key.toLowerCase()
  const byName = find(folders, (f) => f.name.toLowerCase() === lower)
  if (byName) return byName.path
  throw new Error(`Folder not found: ${folder}`)
}

function requireAccount(store: Store) {
  if (!store.account) {
    throw new Error('No active account. Add or select an account first.')
  }
}

function clearToast(store: Store) {
  store.toastOpen = false
  store.toastMsg = ''
  store.toastKind = 'success'
}

function assertNoToastError(store: Store) {
  if (store.toastKind === 'error' && store.toastMsg) {
    throw new Error(store.toastMsg)
  }
}
