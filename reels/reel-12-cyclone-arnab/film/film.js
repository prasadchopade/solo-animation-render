// Reel 12 · Cyclone Arnab, made the AI171 way (the user, 2026-10-29: "make the reel just like you made the 1st viral reel
// of air india"; no Root Cause headline or logo mid-reel; reels/reel-1-ai171-short/docs/style_guide.md). A newsroom visual
// investigation on blue-black with one signal-red accent: the Bay of Bengal as a line chart with a graticule, the storm
// seen from above (its bands turning counter-clockwise round a clear eye), condensed type left-aligned in the text zone
// (y 1200–1520) and lit as the voice says it, data and sources in mono, graphics in y 290–1180. 17 hard-cut shots; every
// hold drifts and pushes in; impacts kick the camera; grain and a vignette over it all. 30 fps, no motion blur.
// The story: Arnab crossed near Narsapur on 28 Oct 2026; a year to the day Montha crossed the same coast. Not a coincidence:
// a season (summer winds tear storms apart; October's are calm over a warm sea; storms are steered north-west, at this
// coast). The Bay makes 1 in 20 of the world's cyclones and, historically, most of the deaths (a shallow funnel: the surge;
// 1977: a six-metre surge, 10,000 dots lit, a piano in the silence). This time 50,000+ moved before landfall. What
// changed: the list (weaker storms? no · warnings days ahead · shelters). Next October the Bay will be warm again: back to
// frame 0. Pure functions of t.
(() => {
  const { W, H, put, reg, el, scene, canvas, clamp, lerp, ease, mulberry32 } = C;
  const K = window.KIT, GB = window.GLOBE;
  const { st, hit, tb, words, cam, clear, drift, kick, font } = K;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn', '400 30px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI, eio = ease.inOut, eo = ease.out;
  const X0 = 80, TZ = 1222;
  const INK = '#ece8e1', INK2 = '#8d949c', BG = '#07090c', BG2 = '#0e1217', ACC = '#ff3b1f';

  // ------------------------------------------------------------------ timing (the narration's words)
  const FB = { s01: 0.3, s02: 5.58, s03: 9.64, s04: 12.45, s05: 18.96, s06: 24.05, s07: 30.16, s08: 39.84, s09: 46.83, s10: 54.02 };
  const has = (p) => words(p).length > 0;
  const at = (p) => (has(p) ? words(p)[0].t0 : FB[p]);
  const wi = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t0 : at(p) + 0.3 * i);
  const wv = (p, ...ix) => ix.map((i) => wi(p, i));
  const LINES = ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10'];
  let T = null;
  function times() {
    if (T) return T;
    const t = {
      a: Object.fromEntries(LINES.map((p) => [p, at(p)])),
      narsapur: wi('s01', 6), year: wi('s02', 1), day: wi('s02', 5), cyc2: wi('s02', 6), same: wi('s02', 10), coast2: wi('s02', 11),
      season: wi('s03', 6), tear: wi('s04', 4), apart: wi('s04', 6), in4: wi('s04', 7), october4: wi('s04', 8), drop: wi('s04', 10), sea4: wi('s04', 13), warm4: wi('s04', 16),
      steered: wi('s05', 10), northwest: wi('s05', 11), straight: wi('s05', 12), coast5: wi('s05', 15),
      one: wi('s06', 5), historically: wi('s06', 13), most: wi('s06', 14),
      shallow: wi('s07', 1), funnel: wi('s07', 2), piles: wi('s07', 4), surges: wi('s07', 6), in7: wi('s07', 7), nineteen: wi('s07', 8), sixmetre: wi('s07', 11),
      killed: wi('s07', 16), at7: wi('s07', 17), ten: wi('s07', 19), people7: wi('s07', 21),
      but: wi('s08', 6), fifty: wi('s08', 10), moved: wi('s08', 14), before: wi('s08', 15), hit8: wi('s08', 17),
      root: wi('s09', 1), difference: wi('s09', 5), not9: wi('s09', 6), weaker: wi('s09', 7), warnings: wi('s09', 9), ahead: wi('s09', 11), shelters: wi('s09', 13),
      storm9: wi('s09', 17), warm10: wi('s10', 6), end: tb('end'),
    };
    // the cuts (17 shots): each on a phrase of the voice, a beat before it
    t.cut = [0, t.a.s02 - 0.13, t.cyc2 - 0.13, t.a.s03 - 0.18, t.a.s04 - 0.15, t.in4 - 0.13, t.a.s05 - 0.18, t.a.s06 - 0.15, t.a.s07 - 0.16,
      t.piles - 0.17, t.in7 - 0.1, t.at7 - 0.12, t.a.s08 - 0.15, t.but - 0.15, t.a.s09 - 0.14, t.not9 - 0.11, t.a.s10 - 0.12, t.end];
    t.s9end = has('s09') ? words('s09')[words('s09').length - 1].t1 : t.storm9 + 0.6;
    t.storms9e = has('s09') ? words('s09')[8].t1 : t.weaker + 0.6;          // the end of "storms."
    T = t; return T;
  }

  // ------------------------------------------------------------------ type (DOM, the text zone), as in AI171
  const line = (parent, text, o) => TYPE.line(parent, text, { cls: 'display', ...o });
  function rise(t, L, tins, tout = null, o = {}) {            // words rise through their mask at absolute seconds; lift out from tout
    const preset = o.preset || 'heavy', below = L.size * 1.45, above = -L.size * 1.45;
    L.words.forEach((w, i) => {
      const ti = Array.isArray(tins) ? tins[Math.min(i, tins.length - 1)] : tins + i * (o.stagger ?? 0.05);
      let y = below * (1 - hit(t, ti, preset));
      if (tout != null) y += above * st(t, tout - 0.15 + i * 0.015, 'snappy');
      put(w, { y, hide: y >= below * 0.999 || y <= above * 0.999 });
    });
  }
  function light(t, L, times, acc = []) {                       // each word full strength once it is said
    L.words.forEach((w, i) => {
      const on = t >= times[Math.min(i, times.length - 1)] - 0.04, a = acc.includes(i);
      put(w, { css: { color: a ? (on ? 'var(--accent)' : 'rgba(255,59,31,0.7)') : (on ? '' : 'rgba(236,232,225,0.78)') } });
    });
  }
  const mono = (parent, html, x, y, size = 30, color = 'var(--ink-2)') =>
    reg(el('div', { class: 'abs mono', style: `left:${x}px;top:${y}px;font-size:${size}px;color:${color}` }, parent, html), { o: 0 });
  function enter(t, e, t0, out) {
    const p = hit(t, t0, 'default'), ex = out != null ? st(t, out - 0.14, 'snappy') : 0;
    put(e, { o: clamp(p * 5) * (1 - clamp(ex * 1.6)), y: 24 * (1 - p) - 24 * ex });
  }
  function under(root) {                                       // vignette + text-zone scrim, under the type
    return el('div', { class: 'abs', style: `width:${W}px;height:${H}px;pointer-events:none;background:` +
      'linear-gradient(180deg, rgba(7,9,12,0) 0px, rgba(7,9,12,0) 1000px, rgba(7,9,12,0.7) 1200px, rgba(7,9,12,0.82) 100%),' +
      'radial-gradient(ellipse 90% 75% at 50% 42%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%)' }, root);
  }

  // ------------------------------------------------------------------ canvas helpers
  function shotCam(g, t, i, o = {}) {                           // every hold drifts and pushes in; impacts kick
    const T = times(), u = t - T.cut[i], d = Math.max(0.5, T.cut[i + 1] - T.cut[i]), dr = drift(t, o.drift ?? 6);
    let kx = 0, ky = 0; for (const [k0, a] of o.kicks || []) { const q = kick(t, k0, a); kx += q.x; ky += q.y; }
    cam(g, { s: 1 + (o.push ?? 0.05) * eio(clamp(u / d)), x: dr.x + kx, y: dr.y + ky, oy: o.oy ?? 740 });
  }
  function ground(g) { g.fillStyle = BG; g.fillRect(-400, -400, W + 800, H + 800); }
  function grid(g, a = 0.06) {
    g.strokeStyle = `rgba(141,148,156,${a})`; g.lineWidth = 1;
    for (let x = 40; x < W; x += 80) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x, H + 200); g.stroke(); }
    for (let y = 40; y < H; y += 80) { g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); }
  }
  function mlabel(g, s, x, y, a = 1, o = {}) {                 // mono data/source text on the canvas
    if (a <= 0.01) return;
    const size = o.size || 26;
    g.save(); g.globalAlpha *= a; font(g, size, o.w || 700, 'normal', 'Mono'); g.letterSpacing = '0.06em'; g.textAlign = o.align || 'left';
    if (o.bg) { const w = g.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; g.fillStyle = 'rgba(7,9,12,0.85)'; g.fillRect(x0 - 12, y - size * 0.95, w + 24, size * 1.38); }
    g.fillStyle = o.c || INK; g.fillText(s, x, y); g.restore();
  }
  const eyebrow = (g, s, t, t0, c = INK2) => mlabel(g, s, X0, 330, clamp((t - t0) / 0.25), { size: 26, c });
  function dashed(g, pts, k, color, w = 4, dash = [10, 12]) {   // a polyline drawn up to k (0..1 of its length)
    if (k <= 0.005 || pts.length < 2) return;
    let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let left = L * clamp(k);
    g.save(); g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash(dash); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) { const u = Math.min(1, left / seg[i - 1]); g.lineTo(lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)); left -= seg[i - 1]; }
    g.stroke(); g.restore();
  }
  const curve = (A, B, Cc, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [(1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * B[0] + u * u * Cc[0], (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * B[1] + u * u * Cc[1]]; });
  const along = (P, u) => { const i = Math.min(P.length - 2, Math.floor(clamp(u) * (P.length - 1))), f = clamp(u) * (P.length - 1) - i; return [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f)]; };
  function keyLL(keys, t) {                                     // [[t, lon, lat], ...]: eased between keys
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) { const [t0, a0, b0] = keys[i - 1], [t1, a1, b1] = keys[i], k = eio(clamp((t - t0) / (t1 - t0))); return [lerp(a0, a1, k), lerp(b0, b1, k)]; }
    }
    return keys[keys.length - 1].slice(1);
  }
  function redPin(g, x, y, k, t) {
    if (k <= 0.01) return;
    const r = 11 * clamp(k, 0, 1.3), ph = (t * 1.1) % 1;
    g.fillStyle = ACC; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = `rgba(255,59,31,${(0.75 * (1 - ph) * clamp(k)).toFixed(3)})`; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 36 * ph, 0, TAU); g.stroke();
  }
  function rain(g, t, k) {
    if (k <= 0.01) return;
    const r = mulberry32(3);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = `rgba(190,200,215,${(0.22 * k).toFixed(3)})`; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < 150; i++) {
      const x0 = r() * (W + 300), sp = 900 + r() * 500, y = ((r() * H + t * sp) % (H + 200)) - 100, x = x0 - (y / H) * 260;
      g.moveTo(x, y); g.lineTo(x - 16, y + 44);
    }
    g.stroke(); g.restore();
  }
  function stamp(g, x, y, k, text, color, rot = -0.08) {        // a rubber stamp slamming down
    if (k <= 0.005) return;
    const s = 1 + 0.6 * (1 - eo(clamp(k / 0.6)));
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= clamp(k * 3);
    font(g, 70, 700, 'condensed'); g.textAlign = 'center'; const w = g.measureText(text).width + 50;
    g.strokeStyle = color; g.lineWidth = 7; g.strokeRect(-w / 2, -50, w, 90); g.fillStyle = color; g.fillText(text, 0, 22); g.restore();
  }

  // ------------------------------------------------------------------ the map: a line chart of the Bay of Bengal (coastlines only, no borders)
  const LANDS = Object.values(GB.LAND);
  const APC = GB.LAND.eurasia.filter(([lo, la]) => lo > 79.6 && lo < 85.2 && la > 13.4 && la < 19.6);   // the Andhra coast
  const mv = (lon0, lat0, k, cy = 740) => ({ lon0, lat0, k, cy, c: Math.cos(lat0 * PI / 180) });
  const pj = (v, lon, lat) => [540 + (lon - v.lon0) * v.k * v.c, v.cy - (lat - v.lat0) * v.k];
  const lerpV = (A, B, u) => mv(lerp(A.lon0, B.lon0, u), lerp(A.lat0, B.lat0, u), Math.exp(lerp(Math.log(A.k), Math.log(B.k), u)), lerp(A.cy, B.cy, u));
  function drawMap(g, v, o = {}) {
    ground(g);
    if (o.heat > 0.005) {                                       // the warm sea (under the land)
      const [x, y] = pj(v, 87.5, 13.2), R0 = 8.6 * v.k * (1 + 0.025 * Math.sin((o.t || 0) * 2.2));
      const gr = g.createRadialGradient(x, y, 8, x, y, R0); gr.addColorStop(0, `rgba(255,59,31,${(0.4 * o.heat).toFixed(3)})`); gr.addColorStop(0.55, `rgba(168,35,15,${(0.2 * o.heat).toFixed(3)})`); gr.addColorStop(1, 'rgba(168,35,15,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, R0, 0, TAU); g.fill();
    }
    g.save(); g.strokeStyle = 'rgba(59,67,76,0.65)'; g.lineWidth = 1.2; font(g, 22, 400, 'normal', 'Mono'); g.fillStyle = 'rgba(141,148,156,0.7)';
    for (let lon = 60; lon <= 115; lon += 5) { const [x] = pj(v, lon, v.lat0); if (x < 30 || x > W - 30) continue; g.beginPath(); g.moveTo(x, 260); g.lineTo(x, 1200); g.stroke(); g.fillText(`${lon}°E`, x + 6, 1190); }
    for (let lat = 0; lat <= 35; lat += 5) { const [, y] = pj(v, v.lon0, lat); if (y < 290 || y > 1190) continue; g.beginPath(); g.moveTo(-400, y); g.lineTo(W + 400, y); g.stroke(); g.fillText(`${lat}°N`, 14, y - 8); }
    g.restore();
    g.fillStyle = BG2; g.strokeStyle = 'rgba(236,232,225,0.62)'; g.lineWidth = 2.2; g.lineJoin = 'round';
    for (const P of LANDS) { g.beginPath(); for (let i = 0; i < P.length; i++) { const [x, y] = pj(v, P[i][0], P[i][1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); g.fill(); g.stroke(); }
    if (o.apc > 0.005) {
      g.save(); g.strokeStyle = ACC; g.globalAlpha *= o.apc; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
      APC.forEach(([lo, la], i) => { const [x, y] = pj(v, lo, la); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); g.restore();
    }
  }
  const V1 = mv(82.6, 16.0, 100, 740), V2 = mv(88.0, 14.6, 52, 740), V3 = mv(85.4, 15.6, 74, 740), V4 = mv(89.5, 15.2, 50, 760);
  const NARSAPUR = [81.70, 16.43], LANDFALL = [81.74, 16.33];
  // the storm tracks (stylised: the direction and the landfall are the facts, not the path)
  const ARNAB = [[84.6, 14.5], [83.5, 15.35], LANDFALL, [81.3, 16.95]];
  const MONTHA = curve([85.6, 12.2], [83.6, 14.3], LANDFALL);
  const OCT = curve([89.2, 12.6], [86.4, 13.2], [82.1, 16.1]);
  const GHOSTS = [curve([90.5, 10.5], [86.5, 12.4], [81.0, 15.6]), curve([88.0, 9.0], [84.5, 11.0], [80.5, 14.4]), curve([91.0, 13.5], [87.0, 15.8], [83.6, 17.6]), curve([87.0, 8.0], [83.0, 10.6], [80.3, 13.4])];
  const FUNNEL = [curve([81.6, 11.2], [84.6, 16.6], [88.2, 21.0]), curve([96.4, 11.2], [94.0, 16.6], [90.2, 21.0])];
  const WIND = (() => { const r = mulberry32(5), o = []; for (let i = 0; i < 70; i++) o.push([79 + r() * 16, 5 + r() * 18, r()]); return o; })();
  const WDIR = [0.86, 0.5];                                     // the monsoon's winds aloft, toward the north-east
  function streaks(g, v, t, k) {
    g.save(); g.lineCap = 'round'; g.lineWidth = 3.5;
    for (const [lo, la, ph] of WIND) {
      const s = ((ph * 8 + t * 2.6) % 8), x0 = lo + WDIR[0] * s - 4, y0 = la + WDIR[1] * s - 2.3;
      const [xa, ya] = pj(v, x0, y0), [xb, yb] = pj(v, x0 + WDIR[0] * 1.3, y0 + WDIR[1] * 1.3);
      g.strokeStyle = `rgba(236,232,225,${(0.55 * k * Math.sin(PI * clamp(s / 8))).toFixed(3)})`; g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ the storm, seen from above (built once)
  function cycImg(rgb, seed) {                                  // spiral bands: inward they turn counter-clockwise (northern hemisphere)
    const S = 1000, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), r = mulberry32(seed), m = S / 2;
    const puff = (x, y, pr, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, pr); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, pr, 0, TAU); g.fill(); };
    puff(m, m, 495, 0.07);
    for (let arm = 0; arm < 4; arm++) for (let k = 0; k < 190; k++) {
      const u = k / 190, th = arm * TAU / 4 + u * 1.75 * PI + (r() - 0.5) * 0.05, rad = 140 + u * 345 + (r() - 0.5) * 12;
      puff(m + Math.cos(th) * rad, m + Math.sin(th) * rad, (36 - 20 * u) * (0.75 + 0.5 * r()), 0.3 * (1 - 0.6 * u));
    }
    for (let k = 0; k < 140; k++) { const th = r() * TAU, rad = Math.sqrt(r()) * 150; puff(m + Math.cos(th) * rad, m + Math.sin(th) * rad, 44 + r() * 28, 0.24); }
    g.globalCompositeOperation = 'destination-out';
    const eg = g.createRadialGradient(m, m, 0, m, m, 30); eg.addColorStop(0, 'rgba(0,0,0,1)'); eg.addColorStop(0.7, 'rgba(0,0,0,0.9)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = eg; g.beginPath(); g.arc(m, m, 30, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = `rgba(${rgb},0.6)`; g.lineWidth = 12; g.beginPath(); g.arc(m, m, 38, 0, TAU); g.stroke();
    return c;
  }
  const CYC = cycImg('236,232,225', 12), CYCG = cycImg('141,148,156', 21), CYCR = cycImg('255,59,31', 33);
  const SPIN = 0.32;
  function drawCyc(g, x, y, rPx, rot, a, o = {}) {
    if (a <= 0.005 || rPx < 2) return;
    const s = rPx / 480, img = o.img || CYC;
    g.save(); g.globalAlpha *= a; g.translate(x, y);
    if (o.torn > 0) {
      for (let i = 0; i < 6; i++) {
        const a0 = i / 6 * TAU - rot, a1 = (i + 1) / 6 * TAU - rot, mid = (a0 + a1) / 2, d = o.torn * rPx * (0.6 + 0.3 * (i % 3));
        g.save(); g.translate(Math.cos(o.wind) * d + Math.cos(mid) * d * 0.35, Math.sin(o.wind) * d + Math.sin(mid) * d * 0.35);
        g.globalAlpha *= clamp(1 - o.torn * 1.1); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, rPx * 1.15, a0, a1); g.closePath(); g.clip();
        g.rotate(-rot - o.torn * 0.6); g.scale(s, s); g.drawImage(img, -500, -500); g.restore();
      }
    } else { g.rotate(-rot); g.scale(s, s); g.drawImage(img, -500, -500); }
    g.restore();
  }

  // ------------------------------------------------------------------ the shots
  function shHook(g, t) {                                       // 0 · Arnab crosses near Narsapur
    const T = times();
    shotCam(g, t, 0, { kicks: [[0.06, 12], [T.narsapur - 0.15, 8]] });
    drawMap(g, V1);
    const ll = keyLL([[0, 83.5, 15.35], [T.narsapur, ...LANDFALL], [T.cut[1], 81.45, 16.62]], t);
    dashed(g, [pj(V1, ...ARNAB[0]), pj(V1, ...ll)], 1, 'rgba(236,232,225,0.4)', 3);
    drawCyc(g, ...pj(V1, ...ll), 4.3 * V1.k, t * SPIN, 1);
    const [nx, ny] = pj(V1, ...NARSAPUR); redPin(g, nx, ny, hit(t, T.narsapur - 0.05, 'playful'), t);
    mlabel(g, 'NARSAPUR', nx - 26, ny - 26, clamp((t - T.narsapur) / 0.3), { size: 28, align: 'right', bg: true });
    rain(g, t, 1);
    eyebrow(g, 'VERY SEVERE CYCLONIC STORM · LANDFALL', t, -0.3);
  }
  function shDate(g, t) {                                       // 1 · the date rolls back a year
    const T = times(), roll = eio(clamp((t - (T.year - 0.12)) / 0.35));
    shotCam(g, t, 1, { kicks: [[T.year - 0.05, 10]], push: 0.04 });
    ground(g); grid(g);
    font(g, 180, 700, 'condensed'); g.textAlign = 'left';
    const x0 = 80, y0 = 820, wDM = g.measureText('28.10.').width, wY = g.measureText('2026').width;
    g.fillStyle = INK; g.fillText('28.10.', x0, y0);
    g.save(); g.beginPath(); g.rect(x0 + wDM - 6, y0 - 190, wY + 30, 240); g.clip();
    g.fillStyle = INK; g.fillText('2026', x0 + wDM, y0 - 210 * roll); g.fillStyle = ACC; g.fillText('2025', x0 + wDM, y0 + 210 * (1 - roll)); g.restore();
    mlabel(g, 'CYCLONE ARNAB · LANDFALL', x0, 580, 1 - roll, { size: 30, c: INK2 });
    mlabel(g, 'CYCLONE MONTHA · LANDFALL', x0, 580, roll, { size: 30, c: ACC });
    mlabel(g, 'THE SAME DATE, ONE YEAR EARLIER', x0, 920, clamp((t - T.day) / 0.3), { size: 30, c: INK2 });
  }
  function shMontha(g, t) {                                     // 2 · Montha, to the same coast
    const T = times();
    shotCam(g, t, 2, { kicks: [[T.same - 0.12, 9], [T.coast2 + 0.12, 11]] });
    drawMap(g, V1);
    dashed(g, ARNAB.map((ll) => pj(V1, ...ll)), 1, 'rgba(236,232,225,0.35)', 3);
    const u = eio(clamp((t - (T.cyc2 - 0.2)) / Math.max(0.9, T.coast2 - T.cyc2 + 0.1)));
    dashed(g, MONTHA.map((ll) => pj(V1, ...ll)), u, 'rgba(141,148,156,0.9)', 4);
    drawCyc(g, ...pj(V1, ...along(MONTHA, u)), 3.2 * V1.k, t * SPIN, 1, { img: CYCG });
    const [nx, ny] = pj(V1, ...NARSAPUR); redPin(g, nx, ny, 1, t);
    mlabel(g, 'ARNAB · 28 OCT 2026', nx + 34, ny - 34, clamp((t - (T.same - 0.1)) / 0.25), { size: 28, bg: true });
    mlabel(g, 'MONTHA · 28 OCT 2025', nx + 34, ny + 18, clamp((t - (T.coast2 + 0.05)) / 0.25), { size: 28, bg: true, c: INK2 });
    eyebrow(g, 'BOTH CROSSED THE COAST NEAR NARSAPUR · IMD', t, T.cut[2] + 0.1);
  }
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function shSeason(g, t) {                                     // 3 · not a coincidence: a season
    const T = times(), kS = hit(t, T.season - 0.08, 'default');
    shotCam(g, t, 3, { kicks: [[T.season - 0.08, 10]], push: 0.04 });
    ground(g); grid(g);
    for (let i = 0; i < 12; i++) {
      const c = i % 4, r = Math.floor(i / 4), x = 80 + c * 220, y = 420 + r * 220, w = 200, on = (i === 9 || i === 10) && kS > 0.02;
      g.save(); g.globalAlpha *= clamp((t - (T.cut[3] + 0.03 * i)) / 0.25);
      if (on) { g.fillStyle = `rgba(255,59,31,${(0.9 * clamp(kS)).toFixed(3)})`; g.fillRect(x, y, w, w); }
      g.strokeStyle = on ? ACC : 'rgba(141,148,156,0.45)'; g.lineWidth = 3; g.strokeRect(x, y, w, w);
      font(g, 44, 700, 'normal', 'Mono'); g.textAlign = 'left'; g.fillStyle = on && kS > 0.5 ? BG : INK2; g.fillText(MONTHS[i], x + 22, y + 64);
      g.restore();
    }
    mlabel(g, 'THE BAY OF BENGAL’S MAIN CYCLONE SEASON', X0, 1130, clamp((t - T.season) / 0.3), { size: 26, c: ACC });
    eyebrow(g, 'NOAA · IMD CLIMATOLOGY', t, T.cut[3] + 0.1);
  }
  function shMonsoon(g, t) {                                    // 4 · summer: the winds aloft tear storms apart
    const T = times();
    shotCam(g, t, 4, { kicks: [[T.tear - 0.05, 8]], push: 0.04 });
    drawMap(g, V2);
    streaks(g, V2, t, 1);
    const torn = clamp((t - (T.tear - 0.05)) / Math.max(0.6, T.apart - T.tear + 0.5));
    drawCyc(g, ...pj(V2, 87.6, 14.0), 2.5 * V2.k, t * SPIN, 1, { torn, wind: Math.atan2(-WDIR[1], WDIR[0]) });
    eyebrow(g, 'JUNE–SEPTEMBER · MONSOON WINDS ALOFT', t, T.cut[4] + 0.05);
  }
  function shOctober(g, t) {                                    // 5 · October: calm winds over a warm sea; a storm spins up
    const T = times(), heat = clamp((t - (T.sea4 - 0.3)) / 0.8), kUp = clamp((t - (T.drop + 0.1)) / 1.6);
    shotCam(g, t, 5, {});
    drawMap(g, V2, { heat, t });
    const fade = 1 - clamp((t - T.cut[5]) / 0.6); if (fade > 0.01) streaks(g, V2, t, fade);
    drawCyc(g, ...pj(V2, 87.6, 13.4), (0.5 + 2.1 * eo(kUp)) * V2.k, t * SPIN, 0.25 + 0.75 * kUp);
    eyebrow(g, 'OCTOBER · WEAK WINDS ALOFT · SEA ABOVE 26°C', t, T.drop - 0.2);
  }
  function shSteered(g, t) {                                    // 6 · steered north-west, straight at this coast
    const T = times(), apc = clamp((t - (T.straight - 0.1)) / 0.4);
    shotCam(g, t, 6, { kicks: [[T.coast5 - 0.1, 9]] });
    drawMap(g, V3, { heat: 0.5, t, apc });
    GHOSTS.forEach((c, j) => dashed(g, c.map((ll) => pj(V3, ...ll)), clamp((t - (T.northwest - 0.1 + j * 0.15)) / 0.9), 'rgba(255,59,31,0.55)', 3, [7, 10]));
    const u = eio(clamp((t - (T.steered - 0.35)) / Math.max(1.2, T.coast5 - T.steered + 0.3)));
    dashed(g, OCT.map((ll) => pj(V3, ...ll)), u, 'rgba(236,232,225,0.7)', 4);
    drawCyc(g, ...pj(V3, ...along(OCT, u)), 2.4 * V3.k, t * SPIN, 1);
    const [, ly] = pj(V3, 80.3, 18.4); mlabel(g, 'ANDHRA PRADESH COAST', X0 + 12, ly, apc, { size: 28, bg: true, c: ACC });
    eyebrow(g, 'OCT–NOV STORM TRACKS (STYLISED) · IMD', t, T.cut[6] + 0.05);
  }
  function shPicto(g, t) {                                      // 7 · 1 in 20 of the world's cyclones; most of the deaths
    const T = times(), kD = clamp((t - (T.historically - 0.2)) / 0.5), kB = clamp((t - (T.most - 0.1)) / 0.6);
    shotCam(g, t, 7, { kicks: [[T.most - 0.1, 10]], push: 0.04 });
    ground(g); grid(g);
    for (let i = 0; i < 20; i++) {
      const c = i % 5, r = Math.floor(i / 5), x = 170 + c * 175, y = 450 + r * 165, bay = i === 12;
      const ki = hit(t, T.cut[7] + 0.1 + i * 0.03, 'playful'), red = bay && t >= T.one - 0.04, pop = red ? 1 + 0.25 * Math.exp(-(t - T.one) * 8) : 1;
      drawCyc(g, x, y, 68 * clamp(ki, 0, 1.2) * pop, t * SPIN * 1.5 + i, (red ? 1 : 0.6) * (1 - kD * (bay ? 0.1 : 0.72)), { img: red ? CYCR : CYC });   // all 20 appear on "The Bay of Bengal makes"; the Bay's turns red on "one"
    }
    if (kB > 0) {
      const bx = X0, by = 1080, bw = 860, bh = 54;
      g.fillStyle = 'rgba(141,148,156,0.2)'; g.fillRect(bx, by, bw, bh);
      g.fillStyle = ACC; g.fillRect(bx, by, bw * 0.72 * eo(kB), bh);
      mlabel(g, 'CYCLONE DEATHS (HISTORICALLY) · THE BAY: MOST', X0, by - 22, clamp(kB * 2), { size: 24, c: INK });
    }
    eyebrow(g, 'BAY OF BENGAL · ~5% OF THE WORLD’S TROPICAL CYCLONES', t, T.cut[7] + 0.1);
  }
  function shFunnel(g, t) {                                     // 8 · shallow, funnel-shaped
    const T = times(), kF = clamp((t - (T.funnel - 0.3)) / 0.35);
    shotCam(g, t, 8, { push: 0.05, oy: 760 });
    drawMap(g, V4, { heat: 0.25, t });
    for (const side of FUNNEL) {
      const pts = side.map((ll) => pj(V4, ...ll)), k = eo(clamp((t - (T.funnel - 0.3)) / 0.7));
      dashed(g, pts, k, `rgba(255,59,31,${(0.95 * kF).toFixed(3)})`, 10, []);
      const n = Math.max(1, Math.floor(k * (pts.length - 1))), [x1, y1] = pts[n], [x0, y0] = pts[n - 1];
      g.save(); g.globalAlpha *= kF; g.fillStyle = ACC; g.translate(x1, y1); g.rotate(Math.atan2(y1 - y0, x1 - x0)); g.beginPath(); g.moveTo(18, 0); g.lineTo(-20, -18); g.lineTo(-20, 18); g.closePath(); g.fill(); g.restore();
    }
    eyebrow(g, 'THE BAY NARROWS TO THE NORTH · A SHALLOW SHELF', t, T.cut[8] + 0.05);
  }
  // 9–10 · the surge, a side cut of the shelf (graphics in y 290–1180)
  function surgeCut(g, t, i, old) {
    const T = times();
    shotCam(g, t, i, { push: 0.04, oy: 760, kicks: old ? [[T.sixmetre - 0.48, 14]] : [] });
    let gr = g.createLinearGradient(0, 200, 0, 1200); gr.addColorStop(0, '#111a26'); gr.addColorStop(1, BG); g.fillStyle = gr; g.fillRect(-400, -400, W + 800, H + 800);
    const SEA = 920, SHORE = 600, LAND = 910;
    gr = g.createRadialGradient(240, 430, 30, 240, 430, 480); gr.addColorStop(0, 'rgba(70,78,92,0.95)'); gr.addColorStop(1, 'rgba(40,46,58,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(240, 450, 540, 260, 0, 0, TAU); g.fill();
    const kWind = clamp((t - (T.piles - 0.2)) / 0.4) * (1 - clamp((t - (T.killed + 0.6)) / 0.6));
    g.save(); g.strokeStyle = `rgba(236,232,225,${(0.6 * kWind).toFixed(3)})`; g.lineWidth = 6; g.lineCap = 'round';
    for (let k = 0; k < 4; k++) { const y = 640 + k * 55, x = ((t * 520 + k * 170) % 900) - 120; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 110, y); g.lineTo(x + 92, y - 13); g.moveTo(x + 110, y); g.lineTo(x + 92, y + 13); g.stroke(); }
    g.restore();
    const pile = clamp((t - (T.piles - 0.1)) / 1.2), wall = eio(clamp((t - (T.sixmetre - 0.75)) / 1.1)), flood = eio(clamp((t - (T.killed - 0.3)) / 1.6));
    const hPile = 60 * pile * (1 - wall) + 250 * wall, front = lerp(SHORE + 40, W + 60, flood);
    const surfY = (x) => { const near = Math.exp(-Math.pow((x - SHORE) / 330, 2)); const over = x > SHORE ? (x < front ? 1 : Math.exp(-Math.pow((x - front) / 60, 2))) : near; return SEA - hPile * (x <= SHORE ? 0.25 + 0.75 * near : over) + 6 * Math.sin(x * 0.03 + t * 4); };
    const village = () => { for (const [x, s] of [[700, 1], [820, 0.9], [940, 1.05]]) house(g, x, LAND, s); for (const [x, s] of [[660, 1], [770, 1.15], [880, 0.95], [1010, 1.1]]) palm(g, x, LAND, s, t); };
    g.fillStyle = '#24301f'; g.fillRect(SHORE, LAND, W - SHORE + 400, 34); village();
    const xEnd = Math.min(W + 20, front + 90);
    g.beginPath(); g.moveTo(-400, H); g.lineTo(-400, surfY(0)); for (let x = 0; x <= xEnd; x += 15) g.lineTo(x, surfY(x)); g.lineTo(xEnd, H); g.closePath();
    gr = g.createLinearGradient(0, SEA - 300, 0, 1300); gr.addColorStop(0, 'rgba(34,74,108,0.95)'); gr.addColorStop(1, 'rgba(12,30,48,0.98)'); g.fillStyle = gr; g.fill();
    g.fillStyle = '#2b2620'; g.beginPath(); g.moveTo(-400, H); g.lineTo(-400, 1180); g.lineTo(0, 1180); g.bezierCurveTo(200, 1150, 420, 1000, SHORE, 950); g.lineTo(W + 400, 950); g.lineTo(W + 400, H); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(236,232,225,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 1180); g.bezierCurveTo(200, 1150, 420, 1000, SHORE, 950); g.stroke();
    if (front + 40 < W) { g.save(); g.beginPath(); g.rect(front + 40, -400, W + 800, H + 800); g.clip(); g.fillStyle = '#24301f'; g.fillRect(SHORE, LAND, W - SHORE + 400, 34); g.fillStyle = '#2b2620'; g.fillRect(SHORE, LAND + 34, W + 400, H); village(); g.restore(); }
    mlabel(g, 'SHALLOW SHELF', 150, 1110, old ? 0 : clamp((t - T.cut[9]) / 0.3), { size: 26, c: INK2 });
    if (old > 0.005) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${(0.9 * old).toFixed(3)})`; g.fillRect(0, 0, W, H); g.restore(); }
    const kM = clamp((t - (T.sixmetre - 0.1)) / 0.4) * (1 - clamp((t - (T.killed + 0.4)) / 0.4));
    if (kM > 0.01) { g.save(); g.globalAlpha *= kM; g.strokeStyle = ACC; g.lineWidth = 5; g.beginPath(); g.moveTo(560, SEA); g.lineTo(560, SEA - 250); g.moveTo(544, SEA); g.lineTo(576, SEA); g.moveTo(544, SEA - 250); g.lineTo(576, SEA - 250); g.stroke();
      font(g, 50, 700, 'condensed'); g.textAlign = 'right'; g.fillStyle = ACC; g.fillText('6 M', 530, SEA - 110); g.restore(); }
    eyebrow(g, old ? '19 NOV 1977 · KRISHNA DELTA, ANDHRA PRADESH' : 'WIND PILES THE SEA AGAINST THE SHORE', t, T.cut[i] + 0.05);
  }
  function house(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#8d7a5c'; g.fillRect(-36, -70, 72, 70); g.fillStyle = '#5a4c38'; g.fillRect(-10, -40, 20, 40);
    g.fillStyle = '#6b3a2c'; g.beginPath(); g.moveTo(-46, -66); g.lineTo(0, -104); g.lineTo(46, -66); g.closePath(); g.fill(); g.restore();
  }
  function palm(g, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const sw = 0.12 * Math.sin(t * 3 + x);
    g.strokeStyle = '#4a3a2a'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(8, -70, 18 + sw * 30, -140); g.stroke();
    g.translate(18 + sw * 30, -140); g.rotate(sw); g.fillStyle = '#2f4a2c';
    for (let i = 0; i < 6; i++) { g.save(); g.rotate(-PI / 2 + (i - 2.5) * 0.55); g.beginPath(); g.ellipse(34, 0, 38, 9, 0.25, 0, TAU); g.fill(); g.restore(); }
    g.restore();
  }
  function shDots(g, t) {                                       // 11 · at least 10,000 people died: 10,000 dots lit as the voice says it
    const T = times(), n = Math.floor(10000 * eio(clamp((t - (T.ten - 0.1)) / 1.0)));
    shotCam(g, t, 11, { push: 0.025, drift: 3 });
    ground(g);
    const x0 = 140, y0 = 345, sp = 8;
    g.fillStyle = 'rgba(59,67,76,0.85)'; for (let i = n; i < 10000; i++) g.fillRect(x0 + (i % 100) * sp, y0 + Math.floor(i / 100) * sp, 4, 4);
    g.fillStyle = INK; for (let i = 0; i < n; i++) g.fillRect(x0 + (i % 100) * sp, y0 + Math.floor(i / 100) * sp, 4, 4);
    mlabel(g, 'OFFICIAL TOLL ~10,000 · OTHER ESTIMATES UP TO 50,000', X0, 318, clamp((t - T.cut[11]) / 0.3), { size: 22, c: INK2 });
  }
  // 12–13 · the coast, close (a schematic: north up, the sea to the south-east)
  const coastY = (x) => 420 + (1100 - x) * 0.66 + 14 * Math.sin(x * 0.021);
  const CV = [150, 330, 510, 690, 860].map((x) => [x - 0.45 * 46, coastY(x) - 0.89 * 46]);
  const CS = [[110, 900], [300, 760], [500, 640], [700, 500]];
  const HOUSES = (() => { const r = mulberry32(14), o = []; CV.forEach(([x, y]) => { for (let i = 0; i < 8; i++) o.push([x + (r() - 0.5) * 110, y + (r() - 0.5) * 50, r() * 0.6 - 0.3]); }); return o; })();
  const MOVERS = (() => {
    const r = mulberry32(8), o = [];
    for (let i = 0; i < 160; i++) {
      const v = CV[i % CV.length], s = CS.reduce((b, q) => (Math.hypot(q[0] - v[0], q[1] - v[1]) < Math.hypot(b[0] - v[0], b[1] - v[1]) ? q : b));
      o.push({ a: [v[0] + (r() - 0.5) * 110, v[1] + (r() - 0.5) * 46], b: [s[0] + (r() - 0.5) * 80, s[1] + 40 + (r() - 0.5) * 30], d: r(), bend: (r() - 0.5) * 70 });
    }
    return o;
  })();
  function shelterIcon(g, x, y, s, lit) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = lit ? ACC : 'rgba(236,232,225,0.6)'; g.lineWidth = 3.5; g.fillStyle = '#151a20';
    for (const px of [-24, -8, 8, 24]) { g.beginPath(); g.moveTo(px, 4); g.lineTo(px, 22); g.stroke(); }
    g.fillRect(-32, -24, 64, 28); g.strokeRect(-32, -24, 64, 28); g.beginPath(); g.moveTo(-36, -28); g.lineTo(36, -28); g.stroke();
    g.restore();
  }
  function coast(g, t, i) {
    const T = times();
    shotCam(g, t, i, { push: 0.04, oy: 700, kicks: i === 13 ? [[T.hit8 + 0.55, 12]] : [] });
    ground(g);
    g.fillStyle = '#0b1622'; g.beginPath(); g.moveTo(-400, coastY(-400)); for (let x = -400; x <= W + 400; x += 20) g.lineTo(x, coastY(x)); g.lineTo(W + 400, H + 400); g.lineTo(-400, H + 400); g.closePath(); g.fill();
    g.fillStyle = BG2; g.beginPath(); g.moveTo(-400, -400); g.lineTo(W + 400, -400); for (let x = W + 400; x >= -400; x -= 20) g.lineTo(x, coastY(x)); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(236,232,225,0.62)'; g.lineWidth = 2.5; g.beginPath(); for (let x = -400; x <= W + 400; x += 20) { if (x === -400) g.moveTo(x, coastY(x)); else g.lineTo(x, coastY(x)); } g.stroke();
    const sIn = 1 - clamp((t - (T.root + 0.3)) / 0.8);
    { const u = eio(clamp((t - T.cut[12]) / Math.max(1, T.hit8 - T.cut[12]))); drawCyc(g, lerp(1300, 700, u), lerp(1500, coastY(700), u), 520, t * SPIN, sIn * 0.85); }
    for (const [x, y, a] of HOUSES) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = 'rgba(141,148,156,0.9)'; g.fillRect(-8, -8, 16, 16); g.restore(); }
    const lit = i === 13 ? clamp((t - (T.but + 0.1)) / 0.3) : 0;
    for (const [x, y] of CS) shelterIcon(g, x, y, 1.25, lit > 0.5);
    g.fillStyle = INK;
    for (const m of MOVERS) {
      const t0 = T.but + m.d * Math.max(0.8, T.before - T.but - 0.5), u = i === 13 ? eio(clamp((t - t0) / 1.0)) : 0;
      g.beginPath(); g.arc(lerp(m.a[0], m.b[0], u) + Math.sin(PI * u) * m.bend, lerp(m.a[1], m.b[1], u) - Math.sin(PI * u) * m.bend * 0.3, 5.5, 0, TAU); g.fill();
    }
    mlabel(g, 'COASTAL VILLAGES', CV[3][0] + 30, CV[3][1] + 92, i === 12 ? clamp((t - (T.cut[12] + 0.4)) / 0.3) : 0, { size: 26, bg: true });
    mlabel(g, 'CYCLONE SHELTERS', CS[2][0] - 30, CS[2][1] - 70, i === 13 ? clamp((t - (T.but + 0.2)) / 0.3) : 0, { size: 26, bg: true, c: ACC });
    rain(g, t, 0.8 * (1 - clamp((t - (T.hit8 + 0.4)) / 0.6)));
    eyebrow(g, i === 12 ? '28 OCT 2026 · 125–135 KM/H, GUSTS 150 · IMD' : 'THIS TIME · NDRF / OFFICIAL FIGURES', t, T.cut[i] + 0.05);
  }
  function shChanged(g, t) {                                    // 14 · what changed: the same coast, 49 years apart
    const T = times(), kL = hit(t, T.root - 0.05, 'default'), kR = hit(t, T.difference - 0.1, 'default');
    shotCam(g, t, 14, { kicks: [[T.root - 0.05, 7], [T.difference - 0.1, 10]], push: 0.04 });
    ground(g); grid(g);
    const col = (x, k, year, num, sub, c) => {
      if (k <= 0.01) return;
      g.save(); g.globalAlpha *= clamp(k * 3); g.translate(0, 40 * (1 - clamp(k)));
      mlabel(g, year, x, 520, 1, { size: 40, c: INK2 });
      font(g, 110, 700, 'condensed'); g.textAlign = 'left'; g.fillStyle = c; g.fillText(num, x - 4, 700);
      mlabel(g, sub, x, 770, 1, { size: 26, c: INK });
      g.restore();
    };
    col(X0, kL, '1977', '10,000+', 'DIED', INK);
    col(580, kR, '2026', '50,000+', 'MOVED BEFORE LANDFALL', ACC);
    if (kR > 0.01) { g.fillStyle = `rgba(141,148,156,${(0.4 * clamp(kR)).toFixed(3)})`; g.fillRect(540, 470, 2, 340); }
    eyebrow(g, 'THE SAME COAST, 49 YEARS APART', t, T.cut[14] + 0.05);
  }
  function shList(g, t) {                                       // 15 · the list
    const T = times();
    const rows = [['WEAKER STORMS?', T.cut[15] + 0.02, 'NO', T.storms9e + 0.02, ACC], ['WARNINGS, DAYS AHEAD', T.warnings - 0.1, 'YES', T.ahead + 0.4, INK], ['CYCLONE SHELTERS', T.shelters - 0.1, 'YES', T.s9end + 0.05, INK]];
    shotCam(g, t, 15, { kicks: rows.map((r) => [r[3], 10]), push: 0.04 });
    ground(g); grid(g);
    rows.forEach(([text, t0, verdict, t1, c], i) => {
      const k = hit(t, t0, 'default'), y = 660 + i * 210; if (k <= 0.01) return;
      g.save(); g.globalAlpha *= clamp(k * 3); g.translate(0, 30 * (1 - clamp(k)));
      font(g, 72, 700, 'condensed'); g.textAlign = 'left'; g.fillStyle = INK; g.fillText(text, X0, y); const w = g.measureText(text).width;
      if (i === 0) { const ks = clamp((t - (T.weaker - 0.05)) / 0.35); if (ks > 0) { g.strokeStyle = ACC; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(X0 - 8, y - 25); g.lineTo(X0 - 8 + (w + 16) * ks, y - 25); g.stroke(); } }
      g.restore();
      stamp(g, 880, y - 24, clamp((t - t1) / 0.25), verdict, c, i === 0 ? -0.1 : -0.06);
    });
    eyebrow(g, 'WHAT CHANGED SINCE 1977', t, T.cut[15] + 0.05);
  }
  function shNext(g, t) {                                       // 16 · next October: the Bay warm again; back to frame 0
    const T = times(), u = eio(clamp((t - (T.end - 1.75)) / 1.6)), v = lerpV(V2, V1, u);
    shotCam(g, t, 16, { push: 0.0, drift: 4 });
    drawMap(g, v, { heat: clamp((t - (T.warm10 - 0.4)) / 0.7) * (1 - u), t });
    const g0 = clamp((t - T.cut[16]) / Math.max(1, T.end - 0.12 - T.cut[16]));
    drawCyc(g, ...pj(v, ...keyLL([[T.cut[16], 86.6, 13.6], [T.end - 0.12, 83.5, 15.35]], t)), lerp(1.2, 4.3, eio(g0)) * v.k, t * SPIN, clamp((t - T.cut[16]) / 0.6));
    eyebrow(g, 'BAY OF BENGAL · NEXT OCTOBER', t, T.cut[16] + 0.05);
  }
  const SHOTS = [shHook, shDate, shMontha, shSeason, shMonsoon, shOctober, shSteered, shPicto, shFunnel,
    (g, t) => surgeCut(g, t, 9, 0), (g, t) => surgeCut(g, t, 10, 1), shDots, (g, t) => coast(g, t, 12), (g, t) => coast(g, t, 13), shChanged, shList, shNext];

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) {
      S.g = canvas(root); under(root);
      const L = (text, y, size, o = {}) => line(root, text, { x: X0, y, size, ...o });
      S.L = {
        h0a: L('Cyclone Arnab', TZ - 16, 140), h0b: L('hit Andhra Pradesh.', TZ + 124, 100),
        h1a: L('A year earlier,', TZ - 16, 130), h1b: L('to the day,', TZ + 124, 130, { accent: [0, 1, 2] }),
        h2a: L('Cyclone Montha', TZ - 16, 130), h2b: L('hit the same coast.', TZ + 124, 100, { accent: [2, 3] }),
        h3a: L('Not a coincidence.', TZ - 16, 100), h3b: L("It's a season.", TZ + 104, 130, { accent: [2] }),
        h4a: L('All summer:', TZ - 16, 150), h4b: L('winds tear storms apart.', TZ + 134, 80, { accent: [3] }),
        h5a: L('October:', TZ - 16, 150), h5b: L('calm winds, warm sea.', TZ + 134, 90, { accent: [2, 3] }),
        h6a: L('Steered north-west.', TZ - 16, 100), h6b: L('Straight at this coast.', TZ + 104, 84, { accent: [2, 3] }),
        h7a: L('1 in 20', TZ - 30, 190, { accent: [0] }), h7b: L("of the world's cyclones.", TZ + 176, 80),
        h7c: L('Most of the deaths.', TZ - 16, 100, { accent: [0] }),
        h8a: L('Shallow.', TZ - 16, 150), h8b: L('Funnel-shaped.', TZ + 134, 130, { accent: [0] }),
        h9a: L('Storm surge.', TZ - 16, 150),
        h10a: L('1977.', TZ - 30, 190, { color: 'var(--ink-2)' }), h10b: L('A 6-metre surge.', TZ + 176, 110, { accent: [1] }),
        h11a: L('At least', TZ - 16, 150), h11b: L('10,000 people died.', TZ + 134, 100),
        h12a: L('Arnab:', TZ - 16, 150), h12b: L('a very severe cyclone.', TZ + 134, 88, { accent: [1, 2] }),
        h13a: L('This time,', TZ - 16, 150), h13b: L('50,000+ moved', TZ - 16, 140, { accent: [0] }), h13c: L('before it hit.', TZ + 134, 130),
        h14a: L('What changed?', TZ - 16, 140),
        h16a: L('Next October,', TZ - 16, 140), h16b: L('the Bay will be warm again.', TZ + 124, 72, { accent: [4, 5] }),
      };
      S.L.h13b.words[0].classList.add('tnum');
      S.m0 = mono(root, 'NEAR NARSAPUR · 28 OCT 2026 · 01:30 IST', X0, TZ + 262, 30);
      S.m2 = mono(root, 'SAME COAST · SAME DAY · ONE YEAR APART', X0, TZ + 262, 30, 'var(--accent)');
      S.m7 = mono(root, 'HISTORICALLY · MOSTLY THE STORM SURGE', X0, TZ + 134, 30);
    },
    run(t, b, S) {
      const T = times(), L = S.L, g = S.g, c = T.cut; clear(g);
      let i = 0; while (i < SHOTS.length - 1 && t >= c[i + 1]) i++;
      SHOTS[i](g, t);
      const out = (k) => c[k + 1] - 0.05;                         // each shot's type is gone by its cut
      const R = (Lx, tins, tout, lit, acc = []) => { rise(t, Lx, tins.map((x) => x - 0.06), tout); light(t, Lx, lit, acc); };
      // 0 · the hook: frame 0 already reads the name; the voice lights it
      rise(t, L.h0a, [-0.5, -0.45], out(0)); light(t, L.h0a, wv('s01', 0, 1));
      rise(t, L.h0b, [-0.42, -0.38, -0.34], out(0)); light(t, L.h0b, wv('s01', 2, 3, 4));
      enter(t, S.m0, T.narsapur - 0.1, out(0));
      R(L.h1a, wv('s02', 0, 1, 2), out(1), wv('s02', 0, 1, 2)); R(L.h1b, wv('s02', 3, 4, 5), out(1), wv('s02', 3, 4, 5), [0, 1, 2]);
      R(L.h2a, wv('s02', 6, 7), out(2), wv('s02', 6, 7)); R(L.h2b, wv('s02', 8, 9, 10, 11), out(2), wv('s02', 8, 9, 10, 11), [2, 3]);
      enter(t, S.m2, T.coast2 + 0.15, out(2));
      R(L.h3a, wv('s03', 1, 2, 3), out(3), wv('s03', 1, 2, 3)); R(L.h3b, wv('s03', 4, 5, 6), out(3), wv('s03', 4, 5, 6), [2]);
      R(L.h4a, wv('s04', 0, 1), out(4), wv('s04', 0, 1)); R(L.h4b, wv('s04', 3, 4, 5, 6), out(4), wv('s04', 3, 4, 5, 6), [3]);
      R(L.h5a, [T.october4], out(5), [T.october4]); R(L.h5b, [T.drop, T.drop + 0.12, T.sea4, T.warm4], out(5), [T.drop, T.drop + 0.12, T.sea4, T.warm4], [2, 3]);
      R(L.h6a, [T.steered, T.northwest], out(6), [T.steered, T.northwest]); R(L.h6b, wv('s05', 12, 13, 14, 15), out(6), wv('s05', 12, 13, 14, 15), [2, 3]);
      R(L.h7a, wv('s06', 5, 6, 7), T.historically - 0.25, wv('s06', 5, 6, 7), [0]); R(L.h7b, wv('s06', 8, 9, 10, 11), T.historically - 0.25, wv('s06', 8, 9, 10, 11));
      enter(t, S.m7, T.historically - 0.05, out(7));
      R(L.h7c, wv('s06', 14, 15, 16, 17), out(7), wv('s06', 14, 15, 16, 17), [0]);
      R(L.h8a, [T.shallow], out(8), [T.shallow]); R(L.h8b, [T.funnel], out(8), [T.funnel], [0]);
      R(L.h9a, [T.piles, T.surges], out(9), [T.piles, T.surges]);
      R(L.h10a, [T.nineteen], out(10), [T.nineteen]); R(L.h10b, wv('s07', 10, 11, 12), out(10), wv('s07', 10, 11, 12), [1]);
      R(L.h11a, wv('s07', 17, 18), out(11), wv('s07', 17, 18)); R(L.h11b, [T.ten, T.people7, T.people7 + 0.25], out(11), [T.ten, T.people7, T.people7 + 0.25]);
      R(L.h12a, [T.a.s08], out(12), [T.a.s08]); R(L.h12b, wv('s08', 2, 3, 4, 5), out(12), wv('s08', 2, 3, 4, 5), [1, 2]);
      R(L.h13a, wv('s08', 7, 8), T.fifty - 0.3, wv('s08', 7, 8));
      { const n = Math.round(lerp(0, 50000, eo(clamp((t - (T.fifty - 0.45)) / 0.8))) / 100) * 100;
        put(L.h13b.words[0], { text: n >= 50000 ? '50,000+' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }); }
      R(L.h13b, [T.fifty - 0.4, T.moved], out(13), [T.fifty, T.moved], [0]); R(L.h13c, wv('s08', 15, 16, 17), out(13), wv('s08', 15, 16, 17));
      R(L.h14a, [T.root, T.difference], out(14), [T.root, T.difference]);
      R(L.h16a, wv('s10', 0, 1), T.end - 0.05, wv('s10', 0, 1)); R(L.h16b, wv('s10', 2, 3, 4, 5, 6, 7), T.end - 0.05, wv('s10', 2, 3, 4, 5, 6, 7), [4, 5]);
    },
  });

  // ================================================================ finish: grain (seeded, per frame), as in AI171
  scene({
    name: 'fx', from: 'hook', to: 'end',
    build(root, S) {
      const cv = el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:0.09` }, root);
      S.g = cv.getContext('2d'); S.tiles = K.grainTiles();
    },
    run(t, b, S) {
      const f = Math.round(t * 30), r = mulberry32(1000 + f), g = S.g;
      clear(g);
      const pat = g.createPattern(S.tiles[f % 4], 'repeat'), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
      g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256);
    },
  });

  window.UI.endcard();
  C.start();
})();
