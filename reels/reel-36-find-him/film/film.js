// Reel 36 · Find Him (take 2). Tests desk, "You're the test subject", built round Season 1's thief: the man with the mole and the maroon
// cap. You get one look at him at the chai stall before he snatches a red bag and runs, his own glass of chai held level the whole way. You
// chase him through the lanes into a tennis-ball cricket crowd; he kicks over a cap-seller's cart and a hundred maroon caps rain down. A
// constable lines up five caps. Find him. He's been standing right behind them the whole time, bareheaded, sipping his chai: in the cap
// rain, while every hand went up, his came down. The man you picked goes to jail, for a cap he caught a minute ago. He takes his cap back
// off the cart's pile, tips it to you, and walks into the sea of caps. Facts: docs/research.md. The script: docs/script.md.
// The face rig and the bodies are reels 20–34's (three-quarter heads, walking bodies), the lane is reel 34's; new here: a 3D camera that
// yaws, pitches and rolls (the gully, the steps, the jeep, the crane), a crowd of 120 that catches caps, the cap rain, the chase sets.
// Our own drawings; nobody real. 30 fps. Every frame is a pure function of t, sealed in save()/restore().
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
    const ears = [];
    for (const k of [-1, 1]) { const th = k * Math.PI / 2 + yw, cz = Math.cos(th); if (cz < -0.25) continue; ears.push([k, hw * Math.sin(th), cz]); }
    const ek = L.earK || 1, ear = (k, x, cz) => { const w = 25 * ek * (0.55 + 0.45 * clamp(1 - Math.abs(cz) * 1.6)); ell(g, x + k * 1 * ek, -18, w, 42 * ek, k * 0.08); g.fillStyle = L.skin; g.fill(); ell(g, x + k * 3 * (w / 25), -16, w * 0.48, 24, k * 0.08); g.fillStyle = L.skinD; g.fill(); };
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
    g.strokeStyle = L.mHair || L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt + (o.worry || 0);
    for (const k of [-1, 1]) {
      const [x, wf, c] = at(k * ex); if (c < 0.12) continue;
      const bu = k === 1 ? -(o.browUp || 0) : 0;
      g.save(); g.translate(x, 0); g.scale(wf, 1);
      g.beginPath(); g.moveTo(-k * 48, ey - 40 + tilt + by0 + bu); g.quadraticCurveTo(k * 6, ey - 60 + by0 + bu, k * 54, ey - 40 - tilt * 0.3 + by0 * 0.4 + bu); g.stroke();
      g.restore();
    }
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
      capShape(g, hh, sy * hw * 0.42, 0.55 + 0.45 * cw, cap.sq || 0);
      g.restore();
    }
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
    if (!long) { g.fillStyle = cloth(62); caps(g, -14, L1 * 0.52, 62, 56); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-56, L1 * 0.52 + 30); g.lineTo(56, L1 * 0.52 + 30); g.stroke(); }
    g.translate(0, L1); g.rotate(k * p.a2);
    g.fillStyle = long ? cloth(48) : skin(44); caps(g, -6, L2, 46, 38); g.fill();
    if (long) { g.fillStyle = D.cuff || D.a; caps(g, L2 - 46, L2 - 6, 44, 42); g.fill(); }
    g.translate(0, L2);
    if (!(o.handFront === k)) hand(g, p.hand || 'relax', L, k, -k * p.a1 + k * p.a2 + (o.lean || 0), o);
    g.restore();
  }
  function torso(g, P, phi, back) {
    const D = P.D, by = 168, sp = Math.sin(phi), cp = Math.cos(phi);
    const ks = Math.sqrt((cp) ** 2 + (0.52 * sp) ** 2), cx = 150 * sp, hem = by + (D.kameez ? 1180 : 900);
    const shape = () => { g.beginPath(); g.moveTo(-262 * ks, hem); g.lineTo(-292 * ks, by + 250); g.bezierCurveTo(-300 * ks, by + 170, -210 * ks, by + 124, -96 * ks + cx * 0.3, by + 92); g.lineTo(96 * ks + cx * 0.3, by + 92); g.bezierCurveTo(210 * ks, by + 124, 300 * ks, by + 170, 292 * ks, by + 250); g.lineTo(262 * ks, hem); g.closePath(); };
    shape(); g.fillStyle = lg(g, -300, by, 300, by + 800, [0, D.a], [1, D.b]); g.fill();
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
      if (D.dupatta) { g.fillStyle = D.dupatta; g.beginPath(); g.moveTo(-300, by + 170); g.quadraticCurveTo(-120, by + 330, 0, by + 300); g.quadraticCurveTo(140, by + 270, 300, by + 150); g.lineTo(300, by + 240); g.quadraticCurveTo(140, by + 380, 0, by + 400); g.quadraticCurveTo(-130, by + 420, -300, by + 270); g.closePath(); g.fill(); }
    }
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
    else { g.save(); g.globalAlpha *= 1 - fm; headBack(g, L, o); g.restore(); g.save(); g.globalAlpha *= fm; face(); g.restore(); }
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
      const a = P3(side * (LW - 40), 3650, z, cz), b = P3(side * (LW - 700), 3100, z, cz); if (!a || !b) continue;
      const hz = clamp((z - cz - 2400) / 11000) * 0.6, x0 = Math.min(a[0], b[0]), w = Math.abs(b[0] - a[0]), h = b[1] - a[1];
      R(g, x0, a[1], w, h, 4 * a[2]); g.fillStyle = mix(bgc, HAZE, hz); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = Math.max(1, 4 * a[2]); g.stroke();
      txt(g, s, x0 + w / 2, a[1] + h * 0.74, h * 0.66, mix(fg, HAZE, hz), { align: 'center', fit: w * 0.86 });
    }
    strings(g, cz, tw);
  }
  function redBag(g, x, y, s, rot) {                // reel 20's red bag
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, -150, -40, 150, 220, [0, '#e0313a'], [1, '#8d0f1a']); R(g, -150, -20, 300, 230, 40); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.22)'; R(g, -120, 6, 240, 16, 8); g.fill();
    g.fillStyle = '#c9a96a'; R(g, -26, 40, 52, 40, 8); g.fill();
    g.strokeStyle = 'rgba(60,0,8,0.4)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-150, 60); g.lineTo(150, 60); g.stroke();
    g.restore();
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
  const M1 = { ...SKIN, hair: '#17110d', style: 'curls', capped: true, stub: 0.15, brow: 17, browTilt: 2, jaw: 1.1, chinK: 0.9, ew: 46, eh: 25 };
  const M2 = { ...SKIN, hair: '#15100c', style: 'part', capped: true, must: 'thick', stub: 0.1, brow: 13, browTilt: 6, jaw: 0.9, chinK: 1.08, ew: 41, eh: 21 };
  const M3 = { ...SKIN, hair: '#120d0a', style: 'short', capped: true, must: 'mid', stub: 0.2, brow: 23, browTilt: 11, jaw: 0.95, chinK: 1.2, ew: 42, eh: 21, noseW: 1.2 };
  const M4 = { ...SKIN, hair: '#17110d', style: 'crew', capped: true, must: 'thin', stub: 0.75, brow: 15, browTilt: 5, jaw: 1.0, ew: 44, eh: 23, earK: 1.32 };
  const M5 = { ...SKIN, hair: '#1a130e', style: 'spiky', capped: true, must: 'pencil', stub: 0, brow: 12, browTilt: 3, jaw: 0.92, chinK: 1.02, ew: 47, eh: 27 };
  const TEE = (a, b) => ({ a, b, sleeve: 'short', leg: '#2f3442', shoe: '#1d1a17' });
  const FIVE = [{ L: M1, D: TEE('#5ab8ff', '#3a8fd0') }, { L: M2, D: TEE('#f4f0e6', '#d4cdbd') }, { L: M3, D: TEE('#8e6fd1', '#6c4fae') }, { L: M4, D: TEE('#6f7d92', '#525e72') }, { L: M5, D: TEE('#ef7fa8', '#cf5b86') }];
  const COP = { L: { skin: '#a8714d', skinD: '#80522f', skinH: '#c08a64', hair: '#120d0a', style: 'short', must: 'thick', brow: 18, browTilt: 4, jaw: 1.06, ew: 42, eh: 21, beret: true },
    D: { a: '#b8a06a', b: '#94804e', collar: '#a28c58', sleeve: 'short', buttons: 'rgba(60,40,20,0.5)', leg: '#9c8656', shoe: '#2a1d14' } };
  const WOMAN = { L: { skin: '#b57d58', skinD: '#8c5a3a', skinH: '#cc9a74', hair: '#1a1410', style: 'long', jaw: 0.92, ew: 44, eh: 24, brow: 11, browTilt: -2, braid: true }, D: { a: '#4f7fe0', b: '#2f58b0', sleeve: 'short', kameez: true, dupatta: '#ffd84a', leg: '#f3e6d8', shoe: '#8a3a2a' } };
  const BOY = { L: { skin: '#b9845c', skinD: '#90603c', skinH: '#d2a07a', hair: '#15100c', style: 'short', jaw: 0.9, chinK: 0.86, ew: 50, eh: 29, brow: 11, browTilt: -2 }, D: { a: '#f4dc5a', b: '#d8bc3a', sleeve: 'short', leg: '#3a5a9a', shoe: '#e8e6e0' } };

  // ------------------------------------------------------------------ timing (the motion test's estimates; the placed voice replaces them)
  const T = {
    l1: 0.05, l1e: 3.0, l2: 3.3, l2e: 4.5,      // "You get one look at this man before he runs." "So learn his face."
    bag: 3.65, eyes: 4.5, snatch: 5.0, barge: 5.22, wv: 5.3,   // her bag on the bench; his eyes go to it; the snatch; "My bag!"
    chase0: 5.6, look0: 5.95, look1: 6.45, sari: 6.6, map0: 6.9,
    l3: 7.0, l3e: 7.8,                          // "Don't lose him!"
    dive: 7.9, lane2: 8.25, vault: 8.5, youVault: 8.86, gully0: 9.5, kick: 9.95,
    l4: 10.8, l4e: 13.5,                        // "And now a hundred men are wearing his cap."
    whistle: 13.8, line0: 13.8,
    l5: 14.3, l5e: 16.0, l6: 16.3, l6e: 16.85,  // "Whoever you pick goes to jail." "Find him."
    find1: 20.2,
    l7: 20.3, l7e: 22.1,                        // "Did you even look behind them?"
    l8: 23.2, l8e: 25.6,                        // "He's been standing right there the whole time."
    rew0: 26.2, rew1: 27.4,
    l9: 27.5, l9e: 31.0, rep1: 31.8,            // "When every hand went up for a cap, he took his off."
    l10: 32.0, l10e: 35.2,                      // "With a stranger, your brain goes by the hair and the cap."
    jeep0: 35.4, l11: 35.6, l11e: 39.6,         // "And the man you picked goes to jail, for a cap he caught a minute ago."
    end0: 41.0, l12: 43.0, l12e: 45.3,          // "So did you learn his face, or his cap?"
    capOn: 43.0, crane: 45.0, end: 48.0,
  };

  // ------------------------------------------------------------------ the 3D camera: yaw, pitch (> 0 looks down), roll; f, and where the optical axis lands
  const cam0 = (o = {}) => ({ x: 0, y: 1450, z: 0, yaw: 0, pitch: 0, roll: 0, f: 1000, cx: 540, cy: 690, ...o });
  function camSpace(c, X, Y, Z) {
    const dx = X - c.x, dy = Y - c.y, dz = Z - c.z, cyw = Math.cos(c.yaw), syw = Math.sin(c.yaw);
    const x1 = dx * cyw - dz * syw, z1 = dx * syw + dz * cyw, cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    return [x1, dy * cp + z1 * sp, -dy * sp + z1 * cp];
  }
  function PJ(c, X, Y, Z, near = 40) { const q = camSpace(c, X, Y, Z); if (q[2] < near) return null; const s = c.f / q[2]; return [c.cx + q[0] * s, c.cy - q[1] * s, s, q[2]]; }
  function cpoly(g, c, pts, fill) {                   // a world polygon, clipped at the near plane
    const N = 40, cs = pts.map((p) => camSpace(c, p[0], p[1], p[2])), out = [];
    for (let i = 0; i < cs.length; i++) { const a = cs[i], b = cs[(i + 1) % cs.length], ia = a[2] >= N, ib = b[2] >= N; if (ia) out.push(a); if (ia !== ib) { const u = (N - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u), N]); } }
    if (out.length < 3) return false;
    g.beginPath(); out.forEach((p, i) => { const s = c.f / p[2], x = c.cx + p[0] * s, y = c.cy - p[1] * s; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    return true;
  }
  const horizonY = (c) => c.cy - c.f * Math.tan(c.pitch);
  function withRoll(g, c, fn) { g.save(); if (c.roll) { g.translate(540, 960); g.rotate(c.roll); g.translate(-540, -960); } fn(); g.restore(); }
  function skyFor(g, c) {
    if (!SKY) makeSky();
    const hy = horizonY(c);
    g.fillStyle = '#e9814f'; g.fillRect(-900, -900, W + 1800, H + 1800);
    g.drawImage(SKY, -400 - c.yaw * 380, hy - 1500 + 40);
    if (hy + 40 < H + 900) { g.fillStyle = '#fde7c2'; g.fillRect(-900, hy + 40, W + 1800, H + 900 - hy); }
  }

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

  // ------------------------------------------------------------------ world C: the gully. A tennis-ball final, a crowd of 120, the cap-seller's cart
  // X across, Z ahead (you come in from the lane's mouth at Z ≈ −900), Y up. The match is far ahead (Z 6500–12000), the crowd between.
  const GW = 4000, GZ = 12600, CART = { X: -1050, Z: 1450 };
  const SKINS = [['#b27a54', '#8a583a', '#cf9a72'], ['#c48a5c', '#9a6640', '#d9a47a'], ['#a8714d', '#80522f', '#c08a64'], ['#bd8a64', '#946243', '#d8a983'], ['#9e6a47', '#77492d', '#ba875f'], ['#c79268', '#9f6b46', '#dcad86']];
  const SHIRTS = [['#ef7fa8', '#cf5b86'], ['#4a6fd8', '#3554b0'], ['#8e6fd1', '#6c4fae'], ['#f4dc5a', '#d8bc3a'], ['#5ab8ff', '#3a8fd0'], ['#f4f0e6', '#d8d2c4'], ['#e8413a', '#c02a24'], ['#2d4f8e', '#1f3a6a'], ['#c6c9cf', '#a2a6ae'], ['#2f9a8a', '#1f7466'], ['#d9534a', '#b23a32'], ['#6fc3d8', '#4a9fb8'], ['#b0a0e8', '#8e7ccc'], ['#ffffff', '#dcdcdc'], ['#6a5acd', '#4f42a8'], ['#e8e2d0', '#c9c2ae'], ['#3a7bd5', '#2a5fae']];
  const STYLES = ['short', 'part', 'crew', 'curls', 'spiky', 'short', 'part', 'crew'];
  function makeLook(r, kind) {
    const sk = SKINS[(r() * SKINS.length) | 0], sh = SHIRTS[(r() * SHIRTS.length) | 0];
    const L = { skin: sk[0], skinD: sk[1], skinH: sk[2], hair: r() < 0.15 ? '#2a2420' : '#15100c', jaw: 0.9 + r() * 0.2, chinK: 0.9 + r() * 0.25, ew: 40 + r() * 8, eh: 20 + r() * 6, brow: 11 + r() * 9, browTilt: -2 + r() * 10, noseW: 0.9 + r() * 0.35 };
    let D = { a: sh[0], b: sh[1], sleeve: r() < 0.3 ? 'long' : 'short', cuff: sh[0], leg: ['#2f3442', '#3f3a36', '#e8e2d6', '#4a4f5c'][(r() * 4) | 0], shoe: '#211a16' };
    if (kind === 'woman') { L.style = r() < 0.5 ? 'long' : 'bun'; L.braid = L.style === 'long'; L.jaw = 0.9; L.brow = 11; D = { ...D, sleeve: 'short', kameez: true, dupatta: ['#ffd84a', '#ff7fb0', '#f6efe2', '#9fd0ff'][(r() * 4) | 0], leg: '#f3e6d8' }; }
    else if (kind === 'old') { L.style = 'bald'; L.hair = '#e8e4dc'; L.must = 'mid'; L.mHair = '#ece8e0'; L.brow = 13; }
    else { L.style = STYLES[(r() * STYLES.length) | 0]; const m = r(); L.must = m < 0.3 ? 'thick' : m < 0.55 ? 'mid' : null; if (kind === 'kid') { L.must = null; L.jaw = 0.88; L.chinK = 0.86; L.ew = 49; L.eh = 28; } }
    return { L, D };
  }
  const CROWD = (() => {
    const r = mulberry32(3636), out = [];
    const add = (X, Z, a, kind) => {
      if (X > -1900 && X < -250 && Z > 500 && Z < 2050) return;           // the cart and the spill
      if (Math.abs(X + 150) < 650 && Z < 1950) return;                     // the way in
      const P = makeLook(r, kind);
      out.push({ X, Z, a, kind, P, ph: r() * 6, lag: r() * 0.18, look: (r() - 0.5) * 0.9, turn: r() < 0.72, catchE: null, tall: kind === 'kid' ? 0.72 : 0.94 + r() * 0.1 });
    };
    for (let row = 0; row < 8; row++) {                                    // the band between you and the match, mostly watching the match
      const Z = 2050 + row * 470;
      for (let X = -3500 + (row % 2) * 250; X <= 3500; X += 480 + r() * 160) {
        const k = r(); add(X + (r() - 0.5) * 220, Z + (r() - 0.5) * 300, Math.PI + (r() - 0.5) * 0.7 + X * 0.00012, k < 0.08 ? 'woman' : k < 0.15 ? 'kid' : k < 0.2 ? 'old' : 'man');
      }
    }
    for (const sd of [-1, 1]) for (let Z = -700; Z < 2000; Z += 430 + r() * 120) for (const X of [sd * (2300 + r() * 250), sd * (3050 + r() * 250)]) {
      const k = r(); add(X, Z + (r() - 0.5) * 120, -sd * Math.PI / 2 + (r() - 0.5) * 0.6, k < 0.12 ? 'woman' : k < 0.2 ? 'kid' : k < 0.26 ? 'old' : 'man');
    }
    return out;
  })();

  // ------------------------------------------------------------------ event time: the film slows to 0.28× while the caps hang in the sun
  const ETAB = (() => { const out = [0]; let e = 0; const dt = 1 / 600; for (let i = 1; i <= 600 * 60; i++) { const t = i * dt; const sp = t < 10.15 ? 1 : t < 10.35 ? lerp(1, 0.28, sstep(10.15, 10.35, t)) : t < 11.35 ? 0.28 : t < 11.75 ? lerp(0.28, 1, sstep(11.35, 11.75, t)) : 1; e += sp * dt; out.push(e); } return out; })();
  const evT = (t) => { if (t <= 0) return t; const i = t * 600, n = Math.floor(i); if (n + 1 >= ETAB.length) return ETAB[ETAB.length - 1] + (t - 60); return lerp(ETAB[n], ETAB[n + 1], i - n); };
  const E = { kick: 9.95, rain: 9.98, bag: 10.03, capOff: 10.12, capDown: 10.3, upright: 10.42 };

  // ------------------------------------------------------------------ the caps: a hundred, off the cart, through the air, onto heads
  const CAPS = (() => {
    const r = mulberry32(3690), out = [];
    const takers = CROWD.filter((p) => p.kind !== 'woman' && p.Z < 5400).sort((a, b) => Math.hypot(a.X - CART.X, a.Z - CART.Z) - Math.hypot(b.X - CART.X, b.Z - CART.Z));
    takers.slice(0, 100).forEach((p, i) => {
      const e0 = E.rain + r() * 0.12, land = 10.86 + r() * 0.5 + Math.hypot(p.X - CART.X, p.Z - CART.Z) * 0.00002;
      p.catchE = land;
      out.push({ p, e0, land, X0: CART.X + (r() - 0.5) * 300, Y0: 700 + r() * 300, Z0: CART.Z + (r() - 0.5) * 200, H: 2400 + r() * 2600, spin: (r() - 0.5) * 9, flip: 2 + r() * 7, ph: r() * 6 });
    });
    return out;
  })();
  // on the ground by the cart after the kick: the spilled caps (and, under them, his cap and the bag)
  const SPILL = (() => { const r = mulberry32(3707), out = []; for (let i = 0; i < 26; i++) { const a = r() * TAU, d = 120 + r() * 560; out.push({ X: CART.X - 300 + Math.cos(a) * d * 1.2, Z: CART.Z - 300 + Math.sin(a) * d * 0.7, rot: r() * TAU, k: r() }); } return out; })();
  const PILE = { X: CART.X - 220, Z: CART.Z - 560 };    // where his cap and the bag go, on the spill's thick edge

  function capSprite(g, x, y, s, rot, flip = 1, o = {}) {   // a cap on its own (head units: its centre at the origin)
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s * (Math.abs(flip) < 0.12 ? 0.12 * Math.sign(flip || 1) : flip));
    g.translate(0, 220); capShape(g, 192, o.bs || 0, 1, 0);
    g.restore();
  }

  // ------------------------------------------------------------------ the gully's houses, the far wall with its chalked stumps, the dust
  const HOUSES = (() => {
    const r = mulberry32(3721), out = [], cols = ['#f2b8a0', '#f6d58e', '#a9d8cf', '#cdbbe8', '#f4c6d4', '#bcd8f2', '#f0e0c0', '#e9a98f'];
    for (const sd of [-1, 1]) { let z = -2600, i = 0; while (z < GZ) { const w = 1300 + r() * 1400; out.push({ sd, z0: z, z1: z + w, h: 3600 + r() * 3000, col: cols[(i * 3 + (sd > 0 ? 1 : 0)) % cols.length], seed: (r() * 1e6) | 0, bal: r() < 0.6 }); z += w; i++; } }
    return out;
  })();
  const hazeK = (d) => clamp((d - 3000) / 14000) * 0.6;
  function gullyBack(g, c, tw) {
    skyFor(g, c);
    // the houses beyond the far wall
    const r0 = mulberry32(3733);
    for (let X = -5200, i = 0; X < 5200; i++) { const w = 900 + r0() * 900, h = 4200 + r0() * 2600; cpoly(g, c, [[X, 0, GZ + 900], [X + w, 0, GZ + 900], [X + w, h, GZ + 900], [X, h, GZ + 900]], mix(['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#e88aa0'][i % 6], HAZE, 0.5)); X += w; }
    // the ground
    const gp = [[-GW, 0, -2600], [GW, 0, -2600], [GW, 0, GZ], [-GW, 0, GZ]];
    if (cpoly(g, c, gp, null)) { const hy = horizonY(c); g.fillStyle = lg(g, 0, hy, 0, hy + 1400, [0, '#ead2a8'], [0.25, '#dcc199'], [1, '#b89a76']); g.fill(); }
    cpoly(g, c, [[-520, 2, 7600], [520, 2, 7600], [520, 2, GZ], [-520, 2, GZ]], 'rgba(255,240,215,0.35)');
    for (const zc of [8400, 11300]) cpoly(g, c, [[-560, 3, zc], [560, 3, zc], [560, 3, zc + 40], [-560, 3, zc + 40]], 'rgba(255,255,255,0.7)');
    // the far wall, the stumps chalked on it
    cpoly(g, c, [[-GW, 0, GZ], [GW, 0, GZ], [GW, 2600, GZ], [-GW, 2600, GZ]], mix('#e7d9bf', HAZE, 0.25));
    cpoly(g, c, [[-GW, 2500, GZ - 5], [GW, 2500, GZ - 5], [GW, 2600, GZ - 5], [-GW, 2600, GZ - 5]], mix('#c9b796', HAZE, 0.25));
    for (const X of [-150, 0, 150]) cpoly(g, c, [[X - 14, 0, GZ - 6], [X + 14, 0, GZ - 6], [X + 14, 760, GZ - 6], [X - 14, 760, GZ - 6]], 'rgba(255,255,255,0.85)');
    cpoly(g, c, [[-180, 760, GZ - 6], [180, 760, GZ - 6], [180, 790, GZ - 6], [-180, 790, GZ - 6]], 'rgba(255,255,255,0.85)');
    // the houses down both sides, far to near
    const hs = HOUSES.map((h) => ({ h, d: camSpace(c, h.sd * GW, 2000, (h.z0 + h.z1) / 2)[2] })).sort((a, b) => b.d - a.d);
    for (const { h, d } of hs) house(g, c, h, d, tw);
    // a few kites, high up
    for (let i = 0; i < 3; i++) { const p = PJ(c, -1800 + i * 1900, 9000 + 600 * Math.sin(tw * 0.6 + i), GZ + 2000); if (!p) continue; g.save(); g.translate(p[0], p[1]); g.rotate(0.2 * Math.sin(tw + i)); g.fillStyle = ['#e8413a', '#5ab8ff', '#f4dc5a'][i]; const k = 260 * p[2]; g.beginPath(); g.moveTo(0, -k); g.lineTo(k * 0.8, 0); g.lineTo(0, k); g.lineTo(-k * 0.8, 0); g.closePath(); g.fill(); g.restore(); }
  }
  function house(g, c, h, d, tw) {
    const X = h.sd * GW, hz = hazeK(d), tone = (col) => mix(h.sd > 0 ? mix(col, '#fff0d8', 0.08) : mix(col, SHADE, 0.2), HAZE, hz);
    const q = (za, zb, ya, yb, col, dx = 0) => cpoly(g, c, [[X - h.sd * dx, ya, za], [X - h.sd * dx, ya, zb], [X - h.sd * dx, yb, zb], [X - h.sd * dx, yb, za]], col);
    if (!q(h.z0, h.z1, 0, h.h, tone(h.col))) return;
    q(h.z0, h.z1, h.h - 120, h.h, tone('#ffffff'));
    q(h.z0, h.z0 + 50, 0, h.h, 'rgba(0,0,0,0.12)');
    const r = mulberry32(h.seed), len = h.z1 - h.z0, nw = Math.max(1, Math.round(len / 900));
    for (const fy of [1500, 3500, 5500]) {
      if (fy + 1300 > h.h) break;
      for (let j = 0; j < nw; j++) { const za = h.z0 + (j + 0.25) * len / nw, zb = h.z0 + (j + 0.75) * len / nw; q(za, zb, fy, fy + 1000, tone('#3a3f4a')); q(za + 30, zb - 30, fy + 40, fy + 960, r() > 0.55 ? tone('#ffd38a') : tone('#59606e')); q(za - 60, zb + 60, fy - 40, fy + 10, tone('#ffffff')); }
      if (h.bal && fy > 2000) { q(h.z0 + 100, h.z1 - 100, fy - 300, fy - 240, tone('#6b4a3a'), 300); for (let z = h.z0 + 140; z < h.z1 - 100; z += 160) q(z, z + 18, fy - 300, fy + 200, tone('#6b4a3a'), 300); q(h.z0 + 100, h.z1 - 100, fy + 180, fy + 220, tone('#6b4a3a'), 300); }
    }
    q(h.z0 + len * 0.35, h.z0 + len * 0.6, 0, 1900, tone(['#2b6fb3', '#7a3b2e', '#3a6e6a'][h.seed % 3]));
  }

  // ------------------------------------------------------------------ the crowd, as a function of event time
  function crowdPose(p, e, post) {
    const o = { breath: 6 * Math.sin(e * 1.6 + p.ph), look: [8 * Math.sin(e * 0.7 + p.ph), 3], scale: p.tall };
    let a = p.a;
    const stir = sstep(9.75 + p.lag, 10.1 + p.lag, e);
    if (p.turn) { const ta = Math.atan2(CART.X + 700 - p.X, -(900 - p.Z)); a = lerp(a, ta + p.look * 0.4, stir * (post ? 0.8 : 1)); }
    if (post) a = lerp(a, Math.atan2(-p.X * 0.3, -(-600 - p.Z)), p.turn ? 0.85 : 0.15);
    if (!post) {
      const up = sstep(E.rain + 0.02 + p.lag, E.rain + 0.14 + p.lag, e), got = p.catchE ? sstep(p.catchE, p.catchE + 0.28, e) : sstep(10.95, 11.3, e) * 0.9;
      const k = up * (1 - got) * (p.catchE ? 1 : 0.55);
      if (k > 0.001) {
        const reach = (side) => ({ a1: lerp(0.1, 2.75 - 0.25 * Math.sin(p.ph + side), k), a2: lerp(0.15, 0.22, k), hand: k > 0.5 ? 'open' : 'relax', w: 1 });
        o.arms = { l: reach(0), r: reach(1) };
        o.look = [lerp(o.look[0], 4 * Math.sin(p.ph), k), lerp(3, -15, k)]; o.op = 0.28 * k * (0.5 + 0.5 * Math.sin(p.ph * 3)); o.tilt = 0.05 * Math.sin(p.ph) * k;
      }
      o.cap = p.catchE && e >= p.catchE ? 1 : 0;
    } else o.cap = p.catchE ? 1 : 0;
    return { a, o };
  }
  // the thief in the gully: in from the lane, the kick, his hand comes down (the bag, then his cap, onto the spill), then away into the side crowd
  function thiefGully(e) {
    const A = { X: -120, Z: -520 }, B = { X: -640, Z: 980 }, Cc = { X: -2380, Z: 760 };
    let X, Z, a, o = { hands: { r: 'glass' }, glassK: 0.5, legs: true, look: [0, 2], frown: 0.1 };
    if (e < E.kick) { const u = sstep(9.42, E.kick, e); X = lerp(A.X, B.X, u); Z = lerp(A.Z, B.Z, u); a = Math.PI - 0.38; Object.assign(o, { walk: 2.3, phase: e * 10.5, lean: 0.1, cap: 1 }); }
    else if (e < 10.5) {
      X = B.X; Z = B.Z; a = lerp(Math.PI - 0.62, Math.atan2(PILE.X - B.X, -(PILE.Z - B.Z)), sstep(E.kick, 10.05, e));
      const kickK = winK(e, E.kick - 0.04, E.kick + 0.02, 9.99, 10.05);
      const bend = winK(e, 9.99, 10.05, 10.36, E.upright);
      Object.assign(o, { walk: 2.2 * kickK, phase: 1.2, lean: 0.38 * bend - 0.12 * kickK, headBob: 40 * bend });
      // his left hand (screen left from behind): the bag down onto the pile, then up to his cap, off with it, down onto the pile
      const tgts = [[-300, 520], [-420, 1010], [-420, 1010], [-180, -250], [-200, -330], [-430, 1000], [-300, 560]];
      const tms = [9.99, E.bag, E.bag + 0.04, E.capOff, E.capOff + 0.06, E.capDown, E.upright];
      let tx = tgts[0][0], ty = tgts[0][1];
      for (let i = 0; i < tms.length - 1; i++) if (e >= tms[i]) { const u = sstep(tms[i], tms[i + 1], e); tx = lerp(tgts[i][0], tgts[i + 1][0], u); ty = lerp(tgts[i][1], tgts[i + 1][1], u); }
      o.arms = { l: { ...armIK(o, -1, tx, ty, 46), hand: e < E.bag ? 'fist' : e < E.capOff ? 'open' : e < E.capDown ? 'grip' : 'open', w: 1 } };
      o.bagHand = e < E.bag;
      if (e < E.capOff + 0.02) o.cap = 1;
      else if (e < E.capDown) { o.capInHand = true; o.cap = 0; }
      else o.cap = 0;
    } else {
      const u = sstep(10.55, 12.0, e); X = lerp(B.X, Cc.X, u); Z = lerp(B.Z, Cc.Z, u);
      a = u < 0.98 ? Math.atan2(Cc.X - B.X, -(Cc.Z - B.Z)) : Math.PI / 2 + 0.2;
      Object.assign(o, { walk: u > 0 && u < 1 ? 1 : 0, phase: e * 7, cap: 0 });
      const sip = winK(e, 12.6, 12.9, 13.4, 13.7);
      o.arms = { r: { ...armIK(o, 1, lerp(260, 50, sip), lerp(420, 150, sip), 46), hand: 'glass', w: 1 } };
    }
    return { X, Z, a, o };
  }
  const BAGHANG = 120;
  // the cart: its bed, wheels and legs, the stack of caps on it; at the kick it tips over onto its left side and the stack bursts
  function cartGeom(e) {
    const tip = sstep(E.kick + 0.02, E.kick + 0.34, e), th = -1.45 * tip * (1 + 0.05 * Math.sin(tip * 9) * (1 - tip));
    const px = CART.X - 700, py = 0, c = Math.cos(th), s = Math.sin(th);
    const T3 = (x, y, z) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c, z];
    return { tip, T3 };
  }
  function cartDraw(g, cam, e, o = {}) {
    const { tip, T3 } = cartGeom(e), X0 = CART.X, Z0 = CART.Z;
    const box = (x0, x1, y0, y1, z0, z1, col, colS, colT) => {
      const V = (x, y, z) => T3(x, y, z);
      cpoly(g, cam, [V(x0, y0, z0), V(x1, y0, z0), V(x1, y1, z0), V(x0, y1, z0)], col);                // the front
      cpoly(g, cam, [V(x0, y1, z0), V(x1, y1, z0), V(x1, y1, z1), V(x0, y1, z1)], colT || col);        // the top
      cpoly(g, cam, [V(x1, y0, z0), V(x1, y0, z1), V(x1, y1, z1), V(x1, y1, z0)], colS || col);        // the right side
      cpoly(g, cam, [V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0)], colS || col);
    };
    // the wheels (discs at the near and far sides)
    for (const zw of [Z0 + 380, Z0 - 380]) { const pts = []; for (let i = 0; i < 16; i++) { const an = i / 16 * TAU; pts.push(T3(X0 + Math.cos(an) * 360, 360 + Math.sin(an) * 360, zw)); } cpoly(g, cam, pts, zw > Z0 ? '#3b2a20' : '#5a4030'); const hub = []; for (let i = 0; i < 10; i++) { const an = i / 10 * TAU; hub.push(T3(X0 + Math.cos(an) * 70, 360 + Math.sin(an) * 70, zw - 6)); } cpoly(g, cam, hub, '#b8a070'); }
    box(X0 - 760, X0 + 760, 620, 720, Z0 - 380, Z0 + 380, '#8a5a32', '#6f4526', '#b07a48');
    box(X0 - 760, X0 + 760, 720, 840, Z0 - 380, Z0 - 340, '#9a6a3a', '#7a4f2c');
    box(X0 + 760, X0 + 1500, 640, 690, Z0 - 260, Z0 - 200, '#7a4f2c');
    box(X0 + 760, X0 + 1500, 640, 690, Z0 + 200, Z0 + 260, '#7a4f2c');
    // the stack of caps, until it bursts
    if (tip < 0.25) {
      const r = mulberry32(3744);
      for (let row = 0; row < 4; row++) for (let i = 0; i < 6 - row; i++) {
        const P = T3(X0 - 520 + i * 200 + row * 100 + (r() - 0.5) * 30, 820 + row * 150, Z0 + (r() - 0.5) * 300), q = PJ(cam, ...P); if (!q) continue;
        capSprite(g, q[0], q[1], q[2] * 0.62, -0.1 + (r() - 0.5) * 0.5 + tip * 2, 1);
      }
    }
  }
  function spillDraw(g, cam, e, o = {}) {
    const k = sstep(E.kick + 0.15, E.kick + 0.45, e);
    if (k <= 0) return;
    const pts = [...SPILL].map((s) => ({ s, q: PJ(cam, s.X, 60, s.Z) })).filter((v) => v.q).sort((a, b) => a.q[2] - b.q[2]);
    g.save(); g.globalAlpha *= k;
    for (const { s, q } of pts) { g.fillStyle = 'rgba(60,30,20,0.18)'; ell(g, q[0], q[1] + 40 * q[2], 220 * q[2], 60 * q[2]); g.fill(); capSprite(g, q[0], q[1], q[2] * 0.62, s.rot * 0.3 - 0.2, s.k < 0.4 ? -0.5 : 0.75); }
    g.restore();
  }
  // his cap and the bag on the pile (from when they land until he takes them back)
  function pileDraw(g, cam, e, o = {}) {
    const q = PJ(cam, PILE.X, 120, PILE.Z); if (!q) return;
    const bagIn = e >= E.bag && !(o.bagGone), capIn = e >= E.capDown && !(o.capGone);
    if (bagIn) redBag(g, q[0] - 30 * q[2], q[1] - 40 * q[2], q[2] * 1.0, 0.3);
    for (const [dx, dy, rot, f] of [[-140, -10, -0.3, 0.7], [160, 10, 0.4, -0.6], [20, -60, 0.1, 0.8]]) capSprite(g, q[0] + dx * q[2], q[1] + dy * q[2], q[2] * 0.62, rot, f);
    if (capIn) capSprite(g, q[0] + 40 * q[2], q[1] - 120 * q[2], q[2] * 0.62, -0.15, 0.85);
  }
  // one frame of the gully at event time e, from camera c. o.post: after the rain (everyone capped, calm). o.thief: draw him (default yes)
  function gully(g, c, e, o = {}) {
    const tw = e;
    withRoll(g, c, () => {
      gullyBack(g, c, tw);
      // the far match: a batsman at the wall, a bowler, two fielders
      for (const [X, Z, a, look] of [[60, GZ - 400, 0, 0], [-80, 9300, Math.PI, 0], [-2100, 8600, 0.6, 0], [1900, 10200, -0.7, 0]]) drawPerson(g, c, { L: { ...SKIN, hair: '#15100c', style: 'short', jaw: 1, ew: 44, eh: 23, brow: 14, browTilt: 2 }, D: TEE('#f4f0e6', '#d4cdbd') }, X, 0, Z, a, { walk: 0.3, phase: tw * 3 });
      // shadows on the ground (the sun is low behind the far wall, a little to your right: shadows fall towards you and left)
      const objs = [];
      for (const p of CROWD) { const v = camSpace(c, p.X, 900, p.Z); if (v[2] < 160) continue; objs.push({ d: v[2], k: 'p', p }); }
      if (o.thief !== false && e > 9.3) { const th = o.thiefAt ? o.thiefAt : thiefGully(e); const v = camSpace(c, th.X, 900, th.Z); if (v[2] > 160) objs.push({ d: v[2], k: 't', th }); }
      { const v = camSpace(c, CART.X, 600, CART.Z); if (v[2] > 60) objs.push({ d: v[2] + 200, k: 'cart' }); }
      if (o.extra) for (const x of o.extra) { const v = camSpace(c, x.X, 900, x.Z); if (v[2] > 60) objs.push({ d: v[2], k: 'x', x }); }
      for (const cp of CAPS) {
        if (e < cp.e0 || e >= cp.land || o.post) continue;
        const u = clamp((e - cp.e0) / (cp.land - cp.e0)), tx = cp.p.X, tz = cp.p.Z, ty = 1594 * cp.p.tall + 280;
        const X = lerp(cp.X0, tx, u), Z = lerp(cp.Z0, tz, u), Y = lerp(cp.Y0, ty, u) + 4 * cp.H * u * (1 - u);
        const v = camSpace(c, X, Y, Z); if (v[2] < 80) continue; objs.push({ d: v[2], k: 'cap', cp, X, Y, Z, u });
      }
      for (const p of CROWD) { const q = PJ(c, p.X + 120, 0, p.Z + 60); if (q && q[2] > 0.03) { g.fillStyle = 'rgba(80,50,40,0.16)'; ell(g, q[0], q[1], 330 * q[2], 70 * q[2]); g.fill(); } }
      spillDraw(g, c, e);
      objs.sort((a, b) => b.d - a.d);
      for (const ob of objs) {
        if (ob.k === 'p') {
          const { a, o: po } = crowdPose(ob.p, e, o.post), tk = o.topK || 0;
          if (tk < 0.999) { g.save(); g.globalAlpha *= 1 - tk; drawPerson(g, c, ob.p.P, ob.p.X, 0, ob.p.Z, a, { ...po, scale: ob.p.tall }); g.restore(); }
          if (tk > 0.001) { g.save(); g.globalAlpha *= tk; topDraw(g, c, ob.p.X, ob.p.Z, a, ob.p.P.D.a, po.cap, ob.p.tall, ob.p.P.L.hair); g.restore(); }
        }
        else if (ob.k === 'cart') { cartDraw(g, c, e); pileDraw(g, c, e, o); }
        else if (ob.k === 't') thiefDraw(g, c, ob.th, e);
        else if (ob.k === 'x') ob.x.draw(g, c);
        else { const q = PJ(c, ob.X, ob.Y, ob.Z); if (q) capSprite(g, q[0], q[1], q[2] * 0.62, ob.cp.ph + ob.cp.spin * (e - ob.cp.e0), Math.cos(ob.cp.ph + ob.cp.flip * (e - ob.cp.e0) * (1 - ob.u * 0.8))); }
      }
      // the sun's haze, low and warm
      g.save(); g.globalCompositeOperation = 'lighter'; const hy = horizonY(c); g.fillStyle = rg(g, 760, hy - 80, 20, 1100, [0, 'rgba(255,220,160,0.16)'], [1, 'rgba(255,220,160,0)']); g.fillRect(-600, -600, W + 1200, H + 1200); g.restore();
    });
  }
  // the thief, drawn into the gully (his glass, the bag in his fist, the cap in his hand on its way to the pile)
  function thiefDraw(g, c, th, e) {
    const L = th.o.cap ? THIEF0 : THIEFB;
    const v = drawPerson(g, c, L, th.X, 0, th.Z, th.a, th.o); if (!v) return;
    const s = v.s;
    // what his left hand holds: the bag (until it's on the pile), his cap (on its way down)
    if (th.o.bagHand || th.o.capInHand) {
      const wo = { ...th.o, yaw: clamp(v.yaw * 0.9, -0.95, 0.95), back: !v.front }, w = wristOf(wo, -1), dir = [-Math.sin(w.ang), Math.cos(w.ang)];
      const fx = v.x + (w.x + dir[0] * 60) * s, fy = v.y - 1594 * s + (w.y + dir[1] * 60) * s;
      if (th.o.bagHand) redBag(g, fx, fy + BAGHANG * s, s * 0.95, 0.15 * Math.sin(e * 9));
      if (th.o.capInHand) capSprite(g, fx + 20 * s, fy + 30 * s, s, 0.4, 0.9);
    }
  }

  // ================================================================ shot 1 · the chai stall. One look at him; the snatch
  const F0 = { x: 560, y: 960, s: 1.38 };                                     // his head on frame 0
  const MOTES = (() => { const r = mulberry32(3660), out = []; for (let i = 0; i < 40; i++) out.push({ x: r() * W, y: 200 + r() * 1500, z: 0.4 + r() * 1.4, k: r() < 0.22 ? 'petal' : 'mote', rot: r() * 3, c: r() < 0.5 ? '#f39a1e' : '#f7c52b', v: 20 + r() * 50 }); return out; })();
  const BAGPT = { x: 870, y: 1452 };                                           // the bag on the bench, on screen
  function hookPose(t) {
    const d = t - T.snatch, reach = sstep(0, 0.1, d), yank = sstep(0.08, 0.22, d), turn = sstep(0.3, 0.46, d), run = sstep(0.36, 0.62, d);
    const x = F0.x + 1250 * Math.pow(run, 1.5) + 40 * reach, y = F0.y + 30 * run, s = F0.s * (1 + 0.22 * run);
    const sip = winK(t, 0.7, 1.05, 1.6, 1.95), glance = winK(t, T.eyes, T.eyes + 0.18, T.snatch - 0.05, T.snatch + 0.05);
    const o = {
      yaw: lerp(-0.12, 0.9, turn), headYaw: lerp(0.05, 0.25, turn) + 0.06 * glance, back: turn > 0.6, faceMix: 1 - sstep(0.45, 0.66, turn),
      look: [lerp(0, 17, glance) * (1 - yank) + 6 * turn, lerp(1, 7, glance) * (1 - yank) + yank], frown: 0.06 + 0.2 * reach, smirk: 0.25 * (1 - reach) * sstep(2.3, 3.0, t), smile: 0.08 * sstep(2.3, 3.0, t) * (1 - reach),
      browY: -6 * glance, close: blinkAt(t, 2, 2.9) * (1 - reach), walk: 2.0 * run, phase: d * 14, legs: false, cap: 1, rim: 1, glassK: 0.6, tilt: -0.04 * sip + 0.04 * yank,
      op: 0.04 * reach, hands: { l: 'glass' },
    };
    // his right hand (the screen's left) holds his glass: below his chin, up to his lips for a sip, down; through the run it stays level
    const gx = lerp(-170, -130, sip), gy = lerp(lerp(400, 310, sip), 330, yank);
    o.arms = { l: { ...armIK(o, -1, gx, gy, 60), hand: 'glass', w: 1 - run * 0.6 } };
    // his left hand (the screen's right): out to the bag, a fist round its handle, in to his chest
    if (d > -0.05) {
      const bx = (BAGPT.x - F0.x) / F0.s, by = (BAGPT.y - F0.y) / F0.s - 40;
      const tx = lerp(lerp(260, bx, reach), 150, yank), ty = lerp(lerp(560, by, reach), 250, yank);
      o.arms.r = { ...armIK(o, 1, tx, ty, 46), hand: reach > 0.5 ? 'fist' : 'open', w: 1 - run * 0.5 };
    }
    return { x, y, s, o, reach, yank, run, d };
  }
  function shotHook(g, t) {
    const d = t - T.snatch, tw = t, push = sstep(0, T.snatch, Math.min(t, T.snatch)), whip = sstep(T.snatch + 0.42, T.chase0, t);
    const sh = shakeAt(t, [[T.snatch + 0.1, 10], [T.barge, 26]]);
    const pan = -1100 * Math.pow(whip, 1.6) * 1;
    // the lane behind him, soft
    const bg = buf(0), gb = bg.getContext('2d');
    gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalAlpha = 1; gb.filter = 'none'; gb.globalCompositeOperation = 'source-over'; gb.clearRect(0, 0, W, H);
    gb.save(); gb.translate(sh[0] * 0.4 + pan * 0.55 + 80 * push, sh[1] * 0.4 + 150);
    CAMX = 260; world(gb, 1400, tw); light(gb, tw); CAMX = 0; gb.restore();
    g.save(); g.filter = 'blur(6px)'; g.drawImage(bg, 0, 0); g.restore();
    g.fillStyle = 'rgba(255,190,120,0.10)'; g.fillRect(0, 0, W, H);
    const z = 1 + 0.07 * push;
    g.save(); g.translate(sh[0] + pan, sh[1]); g.translate(F0.x, 900); g.scale(z, z); g.translate(-F0.x, -900);
    // the stall's tarp over you, and its bulbs
    g.fillStyle = lg(g, 0, 180, 0, 330, [0, '#2b6fb3'], [1, '#1f4f82']); g.beginPath(); g.moveTo(-300, 100); g.lineTo(1400, 100); g.lineTo(1400, 220);
    for (let i = 0; i <= 10; i++) { const x = 1400 - i * 170; g.quadraticCurveTo(x - 85, 320, x - 170, 240); } g.lineTo(-300, 100); g.closePath(); g.fill();
    for (let i = 0; i < 8; i++) { const x = 40 + i * 150, y = 290 + 26 * Math.sin(i * 1.1 + 0.4 * Math.sin(tw * 1.3 + i)); g.strokeStyle = 'rgba(30,25,20,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 230); g.lineTo(x, y - 14); g.stroke(); bulb(g, x, y, 0.55, 0.85 + 0.15 * Math.sin(tw * 2 + i)); }
    // the woman at the frame's edge: her shoulder, her dupatta, her hand setting the bag down; after the snatch, her arm out after him
    const set = sstep(T.bag, T.bag + 0.4, t), after = sstep(T.wv - 0.1, T.wv + 0.15, t);
    g.save(); g.translate(40 * after, 0);
    g.fillStyle = lg(g, 900, 980, 1200, 1700, [0, '#4f7fe0'], [1, '#2f58b0']);
    g.beginPath(); g.moveTo(1180, 900); g.bezierCurveTo(1010, 930, 960, 1040, 975, 1170); g.lineTo(950, 1900); g.lineTo(1180, 1900); g.closePath(); g.fill();
    g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(1180, 960); g.quadraticCurveTo(1010, 990, 985, 1110); g.lineTo(1000, 1220); g.quadraticCurveTo(1060, 1080, 1180, 1060); g.closePath(); g.fill();
    // her hand: down with the bag, then away; at "My bag!" it reaches after him
    const hx = lerp(lerp(1010, 960, set), 1090, sstep(T.bag + 0.5, T.bag + 0.9, t)) + 60 * after, hy = lerp(lerp(1150, 1330, set), 1250, sstep(T.bag + 0.5, T.bag + 0.9, t)) - 80 * after;
    g.save(); g.translate(hx, hy); g.rotate(lerp(0.4, 1.9, after)); hand(g, after > 0.5 ? 'open' : 'relax', WOMAN.L, 1, 0); g.restore();
    g.restore();
    // him
    const th = hookPose(t);
    figure(g, THIEF0, th.x, th.y, th.s, th.o);
    // the counter between you and him; the bag on it, then in his fist
    g.fillStyle = lg(g, 0, 1585, 0, 1920, [0, '#9a6a3c'], [1, '#6a4423']); g.fillRect(-300, 1585, 1700, 600);
    g.fillStyle = 'rgba(255,230,190,0.3)'; g.fillRect(-300, 1585, 1700, 16); g.fillStyle = 'rgba(40,20,10,0.25)'; g.fillRect(-300, 1601, 1700, 30);
    if (th.reach < 0.5) { const by = lerp(BAGPT.y - 140, BAGPT.y, set); if (set > 0) redBag(g, BAGPT.x, by, 0.62, 0.08); }
    else {
      const w = wristOf(th.o, 1), dir = [-Math.sin(w.ang), Math.cos(w.ang)];
      const fx = th.x + (w.x + dir[0] * 50) * th.s, fy = th.y + (w.y + dir[1] * 50) * th.s, k = sstep(0.5, 1, th.reach);
      redBag(g, lerp(BAGPT.x, fx + 6, k), lerp(BAGPT.y, fy + 26 * th.s, k), 0.62 * th.s / F0.s, lerp(0.08, -0.15 + 0.35 * Math.sin(th.d * 11) * th.yank, k));
      g.save(); g.translate(fx - dir[0] * 50 * th.s, fy - dir[1] * 50 * th.s); g.scale(th.s, th.s); g.rotate(w.ang); hand(g, 'fist', THIEF, 1, 0); g.restore();
    }
    g.restore();
    // your own hand and glass at the bottom left; he barges past and it turns over in the air, slow
    const kn = clamp((t - T.barge) / 0.5);
    if (t < T.barge) myGlassHand(g, 150 + 6 * Math.sin(tw * 1.4), 1640 + 4 * Math.sin(tw * 1.9), 0.62, -0.08, 0.85);
    else {
      myGlassHand(g, 150 - 260 * Math.pow(kn, 0.6), 1640 + 380 * kn, 0.62, -0.08 - 0.5 * kn, -1);
      const u = clamp((t - T.barge) / 0.75), gx = lerp(260, 620, u), gy = lerp(1560, 1760, u) - 300 * Math.sin(u * Math.PI) * 0.6;
      g.save(); g.translate(gx, gy); g.rotate(3.2 * u * u + 0.3 * u); glass(g, 0, 0, 0.6, lerp(0.85, 0.15, u)); g.restore();
      g.fillStyle = 'rgba(200,120,50,0.85)'; for (let i = 0; i < 12; i++) { const a = -2.2 + i * 0.22, rr = 40 + 330 * u * (0.6 + 0.4 * ((i * 7) % 5) / 5); ell(g, gx + Math.cos(a) * rr, gy + Math.sin(a) * rr * 0.7 + 260 * u * u, 10 - 4 * u, 7 - 2 * u); g.fill(); }
    }
    // dust and petals in the low sun, kept off his face
    for (const m of MOTES) {
      const x = m.x + (m.z - 1) * 60 * push + m.v * 0.03 * t, y = m.y + 12 * Math.sin(m.rot + tw);
      if (Math.hypot(x - F0.x, (y - 900) * 0.8) < 420) continue;
      if (m.k === 'petal') { g.save(); g.translate(x, y); g.rotate(m.rot + tw * 0.5); g.fillStyle = m.c; ell(g, 0, 0, 11 * m.z, 6 * m.z); g.fill(); g.restore(); }
      else { g.fillStyle = `rgba(255,236,190,${0.35 + 0.25 * Math.sin(m.rot)})`; ell(g, x, y, 2.2 * m.z, 2.2 * m.z); g.fill(); }
    }
    vignette(g, 0.65);
    const out = sstep(T.l2e + 0.1, T.eyes + 0.25, t);
    if (out < 1) { g.save(); g.globalAlpha = 1 - out; txt(g, 'LEARN HIS FACE', 513, 405, 136, CREAM, { align: 'center', fit: 860, stroke: INK, sw: 0.13 }); g.restore(); }
    // the whip: a streak as the camera swings after him
    if (whip > 0.02) { g.save(); g.globalAlpha = 0.5 * winK(whip, 0, 0.3, 0.7, 1); g.fillStyle = 'rgba(255,240,220,1)'; for (let i = 0; i < 9; i++) { const y = 200 + i * 190; g.fillRect(-100, y, W + 200, 6 + 30 * whip); } g.restore(); }
    return 0;
  }

  // ================================================================ shot 2 · the chase down the lane, in POV. The look back. The saris.
  const SARIS = [[-1500, -820, '#d0307a', 1700], [-760, -60, '#3b5fd0', 1550], [-120, 640, '#f4dc5a', 650], [640, 1500, '#8e44c8', 1600]];   // x0, x1, colour, how low (Y) it hangs
  const SARI_Z = 6950;
  const camLane = (t) => 600 + 4800 * (t - T.chase0);
  function runPose(t, o = {}) {                       // him, running away from you: the back, the glass level, the bag swinging
    const ph = t * 15.5;
    return { back: true, walk: 2.4, phase: ph, lean: 0.12, legs: true, headBob: -6 * Math.cos(2 * ph), glassK: 0.55, cap: 1, rim: 1,
      hands: { r: 'glass', l: 'fist' }, arms: { r: { a1: 0.5 + 0.12 * Math.sin(ph), a2: 1.25, hand: 'glass', w: 1 }, l: { a1: 0.35 + 0.35 * Math.sin(ph + Math.PI), a2: 0.9 + 0.3 * Math.sin(ph), hand: 'fist', w: 1 } }, ...o };
  }
  function drawRunner(g, P, x, y, s, o, t) {          // the figure, plus the bag in his left fist
    figure(g, P, x, y, s, o);
    const w = wristOf(o, -1), dir = [-Math.sin(w.ang), Math.cos(w.ang)];
    const fx = x + (w.x + dir[0] * 60) * s, fy = y + (w.y + dir[1] * 60) * s;
    redBag(g, fx, fy + 110 * s, s * 0.95, 0.25 * Math.sin(t * 15.5));
  }
  function sari(g, cz, tw, x0, x1, col, low, k) {
    const z = SARI_Z, N = 10, top = 2750, pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N, X = lerp(x0, x1, u), wv = 50 * Math.sin(tw * 4 + u * 5 + x0) * k; const p = P3(X, top, z + wv, cz); if (!p) return; pts.push(p); }
    for (let i = N; i >= 0; i--) { const u = i / N, X = lerp(x0, x1, u), wv = 90 * Math.sin(tw * 4.4 + u * 6 + x0) * k, Y = low + 80 * Math.sin(u * 9 + tw * 3) * k; const p = P3(X + wv * 0.3, Y, z + wv, cz); if (!p) return; pts.push(p); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = col; g.fill();
    g.save(); g.clip(); const a = pts[0], b = pts[N]; g.strokeStyle = 'rgba(255,240,200,0.55)'; g.lineWidth = Math.max(2, 60 * a[2]); g.beginPath(); g.moveTo(a[0], a[1] + 90 * a[2]); g.lineTo(b[0], b[1] + 90 * b[2]); g.stroke(); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-500, a[1] + 600 * a[2], W + 1000, 2000); g.restore();
  }
  function shotChase(g, t) {
    const cz = camLane(t), tw = t, ph = t * 15.5;
    const bob = 26 * Math.abs(Math.sin(ph * 0.5)) - 13, roll = 0.018 * Math.sin(ph * 0.5);
    EYE = 1400 + bob * 3; CAMX = 120 * Math.sin(t * 2.2);
    g.save(); g.translate(540, 960); g.rotate(roll); g.translate(-540, -960);
    world(g, cz, tw); light(g, tw);
    // the line across the lane and its saris (the middle one hangs low: you run into it)
    const lp0 = P3(-LW, 2780, SARI_Z, cz), lp1 = P3(LW, 2780, SARI_Z, cz);
    if (lp0 && lp1) { g.strokeStyle = 'rgba(30,25,20,0.7)'; g.lineWidth = Math.max(1, 8 * lp0[2]); g.beginPath(); g.moveTo(lp0[0], lp0[1]); g.quadraticCurveTo(540, lp0[1] + 120 * lp0[2], lp1[0], lp1[1]); g.stroke(); }
    // him, ahead, gaining distance less than you're gaining on him
    const dz = lerp(2500, 1350, sstep(T.chase0, 6.7, t)), Z = cz + dz, X = 180 * Math.sin(t * 3.1) - 100;
    const look = winK(t, T.look0, T.look0 + 0.14, T.look1 - 0.12, T.look1), duck = winK(Z, SARI_Z - 700, SARI_Z - 250, SARI_Z + 150, SARI_Z + 500);
    const sarisBehind = Z > SARI_Z;
    const drawSaris = () => { if (cz < SARI_Z - 20) for (const [x0, x1, col, low] of SARIS) sari(g, cz, tw, x0, x1, col, low, 1); };
    if (sarisBehind) drawSaris();
    const p = P3(X, 0, Z, cz);
    if (p) {
      const o = runPose(t, { faceMix: look, headYaw: -1.0 * look, yaw: -0.25 * look, lean: 0.12 + 0.45 * duck, headBob: -6 * Math.cos(2 * ph) + 140 * duck });
      if (look > 0.4) o.back = true;
      drawRunner(g, THIEF0, p[0], p[1] - 1594 * p[2], p[2], o, t);
    }
    if (!sarisBehind) drawSaris();
    g.restore();
    EYE = 1400; CAMX = 0;
    // the last frames: the sari is the whole frame
    const wipe = sstep(SARI_Z - 420, SARI_Z - 60, cz);
    if (wipe > 0) { g.save(); g.globalAlpha = wipe; g.fillStyle = lg(g, 0, 0, W, H, [0, '#4a6be0'], [0.5, '#3b5fd0'], [1, '#2a47b0']); g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,240,200,0.5)'; g.lineWidth = 50; g.beginPath(); g.moveTo(-100, 1500 - 900 * wipe); g.quadraticCurveTo(540, 1400 - 900 * wipe, 1200, 1560 - 900 * wipe); g.stroke(); g.restore(); }
    return 0;
  }

  // ================================================================ shot 3 · up over the rooftops: the lanes are a maze, two of you in it. Then the dive.
  const MAP = (() => {
    const r = mulberry32(3801), roofs = [], lanes = [];
    const cols = ['#f2b8a0', '#f6d58e', '#e9e2d0', '#cdbbe8', '#f4c6d4', '#bcd8f2', '#e9a98f', '#d8cfc0', '#f0e0c0'];
    const xs = [0], ys = [0]; while (xs[xs.length - 1] < 3000) xs.push(xs[xs.length - 1] + 330 + r() * 260); while (ys[ys.length - 1] < 4200) ys.push(ys[ys.length - 1] + 300 + r() * 260);
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
      const x0 = xs[i] + 34, x1 = xs[i + 1] - 34, y0 = ys[j] + 34, y1 = ys[j + 1] - 34;
      const split = r() < 0.6, sx = lerp(x0, x1, 0.35 + r() * 0.3);
      const parts = split ? [[x0, y0, sx - 3, y1], [sx + 3, y0, x1, y1]] : [[x0, y0, x1, y1]];
      for (const [a, b, c2, d] of parts) roofs.push({ x0: a, y0: b, x1: c2, y1: d, col: cols[(r() * cols.length) | 0], h: 0.6 + r() * 0.8, tank: r() < 0.5 ? [lerp(a, c2, 0.2 + r() * 0.6), lerp(b, d, 0.2 + r() * 0.6)] : null, line: r() < 0.45, cloth: (r() * 1e6) | 0, hut: r() < 0.3 });
    }
    return { roofs, xs, ys };
  })();
  // the way through: lane crossings he runs along (map units), and when he's at each
  const ROUTE = (() => { const { xs, ys } = MAP; const pts = [[1, 9], [1, 7], [3, 7], [3, 5], [5, 5], [5, 3], [4, 3], [4, 1]].map(([i, j]) => [xs[i], ys[j]]); return pts; })();
  function routeAt(u) {                               // u: 0..1 along the route
    const segs = []; let L = 0; for (let i = 0; i < ROUTE.length - 1; i++) { const l = Math.hypot(ROUTE[i + 1][0] - ROUTE[i][0], ROUTE[i + 1][1] - ROUTE[i][1]); segs.push(l); L += l; }
    let d = clamp(u) * L; for (let i = 0; i < segs.length; i++) { if (d <= segs[i] || i === segs.length - 1) { const k = clamp(d / segs[i]); const a = ROUTE[i], b = ROUTE[i + 1]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])]; } d -= segs[i]; }
    return [...ROUTE[ROUTE.length - 1], 0];
  }
  function topPerson(g, x, y, ang, s, kind, t) {      // someone seen from straight above: shoulders, head, and (him) a cap with its brim
    const sw = Math.sin(t * 16) * 0.25;
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(60,30,30,0.28)'; ell(g, -26 * s, 30 * s, 34 * s, 22 * s, ang); g.fill();             // the long shadow
    g.rotate(ang + Math.PI / 2);
    g.fillStyle = kind === 'him' ? '#2a8a76' : '#3554b0'; ell(g, 0, 0, 30 * s, 15 * s); g.fill();
    g.fillStyle = kind === 'him' ? '#c08a64' : '#b27a54'; for (const k of [-1, 1]) { ell(g, k * 28 * s, -10 * s - k * sw * 14 * s, 6 * s, 9 * s); g.fill(); }
    if (kind === 'him') { g.fillStyle = '#8e2434'; ell(g, 0, 2 * s, 13 * s, 13 * s); g.fill(); g.fillStyle = '#4a111b'; ell(g, 0, -12 * s, 10 * s, 6 * s); g.fill(); }
    else { g.fillStyle = '#15100c'; ell(g, 0, 2 * s, 12 * s, 12 * s); g.fill(); }
    g.restore();
  }
  function shotMap(g, t) {
    const u = sstep(T.map0 - 0.4, T.lane2 + 0.1, t), me = routeAt(u * 0.86 + 0.02), him = routeAt(u * 0.86 + 0.1);
    const zoomOut = sstep(T.map0, T.map0 + 0.42, t), dive = Math.pow(sstep(T.dive, T.lane2, t), 2.2);
    const z = lerp(3.4, 1.05, zoomOut) * lerp(1, 9, dive), rot = 0.25 + 0.12 * Math.sin(t * 0.9) + 0.9 * dive;
    const fx = lerp(me[0], him[0], 0.5), fy = lerp(me[1], him[1], 0.5);
    g.fillStyle = '#d9c7a4'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(540, 980); g.rotate(rot); g.scale(z, z); g.translate(-fx, -fy);
    // the lanes (the ground between the roofs), warm and dusty
    g.fillStyle = '#cbb48e'; g.fillRect(-500, -500, 4500, 5500);
    for (const rf of MAP.roofs) {
      const sh = 26 * rf.h;
      g.fillStyle = 'rgba(70,40,40,0.35)'; g.fillRect(rf.x0 - sh, rf.y0 + sh * 0.6, rf.x1 - rf.x0, rf.y1 - rf.y0);           // its shadow, long and low
      g.fillStyle = rf.col; g.fillRect(rf.x0, rf.y0, rf.x1 - rf.x0, rf.y1 - rf.y0);
      g.strokeStyle = mix(rf.col, '#ffffff', 0.45); g.lineWidth = 9; g.strokeRect(rf.x0 + 5, rf.y0 + 5, rf.x1 - rf.x0 - 10, rf.y1 - rf.y0 - 10);
      if (rf.hut) { g.fillStyle = mix(rf.col, '#5a4a40', 0.35); g.fillRect(rf.x1 - 90, rf.y0 + 20, 70, 60); }
      if (rf.tank) { g.fillStyle = 'rgba(40,30,30,0.3)'; ell(g, rf.tank[0] - 14, rf.tank[1] + 10, 30, 30); g.fill(); g.fillStyle = '#7d8fa3'; ell(g, rf.tank[0], rf.tank[1], 24, 24); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; ell(g, rf.tank[0] - 8, rf.tank[1] - 8, 9, 9); g.fill(); }
      if (rf.line) { const y = lerp(rf.y0, rf.y1, 0.5); g.strokeStyle = 'rgba(40,30,30,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(rf.x0 + 20, y); g.lineTo(rf.x1 - 20, y); g.stroke(); const r = mulberry32(rf.cloth); for (let x = rf.x0 + 30; x < rf.x1 - 50; x += 40 + r() * 30) { g.fillStyle = ['#d0307a', '#3b5fd0', '#f4dc5a', '#8e44c8', '#ffffff', '#e8413a'][(r() * 6) | 0]; g.fillRect(x, y, 26 + r() * 20, 10 + 6 * Math.sin(t * 5 + x)); } }
    }
    // the two of you, running
    topPerson(g, me[0], me[1], me[2], 2.6, 'you', t);
    topPerson(g, him[0], him[1], him[2], 2.6, 'him', t + 0.3);
    g.restore();
    // the lift and the dive: a little warm haze, and a white rush into the lane
    g.fillStyle = `rgba(255,230,190,${0.25 * (1 - zoomOut)})`; g.fillRect(0, 0, W, H);
    if (dive > 0.82) { g.fillStyle = `rgba(255,248,232,${sstep(0.82, 1, dive) * 0.85})`; g.fillRect(0, 0, W, H); }
    return 0;
  }

  // ================================================================ shot 4 · down the next lane: the vegetable cart, the vault, the cow; the lane opens
  const VCART = { Z: 5200, X: 80 };
  const camLane2 = (t) => 2000 + 4700 * (t - T.lane2);
  const TOMS = (() => { const r = mulberry32(3822), out = []; for (let i = 0; i < 22; i++) out.push({ X: VCART.X + (r() - 0.5) * 700, Z: VCART.Z + (r() - 0.5) * 900, vx: (r() - 0.5) * 2600, vy: 1600 + r() * 2200, vz: (r() - 0.5) * 1800, col: r() < 0.75 ? '#e2412f' : r() < 0.5 ? '#f4dc5a' : '#7fb33d' }); return out; })();
  function vegCart(g, cz, t) {
    const X = VCART.X, Z = VCART.Z, P = (x, y, z) => P3(X + x, y, Z + z, cz);
    const q = (pts, col) => poly(g, pts.map((p) => P(...p)), col);
    for (const zw of [-500, 500]) { const c = P(-430, 330, zw), c2 = P(430, 330, zw); for (const cc of [c, c2]) if (cc) { g.fillStyle = '#3b2a20'; ell(g, cc[0], cc[1], 300 * cc[2] * 0.25, 330 * cc[2]); g.fill(); } }
    q([[-420, 640, -700], [420, 640, -700], [420, 640, 700], [-420, 640, 700]], '#a87a4a');
    q([[-420, 520, -700], [420, 520, -700], [420, 640, -700], [-420, 640, -700]], '#7a4f2c');
    // the heap: tomatoes, lemons, a few leaves, until the vault scatters the top of it
    const r = mulberry32(3830);
    for (let i = 0; i < 70; i++) { const x = (r() - 0.5) * 760, z = (r() - 0.5) * 1300, y = 680 + r() * 260 * (1 - Math.abs(x) / 420); const p = P(x, y, z); if (!p) continue; const c = r(); g.fillStyle = c < 0.7 ? '#e2412f' : c < 0.85 ? '#f4dc5a' : '#7fb33d'; ell(g, p[0], p[1], 60 * p[2], 54 * p[2]); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; ell(g, p[0] - 18 * p[2], p[1] - 18 * p[2], 16 * p[2], 12 * p[2]); g.fill(); }
    // the tomatoes in the air, from his vault
    const d = t - T.vault;
    if (d > 0) for (const tm of TOMS) { const X2 = tm.X + tm.vx * d, Y = 900 + tm.vy * d - 4900 * d * d, Z2 = tm.Z + tm.vz * d; if (Y < 60) continue; const p = P3(X2, Y, Z2, cz); if (!p) continue; g.fillStyle = tm.col; ell(g, p[0], p[1], 60 * p[2], 56 * p[2]); g.fill(); }
  }
  function cow(g, cz, t) {
    const Z = 6900, X = 820, p = P3(X, 0, Z, cz), ph = P3(X - 80, 0, Z - 900, cz); if (!p || !ph) return;
    const turn = sstep(8.85, 9.3, t), s = ph[2];
    // her body along the wall, side-on to the lane
    g.fillStyle = '#efe7da'; g.beginPath(); g.moveTo(ph[0] + 60 * s, ph[1] - 1250 * s);
    const b0 = P3(X + 60, 1350, Z + 900, cz), b1 = P3(X + 60, 500, Z + 900, cz);
    if (b0 && b1) { g.lineTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); } g.lineTo(ph[0] + 60 * s, ph[1] - 500 * s); g.closePath(); g.fill();
    for (const z of [Z - 650, Z + 700]) { const a = P3(X, 0, z, cz), b2 = P3(X, 520, z, cz); if (a && b2) { g.strokeStyle = '#d8cfbf'; g.lineWidth = 70 * a[2]; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b2[0], b2[1]); g.stroke(); } }
    // her head, turning to watch you go by
    g.save(); g.translate(ph[0] - 40 * s, ph[1] - 1250 * s); g.scale(s, s);
    const k = lerp(0.25, 1, turn);
    g.fillStyle = '#f4ede2'; g.beginPath(); g.ellipse(-160 * k, 0, 220, 300, 0.2 * (1 - k), 0, TAU); g.fill();
    g.fillStyle = '#e9b7a6'; ell(g, -160 * k - 60 * (1 - k), 200, 150, 110); g.fill();
    g.fillStyle = '#3a2a24'; for (const e of [-1, 1]) { if (k < 0.5 && e > 0) continue; ell(g, -160 * k + e * 105 * k - 40 * (1 - k), -40, 26, 30); g.fill(); }
    g.fillStyle = '#d8cfbf'; for (const e of [-1, 1]) { g.save(); g.translate(-160 * k + e * 200 * k, -200); g.rotate(e * 0.7); ell(g, 0, 0, 90, 34); g.fill(); g.restore(); }
    g.strokeStyle = '#cfc2a8'; g.lineWidth = 26; g.lineCap = 'round'; for (const e of [-1, 1]) { g.beginPath(); g.moveTo(-160 * k + e * 80, -250); g.quadraticCurveTo(-160 * k + e * 120, -360, -160 * k + e * 70, -420); g.stroke(); }
    g.restore();
  }
  function shotLane2(g, t) {
    const cz = camLane2(t), tw = t + 2, ph = t * 15.5;
    const vault = winK(t, T.youVault - 0.12, T.youVault + 0.05, T.youVault + 0.18, T.youVault + 0.36);
    const bob = 26 * Math.abs(Math.sin(ph * 0.5)) - 13;
    EYE = 1400 + bob * 3 + 620 * vault; CAMX = -60 + 90 * Math.sin(t * 2.4);
    const roll = 0.02 * Math.sin(ph * 0.5) - 0.06 * vault;
    g.save(); g.translate(540, 960); g.rotate(roll); g.translate(-540, -960);
    world(g, cz + 3000, tw);
    // the lane opens ahead: the light of the gully at its end
    const open = sstep(9.1, T.gully0, t);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg(g, 540, HZ, 20, 900 + 900 * open, [0, `rgba(255,236,200,${0.3 + 0.6 * open})`], [1, 'rgba(255,236,200,0)']); g.fillRect(-300, -300, W + 600, H + 600); g.restore();
    cow(g, cz, t);
    // him: running at the cart, up and over it (his chai level), down and on
    const Zh = cz + lerp(2600, 1600, sstep(T.lane2, T.gully0, t)), jump = winK(Zh, VCART.Z - 900, VCART.Z - 450, VCART.Z + 350, VCART.Z + 800);
    const behindCart = Zh > VCART.Z;
    if (behindCart) { const p = P3(-60, 620 * Math.sin(jump * Math.PI / 2), Zh, cz); if (p) drawRunner(g, THIEF0, p[0], p[1] - 1594 * p[2], p[2], runPose(t, { walk: lerp(2.4, 2.9, jump), lean: 0.12 + 0.2 * jump }), t); }
    vegCart(g, cz, t);
    if (!behindCart) { const p = P3(-60, 620 * Math.sin(jump * Math.PI / 2), Zh, cz); if (p) drawRunner(g, THIEF0, p[0], p[1] - 1594 * p[2], p[2], runPose(t, { walk: lerp(2.4, 2.9, jump), lean: 0.12 + 0.2 * jump }), t); }
    g.restore();
    EYE = 1400; CAMX = 0;
    const fl = sstep(T.gully0 - 0.12, T.gully0, t), inn = 1 - sstep(T.lane2, T.lane2 + 0.12, t);
    return Math.max(fl * 0.85, inn * 0.9);
  }

  // a smooth path through keyframes [time, ...values] (Hermite, Catmull-Rom tangents; it eases only at the two ends)
  function spl(t, ks) {
    if (t <= ks[0][0]) return ks[0].slice(1);
    const n = ks.length; if (t >= ks[n - 1][0]) return ks[n - 1].slice(1);
    let i = 0; while (t > ks[i + 1][0]) i++;
    const a = ks[i], b = ks[i + 1], t0 = a[0], t1 = b[0], h = t1 - t0, u = (t - t0) / h;
    const pa = ks[Math.max(0, i - 1)], pb = ks[Math.min(n - 1, i + 2)];
    const ue = i === 0 ? u * u * (3 - 2 * u) * 0.5 + u * 0.5 : u;
    const h00 = 2 * ue ** 3 - 3 * ue ** 2 + 1, h10 = ue ** 3 - 2 * ue ** 2 + ue, h01 = -2 * ue ** 3 + 3 * ue ** 2, h11 = ue ** 3 - ue ** 2;
    return a.slice(1).map((v, j) => {
      const m0 = i === 0 ? 0 : (b[j + 1] - pa[j + 1]) / (t1 - pa[0]) * h, m1 = i + 1 === n - 1 ? 0 : (pb[j + 1] - a[j + 1]) / (pb[0] - t0) * h;
      return h00 * v + h10 * m0 + h01 * b[j + 1] + h11 * m1;
    });
  }
  const camK = (t, ks, o = {}) => { const [x, y, z, yaw, pitch, roll] = spl(t, ks); return cam0({ x, y, z, yaw, pitch, roll: roll || 0, ...o }); };

  // ================================================================ shot 5 · the gully. The kick, the cap rain, the sea of caps
  const GULLY_CAM = [
    [9.5, 0, 1450, -1900, 0, 0.02, 0], [9.95, -160, 1450, -700, -0.22, 0.02, 0], [10.3, -40, 1400, -1150, 0.2, -0.36, 0.08],
    [11.3, -60, 1300, -700, 0.38, -0.58, 0.3], [11.85, -150, 1420, 100, 0.05, -0.06, 0.06], [12.3, -120, 1460, 800, -0.12, 0.03, 0],
    [12.8, -200, 1460, 1330, -0.55, 0.03, -0.03], [13.35, -60, 1460, 1640, 0.52, 0.03, 0.03], [13.8, 0, 1460, 1800, 0.1, 0.03, 0],
  ];
  function shotGully(g, t, o = {}) {
    const e = evT(t), c = camK(t, GULLY_CAM), ph = t * 15.5;
    if (t < E.kick) c.y += 26 * Math.abs(Math.sin(ph * 0.5)) * 3 - 30;
    const sh = shakeAt(t, [[E.kick, 22], [E.kick + 0.06, 14]]);
    c.cx += sh[0]; c.cy += sh[1];
    gully(g, c, e, o);
    return (1 - sstep(T.gully0, T.gully0 + 0.16, t)) * 0.85;
  }

  // ================================================================ world D · the steps: a broad flight up to a pale hall, the crowd on it, the five in front
  const STEP = { d: 340, h: 270, n: 6, z0: 700 }, BACKZ = 700 + 6 * 340, ROWX = [-1240, -620, 0, 620, 1240];
  const THIEF_STEP = { X: 310, Y: 270, Z: 700 + 170 };
  const STEPS_CROWD = (() => {
    const r = mulberry32(3911), out = [];
    const spots = [[-1850, 0, 'old', 0], [-930, 0, 'man', 1], [1480, 0, 'fan', 0], [2350, 0, 'woman', 0],
      [-1450, 1, 'man', 1], [-330, 1, 'kid', 0], [930, 1, 'man', 1], [1950, 1, 'man', 1],
      [-2250, 2, 'man', 1], [-720, 2, 'woman', 0], [420, 2, 'kid', 1], [1350, 2, 'man', 1], [2650, 2, 'man', 1],
      [-1650, 3, 'man', 1], [-60, 3, 'man', 1], [1100, 3, 'man', 0], [2250, 3, 'man', 1], [-2600, 4, 'man', 1], [700, 4, 'man', 1], [1800, 4, 'woman', 0]];
    for (const [X, k, kind, cap] of spots) { const P = makeLook(r, kind === 'fan' ? 'man' : kind); if (kind === 'fan') { P.L.style = 'curls'; P.L.must = null; } out.push({ X: X + (r() - 0.5) * 60, k, Y: (k + 1) * STEP.h, Z: STEP.z0 + (k + 0.5) * STEP.d, P, kind, cap, ph: r() * 6, a: (X - 300) * -0.00012 + (r() - 0.5) * 0.3, tall: kind === 'kid' ? 0.72 : 0.95 + r() * 0.08 }); }
    return out;
  })();
  const STANCE = [
    { l: { a1: 0.26, a2: 1.08, hand: 'fist' }, r: { a1: 0.26, a2: 1.12, hand: 'fist' } },
    { l: { a1: 0.1, a2: 0.18 }, r: { a1: 0.1, a2: 0.16 } },
    { l: { a1: 0.2, a2: 0.62, hand: 'fist' }, r: { a1: 0.2, a2: 0.6, hand: 'fist' } },
    { l: { a1: 0.08, a2: 0.2 }, r: { a1: 0.12, a2: 0.26 } },
    { l: { a1: 0.22, a2: 0.96, hand: 'fist' }, r: { a1: 0.2, a2: 0.78, hand: 'relax' } },
  ];
  function stepsBack(g, c, tw) {
    skyFor(g, c);
    const r0 = mulberry32(3933);
    for (let X = -6000, i = 0; X < 6000; i++) { const w = 900 + r0() * 900, h = 6200 + r0() * 2200; cpoly(g, c, [[X, 0, BACKZ + 1600], [X + w, 0, BACKZ + 1600], [X + w, h, BACKZ + 1600], [X, h, BACKZ + 1600]], mix(['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#e88aa0'][i % 6], HAZE, 0.42)); X += w; }
    // the ground in front, and the houses down each side
    if (cpoly(g, c, [[-5200, 0, -6000], [5200, 0, -6000], [5200, 0, BACKZ], [-5200, 0, BACKZ]], null)) { const hy = horizonY(c); g.fillStyle = lg(g, 0, hy, 0, hy + 1400, [0, '#e6cea4'], [0.3, '#d6bb92'], [1, '#b49674']); g.fill(); }
    for (const sd of [-1, 1]) { const X = sd * 4300; cpoly(g, c, [[X, 0, -5000], [X, 0, BACKZ], [X, 5600, BACKZ], [X, 5600, -5000]], sd < 0 ? mix('#f4c6d4', SHADE, 0.2) : mix('#bcd8f2', '#fff0d8', 0.1)); for (let z = -4600; z < BACKZ - 600; z += 1500) for (const fy of [1700, 3600]) cpoly(g, c, [[X - sd * 2, fy, z], [X - sd * 2, fy, z + 800], [X - sd * 2, fy + 1000, z + 800], [X - sd * 2, fy + 1000, z]], '#4a5060'); }
    // the hall: a pale front, pillars, a blue door, a notice board, a strip of bunting
    cpoly(g, c, [[-3800, 0, BACKZ], [3800, 0, BACKZ], [3800, 5400, BACKZ], [-3800, 5400, BACKZ]], '#f3dcc4');
    cpoly(g, c, [[-3800, 5200, BACKZ - 4], [3800, 5200, BACKZ - 4], [3800, 5400, BACKZ - 4], [-3800, 5400, BACKZ - 4]], '#e2c4a6');
    cpoly(g, c, [[-600, STEP.n * STEP.h, BACKZ - 4], [600, STEP.n * STEP.h, BACKZ - 4], [600, STEP.n * STEP.h + 2400, BACKZ - 4], [-600, STEP.n * STEP.h + 2400, BACKZ - 4]], '#2f6fb0');
    cpoly(g, c, [[-560, STEP.n * STEP.h + 2350, BACKZ - 6], [560, STEP.n * STEP.h + 2350, BACKZ - 6], [560, STEP.n * STEP.h + 2450, BACKZ - 6], [-560, STEP.n * STEP.h + 2450, BACKZ - 6]], '#f6efe2');
    cpoly(g, c, [[1500, 2600, BACKZ - 4], [2700, 2600, BACKZ - 4], [2700, 3600, BACKZ - 4], [1500, 3600, BACKZ - 4]], '#7a5a3a');
    for (const X of [-3000, -1700, 1700, 3000]) { cpoly(g, c, [[X - 170, 0, BACKZ - 180], [X + 170, 0, BACKZ - 180], [X + 170, 5200, BACKZ - 180], [X - 170, 5200, BACKZ - 180]], '#fbf0e2'); cpoly(g, c, [[X - 170, 0, BACKZ - 180], [X - 170, 5200, BACKZ - 180], [X - 170, 5200, BACKZ], [X - 170, 0, BACKZ]], '#e0cbb4'); }
    for (let i = 0; i < 16; i++) { const u = i / 16, X = lerp(-3700, 3700, u), Y = 4700 - 260 * Math.sin(u * Math.PI); const p = PJ(c, X, Y, BACKZ - 300); if (!p) continue; g.fillStyle = ['#ff7fb0', '#f4dc5a', '#5ab8ff', '#fff6e0'][i % 4]; const fl = 16 * Math.sin(tw * 3 + i) * p[2]; g.beginPath(); g.moveTo(p[0] - 90 * p[2], p[1]); g.lineTo(p[0] + 90 * p[2], p[1]); g.lineTo(p[0] + fl, p[1] + 200 * p[2]); g.closePath(); g.fill(); }
    // the steps, top to bottom: each tread, then its riser
    for (let k = STEP.n - 1; k >= 0; k--) {
      const z0 = STEP.z0 + k * STEP.d, z1 = z0 + STEP.d, y = (k + 1) * STEP.h;
      cpoly(g, c, [[-3800, y, z0], [3800, y, z0], [3800, y, z1], [-3800, y, z1]], mix('#e8dcc6', '#d8c8ac', k / STEP.n));
      cpoly(g, c, [[-3800, y - STEP.h, z0], [3800, y - STEP.h, z0], [3800, y, z0], [-3800, y, z0]], mix('#b9a586', '#a8936f', k / STEP.n));
      cpoly(g, c, [[-3800, y - 18, z0 - 2], [3800, y - 18, z0 - 2], [3800, y, z0 - 2], [-3800, y, z0 - 2]], 'rgba(255,250,240,0.6)');
    }
  }
  function rowMan(i, t, o = {}) {                     // number i+1: where he stands and how
    const arrive = T.line0 + 0.15 + i * 0.2, u = clamp((t - arrive + 0.42) / 0.42);
    const ease = 1 - Math.pow(1 - u, 3) + 0.08 * Math.sin(u * Math.PI) * (1 - u);
    const X = lerp(-3600, ROWX[i], ease), moving = u > 0 && u < 1;
    const st = STANCE[i], breath = 6 * Math.sin(t * 1.7 + i * 1.3);
    const look = o.look || [lerp(6, -6, i / 4), 3];
    const pose = { breath, look, walk: moving ? 1.2 : 0, phase: t * 12, legs: true, cap: 1, rim: 1, close: blinkAt(t, i, 3.1 + i * 0.3), frown: [0.18, 0.1, 0.24, 0.12, 0.06][i], worry: [-2, 4, 0, 3, 6][i],
      arms: { l: { ...st.l, w: moving ? 0 : 1 }, r: { ...st.r, w: moving ? 0 : 1 } }, lean: moving ? -0.08 * Math.sin(u * Math.PI) : 0, tilt: [0.02, -0.03, 0.01, -0.02, 0.03][i] };
    return { X, Y: 0, Z: 0, a: moving ? Math.PI / 2 : (o.face ?? 0), pose, shown: u > 0 };
  }
  // the thief on the first step, bareheaded, sipping his chai; o.smile: the smile at you
  function thiefStepPose(t, o = {}) {
    const sip = winK(((t + 1.2) % 4.2), 0.2, 0.55, 1.4, 1.8) * (o.noSip ? 0 : 1), sm = o.smile || 0, lower = o.lower || 0;
    const k = Math.max(0, sip * (1 - lower));
    const p = { breath: 5 * Math.sin(t * 1.5), look: o.look || [-4, 3], legs: true, cap: 0, rim: 1, hands: { r: 'glass' }, glassK: 0.55, smile: 0.08 + 0.3 * sm, smirk: 0.5 * sm, close: blinkAt(t, 7, 3.6), tilt: -0.03 * k + 0.03 * sm, browUp: 6 * sm };
    p.arms = { r: { ...armIK(p, 1, lerp(220, 40, k), lerp(430, 150, k), 46), hand: 'glass', w: 1 } };
    return p;
  }
  // one frame of the steps. o.row: draw the five; o.rowBlur; o.cam; o.tiles (0..1); o.flash: per-man cap flash; o.thief (pose options)
  function steps(g, c, t, o = {}) {
    withRoll(g, c, () => {
      stepsBack(g, c, t);
      const objs = [];
      for (const p of STEPS_CROWD) { const v = camSpace(c, p.X, p.Y + 900, p.Z); if (v[2] > 160) objs.push({ d: v[2], k: 'c', p }); }
      { const v = camSpace(c, THIEF_STEP.X, THIEF_STEP.Y + 900, THIEF_STEP.Z); if (v[2] > 160) objs.push({ d: v[2], k: 't' }); }
      if (o.extra) for (const x of o.extra) { const v = camSpace(c, x.X, 900, x.Z); if (v[2] > 60) objs.push({ d: v[2], k: 'x', x }); }
      objs.sort((a, b) => b.d - a.d);
      for (const ob of objs) {
        if (ob.k === 'c') {
          const p = ob.p, fan = p.kind === 'fan';
          const po = { breath: 5 * Math.sin(t * 1.4 + p.ph), look: [6 * Math.sin(t * 0.6 + p.ph), 3], legs: true, cap: p.cap, rim: 1, close: blinkAt(t, (p.ph * 10) | 0, 3.3), scale: p.tall };
          if (fan) { const f = Math.sin(t * 9 + p.ph); po.arms = { r: { a1: 1.2 + 0.25 * f, a2: 1.5, hand: 'grip', w: 1 } }; }
          const v = drawPerson(g, c, p.P, p.X, p.Y, p.Z, p.a, po);
          if (fan && v) { const wo = { ...po, yaw: clamp(v.yaw * 0.9, -0.95, 0.95) }, w = wristOf(wo, 1), s = v.s * p.tall; capSprite(g, v.x + (w.x + 20) * s, v.y - 1594 * s + (w.y - 60) * s, s * 0.9, 1.2 + 0.4 * Math.sin(t * 9 + p.ph), 0.7); }
        } else if (ob.k === 't') drawPerson(g, c, THIEFB, THIEF_STEP.X, THIEF_STEP.Y, THIEF_STEP.Z, -0.06, thiefStepPose(t, o.thief || {}));
        else ob.x.draw(g, c);
      }
      // the five, nearest of all (blurred while the focus pulls past them)
      if (o.row !== false) {
        const blur = o.rowBlur || 0;
        let gg = g;
        if (blur > 0.2) { const b = buf(3); gg = b.getContext('2d'); gg.setTransform(1, 0, 0, 1, 0, 0); gg.globalAlpha = 1; gg.filter = 'none'; gg.clearRect(0, 0, W, H); }
        const men = [0, 1, 2, 3, 4].map((i) => ({ i, m: rowMan(i, t, o) })).filter((x) => x.m.shown).sort((a, b) => Math.abs(b.m.X - c.x) - Math.abs(a.m.X - c.x));
        for (const { i, m } of men) {
          const v = drawPerson(gg, c, FIVE[i], m.X, 0, 0, m.a, m.pose); if (!v) continue;
          const hx = v.x, hy = v.y - 1594 * v.s, s = v.s;
          if (o.flash && o.flash[i] > 0.01) { gg.save(); gg.globalAlpha = o.flash[i]; gg.strokeStyle = YEL; gg.lineWidth = 14; ell(gg, hx, hy - 220 * s, 230 * s, 130 * s); gg.stroke(); gg.restore(); }
          const tk = o.tiles ? o.tiles[i] : 0;
          if (tk > 0.01) { gg.save(); gg.translate(hx, hy - 420 * s - 20); const q = tk * (1 + (o.pulse ? 0.12 * o.pulse : 0)); gg.scale(q, q); tileNo(gg, 0, 0, i + 1, Math.max(52, 150 * s)); gg.restore(); }
        }
        if (gg !== g) { g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(buf(3), 0, 0); g.restore(); }
      }
    });
  }

  // ================================================================ shots 6–8 · the line forms; find him; "Did you even look behind them?"; the focus pull
  const LINE_CAM = [
    [13.8, -300, 1640, -3500, 0, 0.02, 0], [16.2, -200, 1640, -3100, 0, 0.02, 0], [16.6, -1500, 1650, -1800, 0, 0.02, 0],
    [20.1, 1450, 1650, -1800, 0, 0.02, 0], [21.0, 200, 1650, -3150, 0, 0.02, 0], [23.25, 160, 1650, -3300, 0, 0.02, 0],
    [24.5, 300, 1860, -760, 0.02, -0.03, 0], [26.2, 315, 1870, -680, 0.02, -0.03, 0],
  ];
  function constable(t, o = {}) {
    return { X: -2350, Z: -250, draw(g, c) {
      const wh = winK(t, T.whistle - 0.05, T.whistle + 0.05, T.whistle + 0.45, T.whistle + 0.6), pt = winK(t, 14.2, 14.4, 15.4, 15.7);
      const po = { look: [10, 2], legs: true, rim: 1, frown: 0.3, op: 0.02, breath: 4 * Math.sin(t * 1.3), close: blinkAt(t, 9, 3.5),
        arms: { r: { a1: lerp(0.1, 1.45, pt), a2: lerp(0.2, 0.15, pt), hand: pt > 0.5 ? 'point' : 'relax', w: 1 }, l: { a1: lerp(0.15, 0.4, wh), a2: lerp(0.3, 2.3, wh), hand: 'fist', w: 1 } } };
      const v = drawPerson(g, c, COP, this.X, 0, this.Z, Math.PI / 2 - 0.5, po);
      if (v && wh > 0.05) { const s = v.s; g.fillStyle = '#d8dde4'; R(g, v.x - 10 * s, v.y - 1594 * s + 110 * s, 90 * s, 34 * s, 12 * s); g.fill(); }
    } };
  }
  function shotLine(g, t) {
    const c = camK(t, LINE_CAM, { cy: lerp(880, 690, sstep(T.l8, T.l8 + 1.2, t)) });
    const tiles = [0, 1, 2, 3, 4].map((i) => clamp(pop(t, T.line0 + 0.2 + i * 0.2)));
    const pulse = t > 16.9 && t < T.find1 ? Math.max(0, Math.cos(((t - 16.9) % 1) * Math.PI * 2)) ** 6 : 0;
    const pullK = sstep(T.l8, T.l8 + 1.1, t), smile = sstep(T.l8 + 1.6, T.l8 + 2.1, t);
    steps(g, c, t, { tiles: tiles.map((k) => k * (1 - pullK)), pulse, rowBlur: 22 * pullK, thief: { smile, lower: smile, look: pullK > 0.5 ? [0, 2] : [-4, 3] }, extra: t < 16.6 ? [constable(t)] : null, look: undefined });
    // the words
    if (t >= T.l5 - 0.05 && t < T.l6) { title(g, 'WHOEVER YOU PICK', 345, 104, CREAM, t, T.l5); title(g, 'GOES TO JAIL', 465, 126, '#ff5a3c', t, T.l5 + 0.55); }
    if (t >= T.l6 && t < T.find1 + 0.1) { title(g, 'FIND HIM', 360, 150, CREAM, t, T.l6); }
    vignette(g, 0.5);
    return 0;
  }

  // ================================================================ shot 9 · the rewind: back through the line forming and the caps landing, to the rain
  function shotRewind(g, t) {
    const u = clamp((t - T.rew0) / (T.rew1 - T.rew0)), k = u * u * (3 - 2 * u), tb = lerp(16.0, 10.32, k);
    const b = buf(4), gb = b.getContext('2d'); gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalAlpha = 1; gb.filter = 'none'; gb.clearRect(0, 0, W, H);
    gb.save(); if (tb >= T.line0) shotLine(gb, tb); else shotGully(gb, tb, {}); gb.restore();
    g.save(); g.filter = 'saturate(0.55) contrast(1.08) brightness(1.04)'; g.drawImage(b, Math.sin(t * 60) * 6, 0); g.restore();
    // tracking bands rolling up, and the rewind mark
    for (let i = 0; i < 3; i++) { const y = ((t * 1700 + i * 700) % (H + 300)) - 150; g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, H - y, W, 46); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, H - y + 46, W, 18); }
    g.save(); g.translate(150, 330); g.fillStyle = CREAM; g.strokeStyle = INK; g.lineWidth = 8; for (const dx of [0, 62]) { g.beginPath(); g.moveTo(dx + 60, -40); g.lineTo(dx, 0); g.lineTo(dx + 60, 40); g.closePath(); g.stroke(); g.fill(); } g.restore();
    return 0;
  }

  // ================================================================ shot 10 · the replay: the same moment, slow and close. Every hand goes up. His comes down.
  function shotReplay(g, t) {
    const u = clamp((t - T.rew1) / (T.rep1 - T.rew1)), e = lerp(9.99, 10.5, u);
    const c = cam0({ x: lerp(-60, -160, u), y: 1650, z: lerp(-1300, -850, u), yaw: -0.3, pitch: 0.04, cy: 820 });
    gully(g, c, e, {});
    // the ring, round his head while the cap comes off
    const th = thiefGully(e), v = personView(c, th.X, 0, th.Z, th.a);
    if (v) { const rk = sstep(29.1, 29.5, t) * (1 - sstep(31.2, 31.6, t)), s = v.s; ring(g, v.x - 120 * s, v.y - 1594 * s + 380 * s, 900 * s, rk, 12); }
    // a soft frame: this is a replay
    g.fillStyle = 'rgba(20,10,10,0.18)'; g.fillRect(0, 0, W, H);
    vignette(g, 1.0);
    return (1 - sstep(T.rew1, T.rew1 + 0.12, t)) * 0.7;
  }

  // ================================================================ shot 11 · "With a stranger, your brain goes by the hair and the cap." A sweep along the five.
  const SWEEP_CAM = [[32.0, -1900, 1650, -1450, 0, 0.02, 0], [33.15, 1900, 1650, -1450, 0, 0.02, 0], [33.7, 700, 1650, -2500, 0, 0.02, 0], [T.jeep0, 0, 1650, -2750, 0, 0.02, 0]];
  function shotSweep(g, t) {
    const c = camK(t, SWEEP_CAM, { cy: 860 });
    const flash = ROWX.map((X) => { const d = Math.abs(c.x - X); return t < 33.3 ? clamp(1 - d / 450) : 0.55 * sstep(33.6, 34.0, t); });
    steps(g, c, t, { flash, thief: {} });
    vignette(g, 0.5);
    return (1 - sstep(T.l10 - 0.15, T.l10 + 0.05, t)) * 0.5;
  }

  // ================================================================ shot 12 · the jeep. The man you picked, from behind, in shadow; his cap falls in the dust
  const JEEP = { X: -1450, Z: -600 };
  function jeepDraw(g, c, t) {
    const go = sstep(38.4, 40.8, t) ** 1.6, dz = 3800 * go, X = JEEP.X, Z = JEEP.Z + dz;
    const box = (x0, x1, y0, y1, z0, z1, front, side, top) => {
      cpoly(g, c, [[X + x0, y0, Z + z0], [X + x1, y0, Z + z0], [X + x1, y1, Z + z0], [X + x0, y1, Z + z0]], front);
      cpoly(g, c, [[X + x0, y1, Z + z0], [X + x1, y1, Z + z0], [X + x1, y1, Z + z1], [X + x0, y1, Z + z1]], top || side);
      cpoly(g, c, [[X + x1, y0, Z + z0], [X + x1, y0, Z + z1], [X + x1, y1, Z + z1], [X + x1, y1, Z + z0]], side);
    };
    for (const [zx, xs] of [[300, -480], [300, 480], [1700, 480]]) { const pts = []; for (let i = 0; i < 14; i++) { const an = i / 14 * TAU; pts.push([X + xs, 360 + Math.sin(an) * 360, Z + zx + Math.cos(an) * 360]); } cpoly(g, c, pts, '#1d1d22'); }
    box(-500, 500, 300, 1150, 0, 2400, '#e9e9e4', '#d6d6d0', '#f4f4f0');
    box(-500, 500, 640, 760, -4, 2400, '#2c4f9e', '#24447f');
    box(-470, 470, 1150, 1980, 60, 1600, '#cfcfca', '#bdbdb7', '#e2e2dc');
    cpoly(g, c, [[X - 400, 760, Z - 6], [X + 400, 760, Z - 6], [X + 400, 1900, Z + 54], [X - 400, 1900, Z + 54]], '#14141a');       // the open back, dark inside
    box(-250, 250, 1980, 2070, 500, 760, '#d23030', '#a82222');
    box(-30, 250, 1980, 2070, 500, 760, '#2c5fd0', '#2248a8');
    for (const xs of [-430, 330]) cpoly(g, c, [[X + xs, 860, Z - 8], [X + xs + 100, 860, Z - 8], [X + xs + 100, 1000, Z - 8], [X + xs, 1000, Z - 8]], '#c41f1f');
    const pp = PJ(c, X, 470, Z - 8); if (pp) txt(g, 'POLICE', pp[0], pp[1] + 30 * pp[2], 150 * pp[2], '#1d3d7e', { align: 'center', kind: 'semi' });
    // the dust it leaves
    if (go > 0) for (let i = 0; i < 9; i++) { const k = clamp(go * 1.6 - i * 0.08), q = PJ(c, X + (i % 3 - 1) * 500, 260 + 300 * k, Z - 300 - i * 260 * k); if (!q || k <= 0) continue; g.fillStyle = `rgba(232,210,170,${0.5 * (1 - k * 0.7)})`; ell(g, q[0], q[1], (300 + 900 * k) * q[2], (200 + 500 * k) * q[2]); g.fill(); }
  }
  function shotJeep(g, t) {
    const c = cam0({ x: lerp(-650, -760, sstep(T.jeep0, T.end0, t)), y: 1050, z: lerp(-3600, -3200, sstep(T.jeep0, T.end0, t)), yaw: -0.14, pitch: 0.02 });
    // the man going in: from behind, in the jeep's shadow; the constable's hand on his back
    const climb = sstep(36.1, 37.6, t), duck = sstep(37.3, 37.75, t), gone = sstep(37.85, 38.15, t);
    const man = { X: JEEP.X + 40, Z: lerp(-1700, -820, climb), draw(gg, cc) {
      if (gone >= 1) return;
      gg.save(); gg.globalAlpha *= 1 - gone; gg.filter = 'brightness(0.42) saturate(0.5)';
      drawPerson(gg, cc, FIVE[1], this.X, 380 * sstep(36.9, 37.4, t), this.Z, Math.PI, { walk: climb > 0 && climb < 1 ? 0.9 : 0, phase: t * 8, lean: 0.4 * duck, headBob: 90 * duck, cap: t < 37.55 ? 1 : 0, legs: true, rim: 0 });
      gg.restore();
    } };
    const cop = { X: JEEP.X + 720, Z: lerp(-1900, -1150, sstep(36.1, 37.4, t)), draw(gg, cc) { drawPerson(gg, cc, COP, this.X, 0, this.Z, Math.PI + 0.5, { walk: climb > 0 && climb < 0.9 ? 0.8 : 0, phase: t * 8, legs: true, rim: 1, arms: { l: { a1: 0.9, a2: 0.5, hand: 'open', w: 1 } } }); } };
    // the cap: off his head as he ducks, back through the air, into the dust, a bounce
    const cf = clamp((t - 37.55) / 0.55), land = { X: JEEP.X + 300, Z: -2250 };
    const capObj = { X: land.X, Z: land.Z, draw(gg, cc) {
      if (t < 37.55) return;
      const picked = sstep(40.15, 40.3, t); if (picked > 0.5) return;
      const bounce = t > 38.1 ? 160 * Math.abs(Math.sin((t - 38.1) * 9)) * Math.exp(-(t - 38.1) * 7) : 0;
      const X = lerp(JEEP.X + 40, land.X, cf), Z = lerp(-900, land.Z, cf), Y = lerp(1980, 70, cf) + 900 * Math.sin(cf * Math.PI) * 0.6 + bounce;
      const q = PJ(cc, X, Y, Z); if (q) { if (cf >= 1) { gg.fillStyle = 'rgba(80,50,40,0.25)'; ell(gg, q[0], q[1] + 40 * q[2], 200 * q[2], 50 * q[2]); gg.fill(); } capSprite(gg, q[0], q[1], q[2] * 0.62, lerp(0, 3.6, cf) + 0.2, cf < 1 ? Math.cos(cf * 9) : 0.8); }
    } };
    // the boy: in from the right, down for the cap, up with it, looking after the jeep
    const walkIn = sstep(38.9, 39.95, t), bend = winK(t, 39.95, 40.12, 40.3, 40.5), hold = t > 40.2;
    const boy = { X: lerp(400, land.X + 260, walkIn), Z: lerp(-2700, land.Z - 120, walkIn), draw(gg, cc) {
      if (t < 38.9) return;
      const po = { walk: walkIn > 0 && walkIn < 1 ? 1 : 0, phase: t * 9, legs: true, rim: 1, lean: 0.5 * bend, headBob: 120 * bend, scale: 0.72, look: [0, 2],
        arms: { l: hold ? { a1: 0.5, a2: 1.0, hand: 'grip', w: 1 } : { a1: 0.2 + 0.5 * bend, a2: 0.2, hand: 'open', w: 1 } } };
      const v = drawPerson(gg, cc, BOY, this.X, 0, this.Z, t < 40.55 ? -Math.PI / 2 - 0.3 : Math.PI - 0.15, po);
      if (v && hold) { const s = v.s * 0.72, wo = { ...po, yaw: clamp(v.yaw * 0.9, -0.95, 0.95), back: !v.front }, w = wristOf(wo, -1); capSprite(gg, v.x + (w.x - 30) * s, v.y - 1594 * s + (w.y + 60) * s, s * 0.8, -0.4, 0.8); }
    } };
    steps(g, c, t, { row: false, thief: {}, extra: [{ X: JEEP.X, Z: JEEP.Z + 900, draw: (gg, cc) => jeepDraw(gg, cc, t) }, man, cop, capObj, boy] });
    vignette(g, 0.55);
    return 0;
  }

  // ================================================================ shot 13 · the end. His cap and the bag off the pile; the cap on; the tip; into the sea of caps
  const END_CAM = [[T.end0, 150, 1500, -900, -0.32, 0.02, 0], [T.capOn, -420, 1520, -420, -0.42, 0.02, 0], [44.5, -470, 1530, -320, -0.42, 0.02, 0], [45.3, -600, 2400, -200, -0.3, 0.3, 0], [T.end, -500, 5000, 1700, -0.05, 1.24, 0]];
  function endThief(t) {
    const walk = sstep(T.end0, 41.85, t), at = { X: -760, Z: 820 };
    let X = lerp(150, at.X, walk), Z = lerp(1200, at.Z, walk);
    const away = sstep(44.55, 45.8, t); X = lerp(X, -500, away); Z = lerp(Z, 2700, away);
    const toCam = Math.atan2(-420 - X, -(-420 - Z)), toPile = Math.atan2(PILE.X - X, -(PILE.Z - Z));
    let a = t < 41.85 ? Math.atan2(at.X - 150, -(at.Z - 1200)) : t < 42.95 ? toPile : lerp(toPile, toCam, sstep(42.95, 43.3, t));
    if (away > 0) a = lerp(toCam, Math.atan2(-500 - at.X, -(2700 - at.Z)), sstep(44.5, 44.75, t));
    const o = { walk: (walk > 0 && walk < 1) || (away > 0 && away < 1) ? 1 : 0, phase: t * 7, legs: true, rim: 1, hands: { r: 'glass' }, glassK: 0.55, look: [0, 2], smile: 0.1, close: blinkAt(t, 4, 3.4) };
    const drink = winK(t, 41.85, 42.0, 42.2, 42.32), setDown = winK(t, 42.3, 42.42, 42.5, 42.6), hasGlass = t < 42.5;
    const bend = winK(t, 42.55, 42.72, 42.85, 43.0), capUp = sstep(43.05, 43.6, t), seat = sstep(43.6, 43.75, t), tip = winK(t, 43.95, 44.1, 44.3, 44.45);
    o.tilt = -0.18 * drink; o.lean = 0.42 * bend; o.headBob = 60 * bend;
    if (hasGlass) o.arms = { r: { ...armIK(o, 1, lerp(lerp(240, 40, drink), 520, setDown), lerp(lerp(430, 120, drink), 800, setDown), 46), hand: 'glass', w: 1 } };
    else o.arms = { r: { a1: 0.45, a2: 1.2, hand: 'fist', w: 1 } };                  // the bag under his arm
    // his other hand: down to the pile for the cap, up to his head with it, then the tip of the brim
    const capT = [lerp(-300, -380, bend), lerp(600, 1050, bend)];
    let tx = capT[0], ty = capT[1];
    if (t > 43.0) { tx = lerp(-260, -190, capUp); ty = lerp(500, -170, capUp); }
    if (t > 43.75) { tx = lerp(-190, -330, sstep(43.75, 43.9, t)); ty = lerp(-170, 520, sstep(43.75, 43.9, t)); }
    if (tip > 0) { tx = lerp(-330, -150, tip); ty = lerp(520, -250, tip); }
    if (t > 42.6) o.arms.l = { ...armIK(o, -1, tx, ty, 46), hand: tip > 0.3 ? 'point' : t < 43.75 ? 'grip' : 'relax', w: 1 };
    o.cap = t < 43.0 ? 0 : seat >= 1 ? 1 : 0;
    o.capHeld = t > 42.8 && seat < 1;
    o.bag = t > 42.85;
    o.smirk = 0.6 * sstep(43.8, 44.2, t); o.smile = 0.1 + 0.25 * sstep(43.8, 44.2, t);
    o.headYaw = 0; o.tiltTip = tip;
    return { X, Z, a, o, hasGlass };
  }
  function shotEnd(g, t) {
    const c = camK(t, END_CAM), e = 30;
    const th = endThief(t);
    const glassObj = { X: CART.X + 200, Z: CART.Z, draw(gg, cc) { if (th.hasGlass) return; const { T3 } = cartGeom(30), P = T3(CART.X + 760, 700, CART.Z - 100), q = PJ(cc, ...P); if (q) glass(gg, q[0], q[1] - 70 * q[2], q[2] * 0.55, 0); } };
    const him = { X: th.X, Z: th.Z, draw(gg, cc) {
      const tk = sstep(0.75, 1.1, cc.pitch);
      if (tk > 0.001) { gg.save(); gg.globalAlpha *= tk; topDraw(gg, cc, th.X, th.Z, th.a, TEAL.a, th.o.cap, 1, THIEF.skin); gg.restore(); }
      if (tk > 0.999) return;
      gg.save(); gg.globalAlpha *= 1 - tk; this.body(gg, cc); gg.restore();
    }, body(gg, cc) {
      const P = th.o.cap ? THIEF0 : THIEFB, v = drawPerson(gg, cc, P, th.X, 0, th.Z, th.a, th.o); if (!v) return;
      const s = v.s, wo = { ...th.o, yaw: clamp(v.yaw * 0.9, -0.95, 0.95), back: !v.front };
      if (th.o.capHeld) { const w = wristOf(wo, -1), dir = [-Math.sin(w.ang), Math.cos(w.ang)]; capSprite(gg, v.x + (w.x + dir[0] * 80) * s, v.y - 1594 * s + (w.y + dir[1] * 80 - 60) * s, s, 0.2 - 0.2 * sstep(43.05, 43.6, t), 0.9); }
      if (th.o.bag) { const w = wristOf(wo, 1); redBag(gg, v.x + (w.x - 40) * s, v.y - 1594 * s + (w.y - 160) * s, s * 0.9, 0.5); }
    } };
    const top = sstep(0.75, 1.1, c.pitch);
    gully(g, c, e, { post: true, thief: false, capGone: t > 42.8, bagGone: t > 42.85, extra: [glassObj, him], topK: top });
    vignette(g, 0.5);
    return 0;
  }

  // someone seen from above (the crane at the end): shoulders in their shirt, the head, and a cap with its brim pointing where they face
  function topDraw(g, c, X, Z, a, shirt, capped, tall, skin) {
    const p = PJ(c, X, 1594 * tall + 240, Z), f = PJ(c, X + Math.sin(a) * 300, 1594 * tall + 240, Z - Math.cos(a) * 300); if (!p || !f) return;
    const s = p[2], ang = Math.atan2(f[1] - p[1], f[0] - p[0]);
    g.save(); g.translate(p[0], p[1]); g.rotate(ang);
    g.fillStyle = 'rgba(60,30,30,0.22)'; ell(g, -60 * s, 70 * s, 300 * s, 170 * s); g.fill();
    g.fillStyle = mix(shirt, '#3a2a2a', 0.35); ell(g, -20 * s, 0, 120 * s, 250 * s); g.fill();
    if (capped) { g.fillStyle = '#4a111b'; ell(g, 150 * s, 0, 95 * s, 125 * s); g.fill(); g.fillStyle = lg(g, -150 * s, -150 * s, 150 * s, 150 * s, [0, '#a32b3d'], [1, '#6a1824']); ell(g, 0, 0, 160 * s, 160 * s); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = Math.max(1, 6 * s); g.beginPath(); g.moveTo(-150 * s, 0); g.lineTo(150 * s, 0); g.stroke(); g.fillStyle = 'rgba(255,200,170,0.22)'; ell(g, -50 * s, -40 * s, 50 * s, 30 * s); g.fill(); }
    else { g.fillStyle = skin || '#15100c'; ell(g, 0, 0, 125 * s, 125 * s); g.fill(); }
    g.restore();
  }

  // ================================================================ the film
  function frame(g, t) {
    if (t < T.chase0) return shotHook(g, t);
    if (t < T.map0) return shotChase(g, t);
    if (t < T.lane2) return shotMap(g, t);
    if (t < T.gully0) return shotLane2(g, t);
    if (t < T.line0) return shotGully(g, t);
    if (t < T.rew0) return shotLine(g, t);
    if (t < T.rew1) return shotRewind(g, t);
    if (t < T.l10) return shotReplay(g, t);
    if (t < T.jeep0) return shotSweep(g, t);
    if (t < T.end0) return shotJeep(g, t);
    return shotEnd(g, t);
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
