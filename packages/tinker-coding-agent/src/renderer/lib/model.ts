import type { ModelSelection } from '../../common/types'

const VALUE_SEP = ':::'

export function isValidSelection(
  selection: ModelSelection | null,
): selection is ModelSelection {
  return !!(selection?.provider && selection?.model)
}

export function toModelValue(selection: ModelSelection) {
  return `${selection.provider}${VALUE_SEP}${selection.model}`
}

export function parseModelValue(value: string): ModelSelection | null {
  const index = value.indexOf(VALUE_SEP)
  if (index <= 0) return null
  const provider = value.slice(0, index)
  const model = value.slice(index + VALUE_SEP.length)
  if (!provider || !model) return null
  return { provider, model }
}
