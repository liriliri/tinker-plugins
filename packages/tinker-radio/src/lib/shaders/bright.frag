precision mediump float;

uniform sampler2D uTex;

varying vec2 vUv;

void main() {
  vec3 c = texture2D(uTex, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(0.2, 0.48, l), 1.0);
}
