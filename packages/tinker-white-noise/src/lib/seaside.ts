import seaside from '../assets/seaside.m4a'

// https://www.shadertoy.com/view/M3fGDl
const shader = `// afl_ext 2024
// This shader is 100% public domain (uses glsl-atmosphere, which is also public domain)

// For explanation about the wave function see my other shader here: https://www.shadertoy.com/view/MdXyzX

#define time (iTime * 0.6)
#define resolution iResolution.xy

#define DRAG_MULT 0.058
#define ITERATIONS_RAYMARCH 20
#define ITERATIONS_NORMAL 28
#define WATER_DEPTH 1.2 

// returns vec2 with wave height in X and its derivative in Y
vec2 wavedx(vec2 position, vec2 direction, float speed, float frequency, float timeshift) {
  float x = dot(direction, position) * frequency + timeshift * speed;
  float wave = exp(sin(x) - 1.0);
  float dx = wave * cos(x);
  return vec2(wave, -dx);
}

float getwaves(vec2 position, int iterations) {
  position *= 0.1;
  position += time * 0.1;
  float iter = 0.0;
  float phase = 6.0;
  float speed = 2.0;
  float weight = 1.0;
  float w = 0.0;
  float ws = 0.0;
  for (int i = 0; i < iterations; i++) {
    vec2 p = vec2(sin(iter), cos(iter));
    vec2 res = wavedx(position, p, speed, phase, time);
    position += p * res.y * weight * DRAG_MULT;
    w += res.x * weight;
    iter += 12.0;
    ws += weight;
    weight = mix(weight, 0.0, 0.2);
    phase *= 1.18;
    speed *= 1.07;
  }
  return (w / ws);
}

float raymarchwater(vec3 camera, vec3 start, vec3 end, float depth) {
  vec3 pos = start;
  float h = 0.0;
  float hupper = depth;
  float hlower = 0.0;
  vec2 zer = vec2(0.0);
  vec3 dir = normalize(end - start);
  for (int i = 0; i < 318; i++) {
    h = getwaves(pos.xz, ITERATIONS_RAYMARCH) * depth - depth;
    if (h + 0.001 > pos.y) {
      return distance(pos, camera);
    }
    pos += dir * (pos.y - h);
  }
  return -1.0;
}

float H = 0.0;
vec3 normal(vec2 pos, float e, float depth) {
  vec2 ex = vec2(e, 0);
  H = getwaves(pos.xy, ITERATIONS_NORMAL) * depth;
  vec3 a = vec3(pos.x, H, pos.y);
  return normalize(cross((a - vec3(pos.x - e, getwaves(pos.xy - ex.xy, ITERATIONS_NORMAL) * depth, pos.y)),
    (a - vec3(pos.x, getwaves(pos.xy + ex.yx, ITERATIONS_NORMAL) * depth, pos.y + e))));
}
mat3 rotmat(vec3 axis, float angle)
{
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat3(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c);
}
vec3 getRay(vec2 uv) {
  uv = (uv * 2.0 - 1.0) * vec2(resolution.x / resolution.y, 1.0);
  vec3 proj = normalize(vec3(uv.x, uv.y, 1.5));
  vec3 ray = rotmat(vec3(0.0, -1.0, 0.0), 3.1415 / 2.0) * rotmat(vec3(1.0, 0.0, 0.0), -0.2) * proj;
  return ray;
}

float rand2sTime(vec2 co) {
  co *= time;
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float intersectPlane(vec3 origin, vec3 direction, vec3 point, vec3 normal)
{
  return clamp(dot(point - origin, normal) / dot(direction, normal), -1.0, 9991999.0);
}
#define PI 3.141592
#define iSteps 16
#define jSteps 8

vec2 rsi(vec3 r0, vec3 rd, float sr) {
  // ray-sphere intersection that assumes
  // the sphere is centered at the origin.
  // No intersection when result.x > result.y
  float a = dot(rd, rd);
  float b = 2.0 * dot(rd, r0);
  float c = dot(r0, r0) - (sr * sr);
  float d = (b * b) - 4.0 * a * c;
  if (d < 0.0) return vec2(1e5, -1e5);
  return vec2(
    (-b - sqrt(d)) / (2.0 * a),
    (-b + sqrt(d)) / (2.0 * a)
  );
}

#define MieScattCoeff 2.0

struct Ray { vec3 o; vec3 d; };
struct Sphere { vec3 pos; float rad; };

float planetradius = 6378000.1;
float minhit = 0.0;
float maxhit = 0.0;
float rsi2(in Ray ray, in Sphere sphere)
{
  vec3 oc = ray.o - sphere.pos;
  float b = 2.0 * dot(ray.d, oc);
  float c = dot(oc, oc) - sphere.rad * sphere.rad;
  float disc = b * b - 4.0 * c;
  vec2 ex = vec2(-b - sqrt(disc), -b + sqrt(disc)) / 2.0;
  minhit = min(ex.x, ex.y);
  maxhit = max(ex.x, ex.y);
  return mix(ex.y, ex.x, step(0.0, ex.x));
}
vec3 atmosphere(vec3 r, vec3 r0, vec3 pSun, float iSun, float rPlanet, float rAtmos, vec3 kRlh, float kMie, float shRlh, float shMie, float g) {
  // Normalize the sun and view directions.
  pSun = normalize(pSun);
  r = normalize(r);
  r.y = max(0.08, r.y);

  // Calculate the step size of the primary ray.
  vec2 p = rsi(r0, r, rAtmos);
  if (p.x > p.y) return vec3(0, 0, 0);
  p.y = min(p.y, rsi(r0, r, rPlanet).x);
  float iStepSize = (p.y - p.x) / float(iSteps);
  float rs = rsi2(Ray(r0, r), Sphere(vec3(0), rAtmos));
  vec3 px = r0 + r * rs;
  //shMie *= ( (pow(fbmHI(px  ) * (supernoise3dX(px* 0.00000669 + time * 0.001)*0.5 + 0.5) * 1.3, 3.0) * 0.8 + 0.5));

  // Initialize the primary ray time.
  float iTime = 0.0;

  // Initialize accumulators for Rayleigh and Mie scattering.
  vec3 totalRlh = vec3(0, 0, 0);
  vec3 totalMie = vec3(0, 0, 0);

  // Initialize optical depth accumulators for the primary ray.
  float iOdRlh = 0.0;
  float iOdMie = 0.0;

  // Calculate the Rayleigh and Mie phases.
  float mu = dot(r, pSun);
  float mumu = mu * mu;
  float gg = g * g;
  float pRlh = 3.0 / (16.0 * PI) * (1.0 + mumu);
  float pMie = 3.0 / (8.0 * PI) * ((1.0 - gg) * (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) * (2.0 + gg));

  // Sample the primary ray.
  for (int i = 0; i < iSteps; i++) {
    // Calculate the primary ray sample position.
    vec3 iPos = r0 + r * (iTime + iStepSize * 0.5);

    // Calculate the height of the sample.
    float iHeight = length(iPos) - rPlanet;

    // Calculate the optical depth of the Rayleigh and Mie scattering for this step.
    float odStepRlh = exp(-iHeight / shRlh) * iStepSize;
    float odStepMie = exp(-iHeight / shMie) * iStepSize;

    // Accumulate optical depth.
    iOdRlh += odStepRlh;
    iOdMie += odStepMie;

    // Calculate the step size of the secondary ray.
    float jStepSize = rsi(iPos, pSun, rAtmos).y / float(jSteps);

    // Initialize the secondary ray time.
    float jTime = 0.0;

    // Initialize optical depth accumulators for the secondary ray.
    float jOdRlh = 0.0;
    float jOdMie = 0.0;

    // Sample the secondary ray.
    for (int j = 0; j < jSteps; j++) {
      // Calculate the secondary ray sample position.
      vec3 jPos = iPos + pSun * (jTime + jStepSize * 0.5);

      // Calculate the height of the sample.
      float jHeight = length(jPos) - rPlanet;

      // Accumulate the optical depth.
      jOdRlh += exp(-jHeight / shRlh) * jStepSize;
      jOdMie += exp(-jHeight / shMie) * jStepSize;

      // Increment the secondary ray time.
      jTime += jStepSize;
    }

    // Calculate attenuation.
    vec3 attn = exp(-(kMie * (iOdMie + jOdMie) + kRlh * (iOdRlh + jOdRlh)));

    // Accumulate scattering.
    totalRlh += odStepRlh * attn;
    totalMie += odStepMie * attn;

    // Increment the primary ray time.
    iTime += iStepSize;
  }

  // Calculate and return the final color.
  return iSun * (pRlh * kRlh * totalRlh + pMie * kMie * totalMie);
}
vec3 sd = normalize(vec3(1.0, 0.05, 0.0));
vec3 getatm(vec3 ray) {
  vec3 color = atmosphere(
    ray, // normalized ray direction
    vec3(0, 6372e3, 0), // ray origin
    sd, // position of the sun
    22.0, // intensity of the sun
    6371e3, // radius of the planet in meters
    6471e3, // radius of the atmosphere in meters
    vec3(3.5e-6, 10.0e-6, 28.0e-6), // Rayleigh scattering coefficient
    21e-6, // Mie scattering coefficient
    8e3, // Rayleigh scale height
    1.2e3 * MieScattCoeff, // Mie scale height
    0.758 // Mie preferred scattering direction
  );
  return color;
}

float sun(vec3 ray) {
  return pow(max(0.0, dot(ray, sd)), 1228.0) * 110.0;
}
float smart_inverse_dot(float dt, float coeff) {
  return 1.0 - (1.0 / (1.0 + dt * coeff));
}
#define VECTOR_UP vec3(0.0, 1.0, 0.0)
vec3 getSunColorDirectly(float roughness) {
  vec3 sunBase = vec3(15.0);

  float dt = max(0.0, (dot(sd, VECTOR_UP)));
  float dtx = smoothstep(-0.0, 0.1, dt);
  float dt2 = 0.9 + 0.1 * (1.0 - dt);
  float st = max(0.0, 1.0 - smart_inverse_dot(dt, 11.0));
  vec3 supersundir = max(vec3(0.0), vec3(1.0) - st * 4.0 * pow(vec3(50.0 / 255.0, 111.0 / 255.0, 153.0 / 255.0), vec3(2.4)));
  //    supersundir /= length(supersundir) * 1.0 + 1.0;
  return supersundir * 4.0;
  //return mix(supersundir * 1.0, sunBase, st);
  //return  max(vec3(0.3, 0.3, 0.0), (  sunBase - vec3(5.5, 18.0, 20.4) *  pow(1.0 - dt, 8.0)));
}
vec3 aces_tonemap(vec3 color) {
  mat3 m1 = mat3(
    0.59719, 0.07600, 0.02840,
    0.35458, 0.90834, 0.13383,
    0.04823, 0.01566, 0.83777
  );
  mat3 m2 = mat3(
    1.60475, -0.10208, -0.00327,
    -0.53108, 1.10813, -0.07276,
    -0.07367, -0.00605, 1.07602
  );
  vec3 v = m1 * color;
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return pow(clamp(m2 * (a / b), 0.0, 1.0), vec3(1.0 / 2.2));
}
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
  vec2 uv = fragCoord.xy / resolution.xy;
  float waterdepth = 1.2;
  vec3 wfloor = vec3(0.0, -waterdepth, 0.0);
  vec3 wceil = vec3(0.0, 0.0, 0.0);
  vec3 orig = vec3(0.0, 2.0, 0.0);
  vec3 ray = getRay(uv);

  float spherehit = rsi2(Ray(orig, ray), Sphere(vec3(-2.0, 3.0, 0.0), 1.0));
  float fff = 1.0;

  float hihit = intersectPlane(orig, ray, wceil, vec3(0.0, 1.0, 0.0));

  vec3 rrayX = vec3(ray.x, ray.y, ray.z);
  vec3 atmX = getatm(rrayX);
  vec3 SKY = atmX * 2.0 + sun(rrayX);
  if (ray.y >= 0.0) {
    fragColor = vec4(aces_tonemap(SKY), 1.0);
    return;
  }
  vec3 fullcolor = vec3(0.0);
  vec2 pixel = 1.0 / iResolution.xy;
  ray = getRay(uv);

  fff = 1.0;

  hihit = intersectPlane(orig, ray, wceil, vec3(0.0, 1.0, 0.0));

  float lohit = intersectPlane(orig, ray, wfloor, vec3(0.0, 1.0, 0.0));
  vec3 hipos = orig + ray * hihit;
  vec3 lopos = orig + ray * lohit;
  float dist = raymarchwater(orig, hipos, lopos, waterdepth);
  vec3 pos = orig + ray * dist;

  vec3 N = normal(pos.xz, 0.01, waterdepth);
  N = mix(N, VECTOR_UP, 0.8 * min(1.0, sqrt(dist * 0.01) * 1.1));
  vec2 velocity = N.xz * (1.0 - N.y);
  vec3 R = normalize(reflect(ray, N));
  vec3 RF = normalize(refract(ray, N, 0.66));
  R.y = abs(R.y);
  float fresnel = (0.04 + (1.0 - 0.04) * (pow(1.0 - max(0.0, dot(-N, ray)), 5.0)));

  vec3 atm = getatm(R);
  vec3 reflection = atm + sun(R);

  vec3 C = fresnel * (reflection) * 2.0;

  float superscat = pow(max(0.0, dot(RF, sd)), 16.0);
  C += vec3(0.1, 0.4, 1.0) * superscat * getSunColorDirectly(0.0) * 81.0 * (1.0 - 1.0 / (1.0 + 5.0 * max(0.0, dot(sd, VECTOR_UP))));
  vec3 waterSSScolor = vec3(0.0, 0.1, 0.8) * 0.171;
  C += waterSSScolor * getSunColorDirectly(0.0) * (0.3 + getwaves(pos.xz, ITERATIONS_RAYMARCH)) * waterdepth * 0.3 * max(0.0, dot(sd, VECTOR_UP));
  //tonemapping

  C *= fff * 0.5;
  C = mix(SKY, C, max(0.0, 1.0 - (1.0 / (abs(ray.y) * 200.0))));
  C = aces_tonemap(C);
  //fullcolor += C;

  fragColor = vec4(C, 1.0);
}`

const renderPass = [
  {
    inputs: [],
    outputs: [],
    code: shader,
    name: 'Image',
    description: '',
    type: 'image',
  },
]

export default { audio: seaside, renderPass }
