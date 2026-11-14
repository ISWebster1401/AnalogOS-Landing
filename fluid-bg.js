/* Fluid particles (after "fluid-particles-background" on 21st.dev), plain 2D canvas for AnalogOS.
   AnalogFluid(container, {subtle}) -> {destroy}. Particles follow a Perlin flow field and leave
   soft trails: blue #0297DE and white dust, a few orange #FC734D sparks, on navy #02070A.
   Sized from its own box, paused with the tab hidden, a still frame under prefers-reduced-motion. */
(function () {
  if (window.AnalogFluid) return;
  var PERM = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  var p = new Array(512); for (var i = 0; i < 256; i++) p[256 + i] = p[i] = PERM[i];
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(t, a, b) { return a + t * (b - a); }
  function grad(h, x, y, z) { h &= 15; var u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z; return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v); }
  function noise3(x, y, z) {
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    var u = fade(x), v = fade(y), w = fade(z);
    var A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)), lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
      lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)), lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))));
  }

  function AnalogFluid(container, opts) {
    opts = opts || {};
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute; inset:0; display:block; width:100%; height:100%;';
    container.appendChild(canvas);
    if (opts.subtle) container.style.opacity = '0.8';
    var ctx = canvas.getContext('2d', { alpha: false });
    var rmq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var W = 1, H = 1, raf = 0, dead = false, parts = [];
    var NOISE = 0.003, DENSITY = 0.0011, MAXN = 2200, MAXOP = 0.42;
    var COLORS = ['2, 151, 222', '2, 151, 222', '2, 151, 222', '120, 196, 238', '242, 244, 245', '252, 115, 77'];
    function spawn(pt) {
      pt.x = Math.random() * W; pt.y = Math.random() * H; pt.life = 0;
      return pt;
    }
    function init() {
      var r = container.getBoundingClientRect();
      W = Math.max(Math.round(r.width), 1); H = Math.max(Math.round(r.height), 1);
      canvas.width = W; canvas.height = H;        // 1x on purpose: soft trails, cheap on full screen
      var n = Math.min(MAXN, Math.round(W * H * DENSITY));
      parts = [];
      for (var i = 0; i < n; i++) {
        var c = COLORS[(Math.random() * COLORS.length) | 0];
        parts.push({ x: Math.random() * W, y: Math.random() * H, size: 0.5 + Math.random() * 1.5,
          life: Math.random() * 100, maxLife: 100 + Math.random() * 50, c: c, op: c === '252, 115, 77' ? 0.8 : 1 });
      }
      ctx.fillStyle = '#02070A'; ctx.fillRect(0, 0, W, H);
      if (rmq.matches) for (var k = 0; k < 60; k++) step(k * 16);
    }
    function step(tms) {
      ctx.fillStyle = 'rgba(2, 7, 10, 0.12)'; ctx.fillRect(0, 0, W, H);
      var z = tms * 0.0001;
      for (var i = 0; i < parts.length; i++) {
        var pt = parts[i];
        pt.life += 1;
        if (pt.life > pt.maxLife) spawn(pt);
        var o = Math.sin((pt.life / pt.maxLife) * Math.PI) * MAXOP * pt.op;
        var a = noise3(pt.x * NOISE, pt.y * NOISE, z) * Math.PI * 4;
        pt.x += Math.cos(a) * 1.6; pt.y += Math.sin(a) * 1.6;
        if (pt.x < 0) pt.x = W; if (pt.x > W) pt.x = 0; if (pt.y < 0) pt.y = H; if (pt.y > H) pt.y = 0;
        ctx.fillStyle = 'rgba(' + pt.c + ', ' + o + ')';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, 6.2832); ctx.fill();
      }
    }
    function frame(t) { raf = 0; if (dead) return; step(t); if (!document.hidden && !rmq.matches) raf = requestAnimationFrame(frame); }
    function wake() { if (!dead && !raf && !document.hidden && !rmq.matches) raf = requestAnimationFrame(frame); }
    function onRm() { if (rmq.matches) init(); else wake(); }
    var ro = new ResizeObserver(init); ro.observe(container);
    document.addEventListener('visibilitychange', wake);
    if (rmq.addEventListener) rmq.addEventListener('change', onRm);
    init(); wake();
    return {
      destroy: function () {
        dead = true; cancelAnimationFrame(raf); ro.disconnect();
        document.removeEventListener('visibilitychange', wake);
        if (rmq.removeEventListener) rmq.removeEventListener('change', onRm);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }
  window.AnalogFluid = AnalogFluid;
})();
