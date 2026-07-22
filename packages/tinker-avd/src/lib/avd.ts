import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import childProcess from 'node:child_process'
import filter from 'licia/filter'
import endWith from 'licia/endWith'
import ini from 'licia/ini'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import fileSize from 'licia/fileSize'
import memoize from 'licia/memoize'
import isWindows from 'licia/isWindows'
import isMac from 'licia/isMac'
import isEmpty from 'licia/isEmpty'
import values from 'licia/values'
import map from 'licia/map'
import sleep from 'licia/sleep'
import delay from 'licia/delay'
import fsUtil from 'licia/fs'
import type { IAvd } from '../common/types'

let avds: Record<string, IAvd> = {}
let avdFolder = process.env.ANDROID_AVD_HOME || ''

function ensureAvdFolder() {
  if (!avdFolder || !fs.existsSync(avdFolder)) {
    avdFolder = path.resolve(os.homedir(), '.android', 'avd')
  }
}

async function parseAvdInfo(file: string): Promise<IAvd> {
  const p = path.resolve(avdFolder, file)
  const content = await fsp.readFile(p, 'utf-8')
  const metadata = ini.parse(content)
  const folder = metadata['path'] as string
  const configPath = path.resolve(folder, 'config.ini')
  if (!(await fsUtil.exists(configPath))) {
    throw new Error(`Config file not found: ${configPath}`)
  }
  const config = await fsp.readFile(configPath, 'utf-8')
  const properties = ini.parse(config)
  const id = (properties['AvdId'] as string) || path.basename(file, '.ini')
  const name = (properties['avd.ini.displayname'] as string) || id

  return {
    id,
    name,
    abi: (properties['abi.type'] as string) || '',
    sdkVersion: toStr(metadata['target'] || '').replace('android-', ''),
    memory: toNum(properties['hw.ramSize']),
    internalStorage: fileSize(
      toStr(properties['disk.dataPartition.size'] || '0'),
    ),
    resolution: `${properties['hw.lcd.width'] || '?'}x${properties['hw.lcd.height'] || '?'}`,
    folder,
    pid: 0,
  }
}

async function getAvdPid(folder: string) {
  let file = path.resolve(folder, 'hardware-qemu.ini.lock')
  if (!(await fsUtil.exists(file))) {
    return 0
  }

  const stat = await fsp.stat(file)
  if (!stat.isFile()) {
    file = path.resolve(file, 'pid')
  }
  try {
    const content = await fsp.readFile(file, 'utf-8')
    return parseInt(content, 10) || 0
  } catch {
    return 0
  }
}

async function reloadAvds() {
  ensureAvdFolder()
  avds = {}

  if (!(await fsUtil.exists(avdFolder))) {
    return
  }

  const files = await fsp.readdir(avdFolder)
  const iniFiles = filter(files, (file) => endWith(file, '.ini'))
  await Promise.all(
    map(iniFiles, async (file) => {
      try {
        const avdInfo = await parseAvdInfo(file)
        avds[avdInfo.id] = avdInfo
      } catch {
        // skip invalid AVD entries
      }
    }),
  )
}

export async function getAvds(forceRefresh = false): Promise<IAvd[]> {
  if (forceRefresh || isEmpty(avds)) {
    await reloadAvds()
  }

  return Promise.all(
    map(values(avds), async (avd) => {
      avd.pid = await getAvdPid(avd.folder)
      return { ...avd }
    }),
  )
}

const getEmulatorPath = memoize(function () {
  let androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
  if (!androidHome) {
    if (isWindows) {
      androidHome = path.resolve(process.env.LOCALAPPDATA || '', 'Android/Sdk')
    } else if (isMac) {
      androidHome = path.resolve(os.homedir(), 'Library/Android/sdk')
    } else {
      androidHome = path.resolve(os.homedir(), 'Android/Sdk')
    }
  }

  if (androidHome && fs.existsSync(androidHome)) {
    return path.resolve(
      androidHome,
      `emulator/emulator${isWindows ? '.exe' : ''}`,
    )
  }

  return 'emulator'
})

export async function startAvd(avdId: string) {
  const cp = childProcess.spawn(getEmulatorPath(), [`@${avdId}`], {
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
    shell: isWindows,
  })
  cp.unref()
}

export async function stopAvd(avdId: string) {
  const avd = avds[avdId]
  if (!avd || !avd.pid) {
    return
  }
  try {
    process.kill(avd.pid)
  } catch {
    // process may already have exited
  }
  delay(async () => {
    const pidPath = path.resolve(avd.folder, 'hardware-qemu.ini.lock')
    if (await fsUtil.exists(pidPath)) {
      await fsp.rm(pidPath, { recursive: true, force: true })
    }
  }, 500)
}

export async function wipeAvdData(avdId: string) {
  const avd = avds[avdId]
  if (!avd) {
    return
  }
  if (avd.pid) {
    await stopAvd(avdId)
    await sleep(1000)
  }
  const removed = [
    path.resolve(avd.folder, 'snapshots'),
    path.resolve(avd.folder, 'userdata-qemu.img'),
  ]
  await Promise.all(
    map(removed, (item) => fsp.rm(item, { recursive: true, force: true })),
  )
}
