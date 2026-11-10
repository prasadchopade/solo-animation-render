// Reel 30 · How Sure Are You? A direct sequel to The Only Witness (reel 20), Tests desk.
// You're the only witness, again. Six faces, one of them did it; you pick; out of ten, how sure are you? Outside the magistrate's door an
// officer says "Good. That's him." He's a drawing, so the voice gives you the real answer: number three. Of course it is. Now how sure are you?
// "It isn't number three. I made that up." Whoever you picked is still going to prison. You still know your first number because she asked; if
// nobody had, you'd swear you were sure from the start. A real witness in America, told she'd picked the same man twice: "Bingo. I did it right."
// The hidden layer: number 3 IS the thief. Only he has the cut through his eyebrow, so "I made that up" is the lie. Facts: docs/research.md.
// Our own drawings; nobody real. The rig, the street, the woman's shape, the cell wall and the court are from reels 19, 20, 25 and 26. 30 fps, no motion blur.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', PAPER = '#fbf7ec', YEL = '#ffd34a', CREAM = '#fff6e2', GREEN = '#149650', WALL = '#ece7da', DARK = '#0c0d11';
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
  function title(g, s, y, size, color, t, t0, o = {}) {            // a caption that lands with a small spring
    if (t < t0) return;
    const q = pop(t, t0);
    g.save(); g.translate(o.x ?? 513, y); g.scale(lerp(0.86, 1, q), lerp(0.86, 1, q));
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
  // ------------------------------------------------------------------ the men. One skin for all of them: the six differ only in shape and expression.
  // Number 3 is the thief: only he has the nick through his left eyebrow (your right as you face him). Number 5 is very nearly him, without it.
  // Number 2 is the chai seller, again (reel 20's plant). The voice says "It isn't number three": that's the lie you find on the second viewing.
  const S0 = { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983' }, HR = '#15100c';
  const MEN = [
    { ...S0, hair: HR, style: 'part', must: 'thin', stub: 0, brow: 12, browTilt: 0, jaw: 0.97, ew: 45, eh: 24 },
    { ...S0, hair: HR, style: 'buzz', must: 'thick', stub: 0, brow: 15, browTilt: 4, jaw: 1.05, ew: 42, eh: 22 },
    { ...S0, hair: HR, style: 'side', must: 'thin', stub: 0.45, brow: 15, browTilt: 7, jaw: 1.0, ew: 44, eh: 23, nick: true },
    { ...S0, hair: HR, style: 'wavy', must: null, stub: 0.7, brow: 14, browTilt: 3, jaw: 1.07, ew: 44, eh: 23 },
    { ...S0, hair: HR, style: 'side', must: 'thin', stub: 0.4, brow: 14, browTilt: 5, jaw: 1.03, ew: 46, eh: 24 },
    { ...S0, hair: HR, style: 'recede', must: 'thin', stub: 0.1, brow: 11, browTilt: -2, jaw: 0.93, ew: 46, eh: 25 },
  ];
  const THIEF = MEN[2], SELLER = MEN[1];
  const OFF = { ...S0, hair: '#1a130e', style: 'pcap', must: 'thick', stub: 0.08, brow: 15, browTilt: -3, jaw: 1.12, ew: 46, eh: 27 };
  const blinkAt = (t, p = 3.3, off = 1.1) => (((t + off) % p) < 0.11 ? 1 : 0);          // never on frame 0

  function browLine(g, k, ex, ey, tilt, by0, nick) {
    const P0 = [k * (ex - 48), ey - 40 + tilt + by0], P1 = [k * (ex + 6), ey - 60 + by0], P2 = [k * (ex + 54), ey - 40 - tilt * 0.3 + by0 * 0.4];
    const q = (u) => [(1 - u) * (1 - u) * P0[0] + 2 * u * (1 - u) * P1[0] + u * u * P2[0], (1 - u) * (1 - u) * P0[1] + 2 * u * (1 - u) * P1[1] + u * u * P2[1]];
    const seg = (a, b) => { g.beginPath(); for (let i = 0; i <= 14; i++) { const [x, y] = q(lerp(a, b, i / 14)); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); };
    if (nick) { seg(0, 0.48); seg(0.78, 1); } else seg(0, 1);
  }
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
    g.restore();
    const my = 118 + drop * 0.2;
    if (o.grin > 0) {
      const w = lerp(50, 92, o.grin), u = 10 + 44 * o.grin;
      g.beginPath(); g.moveTo(-w, my - 16); g.quadraticCurveTo(0, my + u * 1.7, w, my - 16); g.quadraticCurveTo(0, my + 2, -w, my - 16); g.closePath(); g.fillStyle = '#fbf7ee'; g.fill(); g.strokeStyle = '#5a2b20'; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke();
      g.fillStyle = 'rgba(200,90,70,0.16)'; for (const k of [-1, 1]) { ell(g, k * 118, 74, 44, 26); g.fill(); }
    } else mouth(g, my, op, { lip: '#83503f', w0: o.w0 ?? 44, frown: o.frown ?? 0, smile: o.smile ?? 0 });
    if (L.must) {
      const big = L.must === 'thick', th = big ? 24 : 13, w = big ? 62 : 52;
      g.fillStyle = L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
    }
    const ny = 44;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 22, ny - 18); g.quadraticCurveTo(k * 31, ny, k * 25, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, k * 13, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5, ny - 8, 10, 15); g.fill();
    const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look };
    eye(g, -1, -ex, ey, close, eo); eye(g, 1, ex, ey, close, eo);
    g.strokeStyle = L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt + (o.worry || 0);
    browLine(g, -1, ex, ey, tilt, by0, false); browLine(g, 1, ex, ey, tilt, by0, !!L.nick);
    g.fillStyle = L.hair;
    const hh = hw + 6;
    if (L.style === 'side') { g.beginPath(); g.moveTo(-hh, -38); g.bezierCurveTo(-hh - 10, -250, -80, -300, 16, -292); g.bezierCurveTo(140, -292, hh + 16, -220, hh, -38); g.bezierCurveTo(hh - 18, -112, 150, -158, 96, -176); g.bezierCurveTo(30, -196, -44, -176, -96, -192); g.bezierCurveTo(-140, -160, -hh + 22, -110, -hh, -38); g.fill(); }
    else if (L.style === 'part') { g.beginPath(); g.moveTo(hh, -38); g.bezierCurveTo(hh + 10, -250, 80, -300, -16, -292); g.bezierCurveTo(-140, -292, -hh - 16, -220, -hh, -38); g.bezierCurveTo(-hh + 18, -112, -150, -164, -80, -190); g.bezierCurveTo(-20, -150, 70, -160, 110, -186); g.bezierCurveTo(150, -150, hh - 22, -110, hh, -38); g.fill(); }
    else if (L.style === 'buzz') { g.save(); g.globalAlpha *= 0.82; g.beginPath(); g.moveTo(-hh + 6, -70); g.bezierCurveTo(-hh, -250, -80, -278, 0, -278); g.bezierCurveTo(80, -278, hh, -250, hh - 6, -70); g.bezierCurveTo(hh - 30, -150, 120, -190, 0, -196); g.bezierCurveTo(-120, -190, -hh + 30, -150, -hh + 6, -70); g.fill(); g.restore(); }
    else if (L.style === 'wavy') { g.beginPath(); g.moveTo(-hh, -30); g.bezierCurveTo(-hh - 30, -130, -hh, -230, -120, -270); g.bezierCurveTo(-100, -320, -20, -318, 10, -296); g.bezierCurveTo(60, -326, 130, -300, 140, -258); g.bezierCurveTo(hh + 8, -230, hh + 26, -130, hh, -30); g.bezierCurveTo(hh - 14, -110, 150, -172, 104, -176); g.bezierCurveTo(80, -150, 30, -196, -6, -172); g.bezierCurveTo(-46, -196, -90, -160, -116, -176); g.bezierCurveTo(-150, -172, -hh + 14, -110, -hh, -30); g.fill(); }
    else if (L.style === 'recede') { g.beginPath(); g.moveTo(-hh, -60); g.bezierCurveTo(-hh - 6, -230, -80, -282, 0, -282); g.bezierCurveTo(80, -282, hh + 6, -230, hh, -60); g.bezierCurveTo(hh - 16, -160, 120, -226, 60, -214); g.quadraticCurveTo(0, -250, -60, -214); g.bezierCurveTo(-120, -226, -hh + 16, -160, -hh, -60); g.fill(); }
    else if (L.style === 'pcap') {
      // a plain khaki peaked cap, no insignia: hair at the temples, the crown, a dark band, the peak
      g.beginPath(); g.moveTo(-hh, -36); g.lineTo(-hh + 4, -130); g.lineTo(-hh + 36, -130); g.lineTo(-hh + 24, -46); g.closePath(); g.moveTo(hh, -36); g.lineTo(hh - 4, -130); g.lineTo(hh - 36, -130); g.lineTo(hh - 24, -46); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,20,6,0.28)'; g.beginPath(); g.moveTo(-hw + 8, -112); g.quadraticCurveTo(0, -66, hw - 8, -112); g.lineTo(hw - 8, -144); g.lineTo(-hw + 8, -144); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-hh - 2, -142); g.bezierCurveTo(-hh - 64, -226, -hh - 40, -306, -128, -324); g.bezierCurveTo(-44, -346, 44, -346, 128, -324); g.bezierCurveTo(hh + 40, -306, hh + 64, -226, hh + 2, -142); g.quadraticCurveTo(0, -178, -hh - 2, -142); g.closePath(); g.fillStyle = lg(g, -hh, -340, hh, -140, [0, '#cfae6e'], [1, '#a08246']); g.fill();
      g.strokeStyle = 'rgba(70,50,10,0.3)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-hh - 26, -232); g.quadraticCurveTo(0, -270, hh + 26, -232); g.stroke();
      g.beginPath(); g.moveTo(-hh - 2, -148); g.quadraticCurveTo(0, -186, hh + 2, -148); g.lineTo(hh + 2, -112); g.quadraticCurveTo(0, -150, -hh - 2, -112); g.closePath(); g.fillStyle = '#5a4522'; g.fill();
      g.beginPath(); g.moveTo(-hh + 8, -116); g.quadraticCurveTo(0, -152, hh - 8, -116); g.quadraticCurveTo(hh + 12, -92, hh - 46, -76); g.quadraticCurveTo(0, -102, -hh + 46, -76); g.quadraticCurveTo(-hh - 12, -92, -hh + 8, -116); g.closePath(); g.fillStyle = lg(g, 0, -150, 0, -76, [0, '#3a2c14'], [1, '#22190b']); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.16)'; ell(g, -60, -116, 44, 7, -0.06); g.fill();
      ell(g, 0, -204, 25, 25); g.fillStyle = '#d6b04a'; g.fill(); g.strokeStyle = '#8e7224'; g.lineWidth = 4; g.stroke();
    }
  }
  // a man from the chest up, in the shirt every man in a parade wears
  function suspect(g, L, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.roll || 0);
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
  // the officer, from the chest up: khaki, plain, no insignia
  function officer(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.roll || 0);
    const by = 168;
    g.fillStyle = lg(g, -330, by, 330, by + 700, [0, '#d4b774'], [1, '#a5864a']);
    g.beginPath(); g.moveTo(-360, by + 1200); g.lineTo(-360, by + 430); g.bezierCurveTo(-356, by + 200, -240, by + 130, -96, by + 96); g.lineTo(96, by + 96); g.bezierCurveTo(240, by + 130, 356, by + 200, 360, by + 430); g.lineTo(360, by + 1200); g.closePath(); g.fill();
    g.fillStyle = '#b89a58'; for (const k of [-1, 1]) { g.save(); g.translate(k * 238, by + 156); g.rotate(k * 0.34); R(g, -74, -16, 148, 32, 10); g.fill(); g.fillStyle = '#8a6d32'; ell(g, k * 54, 0, 7, 7); g.fill(); g.restore(); }
    g.strokeStyle = 'rgba(80,60,20,0.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, by + 200); g.lineTo(0, by + 1200); g.stroke();
    g.fillStyle = '#7a5f2a'; for (let i = 0; i < 5; i++) { ell(g, 0, by + 250 + i * 92, 8, 8); g.fill(); }
    g.fillStyle = '#c2a35e'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 92, by + 80); g.lineTo(k * 10, by + 196); g.lineTo(k * 64, by + 206); g.lineTo(k * 150, by + 108); g.closePath(); g.fill(); }
    for (const k of [-1, 1]) { g.fillStyle = '#c0a05c'; R(g, k * 170 - 66, by + 262, 132, 130, 10); g.fill(); g.strokeStyle = 'rgba(80,60,20,0.3)'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(k * 170 - 66, by + 292); g.lineTo(k * 170 + 66, by + 292); g.stroke(); }
    const nw = 74;
    g.fillStyle = lg(g, -80, 0, 80, 0, [0, OFF.skinD], [0.55, OFF.skin], [1, OFF.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 8, by + 110); g.quadraticCurveTo(0, by + 200, nw + 8, by + 110); g.lineTo(nw, 120); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,35,20,0.28)'; g.beginPath(); g.moveTo(-nw, 150); g.quadraticCurveTo(0, 235, nw, 150); g.lineTo(nw, 120); g.lineTo(-nw, 120); g.closePath(); g.fill();
    head(g, OFF, o);
    g.restore();
  }
  // the thief on his feet: a navy shirt. thiefBack: walking away from you. thiefBody: turned round and coming at you.
  const SH1 = '#33508f', SH2 = '#223966', SH3 = '#1c2f55';
  function thiefLegs(g, by, sw, run) {
    const leg = (k) => { const a = sw * k * (0.5 + 0.5 * run); g.save(); g.translate(k * 92, by + 560); g.rotate(a * 0.55); g.fillStyle = '#20262f'; R(g, -58, -30, 116, 660, 40); g.fill(); g.fillStyle = '#121212'; R(g, -68, 610, 150, 56, 20); g.fill(); g.restore(); };
    leg(-1); leg(1);
  }
  function redBag(g) { g.strokeStyle = '#4a2d14'; g.lineWidth = 16; g.beginPath(); g.moveTo(-34, 372); g.quadraticCurveTo(0, 470, 34, 372); g.stroke(); g.fillStyle = lg(g, -90, 440, 90, 620, [0, '#94622f'], [1, '#5c3a18']); R(g, -96, 450, 192, 150, 22); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; R(g, -70, 472, 140, 12, 6); g.fill(); }
  function thiefBack(g, x, y, s, phase, o = {}) {
    const L = THIEF, by = 168, sw = Math.sin(phase), hw = 186 * L.jaw;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(30,20,12,0.26)'; ell(g, 0, 1395, 300, 34); g.fill();
    thiefLegs(g, by, sw, 0);
    const arm = (k) => { const a = -sw * k * 0.4; g.save(); g.translate(k * 296, by + 170); g.rotate(k * 0.16 + a * 0.5); g.fillStyle = SH2; R(g, -56, -30, 112, 370, 50); g.fill(); g.fillStyle = L.skin; ell(g, 0, 372, 52, 52); g.fill(); if (o.bag && k === -1) redBag(g); g.restore(); };
    arm(-1); arm(1);
    g.fillStyle = lg(g, -300, by, 300, by + 560, [0, SH1], [1, SH2]);
    g.beginPath(); g.moveTo(-262, by + 640); g.lineTo(-292, by + 250); g.bezierCurveTo(-300, by + 170, -210, by + 124, -96, by + 92); g.lineTo(96, by + 92); g.bezierCurveTo(210, by + 124, 300, by + 170, 292, by + 250); g.lineTo(262, by + 640); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-250, by + 220); g.quadraticCurveTo(0, by + 270, 250, by + 220); g.stroke();
    g.fillStyle = SH3; R(g, -112, by + 70, 224, 50, 16); g.fill();
    g.fillStyle = L.skinD; R(g, -70, 110, 140, by + 10 - 110 + 40, 24); g.fill();
    for (const k of [-1, 1]) { ell(g, k * (hw + 1), -18, 25, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); }
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 6, -30); g.bezierCurveTo(-hw - 14, -240, -90, -296, 0, -296); g.bezierCurveTo(90, -296, hw + 14, -240, hw + 6, -30); g.bezierCurveTo(hw - 4, 80, 90, 150, 0, 156); g.bezierCurveTo(-90, 150, -hw + 4, 80, -hw - 6, -30); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-90, -220); g.quadraticCurveTo(0, -270, 90, -220); g.stroke();
    g.restore();
  }
  function thiefBody(g, x, y, s, phase, o = {}) {
    const L = THIEF, by = 168, sw = Math.sin(phase), run = o.run ?? 0;
    g.save(); g.translate(x, y); g.scale(s, s);
    thiefLegs(g, by, sw, run);
    const arm = (k) => { const a = -sw * k * (0.4 + 0.9 * run); g.save(); g.translate(k * 296, by + 170); g.rotate(k * 0.16 + a * 0.5); g.fillStyle = SH2; R(g, -56, -30, 112, 370, 50); g.fill(); g.fillStyle = L.skin; ell(g, 0, 372, 52, 52); g.fill(); if (o.bag && k === -1) redBag(g); g.restore(); };
    arm(-1); arm(1);
    g.fillStyle = lg(g, -300, by, 300, by + 560, [0, SH1], [1, SH2]);
    g.beginPath(); g.moveTo(-262, by + 640); g.lineTo(-292, by + 250); g.bezierCurveTo(-300, by + 170, -210, by + 124, -96, by + 92); g.lineTo(96, by + 92); g.bezierCurveTo(210, by + 124, 300, by + 170, 292, by + 250); g.lineTo(262, by + 640); g.closePath(); g.fill();
    g.fillStyle = SH3; g.beginPath(); g.moveTo(-98, by + 88); g.lineTo(-20, by + 200); g.lineTo(-64, by + 214); g.lineTo(-134, by + 110); g.closePath(); g.moveTo(98, by + 88); g.lineTo(20, by + 200); g.lineTo(64, by + 214); g.lineTo(134, by + 110); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)'; for (let i = 0; i < 5; i++) { ell(g, 0, by + 260 + i * 80, 7, 7); g.fill(); }
    const nw = 70;
    g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 6, by + 110); g.quadraticCurveTo(0, by + 190, nw + 6, by + 110); g.lineTo(nw, 120); g.closePath(); g.fill();
    g.translate(0, 8 * Math.abs(sw)); g.rotate(o.tilt || 0);
    head(g, L, { op: o.op ?? 0, look: o.look, frown: o.frown ?? 0.3 });
    g.restore();
  }
  let ST = null;
  function makeStreet() {
    const bg = offscreen(W, H); let g = bg.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, 980, [0, '#ee8f58'], [0.5, '#f7c384'], [1, '#fde4bb']); g.fillRect(0, 0, W, H);
    // the far skyline, then the buildings across the road
    const r = mulberry32(44), cols = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#58a56a'];
    g.fillStyle = 'rgba(150,104,120,0.5)'; for (let x = -20, i = 0; x < W + 20; i++) { const w = 120 + r() * 120, hh = 300 + r() * 300; g.fillRect(x, 700 - hh, w, hh); x += w; }
    let x = -30, bi = 0;
    while (x < W + 40) {
      const w = 170 + r() * 120, hh = 420 + r() * 260, y0 = 920 - hh, c = cols[bi % cols.length]; bi++;
      g.fillStyle = c; g.fillRect(x, y0, w, hh + 40);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + w - 12, y0, 12, hh + 40);
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x, y0, w, 12);
      // a black water tank on the roof, as on every roof
      if (bi % 2) { g.fillStyle = '#23252a'; R(g, x + w * 0.56, y0 - 58, 62, 58, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + w * 0.56 + 8, y0 - 54, 7, 50); }
      for (let fy = y0 + 46; fy < 690; fy += 130) for (let fx = x + 26; fx < x + w - 60; fx += 86) {
        g.fillStyle = 'rgba(40,50,60,0.72)'; R(g, fx, fy, 54, 76, 4); g.fill();
        g.fillStyle = 'rgba(255,214,140,' + (r() > 0.45 ? 0.85 : 0.0) + ')'; R(g, fx + 3, fy + 3, 48, 70, 3); g.fill();
        g.strokeStyle = 'rgba(30,30,30,0.5)'; g.lineWidth = 3; g.beginPath(); for (let bb = 1; bb < 3; bb++) { g.moveTo(fx + bb * 18, fy); g.lineTo(fx + bb * 18, fy + 76); } g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(fx - 6, fy + 78, 66, 7);
      }
      x += w;
    }
    // shop signs and shutters at street level (all invented)
    for (const [sx, tx, bgc, fg] of [[484, 'TAILORS', '#fff3cf', '#7a1f1f'], [692, 'SWEETS', '#b5341f', '#fff6d6'], [900, 'CHEMIST', '#0f7a4a', '#ffffff']]) {
      g.fillStyle = bgc; R(g, sx, 730, 198, 64, 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.stroke();
      txt(g, tx, sx + 99, 778, 44, fg, { align: 'center', fit: 176 });
      g.fillStyle = '#7d8086'; g.fillRect(sx + 6, 794, 186, 126); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); for (let yy = 800; yy < 920; yy += 9) { g.moveTo(sx + 6, yy); g.lineTo(sx + 192, yy); } g.stroke();
    }
    // wires
    g.strokeStyle = 'rgba(30,25,20,0.7)'; g.lineWidth = 3;
    for (const [a, b, c2] of [[300, 240, 330], [340, 290, 390], [260, 180, 300]]) { g.beginPath(); g.moveTo(-20, a); g.quadraticCurveTo(W / 2, c2 + 90, W + 20, b); g.stroke(); }
    // the road and the kerb
    g.fillStyle = lg(g, 0, 920, 0, 1360, [0, '#6f6a66'], [1, '#4a4644']); g.fillRect(0, 920, W, 500);
    g.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = -1; i < 7; i++) g.fillRect(i * 200 + 40, 1040, 110, 8);
    for (let i = 0; i < 28; i++) { g.fillStyle = i % 2 ? '#f0d24a' : '#1c1c1c'; g.fillRect(i * 40, 1210, 40, 24); }
    g.fillStyle = lg(g, 0, 1234, 0, 1500, [0, '#b9ab97'], [1, '#8d8170']); g.fillRect(0, 1234, W, 700);
    g.strokeStyle = 'rgba(60,50,40,0.22)'; g.lineWidth = 3; g.beginPath(); for (const yy of [1282, 1352, 1450, 1580]) { g.moveTo(0, yy); g.lineTo(W, yy); } for (let i = -6; i <= 6; i++) { g.moveTo(540 + i * 150, 1234); g.lineTo(540 + i * 430, 1640); } g.stroke();
    // the stall on the left: tarp, counter, kettle, jars, hanging packets, a string of bulbs
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
    // a warm pool from the stall, a vignette
    g.fillStyle = rg(g, 220, 960, 40, 620, [0, 'rgba(255,190,110,0.2)'], [1, 'rgba(255,190,110,0)']); g.fillRect(0, 300, 900, 1300);
    g.fillStyle = rg(g, 540, 900, 620, 1240, [0, 'rgba(30,14,8,0)'], [1, 'rgba(30,14,8,0.34)']); g.fillRect(0, 0, W, H);
    // the near table, soft (it's close to the lens), with a plate of biscuits
    const fg = offscreen(W, H), f0 = offscreen(W, H); g = f0.getContext('2d');
    g.fillStyle = lg(g, 0, 1610, 0, 1920, [0, '#7a5230'], [1, '#3d2613']); g.beginPath(); g.moveTo(-20, 1650); g.lineTo(1100, 1606); g.lineTo(1100, 1940); g.lineTo(-20, 1940); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,240,210,0.26)'; g.beginPath(); g.moveTo(-20, 1650); g.lineTo(1100, 1606); g.lineTo(1100, 1613); g.lineTo(-20, 1657); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.14)'; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(-20, 1650 + i * 62); g.lineTo(1100, 1606 + i * 62); g.lineTo(1100, 1609 + i * 62); g.lineTo(-20, 1653 + i * 62); g.closePath(); g.fill(); }
    ell(g, 210, 1740, 170, 50); g.fillStyle = '#e9e6dc'; g.fill(); ell(g, 210, 1734, 136, 36); g.fillStyle = '#d5d1c4'; g.fill();
    for (const [bx, by] of [[150, 1718], [212, 1712], [272, 1722], [186, 1704]]) { R(g, bx - 42, by - 9, 84, 22, 8); g.fillStyle = '#d29a4f'; g.fill(); g.fillStyle = 'rgba(90,50,10,0.5)'; for (let k = 0; k < 5; k++) { ell(g, bx - 28 + k * 14, by + 2, 2.2, 2.2); g.fill(); } }
    const fctx = fg.getContext('2d'); fctx.filter = 'blur(3px)'; fctx.drawImage(f0, 0, 0); fctx.filter = 'none';
    ST = { bg, fg };
  }
  // the cutting chai glass, ribbed. Its centre is the origin.
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
  // your own right hand, as you see it: the arm from the lower right, the palm beside the glass, the fingers round the far side, the thumb in front
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
  // the glass in pieces on your table, and the chai running out
  const SHARDS = (() => { const r = mulberry32(9); return Array.from({ length: 24 }, () => ({ a: -0.25 - r() * 2.64, v: 300 + r() * 900, w: 16 + r() * 46, h: 18 + r() * 46, rs: (r() - 0.5) * 16, rest: 8 + r() * 110 })); })();
  function shards(g, d, x, y) {
    if (d < 0) return;
    const p = sstep(0, 0.5, d);
    g.fillStyle = 'rgba(140,76,26,0.95)'; ell(g, x + 20, y + 38, 240 * p, 44 * p, -0.03); g.fill();
    g.fillStyle = 'rgba(255,220,170,0.28)'; ell(g, x - 10, y + 28, 110 * p, 12 * p, -0.03); g.fill();
    // the base of the glass stays where it hit, its rim broken
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
  // an auto-rickshaw crossing behind everything
  function auto(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#1b1b1d'; ell(g, -110, 96, 42, 42); g.fill(); ell(g, 130, 96, 42, 42); g.fill();
    g.fillStyle = '#2f9a4a'; g.beginPath(); g.moveTo(-190, 80); g.lineTo(-190, -10); g.quadraticCurveTo(-170, -120, -40, -130); g.lineTo(130, -130); g.quadraticCurveTo(190, -130, 200, -60); g.lineTo(210, 80); g.closePath(); g.fill();
    g.fillStyle = '#f2c12e'; g.beginPath(); g.moveTo(-160, -60); g.quadraticCurveTo(-140, -130, -40, -136); g.lineTo(130, -136); g.quadraticCurveTo(186, -130, 194, -60); g.closePath(); g.fill();
    g.fillStyle = 'rgba(40,50,60,0.75)'; R(g, -120, -56, 130, 70, 8); g.fill(); R(g, 40, -56, 120, 70, 8); g.fill();
    g.restore();
  }
  // the woman at the counter, seen from behind: a braid, a yellow kurta, a red bag on her shoulder (until it isn't)
  function woman(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.roll || 0);
    g.fillStyle = 'rgba(30,20,12,0.26)'; ell(g, 0, 756, 150, 22); g.fill();
    g.fillStyle = '#d8d2c8'; R(g, -70, 420, 62, 330, 26); g.fill(); R(g, 8, 420, 62, 330, 26); g.fill();
    g.fillStyle = '#3a2b22'; R(g, -80, 730, 78, 28, 12); g.fill(); R(g, 4, 730, 78, 28, 12); g.fill();
    // her arms: the left on the counter, the right lifts after her bag
    const arm = (k, a) => { g.save(); g.translate(k * 108, 96); g.rotate(a); g.fillStyle = lg(g, -26, 0, 26, 180, [0, '#2fa58a'], [1, '#1f7f6a']); R(g, -27, -6, 54, 186, 26); g.fill(); g.fillStyle = '#c98e68'; R(g, -21, 170, 42, 120, 20); g.fill(); ell(g, 0, 296, 24, 30); g.fill(); g.restore(); };
    arm(-1, 0.42); arm(1, lerp(-0.1, -1.9, o.reach || 0));
    g.fillStyle = lg(g, -130, 40, 130, 520, [0, '#2fa58a'], [1, '#1f7f6a']); g.beginPath(); g.moveTo(-108, 70); g.bezierCurveTo(-130, 200, -118, 380, -128, 520); g.lineTo(128, 520); g.bezierCurveTo(118, 380, 130, 200, 108, 70); g.quadraticCurveTo(0, 40, -108, 70); g.closePath(); g.fill();
    g.fillStyle = lg(g, -130, 40, 40, 400, [0, '#f0883a'], [1, '#c9651a']); g.beginPath(); g.moveTo(-108, 66); g.quadraticCurveTo(-30, 50, 40, 70); g.lineTo(-60, 380); g.lineTo(-136, 340); g.closePath(); g.fill();
    ell(g, 0, 8, 62, 74); g.fillStyle = '#17100c'; g.fill();
    g.fillStyle = '#c98e68'; R(g, -26, 56, 52, 30, 10); g.fill();
    g.fillStyle = '#17100c'; for (let i = 0; i < 7; i++) { ell(g, Math.sin(i * 0.9) * 5, 70 + i * 40, 20 - i * 1.2, 22); g.fill(); }
    if (o.bag !== false) { g.strokeStyle = '#4a2d14'; g.lineWidth = 11; g.beginPath(); g.moveTo(84, 70); g.quadraticCurveTo(118, 200, 112, 280); g.stroke(); g.fillStyle = lg(g, 40, 270, 200, 420, [0, '#94622f'], [1, '#5c3a18']); R(g, 46, 270, 142, 124, 18); g.fill(); g.fillStyle = 'rgba(255,255,255,0.22)'; R(g, 66, 290, 100, 10, 5); g.fill(); }
    g.restore();
  }
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
  let WALLC = null, TALLY = null;
  function makeCell() {
    WALLC = offscreen(W, H); const g = WALLC.getContext('2d'), r = mulberry32(23);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#34373d'], [1, '#1b1d21']); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.012 + r() * 0.03})`; const w = 3 + r() * 26; g.fillRect(r() * W, r() * H, w, 1 + r() * 4); }
    g.fillStyle = '#121316'; g.fillRect(0, 1620, W, 300);
    // a hundred and thirty marks, a month each, in fives
    TALLY = []; const cols = 6, dx = 148, dy = 148, x0 = 118, y0 = 742;
    for (let m = 0; m < 130; m++) {
      const gi = Math.floor(m / 5), k = m % 5, col = gi % cols, row = Math.floor(gi / cols), jx = (mulberry32(gi + 5)() - 0.5) * 16, jy = (mulberry32(gi + 55)() - 0.5) * 14, gx = x0 + col * dx + jx, gy = y0 + row * dy + jy;
      const a = r(), b = r(), c = r();
      if (k < 4) TALLY.push([gx + k * 20 + (a - 0.5) * 5, gy + (b - 0.5) * 6, gx + k * 20 + (c - 0.5) * 7, gy + 88 + (a - 0.5) * 8]);
      else TALLY.push([gx - 12, gy + 72 + (a - 0.5) * 8, gx + 72, gy + 14 + (b - 0.5) * 8]);
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
      titleOut: en('n01'), n02: at('n02'), n02e: en('n02'), n03: at('n03'), whoever: wi('n03', 8), n03e: en('n03'), n04: at('n04'), n04e: en('n04'),
      o01: at('o01'), o01e: en('o01'), o02: at('o02'), o02e: en('o02'), n05: at('n05'), drawing: wi('n05', 2), cant: wi('n05', 5), n05e: en('n05'),
      n06: at('n06'), n07: at('n07'), n08: at('n08'), n09: at('n09'), n09e: en('n09'), n10: at('n10'), n11: at('n11'), n11e: en('n11'), n11b: at('n11b'),
      n12: at('n12'), prison: wi('n12', 8), n12e: en('n12'), n14: at('n14'), good: wi('n14', 6), swear: wi('n14', 9), n15: at('n15'), n15b: at('n15b'), n15be: en('n15b'),
      n16: at('n16'), ronald: wi('n16', 6), n16e: en('n16'), n18: at('n18'), o03: at('o03'), o03e: en('o03'), o04: at('o04'), o04e: en('o04'), end: tb('end'),
    };
    T.walk = T.n02 - 0.3; T.grab = T.n02e + 0.02; T.run = T.grab + 0.18; T.gone = T.run + 1.05; T.bump = T.gone - 0.25; T.smash = T.bump + 0.32; T.cut1 = T.n03 - 0.06;
    T.clock0 = T.cut1 + 0.05; T.clock1 = T.clock0 + 5.0; T.read0 = T.o01e + 0.15; T.read1 = T.o02 - 0.32;
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
  // the chai seller behind his counter: the face of number 2, on purpose (reel 20's plant, again)
  function chaiwala(g, t, TT) {
    const turned = sstep(TT.n02 - 0.7, TT.n02 - 0.35, t), sx = Math.abs(Math.cos(turned * Math.PI)) * 0.85 + 0.15, L = SELLER, hw = 186 * L.jaw;
    g.save(); g.beginPath(); g.rect(0, 0, W, 998); g.clip();
    g.translate(236, 780 + 2 * Math.sin(t * 1.3)); g.scale(0.34 * sx, 0.34);
    g.fillStyle = lg(g, -300, 240, 300, 800, [0, '#f2eee2'], [1, '#d3cdbc']);
    g.beginPath(); g.moveTo(-330, 1000); g.lineTo(-330, 410); g.bezierCurveTo(-326, 300, -220, 246, -90, 205); g.lineTo(90, 205); g.bezierCurveTo(220, 246, 326, 300, 330, 410); g.lineTo(330, 1000); g.closePath(); g.fill();
    g.fillStyle = '#d9582a'; g.beginPath(); g.moveTo(-250, 262); g.lineTo(-140, 222); g.lineTo(-96, 660); g.lineTo(-224, 660); g.closePath(); g.fill();
    if (turned < 0.5) head(g, L, { look: [16 * Math.sin(t * 0.8), 6], close: ((t + 1.4) % 3.1) < 0.12 ? 1 : 0 });
    else {
      g.fillStyle = L.skinD; R(g, -70, 110, 140, 150, 24); g.fill();
      for (const k of [-1, 1]) { ell(g, k * (hw + 1), -18, 25, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); }
      g.save(); g.globalAlpha *= 0.86; g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hw - 2, -30); g.bezierCurveTo(-hw - 8, -240, -90, -280, 0, -280); g.bezierCurveTo(90, -280, hw + 8, -240, hw + 2, -30); g.bezierCurveTo(hw - 4, 90, 90, 150, 0, 156); g.bezierCurveTo(-90, 150, -hw + 4, 90, -hw - 2, -30); g.closePath(); g.fill(); g.restore();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ 1 · the crime: everything up to the cut
  function crime(g, t) {
    const TT = times();
    if (!ST) makeStreet();
    const shake = shakeAt(t, [TT.grab, TT.bump, TT.smash], 16);
    g.save();
    const d = 3 * Math.sin(t * 0.9), z = 1 + 0.02 * sstep(0, TT.cut1, t);
    g.translate(540 + shake[0] + d, 960 + shake[1]); g.scale(z, z); g.translate(-540, -960);
    g.drawImage(ST.bg, 0, 0);
    const ax = lerp(-260, 1340, sstep(0.5, 3.3, t)); if (t > 0.45 && t < 3.4) auto(g, ax, 960, 0.9);
    steam(g, 348, 880, t, 0.8);
    chaiwala(g, t, TT);
    const taken = t >= TT.grab, reach = taken ? sstep(TT.grab + 0.08, TT.grab + 0.4, t) : 0, lurch = taken ? 0.13 * Math.exp(-(t - TT.grab) * 4) * Math.sin((t - TT.grab) * 16) : 0.006 * Math.sin(t * 1.1);
    woman(g, 556, 862, 0.76, { bag: !taken, reach, roll: lurch });
    if (t >= TT.walk && t < TT.gone) {
      if (t < TT.run) {
        // he walks in from the right, his back to you, reaches her, takes the bag, and turns round
        const u = clamp((t - TT.walk) / (TT.grab - TT.walk)), x = lerp(1190, 790, u), y = lerp(860, 770, u), s = lerp(0.62, 0.56, u);
        const turn = sstep(TT.grab + 0.02, TT.run, t), sx = Math.abs(Math.cos(turn * Math.PI)) * 0.85 + 0.15;
        g.save(); g.translate(x, 0); g.scale(sx, 1); g.translate(-x, 0);
        if (turn < 0.5) thiefBack(g, x, y, s, t * 9, { bag: taken }); else thiefBody(g, x, y, s, t * 9, { bag: true, look: [0, 1] });
        g.restore();
      } else {
        const u = clamp((t - TT.run) / (TT.gone - TT.run)), pass = sstep(0.8, 1, u), grow = Math.pow(sstep(0, 0.72, u), 1.6);
        const s = lerp(0.56, 2.55, grow) * (1 + 1.3 * pass), x = lerp(lerp(790, 548, sstep(0, 0.6, u)), 1900, pass * pass), y = lerp(770, 905, sstep(0, 0.7, u));
        thiefBody(g, x, y, s, t * 19, { run: 1, bag: true, op: 0.12 + 0.05 * Math.sin(t * 19), look: [0, 1] });
      }
    }
    g.drawImage(ST.fg, 0, 0);
    const hx = 790, hy = 1440 + 3 * Math.sin(t * 1.1);
    if (t < TT.bump) { chaiHand(g, hx, hy, 1.08, -0.04 + (t >= TT.grab ? 0.05 * Math.exp(-(t - TT.grab) * 3) * Math.sin((t - TT.grab) * 12) : 0), true); steam(g, hx - 6, hy - 150, t, 0.7); }
    else {
      const dd = t - TT.bump, q = sstep(0, 0.16, dd);
      if (t < TT.smash) { const f = dd / (TT.smash - TT.bump); glass(g, lerp(hx, 620, f), hy - 150 * f + 350 * f * f, 1.08, -0.04 - 3.5 * f); }
      else shards(g, t - TT.smash, 620, 1640);
      chaiHand(g, hx + 620 * q, hy + 260 * q, 1.08, -0.04 + 0.6 * q, false);
    }
    g.restore();
    const out = sstep(TT.titleOut - 0.05, TT.titleOut + 0.15, t);
    if (out < 1) {
      g.save(); g.globalAlpha = 1 - out;
      txt(g, 'YOU ARE THE', 513, 350, 100, CREAM, { align: 'center', stroke: INK, sw: 0.14 });
      txt(g, 'ONLY WITNESS', 513, 494, 150, YEL, { align: 'center', fit: 860, stroke: INK, sw: 0.14 });
      txt(g, 'AGAIN.', 513, 618, 116, '#ff5a3a', { align: 'center', stroke: CREAM, sw: 0.13 });
      g.restore();
    }
    return 0;
  }

  // ------------------------------------------------------------------ the lineup: six big faces
  const CARD = { w: 284, h: 396, x0: 60, y0: 396, gx: 19, gy: 18 };
  const cardXY = (i) => [CARD.x0 + (i % 3) * (CARD.w + CARD.gx), CARD.y0 + Math.floor(i / 3) * (CARD.h + CARD.gy)];
  const FROWN = [0.1, 0.18, 0.34, 0.28, 0.22, 0.04], SMILE = [0.1, 0, 0, 0, 0, 0.18];
  function wallLines(g, x, y, w, h) {
    g.save(); R(g, x, y, w, h, 8); g.clip();
    g.fillStyle = WALL; g.fillRect(x, y, w, h);
    for (let k = 0; k < 9; k++) { const yy = y + 14 + k * 50; g.fillStyle = k % 2 ? 'rgba(20,19,15,0.2)' : 'rgba(20,19,15,0.5)'; g.fillRect(x, yy, w, k % 2 ? 2 : 3); }
    g.restore();
  }
  function tileNo(g, x, y, n, s = 72) { R(g, x, y, s, s, 8); g.fillStyle = '#121212'; g.fill(); txt(g, String(n), x + s / 2, y + s * 0.78, s * 0.8, '#fff9ea', { kind: 'mono', align: 'center' }); }
  function tick(g, x, y, s, k) {                     // a green tick, drawn on
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    ell(g, 0, 0, 60, 60); g.fillStyle = GREEN; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 7; g.stroke();
    g.lineWidth = 15; const a = clamp(k * 2), b = clamp(k * 2 - 1);
    g.beginPath(); g.moveTo(-28, 2); g.lineTo(lerp(-28, -8, a), lerp(2, 24, a)); if (b > 0) g.lineTo(lerp(-8, 32, b), lerp(24, -24, b)); g.stroke();
    g.restore();
  }
  function cross(g, x, y, s, k) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
    ell(g, 0, 0, 60, 60); g.fillStyle = RED; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 7; g.stroke();
    g.lineWidth = 15; g.beginPath(); g.moveTo(-26, -26); g.lineTo(26, 26); g.moveTo(26, -26); g.lineTo(-26, 26); g.stroke();
    g.restore();
  }
  function card(g, i, t, o = {}) {
    const [x, y] = cardXY(i), L = MEN[i];
    g.save();
    if (o.pop) { const cx = x + CARD.w / 2, cy = y + CARD.h / 2; g.translate(cx, cy); g.scale(o.pop, o.pop); g.translate(-cx, -cy); }
    wallLines(g, x, y, CARD.w, CARD.h);
    g.save(); R(g, x, y, CARD.w, CARD.h, 8); g.clip();
    const r = mulberry32(i * 17 + 3), bl = t > 0.5 && ((t + r() * 7 + 1.1) % (3.4 + i * 0.5)) < 0.14 ? 1 : 0, glance = 5 * Math.sin(t * (0.6 + i * 0.13) + i) * (1 - (o.stare || 0));
    suspect(g, L, x + CARD.w / 2 + 1.5 * Math.sin(t * 0.6 + i), y + 190 + 1.5 * Math.sin(t * 0.5 + i * 2), 0.56, { close: bl, look: [glance, 0], frown: FROWN[i], smile: SMILE[i] });
    g.restore();
    tileNo(g, x + 12, y + CARD.h - 84, i + 1);
    R(g, x, y, CARD.w, CARD.h, 8); g.strokeStyle = '#121212'; g.lineWidth = 6; g.stroke();
    if (o.dim > 0) { R(g, x - 3, y - 3, CARD.w + 6, CARD.h + 6, 8); g.fillStyle = `rgba(217,211,195,${o.dim})`; g.fill(); }
    if (o.lit > 0) { R(g, x - 4, y - 4, CARD.w + 8, CARD.h + 8, 10); g.strokeStyle = GREEN; g.lineWidth = 10; g.stroke(); }
    if (o.tick > 0) tick(g, x + CARD.w - 70, y + 70, 0.9, o.tick);
    g.restore();
  }
  function bars(g, k) {
    if (k <= 0) return;
    const off = lerp(-H, 0, k), bw = 40, hw = bw / 2;
    g.save(); g.translate(0, off);
    for (let i = 0; i < 8; i++) {
      const x = 30 + i * 146;
      g.fillStyle = lg(g, x - hw, 0, x + hw, 0, [0, '#16181c'], [0.35, '#6f747d'], [0.55, '#9ea3ab'], [1, '#1c1e23']); g.fillRect(x - hw, -40, bw, H + 80);
    }
    for (const yy of [214, 1570]) { g.fillStyle = lg(g, 0, yy - 26, 0, yy + 26, [0, '#16181c'], [0.4, '#7c818a'], [1, '#1c1e23']); g.fillRect(-10, yy - 26, W + 20, 52); }
    g.restore();
  }
  function sureBox(g, t, t0, y) {                    // __/10, a blank nobody fills in for you
    if (t < t0) return;
    const q = pop(t, t0);
    g.save(); g.translate(513, y); g.scale(lerp(0.8, 1, q), lerp(0.8, 1, q)); g.globalAlpha *= clamp((t - t0) * 8);
    R(g, -210, -96, 190, 170, 16); g.fillStyle = '#fffdf4'; g.fill(); g.strokeStyle = INK; g.lineWidth = 9; g.stroke();
    if (((t - t0) % 0.8) < 0.45) { g.fillStyle = INK; g.fillRect(-120, -66, 9, 110); }
    txt(g, '/ 10', 6, 58, 170, INK, { stroke: '#d9d3c3', sw: 0.05 });
    g.restore();
  }
  function shotLineup(g, t) {
    const TT = times();
    const [sx, sy] = shakeAt(t, [TT.cut1], 34);
    g.fillStyle = '#d9d3c3'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(sx, sy);
    const stare = sstep(TT.clock1, TT.clock1 + 0.3, t), z = 1 + 0.04 * sstep(TT.cut1, TT.clock1, t);
    g.save(); g.translate(505, 800); g.scale(z, z); g.translate(-505, -800);
    for (let i = 0; i < 6; i++) card(g, i, t, { pop: clamp(hit(t, TT.cut1 + 0.02 + i * 0.05, 'heavy')), stare });
    g.restore();
    if (t < TT.clock1 + 0.28) {
      txt(g, "HE'S ONE OF THESE SIX", 60, 356, 92, INK, { fit: 660 });
      const left = Math.min(5, Math.max(0, Math.ceil(TT.clock1 - t - 1e-3)));
      g.save(); g.translate(838, 324); R(g, -112, -44, 224, 88, 12); g.fillStyle = '#121212'; g.fill();
      txt(g, '00:' + String(left).padStart(2, '0'), 0, 27, 68, left <= 2 ? '#ff4a30' : '#ffb347', { kind: 'mono', align: 'center' });
      g.restore();
      if (t >= TT.whoever - 0.04) { title(g, 'WHOEVER YOU PICK', 1316, 104, INK, t, TT.whoever - 0.04, { stroke: '#d9d3c3', sw: 0.02 }); title(g, 'GOES TO PRISON.', 1440, 118, RED, t, wi('n03', 11) - 0.04, { stroke: '#d9d3c3', sw: 0.02 }); }
    } else {
      title(g, 'HOW SURE ARE YOU?', 362, 112, INK, t, TT.n04 - 0.04, { stroke: '#d9d3c3', sw: 0.02, fit: 860 });
      sureBox(g, t, TT.n04 + 0.05, 1380);
    }
    g.restore();
    return flashAt(t, TT.cut1) + flashAt(t, TT.clock1) * 0.25;
  }

  // ------------------------------------------------------------------ the corridor, and the officer
  let CO = null;
  function makeCorridor() {
    CO = offscreen(W, H); const g = CO.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, 1100, [0, '#f5e8cc'], [1, '#ecdab6']); g.fillRect(0, 0, W, 1200);
    g.fillStyle = lg(g, 0, 1100, 0, H, [0, '#4a9583'], [1, '#2c6a5b']); g.fillRect(0, 1100, W, 820); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, 1100, W, 6);
    // the magistrate's door, with the rule on it: he's standing right outside it
    g.fillStyle = '#8a6a3f'; R(g, 6, 262, 306, 1250, 6); g.fill();
    g.fillStyle = lg(g, 20, 276, 300, 1500, [0, '#2f6e60'], [1, '#215045']); R(g, 20, 276, 278, 1240, 4); g.fill();
    g.fillStyle = lg(g, 40, 296, 40, 396, [0, '#eef3ef'], [1, '#d7e2dd']); R(g, 40, 296, 238, 100, 6); g.fill(); g.strokeStyle = '#17392f'; g.lineWidth = 6; R(g, 40, 296, 238, 100, 6); g.stroke();
    txt(g, 'MAGISTRATE', 159, 362, 46, '#1c4438', { align: 'center', fit: 214 });
    g.save(); g.translate(159, 508); g.rotate(-0.012);
    R(g, -122, -98, 244, 196, 8); g.fillStyle = '#fffdf2'; g.fill(); g.strokeStyle = '#b3211a'; g.lineWidth = 8; g.stroke();
    txt(g, 'POLICE', 0, -24, 76, '#b3211a', { align: 'center', fit: 216 });
    txt(g, 'WAIT', 0, 34, 54, '#b3211a', { align: 'center', fit: 216 });
    txt(g, 'OUTSIDE', 0, 84, 54, '#b3211a', { align: 'center', fit: 216 });
    g.restore();
    g.fillStyle = '#d9b98c'; g.fillRect(800, 420, 240, 620); g.fillStyle = lg(g, 816, 436, 816, 1024, [0, '#fbd28a'], [1, '#fde9c0']); g.fillRect(816, 436, 208, 588);
    g.strokeStyle = '#2f6b5e'; g.lineWidth = 10; g.strokeRect(816, 436, 208, 588); g.beginPath(); g.moveTo(920, 436); g.lineTo(920, 1024); for (let k = 1; k < 3; k++) { g.moveTo(816, 436 + k * 196); g.lineTo(1024, 436 + k * 196); } g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, 262, W, 12);
  }
  function fan(g, x, y, t, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#5a3f2a'; g.fillRect(-4, -200, 8, 196);
    g.save(); g.scale(1, 0.28); g.rotate(t * 3.1);
    for (let i = 0; i < 3; i++) { g.rotate(TAU / 3); g.fillStyle = '#6b4a30'; R(g, 14, -18, 190, 36, 16); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; R(g, 20, -16, 170, 8, 4); g.fill(); }
    g.restore();
    g.fillStyle = '#7d5a3c'; ell(g, 0, 0, 34, 16); g.fill(); g.fillStyle = '#4a3220'; ell(g, 0, 8, 22, 10); g.fill();
    g.restore();
  }
  // his clipboard, from behind: you can't see what's on it
  function clipBack(g, x, y, w, h, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,0.25)'; R(g, -w / 2 + 8, -h / 2 + 12, w, h, 16); g.fill();
    g.fillStyle = lg(g, -w / 2, -h / 2, w / 2, h / 2, [0, '#9a6a3e'], [1, '#6e4423']); R(g, -w / 2, -h / 2, w, h, 16); g.fill();
    g.strokeStyle = 'rgba(40,20,8,0.35)'; g.lineWidth = 3; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(-w / 2 + 12, -h / 2 + k * h / 6 + 8 * Math.sin(k * 2)); g.quadraticCurveTo(0, -h / 2 + k * h / 6 - 10, w / 2 - 12, -h / 2 + k * h / 6 + 6 * Math.cos(k * 3)); g.stroke(); }
    g.fillStyle = '#b9bdc4'; R(g, -70, -h / 2 - 22, 140, 40, 10); g.fill();
    g.restore();
  }
  function officerHands(g, x0, x1, y) {             // his hands, gripping the lower corners of whatever he's holding
    for (const [hx, k] of [[x0, 1], [x1, -1]]) {
      g.strokeStyle = '#a98a4e'; g.lineWidth = 122; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + 150 * (k > 0 ? -1 : 1), H + 200); g.lineTo(hx + 8 * k, y + 60); g.stroke();
      g.fillStyle = OFF.skin; ell(g, hx, y, 62, 52, 0.2 * k); g.fill();
      g.strokeStyle = OFF.skinD; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const fy = y - 30 + i * 20; g.beginPath(); g.moveTo(hx - 34 * k, fy); g.quadraticCurveTo(hx + 22 * k, fy - 6, hx + 44 * k, fy + 6); g.stroke(); }
    }
  }
  const OX = 572, OY = 940, OS = 1.2;
  function officerAt(g, t, st) {
    officer(g, OX, OY + 2 * Math.sin(t * 1.2), OS, { look: st.look, close: st.close ?? 0, op: st.op ?? 0, smile: st.smile ?? 0.12, grin: st.grin ?? 0, browY: st.browY ?? 0, worry: st.worry ?? 0 });
  }
  function shotOfficer(g, t) {
    const TT = times();
    if (!CO) makeCorridor();
    g.drawImage(CO, 0, 0);
    fan(g, 700, 300, t + 1, 0.6);
    const cb = sstep(TT.read0, TT.read0 + 0.28, t), read = win(t, TT.read0 + 0.14, TT.read1, 0.1), up = sstep(TT.read1, TT.read1 + 0.22, t);
    const grin = sstep(TT.o02e - 0.06, TT.o02e + 0.22, t), op = talkP(t, 'o01') + talkP(t, 'o02');
    officerAt(g, t, { look: [0, lerp(1, 15, read)], close: read > 0.5 ? 0.42 : blinkAt(t, 3.1, 0.7), op: grin > 0.02 ? 0 : op, smile: lerp(0.15, 0.95, up), grin, browY: lerp(lerp(0, 6, read), -12, up), worry: 2 * read });
    const y = lerp(1720, 1500, cb);
    clipBack(g, OX, y, 560, 400, -0.02);
    officerHands(g, OX - 280, OX + 280, y + 130);
    const warm = sstep(TT.o02 - 0.05, TT.o02 + 0.4, t);
    if (warm > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg(g, 900, 560, 60, 1250, [0, `rgba(255,190,90,${0.3 * warm})`], [1, 'rgba(255,190,90,0)']); g.fillRect(0, 0, W, H); g.restore(); }
    if (t < TT.o02 - 0.3) bubble(g, 'WHICH ONE?', 640, 380, t, TT.o01 - 0.05, { tx: 620, w: 500, a: 1 - clamp((t - TT.o01e - 0.5) * 6) });
    if (t >= TT.o02 - 0.04) title(g, 'GOOD.', 440, 196, YEL, t, TT.o02 - 0.04, { x: 610, fit: 620 });
    return flashAt(t, TT.o01 - 0.05) * 0.5;
  }

  // ------------------------------------------------------------------ he's a drawing: the colour goes, pencil on paper; an eraser takes his eyes
  const PAPERC = '#f4eee1';
  function sketchOfficer(g, x, y, s, o = {}) {
    const L = OFF, hw = 186 * L.jaw, ey = -28, ex = 80, by = 168, hh = hw + 6;
    g.save(); g.translate(x, y); g.scale(s, s);
    for (const [dx, dy, a, lw] of [[0, 0, 1, 6.5], [2.6, -1.8, 0.42, 3.5], [-2, 2.4, 0.34, 3]]) {
      g.save(); g.translate(dx, dy); g.globalAlpha = a; g.strokeStyle = '#47474d'; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-360, by + 1200); g.lineTo(-360, by + 430); g.bezierCurveTo(-356, by + 200, -240, by + 130, -96, by + 96); g.moveTo(96, by + 96); g.bezierCurveTo(240, by + 130, 356, by + 200, 360, by + 430); g.lineTo(360, by + 1200); g.stroke();
      g.beginPath(); g.moveTo(0, by + 200); g.lineTo(0, by + 1200); for (const k of [-1, 1]) { g.moveTo(k * 92, by + 80); g.lineTo(k * 10, by + 196); g.lineTo(k * 64, by + 206); g.lineTo(k * 150, by + 108); g.moveTo(k * 170 - 66, by + 262); g.lineTo(k * 170 + 66, by + 262); g.lineTo(k * 170 + 66, by + 392); g.lineTo(k * 170 - 66, by + 392); g.closePath(); } g.stroke();
      g.beginPath(); g.moveTo(-74, 130); g.lineTo(-82, by + 110); g.moveTo(74, 130); g.lineTo(82, by + 110); g.stroke();
      for (const k of [-1, 1]) { ell(g, k * (hw + 1), -18, 25, 42, k * 0.08); g.stroke(); }
      g.beginPath(); g.moveTo(-hw, -110); g.bezierCurveTo(-hw - 6, 40, -hw + 4, 58, -hw, -40); g.moveTo(-hw, -40); g.bezierCurveTo(-hw - 4, 58, -152, 150, -88, 205); g.bezierCurveTo(-60, 228, -28, 232, 0, 232); g.bezierCurveTo(28, 232, 60, 228, 88, 205); g.bezierCurveTo(152, 150, hw + 4, 58, hw, -40); g.lineTo(hw, -110); g.stroke();
      // the cap
      g.beginPath(); g.moveTo(-hh - 2, -142); g.bezierCurveTo(-hh - 64, -226, -hh - 40, -306, -128, -324); g.bezierCurveTo(-44, -346, 44, -346, 128, -324); g.bezierCurveTo(hh + 40, -306, hh + 64, -226, hh + 2, -142); g.stroke();
      g.beginPath(); g.moveTo(-hh - 2, -148); g.quadraticCurveTo(0, -186, hh + 2, -148); g.moveTo(-hh - 2, -112); g.quadraticCurveTo(0, -150, hh + 2, -112); g.moveTo(-hh + 8, -116); g.quadraticCurveTo(hh * 0 - hh - 12, -92, -hh + 46, -76); g.quadraticCurveTo(0, -102, hh - 46, -76); g.quadraticCurveTo(hh + 12, -92, hh - 8, -116); g.stroke();
      ell(g, 0, -204, 25, 25); g.stroke();
      // eyes
      if (!o.gone) for (const k of [-1, 1]) {
        const cx = k * ex, w = L.ew, up = L.eh * 1.75, dn = L.eh * 1.05;
        g.beginPath(); g.moveTo(cx - w, ey + 3); g.quadraticCurveTo(cx - k * 6, ey - up, cx + w, ey + 3); g.quadraticCurveTo(cx + k * 6, ey + dn, cx - w, ey + 3); g.stroke();
        ell(g, cx, ey - 3, 18, 18); g.stroke();
      }
      g.lineWidth = lw * 2.2; browLine(g, -1, ex, ey, L.browTilt, -12, false); browLine(g, 1, ex, ey, L.browTilt, -12, false); g.lineWidth = lw;
      // nose, moustache, smile
      g.beginPath(); for (const k of [-1, 1]) { g.moveTo(k * 22, 26); g.quadraticCurveTo(k * 31, 44, k * 25, 54); } g.moveTo(-34, 59); g.quadraticCurveTo(0, 74, 34, 59); g.stroke();
      const my = 118, w = 62, th = 24, gw = 92, u = 54;
      g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 6); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 6); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.stroke();
      if (o.op > 0.03) { ell(g, 0, my + 18 + 40 * o.op, 56 - 14 * o.op, 8 + 66 * o.op); g.stroke(); }
      else { g.beginPath(); g.moveTo(-gw, my - 16); g.quadraticCurveTo(0, my + u * 1.7, gw, my - 16); g.quadraticCurveTo(0, my + 2, -gw, my - 16); g.closePath(); g.stroke(); }
      g.restore();
    }
    // hatching on the cap and the moustache, and the pupils
    g.strokeStyle = 'rgba(70,70,76,0.5)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < 26; i++) { const x0 = -210 + i * 17; g.moveTo(x0, -152 - Math.abs(x0) * 0.04); g.lineTo(x0 + 24, -112 - Math.abs(x0) * 0.04); }
    for (let i = 0; i < 12; i++) { const x0 = -54 + i * 10; g.moveTo(x0, 78 + Math.abs(x0) * 0.2); g.lineTo(x0 + 8, 96 + Math.abs(x0) * 0.14); }
    g.stroke();
    if (!o.gone) { g.fillStyle = '#2c2c30'; for (const k of [-1, 1]) { ell(g, k * ex, ey - 3, 9, 9); g.fill(); } }
    else { g.strokeStyle = 'rgba(150,140,125,0.35)'; g.lineWidth = 14; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); for (let i = 0; i < 6; i++) { const px = k * ex + (i % 2 ? 1 : -1) * 60, py = ey - 34 + i * 12; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); } }
    g.restore();
  }
  const zigzag = (cx, cy) => Array.from({ length: 11 }, (_, i) => [cx + (i % 2 ? 1 : -1) * 92, cy - 62 + i * 12.4]);
  function rub(g, pts, u) {
    if (u <= 0) return null;
    const n = u * (pts.length - 1), m = Math.floor(n), f = n - m, end = m < pts.length - 1 ? [lerp(pts[m][0], pts[m + 1][0], f), lerp(pts[m][1], pts[m + 1][1], f)] : pts[pts.length - 1];
    g.strokeStyle = PAPERC; g.lineWidth = 62; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= m; i++) g.lineTo(pts[i][0], pts[i][1]); g.lineTo(end[0], end[1]); g.stroke();
    return end;
  }
  function eraser(g, x, y, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,0.2)'; R(g, -86, -38, 200, 96, 18); g.fill();
    R(g, -100, -48, 200, 96, 18); g.fillStyle = '#f4a5b0'; g.fill();
    g.fillStyle = '#2d5fa8'; R(g, -40, -48, 140, 96, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(-26, -48, 14, 96); g.fillRect(4, -48, 14, 96);
    g.restore();
  }
  function shotDrawing(g, t) {
    const TT = times();
    if (!CO) makeCorridor();
    const k = sstep(TT.drawing - 0.14, TT.drawing + 0.42, t), s = lerp(-60, W + 0.35 * H + 60, k);
    // the coloured frame, frozen in the smile
    g.drawImage(CO, 0, 0);
    officerAt(g, 0, { look: [0, 1], smile: 0.95, grin: 1, browY: -12 });
    const yb = 1500; clipBack(g, OX, yb, 560, 400, -0.02); officerHands(g, OX - 280, OX + 280, yb + 130);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg(g, 900, 560, 60, 1250, [0, 'rgba(255,190,90,0.3)'], [1, 'rgba(255,190,90,0)']); g.fillRect(0, 0, W, H); g.restore();
    // the paper, sweeping across
    g.save(); g.beginPath(); g.moveTo(-10, -10); g.lineTo(s + 3.5, -10); g.lineTo(s - 0.35 * (H + 10), H + 10); g.lineTo(-10, H + 10); g.closePath(); g.clip();
    g.fillStyle = PAPERC; g.fillRect(0, 0, W, H);
    const r = mulberry32(11); g.fillStyle = 'rgba(120,100,70,0.06)'; for (let i = 0; i < 500; i++) g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3);
    sketchOfficer(g, OX, OY, OS);
    g.strokeStyle = '#47474d'; g.lineWidth = 6; R(g, OX - 280, yb - 200, 560, 400, 16); g.stroke();
    // the eraser: his eyes go, one and then the other
    const yE = OY - 28 * OS, eyeL = OX - 80 * OS, eyeR = OX + 80 * OS, a = TT.cant - 0.1, b = (TT.cant + TT.n05e) / 2 + 0.05, c = TT.n05e + 0.12;
    const u1 = sstep(a, b, t), u2 = sstep(b, c, t), p1 = zigzag(eyeL, yE), p2 = zigzag(eyeR, yE);
    const e1 = rub(g, p1, u1), e2 = rub(g, p2, u2);
    g.restore();
    const away = sstep(c, c + 0.3, t), inn = sstep(a - 0.3, a, t), [ex, ey] = u2 > 0 ? e2 : (e1 || [lerp(p1[0][0] - 420, p1[0][0], inn), lerp(p1[0][1] - 420, p1[0][1], inn)]);
    if (t >= a - 0.3 && t < TT.n06) eraser(g, ex + 40 + away * 900, ey - 26, -0.5);
    if (t >= TT.drawing - 0.05) title(g, "HE'S A DRAWING.", 400, 124, INK, t, TT.drawing - 0.05, { stroke: PAPERC, sw: 0.06 });
    return 0;
  }

  // ------------------------------------------------------------------ the real answer. It's number three.
  function shotReveal(g, t) {
    const TT = times();
    g.fillStyle = '#d9d3c3'; g.fillRect(0, 0, W, H);
    const lit = sstep(TT.n07 - 0.04, TT.n07 + 0.08, t), q = lit > 0 ? clamp(hit(t, TT.n07 - 0.04, 'heavy')) : 0;
    for (let i = 0; i < 6; i++) { if (i !== 2) card(g, i, t, { stare: 1, dim: lit * 0.72 }); }
    card(g, 2, t, { stare: 1, pop: 1 + 0.08 * q, lit, tick: sstep(TT.n07 + 0.02, TT.n07 + 0.3, t) });
    title(g, "HERE'S THE ANSWER", 356, 108, INK, t, TT.n06 - 0.04, { stroke: '#d9d3c3', sw: 0.02, a: 1 });
    if (t >= TT.n07 - 0.04) title(g, "IT'S NUMBER 3.", 1400, 166, GREEN, t, TT.n07 - 0.04, { stroke: CREAM, sw: 0.1 });
    return flashAt(t, TT.n06 - 0.05) * 0.5;
  }
  function shotThree(g, t) {
    const TT = times(), liar = t >= TT.n10 - 0.04;
    g.fillStyle = WALL; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 14; k++) { const yy = 120 + k * 118; g.fillStyle = k % 2 ? 'rgba(20,19,15,0.16)' : 'rgba(20,19,15,0.42)'; g.fillRect(0, yy, W, k % 2 ? 3 : 5); }
    const z = 1 + 0.07 * sstep(TT.n08, TT.n10, t) + (liar ? 0.02 : 0) + 0.05 * sstep(TT.n11b, TT.n12, t), [sx, sy] = shakeAt(t, [TT.n10], 22);
    g.save(); g.translate(513 + sx, 900 + sy); g.scale(z, z); g.translate(-513, -900);
    const puzzled = sstep(TT.n10, TT.n10 + 0.35, t), look = liar ? [lerp(0, 18 * Math.sin((t - TT.n10) * 3.2), puzzled), 1] : [0, 1];
    suspect(g, THIEF, 513, 900, 1.34, { look, close: blinkAt(t, 2.7, 0.2), frown: lerp(0.34, 0.1, puzzled), smile: liar ? 0 : 0.34, worry: -10 * puzzled, browY: -8 * puzzled });
    g.restore();
    tileNo(g, 90, 1200, 3, 110);
    const warm = (1 - sstep(TT.n10 - 0.06, TT.n10 - 0.01, t)) * sstep(TT.n08 - 0.1, TT.n08 + 0.3, t);
    if (warm > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg(g, 513, 900, 100, 1000, [0, `rgba(255,190,90,${0.2 * warm})`], [1, 'rgba(255,190,90,0)']); g.fillRect(0, 0, W, H); g.restore(); }
    if (!liar) tick(g, 860, 1250, 1.3, 1); else cross(g, 860, 1250, 1.3, clamp(hit(t, TT.n10 - 0.02, 'heavy')));
    if (t >= TT.n09 - 0.04 && !liar) {
      title(g, 'NOW HOW SURE?', 400, 140, INK, t, TT.n09 - 0.04, { stroke: WALL, sw: 0.1 });
      sureBox(g, t, wi('n09', 2), 1410);
    }
    if (liar) {
      title(g, "IT ISN'T NUMBER 3.", 400, 118, RED, t, TT.n10 - 0.03, { stroke: CREAM, sw: 0.1 });
      if (t >= TT.n11 - 0.04 && t < TT.n11b - 0.04) title(g, 'I MADE THAT UP.', 1420, 132, INK, t, TT.n11 - 0.04, { stroke: CREAM, sw: 0.14 });
      if (t >= TT.n11b - 0.04) title(g, 'BUT HE LOOKED RIGHT.', 1420, 112, INK, t, TT.n11b - 0.04, { stroke: CREAM, sw: 0.14, fit: 860 });
    }
    return flashAt(t, TT.n08 - 0.06) * 0.3 + flashAt(t, TT.n10 - 0.03) * 0.5;
  }
  // whoever you picked is still going to prison: one cell, and the man in it keeps changing, so nothing picks for you
  function shotBars(g, t) {
    const TT = times();
    g.fillStyle = WALL; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 14; k++) { const yy = 120 + k * 118; g.fillStyle = k % 2 ? 'rgba(20,19,15,0.16)' : 'rgba(20,19,15,0.42)'; g.fillRect(0, yy, W, k % 2 ? 3 : 5); }
    const [sx, sy] = shakeAt(t, [TT.prison], 30), b = t >= TT.prison - 0.03 ? clamp(hit(t, TT.prison - 0.03, 'heavy')) : 0;
    const n = Math.floor((t - TT.n12 + 0.05) * 6), i = ((n % 6) + 6) % 6;
    g.save(); g.translate(sx, sy);
    suspect(g, MEN[i], 513, 860, 1.25, { look: [0, 1], frown: FROWN[i] + 0.15, close: 0, worry: -6 });
    tileNo(g, 90, 1180, i + 1, 110);
    if (b > 0) { g.fillStyle = `rgba(10,10,12,${0.26 * b})`; g.fillRect(-60, -60, W + 120, H + 120); bars(g, b); }
    g.restore();
    title(g, 'WHOEVER YOU PICKED', 400, 104, b > 0 ? CREAM : INK, t, TT.n12 - 0.04, { stroke: b > 0 ? INK : WALL, sw: 0.1 });
    if (t >= wi('n12', 4) - 0.04) title(g, 'IS STILL GOING TO PRISON.', 1430, 104, CREAM, t, wi('n12', 4) - 0.04, { stroke: INK, sw: 0.16 });
    return flashAt(t, TT.n12 - 0.05) * 0.35;
  }
  // if I hadn't asked you first: the second number slides over the first
  function numBox(g, x, y, label) {
    g.save(); g.translate(x, y);
    R(g, -150, -92, 150, 176, 16); g.fillStyle = '#fffdf4'; g.fill(); g.strokeStyle = INK; g.lineWidth = 9; g.stroke();
    txt(g, '/10', 18, 54, 120, INK);
    txt(g, label, 0, -128, 56, INK, { align: 'center', kind: 'semi', fit: 330 });
    g.restore();
  }
  function shotOverwrite(g, t) {
    const TT = times();
    g.fillStyle = '#d9d3c3'; g.fillRect(0, 0, W, H);
    const u = sstep(TT.good + 0.02, TT.good + 0.55, t), y = 880, x1 = 280, x2 = lerp(742, x1, u);
    numBox(g, x1, y, 'FIRST');
    if (u < 0.95) { g.save(); g.globalAlpha = 1 - clamp(u * 2); g.strokeStyle = INK; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(462, y); g.lineTo(562, y); g.moveTo(530, y - 32); g.lineTo(562, y); g.lineTo(530, y + 32); g.stroke(); g.restore(); }
    g.save(); g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 20 * u; g.shadowOffsetY = 8 * u; numBox(g, x2, y, 'AFTER “GOOD”'); g.restore();
    if (t >= TT.good - 0.04) title(g, 'ONE WORD.', 500, 130, RED, t, TT.good - 0.04, { stroke: '#d9d3c3', sw: 0.02 });
    return flashAt(t, TT.n14 - 0.05) * 0.3;
  }
  // the witness box: you, your hands on the rail, and what you'll say
  function shotBox(g, t) {
    const TT = times();
    if (!CT) makeCourt();
    const z = 1.02 + 0.03 * sstep(TT.swear, TT.n15, t);
    g.save(); g.translate(513, 800); g.scale(z / CS, z / CS); g.translate(-513 * CS, -800 * CS); g.drawImage(CT.bg, 0, 0); g.restore();
    fan(g, 300, 300, t, 0.7); fan(g, 770, 296, t + 1, 0.6);
    const top = 1420;
    // the mic
    g.strokeStyle = '#25272c'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(513, top + 10); g.quadraticCurveTo(516, top - 120, 532, top - 196); g.stroke();
    g.fillStyle = '#2e3036'; R(g, 505, top - 262, 58, 84, 26); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; R(g, 513, top - 254, 12, 66, 6); g.fill();
    // the rail
    g.fillStyle = lg(g, 0, top + 40, 0, 1920, [0, '#8a5a33'], [1, '#4a2a12']); g.fillRect(-10, top + 30, W + 20, 560);
    g.fillStyle = lg(g, 0, top - 16, 0, top + 34, [0, '#c69060'], [1, '#7a4c28']); R(g, -10, top - 16, W + 20, 50, 16); g.fill();
    g.fillStyle = 'rgba(255,240,210,0.35)'; g.fillRect(0, top - 12, W, 5);
    for (const [hx, k] of [[170, 1], [856, -1]]) {
      g.fillStyle = S0.skin; ell(g, hx, top + 4, 92, 48, -0.04 * k); g.fill();
      g.strokeStyle = S0.skinD; g.lineWidth = 7; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const fx = hx - 52 + i * 34; g.beginPath(); g.moveTo(fx, top - 22); g.quadraticCurveTo(fx + 3, top + 18, fx, top + 44); g.stroke(); }
      g.fillStyle = '#3f6fb0'; R(g, hx - 90, top + 44, 180, 200, 30); g.fill();
    }
    bubble(g, 'I WAS THIS SURE FROM THE START.', 513, 840, t, wi('n14', 11) - 0.05, { tx: 513, w: 860, h: 150, size: 80 });
    txt(g, 'WELLS & BRADFIELD, 1998', 513, 1012, 34, '#5a544a', { kind: 'semi', align: 'center', a: clamp((t - TT.swear) * 3), stroke: '#f2e4c8', sw: 0.2 });
    return flashAt(t, TT.swear - 0.05) * 0.35;
  }
  // a real witness. No likeness: shapes, her back to us, and her own words, the same size and in plain type: this part isn't the game
  function shotReal(g, t) {
    const TT = times();
    g.fillStyle = '#0f1115'; g.fillRect(0, 0, W, H);
    const y = 1130;
    for (let i = 0; i < 7; i++) {
      const x = 92 + i * 142, lit = i === 3 || i === 4;
      g.fillStyle = lit ? 'rgba(255,196,110,0.3)' : 'rgba(240,226,190,0.13)'; R(g, x - 62, y - 190, 124, 440, 10); g.fill();
      g.fillStyle = lit ? '#59524a' : '#343843'; ell(g, x, y - 60, 42, 52); g.fill(); g.beginPath(); g.moveTo(x - 58, y + 250); g.bezierCurveTo(x - 58, y + 40, x - 28, y + 14, x, y + 12); g.bezierCurveTo(x + 28, y + 14, x + 58, y + 40, x + 58, y + 250); g.closePath(); g.fill();
      txt(g, String(i + 1), x, y + 214, 44, lit ? '#ffc46e' : '#7c808a', { kind: 'mono', align: 'center' });
    }
    g.fillStyle = '#05060a'; ell(g, 513, 1500, 108, 134); g.fill(); g.beginPath(); g.moveTo(240, 2100); g.bezierCurveTo(240, 1740, 400, 1670, 513, 1660); g.bezierCurveTo(626, 1670, 786, 1740, 786, 2100); g.closePath(); g.fill();
    txt(g, 'A REAL CASE', 513, 330, 44, '#ffc46e', { kind: 'mono', align: 'center', a: clamp((t - TT.n15 + 0.1) * 6) });
    const a1 = clamp((t - TT.n15 + 0.1) * 6);
    txt(g, '“IT IS BETWEEN NUMBER FOUR', 513, 438, 62, CREAM, { kind: 'mono', align: 'center', fit: 860, a: a1 });
    txt(g, 'AND NUMBER FIVE.”', 513, 518, 62, CREAM, { kind: 'mono', align: 'center', fit: 860, a: a1 });
    if (t >= TT.n15b - 0.05) {
      const a2 = clamp((t - TT.n15b + 0.05) * 6);
      txt(g, 'THEN, TOLD IT WAS THE SAME MAN:', 513, 646, 42, '#9aa0a8', { kind: 'mono', align: 'center', fit: 860, a: a2 });
      txt(g, '“BINGO. I DID IT RIGHT.”', 513, 738, 62, CREAM, { kind: 'mono', align: 'center', fit: 860, a: a2 });
    }
    txt(g, 'INNOCENCE PROJECT · CBS 60 MINUTES, 2009', 513, 1524, 32, '#8a8f98', { kind: 'semi', align: 'center', a: clamp((t - TT.n15) * 3) });
    return 0;
  }
  // Ronald Cotton: years on a wall. No likeness: a shape, its back to us, and tally marks (reel 20)
  function shotCotton(g, t) {
    const TT = times();
    if (!WALLC) makeCell();
    g.drawImage(WALLC, 0, 0);
    const u = sstep(TT.n16 + 0.1, TT.n16e + 0.4, t), yr = Math.round(lerp(1984, 1995, u));
    const sw = ((u * 9) % 1), lx = lerp(-520, 1180, sw), la = 0.11 * Math.sin(sw * Math.PI) * (u < 1 ? 1 : 0);
    if (la > 0.002) { g.fillStyle = `rgba(245,230,190,${la})`; for (let i = 0; i < 4; i++) { const bx = lx + i * 110; g.beginPath(); g.moveTo(bx + 240, 480); g.lineTo(bx + 330, 480); g.lineTo(bx + 90, 1620); g.lineTo(bx, 1620); g.closePath(); g.fill(); } }
    const n = Math.round(u * TALLY.length);
    g.lineCap = 'round'; g.strokeStyle = 'rgba(236,231,214,0.86)'; g.lineWidth = 7;
    g.beginPath(); for (let i = 0; i < n; i++) { const q = TALLY[i]; g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); } g.stroke();
    g.save(); g.translate(513, 1330); g.scale(1.9, 1.9); g.fillStyle = '#07080a';
    ell(g, 0, 0, 58, 72); g.fill(); R(g, -32, 30, 64, 90, 10); g.fill();
    g.beginPath(); g.moveTo(-146, 330); g.bezierCurveTo(-150, 140, -84, 96, 0, 88); g.bezierCurveTo(84, 96, 150, 140, 146, 330); g.closePath(); g.fill();
    g.restore();
    g.fillStyle = 'rgba(16,17,20,0.8)'; g.fillRect(0, 262, W, 410);
    txt(g, 'RONALD COTTON', 513, 376, 118, '#f7f1e2', { align: 'center', fit: 860 });
    txt(g, String(yr), 513, 548, 170, u >= 1 ? '#ffb347' : '#ece7d6', { align: 'center' });
    txt(g, 'THE WRONG MAN', 513, 636, 66, '#ffb347', { align: 'center', a: clamp((t - TT.n16) * 6) });
    return 0;
  }
  // he really is one of these six
  function shotSix(g, t) {
    const TT = times(), t0 = TT.n18 - 0.6;
    g.fillStyle = '#d9d3c3'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) card(g, i, t, { stare: 1 });
    txt(g, 'HE REALLY IS ONE OF THESE SIX', 513, 356, 84, INK, { align: 'center', fit: 860 });
    if (t >= t0 + 0.25) title(g, 'ONLY ONE HAS A CUT', 1316, 104, RED, t, t0 + 0.25, { stroke: '#d9d3c3', sw: 0.02 });
    if (t >= t0 + 0.45) title(g, 'IN HIS EYEBROW.', 1430, 104, RED, t, t0 + 0.45, { stroke: '#d9d3c3', sw: 0.02 });
    txt(g, "YOU'RE THE TEST SUBJECT", 513, 1520, 40, '#5a544a', { kind: 'semi', align: 'center' });
    return flashAt(t, t0) * 0.3;
  }
  // the last shot: he turns his clipboard round. All six, and the same two lines, the same takes.
  let SHEET = null;
  function makeSheet() {
    SHEET = offscreen(880, 760); const g = SHEET.getContext('2d');
    g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 880, 760);
    for (let i = 0; i < 6; i++) {
      const x = 18 + (i % 3) * 286, y = 22 + Math.floor(i / 3) * 366, w = 272, h = 350;
      wallLines(g, x, y, w, h);
      g.save(); R(g, x, y, w, h, 8); g.clip();
      suspect(g, MEN[i], x + w / 2, y + 165, 0.5, { look: [0, 1], frown: FROWN[i], smile: SMILE[i] });
      g.restore();
      tileNo(g, x + 10, y + h - 72, i + 1, 62);
      R(g, x, y, w, h, 8); g.strokeStyle = '#121212'; g.lineWidth = 5; g.stroke();
    }
  }
  function sketchHands(g, x0, x1, y) {
    g.save(); g.strokeStyle = '#47474d'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [hx, k] of [[x0, 1], [x1, -1]]) {
      g.lineWidth = 6; g.beginPath(); g.moveTo(hx - 60 * k, y + 50); g.lineTo(hx - 150 * k, H + 40); g.moveTo(hx + 44 * k, y + 56); g.lineTo(hx + 10 * k, H + 40); g.stroke();
      ell(g, hx, y, 62, 52, 0.2 * k); g.fillStyle = PAPERC; g.fill(); g.lineWidth = 6; g.stroke();
      g.lineWidth = 4; for (let i = 0; i < 4; i++) { const fy = y - 30 + i * 20; g.beginPath(); g.moveTo(hx - 34 * k, fy); g.quadraticCurveTo(hx + 22 * k, fy - 6, hx + 44 * k, fy + 6); g.stroke(); }
    }
    g.restore();
  }
  function shotLast(g, t) {
    const TT = times();
    if (!SHEET) makeSheet();
    g.fillStyle = PAPERC; g.fillRect(0, 0, W, H);
    const r = mulberry32(11); g.fillStyle = 'rgba(120,100,70,0.06)'; for (let i = 0; i < 500; i++) g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3);
    const op = talkP(t, 'o03') + talkP(t, 'o04');
    sketchOfficer(g, 513, 500, 0.72, { op, gone: true });
    const cw = 900, ch = 800, cx = 505, cy = 1180, ticks = sstep(TT.o04 - 0.03, TT.o04 + 0.22, t);
    g.save(); g.translate(cx, cy); g.rotate(-0.008);
    g.fillStyle = 'rgba(0,0,0,0.25)'; R(g, -cw / 2 + 10, -ch / 2 + 14, cw, ch, 18); g.fill();
    g.fillStyle = lg(g, -cw / 2, -ch / 2, cw / 2, ch / 2, [0, '#9a6a3e'], [1, '#6e4423']); R(g, -cw / 2, -ch / 2, cw, ch, 18); g.fill();
    g.drawImage(SHEET, -440, -372);
    g.fillStyle = '#b9bdc4'; R(g, -96, -ch / 2 - 24, 192, 54, 12); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; R(g, -86, -ch / 2 - 18, 172, 10, 5); g.fill();
    if (ticks > 0) for (let i = 0; i < 6; i++) { const x = -440 + 18 + (i % 3) * 286 + 272 - 56, y = -372 + 22 + Math.floor(i / 3) * 366 + 58; tick(g, x, y, 0.8, ticks); }
    g.restore();
    sketchHands(g, cx - 430, cx + 430, cy + 390);
    if (t < TT.o04 - 0.04) bubble(g, 'WHICH ONE?', 770, 396, t, TT.o03 - 0.05, { tx: 610, w: 340, h: 96, size: 60 });
    if (t >= TT.o04 - 0.04) title(g, 'GOOD.', 366, 124, YEL, t, TT.o04 - 0.04, { stroke: INK });
    return flashAt(t, TT.o03 - 0.1) * 0.35;
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
      if (t < TT.cut1) fl = crime(g, t);
      else if (t < TT.o01 - 0.05) fl = shotLineup(g, t);
      else if (t < TT.n05 - 0.03) fl = shotOfficer(g, t);
      else if (t < TT.n06 - 0.05) fl = shotDrawing(g, t);
      else if (t < TT.n08 - 0.06) fl = shotReveal(g, t);
      else if (t < TT.n12 - 0.05) fl = shotThree(g, t);
      else if (t < TT.n14 - 0.05) fl = shotBars(g, t);
      else if (t < TT.swear - 0.05) fl = shotOverwrite(g, t);
      else if (t < TT.n15 - 0.05) fl = shotBox(g, t);
      else if (t < TT.n16 - 0.05) fl = shotReal(g, t);
      else if (t < TT.n18 - 0.6) fl = shotCotton(g, t);
      else if (t < TT.o03 - 0.1) fl = shotSix(g, t);
      else fl = shotLast(g, t);
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
