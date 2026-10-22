uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform vec3 uCam;
uniform float uPR;

attribute vec3 aPos;
varying float vF;

void main() {
  vec3 world = (uModel * vec4(aPos, 1.0)).xyz;
  vec3 wn = normalize((uModel * vec4(aPos, 0.0)).xyz);
  vF = smoothstep(-0.05, 0.35, dot(wn, normalize(uCam)));
  vec4 mv = uView * vec4(world, 1.0);
  gl_PointSize = 2.05 * uPR * (6.0 / -mv.z);
  gl_Position = uProj * mv;
}
