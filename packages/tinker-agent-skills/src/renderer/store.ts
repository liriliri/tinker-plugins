import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import type {
  MarketplaceSkill,
  RepoSkillCandidate,
  SkillAgentLink,
  SkillInfo,
} from '../common/types'
import { filterSkills } from './lib/filterSkills'
import { toErrorKey } from './lib/installError'
import { createMcpApi } from './mcp'

export class Store {
  readonly mcp = createMcpApi(() => this)
  skills: SkillInfo[] = []
  query: string = ''
  isLoading: boolean = false
  error: string = ''

  configSkill: SkillInfo | null = null
  configAgents: SkillAgentLink[] = []
  configLoading: boolean = false
  configSavingId: string = ''
  deleteTarget: SkillInfo | null = null
  deletingPath: string = ''

  addMenuOpen: boolean = false
  addDialogOpen: boolean = false
  addInstalling: boolean = false

  marketplaceOpen: boolean = false
  marketplaceQuery: string = ''
  marketplaceSkills: MarketplaceSkill[] = []
  marketplaceCursor: string | null = null
  marketplaceHasMore: boolean = false
  marketplaceLoading: boolean = false
  marketplaceLoadingMore: boolean = false
  marketplaceInstallingId: string = ''
  marketplaceError: string = ''

  repoDialogOpen: boolean = false
  repoSource: string = ''
  repoSourceLabel: string = ''
  repoSessionId: string = ''
  repoSkills: RepoSkillCandidate[] = []
  repoSelectedIds: string[] = []
  repoResolving: boolean = false
  repoInstalling: boolean = false
  repoError: string = ''

  toastOpen: boolean = false
  toastMsg: string = ''
  toastType: 'success' | 'error' = 'success'

  private marketplaceSearchSeq = 0
  private debouncedMarketplaceSearch: (query: string) => void

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
    this.debouncedMarketplaceSearch = debounce((query: string) => {
      void this.fetchMarketplace(query, false)
    }, 320)
  }

  setQuery(query: string) {
    this.query = query
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toastMsg = msg
    this.toastType = type
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  get filteredSkills(): SkillInfo[] {
    return filterSkills(this.skills, this.query)
  }

  setAddMenuOpen(open: boolean) {
    this.addMenuOpen = open
  }

  openAddDialog() {
    this.addMenuOpen = false
    this.addDialogOpen = true
  }

  closeAddDialog() {
    if (this.addInstalling) return
    this.addDialogOpen = false
  }

  openMarketplace() {
    this.addMenuOpen = false
    this.marketplaceOpen = true
    this.marketplaceError = ''
    if (this.marketplaceSkills.length === 0) {
      void this.fetchMarketplace(this.marketplaceQuery, false)
    }
  }

  closeMarketplace() {
    if (this.marketplaceInstallingId) return
    this.marketplaceOpen = false
  }

  openRepoDialog() {
    this.addMenuOpen = false
    this.repoDialogOpen = true
    this.repoError = ''
  }

  closeRepoDialog() {
    if (this.repoResolving || this.repoInstalling) return
    const sessionId = this.repoSessionId
    this.repoDialogOpen = false
    this.repoSourceLabel = ''
    this.repoSessionId = ''
    this.repoSkills = []
    this.repoSelectedIds = []
    this.repoError = ''
    if (sessionId) {
      void agentSkills.cancelRepoSession(sessionId)
    }
  }

  setRepoSource(source: string) {
    this.repoSource = source
  }

  toggleRepoSkill(id: string) {
    if (this.repoSelectedIds.includes(id)) {
      this.repoSelectedIds = this.repoSelectedIds.filter((item) => item !== id)
    } else {
      this.repoSelectedIds = [...this.repoSelectedIds, id]
    }
  }

  toggleAllRepoSkills(selectAll: boolean) {
    this.repoSelectedIds = selectAll
      ? this.repoSkills.map((skill) => skill.id)
      : []
  }

  async resolveRepoSkills() {
    if (this.repoResolving || this.repoInstalling) return
    const source = this.repoSource.trim()
    if (!source) return

    const prevSession = this.repoSessionId
    this.repoResolving = true
    this.repoError = ''
    this.repoSkills = []
    this.repoSelectedIds = []
    this.repoSessionId = ''
    this.repoSourceLabel = ''
    if (prevSession) {
      await agentSkills.cancelRepoSession(prevSession).catch(() => {})
    }

    try {
      const result = await agentSkills.resolveRepoSkills(source)
      const selectedIds = result.skills.map((skill) => skill.id)
      runInAction(() => {
        this.repoSessionId = result.sessionId
        this.repoSourceLabel = result.sourceLabel
        this.repoSkills = result.skills
        this.repoSelectedIds = selectedIds
        this.repoError = ''
        this.repoResolving = false
      })
      // owner/repo@skill → install immediately with explicit ids (avoid store races)
      if (result.targeted && result.skills.length === 1) {
        await this.installRepoSkills(result.sessionId, selectedIds)
      }
    } catch (err) {
      runInAction(() => {
        this.repoError = toErrorKey(err, 'errRepoDownload')
        this.repoResolving = false
      })
    }
  }

  async installRepoSkills(sessionId?: string, skillIds?: string[]) {
    const sid = sessionId || this.repoSessionId
    const ids = skillIds || this.repoSelectedIds
    if (this.repoInstalling || !sid || ids.length === 0) return

    this.repoInstalling = true
    this.repoError = ''
    try {
      await agentSkills.installRepoSkills(sid, ids)
      runInAction(() => {
        this.repoSessionId = ''
        this.repoDialogOpen = false
        this.repoSkills = []
        this.repoSelectedIds = []
        this.repoSourceLabel = ''
        this.showToast('repoInstallSuccess')
      })
      await this.loadSkills()
    } catch (err) {
      const key = toErrorKey(err, 'addFailed')
      runInAction(() => {
        this.repoError = key
        this.showToast(key, 'error')
      })
    } finally {
      runInAction(() => {
        this.repoInstalling = false
      })
    }
  }

  setMarketplaceQuery(query: string) {
    this.marketplaceQuery = query
    this.debouncedMarketplaceSearch(query)
  }

  async refreshMarketplace() {
    await this.fetchMarketplace(this.marketplaceQuery, false)
  }

  async loadMoreMarketplace() {
    if (
      !this.marketplaceHasMore ||
      this.marketplaceLoading ||
      this.marketplaceLoadingMore ||
      this.marketplaceQuery.trim()
    ) {
      return
    }
    await this.fetchMarketplace(this.marketplaceQuery, true)
  }

  private async fetchMarketplace(query: string, append: boolean) {
    const seq = ++this.marketplaceSearchSeq
    if (append) {
      this.marketplaceLoadingMore = true
    } else {
      this.marketplaceLoading = true
      this.marketplaceError = ''
    }

    try {
      const result = await agentSkills.searchMarketplace(
        query,
        append ? this.marketplaceCursor : null,
      )
      if (seq !== this.marketplaceSearchSeq) return
      runInAction(() => {
        this.marketplaceSkills = append
          ? [...this.marketplaceSkills, ...result.skills]
          : result.skills
        this.marketplaceCursor = result.nextCursor
        this.marketplaceHasMore = result.hasMore
        this.marketplaceError = ''
      })
    } catch (err) {
      if (seq !== this.marketplaceSearchSeq) return
      runInAction(() => {
        this.marketplaceError = toErrorKey(err, 'errMarketplaceNetwork')
        if (!append) {
          this.marketplaceSkills = []
          this.marketplaceHasMore = false
          this.marketplaceCursor = null
        }
      })
    } finally {
      if (seq === this.marketplaceSearchSeq) {
        runInAction(() => {
          this.marketplaceLoading = false
          this.marketplaceLoadingMore = false
        })
      }
    }
  }

  async installMarketplaceSkill(skill: MarketplaceSkill) {
    if (this.marketplaceInstallingId) return
    this.marketplaceInstallingId = skill.id
    try {
      await agentSkills.installMarketplaceSkill({
        slug: skill.slug,
        name: skill.name,
        author: skill.author,
        version: skill.version,
      })
      runInAction(() => {
        this.marketplaceSkills = this.marketplaceSkills.map((item) =>
          item.id === skill.id || item.slug === skill.slug
            ? { ...item, installed: true }
            : item,
        )
        this.showToast('addSuccess')
      })
      await this.loadSkills()
    } catch (err) {
      const key = toErrorKey(err, 'addFailed')
      runInAction(() => {
        this.showToast(key, 'error')
      })
    } finally {
      runInAction(() => {
        this.marketplaceInstallingId = ''
      })
    }
  }

  async pickAndInstallSkill() {
    if (this.addInstalling) return
    const result = await tinker.showOpenDialog({
      properties: ['openFile', 'openDirectory'],
      filters: [
        { name: 'ZIP', extensions: ['zip'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    if (result.canceled || !result.filePaths.length) return
    await this.installSkill(result.filePaths[0])
  }

  async installSkill(sourcePath: string) {
    if (this.addInstalling) return
    this.addInstalling = true
    try {
      await agentSkills.installSkill(sourcePath)
      runInAction(() => {
        this.addDialogOpen = false
        this.showToast('addSuccess')
      })
      await this.loadSkills()
    } catch (err) {
      const key = toErrorKey(err, 'addFailed')
      runInAction(() => {
        this.showToast(key, 'error')
      })
    } finally {
      runInAction(() => {
        this.addInstalling = false
      })
    }
  }

  async loadSkills(options?: { notify?: boolean }) {
    if (this.isLoading) return
    this.isLoading = true
    this.error = ''
    try {
      const skills = await agentSkills.listSkills()
      runInAction(() => {
        this.skills = skills
        if (this.configSkill) {
          const updated = skills.find((s) => s.path === this.configSkill!.path)
          if (updated) {
            this.configSkill = updated
            this.configAgents = updated.agents
          }
        }
        if (options?.notify) {
          this.showToast('refreshSuccess')
        }
      })
    } catch (err) {
      runInAction(() => {
        this.error = String(err)
        this.skills = []
        if (options?.notify) {
          this.showToast('refreshFailed', 'error')
        }
      })
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  async openConfig(skill: SkillInfo) {
    this.configSkill = skill
    this.configAgents = skill.agents
    this.configLoading = true
    try {
      const agents = await agentSkills.getSkillAgents(skill.path)
      runInAction(() => {
        this.configAgents = agents
        this.updateSkillAgents(skill.path, agents)
      })
    } catch (err) {
      runInAction(() => {
        this.error = String(err)
      })
    } finally {
      runInAction(() => {
        this.configLoading = false
      })
    }
  }

  closeConfig() {
    this.configSkill = null
    this.configAgents = []
    this.configSavingId = ''
  }

  requestDelete(skill: SkillInfo) {
    if (this.deletingPath) return
    this.deleteTarget = skill
  }

  closeDeleteDialog() {
    if (this.deletingPath) return
    this.deleteTarget = null
  }

  async confirmDelete() {
    const skill = this.deleteTarget
    if (!skill || this.deletingPath) return

    this.deletingPath = skill.path
    try {
      await agentSkills.deleteSkill(skill.path)
      runInAction(() => {
        this.skills = this.skills.filter((item) => item.path !== skill.path)
        if (this.configSkill?.path === skill.path) {
          this.closeConfig()
        }
        this.marketplaceSkills = this.marketplaceSkills.map((item) =>
          item.slug === skill.folderName || item.name === skill.name
            ? { ...item, installed: false }
            : item,
        )
        this.deleteTarget = null
        this.showToast('deleteSuccess')
      })
    } catch (err) {
      const key = toErrorKey(err, 'errDeleteFailed')
      runInAction(() => {
        this.showToast(key, 'error')
      })
    } finally {
      runInAction(() => {
        this.deletingPath = ''
      })
    }
  }

  private updateSkillAgents(skillPath: string, agents: SkillAgentLink[]) {
    const index = this.skills.findIndex((s) => s.path === skillPath)
    if (index !== -1) {
      this.skills[index] = { ...this.skills[index], agents }
    }
    if (this.configSkill?.path === skillPath) {
      this.configSkill = { ...this.configSkill, agents }
    }
  }

  async toggleSkillAgent(agentId: string, enabled: boolean) {
    if (!this.configSkill || this.configSavingId) return
    this.configSavingId = agentId
    try {
      const agents = await agentSkills.setSkillAgent(
        this.configSkill.path,
        agentId,
        enabled,
      )
      runInAction(() => {
        this.configAgents = agents
        this.updateSkillAgents(this.configSkill!.path, agents)
      })
    } catch (err) {
      runInAction(() => {
        this.error = String(err)
      })
    } finally {
      runInAction(() => {
        this.configSavingId = ''
      })
    }
  }
}

const store = new Store()

export default store
