import { contextBridge, shell } from 'electron'
import { exec } from 'child_process'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import replaceAll from 'licia/replaceAll'

function quote(path: string) {
  return `"${replaceAll(path, '"', '\\"')}"`
}

const api = {
  openApp(appPath: string): Promise<string> {
    let cmd: string
    if (isMac) {
      cmd = `open ${quote(appPath)}`
    } else if (isWindows) {
      cmd = quote(appPath)
    } else {
      cmd = appPath
    }
    return new Promise((resolve) => {
      exec(cmd, { encoding: 'utf-8' }, (error, _stdout, stderr) => {
        resolve(stderr || (error ? error.message : ''))
      })
    })
  },

  async openPath(targetPath: string): Promise<string> {
    return shell.openPath(targetPath)
  },
}

contextBridge.exposeInMainWorld('searchAll', api)

declare global {
  const searchAll: typeof api
}
