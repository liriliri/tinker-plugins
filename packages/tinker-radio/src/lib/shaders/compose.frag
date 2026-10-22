precision mediump float;

uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform sampler2D uWide;
uniform float uStrength;
uniform float uWideStrength;

varying vec2 vUv;

void main() {
  vec2 d = vUv - 0.5;
  float r2 = dot(d, d);
  vec2 o = d * 0.0022 * (0.35 + r2 * 2.6);
  vec3 scene = vec3(
    texture2D(uScene, vUv + o).r,
    texture2D(uScene, vUv).g,
    texture2D(uScene, vUv - o).b
  );
  scene += texture2D(uBloom, vUv).rgb * uStrength + texture2D(uWide, vUv).rgb * uWideStrength;
  scene *= 1.0 - smoothstep(0.28, 1.05, r2) * 0.22;
  gl_FragColor = vec4(scene, 1.0);
}
