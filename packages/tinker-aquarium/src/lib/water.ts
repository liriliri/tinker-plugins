import * as THREE from 'three'
import random from 'licia/random'

// Ported from the MIT-licensed threejs-water project in `references/`. The optics
// run in units of the water depth, so the surface sits at y = 0 and the bed at
// y = -1 and the reference's tuned constants carry over unchanged. Unlike its
// square pool the tank is oblong, so its hardcoded +/-1 horizontal bounds become
// poolWidth/poolLength and the group is scaled uniformly -- scaling the group
// unevenly instead would distort every angle the shaders reason about. Its
// interactive obstacles are dropped since the tank is empty, and its sky cubemap
// is replaced by a gradient because this tank sits on a dark desktop.

// The surface stretches this grid across the tank, so it sets how coarse a
// ripple looks. 128 keeps a few overlapping rings without paying for a 256²
// height field every frame at fullscreen.
const SIMULATION_SIZE = 128
const CAUSTICS_SIZE = 512
// Frames between caustics rasterisations. The bands drift slowly, so they do not
// need rebuilding every frame.
const CAUSTICS_INTERVAL = 2
// The caustics pass and the visible water mesh share this tessellation. The
// fragment shader rebuilds the normal from the height map anyway, so the mesh
// only needs enough vertices to carry the broad displacement.
const SURFACE_SEGMENTS = 48
// Parallax steps taken to find the height where a view ray meets the surface.
// Each one is a texture fetch for every water pixel, which makes this the
// surface shader's dominant cost; a couple is enough for gentle waves.
const SURFACE_PARALLAX_STEPS = 2
// Two extra scene passes run every frame, so their size is the main lever on
// cost. They also cover a wider view than the window, so only part of this
// resolution lands on screen — sized so the visible share stays close to 1:1,
// since magnifying a capture is what produced stair-stepped edges. The
// reflection is a dim mirror seen past the critical angle, so it can carry less.
const REFRACTION_SIZE = 1024
const REFLECTION_SIZE = 256
// Mip bias for the capture lookups. Multisampling smooths edges as the pass is
// drawn, so this only needs to take the edge off the remaining magnification
// rather than hide it.
const REFRACTION_BLUR = 0.15
const REFLECTION_BLUR = 0.6
// Ambient drips keep the tank from freezing into a mirror. Sparse drops mean
// fewer overlapping rings and fewer extra simulation passes.
const AMBIENT_DROP_INTERVAL = 96
const AMBIENT_DROP_STRENGTH = 0.0045
const INITIAL_DROP_COUNT = 3

// Projects a point in tank units onto the caustics texture, following the light
// slant exactly as the caustics pass did when it rasterised into that texture.
// Both the pass and every lookup share this, so they can never drift apart.
//
// The reference fits its square pool at 0.75. Dividing the slant offset by this
// tank's shorter half-depth stretches it further across the texture, so the scale
// has to leave more margin or the projection clips off the edge and the bed loses
// its bands there.
const causticLookupChunk = `
  const float CAUSTIC_SCALE = 0.5;

  vec2 causticUv(vec3 point, vec3 refractedLight, vec2 pool) {
    return CAUSTIC_SCALE *
      ((point - point.y * refractedLight / refractedLight.y).xz / pool) *
      0.5 +
      0.5;
  }
`

const passVertexShader = `
  varying vec2 coord;

  void main() {
    coord = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const waveSimulationShader = `
  precision highp float;

  uniform sampler2D tInput;
  uniform vec2 delta;
  uniform float poolWidth;
  uniform float poolLength;
  varying vec2 coord;

  void main() {
    vec4 info = texture2D(tInput, coord);
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);

    float d2h_dx2 =
      texture2D(tInput, coord + dx).r + texture2D(tInput, coord - dx).r - 2.0 * info.r;
    float d2h_dz2 =
      texture2D(tInput, coord + dy).r + texture2D(tInput, coord - dy).r - 2.0 * info.r;

    float stabilityScale = min(1.0, min(poolWidth * poolWidth, poolLength * poolLength));
    info.g += 0.5 * stabilityScale * (
      d2h_dx2 / (poolWidth * poolWidth) + d2h_dz2 / (poolLength * poolLength)
    );
    info.g *= 0.995;
    info.r += info.g;

    gl_FragColor = info;
  }
`

const waterNormalShader = `
  precision highp float;

  uniform sampler2D tInput;
  uniform vec2 delta;
  uniform float poolWidth;
  uniform float poolLength;
  varying vec2 coord;

  void main() {
    vec4 info = texture2D(tInput, coord);

    vec3 dx = vec3(
      delta.x * 2.0 * poolWidth,
      texture2D(tInput, vec2(coord.x + delta.x, coord.y)).r - info.r,
      0.0
    );
    vec3 dy = vec3(
      0.0,
      texture2D(tInput, vec2(coord.x, coord.y + delta.y)).r - info.r,
      delta.y * 2.0 * poolLength
    );

    // Only the x and z components are stored; y is rebuilt from the unit length.
    info.ba = normalize(cross(dy, dx)).xz;

    gl_FragColor = info;
  }
`

const waterRippleShader = `
  precision highp float;

  const float PI = 3.141592653589793;

  uniform sampler2D tInput;
  uniform vec2 center;
  uniform float radius;
  uniform float strength;
  uniform float poolWidth;
  uniform float poolLength;
  varying vec2 coord;

  void main() {
    vec4 info = texture2D(tInput, coord);

    vec2 physicalDiff =
      (coord - (center * 0.5 + 0.5)) * 2.0 * vec2(poolWidth, poolLength);
    float physRadius = radius * 2.0 * poolLength;
    float drop = max(0.0, 1.0 - length(physicalDiff) / physRadius);

    // Raised cosine, so the ripple has no hard edge to alias against.
    drop = 0.5 - cos(drop * PI) * 0.5;
    info.r += drop * strength;

    gl_FragColor = info;
  }
`

const causticsVertexShader = `
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float poolHeight = 1.0;

  uniform vec3 light;
  uniform sampler2D water;
  uniform float poolWidth;
  uniform float poolLength;

  varying vec3 oldPos;
  varying vec3 newPos;

  ${causticLookupChunk}

  vec2 intersectCube(vec3 origin, vec3 r, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / r;
    vec3 tMax = (cubeMax - origin) / r;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }

  // Walks a light ray to the bed, continuing past a side wall if it hits one.
  vec3 project(vec3 origin, vec3 r, vec3 refractedLight) {
    vec2 tcube = intersectCube(
      origin,
      r,
      vec3(-poolWidth, -poolHeight, -poolLength),
      vec3(poolWidth, 2.0, poolLength)
    );
    origin += r * tcube.y;
    float tplane = (-origin.y - 1.0) / refractedLight.y;
    return origin + refractedLight * tplane;
  }

  void main() {
    vec4 info = texture2D(water, position.xy * 0.5 + 0.5);
    info.ba *= 0.5;

    vec2 slope = clamp(info.ba, vec2(-0.999), vec2(0.999));
    float slopeLengthSq = min(dot(slope, slope), 0.999);
    vec3 normal = normalize(
      vec3(slope.x, sqrt(max(0.001, 1.0 - slopeLengthSq)), slope.y)
    );

    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    vec3 ray = refract(-light, normal, IOR_AIR / IOR_WATER);

    vec3 surface = vec3(position.x * poolWidth, 0.0, position.y * poolLength);
    oldPos = project(surface, refractedLight, refractedLight);
    newPos = project(surface + vec3(0.0, info.r, 0.0), ray, refractedLight);

    gl_Position = vec4(
      causticUv(newPos, refractedLight, vec2(poolWidth, poolLength)) * 2.0 - 1.0,
      0.0,
      1.0
    );
  }
`

const causticsFragmentShader = `
  precision highp float;

  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float poolHeight = 1.0;

  uniform vec3 light;
  uniform float poolWidth;
  uniform float poolLength;

  varying vec3 oldPos;
  varying vec3 newPos;

  vec2 intersectCube(vec3 origin, vec3 r, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / r;
    vec3 tMax = (cubeMax - origin) / r;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }

  void main() {
    // Refraction squeezes the ray grid together where waves focus light, so the
    // ratio of the flat area to the deformed area is the caustic intensity.
    float oldArea = length(dFdx(oldPos)) * length(dFdy(oldPos));
    float newArea = length(dFdx(newPos)) * length(dFdy(newPos));
    gl_FragColor = vec4(oldArea / newArea * 0.2, 1.0, 0.0, 0.0);

    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    vec2 t = intersectCube(
      newPos,
      -refractedLight,
      vec3(-poolWidth, -poolHeight, -poolLength),
      vec3(poolWidth, 2.0, poolLength)
    );
    gl_FragColor.r *= 1.0 / (1.0 + exp(
      -200.0 / (1.0 + 10.0 * (t.y - t.x)) *
      (newPos.y - refractedLight.y * t.y - 2.0 / 12.0)
    ));
  }
`

const surfaceVertexShader = `
  uniform sampler2D water;
  uniform float poolWidth;
  uniform float poolLength;
  varying vec3 vPosition;

  void main() {
    vec4 info = texture2D(water, position.xy * 0.5 + 0.5);
    vPosition = vec3(position.x * poolWidth, info.r, position.y * poolLength);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
  }
`

const surfaceCommonShader = `
  precision highp float;

  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  // The reference tints these hard towards cyan for its blue pool tiles, which
  // would eat the sand's colour, so they are pulled back towards neutral. Green
  // stays below blue so the tank reads as blue water rather than teal.
  const vec3 abovewaterColor = vec3(0.74, 0.87, 1.0);
  const vec3 underwaterColor = vec3(0.66, 0.8, 1.0);
  const float poolHeight = 1.0;

  uniform vec3 light;
  uniform vec3 eye;
  uniform sampler2D water;
  uniform sampler2D tiles;
  uniform vec2 tilesRepeat;
  uniform sampler2D causticTex;
  uniform float poolWidth;
  uniform float poolLength;
  // A pre-rendered pass of the tank's contents, plus the matrix it was rendered
  // with. Ray-tracing the reef in here is not an option — it is hundreds of
  // instanced meshes — so the reference's projective lookup is used instead.
  uniform sampler2D capture;
  uniform mat4 captureMatrix;
  uniform float captureBlur;
  uniform float tankScale;
  uniform float tankOriginY;

  varying vec3 vPosition;

  // Tank extents to the reference's [-1, 1] square, for texture and grid lookups.
  vec2 normalisedXZ(vec3 point) {
    return point.xz / vec2(poolWidth, poolLength);
  }

  ${causticLookupChunk}

  vec2 intersectCube(vec3 origin, vec3 r, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / r;
    vec3 tMax = (cubeMax - origin) / r;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }

  // Stands in for the reference's sky cubemap.
  vec3 skyColor(vec3 ray) {
    float horizon = pow(1.0 - max(ray.y, 0.0), 2.0);
    return mix(vec3(0.03, 0.08, 0.22), vec3(0.11, 0.26, 0.6), horizon);
  }

  // The dark desktop seen through the glass side walls, matching the scene fog.
  const vec3 ROOM_COLOR = vec3(0.03, 0.05, 0.14);

  // The reference draws its pool floor with this same shading, so the two always
  // agree. Here the sand is a lit mesh instead, so the ray-traced bed has to be
  // brought up to the light budget the mesh receives or the water reads as a dark
  // patch over bright sand. Only a fallback now that the capture covers the bed.
  const float FLOOR_EXPOSURE = 3.0;

  // Shader space is normalised to water depths; the capture was rendered in world
  // space, so points have to be lifted back before they can be projected.
  vec3 toWorld(vec3 point) {
    return vec3(
      point.x * tankScale,
      point.y * tankScale + tankOriginY,
      point.z * tankScale
    );
  }

  // Alpha comes back as zero outside the capture's frame, which lets the caller
  // fall back to the traced floor rather than smearing the border pixel. The
  // fade is gradual because a hard cutoff put a visible sand-only band wherever
  // a bent ray left the frame, which is most obvious along the window edges.
  vec4 sampleCapture(vec3 point) {
    vec4 clip = captureMatrix * vec4(toWorld(point), 1.0);
    vec2 uv = (clip.xy / max(clip.w, 1.0e-6)) * 0.5 + 0.5;
    vec2 edge = min(uv, 1.0 - uv);
    float inBounds =
      smoothstep(0.0, 0.03, min(edge.x, edge.y)) * step(0.0, clip.w);
    return texture2D(capture, clamp(uv, 0.0, 1.0), captureBlur) * inBounds;
  }

  // Unlike the reference's tiled pool this tank is only sand on the bottom; the
  // four sides are glass, so a ray that reaches a wall leaves into the dark room.
  vec3 getFloorColor(vec3 point) {
    vec2 unit = normalisedXZ(point);
    vec3 sandColor = texture2D(tiles, (unit * 0.5 + 0.5) * tilesRepeat).rgb;

    float scale = 0.5 / length(point);
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, vec3(0.0, 1.0, 0.0)));
    vec4 caustic = texture2D(
      causticTex,
      causticUv(point, refractedLight, vec2(poolWidth, poolLength))
    );
    scale += diffuse * caustic.r * 2.0 * caustic.g;

    return sandColor * scale * FLOOR_EXPOSURE;
  }

  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    if (ray.y >= 0.0) {
      // Filled to the rim behind glass, so anything heading up leaves the tank.
      vec3 sky = skyColor(ray);
      return sky + vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
    }

    vec2 t = intersectCube(
      origin,
      ray,
      vec3(-poolWidth, -poolHeight, -poolLength),
      vec3(poolWidth, 2.0, poolLength)
    );
    vec3 hit = origin + ray * t.y;

    vec3 color;
    if (hit.y < -poolHeight + 0.01) {
      color = getFloorColor(hit);
    } else {
      // The ray met a side wall: it refracts through the glass into the dark
      // room behind the tank rather than seeing any sand.
      color = ROOM_COLOR;
    }

    // Whatever the capture holds at this point — coral, plants, rubble, or just
    // sand — stands in for the traced bed, which only ever knew about the floor.
    vec4 captured = sampleCapture(hit);
    color = mix(color, captured.rgb, captured.a);

    // Beer-Lambert style tint for the stretch travelled inside the water.
    return color * waterColor;
  }

  // Walks along the surface gradient so the displaced height is sampled at the
  // point the view ray actually meets, rather than straight down.
  vec4 sampleSurface(out vec2 coord) {
    coord = normalisedXZ(vPosition) * 0.5 + 0.5;
    vec4 info = texture2D(water, coord);
    for (int i = 0; i < ${SURFACE_PARALLAX_STEPS}; i++) {
      coord = clamp(coord + info.ba * 0.005, 0.0, 1.0);
      info = texture2D(water, coord);
    }
    return info;
  }

  vec3 surfaceNormal(vec4 info) {
    vec2 slope = clamp(info.ba, vec2(-0.999), vec2(0.999));
    float slopeLengthSq = min(dot(slope, slope), 0.999);
    return normalize(vec3(slope.x, sqrt(max(0.001, 1.0 - slopeLengthSq)), slope.y));
  }
`

const surfaceAboveShader = `
  ${surfaceCommonShader}

  void main() {
    vec2 coord;
    vec4 info = sampleSurface(coord);
    vec3 normal = surfaceNormal(info);

    vec3 incomingRay = normalize(vPosition - eye);
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
    float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));

    vec3 reflectedColor = getSurfaceRayColor(vPosition, reflectedRay, abovewaterColor);
    vec3 refractedColor = getSurfaceRayColor(vPosition, refractedRay, abovewaterColor);

    gl_FragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
  }
`

const surfaceBelowShader = `
  ${surfaceCommonShader}

  void main() {
    vec2 coord;
    vec4 info = sampleSurface(coord);
    // Seen from underneath, the interface faces down and light travels the other
    // way, so past the critical angle it turns into a mirror of the bed.
    vec3 normal = -surfaceNormal(info);

    vec3 incomingRay = normalize(vPosition - eye);
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
    float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));

    vec3 reflectedColor = getSurfaceRayColor(vPosition, reflectedRay, underwaterColor);
    vec3 refractedColor =
      getSurfaceRayColor(vPosition, refractedRay, vec3(1.0)) * vec3(0.78, 0.9, 1.18);

    // refract() returns zero under total internal reflection, collapsing this to
    // a pure reflection.
    gl_FragColor = vec4(
      mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay)),
      1.0
    );
  }
`

const wallCausticsVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vPosition = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const wallCausticsFragmentShader = `
  precision highp float;

  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;

  uniform vec3 light;
  uniform sampler2D causticTex;
  uniform vec2 pool;
  uniform float strength;
  varying vec3 vPosition;
  varying vec3 vNormal;

  ${causticLookupChunk}

  void main() {
    // The box is seen from inside, so its outward normals need flipping.
    vec3 inward = -normalize(vNormal);
    // The bed gets its bands by modulating the sand itself, so only the glass
    // sides are drawn additively here.
    if (abs(inward.y) > 0.5) discard;

    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    // The refracted light runs almost straight down, so a Lambert term would cut
    // a vertical wall to a quarter. Tile can afford that; clear glass cannot, so
    // the facing only tilts the bands rather than dimming them away.
    float facing = mix(0.55, 1.0, max(0.0, dot(refractedLight, inward)));
    vec2 uv = causticUv(vPosition, refractedLight, pool);
    vec4 caustic = texture2D(causticTex, uv);

    // Following the light slant from a wall can leave the area the caustics pass
    // actually rasterised, which would end in a hard lit rectangle; fade out as
    // the lookup approaches the texture border instead.
    vec2 edge = min(uv, 1.0 - uv);
    float coverage = smoothstep(0.0, 0.08, min(edge.x, edge.y));

    // Fade towards the waterline, otherwise the bands end in a hard bright seam.
    float depthFade = smoothstep(0.0, -0.22, vPosition.y);
    // Alpha stays at zero: the canvas is transparent so the page gradient shows
    // through, and writing alpha here would punch an opaque hole in it.
    gl_FragColor = vec4(
      vec3(0.36, 0.58, 1.0) *
        facing *
        caustic.r *
        caustic.g *
        strength *
        depthFade *
        coverage,
      0.0
    );
  }
`

interface WaterSystem {
  group: THREE.Group
  addDrop: (x: number, z: number, strength?: number, radius?: number) => void
  setFloorMap: (texture: THREE.Texture) => void
  /**
   * Lights a bed material through the wave simulation, so the focused bands and
   * the shadowed gaps between them come from the same caustics the walls use.
   */
  applyCaustics: (material: THREE.Material) => void
  /**
   * Keeps objects out of the capture passes. The tank's own shell belongs here:
   * it sits between the camera and the water, so leaving it in painted its bright
   * edges around the bed wherever a ray's floor hit projected onto the glass.
   */
  hideFromCapture: (...objects: THREE.Object3D[]) => void
  /**
   * Force the next frame to re-render the refraction/reflection captures. Useful
   * after rebuilding the reef; swimming fish do not need it — idle ticks already
   * refresh the soft water a few times a second.
   */
  invalidateCapture: () => void
  /**
   * The scene is needed as well as the camera: the surface shows the tank's
   * contents by sampling passes rendered from it, which cannot be ray-traced.
   */
  update: (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
  ) => { captureMs: number; simMs: number }
  dispose: () => void
}

export function createWaterSystem(
  renderer: THREE.WebGLRenderer,
  width: number,
  depth: number,
  surfaceY: number,
  floorY: number,
): WaterSystem {
  const halfWidth = width / 2
  const halfDepth = depth / 2
  const waterDepth = surfaceY - floorY
  // Everything is measured in water depths, which keeps the reference's
  // poolHeight = 1.0 while leaving the tank's proportions intact.
  const poolWidth = halfWidth / waterDepth
  const poolLength = halfDepth / waterDepth
  // One water depth by definition, matching the shaders' poolHeight.
  const poolHeightUnits = 1

  const light = new THREE.Vector3(-0.35, 0.88, 0.3).normalize()

  const simulationOptions: THREE.RenderTargetOptions = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    // Linear, not nearest: the surface magnifies this grid over the whole tank,
    // so unfiltered lookups showed the simulation's own texels as blocks. The
    // simulation passes only ever sample whole-texel offsets, which land on texel
    // centres either way, so interpolating here does not disturb them.
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  }
  let textureA = new THREE.WebGLRenderTarget(
    SIMULATION_SIZE,
    SIMULATION_SIZE,
    simulationOptions,
  )
  let textureB = textureA.clone()

  const causticsTarget = new THREE.WebGLRenderTarget(
    CAUSTICS_SIZE,
    CAUSTICS_SIZE,
    {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    },
  )

  const delta = new THREE.Vector2(1 / SIMULATION_SIZE, 1 / SIMULATION_SIZE)
  const passScene = new THREE.Scene()
  const passCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const passGeometry = new THREE.PlaneGeometry(2, 2)

  const makePassMaterial = (
    fragmentShader: string,
    extraUniforms: Record<string, THREE.IUniform> = {},
  ) =>
    new THREE.ShaderMaterial({
      vertexShader: passVertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
      uniforms: {
        tInput: { value: null },
        delta: { value: delta },
        poolWidth: { value: poolWidth },
        poolLength: { value: poolLength },
        ...extraUniforms,
      },
    })

  const simulationMaterial = makePassMaterial(waveSimulationShader)
  const normalMaterial = makePassMaterial(waterNormalShader)
  const rippleMaterial = makePassMaterial(waterRippleShader, {
    center: { value: new THREE.Vector2() },
    radius: { value: 0.03 },
    strength: { value: 0.01 },
  })

  const passMesh = new THREE.Mesh(passGeometry, simulationMaterial)
  passScene.add(passMesh)

  const runPass = (material: THREE.ShaderMaterial) => {
    passMesh.material = material
    material.uniforms.tInput.value = textureA.texture
    const previousTarget = renderer.getRenderTarget()
    renderer.setRenderTarget(textureB)
    renderer.render(passScene, passCamera)
    renderer.setRenderTarget(previousTarget)
    const swap = textureA
    textureA = textureB
    textureB = swap
  }

  const previousTarget = renderer.getRenderTarget()
  const previousClearColor = renderer.getClearColor(new THREE.Color())
  const previousClearAlpha = renderer.getClearAlpha()
  renderer.setClearColor(0x000000, 0)
  renderer.setRenderTarget(textureA)
  renderer.clear()
  renderer.setRenderTarget(textureB)
  renderer.clear()
  renderer.setRenderTarget(previousTarget)
  renderer.setClearColor(previousClearColor, previousClearAlpha)

  // The sand map doubles as the reference's pool tiles; stand in for it until it
  // loads so no sampler is left unbound.
  const fallbackTiles = new THREE.DataTexture(
    new Uint8Array([160, 143, 110, 255]),
    1,
    1,
  )
  fallbackTiles.needsUpdate = true

  const causticsScene = new THREE.Scene()
  const causticsMaterial = new THREE.ShaderMaterial({
    vertexShader: causticsVertexShader,
    fragmentShader: causticsFragmentShader,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
    uniforms: {
      light: { value: light },
      water: { value: textureA.texture },
      poolWidth: { value: poolWidth },
      poolLength: { value: poolLength },
    },
  })
  const causticsMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2, SURFACE_SEGMENTS, SURFACE_SEGMENTS),
    causticsMaterial,
  )
  causticsMesh.frustumCulled = false
  causticsScene.add(causticsMesh)

  // One pass from the viewer's camera feeds refraction through the surface; one
  // from the camera mirrored in the water plane feeds the underside's reflection.
  // Multisampling smooths the geometry edges inside the pass, and the mipmap
  // chain gives the surface shader something soft to sample from; without both,
  // magnifying the pass across the water shows stair-stepped edges.
  const captureOptions: THREE.RenderTargetOptions = {
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    samples: 2,
    depthBuffer: true,
    stencilBuffer: false,
  }
  const refractionTarget = new THREE.WebGLRenderTarget(
    REFRACTION_SIZE,
    REFRACTION_SIZE,
    captureOptions,
  )
  const reflectionTarget = new THREE.WebGLRenderTarget(
    REFLECTION_SIZE,
    REFLECTION_SIZE,
    captureOptions,
  )
  const viewProjection = new THREE.Matrix4()
  const reflectionViewProjection = new THREE.Matrix4()
  const refractionCamera = new THREE.PerspectiveCamera()
  const reflectionCamera = new THREE.PerspectiveCamera()
  // Refraction bends rays outward, so their floor hits often sit beyond what the
  // viewer's own frustum covers. Capturing a wider view keeps those hits inside
  // the texture instead of dropping them to the fallback near the window edges.
  const CAPTURE_MARGIN = 1.4

  const widenFrustum = (
    source: THREE.PerspectiveCamera,
    target: THREE.PerspectiveCamera,
  ) => {
    target.copy(source)
    target.fov = THREE.MathUtils.radToDeg(
      2 *
        Math.atan(
          Math.tan(THREE.MathUtils.degToRad(source.fov) / 2) * CAPTURE_MARGIN,
        ),
    )
    target.updateProjectionMatrix()
  }

  const surfaceUniforms = (
    capture: THREE.Texture,
    captureMatrix: THREE.Matrix4,
    captureBlur: number,
  ) => ({
    light: { value: light },
    eye: { value: new THREE.Vector3() },
    water: { value: textureA.texture },
    tiles: { value: fallbackTiles as THREE.Texture },
    tilesRepeat: { value: new THREE.Vector2(1, 1) },
    causticTex: { value: causticsTarget.texture },
    poolWidth: { value: poolWidth },
    poolLength: { value: poolLength },
    capture: { value: capture },
    captureMatrix: { value: captureMatrix },
    captureBlur: { value: captureBlur },
    tankScale: { value: waterDepth },
    tankOriginY: { value: surfaceY },
  })

  const surfaceGeometry = new THREE.PlaneGeometry(
    2,
    2,
    SURFACE_SEGMENTS,
    SURFACE_SEGMENTS,
  )
  // Mapping the grid's xy onto xz mirrors it, which flips the winding: the face
  // that reads as "front" is the underside, so the sides look inverted here.
  const aboveMaterial = new THREE.ShaderMaterial({
    vertexShader: surfaceVertexShader,
    fragmentShader: surfaceAboveShader,
    side: THREE.BackSide,
    // Looking down, the ray carries on into the tank, so the straight view of the
    // contents is the right stand-in.
    uniforms: surfaceUniforms(
      refractionTarget.texture,
      viewProjection,
      REFRACTION_BLUR,
    ),
  })
  const belowMaterial = new THREE.ShaderMaterial({
    vertexShader: surfaceVertexShader,
    fragmentShader: surfaceBelowShader,
    side: THREE.FrontSide,
    // Past the critical angle the underside mirrors the bed, which is exactly
    // what the camera mirrored in the water plane sees.
    uniforms: surfaceUniforms(
      reflectionTarget.texture,
      reflectionViewProjection,
      REFLECTION_BLUR,
    ),
  })
  const surfaceAbove = new THREE.Mesh(surfaceGeometry, aboveMaterial)
  const surfaceBelow = new THREE.Mesh(surfaceGeometry, belowMaterial)
  surfaceAbove.frustumCulled = false
  surfaceBelow.frustumCulled = false

  const wallCausticsMaterial = new THREE.ShaderMaterial({
    vertexShader: wallCausticsVertexShader,
    fragmentShader: wallCausticsFragmentShader,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    // Plain additive would multiply the colour by the alpha it writes, so the
    // factors are set explicitly to add light while leaving alpha alone.
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    uniforms: {
      light: { value: light },
      causticTex: { value: causticsTarget.texture },
      pool: { value: new THREE.Vector2(poolWidth, poolLength) },
      strength: { value: 1.0 },
    },
  })
  // Sits a hair inside the glass so the bands read as light on the walls rather
  // than z-fighting with them.
  const wallCaustics = new THREE.Mesh(
    new THREE.BoxGeometry(
      poolWidth * 2 - 0.004,
      poolHeightUnits,
      poolLength * 2 - 0.004,
    ),
    wallCausticsMaterial,
  )
  wallCaustics.position.y = -poolHeightUnits / 2
  wallCaustics.renderOrder = 1

  const group = new THREE.Group()
  group.add(wallCaustics, surfaceBelow, surfaceAbove)
  group.scale.setScalar(waterDepth)
  group.position.y = surfaceY

  const applyDrop = (x: number, z: number, strength: number, radius = 0.03) => {
    rippleMaterial.uniforms.center.value.set(x / halfWidth, z / halfDepth)
    rippleMaterial.uniforms.strength.value = strength
    rippleMaterial.uniforms.radius.value = radius
    runPass(rippleMaterial)
  }

  for (let i = 0; i < INITIAL_DROP_COUNT; i++) {
    applyDrop(
      random(-halfWidth, halfWidth, true),
      random(-halfDepth, halfDepth, true),
      i % 2 === 0 ? -AMBIENT_DROP_STRENGTH : AMBIENT_DROP_STRENGTH,
    )
  }

  const eye = new THREE.Vector3()
  const capturePosition = new THREE.Vector3()
  const captureDirection = new THREE.Vector3()
  const captureTarget = new THREE.Vector3()
  const previousClear = new THREE.Color()
  const excludedFromCapture: THREE.Object3D[] = []
  const excludedVisibility: boolean[] = []
  // Damping settles the surface within seconds, so a faint drip keeps the tank
  // alive instead of freezing into a mirror.
  let frame = 0

  // The reef is static, but fish will swim through the same captures, so a still
  // camera cannot freeze the texture forever. Orbiting is intermittent: capture
  // every frame while the view moves, and tick along every few frames while it
  // rests so swimmers still show up in the soft water without paying for a full
  // double-pass at 60 Hz.
  const IDLE_CAPTURE_INTERVAL = 3
  const lastCapturePosition = new THREE.Vector3()
  const lastCaptureQuaternion = new THREE.Quaternion()
  let idleFrames = 0
  let captureDirty = true
  const needsRecapture = (camera: THREE.PerspectiveCamera) => {
    camera.updateMatrixWorld()
    camera.getWorldPosition(capturePosition)
    const moved = capturePosition.distanceToSquared(lastCapturePosition) > 1e-6
    // dot near 1 means the orientations match; 0.999999 ≈ a tenth of a degree.
    const turned =
      Math.abs(camera.quaternion.dot(lastCaptureQuaternion)) < 0.999999
    if (captureDirty || moved || turned) {
      lastCapturePosition.copy(capturePosition)
      lastCaptureQuaternion.copy(camera.quaternion)
      captureDirty = false
      idleFrames = 0
      return true
    }
    idleFrames += 1
    if (idleFrames >= IDLE_CAPTURE_INTERVAL) {
      idleFrames = 0
      return true
    }
    return false
  }

  const renderCaptures = (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
  ) => {
    // Without this the surface would sample itself, and the straight-down pass
    // would see nothing but water.
    group.visible = false
    for (let i = 0; i < excludedFromCapture.length; i += 1) {
      excludedVisibility[i] = excludedFromCapture[i].visible
      excludedFromCapture[i].visible = false
    }
    const restoreTarget = renderer.getRenderTarget()
    renderer.getClearColor(previousClear)
    const restoreAlpha = renderer.getClearAlpha()
    // Cleared to transparent so the shader can tell "nothing here" from black.
    renderer.setClearColor(0x000000, 0)

    camera.updateMatrixWorld()
    widenFrustum(camera, refractionCamera)
    viewProjection.multiplyMatrices(
      refractionCamera.projectionMatrix,
      refractionCamera.matrixWorldInverse,
    )
    renderer.setRenderTarget(refractionTarget)
    renderer.clear()
    renderer.render(scene, refractionCamera)

    // Mirrored in the water plane rather than in y = 0, since the surface sits
    // near the top of the tank.
    camera.getWorldPosition(capturePosition)
    camera.getWorldDirection(captureDirection)
    captureTarget.copy(capturePosition).add(captureDirection)
    widenFrustum(camera, reflectionCamera)
    reflectionCamera.position.set(
      capturePosition.x,
      2 * surfaceY - capturePosition.y,
      capturePosition.z,
    )
    reflectionCamera.up.set(camera.up.x, -camera.up.y, camera.up.z)
    reflectionCamera.lookAt(
      captureTarget.x,
      2 * surfaceY - captureTarget.y,
      captureTarget.z,
    )
    reflectionCamera.updateMatrixWorld()
    reflectionViewProjection.multiplyMatrices(
      reflectionCamera.projectionMatrix,
      reflectionCamera.matrixWorldInverse,
    )
    renderer.setRenderTarget(reflectionTarget)
    renderer.clear()
    renderer.render(scene, reflectionCamera)

    renderer.setRenderTarget(restoreTarget)
    renderer.setClearColor(previousClear, restoreAlpha)
    for (let i = 0; i < excludedFromCapture.length; i += 1) {
      excludedFromCapture[i].visible = excludedVisibility[i]
    }
    group.visible = true
  }

  return {
    group,
    addDrop(x, z, strength = 0.01, radius = 0.03) {
      applyDrop(x, z, strength, radius)
    },
    setFloorMap(texture) {
      aboveMaterial.uniforms.tiles.value = texture
      belowMaterial.uniforms.tiles.value = texture
      aboveMaterial.uniforms.tilesRepeat.value.copy(texture.repeat)
      belowMaterial.uniforms.tilesRepeat.value.copy(texture.repeat)
    },
    hideFromCapture(...objects) {
      excludedFromCapture.push(...objects)
      captureDirty = true
    },
    invalidateCapture() {
      captureDirty = true
    },
    applyCaustics(material) {
      const previousOnBeforeCompile = material.onBeforeCompile
      const previousCacheKey = material.customProgramCacheKey
      material.customProgramCacheKey = () =>
        `${previousCacheKey?.call(material) ?? ''}|caustics`
      material.onBeforeCompile = (shader, renderer) => {
        previousOnBeforeCompile?.call(material, shader, renderer)
        shader.uniforms.causticTex = { value: causticsTarget.texture }
        shader.uniforms.causticLight = { value: light }
        shader.uniforms.causticPool = {
          value: new THREE.Vector2(poolWidth, poolLength),
        }
        shader.uniforms.causticSurfaceY = { value: surfaceY }
        shader.uniforms.causticDepth = { value: waterDepth }

        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
             varying vec3 vCausticWorld;`,
          )
          .replace(
            '#include <project_vertex>',
            `#include <project_vertex>
             {
               vec4 causticLocal = vec4(transformed, 1.0);
               #ifdef USE_INSTANCING
                 causticLocal = instanceMatrix * causticLocal;
               #endif
               vCausticWorld = (modelMatrix * causticLocal).xyz;
             }`,
          )

        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
             varying vec3 vCausticWorld;
             uniform sampler2D causticTex;
             uniform vec3 causticLight;
             uniform vec2 causticPool;
             uniform float causticSurfaceY;
             uniform float causticDepth;
             ${causticLookupChunk}`,
          )
          .replace(
            '#include <map_fragment>',
            `#include <map_fragment>
             {
               vec3 tankPoint = vec3(
                 vCausticWorld.x,
                 vCausticWorld.y - causticSurfaceY,
                 vCausticWorld.z
               ) / causticDepth;
               vec3 refractedLight =
                 -refract(-causticLight, vec3(0.0, 1.0, 0.0), 1.0 / 1.333);
               vec2 uv = causticUv(tankPoint, refractedLight, causticPool);
               vec2 edge = min(uv, 1.0 - uv);
               float coverage = smoothstep(0.0, 0.06, min(edge.x, edge.y));
               vec4 caustic = texture2D(causticTex, uv);
               diffuseColor.rgb *= mix(
                 1.0,
                 0.72 + caustic.r * caustic.g * 2.2,
                 coverage
               );
             }`,
          )
      }
      material.needsUpdate = true
    },
    update(camera, scene) {
      const captureStart = performance.now()
      const captured = needsRecapture(camera)
      if (captured) renderCaptures(camera, scene)
      const captureMs = captured ? performance.now() - captureStart : 0

      const simStart = performance.now()
      if (frame++ % AMBIENT_DROP_INTERVAL === 0) {
        applyDrop(
          random(-halfWidth, halfWidth, true),
          random(-halfDepth, halfDepth, true),
          random(1) === 0 ? -AMBIENT_DROP_STRENGTH : AMBIENT_DROP_STRENGTH,
        )
      }

      // One step per frame instead of the reference's two: the tank only carries
      // faint ambient motion, so halving the propagation speed costs nothing
      // visible and drops a third of the simulation work.
      runPass(simulationMaterial)
      runPass(normalMaterial)

      // The bands are broad and slow, so refreshing them every other frame is
      // indistinguishable while halving this pass.
      if (frame % CAUSTICS_INTERVAL === 0) {
        causticsMaterial.uniforms.water.value = textureA.texture
        const previousRenderTarget = renderer.getRenderTarget()
        const clearColor = renderer.getClearColor(new THREE.Color())
        const clearAlpha = renderer.getClearAlpha()
        renderer.setClearColor(0x000000, 0)
        renderer.setRenderTarget(causticsTarget)
        renderer.clear()
        renderer.render(causticsScene, passCamera)
        renderer.setRenderTarget(previousRenderTarget)
        renderer.setClearColor(clearColor, clearAlpha)
      }

      eye.copy(camera.position)
      group.worldToLocal(eye)
      for (const material of [aboveMaterial, belowMaterial]) {
        material.uniforms.water.value = textureA.texture
        material.uniforms.eye.value.copy(eye)
      }
      return { captureMs, simMs: performance.now() - simStart }
    },
    dispose() {
      textureA.dispose()
      textureB.dispose()
      causticsTarget.dispose()
      refractionTarget.dispose()
      reflectionTarget.dispose()
      fallbackTiles.dispose()
      passGeometry.dispose()
      simulationMaterial.dispose()
      normalMaterial.dispose()
      rippleMaterial.dispose()
      causticsMesh.geometry.dispose()
      causticsMaterial.dispose()
      surfaceGeometry.dispose()
      aboveMaterial.dispose()
      belowMaterial.dispose()
      wallCaustics.geometry.dispose()
      wallCausticsMaterial.dispose()
    },
  }
}
