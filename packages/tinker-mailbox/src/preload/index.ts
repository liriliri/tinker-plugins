import { contextBridge } from 'electron'
import { loadAccounts, saveAccounts } from './accountStore'
import {
  connect,
  disconnect,
  getMessage,
  listFolders,
  sendMail,
  syncFolder,
  testAccount,
} from './mailClient'
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
  sendMail: (payload: ComposePayload): Promise<void> => sendMail(payload),
}

contextBridge.exposeInMainWorld('mailbox', api)

declare global {
  const mailbox: typeof api
}
