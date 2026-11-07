// Reel 26 · You're the Judge. Episode 4 of "You're the test subject", after The Only Witness (20), You Are the Only Suspect (23) and
// You're the Detective (25). You're the judge in a sunlit Indian courtroom. In a city of two crore people, someone robbed a woman at a
// chai stall and cut his hand on a glass (the glass the thief broke in episode 3); this man's blood matches. The prosecutor: only one
// person in ten thousand has this blood, "a one in ten thousand chance it was someone else". No witness, no video, just the blood.
// Guilty or not guilty? Whatever you said, you had two numbers: two crore people, one in ten thousand of them, is two thousand people
// with his blood, and the blood can't tell you which one robbed her. To be sure, you'd jail all two thousand. It's called the
// prosecutor's fallacy, and it fools lawyers too (Thompson & Schumann 1987; Lindsey, Hertwig & Gigerenzer 2003). One of the two
// thousand has a mole: four films, same thief, still free. He sat in the public gallery from frame 0, a plaster on his cut hand.
// Facts: docs/research.md. Our own drawings; nobody real. The face rig, the street, the stall, the friend and the thief are from reels
// 20, 23 and 25 (tags archive/reels-source-2026-11-04, source/reel-23-the-only-suspect, source/reel-25-youre-the-detective). 30 fps.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', PAPER = '#fbf7ec', YEL = '#ffd34a', CREAM = '#fff6e2', PINK = '#f0508a';
  const SAME_THIEF = true;                       // TWO is the thief of reels 20, 23 and 25 (the mole)
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

  // ------------------------------------------------------------------ the mouth and the eyes (the rig of reels 19, 20 and 23)
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
  const ONE = { skin: '#c99068', skinD: '#9d6747', skinH: '#e2b48d', hair: '#17110d', style: 'messy', must: null, stub: 0.2, brow: 13, browTilt: -12, jaw: 0.92, ew: 48, eh: 27 };
  const TWO = { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', style: 'neat', must: 'thin', stub: 0.25, brow: 15, browTilt: 1, jaw: 0.98, ew: 43, eh: 22, mole: SAME_THIEF ? [84, 62] : null };
  const THIEF20 = { ...TWO, style: 'cap', stub: 0.55, browTilt: 8, mole: [84, 62] };              // reel 20's thief, cap and all
  const DET = { skin: '#c08a62', skinD: '#97643f', skinH: '#deb08a', hair: '#1a120e', style: 'det', must: null, stub: 0, brow: 9, browTilt: -2, jaw: 0.93, ew: 45, eh: 26, lip: '#a33a40', specs: true, ear: true, bindi: true, lidW: 8 };
  const FRIEND = { skin: '#cc9470', skinD: '#a26c4a', skinH: '#e6b794', hair: '#16100c', style: 'side', must: null, stub: 0, brow: 13, browTilt: 4, jaw: 1.0, ew: 46, eh: 25 };
  const SELLER = { skin: '#a8704c', skinD: '#7f5032', skinH: '#c28c66', hair: '#100c09', style: 'buzz', must: 'thick', stub: 0, brow: 15, browTilt: 4, jaw: 1.05, ew: 42, eh: 22 };
  const PLAIN = { skin: '#bf8862', skinD: '#966141', skinH: '#d9a982', hair: '#18120e', style: 'side', must: null, stub: 0, brow: 12, browTilt: 2, jaw: 0.97, ew: 46, eh: 25 };

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
  // her phone: a pink case with a yellow flower on the back. In his pocket you see its top edge, a little pink, from frame 0.
  function herPhone(g, x, y, s, rot = 0, o = {}) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    R(g, -36, -66, 72, 132, 14); g.fillStyle = lg(g, -36, -66, 36, 66, [0, o.hot ? '#ff77a8' : '#ecbccd'], [1, o.hot ? '#d93a73' : '#d29ab1']); g.fill();
    g.strokeStyle = 'rgba(120,10,50,0.5)'; g.lineWidth = 3; g.stroke();
    if (o.screen) { R(g, -29, -58, 58, 116, 9); g.fillStyle = o.screen; g.fill(); }
    else { g.fillStyle = '#ffe04a'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ell(g, 10 * Math.cos(a), -14 + 10 * Math.sin(a), 6, 6); g.fill(); } g.fillStyle = '#e8892a'; ell(g, 0, -14, 5, 5); g.fill(); R(g, -26, -58, 22, 22, 7); g.fillStyle = '#2a2a2e'; g.fill(); }
    g.restore();
  }
  // a man sitting at the table, from the chest up. kind: 'jacket' (ONE) or 'shirt' (TWO, with the pocket and her phone in it)
  function seated(g, L, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.roll || 0);
    const by = 168;
    if (o.kind === 'jacket') {
      g.fillStyle = lg(g, -330, by, 330, by + 600, [0, '#ee7a2b'], [1, '#c4561a']);
      g.beginPath(); g.moveTo(-340, by + 1200); g.lineTo(-340, by + 430); g.bezierCurveTo(-336, by + 200, -230, by + 130, -96, by + 96); g.lineTo(96, by + 96); g.bezierCurveTo(230, by + 130, 336, by + 200, 340, by + 430); g.lineTo(340, by + 1200); g.closePath(); g.fill();
      g.fillStyle = '#5b5f66'; g.beginPath(); g.moveTo(-96, by + 92); g.lineTo(0, by + 250); g.lineTo(96, by + 92); g.closePath(); g.fill();       // the tee under it
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-60, by + 150); g.lineTo(-40, by + 1200); g.moveTo(60, by + 150); g.lineTo(40, by + 1200); g.stroke();
      g.fillStyle = '#d7dde3'; for (const k of [-1, 1]) { g.save(); g.translate(k * 200, by + 330); g.rotate(k * 0.06); R(g, -70, -14, 140, 28, 6); g.fill(); g.restore(); }   // reflective strips
      g.fillStyle = '#cf5e1e'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 96, by + 92); g.lineTo(k * 176, by + 70); g.lineTo(k * 150, by + 160); g.closePath(); g.fill(); }
    } else {
      g.fillStyle = o.body || lg(g, -320, by, 320, by + 600, [0, '#cfe3f3'], [1, '#9fc0dc']);
      g.beginPath(); g.moveTo(-330, by + 1200); g.lineTo(-330, by + 430); g.bezierCurveTo(-326, by + 200, -220, by + 130, -96, by + 96); g.lineTo(96, by + 96); g.bezierCurveTo(220, by + 130, 326, by + 200, 330, by + 430); g.lineTo(330, by + 1200); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 5; i++) { ell(g, 0, by + 240 + i * 84, 7, 7); g.fill(); }
      g.strokeStyle = 'rgba(40,70,100,0.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, by + 200); g.lineTo(0, by + 1200); g.stroke();
      g.fillStyle = '#e7f1fa'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 92, by + 80); g.lineTo(k * 10, by + 196); g.lineTo(k * 64, by + 206); g.lineTo(k * 150, by + 108); g.closePath(); g.fill(); }
      if (o.pocket !== false) {
        // the pocket on his right (your left), and her phone in it
        const px = -158, py = by + 112;
        if (o.phone !== false) {
          if (o.glow > 0) { g.fillStyle = rg(g, px + 2, py + 60, 4, 220, [0, `rgba(255,120,180,${0.85 * o.glow})`], [1, 'rgba(255,120,180,0)']); g.fillRect(px - 240, py - 180, 480, 480); }
          const jig = o.buzz ? Math.sin((o.t || 0) * 90) * 3.5 * o.buzz : 0;
          g.save(); g.beginPath(); g.rect(px - 70, py - 200, 140, 214); g.clip(); herPhone(g, px + 4 + jig, py + 58, 1.0, -0.04, o.glow > 0.4 ? { screen: '#fff2fa', hot: 1 } : {}); g.restore();
        }
        g.fillStyle = lg(g, px - 62, py, px + 62, py + 130, [0, '#c6dcef'], [1, '#a7c4de']); R(g, px - 62, py + 8, 124, 128, 10); g.fill();
        g.strokeStyle = 'rgba(40,70,100,0.16)'; g.lineWidth = 3; g.stroke();
        g.strokeStyle = 'rgba(40,70,100,0.2)'; g.lineWidth = 3; g.beginPath(); g.moveTo(px - 60, py + 18); g.lineTo(px + 60, py + 18); g.stroke();
        if (o.phone !== false) { g.fillStyle = 'rgba(60,90,120,0.07)'; R(g, px - 32, py + 20, 70, 104, 12); g.fill(); }
        if (o.glow > 0) { g.fillStyle = `rgba(255,150,200,${0.6 * o.glow})`; R(g, px - 32, py + 20, 70, 104, 12); g.fill(); }
      }
    }
    const nw = 70;
    g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 8, by + 110); g.quadraticCurveTo(0, by + 200, nw + 8, by + 110); g.lineTo(nw, 120); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,35,20,0.28)'; g.beginPath(); g.moveTo(-nw, 150); g.quadraticCurveTo(0, 235, nw, 150); g.lineTo(nw, 120); g.lineTo(-nw, 120); g.closePath(); g.fill();
    if (o.rub > 0) {
      // his hand goes to the back of his neck: the sleeve up the side of his head, the hand behind it, rubbing
      const k = sstep(0, 1, o.rub), rb = Math.sin((o.t || 0) * 11) * 12 * k;
      const ex = lerp(-300, -262, k), ey = lerp(by + 420, by - 30, k), hx = lerp(-300, -150, k), hy = lerp(by + 600, 70 + rb, k);
      g.strokeStyle = '#d8661f'; g.lineWidth = 104; g.lineCap = 'round'; g.beginPath(); g.moveTo(-290, by + 230); g.lineTo(ex, ey); g.stroke();
      g.lineWidth = 92; g.beginPath(); g.moveTo(ex, ey); g.lineTo(hx - 30, hy + 40); g.stroke();
      g.fillStyle = L.skin; ell(g, hx, hy, 46, 56, 0.4); g.fill();
    }
    head(g, L, o);
    g.restore();
  }

  // ------------------------------------------------------------------ the street: the stall, a dusk, drawn once (reels 20 and 23)
  let ST = null;
  function makeStreet() {
    const bg = offscreen(W, H); const g = bg.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, 980, [0, '#ee8f58'], [0.5, '#f7c384'], [1, '#fde4bb']); g.fillRect(0, 0, W, H);
    const r = mulberry32(44), cols = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#58a56a'];
    g.fillStyle = 'rgba(150,104,120,0.5)'; for (let x = -20, i = 0; x < W + 20; i++) { const w = 120 + r() * 120, hh = 300 + r() * 300; g.fillRect(x, 700 - hh, w, hh); x += w; }
    let x = -30, bi = 0;
    while (x < W + 40) {
      const w = 170 + r() * 120, hh = 420 + r() * 260, y0 = 920 - hh, c = cols[bi % cols.length]; bi++;
      g.fillStyle = c; g.fillRect(x, y0, w, hh + 40);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + w - 12, y0, 12, hh + 40);
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x, y0, w, 12);
      if (bi % 2) { g.fillStyle = '#23252a'; R(g, x + w * 0.56, y0 - 58, 62, 58, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + w * 0.56 + 8, y0 - 54, 7, 50); }
      for (let fy = y0 + 46; fy < 690; fy += 130) for (let fx = x + 26; fx < x + w - 60; fx += 86) {
        g.fillStyle = 'rgba(40,50,60,0.72)'; R(g, fx, fy, 54, 76, 4); g.fill();
        g.fillStyle = 'rgba(255,214,140,' + (r() > 0.45 ? 0.85 : 0.0) + ')'; R(g, fx + 3, fy + 3, 48, 70, 3); g.fill();
        g.strokeStyle = 'rgba(30,30,30,0.5)'; g.lineWidth = 3; g.beginPath(); for (let bb = 1; bb < 3; bb++) { g.moveTo(fx + bb * 18, fy); g.lineTo(fx + bb * 18, fy + 76); } g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(fx - 6, fy + 78, 66, 7);
      }
      x += w;
    }
    for (const [sx, tx, bgc, fg] of [[484, 'TAILORS', '#fff3cf', '#7a1f1f'], [692, 'SWEETS', '#b5341f', '#fff6d6'], [900, 'CHEMIST', '#0f7a4a', '#ffffff']]) {
      g.fillStyle = bgc; R(g, sx, 730, 198, 64, 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.stroke();
      txt(g, tx, sx + 99, 778, 44, fg, { align: 'center', fit: 176 });
      g.fillStyle = '#7d8086'; g.fillRect(sx + 6, 794, 186, 126); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); for (let yy = 800; yy < 920; yy += 9) { g.moveTo(sx + 6, yy); g.lineTo(sx + 192, yy); } g.stroke();
    }
    g.strokeStyle = 'rgba(30,25,20,0.7)'; g.lineWidth = 3;
    for (const [a, b, c2] of [[300, 240, 330], [340, 290, 390], [260, 180, 300]]) { g.beginPath(); g.moveTo(-20, a); g.quadraticCurveTo(W / 2, c2 + 90, W + 20, b); g.stroke(); }
    g.fillStyle = lg(g, 0, 920, 0, 1360, [0, '#6f6a66'], [1, '#4a4644']); g.fillRect(0, 920, W, 500);
    g.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = -1; i < 7; i++) g.fillRect(i * 200 + 40, 1040, 110, 8);
    for (let i = 0; i < 28; i++) { g.fillStyle = i % 2 ? '#f0d24a' : '#1c1c1c'; g.fillRect(i * 40, 1210, 40, 24); }
    g.fillStyle = lg(g, 0, 1234, 0, 1500, [0, '#b9ab97'], [1, '#8d8170']); g.fillRect(0, 1234, W, 700);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 1150, 470, 90);
    g.fillStyle = lg(g, 0, 700, 0, 1160, [0, '#4a3524'], [1, '#2a1d14']); g.fillRect(0, 700, 440, 470);
    for (let i = 0; i < 9; i++) { const px = 16 + i * 46, ph = 96 + (i % 3) * 16; g.fillStyle = ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#6cb33f'][i % 5]; g.fillRect(px, 690, 36, ph); g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(px + 6, 690, 6, ph); }
    g.fillStyle = lg(g, 0, 620, 0, 700, [0, '#2b6fb3'], [1, '#1f4f82']); g.beginPath(); g.moveTo(-10, 610); g.lineTo(476, 640); g.lineTo(476, 708); for (let i = 8; i >= 0; i--) { g.quadraticCurveTo(i * 58 + 29, 724, i * 58, 704); } g.closePath(); g.fill();
    g.fillStyle = lg(g, 0, 1000, 0, 1240, [0, '#a56b39'], [1, '#6e431f']); g.fillRect(0, 1010, 450, 230);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 6; i++) g.fillRect(0, 1050 + i * 34, 450, 3);
    R(g, 34, 1080, 216, 92, 6); g.fillStyle = '#23302a'; g.fill(); g.strokeStyle = '#8a6a3f'; g.lineWidth = 6; g.stroke();
    txt(g, 'CHAI 10/-', 142, 1146, 62, '#f4efe0', { align: 'center' });
    g.fillStyle = '#c99a5e'; g.fillRect(0, 996, 462, 22);
    for (const [jx, c] of [[34, '#d9a35a'], [104, '#c9743a']]) { g.fillStyle = 'rgba(235,240,245,0.5)'; R(g, jx, 906, 58, 92, 8); g.fill(); g.fillStyle = c; R(g, jx + 5, 932, 48, 62, 6); g.fill(); g.fillStyle = '#d33'; R(g, jx + 3, 898, 52, 14, 4); g.fill(); }
    g.fillStyle = '#8f949b'; R(g, 300, 900, 96, 92, 18); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; R(g, 312, 912, 14, 62, 7); g.fill(); g.strokeStyle = '#6a6e74'; g.lineWidth = 9; g.beginPath(); g.arc(396, 932, 26, -1.2, 1.2); g.stroke();
    g.fillStyle = '#ff9a2a'; ell(g, 348, 996, 34, 7); g.fill();
    for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(245,240,230,0.7)'; R(g, 186 + i * 22, 950, 18, 46, 4); g.fill(); g.fillStyle = '#b5752f'; R(g, 188 + i * 22, 966, 14, 28, 3); g.fill(); }
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, 716); g.quadraticCurveTo(240, 762, 490, 724); g.stroke();
    for (let i = 0; i < 10; i++) { const u = i / 9, bx = lerp(8, 470, u), by = 716 + 44 * Math.sin(u * Math.PI) - 8 * u + 8; g.fillStyle = rg(g, bx, by + 6, 2, 46, [0, 'rgba(255,214,130,0.75)'], [1, 'rgba(255,214,130,0)']); g.fillRect(bx - 46, by - 40, 92, 92); g.fillStyle = '#fff2c4'; ell(g, bx, by + 6, 8, 10); g.fill(); }
    g.fillStyle = rg(g, 220, 960, 40, 620, [0, 'rgba(255,190,110,0.2)'], [1, 'rgba(255,190,110,0)']); g.fillRect(0, 300, 900, 1300);
    g.fillStyle = rg(g, 540, 900, 620, 1240, [0, 'rgba(30,14,8,0)'], [1, 'rgba(30,14,8,0.34)']); g.fillRect(0, 0, W, H);
    ST = { bg };
  }
  function glass(g, x, y, s, rot, a = 1) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= a;
    g.fillStyle = 'rgba(245,240,230,0.28)'; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.lineTo(72, 130); g.lineTo(-72, 130); g.closePath(); g.fill();
    g.save(); g.beginPath(); g.moveTo(-90, -74); g.lineTo(90, -74); g.lineTo(70, 124); g.lineTo(-70, 124); g.closePath(); g.clip();
    g.fillStyle = lg(g, -90, -74, 90, 124, [0, '#d08a3e'], [1, '#8d4f1c']); g.fillRect(-100, -80, 200, 210);
    g.fillStyle = 'rgba(255,235,200,0.28)'; g.fillRect(-90, -74, 180, 14);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 4; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 27, -120); g.lineTo(i * 20, 128); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.stroke();
    g.restore();
  }
  function chaiHand(g, x, y, s, rot, hasGlass) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, 110, 110, 520, 720, [0, '#cf9670'], [1, '#9a6444']);
    g.beginPath(); g.moveTo(92, 110); g.bezierCurveTo(100, 66, 190, 40, 226, 84); g.lineTo(660, 680); g.lineTo(340, 860); g.closePath(); g.fill();
    g.fillStyle = lg(g, -130, -40, 110, 110, [0, '#c98e68'], [1, '#a9744f']);
    for (let i = 0; i < 4; i++) { R(g, -122 + i * 4, -48 + i * 42, 240, 38, 19); g.fill(); }
    ell(g, 128, 34, 84, 104); g.fillStyle = lg(g, 60, -60, 200, 130, [0, '#dba67f'], [1, '#b47c58']); g.fill();
    if (hasGlass) glass(g, 0, 0, 1, 0);
    g.save(); g.translate(150, 16); g.rotate(Math.PI + 0.2);
    R(g, 0, -27, 176, 54, 27); g.fillStyle = lg(g, 0, -27, 0, 27, [0, '#e4b08a'], [1, '#c48e68']); g.fill();
    g.strokeStyle = 'rgba(90,50,30,0.35)'; g.lineWidth = 2.5; g.stroke();
    R(g, 138, -17, 32, 34, 12); g.fillStyle = '#f2d6c0'; g.fill();
    g.restore();
    g.restore();
  }
  function steam(g, x, y, t, a = 0.5) {
    g.strokeStyle = `rgba(255,255,255,${a * 0.5})`; g.lineWidth = 12; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const ph = t * 1.1 + k * 2.1; g.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, px = x + (k - 1) * 34 + Math.sin(ph + u * 5) * 18 * u, py = y - u * 200; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1; }
  }
  // the glass in pieces on your table, and the chai running out (reel 20)
  const SHARDS = (() => { const r = mulberry32(9); return Array.from({ length: 24 }, () => ({ a: -0.25 - r() * 2.64, v: 300 + r() * 900, w: 16 + r() * 46, h: 18 + r() * 46, rs: (r() - 0.5) * 16, rest: 8 + r() * 110 })); })();
  function shards(g, d, x, y) {
    if (d < 0) return;
    const p = sstep(0, 0.5, d);
    g.fillStyle = 'rgba(140,76,26,0.95)'; ell(g, x + 20, y + 38, 240 * p, 44 * p, -0.03); g.fill();
    g.fillStyle = 'rgba(255,220,170,0.28)'; ell(g, x - 10, y + 28, 110 * p, 12 * p, -0.03); g.fill();
    g.fillStyle = 'rgba(226,232,235,0.6)'; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 66, y + 30); g.lineTo(x - 74, y - 16); g.lineTo(x - 42, y + 4); g.lineTo(x - 14, y - 30); g.lineTo(x + 18, y + 2); g.lineTo(x + 50, y - 22); g.lineTo(x + 66, y + 30); g.quadraticCurveTo(x, y + 52, x - 66, y + 30); g.closePath(); g.fill(); g.stroke();
    for (const q of SHARDS) {
      const tt = Math.min(d, 0.46), px = x + Math.cos(q.a) * q.v * tt, py = Math.min(y + q.rest, y + Math.sin(q.a) * q.v * tt + 2100 * tt * tt);
      g.save(); g.translate(px, py); g.rotate(q.rs * tt);
      g.fillStyle = 'rgba(232,238,240,0.72)'; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-q.w / 2, q.h / 2); g.lineTo(q.w / 2, q.h / 3); g.lineTo(q.w * 0.1, -q.h / 2); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
  }
  function policeTape(g, x0, y0, x1, y1) {
    const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
    g.save(); g.translate(x0, y0); g.rotate(a);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 8, L, 34);
    g.fillStyle = '#f2c81e'; g.fillRect(0, 0, L, 34);
    g.beginPath(); g.rect(0, 0, L, 34); g.clip();
    g.font = font(25, 'cond'); g.fillStyle = '#14130f'; g.textBaseline = 'middle';
    for (let x = 10; x < L; x += 292) g.fillText('POLICE LINE · DO NOT CROSS', x, 18);
    g.restore();
  }
  function seller(g, t) {
    g.save(); g.beginPath(); g.rect(0, 0, W, 998); g.clip();
    g.translate(270, 790 + 2 * Math.sin(t * 1.3)); g.scale(0.34, 0.34);
    g.fillStyle = lg(g, -300, 240, 300, 800, [0, '#f2eee2'], [1, '#d3cdbc']);
    g.beginPath(); g.moveTo(-330, 1000); g.lineTo(-330, 410); g.bezierCurveTo(-326, 300, -220, 246, -90, 205); g.lineTo(90, 205); g.bezierCurveTo(220, 246, 326, 300, 330, 410); g.lineTo(330, 1000); g.closePath(); g.fill();
    g.fillStyle = '#d9582a'; g.beginPath(); g.moveTo(-250, 262); g.lineTo(-140, 222); g.lineTo(-96, 660); g.lineTo(-224, 660); g.closePath(); g.fill();
    head(g, SELLER, { look: [14 * Math.sin(t * 0.8), 6], close: blinkAt(t, 3.1, 1.4) });
    g.restore();
  }
  // her: the woman who was robbed, facing you this time, between them and behind. A yellow kurta, a pink dupatta, a hand at her mouth.
  const HER = { skin: '#d49a72', skinD: '#a87250', skinH: '#ebbd96', hair: '#17100c', style: 'side', must: null, stub: 0, brow: 10, browTilt: -10, jaw: 0.9, ew: 46, eh: 27, lip: '#a33a40', bindi: true, lidW: 8 };
  function victim(g, x, y, s, t, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -260, 160, 260, 900, [0, '#f4c430'], [1, '#d99a1a']);
    g.beginPath(); g.moveTo(-280, 1100); g.lineTo(-270, 420); g.bezierCurveTo(-260, 260, -180, 210, -90, 196); g.lineTo(90, 196); g.bezierCurveTo(180, 210, 260, 260, 270, 420); g.lineTo(280, 1100); g.closePath(); g.fill();
    g.fillStyle = lg(g, -270, 180, 120, 700, [0, '#e0457b'], [1, '#b12a5e']); g.beginPath(); g.moveTo(-250, 260); g.quadraticCurveTo(-60, 190, 110, 240); g.lineTo(-40, 620); g.lineTo(-210, 560); g.closePath(); g.fill();
    const nw = 60; g.fillStyle = HER.skin; g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 6, 230); g.quadraticCurveTo(0, 290, nw + 6, 230); g.lineTo(nw, 120); g.closePath(); g.fill();
    head(g, HER, { look: o.look || [0, 2], close: blinkAt(t, 2.7, 0.6), frown: 0.7, worry: -4 });
    g.strokeStyle = HER.hair; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(150, 40); g.quadraticCurveTo(190, 220, 150, 420); g.stroke();   // her braid, over her shoulder
    g.fillStyle = 'rgba(253,228,187,0.18)'; g.fillRect(-400, -400, 800, 1600);
    g.restore();
  }
  const blinkAt = (t, p = 3.3, off = 1.1) => (((t + off) % p) < 0.11 ? 1 : 0);          // never on frame 0

  // ------------------------------------------------------------------ props on the table
  function table(g, y0 = 1318) {
    g.fillStyle = lg(g, 0, y0 - 24, 0, 1920, [0, '#8f6236'], [1, '#4a2e17']); g.beginPath(); g.moveTo(-40, y0 + 12); g.lineTo(1120, y0 - 12); g.lineTo(1120, 1980); g.lineTo(-40, 1980); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,240,210,0.3)'; g.beginPath(); g.moveTo(-40, y0 + 12); g.lineTo(1120, y0 - 12); g.lineTo(1120, y0 - 4); g.lineTo(-40, y0 + 20); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.13)'; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(-40, y0 + 12 + i * 92); g.lineTo(1120, y0 - 12 + i * 92); g.lineTo(1120, y0 - 9 + i * 92); g.lineTo(-40, y0 + 15 + i * 92); g.closePath(); g.fill(); }
  }
  function tent(g, x, y, n, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(-70, 40); g.lineTo(78, 40); g.lineTo(60, 52); g.lineTo(-62, 52); g.closePath(); g.fill();
    g.fillStyle = '#121212'; g.beginPath(); g.moveTo(-66, 42); g.lineTo(-54, -58); g.lineTo(54, -58); g.lineTo(66, 42); g.closePath(); g.fill();
    txt(g, String(n), 0, 28, 92, '#fff9ea', { kind: 'mono', align: 'center' });
    g.restore();
  }
  // your phone, lying on the table: dark, then CALLING
  function yourPhone(g, x, y, call, t, sc = 1) {
    g.save(); g.translate(x, y); g.rotate(-0.12); g.scale(sc, sc);
    g.fillStyle = 'rgba(0,0,0,0.3)'; R(g, -58, -100, 128, 210, 18); g.fill();
    R(g, -64, -108, 128, 210, 18); g.fillStyle = '#1b1c20'; g.fill();
    R(g, -56, -98, 112, 190, 12); g.fillStyle = call > 0 ? '#1f8f4e' : '#2a2c33'; g.fill();
    if (call > 0) {
      g.globalAlpha = clamp(call * 3);
      ell(g, 0, -44, 26, 26); g.fillStyle = '#ffe1ee'; g.fill(); ell(g, 0, -50, 11, 11); g.fillStyle = '#d93a73'; g.fill(); ell(g, 0, -28, 18, 11); g.fill();
      txt(g, 'CALLING', 0, 22, 30, '#ffffff', { align: 'center', fit: 100 });
      const d = Math.floor((t * 2.5) % 4); txt(g, '.'.repeat(d), 0, 46, 30, '#ffffff', { align: 'center' });
      ell(g, 0, 70, 15, 15); g.fillStyle = '#e8402a'; g.fill();
      g.globalAlpha = 1;
    }
    g.restore();
  }
  // your other hand, from the lower left, a finger on your phone
  function tapHand(g, x, y, u) {
    if (u <= 0.01) return;
    const k = sstep(0, 1, u), hx = lerp(-160, x, k), hy = lerp(2100, y, k);
    g.strokeStyle = '#b97a54'; g.lineWidth = 110; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - 300, hy + 420); g.lineTo(hx - 20, hy + 70); g.stroke();
    g.fillStyle = lg(g, hx - 60, hy, hx + 60, hy + 120, [0, '#d9a27a'], [1, '#b47c58']); ell(g, hx - 10, hy + 70, 70, 62, -0.6); g.fill();
    R(g, hx - 14, hy - 40, 34, 110, 17); g.fill();
  }
  function bubble(g, s, x, y, t, t0, o = {}) {      // a speech bubble; tail points at (o.tx, o.ty)
    if (t < t0) return;
    const q = pop(t, t0), w = o.w ?? 640, h = o.h ?? 116;
    g.save(); g.translate(x, y); g.scale(lerp(0.7, 1, q), lerp(0.7, 1, q)); g.globalAlpha *= clamp((t - t0) * 8) * (o.a ?? 1);
    R(g, -w / 2, -h / 2, w, h, 26); g.fillStyle = PAPER; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
    const tx = (o.tx ?? x) - x, tw = 34;
    g.beginPath(); g.moveTo(clamp(tx * 0.4, -w / 2 + 40, w / 2 - 80), h / 2 - 3); g.lineTo(tx * 0.7, h / 2 + 52); g.lineTo(clamp(tx * 0.4, -w / 2 + 40, w / 2 - 80) + tw * 1.8, h / 2 - 3); g.closePath(); g.fillStyle = PAPER; g.fill();
    g.beginPath(); g.moveTo(clamp(tx * 0.4, -w / 2 + 40, w / 2 - 80), h / 2); g.lineTo(tx * 0.7, h / 2 + 52); g.lineTo(clamp(tx * 0.4, -w / 2 + 40, w / 2 - 80) + tw * 1.8, h / 2); g.stroke();
    txt(g, s, 0, 24, o.size ?? 74, INK, { align: 'center', fit: w - 50 });
    g.restore();
  }
  function bars(g, k, x0 = 0, x1 = W, bw = 44) {
    if (k <= 0) return;
    const off = lerp(-H, 0, k), hw = bw / 2;
    g.save(); g.beginPath(); g.rect(x0, -100, x1 - x0, H + 200); g.clip(); g.translate(0, off);
    for (let i = 0; i < 8; i++) {
      const x = 30 + i * 146;
      g.fillStyle = lg(g, x - hw, 0, x + hw, 0, [0, '#16181c'], [0.35, '#6f747d'], [0.55, '#9ea3ab'], [1, '#1c1e23']); g.fillRect(x - hw, -40, bw, H + 80);
    }
    for (const yy of [430, 1250]) { g.fillStyle = lg(g, 0, yy - 22, 0, yy + 22, [0, '#16181c'], [0.4, '#7c818a'], [1, '#1c1e23']); g.fillRect(x0 - 10, yy - 22, x1 - x0 + 20, 44); }
    g.restore();
  }


  // ================================================================== reel 26 · the courtroom
  // the man on trial: an auto driver in khaki, a thick moustache, grey at the temples, worried. No mole, no cut.
  const AUTO = { skin: '#a8714a', skinD: '#7d4f30', skinH: '#c68f66', hair: '#16110d', style: 'side', must: 'thick', stub: 0.4, brow: 15, browTilt: -13, jaw: 1.03, ew: 45, eh: 26 };
  // the prosecutor: glasses, grey hair, sure of himself
  const PROS = { skin: '#c4916a', skinD: '#99674a', skinH: '#dcae88', hair: '#6a645e', style: 'neat', must: 'thin', stub: 0, brow: 13, browTilt: 8, jaw: 1.02, ew: 43, eh: 25, specs: true };
  // the public gallery (the thief is TWO: reel 25's number two, reel 20's thief, the mole)
  const G_OLD = { skin: '#b98256', skinD: '#8f5c38', skinH: '#d29d74', hair: '#e9e5dc', style: 'side', must: 'thick', stub: 0, brow: 13, browTilt: 2, jaw: 1.02, ew: 42, eh: 22 };
  const G_BUN = { skin: '#d6a07a', skinD: '#aa7552', skinH: '#ecc29c', hair: '#1a120e', style: 'det', must: null, stub: 0, brow: 9, browTilt: -2, jaw: 0.92, ew: 45, eh: 26, lip: '#a33a40', bindi: true, ear: true, lidW: 8 };
  const G_YOUNG = { skin: '#c48e66', skinD: '#9a6444', skinH: '#ddb08a', hair: '#130e0b', style: 'messy', must: null, stub: 0.1, brow: 12, browTilt: 0, jaw: 0.94, ew: 46, eh: 25 };
  const CS = 1.5;                                  // the court's background is drawn at 1.5x, so the camera can push in

  // a city through a window, or a whole city: dusk sky, the series' colours, windows lit
  function skyline(g, x, y, w, h, seed, o = {}) {
    g.save(); g.beginPath(); g.rect(x, y, w, o.noGround ? H : h); g.clip();
    if (!o.noSky) { g.fillStyle = lg(g, 0, y, 0, y + h, [0, '#f19a5c'], [0.55, '#f8c98d'], [1, '#fde7c2']); g.fillRect(x, y, w, h); }
    const r = mulberry32(seed), cols = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#58a56a', '#b9667f'];
    const base = y + h * (o.base ?? 0.92), sc = o.sc ?? 1;
    g.fillStyle = 'rgba(160,110,128,0.45)';
    if (!o.noBack) for (let bx = x - 20; bx < x + w + 20;) { const bw = (70 + r() * 90) * sc, bh = (h * 0.35 + r() * h * 0.3); g.fillRect(bx, base - bh - h * 0.12, bw, bh); bx += bw; }
    let bi = 0;
    for (let bx = x - 30; bx < x + w + 30;) {
      const bw = (90 + r() * 110) * sc, bh = h * (0.28 + r() * 0.36), y0 = base - bh, c = cols[(bi++ + seed) % cols.length];
      g.fillStyle = c; g.fillRect(bx, y0, bw, bh + h);
      g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(bx + bw - 8 * sc, y0, 8 * sc, bh + h);
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(bx, y0, bw, 6 * sc);
      if (bi % 3 === 0) { g.fillStyle = '#23252a'; R(g, bx + bw * 0.55, y0 - 30 * sc, 32 * sc, 30 * sc, 5 * sc); g.fill(); }
      const fw = 22 * sc, fh = 30 * sc;
      for (let fy = y0 + 18 * sc; fy < base - 10; fy += 52 * sc) for (let fx = bx + 12 * sc; fx < bx + bw - fw - 6 * sc; fx += 38 * sc) {
        g.fillStyle = 'rgba(40,50,60,0.7)'; g.fillRect(fx, fy, fw, fh);
        if (r() > 0.42) { g.fillStyle = 'rgba(255,214,140,0.9)'; g.fillRect(fx + 2 * sc, fy + 2 * sc, fw - 4 * sc, fh - 4 * sc); }
      }
      bx += bw;
    }
    if (!o.noGround) { g.fillStyle = '#6f6a66'; g.fillRect(x, base, w, h); }
    g.restore();
  }
  function pane(g, x, y, w, h, arch, seed) {          // a tall window in a green frame, the city behind it
    g.save();
    const path = () => { g.beginPath(); if (arch) { g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, TAU); g.lineTo(x + w, y + h); g.closePath(); } else g.rect(x, y, w, h); };
    g.fillStyle = '#c9a274'; g.save(); g.translate(0, 0); path(); g.lineWidth = 34; g.strokeStyle = '#d9b98c'; g.stroke(); g.restore();
    path(); g.save(); g.clip(); skyline(g, x, y, w, h, seed, { base: 0.97, sc: 0.8 }); g.restore();
    g.strokeStyle = '#2f6b5e'; g.lineWidth = 14; path(); g.stroke();
    g.lineWidth = 9; g.beginPath(); g.moveTo(x + w / 2, y + (arch ? 0 : 0)); g.lineTo(x + w / 2, y + h); for (let k = 1; k < 3; k++) { g.moveTo(x, y + h * k / 3 + (arch ? w * 0.15 : 0)); g.lineTo(x + w, y + h * k / 3 + (arch ? w * 0.15 : 0)); } g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.12)'; path(); g.fill();
    g.fillStyle = '#d9b98c'; g.fillRect(x - 26, y + h, w + 52, 22); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x - 26, y + h + 18, w + 52, 6);
    g.restore();
  }
  const WIN = { x: 300, y: 330, w: 460, h: 560 };     // the big window behind the dock
  let CT = null;
  function makeCourt() {
    const bg = offscreen(W * CS, H * CS), g = bg.getContext('2d'); g.scale(CS, CS);
    // the ceiling, beams, the wall
    g.fillStyle = lg(g, 0, 0, 0, 262, [0, '#cfae80'], [1, '#e6cba0']); g.fillRect(0, 0, W, 262);
    g.fillStyle = 'rgba(120,80,40,0.22)'; for (let i = 0; i < 4; i++) g.fillRect(0, 30 + i * 58, W, 9);
    g.fillStyle = lg(g, 0, 262, 0, 960, [0, '#f7e6c6'], [1, '#eed3a9']); g.fillRect(0, 262, W, 700);
    g.fillStyle = '#c99f6c'; g.fillRect(0, 254, W, 18); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, 254, W, 4);
    // windows
    pane(g, WIN.x, WIN.y, WIN.w, WIN.h, true, 3);
    pane(g, 40, 400, 170, 460, false, 8); pane(g, 870, 400, 170, 460, false, 12);
    // the wood below: a panelled wainscot
    g.fillStyle = lg(g, 0, 900, 0, 1180, [0, '#93613a'], [1, '#6b4224']); g.fillRect(0, 900, W, 290);
    g.fillStyle = 'rgba(255,220,170,0.25)'; g.fillRect(0, 900, W, 6);
    for (let i = 0; i < 7; i++) { const px = 22 + i * 158; g.strokeStyle = 'rgba(40,20,8,0.35)'; g.lineWidth = 4; R(g, px, 930, 128, 220, 6); g.stroke(); g.strokeStyle = 'rgba(255,220,170,0.16)'; g.lineWidth = 2; R(g, px + 4, 934, 120, 212, 5); g.stroke(); }
    // the floor of the well, in front of the gallery
    g.fillStyle = lg(g, 0, 1170, 0, 1920, [0, '#cdb894'], [1, '#a8936f']); g.fillRect(0, 1170, W, 760);
    g.strokeStyle = 'rgba(90,70,40,0.18)'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-200 + i * 180, 1920); g.lineTo(380 + i * 40, 1170); g.stroke(); } for (let j = 0; j < 6; j++) { const yy = 1170 + j * j * 22 + j * 30; g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke(); }
    // sunlight from the windows
    g.globalCompositeOperation = 'lighter';
    for (const [x0, x1] of [[WIN.x + 40, WIN.x + WIN.w - 40], [70, 190], [890, 1010]]) { g.fillStyle = 'rgba(255,214,150,0.07)'; g.beginPath(); g.moveTo(x0, 600); g.lineTo(x1, 600); g.lineTo(x1 + 240, 1920); g.lineTo(x0 + 120, 1920); g.closePath(); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    CT = { bg };
  }
  function fan(g, x, y, t, s = 1) {                // a ceiling fan, turning slowly
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#5a3f2a'; g.fillRect(-4, -200, 8, 196);
    g.save(); g.scale(1, 0.28); g.rotate(t * 3.1);
    for (let i = 0; i < 3; i++) { g.rotate(TAU / 3); g.fillStyle = '#6b4a30'; R(g, 14, -18, 190, 36, 16); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; R(g, 20, -16, 170, 8, 4); g.fill(); }
    g.restore();
    g.fillStyle = '#7d5a3c'; ell(g, 0, 0, 34, 16); g.fill(); g.fillStyle = '#4a3220'; ell(g, 0, 8, 22, 10); g.fill();
    g.restore();
  }
  function wallClock(g, x, y, t, r = 50) {
    g.save(); g.translate(x, y);
    ell(g, 0, 0, r + 8, r + 8); g.fillStyle = '#6b4224'; g.fill(); ell(g, 0, 0, r, r); g.fillStyle = '#fbf6e8'; g.fill();
    g.strokeStyle = '#2a2320'; g.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.lineWidth = i % 3 ? 2 : 4; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); g.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); g.stroke(); }
    const sec = Math.floor(t), am = (-0.25 + (10 * 60 + 52 + t / 60) / 60) * TAU, ah = (-0.25 + (2 + 52 / 60) / 12) * TAU, as = (-0.25 + sec / 60) * TAU;
    g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ah) * r * 0.5, Math.sin(ah) * r * 0.5); g.stroke();
    g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(am) * r * 0.74, Math.sin(am) * r * 0.74); g.stroke();
    g.strokeStyle = '#c4302b'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(as) * r * 0.82, Math.sin(as) * r * 0.82); g.stroke();
    g.restore();
  }

  // ------------------------------------------------------------------ the people
  function neck(g, L, by) {
    const nw = 70;
    g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 8, by + 110); g.quadraticCurveTo(0, by + 200, nw + 8, by + 110); g.lineTo(nw, 120); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,35,20,0.28)'; g.beginPath(); g.moveTo(-nw, 150); g.quadraticCurveTo(0, 235, nw, 150); g.lineTo(nw, 120); g.lineTo(-nw, 120); g.closePath(); g.fill();
  }
  const TORSO = (g, by) => { g.beginPath(); g.moveTo(-340, by + 1200); g.lineTo(-340, by + 430); g.bezierCurveTo(-336, by + 200, -230, by + 130, -96, by + 96); g.lineTo(96, by + 96); g.bezierCurveTo(230, by + 130, 336, by + 200, 340, by + 430); g.lineTo(340, by + 1200); g.closePath(); };
  // the man on trial, from the chest up: khaki, epaulettes, two pens in his pocket, a brass badge
  function accused(g, x, y, s, t, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.roll || 0);
    const by = 168;
    g.fillStyle = lg(g, -330, by, 330, by + 700, [0, '#d4b774'], [1, '#a5864a']); TORSO(g, by); g.fill();
    g.fillStyle = '#b89a58'; for (const k of [-1, 1]) { g.save(); g.translate(k * 228, by + 156); g.rotate(k * 0.34); R(g, -72, -16, 144, 32, 10); g.fill(); g.fillStyle = '#8a6d32'; ell(g, k * 52, 0, 7, 7); g.fill(); g.restore(); }
    g.strokeStyle = 'rgba(80,60,20,0.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, by + 200); g.lineTo(0, by + 1200); g.stroke();
    g.fillStyle = '#7a5f2a'; for (let i = 0; i < 4; i++) { ell(g, 0, by + 250 + i * 92, 8, 8); g.fill(); }
    g.fillStyle = '#c2a35e'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 92, by + 80); g.lineTo(k * 10, by + 196); g.lineTo(k * 64, by + 206); g.lineTo(k * 150, by + 108); g.closePath(); g.fill(); }
    g.fillStyle = '#c0a05c'; R(g, -236, by + 262, 132, 138, 10); g.fill(); g.strokeStyle = 'rgba(80,60,20,0.3)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#2b5fa8'; R(g, -206, by + 226, 13, 64, 5); g.fill(); g.fillStyle = '#c4302b'; R(g, -180, by + 234, 13, 56, 5); g.fill();
    g.fillStyle = '#e2bf4a'; ell(g, 168, by + 296, 30, 22); g.fill(); g.strokeStyle = '#9a7a20'; g.lineWidth = 3; g.stroke();
    neck(g, AUTO, by);
    head(g, AUTO, o);
    g.strokeStyle = 'rgba(214,208,198,0.75)'; g.lineWidth = 6; g.lineCap = 'round';           // grey at the temples
    for (const k of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(k * (188 + i * 3), -40 - i * 22); g.quadraticCurveTo(k * (196 + i * 2), -70 - i * 22, k * (190 + i * 2), -96 - i * 22); g.stroke(); }
    g.restore();
  }
  // the prosecutor, standing: a black coat, a white shirt, the white bands at the throat. point: his finger goes up
  function advocate(g, x, y, s, t, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const by = 168, pt = sstep(0, 1, o.point || 0);
    g.fillStyle = lg(g, -330, by, 330, by + 800, [0, '#2c2f37'], [1, '#121318']); TORSO(g, by); g.fill();
    g.fillStyle = '#f4f2ea'; g.beginPath(); g.moveTo(-104, by + 92); g.lineTo(0, by + 440); g.lineTo(104, by + 92); g.closePath(); g.fill();
    g.fillStyle = '#1b1d23'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 104, by + 92); g.lineTo(k * 6, by + 470); g.lineTo(k * 120, by + 330); g.lineTo(k * 190, by + 150); g.closePath(); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 4; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 104, by + 92); g.lineTo(k * 6, by + 470); g.stroke(); }
    g.fillStyle = '#ffffff'; R(g, -40, by + 106, 36, 128, 6); g.fill(); R(g, 4, by + 106, 36, 128, 6); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 2; R(g, -40, by + 106, 36, 128, 6); g.stroke(); R(g, 4, by + 106, 36, 128, 6); g.stroke();
    neck(g, PROS, by);
    // the arm on your side of him (his left), coming up with one finger
    if (pt > 0.01) {
      const sx = 250, sy = by + 230, ex = lerp(300, 330, pt), ey = lerp(by + 640, by - 40, pt), hx = lerp(310, 300, pt), hy = lerp(by + 900, -250, pt);
      g.strokeStyle = '#1f2128'; g.lineCap = 'round'; g.lineWidth = 120; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
      g.lineWidth = 104; g.beginPath(); g.moveTo(ex, ey); g.lineTo(hx, hy + 70); g.stroke();
      g.fillStyle = '#f4f2ea'; ell(g, hx, hy + 60, 56, 26); g.fill();
      // an index finger, unmistakably: it rises from the thumb side of the fist; the other three are curled, the thumb across them
      const ink = 'rgba(90,50,30,0.45)';
      g.fillStyle = PROS.skin; ell(g, hx, hy, 54, 58); g.fill();
      g.save(); g.translate(hx - 30, hy - 40); g.rotate(-0.12); R(g, -17, -128, 34, 140, 17); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(90,50,30,0.3)'; g.beginPath(); g.moveTo(-10, -70); g.lineTo(10, -70); g.moveTo(-10, -30); g.lineTo(10, -30); g.stroke(); g.restore();
      for (let i = 0; i < 3; i++) { g.fillStyle = PROS.skinH; ell(g, hx + 28, hy - 36 + i * 30, 30, 17, 0.1); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.stroke(); }
      g.strokeStyle = PROS.skinD; g.lineWidth = 28; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - 46, hy + 18); g.lineTo(hx + 4, hy - 10); g.stroke();
      g.strokeStyle = PROS.skin; g.lineWidth = 22; g.beginPath(); g.moveTo(hx - 46, hy + 18); g.lineTo(hx + 4, hy - 10); g.stroke();
    }
    head(g, PROS, o);
    g.restore();
  }
  // somebody in the public gallery, from the chest up
  function sitter(g, L, x, y, s, top, t, o = {}) {
    seated(g, L, x, y, s, { kind: 'shirt', pocket: false, body: top, look: o.look || [0, 1], close: o.close ?? 0, smile: o.smile ?? 0, frown: o.frown ?? 0, t });
  }
  // the thief's hand on the rail in front of him: a white plaster across the back of it
  function thiefHand(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, 0, -60, 0, 60, [0, '#c6dcef'], [1, '#9fc0dc']); R(g, -140, -46, 120, 96, 40); g.fill();      // his sleeve
    g.fillStyle = TWO.skin; ell(g, 0, 0, 80, 48, -0.08); g.fill();
    g.strokeStyle = TWO.skinD; g.lineWidth = 7; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(52, -30 + i * 20); g.quadraticCurveTo(94, -26 + i * 20, 92, -6 + i * 20); g.stroke(); }
    g.save(); g.rotate(-0.32); g.fillStyle = '#f7f3ea'; R(g, -50, -18, 100, 36, 10); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(200,60,60,0.35)'; R(g, -14, -10, 28, 20, 5); g.fill(); g.restore();
    g.restore();
  }
  // the gallery: who sits where. FRONT row (big), BACK row (small). The thief is on the right, front row.
  const THIEF = { x: 868, y: 1034, s: 0.37 };
  const TWO_G = { ...TWO, moleR: 16 };            // his face is small in the gallery: a bigger mole, so it reads on a phone
  function gallery(g, t, o = {}) {
    if (o.empty) return;
    const bl = (p, off) => blinkAt(t, p, off);
    sitter(g, G_YOUNG, 372, 968, 0.24, '#5b8fd1', t, { close: bl(3.7, 0.4), look: [4, 2] });
    sitter(g, G_OLD, 704, 962, 0.24, '#f1efe8', t, { close: bl(4.3, 2.0), look: [-4, 2], frown: 0.3 });
    sitter(g, G_OLD, 948, 968, 0.24, '#3e9a6e', t, { close: bl(3.1, 1.2), look: [-6, 2] });
    // the bar between the public and the court, behind the front row's knees
    sitter(g, G_BUN, 292, 1034, 0.31, '#7c5bb0', t, { close: bl(3.3, 2.4), look: [8, 2], frown: 0.2 });
    sitter(g, PLAIN, 742, 1036, 0.31, '#d96f6a', t, { close: bl(2.9, 0.7), look: [-10, 3] });
    sitter(g, TWO_G, THIEF.x, THIEF.y, THIEF.s, null, t, { close: bl(4.6, 3.1), look: [0, 1], smile: 0.55 });
  }
  function bar(g, t, o = {}) {                     // the rail in front of the gallery, and the solid wood under it
    g.fillStyle = lg(g, 0, 1104, 0, 1700, [0, '#9a6a3e'], [0.35, '#7a4c28'], [1, '#5b3519']); g.fillRect(0, 1118, W, 600);
    g.strokeStyle = 'rgba(30,14,4,0.3)'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { R(g, 26 + i * 176, 1196, 148, 240, 8); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 1124, W, 10);
    g.fillStyle = lg(g, 0, 1100, 0, 1124, [0, '#c08c58'], [1, '#875a33']); R(g, -10, 1100, W + 20, 24, 10); g.fill();
    g.fillStyle = 'rgba(255,230,190,0.35)'; g.fillRect(0, 1102, W, 4);
    if (!o.empty) thiefHand(g, THIEF.x - 44, 1104, 0.42);
  }
  // the dock: rails and posts; his hands on the top rail (no plaster on either)
  function dock(g, t, o = {}) {
    const x0 = 285, x1 = 741, top = 1196;
    g.fillStyle = lg(g, 0, top + 100, 0, 1700, [0, '#8a5a33'], [1, '#5b3519']); g.fillRect(x0, top + 104, x1 - x0, 560);
    g.strokeStyle = 'rgba(30,14,4,0.35)'; g.lineWidth = 5; R(g, x0 + 34, top + 140, x1 - x0 - 68, 300, 10); g.stroke();
    g.strokeStyle = 'rgba(255,220,170,0.15)'; g.lineWidth = 3; R(g, x0 + 40, top + 146, x1 - x0 - 80, 288, 8); g.stroke();
    g.fillStyle = '#7a4c28'; for (let i = 0; i < 10; i++) { const bx = lerp(x0 + 40, x1 - 40, i / 9); R(g, bx - 9, top + 14, 18, 94, 7); g.fill(); g.fillStyle = 'rgba(255,220,170,0.18)'; g.fillRect(bx - 6, top + 16, 4, 88); g.fillStyle = '#7a4c28'; }
    g.fillStyle = lg(g, 0, top + 96, 0, top + 120, [0, '#b07a44'], [1, '#7a4c28']); R(g, x0 - 6, top + 96, x1 - x0 + 12, 22, 8); g.fill();
    for (const px of [x0, x1]) { g.fillStyle = lg(g, px - 22, 0, px + 22, 0, [0, '#6e4423'], [0.5, '#b07a44'], [1, '#5b3519']); R(g, px - 22, top - 46, 44, 600, 8); g.fill(); ell(g, px, top - 52, 30, 26); g.fillStyle = '#b07a44'; g.fill(); g.fillStyle = 'rgba(255,240,210,0.4)'; ell(g, px - 8, top - 60, 9, 7); g.fill(); }
    g.fillStyle = lg(g, 0, top - 16, 0, top + 18, [0, '#c69060'], [1, '#7a4c28']); R(g, x0 - 12, top - 16, x1 - x0 + 24, 32, 14); g.fill();
    g.fillStyle = 'rgba(255,240,210,0.35)'; g.fillRect(x0, top - 13, x1 - x0, 4);
    if (!o.empty) {
      const tr = o.tremble || 0;
      for (const [hx, k] of [[404, -1], [622, 1]]) {
        const jx = hx + Math.sin(t * 21 + k) * 1.5 * tr;
        g.fillStyle = AUTO.skin; ell(g, jx, top - 8, 52, 30); g.fill();
        g.strokeStyle = AUTO.skinD; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const fx = jx - 30 + i * 20; g.beginPath(); g.moveTo(fx, top - 22); g.quadraticCurveTo(fx + 2 * k, top + 6, fx, top + 20); g.stroke(); }
        g.fillStyle = '#c2a35e'; R(g, jx - 44 + k * 30, top - 30, 70, 30, 12); g.fill();                    // his cuffs
      }
    }
  }
  // your desk: the case file, your chai, your hand on the gavel (your sleeve is the judge's black)
  function gavel(g, t, up) {
    const PX = 900, PY = 1800, Lg = 236, a = Math.PI + lerp(0.44, 1.3, up);
    const hx = PX + Math.cos(a) * Lg, hy = PY + Math.sin(a) * Lg;
    g.fillStyle = 'rgba(0,0,0,0.3)'; ell(g, 688, 1742, 110, 26); g.fill();
    g.fillStyle = lg(g, 590, 1700, 790, 1740, [0, '#5a3418'], [0.5, '#8a5a33'], [1, '#4a2a12']); ell(g, 690, 1728, 104, 26); g.fill(); g.fillRect(586, 1710, 208, 18); ell(g, 690, 1710, 104, 26); g.fillStyle = '#9a6a3e'; g.fill();
    g.save(); g.translate(hx, hy); g.rotate(a + Math.PI / 2);
    g.fillStyle = lg(g, -70, 0, 70, 0, [0, '#4a2a12'], [0.45, '#a8743f'], [1, '#3b2110']); R(g, -78, -40, 156, 80, 22); g.fill();
    g.fillStyle = '#d9b26a'; R(g, -82, -42, 14, 84, 6); g.fill(); R(g, 68, -42, 14, 84, 6); g.fill();
    g.restore();
    g.strokeStyle = '#6e4423'; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.lineTo(PX + Math.cos(a) * 30, PY + Math.sin(a) * 30); g.stroke();
    g.strokeStyle = '#1d1e22'; g.lineWidth = 150; g.beginPath(); g.moveTo(PX + 60, PY + 120); g.lineTo(1180, 2100); g.stroke();
    g.fillStyle = '#f1efe6'; g.save(); g.translate(PX + 46, PY + 92); g.rotate(-0.95); R(g, -70, -22, 140, 44, 12); g.fill(); g.restore();
    g.fillStyle = lg(g, PX - 60, PY - 60, PX + 60, PY + 60, [0, '#d8a07a'], [1, '#a46d4a']); ell(g, PX, PY, 66, 56, -0.6); g.fill();
    g.strokeStyle = 'rgba(90,50,30,0.35)'; g.lineWidth = 4; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(PX - 40 + i * 10, PY - 30 + i * 22); g.quadraticCurveTo(PX - 64 + i * 8, PY - 6 + i * 22, PX - 46 + i * 6, PY + 18 + i * 18); g.stroke(); }
  }
  function desk(g, t, o = {}) {
    const y0 = 1600;
    g.fillStyle = lg(g, 0, y0, 0, 1920, [0, '#6e4121'], [1, '#3a200f']); g.fillRect(-60, y0, W + 120, 400);
    g.fillStyle = 'rgba(255,220,170,0.35)'; g.fillRect(-60, y0, W + 120, 6);
    g.save(); g.translate(330, 1742); g.rotate(-0.07);
    g.fillStyle = 'rgba(0,0,0,0.25)'; R(g, -166, -70, 340, 170, 8); g.fill();
    g.fillStyle = '#e9d29b'; R(g, -174, -84, 340, 168, 8); g.fill(); g.fillStyle = '#d8bd80'; R(g, -174, -84, 340, 30, 8); g.fill();
    g.fillStyle = '#b3262c'; g.fillRect(-40, -84, 16, 168); g.fillRect(-174, -6, 340, 12);
    g.restore();
    glass(g, 110, 1690, 0.52, 0.03); steam(g, 106, 1626, t, 0.5);
    gavel(g, t, o.up ?? 0);
  }

  // ------------------------------------------------------------------ the set, with a camera. o: z, cx, cy, px, py, shake, and the people's state
  const DX = 513, DY = 906, DS = 0.93;            // the man on trial
  const PRX = 118, PRY = 1186, PRS = 0.68;        // the prosecutor
  function court(g, t, o = {}) {
    if (!CT) makeCourt();
    const z = o.z ?? (1.0 + 0.008 * Math.sin(t * 0.5)), cx = o.cx ?? 513, cy = o.cy ?? 960, px = o.px ?? cx, py = o.py ?? cy;
    const [sx, sy] = o.shake || [0, 0];
    g.save(); g.translate(px + sx, py + sy); g.scale(z, z); g.translate(-cx, -cy);
    g.drawImage(CT.bg, 0, 0, W, H);
    fan(g, 250, 214, t, 0.9); fan(g, 800, 214, t + 0.7, 0.9);
    wallClock(g, 255, 640, t, 36);
    gallery(g, t, { empty: o.emptyGallery });
    bar(g, t, { empty: o.emptyGallery });
    if (!o.emptyDock && !o.soloPros) accused(g, DX + Math.sin(t * 19) * 1.0, DY + 2 * Math.sin(t * 1.6), DS, t, { look: o.dLook || [0, 2], close: o.dClose ?? blinkAt(t, 2.4, 0.9), op: o.dOp ?? 0, frown: o.dFrown ?? 0.5, worry: o.dWorry ?? -4, sweat: o.dSweat ?? 0.6, t });
    if (!o.soloPros) dock(g, t, { empty: o.emptyDock, tremble: 1 });
    const [qx, qy, qs] = o.prosAt || [PRX, PRY, PRS];
    if (!o.noPros) advocate(g, qx, qy, qs, t, { look: o.pLook || [14, 2], close: blinkAt(t, 3.6, 2.2), op: o.pOp ?? 0, smile: o.pSmile ?? 0.35, point: o.point ?? 0, t });
    desk(g, t, { up: o.up ?? 0 });
    g.restore();
  }
  const camOn = (x, y, z, k) => ({ z: lerp(1.0, z, k), cx: lerp(513, x, k), cy: lerp(960, y, k), px: 513, py: 960 });

  // ------------------------------------------------------------------ props for the inserts
  // the evidence bag: a cutting-chai glass, broken, his blood on the biggest piece
  function evidenceBag(g, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.22)'; R(g, -300, -330, 620, 700, 30); g.fill();
    g.fillStyle = 'rgba(236,244,250,0.55)'; R(g, -310, -350, 620, 700, 30); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#d93a3a'; g.fillRect(-310, -300, 620, 16); g.fillStyle = '#ffffff'; R(g, -150, -268, 300, 90, 10); g.fill(); g.strokeStyle = '#d93a3a'; g.lineWidth = 4; g.stroke();
    txt(g, 'EXHIBIT A', 0, -208, 56, '#b3262c', { align: 'center', kind: 'cond' });
    // the base of the glass and the pieces
    g.fillStyle = 'rgba(226,232,235,0.75)'; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-120, 200); g.lineTo(-138, 40); g.lineTo(-80, 90); g.lineTo(-40, -10); g.lineTo(10, 70); g.lineTo(60, 0); g.lineTo(100, 80); g.lineTo(130, 200); g.quadraticCurveTo(0, 250, -120, 200); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(160,90,40,0.55)'; R(g, -110, 150, 230, 50, 20); g.fill();
    const P = [[-210, -60, 0.4], [170, -80, -0.6], [190, 110, 0.9], [-220, 120, -0.3], [-30, -110, 0.2]];
    for (const [px, py, rr] of P) { g.save(); g.translate(px, py); g.rotate(rr); g.fillStyle = 'rgba(226,232,235,0.75)'; g.beginPath(); g.moveTo(-50, 34); g.lineTo(46, 22); g.lineTo(6, -46); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    // the blood: a smear down the biggest piece, and drops on the bag
    g.fillStyle = '#b3141c';
    // a smear wiped along the big piece's jagged edge, with runs dripping down the glass
    g.beginPath(); g.moveTo(-118, 70); g.lineTo(-84, 92); g.lineTo(-56, 52); g.lineTo(-30, 12); g.lineTo(-6, 58); g.lineTo(16, 84);
    g.bezierCurveTo(10, 104, -8, 100, -16, 118); g.bezierCurveTo(-24, 134, -40, 112, -52, 124); g.bezierCurveTo(-66, 140, -84, 118, -100, 126); g.bezierCurveTo(-116, 120, -124, 96, -118, 70); g.closePath(); g.fill();
    g.lineCap = 'round'; g.strokeStyle = '#b3141c';
    for (const [dx, y0, len, w0] of [[-92, 120, 70, 12], [-48, 122, 44, 9], [-20, 116, 92, 10]]) { g.lineWidth = w0; g.beginPath(); g.moveTo(dx, y0); g.lineTo(dx + 2, y0 + len); g.stroke(); ell(g, dx + 2, y0 + len + 4, w0 * 0.8, w0); g.fill(); }
    for (const [dx, dy, r0] of [[60, 160, 7], [-150, 40, 9], [120, 230, 6], [-70, 250, 5], [24, 215, 4]]) { ell(g, dx, dy, r0, r0 * 1.1); g.fill(); }
    g.fillStyle = '#7d0a10'; g.beginPath(); g.moveTo(-100, 92); g.lineTo(-62, 74); g.lineTo(-36, 50); g.lineTo(-30, 86); g.bezierCurveTo(-50, 104, -84, 110, -100, 92); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.4)'; ell(g, -78, 80, 10, 4, -0.5); g.fill();
    g.save(); g.translate(170, -80); g.rotate(-0.6); g.fillStyle = '#b3141c'; g.beginPath(); g.moveTo(-30, 20); g.quadraticCurveTo(0, -6, 30, 14); g.quadraticCurveTo(10, 30, -30, 20); g.fill(); ell(g, 6, 30, 10, 13); g.fill(); g.restore();
    g.restore();
  }
  // the lab's card: the two drops of blood, and MATCH
  function labCard(g, x, y, s, t, t0) {
    if (t < t0) return;
    const k = pop(t, t0);
    g.save(); g.translate(x, y); g.scale(s * lerp(0.7, 1, k), s * lerp(0.7, 1, k)); g.rotate(-0.04); g.globalAlpha *= clamp((t - t0) * 8);
    g.fillStyle = 'rgba(0,0,0,0.25)'; R(g, -236, -126, 480, 270, 18); g.fill();
    g.fillStyle = PAPER; R(g, -244, -140, 480, 270, 18); g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
    txt(g, 'BLOOD TEST', 0, -88, 40, '#55524c', { kind: 'mono', align: 'center' });
    for (const [dx, lab] of [[-120, 'THE GLASS'], [120, 'HIM']]) {
      g.fillStyle = '#c4141c'; g.beginPath(); g.moveTo(dx, -50); g.bezierCurveTo(dx + 34, -6, dx + 40, 20, dx + 40, 34); g.arc(dx, 34, 40, 0, Math.PI); g.bezierCurveTo(dx - 40, 20, dx - 34, -6, dx, -50); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.4)'; ell(g, dx - 14, 22, 8, 12); g.fill();
      txt(g, lab, dx, 116, 48, INK, { kind: 'semi', align: 'center', fit: 200 });
    }
    txt(g, '=', 0, 46, 80, INK, { align: 'center' });
    g.restore();
  }
  // the robbery: another chai stall, at night. A new woman (this is a new robbery); a man running off, his face never seen
  const NEWV = { skin: '#c99a76', skinD: '#9e6f4f', skinH: '#e2b896', hair: '#9a948c', style: 'det', must: null, stub: 0, brow: 9, browTilt: -12, jaw: 0.95, ew: 46, eh: 28, lip: '#9a3a3e', bindi: true, ear: true, lidW: 8 };
  function nightStreet(g, t) {
    if (!ST) makeStreet();
    g.drawImage(ST.bg, 0, 0);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#3a4a86'; g.fillRect(0, 0, W, H); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) { const u = i / 9, bx = lerp(8, 470, u), by = 716 + 44 * Math.sin(u * Math.PI) - 8 * u + 14; g.fillStyle = rg(g, bx, by, 2, 70, [0, 'rgba(255,200,120,0.5)'], [1, 'rgba(255,200,120,0)']); g.fillRect(bx - 70, by - 70, 140, 140); }
    g.fillStyle = rg(g, 230, 900, 20, 520, [0, 'rgba(255,170,90,0.28)'], [1, 'rgba(255,170,90,0)']); g.fillRect(0, 380, 760, 1100);
    g.restore();
  }
  function shockedWoman(g, x, y, s, t) {          // the woman who was robbed tonight, a hand at her mouth
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -270, 160, 270, 900, [0, '#2f8f6a'], [1, '#1f6b4e']);
    g.beginPath(); g.moveTo(-280, 1100); g.lineTo(-270, 420); g.bezierCurveTo(-260, 260, -180, 210, -90, 196); g.lineTo(90, 196); g.bezierCurveTo(180, 210, 260, 260, 270, 420); g.lineTo(280, 1100); g.closePath(); g.fill();
    g.fillStyle = '#e8b84a'; g.beginPath(); g.moveTo(-240, 250); g.quadraticCurveTo(-40, 200, 150, 260); g.lineTo(150, 296); g.quadraticCurveTo(-40, 236, -240, 290); g.closePath(); g.fill();
    const nw = 60; g.fillStyle = NEWV.skin; g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 6, 230); g.quadraticCurveTo(0, 290, nw + 6, 230); g.lineTo(nw, 120); g.closePath(); g.fill();
    head(g, NEWV, { look: [16, 4], close: 0, op: 0.12, worry: -10 });
    g.strokeStyle = '#2f8f6a'; g.lineWidth = 96; g.lineCap = 'round'; g.beginPath(); g.moveTo(-250, 520); g.lineTo(-150, 330); g.stroke();
    g.save(); g.translate(-30, 126); g.rotate(0.35);
    g.fillStyle = NEWV.skin; ell(g, -30, 30, 46, 52); g.fill();
    for (let i = 0; i < 4; i++) { R(g, -46 + i * 26, -46, 24, 70, 12); g.fill(); }
    g.strokeStyle = NEWV.skinD; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-46 + i * 26, -36); g.lineTo(-46 + i * 26, 12); g.stroke(); }
    g.restore();
    g.restore();
  }
  function runner(g, x, y, s, t) {                 // a dark figure running away from you, his back to you
    const ph = t * 9.5, a = Math.sin(ph), b = Math.cos(ph);
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#121420';
    g.lineCap = 'round'; g.strokeStyle = '#121420';
    g.lineWidth = 46; g.beginPath(); g.moveTo(-20, 260); g.lineTo(-40 + 70 * a, 420); g.lineTo(-30 + 40 * a, 560); g.stroke();
    g.beginPath(); g.moveTo(20, 260); g.lineTo(40 - 70 * a, 420); g.lineTo(30 - 40 * a, 560); g.stroke();
    R(g, -70, 40, 140, 240, 50); g.fill();
    g.lineWidth = 34; g.beginPath(); g.moveTo(-60, 70); g.lineTo(-110 - 50 * b, 180); g.stroke(); g.beginPath(); g.moveTo(60, 70); g.lineTo(110 + 50 * b, 170); g.stroke();
    ell(g, 0, -10, 50, 58); g.fill();
    g.restore();
  }
  // ------------------------------------------------------------------ the lineup of two thousand: everyone in the city with his blood
  // 40 x 50 = 2,000 small portraits, like a lineup sheet (episode 1's lineup had six). The man on trial is one of them; so is the thief.
  const GRID = { cols: 40, rows: 50, cw: W / 40, ch: H / 50 };
  const DEF_CELL = [19, 24], THIEF_CELL = [28, 34];
  const cellXY = ([c, r]) => [(c + 0.5) * GRID.cw, (r + 0.5) * GRID.ch];
  const GS = 2;                                    // the sheet is drawn at 2x, so the camera can start close on one face
  let CROWD2K = null;
  function miniPerson(g, x, y, s, f) {             // one small portrait, centred on (x, y); s: pixels per unit
    const hx = x, hy = y - 5 * s;
    g.fillStyle = f.shirt; g.beginPath(); g.moveTo(x - 12.5 * s, y + 19 * s); g.quadraticCurveTo(x - 12 * s, y + 6 * s, x - 4 * s, y + 4.5 * s); g.lineTo(x + 4 * s, y + 4.5 * s); g.quadraticCurveTo(x + 12 * s, y + 6 * s, x + 12.5 * s, y + 19 * s); g.closePath(); g.fill();
    if (f.collar) { g.fillStyle = f.collar; g.beginPath(); g.moveTo(x - 4 * s, y + 4.5 * s); g.lineTo(x, y + 9 * s); g.lineTo(x + 4 * s, y + 4.5 * s); g.closePath(); g.fill(); }
    g.fillStyle = f.skin; g.fillRect(x - 2.4 * s, y + 1 * s, 4.8 * s, 4.5 * s);
    if (f.hair === 'long') { g.fillStyle = f.hc; R(g, x - 9.6 * s, hy - 9 * s, 19.2 * s, 21 * s, 8 * s); g.fill(); }
    ell(g, hx, hy, 8 * s, 9.6 * s); g.fillStyle = f.skin; g.fill();
    g.fillStyle = f.hc;
    if (f.hair === 'short' || f.hair === 'grey') { g.beginPath(); g.ellipse(hx, hy - 3.2 * s, 8.4 * s, 7 * s, 0, Math.PI * 1.02, Math.PI * 1.98); g.fill(); R(g, hx - 8.4 * s, hy - 4.6 * s, 16.8 * s, 2.8 * s, 1.4 * s); g.fill(); }
    else if (f.hair === 'side') { g.beginPath(); g.ellipse(hx, hy - 3.4 * s, 8.6 * s, 7.4 * s, 0, Math.PI, TAU); g.fill(); g.beginPath(); g.moveTo(hx - 8.6 * s, hy - 3 * s); g.quadraticCurveTo(hx - 2 * s, hy - 7 * s, hx + 3 * s, hy - 5.2 * s); g.lineTo(hx + 8.6 * s, hy - 3 * s); g.fill(); }
    else if (f.hair === 'long' || f.hair === 'bun') { g.beginPath(); g.ellipse(hx, hy - 3 * s, 8.6 * s, 7.6 * s, 0, Math.PI, TAU); g.fill(); if (f.hair === 'bun') { ell(g, hx, hy - 10.6 * s, 4 * s, 3.4 * s); g.fill(); } }
    if (f.temples) { g.fillStyle = 'rgba(220,214,204,0.9)'; g.fillRect(hx - 8.4 * s, hy - 4 * s, 1.6 * s, 3 * s); g.fillRect(hx + 6.8 * s, hy - 4 * s, 1.6 * s, 3 * s); }
    g.fillStyle = '#1a120c'; for (const k of [-1, 1]) { ell(g, hx + k * 3.3 * s, hy + 0.2 * s, 1.15 * s, 1.15 * s); g.fill(); }
    g.strokeStyle = 'rgba(40,20,10,0.75)'; g.lineWidth = 0.7 * s; g.lineCap = 'round';
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(hx + k * 1.8 * s, hy - 2.2 * s + (f.worry ? 0.6 * s * -k : 0)); g.lineTo(hx + k * 5 * s, hy - 2.4 * s); g.stroke(); }
    if (f.must) { g.fillStyle = f.mustC || '#1a120c'; R(g, hx - (f.must === 'thick' ? 3.4 : 2.6) * s, hy + 3.4 * s, (f.must === 'thick' ? 6.8 : 5.2) * s, (f.must === 'thick' ? 1.7 : 1.1) * s, 0.8 * s); g.fill(); }
    g.beginPath(); g.moveTo(hx - 2 * s, hy + 5.6 * s); g.quadraticCurveTo(hx, hy + 6.3 * s, hx + 2 * s, hy + 5.6 * s); g.stroke();
    if (f.bindi) { ell(g, hx, hy - 3.6 * s, 0.75 * s, 0.75 * s); g.fillStyle = '#b3141c'; g.fill(); }
    if (f.specs) { g.strokeStyle = '#2a2320'; g.lineWidth = 0.6 * s; for (const k of [-1, 1]) { ell(g, hx + k * 3.3 * s, hy + 0.2 * s, 2.4 * s, 2 * s); g.stroke(); } }
    if (f.mole) { ell(g, hx + 4.6 * s, hy + 3.3 * s, 1.1 * s, 1.05 * s); g.fillStyle = '#2a1710'; g.fill(); }
  }
  function makeCrowd() {
    const c = offscreen(W * GS, H * GS), g = c.getContext('2d'); g.scale(GS, GS);
    g.fillStyle = '#e6dfcc'; g.fillRect(0, 0, W, H);
    const r = mulberry32(2000);
    const skins = ['#c99068', '#b27a54', '#a8714a', '#8d5a3a', '#d6a07a', '#c48e66', '#e2b48d', '#9d6747', '#6b4128'];
    const hairs = ['#16110d', '#1a120e', '#2a1a10', '#3a2a1e'];
    const shirts = ['#5b8fd1', '#f1efe8', '#d96f6a', '#3e9a6e', '#e8b84a', '#7c5bb0', '#c9845a', '#9aa0a8', '#2f4d7a', '#e0457b', '#58a56a', '#f07a2b', '#b9667f'];
    const styles = ['short', 'short', 'side', 'side', 'long', 'bun', 'grey', 'bald'];
    for (let row = 0; row < GRID.rows; row++) for (let col = 0; col < GRID.cols; col++) {
      const x = col * GRID.cw, y = row * GRID.ch, cx = x + GRID.cw / 2, cy = y + GRID.ch / 2;
      g.fillStyle = (row + col) % 2 ? '#efe9d9' : '#ebe4d2'; g.fillRect(x + 0.6, y + 0.6, GRID.cw - 1.2, GRID.ch - 1.2);
      g.save(); g.beginPath(); g.rect(x + 0.6, y + 0.6, GRID.cw - 1.2, GRID.ch - 1.2); g.clip();
      const hair = styles[Math.floor(r() * styles.length)], woman = hair === 'long' || hair === 'bun';
      let f = { skin: skins[Math.floor(r() * skins.length)], hc: hair === 'grey' ? '#cfc9bf' : hairs[Math.floor(r() * hairs.length)], hair, shirt: shirts[Math.floor(r() * shirts.length)],
        must: !woman && r() < 0.45 ? (r() < 0.5 ? 'thick' : 'thin') : null, bindi: woman && r() < 0.55, specs: r() < 0.14 };
      if (f.must && hair === 'grey') f.mustC = '#cfc9bf';
      if (col === DEF_CELL[0] && row === DEF_CELL[1]) f = { skin: AUTO.skin, hc: AUTO.hair, hair: 'side', shirt: '#c9ab66', collar: '#b89a58', must: 'thick', temples: true, worry: true };
      if (col === THIEF_CELL[0] && row === THIEF_CELL[1]) f = { skin: TWO.skin, hc: TWO.hair, hair: 'side', shirt: '#b8d3ea', collar: '#e7f1fa', must: 'thin', mole: true };
      miniPerson(g, cx, cy + 1.5, 1.0, f);
      g.restore();
    }
    CROWD2K = { c };
  }
  // the sheet, with a camera: z, focus [col, row] (pushed in, that face comes to the middle), dim; hl: the man on trial's frame (0..1)
  function crowd(g, t, o = {}) {
    if (!CROWD2K) makeCrowd();
    const z = o.z ?? 1, [fx, fy] = cellXY(o.focus || DEF_CELL), k = clamp((z - 1) / 2.5);
    const ax = lerp(fx, 540, k), ay = lerp(fy, 960, k);
    g.save();
    g.fillStyle = '#e6dfcc'; g.fillRect(0, 0, W, H);
    g.translate(ax, ay); g.scale(z, z); g.translate(-fx, -fy);
    g.drawImage(CROWD2K.c, 0, 0, W * GS, H * GS, 0, 0, W, H);
    if (o.hl > 0) {
      const [dx, dy] = cellXY(DEF_CELL);
      g.strokeStyle = YEL; g.lineWidth = 3.2 / Math.max(1, z * 0.5); g.globalAlpha = clamp(o.hl);
      R(g, dx - GRID.cw / 2 + 0.5, dy - GRID.ch / 2 + 0.5, GRID.cw - 1, GRID.ch - 1, 3); g.stroke(); g.globalAlpha = 1;
    }
    g.restore();
    if (o.dim) { g.fillStyle = `rgba(20,16,12,${o.dim})`; g.fillRect(0, 0, W, H); }
  }
  // ------------------------------------------------------------------ timing: the narration's words
  const at = (p) => words(p)[0].t0;
  const wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;
  const en = (p) => { const w = words(p); return w[w.length - 1].t1; };
  let T = null;
  function times() {
    if (T) return T;
    T = {
      titleOut: en('n01'), n02: at('n02'), crore: wi('n02', 4), stall: wi('n02', 7), n03: at('n03'), cut: wi('n03', 4), matchW: wi('n03', 12), matches: wi('n03', 15), n03e: en('n03'),
      p01: at('p01'), tenK: wi('p01', 6), p01e: en('p01'), p02: at('p02'), elseW: wi('p02', 7), p02e: en('p02'),
      n04: at('n04'), guilty: wi('n04', 6), n04e: en('n04'), d01: at('d01'), d01e: en('d01'), n05: at('n05'), heM: wi('n05', 4), n05e: en('n05'),
      n06: at('n06'), put: wi('n06', 4), n07: at('n07'), tenK2: wi('n07', 5), n08: at('n08'), twoK: wi('n08', 1),
      n09: at('n09'), itCant: wi('n09', 9), which: wi('n09', 13), n10: at('n10'), fallacy: wi('n10', 3), judges: wi('n10', 8),
      n11: at('n11'), met: wi('n11', 5), n12: at('n12'), same: wi('n12', 2), free: wi('n12', 4),
      n13: at('n13'), good: wi('n13', 7), dont: wi('n13', 10), n14: at('n14'), where: wi('n14', 1), end: tb('end'),
    };
    T.clock0 = T.n04e + 0.08; T.clock1 = T.n05e + 0.45;
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
  // the choice: GUILTY / NOT GUILTY, and a bar running out. Nothing picks for you: both fade when time is up.
  function choices(g, t, t0, gone0) {
    if (t < t0) return;
    const w = 400, gap = 36, x0 = 513 - w - gap / 2, y = 500, gone = clamp((t - gone0) / 0.25);
    ['GUILTY', 'NOT GUILTY'].forEach((s, i) => {
      const k = clamp(hit(t, t0 + i * 0.07, 'heavy')), sc = lerp(0.6, 1, k), x = x0 + i * (w + gap);
      g.save(); g.translate(x + w / 2, y); g.scale(sc, sc); g.globalAlpha = clamp((t - t0 - i * 0.07) * 8) * (1 - gone);
      R(g, -w / 2, -52, w, 104, 18); g.fillStyle = PAPER; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
      txt(g, s, 0, 24, 70, INK, { align: 'center', fit: w - 40 });
      g.restore();
    });
  }
  function timerBar(g, t, t0, t1) {              // drains from both ends to the middle, one colour: it points at neither button
    if (t < t0 || t >= t1) return;
    const u = clamp((t1 - t) / (t1 - t0)), half = 393 * u;
    R(g, 120, 572, 786, 20, 10); g.fillStyle = 'rgba(20,16,10,0.55)'; g.fill();
    if (half > 1) { R(g, 513 - half, 572, half * 2, 20, 10); g.fillStyle = '#ffb347'; g.fill(); }
  }
  function askOverlay(g, t) {                      // the question, the buttons and the clock, over whatever is on screen
    const TT = times();
    if (t < TT.guilty - 0.05 || t > TT.clock1 + 0.4) return;
    const a = 1 - clamp((t - TT.clock1) / 0.25);
    if (a > 0) title(g, 'GUILTY OR NOT GUILTY?', 392, 104, YEL, t, TT.guilty - 0.05, { a });
    choices(g, t, TT.guilty + 0.2, TT.clock1);
    timerBar(g, t, TT.clock0, TT.clock1);
  }
  // a speech bubble whose tail points at (tx, ty), above or below; s: a string or a list of lines
  function say(g, s, x, y, t, t0, o = {}) {
    if (t < t0) return;
    const lines = Array.isArray(s) ? s : [s], size = o.size ?? 66, lh = size * 1.08;
    const q = pop(t, t0), w = o.w ?? 700, h = o.h ?? (lines.length * lh + size * 0.62), tx = (o.tx ?? x) - x, ty = (o.ty ?? y + 200) - y, down = ty > 0;
    g.save(); g.translate(x, y); g.scale(lerp(0.7, 1, q), lerp(0.7, 1, q)); g.globalAlpha *= clamp((t - t0) * 8) * (o.a ?? 1);
    const ex = clamp(tx * 0.35, -w / 2 + 50, w / 2 - 110), ey = down ? h / 2 - 3 : -h / 2 + 3;
    g.fillStyle = PAPER; g.strokeStyle = INK; g.lineWidth = 6;
    g.beginPath(); g.moveTo(ex, ey); g.lineTo(tx * 0.6, down ? h / 2 + 56 : -h / 2 - 56); g.lineTo(ex + 60, ey); g.closePath(); g.fill(); g.stroke();
    R(g, -w / 2, -h / 2, w, h, 26); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(ex + 4, ey); g.lineTo(ex + 56, ey); g.strokeStyle = PAPER; g.lineWidth = 9; g.stroke();
    lines.forEach((ln, i) => txt(g, ln, 0, size * 0.36 + (i - (lines.length - 1) / 2) * lh, size, INK, { align: 'center', fit: w - 50 }));
    g.restore();
  }

  // ------------------------------------------------------------------ 1 · frame 0, and the city in the window behind him
  function shotOpen(g, t) {
    const TT = times(), k = sstep(TT.n02 - 0.1, TT.n02 + 1.4, t);
    court(g, t, { ...camOn(540, 900, 1.05, k) });
    const out = sstep(TT.titleOut - 0.05, TT.titleOut + 0.15, t);
    if (out < 1) {
      g.save(); g.globalAlpha = 1 - out;
      txt(g, "YOU'RE THE", 513, 360, 104, CREAM, { align: 'center', stroke: INK, sw: 0.14 });
      txt(g, 'JUDGE', 513, 520, 180, YEL, { align: 'center', fit: 860, stroke: INK, sw: 0.14 });
      g.restore();
    }
    if (t >= TT.crore - 0.08) {
      title(g, '2 CRORE PEOPLE', 420, 150, YEL, t, TT.crore - 0.08);
      title(g, '20,000,000', 520, 76, CREAM, t, TT.crore + 0.12);
    }
    return 0;
  }
  // ------------------------------------------------------------------ 2 · the robbery: another stall, at night. Nobody saw his face.
  function shotNight(g, t) {
    const TT = times(), z = 1.36 + 0.05 * sstep(TT.stall, TT.cut, t);
    g.save(); g.translate(513, 1000); g.scale(z, z); g.translate(-470, -900);
    nightStreet(g, t);
    seller(g, t);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(80,96,160,0.55)'; g.fillRect(0, 600, 470, 420); g.restore();
    if (t >= TT.stall + 0.3) { const u = clamp((t - (TT.stall + 0.3)) / 2.4); runner(g, lerp(700, 790, u), lerp(770, 728, u), lerp(0.56, 0.36, u), t); }
    shockedWoman(g, 545, 770, 0.6, t);
    g.restore();
    g.fillStyle = lg(g, 0, 1300, 0, H, [0, 'rgba(10,14,30,0)'], [1, 'rgba(10,14,30,0.6)']); g.fillRect(0, 1300, W, 620);
    shards(g, 9, 560, 1440);
    if (t < TT.n03 - 0.05) title(g, 'ROBBED', 400, 150, CREAM, t, TT.stall - 0.02);
    else title(g, 'NOBODY SAW HIS FACE', 400, 104, CREAM, t, TT.n03 - 0.05);
    return flashAt(t, TT.stall - 0.05) * 0.3;
  }
  // ------------------------------------------------------------------ 3 · he cut his hand on a glass, and the blood matches this man
  function shotBag(g, t) {
    const TT = times();
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#7a4a26'], [1, '#4a2a12']); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,220,170,0.1)'; for (let i = 0; i < 7; i++) g.fillRect(0, 300 + i * 230, W, 4);
    evidenceBag(g, 513, 1010, 1.3 + 0.04 * sstep(TT.cut, TT.matchW, t), t);
    title(g, "THE ROBBER'S BLOOD", 420, 110, CREAM, t, wi('n03', 7) - 0.05);
    return flashAt(t, TT.cut - 0.05) * 0.35;
  }
  // in close on him (close enough that the gallery's right end, and the thief, are out of the frame)
  function shotMatch(g, t) {
    const TT = times(), k = sstep(TT.matchW - 0.1, TT.matchW + 0.6, t);
    court(g, t, { ...camOn(513, 960, 1.75, k), dLook: [0, 3], dWorry: -8 });
    labCard(g, 513, 1398, 0.86, t, TT.matchW + 0.1);
    if (t >= TT.n03e - 0.02) stamp(g, 'MATCH', 513, 1450, t, TT.n03e, RED, 120, -0.08, 'rgba(255,255,255,0.95)');     // in the gap after "this man", with its sound
    return flashAt(t, TT.matchW - 0.05) * 0.3;
  }
  // ------------------------------------------------------------------ 4 · the prosecutor, from another angle: he has stepped forward; behind him the gallery
  const PROS_SOLO = [470, 1150, 0.98];
  function prosShot(g, t, o = {}) {
    court(g, t, { z: o.z ?? 1.0, cx: 513, cy: 960, soloPros: true, prosAt: PROS_SOLO, point: o.point ?? 0, pOp: o.pOp ?? 0, pLook: o.pLook || [0, 1], pSmile: o.pSmile ?? 0.45 });
  }
  const QUOTE = ['"A 1 IN 10,000 CHANCE', 'IT WAS SOMEONE ELSE."'];
  function shotPros(g, t) {
    const TT = times();
    const pt = sstep(TT.p01 + 0.25, TT.p01 + 0.75, t) * (1 - sstep(TT.p02e - 0.2, TT.p02e + 0.2, t));
    prosShot(g, t, { z: 1.0 + 0.04 * sstep(TT.p01, TT.p02e, t), point: pt, pOp: talkP(t, 'p01') || talkP(t, 'p02'), pLook: t >= TT.p02 - 0.1 ? [0, 1] : [10, 2] });
    if (t < TT.p02 - 0.05) {
      if (t >= TT.tenK - 0.08) { title(g, '1 IN 10,000', 430, 190, YEL, t, TT.tenK - 0.08); title(g, 'HAVE THIS BLOOD', 548, 84, CREAM, t, TT.tenK + 0.1); }
    } else say(g, QUOTE, 513, 452, t, TT.p02 - 0.04, { w: 880, size: 70, tx: 470, ty: 900 });
    return flashAt(t, TT.p01 - 0.05) * 0.25;
  }
  // ------------------------------------------------------------------ 5 · the blood is all there is. Guilty, or not guilty?
  function shotAsk(g, t) {
    const TT = times();
    court(g, t, { z: 1.03, cx: 513, cy: 960, dLook: [0, 2], dWorry: -6 });
    stamp(g, 'ONLY THE BLOOD', 513, 1430, t, TT.n04 + 0.1, RED, 104, -0.06, 'rgba(255,255,255,0.95)');
    return 0;
  }
  function shotPlea(g, t) {
    const TT = times(), k = sstep(TT.d01 - 0.15, TT.d01 + 0.3, t);
    court(g, t, { ...camOn(513, 940, 1.75, k), dOp: talkP(t, 'd01'), dLook: [0, 1], dWorry: -12, dFrown: 0.7, dSweat: 1 });
    say(g, ["JUDGE SAHAB, I WASN'T THERE."], 513, 1400, t, TT.d01 - 0.04, { w: 820, size: 60, tx: 513, ty: 1180 });
    return 0;
  }
  // "One in ten thousand. And he matches." The narrator leans on the number as the clock runs out (wide again: the whole court)
  function shotLean(g, t) {
    const TT = times();
    court(g, t, { z: 1.03, cx: 513, cy: 960, dLook: [0, 2], dWorry: -12, dFrown: 0.8, dSweat: 1 });
    title(g, '1 IN 10,000', 1330, 170, YEL, t, TT.n05 - 0.02);
    if (t >= TT.heM - 0.05) stamp(g, 'HE MATCHES', 513, 1470, t, TT.heM - 0.03, RED, 96, -0.06, 'rgba(255,255,255,0.95)');
    return flashAt(t, TT.n05 - 0.05) * 0.15;
  }
  // time's up: both choices fade. Nobody picks for you.
  function shotTimeUp(g, t) {
    court(g, t, { z: 1.03, cx: 513, cy: 960, dLook: [0, 2], dWorry: -10, dFrown: 0.8, dSweat: 1 });
    return 0;
  }
  // ------------------------------------------------------------------ 6 · you had two numbers. Did you put them together?
  function numCard(g, s1, s2, x, y, t, t0, sc = 1, col = YEL, a = 1) {
    if (t < t0 || a <= 0) return;
    const k = pop(t, t0);
    g.save(); g.translate(x, y); g.scale(sc * lerp(0.7, 1, k), sc * lerp(0.7, 1, k)); g.globalAlpha *= clamp((t - t0) * 8) * a;
    g.fillStyle = 'rgba(0,0,0,0.3)'; R(g, -196, -116, 400, 250, 22); g.fill();
    g.fillStyle = INK; R(g, -204, -128, 400, 250, 22); g.fill(); g.strokeStyle = col; g.lineWidth = 6; g.stroke();
    txt(g, s1, -4, 14, 108, col, { align: 'center', fit: 360 });
    txt(g, s2, -4, 92, 58, CREAM, { kind: 'semi', align: 'center', fit: 360 });
    g.restore();
  }
  function shotNumbers(g, t) {
    const TT = times();
    court(g, t, { z: 1.03, cx: 513, cy: 960, dLook: [0, 2], dWorry: -8 });
    g.fillStyle = 'rgba(16,12,10,0.66)'; g.fillRect(0, 0, W, H);
    const fade = 1 - sstep(TT.n07 - 0.1, TT.n07 + 0.2, t);
    numCard(g, '2 CRORE', '20,000,000 PEOPLE', 290, 860, t, TT.n06 + 0.05, 0.92, YEL, fade);
    numCard(g, '1 IN 10,000', 'HAVE HIS BLOOD', 736, 860, t, TT.n06 + 0.2, 0.92, '#ff7a5c', fade);
    if (t < TT.n07 - 0.05) {
      if (t >= TT.put - 0.05) title(g, 'DID YOU PUT THEM TOGETHER?', 1240, 78, YEL, t, TT.put - 0.05);
    } else {
      title(g, '20,000,000', 760, 170, YEL, t, TT.n07 - 0.02);
      if (t >= TT.tenK2 - 0.06) title(g, '÷ 10,000', 940, 150, '#ff7a5c', t, TT.tenK2 - 0.06);
      if (t >= TT.tenK2 + 0.35) { g.strokeStyle = CREAM; g.lineWidth = 8; g.beginPath(); g.moveTo(250, 1010); g.lineTo(lerp(250, 776, sstep(TT.tenK2 + 0.35, TT.tenK2 + 0.6, t)), 1010); g.stroke(); txt(g, '= ?', 513, 1150, 130, CREAM, { align: 'center', a: sstep(TT.tenK2 + 0.5, TT.tenK2 + 0.7, t) }); }
    }
    return flashAt(t, TT.n06 - 0.05) * 0.2;
  }
  // ------------------------------------------------------------------ 7 · two thousand people with his blood: a lineup of two thousand, and he's one face in it
  function shotCrowd(g, t) {
    const TT = times();
    if (t >= TT.itCant - 0.05) {
      // "It can't tell you which one." Back to him: one of two thousand
      court(g, t, { ...camOn(513, 940, 1.75, 1), dLook: [0, 1], dWorry: -12, dFrown: 0.8, dSweat: 1 });
      g.fillStyle = 'rgba(120,10,10,0.18)'; g.fillRect(0, 0, W, H);
      title(g, 'WHICH ONE?', 1420, 170, YEL, t, TT.which - 0.05);
      return flashAt(t, TT.itCant - 0.05) * 0.25;
    }
    const out = sstep(TT.n08 - 0.05, TT.twoK + 0.7, t), z = lerp(3.4, 1.0, out) + 0.05 * sstep(TT.n09, TT.itCant, t);
    crowd(g, t, { z, focus: DEF_CELL, hl: 1 - sstep(TT.twoK + 0.9, TT.twoK + 1.5, t) * 0.6 });
    if (t >= TT.twoK - 0.08) {
      const n = Math.round(2000 * sstep(TT.twoK - 0.1, TT.twoK + 0.6, t));
      g.fillStyle = 'rgba(14,10,10,0.78)'; R(g, 160, 296, 706, 300, 28); g.fill();
      txt(g, n.toLocaleString('en-US'), 513, 470, 190, '#ff5a3a', { align: 'center', stroke: INK, sw: 0.08 });
      txt(g, 'PEOPLE WITH HIS BLOOD', 513, 560, 64, CREAM, { align: 'center', fit: 660, a: sstep(TT.twoK + 0.2, TT.twoK + 0.45, t) });
    }
    if (t >= TT.n09 - 0.05) title(g, 'OUT OF 2 CRORE', 1440, 110, CREAM, t, TT.n09 - 0.05);
    return flashAt(t, TT.n08 - 0.05) * 0.35;
  }
  // ------------------------------------------------------------------ 8 · the name of it: the prosecutor's own sentence, stamped
  function shotFallacy(g, t) {
    const TT = times();
    prosShot(g, t, { z: 1.04, pLook: [0, 1], pSmile: 0.2 });
    g.fillStyle = 'rgba(16,12,10,0.35)'; g.fillRect(0, 0, W, H);
    say(g, QUOTE, 513, 452, t, TT.n10 - 0.4, { w: 880, size: 70, tx: 470, ty: 900 });
    if (t >= TT.fallacy - 0.08) stamp(g, "PROSECUTOR'S FALLACY", 513, 470, t, TT.fallacy - 0.06, RED, 92, -0.08, 'rgba(255,255,255,0.92)');
    if (t >= TT.judges - 0.06) title(g, 'IT FOOLS REAL JUDGES TOO', 1440, 84, YEL, t, TT.judges - 0.06);
    return flashAt(t, TT.n10 - 0.05) * 0.25;
  }
  // ------------------------------------------------------------------ 9 · one of those two thousand, you've met before. Four films, same thief.
  function faceTile(g, i, x, y, w, h) {            // his face in each film; the fourth is a question
    g.save(); g.beginPath(); g.roundRect(x, y, w, h, 10); g.clip();
    const bgs = [lg(g, 0, y, 0, y + h, [0, '#ee8f58'], [1, '#fde4bb']), '#c9c6bd', lg(g, 0, y, 0, y + h, [0, '#f7c384'], [1, '#e8a868']), '#efe2c6'];
    g.fillStyle = bgs[i]; g.fillRect(x, y, w, h);
    if (i === 1) { g.strokeStyle = 'rgba(40,40,40,0.25)'; g.lineWidth = 2; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(x, y + 20 + k * 30); g.lineTo(x + w, y + 20 + k * 30); g.stroke(); } }
    if (i < 3) {
      const L = i === 0 ? THIEF20 : TWO, body = i === 0 ? lg(g, -320, 168, 320, 760, [0, '#37a18a'], [1, '#237a68']) : i === 1 ? lg(g, -320, 168, 320, 760, [0, '#f07a2b'], [1, '#c4561a']) : undefined;
      seated(g, L, x + w / 2, y + h * 0.5, 0.42, { kind: 'shirt', pocket: false, body, look: [0, 1], smile: i === 2 ? 0.45 : 0.1 });
    } else txt(g, '?', x + w / 2, y + h * 0.66, 220, '#b9a27a', { align: 'center' });
    g.restore();
  }
  // his hand, the back of it to you, at his chest: the plaster across it
  function plasterHand(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -60, 120, 60, 260, [0, '#b4cfe6'], [1, '#94b6d3']); R(g, -62, 60, 124, 260, 52); g.fill();
    g.fillStyle = TWO.skin; ell(g, 0, 0, 78, 92); g.fill();
    for (let i = 0; i < 4; i++) { R(g, -66 + i * 34, -150, 30, 110, 15); g.fill(); }
    g.strokeStyle = TWO.skinD; g.lineWidth = 4; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-51 + i * 34, -120); g.lineTo(-51 + i * 34, -100); g.stroke(); }
    g.save(); g.rotate(-0.4); g.fillStyle = '#f7f3ea'; R(g, -64, -24, 128, 48, 12); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(200,60,60,0.4)'; R(g, -18, -12, 36, 24, 6); g.fill(); g.restore();
    g.restore();
  }
  const PORT = { x: 513, y: 940, s: 1.1 }, PH = [700, 1300, 0.9];
  function shotThief(g, t) {
    const TT = times();
    const zin = sstep(TT.n11 - 0.05, TT.met - 0.1, t), port = sstep(TT.met - 0.3, TT.met, t);
    if (port < 1) {
      g.save(); g.globalAlpha = 1 - port;
      crowd(g, t, { z: lerp(1.0, 7.0, zin * zin), focus: THIEF_CELL });
      g.restore();
    }
    if (port > 0) {
      g.save(); g.globalAlpha = port;
      g.fillStyle = '#1a1c22'; g.fillRect(0, 0, W, H);
      g.fillStyle = rg(g, 513, 980, 40, 700, [0, 'rgba(255,70,50,0.28)'], [1, 'rgba(255,70,50,0)']); g.fillRect(0, 0, W, H);
      seated(g, TWO, PORT.x, PORT.y, PORT.s, { kind: 'shirt', pocket: false, look: [0, 1], smile: 0.5, close: blinkAt(t, 3.3, 0.4), t });
      plasterHand(g, PH[0], PH[1], PH[2]);
      g.restore();
    }
    if (t >= TT.n12 - 0.06) {
      const labs = ['WITNESS', 'SUSPECT', 'DETECTIVE', 'JUDGE'];
      for (let i = 0; i < 4; i++) {
        const t0 = TT.n12 - 0.06 + i * 0.1, k = pop(t, t0), w = 196, h = 244, x = 100 + i * 210, y = 300;     // x 100–926: inside the safe zone
        if (t < t0) continue;
        g.save(); g.translate(x + w / 2, y + h / 2); g.scale(lerp(0.6, 1, k), lerp(0.6, 1, k)); g.globalAlpha = clamp((t - t0) * 8); g.translate(-(x + w / 2), -(y + h / 2));
        g.fillStyle = CREAM; R(g, x - 6, y - 6, w + 12, h + 12, 12); g.fill();
        faceTile(g, i, x, y, w, h);
        g.fillStyle = 'rgba(12,12,16,0.85)'; R(g, x, y + h - 52, w, 52, 0); g.fill();
        txt(g, `${i + 1} · ${labs[i]}`, x + w / 2, y + h - 13, 40, CREAM, { align: 'center', fit: w - 14 });
        g.restore();
      }
    }
    if (t >= TT.same - 0.06) {
      // the mole you know, and the plaster you can check: the evidence, not the face
      const k = pop(t, TT.same - 0.06);
      g.strokeStyle = RED; g.lineWidth = 10;
      ell(g, PORT.x + 84 * PORT.s, PORT.y + 62 * PORT.s, 40 * lerp(1.8, 1, k), 40 * lerp(1.8, 1, k)); g.stroke();
      ell(g, PH[0], PH[1] - 6, 96 * lerp(1.6, 1, k), 66 * lerp(1.6, 1, k), -0.4); g.stroke();
      stamp(g, 'SAME THIEF', 380, 1410, t, TT.same - 0.04, RED, 112, -0.08, 'rgba(255,255,255,0.95)');
    }
    if (t >= TT.free - 0.06) title(g, 'STILL FREE.', 1530, 104, YEL, t, TT.free - 0.06);
    return flashAt(t, TT.met - 0.2) * 0.3 + flashAt(t, TT.n12 - 0.06) * 0.2;
  }
  // ------------------------------------------------------------------ 10 · the dare: the friend who's good at maths
  const TEE = (g) => lg(g, -340, 168, 340, 588, [0, '#f2a93a'], [1, '#d58a22']);
  function calculator(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    R(g, -110, -180, 220, 360, 26); g.fillStyle = '#3a3e46'; g.fill(); g.strokeStyle = '#1b1d22'; g.lineWidth = 6; g.stroke();
    R(g, -86, -152, 172, 76, 10); g.fillStyle = '#b9d3a6'; g.fill(); txt(g, '0.', 70, -94, 56, '#26331c', { kind: 'mono', align: 'right' });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { R(g, -86 + c * 45, -54 + r * 54, 36, 40, 8); g.fillStyle = c === 3 ? '#e2732a' : '#e8e6df'; g.fill(); }
    g.restore();
  }
  function shotFriend(g, t) {
    const TT = times();
    if (!ST) makeStreet();
    g.drawImage(ST.bg, 0, 0); steam(g, 348, 880, t, 0.8); seller(g, t);
    seated(g, FRIEND, 540, 860, 1.1, { kind: 'shirt', pocket: false, body: TEE(g), look: [0, 1], smile: 0.95, close: blinkAt(t, 2.1), browY: -8, t });
    g.fillStyle = lg(g, 0, 1190, 0, 1920, [0, '#8f6236'], [1, '#4a2e17']); g.beginPath(); g.moveTo(-40, 1216); g.lineTo(1120, 1194); g.lineTo(1120, 1980); g.lineTo(-40, 1980); g.closePath(); g.fill();
    calculator(g, 790, 1150, 0.95, 0.12);
    g.fillStyle = FRIEND.skin; ell(g, 760, 1290, 70, 52, 0.2); g.fill();
    chaiHand(g, 880, 1600 + 3 * Math.sin(t * 1.1), 0.92, -0.04, true);
    say(g, "I'M GOOD AT MATHS.", 513, 430, t, TT.good - 0.05, { tx: 540, ty: 640, w: 760 });
    if (t >= TT.dont - 0.05) title(g, "DON'T TELL THEM IT'S MATHS.", 1460, 78, YEL, t, TT.dont - 0.05);
    return flashAt(t, TT.n13 - 0.05) * 0.3;
  }
  // ------------------------------------------------------------------ 11 · the last line: the courtroom, everyone gone
  function shotLast(g, t) {
    const TT = times();
    court(g, t, { z: 1.0 + 0.02 * sstep(TT.n14, TT.end, t), cx: 513, cy: 960, emptyGallery: true, emptyDock: true, noPros: true });
    txt(g, "YOU'RE THE TEST SUBJECT", 513, 330, 54, CREAM, { align: 'center', fit: 860, stroke: INK, sw: 0.2 });
    if (t >= TT.where - 0.05) { title(g, 'WHERE WAS THE', 452, 116, CREAM, t, TT.where - 0.05); title(g, 'THIEF SITTING?', 596, 150, YEL, t, TT.where + 0.12); }
    return flashAt(t, TT.n14 - 0.14) * 0.4;
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
      if (t < TT.stall - 0.05) fl = shotOpen(g, t);
      else if (t < TT.cut - 0.05) fl = shotNight(g, t);
      else if (t < TT.matchW - 0.05) fl = shotBag(g, t);
      else if (t < TT.p01 - 0.05) fl = shotMatch(g, t);
      else if (t < TT.n04 - 0.05) fl = shotPros(g, t);
      else if (t < TT.d01 - 0.05) fl = shotAsk(g, t);
      else if (t < TT.n05 - 0.05) fl = shotPlea(g, t);
      else if (t < TT.clock1 - 0.1) fl = shotLean(g, t);
      else if (t < TT.n06 - 0.05) fl = shotTimeUp(g, t);
      else if (t < TT.n08 - 0.05) fl = shotNumbers(g, t);
      else if (t < TT.n10 - 0.05) fl = shotCrowd(g, t);
      else if (t < TT.n11 - 0.05) fl = shotFallacy(g, t);
      else if (t < TT.n13 - 0.05) fl = shotThief(g, t);
      else if (t < TT.n14 - 0.15) fl = shotFriend(g, t);
      else fl = shotLast(g, t);
      askOverlay(g, t);
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
