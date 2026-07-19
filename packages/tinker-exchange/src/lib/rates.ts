import isEmpty from 'licia/isEmpty'

export interface RatesCache {
  rates: Record<string, number>
  timestamp: number
}

const API_URL = 'https://www.xe.com/api/protected/midmarket-converter/'
const AUTH = 'Basic bG9kZXN0YXI6cHVnc25heA=='
const FALLBACK_API_URL = 'https://open.er-api.com/v6/latest/USD'

export async function fetchRatesWithFallback(): Promise<RatesCache> {
  try {
    return await fetchXeRates()
  } catch (xeErr) {
    try {
      return await fetchFallbackRates()
    } catch (fallbackErr) {
      throw new Error(
        `XE failed (${toErrorMessage(xeErr)}); fallback failed (${toErrorMessage(fallbackErr)})`,
      )
    }
  }
}

async function fetchXeRates(): Promise<RatesCache> {
  const res = await fetch(API_URL, {
    headers: { Authorization: AUTH },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  if (!text) throw new Error(`HTTP ${res.status} empty body`)
  const data = JSON.parse(text) as RatesCache
  if (isEmpty(data.rates)) throw new Error('Invalid rates response')
  return data
}

async function fetchFallbackRates(): Promise<RatesCache> {
  const res = await fetch(FALLBACK_API_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.result !== 'success' || isEmpty(data.rates)) {
    throw new Error('Invalid rates response')
  }
  return {
    rates: data.rates,
    timestamp:
      (data.time_last_update_unix || Math.floor(Date.now() / 1000)) * 1000,
  }
}

function toErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}
