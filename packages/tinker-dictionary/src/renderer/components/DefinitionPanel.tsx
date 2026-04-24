import { observer } from 'mobx-react-lite'
import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Search } from 'lucide-react'
import { tw } from '../theme'
import store from '../store'
// @ts-ignore – raw import of UMD bundle
import drScript from 'darkreader/darkreader.js?raw'

const baseStyles = `
  body {
    margin: 0;
    font-family: 'IBM Plex Serif', Georgia, serif;
    font-size: 15px;
    line-height: 1.65;
    padding: 16px 20px;
    color: #27272a;
  }
  img { max-width: 100%; height: auto; }
  a { color: #18181b; text-decoration: underline; text-underline-offset: 2px; text-decoration-color: rgba(0,0,0,0.2); }
  a:hover { text-decoration-color: rgba(0,0,0,0.5); }
  h1, h2, h3, h4, h5, h6 { font-family: 'IBM Plex Sans', sans-serif; font-weight: 600; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 0; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.24); }
  @media (prefers-color-scheme: dark) {
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  }
`

const clickScript = `
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.startsWith('entry://')) {
      e.preventDefault();
      var word = href.slice(8).split('#')[0];
      window.parent.postMessage({ type: 'entry-jump', word: decodeURIComponent(word) }, '*');
    } else if (href.startsWith('sound://') || href.startsWith('http')) {
      e.preventDefault();
    }
  });
`

const resizeScript = `
  var ro = new ResizeObserver(function() {
    var h = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'iframe-resize', height: h }, '*');
  });
  ro.observe(document.body);
`

const darkScript = `DarkReader.enable({ brightness: 100, contrast: 90, sepia: 0 });`

function buildSrcdoc(
  definition: string,
  isDark: boolean,
  extraCss?: string,
  autoHeight?: boolean,
): string {
  const overflowStyle = autoHeight ? 'overflow: hidden;' : ''
  return `<!DOCTYPE html>
<html style="${autoHeight ? 'overflow: hidden;' : ''}">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>${baseStyles}${overflowStyle ? `\nbody { ${overflowStyle} }` : ''}</style>
${extraCss ? `<style>${extraCss}</style>` : ''}
${isDark ? `<script>${drScript}<\/script>` : ''}
</head>
<body>
${definition}
<script>${clickScript}<\/script>
${autoHeight ? `<script>${resizeScript}<\/script>` : ''}
${isDark ? `<script>${darkScript}<\/script>` : ''}
</body>
</html>`
}

interface IframeDefinitionProps {
  definition: string
  extraCss?: string
  autoHeight?: boolean
}

const IframeDefinition = observer(function IframeDefinition({
  definition,
  extraCss,
  autoHeight,
}: IframeDefinitionProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!autoHeight) return
    const handleMessage = (e: MessageEvent) => {
      if (
        e.data?.type === 'iframe-resize' &&
        e.source === iframeRef.current?.contentWindow
      ) {
        setHeight(e.data.height)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [autoHeight])

  const srcdoc = useMemo(
    () => buildSrcdoc(definition, store.isDark, extraCss, autoHeight),
    [definition, store.isDark, extraCss, autoHeight],
  )

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      style={{
        border: 'none',
        width: '100%',
        height: autoHeight && height > 0 ? height : '100%',
        display: 'block',
      }}
      className={autoHeight ? '' : 'flex-1 min-h-0'}
    />
  )
})

const DefinitionPanel = observer(() => {
  const { t } = useTranslation()

  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.data?.type === 'entry-jump' && e.data.word) {
      store.handleEntryJump(e.data.word)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  if (!store.hasDictionary) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center gap-3 ${tw.text.muted}`}
      >
        <BookOpen className="w-10 h-10" strokeWidth={1} />
        <div className="text-center">
          <p className={`text-[13px] font-medium ${tw.text.secondary}`}>
            {t('noDictionary')}
          </p>
          <p className="text-[11px] mt-1">{t('noDictionaryHint')}</p>
        </div>
      </div>
    )
  }

  if (store.definitions.length === 0) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${tw.text.muted}`}
      >
        <p className="text-[13px] italic">
          {store.searchText ? t('noResults') : t('searchPlaceholder')}
        </p>
      </div>
    )
  }

  if (store.definitions.length === 1) {
    return (
      <IframeDefinition
        definition={store.definitions[0].definition}
        extraCss={store.definitions[0].extraCss}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {store.definitions.map((entry, idx) => (
        <div key={`${entry.dictPath}-${idx}`}>
          <div
            className={`sticky top-0 z-10 px-5 py-1.5 text-[11px] font-medium tracking-wider uppercase ${tw.text.secondary} ${tw.background.toolbar} border-b ${tw.border.divider}`}
          >
            {entry.dictTitle}
          </div>
          <IframeDefinition
            definition={entry.definition}
            extraCss={entry.extraCss}
            autoHeight
          />
        </div>
      ))}
    </div>
  )
})

export default DefinitionPanel
