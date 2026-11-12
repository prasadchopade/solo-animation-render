// Reel 35 · You're the Cashier. Episode 10 of "You're the test subject", Tests desk.
// A man robs your counter at knifepoint. Four faces: whoever you pick goes to jail. Then four knives, and you know his at once.
// You'd know that knife anywhere, but the knife doesn't go to jail. His face was right behind it: he's number two. Weapon focus
// (Loftus, Loftus & Messo 1987: a cashier, a gun or a cheque). Last: who else was in the shop? Facts: docs/research.md.
// Our own drawings; nobody real. The face rig is reel 30's (from reels 19 and 20), extended with ears, a nose and an angry brow. 30 fps, no motion blur.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', PAPER = '#fbf7ec', YEL = '#ffd34a', CREAM = '#fff6e2', GREEN = '#149650', WALL = '#ece7da';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

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
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.globalAlpha *= clamp((t - t0) / 0.05);
    g.font = font(size); const w = g.measureText(s).width + 64;
    R(g, -w / 2, -size * 0.74, w, size * 1.0, 14); g.fillStyle = bg; g.fill(); g.strokeStyle = color; g.lineWidth = size * 0.085; g.stroke();
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

  // ------------------------------------------------------------------ the face rig (reel 30's), with ears, a nose and an angry brow
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
    if (o.teeth) { g.fillStyle = '#f7f2e4'; ell(g, 0, cy + bot * 1.05, w * 0.62, 14 * tb1); g.fill(); }
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
  function browLine(g, k, ex, ey, tilt, by0) {
    const P0 = [k * (ex - 48), ey - 40 + tilt + by0], P1 = [k * (ex + 6), ey - 60 + by0 - tilt * 0.2], P2 = [k * (ex + 54), ey - 40 - tilt * 0.3 + by0 * 0.4];
    g.beginPath(); g.moveTo(P0[0], P0[1]); g.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); g.stroke();
  }
  // L: skin, skinD, skinH, hair, style, must ('thin'|'thick'|'walrus'|null), stub, brow, browTilt, jaw, ew, eh, ear (scale), nose (width scale), lip
  function head(g, L, o = {}) {
    const op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw, drop = 104 * op, chin = 232 + drop, ey = -28, ex = 80;
    const ear = L.ear ?? 1;
    for (const k of [-1, 1]) {
      ell(g, k * (hw + 1 + 8 * (ear - 1)), -18, 25 * ear, 42 * ear, k * (0.08 + 0.12 * (ear - 1))); g.fillStyle = L.skin; g.fill();
      ell(g, k * (hw + 3 + 8 * (ear - 1)), -16, 12 * ear, 24 * ear, k * 0.08); g.fillStyle = L.skinD; g.fill();
    }
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
    mouth(g, my, op, { lip: '#83503f', w0: o.w0 ?? (L.lip ?? 44), frown: o.frown ?? 0, smile: o.smile ?? 0, teeth: o.teeth });
    if (L.must) {
      const big = L.must !== 'thin', th = L.must === 'walrus' ? 30 : big ? 24 : 13, w = L.must === 'walrus' ? 72 : big ? 62 : 52, sag = L.must === 'walrus' ? 16 : 0;
      g.fillStyle = L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0) + sag); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0) + sag); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
    }
    // the nose: its width is one of the ways the four differ
    const ny = 44, nw = L.nose ?? 1;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36 * nw, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.3)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 20, ny - 22); g.quadraticCurveTo(k * 31 * nw, ny, k * 25 * nw, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, k * 13 * nw, ny + 9, 8 * Math.sqrt(nw), 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5, ny - 8, 10, 15); g.fill();
    const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look };
    eye(g, -1, -ex, ey, close, eo); eye(g, 1, ex, ey, close, eo);
    g.strokeStyle = L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt + (o.anger || 0);
    browLine(g, -1, ex, ey, tilt, by0); browLine(g, 1, ex, ey, tilt, by0);
    if (o.anger > 6) { g.strokeStyle = 'rgba(90,45,25,0.35)'; g.lineWidth = 4; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 12, -78); g.lineTo(k * 8, -52); g.stroke(); } }
    g.fillStyle = L.hair;
    const hh = hw + 6;
    if (L.style === 'side') { g.beginPath(); g.moveTo(-hh, -38); g.bezierCurveTo(-hh - 10, -250, -80, -300, 16, -292); g.bezierCurveTo(140, -292, hh + 16, -220, hh, -38); g.bezierCurveTo(hh - 18, -112, 150, -158, 96, -176); g.bezierCurveTo(30, -196, -44, -176, -96, -192); g.bezierCurveTo(-140, -160, -hh + 22, -110, -hh, -38); g.fill(); }
    else if (L.style === 'part') { g.beginPath(); g.moveTo(hh, -38); g.bezierCurveTo(hh + 10, -250, 80, -300, -16, -292); g.bezierCurveTo(-140, -292, -hh - 16, -220, -hh, -38); g.bezierCurveTo(-hh + 18, -112, -150, -164, -80, -190); g.bezierCurveTo(-20, -150, 70, -160, 110, -186); g.bezierCurveTo(150, -150, hh - 22, -110, hh, -38); g.fill(); }
    else if (L.style === 'buzz') { g.save(); g.globalAlpha *= 0.82; g.beginPath(); g.moveTo(-hh + 6, -70); g.bezierCurveTo(-hh, -250, -80, -278, 0, -278); g.bezierCurveTo(80, -278, hh, -250, hh - 6, -70); g.bezierCurveTo(hh - 30, -150, 120, -190, 0, -196); g.bezierCurveTo(-120, -190, -hh + 30, -150, -hh + 6, -70); g.fill(); g.restore(); }
    else if (L.style === 'wavy') { g.beginPath(); g.moveTo(-hh, -30); g.bezierCurveTo(-hh - 30, -130, -hh, -230, -120, -270); g.bezierCurveTo(-100, -320, -20, -318, 10, -296); g.bezierCurveTo(60, -326, 130, -300, 140, -258); g.bezierCurveTo(hh + 8, -230, hh + 26, -130, hh, -30); g.bezierCurveTo(hh - 14, -110, 150, -172, 104, -176); g.bezierCurveTo(80, -150, 30, -196, -6, -172); g.bezierCurveTo(-46, -196, -90, -160, -116, -176); g.bezierCurveTo(-150, -172, -hh + 14, -110, -hh, -30); g.fill(); }
    else if (L.style === 'recede') { g.beginPath(); g.moveTo(-hh, -60); g.bezierCurveTo(-hh - 6, -230, -80, -282, 0, -282); g.bezierCurveTo(80, -282, hh + 6, -230, hh, -60); g.bezierCurveTo(hh - 16, -160, 120, -226, 60, -214); g.quadraticCurveTo(0, -250, -60, -214); g.bezierCurveTo(-120, -226, -hh + 16, -160, -hh, -60); g.fill(); }
  }

  // ------------------------------------------------------------------ the four men. One skin for all; they differ in hair, moustache, jaw, ears, nose and eyes.
  // Number 2 is the robber. Neighbours share features, the ends are far apart: 1 has his hair, 3 his moustache and ears.
  const S0 = { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983' }, HR = '#15100c';
  const MEN = [
    { ...S0, hair: HR, style: 'side', must: 'thin', stub: 0, brow: 14, browTilt: 4, jaw: 1.0, ew: 45, eh: 24, ear: 1.0, nose: 1.0 },
    { ...S0, hair: HR, style: 'side', must: 'thick', stub: 0, brow: 16, browTilt: 4, jaw: 1.03, ew: 42, eh: 21, ear: 1.22, nose: 1.18 },
    { ...S0, hair: HR, style: 'part', must: 'thick', stub: 0, brow: 15, browTilt: 4, jaw: 1.06, ew: 45, eh: 24, ear: 1.2, nose: 1.0 },
    { ...S0, hair: HR, style: 'buzz', must: 'thin', stub: 0, brow: 14, browTilt: 3, jaw: 1.09, ew: 44, eh: 23, ear: 1.0, nose: 1.15 },
  ];
  const ROB = MEN[1];
  const TEE1 = '#2f78a8', TEE2 = '#245f88', TEE3 = '#1c4c6e';         // the robber's plain blue T-shirt
  // a man from the chest up, in the shirt every man in a parade wears
  function suspect(g, L, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const by = 168;
    g.fillStyle = o.body || lg(g, -340, by, 340, by + 420, [0, '#ef8a2e'], [1, '#c9651a']);
    g.beginPath(); g.moveTo(-430, by + 1400); g.lineTo(-430, by + 520); g.bezierCurveTo(-430, by + 190, -270, by + 130, -96, by + 92); g.lineTo(96, by + 92); g.bezierCurveTo(270, by + 130, 430, by + 190, 430, by + 520); g.lineTo(430, by + 1400); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.14)'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 92, by + 80); g.lineTo(k * 10, by + 196); g.lineTo(k * 64, by + 206); g.lineTo(k * 150, by + 108); g.closePath(); g.fill(); }
    const nw = 70;
    g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 8, by + 110); g.quadraticCurveTo(0, by + 200, nw + 8, by + 110); g.lineTo(nw, 120); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,35,20,0.28)'; g.beginPath(); g.moveTo(-nw, 150); g.quadraticCurveTo(0, 235, nw, 150); g.lineTo(nw, 120); g.lineTo(-nw, 120); g.closePath(); g.fill();
    head(g, L, o);
    g.restore();
  }

  // ------------------------------------------------------------------ the knives. Origin = where the blade meets the handle; the blade runs along +x.
  // D is his: a yellow handle and a serrated edge (the cheap vegetable knife in half the kitchens in India). A is yellow and smooth,
  // B is black and serrated, C is wood, smooth, with a round tip. So colour alone leaves two, and the edge alone leaves two.
  const KNIVES = [
    { handle: ['#ffd23a', '#d9a50f'], rivets: 3, blade: 1.0, len: 430, serr: false, tip: 'point' },
    { handle: ['#3a3d42', '#1d1f23'], rivets: 2, blade: 0.95, len: 420, serr: true, tip: 'point' },
    { handle: ['#b07a44', '#74492a'], rivets: 2, blade: 0.9, len: 410, serr: false, tip: 'round' },
    { handle: ['#ffd23a', '#d9a50f'], rivets: 2, blade: 1.0, len: 430, serr: true, tip: 'point' },
  ];
  const HIS = KNIVES[3];
  function knife(g, K0, x, y, s, rot, o = {}) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    const L = K0.len, bw = 96 * K0.blade, hl = 200;
    if (!o.noHandle) {
      R(g, -hl, -bw * 0.36, hl + 10, bw * 0.62, bw * 0.3); g.fillStyle = lg(g, 0, -bw * 0.36, 0, bw * 0.26, [0, K0.handle[0]], [1, K0.handle[1]]); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 5; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.28)'; R(g, -hl + 18, -bw * 0.28, hl - 30, 9, 4); g.fill();
      for (let i = 0; i < K0.rivets; i++) { const rx = -hl + 50 + i * ((hl - 90) / Math.max(1, K0.rivets - 1)); ell(g, rx, -bw * 0.05, 11, 11); g.fillStyle = lg(g, rx - 10, 0, rx + 10, 0, [0, '#8e959c'], [0.5, '#f4f6f8'], [1, '#7a8188']); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.stroke(); }
      g.fillStyle = '#9aa1a8'; R(g, -6, -bw * 0.4, 16, bw * 0.7, 4); g.fill();      // the bolster
    }
    // the blade: spine along the top, the edge curving up to the tip; a serrated edge is a row of teeth
    const sp = -bw * 0.34, ed = bw * 0.62;
    // build the outline by hand so the serrated edge runs along the bottom
    const outline = () => {
      g.beginPath(); g.moveTo(8, sp);
      if (K0.tip === 'round') { g.lineTo(L - 60, sp); g.quadraticCurveTo(L + 10, sp + 4, L - 8, sp + bw * 0.5); g.quadraticCurveTo(L - 50, ed, L * 0.62, ed); }
      else { g.lineTo(L, sp + 6); g.quadraticCurveTo(L * 0.86, ed - 10, L * 0.66, ed); }
      // back along the edge to the heel (teeth point down)
      const xs = K0.tip === 'round' ? L * 0.62 : L * 0.66;
      if (K0.serr) { const n = 12; for (let i = 1; i <= n; i++) { const u = i / n, xm = lerp(xs, 8, u - 0.5 / n), xe = lerp(xs, 8, u); g.lineTo(xm, ed + 13); g.lineTo(xe, ed - 1); } }
      else g.lineTo(8, ed - 6);
      g.closePath();
    };
    outline(); g.fillStyle = lg(g, 0, sp, 0, ed, [0, '#eef1f4'], [0.42, '#c3c9cf'], [0.8, '#9aa2aa'], [1, '#e9edf0']); g.fill();
    g.strokeStyle = 'rgba(40,45,52,0.6)'; g.lineWidth = 4; g.lineJoin = 'round'; g.stroke();
    g.save(); outline(); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(8, ed - 22, L, 7);                // the bevel catches the light
    if (o.glint != null) { const gx = lerp(-80, L + 80, o.glint); g.save(); g.translate(gx, 0); g.transform(1, 0, -0.6, 1, 0, 0); g.fillStyle = lg(g, -70, 0, 70, 0, [0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.95)'], [1, 'rgba(255,255,255,0)']); g.fillRect(-70, sp - 20, 140, bw + 60); g.restore(); }
    g.restore();
    g.restore();
  }

  // ------------------------------------------------------------------ the shop, from behind the counter: the door on the left, shelves, the drinks fridge on the right
  let SH = null;
  function makeShop() {
    const bg = offscreen(W, H), g = bg.getContext('2d');
    // the far wall and the ceiling
    g.fillStyle = lg(g, 0, 0, 0, 1240, [0, '#f3c98d'], [0.55, '#f8dcae'], [1, '#f5d6a3']); g.fillRect(0, 0, W, H);
    g.fillStyle = '#e9b97a'; g.fillRect(0, 0, W, 300);
    g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, 296, W, 8);
    // a tube light
    g.fillStyle = '#ffffff'; R(g, 380, 236, 320, 22, 11); g.fill(); g.fillStyle = 'rgba(255,255,240,0.35)'; ell(g, 540, 260, 300, 40); g.fill();
    // the open door, on the left: daylight, a wall across the lane and a parked scooter (nobody on it)
    const dx = 40, dy = 470, dw = 250, dh = 640;
    g.fillStyle = lg(g, dx, dy, dx, dy + dh, [0, '#bfe7f5'], [0.55, '#fdf3d9'], [1, '#e8d6b6']); g.fillRect(dx, dy, dw, dh);
    g.fillStyle = '#d98b6a'; g.fillRect(dx, dy + 150, dw, 330);                       // the house across the lane
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(dx, dy + 150, dw, 12);
    g.fillStyle = '#5a6f8a'; R(g, dx + 40, dy + 220, 70, 90, 4); g.fill(); R(g, dx + 150, dy + 220, 70, 90, 4); g.fill();
    g.fillStyle = '#b9ac98'; g.fillRect(dx, dy + 480, dw, dh - 480);                 // the lane
    // scooter, side on
    g.save(); g.translate(dx + 120, dy + 560); g.fillStyle = '#2b2d33'; ell(g, -60, 34, 30, 30); g.fill(); ell(g, 66, 34, 30, 30); g.fill(); g.fillStyle = '#8a9096'; ell(g, -60, 34, 12, 12); g.fill(); ell(g, 66, 34, 12, 12); g.fill();
    g.fillStyle = '#d7473b'; g.beginPath(); g.moveTo(-86, 20); g.quadraticCurveTo(-70, -30, -10, -24); g.lineTo(40, -24); g.quadraticCurveTo(70, -60, 86, 10); g.lineTo(60, 20); g.closePath(); g.fill(); g.fillStyle = '#1c1c1c'; R(g, -40, -40, 70, 18, 8); g.fill(); g.restore();
    // the door frame
    g.strokeStyle = '#7a4a26'; g.lineWidth = 22; g.strokeRect(dx - 6, dy - 6, dw + 12, dh + 12);
    // shelves on the far wall, packed with bright, nameless packets
    const r = mulberry32(35), cols = ['#e8413a', '#f0c32a', '#2fa5d6', '#7c5cc4', '#e85d8a', '#3bb3a0', '#f08a3a', '#4a6fd6'];
    for (let row = 0; row < 5; row++) {
      const sy = 470 + row * 150;
      for (let x = 330; x < 1080;) {
        const w = 40 + r() * 46, hgt = 70 + r() * 56, c = cols[Math.floor(r() * cols.length)];
        if (x + w > 1080) break;
        g.fillStyle = c; R(g, x, sy + 118 - hgt, w, hgt, 6); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)'; R(g, x + 6, sy + 126 - hgt, w - 12, 10, 4); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.55)'; ell(g, x + w / 2, sy + 120 - hgt * 0.45, w * 0.28, hgt * 0.14); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + w - 6, sy + 118 - hgt, 6, hgt);
        x += w + 6;
      }
      g.fillStyle = '#a8693a'; g.fillRect(320, sy + 118, 760, 22); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(320, sy + 140, 760, 8);
    }
    // the drinks fridge on the right (no names), in front of the shelves
    const fx = 760, fy = 560, fw = 300, fh = 620;
    g.fillStyle = '#e9edf0'; R(g, fx, fy, fw, fh, 16); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#d3443a'; R(g, fx, fy, fw, 70, 16); g.fill();
    g.fillStyle = 'rgba(160,215,235,0.65)'; R(g, fx + 22, fy + 90, fw - 44, fh - 120, 10); g.fill();
    for (let sh = 0; sh < 4; sh++) {
      const yy = fy + 110 + sh * 120;
      for (let i = 0; i < 6; i++) { const bx = fx + 40 + i * 40, c = ['#c23b2c', '#f2a31b', '#3a8f4a', '#d8d2c8', '#6b3a1e', '#f2a31b'][(i + sh) % 6]; g.fillStyle = c; R(g, bx, yy + 20, 26, 78, 9); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; R(g, bx + 5, yy + 30, 5, 50, 3); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(fx + 26, yy + 100, fw - 52, 6);
    }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(fx + 40, fy + 100); g.lineTo(fx + 90, fy + 100); g.lineTo(fx + 30, fy + fh - 60); g.lineTo(fx + 22, fy + fh - 120); g.closePath(); g.fill();
    // the floor
    g.fillStyle = lg(g, 0, 1110, 0, 1340, [0, '#d9cbb3'], [1, '#c4b498']); g.fillRect(0, 1110, W, 260);
    g.strokeStyle = 'rgba(90,70,50,0.18)'; g.lineWidth = 3; g.beginPath(); for (let i = -8; i <= 8; i++) { g.moveTo(540 + i * 90, 1110); g.lineTo(540 + i * 260, 1360); } for (const yy of [1150, 1205, 1275]) { g.moveTo(0, yy); g.lineTo(W, yy); } g.stroke();
    // a soft vignette
    g.fillStyle = rg(g, 540, 820, 500, 1150, [0, 'rgba(60,30,10,0)'], [1, 'rgba(60,30,10,0.22)']); g.fillRect(0, 0, W, H);
    // the counter, close to the lens: wood front far edge, glass top, a jar of sweets on the right
    const cv = offscreen(W, H), c = cv.getContext('2d');
    c.fillStyle = lg(c, 0, 1330, 0, 1398, [0, '#8a5a32'], [1, '#6e4524']); c.fillRect(0, 1330, W, 70);
    c.fillStyle = lg(c, 0, 1290, 0, 1920, [0, 'rgba(190,225,235,0.92)'], [0.4, 'rgba(160,205,220,0.95)'], [1, 'rgba(120,170,190,0.98)']); c.beginPath(); c.moveTo(0, 1388); c.lineTo(W, 1388); c.lineTo(W, 1920); c.lineTo(0, 1920); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(0, 1388, W, 8);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(760, 1398); c.lineTo(900, 1398); c.lineTo(1010, 1920); c.lineTo(840, 1920); c.closePath(); c.fill();
    // under the glass: trays of sweets and toffees, soft
    const rr = mulberry32(81);
    for (let i = 0; i < 9; i++) { const tx = 20 + i * 118, ty = 1420 + (i % 2) * 18; c.fillStyle = 'rgba(255,250,240,0.55)'; R(c, tx, ty, 100, 70, 10); c.fill(); for (let k = 0; k < 6; k++) { c.fillStyle = ['#e8413a', '#f0c32a', '#2fa5d6', '#e85d8a', '#7c5cc4'][Math.floor(rr() * 5)]; ell(c, tx + 18 + (k % 3) * 32, ty + 22 + Math.floor(k / 3) * 26, 12, 9); c.fill(); } }
    SH = { bg, counter: cv };
  }

  // the old man by the fridge, reading: newspaper up, face hidden, white hair over the top. He turns a page once, at the slap.
  function uncle(g, x, y, s, t, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s);
    // the stool
    g.fillStyle = '#3f7fbf'; R(g, -120, 220, 240, 30, 10); g.fill(); g.fillStyle = '#2f629a'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 100, 245); g.lineTo(k * 130, 470); g.lineTo(k * 104, 470); g.lineTo(k * 80, 245); g.closePath(); g.fill(); }
    if (o.empty) {
      // the folded newspaper on the empty stool
      g.fillStyle = '#efe9da'; g.save(); g.translate(0, 206); g.rotate(-0.05); R(g, -96, -18, 192, 30, 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 3; g.stroke(); g.fillStyle = 'rgba(40,40,40,0.35)'; g.fillRect(-80, -10, 110, 6); g.restore();
      g.restore(); return;
    }
    // legs in white pyjamas, sandals
    g.fillStyle = '#efeadc'; for (const k of [-1, 1]) { R(g, k * 64 - 40, 200, 80, 250, 30); g.fill(); }
    g.fillStyle = '#6b4a2e'; for (const k of [-1, 1]) { R(g, k * 64 - 46, 440, 98, 26, 10); g.fill(); }
    // body, in a pale kurta
    g.fillStyle = '#e6e0cf'; R(g, -150, -60, 300, 300, 60); g.fill();
    // white hair above the paper
    g.fillStyle = '#c9a07e'; ell(g, 0, -150, 96, 104); g.fill();
    g.fillStyle = 'rgba(255,240,220,0.35)'; ell(g, -24, -220, 34, 18, -0.3); g.fill();                  // the shine on a bald crown
    g.fillStyle = '#e9e6df'; ell(g, -88, -150, 22, 34); g.fill(); ell(g, 88, -150, 22, 34); g.fill();   // white tufts over the ears only
    // the newspaper, held up in both hands; at the turn, one page lifts and flips over
    const turn = o.turn ?? 0;
    g.fillStyle = '#f2ecdc'; R(g, -210, -180, 420, 300, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 4; g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-3, -180, 6, 300);
    g.fillStyle = 'rgba(40,40,40,0.55)'; R(g, -190, -160, 170, 26, 4); g.fill(); R(g, 20, -160, 170, 26, 4); g.fill();
    g.fillStyle = 'rgba(40,40,40,0.25)'; for (let i = 0; i < 9; i++) { g.fillRect(-190, -118 + i * 24, 76, 7); g.fillRect(-100, -118 + i * 24, 76, 7); g.fillRect(20, -118 + i * 24, 76, 7); g.fillRect(110, -118 + i * 24, 76, 7); }
    if (turn > 0 && turn < 1) { const sx = Math.cos(turn * Math.PI); g.save(); g.translate(0, 0); g.scale(sx, 1); g.fillStyle = sx > 0 ? '#f6f1e3' : '#e9e2cf'; R(g, 0, -180, 210, 300, 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 4; g.stroke(); g.restore(); }
    g.fillStyle = '#c9a07e'; for (const k of [-1, 1]) { ell(g, k * 214, -20, 26, 34); g.fill(); }
    g.restore();
  }

  // your hands on the counter (POV), in a white shirt's cuffs
  function hand(g, x, y, s, rot, side, o = {}) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(side * s, s);
    g.fillStyle = '#f4f2ee'; R(g, -88, 120, 176, 400, 30); g.fill(); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(-88, 150, 176, 14);
    g.fillStyle = '#c69069';
    R(g, -78, -40, 156, 180, 60); g.fill();
    for (let i = 0; i < 4; i++) { const fx = -58 + i * 38, fl = [92, 118, 112, 86][i]; R(g, fx - 16, -40 - fl, 34, fl + 30, 17); g.fill(); g.fillStyle = 'rgba(255,240,230,0.5)'; ell(g, fx + 1, -40 - fl + 18, 9, 7); g.fill(); g.fillStyle = '#c69069'; }
    g.save(); g.translate(-78, 30); g.rotate(-0.9); R(g, -18, -90, 38, 110, 19); g.fill(); g.restore();
    g.strokeStyle = 'rgba(120,70,45,0.35)'; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-58 + i * 38 - 19, -36); g.lineTo(-58 + i * 38 - 19, 10); g.stroke(); }
    if (o.cash) { g.save(); g.translate(0, -70); g.rotate(-0.12); for (let i = 0; i < 4; i++) { g.fillStyle = ['#b98fd0', '#e3c34a', '#9fc0a8', '#d48aa8'][i]; R(g, -120 + i * 4, -50 - i * 6, 240, 110, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3; g.stroke(); } g.fillStyle = 'rgba(255,255,255,0.4)'; ell(g, -60, -62, 26, 26); g.fill(); g.restore(); }
    g.restore();
  }

  // ------------------------------------------------------------------ times, from the narration's words
  const at = (p) => words(p)[0].t0;
  const wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;
  const en = (p) => { const w = words(p); return w[w.length - 1].t1; };
  let T = null;
  function times() {
    if (T) return T;
    T = {
      n01: at('n01'), n01e: en('n01'), knifeW: wi('n01', 7), r01: at('r01'), r01e: en('r01'), n02: at('n02'), n03: at('n03'), whoever: at('n03'), jail3: wi('n03', 4), n03e: en('n03'),
      n04: at('n04'), n04e: en('n04'), n05: at('n05'), anywhere: wi('n05', 4), n05e: en('n05'), n06: at('n06'), jail6: wi('n06', 5), n06e: en('n06'), n07: at('n07'), n07e: en('n07'),
      n08: at('n08'), there: wi('n08', 4), n08e: en('n08'), n09: at('n09'), n09e: en('n09'), n10: at('n10'), free: wi('n10', 3), n10e: en('n10'), n11: at('n11'), n11e: en('n11'),
      n12: at('n12'), innocent: wi('n12', 4), n12e: en('n12'), n13: at('n13'), focus: wi('n13', 2), n13e: en('n13'), n14: at('n14'), third: wi('n14', 4), n14e: en('n14'),
      n14b: at('n14b'), seventh: wi('n14b', 3), n15: at('n15'), n16: at('n16'), n16e: en('n16'), end: tb('end'),
    };
    T.slap = T.r01 - 0.16; T.drawer = T.r01e + 0.04; T.lift = T.drawer + 0.28; T.snatch = T.lift + 0.32; T.back = T.snatch + 0.1; T.run = T.back + 0.25; T.gone = T.n02 - 0.12;
    T.cut1 = T.n02 - 0.08; T.clock0 = T.cut1 + 0.05; T.clock1 = T.clock0 + 5.0; T.cut2 = T.n04 - 0.1;
    T.cut3 = T.n07 - 0.15; T.cut4 = T.n08 - 0.2; T.cut5 = T.n09 - 0.3; T.cutDoor = T.n10 - 0.12; T.cutBack = T.n11 - 0.12; T.cut6 = T.n13 - 0.12; T.cut7 = T.n15 - 0.25;
    return T;
  }
  const blinkAt = (t, p = 3.3, off = 1.1) => (((t + off) % p) < 0.11 ? 1 : 0);          // never on frame 0
  function talkP(t, pid) {                         // a mouth for one phrase only
    for (const w of words(pid)) {
      if (t >= w.t0 && t <= w.t1) {
        const syl = Math.max(1, (w.w.toLowerCase().match(/[aeiouy]+/g) || []).length), u = (t - w.t0) / Math.max(0.05, w.t1 - w.t0);
        const v = 0.6 + 0.4 * Math.abs(Math.sin(w.t0 * 37.1));
        return (0.12 + 0.36 * v * Math.pow(Math.abs(Math.sin(Math.PI * u * syl)), 0.8));
      }
    }
    return 0;
  }

  // ------------------------------------------------------------------ the robber: leaning over the counter, the knife in his right hand (your left)
  const RB = { x: 560, y: 790, s: 0.8 };
  function robberBody(g, t, o = {}) {
    const L = ROB, by = 168;
    g.save(); g.translate(o.x ?? RB.x, o.y ?? RB.y); g.scale(o.s ?? RB.s, o.s ?? RB.s); g.rotate(o.lean ?? 0.03);
    // torso in the blue T-shirt, wide at the shoulders, down behind the counter
    g.fillStyle = lg(g, -330, by, 330, by + 900, [0, TEE1], [1, TEE2]);
    g.beginPath(); g.moveTo(-360, by + 1300); g.lineTo(-372, by + 360); g.bezierCurveTo(-370, by + 180, -250, by + 120, -96, by + 92); g.lineTo(96, by + 92); g.bezierCurveTo(250, by + 120, 370, by + 180, 372, by + 360); g.lineTo(360, by + 1300); g.closePath(); g.fill();
    g.fillStyle = TEE3; g.beginPath(); g.moveTo(-98, by + 86); g.quadraticCurveTo(0, by + 190, 98, by + 86); g.lineTo(84, by + 112); g.quadraticCurveTo(0, by + 200, -84, by + 112); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.moveTo(-372, by + 360); g.lineTo(-300, by + 1300); g.lineTo(-360, by + 1300); g.closePath(); g.fill();
    const nw = 70;
    g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 6, by + 110); g.quadraticCurveTo(0, by + 190, nw + 6, by + 110); g.lineTo(nw, 120); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,35,20,0.28)'; g.beginPath(); g.moveTo(-nw, 150); g.quadraticCurveTo(0, 235, nw, 150); g.lineTo(nw, 120); g.lineTo(-nw, 120); g.closePath(); g.fill();
    head(g, L, { op: o.op ?? 0, look: o.look || [0, 2], anger: o.anger ?? 14, frown: 0.5, close: o.close ?? 0, teeth: true });
    g.restore();
  }
  // his knife arm: from his right shoulder (your left) down and forward over the counter; the fist close to you, low on the left,
  // and the blade aimed up across the frame at you. It never crosses his face.
  function knifeArm(g, t, jab, o = {}) {
    const ox = o.x ?? RB.x, oy = o.y ?? RB.y, sc = (o.s ?? RB.s) / 0.8;
    const sx = ox - 250 * sc, sy = oy + 300 * sc;                                       // his right shoulder
    const fx = lerp(250, 285, jab) + (ox - RB.x), fy = lerp(1420, 1380, jab);             // the fist, close to the lens; a jab pushes it at you
    g.save();
    if (o.only) { const ks = 1.3, rot = -0.62; knife(g, HIS, fx + 118, fy - 128, ks, rot, { glint: o.glint }); g.save(); g.translate(fx, fy); g.rotate(-0.62); g.fillStyle = HIS.handle[1]; R(g, -230, -40, 84, 84, 30); g.fill(); g.fillStyle = HIS.handle[0]; R(g, -226, -36, 70, 60, 26); g.fill(); g.restore(); g.restore(); return; }
    // upper arm in the sleeve, forearm bare
    g.strokeStyle = TEE2; g.lineCap = 'round'; g.lineWidth = 128;
    const ex = (sx + fx) / 2 - 70, ey = (sy + fy) / 2 - 10;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
    g.fillStyle = ROB.skin; g.beginPath(); g.moveTo(ex - 52, ey - 20); g.lineTo(ex + 50, ey + 26); g.lineTo(fx + 86, fy - 10); g.lineTo(fx - 70, fy - 56); g.closePath(); g.fill();
    g.fillStyle = 'rgba(80,40,20,0.16)'; g.beginPath(); g.moveTo(ex + 20, ey + 16); g.lineTo(ex + 50, ey + 26); g.lineTo(fx + 86, fy - 10); g.lineTo(fx + 40, fy - 20); g.closePath(); g.fill();
    // the knife out of the top of the fist, aimed up and across at you; a jab makes it bigger
    const ks = lerp(1.3, 1.46, jab), rot = -0.62 + 0.04 * Math.sin(t * 3.1);
    knife(g, HIS, fx + 118, fy - 128, ks, rot, { glint: o.glint });               // gripped low, so the yellow handle shows above the fist
    // the fist round the handle: knuckles towards you
    g.save(); g.translate(fx, fy); g.rotate(-0.62);
    g.fillStyle = ROB.skin; R(g, -150, -96, 196, 176, 64); g.fill();
    g.fillStyle = ROB.skinD; for (let i = 0; i < 4; i++) { R(g, -138 + i * 44, 40, 42, 52, 18); g.fill(); }
    g.strokeStyle = 'rgba(80,40,20,0.35)'; g.lineWidth = 5; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-138 + i * 44, 40); g.lineTo(-138 + i * 44, 80); g.stroke(); }
    g.fillStyle = ROB.skinH; ell(g, -60, -54, 58, 24, 0.1); g.fill();
    g.fillStyle = HIS.handle[1]; R(g, -230, -40, 84, 84, 30); g.fill(); g.fillStyle = HIS.handle[0]; R(g, -226, -36, 70, 60, 26); g.fill();   // the pommel, yellow, out of the bottom of the fist
    g.restore();
    g.restore();
  }
  // his other hand: flat on the counter on the right, up for the slap, then grabbing the cash
  function freeHand(g, t, TT, o = {}) {
    const slap = TT.slap, up = sstep(slap - 0.22, slap - 0.06, t) * (1 - sstep(slap - 0.06, slap, t));
    const grab = sstep(TT.snatch - 0.18, TT.snatch, t), away = sstep(TT.back, TT.run, t);
    const x = lerp(840, 720, grab) + 240 * away, y = 1352 - 130 * up + lerp(0, 40, grab) - 260 * away;
    g.save(); g.translate(x, y); g.rotate(0.2 - 0.3 * grab);
    g.strokeStyle = TEE2; g.lineCap = 'round'; g.lineWidth = 116; g.beginPath(); g.moveTo(-40, -330); g.lineTo(-10, -170); g.stroke();
    g.fillStyle = ROB.skin; g.beginPath(); g.moveTo(-52, -175); g.lineTo(32, -165); g.lineTo(46, -20); g.lineTo(-58, -26); g.closePath(); g.fill();
    // the hand, flat, fingers towards you
    R(g, -78, -40, 156, 96, 36); g.fill();
    for (let i = 0; i < 4; i++) { R(g, -74 + i * 38, 22, 34, 66 - 22 * grab, 16); g.fill(); }
    R(g, 64, -30, 34, 70, 16); g.fill();
    g.strokeStyle = 'rgba(80,40,20,0.3)'; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-74 + i * 38 - 2, 26); g.lineTo(-74 + i * 38 - 2, 60); g.stroke(); }
    if (t >= TT.snatch - 0.02) { for (let i = 0; i < 3; i++) { g.fillStyle = ['#b98fd0', '#e3c34a', '#d48aa8'][i]; R(g, -110 + i * 6, -10 - i * 8, 220, 96, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 3; g.stroke(); } g.fillStyle = ROB.skinD; for (let i = 0; i < 4; i++) { R(g, -74 + i * 38, 30, 34, 44, 16); g.fill(); } }
    g.restore();
  }

  // ------------------------------------------------------------------ 1 · the robbery, frame 0 to the cut
  function robbery(g, t, o = {}) {
    const TT = times();
    if (!SH) makeShop();
    const freeze = o.freeze;                            // the reveal re-uses this frame, stopped
    const tt = freeze ?? t;
    const sh = freeze != null ? [0, 0] : shakeAt(t, [TT.slap, TT.snatch], 14);
    g.save(); g.translate(sh[0], sh[1]);
    g.drawImage(SH.bg, 0, 0);
    // the old man by the fridge: in view from frame 0 to the cut; he turns one page at the slap
    if (!o.noUncle) uncle(g, 862, 905, 0.34, tt, { turn: sstep(TT.slap + 0.1, TT.slap + 0.7, tt) });
    // the robber: in, at the counter, until he backs off and runs out of the door on the left
    const backed = sstep(TT.back, TT.run, tt), run = clamp((tt - TT.run) / Math.max(0.1, TT.gone - TT.run));
    const jab = o.jab ?? 0.12 * Math.exp(-Math.max(0, tt - TT.r01) * 5) * sstep(TT.r01 - 0.1, TT.r01, tt);
    if (run <= 0) {
      const rx = RB.x - 60 * backed, ry = RB.y - 30 * backed, rs = RB.s * (1 - 0.22 * backed);
      const op = Math.max(talkP(tt, 'r01'), freeze != null ? 0 : 0.06 + 0.03 * Math.sin(tt * 7));
      const turn = sstep(TT.back + 0.12, TT.run, tt);
      g.save(); g.translate(rx, 0); g.scale(1 - 0.85 * turn, 1); g.translate(-rx, 0);
      robberBody(g, tt, { x: rx, y: ry, s: rs, op, close: freeze != null ? 0 : blinkAt(tt, 3.7, 0.6), look: [lerp(0, -10, backed), 2] });
      g.restore();
    } else {
      // running out of the door: a blue blur that shrinks into the doorway
      const x = lerp(420, 160, run), y = lerp(780, 800, run), s = lerp(0.5, 0.3, run);
      g.save(); g.globalAlpha *= 1 - sstep(0.75, 1, run);
      g.translate(x, y); g.scale(s, s);
      g.fillStyle = TEE1; R(g, -170, 120, 340, 520, 90); g.fill();
      g.fillStyle = ROB.hair; ell(g, 0, 0, 150, 170); g.fill();
      g.fillStyle = ROB.skinD; R(g, -60, 120, 120, 60, 20); g.fill();
      g.strokeStyle = '#20262f'; g.lineWidth = 90; g.lineCap = 'round'; const sw = Math.sin(run * 22); g.beginPath(); g.moveTo(-60, 600); g.lineTo(-60 - 90 * sw, 960); g.moveTo(60, 600); g.lineTo(60 + 90 * sw, 960); g.stroke();
      g.restore();
    }
    // the counter, then his arms over it, then your hand
    g.drawImage(SH.counter, 0, 0);
    if (run <= 0) {
      if (!o.noKnife && backed < 0.6) { g.save(); g.globalAlpha *= 1 - sstep(0.3, 0.6, backed); knifeArm(g, tt, jab, { x: RB.x - 60 * backed, glint: freeze != null ? null : (tt < 0.5 ? tt / 0.5 : ((tt - TT.knifeW) > 0 && (tt - TT.knifeW) < 0.4 ? (tt - TT.knifeW) / 0.4 : null)) }); g.restore(); }
      if (backed < 0.5) freeHand(g, tt, TT);
    }
    const drawer = sstep(TT.drawer, TT.drawer + 0.2, tt) * (freeze != null ? 0 : 1);
    if (drawer > 0) {
      // the cash drawer slides out towards you at the bottom of the frame
      const dy = lerp(1960, 1660, drawer);
      g.fillStyle = '#5b3a1f'; R(g, 470, dy, 640, 330, 14); g.fill(); g.fillStyle = '#3d2614'; R(g, 492, dy + 22, 600, 290, 10); g.fill();
      for (let i = 0; i < 4; i++) { g.fillStyle = ['#b98fd0', '#e3c34a', '#9fc0a8', '#d48aa8'][i]; R(g, 506 + i * 146, dy + 36, 128, 200, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; ell(g, 570 + i * 146, dy + 120, 26, 26); g.fill(); }
    }
    const tremble = freeze != null ? 0 : 3 * Math.sin(tt * 31);
    const lift = sstep(TT.lift - 0.12, TT.lift + 0.12, tt) * (1 - sstep(TT.snatch - 0.05, TT.snatch + 0.1, tt));
    const dip = sstep(TT.drawer, TT.lift - 0.12, tt) * (1 - sstep(TT.lift - 0.12, TT.lift + 0.1, tt));
    // your right hand, on the glass near the drawer: it shakes; it dips for the cash and holds it up to him
    hand(g, lerp(820, 720, lift) + tremble, 1760 + 200 * dip - 300 * lift, 0.92, 0.18 - 0.2 * lift, -1, { cash: tt > TT.lift - 0.05 && tt < TT.snatch });
    g.restore();
    // frame 0: who you are, in two lines, until the first line has been said
    if (freeze == null && !o.noText) {
      const out = sstep(TT.n01e - 0.15, TT.n01e + 0.1, t);
      if (out < 1) {
        g.save(); g.globalAlpha = 1 - out;
        txt(g, "YOU'RE THE", 513, 358, 104, CREAM, { align: 'center', stroke: INK, sw: 0.16 });
        txt(g, 'CASHIER', 513, 506, 170, YEL, { align: 'center', fit: 860, stroke: INK, sw: 0.14 });
        g.restore();
      }
    }
    return 0;
  }

  // ------------------------------------------------------------------ the lineup wall: four big cards, 2 × 2
  const CARD = { w: 418, h: 462, x0: 72, y0: 370, gx: 22, gy: 20 };
  const cardXY = (i) => [CARD.x0 + (i % 2) * (CARD.w + CARD.gx), CARD.y0 + Math.floor(i / 2) * (CARD.h + CARD.gy)];
  function wallLines(g, x, y, w, h) {
    g.save(); R(g, x, y, w, h, 8); g.clip();
    g.fillStyle = WALL; g.fillRect(x, y, w, h);
    for (let k = 0; k < 10; k++) { const yy = y + 18 + k * 50; g.fillStyle = k % 2 ? 'rgba(20,19,15,0.2)' : 'rgba(20,19,15,0.5)'; g.fillRect(x, yy, w, k % 2 ? 2 : 3); }
    g.restore();
  }
  function tileNo(g, x, y, n, s = 76) { R(g, x, y, s, s, 8); g.fillStyle = '#121212'; g.fill(); txt(g, String(n), x + s / 2, y + s * 0.78, s * 0.8, '#fff9ea', { kind: 'mono', align: 'center' }); }
  function tick(g, x, y, s, k) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    ell(g, 0, 0, 60, 60); g.fillStyle = GREEN; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 7; g.stroke();
    g.lineWidth = 15; const a = clamp(k * 2), b = clamp(k * 2 - 1);
    g.beginPath(); g.moveTo(-28, 2); g.lineTo(lerp(-28, -8, a), lerp(2, 24, a)); if (b > 0) g.lineTo(lerp(-8, 32, b), lerp(24, -24, b)); g.stroke();
    g.restore();
  }
  function faceCard(g, i, t, o = {}) {
    const [x, y] = cardXY(i), L = MEN[i];
    g.save();
    if (o.pop != null) { const cx = x + CARD.w / 2, cy = y + CARD.h / 2; g.translate(cx, cy); g.scale(o.pop, o.pop); g.translate(-cx, -cy); }
    wallLines(g, x, y, CARD.w, CARD.h);
    g.save(); R(g, x, y, CARD.w, CARD.h, 8); g.clip();
    const r = mulberry32(i * 17 + 3), bl = t > 0.5 && ((t + r() * 7 + 1.1) % (3.4 + i * 0.5)) < 0.14 ? 1 : 0, glance = 5 * Math.sin(t * (0.6 + i * 0.13) + i) * (1 - (o.stare || 0));
    suspect(g, L, x + CARD.w / 2 + 1.5 * Math.sin(t * 0.6 + i), y + 226 + 1.5 * Math.sin(t * 0.5 + i * 2), 0.72, { close: bl, look: [glance, 0], frown: 0.2 });
    g.restore();
    tileNo(g, x + 12, y + CARD.h - 88, i + 1);
    R(g, x, y, CARD.w, CARD.h, 8); g.strokeStyle = '#121212'; g.lineWidth = 6; g.stroke();
    if (o.dim > 0) { R(g, x - 3, y - 3, CARD.w + 6, CARD.h + 6, 8); g.fillStyle = `rgba(217,211,195,${o.dim})`; g.fill(); }
    if (o.ring > 0) { R(g, x - 6, y - 6, CARD.w + 12, CARD.h + 12, 10); g.strokeStyle = INK; g.lineWidth = 14; g.globalAlpha *= o.ring; g.stroke(); }
    g.restore();
  }
  function knifeCard(g, i, t, o = {}) {
    const [x, y] = cardXY(i);
    g.save();
    if (o.pop != null) { const cx = x + CARD.w / 2, cy = y + CARD.h / 2; g.translate(cx, cy); g.scale(o.pop, o.pop); g.translate(-cx, -cy); }
    wallLines(g, x, y, CARD.w, CARD.h);
    g.save(); R(g, x, y, CARD.w, CARD.h, 8); g.clip();
    knife(g, KNIVES[i], x + 120, y + CARD.h - 110, 0.84, -0.86, { glint: o.glint });
    g.restore();
    tileNo(g, x + 12, y + 12, 'ABCD'[i]);
    R(g, x, y, CARD.w, CARD.h, 8); g.strokeStyle = '#121212'; g.lineWidth = 6; g.stroke();
    if (o.dim > 0) { R(g, x - 3, y - 3, CARD.w + 6, CARD.h + 6, 8); g.fillStyle = `rgba(217,211,195,${o.dim})`; g.fill(); }
    if (o.lit > 0) { R(g, x - 5, y - 5, CARD.w + 10, CARD.h + 10, 10); g.strokeStyle = GREEN; g.lineWidth = 12; g.globalAlpha *= o.lit; g.stroke(); }
    g.restore();
  }
  function clock(g, t, t0, t1, x = 840, y = 312) {
    const left = Math.min(5, Math.max(0, Math.ceil(t1 - t - 1e-3)));
    g.save(); g.translate(x, y); R(g, -112, -44, 224, 88, 12); g.fillStyle = '#121212'; g.fill();
    txt(g, '00:' + String(left).padStart(2, '0'), 0, 27, 68, left <= 2 ? '#ff4a30' : '#ffb347', { kind: 'mono', align: 'center' });
    g.restore();
  }
  function bars(g, x, y, w, h, k) {
    if (k <= 0) return;
    g.save(); R(g, x, y, w, h, 8); g.clip(); g.translate(0, lerp(-h - 40, 0, k));
    for (let i = 0; i < 5; i++) { const bx = x + 30 + i * ((w - 60) / 4); g.fillStyle = lg(g, bx - 14, 0, bx + 14, 0, [0, '#16181c'], [0.35, '#6f747d'], [0.55, '#9ea3ab'], [1, '#1c1e23']); g.fillRect(bx - 14, y - 10, 28, h + 20); }
    for (const yy of [y + 40, y + h - 40]) { g.fillStyle = lg(g, 0, yy - 16, 0, yy + 16, [0, '#16181c'], [0.4, '#7c818a'], [1, '#1c1e23']); g.fillRect(x - 10, yy - 16, w + 20, 32); }
    g.restore();
  }

  // ------------------------------------------------------------------ 2 · pick him
  function shotFaces(g, t) {
    const TT = times();
    const [sx, sy] = shakeAt(t, [TT.cut1], 34);
    g.fillStyle = '#d9d3c3'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(sx, sy);
    const stare = sstep(TT.clock1, TT.clock1 + 0.3, t);
    for (let i = 0; i < 4; i++) faceCard(g, i, t, { pop: clamp(hit(t, TT.cut1 + 0.02 + i * 0.05, 'heavy')), stare });
    txt(g, 'PICK HIM', 74, 342, 96, INK);
    clock(g, t, TT.clock0, TT.clock1);
    if (t >= TT.whoever - 0.04) { title(g, 'WHOEVER YOU PICK', 1430, 100, INK, t, TT.whoever - 0.04, { stroke: '#d9d3c3', sw: 0.02 }); title(g, 'GOES TO JAIL.', 1530, 104, RED, t, TT.jail3 - 0.04, { stroke: '#d9d3c3', sw: 0.02 }); }
    g.restore();
    return flashAt(t, TT.cut1) + flashAt(t, TT.clock1) * 0.25;
  }

  // ------------------------------------------------------------------ 3 · pick his knife. You'd know it anywhere; but the knife doesn't go to jail
  function shotKnives(g, t) {
    const TT = times();
    const [sx, sy] = shakeAt(t, [TT.cut2], 30);
    g.fillStyle = '#d9d3c3'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(sx, sy);
    const lit = sstep(TT.n05 - 0.15, TT.n05 + 0.1, t), alone = sstep(TT.n06 - 0.25, TT.n06 + 0.15, t);
    for (let i = 0; i < 4; i++) {
      const isHis = i === 3;
      g.save();
      if (!isHis) g.globalAlpha *= 1 - alone;
      else if (alone > 0) { const [x, y] = cardXY(3), cx = x + CARD.w / 2, cy = y + CARD.h / 2, tx = 540, ty = 820, sc = lerp(1, 1.55, alone); g.translate(lerp(cx, tx, alone), lerp(cy, ty, alone)); g.scale(sc, sc); g.translate(-cx, -cy); }
      knifeCard(g, i, t, { pop: clamp(hit(t, TT.cut2 + 0.02 + i * 0.05, 'heavy')), lit: isHis ? lit : 0, dim: isHis ? 0 : 0.45 * lit, glint: isHis && t > TT.n05 ? clamp((t - TT.n05) / 0.5) : null });
      g.restore();
    }
    txt(g, 'NOW HIS KNIFE', 74, 342, 96, INK, { a: 1 - alone });
    if (t < TT.n05 - 0.1) clock(g, t, TT.cut2, TT.cut2 + 3);
    if (t >= TT.anywhere - 0.04 && t < TT.n06 - 0.1) { title(g, "YOU'D KNOW IT", 1430, 104, INK, t, TT.n05, { stroke: '#d9d3c3', sw: 0.02 }); title(g, 'ANYWHERE.', 1530, 108, GREEN, t, TT.anywhere - 0.04, { stroke: '#d9d3c3', sw: 0.02 }); }
    if (t >= TT.n06) { title(g, "BUT THE KNIFE DOESN'T", 1430, 96, INK, t, TT.n06, { stroke: '#d9d3c3', sw: 0.02 }); title(g, 'GO TO JAIL.', 1530, 108, RED, t, TT.jail6 - 0.04, { stroke: '#d9d3c3', sw: 0.02 }); }
    g.restore();
    return flashAt(t, TT.cut2);
  }

  // ------------------------------------------------------------------ 4 · were you that sure of the man? The four again, staring at you
  function shotSure(g, t) {
    const TT = times();
    g.fillStyle = '#d9d3c3'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) faceCard(g, i, t, { pop: clamp(hit(t, TT.cut3 + 0.02 + i * 0.04, 'heavy')), stare: 1 });
    title(g, 'WERE YOU THAT SURE', 1430, 96, INK, t, TT.n07, { stroke: '#d9d3c3', sw: 0.02 });
    title(g, 'OF THE MAN?', 1530, 110, RED, t, wi('n07', 5) - 0.04, { stroke: '#d9d3c3', sw: 0.02 });
    return flashAt(t, TT.cut3) * 0.5;
  }

  // ------------------------------------------------------------------ 5 · his face was right there: frame 0 again, frozen; the camera goes past the knife to his face
  const FZ = 0.9;                                       // the frozen moment: frame 0's pose, a beat in
  function shotThere(g, t) {
    const TT = times(), u = t - TT.cut4;
    const push = sstep(0.1, 1.5, u);
    g.save();
    const z = lerp(1, 2.25, push), cx = lerp(540, RB.x, push), cy = lerp(960, RB.y - 20, push);
    g.translate(540, 960); g.scale(z, z); g.translate(-cx, -cy);
    robbery(g, t, { freeze: FZ });
    g.restore();
    if (t >= TT.there - 0.05) title(g, 'RIGHT THERE', 1470, 120, CREAM, t, TT.there - 0.05, { stroke: INK, sw: 0.14 });
    return 0;
  }

  // ------------------------------------------------------------------ 6 · he's number two. Picked nobody: he goes free. Picked 1, 3 or 4: an innocent man
  // His face at your counter goes beside his card, so you can check it: the same ears, moustache, nose and hair.
  function counterFace(g, x, y, w, h, k) {
    g.save(); R(g, x, y, w, h, 10); g.clip();
    g.fillStyle = '#f3c98d'; g.fillRect(x, y, w, h);
    g.save(); g.translate(x + w / 2, y + h / 2 + 30); g.scale(0.92, 0.92); g.translate(-RB.x, -RB.y);
    robberBody(g, FZ, { op: 0.06, close: 0 });
    g.restore(); g.restore();
    R(g, x, y, w, h, 10); g.strokeStyle = '#121212'; g.lineWidth = 6; g.stroke();
    R(g, x + 12, y + h - 58, 250, 46, 8); g.fillStyle = '#121212'; g.fill(); txt(g, 'AT YOUR COUNTER', x + 24, y + h - 24, 32, '#fff9ea', { kind: 'semi' });
  }
  function shotVerdict(g, t) {
    const TT = times(), u = t - TT.cut5;
    g.fillStyle = '#d9d3c3'; g.fillRect(0, 0, W, H);
    // the face from the counter lands in slot 1, beside card 2, for the check; then goes, and card 1 is back
    const cmp = sstep(0, 0.35, u) * (1 - sstep(TT.n10 - 0.3, TT.n10, t));
    for (let i = 0; i < 4; i++) {
      if (i === 0 && cmp > 0.5) continue;
      faceCard(g, i, t, { dim: i !== 1 && cmp > 0 ? 0.5 * cmp : 0, ring: i === 1 ? sstep(TT.n09 + 0.2, TT.n09 + 0.4, t) : 0 });
    }
    if (cmp > 0) {
      const [x1, y1] = cardXY(0), q = cmp;
      g.save(); g.globalAlpha *= clamp(q * 2);
      const w = lerp(W, CARD.w, q), h = lerp(H, CARD.h, q), x = lerp(0, x1, q), y = lerp(0, y1, q);
      counterFace(g, x, y, w, h, q);
      g.restore();
    }
    txt(g, "HE'S NUMBER 2", 74, 342, 96, INK, { a: sstep(TT.n09 - 0.05, TT.n09 + 0.1, t) });
    // picked 1, 3 or 4: an innocent man
    if (t >= TT.n11 - 0.04) {
      const pulse = sstep(TT.n11, TT.n11 + 0.15, t);
      for (const [j, i] of [[0, 0], [1, 2], [2, 3]]) { const [x, y] = cardXY(i); R(g, x - 5, y - 5, CARD.w + 10, CARD.h + 10, 10); g.strokeStyle = `rgba(226,48,26,${pulse})`; g.lineWidth = 10; g.stroke(); stamp(g, 'INNOCENT', x + CARD.w / 2, y + CARD.h / 2 + 30, t, TT.n11e + 0.05 + j * 0.09, RED, 76, -0.12, 'rgba(251,247,236,0.92)'); }   // in the gap, with the sound
      if (t < TT.n12) title(g, 'PICKED 1, 3 OR 4?', 1450, 100, INK, t, TT.n11 - 0.04, { stroke: '#d9d3c3', sw: 0.02 });
      else { title(g, 'YOU JUST SENT AN', 1430, 90, INK, t, TT.n12, { stroke: '#d9d3c3', sw: 0.02 }); title(g, 'INNOCENT MAN TO JAIL.', 1530, 98, RED, t, TT.innocent - 0.04, { stroke: '#d9d3c3', sw: 0.02 }); }
    }
    return 0;
  }

  // the doorway he ran out of, empty, the lane bright beyond it: picked nobody? He's still out there. (Only the door: the old man stays out of shot.)
  function shotDoor(g, t) {
    const TT = times(), u = t - TT.cutDoor;
    if (!SH) makeShop();
    const z = 2.15 + 0.08 * sstep(0, 2.5, u);
    g.save(); g.translate(540, 900); g.scale(z, z); g.translate(-262, -800);                 // the left edge stays inside the shop
    g.drawImage(SH.bg, 0, 0);
    g.restore();
    g.fillStyle = 'rgba(10,11,15,0.18)'; g.fillRect(0, 0, W, H);
    title(g, 'PICKED NOBODY?', 400, 110, CREAM, t, TT.n10 - 0.04, { stroke: INK, sw: 0.14 });
    title(g, "HE'S STILL OUT THERE.", 1460, 104, YEL, t, wi('n10', 2) - 0.04, { stroke: INK, sw: 0.14 });
    return 0;
  }

  // ------------------------------------------------------------------ 7 · weapon focus: the classic test, a counter, a cheque or a gun
  function counterPanel(g, x, y, w, h, gun, pct, t, t0) {
    g.save(); R(g, x, y, w, h, 18); g.fillStyle = '#fff8e8'; g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke(); g.clip();
    g.fillStyle = '#f2d39c'; g.fillRect(x, y, w, h * 0.62);
    g.fillStyle = '#c77d3a'; g.fillRect(x, y + h * 0.62, w, h * 0.38);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y + h * 0.62, w, 10);
    const ax = x + w * 0.62, ay = y + h * 0.5;
    g.strokeStyle = '#2f78a8'; g.lineWidth = 56; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w + 40, y + h * 0.18); g.lineTo(ax + 60, ay - 10); g.stroke();
    g.fillStyle = '#bd8a64'; R(g, ax - 24, ay - 40, 100, 74, 30); g.fill();
    if (gun) {
      g.save(); g.translate(ax - 10, ay - 26); g.fillStyle = '#26282d';
      R(g, -190, -26, 200, 48, 8); g.fill();                                   // slide and barrel, pointing left at the cashier
      g.fillStyle = '#3a3d44'; R(g, -184, -20, 120, 10, 4); g.fill();
      g.fillStyle = '#26282d'; g.save(); g.translate(-6, 16); g.rotate(0.28); R(g, -30, 0, 54, 96, 12); g.fill(); g.restore();   // grip
      g.strokeStyle = '#26282d'; g.lineWidth = 9; g.beginPath(); g.arc(-58, 26, 22, 0.1, Math.PI - 0.1); g.stroke();             // trigger guard
      g.restore();
    }
    else { g.save(); g.translate(ax - 70, ay - 6); g.rotate(-0.12); g.fillStyle = '#e8f0ff'; R(g, -110, -50, 190, 90, 6); g.fill(); g.strokeStyle = '#8aa4c8'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#8aa4c8'; for (let i = 0; i < 3; i++) g.fillRect(-90, -30 + i * 22, 110 - i * 30, 6); g.restore(); }
    g.restore();
    txt(g, gun ? 'HE HOLDS A GUN' : 'HE HANDS OVER A CHEQUE', x + 28, y + 70, 54, INK, { kind: 'semi', fit: w - 56 });
    if (t >= t0) { const q = pop(t, t0); g.save(); g.translate(x + 40, y + h - 70); g.scale(lerp(0.8, 1, q), lerp(0.8, 1, q)); txt(g, pct[0], 0, 0, 150, gun ? RED : GREEN, { stroke: '#fff8e8', sw: 0.08, a: clamp((t - t0) * 8) }); txt(g, 'PICKED THE RIGHT MAN', 330, -36, 44, INK, { kind: 'semi', a: clamp((t - t0) * 8) }); txt(g, pct[1], 330, 12, 36, '#5b574d', { kind: 'mono', a: clamp((t - t0) * 8) }); g.restore(); }
  }
  function shotScience(g, t) {
    const TT = times();
    g.fillStyle = '#f6efe0'; g.fillRect(0, 0, W, H);
    txt(g, "IT'S CALLED", 513, 300, 70, INK, { kind: 'semi', align: 'center', a: sstep(TT.cut6, TT.cut6 + 0.15, t) });
    title(g, 'WEAPON FOCUS', 430, 150, YEL, t, TT.focus - 0.05, { stroke: INK, sw: 0.14 });
    const p0 = TT.n13e + 0.05;
    if (t >= p0) {
      const a = clamp((t - p0) * 4);
      g.save(); g.globalAlpha *= a;
      counterPanel(g, 80, 500, 860, 430, false, ['1 IN 3', '35 %'], t, TT.third - 0.08);
      counterPanel(g, 80, 960, 860, 430, true, ['1 IN 7', '15 %'], t, TT.seventh - 0.08);
      txt(g, 'LOFTUS, LOFTUS & MESSO, 1987 · 80 STUDENTS · A 12-PHOTO LINEUP', 513, 1450, 28, '#5b574d', { kind: 'mono', align: 'center', fit: 860 });
      g.restore();
    }
    return 0;
  }

  // ------------------------------------------------------------------ 8 · so. Who else was in the shop? Frame 0, frozen, dark everywhere but the knife
  function shotDark(g, t) {
    const TT = times(), u = t - TT.cut7;
    robbery(g, t, { freeze: FZ, noText: true });
    const k = sstep(0, 0.5, u);
    g.fillStyle = `rgba(8,9,12,${0.94 * k})`; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = k; knifeArm(g, FZ, 0, { only: true }); g.restore();
    if (t >= TT.n15 - 0.04) title(g, 'GOT NUMBER 2?', 430, 116, CREAM, t, TT.n15 - 0.04, { stroke: INK, sw: 0.14 });
    if (t >= TT.n16 - 0.04) { title(g, 'THEN WHO ELSE WAS', 610, 116, CREAM, t, TT.n16 - 0.04, { stroke: INK, sw: 0.14 }); title(g, 'IN THE SHOP?', 760, 150, YEL, t, wi('n16', 4) - 0.04, { stroke: INK, sw: 0.14 }); }
    txt(g, "YOU'RE THE TEST SUBJECT", 513, 1500, 40, '#b9b4a6', { kind: 'semi', align: 'center', a: clamp((t - TT.n16) * 3) });
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
      if (t < TT.cut1) fl = robbery(g, t);
      else if (t < TT.cut2) fl = shotFaces(g, t);
      else if (t < TT.cut3) fl = shotKnives(g, t);
      else if (t < TT.cut4) fl = shotSure(g, t);
      else if (t < TT.cut5) fl = shotThere(g, t);
      else if (t < TT.cutDoor) fl = shotVerdict(g, t);
      else if (t < TT.cutBack) fl = shotDoor(g, t);
      else if (t < TT.cut6) fl = shotVerdict(g, t);
      else if (t < TT.cut7) fl = shotScience(g, t);
      else fl = shotDark(g, t);
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
