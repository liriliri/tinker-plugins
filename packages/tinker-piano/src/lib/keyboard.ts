import each from 'licia/each'
import values from 'licia/values'

interface KeyBinding {
  offset: number
  label: string
}

export const KEY_BINDINGS: Record<string, KeyBinding> = {
  KeyZ: { offset: 0, label: 'Z' },
  KeyS: { offset: 1, label: 'S' },
  KeyX: { offset: 2, label: 'X' },
  KeyD: { offset: 3, label: 'D' },
  KeyC: { offset: 4, label: 'C' },
  KeyV: { offset: 5, label: 'V' },
  KeyG: { offset: 6, label: 'G' },
  KeyB: { offset: 7, label: 'B' },
  KeyH: { offset: 8, label: 'H' },
  KeyN: { offset: 9, label: 'N' },
  KeyJ: { offset: 10, label: 'J' },
  KeyM: { offset: 11, label: 'M' },
  KeyQ: { offset: 12, label: 'Q' },
  Digit2: { offset: 13, label: '2' },
  KeyW: { offset: 14, label: 'W' },
  Digit3: { offset: 15, label: '3' },
  KeyE: { offset: 16, label: 'E' },
  KeyR: { offset: 17, label: 'R' },
  Digit5: { offset: 18, label: '5' },
  KeyT: { offset: 19, label: 'T' },
  Digit6: { offset: 20, label: '6' },
  KeyY: { offset: 21, label: 'Y' },
  Digit7: { offset: 22, label: '7' },
  KeyU: { offset: 23, label: 'U' },
  KeyI: { offset: 24, label: 'I' },
  Digit9: { offset: 25, label: '9' },
  KeyO: { offset: 26, label: 'O' },
  Digit0: { offset: 27, label: '0' },
  KeyP: { offset: 28, label: 'P' },
  BracketLeft: { offset: 29, label: '[' },
  Equal: { offset: 30, label: '=' },
  BracketRight: { offset: 31, label: ']' },
}

export const KEY_LABEL_BY_OFFSET = new Map<number, string>()
each(values(KEY_BINDINGS), ({ offset, label }) => {
  if (!KEY_LABEL_BY_OFFSET.has(offset)) {
    KEY_LABEL_BY_OFFSET.set(offset, label)
  }
})

export const MIN_START_OCTAVE = 1
/** C8 ceiling so start=1 + 7 octaves covers C1–C8. */
export const MAX_END_OCTAVE = 8
export const FULL_VISIBLE_OCTAVES = 7
/** Shrink visible range before white keys get narrower than this. */
export const MIN_WHITE_KEY_PX = 28
