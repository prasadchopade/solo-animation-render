// Reel 34 · You're the Victim (working title). Tests desk, episode 9 of "You're the test subject".
// A packed market lane, your POV, your wallet in your hand. Three men bump you: one, two, three. Your wallet's gone, and whoever you pick
// goes to jail. Look down: nobody took it. It slipped out of your hand at second four, while the second man's face was in yours, and it has
// lain at your feet, in shot, the whole time you were choosing: whoever you picked is going to jail for bumping into you. Magicians call that
// misdirection. Still think you're the victim? Facts: docs/research.md.
// Our own drawings; nobody real. The face rig is from reels 20, 25, 26 and 30. 30 fps, no motion blur.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', PAPER = '#fbf7ec', YEL = '#ffd34a', CREAM = '#fff6e2', DARK = '#0c0d11';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

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
  function shakeAt(t, list) {                       // list: [time, amplitude]; a decaying, frame-clocked jitter
    let a = 0; for (const [t0, amp] of list) if (t >= t0) a = Math.max(a, amp * Math.exp(-(t - t0) * 9));
    if (a < 0.2) return [0, 0];
    const r = mulberry32(Math.round(t * 30) * 7 + 3);
    return [(r() - 0.5) * 2 * a, (r() - 0.5) * 2 * a];
  }
  const flashAt = (t, t0) => { const d = t - t0; return d < 0 ? 0 : Math.exp(-d * 11) * 0.92; };
  function stamp(g, s, x, y, t, t0, color = RED, size = 120, rot = -0.1) {
    if (t < t0) return;
    const k = hit(t, t0, 'heavy'), sc = lerp(2.1, 1, clamp(k));
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.globalAlpha = clamp((t - t0) / 0.05);
    g.font = font(size); const w = g.measureText(s).width + 56;
    R(g, -w / 2, -size * 0.74, w, size * 1.0, 14); g.fillStyle = 'rgba(255,250,240,0.82)'; g.fill(); g.strokeStyle = color; g.lineWidth = size * 0.085; g.stroke();
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

  // ------------------------------------------------------------------ faces (the rig of reels 20-30)
  function mouth(g, cy, op, o = {}) {
    const lip = o.lip || '#7d463b';
    if (op < 0.012) {
      const w = o.w0 ?? 44, sm = o.smile || 0, fr = o.frown || 0;
      g.lineCap = 'round'; g.strokeStyle = o.line || '#3c1d18'; g.lineWidth = o.lw0 ?? 6;
      g.beginPath(); g.moveTo(-w, cy - sm * 12 + fr * 6); g.quadraticCurveTo(0, cy + 3 + sm * 13 - fr * 8, w, cy - sm * 12 + fr * 6); g.stroke();
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
  // ONE: about twenty, a lot of hair, clean-shaven, earphones and a backpack. TWO: about thirty-five, an office shirt, a side parting, a thin
  // moustache, an ID card. THREE: about sixty, grey, glasses, a thick grey moustache, a bag of vegetables. Nobody here is a thief.
  const S0 = { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983' };
  const ONE = { ...S0, hair: '#17110d', style: 'messy', must: null, stub: 0, brow: 13, browTilt: -5, jaw: 0.92, ew: 47, eh: 27 };
  const TWO = { ...S0, hair: '#15100c', style: 'part', must: 'thin', stub: 0, brow: 15, browTilt: 0, jaw: 1.03, ew: 43, eh: 23 };
  const THREE = { ...S0, hair: '#a7a29b', mHair: '#b5b0a8', style: 'recede', must: 'thick', stub: 0, brow: 15, browTilt: 4, jaw: 1.0, ew: 42, eh: 22, specs: true };

  function head(g, L, o = {}) {
    const op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw, drop = 104 * op, chin = 232 + drop, ey = -28, ex = 80;
    for (const k of [-1, 1]) { ell(g, k * (hw + 1), -18, 25, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); ell(g, k * (hw + 3), -16, 12, 24, k * 0.08); g.fillStyle = L.skinD; g.fill(); }
    const path = () => {
      g.beginPath(); g.moveTo(-hw, -40);
      g.bezierCurveTo(-hw - 4, -216, -100, -266, 0, -266); g.bezierCurveTo(100, -266, hw + 4, -216, hw, -40);
      g.bezierCurveTo(hw + 4, 58, 152 - 16 * op, 150 + 44 * op, 88 - 6 * op, 205 + 82 * op);
      g.bezierCurveTo(60, chin - 4, 28, chin, 0, chin); g.bezierCurveTo(-28, chin, -60, chin - 4, -88 + 6 * op, 205 + 82 * op);
      g.bezierCurveTo(-152 + 16 * op, 150 + 44 * op, -hw - 4, 58, -hw, -40); g.closePath();
    };
    path(); g.fillStyle = lg(g, -hw, -200, hw, 240, [0, L.skinH], [0.45, L.skin], [1, L.skinD]); g.fill();
    g.save(); path(); g.clip();
    g.fillStyle = rg(g, 0, -40, 150, 330, [0, 'rgba(90,45,25,0)'], [1, 'rgba(90,45,25,0.3)']); g.fillRect(-300, -300, 600, 700);
    if (L.stub) { g.fillStyle = lg(g, 0, 56, 0, 190, [0, 'rgba(30,22,18,0)'], [1, `rgba(30,22,18,${0.34 * L.stub})`]); g.fillRect(-300, 56, 600, 320); const r = mulberry32(5); g.fillStyle = `rgba(20,14,10,${0.34 * L.stub})`; for (let i = 0; i < 70; i++) { ell(g, (r() - 0.5) * 2 * hw * 0.9, 120 + r() * 120, 1.7, 1.7); g.fill(); } }
    if (L.style === 'recede') { g.fillStyle = 'rgba(80,40,20,0.16)'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 120, 70); g.quadraticCurveTo(k * 100, 130, k * 70, 160); g.lineWidth = 5; g.strokeStyle = 'rgba(80,40,20,0.22)'; g.stroke(); } }
    g.restore();
    const my = 118 + drop * 0.2;
    mouth(g, my, op, { lip: '#83503f', w0: o.w0 ?? 44, frown: o.frown ?? 0, smile: o.smile ?? 0 });
    if (L.must) {
      const big = L.must === 'thick', th = big ? 24 : 13, w = big ? 64 : 52;
      g.fillStyle = L.mHair || L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
    }
    const ny = 44;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 22, ny - 18); g.quadraticCurveTo(k * 31, ny, k * 25, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, k * 13, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5, ny - 8, 10, 15); g.fill();
    if (L.mole) { const mr = L.moleR ?? 9.5; g.fillStyle = '#2a1710'; ell(g, L.mole[0], L.mole[1], mr, mr * 0.95); g.fill(); }
    const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look };
    eye(g, -1, -ex, ey, close, eo); eye(g, 1, ex, ey, close, eo);
    g.strokeStyle = L.mHair || L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt + (o.worry || 0);
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (ex - 48), ey - 40 + tilt + by0); g.quadraticCurveTo(k * (ex + 6), ey - 60 + by0, k * (ex + 54), ey - 40 - tilt * 0.3 + by0 * 0.4); g.stroke(); }
    g.fillStyle = L.hair;
    const hh = hw + 6;
    if (L.style === 'part') { g.beginPath(); g.moveTo(hh, -38); g.bezierCurveTo(hh + 10, -250, 80, -300, -16, -292); g.bezierCurveTo(-140, -292, -hh - 16, -220, -hh, -38); g.bezierCurveTo(-hh + 18, -112, -150, -164, -80, -190); g.bezierCurveTo(-20, -150, 70, -160, 110, -186); g.bezierCurveTo(150, -150, hh - 22, -110, hh, -38); g.fill(); }
    else if (L.style === 'recede') { g.beginPath(); g.moveTo(-hh, -50); g.bezierCurveTo(-hh - 6, -200, -120, -250, -84, -236); g.bezierCurveTo(-110, -200, -hh + 22, -140, -hh + 12, -50); g.closePath(); g.fill(); g.beginPath(); g.moveTo(hh, -50); g.bezierCurveTo(hh + 6, -200, 120, -250, 84, -236); g.bezierCurveTo(110, -200, hh - 22, -140, hh - 12, -50); g.closePath(); g.fill(); g.save(); g.globalAlpha *= 0.55; g.beginPath(); g.moveTo(-90, -238); g.quadraticCurveTo(0, -282, 90, -238); g.quadraticCurveTo(0, -262, -90, -238); g.fill(); g.restore(); }
    else if (L.style === 'messy') {
      g.beginPath(); g.moveTo(-hh, -40);
      g.bezierCurveTo(-hh - 22, -170, -hh + 10, -270, -70, -300); g.bezierCurveTo(-40, -334, 30, -330, 60, -306); g.bezierCurveTo(110, -326, 170, -290, 168, -244);
      g.bezierCurveTo(hh + 18, -210, hh + 20, -120, hh, -40); g.bezierCurveTo(hh - 16, -110, 150, -150, 120, -168);
      g.bezierCurveTo(96, -138, 60, -150, 40, -176); g.bezierCurveTo(10, -140, -30, -150, -50, -178); g.bezierCurveTo(-80, -144, -120, -150, -136, -170); g.bezierCurveTo(-150, -130, -hh + 14, -100, -hh, -40); g.closePath(); g.fill();
      g.strokeStyle = L.hair; g.lineWidth = 12; g.lineCap = 'round';
      for (const [x0, y0, x1, y1] of [[-20, -300, -8, -346], [36, -306, 58, -344], [-70, -292, -96, -326]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 8, (y0 + y1) / 2, x1, y1); g.stroke(); }
    } else if (L.style === 'slick') {
      g.beginPath(); g.moveTo(-hh, -44); g.bezierCurveTo(-hh - 6, -250, -80, -300, 0, -298); g.bezierCurveTo(80, -300, hh + 6, -250, hh, -44); g.bezierCurveTo(hh - 16, -150, 90, -210, 0, -214); g.bezierCurveTo(-90, -210, -hh + 16, -150, -hh, -44); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-110 + i * 70, -230 - i * 8); g.quadraticCurveTo(-40 + i * 70, -282, 40 + i * 50, -270); g.stroke(); }
    } else if (L.style === 'cap') {
      g.beginPath(); g.moveTo(-hh, -36); g.lineTo(-hh + 4, -130); g.lineTo(-hh + 36, -130); g.lineTo(-hh + 24, -46); g.closePath(); g.moveTo(hh, -36); g.lineTo(hh - 4, -130); g.lineTo(hh - 36, -130); g.lineTo(hh - 24, -46); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,10,6,0.32)'; g.beginPath(); g.moveTo(-hw + 8, -108); g.quadraticCurveTo(0, -60, hw - 8, -108); g.lineTo(hw - 8, -140); g.lineTo(-hw + 8, -140); g.closePath(); g.fill();
      capShape(g, hh);
    }
    if (L.specs) {
      g.strokeStyle = '#2a2320'; g.lineWidth = 8;
      for (const k of [-1, 1]) { g.fillStyle = 'rgba(255,255,255,0.1)'; R(g, k * ex - 64, ey - 44, 128, 88, 30); g.fill(); g.stroke(); }
      g.beginPath(); g.moveTo(-ex + 64, ey - 8); g.quadraticCurveTo(0, ey - 22, ex - 64, ey - 8); g.moveTo(-ex - 64, ey - 10); g.lineTo(-hw, ey - 16); g.moveTo(ex + 64, ey - 10); g.lineTo(hw, ey - 16); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 5; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * ex - 40, ey - 30); g.lineTo(k * ex - 18, ey - 36); g.stroke(); }
    }
  }
  function capShape(g, hh) {                         // the maroon cap: the crown, the seam, the brim
    g.beginPath(); g.moveTo(-hh - 2, -122); g.bezierCurveTo(-hh - 8, -280, -90, -318, 0, -318); g.bezierCurveTo(90, -318, hh + 8, -280, hh + 2, -122); g.quadraticCurveTo(0, -158, -hh - 2, -122); g.closePath(); g.fillStyle = lg(g, -hh, -318, hh, -120, [0, '#9a2738'], [1, '#5c1520']); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -318); g.quadraticCurveTo(-12, -220, 0, -150); g.stroke();
    g.beginPath(); g.moveTo(-hh + 6, -128); g.quadraticCurveTo(0, -170, hh - 6, -128); g.quadraticCurveTo(hh + 6, -108, hh - 40, -92); g.quadraticCurveTo(0, -116, -hh + 40, -92); g.quadraticCurveTo(-hh - 6, -108, -hh + 6, -128); g.closePath(); g.fillStyle = '#4a111b'; g.fill();
  }
  // the back of a head: hair (or the cap) over the skull, ears at the sides
  function headBack(g, L) {
    const hw = 186 * L.jaw;
    for (const k of [-1, 1]) { ell(g, k * (hw + 1), -18, 25, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); }
    g.fillStyle = L.skinD; R(g, -78, 100, 156, 150, 30); g.fill();
    if (L.style === 'cap') { g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 2, -60); g.bezierCurveTo(-hw - 6, 60, -90, 150, 0, 150); g.bezierCurveTo(90, 150, hw + 6, 60, hw + 2, -60); g.closePath(); g.fill(); capShape(g, hw + 6); return; }
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 6, -30); g.bezierCurveTo(-hw - 14, -240, -90, -296, 0, -296); g.bezierCurveTo(90, -296, hw + 14, -240, hw + 6, -30); g.bezierCurveTo(hw - 4, 80, 90, 150, 0, 156); g.bezierCurveTo(-90, 150, -hw + 4, 80, -hw - 6, -30); g.closePath(); g.fill();
    if (L.style === 'recede') { g.fillStyle = 'rgba(255,255,255,0.14)'; ell(g, 0, -230, 90, 40); g.fill(); }
  }

  // ------------------------------------------------------------------ bodies, in head units (the head's centre is the origin)
  const SH = {                                       // what each one wears
    ONE: { a: '#5db3e4', b: '#3d8fc2', collar: null, sleeve: 'short' },
    TWO: { a: '#eef2f8', b: '#c9d3e2', check: '#5f80c0', collar: '#e4eaf3', sleeve: 'long' },
    THREE: { a: '#dcc8a0', b: '#b9a47c', collar: '#cbb68e', sleeve: 'short', pocket: true },
  };
  function torso(g, P, o = {}) {
    const by = 168, D = P.D;
    const arm = (k) => {
      const a = (o.arm && o.arm[k > 0 ? 1 : 0]) || 0;
      g.save(); g.translate(k * 292, by + 170); g.rotate(k * 0.12 + a);
      g.fillStyle = D.sleeve === 'long' ? D.b : P.L.skin; R(g, -54, -30, 108, 560, 50); g.fill();
      g.fillStyle = D.b; R(g, -58, -40, 116, D.sleeve === 'long' ? 560 : 230, 52); g.fill();
      if (D.check) { g.save(); R(g, -58, -40, 116, 560, 52); g.clip(); g.strokeStyle = D.check; g.globalAlpha *= 0.5; g.lineWidth = 6; for (let i = -2; i < 8; i++) { g.beginPath(); g.moveTo(-60, i * 70); g.lineTo(60, i * 70); g.stroke(); } g.beginPath(); g.moveTo(0, -40); g.lineTo(0, 560); g.stroke(); g.restore(); }
      g.fillStyle = P.L.skin; ell(g, 0, 560, 50, 58); g.fill();
      g.restore();
    };
    arm(-1); arm(1);
    g.fillStyle = lg(g, -300, by, 300, by + 800, [0, D.a], [1, D.b]);
    g.beginPath(); g.moveTo(-262, by + 900); g.lineTo(-292, by + 250); g.bezierCurveTo(-300, by + 170, -210, by + 124, -96, by + 92); g.lineTo(96, by + 92); g.bezierCurveTo(210, by + 124, 300, by + 170, 292, by + 250); g.lineTo(262, by + 900); g.closePath(); g.fill();
    if (D.check) { g.save(); g.beginPath(); g.moveTo(-262, by + 900); g.lineTo(-292, by + 250); g.bezierCurveTo(-300, by + 170, -210, by + 124, -96, by + 92); g.lineTo(96, by + 92); g.bezierCurveTo(210, by + 124, 300, by + 170, 292, by + 250); g.lineTo(262, by + 900); g.closePath(); g.clip(); g.strokeStyle = D.check; g.globalAlpha *= 0.45; g.lineWidth = 7; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * 64, by); g.lineTo(i * 64, by + 900); g.stroke(); } for (let j = 0; j < 14; j++) { g.beginPath(); g.moveTo(-300, by + j * 64); g.lineTo(300, by + j * 64); g.stroke(); } g.restore(); }
    if (D.collar) { g.fillStyle = D.collar; g.beginPath(); g.moveTo(-98, by + 88); g.lineTo(-20, by + 200); g.lineTo(-64, by + 214); g.lineTo(-134, by + 110); g.closePath(); g.moveTo(98, by + 88); g.lineTo(20, by + 200); g.lineTo(64, by + 214); g.lineTo(134, by + 110); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.3)'; for (let i = 0; i < 6; i++) { ell(g, 0, by + 250 + i * 104, 7, 7); g.fill(); } }
    else { g.fillStyle = D.b; g.beginPath(); g.moveTo(-96, by + 92); g.quadraticCurveTo(0, by + 190, 96, by + 92); g.lineTo(80, by + 92); g.quadraticCurveTo(0, by + 160, -80, by + 92); g.closePath(); g.fill(); }
    if (D.pocket) { g.strokeStyle = 'rgba(80,60,30,0.45)'; g.lineWidth = 6; R(g, -220, by + 300, 120, 130, 8); g.stroke(); g.fillStyle = '#2d4f9a'; R(g, -196, by + 268, 16, 80, 6); g.fill(); }
    const nw = 70;
    g.fillStyle = lg(g, -80, 0, 80, 0, [0, P.L.skinD], [0.55, P.L.skin], [1, P.L.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 6, by + 100); g.quadraticCurveTo(0, by + 180, nw + 6, by + 100); g.lineTo(nw, 120); g.closePath(); g.fill();
    // what they carry, on top
    if (P.kit === 'pack') {                         // backpack straps and white earphones round his neck
      g.strokeStyle = '#2f343c'; g.lineWidth = 46; g.lineCap = 'butt'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 170, by + 96); g.quadraticCurveTo(k * 210, by + 420, k * 190, by + 760); g.stroke(); }
      g.strokeStyle = '#f4f4f0'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-80, by + 40); g.quadraticCurveTo(-60, by + 220, 0, by + 250); g.quadraticCurveTo(60, by + 220, 80, by + 40); g.stroke();
      for (const k of [-1, 1]) { ell(g, k * 82, by + 34, 14, 16); g.fillStyle = '#f4f4f0'; g.fill(); }
    } else if (P.kit === 'id') {                    // a red lanyard and a blank white card
      g.strokeStyle = '#c8323c'; g.lineWidth = 16; g.beginPath(); g.moveTo(-70, by + 90); g.quadraticCurveTo(-20, by + 420, 0, by + 470); g.quadraticCurveTo(20, by + 420, 70, by + 90); g.stroke();
      g.save(); g.translate(0, by + 470); g.rotate(-0.06 + (o.swing || 0)); R(g, -62, 0, 124, 160, 10); g.fillStyle = '#fbfbf7'; g.fill(); g.strokeStyle = '#99a'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#c8cfdb'; R(g, -40, 22, 80, 60, 6); g.fill(); g.fillStyle = '#9aa4b5'; for (const yy of [100, 122]) { R(g, -42, yy, 84, 10, 4); g.fill(); } g.restore();
    }
  }
  // a man standing, head at (x, y); s = scale (the head is about 400 s wide). o.back: seen from behind. o.turn: 0 facing you, 1 back to you
  function person(g, P, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.roll || 0);
    const turn = o.turn ?? 0, sx = Math.max(0.06, Math.abs(Math.cos(turn * Math.PI)) * 0.88 + 0.12);
    g.scale(sx, 1);
    const sw = o.phase != null ? Math.sin(o.phase) : 0, by = 168;
    if (!o.noLegs) {                                // legs, only when the frame shows them
      const leg = (k) => { const a = sw * k * 0.35; g.save(); g.translate(k * 92, by + 800); g.rotate(a * 0.4); g.fillStyle = P.D.leg || '#3a3f4b'; R(g, -64, -30, 128, 620, 44); g.fill(); g.fillStyle = '#211a16'; R(g, -74, 566, 160, 60, 24); g.fill(); g.restore(); };
      leg(-1); leg(1);
    }
    if (turn < 0.5) { torso(g, P, o); head(g, P.L, o); if (P.kit === 'veg' && !o.noBag) vegBag(g, 300, by + 640); }
    else {
      g.save(); g.scale(-1, 1);
      const arm = (k) => { g.save(); g.translate(k * 292, by + 170); g.rotate(k * 0.12); g.fillStyle = P.D.b; R(g, -58, -40, 116, P.D.sleeve === 'long' ? 560 : 230, 52); g.fill(); g.fillStyle = P.L.skin; if (P.D.sleeve !== 'long') { R(g, -50, 180, 100, 360, 48); g.fill(); } ell(g, 0, 560, 50, 58); g.fill(); g.restore(); };
      arm(-1); arm(1);
      g.fillStyle = lg(g, -300, by, 300, by + 800, [0, P.D.a], [1, P.D.b]);
      g.beginPath(); g.moveTo(-262, by + 900); g.lineTo(-292, by + 250); g.bezierCurveTo(-300, by + 170, -210, by + 124, -96, by + 92); g.lineTo(96, by + 92); g.bezierCurveTo(210, by + 124, 300, by + 170, 292, by + 250); g.lineTo(262, by + 900); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-250, by + 230); g.quadraticCurveTo(0, by + 280, 250, by + 230); g.stroke();
      if (P.kit === 'veg' && !o.noBag) vegBag(g, -300, by + 640);
      headBack(g, P.L);
      g.restore();
    }
    g.restore();
  }
  function vegBag(g, x, y) {                         // a jute bag, spinach and a bottle gourd sticking out
    g.save(); g.translate(x, y);
    g.strokeStyle = '#8c6236'; g.lineWidth = 14; g.beginPath(); g.moveTo(-60, -120); g.quadraticCurveTo(0, -220, 60, -120); g.stroke();
    g.fillStyle = '#5f9a3a'; for (let i = 0; i < 5; i++) { ell(g, -70 + i * 34, -90 - (i % 2) * 24, 30, 58, -0.4 + i * 0.2); g.fill(); }
    g.fillStyle = '#9bbf5a'; ell(g, 74, -110, 30, 90, 0.3); g.fill();
    g.fillStyle = lg(g, -110, -100, 110, 160, [0, '#d2a463'], [1, '#a77a40']); R(g, -110, -100, 220, 240, 26); g.fill();
    g.strokeStyle = 'rgba(80,50,20,0.3)'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-110, -80 + i * 26); g.lineTo(110, -80 + i * 26); g.stroke(); }
    g.restore();
  }
  const MEN = [
    { L: ONE, D: SH.ONE, kit: 'pack' },
    { L: TWO, D: { ...SH.TWO, leg: '#2b3140' }, kit: 'id' },
    { L: THREE, D: { ...SH.THREE, leg: '#5a5048' }, kit: 'veg' },
  ];

  // ------------------------------------------------------------------ the lane: a market street at noon, drawn once, taller than the frame so the camera can look down
  const LH = H + 760;                                // world height; the camera's tilt (camY) moves the window down it
  const HZ = 690;                                    // the horizon (eye level)
  let LN = null;
  function makeLane() {
    const bg = offscreen(W, LH), g = bg.getContext('2d'), r = mulberry32(34);
    // sky
    g.fillStyle = lg(g, 0, 0, 0, HZ, [0, '#9fd3ee'], [1, '#f4ecd6']); g.fillRect(0, 0, W, HZ + 10);
    // the far end of the lane: small buildings, a gap of sky
    const fcols = ['#e9a39b', '#8fcfc8', '#f1d27a', '#bfb0e2', '#f2bc8a'];
    for (let i = 0, x = 360; i < 6; i++) { const w = 60 + r() * 30, hh = 140 + r() * 120; g.fillStyle = fcols[i % 5]; g.fillRect(x, HZ - hh, w, hh + 40); g.fillStyle = 'rgba(40,50,60,0.4)'; for (let fy = HZ - hh + 16; fy < HZ - 20; fy += 34) g.fillRect(x + 10, fy, w - 20, 14); x += w; }
    // the two walls in perspective: shopfronts, awnings, hanging goods
    const VPX = 540;
    function wall(side) {
      const k = side, xNear = side < 0 ? -40 : W + 40, xFar = side < 0 ? 390 : 690;
      const yTopNear = -200, yTopFar = HZ - 300, yBotNear = 1500, yBotFar = HZ + 26;
      const at = (u, v) => [lerp(xNear, xFar, u), lerp(lerp(yTopNear, yBotNear, v), lerp(yTopFar, yBotFar, v), u)];
      const cols = side < 0 ? ['#ef9f95', '#f3cf6d', '#86cdc5', '#c4b2e4'] : ['#f2bb85', '#8dc7e8', '#f0a2b8', '#e9d873'];
      const shops = 6;
      for (let i = shops - 1; i >= 0; i--) {
        const u0 = Math.pow(i / shops, 0.62), u1 = Math.pow((i + 1) / shops, 0.62);
        const quad = (va, vb, fill) => { const a = at(u0, va), b = at(u1, va), c = at(u1, vb), d = at(u0, vb); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...d); g.closePath(); g.fillStyle = fill; g.fill(); };
        quad(0, 1, cols[i % 4]);                                        // the facade
        quad(0, 0.02, 'rgba(255,255,255,0.22)');
        quad(0.08, 0.3, 'rgba(40,50,60,0.55)');                          // an upper window band
        quad(0.1, 0.28, `rgba(255,226,170,${0.35 + 0.3 * r()})`);
        quad(0.62, 1, 'rgba(50,40,36,0.72)');                            // the shop's dark opening
        // goods in the opening: stacked colour
        for (let j = 0; j < 5; j++) { const ga = at(lerp(u0, u1, 0.1 + j * 0.17), 0.66), gb = at(lerp(u0, u1, 0.22 + j * 0.17), 0.96); g.fillStyle = ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#b94fd0', '#4fb06a'][(i + j) % 6]; g.fillRect(Math.min(ga[0], gb[0]), ga[1], Math.abs(gb[0] - ga[0]) * 0.8, (gb[1] - ga[1])); }
        // the awning: a sloped tarp sticking out into the lane
        const aw = ['stripe', '#2b6fb3', '#e2a92a', 'stripe2'][(i + (side > 0 ? 1 : 0)) % 4];
        const a0 = at(u0, 0.55), a1 = at(u1, 0.55), out = 140 * (1 - u0 * 0.85), out1 = 140 * (1 - u1 * 0.85);
        g.beginPath(); g.moveTo(...a0); g.lineTo(...a1); g.lineTo(a1[0] - k * out1, a1[1] + out1 * 0.55); g.lineTo(a0[0] - k * out, a0[1] + out * 0.55); g.closePath();
        if (aw === 'stripe' || aw === 'stripe2') { g.save(); g.clip(); const c2 = aw === 'stripe' ? '#e23b2e' : '#2d8f6b'; const n = 8; for (let m = 0; m < n; m++) { const p = at(lerp(u0, u1, m / n), 0.55), q = at(lerp(u0, u1, (m + 0.5) / n), 0.55); g.fillStyle = c2; g.beginPath(); g.moveTo(p[0], p[1] - 10); g.lineTo(q[0], q[1] - 10); g.lineTo(q[0] - k * out, q[1] + out); g.lineTo(p[0] - k * out, p[1] + out); g.closePath(); g.fill(); } g.restore(); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.0)'; }
        else { g.fillStyle = aw; g.fill(); }
        // hanging goods under the awning: bags and strings of bangles
        for (let j = 0; j < 4; j++) { const p = at(lerp(u0, u1, 0.15 + j * 0.22), 0.6), len = 60 * (1 - u0 * 0.8); g.strokeStyle = 'rgba(40,30,20,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(p[0] - k * out * 0.6, p[1] + out * 0.33); g.lineTo(p[0] - k * out * 0.6, p[1] + out * 0.33 + len); g.stroke(); g.fillStyle = ['#d94a8c', '#f0c32a', '#4a9fe0', '#e8712a'][(i + j) % 4]; ell(g, p[0] - k * out * 0.6, p[1] + out * 0.33 + len, 12 * (1 - u0 * 0.7), 16 * (1 - u0 * 0.7)); g.fill(); }
      }
      // the wall's edge at the lane
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 6; g.beginPath(); g.moveTo(xNear, yBotNear); g.lineTo(xFar, yBotFar); g.stroke();
    }
    wall(-1); wall(1);
    // a painted board on each side, pictures only (words get cut by the frame and by heads): a bangle stand on the left, bananas on the right.
    // (Four rings in a row read as a real logo: the fresh review.)
    g.save(); g.translate(150, 540); g.rotate(-0.04); R(g, -96, -60, 192, 120, 8); g.fillStyle = '#fff3cf'; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 4; g.stroke();
    for (const [sx, cols] of [[-44, ['#d33f6a', '#e8a21a', '#3a8fd9', '#d33f6a', '#e8a21a']], [44, ['#9a3fd0', '#2fa36b', '#e8a21a', '#9a3fd0', '#2fa36b']]]) {
      g.fillStyle = '#7a5a3a'; R(g, sx - 4, -44, 8, 90, 3); g.fill(); R(g, sx - 22, 42, 44, 8, 3); g.fill();          // the stand's pole and foot
      cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 7; g.beginPath(); g.ellipse(sx, -30 + i * 15, 24, 6, 0, 0, TAU); g.stroke(); });   // bangles, stacked flat
    }
    g.restore();
    g.save(); g.translate(930, 566); g.rotate(0.05); R(g, -90, -52, 180, 104, 8); g.fillStyle = '#1f6f9e'; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 4; g.stroke();
    for (let i = 0; i < 4; i++) {                                                  // a bunch of bananas, curving up from one stalk
      g.save(); g.translate(-30, 26); g.rotate(-0.95 + i * 0.32);
      g.fillStyle = '#f7d23a'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(46, -18, 86, -4); g.quadraticCurveTo(48, 4, 0, 14); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,90,10,0.45)'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#5a4a1a'; ell(g, 86, -4, 4, 3); g.fill();
      g.restore();
    }
    g.fillStyle = '#6b8a2a'; R(g, -40, 18, 16, 20, 4); g.fill();
    g.restore();
    // bunting and wires across the lane (pink, yellow, blue, white: nothing that reads as a flag)
    for (const [y0, y1, sag, n] of [[300, 330, 90, 16], [430, 410, 60, 14]]) {
      g.strokeStyle = 'rgba(30,25,20,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-20, y0); g.quadraticCurveTo(540, y0 + sag * 2, W + 20, y1); g.stroke();
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = lerp(-20, W + 20, u), y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (y0 + sag * 2) + u * u * y1; g.fillStyle = ['#ff7fb0', '#ffd84a', '#5ab8ff', '#fff6e0'][i % 4]; g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x + 22, y); g.lineTo(x, y + 44); g.closePath(); g.fill(); }
    }
    // the ground: paving in perspective, from the far end to under your own feet
    g.fillStyle = lg(g, 0, HZ, 0, LH, [0, '#cbbca2'], [0.4, '#bba98a'], [1, '#9b8a6d']);
    g.beginPath(); g.moveTo(390, HZ + 26); g.lineTo(690, HZ + 26); g.lineTo(W + 600, LH); g.lineTo(-600, LH); g.closePath(); g.fill();
    g.save(); g.beginPath(); g.moveTo(390, HZ + 26); g.lineTo(690, HZ + 26); g.lineTo(W + 600, LH); g.lineTo(-600, LH); g.closePath(); g.clip();
    g.strokeStyle = 'rgba(70,55,35,0.2)'; g.lineWidth = 3;
    for (let i = -9; i <= 9; i++) { g.beginPath(); g.moveTo(540 + i * 16, HZ + 26); g.lineTo(540 + i * 230, LH); g.stroke(); }
    for (let j = 1; j < 26; j++) { const yy = HZ + 26 + Math.pow(j / 25, 2.1) * (LH - HZ); g.beginPath(); g.moveTo(-600, yy); g.lineTo(W + 600, yy); g.stroke(); }
    // what lies on a market floor: marigold petals, a few leaves, a paper cup, a crumpled paper, a squashed tomato
    for (let i = 0; i < 160; i++) { const y = lerp(HZ + 60, LH - 20, Math.pow(r(), 0.7)), x = lerp(-80, W + 80, r()), s = lerp(0.3, 1.5, (y - HZ) / (LH - HZ)); g.fillStyle = r() > 0.25 ? '#f39a1e' : '#f7c52b'; ell(g, x, y, 7 * s, 4.5 * s, r() * 3); g.fill(); }
    for (let i = 0; i < 26; i++) { const y = lerp(HZ + 200, LH - 60, r()), x = lerp(20, W - 20, r()), s = lerp(0.5, 1.6, (y - HZ) / (LH - HZ)); const rot = r() * 3, c = r(); g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = c > 0.6 ? '#7fa83e' : c > 0.3 ? '#a8b84a' : '#c79a4a'; g.beginPath(); g.moveTo(-26 * s, 0); g.quadraticCurveTo(0, -12 * s, 26 * s, 0); g.quadraticCurveTo(0, 12 * s, -26 * s, 0); g.fill(); g.restore(); }
    g.restore();
    LN = { bg };
  }
  // the near ground's own things, drawn every frame at their world spots (so they can sit in front of the crowd's feet)
  const LEAF = [574, 1708], CUP = [1010, 1530], PAPER_ = [262, 1650], BAG = [452, 1612];
  function nearLitter(g) {
    g.save(); g.translate(...CUP); g.rotate(0.3); g.fillStyle = 'rgba(0,0,0,0.18)'; ell(g, 6, 26, 46, 14); g.fill(); g.fillStyle = '#f4efe2'; g.beginPath(); g.moveTo(-30, -34); g.lineTo(30, -34); g.lineTo(22, 30); g.lineTo(-22, 30); g.closePath(); g.fill(); g.fillStyle = '#c94a2a'; g.fillRect(-26, -16, 50, 12); ell(g, 0, -34, 30, 9); g.fillStyle = '#e6dfcf'; g.fill(); g.restore();
    g.save(); g.translate(...PAPER_); g.fillStyle = '#ece6d4'; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = 30 + 12 * ((i * 37) % 5) / 5; g.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.6); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 3; g.stroke(); g.restore();
    g.save(); g.translate(...BAG); g.rotate(-0.25); g.fillStyle = '#b98b55'; g.beginPath(); g.moveTo(-58, -14); g.lineTo(-20, -30); g.lineTo(30, -22); g.lineTo(62, -4); g.lineTo(48, 22); g.lineTo(-6, 28); g.lineTo(-50, 18); g.closePath(); g.fill(); g.strokeStyle = 'rgba(90,60,30,0.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-30, -10); g.lineTo(10, 6); g.lineTo(40, -6); g.stroke(); g.restore();
    g.save(); g.translate(...LEAF); g.rotate(-0.5); g.fillStyle = '#8a5f2f'; ell(g, 0, 0, 52, 17); g.fill(); g.strokeStyle = '#5f3f1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(-50, 0); g.lineTo(52, 0); g.stroke(); g.restore();
  }

  // ------------------------------------------------------------------ the crowd behind: simple people at their own depths, walking both ways
  const CROWD = (() => {
    const r = mulberry32(77), out = [], cols = ['#e05a6f', '#f2c14e', '#4aa3df', '#8e6fd1', '#f08a4b', '#3fb39a', '#d9d4c8', '#c94f8b', '#5b6fb5', '#e7a8c2'];
    for (let i = 0; i < 22; i++) {
      const d = 0.16 + r() * 0.42, dir = r() > 0.5 ? 1 : -1;
      out.push({ d, x0: r() * 1400 - 160, v: (16 + r() * 34) * dir * d, c: cols[i % cols.length], c2: cols[(i + 4) % cols.length], hair: r() > 0.3 ? '#16100c' : '#6c6a66', skin: ['#c99068', '#b57d58', '#d4a079', '#a8714d'][i % 4], dress: r() > 0.62, ph: r() * 6, toward: r() > 0.5 });
    }
    return out.sort((a, b) => a.d - b.d);
  })();
  function extra(g, p, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const sw = Math.sin(t * 7 + p.ph);
    g.fillStyle = 'rgba(30,20,10,0.2)'; ell(g, 0, 1060, 160, 26); g.fill();
    if (p.dress) { g.fillStyle = p.c; g.beginPath(); g.moveTo(-120, 260); g.lineTo(120, 260); g.lineTo(170, 1040); g.lineTo(-170, 1040); g.closePath(); g.fill(); g.fillStyle = p.c2; g.beginPath(); g.moveTo(-120, 270); g.quadraticCurveTo(0, 330, 140, 260); g.lineTo(150, 520); g.quadraticCurveTo(0, 440, -130, 500); g.closePath(); g.fill(); }
    else { g.fillStyle = '#3a3f4b'; for (const k of [-1, 1]) { g.save(); g.translate(k * 50, 620); g.rotate(sw * k * 0.25); R(g, -42, 0, 84, 430, 30); g.fill(); g.restore(); } g.fillStyle = p.c; R(g, -130, 240, 260, 420, 70); g.fill(); }
    g.fillStyle = p.skin; R(g, -34, 170, 68, 90, 20); g.fill();
    ell(g, 0, 110, 92, 108); g.fill();
    g.fillStyle = p.hair; if (p.toward) { g.beginPath(); g.ellipse(0, 70, 96, 80, 0, Math.PI, TAU); g.fill(); g.fillStyle = 'rgba(30,20,12,0.6)'; for (const k of [-1, 1]) { ell(g, k * 32, 112, 9, 11); g.fill(); } } else { ell(g, 0, 96, 96, 100); g.fill(); }
    g.restore();
  }
  function crowd(g, t, camY, frozen, lo = -Infinity, hi = Infinity) {      // only the people whose feet are in (lo, hi] on screen: interleaved with the far men by depth
    const tt = frozen != null ? Math.min(t, frozen) : t;
    for (const p of CROWD) {
      const s = p.d * 0.5, y = HZ - 230 * s * 0.45 + (1 - p.d) * 10 + p.d * 520 - camY, x = ((p.x0 + p.v * tt) % 1400 + 1400) % 1400 - 160;
      const foot = y + 1060 * s;
      if (foot <= lo || foot > hi) continue;
      extra(g, p, x, y + 6 * Math.abs(Math.sin(tt * 7 + p.ph)) * s, s, tt);
    }
  }

  // ------------------------------------------------------------------ you: your right hand, your wallet, your shoes
  const SKIN_U = { a: '#cf9670', b: '#9a6444', c: '#c98e68' };
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
    g.fillStyle = '#5b7ba6'; g.beginPath(); g.moveTo(70, 150); g.bezierCurveTo(90, 90, 210, 60, 250, 110); g.lineTo(290, 170); g.bezierCurveTo(240, 130, 120, 150, 100, 210); g.closePath(); g.fill();
    const op = o.open ?? 0;
    if (op < 0.5) {
      // the back of the hand, the knuckles, fingers curled under; the wallet sits in the curl
      if (o.hold) wallet(g, -70, -10, 1.05, -0.12);
      g.fillStyle = lg(g, -130, -40, 160, 160, [0, '#d6a07a'], [1, '#a9744f']);
      ell(g, 110, 60, 120, 104, -0.3); g.fill();
      for (let i = 0; i < 4; i++) { R(g, -120 + i * 8, -6 + i * 34, 200, 36, 18); g.fill(); }
      g.fillStyle = 'rgba(120,60,30,0.18)'; for (let i = 0; i < 4; i++) { ell(g, -96 + i * 8, 12 + i * 34, 14, 8); g.fill(); }
      g.save(); g.translate(40, -40); g.rotate(-2.45); R(g, 0, -26, 168, 52, 26); g.fillStyle = lg(g, 0, -26, 0, 26, [0, '#e4b08a'], [1, '#c48e68']); g.fill(); R(g, 130, -16, 30, 32, 12); g.fillStyle = '#f0d2bc'; g.fill(); g.restore();
    } else {
      // open and empty, the palm to you, fingers spread up: nothing in it
      g.save(); g.translate(120, 40); g.rotate(0.55); g.scale(-1, 1);
      const skin = lg(g, -150, -260, 150, 160, [0, '#e7b590'], [1, '#b98058']);
      g.fillStyle = skin;
      const fing = [[-78, -0.2, 190], [-26, -0.06, 220], [26, 0.06, 210], [76, 0.2, 170]];
      for (const [fx, a, L] of fing) { g.save(); g.translate(fx, -70); g.rotate(a); R(g, -24, -L, 48, L + 30, 24); g.fill(); g.strokeStyle = 'rgba(120,60,30,0.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, -L * 0.55); g.lineTo(10, -L * 0.55); g.stroke(); g.restore(); }
      g.save(); g.translate(-108, 40); g.rotate(-0.85); R(g, -24, -150, 50, 170, 25); g.fill(); g.restore();
      R(g, -112, -96, 224, 230, 90); g.fill();
      g.strokeStyle = 'rgba(120,60,30,0.3)'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-70, -20); g.quadraticCurveTo(0, 20, 80, -30); g.moveTo(-60, 40); g.quadraticCurveTo(-10, 70, 40, 100); g.stroke();
      g.restore();
    }
    g.restore();
  }
  function myShoes(g, camY) {                       // the toes of your own trainers, at the bottom of the world
    for (const k of [-1, 1]) {
      g.save(); g.translate(540 + k * 176, 1860 - camY); g.rotate(k * 0.07);
      g.fillStyle = 'rgba(0,0,0,0.2)'; ell(g, 0, 40, 150, 46); g.fill();
      const toe = () => { g.beginPath(); g.moveTo(-118, 260); g.bezierCurveTo(-128, 40, -86, -66, 0, -70); g.bezierCurveTo(86, -66, 128, 40, 118, 260); g.closePath(); };
      toe(); g.fillStyle = '#f2efe6'; g.fill();                                   // the white sole round the toe
      g.save(); g.translate(0, 14); g.scale(0.9, 0.92); toe(); g.fillStyle = lg(g, -110, -40, 110, 200, [0, '#3f5f8f'], [1, '#26406a']); g.fill(); g.restore();
      g.fillStyle = '#e9e4d6'; g.beginPath(); g.moveTo(-70, -10); g.quadraticCurveTo(0, -52, 70, -10); g.quadraticCurveTo(0, -30, -70, -10); g.fill();   // the toe cap
      g.strokeStyle = '#f4f1e8'; g.lineWidth = 7; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-36, 56 + i * 30); g.lineTo(36, 56 + i * 30); g.stroke(); }
      g.fillStyle = '#4a6a94'; R(g, -150, 210, 300, 220, 40); g.fill();             // your jeans' hems
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

  // ------------------------------------------------------------------ the lane, live: the walk, the three bumps, the freeze
  // Where each man is (head x, y, scale) and how he's turned, as a function of t. They all end up in front of you, turned to you.
  const SPOT = [[350, 612, 0.44], [548, 584, 0.5], [730, 622, 0.46]];    // the lineup the freeze puts them in (close: number 3 stays inside the right safe line)
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
    const m1 = key(t, [[0, 420, 700, 0.15, 0], [TT.b1 - 0.55, 330, 690, 0.42, 0], [TT.b1, 150, 760, 1.05, 0], [TT.b1 + 0.55, 70, 770, 1.12, 0], [TT.b1 + 1.0, -760, 800, 1.3, 0], [F, -760, 800, 1.3, 0], [F1, SPOT[0][0], SPOT[0][1], SPOT[0][2], 0]]);
    const m2 = key(t, [[0, 590, 690, 0.12, 0], [TT.b2 - 1.1, 570, 690, 0.3, 0], [TT.b2 - 0.25, 420, 760, 0.95, 0], [TT.b2, 260, 810, 1.3, 0], [TT.b2 + 0.32, 270, 800, 1.25, 0], [TT.b2 + 0.6, 400, 690, 0.66, 0], [TT.b2 + 1.0, 470, 610, 0.44, 0], [F, 470, 606, 0.43, 0], [F1, SPOT[1][0], SPOT[1][1], SPOT[1][2], 0]]);   // he holds through the slip, then steps well back
    // number three: in from your right, past you, up the lane. His feet are level with the wallet at about 5.78 s, clear of it even mid-stride;
    // after that they're well beyond it. His head is inside the 950 line from about 6.0 s.
    const P3W = [[TT.b2 + 0.35, 1480, 900, 1.3, 1], [TT.b3 - 0.6, 1260, 862, 1.25, 1], [TT.b3, 1030, 760, 0.95, 1], [TT.b3 + 0.34, 940, 668, 0.56, 1], [TT.b3 + 0.59, 828, 645, 0.475, 1], [TT.b3 + 1.6, 765, 632, 0.41, 1], [F, 750, 626, 0.38, 1]];
    const m3 = t < F ? spline(t, P3W) : key(t, [[F, 750, 626, 0.38, 1], [F1, SPOT[2][0], SPOT[2][1], SPOT[2][2], 0]]);
    const g3 = sstep(TT.b3 + 0.9, TT.b3 + 1.05, t) * (1 - sstep(TT.b3 + 1.45, TT.b3 + 1.6, t));   // three glances back at you once
    if (t < F) m3[3] = Math.min(m3[3], 1 - g3);
    return [m1, m2, m3];
  }
  // the camera: you walk until the second bump, then stop; your eyes drop a little after the bump (camY), and right down on "Look down."
  function camAt(t) {
    const TT = times();
    const walk = 1 - sstep(TT.b2, TT.stop + 0.2, t);
    const bob = walk * 9 * Math.sin(t * TAU * 1.9), sway = walk * 4 * Math.sin(t * Math.PI * 1.9);
    const drop = sstep(TT.b2 + 0.95, TT.b2 + 1.55, t);                        // your eyes drop: the floor at your feet
    const up = sstep(TT.n02 - 0.05, TT.gone + 0.1, t);                        // you look up at them: the floor is out of shot by "gone"
    const jolt = sstep(TT.b2, TT.b2 + 0.3, t);                                // the bump knocks your eyes down
    let camY = lerp(lerp(lerp(-110, 60, jolt), 100, drop), -150, up), zoom = lerp(1 + 0.035 * sstep(0, TT.b2, t), 1.35, up) + 0.05 * sstep(TT.freeze + 0.5, TT.clock1, t);
    const dn = sstep(TT.down0, TT.down1, t);                                  // "Look down."
    camY = lerp(camY, 700, dn); zoom = lerp(zoom, 1, dn);
    const back = sstep(TT.up0, TT.up1, t);                                    // back up at the three, the wide frame
    camY = lerp(camY, 100, back);
    return { bob, sway, camY, zoom };
  }

  // the wallet, as a function of t: in your hand, falling, on the ground (world coordinates), then in the thief's hand
  const WG = [710, 1525];                            // where it lies: in the world, by your right foot (on screen y ≈ 1456, inside Instagram's safe zone)
  function walletAt(t, hand) {
    const TT = times();
    if (t < TT.drop) return { st: 'hand' };
    const d = t - TT.drop, fall = 0.4;
    if (d < fall) {                                 // it falls from your fingers to the exact spot it then lies on
      const u = d / fall, gy = WG[1] - camAt(TT.drop + fall).camY, h0 = handAt(TT.drop);
      return { st: 'fall', x: lerp(h0.x - 70, WG[0], u), y: lerp(h0.y - 10, gy, u * u) - 50 * u * (1 - u), rot: lerp(-0.12, -0.16, u) - 0.8 * Math.sin(u * Math.PI), s: h0.s * lerp(1.05, 0.74, u), flatK: sstep(0.55, 1, u) };
    }
    return { st: 'ground', x: WG[0], y: WG[1], rot: -0.16, s: 0.74 };
  }
  function handAt(t) {
    const TT = times(), c = camAt(t);
    let x = 812, y = 1350 + c.bob * 0.6, rot = -0.05, s = 1.0, open = 0;
    const jolt = (t0, a) => (t >= t0 ? a * Math.exp(-(t - t0) * 6) * Math.sin((t - t0) * 22) : 0);
    rot += jolt(TT.b1, 0.05) + jolt(TT.b2, 0.16) + jolt(TT.b3, 0.09);
    y += (t >= TT.b2 ? 60 * Math.exp(-(t - TT.b2) * 5) : 0) + 620 * sstep(TT.b2 + 0.5, TT.b2 + 1.0, t);   // your arm drops to your side
    x += 230 * sstep(TT.b2 + 0.02, TT.b2 + 0.25, t) + 70 * sstep(TT.b2 + 0.45, TT.b2 + 0.95, t);   // knocked aside, then down to your side
    const up = sstep(TT.lift, TT.lift + 0.35, t) * (1 - sstep(TT.lower, TT.lower + 0.3, t));
    x = lerp(x, 690, up); y = lerp(y, 1180, up) + 520 * sstep(TT.lower, TT.lower + 0.3, t); rot = lerp(rot, -0.55, up); open = up;
    return { x, y, s, rot, open };
  }
  function lane(g, t, o = {}) {
    const TT = times();
    if (!LN) makeLane();
    const c = camAt(t), frozen = t >= TT.freeze ? TT.freeze : null, tt = frozen ?? t;
    const sh = shakeAt(t, [[TT.b1, 14], [TT.b2, 36], [TT.b3, 18]]);
    g.save();
    g.translate(540 + sh[0] + c.sway, 960 + sh[1]); g.scale(c.zoom, c.zoom); g.translate(-540, -960 + c.bob);
    g.fillStyle = '#9fd3ee'; g.fillRect(-200, -400, W + 400, 400 - c.camY + 2);    // sky above the drawn lane, for when you look ahead and the camera shakes
    g.drawImage(LN.bg, 0, -c.camY);
    const men = menAt(t), order = [0, 2, 1];
    const foot = (i) => men[i][1] + 1594 * men[i][2] - c.camY;           // his feet on screen: lower is nearer
    g.save(); g.translate(0, -c.camY); nearLitter(g); g.restore();
    const hd = handAt(t), wl = walletAt(t, hd);
    const drawMan = (i) => {
      const [x, y, s, turn] = men[i], close = s > 0.8;
      const look = close ? [0, 6] : (i === 1 && t < TT.b2 - 0.3 ? [6, 9] : [i === 2 ? -6 : 0, 2]);
      const mood = o.mood ? o.mood(i, t) : {};
      const blink = !frozen && !o.noBlink && s < 0.8 && !(i === 1 && Math.abs(t - TT.b2) < 1.0) && ((t + 1.1 + i * 1.3) % 3.1) < 0.12 ? 1 : 0;   // never on frame 0, never two at once, never in number two's bump
      const op = i === 1 && t > TT.b2 - 0.35 && t < TT.b2 + 0.55 ? 0.45 * sstep(TT.b2 - 0.35, TT.b2 - 0.1, t) * (1 - sstep(TT.b2 + 0.32, TT.b2 + 0.55, t)) : 0;
      person(g, MEN[i], x, y - c.camY, s, { turn, look: mood.look || look, close: mood.close ?? blink, op: mood.op ?? op, frown: mood.frown ?? (i === 2 ? 0.25 : 0.1), worry: mood.worry ?? (i === 1 ? (op > 0 ? -10 : -7) : 0), smile: mood.smile ?? 0, phase: frozen ? 1.2 : tt * 7 + i, noLegs: s > 1.2, arm: mood.arm });
    };
    let lo = -Infinity;                                                   // the far men, each at his depth among the passers-by
    for (const i of order.filter((i) => men[i][2] < 0.35).sort((a, b) => foot(a) - foot(b))) { crowd(g, tt, c.camY, frozen, lo, foot(i)); if (o.men !== false) drawMan(i); lo = foot(i); }
    crowd(g, tt, c.camY, frozen, lo, Infinity);
    // the near men in their fixed order; the wallet on the floor between those beyond it and those nearer (only while it's in shot, so no man pops in front of another)
    const near = order.filter((i) => men[i][2] >= 0.35), wOn = wl.st === 'ground' && !o.noWallet;
    const split = wOn && toScreen(c, WG[0], WG[1])[1] < 2000, wy = WG[1] - c.camY;
    const beyond = split ? near.filter((i) => foot(i) <= wy) : near, nearer = split ? near.filter((i) => foot(i) > wy) : [];
    if (o.men !== false) beyond.forEach(drawMan);
    if (wOn && split) wallet(g, wl.x, wl.y - c.camY, wl.s, wl.rot, { flat: true });
    if (o.men !== false) nearer.forEach(drawMan);
    if (o.after) o.after(g, c);
    if (wOn && !split) wallet(g, wl.x, wl.y - c.camY, wl.s, wl.rot, { flat: true });
    if (!o.noShoes) myShoes(g, c.camY);
    if (o.hand !== false && hd.y < 2200) myHand(g, hd.x, hd.y, hd.s, hd.rot, { hold: wl.st === 'hand', open: hd.open });
    if (wl.st === 'fall' && !o.noWallet) wallet(g, wl.x, wl.y, wl.s, wl.rot, { flatK: wl.flatK });
    g.restore();
    return { c, wl };
  }

  // ------------------------------------------------------------------ shots
  // 1 · the walk, the bumps, the freeze and the clock
  function shotLane(g, t) {
    const TT = times();
    lane(g, t);
    // frame 0: the role, said twice (the words and the picture), out with the first line
    const out = sstep(TT.n01e - 0.05, TT.n01e + 0.2, t);
    if (out < 1) { g.save(); g.globalAlpha = 1 - out; txt(g, "YOU'RE THE", 513, 380, 104, CREAM, { align: 'center', stroke: INK, sw: 0.14 }); txt(g, 'VICTIM', 513, 560, 210, YEL, { align: 'center', fit: 860, stroke: INK, sw: 0.12 }); g.restore(); }
    // the counts, small, as each man reaches you
    { const c0 = camAt(t), M = menAt(t);
      [['c1', 0], ['c2', 1], ['c3', 2]].forEach(([p, i]) => {
        const t0 = at(p) - 0.03, k = win3(t, t0, t0 + 0.8), m = M[i];
        let [x, y] = toScreen(c0, m[0], m[1] - 330 * m[2] - 70); y = clamp(y, 330, 900);
        const kx = clamp((x + 10) / 70) * clamp((1150 - x) / 70);
        if (k * kx > 0) { g.save(); g.globalAlpha = k * kx; g.translate(clamp(x, 90, 930), y); const q = pop(t, t0); g.scale(lerp(0.6, 1, q), lerp(0.6, 1, q)); tileNo(g, 0, 0, i + 1, 112); g.restore(); }
      }); }
    if (t >= TT.gone - 0.04 && t < TT.freeze) title(g, 'YOUR WALLET?', 850, 120, CREAM, t, TT.gone - 0.04, { stroke: INK, sw: 0.14 });
    if (t >= TT.freeze) {
      // the street stops; the three get their numbers; the ritual line; then the clock
      const c = camAt(t);
      menAt(t).forEach((m, i) => { const q = pop(t, TT.freeze + 0.05 + i * 0.12); let [x, y] = toScreen(c, m[0], m[1] - 380 * m[2] - 64); y = Math.max(y, 318); g.save(); g.translate(x, y); g.scale(q, q); tileNo(g, 0, 0, i + 1, 92); g.restore(); });
      if (t < TT.clock0) { title(g, 'WHOEVER YOU PICK', 1010, 98, CREAM, t, TT.n03 - 0.04, { stroke: INK, sw: 0.14 }); if (t >= TT.jail - 0.04) title(g, 'GOES TO JAIL', 1130, 128, '#ff5a3a', t, TT.jail - 0.04, { stroke: INK, sw: 0.12 }); }
      else {
        title(g, 'WHICH ONE?', 1030, 128, CREAM, t, TT.clock0, { stroke: INK, sw: 0.12 });
        const left = Math.min(5, Math.max(0, Math.ceil(TT.clock1 - t - 1e-3)));
        g.save(); g.translate(540, 1140); R(g, -110, -44, 220, 88, 12); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
        txt(g, '00:0' + left, 0, 27, 68, left <= 1 ? '#ff4a30' : '#ffb347', { kind: 'mono', align: 'center' }); g.restore();
      }
    }
    return flashAt(t, TT.freeze) * 0.22;
  }
  const win3 = (t, a, b) => sstep(a, a + 0.08, t) * (1 - sstep(b - 0.2, b, t));
  const toScreen = (c, x, y) => [(x - 540) * c.zoom + 540 + c.sway, (y - c.camY - 960 + c.bob) * c.zoom + 960];   // lane(): translate(540+sway, 960) · scale(zoom) · translate(-540, -960+bob)
  // 2 · "Look down." The camera drops to your feet; a ring closes on the wallet. "It's been there the whole time." "Nobody took it."
  function walletOnScreen(c) { return toScreen(c, WG[0], WG[1]); }
  function shotDown(g, t) {
    const TT = times();
    const { c } = lane(g, t);
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
  // 3 · back up at the three of them: INNOCENT, one after another; the cell door in the gap after the line
  const hurt = (i) => ({ look: [i === 0 ? 8 : i === 2 ? -8 : 0, 2], frown: [0.45, 0.35, 0.4][i], worry: [-14, -16, -6][i] });
  function shotInnocent(g, t) {
    const TT = times();
    lane(g, t, { mood: hurt, hand: false });
    const c = camAt(t);
    for (let i = 0; i < 3; i++) { const [x, y, s] = SPOT[i], [sx, sy] = toScreen(c, x, y + 430 * s); stamp(g, 'INNOCENT', sx + (i === 2 ? 30 : i === 0 ? -30 : 0), sy + (i === 1 ? 125 : 0), t, TT.going + i * 0.3, RED, 52, i === 1 ? 0.06 : -0.08); }
    const bk = sstep(TT.n07e + 0.05, TT.n07e + 0.3, t) * (1 - sstep(TT.nobody - 0.05, TT.nobody + 0.55, t));   // the door shuts; if you spotted it, it lifts
    if (bk > 0) bars(g, bk);
    if (t >= TT.n07b - 0.04 && t < TT.face0) title(g, 'SPOTTED IT?', 1258, 112, YEL, t, TT.n07b - 0.04, { stroke: INK, sw: 0.12 });
    if (t >= TT.bumping - 0.04 && t < TT.n07b - 0.05) title(g, 'FOR BUMPING INTO YOU', 1390, 96, CREAM, t, TT.bumping - 0.04, { stroke: INK, sw: 0.14 });
    if (t >= TT.nobody - 0.04) title(g, 'NOBODY GOES TO JAIL', 1390, 96, CREAM, t, TT.nobody - 0.04, { stroke: INK, sw: 0.14 });
    return flashAt(t, TT.n07e + 0.3) * 0.3;
  }
  function bars(g, k, y0 = 250, y1 = 1300) {        // a cell front over the three of them, from y0 to y1
    const off = lerp(-(y1 + 40), 0, k), bw = 38, hw = bw / 2;
    g.save(); g.translate(0, off); g.beginPath(); g.rect(0, y0 - 30 - off, W, y1 - y0 + 60); g.clip();
    for (let i = 0; i < 8; i++) { const x = 75 + i * 146; g.fillStyle = lg(g, x - hw, 0, x + hw, 0, [0, '#16181c'], [0.35, '#6f747d'], [0.55, '#9ea3ab'], [1, '#1c1e23']); g.fillRect(x - hw, y0, bw, y1 - y0); }
    for (const yy of [y0 + 20, y1 - 20]) { g.fillStyle = lg(g, 0, yy - 24, 0, yy + 24, [0, '#16181c'], [0.4, '#7c818a'], [1, '#1c1e23']); g.fillRect(-10, yy - 24, W + 20, 48); }
    g.restore();
  }

  // 4 · "It slipped out of your hand four seconds in, while you were face to face with number two." The film runs back to 0:03.75 and
  //     forward slowly through the bump, then holds at 0:04.08: his face fills the top, your wallet falls at the bottom. HIS FACE / YOUR WALLET.
  //     "Magicians call that misdirection." over the held frame. The sound-off review: without this, misdirection was told, not shown.
  const HOLDT = 4.3;
  function shotReplay(g, t) {
    const TT = times(), r0 = TT.face0, r1 = TT.face0 + 0.42, p1 = Math.max(r1 + 2.2, TT.n08e);
    let tau;
    if (t < r1) tau = lerp(TT.freeze + 0.5, 3.75, sstep(r0, r1, t));             // running backwards
    else tau = Math.min(HOLDT, lerp(3.75, HOLDT, (t - r1) / (p1 - r1)));          // forward at about a fifth of the speed, then held
    const push = 1 + 0.05 * sstep(p1, TT.fin, t);
    g.save(); g.translate(0, -160); g.translate(540, 900); g.scale(push, push); g.translate(-540, -900);
    const { c } = lane(g, tau, { noBlink: true, noShoes: true });
    g.restore();
    if (t >= r1) { g.fillStyle = 'rgba(255,248,230,0.08)'; g.fillRect(0, 0, W, H); }
    // the film's own clock
    g.save(); g.translate(170, 1060); R(g, -140, -48, 280, 96, 14); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
    const sec = Math.floor(tau), cs = Math.floor((tau - sec) * 100);
    txt(g, `0:0${sec}.${String(cs).padStart(2, '0')}`, 0, 28, 70, tau >= 3.99 ? '#ff5a3a' : '#ffb347', { kind: 'mono', align: 'center' }); g.restore();
    if (t < r1) { g.save(); g.translate(540, 1200); g.fillStyle = CREAM; g.strokeStyle = INK; g.lineWidth = 8; g.lineJoin = 'round'; for (const dx of [-46, 46]) { g.beginPath(); g.moveTo(dx + 46, -54); g.lineTo(dx + 46, 54); g.lineTo(dx - 46, 0); g.closePath(); g.stroke(); g.fill(); } g.restore(); return flashAt(t, r0) * 0.25; }
    // the ring follows your wallet: in your fingers, falling, landing
    const hd = handAt(tau), wl = walletAt(tau, hd);
    let wx, wy;
    if (wl.st === 'hand') [wx, wy] = [(hd.x - 70 - 540) * c.zoom + 540 + c.sway, (hd.y - 10 - 960 + c.bob) * c.zoom + 960];
    else if (wl.st === 'fall') [wx, wy] = [(wl.x - 540) * c.zoom + 540 + c.sway, (wl.y - 960 + c.bob) * c.zoom + 960];
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
  // 5 · "Still think you're the victim?" The three faces again, looking at you; a slow push in; into the card.
  function shotEnd(g, t) {
    const TT = times(), z = 1 + 0.05 * sstep(TT.fin, TT.end, t);
    g.save(); g.translate(540, 700); g.scale(z, z); g.translate(-540, -700);
    lane(g, t, { mood: (i) => ({ ...hurt(i), close: ((t + i * 1.1) % 3.2) < 0.11 ? 1 : 0 }), hand: false });
    g.restore();
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
