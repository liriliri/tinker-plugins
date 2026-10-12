import { errorMessage } from 'tinker-share/lib/util'
import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import type { Store } from './store'
import { getTodaySolar } from './lib/util'

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    query,
  })
}

function query(
  store: Store,
  args: { year?: number; month?: number; day?: number },
) {
  try {
    const today = getTodaySolar()
    store.selectDate(
      args.year ?? today.year,
      args.month ?? today.month,
      args.day ?? today.day,
    )
    return {
      year: store.selectedYear,
      month: store.selectedMonth,
      day: store.selectedDay,
      ...store.selectedDateInfo,
    }
  } catch (error) {
    return `Error: ${errorMessage(error) || 'Date query failed'}`
  }
}
