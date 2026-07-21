import { contextBridge, shell } from 'electron'
import { loadAccounts, saveAccounts } from './accountStore'
import {
  connect,
  deleteMessage,
  disconnect,
  fetchOlderMessages,
  filterExistingUids,
  getMessage,
  listFolders,
  moveMessage,
  onMailboxChange,
  sendMail,
  syncFolder,
  testAccount,
  watchFolder,
} from './mail'
import type {
  Account,
  ComposePayload,
  FolderInfo,
  FolderSyncCursor,
  FolderSyncResult,
  MailboxIdleChange,
  MessageDetail,
  OlderMessagesResult,
} from '../common/types'

/** Reject with a string — Error is not reliably cloneable across contextBridge. */
function exposeAsync<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    try {
      return await fn(...args)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return Promise.reject(message)
    }
  }
}

const api = {
  loadAccounts: exposeAsync((): Promise<Account[]> => loadAccounts()),
  saveAccounts: exposeAsync((accounts: Account[]): Promise<void> =>
    saveAccounts(accounts),
  ),
  testAccount: exposeAsync((account: Account): Promise<void> =>
    testAccount(account),
  ),
  connect: exposeAsync((account: Account): Promise<void> => connect(account)),
  disconnect: exposeAsync((): Promise<void> => disconnect()),
  listFolders: exposeAsync((): Promise<FolderInfo[]> => listFolders()),
  watchFolder: exposeAsync((folderPath: string): Promise<void> =>
    watchFolder(folderPath),
  ),
  onMailboxChange: (
    listener: (change: MailboxIdleChange) => void,
  ): (() => void) => onMailboxChange(listener),
  syncFolder: exposeAsync(
    (
      folderPath: string,
      cursor: FolderSyncCursor | null,
      opts?: { limit?: number; force?: boolean },
    ): Promise<FolderSyncResult> => syncFolder(folderPath, cursor, opts),
  ),
  fetchOlderMessages: exposeAsync(
    (
      folderPath: string,
      oldestSeq: number,
      opts?: { limit?: number },
    ): Promise<OlderMessagesResult> =>
      fetchOlderMessages(folderPath, oldestSeq, opts),
  ),
  filterExistingUids: exposeAsync(
    (folderPath: string, uids: number[]): Promise<number[]> =>
      filterExistingUids(folderPath, uids),
  ),
  getMessage: exposeAsync(
    (folderPath: string, uid: number): Promise<MessageDetail> =>
      getMessage(folderPath, uid),
  ),
  deleteMessage: exposeAsync((folderPath: string, uid: number): Promise<void> =>
    deleteMessage(folderPath, uid),
  ),
  moveMessage: exposeAsync(
    (folderPath: string, uid: number, destination: string): Promise<void> =>
      moveMessage(folderPath, uid, destination),
  ),
  sendMail: exposeAsync((payload: ComposePayload): Promise<void> =>
    sendMail(payload),
  ),
  openURL: exposeAsync((url: string): Promise<void> => shell.openExternal(url)),
}

contextBridge.exposeInMainWorld('mailbox', api)

declare global {
  const mailbox: typeof api
}
