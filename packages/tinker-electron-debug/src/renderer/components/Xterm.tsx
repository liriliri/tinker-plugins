import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { CanvasAddon } from '@xterm/addon-canvas'
import '@xterm/xterm/css/xterm.css'

interface Props {
  content: string
  theme?: { background: string; foreground: string }
}

export default function Xterm({ content, theme }: Props) {
  const domRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const canvasLoadedRef = useRef(false)
  const writtenLengthRef = useRef(0)

  useEffect(() => {
    const fit = new FitAddon()
    const term = new Terminal({
      fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
      fontSize: 12,
      convertEol: true,
      theme,
    })
    term.loadAddon(fit)
    if (domRef.current) {
      term.open(domRef.current)
    }
    termRef.current = term
    fitRef.current = fit
    canvasLoadedRef.current = false
    writtenLengthRef.current = 0

    const observer = new ResizeObserver(() => {
      if (!domRef.current || domRef.current.offsetWidth === 0) return
      fit.fit()
      if (!canvasLoadedRef.current) {
        canvasLoadedRef.current = true
        term.loadAddon(new CanvasAddon())
      }
    })
    if (domRef.current) observer.observe(domRef.current)

    return () => {
      observer.disconnect()
      term.dispose()
      canvasLoadedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!termRef.current) return
    termRef.current.options.theme = theme
  }, [theme])

  useEffect(() => {
    if (!termRef.current) return
    const written = writtenLengthRef.current
    if (content.length < written) {
      termRef.current.clear()
      if (content) termRef.current.write(content)
    } else {
      const newContent = content.slice(written)
      if (newContent) termRef.current.write(newContent)
    }
    writtenLengthRef.current = content.length
  }, [content])

  return <div ref={domRef} className="h-full w-full" />
}
