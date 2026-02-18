import { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import Toolbar from './components/Toolbar'
import TranslatePanel from './components/TranslatePanel'
import { languages, bingLanguages, type Service } from './lib/languages'

function App() {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('zh-CN')
  const [service, setService] = useState<Service>('google')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState('')

  const currentLanguages = service === 'bing' ? bingLanguages : languages

  const handleServiceChange = (newService: Service) => {
    setService(newService)

    if (newService === 'bing') {
      if (sourceLang === 'zh-CN') setSourceLang('zh-Hans')
      if (sourceLang === 'zh-TW') setSourceLang('zh-Hant')
      if (targetLang === 'zh-CN') setTargetLang('zh-Hans')
      if (targetLang === 'zh-TW') setTargetLang('zh-Hant')
    } else {
      if (sourceLang === 'zh-Hans') setSourceLang('zh-CN')
      if (sourceLang === 'zh-Hant') setSourceLang('zh-TW')
      if (targetLang === 'zh-Hans') setTargetLang('zh-CN')
      if (targetLang === 'zh-Hant') setTargetLang('zh-TW')
    }
  }

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter text to translate')
      return
    }

    setIsTranslating(true)
    setError('')
    setTranslatedText('')

    try {
      const result = await translate.translate(
        sourceText,
        sourceLang,
        targetLang,
        service,
      )
      setTranslatedText(result.text)
    } catch (err) {
      setError('Translation failed. Please try again.')
      console.error(err)
    } finally {
      setIsTranslating(false)
    }
  }

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }

  const handleClear = () => {
    setSourceText('')
    setTranslatedText('')
    setError('')
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="h-screen flex flex-col bg-white dark:bg-neutral-800 overflow-hidden">
        <Toolbar
          service={service}
          sourceLang={sourceLang}
          targetLang={targetLang}
          currentLanguages={currentLanguages}
          canSwap={sourceLang !== 'auto'}
          canClear={!!(sourceText || translatedText)}
          canTranslate={!isTranslating && !!sourceText.trim()}
          isTranslating={isTranslating}
          onServiceChange={handleServiceChange}
          onSourceLangChange={setSourceLang}
          onTargetLangChange={setTargetLang}
          onSwap={handleSwapLanguages}
          onClear={handleClear}
          onTranslate={handleTranslate}
        />
        <TranslatePanel
          sourceText={sourceText}
          translatedText={translatedText}
          isTranslating={isTranslating}
          error={error}
          onSourceTextChange={setSourceText}
        />
      </div>
    </Tooltip.Provider>
  )
}

export default App
