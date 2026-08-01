import type { OcrLang } from './types'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name !== 'recognize') {
      throw new Error(`Unknown tool "${name}"`)
    }
    return recognize(
      getStore(),
      args as { path: string; lang?: OcrLang; strip_newlines?: boolean },
    )
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function recognize(
  store: Store,
  args: { path: string; lang?: OcrLang; strip_newlines?: boolean },
) {
  const path = await store.recognizeFromPath(args.path, {
    lang: args.lang,
    stripNewlines: args.strip_newlines,
  })
  return {
    path,
    lang: store.lang,
    stripNewlines: store.stripNewlines,
    text: store.displayResult,
  }
}
