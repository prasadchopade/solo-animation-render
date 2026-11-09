// Reel 27 · You're the Guard. Episode 5 of "You're the test subject". You're the guard at a housing society's gate. A delivery man answers your
// questions; every time you look down to write, he walks in through the gate and the next one steps up, in the same jacket and cap. You catch
// a wrong label and send "him" away: nobody got past you. Then flat 302 is robbed. Four men in that jacket, and whoever you point at goes to
// jail. You're right: he was at your gate. So were the other three. You checked his name, his flat, his parcel; you never checked his face.
// (Simons & Levin 1998: docs/research.md.) Our own drawings; nobody real. The street, the rig and the POV are from reels 20 and 25 (tags
// archive/reels-source-2026-11-04, source/reel-25-youre-the-detective). 30 fps, no motion blur.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', PAPER = '#fbf7ec', YEL = '#ffd34a', CREAM = '#fff6e2', BLUEINK = '#1b3fa8', GREEN = '#1c9a52';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const win = (t, a, b, f = 0.08) => sstep(a - f, a, t) * (1 - sstep(b, b + f, t));

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
  function title(g, s, y, size, color, t, t0, o = {}) {
    if (t < t0) return;
    const q = pop(t, t0);
    g.save(); g.translate(o.x ?? 513, y); g.scale(lerp(0.86, 1, q), lerp(0.86, 1, q));
    txt(g, s, 0, 0, size, color, { align: 'center', fit: o.fit ?? 860, stroke: o.stroke ?? INK, sw: o.sw ?? 0.14, a: clamp((t - t0) * 8) * (o.a ?? 1) });
    g.restore();
  }

  // ------------------------------------------------------------------ the rig (reels 19, 20, 23, 25)
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
  const blinkAt = (t, p = 3.3, off = 1.1) => (((t + off) % p) < 0.11 ? 1 : 0);          // never on frame 0

  // the four men: one jacket, one cap. Each is a small step from the one before, so neighbours are close and the first and the last are plainly
  // different men: young, lean, light, thin moustache, to older, heavy, darker, thick moustache. mt/mw: the moustache; nose: its width.
  const TEALCAP = { capC: ['#22b5ad', '#0f7f79', '#0b625e'] };
  const MEN = [
    { ...TEALCAP, skin: '#cc9470', skinD: '#a26c4a', skinH: '#e6b794', hair: '#17110d', style: 'cap', must: 'thin', mt: 10, mw: 46, stub: 0, brow: 10, browTilt: 0, jaw: 0.92, ew: 47, eh: 26, nose: 0.9, dy: -6 },
    { ...TEALCAP, skin: '#c58c65', skinD: '#9b6545', skinH: '#deb089', hair: '#17110d', style: 'cap', must: 'thin', mt: 13, mw: 50, stub: 0.12, brow: 12, browTilt: 2, jaw: 0.96, ew: 46, eh: 25, nose: 1.02, dy: -2 },
    { ...TEALCAP, skin: '#b67c56', skinD: '#8d5a3b', skinH: '#d19d76', hair: '#15100c', style: 'cap', must: 'thin', mt: 18, mw: 56, stub: 0.32, brow: 15, browTilt: 3, jaw: 1.01, ew: 43, eh: 23, nose: 1.14, dy: 3 },
    { ...TEALCAP, skin: '#a06b47', skinD: '#7a4e31', skinH: '#bb8660', hair: '#120d0a', style: 'cap', must: 'thick', mt: 25, mw: 64, stub: 0.55, brow: 17, browTilt: 6, jaw: 1.08, ew: 40, eh: 21, nose: 1.26, age: 1, dy: 8 },
  ];
  const LINE = [2, 0, 3, 1];                       // the lineup, by number: 1 is the third man, 2 the first, 3 the fourth, 4 the second
  const THIEF = { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', style: 'cap', must: 'thin', mt: 13, mw: 52, stub: 0.55, brow: 15, browTilt: 8, jaw: 0.98, ew: 43, eh: 22, mole: [84, 62], nose: 1, capC: ['#8e2433', '#5c1520', '#4a111b'] };
  const WORKERS = [
    { skin: '#c48a64', skinD: '#9a6444', skinH: '#ddae88', hair: '#17110d', style: 'hard', must: 'thin', mt: 14, mw: 52, stub: 0.2, brow: 13, browTilt: 2, jaw: 0.96, ew: 46, eh: 25, nose: 1 },
    { skin: '#ab7450', skinD: '#845335', skinH: '#c6936d', hair: '#120d0a', style: 'hard', must: 'thick', mt: 22, mw: 60, stub: 0.45, brow: 16, browTilt: 5, jaw: 1.05, ew: 42, eh: 22, nose: 1.2 },
  ];

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
    if (L.stub && !o.blank) { g.fillStyle = lg(g, 0, 56, 0, 190, [0, 'rgba(30,22,18,0)'], [1, `rgba(30,22,18,${0.34 * L.stub})`]); g.fillRect(-300, 56, 600, 320); const r = mulberry32(5); g.fillStyle = `rgba(20,14,10,${0.34 * L.stub})`; for (let i = 0; i < 70; i++) { ell(g, (r() - 0.5) * 2 * hw * 0.9, 120 + r() * 120, 1.7, 1.7); g.fill(); } }
    g.restore();
    if (!o.blank) {
      const my = 118 + drop * 0.2;
      mouth(g, my, op, { lip: L.lip || '#83503f', w0: o.w0 ?? 44, frown: o.frown ?? 0, smile: o.smile ?? 0 });
      if (L.must) {
        const big = L.must === 'thick', th = L.mt ?? (big ? 24 : 13), w = L.mw ?? (big ? 62 : 52);
        g.fillStyle = L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
      }
      const ny = 44, nz = L.nose ?? 1;
      g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36 * nz, 9); g.fill();
      g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 22 * nz, ny - 18); g.quadraticCurveTo(k * 31 * nz, ny, k * 25 * nz, ny + 10); g.stroke(); }
      for (const k of [-1, 1]) { ell(g, k * 13 * nz, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
      g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5, ny - 8, 10, 15); g.fill();
      if (L.mole) { g.fillStyle = '#2a1710'; ell(g, L.mole[0], L.mole[1], 9.5, 9); g.fill(); }
      if (L.age) { g.strokeStyle = 'rgba(70,35,20,0.34)'; g.lineWidth = 4; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 52, 10); g.quadraticCurveTo(k * 80, 24, k * 112, 8); g.stroke(); g.beginPath(); g.moveTo(k * 56, 66); g.quadraticCurveTo(k * 78, 100, k * 74, 140); g.stroke(); } }
      const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look, lidW: L.lidW };
      eye(g, -1, -ex, ey, close, eo); eye(g, 1, ex, ey, close, eo);
      g.strokeStyle = L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
      const by0 = o.browY || 0, tilt = L.browTilt + (o.worry || 0);
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (ex - 48), ey - 40 + tilt + by0); g.quadraticCurveTo(k * (ex + 6), ey - 60 + by0, k * (ex + 54), ey - 40 - tilt * 0.3 + by0 * 0.4); g.stroke(); }
    }
    g.fillStyle = L.hair;
    const hh = hw + 6;
    if (L.style === 'cap') {
      const CC = L.capC;
      g.beginPath(); g.moveTo(-hh, -36); g.lineTo(-hh + 4, -130); g.lineTo(-hh + 36, -130); g.lineTo(-hh + 24, -46); g.closePath(); g.moveTo(hh, -36); g.lineTo(hh - 4, -130); g.lineTo(hh - 36, -130); g.lineTo(hh - 24, -46); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,10,6,0.32)'; g.beginPath(); g.moveTo(-hw + 8, -108); g.quadraticCurveTo(0, -60, hw - 8, -108); g.lineTo(hw - 8, -140); g.lineTo(-hw + 8, -140); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-hh - 2, -122); g.bezierCurveTo(-hh - 8, -280, -90, -318, 0, -318); g.bezierCurveTo(90, -318, hh + 8, -280, hh + 2, -122); g.quadraticCurveTo(0, -158, -hh - 2, -122); g.closePath(); g.fillStyle = lg(g, -hh, -318, hh, -120, [0, CC[0]], [1, CC[1]]); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -318); g.quadraticCurveTo(-12, -220, 0, -150); g.stroke();
      g.beginPath(); g.moveTo(-hh + 6, -128); g.quadraticCurveTo(0, -170, hh - 6, -128); g.quadraticCurveTo(hh + 6, -108, hh - 40, -92); g.quadraticCurveTo(0, -116, -hh + 40, -92); g.quadraticCurveTo(-hh - 6, -108, -hh + 6, -128); g.closePath(); g.fillStyle = CC[2]; g.fill();
    } else if (L.style === 'hard') {
      g.beginPath(); g.moveTo(-hh - 26, -120); g.bezierCurveTo(-hh - 16, -310, -90, -344, 0, -344); g.bezierCurveTo(90, -344, hh + 16, -310, hh + 26, -120); g.closePath(); g.fillStyle = lg(g, -hh, -344, hh, -120, [0, '#ffd23a'], [1, '#e7a910']); g.fill();
      R(g, -hh - 44, -132, 2 * hh + 88, 30, 14); g.fillStyle = '#d99a08'; g.fill();
      g.fillStyle = 'rgba(255,255,255,0.32)'; R(g, -26, -340, 52, 208, 20); g.fill();
    }
  }
  // a man from the chest up, in a work jacket. jc: the jacket's two colours; patch: the DELIVERY patch on his chest
  function seated(g, L, x, y, s, o = {}) {
    g.save(); g.translate(x, y + (L.dy || 0) * s); g.scale(s, s); g.rotate(o.roll || 0);
    const by = 168, jc = o.jc || ['#21b3ab', '#0e8079'];
    g.fillStyle = lg(g, -330, by, 330, by + 600, [0, jc[0]], [1, jc[1]]);
    g.beginPath(); g.moveTo(-340, by + 1200); g.lineTo(-340, by + 430); g.bezierCurveTo(-336, by + 200, -230, by + 130, -96, by + 96); g.lineTo(96, by + 96); g.bezierCurveTo(230, by + 130, 336, by + 200, 340, by + 430); g.lineTo(340, by + 1200); g.closePath(); g.fill();
    g.fillStyle = '#39424a'; g.beginPath(); g.moveTo(-96, by + 92); g.lineTo(0, by + 250); g.lineTo(96, by + 92); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-60, by + 150); g.lineTo(-40, by + 1200); g.moveTo(60, by + 150); g.lineTo(40, by + 1200); g.stroke();
    g.fillStyle = '#d7dde3'; for (const k of [-1, 1]) { g.save(); g.translate(k * 208, by + 340); g.rotate(k * 0.06); R(g, -80, -15, 160, 30, 6); g.fill(); g.restore(); }
    g.fillStyle = jc[1]; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 96, by + 92); g.lineTo(k * 176, by + 70); g.lineTo(k * 150, by + 160); g.closePath(); g.fill(); }
    if (o.patch !== false) { g.save(); g.translate(168, by + 244); g.rotate(0.05); R(g, -66, -30, 132, 60, 7); g.fillStyle = '#f6f4ec'; g.fill(); txt(g, 'DELIVERY', 0, 12, 30, '#0b625e', { align: 'center', fit: 116 }); g.restore(); }
    const nw = 70;
    g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 8, by + 110); g.quadraticCurveTo(0, by + 200, nw + 8, by + 110); g.lineTo(nw, 120); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,35,20,0.28)'; g.beginPath(); g.moveTo(-nw, 150); g.quadraticCurveTo(0, 235, nw, 150); g.lineTo(nw, 120); g.lineTo(-nw, 120); g.closePath(); g.fill();
    head(g, L, o);
    g.restore();
  }

  // ------------------------------------------------------------------ the street (reels 20 and 25: the same street, from across the road)
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
    // the chai stall, on the left of the street
    g.fillStyle = lg(g, 0, 700, 0, 1160, [0, '#4a3524'], [1, '#2a1d14']); g.fillRect(0, 700, 440, 470);
    for (let i = 0; i < 9; i++) { const px = 16 + i * 46, ph = 96 + (i % 3) * 16; g.fillStyle = ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#6cb33f'][i % 5]; g.fillRect(px, 690, 36, ph); g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(px + 6, 690, 6, ph); }
    g.fillStyle = lg(g, 0, 620, 0, 700, [0, '#2b6fb3'], [1, '#1f4f82']); g.beginPath(); g.moveTo(-10, 610); g.lineTo(476, 640); g.lineTo(476, 708); for (let i = 8; i >= 0; i--) { g.quadraticCurveTo(i * 58 + 29, 724, i * 58, 704); } g.closePath(); g.fill();
    g.fillStyle = lg(g, 0, 1000, 0, 1240, [0, '#a56b39'], [1, '#6e431f']); g.fillRect(0, 1010, 450, 230);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 6; i++) g.fillRect(0, 1050 + i * 34, 450, 3);
    R(g, 34, 1080, 216, 92, 6); g.fillStyle = '#23302a'; g.fill(); g.strokeStyle = '#8a6a3f'; g.lineWidth = 6; g.stroke();
    txt(g, 'CHAI 10/-', 142, 1146, 62, '#f4efe0', { align: 'center' });
    g.fillStyle = '#c99a5e'; g.fillRect(0, 996, 462, 22);
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, 716); g.quadraticCurveTo(240, 762, 490, 724); g.stroke();
    for (let i = 0; i < 10; i++) { const u = i / 9, bx = lerp(8, 470, u), by = 716 + 44 * Math.sin(u * Math.PI) - 8 * u + 8; g.fillStyle = rg(g, bx, by + 6, 2, 46, [0, 'rgba(255,214,130,0.75)'], [1, 'rgba(255,214,130,0)']); g.fillRect(bx - 46, by - 40, 92, 92); g.fillStyle = '#fff2c4'; ell(g, bx, by + 6, 8, 10); g.fill(); }
    g.fillStyle = rg(g, 220, 960, 40, 620, [0, 'rgba(255,190,110,0.2)'], [1, 'rgba(255,190,110,0)']); g.fillRect(0, 300, 900, 1300);
    g.fillStyle = rg(g, 540, 900, 620, 1240, [0, 'rgba(30,14,8,0)'], [1, 'rgba(30,14,8,0.28)']); g.fillRect(0, 0, W, H);
    // the society's gate, on your left: a green gate and a post, close to you
    g.fillStyle = lg(g, 0, 300, 0, 1380, [0, '#2f8a5e'], [1, '#1d6b45']); g.fillRect(0, 300, 34, 1100); g.fillRect(148, 300, 34, 1100);
    g.fillStyle = '#26764f'; for (let i = 0; i < 4; i++) g.fillRect(0, 380 + i * 280, 182, 22);
    for (let i = 0; i < 4; i++) { g.fillStyle = '#2d8559'; g.fillRect(44 + i * 32, 300, 12, 1100); }
    g.fillStyle = '#efe7d4'; R(g, 12, 520, 158, 96, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3; g.stroke();
    txt(g, 'SHANTI', 91, 566, 42, '#2f4f3a', { align: 'center', fit: 138 }); txt(g, 'SOCIETY', 91, 604, 36, '#2f4f3a', { align: 'center', fit: 138 });
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
  function chaiHand(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, 110, 110, 520, 720, [0, '#cf9670'], [1, '#9a6444']);
    g.beginPath(); g.moveTo(92, 110); g.bezierCurveTo(100, 66, 190, 40, 226, 84); g.lineTo(660, 680); g.lineTo(340, 860); g.closePath(); g.fill();
    g.fillStyle = lg(g, 300, 400, 660, 860, [0, '#b9a26d'], [1, '#8d7a4d']); g.beginPath(); g.moveTo(300, 420); g.lineTo(470, 300); g.lineTo(760, 720); g.lineTo(500, 940); g.closePath(); g.fill();
    g.fillStyle = lg(g, -130, -40, 110, 110, [0, '#c98e68'], [1, '#a9744f']);
    for (let i = 0; i < 4; i++) { R(g, -122 + i * 4, -48 + i * 42, 240, 38, 19); g.fill(); }
    ell(g, 128, 34, 84, 104); g.fillStyle = lg(g, 60, -60, 200, 130, [0, '#dba67f'], [1, '#b47c58']); g.fill();
    glass(g, 0, 0, 1, 0);
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
  // your right hand and the pen: (x, y) is the nib
  function penHand(g, x, y, s = 1, rot = 0) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, 300, 330, 700, 900, [0, '#b9a26d'], [1, '#8d7a4d']); g.beginPath(); g.moveTo(230, 300); g.lineTo(410, 180); g.lineTo(820, 840); g.lineTo(560, 1010); g.closePath(); g.fill();
    g.fillStyle = lg(g, 100, 90, 420, 380, [0, '#d7a27c'], [1, '#a9744f']); g.beginPath(); g.moveTo(70, 118); g.bezierCurveTo(120, 40, 280, 40, 350, 120); g.lineTo(430, 250); g.lineTo(250, 340); g.bezierCurveTo(150, 290, 80, 200, 70, 118); g.closePath(); g.fill();
    g.strokeStyle = lg(g, 0, 0, 190, -190, [0, '#20262f'], [0.12, '#2e3f8c'], [1, '#27357a']); g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, -10); g.lineTo(232, -214); g.stroke();
    g.strokeStyle = '#8f949b'; g.lineWidth = 9; g.beginPath(); g.moveTo(2, -2); g.lineTo(26, -24); g.stroke();
    g.fillStyle = lg(g, 60, 0, 200, 80, [0, '#e4b08a'], [1, '#c48e68']);
    for (let i = 0; i < 3; i++) { g.save(); g.translate(58 + i * 12, 18 + i * 26); g.rotate(-0.9 + i * 0.14); R(g, 0, -20, 170, 40, 20); g.fill(); g.strokeStyle = 'rgba(90,50,30,0.3)'; g.lineWidth = 2.5; g.stroke(); g.restore(); }
    g.save(); g.translate(150, 70); g.rotate(-2.3); R(g, 0, -22, 130, 44, 22); g.fillStyle = '#d9a27c'; g.fill(); g.restore();
    g.restore();
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
  const SELLER = { skin: '#a8704c', skinD: '#7f5032', skinH: '#c28c66', hair: '#100c09', style: 'none', must: 'thick', stub: 0, brow: 15, browTilt: 4, jaw: 1.05, ew: 42, eh: 22, nose: 1 };
  function seller(g, t) {
    g.save(); g.beginPath(); g.rect(0, 0, W, 998); g.clip();
    g.translate(290, 790 + 2 * Math.sin(t * 1.3)); g.scale(0.34, 0.34);
    g.fillStyle = lg(g, -300, 240, 300, 800, [0, '#f2eee2'], [1, '#d3cdbc']);
    g.beginPath(); g.moveTo(-330, 1000); g.lineTo(-330, 410); g.bezierCurveTo(-326, 300, -220, 246, -90, 205); g.lineTo(90, 205); g.bezierCurveTo(220, 246, 326, 300, 330, 410); g.lineTo(330, 1000); g.closePath(); g.fill();
    g.fillStyle = '#d9582a'; g.beginPath(); g.moveTo(-250, 262); g.lineTo(-140, 222); g.lineTo(-96, 660); g.lineTo(-224, 660); g.closePath(); g.fill();
    head(g, SELLER, { look: [14 * Math.sin(t * 0.8), 6], close: blinkAt(t, 3.1, 1.4) });
    g.restore();
  }
  // the van across the road, from the front. Its driver's seat is on your left as you look at it, and the man in the maroon cap is in it.
  function van(g, t, x = 700, y = 642, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.25)'; ell(g, 210, 512, 240, 18); g.fill();
    R(g, 0, 0, 430, 500, 46); g.fillStyle = lg(g, 0, 0, 430, 500, [0, '#f7f6f1'], [1, '#c9c9c2']); g.fill();
    // the windscreen, the driver behind it
    R(g, 26, 40, 378, 190, 22); g.fillStyle = lg(g, 0, 40, 0, 230, [0, '#a9c8d8'], [1, '#7da3b6']); g.fill();
    g.save(); R(g, 26, 40, 378, 190, 22); g.clip();
    g.save(); g.translate(112, 136 + 2 * Math.sin(t * 0.9)); g.scale(0.3, 0.3); g.fillStyle = lg(g, -240, 170, 240, 500, [0, '#2d7f77'], [1, '#205c56']);
    g.beginPath(); g.moveTo(-250, 520); g.lineTo(-250, 300); g.bezierCurveTo(-230, 220, -150, 210, -90, 190); g.lineTo(90, 190); g.bezierCurveTo(150, 210, 230, 220, 250, 300); g.lineTo(250, 520); g.closePath(); g.fill();
    head(g, THIEF, { look: [-4, 2], close: blinkAt(t, 3.7, 0.9), smile: 0.2 }); g.restore();
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.moveTo(40, 40); g.lineTo(150, 40); g.lineTo(70, 230); g.lineTo(0, 230); g.closePath(); g.fill(); g.beginPath(); g.moveTo(190, 40); g.lineTo(240, 40); g.lineTo(160, 230); g.lineTo(110, 230); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle = 'rgba(50,50,50,0.5)'; g.lineWidth = 7; R(g, 26, 40, 378, 190, 22); g.stroke();
    R(g, -28, 110, 38, 56, 10); g.fillStyle = '#26282d'; g.fill(); R(g, 420, 110, 38, 56, 10); g.fill();
    R(g, 40, 300, 350, 76, 10); g.fillStyle = '#34373d'; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 4; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(50, 314 + i * 12); g.lineTo(380, 314 + i * 12); g.stroke(); }
    for (const k of [0, 1]) { const hx = 66 + k * 298; ell(g, hx, 268, 36, 28); g.fillStyle = '#fff4c6'; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 4; g.stroke(); }
    R(g, 150, 396, 130, 44, 4); g.fillStyle = '#f7e9a4'; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 3; g.stroke();
    R(g, 8, 440, 414, 38, 12); g.fillStyle = '#3a3c40'; g.fill();
    for (const hx of [52, 330]) { R(g, hx, 462, 80, 58, 14); g.fillStyle = '#1b1c1f'; g.fill(); }
    g.restore();
  }

  // ------------------------------------------------------------------ the desk and what's on it
  const MX = 470, MY = 880, MS = 1.12, TY = 1330, DOWN = 1160;
  const BOOK = { x: 110, y: 1420, w: 580, h: 1130 }, ROW = { name: 1700, flat: 1980, parcel: 2260 };
  const PARCEL_DESK = [815, 1980];

  function desk(g) {
    g.fillStyle = lg(g, 0, TY - 24, 0, 2500, [0, '#8f6236'], [1, '#4a2e17']); g.beginPath(); g.moveTo(-40, TY + 12); g.lineTo(1120, TY - 12); g.lineTo(1120, 3300); g.lineTo(-40, 3300); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,240,210,0.3)'; g.beginPath(); g.moveTo(-40, TY + 12); g.lineTo(1120, TY - 12); g.lineTo(1120, TY - 4); g.lineTo(-40, TY + 20); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.13)'; for (let i = 1; i < 21; i++) { g.beginPath(); g.moveTo(-40, TY + 12 + i * 92); g.lineTo(1120, TY - 12 + i * 92); g.lineTo(1120, TY - 9 + i * 92); g.lineTo(-40, TY + 15 + i * 92); g.closePath(); g.fill(); }
  }
  // handwriting: a few glyphs as strokes in a 0..1 box, written on by length
  const GLYPH = {
    R: [[[0, 1], [0, 0], [0.62, 0.02], [0.8, 0.26], [0.6, 0.48], [0, 0.5]], [[0.34, 0.5], [0.86, 1]]],
    A: [[[0, 1], [0.44, 0], [0.88, 1]], [[0.18, 0.64], [0.72, 0.64]]],
    V: [[[0, 0], [0.42, 1], [0.86, 0]]],
    I: [[[0.14, 0], [0.14, 1]]],
    '3': [[[0.04, 0.1], [0.42, -0.02], [0.78, 0.14], [0.42, 0.46], [0.84, 0.64], [0.56, 1], [0.04, 0.9]]],
    '0': [[[0.42, 0], [0.08, 0.2], [0, 0.56], [0.14, 0.9], [0.44, 1], [0.76, 0.84], [0.84, 0.44], [0.66, 0.1], [0.4, 0]]],
    '2': [[[0.04, 0.22], [0.36, -0.02], [0.74, 0.14], [0.64, 0.44], [0.02, 1], [0.86, 0.98]]],
  };
  const GLW = { R: 0.98, A: 1.02, V: 1.0, I: 0.42, '3': 0.96, '0': 0.98, '2': 0.98 };
  function wordStrokes(s, x, y, h) {                 // → a list of strokes in canvas units; total length
    const list = []; let cx = x, L = 0;
    for (const c of s) {
      for (const st of GLYPH[c] || []) {
        const pts = st.map(([a, b]) => [cx + a * h * 0.82, y - h + b * h]);
        let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        list.push({ pts, l }); L += l;
      }
      cx += (GLW[c] || 1) * h * 0.82 + h * 0.14;
    }
    return { list, L };
  }
  // draws what's written so far; returns the nib's position
  function writeOn(g, s, x, y, h, u, color = BLUEINK, lw = 12) {
    const { list, L } = wordStrokes(s, x, y, h); let left = clamp(u) * L, nib = [x, y];
    g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const st of list) {
      if (left <= 0) break;
      const { pts } = st; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (left >= seg) { g.lineTo(pts[i][0], pts[i][1]); left -= seg; nib = pts[i]; }
        else { const f = left / seg; nib = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; g.lineTo(nib[0], nib[1]); left = 0; break; }
      }
      g.stroke();
    }
    return nib;
  }
  function bookPage(g, x, y, w, h, lab = true) {
    g.fillStyle = 'rgba(0,0,0,0.3)'; R(g, x + 12, y + 14, w, h, 10); g.fill();
    g.fillStyle = lg(g, x, y, x + w, y + h, [0, '#fffaf0'], [1, '#efe6d3']); R(g, x, y, w, h, 10); g.fill();
    g.fillStyle = 'rgba(214,73,73,0.5)'; g.fillRect(x + 56, y, 4, h);
    g.fillStyle = 'rgba(70,110,170,0.28)'; for (let yy = y + 60; yy < y + h; yy += 56) g.fillRect(x, yy, w, 3);
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; R(g, x, y, w, h, 10); g.stroke();
    if (lab) { g.fillStyle = '#7b6d55'; R(g, x + 150, y + 10, w - 300, 44, 6); g.fill(); txt(g, 'VISITORS', x + w / 2, y + 44, 34, '#fff6e2', { align: 'center', ls: 3 }); }
  }
  function rowLabel(g, s, x, y) { txt(g, s, x, y, 42, '#6d6452', { kind: 'semi' }); }
  // the book on your desk, with what's been written so far. st: { name, flat } 0..1 (how much), hi (highlight 302)
  function book(g, st) {
    const B = BOOK;
    bookPage(g, B.x, B.y, B.w, B.h);
    rowLabel(g, 'NAME', B.x + 80, ROW.name - 150); rowLabel(g, 'FLAT', B.x + 80, ROW.flat - 150); rowLabel(g, 'PARCEL', B.x + 80, ROW.parcel - 150);
    if (st.hi > 0) { g.fillStyle = `rgba(255,218,60,${0.62 * st.hi})`; R(g, B.x + 170, ROW.flat - 140, 330, 160, 18); g.fill(); }
    const a = writeOn(g, 'RAVI', B.x + 180, ROW.name, 122, st.name);
    const b = writeOn(g, '302', B.x + 180, ROW.flat, 122, st.flat);
    return { a, b };
  }
  function box(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.rotate(o.rot ?? -0.04); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.28)'; R(g, -142, -112, 300, 248, 10); g.fill();
    g.fillStyle = lg(g, -150, -120, 150, 124, [0, '#d7ab70'], [1, '#b98a4f']); R(g, -150, -124, 300, 248, 10); g.fill();
    g.fillStyle = 'rgba(240,226,190,0.55)'; g.fillRect(-26, -124, 52, 248);
    if (o.label) {
      g.fillStyle = '#fffdf5'; R(g, -130, -92, 260, 184, 8); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3; g.stroke();
      txt(g, 'FLAT', 0, -46, 44, '#3d3a33', { kind: 'semi', align: 'center' });
      if (o.hi > 0) { g.fillStyle = `rgba(255,218,60,${0.62 * o.hi})`; R(g, -112, -36, 224, 112, 12); g.fill(); }
      txt(g, '203', 0, 62, 128, '#14130f', { align: 'center' });
      if (o.circle > 0) { g.strokeStyle = RED; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.ellipse(0, 18, 138, 80, -0.06, -1.2, -1.2 + TAU * o.circle); g.stroke(); }
    }
    g.restore();
  }

  // ------------------------------------------------------------------ timing
  const at = (p) => words(p)[0].t0;
  const wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;
  const en = (p) => { const w = words(p); return w[w.length - 1].t1; };
  let T = null;
  function times() {
    if (T) return T;
    T = {
      n01: at('n01'), n01e: en('n01'), n02: at('n02'), a01: at('a01'), a01e: en('a01'), n03: at('n03'), n03e: en('n03'), n04: at('n04'), which: wi('n04', 2),
      b01: at('b01'), b01e: en('b01'), n05: at('n05'), n05e: en('n05'), n06: at('n06'), n06e: en('n06'), c01: at('c01'), c01e: en('c01'),
      n07: at('n07'), n07e: en('n07'), n08: at('n08'), n08e: en('n08'), d01: at('d01'), d01e: en('d01'),
      n09: at('n09'), n09e: en('n09'), n10: at('n10'), n11: at('n11'), four: wi('n11', 2), n12: at('n12'), jail: wi('n12', 7), n13: at('n13'), n13e: en('n13'),
      n14: at('n14'), n14b: wi('n14', 2), n15: at('n15'), n16: at('n16'), n17: at('n17'), n18: at('n18'), n18e: en('n18'),
      n19: at('n19'), n19e: en('n19'), n20: at('n20'), one: wi('n20', 4), three: wi('n20', 8), n20e: en('n20'),
      n21: at('n21'), nm: wi('n21', 3), fl: wi('n21', 5), pc: wi('n21', 7), fc: wi('n21', 13), n22: at('n22'), n23: at('n23'), cw: wi('n23', 10), n23e: en('n23'), n24: at('n24'), n25: at('n25'), n26: at('n26'), n27: at('n27'), end: tb('end'),
    };
    T.clockEnd = T.n14 - 0.15;
    T.downs = [
      [T.n03 - 0.12, T.n04 + 0.16, 'name'],
      [T.n05 - 0.12, T.n06 + 0.16, 'flat'],
      [T.c01e + 0.05, T.n08e - 0.1, 'parcel'],
    ];
    return T;
  }
  function talkP(t, pid) {
    for (const w of words(pid)) {
      if (t >= w.t0 && t <= w.t1) {
        const syl = Math.max(1, (w.w.toLowerCase().match(/[aeiouy]+/g) || []).length), u = (t - w.t0) / Math.max(0.05, w.t1 - w.t0);
        const v = 0.6 + 0.4 * Math.abs(Math.sin(w.t0 * 37.1));
        return (0.05 + 0.3 * v * Math.pow(Math.abs(Math.sin(Math.PI * u * syl)), 0.8));
      }
    }
    return 0;
  }
  // how far the camera has tilted down: 0 up, 1 at the book. A pure function of t.
  function tilt(t) {
    let y = 0; for (const [a, b] of times().downs) y = Math.max(y, sstep(a, a + 0.38, t) * (1 - sstep(b, b + 0.38, t)));
    return y;
  }
  // who's at the desk: a list of { i, x } to draw (two men while they change places, in the seconds you're looking down)
  function atDesk(t) {
    const D = times().downs;
    for (let k = 0; k < D.length; k++) {
      const a1 = D[k][0] + 0.42, b1 = D[k][1] - 0.02, mid = (a1 + b1) / 2;
      if (t < a1) return [{ i: k, x: MX }];
      if (t < b1) {
        const out = sstep(a1, mid + 0.1, t), inn = sstep(mid - 0.1, b1, t);
        return [{ i: k, x: lerp(MX, -560, out) }, { i: k + 1, x: lerp(1620, MX, inn) }];
      }
    }
    const TT = times(), go = sstep(TT.d01e + 0.05, TT.d01e + 0.95, t);
    return go >= 1 ? [] : [{ i: 3, x: lerp(MX, 1620, go), go }];
  }

  // ------------------------------------------------------------------ 1 · the gate, through your eyes
  function gateSet(g, t, o = {}) {
    if (!ST) makeStreet();
    const TT = times(), camY = o.y ?? tilt(t) * DOWN, zoom = o.z ?? 1;
    g.save(); g.translate(513, 900); g.scale(zoom, zoom); g.translate(-513, -900); g.translate(0, -camY);
    g.drawImage(ST.bg, 0, 0);
    seller(g, t);
    van(g, t);
    // the men
    const opFor = { 0: 'a01', 1: 'b01', 2: 'c01', 3: 'd01' };
    for (const m of (o.men || atDesk(t))) {
      const L = MEN[m.i], talking = talkP(t, opFor[m.i]);
      const idleX = 5 * Math.sin(t * 1.3 + m.i), idleY = 3 * Math.sin(t * 1.9 + m.i * 2);
      const look = m.i === 2 && t > TT.n06 ? [0, 14] : m.i === 0 && t < TT.n02 - 0.2 ? [8 * Math.sin(t * 0.7), 2] : [0, 2];
      seated(g, L, m.x + idleX, MY + idleY, MS, { op: talking, look, close: blinkAt(t, 2.7 + m.i * 0.35, 0.7 + m.i * 0.9), smile: [0.45, 0.35, 0.5, 0.25][m.i], roll: 0.012 * Math.sin(t * 1.1 + m.i) });
    }
    // the parcel in his hands, and on your desk
    const pcl = parcelState(t);
    if (pcl.onChest > 0) {
      const px = lerp(MX + 10, pcl.x, pcl.down), py = lerp(MY + 340, pcl.y, pcl.down);
      if (pcl.hands) { for (const k of [-1, 1]) { ell(g, px + k * 150, py + 10, 44, 34); g.fillStyle = MEN[pcl.who].skin; g.fill(); } }
      box(g, px, py, lerp(0.9, 0.95, pcl.down), { label: pcl.down > 0.5, hi: pcl.hi, circle: pcl.circle });
    }
    desk(g);
    // the book, the glass
    const w = writing(t);
    if (pcl.onDesk) box(g, PARCEL_DESK[0], PARCEL_DESK[1], 0.95, { label: true, hi: pcl.hi, circle: pcl.circle });
    const nib = book(g, { name: w.name, flat: w.flat, hi: pcl.hi });
    // the glass on your desk until you lift it
    const lift = sstep(TT.n09 - 0.05, TT.n09 + 0.5, t);
    if (lift <= 0) { glass(g, 900, 1432, 0.6, 0); steam(g, 900, 1370, t, 0.55); }
    if (!o.noHand) {
      const [nx, ny] = w.cur === 'flat' ? nib.b : w.cur === 'name' ? nib.a : [760, 1640];
      const off = lerp(0, 1100, sstep(TT.n08e, TT.n09, t));
      penHand(g, nx, ny + off, 0.86, 0);
      if (lift > 0) { const k = sstep(0, 1, lift); chaiHand(g, 880, lerp(1740, 1505, k), 0.92, -0.04); steam(g, 874, lerp(1610, 1375, k), t, 0.6); }
    }
    g.restore();
  }
  function writing(t) {
    const TT = times();
    const name = sstep(TT.n03 + 0.05, TT.n03e + 0.25, t), flat = sstep(TT.n05 + 0.05, TT.n05e + 0.25, t);
    const cur = t < TT.n03e + 0.25 && t > TT.n03 - 0.05 ? 'name' : t < TT.n05e + 0.25 && t > TT.n05 - 0.05 ? 'flat' : null;
    return { name, flat, cur };
  }
  // the parcel's journey: the third man has it at his chest; on "Here, sir" it comes down to your desk; the fourth takes it away.
  function parcelState(t) {
    const TT = times(), t0 = TT.c01e - 0.05, t1 = TT.c01e + 0.4;
    const hi = sstep(TT.n07 - 0.05, TT.n07 + 0.25, t) * (1 - sstep(TT.n08e + 0.1, TT.n08e + 0.4, t));
    const circle = sstep(TT.n07e + 0.85, TT.n07e + 1.25, t);
    const back = TT.d01e - 0.25;
    if (t < TT.downs[1][1] - 0.5) return { onChest: 0, onDesk: false, hi, circle };
    if (t < t0) return { onChest: 1, down: 0, who: 2, hands: true, x: PARCEL_DESK[0], y: PARCEL_DESK[1], hi, circle };
    if (t < t1) return { onChest: 1, down: sstep(t0, t1, t), who: 2, hands: true, x: PARCEL_DESK[0], y: PARCEL_DESK[1], hi, circle };
    if (t < back) return { onChest: 0, onDesk: true, hi, circle };
    const go = sstep(TT.d01e + 0.05, TT.d01e + 0.95, t), u = 1 - sstep(back, back + 0.4, t);
    return { onChest: go < 1 ? 1 : 0, down: u, who: 3, hands: true, x: lerp(PARCEL_DESK[0], 1620, go), y: PARCEL_DESK[1], hi: 0, circle: u > 0.5 ? circle : 0, track: go };
  }
  function choices(g, t, t0, t1) {
    if (t < t0) return;
    const labs = ['MATCH', 'NO MATCH'], w = 370, gap = 28, x0 = 513 - w - gap / 2, y = 1420;
    labs.forEach((s, i) => {
      const k = clamp(hit(t, t0 + i * 0.07, 'heavy')), sc = lerp(0.6, 1, k), x = x0 + i * (w + gap);
      const gone = clamp((t - t1) / 0.25);
      g.save(); g.translate(x + w / 2, y); g.scale(sc, sc); g.globalAlpha = clamp((t - t0 - i * 0.07) * 8) * (1 - gone);
      R(g, -w / 2, -56, w, 112, 18); g.fillStyle = PAPER; g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
      txt(g, s, 0, 28, 78, INK, { align: 'center', fit: w - 40 });
      g.restore();
    });
  }
  function shotGate(g, t) {
    const TT = times();
    gateSet(g, t);
    const out = sstep(TT.n01e - 0.05, TT.n01e + 0.15, t);
    if (out < 1) {
      g.save(); g.globalAlpha = 1 - out;
      const flip = wi('n01', 7) - 0.05;
      if (t < flip) { txt(g, "YOU'RE THE", 513, 362, 104, CREAM, { align: 'center', stroke: INK, sw: 0.14 }); txt(g, 'GUARD', 513, 520, 190, YEL, { align: 'center', fit: 860, stroke: INK, sw: 0.13 }); }
      else { title(g, 'WHOEVER YOU POINT AT', 356, 96, CREAM, t, flip); title(g, 'GOES TO JAIL', 492, 136, '#ff5a3a', t, wi('n01', 10) - 0.05); }
      g.restore();
    }
    if (t >= TT.n07 - 0.05 && t < TT.n08 + 0.1) choices(g, t, TT.n07 + 0.1, TT.n07e + 1.05);
    return 0;
  }

  // ------------------------------------------------------------------ 2 · flat 302
  function shotFlat(g, t) {
    const TT = times();
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#ebe0c8'], [1, '#cfc2a4']); g.fillRect(0, 0, W, H);
    g.fillStyle = '#7f6448'; g.fillRect(0, 1360, W, 560);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 1360, W, 16);
    const z = 1 + 0.04 * sstep(TT.n10, TT.n11, t);
    g.save(); g.translate(513, 900); g.scale(z, z); g.translate(-513, -900);
    // the doorway, the dark room, the almirah standing open
    R(g, 276, 380, 520, 980, 8); g.fillStyle = '#5a3a22'; g.fill();
    g.fillStyle = lg(g, 300, 400, 300, 1360, [0, '#3b3a44'], [1, '#26252c']); g.fillRect(300, 404, 472, 956);
    g.fillStyle = '#6e7687'; R(g, 372, 620, 340, 620, 6); g.fill();
    g.fillStyle = '#2a2c34'; g.fillRect(392, 640, 300, 580);
    g.fillStyle = '#7a8295'; g.beginPath(); g.moveTo(372, 620); g.lineTo(290, 660); g.lineTo(290, 1270); g.lineTo(372, 1240); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(712, 620); g.lineTo(790, 660); g.lineTo(790, 1270); g.lineTo(712, 1240); g.closePath(); g.fill();
    g.fillStyle = '#46464e'; for (const yy of [760, 900, 1040]) g.fillRect(392, yy, 300, 10);
    g.fillStyle = '#d33b5a'; g.beginPath(); g.moveTo(420, 1220); g.quadraticCurveTo(470, 1130, 560, 1210); g.lineTo(560, 1222); g.closePath(); g.fill();
    // the door, pushed open, with its brass number
    g.fillStyle = lg(g, 166, 390, 310, 1360, [0, '#a06d3e'], [1, '#7b4f2b']); g.beginPath(); g.moveTo(300, 404); g.lineTo(150, 340); g.lineTo(150, 1440); g.lineTo(300, 1360); g.closePath(); g.fill();
    g.save(); g.transform(0.58, -0.16, 0, 1, 170, 0); R(g, 20, 560, 240, 120, 12); g.fillStyle = '#e7bf58'; g.fill(); g.strokeStyle = '#8f6a1e'; g.lineWidth = 6; g.stroke(); txt(g, '302', 140, 652, 108, '#3b2a0c', { align: 'center' }); g.restore();
    policeTape(g, 210, 720, 860, 980); policeTape(g, 210, 1120, 860, 820);
    g.restore();
    title(g, 'FLAT 302', 386, 150, YEL, t, TT.n10 - 0.02);
    title(g, 'ROBBED', 520, 120, '#ff5a3a', t, wi('n10', 2) - 0.02);
    return flashAt(t, TT.n10 - 0.05) * 0.5;
  }

  // ------------------------------------------------------------------ 3 · the line of four, and the reversal
  const CW = 412, CH = 500, CX = [96, 524], CY = [486, 1002];
  function heightLines(g, x, y, w, h) {
    g.fillStyle = '#e3dcc9'; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(40,40,40,0.28)'; g.lineWidth = 3;
    for (let i = 1; i < 8; i++) { const yy = y + i * h / 8; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
  }
  function cell(g, n, t, o = {}) {
    const i = LINE[n], x = CX[n % 2], y = CY[n < 2 ? 0 : 1], k = o.pop ?? 1;
    g.save(); g.translate(x + CW / 2, y + CH / 2); g.scale(lerp(0.8, 1, k), lerp(0.8, 1, k)); g.globalAlpha *= clamp(k * 2); g.translate(-(x + CW / 2), -(y + CH / 2));
    g.save(); R(g, x, y, CW, CH, 12); g.clip();
    if (o.gate > 0) { if (!ST) makeStreet(); g.save(); g.globalAlpha = o.gate; g.drawImage(ST.bg, 340, 620, 640, 776, x, y, CW, CH); g.restore(); }
    if ((o.gate ?? 0) < 1) { g.save(); g.globalAlpha = 1 - (o.gate ?? 0); heightLines(g, x, y, CW, CH); g.restore(); }
    seated(g, MEN[i], x + CW / 2, y + CH * 0.5, 0.78, { op: o.op ?? 0, look: o.look || [0, 2], close: o.close ?? 0, smile: 0.08 });
    g.restore();
    g.strokeStyle = o.lit ? YEL : INK; g.lineWidth = o.lit ? 11 : 6; R(g, x, y, CW, CH, 12); g.stroke();
    // the number
    g.fillStyle = '#121212'; R(g, x + 16, y + CH - 86, 70, 70, 10); g.fill(); txt(g, String(n + 1), x + 51, y + CH - 28, 58, '#fff9ea', { kind: 'mono', align: 'center' });
    g.restore();
  }
  // what each man did: the same order the film happened in
  const DID = [{ n: 1, s: '"RAVI, SIR."', pid: 'n15' }, { n: 3, s: '"THREE ZERO TWO."', pid: 'n16' }, { n: 0, s: 'THE PARCEL', pid: 'n17' }, { n: 2, s: '"SORRY, SIR."', pid: 'n18' }];
  function shotLine(g, t) {
    const TT = times();
    g.fillStyle = '#d9d3c3'; g.fillRect(0, 0, W, H);
    const [sx, sy] = shakeAt(t, [TT.n18e + 0.02], 22);
    g.save(); g.translate(sx, sy);
    const z = 1 + 0.03 * sstep(TT.n11, TT.clockEnd, t);
    g.save(); g.translate(513, 960); g.scale(z, z); g.translate(-513, -960);
    for (let n = 0; n < 4; n++) {
      const did = DID.find((d) => d.n === n), lit = did && t >= at(did.pid) - 0.06;
      cell(g, n, t, { pop: clamp(hit(t, TT.n11 + 0.02 + n * 0.05, 'heavy')), lit, gate: lit ? clamp((t - at(did.pid) + 0.06) * 6) : 0, close: blinkAt(t, 2.1 + n * 0.3, 0.3 + n), look: [0, 2] });
      if (lit) {
        const x = CX[n % 2] + CW / 2, y = CY[n < 2 ? 0 : 1] + CH - 48, q = pop(t, at(did.pid) - 0.06);
        g.save(); g.translate(x + 22, y); g.scale(lerp(0.7, 1, q), lerp(0.7, 1, q));
        R(g, -148, -40, 296, 72, 12); g.fillStyle = '#121212'; g.fill(); txt(g, did.s, 0, 18, 46, YEL, { align: 'center', fit: 270 });
        g.restore();
      }
    }
    g.restore();
    // the head of the page
    const clock = Math.min(3, Math.max(0, Math.ceil(TT.clockEnd - t - 1e-3)));
    if (t < TT.n13 - 0.05) {
      title(g, 'WHICH ONE?', 410, 150, INK, t, TT.n12 - 0.05, { stroke: '#d9d3c3', sw: 0.02 });
    } else if (t < TT.n14 - 0.05) {
      txt(g, 'WHICH ONE?', 66, 420, 132, INK);
      g.save(); g.translate(806, 386); R(g, -125, -50, 250, 96, 12); g.fillStyle = '#121212'; g.fill(); txt(g, '00:0' + clock, 0, 26, 72, clock <= 1 ? '#ff4a30' : '#ffb347', { kind: 'mono', align: 'center' }); g.restore();
    } else if (t < TT.n18e) {
      title(g, "YOU'RE RIGHT.", 420, 150, GREEN, t, TT.n14 - 0.05, { stroke: '#d9d3c3', sw: 0.02 });
    } else {
      title(g, "YOU'RE RIGHT.", 420, 150, GREEN, t, -1, { stroke: '#d9d3c3', sw: 0.02 });
      stamp(g, 'ALL FOUR', 513, 1010, t, TT.n18e + 0.02, RED, 210, -0.08, 'rgba(255,255,255,0.96)');
    }
    if (t >= TT.jail - 0.04 && t < TT.n14 - 0.05) txt(g, 'HE GOES TO JAIL. THE OTHER THREE GO HOME.', 513, 1540, 58, RED, { align: 'center', fit: 860, a: clamp((t - TT.jail + 0.04) * 8) });
    g.restore();
    return flashAt(t, TT.n11 - 0.05) * 0.5;
  }

  // ------------------------------------------------------------------ 4 · the replay: the camera behind you for the first time
  function guardBack(g, x, y, s, down) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -300, 150, 300, 700, [0, '#c1ab74'], [1, '#927f50']);
    g.beginPath(); g.moveTo(-360, 900); g.lineTo(-340, 330); g.bezierCurveTo(-320, 190, -190, 150, -90, 130); g.lineTo(90, 130); g.bezierCurveTo(190, 150, 320, 190, 340, 330); g.lineTo(360, 900); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 170); g.lineTo(0, 900); g.stroke();
    for (const k of [-1, 1]) { R(g, k * 240 - 70, 196, 140, 34, 5); g.fillStyle = '#8c7646'; g.fill(); }
    const hy = -40 + 44 * down;
    g.fillStyle = '#a06f4a'; R(g, -60, 40 + 40 * down, 120, 130 - 40 * down, 30); g.fill();
    ell(g, 0, hy, 150, 180 - 24 * down); g.fillStyle = '#17110d'; g.fill();
    // the guard's beret
    g.fillStyle = lg(g, -170, hy - 180, 170, hy - 40, [0, '#2a3f79'], [1, '#1c2c58']); ell(g, 0, hy - 90 + 18 * down, 168, 98 - 18 * down); g.fill();
    for (const k of [-1, 1]) { ell(g, k * 152, hy + 20, 16, 34); g.fillStyle = '#a06f4a'; g.fill(); }
    g.restore();
  }
  function walkBob(t, on) { return on * Math.sin(t * 15) * 10; }
  function shotReplay(g, t) {
    const TT = times();
    if (!ST) makeStreet();
    g.drawImage(ST.bg, 0, 0); seller(g, t); van(g, t, 716, 642, 0.86);
    const R0 = TT.n19 - 0.1, R1 = TT.n19e + 0.18, L = (R1 - R0) / 3;
    // spots: 'desk' in front of you; 'q0', 'q1', 'q2' waiting by the van
    const Q = [[702, 884, 0.5], [800, 868, 0.46], [886, 856, 0.42]], DK = [513, 884, 0.56];
    const man = (i, x, y, s, b = 0, o = {}) => seated(g, MEN[i], x, y + b, s, { look: [i === 3 ? 0 : -6, 2], close: blinkAt(t, 2.4 + i * 0.3, 0.3 + i), smile: 0.3, patch: false, ...o });
    // the moment each one goes
    const cyc = (k) => { const a = R0 + k * L; return { go: sstep(a + 0.18 * L, a + 0.86 * L, t), next: sstep(a + 0.34 * L, a + 0.98 * L, t) }; };
    const pos = [[...DK], [...Q[0]], [...Q[1]], [...Q[2]]];
    let inside = 0, down = 0;
    for (let k = 0; k < 3; k++) {
      const c = cyc(k); const u = t - (R0 + k * L);
      if (c.go > 0.02) inside = Math.max(inside, c.go > 0.5 ? k + 1 : k);
      down = Math.max(down, win(t, R0 + k * L + 0.08 * L, R0 + k * L + 0.76 * L, 0.1 * L));
      // the k-th leaves left through the gate
      pos[k] = [lerp(DK[0], -340, c.go), DK[1], lerp(DK[2], 0.72, c.go)];
      // the rest move up one
      for (let j = k + 1; j < 4; j++) { const from = j - k - 1 < 3 ? Q[j - k - 1] : Q[2], to = j - k - 2 < 0 ? DK : Q[j - k - 2]; if (c.next > 0 && t > R0 + k * L) { pos[j] = [lerp(from[0], to[0], c.next), lerp(from[1], to[1], c.next), lerp(from[2], to[2], c.next)]; } }
    }
    // the last man leaves up the street, with the parcel, the way he came
    const out = sstep(TT.n20 - 0.2, TT.n20 + 0.9, t);
    if (out > 0) { pos[3] = [lerp(DK[0], 1500, out), DK[1], lerp(DK[2], 0.34, out)]; }
    // draw back to front, the queue first
    for (const i of [3, 2, 1, 0]) { const [x, y, s] = pos[i]; if (x < -200 || x > 1420) continue; const moving = Math.abs(x - (i === 0 ? DK[0] : pos[i][0])) > 0; man(i, x, y, s, Math.sin(t * 14 + i) * 3); }
    // the desk and you, from behind
    g.fillStyle = lg(g, 0, 1240, 0, 1920, [0, '#9c6c3d'], [1, '#5a3a1f']); g.beginPath(); g.moveTo(-20, 1282); g.lineTo(1100, 1262); g.lineTo(1100, 1960); g.lineTo(-20, 1960); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,240,210,0.3)'; g.fillRect(0, 1262, W, 8);
    guardBack(g, 513, 1500, 0.92, down);
    // REPLAY, and a count of who's got in
    g.fillStyle = 'rgba(14,14,16,0.75)'; R(g, 92, 286, 250, 70, 12); g.fill();
    g.fillStyle = '#ff3a26'; for (const k of [0, 1]) { g.beginPath(); g.moveTo(140 + k * 34, 300); g.lineTo(140 + k * 34, 342); g.lineTo(110 + k * 34, 321); g.closePath(); g.fill(); }
    txt(g, 'REPLAY', 196, 338, 44, CREAM, { kind: 'mono' });
    if (t < TT.n20 - 0.08) title(g, 'INSIDE: ' + inside, 468, 132, YEL, t, R0);
    if (t >= TT.one - 0.04) title(g, '1 TO JAIL', 380, 130, '#ff5a3a', t, TT.one - 0.04);
    if (t >= TT.three - 0.04) title(g, '3 GO HOME', 520, 130, YEL, t, TT.three - 0.04);
    return flashAt(t, TT.n19 - 0.14) * 0.4;
  }

  // ------------------------------------------------------------------ 5 · the checklist
  function shotList(g, t) {
    const TT = times();
    g.fillStyle = '#6e4a28'; g.fillRect(0, 0, W, H);
    const k = sstep(TT.fc - 0.3, TT.fc + 1.0, t), z = lerp(1, 1.09, k);
    g.save(); g.translate(500, 1180); g.scale(z, z); g.translate(-500, -1180);
    bookPage(g, 80, 300, 880, 1240);
    const rows = [['NAME', 'RAVI', TT.nm], ['FLAT', '302', TT.fl], ['PARCEL', '203', TT.pc]];
    rows.forEach(([lab, val, t0], i) => {
      const y = 540 + i * 262;
      txt(g, lab, 150, y - 120, 56, '#6d6452', { kind: 'semi' });
      if (val === '203') { txt(g, '203', 330, y, 150, '#1c1a14', { align: 'left' }); } else { writeOn(g, val, 340, y, 130, 1); }
      if (t >= t0 - 0.05) { const q = pop(t, t0 - 0.05); g.save(); g.translate(800, y - 62); g.scale(lerp(1.7, 1, q), lerp(1.7, 1, q)); g.strokeStyle = GREEN; g.lineWidth = 22; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-48, 0); g.lineTo(-10, 42); g.lineTo(60, -54); g.stroke(); g.restore(); }
    });
    // FACE, in red, and nothing beside it
    const y = 540 + 3 * 262;
    if (t >= TT.fc - 0.05) {
      const q = pop(t, TT.fc - 0.05);
      g.save(); g.translate(150, y - 60); g.scale(lerp(1.5, 1, q), lerp(1.5, 1, q)); txt(g, 'FACE', 0, 40, 120, RED, {}); g.restore();
      g.strokeStyle = RED; g.lineWidth = 12; R(g, 740, y - 130, 120, 120, 12); g.stroke();
    }
    g.restore();
    return flashAt(t, TT.n21 - 0.08) * 0.35;
  }

  // ------------------------------------------------------------------ 6 · the real thing: a door, and a construction worker. Then a jacket.
  function shotStudy(g, t) {
    const TT = times();
    if (!ST) makeStreet();
    g.drawImage(ST.bg, 0, 0);
    g.fillStyle = 'rgba(250,244,230,0.45)'; g.fillRect(0, 0, W, H);
    g.fillStyle = lg(g, 0, 1300, 0, 1920, [0, '#a59a86'], [1, '#7c735f']); g.fillRect(0, 1300, W, 620);
    const d0 = TT.n22 + 0.7, d1 = d0 + 1.0, u = sstep(d0, d1, t), who = u < 0.5 ? 0 : 1;
    const blank = sstep(TT.cw - 0.15, TT.cw + 0.45, t), jack = sstep(TT.n24 - 0.2, TT.n24 + 0.2, t);
    const jc = ['#ef8e2c', '#c96a14'];
    if (jack < 1) {
      g.save(); g.globalAlpha = 1 - jack;
      if (blank < 1) seated(g, WORKERS[who], 513, 900, 1.3, { jc, patch: false, op: 0.04 + 0.1 * Math.abs(Math.sin(t * 7)) * (t < TT.cw ? 1 : 0), look: [0, 2], close: blinkAt(t, 2.3, 0.3), smile: 0.2 });
      if (blank > 0) { g.save(); g.globalAlpha *= blank; seated(g, WORKERS[1], 513, 900, 1.3, { jc, patch: false, blank: true }); g.restore(); }
      g.restore();
    }
    if (jack > 0) { g.save(); g.globalAlpha = jack; seated(g, MEN[1], 513, 900, 1.3, { blank: true }); g.restore(); }
    if (u > 0 && u < 1) {                            // the door, carried across between you
      const x = lerp(-780, 1140, u);
      g.fillStyle = lg(g, x, 0, x + 720, 0, [0, '#8f6236'], [1, '#6e4726']); g.fillRect(x, 300, 720, 1700);
      g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 10; R(g, x + 90, 420, 540, 500, 12); g.stroke(); R(g, x + 90, 1000, 540, 700, 12); g.stroke();
      ell(g, x + 660, 1020, 26, 26); g.fillStyle = '#d8c078'; g.fill();
      for (const hy of [1040, 1290]) { ell(g, x + 8, hy, 44, 36); g.fillStyle = '#b98460'; g.fill(); ell(g, x + 712, hy, 44, 36); g.fill(); }
    }
    if (t >= TT.n22 - 0.05 && t < TT.n24 - 0.08) {
      title(g, '1998', 412, 150, INK, t, TT.n22 - 0.05, { stroke: CREAM, sw: 0.1 });
      txt(g, 'SIMONS & LEVIN', 513, 470, 50, '#3b382f', { kind: 'semi', align: 'center', a: clamp((t - TT.n22) * 4) });
    }
    if (t >= wi('n23', 3) - 0.05 && t < TT.n24 - 0.08) title(g, '2 IN 3 STUDENTS MISSED IT', 1490, 86, RED, t, wi('n23', 3) - 0.05, { stroke: CREAM, sw: 0.1 });
    if (t >= TT.n24 - 0.08) { title(g, 'YOU JUST', 360, 120, CREAM, t, TT.n24 - 0.08); title(g, 'SAW A JACKET.', 510, 160, YEL, t, wi('n24', 2) - 0.05); }
    return flashAt(t, TT.n22 - 0.08) * 0.35;
  }

  // ------------------------------------------------------------------ 7 · your own front door, and the man who brought your last parcel
  function shotDoor(g, t) {
    const TT = times();
    const open = sstep(TT.n25 + 0.05, TT.n25 + 0.75, t), z = lerp(1, 1.3, sstep(TT.n26, TT.end, t));
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#efe3c9'], [1, '#d6c7a4']); g.fillRect(0, 0, W, H);
    g.fillStyle = '#8a6a4a'; g.fillRect(0, 1500, W, 420);
    g.save(); g.translate(513, 900); g.scale(z, z); g.translate(-513, -900);
    R(g, 196, 296, 640, 1210, 6); g.fillStyle = '#6b4a2e'; g.fill();
    g.fillStyle = lg(g, 216, 316, 216, 1500, [0, '#f7f0dc'], [1, '#e7dcc0']); g.fillRect(216, 316, 600, 1184);
    // the corridor outside, him in it
    g.save(); g.beginPath(); g.rect(216, 316, 600, 1184); g.clip();
    g.fillStyle = lg(g, 0, 300, 0, 1500, [0, '#eadcc0'], [1, '#c3b190']); g.fillRect(216, 316, 600, 1184);
    seated(g, { ...MEN[1], jaw: 0.98, capC: ['#70808f', '#4d5a66', '#3b4650'] }, 516, 860, 1.25, { blank: true, jc: ['#7d8c9b', '#556270'], patch: false });
    box(g, 516, 1324, 1.05, { rot: 0.02 });
    for (const k of [-1, 1]) { ell(g, 516 + k * 168, 1344, 50, 40); g.fillStyle = '#b98460'; g.fill(); }
    g.restore();
    // your door, swinging in
    if (open < 1) {
      const w = lerp(600, 40, open);
      g.fillStyle = lg(g, 216, 316, 216 + w, 1500, [0, '#a06d3e'], [1, '#7b4f2b']); g.fillRect(216, 316, w, 1184);
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 8; R(g, 216 + w * 0.12, 400, w * 0.76, 460, 8); g.stroke(); R(g, 216 + w * 0.12, 940, w * 0.76, 480, 8); g.stroke();
      ell(g, 216 + w * 0.93, 930, 20 * clamp(w / 300), 20); g.fillStyle = '#d8c078'; g.fill();
    }
    g.restore();
    if (t >= wi('n27', 1) - 0.06) { title(g, 'WHAT DID HE', 372, 112, INK, t, wi('n27', 1) - 0.06, { stroke: CREAM, sw: 0.1 }); title(g, 'LOOK LIKE?', 500, 150, RED, t, wi('n27', 2) - 0.02, { stroke: CREAM, sw: 0.1 }); }
    return flashAt(t, TT.n25 - 0.1) * 0.4;
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
      if (t < TT.n10 - 0.05) fl = shotGate(g, t);
      else if (t < TT.n11 - 0.05) fl = shotFlat(g, t);
      else if (t < TT.n19 - 0.14) fl = shotLine(g, t);
      else if (t < TT.n21 - 0.08) fl = shotReplay(g, t);
      else if (t < TT.n22 - 0.08) fl = shotList(g, t);
      else if (t < TT.n25 - 0.1) fl = shotStudy(g, t);
      else fl = shotDoor(g, t);
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
