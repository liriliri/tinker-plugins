import { contextBridge, shell } from 'electron'
import { loadAccounts, saveAccounts } from './accountStore'
import {
  connect,
  deleteMessage,
  disconnect,
  getMessage,
  listFolders,
  moveMessage,
  sendMail,
  syncFolder,
  testAccount,
} from './mail'
import type {
  Account,
  ComposePayload,
  FolderInfo,
  FolderSyncCursor,
  FolderSyncResult,
  MessageDetail,
} from '../common/types'

const api = {
  loadAccounts: (): Promise<Account[]> => loadAccounts(),
  saveAccounts: (accounts: Account[]): Promise<void> => saveAccounts(accounts),
  testAccount: (account: Account): Promise<void> => testAccount(account),
  connect: (account: Account): Promise<void> => connect(account),
  disconnect: (): Promise<void> => disconnect(),
  listFolders: (): Promise<FolderInfo[]> => listFolders(),
  syncFolder: (
    folderPath: string,
    cursor: FolderSyncCursor | null,
    opts?: { limit?: number; force?: boolean },
  ): Promise<FolderSyncResult> => syncFolder(folderPath, cursor, opts),
  getMessage: (folderPath: string, uid: number): Promise<MessageDetail> =>
    getMessage(folderPath, uid),
  deleteMessage: (folderPath: string, uid: number): Promise<void> =>
    deleteMessage(folderPath, uid),
  moveMessage: (
    folderPath: string,
    uid: number,
    destination: string,
  ): Promise<void> => moveMessage(folderPath, uid, destination),
  sendMail: (payload: ComposePayload): Promise<void> => sendMail(payload),
  openURL: (url: string): Promise<void> => shell.openExternal(url),
}

contextBridge.exposeInMainWorld('mailbox', api)

declare global {
  const mailbox: typeof api
}
