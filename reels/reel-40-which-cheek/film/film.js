// Reel 40 · Which Cheek? Tests desk, "You're the test subject", built on what viewers already know about Season 1's thief: the man with
// the mole and the maroon cap. Police picked up four men who fit his description; their photos lie on a detective's desk under a lamp.
// They share his face, his shirt, his size and a mugshot's stare; only the mole's cheek, the cap's colour and the brim differ. She deals
// his crimes onto the desk (the red bag, the raised chai, the cricket crowd), the mole in every one for anyone who looks. Whoever you pick
// goes on every screen in the city tonight. If it's a lookalike, an innocent man's face follows him through a crowd, and the real one
// walks past. If you got him right, he's sitting under the chai stall's TV while it asks "Have you seen this man?", and nobody looks down.
// He taps his mole: his left cheek, the screen's right, in every photo you saw. Facts: docs/research.md. The script: docs/script.md.
// Copied from tag source/reel-36-find-him, film/film.js, as the brief names: head, capShape (now with the cap's colour and brim as a
// parameter), chaiStall's pieces (bulb, steam, the kettle, the tarp, the board), and his current look with the figure rig thiefDraw uses;
// plus the helpers they call. New here: the desk, the photos, the city's screens, the crowd, the stall at night. Our own drawings; nobody
// real. 30 fps. Every frame is a pure function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
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
  // the cap: the crown, the seam, the brim (bs: how far the brim has turned with his face; sq: crumpled, as it comes out of a pocket).
  // cl: its colours and brim (reel 40: the four differ in the cap's colour and the brim, so the look is a parameter; his is CAPM).
  // Its brim is always drawn: from behind or crumpled, a crown alone reads as a skullcap (the desk's note).
  function capShape(g, hh, bs = 0, bw = 1, sq = 0, cl = CAPM) {
    g.save();
    if (sq > 0) { g.translate(0, -120); g.scale(1 - 0.22 * sq, 1 - 0.52 * sq); g.translate(0, 120); }
    g.beginPath(); g.moveTo(-hh - 2, -122); g.bezierCurveTo(-hh - 8, -280, -90, -318, 0, -318); g.bezierCurveTo(90, -318, hh + 8, -280, hh + 2, -122); g.quadraticCurveTo(bs * 0.5, -158, -hh - 2, -122); g.closePath(); g.fillStyle = lg(g, -hh, -318, hh, -120, [0, cl.a], [1, cl.b]); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(bs * 0.6, -318); g.quadraticCurveTo(bs * 0.9 - 12, -220, bs, -150); g.stroke();
    g.fillStyle = 'rgba(255,200,170,0.22)'; ell(g, -hh * 0.45, -262, 50, 22, -0.3); g.fill();
    if (sq > 0.04) { g.strokeStyle = `rgba(40,6,12,${0.55 * sq})`; g.lineWidth = 6; g.lineCap = 'round'; for (const [x0, y0, x1, y1] of [[-120, -170, -40, -250], [10, -160, 80, -270], [-60, -288, 60, -226]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 20, (y0 + y1) / 2, x1, y1); g.stroke(); } }
    g.save(); g.translate(bs, 0); g.scale(bw, 1 - 0.3 * sq);
    if (cl.flat) {                                     // a flat brim: a straight band, wider than his face, with the sticker flat brims keep
      g.beginPath(); g.moveTo(-hh - 30, -138); g.lineTo(hh + 30, -138); g.lineTo(hh + 26, -98); g.quadraticCurveTo(hh + 24, -92, hh + 14, -92); g.lineTo(-hh - 14, -92); g.quadraticCurveTo(-hh - 24, -92, -hh - 26, -98); g.closePath(); g.fillStyle = cl.brim; g.fill();
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(-hh - 28, -138, 2 * hh + 56, 7);
      g.fillStyle = '#d9c27a'; ell(g, hh * 0.42, -115, 15, 13); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; ell(g, hh * 0.42 - 4, -119, 6, 4); g.fill();
    } else {
      g.beginPath(); g.moveTo(-hh + 6, -128); g.quadraticCurveTo(0, -170, hh - 6, -128); g.quadraticCurveTo(hh + 6, -108, hh - 40, -92); g.quadraticCurveTo(0, -116, -hh + 40, -92); g.quadraticCurveTo(-hh - 6, -108, -hh + 6, -128); g.closePath(); g.fillStyle = cl.brim; g.fill();
    }
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
      capShape(g, hh, sy * hw * 0.42, 0.55 + 0.45 * cw, cap.sq || 0, L.capLook || CAPM);
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
      capShape(g, hw + 6, 0, 1, 0, L.capLook || CAPM); g.fillStyle = (L.capLook || CAPM).brim; ell(g, hw * 0.72, -112, 52, 14, 0.35); g.fill(); return;
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
  function redBag(g, x, y, s, rot) {                // reel 20's red bag
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, -150, -40, 150, 220, [0, '#e0313a'], [1, '#8d0f1a']); R(g, -150, -20, 300, 230, 40); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.22)'; R(g, -120, 6, 240, 16, 8); g.fill();
    g.fillStyle = '#c9a96a'; R(g, -26, 40, 52, 40, 8); g.fill();
    g.strokeStyle = 'rgba(60,0,8,0.4)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-150, 60); g.lineTo(150, 60); g.stroke();
    g.restore();
  }

  // ================================================================ reel 40 from here: the cast
  // His cap (reel 36's colours, the curved brim) and the two the lookalikes wear: a bright red, and a bright red with a flat brim.
  const CAPM = { a: '#a32b3d', b: '#5c1520', brim: '#4a111b' };
  const CAPR = { a: '#f2452f', b: '#b8241a', brim: '#8e1a12' };
  const CAPRF = { ...CAPR, flat: true };
  // The season's thief keeps reel 20's face (reel 36's look): the skin, the thin moustache, the stubble, the brows, the mole on his left cheek
  // (the screen's right when he faces you); bald on top under the cap, dark hair at the sides; the teal shirt.
  const SKIN = { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72' };
  const THIEF = { ...SKIN, hair: '#15100c', style: 'bald', capped: true, must: 'thin', stub: 0.55, brow: 15, browTilt: 8, jaw: 0.98, ew: 43, eh: 22, mole: [84, 62], moleR: 15, capLook: CAPM };
  const THIEF_BARE = { ...THIEF, capped: false };
  const TEAL = { a: '#37a18a', b: '#237a68', collar: '#1f6a5a', sleeve: 'short', buttons: 'rgba(255,255,255,0.45)', leg: '#20262f', shoe: '#121212' };
  const TEAL_M = { ...TEAL, collar: '#2b8873' };     // in the mugshots, a collar that doesn't read as straps
  const HIM = { L: THIEF, D: TEAL }, HIMB = { L: THIEF_BARE, D: TEAL };
  // The four: one face (his), one shirt, one size, one stare. Only the mole's cheek, the cap's colour and the brim differ (docs/script.md):
  // 1 left cheek (the screen's), red · 2 left, maroon (the cheek reel 38's poster drew) · 3 him · 4 right, red, flat brim.
  const FOUR = [
    { n: 1, L: { ...THIEF, mole: [-84, 62], capLook: CAPR }, bad: ['mole', 'cap'] },
    { n: 2, L: { ...THIEF, mole: [-84, 62], capLook: CAPM }, bad: ['mole'] },
    { n: 3, L: { ...THIEF }, him: true, bad: [] },
    { n: 4, L: { ...THIEF, capLook: CAPRF }, bad: ['cap', 'brim'] },
  ];
  // the detective: plain clothes, a navy kurta, round glasses, hair tied back
  const DET = { L: { skin: '#b9825d', skinD: '#8f5d3d', skinH: '#d09a74', hair: '#1b1512', style: 'pony', jaw: 0.9, chinK: 0.95, ew: 44, eh: 24, brow: 11, browTilt: -2, specs: '#30261f' },
    D: { a: '#33456b', b: '#24324f', sleeve: 'long', cuff: '#2a3a5c', kameez: true, leg: '#2a2a33', shoe: '#1d1a17' } };

  // ------------------------------------------------------------------ timing (the motion test's estimates; the placed voice replaces them)
  const T0 = {
    l1: 0.0, l1e: 2.1,                      // "You know the man with the mole."
    l2: 2.3, l2e: 4.8,                      // "Last night, police picked up four of him."
    sq0: 2.6, sq1: 4.4,                     // her hands square the photos up
    l3: 5.0, l3e: 8.3,                      // "Only one is really him, and you've seen all his crimes."
    c1: 7.0, c2: 8.0, c3: 9.0, sweep: 10.0, // the crimes land; she sweeps them off
    l4: 10.2, l4e: 13.6,                    // "Whoever you pick goes on every screen in the city tonight."
    l5: 13.8, l5e: 15.2,                    // "So which one is him?"
    ring0: 13.8, ring1: 17.8,               // the ring runs out
    l6: 16.6, l6e: 17.2,                    // "Be sure."
    flash: 17.8, city0: 17.8, crowd0: 19.9,
    l7: 18.3, l7e: 22.6,                    // "Because if it's the wrong man, that's an innocent man's face, everywhere he goes."
    see: 20.5, point: 21.0, film: 21.3, pull: 21.7, capDown: 22.0, away: 22.4,
    l8: 22.9, l8e: 25.1, walk0: 22.9,       // "And the real one walks right past it."
    stall0: 25.6,
    l9: 25.6, l9e: 27.0,                    // "And if you got him right?"
    tv: 27.0, tve: 28.6,                    // the TV: "Have you seen this man?"
    l10: 28.8, l10e: 32.0,                  // "Everyone's looking at his face. Nobody's looking at him."
    glance: 29.6, hide: 29.75, back: 31.0,
    push0: 31.5, turn: 32.0, tap1: 32.75, tap2: 33.15,
    pay0: 33.8,
    l11: 33.8, l11e: 35.6,                  // "It was in every photo you saw."
    l12: 35.8, l12e: 38.3,                  // "Memory keeps the mole, and drops the side."
    four0: 35.8,
    fin0: 38.6,
    l13: 38.6, l13e: 41.6,                  // "So be honest. Did you know it, or did you guess?"
    raise: 39.1, dk: 39.7, og: 40.6, end: 42.5,
  };
  const T = Object.assign({}, T0, window.TIMING || {});   // film/timing.js (place_vo.py): where the picture follows the placed words

  // ------------------------------------------------------------------ photos: each drawn once into its own canvas (a print never changes)
  const PIC = {};
  const picture = (key, w, h, draw) => { if (!PIC[key]) { const c = offscreen(w, h); draw(c.getContext('2d'), w, h); PIC[key] = c; } return PIC[key]; };
  function photoFinish(g, w, h, seed, warm = 0.06) {   // a print's look: a little grain, a warm cast, the corners darker
    const r = mulberry32(seed);
    for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; g.fillRect(r() * w, r() * h, 2, 2); }
    g.fillStyle = `rgba(255,190,120,${warm})`; g.fillRect(0, 0, w, h);
    g.fillStyle = rg(g, w / 2, h / 2, w * 0.32, w * 0.85, [0, 'rgba(0,0,0,0)'], [1, 'rgba(20,14,8,0.26)']); g.fillRect(0, 0, w, h);
  }
  // a mugshot: his head and shoulders against a pale wall, lit by a flash just left of the lens, its shadow behind him on the wall
  const MUG_W = 597, MUG_H = 687, MUG_S = 1.16, MUG_HY = 0.45;   // 1.5× the print's image (398 × 458 desk units), so a push-in stays sharp
  function drawMug(g, w, h, L) {
    g.fillStyle = lg(g, 0, 0, 0, h, [0, '#e2e4dc'], [1, '#c2c7be']); g.fillRect(0, 0, w, h);
    const s = MUG_S, hx = w / 2, hy = h * MUG_HY;
    g.save(); g.filter = 'blur(10px)'; g.globalAlpha = 0.32; g.translate(hx + 40, hy + 16); g.scale(s, s);
    g.fillStyle = '#1f241e'; ell(g, 0, -70, 205, 285); g.fill(); g.beginPath(); g.moveTo(-330, 330); g.quadraticCurveTo(0, 230, 330, 330); g.lineTo(380, 900); g.lineTo(-380, 900); g.closePath(); g.fill();
    g.restore();
    figure(g, { L, D: TEAL_M }, hx, hy, s, { legs: false, yaw: 0, rim: 0, frown: 0.16, close: 0.1, look: [0, 3], cap: 1 });
    // the flash: a hard light on the forehead under the brim, the nose's bridge, the cheekbones; the shade under them
    g.save(); g.translate(hx, hy); g.scale(s, s);
    for (const k of [-1, 1]) { g.fillStyle = rg(g, k * 112, 104, 4, 78, [0, 'rgba(110,55,30,0.12)'], [1, 'rgba(110,55,30,0)']); g.fillRect(k * 112 - 80, 24, 160, 160); }
    g.fillStyle = rg(g, -6, 8, 2, 46, [0, 'rgba(255,246,236,0.16)'], [1, 'rgba(255,246,236,0)']); g.fillRect(-60, -40, 120, 100);
    g.fillStyle = rg(g, -30, -78, 4, 90, [0, 'rgba(255,246,236,0.12)'], [1, 'rgba(255,246,236,0)']); g.fillRect(-130, -160, 200, 170);
    g.restore();
    photoFinish(g, w, h, 4400 + L.mole[0], 0.04);
  }
  // his crimes, as a witness's photos: big enough to read his face on a phone, the mole on the screen's right, the brim and the maroon cap
  const CR_W = 900, CR_H = 680;
  function bokeh(g, w, h, seed, cols, n = 26, a = 0.5) {
    const r = mulberry32(seed);
    for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h * 0.8, rad = 18 + r() * 46, c = cols[(r() * cols.length) | 0]; g.fillStyle = rg(g, x, y, 0, rad, [0, c], [1, 'rgba(0,0,0,0)']); g.globalAlpha = a * (0.4 + 0.6 * r()); g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    g.globalAlpha = 1;
  }
  // each crime's figure: where his head is in the photo, its scale, his pose (the payoff's rings use the same numbers)
  const CRIME_FIG = [
    { hx: 470, hy: 250, s: 0.86, rot: -0.05, L: THIEF, o: { legs: false, yaw: -0.24, look: [9, 4], op: 0.06, browUp: 12, frown: 0.1, rim: 1, cap: 1 } },
    { hx: 470, hy: 285, s: 0.9, rot: 0, L: THIEF, o: { legs: false, yaw: -0.14, look: [0, 1], smile: 0.6, smirk: 0.7, browUp: 14, rim: 1, cap: 1, glassK: 0.62 } },
    { hx: 500, hy: 300, s: 0.86, rot: 0, L: THIEF_BARE, o: { legs: false, yaw: -0.1, look: [3, 2], smile: 0.25, smirk: 0.35, rim: 1, glassK: 0.5 } },
  ];
  function drawCrimeBag(g, w, h) {           // the red bag: snatched at the chai stall, he looks back at the lens
    g.fillStyle = lg(g, 0, 0, 0, h, [0, '#f2b26c'], [1, '#c9733f']); g.fillRect(0, 0, w, h);
    bokeh(g, w, h, 4011, ['#ffe6a8', '#ffd07a', '#9fd3ff', '#ff9a7a'], 30, 0.55);
    g.fillStyle = lg(g, 0, 0, 0, 120, [0, '#2b6fb3'], [1, '#1f4f82']); g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, 70); for (let i = 0; i <= 6; i++) { const x = w - i * (w / 6); g.quadraticCurveTo(x - w / 12, 150, x - w / 6, 80); } g.closePath(); g.fill();
    for (let i = 0; i < 5; i++) bulb(g, 90 + i * 190, 150 + 14 * Math.sin(i * 1.7), 0.6, 0.9);
    g.save(); g.filter = 'blur(2px)'; g.fillStyle = '#7a4a24'; g.fillRect(0, h - 150, w, 150); g.fillStyle = '#c99a5e'; g.fillRect(0, h - 160, w, 16); g.restore();
    const F = CRIME_FIG[0], o = { ...F.o };
    g.save(); g.translate(w / 2, h / 2); g.rotate(F.rot); g.translate(-w / 2, -h / 2);
    o.arms = { r: { ...armIK(o, 1, 165, 300, 46), hand: 'fist' } };
    figure(g, HIM, F.hx, F.hy, F.s, o);
    const wr = wristOf(o, 1), dir = [-Math.sin(wr.ang), Math.cos(wr.ang)];
    redBag(g, F.hx + (wr.x + dir[0] * 60) * F.s + 6, F.hy + (wr.y + dir[1] * 60) * F.s + 30 * F.s, 0.95 * F.s, -0.12);
    g.save(); g.translate(F.hx + wr.x * F.s, F.hy + wr.y * F.s); g.scale(F.s, F.s); g.rotate(wr.ang); hand(g, 'fist', THIEF, 1, 0); g.restore();
    g.restore();
    photoFinish(g, w, h, 4511);
  }
  function drawCrimeChai(g, w, h) {          // the raised chai: he toasts you from the stall
    g.fillStyle = lg(g, 0, 0, 0, h, [0, '#ffd59a'], [1, '#e48a4f']); g.fillRect(0, 0, w, h);
    bokeh(g, w, h, 4023, ['#fff1c8', '#ffc46a', '#f39a1e', '#ffffff'], 34, 0.5);
    g.strokeStyle = 'rgba(60,40,30,0.5)'; g.lineWidth = 3; for (const [y0, y1] of [[90, 150], [40, 120]]) { g.beginPath(); g.moveTo(0, y0); g.quadraticCurveTo(w / 2, y1 + 60, w, y0); g.stroke(); }
    const BUNT = ['#e2301a', '#f7c52b', '#2fa5d6', '#4fb06a', '#b94fd0'];
    for (let i = 0; i < 12; i++) { const x = 30 + i * 76, y = 90 + 120 * (1 - Math.pow((x - w / 2) / (w / 2), 2)) * 0.5; g.fillStyle = BUNT[i % 5]; g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x + 22, y); g.lineTo(x, y + 44); g.closePath(); g.fill(); }
    const F = CRIME_FIG[1], o = { ...F.o };
    o.arms = { l: { ...armIK(o, -1, -240, 60, 60), hand: 'glass' } };
    figure(g, HIM, F.hx, F.hy, F.s, o);
    photoFinish(g, w, h, 4523);
  }
  function drawCrimeCrowd(g, w, h) {         // the cricket crowd: bareheaded behind the police line, sipping chai
    g.fillStyle = lg(g, 0, 0, 0, h, [0, '#f6c98e'], [1, '#d99566']); g.fillRect(0, 0, w, h);
    const r = mulberry32(4031), HEADS = ['#15100c', '#1d1510', '#2a1d14'], SHIRTS = ['#5ab8ff', '#f4f0e6', '#8e6fd1', '#ef7fa8', '#f4dc5a', '#6f7d92', '#e8712a'];
    g.save(); g.filter = 'blur(3px)';
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
      const x = i * 110 + (row % 2) * 55 + (r() - 0.5) * 30, y = 150 + row * 70 + (r() - 0.5) * 20, s = 0.55 + row * 0.12;
      g.fillStyle = SHIRTS[(r() * SHIRTS.length) | 0]; ell(g, x, y + 120 * s, 90 * s, 70 * s); g.fill();
      g.fillStyle = '#c08a64'; ell(g, x, y, 38 * s, 46 * s); g.fill();
      g.fillStyle = r() < 0.3 ? '#8e2433' : HEADS[(r() * 3) | 0]; ell(g, x, y - 26 * s, 40 * s, 26 * s); g.fill();
    }
    g.restore();
    const F = CRIME_FIG[2], o = { ...F.o };
    o.arms = { l: { ...armIK(o, -1, -160, 320, 60), hand: 'glass' } };
    figure(g, HIMB, F.hx, F.hy, F.s, o);
    g.fillStyle = '#e8c33a'; g.save(); g.translate(0, h - 150); g.rotate(-0.04); g.fillRect(-20, 0, w + 40, 30); g.fillStyle = '#1b1b1b'; for (let x = -20; x < w + 40; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x + 20, 30); g.lineTo(x - 20, 30); g.closePath(); g.fill(); } g.restore();
    g.save(); g.filter = 'blur(5px)'; g.fillStyle = '#b8a06a'; ell(g, 60, h - 40, 170, 190); g.fill(); g.fillStyle = '#2c3a6a'; ell(g, 30, h - 250, 110, 50); g.fill(); g.restore();
    photoFinish(g, w, h, 4531);
  }
  const CRIMES = [
    { key: 'bag', draw: drawCrimeBag, label: 'THE RED BAG' },
    { key: 'chai', draw: drawCrimeChai, label: 'THE CHAI' },
    { key: 'crowd', draw: drawCrimeCrowd, label: 'THE CRICKET MATCH' },
  ];

  // a print on the desk: white border, a soft shadow away from the lamp, a gloss; its image, and words in marker on the border
  function print(g, img, x, y, w, h, rot, o = {}) {
    const bs = o.border ?? 16, bb = o.bottom ?? 60, W2 = w + bs * 2, H2 = h + bs + bb;
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = `rgba(10,6,2,${0.35 * (o.sh ?? 1)})`; g.save(); g.filter = 'blur(10px)'; g.fillRect(-W2 / 2 + 10 + (o.lift || 0) * 30, -H2 / 2 + 16 + (o.lift || 0) * 40, W2, H2); g.restore();
    g.fillStyle = '#f6f2e8'; g.fillRect(-W2 / 2, -H2 / 2, W2, H2);
    g.drawImage(img, -W2 / 2 + bs, -H2 / 2 + bs, w, h);
    g.fillStyle = lg(g, -W2 / 2, -H2 / 2, W2 / 2, H2 / 2, [0, 'rgba(255,255,255,0.10)'], [0.45, 'rgba(255,255,255,0)'], [0.55, 'rgba(255,255,255,0.06)'], [1, 'rgba(255,255,255,0)']); g.fillRect(-W2 / 2 + bs, -H2 / 2 + bs, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 2; g.strokeRect(-W2 / 2, -H2 / 2, W2, H2);
    if (o.label) txt(g, o.label, o.labelX ?? 0, H2 / 2 - bb * 0.24, o.labelSize ?? bb * 0.78, o.labelCol || '#1c2a5e', { align: 'center', kind: 'cond', rot: o.labelRot ?? -0.03, a: o.labelA ?? 1 });
    if (o.after) o.after(g, -W2 / 2 + bs, -H2 / 2 + bs, w, h);
    g.restore();
  }
  const mugImg = (i) => picture('mug' + i, MUG_W, MUG_H, (g, w, h) => drawMug(g, w, h, FOUR[i].L));
  const crimeImg = (i) => picture('crime' + i, CR_W, CR_H, (g, w, h) => CRIMES[i].draw(g, w, h));

  // where head() puts the mole for a figure() at (hx, hy, s) in pose o (no walk): the rings and the marker circles land on it
  function moleAt(L, o, hx, hy, s) {
    const phi = clamp(o.yaw || 0, -0.95, 0.95), sp = Math.sin(phi), yw = clamp((o.headYaw || 0) + phi * 0.6, -1.15, 1.15);
    const Rf = 186 * L.jaw * 1.04, mx = Rf * Math.sin(Math.asin(clamp(L.mole[0] / Rf, -0.99, 0.99)) + yw);
    const tl = o.tilt || 0, c = Math.cos(tl), sn = Math.sin(tl), bx = 150 * sp * 0.42 + (o.headX || 0), by = o.headBob ?? 0;
    return [hx + (bx + mx * c - L.mole[1] * sn) * s, hy + (by + mx * sn + L.mole[1] * c) * s];
  }
  // a marker on paper: a hand-drawn loop (not quite closed) that draws itself
  function markerLoop(g, x, y, rx, ry, k, col, lw = 9, seed = 1) {
    if (k <= 0) return;
    const r = mulberry32(seed), wob = [r(), r(), r()], N = 40, a0 = -2.2 + r() * 0.6, span = TAU * 1.12 * clamp(k);
    g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha *= 0.92; g.beginPath();
    for (let i = 0; i <= N; i++) { const a = a0 + span * i / N, w = 1 + 0.06 * Math.sin(a * 2 + wob[0] * 6) + 0.04 * Math.sin(a * 3 + wob[1] * 6), px = x + Math.cos(a) * rx * w, py = y + Math.sin(a) * ry * w; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke(); g.restore();
  }
  function crimeMole(i) {                              // where each crime's mole sits in its canvas (the same sums as its drawing)
    const F = CRIME_FIG[i], m = moleAt(F.L, F.o, F.hx, F.hy, F.s), cx = CR_W / 2, cy = CR_H / 2, dx = m[0] - cx, dy = m[1] - cy, a = F.rot;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
  }

  // ------------------------------------------------------------------ the desk at night (top-down): dark wood, the lamp's pool, her chai, a notebook
  const DESK_AX = 495, DESK_AY = 965;              // the screen point the camera's target lands on (the grid's centre on frame 0)
  const PW = 398, PH = 458;                        // a mugshot print's image in desk units (border 16 round, 60 below for the number)
  const GRID = [[-226, -278], [226, -278], [-226, 278], [226, 278]];   // the four prints' centres: 1 2 / 3 4
  const TILT0 = [-0.04, 0.03, 0.022, -0.034], TILT1 = [-0.012, 0.01, 0.006, -0.01];
  const CW = 560, CH = 423;                        // a crime print's image in desk units (900 × 680 canvas)
  const LAND = [[-10, -60, -0.05], [30, 10, 0.055], [-20, 70, -0.03]];  // where each crime lands, and its turn
  const GRAIN = (() => { const r = mulberry32(4101), out = []; for (let i = 0; i < 70; i++) out.push([r() * 6, (r() - 0.5) * 6400, 0.3 + r() * 0.7, r()]); return out; })();
  function deskWood(g) {
    g.fillStyle = '#4b301e'; g.fillRect(-3000, -3400, 6000, 9000);
    for (const [ph, y, k, p] of GRAIN) for (const oy of [0, 3200]) { g.strokeStyle = p < 0.5 ? `rgba(255,214,170,${0.04 + 0.05 * k})` : `rgba(18,9,3,${0.08 + 0.08 * k})`; g.lineWidth = 5 + 14 * k; g.beginPath(); g.moveTo(-3000, y + oy); g.bezierCurveTo(-1000, y + oy + 70 * Math.sin(ph), 1000, y + oy - 60 * Math.cos(ph * 1.3), 3000, y + oy + 40 * Math.sin(ph * 2)); g.stroke(); }
  }
  function deskLight(g, t, cx = 160, cy = -320) {
    const fl = 1 + 0.02 * Math.sin(t * 13.1) * Math.sin(t * 4.7);
    g.fillStyle = rg(g, cx, cy, 120, 2200, [0, `rgba(255,212,150,${0.34 * fl})`], [0.45, 'rgba(255,170,100,0.10)'], [1, 'rgba(0,0,0,0)']); g.fillRect(cx - 3000, cy - 3400, 6000, 6800);
    g.fillStyle = rg(g, cx, cy, 900, 2500, [0, 'rgba(0,0,0,0)'], [1, 'rgba(5,3,1,0.7)']); g.fillRect(cx - 3000, cy - 3400, 6000, 6800);
  }
  function deskProps(g, t) {
    // the lamp, from above: its shade, the bulb's glow under the rim, the cable off the desk
    const lx = 600, ly = -980;
    g.strokeStyle = '#141414'; g.lineWidth = 16; g.beginPath(); g.moveTo(lx + 60, ly - 50); g.quadraticCurveTo(lx + 420, ly - 320, lx + 600, ly - 1000); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.4)'; ell(g, lx + 24, ly + 40, 250, 250); g.fill();
    g.fillStyle = lg(g, lx - 200, ly - 220, lx + 220, ly + 200, [0, '#2f5a46'], [1, '#173226']); ell(g, lx, ly, 230, 230); g.fill();
    g.strokeStyle = 'rgba(255,230,180,0.55)'; g.lineWidth = 10; g.beginPath(); g.arc(lx, ly, 222, 0.6, 2.6); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.12)'; ell(g, lx - 60, ly - 70, 90, 50, -0.5); g.fill();
    // her chai: a glass from above, half drunk, steam
    const cx = -560, cy = -800;
    g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, cx + 20, cy + 26, 108, 108); g.fill();
    g.fillStyle = 'rgba(240,235,225,0.35)'; ell(g, cx, cy, 104, 104); g.fill();
    g.fillStyle = lg(g, cx - 80, cy - 80, cx + 80, cy + 80, [0, '#c98340'], [1, '#7d4317']); ell(g, cx, cy, 82, 82); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 6; ell(g, cx, cy, 102, 102); g.stroke();
    g.fillStyle = 'rgba(255,240,215,0.4)'; ell(g, cx - 30, cy - 34, 26, 12, -0.6); g.fill();
    steam(g, cx, cy - 40, t, 1.1, 0.35);
    // a notebook and a pen
    g.save(); g.translate(640, 900); g.rotate(0.12);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-250, -320, 520, 680); g.fillStyle = '#7d2a26'; g.fillRect(-270, -340, 520, 680); g.fillStyle = '#efe6d2'; g.fillRect(-240, -340, 470, 660);
    g.strokeStyle = 'rgba(40,60,120,0.25)'; g.lineWidth = 3; for (let y = -280; y < 300; y += 42) { g.beginPath(); g.moveTo(-230, y); g.lineTo(220, y); g.stroke(); }
    g.fillStyle = '#1d2a5e'; g.save(); g.translate(-40, 120); g.rotate(-0.7); R(g, -14, -260, 28, 520, 12); g.fill(); g.fillStyle = '#c9c9cc'; R(g, -14, -260, 28, 70, 10); g.fill(); g.restore();
    g.restore();
  }
  // her forearm from off the desk to the wrist: a sleeve that narrows to a cuff, its shadow on the desk, the hand along it
  function herArm(g, sx, sy, wx, wy, kind, k, s = 1.4) {
    const dx = wx - sx, dy = wy - sy, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, ang = Math.atan2(-dx, dy);
    const quad = (ox, oy, w0, w1) => { g.beginPath(); g.moveTo(sx + nx * w0 + ox, sy + ny * w0 + oy); g.lineTo(wx + nx * w1 + ox, wy + ny * w1 + oy); g.lineTo(wx - nx * w1 + ox, wy - ny * w1 + oy); g.lineTo(sx - nx * w0 + ox, sy - ny * w0 + oy); g.closePath(); };
    g.save();
    g.save(); g.filter = 'blur(12px)'; quad(36, 48, 110, 78); g.fillStyle = 'rgba(0,0,0,0.38)'; g.fill(); g.restore();
    quad(0, 0, 105, 74); g.fillStyle = lg(g, sx + nx * 100, sy + ny * 100, sx - nx * 100, sy - ny * 100, [0, '#3d5285'], [1, '#22304f']); g.fill();
    g.strokeStyle = 'rgba(255,225,180,0.22)'; g.lineWidth = 10; g.beginPath(); g.moveTo(sx + nx * 92, sy + ny * 92); g.lineTo(wx + nx * 64, wy + ny * 64); g.stroke();
    g.translate(wx, wy); g.rotate(ang);
    g.fillStyle = '#2c3d66'; R(g, -84, -66, 168, 74, 22); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; R(g, -80, -64, 160, 12, 6); g.fill();
    g.save(); g.filter = 'blur(6px)'; g.translate(22, 30); g.scale(s, s); g.globalAlpha = 0.35; hand(g, kind, { ...DET.L, skin: '#000', skinH: '#000', skinD: '#000' }, k, 0); g.restore();
    g.scale(s, s); hand(g, kind, DET.L, k, 0);
    g.restore();
  }

  // the desk's camera: the point on the desk at the screen's anchor, the zoom, the turn
  const DESK_KEYS = () => [[0, 0, 0, 1.0, 0], [T.l1e, 0, 0, 1.02, 0], [T.sq0 - 0.1, 0, -30, 0.99, 0], [T.sq0 + 1.1, 0, -150, 0.84, 0.0], [T.c1 - 0.5, 0, -170, 0.83, 0]];
  const CZ = 1.62;                                    // how close the camera comes to each crime
  function deskCam(t) {
    if (t < T.c1 - 0.18) { const [x, y, s, r] = key(t, DESK_KEYS()); return { x, y, s, r }; }
    if (t < T.sweep) {                                  // a whip onto each crime as it lands
      const i = t < T.c2 - 0.18 ? 0 : t < T.c3 - 0.18 ? 1 : 2, t0 = [T.c1, T.c2, T.c3][i] - 0.18, L = LAND[i];
      const prev = i === 0 ? { x: 0, y: -170, s: 0.83, r: 0 } : { x: LAND[i - 1][0], y: LAND[i - 1][1], s: CZ + 0.03, r: -LAND[i - 1][2] * 0.5 };
      const u = sstep(t0, t0 + 0.22, t), z = CZ + 0.03 * (t - t0);
      return { x: lerp(prev.x, L[0], u), y: lerp(prev.y, L[1], u), s: lerp(prev.s, z, u), r: lerp(prev.r, -L[2] * 0.5, u) };
    }
    const u = sstep(T.sweep + 0.05, T.sweep + 0.55, t), L = LAND[2];
    const push = t > T.ring0 ? 0.04 * sstep(T.ring0, T.ring1, t) : 0;
    return { x: lerp(L[0], 0, u), y: lerp(L[1], 0, u), s: lerp(CZ + 0.03, 1.0, u) + push, r: lerp(-L[2] * 0.5, 0, u) };
  }
  // her hands through the scene: squaring the four up, dealing his crimes, sweeping them off, a finger drumming during the pick
  function deskHands(g, t) {
    const sqIn = winK(t, T.sq0, T.sq0 + 0.45, T.sq1 - 0.2, T.sq1 + 0.3);
    if (sqIn > 0.001) {
      const tap = 18 * (kick(t, T.sq0 + 0.55, 1, 22, 9) + kick(t, T.sq0 + 1.0, 1, 22, 9));
      herArm(g, -900, -1900, lerp(-900, -540 + tap, sqIn), lerp(-1900, -230, sqIn), 'open', -1);
      herArm(g, 900, -1900, lerp(900, 540 - tap, sqIn), lerp(-1900, -230, sqIn), 'open', 1);
    }
    for (let i = 0; i < 3; i++) {
      // her fingers on the print's top edge as it comes down, never over his face; gone a beat after it lands
      const tl = [T.c1, T.c2, T.c3][i], a = sstep(tl - 0.4, tl, t), b = 1 - sstep(tl + 0.02, tl + 0.26, t);
      const k = Math.min(a, b); if (k <= 0.001 || t > T.sweep) continue;
      const L = LAND[i]; herArm(g, -500, -2300, lerp(-300, L[0] - 200, k), lerp(-2200, L[1] - 300, k), 'open', -1);
    }
    const sw = winK(t, T.sweep - 0.2, T.sweep + 0.05, T.sweep + 0.45, T.sweep + 0.7);
    if (sw > 0.001) { const u = sstep(T.sweep + 0.02, T.sweep + 0.45, t); herArm(g, 900, -2100, lerp(lerp(900, 640, sw), -1300, u), lerp(-2000, -60, sw), 'open', 1); }
    const dr = winK(t, T.ring0 - 0.3, T.ring0 + 0.3, T.ring1 - 0.3, T.ring1 + 0.2);
    if (dr > 0.001) { const f = Math.max(0, Math.sin((t - T.ring0) * TAU * 2.2)); herArm(g, 700, -1900, lerp(800, 560, dr), lerp(-1900, -720 - 16 * f, dr), 'point', 1, 1.3); }
  }
  function crimePose(i, t) {                           // a crime print: where it is on the desk, its turn, how high it is off the desk
    const tl = [T.c1, T.c2, T.c3][i], L = LAND[i];
    if (t < tl - 0.42) return null;
    const u = sstep(tl - 0.42, tl, t), bounce = kick(t, tl, 0.025, 30, 14);
    let x = lerp(-300, L[0], u), y = lerp(-2100, L[1], u), r = lerp(0.3, L[2], u) + bounce, lift = 1 - u;
    if (t > T.sweep) { const v = sstep(T.sweep + 0.02, T.sweep + 0.45, t); x -= 2600 * v * (1 - i * 0.08); y += 300 * v; r -= 0.2 * v; }
    return { x, y, r, lift };
  }
  function shotDesk(g, t) {
    const c = deskCam(t);
    g.save(); g.translate(DESK_AX, DESK_AY); g.rotate(c.r); g.scale(c.s, c.s); g.translate(-c.x, -c.y);
    deskWood(g); deskProps(g, t);
    const sq = sstep(T.sq0 + 0.5, T.sq0 + 1.2, t);
    for (let i = 0; i < 4; i++) {
      const [gx, gy] = GRID[i], rot = lerp(TILT0[i], TILT1[i], sq) - (t > T.ring0 ? TILT1[i] * sstep(T.ring0, T.ring0 + 0.4, t) : 0);
      print(g, mugImg(i), gx + (1 - sq) * (i % 2 ? 14 : -14), gy, PW, PH, rot, { label: String(FOUR[i].n), labelSize: 52 });
    }
    for (let i = 0; i < 3; i++) { const p = crimePose(i, t); if (p) print(g, crimeImg(i), p.x, p.y, CW, CH, p.r, { label: CRIMES[i].label, labelSize: 40, bottom: 56, lift: p.lift, sh: 1 + p.lift }); }
    deskHands(g, t);
    deskLight(g, t);
    g.restore();
    if (t < T.l1e + 0.25) title(g, 'WHICH ONE IS HIM?', 358, 112, YEL, t, -1, { a: 1 - sstep(T.l1e, T.l1e + 0.25, t), sw: 0.13 });
    if (t > T.l4 && t < T.l4e + 0.3) title(g, 'ON EVERY SCREEN IN THE CITY', 358, 76, CREAM, t, T.l4 + 0.9, { a: 1 - sstep(T.l4e, T.l4e + 0.3, t) });
    if (t > T.l5 && t < T.l6) title(g, 'WHICH ONE?', 358, 108, YEL, t, T.l5 + 0.1, { a: 1 });
    if (t >= T.l6) title(g, 'BE SURE.', 358, 108, CREAM, t, T.l6, { a: 1 });
    // the ring: it runs out at the grid's centre (a 3-2-1 beside numbered men reads as an answer: the checklist, 38)
    if (t > T.ring0 - 0.2) {
      const a = sstep(T.ring0 - 0.2, T.ring0 + 0.1, t), k = 1 - clamp((t - T.ring0) / (T.ring1 - T.ring0)), x = DESK_AX, y = DESK_AY;
      g.save(); g.globalAlpha = a;
      g.fillStyle = 'rgba(12,10,8,0.78)'; ell(g, x, y, 74, 74); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 13; ell(g, x, y, 54, 54); g.stroke();
      if (k > 0) { g.strokeStyle = k < 0.25 ? RED : '#fff6e2'; g.lineWidth = 13; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, 54, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke(); }
      g.restore();
    }
    return t > T.flash ? flashAt(t, T.flash, 7) : 0;
  }

  // ------------------------------------------------------------------ the city at dusk: screens come on, one after another (never their faces)
  const BLD = (() => {
    const r = mulberry32(4201), out = [];
    for (let layer = 0; layer < 3; layer++) { let x = -260; while (x < W + 260) { const w = 110 + r() * 190, h = [520, 760, 980][layer] + r() * [300, 420, 520][layer]; out.push({ layer, x, w, h, seed: (r() * 1e6) | 0 }); x += w + 6 + r() * 30; } }
    return out;
  })();
  const SCREENS = [{ x: 110, y: 610, w: 270, h: 160, sk: 0.35, t: 0.35 }, { x: 600, y: 470, w: 320, h: 190, sk: -0.42, t: 0.75 }, { x: 820, y: 880, w: 200, h: 120, sk: -0.3, t: 1.05 }];
  function screenFace(g, x, y, w, h, sk) {             // what a big screen shows from down here: a glare, a dark head-and-shoulders, a red band
    const q = (u, v) => [x + u * w, y + v * h + u * w * sk * 0.3];
    const poly4 = (a, b, c, d) => { g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...d); g.closePath(); };
    poly4(q(-0.04, -0.06), q(1.04, -0.06), q(1.04, 1.06), q(-0.04, 1.06)); g.fillStyle = '#0d0f17'; g.fill();
    poly4(q(0, 0), q(1, 0), q(1, 1), q(0, 1)); g.fillStyle = lg(g, x, y, x + w, y + h, [0, '#f4f8ff'], [0.6, '#cfe2ff'], [1, '#a9c8ff']); g.fill();
    g.save(); poly4(q(0, 0), q(1, 0), q(1, 1), q(0, 1)); g.clip(); g.filter = 'blur(3px)';
    const c = q(0.5, 0.55); g.fillStyle = 'rgba(40,50,80,0.55)'; ell(g, c[0], c[1] - h * 0.08, w * 0.11, h * 0.22); g.fill(); ell(g, c[0], c[1] + h * 0.42, w * 0.28, h * 0.3); g.fill();
    g.restore();
    poly4(q(0, 0.8), q(1, 0.8), q(1, 1), q(0, 1)); g.fillStyle = '#e2301a'; g.fill();
  }
  function shotCity(g, t) {
    const d = t - T.city0, pan = -40 * d, HZY = 1420;
    g.fillStyle = lg(g, 0, 0, 0, HZY, [0, '#141a3e'], [0.55, '#4b3373'], [0.85, '#c06a6a'], [1, '#f2a46a']); g.fillRect(0, 0, W, H);
    const rs = mulberry32(4210); g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 40; i++) { ell(g, rs() * W, rs() * 700, 1.6, 1.6); g.fill(); }
    for (const b of BLD) {
      const par = [0.3, 0.6, 1][b.layer], x = b.x + pan * par, top = HZY + 260 - b.h, col = ['#3b2f5c', '#2a2347', '#171428'][b.layer];
      g.fillStyle = col; g.fillRect(x, top, b.w, H - top);
      const r = mulberry32(b.seed);
      for (let wy = top + 30; wy < H - 40; wy += 54) for (let wx = x + 16; wx < x + b.w - 26; wx += 40) {
        const on = r(), tOn = 0.2 + on * 1.8;
        if (on < 0.55 && d > tOn) { g.fillStyle = on < 0.2 ? 'rgba(160,200,255,0.75)' : 'rgba(255,210,140,0.8)'; g.fillRect(wx, wy, 18, 26); }
      }
    }
    for (const s of SCREENS) {
      const on = d - s.t; if (on < 0) continue;
      const fl = on < 0.25 ? (Math.sin(on * 90) > 0 ? 1 : 0.3) : 1, x = s.x + pan;
      g.save(); g.globalAlpha = fl;
      g.fillStyle = rg(g, x + s.w / 2, s.y + s.h / 2, 10, s.w * 1.5, [0, 'rgba(170,210,255,0.38)'], [1, 'rgba(170,210,255,0)']); g.fillRect(x - s.w, s.y - s.h * 1.6, s.w * 3, s.h * 4.2);
      screenFace(g, x, s.y, s.w, s.h, s.sk);
      g.restore();
    }
    const rp = mulberry32(4230);
    for (let i = 0; i < 16; i++) {
      const x = -40 + i * 76 + rp() * 30, y = 1640 + rp() * 60, on = d - (1.1 + rp() * 0.6);
      g.fillStyle = '#0c0b16'; ell(g, x, y, 40, 48); g.fill(); g.fillRect(x - 62, y + 36, 124, 400);
      if (on > 0) { g.fillStyle = rg(g, x + 20, y - 40, 2, 70, [0, 'rgba(180,215,255,0.5)'], [1, 'rgba(180,215,255,0)']); g.fillRect(x - 60, y - 120, 160, 160); g.fillStyle = '#dcebff'; R(g, x + 6, y - 66, 26, 44, 5); g.fill(); }
    }
    return t < T.city0 + 0.35 ? flashAt(t, T.flash, 7) : 0;
  }

  // ------------------------------------------------------------------ people: night versions of the cast, and the town's faces
  const NIGHT = '#141a2e';
  const nightL = (L, k) => { const o = { ...L }; for (const f of ['skin', 'skinD', 'skinH', 'hair', 'mHair']) if (o[f]) o[f] = mix(o[f], NIGHT, k); if (o.capLook) o.capLook = { ...o.capLook, a: mix(o.capLook.a, NIGHT, k), b: mix(o.capLook.b, NIGHT, k), brim: mix(o.capLook.brim, NIGHT, k) }; return o; };
  const nightD = (D, k) => { const o = { ...D }; for (const f of ['a', 'b', 'collar', 'leg', 'shoe', 'cuff', 'dupatta', 'sweater']) if (typeof o[f] === 'string' && o[f][0] === '#') o[f] = mix(o[f], NIGHT, k); return o; };
  const nightP = (P, k) => ({ L: nightL(P.L, k), D: nightD(P.D, k) });
  const who = (L, D) => ({ L: { jaw: 1, chinK: 1, ew: 43, eh: 23, brow: 14, browTilt: 4, hair: '#15100c', style: 'short', ...L }, D: { sleeve: 'short', leg: '#2f3442', shoe: '#1d1a17', ...D } });
  const SK = [['#c9926a', '#a06a46', '#e0ad86'], ['#a8714d', '#80522f', '#c08a64'], ['#b57d58', '#8c5a3a', '#cc9a74'], ['#8f5e40', '#6c4428', '#a8744f'], ['#d1a07c', '#a97a58', '#e6bb98']];
  const sk = (i) => ({ skin: SK[i][0], skinD: SK[i][1], skinH: SK[i][2] });
  function phoneUp(g, x, y, s, k = 1) {               // a phone held up, its back to you, its light on the face behind it
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = `rgba(190,220,255,${0.35 * k})`; g.filter = 'blur(14px)'; ell(g, 0, -40, 120, 110); g.fill(); g.filter = 'none';
    g.fillStyle = '#16181f'; R(g, -48, -92, 96, 184, 16); g.fill(); g.fillStyle = '#2b2f3a'; ell(g, -22, -66, 12, 12); g.fill();
    g.restore();
  }

  // ------------------------------------------------------------------ the crowd under a screen (the screen is behind you: its light on their faces)
  // [x, head y, scale, person, what they do]: staggered in depth, turned to him, some filming
  const CROWD = [
    [140, 700, 0.24, who({ ...sk(0), style: 'part', must: 'mid' }, { a: '#5ab8ff', b: '#3a8fd0' }), {}],
    [420, 690, 0.23, who({ ...sk(3), style: 'long', jaw: 0.9, ew: 45, eh: 25, brow: 11 }, { a: '#ef7fa8', b: '#cf5b86', kameez: true, dupatta: '#f4dc5a' }), {}],
    [690, 700, 0.24, who({ ...sk(1), style: 'crew', must: 'thick', stub: 0.3 }, { a: '#f4f0e6', b: '#d4cdbd' }), { phone: true }],
    [930, 720, 0.25, who({ ...sk(2), style: 'spiky' }, { a: '#e8712a', b: '#c85a1a' }), {}],
    [60, 830, 0.3, who({ ...sk(4), hair: '#9a948c', mHair: '#d8d2c8', style: 'short', must: 'thick', brow: 19 }, { a: '#8e6fd1', b: '#6c4fae', sleeve: 'long' }), {}],
    [300, 860, 0.31, who({ ...sk(2), style: 'pony', jaw: 0.9, ew: 46, eh: 25, brow: 11, browTilt: -2 }, { a: '#4fb06a', b: '#36904f', kameez: true, dupatta: '#f2f0e6' }), { mother: true }],
    [800, 850, 0.31, who({ ...sk(1), style: 'quiff', stub: 0.4 }, { a: '#f4dc5a', b: '#d8bc3a' }), { phone: true }],
    [1010, 880, 0.33, who({ ...sk(0), style: 'bun', jaw: 0.92, ew: 45, eh: 25, brow: 11, bindi: true }, { a: '#c2453a', b: '#a0352c', kameez: true, dupatta: '#2fa5d6' }), {}],
  ];
  const BOY = who({ ...sk(2), style: 'short', jaw: 0.86, chinK: 0.84, ew: 50, eh: 29, brow: 11, browTilt: -2 }, { a: '#2fa5d6', b: '#1f7fae' });
  function streetBack(g, t) {
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#070912'], [0.55, '#141426'], [1, '#221b2c']); g.fillRect(0, 0, W, H);
    // shutters and one lit shop, a street lamp, the lights far down the road
    for (let i = 0; i < 6; i++) { const x = -60 + i * 200; g.fillStyle = i === 3 ? '#3a2a1c' : '#1b1d26'; g.fillRect(x, 300, 190, 420); if (i !== 3) { g.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = 320; y < 700; y += 28) g.fillRect(x + 8, y, 174, 6); } }
    g.fillStyle = rg(g, 640, 520, 20, 320, [0, 'rgba(255,190,110,0.55)'], [1, 'rgba(255,170,90,0)']); g.fillRect(320, 200, 640, 640);
    g.fillStyle = '#f2c46a'; g.fillRect(600, 330, 180, 40); txt(g, 'GENERAL STORE', 690, 362, 30, '#3a2410', { align: 'center' });
    bokeh(g, W, 700, 4301, ['rgba(255,200,120,0.9)', 'rgba(255,120,90,0.8)', 'rgba(140,200,255,0.8)'], 24, 0.4);
    g.strokeStyle = '#0a0a10'; g.lineWidth = 14; g.beginPath(); g.moveTo(980, 1300); g.lineTo(980, 240); g.quadraticCurveTo(980, 200, 920, 200); g.stroke();
    g.fillStyle = rg(g, 910, 215, 4, 160, [0, 'rgba(255,220,150,0.8)'], [1, 'rgba(255,220,150,0)']); g.fillRect(750, 60, 320, 320);
  }
  function shotCrowd(g, t) {
    streetBack(g, t);
    const seeK = sstep(T.see, T.see + 0.5, t);
    const wz = sstep(T.walk0 - 0.1, T.walk0 + 0.6, t), cam = 1 + 0.05 * sstep(T.crowd0, T.walk0, t) + 0.08 * wz, cyy = lerp(960, 920, wz);
    g.save(); g.translate(540, 960); g.scale(cam, cam); g.translate(-540, -cyy);
    for (let i = 0; i < CROWD.length; i++) {
      const [x, y, s, P, does] = CROWD[i], lx = (540 - x) * 0.025, look = [lerp(lx * 0.2, lx, seeK), lerp(-6, 8, seeK)];
      const o = { legs: true, yaw: (540 - x) / 2600 * seeK, look, browUp: 5 * (1 - seeK), frown: 0.18 * seeK, worry: 3 * seeK, rim: 1, close: blinkAt(t, i, 3.1 + i * 0.3) };
      const film = does.phone ? sstep(T.film + i * 0.06, T.film + 0.3 + i * 0.06, t) : 0;
      if (does.phone && film > 0) o.arms = { r: { ...armIK(o, 1, lerp(220, 60, film), lerp(700, 40, film), 60), hand: 'grip' } };
      if (does.mother) { const pull = sstep(T.pull, T.pull + 0.35, t); o.arms = { l: { a1: lerp(0.1, 0.5, pull), a2: lerp(0.2, 1.0, pull), hand: 'open' } }; }
      figure(g, nightP(P, 0.36), x, y, s, o);
      if (does.phone && film > 0.05) { const wr = wristOf(o, 1); phoneUp(g, x + (wr.x + 10) * s, y + (wr.y + 70) * s, s * 1.3, film); }
      if (does.mother) {                               // her boy, in front of her: he points at the man, and she pulls him back
        const pull = sstep(T.pull, T.pull + 0.35, t), pt = sstep(T.point, T.point + 0.2, t) * (1 - 0.7 * pull);
        const ob = { legs: true, look: [lerp(0, 9, seeK), lerp(-8, 6, seeK)], op: 0.18 * pt, rim: 1, yaw: 0.2 * seeK };
        ob.arms = { r: { a1: lerp(0.08, 1.75, pt), a2: lerp(0.1, -0.15, pt), hand: pt > 0.5 ? 'point' : 'relax' } };
        figure(g, nightP(BOY, 0.34), x - 120 + 60 * pull, y + 200, 0.23, ob);
      }
    }
    // the screen's cold light on everything that faces you
    g.fillStyle = rg(g, 540, -300, 300, 1700, [0, 'rgba(165,200,255,0.26)'], [1, 'rgba(165,200,255,0)']); g.fillRect(0, 0, W, H);
    // the man in the cap: right in front of you, his back to you. They know the face; he pulls the brim down, pushes in among them and keeps
    // going, deeper, through the gap in the front row (x 430-670), so he's never on top of anyone in front of him
    {
      const aw = sstep(T.away, T.walk0, t), deep = clamp((t - T.walk0) / 1.6), cd = sstep(T.capDown, T.capDown + 0.3, t) * (1 - sstep(T.away + 0.1, T.away + 0.4, t));
      const x = 540 + 70 * aw - 60 * deep, y = lerp(1230, 960, aw) - 80 * deep, s = lerp(0.6, 0.33, aw) - 0.05 * deep;
      const o = { legs: true, back: true, walk: aw > 0.05 ? 0.8 : 0, phase: (t - T.away) * 8, tilt: -0.08 * cd, rim: 1 };
      o.arms = { r: { a1: lerp(0.06, 2.5, cd), a2: lerp(0.1, 1.6, cd), hand: 'grip' } };
      figure(g, nightP({ L: { ...THIEF, mole: null }, D: { a: '#6f7d92', b: '#525e72', sleeve: 'short', leg: '#2f3442', shoe: '#1d1a17' } }, 0.55), x, y, s, o);
    }
    // the real one, once the man in the cap is in among them: across the front, big, his back to you, bald, the chai level. Nobody turns
    if (t > T.walk0) {
      const u = clamp((t - T.walk0) / (T.stall0 - T.walk0)), x = lerp(-130, 1190, u), y = lerp(1135, 1110, u), ph = (t - T.walk0) * 7.5;
      const o = { legs: true, back: true, walk: 0.9, phase: ph, yaw: 0.55, glassK: 0.55, rim: 1 };
      o.arms = { r: { ...armIK(o, 1, 250, 620, 60), hand: 'glass' } };
      figure(g, nightP(HIMB, 0.14), x, y, 0.5, o);
    }
    g.restore();
    g.fillStyle = rg(g, 540, 900, 450, 1300, [0, 'rgba(0,0,0,0)'], [1, 'rgba(3,3,8,0.6)']); g.fillRect(0, 0, W, H);
    return 0;
  }

  // ------------------------------------------------------------------ the chai stall at night: the bench runs back to the stall; the TV above him
  const TVP = [800, 300];                              // the TV's centre (world = the screen at zoom 1): high on the tarp's corner pole
  const OLDM = who({ ...sk(4), hair: '#a8a29a', mHair: '#e2ddd4', style: 'short', must: 'thick', brow: 20, browTilt: 10, jaw: 1.04, stub: 0.2 }, { a: '#7a5a3a', b: '#5e432a', sleeve: 'long', sweater: '#8a6a48' });
  const YOUTH = who({ ...sk(1), style: 'spiky', jaw: 0.94, ew: 46, eh: 25, phones: '#e9e9ec' }, { a: '#f4dc5a', b: '#d8bc3a' });
  // the bench: [person, x, head y, scale, yaw]: the old man and the boy with headphones at the back, the detective, then him, under the TV
  const BENCH = [[OLDM, 150, 735, 0.25, 0.45], [YOUTH, 330, 790, 0.3, 0.4], [DET, 525, 870, 0.4, 0.38], [HIMB, 770, 960, 0.5, -0.1]];
  function stallBack(g, t) {
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#05060d'], [1, '#161220']); g.fillRect(0, 0, W, H);
    bokeh(g, W, 900, 4401, ['rgba(255,200,120,0.9)', 'rgba(140,200,255,0.7)', 'rgba(255,140,100,0.7)'], 22, 0.35);
    // the stall, back left: its lit inside, shelves, the counter, the kettle on its flame
    g.save(); g.beginPath(); g.moveTo(-20, 430); g.lineTo(640, 470); g.lineTo(640, 1100); g.lineTo(-20, 1140); g.closePath(); g.clip();
    g.fillStyle = lg(g, 0, 430, 0, 1100, [0, '#4a2c16'], [1, '#2a180c']); g.fillRect(-20, 400, 680, 760);
    g.fillStyle = rg(g, 300, 640, 40, 520, [0, 'rgba(255,196,120,0.55)'], [1, 'rgba(255,170,90,0)']); g.fillRect(-20, 400, 680, 760);
    for (const sy of [560, 690]) { g.fillStyle = '#5a3a20'; g.fillRect(-20, sy + 50, 680, 12); for (let i = 0; i < 6; i++) { const x = 30 + i * 100; g.fillStyle = 'rgba(255,240,220,0.18)'; R(g, x, sy - 10, 56, 62, 10); g.fill(); g.fillStyle = mix(GOODS2[i % GOODS2.length], '#3a2410', 0.45); R(g, x + 6, sy + 12, 44, 36, 7); g.fill(); g.fillStyle = 'rgba(220,210,190,0.5)'; R(g, x + 3, sy - 16, 50, 12, 5); g.fill(); } }
    g.restore();
    const kx = 470, ky = 830;
    g.fillStyle = '#ff8a2a'; ell(g, kx, ky + 96, 62, 12); g.fill(); g.fillStyle = 'rgba(80,140,255,0.85)'; ell(g, kx, ky + 91, 44, 7); g.fill();
    g.save(); g.translate(kx, ky + 54); g.scale(0.48, 0.48); g.fillStyle = '#8f949b'; R(g, -110, -280, 220, 280, 40); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; R(g, -90, -260, 30, 220, 14); g.fill(); g.strokeStyle = '#6a6e74'; g.lineWidth = 18; g.beginPath(); g.arc(110, -190, 60, -1.2, 1.2); g.stroke(); g.restore();
    steam(g, kx, ky - 90, t, 0.85, 0.55);
    g.fillStyle = lg(g, 0, 900, 0, 1000, [0, '#c99a5e'], [1, '#8a5a30']); g.beginPath(); g.moveTo(-20, 930); g.lineTo(600, 950); g.lineTo(600, 975); g.lineTo(-20, 960); g.closePath(); g.fill();
    for (const x of [90, 170, 250, 330]) glass(g, x, 915, 0.32, 0.6);
    g.save(); g.translate(190, 420); g.rotate(-0.03); g.fillStyle = '#23302a'; R(g, -80, -30, 170, 60, 7); g.fill(); txt(g, 'CHAI 10/-', 5, 16, 40, '#f4efe0', { align: 'center' }); g.restore();
    // the lane beyond, to the right: a shuttered shop, a far street lamp
    g.fillStyle = '#12131c'; g.fillRect(640, 480, 460, 560); g.fillStyle = 'rgba(255,255,255,0.035)'; for (let y = 500; y < 1020; y += 26) g.fillRect(660, y, 420, 6);
    // the bench: a plank running back to the stall
    g.fillStyle = '#3b2616'; g.beginPath(); g.moveTo(40, 1020); g.lineTo(1100, 1450); g.lineTo(1100, 1520); g.lineTo(40, 1050); g.closePath(); g.fill();
  }
  const GOODS2 = ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#b94fd0', '#4fb06a'];
  // the long low table in front of the bench, running back to the stall: it hides their laps; glasses on it, and his cap
  const tableY = (x) => 945 + (x - 150) * 0.67;       // its near edge, on screen at zoom 1
  function stallFront(g, t) {
    const x0 = -40, x1 = 1140;
    g.fillStyle = 'rgba(4,3,8,0.94)'; g.beginPath(); g.moveTo(x0, tableY(x0) + 36); g.lineTo(x1, tableY(x1) + 36); g.lineTo(x1, 2000); g.lineTo(x0, 2000); g.closePath(); g.fill();
    for (const lx of [60, 560, 1060]) { g.fillStyle = '#24170d'; g.fillRect(lx, tableY(lx) + 30, 26, 700); }
    g.fillStyle = lg(g, 0, tableY(150) - 60, 0, tableY(900), [0, '#8a5a34'], [1, '#6a4224']); g.beginPath(); g.moveTo(x0, tableY(x0) - 62); g.lineTo(x1, tableY(x1) - 62); g.lineTo(x1, tableY(x1)); g.lineTo(x0, tableY(x0)); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,214,160,0.22)'; g.beginPath(); g.moveTo(x0, tableY(x0) - 62); g.lineTo(x1, tableY(x1) - 62); g.lineTo(x1, tableY(x1) - 56); g.lineTo(x0, tableY(x0) - 56); g.closePath(); g.fill();
    g.fillStyle = '#3a2414'; g.beginPath(); g.moveTo(x0, tableY(x0)); g.lineTo(x1, tableY(x1)); g.lineTo(x1, tableY(x1) + 36); g.lineTo(x0, tableY(x0) + 36); g.closePath(); g.fill();
    for (const [x, f, s] of [[250, 0.5, 0.3], [430, 0.2, 0.34], [640, 0.6, 0.4]]) glass(g, x, tableY(x) - 40, s, f);
    g.save(); g.translate(930, tableY(930) - 30); g.rotate(0.5); g.scale(0.36, 0.36); capShape(g, 190, 0, 1, 0, CAPM); g.restore();
  }
  function tvAndTarp(g, t, glow) {
    // the tarp over the bench, its scallops and bulbs (reel 36's chai stall), the corner pole the TV hangs from
    g.fillStyle = lg(g, 0, 0, 0, 230, [0, '#1d4a7a'], [1, '#163a62']); g.beginPath(); g.moveTo(-40, 0); g.lineTo(W + 40, 0); g.lineTo(W + 40, 150);
    for (let i = 0; i <= 8; i++) { const xx = W + 40 - i * 145; g.quadraticCurveTo(xx - 72, 240, xx - 145, 160); } g.lineTo(-40, 0); g.closePath(); g.fill();
    for (let i = 0; i < 8; i++) { const bx = 50 + i * 140, by = 228 + 16 * Math.sin(i * 1.1 + 0.3 * Math.sin(t * 1.2 + i)); g.strokeStyle = 'rgba(30,25,20,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx, 180); g.lineTo(bx, by - 12); g.stroke(); bulb(g, bx, by, 0.48, 0.9 + 0.1 * Math.sin(t * 2.3 + i)); }
    g.fillStyle = '#17120e'; g.fillRect(1010, 0, 30, 1600);
    // the TV: seen from behind and below; its screen faces the bench, its light falls on their faces
    const [x, y] = TVP;
    g.strokeStyle = '#111'; g.lineWidth = 10; g.beginPath(); g.moveTo(x + 130, y - 30); g.lineTo(1020, y - 50); g.stroke();
    g.fillStyle = `rgba(160,205,255,${0.75 * glow})`; g.beginPath(); g.moveTo(x - 175, y - 92); g.lineTo(x + 120, y - 120); g.lineTo(x + 140, y + 92); g.lineTo(x - 160, y + 118); g.closePath(); g.fill();
    g.fillStyle = '#262a33'; g.beginPath(); g.moveTo(x - 160, y - 84); g.lineTo(x + 112, y - 108); g.lineTo(x + 128, y + 84); g.lineTo(x - 148, y + 106); g.closePath(); g.fill();
    g.fillStyle = '#30353f'; g.beginPath(); g.moveTo(x - 90, y - 50); g.lineTo(x + 60, y - 62); g.lineTo(x + 70, y + 46); g.lineTo(x - 82, y + 60); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 5; for (let i = 0; i < 5; i++) { const xx = x - 60 + i * 28; g.beginPath(); g.moveTo(xx, y - 40 - i * 2); g.lineTo(xx + 6, y + 36 - i * 2); g.stroke(); }
  }
  // the bench's people at time t: everyone looks up at the TV; her sideways glance; him: up at the TV, behind his glass, at you, the tap, the toast
  function benchPose(i, t) {
    const [P, x, y, s, yaw] = BENCH[i];
    const o = { legs: false, rim: 1, yaw, look: [clamp((TVP[0] - x) * 0.04, -12, 12), -7], browUp: 7, tilt: -0.04, close: blinkAt(t, i, 3.3 + i * 0.4), glassK: 0.5 };
    o.arms = { l: { ...armIK(o, -1, -140, 360, 60), hand: 'glass' }, r: { a1: 0.1, a2: 0.15, hand: 'relax' } };
    if (P === DET) {
      const gl = winK(t, T.glance, T.glance + 0.25, T.back - 0.1, T.back + 0.2);
      o.headYaw = 0.5 * gl; o.look = [lerp(o.look[0], 15, gl), lerp(-7, 2, gl)]; o.frown = 0.25 * gl; o.browUp = lerp(7, 2, gl); o.glassK = 0.6;
      o.arms.l = { ...armIK(o, -1, -130, 330, 60), hand: 'glass' };
    }
    if (P === HIMB) {
      const hide = winK(t, T.hide, T.hide + 0.25, T.back, T.back + 0.3), turn = sstep(T.turn - 0.2, T.turn + 0.2, t), fin = sstep(T.raise, T.raise + 0.4, t);
      o.look = [lerp(lerp(3, 0, turn), 1, fin), lerp(-8, 1, turn)]; o.browUp = lerp(7, 12, turn); o.smirk = 0.6 * turn; o.smile = 0.2 * turn + 0.3 * fin; o.glassK = 0.55; o.tilt = lerp(-0.04, 0.02, turn);
      const gy = lerp(lerp(330, 140, hide), 70, fin), gx = lerp(lerp(-140, -95, hide), -235, fin);
      o.arms.l = { ...armIK(o, -1, gx, gy, 60), hand: 'glass' };
      const up = winK(t, T.tap1 - 0.34, T.tap1 - 0.08, T.tap2 + 0.18, T.tap2 + 0.44);
      if (up > 0.001) {
        const tp = Math.max(kick(t, T.tap1, 1, 26, 12), 0) + Math.max(kick(t, T.tap2, 1, 26, 12), 0);
        o.arms.r = { ...armIK(o, 1, lerp(260, 112 + 10 * (1 - Math.min(1, tp)), up), lerp(560, 78, up), 170, 'down'), hand: 'point' }; o.handFront = 1;
      }
    }
    return o;
  }
  function stallCam(t) {                               // the zoom: wide, then in on him for the tap, then a medium shot for the toast
    if (t >= T.fin0) { const u = sstep(T.fin0, T.fin0 + 0.6, t); return { cx: lerp(700, 690, u), cy: lerp(930, 900, u), z: lerp(1.3, 1.55, u) + 0.03 * (t - T.fin0) }; }
    const u = sstep(T.push0, T.turn + 0.15, t);
    return { cx: lerp(560, 775, u), cy: lerp(930, 965, u), z: lerp(1.0 + 0.012 * (t - T.stall0), 2.25, u) };
  }
  function shotStall(g, t) {
    const c = stallCam(t), glow = 0.85 + 0.15 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    g.save(); g.translate(540, 960); g.scale(c.z, c.z); g.translate(-c.cx, -c.cy);
    stallBack(g, t);
    for (let i = 0; i < BENCH.length; i++) { const [P, x, y, s] = BENCH[i]; figure(g, nightP(P, 0.12), x, y, s, benchPose(i, t)); }
    g.save(); g.globalCompositeOperation = 'screen';
    g.fillStyle = rg(g, TVP[0] - 120, TVP[1] + 220, 40, 760, [0, `rgba(70,110,190,${0.42 * glow})`], [1, 'rgba(70,110,190,0)']); g.fillRect(0, 0, W, H);
    g.restore();
    stallFront(g, t);
    tvAndTarp(g, t, glow);
    g.restore();
    g.fillStyle = rg(g, 540, 1000, 420, 1250, [0, 'rgba(0,0,0,0)'], [1, 'rgba(3,3,8,0.5)']); g.fillRect(0, 0, W, H);
    if (t > T.tv && t < T.l10) title(g, '"HAVE YOU SEEN THIS MAN?"', 520, 66, CREAM, t, T.tv + 0.05, { a: 1 - sstep(T.l10 - 0.3, T.l10, t) });
    if (t > T.dk - 0.05) title(g, 'DID YOU KNOW IT?', 358, 104, YEL, t, T.dk, { a: 1 });
    if (t > T.og - 0.05) title(g, 'OR DID YOU GUESS?', 476, 84, CREAM, t, T.og, { a: 1 });
    return 0;
  }

  // ------------------------------------------------------------------ the payoff on the desk: it was in every photo; then the four, marked
  // three hard cuts down the column, one crime print at a time, big (about 80 % of the width), its ring landing on the same cheek; then a cut
  // to the four, marked. The neighbours peek in at the frame's edges, so it reads as one column on the desk.
  const COL = [[0, -520, -0.02], [0, 0, 0.015], [0, 520, -0.01]];
  function shotPay(g, t) {
    const seg = (T.four0 - T.pay0) / 3, four = t >= T.four0, i0 = Math.max(0, Math.min(2, Math.floor((t - T.pay0) / seg))), ts = T.pay0 + i0 * seg;
    const cx = four ? 0 : COL[i0][0], cy = four ? 1800 : COL[i0][1] - 15, s = four ? lerp(1.05, 1.0, sstep(T.four0, T.four0 + 0.45, t)) : 1.42 + 0.06 * (t - ts);
    g.save(); g.translate(DESK_AX, DESK_AY); g.scale(s, s); g.translate(-cx, -cy);
    deskWood(g);
    for (let i = 0; i < 3; i++) {
      const [x, y, r] = COL[i], k = four || i < i0 ? 1 : i > i0 ? 0 : sstep(ts + 0.1, ts + 0.42, t);
      print(g, crimeImg(i), x, y, CW, CH, r, { label: CRIMES[i].label, labelSize: 40, bottom: 56, after: (gg, ix, iy, iw, ih) => { const m = crimeMole(i); markerLoop(gg, ix + m[0] * iw / CR_W, iy + m[1] * ih / CR_H, 34, 30, k, YEL, 9, 11 + i); } });
    }
    for (let i = 0; i < 4; i++) {
      const [gx, gy] = GRID[i], f = FOUR[i], t0 = T.four0 + 0.35 + [0.45, 0, 0.95, 0.8][i];
      const k = sstep(t0, t0 + 0.35, t);
      print(g, mugImg(i), gx, gy + 1800, PW, PH, TILT1[i] * 0.5, { label: String(f.n), labelSize: 52, after: (gg, ix, iy, iw, ih) => {
        const sc = iw / MUG_W, m = moleAt(f.L, { yaw: 0 }, MUG_W / 2, MUG_H * MUG_HY, MUG_S), mx = ix + m[0] * sc, my = iy + m[1] * sc;
        if (f.him) { markerLoop(gg, mx, my, 30, 27, k, YEL, 9, 41); txt(gg, 'HIM', ix + iw / 2, iy + ih - 24, 72, YEL, { align: 'center', stroke: INK, sw: 0.12, a: k }); return; }
        if (f.bad.includes('mole')) markerLoop(gg, mx, my, 30, 27, k, RED, 9, 31 + i);
        if (f.bad.includes('cap')) markerLoop(gg, ix + iw / 2, iy + (MUG_H * MUG_HY - 245 * MUG_S) * sc + 30, 150, 64, k, RED, 9, 51 + i);
        if (f.bad.includes('brim')) markerLoop(gg, ix + iw / 2, iy + (MUG_H * MUG_HY - 116 * MUG_S) * sc, 178, 32, sstep(t0 + 0.2, t0 + 0.55, t), RED, 8, 61);
        txt(gg, f.bad.includes('cap') ? 'RED CAP' : 'WRONG CHEEK', ix + iw / 2, iy + ih - 24, 60, RED, { align: 'center', stroke: '#fff6e2', sw: 0.14, a: k, rot: -0.03 });
      } });
    }
    deskLight(g, t, 0, cy - 200);
    g.restore();
    return 0;
  }

  // ================================================================ the film
  function frame(g, t) {
    if (t < T.city0) return shotDesk(g, t);
    if (t < T.crowd0) return shotCity(g, t);
    if (t < T.stall0) return shotCrowd(g, t);
    if (t < T.pay0) return shotStall(g, t);
    if (t < T.fin0) return shotPay(g, t);
    return shotStall(g, t);
  }
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
      g.save();
      const fl = frame(g, t) || 0;
      if (fl > 0.002) { g.fillStyle = `rgba(255,253,244,${fl})`; g.fillRect(0, 0, W, H); }
      g.restore();
    },
  });

  scene({
    name: 'fx', from: 'hook', to: 'end',
    build(root, S) {
      const cv = el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:0.05` }, root);
      S.g = cv.getContext('2d'); S.tiles = K.grainTiles();
    },
    run(t, b, S) {
      const f = Math.round(t * 30), r = mulberry32(1000 + f), g = S.g;
      K.clear(g);
      g.save();
      const pat = g.createPattern(S.tiles[f % 4], 'repeat'), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
      g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256);
      g.restore();
    },
  });

  window.UI.endcard();
  C.start();
})();
