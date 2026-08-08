import type { ChineseMode, PinyinStyle } from './types'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'to_pinyin') {
      return toPinyin(
        getStore(),
        args as { text: string; style?: PinyinStyle },
      )
    }
    if (name === 'to_rmb') {
      return toRmb(getStore(), args as { amount: string })
    }
    if (name === 'convert_chinese') {
      return convertChinese(
        getStore(),
        args as { text: string; mode?: ChineseMode },
      )
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

function toPinyin(store: Store, args: { text: string; style?: PinyinStyle }) {
  store.setCurrentTool('pinyin')
  if (args.style) {
    store.setPinyinStyle(args.style)
  }
  store.setInput(args.text)
  return {
    tool: store.currentTool,
    input: store.input,
    style: store.pinyinStyle,
    result: store.currentResult,
  }
}

function toRmb(store: Store, args: { amount: string }) {
  store.setCurrentTool('rmb')
  store.setInput(args.amount)
  return {
    tool: store.currentTool,
    input: store.input,
    result: store.currentResult,
  }
}

function convertChinese(
  store: Store,
  args: { text: string; mode?: ChineseMode },
) {
  store.setCurrentTool('chinese')
  if (args.mode) {
    store.setChineseMode(args.mode)
  }
  store.setInput(args.text)
  return {
    tool: store.currentTool,
    input: store.input,
    mode: store.chineseMode,
    result: store.currentResult,
  }
}
