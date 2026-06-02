import trim from 'licia/trim'
import { editorViewCtx } from '@milkdown/kit/core'
import { TextSelection } from '@milkdown/kit/prose/state'
import type { Crepe } from '@milkdown/crepe'
import type { MarkdownOutlineItem } from './markdownOutline'

const outlineScrollTopOffset = 24

export function selectOutlineHeading(
  crepe: Crepe,
  targetItem: MarkdownOutlineItem,
  targetIndex: number,
  scrollContainer: HTMLElement | null,
) {
  crepe.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    let headingIndex = -1
    let targetNodePosition: number | null = null
    let targetPosition: number | null = null

    view.state.doc.descendants((node, position) => {
      if (node.type.name !== 'heading') return true

      headingIndex += 1
      if (
        headingIndex === targetIndex &&
        Number(node.attrs.level) === targetItem.level &&
        trim(node.textContent) === targetItem.title
      ) {
        targetNodePosition = position
        targetPosition = position + 1
        return false
      }

      return true
    })

    if (targetPosition === null) {
      view.focus()
      return
    }

    const resolvedPosition = view.state.doc.resolve(targetPosition)
    const selection = TextSelection.near(resolvedPosition)

    view.focus()
    view.dispatch(view.state.tr.setSelection(selection))

    const dom =
      targetNodePosition === null ? null : view.nodeDOM(targetNodePosition)
    if (!(dom instanceof HTMLElement) || !scrollContainer) return

    const containerRect = scrollContainer.getBoundingClientRect()
    const elementRect = dom.getBoundingClientRect()
    const top = Math.max(
      0,
      scrollContainer.scrollTop +
        elementRect.top -
        containerRect.top -
        outlineScrollTopOffset,
    )
    scrollContainer.scrollTo({ top, behavior: 'smooth' })
  })
}
