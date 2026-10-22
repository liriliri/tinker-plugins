precision mediump float;

uniform sampler2D uTex;
uniform vec2 uDir;

varying vec2 vUv;

void main() {
  vec3 c = texture2D(uTex, vUv).rgb * 0.227;
  c += texture2D(uTex, vUv + uDir * 1.6).rgb * 0.194;
  c += texture2D(uTex, vUv - uDir * 1.6).rgb * 0.194;
  c += texture2D(uTex, vUv + uDir * 3.8).rgb * 0.122;
  c += texture2D(uTex, vUv - uDir * 3.8).rgb * 0.122;
  c += texture2D(uTex, vUv + uDir * 6.4).rgb * 0.07;
  c += texture2D(uTex, vUv - uDir * 6.4).rgb * 0.07;
  gl_FragColor = vec4(c, 1.0);
}
