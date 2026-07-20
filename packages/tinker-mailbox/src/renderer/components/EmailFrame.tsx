import { useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import isStr from 'licia/isStr'
import drScript from 'darkreader/darkreader.js?raw'
import store from '../store'
import { tw } from '../theme'

interface EmailFrameProps {
  html: string
  title: string
}

const LIGHT_BG_HEXES = [
  'ffffff',
  'fefefe',
  'fcfcfc',
  'fbfbfb',
  'fafafa',
  'f9f9f9',
  'f8f8f8',
  'f7f7f7',
  'f5f5f5',
  'f4f4f4',
  'f3f3f3',
  'f2f2f2',
  'f0f0f0',
  'eeeeee',
  'ebebeb',
  'e8e8e8',
  'e5e5e5',
]

const baseStyles = (bg: string) => `
  html, body {
    margin: 0;
    overflow: hidden;
    background: ${bg};
  }
  img { max-width: 100%; height: auto; }
`

const resizeScript = `
  var ro = new ResizeObserver(function() {
    var h = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'iframe-resize', height: h }, '*');
  });
  ro.observe(document.documentElement);
  ro.observe(document.body);
`

const linkScript = `
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (!el) return;
    var href = el.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
    e.preventDefault();
    e.stopPropagation();
    window.parent.postMessage({ type: 'open-link', href: el.href || href }, '*');
  }, true);
`

function isSafeExternalUrl(url: string) {
  try {
    const { protocol } = new URL(url)
    return (
      protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:'
    )
  } catch {
    return false
  }
}

function darkScript(bg: string) {
  return `
DarkReader.enable(${JSON.stringify({
    brightness: 100,
    contrast: 90,
    sepia: 0,
    darkSchemeBackgroundColor: bg,
  })});
(function() {
  var bg = ${JSON.stringify(bg)};
  var lights = ${JSON.stringify(LIGHT_BG_HEXES)};
  function paint() {
    var root = document.documentElement;
    root.style.setProperty('background', bg, 'important');
    root.style.setProperty('background-color', bg, 'important');
    document.body.style.setProperty('background', bg, 'important');
    document.body.style.setProperty('background-color', bg, 'important');
    for (var i = 0; i < lights.length; i++) {
      root.style.setProperty('--darkreader-background-' + lights[i], bg);
    }
  }
  paint();
  requestAnimationFrame(paint);
  setTimeout(paint, 0);
  setTimeout(paint, 50);
  setTimeout(paint, 200);
  var s = document.createElement('style');
  s.setAttribute('data-mb-reader-bg', '1');
  s.textContent = 'html, body { background: ' + bg + ' !important; background-color: ' + bg + ' !important; }';
  document.documentElement.appendChild(s);
})();`
}

function buildSrcdoc(html: string, isDark: boolean) {
  const bg = isDark ? tw.readerBg.dark : tw.readerBg.light
  return `<!DOCTYPE html>
<html style="overflow: hidden; background: ${bg};">
<head>
<meta charset="utf-8">
<style>${baseStyles(bg)}</style>
${isDark ? `<script>${drScript}<\/script>` : ''}
</head>
<body style="background: ${bg};">
${html}
<script>${resizeScript}<\/script>
<script>${linkScript}<\/script>
${isDark ? `<script>${darkScript(bg)}<\/script>` : ''}
</body>
</html>`
}

const EmailFrame = observer(({ html, title }: EmailFrameProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(0)
  const frameBg = store.isDark ? tw.readerBg.dark : tw.readerBg.light

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return
      if (e.data?.type === 'iframe-resize') {
        setHeight(e.data.height)
        return
      }
      if (e.data?.type === 'open-link' && isStr(e.data.href)) {
        const href = e.data.href as string
        if (!isSafeExternalUrl(href)) return
        void mailbox.openURL(href)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const srcDoc = useMemo(
    () => buildSrcdoc(html, store.isDark),
    [html, store.isDark],
  )

  return (
    <div
      className={tw.readerFrame}
      style={{ height: height > 0 ? height : 0, background: frameBg }}
    >
      <iframe
        ref={iframeRef}
        title={title}
        sandbox="allow-scripts allow-forms"
        className="block w-full border-0"
        style={{
          height: height > 0 ? height : 0,
          background: frameBg,
          colorScheme: store.isDark ? 'dark' : 'light',
        }}
        srcDoc={srcDoc}
      />
    </div>
  )
})

export default EmailFrame
