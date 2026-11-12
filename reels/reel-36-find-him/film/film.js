// Reel 36 · Find Him (working title). Tests desk, "You're the test subject", built around Season 1's thief: the man with the mole and
// the maroon cap. You get two seconds to learn his face, frozen mid-snatch at the chai stall. "This time, he's in the line": five men behind
// a police shutter, three in maroon caps, two bareheaded. Whoever you pick goes to jail. He's number four: he pulls his cap out of his back
// pocket and puts it on. Same face. Just a cap. You were looking for the cap; whoever you picked goes to jail, for a cap, unless you saw the
// mole. Facts: docs/research.md. The script: docs/script.md.
// The face rig and the bodies are reels 20–34's (three-quarter heads, walking bodies); new here: a cap that comes on and off (the hair under it
// springs up as it lifts), his bald head under it, the line-up room behind a rolling shutter, the walk along the line, the reveal.
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
    const ear = (k, x, cz) => { const w = 25 * (0.55 + 0.45 * clamp(1 - Math.abs(cz) * 1.6)); ell(g, x + k * 1, -18, w, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); ell(g, x + k * 3 * (w / 25), -16, w * 0.48, 24, k * 0.08); g.fillStyle = L.skinD; g.fill(); };
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
      const big = L.must === 'thick', mid = L.must === 'mid', th = big ? 24 : mid ? 18 : 13, w = big ? 64 : mid ? 58 : 52;
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
        g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 4, -128); g.bezierCurveTo(-hw - 6, -60, -110, -20, 0, -18); g.bezierCurveTo(110, -20, hw + 6, -60, hw + 4, -128); g.lineTo(hw - 14, -128); g.bezierCurveTo(hw - 24, -90, 90, -66, 0, -64); g.bezierCurveTo(-90, -66, -hw + 24, -90, -hw + 14, -128); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,222,165,0.4)'; g.lineWidth = 14; g.beginPath(); g.arc(-40, -10, hw * 0.9, Math.PI * 0.95, Math.PI * 1.35); g.stroke();
      } else { g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 2, -60); g.bezierCurveTo(-hw - 6, 60, -90, 150, 0, 150); g.bezierCurveTo(90, 150, hw + 6, 60, hw + 2, -60); g.closePath(); g.fill(); }
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

  // ------------------------------------------------------------------ the cast
  // The season's thief keeps reel 20's face: the skin, the thin moustache, the stubble, the brows, the mole on his left cheek (the screen's
  // right when he faces you). New: under the cap he's bald on top, with dark hair at the sides (the sideburns every episode drew under it).
  // The four others share his skin and his age; they differ in jaw, brows, eyes, nose and, under the caps, hair. Never in colour (the desk).
  const SKIN = { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72' };
  const THIEF = { ...SKIN, hair: '#15100c', style: 'bald', capped: true, must: 'thin', stub: 0.55, brow: 15, browTilt: 8, jaw: 0.98, ew: 43, eh: 22, mole: [84, 62], moleR: 11.5 };
  const M1 = { ...SKIN, hair: '#17110d', style: 'curls', capped: true, must: 'thin', stub: 0.6, brow: 19, browTilt: 3, jaw: 1.05, ew: 44, eh: 23 };
  // number two has no cap, but his hair has a cap's dent in it: the decoy for "he took his cap off" (a cold reader: one bare head among caps
  // was the planted answer)
  const M2 = { ...SKIN, hair: '#15100c', style: 'part', hatHair: true, capped: false, must: 'thin', stub: 0.5, brow: 15, browTilt: 7, jaw: 0.97, ew: 48, eh: 27 };
  const M3 = { ...SKIN, hair: '#120d0a', style: 'spiky', capped: true, must: 'mid', stub: 0.55, brow: 15, browTilt: 11, jaw: 1.0, ew: 42, eh: 21, noseW: 1.28 };
  const M5 = { ...SKIN, hair: '#17110d', style: 'crew', capped: true, must: 'thin', stub: 0.45, brow: 14, browTilt: 5, jaw: 0.94, ew: 44, eh: 22, chinK: 1.12 };
  // plain T-shirts in muted, close values: nothing saffron or green, no class ladder (the desk)
  const TEE = (a, b) => ({ a, b, sleeve: 'short', leg: '#2f3442', shoe: '#1d1a17' });
  const SH = { M1: TEE('#6f7782', '#525a66'), M2: TEE('#4a5368', '#353d50'), M3: TEE('#7b6d60', '#5e5246'), M4: TEE('#5f6b78', '#46505c'), M5: TEE('#55545c', '#3d3c44'),
    THIEF0: { a: '#37a18a', b: '#237a68', collar: '#1f6a5a', sleeve: 'short', buttons: 'rgba(255,255,255,0.45)', leg: '#20262f', shoe: '#121212' } };
  const THIEF_BARE = { ...THIEF, capped: false };    // in the line his cap is in his back pocket
  const LINE = [{ L: M1, D: SH.M1 }, { L: M2, D: SH.M2 }, { L: M3, D: SH.M3 }, { L: THIEF_BARE, D: SH.M4, thief: true }, { L: M5, D: SH.M5 }];
  // how each one stands while he waits: different, and none of them a tell (hands clasped, at his belt, in his pockets, holding a wrist)
  const STANCE = [
    { l: { a1: 0.26, a2: 1.08, hand: 'fist' }, r: { a1: 0.26, a2: 1.12, hand: 'fist' }, lean: 0.0 },
    { l: { a1: 0.1, a2: 0.18 }, r: { a1: 0.1, a2: 0.16 }, lean: -0.012 },
    { l: { a1: 0.2, a2: 0.62, hand: 'fist' }, r: { a1: 0.2, a2: 0.6, hand: 'fist' }, lean: 0.01 },
    { l: { a1: 0.08, a2: 0.2 }, r: { a1: 0.12, a2: 0.26 }, lean: -0.008 },
    { l: { a1: 0.22, a2: 0.96, hand: 'fist' }, r: { a1: 0.2, a2: 0.78, hand: 'relax' }, lean: 0.006 },
  ];
  const THIEF0 = { L: THIEF, D: SH.THIEF0 };          // frame 0: the series' shirt

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
  const HZ = 690, EYE = 1400, FOC = 1000, LW = 1500, ZEND = 15000, LH = H + 760;
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
  // a few people far down the lane (women facing you, men from behind, none in a cap: nobody to mistake for him)
  const WALKERS = [
    { L: { skin: '#b57d58', skinD: '#8c5a3a', skinH: '#cc9a74', hair: '#1a1410', style: 'long', jaw: 0.92, ew: 44, eh: 24, brow: 11, browTilt: -2, braid: true }, D: { a: '#ef7fa8', b: '#cf5b86', sleeve: 'short', kameez: true, dupatta: '#ffd84a', leg: '#f3e6d8', shoe: '#8a3a2a' }, X: 700, Z: 6200, v: -260 },
    { L: { skin: '#c48a5c', skinD: '#9a6640', skinH: '#d9a47a', hair: '#1a1410', style: 'bun', jaw: 0.94, ew: 44, eh: 24, brow: 11, browTilt: 0 }, D: { a: '#4a6fd8', b: '#3554b0', sleeve: 'short', kameez: true, dupatta: '#f6efe2', leg: '#f6efe2', shoe: '#5a3a2a' }, X: -500, Z: 8800, v: -200 },
    { L: { skin: '#a8714d', skinD: '#80522f', skinH: '#c08a64', hair: '#120d0a', style: 'short', jaw: 0.95, ew: 44, eh: 24, brow: 13, browTilt: -3 }, D: { a: '#8e6fd1', b: '#6c4fae', sleeve: 'long', cuff: '#8e6fd1', leg: '#2f3442', shoe: '#e8e6e0' }, X: 200, Z: 7400, v: 240, back: true },
    { L: { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983', hair: '#17110d', style: 'short', jaw: 1.02, ew: 42, eh: 22, brow: 14, browTilt: 2 }, D: { a: '#f2c14e', b: '#d39f2c', sleeve: 'short', leg: '#3f3a36', shoe: '#2b2420' }, X: 900, Z: 10400, v: 200, back: true },
  ];
  function walkers(g, cz, tw) {
    for (const p of [...WALKERS].sort((a, b) => (b.Z + b.v * tw) - (a.Z + a.v * tw))) {
      const Z = p.Z + p.v * tw, q = P3(p.X, 0, Z, cz); if (!q || q[2] > 0.6) continue;
      figure(g, p, q[0], q[1] - 1594 * q[2], q[2], { walk: 1, phase: tw * Math.PI * 1.9 + p.X, back: !!p.back, legs: true, look: [0, 4], rim: 1 });
    }
  }

  // ------------------------------------------------------------------ world B: the line-up room behind the police shutter
  // The same units. X across, Y up, Z away from you; the men's feet at Z = 0, the back wall just behind them, the shutter's line in front.
  // The low sun comes in through the open shutter behind you, a little from your left: it lights their faces and throws their shadows up
  // and to the right on the wall behind them.
  const ZW = 330, ZF0 = -1600, ZF = ZF0, RW = 1900, RH = 2900, OPEN_H = 2350, SP = 600, INCH = 27.46;
  const XS = [-2, -1, 0, 1, 2].map((i) => i * SP);
  const RP = (rc, X, Y, Z) => { const dz = Z - rc.z; if (dz < 20) return null; const s = rc.F / dz; return [540 + (X - rc.x) * s, rc.hz + (rc.eye - Y) * s, s]; };
  const WALL = '#efe2c6', DADO = '#5f8f9a', FLOORC = '#a39a8b';
  function roomBack(g, rc, t) {
    const P = (X, Y, Z) => RP(rc, X, Y, Z);
    const q = (pts, fill) => poly(g, pts.map((p) => P(...p)), fill);
    const ZF = Math.max(ZF0, rc.z + 60);           // inside the room, its near edge is just in front of you
    const wallPts = [[-RW, 0, ZW], [RW, 0, ZW], [RW, RH, ZW], [-RW, RH, ZW]];
    q(wallPts, WALL);
    // the wall's light: warm from your left, falling off to the right and up into the corners
    if (poly(g, wallPts.map((p) => P(...p)), null)) {
      const a = P(-RW, 1400, ZW), b = P(RW, 1400, ZW);
      g.save(); g.clip();
      g.fillStyle = lg(g, a[0], 0, b[0], 0, [0, 'rgba(255,196,120,0.26)'], [0.55, 'rgba(255,196,120,0.06)'], [1, 'rgba(70,40,30,0.14)']); g.fillRect(-2000, -2000, W + 4000, H + 4000);
      const c = P(-400, 1700, ZW); g.fillStyle = rg(g, c[0], c[1], 10, 1400 * c[2], [0, 'rgba(255,230,180,0.22)'], [1, 'rgba(255,230,180,0)']); g.fillRect(-2000, -2000, W + 4000, H + 4000);
      g.restore();
    }
    q([[-RW, 0, ZW], [RW, 0, ZW], [RW, 1050, ZW], [-RW, 1050, ZW]], DADO);
    q([[-RW, 1050, ZW], [RW, 1050, ZW], [RW, 1090, ZW], [-RW, 1090, ZW]], '#3f6b75');
    q([[-RW, 0, ZF], [RW, 0, ZF], [RW, 0, ZW], [-RW, 0, ZW]], FLOORC);
    q([[-RW, 0, ZF], [-RW, 0, ZW], [-RW, RH, ZW], [-RW, RH, ZF]], '#e2cfa8');
    q([[RW, 0, ZF], [RW, 0, ZW], [RW, RH, ZW], [RW, RH, ZF]], '#c9b590');
    q([[-RW, RH, ZF], [RW, RH, ZF], [RW, RH, ZW], [-RW, RH, ZW]], '#c3b393');
    // the floor's light: the doorway's warm patch, brightest near you
    const f0 = P(-RW, 0, ZF), f1 = P(RW, 0, ZF), f2 = P(RW, 0, ZW), f3 = P(-RW, 0, ZW);
    if (poly(g, [f0, f1, f2, f3], null)) { g.fillStyle = lg(g, 0, f0[1], 0, f3[1], [0, 'rgba(255,214,150,0.5)'], [1, 'rgba(255,214,150,0.08)']); g.fill(); }
    // the height chart: a line every three inches from 4 ft 6 to 7 ft, heavier at each half foot, the feet marked at both ends
    for (let inch = 54; inch <= 84; inch += 3) {
      const Y = inch * INCH, ft = inch % 12 === 0, half = inch % 6 === 0, p0 = P(-RW + 160, Y, ZW - 2), p1 = P(RW - 160, Y, ZW - 2); if (!p0 || !p1) continue;
      g.strokeStyle = ft ? 'rgba(34,30,28,0.72)' : half ? 'rgba(34,30,28,0.42)' : 'rgba(34,30,28,0.18)'; g.lineWidth = Math.max(1, (ft ? 12 : half ? 7 : 4) * p0[2]);
      g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
      if (half) { const lab = ft ? `${inch / 12}'` : `${Math.floor(inch / 12)}'6"`; for (const X of [-RW + 260, RW - 260]) { const pp = P(X, Y + 22, ZW - 2); txt(g, lab, pp[0], pp[1], (ft ? 104 : 70) * pp[2], 'rgba(34,30,28,0.8)', { align: 'center', kind: 'semi' }); } }
    }
    XS.forEach((X, i) => { const p = P(X, 2560, ZW - 2); if (p) txt(g, String(i + 1), p[0], p[1], 230 * p[2], 'rgba(34,30,28,0.82)', { align: 'center', kind: 'semi' }); });
    // a tube light high on the wall, off, and a ceiling fan turning slowly
    const L0 = P(-520, 2780, ZW - 2), L1 = P(520, 2720, ZW - 2); if (L0 && L1) { R(g, L0[0], L0[1], L1[0] - L0[0], L1[1] - L0[1], 6 * L0[2]); g.fillStyle = '#f6f1e6'; g.fill(); }
    const fc = P(0, RH - 260, -500);
    if (fc && fc[1] > -200) {
      const s = fc[2]; g.save(); g.translate(fc[0], fc[1]);
      g.strokeStyle = '#4a4440'; g.lineWidth = Math.max(1, 26 * s); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -260 * s); g.stroke();
      for (let k = 0; k < 3; k++) { const a = t * 1.3 + k * TAU / 3, dx = Math.cos(a) * 760 * s, dy = Math.sin(a) * 120 * s; g.fillStyle = '#5b544e'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(dx * 0.5 - dy * 0.3, dy * 0.5 + 18 * s, dx, dy); g.quadraticCurveTo(dx * 0.5 + dy * 0.3, dy * 0.5 - 18 * s, 0, 0); g.fill(); }
      g.fillStyle = '#3b3632'; ell(g, 0, 0, 70 * s, 34 * s); g.fill();
      g.restore();
    }
  }
  // the five men in the line: who they are, how they stand, where their eyes go (they watch you as you pass, a beat behind)
  function lineMan(i, t, rc, o = {}) {
    const X = XS[i], p = RP(rc, X, 1594, 0); if (!p) return null;
    const lagX = o.lagX ?? rc.x;
    const toward = clamp((lagX - X) / 1300, -1, 1);
    const md = (o.mood && o.mood(i, t)) || {};
    const st = STANCE[i];
    const pose = {
      walk: 0, legs: true, breath: 3 * Math.sin(t * TAU * 0.27 + i * 1.9), lean: md.lean ?? st.lean,
      headYaw: md.headYaw ?? (0.42 * toward + 0.04 * NC(t * 0.4 + i * 3)), look: md.look || [13 * toward + 3 * NB(t * 0.9 + i * 7), 3],
      close: md.close ?? blinkAt(t, i, 3.1 + i * 0.23), closeR: md.closeR, frown: md.frown ?? [0.18, 0.1, 0.22, 0.12, 0.16][i], worry: md.worry ?? [-3, -6, -2, -1, -4][i],
      smile: md.smile ?? 0, smirk: md.smirk ?? 0, browUp: md.browUp ?? 0, tilt: md.tilt ?? 0.012 * Math.sin(t * 0.7 + i), cap: md.cap, handFront: md.handFront, yaw: md.yaw ?? 0.08 * toward,
      arms: md.arms ? { l: md.arms.l || st.l, r: md.arms.r || st.r } : { l: st.l, r: st.r }, rim: 1,
    };
    return { X, p, pose };
  }
  function lineUp(g, rc, t, o = {}) {
    roomBack(g, rc, t);
    const men = [];
    for (let i = 0; i < 5; i++) { const m = lineMan(i, t, rc, o); if (m) men.push([i, m]); }
    // their shadows on the wall: the same men, drawn once more as one soft silhouette layer, up and to the right
    const sb = buf(3), sg = sb.getContext('2d');
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalAlpha = 1; sg.filter = 'none'; sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W, H);
    for (const [i, m] of men) {
      const sp = RP(rc, m.X + 170, 1594 + 50, ZW - 4); if (!sp) continue;
      if (sp[0] < -500 || sp[0] > W + 500) continue;
      figure(sg, LINE[i], sp[0], sp[1], sp[2] * 1.02, m.pose);
    }
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgba(64,40,34,0.3)'; sg.fillRect(0, 0, W, H); sg.globalCompositeOperation = 'source-over';
    g.save(); const wp = [[-RW, 0, ZW], [RW, 0, ZW], [RW, RH, ZW], [-RW, RH, ZW]].map((p) => RP(rc, ...p));
    if (poly(g, wp, null)) { g.clip(); const ws = (RP(rc, 0, 0, ZW) || [0, 0, 0.3])[2]; g.filter = `blur(${(3 + 4 * ws).toFixed(1)}px)`; g.drawImage(sb, 0, 0); }
    g.restore();
    // contact shadows on the floor
    for (const [, m] of men) { const f = RP(rc, m.X, 0, 0); if (!f) continue; g.fillStyle = 'rgba(50,34,28,0.28)'; ell(g, f[0] + 40 * f[2], f[1], 330 * f[2], 60 * f[2]); g.fill(); }
    // the men: nearest the camera's line of sight last
    men.sort((a, b) => Math.abs(XS[b[0]] - rc.x) - Math.abs(XS[a[0]] - rc.x));
    for (const [i, m] of men) {
      const [x, y, s] = m.p;
      if (x < -420 * s - 100 || x > W + 420 * s + 100) continue;
      figure(g, LINE[i], x, y, s, m.pose);
    }
    // the light through the doorway: two soft shafts and the dust turning in them
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [x0, w, al] of [[-120, 340, 0.07], [260, 200, 0.05]]) { g.fillStyle = lg(g, x0, 0, x0 + 700, H, [0, `rgba(255,214,150,${al})`], [1, 'rgba(255,214,150,0)']); g.beginPath(); g.moveTo(x0, -40); g.lineTo(x0 + w, -40); g.lineTo(x0 + w + 900, H + 40); g.lineTo(x0 + 900, H + 40); g.closePath(); g.fill(); }
    const r = mulberry32(3671);
    for (let k = 0; k < 40; k++) { const x0 = r() * W, y0 = r() * H, sp = 10 + r() * 20; const x = ((x0 - rc.x * 0.35) % W + W * 2) % W, y = ((y0 - t * sp) % H + H) % H; g.fillStyle = `rgba(255,236,190,${0.18 + 0.2 * Math.sin(t * 1.7 + k)})`; ell(g, x, y, 2.2, 2.2); g.fill(); }
    g.restore();
    // a rope on posts between you and them, close and soft: it slides past faster than they do
    if (o.rail !== false) {
      const top = 1270, zr = -520, sag = 120, step = 900;
      const a = RP(rc, -RW, top, zr);
      if (a && a[1] < H + 60) {
        g.save(); g.filter = 'blur(5px)';
        for (let X = -RW; X < RW; X += step) {
          const p0 = RP(rc, X, top, zr), p1 = RP(rc, X + step, top, zr), pm = RP(rc, X + step / 2, top - sag * 2, zr); if (!p0 || !p1 || !pm) continue;
          if (p1[0] < -200 || p0[0] > W + 200) continue;
          g.lineCap = 'round'; g.strokeStyle = '#b8202c'; g.lineWidth = 34 * p0[2]; g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo(pm[0], pm[1], p1[0], p1[1]); g.stroke();
          g.setLineDash([22 * p0[2], 26 * p0[2]]); g.strokeStyle = '#f4efe6'; g.lineWidth = 30 * p0[2]; g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo(pm[0], pm[1], p1[0], p1[1]); g.stroke(); g.setLineDash([]);
        }
        for (let X = -RW; X <= RW; X += step) { const p = RP(rc, X, top, zr); if (!p || p[0] < -100 || p[0] > W + 100) continue; g.fillStyle = lg(g, p[0] - 30 * p[2], 0, p[0] + 30 * p[2], 0, [0, '#6c7178'], [0.45, '#e8ebee'], [1, '#585c63']); g.fillRect(p[0] - 26 * p[2], p[1] - 40 * p[2], 52 * p[2], H); ell(g, p[0], p[1] - 40 * p[2], 40 * p[2], 22 * p[2]); g.fill(); }
        g.restore();
      }
    }
  }
  // the shutter: grey slats with POLICE painted across them, rolled up by u (0 down, 1 up), and the building's front round it
  function shutter(g, rc, u) {
    const P = (X, Y, Z) => RP(rc, X, Y, Z);
    const F = (pts, fill) => poly(g, pts.map((p) => P(...p)), fill);
    const bottom = lerp(0, OPEN_H, u);
    F([[-4200, -10, ZF], [-RW, -10, ZF], [-RW, 4200, ZF], [-4200, 4200, ZF]], '#e7c98f');
    F([[RW, -10, ZF], [4200, -10, ZF], [4200, 4200, ZF], [RW, 4200, ZF]], '#e7c98f');
    F([[-RW, OPEN_H, ZF], [RW, OPEN_H, ZF], [RW, 4200, ZF], [-RW, 4200, ZF]], '#e7c98f');
    F([[-RW, OPEN_H, ZF - 2], [RW, OPEN_H, ZF - 2], [RW, OPEN_H + 260, ZF - 2], [-RW, OPEN_H + 260, ZF - 2]], '#8d9197');
    for (const X of [-RW, RW]) F([[X - 60, 0, ZF - 3], [X + 60, 0, ZF - 3], [X + 60, OPEN_H + 260, ZF - 3], [X - 60, OPEN_H + 260, ZF - 3]], '#6f747b');
    if (bottom < OPEN_H - 1) {
      const body = [[-RW, bottom, ZF - 1], [RW, bottom, ZF - 1], [RW, OPEN_H, ZF - 1], [-RW, OPEN_H, ZF - 1]];
      F(body, '#a3a8ae');
      g.save(); F(body, null); g.clip();
      for (let y = bottom; y < OPEN_H + 120; y += 110) { const a = P(-RW, y, ZF - 1), b = P(RW, y + 26, ZF - 1); g.fillStyle = '#82878e'; g.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]); const c = P(-RW, y + 60, ZF - 1), d = P(RW, y + 70, ZF - 1); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(c[0], d[1], d[0] - c[0], c[1] - d[1]); }
      const m = P(0, bottom + 1050, ZF - 1); txt(g, 'POLICE', m[0], m[1], 560 * m[2], '#f4f1e8', { align: 'center', kind: 'cond', ls: 10 });
      const r = mulberry32(3650); g.fillStyle = 'rgba(120,70,40,0.25)'; for (let i = 0; i < 26; i++) { const p = P(-RW + r() * 2 * RW, bottom + r() * OPEN_H, ZF - 1); ell(g, p[0], p[1], 40 * p[2] * (0.4 + r()), 10 * p[2]); g.fill(); }
      g.restore();
      const e = P(-RW, bottom, ZF - 1), f = P(RW, bottom, ZF - 1); g.fillStyle = '#5a5f66'; g.fillRect(e[0], e[1] - 16 * e[2], f[0] - e[0], 28 * e[2]);
    }
    F([[-4200, 0, ZF - 2600], [4200, 0, ZF - 2600], [4200, 0, ZF], [-4200, 0, ZF]], '#cdb38c');
  }

  // ------------------------------------------------------------------ props
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
    glass(g, -20, -40, 0.95, fill);
    g.fillStyle = lg(g, -130, -40, 160, 160, [0, '#d6a07a'], [1, '#a9744f']);
    ell(g, 120, 50, 120, 100, -0.3); g.fill();
    for (let i = 0; i < 4; i++) { R(g, -70 + i * 6, -20 + i * 34, 170, 34, 17); g.fill(); }
    g.fillStyle = 'rgba(255,232,200,0.22)'; for (let i = 0; i < 4; i++) { ell(g, 30 + i * 6, -10 + i * 34, 30, 7); g.fill(); }
    g.restore();
  }
  function bars(g, x0, k, t) {                       // a cell door's bars, sliding shut from the right; x0: its leading edge
    g.save();
    for (let i = 0; i < 9; i++) { const x = x0 + i * 150; if (x > W + 60) break; g.fillStyle = lg(g, x - 22, 0, x + 22, 0, [0, '#16181c'], [0.35, '#6f747d'], [0.55, '#a3a8b0'], [1, '#1c1e23']); g.fillRect(x - 22, -40, 44, H + 80); }
    for (const yy of [430, 1420]) { g.fillStyle = lg(g, 0, yy - 26, 0, yy + 26, [0, '#16181c'], [0.4, '#7c818a'], [1, '#1c1e23']); g.fillRect(x0 - 40, yy - 26, W + 80, 52); }
    g.restore();
  }

  // ------------------------------------------------------------------ timing (the motion test's estimates; the placed voice replaces them)
  const T = {
    l1: 0.05, l1e: 2.2,                 // "You've got two seconds to learn his face."
    unf: 2.2,                           // time starts again: he rips the bag free and runs
    whip: 2.62, line0: 2.95,            // the camera whips after him; the shutter
    shut0: 3.22, shut1: 3.86,           // it rattles up
    l2: 3.0, l2e: 4.45,                 // "This time, he's in the line."
    l3: 4.7, l3e: 6.15,                 // "Whoever you pick goes to jail."
    in0: 5.6, clock0: 6.3, clock1: 11.3,
    l4: 11.5, l4e: 12.35,               // "He's number four."
    rev0: 11.3, capOn: 11.62,
    l5: 13.25, l5b: 13.95, l5e: 14.75,  // "Same face. Just a cap."
    l6: 15.0, l6e: 16.45,               // "You were looking for the cap."
    l7: 16.9, l7e: 18.35, l7b: 18.7, l7be: 19.3,   // "Whoever you picked goes to jail." "For a cap."
    l8: 19.95, l8e: 21.2,               // "Unless you saw the mole."
    l9: 21.6, l9e: 25.0,                // "You'd know a friend in any cap. A stranger, the cap is half of him."
    l10: 25.4, l10e: 29.0,              // "So show this to someone who's never seen him. Don't mention the mole."
    tap: 29.1, wink: 29.75, end: 31.5,
  };
  T.blink0 = T.l5 - 0.05; T.off0 = T.l6 - 0.05; T.cell0 = T.l7b - 0.12; T.mole0 = T.l8 - 0.2;

  // ------------------------------------------------------------------ shot 1 · frame 0: the snatch, frozen. Two seconds to learn his face.
  // The world is still: dust, petals, chai in the air. The camera drifts in through it. At 0.00 time starts again and he's gone.
  const F0 = { x: 600, y: 930, s: 1.42 };                                     // his head on frame 0
  const MOTES = (() => { const r = mulberry32(3660), out = []; for (let i = 0; i < 46; i++) out.push({ x: r() * W, y: 200 + r() * 1500, z: 0.4 + r() * 1.4, k: r() < 0.22 ? 'petal' : 'mote', rot: r() * 3, c: r() < 0.5 ? '#f39a1e' : '#f7c52b', v: 20 + r() * 50 }); return out; })();
  function freezeClock(t) { return t < T.unf ? 0 : t - T.unf; }              // seconds since time started again
  function thiefSnatch(t) {                           // his pose on frame 0 and through the bolt
    const d = freezeClock(t), yank = sstep(0, 0.2, d), turn = sstep(0.1, 0.36, d), run = sstep(0.18, 0.72, d);
    const x = F0.x + 1150 * Math.pow(run, 1.6) - 30 * yank, y = F0.y + 40 * run, s = F0.s * (1 + 0.3 * run);
    const orbit = sstep(0, T.unf, Math.min(t, T.unf));     // the camera arcs round him through the frozen two seconds
    const o = {
      yaw: lerp(lerp(-0.4, -0.26, orbit), 0.85, turn), headYaw: lerp(lerp(-0.05, 0.13, orbit), 0.2, turn), back: turn > 0.55, faceMix: 1 - sstep(0.4, 0.62, turn), look: [lerp(-5, 0, turn), 2], frown: 0.28, worry: -3, op: 0.05 + 0.12 * yank,
      walk: run, phase: d * 15, legs: false, cap: 1, close: 0, tilt: -0.03 + 0.05 * yank, rim: 1,
      arms: { r: { a1: lerp(0.3, 0.9, run), a2: lerp(0.8, 1.4, run) } },
    };
    // his right fist (the screen's left) holds the bag's strap up by his chest, pulling it off her shoulder; the yank brings it in
    const tgt = [lerp(-262, -150, yank), lerp(300, 330, yank)];
    o.arms.l = { ...armIK(o, -1, tgt[0], tgt[1], 46), hand: 'fist' };
    return { x, y, s, o };
  }
  function shotFreeze(g, t) {
    const d = freezeClock(t), tw = t < T.unf ? 0.02 * t : 0.04 + d;         // the world's own clock: crawling, then running
    const push = sstep(0, T.unf, Math.min(t, T.unf)), whip = sstep(T.whip, T.line0, t);
    const sh = shakeAt(t, [[T.unf + 0.12, 16], [T.unf + 0.36, 22]]);
    const pan = -900 * Math.pow(whip, 1.4);
    // the lane behind him, soft (he's close; the street is far)
    const bg = buf(0), gb = bg.getContext('2d');
    gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalAlpha = 1; gb.filter = 'none'; gb.globalCompositeOperation = 'source-over'; gb.clearRect(0, 0, W, H);
    gb.save(); gb.translate(sh[0] * 0.4 + pan * 0.5 + 90 * push, sh[1] * 0.4); gb.translate(540, 880); gb.scale(1 + 0.03 * push, 1 + 0.03 * push); gb.translate(-540, -880); gb.translate(0, 150);
    CAMX = 200; world(gb, 1400, tw); walkers(gb, 1400, tw + 3); light(gb, tw);
    CAMX = 0; gb.restore();
    g.save(); g.filter = 'blur(5px)'; g.drawImage(bg, 0, 0); g.restore();
    g.fillStyle = 'rgba(255,190,120,0.10)'; g.fillRect(0, 0, W, H);
    const z = 1 + 0.085 * push;
    g.save(); g.translate(sh[0] + pan, sh[1]); g.translate(F0.x, 860); g.scale(z, z); g.translate(-F0.x, -860);
    // the chai stall's tarp, close over you, and its bulbs
    g.save(); g.translate(-30 * push, 0);
    g.fillStyle = lg(g, 0, 180, 0, 330, [0, '#2b6fb3'], [1, '#1f4f82']); g.beginPath(); g.moveTo(-200, 120); g.lineTo(1300, 120); g.lineTo(1300, 230);
    for (let i = 0; i <= 9; i++) { const x = 1300 - i * 166; g.quadraticCurveTo(x - 83, 330, x - 166, 250); } g.lineTo(-200, 120); g.closePath(); g.fill();
    for (let i = 0; i < 8; i++) { const x = 40 + i * 150, y = 300 + 26 * Math.sin(i * 1.1); g.strokeStyle = 'rgba(30,25,20,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 240); g.lineTo(x, y - 14); g.stroke(); bulb(g, x, y, 0.55, 0.9); }
    g.restore();
    // the woman, at the frame's edge: her shoulder and her arm, her dupatta, the strap leaving her
    const th = thiefSnatch(t), yank = sstep(0, 0.2, d);
    g.save(); g.translate(-40 - 70 * yank, 10 * yank);
    g.fillStyle = lg(g, -100, 980, 200, 1700, [0, '#4f7fe0'], [1, '#2f58b0']);
    g.beginPath(); g.moveTo(-140, 1000); g.bezierCurveTo(30, 960, 150, 1030, 168, 1160); g.lineTo(196, 1800); g.lineTo(-140, 1800); g.closePath(); g.fill();
    g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(-140, 1060); g.quadraticCurveTo(80, 1030, 150, 1140); g.lineTo(136, 1230); g.quadraticCurveTo(50, 1120, -140, 1150); g.closePath(); g.fill();
    g.restore();
    // him, mid-snatch
    figure(g, THIEF0, th.x, th.y, th.s, th.o);
    // the bag, hanging from his fist; its strap still round her shoulder until the yank
    const w = wristOf(th.o, -1), dir = [-Math.sin(w.ang), Math.cos(w.ang)];
    const fx = th.x + (w.x + dir[0] * 46) * th.s, fy = th.y + (w.y + dir[1] * 46) * th.s;
    const bagX = fx - 10 + 18 * Math.sin(d * 10) * yank, bagY = fy + 150 + 30 * yank;
    const shX = lerp(70, fx - 40, yank), shY = lerp(1040, fy + 30, yank);
    g.strokeStyle = '#7a0f18'; g.lineWidth = 13; g.lineCap = 'round';
    g.beginPath(); g.moveTo(bagX - 60, bagY - 60); g.quadraticCurveTo((bagX + shX) / 2 - 40, Math.max(bagY, shY) - 40, shX, shY); g.stroke();
    g.beginPath(); g.moveTo(bagX + 60, bagY - 60); g.lineTo(fx, fy); g.stroke();
    redBag(g, bagX, bagY, 0.6, -0.12 + lerp(0, -0.4, yank) + 0.3 * Math.sin(d * 9) * yank);
    g.save(); g.translate(fx - dir[0] * 46 * th.s, fy - dir[1] * 46 * th.s); g.scale(th.s, th.s); g.rotate(w.ang); hand(g, 'fist', THIEF, -1, 0); g.restore();
    g.restore();
    // your chai glass, knocked out of your hand as he barges past: it tumbles across the bottom of the frame
    if (d > 0.3 && d < 0.95) {
      const u = (d - 0.3) / 0.65;
      g.save(); g.translate(lerp(980, 640, u), lerp(1700, 2150, u * u) - 260 * u * (1 - u)); g.rotate(2.6 * u); glass(g, 0, 0, 0.9, lerp(0.8, 0.2, u));
      g.restore();
      g.fillStyle = 'rgba(200,120,50,0.8)'; for (let i = 0; i < 9; i++) { const a = i * 0.7, rr = 60 + 260 * u; ell(g, lerp(980, 640, u) + Math.cos(a) * rr * 0.6, lerp(1700, 2150, u * u) - 260 * u * (1 - u) + Math.sin(a) * rr * 0.3 - 80, 9, 6); g.fill(); }
    }
    // the frozen air: dust and a few petals, kept off his face
    g.save();
    for (const m of MOTES) {
      const x = m.x + (m.z - 1) * 60 * push + m.v * 0.02 * t + (t > T.unf ? m.v * d * 2 : 0), y = m.y + 12 * Math.sin(m.rot + tw) + (t > T.unf ? m.v * d * 3 : 0);
      if (Math.hypot(x - F0.x, (y - 880) * 0.8) < 380) continue;
      if (m.k === 'petal') { g.save(); g.translate(x, y); g.rotate(m.rot + tw * 0.5); g.fillStyle = m.c; ell(g, 0, 0, 11 * m.z, 6 * m.z); g.fill(); g.restore(); }
      else { g.fillStyle = `rgba(255,236,190,${0.35 + 0.25 * Math.sin(m.rot)})`; ell(g, x, y, 2.2 * m.z, 2.2 * m.z); g.fill(); }
    }
    g.restore();
    vignette(g, 0.7);
    // the words and the clock: LEARN HIS FACE, and two seconds running out as the line is spoken
    const out = sstep(T.unf - 0.02, T.unf + 0.14, t);
    if (out < 1) {
      g.save(); g.globalAlpha = 1 - out;
      txt(g, 'LEARN HIS FACE', 513, 400, 132, CREAM, { align: 'center', fit: 860, stroke: INK, sw: 0.13 });
      const left = Math.max(0, 2 - Math.max(0, t - T.l1) * (2 / (T.unf - T.l1)));
      g.translate(540, 1440); R(g, -170, -70, 340, 132, 18); g.fillStyle = 'rgba(16,16,16,0.9)'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 5; g.stroke();
      txt(g, left.toFixed(2), 0, 38, 108, left < 0.5 ? '#ff4a30' : '#ffb347', { kind: 'mono', align: 'center' });
      g.fillStyle = 'rgba(255,255,255,0.15)'; R(g, -140, 76, 280, 12, 6); g.fill(); g.fillStyle = YEL; R(g, -140, 76, 280 * (left / 2), 12, 6); g.fill();
      g.restore();
    }
    return flashAt(t, T.unf, 18) * 0.35;
  }

  // ------------------------------------------------------------------ shot 2 · "This time, he's in the line." The shutter rattles up. Then the walk.
  function camLine(t) {                              // the room camera: the shutter, the ritual, in to number 1, along the row, back a little
    let z = lerp(-2900, -2560, sstep(T.shut0 + 0.3, T.in0 + 0.4, t)), x = 0, hz = 760;
    const inK = sstep(T.in0, T.clock0 + 0.55, t);
    z = lerp(z, -930, inK); x = lerp(0, XS[0], inK); hz = lerp(760, 900, inK);
    const w0 = T.clock0 + 0.55, w1 = T.clock1 - 0.55;
    if (t > w0) { const u = clamp((t - w0) / (w1 - w0)); x = lerp(XS[0], XS[4], u * u * (3 - 2 * u) * 0.25 + u * 0.75); }
    z = lerp(z, -1150, sstep(T.clock1 - 0.5, T.clock1 - 0.05, t));
    const bob = 6 * Math.sin(t * TAU * 1.7) * sstep(T.in0, T.in0 + 0.4, t);
    return { x, z, F: 1000, eye: 1500, hz: hz + bob };
  }
  function shotLine(g, t) {
    const rc = camLine(t);
    const fast = (t < T.line0 + 0.25) || (t > T.in0 && t < T.clock0 + 0.6);
    blurred(g, t, fast ? 5 : 1, (gg, tt) => {
      const r = camLine(tt), slide = (1 - sstep(T.line0 - 0.1, T.line0 + 0.25, tt)) * 900;
      gg.save(); gg.translate(slide, 0);
      // as the shutter goes up the sun comes in: the room brightens, and they squint at it
      const u = sstep(T.shut0, T.shut1, tt);
      lineUp(gg, r, tt, { lagX: camLine(tt - 0.22).x, rail: tt > T.in0, mood: (i, ti) => {
        const sq = winK(ti, T.shut0 + 0.3 + i * 0.05, T.shut0 + 0.46 + i * 0.05, T.shut1 + 0.25, T.shut1 + 0.8);
        return sq > 0.001 ? { close: Math.max(blinkAt(ti, i, 3.1 + i * 0.23), 0.62 * sq), worry: -6 * sq, frown: 0.3 * sq, tilt: -0.03 * sq, look: [0, 3 + 4 * sq] } : {};
      } });
      const dim = 0.55 * (1 - sstep(0.2, 1, u)); if (dim > 0.002) { gg.fillStyle = `rgba(30,22,26,${dim})`; gg.fillRect(-1000, 0, W + 2000, H); }
      shutter(gg, r, u);
      gg.restore();
    });
    vignette(g, 0.75);
    if (t > T.shut1 - 0.1) {                         // the numbers over their heads, once the shutter's up
      for (let i = 0; i < 5; i++) {
        const p = RP(rc, XS[i], 1594 + 420, 0); if (!p) continue;
        const q = pop(t, T.shut1 - 0.05 + i * 0.08); if (q <= 0) continue;
        const sz = clamp(70 + 60 * (p[2] - 0.3), 70, 112), y = Math.max(p[1], 330);
        if (p[0] < -60 || p[0] > W + 60) continue;
        g.save(); g.translate(p[0], y); g.scale(q, q); tileNo(g, 0, 0, i + 1, sz); g.restore();
      }
    }
    if (t >= T.l3 - 0.04 && t < T.clock0) { title(g, 'WHOEVER YOU PICK', 1330, 100, CREAM, t, T.l3 - 0.04); if (t >= T.l3 + 0.7) title(g, 'GOES TO JAIL', 1460, 132, '#ff5a3a', t, T.l3 + 0.7, { sw: 0.12 }); }
    if (t >= T.clock0) {
      title(g, 'WHICH ONE?', 1330, 120, CREAM, t, T.clock0, { sw: 0.12 });
      const left = Math.min(5, Math.max(0, Math.ceil(T.clock1 - t - 1e-3)));
      g.save(); g.translate(540, 1450); R(g, -110, -44, 220, 88, 12); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
      txt(g, '00:0' + left, 0, 27, 68, left <= 1 ? '#ff4a30' : '#ffb347', { kind: 'mono', align: 'center' }); g.restore();
    }
    return t < T.line0 + 0.25 ? 0 : flashAt(t, T.shut1, 9) * 0.12;
  }

  // ------------------------------------------------------------------ shot 3 · "He's number four." He pulls his cap out of his back pocket and puts it on.
  // Everything his hand does comes from his arm (armIK), and the cap is drawn where his hand is, so he really holds it.
  const HOLD = { cx: 175, cy: -50 };                // where the cap's centre sits from his fist while he holds it by its side
  function capOnPose(t) {
    const d = t - T.capOn, base = { yaw: 0, walk: 0 };
    const reach = winK(d, 0, 0.2, 0.28, 0.42), up = sstep(0.3, 0.5, d), flick = sstep(0.5, 0.62, d), lift = sstep(0.62, 0.84, d), down = sstep(0.84, 0.98, d), drop = sstep(1.08, 1.42, d);
    const st = STANCE[3].l;
    let arm = { a1: st.a1, a2: st.a2, hand: 'relax' };
    if (d > 0) {
      // behind him to his back pocket (the forearm goes away from you, so it shortens), then out with the cap, up, and down onto his head
      const back = { a1: -0.22, a2: 0.4, len: [1, 0.66], hand: 'hidden' };
      const chest = armIK(base, -1, -110, 380, 46), high = armIK(base, -1, -205, -300, 46), seat = armIK(base, -1, -186, -168, 46);
      const mixA = (a, b, u) => ({ a1: lerp(a.a1, b.a1, u), a2: lerp(a.a2, b.a2, u), len: [lerp((a.len || [1, 1])[0], (b.len || [1, 1])[0], u), lerp((a.len || [1, 1])[1], (b.len || [1, 1])[1], u)] });
      let p = mixA(arm, back, reach);
      if (d > 0.28) { p = mixA(back, chest, up); p = mixA(p, high, lift); p = mixA(p, seat, down); p = mixA(p, { a1: st.a1, a2: st.a2 }, drop); }
      arm = { ...p, hand: d < 0.28 ? (reach > 0.4 ? 'hidden' : 'relax') : drop > 0.6 ? 'relax' : 'grip' };
    }
    return { d, reach, up, flick, lift, down, drop, arm };
  }
  function fourPose(t, c) {                          // his face and his arm while the cap goes on
    const settle = sstep(T.capOn + 0.95, T.capOn + 1.3, t);
    const p = { arms: { l: { ...c.arm, w: 1 } }, smirk: 0.6 * settle, smile: lerp(0.04, 0.32, settle), look: [0, 2], headYaw: 0.03, frown: 0.08 * (1 - settle), worry: 0, tilt: -0.03 * c.down };
    if (c.d < 0.4) { p.cap = 0; return p; }           // still in his pocket
    const w = wristInHead({ arms: p.arms }, -1), dir = [-Math.sin(w.ang), Math.cos(w.ang)];
    const fx = w.x + dir[0] * 46, fy = w.y + dir[1] * 46;
    // crumpled and hanging from his fist at first; held by its side once it's open; seated at the end
    const hang = { cx: fx + 30, cy: fy + 120, rot: 0.5 + 0.35 * Math.sin((c.d - 0.5) * 34) * (1 - c.flick), sq: 1 - c.flick };
    const held = { cx: fx + HOLD.cx, cy: fy + HOLD.cy, rot: 0.06 * (1 - c.down), sq: 0 };
    const k = sstep(0.56, 0.7, c.d);
    let cx = lerp(hang.cx, held.cx, k), cy = lerp(hang.cy, held.cy, k), rot = lerp(hang.rot, held.rot, k), sq = lerp(hang.sq, 0, k);
    const seat = sstep(0.9, 0.99, c.d);                  // the last few frames: exactly on
    cx = lerp(cx, 0, seat); cy = lerp(cy, -220, seat); rot = lerp(rot, 0, seat);
    const bounce = 14 * kick(t, T.capOn + 0.99, 1, 34, 16);
    p.cap = { dx: cx, lift: -220 - cy + bounce, rot, sq, a: sstep(0.4, 0.46, c.d) };
    p.handFront = c.drop < 0.5 ? -1 : 0;
    return p;
  }
  function shotReveal(g, t) {
    const c = capOnPose(t);
    const rcAt = (tt) => { const wh = sstep(T.rev0, T.rev0 + 0.3, tt); return { x: lerp(XS[4], XS[3], wh), z: lerp(-1150, -900, sstep(T.capOn + 0.2, T.capOn + 1.1, tt)), F: 1000, eye: 1520, hz: lerp(900, 840, wh) }; };
    const rc = rcAt(t);
    const fast = t < T.rev0 + 0.34 || (c.d > 0.6 && c.d < 1.0);
    blurred(g, t, fast ? 5 : 1, (gg, tt) => lineUp(gg, rcAt(tt), tt, { rail: false, mood: (i, ti) => (i === 3 ? fourPose(ti, capOnPose(ti)) : {}) }));
    vignette(g, 0.8);
    // the match: the moment it's on, the frame splits down his face: the first two seconds on the left, now on the right
    const m0 = T.capOn + 1.02, mk = winK(t, m0, m0 + 0.12, T.blink0 - 0.12, T.blink0);
    if (mk > 0.001) {
      const m = lineMan(3, t, rc, { mood: (i, ti) => fourPose(ti, capOnPose(ti)) });
      const sx = m.p[0] + 4, wipe = lerp(-40, sx, sstep(m0, m0 + 0.16, t));
      g.save(); g.beginPath(); g.rect(0, 0, wipe, H); g.clip();
      g.fillStyle = rg(g, 300, 700, 50, 1400, [0, '#ffd9a0'], [0.6, '#e9a46a'], [1, '#9c5a3a']); g.fillRect(0, 0, W, H);
      g.fillStyle = lg(g, 0, 100, 0, 330, [0, '#2b6fb3'], [1, '#1f4f82']); g.fillRect(0, 0, W, 300);
      figure(g, THIEF0, m.p[0], m.p[1], m.p[2], { ...m.pose, cap: 1, handFront: 0, arms: { l: STANCE[3].l, r: STANCE[3].r } });
      g.fillStyle = 'rgba(255,200,120,0.12)'; g.fillRect(0, 0, W, H);
      g.restore();
      g.fillStyle = '#fff6e2'; g.fillRect(wipe - 3, 0, 6, H);
      if (t > m0 + 0.18) { txt(g, '0:02', wipe - 30, 400, 64, CREAM, { align: 'right', kind: 'mono', stroke: INK, sw: 0.16, a: mk }); txt(g, 'NOW', wipe + 30, 400, 64, CREAM, { kind: 'mono', stroke: INK, sw: 0.16, a: mk }); }
    }
    if (t >= T.l4 - 0.04) title(g, 'NUMBER 4', 1400, 150, YEL, t, T.l4 + 0.3, { sw: 0.12 });
    return flashAt(t, m0, 14) * 0.28;
  }

  // ------------------------------------------------------------------ shot 4 · "Same face. Just a cap." The cap off, on, off, on.
  function capFlip(t) {
    const flips = [T.l5 - 0.02, T.l5b - 0.02, T.l5b + 0.42, T.l5b + 0.62];   // off on "Same", on on "Just", off, on
    let on = 1; for (const f of flips) if (t >= f) on = 1 - on;
    return on;
  }
  function shotBlink(g, t) {
    const rc = { x: XS[3], z: lerp(-760, -720, sstep(T.blink0, T.off0, t)), F: 1000, eye: 1520, hz: 760 };
    const on = capFlip(t), last = [T.l5 - 0.02, T.l5b - 0.02, T.l5b + 0.42, T.l5b + 0.62].filter((f) => t >= f).pop() ?? -9;
    const sq = 1 + 0.04 * Math.exp(-(t - last) * 22);
    g.save(); g.translate(540, 760); g.scale(sq, sq); g.translate(-540, -760);
    lineUp(g, rc, t, { rail: false, mood: (i) => (i === 3 ? { cap: on, look: [0, 2], smirk: 0.5, smile: 0.3, headYaw: 0.02, frown: 0, worry: 0 } : {}) });
    g.restore();
    vignette(g, 0.8);
    title(g, 'SAME FACE.', 1330, 130, CREAM, t, T.l5 - 0.04);
    if (t >= T.l5b - 0.04) title(g, 'JUST A CAP.', 1470, 130, YEL, t, T.l5b - 0.04);
    return 0;
  }

  // ------------------------------------------------------------------ shot 5 · "You were looking for the cap." Along the line, 5, 3 and 1 take theirs off.
  // "Whoever you picked goes to jail." The ones you might have picked look at you.
  const OFF_AT = { 4: T.l6 + 0.38, 2: T.l6 + 0.92, 0: T.l6 + 1.42 };
  function capOffPose(i, t) {                        // up to the brim, off, down to his chest with it
    const d = t - OFF_AT[i], base = { yaw: 0, walk: 0 };
    const up = sstep(0, 0.18, d), off = sstep(0.18, 0.4, d), down = sstep(0.4, 0.75, d);
    const st = STANCE[i].l, brim = armIK(base, -1, -186, -168, 46), high = armIK(base, -1, -150, -380, 46), chest = armIK(base, -1, -60, 420, 46);
    const mixA = (a, b, u) => ({ a1: lerp(a.a1, b.a1, u), a2: lerp(a.a2, b.a2, u) });
    let p = mixA(st, brim, up); p = mixA(p, high, off); p = mixA(p, chest, down);
    return { d, up, off, down, arm: { ...p, hand: up > 0.2 ? 'grip' : st.hand || 'relax', w: 1 } };
  }
  const hurt = (i, t) => ({ look: [i < 3 ? 7 : -7, 3], frown: [0.42, 0.36, 0.4, 0, 0.38][i], worry: [-12, -15, -8, 0, -11][i] });
  function camOff(t) {
    const a = sstep(T.off0, T.off0 + 0.4, t);
    let x = lerp(XS[3], XS[4], a), z = lerp(-760, -1700, a), hz = lerp(760, 880, a);
    const pan = clamp((t - (T.off0 + 0.4)) / (T.l7 - 0.2 - (T.off0 + 0.4)));
    if (pan > 0) x = lerp(XS[4], -900, pan * pan * (3 - 2 * pan) * 0.3 + pan * 0.7);
    const settle = sstep(T.l7 - 0.2, T.cell0, t);
    x = lerp(x, -620, settle); z = lerp(z, -1500, settle);
    return { x, z, F: 1000, eye: 1500, hz };
  }
  function shotCapsOff(g, t) {
    const rc = camOff(t);
    const fast = t < T.off0 + 0.45;
    blurred(g, t, fast ? 4 : 1, (gg, tt) => lineUp(gg, camOff(tt), tt, { rail: false, lagX: camOff(tt - 0.2).x, mood: (i, ti) => {
      if (i === 3) return { cap: 1, look: [6, 2], smirk: 0.5, smile: 0.25, headYaw: 0.1, frown: 0, worry: 0 };
      const m = ti >= T.l7 - 0.3 ? hurt(i, ti) : {};
      if (i === 1) return m;
      const c = capOffPose(i, ti), pose = { ...m, arms: { l: c.arm } };
      if (c.d < 0.17) { pose.cap = 1; return pose; }
      const w = wristInHead({ arms: pose.arms }, -1), dir = [-Math.sin(w.ang), Math.cos(w.ang)];
      const fx = w.x + dir[0] * 46, fy = w.y + dir[1] * 46;
      const held = c.down < 0.5 ? { cx: fx + HOLD.cx, cy: fy + HOLD.cy, rot: 0.1 * c.off } : { cx: fx + 40, cy: fy + 40, rot: lerp(0.1, 1.2, sstep(0.5, 1, c.down)) };
      pose.cap = { dx: held.cx, lift: -220 - held.cy, rot: held.rot, sq: 0, a: 1 };
      pose.handFront = -1;
      return pose;
    } }));
    vignette(g, 0.75);
    if (t >= T.l6 - 0.04 && t < T.l7 - 0.1) { title(g, 'YOU WERE LOOKING', 1330, 100, CREAM, t, T.l6 - 0.04); if (t >= T.l6 + 0.75) title(g, 'FOR THE CAP', 1450, 124, YEL, t, T.l6 + 0.75, { sw: 0.12 }); }
    if (t >= T.l7 - 0.04) { title(g, 'WHOEVER YOU PICKED', 1330, 100, CREAM, t, T.l7 - 0.04); if (t >= T.l7 + 0.8) title(g, 'GOES TO JAIL', 1450, 132, '#ff5a3a', t, T.l7 + 0.8, { sw: 0.12 }); }
    return 0;
  }

  // ------------------------------------------------------------------ shot 6 · "For a cap." A cell door slams; one maroon cap hangs on its bars.
  function shotCell(g, t) {
    const d = t - T.cell0, slam = sstep(0, 0.16, d), sh = shakeAt(t, [[T.cell0 + 0.16, 30]]);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#4a362c'], [1, '#1c1412']); g.fillRect(0, 0, W, H);
    g.save(); g.filter = 'blur(6px)'; g.globalAlpha = 0.8;            // inside: the four you might have picked, soft, bareheaded
    const rc = { x: 0, z: -2300, F: 1000, eye: 1500, hz: 900 };
    for (const i of [0, 1, 2, 4]) { const p = RP(rc, XS[i] * 1.15, 1594, 0); figure(g, LINE[i], p[0], p[1], p[2], { ...hurt(i, t), cap: 0, legs: false, close: blinkAt(t, i), rim: 1, arms: { l: STANCE[i].l, r: STANCE[i].r } }); }
    g.restore();
    g.fillStyle = lg(g, 0, 0, W, 0, [0, 'rgba(255,190,110,0.16)'], [1, 'rgba(20,10,8,0.3)']); g.fillRect(0, 0, W, H);
    g.save(); g.translate(sh[0], sh[1]);
    const x0 = lerp(W + 60, 90, slam);
    bars(g, x0, slam, t);
    // the cap, hooked by its strap on the middle bar, swinging after the slam
    const swing = 0.4 * Math.exp(-d * 2.4) * Math.sin(d * 8.5 + 0.4) * sstep(0.12, 0.2, d);
    const bx = x0 + 3 * 150;
    g.save(); g.translate(bx, 520); g.rotate(swing); g.translate(-30, 360); g.scale(1.12, 1.12); g.rotate(0.14);
    capShape(g, 192, -40, 0.8, 0); g.restore();
    g.save(); g.translate(bx, 520); g.rotate(swing); g.strokeStyle = '#3a0c14'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(-20, 36); g.quadraticCurveTo(-34, -8, 0, -14); g.quadraticCurveTo(34, -8, 24, 40); g.stroke(); g.restore();
    g.restore();
    title(g, 'FOR A CAP.', 1450, 160, YEL, t, T.l7b - 0.04, { sw: 0.12 });
    return flashAt(t, T.cell0 + 0.16, 14) * 0.25;
  }

  // ------------------------------------------------------------------ shot 7 · "Unless you saw the mole." Him, close: the ring, the grin, the dare, the tap, the wink.
  // where a point on his face (head units, before the turn) lands on the screen, for this figure pose
  function facePoint(L, pose, fx, fy, s, x0, y0) {
    const phi = clamp(pose.yaw || 0, -0.95, 0.95), sp = Math.sin(phi), hy = clamp((pose.headYaw || 0) + phi * 0.6, -1.15, 1.15);
    const hw = 186 * L.jaw, Rf = hw * 1.04, th = Math.asin(clamp(x0 / Rf, -0.99, 0.99)), px = Rf * Math.sin(th + hy);
    const bob = pose.breath || 0, tl = pose.tilt || 0, ln = pose.lean || 0;
    let hx = 150 * sp * 0.42 + (pose.headX || 0) + px * Math.cos(tl) - y0 * Math.sin(tl), hyy = (pose.headBob ?? 0) + px * Math.sin(tl) + y0 * Math.cos(tl);
    let X = hx, Y = hyy + bob;
    if (ln) { const cx = 0, cy = 968 + bob, dx = X - cx, dy = Y - cy; X = cx + dx * Math.cos(ln) - dy * Math.sin(ln); Y = cy + dx * Math.sin(ln) + dy * Math.cos(ln); }
    return [fx + X * s, fy + Y * s, px];
  }
  function endMood(t) {
    const tap = winK(t, T.tap, T.tap + 0.28, T.wink + 0.55, T.wink + 0.9), wink = winK(t, T.wink, T.wink + 0.08, T.wink + 0.34, T.wink + 0.46);
    const grin = sstep(T.l9, T.l9 + 0.6, t);
    const p = { cap: 1, look: [0, 2], smirk: lerp(0.45, 0.9, grin), smile: lerp(0.25, 0.6, grin), headYaw: 0.02 + 0.06 * tap, tilt: -0.05 * tap, frown: 0, worry: 0,
      browUp: 12 * winK(t, T.l8 + 0.6, T.l8 + 0.8, T.l9 - 0.2, T.l9), close: blinkAt(t, 3, 4.1) * (1 - wink), closeR: wink * 0.97, lean: STANCE[3].lean };
    if (tap > 0.001) {
      const L = THIEF, hw = 186 * L.jaw, Rf = hw * 1.04, hy = p.headYaw, th = Math.asin(84 / Rf), mx = Rf * Math.sin(th + hy);
      const ik = armIK({ yaw: 0 }, 1, mx + 10, 66, 168);
      p.arms = { r: { a1: lerp(STANCE[3].r.a1, ik.a1, tap), a2: lerp(STANCE[3].r.a2, ik.a2, tap), hand: tap > 0.35 ? 'point' : 'relax', w: 1 } };
      p.handFront = tap > 0.3 ? 1 : 0;
    }
    return p;
  }
  function shotEnd(g, t) {
    const push = sstep(T.mole0, T.end, t);
    const rc = { x: XS[3], z: lerp(-820, -690, push), F: 1000, eye: 1520, hz: 760 };
    lineUp(g, rc, t, { rail: false, mood: (i, ti) => (i === 3 ? endMood(ti) : {}) });
    // "On a stranger, the cap is half of him": the right half of the frame without it
    const hk = winK(t, T.l9 + 1.9, T.l9 + 2.05, T.l9e - 0.1, T.l9e + 0.1);
    if (hk > 0.001) {
      const m = lineMan(3, t, rc, { mood: (i, ti) => endMood(ti) }), wipe = lerp(W + 10, m.p[0], sstep(T.l9 + 1.9, T.l9 + 2.1, t));
      g.save(); g.beginPath(); g.rect(wipe, 0, W - wipe + 10, H); g.clip();
      lineUp(g, rc, t, { rail: false, mood: (i, ti) => (i === 3 ? { ...endMood(ti), cap: 0 } : {}) });
      g.restore();
      g.fillStyle = `rgba(255,246,226,${hk})`; g.fillRect(wipe - 3, 0, 6, H);
    }
    vignette(g, 0.85);
    if (t >= T.l9 + 1.95 && t < T.l9e) title(g, 'HALF OF HIM', 1440, 120, YEL, t, T.l9 + 2.6, { sw: 0.12 });
    const m = lineMan(3, t, rc, { mood: (i, ti) => endMood(ti) });
    const [mx, my] = facePoint(THIEF, m.pose, m.p[0], m.p[1], m.p[2], 84, 62);
    const rk = sstep(T.l8 + 0.5, T.l8 + 0.9, t) * (1 - sstep(T.l9 - 0.3, T.l9, t));
    ring(g, mx, my, 52, rk, 9);
    if (t >= T.l8 - 0.04 && t < T.l9 - 0.1) { title(g, 'UNLESS YOU SAW', 1330, 100, CREAM, t, T.l8 - 0.04); if (t >= T.l8 + 0.6) title(g, 'THE MOLE', 1460, 140, YEL, t, T.l8 + 0.6, { sw: 0.12 }); }
    if (t >= T.l10 + 1.9 && t < T.end - 0.3) title(g, "DON'T MENTION THE MOLE", 1420, 92, CREAM, t, T.l10 + 1.9);
    const out = sstep(T.end - 0.35, T.end, t);
    if (out > 0) { g.fillStyle = `rgba(10,14,21,${out})`; g.fillRect(0, 0, W, H); }
    return 0;
  }

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
      g.save();
      let fl = 0;
      if (t < T.line0) fl = shotFreeze(g, t);
      else if (t < T.rev0) fl = shotLine(g, t);
      else if (t < T.blink0) fl = shotReveal(g, t);
      else if (t < T.off0) fl = shotBlink(g, t);
      else if (t < T.cell0) fl = shotCapsOff(g, t);
      else if (t < T.mole0) fl = shotCell(g, t);
      else fl = shotEnd(g, t);
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
