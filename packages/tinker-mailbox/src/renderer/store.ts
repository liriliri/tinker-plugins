import { makeAutoObservable, runInAction, toJS } from 'mobx'
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
  FolderSyncCursor,
  MailboxIdleChange,
  MessageDetail,
  MessageHeader,
} from '../common/types'
import {
  clearAccountCache,
  clearFolderCache,
  countMessages,
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
  removeMessage,
  replaceFolderMessages,
  updateMessageFlags,
} from './lib/db'
import {
  emptySettings,
  isTrashFolderPath,
  mergeByUid,
  pickDefaultFolder,
  pickSentFolder,
  sameMailboxPath,
} from './lib/mail'
import { createMcpApi } from './mcp'

const MESSAGE_PAGE = 50
const MESSAGE_CACHE_KEEP = 2000

export class Store {
  readonly mcp = createMcpApi(() => this)

  accounts: Account[] = []
  account: Account | null = null
  folders: FolderInfo[] = []
  currentFolder: string | null = null
  messages: MessageHeader[] = []
  selectedUid: number | null = null
  message: MessageDetail | null = null

  oldestSeq = 1
  hasMoreMessages = false
  loadingMore = false

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
  isDark = false

  private idleSyncTimer: ReturnType<typeof setTimeout> | null = null
  private folderSyncTail: Promise<void> = Promise.resolve()

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
    void this.initTheme()
    mailbox.onMailboxChange((change) => {
      this.scheduleIdleSync(change)
    })
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return
        if (!this.currentFolder || this.showCompose || this.loadingMessages) {
          return
        }
        void this.syncFolderMessages(this.currentFolder).catch(() => {})
      })
    }
  }

  private scheduleIdleSync(change: MailboxIdleChange) {
    if (
      this.showCompose ||
      !this.currentFolder ||
      this.loadingMessages ||
      this.loadingMore
    ) {
      return
    }
    if (change.path && !sameMailboxPath(change.path, this.currentFolder)) {
      return
    }
    const force =
      change.type === 'expunge' ||
      (change.type === 'exists' && change.count < change.prevCount)
    if (this.idleSyncTimer) clearTimeout(this.idleSyncTimer)
    const path = this.currentFolder
    this.idleSyncTimer = setTimeout(() => {
      this.idleSyncTimer = null
      if (
        this.currentFolder !== path ||
        this.showCompose ||
        this.loadingMessages
      ) {
        return
      }
      void this.syncFolderMessages(path, { force }).catch((err) => {
        this.showToast(String(err))
      })
    }, 300)
  }

  private async initTheme() {
    const theme = await tinker.getTheme()
    runInAction(() => {
      this.isDark = theme === 'dark'
    })
    tinker.on('changeTheme', async () => {
      const next = await tinker.getTheme()
      runInAction(() => {
        this.isDark = next === 'dark'
      })
    })
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
      ? toJS(account)
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
    this.oldestSeq = 1
    this.hasMoreMessages = false
    this.message = null
    this.selectedUid = null
  }

  closeCompose() {
    const inbox = pickDefaultFolder(this.folders)
    if (inbox) {
      void this.selectFolder(inbox)
      return
    }
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

    if (!preferred) {
      runInAction(() => {
        this.account = account
        this.folders = folders
        this.currentFolder = null
        this.messages = []
        this.oldestSeq = 1
        this.hasMoreMessages = false
        this.message = null
        this.selectedUid = null
      })
      return
    }

    const cachedCount = await countMessages(account.id, preferred)
    const messages = await getMessages(account.id, preferred, MESSAGE_PAGE)
    const sync = await getFolderSync(account.id, preferred)
    const oldestSeq =
      sync?.oldestSeq ??
      Math.max(1, (sync?.exists ?? cachedCount) - cachedCount + 1)

    runInAction(() => {
      this.account = account
      this.folders = folders
      this.currentFolder = preferred
      this.messages = messages
      this.oldestSeq = oldestSeq
      this.hasMoreMessages =
        cachedCount > messages.length ||
        oldestSeq > 1 ||
        (!!sync?.exists && cachedCount < sync.exists)
      this.message = null
      this.selectedUid = null
    })
  }

  async syncAccount(account: Account) {
    this.connecting = true
    try {
      await mailbox.connect(toJS(account))
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
  ): Promise<boolean> {
    if (!this.account) return false
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

    if (this.idleSyncTimer) {
      clearTimeout(this.idleSyncTimer)
      this.idleSyncTimer = null
    }

    const cachedCount = await countMessages(accountId, path)
    const syncMeta = (await getFolderSync(accountId, path)) || null
    const staleLocal =
      typeof syncMeta?.exists === 'number' && cachedCount > syncMeta.exists
    const shouldForce = force || staleLocal

    if (switched || this.messages.length === 0) {
      const page = await getMessages(accountId, path, MESSAGE_PAGE)
      const oldestSeq =
        syncMeta?.oldestSeq ??
        Math.max(1, (syncMeta?.exists ?? cachedCount) - cachedCount + 1)
      runInAction(() => {
        this.messages = page
        this.oldestSeq = oldestSeq
        this.hasMoreMessages =
          cachedCount > page.length ||
          oldestSeq > 1 ||
          (!!syncMeta?.exists && cachedCount < syncMeta.exists)
      })
    }

    if (!opts?.background && this.messages.length === 0) {
      this.loadingMessages = true
    }

    try {
      await this.syncFolderMessages(path, { force: shouldForce })
      try {
        await mailbox.watchFolder(path)
      } catch {
        /* ignore */
      }
      return true
    } catch (err) {
      this.showToast(String(err))
      return false
    } finally {
      runInAction(() => {
        this.loadingMessages = false
      })
    }
  }

  private applyFolderCursor(
    cursor: {
      oldestSeq?: number
      exists?: number
    },
    visibleCount: number,
    cachedCount = visibleCount,
  ) {
    const oldestSeq =
      cursor.oldestSeq ??
      Math.max(1, (cursor.exists ?? cachedCount) - cachedCount + 1)
    this.oldestSeq = oldestSeq
    this.hasMoreMessages =
      visibleCount < cachedCount ||
      oldestSeq > 1 ||
      (!!cursor.exists && cachedCount < cursor.exists)
  }

  private async ensureOldestSeq(
    accountId: string,
    path: string,
    cursor: FolderSyncCursor,
  ): Promise<FolderSyncCursor> {
    if (cursor.oldestSeq != null) return cursor
    const cachedCount = await countMessages(accountId, path)
    const oldestSeq = Math.max(
      1,
      (cursor.exists ?? cachedCount) - cachedCount + 1,
    )
    const next = { ...cursor, oldestSeq }
    await putFolderSync(accountId, path, next)
    return next
  }

  private async syncFolderMessages(path: string, opts?: { force?: boolean }) {
    const run = () => this.syncFolderMessagesLocked(path, opts)
    const next = this.folderSyncTail.then(run, run)
    this.folderSyncTail = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  private async syncFolderMessagesLocked(
    path: string,
    opts?: { force?: boolean },
  ) {
    if (!this.account) return
    const accountId = this.account.id
    let cursor = (await getFolderSync(accountId, path)) || null
    if (cursor?.exists != null && cursor.oldestSeq == null) {
      cursor = await this.ensureOldestSeq(accountId, path, cursor)
    }
    const force = opts?.force || cursor?.exists === undefined
    const result = await mailbox.syncFolder(path, cursor, {
      limit: MESSAGE_PAGE,
      force,
    })

    if (result.kind === 'replace') {
      const validityChanged =
        !cursor || cursor.uidValidity !== result.uidValidity
      let nextMessages = result.messages
      let nextOldest = result.oldestSeq ?? 1

      if (validityChanged) {
        await clearFolderCache(accountId, path)
        await replaceFolderMessages(accountId, path, result.messages)
      } else {
        const existing = await getMessages(accountId, path)
        const fetchedUids = new Set(map(result.messages, (m) => m.uid))
        const minFetchedUid = result.messages.reduce(
          (min, m) => Math.min(min, m.uid),
          Number.POSITIVE_INFINITY,
        )
        let older = filter(
          existing,
          (m) => !fetchedUids.has(m.uid) && m.uid < minFetchedUid,
        )

        if (
          typeof result.exists === 'number' &&
          result.messages.length + older.length > result.exists &&
          older.length > 0
        ) {
          try {
            const still = new Set(
              await mailbox.filterExistingUids(
                path,
                map(older, (m) => m.uid),
              ),
            )
            older = filter(older, (m) => still.has(m.uid))
          } catch {
            /* ignore */
          }
        }

        nextMessages = mergeByUid(result.messages, older)
        nextOldest =
          older.length > 0 && cursor?.oldestSeq != null
            ? Math.min(cursor.oldestSeq, result.oldestSeq ?? cursor.oldestSeq)
            : (result.oldestSeq ?? 1)
        await replaceFolderMessages(accountId, path, nextMessages)
        await pruneFolderMessages(accountId, path, MESSAGE_CACHE_KEEP)
      }

      await putFolderSync(accountId, path, {
        uidValidity: result.uidValidity,
        uidNext: result.uidNext,
        highestModseq: result.highestModseq,
        exists: result.exists,
        oldestSeq: nextOldest,
      })
      await this.applyVisibleMessages(accountId, path, {
        oldestSeq: nextOldest,
        exists: result.exists,
        resetPage: force,
      })
      return
    }

    await putFolderSync(accountId, path, {
      uidValidity: result.uidValidity,
      uidNext: result.uidNext,
      highestModseq: result.highestModseq,
      exists: result.exists,
      oldestSeq: result.oldestSeq ?? cursor?.oldestSeq,
    })

    if (result.kind === 'noop') {
      const localCount = await countMessages(accountId, path)
      if (
        typeof result.exists === 'number' &&
        localCount > result.exists &&
        !opts?.force
      ) {
        await this.syncFolderMessagesLocked(path, { force: true })
        return
      }
      if (this.currentFolder === path && this.account?.id === accountId) {
        runInAction(() => {
          this.applyFolderCursor(
            {
              oldestSeq: result.oldestSeq ?? cursor?.oldestSeq,
              exists: result.exists,
            },
            this.messages.length,
            localCount,
          )
        })
      }
      return
    }

    if (result.messages.length === 0) {
      return
    }

    await putMessages(accountId, path, result.messages)
    await pruneFolderMessages(accountId, path, MESSAGE_CACHE_KEEP)
    if (this.currentFolder === path && this.account?.id === accountId) {
      const keep = Math.max(MESSAGE_PAGE, this.messages.length)
      runInAction(() => {
        this.messages = mergeByUid(this.messages, result.messages).slice(
          0,
          keep,
        )
        this.applyFolderCursor(
          {
            oldestSeq: result.oldestSeq ?? cursor?.oldestSeq,
            exists: result.exists,
          },
          this.messages.length,
          this.messages.length,
        )
      })
      void countMessages(accountId, path).then((cachedCount) => {
        if (this.currentFolder !== path) return
        runInAction(() => {
          this.applyFolderCursor(
            {
              oldestSeq: result.oldestSeq ?? cursor?.oldestSeq,
              exists: result.exists,
            },
            this.messages.length,
            cachedCount,
          )
        })
      })
    }
  }

  private async applyVisibleMessages(
    accountId: string,
    path: string,
    cursor: { oldestSeq?: number; exists?: number; resetPage?: boolean },
  ) {
    if (this.currentFolder !== path || this.account?.id !== accountId) return
    const all = await getMessages(accountId, path)
    const keep = cursor.resetPage
      ? MESSAGE_PAGE
      : Math.max(MESSAGE_PAGE, this.messages.length)
    const visible = all.slice(0, Math.min(all.length, keep))
    runInAction(() => {
      this.messages = visible
      this.applyFolderCursor(cursor, visible.length, all.length)
    })
  }

  async loadMoreMessages() {
    if (
      !this.account ||
      !this.currentFolder ||
      !this.hasMoreMessages ||
      this.loadingMore ||
      this.loadingMessages
    ) {
      return
    }

    const accountId = this.account.id
    const path = this.currentFolder
    this.loadingMore = true

    try {
      const cached = await getMessages(accountId, path)
      if (cached.length > this.messages.length) {
        const nextLen = Math.min(
          cached.length,
          this.messages.length + MESSAGE_PAGE,
        )
        const sync = (await getFolderSync(accountId, path)) || null
        runInAction(() => {
          this.messages = cached.slice(0, nextLen)
          this.applyFolderCursor(
            {
              oldestSeq: sync?.oldestSeq ?? this.oldestSeq,
              exists: sync?.exists,
            },
            nextLen,
            cached.length,
          )
        })
        if (nextLen < cached.length) return
        if (this.oldestSeq <= 1) return
      }

      if (this.oldestSeq <= 1) {
        runInAction(() => {
          this.hasMoreMessages = false
        })
        return
      }

      const prev = await getFolderSync(accountId, path)
      if (!prev) return

      const result = await mailbox.fetchOlderMessages(path, this.oldestSeq, {
        limit: MESSAGE_PAGE,
      })
      if (result.messages.length > 0) {
        await putMessages(accountId, path, result.messages)
        await pruneFolderMessages(accountId, path, MESSAGE_CACHE_KEEP)
      }
      await putFolderSync(accountId, path, {
        uidValidity: prev.uidValidity,
        uidNext: prev.uidNext,
        highestModseq: prev.highestModseq,
        exists: result.exists,
        oldestSeq: result.oldestSeq,
      })

      if (this.currentFolder === path && this.account?.id === accountId) {
        const all = await getMessages(accountId, path)
        const keep = Math.min(all.length, this.messages.length + MESSAGE_PAGE)
        const visible = all.slice(0, keep)
        runInAction(() => {
          this.messages = visible
          this.oldestSeq = result.oldestSeq
          this.hasMoreMessages = visible.length < all.length || result.hasMore
        })
      }
    } catch (err) {
      this.showToast(String(err))
    } finally {
      runInAction(() => {
        this.loadingMore = false
      })
    }
  }

  async refreshMessages() {
    if (!this.currentFolder) return
    const ok = await this.selectFolder(this.currentFolder, { force: true })
    if (ok) this.showToast('refreshSuccess', 'success')
  }

  async deleteMessage(uid: number) {
    if (!this.currentFolder || !this.account) return
    const accountId = this.account.id
    const folderPath = this.currentFolder
    try {
      await mailbox.deleteMessage(folderPath, uid)
      await this.removeMessageLocally(accountId, folderPath, uid)
      this.showToast(
        isTrashFolderPath(this.folders, folderPath)
          ? 'messageDeleted'
          : 'messageMovedToTrash',
        'success',
      )
    } catch (err) {
      await this.handleMessageMutationError(err, accountId, folderPath, uid)
    }
  }

  async moveMessage(uid: number, destination: string) {
    if (!this.currentFolder || !this.account) return
    if (this.currentFolder === destination) return
    const accountId = this.account.id
    const folderPath = this.currentFolder
    try {
      await mailbox.moveMessage(folderPath, uid, destination)
      await this.removeMessageLocally(accountId, folderPath, uid)
      this.showToast('messageMoved', 'success')
    } catch (err) {
      await this.handleMessageMutationError(err, accountId, folderPath, uid)
    }
  }

  private async handleMessageMutationError(
    err: unknown,
    accountId: string,
    folderPath: string,
    uid: number,
  ) {
    const message = String(err)
    if (/not found/i.test(message)) {
      await this.removeMessageLocally(accountId, folderPath, uid)
      await this.selectFolder(folderPath, { force: true })
      this.showToast('messageGone', 'success')
      return
    }
    this.showToast(message)
  }

  private async removeMessageLocally(
    accountId: string,
    folderPath: string,
    uid: number,
  ) {
    await removeMessage(accountId, folderPath, uid)
    if (this.currentFolder === folderPath && this.account?.id === accountId) {
      runInAction(() => {
        this.messages = filter(this.messages, (m) => m.uid !== uid)
        if (this.selectedUid === uid) {
          this.selectedUid = null
          this.message = null
        }
      })
    }
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
      await mailbox.testAccount(toJS(normalized))
      const next = [
        ...filter(this.accounts, (a) => a.id !== normalized.id),
        normalized,
      ]
      await mailbox.saveAccounts(toJS(next))
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
    await mailbox.saveAccounts(toJS(next))
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
        this.oldestSeq = 1
        this.hasMoreMessages = false
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

  async send(payload: ComposePayload): Promise<boolean> {
    this.sending = true
    try {
      await mailbox.sendMail(payload)
      runInAction(() => {
        this.showCompose = false
        this.sending = false
      })
      this.showToast('messageSent', 'success')
      const sent = pickSentFolder(this.folders)
      if (sent) {
        await this.selectFolder(sent, { force: true })
      }
      return true
    } catch (err) {
      this.showToast(String(err))
      return false
    } finally {
      if (this.sending) {
        runInAction(() => {
          this.sending = false
        })
      }
    }
  }
}

const store = new Store()

export default store
