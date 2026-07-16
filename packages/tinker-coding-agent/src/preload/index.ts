import { contextBridge } from 'electron'
import { agentHost } from './agentHost'
import type { CodingAgentEvent } from '../common/types'

const api = {
  openWorkspace: () => agentHost.openWorkspace(),
  setWorkspace: (cwd: string) => agentHost.setWorkspace(cwd),
  leaveWorkspace: () => agentHost.leaveWorkspace(),
  getWorkspace: async () => agentHost.getWorkspace(),
  listProviders: () => tinker.getAIProviders(),
  setModel: (provider: string, model: string) =>
    agentHost.setModel(provider, model),
  getModel: async () => agentHost.getModel(),
  ensureDefaultModel: () => agentHost.ensureDefaultModel(),
  getSessions: async () => agentHost.getSessions(),
  getActiveSessionId: async () => agentHost.getActiveSessionId(),
  createSession: () => agentHost.createSession(),
  selectSession: (id: string) => agentHost.selectSession(id),
  deleteSession: (id: string) => agentHost.deleteSession(id),
  prompt: (text: string) => agentHost.prompt(text),
  abort: () => agentHost.abort(),
  getMessages: async () => agentHost.getMessages(),
  getSkills: async () => agentHost.getSkills(),
  getContextUsage: async () => agentHost.getContextUsage(),
  isRunning: async () => agentHost.isRunning(),
  onEvent: (callback: (event: CodingAgentEvent) => void) =>
    agentHost.onEvent(callback),
}

contextBridge.exposeInMainWorld('codingAgent', api)

declare global {
  const codingAgent: typeof api
}
