import { pinyin } from 'pinyin'
import Lru from 'licia/Lru'
import type {
  GeoResult,
  WeatherData,
  CurrentWeather,
  DailyForecast,
} from './types'

const WMO_ZH: Record<number, string> = {
  0: '晴',
  1: '多云',
  2: '多云',
  3: '阴',
  45: '雾',
  48: '霜雾',
  51: '毛毛雨',
  53: '小雨',
  55: '中雨',
  56: '冻毛毛雨',
  57: '冻雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '强冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '阵雨',
  81: '强阵雨',
  82: '暴阵雨',
  85: '小阵雪',
  86: '大阵雪',
  95: '雷雨',
  96: '雷雨伴冰雹',
  99: '强雷雨伴冰雹',
}

const WMO_EN: Record<number, string> = {
  0: 'Clear',
  1: 'Partly Cloudy',
  2: 'Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  56: 'Freezing Drizzle',
  57: 'Freezing Rain',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  66: 'Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Showers',
  81: 'Heavy Showers',
  82: 'Violent Showers',
  85: 'Light Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ Hail',
  99: 'Severe Thunderstorm',
}

export function wmoDescription(code: number, language: string): string {
  if (language === 'zh-CN') {
    return WMO_ZH[code] ?? `天气代码 ${code}`
  }
  return WMO_EN[code] ?? `Weather code ${code}`
}

export type WeatherIconType =
  | 'sun'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'wind'

export function wmoToIcon(code: number): WeatherIconType {
  if (code === 0) return 'sun'
  if ([1, 2, 3].includes(code)) return 'cloud'
  if ([45, 48].includes(code)) return 'fog'
  if ([51, 53, 55].includes(code)) return 'drizzle'
  if ([56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ([95, 96, 99].includes(code)) return 'thunder'
  return 'cloud'
}

const WIND_LEVELS_ZH = [
  '无风',
  '软风',
  '轻风',
  '微风',
  '和风',
  '清风',
  '强风',
  '疾风',
  '大风',
  '烈风',
  '狂风',
  '暴风',
  '飓风',
]

const WIND_LEVELS_EN = [
  'Calm',
  'Light Air',
  'Light Breeze',
  'Gentle Breeze',
  'Moderate Breeze',
  'Fresh Breeze',
  'Strong Breeze',
  'Near Gale',
  'Gale',
  'Strong Gale',
  'Storm',
  'Violent Storm',
  'Hurricane',
]

const WIND_THRESHOLDS = [
  0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7,
]

export function getWindLevel(speed: number, language: string): string {
  const levels = language === 'zh-CN' ? WIND_LEVELS_ZH : WIND_LEVELS_EN
  for (let i = 0; i < WIND_THRESHOLDS.length; i++) {
    if (speed < WIND_THRESHOLDS[i]) return levels[i]
  }
  return levels[12]
}

interface CacheEntry {
  data: WeatherData
  timestamp: number
}

const cache = new Lru(10)
const CACHE_DURATION = 5 * 60 * 1000

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`
}

interface GeoApiResult {
  name: string
  admin1?: string
  country?: string
  latitude: number
  longitude: number
  timezone?: string
  population?: number
}

async function fetchGeoResults(
  query: string,
  language: string,
): Promise<GeoResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=${language}&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`)
  const data = await res.json()
  return (data.results || []).map((r: GeoApiResult) => ({
    name: r.name,
    admin1: r.admin1 || '',
    country: r.country || '',
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone || 'auto',
    population: r.population || 0,
  }))
}

function dedupeGeoResults(results: GeoResult[]): GeoResult[] {
  const seen = new Set<string>()
  return results.filter((r) => {
    const key = `${r.latitude.toFixed(2)},${r.longitude.toFixed(2)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const hasChinese = (s: string) => /[\u4e00-\u9fff]/.test(s)

function toPinyin(s: string): string {
  return pinyin(s, { style: 'normal' })
    .map((p) => p[0])
    .join('')
}

export async function geocode(
  name: string,
  language: string,
): Promise<GeoResult[]> {
  const q = name.trim()
  if (q.length < 2) return []

  const lang = language === 'zh-CN' ? 'zh' : 'en'
  const queries = [fetchGeoResults(q, lang)]

  if (hasChinese(q)) {
    queries.push(fetchGeoResults(toPinyin(q), lang))
  }

  const all = (await Promise.all(queries)).flat()
  return dedupeGeoResults(all)
    .sort((a, b) => b.population - a.population)
    .slice(0, 8)
}

export async function fetchWeather(
  lat: number,
  lon: number,
  tz: string,
): Promise<WeatherData> {
  const key = getCacheKey(lat, lon)
  const cached = cache.get(key) as CacheEntry | undefined
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: tz || 'auto',
    forecast_days: '3',
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code',
      'is_day',
      'uv_index',
      'visibility',
      'cloud_cover',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'precipitation_sum',
      'wind_speed_10m_max',
      'uv_index_max',
      'sunrise',
      'sunset',
    ].join(','),
  })

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`)
  const json = await res.json()

  const current: CurrentWeather = {
    temperature: json.current.temperature_2m,
    apparentTemperature: json.current.apparent_temperature,
    humidity: json.current.relative_humidity_2m,
    windSpeed: json.current.wind_speed_10m,
    windDirection: json.current.wind_direction_10m,
    weatherCode: json.current.weather_code,
    isDay: !!json.current.is_day,
    uvIndex: json.current.uv_index,
    visibility: json.current.visibility,
    cloudCover: json.current.cloud_cover,
  }

  const daily: DailyForecast[] = json.daily.time.map(
    (_: string, i: number) => ({
      date: json.daily.time[i],
      weatherCode: json.daily.weather_code[i],
      tempMax: json.daily.temperature_2m_max[i],
      tempMin: json.daily.temperature_2m_min[i],
      precipProbability: json.daily.precipitation_probability_max[i],
      precipSum: json.daily.precipitation_sum[i],
      windSpeedMax: json.daily.wind_speed_10m_max[i],
      uvIndexMax: json.daily.uv_index_max[i],
      sunrise: json.daily.sunrise[i],
      sunset: json.daily.sunset[i],
    }),
  )

  const result: WeatherData = { current, daily }
  cache.set(key, { data: result, timestamp: Date.now() } as CacheEntry)
  return result
}
