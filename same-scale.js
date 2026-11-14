/* "Same scale, two planets" for AnalogOS (stage 2). AnalogSameScale(root) -> {destroy}.
   Mars: Jezero western rim and delta, NASA Mars Trek "Jezero_CTX_BlockAdj_dd" (CTX, NASA/JPL/MSSS), composed in the
   browser from WMTS tiles for an exact 20.34 km box. Earth: Pampa Yungay, Copernicus Sentinel-2 L2A (Dec 2025) from the
   AnalogOS visual-context package, cropped to the same 20.34 km box. Both frames: 705 px -> ~28.9 m/px.
   "MOLA scale" block-averages each frame to 463 m pixels (44 x 44) and shows them unsmoothed. */
(function () {
  if (window.AnalogSameScale) return;
  var KM = 20.34, PX = 705, MOLA_M = 463;
  var MARS = { lat: 18.45, lon: 77.34, R: 3396.19, layer: 'Jezero_CTX_BlockAdj_dd', z: 11, mw: 4096 };

  function loadImg(src, cors) {
    return new Promise(function (res, rej) { var im = new Image(); if (cors) im.crossOrigin = 'anonymous'; im.onload = function () { res(im); }; im.onerror = function () { rej(src); }; im.src = src; });
  }
  function marsFrame() {
    var degLat = KM / (MARS.R * Math.PI / 180), degLon = degLat / Math.cos(MARS.lat * Math.PI / 180);
    var N = MARS.lat + degLat / 2, S = MARS.lat - degLat / 2, W = MARS.lon - degLon / 2, E = MARS.lon + degLon / 2;
    var tdeg = 360 / MARS.mw, c0 = Math.floor((W + 180) / tdeg), c1 = Math.floor((E + 180) / tdeg), r0 = Math.floor((90 - N) / tdeg), r1 = Math.floor((90 - S) / tdeg);
    var cv = document.createElement('canvas'); cv.width = (c1 - c0 + 1) * 256; cv.height = (r1 - r0 + 1) * 256;
    var ctx = cv.getContext('2d'), jobs = [];
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) (function (r, c) {
      var u = 'https://trek.nasa.gov/tiles/Mars/EQ/' + MARS.layer + '/1.0.0/default/default028mm/' + MARS.z + '/' + r + '/' + c + '.png';
      jobs.push(loadImg(u, true).then(function (im) { ctx.drawImage(im, (c - c0) * 256, (r - r0) * 256); }));
    })(r, c);
    return Promise.all(jobs).then(function () {
      var ppd = 256 / tdeg, out = document.createElement('canvas'); out.width = PX; out.height = PX;
      var o = out.getContext('2d'); o.imageSmoothingQuality = 'high';
      o.drawImage(cv, (W + 180 - c0 * tdeg) * ppd, (90 - N - r0 * tdeg) * ppd, degLon * ppd, degLat * ppd, 0, 0, PX, PX);
      return out;
    });
  }
  function draw(target, src, mola) {
    var ctx = target.getContext('2d');
    if (!mola) { ctx.imageSmoothingEnabled = true; ctx.drawImage(src, 0, 0, PX, PX); return; }
    var n = Math.round(KM * 1000 / MOLA_M), small = document.createElement('canvas'); small.width = n; small.height = n;
    var s = small.getContext('2d'); s.imageSmoothingEnabled = true; s.imageSmoothingQuality = 'high'; s.drawImage(src, 0, 0, n, n);
    ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, PX, PX); ctx.drawImage(small, 0, 0, PX, PX);
  }

  /* Compare slider, after "image-compare" (21st.dev / uiarc), ported to plain JS: the divider follows the pointer 1:1,
     rubber-bands past the edges and springs where it is released; a press on the image springs it there; on touch it waits
     for a sideways drag so the page still scrolls; arrows step 1 % (Shift 10 %), Home/End reveal one side, double-click on
     the handle springs it back to the middle; captions fade as the divider reaches them. Horizontal only. */
  var STRETCH = 9, MARGIN = 42, GIVE = 12, INSET = 12, BUMP = 6;
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function rubber(d) { return Math.sign(d) * (1 - 1 / ((Math.abs(d) * 0.55) / STRETCH + 1)) * STRETCH; }
  function give(d) { return GIVE * (1 - 1 / (d / GIVE + 1)); }
  function soften(at, size) { return at < MARGIN ? MARGIN - give(MARGIN - at) : at > size - MARGIN ? size - MARGIN + give(at - size + MARGIN) : at; }
  function fade(room) { return clamp(room / 28, 0, 1); }

  function Compare(frame, parts, onChange) {
    var rm = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var cur = 50, vel = 0, target = 50, raf = 0, last = 0, drag = null, pressedHandle = false;
    var K = 304, C = 29.7;                                   /* "snappy" spring: ~0.3 s, bounce 0.15 */
    function render() {
      var w = frame.clientWidth || 1, p = cur, x = (clamp(p, 0, 100) / 100) * w;
      parts.clip.style.clipPath = 'inset(0 ' + (100 - clamp(p, 0, 100)).toFixed(3) + '% 0 0)';
      parts.line.style.left = p + '%';
      parts.handle.style.left = p + '%';
      parts.handle.style.transform = 'translate(calc(-50% + ' + (soften(x, w) - x).toFixed(1) + 'px), -50%)';
      if (parts.chipL) parts.chipL.style.opacity = fade(x - (INSET + parts.chipL.offsetWidth + 8));
      if (parts.chipR) parts.chipR.style.opacity = fade(w - INSET - parts.chipR.offsetWidth - 8 - x);
      var v = Math.round(clamp(p, 0, 100));
      parts.handle.setAttribute('aria-valuenow', String(v));
      parts.handle.setAttribute('aria-valuetext', onChange ? onChange(v) : v + '%');
    }
    function step(t) {
      raf = 0;
      var dt = Math.min((t - (last || t)) / 1000, 1 / 30); last = t;
      var f = -K * (cur - target) - C * vel; vel += f * dt; cur += vel * dt;
      if (Math.abs(cur - target) < 0.01 && Math.abs(vel) < 0.05) { cur = target; vel = 0; render(); last = 0; return; }
      render(); raf = requestAnimationFrame(step);
    }
    function springTo(v, kick) {
      target = v; if (kick) vel += kick;
      if (rm.matches) { cur = v; vel = 0; render(); return; }
      if (!raf) { last = 0; raf = requestAnimationFrame(step); }
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; vel = 0; last = 0; }
    function percentAt(e) { var r = frame.getBoundingClientRect(); return ((e.clientX - r.left) / (r.width || 1)) * 100; }
    function start(st, at) {
      st.started = true; st.grab = st.press ? 0 : at - cur;
      frame.setAttribute('data-dragging', ''); parts.handle.focus({ preventScroll: true }); parts.handle.setAttribute('data-quiet', '');
      follow(st, at, true);
    }
    function follow(st, at, first) {
      var raw = at - st.grab, w = frame.clientWidth || 1, edge = clamp(raw, 0, 100);
      var placed = rm.matches ? edge : edge + (rubber(((raw - edge) / 100) * w) / w) * 100;
      st.raw = raw;
      if ((first && st.press && !rm.matches) || raf) springTo(placed);   /* glide to the finger, then follow 1:1 */
      else { stop(); target = cur = placed; render(); }
    }
    function down(e) {
      if (e.button !== 0 || !e.isPrimary) return;
      var onHandle = !!(e.target.closest && e.target.closest('[data-ss="handle"]'));
      pressedHandle = onHandle;
      try { frame.setPointerCapture(e.pointerId); } catch (x) {}
      drag = { id: e.pointerId, grab: 0, press: !onHandle, started: false, x: e.clientX, y: e.clientY, raw: 0 };
      if (e.pointerType !== 'touch' || onHandle) start(drag, percentAt(e));
    }
    function move(e) {
      var st = drag; if (!st || st.id !== e.pointerId) return;
      if (!st.started) {
        var along = Math.abs(e.clientX - st.x), across = Math.abs(e.clientY - st.y);
        if (along < 6 && across < 6) return;
        if (across > along) { drag = null; return; }
        start(st, percentAt(e)); return;
      }
      follow(st, percentAt(e));
    }
    function end(e) {
      var st = drag; if (!st || st.id !== e.pointerId) return;
      drag = null; frame.removeAttribute('data-dragging');
      if (!st.started) { if (e.type === 'pointerup') springTo(clamp(percentAt(e), 0, 100)); return; }
      springTo(clamp(raf ? st.raw : cur, 0, 100));
    }
    function key(e) {
      var big = e.shiftKey ? 10 : 1, map = { ArrowLeft: -big, ArrowDown: -big, ArrowRight: big, ArrowUp: big, PageDown: -10, PageUp: 10 }, next;
      if (e.key === 'Home') next = 0; else if (e.key === 'End') next = 100;
      else if (e.key in map) next = Math.round(target) + map[e.key]; else return;
      e.preventDefault(); parts.handle.removeAttribute('data-quiet');
      var c = clamp(next, 0, 100);
      if (c === target) { if (next !== c) springTo(c, Math.sign(next - c) * BUMP * 20); return; }
      springTo(c);
    }
    function dbl() { if (pressedHandle) springTo(50); }
    function blur() { parts.handle.removeAttribute('data-quiet'); }
    frame.addEventListener('pointerdown', down); frame.addEventListener('pointermove', move);
    frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end); frame.addEventListener('lostpointercapture', end);
    frame.addEventListener('dblclick', dbl); frame.addEventListener('dragstart', function (e) { e.preventDefault(); });
    parts.handle.addEventListener('keydown', key); parts.handle.addEventListener('blur', blur);
    var ro = 'ResizeObserver' in window ? new ResizeObserver(render) : null; if (ro) ro.observe(frame);
    render();
    return { destroy: function () {
      stop(); if (ro) ro.disconnect();
      frame.removeEventListener('pointerdown', down); frame.removeEventListener('pointermove', move);
      frame.removeEventListener('pointerup', end); frame.removeEventListener('pointercancel', end); frame.removeEventListener('lostpointercapture', end);
      frame.removeEventListener('dblclick', dbl); parts.handle.removeEventListener('keydown', key); parts.handle.removeEventListener('blur', blur);
    } };
  }

  function AnalogSameScale(root) {
    if (!root) return { destroy: function () {} };
    var q = function (k) { return root.querySelector('[data-ss="' + k + '"]'); };
    var cvM = q('mars'), cvE = q('earth'), status = q('status');
    var btns = root.querySelectorAll('[data-ss-mode]');
    cvM.width = cvE.width = PX; cvM.height = cvE.height = PX;
    var srcM = null, srcE = null, mola = false, dead = false, started = false;
    var cmp = Compare(q('frame'), { clip: q('clip'), line: q('line'), handle: q('handle'), chipL: q('chipL'), chipR: q('chipR') },
      function (v) { return (root.getAttribute('data-vt') || '{v}% Mars').replace('{v}', v); });
    function redraw() { if (srcM) draw(cvM, srcM, mola); if (srcE) draw(cvE, srcE, mola); }
    function setMode(m) {
      mola = m === 'mola';
      for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-ss-mode') === m ? 'true' : 'false');
      root.setAttribute('data-mode', m);
      redraw();
    }
    function onBtn(e) { setMode(e.currentTarget.getAttribute('data-ss-mode')); }
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', onBtn);
    function start() {
      if (started) return; started = true;
      loadImg('assets/s2-cl-win-s2500-w06970.jpg').then(function (im) { if (dead) return; srcE = im; redraw(); }).catch(function () {});
      /* static copy of the same 20.34 km CTX frame first; live Mars Trek composition only as a fallback */
      loadImg('assets/mars-jezero-ctx.jpg').then(function (im) { if (dead) return; srcM = im; redraw(); if (status) status.style.display = 'none'; })
        .catch(function () {
          marsFrame().then(function (c) { if (dead) return; srcM = c; redraw(); if (status) status.style.display = 'none'; })
            .catch(function () { if (status) status.setAttribute('data-err', '1'); });
        });
    }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { start(); io.disconnect(); } }, { rootMargin: '600px 0px' }) : null;
    if (io) io.observe(root); else start();
    return {
      destroy: function () {
        dead = true; if (io) io.disconnect(); cmp.destroy();
        for (var i = 0; i < btns.length; i++) btns[i].removeEventListener('click', onBtn);
      }
    };
  }
  window.AnalogSameScale = AnalogSameScale;
})();
