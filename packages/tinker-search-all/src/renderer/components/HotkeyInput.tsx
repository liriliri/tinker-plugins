import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import contain from 'licia/contain'
import isEmpty from 'licia/isEmpty'
import isMac from 'licia/isMac'
import now from 'licia/now'
import startWith from 'licia/startWith'
import className from 'licia/className'
import { tw } from '../theme'

const MODIFIER_CODES = [
  'MetaLeft',
  'MetaRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'ShiftLeft',
  'ShiftRight',
]

const CODE_TO_ACCELERATOR: Record<string, string> = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Space: 'Space',
  Enter: 'Return',
  Escape: 'Escape',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  CapsLock: 'Capslock',
  NumLock: 'Numlock',
  ScrollLock: 'Scrolllock',
  PrintScreen: 'PrintScreen',
  Numpad0: 'num0',
  Numpad1: 'num1',
  Numpad2: 'num2',
  Numpad3: 'num3',
  Numpad4: 'num4',
  Numpad5: 'num5',
  Numpad6: 'num6',
  Numpad7: 'num7',
  Numpad8: 'num8',
  Numpad9: 'num9',
  NumpadDecimal: 'numdec',
  NumpadAdd: 'numadd',
  NumpadSubtract: 'numsub',
  NumpadMultiply: 'nummult',
  NumpadDivide: 'numdiv',
  NumpadEnter: 'Return',
}

const DOUBLE_TAP_INTERVAL = 400

interface HotkeyInputProps {
  value: string
  onChange: (value: string) => void
}

function getModifierName(code: string): string {
  switch (code) {
    case 'MetaLeft':
    case 'MetaRight':
      return 'Command'
    case 'ControlLeft':
    case 'ControlRight':
      return 'Ctrl'
    case 'AltLeft':
    case 'AltRight':
      return isMac ? 'Option' : 'Alt'
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'Shift'
    default:
      return ''
  }
}

export default function HotkeyInput({ value, onChange }: HotkeyInputProps) {
  const { t } = useTranslation()
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])
  const confirmedRef = useRef(false)
  const mainKeyPressedRef = useRef(false)
  const lastModifierTapRef = useRef<{ modifier: string; time: number } | null>(
    null,
  )
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearDoubleTapTimer = useCallback(() => {
    if (doubleTapTimerRef.current) {
      clearTimeout(doubleTapTimerRef.current)
      doubleTapTimerRef.current = null
    }
  }, [])

  const stopRecording = useCallback(() => {
    const confirmed = confirmedRef.current
    confirmedRef.current = false
    setIsRecording(false)
    mainKeyPressedRef.current = false
    lastModifierTapRef.current = null
    clearDoubleTapTimer()
    setRecordedKeys([])
    if (!confirmed) onChange('')
  }, [clearDoubleTapTimer, onChange])

  const confirmHotkey = useCallback(
    (hotkey: string) => {
      confirmedRef.current = true
      onChange(hotkey)
      stopRecording()
    },
    [onChange, stopRecording],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const isModifierKey = contain(MODIFIER_CODES, e.code)
      const keys: string[] = []
      if (e.metaKey) keys.push('Command')
      if (e.ctrlKey) keys.push('Ctrl')
      if (e.altKey) keys.push(isMac ? 'Option' : 'Alt')
      if (e.shiftKey) keys.push('Shift')

      if (!isModifierKey) {
        mainKeyPressedRef.current = true
        clearDoubleTapTimer()
        lastModifierTapRef.current = null

        let mainKey = ''
        if (startWith(e.code, 'Key')) {
          mainKey = e.code.replace('Key', '')
        } else if (startWith(e.code, 'Digit')) {
          mainKey = e.code.replace('Digit', '')
        } else if (/^F([1-9]|1[0-2])$/.test(e.code)) {
          mainKey = e.code
        } else {
          mainKey = CODE_TO_ACCELERATOR[e.code] || ''
        }

        if (!mainKey) {
          mainKeyPressedRef.current = false
          stopRecording()
          return
        }

        keys.push(mainKey)
      }

      setRecordedKeys(keys)
    },
    [clearDoubleTapTimer, stopRecording],
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const isModifierKey = contain(MODIFIER_CODES, e.code)

      if (isModifierKey && !mainKeyPressedRef.current) {
        const modifier = getModifierName(e.code)
        if (!modifier) {
          stopRecording()
          return
        }

        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
          return
        }

        const time = now()
        if (
          lastModifierTapRef.current &&
          lastModifierTapRef.current.modifier === modifier &&
          time - lastModifierTapRef.current.time < DOUBLE_TAP_INTERVAL
        ) {
          clearDoubleTapTimer()
          confirmHotkey(`${modifier}+${modifier}`)
          return
        }

        lastModifierTapRef.current = { modifier, time }
        setRecordedKeys(['...'])
        clearDoubleTapTimer()
        doubleTapTimerRef.current = setTimeout(() => {
          lastModifierTapRef.current = null
          doubleTapTimerRef.current = null
          if (isRecording) setRecordedKeys([])
        }, DOUBLE_TAP_INTERVAL)
        return
      }

      if (recordedKeys.length > 1 && mainKeyPressedRef.current) {
        confirmHotkey(recordedKeys.join('+'))
        return
      }

      if (
        recordedKeys.length === 1 &&
        mainKeyPressedRef.current &&
        /^F([1-9]|1[0-2])$/.test(recordedKeys[0])
      ) {
        confirmHotkey(recordedKeys[0])
        return
      }

      stopRecording()
    },
    [
      recordedKeys,
      confirmHotkey,
      stopRecording,
      clearDoubleTapTimer,
      isRecording,
    ],
  )

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target?.closest('[data-hotkey-input]')) return
      stopRecording()
    },
    [stopRecording],
  )

  useEffect(() => {
    if (!isRecording) return
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isRecording, handleKeyDown, handleKeyUp, handleClickOutside])

  const displayText = isRecording
    ? !isEmpty(recordedKeys)
      ? recordedKeys.join('+')
      : t('recording')
    : value || t('recordHotkey')

  return (
    <button
      type="button"
      data-hotkey-input
      onClick={() => setIsRecording(true)}
      className={className(
        tw.hotkey.input,
        isRecording ? tw.hotkey.recording : tw.hotkey.idle,
      )}
    >
      {displayText}
    </button>
  )
}
