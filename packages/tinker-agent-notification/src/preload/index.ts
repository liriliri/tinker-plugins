import { contextBridge } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

const pluginRoot = path.resolve(__dirname, '..', '..')
const soundsDir = path.join(pluginRoot, 'dist', 'sounds')
const playScript = path.join(soundsDir, 'play.ps1')
const iconPath = path.join(pluginRoot, 'icon.png')

const api = {
  getSoundsDir: () => soundsDir,
  getPlayScript: () => playScript,
  getIconPath: () => iconPath,
  ensureDir: (dir: string) => fs.mkdir(dir, { recursive: true }),
  copyFile: (source: string, target: string) => fs.copyFile(source, target),
}

contextBridge.exposeInMainWorld('agentNotification', api)

declare global {
  const agentNotification: typeof api
}
