/* Sector configurator for AnalogOS (Tesla-style): satellite view on the left with callout arms that explain what
   matters for the rover test, sector picker and parameters on the right.
   AnalogSectors(container) -> {destroy}. Data: science-screening-v2 (github.com/Esteban12-hori/AnalogOS,
   artifacts/science-v2/candidate-details.json); imagery: Copernicus Sentinel-2 L2A, Dec 2025 mosaic (AnalogOS visual context).
   Language follows <html lang>. Plain DOM, no build step. */
(function () {
  if (window.AnalogSectors) return;
  var MARS = { slope: 2.226, rough: 11.0, relief: 47.0 };
  var W = { slope: 0.20, rough: 0.20, relief: 0.15, bare: 0.20, arid: 0.10, therm: 0.05 };   /* geology 0.10 not scored */
  function ratio(a, b) { return Math.min(a, b) / Math.max(a, b); }
  function sims(v) {
    return { slope: ratio(v.slope, MARS.slope), rough: ratio(v.rough, MARS.rough), relief: ratio(v.relief, MARS.relief),
      bare: v.bare, arid: 1 / (1 + v.arid / 25), therm: Math.min(v.therm / 45, 1) };
  }
  var SECTORS = [
    { id: 'cl1', rank: '01', name: 'Antofagasta 25.0° S', region: 'cl', img: 'assets/s2-cl-win-s2500-w06970.jpg', S: 94.87, C: 77.45, stab: 99.33, area: 447.3, ll: '25.02° S · 69.72° W',
      v: { slope: 2.169, rough: 11.291, relief: 46.797, bare: 1.0, arid: 10.96, therm: 53.82 },
      arms: [{ k: 'slope', x: 40, y: 55, side: 'top' }, { k: 'relief', x: 62, y: 38, side: 'top' }, { k: 'tracks', x: 20, y: 78, side: 'bottom' }, { k: 'precedent', x: 74, y: 82, side: 'bottom' }] },
    { id: 'cl2', rank: '02', name: 'Antofagasta 24.8° S', region: 'cl', img: 'assets/s2-cl-win-s2480-w06950.jpg', S: 91.87, C: 77.45, stab: 99.03, area: 448.0, ll: '24.82° S · 69.52° W',
      v: { slope: 2.388, rough: 10.992, relief: 49.348, bare: 1.0, arid: 18.26, therm: 56.29 },
      arms: [{ k: 'relief', x: 22, y: 48, side: 'top' }, { k: 'slope', x: 64, y: 40, side: 'top' }, { k: 'bare', x: 40, y: 78, side: 'bottom' }, { k: 'shared', x: 84, y: 84, side: 'bottom' }] },
    { id: 'cl3', rank: '03', name: 'Antofagasta 25.2° S', region: 'cl', img: 'assets/s2-cl-win-s2520-w06950.jpg', S: 90.35, C: 77.36, stab: 99.08, area: 446.6, ll: '25.22° S · 69.52° W',
      v: { slope: 2.375, rough: 12.242, relief: 47.68, bare: 1.0, arid: 18.26, therm: 56.29 },
      arms: [{ k: 'relief', x: 32, y: 40, side: 'top' }, { k: 'rough', x: 78, y: 30, side: 'top' }, { k: 'bare', x: 20, y: 85, side: 'bottom' }, { k: 'shared', x: 72, y: 80, side: 'bottom' }] },
    { id: 'ar1', rank: '04', name: 'Puna 26.2° S', region: 'ar', img: 'assets/s2-ar-win-s2620-w06750.jpg', S: 63.85, C: 77.00, stab: 95.88, area: 442.9, ll: '26.22° S · 67.52° W',
      v: { slope: 2.568, rough: 12.654, relief: 55.867, bare: 0.994, arid: 588.05, therm: 68.34 },
      arms: [{ k: 'relief', x: 8, y: 60, side: 'top' }, { k: 'rain', x: 48, y: 42, side: 'top' }, { k: 'water', x: 52, y: 86, side: 'bottom' }, { k: 'rough', x: 88, y: 66, side: 'bottom' }] },
    { id: 'ar2', rank: '05', name: 'Puna 26.4° S', region: 'ar', img: 'assets/s2-ar-win-s2640-w06730.jpg', S: 53.68, C: 77.25, stab: 96.81, area: 442.2, ll: '26.42° S · 67.32° W',
      v: { slope: 3.433, rough: 16.697, relief: 75.355, bare: 0.984, arid: 562.49, therm: 65.71 },
      arms: [{ k: 'relief', x: 30, y: 10, side: 'top' }, { k: 'rain', x: 62, y: 40, side: 'top' }, { k: 'bare', x: 18, y: 84, side: 'bottom' }, { k: 'rough', x: 80, y: 66, side: 'bottom' }] },
    { id: 'ar3', rank: '06', name: 'Puna 25.8° S', region: 'ar', img: 'assets/s2-ar-win-s2580-w06710.jpg', S: 49.43, C: 77.40, stab: 96.81, area: 444.4, ll: '25.82° S · 67.12° W',
      v: { slope: 3.563, rough: 19.812, relief: 78.023, bare: 0.996, arid: 767.02, therm: 64.46 },
      arms: [{ k: 'slope', x: 25, y: 40, side: 'top' }, { k: 'rain', x: 60, y: 30, side: 'top' }, { k: 'rough', x: 40, y: 72, side: 'bottom' }, { k: 'tracks', x: 78, y: 88, side: 'bottom' }] },
    { id: 'ref', rank: 'REF', name: 'Pampa Yungay', region: 'ref', img: 'assets/earth-yungay-s2.jpg', S: 75.67, C: 77.45, stab: 99.03, area: 450.5, ll: '24.10° S · 69.97° W',
      v: { slope: 3.207, rough: 16.564, relief: 75.125, bare: 1.0, arid: 7.30, therm: 47.66 },
      arms: [{ k: 'refknown', x: 34, y: 24, side: 'top' }, { k: 'slope', x: 60, y: 50, side: 'top' }, { k: 'bare', x: 18, y: 78, side: 'bottom' }, { k: 'infra', x: 84, y: 84, side: 'bottom' }] }
  ];
  var T = {
    en: {
      dec: '.', profile: 'Profile · Mars Rover Screening v3', pick: 'Search candidates', regions: { cl: 'Antofagasta interior · Chile', ar: 'Puna of Catamarca and Salta · Argentina', ref: 'Known reference · out of ranking' }, sim: 'Similarity', conf: 'Confidence', stab: 'Stability ±20 %',
      area: 'Area', crit: 'Criteria vs Jezero (MOLA)', weight: 'weight', notScored: 'Geology · not scored yet (weight 0.10)',
      feas: 'Feasibility', feasV: 'Requires review', checks: ['Soil: grain size, cohesion, sinkage, traction', 'Terrain at centimetre–decimetre scale', 'Protected areas, urban limits, access, permits (IDE Chile / IDERA)'],
      cta: 'Open in AnalogOS', prev: 'Previous sector', next: 'Next sector', close: 'Close',
      note: 'Arms mark visible features; values are window-wide medians at ~460–480 m.',
      attr: 'Contains modified Copernicus Sentinel-2 data (Dec 2025) · 20 km frame',
      names: { slope: 'Median slope', rough: 'Roughness (neighbour diff.)', relief: 'Local relief 3×3', bare: 'Non-vegetated surface', arid: 'Precipitation', therm: 'Surface thermal range' },
      arm: {
        relief: ['Local relief', function (v) { return f(v.relief, 1) + ' m · Mars 47 m'; }, 'Median height difference in 3×3 windows at ~475 m, compared with the Jezero MOLA window. Relief gives perception and path planning something to work on.'],
        slope: ['Median slope', function (v) { return f(v.slope, 2) + '° · Mars 2.23°'; }, 'Median of the whole ~20 km window after averaging NASADEM to MOLA scale. It is not a point slope; slope is the property that transfers between planets (μ ≥ tan θ).'],
        rough: ['Roughness', function (v) { return f(v.rough, 1) + ' m · Mars 11.0 m'; }, 'Median difference between neighbouring ~475 m cells. It does not see rocks or wheel-scale obstacles.'],
        bare: ['Bare ground', function (v) { return f(v.bare * 100, v.bare < 1 ? 1 : 0) + ' % non-vegetated'; }, 'Median of twelve monthly Sentinel-2 mosaics (SCL class 5). It measures exposed surface, not mineralogy or soil mechanics.'],
        tracks: ['Tracks and structures', function () { return 'to check · official maps'; }, 'Linear tracks and structures are visible. They must be checked against official mapping (IDE Chile / IDERA): a ~440 km² window is not free land.'],
        precedent: ['Regional precedent', function () { return '2003 sample · ~20 km'; }, 'The region has published precedents: a 2003 sampling coordinate lies about 20 km from the centre. AnalogOS does not present this window as a new analog.'],
        shared: ['Shared climate cell', function (v) { return f(v.arid, 1) + ' mm/yr · POWER'; }, 'Same NASA POWER values as a neighbouring window: possibly the same climate cell, not independent observations.'],
        rain: ['Coarse climate data', function (v) { return f(v.arid, 0) + ' mm/yr · POWER cell'; }, 'NASA POWER gives a 0.5° × 0.625° MERRA-2 cell, larger than the window: this is not rain measured on site. It explains most of the gap of the Argentine candidates; no weights were changed to compensate.'],
        water: ['Permanent water', function () { return '0.10 % of pixels'; }, 'NASADEM SWB flags a trace of permanent water. The window is kept, but any campaign route must avoid those pixels.'],
        refknown: ['Known reference', function () { return 'REF · out of ranking'; }, 'Yungay has two decades of field work (NASA ARADS among others). It is recomputed with the same rules and shown as a reference, never as a search result.'],
        infra: ['Infrastructure', function () { return 'restriction · to review'; }, 'Facilities are visible in the frame. Urban limits, protected areas, ownership and access have not been intersected yet.']
      }
    },
    es: {
      dec: ',', profile: 'Perfil · Mars Rover Screening v3', pick: 'Candidatos de la búsqueda', regions: { cl: 'Interior de Antofagasta · Chile', ar: 'Puna de Catamarca y Salta · Argentina', ref: 'Referencia conocida · fuera del ranking' }, sim: 'Similitud', conf: 'Confianza', stab: 'Estabilidad ±20 %',
      area: 'Área', crit: 'Criterios frente a Jezero (MOLA)', weight: 'peso', notScored: 'Geología · aún no puntúa (peso 0,10)',
      feas: 'Factibilidad', feasV: 'Requiere revisión', checks: ['Suelo: granulometría, cohesión, hundimiento, tracción', 'Terreno a escala centimétrica y decimétrica', 'Áreas protegidas, límites urbanos, acceso, permisos (IDE Chile / IDERA)'],
      cta: 'Abrir en AnalogOS', prev: 'Sector anterior', next: 'Sector siguiente', close: 'Cerrar',
      note: 'Los brazos marcan rasgos visibles; los valores son medianas de la ventana a ~460–480 m.',
      attr: 'Contiene datos modificados de Copernicus Sentinel-2 (dic. 2025) · encuadre de 20 km',
      names: { slope: 'Pendiente mediana', rough: 'Rugosidad (dif. vecina)', relief: 'Relieve local 3×3', bare: 'Superficie no vegetada', arid: 'Precipitación', therm: 'Rango térmico superficial' },
      arm: {
        relief: ['Relieve local', function (v) { return f(v.relief, 1) + ' m · Marte 47 m'; }, 'Diferencia mediana de altura en ventanas 3×3 a ~475 m, comparada con la ventana MOLA de Jezero. El relieve le da trabajo a la percepción y a la planificación de rutas.'],
        slope: ['Pendiente mediana', function (v) { return f(v.slope, 2) + '° · Marte 2,23°'; }, 'Mediana de la ventana completa de ~20 km tras promediar NASADEM a escala MOLA. No es una pendiente puntual; la pendiente es la propiedad que se transfiere entre planetas (μ ≥ tan θ).'],
        rough: ['Rugosidad', function (v) { return f(v.rough, 1) + ' m · Marte 11,0 m'; }, 'Diferencia mediana entre celdas vecinas de ~475 m. No ve rocas ni obstáculos a escala de rueda.'],
        bare: ['Suelo desnudo', function (v) { return f(v.bare * 100, v.bare < 1 ? 1 : 0) + ' % no vegetado'; }, 'Mediana de doce mosaicos mensuales de Sentinel-2 (clase SCL 5). Mide superficie expuesta, no mineralogía ni mecánica de suelo.'],
        tracks: ['Trazas y estructuras', function () { return 'por contrastar · cartografía'; }, 'Se ven trazas lineales y estructuras. Deben contrastarse con cartografía oficial (IDE Chile / IDERA): una ventana de ~440 km² no es terreno libre.'],
        precedent: ['Antecedente regional', function () { return 'muestra 2003 · ~20 km'; }, 'La región tiene antecedentes publicados: una coordenada de muestreo de 2003 está a unos 20 km del centro. AnalogOS no presenta esta ventana como análogo nuevo.'],
        shared: ['Celda climática compartida', function (v) { return f(v.arid, 1) + ' mm/año · POWER'; }, 'Mismos valores NASA POWER que una ventana vecina: posiblemente la misma celda climática, no observaciones independientes.'],
        rain: ['Clima de resolución gruesa', function (v) { return f(v.arid, 0) + ' mm/año · celda POWER'; }, 'NASA POWER entrega una celda MERRA-2 de 0,5° × 0,625°, mayor que la ventana: no es lluvia medida en el sitio. Explica la mayor parte de la diferencia de los candidatos argentinos; no se cambiaron pesos para compensarlo.'],
        water: ['Agua permanente', function () { return '0,10 % de los píxeles'; }, 'NASADEM SWB detecta una traza de agua permanente. La ventana se conserva, pero la ruta de campaña debe evitar esos píxeles.'],
        refknown: ['Referencia conocida', function () { return 'REF · fuera del ranking'; }, 'Yungay tiene dos décadas de trabajo de campo (NASA ARADS, entre otros). Se recalcula con las mismas reglas y se muestra como referencia, nunca como resultado de la búsqueda.'],
        infra: ['Infraestructura', function () { return 'restricción · por revisar'; }, 'Se ven instalaciones en el encuadre. Aún no se cruzan límites urbanos, áreas protegidas, propiedad ni acceso.']
      }
    }
  };
  var L = T.en;
  function nm(s) { return L.dec === ',' ? s.name.replace('.', ',') : s.name; }
  function f(x, d) { var s = x.toFixed(d); return L.dec === ',' ? s.replace('.', ',') : s; }
  function el(tag, css, html) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; }
  var MONO = "font-family:'Martian Mono', ui-monospace, monospace;";

  function AnalogSectors(root) {
    if (!root) return { destroy: function () {} };
    var idx = 0, open = -1, dead = false;
    root.innerHTML = '';
    var wrap = el('div', 'display:flex; flex-wrap:wrap; gap:clamp(24px,3vw,48px); align-items:flex-start;');
    var stage = el('div', 'flex:1 1 520px; min-width:0; display:flex; flex-direction:column; gap:16px;');
    var frame = el('div', 'position:relative; width:100%; max-width:760px; margin:0 auto; aspect-ratio:1 / 1; border-radius:20px; overflow:visible;');
    var imgBox = el('div', 'position:absolute; inset:0; border-radius:20px; overflow:hidden; background:#04101A; box-shadow:0 30px 80px -30px rgba(0,0,0,0.7);');
    var img = el('img', 'width:100%; height:100%; object-fit:cover; display:block; transition:opacity .35s ease;');
    img.alt = ''; imgBox.appendChild(img); frame.appendChild(imgBox);
    var arms = el('div', 'position:absolute; inset:0; pointer-events:none;'); frame.appendChild(arms);
    var pop = el('div', 'position:absolute; z-index:5; width:min(300px, 80%); padding:14px 16px; border-radius:14px; background:rgba(2,7,10,0.92); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); border:1px solid rgba(242,244,245,0.18); color:#F2F4F5; font-size:13.5px; line-height:1.5; display:none; box-shadow:0 18px 40px -12px rgba(0,0,0,0.6);');
    pop.setAttribute('role', 'dialog'); frame.appendChild(pop);
    var nav = el('div', 'display:flex; align-items:center; justify-content:center; gap:12px;');
    var prev = el('button', 'width:44px; height:44px; border-radius:12px; border:1px solid rgba(242,244,245,0.2); background:rgba(242,244,245,0.06); color:#F2F4F5; cursor:pointer; font-size:18px;', '‹');
    var dots = el('div', 'display:flex; align-items:center; gap:0; padding:2px 6px; border-radius:12px; background:rgba(242,244,245,0.06); border:1px solid rgba(242,244,245,0.12);');
    var next = el('button', 'width:44px; height:44px; border-radius:12px; border:1px solid rgba(242,244,245,0.2); background:rgba(242,244,245,0.06); color:#F2F4F5; cursor:pointer; font-size:18px;', '›');
    prev.type = next.type = 'button';
    nav.appendChild(prev); nav.appendChild(dots); nav.appendChild(next);
    var list = el('div', 'display:none; flex-direction:column; gap:8px;');
    var foot = el('p', 'margin:0; text-align:center; ' + MONO + ' font-size:10px; line-height:1.6; color:rgba(242,244,245,0.72);');
    stage.appendChild(frame); stage.appendChild(list); stage.appendChild(nav); stage.appendChild(foot);
    var panel = el('div', 'flex:1 1 340px; max-width:460px; min-width:0; display:flex; flex-direction:column; gap:16px;');
    wrap.appendChild(stage); wrap.appendChild(panel); root.appendChild(wrap);

    function closePop() { open = -1; pop.style.display = 'none'; var bs = arms.querySelectorAll('button'); for (var i = 0; i < bs.length; i++) { bs[i].setAttribute('aria-expanded', 'false'); bs[i].lastChild.textContent = '+'; } }
    function showPop(i, a, btn) {
      var s = SECTORS[idx], d = L.arm[a.k];
      if (open === i) { closePop(); return; }
      closePop(); open = i; btn.setAttribute('aria-expanded', 'true'); btn.lastChild.textContent = '−';
      pop.innerHTML = '<div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:4px 10px; align-items:baseline;"><strong style="font-family:var(--font-heading); font-size:16px;">' + d[0] + '</strong><span style="' + MONO + ' font-size:11px; color:#7FC8EF; text-align:right;">' + d[1](s.v) + '</span></div><p style="margin:8px 0 0; color:rgba(242,244,245,0.82);">' + d[2] + '</p>';
      pop.style.display = 'block';
      pop.style.left = clamp(a.x > 62 ? a.x - 40 : a.x, 2, 58) + '%';
      if (a.side === 'top') { pop.style.top = '64px'; pop.style.bottom = 'auto'; } else { pop.style.bottom = '64px'; pop.style.top = 'auto'; }
    }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    var mq = window.matchMedia ? matchMedia('(max-width: 640px)') : { matches: false };
    function renderCompact() {
      arms.innerHTML = ''; list.innerHTML = ''; closePop();
      var s = SECTORS[idx];
      list.style.display = 'flex';
      s.arms.forEach(function (a, i) {
        var d = L.arm[a.k];
        arms.appendChild(el('span', 'position:absolute; left:' + a.x + '%; top:' + a.y + '%; width:24px; height:24px; margin:-12px 0 0 -12px; border-radius:50%; background:#F2F4F5; color:#02070A; font:700 12px/24px sans-serif; text-align:center; box-shadow:0 0 0 4px rgba(2,151,222,0.5);', String(i + 1)));
        var item = el('details', 'border-radius:12px; background:rgba(242,244,245,0.06); border:1px solid rgba(242,244,245,0.14); padding:10px 12px;');
        item.innerHTML = '<summary style="display:flex; align-items:center; gap:10px; cursor:pointer; list-style:none;"><span style="width:22px; height:22px; flex:none; border-radius:50%; background:#F2F4F5; color:#02070A; font:700 11px/22px sans-serif; text-align:center;">' + (i + 1) + '</span><span style="flex:1; display:flex; flex-direction:column;"><span style="font-size:14px; font-weight:600;">' + d[0] + '</span><span style="' + MONO + ' font-size:10.5px; color:#7FC8EF;">' + d[1](s.v) + '</span></span><span style="font-size:16px;">+</span></summary><p style="margin:8px 0 0; font-size:13px; line-height:1.5; color:rgba(242,244,245,0.8);">' + d[2] + '</p>';
        list.appendChild(item);
      });
    }
    function renderArms() {
      if (mq.matches) { renderCompact(); return; }
      list.style.display = 'none'; list.innerHTML = '';
      arms.innerHTML = ''; closePop();
      var s = SECTORS[idx];
      s.arms.forEach(function (a, i) {
        var top = a.side === 'top';
        var y0 = top ? -6 : 106;                                   /* label sits just outside the image, like Tesla */
        var line = el('span', 'position:absolute; width:1px; background:rgba(242,244,245,0.7); left:' + a.x + '%; top:' + Math.min(a.y, y0 + (top ? 3 : 0)) + '%; height:' + Math.abs(a.y - (top ? y0 + 3 : y0 - 3)) + '%; transform-origin:top; animation:anlArm .5s ' + (0.08 * i) + 's both ease-out;');
        var dot = el('span', 'position:absolute; width:9px; height:9px; margin:-4.5px 0 0 -4.5px; border-radius:50%; background:#F2F4F5; box-shadow:0 0 0 3px rgba(2,151,222,0.55); left:' + a.x + '%; top:' + a.y + '%;');
        var btn = el('button', 'position:absolute; pointer-events:auto; display:flex; align-items:center; gap:10px; padding:6px 6px 6px 12px; border-radius:10px; border:1px solid rgba(242,244,245,0.18); background:rgba(2,7,10,0.78); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); color:#F2F4F5; cursor:pointer; text-align:left; white-space:nowrap; transform:translateY(' + (top ? '-100%' : '0') + ');');
        btn.type = 'button'; btn.setAttribute('aria-expanded', 'false');
        var d = L.arm[a.k];
        btn.innerHTML = '<span style="display:flex; flex-direction:column; gap:1px;"><span style="font-size:13px; font-weight:600;">' + d[0] + '</span><span style="' + MONO + ' font-size:10px; color:#7FC8EF;">' + d[1](s.v) + '</span></span><span style="width:24px; height:24px; border-radius:6px; background:rgba(242,244,245,0.12); display:flex; align-items:center; justify-content:center; font-size:15px;">+</span>';
        var flip = a.x > 62;
        btn.style.left = a.x + '%';
        btn.style.transform = 'translate(' + (flip ? '-100%' : '0') + ',' + (top ? '-100%' : '0') + ')';
        btn.style.top = (top ? y0 + 3 : y0 - 3) + '%';
        btn.addEventListener('click', function (e) { e.stopPropagation(); showPop(i, a, btn); });
        arms.appendChild(line); arms.appendChild(dot); arms.appendChild(btn);
      });
    }

    function renderPanel() {
      var s = SECTORS[idx], sm = sims(s.v);
      var h = '';
      h += '<div style="' + MONO + ' font-size:10.5px; letter-spacing:0.05em; text-transform:uppercase; color:rgba(242,244,245,0.72);">' + L.profile + '</div>';
      h += '<div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px;"><span style="padding:3px 9px; border-radius:9999px; border:1px solid ' + (s.region === 'ref' ? '#F2F4F5' : '#0297DE') + '; ' + MONO + ' font-size:10.5px; color:' + (s.region === 'ref' ? '#F2F4F5' : '#7FC8EF') + ';">' + (s.region === 'ref' ? 'REF' : '#' + s.rank) + '</span><span style="font-size:12.5px; color:rgba(242,244,245,0.72);">' + L.regions[s.region] + '</span></div>';
      h += '<h3 style="margin:0; font-family:var(--font-heading); font-weight:800; font-stretch:112%; font-size:clamp(30px,3vw,44px); line-height:1; letter-spacing:-0.02em;">' + nm(s) + '</h3>';
      h += '<div style="' + MONO + ' font-size:11px; color:rgba(242,244,245,0.72);">' + s.ll + ' · ' + L.area + ' ' + f(s.area, 1) + ' km²</div>';
      h += '<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding:16px; border-radius:16px; background:rgba(242,244,245,0.05); border:1px solid rgba(242,244,245,0.1);">' +
        stat(f(s.S, 2), L.sim, '#0297DE') + stat(f(s.C, 2), L.conf, '#7FC8EF') + stat(f(s.stab, 2), L.stab, '#F2F4F5') + '</div>';
      h += '<div role="radiogroup" aria-label="' + L.pick + '" style="display:flex; flex-direction:column; border-radius:16px; border:2px solid #F2F4F5; padding:8px 6px;">';
      h += '<div style="padding:6px 12px 8px; font-size:14px;"><strong>' + L.pick + '</strong></div>';
      SECTORS.forEach(function (o, i) {
        var on = i === idx;
        h += '<button type="button" role="radio" aria-checked="' + on + '" data-pick="' + i + '" style="display:flex; align-items:center; gap:12px; width:100%; padding:10px 12px; border:0; border-radius:10px; background:' + (on ? 'rgba(242,244,245,0.08)' : 'transparent') + '; color:#F2F4F5; cursor:pointer; text-align:left; font-size:15px;">' +
          '<span style="width:18px; height:18px; flex:none; border-radius:50%; border:2px solid ' + (on ? '#F2F4F5' : 'rgba(242,244,245,0.5)') + '; display:flex; align-items:center; justify-content:center;">' + (on ? '<span style="width:8px; height:8px; border-radius:50%; background:#F2F4F5;"></span>' : '') + '</span>' +
          '<span style="' + MONO + ' font-size:11px; width:30px; color:rgba(242,244,245,0.72);">' + o.rank + '</span><span style="flex:1; font-weight:' + (on ? 600 : 400) + ';">' + nm(o) + '</span><span style="' + MONO + ' font-size:13px; color:#0297DE;">S ' + f(o.S, 2) + '</span></button>';
      });
      h += '</div>';
      h += '<div style="display:flex; flex-direction:column; gap:10px; padding:16px; border-radius:16px; background:rgba(242,244,245,0.05); border:1px solid rgba(242,244,245,0.1);"><div style="font-size:14px;"><strong>' + L.crit + '</strong></div>';
      ['slope', 'rough', 'relief', 'bare', 'arid', 'therm'].forEach(function (k) {
        var val = { slope: f(s.v.slope, 1) + '°', rough: f(s.v.rough, 1) + ' m', relief: f(s.v.relief, 0) + ' m', bare: f(s.v.bare * 100, s.v.bare < 1 ? 1 : 0) + ' %', arid: f(s.v.arid, 1) + ' mm', therm: f(s.v.therm, 1) + ' °C' }[k];
        var p = Math.round(sm[k] * 100);
        h += '<div style="display:flex; flex-direction:column; gap:4px;"><div style="display:flex; justify-content:space-between; gap:8px; font-size:13px;"><span>' + L.names[k] + ' <span style="color:rgba(242,244,245,0.72); ' + MONO + ' font-size:10px;">· ' + L.weight + ' ' + f(W[k], 2) + '</span></span><span style="' + MONO + ' font-size:12px; color:rgba(242,244,245,0.85);">' + val + '</span></div>' +
          '<div style="height:6px; border-radius:6px; background:rgba(242,244,245,0.1); overflow:hidden;"><span style="display:block; height:100%; width:' + p + '%; background:linear-gradient(90deg,#0297DE,#7FC8EF); border-radius:6px; transition:width .5s ease;"></span></div></div>';
      });
      h += '<div style="' + MONO + ' font-size:10px; color:rgba(242,244,245,0.72);">' + L.notScored + '</div></div>';
      h += '<div style="display:flex; flex-direction:column; gap:8px; padding:16px; border-radius:16px; background:rgba(252,115,77,0.08); border:1px solid rgba(252,115,77,0.35);"><div style="display:flex; justify-content:space-between; font-size:14px;"><strong>' + L.feas + '</strong><span style="color:#FC734D; font-weight:600;">' + L.feasV + '</span></div>' +
        L.checks.map(function (c) { return '<div style="display:flex; gap:8px; font-size:13px; color:rgba(242,244,245,0.82);"><span style="color:#FC734D;">○</span>' + c + '</div>'; }).join('') + '</div>';
      h += '<a href="' + (window.TRY_URL || '#') + '" style="display:flex; justify-content:space-between; align-items:center; padding:15px 18px; border-radius:12px; background:#FC734D; color:#02070A; font-family:var(--font-heading); font-weight:800; font-size:15px; text-decoration:none;">' + L.cta + '<span>→</span></a>';
      panel.innerHTML = h;
      var picks = panel.querySelectorAll('[data-pick]');
      for (var i = 0; i < picks.length; i++) picks[i].addEventListener('click', function (e) { go(+e.currentTarget.getAttribute('data-pick')); });
    }
    function stat(v, label, c) {
      return '<div style="display:flex; flex-direction:column; gap:4px;"><span style="font-family:var(--font-heading); font-weight:800; font-size:clamp(20px,1.9vw,26px); color:' + c + '; font-variant-numeric:tabular-nums;">' + v + '</span><span style="font-size:11.5px; line-height:1.3; color:rgba(242,244,245,0.7);">' + label + '</span></div>';
    }
    function renderDots() {
      dots.innerHTML = '';
      SECTORS.forEach(function (o, i) {
        var b = el('button', 'width:28px; height:28px; flex:none; padding:0; border:0; border-radius:50%; cursor:pointer; background:radial-gradient(circle, ' + (i === idx ? '#F2F4F5' : 'rgba(242,244,245,0.35)') + ' 0 5px, transparent 5.5px);');
        b.type = 'button'; b.setAttribute('aria-label', nm(o)); if (i === idx) b.setAttribute('aria-current', 'true');
        b.addEventListener('click', function () { go(i); });
        dots.appendChild(b);
      });
    }
    function render() {
      L = T[(document.documentElement.lang || 'en').slice(0, 2)] || T.en;
      var s = SECTORS[idx];
      img.style.opacity = '0';
      var src = s.img; var im = new Image(); im.onload = function () { if (dead) return; img.src = src; img.style.opacity = '1'; }; im.src = src;
      img.alt = nm(s) + ' · Sentinel-2';
      prev.setAttribute('aria-label', L.prev); next.setAttribute('aria-label', L.next);
      foot.textContent = L.note + ' ' + L.attr;
      renderArms(); renderPanel(); renderDots();
    }
    function go(i) { idx = (i + SECTORS.length) % SECTORS.length; render(); }
    prev.addEventListener('click', function () { go(idx - 1); });
    next.addEventListener('click', function () { go(idx + 1); });
    function onDoc(e) { if (open >= 0 && !pop.contains(e.target)) closePop(); }
    function onKey(e) { if (e.key === 'Escape') closePop(); }
    document.addEventListener('click', onDoc); document.addEventListener('keydown', onKey);
    function onMq() { renderArms(); }
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    var mo = new MutationObserver(function () { render(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    if (!document.getElementById('anl-arm-kf')) {
      var st = document.createElement('style'); st.id = 'anl-arm-kf';
      st.textContent = '@keyframes anlArm{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}@media (prefers-reduced-motion: reduce){[style*="anlArm"]{animation:none !important}}';
      document.head.appendChild(st);
    }
    render();
    return { destroy: function () { dead = true; mo.disconnect(); if (mq.removeEventListener) mq.removeEventListener('change', onMq); document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); root.innerHTML = ''; } };
  }
  window.AnalogSectors = AnalogSectors;
})();
