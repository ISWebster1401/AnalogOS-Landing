/* Halftone Nebula (after "halftone-nebula" on 21st.dev), ported to plain WebGL2 for AnalogOS.
   The landing has no build step, so this replaces the React wrapper with
   AnalogNebula(container, {root, params}) -> {destroy}. Palette: AnalogOS navy / blue / orange.
   Pauses offscreen and with the tab hidden, freezes on one frame under prefers-reduced-motion,
   falls back to a CSS gradient without WebGL2. */
(function () {
  if (window.AnalogNebula) return;
  var MAX_SPARKS = 16, MAX_RIPPLES = 4;

  var DEFAULTS = {
    pixel: 6, dotMin: 0.12, dotMax: 0.56, levels: 7,
    scale: 1.7, warp: 1.5, drift: 0.035, density: 0.42, threshold: 0.56, softness: 0.5,
    band: 0.5, bandAngle: 2.6, bandOffset: 0.3, bandWidth: 0.34, haze: 0.75,
    stars: 1, twinkle: 1.4, starDrift: 1.2, sparkles: 8, seed: 11, spikeWidth: 1,
    planet: false, planetX: 0.74, planetY: 0.2, planetRadius: 0.075,
    parallax: 1, lens: 0.55, lensRadius: 170, lensPush: 0.3, rippleSpeed: 420,
    speed: 1, vignette: 0.5, grain: 0.03,
    // AnalogOS palette, dark to bright: navy #02070A -> blue #0297DE -> orange #FC734D
    voidColor: '#02070A', hazeColor: '#05182A', duskColor: '#0A2440', wineColor: '#064A72',
    crimsonColor: '#0297DE', hotColor: '#FC734D', starColor: '#F2F4F5'
  };

  var UNIFORMS = [
    ['pixel', 'f'], ['dotMin', 'f'], ['dotMax', 'f'], ['levels', 'f'],
    ['scale', 'f'], ['warp', 'f'], ['drift', 'f'], ['density', 'f'], ['threshold', 'f'], ['softness', 'f'],
    ['band', 'f'], ['bandAngle', 'f'], ['bandOffset', 'f'], ['bandWidth', 'f'], ['haze', 'f'],
    ['stars', 'f'], ['twinkle', 'f'], ['starDrift', 'f'], ['spikeWidth', 'f'],
    ['parallax', 'f'], ['lens', 'f'], ['lensRadius', 'f'], ['lensPush', 'f'], ['rippleSpeed', 'f'],
    ['vignette', 'f'], ['grain', 'f'],
    ['voidColor', 'c'], ['hazeColor', 'c'], ['duskColor', 'c'], ['wineColor', 'c'],
    ['crimsonColor', 'c'], ['hotColor', 'c'], ['starColor', 'c']
  ];
  function uName(k) { return 'u' + k.charAt(0).toUpperCase() + k.slice(1); }
  function declare(slots) {
    return slots.map(function (s) { return 'uniform ' + (s[1] === 'c' ? 'vec3' : 'float') + ' ' + uName(s[0]) + ';'; }).join('\n');
  }
  var VERT = '#version 300 es\nvoid main(){\n  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));\n  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);\n}';
var FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerOn;
uniform vec2 uLook;
uniform int uSparkCount;
uniform vec4 uSpark[${MAX_SPARKS}];
uniform vec4 uSparkB[${MAX_SPARKS}];
uniform vec4 uRipple[${MAX_RIPPLES}];
uniform vec4 uPlanet;
${declare(UNIFORMS)}
out vec4 frag;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i), b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = r * p * 2.03 + 17.1; a *= 0.5; }
  return s / 0.96875;
}
float bayer4(vec2 c){
  vec2 m = mod(c, 4.0);
  int i = int(m.x) + int(m.y) * 4;
  int b[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(b[i]) + 0.5) / 16.0;
}
vec3 ramp(float d, vec3 haze){
  vec3 c = mix(uVoidColor, haze, smoothstep(0.0, 0.22, d));
  c = mix(c, uWineColor, smoothstep(0.18, 0.44, d));
  c = mix(c, uCrimsonColor, smoothstep(0.42, 0.72, d));
  return mix(c, uHotColor, smoothstep(0.7, 0.96, d));
}
vec2 shift(float depth){
  return floor(uLook * uParallax * depth * 28.0);
}

// Density of the gas at a CSS-pixel position: x = density, y = haze, z = tone.
vec3 field(vec2 pos, vec2 resCss){
  float minSide = min(resCss.x, resCss.y);
  vec2 uv = (pos - 0.5 * resCss) / minSide;
  vec2 p = uv * uScale + uLook * uParallax * 0.05;

  vec2 toP = pos - uPointer;
  float lamp = exp(-dot(toP, toP) / (uLensRadius * uLensRadius)) * uPointerOn;
  p += toP / minSide * lamp * uLensPush * uScale;

  float ring = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipple[i];
    float age = uTime - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 2.4) continue;
    vec2 dv = pos - r.xy;
    float dist = length(dv);
    float w = 14.0 + age * 26.0;
    float k = exp(-pow((dist - age * uRippleSpeed) / w, 2.0)) * (1.0 - age / 2.4) * r.w;
    ring += k;
    p += dv / max(dist, 1.0) * k * 0.12;
  }

  float t = uTime * uDrift;
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.7)), fbm(p + vec2(5.2, 1.3) - t * 0.5));
  float n = fbm(p + uWarp * q + vec2(t * 0.4, -t * 0.25));

  vec2 dir = vec2(cos(uBandAngle), sin(uBandAngle));
  float along = dot(uv, dir);
  float across = dot(uv, vec2(-dir.y, dir.x)) - uBandOffset - 0.22 * sin(along * 2.3 + t * 3.0) - (q.x - 0.5) * 0.35;
  float river = exp(-across * across / (uBandWidth * uBandWidth));

  float raw = n + river * uBand * 0.5 + (uDensity - 0.5) * 0.5;
  float d = smoothstep(uThreshold, uThreshold + uSoftness, raw);
  d = clamp(d + lamp * uLens * 0.45 + ring * 0.55, 0.0, 1.0);

  for (int i = 0; i < ${MAX_SPARKS}; i++) {
    if (i >= uSparkCount) break;
    vec4 s = uSpark[i];
    vec4 b = uSparkB[i];
    float grow = smoothstep(0.0, 0.6, uTime - s.w);
    float dist = length(pos - s.xy - shift(1.2));
    d += exp(-dist / max(b.w * 2.2 * (1.0 + b.z * 0.6), 1.0)) * 0.55 * grow;
  }

  float hz = smoothstep(0.25, 0.75, n + river * 0.25) * uHaze;
  float tone = fbm(p * 0.45 + vec2(11.0, -3.0) + t * 0.2);
  return vec3(clamp(d, 0.0, 1.0), hz, tone);
}

void main(){
  vec2 resCss = uRes / uDpr;
  vec2 css = gl_FragCoord.xy / uDpr;
  float px = max(uPixel, 1.0);
  vec2 cell = floor(css / px);
  vec2 cellC = (cell + 0.5) * px;
  vec2 f = fract(css / px) - 0.5;
  float L = max(uLevels, 2.0);
  float dith = bayer4(cell);

  // ---- the gas, printed as a halftone ---------------------------------------
  vec3 g = field(cellC, resCss);
  vec3 hazeCol = mix(uHazeColor, uDuskColor, smoothstep(0.38, 0.62, g.z));
  float dq = clamp(floor(g.x * L + dith) / L, 0.0, 1.0);
  float hq = floor(g.y * 3.0 + dith) / 3.0;
  vec3 bg = mix(uVoidColor, hazeCol, hq * 0.7);
  bg = mix(bg, ramp(dq * 0.7, hazeCol) * 0.42, smoothstep(0.0, 0.3, dq));
  float r = mix(uDotMin, uDotMax, sqrt(dq));
  float dotMask = step(length(f), r);
  vec3 dotCol = dq < 0.01 ? mix(uVoidColor, hazeCol, 0.35 + hq * 0.5) : ramp(min(dq + 0.1, 1.0), hazeCol);
  vec3 col = mix(bg, dotCol, dotMask);

  // ---- pixel stars, three parallax depths ------------------------------------
  vec3 starAcc = vec3(0.0);
  float starA = 0.0;
  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    float depth = 0.3 + fl * 0.4;
    float gpx = px * (l == 2 ? 2.0 : 1.0);
    vec2 sp = css + shift(depth) + vec2(0.0, floor(uTime * uStarDrift * depth));
    vec2 id = floor(sp / gpx);
    vec2 fr = fract(sp / gpx) - 0.5;
    float prob = uStars * (l == 0 ? 0.009 : l == 1 ? 0.014 : 0.01);
    float h = hash12(id + fl * 71.3);
    if (h > 1.0 - prob) {
      float h2 = hash12(id * 1.7 + 3.1 + fl);
      float tw = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * uTwinkle * (0.6 + h2 * 2.5) + h2 * 40.0));
      float rad = l == 2 ? 0.42 : 0.26 + h2 * 0.22;
      float m = step(length(fr), rad);
      vec3 c = (l == 0 || h2 > 0.82) ? uStarColor : uHotColor;
      starAcc = max(starAcc, c * m * tw);
      starA = max(starA, m * tw);
    }
  }
  col = mix(col, starAcc / max(starA, 1e-3), starA * (1.0 - g.x * 0.55));

  // ---- the planet, same halftone, lit from the upper left --------------------
  if (uPlanet.w > 0.5) {
    vec2 pc = uPlanet.xy + shift(0.8);
    float R = uPlanet.z;
    vec2 dc = cellC - pc;
    if (length(dc) < R) {
      vec2 n2 = dc / R;
      float z = sqrt(max(1.0 - dot(n2, n2), 0.0));
      float lit = clamp(dot(vec3(n2, z), normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
      float surf = fbm(vec2(n2.x * 1.4 + uTime * 0.015, n2.y * 4.2) * 1.6 + 9.0);
      float pd = clamp(lit * 1.05 - smoothstep(0.55, 0.75, surf) * 0.45 * (1.0 - lit * 0.5) + 0.05, 0.0, 1.0);
      float pq = floor(pd * L + dith) / L;
      vec3 pbg = mix(mix(uVoidColor, uWineColor, 0.35), uWineColor, pq);
      float pr = mix(0.2, 0.62, sqrt(pq));
      vec3 pdot = ramp(min(pq * 0.85 + 0.25, 1.0), hazeCol);
      col = mix(pbg, pdot, step(length(f), pr));
    }
  }

  // ---- sparkle stars: chunky core, needle spikes -----------------------------
  vec2 sh = shift(1.2);
  for (int i = 0; i < ${MAX_SPARKS}; i++) {
    if (i >= uSparkCount) break;
    vec4 s = uSpark[i];
    vec4 b = uSparkB[i];
    float age = uTime - s.w;
    if (age < 0.0) continue;
    float grow = smoothstep(0.0, 0.55, age) * (1.0 + 0.3 * exp(-age * 3.0) * sin(age * 13.0));
    float tw = 0.84 + 0.16 * sin(uTime * uTwinkle * 1.7 + b.y);
    float flare = 1.0 + b.z * 0.6;
    float reach = s.z * grow * tw * flare;
    float core = b.w * grow * flare;
    vec3 tint = mix(uHotColor, uStarColor, b.x);
    vec2 c = s.xy + sh;
    vec2 d = css - c;
    float th = uSpikeWidth * 0.5 + 0.25;
    float hx = step(abs(d.y), th) * pow(max(1.0 - abs(d.x) / max(reach, 1.0), 0.0), 1.1);
    float vy = step(abs(d.x), th) * pow(max(1.0 - abs(d.y) / max(reach, 1.0), 0.0), 1.1);
    // A short second pair of spikes, turned 45deg, only on the big ones.
    vec2 rd = vec2(d.x + d.y, d.x - d.y) * 0.7071;
    float diag = step(0.5, core / px - 1.5) * 0.45 * max(
      step(abs(rd.y), th) * pow(max(1.0 - abs(rd.x) / max(reach * 0.22, 1.0), 0.0), 2.0),
      step(abs(rd.x), th) * pow(max(1.0 - abs(rd.y) / max(reach * 0.22, 1.0), 0.0), 2.0));
    col = mix(col, tint, clamp(max(max(hx, vy), diag), 0.0, 1.0));
    // The core snaps to the cell grid, so it reads as a pixel-art disc.
    float hp = px * 0.5;
    vec2 dcell = (floor(css / hp) + 0.5) * hp - (floor(c / hp) + 0.5) * hp;
    float disc = step(length(dcell), core);
    float glow = exp(-length(d) / max(core * 1.4, 1.0)) * (1.0 - disc);
    col += tint * glow * 0.35;
    col = mix(col, tint, disc);
    float cross = max(step(abs(d.y), th) * step(abs(d.x), core * 0.85),
                      step(abs(d.x), th) * step(abs(d.y), core * 0.85));
    col = mix(col, uStarColor, cross * disc * 0.9);
  }

  // ---- post -----------------------------------------------------------------
  vec2 vu = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - uVignette * smoothstep(0.35, 0.95, length(vu * vec2(uRes.x / uRes.y, 1.0) * 1.1));
  col += (hash12(floor(css) + fract(uTime) * 91.0) - 0.5) * uGrain;
  frag = vec4(max(col, vec3(0.0)), 1.0);
}`;

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function layoutSparkles(seed, count) {
    var rand = mulberry32(seed), out = [], n = Math.max(0, Math.min(Math.floor(count), MAX_SPARKS));
    for (var i = 0; i < n; i++) {
      var hero = i === 0, pale = i === 1, x = 0.5, y = 0.5;
      for (var tries = 0; tries < 40; tries++) {
        x = 0.08 + 0.84 * rand();
        y = hero ? 0.58 + 0.28 * rand() : 0.08 + 0.84 * rand();
        var clear = out.every(function (s) { return Math.hypot(s.x - x, s.y - y) > (hero ? 0.2 : 0.13); });
        if (clear) break;
      }
      out.push({ x: x, y: y,
        reach: hero ? 0.2 + 0.05 * rand() : pale ? 0.08 + 0.03 * rand() : 0.025 + 0.055 * rand(),
        core: hero ? 0.024 : pale ? 0.011 : 0.004 + 0.006 * rand(),
        tint: pale ? 1 : 0, phase: rand() * 6.283, born: -10, user: false });
    }
    return out;
  }
  function pushSparkle(list, next) {
    if (list.length < MAX_SPARKS) return list.concat([next]);
    var oldest = list.findIndex(function (s) { return s.user; });
    if (oldest === -1) return list;
    return list.slice(0, oldest).concat(list.slice(oldest + 1), [next]);
  }
  function hexToRgb(hex) {
    var h = String(hex).trim().replace(/^#/, '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
    var v = parseInt(h, 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  }
  function driftPos(t) {
    var x = 0.5 + 0.32 * Math.sin(t * 0.21) + 0.1 * Math.sin(t * 0.077 + 1.3);
    var y = 0.5 + 0.26 * Math.cos(t * 0.17) + 0.12 * Math.cos(t * 0.053 + 4.2);
    return [Math.min(Math.max(x, 0.05), 0.95), Math.min(Math.max(y, 0.05), 0.95)];
  }

  function fallback(container) {
    container.style.background =
      'radial-gradient(55% 45% at 18% 80%, rgba(2,151,222,0.55) 0%, rgba(6,74,114,0.35) 35%, transparent 72%),' +
      'radial-gradient(35% 30% at 78% 70%, rgba(252,115,77,0.28) 0%, transparent 70%),' +
      'radial-gradient(40% 30% at 70% 22%, rgba(10,36,64,0.8) 0%, transparent 70%), #02070A';
    return { destroy: function () { container.style.background = ''; } };
  }

  function AnalogNebula(container, opts) {
    opts = opts || {};
    var SUBTLE = { density: 0.36, threshold: 0.6, haze: 0.55, sparkles: 6, lens: 0.35, lensRadius: 220, lensPush: 0.2,
      vignette: 0.35, grain: 0.02, starDrift: 0.6, drift: 0.025 };
    var P = Object.assign({}, DEFAULTS, opts.subtle ? SUBTLE : {}, opts.params || {});
    if (opts.subtle) { container.style.opacity = '0.55'; }
    var root = opts.root || container, interactive = opts.interactive !== false;
    var maxDpr = opts.maxDpr || (opts.subtle ? 1 : 1.5), clicks = opts.clicks !== false;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute; inset:0; display:block; width:100%; height:100%;';
    var gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance' });
    if (!gl) return fallback(container);

    function compile(type, src) {
      var s = gl.createShader(type); if (!s) return null;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('analog-nebula:', gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; }
      return s;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    var program = vs && fs ? gl.createProgram() : null;
    if (!program) return fallback(container);
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.error('analog-nebula:', gl.getProgramInfoLog(program)); gl.deleteProgram(program); return fallback(container); }
    container.appendChild(canvas);

    function loc(n) { return gl.getUniformLocation(program, n); }
    var tuned = UNIFORMS.map(function (s) { return [loc(uName(s[0])), s[0], s[1]]; });
    var U = { res: loc('uRes'), dpr: loc('uDpr'), time: loc('uTime'), pointer: loc('uPointer'), pointerOn: loc('uPointerOn'),
      look: loc('uLook'), sparkCount: loc('uSparkCount'), spark: loc('uSpark'), sparkB: loc('uSparkB'), ripple: loc('uRipple'), planet: loc('uPlanet') };
    var vao = gl.createVertexArray();

    var rmq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var reduced = rmq.matches;
    var cssW = 1, cssH = 1;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      cssW = Math.max(canvas.clientWidth, 1); cssH = Math.max(canvas.clientHeight, 1);
      var w = Math.floor(cssW * dpr), h = Math.floor(cssH * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      if (reduced) paint();
    }

    var sparks = layoutSparkles(P.seed, P.sparkles);
    var flare = new Float32Array(MAX_SPARKS), sparkA = new Float32Array(MAX_SPARKS * 4), sparkB = new Float32Array(MAX_SPARKS * 4);
    var ripples = new Float32Array(MAX_RIPPLES * 4), rippleNext = 0;
    var FROZEN = 14, t0 = performance.now(), lastClock = 0;
    function clock() { return reduced ? FROZEN : ((performance.now() - t0) / 1000) * P.speed; }

    var targetX = 0.5, targetY = 0.5, lampX = 0.5, lampY = 0.5, lookX = 0, lookY = 0, lampOn = 0, inside = false, lastTouched = -1e9;
    function toUv(e) {
      var r = canvas.getBoundingClientRect();
      return [Math.min(Math.max((e.clientX - r.left) / Math.max(r.width, 1), 0), 1),
              Math.min(Math.max(1 - (e.clientY - r.top) / Math.max(r.height, 1), 0), 1)];
    }
    function onMove(e) { if (!interactive) return; var p = toUv(e); targetX = p[0]; targetY = p[1]; inside = true; lastTouched = performance.now() / 1000; }
    function onLeave() { inside = false; }
    function onDown(e) {
      if (!interactive || !clicks || e.button > 0) return;
      if (e.target && e.target.closest && e.target.closest('a,button,input,textarea,select,label,[role=button]')) return;
      var p = toUv(e), now = clock(), rand = Math.random();
      targetX = p[0]; targetY = p[1]; inside = true; lastTouched = performance.now() / 1000;
      sparks = pushSparkle(sparks, { x: p[0], y: p[1], reach: 0.045 + 0.08 * rand, core: 0.006 + 0.008 * rand,
        tint: Math.random() < 0.2 ? 1 : 0, phase: Math.random() * 6.283, born: reduced ? now - 10 : now, user: true });
      ripples.set([p[0] * cssW, p[1] * cssH, now, reduced ? 0 : 1], rippleNext * 4);
      rippleNext = (rippleNext + 1) % MAX_RIPPLES;
      if (reduced) paint();
    }
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);

    function paint() {
      var t = clock(), dt = Math.min(Math.max(t - lastClock, 0), 0.1); lastClock = t;
      var idle = !inside || performance.now() / 1000 - lastTouched > 6;
      var g = driftPos(t * 0.6), wantX = idle ? g[0] : targetX, wantY = idle ? g[1] : targetY;
      var k = reduced ? 1 : 1 - Math.exp(-dt * (idle ? 1.5 : 7));
      lampX += (wantX - lampX) * k; lampY += (wantY - lampY) * k;
      lookX += ((wantX - 0.5) * 2 - lookX) * k; lookY += ((wantY - 0.5) * 2 - lookY) * k;
      var onTarget = interactive && !reduced ? (idle ? 0.55 : 1) : 0;
      lampOn += (onTarget - lampOn) * (reduced ? 1 : 1 - Math.exp(-dt * 3));
      var minSide = Math.min(cssW, cssH), n = Math.min(sparks.length, MAX_SPARKS);
      for (var i = 0; i < n; i++) {
        var s = sparks[i], reach = s.reach * minSide;
        var d = Math.hypot(s.x * cssW - lampX * cssW, s.y * cssH - lampY * cssH);
        var want = interactive && !reduced ? Math.exp(-(d * d) / Math.max(reach * reach * 0.6, 400)) : 0;
        flare[i] += (want - flare[i]) * (reduced ? 1 : 1 - Math.exp(-dt * 6));
        sparkA.set([s.x * cssW, s.y * cssH, reach, s.born], i * 4);
        sparkB.set([s.tint, s.phase, flare[i], Math.max(s.core * minSide, 1.5)], i * 4);
      }
      gl.useProgram(program); gl.bindVertexArray(vao); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      for (var j = 0; j < tuned.length; j++) {
        var v = P[tuned[j][1]];
        if (tuned[j][2] === 'c') gl.uniform3fv(tuned[j][0], hexToRgb(v)); else gl.uniform1f(tuned[j][0], v);
      }
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.dpr, canvas.width / cssW);
      gl.uniform1f(U.time, t);
      gl.uniform2f(U.pointer, lampX * cssW, lampY * cssH);
      gl.uniform1f(U.pointerOn, lampOn);
      gl.uniform2f(U.look, lookX, lookY);
      gl.uniform1i(U.sparkCount, n);
      gl.uniform4fv(U.spark, sparkA); gl.uniform4fv(U.sparkB, sparkB); gl.uniform4fv(U.ripple, ripples);
      gl.uniform4f(U.planet, P.planetX * cssW, P.planetY * cssH, P.planetRadius * minSide, P.planet ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    var raf = 0, visible = true, dead = false;
    function frame() { raf = 0; if (dead) return; paint(); if (visible && !document.hidden && !reduced) raf = requestAnimationFrame(frame); }
    function wake() { if (!dead && !reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }
    var io = new IntersectionObserver(function (es) { visible = es.some(function (e) { return e.isIntersecting; }); wake(); });
    io.observe(container);
    document.addEventListener('visibilitychange', wake);
    function onRm() { reduced = rmq.matches; paint(); wake(); }
    if (rmq.addEventListener) rmq.addEventListener('change', onRm);
    resize();
    var ro = new ResizeObserver(resize); ro.observe(canvas);
    paint(); wake();

    return {
      destroy: function () {
        dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
        document.removeEventListener('visibilitychange', wake);
        if (rmq.removeEventListener) rmq.removeEventListener('change', onRm);
        root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerdown', onDown);
        root.removeEventListener('pointerleave', onLeave); root.removeEventListener('pointercancel', onLeave);
        gl.deleteVertexArray(vao); gl.deleteProgram(program);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }
  window.AnalogNebula = AnalogNebula;
})();
