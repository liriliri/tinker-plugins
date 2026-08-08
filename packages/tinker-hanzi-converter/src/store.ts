import { makeAutoObservable } from 'mobx'
import { convertChinese, toPinyin, toRmb } from './lib/convert'
import type { PinyinStyle, ChineseMode, Tool } from './types'
import { createMcpApi } from './mcp'

export class Store {
  readonly mcp = createMcpApi(() => this)

  currentTool: Tool = 'pinyin'
  input: string = ''
  pinyinStyle: PinyinStyle = 'tone'
  chineseMode: ChineseMode = 'toTraditional'
  copied: boolean = false

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  setCurrentTool(tool: Tool) {
    this.currentTool = tool
    this.input = ''
    this.copied = false
  }

  setInput(value: string) {
    this.input = value
  }

  setPinyinStyle(style: PinyinStyle) {
    this.pinyinStyle = style
  }

  setChineseMode(mode: ChineseMode) {
    this.chineseMode = mode
    this.copied = false
  }

  get pinyinResult(): string {
    return toPinyin(this.input, this.pinyinStyle)
  }

  get rmbResult(): string {
    return toRmb(this.input)
  }

  get chineseResult(): string {
    return convertChinese(this.input, this.chineseMode)
  }

  get currentResult(): string {
    switch (this.currentTool) {
      case 'pinyin':
        return this.pinyinResult
      case 'rmb':
        return this.rmbResult
      case 'chinese':
        return this.chineseResult
    }
  }

  copyResult() {
    if (!this.currentResult) return
    navigator.clipboard.writeText(this.currentResult)
    this.copied = true
    setTimeout(() => {
      this.copied = false
    }, 1500)
  }
}

const store = new Store()

export default store
