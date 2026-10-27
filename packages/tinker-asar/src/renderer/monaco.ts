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
    'editor.background': '#f7f8fa',
    'editor.lineHighlightBackground': '#eef1f5',
    'editorLineNumber.foreground': '#8b95a5',
    'editorLineNumber.activeForeground': '#4b5563',
    'editor.selectionBackground': '#2563eb28',
    'editor.inactiveSelectionBackground': '#2563eb18',
    'editorCursor.foreground': '#2563eb',
  },
})

monaco.editor.defineTheme('asar-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#12161c',
    'editor.lineHighlightBackground': '#1a2129',
    'editorLineNumber.foreground': '#4b5563',
    'editorLineNumber.activeForeground': '#9ca3af',
    'editor.selectionBackground': '#3b82f630',
    'editor.inactiveSelectionBackground': '#3b82f618',
    'editorCursor.foreground': '#60a5fa',
  },
})
