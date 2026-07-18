export function formatCoord(lat: number, lng: number, digits = 4) {
  return `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`
}
