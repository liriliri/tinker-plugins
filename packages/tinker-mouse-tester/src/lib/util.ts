import i18n from 'i18next'
import has from 'licia/has'
import { MOUSE_BUTTON_KEYS } from '../types'

export function buttonName(button: number) {
  if (has(MOUSE_BUTTON_KEYS, String(button))) {
    return i18n.t(MOUSE_BUTTON_KEYS[button])
  }
  return i18n.t('buttonN', { n: button })
}
