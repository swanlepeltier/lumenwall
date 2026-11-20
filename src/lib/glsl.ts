export const MAX_LIGHTS = 24;

export const VERT_SRC = `#version 300 es
precision highp float;
const vec2 POS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(POS[gl_VertexID], 0.0, 1.0);
}
`;

export const FRAG_SRC = `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2  uRes;
uniform float uAspect;
uniform int   uCount;

uniform vec4  uLightPos[${MAX_LIGHTS}];   // x, y (0..1, y down), size (fraction of height), shape id
uniform vec3  uLightCol[${MAX_LIGHTS}];   // linear rgb
uniform vec2  uLightProp[${MAX_LIGHTS}];  // intensity, softness
uniform float uLightRot[${MAX_LIGHTS}];   // radians

uniform vec3  uBgA;
uniform vec3  uBgB;
uniform float uGradAngle;                 // radians
uniform float uMaster;

const float PI = 3.14159265359;

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdRing(vec2 p, float r, float w) {
  return abs(length(p) - r) - w;
}

float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// Equilateral triangle inscribed in a circle of radius r, pointing up.
float sdTriangle(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) {
    p = vec2(p.x - k * p.y, -k * p.x - p.y) * 0.5;
  }
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}

void main() {
  vec2 fragYDown = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = fragYDown / uRes;              // 0..1, y down
  vec2 centred = (uv - 0.5) * vec2(uAspect, 1.0);

  // ---- background -------------------------------------------------------
  vec2 dir = vec2(cos(uGradAngle), sin(uGradAngle));
  float g = dot(uv - 0.5, dir) + 0.5;
  vec3 bg = mix(uBgA, uBgB, smoothstep(0.0, 1.0, clamp(g, 0.0, 1.0)));
  // Very slight vignette: a flat panel photographed head-on reads a bit lifeless.
  vec2 norm = centred / (vec2(uAspect, 1.0) * 0.5);
  bg *= 1.0 - 0.12 * dot(norm, norm);

  vec3 acc = vec3(0.0);

  // ---- lights -----------------------------------------------------------
  for (int i = 0; i < ${MAX_LIGHTS}; i++) {
    if (i >= uCount) break;

    vec4 L = uLightPos[i];
    float intensity = uLightProp[i].x;
    float soft = clamp(uLightProp[i].y, 0.0, 1.0);
    float size = max(L.z, 0.004);

    vec2 p = (fragYDown - L.xy * uRes) / uRes.y;
    float d;

    int shape = int(L.w + 0.5);
    if (shape == 0) {
      d = sdCircle(p, size);
    } else if (shape == 1) {
      d = sdRing(p, size * 0.78, max(size * 0.1, 0.004));
    } else if (shape == 2) {
      d = sdBox(rot(-uLightRot[i]) * p, vec2(size), size * 0.18);
    } else if (shape == 3) {
      vec2 q = rot(-uLightRot[i]) * p;
      d = sdTriangle(vec2(q.x, -q.y), size);
    } else {
      d = sdBox(rot(-uLightRot[i]) * p, vec2(size * 2.4, size * 0.55), size * 0.5);
    }

    // Solid core with a feathered edge, plus a softer radial falloff inside so
    // the disc reads as a diffuser rather than a flat sticker.
    float feather = mix(0.0015, 0.05 + size * 0.22, soft);
    float core = 1.0 - smoothstep(-feather, feather, d);
    float inner = exp(min(d, 0.0) * (0.55 / max(size, 0.02)));

    // Bloom: what actually bounces onto the talent's face.
    float haloR = max(0.008, size * (0.09 + 0.5 * soft));
    float halo = exp(-max(d, 0.0) / haloR);

    acc += uLightCol[i] * intensity *
           (core * (0.6 + 0.4 * inner) + halo * (0.12 + 0.26 * soft));
  }

  // ---- grade ------------------------------------------------------------
  vec3 col = bg + acc;
  col *= uMaster;
  // Photographic shoulder: keeps big soft lights from clipping into flat blobs.
  col = 1.0 - exp(-col * 1.35);

  // Ordered-ish dither. Large soft gradients band badly on 49" panels, and
  // a camera loves to show it.
  float grain = hash21(fragYDown + 0.37) - 0.5;
  col += grain / 255.0;

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
