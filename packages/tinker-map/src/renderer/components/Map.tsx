import { observer } from 'mobx-react-lite'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  ScaleControl,
} from 'react-leaflet'
import btoa from 'licia/btoa'
import className from 'licia/className'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Crosshair, Map as MapIcon, Satellite } from 'lucide-react'
import store from '../store'
import { markerColor, tw } from '../theme'
import { formatCoord } from '../lib/util'
import '../lib/mapCorrection'
import type { MapLocation, MapLayer, Bookmark } from '../types'

interface TileConfig {
  url: string
  subdomains: string[]
  attribution: string
  corrdType?: string
}

const googleTiles: Record<MapLayer, TileConfig> = {
  road: {
    url: 'https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    corrdType: 'gcj02',
  },
  satellite: {
    url: 'https://mt{s}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    corrdType: 'gcj02',
  },
}

const gaodeAnnotation = {
  url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
  subdomains: ['1', '2', '3', '4'],
  corrdType: 'gcj02',
}

const gaodeTiles: Record<MapLayer, TileConfig> = {
  road: {
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    subdomains: ['1', '2', '3', '4'],
    attribution: '&copy; 高德地图',
    corrdType: 'gcj02',
  },
  satellite: {
    url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    subdomains: ['1', '2', '3', '4'],
    attribution: '&copy; 高德地图',
    corrdType: 'gcj02',
  },
}

function markerSvg(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
    <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.3 12.5 28.5 12.5 28.5S25 21.8 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
    <circle cx="12.5" cy="12.5" r="5" fill="white"/>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

const defaultIcon = L.icon({
  iconUrl: markerSvg(markerColor.default),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const selectedIcon = L.icon({
  iconUrl: markerSvg(markerColor.selected),
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
})

function useTileConfig() {
  const { i18n } = useTranslation()
  const isZhCN = i18n.language === 'zh-CN'
  const tiles = isZhCN ? gaodeTiles : googleTiles
  const showAnnotation = isZhCN && store.layer === 'satellite'
  return { tiles, showAnnotation }
}

const layers: { key: MapLayer; icon: typeof MapIcon }[] = [
  { key: 'road', icon: MapIcon },
  { key: 'satellite', icon: Satellite },
]

function MapSync() {
  const leafletMap = useMap()
  const syncing = useRef(false)

  useEffect(() => {
    if (syncing.current) return
    leafletMap.setView([store.center.lat, store.center.lng], store.zoom)
  }, [store.center.lat, store.center.lng, store.zoom])

  useEffect(() => {
    const onMoveEnd = () => {
      const center = leafletMap.getCenter()
      syncing.current = true
      store.setView({ lat: center.lat, lng: center.lng }, leafletMap.getZoom())
      syncing.current = false
    }
    leafletMap.on('moveend', onMoveEnd)
    return () => {
      leafletMap.off('moveend', onMoveEnd)
    }
  }, [leafletMap])

  return null
}

interface LocationMarkerProps {
  location: MapLocation
}

function LocationMarker({ location }: LocationMarkerProps) {
  const isSelected = store.selectedId === location.id

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={isSelected ? selectedIcon : defaultIcon}
      eventHandlers={{
        click: () => store.selectLocation(location.id),
      }}
    >
      <Popup>
        <strong>{location.name}</strong>
        {location.description && <div>{location.description}</div>}
      </Popup>
    </Marker>
  )
}

const bookmarkIcon = L.icon({
  iconUrl: markerSvg(markerColor.bookmark),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const LocationMarkerObserver = observer(LocationMarker)

function ContextMenuHandler() {
  const { t } = useTranslation()

  useMapEvents({
    contextmenu(e) {
      const { lat, lng } = e.latlng
      tinker.showContextMenu(e.originalEvent.clientX, e.originalEvent.clientY, [
        {
          label: t('bookmarkLocation'),
          click: () => store.openBookmarkDialog({ lat, lng }),
        },
      ])
    },
  })

  return null
}

interface BookmarkMarkerProps {
  bookmark: Bookmark
}

function BookmarkMarker({ bookmark }: BookmarkMarkerProps) {
  return (
    <Marker position={[bookmark.lat, bookmark.lng]} icon={bookmarkIcon}>
      <Popup>
        <strong>{bookmark.name}</strong>
        <div className={`text-xs ${tw.popup.coordText}`}>
          {formatCoord(bookmark.lat, bookmark.lng)}
        </div>
      </Popup>
    </Marker>
  )
}

const LayerSwitcher = observer(() => {
  const { t } = useTranslation()

  return (
    <div className="absolute top-3 right-3 z-[1000] flex rounded-lg overflow-hidden shadow-lg">
      {layers.map(({ key, icon: Icon }, i) => (
        <button
          key={key}
          onClick={() => store.setLayer(key)}
          className={className(
            'px-3 py-1.5 text-xs font-medium transition-all duration-200',
            'flex items-center gap-1.5',
            i > 0 && `border-l ${tw.layerDivider}`,
            store.layer === key ? tw.controlBtn.active : tw.controlBtn.inactive,
          )}
        >
          <Icon size={13} />
          {t(key)}
        </button>
      ))}
    </div>
  )
})

const LocateButton = observer(() => {
  return (
    <button
      onClick={() => store.locateMe()}
      disabled={store.locating}
      className={className(
        'absolute bottom-6 right-3 z-[1000] w-9 h-9 rounded-lg shadow-lg',
        'flex items-center justify-center transition-all duration-200',
        'hover:scale-105 active:scale-95',
        store.locating ? tw.controlBtn.active : tw.controlBtn.inactive,
      )}
    >
      <Crosshair size={18} className={store.locating ? 'animate-pulse' : ''} />
    </button>
  )
})

const Map = observer(() => {
  const { tiles, showAnnotation } = useTileConfig()
  const tile = tiles[store.layer]

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[store.center.lat, store.center.lng]}
        zoom={store.zoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          key={`${store.layer}-${tile.url}`}
          attribution={tile.attribution}
          url={tile.url}
          subdomains={tile.subdomains}
          {...({ corrdType: tile.corrdType } as Record<string, string>)}
        />
        {showAnnotation && (
          <TileLayer
            url={gaodeAnnotation.url}
            subdomains={gaodeAnnotation.subdomains}
            {...({ corrdType: gaodeAnnotation.corrdType } as Record<
              string,
              string
            >)}
          />
        )}
        <ScaleControl position="bottomleft" metric imperial={false} />
        <MapSync />
        <ContextMenuHandler />
        {store.locations.map((loc) => (
          <LocationMarkerObserver key={loc.id} location={loc} />
        ))}
        {store.bookmarks.map((bm) => (
          <BookmarkMarker key={bm.id} bookmark={bm} />
        ))}
      </MapContainer>
      <LayerSwitcher />
      <LocateButton />
    </div>
  )
})

export default Map
