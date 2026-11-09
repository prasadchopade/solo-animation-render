// Reel 27 · You're the Target. Episode 5 of "You're the test subject", after The Only Witness (20), You Are the Only Suspect (23),
// You're the Detective (25) and You're the Judge (26). A video call on a phone. A fake officer says you're under "digital arrest"; you know it's
// a scam, so you hunt for his three mistakes. In the corner of the screen, unmentioned from frame 0, is the person he's really talking to. The third
// mistake is behind him: his office is a printed sheet, and it has been moving since the first second. Behind it, his team.
// Facts and sources: docs/research.md. Our own drawings; nobody real, no real agency's badge or uniform.
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
    const w = (lerp(36, 92, sstep(0, 0.35, op)) - 13 * sstep(0.6, 1, op)) * (o.tight ?? 1), top = 3 + 70 * Math.pow(op, 1.1), bot = 3 + 128 * Math.pow(op, 1.15);
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
    mouth(g, my, op, { lip: L.lip || '#83503f', line: L.lip ? '#7c2830' : undefined, lw0: L.lip ? 9 : 6, w0: o.w0 ?? 44, frown: o.frown ?? 0, smile: o.smile ?? 0, tight: L.tight });
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
  const TOP = 36;                                   // the bare wall above his print
  function makeOffice() {
    const c = offscreen(W, H), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#d7f3e8'], [0.55, '#b8e6d6'], [1, '#93d3bf']); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(30,90,80,0.10)'; g.fillRect(0, 852, W, 6);
    // a wooden plaque, spelled right
    g.fillStyle = lg(g, 0, 400, 0, 500, [0, '#8e5d36'], [1, '#6c4427']); R(g, 50, 448, 164, 100, 10); g.fill();
    g.strokeStyle = '#e9c46a'; g.lineWidth = 3; R(g, 58, 456, 148, 84, 7); g.stroke();
    txt(g, 'CYBER', 132, 492, 36, '#f6e6b7', { align: 'center' }); txt(g, 'CELL', 132, 530, 36, '#f6e6b7', { align: 'center' });
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
    // it's a print on a sheet: the folds it came in, and the tape that holds it up. For anyone who goes back to look
    for (const x of [270, 540, 810]) { g.fillStyle = 'rgba(255,255,255,0.17)'; g.fillRect(x, TOP, 2.5, H); g.fillStyle = 'rgba(30,70,60,0.09)'; g.fillRect(x + 2.5, TOP, 2.5, H); }
    for (const y of [470, 950, 1430]) { g.fillStyle = 'rgba(255,255,255,0.17)'; g.fillRect(0, y, W, 2.5); g.fillStyle = 'rgba(30,70,60,0.09)'; g.fillRect(0, y + 2.5, W, 2.5); }
    g.fillStyle = '#17140f'; g.fillRect(0, 0, W, TOP);
    for (const x of [70, 380, 690, 980]) { g.save(); g.translate(x, TOP); g.rotate(((x % 7) - 3) * 0.02); g.fillStyle = 'rgba(205,176,120,0.92)'; g.fillRect(-50, -24, 100, 50); g.restore(); }
    return c;
  }
  const OFF = { skin: '#b9855c', skinD: '#8d5c3b', skinH: '#d8a880', hair: '#17110d', style: 'none', must: 'thick', stub: 0.42, brow: 20, browTilt: 11, jaw: 1.05, ew: 44, eh: 21, tight: 0.66, mole: [84, 62] };   // the mole: the thief's, same place and size as reels 20-26 (the user's note, 9 Nov)
  const OX = 438, OY = 626, OS = 0.96, ONY = 882;
  const PLATE_L = [262, 234], PX = OX + PLATE_L[0] * OS, PY = ONY + PLATE_L[1] * OS;   // the name plate: on his chest, clear of the collar and the shoulder strap
  const BY = 1460, TY = 108;                        // the call buttons' centre (the red one's edge is on the safe line, 1536) and how far the frame-0 title sits below where it started
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
  function officerBody(g, x, y, s, L = OFF) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -84, -90, 84, 50, [0, L.skinH], [1, L.skinD]); R(g, -84, -96, 168, 184, 48); g.fill();
    const body = () => { g.beginPath(); g.moveTo(-560, 1200); g.lineTo(-540, 240); g.bezierCurveTo(-500, 126, -300, 84, -112, 26); g.lineTo(112, 26); g.bezierCurveTo(300, 84, 500, 126, 540, 240); g.lineTo(560, 1200); g.closePath(); };
    body(); g.fillStyle = lg(g, -520, 40, 520, 1040, [0, '#e7cf9b'], [0.5, '#d4b880'], [1, '#ad905c']); g.fill();
    g.fillStyle = 'rgba(95,70,30,0.16)'; g.fillRect(-28, 130, 56, 1000);
    for (let i = 0; i < 6; i++) { ell(g, 0, 170 + i * 130, 11, 11); g.fillStyle = '#7d6236'; g.fill(); }
    for (const k of [-1, 1]) {
      g.fillStyle = '#c9ab70'; g.beginPath(); g.moveTo(k * 118, 2); g.lineTo(k * 6, 124); g.lineTo(k * 96, 182); g.lineTo(k * 184, 58); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(70,48,18,0.42)'; g.lineWidth = 4; g.lineJoin = 'round'; g.stroke();
      g.save(); g.translate(k * 410, 150); g.rotate(k * 0.39); g.fillStyle = '#1d2a4e'; R(g, -86, -22, 172, 44, 10); g.fill();          // lying along the shoulder, inside its outline
      g.fillStyle = '#e0b94f'; R(g, -58, -11, 116, 7, 3); g.fill(); R(g, -58, 4, 116, 7, 3); g.fill(); g.restore();
    }
    // a pocket and a made-up crest on one side, the name plate on the other
    ell(g, -252, PLATE_L[1], 44, 44); g.fillStyle = '#1d2a4e'; g.fill(); g.strokeStyle = '#e0b94f'; g.lineWidth = 5; g.stroke(); star(g, -252, PLATE_L[1], 28);
    g.save(); g.translate(PLATE_L[0], PLATE_L[1]);
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
  const wf = (p, s) => (words(p).find((w) => w.w.toLowerCase().replace(/[^a-z']/g, '').startsWith(s)) || words(p)[0]).t0;
  let T = null;
  function times() {
    if (T) return T;
    T = {
      o03: at('o03'), o04: wi('o03', 4), o04e: en('o03'), o05: at('o05'), frozen: wi('o05', 4), o05e: en('o05'), o06: at('o06'), o06e: en('o06'), o08: at('o08'), o08e: en('o08'), o09: at('o09'), o09e: en('o09'),
      n01: at('n01'), n01e: en('n01'), n02: at('n02'), three: wi('n02', 3), n02e: en('n02'),
      n03: at('n03'), n03e: en('n03'), n04: at('n04'), spell: wi('n04', 5), n04e: en('n04'), n05: at('n05'), noSuch: wi('n05', 7), n05e: en('n05'), n06: at('n06'), n06e: en('n06'),
      n07: at('n07'), n07e: en('n07'), n08: at('n08'), n08e: en('n08'), n09: at('n09'), n09e: en('n09'),
      o12: at('o12'), o12e: en('o12'), n20: at('n20'), n20e: en('n20'), n21: at('n21'), n21e: en('n21'), n22: at('n22'), n22e: en('n22'), n23: at('n23'), n23e: en('n23'), n24: at('n24'), n24e: en('n24'),
      c01: at('c01'), c01e: en('c01'), n25: at('n25'), n25e: en('n25'), n26: at('n26'), n26e: en('n26'), m03: at('m03'), m03e: en('m04'), can: wf('m04', 'can'),
      o13: at('o13'), o13e: en('o13'), o14: at('o14'), o14e: en('o14'), o15: at('o15'), o15e: en('o15'), n27: at('n27'), n27e: en('n27'), end: tb('end'),
    };
    // the same formulas are in cues.py and score.py
    T.pollEnd = T.n01e + 0.92;
    T.barEnd = T.o08e + 0.05;
    T.whistle = T.o04e + 0.18;
    T.knock = T.o08e + 0.72;
    T.swap = T.n07 - 0.18;
    T.whistle2 = T.n09e + 0.35;                   // the cooker first, plainly behind her door
    T.knock2 = T.whistle2 + 1.25;
    T.bang0 = T.o06e + 0.05; T.bangDs = [1.15, 1.1, 0.5, 0.45]; T.bangE = T.bang0 + T.bangDs.reduce((a, b) => a + b, 0); T.bangR = T.bangE + 0.7;
    T.R0 = T.n09 - 0.72; T.R1 = T.R0 + 0.7; T.R2 = T.R1 + 2.7;
    T.yourM = wf('n07', 'your'); T.proof = wf('n09', 'trying');
    // the end: his window comes back; the wall; the hall; the next call; the dark; the bangle
    T.back = T.knock2 + 0.06; T.backE = T.back + 0.34;
    T.taps = [T.n20e + 0.06, T.n20e + 0.26];
    T.paper = wf('n21', 'paper'); T.tick3 = T.paper + 0.02;
    T.rip = T.n21e + 0.42; T.fall = T.n21e + 0.72; T.land = T.fall + 0.62; T.knock3 = T.n21e + 1.62;
    T.craneS = T.n24 - 0.1; T.craneE = T.c01e + 0.1;
    T.ring0 = T.n25e + 0.12; T.ring1 = T.n26e + 0.12; T.filled = T.n26e + 0.35; T.pick = T.n26e + 1.2; T.fillE = T.pick + 0.35;
    T.lastCut = T.o13 - 0.14; T.black = T.o14e + 0.14; T.press = wf('n27', 'can'); T.coda = T.press + 0.3;
    T.puffs = [T.n01 + 0.2, T.o03 + 0.5, T.whistle + 0.5, T.o08 + 0.4, T.n04 + 0.4, T.n06 + 0.3];   // the sheet breathes: a draught every few seconds
    T.knocks = [T.knock, T.knock + 0.235, T.knock + 0.47, T.knock2, T.knock2 + 0.25, T.knock2 + 0.505, ...T.taps];
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
  const OLINES = ['o01', 'o02', 'o03', 'o05', 'o06', 'o08', 'o09', 'o12'];
  const talkO = (t) => OLINES.reduce((v, p) => Math.max(v, talkP(t, p)), 0);
  // ---- what he holds up: the decoys
  function fist(g, x, y) {                         // a raised forearm, coming up from below his chest at an angle, with a cuff
    const bx = x - 190, by = y + 1020, wx = x + 4, wy = y + 92, ang = Math.atan2(wy - by, wx - bx);
    g.save(); g.lineCap = 'round'; g.lineWidth = 138; g.strokeStyle = lg(g, bx, by, wx, wy, [0, '#a98d5a'], [1, '#c8aa70']); g.beginPath(); g.moveTo(bx, by); g.lineTo(wx, wy); g.stroke(); g.restore();
    g.save(); g.translate(wx, wy); g.rotate(ang - Math.PI / 2); g.fillStyle = '#9b8050'; R(g, -80, -4, 160, 28, 8); g.fill(); g.restore();
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
  function frozenBook(g, x, y, t, t0) {
    g.save(); g.translate(x, y); g.rotate(-0.08);
    R(g, -150, -96, 300, 192, 12); g.fillStyle = lg(g, 0, -96, 0, 96, [0, '#4f86bf'], [1, '#376a9f']); g.fill();
    txt(g, 'PENSION', 0, -22, 62, '#f7f3e6', { align: 'center' }); txt(g, 'ACCOUNT', 0, 34, 44, '#d9e6f2', { align: 'center' });
    g.restore();
    stamp(g, 'FROZEN', x, y + 40, t, t0, RED, 66, -0.13, 'rgba(255,250,240,0.95)');
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
    const X = 182, Y0 = 905;
    const par = k(TT.o03 - 0.08, TT.o05 - 0.08), bk = k(TT.o05 - 0.05, TT.o06 - 0.08), war = k(TT.o06 - 0.06, TT.knock - 0.15);
    if (par > 0.003) { const y = Y0 + (1 - par) * 760; parcel(g, X, y); fist(g, X, y + 96); }
    if (bk > 0.003) { const y = Y0 - 12 + (1 - bk) * 760; frozenBook(g, X, y, t, TT.frozen); fist(g, X, y + 108); }
    if (war > 0.003) { const y = 868 + (1 - war) * 820; warrant(g, 188, y); fist(g, 188, y + 232); }
  }
  // his office is a print on a sheet of paper, taped up. It has never once kept still
  function sheetA(t, TT) {
    let a = 1.4;
    for (const p of TT.puffs) if (t > p - 0.35) a += 7.5 * sstep(p - 0.35, p, t) * Math.exp(-Math.max(0, t - p) * 1.1);
    for (const k of TT.knocks) if (t >= k) a += 11 * Math.exp(-(t - k) * 5);
    return a + 7 * sstep(TT.n20 + 0.5, TT.n20 + 1.6, t);
  }
  let SHEET = null, SHEET_KEY = '';
  function sheetImage(t, TT, A, down) {            // strips on whole pixels, in their own canvas: no camera can open a seam between them
    if (!OFFICE) OFFICE = makeOffice();
    if (!SHEET) SHEET = offscreen(W, H);
    const key = `${t.toFixed(3)}|${A.toFixed(3)}|${down ? 1 : 0}`;
    if (key === SHEET_KEY) return SHEET;
    SHEET_KEY = key;
    const g = SHEET.getContext('2d'), sw = 3;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    if (!down) { g.drawImage(OFFICE, 0, 0, W, TOP, 0, 0, W, TOP); g.fillStyle = '#93d3bf'; g.fillRect(0, H - 90, W, 90); }
    for (let x = 0; x < W; x += sw) {
      const ph = x * 0.0095 - t * 2.1, d = A * (Math.sin(ph) + 0.35 * Math.sin(x * 0.021 + t * 1.3));
      let y0 = TOP;
      if (down) {                                  // the tape lets go on the right, and the whole sheet comes after it
        const u = x / W, tau = t - TT.fall - (1 - u) * 0.12;
        y0 += ease((t - TT.rip) / 0.25) * 60 * u * u * u + (tau > 0 ? 3600 * tau * tau + 40 * Math.sin(x * 0.02 + tau * 14) * Math.min(1, tau * 4) : 0);
        if (y0 >= H + 40) continue;
      }
      g.drawImage(OFFICE, x, TOP, sw, H - TOP, x, y0, sw, H - TOP + d * 2.1);
      const sl = (Math.cos(ph) * A) / 16;
      if (Math.abs(sl) > 0.01) { g.fillStyle = sl > 0 ? `rgba(16,58,48,${Math.min(0.28, sl * 0.2)})` : `rgba(255,255,255,${Math.min(0.3, -sl * 0.24)})`; g.fillRect(x, y0, sw, H); }
      if (down) { g.fillStyle = 'rgba(0,0,0,0.24)'; g.fillRect(x, y0 + 2, sw, 26); g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(x, y0 - 14, sw, 16); }    // the paper's back, curling over
    }
    return SHEET;
  }
  function officeWall(g, t, TT, o = {}) {
    const A = o.A ?? sheetA(t, TT), down = !!(o.fall && t >= TT.rip);
    g.drawImage(sheetImage(t, TT, A, down), 0, 0);
  }
  function officerMan(g, t, TT, o = {}) {
    const knockK = win(t, TT.knock - 0.02, TT.o09 - 0.02, 0.05), flick = win(t, TT.whistle + 0.02, TT.whistle + 0.75, 0.07);
    let op = talkO(t);
    const bob = Math.sin(t * 1.9) * 3 + op * 9;
    if (t > TT.swap + 0.3 && t < TT.knock2 - 0.1 && !op) op = (Math.sin(t * 2.3) > -0.65 ? 1 : 0) * (0.06 + 0.2 * Math.abs(Math.sin(t * 8.7)));   // still talking after the swap, with no sound
    const look = flick > 0.01 ? [lerp(0, 8, flick), lerp(2, 10, flick)] : knockK > 0.01 ? [lerp(0, 15, knockK), 2] : [0, 2];   // on the knock he glances toward what's making it
    officerBody(g, OX, ONY, OS);
    const grin = Math.max(win(t, TT.o09 - 0.05, TT.n03e + 0.3, 0.3), win(t, TT.o12 - 0.05, TT.end + 2, 0.3));
    g.save(); g.translate(OX + (o.lean || 0) * 8, OY + bob); g.rotate(grin * 0.06); g.scale(OS, OS);
    head(g, OFF, { op, close: blinkAt(t, 3.7, 1.3), look, frown: lerp(0.8, 0, grin), smile: grin * 0.9, worry: -9 * grin, browY: knockK * -9 + grin * 2 });
    officerCap(g, OFF);
    g.restore();
    heldProps(g, t, TT);
  }
  function office(g, t, o = {}) { const TT = times(); officeWall(g, t, TT, o); officerMan(g, t, TT, o); }

  // ------------------------------------------------------------------ her room: a tube light, a shut door, thirty years of certificates
  function makeRoom() {
    const c = offscreen(W, H), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#f6dfa9'], [0.7, '#eccb8d'], [1, '#d9b171']); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(120,70,20,0.14)'; g.fillRect(0, 1120, W, 10);
    g.fillStyle = lg(g, 0, 1120, 0, 1300, [0, '#d2b294'], [1, '#b39474']); g.fillRect(0, 1130, W, 800);
    // a tube light
    g.fillStyle = rg(g, 500, 236, 20, 520, [0, 'rgba(255,255,240,0.75)'], [1, 'rgba(255,255,240,0)']); g.fillRect(0, 0, W, 800);
    // a certificate
    R(g, 22, 470, 176, 216, 6); g.fillStyle = '#7a4f2c'; g.fill(); R(g, 36, 484, 148, 188, 3); g.fillStyle = '#fff9e6'; g.fill();
    txt(g, 'BEST', 110, 542, 44, '#2f2a20', { align: 'center' }); txt(g, 'TEACHER', 110, 588, 44, '#2f2a20', { align: 'center', fit: 130 });
    star(g, 110, 636, 26, '#d9a31e');
    // the door, shut, a bolt across it
    const dx = 716, dw = 262, dy = 344, dh = 744;
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
    g.fillStyle = L.hairB || '#b2ada3'; g.beginPath(); g.moveTo(-hh - 12, 20); g.bezierCurveTo(-hh - 40, -220, -110, -300, 0, -300); g.bezierCurveTo(110, -300, hh + 40, -220, hh + 12, 20); g.closePath(); g.fill();
  }
  function momFront(g, L, o = {}) {
    const wet = o.wet || 0;
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
    if (wet > 0) { g.save(); g.globalAlpha *= wet * 0.9; for (const k of [-1, 1]) { ell(g, k * ex + k * 4, ey + 15, 24, 5); g.fillStyle = 'rgba(214,236,250,0.9)'; g.fill(); ell(g, k * ex - 6, ey + 13, 4, 2); g.fillStyle = '#fff'; g.fill(); } if ((o.tear || 0) > 0) { const u = o.tear; g.save(); g.globalAlpha *= 1 - sstep(0.7, 1, u); ell(g, -ex - 18, ey + 40 + u * 120, 5 + u, 7 + u); g.fillStyle = 'rgba(206,232,248,0.85)'; g.fill(); g.restore(); } g.restore(); }
    ell(g, 0, -100, L.bindiR || 8.5, L.bindiR || 8.5); g.fillStyle = '#9a1f2c'; g.fill();
    for (const k of [-1, 1]) { ell(g, k * (186 * L.jaw + 2), 28, 10, 10); g.fillStyle = '#e4bd55'; g.fill(); }
    // round glasses on a chain: a teacher's
    if (L.rectSpecs) {                             // someone else's glasses: dark, square
      g.strokeStyle = '#26211d'; g.lineWidth = 9;
      for (const k of [-1, 1]) { R(g, k * ex - 70, ey - 48, 140, 92, 22); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fill(); g.stroke(); }
      g.beginPath(); g.moveTo(-ex + 70, ey - 10); g.lineTo(ex - 70, ey - 10); g.moveTo(-ex - 70, ey - 14); g.lineTo(-186 * L.jaw, ey - 18); g.moveTo(ex + 70, ey - 14); g.lineTo(186 * L.jaw, ey - 18); g.stroke();
      return;
    }
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
  function forearm(g, x0, y0, x1, y1, w) {
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(92,56,32,0.6)'; g.lineWidth = w + 7; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = lg(g, x0, y0 - 30, x1, y1 + 30, [0, MOM.skinH], [1, MOM.skin]); g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore();
  }
  function upperArm(g, k) {                        // the shoulder melts into her blouse; a short sleeve with a gold edge; bare to the elbow
    const ex = MX + k * 258, ey = 1232, sx = MX + k * 262, sy = 1090, cu = 0.58, cx = lerp(sx, ex, cu), cy = lerp(sy, ey, cu);
    const blouse = lg(g, MX - 300, 944, MX + 300, 1344, [0, '#a33b4d'], [1, '#7e2a3c']);
    const line = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    g.save(); g.lineCap = 'butt';
    g.strokeStyle = 'rgba(92,56,32,0.6)'; g.lineWidth = 97; line(cx, cy - 4, ex, ey);
    g.strokeStyle = lg(g, sx - 40, cy, ex + 40, ey, [0, MOM.skinH], [1, MOM.skin]); g.lineWidth = 90; line(cx, cy - 4, ex, ey);
    g.strokeStyle = blouse; g.lineWidth = 104; line(sx, sy, cx, cy);
    ell(g, sx, sy, 52, 52); g.fillStyle = blouse; g.fill();
    g.fillStyle = '#e0b94f'; R(g, cx - 52, cy - 4, 104, 8, 2); g.fill();
    g.restore();
  }
  function hand(g, x, y, s, rot, flip) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(flip ? -s : s, s); g.lineCap = 'round';
    const shape = (extra, col) => {
      g.strokeStyle = col; g.fillStyle = col;
      for (let i = 0; i < 4; i++) { g.lineWidth = 19 + extra; g.beginPath(); g.moveTo(34, -30 + i * 20); g.lineTo(82 + (i === 3 ? -12 : 0), -36 + i * 21); g.stroke(); }
      ell(g, 16, 0, 42 + extra / 2, 46 + extra / 2); g.fill();
      g.lineWidth = 20 + extra; g.beginPath(); g.moveTo(-6, -32); g.lineTo(30, -66); g.stroke();
    };
    shape(7, 'rgba(92,56,32,0.6)'); shape(0, MOM.skin);
    g.strokeStyle = 'rgba(92,56,32,0.45)'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(40, -20 + i * 20); g.lineTo(78, -25 + i * 21); g.stroke(); }
    g.restore();
  }
  function table(g) {                              // a pale cloth on the table: her hands read against it
    g.fillStyle = lg(g, 0, 1230, 0, 1920, [0, '#f2e8d4'], [1, '#d6c6a6']); g.fillRect(0, 1236, W, 700);
    g.strokeStyle = 'rgba(150,120,80,0.15)'; g.lineWidth = 2;
    for (let x = -40; x < W + 60; x += 64) { g.beginPath(); g.moveTo(x, 1236); g.lineTo(x * 1.25 - 120, 1920); g.stroke(); }
    for (let y = 1262; y < 1920; y += 42 + (y - 1236) * 0.08) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = 'rgba(90,60,30,0.34)'; g.fillRect(0, 1236, W, 5);
  }
  function thaliOpen(g, x, y, sc = 1) {            // a steel thali, full: a roti, rice, a vegetable, dal in a steel katori, a bit of pickle
    g.save(); g.translate(x, y); g.scale(sc, sc); g.translate(-x, -y);
    ell(g, x + 6, y + 26, 158, 42); g.fillStyle = 'rgba(60,40,20,0.26)'; g.fill();
    ell(g, x, y + 6, 150, 44); g.fillStyle = lg(g, x - 150, y, x + 150, y + 20, [0, '#eef0f2'], [0.5, '#b4b9bf'], [1, '#e3e6e9']); g.fill();
    ell(g, x, y + 2, 124, 34); g.fillStyle = '#d6dadd'; g.fill();
    ell(g, x - 58, y - 2, 56, 21); g.fillStyle = lg(g, x - 110, y - 16, x, y + 16, [0, '#e0b16f'], [1, '#c58e4c']); g.fill();
    for (const [dx, dy, r] of [[-78, -6, 5], [-50, 4, 4], [-36, -8, 3.4], [-66, 8, 3]]) { ell(g, x + dx, y + dy, r, r * 0.5); g.fillStyle = '#8a5a2e'; g.fill(); }
    ell(g, x + 12, y + 12, 42, 16); g.fillStyle = '#fbf5de'; g.fill(); ell(g, x + 8, y + 8, 26, 8); g.fillStyle = '#ffffff'; g.fill();
    ell(g, x + 8, y - 17, 34, 11); g.fillStyle = '#7f9440'; g.fill(); for (const [dx, dy] of [[-12, -18], [4, -14], [20, -19]]) { ell(g, x + dx, y + dy, 6, 3); g.fillStyle = '#a7b65a'; g.fill(); }
    ell(g, x + 84, y - 4, 42, 19); g.fillStyle = '#c2c7cc'; g.fill(); ell(g, x + 84, y - 8, 34, 13); g.fillStyle = '#e0a12b'; g.fill();
    ell(g, x + 62, y + 22, 13, 7); g.fillStyle = '#c23a22'; g.fill();
    g.restore();
  }
  const PLATES = [[112, 1272], [262, 1368], [112, 1452]];
  // the bangles, one by one, worked over the knuckle. s: the story's clock (it runs backwards for one line)
  function armsAndBangles(g, s, TT, fileK, back = 0) {
    const R0 = [MX - 76, 1298], Wr = [MX + 158, 1256], Kn = [MX + 92, 1290], St = [MX + 322, 1304];
    let n = 4, m = 0, carried = null, RH = R0;
    const { bang0, bangDs, bangE } = TT;
    const lerp2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
    if (s >= bang0 && s < bangE) {
      let q = s - bang0, i = 0; while (i < 3 && q >= bangDs[i]) { q -= bangDs[i]; i++; } const p = q / bangDs[i], from = i ? St : R0;
      n = 4 - i - (p >= 0.24 ? 1 : 0); m = i + (p >= 0.84 ? 1 : 0);
      if (p < 0.24) RH = lerp2(from, Wr, ease(p / 0.24));
      else if (p < 0.6) { const u = (p - 0.24) / 0.36, wig = Math.sin(u * 22) * (1 - u) * 11; RH = lerp2(Wr, Kn, ease(u)); RH = [RH[0] + wig * 0.6, RH[1] + wig]; carried = { x: RH[0] + 8, y: RH[1] - 8, rot: 0.4 + wig * 0.05 }; }
      else if (p < 0.84) { RH = lerp2(Kn, St, ease((p - 0.6) / 0.24)); carried = { x: RH[0] + 8, y: RH[1] - 8, rot: 0.4 }; }
      else RH = St;
    } else if (s >= bangE) { n = 0; m = 4; RH = lerp2(St, R0, ease((s - bangE) / 0.55)); }
    if (back > 0) RH = lerp2(RH, R0, back);
    bangleStack(g, St[0] + 8, 1320, m);
    const fk = ease(fileK), fy = 1092 - (1 - fk) * 46;
    const RH2 = lerp2(RH, [MX - 212, fy + 46], fk), LH2 = lerp2([MX + 76, 1298], [MX + 212, fy + 46], fk);
    g.fillStyle = 'rgba(70,45,25,0.16)'; if (fk < 0.5) { ell(g, RH2[0] + 8, RH2[1] + 34, 92, 18); g.fill(); ell(g, MX + 100, 1338, 110, 18); g.fill(); }
    upperArm(g, 1); upperArm(g, -1);
    forearm(g, MX + 258, 1232, LH2[0] + 20, LH2[1] - 6, 84); hand(g, LH2[0], LH2[1], 0.9, lerp(-0.15, 0.5, fk), true);
    if (fk < 0.5) bangleSet(g, MX + 156, 1270, n, -0.35);
    const hoop = (a0, a1) => { if (!carried) return; g.save(); g.translate(carried.x, carried.y); g.rotate(carried.rot); g.beginPath(); g.ellipse(0, 0, 46, 28, 0, a0, a1); g.strokeStyle = '#f2cf62'; g.lineWidth = 9; g.lineCap = 'round'; g.stroke(); g.restore(); };
    hoop(Math.PI, TAU);                            // behind the fingers
    forearm(g, MX - 258, 1232, RH2[0] - 20, RH2[1] - 6, 84); hand(g, RH2[0], RH2[1], 0.9, lerp(0.15, -0.5, fk));
    hoop(0, Math.PI);                              // in front of them
    return { n, m };
  }
  function fileHeld(g, k, t, TT) {                 // everything in order: thirty years of keeping records
    if (t < TT.proof - 0.25) return;
    const e = ease(k), d = ease((t - TT.knock2 + 0.05) / 0.4);
    const y = lerp(1092 - (1 - e) * 46, 1218, d), sy = lerp(1, 0.22, d), x = lerp(MX, MX - 8, d);
    g.save(); g.globalAlpha *= d > 0 ? 1 : clamp(e * 2.2); g.translate(x, y); g.rotate(lerp(-0.03, 0, d)); g.scale(1, sy);
    R(g, -210, -168, 420, 322, 10); g.fillStyle = lg(g, 0, -168, 0, 154, [0, '#bcd6ea'], [1, '#9dc0dc']); g.fill(); g.strokeStyle = '#6f93b0'; g.lineWidth = 4; g.stroke();
    if (d < 0.6) {                                 // once it's flat on the table it's just a folder: no half-read label in the close-ups
      R(g, -130, -130, 260, 66, 6); g.fillStyle = '#fffdf3'; g.fill(); txt(g, 'ALL PAPERS', 0, -80, 50, '#23303a', { align: 'center', fit: 236 });
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(30,50,70,0.4)'; g.fillRect(-170, -40 + i * 28, [320, 260, 300, 240, 310, 200][i], 6); }
    }
    g.restore();
  }
  const DOOR = { x0: 716, x1: 978, y: 1088, gap: 32 };
  function doorStrip(g, t, TT, o) {               // the light under her door
    const { x0, x1, y: y0, gap } = DOOR;
    g.fillStyle = lg(g, 0, y0, 0, y0 + gap, [0, '#fff4cf'], [1, '#ffe7a8']); g.fillRect(x0, y0, x1 - x0, gap);
    g.fillStyle = lg(g, 0, y0 + gap, 0, y0 + gap + 96, [0, 'rgba(255,233,176,0.8)'], [1, 'rgba(255,233,176,0)']);
    g.beginPath(); g.moveTo(x0, y0 + gap); g.lineTo(x1, y0 + gap); g.lineTo(x1 + 44, y0 + gap + 96); g.lineTo(x0 - 44, y0 + gap + 96); g.closePath(); g.fill();
  }
  const u0 = (o) => (o.tired >= 0.99 ? 1 : 0);
  function room(g, t, s, o = {}) {
    const TT = times();
    if (!ROOM) ROOM = makeRoom();
    g.drawImage(ROOM, 0, 0);
    doorStrip(g, t, TT, o);
    momBody(g);
    // ---- where she looks
    const down = win(s, TT.bang0 - 0.1, TT.bangE + 0.3, 0.2);
    const k1 = win(t, TT.knock - 0.01, TT.knock + 1.9, 0.12), glance = win(t, TT.whistle + 0.1, TT.whistle + 0.75, 0.1) * 0.7, k2 = win(t, TT.knock2 - 0.01, TT.craneS + 1, 0.2);
    const turn = Math.max(k1, glance, k2, win(t, TT.whistle2 + 0.1, TT.knock2 - 0.05, 0.1) * 0.7);
    const hold = win(t, TT.proof - 0.25, TT.knock2 - 0.05, 0.28);
    const lookFile = win(t, TT.proof + 0.1, TT.n09e - 0.28, 0.14), trem = win(t, TT.proof + 0.6, TT.whistle2 + 0.4, 0.2) * Math.sin(t * 38) * 1.4;
    const wet = ease((t - TT.proof - 0.5) / 0.9), tc = ((t - TT.n09e - 0.4) % 3.4) / 1.7, tear = t > TT.n09e + 0.4 && tc < 1 ? tc : 0;          // a tear runs and is gone; another, later
    g.save();
    const ex = o.exag || 1;
    g.translate(MX + turn * 26 * ex, MY + down * 8 + Math.sin(t * 1.3) * 2.5 + trem);
    g.rotate(turn * 0.05 * ex + down * 0.012); g.scale(MS * (1 - turn * 0.035), MS);
    momHairBack(g, MOM);
    head(g, MOM, { op: 0, close: Math.max(blinkAt(t, 4.3, 0.7), down * 0.25), look: [lerp(0, 15, turn), lerp(lerp(5, 13, Math.max(down, lookFile)), 3, turn)], worry: o.tired ? 8 : 3, smile: 0, frown: 0.3 });
    momFront(g, MOM, { tired: o.tired || 0, wet: u0(o) * wet, tear: u0(o) * tear });
    g.restore();
    table(g);
    g.save(); g.translate(868, 1298); g.rotate(-0.07); g.fillStyle = '#3a6fa8'; R(g, -72, -52, 144, 104, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,0.75)'; R(g, -48, -30, 96, 24, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-48, 8, 96, 5); g.fillRect(-48, 20, 72, 5); g.restore();
    fileHeld(g, hold, t, TT);
    armsAndBangles(g, s, TT, hold, o.back || 0);
    for (const [px, py] of PLATES) thaliOpen(g, px, py, 0.66);       // nearer the camera than her arm
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
    return lerp(TT.bang0 - 0.2, TT.bangR, (t - TT.R1) / (TT.R2 - TT.R1));
  }
  function timerClock(t, TT) { let c = storyT(t, TT); if (t >= TT.R2 && t < TT.R2 + 0.35) c = lerp(TT.bangR, t, (t - TT.R2) / 0.35); return BASE + Math.floor(c + 0.0001); }
  function timerText(c) { return `${pad2(c / 3600)}:${pad2((c % 3600) / 60)}:${pad2(c % 60)}`; }
  function callBar(g, t, TT, label) {
    const z = 1 + 0.34 * win(t, TT.n08 - 0.1, TT.n08e + 0.05, 0.22);
    g.save(); g.translate(76, 315); g.scale(z, z); g.translate(-76, -315);
    R(g, 76, 286, 244, 58, 29); g.fillStyle = 'rgba(16,18,22,0.92)'; g.fill();
    ell(g, 106, 315, 10, 10); g.fillStyle = '#ff5a48'; g.fill();
    txt(g, label ?? timerText(timerClock(t, TT)), 126, 331, 42, '#fff', { kind: 'mono' });
    g.restore();
    for (const [x, kind] of [[258, 'mic'], [768, 'cam']]) {
      const y = BY;
      ell(g, x, y, 54, 54); g.fillStyle = 'rgba(16,18,22,0.62)'; g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
      if (kind === 'mic') { R(g, x - 13, y - 26, 26, 42, 13); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.arc(x, y, 25, 0.1, Math.PI - 0.1); g.moveTo(x, y + 25); g.lineTo(x, y + 37); g.stroke(); }
      else { R(g, x - 30, y - 18, 44, 36, 8); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.moveTo(x + 18, y - 4); g.lineTo(x + 34, y - 14); g.lineTo(x + 34, y + 14); g.lineTo(x + 18, y + 4); g.closePath(); g.fill(); }
    }
  }
  function endButton(g, t, pulse = 0) {            // the only way out, in every shot. Its edge sits on the safe line: only the glow pulses
    const r = 76, x = CX, y = BY;
    if (pulse > 0) { ell(g, x, y, r + 44 * pulse, r + 44 * pulse); g.fillStyle = `rgba(226,48,26,${0.3 * pulse})`; g.fill(); }
    ell(g, x, y, r, r); g.fillStyle = lg(g, x, y - r, x, y + r, [0, '#f24630'], [1, '#c8200f']); g.fill();
    g.save(); g.translate(x, y); g.rotate(2.36); g.scale(0.95, 0.95); g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineWidth = 19; g.beginPath(); g.arc(0, 18, 42, Math.PI + 0.45, -0.45); g.stroke();
    g.lineWidth = 26; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 36, -2); g.lineTo(k * 42, 8); g.stroke(); }
    g.restore();
  }
  // ---- the cameras: a list of moves; each one eases from wherever the last left off
  function track(t, keys, v0 = VIEW_FULL) { let v = v0; for (const [t0, dur, to] of keys) { if (t < t0) break; v = mixV(v, to, ease((t - t0) / dur)); } return { s: v.s, cx: clamp(v.cx, 540 / v.s, W - 540 / v.s), cy: clamp(v.cy, 960 / v.s, H - 960 / v.s) }; }
  function officeCam(t, TT) {
    return track(t, [
      [TT.knock + 0.08, 3.4, { s: 1.22, cx: OX + 62, cy: 700 }],        // the plate's edge stays inside the safe line (x = 950) at the top of the push
      [TT.n04 - 0.1, 0.4, { s: 1.4, cx: PX - 50, cy: 915 }],     // the plate low in frame: his eyes stay clear of the timer and the rings
      [TT.n05 - 0.05, 0.45, VIEW_FULL],
      [TT.n05e - 0.4, 3.2, { s: 1.08, cx: 540, cy: 975 }],
    ]);
  }
  function herCam(t, TT) {
    return track(t, [
      [TT.n08 - 0.3, 1.6, { s: 1.14, cx: MX + 20, cy: 770 }],
      [TT.R0 + 0.05, 0.6, { s: 2.2, cx: 620, cy: 1250 }],
      [TT.proof - 0.2, 0.5, { s: 1.18, cx: MX + 30, cy: 900 }],
      [TT.whistle2 - 0.05, 0.42, VIEW_FULL],
    ]);
  }
  // ---- the words on the film
  function bigTitle(g, a, noBar) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    if (!noBar) { g.fillStyle = INK; R(g, 196, 1060 + TY, 634, 68, 10); g.fill(); txt(g, 'YOU ARE UNDER', CX, 1116 + TY, 64, CREAM, { align: 'center', fit: 590 }); }
    g.fillStyle = RED; R(g, 76, 1126 + TY, 874, 130, 14); g.fill();
    txt(g, 'DIGITAL ARREST', CX, 1236 + TY, 132, CREAM, { align: 'center', fit: 836 });
    g.restore();
  }
  function pollButtons(g, t, t0, gone, dead) {
    const w = 372, gap = 36, x0 = CX - w - gap / 2, y = 1268;
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
    const t0 = TT.three - 0.05, off = TT.fall, mv = ease((t - TT.n20 - 0.55) / 0.5);
    if (t < t0 || t > off + 0.5) return;
    const a = clamp((t - t0) * 7) * (1 - clamp((t - off) / 0.25));
    const ticks = [TT.spell + 0.05, TT.noSuch + 0.02, TT.tick3], grow = win(t, TT.n20 + 1.3, TT.tick3 + 0.3, 0.2) * 0.3;
    let bump = 0; for (const tk of ticks) if (t >= tk) bump = Math.max(bump, Math.exp(-(t - tk) * 7));
    g.save(); g.globalAlpha *= a; g.translate(mv * 564, mv * 272); g.translate(76, 350); g.scale(1 + bump * 0.22 + grow, 1 + bump * 0.22 + grow); g.translate(-76, -350);
    R(g, 76, 350, 232, 66, 33); g.fillStyle = 'rgba(16,18,22,0.92)'; g.fill();
    ticks.forEach((tk, i) => {
      const x = 118 + i * 74, y = 383, d = t - tk, q = d > 0 ? clamp(hit(t, tk, 'heavy')) : 0;
      ell(g, x, y, 24, 24); g.fillStyle = d > 0 ? '#fffdf4' : 'rgba(255,255,255,0.12)'; g.fill(); g.strokeStyle = i === 2 && d <= 0 && grow > 0 ? YEL : '#fffdf4'; g.lineWidth = 5; g.stroke();
      if (d > 0) { g.save(); g.translate(x, y); g.scale(lerp(0.3, 1, q) * 1.15, lerp(0.3, 1, q) * 1.15); g.strokeStyle = RED; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-11, 1); g.lineTo(-3, 10); g.lineTo(12, -9); g.stroke(); g.restore(); }
    });
    g.restore();
  }
  function overlays(g, t, TT, u, herV) {
    // frame 0's title, gone when the game starts; back to be stamped
    bigTitle(g, 1 - clamp((t - TT.n01e + 0.5) / 0.12));         // it makes room for the poll, which lands in the same place
    if (t >= TT.noSuch - 0.42 && t < TT.swap + 0.2) {
      const q = clamp(hit(t, TT.noSuch - 0.42, 'heavy')); g.save(); g.translate(CX, 1160 + TY); g.scale(lerp(0.9, 1, q), lerp(0.9, 1, q)); g.translate(-CX, -1160 - TY); bigTitle(g, clamp((t - TT.noSuch + 0.42) * 7) * (1 - clamp((t - TT.swap) / 0.15)), t >= TT.noSuch - 0.02); g.restore();
      if (t < TT.swap + 0.16) { g.save(); g.globalAlpha *= 1 - clamp((t - TT.swap) / 0.15); stamp(g, 'NO SUCH THING', CX - 20, 1222, t, TT.noSuch + 0.02, INK, 80, 0.03, YEL); g.restore(); }
    }
    // the poll
    if (t < TT.pollEnd + 0.3) { pollButtons(g, t, TT.n01e - 0.42, clamp((t - TT.pollEnd) / 0.22), 0); }
    // the hunt: the job, said once, big
    if (t >= TT.three - 0.05 && t < TT.barEnd + 0.25) title(g, 'FIND 3 MISTAKES', 1262, 104, YEL, t, TT.three - 0.05, { a: 1 - clamp((t - TT.barEnd) / 0.22), fit: 860 });
    if (t >= TT.n02e && t < TT.barEnd + 0.1) bar(g, 1300, t, TT.n02e + 0.02, TT.barEnd);
    ringsHUD(g, t, TT);
    // the badge
    if (t >= TT.spell - 0.25 && t < TT.n05 + 0.3) {
      const oc = officeCam(t, TT), X = W / 2 + (PX - oc.cx) * oc.s, Y = H / 2 + (PY - oc.cy) * oc.s;
      g.save(); g.globalAlpha *= 1 - clamp((t - TT.n05) / 0.3); ringAt(g, X, Y, 208 * oc.s, 104 * oc.s, ease((t - TT.spell + 0.25) / 0.34), RED, 12); g.restore();
    }
    // a slow pull toward the corner, just before the swap
    if (t > TT.n05e - 0.1 && t < TT.swap + 0.1) { const k = clamp((t - TT.n05e + 0.1) / (TT.swap - TT.n05e + 0.1)); g.save(); g.strokeStyle = YEL; g.lineWidth = lerp(2, 11, k); g.globalAlpha *= k; g.beginPath(); g.roundRect(PIP.x - 6, PIP.y - 6, PIP.w + 12, PIP.h + 12, PIP.r + 6); g.stroke(); g.restore(); }
    // 26 hours
    if (t >= TT.n08 - 0.05 && t < TT.n08e + 0.3) {
      const a = clamp((t - TT.n08 + 0.05) * 6) * (1 - clamp((t - TT.n08e - 0.05) / 0.22));
      g.save(); g.globalAlpha *= a; txt(g, '26 HOURS', 418, 344, 84, YEL, { stroke: INK, sw: 0.14, fit: 300 }); g.restore();
    }
    // the rewind
    if (t >= TT.R0 && t < TT.R1) { g.save(); g.fillStyle = INK; for (const dx of [0, 34]) { g.beginPath(); g.moveTo(344 + dx, 315); g.lineTo(374 + dx, 293); g.lineTo(374 + dx, 337); g.closePath(); g.fill(); } g.restore(); }
    // who she is
    if (t >= TT.yourM - 0.05 && t < TT.n08 + 0.05) title(g, 'YOUR MOTHER', 1290, 176, YEL, t, TT.yourM - 0.05, { a: 1 - clamp((t - TT.n08 + 0.18) / 0.2), fit: 840 });
  }

  // ------------------------------------------------------------------ behind the wall
  const SKIN = { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72' };
  const MEN = [
    { ...OFF, ...SKIN, mole: null, must: 'thin', stub: 0.3, brow: 15, browTilt: 7, jaw: 0.98 },
    { ...OFF, skin: '#a56f4a', skinD: '#7e5233', skinH: '#c48f68', mole: null, must: 'thick', stub: 0.5, brow: 18, browTilt: 9, jaw: 1.08 },
    { ...OFF, skin: '#c08e68', skinD: '#95643f', skinH: '#dcae88', mole: null, must: null, stub: 0.6, brow: 16, browTilt: 6, jaw: 1.02 },
    { ...OFF, skin: '#96633f', skinD: '#704729', skinH: '#b58259', mole: null, must: 'thin', stub: 0.2, brow: 13, browTilt: 4, jaw: 0.95 },
    { ...OFF, mole: null, must: 'thick', stub: 0.35, brow: 20, browTilt: 12, jaw: 1.0 },
  ];
  const NEXT = { ...OFF, skin: '#c2906a', skinD: '#97643f', skinH: '#dcae88', mole: null, must: null, stub: 0.08, brow: 12, browTilt: 1, jaw: 0.95, ew: 46, eh: 25, tight: 0.8 };     // young, pleasant, nobody you'd worry about
  const KNOCKER = { ...OFF, skin: '#a56f4a', skinD: '#7e5233', skinH: '#c48f68', mole: null, must: 'thin', stub: 0.4, brow: 15, browTilt: -4, jaw: 1.02, ew: 46, eh: 28 };
  // whoever is in the corner of each man's screen: every age. The worry is the same
  const P0 = { skin: '#b07c56', skinD: '#855536', skinH: '#cf9d76', hair: '#cbc6bc', style: 'det', must: null, stub: 0, brow: 9, browTilt: -8, jaw: 0.94, ew: 41, eh: 24 };
  const PEOPLE_L = [
    { ...P0, lip: '#8d5049', bindi: true, ear: true, specs: true, bg: '#f3dfb0', cloth: '#a33b4d' },
    { ...P0, skin: '#a97750', skinH: '#c89a73', skinD: '#80522f', hair: '#d6d2c8', style: 'side', must: 'thin', stub: 0.2, brow: 10, browTilt: -6, jaw: 1.0, specs: true, bg: '#cfe3f0', cloth: '#e9e4d6' },
    { ...P0, skin: '#c29068', skinH: '#deb28c', skinD: '#97643f', hair: '#1c1512', lip: '#a2514e', ear: true, brow: 11, browTilt: -4, jaw: 0.9, bg: '#f7c8c2', cloth: '#3f8f8b' },
    { ...P0, skin: '#a06c47', skinH: '#bf8f68', skinD: '#7a4e30', hair: '#231a15', style: 'neat', must: 'thick', stub: 0.4, brow: 15, browTilt: -5, jaw: 1.04, bg: '#d9ecd2', cloth: '#5a7fb0' },
    { ...P0, hair: '#e7e3da', style: 'buzz', stub: 0.45, brow: 9, browTilt: -9, jaw: 0.98, bg: '#efe1cf', cloth: '#8b6f47' },
    { ...P0, skin: '#bb8862', skinH: '#d8a982', skinD: '#8f5f3d', hair: '#18120e', style: 'messy', stub: 0.2, brow: 13, browTilt: -6, jaw: 0.96, bg: '#e3d8f2', cloth: '#d9694a' },
    { ...P0, skin: '#9a6643', skinH: '#ba8a62', skinD: '#74492c', hair: '#3a3029', lip: '#8d5049', bindi: true, ear: true, brow: 10, browTilt: -7, jaw: 0.93, bg: '#fde9a9', cloth: '#7b4ea3' },
    { ...P0, hair: '#e2ddd2', lip: '#8d5049', bindi: true, brow: 8, browTilt: -10, jaw: 0.96, bg: '#d3e7e3', cloth: '#c8743a' },
    { ...P0, skin: '#b48058', skinH: '#d0a078', skinD: '#885838', hair: '#2b211b', style: 'side', must: 'thin', stub: 0.25, specs: true, brow: 13, browTilt: -4, jaw: 1.0, bg: '#f4d6c4', cloth: '#3a5a7a' },
    { ...P0, skin: '#a87650', skinH: '#c69871', skinD: '#7f5232', hair: '#bdb8ae', style: 'side', must: 'thick', stub: 0.1, brow: 11, browTilt: -7, jaw: 1.04, bg: '#e8eed0', cloth: '#efe9dc' },
  ];
  function personSprite(L) {
    const c = offscreen(PIP.w, PIP.h), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, PIP.h, [0, L.bg], [1, '#c9b48e']); g.fillRect(0, 0, PIP.w, PIP.h);
    g.translate(PIP.w / 2, 158); g.scale(0.44, 0.44);
    g.fillStyle = L.skinD; R(g, -74, 160, 148, 130, 40); g.fill();
    g.beginPath(); g.moveTo(-340, 460); g.bezierCurveTo(-330, 320, -180, 300, -70, 256); g.quadraticCurveTo(0, 310, 70, 256); g.bezierCurveTo(180, 300, 330, 320, 340, 460); g.closePath(); g.fillStyle = L.cloth; g.fill();
    head(g, L, { op: 0, close: 0, look: [0, 5], worry: 5, frown: 0.3 });
    return c;
  }
  const BOOTH_S = 0.5, MIP_S = 0.16;
  let BOOTHS = null, MIPS = null, PEOPLE = null;
  function boothSprite(L, op, sc) {                // the same printed office, the same uniform, another man
    if (!OFFICE) OFFICE = makeOffice();
    const c = offscreen(Math.round(W * sc), Math.round(H * sc)), g = c.getContext('2d');
    g.scale(sc, sc);
    g.drawImage(OFFICE, 0, TOP, W, H - TOP, 0, 0, W, H);
    officerBody(g, OX, ONY, OS, L);
    g.save(); g.translate(OX, OY); g.scale(OS, OS); head(g, L, { op, close: 0, look: [0, 4], smile: 0.1, frown: 0.3 }); officerCap(g, L); g.restore();
    g.strokeStyle = '#0d0c0a'; g.lineWidth = 14; g.strokeRect(0, 0, W, H);
    return c;
  }
  function makeBooths() {
    BOOTHS = MEN.map((L) => [0, 0.32].map((op) => boothSprite(L, op, BOOTH_S)));
    MIPS = MEN.map((L) => [0, 0.32].map((op) => boothSprite(L, op, MIP_S)));
    PEOPLE = PEOPLE_L.map(personSprite);
  }
  // the rows, nearest first: each row of booths stands above the last and a little smaller, and they don't stop
  const ROWS = (() => { const out = []; let y = 1290, k = 1; for (let r = 0; r < 24; r++) { const w = W * 0.28 * k, h = H * 0.28 * k; y -= h; out.push({ y, w, h, gap: 8 * k }); k *= 0.92; } return out; })();
  const TR = 6, TC = 1;                            // the booth whose call hasn't connected yet
  const boothRect = (r, c) => { const R_ = ROWS[r], st = R_.w + R_.gap; return { x: 540 + c * st - R_.w / 2, y: R_.y, w: R_.w, h: R_.h, r: 0 }; };
  const TB = boothRect(TR, TC), TBC = { x: TB.x + TB.w / 2, y: TB.y + TB.h / 2 }, S_FILL = W / TB.w;
  const free = (t, keys, v0) => { let v = v0; for (const [t0, dur, to] of keys) { if (t < t0) break; v = mixV(v, to, ease((t - t0) / dur)); } return v; };
  // the near things and the far things move differently when the camera goes back
  function fgCam(t, TT) {
    return free(t, [
      [TT.n20 + 0.55, 1.15, { s: 1.3, cx: 665, cy: 840 }],
      [TT.fall + 0.5, 0.55, { s: 1.12, cx: 640, cy: 800 }],
      [TT.craneS, TT.craneE - TT.craneS, { s: 0.42, cx: 540, cy: -2400 }],
    ], VIEW_FULL);
  }
  function bgCam(t, TT) {
    return free(t, [
      [TT.craneS, TT.craneE - TT.craneS, { s: 0.46, cx: 540, cy: -1500 }],
      [TT.n25 - 0.1, TT.n25e - TT.n25 + 0.2, { s: 1.5, cx: TBC.x, cy: TBC.y }],
      [TT.n25e + 0.1, TT.n26 - TT.n25e - 0.1, { s: 2.2, cx: TBC.x, cy: TBC.y }],
      [TT.n26 - 0.02, TT.filled - TT.n26 + 0.02, { s: S_FILL, cx: TBC.x, cy: TBC.y }],
    ], { s: 1.05, cx: 640, cy: 700 });
  }
  const cellHash = (r, c) => ((((r + 3) * 73856093) ^ ((c + 1000) * 19349663)) >>> 0);
  function drawBooths(g, t, TT, v) {
    if (!BOOTHS) makeBooths();
    g.fillStyle = '#100f0c'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, H / 2); g.scale(v.s, v.s); g.translate(-v.cx, -v.cy);
    const x0 = v.cx - 540 / v.s, x1 = v.cx + 540 / v.s, y0 = v.cy - 960 / v.s, y1 = v.cy + 960 / v.s;
    const uni = t >= TT.c01 - 0.04 && t <= TT.c01e + 0.04, say = uni ? talkP(t, 'c01') > 0.11 : false;
    for (let r = ROWS.length - 1; r >= 0; r--) {
      const Q = ROWS[r]; if (Q.y > y1 || Q.y + Q.h < y0) continue;
      const st = Q.w + Q.gap, a0 = Math.floor((x0 - 540) / st) - 1, a1 = Math.ceil((x1 - 540) / st) + 1, onScreen = Q.w * v.s;
      for (let c = a0; c <= a1; c++) {
        if (r === TR && c === TC) continue;
        const h = cellHash(r, c), x = 540 + c * st - Q.w / 2, m = uni ? say : Math.sin(t * (7 + (h % 5)) + h) > 0.15;
        g.drawImage((onScreen < 170 ? MIPS : BOOTHS)[h % MEN.length][m ? 1 : 0], x, Q.y, Q.w, Q.h);
        if (onScreen > 44) { const k = Q.w / W, px = x + PIP.x * k, py = Q.y + PIP.y * k, pw = PIP.w * k, ph = PIP.h * k; g.drawImage(PEOPLE[(h >>> 3) % PEOPLE.length], px, py, pw, ph); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 12 * k; g.strokeRect(px, py, pw, ph); }
      }
      if (r > 8) { g.fillStyle = `rgba(16,15,12,${Math.min(0.92, (r - 8) / 15)})`; g.fillRect(x0 - 20, Q.y - Q.gap - 1, x1 - x0 + 40, Q.h + Q.gap + 2); }
      const off = 1 - clamp((t - TT.craneS - r * 0.09) / 0.1);       // the tube lights come on, a row at a time, going up
      if (off > 0.002) { g.fillStyle = `rgba(8,8,7,${0.95 * off})`; g.fillRect(x0 - 20, Q.y - Q.gap - 1, x1 - x0 + 40, Q.h + Q.gap + 2); }
    }
    placeWindow(g, { ...TB }, { s: TB.w / W, cx: W / 2, cy: H / 2 }, (c) => nextStage(c, t, TT));
    if (t > TT.n25 + 0.9) { const p = 0.55 + 0.45 * Math.sin((t - TT.n25) * 8); g.strokeStyle = YEL; g.lineWidth = lerp(3, 14, p) / v.s; g.strokeRect(TB.x, TB.y, TB.w, TB.h); }
    g.restore();
    const dim = lerp(0.2, 0, ease((t - TT.craneS - 0.4) / 1.2));
    if (dim > 0.002) { g.fillStyle = `rgba(10,10,8,${dim})`; g.fillRect(0, 0, W, H); }
  }
  function doorProp(g, t, TT) {                    // a wooden door on a stand. It doesn't open onto anything
    let dx = 0; for (const k of [TT.knock3]) if (t >= k) dx = Math.max(dx, 5 * Math.exp(-(t - k) * 9) * Math.cos((t - k) * 60));
    const x = 860 + dx, y = 520, w = 190, h = 720;
    g.fillStyle = '#4a2f1b';
    g.save(); g.lineCap = 'round'; g.strokeStyle = '#4a2f1b'; g.lineWidth = 18; for (const q of [-1, 1]) { g.beginPath(); g.moveTo(x + w / 2 + q * 100, y + h + 6); g.lineTo(x + w / 2 + q * 30, y + h - 140); g.stroke(); } g.restore();
    R(g, x - 60, y + h - 6, w + 120, 20, 8); g.fill();
    g.fillStyle = '#6f4528'; g.fillRect(x - 14, y - 14, w + 28, h + 14);
    g.fillStyle = lg(g, x, y, x + w, y + h, [0, '#a4693d'], [1, '#7b4a29']); g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(40,20,5,0.36)'; g.lineWidth = 6; R(g, x + 26, y + 44, w - 52, 280, 8); g.stroke(); R(g, x + 26, y + 380, w - 52, 290, 8); g.stroke();
    g.fillStyle = '#d3cdbb'; ell(g, x + 24, y + 362, 14, 14); g.fill();
  }
  function knocker(g, t, TT) {                     // caught with his fist up
    const X = 735, Y = 862, S0 = 0.6;
    g.save(); g.beginPath(); g.rect(-3000, -3000, 3950, 9000); g.clip(); officerBody(g, X, Y, S0, KNOCKER); g.restore();
    const seen = win(t, TT.fall + 0.35, TT.n24 + 0.2, 0.15);
    g.save(); g.translate(X, Y - 266.7 * S0); g.scale(S0, S0);
    head(g, KNOCKER, { op: 0.04 * seen, close: blinkAt(t, 3.1, 0.2), look: [lerp(13, 0, seen), 0], browY: -16 * seen, frown: 0.5 });
    officerCap(g, KNOCKER);
    g.restore();
  }
  function knockerFist(g, t, TT) {
    const low = ease((t - TT.n23 - 0.1) / 1.1), k3 = TT.knock3, reach = (t >= k3 - 0.16 && t < k3 ? -26 * ease((t - k3 + 0.16) / 0.1) + 26 * ease((t - k3 + 0.05) / 0.05) : 0) + (t >= k3 ? -8 * ease((t - k3) / 0.2) : 0);
    g.save(); g.translate(858 + reach - low * 40, 742 + low * 300); g.scale(0.62, 0.62); fist(g, 0, 0); g.restore();
  }
  function wallAndHall(g, t, TT) {
    const f = fgCam(t, TT), b = bgCam(t, TT), fallen = t >= TT.rip;
    if (fallen) drawBooths(g, t, TT, b);
    if (t < TT.n25 + 1.2) {
      g.save(); g.translate(W / 2, H / 2); g.scale(f.s, f.s); g.translate(-f.cx, -f.cy);
      if (fallen) { g.fillStyle = '#26241f'; g.fillRect(-3000, 1262, 7000, 1500); knocker(g, t, TT); doorProp(g, t, TT); knockerFist(g, t, TT); }
      if (t < TT.fall + 0.95) officeWall(g, t, TT, { fall: true });
      officerMan(g, t, TT);
      g.restore();
    }
  }
  // ------------------------------------------------------------------ the next call: the same picture as frame 0, a different man
  function darkPip(g, t) {
    R(g, PIP.x, PIP.y, PIP.w, PIP.h, PIP.r); g.fillStyle = '#15171c'; g.fill();
    const cx = PIP.x + PIP.w / 2, cy = PIP.y + PIP.h * 0.42;
    for (let i = 0; i < 3; i++) { const u = (t * 0.9 + i / 3) % 1, r = 34 + u * 72; ell(g, cx, cy, r, r); g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - u)})`; g.lineWidth = 5; g.stroke(); }
    ell(g, cx, cy - 12, 22, 22); g.fillStyle = '#6d7480'; g.fill(); ell(g, cx, cy + 34, 40, 26); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5; R(g, PIP.x, PIP.y, PIP.w, PIP.h, PIP.r); g.stroke();
  }
  function fan(g, x, y, t) {                       // the ceiling fan, going round
    const a0 = t * 7.4;
    g.save(); g.translate(x, y);
    for (let b = 0; b < 3; b++) for (let k = 0; k < 5; k++) {
      g.save(); g.rotate(a0 + (b * TAU) / 3 - k * 0.075); g.globalAlpha *= [0.62, 0.34, 0.22, 0.14, 0.08][k];
      g.fillStyle = '#a8977a'; g.beginPath(); g.moveTo(40, -26); g.lineTo(470, -62); g.quadraticCurveTo(496, 0, 470, 62); g.lineTo(40, 26); g.closePath(); g.fill();
      g.restore();
    }
    ell(g, 0, 0, 92, 92); g.fillStyle = lg(g, -90, -90, 90, 90, [0, '#e8e0cf'], [1, '#b7ab94']); g.fill();
    ell(g, 0, 0, 40, 40); g.fillStyle = '#8f8570'; g.fill();
    g.restore();
  }
  const YOURS = { ...MOM, skin: '#a97750', skinD: '#80522f', skinH: '#c89a73', hair: '#2b2622', hairB: '#211d1a', rectSpecs: true, bindiR: 13 };
  function ceiling(g, t, TT) {                     // a mother, answering a video call: first the ceiling, then the forehead
    const u = t - TT.pick;
    g.save();
    g.translate(W / 2 + 14 * Math.sin(u * 2.3) + 6 * Math.sin(u * 7.1), H / 2 + 10 * Math.sin(u * 1.9 + 1) + 5 * Math.sin(u * 6.2)); g.rotate(0.035 * Math.sin(u * 1.4) + 0.012 * Math.sin(u * 5.3)); g.scale(1.08, 1.08); g.translate(-W / 2, -H / 2);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#efe7d6'], [1, '#ddd2bb']); g.fillRect(-200, -200, W + 400, H + 400);
    g.save(); g.translate(120, 210); g.rotate(-0.5); g.fillStyle = rg(g, 0, 0, 20, 520, [0, 'rgba(255,255,245,0.8)'], [1, 'rgba(255,255,245,0)']); g.fillRect(-540, -540, 1080, 1080); g.fillStyle = '#fffef6'; R(g, -220, -14, 440, 28, 12); g.fill(); g.restore();
    g.fillStyle = 'rgba(150,120,80,0.14)'; ell(g, 840, 980, 190, 120, 0.4); g.fill();
    g.strokeStyle = 'rgba(120,100,70,0.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 900); g.lineTo(180, 860); g.lineTo(260, 910); g.lineTo(380, 880); g.stroke();
    fan(g, 560, 470, t);
    const up = ease((u - 0.55) / 0.5), near = ease((t - TT.can + 0.2) / 0.6), mop = Math.max(talkP(t, 'm03'), talkP(t, 'm04'));
    if (up > 0.002) {
      g.save(); g.translate(540 + 22 * Math.sin(u * 1.7), lerp(H + 1000, lerp(1830, 1590, near), up) + mop * 8); g.rotate(0.03 * Math.sin(u * 1.3)); g.scale(lerp(2.9, 3.05, near), lerp(2.9, 3.05, near));
      momHairBack(g, YOURS);
      head(g, YOURS, { op: mop * 0.7, close: blinkAt(t, 2.9, 0.9), look: [0, -12], worry: -4, smile: 0.6, browY: -8 });
      momFront(g, YOURS, { tired: 0 });
      g.restore();
    }
    g.restore();
  }
  function redBar(g, s, a) { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.fillStyle = RED; R(g, 76, 1126 + TY, 874, 130, 14); g.fill(); txt(g, s, CX, 1236 + TY, 132, CREAM, { align: 'center', fit: 836 }); g.restore(); }
  const PIP_CEIL = { s: PIP.w / W, cx: W / 2, cy: 1180 };
  function nextStage(g, t, TT) {                   // in the film's own layout, so one booth can become the whole screen
    officeWall(g, t, TT, { A: 3.4 });
    const op = Math.max(talkP(t, 'o13'), talkP(t, 'o14')), bob = Math.sin(t * 1.7) * 3 + op * 9;
    officerBody(g, OX, ONY, OS, NEXT);
    const sm = win(t, TT.pick + 0.5, TT.end + 2, 0.4), down = 1 - win(t, TT.pick - 0.05, TT.end + 2, 0.16), lean = win(t, TT.o14 - 0.2, TT.end + 2, 0.3);
    g.save(); g.translate(OX, OY + bob + lean * 6); g.scale(OS * (1 + lean * 0.03), OS * (1 + lean * 0.03));
    head(g, NEXT, { op, close: blinkAt(t, 3.4, 0.6), look: [0, lerp(2, 16, down)], smile: 0.45 + sm * 0.55, browY: down * 10 + lean * 4 });
    officerCap(g, NEXT);
    g.restore();
    if (t < TT.pick) darkPip(g, t);
    else if (t >= TT.lastCut) placeWindow(g, PIP, PIP_CEIL, (c) => ceiling(c, t, TT), 5);
    callBar(g, t, TT, t < TT.pick ? 'CALLING' : timerText(Math.max(0, Math.floor(t - TT.pick + 2))));
    endButton(g, t, 0);
    if (t < TT.pick) redBar(g, 'RINGING', 1);
    else if (t >= TT.lastCut && t >= TT.o14 - 0.08) redBar(g, 'WE CAN SEE YOU', clamp((t - TT.o14 + 0.08) * 9));
    if (t >= TT.pick && t < TT.lastCut) {
      const grow = ease((t - TT.pick - 0.05) / 0.3), r = mixR({ ...PIP }, FULL, grow), flash = Math.exp(-(t - TT.pick) * 12);
      placeWindow(g, r, mixV(PIP_CEIL, VIEW_FULL, grow), (c) => ceiling(c, t, TT), grow < 0.98 ? 5 : 0);
      if (flash > 0.02) { g.save(); g.globalAlpha *= flash * 0.8; g.fillStyle = '#fff'; g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, r.r); g.fill(); g.restore(); }
    }
  }
  function pressAt(g, t, TT) {                     // the only way out, alone in the dark. Then somebody presses it
    const d = t - TT.press, sq = d >= 0 ? lerp(0.86, 1, clamp(d / 0.14)) : 1, pulse = 0.55 + 0.45 * Math.sin((t - TT.black) * 4.4);
    g.save(); g.translate(CX, BY); g.scale(sq, sq); g.translate(-CX, -BY); endButton(g, t, d >= 0 ? 0 : pulse); g.restore();
    if (d >= 0 && d < 0.25) { const u = d / 0.25; g.save(); g.strokeStyle = `rgba(255,255,255,${1 - u})`; g.lineWidth = 8; ell(g, CX, BY, 76 + u * 150, 76 + u * 150); g.stroke(); g.restore(); }
  }
  function coda(g, t, TT) {                        // somebody told her
    const s = lerp(TT.bangE, TT.bangE - TT.bangDs[3] * 0.77, ease((t - TT.coda - 0.25) / 1.0));
    placeWindow(g, FULL, { s: 2.0, cx: 650, cy: 1130 }, (c) => room(c, t, s, { tired: 1, exag: 1, back: ease((t - TT.coda - 1.4) / 0.6) }));
    const top = lg(g, 0, 660, 0, 780, [0, 'rgba(14,12,10,1)'], [1, 'rgba(14,12,10,0)']);
    g.fillStyle = 'rgb(14,12,10)'; g.fillRect(0, 0, W, 660); g.fillStyle = top; g.fillRect(0, 660, W, 120);
    txt(g, "YOU'RE THE TEST SUBJECT", CX, 356, 44, CREAM, { align: 'center', fit: 820 });
    txt(g, 'NO OFFICER ARRESTS YOU', CX, 456, 86, CREAM, { align: 'center', fit: 840 });
    txt(g, 'ON A VIDEO CALL OR ASKS FOR MONEY.', CX, 534, 62, CREAM, { align: 'center', fit: 840 });
    txt(g, 'HANG UP. TELL SOMEONE. DIAL 1930.', CX, 650, 84, YEL, { align: 'center', fit: 846 });
    const gd = t - TT.coda - 2.05;                 // it catches the light, once the hand has gone
    if (gd > 0 && gd < 0.5) { const q = Math.sin((Math.PI * gd) / 0.5), x = 412, y = 1218; g.save(); g.globalAlpha *= q; g.fillStyle = '#fff6cf'; g.beginPath(); for (let i = 0; i < 8; i++) { const an = (i * Math.PI) / 4, r = i % 2 ? 7 : 42 * q; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(an) * r, y + Math.sin(an) * r); } g.closePath(); g.fill(); g.restore(); }
    const a = 1 - clamp((t - TT.coda) / 0.35);
    if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
  }
  function ending(g, t, TT) {
    if (t >= TT.coda) { coda(g, t, TT); return; }
    if (t >= TT.black) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); pressAt(g, t, TT); return; }
    if (t >= TT.filled) {
      nextStage(g, t, TT);
      if (t >= TT.m03 - 0.05 && t < TT.lastCut) { const can = t >= TT.can - 0.05; title(g, can ? 'CAN YOU SEE ME?' : 'HELLO?', 400, 118, CREAM, t, can ? TT.can - 0.05 : TT.m03 - 0.05, { fit: 840 }); }
      return;
    }
    // his window comes back over hers
    const ub = ease((t - TT.back) / 0.34), s = t;
    if (ub < 0.999) {
      const hV = VIEW_FULL, k2 = [TT.knock2, TT.knock2 + 0.25, TT.knock2 + 0.505]; let sh = [0, 0]; sh = shakeAt(t, k2, 12);
      placeWindow(g, FULL, { s: hV.s, cx: hV.cx - sh[0], cy: hV.cy - sh[1] }, (c) => room(c, t, s, { tired: 1, exag: 1 }));
      placeWindow(g, mixR(PIP, FULL, ub), mixV(VIEW_HIM_PIP, VIEW_FULL, ub), (c) => office(c, t), ub < 0.9 ? 5 : 0);
    } else wallAndHall(g, t, TT);
    if (t < TT.craneS + 0.5) {
      const a = 1 - clamp((t - TT.craneS) / 0.4), pop = clamp((t - TT.backE + 0.1) / 0.18), q = clamp(hit(t, TT.backE - 0.1, 'heavy'));
      g.save(); g.globalAlpha *= a;
      if (pop > 0) {
        const sc = lerp(0.55, 1, q), oR = { x: PIP.x + (PIP.w * (1 - sc)) / 2, y: PIP.y + (PIP.h * (1 - sc)) / 2, w: PIP.w * sc, h: PIP.h * sc, r: PIP.r };
        g.save(); g.globalAlpha *= pop; placeWindow(g, oR, { s: VIEW_HER_PIP.s * sc, cx: VIEW_HER_PIP.cx, cy: VIEW_HER_PIP.cy }, (c) => room(c, t, s, { tired: 1, exag: 3.2 }), 5); g.restore();
        const look = win(t, TT.n20 - 0.05, TT.n20 + 1.5, 0.15); if (look > 0.01) { g.save(); g.strokeStyle = YEL; g.lineWidth = 11 * look; g.globalAlpha *= look; g.beginPath(); g.roundRect(PIP.x - 6, PIP.y - 6, PIP.w + 12, PIP.h + 12, PIP.r + 6); g.stroke(); g.restore(); }
      }
      callBar(g, t, TT); endButton(g, t, 0); ringsHUD(g, t, TT);
      g.restore();
    }
    // the third mistake
    if (t >= TT.paper && t < TT.fall + 0.1) { g.save(); g.globalAlpha *= 1 - clamp((t - TT.fall) / 0.1); stamp(g, 'PAPER', 700, 1040, t, TT.paper, INK, 150, -0.08, YEL); g.restore(); }
    if (t >= TT.n22 - 0.05 && t < TT.n22e + 0.45) title(g, 'WRONG DOOR', 1215, 150, YEL, t, TT.n22 - 0.05, { a: 1 - clamp((t - TT.n22e - 0.25) / 0.2), fit: 840 });
    if (t >= TT.n24 - 0.05 && t < TT.c01) title(g, 'HIS TEAM', 640, 200, YEL, t, TT.n24 - 0.05, { a: 1 - clamp((t - TT.c01 + 0.14) / 0.14), fit: 840 });
    if (t >= TT.c01 - 0.06 && t < TT.c01e + 0.32) bigTitle(g, clamp((t - TT.c01 + 0.06) * 9) * (1 - clamp((t - TT.c01e - 0.1) / 0.2)));
    if (t >= TT.n25 + 0.05 && t < TT.n25e + 0.5) { const q = clamp(hit(t, TT.n25 + 0.05, 'heavy')), a = clamp((t - TT.n25 - 0.05) * 8) * (1 - clamp((t - TT.n25e - 0.28) / 0.2)); g.save(); g.globalAlpha *= a; g.translate(CX, 1252); g.scale(lerp(0.86, 1, q), lerp(0.86, 1, q)); g.fillStyle = INK; R(g, -437, -70, 874, 134, 14); g.fill(); txt(g, '1.2 LAKH COMPLAINTS IN 2024', 0, 32, 96, CREAM, { align: 'center', fit: 830 }); g.restore(); }
  }

  function frame(g, t) {
    const TT = times();
    if (t >= TT.back) { ending(g, t, TT); return; }
    const u = ease((t - TT.swap) / 0.5), s = storyT(t, TT);
    g.save();
    const hR = mixR(PIP, FULL, u), hV = mixV(VIEW_HER_PIP, herCam(t, TT), u);
    const pop = clamp((t - TT.swap - 0.4) / 0.2), popQ = clamp(hit(t, TT.swap + 0.42, 'heavy'));
    const kn1 = [TT.knock, TT.knock + 0.235, TT.knock + 0.47], kn2 = [TT.knock2, TT.knock2 + 0.25, TT.knock2 + 0.505];
    const env = (L) => { let a = 0; for (const t0 of L) if (t >= t0) a = Math.max(a, Math.exp(-(t - t0) * 4)); return a; };
    const s1 = shakeAt(t, kn1, 15), s2 = shakeAt(t, kn2, 12), oz = 1 + 0.05 * env(kn1), hz = 1 + 0.045 * env(kn2);
    const oc = officeCam(t, TT); if (u < 0.999) placeWindow(g, FULL, { s: oc.s * oz, cx: oc.cx - s1[0] / oc.s, cy: oc.cy - s1[1] / oc.s }, (c) => office(c, t));
    placeWindow(g, hR, { s: hV.s * hz, cx: hV.cx - s2[0] / hV.s, cy: hV.cy - s2[1] / hV.s }, (c) => room(c, t, s, { tired: u, exag: lerp(3.2, 1, u) }), u < 0.5 ? 5 : 0);
    if (u < 0.98) { g.save(); g.globalAlpha *= (1 - u) * 0.16; g.fillStyle = '#16202e'; g.beginPath(); g.roundRect(hR.x, hR.y, hR.w, hR.h, hR.r); g.fill(); g.restore(); }
    if (pop > 0) { const sc = lerp(0.55, 1, popQ), oR = { x: PIP.x + (PIP.w * (1 - sc)) / 2, y: PIP.y + (PIP.h * (1 - sc)) / 2, w: PIP.w * sc, h: PIP.h * sc, r: PIP.r }; g.save(); g.globalAlpha *= pop;
      placeWindow(g, oR, { s: VIEW_HIM_PIP.s * sc, cx: VIEW_HIM_PIP.cx, cy: VIEW_HIM_PIP.cy }, (c) => office(c, t >= TT.R0 && t < TT.R2 ? s : t), 5); g.restore(); }
    callBar(g, t, TT);
    g.restore();
    endButton(g, t, 0);
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
