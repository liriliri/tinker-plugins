uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform vec3 uCam;
uniform float uPR;
uniform float uSel;
uniform float uLevel;
uniform float uTime;
uniform float uTwinkle;
uniform float uBand[64];

attribute vec3 aPos;
attribute float aPop;
attribute float aDen;
attribute float aIdx;
attribute float aSeed;
attribute float aBorn;

varying float vA;
varying float vSel;

float ease(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  float ie = ease(clamp((uTime - aBorn) / <%=ARRIVE%>, 0.0, 1.0));
  vec3 n = normalize(aPos);
  vec3 jitter = vec3(aSeed - 0.5, fract(aSeed * 13.1) - 0.5, fract(aSeed * 7.7) - 0.5);
  vec3 from = normalize(aPos + jitter * 2.0) * (<%=FAR_NEAR%> + aSeed * <%=FAR_SPAN%>);
  vec3 pos = mix(from, aPos, ie);
  float mid = sin(3.14159265 * ie);
  vec3 up = abs(n.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(n, up));
  vec3 lift = cross(n, side);
  pos += (side * sin(aSeed * 9.0) + lift * cos(aSeed * 5.0)) * mid * (<%=SWAY%> + aSeed * <%=SWAY_SPAN%>);
  vec3 world = (uModel * vec4(pos, 1.0)).xyz;
  vec3 wn = normalize((uModel * vec4(aPos, 0.0)).xyz);
  float face = smoothstep(-0.08, 0.28, dot(wn, normalize(uCam)));
  float back = mix(mix(0.05, 1.0, face), 1.0, 1.0 - ie);
  vec4 mv = uView * vec4(world, 1.0);
  gl_Position = uProj * mv;
  vSel = 1.0 - step(0.5, abs(aIdx - uSel));
  float seed = fract(sin(aIdx * 12.9898) * 43758.5453);
  float a = uBand[int(min(seed * 64.0, 63.0))];
  float live = clamp(uLevel, 0.0, 1.0);
  float tw = mix(0.4, 0.75, live);
  float shimmer = max(0.0, 1.0 - tw + tw * sin(uTwinkle * (0.3 + aSeed * 1.2) + aSeed * 40.0));
  float sz =
    (1.1 + aPop * 2.3) *
    (6.0 / -mv.z) *
    (1.0 + a * 0.7 * uLevel) *
    shimmer *
    mix(1.45, 1.0, ie) +
    vSel * (5.0 + uLevel * 2.0);
  gl_PointSize = clamp(sz * uPR, 1.0, 46.0);
  vA =
    ((0.16 + aPop * 0.7) * aDen * back * (1.0 + a * uLevel) * shimmer) *
    smoothstep(0.0, 0.35, ie) +
    vSel * 2.2;
}
