import clamp from 'licia/clamp'
import findIdx from 'licia/findIdx'
import fnv1a from 'licia/fnv1a'
import { countryPoint, landPositions, place } from './land'
import type { GlobePalette } from '../theme'
import type { Station } from '../types'

const RADIUS = 1.6
const LAND_RADIUS = RADIUS * 0.997
const STATION_RADIUS = RADIUS * 1.004
const FOV = (38 * Math.PI) / 180
const FOCAL = 1 / Math.tan(FOV / 2)
const PITCH_LIMIT = 1.45
const SHIFT_NDC_X = 0.22
const SHIFT_NDC_Y = 0.06
const HIT = 30
const ARRIVE = 1.25
const STAGGER = 1.2
const FAR_NEAR = 3.4
const FAR_SPAN = 3.2
const SWAY = 0.28
const SWAY_SPAN = 0.85

const SKY_VS = `attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`

const SKY_FS = `precision mediump float; uniform float uAspect, uTime; uniform vec3 uSky, uGlow, uStar; varying vec2 vUv;
float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float stars(vec2 q, float dens, float rad){ vec2 c = floor(q); float h1 = hh(c); if (h1 > dens) return 0.0;
  vec2 o = vec2(hh(c + 7.1), hh(c + 13.7)) - 0.5; float d = length(fract(q) - 0.5 - o * 0.6); float h2 = hh(c + 3.3);
  return smoothstep(rad, 0.0, d) * (0.35 + 0.65 * hh(c + 5.9)) * (0.55 + 0.45 * sin(uTime * (0.3 + h2 * 1.2) + h2 * 40.0)); }
void main(){ vec2 p = vUv - 0.5; p.x *= uAspect; float g = exp(-dot(p, p) * 3.0); vec3 c = uSky + uGlow * g;
  vec2 s = vUv * vec2(uAspect, 1.0);
  float st = stars(s * 120.0 + uTime * vec2(0.02, 0.006), 0.16, 0.2) * 0.5 + stars(s * 70.0 + uTime * vec2(0.04, 0.012), 0.2, 0.14) + stars(s * 32.0 + uTime * vec2(0.05, 0.015), 0.11, 0.09) * 2.2;
  c += uStar * st; gl_FragColor = vec4(c, 1.0); }`

const LAND_VS = `uniform mat4 uModel, uView, uProj; uniform vec3 uCam; uniform float uPR;
attribute vec3 aPos; varying float vF;
void main(){ vec3 world = (uModel * vec4(aPos, 1.0)).xyz; vec3 wn = normalize((uModel * vec4(aPos, 0.0)).xyz);
  vF = smoothstep(-0.05, 0.35, dot(wn, normalize(uCam))); vec4 mv = uView * vec4(world, 1.0);
  gl_PointSize = 2.05 * uPR * (6.0 / -mv.z); gl_Position = uProj * mv; }`

const LAND_FS = `precision mediump float; uniform vec3 uColor; uniform float uGain, uAdd; varying float vF;
void main(){ vec2 c = gl_PointCoord - 0.5; if (length(c) > 0.5) discard;
  float a = vF * uGain;
  if (uAdd > 0.5) gl_FragColor = vec4(uColor * a, 1.0); else gl_FragColor = vec4(uColor, a); }`

const HAZE_FS = `precision mediump float; uniform float uAspect, uRadius; uniform vec2 uCenter; uniform vec3 uHaze; varying vec2 vUv;
void main(){ vec2 p = vUv - uCenter; p.x *= uAspect; float d = length(p) / max(uRadius, 0.001);
  float h = smoothstep(1.04, 0.42, d);
  gl_FragColor = vec4(uHaze * h, 1.0); }`

const BRIGHT_FS = `precision mediump float; uniform sampler2D uTex; varying vec2 vUv;
void main(){ vec3 c = texture2D(uTex, vUv).rgb; float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(0.2, 0.48, l), 1.0); }`

const BLUR_FS = `precision mediump float; uniform sampler2D uTex; uniform vec2 uDir; varying vec2 vUv;
void main(){ vec3 c = texture2D(uTex, vUv).rgb * 0.227;
  c += texture2D(uTex, vUv + uDir * 1.6).rgb * 0.194; c += texture2D(uTex, vUv - uDir * 1.6).rgb * 0.194;
  c += texture2D(uTex, vUv + uDir * 3.8).rgb * 0.122; c += texture2D(uTex, vUv - uDir * 3.8).rgb * 0.122;
  c += texture2D(uTex, vUv + uDir * 6.4).rgb * 0.07; c += texture2D(uTex, vUv - uDir * 6.4).rgb * 0.07;
  gl_FragColor = vec4(c, 1.0); }`

const COMPOSE_FS = `precision mediump float; uniform sampler2D uScene, uBloom, uWide; uniform float uStrength, uWideStrength; varying vec2 vUv;
void main(){ vec2 d = vUv - 0.5; float r2 = dot(d, d); vec2 o = d * 0.0022 * (0.35 + r2 * 2.6);
  vec3 scene = vec3(texture2D(uScene, vUv + o).r, texture2D(uScene, vUv).g, texture2D(uScene, vUv - o).b);
  scene += texture2D(uBloom, vUv).rgb * uStrength + texture2D(uWide, vUv).rgb * uWideStrength;
  scene *= 1.0 - smoothstep(0.28, 1.05, r2) * 0.22;
  gl_FragColor = vec4(scene, 1.0); }`

const DOT_VS = `uniform mat4 uModel, uView, uProj; uniform vec3 uCam; uniform float uPR, uSel, uLevel, uTime, uTwinkle;
uniform float uBand[64];
attribute vec3 aPos; attribute float aPop, aDen, aIdx, aSeed, aBorn; varying float vA; varying float vSel;
float ease(float t){ return t<0.5 ? 4.0*t*t*t : 1.0-pow(-2.0*t+2.0,3.0)/2.0; }
void main(){
  float ie = ease(clamp((uTime - aBorn) / ${ARRIVE}, 0.0, 1.0));
  vec3 n = normalize(aPos);
  vec3 jitter = vec3(aSeed - 0.5, fract(aSeed * 13.1) - 0.5, fract(aSeed * 7.7) - 0.5);
  vec3 from = normalize(aPos + jitter * 2.0) * (${FAR_NEAR} + aSeed * ${FAR_SPAN});
  vec3 pos = mix(from, aPos, ie);
  float mid = sin(3.14159265 * ie);
  vec3 up = abs(n.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(n, up));
  vec3 lift = cross(n, side);
  pos += (side * sin(aSeed * 9.0) + lift * cos(aSeed * 5.0)) * mid * (${SWAY} + aSeed * ${SWAY_SPAN});
  vec3 world = (uModel * vec4(pos, 1.0)).xyz; vec3 wn = normalize((uModel * vec4(aPos, 0.0)).xyz);
  float face = smoothstep(-0.08, 0.28, dot(wn, normalize(uCam)));
  float back = mix(mix(0.05, 1.0, face), 1.0, 1.0 - ie);
  vec4 mv = uView * vec4(world, 1.0); gl_Position = uProj * mv; vSel = 1.0 - step(0.5, abs(aIdx - uSel));
  float seed = fract(sin(aIdx * 12.9898) * 43758.5453);
  float a = uBand[int(min(seed * 64.0, 63.0))];
  float live = clamp(uLevel, 0.0, 1.0);
  float tw = mix(0.4, 0.75, live);
  float shimmer = max(0.0, 1.0 - tw + tw * sin(uTwinkle * (0.3 + aSeed * 1.2) + aSeed * 40.0));
  float sz = (1.1 + aPop * 2.3) * (6.0 / -mv.z) * (1.0 + a * 0.7 * uLevel) * shimmer * mix(1.45, 1.0, ie) + vSel * (5.0 + uLevel * 2.0);
  gl_PointSize = clamp(sz * uPR, 1.0, 46.0);
  vA = ((0.16 + aPop * 0.7) * aDen * back * (1.0 + a * uLevel) * shimmer) * smoothstep(0.0, 0.35, ie) + vSel * 2.2; }`

const DOT_FS = `precision mediump float; uniform vec3 uStation, uActive; uniform float uAdd; varying float vA; varying float vSel;
void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.0, r); soft *= soft;
  float solid = smoothstep(0.42, 0.0, r);
  float a = mix(soft, solid, vSel);
  vec3 col = mix(uStation, uActive, vSel); float k = vA * a;
  if (uAdd > 0.5) gl_FragColor = vec4(col * k, 1.0); else gl_FragColor = vec4(col, k); }`

interface GlobeHover {
  name: string
  x: number
  y: number
}

export interface GlobeView {
  setStations: (stations: Station[]) => void
  frame: (
    dt: number,
    palette: GlobePalette,
    activeId: string,
    sound: { bands: Float32Array; level: number },
  ) => void
  focus: (id: string) => void
  activeScreen: (id: string) => { x: number; y: number } | null
  down: (x: number, y: number) => void
  move: (x: number, y: number) => GlobeHover | null
  up: (x: number, y: number) => Station | null
  wheel: (deltaY: number) => void
  dispose: () => void
}

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || 'shader'
    gl.deleteShader(shader)
    throw new Error(log)
  }
  return shader
}

function program(
  gl: WebGLRenderingContext,
  vs: string,
  fs: string,
): WebGLProgram {
  const prog = gl.createProgram()
  if (!prog) throw new Error('program')
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vs))
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || 'link')
  }
  return prog
}

function mat4(): Float32Array {
  return new Float32Array(16)
}

function modelMatrix(yaw: number, pitch: number, out: Float32Array) {
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  out[0] = cy
  out[1] = sp * sy
  out[2] = -cp * sy
  out[3] = 0
  out[4] = 0
  out[5] = cp
  out[6] = sp
  out[7] = 0
  out[8] = sy
  out[9] = -sp * cy
  out[10] = cp * cy
  out[11] = 0
  out[12] = 0
  out[13] = 0
  out[14] = 0
  out[15] = 1
}

function viewMatrix(cam: number, out: Float32Array) {
  out.fill(0)
  out[0] = 1
  out[5] = 1
  out[10] = 1
  out[14] = -cam
  out[15] = 1
}

function projMatrix(aspect: number, out: Float32Array) {
  const near = 0.02
  const far = 100
  const nf = 1 / (near - far)
  out.fill(0)
  out[0] = FOCAL / aspect
  out[5] = FOCAL
  out[8] = -SHIFT_NDC_X
  out[9] = -SHIFT_NDC_Y
  out[10] = (far + near) * nf
  out[11] = -1
  out[14] = 2 * far * near * nf
}

function span(aspect: number) {
  return clamp(0.95 / aspect, 1, 2)
}

function wrapPi(delta: number) {
  let turn = delta
  while (turn > Math.PI) turn -= Math.PI * 2
  while (turn < -Math.PI) turn += Math.PI * 2
  return turn
}

function rotate(x: number, y: number, z: number, yaw: number, pitch: number) {
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  return {
    x: x1,
    y: y * cp - z1 * sp,
    z: y * sp + z1 * cp,
  }
}

export function createGlobeView(canvas: HTMLCanvasElement): GlobeView {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  })
  if (!gl) throw new Error('webgl')

  const sky = program(gl, SKY_VS, SKY_FS)
  const land = program(gl, LAND_VS, LAND_FS)
  const dots = program(gl, DOT_VS, DOT_FS)
  const haze = program(gl, SKY_VS, HAZE_FS)
  const bright = program(gl, SKY_VS, BRIGHT_FS)
  const blur = program(gl, SKY_VS, BLUR_FS)
  const compose = program(gl, SKY_VS, COMPOSE_FS)
  const tri = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, tri)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  const landBuf = gl.createBuffer()
  const landPos = landPositions(LAND_RADIUS)
  gl.bindBuffer(gl.ARRAY_BUFFER, landBuf)
  gl.bufferData(gl.ARRAY_BUFFER, landPos, gl.STATIC_DRAW)
  const landCount = landPos.length / 3

  const posBuf = gl.createBuffer()
  const popBuf = gl.createBuffer()
  const denBuf = gl.createBuffer()
  const idxBuf = gl.createBuffer()
  const seedBuf = gl.createBuffer()
  const bornBuf = gl.createBuffer()
  const model = mat4()
  const view = mat4()
  const proj = mat4()
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let stations: Station[] = []
  let xyz = new Float32Array(0)
  let seeds = new Float32Array(0)
  let bornAt = new Float32Array(0)
  const bornOf = new Map<string, number>()
  let yaw = -1.9
  let pitch = 0.24
  let yawTarget = yaw
  let pitchTarget = pitch
  let aiming = false
  let vx = 0
  let vy = 0
  let dragging = false
  let moved = 0
  let lastX = 0
  let lastY = 0
  let downAt = 0
  let cam = 9
  let camTarget = 6.2
  let zoomed = false
  let opened = false
  let time = 0
  let twinkle = 0
  let cssW = 1
  let cssH = 1
  let dpr = 1

  const loc = (prog: WebGLProgram, name: string) =>
    gl.getUniformLocation(prog, name)

  const bind = (
    prog: WebGLProgram,
    attrs: Array<[WebGLBuffer | null, string, number]>,
  ) => {
    for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i)
    for (const [buf, name, size] of attrs) {
      const index = gl.getAttribLocation(prog, name)
      if (index < 0 || !buf) continue
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(index)
      gl.vertexAttribPointer(index, size, gl.FLOAT, false, 0, 0)
    }
  }

  const setCamera = (prog: WebGLProgram) => {
    gl.uniformMatrix4fv(loc(prog, 'uModel'), false, model)
    gl.uniformMatrix4fv(loc(prog, 'uView'), false, view)
    gl.uniformMatrix4fv(loc(prog, 'uProj'), false, proj)
    gl.uniform3f(loc(prog, 'uCam'), 0, 0, cam)
    gl.uniform1f(loc(prog, 'uPR'), dpr)
  }

  const resize = () => {
    cssW = Math.max(1, canvas.clientWidth)
    cssH = Math.max(1, canvas.clientHeight)
    dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    const pw = Math.round(cssW * dpr)
    const ph = Math.round(cssH * dpr)
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw
      canvas.height = ph
    }
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  const fract = (n: number) => n - Math.floor(n)

  const ease = (t: number) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
  }

  const fly = (index: number) => {
    const x = xyz[index * 3]
    const y = xyz[index * 3 + 1]
    const z = xyz[index * 3 + 2]
    const sd = seeds[index] || 0
    const ie = ease((time - bornAt[index]) / ARRIVE)
    if (ie >= 0.999) return { x, y, z }
    const jx = (sd - 0.5) * 2
    const jy = (fract(sd * 13.1) - 0.5) * 2
    const jz = (fract(sd * 7.7) - 0.5) * 2
    let fx = x + jx
    let fy = y + jy
    let fz = z + jz
    const fl = Math.hypot(fx, fy, fz) || 1
    const farR = FAR_NEAR + sd * FAR_SPAN
    fx = (fx / fl) * farR
    fy = (fy / fl) * farR
    fz = (fz / fl) * farR
    const px = fx + (x - fx) * ie
    const py = fy + (y - fy) * ie
    const pz = fz + (z - fz) * ie
    const amp = Math.sin(Math.PI * ie) * (SWAY + sd * SWAY_SPAN)
    const len = Math.hypot(x, y, z) || 1
    const nx = x / len
    const ny = y / len
    const nz = z / len
    const ux = Math.abs(ny) > 0.9 ? 1 : 0
    const uy = Math.abs(ny) > 0.9 ? 0 : 1
    let sx = ny * 0 - nz * uy
    let sy = nz * ux - nx * 0
    let sz = nx * uy - ny * ux
    const sl = Math.hypot(sx, sy, sz) || 1
    sx /= sl
    sy /= sl
    sz /= sl
    const lx = ny * sz - nz * sy
    const ly = nz * sx - nx * sz
    const lz = nx * sy - ny * sx
    const sway = Math.sin(sd * 9)
    const rise = Math.cos(sd * 5)
    return {
      x: px + (sx * sway + lx * rise) * amp,
      y: py + (sy * sway + ly * rise) * amp,
      z: pz + (sz * sway + lz * rise) * amp,
    }
  }

  const project = (index: number) => {
    const placed = fly(index)
    const p = rotate(placed.x, placed.y, placed.z, yaw, pitch)
    if (p.z < RADIUS * 0.12) return null
    const aspect = cssW / cssH
    const viewZ = p.z - cam
    if (viewZ >= -0.05) return null
    const ndcX = ((FOCAL / aspect) * p.x) / -viewZ + SHIFT_NDC_X
    const ndcY = (FOCAL * p.y) / -viewZ + SHIFT_NDC_Y
    return {
      x: (ndcX * 0.5 + 0.5) * cssW,
      y: (0.5 - ndcY * 0.5) * cssH,
    }
  }

  const pick = (x: number, y: number) => {
    let best = -1
    let bestD = HIT * HIT
    for (let i = 0; i < stations.length; i++) {
      const point = project(i)
      if (!point) continue
      const dx = point.x - x
      const dy = point.y - y
      const d = dx * dx + dy * dy
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    return best
  }

  const stationIndex = (id: string) =>
    findIdx(stations, (station) => station.stationuuid === id)

  interface Target {
    tex: WebGLTexture
    fb: WebGLFramebuffer
    w: number
    h: number
  }
  const targets: Record<'full' | 'a' | 'b' | 'c' | 'd', Target | null> = {
    full: null,
    a: null,
    b: null,
    c: null,
    d: null,
  }
  const dropTarget = (target: Target | null) => {
    if (!target) return
    gl.deleteTexture(target.tex)
    gl.deleteFramebuffer(target.fb)
  }
  const alloc = (w: number, h: number): Target | null => {
    const tex = gl.createTexture()
    const fb = gl.createFramebuffer()
    if (!tex || !fb) return null
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      w,
      h,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    )
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    )
    const ok =
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    if (!ok) {
      gl.deleteTexture(tex)
      gl.deleteFramebuffer(fb)
      return null
    }
    return { tex, fb, w, h }
  }
  const ensureTarget = (
    w: number,
    h: number,
    slot: 'full' | 'a' | 'b' | 'c' | 'd',
  ) => {
    const current = targets[slot]
    if (current && current.w === w && current.h === h) return current
    dropTarget(current)
    targets[slot] = alloc(w, h)
    return targets[slot]
  }

  return {
    setStations(next) {
      const placed: Station[] = []
      const lat: number[] = []
      const lng: number[] = []
      for (let i = 0; i < next.length; i++) {
        const station = next[i]
        if (station.lat !== null && station.lng !== null) {
          placed.push(station)
          lat.push(station.lat)
          lng.push(station.lng)
          continue
        }
        const point = countryPoint(
          station.countrycode,
          station.country,
          station.stationuuid,
        )
        if (!point) continue
        placed.push(station)
        lat.push(point[0])
        lng.push(point[1])
      }
      stations = placed
      xyz = new Float32Array(placed.length * 3)
      const pop = new Float32Array(placed.length)
      const den = new Float32Array(placed.length)
      const idx = new Float32Array(placed.length)
      const bins = new Map<number, number>()
      const keys: number[] = []
      for (let i = 0; i < placed.length; i++) {
        place(lat[i], lng[i], STATION_RADIUS, xyz, i)
        const key = Math.floor(lat[i] * 2) * 1000 + Math.floor(lng[i] * 2)
        keys.push(key)
        bins.set(key, (bins.get(key) || 0) + 1)
        pop[i] = clamp((placed[i].bitrate || 0) / 320, 0, 1)
        idx[i] = i
      }
      for (let i = 0; i < placed.length; i++) {
        const count = bins.get(keys[i]) || 1
        den[i] = 1 / (1 + Math.sqrt(count - 1) * 0.35)
      }
      if (!placed.length) bornOf.clear()
      const seedAttr = new Float32Array(placed.length)
      const bornAttr = new Float32Array(placed.length)
      for (let i = 0; i < placed.length; i++) {
        const id = placed[i].stationuuid
        const sd = (fnv1a(id) >>> 0) / 4294967296
        seedAttr[i] = sd
        let at = bornOf.get(id)
        if (at === undefined) {
          at = motion.matches ? -10 : time + sd * STAGGER
          bornOf.set(id, at)
        }
        bornAttr[i] = at
      }
      seeds = seedAttr
      bornAt = bornAttr
      const upload = (buf: WebGLBuffer | null, data: Float32Array) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
      }
      upload(posBuf, xyz)
      upload(popBuf, pop)
      upload(denBuf, den)
      upload(idxBuf, idx)
      upload(seedBuf, seedAttr)
      upload(bornBuf, bornAttr)
    },
    frame(dt, palette, activeId, sound) {
      resize()
      const aspect = cssW / cssH
      const rest = 7.1 * span(aspect)
      const far = 9 * span(aspect)
      if (!zoomed) camTarget = rest
      if (!opened) {
        cam = motion.matches ? rest : far
        opened = true
      }
      if (dragging) {
        aiming = false
      } else if (aiming) {
        const turn = wrapPi(yawTarget - yaw)
        const step = motion.matches ? 1 : 0.08
        yaw += turn * step
        pitch += (pitchTarget - pitch) * step
        if (Math.abs(turn) + Math.abs(pitchTarget - pitch) < 0.002) {
          yaw = yawTarget
          pitch = pitchTarget
          aiming = false
        }
      } else {
        vx *= 0.9
        vy *= 0.9
        yaw += vx
        pitch = clamp(pitch + vy, -PITCH_LIMIT, PITCH_LIMIT)
      }
      cam += (camTarget - cam) * (motion.matches ? 1 : 0.06)
      time += motion.matches ? 0 : dt
      const live = clamp(sound.level, 0, 1)
      twinkle += motion.matches ? 0 : dt * (1 + live * 0.6)
      const active = stationIndex(activeId)
      modelMatrix(yaw, pitch, model)
      viewMatrix(cam, view)
      projMatrix(aspect, proj)
      const scene = ensureTarget(canvas.width, canvas.height, 'full')
      const halfW = Math.max(1, canvas.width >> 1)
      const halfH = Math.max(1, canvas.height >> 1)
      const quarterW = Math.max(1, canvas.width >> 2)
      const quarterH = Math.max(1, canvas.height >> 2)
      const ping = ensureTarget(halfW, halfH, 'a')
      const pong = ensureTarget(halfW, halfH, 'b')
      const wideA = ensureTarget(quarterW, quarterH, 'c')
      const wideB = ensureTarget(quarterW, quarterH, 'd')
      const drawScene = () => {
        gl.disable(gl.BLEND)
        gl.useProgram(sky)
        bind(sky, [[tri, 'aPos', 2]])
        gl.uniform1f(loc(sky, 'uAspect'), aspect)
        gl.uniform1f(loc(sky, 'uTime'), time)
        gl.uniform3fv(loc(sky, 'uSky'), palette.sky)
        gl.uniform3fv(loc(sky, 'uGlow'), palette.glow)
        gl.uniform3fv(loc(sky, 'uStar'), palette.star)
        gl.drawArrays(gl.TRIANGLES, 0, 3)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE)
        gl.useProgram(haze)
        bind(haze, [[tri, 'aPos', 2]])
        gl.uniform1f(loc(haze, 'uAspect'), aspect)
        gl.uniform2f(
          loc(haze, 'uCenter'),
          0.5 + SHIFT_NDC_X * 0.5,
          0.5 + SHIFT_NDC_Y * 0.5,
        )
        gl.uniform1f(loc(haze, 'uRadius'), ((FOCAL * RADIUS) / cam) * 0.5)
        gl.uniform3fv(loc(haze, 'uHaze'), palette.haze)
        gl.drawArrays(gl.TRIANGLES, 0, 3)

        gl.blendFunc(
          palette.additive ? gl.ONE : gl.SRC_ALPHA,
          palette.additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA,
        )
        const add = palette.additive ? 1 : 0
        gl.useProgram(land)
        bind(land, [[landBuf, 'aPos', 3]])
        setCamera(land)
        gl.uniform3fv(loc(land, 'uColor'), palette.land)
        gl.uniform1f(loc(land, 'uGain'), palette.additive ? 1 : 0.85)
        gl.uniform1f(loc(land, 'uAdd'), add)
        gl.drawArrays(gl.POINTS, 0, landCount)

        if (!stations.length) return
        gl.useProgram(dots)
        bind(dots, [
          [posBuf, 'aPos', 3],
          [popBuf, 'aPop', 1],
          [denBuf, 'aDen', 1],
          [idxBuf, 'aIdx', 1],
          [seedBuf, 'aSeed', 1],
          [bornBuf, 'aBorn', 1],
        ])
        setCamera(dots)
        gl.uniform1f(loc(dots, 'uTime'), time)
        gl.uniform1f(loc(dots, 'uTwinkle'), twinkle)
        gl.uniform1f(loc(dots, 'uLevel'), sound.level)
        gl.uniform1fv(loc(dots, 'uBand[0]'), sound.bands)
        gl.uniform1f(loc(dots, 'uSel'), active)
        gl.uniform3fv(loc(dots, 'uStation'), palette.station)
        gl.uniform3fv(loc(dots, 'uActive'), palette.active)
        gl.uniform1f(loc(dots, 'uAdd'), add)
        gl.drawArrays(gl.POINTS, 0, stations.length)
        if (active >= 0) gl.drawArrays(gl.POINTS, active, 1)
      }
      if (!scene || !ping || !pong) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, canvas.width, canvas.height)
        drawScene()
        return
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fb)
      gl.viewport(0, 0, scene.w, scene.h)
      drawScene()
      const pass = (
        prog: WebGLProgram,
        source: WebGLTexture,
        target: WebGLFramebuffer,
        w: number,
        h: number,
      ) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target)
        gl.viewport(0, 0, w, h)
        gl.disable(gl.BLEND)
        gl.useProgram(prog)
        bind(prog, [[tri, 'aPos', 2]])
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, source)
        gl.uniform1i(loc(prog, 'uTex'), 0)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      const pingPong = (
        source: Target,
        other: Target,
        step: number,
        times: number,
      ) => {
        for (let i = 0; i < times; i++) {
          gl.uniform2f(loc(blur, 'uDir'), step / source.w, 0)
          pass(blur, source.tex, other.fb, other.w, other.h)
          gl.uniform2f(loc(blur, 'uDir'), 0, step / other.h)
          pass(blur, other.tex, source.fb, source.w, source.h)
        }
        return source
      }
      pass(bright, scene.tex, ping.fb, ping.w, ping.h)
      gl.useProgram(blur)
      const core = pingPong(ping, pong, 1.6, 2)
      let wide = core
      let wideStrength = 0
      if (wideA && wideB) {
        gl.uniform2f(loc(blur, 'uDir'), 3.2 / core.w, 0)
        pass(blur, core.tex, wideA.fb, wideA.w, wideA.h)
        wide = pingPong(wideA, wideB, 3.2, 3)
        wideStrength = 1.15
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(compose)
      bind(compose, [[tri, 'aPos', 2]])
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, scene.tex)
      gl.uniform1i(loc(compose, 'uScene'), 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, core.tex)
      gl.uniform1i(loc(compose, 'uBloom'), 1)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, wide.tex)
      gl.uniform1i(loc(compose, 'uWide'), 2)
      gl.uniform1f(loc(compose, 'uStrength'), 0.5)
      gl.uniform1f(loc(compose, 'uWideStrength'), wideStrength)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    activeScreen(id) {
      if (!id) return null
      const index = stationIndex(id)
      if (index < 0) return null
      return project(index)
    },
    focus(id) {
      const index = stationIndex(id)
      if (index < 0) return
      const x = xyz[index * 3]
      const y = xyz[index * 3 + 1]
      const z = xyz[index * 3 + 2]
      const nextYaw = Math.atan2(-x, z)
      const forward = -x * Math.sin(nextYaw) + z * Math.cos(nextYaw)
      yawTarget = yaw + wrapPi(nextYaw - yaw)
      pitchTarget = clamp(Math.atan2(y, forward), -PITCH_LIMIT, PITCH_LIMIT)
      aiming = true
      vx = 0
      vy = 0
    },
    down(x, y) {
      dragging = true
      aiming = false
      moved = 0
      lastX = x
      lastY = y
      downAt = performance.now()
      vx = 0
      vy = 0
    },
    move(x, y) {
      if (dragging) {
        const dx = x - lastX
        const dy = y - lastY
        moved += Math.abs(dx) + Math.abs(dy)
        const sens = (0.0021 * (cam - RADIUS * 0.98)) / 4.6
        vx = dx * sens
        vy = dy * sens
        yaw += vx
        pitch = clamp(pitch + vy, -PITCH_LIMIT, PITCH_LIMIT)
        lastX = x
        lastY = y
        return null
      }
      const index = pick(x, y)
      if (index < 0) return null
      const point = project(index)
      const station = stations[index]
      if (!point || !station) return null
      return { name: station.name, x: point.x, y: point.y }
    },
    up(x, y) {
      dragging = false
      if (moved >= 6 || performance.now() - downAt > 400) return null
      const index = pick(x, y)
      return index >= 0 ? stations[index] : null
    },
    wheel(deltaY) {
      zoomed = true
      const aspect = cssW / cssH
      camTarget = clamp(
        camTarget * (1 + deltaY * 0.0011),
        1.95,
        9 * span(aspect),
      )
    },
    dispose() {
      gl.deleteProgram(sky)
      gl.deleteProgram(land)
      gl.deleteProgram(dots)
      gl.deleteProgram(haze)
      gl.deleteProgram(bright)
      gl.deleteProgram(blur)
      gl.deleteProgram(compose)
      dropTarget(targets.full)
      dropTarget(targets.a)
      dropTarget(targets.b)
      dropTarget(targets.c)
      dropTarget(targets.d)
      gl.deleteBuffer(tri)
      gl.deleteBuffer(landBuf)
      gl.deleteBuffer(posBuf)
      gl.deleteBuffer(popBuf)
      gl.deleteBuffer(denBuf)
      gl.deleteBuffer(idxBuf)
      gl.deleteBuffer(seedBuf)
      gl.deleteBuffer(bornBuf)
    },
  }
}
