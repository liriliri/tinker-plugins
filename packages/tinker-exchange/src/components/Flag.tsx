import map from 'licia/map'

// Currencies whose country code is not the first 2 letters of the ISO code.
const CURRENCY_COUNTRY: Record<string, string> = {
  EUR: 'EU',
  XAF: 'CM',
  XOF: 'SN',
  XPF: 'PF',
  XCD: 'AG',
}

function getCountryCode(code: string): string {
  return CURRENCY_COUNTRY[code] || code.slice(0, 2)
}

function toFlagEmoji(country: string): string {
  if (country.length < 2) return ''
  return String.fromCodePoint(
    ...map([...country], (c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  )
}

// Country codes whose flag emoji is intentionally not shipped on common
// platforms (notably Apple emoji in China-region builds, where the Taiwan
// flag renders as a tofu box).
const MISSING_FLAGS = new Set(['TW'])

interface FlagProps {
  code: string
}

export default function Flag({ code }: FlagProps) {
  const country = getCountryCode(code)
  if (MISSING_FLAGS.has(country)) {
    return <span className="text-[0.6em] align-middle">{country}</span>
  }
  return <>{toFlagEmoji(country)}</>
}
