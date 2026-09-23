import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const STORAGE_NAME = 'tinker-voice-clone'

export function getStorageRoot(): string {
  const root = path.join(os.homedir(), '.tinker', STORAGE_NAME)
  fs.mkdirSync(root, { recursive: true })
  return root
}

export function getModelsDir(): string {
  const dir = path.join(os.homedir(), '.tinker', 'models')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getRuntimeDir(): string {
  const dir = path.join(getStorageRoot(), 'runtime')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getLogsDir(): string {
  const dir = path.join(getStorageRoot(), 'logs')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getOutputsDir(): string {
  const dir = path.join(getStorageRoot(), 'outputs')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getTempDir(): string {
  const dir = path.join(os.tmpdir(), STORAGE_NAME)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getStatePath(): string {
  return path.join(getStorageRoot(), 'state.json')
}
