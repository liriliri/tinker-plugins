import { makeAutoObservable } from 'mobx'
import { pinyin } from 'pinyin'
import Nzh from 'nzh'
import stcasc from 'switch-chinese'
import trim from 'licia/trim'
import type { IPinyinOptions } from 'pinyin/lib/types/declare'
import type { PinyinStyle, ChineseMode, Tool } from './types'

type PinyinStyleValue = NonNullable<IPinyinOptions['style']>

const styleMap: Record<PinyinStyle, PinyinStyleValue> = {
  tone: 'tone',
  toneNum: 'tone2',
  normal: 'normal',
}

const converter = stcasc()

class Store {
  currentTool: Tool = 'pinyin'
  input: string = ''
  pinyinStyle: PinyinStyle = 'tone'
  chineseMode: ChineseMode = 'toTraditional'
  copied: boolean = false

  constructor() {
    makeAutoObservable(this)
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
    if (!trim(this.input)) return ''

    const result = pinyin(this.input, {
      style: styleMap[this.pinyinStyle],
    })

    return result.map((item: string[]) => item[0]).join(' ')
  }

  get rmbResult(): string {
    const trimmed = trim(this.input)
    if (!trimmed) return ''
    const num = parseFloat(trimmed)
    if (isNaN(num)) return ''
    return Nzh.cn.toMoney(trimmed)
  }

  get chineseResult(): string {
    if (!trim(this.input)) return ''
    if (this.chineseMode === 'toTraditional') {
      return converter.traditionalized(this.input)
    }
    return converter.simplized(this.input)
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
