import { N64Button, PlayerKeymap, codeToKeyCode } from './keymap'

export function findKeyBinding(
  inputCode: string,
  km: PlayerKeymap,
): { btn: N64Button; code: string; keyCode: number } | null {
  for (const btn of Object.keys(km) as N64Button[]) {
    if (km[btn].keyboard === inputCode) {
      return { btn, code: inputCode, keyCode: codeToKeyCode(inputCode) }
    }
  }
  return null
}

export function postKey(
  win: Window,
  type: string,
  code: string,
  keyCode: number,
) {
  win.postMessage({ type, code, keyCode }, '*')
}

export function postAction(win: Window, type: string, data?: object) {
  win.postMessage({ type, ...data }, '*')
}

export { codeToKeyCode }
