import clamp from 'licia/clamp'
import each from 'licia/each'
import range from 'licia/range'
import * as THREE from 'three'

function hash2(ix: number, iy: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

function fade(t: number) {
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function valueNoise(x: number, y: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = fade(x - x0)
  const ty = fade(y - y0)
  return lerp(
    lerp(hash2(x0, y0), hash2(x0 + 1, y0), tx),
    lerp(hash2(x0, y0 + 1), hash2(x0 + 1, y0 + 1), tx),
    ty,
  )
}

function fbm(x: number, y: number) {
  let sum = 0
  let amp = 0.5
  let freq = 1
  for (let i = 0; i < 5; i++) {
    sum += valueNoise(x * freq, y * freq) * amp
    amp *= 0.5
    freq *= 2.03
  }
  return sum
}

function createDirtTexture(waterV: number) {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(size, size)
  const pixels = image.data
  const drips = range(7).map((i) => ({
    u: hash2(i * 19, 7),
    half: 0.003 + hash2(i, 11) * 0.008,
    length: 0.08 + hash2(i, 23) * 0.28,
    strength: 0.1 + hash2(i, 41) * 0.18,
  }))

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1)
      const v = 1 - y / (size - 1)
      const n = fbm(u * 6.5, v * 5.2)
      const n2 = fbm(u * 18 + 8, v * 14)
      const edgeU = Math.pow(1 - Math.min(u, 1 - u) * 2, 2)
      const waterline = Math.exp(-Math.pow((v - waterV) * 64, 2))
      const mineral = waterline * (0.22 + n * 0.4)
      let drip = 0
      each(drips, (streak) => {
        if (v > waterV || waterV - v > streak.length) return
        const fall = 1 - (waterV - v) / streak.length
        const across = 1 - Math.abs(u - streak.u) / streak.half
        if (across <= 0) return
        drip = Math.max(drip, across * fall * streak.strength)
      })
      const algae =
        Math.pow(1 - v, 2.2) * (0.22 + edgeU * 0.7) * (0.4 + n * 0.7)
      const film = Math.max(0, n2 - 0.58) * 0.42
      const smudge = Math.max(0, n - 0.62) * (0.16 + edgeU * 0.32)
      const amount = clamp(
        mineral * 0.45 + drip * 0.7 + algae * 0.7 + film + smudge,
        1,
      )

      const i = (y * size + x) * 4
      const algaeMix = clamp(algae * 1.35, 1)
      pixels[i] = 118 + mineral * 90 - algaeMix * 50
      pixels[i + 1] = 128 + mineral * 80 - algaeMix * 20
      pixels[i + 2] = 112 + mineral * 95 - algaeMix * 55
      pixels[i + 3] = amount * 125
    }
  }

  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

export function createGlassDirt(
  width: number,
  height: number,
  depth: number,
  waterY: number,
  floorY: number,
) {
  const waterV = (waterY - floorY) / height
  const texture = createDirtTexture(waterV)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
  const group = new THREE.Group()
  group.name = 'GlassDirt'
  const inset = 0.01

  const addWall = (
    wallWidth: number,
    x: number,
    z: number,
    rotationY: number,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWidth, height),
      material,
    )
    mesh.position.set(x, 0, z)
    mesh.rotation.y = rotationY
    mesh.renderOrder = 4
    group.add(mesh)
  }

  addWall(width, 0, depth / 2 - inset, 0)
  addWall(width, 0, -(depth / 2 - inset), 0)
  addWall(depth, -(width / 2 - inset), 0, Math.PI / 2)
  addWall(depth, width / 2 - inset, 0, Math.PI / 2)

  return {
    group,
    dispose() {
      each(group.children, (child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose()
      })
      material.dispose()
      texture.dispose()
    },
  }
}
