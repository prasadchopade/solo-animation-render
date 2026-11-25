// Reel 49 · The Con: the drawings (window.DRAW). film.js times and stages them.
// Copied from reel 20 (archive/reels-source-2026-11-04: reels/reel-20-the-only-witness/film/film.js), by name: txt, R, ell, lg,
// rg, sstep, mouth, eye, head, MEN (s2, the chaiwala, and thief), glass, steam. New here: the notes, the coin, the tin, the
// counter, the stall, the hands and arms (keyed 2D poses, no rig: HQ's brief, after reel 45), the thief in profile, the people's
// bodies. Our own drawings, nobody real; the money is invented (big numerals, our own colours, a chai-glass watermark).
// Every function draws from its arguments alone: nothing is kept between frames except offscreen backgrounds, built once.
(() => {
  const { W, H, clamp, lerp, mulberry32 } = C;
  const TAU = Math.PI * 2, PI = Math.PI;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  // ------------------------------------------------------------------ canvas helpers (reel 20)
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
  const mix = (a, b, u) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], u)).toString(16).padStart(2, '0')).join(''); };
  const rgba = (c, a) => { const [r, gg, b] = hex(c); return `rgba(${r},${gg},${b},${a})`; };

  // ------------------------------------------------------------------ the mouth and the eyes (reel 20, from reel 19's rig)
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
  function grimace(g, cy, gr, op) {
    const w = lerp(44, 82, gr), h = lerp(12, 30, gr) + 46 * op;
    g.save(); R(g, -w, cy - h * 0.45, 2 * w, h, Math.min(h / 2, 16)); g.fillStyle = '#f7f2e4'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#83503f'; g.lineJoin = 'round'; g.stroke();
    g.strokeStyle = 'rgba(90,60,50,0.55)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-w + 6, cy + h * 0.05); g.lineTo(w - 6, cy + h * 0.05); g.stroke();
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo((i * w) / 3, cy - h * 0.4); g.lineTo((i * w) / 3, cy + h * 0.5); g.stroke(); }
    g.restore();
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

  // ------------------------------------------------------------------ faces (reel 20's MEN: s2 is the chaiwala; thief is the season's thief)
  const MEN = {
    thief: { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', style: 'cap', must: 'thin', stub: 0, brow: 15, browTilt: 8, jaw: 0.98, ew: 43, eh: 22, mole: [84, 62] },   // no beard (the user, 25 Nov)
    s2: { skin: '#a8704c', skinD: '#7f5032', skinH: '#c28c66', hair: '#100c09', style: 'buzz', must: 'thick', stub: 0, brow: 15, browTilt: 4, jaw: 1.05, ew: 42, eh: 22 },
  };
  // reel 20's head, frontal; o.browUp lifts both brows (new), o.browIn pinches them (new: worry, apology)
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
    if ((o.grit || 0) > 0.05) grimace(g, my, Math.min(1, o.grit), op); else mouth(g, my, op, { lip: '#83503f', w0: 44, frown: o.frown ?? 0, smile: o.smile ?? 0 });
    if (L.must) {
      const big = L.must === 'thick', th = big ? 24 : 13, w = big ? 62 : 52;
      g.fillStyle = L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
    }
    const ny = 44;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 22, ny - 18); g.quadraticCurveTo(k * 31, ny, k * 25, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, k * 13, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5, ny - 8, 10, 15); g.fill();
    if (L.mole) { g.fillStyle = '#2a1710'; ell(g, L.mole[0], L.mole[1], 9.5, 9); g.fill(); }
    const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look };
    eye(g, -1, -ex, ey, close, eo); eye(g, 1, ex, ey, close, eo);
    const bu = o.browUp || 0, bi = o.browIn || 0;
    g.strokeStyle = L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (ex - 48), ey - 40 + L.browTilt - 22 * bu - 16 * bi); g.quadraticCurveTo(k * (ex + 6), ey - 60 - 26 * bu, k * (ex + 54), ey - 40 - L.browTilt * 0.3 - 18 * bu + 10 * bi); g.stroke(); }
    g.fillStyle = L.hair;
    const hh = hw + 6;
    if (L.style === 'recede') { g.beginPath(); g.moveTo(-hh, -60); g.bezierCurveTo(-hh - 6, -230, -80, -282, 0, -282); g.bezierCurveTo(80, -282, hh + 6, -230, hh, -60); g.bezierCurveTo(hh - 16, -160, 120, -226, 60, -214); g.quadraticCurveTo(0, -250, -60, -214); g.bezierCurveTo(-120, -226, -hh + 16, -160, -hh, -60); g.fill(); }
    if (L.style === 'buzz') { g.globalAlpha = 0.82; g.beginPath(); g.moveTo(-hh + 6, -70); g.bezierCurveTo(-hh, -250, -80, -278, 0, -278); g.bezierCurveTo(80, -278, hh, -250, hh - 6, -70); g.bezierCurveTo(hh - 30, -150, 120, -190, 0, -196); g.bezierCurveTo(-120, -190, -hh + 30, -150, -hh + 6, -70); g.fill(); g.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ the thief in profile, facing left (new). Head-local units match head():
  // the skull's centre is the origin, the face looks towards −x, his left cheek (the mole) is the one we see. Cap first, brim forward.
  function headProfile(g, L, o = {}) {
    const sm = o.smile ?? 0.3, bu = o.browUp ?? 0, close = o.close ?? 0, look = o.look ?? 0, lookY = o.lookY ?? 0;
    // neck (drawn by the body), ear, hair at the back
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(150, -120); g.bezierCurveTo(205, -90, 210, 10, 170, 70); g.lineTo(110, 40); g.lineTo(96, -120); g.closePath(); g.fill();
    // the head: skull, brow, nose, lips, chin, jaw
    const face = () => {
      g.beginPath();
      g.moveTo(160, -40);
      g.bezierCurveTo(170, -190, 60, -262, -40, -258);
      g.bezierCurveTo(-120, -254, -168, -190, -170, -110);   // forehead
      g.bezierCurveTo(-171, -86, -180, -60, -176, -40);         // brow ridge
      g.bezierCurveTo(-176, -20, -198, 18, -214, 48);           // nose bridge to tip
      g.bezierCurveTo(-222, 62, -206, 74, -186, 72);            // the tip, the nostril's underside
      g.bezierCurveTo(-180, 82, -172, 92, -176, 104);           // the upper lip
      g.bezierCurveTo(-178, 116, -170, 128, -170, 136);         // lips
      g.bezierCurveTo(-176, 150, -166, 170, -160, 186);         // under the lip
      g.bezierCurveTo(-158, 214, -140, 236, -104, 238);         // chin
      g.bezierCurveTo(-40, 238, 40, 200, 92, 140);              // the jaw back to the ear
      g.bezierCurveTo(130, 96, 150, 40, 160, -40);
      g.closePath();
    };
    face(); g.fillStyle = lg(g, -200, -200, 160, 220, [0, L.skinH], [0.5, L.skin], [1, L.skinD]); g.fill();
    g.save(); face(); g.clip();
    g.fillStyle = rg(g, -60, -30, 120, 300, [0, 'rgba(90,45,25,0)'], [1, 'rgba(90,45,25,0.28)']); g.fillRect(-300, -300, 600, 600);
    if (L.stub) { g.fillStyle = `rgba(30,22,18,${0.3 * L.stub})`; g.beginPath(); g.moveTo(-170, 120); g.bezierCurveTo(-150, 240, 40, 220, 100, 130); g.lineTo(60, 90); g.bezierCurveTo(0, 160, -100, 150, -150, 100); g.closePath(); g.fill(); }
    g.restore();
    // his own 500, tucked under the edge of his cap above his ear (in view, never behind the counter; flat, so '500' reads)
    if (o.ear500) note(g, 500, 80, -80, 0, 1, { shadow: false, k: 0.7 });
    // ear
    ell(g, 70, -10, 30, 50, 0.12); g.fillStyle = L.skin; g.fill(); ell(g, 72, -8, 15, 30, 0.12); g.fillStyle = L.skinD; g.fill();
    // the nostril, a crease from it
    g.fillStyle = 'rgba(60,30,18,0.55)'; ell(g, -184, 62, 11, 6, 0.3); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.35)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-170, 44); g.quadraticCurveTo(-150, 80, -150, 112); g.stroke();
    // a thin moustache
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(-180, 84); g.quadraticCurveTo(-158, 80, -132, 98); g.quadraticCurveTo(-150, 100, -178, 96); g.closePath(); g.fill();
    // the mouth: the corner turns up with the smile
    g.strokeStyle = '#3c1d18'; g.lineWidth = 6; g.beginPath(); g.moveTo(-174, 122); g.quadraticCurveTo(-150, 126 + 4 * sm, -130 + 4 * sm, 118 - 16 * sm); g.stroke();
    if (sm > 0.4) { g.strokeStyle = 'rgba(90,45,25,0.4)'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-120, 96); g.quadraticCurveTo(-110, 112, -118, 128); g.stroke(); }
    // the mole, on the cheek by the mouth (his left cheek, the one we see)
    g.fillStyle = '#2a1710'; ell(g, -96, 92, 10, 9.5); g.fill();
    // the eye in profile: a wedge, the iris at its front
    const ex = -118, ey = -36, eS = 1.18;
    if (close < 0.9) {
      const op = (1 - close) * (1 + 0.7 * bu);
      const shape = () => { g.beginPath(); g.moveTo(ex - 34, ey + 2); g.quadraticCurveTo(ex - 10, ey - 24 * op, ex + 22, ey - 6 * op); g.quadraticCurveTo(ex + 4, ey + 14 * op, ex - 34, ey + 2); g.closePath(); };
      g.save(); shape(); g.fillStyle = '#fbf7ee'; g.fill(); shape(); g.clip();
      ell(g, ex - 18 + look * 6, ey - 2 + lookY * 5, 13, 15); g.fillStyle = '#26170d'; g.fill(); ell(g, ex - 18 + look * 6, ey - 2 + lookY * 5, 7, 8); g.fillStyle = '#060404'; g.fill();
      ell(g, ex - 22 + look * 6, ey - 8 + lookY * 5, 3.6, 3.6); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill();
      g.restore();
      g.strokeStyle = '#231510'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 34, ey + 2); g.quadraticCurveTo(ex - 10, ey - 24 * op, ex + 22, ey - 6 * op); g.stroke();
    } else { g.strokeStyle = '#231510'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 32, ey); g.quadraticCurveTo(ex - 8, ey + 10, ex + 20, ey - 2); g.stroke(); }
    // the brow: it rises (the raised eyebrow is his only line)
    g.strokeStyle = L.hair; g.lineWidth = L.brow; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ex - 40, ey - 40 - 64 * bu); g.quadraticCurveTo(ex - 6, ey - 62 - 92 * bu, ex + 34, ey - 50 - 40 * bu); g.stroke();
    if (bu > 0.05) { g.strokeStyle = 'rgba(90,45,25,' + (0.4 * bu) + ')'; g.lineWidth = 4; for (const k of [0, 1]) { g.beginPath(); g.moveTo(ex - 30, ey - 108 - 18 * k - 52 * bu); g.quadraticCurveTo(ex, ey - 118 - 18 * k - 66 * bu, ex + 26, ey - 104 - 18 * k - 40 * bu); g.stroke(); } }   // forehead lines
    // the cap: the crown, its seam, the brim's shadow on the brow, the brim forward with some thickness. A raised brow pops it up.
    g.save(); g.translate(5 * bu, -50 * bu); g.rotate(-0.06 * bu);
    g.fillStyle = 'rgba(40,10,6,0.32)'; g.beginPath(); g.moveTo(-176, -96); g.quadraticCurveTo(-60, -70, 140, -110); g.lineTo(140, -140); g.lineTo(-176, -130); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-178, -118); g.bezierCurveTo(-182, -250, -70, -318, 10, -316); g.bezierCurveTo(120, -314, 196, -250, 186, -120); g.quadraticCurveTo(10, -150, -178, -118); g.closePath();
    g.fillStyle = lg(g, -180, -316, 190, -120, [0, '#a32a3a'], [0.55, '#8e2433'], [1, '#5c1520']); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 4; g.beginPath(); g.moveTo(10, -316); g.quadraticCurveTo(-30, -230, -60, -132); g.stroke();
    g.fillStyle = '#5c1520'; ell(g, 20, -310, 14, 8); g.fill();
    g.beginPath(); g.moveTo(-170, -128); g.bezierCurveTo(-230, -132, -300, -118, -318, -100); g.bezierCurveTo(-306, -88, -240, -92, -168, -104); g.closePath(); g.fillStyle = '#4a111b'; g.fill();
    g.strokeStyle = 'rgba(255,190,190,0.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-178, -124); g.bezierCurveTo(-236, -128, -296, -116, -314, -102); g.stroke();
    g.restore();
  }

  // ------------------------------------------------------------------ the cutting chai glass, and steam (reel 20)
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
  function steam(g, x, y, t, a = 0.5) {
    g.strokeStyle = `rgba(255,255,255,${a * 0.5})`; g.lineWidth = 12; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const ph = t * 1.1 + k * 2.1; g.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, px = x + (k - 1) * 34 + Math.sin(ph + u * 5) * 18 * u, py = y - u * 200; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ the money (new, invented): big numerals, our colours, a chai-glass watermark
  const NOTE = {
    500: { w: 300, base: '#7a4fc6', lite: '#c2a6f0', dark: '#3d2075' },
    200: { w: 290, base: '#1d9c8c', lite: '#86ddd0', dark: '#0b554d' },
    50: { w: 280, base: '#d4508c', lite: '#f4aecd', dark: '#7d1f4c' },
    20: { w: 272, base: '#3b7fd6', lite: '#a3c5f2', dark: '#1d4b8c' },
    100: { w: 286, base: '#b8763c', lite: '#e6b483', dark: '#5e3512' },
  };
  const FLAT = 0.74;                                  // a note lying on the counter, as the camera sees it
  // a note centred on (x, y): sq 1 is face-on (held up), FLAT lies on the counter; o.tag draws its owner's edge (the replay)
  function note(g, d, x, y, rot = 0, sq = 1, o = {}) {
    const N = NOTE[d], w = N.w * (o.k ?? 1), h = w / 2.2;
    g.save(); g.translate(x, y); g.rotate(rot);
    if (o.shadow !== false && sq < 0.95) { g.save(); g.scale(1, sq); g.fillStyle = 'rgba(40,20,8,0.28)'; R(g, -w / 2 + 6, -h / 2 + 10 + (o.lift || 0) * 40, w, h, 10); g.fill(); g.restore(); }
    g.translate(0, -(o.lift || 0) * 40); g.scale(1, sq);
    if (o.tag) { g.save(); g.strokeStyle = o.tag; g.lineWidth = 16; g.globalAlpha *= 0.9; R(g, -w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 16); g.stroke(); g.restore(); }
    R(g, -w / 2, -h / 2, w, h, 9); g.fillStyle = lg(g, 0, -h / 2, 0, h / 2, [0, mix(N.base, N.lite, 0.3)], [0.55, N.base], [1, mix(N.base, N.dark, 0.25)]); g.fill();
    g.strokeStyle = rgba(N.dark, 0.5); g.lineWidth = 2.5; g.stroke();
    R(g, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 6); g.strokeStyle = rgba(N.lite, 0.75); g.lineWidth = 2.5; g.stroke();
    // the window and its watermark, small at the right end: a cutting-chai glass with two wisps of steam
    const wx = w * 0.36, rx = h * 0.22, ry = h * 0.27;
    ell(g, wx, 0, rx, ry); g.fillStyle = rgba(N.lite, 0.6); g.fill();
    g.fillStyle = rgba(N.dark, 0.32); g.beginPath(); g.moveTo(wx - rx * 0.42, -ry * 0.2); g.lineTo(wx + rx * 0.42, -ry * 0.2); g.lineTo(wx + rx * 0.3, ry * 0.62); g.lineTo(wx - rx * 0.3, ry * 0.62); g.closePath(); g.fill();
    g.strokeStyle = rgba(N.dark, 0.3); g.lineWidth = 3; g.lineCap = 'round';
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(wx + k * rx * 0.16, -ry * 0.3); g.bezierCurveTo(wx + k * rx * 0.36, -ry * 0.5, wx - k * rx * 0.04, -ry * 0.66, wx + k * rx * 0.2, -ry * 0.86); g.stroke(); }
    // a wavy band at the left end
    g.strokeStyle = rgba(N.dark, 0.22); g.lineWidth = 2;
    for (let j = 0; j < 3; j++) { g.beginPath(); for (let i = 0; i <= 16; i++) { const xx = lerp(-w * 0.46, -w * 0.3, i / 16) + Math.sin(i * 0.9 + j) * 3, yy = lerp(-h * 0.36, h * 0.36, i / 16); i ? g.lineTo(xx + j * 8, yy) : g.moveTo(xx + j * 8, yy); } g.stroke(); }
    // the numerals: big in the middle, small in two corners
    const big = h * 0.64;
    txt(g, String(d), -w * 0.04 + 3, h * 0.25, big, rgba(N.lite, 0.9), { align: 'center' });
    txt(g, String(d), -w * 0.04, h * 0.23, big, N.dark, { align: 'center' });
    txt(g, String(d), -w / 2 + 16, -h / 2 + h * 0.27, h * 0.19, N.dark, {});
    txt(g, String(d), w / 2 - 16, h / 2 - h * 0.1, h * 0.19, N.dark, { align: 'right' });
    g.restore();
  }
  // the 10 coin: gold, the 10 big on it
  function coin(g, x, y, r, sq = 1, o = {}) {
    g.save(); g.translate(x, y);
    if (sq < 0.95 && o.shadow !== false) { g.fillStyle = 'rgba(40,20,8,0.3)'; ell(g, 5, 8, r * 1.02, r * sq * 1.02); g.fill(); }
    g.translate(0, -(o.lift || 0) * 40); g.scale(1, sq);
    if (o.tag) { g.strokeStyle = o.tag; g.lineWidth = 14; ell(g, 0, 0, r + 9, r + 9); g.stroke(); }
    ell(g, 0, 0, r, r); g.fillStyle = rg(g, -r * 0.35, -r * 0.4, r * 0.1, r * 1.2, [0, '#fff0a8'], [0.45, '#e8b632'], [1, '#9a6712']); g.fill();
    g.strokeStyle = '#7d520e'; g.lineWidth = r * 0.08; g.stroke();
    ell(g, 0, 0, r * 0.8, r * 0.8); g.strokeStyle = 'rgba(125,82,14,0.55)'; g.lineWidth = r * 0.05; g.stroke();
    txt(g, '10', 1, r * 0.36, r * 1.02, 'rgba(255,240,190,0.8)', { align: 'center' });
    txt(g, '10', -1, r * 0.33, r * 1.02, '#7d520e', { align: 'center' });
    g.restore();
  }

  // ------------------------------------------------------------------ the steel cash tin, open, on the counter (new)
  function tin(g, x, y, s, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s);
    // the lid, open behind
    g.fillStyle = lg(g, -120, -170, 120, -70, [0, '#e6e9ec'], [0.5, '#aab1b8'], [1, '#7a828a']); g.beginPath(); g.moveTo(-118, -70); g.lineTo(-104, -168); g.lineTo(104, -168); g.lineTo(118, -70); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,66,72,0.6)'; g.lineWidth = 3; g.stroke();
    // inside: compartments with notes standing on end, and coins
    g.fillStyle = '#3a3f45'; g.beginPath(); g.moveTo(-122, -70); g.lineTo(122, -70); g.lineTo(130, -10); g.lineTo(-130, -10); g.closePath(); g.fill();
    const stacks = [[-96, '#3b7fd6'], [-62, '#e0604c'], [-28, '#1d9c8c'], [6, '#7a4fc6']];
    for (const [sx, c] of stacks) for (let i = 0; i < (o.empty ? 1 : 4); i++) { g.fillStyle = mix(c, i % 2 ? '#ffffff' : '#000000', 0.12); g.fillRect(sx + i * 6, -62 + i * 2, 26, 44); }
    for (let i = 0; i < 6; i++) { ell(g, 66 + (i % 3) * 18, -42 + Math.floor(i / 3) * 16, 9, 6); g.fillStyle = i % 2 ? '#e8b632' : '#c9ced4'; g.fill(); }
    if (o.coin) { g.save(); g.translate(84, -40); g.scale(1, 0.62); ell(g, 0, 0, 30, 30); g.fillStyle = '#f0c040'; g.fill(); g.strokeStyle = '#7d520e'; g.lineWidth = 4; g.stroke(); txt(g, '10', 0, 11, 30, '#7d520e', { align: 'center' }); g.restore(); }
    // the front of the tin
    g.fillStyle = lg(g, -130, -10, 130, 70, [0, '#f2f4f6'], [0.35, '#b9c0c7'], [0.7, '#8b939b'], [1, '#d5d9dd']); R(g, -132, -12, 264, 82, 8); g.fill();
    g.strokeStyle = 'rgba(60,66,72,0.55)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(-120, -4, 240, 6);
    g.fillStyle = '#6b737b'; R(g, -16, 22, 32, 18, 4); g.fill();
    g.restore();
  }

  // ------------------------------------------------------------------ hands, as keyed 2D poses (new), drawn the series' way (reel 42's
  // hands: a flat skin, one brown outline, rounded fingers each outlined, no nails or creases). A right hand seen from the back, in
  // units of its length: the wrist at the origin, the fingers along +x, the thumb on −y. A pose sets each finger's reach (a curled
  // finger folds away from us, so it shortens and ends round) and angle, and the thumb's angle and reach. o.left mirrors it.
  const FING = [[0.5, -0.128, 0.4, 0.108], [0.52, -0.042, 0.44, 0.112], [0.51, 0.044, 0.41, 0.106], [0.47, 0.124, 0.32, 0.094]];   // base x, base y, length, width: index … little
  const POSE = {
    flat: { f: [[1, -0.07], [1, -0.02], [1, 0.03], [1, 0.08]], th: [-0.55, 1] },
    rest: { f: [[0.8, -0.04], [0.78, 0], [0.76, 0.04], [0.74, 0.08]], th: [-0.5, 0.9] },
    point: { f: [[1.02, -0.03], [0.4, 0.02], [0.38, 0.05], [0.36, 0.08]], th: [-0.32, 0.78] },
    pinch: { f: [[0.72, 0.16], [0.56, 0.07], [0.5, 0.08], [0.45, 0.1]], th: [0.06, 0.92] },
    fist: { f: [[0.36, 0.01], [0.36, 0.01], [0.35, 0.03], [0.34, 0.05]], th: [-0.28, 0.72] },
    open: { f: [[1, -0.24], [1, -0.08], [1, 0.07], [1, 0.22]], th: [-1.0, 1] },
    hold: { f: [[0.86, 0.02], [0.86, 0.04], [0.8, 0.06], [0.72, 0.09]], th: [0.62, 1.0] },   // a note's edge: the fingers under it, the thumb on top (part 'under', the note, part 'over')
  };
  const LINE = (skin) => mix(skin, '#2a1208', 0.5);
  function hand(g, x, y, ang, s, pose, o = {}) {
    const P = POSE[pose] || POSE.rest, skin = o.skin || MEN.s2.skin, line = LINE(skin), lw = 0.024;
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s * (o.fs ?? 1), o.left ? -s : s); g.lineJoin = 'round'; g.lineCap = 'round';
    const tone = (k) => mix(skin, k > 0 ? '#ffe6cc' : '#3a1d10', Math.abs(k));
    const pill = (x0, y0, a, len, w0, w1, col) => {      // a finger: a tapered capsule from (x0, y0) along a, rounded at the tip
      const c = Math.cos(a), sn = Math.sin(a), nx = -sn, ny = c, x1 = x0 + c * len, y1 = y0 + sn * len;
      g.beginPath(); g.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
      g.arc(x1, y1, w1 / 2, a + PI / 2, a - PI / 2, true); g.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.closePath();
      g.fillStyle = col; g.fill(); g.strokeStyle = line; g.lineWidth = lw; g.stroke();
    };
    const thumb = () => { const [a, fr] = P.th, L = 0.3 * fr; pill(0.12, -0.12, a, L, 0.13, 0.1, tone(-0.04)); };
    if (o.part === 'over') {                                          // a held note's top side: the thumb, and the ball of it on the hand
      g.beginPath(); g.ellipse(0.13, -0.1, 0.12, 0.075, 0.3, 0, TAU); g.fillStyle = tone(-0.02); g.fill(); g.strokeStyle = line; g.lineWidth = lw; g.stroke();
      thumb(); g.restore(); return;
    }
    // the thumb, under the palm's edge
    if (o.part !== 'under') thumb();
    // the palm (the back of the hand)
    g.beginPath(); g.moveTo(-0.02, -0.15); g.bezierCurveTo(0.16, -0.19, 0.38, -0.2, 0.52, -0.17); g.quadraticCurveTo(0.57, 0, 0.5, 0.17); g.bezierCurveTo(0.36, 0.19, 0.16, 0.17, -0.02, 0.14); g.closePath();
    g.fillStyle = lg(g, 0, -0.2, 0.5, 0.2, [0, tone(0.05)], [1, tone(-0.05)]); g.fill(); g.strokeStyle = line; g.lineWidth = lw; g.stroke();
    // the fingers, little finger first so the index sits on top
    for (let i = 3; i >= 0; i--) { const [bx, by, L, wd] = FING[i], [fr, a] = P.f[i]; pill(bx - 0.03, by, a, L * fr, wd, wd * (fr < 0.6 ? 0.98 : 0.86), tone(0.02 - 0.02 * i)); }
    g.restore();
  }
  // an arm, keyed: shoulder S, elbow E, wrist Wr (no IK: a keyed 2D pose, like the hands). The sleeve is filled in the body's own
  // colour and outlined only along its sides, so it grows out of the shoulder with no seam; the forearm is bare and outlined all
  // round. o.short: the thief's short teal sleeve; otherwise the uncle's kurta sleeve, to just above the elbow.
  function arm(g, S, E, Wr, o = {}) {
    const sk = o.skin || MEN.s2.skin, line = LINE(sk);
    const capPath = (p, q, r0, r1) => { const an = Math.atan2(q[1] - p[1], q[0] - p[0]); g.beginPath(); g.arc(p[0], p[1], r0, an + PI / 2, an - PI / 2); g.arc(q[0], q[1], r1, an - PI / 2, an + PI / 2); g.closePath(); };
    const sides = (p, q, r0, r1, col, from = 0.28) => {
      const an = Math.atan2(q[1] - p[1], q[0] - p[0]), nx = -Math.sin(an), ny = Math.cos(an), p0 = [lerp(p[0], q[0], from), lerp(p[1], q[1], from)], rr = lerp(r0, r1, from);
      g.strokeStyle = col; g.lineWidth = 3; g.lineCap = 'round';
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(p0[0] + nx * rr * k, p0[1] + ny * rr * k); g.lineTo(q[0] + nx * r1 * k, q[1] + ny * r1 * k); g.stroke(); }
    };
    const w0 = o.w0 ?? 40, w1 = o.w1 ?? 36, w2 = o.w2 ?? 27;
    // the forearm, bare
    capPath(E, Wr, w1 * 0.92, w2); g.fillStyle = lg(g, E[0], E[1], Wr[0], Wr[1], [0, mix(sk, '#3a1d10', 0.1)], [1, sk]); g.fill(); g.strokeStyle = line; g.lineWidth = 3; g.stroke();
    // the upper arm in its sleeve, down to just above the elbow (the thief's short sleeve stops halfway)
    const cut = o.short ? 0.5 : 0.6, C2 = [lerp(S[0], E[0], cut), lerp(S[1], E[1], cut)];
    if (o.short) { capPath(C2, E, w1 * 1.02, w1 * 0.95); g.fillStyle = mix(sk, '#3a1d10', 0.06); g.fill(); sides(C2, E, w1 * 1.02, w1 * 0.95, line, 0); }
    const sl = o.sleeve || (o.short ? '#2f8f7a' : '#ece7d9'), slEdge = o.short ? 'rgba(15,55,45,0.55)' : 'rgba(110,100,80,0.45)';
    // the upper arm's skin first (under the sleeve), then the sleeve, a fold of shadow on its inner side
    capPath(S, E, w0 * 0.85, w1); g.fillStyle = mix(sk, '#3a1d10', 0.06); g.fill(); sides(S, E, w0 * 0.85, w1, line, cut);
    capPath(S, C2, w0 + 4, w1 + 7); g.fillStyle = lg(g, S[0], S[1], C2[0], C2[1], [0, o.sleeve ? mix(o.sleeve, '#ffffff', 0.15) : o.short ? '#35a088' : '#f4f0e5'], [1, sl]); g.fill();
    { const an = Math.atan2(C2[1] - S[1], C2[0] - S[0]), nx = -Math.sin(an), ny = Math.cos(an), sd = o.foldSide ?? 1; g.strokeStyle = o.short ? 'rgba(10,50,40,0.25)' : 'rgba(120,105,80,0.28)'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(lerp(S[0], C2[0], 0.35) + nx * (w0 - 6) * sd, lerp(S[1], C2[1], 0.35) + ny * (w0 - 6) * sd); g.lineTo(C2[0] + nx * (w1 + 1) * sd, C2[1] + ny * (w1 + 1) * sd); g.stroke(); }
    sides(S, C2, w0 + 4, w1 + 7, slEdge);
    // the cuff
    const an = Math.atan2(E[1] - S[1], E[0] - S[0]), nx = -Math.sin(an), ny = Math.cos(an), rc = w1 + 7;
    g.strokeStyle = slEdge; g.lineWidth = 3; g.beginPath(); g.moveTo(C2[0] + nx * rc, C2[1] + ny * rc); g.quadraticCurveTo(C2[0] + Math.cos(an) * 10, C2[1] + Math.sin(an) * 10, C2[0] - nx * rc, C2[1] - ny * rc); g.stroke();
  }
  // a fan of notes held up face-on: the palm and fingers behind the notes, the thumb across the front of their base (the review:
  // no paddle under the fan). (x, y) is where the notes' bottoms meet; the wrist is 0.29 s under it, the hand pointing up.
  function fanOf(g, ds, x, y, a0, da, k, fistAng, skin, left, s = 190) {
    const up = -PI / 2 + (left ? -0.12 : 0.12), wy = y + 0.29 * s;
    hand(g, x, wy, up, s, 'hold', { skin, left, part: 'under' });
    for (let i = ds.length - 1; i >= 0; i--) { const a = a0 + i * da; g.save(); g.translate(x, y); g.rotate(a); note(g, ds[i], 0, -NOTE[ds[i]].w * k * 0.32, 0, 1, { shadow: false, k }); g.restore(); }
    hand(g, x, wy, up, s, 'hold', { skin, left, part: 'over' });
  }

  // ------------------------------------------------------------------ the stall (new, in reel 20's palette): the back wall
  let BG = null;
  // o.night: closing time (the bulbs carry the light, the shutter half down); o.next: the next stall down the street (its own colours)
  function makeStall(o = {}) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = mulberry32(o.next ? 77 : 49);
    const wall = o.next ? ['#5a3f4e', '#3e2a36', '#26181f'] : ['#6a4a30', '#4a3322', '#2e2016'];
    g.fillStyle = lg(g, 0, 0, 0, 900, [0, wall[0]], [0.6, wall[1]], [1, wall[2]]); g.fillRect(0, 0, W, 980);
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.05 + r() * 0.06) + ')'; g.fillRect(i * 80 + r() * 20, 0, 3, 980); }
    const sy = 470;
    g.fillStyle = o.next ? '#6a4a5a' : '#7a5434'; g.fillRect(0, sy, W, 20); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, sy + 20, W, 10);
    const jars = o.next ? [[60, '#e0b060'], [150, '#b0d070'], [600, '#e08060'], [700, '#d0c0a0'], [960, '#e0b060']] : [[40, '#d9a35a'], [126, '#c9743a'], [560, '#e6c07a'], [646, '#d38a3c'], [732, '#b8b0a6'], [960, '#d9a35a']];
    for (const [jx, col] of jars) { g.fillStyle = 'rgba(235,240,245,0.42)'; R(g, jx, sy - 112, 70, 110, 10); g.fill(); g.fillStyle = col; R(g, jx + 6, sy - 82, 58, 78, 8); g.fill(); g.fillStyle = o.next ? '#2a7a52' : '#cc3333'; R(g, jx + 4, sy - 122, 62, 15, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; R(g, jx + 10, sy - 104, 8, 84, 4); g.fill(); }
    const pk = o.next ? ['#f0c32a', '#e8413a', '#ffffff', '#2fa5d6'] : ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#6cb33f'];
    for (let i = 0; i < 22; i++) { const px = -10 + i * 50, ph = 100 + (i % 3) * 20; g.fillStyle = pk[i % pk.length]; g.fillRect(px, 110, 40, ph); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(px + 6, 110, 6, ph); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(px, 110 + ph - 12, 40, 12); }
    const tarp = o.next ? ['#2f9a4a', '#1f6a34'] : ['#2b6fb3', '#1f4f82'];
    g.fillStyle = lg(g, 0, 0, 0, 120, [0, tarp[0]], [1, tarp[1]]); g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 100); for (let i = 18; i >= 0; i--) g.quadraticCurveTo(i * 60 + 30, 130, i * 60, 104); g.closePath(); g.fill();
    if (o.night) {                                       // the shutter, pulled half down over the tarp
      g.fillStyle = lg(g, 0, 0, 0, 250, [0, '#8a9098'], [1, '#5d636b']); g.fillRect(0, 0, W, 250);
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; for (let y = 12; y < 250; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.fillStyle = '#3d4248'; g.fillRect(0, 244, W, 12); g.fillStyle = '#b9bec4'; R(g, 500, 230, 80, 22, 6); g.fill();
    }
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, o.night ? 270 : 130); g.quadraticCurveTo(540, o.night ? 320 : 180, 1090, o.night ? 270 : 130); g.stroke();
    const glow = o.night ? 1.25 : 0.7;
    for (let i = 0; i < 13; i++) { const u = i / 12, bx = lerp(10, 1070, u), by = (o.night ? 270 : 130) + 50 * Math.sin(u * PI) - 4; g.fillStyle = rg(g, bx, by + 8, 2, 60 * glow, [0, 'rgba(255,214,130,' + (0.7 * glow) + ')'], [1, 'rgba(255,214,130,0)']); g.fillRect(bx - 80, by - 70, 160, 160); g.fillStyle = '#fff2c4'; ell(g, bx, by + 8, 8, 10); g.fill(); }
    R(g, 470, 560, 200, 118, 8); g.fillStyle = '#23302a'; g.fill(); g.strokeStyle = '#8a6a3f'; g.lineWidth = 7; g.stroke();
    txt(g, 'CHAI 10/-', 570, 640, 54, '#f4efe0', { align: 'center' });
    if (!o.next) {
      g.fillStyle = '#2a2a2e'; R(g, 0, 760, 150, 130, 10); g.fill();
      g.fillStyle = '#8f949b'; R(g, 20, 680, 110, 92, 22); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; R(g, 34, 692, 15, 62, 8); g.fill();
      g.strokeStyle = '#6a6e74'; g.lineWidth = 10; g.beginPath(); g.arc(128, 716, 26, -1.3, 1.3); g.stroke();
      if (!o.night) { g.fillStyle = '#ff9a2a'; ell(g, 75, 772, 44, 8); g.fill(); }
    } else {                                             // a big aluminium kettle on the next stall's shelf
      g.fillStyle = '#b9bec4'; R(g, 860, 640, 150, 130, 30); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; R(g, 880, 652, 20, 90, 10); g.fill();
    }
    g.fillStyle = rg(g, 420, 640, 60, 700, [0, 'rgba(255,196,120,0.22)'], [1, 'rgba(255,196,120,0)']); g.fillRect(0, 0, W, 980);
    if (o.night) { g.fillStyle = 'rgba(20,24,60,0.3)'; g.fillRect(0, 0, W, 980); }
    BG = c;
  }

  // the counter, seen steeply from above: its top from the far edge (y CF) to the near (y CN), its right end at x CR, a painted front
  const CF = 960, CN = 1505, CR = 860;
  function counter(g, o = {}) {
    g.fillStyle = lg(g, 0, CF, 0, CN, [0, o.next ? '#9a6a44' : '#a86f3e'], [1, o.next ? '#c4935f' : '#c98f55']); g.beginPath(); g.moveTo(-40, CF); g.lineTo(CR, CF); g.lineTo(CR + 40, CN); g.lineTo(-80, CN); g.closePath(); g.fill();
    const r = mulberry32(7);
    g.save(); g.beginPath(); g.moveTo(-40, CF); g.lineTo(CR, CF); g.lineTo(CR + 40, CN); g.lineTo(-80, CN); g.closePath(); g.clip();
    g.strokeStyle = 'rgba(70,40,18,0.3)'; g.lineWidth = 3;
    for (let i = 1; i < 6; i++) { const u = i / 6, y = lerp(CF, CN, u * (0.8 + 0.2 * u)); g.beginPath(); g.moveTo(-80, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = 'rgba(70,40,18,0.12)'; g.lineWidth = 2;
    for (let i = 0; i < 34; i++) { const y = lerp(CF, CN, r()), x = r() * W; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 60, y + 3, x + 140 + r() * 80, y - 1); g.stroke(); }
    g.restore();
    g.fillStyle = 'rgba(255,230,190,0.35)'; g.fillRect(-40, CF - 4, CR + 40, 6);
    g.fillStyle = '#7e4f28'; g.beginPath(); g.moveTo(CR, CF); g.lineTo(CR + 40, CN); g.lineTo(CR + 40, H); g.lineTo(CR, H); g.closePath(); g.fill();
    g.fillStyle = '#d7a36a'; g.fillRect(-80, CN, CR + 120, 14);
    g.fillStyle = lg(g, 0, CN + 14, 0, H, [0, '#a1682f'], [1, '#6a4120']); g.fillRect(-80, CN + 14, CR + 120, H);
    // the front, painted: a teal panel with a yellow border, a row of dots and a band of diamonds (no words)
    R(g, 40, CN + 60, CR - 60, 300, 14); g.fillStyle = o.next ? '#a8322e' : '#1f6f8f'; g.fill(); g.strokeStyle = o.next ? '#f6efe0' : '#f0c32a'; g.lineWidth = 10; g.stroke();
    for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#e8413a' : '#f0c32a'; ell(g, 70 + i * 66, CN + 92, 10, 10); g.fill(); }
    for (let i = 0; i < 9; i++) { const x = 100 + i * 82, y = CN + 220; g.fillStyle = i % 2 ? (o.next ? '#f0c32a' : '#e8712a') : '#f6efe0'; g.beginPath(); g.moveTo(x, y - 46); g.lineTo(x + 32, y); g.lineTo(x, y + 46); g.lineTo(x - 32, y); g.closePath(); g.fill(); }
    if (o.night) { g.fillStyle = 'rgba(20,24,60,0.32)'; g.fillRect(-80, CF - 6, W + 160, H); }
  }

  // reel 20's makeStreet (archive tag, film/film.js), by name: the dusk sky, the buildings across the road with their water tanks,
  // three invented shop signs over shutters, the wires, the road, the yellow-black kerb, the pavement. Not its stall or near table.
  let STREET = null;
  function makeStreet() {
    if (STREET) return STREET;
    const bg = document.createElement('canvas'); bg.width = W; bg.height = H; let g = bg.getContext('2d');
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
    STREET = bg; return bg;
  }

  // ------------------------------------------------------------------ people
  const UN = { x: 330, y: 600, s: 0.64 };              // the uncle's head, behind the counter, facing us
  // the next stall's chaiwala: an older man, grey at the temples, a heavy grey moustache, a mustard sleeveless sweater over a shirt
  const NEXTMAN = { skin: '#b98460', skinD: '#915f40', skinH: '#d4a27c', hair: '#6f6a66', style: 'recede', must: 'thick', stub: 0, brow: 16, browTilt: 2, jaw: 1.1, ew: 44, eh: 22 };
  // f: the face (head()'s options, plus tongue: the tip out for the thumb-lick); o.dy: a bob; o.night: closing time; o.who: 'next'
  function uncleBody(g, f, o = {}) {
    const nx = o.who === 'next', L = nx ? NEXTMAN : MEN.s2;
    g.save(); g.translate(UN.x + (o.dx || 0), UN.y + (o.dy || 0) * UN.s - (o.shrug || 0) * 14); g.rotate(o.lean || 0); g.scale(UN.s, UN.s);
    const by = 230;
    if (nx) {                                            // a striped shirt and a mustard sweater vest
      g.fillStyle = lg(g, -330, by, 330, by + 600, [0, '#eef1f6'], [1, '#c8cdd6']);
      g.beginPath(); g.moveTo(-370, by + 900); g.lineTo(-370, by + 330); g.bezierCurveTo(-366, by + 210, -250, by + 150, -96, by + 120); g.lineTo(96, by + 120); g.bezierCurveTo(250, by + 150, 366, by + 210, 370, by + 330); g.lineTo(370, by + 900); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(60,90,160,0.35)'; g.lineWidth = 8; for (let x = -340; x < 360; x += 40) { g.beginPath(); g.moveTo(x, by + 160); g.lineTo(x, by + 900); g.stroke(); }
      g.fillStyle = lg(g, -260, by + 200, 260, by + 800, [0, '#d9a53a'], [1, '#b07f22']); g.beginPath(); g.moveTo(-250, by + 900); g.lineTo(-260, by + 300); g.quadraticCurveTo(-120, by + 170, -60, by + 150); g.lineTo(0, by + 420); g.lineTo(60, by + 150); g.quadraticCurveTo(120, by + 170, 260, by + 300); g.lineTo(250, by + 900); g.closePath(); g.fill();
    } else {
      g.fillStyle = lg(g, -330, by, 330, by + 600, [0, '#f6f2e6'], [1, '#d3cdbc']);
      g.beginPath(); g.moveTo(-370, by + 900); g.lineTo(-370, by + 330); g.bezierCurveTo(-366, by + 210, -250, by + 150, -96, by + 120); g.lineTo(96, by + 120); g.bezierCurveTo(250, by + 150, 366, by + 210, 370, by + 330); g.lineTo(370, by + 900); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, by + 140); g.lineTo(0, by + 420); g.stroke();
      g.fillStyle = '#d9582a'; g.beginPath(); g.moveTo(-300, by + 190); g.lineTo(-156, by + 132); g.lineTo(-100, by + 640); g.lineTo(-256, by + 640); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 6; g.beginPath(); for (let k = 0; k < 7; k++) { g.moveTo(-290 + k * 6, by + 220 + k * 62); g.lineTo(-136 + k * 2, by + 220 + k * 62); } g.stroke();
    }
    const nw = 76; g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 150); g.lineTo(-nw - 10, by + 130); g.quadraticCurveTo(0, by + 210, nw + 10, by + 130); g.lineTo(nw, 150); g.closePath(); g.fill();
    g.rotate(f.tilt || 0);
    head(g, L, f);
    if (f.tongue > 0.02) { ell(g, 6, 134, 26 * f.tongue, 15 * f.tongue); g.fillStyle = '#d9707a'; g.fill(); g.strokeStyle = 'rgba(90,20,30,0.5)'; g.lineWidth = 3; g.stroke(); }
    if (nx) { g.save(); g.translate(205, -60); g.rotate(-0.5); R(g, -8, -60, 16, 120, 6); g.fillStyle = '#f0c32a'; g.fill(); g.fillStyle = '#3a2b22'; g.beginPath(); g.moveTo(-8, 60); g.lineTo(8, 60); g.lineTo(0, 80); g.closePath(); g.fill(); g.restore(); }   // a pencil behind his ear
    g.restore();
    if (o.night) { g.save(); g.globalCompositeOperation = 'source-atop'; g.restore(); }
  }
  // the thief, standing at the counter's right end, side-on, facing the uncle: his left cheek (the mole) to us.
  // f.ear500 (the face): his own 500, folded behind his ear; o.sip {up, toast}: the chai glass in his far hand (up 0: at his chest)
  const TH = { x: 790, y: 612, s: 0.62 };
  function thiefBody(g, f, o = {}) {
    g.save(); g.translate(TH.x, TH.y); g.scale(TH.s, TH.s);
    g.fillStyle = lg(g, -160, 300, 420, 1500, [0, '#46b49b'], [0.5, '#2f8f7a'], [1, '#1d6656']);
    g.beginPath(); g.moveTo(-60, 250); g.bezierCurveTo(40, 200, 220, 210, 320, 300); g.bezierCurveTo(420, 420, 460, 900, 470, 2300); g.lineTo(-40, 2300); g.bezierCurveTo(-90, 1400, -160, 600, -60, 250); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 6; for (let i = 0; i < 4; i++) { ell(g, -40 + i * 4, 420 + i * 150, 7, 7); g.stroke(); }
    g.fillStyle = lg(g, -70, 0, 110, 0, [0, MEN.thief.skin], [1, MEN.thief.skinD]); g.beginPath(); g.moveTo(-60, 150); g.lineTo(-70, 290); g.quadraticCurveTo(40, 320, 130, 280); g.lineTo(110, 110); g.closePath(); g.fill();
    g.fillStyle = '#2a8a74'; g.beginPath(); g.moveTo(-84, 270); g.quadraticCurveTo(30, 330, 150, 262); g.lineTo(158, 296); g.quadraticCurveTo(30, 366, -92, 304); g.closePath(); g.fill();
    g.save(); g.rotate(f.tilt || 0); headProfile(g, MEN.thief, f); g.restore();
    // the chai glass in his far hand: up to his lips, then raised to the uncle
    if (o.sip) {
      const u = o.sip.up, tq = o.sip.toast || 0;
      const x = lerp(lerp(-40, -200, u), -300, tq), y = lerp(lerp(420, 150, u), -40, tq), rot = lerp(0, 0.5 * u, 1 - tq) - 0.15 * tq;
      // the far forearm, from his elbow at his side to the hand under the glass
      { const ex = 70, ey = 660, hx = x + 10, hy = y + 70, an = Math.atan2(hy - ey, hx - ex); g.fillStyle = mix(MEN.thief.skin, '#3a1d10', 0.12); g.strokeStyle = LINE(MEN.thief.skin); g.lineWidth = 5;
        g.beginPath(); g.arc(ex, ey, 52, an + PI / 2, an - PI / 2); g.arc(hx, hy, 42, an - PI / 2, an + PI / 2); g.closePath(); g.fill(); g.stroke(); }
      g.save(); g.translate(x, y); g.rotate(rot);
      glass(g, 0, 0, 0.62, 0);
      g.fillStyle = MEN.thief.skin; g.strokeStyle = LINE(MEN.thief.skin); g.lineWidth = 5;
      R(g, -64, 10, 128, 74, 30); g.fill(); g.stroke();                          // his fingers round the glass
      for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-64 + i * 32, 14); g.lineTo(-64 + i * 32, 40); g.stroke(); }
      g.restore();
    }
    g.restore();
  }
  // the thief from behind, walking away (the street): his cap's back and strap, his teal shirt, his arms swinging; the uncle's notes
  // fanned up in his right hand. (x, y): his feet; s: his size; walk: the stride's phase
  function thiefBack(g, x, y, s, walk, o = {}) {
    // walk: the stride's phase (one stride per unit). Legs bend at the knee on the swing; the body bobs twice a stride.
    const ph = walk * PI, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph));
    const sk = MEN.thief.skin, skD = MEN.thief.skinD, ln = LINE(sk);
    g.save(); g.translate(x, y - 14 * bob * s); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
    g.fillStyle = 'rgba(30,20,12,0.22)'; g.beginPath(); g.ellipse(0, 14 + 14 * bob, 190, 28, 0, 0, TAU); g.fill();
    // legs: hip → knee → ankle, the swinging leg's knee bending; trousers dark, shoes black
    const leg = (k) => {
      const a = sw * k, hip = [k * 58, -600], th = 0.32 * a, kn = [hip[0] + Math.sin(th) * 300, hip[1] + Math.cos(th) * 300];
      const bend = Math.max(0, -a) * 0.9, sh = th - bend, an = [kn[0] + Math.sin(sh) * 290, kn[1] + Math.cos(sh) * 290];
      const lim = (p, q, w0, w1) => { const ang = Math.atan2(q[1] - p[1], q[0] - p[0]); g.beginPath(); g.arc(p[0], p[1], w0, ang + PI / 2, ang - PI / 2); g.arc(q[0], q[1], w1, ang - PI / 2, ang + PI / 2); g.closePath(); g.fill(); };
      g.fillStyle = k > 0 ? '#2a2e36' : '#22262d'; lim(hip, kn, 62, 52); lim(kn, an, 50, 42);
      g.fillStyle = '#141414'; g.beginPath(); g.ellipse(an[0], an[1] + 22, 58, 34 - 10 * Math.max(0, -a), 0, 0, TAU); g.fill();
    };
    leg(sw >= 0 ? -1 : 1); leg(sw >= 0 ? 1 : -1);
    // the right arm swings behind his back's edge; skin forearm, teal sleeve
    g.save(); g.translate(188, -1130); g.rotate(sw * 0.34 - 0.08);
    g.fillStyle = sk; g.beginPath(); g.roundRect(-32, 120, 64, 290, 30); g.fill(); g.strokeStyle = ln; g.lineWidth = 6; g.stroke();
    g.beginPath(); g.ellipse(0, 418, 40, 46, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#2f8f7a'; g.beginPath(); g.roundRect(-52, -30, 104, 190, 44); g.fill();
    g.restore();
    // the shirt's back, a seam down the middle, the shoulder blades in shade
    g.fillStyle = lg(g, -220, -1200, 220, -520, [0, '#43b29a'], [0.6, '#2f8f7a'], [1, '#226e5e']);
    g.beginPath(); g.moveTo(-205, -540); g.bezierCurveTo(-225, -800, -235, -1060, -200, -1160); g.quadraticCurveTo(-150, -1225, -80, -1238); g.lineTo(80, -1238); g.quadraticCurveTo(150, -1225, 200, -1160); g.bezierCurveTo(235, -1060, 225, -800, 205, -540); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, -1230); g.lineTo(0, -560); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.1)'; g.lineWidth = 14; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 70, -1150); g.quadraticCurveTo(k * 120, -1020, k * 80, -930); g.stroke(); }
    g.fillStyle = '#1f2228'; g.fillRect(-206, -560, 412, 40);                                                   // the belt line
    // the left arm, raised: shoulder, elbow, the wrist under the fan; the uncle's notes fanned up in his hand, beside his head
    { const S = [-182, -1150], E = [-300, -1250], Wr = [-360, -1420];
      const lim = (p, q, w0, w1, fill) => { const ang = Math.atan2(q[1] - p[1], q[0] - p[0]); g.beginPath(); g.arc(p[0], p[1], w0, ang + PI / 2, ang - PI / 2); g.arc(q[0], q[1], w1, ang - PI / 2, ang + PI / 2); g.closePath(); g.fillStyle = fill; g.fill(); };
      lim(E, Wr, 34, 28, sk); g.strokeStyle = ln; g.lineWidth = 6; g.stroke(); lim(S, E, 50, 40, '#2f8f7a');
      if (o.fan) fanOf(g, ['200', '200', '50', '20', '20'], Wr[0], Wr[1] - 55, -0.49, 0.26, 1.05, 0, sk, true); }
    // neck, the back of his head, the nape's hair, ears, the cap from behind with its strap
    g.fillStyle = skD; g.beginPath(); g.roundRect(-50, -1340, 100, 130, 34); g.fill();                           // the neck
    if (o.ear500) { g.save(); g.translate(-168, -1494); g.rotate(0.18); note(g, 500, 0, 0, 0, 1, { shadow: false, k: 0.42 }); g.restore(); }   // his 500, above his left ear
    for (const k of [-1, 1]) { g.fillStyle = sk; g.beginPath(); g.ellipse(k * 124, -1450, 22, 40, k * 0.1, 0, TAU); g.fill(); }   // ears
    g.fillStyle = '#1a130e'; g.beginPath(); g.ellipse(0, -1455, 120, 140, 0, 0, TAU); g.fill();                  // the back of his head: hair, under the cap
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.ellipse(-30, -1480, 60, 90, -0.2, 0, TAU); g.fill();
    g.fillStyle = skD; g.beginPath(); g.moveTo(-58, -1338); g.quadraticCurveTo(0, -1316, 58, -1338); g.lineTo(52, -1310); g.lineTo(-52, -1310); g.closePath(); g.fill();   // skin at the nape
    g.fillStyle = lg(g, -136, -1620, 136, -1460, [0, '#a32a3a'], [1, '#5c1520']);
    g.beginPath(); g.moveTo(-136, -1478); g.bezierCurveTo(-140, -1612, -62, -1654, 0, -1654); g.bezierCurveTo(62, -1654, 140, -1612, 136, -1478); g.quadraticCurveTo(0, -1505, -136, -1478); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -1654); g.lineTo(0, -1500); g.stroke();
    g.fillStyle = '#d9c9a0'; g.beginPath(); g.roundRect(-42, -1514, 84, 32, 8); g.fill(); g.fillStyle = '#4a111b'; g.beginPath(); g.roundRect(-34, -1508, 68, 20, 6); g.fill();
    g.fillStyle = '#5c1520'; g.beginPath(); g.ellipse(0, -1650, 15, 8, 0, 0, TAU); g.fill();
    g.restore();
  }
  // an open palm turned up (catching, or waiting to be paid): the heel at (x, y), the fingers up and out; drawn the series' way
  function palmUp(g, x, y, s, skin) {
    const line = LINE(skin), light = mix(skin, '#ffe6cc', 0.28);
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = 5; g.strokeStyle = line;
    g.fillStyle = mix(skin, '#3a1d10', 0.08); g.beginPath(); g.roundRect(-46, 30, 92, 280, 40); g.fill(); g.stroke();      // the wrist and forearm
    const pill = (x0, y0, a, len, w0, w1) => { const c = Math.cos(a), sn = Math.sin(a), nx = -sn, ny = c, x1 = x0 + c * len, y1 = y0 + sn * len; g.beginPath(); g.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); g.arc(x1, y1, w1 / 2, a + PI / 2, a - PI / 2, true); g.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.closePath(); g.fillStyle = light; g.fill(); g.stroke(); };
    for (const [fx, a, L, w] of [[46, -1.25, 92, 34], [16, -1.48, 112, 37], [-14, -1.66, 108, 36], [-42, -1.86, 86, 32]]) pill(fx, -50, a, L, w, w * 0.86);
    g.beginPath(); g.moveTo(-74, 34); g.quadraticCurveTo(-86, -40, -54, -62); g.lineTo(62, -62); g.quadraticCurveTo(92, -30, 74, 34); g.quadraticCurveTo(0, 62, -74, 34); g.closePath(); g.fillStyle = light; g.fill(); g.stroke();
    pill(-66, 10, -2.45, 82, 38, 32);                                                                                     // the thumb
    g.strokeStyle = 'rgba(120,60,40,0.3)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-44, -10); g.quadraticCurveTo(0, 10, 50, -18); g.stroke();
    g.restore();
  }

  window.DRAW = { TAU, PI, sstep, font, txt, R, ell, lg, rg, hex, mix, rgba, mouth, eye, MEN, head, headProfile, glass, steam, NOTE, FLAT, note, coin, tin,
    FING, POSE, LINE, hand, arm, fanOf, makeStall, makeStreet, counter, CF, CN, CR, UN, NEXTMAN, uncleBody, TH, thiefBody, thiefBack, palmUp, stallBG: () => BG, setBG: (c) => { BG = c; } };
})();
