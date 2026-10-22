precision mediump float;

uniform float uAspect;
uniform float uRadius;
uniform vec2 uCenter;
uniform vec3 uHaze;

varying vec2 vUv;

void main() {
  vec2 p = vUv - uCenter;
  p.x *= uAspect;
  float d = length(p) / max(uRadius, 0.001);
  float h = smoothstep(1.04, 0.42, d);
  gl_FragColor = vec4(uHaze * h, 1.0);
}
