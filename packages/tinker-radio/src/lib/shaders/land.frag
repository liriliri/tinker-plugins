precision mediump float;

uniform vec3 uColor;
uniform float uGain;
uniform float uAdd;

varying float vF;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (length(c) > 0.5) discard;
  float a = vF * uGain;
  if (uAdd > 0.5) gl_FragColor = vec4(uColor * a, 1.0);
  else gl_FragColor = vec4(uColor, a);
}
