// Reel 51 · Three Times True: reel 41's r36.js (tag source/reel-41-seen-him-before, film/r36.js), copied whole and unchanged below this
// header, as the tests checklist names it (its figure: arms that bend at the elbow, hands with fingers, three-quarter heads, back views; a
// person placed by a camera). Reel 51 hands it its own camera (film/world.js) and draws the season's thief without stubble (film.js).
// Reel 41 · Seen Him Before: the drawing code it takes from reel 36 Find Him (tag source/reel-36-find-him, film/film.js), as the brief names it:
// head, capShape, chaiStall and thiefDraw, with the helpers they call (the faces' mouth, eyes and hair; the figure's torso and legs (the
// arms and hands are reel 41's own, redrawn on the user's note of 18 Nov); the stall's steam and bulbs; the person placed by a camera). Copied as they were, except where a line says 'reel 41'. Exported on window.R36.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit } = K;
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', YEL = '#ffd34a', CREAM = '#fff6e2';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const NA = C.noise1(3601), NB = C.noise1(3602), NC = C.noise1(3603);
  // ------------------------------------------------------------------ canvas helpers (reels 30–34's)
  const font = (size, kind = 'cond') => (kind === 'cond' ? `700 condensed ${size}px Bahn` : kind === 'semi' ? `700 semi-condensed ${size}px Bahn` : kind === 'mono' ? `700 ${size}px Mono` : `400 ${size}px Mono`);
  function txt(g, s, x, y, size, color = INK, o = {}) {
    g.save();
    g.font = font(size, o.kind || 'cond'); g.fillStyle = color; g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic';
    g.globalAlpha *= o.a ?? 1;
    if ('letterSpacing' in g) g.letterSpacing = (o.ls ?? 0) + 'px';
    if (o.fit) { const w = g.measureText(s).width; if (w > o.fit) { size *= o.fit / w; g.font = font(size, o.kind || 'cond'); } }
    if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
    if (o.stroke) { g.lineJoin = 'round'; g.strokeStyle = o.stroke; g.lineWidth = size * (o.sw ?? 0.12); g.strokeText(s, x, y); }
    g.fillText(s, x, y);
    g.restore();
  }
  const R = (g, x, y, w, h, r = 0) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
  const lg = (g, x0, y0, x1, y1, ...stops) => { const q = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const rg = (g, x, y, r0, r1, ...stops) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const offscreen = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const caps = (g, y0, y1, w0, w1) => { g.beginPath(); g.moveTo(-w0, y0); g.lineTo(-w1, y1); g.arc(0, y1, w1, Math.PI, 0, true); g.lineTo(w0, y0); g.arc(0, y0, w0, 0, Math.PI, true); g.closePath(); };
  const hexRGB = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const MIXC = new Map();
  const mix = (a, b, k) => {
    k = Math.round(clamp(k) * 40) / 40; const key = a + b + k; let v = MIXC.get(key);
    if (!v) { const A = hexRGB(a), B = hexRGB(b); v = '#' + A.map((x, i) => Math.round(lerp(x, B[i], k)).toString(16).padStart(2, '0')).join(''); MIXC.set(key, v); }
    return v;
  };
  function shakeAt(t, list) {                        // [time, amplitude]: a decaying jitter that glides between frames and eases in over one
    let a = 0; for (const [t0, amp] of list) if (t >= t0) a = Math.max(a, amp * Math.exp(-(t - t0) * 9) * sstep(t0, t0 + 0.035, t));
    if (a < 0.2) return [0, 0];
    const at = (n) => { const r = mulberry32(n * 7 + 3); return [(r() - 0.5) * 2, (r() - 0.5) * 2]; };
    const f = t * 30, n = Math.floor(f), u = sstep(0, 1, f - n), v0 = at(n), v1 = at(n + 1);
    return [lerp(v0[0], v1[0], u) * a, lerp(v0[1], v1[1], u) * a];
  }
  const flashAt = (t, t0, k = 11) => { const d = t - t0; return d < 0 ? 0 : Math.exp(-d * k) * 0.92; };
  const pop = (t, t0) => clamp(hit(t, t0, 'heavy'));
  function title(g, s, y, size, color, t, t0, o = {}) {            // a caption that lands with a small spring
    if (t < t0) return;
    const q = pop(t, t0);
    g.save(); g.translate(o.x ?? 513, y); g.scale(lerp(0.86, 1, q), lerp(0.86, 1, q));
    txt(g, s, 0, 0, size, color, { align: 'center', fit: o.fit ?? 860, stroke: o.stroke ?? INK, sw: o.sw ?? 0.14, a: clamp((t - t0) * 8) * (o.a ?? 1) });
    g.restore();
  }
  function ring(g, x, y, r, k, lw = 11, col = YEL) {
    if (k <= 0) return;
    g.save(); g.strokeStyle = INK; g.lineWidth = lw + 8; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke();
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke(); g.restore();
  }
  function tileNo(g, x, y, n, s = 72) { R(g, x - s / 2, y - s / 2, s, s, 10); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 5; g.stroke(); txt(g, String(n), x, y + s * 0.3, s * 0.82, '#fff9ea', { kind: 'mono', align: 'center' }); }
  const kick = (t, t0, a, f = 15, d = 7) => (t >= t0 ? a * Math.exp(-(t - t0) * d) * Math.sin((t - t0) * f) * sstep(t0, t0 + 0.035, t) : 0);
  const winK = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  function blinkAt(t, i, period = 3.4) { const u = ((t + 1.1 + i * 1.37) % period); return u < 0.06 ? sstep(0, 0.06, u) : u < 0.14 ? 1 - sstep(0.08, 0.14, u) : 0; }
  const key = (t, ks) => {                          // piecewise smooth through [time, ...values]
    if (t <= ks[0][0]) return ks[0].slice(1);
    for (let i = 0; i < ks.length - 1; i++) { const a = ks[i], b = ks[i + 1]; if (t <= b[0]) { const u = sstep(a[0], b[0], t); return a.slice(1).map((v, j) => lerp(v, b[j + 1], u)); } }
    return ks[ks.length - 1].slice(1);
  };
  const BUFS = []; const buf = (i) => BUFS[i] || (BUFS[i] = offscreen(W, H));
  function blurred(g, t, n, fn) {                   // motion blur, drawn in: the frame as the average of n moments across half a frame
    if (n <= 1) return fn(g, t);
    const acc = buf(1), a = acc.getContext('2d'), tmp = buf(2), b = tmp.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalAlpha = 1; a.filter = 'none'; a.clearRect(0, 0, W, H);
    let out;
    for (let i = 0; i < n; i++) {
      const ti = t - 1 / 120 + (i + 0.5) / n / 60;
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.filter = 'none'; b.clearRect(0, 0, W, H);
      out = fn(b, ti);
      a.globalAlpha = 1 / (i + 1); a.drawImage(tmp, 0, 0);
    }
    a.globalAlpha = 1; g.drawImage(acc, 0, 0);
    return out;
  }
  function vignette(g, k = 1) { g.fillStyle = rg(g, 540, 900, 560, 1250, [0, 'rgba(40,16,10,0)'], [1, `rgba(40,16,10,${0.36 * k})`]); g.fillRect(0, 0, W, H); }

  // ------------------------------------------------------------------ faces (the rig of reels 20–34): three-quarter turns, and now a cap
  function mouth(g, cy, op, o = {}) {
    const lip = o.lip || '#7d463b';
    if (op < 0.012) {
      const w = o.w0 ?? 44, sm = o.smile || 0, fr = o.frown || 0;
      g.lineCap = 'round'; g.strokeStyle = o.line || '#3c1d18'; g.lineWidth = o.lw0 ?? 6;
      g.beginPath(); g.moveTo(-w, cy - sm * 12 + fr * 6); g.quadraticCurveTo(0, cy + 3 + sm * 13 - fr * 8, w + sm * 6 * (o.smirk || 0), cy - sm * 12 * (1 + (o.smirk || 0)) + fr * 6); g.stroke();
      return;
    }
    const w = lerp(36, 92, sstep(0, 0.35, op)) - 13 * sstep(0.6, 1, op), top = 3 + 70 * Math.pow(op, 1.1), bot = 3 + 128 * Math.pow(op, 1.15);
    const shape = () => { g.beginPath(); g.moveTo(-w, cy); g.bezierCurveTo(-w * 0.74, cy - top * 1.33, w * 0.74, cy - top * 1.33, w, cy); g.bezierCurveTo(w * 0.88, cy + bot * 1.3, -w * 0.88, cy + bot * 1.3, -w, cy); g.closePath(); };
    g.save(); shape(); g.fillStyle = lg(g, 0, cy - top, 0, cy + bot, [0, '#7c1d27'], [0.45, '#4a0d16'], [1, '#2a060c']); g.fill(); shape(); g.clip();
    const tongueY = cy + bot * 0.82, trx = w * 0.72, try_ = bot * 0.38;
    ell(g, 0, tongueY, trx, try_); g.fillStyle = lg(g, 0, tongueY - try_, 0, tongueY + try_, [0, '#ea7b82'], [1, '#b13b4a']); g.fill();
    const tb1 = Math.min(1, op * 2.6), hT = 26 * tb1, cyT = cy - top;
    g.fillStyle = '#f7f2e4'; ell(g, 0, cyT, w * 0.8, hT); g.fill();
    g.restore();
    shape(); g.strokeStyle = lip; g.lineWidth = lerp(4.5, 11, sstep(0, 0.7, op)); g.lineJoin = 'round'; g.stroke();
  }
  function eye(g, side, cx, cy, close, o = {}) {
    const w = o.ew ?? 45, h = o.eh ?? 25, look = o.look || [0, 0], lid = o.lidC || '#231510';
    if (close < 0.92) {
      const up = h * 1.75 * (1 - close), dn = h * 1.05 * (1 - close * 0.72);
      const shape = () => { g.beginPath(); g.moveTo(cx - w, cy + 3); g.quadraticCurveTo(cx - side * 6, cy - up, cx + w, cy + 3); g.quadraticCurveTo(cx + side * 6, cy + dn, cx - w, cy + 3); g.closePath(); };
      g.save(); shape(); g.fillStyle = '#fbf7ee'; g.fill(); shape(); g.clip();
      const ix = cx + look[0], iy = cy - 3 + look[1], ir = o.ir ?? 18;
      ell(g, ix, iy, ir, ir); g.fillStyle = rg(g, ix, iy, 2, ir, [0, '#4f3421'], [1, '#26170d']); g.fill();
      ell(g, ix, iy, ir * 0.52, ir * 0.52); g.fillStyle = '#060404'; g.fill();
      ell(g, ix - 6, iy - 7, 4.6, 4.6); g.fillStyle = 'rgba(255,255,255,0.92)'; g.fill();
      g.fillStyle = 'rgba(40,20,10,0.16)'; g.fillRect(cx - w, cy - up - 3, w * 2, up * 0.62);
      g.restore();
      g.strokeStyle = lid; g.lineCap = 'round'; g.lineWidth = o.lidW ?? 6.5;
      g.beginPath(); g.moveTo(cx - w, cy + 3); g.quadraticCurveTo(cx - side * 6, cy - up, cx + w, cy + 3); g.stroke();
      g.strokeStyle = 'rgba(40,20,10,0.32)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(cx - w * 0.82, cy + 4); g.quadraticCurveTo(cx + side * 6, cy + dn, cx + w * 0.82, cy + 4); g.stroke();
    } else {
      g.strokeStyle = lid; g.lineWidth = (o.lidW ?? 6.5) + 1; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - w * 0.92, cy + 1); g.quadraticCurveTo(cx, cy + 13, cx + w * 0.92, cy + 1); g.stroke();
    }
  }
  // the maroon cap: the crown, the seam, the brim (bs: how far the brim has turned with his face; sq: crumpled, as it comes out of a pocket).
  // Its brim is always drawn: from behind or crumpled, a crown alone reads as a skullcap (the desk's note).
  function capShape(g, hh, bs = 0, bw = 1, sq = 0) {
    g.save();
    if (sq > 0) { g.translate(0, -120); g.scale(1 - 0.22 * sq, 1 - 0.52 * sq); g.translate(0, 120); }
    g.beginPath(); g.moveTo(-hh - 2, -122); g.bezierCurveTo(-hh - 8, -280, -90, -318, 0, -318); g.bezierCurveTo(90, -318, hh + 8, -280, hh + 2, -122); g.quadraticCurveTo(bs * 0.5, -158, -hh - 2, -122); g.closePath(); g.fillStyle = lg(g, -hh, -318, hh, -120, [0, '#a32b3d'], [1, '#5c1520']); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(bs * 0.6, -318); g.quadraticCurveTo(bs * 0.9 - 12, -220, bs, -150); g.stroke();
    g.fillStyle = 'rgba(255,200,170,0.22)'; ell(g, -hh * 0.45, -262, 50, 22, -0.3); g.fill();
    if (sq > 0.04) { g.strokeStyle = `rgba(40,6,12,${0.55 * sq})`; g.lineWidth = 6; g.lineCap = 'round'; for (const [x0, y0, x1, y1] of [[-120, -170, -40, -250], [10, -160, 80, -270], [-60, -288, 60, -226]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 20, (y0 + y1) / 2, x1, y1); g.stroke(); } }
    g.save(); g.translate(bs, 0); g.scale(bw, 1 - 0.3 * sq);
    g.beginPath(); g.moveTo(-hh + 6, -128); g.quadraticCurveTo(0, -170, hh - 6, -128); g.quadraticCurveTo(hh + 6, -108, hh - 40, -92); g.quadraticCurveTo(0, -116, -hh + 40, -92); g.quadraticCurveTo(-hh - 6, -108, -hh + 6, -128); g.closePath(); g.fillStyle = '#4a111b'; g.fill();
    g.restore();
    g.restore();
  }
  // a bare head's hair, by style. Under a cap it's pressed flat: above the cap's band the hair is squashed towards it (spring < 1), below it
  // (the sides, the sideburns) it stays as it is, so a cap lifting off lets the hair spring up and nothing below the band moves.
  function hairPaths(g, L, hh) {
    g.fillStyle = L.hair;
    const st = L.style;
    if (st === 'bald') {                              // the crown is his own skin; the hair is a horseshoe at the sides
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (hh + 1), -26); g.bezierCurveTo(k * (hh + 8), -100, k * (hh + 4), -168, k * (hh - 26), -200); g.bezierCurveTo(k * (hh - 40), -170, k * (hh - 30), -96, k * (hh - 24), -34); g.closePath(); g.fill(); }
    } else if (st === 'curls') {
      g.beginPath(); g.moveTo(-hh - 8, -36);
      g.bezierCurveTo(-hh - 26, -190, -130, -322, 0, -324); g.bezierCurveTo(130, -322, hh + 26, -190, hh + 8, -36);
      g.bezierCurveTo(hh - 12, -110, 130, -168, 0, -176); g.bezierCurveTo(-130, -168, -hh + 12, -110, -hh - 8, -36); g.closePath(); g.fill();
      for (let i = 0; i <= 14; i++) { const a = Math.PI + (i / 14) * Math.PI; ell(g, (hh + 4) * Math.cos(a), -150 + 172 * Math.sin(a), 38, 34); g.fill(); }
      for (let i = 0; i < 7; i++) { ell(g, -132 + i * 44, -180 + (i % 2) * 10, 30, 26); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 5; for (let i = 0; i < 9; i++) { const a = Math.PI * (1.1 + i * 0.09); g.beginPath(); g.arc((hh - 22) * Math.cos(a), -160 + 150 * Math.sin(a), 18, -2.6, -0.8); g.stroke(); }
    } else if (st === 'part') {
      g.beginPath(); g.moveTo(hh, -38); g.bezierCurveTo(hh + 10, -250, 80, -300, -16, -292); g.bezierCurveTo(-140, -292, -hh - 16, -220, -hh, -38); g.bezierCurveTo(-hh + 18, -112, -150, -164, -80, -190); g.bezierCurveTo(-20, -150, 70, -160, 110, -186); g.bezierCurveTo(150, -150, hh - 22, -110, hh, -38); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-60, -280); g.quadraticCurveTo(20, -300, 110, -250); g.stroke();
    } else if (st === 'quiff') {
      g.beginPath(); g.moveTo(-hh, -44); g.bezierCurveTo(-hh - 4, -230, -90, -292, 0, -292); g.bezierCurveTo(90, -292, hh + 4, -230, hh, -44); g.bezierCurveTo(hh - 14, -140, 96, -196, 0, -200); g.bezierCurveTo(-96, -196, -hh + 14, -140, -hh, -44); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-150, -196); g.bezierCurveTo(-176, -330, -60, -420, 70, -404); g.bezierCurveTo(160, -392, 196, -326, 160, -262); g.bezierCurveTo(130, -300, 60, -322, 0, -300); g.bezierCurveTo(-56, -282, -110, -246, -150, -196); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 7; g.beginPath(); g.moveTo(-110, -230); g.bezierCurveTo(-120, -330, -30, -388, 70, -380); g.stroke();
    } else if (st === 'spiky') {                     // short gelled spikes (a tall quiff read as a topknot at phone size)
      g.beginPath(); g.moveTo(-hh, -50);
      for (let i = 0; i <= 12; i++) { const u = i / 12, x = lerp(-hh, hh, u), yb = -186 - 92 * Math.sin(u * Math.PI); g.lineTo(x - 14, yb); g.lineTo(x + 2, yb - 46 - 10 * Math.sin(i * 1.7)); }
      g.lineTo(hh, -50); g.bezierCurveTo(hh - 18, -130, 120, -184, 0, -190); g.bezierCurveTo(-120, -184, -hh + 18, -130, -hh, -50); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-90, -250); g.lineTo(-40, -300); g.moveTo(20, -262); g.lineTo(60, -306); g.stroke();
    } else if (st === 'crew') {
      g.save(); g.globalAlpha *= 0.92;
      g.beginPath(); g.moveTo(-hh + 2, -52); g.bezierCurveTo(-hh - 2, -244, -84, -286, 0, -286); g.bezierCurveTo(84, -286, hh + 2, -244, hh - 2, -52); g.bezierCurveTo(hh - 20, -150, 100, -206, 0, -210); g.bezierCurveTo(-100, -206, -hh + 20, -150, -hh + 2, -52); g.closePath(); g.fill();
      g.restore();
    } else if (st === 'short') {
      g.beginPath(); g.moveTo(-hh, -44); g.bezierCurveTo(-hh - 6, -250, -80, -300, 0, -298); g.bezierCurveTo(80, -300, hh + 6, -250, hh, -44); g.bezierCurveTo(hh - 16, -150, 90, -210, 0, -214); g.bezierCurveTo(-90, -210, -hh + 16, -150, -hh, -44); g.closePath(); g.fill();
    } else if (st === 'pony' || st === 'twin' || st === 'knot') {      // pulled back smooth from a centre parting
      g.beginPath(); g.moveTo(-hh - 2, -40); g.bezierCurveTo(-hh - 8, -250, -80, -302, 0, -300); g.bezierCurveTo(80, -302, hh + 8, -250, hh + 2, -40); g.bezierCurveTo(hh - 14, -150, 96, -214, 0, -218); g.bezierCurveTo(-96, -214, -hh + 14, -150, -hh - 2, -40); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -296); g.lineTo(0, -224); g.stroke();
      if (st === 'knot') { ell(g, 0, -296, 84, 60); g.fill(); if (L.gajra) { g.fillStyle = '#fbf6ea'; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.02 + i / 8 * 0.96); ell(g, 90 * Math.cos(a), -292 + 56 * Math.sin(a), 15, 15); g.fill(); } g.fillStyle = L.hair; } }
      if (st === 'twin') for (const k of [-1, 1]) { g.fillStyle = L.hair; for (let i = 0; i < 7; i++) { ell(g, k * (hh + 6) + k * 4 * Math.sin(i * 1.3), -20 + i * 50, 31 - i * 1.5, 31); g.fill(); } g.fillStyle = L.ribbon || '#e2301a'; ell(g, k * (hh + 6) - 26, 336, 26, 17, 0.5); g.fill(); ell(g, k * (hh + 6) + 26, 336, 26, 17, -0.5); g.fill(); }
    } else if (st === 'long' || st === 'bun') {
      g.beginPath(); g.moveTo(-hh - 4, 40); g.bezierCurveTo(-hh - 14, -240, -80, -300, 0, -298); g.bezierCurveTo(80, -300, hh + 14, -240, hh + 4, 40); g.bezierCurveTo(hh - 30, -120, 60, -200, 6, -214); g.bezierCurveTo(-60, -200, -hh + 30, -120, -hh - 4, 40); g.closePath(); g.fill();
      if (st === 'bun') { ell(g, 0, -300, 86, 62); g.fill(); }
    }
  }
  function hatDent(g, L, hh) {                       // number two's hair, flattened by a cap he isn't wearing: a dent all the way round
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = 12; g.beginPath(); g.moveTo(-hh - 4, -150); g.quadraticCurveTo(0, -196, hh + 4, -150); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 7; g.beginPath(); g.moveTo(-hh + 10, -170); g.quadraticCurveTo(0, -214, hh - 10, -170); g.stroke();
    g.fillStyle = L.hair; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (hh - 4), -150); g.quadraticCurveTo(k * (hh + 26), -128, k * (hh + 14), -96); g.quadraticCurveTo(k * (hh + 2), -120, k * (hh - 12), -128); g.closePath(); g.fill(); }
    g.restore();
  }
  function bareHair(g, L, hh, spring) {
    if (L.hatHair && spring > 0.999) {
      g.save(); g.beginPath(); g.rect(-700, -150, 1400, 700); g.clip(); hairPaths(g, L, hh); g.restore();
      g.save(); g.beginPath(); g.rect(-700, -1000, 1400, 850); g.clip(); g.translate(0, -150); g.scale(1, 0.74); g.translate(0, 150); hairPaths(g, L, hh); g.restore();
      hatDent(g, L, hh); return;
    }
    if (spring > 0.999) return hairPaths(g, L, hh);
    g.save(); g.beginPath(); g.rect(-700, -126, 1400, 700); g.clip(); hairPaths(g, L, hh); g.restore();
    g.save(); g.beginPath(); g.rect(-700, -1000, 1400, 874); g.clip(); g.translate(0, -126); g.scale(1, spring); g.translate(0, 126); hairPaths(g, L, hh); g.restore();
  }
  function hairBehind(g, L, hh) {
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hh - 14, -60); g.bezierCurveTo(-hh - 30, 120, -hh - 10, 300, -hh + 40, 330); g.lineTo(hh - 40, 330); g.bezierCurveTo(hh + 10, 300, hh + 30, 120, hh + 14, -60); g.closePath(); g.fill();
  }
  // o.cap: 1 seated, 0 off (a number between lifts it straight up), or { lift, dx, rot, sq, a } for a cap in the air or in a hand (head units)
  function head(g, L, o = {}) {
    const op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw, drop = 104 * op, ck = L.chinK || 1, chin = 232 * ck + drop, ey = -28, ex = 80;
    const yw = clamp(o.yaw || 0, -1.15, 1.15), sy = Math.sin(yw), cw = Math.cos(yw), Rf = hw * 1.04, hh = hw + 6;
    const at = (x0) => { const th = Math.asin(clamp(x0 / Rf, -0.99, 0.99)), c = Math.cos(th + yw); return [Rf * Math.sin(th + yw), Math.max(0.05, c / Math.cos(th)), c]; };
    const jx = (y) => sy * Rf * 0.86 * clamp((y + 40) / (chin + 40));
    if (L.style === 'long') hairBehind(g, L, hh);
    if (L.style === 'pony') { g.save(); g.fillStyle = L.hair; g.translate(-sy * 80, 0); g.beginPath(); g.moveTo(hh * 0.4, -262); g.bezierCurveTo(hh + 96, -220, hh + 70, 40, hh + 16, 250); g.bezierCurveTo(hh - 16, 120, hh - 6, -110, hh * 0.2, -210); g.closePath(); g.fill(); g.restore(); }
    const ears = [];
    for (const k of [-1, 1]) { const th = k * Math.PI / 2 + yw, cz = Math.cos(th); if (cz < -0.25) continue; ears.push([k, hw * Math.sin(th), cz]); }
    const ek = L.earK || 1, ear = (k, x, cz) => { const w = 25 * ek * (0.55 + 0.45 * clamp(1 - Math.abs(cz) * 1.6)); ell(g, x + k * 1 * ek, -18, w, 42 * ek, k * 0.08); g.fillStyle = L.skin; g.fill(); ell(g, x + k * 3 * (w / 25), -16, w * 0.48, 24, k * 0.08); g.fillStyle = L.skinD; g.fill(); if (L.ear) { const ly = -18 + 42 * ek; g.fillStyle = L.ear; ell(g, x + k * 4, ly + 4, 9, 9); g.fill(); g.beginPath(); g.moveTo(x + k * 4 - 17, ly + 42); g.quadraticCurveTo(x + k * 4, ly - 2, x + k * 4 + 17, ly + 42); g.closePath(); g.fill(); } };
    for (const [k, x, cz] of ears) ear(k, x, cz);
    const path = () => {
      g.beginPath(); g.moveTo(-hw, -40);
      g.bezierCurveTo(-hw - 4, -216, -100, -266, 0, -266); g.bezierCurveTo(100, -266, hw + 4, -216, hw, -40);
      g.bezierCurveTo(hw + 4 + jx(58) * 0.4, 58, 152 - 16 * op + jx(150 * ck), 150 * ck + 44 * op, 88 - 6 * op + jx(205 * ck), 205 * ck + 82 * op);
      g.bezierCurveTo(60 + jx(chin), chin - 4, 28 + jx(chin), chin, jx(chin), chin); g.bezierCurveTo(-28 + jx(chin), chin, -60 + jx(chin), chin - 4, -88 + 6 * op + jx(205 * ck), 205 * ck + 82 * op);
      g.bezierCurveTo(-152 + 16 * op + jx(150 * ck), 150 * ck + 44 * op, -hw - 4 + jx(58) * 0.4, 58, -hw, -40); g.closePath();
    };
    path(); g.fillStyle = lg(g, -hw, -200, hw, 240, [0, L.skinH], [0.45, L.skin], [1, L.skinD]); g.fill();
    g.save(); path(); g.clip();
    g.fillStyle = rg(g, jx(60) * 0.6, -40, 150, 330, [0, 'rgba(90,45,25,0)'], [1, 'rgba(90,45,25,0.3)']); g.fillRect(-300, -300, 600, 700);
    if (Math.abs(sy) > 0.01) { const e = Math.sign(sy) * hw; g.fillStyle = lg(g, e, 0, e - Math.sign(sy) * hw * 1.1, 0, [0, `rgba(70,32,18,${0.34 * Math.abs(sy)})`], [1, 'rgba(70,32,18,0)']); g.fillRect(-300, -300, 600, 700); }
    if (L.stub) { g.fillStyle = lg(g, 0, 56, 0, 190, [0, 'rgba(30,22,18,0)'], [1, `rgba(30,22,18,${0.34 * L.stub})`]); g.fillRect(-300, 56, 600, 320); const r = mulberry32(5); g.fillStyle = `rgba(20,14,10,${0.34 * L.stub})`; for (let i = 0; i < 70; i++) { ell(g, (r() - 0.5) * 2 * hw * 0.9 + jx(180), 120 + r() * 120, 1.7, 1.7); g.fill(); } }
    if (L.beard) {
      const bx = at(0)[0] * 0.97, ly = 118 + drop * 0.2;
      g.fillStyle = L.beard.c; g.beginPath();
      if (L.beard.k === 'chin') { ell(g, bx + jx(chin) * 0.3, chin - 34, 74, 66); g.fill(); }
      else { g.moveTo(-hw - 40, -40); g.lineTo(-hw + 14, -40); g.bezierCurveTo(-hw + 26, 40, -130 + bx * 0.6, 70, bx - 70, 92); g.quadraticCurveTo(bx, 82, bx + 70, 92); g.bezierCurveTo(130 + bx * 0.6, 70, hw - 26, 40, hw - 14, -40); g.lineTo(hw + 40, -40); g.lineTo(hw + 40, 420); g.lineTo(-hw - 40, 420); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 5; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(bx - 110 + i * 44, 150 + (i % 2) * 20); g.lineTo(bx - 100 + i * 44, 200 + (i % 2) * 20); g.stroke(); } }
      g.fillStyle = L.skinD; ell(g, bx, ly + 6, 56, 22); g.fill();
    }
    if (o.rim !== 0) { g.strokeStyle = lg(g, -hw, -250, hw * 0.4, 80, [0, 'rgba(255,222,165,0.66)'], [1, 'rgba(255,222,165,0)']); g.lineWidth = 26; path(); g.stroke(); }
    g.restore();
    for (const [k, x, cz] of ears) { const a = sstep(0.3, 0.6, Math.abs(yw)); if (a > 0 && -k === Math.sign(sy)) { g.save(); g.globalAlpha *= a; ear(k, x, cz); g.restore(); } }
    // the mouth and the moustache turn with the face
    const my = 118 + drop * 0.2, [mx] = at(0);
    g.save(); g.translate(mx * 0.97, 0); g.scale(Math.max(0.3, cw), 1);
    mouth(g, my, op, { lip: '#83503f', w0: o.w0 ?? 44, frown: o.frown ?? 0, smile: o.smile ?? 0, smirk: o.smirk || 0 });
    if (L.must) {
      const big = L.must === 'thick', mid = L.must === 'mid', pen = L.must === 'pencil', th = big ? 24 : mid ? 18 : pen ? 7 : 13, w = big ? 64 : mid ? 58 : pen ? 58 : 52;
      g.fillStyle = L.mHair || L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
    }
    g.restore();
    // the nose: it stands out from the face, so it moves further than the eyes; its far wing hides behind it
    const ny = 44, nx = Rf * 1.1 * sy, nw = L.noseW || 1;
    g.save(); g.translate(nx, 0); g.scale((0.55 + 0.45 * cw) * nw, 1);
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round';
    for (const k of [-1, 1]) { if (k * sy > 0.42) continue; g.beginPath(); g.moveTo(k * 22, ny - 18); g.quadraticCurveTo(k * 31, ny, k * 25, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { if (k * sy > 0.55) continue; ell(g, k * 13, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5, ny - 8, 10, 15); g.fill();
    g.restore();
    if (Math.abs(sy) > 0.08) { const sg = Math.sign(sy); g.strokeStyle = `rgba(90,45,25,${0.34 * Math.min(1, Math.abs(sy) * 2)})`; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(nx - sg * 4 - sy * 26, ey + 12); g.quadraticCurveTo(nx + sg * 10, ny - 12, nx + sg * 30 * Math.abs(sy), ny + 14); g.stroke(); }
    if (L.mole) { const [x, , c] = at(L.mole[0]); if (c > 0.15) { const mr = L.moleR ?? 9.5; g.fillStyle = '#2a1710'; ell(g, x, L.mole[1], mr * (0.45 + 0.55 * c), mr * 0.95); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; ell(g, x - mr * 0.3, L.mole[1] - mr * 0.35, mr * 0.3, mr * 0.25); g.fill(); } }
    const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look };
    for (const k of [-1, 1]) { const [x, wf, c] = at(k * ex); if (c < 0.12) continue; g.save(); g.translate(x, 0); g.scale(wf, 1); eye(g, k, 0, ey, k > 0 ? Math.max(close, o.closeR || 0) : close, eo); g.restore(); }
    if (L.specs || L.shades) {
      const fr = [];
      for (const k of [-1, 1]) { const [x, wf, c] = at(k * ex); if (c < 0.12) continue; fr.push([x, wf]); g.save(); g.translate(x, ey + 2); g.scale(wf, 1);
        if (L.shades) { g.fillStyle = '#17171d'; R(g, -62, -36, 124, 72, 28); g.fill(); g.fillStyle = 'rgba(255,255,255,0.2)'; R(g, -46, -24, 42, 12, 6); g.fill(); }
        else { g.fillStyle = 'rgba(255,255,255,0.12)'; ell(g, 0, 0, 54, 50); g.fill(); g.strokeStyle = L.specs; g.lineWidth = 8; g.stroke(); }
        g.restore(); }
      if (fr.length === 2) { g.strokeStyle = L.shades ? '#17171d' : L.specs; g.lineWidth = 8; g.beginPath(); g.moveTo(fr[0][0] + (L.shades ? 62 : 54) * fr[0][1], ey - 4); g.quadraticCurveTo((fr[0][0] + fr[1][0]) / 2, ey - 18, fr[1][0] - (L.shades ? 62 : 54) * fr[1][1], ey - 4); g.stroke(); }
    }
    g.strokeStyle = L.mHair || L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt + (o.worry || 0);
    for (const k of [-1, 1]) {
      const [x, wf, c] = at(k * ex); if (c < 0.12) continue;
      const bu = k === 1 ? -(o.browUp || 0) : 0;
      g.save(); g.translate(x, 0); g.scale(wf, 1);
      g.beginPath(); g.moveTo(-k * 48, ey - 40 + tilt + by0 + bu); g.quadraticCurveTo(k * 6, ey - 60 + by0 + bu, k * 54, ey - 40 - tilt * 0.3 + by0 * 0.4 + bu); g.stroke();
      g.restore();
    }
    if (L.bindi) { const [x, , c] = at(0); if (c > 0.2) { g.fillStyle = '#c8102e'; ell(g, x, ey - 64, 11 * (0.4 + 0.6 * c), 11); g.fill(); } }
    // the hair, and the cap over it
    const cv = o.cap !== undefined ? o.cap : (L.capped ? 1 : 0);
    const cap = !cv ? null : typeof cv === 'number' ? { lift: (1 - clamp(cv)) * 320, a: clamp(cv * 4) } : cv;
    const lifted = cap ? (cap.lift || 0) : 1e9, press = cap ? clamp(1 - Math.abs(lifted) / 150) : 0;   // (a cap held below his head presses nothing)
    g.save(); g.translate(sy * hw * 0.14, 0);
    bareHair(g, L, hh, lerp(1, 0.6, press));
    if (L.style === 'bald' && press < 0.98) { g.fillStyle = `rgba(255,236,212,${0.2 * (1 - press)})`; ell(g, -54 + sy * 40, -208, 76, 30, -0.25); g.fill(); g.strokeStyle = `rgba(90,45,25,${0.14 * (1 - press)})`; g.lineWidth = 4; g.beginPath(); g.moveTo(-70, -236); g.quadraticCurveTo(0, -246, 70, -236); g.stroke(); }
    if (press > 0.01) { g.fillStyle = `rgba(40,10,6,${0.32 * press})`; g.beginPath(); g.moveTo(-hw + 8, -108); g.quadraticCurveTo(sy * 60, -60, hw - 8, -108); g.lineTo(hw - 8, -140); g.lineTo(-hw + 8, -140); g.closePath(); g.fill(); }
    if (L.beret) { g.save(); g.rotate(-0.12); g.fillStyle = lg(g, -hw, -300, hw, -150, [0, '#2c3a6a'], [1, '#18213f']); ell(g, 10, -230, hw * 1.08, 82); g.fill(); g.fillStyle = '#121a33'; R(g, -hw + 4, -190, hw * 2 - 8, 40, 18); g.fill(); g.fillStyle = '#d8b04a'; ell(g, -hw * 0.45, -205, 22, 26); g.fill(); g.restore(); }
    if (cap && (cap.a ?? 1) > 0.003) {
      g.save(); g.globalAlpha *= cap.a ?? 1;
      g.translate(cap.dx || 0, -lifted - 220); g.rotate(cap.rot || 0); g.translate(0, 220);
      if (cap.k) { g.translate(0, -200); g.scale(cap.k, cap.k); g.translate(0, 200); }
      capShape(g, hh, sy * hw * 0.42, 0.55 + 0.45 * cw, cap.sq || 0);
      g.restore();
    }
    if (L.phones) { const kx = 0.55 + 0.45 * cw; g.strokeStyle = '#2a2a33'; g.lineWidth = 24; g.beginPath(); g.ellipse(0, -60, (hh + 16) * kx, 272, 0, Math.PI, TAU); g.stroke(); for (const k of [-1, 1]) { g.fillStyle = L.phones; ell(g, k * (hh + 14) * kx, -40, 42, 76); g.fill(); g.fillStyle = 'rgba(0,0,0,0.22)'; ell(g, k * (hh + 22) * kx, -40, 20, 56); g.fill(); } }
    g.restore();
  }
  // the back of a head: hair (or the cap, its brim kept in view) over the skull, ears at the sides
  function headBack(g, L, o = {}) {
    const hw = 186 * L.jaw;
    for (const k of [-1, 1]) { ell(g, k * (hw + 1), -18, 25, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); }
    g.fillStyle = L.skinD; R(g, -78, 100, 156, 150, 30); g.fill();
    const capOn = (o.cap !== undefined ? o.cap : (L.capped ? 1 : 0)) > 0.5;
    if (capOn) {
      if (L.style === 'bald') {                      // the back of his skull, the band of hair round it, the cap over the top
        g.fillStyle = lg(g, -hw, -200, hw, 160, [0, L.skinH], [0.5, L.skin], [1, L.skinD]); ell(g, 0, -40, hw + 2, 196); g.fill();
        g.save(); g.globalAlpha *= 0.55; g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 2, -120); g.bezierCurveTo(-hw - 4, -10, -120, 70, 0, 74); g.bezierCurveTo(120, 70, hw + 4, -10, hw + 2, -120); g.closePath(); g.fill(); g.restore(); g.strokeStyle = 'rgba(255,222,165,0.4)'; g.lineWidth = 14; g.beginPath(); g.arc(-40, -10, hw * 0.9, Math.PI * 0.95, Math.PI * 1.35); g.stroke();
      } else { g.fillStyle = L.skinD; R(g, -70, 60, 140, 140, 30); g.fill(); g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 2, -100); g.bezierCurveTo(-hw - 6, 20, -100, 96, 0, 100); g.bezierCurveTo(100, 96, hw + 6, 20, hw + 2, -100); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,225,190,0.22)'; g.lineWidth = 12; g.beginPath(); g.arc(0, -150, hw * 0.92, Math.PI * 0.62, Math.PI * 0.86); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 5; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 40, -60); g.lineTo(i * 34, 70); g.stroke(); } }
      capShape(g, hw + 6, 0, 1); g.fillStyle = '#4a111b'; ell(g, hw * 0.72, -112, 52, 14, 0.35); g.fill(); return;
    }
    if (L.style === 'bald') {
      g.fillStyle = lg(g, -hw, -260, hw, 120, [0, L.skinH], [0.5, L.skin], [1, L.skinD]); ell(g, 0, -80, hw + 4, 190); g.fill();
      g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 6, -110); g.bezierCurveTo(-hw - 10, 40, -90, 150, 0, 154); g.bezierCurveTo(90, 150, hw + 10, 40, hw + 6, -110); g.bezierCurveTo(hw - 30, -40, 80, -10, 0, -8); g.bezierCurveTo(-80, -10, -hw + 30, -40, -hw - 6, -110); g.closePath(); g.fill();
      return;
    }
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 6, -30); g.bezierCurveTo(-hw - 14, -240, -90, -296, 0, -296); g.bezierCurveTo(90, -296, hw + 14, -240, hw + 6, -30); g.bezierCurveTo(hw - 4, 80, 90, 150, 0, 156); g.bezierCurveTo(-90, 150, -hw + 4, 80, -hw - 6, -30); g.closePath(); g.fill();
    if (L.style === 'long') { g.beginPath(); g.moveTo(-hw - 10, -40); g.bezierCurveTo(-hw - 24, 160, -hw + 10, 320, -40, 360); g.lineTo(40, 360); g.bezierCurveTo(hw - 10, 320, hw + 24, 160, hw + 10, -40); g.closePath(); g.fill(); }
    if (L.style === 'bun') { ell(g, 0, -190, 90, 70); g.fill(); }
    if (L.braid) { for (let i = 0; i < 7; i++) { ell(g, Math.sin(i * 0.9) * 5, 170 + i * 42, 30 - i * 2, 28); g.fill(); } }
    g.strokeStyle = lg(g, -hw, -250, hw * 0.3, 60, [0, 'rgba(255,222,165,0.55)'], [1, 'rgba(255,222,165,0)']); g.lineWidth = 18; g.beginPath(); g.arc(0, -60, hw * 0.98, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
  }
  // ------------------------------------------------------------------ bodies, in head units (the head's centre is the origin, the feet 1594 below)
  function glass(g, x, y, s, fill = 1) {             // the cutting chai glass, ribbed (reel 20's). Its centre is the origin.
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(245,240,230,0.34)'; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.lineTo(72, 130); g.lineTo(-72, 130); g.closePath(); g.fill();
    if (fill > 0) { g.save(); const top = lerp(124, -74, fill); g.beginPath(); g.moveTo(-90 + (top + 74) * 0.1, top); g.lineTo(90 - (top + 74) * 0.1, top); g.lineTo(70, 124); g.lineTo(-70, 124); g.closePath(); g.clip(); g.fillStyle = lg(g, -90, -74, 90, 124, [0, '#d08a3e'], [1, '#8d4f1c']); g.fillRect(-100, -80, 200, 210); g.fillStyle = 'rgba(255,235,200,0.28)'; g.fillRect(-90, top, 180, 14); g.restore(); }
    g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 4; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 27, -120); g.lineTo(i * 20, 128); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.stroke();
    g.restore();
  }
  // ------------------------------------------------------------------ reel 41: the arms and hands, redrawn (the user on motion test 1, 18 Nov:
  // "create natural hands"). Not reel 36's: an arm is one tapered limb (shoulder, bicep, elbow, forearm, wrist) under its sleeve, bent the way
  // an arm bends (the elbow down and out); a hand is a palm, four fingers and a thumb, each finger curled for its pose, and it turns at the
  // wrist (p.wa off the forearm, or p.abs, an angle of its own). A held thing (a glass, a phone, a card's edge) is drawn with its hand.
  // k: the side, -1 the screen's left. Layers: 'upper' (shoulder to elbow), 'lower' (forearm and hand), 'fingers' (over a held card).
  const HS = 1.2, KY = 70;
  const FING = [[-26, 56, 10.5], [-8.5, 62, 11.2], [9, 58, 10.6], [25, 46, 9.4]];   // index … pinky: the knuckle's x (the thumb's side < 0), length, half-width
  const POSE = {                                       // each finger's curl (0 straight … 1 folded), their spread, the thumb's angle (+: away from the hand) and length
    relax: { c: [0.3, 0.36, 0.44, 0.52], sp: 0.35, th: 0.36, tl: 0.92 },
    point: { c: [0, 1, 1, 1], sp: 0, th: -1.2, tl: 0.8, tuck: true },
    fist: { c: [1, 1, 1, 1], sp: 0, th: -1.3, tl: 0.85, tuck: true },
    open: { c: [0.04, 0.02, 0.05, 0.1], sp: 1.7, th: 1.0, tl: 1 },
    flat: { c: [0.1, 0.08, 0.1, 0.14], sp: 0.55, th: 0.6, tl: 1 },
    thumb: { c: [1, 1, 1, 1], sp: 0, th: 1.1, tl: 1.15 },   // reel 51: a fist, its thumb out to the side ("that way": the barber's)
  };
  POSE.grip = POSE.fist;
  const EDGE = 'rgba(100,48,26,0.32)';
  const lerpAng = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
  const shoulderX = (k, phi) => k * 268 * (0.6 + 0.4 * Math.cos(phi)) + 150 * Math.sin(phi) * 0.2;
  function hull(g, a, ra, b, rb) {                    // the outline round two circles: one piece of a limb
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    g.beginPath();
    if (d < 1e-3) { g.arc(a[0], a[1], Math.max(ra, rb), 0, TAU); return; }
    const an = Math.atan2(dy, dx), al = Math.acos(clamp((ra - rb) / d, -0.999, 0.999));
    g.arc(a[0], a[1], ra, an + al, an + TAU - al); g.arc(b[0], b[1], rb, an - al, an + al); g.closePath();
  }
  function across(g, A, B, w, cols) {                 // a fill shaded across a limb, lit from the left as the bodies are
    const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1; let nx = -dy / d, ny = dx / d;
    if (nx > 0 || (Math.abs(nx) < 1e-6 && ny > 0)) { nx = -nx; ny = -ny; }
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    return lg(g, mx + nx * w, my + ny * w, mx - nx * w, my - ny * w, [0, cols[0]], [0.42, cols[1]], [1, cols[2]]);
  }
  // a hand in its own frame: the wrist at the origin, the fingers along +y, the thumb's side at -x
  function handShape(g, P0, L, curl) {
    const c = curl || P0.c, sk = L.skin, skD = L.skinD, skH = L.skinH || L.skin;
    for (let i = 3; i >= 0; i--) {                   // the fingers, the little one first; the palm covers their roots
      const [fx, len, hw] = FING[i], ci = c[i], a = -(i - 1.5) * 0.075 * P0.sp;
      g.save(); g.translate(fx, KY - 10); g.rotate(a);
      if (ci > 0.82) { g.fillStyle = sk; R(g, -hw - 1.5, -2, 2 * hw + 3, 26, hw + 1); g.fill(); g.strokeStyle = EDGE; g.lineWidth = 3; g.stroke(); }
      else {
        const lv = len * (1 - 0.66 * ci) + 10;
        g.fillStyle = lg(g, -hw, 0, hw, 0, [0, skH], [0.5, sk], [1, skD]); R(g, -hw, -2, 2 * hw, lv, hw * 0.95); g.fill(); g.strokeStyle = EDGE; g.lineWidth = 3; g.stroke();
        if (ci > 0.12) { g.strokeStyle = 'rgba(100,48,26,0.2)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-hw * 0.55, lv * 0.56); g.lineTo(hw * 0.55, lv * 0.56); g.stroke(); }
      }
      g.restore();
    }
    g.fillStyle = lg(g, -42, 0, 42, 0, [0, skH], [0.45, sk], [1, skD]);
    g.beginPath(); g.moveTo(-27, -8); g.bezierCurveTo(-35, 16, -41, 40, -37, KY); g.quadraticCurveTo(0, KY + 9, 36, KY - 2); g.bezierCurveTo(40, 42, 35, 16, 27, -8); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,236,220,0.2)'; for (let i = 0; i < 4; i++) { ell(g, FING[i][0], KY - 7, 7.5, 4.5); g.fill(); }
    g.save(); g.translate(-30, P0.tuck ? 40 : 16); g.rotate(P0.th);    // the thumb: beside the palm, or tucked across a fist
    g.fillStyle = lg(g, -13, 0, 13, 0, [0, skH], [0.5, sk], [1, skD]); R(g, -12.5, -8, 25, 50 * P0.tl + 8, 12); g.fill(); g.strokeStyle = EDGE; g.lineWidth = 3; g.stroke();
    g.restore();
  }
  const hand = (g, kind, L) => handShape(g, POSE[kind] || POSE.relax, L);
  function gripFingers(g, L, x0, ys, lens, hw = 10.5) {   // fingers wrapped round the front of a thing, from its outer edge
    const sk = L.skin, skD = L.skinD, skH = L.skinH || L.skin;
    for (let i = ys.length - 1; i >= 0; i--) { g.fillStyle = lg(g, 0, ys[i] - hw, 0, ys[i] + hw, [0, skH], [0.55, sk], [1, skD]); R(g, x0, ys[i] - hw, lens[i], 2 * hw, hw); g.fill(); g.strokeStyle = EDGE; g.lineWidth = 3; g.stroke(); }
  }
  function palmBack(g, L, x, y, rx, ry, rot = 0) { g.fillStyle = lg(g, x - rx, y, x + rx, y, [0, L.skinH || L.skin], [0.5, L.skin], [1, L.skinD]); ell(g, x, y, rx, ry, rot); g.fill(); }
  // held things, drawn upright at the wrist (turned only by their own tilt), mirrored so +x points to his middle
  const HOLD = {
    glass(g, p, L, k, o, layer) {                     // a chai glass: the palm behind it, the thumb up its far side, the fingers round its front
      if (layer !== 'lower') return;
      const m = -k, z = (o.glassK || 0.5) / 0.5;
      g.rotate(m * (o.glassTilt || 0)); g.scale(m * z, z);
      palmBack(g, L, 4, -40, 30, 44, -0.12);
      g.fillStyle = L.skin; R(g, -16, -128, 23, 66, 11.5); g.fill(); g.strokeStyle = EDGE; g.lineWidth = 3; g.stroke();
      glass(g, 44, -58, 0.5, o.glassFill ?? 1);
      gripFingers(g, L, -8, [-98, -77, -56, -36], [66, 72, 66, 54]);
    },
    phone(g, p, L, k, o, layer) {                     // a phone, its back to us, the fingers round it
      if (layer !== 'lower') return;
      const m = -k; g.rotate(m * 0.1); g.scale(m, 1);
      palmBack(g, L, 4, -34, 30, 42, -0.1);
      g.save(); g.translate(40, -62); g.rotate(-0.06);
      g.fillStyle = '#2b2f36'; R(g, -30, -58, 60, 116, 11); g.fill(); g.fillStyle = 'rgba(255,255,255,0.13)'; R(g, -26, -54, 52, 9, 4); g.fill(); g.fillStyle = '#15171b'; ell(g, -14, -40, 6, 6); g.fill();
      g.restore();
      gripFingers(g, L, -8, [-70, -50, -30], [56, 60, 50]);
    },
    card(g, p, L, k, o, layer) {                      // the edge of a card (a number, a newspaper): the back of the hand outside it, the fingers over its face
      const m = -k; g.rotate(m * (p.tilt || 0)); g.scale(m, 1);
      if (layer === 'lower') palmBack(g, L, 2, -4, 30, 38, 0.1);
      else if (layer === 'fingers') gripFingers(g, L, 16, [-30, -10, 10, 28], [36, 40, 38, 30], 10);
    },
  };
  // where an arm's joints are, in the body's frame
  function armParts(o, k, p, phi) {
    const S = [shoulderX(k, phi), 340], L1 = 262 * p.len[0], L2 = 236 * p.len[1];
    const t1 = -k * p.a1, t2 = t1 + k * p.a2, u1 = [-Math.sin(t1), Math.cos(t1)], u2 = [-Math.sin(t2), Math.cos(t2)];
    const E = [S[0] + L1 * u1[0], S[1] + L1 * u1[1]], Wr = [E[0] + L2 * u2[0], E[1] + L2 * u2[1]];
    const hang = p.abs !== undefined ? lerpAng(t2 + (p.wa || 0), p.abs, p.absW ?? 1) : t2 + (p.wa || 0);
    return { S, E, Wr, t1, t2, u1, u2, L1, L2, hang };
  }
  // the pose of one arm: p.a1 swings the upper arm out from straight down, p.a2 bends the forearm in at the elbow; o.arms overrides the
  // walk's swing, by weight w. p.hand: what the hand does; p.over: drawn over the face (a glass at the lips); p.front: a far arm whose
  // forearm comes round in front of the body; p.carry(g, angle): a thing hanging from the fist (a kettle, a bat, the cash box).
  function armPose(o, k) {
    const wk = o.walk ?? 0, ph = o.phase ?? 0, side = k > 0 ? 'r' : 'l', run = o.run || 0, sw = Math.sin(ph + (k > 0 ? 0 : Math.PI));
    const ov = o.arms && o.arms[side], ps = wk * 0.42 * sw * ((o.swingK && o.swingK[k > 0 ? 1 : 0]) ?? 1);
    const base = { a1: 0.08 + 0.05 * Math.abs(ps) + 0.12 * run, a2: 0.18 + 0.42 * Math.max(0, ps) + run * (1.15 + 0.35 * sw),
      hand: (o.hands && o.hands[side]) || (run > 0.5 ? 'fist' : 'relax'), len: [1 - 0.06 * Math.max(0, ps), 1 - 0.2 * Math.max(0, ps)], wa: k * 0.1,
      carry: o.carry && o.carry[side] };
    if (!ov) return base;
    const w = ov.w ?? 1;
    return { ...ov, a1: lerp(base.a1, ov.a1, w), a2: lerp(base.a2, ov.a2, w), hand: w > 0.5 ? ov.hand || base.hand : base.hand,
      len: base.len.map((v, i) => lerp(v, (ov.len || [1, 1])[i], w)), wa: lerp(base.wa, ov.wa ?? 0, w), absW: ov.abs !== undefined ? w : undefined,
      carry: w > 0.5 ? ov.carry : base.carry };
  }
  // where his wrist is (body frame), the forearm's angle and the hand's
  function wristOf(o, k) {
    const phi = clamp(o.yaw || 0, -0.95, 0.95), A = armParts(o, k, armPose(o, k), phi);
    return { x: A.Wr[0], y: A.Wr[1], ang: A.t2, hang: A.hang };
  }
  // ... and the same point in his head's own frame
  function wristInHead(o, k) {
    const w = wristOf(o, k), phi = clamp(o.yaw || 0, -0.95, 0.95), sp = Math.sin(phi), wk = o.walk ?? 0, ph = o.phase ?? 0;
    const hx = 150 * sp * 0.42 + (o.headX || 0), hy = o.headBob ?? -wk * 4 * Math.cos(2 * ph - 0.5), tl = o.tilt || 0;
    const dx = w.x - hx, dy = w.y - hy, c = Math.cos(-tl), s = Math.sin(-tl);
    return { x: dx * c - dy * s, y: dx * s + dy * c, ang: w.ang - tl };
  }
  // the arm angles that put the wrist (or a point `reach` past it) on a target in his head's frame. Of the two elbows it takes the one
  // nearer the pole: out and down by default, as a body bends ('out': out to the side, for a hand above the head; 'down'; 'in'; or [x, y]).
  // The arm never locks straight.
  function armIK(o, k, tx, ty, reach = 0, prefer) {
    const phi = clamp(o.yaw || 0, -0.95, 0.95), sp = Math.sin(phi), wk = o.walk ?? 0, ph = o.phase ?? 0;
    const hx = 150 * sp * 0.42 + (o.headX || 0), hy = o.headBob ?? -wk * 4 * Math.cos(2 * ph - 0.5);
    const Tx = tx + hx - shoulderX(k, phi), Ty = ty + hy - 340;
    const L1 = 262, L2 = 236 + reach, d = clamp(Math.hypot(Tx, Ty), Math.abs(L1 - L2) + 1, (L1 + L2) * 0.985);
    const aD = Math.atan2(-Tx, Ty);
    const b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), gam = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    const pole = Array.isArray(prefer) ? prefer : prefer === 'out' ? [k, 0.2] : prefer === 'down' ? [k * 0.3, 1] : prefer === 'in' ? [-k * 0.6, 1] : [k * 0.7, 0.75];
    let best = null;
    for (const sg of [1, -1]) { const t1 = aD + sg * b, sc = -L1 * Math.sin(t1) * pole[0] + L1 * Math.cos(t1) * pole[1]; if (!best || sc > best.sc) best = { sc, t1, t2: t1 - sg * (Math.PI - gam) }; }
    return { a1: -best.t1 / k, a2: (best.t2 - best.t1) / k };
  }
  function arm(g, P, k, p, phi, o, layer) {
    const D = P.D, L = P.L, long = D.sleeve === 'long', bare = D.sleeve === 'none';
    const A = armParts(o, k, p, phi), { S, E, Wr, u1, u2, L1, L2 } = A;
    const at = (Q, u, d) => [Q[0] + u[0] * d, Q[1] + u[1] * d];
    const skinC = [L.skinH || L.skin, L.skin, L.skinD], clothC = [mix(D.a, '#ffffff', 0.08), D.a, D.b], x = long ? 6 : 0;
    if (layer === 'upper') {
      const U = at(S, u1, L1 * 0.45);
      g.fillStyle = across(g, S, E, 54 + x, long ? clothC : skinC);
      hull(g, S, 50 + x, U, 46 + x); g.fill(); hull(g, U, 46 + x, E, 38 + x); g.fill();
      if (!long && !bare) {                           // a short sleeve: over the shoulder and half way down, its hem square
        const SL = at(S, u1, L1 * 0.52), n = [-u1[1], u1[0]], rs = 60, rl = 56, a0 = Math.atan2(n[1], n[0]);
        g.fillStyle = across(g, S, SL, 62, clothC);
        g.beginPath(); g.moveTo(S[0] + n[0] * rs, S[1] + n[1] * rs); g.lineTo(SL[0] + n[0] * rl, SL[1] + n[1] * rl); g.lineTo(SL[0] - n[0] * rl, SL[1] - n[1] * rl); g.lineTo(S[0] - n[0] * rs, S[1] - n[1] * rs);
        g.arc(S[0], S[1], rs, a0 + Math.PI, a0, true); g.closePath(); g.fill();
        const H1 = at(SL, u1, -7); g.strokeStyle = 'rgba(0,0,0,0.13)'; g.lineWidth = 7; g.beginPath(); g.moveTo(H1[0] + n[0] * rl, H1[1] + n[1] * rl); g.lineTo(H1[0] - n[0] * rl, H1[1] - n[1] * rl); g.stroke();
      }
      return;
    }
    if (layer === 'lower') {
      const F = at(E, u2, L2 * 0.32);
      g.fillStyle = across(g, E, Wr, 48 + x, long ? clothC : skinC);
      hull(g, E, 38 + x, F, 43 + x); g.fill(); hull(g, F, 43 + x, Wr, 29 + x); g.fill();
      if (long) { const C0 = at(Wr, u2, -34), cf = D.cuff || D.a; g.fillStyle = across(g, C0, Wr, 40, [mix(cf, '#ffffff', 0.06), cf, mix(cf, '#000000', 0.2)]); hull(g, C0, 37, Wr, 36); g.fill(); }
      else if (p.a2 > 0.9) { const n = [-u2[1], u2[0]], q = at(E, u2, 30); g.strokeStyle = 'rgba(100,48,26,0.18)'; g.lineWidth = 4; g.beginPath(); g.moveTo(q[0] + n[0] * 14, q[1] + n[1] * 14); g.lineTo(q[0] - n[0] * 14, q[1] - n[1] * 14); g.stroke(); }
    }
    const kind = p.hand || 'relax'; if (kind === 'hidden') return;
    g.save(); g.translate(Wr[0], Wr[1]);
    if (HOLD[kind]) HOLD[kind](g, p, L, k, o, layer);
    else if (layer === 'lower') {
      if (p.carry) { g.save(); p.carry(g, A.hang); g.restore(); }
      g.rotate(A.hang);
      let m = k; if (kind === 'point' || p.thumbUp) { const sn = Math.sin(A.hang); if (Math.abs(sn) > 0.15) m = sn > 0 ? 1 : -1; }
      if (p.flip) m = -m;
      g.scale(m * HS, HS); handShape(g, POSE[kind] || POSE.relax, L, p.curl);
    }
    g.restore();
  }
  function torso(g, P, phi, back) {
    const D = P.D, by = 168, sp = Math.sin(phi), cp = Math.cos(phi);
    g.save(); if (D.wide) g.scale(D.wide, 1);
    const ks = Math.sqrt((cp) ** 2 + (0.52 * sp) ** 2), cx = 150 * sp, hem = by + (D.skirt ? 1390 : D.kameez ? 1180 : 900);
    const shape = () => { g.beginPath(); g.moveTo(-262 * ks, hem); g.lineTo(-292 * ks, by + 250); g.bezierCurveTo(-300 * ks, by + 170, -210 * ks, by + 124, -96 * ks + cx * 0.3, by + 92); g.lineTo(96 * ks + cx * 0.3, by + 92); g.bezierCurveTo(210 * ks, by + 124, 300 * ks, by + 170, 292 * ks, by + 250); g.lineTo(262 * ks, hem); g.closePath(); };
    shape(); g.fillStyle = lg(g, -300, by, 300, by + 800, [0, D.a], [1, D.b]); g.fill();
    if (D.sweater || D.vest || D.skirt) {
      g.save(); shape(); g.clip();
      if (D.sweater) { g.fillStyle = lg(g, -300, by, 300, by + 800, [0, D.sweater], [1, mix(D.sweater, '#000000', 0.22)]); g.beginPath(); g.moveTo(-400, by + 40); if (back) g.lineTo(400, by + 40); else { g.lineTo(-104 * ks + cx * 0.3, by + 40); g.lineTo(cx * 0.3, by + 400); g.lineTo(104 * ks + cx * 0.3, by + 40); g.lineTo(400, by + 40); } g.lineTo(400, by + 790); g.lineTo(-400, by + 790); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(-400, by + 740, 800, 50); }
      if (D.vest && !back) { g.fillStyle = P.L.skin; g.beginPath(); g.moveTo(-150 * ks + cx * 0.3, by + 40); g.quadraticCurveTo(cx * 0.3, by + 400, 150 * ks + cx * 0.3, by + 40); g.closePath(); g.fill(); for (const k of [-1, 1]) { ell(g, k * 300 * ks + cx * 0.2, by + 170, 92, 150); g.fill(); } }
      if (D.skirt) { g.fillStyle = D.border || D.b; g.fillRect(-400, hem - 70, 800, 40); }
      g.restore();
    }
    g.save(); shape(); g.clip();
    if (Math.abs(sp) > 0.02) { const e = -Math.sign(sp) * 300 * ks; g.fillStyle = lg(g, e, 0, e + Math.sign(sp) * 240, 0, [0, `rgba(30,18,30,${0.3 * Math.abs(sp)})`], [1, 'rgba(30,18,30,0)']); g.fillRect(-400, 0, 800, 1500); }
    g.fillStyle = 'rgba(30,18,30,0.12)'; g.fillRect(-400, by + 620, 800, 30);
    g.fillStyle = lg(g, 0, by + 80, 0, by + 360, [0, 'rgba(30,18,30,0)'], [1, 'rgba(30,18,30,0.08)']); g.fillRect(-400, by + 80, 800, 280);
    g.strokeStyle = lg(g, -300, by + 100, 120, by + 420, [0, 'rgba(255,222,165,0.6)'], [1, 'rgba(255,222,165,0)']); g.lineWidth = 30; shape(); g.stroke();
    g.restore();
    g.save(); g.translate(cx, 0); g.scale(0.22 + 0.78 * cp, 1);
    if (back) { g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-250, by + 230); g.quadraticCurveTo(0, by + 280, 250, by + 230); g.stroke(); if (D.collar) { g.fillStyle = D.collar; R(g, -100, by + 70, 200, 50, 20); g.fill(); } }
    else {
      if (D.collar) { g.fillStyle = D.collar; g.beginPath(); g.moveTo(-98, by + 88); g.lineTo(-20, by + 200); g.lineTo(-64, by + 214); g.lineTo(-134, by + 110); g.closePath(); g.moveTo(98, by + 88); g.lineTo(20, by + 200); g.lineTo(64, by + 214); g.lineTo(134, by + 110); g.closePath(); g.fill(); g.fillStyle = D.buttons || 'rgba(0,0,0,0.3)'; for (let i = 0; i < 6; i++) { ell(g, 0, by + 250 + i * 104, 7, 7); g.fill(); } }
      else { g.fillStyle = D.b; g.beginPath(); g.moveTo(-96, by + 92); g.quadraticCurveTo(0, by + 190, 96, by + 92); g.lineTo(80, by + 92); g.quadraticCurveTo(0, by + 160, -80, by + 92); g.closePath(); g.fill(); }
      if (D.pallu) { g.fillStyle = D.pallu; g.beginPath(); g.moveTo(-300, by + 150); g.lineTo(-150, by + 90); g.lineTo(300, by + 740); g.lineTo(300, by + 960); g.closePath(); g.fill(); g.strokeStyle = D.border || '#f0c23c'; g.lineWidth = 22; g.beginPath(); g.moveTo(-150, by + 100); g.lineTo(300, by + 750); g.stroke(); }
      if (D.gamchha) { g.save(); g.beginPath(); g.moveTo(-304, by + 150); g.lineTo(-170, by + 92); g.lineTo(-118, by + 560); g.lineTo(-252, by + 584); g.closePath(); g.fillStyle = '#d9402f'; g.fill(); g.clip(); g.strokeStyle = 'rgba(255,240,220,0.85)'; g.lineWidth = 10; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-330, by + 110 + i * 64); g.lineTo(-90, by + 130 + i * 64); g.stroke(); } for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-292 + i * 52, by + 60); g.lineTo(-246 + i * 52, by + 620); g.stroke(); } g.restore(); }
      if (D.chain) { g.strokeStyle = '#e8c45a'; g.lineWidth = 9; g.beginPath(); g.moveTo(-90, by + 98); g.quadraticCurveTo(0, by + 300, 90, by + 98); g.stroke(); g.fillStyle = '#f2d27a'; ell(g, 0, by + 200, 16, 20); g.fill(); }
      if (D.placket) { g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, by + 110); g.lineTo(0, by + 430); g.stroke(); g.fillStyle = D.placket; for (let i = 0; i < 3; i++) { ell(g, 0, by + 170 + i * 90, 9, 9); g.fill(); } }
      if (D.dupatta) { g.fillStyle = D.dupatta; g.beginPath(); g.moveTo(-300, by + 170); g.quadraticCurveTo(-120, by + 330, 0, by + 300); g.quadraticCurveTo(140, by + 270, 300, by + 150); g.lineTo(300, by + 240); g.quadraticCurveTo(140, by + 380, 0, by + 400); g.quadraticCurveTo(-130, by + 420, -300, by + 270); g.closePath(); g.fill(); }
    }
    g.restore();
    g.restore();
  }
  function neck(g, P, phi, back) {
    const L = P.L, by = 168, sp = Math.sin(phi), nx = 150 * sp * 0.45;
    g.fillStyle = lg(g, -80 + nx, 0, 80 + nx, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-70 + nx, 120); g.lineTo(-76 + nx, by + 100); g.quadraticCurveTo(nx, by + (back ? 120 : 180), 76 + nx, by + 100); g.lineTo(70 + nx, 120); g.closePath(); g.fill();
  }
  function legs(g, D, ph, wk, bob, back) {
    const order = Math.sin(ph) * (back ? -1 : 1) > 0 ? [1, -1] : [-1, 1];
    for (const k of order) {
      const lp = ph + (k > 0 ? Math.PI : 0), fwd = Math.sin(lp) * wk, lift = Math.max(0, Math.cos(lp)) * wk;
      const hx = k * 96, hy = 968 + bob, fx = k * (100 + 10 * fwd), fy = 1560 + 30 * fwd * (back ? -1 : 1) - 52 * lift;
      g.fillStyle = D.leg || '#3a3f4b';
      g.beginPath(); g.moveTo(hx - 70, hy - 60); g.lineTo(hx + 70, hy - 60); g.lineTo(fx + 50, fy - 30); g.lineTo(fx - 50, fy - 30); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.14)'; g.beginPath(); g.moveTo(hx + k * 70, hy - 60); g.lineTo(fx + k * 50, fy - 30); g.lineTo(fx + k * 22, fy - 30); g.lineTo(hx + k * 30, hy - 60); g.closePath(); g.fill();
      g.fillStyle = D.shoe || '#211a16'; R(g, fx - 72, fy - 44, 144, 70, 30); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.12)'; R(g, fx - 60, fy - 40, 120, 12, 6); g.fill();
    }
  }
  // a person, head at (x, y), scale s (the head is about 400 s wide). o.yaw turns the body, o.back shows his back, o.cap is passed to head().
  // reel 41: the arms draw in layers (the far one's upper arm behind the body, its forearm in front if it comes round), a hand at the lips
  // over the face, then o.held(g, joints) (a thing held in both hands) and the fingers that hold it.
  function figure(g, P, x, y, s, o = {}) {
    const D = P.D, L = P.L, ph = o.phase ?? 0, wk = o.walk ?? 0;
    const bob = -wk * 18 * Math.cos(2 * ph) + (o.breath || 0), sway = wk * 8 * Math.sin(ph);
    const phi = clamp(o.yaw || 0, -0.95, 0.95), sp = Math.sin(phi), back = !!o.back;
    g.save(); g.translate(x, y); g.scale(s, s); if (o.roll) g.rotate(o.roll);
    if (o.legs) legs(g, D, ph, wk, bob, back);
    g.save(); g.translate(sway, bob);
    if (o.lean) { g.translate(0, 968); g.rotate(o.lean); g.translate(0, -968); }
    const near = sp > 0.03 ? -1 : sp < -0.03 ? 1 : 0, pz = { [-1]: armPose(o, -1), [1]: armPose(o, 1) };
    const draw = (k, layer) => arm(g, P, k, pz[k], phi, o, layer);
    if (o.only) { draw(o.only, 'lower'); g.restore(); g.restore(); return; }       // reel 41: just one forearm and hand (over a table it reaches onto)
    const low = (k) => { if (o.skipLower !== k) draw(k, 'lower'); };
    if (near) { draw(-near, 'upper'); if (!pz[-near].front && !pz[-near].over) low(-near); }
    torso(g, P, phi, back);
    neck(g, P, phi, back);
    if (near) { if (pz[-near].front && !pz[-near].over) low(-near); draw(near, 'upper'); if (!pz[near].over) low(near); }
    else for (const k of [-1, 1]) { draw(k, 'upper'); if (!pz[k].over) low(k); }
    g.save(); g.translate(150 * sp * 0.42 + (o.headX || 0), (o.headBob ?? -wk * 4 * Math.cos(2 * ph - 0.5))); g.rotate(o.tilt || 0);
    const hy = clamp((o.headYaw || 0) + phi * 0.6, -1.15, 1.15);
    const face = () => head(g, L, { op: o.op, close: o.close, closeR: o.closeR, look: o.look, frown: o.frown, worry: o.worry, smile: o.smile, smirk: o.smirk, browY: o.browY, browUp: o.browUp, yaw: hy, rim: o.rim, cap: o.cap });
    const fm = back ? (o.faceMix ?? (o.showFace ? 1 : 0)) : 1;
    if (fm <= 0.001) headBack(g, L, o);
    else if (fm >= 0.999) face();
    else { headBack(g, L, o); g.save(); g.globalAlpha *= fm; face(); g.restore(); }
    g.restore();
    for (const k of [-1, 1]) if (pz[k].over) draw(k, 'lower');
    if (o.held) { g.save(); o.held(g, { [-1]: armParts(o, -1, pz[-1], phi), [1]: armParts(o, 1, pz[1], phi) }); g.restore(); }
    for (const k of [-1, 1]) if (HOLD[pz[k].hand]) draw(k, 'fingers');
    g.restore();
    g.restore();
  }
  // reel 41: what chaiStall and the shops around it read from reel 36's lane
  let EYE = 1400; const HZ = 690, FOC = 1000, LW = 1500, ZEND = 15000, LH = H + 760;
  const HAZE = '#f8d4a2', SHADE = '#45303a';
  const GOODS = ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#b94fd0', '#4fb06a', '#f2f0e6', '#2d5fae'];
  function poly(g, pts, fill) { if (pts.some((p) => !p)) return false; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } return true; }
  function chaiStall(g, sh, cz, tw, pt, quad, tone, hz) {
    const z0 = sh.z0, z1 = sh.z1;
    quad(z0 + 60, z1 - 60, 0, 2700, tone('#2b1d14', -0.1));
    for (let j = 0; j < 9; j++) { const za = z0 + 300 + j * 100; quad(za, za + 70, 1700 + (j % 3) * 120, 2500, mix(GOODS[j % 6], HAZE, hz), -80); }
    const cz0 = z0 + 260, cz1 = z1 - 160, d = 430;
    quad(cz0, cz1, 0, 1100, tone('#7a4a24'), d);
    poly(g, [pt(cz0, 0, 0), pt(cz0, 0, d), pt(cz0, 1100, d), pt(cz0, 1100, 0)], tone('#5a3519'));
    poly(g, [pt(cz0, 1100, 0), pt(cz0, 1100, d), pt(cz1, 1100, d), pt(cz1, 1100, 0)], tone('#c99a5e'));
    for (let i = 1; i < 5; i++) quad(cz0, cz1, i * 210, i * 210 + 14, 'rgba(0,0,0,0.18)', d);
    const kp = pt(cz0 + 520, 1100, 200), gp = pt(cz0 + 220, 1100, 300);
    if (kp) { g.save(); g.translate(kp[0], kp[1]); g.scale(kp[2], kp[2]); g.fillStyle = '#8f949b'; R(g, -110, -280, 220, 280, 40); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; R(g, -90, -260, 30, 220, 14); g.fill(); g.strokeStyle = '#6a6e74'; g.lineWidth = 18; g.beginPath(); g.arc(110, -190, 60, -1.2, 1.2); g.stroke(); g.fillStyle = '#ff8a2a'; ell(g, 0, 10, 110, 22); g.fill(); g.restore(); steam(g, kp[0], kp[1] - 300 * kp[2], tw, kp[2] * 2.4, 0.5); }
    if (gp) { for (let i = 0; i < 4; i++) { const q = pt(cz0 + 160 + i * 90, 1100, 330); if (q) glass(g, q[0], q[1] - 60 * q[2], q[2] * 0.42); } }
    const a0 = 3150, a1 = 2620, out = 760, zA = z0 - 120, zB = z1 + 60;
    const T0 = pt(zA, a0, 0), T1 = pt(zB, a0, 0), T2 = pt(zB, a1, out), T3 = pt(zA, a1, out);
    if (poly(g, [T0, T1, T2, T3], null)) { g.fillStyle = lg(g, 0, T0[1], 0, T3[1] + 40, [0, mix('#2b6fb3', HAZE, hz)], [1, mix('#1f4f82', HAZE, hz)]); g.fill(); }
    for (let m = 0; m < 6; m++) { const za = zA + m * (zB - zA) / 6, zb = za + (zB - zA) / 6, p = pt(za, a1, out), q = pt(zb, a1, out), mid = pt((za + zb) / 2, a1 - 130, out); if (p && q && mid) { g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(mid[0], mid[1], q[0], q[1]); g.closePath(); g.fillStyle = mix('#1f4f82', HAZE, hz); g.fill(); } }
    for (let m = 0; m <= 8; m++) { const zz = zA + 100 + m * (zB - zA - 200) / 8, p = pt(zz, a1 - 60 - 70 * Math.sin(m / 8 * Math.PI), out - 40); if (!p) continue; bulb(g, p[0], p[1], p[2], 0.85 + 0.15 * Math.sin(tw * 3 + m)); }
    const B0 = P3(-(LW - 300), 2560, zA - 10, cz), B1 = P3(-(LW - 860), 2160, zA - 10, cz);
    if (B0 && B1) { const w = B1[0] - B0[0], h = B1[1] - B0[1]; R(g, B0[0], B0[1], w, h, 6 * B0[2]); g.fillStyle = mix('#23302a', HAZE, hz * 0.6); g.fill(); txt(g, 'CHAI 10/-', B0[0] + w / 2, B0[1] + h * 0.7, h * 0.62, mix('#f4efe0', HAZE, hz * 0.6), { align: 'center', fit: w * 0.86 }); }
  }
  function steam(g, x, y, t, s, a = 0.5) {
    g.save(); g.lineCap = 'round'; g.lineWidth = 12 * s; g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
    for (let k = 0; k < 3; k++) { const ph = t * 1.1 + k * 2.1; g.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, px = x + ((k - 1) * 34 + Math.sin(ph + u * 5) * 18 * u) * s, py = y - u * 200 * s; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1; }
    g.restore();
  }
  function bulb(g, x, y, s, k = 1) {
    const r = Math.max(2, 70 * s);
    g.fillStyle = rg(g, x, y, 0, r * 2.2, [0, `rgba(255,214,130,${0.55 * k})`], [1, 'rgba(255,214,130,0)']); g.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
    g.fillStyle = '#fff2c4'; ell(g, x, y, Math.max(1.4, 16 * s), Math.max(1.8, 20 * s)); g.fill();
  }
  // ------------------------------------------------------------------ the cast
  // The season's thief keeps reel 20's face: the skin, the thin moustache, the stubble, the brows, the mole on his left cheek (the screen's
  // right when he faces you). Under the cap he's bald on top, with dark hair at the sides. The five share his skin and his age; they differ
  // in jaw, brows, eyes, nose, moustache and hair, never in colour (the desk). Number 4 has stubble and a thin moustache; 5 a pencil one:
  // a fair line has men like him. None has the mole.
  const SKIN = { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72' };
  const THIEF = { ...SKIN, hair: '#15100c', style: 'bald', capped: true, must: 'thin', stub: 0.55, brow: 15, browTilt: 8, jaw: 0.98, ew: 43, eh: 22, mole: [84, 62], moleR: 13 };
  const THIEF_BARE = { ...THIEF, capped: false };
  const TEAL = { a: '#37a18a', b: '#237a68', collar: '#1f6a5a', sleeve: 'short', buttons: 'rgba(255,255,255,0.45)', leg: '#20262f', shoe: '#121212' };
  const THIEF0 = { L: THIEF, D: TEAL }, THIEFB = { L: THIEF_BARE, D: TEAL };
  const M1 = { ...SKIN, hair: '#17110d', style: 'curls', capped: true, must: 'mid', beard: { c: '#1a120d', k: 'full' }, brow: 17, browTilt: 2, jaw: 1.1, chinK: 0.9, ew: 46, eh: 25 };
  const M2 = { ...SKIN, hair: '#15100c', style: 'part', capped: true, must: 'thick', stub: 0.1, specs: '#2a2420', brow: 13, browTilt: 6, jaw: 0.9, chinK: 1.08, ew: 41, eh: 21 };
  const M3 = { ...SKIN, hair: '#9a948c', mHair: '#c4beb4', style: 'short', capped: true, must: 'thick', stub: 0.2, brow: 21, browTilt: 11, jaw: 1.06, chinK: 1.1, ew: 42, eh: 21, noseW: 1.25 };
  const M4 = { ...SKIN, hair: '#17110d', style: 'crew', capped: true, must: 'thin', stub: 0.75, brow: 15, browTilt: 5, jaw: 1.0, ew: 44, eh: 23, earK: 1.32 };
  const M5 = { ...SKIN, hair: '#1a130e', style: 'spiky', capped: true, beard: { c: '#1a130e', k: 'chin' }, stub: 0, brow: 12, browTilt: 3, jaw: 0.9, chinK: 1.04, ew: 47, eh: 27 };
  const TEE = (a, b) => ({ a, b, sleeve: 'short', leg: '#2f3442', shoe: '#1d1a17' });
  const FIVE = [{ L: M1, D: TEE('#5ab8ff', '#3a8fd0') }, { L: M2, D: TEE('#f4f0e6', '#d4cdbd') }, { L: M3, D: { ...TEE('#8e6fd1', '#6c4fae'), wide: 1.12 } }, { L: M4, D: TEE('#6f7d92', '#525e72') }, { L: M5, D: TEE('#ef7fa8', '#cf5b86') }];
  const COP = { L: { skin: '#a8714d', skinD: '#80522f', skinH: '#c08a64', hair: '#120d0a', style: 'short', must: 'thick', brow: 18, browTilt: 4, jaw: 1.06, ew: 42, eh: 21, beret: true },
    D: { a: '#b8a06a', b: '#94804e', collar: '#a28c58', sleeve: 'short', buttons: 'rgba(60,40,20,0.5)', leg: '#9c8656', shoe: '#2a1d14' } };
  const WOMAN = { L: { skin: '#b57d58', skinD: '#8c5a3a', skinH: '#cc9a74', hair: '#1a1410', style: 'long', jaw: 0.92, ew: 44, eh: 24, brow: 11, browTilt: -2, braid: true }, D: { a: '#4f7fe0', b: '#2f58b0', sleeve: 'short', kameez: true, dupatta: '#ffd84a', leg: '#f3e6d8', shoe: '#8a3a2a' } };
  const BOY = { L: { skin: '#b9845c', skinD: '#90603c', skinH: '#d2a07a', hair: '#15100c', style: 'short', jaw: 0.9, chinK: 0.86, ew: 50, eh: 29, brow: 11, browTilt: -2 }, D: { a: '#f4dc5a', b: '#d8bc3a', sleeve: 'short', leg: '#3a5a9a', shoe: '#e8e6e0' } };

  // reel 41: the camera that personView/drawPerson project with is the free camera (window.RIG, reel 37), in reel 36's millimetres
  function PJ(c, X, Y, Z, near = 40) { const q = c.rig.toCam(X / 1000, Y / 1000, Z / 1000); if (q[2] * 1000 < near) return null; const s = c.f / q[2]; const p = c.rig.scr(q); return [p[0], p[1], s / 1000, q[2] * 1000]; }
  let P3 = () => null;                               // reel 41: set by the film to the shot's camera (chaiStall's sign uses it)
  // a person standing at (X, Z) on a floor at height Y, turned to face angle a (0: facing -Z, towards a camera looking down +Z; +π/2: facing
  // +X). Returns where to draw the figure and how it's turned for this camera, or null. o: the pose (merged into the figure's options).
  function personView(c, X, Y, Z, a) {
    const p = PJ(c, X, Y, Z, 160); if (!p) return null;
    const th = Math.atan2(X - c.x, Z - c.z), rel = Math.atan2(Math.sin(a + th), Math.cos(a + th));
    const front = Math.abs(rel) < Math.PI / 2;
    const yaw = front ? rel : -Math.atan2(Math.sin(rel - Math.PI), Math.cos(rel - Math.PI));
    return { x: p[0], y: p[1], s: p[2], d: p[3], front, yaw };
  }
  function drawPerson(g, c, P, X, Y, Z, a, o = {}) {
    const v = personView(c, X, Y, Z, a); if (!v) return null;
    const s = v.s * (o.scale || 1);
    if (s < 0.045) return v;
    g.save(); if (c.roll) { /* the canvas is already rolled */ }
    const tilt = (o.tilt || 0) - c.roll * 0;
    figure(g, P, v.x, v.y - 1594 * s, s, { legs: true, rim: 1, ...o, back: !v.front, yaw: clamp(v.yaw * 0.9, -0.95, 0.95), headYaw: (o.headYaw || 0) + (v.front ? 0 : 0), faceMix: o.faceMix, tilt });
    g.restore();
    return v;
  }
  const E = {}; function redBag() {} function capSprite() {}   // reel 41: thiefDraw's gully-only branches (the bag in his fist, the cap to the crate) are never taken here
  function resolveArm(c, v, o, keys, k, e, hand) {
    const s = v.s, hx = v.x, hy = v.y - 1594 * s;
    const toHead = (kk) => { if (kk.h) return kk.h; const p = PJ(c, kk.w[0], kk.w[1], kk.w[2]); return p ? [(p[0] - hx) / s, (p[1] - hy) / s] : [k * 300, 520]; };
    let tgt = toHead(keys[0][1]);
    for (let i = 0; i < keys.length - 1; i++) if (e >= keys[i][0]) { const u = sstep(keys[i][0], keys[i + 1][0], e), A2 = toHead(keys[i][1]), B2 = toHead(keys[i + 1][1]); tgt = [lerp(A2[0], B2[0], u), lerp(A2[1], B2[1], u)]; }
    return { ...armIK(o, k, tgt[0], tgt[1], 46), hand, w: 1 };
  }
  // the cap in his fist, drawn by head() so it comes off his own head and goes back on (front views)
  function capInFist(o, k, rot) {
    const w = wristInHead(o, k), dir = [-Math.sin(w.ang), Math.cos(w.ang)], fx = w.x + dir[0] * 50, fy = w.y + dir[1] * 50;
    const cx = fx - k * 80, cy = fy - 50;
    return { dx: cx, lift: -205 - cy, rot, a: 1 };
  }
  // the thief, drawn into the gully (his glass, the bag in his fist, the cap in his hand on its way to the crate)
  function thiefDraw(g, c, th, e) {
    const v0 = personView(c, th.X, 0, th.Z, th.a); if (!v0) return;
    const o = { ...th.o, yaw: clamp(v0.yaw * 0.9, -0.95, 0.95), back: !v0.front };
    if (o.armKeys) o.arms = { ...(o.arms || {}), l: resolveArm(c, v0, o, o.armKeys.l, -1, e, o.hand) };
    const handCap = o.capPhase === 'hand';
    if (handCap && v0.front) { o.cap = capInFist(o, -1, 0.1 + 0.45 * sstep(E.lifted, E.capDown, e)); o.handFront = -1; }
    const v = drawPerson(g, c, THIEFB, th.X, 0, th.Z, th.a, o); if (!v) return;
    const s = v.s;
    if (o.bagHand || (handCap && !v.front)) {
      const w = wristOf(o, -1), dir = [-Math.sin(w.ang), Math.cos(w.ang)];
      const fx = v.x + (w.x + dir[0] * 60) * s, fy = v.y - 1594 * s + (w.y + dir[1] * 60) * s;
      if (o.bagHand) redBag(g, fx, fy + 30 * s, s * 0.95, 0.15 * Math.sin(e * 9));
      if (handCap && !v.front) capSprite(g, fx + 20 * s, fy - 20 * s, s, 0.4, 0.9);
    }
  }
  window.R36 = { sstep, font, txt, R, ell, lg, rg, offscreen, caps, mix, shakeAt, flashAt, pop, title, ring, tileNo, kick, winK, blinkAt, key, buf, blurred, vignette,
    mouth, eye, capShape, hairPaths, bareHair, head, headBack, glass, hand, handShape, armPose, armParts, wristOf, wristInHead, armIK, figure, chaiStall, steam, bulb, poly,
    PJ, setP3: (f) => { P3 = f; }, personView, drawPerson, resolveArm, capInFist, thiefDraw, SKIN, THIEF, THIEF_BARE, TEAL, THIEF0, THIEFB, COP, BOY, GOODS, HAZE, INK, RED, YEL, CREAM };
})();
