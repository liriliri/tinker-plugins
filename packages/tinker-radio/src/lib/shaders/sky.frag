precision mediump float;

uniform float uAspect;
uniform float uTime;
uniform float uMeteor;
uniform vec3 uSky;
uniform vec3 uGlow;
uniform vec3 uStar;
uniform vec3 uStreak;

varying vec2 vUv;

float hh(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float stars(vec2 q, float dens, float rad) {
  vec2 c = floor(q);
  float h1 = hh(c);
  if (h1 > dens) return 0.0;
  vec2 o = vec2(hh(c + 7.1), hh(c + 13.7)) - 0.5;
  float d = length(fract(q) - 0.5 - o * 0.6);
  float h2 = hh(c + 3.3);
  return smoothstep(rad, 0.0, d) *
    (0.35 + 0.65 * hh(c + 5.9)) *
    (0.55 + 0.45 * sin(uTime * (0.3 + h2 * 1.2) + h2 * 40.0));
}

float streak(vec2 p) {
  float period = 4.8;
  float n = floor(uTime / period);
  float age = uTime - n * period;
  float flight = 0.7;
  float vis = smoothstep(0.0, 0.04, age) * (1.0 - smoothstep(flight - 0.16, flight, age));
  float h1 = hh(vec2(n, 1.7));
  float h2 = hh(vec2(n, 4.2));
  float h3 = hh(vec2(n, 9.8));
  float side = h3 > 0.5 ? 1.0 : -1.0;
  float ang = -1.2 + (h1 - 0.5) * 0.55;
  vec2 dir = vec2(cos(ang) * side, sin(ang));
  vec2 origin = vec2((h2 - 0.5) * uAspect * 1.05, 0.02 + h1 * 0.46);
  vec2 head = origin + dir * clamp(age / flight, 0.0, 1.0) * (0.22 + h2 * 0.1);
  vec2 rel = p - head;
  float along = dot(rel, -dir);
  float across = abs(dot(rel, vec2(-dir.y, dir.x)));
  float len = 0.16 + h1 * 0.05;
  float tail = step(0.0, along) * (1.0 - smoothstep(len * 0.75, len, along));
  float line = exp(-pow(across * 1100.0, 2.0));
  return tail * line * (0.28 + smoothstep(0.006, 0.0, along) * 0.08) * vis;
}

void main() {
  vec2 p = vUv - 0.5;
  p.x *= uAspect;
  float g = exp(-dot(p, p) * 3.0);
  vec3 c = uSky + uGlow * g;
  vec2 s = vUv * vec2(uAspect, 1.0);
  float st =
    stars(s * 120.0 + uTime * vec2(0.02, 0.006), 0.16, 0.2) * 0.5 +
    stars(s * 70.0 + uTime * vec2(0.04, 0.012), 0.2, 0.14) +
    stars(s * 32.0 + uTime * vec2(0.05, 0.015), 0.11, 0.09) * 2.2;
  c += uStar * st;
  float m = streak(p);
  c += uStreak * m * uMeteor;
  gl_FragColor = vec4(c, 1.0);
}
