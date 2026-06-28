import { buildConfigTxt } from './lib/n64Config'
import type { PlayerKeymap } from './lib/keymap'
import trigger from 'licia/trigger'

const AUDIO_BUFF_SIZE = 1024
const DB_NAME = 'tinker-n64-states'
const DB_STORE = 'states'

interface N64Module {
  canvas: HTMLCanvasElement
  callMain: (args: string[]) => void
  HEAP16: Int16Array
  _neil_serialize: () => void
  _neil_unserialize: () => void
  _neil_reset: () => void
  _neilGetSoundBufferResampledAddress: () => number
  _neilGetAudioWritePosition: () => number
  _runMainLoop: () => void
}

interface BootstrapWindow {
  gameUrl: string
  gameName: string
  baseUrl: string
  keymapJson: string
  myApp: {
    rivetsData: { inputController: { updateMobileControls: () => void } }
    localCallback: () => void
    SaveStateEvent: () => void
  }
}

declare global {
  interface Window {
    Module: Partial<N64Module> & {
      onRuntimeInitialized?: () => void
      print?: (text: string) => void
      locateFile?: (path: string) => string
    }
  }
}

const { gameUrl, gameName, baseUrl, keymapJson } =
  window as unknown as BootstrapWindow

const keymap: PlayerKeymap = JSON.parse(keymapJson)
let emModule: N64Module | null = null
let romName = gameName || 'game.n64'
let gainNode: GainNode | null = null
let emulatorStarted = false
let gameLoopId: number | null = null

function startGameLoop() {
  if (gameLoopId !== null) return
  const tick = () => {
    if (emModule && emulatorStarted) {
      emModule._runMainLoop()
    }
    gameLoopId = requestAnimationFrame(tick)
  }
  gameLoopId = requestAnimationFrame(tick)
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(DB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function dbGet(key: string): Promise<Uint8Array | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly')
    const req = tx.objectStore(DB_STORE).get(key)
    req.onsuccess = () => resolve((req.result as Uint8Array) ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function dbPut(key: string, data: Uint8Array) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).put(data, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadSram() {
  const data = await dbGet(`${romName}.sram`)
  if (data) FS.writeFile('/game.savememory', data)
}

function saveSram() {
  if (!emModule) return
  try {
    const data = FS.readFile('/game.savememory')
    dbPut(`${romName}.sram`, data)
  } catch {
    // no sram yet
  }
}

function initAudio(mod: N64Module) {
  const audioContext = new AudioContext({
    latencyHint: 'interactive',
    sampleRate: 44100,
  })
  gainNode = audioContext.createGain()
  gainNode.gain.value = 0.5
  gainNode.connect(audioContext.destination)

  const audioBuffer = new Int16Array(
    mod.HEAP16.buffer,
    mod._neilGetSoundBufferResampledAddress(),
    64000,
  )
  let writePos = 0
  let readPos = 0

  const pcm = audioContext.createScriptProcessor(AUDIO_BUFF_SIZE, 2, 2)
  pcm.onaudioprocess = (e) => {
    writePos = mod._neilGetAudioWritePosition()
    const outL = e.outputBuffer.getChannelData(0)
    const outR = e.outputBuffer.getChannelData(1)
    for (let i = 0; i < AUDIO_BUFF_SIZE; i++) {
      if (writePos !== readPos) {
        outL[i] = audioBuffer[readPos] / 32768
        outR[i] = audioBuffer[readPos + 1] / 32768
        readPos += 2
        if (readPos === 64000) readPos = 0
      } else {
        outL[i] = 0
        outR[i] = 0
      }
    }
  }
  pcm.connect(gainNode)
}

async function loadEmulator(romData: Uint8Array) {
  const mod = emModule!
  const assetsResp = await fetch(`${baseUrl}assets.zip`)
  FS.writeFile('assets.zip', new Uint8Array(await assetsResp.arrayBuffer()))
  FS.writeFile('custom.v64', romData)
  FS.writeFile('config.txt', buildConfigTxt(keymap))
  FS.writeFile('cheat.txt', '')

  initAudio(mod)
  await loadSram()
  mod.callMain(['custom.v64'])
  emulatorStarted = true
  startGameLoop()

  document.getElementById('loading')!.style.display = 'none'
}

function dispatchKey(type: 'keydown' | 'keyup', code: string, keyCode: number) {
  const target = document.getElementById('canvas') ?? document
  trigger(target, type, { code, keyCode, which: keyCode, bubbles: true })
}

function saveState() {
  if (!emModule) return
  emModule._neil_serialize()
}

async function onSaveStateEvent() {
  try {
    const data = FS.readFile('/savestate.gz')
    await dbPut(romName, data)
  } catch (err) {
    console.error('save state failed', err)
  }
}

async function loadState() {
  if (!emModule) return
  const data = await dbGet(romName)
  if (!data) return
  try {
    FS.writeFile('/savestate.gz', data)
    emModule._neil_unserialize()
  } catch (err) {
    console.error('load state failed', err)
  }
}

;(window as unknown as BootstrapWindow).myApp = {
  rivetsData: { inputController: { updateMobileControls: () => {} } },
  localCallback: () => {},
  SaveStateEvent: () => {
    void onSaveStateEvent()
  },
}

window.addEventListener('message', (e) => {
  const { type, code, keyCode } = e.data ?? {}
  if (type === 'keydown' || type === 'keyup') {
    dispatchKey(type, code, keyCode)
    return
  }
  if (type === 'reset') {
    emModule?._neil_reset()
    return
  }
  if (type === 'saveState') {
    saveState()
    return
  }
  if (type === 'loadState') {
    loadState()
    return
  }
  if (type === 'mute') {
    if (gainNode) gainNode.gain.value = e.data.muted ? 0 : 0.5
  }
})

window.addEventListener('load', async () => {
  window.focus()
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  canvas.width = 640
  canvas.height = 480

  window.Module = {
    canvas,
    locateFile: (path) => `${baseUrl}${path}`,
    print: (text) => {
      if (text.includes('writing game.savememory')) {
        setTimeout(saveSram, 100)
      }
    },
    onRuntimeInitialized: () => {
      emModule = window.Module as N64Module
      fetch(gameUrl)
        .then((resp) => resp.arrayBuffer())
        .then((buffer) => loadEmulator(new Uint8Array(buffer)))
        .catch((err) => {
          console.error(err)
          const loading = document.getElementById('loading')
          if (loading) loading.textContent = 'FAILED TO LOAD'
        })
    },
  }

  await loadScript(`${baseUrl}n64wasm.js`)
})
