import contain from 'licia/contain'
import map from 'licia/map'
import keys from 'licia/keys'
import trim from 'licia/trim'
import waitUntil from 'licia/waitUntil'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'convert') {
      return convert(
        getStore(),
        args as { amount: number; from: string; to?: string },
      )
    }
    if (name === 'refresh_rates') {
      return refreshRates(getStore())
    }
    if (name === 'add_currency') {
      return addCurrency(getStore(), args as { currency: string })
    }
    if (name === 'remove_currency') {
      return removeCurrency(getStore(), args as { currency: string })
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function convert(
  store: Store,
  args: { amount: number; from: string; to?: string },
) {
  const from = normalizeCode(args.from)
  assertCurrency(store, from)

  let to: string | undefined
  if (args.to != null) {
    to = normalizeCode(args.to)
    assertCurrency(store, to)
    if (to === from) {
      throw new Error('Target currency must differ from base currency')
    }
  }

  store.setBaseCurrency(from)
  store.setBaseAmount(args.amount)
  if (to) {
    store.addCurrency(to)
  }

  await ensureRates(store)
  assertRate(store, from)

  const targets = to ? [to] : store.targetCodes
  for (const code of targets) {
    assertRate(store, code)
  }

  return {
    amount: store.baseAmount,
    from: store.baseCurrency,
    ratesTime: store.ratesTime,
    conversions: map(targets, (code) => toConversion(store, code)),
  }
}

async function refreshRates(store: Store) {
  await ensureRates(store, true)
  return {
    ratesTime: store.ratesTime,
    currencyCount: keys(store.rates).length,
  }
}

function addCurrency(store: Store, args: { currency: string }) {
  const code = normalizeCode(args.currency)
  assertCurrency(store, code)
  store.addCurrency(code)
  return {
    selectedCodes: [...store.selectedCodes],
  }
}

function removeCurrency(store: Store, args: { currency: string }) {
  const code = normalizeCode(args.currency)
  assertCurrency(store, code)
  if (code === store.baseCurrency) {
    throw new Error(`Cannot remove base currency: ${code}`)
  }
  if (!contain(store.selectedCodes, code)) {
    throw new Error(`Currency is not in the list: ${code}`)
  }
  if (store.selectedCodes.length <= 1) {
    throw new Error('Cannot remove the last currency')
  }
  store.removeCurrency(code)
  return {
    selectedCodes: [...store.selectedCodes],
  }
}

async function ensureRates(store: Store, force = false) {
  await store.fetchRates(force)
  await waitUntil(() => !store.isLoading, 0, 50)
  if (keys(store.rates).length === 0) {
    throw new Error(store.error || 'No exchange rates available')
  }
  if (force && store.error) {
    throw new Error(store.error)
  }
}

function toConversion(store: Store, code: string) {
  const amount = store.convert(code)
  return {
    code,
    name: store.getCurrencyName(code),
    amount,
    formatted: store.formatAmount(amount),
  }
}

function normalizeCode(code: string) {
  return trim(code).toUpperCase()
}

function assertCurrency(store: Store, code: string) {
  if (!contain(store.currencyCodes, code)) {
    throw new Error(`Unknown currency: ${code}`)
  }
}

function assertRate(store: Store, code: string) {
  if (!store.rates[code]) {
    throw new Error(`No exchange rate available for ${code}`)
  }
}
