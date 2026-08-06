export const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_unwind;
uniform float u_screw;

const float TAU = 6.2831853;

// Exact user hex / 255
const vec3 C_MINT   = vec3(0.662745, 0.886275, 0.698039); // A9E2B2
const vec3 C_HOT    = vec3(0.972549, 0.286275, 0.490196); // F8497D
const vec3 C_VIOLET = vec3(0.329412, 0.133333, 0.949020); // 5422F2
const vec3 C_CYAN   = vec3(0.674510, 0.929412, 0.992157); // ACEDFD
const vec3 C_MAG    = vec3(0.976471, 0.439216, 0.976471); // F970F9
const vec3 C_PEACH  = vec3(0.984314, 0.721569, 0.639216); // FBB8A3
const vec3 C_LIGHT  = vec3(1.000000, 0.901961, 0.988235); // FFE6FC

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) {
    v += a * valueNoise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

float circDist(float a, float b) {
  float d = abs(a - b);
  return min(d, 1.0 - d);
}

float bump(float t, float center, float width, float strength) {
  float d = circDist(t, center);
  float w = exp(-pow(d / width, 2.0));
  return w * strength;
}

vec3 boostSaturation(vec3 c, float sat) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return clamp(mix(vec3(l), c, sat), 0.0, 1.0);
}

// Seamless palette — wider bumps = smoother, cleaner blends
vec3 brandPalette(float t) {
  t = t - floor(t);

  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  float w;

  w = bump(t, 0.00, 0.078, 1.1); wsum += w; acc += w * C_CYAN;
  w = bump(t, 0.09, 0.072, 1.05); wsum += w; acc += w * C_MINT;
  w = bump(t, 0.17, 0.070, 1.05); wsum += w; acc += w * C_PEACH;
  w = bump(t, 0.24, 0.065, 1.1);  wsum += w; acc += w * C_HOT;
  w = bump(t, 0.30, 0.062, 1.05); wsum += w; acc += w * C_VIOLET;

  w = bump(t, 0.40, 0.105, 2.3); wsum += w; acc += w * C_LIGHT;
  w = bump(t, 0.52, 0.110, 3.4); wsum += w; acc += w * C_MAG;
  // Cool bleed inside pink band (subtle cyan on “opposite” sweep)
  w = bump(t, 0.46, 0.115, 0.55); wsum += w; acc += w * C_CYAN;
  w = bump(t, 0.55, 0.105, 0.48); wsum += w; acc += w * C_MINT;
  w = bump(t, 0.64, 0.100, 2.1); wsum += w; acc += w * C_LIGHT;
  w = bump(t, 0.70, 0.100, 0.45); wsum += w; acc += w * C_CYAN;
  w = bump(t, 0.74, 0.095, 3.2); wsum += w; acc += w * C_MAG;

  w = bump(t, 0.84, 0.068, 1.1); wsum += w; acc += w * C_VIOLET;
  w = bump(t, 0.93, 0.072, 1.05); wsum += w; acc += w * C_CYAN;

  return boostSaturation(acc / max(wsum, 1e-4), 1.1);
}

float sdAnnulus(vec2 p, float outerR, float innerR) {
  float d = length(p);
  return max(d - outerR, innerR - d);
}

float sdCircle(vec2 p, vec2 c, float r) {
  return length(p - c) - r;
}

const float ARC_START = 0.26;
const float ARC_END = 5.74;
const float HELIX_TURNS = 2.35;
const float HELIX_HEIGHT = 0.96;
const int COIL_SEGS = 256;

vec3 rotateX3(vec3 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
}

vec3 rotateY3(vec3 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

vec3 viewPt(vec3 pt, float morph) {
  float m = smoothstep(0.08, 0.85, morph);
  pt = rotateX3(pt, 0.78 * m);
  pt = rotateY3(pt, -0.52 * m);
  return pt;
}

vec3 curvePoint(float t, float midR, float morph, float screw) {
  float arcAng = mix(ARC_START, ARC_END, t);
  vec3 planar = vec3(midR * cos(arcAng), midR * sin(arcAng), 0.0);

  float wind = screw * smoothstep(0.35, 1.0, morph);
  float u = t * HELIX_TURNS * TAU + wind * 1.25;
  float helixR = midR * 0.54;
  float z = (t - 0.5) * HELIX_HEIGHT;
  vec3 helix = vec3(helixR * cos(u), helixR * sin(u), z);

  float coilScale = mix(1.0, 0.82, smoothstep(0.0, 1.0, morph));
  helix *= coilScale;

  float m = smoothstep(0.0, 1.0, morph);
  return mix(planar, helix, m);
}

vec2 projectPt(vec3 q, float morph) {
  q = viewPt(q, morph);
  vec2 ortho = q.xy;
  float depth = 2.08 - q.z * 0.72;
  vec2 persp = q.xy / max(0.72, depth);
  float perspAmt = smoothstep(0.1, 0.82, morph) * 0.62;
  return mix(ortho, persp, perspAmt);
}

float tubeScreenRadius(float tubeR, float zView, float morph) {
  float depth = max(0.72, 2.08 - zView * 0.72);
  return mix(tubeR, tubeR / depth, smoothstep(0.1, 0.82, morph) * 0.62);
}

float sdCapsule2D(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 ba = b - a;
  float len2 = dot(ba, ba);
  if (len2 < 1e-10) return length(p - a) - ra;
  float len = sqrt(len2);
  vec2 dir = ba / len;
  float h = clamp(dot(p - a, dir) / len, 0.0, 1.0);
  vec2 q = a + dir * (h * len);
  return length(p - q) - mix(ra, rb, h);
}

// Returns: x=dist, y=smooth t along curve, z=view depth, w=unused (0.5)
vec4 distToCoilTube(vec2 p, float midR, float outerR, float innerR, float morph, float screw) {
  float tubeR = (outerR - innerR) * 0.5;
  float dMin = 1e9;
  float tAcc = 0.0;
  float zAcc = 0.0;
  float wSum = 0.0;
  float fallbackT = 0.0;
  float fallbackZ = 0.0;
  float closestD = 1e9;

  float invVar = 1.0 / (tubeR * tubeR * 0.16);

  float t0 = 0.0;
  vec3 pt0 = curvePoint(t0, midR, morph, screw);
  vec3 v0 = viewPt(pt0, morph);
  vec2 s0 = projectPt(pt0, morph);
  float r0 = tubeScreenRadius(tubeR, v0.z, morph);

  for (int i = 1; i <= COIL_SEGS; i++) {
    float t1 = float(i) / float(COIL_SEGS);
    vec3 pt1 = curvePoint(t1, midR, morph, screw);
    vec3 v1 = viewPt(pt1, morph);
    vec2 s1 = projectPt(pt1, morph);
    float r1 = tubeScreenRadius(tubeR, v1.z, morph);

    vec2 ba = s1 - s0;
    float len2 = dot(ba, ba);
    float h = 0.5;
    if (len2 > 1e-10) {
      float len = sqrt(len2);
      vec2 dir = ba / len;
      h = clamp(dot(p - s0, dir) / len, 0.0, 1.0);
    }
    float zMid = mix(v0.z, v1.z, h);
    float tMid = mix(t0, t1, h);

    float d = sdCapsule2D(p, s0, s1, r0, r1);

    dMin = min(dMin, d);

    if (d < closestD) {
      closestD = d;
      fallbackT = tMid;
      fallbackZ = zMid;
    }

    float w = exp(-max(d, 0.0) * max(d, 0.0) * invVar);
    w += smoothstep(tubeR * 0.95, -tubeR * 0.25, d) * 0.7;
    w *= exp(zMid * 3.0);
    tAcc += tMid * w;
    zAcc += zMid * w;
    wSum += w;

    pt0 = pt1;
    v0 = v1;
    s0 = s1;
    r0 = r1;
    t0 = t1;
  }

  float bestT = fallbackT;
  float bestZ = fallbackZ;
  if (wSum > 1e-6) {
    bestT = tAcc / wSum;
    bestZ = zAcc / wSum;
  }

  return vec4(dMin, bestT, bestZ, 0.5);
}

void main() {
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = (v_uv - 0.5) * aspect;

  float outerR = 0.355;
  float innerR = 0.238;
  float dist = length(p);
  float midR = (innerR + outerR) * 0.5;
  float capR = (outerR - innerR) * 0.52;

  float screenAngle = atan(p.y, p.x);
  screenAngle = mod(screenAngle + TAU, TAU);

  // Open coil (2D) — used at rest; morphs into 3D helix tube
  vec2 capStartC = vec2(midR * cos(ARC_START), midR * sin(ARC_START));
  vec2 capEndC = vec2(midR * cos(ARC_END), midR * sin(ARC_END));

  float ring = sdAnnulus(p, outerR, innerR);
  float inArcCoil =
    smoothstep(ARC_START - 0.035, ARC_START + 0.015, screenAngle)
    * (1.0 - smoothstep(ARC_END - 0.015, ARC_END + 0.035, screenAngle));

  float morph = smoothstep(0.0, 1.0, u_unwind);
  float geomBlend = smoothstep(0.14, 0.52, morph);
  float shadeBlend = smoothstep(0.1, 0.48, morph);

  float bodySdf = mix(1.0, ring, inArcCoil);
  float startCapSdf = sdCircle(p, capStartC, capR);
  float endCapSdf = sdCircle(p, capEndC, capR);
  float capsSdf = min(startCapSdf, endCapSdf);
  float sdf2d = min(bodySdf, capsSdf);

  float sdf3d = sdf2d;
  float bestT = 0.0;
  float bestZ = 0.0;
  if (geomBlend > 0.001) {
    vec4 tubeHit = distToCoilTube(p, midR, outerR, innerR, morph, u_screw);
    sdf3d = tubeHit.x;
    bestT = tubeHit.y;
    bestZ = tubeHit.z;
  }

  float snakeSdf = mix(sdf2d, sdf3d, geomBlend);

  float inStartCap = smoothstep(0.002, -0.002, startCapSdf) * (1.0 - geomBlend);
  float inEndCap = smoothstep(0.002, -0.002, endCapSdf) * (1.0 - geomBlend);

  float radialNorm2d = clamp((dist - innerR) / (outerR - innerR), 0.0, 1.0);
  radialNorm2d = mix(radialNorm2d, 0.52 + 0.28 * (length(p - capStartC) / capR), inStartCap * 0.85);
  radialNorm2d = mix(radialNorm2d, 0.48 + 0.26 * (length(p - capEndC) / capR), inEndCap * 0.85);

  float sweepAngle2d = screenAngle;
  float sweepAngle3d = screenAngle;
  float sweepAngle = mix(sweepAngle2d, sweepAngle3d, shadeBlend);

  float edgeProximity = 1.0 - sin(radialNorm2d * 3.14159265);
  float edgeDetail = smoothstep(0.08, 0.72, edgeProximity);
  edgeDetail *= 1.0 - shadeBlend * 0.92;

  float wobble = (fbm(p * 1.6 + vec2(u_time * 0.07, -u_time * 0.045)) - 0.5) * 0.032;
  wobble *= 1.0 - shadeBlend * 0.55;

  vec2 diag = vec2(0.78, 0.48);
  float c = cos(0.48);
  float sn = sin(0.48);
  vec2 pr = vec2(c * p.x - sn * p.y, sn * p.x + c * p.y);

  float phase2d =
    screenAngle / TAU
    + radialNorm2d * (0.15 + edgeDetail * 0.1)
    + dot(p, diag) * 0.14
    + pr.y * 0.1
    + wobble
    + u_time * 0.058;

  float phase3d =
    bestT * (HELIX_TURNS * 1.22)
    - u_screw * 0.05 * shadeBlend
    + dot(p, diag) * 0.10
    + pr.y * 0.06
    + wobble
    + u_time * 0.034;

  float phase = mix(phase2d, phase3d, shadeBlend);

  vec3 iridescent = brandPalette(phase);
  vec3 iridescentSoft = brandPalette(phase + 0.06);
  iridescent = mix(iridescent, iridescentSoft, mix(0.22, 0.48, shadeBlend));
  vec3 iridescentWide = brandPalette(phase + 0.11);
  iridescent = mix(iridescent, mix(iridescent, iridescentWide, 0.45), shadeBlend * 0.38);

  // Top-left: soft ACEDFD / A9E2B2 (vs cyan-heavy bottom-right)
  float oppCool = 0.5 + 0.5 * cos(sweepAngle - 2.35619449);
  vec3 coolBleed = mix(C_CYAN, C_MINT, 0.38);
  iridescent = mix(iridescent, mix(iridescent, coolBleed, 0.58), oppCool * 0.2 * (1.0 - shadeBlend * 0.75));

  // Top (11–1 o'clock), outer rim — subtle ACEDFD / A9E2B2
  float topArc = exp(-pow((sweepAngle - 1.57079633) / 0.4, 2.0));
  float outerRim = smoothstep(0.52, 0.94, radialNorm2d);
  float topOuterCool = topArc * outerRim * (1.0 - shadeBlend * 0.85);
  vec3 topBleed = mix(C_CYAN, C_MINT, 0.4);
  iridescent = mix(iridescent, mix(iridescent, topBleed, 0.52), topOuterCool * 0.3);

  // Slightly cooler tone on rounded ends (connected caps)
  float inCap = max(inStartCap, inEndCap);
  iridescent = mix(iridescent, mix(iridescent, mix(C_CYAN, C_MINT, 0.35), 0.62), inCap * 0.28);

  float tube2d = 0.94 + 0.06 * sin(radialNorm2d * 3.14159265);
  float tube3d = 1.0;
  float tube = mix(tube2d, tube3d, shadeBlend);
  tube *= mix(1.0, 0.94 + 0.06 * smoothstep(-0.55, 0.55, bestZ), shadeBlend * 0.28);
  iridescent *= tube;

  float rimShine = edgeDetail * pow(max(dot(normalize(p + 1e-5), normalize(vec2(-0.35, 0.55))), 0.0), 5.0);
  rimShine *= mix(1.0, 0.08, shadeBlend);
  iridescent = mix(iridescent, mix(C_CYAN, C_MAG, 0.55), rimShine * mix(0.1, 0.025, shadeBlend));

  float spec = pow(max(dot(normalize(p + 1e-5), normalize(vec2(-0.35, 0.55))), 0.0), 3.0);
  spec *= mix(1.0, 0.08, shadeBlend);
  iridescent = mix(iridescent, mix(C_LIGHT, C_MAG, 0.55), spec * mix(0.07, 0.018, shadeBlend));

  iridescent = boostSaturation(iridescent, mix(1.3, 1.06, shadeBlend));
  iridescent = mix(iridescent, mix(iridescent, C_LIGHT, 0.22), shadeBlend * 0.18);

  // Crisp ring mask (~1px AA, no fwidth — works on all WebGL1/2)
  float px = 2.0 / min(u_resolution.x, u_resolution.y);
  float aa = px * 0.9;
  float mask = smoothstep(aa, -aa, snakeSdf);

  gl_FragColor = vec4(iridescent * mask, 1.0);
}
`;
