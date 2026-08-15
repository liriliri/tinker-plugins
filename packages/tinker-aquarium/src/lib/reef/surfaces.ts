import clamp from 'licia/clamp'
import fill from 'licia/fill'
import * as THREE from 'three'

interface SurfacePack {
  normalUrl: string
  mapUrl: string
  /** Tile count over a colony's 0..1 UVs; lower = larger pores. */
  repeat: number
  /** Grayscale map contrast boost (coral cavity only). */
  contrast?: number
  pivot?: number
  normalScale: number
  /** When true, map is a cavity bake that needs contrast boosting. */
  boostMap?: boolean
}

interface SurfaceMaps {
  map: THREE.Texture
  normalMap: THREE.Texture
  normalScale: number
}

// Two porous skeletons baked from the lowpoly-coral-pack. coral_1 is a fine
// grain; coral_2 has big, bold pores that actually read from across the tank.
const CORAL_SURFACES: SurfacePack[] = [
  {
    normalUrl: 'images/coral_normal.jpg',
    mapUrl: 'images/coral_cavity.jpg',
    repeat: 1.2,
    contrast: 3.4,
    pivot: 0.7,
    normalScale: 2.4,
    boostMap: true,
  },
  {
    normalUrl: 'images/coral2_normal.jpg',
    mapUrl: 'images/coral2_cavity.jpg',
    repeat: 1.6,
    contrast: 2.6,
    pivot: 0.66,
    normalScale: 2.2,
    boostMap: true,
  },
]

const coralCache: (SurfaceMaps | null)[] = fill(
  new Array(CORAL_SURFACES.length),
  null,
)

/**
 * Pushes a grayscale map's midtones apart around `pivot`, so pits go markedly
 * darker than ridges. The raw cavity bake is low-contrast and reads as a faint
 * smudge once lit through water; this makes the pores actually visible.
 */
function sourceSize(image: TexImageSource) {
  if (image instanceof HTMLImageElement) {
    return { width: image.naturalWidth, height: image.naturalHeight }
  }
  if (image instanceof HTMLCanvasElement || image instanceof OffscreenCanvas) {
    return { width: image.width, height: image.height }
  }
  if (image instanceof ImageBitmap) {
    return { width: image.width, height: image.height }
  }
  if (image instanceof HTMLVideoElement) {
    return { width: image.videoWidth, height: image.videoHeight }
  }
  return { width: 0, height: 0 }
}

function boostContrast(image: TexImageSource, strength: number, pivot: number) {
  const { width, height } = sourceSize(image)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image as CanvasImageSource, 0, 0)
  const data = ctx.getImageData(0, 0, width, height)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const v = px[i + c] / 255
      const adjusted = pivot + (v - pivot) * strength
      px[i + c] = clamp(adjusted, 0, 1) * 255
    }
  }
  ctx.putImageData(data, 0, 0)
  return canvas
}

function tileTexture(
  texture: THREE.Texture,
  repeat: number,
  colorSpace: THREE.ColorSpace,
) {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.colorSpace = colorSpace
  texture.anisotropy = 4
  return texture
}

export function loadCoralSurface(index: number): SurfaceMaps {
  const cached = coralCache[index]
  if (cached) return cached

  const surface = CORAL_SURFACES[index]
  const normalMap = tileTexture(
    new THREE.TextureLoader().load(surface.normalUrl),
    surface.repeat,
    THREE.NoColorSpace,
  )

  // The scene's fill light is soft, so a normal map alone barely reads. Baking
  // the cavity into the albedo darkens the pits directly, so pores show at any
  // angle and distance instead of only under a grazing highlight.
  const map = tileTexture(
    new THREE.Texture(),
    surface.repeat,
    THREE.SRGBColorSpace,
  )
  new THREE.ImageLoader().load(surface.mapUrl, (image) => {
    map.image = boostContrast(image, surface.contrast!, surface.pivot!)
    map.needsUpdate = true
  })

  const maps: SurfaceMaps = {
    map,
    normalMap,
    normalScale: surface.normalScale,
  }
  coralCache[index] = maps
  return maps
}

const ROCK_ALBEDO_URL = 'images/rock.jpg'
const ROCK_NORMAL_URL = 'images/rock_normal.jpg'
const ROCK_REPEAT = 0.85

let rockSurface: SurfaceMaps | null = null

/** Diffuse + normal pack for rubble stones. */
export function loadRockSurface(): SurfaceMaps {
  if (rockSurface) return rockSurface

  const loader = new THREE.TextureLoader()
  rockSurface = {
    map: tileTexture(
      loader.load(ROCK_ALBEDO_URL),
      ROCK_REPEAT,
      THREE.SRGBColorSpace,
    ),
    normalMap: tileTexture(
      loader.load(ROCK_NORMAL_URL),
      ROCK_REPEAT,
      THREE.NoColorSpace,
    ),
    normalScale: 2.2,
  }
  return rockSurface
}
