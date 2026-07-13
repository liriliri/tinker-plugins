import { contextBridge } from 'electron'
import { agentHost } from './agentHost'
import type { CodingAgentEvent } from '../common/types'

const api = {
  openWorkspace: () => agentHost.openWorkspace(),
  setWorkspace: (cwd: string) => agentHost.setWorkspace(cwd),
  getWorkspace: async () => agentHost.getWorkspace(),
  listProviders: () => tinker.getAIProviders(),
  setModel: (provider: string, model: string) =>
    agentHost.setModel(provider, model),
  getModel: async () => agentHost.getModel(),
  prompt: (text: string) => agentHost.prompt(text),
  abort: () => agentHost.abort(),
  getMessages: async () => agentHost.getMessages(),
  isRunning: async () => agentHost.isRunning(),
  onEvent: (callback: (event: CodingAgentEvent) => void) =>
    agentHost.onEvent(callback),
}

contextBridge.exposeInMainWorld('codingAgent', api)

declare global {
  const codingAgent: typeof api
}
