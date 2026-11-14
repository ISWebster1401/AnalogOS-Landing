/* Blue meshy background (after "blue-meshy-background" on 21st.dev), plain WebGL2 for AnalogOS.
   AnalogMesh(container, {subtle}) -> {destroy}. Domain-warped fbm with a centre swirl, sampled
   through a 20-step ramp from navy #02070A to blue #0297DE. Rendered at reduced resolution
   (it is soft anyway), paused with the tab hidden, one still frame under prefers-reduced-motion. */
(function () {
  if (window.AnalogMesh) return;
  var FRAG = '#version 300 es\nprecision highp float;\nout vec4 outColor;\nuniform vec2 uResolution;\nuniform float uTime;\n#define NUM_COLORS 20\n' +
  'vec3 seaColors[NUM_COLORS] = vec3[](\n    vec3(0.008, 0.027, 0.039),\n    vec3(0.009, 0.041, 0.066),\n    vec3(0.011, 0.056, 0.092),\n    vec3(0.013, 0.07, 0.118),\n    vec3(0.014, 0.084, 0.145),\n    vec3(0.016, 0.104, 0.18),\n    vec3(0.018, 0.146, 0.239),\n    vec3(0.019, 0.187, 0.298),\n    vec3(0.021, 0.228, 0.358),\n    vec3(0.023, 0.27, 0.417),\n    vec3(0.022, 0.319, 0.487),\n    vec3(0.019, 0.375, 0.566),\n    vec3(0.016, 0.432, 0.646),\n    vec3(0.013, 0.489, 0.726),\n    vec3(0.01, 0.546, 0.805),\n    vec3(0.04, 0.605, 0.875),\n    vec3(0.22, 0.677, 0.898),\n    vec3(0.4, 0.75, 0.922),\n    vec3(0.645, 0.843, 0.943),\n    vec3(0.949, 0.957, 0.961)\n);\n' +
  'vec3 permute(vec3 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }\n' +
  'float noise2D(vec2 v){\n  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);\n' +
  '  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);\n  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n' +
  '  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);\n' +
  '  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));\n' +
  '  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0); m = m * m; m = m * m;\n' +
  '  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;\n' +
  '  m *= 1.792843 - 0.853734 * (a0 * a0 + h * h);\n  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n  return 130.0 * dot(m, g);\n}\n' +
  'float fbm(vec2 st){ float value = 0.0, amplitude = 0.5, freq = 1.0;\n  for (int i = 0; i < 6; i++) { value += amplitude * noise2D(st * freq); freq *= 2.0; amplitude *= 0.5; }\n  return value; }\n' +
  'void main(){\n  vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0; uv.x *= uResolution.x / uResolution.y; uv *= 0.3;\n' +
  '  float t = uTime * 0.25;\n  float waveAmp = 0.2 + 0.15 * noise2D(vec2(t, 27.7));\n' +
  '  uv.x += waveAmp * sin(uv.y * 4.0 + t); uv.y += waveAmp * sin(uv.x * 4.0 - t);\n' +
  '  float r = length(uv); float angle = atan(uv.y, uv.x);\n  angle += 1.2 * (1.0 - smoothstep(0.0, 1.0, r)) * sin(uTime + r * 5.0);\n  uv = vec2(cos(angle), sin(angle)) * r;\n' +
  '  float n = fbm(uv); n += 0.2 * sin(t + n * 3.0);\n  float idx = clamp(0.5 * (n + 1.0), 0.0, 1.0) * float(NUM_COLORS - 1);\n' +
  '  int iLow = int(floor(idx)); int iHigh = int(min(float(iLow + 1), float(NUM_COLORS - 1)));\n' +
  '  outColor = vec4(mix(seaColors[iLow], seaColors[iHigh], fract(idx)), 1.0);\n}\n';
  var VERT = '#version 300 es\nin vec2 aPosition;\nvoid main(){ gl_Position = vec4(aPosition, 0.0, 1.0); }';

  function AnalogMesh(container, opts) {
    opts = opts || {};
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute; inset:0; display:block; width:100%; height:100%;';
    var gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
    if (!gl) return { destroy: function () {} };
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('analog-mesh:', gl.getShaderInfoLog(s)); return null; } return s; }
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return { destroy: function () {} };
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error('analog-mesh:', gl.getProgramInfoLog(prog)); return { destroy: function () {} }; }
    container.appendChild(canvas);
    if (opts.subtle) container.style.opacity = '0.5';
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPosition'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, 'uResolution'), uTime = gl.getUniformLocation(prog, 'uTime');
    var rmq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var SCALE = opts.subtle ? 0.6 : 1, t0 = performance.now(), raf = 0, dead = false;
    function resize() {
      var w = Math.max(1, Math.round(canvas.clientWidth * SCALE)), h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      if (rmq.matches) draw();
    }
    function draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog); gl.bindVertexArray(vao);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, rmq.matches ? 12 : (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    function frame() { raf = 0; if (dead) return; draw(); if (!document.hidden && !rmq.matches) raf = requestAnimationFrame(frame); }
    function wake() { if (!dead && !raf && !document.hidden && !rmq.matches) raf = requestAnimationFrame(frame); }
    function onRm() { draw(); wake(); }
    var ro = new ResizeObserver(resize); ro.observe(canvas);
    document.addEventListener('visibilitychange', wake);
    if (rmq.addEventListener) rmq.addEventListener('change', onRm);
    resize(); draw(); wake();
    return {
      destroy: function () {
        dead = true; cancelAnimationFrame(raf); ro.disconnect();
        document.removeEventListener('visibilitychange', wake);
        if (rmq.removeEventListener) rmq.removeEventListener('change', onRm);
        gl.deleteProgram(prog); gl.deleteBuffer(vbo); gl.deleteVertexArray(vao);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }
  window.AnalogMesh = AnalogMesh;
})();
