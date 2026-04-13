import L from 'leaflet'
import { wgs84ToGcj02 } from './coordConvert'

function convertCenter(
  center: L.LatLng,
  options: L.GridLayerOptions,
): L.LatLng {
  const corrdType = (options as Record<string, unknown>).corrdType as string
  if (corrdType === 'gcj02') {
    const converted = wgs84ToGcj02(center.lng, center.lat)
    return L.latLng(converted.lat, converted.lng)
  }
  return center
}

/* eslint-disable @typescript-eslint/no-explicit-any */
L.GridLayer.include({
  _setZoomTransform(
    this: any,
    level: { zoom: number; origin: L.Point; el: HTMLElement },
    _center: L.LatLng,
    zoom: number,
  ) {
    const center = convertCenter(_center, this.options)
    const scale = this._map.getZoomScale(zoom, level.zoom)
    const translate = level.origin
      .multiplyBy(scale)
      .subtract(this._map._getNewPixelOrigin(center, zoom))
      .round()

    if (L.Browser.any3d) {
      L.DomUtil.setTransform(level.el, translate, scale)
    } else {
      L.DomUtil.setPosition(level.el, translate)
    }
  },

  _getTiledPixelBounds(this: any, _center: L.LatLng) {
    const center = convertCenter(_center, this.options)
    const map = this._map
    const mapZoom = map._animatingZoom
      ? Math.max(map._animateToZoom, map.getZoom())
      : map.getZoom()
    const scale = map.getZoomScale(mapZoom, this._tileZoom)
    const pixelCenter = map.project(center, this._tileZoom).floor()
    const halfSize = map.getSize().divideBy(scale * 2)

    return new L.Bounds(
      pixelCenter.subtract(halfSize),
      pixelCenter.add(halfSize),
    )
  },
})
