import { useRef, useEffect, useCallback, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Languages } from 'lucide-react'
import each from 'licia/each'
import times from 'licia/times'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const TextDisplay = observer(() => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isComposingRef = useRef(false)
  const inputValueRef = useRef('')

  const { normalizedDisplay, normalizedTyped, status } = store
  const typedLen = normalizedTyped.length
  const chars = store.chars

  const wordData = useMemo(() => {
    const words: { chars: string[]; startIndex: number }[] = []
    let currentWord: string[] = []
    let startIndex = 0

    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === ' ') {
        if (currentWord.length > 0) {
          words.push({ chars: currentWord, startIndex })
          currentWord = []
        }
        words.push({ chars: [' '], startIndex: i })
        startIndex = i + 1
      } else {
        if (currentWord.length === 0) {
          startIndex = i
        }
        currentWord.push(chars[i])
      }
    }
    if (currentWord.length > 0) {
      words.push({ chars: currentWord, startIndex })
    }
    return words
  }, [chars])

  const wordSpanRefs = useRef<(HTMLSpanElement | null)[]>([])
  const wordsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inputRef.current && status !== 'finished') {
      inputRef.current.focus()
    }
  }, [status])

  useEffect(() => {
    if (!containerRef.current || !wordsRef.current) return
    const wordsEl = wordsRef.current
    const caretEl = wordsEl.querySelector(
      '.caret-char-left, .caret-char-left-start',
    ) as HTMLElement
    if (!caretEl) return

    const wordsRect = wordsEl.getBoundingClientRect()
    const caretRect = caretEl.getBoundingClientRect()

    const caretTopInWords = caretRect.top - wordsRect.top
    const lineHeight =
      parseFloat(getComputedStyle(containerRef.current).lineHeight) || 56
    const currentRow = Math.floor(caretTopInWords / lineHeight)

    if (currentRow >= 2) {
      const offset = (currentRow - 1) * lineHeight
      wordsEl.style.transform = `translateY(-${offset}px)`
    } else {
      wordsEl.style.transform = 'translateY(0)'
    }
  }, [typedLen])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isComposingRef.current) return
      if (store.status === 'finished') return

      const newValue = e.target.value
      const oldValue = inputValueRef.current
      if (newValue === '' && oldValue === '') return

      if (newValue.length > oldValue.length) {
        each(newValue.slice(oldValue.length), (char) => {
          store.handleInput(char)
        })
      } else if (newValue.length < oldValue.length) {
        times(oldValue.length - newValue.length, () => {
          store.handleBackspace()
        })
      }

      inputValueRef.current = ''
      e.target.value = ''
    },
    [],
  )

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
    if (store.status === 'idle') {
      store.startTest()
    }
  }, [])

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false
      if (store.status === 'finished') return

      if (e.data) {
        each(e.data, (char) => {
          store.handleInput(char)
        })
      }

      const target = e.target as HTMLInputElement
      target.value = ''
      inputValueRef.current = ''
    },
    [],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isComposingRef.current) {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          // allow
        } else {
          return
        }
      }
      if (store.status === 'finished') return

      if (e.key === 'Backspace') {
        e.preventDefault()
        store.handleBackspace()
        const target = e.target as HTMLInputElement
        target.value = ''
        inputValueRef.current = ''
      }
    },
    [],
  )

  const isIdle = status === 'idle'
  const isFinished = status === 'finished'

  return (
    <div
      className="relative flex flex-col justify-center max-w-4xl mx-auto w-full"
      onClick={() => inputRef.current?.focus()}
    >
      <div
        className={className(
          'hint-text text-sm mb-3 text-center tracking-wide',
          isIdle ? tw.text.hint : 'invisible',
        )}
      >
        {t('startTyping')}
      </div>

      <input
        ref={inputRef}
        type="text"
        aria-label="Typing Input"
        className="absolute opacity-0 pointer-events-auto"
        style={{ width: '1px', height: '1px', top: 0, left: 0 }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={handleInputChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
      />

      <div
        ref={containerRef}
        className="type-box select-none cursor-text overflow-hidden"
      >
        <div ref={wordsRef} className="words">
          {wordData.map((word, wi) => {
            const isSpace = word.chars.length === 1 && word.chars[0] === ' '
            const getCharClass = (gi: number) => {
              if (gi < typedLen) {
                return normalizedTyped[gi] === normalizedDisplay[gi]
                  ? 'char correct-char'
                  : 'char error-char'
              }
              if (gi === typedLen && !isFinished) {
                return isIdle
                  ? 'char caret-char-left-start'
                  : 'char caret-char-left'
              }
              return 'char'
            }

            if (isSpace) {
              const gi = word.startIndex
              return (
                <span key={`s${gi}`} className={getCharClass(gi)}>
                  {' '}
                </span>
              )
            }

            return (
              <span
                key={`w${wi}`}
                ref={(el) => {
                  wordSpanRefs.current[wi] = el
                }}
                className="word"
              >
                {word.chars.map((char, ci) => {
                  const gi = word.startIndex + ci
                  return (
                    <span key={gi} className={getCharClass(gi)}>
                      {char}
                    </span>
                  )
                })}
              </span>
            )
          })}
        </div>
      </div>

      <div
        className={className('flex justify-center items-center gap-3 mt-8', {
          invisible: !isIdle,
        })}
      >
        <button
          className="new-article-btn"
          title={t('newArticle')}
          onClick={(e) => {
            e.stopPropagation()
            store.initTest()
          }}
        >
          <RefreshCw size={16} />
        </button>
        <button
          className="lang-toggle-btn"
          onClick={(e) => {
            e.stopPropagation()
            store.setLanguage(store.isEnglish ? 'zh-CN' : 'en-US')
          }}
        >
          <Languages size={16} />
        </button>
      </div>
    </div>
  )
})

export default TextDisplay
