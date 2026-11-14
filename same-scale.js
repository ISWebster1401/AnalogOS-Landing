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

  function AnalogSameScale(root) {
    if (!root) return { destroy: function () {} };
    var q = function (k) { return root.querySelector('[data-ss="' + k + '"]'); };
    var cvM = q('mars'), cvE = q('earth'), range = q('range'), clip = q('clip'), handle = q('handle'), status = q('status');
    var btns = root.querySelectorAll('[data-ss-mode]');
    cvM.width = cvE.width = PX; cvM.height = cvE.height = PX;
    var srcM = null, srcE = null, mola = false, dead = false, started = false;
    function setSplit() {
      var v = +range.value;
      clip.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      handle.style.left = v + '%';
    }
    function redraw() { if (srcM) draw(cvM, srcM, mola); if (srcE) draw(cvE, srcE, mola); }
    function setMode(m) {
      mola = m === 'mola';
      for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-ss-mode') === m ? 'true' : 'false');
      root.setAttribute('data-mode', m);
      redraw();
    }
    function onBtn(e) { setMode(e.currentTarget.getAttribute('data-ss-mode')); }
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', onBtn);
    range.addEventListener('input', setSplit);
    setSplit();
    function start() {
      if (started) return; started = true;
      loadImg('assets/earth-yungay-s2.jpg').then(function (im) { if (dead) return; srcE = im; redraw(); }).catch(function () {});
      marsFrame().then(function (c) { if (dead) return; srcM = c; redraw(); if (status) status.style.display = 'none'; })
        .catch(function () { if (status) status.setAttribute('data-err', '1'); });
    }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { start(); io.disconnect(); } }, { rootMargin: '600px 0px' }) : null;
    if (io) io.observe(root); else start();
    return {
      destroy: function () {
        dead = true; if (io) io.disconnect();
        range.removeEventListener('input', setSplit);
        for (var i = 0; i < btns.length; i++) btns[i].removeEventListener('click', onBtn);
      }
    };
  }
  window.AnalogSameScale = AnalogSameScale;
})();
