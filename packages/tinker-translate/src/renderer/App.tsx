import { useState } from 'react'
import className from 'licia/className'

const languages = [
  { code: 'auto', name: 'Auto Detect', name_cn: '自动检测' },
  { code: 'en', name: 'English', name_cn: '英语' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', name_cn: '简体中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', name_cn: '繁体中文' },
  { code: 'ja', name: 'Japanese', name_cn: '日语' },
  { code: 'ko', name: 'Korean', name_cn: '韩语' },
  { code: 'fr', name: 'French', name_cn: '法语' },
  { code: 'es', name: 'Spanish', name_cn: '西班牙语' },
  { code: 'ru', name: 'Russian', name_cn: '俄语' },
  { code: 'de', name: 'German', name_cn: '德语' },
  { code: 'it', name: 'Italian', name_cn: '意大利语' },
  { code: 'pt', name: 'Portuguese', name_cn: '葡萄牙语' },
  { code: 'ar', name: 'Arabic', name_cn: '阿拉伯语' },
  { code: 'hi', name: 'Hindi', name_cn: '印地语' },
  { code: 'th', name: 'Thai', name_cn: '泰语' },
  { code: 'vi', name: 'Vietnamese', name_cn: '越南语' },
]

const bingLanguages = [
  { code: 'auto', name: 'Auto Detect', name_cn: '自动检测' },
  { code: 'en', name: 'English', name_cn: '英语' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)', name_cn: '简体中文' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', name_cn: '繁体中文' },
  { code: 'ja', name: 'Japanese', name_cn: '日语' },
  { code: 'ko', name: 'Korean', name_cn: '韩语' },
  { code: 'fr', name: 'French', name_cn: '法语' },
  { code: 'es', name: 'Spanish', name_cn: '西班牙语' },
  { code: 'ru', name: 'Russian', name_cn: '俄语' },
  { code: 'de', name: 'German', name_cn: '德语' },
  { code: 'it', name: 'Italian', name_cn: '意大利语' },
  { code: 'pt', name: 'Portuguese', name_cn: '葡萄牙语' },
  { code: 'ar', name: 'Arabic', name_cn: '阿拉伯语' },
  { code: 'hi', name: 'Hindi', name_cn: '印地语' },
  { code: 'th', name: 'Thai', name_cn: '泰语' },
  { code: 'vi', name: 'Vietnamese', name_cn: '越南语' },
]

const services = [
  { value: 'google', label: 'Google Translate' },
  { value: 'bing', label: 'Bing Translate' },
]

function App() {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('zh-CN')
  const [service, setService] = useState<'google' | 'bing'>('google')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState('')

  const currentLanguages = service === 'bing' ? bingLanguages : languages

  const handleServiceChange = (newService: 'google' | 'bing') => {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Translate
          </h1>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Translation Service
            </label>
            <div className="flex gap-2">
              {services.map((s) => (
                <button
                  key={s.value}
                  onClick={() =>
                    handleServiceChange(s.value as 'google' | 'bing')
                  }
                  className={className(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    service === s.value
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currentLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name_cn}
                </option>
              ))}
            </select>

            <button
              onClick={handleSwapLanguages}
              disabled={sourceLang === 'auto'}
              className={className(
                'px-3 py-2 rounded-md transition-colors',
                sourceLang === 'auto'
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
              )}
              title="Swap languages"
            >
              ⇄
            </button>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currentLanguages
                .filter((lang) => lang.code !== 'auto')
                .map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name_cn}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <div className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 overflow-y-auto">
                {isTranslating ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500 dark:text-gray-400">
                      Translating...
                    </div>
                  </div>
                ) : translatedText ? (
                  <div className="whitespace-pre-wrap">{translatedText}</div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500">
                    Translation will appear here...
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className={className(
                'px-6 py-2 rounded-md font-medium transition-colors',
                isTranslating || !sourceText.trim()
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
              )}
            >
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>

            <button
              onClick={handleClear}
              disabled={!sourceText && !translatedText}
              className={className(
                'px-6 py-2 rounded-md font-medium transition-colors',
                !sourceText && !translatedText
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700',
              )}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Powered by {service === 'google' ? 'Google' : 'Bing'} Translate
        </div>
      </div>
    </div>
  )
}

export default App
