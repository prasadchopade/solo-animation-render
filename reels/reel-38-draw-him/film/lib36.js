// Reel 38 · Draw Him: the series' rig, copied from tag source/reel-36-find-him (film/film.js) as HQ's brief names it: the face
// (`head`, `capShape`), the bodies they stand on (`figure` and its arms, torso, legs, hands), the season's thief as he looks now, and
// the market lane with its chai stall (`chaiStall`, inside reel 34's street). Copied by line range, unchanged, except: square
// spectacles (L.specsSq), and setView() to place the lane's camera. Everything new for this reel is in pencil.js and film.js.
window.R36 = (() => {
  const { W, H, clamp, lerp, mulberry32 } = C;
  const K = window.KIT, { hit } = K;
  const SIDE_ON = false, SIDE = { z0: -1 };
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', YEL = '#ffd34a', CREAM = '#fff6e2';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
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
        else if (L.specsSq) { g.fillStyle = 'rgba(255,255,255,0.14)'; R(g, -58, -34, 116, 68, 14); g.fill(); g.strokeStyle = L.specs; g.lineWidth = 8; g.stroke(); }
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
        g.save(); g.globalAlpha *= 0.9; g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 2, -120); g.bezierCurveTo(-hw - 4, -10, -120, 70, 0, 74); g.bezierCurveTo(120, 70, hw + 4, -10, hw + 2, -120); g.closePath(); g.fill(); g.restore(); g.strokeStyle = 'rgba(255,222,165,0.4)'; g.lineWidth = 14; g.beginPath(); g.arc(-40, -10, hw * 0.9, Math.PI * 0.95, Math.PI * 1.35); g.stroke();
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
  // a hand at the wrist, pointing down its forearm (+y). k: the side it's on (-1 your left)
  function hand(g, kind, L, k, rot, o = {}) {
    if (kind === 'hidden') return;
    const sk = lg(g, -56, 0, 56, 120, [0, L.skinH || L.skin], [0.5, L.skin], [1, L.skinD]);
    if (kind === 'open') {
      g.fillStyle = sk; R(g, -50, -4, 100, 100, 42); g.fill();
      for (const [fx, a, len] of [[-34, -0.2, 92], [-11, -0.07, 106], [12, 0.06, 102], [33, 0.19, 86]]) { g.save(); g.translate(fx, 80); g.rotate(a); R(g, -12, -6, 24, len, 12); g.fill(); g.restore(); }
      g.save(); g.translate(-k * 44, 26); g.rotate(-k * 0.95); R(g, -13, 0, 26, 74, 13); g.fill(); g.restore();
      return;
    }
    if (kind === 'point') {                          // a fist, the index finger out along the forearm
      g.fillStyle = sk; R(g, -44, -6, 88, 92, 36); g.fill();
      g.save(); g.translate(k * 14, 66); R(g, -13, 0, 26, 104, 13); g.fill(); g.fillStyle = 'rgba(255,236,220,0.45)'; R(g, -9, 74, 18, 26, 9); g.fill(); g.restore();
      g.fillStyle = sk; g.save(); g.translate(-k * 36, 22); g.rotate(-k * 0.5); R(g, -13, 0, 26, 62, 13); g.fill(); g.restore();
      g.strokeStyle = 'rgba(110,55,30,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(-30 + i * 22 - k * 8, 70); g.lineTo(-28 + i * 22 - k * 8, 86); g.stroke(); }
      return;
    }
    if (kind === 'fist' || kind === 'grip') {         // closed round something (a strap, a brim)
      g.fillStyle = sk; R(g, -46, -6, 92, 96, 38); g.fill();
      g.strokeStyle = 'rgba(110,55,30,0.28)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-30 + i * 24, 62); g.lineTo(-28 + i * 24, 84); g.stroke(); }
      g.save(); g.translate(-k * 40, 18); g.rotate(-k * 0.6); R(g, -13, 0, 26, 64, 13); g.fill(); g.restore();
      return;
    }
    if (kind === 'glass') {                          // a chai glass, held upright
      g.save(); g.rotate(-rot); g.translate(0, 34);
      glass(g, 0, -20, o.glassK || 0.5);
      g.fillStyle = sk; R(g, -52, -6, 104, 70, 28); g.fill(); g.save(); g.translate(-k * 42, -10); g.rotate(k * 0.2); R(g, -12, -38, 24, 66, 12); g.fill(); g.restore();
      g.restore(); return;
    }
    g.fillStyle = sk; R(g, -45, -6, 90, 104, 38); g.fill();              // relaxed: the fingers loosely curled, the thumb along the inside
    g.save(); g.translate(-k * 38, 16); g.rotate(-k * 0.3); R(g, -14, 0, 28, 70, 14); g.fill(); g.restore();
    g.strokeStyle = 'rgba(110,55,30,0.24)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-28 + i * 24 + k * 6, 74); g.lineTo(-26 + i * 24 + k * 6, 96); g.stroke(); }
  }
  // the pose of one arm: p.a1 swings the upper arm out from straight down, p.a2 bends the forearm in at the elbow, p.hand says what's in it
  function armPose(o, k) {
    const wk = o.walk ?? 0, ph = o.phase ?? 0;
    const ov = o.arms && o.arms[k > 0 ? 'r' : 'l'], ps = wk * 0.42 * Math.sin(ph + (k > 0 ? 0 : Math.PI)) * ((o.swingK && o.swingK[k > 0 ? 1 : 0]) ?? 1);
    const base = { a1: 0.07 + 0.04 * Math.abs(ps), a2: 0.12 + 0.42 * Math.max(0, ps), hand: (o.hands && o.hands[k > 0 ? 'r' : 'l']) || 'relax', len: [1 - 0.06 * Math.max(0, ps), 1 - 0.2 * Math.max(0, ps)] };
    if (!ov) return base;
    const w = ov.w ?? 1;
    return { a1: lerp(base.a1, ov.a1, w), a2: lerp(base.a2, ov.a2, w), hand: w > 0.5 ? ov.hand || base.hand : base.hand, len: base.len.map((v, i) => lerp(v, (ov.len || [1, 1])[i], w)) };
  }
  const shoulderX = (k, phi) => k * 268 * (0.6 + 0.4 * Math.cos(phi)) + 150 * Math.sin(phi) * 0.2;
  // where his wrist is (body frame, after the sway and the bob), and the angle the hand points: the same sums arm() does
  function wristOf(o, k) {
    const phi = clamp(o.yaw || 0, -0.95, 0.95), p = armPose(o, k), L1 = 262 * p.len[0], L2 = 236 * p.len[1];
    const t1 = -k * p.a1, t2 = t1 + k * p.a2, x0 = shoulderX(k, phi), y0 = 340;
    const x1 = x0 - L1 * Math.sin(t1), y1 = y0 + L1 * Math.cos(t1);
    return { x: x1 - L2 * Math.sin(t2), y: y1 + L2 * Math.cos(t2), ang: t2 };
  }
  // ... and the same point in his head's own frame (for a cap in his hand, which head() draws)
  function wristInHead(o, k) {
    const w = wristOf(o, k), phi = clamp(o.yaw || 0, -0.95, 0.95), sp = Math.sin(phi), wk = o.walk ?? 0, ph = o.phase ?? 0;
    const hx = 150 * sp * 0.42 + (o.headX || 0), hy = o.headBob ?? -wk * 4 * Math.cos(2 * ph - 0.5), tl = o.tilt || 0;
    const dx = w.x - hx, dy = w.y - hy, c = Math.cos(-tl), s = Math.sin(-tl);
    return { x: dx * c - dy * s, y: dx * s + dy * c, ang: w.ang - tl };
  }
  // the arm angles that put a point `reach` past the wrist (a fingertip, a fist's middle) on a target in his head's frame. Of the two elbows,
  // reaching up it takes the one further out from him; reaching down or across, the lower one (an elbow never flips up to hold a cap at the chest)
  function armIK(o, k, tx, ty, reach = 160, prefer) {
    const phi = clamp(o.yaw || 0, -0.95, 0.95), sp = Math.sin(phi), wk = o.walk ?? 0, ph = o.phase ?? 0;
    const hx = 150 * sp * 0.42 + (o.headX || 0), hy = o.headBob ?? -wk * 4 * Math.cos(2 * ph - 0.5);
    const Tx = tx + hx - shoulderX(k, phi), Ty = ty + hy - 340;
    const L1 = 262, L2 = 236 + reach, d = clamp(Math.hypot(Tx, Ty), Math.abs(L1 - L2) + 1, L1 + L2 - 1);
    const aD = Math.atan2(-Tx, Ty);
    const b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), gam = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    const sols = [1, -1].map((sg) => { const t1 = aD + sg * b; return { t1, t2: t1 - sg * (Math.PI - gam), ex: -L1 * Math.sin(t1), ey: L1 * Math.cos(t1) }; });
    const out = (prefer || (Ty < -60 ? 'out' : 'down')) === 'out';
    const q = out ? (k * sols[0].ex >= k * sols[1].ex ? sols[0] : sols[1]) : (sols[0].ey >= sols[1].ey ? sols[0] : sols[1]);
    return { a1: -q.t1 / k, a2: (q.t2 - q.t1) / k };
  }
  function arm(g, P, k, p, phi, o) {
    const D = P.D, L = P.L, by = 168, long = D.sleeve === 'long';
    const sx = shoulderX(k, phi);
    const L1 = 262 * (p.len ? p.len[0] : 1), L2 = 236 * (p.len ? p.len[1] : 1);
    const cloth = (w) => lg(g, -w, 0, w, 0, [0, D.a], [1, D.b]), skin = (w) => lg(g, -w, 0, w, 0, [0, L.skinH], [0.5, L.skin], [1, L.skinD]);
    g.save(); g.translate(sx, by + 172); g.rotate(-k * p.a1);
    g.fillStyle = long ? cloth(54) : skin(48); caps(g, 0, L1, 50, 44); g.fill();
    if (!long && D.sleeve !== 'none') { g.fillStyle = cloth(62); caps(g, -14, L1 * 0.52, 62, 56); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-56, L1 * 0.52 + 30); g.lineTo(56, L1 * 0.52 + 30); g.stroke(); }
    g.translate(0, L1); g.rotate(k * p.a2);
    g.fillStyle = long ? cloth(48) : skin(44); caps(g, -6, L2, 46, 38); g.fill();
    if (long) { g.fillStyle = D.cuff || D.a; caps(g, L2 - 46, L2 - 6, 44, 42); g.fill(); }
    g.translate(0, L2);
    if (!(o.handFront === k)) hand(g, p.hand || 'relax', L, k, -k * p.a1 + k * p.a2 + (o.lean || 0), o);
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
  // o.handFront: the hand on that side (-1 / 1) is drawn after the head, so it holds a cap from in front.
  function figure(g, P, x, y, s, o = {}) {
    const D = P.D, L = P.L, ph = o.phase ?? 0, wk = o.walk ?? 0;
    const bob = -wk * 18 * Math.cos(2 * ph) + (o.breath || 0), sway = wk * 8 * Math.sin(ph);
    const phi = clamp(o.yaw || 0, -0.95, 0.95), sp = Math.sin(phi), back = !!o.back;
    g.save(); g.translate(x, y); g.scale(s, s); if (o.roll) g.rotate(o.roll);
    if (o.legs) legs(g, D, ph, wk, bob, back);
    g.save(); g.translate(sway, bob);
    if (o.lean) { g.translate(0, 968); g.rotate(o.lean); g.translate(0, -968); }
    const near = sp > 0.03 ? -1 : sp < -0.03 ? 1 : 0;
    if (near) arm(g, P, -near, armPose(o, -near), phi, o);
    torso(g, P, phi, back);
    neck(g, P, phi, back);
    if (near) arm(g, P, near, armPose(o, near), phi, o); else { arm(g, P, -1, armPose(o, -1), phi, o); arm(g, P, 1, armPose(o, 1), phi, o); }
    g.save(); g.translate(150 * sp * 0.42 + (o.headX || 0), (o.headBob ?? -wk * 4 * Math.cos(2 * ph - 0.5))); g.rotate(o.tilt || 0);
    const hy = clamp((o.headYaw || 0) + phi * 0.6, -1.15, 1.15);
    const face = () => head(g, L, { op: o.op, close: o.close, closeR: o.closeR, look: o.look, frown: o.frown, worry: o.worry, smile: o.smile, smirk: o.smirk, browY: o.browY, browUp: o.browUp, yaw: hy, rim: o.rim, cap: o.cap });
    const fm = back ? (o.faceMix ?? (o.showFace ? 1 : 0)) : 1;
    if (fm <= 0.001) headBack(g, L, o);
    else if (fm >= 0.999) face();
    else { headBack(g, L, o); g.save(); g.globalAlpha *= fm; face(); g.restore(); }
    g.restore();
    if (o.handFront) { const k = o.handFront, p = armPose(o, k), w = wristOf(o, k); g.save(); g.translate(w.x, w.y); g.rotate(w.ang); hand(g, p.hand || 'relax', L, k, -k * p.a1 + k * p.a2, o); g.restore(); }
    g.restore();
    g.restore();
  }
  // ------------------------------------------------------------------ world A: the series' market lane at golden hour (reel 34's, in true perspective)
  // A point at height Y above the ground, X across, Z ahead (camera at cz, CAMX across) sits at x = 540 + (X − CAMX)·s, y = HZ + (EYE − Y)·s, s = FOC/(Z − cz).
  let EYE = 1400; const HZ = 690, FOC = 1000, LW = 1500, ZEND = 15000, LH = H + 760;
  const HAZE = '#f8d4a2', SHADE = '#45303a';
  let CAMX = 0;
  const P3 = (X, Y, Z, cz) => { const dz = Z - cz; if (dz < 30) return null; const s = FOC / dz; return [540 + (X - CAMX) * s, HZ + (EYE - Y) * s, s]; };
  const ZS = 3900;
  const SHOPS = (() => {
    const r = mulberry32(3405), out = [];
    const lay = { '-1': [-4500, [['cloth', 2300], ['grocery', 2000], ['pots', 2000], ['sweets', 2100], ['chai', 1500], ['cloth', 1900], ['grocery', 1700], ['shut', 1500], ['tailor', 1800], ['pots', 1700], ['grocery', 1800]]],
      '1': [-4800, [['fruit', 2000], ['tailor', 1800], ['grocery', 1900], ['chemist', 1700], ['cloth', 1900], ['sweets', 1800], ['shut', 1500], ['grocery', 1700], ['pots', 1800], ['cloth', 1800]]] };
    const cols = { '-1': ['#eaa597', '#f0cf86', '#92cfc5', '#cbb7e6', '#f2bf8f', '#e9b3c6'], '1': ['#f6c48e', '#9fcfee', '#f4adc0', '#ecdc7e', '#c5b8ea', '#f3a98f'] };
    const aws = ['stripeR', '#2b6fb3', '#e2a92a', 'stripeB', '#c2453a', '#7a59b8'];
    for (const side of [-1, 1]) {
      let [z, list] = lay[side], i = 0;
      for (const [kind, len] of list) { out.push({ side, z0: z, z1: z + len, kind, h: kind === 'chai' ? 3300 : 3400 + r() * 2000, col: cols[side][i % 6], aw: aws[(i + (side > 0 ? 2 : 0)) % 6], seed: (r() * 1e6) | 0 }); z += len; i++; }
      out.push({ side, z0: z, z1: ZEND + 400, kind: 'shut', h: 4200, col: cols[side][i % 6], aw: null, seed: 7 });
    }
    return out.sort((a, b) => b.z1 - a.z1);
  })();
  const SIGNS = [['TAILORS', 1, 5300, '#fff3cf', '#7a1f1f'], ['CHEMIST', 1, 8700, '#0f7a4a', '#ffffff'], ['SWEETS', -1, 6600, '#b5341f', '#fff6d6']];
  const GOODS = ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#b94fd0', '#4fb06a', '#f2f0e6', '#2d5fae'];
  function poly(g, pts, fill) { if (pts.some((p) => !p)) return false; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } return true; }
  function shop(g, sh, cz, tw) {
    const sd = sh.side, X = sd * LW, z0 = Math.max(sh.z0, cz + 150), z1 = sh.z1;
    if (z1 <= z0 + 20) return;
    if (SIDE_ON && sh.side === 1 && sh.z0 === SIDE.z0) return sideGully(g, cz, clamp(((sh.z0 + sh.z1) / 2 - cz - 2400) / 11000) * 0.66);
    const pt = (z, Y, dx = 0) => P3(X - sd * dx, Y, Math.max(z, cz + 150), cz);
    const quad = (za, zb, ya, yb, fill, dx = 0) => { za = Math.max(za, cz + 150); if (zb <= za + 1) return false; return poly(g, [pt(za, ya, dx), pt(zb, ya, dx), pt(zb, yb, dx), pt(za, yb, dx)], fill); };
    const hz = clamp(((z0 + z1) / 2 - cz - 2400) / 11000) * 0.66;
    const tone = (c, k = 0) => mix(sd > 0 ? mix(c, '#fff0d8', 0.08 + k) : mix(c, SHADE, 0.22 - k), HAZE, hz);
    const r = mulberry32(sh.seed), len = z1 - sh.z0;
    quad(sh.z0, z1, 0, sh.h, tone(sh.col));
    quad(sh.z0, z1, sh.h - 70, sh.h, tone('#ffffff', 0.1));
    quad(sh.z0, sh.z0 + 40, 0, sh.h, mix('#000000', HAZE, hz * 0.8) + '22');
    if (sh.h > 3800) { const nw = Math.max(1, Math.round(len / 800)); for (let j = 0; j < nw; j++) { const za = sh.z0 + (j + 0.22) * len / nw, zb = sh.z0 + (j + 0.78) * len / nw; quad(za, zb, 3000, 3700, tone('#3a3f4a')); quad(za + 30, zb - 30, 3040, 3660, r() > 0.5 ? mix('#ffd38a', HAZE, hz) : tone('#5a6070')); quad(za - 20, zb + 20, 2960, 3010, tone('#ffffff', 0.05)); } }
    if (sh.kind === 'shut') { quad(sh.z0 + 90, z1 - 90, 0, 2500, tone('#8d9197')); for (let y = 120; y < 2500; y += 110) quad(sh.z0 + 90, z1 - 90, y, y + 22, tone('#6f747b')); return; }
    if (sh.kind === 'chai') return chaiStall(g, sh, cz, tw, pt, quad, tone, hz);
    quad(sh.z0 + 90, z1 - 90, 0, 2450, tone('#2a211d', -0.1));
    g.save(); if (quad(sh.z0 + 90, z1 - 90, 0, 2450, null)) g.clip();
    const n = Math.max(3, Math.round(len / 320));
    for (let j = 0; j < n; j++) {
      const za = sh.z0 + 90 + (j + 0.1) * (len - 180) / n, zb = za + 0.8 * (len - 180) / n, c = mix(GOODS[(j + sh.seed) % GOODS.length], '#3a2c26', 0.38);
      if (sh.kind === 'cloth') quad(za, zb, 200, 2300 - (j % 3) * 260, tone(c), -280);
      else if (sh.kind === 'pots') { for (let y = 360; y < 2100; y += 420) { const p = pt((za + zb) / 2, y + 120, -250); if (!p) continue; g.fillStyle = tone(mix(j % 2 ? '#a9aeb4' : '#c3c7cc', '#3a2c26', 0.3)); ell(g, p[0], p[1], 120 * p[2], 95 * p[2]); g.fill(); } }
      else if (sh.kind === 'sweets') { quad(za, zb, 700, 1150, tone('#f3e2b8'), -200); quad(za, zb, 1150, 1240, tone(['#f0a640', '#f4d36a', '#e86f6f', '#f7ebd0'][j % 4]), -200); }
      else if (sh.kind === 'fruit') { quad(za, zb, 500, 1000, tone(['#f2c230', '#f08a24', '#e2412f', '#7fb33d'][j % 4]), -120); quad(za, zb, 1000, 1080, tone('#8a5a2c'), -120); }
      else { for (let y = 260; y < 2200; y += 420) quad(za, zb, y, y + 260, tone(mix(GOODS[(j * 3 + y / 420 + sh.seed) % GOODS.length | 0], '#3a2c26', 0.38)), -260); }
    }
    quad(sh.z0 + 90, z1 - 90, 0, 2450, 'rgba(28,16,12,0.22)');
    g.restore();
    quad(sh.z0 + 60, z1 - 60, 2480, 2820, tone(GOODS[(sh.seed >> 3) % GOODS.length], 0.04));
    if (sh.aw) {
      const a0 = 2950, a1 = 2560, out = 420, ns = Math.max(4, Math.round(len / 220));
      for (let m = 0; m < ns; m++) {
        const za = sh.z0 + 40 + m * (len - 80) / ns, zb = za + (len - 80) / ns;
        const c = sh.aw === 'stripeR' ? (m % 2 ? '#f6efe2' : '#d9402f') : sh.aw === 'stripeB' ? (m % 2 ? '#f6efe2' : '#2f6fb0') : sh.aw;
        poly(g, [pt(za, a0, 0), pt(zb, a0, 0), pt(zb, a1, out), pt(za, a1, out)], tone(c));
      }
      poly(g, [pt(sh.z0 + 40, a1, out), pt(z1 - 40, a1, out), pt(z1 - 40, a1 - 60, out), pt(sh.z0 + 40, a1 - 60, out)], 'rgba(0,0,0,0.16)');
      if ((sh.kind === 'cloth' || sh.kind === 'fruit') && (sh.z0 + sh.z1) / 2 - cz > 3200) {
        for (let j = 0; j < 5; j++) {
          const zz = sh.z0 + (j + 0.5) * len / 5, p0 = pt(zz, a1 - 20, out * 0.7), p1 = pt(zz, a1 - 520, out * 0.7); if (!p0 || !p1) continue;
          const c = sh.kind === 'fruit' ? '#f2c230' : GOODS[(j + 2) % GOODS.length], wv = 0.03 * Math.sin(tw * 2.1 + j);
          g.save(); g.translate(p0[0], p0[1]); g.rotate(wv); g.fillStyle = mix(c, HAZE, hz); const w = 140 * p0[2], hgt = p1[1] - p0[1];
          if (sh.kind === 'fruit') { for (let b = 0; b < 4; b++) { ell(g, (b - 1.5) * w * 0.35, hgt * 0.6, w * 0.16, hgt * 0.42, (b - 1.5) * 0.25); g.fill(); } }
          else { R(g, -w / 2, 0, w, hgt, w * 0.2); g.fill(); }
          g.restore();
        }
      }
    }
    if (sh.kind === 'grocery' || sh.kind === 'fruit') {
      for (let j = 0; j < 3; j++) { const za = sh.z0 + 200 + j * (len - 400) / 3, zb = za + (len - 400) / 4; quad(za, zb, 0, 520, tone('#a8784a'), 150); quad(za, zb, 520, 600, tone(['#e8c34a', '#d2462f', '#f0e6c8'][j % 3]), 150); }
    }
  }
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
  const STRINGS = [[2300, 'bunt', 3900, 3350], [4700, 'bulbs', 3650, 3200], [6300, 'bunt', 4000, 3450], [8300, 'bulbs', 3700, 3250], [10200, 'bunt', 3900, 3400], [12400, 'bulbs', 3700, 3300]];
  function strings(g, cz, tw) {
    for (const [z, kind, yEnd, yMid] of [...STRINGS].sort((a, b) => b[0] - a[0])) {
      const dz = z - cz; if (dz < 300) continue;
      const hz = clamp((dz - 2400) / 11000) * 0.6, N = kind === 'bunt' ? 16 : 11;
      const at = (u) => { const X = lerp(-LW, LW, u), Y = yEnd - (yEnd - yMid) * 4 * u * (1 - u); return P3(X, Y, z, cz); };
      g.strokeStyle = 'rgba(30,25,20,0.65)'; g.lineWidth = Math.max(1, 6 * FOC / dz); g.beginPath();
      for (let i = 0; i <= 24; i++) { const p = at(i / 24); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.stroke();
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N, p = at(u), s = p[2];
        if (kind === 'bunt') { const fl = 18 * Math.sin(tw * 3.1 + i * 1.7 + z) * s; g.fillStyle = mix(['#ff7fb0', '#ffd84a', '#5ab8ff', '#fff6e0'][i % 4], HAZE, hz); g.beginPath(); g.moveTo(p[0] - 70 * s, p[1]); g.lineTo(p[0] + 70 * s, p[1]); g.lineTo(p[0] + fl, p[1] + 150 * s); g.closePath(); g.fill(); }
        else bulb(g, p[0], p[1] + 20 * s, s, 0.8 + 0.2 * Math.sin(tw * 2.3 + i));
      }
    }
  }
  const LITTER = (() => { const r = mulberry32(3488), out = []; for (let i = 0; i < 260; i++) { const X = (r() - 0.5) * 2 * (LW - 120), Z = -4800 + r() * 19000, c = r(); out.push({ X, Z, rot: r() * 3, k: c > 0.3 ? 'petal' : 'leaf', col: c > 0.55 ? '#f39a1e' : c > 0.3 ? '#f7c52b' : r() > 0.5 ? '#7fa83e' : '#c79a4a' }); } return out; })();
  function floor(g, cz) {
    const fz = cz + 150, A = P3(-LW, 0, fz, cz), B = P3(LW, 0, fz, cz), Cc = P3(LW, 0, ZEND + 3000, cz), D = P3(-LW, 0, ZEND + 3000, cz);
    poly(g, [D, Cc, B, A], null); g.fillStyle = lg(g, 0, HZ, 0, LH, [0, '#e9d0a6'], [0.12, '#d9bd93'], [0.45, '#bca07e'], [1, '#a08467']); g.fill();
    g.save(); poly(g, [D, Cc, B, A], null); g.clip();
    g.fillStyle = rg(g, 540, HZ + 10, 10, 900, [0, 'rgba(255,226,170,0.55)'], [1, 'rgba(255,226,170,0)']); g.fillRect(-400, HZ, W + 800, 1000);
    poly(g, [P3(-LW, 0, fz, cz), P3(-LW + 900, 0, fz, cz), P3(-LW + 260, 0, ZEND, cz), P3(-LW, 0, ZEND, cz)], 'rgba(70,40,40,0.16)');
    g.strokeStyle = 'rgba(70,55,35,0.2)';
    for (let z = Math.ceil((cz + 260) / 560) * 560; z < ZEND; z += 560) { const a = P3(-LW, 0, z, cz), b = P3(LW, 0, z, cz); g.lineWidth = Math.max(1, 5 * a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (let i = -4; i <= 4; i++) { const X = i * 340, a = P3(X, 0, cz + 200, cz), b = P3(X, 0, ZEND, cz); g.lineWidth = 3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (const p of LITTER) {
      const q = P3(p.X, 0, p.Z, cz); if (!q || q[2] > 1.6) continue; const s = q[2];
      g.save(); g.translate(q[0], q[1]); g.rotate(p.rot); g.fillStyle = p.col;
      if (p.k === 'petal') { ell(g, 0, 0, 16 * s, 9 * s); g.fill(); } else { g.beginPath(); g.moveTo(-46 * s, 0); g.quadraticCurveTo(0, -20 * s, 46 * s, 0); g.quadraticCurveTo(0, 20 * s, -46 * s, 0); g.fill(); }
      g.restore();
    }
    g.restore();
  }
  let SKY = null;
  function makeSky() {
    const c = offscreen(W + 800, 1500), g = c.getContext('2d'), r = mulberry32(3411);
    g.fillStyle = lg(g, 0, 0, 0, 1500, [0, '#e9814f'], [0.55, '#f6b877'], [0.82, '#fcdcac'], [1, '#fde7c2']); g.fillRect(0, 0, W + 800, 1500);
    g.fillStyle = rg(g, 960, 1210, 10, 900, [0, 'rgba(255,248,215,0.95)'], [0.18, 'rgba(255,226,160,0.7)'], [1, 'rgba(255,200,140,0)']); g.fillRect(0, 0, W + 800, 1500);
    g.fillStyle = '#fff6da'; ell(g, 960, 1210, 64, 64); g.fill();
    g.fillStyle = 'rgba(160,104,120,0.42)'; for (let x = 0; x < W + 800;) { const w = 90 + r() * 120, hh = 120 + r() * 260; g.fillRect(x, 1500 - hh, w, hh); x += w; }
    SKY = c;
  }
  function farEnd(g, cz) {
    const z = ZEND + 2600, r = mulberry32(3419), cols = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#e88aa0'];
    for (let X = -5200, i = 0; X < 5200; i++) {
      const w = 900 + r() * 700, hgt = 2600 + r() * 2200, a = P3(X, hgt, z, cz), b = P3(X + w, 0, z, cz); if (!a || !b) break;
      g.fillStyle = mix(cols[i % 6], HAZE, 0.5); g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      g.fillStyle = mix('#ffe2a0', HAZE, 0.3); for (let wy = hgt - 500; wy > 900; wy -= 700) for (let wx = X + 160; wx < X + w - 200; wx += 380) { const p = P3(wx, wy, z, cz), q = P3(wx + 200, wy - 340, z, cz); if (r() > 0.4) g.fillRect(p[0], p[1], q[0] - p[0], q[1] - p[1]); }
      X += w;
    }
  }
  function light(g, tw) {                            // the low sun's shafts down the lane, and the dust turning in them
    g.save(); g.globalCompositeOperation = 'lighter';
    const sx = 560, sy = 450;
    for (const [a0, a1, al] of [[1.1, 1.22, 0.07], [1.34, 1.42, 0.05], [1.55, 1.66, 0.06], [1.82, 1.9, 0.04]]) {
      const L = 2600; g.fillStyle = lg(g, sx, sy, sx + Math.cos((a0 + a1) / 2) * L, sy + Math.sin((a0 + a1) / 2) * L, [0, `rgba(255,214,150,${al})`], [1, 'rgba(255,214,150,0)']);
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a0) * L, sy + Math.sin(a0) * L); g.lineTo(sx + Math.cos(a1) * L, sy + Math.sin(a1) * L); g.closePath(); g.fill();
    }
    g.restore();
  }
  function world(g, cz, tw) {
    if (!SKY) makeSky();
    g.drawImage(SKY, -400 - CAMX * 0.05, HZ - 1500 + 40);
    g.fillStyle = '#e9814f'; g.fillRect(-600, -1600, W + 1200, HZ - 1500 + 40 + 1600);
    farEnd(g, cz); floor(g, cz);
    for (const sh of SHOPS) shop(g, sh, cz, tw);
    for (const [s, side, z, bgc, fg] of SIGNS) {
      if (SIDE_ON) continue;
      const a = P3(side * (LW - 40), 3650, z, cz), b = P3(side * (LW - 700), 3100, z, cz); if (!a || !b) continue;
      const hz = clamp((z - cz - 2400) / 11000) * 0.6, x0 = Math.min(a[0], b[0]), w = Math.abs(b[0] - a[0]), h = b[1] - a[1];
      R(g, x0, a[1], w, h, 4 * a[2]); g.fillStyle = mix(bgc, HAZE, hz); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = Math.max(1, 4 * a[2]); g.stroke();
      txt(g, s, x0 + w / 2, a[1] + h * 0.74, h * 0.66, mix(fg, HAZE, hz), { align: 'center', fit: w * 0.86 });
    }
    strings(g, cz, tw);
  }
  function myGlassHand(g, x, y, s, rot, fill) {     // your right hand at the counter, holding your chai
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, 120, 120, 520, 720, [0, '#4a6a94'], [1, '#2c4466']);
    g.beginPath(); g.moveTo(40, 120); g.bezierCurveTo(70, 60, 200, 40, 250, 90); g.lineTo(700, 760); g.lineTo(300, 960); g.closePath(); g.fill();
    if (fill >= 0) glass(g, -20, -40, 0.95, fill);
    g.fillStyle = lg(g, -130, -40, 160, 160, [0, '#d6a07a'], [1, '#a9744f']);
    ell(g, 120, 50, 120, 100, -0.3); g.fill();
    for (let i = 0; i < 4; i++) { R(g, -70 + i * 6, -20 + i * 34, 170, 34, 17); g.fill(); }
    g.fillStyle = 'rgba(255,232,200,0.22)'; for (let i = 0; i < 4; i++) { ell(g, 30 + i * 6, -10 + i * 34, 30, 7); g.fill(); }
    g.restore();
  }

  const SKIN = { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72' };
  const THIEF = { ...SKIN, hair: '#15100c', style: 'bald', capped: true, must: 'thin', stub: 0.55, brow: 15, browTilt: 8, jaw: 0.98, ew: 43, eh: 22, mole: [84, 62], moleR: 13 };
  const THIEF_BARE = { ...THIEF, capped: false };
  const TEAL = { a: '#37a18a', b: '#237a68', collar: '#1f6a5a', sleeve: 'short', buttons: 'rgba(255,255,255,0.45)', leg: '#20262f', shoe: '#121212' };
  const THIEF0 = { L: THIEF, D: TEAL }, THIEFB = { L: THIEF_BARE, D: TEAL };
  const setView = (eye, camx) => { EYE = eye; CAMX = camx; };
  return { sstep, INK, RED, YEL, CREAM, font, txt, R, ell, lg, rg, offscreen, caps, mix, shakeAt, flashAt, pop, title, ring, kick, winK, blinkAt, key, buf,
    vignette, mouth, eye, capShape, head, headBack, glass, hand, armPose, wristOf, armIK, figure, P3, world, light, steam, bulb, myGlassHand, setView,
    SKIN, THIEF, THIEF_BARE, TEAL, THIEF0, THIEFB, HZ, FOC, LW };
})();
