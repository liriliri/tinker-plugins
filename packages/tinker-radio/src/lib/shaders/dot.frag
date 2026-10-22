precision mediump float;

uniform vec3 uStation;
uniform vec3 uActive;
uniform float uAdd;

varying float vA;
varying float vSel;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.0, r);
  soft *= soft;
  float solid = smoothstep(0.42, 0.0, r);
  float a = mix(soft, solid, vSel);
  vec3 col = mix(uStation, uActive, vSel);
  float k = vA * a;
  if (uAdd > 0.5) gl_FragColor = vec4(col * k, 1.0);
  else gl_FragColor = vec4(col, k);
}
