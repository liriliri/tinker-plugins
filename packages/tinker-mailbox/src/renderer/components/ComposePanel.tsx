import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import store from '../store'
import { tw } from '../theme'
import ComposeEditor, { type ComposeEditorHandle } from './ComposeEditor'

const ComposePanel = observer(() => {
  const { t } = useTranslation()
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState('')
  const [editorKey, setEditorKey] = useState(0)
  const editorRef = useRef<ComposeEditorHandle>(null)

  useEffect(() => {
    if (!store.showCompose) return
    setTo('')
    setCc('')
    setSubject('')
    setEditorKey((k) => k + 1)
  }, [store.showCompose])

  const onCancel = () => {
    store.closeCompose()
  }

  const onSend = async () => {
    if (isStrBlank(to)) return
    await store.send({
      to: trim(to),
      cc: trim(cc) || undefined,
      subject: trim(subject),
      text: editorRef.current?.getText() ?? '',
      html: editorRef.current?.getHtml() ?? '',
    })
  }

  if (!store.showCompose) return null

  return (
    <section className={`flex-1 min-w-0 flex flex-col ${tw.background.rail}`}>
      <header className={tw.shell.composeBar}>
        <input
          className={`${tw.input.compose} flex-1 min-w-0 !text-lg font-semibold`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t('subject')}
        />
        <button
          type="button"
          className={tw.button.secondary}
          onClick={onCancel}
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          className={tw.button.primary}
          disabled={store.sending || isStrBlank(to)}
          onClick={onSend}
        >
          {store.sending ? t('loading') : t('send')}
        </button>
      </header>

      <div
        className={`flex-1 min-h-0 flex flex-col gap-3 p-4 overflow-hidden ${tw.background.rail}`}
      >
        <div className={`${tw.shell.composeSection} shrink-0`}>
          <label className={tw.shell.composeField}>
            <span className={tw.labelInline}>{t('to')}</span>
            <input
              className={tw.input.compose}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              autoFocus
            />
          </label>
          <label className={tw.shell.composeField}>
            <span className={tw.labelInline}>{t('cc')}</span>
            <input
              className={tw.input.compose}
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </label>
        </div>

        <div
          className={`${tw.shell.composeSection} flex flex-col flex-1 min-h-0`}
        >
          <ComposeEditor
            key={editorKey}
            ref={editorRef}
            placeholder={t('body')}
          />
        </div>
      </div>
    </section>
  )
})

export default ComposePanel
