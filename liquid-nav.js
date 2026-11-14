/* Liquid glass navbar ("Waterline", Nimbus UI by guglielmogiannattasio.it), ported to plain JS for AnalogOS.
   Water tinted to #0297DE. API: new AnalogLiquidNav(host, {items, active, tone, onSelect}) -> {setActive, setLabels, destroy} */
(function () {
  if (window.AnalogLiquidNav) return;
  var PAD = 14;
  var CSS = '\
.nimbus-nav{--n-tint:rgba(255,255,255,.14);--n-fg:#0B132B;--n-fg-soft:rgba(11,19,43,.6);--n-rim:rgba(255,255,255,.7);position:relative;display:inline-flex;align-items:center;gap:2px;padding:5px;border-radius:999px;isolation:isolate;font-family:inherit;-webkit-font-smoothing:antialiased;user-select:none;-webkit-tap-highlight-color:transparent}\
.nimbus-nav[data-tone="dark"]{--n-tint:rgba(4,20,34,.42);--n-fg:#F2F4F5;--n-fg-soft:rgba(242,244,245,.72);--n-rim:rgba(255,255,255,.28)}\
.nimbus-glass{position:absolute;inset:0;border-radius:inherit;z-index:-2;overflow:hidden;background:var(--n-tint);-webkit-backdrop-filter:blur(10px) saturate(1.2) brightness(1.08);backdrop-filter:blur(10px) saturate(1.2) brightness(1.08);box-shadow:inset 0 1px 1px var(--n-rim),inset 0 0 0 1px rgba(255,255,255,.14),0 12px 32px -14px rgba(0,40,90,.6),0 2px 6px rgba(0,40,90,.12)}\
.nimbus-nav[data-refract="on"] .nimbus-glass{-webkit-backdrop-filter:url(#nimbus-refract) blur(2px) saturate(1.2) brightness(1.08);backdrop-filter:url(#nimbus-refract) blur(2px) saturate(1.2) brightness(1.08)}\
.nimbus-water{position:absolute;left:-' + PAD + 'px;top:-' + PAD + 'px;z-index:-1;pointer-events:none}\
.nimbus-nav[data-gl="off"] .nimbus-water{display:none}\
.nimbus-drop{display:none;position:absolute;top:5px;bottom:5px;left:0;border-radius:999px;z-index:-1;pointer-events:none;will-change:transform,width;background:radial-gradient(120% 140% at 30% 0%,rgba(140,214,250,.6),rgba(2,151,222,0) 55%),rgba(2,151,222,.42);box-shadow:inset 0 1px 1px rgba(255,255,255,.6),inset 0 -2px 6px rgba(2,151,222,.35),inset 0 0 0 1px rgba(140,214,250,.45),0 6px 16px -6px rgba(0,70,140,.55)}\
.nimbus-nav[data-gl="off"] .nimbus-drop{display:block}\
.nimbus-item{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 15px;border:0;border-radius:999px;background:none;color:var(--n-fg-soft);font-family:inherit;font-weight:500;font-size:14px;line-height:1;letter-spacing:-.01em;text-decoration:none;cursor:pointer;transition:color .25s;white-space:nowrap}\
.nimbus-item:hover,.nimbus-item[aria-current="true"]{color:var(--n-fg)}\
.nimbus-item:focus-visible{outline:2px solid #0297DE;outline-offset:2px}\
.nv-ico{position:relative;display:inline-flex;flex:none}\
.nv-ico svg{transition:transform .45s cubic-bezier(.3,1.6,.5,1)}\
.nimbus-item[aria-current="true"] .nv-ico svg{transform:translateY(-1px) scale(1.08)}\
.nv-ico[data-fx="pop"] svg{animation:nvPop .5s cubic-bezier(.3,1.6,.5,1) both}\
@keyframes nvPop{0%{transform:scale(.72)}60%{transform:scale(1.2)}100%{transform:translateY(-1px) scale(1.08)}}\
.nv-ico[data-fx="spin"] svg{animation:nvSpin 1s cubic-bezier(.2,.75,.25,1) both}\
@keyframes nvSpin{0%{transform:perspective(80px) rotateY(0)}100%{transform:perspective(80px) rotateY(360deg) translateY(-1px) scale(1.08)}}\
.nv-ico[data-fx="glow"] svg{animation:nvHop .8s cubic-bezier(.3,1.4,.5,1) both;transform-origin:50% 100%;filter:drop-shadow(0 0 6px rgba(140,214,250,.9))}\
@keyframes nvHop{0%{transform:none}30%{transform:translateY(-5px) scale(1.04,.96)}55%{transform:translateY(0) scale(1.12,.88)}75%{transform:translateY(-2px) scale(.98,1.04)}100%{transform:translateY(-1px) scale(1.08)}}\
.nimbus-nav[data-compact="true"] .nimbus-item{padding:0 12px}\
.nimbus-nav[data-compact="true"] .nimbus-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}\
@media (max-width:420px){.nimbus-nav[data-compact="true"] .nimbus-item{padding:0 9px}}\
@media (prefers-reduced-motion:reduce){.nv-ico svg{animation:none!important;transition:none}}';
  var VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FRAG = 'precision highp float;\n\
uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform vec4 uPill;\n\
uniform vec4 uBlob[6];uniform float uSy[6];uniform vec4 uRip[6];uniform vec3 uMouse;uniform float uDark;uniform float uAmb;\n\
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}\n\
float sdCap(vec2 p,vec4 B,float sy){p-=B.xy;p.y/=sy;p.x=max(abs(p.x)-B.z,0.);return(length(p)-B.w)*min(1.,sy);}\n\
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}\n\
float dropD(vec2 p){float d=1e4;for(int i=0;i<6;i++){if(uBlob[i].w>.5){d=smin(d,sdCap(p,uBlob[i],uSy[i]),13.);}}return d;}\n\
float pillD(vec2 p){vec2 h=uPill.zw*.5;return sdRB(p-uPill.xy-h,h,h.y);}\n\
float lens(float d,float w){float t=clamp(-d/w,0.,1.);return sqrt(1.-(1.-t)*(1.-t));}\n\
float waves(vec2 p){float w=0.;\n\
 for(int i=0;i<6;i++){vec4 R=uRip[i];if(R.w>0.){float x=length(p-R.xy)-R.z*240.;w+=R.w*exp(-R.z*1.7)*sin(x*.3)*exp(-x*x/700.);}}\n\
 vec2 m=p-uMouse.xy;w+=uMouse.z*3.6*exp(-dot(m,m)/1000.);\n\
 w+=uAmb*(sin(p.x*.05+uTime*1.2)*.45+sin(p.x*.13-uTime*.85+p.y*.2)*.25);return w;}\n\
float H(vec2 p){float dp=pillD(p);return lens(dp,uPill.w*.36)*2.4+lens(dropD(p),11.)*7.5+waves(p)*smoothstep(0.,7.,-dp);}\n\
float caus(vec2 p,float t){vec2 q=p;float c=0.;for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.1+t),cos(q.x*1.3-t*.7))*.6;c+=1./(1.+16.*abs(sin(q.x)*sin(q.y)));}return c/3.;}\n\
void main(){\n\
 vec2 p=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;\n\
 float dp=pillD(p);float dd=dropD(p);\n\
 float h0=H(p);vec3 n=normalize(vec3(h0-H(p+vec2(1.,0.)),h0-H(p+vec2(0.,1.)),1.));\n\
 vec3 V=vec3(0.,0.,1.);\n\
 float spec=pow(max(dot(reflect(-normalize(vec3(-.45,-.8,.85)),n),V),0.),70.);\n\
 float spec2=pow(max(dot(reflect(-normalize(vec3(.6,.75,.7)),n),V),0.),22.)*.3;\n\
 float fres=clamp((1.-n.z)*4.,0.,1.);\n\
 vec3 irid=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+fres*.85+p.x*.0028+uTime*.035));\n\
 float pm=smoothstep(1.,-1.,dp);float dm=smoothstep(1.,-1.,dd)*smoothstep(1.,-2.,dp);\n\
 float sh=smoothstep(9.,-9.,dropD(p-vec2(0.,5.)))*(1.-dm)*pm*(.11+.07*uDark);\n\
 vec3 c=vec3(0.,.14,.36)*sh;float a=sh;\n\
 float pa=clamp(pm*(fres*.5+spec*.9+spec2),0.,1.);\n\
 c=mix(vec3(1.),irid,.5*fres)*pa+c*(1.-pa);a=pa+a*(1.-pa);\n\
 float th=lens(dd,11.);\n\
 float cs=caus((p+n.xy*th*18.)*.085,uTime*.9);\n\
 vec3 tint=mix(vec3(.45,.78,.95),vec3(.01,.59,.87),uDark);\n\
 float rim=dm*(1.-smoothstep(0.,8.,-dd));\n\
 float cres=dm*smoothstep(.12,.55,dot(n.xy,normalize(vec2(.55,.85))))*smoothstep(0.,3.,-dd);\n\
 float body=.5+.5*clamp(-n.y*3.,-1.,1.);\n\
 float da=dm*(.34+.16*body);vec3 dc=mix(tint,vec3(.55,.84,.98),body*.45);\n\
 float la=rim*.3;vec3 lc=vec3(.01,.59,.87);dc=lc*la+dc*da*(1.-la);da=la+da*(1.-la);\n\
 la=clamp(cres*.6+smoothstep(.6,1.,cs)*.24*th*dm,0.,1.);dc=vec3(.85,.95,1.)*la+dc*(1.-la);da=la+da*(1.-la);\n\
 la=clamp(dm*(spec*1.2+spec2*.5),0.,1.);dc=vec3(1.)*la+dc*(1.-la);da=la+da*(1.-la);\n\
 la=dm*smoothstep(-2.,0.,dd)*.35;dc=mix(vec3(.6,.86,1.),irid,.3)*la+dc*(1.-la);da=la+da*(1.-la);\n\
 c=dc+c*(1.-da);a=da+a*(1.-da);\n\
 gl_FragColor=vec4(c,a);\n\
}';
  function injectCSS() {
    if (document.getElementById('nimbus-css')) return;
    var st = document.createElement('style'); st.id = 'nimbus-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  function initGL(canvas) {
    var gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    gl.useProgram(p);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(p, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var u = {}; ['uRes', 'uDpr', 'uTime', 'uPill', 'uBlob', 'uSy', 'uRip', 'uMouse', 'uDark', 'uAmb'].forEach(function (n) { u[n] = gl.getUniformLocation(p, n); });
    return { gl: gl, u: u };
  }
  function supportsRefraction() {
    var ua = navigator.userAgent;
    return /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua) && !!(window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'url(#a)'));
  }

  function AnalogLiquidNav(host, opts) {
    injectCSS();
    var self = this, items = opts.items || [], current = opts.active || 0, dark = opts.tone === 'dark' ? 1 : 0;
    var s = { a: { x: 0, v: 0 }, b: { x: 0, v: 0 }, sy: { s: 1, v: 0 }, lead: 0, lagFrom: 0, sats: [], rips: [], t: { x: 0, cy: 0, q: 0, r: 20 }, q: 0,
      mouse: { x: 0, y: 0, s: 0, on: false }, moving: false, split: false, ready: false, w: 0, h: 0, visible: true, reduce: false, raf: 0, last: 0, time: 0, glc: null };
    var nav = document.createElement('nav');
    nav.className = 'nimbus-nav'; nav.setAttribute('data-tone', opts.tone || 'dark'); nav.setAttribute('aria-label', opts.ariaLabel || 'Main');
    nav.setAttribute('data-refract', supportsRefraction() ? 'on' : 'off');
    nav.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="nimbus-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves="2" seed="7" result="noise"/><feGaussianBlur in="noise" stdDeviation="2" result="soft"/><feDisplacementMap in="SourceGraphic" in2="soft" scale="60" xChannelSelector="R" yChannelSelector="G"/></filter></svg><span class="nimbus-glass" aria-hidden="true"></span><canvas class="nimbus-water" aria-hidden="true"></canvas><span class="nimbus-drop" aria-hidden="true"></span>';
    var canvas = nav.querySelector('canvas'), drop = nav.querySelector('.nimbus-drop');
    var els = items.map(function (it, i) {
      var a = document.createElement(it.href ? 'a' : 'button');
      a.className = 'nimbus-item';
      if (it.href) a.href = it.href; else a.type = 'button';
      a.innerHTML = '<span class="nv-ico">' + (it.icon || '') + '</span><span class="nimbus-label"></span>';
      a.querySelector('.nimbus-label').textContent = it.label;
      a.setAttribute('aria-label', it.label);
      a.addEventListener('click', function (e) { if (it.href) e.preventDefault(); select(i, true); });
      nav.appendChild(a);
      return a;
    });
    host.appendChild(nav);
    s.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    s.glc = initGL(canvas);
    nav.setAttribute('data-gl', s.glc ? 'on' : 'off');

    function draw() {
      var T = s.t, sep = Math.abs(s.a.x - s.b.x), thin = Math.min(sep / (2 * (s.q + T.r) || 1), 1), r = T.r * (1 - 0.3 * thin);
      if (s.glc) {
        var g = s.glc.gl, u = s.glc.u, dpr = Math.min(window.devicePixelRatio || 1, 2);
        g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight);
        g.uniform2f(u.uRes, s.w + PAD * 2, s.h + PAD * 2); g.uniform1f(u.uDpr, dpr); g.uniform1f(u.uTime, s.time);
        g.uniform4f(u.uPill, PAD, PAD, s.w, s.h);
        var blobs = new Float32Array(24), sy = new Float32Array(6).fill(1);
        var head = s.lead === 0 ? s.a : s.b, tail = s.lead === 0 ? s.b : s.a;
        blobs.set([head.x, T.cy, s.q * (1 - 0.25 * thin), T.r * (1 - 0.12 * thin), tail.x, T.cy, s.q * (1 - 0.8 * thin), T.r * (1 - 0.5 * thin)], 0);
        sy[0] = sy[1] = s.sy.s;
        s.sats.slice(0, 4).forEach(function (d, i) { blobs.set([d.x, d.y, 0, d.r], 8 + i * 4); });
        g.uniform4fv(u.uBlob, blobs); g.uniform1fv(u.uSy, sy);
        var rips = new Float32Array(24);
        s.rips.slice(-6).forEach(function (p, i) { rips.set([p.x, p.y, p.age, p.amp], i * 4); });
        g.uniform4fv(u.uRip, rips); g.uniform3f(u.uMouse, s.mouse.x, s.mouse.y, s.mouse.s);
        g.uniform1f(u.uDark, dark); g.uniform1f(u.uAmb, s.reduce ? 0 : 1);
        g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT); g.drawArrays(g.TRIANGLES, 0, 3);
      } else {
        var left = Math.min(s.a.x, s.b.x) - s.q - r - PAD, width = sep + 2 * (s.q + r);
        drop.style.width = width + 'px'; drop.style.transform = 'translateX(' + left + 'px) scaleY(' + s.sy.s + ')';
      }
    }
    function step(dt, now) {
      var T = s.t; s.time += dt; s.q += (T.q - s.q) * Math.min(1, dt * 12);
      var bodies = [s.a, s.b], still = true;
      if (s.reduce) { s.a.x = s.b.x = T.x; s.a.v = s.b.v = 0; s.sy.s = 1; s.sats = []; }
      else {
        bodies.forEach(function (B, i) {
          var lead = i === s.lead, k = lead ? 210 : 72, c = lead ? 25 : 13, f = !lead && now < s.lagFrom ? 0.08 : 1;
          B.v += (k * (T.x - B.x) - c * B.v) * dt * f; B.x += B.v * dt;
          var lo = PAD + 6 + s.q + T.r - 3, hi = PAD + s.w - 6 - s.q - T.r + 3;
          if (B.x < lo || B.x > hi) { s.sy.v -= Math.min(Math.abs(B.v), 900) * 0.0016; B.x = Math.max(lo, Math.min(hi, B.x)); B.v *= -0.25; }
          if (Math.abs(T.x - B.x) > 0.3 || Math.abs(B.v) > 3) still = false;
        });
        var L = bodies[s.lead], syT = 1 - 0.2 * Math.min(Math.abs(L.v) / 1500, 1);
        s.sy.v += (280 * (syT - s.sy.s) - 9 * s.sy.v) * dt; s.sy.s += s.sy.v * dt;
        if (Math.abs(s.sy.s - 1) > 0.002 || Math.abs(s.sy.v) > 0.02) still = false;
        var sep = Math.abs(s.a.x - s.b.x), r = T.r * (1 - 0.3 * Math.min(sep / (2 * (T.q + T.r) || 1), 1));
        if (!s.split && s.moving && sep - 2 * T.q - 2 * r > -6) {
          s.split = true;
          var lo2 = bodies[1 - s.lead], hi2 = bodies[s.lead];
          [0.3, 0.5, 0.72].forEach(function (t, j) {
            s.sats.push({ x: lo2.x + (hi2.x - lo2.x) * t + (Math.random() - 0.5) * 6, y: T.cy + (Math.random() - 0.5) * 10, vx: (lo2.v + hi2.v) * 0.45, vy: (Math.random() - 0.5) * 60, r: 5 + Math.random() * 3 - j * 0.5, k: 70 + Math.random() * 90 });
          });
        }
        s.sats = s.sats.filter(function (d) {
          d.vx += (d.k * (T.x - d.x) - 9 * d.vx) * dt; d.vy += (90 * (T.cy - d.y) - 7 * d.vy) * dt;
          d.x += d.vx * dt; d.y += d.vy * dt;
          d.x = Math.max(PAD + 8 + d.r, Math.min(PAD + s.w - 8 - d.r, d.x)); d.y = Math.max(T.cy - T.r + d.r, Math.min(T.cy + T.r - d.r, d.y));
          if (Math.abs(T.x - d.x) < T.q + T.r * 0.5) d.r -= dt * 26;
          return d.r > 0.6;
        });
        if (s.sats.length) still = false;
      }
      if (s.moving && still) { s.moving = false; if (!s.reduce) s.rips.push({ x: T.x, y: T.cy, age: 0, amp: s.split ? 1.2 : 0.7 }); }
      s.rips.forEach(function (p) { p.age += dt; }); s.rips = s.rips.filter(function (p) { return p.age < 2.4; });
      s.mouse.s += ((s.mouse.on ? 1 : 0) - s.mouse.s) * Math.min(1, dt * 7);
    }
    function loop() {
      if (s.raf || s.dead) return;
      s.last = performance.now();
      var tick = function (now) {
        var dt = Math.min((now - s.last) / 1000, 1 / 30); s.last = now;
        step(dt, now); draw();
        var busy = s.moving || s.rips.length || s.sats.length || s.mouse.s > 0.01;
        if (s.visible && !document.hidden && (!s.reduce || busy)) s.raf = requestAnimationFrame(tick); else s.raf = 0;
      };
      s.raf = requestAnimationFrame(tick);
    }
    function measure() {
      var el = els[current]; if (!el) return;
      s.w = nav.offsetWidth; s.h = nav.offsetHeight;
      var T = s.t; T.r = el.offsetHeight / 2; T.q = Math.max(0, el.offsetWidth / 2 - T.r); T.cy = PAD + el.offsetTop + el.offsetHeight / 2;
      var nx = PAD + el.offsetLeft + el.offsetWidth / 2;
      if (!s.ready) { s.a.x = s.b.x = nx; s.q = T.q; s.ready = true; }
      else if (Math.abs(nx - T.x) > 0.5) { s.lead = Math.abs(nx - s.a.x) <= Math.abs(nx - s.b.x) ? 0 : 1; s.lagFrom = performance.now() + 70; s.moving = true; s.split = false; }
      T.x = nx;
      var dpr = Math.min(window.devicePixelRatio || 1, 2), W = s.w + PAD * 2, Hh = s.h + PAD * 2;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(Hh * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr); canvas.style.width = W + 'px'; canvas.style.height = Hh + 'px'; }
      loop();
    }
    function local(cx, cy) { var r = nav.getBoundingClientRect(); return { x: cx - r.left + PAD, y: cy - r.top + PAD }; }
    function ripple(x, y, amp) { if (s.reduce) return; s.rips.push({ x: x, y: y, age: 0, amp: amp }); loop(); }
    function playFx(i) {
      var ico = els[i] && els[i].querySelector('.nv-ico'); if (!ico) return;
      var fx = items[i].fx || 'pop', fresh = ico.cloneNode(true); fresh.setAttribute('data-fx', fx); ico.replaceWith(fresh);
    }
    function mark() { els.forEach(function (el, i) { if (i === current) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); }); }
    function select(i, user) {
      if (user) playFx(i);
      if (i !== current) { current = i; mark(); measure(); }
      if (user && opts.onSelect) opts.onSelect(i, items[i]);
    }
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); var n = (current + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length; select(n, true); els[n].focus();
    });
    nav.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var p = local(e.clientX, e.clientY); s.mouse.x = p.x; s.mouse.y = p.y; s.mouse.on = true; loop(); });
    nav.addEventListener('pointerleave', function () { s.mouse.on = false; loop(); });
    nav.addEventListener('pointerdown', function (e) { var p = local(e.clientX, e.clientY); ripple(p.x, p.y, 0.8); });
    var io = new IntersectionObserver(function (es) { s.visible = es[0].isIntersecting; if (s.visible) loop(); }); io.observe(nav);
    var onVis = function () { if (!document.hidden) loop(); }; document.addEventListener('visibilitychange', onVis);
    var lastW = -1, ro = new ResizeObserver(function () { var w = nav.offsetWidth; if (w !== lastW) { lastW = w; s.ready = false; measure(); } }); ro.observe(nav);
    mark(); measure();
    this.el = nav;
    this.setActive = function (i) { if (i >= 0 && i < items.length && i !== current) select(i, false); };
    this.setLabels = function (labels) { labels.forEach(function (l, i) { if (!els[i]) return; items[i].label = l; els[i].querySelector('.nimbus-label').textContent = l; els[i].setAttribute('aria-label', l); }); s.ready = false; measure(); };
    this.setCompact = function (on) { nav.setAttribute('data-compact', on ? 'true' : 'false'); s.ready = false; requestAnimationFrame(measure); };
    this.destroy = function () { s.dead = true; cancelAnimationFrame(s.raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); nav.remove(); };
  }
  window.AnalogLiquidNav = AnalogLiquidNav;
})();
