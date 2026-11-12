// Reel 34 · You're the Victim (working title). Tests desk, episode 9 of "You're the test subject".
// A packed market lane at golden hour, your POV, your wallet in your hand. Three men bump you: one, two, three. Your wallet's gone, and
// whoever you pick goes to jail. Look down: nobody took it. It slipped out of your hand at second four, while the second man's face was in
// yours, and it has lain at your feet the whole time: whoever you picked is going to jail for bumping into you. Magicians call that
// misdirection. Still think you're the victim? Facts: docs/research.md.
// Rebuilt 12 Nov at the user's call ("the animation can be a lot better"; the comments ask for the mole guy). The series' golden-hour street
// in true perspective, so the shops slide past while you walk; bodies that walk (a bob, a sway, arms with elbows and hands); heads that turn
// in three-quarter instead of flipping like cards; bumps that roll the camera, with motion blur drawn in; the pick with the faces big and the
// frozen street grey and soft behind them. The season's thief (the maroon cap, the mole) sips chai at the stall on your left: a lure for
// series viewers' eyes while the wallet falls on your right, never the answer and never near the wallet. He raises his glass to you at the end.
// Our own drawings; nobody real. The face rig is from reels 20, 25, 26 and 30. 30 fps.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', YEL = '#ffd34a', CREAM = '#fff6e2';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const NA = C.noise1(3401), NB = C.noise1(3402), NC = C.noise1(3403);

  // ------------------------------------------------------------------ canvas helpers (reel 30's)
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
  // a tapered capsule down the local y axis, from y0 (half-width w0) to y1 (half-width w1)
  const caps = (g, y0, y1, w0, w1) => { g.beginPath(); g.moveTo(-w0, y0); g.lineTo(-w1, y1); g.arc(0, y1, w1, Math.PI, 0, true); g.lineTo(w0, y0); g.arc(0, y0, w0, 0, Math.PI, true); g.closePath(); };
  const hexRGB = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const MIXC = new Map();
  const mix = (a, b, k) => {                         // two #rrggbb colours, k of the way from a to b (memoised: the lane asks for the same tones every frame)
    k = Math.round(clamp(k) * 40) / 40; const key = a + b + k; let v = MIXC.get(key);
    if (!v) { const A = hexRGB(a), B = hexRGB(b); v = '#' + A.map((x, i) => Math.round(lerp(x, B[i], k)).toString(16).padStart(2, '0')).join(''); MIXC.set(key, v); }
    return v;
  };
  function shakeAt(t, list, smooth = false) {       // list: [time, amplitude]; a decaying, frame-clocked jitter (smooth: glides between frames,
    // and eases in over a frame, so a slowed replay doesn't skip at the hit)
    let a = 0; for (const [t0, amp] of list) if (t >= t0) a = Math.max(a, amp * Math.exp(-(t - t0) * 9) * (smooth ? sstep(t0, t0 + 0.035, t) : 1));
    if (a < 0.2) return [0, 0];
    const at = (n) => { const r = mulberry32(n * 7 + 3); return [(r() - 0.5) * 2, (r() - 0.5) * 2]; };
    if (!smooth) { const v = at(Math.round(t * 30)); return [v[0] * a, v[1] * a]; }
    const f = t * 30, n = Math.floor(f), u = sstep(0, 1, f - n), v0 = at(n), v1 = at(n + 1);
    return [lerp(v0[0], v1[0], u) * a, lerp(v0[1], v1[1], u) * a];
  }
  const flashAt = (t, t0) => { const d = t - t0; return d < 0 ? 0 : Math.exp(-d * 11) * 0.92; };
  function stamp(g, s, x, y, t, t0, color = RED, size = 120, rot = -0.1) {
    if (t < t0) return;
    const k = hit(t, t0, 'heavy'), sc = lerp(2.1, 1, clamp(k));
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.globalAlpha = clamp((t - t0) / 0.05);
    g.font = font(size); const w = g.measureText(s).width + 56;
    R(g, -w / 2, -size * 0.74, w, size * 1.0, 14); g.fillStyle = 'rgba(255,250,240,0.86)'; g.fill(); g.strokeStyle = color; g.lineWidth = size * 0.085; g.stroke();
    g.textAlign = 'center'; g.fillStyle = color; g.fillText(s, 0, size * 0.1);
    g.restore();
  }
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

  // ------------------------------------------------------------------ faces (the rig of reels 20-30), now turning in three-quarter
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
  // The three men share one skin; they differ in age, hair, moustache, glasses and what they carry, never in colour (desk: reels 27, 29, 30).
  // ONE: about twenty, a lot of hair, clean-shaven, earphones, a backpack and his phone. TWO: about thirty-five, an office shirt, a side parting,
  // a thin moustache, an ID card and a watch. THREE: about sixty, grey, glasses, a thick grey moustache, a bag of vegetables. Nobody here is a thief.
  const S0 = { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983' };
  const ONE = { ...S0, hair: '#17110d', style: 'messy', must: null, stub: 0, brow: 13, browTilt: -5, jaw: 0.92, ew: 47, eh: 27 };
  const TWO = { ...S0, hair: '#15100c', style: 'part', must: 'thin', stub: 0, brow: 15, browTilt: 0, jaw: 1.03, ew: 43, eh: 23 };
  const THREE = { ...S0, hair: '#a7a29b', mHair: '#b5b0a8', style: 'recede', must: 'thick', stub: 0, brow: 15, browTilt: 4, jaw: 1.0, ew: 42, eh: 22, specs: true };
  // the season's thief (reels 20, 23, 25, 26): reel 20's face and green shirt, the maroon cap, the mole. A bigger mole: he's small in the frame.
  const THIEF = { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', style: 'cap', must: 'thin', stub: 0.55, brow: 15, browTilt: 8, jaw: 0.98, ew: 43, eh: 22, mole: [84, 62], moleR: 15 };

  function capShape(g, hh, bs = 0, bw = 1) {          // the maroon cap: the crown, the seam, the brim (bs: how far the brim has turned with his face)
    g.beginPath(); g.moveTo(-hh - 2, -122); g.bezierCurveTo(-hh - 8, -280, -90, -318, 0, -318); g.bezierCurveTo(90, -318, hh + 8, -280, hh + 2, -122); g.quadraticCurveTo(bs * 0.5, -158, -hh - 2, -122); g.closePath(); g.fillStyle = lg(g, -hh, -318, hh, -120, [0, '#a32b3d'], [1, '#5c1520']); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(bs * 0.6, -318); g.quadraticCurveTo(bs * 0.9 - 12, -220, bs, -150); g.stroke();
    g.fillStyle = 'rgba(255,200,170,0.22)'; ell(g, -hh * 0.45, -262, 50, 22, -0.3); g.fill();
    g.save(); g.translate(bs, 0); g.scale(bw, 1);
    g.beginPath(); g.moveTo(-hh + 6, -128); g.quadraticCurveTo(0, -170, hh - 6, -128); g.quadraticCurveTo(hh + 6, -108, hh - 40, -92); g.quadraticCurveTo(0, -116, -hh + 40, -92); g.quadraticCurveTo(-hh - 6, -108, -hh + 6, -128); g.closePath(); g.fillStyle = '#4a111b'; g.fill();
    g.restore();
  }
  function hairBehind(g, L, hh) {                     // long hair, behind the face
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hh - 14, -60); g.bezierCurveTo(-hh - 30, 120, -hh - 10, 300, -hh + 40, 330); g.lineTo(hh - 40, 330); g.bezierCurveTo(hh + 10, 300, hh + 30, 120, hh + 14, -60); g.closePath(); g.fill();
  }
  function head(g, L, o = {}) {
    const op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw, drop = 104 * op, chin = 232 + drop, ey = -28, ex = 80;
    const yw = clamp(o.yaw || 0, -1.15, 1.15), sy = Math.sin(yw), cw = Math.cos(yw), Rf = hw * 1.04, hh = hw + 6;
    const at = (x0) => { const th = Math.asin(clamp(x0 / Rf, -0.99, 0.99)), c = Math.cos(th + yw); return [Rf * Math.sin(th + yw), Math.max(0.05, c / Math.cos(th)), c]; };
    const jx = (y) => sy * Rf * 0.86 * clamp((y + 40) / (chin + 40));        // the jaw and the chin swing round with the face
    if (L.style === 'long') hairBehind(g, L, hh);
    // ears: the one on the far side of the turn goes behind the skull; the other comes round onto the side of the face
    const ears = [];
    for (const k of [-1, 1]) { const th = k * Math.PI / 2 + yw, cz = Math.cos(th); if (cz < -0.25) continue; ears.push([k, hw * Math.sin(th), cz]); }
    const ear = (k, x, cz) => { const w = 25 * (0.55 + 0.45 * clamp(1 - Math.abs(cz) * 1.6)); ell(g, x + k * 1, -18, w, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); ell(g, x + k * 3 * (w / 25), -16, w * 0.48, 24, k * 0.08); g.fillStyle = L.skinD; g.fill(); };
    if (!L.hideEars) for (const [k, x, cz] of ears) ear(k, x, cz);
    const path = () => {
      g.beginPath(); g.moveTo(-hw, -40);
      g.bezierCurveTo(-hw - 4, -216, -100, -266, 0, -266); g.bezierCurveTo(100, -266, hw + 4, -216, hw, -40);
      g.bezierCurveTo(hw + 4 + jx(58) * 0.4, 58, 152 - 16 * op + jx(150), 150 + 44 * op, 88 - 6 * op + jx(205), 205 + 82 * op);
      g.bezierCurveTo(60 + jx(chin), chin - 4, 28 + jx(chin), chin, jx(chin), chin); g.bezierCurveTo(-28 + jx(chin), chin, -60 + jx(chin), chin - 4, -88 + 6 * op + jx(205), 205 + 82 * op);
      g.bezierCurveTo(-152 + 16 * op + jx(150), 150 + 44 * op, -hw - 4 + jx(58) * 0.4, 58, -hw, -40); g.closePath();
    };
    path(); g.fillStyle = lg(g, -hw, -200, hw, 240, [0, L.skinH], [0.45, L.skin], [1, L.skinD]); g.fill();
    g.save(); path(); g.clip();
    g.fillStyle = rg(g, jx(60) * 0.6, -40, 150, 330, [0, 'rgba(90,45,25,0)'], [1, 'rgba(90,45,25,0.3)']); g.fillRect(-300, -300, 600, 700);
    if (Math.abs(sy) > 0.01) { const e = Math.sign(sy) * hw; g.fillStyle = lg(g, e, 0, e - Math.sign(sy) * hw * 1.1, 0, [0, `rgba(70,32,18,${0.34 * Math.abs(sy)})`], [1, 'rgba(70,32,18,0)']); g.fillRect(-300, -300, 600, 700); }
    if (L.stub) { g.fillStyle = lg(g, 0, 56, 0, 190, [0, 'rgba(30,22,18,0)'], [1, `rgba(30,22,18,${0.34 * L.stub})`]); g.fillRect(-300, 56, 600, 320); const r = mulberry32(5); g.fillStyle = `rgba(20,14,10,${0.34 * L.stub})`; for (let i = 0; i < 70; i++) { ell(g, (r() - 0.5) * 2 * hw * 0.9 + jx(180), 120 + r() * 120, 1.7, 1.7); g.fill(); } }
    if (L.style === 'recede') { g.lineWidth = 5; g.strokeStyle = 'rgba(80,40,20,0.22)'; for (const k of [-1, 1]) { const [x] = at(k * 120); g.beginPath(); g.moveTo(x, 70); g.quadraticCurveTo(x - k * 20, 130, x - k * 50, 160); g.stroke(); } }
    if (o.rim !== 0) { g.strokeStyle = lg(g, -hw, -250, hw * 0.4, 80, [0, 'rgba(255,222,165,0.66)'], [1, 'rgba(255,222,165,0)']); g.lineWidth = 26; path(); g.stroke(); }
    g.restore();
    if (!L.hideEars) for (const [k, x, cz] of ears) { const a = sstep(0.3, 0.6, Math.abs(yw)); if (a > 0 && -k === Math.sign(sy)) { g.save(); g.globalAlpha *= a; ear(k, x, cz); g.restore(); } }
    // the mouth and the moustache turn with the face
    const my = 118 + drop * 0.2, [mx] = at(0);
    g.save(); g.translate(mx * 0.97, 0); g.scale(Math.max(0.3, cw), 1);
    mouth(g, my, op, { lip: '#83503f', w0: o.w0 ?? 44, frown: o.frown ?? 0, smile: o.smile ?? 0, smirk: o.smirk || 0 });
    if (L.must) {
      const big = L.must === 'thick', th = big ? 24 : 13, w = big ? 64 : 52;
      g.fillStyle = L.mHair || L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
    }
    g.restore();
    // the nose: it stands out from the face, so it moves further than the eyes; its far wing hides behind it
    const ny = 44, nx = Rf * 1.1 * sy;
    g.save(); g.translate(nx, 0); g.scale(0.55 + 0.45 * cw, 1);
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round';
    for (const k of [-1, 1]) { if (k * sy > 0.42) continue; g.beginPath(); g.moveTo(k * 22, ny - 18); g.quadraticCurveTo(k * 31, ny, k * 25, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { if (k * sy > 0.55) continue; ell(g, k * 13, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5, ny - 8, 10, 15); g.fill();
    g.restore();
    if (Math.abs(sy) > 0.08) { const sg = Math.sign(sy); g.strokeStyle = `rgba(90,45,25,${0.34 * Math.min(1, Math.abs(sy) * 2)})`; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(nx - sg * 4 - sy * 26, ey + 12); g.quadraticCurveTo(nx + sg * 10, ny - 12, nx + sg * 30 * Math.abs(sy), ny + 14); g.stroke(); }
    if (L.mole) { const [x, , c] = at(L.mole[0]); if (c > 0.15) { const mr = L.moleR ?? 9.5; g.fillStyle = '#2a1710'; ell(g, x, L.mole[1], mr * (0.45 + 0.55 * c), mr * 0.95); g.fill(); } }
    const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look };
    for (const k of [-1, 1]) { const [x, wf, c] = at(k * ex); if (c < 0.12) continue; g.save(); g.translate(x, 0); g.scale(wf, 1); eye(g, k, 0, ey, close, eo); g.restore(); }
    g.strokeStyle = L.mHair || L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt + (o.worry || 0);
    for (const k of [-1, 1]) {
      const [x, wf, c] = at(k * ex); if (c < 0.12) continue;
      const bu = k === 1 ? -(o.browUp || 0) : 0;
      g.save(); g.translate(x, 0); g.scale(wf, 1);
      g.beginPath(); g.moveTo(-k * 48, ey - 40 + tilt + by0 + bu); g.quadraticCurveTo(k * 6, ey - 60 + by0 + bu, k * 54, ey - 40 - tilt * 0.3 + by0 * 0.4 + bu); g.stroke();
      g.restore();
    }
    // hair (and the cap), turned a little with the face
    g.save(); g.translate(sy * hw * 0.14, 0); g.fillStyle = L.hair;
    if (L.style === 'part') { g.beginPath(); g.moveTo(hh, -38); g.bezierCurveTo(hh + 10, -250, 80, -300, -16, -292); g.bezierCurveTo(-140, -292, -hh - 16, -220, -hh, -38); g.bezierCurveTo(-hh + 18, -112, -150, -164, -80, -190); g.bezierCurveTo(-20, -150, 70, -160, 110, -186); g.bezierCurveTo(150, -150, hh - 22, -110, hh, -38); g.fill(); }
    else if (L.style === 'recede') { g.beginPath(); g.moveTo(-hh, -50); g.bezierCurveTo(-hh - 6, -200, -120, -250, -84, -236); g.bezierCurveTo(-110, -200, -hh + 22, -140, -hh + 12, -50); g.closePath(); g.fill(); g.beginPath(); g.moveTo(hh, -50); g.bezierCurveTo(hh + 6, -200, 120, -250, 84, -236); g.bezierCurveTo(110, -200, hh - 22, -140, hh - 12, -50); g.closePath(); g.fill(); g.save(); g.globalAlpha *= 0.55; g.beginPath(); g.moveTo(-90, -238); g.quadraticCurveTo(0, -282, 90, -238); g.quadraticCurveTo(0, -262, -90, -238); g.fill(); g.restore(); }
    else if (L.style === 'messy') {
      const fl = o.hairFlop || 0;
      g.beginPath(); g.moveTo(-hh, -40);
      g.bezierCurveTo(-hh - 22, -170, -hh + 10, -270, -70, -300); g.bezierCurveTo(-40, -334, 30, -330, 60, -306); g.bezierCurveTo(110, -326, 170, -290, 168, -244);
      g.bezierCurveTo(hh + 18, -210, hh + 20, -120, hh, -40); g.bezierCurveTo(hh - 16, -110, 150, -150, 120, -168);
      g.bezierCurveTo(96, -138, 60, -150, 40, -176); g.bezierCurveTo(10, -140, -30, -150, -50, -178); g.bezierCurveTo(-80, -144, -120, -150, -136, -170); g.bezierCurveTo(-150, -130, -hh + 14, -100, -hh, -40); g.closePath(); g.fill();
      g.strokeStyle = L.hair; g.lineWidth = 12; g.lineCap = 'round';
      for (const [x0, y0, x1, y1] of [[-20, -300, -8, -346], [36, -306, 58, -344], [-70, -292, -96, -326]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 8, (y0 + y1) / 2, x1 + fl * 14, y1 + Math.abs(fl) * 6); g.stroke(); }
    } else if (L.style === 'slick' || L.style === 'short') {
      g.beginPath(); g.moveTo(-hh, -44); g.bezierCurveTo(-hh - 6, -250, -80, -300, 0, -298); g.bezierCurveTo(80, -300, hh + 6, -250, hh, -44); g.bezierCurveTo(hh - 16, -150, 90, -210, 0, -214); g.bezierCurveTo(-90, -210, -hh + 16, -150, -hh, -44); g.closePath(); g.fill();
      if (L.style === 'slick') { g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-110 + i * 70, -230 - i * 8); g.quadraticCurveTo(-40 + i * 70, -282, 40 + i * 50, -270); g.stroke(); } }
    } else if (L.style === 'long' || L.style === 'bun') {
      g.beginPath(); g.moveTo(-hh - 4, 40); g.bezierCurveTo(-hh - 14, -240, -80, -300, 0, -298); g.bezierCurveTo(80, -300, hh + 14, -240, hh + 4, 40); g.bezierCurveTo(hh - 30, -120, 60, -200, 6, -214); g.bezierCurveTo(-60, -200, -hh + 30, -120, -hh - 4, 40); g.closePath(); g.fill();
      if (L.style === 'bun') { ell(g, 0, -300, 86, 62); g.fill(); }
    } else if (L.style === 'cap') {
      g.beginPath(); g.moveTo(-hh, -36); g.lineTo(-hh + 4, -130); g.lineTo(-hh + 36, -130); g.lineTo(-hh + 24, -46); g.closePath(); g.moveTo(hh, -36); g.lineTo(hh - 4, -130); g.lineTo(hh - 36, -130); g.lineTo(hh - 24, -46); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,10,6,0.32)'; g.beginPath(); g.moveTo(-hw + 8, -108); g.quadraticCurveTo(sy * 60, -60, hw - 8, -108); g.lineTo(hw - 8, -140); g.lineTo(-hw + 8, -140); g.closePath(); g.fill();
      capShape(g, hh, sy * hw * 0.42, 0.55 + 0.45 * cw);
    }
    g.restore();
    if (L.specs) {
      const P = [-1, 1].map((k) => at(k * ex));
      g.strokeStyle = '#2a2320'; g.lineWidth = 8;
      for (let i = 0; i < 2; i++) { const [x, wf, c] = P[i]; if (c < 0.1) continue; g.save(); g.translate(x, 0); g.scale(wf, 1); g.fillStyle = 'rgba(255,255,255,0.1)'; R(g, -64, ey - 44, 128, 88, 30); g.fill(); g.stroke(); g.restore(); }
      g.beginPath(); g.moveTo(P[0][0] + 64 * P[0][1], ey - 8); g.quadraticCurveTo((P[0][0] + P[1][0]) / 2, ey - 22, P[1][0] - 64 * P[1][1], ey - 8);
      for (let i = 0; i < 2; i++) { const k = i ? 1 : -1, [x, wf, c] = P[i]; if (c < 0.1 || k * sy > 0.3) continue; g.moveTo(x + k * 64 * wf, ey - 10); g.lineTo(hw * Math.sin(k * Math.PI / 2 + yw), ey - 16); }
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 5; for (let i = 0; i < 2; i++) { const [x, wf, c] = P[i]; if (c < 0.1) continue; g.beginPath(); g.moveTo(x - 40 * wf, ey - 30); g.lineTo(x - 18 * wf, ey - 36); g.stroke(); }
    }
  }
  // the back of a head: hair (or the cap, its brim kept in view: from behind, a crown alone reads as a skullcap) over the skull, ears at the sides
  function headBack(g, L, o = {}) {
    const hw = 186 * L.jaw;
    for (const k of [-1, 1]) { ell(g, k * (hw + 1), -18, 25, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); }
    g.fillStyle = L.skinD; R(g, -78, 100, 156, 150, 30); g.fill();
    if (L.style === 'cap') { g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 2, -60); g.bezierCurveTo(-hw - 6, 60, -90, 150, 0, 150); g.bezierCurveTo(90, 150, hw + 6, 60, hw + 2, -60); g.closePath(); g.fill(); capShape(g, hw + 6, 0, 1); g.fillStyle = '#4a111b'; ell(g, hw * 0.72, -112, 52, 14, 0.35); g.fill(); return; }
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 6, -30); g.bezierCurveTo(-hw - 14, -240, -90, -296, 0, -296); g.bezierCurveTo(90, -296, hw + 14, -240, hw + 6, -30); g.bezierCurveTo(hw - 4, 80, 90, 150, 0, 156); g.bezierCurveTo(-90, 150, -hw + 4, 80, -hw - 6, -30); g.closePath(); g.fill();
    if (L.style === 'long') { g.beginPath(); g.moveTo(-hw - 10, -40); g.bezierCurveTo(-hw - 24, 160, -hw + 10, 320, -40, 360); g.lineTo(40, 360); g.bezierCurveTo(hw - 10, 320, hw + 24, 160, hw + 10, -40); g.closePath(); g.fill(); }
    if (L.style === 'bun') { ell(g, 0, -190, 90, 70); g.fill(); }
    if (L.braid) { for (let i = 0; i < 7; i++) { ell(g, Math.sin(i * 0.9) * 5, 170 + i * 42, 30 - i * 2, 28); g.fill(); } }
    if (L.style === 'recede') { g.fillStyle = 'rgba(255,255,255,0.14)'; ell(g, 0, -230, 90, 40); g.fill(); }
    g.strokeStyle = lg(g, -hw, -250, hw * 0.3, 60, [0, 'rgba(255,222,165,0.55)'], [1, 'rgba(255,222,165,0)']); g.lineWidth = 18; g.beginPath(); g.arc(0, -60, hw * 0.98, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
  }

  // ------------------------------------------------------------------ bodies, in head units (the head's centre is the origin, the feet 1594 below)
  // o.yaw turns the body (+: his chest towards your right), o.back shows his back. Arms have elbows and hands; they swing with the stride.
  const SH = {
    ONE: { a: '#5db3e4', b: '#3d8fc2', sleeve: 'short', leg: '#3a3f4b', shoe: '#2c2c33' },
    TWO: { a: '#eef2f8', b: '#c9d3e2', check: '#5f80c0', collar: '#e4eaf3', sleeve: 'long', cuff: '#e4eaf3', leg: '#2b3140', shoe: '#1d1712' },
    THREE: { a: '#dcc8a0', b: '#b9a47c', collar: '#cbb68e', sleeve: 'short', pocket: true, leg: '#5a5048', shoe: '#3a2b20' },
    THIEF: { a: '#37a18a', b: '#237a68', collar: '#1f6a5a', sleeve: 'short', buttons: 'rgba(255,255,255,0.45)', leg: '#20262f', shoe: '#121212' },
  };
  function vegBag(g, x, y) {                         // a jute bag, spinach and a bottle gourd sticking out
    g.save(); g.translate(x, y);
    g.strokeStyle = '#8c6236'; g.lineWidth = 14; g.beginPath(); g.moveTo(-60, -120); g.quadraticCurveTo(0, -220, 60, -120); g.stroke();
    g.fillStyle = '#5f9a3a'; for (let i = 0; i < 5; i++) { ell(g, -70 + i * 34, -90 - (i % 2) * 24, 30, 58, -0.4 + i * 0.2); g.fill(); }
    g.fillStyle = '#9bbf5a'; ell(g, 74, -110, 30, 90, 0.3); g.fill();
    g.fillStyle = lg(g, -110, -100, 110, 160, [0, '#d2a463'], [1, '#a77a40']); R(g, -110, -100, 220, 240, 26); g.fill();
    g.strokeStyle = 'rgba(80,50,20,0.3)'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-110, -80 + i * 26); g.lineTo(110, -80 + i * 26); g.stroke(); }
    g.restore();
  }
  // the cutting chai glass, ribbed (reel 20's). Its centre is the origin.
  function glass(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(245,240,230,0.34)'; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.lineTo(72, 130); g.lineTo(-72, 130); g.closePath(); g.fill();
    g.save(); g.beginPath(); g.moveTo(-90, -74); g.lineTo(90, -74); g.lineTo(70, 124); g.lineTo(-70, 124); g.closePath(); g.clip();
    g.fillStyle = lg(g, -90, -74, 90, 124, [0, '#d08a3e'], [1, '#8d4f1c']); g.fillRect(-100, -80, 200, 210);
    g.fillStyle = 'rgba(255,235,200,0.28)'; g.fillRect(-90, -74, 180, 14);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 4; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 27, -120); g.lineTo(i * 20, 128); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.stroke();
    g.restore();
  }
  // a hand at the wrist, pointing down its forearm (+y). k: the side it's on (-1 your left); rot: the forearm's turn, so a held thing can stay upright
  function hand(g, kind, L, k, rot, o = {}) {
    if (kind === 'hidden') return;                   // in front of him, out of sight from behind
    const sk = lg(g, -56, 0, 56, 120, [0, L.skinH || L.skin], [0.5, L.skin], [1, L.skinD]);
    if (kind === 'open') {                           // palm out, fingers spread
      g.fillStyle = sk; R(g, -50, -4, 100, 100, 42); g.fill();
      for (const [fx, a, len] of [[-34, -0.2, 92], [-11, -0.07, 106], [12, 0.06, 102], [33, 0.19, 86]]) { g.save(); g.translate(fx, 80); g.rotate(a); R(g, -12, -6, 24, len, 12); g.fill(); g.restore(); }
      g.save(); g.translate(-k * 44, 26); g.rotate(-k * 0.95); R(g, -13, 0, 26, 74, 13); g.fill(); g.restore();
      g.strokeStyle = 'rgba(110,55,30,0.3)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-32, 44); g.quadraticCurveTo(0, 64, 32, 40); g.stroke();
      return;
    }
    if (kind === 'phone') {                          // his phone in his hand, its back to you
      g.save(); g.rotate(-rot * 0.85); g.translate(0, 40);
      R(g, -42, -10, 84, 160, 14); g.fillStyle = '#23262c'; g.fill(); R(g, -30, 4, 22, 30, 7); g.fillStyle = '#3a3e46'; g.fill();
      g.fillStyle = sk; R(g, -56, 50, 112, 64, 26); g.fill(); R(g, -50, 104, 100, 34, 16); g.fill();
      g.save(); g.translate(k * 50, 30); g.rotate(k * 0.4); R(g, -13, -50, 26, 76, 13); g.fill(); g.restore();
      g.restore(); return;
    }
    if (kind === 'glass') {                          // a chai glass, held upright
      g.save(); g.rotate(-rot); g.translate(0, 34);
      glass(g, 0, -20, o.glassK || 0.5);
      g.fillStyle = sk; R(g, -52, -6, 104, 70, 28); g.fill(); g.save(); g.translate(-k * 42, -10); g.rotate(k * 0.2); R(g, -12, -38, 24, 66, 12); g.fill(); g.restore();
      g.restore(); return;
    }
    if (kind === 'bag') {                            // the jute bag's handles in his fist; it hangs, and swings
      g.save(); g.rotate(-rot + (o.bagSwing || 0)); vegBag(g, 0, 214); g.restore();
      g.fillStyle = sk; R(g, -46, -6, 92, 92, 36); g.fill(); return;
    }
    // relaxed: the fingers loosely curled, the thumb along the inside
    g.fillStyle = sk; R(g, -45, -6, 90, 104, 38); g.fill();
    g.save(); g.translate(-k * 38, 16); g.rotate(-k * 0.3); R(g, -14, 0, 28, 70, 14); g.fill(); g.restore();
    g.strokeStyle = 'rgba(110,55,30,0.24)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-28 + i * 24 + k * 6, 74); g.lineTo(-26 + i * 24 + k * 6, 96); g.stroke(); }
    if (kind === 'watch') { g.fillStyle = '#2b2522'; R(g, -48, -26, 96, 30, 8); g.fill(); g.fillStyle = '#d8d2c2'; ell(g, 0, -11, 22, 18); g.fill(); g.strokeStyle = '#6d655c'; g.lineWidth = 4; g.stroke(); }
  }
  // an arm from the shoulder: p.a1 swings the upper arm out from straight down, p.a2 bends the forearm in at the elbow, p.hand says what's in it
  function arm(g, P, k, p, phi, o) {
    const D = P.D, L = P.L, by = 168, long = D.sleeve === 'long';
    const sx = k * 268 * (0.6 + 0.4 * Math.cos(phi)) + 150 * Math.sin(phi) * 0.2;
    const L1 = 262 * (p.len ? p.len[0] : 1), L2 = 236 * (p.len ? p.len[1] : 1);
    const cloth = (w) => lg(g, -w, 0, w, 0, [0, D.a], [1, D.b]), skin = (w) => lg(g, -w, 0, w, 0, [0, L.skinH], [0.5, L.skin], [1, L.skinD]);
    g.save(); g.translate(sx, by + 172); g.rotate(-k * p.a1);
    g.fillStyle = long ? cloth(54) : skin(48); caps(g, 0, L1, 50, 44); g.fill();
    if (!long) { g.fillStyle = cloth(62); caps(g, -14, L1 * 0.52, 62, 56); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-56, L1 * 0.52 + 30); g.lineTo(56, L1 * 0.52 + 30); g.stroke(); }
    if (long && D.check) { g.save(); caps(g, 0, L1, 50, 44); g.clip(); g.strokeStyle = D.check; g.globalAlpha *= 0.45; g.lineWidth = 6; for (let i = -1; i < 6; i++) { g.beginPath(); g.moveTo(-60, i * 64); g.lineTo(60, i * 64); g.stroke(); } g.beginPath(); g.moveTo(0, -50); g.lineTo(0, L1 + 50); g.stroke(); g.restore(); }
    g.translate(0, L1); g.rotate(k * p.a2);
    g.fillStyle = long ? cloth(48) : skin(44); caps(g, -6, L2, 46, 38); g.fill();
    if (long && D.check) { g.save(); caps(g, -6, L2, 46, 38); g.clip(); g.strokeStyle = D.check; g.globalAlpha *= 0.45; g.lineWidth = 6; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-60, i * 64); g.lineTo(60, i * 64); g.stroke(); } g.restore(); }
    if (long) { g.fillStyle = D.cuff || D.a; caps(g, L2 - 46, L2 - 6, 44, 42); g.fill(); }
    g.translate(0, L2);
    hand(g, p.hand || 'relax', L, k, -k * p.a1 + k * p.a2 + (o.lean || 0), o);
    g.restore();
  }
  function torso(g, P, phi, back, o) {
    const D = P.D, by = 168, sp = Math.sin(phi), cp = Math.cos(phi);
    const ks = Math.sqrt((cp) ** 2 + (0.52 * sp) ** 2), cx = 150 * sp, hem = by + (D.kameez ? 1180 : 900);
    const shape = () => { g.beginPath(); g.moveTo(-262 * ks, hem); g.lineTo(-292 * ks, by + 250); g.bezierCurveTo(-300 * ks, by + 170, -210 * ks, by + 124, -96 * ks + cx * 0.3, by + 92); g.lineTo(96 * ks + cx * 0.3, by + 92); g.bezierCurveTo(210 * ks, by + 124, 300 * ks, by + 170, 292 * ks, by + 250); g.lineTo(262 * ks, hem); g.closePath(); };
    shape(); g.fillStyle = lg(g, -300, by, 300, by + 800, [0, D.a], [1, D.b]); g.fill();
    g.save(); shape(); g.clip();
    if (D.check) { g.save(); g.translate(cx * 0.6, 0); g.scale(0.4 + 0.6 * cp, 1); g.strokeStyle = D.check; g.globalAlpha *= 0.45; g.lineWidth = 7; for (let i = -7; i <= 7; i++) { g.beginPath(); g.moveTo(i * 64, by); g.lineTo(i * 64, hem); g.stroke(); } g.restore(); g.strokeStyle = D.check; g.globalAlpha *= 0.45; g.lineWidth = 7; for (let j = 0; j < 15; j++) { g.beginPath(); g.moveTo(-320, by + j * 64); g.lineTo(320, by + j * 64); g.stroke(); } g.globalAlpha = 1; }
    if (Math.abs(sp) > 0.02) { const e = -Math.sign(sp) * 300 * ks; g.fillStyle = lg(g, e, 0, e + Math.sign(sp) * 240, 0, [0, `rgba(30,18,30,${0.3 * Math.abs(sp)})`], [1, 'rgba(30,18,30,0)']); g.fillRect(-400, 0, 800, 1500); }
    g.fillStyle = 'rgba(30,18,30,0.12)'; g.fillRect(-400, by + 620, 800, 30);                                     // a fold at the waist
    g.fillStyle = lg(g, 0, by + 80, 0, by + 360, [0, 'rgba(30,18,30,0)'], [1, 'rgba(30,18,30,0.08)']); g.fillRect(-400, by + 80, 800, 280);
    g.strokeStyle = lg(g, -300, by + 100, 120, by + 420, [0, 'rgba(255,222,165,0.6)'], [1, 'rgba(255,222,165,0)']); g.lineWidth = 30; shape(); g.stroke();
    g.restore();
    g.save(); g.translate(cx, 0); g.scale(0.22 + 0.78 * cp, 1);
    if (back) { g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-250, by + 230); g.quadraticCurveTo(0, by + 280, 250, by + 230); g.stroke(); if (D.collar) { g.fillStyle = D.collar; R(g, -100, by + 70, 200, 50, 20); g.fill(); } }
    else {
      if (D.collar) { g.fillStyle = D.collar; g.beginPath(); g.moveTo(-98, by + 88); g.lineTo(-20, by + 200); g.lineTo(-64, by + 214); g.lineTo(-134, by + 110); g.closePath(); g.moveTo(98, by + 88); g.lineTo(20, by + 200); g.lineTo(64, by + 214); g.lineTo(134, by + 110); g.closePath(); g.fill(); g.fillStyle = D.buttons || 'rgba(0,0,0,0.3)'; for (let i = 0; i < 6; i++) { ell(g, 0, by + 250 + i * 104, 7, 7); g.fill(); } }
      else { g.fillStyle = D.b; g.beginPath(); g.moveTo(-96, by + 92); g.quadraticCurveTo(0, by + 190, 96, by + 92); g.lineTo(80, by + 92); g.quadraticCurveTo(0, by + 160, -80, by + 92); g.closePath(); g.fill(); }
      if (D.pocket) { g.strokeStyle = 'rgba(80,60,30,0.45)'; g.lineWidth = 6; R(g, -220, by + 300, 120, 130, 8); g.stroke(); g.fillStyle = '#2d4f9a'; R(g, -196, by + 268, 16, 80, 6); g.fill(); }
      if (D.dupatta) { g.fillStyle = D.dupatta; g.beginPath(); g.moveTo(-300, by + 170); g.quadraticCurveTo(-120, by + 330, 0, by + 300); g.quadraticCurveTo(140, by + 270, 300, by + 150); g.lineTo(300, by + 240); g.quadraticCurveTo(140, by + 380, 0, by + 400); g.quadraticCurveTo(-130, by + 420, -300, by + 270); g.closePath(); g.fill(); }
    }
    g.restore();
  }
  // the neck, then what hangs from it or crosses the chest (over the shirt, under the arms in front)
  function neckAndKit(g, P, phi, back, o) {
    const L = P.L, by = 168, sp = Math.sin(phi), cp = Math.cos(phi), nx = 150 * sp * 0.45;
    g.fillStyle = lg(g, -80 + nx, 0, 80 + nx, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-70 + nx, 120); g.lineTo(-76 + nx, by + 100); g.quadraticCurveTo(nx, by + (back ? 120 : 180), 76 + nx, by + 100); g.lineTo(70 + nx, 120); g.closePath(); g.fill();
    if (back) return;
    g.save(); g.translate(150 * sp, 0); g.scale(0.22 + 0.78 * cp, 1);
    if (P.kit === 'pack') {                          // backpack straps and white earphones round his neck
      g.strokeStyle = '#2f343c'; g.lineWidth = 46; g.lineCap = 'butt'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 170, by + 96); g.quadraticCurveTo(k * 210, by + 420, k * 190, by + 760); g.stroke(); }
      const sw = o.swing || 0;
      g.strokeStyle = '#f4f4f0'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-80, by + 40); g.quadraticCurveTo(-60 + sw * 40, by + 220, sw * 50, by + 250); g.quadraticCurveTo(60 + sw * 40, by + 220, 80, by + 40); g.stroke();
      for (const k of [-1, 1]) { ell(g, k * 82, by + 34, 14, 16); g.fillStyle = '#f4f4f0'; g.fill(); }
    } else if (P.kit === 'id') {                     // a red lanyard and a blank white card, swinging
      const sw = o.swing || 0;
      g.strokeStyle = '#c8323c'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(-70, by + 90); g.quadraticCurveTo(-20 + sw * 90, by + 420, sw * 120, by + 470); g.quadraticCurveTo(20 + sw * 90, by + 420, 70, by + 90); g.stroke();
      g.save(); g.translate(sw * 120, by + 470); g.rotate(-0.06 + sw * 0.8); R(g, -62, 0, 124, 160, 10); g.fillStyle = '#fbfbf7'; g.fill(); g.strokeStyle = '#99a'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#c8cfdb'; R(g, -40, 22, 80, 60, 6); g.fill(); g.fillStyle = '#9aa4b5'; for (const yy of [100, 122]) { R(g, -42, yy, 84, 10, 4); g.fill(); } g.restore();
    }
    g.restore();
  }
  // legs from the hips (which bob with the stride) to the feet (which stay on the ground); the swing foot lifts
  function legs(g, D, ph, wk, bob, back, kameez) {
    const order = Math.sin(ph) * (back ? -1 : 1) > 0 ? [1, -1] : [-1, 1];
    for (const k of order) {
      const lp = ph + (k > 0 ? Math.PI : 0), fwd = Math.sin(lp) * wk, lift = Math.max(0, Math.cos(lp)) * wk;
      const hx = k * 96, hy = (kameez ? 1180 : 968) + bob, fx = k * (100 + 10 * fwd), fy = 1560 + 30 * fwd * (back ? -1 : 1) - 52 * lift;
      g.fillStyle = D.leg || '#3a3f4b';
      g.beginPath(); g.moveTo(hx - 70, hy - 60); g.lineTo(hx + 70, hy - 60); g.lineTo(fx + 50, fy - 30); g.lineTo(fx - 50, fy - 30); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.14)'; g.beginPath(); g.moveTo(hx + k * 70, hy - 60); g.lineTo(fx + k * 50, fy - 30); g.lineTo(fx + k * 22, fy - 30); g.lineTo(hx + k * 30, hy - 60); g.closePath(); g.fill();
      g.fillStyle = D.shoe || '#211a16'; R(g, fx - 72, fy - 44, 144, 70, 30); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.12)'; R(g, fx - 60, fy - 40, 120, 12, 6); g.fill();
    }
  }
  // a person, head at (x, y), scale s (the head is about 400 s wide). See the notes above torso() for the options.
  function figure(g, P, x, y, s, o = {}) {
    const D = P.D, L = P.L, ph = o.phase ?? 0, wk = o.walk ?? 0;
    const bob = -wk * 18 * Math.cos(2 * ph) + (o.breath || 0), sway = wk * 8 * Math.sin(ph);
    const phi = clamp(o.yaw || 0, -0.95, 0.95), sp = Math.sin(phi), back = !!o.back;
    g.save(); g.translate(x, y); g.scale(s, s); if (o.roll) g.rotate(o.roll);
    if (o.legs) legs(g, D, ph, wk, bob, back, D.kameez);
    g.save(); g.translate(sway, bob);
    if (o.lean) { g.translate(0, 968); g.rotate(o.lean); g.translate(0, -968); }
    if (o.squash) { g.translate(0, 968); g.scale(1 + o.squash * 0.4, 1 - o.squash); g.translate(0, -968); }
    const pose = (k) => {
      const ov = o.arms && o.arms[k > 0 ? 'r' : 'l'], ps = wk * 0.42 * Math.sin(ph + (k > 0 ? 0 : Math.PI)) * ((o.swingK && o.swingK[k > 0 ? 1 : 0]) ?? 1);
      const base = { a1: 0.07 + 0.04 * Math.abs(ps), a2: 0.12 + 0.42 * Math.max(0, ps), hand: (o.hands && o.hands[k > 0 ? 'r' : 'l']) || 'relax', len: [1 - 0.06 * Math.max(0, ps), 1 - 0.2 * Math.max(0, ps)] };
      if (!ov) return base;
      const w = ov.w ?? 1;
      return { a1: lerp(base.a1, ov.a1, w), a2: lerp(base.a2, ov.a2, w), hand: w > 0.5 ? ov.hand || base.hand : base.hand, len: base.len.map((v, i) => lerp(v, (ov.len || [1, 1])[i], w)) };
    };
    const near = sp > 0.03 ? -1 : sp < -0.03 ? 1 : 0;     // the arm that comes round to you
    if (near) arm(g, P, -near, pose(-near), phi, o);
    torso(g, P, phi, back, o);
    neckAndKit(g, P, phi, back, o);
    if (near) arm(g, P, near, pose(near), phi, o); else { arm(g, P, -1, pose(-1), phi, o); arm(g, P, 1, pose(1), phi, o); }
    g.save(); g.translate(150 * sp * 0.42 + (o.headX || 0), (o.headBob ?? -wk * 4 * Math.cos(2 * ph - 0.5))); g.rotate(o.tilt || 0);
    const hy = clamp((o.headYaw || 0) + phi * 0.6, -1.15, 1.15);
    const face = () => head(g, L, { op: o.op, close: o.close, look: o.look, frown: o.frown, worry: o.worry, smile: o.smile, smirk: o.smirk, browY: o.browY, browUp: o.browUp, yaw: hy, rim: o.rim, hairFlop: o.hairFlop });
    const fm = back ? (o.faceMix ?? (o.showFace ? 1 : 0)) : 1;                  // seen from behind: 0 the back of his head, 1 his face turned round
    if (fm <= 0.001) headBack(g, L, o);
    else if (fm >= 0.999) face();
    else { g.save(); g.globalAlpha *= 1 - fm; headBack(g, L, o); g.restore(); g.save(); g.globalAlpha *= fm; face(); g.restore(); }
    g.restore();
    g.restore();
    g.restore();
  }
  const MEN = [
    { L: ONE, D: SH.ONE, kit: 'pack' },
    { L: TWO, D: SH.TWO, kit: 'id' },
    { L: THREE, D: SH.THREE, kit: 'veg' },
  ];
  const THIEF_P = { L: THIEF, D: SH.THIEF, kit: 'glass' };

  // ------------------------------------------------------------------ the world: a market lane in true perspective
  // Lane coordinates are the old picture's: x across the frame, y down the lane image (the camera window is camY below its top). A point at
  // height Y above the ground, X across, Z ahead (camera at cz) sits at x = 540 + X·s, y = HZ + (EYE − Y)·s, with s = FOC/(Z − cz).
  // You stop at Z = 0, so after the bumps every old lane position (the men, the wallet, the litter) is where it always was.
  const HZ = 690, EYE = 1400, FOC = 1000, LW = 1500, ZEND = 15000, LH = H + 760;
  const HAZE = '#f8d4a2', SHADE = '#45303a';
  const P3 = (X, Y, Z, cz) => { const dz = Z - cz; if (dz < 30) return null; const s = FOC / dz; return [540 + X * s, HZ + (EYE - Y) * s, s]; };
  const onFloor = (x, y) => { const s = (y - HZ) / EYE; return [(x - 540) / s, FOC / s]; };     // a floor point seen at (x, y) once you've stopped → [X, Z]
  // the chai stall on your left, well beyond where the three end up, so the season's thief reads as a man at the back, never a fourth suspect
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
    // the upper floor: windows, some lit
    if (sh.h > 3800) { const nw = Math.max(1, Math.round(len / 800)); for (let j = 0; j < nw; j++) { const za = sh.z0 + (j + 0.22) * len / nw, zb = sh.z0 + (j + 0.78) * len / nw; quad(za, zb, 3000, 3700, tone('#3a3f4a')); quad(za + 30, zb - 30, 3040, 3660, r() > 0.5 ? mix('#ffd38a', HAZE, hz) : tone('#5a6070')); quad(za - 20, zb + 20, 2960, 3010, tone('#ffffff', 0.05)); } }
    if (sh.kind === 'shut') { quad(sh.z0 + 90, z1 - 90, 0, 2500, tone('#8d9197')); for (let y = 120; y < 2500; y += 110) quad(sh.z0 + 90, z1 - 90, y, y + 22, tone('#6f747b')); return; }
    if (sh.kind === 'chai') return chaiStall(g, sh, cz, tw, pt, quad, tone, hz);
    // the shop's dark mouth, and what's inside it
    quad(sh.z0 + 90, z1 - 90, 0, 2450, tone('#2a211d', -0.1));
    g.save(); if (quad(sh.z0 + 90, z1 - 90, 0, 2450, null)) g.clip();
    const n = Math.max(3, Math.round(len / 320));
    for (let j = 0; j < n; j++) {
      const za = sh.z0 + 90 + (j + 0.1) * (len - 180) / n, zb = za + 0.8 * (len - 180) / n, c = mix(GOODS[(j + sh.seed) % GOODS.length], '#3a2c26', 0.38);
      if (sh.kind === 'cloth') quad(za, zb, 200, 2300 - (j % 3) * 260, tone(c), -280);
      else if (sh.kind === 'pots') { for (let y = 360; y < 2100; y += 420) { const p = pt((za + zb) / 2, y + 120, -250); if (!p) continue; g.fillStyle = tone(mix(j % 2 ? '#a9aeb4' : '#c3c7cc', '#3a2c26', 0.3)); ell(g, p[0], p[1], 120 * p[2], 95 * p[2]); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; ell(g, p[0] - 40 * p[2], p[1] - 30 * p[2], 30 * p[2], 16 * p[2]); g.fill(); } }
      else if (sh.kind === 'sweets') { quad(za, zb, 700, 1150, tone('#f3e2b8'), -200); quad(za, zb, 1150, 1240, tone(['#f0a640', '#f4d36a', '#e86f6f', '#f7ebd0'][j % 4]), -200); }
      else if (sh.kind === 'fruit') { quad(za, zb, 500, 1000, tone(['#f2c230', '#f08a24', '#e2412f', '#7fb33d'][j % 4]), -120); quad(za, zb, 1000, 1080, tone('#8a5a2c'), -120); }
      else { for (let y = 260; y < 2200; y += 420) quad(za, zb, y, y + 260, tone(mix(GOODS[(j * 3 + y / 420 + sh.seed) % GOODS.length | 0], '#3a2c26', 0.38)), -260); }
    }
    quad(sh.z0 + 90, z1 - 90, 0, 2450, 'rgba(28,16,12,0.22)');                  // the shop's own shade over its goods
    g.restore();
    // a board over the mouth, the awning sticking out into the lane, and what hangs under it
    quad(sh.z0 + 60, z1 - 60, 2480, 2820, tone(GOODS[(sh.seed >> 3) % GOODS.length], 0.04));
    if (sh.aw) {
      const a0 = 2950, a1 = 2560, out = 420, ns = Math.max(4, Math.round(len / 220));
      for (let m = 0; m < ns; m++) {
        const za = sh.z0 + 40 + m * (len - 80) / ns, zb = za + (len - 80) / ns;
        const c = sh.aw === 'stripeR' ? (m % 2 ? '#f6efe2' : '#d9402f') : sh.aw === 'stripeB' ? (m % 2 ? '#f6efe2' : '#2f6fb0') : sh.aw;
        poly(g, [pt(za, a0, 0), pt(zb, a0, 0), pt(zb, a1, out), pt(za, a1, out)], tone(c));
      }
      poly(g, [pt(sh.z0 + 40, a1, out), pt(z1 - 40, a1, out), pt(z1 - 40, a1 - 60, out), pt(sh.z0 + 40, a1 - 60, out)], 'rgba(0,0,0,0.16)');
      if ((sh.kind === 'cloth' || sh.kind === 'fruit') && (sh.z0 + sh.z1) / 2 - cz > 3200) {   // (hanging pots read as a grey staircase beside VICTIM: the fresh review)
        for (let j = 0; j < 5; j++) {
          const zz = sh.z0 + (j + 0.5) * len / 5, p0 = pt(zz, a1 - 20, out * 0.7), p1 = pt(zz, a1 - 520, out * 0.7); if (!p0 || !p1) continue;
          const c = sh.kind === 'fruit' ? '#f2c230' : sh.kind === 'pots' ? '#d7dadd' : GOODS[(j + 2) % GOODS.length], wv = 0.03 * Math.sin(tw * 2.1 + j);
          g.save(); g.translate(p0[0], p0[1]); g.rotate(wv); g.fillStyle = mix(c, HAZE, hz); const w = 140 * p0[2], hgt = p1[1] - p0[1];
          if (sh.kind === 'fruit') { for (let b = 0; b < 4; b++) { ell(g, (b - 1.5) * w * 0.35, hgt * 0.6, w * 0.16, hgt * 0.42, (b - 1.5) * 0.25); g.fill(); } }
          else R(g, -w / 2, 0, w, hgt, w * 0.2), g.fill();
          g.restore();
        }
      }
    }
    // goods on the ground at the shop's front
    if (sh.kind === 'grocery' || sh.kind === 'fruit') {
      for (let j = 0; j < 3; j++) { const za = sh.z0 + 200 + j * (len - 400) / 3, zb = za + (len - 400) / 4; quad(za, zb, 0, 520, tone('#a8784a'), 150); quad(za, zb, 520, 600, tone(['#e8c34a', '#d2462f', '#f0e6c8'][j % 3]), 150); }
    }
  }
  // the chai stall: a niche in the wall, a counter, a kettle on the boil, glasses, packets on strings, the blue tarp and a string of bulbs
  function chaiStall(g, sh, cz, tw, pt, quad, tone, hz) {
    const z0 = sh.z0, z1 = sh.z1;
    quad(z0 + 60, z1 - 60, 0, 2700, tone('#2b1d14', -0.1));
    for (let j = 0; j < 9; j++) { const za = z0 + 300 + j * 100; quad(za, za + 70, 1700 + (j % 3) * 120, 2500, mix(GOODS[j % 6], HAZE, hz), -80); }
    // the counter: its face along the lane, its near end towards you, its top
    const cz0 = z0 + 260, cz1 = z1 - 160, d = 430;
    quad(cz0, cz1, 0, 1100, tone('#7a4a24'), d);
    poly(g, [pt(cz0, 0, 0), pt(cz0, 0, d), pt(cz0, 1100, d), pt(cz0, 1100, 0)], tone('#5a3519'));
    poly(g, [pt(cz0, 1100, 0), pt(cz0, 1100, d), pt(cz1, 1100, d), pt(cz1, 1100, 0)], tone('#c99a5e'));
    for (let i = 1; i < 5; i++) quad(cz0, cz1, i * 210, i * 210 + 14, 'rgba(0,0,0,0.18)', d);
    // on the counter: a kettle and a row of glasses
    const kp = pt(cz0 + 520, 1100, 200), gp = pt(cz0 + 220, 1100, 300);
    if (kp) { g.save(); g.translate(kp[0], kp[1]); g.scale(kp[2], kp[2]); g.fillStyle = '#8f949b'; R(g, -110, -280, 220, 280, 40); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; R(g, -90, -260, 30, 220, 14); g.fill(); g.strokeStyle = '#6a6e74'; g.lineWidth = 18; g.beginPath(); g.arc(110, -190, 60, -1.2, 1.2); g.stroke(); g.fillStyle = '#ff8a2a'; ell(g, 0, 10, 110, 22); g.fill(); g.restore(); steam(g, kp[0], kp[1] - 300 * kp[2], tw, kp[2] * 2.4, 0.5); }
    if (gp) { for (let i = 0; i < 4; i++) { const q = pt(cz0 + 160 + i * 90, 1100, 330); if (q) glass(g, q[0], q[1] - 60 * q[2], q[2] * 0.42); } }
    // the tarp: blue, out over the lane, scalloped
    const a0 = 3150, a1 = 2620, out = 760, zA = z0 - 120, zB = z1 + 60;
    const T0 = pt(zA, a0, 0), T1 = pt(zB, a0, 0), T2 = pt(zB, a1, out), T3 = pt(zA, a1, out);
    if (poly(g, [T0, T1, T2, T3], null)) { g.fillStyle = lg(g, 0, T0[1], 0, T3[1] + 40, [0, mix('#2b6fb3', HAZE, hz)], [1, mix('#1f4f82', HAZE, hz)]); g.fill(); }
    for (let m = 0; m < 6; m++) { const za = zA + m * (zB - zA) / 6, zb = za + (zB - zA) / 6, p = pt(za, a1, out), q = pt(zb, a1, out), mid = pt((za + zb) / 2, a1 - 130, out); if (p && q && mid) { g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(mid[0], mid[1], q[0], q[1]); g.closePath(); g.fillStyle = mix('#1f4f82', HAZE, hz); g.fill(); } }
    // the bulbs along the tarp's edge
    for (let m = 0; m <= 8; m++) { const zz = zA + 100 + m * (zB - zA - 200) / 8, p = pt(zz, a1 - 60 - 70 * Math.sin(m / 8 * Math.PI), out - 40); if (!p) continue; bulb(g, p[0], p[1], p[2], 0.85 + 0.15 * Math.sin(tw * 3 + m)); }
    // CHAI 10/-, on a board hanging from the tarp's near edge, facing you
    const B0 = P3(-(LW - 300), 2560, zA - 10, cz), B1 = P3(-(LW - 860), 2160, zA - 10, cz);
    if (B0 && B1) { const w = B1[0] - B0[0], h = B1[1] - B0[1]; g.strokeStyle = 'rgba(30,20,10,0.8)'; g.lineWidth = Math.max(1, 6 * B0[2]); g.beginPath(); g.moveTo(B0[0] + w * 0.15, B0[1]); g.lineTo(B0[0] + w * 0.15, B0[1] - 70 * B0[2]); g.moveTo(B0[0] + w * 0.85, B0[1]); g.lineTo(B0[0] + w * 0.85, B0[1] - 70 * B0[2]); g.stroke(); R(g, B0[0], B0[1], w, h, 6 * B0[2]); g.fillStyle = mix('#23302a', HAZE, hz * 0.6); g.fill(); g.strokeStyle = mix('#8a6a3f', HAZE, hz * 0.6); g.lineWidth = Math.max(1, 12 * B0[2]); g.stroke(); txt(g, 'CHAI 10/-', B0[0] + w / 2, B0[1] + h * 0.7, h * 0.62, mix('#f4efe0', HAZE, hz * 0.6), { align: 'center', fit: w * 0.86 }); }
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
  // strings across the lane: bunting (pink, yellow, blue, white: nothing that reads as a flag), bulbs, and the wires every lane has
  const STRINGS = [[2300, 'bunt', 3900, 3350], [4700, 'bulbs', 3650, 3200], [6300, 'bunt', 4000, 3450], [8300, 'bulbs', 3700, 3250], [10200, 'bunt', 3900, 3400], [12400, 'bulbs', 3700, 3300]];
  function strings(g, cz, tw) {
    for (const [z, kind, yEnd, yMid] of [...STRINGS].sort((a, b) => b[0] - a[0])) {
      const dz = z - cz; if (dz < 300) continue;
      const hz = clamp((dz - 2400) / 11000) * 0.6, N = kind === 'bunt' ? 16 : 11;
      const at = (u) => { const X = lerp(-LW, LW, u), Y = lerp(yEnd, yEnd, u) - (yEnd - yMid) * 4 * u * (1 - u); return P3(X, Y, z, cz); };
      g.strokeStyle = 'rgba(30,25,20,0.65)'; g.lineWidth = Math.max(1, 6 * FOC / dz); g.beginPath();
      for (let i = 0; i <= 24; i++) { const p = at(i / 24); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.stroke();
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N, p = at(u), s = p[2];
        if (kind === 'bunt') { const fl = 18 * Math.sin(tw * 3.1 + i * 1.7 + z) * s; g.fillStyle = mix(['#ff7fb0', '#ffd84a', '#5ab8ff', '#fff6e0'][i % 4], HAZE, hz); g.beginPath(); g.moveTo(p[0] - 70 * s, p[1]); g.lineTo(p[0] + 70 * s, p[1]); g.lineTo(p[0] + fl, p[1] + 150 * s); g.closePath(); g.fill(); }
        else bulb(g, p[0], p[1] + 20 * s, s, 0.8 + 0.2 * Math.sin(tw * 2.3 + i));
      }
    }
    // two loose wires, corner to corner
    g.strokeStyle = 'rgba(25,20,18,0.55)';
    for (const [za, zb, ya, yb] of [[1400, 5200, 4300, 4100], [3600, 9800, 4500, 4200]]) { const a = P3(-LW, ya, za, cz), b = P3(LW, yb, zb, cz), m = P3(0, (ya + yb) / 2 - 700, (za + zb) / 2, cz); if (!a || !b || !m) continue; g.lineWidth = Math.max(1, 5 * m[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2, b[0], b[1]); g.stroke(); }
  }
  // what's lying on the floor: marigold petals and leaves, scattered; and the near ground's own things where they always lay
  const LITTER = (() => { const r = mulberry32(3488), out = []; for (let i = 0; i < 260; i++) { const X = (r() - 0.5) * 2 * (LW - 120), Z = -4800 + r() * 19000, c = r(); out.push({ X, Z, rot: r() * 3, k: c > 0.3 ? 'petal' : 'leaf', col: c > 0.55 ? '#f39a1e' : c > 0.3 ? '#f7c52b' : r() > 0.5 ? '#7fa83e' : '#c79a4a' }); } return out; })();
  const WG = [710, 1525];                            // where the wallet lies: in the world, by your right foot (on screen y ≈ 1456 once you've stopped)
  const WGW = onFloor(...WG);
  const NEAR = [['cup', 1010, 1530], ['paper', 262, 1650], ['bag', 452, 1612], ['leaf', 574, 1708]].map(([k, x, y]) => [k, ...onFloor(x, y), (y - HZ) / EYE]);
  function floor(g, cz, tw) {
    const fz = cz + 150, A = P3(-LW, 0, fz, cz), B = P3(LW, 0, fz, cz), Cc = P3(LW, 0, ZEND + 3000, cz), D = P3(-LW, 0, ZEND + 3000, cz);
    poly(g, [D, Cc, B, A], null); g.fillStyle = lg(g, 0, HZ, 0, LH, [0, '#e9d0a6'], [0.12, '#d9bd93'], [0.45, '#bca07e'], [1, '#a08467']); g.fill();
    // the low sun down the middle of the lane, and the left wall's shade
    g.save(); poly(g, [D, Cc, B, A], null); g.clip();
    g.fillStyle = rg(g, 540, HZ + 10, 10, 900, [0, 'rgba(255,226,170,0.55)'], [1, 'rgba(255,226,170,0)']); g.fillRect(-400, HZ, W + 800, 1000);
    const s0 = P3(-LW, 0, fz, cz), s1 = P3(-LW + 900, 0, fz, cz), s2 = P3(-LW + 260, 0, ZEND, cz), s3 = P3(-LW, 0, ZEND, cz);
    poly(g, [s0, s1, s2, s3], 'rgba(70,40,40,0.16)');
    // paving: joints across and along
    g.strokeStyle = 'rgba(70,55,35,0.2)';
    for (let z = Math.ceil((cz + 260) / 560) * 560; z < ZEND; z += 560) { const a = P3(-LW, 0, z, cz), b = P3(LW, 0, z, cz); g.lineWidth = Math.max(1, 5 * a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (let i = -4; i <= 4; i++) { const X = i * 340, a = P3(X, 0, cz + 200, cz), b = P3(X, 0, ZEND, cz); g.lineWidth = 3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (const p of LITTER) {
      if (Math.abs(p.X - WGW[0]) < 420 && Math.abs(p.Z - WGW[1]) < 520) continue;   // nothing that could be mistaken for the wallet, or hide it
      const q = P3(p.X, 0, p.Z, cz); if (!q || q[2] > 1.6) continue; const s = q[2];
      g.save(); g.translate(q[0], q[1]); g.rotate(p.rot); g.fillStyle = p.col;
      if (p.k === 'petal') { ell(g, 0, 0, 16 * s, 9 * s); g.fill(); } else { g.beginPath(); g.moveTo(-46 * s, 0); g.quadraticCurveTo(0, -20 * s, 46 * s, 0); g.quadraticCurveTo(0, 20 * s, -46 * s, 0); g.fill(); }
      g.restore();
    }
    for (const [k, X, Z, s0] of NEAR) {
      const q = P3(X, 0, Z, cz); if (!q) continue; const s = q[2] / s0;
      g.save(); g.translate(q[0], q[1]); g.scale(s, s);
      if (k === 'cup') { g.rotate(0.3); g.fillStyle = 'rgba(0,0,0,0.18)'; ell(g, 6, 26, 46, 14); g.fill(); g.fillStyle = '#f4efe2'; g.beginPath(); g.moveTo(-30, -34); g.lineTo(30, -34); g.lineTo(22, 30); g.lineTo(-22, 30); g.closePath(); g.fill(); g.fillStyle = '#c94a2a'; g.fillRect(-26, -16, 50, 12); ell(g, 0, -34, 30, 9); g.fillStyle = '#e6dfcf'; g.fill(); }
      else if (k === 'paper') { g.fillStyle = '#ece6d4'; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = 30 + 12 * ((i * 37) % 5) / 5; g.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.6); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 3; g.stroke(); }
      else if (k === 'bag') { g.rotate(-0.25); g.fillStyle = '#b98b55'; g.beginPath(); g.moveTo(-58, -14); g.lineTo(-20, -30); g.lineTo(30, -22); g.lineTo(62, -4); g.lineTo(48, 22); g.lineTo(-6, 28); g.lineTo(-50, 18); g.closePath(); g.fill(); g.strokeStyle = 'rgba(90,60,30,0.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-30, -10); g.lineTo(10, 6); g.lineTo(40, -6); g.stroke(); }
      else { g.rotate(-0.5); g.fillStyle = '#8a5f2f'; ell(g, 0, 0, 52, 17); g.fill(); g.strokeStyle = '#5f3f1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(-50, 0); g.lineTo(52, 0); g.stroke(); }
      g.restore();
    }
    g.restore();
  }
  // the sky, the low sun, and the street across the far end (the series' colours: reel 20's dusk)
  let SKY = null;
  function makeSky() {
    const c = offscreen(W + 400, 1500), g = c.getContext('2d'), r = mulberry32(3411);
    g.fillStyle = lg(g, 0, 0, 0, 1500, [0, '#e9814f'], [0.55, '#f6b877'], [0.82, '#fcdcac'], [1, '#fde7c2']); g.fillRect(0, 0, W + 400, 1500);
    g.fillStyle = rg(g, 760, 1210, 10, 900, [0, 'rgba(255,248,215,0.95)'], [0.18, 'rgba(255,226,160,0.7)'], [1, 'rgba(255,200,140,0)']); g.fillRect(0, 0, W + 400, 1500);
    g.fillStyle = '#fff6da'; ell(g, 760, 1210, 64, 64); g.fill();
    g.fillStyle = 'rgba(160,104,120,0.42)'; for (let x = 0; x < W + 400;) { const w = 90 + r() * 120, hh = 120 + r() * 260; g.fillRect(x, 1500 - hh, w, hh); x += w; }
    SKY = c;
  }
  function farEnd(g, cz) {
    const z = ZEND + 2600, r = mulberry32(3419), cols = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#e88aa0'];
    for (let X = -5200, i = 0; X < 5200; i++) {
      const w = 900 + r() * 700, hgt = 2600 + r() * 2200, a = P3(X, hgt, z, cz), b = P3(X + w, 0, z, cz); if (!a || !b) break;
      g.fillStyle = mix(cols[i % 6], HAZE, 0.5); g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      g.fillStyle = mix('#ffe2a0', HAZE, 0.3); for (let wy = hgt - 500; wy > 900; wy -= 700) for (let wx = X + 160; wx < X + w - 200; wx += 380) { const p = P3(wx, wy, z, cz), q = P3(wx + 200, wy - 340, z, cz); if (r() > 0.4) g.fillRect(p[0], p[1], q[0] - p[0], q[1] - p[1]); }
      if (i % 2) { const t0 = P3(X + w * 0.55, hgt + 520, z, cz), t1 = P3(X + w * 0.55 + 420, hgt, z, cz); g.fillStyle = '#4a3a3a'; g.fillRect(t0[0], t0[1], t1[0] - t0[0], t1[1] - t0[1]); }
      X += w;
    }
  }
  function light(g, cz, tw) {                         // the low sun's shafts down the lane, and the dust turning in them
    g.save(); g.globalCompositeOperation = 'lighter';
    const sx = 560, sy = 450;
    for (const [a0, a1, al] of [[1.1, 1.22, 0.07], [1.34, 1.42, 0.05], [1.55, 1.66, 0.06], [1.82, 1.9, 0.04]]) {
      const L = 2600; g.fillStyle = lg(g, sx, sy, sx + Math.cos((a0 + a1) / 2) * L, sy + Math.sin((a0 + a1) / 2) * L, [0, `rgba(255,214,150,${al})`], [1, 'rgba(255,214,150,0)']);
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a0) * L, sy + Math.sin(a0) * L); g.lineTo(sx + Math.cos(a1) * L, sy + Math.sin(a1) * L); g.closePath(); g.fill();
    }
    const r = mulberry32(3423);
    for (let i = 0; i < 70; i++) { const x0 = r() * W, y0 = 200 + r() * 1300, sp = 8 + r() * 14, ph = r() * TAU; const x = x0 + NA(tw * 0.25 + i) * 40, y = ((y0 - tw * sp) % 1300 + 1300) % 1300 + 200, a = 0.25 + 0.25 * Math.sin(tw * 1.7 + ph); g.fillStyle = `rgba(255,236,190,${a})`; ell(g, x, y, 2.4 + (i % 3), 2.4 + (i % 3)); g.fill(); }
    g.restore();
  }
  function world(g, c, tw) {
    const cz = c.camZ;
    if (!SKY) makeSky();
    g.drawImage(SKY, -200, HZ - 1500 + 40);
    g.fillStyle = '#e9814f'; g.fillRect(-400, -1200, W + 800, HZ - 1500 + 40 + 1200);
    farEnd(g, cz);
    floor(g, cz, tw);
    for (const sh of SHOPS) shop(g, sh, cz, tw);
    for (const [s, side, z, bgc, fg] of SIGNS) {
      const a = P3(side * (LW - 40), 3650, z, cz), b = P3(side * (LW - 700), 3100, z, cz); if (!a || !b) continue;
      const hz = clamp((z - cz - 2400) / 11000) * 0.6, x0 = Math.min(a[0], b[0]), w = Math.abs(b[0] - a[0]), h = b[1] - a[1];
      g.fillStyle = 'rgba(30,25,20,0.6)'; g.fillRect(x0 + (side > 0 ? w : -6 * a[2]), a[1] + h * 0.4, 6 * a[2] + 1, h * 0.2);
      R(g, x0, a[1], w, h, 4 * a[2]); g.fillStyle = mix(bgc, HAZE, hz); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = Math.max(1, 4 * a[2]); g.stroke();
      txt(g, s, x0 + w / 2, a[1] + h * 0.74, h * 0.66, mix(fg, HAZE, hz), { align: 'center', fit: w * 0.86 });
    }
    strings(g, cz, tw);
  }

  // ------------------------------------------------------------------ the crowd: people at their own depths, walking both ways, in the low sun
  // Nobody here may be taken for one of the three or for the season's thief (the fresh review of final 9: a grey-haired extra in cream
  // stood under the thief's cap). The women and children face you; the men are only ever seen from behind, and none of them is grey, or
  // in beige, checks, light blue or green, or in a cap. Nobody walks on your left, where the stall and the thief are.
  const WOMEN = [
    { L: { skin: '#b57d58', skinD: '#8c5a3a', skinH: '#cc9a74', hair: '#1a1410', style: 'long', jaw: 0.92, ew: 44, eh: 24, brow: 11, browTilt: -2, braid: true }, D: { a: '#ef7fa8', b: '#cf5b86', sleeve: 'short', kameez: true, dupatta: '#ffd84a', leg: '#f3e6d8', shoe: '#8a3a2a' } },
    { L: { skin: '#c48a5c', skinD: '#9a6640', skinH: '#d9a47a', hair: '#1a1410', style: 'bun', jaw: 0.94, ew: 44, eh: 24, brow: 11, browTilt: 0 }, D: { a: '#4a6fd8', b: '#3554b0', sleeve: 'short', kameez: true, dupatta: '#f6efe2', leg: '#f6efe2', shoe: '#5a3a2a' } },
    { L: { skin: '#c99068', skinD: '#a06a46', skinH: '#ddb08c', hair: '#1a1410', style: 'long', jaw: 0.9, ew: 45, eh: 25, brow: 11, browTilt: -2 }, D: { a: '#e7a8c2', b: '#c9809f', sleeve: 'long', cuff: '#e7a8c2', leg: '#3a3f6a', shoe: '#f0ece4' } },
    { L: { skin: '#d4a079', skinD: '#ab7a55', skinH: '#e6bc97', hair: '#8a8580', style: 'bun', jaw: 0.95, ew: 40, eh: 21, brow: 11, browTilt: 3 }, D: { a: '#7a59b8', b: '#5b3f94', sleeve: 'long', cuff: '#7a59b8', kameez: true, dupatta: '#d9d4c8', leg: '#d9d4c8', shoe: '#3a2b20' } },
    { L: { skin: '#a8714d', skinD: '#80522f', skinH: '#c08a64', hair: '#120d0a', style: 'long', jaw: 0.92, ew: 44, eh: 24, brow: 11, browTilt: -1, braid: true }, D: { a: '#e3b23c', b: '#c4952a', sleeve: 'short', kameez: true, dupatta: '#c8323c', leg: '#f3e6d8', shoe: '#5a3a2a' } },
  ];
  const MEN_BACK = [
    { L: { skin: '#a8714d', skinD: '#80522f', skinH: '#c08a64', hair: '#120d0a', style: 'short', jaw: 0.95, ew: 44, eh: 24, brow: 13, browTilt: -3 }, D: { a: '#8e6fd1', b: '#6c4fae', sleeve: 'long', cuff: '#8e6fd1', leg: '#2f3442', shoe: '#e8e6e0' } },
    { L: { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983', hair: '#17110d', style: 'short', jaw: 1.02, ew: 42, eh: 22, brow: 14, browTilt: 2 }, D: { a: '#f2c14e', b: '#d39f2c', sleeve: 'short', leg: '#3f3a36', shoe: '#2b2420' } },
    { L: { skin: '#b57d58', skinD: '#8c5a3a', skinH: '#cc9a74', hair: '#1a1410', style: 'short', jaw: 0.92, ew: 46, eh: 26, brow: 12, browTilt: -4 }, D: { a: '#2f3f6e', b: '#22305a', sleeve: 'short', leg: '#3a3f4b', shoe: '#f0ece4' } },
    { L: { skin: '#c99068', skinD: '#a06a46', skinH: '#ddb08c', hair: '#17110d', style: 'short', jaw: 1.0, ew: 42, eh: 22, brow: 13, browTilt: 0 }, D: { a: '#e05a6f', b: '#bd3f54', sleeve: 'short', leg: '#4b4f5a', shoe: '#2b2420' } },
  ];
  const CROWD = (() => {
    const r = mulberry32(3477), out = [];
    for (let i = 0; i < 17; i++) {
      let X, Z0, v;
      // the ones up the middle never come nearer than about 4,400 in the whole film (well behind where the three end up: the re-check of
      // final 10 caught a walker coming through them to your wallet in the last shot); the ones on your right are gone once you look down
      if (i < 6) { X = 1060 + r() * 240; Z0 = -4000 + r() * 19000; v = (r() > 0.5 ? 1 : -1) * (500 + r() * 380); }
      else if (r() > 0.45) { X = -600 + r() * 1300; Z0 = 4600 + r() * 2800; v = 150 + r() * 200; }
      else { X = -600 + r() * 1300; Z0 = 12500 + r() * 2300; v = -(110 + r() * 150); }
      const toward = v < 0, P = toward ? WOMEN[i % WOMEN.length] : (i % 3 ? MEN_BACK[i % MEN_BACK.length] : WOMEN[(i + 2) % WOMEN.length]);
      out.push({ X, Z0, v, P, ph: r() * TAU, cad: 1.7 + r() * 0.5, kid: i % 7 === 4 && toward, side: i < 6 });
    }
    return out;
  })();
  const crowdAt = (p, tw) => -5000 + ((((p.Z0 + p.v * tw + 5000) % (ZEND + 5000)) + (ZEND + 5000)) % (ZEND + 5000));
  // a long evening shadow from someone's feet, towards you (the sun is low at the far end of the lane)
  function groundShadow(g, X, Z, cz, a = 0.26) {
    const zf = Math.max(Z - 1500, cz + 260), p = [P3(X - 170, 0, Z, cz), P3(X + 170, 0, Z, cz), P3(X + 330, 0, zf, cz), P3(X - 30, 0, zf, cz)];
    if (p.some((q) => !q)) return;
    g.fillStyle = lg(g, 0, p[0][1], 0, p[2][1], [0, `rgba(60,30,26,${a})`], [1, 'rgba(60,30,26,0)']);
    poly(g, p, null); g.fill();
  }

  // ------------------------------------------------------------------ you: your right hand, your wallet, your shoes
  function wallet(g, x, y, s, rot, o = {}) {        // a brown leather bifold; o.flat squashes it onto the ground
    const fk = o.flatK ?? (o.flat ? 1 : 0);
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s * lerp(1, 0.6, fk));
    if (fk > 0) { g.fillStyle = `rgba(30,20,10,${0.32 * fk})`; ell(g, 8, 52, 118, 30); g.fill(); }
    R(g, -100, -64, 200, 128, 16); g.fillStyle = lg(g, -100, -64, 100, 64, [0, '#7d4f2c'], [1, '#553219']); g.fill();
    g.strokeStyle = '#3e2412'; g.lineWidth = 5; g.stroke();
    g.setLineDash([10, 8]); g.strokeStyle = 'rgba(230,190,140,0.55)'; g.lineWidth = 3; R(g, -86, -50, 172, 100, 10); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(255,230,190,0.16)'; R(g, -90, -58, 180, 18, 8); g.fill();
    g.strokeStyle = 'rgba(30,15,5,0.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-100, 4); g.lineTo(100, 4); g.stroke();
    g.restore();
  }
  // your right hand from the lower right: the forearm in a denim sleeve, the fingers under the wallet, the thumb on top.
  // o.hold: the wallet is in it. o.open: 0 closed round it, 1 open and empty, palm up (the "it's gone" look)
  function myHand(g, x, y, s, rot, o = {}) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, 120, 120, 520, 720, [0, '#4a6a94'], [1, '#2c4466']);
    g.beginPath(); g.moveTo(70, 150); g.bezierCurveTo(90, 90, 210, 60, 250, 110); g.lineTo(700, 760); g.lineTo(330, 960); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,220,170,0.35)'; g.lineWidth = 10; g.beginPath(); g.moveTo(84, 140); g.bezierCurveTo(100, 96, 200, 72, 244, 112); g.stroke();
    g.fillStyle = '#5b7ba6'; g.beginPath(); g.moveTo(70, 150); g.bezierCurveTo(90, 90, 210, 60, 250, 110); g.lineTo(290, 170); g.bezierCurveTo(240, 130, 120, 150, 100, 210); g.closePath(); g.fill();
    const op = o.open ?? 0;
    if (op < 0.5) {
      if (o.hold) wallet(g, -70, -10, 1.05, -0.12);
      g.fillStyle = lg(g, -130, -40, 160, 160, [0, '#d6a07a'], [1, '#a9744f']);
      ell(g, 110, 60, 120, 104, -0.3); g.fill();
      for (let i = 0; i < 4; i++) { R(g, -120 + i * 8, -6 + i * 34, 200, 36, 18); g.fill(); }
      g.fillStyle = 'rgba(120,60,30,0.18)'; for (let i = 0; i < 4; i++) { ell(g, -96 + i * 8, 12 + i * 34, 14, 8); g.fill(); }
      g.fillStyle = 'rgba(255,232,200,0.22)'; for (let i = 0; i < 4; i++) { ell(g, 40 + i * 6, 2 + i * 34, 30, 7); g.fill(); }
      g.save(); g.translate(40, -40); g.rotate(-2.45); R(g, 0, -26, 168, 52, 26); g.fillStyle = lg(g, 0, -26, 0, 26, [0, '#e4b08a'], [1, '#c48e68']); g.fill(); R(g, 130, -16, 30, 32, 12); g.fillStyle = '#f0d2bc'; g.fill(); g.restore();
    } else {
      g.save(); g.translate(120, 40); g.rotate(0.55); g.scale(-1, 1);
      const skin = lg(g, -150, -260, 150, 160, [0, '#e7b590'], [1, '#b98058']);
      g.fillStyle = skin;
      const curl = o.curl || 0;
      const fing = [[-78, -0.2, 190], [-26, -0.06, 220], [26, 0.06, 210], [76, 0.2, 170]];
      for (const [fx, a, L] of fing) { g.save(); g.translate(fx, -70); g.rotate(a); R(g, -24, -L * (1 - curl * 0.25), 48, L * (1 - curl * 0.25) + 30, 24); g.fill(); g.strokeStyle = 'rgba(120,60,30,0.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, -L * 0.55); g.lineTo(10, -L * 0.55); g.stroke(); g.fillStyle = 'rgba(255,236,220,0.5)'; R(g, -14, -L * (1 - curl * 0.25) + 6, 28, 30, 12); g.fill(); g.fillStyle = skin; g.restore(); }
      g.save(); g.translate(-108, 40); g.rotate(-0.85); R(g, -24, -150, 50, 170, 25); g.fill(); g.restore();
      R(g, -112, -96, 224, 230, 90); g.fill();
      g.strokeStyle = 'rgba(120,60,30,0.3)'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-70, -20); g.quadraticCurveTo(0, 20, 80, -30); g.moveTo(-60, 40); g.quadraticCurveTo(-10, 70, 40, 100); g.stroke();
      g.restore();
    }
    g.restore();
  }
  function myShoes(g, camY) {                       // your own trainers and jeans, at the bottom of the world
    for (const k of [-1, 1]) {
      g.save(); g.translate(540 + k * 176, 1860 - camY); g.rotate(k * 0.07);
      g.fillStyle = 'rgba(40,20,14,0.28)'; ell(g, 0, 40, 160, 50); g.fill();
      const toe = () => { g.beginPath(); g.moveTo(-118, 260); g.bezierCurveTo(-128, 40, -86, -66, 0, -70); g.bezierCurveTo(86, -66, 128, 40, 118, 260); g.closePath(); };
      toe(); g.fillStyle = '#f2efe6'; g.fill();
      g.save(); g.translate(0, 14); g.scale(0.9, 0.92); toe(); g.fillStyle = lg(g, -110, -40, 110, 200, [0, '#4a6fa3'], [1, '#26406a']); g.fill(); g.restore();
      g.fillStyle = '#e9e4d6'; g.beginPath(); g.moveTo(-70, -10); g.quadraticCurveTo(0, -52, 70, -10); g.quadraticCurveTo(0, -30, -70, -10); g.fill();
      g.strokeStyle = '#f4f1e8'; g.lineWidth = 8; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-36, 56 + i * 30); g.lineTo(36, 56 + i * 30); g.stroke(); }
      g.strokeStyle = 'rgba(255,230,190,0.5)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-100, 120); g.bezierCurveTo(-104, 20, -70, -50, 0, -60); g.stroke();
      // your jeans, down to you: wider as they come nearer, a crease and a shadow side
      g.fillStyle = lg(g, -200, 0, 200, 0, [0, '#3f6496'], [0.55, '#4a72a8'], [1, '#2c4a76']);
      g.beginPath(); g.moveTo(-150, 250); g.lineTo(150, 250); g.lineTo(206, 1150); g.lineTo(-206, 1150); g.closePath(); g.fill();
      R(g, -152, 206, 304, 220, 44); g.fill();
      g.strokeStyle = 'rgba(20,35,60,0.35)'; g.lineWidth = 8; g.beginPath(); g.moveTo(-120, 330); g.quadraticCurveTo(-40, 360, 40, 330); g.moveTo(10 * k, 430); g.lineTo(30 * k, 1150); g.stroke();
      g.restore();
    }
  }

  // ------------------------------------------------------------------ timing: the narration's words
  const at = (p) => words(p)[0].t0;
  const wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;
  const en = (p) => { const w = words(p); return w[w.length - 1].t1; };
  let T = null;
  function times() {
    if (T) return T;
    T = {
      n01e: en('n01'), c1: at('c1'), c2: at('c2'), c2e: en('c2'), c3: at('c3'), n02: at('n02'), gone: wi('n02', 3), n02e: en('n02'),
      n03: at('n03'), jail: wi('n03', 5), n03e: en('n03'), n04: at('n04'), n04e: en('n04'), n05: at('n05'), n05e: en('n05'), n06: at('n06'), n06e: en('n06'),
      n07: at('n07'), going: wi('n07', 4), bumping: wi('n07', 9), n07e: en('n07'), n07b: at('n07b'), nobody: wi('n07b', 4), n07be: en('n07b'), n08: at('n08'), four: wi('n08', 6), face: wi('n08', 12), numtwo: wi('n08', 16), n08e: en('n08'),
      n09: at('n09'), mis: wi('n09', 3), n09e: en('n09'), n10: at('n10'), victim: wi('n10', 3), n10e: en('n10'), end: tb('end'),
    };
    // the bumps, and the wallet: it leaves your hand at four seconds exactly, the jolt of the second bump
    T.b1 = T.c1 - 0.08; T.b2 = 3.95; T.drop = 4.0; T.b3 = T.c3 - 0.08;   // each bump lands just before its number
    T.stop = T.b2 + 0.12;                            // you stop dead
    T.lift = T.n02 - 0.05; T.lower = T.n03 - 0.25;   // the empty hand comes up, then goes
    T.freeze = T.n03 - 0.08; T.clock0 = T.n03e + 0.05; T.clock1 = T.clock0 + 5.0;
    T.down0 = T.n04 - 0.1; T.down1 = T.n04 + 0.3;    // "Look down.": a fast drop, the hit
    T.up0 = T.n07 - 0.35; T.up1 = T.n07 + 0.1;       // back up at the three of them
    T.face0 = T.n08 - 0.1; T.fin = T.n10 - 0.25;
    return T;
  }

  // ------------------------------------------------------------------ the three men: where they are, and how they move
  // Where each man is (head x, y, scale) and how he's turned, as a function of t (lane coordinates).
  const SPOT = [[330, 606, 0.46], [512, 592, 0.485], [678, 612, 0.465]];   // the line-up the freeze puts them in (big: their faces read on a phone; number three's ear inside 950 even mid-breath)
  const key = (t, ks) => {                          // piecewise smooth through [time, x, y, s, turn]
    if (t <= ks[0][0]) return ks[0].slice(1);
    for (let i = 0; i < ks.length - 1; i++) { const a = ks[i], b = ks[i + 1]; if (t <= b[0]) { const u = sstep(a[0], b[0], t); return a.slice(1).map((v, j) => lerp(v, b[j + 1], u)); } }
    return ks[ks.length - 1].slice(1);
  };
  const spline = (t, ks) => {                       // through [time, ...values], Catmull-Rom tangents: eases only at the two ends
    const n = ks.length;
    if (t <= ks[0][0]) return ks[0].slice(1);
    if (t >= ks[n - 1][0]) return ks[n - 1].slice(1);
    let i = 0; while (t > ks[i + 1][0]) i++;
    const a = ks[i], b = ks[i + 1], h = b[0] - a[0], u = (t - a[0]) / h;
    const tan = (k) => (k <= 0 || k >= n - 1) ? null : ks[k].map((_, j) => (ks[k + 1][j] - ks[k - 1][j]) / (ks[k + 1][0] - ks[k - 1][0]));
    const ma = tan(i), mb = tan(i + 1);
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
    return a.slice(1).map((v, j) => h00 * v + h10 * h * (ma ? ma[j + 1] : 0) + h01 * b[j + 1] + h11 * h * (mb ? mb[j + 1] : 0));
  };
  function menAt(t) {
    const TT = times();
    const F = TT.freeze, F1 = TT.freeze + 0.5;                                  // the line-up slides in as you look up at them
    if (t >= TT.fin) return SPOT.map(([x, y, s]) => [x + 130, y, s, 0]);      // the last shot: a little to your right, clear of the stall
    const m1 = key(t, [[0, 470, 700, 0.15, 0], [TT.b1 - 0.55, 330, 690, 0.42, 0], [TT.b1, 150, 760, 1.05, 0], [TT.b1 + 0.55, 70, 770, 1.12, 0], [TT.b1 + 1.0, -760, 800, 1.3, 0], [F - 0.4, -760, 800, 1.3, 0], [F, -300, 800, 1.3, 0], [F1, SPOT[0][0], SPOT[0][1], SPOT[0][2], 0]]);
    const m2 = key(t, [[0, 590, 690, 0.12, 0], [TT.b2 - 1.1, 570, 690, 0.3, 0], [TT.b2 - 0.25, 400, 760, 0.95, 0], [TT.b2, 230, 810, 1.3, 0], [TT.b2 + 0.32, 245, 800, 1.25, 0], [TT.b2 + 0.6, 400, 690, 0.66, 0], [TT.b2 + 1.0, 470, 610, 0.44, 0], [F, 470, 606, 0.43, 0], [F1, SPOT[1][0], SPOT[1][1], SPOT[1][2], 0]]);   // he holds through the slip, then steps well back
    // number three: in from your right, past you, up the lane. His feet are level with the wallet at about 5.78 s, clear of it even mid-stride;
    // after that they're well beyond it. His head is inside the 950 line from about 6.0 s.
    // (the fresh review of final 9: his near arm hung right beside the wallet at 4.6-5.4 s while he was close and big. He now passes
    // further right, 130 px or more clear of it, and drifts in towards the middle once he's small: his head is inside 950 by about 6.3 s,
    // before his glance back.)
    const P3W = [[TT.b2 + 0.35, 1560, 900, 1.3, 1], [TT.b3 - 0.6, 1360, 862, 1.25, 1], [TT.b3, 1230, 760, 0.95, 1], [TT.b3 + 0.34, 1070, 668, 0.56, 1], [TT.b3 + 0.59, 930, 645, 0.475, 1], [TT.b3 + 0.85, 840, 638, 0.445, 1], [TT.b3 + 1.6, 765, 632, 0.41, 1], [F, 750, 626, 0.38, 1]];
    const m3 = t < F ? spline(t, P3W) : key(t, [[F, 750, 626, 0.38, 1], [F1, SPOT[2][0], SPOT[2][1], SPOT[2][2], 0]]);
    return [m1, m2, m3];
  }
  // how each man moves and looks, as options for figure()
  const winK = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  function blinkAt(t, i, period = 3.4) { const u = ((t + 1.1 + i * 1.37) % period); return u < 0.06 ? sstep(0, 0.06, u) : u < 0.14 ? 1 - sstep(0.08, 0.14, u) : 0; }
  function poseOf(i, t, o = {}) {
    const TT = times(), F = TT.freeze, F1 = F + 0.5;
    if (t >= F1 || o.mood) {                        // the line-up: they stand and look at you; small life (a breath, a blink, a glance)
      const md = o.mood ? o.mood(i, t) : {};
      const live = !o.still;
      const dart = live ? 4 * NB(t * 0.9 + i * 7) : 0;
      const base = [{ frown: 0.22, worry: -2 }, { frown: 0.08, worry: -8 }, { frown: 0.3, worry: -3 }][i];
      return { walk: 0, breath: live ? 3 * Math.sin(t * TAU * 0.27 + i * 1.9) : 0, look: md.look || [dart, 4], close: md.close ?? (live && !o.noBlink ? blinkAt(t, i) : 0), frown: md.frown ?? base.frown, worry: md.worry ?? base.worry, smile: 0, headYaw: md.headYaw ?? (live ? 0.04 * NC(t * 0.4 + i * 3) : 0), tilt: md.tilt ?? 0, arms: i === 2 ? { r: { a1: 0.1, a2: 0.05, hand: 'bag' } } : undefined, bagSwing: 0, legs: true };
    }
    if (i === 0) {                                  // ONE: walking at you, eyes on his phone; looks up too late, a look as he squeezes past
      const ph = t * Math.PI * 1.9 + 0.4, up = sstep(TT.b1 - 0.27, TT.b1 - 0.12, t), pass = sstep(TT.b1 - 0.3, TT.b1 + 0.08, t), away = sstep(TT.b1 + 0.3, TT.b1 + 0.65, t);
      const phone = 1 - sstep(TT.b1 + 0.05, TT.b1 + 0.35, t), jar = kick(t, TT.b1, 0.09, 16, 8);   // your shoulder rocks him
      return { walk: 1, phase: ph, yaw: 0.5 * pass - 0.9 * away, headYaw: -0.2 * pass - 0.3 * away, look: [lerp(2, 12, up) * (1 - away), lerp(16, 2, up)], browY: lerp(10, 0, up), frown: lerp(0.05, 0.42, up), worry: lerp(0, -4, up), tilt: -0.05 * pass - jar * 0.6, roll: jar, hairFlop: Math.sin(ph * 2) * 0.6 + jar * 6,
        arms: { l: { a1: 0.12, a2: 2.0, hand: 'phone', w: phone } }, swing: 0.3 * Math.sin(ph) + jar * 2, legs: true };
    }
    if (i === 1) {                                  // TWO: hurrying, checking his watch; looks up too late; walks into you; "sorry, sorry", palms up; steps back and stares
      const ph = t * Math.PI * 2.25, hurry = 1 - sstep(TT.b2 - 0.08, TT.b2 + 0.02, t);
      const watch = winK(t, 0.45, 0.8, TT.b2 - 0.62, TT.b2 - 0.36), up = sstep(TT.b2 - 0.42, TT.b2 - 0.24, t);
      // through the bump his arms stay in at his sides; then both hands come up to his chest, palms out ("sorry, sorry"), and stay there as
      // he steps back: high and to the left, nowhere near the wallet (the fresh review of final 9: a hand that swung up to his shoulder
      // swept through it as it landed). The ramps on the impact keep the slow replay from skipping.
      const hitK = t >= TT.b2 ? Math.exp(-(t - TT.b2) * 9) * sstep(TT.b2, TT.b2 + 0.035, t) : 0, sorry = winK(t, TT.b2 + 0.06, TT.b2 + 0.24, TT.b2 + 1.0, TT.b2 + 1.35);
      const tuck = winK(t, TT.b2 - 0.25, TT.b2 - 0.1, TT.b2 + 0.04, TT.b2 + 0.12);
      const stepBack = winK(t, TT.b2 + 0.5, TT.b2 + 0.62, TT.b2 + 0.9, TT.b2 + 1.02);
      const startle = TT.b2 - 0.35 < t && t < TT.b2 + 0.55 ? 0.45 * sstep(TT.b2 - 0.35, TT.b2 - 0.1, t) * (1 - sstep(TT.b2 + 0.32, TT.b2 + 0.55, t)) : 0;
      const talk = sorry * 0.17 * Math.abs(Math.sin((t - TT.b2 - 0.1) * Math.PI * 4.4));
      const shake = sorry * 0.12 * Math.sin((t - TT.b2) * TAU * 3.1);
      return { walk: Math.max(hurry, stepBack * 0.55), phase: ph, look: [lerp(14 * watch, 0, up), lerp(16 * watch + 2, 3, up)], browY: 8 * watch * (1 - up), op: Math.max(startle, talk), worry: up > 0.5 ? lerp(-10, -7, sstep(TT.b2 + 0.4, TT.b2 + 1.2, t)) : 0,
        frown: 0.06, headYaw: shake, tilt: 0.06 * hitK, squash: 0.05 * hitK, swing: 0.22 * Math.sin(ph) * hurry + 0.5 * hitK * Math.sin((t - TT.b2) * 22),
        // open palms up at his chest, apart (the re-check: two hands meeting at his chest read as fists clutching something)
        arms: { r: watch > 0.01 ? { a1: 0.22, a2: 1.85, hand: 'watch', w: watch } : sorry > 0.01 ? { a1: -0.15, a2: 2.69, hand: 'open', w: sorry } : { a1: -0.06, a2: 0.1, hand: 'watch', w: tuck }, l: sorry > 0.01 ? { a1: -0.15, a2: 2.69, hand: 'open', w: sorry } : { a1: -0.06, a2: 0.1, w: tuck } }, hands: { r: 'watch' }, legs: true };
    }
    // THREE: from behind, an old man's walk, the bag in his right hand; one glance back over his shoulder
    const ph = t * Math.PI * 1.55 + 1.0, g3 = winK(t, TT.b3 + 0.95, TT.b3 + 1.07, TT.b3 + 1.35, TT.b3 + 1.47);
    const bump = t >= TT.b3 ? Math.exp(-(t - TT.b3) * 5) * Math.sin((t - TT.b3) * 14) : 0;
    // the freeze turns him round to you, head first: his face comes round over his shoulder (as in his glance), then his body follows,
    // its back turning edge-on before his front does, so the face never flips (the fresh review: a 180° turn in one frame)
    const u = clamp((t - F) / (F1 - F)), backV = u < 0.42;
    // from behind, his face comes round through a cross-fade from the back of his head, starting near profile, so neither the glance nor
    // the freeze's turn flips it in one frame (the re-check of final 10)
    const hyTot = t < F ? -0.95 : lerp(-1.12, -0.75, sstep(0.1, 0.24, u)) * (1 - sstep(0.42, 1, u));
    const faceMix = t < F ? g3 : sstep(0.03, 0.16, u);
    const phi = t < F ? 0 : -0.7 * (backV ? sstep(0, 0.42, u) : 1 - sstep(0.42, 1, u));   // continuous through the switch: width, head and shading don't jump
    // the bag stays on the same side of the picture all the way round (in his right hand from behind, his left from the front), clear of
    // number two in the line-up
    return { walk: t < F ? 1 : 0, phase: ph, back: backV, faceMix, headYaw: hyTot - phi * 0.6, yaw: phi,
      look: [14, 2], frown: 0.25, worry: -3, arms: { r: { a1: 0.1, a2: 0.05, hand: 'bag' } }, swingK: [1, 0.35], bagSwing: 0.18 * Math.sin(ph + 0.8) * (t < F ? 1 : 0) + 0.5 * bump, legs: true };
  }

  // ------------------------------------------------------------------ the camera: you walk until the second bump, then stop
  const vAt = (u, TT) => 900 * (1 - sstep(TT.b2, TT.stop + 0.2, u)) * (1 - 0.4 * Math.exp(-(((u - TT.b1 - 0.1) / 0.16) ** 2)));
  const CZ = new Map();
  function camZAt(t) {                               // how far you still are from where you stop (Z = 0)
    const TT = times(), tEnd = TT.stop + 0.2;
    if (t >= tEnd) return 0;
    const key0 = Math.round(t * 1e5); if (CZ.has(key0)) return CZ.get(key0);
    let z = 0; const n = Math.max(8, Math.ceil((tEnd - t) * 240)), dt = (tEnd - t) / n;
    for (let i = 0; i < n; i++) z += vAt(t + (i + 0.5) * dt, TT) * dt;
    if (CZ.size > 4000) CZ.clear(); CZ.set(key0, -z); return -z;
  }
  const kick = (t, t0, a, f = 15, d = 7) => (t >= t0 ? a * Math.exp(-(t - t0) * d) * Math.sin((t - t0) * f) : 0);
  function camAt(t) {
    const TT = times();
    const walk = 1 - sstep(TT.b2, TT.stop + 0.2, t);
    const bob = walk * 9 * Math.sin(t * TAU * 1.9), sway = walk * 4 * Math.sin(t * Math.PI * 1.9);
    const drop = sstep(TT.b2 + 0.95, TT.b2 + 1.55, t);                        // your eyes drop: the floor at your feet
    const up = sstep(TT.n02 - 0.05, TT.gone + 0.1, t);                        // you look up at them: the floor is out of shot by "gone"
    const jolt = sstep(TT.b2, TT.b2 + 0.3, t);                                // the bump knocks your eyes down
    let camY = lerp(lerp(lerp(-110, 60, jolt), 100, drop), -190, up), zoom = lerp(1 + 0.035 * sstep(0, TT.b2, t), 1.35, up);
    const pk = sstep(TT.freeze, TT.freeze + 0.5, t);                          // the freeze pulls them in: their faces fill the frame
    zoom = lerp(zoom, 1.65, pk) + 0.05 * sstep(TT.freeze + 0.5, TT.clock1, t);
    const dn = sstep(TT.down0, TT.down1, t);                                  // "Look down."
    camY = lerp(camY, 700, dn); zoom = lerp(zoom, 1, dn);
    const back = sstep(TT.up0, TT.up1, t);                                    // back up at the three of them, close
    camY = lerp(camY, -190, back); zoom = lerp(zoom, 1.65, back);
    if (t >= TT.fin) { camY = -60; zoom = 1.0; }                              // the last shot: wider, the stall on your left in it
    let roll = 0.004 * NA(t * 0.5) + kick(t, TT.b1, -0.045) + kick(t, TT.b2, 0.075, 13, 6) + kick(t, TT.b3, 0.03, 16, 8);
    let pan = kick(t, TT.b1, 34, 12, 7) - kick(t, TT.b2, 26, 10, 6) - kick(t, TT.b3, 14, 14, 8) + 3 * NB(t * 0.4);
    return { bob, sway, camY, zoom, roll, pan, camZ: camZAt(t) };
  }
  const camXf = (g, c, sh) => { g.translate(540 + sh[0] + c.sway + c.pan, 960 + sh[1]); g.rotate(c.roll); g.scale(c.zoom, c.zoom); g.translate(-540, -960 + c.bob); };
  const toScreen = (c, x, y) => { const px = (x - 540) * c.zoom, py = (y - c.camY - 960 + c.bob) * c.zoom, cr = Math.cos(c.roll), sr = Math.sin(c.roll); return [px * cr - py * sr + 540 + c.sway + c.pan, px * sr + py * cr + 960]; };

  // the wallet, as a function of t: in your hand, falling, on the ground (lane coordinates)
  function walletAt(t, hand) {
    const TT = times();
    if (t < TT.drop) return { st: 'hand' };
    const d = t - TT.drop, fall = 0.4;
    if (d < fall) {                                 // it falls from exactly where it sat in your fingers to the exact spot it then lies on
      const u = d / fall, gy = WG[1] - camAt(TT.drop + fall).camY, h0 = handAt(TT.drop), cr = Math.cos(h0.rot), sr = Math.sin(h0.rot);
      const x0 = h0.x + (-70 * cr + 10 * sr) * h0.s, y0 = h0.y + (-70 * sr - 10 * cr) * h0.s, r0 = h0.rot - 0.12;   // myHand: wallet(-70, -10, 1.05, -0.12)
      return { st: 'fall', d, x: lerp(x0, WG[0], u), y: lerp(y0, gy, u * u) - 50 * u * (1 - u), rot: lerp(r0, -0.16, u) - 0.8 * Math.sin(u * Math.PI), s: lerp(1.05 * h0.s, 0.74, u), flatK: sstep(0.55, 1, u) };
    }
    return { st: 'ground', x: WG[0], y: WG[1], rot: -0.16, s: 0.74 };
  }
  function handAt(t) {
    const TT = times(), c = camAt(t);
    let x = 812, y = 1350 + c.bob * 0.6, rot = -0.05, s = 1.0, open = 0;
    const jolt = (t0, a) => (t >= t0 ? a * Math.exp(-(t - t0) * 6) * Math.sin((t - t0) * 22) : 0);
    rot += jolt(TT.b1, 0.05) + jolt(TT.b2, 0.16) + jolt(TT.b3, 0.09);
    y += (t >= TT.b2 ? 60 * Math.exp(-(t - TT.b2) * 5) * sstep(TT.b2, TT.b2 + 0.035, t) : 0) + 620 * sstep(TT.b2 + 0.5, TT.b2 + 1.0, t);   // your arm drops to your side
    x += 230 * sstep(TT.b2 + 0.02, TT.b2 + 0.25, t) + 70 * sstep(TT.b2 + 0.45, TT.b2 + 0.95, t);   // knocked aside, then down to your side
    const up = sstep(TT.lift, TT.lift + 0.35, t) * (1 - sstep(TT.lower, TT.lower + 0.3, t));
    const upx = sstep(TT.lift + 0.12, TT.lift + 0.42, t) * (1 - sstep(TT.lower, TT.lower + 0.3, t));
    x = lerp(x, 690, upx); y = lerp(y, 1180, up) + 520 * sstep(TT.lower, TT.lower + 0.3, t); rot = lerp(rot, -0.55, up) + 0.03 * up * Math.sin(t * 9); open = up;
    return { x, y, s, rot, open, curl: up * 0.25 * (1 + Math.sin(t * 5)) / 2 };
  }

  // ------------------------------------------------------------------ the season's thief at the chai stall: he sips, he watches your wallet;
  // at the end he raises his glass to you. He stands by the counter's near end, on your left, and never moves towards you or the wallet.
  const THIEF_AT = [-1400, ZS + 250];
  function thiefPose(t, tw) {
    const TT = times();
    const sip = Math.max(winK(tw, 0.75, 1.1, 1.55, 1.9), winK(tw, 9.4, 9.75, 10.2, 10.55), winK(tw, 17.6, 17.95, 18.4, 18.75));
    const toast = t >= TT.fin ? sstep(TT.n10e + 0.35, TT.n10e + 0.8, t) : 0;
    const hold = { a1: 0.16, a2: 1.55 }, toSip = { a1: 0.32, a2: 2.35 }, raise = { a1: 1.6, a2: 4.03 };     // raise: elbow out, the glass up by his face
    const cheers = kick(t, TT.n10e + 0.76, 0.14, 20, 8);                    // the glass dips to you on the clink (cues.py)
    const a1 = lerp(lerp(hold.a1, toSip.a1, sip), raise.a1, toast), a2 = lerp(lerp(hold.a2, toSip.a2, sip), raise.a2, toast) + cheers;
    return { walk: 0, breath: 2 * Math.sin(tw * TAU * 0.25), yaw: 0.32, headYaw: -0.12 - 0.12 * sip + 0.06 * toast, look: [lerp(10, 2, toast), lerp(9, 2, toast)], close: sip > 0.6 ? 0.55 : blinkAt(tw, 5, 3.9),
      frown: 0, smile: lerp(0.18, 0.55, toast), smirk: toast, browUp: 12 * toast, tilt: -0.03 * toast, arms: { l: { a1, a2, hand: 'glass' } }, glassK: 0.72, legs: true };
  }

  // ------------------------------------------------------------------ the scene, at time t: the world, the people by depth, you
  const BUFS = []; const buf = (i) => BUFS[i] || (BUFS[i] = offscreen(W, H));
  function lane(g, t, o = {}) {
    const TT = times(), c = camAt(t);
    const frozen = t >= TT.freeze && t < TT.down0, tw = frozen ? TT.freeze : t >= TT.down0 ? t - (TT.down0 - TT.freeze) : t;   // the world's own clock stops for the pick
    const sh = shakeAt(t, [[TT.b1, 14], [TT.b2, 36], [TT.b3, 18]], !!o.smoothShake);
    const dof = o.dof ?? 0, desat = o.desat ?? 0;
    const men = menAt(t), cz = c.camZ;
    // everyone in the lane, by depth: the crowd (soft, behind, when the camera focuses on faces), the three, the thief
    const actors = [];
    for (const p of CROWD) {
      if (p.side && t >= TT.down0) continue;
      const Z = crowdAt(p, tw), q = P3(p.X, 0, Z, cz); if (!q || q[2] > 0.95 || q[2] < 0.045) continue;
      const toward = p.v < 0, s = q[2] * (p.kid ? 0.7 : 1), ph = tw * Math.PI * p.cad + p.ph;
      actors.push({ fy: q[1], soft: true, X: p.X, Z, draw: (gg) => figure(gg, p.P, q[0], q[1] - 1594 * s, s, { walk: 1, phase: ph, back: !toward, legs: true, yaw: 0.2 * Math.sign(-p.X) * (toward ? 1 : -1), look: [0, 4], close: blinkAt(tw, p.ph * 3), rim: 1 }) });
    }
    // the thief: when the camera's focus is on the three he's soft with the street behind them, and when you look down at your feet
    // he's left out (only his body would show, at the end of their row: the fresh review of final 9)
    if (o.thief !== false && c.camY < 450) {
      const q = P3(THIEF_AT[0], 0, THIEF_AT[1], cz);
      // (sharp in the last shot, so his raised glass reads, but a touch soft: pin-sharp, he looked pasted on beside the blurred stall)
      if (q) actors.push({ fy: q[1], soft: !o.thiefSharp, X: THIEF_AT[0], Z: THIEF_AT[1], draw: (gg) => { gg.save(); if (o.thiefSharp) gg.filter = 'blur(1.1px)'; figure(gg, THIEF_P, q[0], q[1] - 1594 * q[2], q[2], thiefPose(t, tw)); gg.restore(); } });
    }
    if (o.men !== false) men.forEach((m, i) => {
      const fy = m[1] + 1594 * m[2]; if (m[0] < -700 || m[0] > 1800) return;
      const pose = poseOf(i, t, o);
      actors.push({ fy, soft: false, man: i, X: (m[0] - 540) / m[2], Z: FOC / m[2] + cz * 0, s: m[2], draw: (gg) => figure(gg, MEN[i], m[0], m[1], m[2], { ...pose, legs: m[2] < 1.2 && pose.legs, noHead: false }) });
    });
    const hd = handAt(t), wl = walletAt(t, hd), wOn = wl.st === 'ground' && !o.noWallet;
    if (wOn) actors.push({ fy: WG[1], soft: false, wallet: true, draw: (gg) => wallet(gg, wl.x, wl.y, wl.s, wl.rot, { flat: true }) });
    actors.sort((a, b) => a.fy - b.fy);
    const shadows = (gg, list) => { for (const a of list) { if (a.wallet) continue; if (a.man != null) { const s = a.s, X = a.X, Z = FOC / s + c.camZ; groundShadow(gg, X, Z, c.camZ, 0.24); } else groundShadow(gg, a.X, a.Z, c.camZ, 0.2); } };
    // the background: sky, the lane, the floor, the light (into a buffer when the camera's focus is on the faces)
    const soft = dof > 0.2 || desat > 0.02;
    const bg = soft ? buf(0) : null, gb = soft ? bg.getContext('2d') : g;
    if (soft) { gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalAlpha = 1; gb.filter = 'none'; gb.clearRect(0, 0, W, H); }
    gb.save(); camXf(gb, c, sh); gb.translate(0, -c.camY);
    world(gb, c, tw);
    shadows(gb, actors);
    if (soft) for (const a of actors) if (a.soft) a.draw(gb);
    light(gb, cz, tw);
    gb.restore();
    if (soft) { g.save(); g.filter = `blur(${dof.toFixed(2)}px) saturate(${(1 - desat).toFixed(3)}) brightness(${(1 - desat * 0.12).toFixed(3)})`; g.drawImage(bg, 0, 0); g.restore(); }
    g.save(); camXf(g, c, sh); g.translate(0, -c.camY);
    for (const a of actors) if (!soft || !a.soft) a.draw(g);
    g.translate(0, c.camY);
    if (!o.noShoes) myShoes(g, c.camY);
    // the falling wallet: under your fingers for its first few hundredths of a second (it slides out from under them: no pop on the replay's
    // slow frames), then in front of your hand, so the hand never hides it
    const under = wl.st === 'fall' && wl.d < 0.08;
    if (under && !o.noWallet) wallet(g, wl.x, wl.y, wl.s, wl.rot, { flatK: wl.flatK });
    if (o.hand !== false && hd.y < 2200) myHand(g, hd.x, hd.y, hd.s, hd.rot, { hold: wl.st === 'hand', open: hd.open, curl: hd.curl });
    if (wl.st === 'fall' && !under && !o.noWallet) wallet(g, wl.x, wl.y, wl.s, wl.rot, { flatK: wl.flatK });
    g.restore();
    return { c, wl };
  }
  // motion blur, drawn in: the frame as the average of n moments across half a frame (a 180° shutter)
  function blurred(g, t, n, fn) {
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

  // ------------------------------------------------------------------ shots
  // 1 · the walk, the bumps, the freeze and the clock
  const win3 = (t, a, b) => sstep(a, a + 0.08, t) * (1 - sstep(b - 0.2, b, t));
  function shotLane(g, t) {
    const TT = times(), F = TT.freeze;
    const fast = (t > TT.b1 - 0.1 && t < TT.b1 + 0.35) || (t > TT.b2 - 0.25 && t < TT.b2 + 0.5) || (t > TT.b3 - 0.1 && t < TT.b3 + 0.3) || (t > F - 0.02 && t < F + 0.55) || (t > TT.lift && t < TT.gone + 0.12) || (t > TT.lower && t < TT.lower + 0.3);
    const pk = sstep(F, F + 0.3, t);
    blurred(g, t, fast ? (t > F - 0.02 && t < F + 0.55 ? 8 : 5) : 1, (gg, tt) => lane(gg, tt, { smoothShake: fast, dof: 5.5 * sstep(F, F + 0.3, tt), desat: 0.62 * sstep(F, F + 0.3, tt) }));
    vignette(g, 1 - 0.3 * pk);
    // frame 0: the role, said twice (the words and the picture), out with the first line
    const out = sstep(TT.n01e - 0.05, TT.n01e + 0.2, t);
    if (out < 1) { g.save(); g.globalAlpha = 1 - out; txt(g, "YOU'RE THE", 513, 380, 104, CREAM, { align: 'center', stroke: INK, sw: 0.14 }); txt(g, 'VICTIM', 513, 560, 210, YEL, { align: 'center', fit: 860, stroke: INK, sw: 0.12 }); g.restore(); }
    // the counts, small, as each man reaches you
    { const c0 = camAt(t), M = menAt(t);
      [['c1', 0], ['c2', 1], ['c3', 2]].forEach(([p, i]) => {
        const t0 = at(p) - 0.03, k = win3(t, t0, t0 + 0.8), m = M[i];
        let [x, y] = toScreen(c0, m[0], m[1] - 330 * m[2] - 70); y = clamp(y, 330, 900);
        const kx = clamp((x + 10) / 70) * clamp((1150 - x) / 70);
        if (k * kx > 0) { g.save(); g.globalAlpha = k * kx; g.translate(clamp(x, 90, 888), y); const q = pop(t, t0); g.scale(lerp(0.6, 1, q), lerp(0.6, 1, q)); tileNo(g, 0, 0, i + 1, 112); g.restore(); }
      }); }
    if (t >= TT.gone - 0.04 && t < F) title(g, 'YOUR WALLET?', 470, 120, CREAM, t, TT.gone - 0.04, { stroke: INK, sw: 0.14 });   // above their heads, off number two's face
    if (t >= F) {
      // the street stops; the three get their numbers; the ritual line; then the clock
      const c = camAt(t);
      menAt(t).forEach((m, i) => { const q = pop(t, F + 0.05 + i * 0.12); let [x, y] = toScreen(c, m[0], m[1] - 380 * m[2] - 64); y = Math.max(y, 334); g.save(); g.translate(x, y); g.scale(q, q); tileNo(g, 0, 0, i + 1, 92); g.restore(); });
      if (t < TT.clock0) { title(g, 'WHOEVER YOU PICK', 1060, 98, CREAM, t, TT.n03 - 0.04, { stroke: INK, sw: 0.14 }); if (t >= TT.jail - 0.04) title(g, 'GOES TO JAIL', 1180, 128, '#ff5a3a', t, TT.jail - 0.04, { stroke: INK, sw: 0.12 }); }
      else {
        title(g, 'WHICH ONE?', 1090, 128, CREAM, t, TT.clock0, { stroke: INK, sw: 0.12 });
        const left = Math.min(5, Math.max(0, Math.ceil(TT.clock1 - t - 1e-3)));
        g.save(); g.translate(540, 1200); R(g, -110, -44, 220, 88, 12); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
        txt(g, '00:0' + left, 0, 27, 68, left <= 1 ? '#ff4a30' : '#ffb347', { kind: 'mono', align: 'center' }); g.restore();
      }
    }
    return flashAt(t, F) * 0.22;
  }
  // 2 · "Look down." The camera drops to your feet; a ring closes on the wallet. "It's been there the whole time." "Nobody took it."
  function walletOnScreen(c) { return toScreen(c, WG[0], WG[1]); }
  function shotDown(g, t) {
    const TT = times();
    const fast = t < TT.down1 + 0.06;
    const { c } = blurred(g, t, fast ? 6 : 1, (gg, tt) => lane(gg, tt, { smoothShake: true }));
    vignette(g, 0.8);
    const k = sstep(TT.down1 - 0.1, TT.down1 + 0.35, t), [wx, wy] = walletOnScreen(c);
    ring(g, wx, wy, 112, k, 12);
    if (t >= TT.n05 - 0.04) {                       // since 0:04: a strip from then to now, under the wallet
      const q = sstep(TT.n05 - 0.04, TT.n05 + 0.5, t);
      g.save(); g.globalAlpha = clamp(q * 3); g.translate(540, wy + 200);
      R(g, -330, -40, 660, 80, 14); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
      txt(g, '0:04', -300, 18, 54, '#ffb347', { kind: 'mono' }); txt(g, 'NOW', 300, 18, 54, '#ffb347', { kind: 'mono', align: 'right' });
      g.fillStyle = YEL; R(g, -170, -8, 330 * q, 16, 8); g.fill();
      g.restore();
    }
    if (t >= TT.n06 - 0.04) title(g, 'NOBODY TOOK IT.', 470, 132, CREAM, t, TT.n06 - 0.04, { stroke: INK, sw: 0.13 });
    return 0;
  }
  // 3 · back up at the three of them, close: INNOCENT, one after another; the cell door in the gap after the line
  const hurt = (i, t) => ({ look: [i === 0 ? 8 : i === 2 ? -8 : 0, 2], frown: [0.45, 0.35, 0.4][i], worry: [-14, -16, -6][i], close: blinkAt(t, i, 3.2) });
  function shotInnocent(g, t) {
    const TT = times();
    const fast = t < TT.up1 + 0.04;
    blurred(g, t, fast ? 6 : 1, (gg, tt) => lane(gg, tt, { mood: hurt, hand: false, dof: 4.5 * sstep(TT.up0 + 0.1, TT.up1, tt), smoothShake: true }));
    vignette(g, 0.8);
    const c = camAt(t);
    for (let i = 0; i < 3; i++) { const [x, y, s] = SPOT[i], [sx, sy] = toScreen(c, x, y + 430 * s); stamp(g, 'INNOCENT', clamp(sx + (i === 2 ? -15 : i === 0 ? -20 : 0), 170, 790), sy + (i === 1 ? 110 : 0), t, TT.going + i * 0.3, RED, 56, i === 1 ? 0.06 : -0.08); }
    const bk = sstep(TT.n07e + 0.05, TT.n07e + 0.3, t) * (1 - sstep(TT.nobody - 0.05, TT.nobody + 0.55, t));   // the door shuts; if you spotted it, it lifts
    if (bk > 0) bars(g, bk + 0.04 * Math.exp(-(t - TT.n07e - 0.3) * 10) * Math.sin((t - TT.n07e - 0.3) * 40) * (t > TT.n07e + 0.3 ? 1 : 0));
    if (t >= TT.n07b - 0.04 && t < TT.face0) title(g, 'SPOTTED IT?', 1310, 112, YEL, t, TT.n07b - 0.04, { stroke: INK, sw: 0.12 });
    if (t >= TT.bumping - 0.04 && t < TT.n07b - 0.05) title(g, 'FOR BUMPING INTO YOU', 1340, 96, CREAM, t, TT.bumping - 0.04, { stroke: INK, sw: 0.14 });
    if (t >= TT.nobody - 0.04) title(g, 'NOBODY GOES TO JAIL', 1420, 96, CREAM, t, TT.nobody - 0.04, { stroke: INK, sw: 0.14 });
    return flashAt(t, TT.n07e + 0.3) * 0.3;
  }
  function bars(g, k, y0 = 250, y1 = 1196) {        // a cell front over the three of them, from y0 to y1 (its bottom rail clear of the lines under it)
    const off = lerp(-(y1 + 40), 0, k), bw = 38, hw = bw / 2;
    g.save(); g.translate(0, off); g.beginPath(); g.rect(0, y0 - 30 - off, W, y1 - y0 + 60); g.clip();
    for (let i = 0; i < 8; i++) { const x = 75 + i * 146; g.fillStyle = lg(g, x - hw, 0, x + hw, 0, [0, '#16181c'], [0.35, '#6f747d'], [0.55, '#9ea3ab'], [1, '#1c1e23']); g.fillRect(x - hw, y0, bw, y1 - y0); }
    for (const yy of [y0 + 20, y1 - 20]) { g.fillStyle = lg(g, 0, yy - 24, 0, yy + 24, [0, '#16181c'], [0.4, '#7c818a'], [1, '#1c1e23']); g.fillRect(-10, yy - 24, W + 20, 48); }
    g.restore();
  }

  // 4 · "It slipped out of your hand four seconds in, while you were face to face with number two." The film runs back to 0:03.75 and
  //     forward slowly through the bump, then holds at 0:04.30: his face fills the left, your wallet falls on the right. HIS FACE / YOUR WALLET.
  //     "Magicians call that misdirection." over the held frame. The sound-off review: without this, misdirection was told, not shown.
  const HOLDT = 4.3;
  function shotReplay(g, t) {
    const TT = times(), r0 = TT.face0, r1 = TT.face0 + 0.42, p1 = Math.max(r1 + 2.2, TT.n08e);
    const tauOf = (t) => t < r1 ? lerp(TT.freeze + 0.5, 3.75, sstep(r0, r1, t))   // running backwards
      : Math.min(HOLDT, lerp(3.75, HOLDT, (t - r1) / (p1 - r1)));                // forward at about a fifth of the speed, then held
    const tau = tauOf(t);
    const push = 1 + 0.05 * sstep(p1, TT.fin, t);
    let c;
    const draw = (gg, ta) => { gg.save(); gg.translate(0, -160); gg.translate(540, 900); gg.scale(push, push); gg.translate(-540, -900); const r = lane(gg, ta, { noBlink: true, noShoes: true, smoothShake: true }); gg.restore(); return r; };
    if (t < r1) {                                   // the rewind: smeared, with tape lines
      ({ c } = blurred(g, t, 5, (gg, tt) => draw(gg, tauOf(tt))));
      g.save(); g.globalAlpha = 0.18; g.fillStyle = '#000'; for (let y = (t * 900) % 12; y < H; y += 12) g.fillRect(0, y, W, 3); g.restore();
      const band = ((t - r0) * 2600) % (H + 200) - 100; g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(0, band, W, 26);
    } else ({ c } = draw(g, tau));
    if (t >= r1) { g.fillStyle = 'rgba(255,248,230,0.08)'; g.fillRect(0, 0, W, H); }
    vignette(g, 0.9);
    // the film's own clock
    g.save(); g.translate(170, 1466); R(g, -140, -48, 280, 96, 14); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();   // low on his shirt: off his jaw, under YOUR WALLET
    const sec = Math.floor(tau), cs = Math.floor((tau - sec) * 100);
    txt(g, `0:0${sec}.${String(cs).padStart(2, '0')}`, 0, 28, 70, tau >= 3.99 ? '#ff5a3a' : '#ffb347', { kind: 'mono', align: 'center' }); g.restore();
    if (t < r1) { g.save(); g.translate(540, 1200); g.fillStyle = CREAM; g.strokeStyle = INK; g.lineWidth = 8; g.lineJoin = 'round'; for (const dx of [-46, 46]) { g.beginPath(); g.moveTo(dx + 46, -54); g.lineTo(dx + 46, 54); g.lineTo(dx - 46, 0); g.closePath(); g.stroke(); g.fill(); } g.restore(); return flashAt(t, r0) * 0.25; }
    // the ring follows your wallet: in your fingers, falling, landing
    const hd = handAt(tau), wl = walletAt(tau, hd);
    const scr = (x, y) => { const px = (x - 540) * c.zoom, py = (y - 960 + c.bob) * c.zoom, cr = Math.cos(c.roll), sr = Math.sin(c.roll); return [px * cr - py * sr + 540 + c.sway + c.pan, px * sr + py * cr + 960]; };
    let wx, wy;
    if (wl.st === 'hand') { const cr = Math.cos(hd.rot), sr = Math.sin(hd.rot); [wx, wy] = scr(hd.x + (-70 * cr + 10 * sr) * hd.s, hd.y + (-70 * sr - 10 * cr) * hd.s); }
    else if (wl.st === 'fall') [wx, wy] = scr(wl.x, wl.y);
    else [wx, wy] = walletOnScreen(c);
    const rk = sstep(r1 + 0.2, r1 + 0.6, t);
    g.save(); g.translate(0, -160); g.translate(540, 900); g.scale(push, push); g.translate(-540, -900);      // the labels ride the same frame
    ring(g, wx, wy, 104, rk, 12);
    if (rk > 0.6) { g.save(); g.globalAlpha = clamp((rk - 0.6) * 3); txt(g, 'YOUR WALLET', wx - 128, wy + 24, 70, YEL, { align: 'right', stroke: INK, sw: 0.14 }); g.restore(); }
    // and where your eyes were: his face
    const fk = sstep(TT.numtwo - 0.3, TT.numtwo + 0.1, t);
    if (fk > 0) {
      g.save(); g.globalAlpha = fk;
      txt(g, 'HIS FACE', 660, 600, 84, CREAM, { align: 'center', stroke: INK, sw: 0.14 });
      g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(620, 630); g.quadraticCurveTo(560, 710, 450, 720); g.stroke();
      g.strokeStyle = CREAM; g.lineWidth = 9; g.beginPath(); g.moveTo(620, 630); g.quadraticCurveTo(560, 710, 450, 720); g.stroke();
      g.fillStyle = CREAM; g.beginPath(); g.moveTo(436, 721); g.lineTo(462, 704); g.lineTo(464, 736); g.closePath(); g.fill();
      g.restore();
    }
    g.restore();
    return 0;
  }
  // 5 · "Still think you're the victim?" The three of them, looking at you; on your left, at the stall, the season's thief raises his chai to you.
  function shotEnd(g, t) {
    const TT = times(), z = 1 + 0.05 * sstep(TT.fin, TT.end, t);
    g.save(); g.translate(470, 760); g.scale(z, z); g.translate(-470, -760);
    lane(g, t, { mood: (i, tt) => ({ ...hurt(i, tt) }), hand: false, dof: 3, thiefSharp: true });   // he's small and well behind them; sharp, so his raised glass reads
    g.restore();
    vignette(g, 0.9);
    const band = sstep(TT.n10 - 0.2, TT.n10 + 0.1, t); if (band > 0) { g.fillStyle = `rgba(16,15,12,${0.62 * band})`; R(g, 90, 1068, 860, 300, 26); g.fill(); }
    title(g, 'STILL THINK YOU’RE', 1170, 104, CREAM, t, TT.n10 - 0.04, { stroke: INK, sw: 0.14 });
    if (t >= TT.victim - 0.04) title(g, 'THE VICTIM?', 1310, 150, YEL, t, TT.victim - 0.04, { stroke: INK, sw: 0.12 });
    const out = sstep(TT.end - 0.4, TT.end, t);
    if (out > 0) { g.fillStyle = `rgba(10,14,21,${out})`; g.fillRect(0, 0, W, H); }
    return 0;
  }

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g, TT = times();
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.clearRect(0, 0, W, H);
      g.save();
      let fl = 0;
      if (t < TT.down0) fl = shotLane(g, t);
      else if (t < TT.up0) fl = shotDown(g, t);
      else if (t < TT.face0) fl = shotInnocent(g, t);
      else if (t < TT.fin) fl = shotReplay(g, t);
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
      clear(g);
      const pat = g.createPattern(S.tiles[f % 4], 'repeat'), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
      g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256);
    },
  });

  window.UI.endcard();
  C.start();
})();
