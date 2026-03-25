import { configure, InMemory } from '@zenfs/core'
import { IndexedDB } from '@zenfs/dom'
import EmscriptenPlugin from '@zenfs/emscripten/plugin'
import last from 'licia/last'
import trim from 'licia/trim'
import trigger from 'licia/trigger'

const { gameUrl, coreUrl } = window as any

let emModule: any
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
  // Ensure /home exists in Emscripten's FS before mounting
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

  emFs.writeFile(
    '/home/web_user/retroarch/userdata/retroarch.cfg',
    'menu_driver = "rgui"\naspect_ratio_index = "0"\nvideo_force_aspect = "true"\n',
  )
  emFs.writeFile(
    '/home/web_user/retroarch/userdata/retroarch-core-options.cfg',
    '',
  )

  fetch(gameUrl)
    .then((r) => r.arrayBuffer())
    .then((buffer) => {
      const name = getFileName(gameUrl)
      const data = new Uint8Array(buffer)
      const path = '/home/web_user/retroarch/userdata/' + name
      emFs.writeFile(path, data, { encoding: 'binary' })
      return path
    })
    .then((path) => {
      document.getElementById('loading')!.style.display = 'none'
      emModule.callMain(['-v', path])
      emModule.resumeMainLoop()
    })
}

function getFileName(url: string) {
  const ret = trim((last(url.split('/')) ?? 'game').split('?')[0])
  return ret || 'game'
}

const moduleConfig = {
  noInitialRun: true,
  arguments: ['-v', '--menu'],
  preRun: [] as any[],
  postRun: [] as any[],
  print: (text: string) => console.log(text),
  printErr: (text: string) => console.log(text),
  canvas: document.getElementById('canvas'),
  totalDependencies: 0,
  monitorRunDependencies(left: number) {
    this.totalDependencies = Math.max(this.totalDependencies, left)
  },
}

window.addEventListener('message', (e) => {
  const { type, code, keyCode } = e.data ?? {}
  if (type !== 'keydown' && type !== 'keyup') return
  const canvas = document.getElementById('canvas')
  const target = canvas ?? document
  trigger(target, type, { code, keyCode, which: keyCode, bubbles: true })
})

window.addEventListener('load', () => {
  window.focus()
  setupFs()
  import(/* @vite-ignore */ coreUrl)
    .then((m) => m.default(moduleConfig))
    .then((instance: any) => {
      emModule = instance
      moduleReady = true
      tryStart()
    })
})
