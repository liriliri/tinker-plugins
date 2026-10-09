import { action, computed, makeObservable, observable } from 'mobx'
import delay from 'licia/delay'
import BaseStore from 'tinker-share/store/Base'
import { convertChinese, toPinyin, toRmb } from './lib/convert'
import type { PinyinStyle, ChineseMode, Tool } from './types'
import { createMcpApi } from './mcp'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  currentTool: Tool = 'pinyin'
  input = ''
  pinyinStyle: PinyinStyle = 'tone'
  chineseMode: ChineseMode = 'toTraditional'
  copied = false

  constructor() {
    super()
    makeObservable(this, {
      currentTool: observable,
      input: observable,
      pinyinStyle: observable,
      chineseMode: observable,
      copied: observable,
      pinyinResult: computed,
      rmbResult: computed,
      chineseResult: computed,
      currentResult: computed,
      setCurrentTool: action,
      setInput: action,
      setPinyinStyle: action,
      setChineseMode: action,
      copyResult: action,
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
    void navigator.clipboard.writeText(this.currentResult)
    this.copied = true
    delay(() => {
      this.copied = false
    }, 1500)
  }
}

const store = new Store()

export default store
