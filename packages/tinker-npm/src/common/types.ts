export interface PackageSearchItem {
  name: string
  version: string
  description: string
  date: string
  publisher: string
  keywords: string[]
  weeklyDownloads: number
  dependents: number
}

export interface PackageDetail {
  name: string
  description: string
  license: string
  homepage: string
  repository: string
  latest: string
  versions: string[]
  keywords: string[]
  maintainers: string[]
  time: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  unpackedSize: number
  tarball: string
  readme: string
}

export interface DownloadResult {
  tarballPath: string
  extractPath: string
}
