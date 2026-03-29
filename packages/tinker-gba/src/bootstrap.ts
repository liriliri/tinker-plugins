import { configure, InMemory } from '@zenfs/core'
import { IndexedDB } from '@zenfs/dom'
import EmscriptenPlugin from '@zenfs/emscripten/plugin'
import trigger from 'licia/trigger'

const RETROARCH_CFG = `menu_driver = "rgui"
aspect_ratio_index = "0"
video_force_aspect = "true"
input_joypad_driver = "null"
input_player1_up = "up"
input_player1_down = "down"
input_player1_left = "left"
input_player1_right = "right"
input_player1_a = "x"
input_player1_b = "z"
input_player1_l = "q"
input_player1_r = "w"
input_player1_start = "enter"
input_player1_select = "rshift"
savestate_file_compression = false
`

interface EmWindow extends Window {
  gameUrl: string
  gameName: string
  coreUrl: string
}

interface EmModule {
  FS: typeof FS
  callMain: (args: string[]) => void
  resumeMainLoop: () => void
}

const { gameUrl, gameName, coreUrl } = window as unknown as EmWindow

let emModule: EmModule
let fsReady = false
let moduleReady = false

async function setupFs() {
  try {
    await configure({
      mounts: {
        '/home/web_user/retroarch/userdata': {
          backend: IndexedDB,
          storeName: 'RetroArch',
        },
      },
    })
  } catch {
    await configure({
      mounts: {
        '/home/web_user/retroarch/userdata': InMemory,
      },
    })
  }
  fsReady = true
  tryStart()
}

function mountToEmscripten() {
  const emFs = emModule.FS
  try {
    emFs.mkdir('/home')
  } catch {
    // already exists
  }
  const plugin = new EmscriptenPlugin(undefined, emFs)
  emFs.mount(plugin, { root: '/home' }, '/home')
}

function tryStart() {
  if (!fsReady || !moduleReady) return

  mountToEmscripten()

  const emFs = emModule.FS

  emFs.mkdirTree('/home/web_user/.config/retroarch')
  emFs.mkdirTree('/home/web_user/retroarch/userdata/states')
  emFs.mkdirTree('/home/web_user/retroarch/userdata/saves')
  emFs.writeFile(
    '/home/web_user/.config/retroarch/retroarch.cfg',
    RETROARCH_CFG,
  )
  emFs.writeFile(
    '/home/web_user/retroarch/userdata/retroarch-core-options.cfg',
    '',
  )

  fetch(gameUrl)
    .then((r) => r.arrayBuffer())
    .then((buffer) => {
      const data = new Uint8Array(buffer)
      const path = '/home/web_user/retroarch/userdata/' + (gameName || 'game')
      emFs.writeFile(path, data, { encoding: 'binary' })
      return path
    })
    .then((path) => {
      document.getElementById('loading')!.style.display = 'none'
      emModule.callMain(['-v', path])
      emModule.resumeMainLoop()
    })
}

const moduleConfig = {
  noInitialRun: true,
  arguments: ['-v', '--menu'],
  preRun: [] as Array<() => void>,
  postRun: [] as Array<() => void>,
  print: (text: string) => console.log(text),
  printErr: (text: string) => console.log(text),
  canvas: document.getElementById('canvas'),
  totalDependencies: 0,
  monitorRunDependencies(left: number) {
    this.totalDependencies = Math.max(this.totalDependencies, left)
  },
}

const canvasEl = document.getElementById('canvas')

window.addEventListener('message', (e) => {
  const { type, code, keyCode } = e.data ?? {}
  if (type !== 'keydown' && type !== 'keyup') return
  const target = canvasEl ?? document
  trigger(target, type, { code, keyCode, which: keyCode, bubbles: true })
})

window.addEventListener('load', () => {
  window.focus()
  setupFs()
  import(/* @vite-ignore */ coreUrl)
    .then((m) => m.default(moduleConfig))
    .then((instance: EmModule) => {
      emModule = instance
      moduleReady = true
      tryStart()
    })
})
