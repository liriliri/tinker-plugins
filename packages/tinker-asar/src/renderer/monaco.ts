import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  },
}

loader.config({ monaco })

monaco.editor.defineTheme('asar-light', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#f3f4f6',
    'editor.lineHighlightBackground': '#eceef1',
    'editorLineNumber.foreground': '#8b919c',
    'editorLineNumber.activeForeground': '#5c6370',
    'editor.selectionBackground': '#0f766e28',
    'editor.inactiveSelectionBackground': '#0f766e18',
    'editorCursor.foreground': '#0f766e',
  },
})

monaco.editor.defineTheme('asar-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#16191d',
    'editor.lineHighlightBackground': '#1c2026',
    'editorLineNumber.foreground': '#6b7280',
    'editorLineNumber.activeForeground': '#9ca3af',
    'editor.selectionBackground': '#2dd4bf30',
    'editor.inactiveSelectionBackground': '#2dd4bf18',
    'editorCursor.foreground': '#2dd4bf',
  },
})
