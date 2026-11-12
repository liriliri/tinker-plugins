export interface INodeVersion {
  id: string
  version: string
  aliases: string[]
  isDefault: boolean
  isSystem: boolean
}

export interface IRemoteVersion {
  id: string
  version: string
  lts: string | null
}

export interface IVersionEntry {
  id: string
  version: string
  aliases: string[]
  lts: string | null
  isDefault: boolean
  isSystem: boolean
  installed: boolean
}

export interface IShellSetupPreview {
  shell: string
  rcPath: string
}

export interface IShellSetupResult extends IShellSetupPreview {
  fnmPath: string
}
