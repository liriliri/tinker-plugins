import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { findPackageRoot } from './piLoader'
import type { SessionManager } from '@earendil-works/pi-coding-agent'

type SessionManagerModule = {
  SessionManager: typeof SessionManager
}

let cached: SessionManagerModule | null = null

export async function loadSessionManagerModule(): Promise<SessionManagerModule> {
  if (cached) return cached
  const root = findPackageRoot('@earendil-works/pi-coding-agent')
  cached = (await import(
    pathToFileURL(path.join(root, 'dist/core/session-manager.js')).href
  )) as SessionManagerModule
  return cached
}
