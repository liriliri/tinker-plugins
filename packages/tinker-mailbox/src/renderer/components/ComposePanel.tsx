import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import store from '../store'
import { tw } from '../theme'
import Field from './Field'

const ComposePanel = observer(() => {
  const { t } = useTranslation()
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')

  useEffect(() => {
    if (!store.showCompose) return
    setTo('')
    setCc('')
    setSubject('')
    setText('')
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
      text,
    })
  }

  if (!store.showCompose) return null

  return (
    <section
      className={`flex-1 min-w-0 flex flex-col ${tw.background.muted} animate-fade-up`}
    >
      <header
        className={`px-6 py-4 border-b ${tw.border.divider} ${tw.background.panel} flex items-center gap-3`}
      >
        <div className={tw.accentBar} aria-hidden />
        <h1 className={`text-lg font-semibold flex-1 ${tw.text.display}`}>
          {t('newMessage')}
        </h1>
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
        className={`flex-1 overflow-y-auto px-6 py-5 space-y-3 ${tw.background.panel}`}
      >
        <Field label={t('to')}>
          <input
            className={tw.input.base}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label={t('cc')}>
          <input
            className={tw.input.base}
            value={cc}
            onChange={(e) => setCc(e.target.value)}
          />
        </Field>
        <Field label={t('subject')}>
          <input
            className={tw.input.base}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Field>
        <label className="flex flex-col flex-1 min-h-0">
          <span className={tw.label}>{t('body')}</span>
          <textarea
            className={`${tw.input.textarea} flex-1 min-h-[280px]`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
      </div>
    </section>
  )
})

export default ComposePanel
