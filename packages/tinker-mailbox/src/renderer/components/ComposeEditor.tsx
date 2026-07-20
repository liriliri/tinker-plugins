import { forwardRef, useImperativeHandle, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import { tw } from '../theme'

const FONT_SIZES = [
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '24px', label: '24' },
  { value: '32px', label: '32' },
] as const

const DEFAULT_FONT_SIZE = '14px'

interface FormatButtonProps {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}

function FormatButton({ active, icon, label, onClick }: FormatButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`${tw.button.format} ${active ? tw.button.formatActive : ''}`}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
    >
      {icon}
    </button>
  )
}

interface FontSizeSelectProps {
  editor: Editor
}

function FontSizeSelect({ editor }: FontSizeSelectProps) {
  const { t } = useTranslation()
  const fontSize = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      (e.getAttributes('textStyle').fontSize as string | undefined) ||
      DEFAULT_FONT_SIZE,
  })

  return (
    <select
      className={tw.input.composeFontSize}
      title={t('formatFontSize')}
      aria-label={t('formatFontSize')}
      value={fontSize}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        const size = e.target.value
        editor.chain().focus().setFontSize(size).run()
      }}
    >
      {FONT_SIZES.map((size) => (
        <option key={size.value} value={size.value}>
          {size.label}
        </option>
      ))}
    </select>
  )
}

interface FormatToolbarProps {
  editor: Editor
}

function FormatToolbar({ editor }: FormatToolbarProps) {
  const { t } = useTranslation()
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
    }),
  })

  return (
    <div className={tw.shell.composeToolbar}>
      <FontSizeSelect editor={editor} />
      <span className={tw.shell.composeToolbarDivider} />
      <FormatButton
        active={state.bold}
        label={t('formatBold')}
        icon={<Bold className="w-3.5 h-3.5" />}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <FormatButton
        active={state.italic}
        label={t('formatItalic')}
        icon={<Italic className="w-3.5 h-3.5" />}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <FormatButton
        active={state.underline}
        label={t('formatUnderline')}
        icon={<UnderlineIcon className="w-3.5 h-3.5" />}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <FormatButton
        active={state.strike}
        label={t('formatStrikethrough')}
        icon={<Strikethrough className="w-3.5 h-3.5" />}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <span className={tw.shell.composeToolbarDivider} />
      <FormatButton
        active={state.bulletList}
        label={t('formatBulletList')}
        icon={<List className="w-3.5 h-3.5" />}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <FormatButton
        active={state.orderedList}
        label={t('formatNumberedList')}
        icon={<ListOrdered className="w-3.5 h-3.5" />}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
    </div>
  )
}

export interface ComposeEditorHandle {
  getText: () => string
  getHtml: () => string
}

interface ComposeEditorProps {
  className?: string
  placeholder?: string
}

const ComposeEditor = forwardRef<ComposeEditorHandle, ComposeEditorProps>(
  ({ className, placeholder }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          code: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
        }),
        Underline,
        TextStyle,
        FontSize,
        Placeholder.configure({
          placeholder: placeholder ?? '',
        }),
      ],
      content: '<p></p>',
      editorProps: {
        attributes: {
          class: `${tw.input.composeEditor} ${className ?? ''}`,
        },
      },
    })

    useImperativeHandle(ref, () => ({
      getText: () => editor?.getText({ blockSeparator: '\n' }) ?? '',
      getHtml: () => editor?.getHTML() ?? '',
    }))

    if (!editor) return null

    return (
      <div className="flex flex-col flex-1 min-h-0">
        <FormatToolbar editor={editor} />
        <div className="relative flex-1 min-h-0">
          <EditorContent
            editor={editor}
            className={`${tw.shell.composeBody} absolute inset-0 overflow-y-auto`}
          />
        </div>
      </div>
    )
  },
)

ComposeEditor.displayName = 'ComposeEditor'

export default ComposeEditor
