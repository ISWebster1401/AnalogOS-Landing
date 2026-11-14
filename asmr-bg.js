/* ASMR static background (after "asmr-background" on 21st.dev), plain 2D canvas for AnalogOS.
   AnalogASMR(container, {root}) -> {destroy}. Shard particles in AnalogOS colours (navy dust,
   blue glass, orange friction glow), magnetic vortex around the pointer. Sized from its own box,
   paused offscreen / tab hidden, a single still frame under prefers-reduced-motion. */
(function () {
  if (window.AnalogASMR) return;
  function AnalogASMR(container, opts) {
    opts = opts || {};
    var root = opts.root || container;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute; inset:0; display:block; width:100%; height:100%;';
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var rmq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var width = 1, height = 1, dpr = 1, raf = 0, dead = false, visible = true, particles = [];
    var mouse = { x: -1000, y: -1000 };
    var MAGNETIC_RADIUS = 260, VORTEX = 0.07, PULL = 0.12, DENSITY = 0.0008;
    var BG = '2, 7, 10';
    var COLORS = ['74, 112, 140', '74, 112, 140', '74, 112, 140', '2, 151, 222', '2, 151, 222', '242, 244, 245'];

    function P() { this.reset(); }
    P.prototype.reset = function () {
      this.x = Math.random() * width; this.y = Math.random() * height;
      this.size = Math.random() * 1.8 + 0.8;
      this.vx = (Math.random() - 0.5) * 0.2; this.vy = (Math.random() - 0.5) * 0.2;
      this.color = COLORS[(Math.random() * COLORS.length) | 0];
      this.alpha = Math.random() * 0.45 + 0.3;
      this.rot = Math.random() * Math.PI * 2; this.rs = (Math.random() - 0.5) * 0.05; this.glow = 0;
    };
    P.prototype.update = function () {
      var dx = mouse.x - this.x, dy = mouse.y - this.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < MAGNETIC_RADIUS) {
        var f = (MAGNETIC_RADIUS - d) / MAGNETIC_RADIUS;
        this.vx += (dx / d) * f * PULL; this.vy += (dy / d) * f * PULL;
        this.vx += (dy / d) * f * VORTEX * 10; this.vy -= (dx / d) * f * VORTEX * 10;
        this.glow = f * 0.7;
      } else this.glow *= 0.92;
      this.x += this.vx; this.y += this.vy; this.vx *= 0.95; this.vy *= 0.95;
      this.vx += (Math.random() - 0.5) * 0.04; this.vy += (Math.random() - 0.5) * 0.04;
      this.rot += this.rs + (Math.abs(this.vx) + Math.abs(this.vy)) * 0.05;
      if (this.x < -20) this.x = width + 20; if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20; if (this.y > height + 20) this.y = -20;
    };
    P.prototype.draw = function () {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
      var a = Math.min(this.alpha + this.glow, 0.9);
      // close to the pointer the shards heat up from blue to orange
      ctx.fillStyle = this.glow > 0.45 ? 'rgba(252, 115, 77, ' + a + ')' : 'rgba(' + this.color + ', ' + a + ')';
      if (this.glow > 0.3) { ctx.shadowBlur = 8 * this.glow; ctx.shadowColor = 'rgba(2, 151, 222, ' + this.glow + ')'; }
      ctx.beginPath(); ctx.moveTo(0, -this.size * 2.5); ctx.lineTo(this.size, 0);
      ctx.lineTo(0, this.size * 2.5); ctx.lineTo(-this.size, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    function init() {
      var r = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(r.width, 1); height = Math.max(r.height, 1);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(1800, Math.round(width * height * DENSITY));
      particles = []; for (var i = 0; i < n; i++) particles.push(new P());
      ctx.fillStyle = 'rgb(' + BG + ')'; ctx.fillRect(0, 0, width, height);
      if (rmq.matches) drawStill();
    }
    function drawStill() {
      ctx.fillStyle = 'rgb(' + BG + ')'; ctx.fillRect(0, 0, width, height);
      for (var i = 0; i < particles.length; i++) particles[i].draw();
    }
    function render() {
      raf = 0; if (dead) return;
      ctx.fillStyle = 'rgba(' + BG + ', 0.18)'; ctx.fillRect(0, 0, width, height);
      for (var i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); }
      if (visible && !document.hidden && !rmq.matches) raf = requestAnimationFrame(render);
    }
    function wake() { if (!dead && !raf && visible && !document.hidden && !rmq.matches) raf = requestAnimationFrame(render); }
    function onMove(e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }
    function onLeave() { mouse.x = -1000; mouse.y = -1000; }
    function onRm() { if (rmq.matches) drawStill(); else wake(); }
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    var io = new IntersectionObserver(function (es) { visible = es.some(function (e) { return e.isIntersecting; }); wake(); });
    io.observe(container);
    var ro = new ResizeObserver(init); ro.observe(container);
    document.addEventListener('visibilitychange', wake);
    if (rmq.addEventListener) rmq.addEventListener('change', onRm);
    init(); wake();
    return {
      destroy: function () {
        dead = true; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
        document.removeEventListener('visibilitychange', wake);
        if (rmq.removeEventListener) rmq.removeEventListener('change', onRm);
        root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }
  window.AnalogASMR = AnalogASMR;
})();
