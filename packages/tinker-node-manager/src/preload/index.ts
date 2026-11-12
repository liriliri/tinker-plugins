import { contextBridge } from 'electron'
import {
  installVersion,
  listRemoteVersions,
  listVersions,
  setDefaultVersion,
  uninstallVersion,
} from '../lib/fnm'
import { getShellSetupPreview, setupShellEnv } from '../lib/shell'
import type {
  INodeVersion,
  IRemoteVersion,
  IShellSetupPreview,
  IShellSetupResult,
} from '../common/types'

const api = {
  listVersions: (): Promise<INodeVersion[]> => listVersions(),
  listRemoteVersions: (opts?: {
    ltsOnly?: boolean
  }): Promise<IRemoteVersion[]> => listRemoteVersions(opts),
  installVersion: (version: string): Promise<void> => installVersion(version),
  uninstallVersion: (version: string): Promise<void> =>
    uninstallVersion(version),
  setDefaultVersion: (version: string): Promise<void> =>
    setDefaultVersion(version),
  getShellSetupPreview: (): IShellSetupPreview => getShellSetupPreview(),
  setupShellEnv: (): Promise<IShellSetupResult> => setupShellEnv(),
}

contextBridge.exposeInMainWorld('nodeManager', api)

declare global {
  const nodeManager: typeof api
}
