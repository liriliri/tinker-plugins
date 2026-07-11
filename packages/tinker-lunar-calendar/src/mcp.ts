import type { Store } from './store'
import { getTodaySolar } from './lib/util'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name !== 'query') {
      return `Error: Unknown tool "${name}"`
    }
    return query(
      getStore(),
      args as { year?: number; month?: number; day?: number },
    )
  }

  tinker.registerMcp({ callTool })

  return { callTool }
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
    return `Error: ${error instanceof Error ? error.message : 'Date query failed'}`
  }
}
