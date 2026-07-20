import { makeAutoObservable, runInAction } from 'mobx'
import cloneDeep from 'licia/cloneDeep'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import isStrBlank from 'licia/isStrBlank'
import map from 'licia/map'
import trim from 'licia/trim'
import type {
  Account,
  ComposePayload,
  FolderInfo,
  MessageDetail,
  MessageHeader,
} from '../common/types'
import {
  clearAccountCache,
  clearFolderCache,
  getBody,
  getFolderSync,
  getFolders,
  getMessages,
  getSession,
  putBody,
  putFolderSync,
  putFolders,
  putMessages,
  putSession,
  pruneFolderMessages,
  replaceFolderMessages,
  updateMessageFlags,
} from './lib/db'
import { emptySettings, mergeByUid, pickDefaultFolder } from './lib/mail'

const MESSAGE_LIMIT = 50

class Store {
  accounts: Account[] = []
  account: Account | null = null
  folders: FolderInfo[] = []
  currentFolder: string | null = null
  messages: MessageHeader[] = []
  selectedUid: number | null = null
  message: MessageDetail | null = null

  connecting = false
  loadingFolders = false
  loadingMessages = false
  loadingMessage = false
  sending = false
  testing = false

  showSetup = false
  showCompose = false
  setupDraft: Account | null = null

  toastOpen = false
  toastMsg = ''
  toastKind: 'error' | 'success' = 'error'

  constructor() {
    makeAutoObservable(this)
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  showToast(msg: string, kind: 'error' | 'success' = 'error') {
    this.toastMsg = msg
    this.toastKind = kind
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  openSetup(account?: Account | null) {
    this.setupDraft = account
      ? cloneDeep(account)
      : {
          id: crypto.randomUUID(),
          name: '',
          emailAddress: '',
          settings: emptySettings(),
        }
    this.showSetup = true
  }

  closeSetup() {
    this.showSetup = false
    this.setupDraft = null
  }

  openCompose() {
    this.showCompose = true
    this.currentFolder = null
    this.messages = []
    this.message = null
    this.selectedUid = null
  }

  closeCompose() {
    this.showCompose = false
  }

  async init() {
    try {
      const accounts = await mailbox.loadAccounts()
      runInAction(() => {
        this.accounts = accounts
      })

      if (isEmpty(accounts)) {
        runInAction(() => {
          this.openSetup()
        })
        return
      }

      const session = await getSession()
      const account =
        find(accounts, (a) => a.id === session?.accountId) || accounts[0]

      await this.hydrateFromCache(account, session?.folderPath)
      void this.syncAccount(account)
    } catch (err) {
      this.showToast(String(err))
    }
  }

  private async hydrateFromCache(account: Account, folderPath?: string) {
    const folders = (await getFolders(account.id)) || []
    const preferred =
      (folderPath && folders.some((f) => f.path === folderPath)
        ? folderPath
        : null) || pickDefaultFolder(folders)
    const messages = preferred
      ? await getMessages(account.id, preferred, MESSAGE_LIMIT)
      : []

    runInAction(() => {
      this.account = account
      this.folders = folders
      this.currentFolder = preferred
      this.messages = messages
      this.message = null
      this.selectedUid = null
    })
  }

  async syncAccount(account: Account) {
    this.connecting = true
    try {
      await mailbox.connect(account)
      runInAction(() => {
        this.account = account
      })
      await this.refreshFolders()
    } catch (err) {
      this.showToast(String(err))
    } finally {
      runInAction(() => {
        this.connecting = false
      })
    }
  }

  async selectAccount(account: Account) {
    if (this.account?.id === account.id) {
      void this.syncAccount(account)
      return
    }

    await this.hydrateFromCache(account)
    void this.syncAccount(account)
  }

  async refreshFolders() {
    if (!this.account) return
    const accountId = this.account.id
    this.loadingFolders = true
    try {
      const folders = await mailbox.listFolders()
      await putFolders(accountId, folders)

      const nextFolder =
        (this.currentFolder &&
        folders.some((f) => f.path === this.currentFolder)
          ? this.currentFolder
          : null) || pickDefaultFolder(folders)

      runInAction(() => {
        this.folders = folders
      })

      if (this.showCompose) return

      if (nextFolder) {
        await this.selectFolder(nextFolder, { background: true })
      }
    } catch (err) {
      this.showToast(String(err))
    } finally {
      runInAction(() => {
        this.loadingFolders = false
      })
    }
  }

  async selectFolder(
    path: string,
    opts?: { background?: boolean; force?: boolean },
  ) {
    if (!this.account) return
    const accountId = this.account.id
    const switched = this.currentFolder !== path
    const force = opts?.force ?? false

    runInAction(() => {
      this.showCompose = false
      this.currentFolder = path
      if (switched) {
        this.message = null
        this.selectedUid = null
      }
    })

    void putSession(accountId, path)

    if (switched || this.messages.length === 0) {
      const cached = await getMessages(accountId, path, MESSAGE_LIMIT)
      runInAction(() => {
        this.messages = cached
      })
    }

    if (!opts?.background) {
      this.loadingMessages = true
    }

    try {
      await this.syncFolderMessages(path, { force })
    } catch (err) {
      this.showToast(String(err))
    } finally {
      runInAction(() => {
        this.loadingMessages = false
      })
    }
  }

  private async syncFolderMessages(path: string, opts?: { force?: boolean }) {
    if (!this.account) return
    const accountId = this.account.id
    const cursor = (await getFolderSync(accountId, path)) || null
    const result = await mailbox.syncFolder(path, cursor, {
      limit: MESSAGE_LIMIT,
      force: opts?.force,
    })

    if (result.kind === 'replace') {
      const validityChanged =
        !cursor || cursor.uidValidity !== result.uidValidity
      if (validityChanged) {
        await clearFolderCache(accountId, path)
      }
      await replaceFolderMessages(accountId, path, result.messages)
      await putFolderSync(accountId, path, {
        uidValidity: result.uidValidity,
        uidNext: result.uidNext,
        highestModseq: result.highestModseq,
      })
      if (this.currentFolder === path && this.account?.id === accountId) {
        runInAction(() => {
          this.messages = result.messages.slice(0, MESSAGE_LIMIT)
        })
      }
      return
    }

    await putFolderSync(accountId, path, {
      uidValidity: result.uidValidity,
      uidNext: result.uidNext,
      highestModseq: result.highestModseq,
    })

    if (result.kind === 'noop' || result.messages.length === 0) {
      return
    }

    await putMessages(accountId, path, result.messages)
    await pruneFolderMessages(accountId, path, MESSAGE_LIMIT * 4)
    if (this.currentFolder === path && this.account?.id === accountId) {
      runInAction(() => {
        this.messages = mergeByUid(this.messages, result.messages).slice(
          0,
          MESSAGE_LIMIT,
        )
      })
    }
  }

  async refreshMessages() {
    if (!this.currentFolder) return
    await this.selectFolder(this.currentFolder, { force: true })
  }

  async selectMessage(uid: number) {
    if (!this.currentFolder || !this.account) return
    const accountId = this.account.id
    const folderPath = this.currentFolder

    this.selectedUid = uid
    this.message = null

    const cached = await getBody(accountId, folderPath, uid)
    if (cached) {
      runInAction(() => {
        this.message = cached
      })
    }

    this.loadingMessage = !cached
    try {
      const detail = await mailbox.getMessage(folderPath, uid)
      await putBody(accountId, folderPath, detail)
      await updateMessageFlags(accountId, folderPath, uid, {
        flags: detail.flags,
        unseen: false,
        snippet: detail.snippet,
      })
      if (
        this.selectedUid === uid &&
        this.currentFolder === folderPath &&
        this.account?.id === accountId
      ) {
        runInAction(() => {
          this.message = detail
          this.messages = map(this.messages, (m) =>
            m.uid === uid
              ? {
                  ...m,
                  unseen: false,
                  flags: detail.flags,
                  snippet: detail.snippet || m.snippet,
                }
              : m,
          )
        })
      }
    } catch (err) {
      if (!cached) this.showToast(String(err))
    } finally {
      runInAction(() => {
        this.loadingMessage = false
      })
    }
  }

  async testAndSaveAccount(account: Account) {
    if (
      isStrBlank(account.emailAddress) ||
      isStrBlank(account.settings.imapHost)
    ) {
      this.showToast('missingFields')
      return
    }
    this.testing = true
    try {
      const normalized: Account = {
        ...account,
        name: trim(account.name) || trim(account.emailAddress),
        emailAddress: trim(account.emailAddress),
        settings: {
          ...account.settings,
          imapUsername:
            trim(account.settings.imapUsername) || trim(account.emailAddress),
          smtpUsername:
            trim(account.settings.smtpUsername) || trim(account.emailAddress),
          imapHost: trim(account.settings.imapHost),
          smtpHost: trim(account.settings.smtpHost),
        },
      }
      await mailbox.testAccount(normalized)
      const next = [
        ...filter(this.accounts, (a) => a.id !== normalized.id),
        normalized,
      ]
      await mailbox.saveAccounts(next)
      runInAction(() => {
        this.accounts = next
        this.closeSetup()
      })
      this.showToast('accountSaved', 'success')
      await this.selectAccount(normalized)
    } catch (err) {
      this.showToast(String(err))
    } finally {
      runInAction(() => {
        this.testing = false
      })
    }
  }

  async removeAccount(id: string) {
    const next = filter(this.accounts, (a) => a.id !== id)
    await mailbox.saveAccounts(next)
    await clearAccountCache(id)
    runInAction(() => {
      this.accounts = next
    })
    if (this.account?.id === id) {
      await mailbox.disconnect()
      runInAction(() => {
        this.account = null
        this.folders = []
        this.messages = []
        this.message = null
        this.currentFolder = null
      })
      if (next[0]) {
        await this.selectAccount(next[0])
      } else {
        this.openSetup()
      }
    }
  }

  async send(payload: ComposePayload) {
    this.sending = true
    try {
      await mailbox.sendMail(payload)
      runInAction(() => {
        this.showCompose = false
      })
      this.showToast('messageSent', 'success')
    } catch (err) {
      this.showToast(String(err))
    } finally {
      runInAction(() => {
        this.sending = false
      })
    }
  }
}

const store = new Store()

export default store
