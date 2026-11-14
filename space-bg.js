/* Starfield (after "Starfield" by designali-in on 21st.dev), plain 2D canvas for AnalogOS.
   new AnalogStarfield(canvas, {density, speed}) -> {destroy}. Slow drift, white/blue stars, pauses when hidden, static under reduced motion. */
(function () {
  if (window.AnalogStarfield) return;
  function AnalogStarfield(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d'), stars = [], w = 0, h = 0, raf = 0, dead = false, last = 0;
    var rm = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var density = opts.density || 0.00012, speed = opts.speed || 6;
    function seed() {
      var dpr = Math.min(2, window.devicePixelRatio || 1), r = canvas.getBoundingClientRect();
      w = r.width; h = r.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(w * h * density); stars = [];
      for (var i = 0; i < n; i++) {
        var z = Math.random();
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: 0.35 + z * 1.05, z: z, a: 0.35 + Math.random() * 0.65, tw: Math.random() * Math.PI * 2, c: Math.random() < 0.3 ? '140,214,250' : (Math.random() < 0.15 ? '2,151,222' : '242,244,245') });
      }
      draw(0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], a = s.a * (0.75 + 0.25 * Math.sin(t * 0.0012 + s.tw));
        ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      }
    }
    function tick(now) {
      raf = 0; if (dead || document.hidden || rm.matches) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      for (var i = 0; i < stars.length; i++) { var s = stars[i]; s.x -= speed * (0.3 + s.z) * dt; s.y += speed * 0.25 * (0.3 + s.z) * dt; if (s.x < -2) s.x = w + 2; if (s.y > h + 2) s.y = -2; }
      draw(now); raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf && !dead && !document.hidden && !rm.matches) { last = 0; raf = requestAnimationFrame(tick); } }
    var ro = 'ResizeObserver' in window ? new ResizeObserver(seed) : null; if (ro) ro.observe(canvas); else window.addEventListener('resize', seed);
    var onVis = function () { start(); }; document.addEventListener('visibilitychange', onVis);
    if (rm.addEventListener) rm.addEventListener('change', function () { draw(0); start(); });
    seed(); start();
    this.destroy = function () { dead = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }
  window.AnalogStarfield = AnalogStarfield;
})();
