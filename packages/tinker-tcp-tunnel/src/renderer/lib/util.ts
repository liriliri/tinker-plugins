import className from 'licia/className'
import type { TunnelState } from '../../common/types'
import { tw } from '../theme'

export function statusDotClass(state: TunnelState): string {
  if (state === 'connected') return tw.fill.good
  if (state === 'error') return tw.fill.bad
  if (state === 'connecting') {
    return className(tw.fill.accent, 'animate-link-pulse')
  }
  return tw.fill.idle
}
