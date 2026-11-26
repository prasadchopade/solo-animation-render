// Reel 52 · The Missing Word: the drawings (window.DRAW). film.js times and stages them.
// Copied from reel 49 (tag source/reel-49-the-con, film/draw.js), by name, because the brief's reel-49 functions (thiefFace, uncleRig,
// handShadow, stall) draw with them: txt, R, ell, lg, rg, hex, mix, rgba, sstep, mouth, eye, head, headProfile (as headSide), glass,
// steam, FING, POSE, LINE, hand, arm, makeStall's back wall (as stallBack: its CHAI 10/- board left out, no word anywhere) and
// makeStreet (as laneBG). New here: a head that turns a little (yaw), her hair, the frontal maroon cap with its brim, the constable's
// beret, moustache and whistle cord, the tea man's headband; the counting hands; the crate with the kettle's spout; the stove; the
// notebook and its handwriting (our own pen strokes); the sack; the people's bodies; the lane's morning; the step.
// Our own drawings, nobody real. Every function draws from its arguments alone: nothing is kept between frames except offscreen
// backgrounds, built once.
(() => {
  const { W, H, clamp, lerp, mulberry32 } = C;
  const TAU = Math.PI * 2, PI = Math.PI;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  // ------------------------------------------------------------------ canvas helpers (reel 20, via reel 49)
  const font = (size, kind = 'cond') => (kind === 'cond' ? `700 condensed ${size}px Bahn` : kind === 'semi' ? `700 semi-condensed ${size}px Bahn` : `600 semi-condensed ${size}px Bahn`);
  function txt(g, s, x, y, size, color, o = {}) {
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
  const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const mix = (a, b, u) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join(''); };
  const rgba = (c, a) => { const [r, gg, b] = hex(c); return `rgba(${r},${gg},${b},${a})`; };
  const capsule = (g, p, q, r0, r1) => { const an = Math.atan2(q[1] - p[1], q[0] - p[0]); g.beginPath(); g.arc(p[0], p[1], r0, an + PI / 2, an - PI / 2); g.arc(q[0], q[1], r1, an - PI / 2, an + PI / 2); g.closePath(); };

  // ------------------------------------------------------------------ the mouth and the eyes (reel 20's, from reel 19's rig; via reel 49)
  function mouth(g, cy, op, o = {}) {
    const lip = o.lip || '#7d463b';
    if (op < 0.012) {
      const w = o.w0 ?? 44, sm = o.smile || 0;
      g.lineCap = 'round'; g.strokeStyle = o.line || '#3c1d18'; g.lineWidth = o.lw0 ?? 6;
      g.beginPath(); g.moveTo(-w, cy - sm * 12 + (o.frown || 0) * 6); g.quadraticCurveTo(0, cy + 3 + sm * 13 - (o.frown || 0) * 8, w, cy - sm * 12 + (o.frown || 0) * 6); g.stroke();
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
    const w = (o.ew ?? 45) * (o.sx ?? 1), h = o.eh ?? 25, look = o.look || [0, 0], lid = o.lidC || '#231510';
    if (close < 0.92) {
      const up = h * 1.75 * (1 - close), dn = h * 1.05 * (1 - close * 0.72);
      const shape = () => { g.beginPath(); g.moveTo(cx - w, cy + 3); g.quadraticCurveTo(cx - side * 6, cy - up, cx + w, cy + 3); g.quadraticCurveTo(cx + side * 6, cy + dn, cx - w, cy + 3); g.closePath(); };
      g.save(); shape(); g.fillStyle = '#fbf7ee'; g.fill(); shape(); g.clip();
      const ix = cx + look[0] * (o.sx ?? 1), iy = cy - 3 + look[1], ir = o.ir ?? 18;
      ell(g, ix, iy, ir * (o.sx ?? 1), ir); g.fillStyle = rg(g, ix, iy, 2, ir, [0, o.iris2 || '#4f3421'], [1, o.iris || '#26170d']); g.fill();
      ell(g, ix, iy, ir * 0.52 * (o.sx ?? 1), ir * 0.52); g.fillStyle = '#060404'; g.fill();
      ell(g, ix - 6, iy - 7, 4.6, 4.6); g.fillStyle = 'rgba(255,255,255,0.92)'; g.fill();
      g.fillStyle = 'rgba(40,20,10,0.16)'; g.fillRect(cx - w, cy - up - 3, w * 2, up * 0.62);
      g.restore();
      g.strokeStyle = lid; g.lineCap = 'round'; g.lineWidth = o.lidW ?? 6.5;
      g.beginPath(); g.moveTo(cx - w, cy + 3); g.quadraticCurveTo(cx - side * 6, cy - up, cx + w, cy + 3); g.stroke();
      if (o.lash) { g.lineWidth = 3.5; for (const u of [0.2, 0.42, 0.64]) { const px = cx - w + 2 * w * (side > 0 ? u + 0.15 : 1 - u - 0.15), py = cy + 3 - up * 0.9 * Math.sin(PI * (side > 0 ? u + 0.15 : 1 - u - 0.15)); g.beginPath(); g.moveTo(px, py); g.lineTo(px + side * 9, py - 9); g.stroke(); } }
      g.strokeStyle = 'rgba(40,20,10,0.32)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(cx - w * 0.82, cy + 4); g.quadraticCurveTo(cx + side * 6, cy + dn, cx + w * 0.82, cy + 4); g.stroke();
    } else {
      g.strokeStyle = lid; g.lineWidth = (o.lidW ?? 6.5) + 1; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - w * 0.92, cy + 1); g.quadraticCurveTo(cx, cy + 13, cx + w * 0.92, cy + 1); g.stroke();
    }
  }

  // ------------------------------------------------------------------ the people (the thief's numbers are reel 49's: no beard, the user, 25 Nov)
  const MEN = {
    thief: { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', hat: 'cap', must: 'thin', brow: 15, browTilt: 8, jaw: 0.98, ew: 43, eh: 22, mole: [84, 62], shirt: '#2f8f7a' },
    // the stall-keeper: forties, centre-parted hair in a low bun, a small bindi, gold studs; a blue sari with a pink border, a pink blouse
    sk: { skin: '#b5805b', skinD: '#8c5c3e', skinH: '#d3a07a', hair: '#17100c', style: 'bun', brow: 11, browTilt: 7, jaw: 0.92, ew: 46, eh: 25, bindi: '#c2263a', stud: '#e8b632', lip: '#8a3f3a', lash: true, sari: '#2c5aa8', sariD: '#1d3f7a', border: '#e0457b', blouse: '#d9467a' },
    // the constable: tall and thin, a thick moustache, a dark beret, khaki
    co: { skin: '#a06e4b', skinD: '#784b31', skinH: '#bd8a64', hair: '#151110', style: 'buzz', hat: 'beret', must: 'thick', brow: 17, browTilt: 1, jaw: 1.06, ew: 41, eh: 21, khaki: '#c2a46e', khakiD: '#93784a' },
    // the tea man: wiry, clean-shaven, a red-and-white checked cloth tied round his head, a vest under an open blue checked shirt
    tm: { skin: '#a7714e', skinD: '#7d5034', skinH: '#c58e66', hair: '#1c1510', style: 'buzz', hat: 'band', brow: 14, browTilt: 9, jaw: 0.9, ew: 42, eh: 22, shirt: '#4f78b8' },
  };

  // ------------------------------------------------------------------ the head, frontal (reel 20's head(), via reel 49). New: o.yaw (−1…1,
  // the face turned towards screen right when > 0: the features slide, the far eye narrows, an ear hides), hair 'bun', the hats
  // ('cap', 'beret', 'band'), the bindi and studs. Units: the skull's centre at the origin; the face is about 372 wide.
  function head(g, L, o = {}) {
    const op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw, drop = 104 * op, chin = 232 + drop, ey = -28, ex = 80;
    const yw = clamp(o.yaw ?? 0, -1, 1), fx = yw * 54;
    // the bun at the nape, behind everything, showing on the side the face turns away from
    if (L.style === 'bun') { const bx = -yw * hw * 0.92; g.fillStyle = L.hair; ell(g, bx, 10, 92, 84); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 6; ell(g, bx - 10, 0, 58, 50); g.stroke(); }
    // ears: the one on the side the face turns towards slides in behind the cheek
    for (const k of [-1, 1]) { const vis = 1 - clamp(k * yw * 1.6); if (vis < 0.05) continue; g.save(); g.globalAlpha *= vis; ell(g, k * (hw + 1) - fx * 0.25, -18, 25, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); ell(g, k * (hw + 3) - fx * 0.25, -16, 12, 24, k * 0.08); g.fillStyle = L.skinD; g.fill(); if (L.stud) { g.fillStyle = L.stud; ell(g, k * (hw + 4) - fx * 0.25, 22, 8, 8); g.fill(); } g.restore(); }
    const path = () => {
      g.beginPath(); g.moveTo(-hw, -40);
      g.bezierCurveTo(-hw - 4, -216, -100, -266, 0, -266); g.bezierCurveTo(100, -266, hw + 4, -216, hw, -40);
      g.bezierCurveTo(hw + 4, 58, 152 - 16 * op + fx * 0.2, 150 + 44 * op, 88 - 6 * op + fx * 0.3, 205 + 82 * op);
      g.bezierCurveTo(60 + fx * 0.4, chin - 4, 28 + fx * 0.4, chin, fx * 0.4, chin); g.bezierCurveTo(-28 + fx * 0.4, chin, -60 + fx * 0.4, chin - 4, -88 + 6 * op + fx * 0.3, 205 + 82 * op);
      g.bezierCurveTo(-152 + 16 * op + fx * 0.2, 150 + 44 * op, -hw - 4, 58, -hw, -40); g.closePath();
    };
    path(); g.fillStyle = lg(g, -hw, -200, hw, 240, [0, L.skinH], [0.45, L.skin], [1, L.skinD]); g.fill();
    g.save(); path(); g.clip();
    g.fillStyle = rg(g, fx * 0.5, -40, 150, 330, [0, 'rgba(90,45,25,0)'], [1, 'rgba(90,45,25,0.3)']); g.fillRect(-300, -300, 600, 700);
    if (Math.abs(yw) > 0.02) { g.fillStyle = `rgba(90,45,25,${0.16 * Math.abs(yw)})`; g.fillRect(yw > 0 ? -hw - 10 : hw * 0.45, -300, hw * 0.6, 700); }   // the far cheek in shade
    g.restore();
    g.save(); g.translate(fx, 0);
    const sxN = 1 - 0.32 * Math.max(0, yw), sxF = 1 - 0.32 * Math.max(0, -yw);   // the eye on the turning side narrows
    const my = 118 + drop * 0.2;
    mouth(g, my, op, { lip: L.lip || '#83503f', w0: 44, frown: o.frown ?? 0, smile: o.smile ?? 0 });
    if (L.must) {
      const big = L.must === 'thick', th = big ? 26 : 13, w = big ? 70 : 52;
      g.fillStyle = L.hair; g.beginPath(); g.moveTo(0, 72); g.bezierCurveTo(-18, 64, -w * 0.72, 68, -w, my - 10 + (big ? 6 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 6 : 0)); g.bezierCurveTo(w * 0.72, 68, 18, 64, 0, 72); g.closePath(); g.fill();
      if (big) { g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 3; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 12, 80); g.quadraticCurveTo(k * 40, 84, k * 60, 106); g.stroke(); } }
    }
    const ny = 44;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 22 + yw * 6, ny - 18); g.quadraticCurveTo(k * 31 + yw * 8, ny, k * 25 + yw * 8, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, k * 13 + yw * 6, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5 + yw * 8, ny - 8, 10, 15); g.fill();
    if (L.mole) { g.fillStyle = '#2a1710'; ell(g, L.mole[0], L.mole[1], 9.5, 9); g.fill(); }
    const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look, lash: L.lash, lidW: L.lash ? 7.5 : 6.5 };
    eye(g, -1, -ex * (1 - 0.1 * Math.max(0, yw)), ey, close, { ...eo, sx: sxF }); eye(g, 1, ex * (1 - 0.1 * Math.max(0, -yw)), ey, close, { ...eo, sx: sxN });
    const bu = o.browUp || 0, bi = o.browIn || 0, b1 = o.browOne || 0;      // browOne: his eyebrow, the right one (screen right) alone
    g.strokeStyle = L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    for (const k of [-1, 1]) { const u1 = bu + (k > 0 ? b1 : 0); g.beginPath(); g.moveTo(k * (ex - 48), ey - 40 + L.browTilt - 22 * u1 - 16 * bi); g.quadraticCurveTo(k * (ex + 6), ey - 60 - 26 * u1 - (k > 0 ? 18 * b1 : 0), k * (ex + 54), ey - 40 - L.browTilt * 0.3 - 18 * u1 + 10 * bi); g.stroke(); }
    if (L.bindi) { g.fillStyle = L.bindi; ell(g, 0, ey - 64 - 10 * bu, 10, 10); g.fill(); }
    g.restore();
    // hair and hats, over the head
    g.fillStyle = L.hair;
    const hh = hw + 6;
    if (L.style === 'bun') {                                // centre-parted, smoothed back over the ears to the bun
      const px = fx * 0.55;
      g.beginPath(); g.moveTo(-hh - 4, 10); g.bezierCurveTo(-hh - 12, -240, -90, -292, px, -286); g.bezierCurveTo(90, -292, hh + 12, -240, hh + 4, 10);
      g.bezierCurveTo(hh - 8, -60, hh - 20, -150, 90 + px * 0.5, -196); g.quadraticCurveTo(px + 20, -214, px, -232); g.quadraticCurveTo(px - 20, -214, -90 + px * 0.5, -196); g.bezierCurveTo(-hh + 20, -150, -hh + 8, -60, -hh - 4, 10); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 5; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(px + k * 14, -270); g.bezierCurveTo(px + k * 90, -262, k * (hh - 10), -200, k * (hh - 4), -90); g.stroke(); }
      g.strokeStyle = mix(L.skin, '#3a1d10', 0.25); g.lineWidth = 4; g.beginPath(); g.moveTo(px, -286); g.lineTo(px, -232); g.stroke();   // the parting
    }
    if (L.hat === 'cap') { for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (hw + 2), -130); g.bezierCurveTo(k * (hw + 10), -80, k * (hw + 4), -40, k * (hw - 6), -10); g.lineTo(k * (hw - 34), -40); g.bezierCurveTo(k * (hw - 30), -80, k * (hw - 26), -110, k * (hw - 20), -130); g.closePath(); g.fill(); } }
    if (L.style === 'buzz' && L.hat !== 'beret') { g.globalAlpha = 0.82; g.beginPath(); g.moveTo(-hh + 6, -70); g.bezierCurveTo(-hh, -250, -80, -278, 0, -278); g.bezierCurveTo(80, -278, hh, -250, hh - 6, -70); g.bezierCurveTo(hh - 30, -150, 120, -190, 0, -196); g.bezierCurveTo(-120, -190, -hh + 30, -150, -hh + 6, -70); g.fill(); g.globalAlpha = 1; }
    if (L.hat === 'cap') {                                  // the maroon cap from the front: the crown, the seams, the brim curving out over the brow
      const cx = fx * 0.35, lift = 34 * (o.browUp || 0) + 22 * (o.browOne || 0);
      g.save(); g.translate(cx, -lift);
      g.fillStyle = 'rgba(40,10,6,0.3)'; g.beginPath(); g.moveTo(-hw * 0.95, -120); g.quadraticCurveTo(0, -70, hw * 0.95, -120); g.lineTo(hw * 0.95, -138); g.lineTo(-hw * 0.95, -138); g.closePath(); g.fill();   // the brim's shadow on the brow
      g.beginPath(); g.moveTo(-hw - 8, -130); g.bezierCurveTo(-hw - 14, -300, -110, -350, 0, -350); g.bezierCurveTo(110, -350, hw + 14, -300, hw + 8, -130); g.quadraticCurveTo(0, -162, -hw - 8, -130); g.closePath();
      g.fillStyle = lg(g, -hw, -350, hw, -130, [0, '#a32a3a'], [0.55, '#8e2433'], [1, '#5c1520']); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 4; for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(0, -350); g.quadraticCurveTo(k * 70, -280, k * 120, -150); g.stroke(); }
      g.fillStyle = '#5c1520'; ell(g, 0, -348, 14, 8); g.fill();
      g.beginPath(); g.moveTo(-hw * 0.92, -146); g.bezierCurveTo(-hw * 0.7, -92 - 4, hw * 0.7, -92 - 4, hw * 0.92, -146); g.bezierCurveTo(hw * 0.6, -128, -hw * 0.6, -128, -hw * 0.92, -146); g.closePath();
      g.fillStyle = '#4a111b'; g.fill(); g.strokeStyle = 'rgba(255,190,190,0.28)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-hw * 0.9, -144); g.bezierCurveTo(-hw * 0.6, -100, hw * 0.6, -100, hw * 0.9, -144); g.stroke();
      g.restore();
    }
    if (L.hat === 'beret') {                                // a dark beret pulled down to one side over the buzz cut
      const cx = fx * 0.3;
      g.globalAlpha = 0.85; g.beginPath(); g.moveTo(-hh + 6, -70); g.bezierCurveTo(-hh, -200, -80, -230, 0, -230); g.bezierCurveTo(80, -230, hh, -200, hh - 6, -70); g.bezierCurveTo(hh - 30, -150, 120, -180, 0, -186); g.bezierCurveTo(-120, -180, -hh + 30, -150, -hh + 6, -70); g.fill(); g.globalAlpha = 1;
      g.save(); g.translate(cx, 0);
      ell(g, -24, -250, hw * 1.12, 82, -0.1); g.fillStyle = lg(g, -hw, -320, hw, -180, [0, '#3a3633'], [1, '#1f1c1a']); g.fill();
      g.fillStyle = '#26221f'; g.beginPath(); g.moveTo(-hw - 2, -190); g.quadraticCurveTo(0, -222, hw + 2, -196); g.lineTo(hw, -170); g.quadraticCurveTo(0, -198, -hw, -166); g.closePath(); g.fill();   // the band
      g.fillStyle = '#c9a443'; ell(g, -hw * 0.45, -196, 16, 18); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; ell(g, -hw * 0.45 - 4, -202, 5, 6); g.fill();   // a plain brass button (no insignia)
      g.restore();
    }
    if (L.hat === 'band') {                                 // a checked cloth tied round the head, the knot over the right ear
      const cx = fx * 0.3;
      g.save(); g.translate(cx, 0);
      g.beginPath(); g.moveTo(-hw - 6, -150); g.quadraticCurveTo(0, -196, hw + 6, -150); g.lineTo(hw + 4, -96); g.quadraticCurveTo(0, -140, -hw - 4, -96); g.closePath();
      g.fillStyle = '#e8e2d6'; g.fill(); g.save(); g.clip();
      g.strokeStyle = 'rgba(196,40,48,0.75)'; g.lineWidth = 10; for (let x = -hw; x < hw + 20; x += 34) { g.beginPath(); g.moveTo(x, -210); g.lineTo(x, -80); g.stroke(); } for (const y of [-160, -126]) { g.beginPath(); g.moveTo(-hw - 10, y + 10); g.quadraticCurveTo(0, y - 28, hw + 10, y + 10); g.stroke(); }
      g.restore();
      g.fillStyle = '#e8e2d6'; ell(g, hw + 14, -118, 26, 20, 0.4); g.fill(); g.strokeStyle = 'rgba(196,40,48,0.7)'; g.lineWidth = 6; g.stroke();
      g.restore();
    }
  }

  // ------------------------------------------------------------------ the head in profile, facing left (reel 49's headProfile, generalised:
  // L.hat 'cap' | 'beret' | 'band', L.must 'thin' | 'thick', L.mole). Head-local units as head(); the face looks towards −x.
  function headSide(g, L, o = {}) {
    const sm = o.smile ?? 0.3, bu = o.browUp ?? 0, close = o.close ?? 0, look = o.look ?? 0, lookY = o.lookY ?? 0, op = o.op ?? 0;
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(150, -120); g.bezierCurveTo(205, -90, 210, 10, 170, 70); g.lineTo(110, 40); g.lineTo(96, -120); g.closePath(); g.fill();
    const jd = 26 * op;                                    // the jaw drops as he talks
    const face = () => {
      g.beginPath();
      g.moveTo(160, -40);
      g.bezierCurveTo(170, -190, 60, -262, -40, -258);
      g.bezierCurveTo(-120, -254, -168, -190, -170, -110);
      g.bezierCurveTo(-171, -86, -180, -60, -176, -40);
      g.bezierCurveTo(-176, -20, -198, 18, -214, 48);
      g.bezierCurveTo(-222, 62, -206, 74, -186, 72);
      g.bezierCurveTo(-180, 82, -172, 92, -176, 104);
      g.bezierCurveTo(-178, 116, -170, 128 + jd, -170, 136 + jd);
      g.bezierCurveTo(-176, 150 + jd, -166, 170 + jd, -160, 186 + jd);
      g.bezierCurveTo(-158, 214 + jd, -140, 236 + jd, -104, 238 + jd);
      g.bezierCurveTo(-40, 238 + jd, 40, 200, 92, 140);
      g.bezierCurveTo(130, 96, 150, 40, 160, -40);
      g.closePath();
    };
    face(); g.fillStyle = lg(g, -200, -200, 160, 220, [0, L.skinH], [0.5, L.skin], [1, L.skinD]); g.fill();
    g.save(); face(); g.clip();
    g.fillStyle = rg(g, -60, -30, 120, 300, [0, 'rgba(90,45,25,0)'], [1, 'rgba(90,45,25,0.28)']); g.fillRect(-300, -300, 600, 600);
    g.restore();
    ell(g, 70, -10, 30, 50, 0.12); g.fillStyle = L.skin; g.fill(); ell(g, 72, -8, 15, 30, 0.12); g.fillStyle = L.skinD; g.fill();
    g.fillStyle = 'rgba(60,30,18,0.55)'; ell(g, -184, 62, 11, 6, 0.3); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.35)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-170, 44); g.quadraticCurveTo(-150, 80, -150, 112); g.stroke();
    if (L.must === 'thick') { g.fillStyle = L.hair; g.beginPath(); g.moveTo(-190, 80); g.bezierCurveTo(-170, 70, -130, 74, -108, 104); g.bezierCurveTo(-118, 122, -150, 118, -170, 108); g.bezierCurveTo(-184, 104, -196, 96, -190, 80); g.closePath(); g.fill(); }
    else if (L.must) { g.fillStyle = L.hair; g.beginPath(); g.moveTo(-180, 84); g.quadraticCurveTo(-158, 80, -132, 98); g.quadraticCurveTo(-150, 100, -178, 96); g.closePath(); g.fill(); }
    if (op > 0.05) { g.fillStyle = '#3a0c12'; g.beginPath(); g.moveTo(-176, 122); g.quadraticCurveTo(-150, 124, -136, 120); g.quadraticCurveTo(-150, 126 + jd, -172, 130 + jd); g.closePath(); g.fill(); }
    else { g.strokeStyle = '#3c1d18'; g.lineWidth = 6; g.beginPath(); g.moveTo(-174, 122); g.quadraticCurveTo(-150, 126 + 4 * sm, -130 + 4 * sm, 118 - 16 * sm); g.stroke(); }
    if (L.mole) { g.fillStyle = '#2a1710'; ell(g, -96, 92, 10, 9.5); g.fill(); }
    const ex = -118, ey = -36;
    if (close < 0.9) {
      const opn = (1 - close) * (1 + 0.7 * bu);
      const shape = () => { g.beginPath(); g.moveTo(ex - 34, ey + 2); g.quadraticCurveTo(ex - 10, ey - 24 * opn, ex + 22, ey - 6 * opn); g.quadraticCurveTo(ex + 4, ey + 14 * opn, ex - 34, ey + 2); g.closePath(); };
      g.save(); shape(); g.fillStyle = '#fbf7ee'; g.fill(); shape(); g.clip();
      ell(g, ex - 18 + look * 6, ey - 2 + lookY * 5, 13, 15); g.fillStyle = '#26170d'; g.fill(); ell(g, ex - 18 + look * 6, ey - 2 + lookY * 5, 7, 8); g.fillStyle = '#060404'; g.fill();
      ell(g, ex - 22 + look * 6, ey - 8 + lookY * 5, 3.6, 3.6); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill();
      g.restore();
      g.strokeStyle = '#231510'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 34, ey + 2); g.quadraticCurveTo(ex - 10, ey - 24 * opn, ex + 22, ey - 6 * opn); g.stroke();
    } else { g.strokeStyle = '#231510'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 32, ey); g.quadraticCurveTo(ex - 8, ey + 10, ex + 20, ey - 2); g.stroke(); }
    g.strokeStyle = L.hair; g.lineWidth = L.brow; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ex - 40, ey - 40 - 64 * bu); g.quadraticCurveTo(ex - 6, ey - 62 - 92 * bu, ex + 34, ey - 50 - 40 * bu); g.stroke();
    if (L.hat === 'cap') {                                   // reel 49's cap: crown, seam, the brim's shadow, the brim forward
      g.save(); g.translate(5 * bu, -50 * bu); g.rotate(-0.06 * bu);
      g.fillStyle = 'rgba(40,10,6,0.32)'; g.beginPath(); g.moveTo(-176, -96); g.quadraticCurveTo(-60, -70, 140, -110); g.lineTo(140, -140); g.lineTo(-176, -130); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-178, -118); g.bezierCurveTo(-182, -250, -70, -318, 10, -316); g.bezierCurveTo(120, -314, 196, -250, 186, -120); g.quadraticCurveTo(10, -150, -178, -118); g.closePath();
      g.fillStyle = lg(g, -180, -316, 190, -120, [0, '#a32a3a'], [0.55, '#8e2433'], [1, '#5c1520']); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 4; g.beginPath(); g.moveTo(10, -316); g.quadraticCurveTo(-30, -230, -60, -132); g.stroke();
      g.fillStyle = '#5c1520'; ell(g, 20, -310, 14, 8); g.fill();
      g.beginPath(); g.moveTo(-170, -128); g.bezierCurveTo(-230, -132, -300, -118, -318, -100); g.bezierCurveTo(-306, -88, -240, -92, -168, -104); g.closePath(); g.fillStyle = '#4a111b'; g.fill();
      g.strokeStyle = 'rgba(255,190,190,0.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-178, -124); g.bezierCurveTo(-236, -128, -296, -116, -314, -102); g.stroke();
      g.restore();
    } else if (L.hat === 'beret') {
      g.fillStyle = L.hair; g.beginPath(); g.moveTo(-170, -120); g.bezierCurveTo(-160, -220, -40, -262, 40, -256); g.bezierCurveTo(130, -248, 176, -170, 168, -70); g.lineTo(130, -90); g.bezierCurveTo(120, -160, 40, -200, -40, -200); g.bezierCurveTo(-110, -198, -150, -160, -170, -120); g.closePath(); g.fill();
      ell(g, 10, -238, 210, 70, 0.16); g.fillStyle = lg(g, -200, -300, 200, -180, [0, '#3a3633'], [1, '#1f1c1a']); g.fill();
      g.fillStyle = '#26221f'; g.beginPath(); g.moveTo(-168, -170); g.quadraticCurveTo(0, -206, 170, -150); g.lineTo(166, -124); g.quadraticCurveTo(0, -180, -166, -146); g.closePath(); g.fill();
      g.fillStyle = '#c9a443'; ell(g, -110, -172, 15, 17); g.fill();
    } else if (L.hat === 'band') {
      g.fillStyle = L.hair; g.beginPath(); g.moveTo(-170, -120); g.bezierCurveTo(-160, -220, -40, -262, 40, -256); g.bezierCurveTo(130, -248, 176, -170, 168, -70); g.lineTo(130, -90); g.bezierCurveTo(120, -160, 40, -200, -40, -200); g.bezierCurveTo(-110, -198, -150, -160, -170, -120); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-176, -150); g.quadraticCurveTo(0, -190, 176, -120); g.lineTo(172, -74); g.quadraticCurveTo(0, -140, -176, -100); g.closePath(); g.fillStyle = '#e8e2d6'; g.fill();
      g.save(); g.clip(); g.strokeStyle = 'rgba(196,40,48,0.75)'; g.lineWidth = 10; for (let x = -180; x < 200; x += 34) { g.beginPath(); g.moveTo(x, -220); g.lineTo(x, -60); g.stroke(); } g.restore();
      g.fillStyle = '#e8e2d6'; ell(g, 182, -92, 30, 22, 0.5); g.fill(); g.strokeStyle = 'rgba(196,40,48,0.7)'; g.lineWidth = 6; g.stroke();
    }
  }

  // ------------------------------------------------------------------ the empty cutting-chai glass (reel 20's glass, emptied: nothing is
  // brewed yet at opening time), and steam (reel 20)
  function glass(g, x, y, s, rot, a = 1) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= a;
    g.fillStyle = 'rgba(235,240,245,0.34)'; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.lineTo(72, 130); g.lineTo(-72, 130); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 4; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 27, -120); g.lineTo(i * 20, 128); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.stroke();
    g.strokeStyle = 'rgba(120,130,140,0.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-96, -120); g.lineTo(-72, 130); g.lineTo(72, 130); g.lineTo(96, -120); g.stroke();
    g.restore();
  }
  function steam(g, x, y, t, a = 0.5) {
    g.strokeStyle = `rgba(255,255,255,${a * 0.5})`; g.lineWidth = 12; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const ph = t * 1.1 + k * 2.1; g.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, px = x + (k - 1) * 34 + Math.sin(ph + u * 5) * 18 * u, py = y - u * 200; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ hands (reel 49's keyed 2D poses). New: the counting poses c1…c5 (one
  // to five fingers up: index first, the thumb last), 'pen' (a pencil held to write), 'grip' (round a box's edge or a sack's neck)
  const FING = [[0.5, -0.128, 0.4, 0.108], [0.52, -0.042, 0.44, 0.112], [0.51, 0.044, 0.41, 0.106], [0.47, 0.124, 0.32, 0.094]];   // base x, base y, length, width: index … little
  const CURL = 0.36;
  const POSE = {
    flat: { f: [[1, -0.07], [1, -0.02], [1, 0.03], [1, 0.08]], th: [-0.55, 1] },
    rest: { f: [[0.8, -0.04], [0.78, 0], [0.76, 0.04], [0.74, 0.08]], th: [-0.5, 0.9] },
    point: { f: [[1.02, -0.03], [0.4, 0.02], [0.38, 0.05], [0.36, 0.08]], th: [-0.32, 0.78] },
    pinch: { f: [[0.72, 0.16], [0.56, 0.07], [0.5, 0.08], [0.45, 0.1]], th: [0.06, 0.92] },
    fist: { f: [[0.36, 0.01], [0.36, 0.01], [0.35, 0.03], [0.34, 0.05]], th: [-0.28, 0.72] },
    open: { f: [[1, -0.24], [1, -0.08], [1, 0.07], [1, 0.22]], th: [-1.0, 1] },
    hold: { f: [[0.86, 0.02], [0.86, 0.04], [0.8, 0.06], [0.72, 0.09]], th: [0.62, 1.0] },
    c0: { f: [[CURL, 0.01], [CURL, 0.01], [0.35, 0.03], [0.34, 0.05]], th: [0.05, 0.62] },
    c1: { f: [[1.02, -0.05], [CURL, 0.02], [0.35, 0.04], [0.34, 0.06]], th: [0.05, 0.62] },
    c2: { f: [[1.02, -0.1], [1.02, 0.0], [0.35, 0.04], [0.34, 0.06]], th: [0.05, 0.62] },
    c3: { f: [[1.02, -0.14], [1.02, -0.04], [1, 0.06], [0.34, 0.07]], th: [0.05, 0.62] },
    c4: { f: [[1.02, -0.18], [1.02, -0.06], [1, 0.06], [0.98, 0.18]], th: [0.1, 0.62] },
    c5: { f: [[1.02, -0.2], [1.02, -0.07], [1, 0.07], [0.98, 0.2]], th: [-1.0, 1] },
    pen: { f: [[0.7, 0.12], [0.62, 0.1], [0.46, 0.09], [0.42, 0.1]], th: [0.18, 0.95] },
    grip: { f: [[0.7, 0.3], [0.7, 0.3], [0.66, 0.3], [0.6, 0.3]], th: [0.5, 0.8] },
  };
  const LINE = (skin) => mix(skin, '#2a1208', 0.5);
  function hand(g, x, y, ang, s, pose, o = {}) {
    const P = typeof pose === 'object' ? pose : POSE[pose] || POSE.rest, skin = o.skin || MEN.sk.skin, line = LINE(skin), lw = 0.024;
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s * (o.fs ?? 1), o.left ? -s : s); g.lineJoin = 'round'; g.lineCap = 'round';
    const tone = (k) => mix(skin, k > 0 ? '#ffe6cc' : '#3a1d10', Math.abs(k));
    const pill = (x0, y0, a, len, w0, w1, col) => {
      const c = Math.cos(a), sn = Math.sin(a), nx = -sn, ny = c, x1 = x0 + c * len, y1 = y0 + sn * len;
      g.beginPath(); g.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
      g.arc(x1, y1, w1 / 2, a + PI / 2, a - PI / 2, true); g.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.closePath();
      g.fillStyle = col; g.fill(); g.strokeStyle = line; g.lineWidth = lw; g.stroke();
    };
    const thumb = () => { const [a, fr] = P.th, L = 0.3 * fr; pill(0.12, -0.12, a, L, 0.13, 0.1, tone(-0.04)); };
    if (o.part === 'over') { g.beginPath(); g.ellipse(0.13, -0.1, 0.12, 0.075, 0.3, 0, TAU); g.fillStyle = tone(-0.02); g.fill(); g.strokeStyle = line; g.lineWidth = lw; g.stroke(); thumb(); g.restore(); return; }
    if (o.part !== 'under' && !o.thumbOver) thumb();
    g.beginPath(); g.moveTo(-0.02, -0.15); g.bezierCurveTo(0.16, -0.19, 0.38, -0.2, 0.52, -0.17); g.quadraticCurveTo(0.57, 0, 0.5, 0.17); g.bezierCurveTo(0.36, 0.19, 0.16, 0.17, -0.02, 0.14); g.closePath();
    g.fillStyle = lg(g, 0, -0.2, 0.5, 0.2, [0, tone(0.05)], [1, tone(-0.05)]); g.fill(); g.strokeStyle = line; g.lineWidth = lw; g.stroke();
    for (let i = 3; i >= 0; i--) { const [bx, by, L, wd] = FING[i], [fr, a] = P.f[i]; pill(bx - 0.03, by, a, L * fr, wd, wd * (fr < 0.6 ? 0.98 : 0.86), tone(0.02 - 0.02 * i)); }
    if (o.thumbOver) thumb();
    if (o.bangle) { for (let k = 0; k < 3; k++) { g.strokeStyle = k % 2 ? '#e0457b' : '#e8b632'; g.lineWidth = 0.035; g.beginPath(); g.ellipse(-0.06 - k * 0.045, 0, 0.03, 0.2, 0, 0, TAU); g.stroke(); } }
    g.restore();
  }
  // an arm, keyed: shoulder S, elbow E, wrist Wr (reel 49's arm, with the sleeve's colour and length from the caller)
  function arm(g, S, E, Wr, o = {}) {
    const sk = o.skin || MEN.sk.skin, line = LINE(sk);
    const sides = (p, q, r0, r1, col, from = 0.28) => {
      const an = Math.atan2(q[1] - p[1], q[0] - p[0]), nx = -Math.sin(an), ny = Math.cos(an), p0 = [lerp(p[0], q[0], from), lerp(p[1], q[1], from)], rr = lerp(r0, r1, from);
      g.strokeStyle = col; g.lineWidth = 3; g.lineCap = 'round';
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(p0[0] + nx * rr * k, p0[1] + ny * rr * k); g.lineTo(q[0] + nx * r1 * k, q[1] + ny * r1 * k); g.stroke(); }
    };
    const w0 = o.w0 ?? 40, w1 = o.w1 ?? 36, w2 = o.w2 ?? 27;
    capsule(g, E, Wr, w1 * 0.92, w2); g.fillStyle = lg(g, E[0], E[1], Wr[0], Wr[1], [0, mix(sk, '#3a1d10', 0.1)], [1, sk]); g.fill(); g.strokeStyle = line; g.lineWidth = 3; g.stroke();
    if (o.long) {                                           // a full sleeve to the wrist (the constable's khaki), rolled once
      const sl = o.sleeve, C2 = [lerp(E[0], Wr[0], 0.72), lerp(E[1], Wr[1], 0.72)];
      capsule(g, S, E, w0 + 4, w1 + 6); g.fillStyle = lg(g, S[0], S[1], E[0], E[1], [0, mix(sl, '#ffffff', 0.12)], [1, sl]); g.fill(); sides(S, E, w0 + 4, w1 + 6, 'rgba(60,45,20,0.45)', 0.3);
      capsule(g, E, C2, w1 + 6, w2 + 10); g.fillStyle = sl; g.fill(); sides(E, C2, w1 + 6, w2 + 10, 'rgba(60,45,20,0.45)', 0);
      capsule(g, C2, C2, w2 + 12, w2 + 12); g.fillStyle = mix(sl, '#000000', 0.12); g.fill();
      return;
    }
    const cut = o.short ? 0.5 : 0.6, C2 = [lerp(S[0], E[0], cut), lerp(S[1], E[1], cut)];
    if (o.short) { capsule(g, C2, E, w1 * 1.02, w1 * 0.95); g.fillStyle = mix(sk, '#3a1d10', 0.06); g.fill(); sides(C2, E, w1 * 1.02, w1 * 0.95, line, 0); }
    const sl = o.sleeve || '#ece7d9', slEdge = 'rgba(40,30,30,0.4)';
    capsule(g, S, E, w0 * 0.85, w1); g.fillStyle = mix(sk, '#3a1d10', 0.06); g.fill(); sides(S, E, w0 * 0.85, w1, line, cut);
    capsule(g, S, C2, w0 + 4, w1 + 7); g.fillStyle = lg(g, S[0], S[1], C2[0], C2[1], [0, mix(sl, '#ffffff', 0.15)], [1, sl]); g.fill();
    sides(S, C2, w0 + 4, w1 + 7, slEdge);
    const an = Math.atan2(E[1] - S[1], E[0] - S[0]), nx = -Math.sin(an), ny = Math.cos(an), rc = w1 + 7;
    g.strokeStyle = o.edge || slEdge; g.lineWidth = o.edge ? 8 : 3; g.beginPath(); g.moveTo(C2[0] + nx * rc, C2[1] + ny * rc); g.quadraticCurveTo(C2[0] + Math.cos(an) * 10, C2[1] + Math.sin(an) * 10, C2[0] - nx * rc, C2[1] - ny * rc); g.stroke();
  }

  // ------------------------------------------------------------------ props
  // the supply box: a wooden crate, a kettle's spout and lid and a biscuit packet over its rim. (x, y): the crate's centre; o.tilt; o.lid
  function crate(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.rotate(o.tilt || 0); g.scale(s, s);
    const w = 300, h = 190;
    if (!o.noFill) {
      g.save(); g.translate(-40 + (o.kdx || 0), -h / 2 + 6 + (o.kdy || 0)); g.rotate(o.krot || 0);   // the kettle: aluminium, its spout up and right, the lid's knob
      g.fillStyle = lg(g, -80, -70, 80, 20, [0, '#e4e8ec'], [0.5, '#b9c0c7'], [1, '#8d949b']); ell(g, 0, 0, 92, 70); g.fill();
      g.strokeStyle = '#7d848b'; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#c9cfd5'; g.beginPath(); g.moveTo(70, -10); g.bezierCurveTo(110, -30, 130, -70, 150, -96); g.lineTo(166, -88); g.bezierCurveTo(146, -54, 128, -12, 84, 16); g.closePath(); g.fill(); g.stroke();
      ell(g, 0, -64, 46, 14); g.fillStyle = '#aeb5bc'; g.fill(); g.stroke(); ell(g, 0, -80, 13, 11); g.fillStyle = '#2a2a2e'; g.fill();
      g.strokeStyle = '#2a2a2e'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(-70, -30); g.bezierCurveTo(-60, -110, 60, -110, 70, -30); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)'; R(g, -56, -40, 18, 50, 9); g.fill();
      g.restore();
      g.save(); g.translate(92 + (o.pdx || 0), -h / 2 + 2 + (o.pdy || 0)); g.rotate(0.22 + (o.prot || 0));   // a biscuit packet: red and yellow, no words
      R(g, -34, -78, 68, 120, 6); g.fillStyle = '#d8342c'; g.fill(); g.fillStyle = '#f3c23a'; g.fillRect(-34, -40, 68, 30); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-26, -72, 8, 104);
      g.fillStyle = '#b52a22'; for (let i = 0; i < 6; i++) g.fillRect(-34 + i * 12, -86, 8, 10);
      g.restore();
    }
    // the crate: slats, its ends, nails
    g.fillStyle = lg(g, 0, -h / 2, 0, h / 2, [0, '#c99a5e'], [1, '#9a6c3a']); R(g, -w / 2, -h / 2, w, h, 8); g.fill();
    g.strokeStyle = '#6e4a24'; g.lineWidth = 6; g.strokeRect(-w / 2, -h / 2, w, h);
    g.strokeStyle = 'rgba(80,50,20,0.55)'; g.lineWidth = 5; for (const yy of [-h / 6, h / 6]) { g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(w / 2, yy); g.stroke(); }
    g.fillStyle = '#b07f45'; R(g, -w / 2 - 4, -h / 2 - 4, 26, h + 8, 4); g.fill(); R(g, w / 2 - 22, -h / 2 - 4, 26, h + 8, 4); g.fill();
    g.fillStyle = '#4a3420'; for (const xx of [-w / 2 + 9, w / 2 - 9]) for (const yy of [-h / 2 + 14, 0, h / 2 - 14]) { ell(g, xx, yy, 3.5, 3.5); g.fill(); }
    g.strokeStyle = 'rgba(80,50,20,0.25)'; g.lineWidth = 2; const r = mulberry32(31); for (let i = 0; i < 14; i++) { const yy = -h / 2 + r() * h, xx = -w / 2 + 30 + r() * (w - 60); g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + 40, yy + 2, xx + 70 + r() * 30, yy); g.stroke(); }
    g.restore();
  }
  // a single-burner steel stove on the counter; flame 0…1
  function stove(g, x, y, s, flame, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -120, -40, 120, 60, [0, '#c7ccd1'], [1, '#7d8389']); R(g, -130, -30, 260, 80, 12); g.fill(); g.strokeStyle = '#5c6268'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#2a2c30'; ell(g, 0, -34, 70, 16); g.fill();
    if (flame > 0.01) {                                      // the blue flame, flickering on the film's clock
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, fl = 0.75 + 0.25 * Math.sin(t * 31 + i * 1.7), hx = Math.cos(a) * 56, hy = -36 + Math.sin(a) * 12;
        g.fillStyle = `rgba(80,140,255,${0.75 * flame})`; g.beginPath(); g.moveTo(hx - 7, hy); g.quadraticCurveTo(hx, hy - 34 * fl * flame, hx + 7, hy); g.closePath(); g.fill();
        g.fillStyle = `rgba(200,230,255,${0.6 * flame})`; g.beginPath(); g.moveTo(hx - 3, hy); g.quadraticCurveTo(hx, hy - 14 * fl * flame, hx + 3, hy); g.closePath(); g.fill(); }
      g.fillStyle = rg(g, 0, -40, 4, 90, [0, `rgba(120,170,255,${0.25 * flame})`], [1, 'rgba(120,170,255,0)']); g.fillRect(-100, -130, 200, 120);
    }
    g.strokeStyle = '#3a3d42'; g.lineWidth = 8; g.lineCap = 'round'; for (const a of [0.5, 2.6, 4.7]) { g.beginPath(); g.moveTo(Math.cos(a) * 40, -36 + Math.sin(a) * 9); g.lineTo(Math.cos(a) * 86, -40 + Math.sin(a) * 18); g.stroke(); }
    g.fillStyle = '#1f2125'; ell(g, -90, 12, 16, 16); g.fill(); g.fillStyle = '#d8dde2'; R(g, -94, 0, 8, 14, 3); g.fill();
    g.restore();
  }
  function saucepan(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = lg(g, -80, -60, 80, 40, [0, '#dfe3e7'], [1, '#8f969d']); g.beginPath(); g.moveTo(-84, -56); g.lineTo(84, -56); g.lineTo(76, 40); g.quadraticCurveTo(0, 56, -76, 40); g.closePath(); g.fill(); g.strokeStyle = '#6f767d'; g.lineWidth = 4; g.stroke();
    ell(g, 0, -56, 84, 16); g.fillStyle = '#5d646b'; g.fill(); g.strokeStyle = '#c9cfd5'; g.lineWidth = 4; g.stroke();
    g.strokeStyle = 'rgba(90,98,106,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-40, -20); g.quadraticCurveTo(-30, -6, -44, 10); g.stroke();   // a dent
    g.fillStyle = '#2c2c30'; R(g, 84, -52, 120, 18, 8); g.fill();
    g.restore();
  }
  // a wire rack of six empty glasses
  function rack(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) glass(g, -90 + i * 90, -60 + j * 26 + (j ? 30 : 0), 0.4, 0, 1);
    g.strokeStyle = '#8a8f95'; g.lineWidth = 6; g.strokeRect(-140, -20, 280, 70); g.beginPath(); g.moveTo(-150, -90); g.lineTo(-150, 50); g.moveTo(150, -90); g.lineTo(150, 50); g.moveTo(-150, -90); g.quadraticCurveTo(0, -130, 150, -90); g.stroke();
    g.restore();
  }
  // the matchbox and a match (lit: flame 0…1)
  function match(g, x, y, ang, flame, t) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = '#e8d7b0'; R(g, 0, -4, 90, 8, 3); g.fill(); g.fillStyle = '#8a2a1e'; ell(g, 92, 0, 9, 7); g.fill();
    if (flame > 0.01) { const fl = 0.85 + 0.15 * Math.sin(t * 40); g.fillStyle = `rgba(255,190,60,${0.9 * flame})`; g.beginPath(); g.moveTo(84, 0); g.quadraticCurveTo(96, -40 * fl * flame, 112, 0); g.quadraticCurveTo(98, 14, 84, 0); g.closePath(); g.fill(); g.fillStyle = `rgba(255,250,200,${flame})`; ell(g, 96, -4, 6, 10 * fl); g.fill();
      g.fillStyle = rg(g, 96, -10, 2, 70, [0, `rgba(255,200,90,${0.3 * flame})`], [1, 'rgba(255,200,90,0)']); g.fillRect(26, -80, 140, 140); }
    g.restore();
  }
  // the constable's notebook, from the back (its cover to us), and the stubby pencil
  function notebookBack(g, x, y, ang, s) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
    g.fillStyle = '#7a2e22'; R(g, -70, -100, 140, 200, 8); g.fill(); g.strokeStyle = '#4a1a12'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#e9e1cf'; g.fillRect(-66, -104, 132, 6);                          // the pages' edge at the top
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 4; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(-60 + i * 20, -104, 6, PI, 0); g.stroke(); }   // the spiral
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(-60, -90, 12, 170);
    g.restore();
  }
  function pencil(g, x, y, ang, s) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
    g.fillStyle = '#e8b632'; R(g, 0, -9, 120, 18, 3); g.fill(); g.fillStyle = '#d9c19a'; g.beginPath(); g.moveTo(0, -9); g.lineTo(-28, 0); g.lineTo(0, 9); g.closePath(); g.fill();
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.moveTo(-18, -3.5); g.lineTo(-28, 0); g.lineTo(-18, 3.5); g.closePath(); g.fill(); g.fillStyle = '#e07a8a'; R(g, 118, -9, 18, 18, 4); g.fill();
    g.restore();
  }
  function penHand(g, x, y, s, skin, sleeve, ang = -0.95) {
    const line = LINE(skin);
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(ang); g.lineJoin = 'round'; g.lineCap = 'round';
    // in this frame the pencil runs along +x from its tip at the origin; the back of the hand lies on the +y side
    g.save(); g.rotate(1.4); capsule(g, [150, 40], [560, 120], 62, 70); g.fillStyle = sleeve; g.fill(); g.strokeStyle = 'rgba(60,45,20,0.5)'; g.lineWidth = 5; g.stroke(); g.restore();
    g.save(); g.rotate(1.4); capsule(g, [60, 20], [190, 50], 50, 56); g.fillStyle = mix(skin, '#3a1d10', 0.08); g.fill(); g.strokeStyle = line; g.lineWidth = 5; g.stroke(); g.restore();
    g.fillStyle = '#e8b632'; R(g, 0, -10, 230, 20, 4); g.fill(); g.fillStyle = '#d9c19a'; g.beginPath(); g.moveTo(0, -10); g.lineTo(-30, 0); g.lineTo(0, 10); g.closePath(); g.fill();
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.moveTo(-19, -4); g.lineTo(-30, 0); g.lineTo(-19, 4); g.closePath(); g.fill(); g.fillStyle = '#e07a8a'; R(g, 228, -10, 22, 20, 5); g.fill();
    g.beginPath(); g.moveTo(40, 6); g.bezierCurveTo(60, 70, 150, 110, 200, 80); g.bezierCurveTo(230, 50, 210, 0, 160, -8); g.bezierCurveTo(110, -14, 60, -6, 40, 6); g.closePath();
    g.fillStyle = lg(g, 40, 0, 200, 100, [0, mix(skin, '#ffe6cc', 0.06)], [1, mix(skin, '#3a1d10', 0.06)]); g.fill(); g.strokeStyle = line; g.lineWidth = 5; g.stroke();
    capsule(g, [120, 30], [60, 44], 22, 20); g.fillStyle = mix(skin, '#3a1d10', 0.04); g.fill(); g.stroke();
    capsule(g, [150, -16], [34, -14], 24, 20); g.fillStyle = mix(skin, '#ffe6cc', 0.04); g.fill(); g.stroke();
    capsule(g, [110, 66], [56, -2], 26, 22); g.fillStyle = mix(skin, '#3a1d10', 0.02); g.fill(); g.stroke();
    g.restore();
  }
  // our own hand-lettered capitals (pen strokes in a 1-high box): the constable's writing. Each letter is a list of strokes.
  const GLY = {
    A: [[[0, 1], [0.35, 0], [0.7, 1]], [[0.15, 0.6], [0.55, 0.6]]], B: [[[0, 0], [0, 1]], [[0, 0], [0.4, 0.02], [0.52, 0.22], [0.38, 0.46], [0, 0.48]], [[0.38, 0.46], [0.6, 0.66], [0.48, 0.96], [0, 1]]],
    C: [[[0.62, 0.14], [0.36, 0], [0.08, 0.16], [0, 0.5], [0.1, 0.86], [0.38, 1], [0.64, 0.86]]], E: [[[0.6, 0], [0, 0], [0, 1], [0.62, 1]], [[0, 0.5], [0.46, 0.5]]],
    I: [[[0.1, 0], [0.1, 1]]], K: [[[0, 0], [0, 1]], [[0.6, 0], [0.04, 0.56]], [[0.22, 0.4], [0.64, 1]]], L: [[[0, 0], [0, 1], [0.56, 1]]],
    N: [[[0, 1], [0, 0], [0.66, 1], [0.66, 0]]], O: [[[0.36, 0], [0.06, 0.18], [0, 0.52], [0.12, 0.86], [0.38, 1], [0.64, 0.84], [0.72, 0.48], [0.6, 0.14], [0.36, 0]]],
    P: [[[0, 1], [0, 0], [0.42, 0.02], [0.56, 0.24], [0.42, 0.48], [0, 0.5]]], S: [[[0.6, 0.12], [0.34, 0], [0.06, 0.12], [0.06, 0.38], [0.52, 0.58], [0.6, 0.84], [0.34, 1], [0.02, 0.88]]],
    T: [[[0, 0], [0.7, 0]], [[0.35, 0], [0.35, 1]]], U: [[[0, 0], [0, 0.72], [0.12, 0.96], [0.34, 1], [0.56, 0.94], [0.66, 0.7], [0.66, 0]]],
  };
  const GW = { A: 0.76, B: 0.66, C: 0.7, E: 0.66, I: 0.22, K: 0.68, L: 0.6, N: 0.72, O: 0.78, P: 0.6, S: 0.66, T: 0.72, U: 0.72 };
  // a word in his hand at (x, y) (its baseline-left), cap height h; done 0…1 draws its strokes in order (the pen's path); returns the pen's tip
  function scrawl(g, word, x, y, h, done = 1, o = {}) {
    const r = mulberry32(o.seed ?? word.length * 97 + 7), strokes = []; let cx = x;
    for (const ch of word) { const gl = GLY[ch]; if (!gl) { cx += h * 0.5; continue; } const dx = (r() - 0.5) * 0.06 * h, dy = (r() - 0.5) * 0.08 * h, sl = -0.12; for (const st of gl) strokes.push(st.map(([u, v]) => [cx + dx + u * h + (1 - v) * h * -sl * 0.5, y - h + dy + v * h])); cx += (GW[ch] + 0.16) * h; }
    let total = 0; const lens = strokes.map((st) => { let L = 0; for (let i = 1; i < st.length; i++) L += Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]); total += L; return L; });
    let left = total * clamp(done), tip = strokes.length ? strokes[0][0] : [x, y];
    g.save(); g.strokeStyle = o.ink || '#24305e'; g.lineWidth = o.lw || h * 0.085; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let k = 0; k < strokes.length && left > 0; k++) {
      const st = strokes[k]; g.beginPath(); g.moveTo(st[0][0], st[0][1]); tip = st[0];
      for (let i = 1; i < st.length; i++) { const L = Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]); if (left >= L) { g.lineTo(st[i][0], st[i][1]); left -= L; tip = st[i]; } else { const u = left / L; tip = [lerp(st[i - 1][0], st[i][0], u), lerp(st[i - 1][1], st[i][1], u)]; g.lineTo(tip[0], tip[1]); left = 0; break; } }
      g.stroke();
    }
    g.restore();
    return { tip, width: cx - x };
  }
  // the notebook's page, close: cream, ruled, a red margin, the spiral at its top. lines: [[word, done]] from the top ruled line down
  function page(g, x, y, s, lines, o = {}) {
    g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(s, s);
    g.fillStyle = 'rgba(40,20,8,0.3)'; R(g, -430 + 18, -620 + 24, 860, 1240, 14); g.fill();
    g.fillStyle = lg(g, 0, -620, 0, 620, [0, '#f4ecd8'], [1, '#e6dcc2']); R(g, -430, -620, 860, 1240, 14); g.fill();
    g.strokeStyle = 'rgba(70,110,170,0.35)'; g.lineWidth = 4; for (let yy = -500; yy < 600; yy += 150) { g.beginPath(); g.moveTo(-430, yy); g.lineTo(430, yy); g.stroke(); }
    g.strokeStyle = 'rgba(200,60,60,0.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-300, -620); g.lineTo(-300, 620); g.stroke();
    const tips = [];
    lines.forEach(([wd, done], i) => { if (wd) tips.push(scrawl(g, wd, -250, -500 + i * 150 - 18, 100, done, { seed: 11 + i * 13 })); else tips.push(null); });
    g.restore();
    return tips;
  }
  // the tea man's sack: jute, tied at the neck, stencilled TEA (after the question, a word can be written). (x, y): its centre
  function sack(g, x, y, s, rot = 0, o = {}) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    const body = () => { g.beginPath(); g.moveTo(-170, -150); g.bezierCurveTo(-220, -40, -230, 160, -160, 220); g.quadraticCurveTo(0, 262, 160, 220); g.bezierCurveTo(230, 160, 220, -40, 170, -150); g.quadraticCurveTo(0, -120, -170, -150); g.closePath(); };
    body(); g.fillStyle = lg(g, -200, -150, 200, 240, [0, '#d9bb84'], [0.6, '#c09a5e'], [1, '#93723f']); g.fill(); g.strokeStyle = '#7a5a2a'; g.lineWidth = 6; g.stroke();
    g.save(); body(); g.clip(); g.strokeStyle = 'rgba(110,80,35,0.25)'; g.lineWidth = 3; for (let i = -260; i < 260; i += 14) { g.beginPath(); g.moveTo(i, -200); g.lineTo(i + 30, 280); g.stroke(); } for (let j = -200; j < 280; j += 14) { g.beginPath(); g.moveTo(-260, j); g.lineTo(260, j - 10); g.stroke(); } g.restore();
    g.fillStyle = '#8a6a36'; g.beginPath(); g.moveTo(-110, -150); g.quadraticCurveTo(0, -200, 110, -150); g.lineTo(60, -200); g.quadraticCurveTo(0, -230, -60, -200); g.closePath(); g.fill();   // the gathered neck
    g.fillStyle = '#3b2a1a'; for (let i = 0; i < 9; i++) { ell(g, -50 + i * 12, -206 + (i % 3) * 5, 9, 5, i); g.fill(); }   // leaves at the neck
    g.strokeStyle = '#5a3b18'; g.lineWidth = 9; g.beginPath(); g.moveTo(-70, -172); g.quadraticCurveTo(0, -150, 70, -172); g.stroke();   // the twine
    if (!o.noWord) { g.save(); g.rotate(-0.06); txt(g, 'TEA', 0, 70, 190, 'rgba(60,32,14,0.82)', { align: 'center', ls: 10 }); g.restore(); }
    g.restore();
  }
  // the speaker icon for frame 0 (sound on)
  function speaker(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = '#14100a'; g.lineWidth = 10; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-40, -18); g.lineTo(-14, -18); g.lineTo(18, -46); g.lineTo(18, 46); g.lineTo(-14, 18); g.lineTo(-40, 18); g.closePath(); g.stroke(); g.fill();
    g.lineCap = 'round'; for (const r0 of [34, 58]) { g.strokeStyle = '#14100a'; g.lineWidth = 18; g.beginPath(); g.arc(18, 0, r0, -0.75, 0.75); g.stroke(); g.strokeStyle = col; g.lineWidth = 9; g.beginPath(); g.arc(18, 0, r0, -0.75, 0.75); g.stroke(); }
    g.restore();
  }

  // ------------------------------------------------------------------ the stall's back wall (reel 49's makeStall, in the morning, without its
  // CHAI 10/- board: a clock reading seven instead), and the bench at the back
  let STALL = null;
  function stallBack() {
    if (STALL) return STALL;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = mulberry32(52);
    const wall = ['#7a5636', '#5a3d26', '#3a2818'];
    g.fillStyle = lg(g, 0, 0, 0, 1100, [0, wall[0]], [0.6, wall[1]], [1, wall[2]]); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.05 + r() * 0.06) + ')'; g.fillRect(i * 80 + r() * 20, 0, 3, 1100); }
    // morning light through the stall's open side, from the left
    g.fillStyle = lg(g, 0, 0, W, 300, [0, 'rgba(255,214,150,0.32)'], [0.6, 'rgba(255,214,150,0.08)'], [1, 'rgba(255,214,150,0)']); g.fillRect(0, 0, W, 1100);
    const sy = 560;
    g.fillStyle = '#8a6040'; g.fillRect(0, sy, W, 20); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, sy + 20, W, 10);
    const jars = [[40, '#d9a35a'], [126, '#c9743a'], [212, '#b8b0a6'], [736, '#e6c07a'], [822, '#d38a3c']];
    for (const [jx, col] of jars) { g.fillStyle = 'rgba(235,240,245,0.42)'; R(g, jx, sy - 112, 70, 110, 10); g.fill(); g.fillStyle = col; R(g, jx + 6, sy - 82, 58, 78, 8); g.fill(); g.fillStyle = '#cc3333'; R(g, jx + 4, sy - 122, 62, 15, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; R(g, jx + 10, sy - 104, 8, 84, 4); g.fill(); }
    // the clock, at seven: opening time
    g.save(); g.translate(975, 470); ell(g, 0, 0, 64, 64); g.fillStyle = '#f4efe0'; g.fill(); g.strokeStyle = '#b03a2e'; g.lineWidth = 12; g.stroke();
    g.fillStyle = '#3a2a20'; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ell(g, Math.cos(a) * 56, Math.sin(a) * 56, 4, 4); g.fill(); }
    g.strokeStyle = '#2a1d16'; g.lineCap = 'round'; g.lineWidth = 9; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(TAU * (7 / 12) - PI / 2) * 34, Math.sin(TAU * (7 / 12) - PI / 2) * 34); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -50); g.stroke(); g.fillStyle = '#2a1d16'; ell(g, 0, 0, 7, 7); g.fill(); g.restore();
    const pk = ['#e8413a', '#f0c32a', '#2fa5d6', '#e05a8a', '#6cb33f'];
    for (let i = 0; i < 22; i++) { const px = -10 + i * 50, ph = 90 + (i % 3) * 20; g.fillStyle = pk[i % pk.length]; g.fillRect(px, 150, 40, ph); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(px + 6, 150, 6, ph); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(px, 150 + ph - 12, 40, 12); }
    g.fillStyle = lg(g, 0, 0, 0, 150, [0, '#2b6fb3'], [1, '#1f4f82']); g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 130); for (let i = 18; i >= 0; i--) g.quadraticCurveTo(i * 60 + 30, 162, i * 60, 134); g.closePath(); g.fill();
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, 170); g.quadraticCurveTo(540, 220, 1090, 170); g.stroke();
    for (let i = 0; i < 13; i++) { const u = i / 12, bx = lerp(10, 1070, u), by = 170 + 50 * Math.sin(u * PI) - 4; g.fillStyle = '#e9dfc2'; ell(g, bx, by + 8, 8, 10); g.fill(); }   // the bulbs, off by day
    STALL = c; return c;
  }
  // the bench at the back, right: its top, its front edge, its legs (drawn per frame: the thief stands behind it)
  function bench(g, y = 1000) {
    g.fillStyle = '#4a3220'; g.fillRect(560, y + 40, 18, 230); g.fillRect(1010, y + 40, 18, 230);
    g.fillStyle = lg(g, 0, y, 0, y + 50, [0, '#b07a48'], [1, '#865a32']); g.fillRect(540, y, 560, 46); g.fillStyle = 'rgba(255,230,190,0.3)'; g.fillRect(540, y, 560, 6);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(540, y + 46, 560, 14);
  }
  // the counter seen from the front: its top edge at y CT, the painted front below it (no words); everything on it is drawn per frame
  const CT = 1420;
  function counterFront(g) {
    g.fillStyle = lg(g, 0, CT - 40, 0, CT + 14, [0, '#c98f55'], [1, '#a86f3e']); g.fillRect(-40, CT - 40, W + 80, 54);
    g.fillStyle = 'rgba(255,230,190,0.4)'; g.fillRect(-40, CT - 40, W + 80, 6);
    g.fillStyle = '#d7a36a'; g.fillRect(-40, CT + 14, W + 80, 14);
    g.fillStyle = lg(g, 0, CT + 28, 0, H, [0, '#a1682f'], [1, '#6a4120']); g.fillRect(-40, CT + 28, W + 80, H);
    R(g, 60, CT + 70, W - 120, 380, 16); g.fillStyle = '#1f5f8f'; g.fill(); g.strokeStyle = '#f0c32a'; g.lineWidth = 12; g.stroke();
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#e8413a' : '#f0c32a'; ell(g, 100 + i * 73, CT + 120, 11, 11); g.fill(); }
    for (let i = 0; i < 10; i++) { const x = 130 + i * 92, y = CT + 270; g.fillStyle = i % 2 ? '#e05a8a' : '#f6efe0'; g.beginPath(); g.moveTo(x, y - 52); g.lineTo(x + 36, y); g.lineTo(x, y + 52); g.lineTo(x - 36, y); g.closePath(); g.fill(); }
  }

  // ------------------------------------------------------------------ the lane in the morning (reel 49's makeStreet, by day, two screens wide
  // for the march; its invented signs; a corner at the bend, x 1500–1720 of the strip, where the tea man comes round)
  let LANE = null;
  const LW = 2400;
  function laneBG() {
    if (LANE) return LANE;
    const bg = document.createElement('canvas'); bg.width = LW; bg.height = H; const g = bg.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, 1000, [0, '#9fd0ee'], [0.55, '#cfe6ef'], [1, '#f6e7c8']); g.fillRect(0, 0, LW, H);
    const r = mulberry32(44), cols = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#9a7ab8'];
    g.fillStyle = 'rgba(140,150,170,0.45)'; for (let x = -20; x < LW + 20;) { const w = 120 + r() * 120, hh = 300 + r() * 300; g.fillRect(x, 760 - hh, w, hh); x += w; }
    let x = -30, bi = 0;
    while (x < LW + 40) {
      const w = 170 + r() * 120, hh = 480 + r() * 260, y0 = 1000 - hh, c = cols[bi % cols.length]; bi++;
      g.fillStyle = c; g.fillRect(x, y0, w, hh + 40);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + w - 12, y0, 12, hh + 40);
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(x, y0, w, 12);
      if (bi % 2) { g.fillStyle = '#23252a'; R(g, x + w * 0.56, y0 - 58, 62, 58, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + w * 0.56 + 8, y0 - 54, 7, 50); }
      for (let fy = y0 + 46; fy < 760; fy += 130) for (let fx = x + 26; fx < x + w - 60; fx += 86) {
        g.fillStyle = 'rgba(40,50,60,0.62)'; R(g, fx, fy, 54, 76, 4); g.fill();
        g.fillStyle = 'rgba(200,225,240,0.5)'; R(g, fx + 3, fy + 3, 48, 30, 3); g.fill();
        g.strokeStyle = 'rgba(30,30,30,0.5)'; g.lineWidth = 3; g.beginPath(); for (let bb = 1; bb < 3; bb++) { g.moveTo(fx + bb * 18, fy); g.lineTo(fx + bb * 18, fy + 76); } g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(fx - 6, fy + 78, 66, 7);
      }
      x += w;
    }
    for (const [sx, tx, bgc, fg] of [[120, 'TAILORS', '#fff3cf', '#7a1f1f'], [560, 'SWEETS', '#b5341f', '#fff6d6'], [980, 'CHEMIST', '#0f6aa0', '#ffffff'], [1880, 'HARDWARE', '#3a3a8a', '#ffe9a0']]) {
      g.fillStyle = bgc; R(g, sx, 800, 210, 64, 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.stroke();
      txt(g, tx, sx + 105, 848, 44, fg, { align: 'center', fit: 186 });
      g.fillStyle = '#7d8086'; g.fillRect(sx + 6, 864, 198, 60); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); for (let yy = 868; yy < 924; yy += 9) { g.moveTo(sx + 6, yy); g.lineTo(sx + 204, yy); } g.stroke();   // shutters half up
      g.fillStyle = 'rgba(30,24,20,0.7)'; g.fillRect(sx + 6, 924, 198, 76);
    }
    g.strokeStyle = 'rgba(30,25,20,0.7)'; g.lineWidth = 3;
    for (const [a, b, c2] of [[300, 240, 330], [340, 290, 390], [260, 180, 300]]) { g.beginPath(); g.moveTo(-20, a); g.quadraticCurveTo(LW / 2, c2 + 90, LW + 20, b); g.stroke(); }
    // the corner at the bend: a near wall whose edge the tea man steps out from
    g.fillStyle = lg(g, 1500, 0, 1720, 0, [0, '#c2665c'], [1, '#9c4a42']); g.fillRect(1500, 300, 220, 900);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(1700, 300, 20, 900); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(1500, 300, 14, 900);
    g.fillStyle = lg(g, 0, 1000, 0, H, [0, '#b9ab97'], [1, '#8d8170']); g.fillRect(0, 1000, LW, H - 1000);
    g.strokeStyle = 'rgba(60,50,40,0.22)'; g.lineWidth = 3; g.beginPath(); for (const yy of [1060, 1160, 1300, 1480, 1700]) { g.moveTo(0, yy); g.lineTo(LW, yy); } for (let i = -6; i <= 16; i++) { g.moveTo(540 + i * 150, 1000); g.lineTo(540 + i * 430, 1700); } g.stroke();
    LANE = bg; return bg;
  }

  // ------------------------------------------------------------------ the step a few lanes on: a blue wall, a brown door, a stone step, a stray asleep
  let STEP = null;
  function stepBG() {
    if (STEP) return STEP;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = mulberry32(9);
    g.fillStyle = lg(g, 0, 0, W, H, [0, '#5f8fc4'], [1, '#3f6ea4']); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.05})`; ell(g, r() * W, r() * 1300, 30 + r() * 90, 14 + r() * 40, r()); g.fill(); }
    g.fillStyle = '#6a4428'; R(g, 290, 260, 500, 1060, 10); g.fill(); g.strokeStyle = '#3e2614'; g.lineWidth = 10; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 6; for (const [x0, y0, x1, y1] of [[330, 300, 750, 700], [330, 760, 750, 1280]]) g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle = '#c9a443'; ell(g, 720, 800, 14, 14); g.fill();
    g.fillStyle = lg(g, 0, 1320, 0, 1440, [0, '#bdb4a6'], [1, '#8c8476']); g.fillRect(180, 1320, 720, 120); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(180, 1320, 720, 8);
    g.fillStyle = lg(g, 0, 1440, 0, H, [0, '#a0937f'], [1, '#6d6455']); g.fillRect(0, 1440, W, H - 1440);
    // a stray, asleep by the step
    g.save(); g.translate(900, 1560); g.lineJoin = 'round'; g.strokeStyle = '#6a4424'; g.lineWidth = 6;
    g.fillStyle = '#c8955a'; g.beginPath(); g.moveTo(90, 10); g.bezierCurveTo(110, 60, 30, 90, -30, 70); g.bezierCurveTo(10, 60, 40, 40, 60, 10); g.closePath(); g.fill(); g.stroke();
    ell(g, 0, 0, 130, 58); g.fill(); g.stroke();
    g.fillStyle = '#d9a66a'; ell(g, -118, 22, 58, 40, 0.1); g.fill(); g.stroke();
    g.fillStyle = '#d9a66a'; ell(g, -170, 34, 30, 20, 0.15); g.fill(); g.stroke(); g.fillStyle = '#2a1a10'; ell(g, -196, 30, 9, 7); g.fill();
    g.fillStyle = '#9c6a3a'; g.beginPath(); g.moveTo(-110, -10); g.quadraticCurveTo(-92, -44, -76, -6); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#3a2416'; g.lineWidth = 5; g.beginPath(); g.moveTo(-140, 14); g.quadraticCurveTo(-128, 22, -116, 14); g.stroke();
    g.restore();
    STEP = c; return c;
  }

  // ------------------------------------------------------------------ bodies (busts: the head and the clothes; the film keys the arms)
  // the stall-keeper facing us: (x, y) her head's centre, s her scale; f the face; o.lean, o.dy
  function skBust(g, x, y, s, f, o = {}) {
    const L = MEN.sk;
    g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.lean || 0); g.scale(s, s);
    const by = 230;
    g.fillStyle = lg(g, -330, by, 330, by + 600, [0, L.blouse], [1, mix(L.blouse, '#000000', 0.25)]);
    g.beginPath(); g.moveTo(-350, by + 1500); g.lineTo(-340, by + 320); g.bezierCurveTo(-336, by + 200, -230, by + 140, -90, by + 116); g.lineTo(90, by + 116); g.bezierCurveTo(230, by + 140, 336, by + 200, 340, by + 320); g.lineTo(350, by + 1500); g.closePath(); g.fill();
    // the sari: pleats at her waist, the pallu over her left shoulder (screen right) across her chest, its pink border
    g.fillStyle = lg(g, -300, by + 300, 300, by + 900, [0, L.sari], [1, L.sariD]);
    g.beginPath(); g.moveTo(-350, by + 1500); g.lineTo(-330, by + 520); g.quadraticCurveTo(0, by + 470, 330, by + 520); g.lineTo(350, by + 1500); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(330, by + 210); g.bezierCurveTo(260, by + 150, 130, by + 140, 70, by + 170); g.lineTo(-250, by + 620); g.lineTo(-60, by + 680); g.lineTo(330, by + 330); g.closePath(); g.fillStyle = lg(g, -200, by + 200, 300, by + 600, [0, mix(L.sari, '#ffffff', 0.1)], [1, L.sari]); g.fill();
    g.strokeStyle = L.border; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(70, by + 176); g.lineTo(-250, by + 620); g.stroke();
    g.strokeStyle = '#e8b632'; g.lineWidth = 6; g.beginPath(); g.moveTo(88, by + 188); g.lineTo(-232, by + 630); g.stroke();
    g.strokeStyle = 'rgba(10,20,60,0.25)'; g.lineWidth = 8; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(200 - k * 40, by + 240 + k * 20); g.lineTo(-40 - k * 30, by + 640); g.stroke(); }
    const nw = 70; g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 150); g.lineTo(-nw - 14, by + 120); g.quadraticCurveTo(0, by + 190, nw + 14, by + 120); g.lineTo(nw, 150); g.closePath(); g.fill();
    g.rotate(f.tilt || 0);
    head(g, L, f);
    g.restore();
  }
  // the constable facing us (his khaki shirt, two pockets, plain buttons and shoulder straps, the whistle's cord to his pocket)
  function coBust(g, x, y, s, f, o = {}) {
    const L = MEN.co;
    g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.lean || 0); g.scale(s, s);
    const by = 230;
    g.fillStyle = lg(g, -330, by, 330, by + 700, [0, mix(L.khaki, '#ffffff', 0.08)], [1, L.khakiD]);
    g.beginPath(); g.moveTo(-350, by + 1500); g.lineTo(-350, by + 320); g.bezierCurveTo(-346, by + 200, -240, by + 140, -92, by + 114); g.lineTo(92, by + 114); g.bezierCurveTo(240, by + 140, 346, by + 200, 350, by + 320); g.lineTo(350, by + 1500); g.closePath(); g.fill();
    g.fillStyle = mix(L.khaki, '#000000', 0.12); for (const k of [-1, 1]) { R(g, k * 300 - 50, by + 150, 100, 36, 8); g.fill(); }
    g.strokeStyle = 'rgba(80,60,30,0.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, by + 150); g.lineTo(0, by + 1500); g.stroke();
    for (let i = 0; i < 5; i++) { g.fillStyle = '#c9a443'; ell(g, 0, by + 210 + i * 130, 11, 11); g.fill(); }
    for (const k of [-1, 1]) { g.fillStyle = mix(L.khaki, '#000000', 0.06); R(g, k * 170 - 80, by + 300, 160, 150, 10); g.fill(); g.strokeStyle = 'rgba(80,60,30,0.45)'; g.lineWidth = 4; g.stroke(); g.fillStyle = mix(L.khaki, '#000000', 0.15); R(g, k * 170 - 84, by + 286, 168, 44, 8); g.fill(); }
    g.strokeStyle = '#d9d2c0'; g.lineWidth = 7; g.beginPath(); g.moveTo(-300, by + 170); g.quadraticCurveTo(-250, by + 300, -170, by + 320); g.stroke();   // the whistle's cord
    const nw = 78; g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 150); g.lineTo(-nw - 10, by + 120); g.quadraticCurveTo(0, by + 196, nw + 10, by + 120); g.lineTo(nw, 150); g.closePath(); g.fill();
    g.fillStyle = mix(L.khaki, '#ffffff', 0.12); for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 20, by + 150); g.lineTo(k * 120, by + 112); g.lineTo(k * 92, by + 210); g.closePath(); g.fill(); }   // the collar
    g.rotate(f.tilt || 0);
    head(g, L, f);
    g.restore();
  }
  // the constable side-on, facing screen right (his head in profile, mirrored); his far shoulder behind
  function coSide(g, x, y, s, f, o = {}) {
    const L = MEN.co;
    g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.lean || 0); g.scale(-s * (o.face === 'left' ? -1 : 1), s);
    g.fillStyle = lg(g, -160, 300, 420, 1500, [0, mix(L.khaki, '#ffffff', 0.08)], [0.5, L.khaki], [1, L.khakiD]);
    g.beginPath(); g.moveTo(-60, 250); g.bezierCurveTo(40, 200, 220, 210, 320, 300); g.bezierCurveTo(420, 420, 450, 900, 460, 2300); g.lineTo(-60, 2300); g.bezierCurveTo(-110, 1400, -170, 600, -60, 250); g.closePath(); g.fill();
    g.fillStyle = mix(L.khaki, '#000000', 0.06); R(g, -40, 420, 150, 150, 10); g.fill(); g.strokeStyle = 'rgba(80,60,30,0.45)'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#c9a443'; for (let i = 0; i < 4; i++) { ell(g, -70, 380 + i * 140, 10, 10); g.fill(); }
    g.fillStyle = lg(g, -70, 0, 110, 0, [0, L.skin], [1, L.skinD]); g.beginPath(); g.moveTo(-60, 150); g.lineTo(-70, 290); g.quadraticCurveTo(40, 320, 130, 280); g.lineTo(110, 110); g.closePath(); g.fill();
    g.fillStyle = mix(L.khaki, '#ffffff', 0.1); g.beginPath(); g.moveTo(-84, 270); g.quadraticCurveTo(30, 330, 150, 262); g.lineTo(158, 296); g.quadraticCurveTo(30, 366, -92, 304); g.closePath(); g.fill();
    g.save(); g.rotate(f.tilt || 0); headSide(g, L, f); g.restore();
    g.restore();
  }
  // the tea man facing us, his vest under an open checked shirt
  function tmBust(g, x, y, s, f, o = {}) {
    const L = MEN.tm;
    g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.lean || 0); g.scale(s, s);
    const by = 230;
    g.fillStyle = lg(g, -300, by, 300, by + 700, [0, mix(L.shirt, '#ffffff', 0.1)], [1, mix(L.shirt, '#000000', 0.2)]);
    g.beginPath(); g.moveTo(-320, by + 1500); g.lineTo(-320, by + 320); g.bezierCurveTo(-316, by + 200, -220, by + 140, -84, by + 114); g.lineTo(84, by + 114); g.bezierCurveTo(220, by + 140, 316, by + 200, 320, by + 320); g.lineTo(320, by + 1500); g.closePath(); g.fill();
    g.save(); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 10; for (let i = -340; i < 340; i += 46) { g.beginPath(); g.moveTo(i, by); g.lineTo(i, by + 1500); g.stroke(); } for (let j = by; j < by + 1500; j += 46) { g.beginPath(); g.moveTo(-340, j); g.lineTo(340, j); g.stroke(); } g.restore();
    g.fillStyle = '#f2efe6'; g.beginPath(); g.moveTo(-120, by + 1500); g.lineTo(-110, by + 150); g.quadraticCurveTo(0, by + 260, 110, by + 150); g.lineTo(120, by + 1500); g.closePath(); g.fill();   // the vest
    const nw = 64; g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 150); g.lineTo(-nw - 10, by + 120); g.quadraticCurveTo(0, by + 196, nw + 10, by + 120); g.lineTo(nw, 150); g.closePath(); g.fill();
    g.rotate(f.tilt || 0);
    head(g, L, f);
    g.restore();
  }
  // the thief facing us, in his teal shirt (reel 49's colours)
  function thiefBust(g, x, y, s, f, o = {}) {
    const L = MEN.thief;
    g.save(); g.translate(x + (o.dx || 0), y + (o.dy || 0)); g.rotate(o.lean || 0); g.scale(s, s);
    const by = 230;
    g.fillStyle = lg(g, -320, by, 320, by + 700, [0, '#46b49b'], [0.5, '#2f8f7a'], [1, '#1d6656']);
    g.beginPath(); g.moveTo(-330, by + 1500); g.lineTo(-330, by + 320); g.bezierCurveTo(-326, by + 200, -226, by + 140, -88, by + 114); g.lineTo(88, by + 114); g.bezierCurveTo(226, by + 140, 326, by + 200, 330, by + 320); g.lineTo(330, by + 1500); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 6; for (let i = 0; i < 4; i++) { ell(g, 0, by + 240 + i * 150, 7, 7); g.stroke(); }
    const nw = 70; g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 150); g.lineTo(-nw - 10, by + 120); g.quadraticCurveTo(0, by + 196, nw + 10, by + 120); g.lineTo(nw, 150); g.closePath(); g.fill();
    g.fillStyle = '#2a8a74'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 16, by + 150); g.lineTo(k * 120, by + 110); g.lineTo(k * 96, by + 220); g.closePath(); g.fill(); }
    g.rotate(f.tilt || 0);
    head(g, L, f);
    g.restore();
  }
  // the thief side-on, walking (facing screen right), the box under his near arm, its kettle spout up; walk: the stride's phase
  function thiefWalk(g, x, y, s, f, walk, o = {}) {
    const L = MEN.thief, bob = Math.abs(Math.sin(walk * PI)) * 16;
    g.save(); g.translate(x, y - bob * s); g.scale(-s, s);
    // the legs first: hip, knee, ankle; the far leg darker; one stride per unit of walk (the swinging knee bends)
    const ph = walk * PI, sw = Math.sin(ph);
    const leg = (k) => {
      const a = sw * k, hip = [150, 1260], th = 0.42 * a, kn = [hip[0] - Math.sin(th) * 420, hip[1] + Math.cos(th) * 420];
      const bend = Math.max(0, a) * 0.8, sh = th + bend, an = [kn[0] - Math.sin(sh) * 400, kn[1] + Math.cos(sh) * 400];
      g.fillStyle = k > 0 ? '#2a2e36' : '#1f232a'; capsule(g, hip, kn, 78, 64); g.fill(); capsule(g, kn, an, 62, 50); g.fill();
      g.fillStyle = '#141414'; g.beginPath(); g.ellipse(an[0] - 50, an[1] + 30, 92, 40, 0, 0, TAU); g.fill();
    };
    leg(sw >= 0 ? -1 : 1); leg(sw >= 0 ? 1 : -1);
    g.fillStyle = lg(g, -160, 300, 420, 1300, [0, '#46b49b'], [0.5, '#2f8f7a'], [1, '#1d6656']);
    g.beginPath(); g.moveTo(-60, 250); g.bezierCurveTo(40, 200, 220, 210, 320, 300); g.bezierCurveTo(400, 420, 420, 900, 400, 1260); g.lineTo(-60, 1260); g.bezierCurveTo(-110, 1000, -160, 600, -60, 250); g.closePath(); g.fill();
    g.fillStyle = '#1f2228'; g.fillRect(-64, 1230, 466, 46);                                                   // the belt
    g.fillStyle = lg(g, -70, 0, 110, 0, [0, L.skin], [1, L.skinD]); g.beginPath(); g.moveTo(-60, 150); g.lineTo(-70, 290); g.quadraticCurveTo(40, 320, 130, 280); g.lineTo(110, 110); g.closePath(); g.fill();
    g.fillStyle = '#2a8a74'; g.beginPath(); g.moveTo(-84, 270); g.quadraticCurveTo(30, 330, 150, 262); g.lineTo(158, 296); g.quadraticCurveTo(30, 366, -92, 304); g.closePath(); g.fill();
    g.save(); g.rotate(f.tilt || 0); headSide(g, L, f); g.restore();
    // the box, clamped under his near arm against his side, the spout to the front (screen right after the mirror)
    g.save(); g.translate(10, 820 + 8 * Math.sin(walk * TAU)); g.scale(-1, 1); crate(g, 0, 0, 1.25, { tilt: 0.06 }); g.restore();
    // the near arm over the box: sleeve, forearm along the box's top, the hand round its far end
    const sk = L.skin; g.fillStyle = '#2f8f7a'; R(g, 40, 300, 130, 240, 56); g.fill();
    capsule(g, [100, 520], [-150, 700], 46, 38); g.fillStyle = sk; g.fill(); g.strokeStyle = LINE(sk); g.lineWidth = 5; g.stroke();
    hand(g, -150, 700, 1.9, 190, 'grip', { skin: sk });
    g.restore();
  }

  window.DRAW = { TAU, PI, sstep, font, txt, R, ell, lg, rg, hex, mix, rgba, capsule, mouth, eye, MEN, head, headSide, glass, steam,
    FING, POSE, LINE, hand, arm, crate, stove, saucepan, rack, match, notebookBack, pencil, penHand, scrawl, page, sack, speaker,
    stallBack, bench, counterFront, CT, laneBG, LW, stepBG, skBust, coBust, coSide, tmBust, thiefBust, thiefWalk };
})();
