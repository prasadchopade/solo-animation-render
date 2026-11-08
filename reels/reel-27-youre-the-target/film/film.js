// Reel 27 · You're the Target. Episode 5 of "You're the test subject", after The Only Witness (20), You Are the Only Suspect (23),
// You're the Detective (25) and You're the Judge (26). The whole film is one video call on a phone. A fake officer says you're under
// "digital arrest"; you know it's a scam, so you hunt for his three mistakes. In the corner of the screen, unmentioned from frame 0, is the
// person he's really talking to. Facts and sources: docs/research.md. Our own drawings; nobody real, no real agency's badge or uniform.
// The face rig is from reels 19–26 (tag source/reel-26-youre-the-judge); the characters are this reel's own. 30 fps.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', PAPER = '#fbf7ec', YEL = '#ffd34a', CREAM = '#fff6e2', PINK = '#f0508a';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const win = (t, a, b, f = 0.08) => sstep(a - f, a, t) * (1 - sstep(b, b + f, t));        // 1 inside [a, b], soft edges

  // ------------------------------------------------------------------ canvas helpers
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
  function shakeAt(t, list, amp = 26) {
    let a = 0; for (const t0 of list) if (t >= t0) a = Math.max(a, amp * Math.exp(-(t - t0) * 11));
    if (a < 0.2) return [0, 0];
    const r = mulberry32(Math.round(t * 30) * 7 + 3);
    return [(r() - 0.5) * 2 * a, (r() - 0.5) * 2 * a];
  }
  const flashAt = (t, t0) => { const d = t - t0; return d < 0 ? 0 : Math.exp(-d * 11) * 0.92; };
  function stamp(g, s, x, y, t, t0, color = RED, size = 150, rot = -0.1, bg = 'rgba(255,255,255,0.0)') {
    if (t < t0) return;
    const k = hit(t, t0, 'heavy'), sc = lerp(2.1, 1, clamp(k));
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.globalAlpha = clamp((t - t0) / 0.05);
    g.font = font(size); const w = g.measureText(s).width + 64;
    R(g, -w / 2, -size * 0.74, w, size * 1.0, 14); g.fillStyle = bg; g.fill(); g.strokeStyle = color; g.lineWidth = size * 0.085; g.stroke();
    g.textAlign = 'center'; g.fillStyle = color; g.fillText(s, 0, size * 0.1);
    g.restore();
  }
  const pop = (t, t0) => clamp(hit(t, t0, 'heavy'));
  function title(g, s, y, size, color, t, t0, o = {}) {            // a caption that lands with a small spring
    if (t < t0) return;
    const q = pop(t, t0);
    g.save(); g.translate(513, y); g.scale(lerp(0.86, 1, q), lerp(0.86, 1, q));
    txt(g, s, 0, 0, size, color, { align: 'center', fit: o.fit ?? 860, stroke: o.stroke ?? INK, sw: o.sw ?? 0.14, a: clamp((t - t0) * 8) * (o.a ?? 1) });
    g.restore();
  }

  function mouth(g, cy, op, o = {}) {
    const lip = o.lip || '#7d463b';
    if (op < 0.012) {
      const w = o.w0 ?? 44, sm = o.smile || 0, fr = o.frown || 0;
      g.lineCap = 'round'; g.strokeStyle = o.line || '#3c1d18'; g.lineWidth = o.lw0 ?? 6;
      g.beginPath(); g.moveTo(-w, cy - sm * 12 + fr * 6); g.quadraticCurveTo(0, cy + 3 + sm * 13 - fr * 8, w, cy - sm * 12 + fr * 6); g.stroke();
      return;
    }
    const w = lerp(36, 92, sstep(0, 0.35, op)) - 13 * sstep(0.6, 1, op), top = 3 + 70 * Math.pow(op, 1.1), bot = 3 + 128 * Math.pow(op, 1.15);
    const cu = (o.smile || 0) * 18; const shape = () => { g.beginPath(); g.moveTo(-w, cy - cu); g.bezierCurveTo(-w * 0.74, cy - top * 1.33, w * 0.74, cy - top * 1.33, w, cy - cu); g.bezierCurveTo(w * 0.88, cy + bot * 1.3, -w * 0.88, cy + bot * 1.3, -w, cy - cu); g.closePath(); };
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
      ell(g, ix, iy, ir, ir); g.fillStyle = rg(g, ix, iy, 2, ir, [0, o.iris2 || '#4f3421'], [1, o.iris || '#26170d']); g.fill();
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
  // the faces. ONE: a young delivery rider, worried brows, a lot of hair. TWO: neat, a thin moustache, and the mole the thief had in reel 20.
  function sweat(g, t, k) {                         // beads at the temples; one runs down every so often
    if (k <= 0) return;
    g.save(); g.globalAlpha *= k;
    const bead = (x, y, s) => { g.fillStyle = 'rgba(214,236,250,0.9)'; g.beginPath(); g.moveTo(x, y - 18 * s); g.quadraticCurveTo(x + 11 * s, y, x, y + 8 * s); g.quadraticCurveTo(x - 11 * s, y, x, y - 18 * s); g.fill(); g.fillStyle = 'rgba(255,255,255,0.95)'; ell(g, x - 3 * s, y - 2 * s, 2.6 * s, 3.6 * s); g.fill(); };
    bead(-150, -98, 1.15); bead(148, -70, 1.0); bead(-118, -150, 0.8);
    const u = ((t + 0.4) % 1.9) / 1.9; bead(-162, -60 + u * 120, 1.2 * (1 - u * 0.3));
    g.fillStyle = 'rgba(255,255,255,0.16)'; ell(g, -40, -170, 70, 18, -0.1); g.fill();
    g.restore();
  }
  function head(g, L, o = {}) {
    const op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw, drop = 104 * op, chin = 232 + drop, ey = -28, ex = 80;
    if (L.style === 'det') { g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 22, -30); g.bezierCurveTo(-hw - 40, -240, -110, -304, 0, -304); g.bezierCurveTo(110, -304, hw + 40, -240, hw + 22, -30); g.bezierCurveTo(hw + 36, 90, hw + 12, 170, 130, 190); g.lineTo(-130, 190); g.bezierCurveTo(-hw - 12, 170, -hw - 36, 90, -hw - 22, -30); g.closePath(); g.fill(); }
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
    g.restore();
    const my = 118 + drop * 0.2;
    mouth(g, my, op, { lip: L.lip || '#83503f', line: L.lip ? '#7c2830' : undefined, lw0: L.lip ? 9 : 6, w0: o.w0 ?? 44, frown: o.frown ?? 0, smile: o.smile ?? 0 });
    if (L.must) {
      const big = L.must === 'thick', th = big ? 24 : 13, w = big ? 62 : 52;
      g.fillStyle = L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
    }
    const ny = 44;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 22, ny - 18); g.quadraticCurveTo(k * 31, ny, k * 25, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, k * 13, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5, ny - 8, 10, 15); g.fill();
    if (L.mole) { const mr = L.moleR ?? 9.5; g.fillStyle = '#2a1710'; ell(g, L.mole[0], L.mole[1], mr, mr * 0.95); g.fill(); }
    const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look, lidW: L.lidW };
    eye(g, -1, -ex, ey, close, eo); eye(g, 1, ex, ey, close, eo);
    g.strokeStyle = L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt + (o.worry || 0);
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (ex - 48), ey - 40 + tilt + by0); g.quadraticCurveTo(k * (ex + 6), ey - 60 + by0, k * (ex + 54), ey - 40 - tilt * 0.3 + by0 * 0.4); g.stroke(); }
    g.fillStyle = L.hair;
    const hh = hw + 6;
    if (L.style === 'det') {
      g.beginPath(); g.moveTo(-hh, -30); g.bezierCurveTo(-hh - 8, -230, -90, -300, 0, -292); g.bezierCurveTo(90, -300, hh + 8, -230, hh, -30); g.bezierCurveTo(hh - 14, -110, 120, -180, 0, -206); g.bezierCurveTo(-120, -180, -hh + 14, -110, -hh, -30); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(214,206,190,0.75)'; g.lineWidth = 6; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 40, -212); g.quadraticCurveTo(k * 130, -186, k * (hh - 10), -80); g.stroke(); }
      g.fillStyle = L.hair;
    } else if (L.style === 'side') { g.beginPath(); g.moveTo(-hh, -38); g.bezierCurveTo(-hh - 10, -250, -80, -300, 16, -292); g.bezierCurveTo(140, -292, hh + 16, -220, hh, -38); g.bezierCurveTo(hh - 18, -112, 150, -158, 96, -176); g.bezierCurveTo(30, -196, -44, -176, -96, -192); g.bezierCurveTo(-140, -160, -hh + 22, -110, -hh, -38); g.fill(); }
    else if (L.style === 'buzz') { g.globalAlpha = 0.82; g.beginPath(); g.moveTo(-hh + 6, -70); g.bezierCurveTo(-hh, -250, -80, -278, 0, -278); g.bezierCurveTo(80, -278, hh, -250, hh - 6, -70); g.bezierCurveTo(hh - 30, -150, 120, -190, 0, -196); g.bezierCurveTo(-120, -190, -hh + 30, -150, -hh + 6, -70); g.fill(); g.globalAlpha = 1; }
    else if (L.style === 'neat') {
      // short, combed back from a side parting on his right, a sharp edge at the temples
      g.beginPath(); g.moveTo(-hh, -44); g.bezierCurveTo(-hh - 8, -238, -96, -296, 10, -294); g.bezierCurveTo(130, -296, hh + 10, -236, hh, -44);
      g.bezierCurveTo(hh - 12, -118, 156, -170, 120, -196); g.bezierCurveTo(70, -214, 10, -208, -58, -214); g.lineTo(-64, -196); g.bezierCurveTo(-120, -188, -hh + 18, -126, -hh, -44); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 5; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-40 + i * 34, -262 + i * 4); g.quadraticCurveTo(40 + i * 30, -250, 110 + i * 14, -214 + i * 6); g.stroke(); }
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-60, -212); g.quadraticCurveTo(-74, -256, -66, -286); g.stroke();
    } else if (L.style === 'messy') {
      // a lot of it, falling over the brow, a few tufts standing up
      g.beginPath(); g.moveTo(-hh, -40);
      g.bezierCurveTo(-hh - 22, -170, -hh + 10, -270, -70, -300); g.bezierCurveTo(-40, -334, 30, -330, 60, -306); g.bezierCurveTo(110, -326, 170, -290, 168, -244);
      g.bezierCurveTo(hh + 18, -210, hh + 20, -120, hh, -40); g.bezierCurveTo(hh - 16, -110, 150, -150, 120, -168);
      g.bezierCurveTo(96, -138, 60, -150, 40, -176); g.bezierCurveTo(10, -140, -30, -150, -50, -178); g.bezierCurveTo(-80, -144, -120, -150, -136, -170); g.bezierCurveTo(-150, -130, -hh + 14, -100, -hh, -40); g.closePath(); g.fill();
      g.strokeStyle = L.hair; g.lineWidth = 12; g.lineCap = 'round';
      for (const [x0, y0, x1, y1] of [[-20, -300, -8, -346], [36, -306, 58, -344], [-70, -292, -96, -326]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 8, (y0 + y1) / 2, x1, y1); g.stroke(); }
    } else if (L.style === 'cap') {
      g.beginPath(); g.moveTo(-hh, -36); g.lineTo(-hh + 4, -130); g.lineTo(-hh + 36, -130); g.lineTo(-hh + 24, -46); g.closePath(); g.moveTo(hh, -36); g.lineTo(hh - 4, -130); g.lineTo(hh - 36, -130); g.lineTo(hh - 24, -46); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,10,6,0.32)'; g.beginPath(); g.moveTo(-hw + 8, -108); g.quadraticCurveTo(0, -60, hw - 8, -108); g.lineTo(hw - 8, -140); g.lineTo(-hw + 8, -140); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-hh - 2, -122); g.bezierCurveTo(-hh - 8, -280, -90, -318, 0, -318); g.bezierCurveTo(90, -318, hh + 8, -280, hh + 2, -122); g.quadraticCurveTo(0, -158, -hh - 2, -122); g.closePath(); g.fillStyle = lg(g, -hh, -318, hh, -120, [0, '#8e2433'], [1, '#5c1520']); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -318); g.quadraticCurveTo(-12, -220, 0, -150); g.stroke();
      g.beginPath(); g.moveTo(-hh + 6, -128); g.quadraticCurveTo(0, -170, hh - 6, -128); g.quadraticCurveTo(hh + 6, -108, hh - 40, -92); g.quadraticCurveTo(0, -116, -hh + 40, -92); g.quadraticCurveTo(-hh - 6, -108, -hh + 6, -128); g.closePath(); g.fillStyle = '#4a111b'; g.fill();
    }
    if (L.bindi) { ell(g, 0, -100, 10, 10); g.fillStyle = '#9a1f2c'; g.fill(); }
    if (L.ear) { for (const k of [-1, 1]) { ell(g, k * (hw + 2), 26, 11, 11); g.fillStyle = '#e4bd55'; g.fill(); } }
    if (L.specs) {
      g.strokeStyle = '#2a2320'; g.lineWidth = 7;
      for (const k of [-1, 1]) { g.fillStyle = 'rgba(255,255,255,0.08)'; R(g, k * ex - 66, ey - 46, 132, 92, 34); g.fill(); g.stroke(); }
      g.beginPath(); g.moveTo(-ex + 66, ey - 8); g.quadraticCurveTo(0, ey - 22, ex - 66, ey - 8); g.moveTo(-ex - 66, ey - 10); g.lineTo(-hw, ey - 16); g.moveTo(ex + 66, ey - 10); g.lineTo(hw, ey - 16); g.stroke();
    }
    if (o.sweat) sweat(g, o.t || 0, o.sweat);
  }

  // ================================================================ this reel
  const CX = 513;
  const ease = (x) => { const u = clamp(x); return u * u * (3 - 2 * u); };
  const blinkAt = (t, p = 3.3, off = 1.1) => (((t + off) % p) < 0.11 ? 1 : 0);        // never on frame 0
  function ringAt(g, x, y, rx, ry, p, c = RED, lw = 9) {        // a hand-drawn ring: red ink
    if (p <= 0) return;
    g.save(); g.strokeStyle = c; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    const N = 70, a0 = -2.2;
    for (let i = 0; i <= Math.round(N * clamp(p)); i++) { const a = a0 + TAU * 1.07 * (i / N), w = 1 + 0.04 * Math.sin(a * 3 + 1.2), X = x + Math.cos(a) * rx * w, Y = y + Math.sin(a) * ry * w; if (!i) g.moveTo(X, Y); else g.lineTo(X, Y); }
    g.stroke(); g.restore();
  }
  function star(g, x, y, r, c = '#e0b94f') {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.44 : r; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); }
    g.closePath(); g.fillStyle = c; g.fill();
  }

  // ------------------------------------------------------------------ the office: bright, tidy, and his
  let OFFICE = null, ROOM = null;
  function makeOffice() {
    const c = offscreen(W, H), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#d7f3e8'], [0.55, '#b8e6d6'], [1, '#93d3bf']); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(30,90,80,0.10)'; g.fillRect(0, 852, W, 6);
    // a wooden plaque, spelled right
    g.fillStyle = lg(g, 0, 400, 0, 500, [0, '#8e5d36'], [1, '#6c4427']); R(g, 50, 408, 164, 100, 10); g.fill();
    g.strokeStyle = '#e9c46a'; g.lineWidth = 3; R(g, 58, 416, 148, 84, 7); g.stroke();
    txt(g, 'CYBER', 132, 452, 36, '#f6e6b7', { align: 'center' }); txt(g, 'CELL', 132, 490, 36, '#f6e6b7', { align: 'center' });
    // a rack of files, tied with red tape
    const file = ['#e8b64c', '#d9694a', '#5a93c8', '#e8b64c', '#7fb069', '#d9694a'];
    R(g, 54, 720, 214, 12, 3); g.fillStyle = '#7a5433'; g.fill();
    file.forEach((col, i) => { g.fillStyle = col; R(g, 62 + i * 33, 594 + (i * 7) % 16, 30, 126 - (i * 7) % 16, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(68 + i * 33, 612 + (i * 7) % 16, 18, 24); });
    // a calendar under the self-view
    g.fillStyle = '#fffdf6'; R(g, 746, 684, 190, 214, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#d9694a'; g.fillRect(746, 684, 190, 46);
    txt(g, 'NOVEMBER', 841, 720, 32, '#fff', { align: 'center' });
    g.fillStyle = 'rgba(40,40,40,0.55)';
    for (let r = 0; r < 5; r++) for (let q = 0; q < 7; q++) if (r * 7 + q < 30) { g.beginPath(); g.arc(765 + q * 25.5, 756 + r * 28, 5.2, 0, TAU); g.fill(); }
    return c;
  }
  const OFF = { skin: '#b9855c', skinD: '#8d5c3b', skinH: '#d8a880', hair: '#17110d', style: 'none', must: 'thick', stub: 0.42, brow: 20, browTilt: 11, jaw: 1.05, ew: 44, eh: 21 };
  const OX = 438, OY = 626, OS = 0.96, ONY = 882;
  function officerCap(g, L) {
    const hw = 186 * L.jaw + 8;
    g.beginPath(); g.moveTo(-hw - 8, -148); g.bezierCurveTo(-hw - 74, -276, -176, -352, 0, -352); g.bezierCurveTo(176, -352, hw + 74, -276, hw + 8, -148); g.closePath();
    g.fillStyle = lg(g, 0, -352, 0, -148, [0, '#33477c'], [1, '#1d2a4e']); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.08)'; ell(g, -70, -292, 96, 26, -0.16); g.fill();
    R(g, -hw - 2, -190, 2 * hw + 4, 54, 8); g.fillStyle = '#131b33'; g.fill();
    g.fillStyle = '#e0b94f'; R(g, -hw - 2, -163, 2 * hw + 4, 8, 3); g.fill();
    g.beginPath(); g.moveTo(-hw + 6, -138); g.quadraticCurveTo(0, -188, hw - 6, -138); g.quadraticCurveTo(hw - 2, -92, hw - 60, -94); g.quadraticCurveTo(0, -128, -hw + 60, -94); g.quadraticCurveTo(-hw + 2, -92, -hw + 6, -138); g.closePath();
    g.fillStyle = lg(g, 0, -180, 0, -92, [0, '#0d1220'], [1, '#2d3858']); g.fill();
    ell(g, 0, -248, 48, 48); g.fillStyle = '#131b33'; g.fill(); g.strokeStyle = '#e0b94f'; g.lineWidth = 5; g.stroke(); star(g, 0, -248, 32);
  }
  function officerBody(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -84, -90, 84, 50, [0, OFF.skinH], [1, OFF.skinD]); R(g, -84, -96, 168, 184, 48); g.fill();
    const body = () => { g.beginPath(); g.moveTo(-560, 1200); g.lineTo(-540, 240); g.bezierCurveTo(-500, 126, -300, 84, -112, 26); g.lineTo(112, 26); g.bezierCurveTo(300, 84, 500, 126, 540, 240); g.lineTo(560, 1200); g.closePath(); };
    body(); g.fillStyle = lg(g, -520, 40, 520, 1040, [0, '#e7cf9b'], [0.5, '#d4b880'], [1, '#ad905c']); g.fill();
    g.fillStyle = 'rgba(95,70,30,0.16)'; g.fillRect(-28, 130, 56, 1000);
    for (let i = 0; i < 6; i++) { ell(g, 0, 170 + i * 130, 11, 11); g.fillStyle = '#7d6236'; g.fill(); }
    for (const k of [-1, 1]) {
      g.fillStyle = '#c9ab70'; g.beginPath(); g.moveTo(k * 118, 2); g.lineTo(k * 6, 124); g.lineTo(k * 96, 182); g.lineTo(k * 184, 58); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(70,48,18,0.42)'; g.lineWidth = 4; g.lineJoin = 'round'; g.stroke();
      g.save(); g.translate(k * 372, 96); g.rotate(k * 0.26); g.fillStyle = '#1d2a4e'; R(g, -106, -30, 212, 60, 12); g.fill();
      for (let i = -1; i <= 1; i++) star(g, i * 58, 0, 19); g.restore();
    }
    // a pocket and a made-up crest on one side, the name plate on the other
    g.strokeStyle = 'rgba(70,48,18,0.38)'; g.lineWidth = 4; R(g, -318, 232, 220, 206, 10); g.stroke(); g.fillStyle = 'rgba(70,48,18,0.13)'; g.fillRect(-318, 232, 220, 46);
    ell(g, -208, 150, 44, 44); g.fillStyle = '#1d2a4e'; g.fill(); g.strokeStyle = '#e0b94f'; g.lineWidth = 5; g.stroke(); star(g, -208, 150, 28);
    g.save(); g.translate(205, 96);
    R(g, -152, -60, 304, 122, 12); g.fillStyle = 'rgba(40,30,10,0.35)'; g.fill();
    R(g, -152, -66, 304, 122, 12); g.fillStyle = lg(g, 0, -66, 0, 56, [0, '#f5f1e4'], [1, '#c8c2ae']); g.fill(); g.strokeStyle = '#7d7767'; g.lineWidth = 4; g.stroke();
    txt(g, 'CYBER', 0, -28, 32, '#3d3a30', { align: 'center', ls: 6 });
    txt(g, 'POILCE', 0, 42, 78, INK, { align: 'center', fit: 270 });
    g.restore();
    g.restore();
  }
  // ------------------------------------------------------------------ the clock of the film: every event comes from the narration's words
  const at = (p) => words(p)[0].t0;
  const wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;
  const en = (p) => { const w = words(p); return w[w.length - 1].t1; };
  let T = null;
  function times() {
    if (T) return T;
    T = {
      o03: at('o03'), o04: wi('o03', 4), o04e: en('o03'), o05: at('o05'), frozen: wi('o05', 4), o05e: en('o05'), o06: at('o06'), o06e: en('o06'), o08: at('o08'), o08e: en('o08'), o09: at('o09'), o09e: en('o09'),
      n01: at('n01'), n01e: en('n01'), n02: at('n02'), three: wi('n02', 3), n02e: en('n02'),
      n03: at('n03'), n03e: en('n03'), n04: at('n04'), spell: wi('n04', 5), n04e: en('n04'), n05: at('n05'), noSuch: wi('n05', 7), n05e: en('n05'), n06: at('n06'), n06e: en('n06'),
      n07: at('n07'), n07e: en('n07'), n08: at('n08'), n08e: en('n08'), n09: at('n09'), n09e: en('n09'), n10: at('n10'), n10b: wi('n10', 6), n10e: en('n10'), n11: at('n11'), n11e: en('n11'),
      n12: at('n12'), n12e: en('n12'), n13: at('n13'), n13e: en('n13'), o10: at('o10'), o10e: en('o10'), m01: at('m01'), m01e: en('m01'), m02: at('m02'), m02e: en('m02'),
      n14: at('n14'), n14e: en('n14'), n16: at('n16'), n16e: en('n16'), n17: at('n17'), n17e: en('n17'), n18: at('n18'), n18e: en('n18'), n19: at('n19'), n19e: en('n19'), end: tb('end'),
    };
    // the same formulas are in cues.py and score.py
    T.pollEnd = T.n01e + 1.15;
    T.barEnd = T.o08e + 0.05;
    T.whistle = T.o04e + 0.18;
    T.knock = T.o08e + 0.72;
    T.swap = T.n07 - 0.18;
    T.whistle2 = T.n11e + 0.35;                   // the cooker first, as in the first half; then you come to her door
    T.knock2 = T.whistle2 + 1.25;
    T.leave = T.m02e + 0.25;
    T.bang0 = T.o06e + 0.05; T.bangD = 0.8; T.bangE = T.bang0 + 4 * T.bangD;
    T.R0 = T.n09 - 0.72; T.R1 = T.R0 + 0.7; T.R2 = T.R1 + 2.7;
    return T;
  }
  function talkP(t, pid) {                         // a mouth for one phrase only
    for (const w of words(pid)) {
      if (t >= w.t0 && t <= w.t1) {
        const syl = Math.max(1, (w.w.toLowerCase().match(/[aeiouy]+/g) || []).length), u = (t - w.t0) / Math.max(0.05, w.t1 - w.t0);
        const v = 0.6 + 0.4 * Math.abs(Math.sin(w.t0 * 37.1));
        return (0.05 + 0.3 * v * Math.pow(Math.abs(Math.sin(Math.PI * u * syl)), 0.8));
      }
    }
    return 0;
  }
  const OLINES = ['o01', 'o02', 'o03', 'o04', 'o05', 'o06', 'o07', 'o08', 'o09', 'o10'];
  const talkO = (t) => OLINES.reduce((v, p) => Math.max(v, talkP(t, p)), 0);
  // ---- what he holds up: the decoys
  function fist(g, x, y) {
    g.fillStyle = lg(g, x - 70, y, x + 70, y + 300, [0, '#e0c58f'], [1, '#b69a63']); R(g, x - 72, y + 42, 144, 1300, 30); g.fill(); g.strokeStyle = 'rgba(70,48,18,0.3)'; g.lineWidth = 4; g.stroke();
    ell(g, x, y + 8, 68, 60); g.fillStyle = lg(g, x - 60, y - 40, x + 60, y + 50, [0, OFF.skinH], [1, OFF.skin]); g.fill();
    g.strokeStyle = OFF.skinD; g.lineWidth = 4.5; g.lineCap = 'round'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * 24 - 6, y - 42); g.lineTo(x + i * 24 - 6, y - 8); g.stroke(); }
  }
  function parcel(g, x, y) {
    g.save(); g.translate(x, y); g.rotate(-0.06);
    R(g, -150, -112, 300, 214, 10); g.fillStyle = lg(g, 0, -112, 0, 102, [0, '#cfa26c'], [1, '#a97d4c']); g.fill();
    g.fillStyle = '#e7d6b0'; g.fillRect(-22, -112, 44, 214); g.fillRect(-150, -18, 300, 40);
    g.save(); g.rotate(0.05); R(g, -112, -82, 154, 62, 6); g.fillStyle = '#fffdf4'; g.fill(); g.restore();
    for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(40,40,40,0.65)'; g.fillRect(-96, -68 + i * 15, [120, 90, 104][i], 5); }
    g.restore();
  }
  function passports(g, x, y, k) {
    g.save(); g.translate(x, y + 70);
    for (let i = 0; i < 5; i++) {
      g.save(); g.rotate(lerp(0, (i - 2) * 0.27, k)); g.translate(0, -120);
      R(g, -62, -86, 124, 172, 10); g.fillStyle = lg(g, 0, -86, 0, 86, [0, '#27477a'], [1, '#17305a']); g.fill(); g.strokeStyle = '#0d1c38'; g.lineWidth = 3; g.stroke();
      ell(g, 0, -14, 26, 26); g.strokeStyle = '#e0b94f'; g.lineWidth = 4; g.stroke();
      g.fillStyle = '#e0b94f'; g.fillRect(-36, 34, 72, 7); g.fillRect(-24, 49, 48, 6);
      g.restore();
    }
    g.restore();
  }
  function frozenBook(g, x, y, t, t0) {
    g.save(); g.translate(x, y); g.rotate(-0.08);
    R(g, -150, -96, 300, 192, 12); g.fillStyle = lg(g, 0, -96, 0, 96, [0, '#4f86bf'], [1, '#376a9f']); g.fill();
    txt(g, 'PENSION', 0, -22, 62, '#f7f3e6', { align: 'center' }); txt(g, 'ACCOUNT', 0, 34, 44, '#d9e6f2', { align: 'center' });
    g.restore();
    stamp(g, 'FROZEN', x, y + 10, t, t0, RED, 76, -0.16, 'rgba(255,250,240,0.95)');
  }
  function warrant(g, x, y) {                      // a page of very small print, for anyone hunting mistakes
    g.save(); g.translate(x, y); g.rotate(-0.05);
    R(g, -190, -244, 380, 470, 6); g.fillStyle = '#fffdf3'; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.stroke();
    txt(g, 'WARRANT', 0, -186, 66, INK, { align: 'center', fit: 330 });
    const r = mulberry32(27);
    for (let i = 0; i < 25; i++) { const w = 250 + r() * 86; g.fillStyle = 'rgba(30,30,30,0.5)'; g.fillRect(-165, -152 + i * 12.6, w, 4.2); }
    ell(g, 110, 176, 44, 44); g.strokeStyle = 'rgba(190,30,30,0.75)'; g.lineWidth = 6; g.stroke(); ell(g, 110, 176, 30, 30); g.lineWidth = 3; g.stroke();
    g.strokeStyle = '#1b2f6a'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-150, 186); g.bezierCurveTo(-120, 130, -90, 216, -60, 170); g.bezierCurveTo(-40, 146, -20, 200, 10, 176); g.stroke();
    g.restore();
  }
  function heldProps(g, t, TT) {
    const k = (a, b, f = 0.2) => ease((t - a) / f) * (1 - ease((t - b) / f));
    const hold = k(TT.o03 - 0.08, TT.o06 - 0.08);
    const war = k(TT.o06 - 0.06, TT.knock - 0.15);
    const X = 182, Y0 = 905;
    if (hold > 0.003) {
      const y = Y0 + (1 - hold) * 700;
      if (t < TT.frozen - 0.12) { if (t < TT.o04 - 0.04) parcel(g, X, y); else passports(g, X, y - 34, ease((t - TT.o04 + 0.04) / 0.32)); }
      else frozenBook(g, X, y - 12, t, TT.frozen);
      fist(g, X, y + 96);
    }
    if (war > 0.003) { const y = 868 + (1 - war) * 800; warrant(g, 208, y); fist(g, 208, y + 232); }
  }
  function office(g, t, o = {}) {
    const TT = times();
    if (!OFFICE) OFFICE = makeOffice();
    g.drawImage(OFFICE, 0, 0);
    const knockK = win(t, TT.knock - 0.02, TT.o09 - 0.02, 0.05), flick = win(t, TT.whistle + 0.02, TT.whistle + 0.75, 0.07);
    let op = talkO(t);
    const bob = Math.sin(t * 1.9) * 3 + op * 9;
    if (t > TT.swap + 0.3 && t < TT.o10 - 0.1 && !op) op = (Math.sin(t * 2.3) > -0.65 ? 1 : 0) * (0.06 + 0.2 * Math.abs(Math.sin(t * 8.7)));   // still talking after the swap, with no sound
    const look = flick > 0.01 ? [lerp(0, 8, flick), lerp(2, 10, flick)] : knockK > 0.01 ? [lerp(0, -15, knockK), 2] : [0, 2];
    officerBody(g, OX, ONY, OS);
    g.save(); g.translate(OX + (o.lean || 0) * 8, OY + bob); g.scale(OS, OS);
    head(g, OFF, { op, close: blinkAt(t, 3.7, 1.3), look, frown: 0.8, browY: knockK * -9 });
    officerCap(g, OFF);
    g.restore();
    heldProps(g, t, TT);
    if (o.redInk > 0) ringAt(g, 635, 974, 208, 106, o.redInk, RED, 15);
  }

  // ------------------------------------------------------------------ her room: a tube light, a shut door, thirty years of certificates
  function makeRoom() {
    const c = offscreen(W, H), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#f6dfa9'], [0.7, '#eccb8d'], [1, '#d9b171']); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(120,70,20,0.14)'; g.fillRect(0, 1120, W, 10);
    g.fillStyle = lg(g, 0, 1120, 0, 1300, [0, '#d2b294'], [1, '#b39474']); g.fillRect(0, 1130, W, 800);
    // a tube light
    g.fillStyle = rg(g, 500, 236, 20, 520, [0, 'rgba(255,255,240,0.75)'], [1, 'rgba(255,255,240,0)']); g.fillRect(0, 0, W, 800);
    R(g, 246, 224, 510, 24, 12); g.fillStyle = '#fffff2'; g.fill(); g.strokeStyle = '#bda67a'; g.lineWidth = 4; g.stroke();
    // a certificate
    R(g, 22, 470, 176, 216, 6); g.fillStyle = '#7a4f2c'; g.fill(); R(g, 36, 484, 148, 188, 3); g.fillStyle = '#fff9e6'; g.fill();
    txt(g, 'BEST', 110, 542, 44, '#2f2a20', { align: 'center' }); txt(g, 'TEACHER', 110, 588, 44, '#2f2a20', { align: 'center', fit: 130 });
    star(g, 110, 636, 26, '#d9a31e');
    // the door, shut, a bolt across it
    const dx = 776, dw = 262, dy = 344, dh = 776;
    g.fillStyle = '#6f4528'; g.fillRect(dx - 20, dy - 20, dw + 40, dh + 20);
    g.fillStyle = lg(g, dx, dy, dx + dw, dy + dh, [0, '#a4693d'], [1, '#7b4a29']); g.fillRect(dx, dy, dw, dh);
    g.strokeStyle = 'rgba(40,20,5,0.34)'; g.lineWidth = 6; R(g, dx + 34, dy + 48, dw - 68, 300, 8); g.stroke(); R(g, dx + 34, dy + 410, dw - 68, 320, 8); g.stroke();
    g.fillStyle = '#d3cdbb'; R(g, dx + 8, dy + 370, 104, 16, 5); g.fill(); ell(g, dx + 96, dy + 378, 15, 15); g.fill();
    return c;
  }
  const MOM = { skin: '#b07c56', skinD: '#855536', skinH: '#cf9d76', hair: '#cbc6bc', style: 'none', must: null, stub: 0, brow: 9, browTilt: -10, jaw: 0.94, ew: 41, eh: 24, lip: '#8d5049' };
  const MX = 430, MY = 690, MS = 1.08;
  function momHairBack(g, L) {
    const hh = 186 * L.jaw;
    g.fillStyle = '#b2ada3'; g.beginPath(); g.moveTo(-hh - 12, 20); g.bezierCurveTo(-hh - 40, -220, -110, -300, 0, -300); g.bezierCurveTo(110, -300, hh + 40, -220, hh + 12, 20); g.closePath(); g.fill();
  }
  function momFront(g, L, o = {}) {
    const hh = 186 * L.jaw + 7, ey = -28, ex = 80;
    // the hair: a centre parting, combed back flat
    g.fillStyle = L.hair;
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(0, -292); g.bezierCurveTo(k * 110, -300, k * (hh + 10), -220, k * hh, -46); g.bezierCurveTo(k * (hh - 22), -130, k * 150, -196, 0, -214); g.closePath(); g.fill(); }
    g.strokeStyle = 'rgba(120,112,100,0.5)'; g.lineWidth = 3.5; g.lineCap = 'round';
    for (const k of [-1, 1]) for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(k * 8, -282 + i * 18); g.bezierCurveTo(k * 110, -282 + i * 15, k * (hh - 30 + i * 3), -210 + i * 12, k * (hh - 6 - i * 9), -92 + i * 12); g.stroke(); }
    g.strokeStyle = 'rgba(95,60,40,0.75)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -292); g.lineTo(0, -216); g.stroke();
    // the years
    g.strokeStyle = 'rgba(95,55,32,0.42)'; g.lineWidth = 4; g.lineCap = 'round';
    for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(-96 + i * 16, -128 + i * 22); g.quadraticCurveTo(0, -142 + i * 22, 96 - i * 16, -128 + i * 22); g.stroke(); }
    for (const k of [-1, 1]) {
      g.beginPath(); g.moveTo(k * 44, 58); g.quadraticCurveTo(k * 78, 92, k * 72, 136); g.stroke();
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(k * (ex + 62), ey + 2 + i * 12); g.lineTo(k * (ex + 90), ey - 7 + i * 19); g.stroke(); }
      g.beginPath(); g.moveTo(k * 46, 148); g.quadraticCurveTo(k * 60, 158, k * 62, 172); g.stroke();
      // the tired, red rims under the eyes
      g.save(); g.strokeStyle = `rgba(170,60,50,${0.34 + 0.4 * (o.tired || 0)})`; g.lineWidth = 5; g.beginPath(); g.moveTo(k * (ex - 40), ey + 29); g.quadraticCurveTo(k * ex, ey + 44, k * (ex + 42), ey + 27); g.stroke(); g.restore();
    }
    ell(g, 0, -100, 8.5, 8.5); g.fillStyle = '#9a1f2c'; g.fill();
    for (const k of [-1, 1]) { ell(g, k * (186 * L.jaw + 2), 28, 10, 10); g.fillStyle = '#e4bd55'; g.fill(); }
    // round glasses on a chain: a teacher's
    g.strokeStyle = '#a5823f'; g.lineWidth = 7;
    for (const k of [-1, 1]) { ell(g, k * ex, ey, 67, 64); g.fillStyle = 'rgba(255,255,255,0.09)'; g.fill(); g.stroke(); g.save(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 7; g.beginPath(); g.arc(k * ex - 8, ey - 8, 46, -2.5, -1.75); g.stroke(); g.restore(); }
    g.beginPath(); g.moveTo(-ex + 66, ey - 8); g.quadraticCurveTo(0, ey - 26, ex - 66, ey - 8); g.moveTo(-ex - 66, ey - 12); g.lineTo(-186 * L.jaw, ey - 18); g.moveTo(ex + 66, ey - 12); g.lineTo(186 * L.jaw, ey - 18); g.stroke();
  }
  function momBody(g) {                            // her blouse and sari, in room coordinates; the arms come after
    const sx = MX, sy = 1000;
    g.save(); g.translate(0, -56);
    g.fillStyle = lg(g, sx - 90, sy - 40, sx + 90, sy + 40, [0, MOM.skinH], [1, MOM.skinD]); R(g, sx - 74, sy - 90, 148, 150, 42); g.fill();
    g.beginPath(); g.moveTo(sx - 340, 1420); g.lineTo(sx - 310, 1150); g.bezierCurveTo(sx - 290, 1070, sx - 170, 1050, sx - 76, 1014); g.quadraticCurveTo(sx, 1090, sx + 76, 1014); g.bezierCurveTo(sx + 170, 1050, sx + 290, 1070, sx + 310, 1150); g.lineTo(sx + 340, 1420); g.closePath();
    g.fillStyle = lg(g, sx - 300, 1000, sx + 300, 1400, [0, '#a33b4d'], [1, '#7e2a3c']); g.fill();
    // the pallu, over one shoulder
    g.beginPath(); g.moveTo(sx + 176, 1044); g.bezierCurveTo(sx + 110, 1130, sx - 30, 1290, sx - 150, 1420); g.lineTo(sx + 170, 1420); g.bezierCurveTo(sx + 210, 1300, sx + 250, 1160, sx + 250, 1068); g.closePath();
    g.fillStyle = lg(g, sx, 1044, sx + 200, 1420, [0, '#3f8f8b'], [1, '#2d6e6c']); g.fill();
    g.strokeStyle = '#e0b94f'; g.lineWidth = 12; g.beginPath(); g.moveTo(sx + 176, 1044); g.bezierCurveTo(sx + 110, 1130, sx - 30, 1290, sx - 150, 1420); g.stroke();
    g.restore();
  }
  function bangleSet(g, x, y, n, rot = -0.2) {      // n gold bangles round a wrist, seen from the side
    g.save(); g.translate(x, y); g.rotate(rot);
    for (let i = 0; i < n; i++) { ell(g, -18 + i * 13, 0, 8, 46); g.strokeStyle = i % 2 ? '#f2cf62' : '#d8a92e'; g.lineWidth = 8; g.stroke(); }
    g.restore();
  }
  function bangleStack(g, x, y, n) {                // on the table, a neat stack
    for (let i = 0; i < n; i++) { ell(g, x, y - i * 11, 54, 17); g.strokeStyle = i % 2 ? '#f2cf62' : '#d8a92e'; g.lineWidth = 9; g.stroke(); }
  }
  function forearm(g, x0, y0, x1, y1, w, flip) {
    g.save(); g.lineCap = 'round'; g.strokeStyle = lg(g, x0, y0 - 30, x1, y1 + 30, [0, MOM.skinH], [1, MOM.skin]); g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore();
  }
  function hand(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = MOM.skin; g.strokeStyle = MOM.skin; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { g.lineWidth = 19; g.beginPath(); g.moveTo(34, -30 + i * 20); g.lineTo(82 + (i === 3 ? -12 : 0), -36 + i * 21); g.stroke(); }
    ell(g, 16, 0, 42, 46); g.fill();
    g.lineWidth = 20; g.beginPath(); g.moveTo(-6, -32); g.lineTo(30, -66); g.stroke();
    g.restore();
  }
  function table(g) {                              // the near edge of the table
    g.fillStyle = lg(g, 0, 1230, 0, 1920, [0, '#b8895a'], [1, '#8d6039']); g.fillRect(0, 1236, W, 700);
    g.fillStyle = 'rgba(255,240,210,0.35)'; g.fillRect(0, 1236, W, 6);
  }
  function thali(g, x, y, sc = 1) {                 // a steel plate of food, another plate over it: left at the door, not touched
    g.save(); g.translate(x, y); g.scale(sc, sc); g.translate(-x, -y);
    ell(g, x + 4, y + 26, 128, 32); g.fillStyle = 'rgba(60,40,20,0.3)'; g.fill();
    ell(g, x, y + 8, 124, 36); g.fillStyle = lg(g, x - 120, y, x + 120, y + 20, [0, '#e9ecef'], [0.5, '#b7bcc2'], [1, '#dfe3e6']); g.fill();
    ell(g, x, y - 14, 112, 34); g.fillStyle = lg(g, x - 110, y - 30, x + 110, y, [0, '#f4f6f7'], [0.45, '#c2c7cc'], [1, '#e7ebed']); g.fill();
    ell(g, x, y - 18, 72, 18); g.strokeStyle = 'rgba(120,125,130,0.55)'; g.lineWidth = 3; g.stroke();
    g.restore();
  }
  // the bangles, one by one, worked over the knuckle. s: the story's clock (it runs backwards for one line)
  function armsAndBangles(g, s, TT, fileK) {
    const R0 = [MX - 76, 1298], Wr = [MX + 158, 1256], Kn = [MX + 92, 1290], St = [MX + 322, 1304];
    let n = 4, m = 0, carried = null, RH = R0, phaseRot = 0.15;
    const { bang0, bangD, bangE } = TT;
    const lerp2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
    if (s >= bang0 && s < bangE) {
      const q = (s - bang0) / bangD, i = Math.min(3, Math.floor(q)), p = q - i, from = i ? St : R0;
      n = 4 - i - (p >= 0.24 ? 1 : 0); m = i + (p >= 0.84 ? 1 : 0);
      if (p < 0.24) RH = lerp2(from, Wr, ease(p / 0.24));
      else if (p < 0.6) { const u = (p - 0.24) / 0.36, wig = Math.sin(u * 22) * (1 - u) * 11; RH = lerp2(Wr, Kn, ease(u)); RH = [RH[0] + wig * 0.6, RH[1] + wig]; carried = { x: RH[0] + 8, y: RH[1] - 8, rot: 0.4 + wig * 0.05 }; }
      else if (p < 0.84) { RH = lerp2(Kn, St, ease((p - 0.6) / 0.24)); carried = { x: RH[0] + 8, y: RH[1] - 8, rot: 0.4 }; }
      else RH = St;
    } else if (s >= bangE) { n = 0; m = 4; RH = lerp2(St, R0, ease((s - bangE) / 0.55)); }
    bangleStack(g, St[0] + 8, 1320, m);
    if (fileK > 0.5) return { n, m };
    forearm(g, MX + 258, 1232, MX + 96, 1290, 84); hand(g, MX + 76, 1298, 0.9, Math.PI - 0.15);
    bangleSet(g, MX + 156, 1262, n, 0.38);
    forearm(g, MX - 258, 1232, RH[0] - 20, RH[1] - 8, 84); hand(g, RH[0], RH[1], 0.9, 0.15);
    if (carried) { g.save(); g.translate(carried.x, carried.y); g.rotate(carried.rot); ell(g, 0, 0, 44, 26); g.strokeStyle = '#f2cf62'; g.lineWidth = 9; g.stroke(); g.restore(); }
    return { n, m };
  }
  function fileHeld(g, k) {                        // everything in order: thirty years of keeping records
    const y = lerp(1460, 1092, ease(k)), x = MX;
    g.save(); g.translate(x, y); g.rotate(-0.03);
    R(g, -210, -168, 420, 322, 10); g.fillStyle = lg(g, 0, -168, 0, 154, [0, '#bcd6ea'], [1, '#9dc0dc']); g.fill(); g.strokeStyle = '#6f93b0'; g.lineWidth = 4; g.stroke();
    R(g, -130, -130, 260, 66, 6); g.fillStyle = '#fffdf3'; g.fill(); txt(g, 'ALL PAPERS', 0, -80, 50, '#23303a', { align: 'center', fit: 236 });
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(30,50,70,0.4)'; g.fillRect(-170, -40 + i * 28, [320, 260, 300, 240, 310, 200][i], 6); }
    g.restore();
    for (const k2 of [-1, 1]) hand(g, x + k2 * 212, y + 46, 0.95, k2 < 0 ? -0.5 : Math.PI + 0.5);
  }
  function doorStrip(g, t, TT, o) {               // the light under her door, and whoever is standing in it
    const x0 = 776, x1 = 1038, y0 = 1112;
    g.fillStyle = '#ffe9b0'; g.fillRect(x0, y0, x1 - x0, 8);
    g.fillStyle = lg(g, 0, y0 + 8, 0, y0 + 80, [0, 'rgba(255,233,176,0.75)'], [1, 'rgba(255,233,176,0)']);
    g.beginPath(); g.moveTo(x0, y0 + 8); g.lineTo(x1, y0 + 8); g.lineTo(x1 + 30, y0 + 80); g.lineTo(x0 - 30, y0 + 80); g.closePath(); g.fill();
    const here = Math.max(win(t, TT.knock - 0.8, TT.knock + 1.5, 0.2), win(t, TT.knock2 - 0.4, TT.leave + 1.4, 0.2));
    if (here < 0.01) return;
    const out = ease((t - TT.leave) / 1.35), dx = out * 320;
    g.save(); g.beginPath(); g.rect(x0, y0 - 2, x1 - x0, 110); g.clip();
    g.globalAlpha = here;
    for (const fx of [862, 952]) { g.fillStyle = 'rgba(30,18,10,0.92)'; R(g, fx + dx - 34, y0, 68, 9, 3); g.fill(); g.fillStyle = lg(g, 0, y0 + 8, 0, y0 + 76, [0, 'rgba(30,18,10,0.55)'], [1, 'rgba(30,18,10,0)']); g.beginPath(); g.moveTo(fx + dx - 34, y0 + 8); g.lineTo(fx + dx + 34, y0 + 8); g.lineTo(fx + dx + 46, y0 + 78); g.lineTo(fx + dx - 46, y0 + 78); g.closePath(); g.fill(); }
    g.restore();
  }
  function room(g, t, s, o = {}) {
    const TT = times();
    if (!ROOM) ROOM = makeRoom();
    g.drawImage(ROOM, 0, 0);
    doorStrip(g, t, TT, o);
    if (o.ink > 0 && o.inkA > 0) { g.save(); g.globalAlpha *= o.inkA; ringAt(g, 907, 1128, 176, 62, o.ink, RED, 11); g.restore(); }
    momBody(g);
    // ---- where she looks
    const down = win(s, TT.bang0 - 0.1, TT.bangE + 0.3, 0.2);
    const k1 = win(t, TT.knock - 0.01, TT.knock + 1.9, 0.12), glance = win(t, TT.whistle + 0.1, TT.whistle + 0.75, 0.1) * 0.7, k2 = win(t, TT.knock2 - 0.01, TT.n14e + 0.9, 0.2);
    const turn = Math.max(k1, glance, k2, win(t, TT.whistle2 + 0.1, TT.knock2 - 0.05, 0.1) * 0.7);
    const nod = t > TT.n14e + 1.15 && t < TT.n14e + 2.3 ? Math.max(0, Math.sin((t - TT.n14e - 1.15) * 5.6)) * 15 : 0;
    const hold = win(t, TT.n11 - 0.25, TT.whistle2 + 0.5, 0.25);
    const mop = Math.max(talkP(t, 'm01'), talkP(t, 'm02')) * 0.82;
    const smiling = win(t, TT.m01 - 0.3, TT.leave + 0.5, 0.3) * (1 - ease((t - TT.leave - 0.5) / 0.9));
    const brave = win(t, TT.m01 - 0.3, TT.leave + 1.0, 0.3);
    g.save();
    g.translate(MX + turn * 26, MY + down * 8 + nod + Math.sin(t * 1.3) * 2.5);
    g.rotate(turn * 0.05 + down * 0.012); g.scale(MS * (1 - turn * 0.035), MS);
    momHairBack(g, MOM);
    head(g, MOM, { op: mop, close: Math.max(blinkAt(t, 4.3, 0.7), smiling * 0.22, down * 0.25), look: [lerp(0, 17, turn), lerp(lerp(5, 13, down), -2, turn)], worry: lerp(o.tired ? 8 : 3, 0, brave), smile: smiling * 0.85, frown: lerp(0.3, 0, smiling) });
    momFront(g, MOM, { tired: o.tired || 0 });
    g.restore();
    table(g);
    thali(g, 132, 1336, 0.82); thali(g, 140, 1292, 0.82); thali(g, 126, 1250, 0.82);
    g.save(); g.translate(884, 1294); g.rotate(-0.07); g.fillStyle = '#3a6fa8'; R(g, -80, -56, 160, 112, 8); g.fill(); txt(g, 'PASSBOOK', 0, 10, 30, '#f3efe2', { align: 'center' }); g.restore();
    armsAndBangles(g, s, TT, hold);
    if (hold > 0.003) fileHeld(g, hold);
  }

  // ------------------------------------------------------------------ the call
  const FULL = { x: 0, y: 0, w: W, h: H, r: 0 }, PIP = { x: 738, y: 298, w: 202, h: 302, r: 28 };
  const VIEW_FULL = { s: 1, cx: W / 2, cy: H / 2 }, VIEW_HER_PIP = { s: 0.262, cx: 470, cy: 830 }, VIEW_HIM_PIP = { s: 0.28, cx: 470, cy: 810 };
  const mixR = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u), r: lerp(a.r, b.r, u) });
  const mixV = (a, b, u) => ({ s: lerp(a.s, b.s, u), cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u) });
  function placeWindow(g, r, v, draw, border) {
    g.save(); g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, r.r); g.clip();
    g.translate(r.x + r.w / 2, r.y + r.h / 2); g.scale(v.s, v.s); g.translate(-v.cx, -v.cy);
    draw(g);
    g.restore();
    if (border) { g.save(); g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = border; g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, r.r); g.stroke(); g.restore(); }
  }
  const pad2 = (n) => String(Math.floor(n)).padStart(2, '0');
  const BASE = 26 * 3600 + 41 * 60 + 9;
  function storyT(t, TT) {                         // the story's clock: it runs backwards for one line, then forward again to show what you missed
    if (t < TT.R0 || t >= TT.R2) return t;
    if (t < TT.R1) return lerp(TT.R0, TT.bang0 - 0.2, ease((t - TT.R0) / (TT.R1 - TT.R0)));
    return lerp(TT.bang0 - 0.2, TT.bangE + 0.15, (t - TT.R1) / (TT.R2 - TT.R1));
  }
  function timerClock(t, TT) { let c = storyT(t, TT); if (t >= TT.R2 && t < TT.R2 + 0.35) c = lerp(TT.bangE + 0.15, t, (t - TT.R2) / 0.35); return BASE + Math.floor(c + 0.0001); }
  function timerText(c) { return `${pad2(c / 3600)}:${pad2((c % 3600) / 60)}:${pad2(c % 60)}`; }
  function callBar(g, t, TT) {
    const z = 1 + 0.34 * win(t, TT.n08 + 0.05, TT.R0 - 0.08, 0.22);
    g.save(); g.translate(76, 315); g.scale(z, z); g.translate(-76, -315);
    R(g, 76, 286, 244, 58, 29); g.fillStyle = 'rgba(16,18,22,0.72)'; g.fill();
    ell(g, 106, 315, 10, 10); g.fillStyle = '#ff5a48'; g.fill();
    txt(g, timerText(timerClock(t, TT)), 126, 331, 42, '#fff', { kind: 'mono' });
    g.restore();
    for (const [x, kind] of [[258, 'mic'], [768, 'cam']]) {
      ell(g, x, 1446, 54, 54); g.fillStyle = 'rgba(16,18,22,0.62)'; g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
      if (kind === 'mic') { R(g, x - 13, 1420, 26, 42, 13); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.arc(x, 1446, 25, 0.1, Math.PI - 0.1); g.moveTo(x, 1471); g.lineTo(x, 1483); g.stroke(); }
      else { R(g, x - 30, 1428, 44, 36, 8); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.moveTo(x + 18, 1442); g.lineTo(x + 34, 1432); g.lineTo(x + 34, 1460); g.lineTo(x + 18, 1450); g.closePath(); g.fill(); }
    }
  }
  function endButton(g, t, pulse = 0) {            // the only way out, in every shot
    const r = 80 + pulse * 7, x = CX, y = 1446;
    if (pulse > 0) { ell(g, x, y, r + 36 * pulse, r + 36 * pulse); g.fillStyle = `rgba(226,48,26,${0.3 * pulse})`; g.fill(); }
    ell(g, x, y, r, r); g.fillStyle = lg(g, x, y - r, x, y + r, [0, '#f24630'], [1, '#c8200f']); g.fill();
    g.save(); g.translate(x, y); g.rotate(2.36); g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineWidth = 19; g.beginPath(); g.arc(0, 18, 42, Math.PI + 0.45, -0.45); g.stroke();
    g.lineWidth = 26; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 36, -2); g.lineTo(k * 42, 8); g.stroke(); }
    g.restore();
  }
  // ---- the cameras: a list of moves; each one eases from wherever the last left off
  function track(t, keys, v0 = VIEW_FULL) { let v = v0; for (const [t0, dur, to] of keys) { if (t < t0) break; v = mixV(v, to, ease((t - t0) / dur)); } return { s: v.s, cx: clamp(v.cx, 540 / v.s, W - 540 / v.s), cy: clamp(v.cy, 960 / v.s, H - 960 / v.s) }; }
  function officeCam(t, TT) {
    return track(t, [
      [TT.n04 - 0.1, 0.4, { s: 1.4, cx: 620, cy: 955 }],
      [TT.n05 - 0.05, 0.45, VIEW_FULL],
    ]);
  }
  function herCam(t, TT) {
    return track(t, [
      [TT.n08 - 0.3, 1.6, { s: 1.14, cx: MX + 20, cy: 770 }],
      [TT.R0 + 0.05, 0.6, { s: 1.95, cx: 730, cy: 1268 }],
      [TT.R2 + 0.05, 0.5, { s: 1.75, cx: 200, cy: 610 }],
      [TT.n10b - 0.15, 0.5, { s: 1.1, cx: MX + 90, cy: 860 }],
      [TT.n11 - 0.2, 0.5, { s: 1.18, cx: MX + 30, cy: 900 }],
      [TT.whistle2 - 0.05, 0.42, VIEW_FULL],
      [TT.n12 - 0.15, 0.5, { s: 2.4, cx: 880, cy: 1010 }],
      [TT.m01 - 0.16, 0.36, { s: 1.4, cx: MX + 34, cy: 760 }],
      [TT.leave - 0.05, 0.75, { s: 2.4, cx: 880, cy: 1010 }],
      [TT.n14e + 0.95, 0.6, { s: 1.16, cx: MX + 30, cy: 780 }],
      [TT.n17e + 0.1, 1.2, VIEW_FULL],
    ]);
  }
  // ---- the words on the film
  function bigTitle(g, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = INK; R(g, 196, 1060, 634, 68, 10); g.fill();
    txt(g, 'YOU ARE UNDER', CX, 1116, 64, CREAM, { align: 'center', fit: 590 });
    g.fillStyle = RED; R(g, 76, 1126, 874, 130, 14); g.fill();
    txt(g, 'DIGITAL ARREST', CX, 1236, 132, CREAM, { align: 'center', fit: 836 });
    g.restore();
  }
  function pollButtons(g, t, t0, gone, dead) {
    const w = 372, gap = 36, x0 = CX - w - gap / 2, y = 1312;
    ['NEVER', 'MAYBE'].forEach((s, i) => {
      if (t < t0) return;
      const k = clamp(hit(t, t0 + i * 0.07, 'heavy')), sc = lerp(0.6, 1, k), x = x0 + i * (w + gap);
      g.save(); g.translate(x + w / 2, y + dead * 26); g.rotate(dead * (i ? 0.05 : -0.05)); g.scale(sc, sc); g.globalAlpha = clamp((t - t0 - i * 0.07) * 8) * (1 - gone) * (1 - dead);
      R(g, -w / 2, -48, w, 96, 18); g.fillStyle = PAPER; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
      txt(g, s, 0, 24, 68, INK, { align: 'center', fit: w - 40 });
      g.restore();
    });
  }
  function bar(g, y, t, t0, t1) {                  // drains from both ends to the middle: it points at nothing
    if (t < t0 || t >= t1) return;
    const u = clamp((t1 - t) / (t1 - t0)), half = 380 * u;
    R(g, 120, y, 786, 30, 15); g.fillStyle = 'rgba(20,16,10,0.78)'; g.fill();
    if (half > 2) { R(g, CX - half, y + 5, half * 2, 20, 10); g.fillStyle = '#ffb347'; g.fill(); }
  }
  function ringsHUD(g, t, TT) {
    const t0 = TT.three - 0.05, off = TT.n17e + 0.1;
    if (t < t0 || t > off + 0.5) return;
    const a = clamp((t - t0) * 7) * (1 - clamp((t - off) / 0.5));
    g.save(); g.globalAlpha *= a;
    R(g, 76, 352, 196, 58, 29); g.fillStyle = 'rgba(16,18,22,0.72)'; g.fill();
    [TT.spell + 0.05, TT.noSuch + 0.02, TT.n14e + 0.72].forEach((tk, i) => {
      const x = 112 + i * 62, y = 381, d = t - tk, q = d > 0 ? clamp(hit(t, tk, 'heavy')) : 0;
      ell(g, x, y, 20, 20); g.fillStyle = d > 0 ? '#fffdf4' : 'rgba(255,255,255,0.12)'; g.fill(); g.strokeStyle = '#fffdf4'; g.lineWidth = 4; g.stroke();
      if (d > 0) { g.save(); g.translate(x, y); g.scale(lerp(0.3, 1, q), lerp(0.3, 1, q)); g.strokeStyle = RED; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-11, 1); g.lineTo(-3, 10); g.lineTo(12, -9); g.stroke(); g.restore(); }
    });
    g.restore();
  }
  function overlays(g, t, TT, u, herV) {
    // frame 0's title, gone when the game starts; back to be stamped
    bigTitle(g, 1 - clamp((t - TT.n02 + 0.05) / 0.2));
    if (t >= TT.noSuch - 0.42 && t < TT.swap + 0.2) {
      const q = clamp(hit(t, TT.noSuch - 0.42, 'heavy')); g.save(); g.translate(CX, 1160); g.scale(lerp(0.9, 1, q), lerp(0.9, 1, q)); g.translate(-CX, -1160); bigTitle(g, clamp((t - TT.noSuch + 0.42) * 7) * (1 - clamp((t - TT.swap) / 0.15))); g.restore();
      if (t < TT.swap + 0.02) stamp(g, 'NO SUCH THING', CX, 1190, t, TT.noSuch + 0.02, INK, 96, -0.07, YEL);
    }
    // the poll
    if (t < TT.pollEnd + 0.3) { pollButtons(g, t, TT.n01e - 0.42, clamp((t - TT.pollEnd) / 0.22), 0); if (t >= TT.n01e && t < TT.pollEnd) { const half = 437 * clamp((TT.pollEnd - t) / (TT.pollEnd - TT.n01e)); g.fillStyle = YEL; R(g, CX - half, 1250, half * 2, 8, 4); g.fill(); } }
    // the hunt
    if (t >= TT.n02e && t < TT.barEnd + 0.1) bar(g, 1318, t, TT.n02e + 0.02, TT.barEnd);
    ringsHUD(g, t, TT);
    // the badge
    if (t >= TT.spell - 0.25 && t < TT.n05 + 0.3) {
      const oc = officeCam(t, TT), X = W / 2 + (635 - oc.cx) * oc.s, Y = H / 2 + (974 - oc.cy) * oc.s;
      g.save(); g.globalAlpha *= 1 - clamp((t - TT.n05) / 0.3); ringAt(g, X, Y, 208 * oc.s, 104 * oc.s, ease((t - TT.spell + 0.25) / 0.34), RED, 12); g.restore();
    }
    // a slow pull toward the corner, just before the swap
    if (t > TT.n06 && t < TT.swap + 0.1) { const k = clamp((t - TT.n06) / (TT.swap - TT.n06)); g.save(); g.strokeStyle = YEL; g.lineWidth = lerp(2, 11, k); g.globalAlpha *= k; g.beginPath(); g.roundRect(PIP.x - 6, PIP.y - 6, PIP.w + 12, PIP.h + 12, PIP.r + 6); g.stroke(); g.restore(); }
    // 26 hours
    if (t >= TT.n08 + 0.1 && t < TT.R0 + 0.1) {
      const a = clamp((t - TT.n08 - 0.1) * 6) * (1 - clamp((t - TT.R0 + 0.15) / 0.25));
      g.save(); g.globalAlpha *= a; txt(g, '26 HOURS', 430, 342, 96, YEL, { stroke: INK, sw: 0.14 }); g.restore();
    }
    // the rewind
    if (t >= TT.R0 && t < TT.R1) { g.save(); g.fillStyle = '#fff'; for (const dx of [0, 34]) { g.beginPath(); g.moveTo(344 + dx, 315); g.lineTo(374 + dx, 293); g.lineTo(374 + dx, 337); g.closePath(); g.fill(); } g.restore(); }
    // the buttons come back; both die
    if (t >= TT.n16 + 0.3 && t < TT.n17e + 0.25) pollButtons(g, t, TT.n16 + 0.3, 0, ease((t - TT.n17) / 0.3));
    // the way out, held to the end
    if (t >= TT.n17e + 0.35) {
      const a = clamp((t - TT.n17e - 0.35) * 5), a2 = clamp((t - TT.n18e - 0.05) * 5);
      g.save(); g.globalAlpha *= a;
      R(g, 66, 1022, 894, 318, 20); g.fillStyle = 'rgba(18,16,14,0.88)'; g.fill();
      txt(g, 'NO OFFICER ARRESTS YOU ON A VIDEO CALL', CX, 1102, 70, CREAM, { align: 'center', fit: 840 });
      txt(g, 'OR ASKS FOR MONEY.', CX, 1178, 70, CREAM, { align: 'center', fit: 840 });
      txt(g, 'HANG UP. TELL SOMEONE. DIAL 1930.', CX, 1288, 84, YEL, { align: 'center', fit: 846, a: a2 });
      g.restore();
      txt(g, "YOU'RE THE TEST SUBJECT", CX, 996, 46, CREAM, { align: 'center', fit: 800, stroke: INK, sw: 0.2, a });
    }
  }

  function frame(g, t) {
    const TT = times(), u = ease((t - TT.swap) / 0.5), s = storyT(t, TT);
    const inkP = ease((t - TT.n14e - 0.16) / 0.55);
    const redInk = t >= TT.n10b - 0.05 ? ease((t - TT.n10b + 0.05) / 0.45) : 0;
    const drain = ease((t - TT.n17e) / 1.1);
    g.save();
    if (drain > 0.002) g.filter = `grayscale(${drain.toFixed(3)}) brightness(${(1 - 0.1 * drain).toFixed(3)})`;
    const hR = mixR(PIP, FULL, u);
    const him = mixV(VIEW_HIM_PIP, { s: 0.41, cx: 440, cy: 660 }, win(t, TT.o10 - 0.25, TT.o10e + 0.2, 0.25));
    const hV = mixV(VIEW_HER_PIP, herCam(t, TT), u);
    const pop = clamp((t - TT.swap - 0.4) / 0.2), popQ = clamp(hit(t, TT.swap + 0.42, 'heavy'));
    if (u < 0.999) placeWindow(g, FULL, officeCam(t, TT), (c) => office(c, t, { redInk }));
    placeWindow(g, hR, hV, (c) => room(c, t, s, { tired: u, ink: t >= TT.n14e ? inkP : 0, inkA: 1 - clamp((t - TT.n14e - 0.9) / 0.3) }), u < 0.5 ? 5 : 0);
    if (u < 0.98) { g.save(); g.globalAlpha *= (1 - u) * 0.16; g.fillStyle = '#16202e'; g.beginPath(); g.roundRect(hR.x, hR.y, hR.w, hR.h, hR.r); g.fill(); g.restore(); }
    if (pop > 0) { const sc = lerp(0.55, 1, popQ), cxp = PIP.x + PIP.w / 2, cyp = PIP.y + PIP.h / 2, oR = { x: cxp - PIP.w * sc / 2, y: cyp - PIP.h * sc / 2, w: PIP.w * sc, h: PIP.h * sc, r: PIP.r }; g.save(); g.globalAlpha *= pop; placeWindow(g, oR, { s: him.s * sc, cx: him.cx, cy: him.cy }, (c) => office(c, t, { redInk }), 5); g.restore(); }
    callBar(g, t, TT);
    g.restore();
    const pulse = t > TT.n17e ? 0.55 + 0.45 * Math.sin((t - TT.n17e) * 4.4) : 0;
    endButton(g, t, drain * pulse);
    overlays(g, t, TT, u, hV);
  }

  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.clearRect(0, 0, W, H);
      g.save();
      frame(g, t);
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
      g.save(); g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256); g.restore();
    },
  });
  window.UI.endcard();
  C.start();
})();
