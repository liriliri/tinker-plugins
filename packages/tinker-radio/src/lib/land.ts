import each from 'licia/each'
import fnv1a from 'licia/fnv1a'
import lowerCase from 'licia/lowerCase'
import trim from 'licia/trim'
import upperCase from 'licia/upperCase'
import countries from './globe-data-min.json'

const STEP = 0.72

interface Geometry {
  type: string
  coordinates: number[][][] | number[][][][]
}

interface Feature {
  properties: { ISO_A2?: string }
  geometry: Geometry
}

interface Part {
  rings: number[][][]
  code: string
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
  hits: number
}

interface Bounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

const ALIAS: Record<string, string> = {
  'the united states of america': 'US',
  'united states of america': 'US',
  usa: 'US',
  uk: 'GB',
  'great britain': 'GB',
  'russian federation': 'RU',
  'republic of korea': 'KR',
  'czech republic': 'CZ',
  'viet nam': 'VN',
  vietnam: 'VN',
  'hong kong': 'HK',
  macau: 'MO',
  macao: 'MO',
  palestine: 'PS',
  "cote d'ivoire": 'CI',
  'ivory coast': 'CI',
}

const features = (countries as { features: Feature[] }).features

function isoCode(iso: string, box: Bounds): string {
  if (iso && iso !== '-99') return iso
  if (box.minLng < -40 && box.maxLat > 40 && box.maxLng < 20) return 'FR'
  if (box.minLat > 55 && box.minLng > 0 && box.maxLng < 40) return 'NO'
  if (
    box.minLat > 34 &&
    box.maxLat < 36 &&
    box.minLng > 30 &&
    box.maxLng < 36
  ) {
    return 'CY'
  }
  if (box.minLat > 7 && box.maxLat < 12 && box.minLng > 40 && box.maxLng < 52) {
    return 'SO'
  }
  return ''
}

function featureBounds(polygons: number[][][][]): Bounds {
  let minLat = 90
  let maxLat = -90
  let minLng = 180
  let maxLng = -180
  for (let p = 0; p < polygons.length; p++) {
    const box = bounds(polygons[p][0])
    if (box.minLat < minLat) minLat = box.minLat
    if (box.maxLat > maxLat) maxLat = box.maxLat
    if (box.minLng < minLng) minLng = box.minLng
    if (box.maxLng > maxLng) maxLng = box.maxLng
  }
  return { minLat, maxLat, minLng, maxLng }
}

function partsOf(geometry: Geometry): number[][][][] {
  if (geometry.type === 'Polygon') {
    return [geometry.coordinates as number[][][]]
  }
  return geometry.coordinates as number[][][][]
}

function bounds(ring: number[][]) {
  let minLat = 90
  let maxLat = -90
  let minLng = 180
  let maxLng = -180
  for (let i = 0; i < ring.length; i++) {
    const lng = ring[i][0]
    const lat = ring[i][1]
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }
  return { minLat, maxLat, minLng, maxLng }
}

// A downward ray crosses the south-pole edge once. That edge is the
// latitude -90 segment joining 180° to -180°.
function insideRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false
  let pole = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const y1 = ring[i][1]
    const y2 = ring[j][1]
    let x1 = ring[i][0]
    let x2 = ring[j][0]
    if (Math.abs(x1 - x2) > 180 && y1 <= -89 && y2 <= -89) {
      pole = true
      continue
    }
    if (Math.abs(x1 - x2) > 180) {
      if (x1 < 0) x1 += 360
      if (x2 < 0) x2 += 360
    }
    const x = x1 > 180 || x2 > 180 ? (lng < 0 ? lng + 360 : lng) : lng
    if (x1 > x !== x2 > x) {
      const yCross = ((y2 - y1) * (x - x1)) / (x2 - x1) + y1
      if (yCross < lat) inside = !inside
    }
  }
  if (pole && lat > -90) inside = !inside
  return inside
}

function contains(lng: number, lat: number, part: Part): boolean {
  if (!insideRing(lng, lat, part.rings[0])) return false
  for (let h = 1; h < part.rings.length; h++) {
    if (insideRing(lng, lat, part.rings[h])) return false
  }
  return true
}

function centroid(ring: number[][]): [number, number] {
  let n = ring.length
  const last = n - 1
  if (n > 1 && ring[0][0] === ring[last][0] && ring[0][1] === ring[last][1]) {
    n = last
  }
  let lng = 0
  let lat = 0
  for (let i = 0; i < n; i++) {
    lng += ring[i][0]
    lat += ring[i][1]
  }
  return [lng / n, lat / n]
}

interface LandIndex {
  dots: Array<[number, number]>
  pools: Map<string, Array<[number, number]>>
}

function sample(): LandIndex {
  const parts: Part[] = []
  for (let f = 0; f < features.length; f++) {
    const polygons = partsOf(features[f].geometry)
    const code = isoCode(
      features[f].properties.ISO_A2 || '',
      featureBounds(polygons),
    )
    for (let p = 0; p < polygons.length; p++) {
      const rings = polygons[p]
      parts.push({ rings, code, hits: 0, ...bounds(rings[0]) })
    }
  }

  const seen = new Set<string>()
  const dots: Array<[number, number]> = []
  const pools = new Map<string, Array<[number, number]>>()
  const add = (lat: number, lng: number, code: string) => {
    let x = lng
    if (x < -180) x += 360
    if (x >= 180) x -= 360
    const key = `${Math.round(lat * 100)},${Math.round(x * 100)}`
    if (seen.has(key)) return
    seen.add(key)
    const point: [number, number] = [lat, x]
    dots.push(point)
    if (!code) return
    const pool = pools.get(code)
    if (pool) pool.push(point)
    else pools.set(code, [point])
  }
  const cover = (lng: number, lat: number) => {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (lat < part.minLat || lat > part.maxLat) continue
      if (lng < part.minLng || lng > part.maxLng) continue
      if (!contains(lng, lat, part)) continue
      part.hits++
      return part
    }
    return null
  }

  for (let lat = -84; lat <= 84; lat += STEP) {
    const cos = Math.cos((lat * Math.PI) / 180)
    const dlng = Math.max(
      STEP,
      Math.round((STEP / Math.max(cos, 0.12)) * 100) / 100,
    )
    for (let lng = -180; lng < 180; lng += dlng) {
      const part = cover(lng, lat)
      if (part) add(lat, lng, part.code)
    }
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part.hits) continue
    const [lng, lat] = centroid(part.rings[0])
    if (cover(lng, lat)) add(lat, lng, part.code)
  }

  return { dots, pools }
}

let index: LandIndex | null = null
let countryNames: Map<string, string> | null = null

function landIndex() {
  if (!index) index = sample()
  return index
}

function namesFor(pools: Map<string, Array<[number, number]>>) {
  if (countryNames) return countryNames
  const display = new Intl.DisplayNames(['en'], { type: 'region' })
  const names = new Map<string, string>()
  pools.forEach((_points, code) => {
    const label = display.of(code)
    if (label) names.set(lowerCase(label), code)
  })
  each(ALIAS, (code, name) => {
    if (pools.has(code)) names.set(name, code)
  })
  countryNames = names
  return names
}

export function countryPoint(
  countrycode: string,
  country: string,
  uuid: string,
): [number, number] | null {
  const pools = landIndex().pools
  let code = upperCase(trim(countrycode))
  if (code === 'UK') code = 'GB'
  if (!pools.has(code)) {
    code = namesFor(pools).get(lowerCase(trim(country))) || ''
  }
  const pool = pools.get(code)
  if (!pool?.length) return null
  return pool[fnv1a(uuid) % pool.length]
}

export function place(
  lat: number,
  lng: number,
  radius: number,
  out: Float32Array,
  index: number,
) {
  const deg = Math.PI / 180
  const a = (90 - lat) * deg
  const o = (lng + 180) * deg
  const sinA = Math.sin(a)
  const n = index * 3
  out[n] = -radius * sinA * Math.cos(o)
  out[n + 1] = radius * Math.cos(a)
  out[n + 2] = radius * sinA * Math.sin(o)
}

export function landPositions(radius: number): Float32Array {
  const points = landIndex().dots
  const out = new Float32Array(points.length * 3)
  for (let i = 0; i < points.length; i++) {
    place(points[i][0], points[i][1], radius, out, i)
  }
  return out
}
