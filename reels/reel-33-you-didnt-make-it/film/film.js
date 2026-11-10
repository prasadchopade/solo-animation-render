// Reel 33 · You Didn't Make It (working title). A second-slot pilot, not an episode of "You're the test subject".
// You're the camera. Your brother is drowning in a concrete canal, you can swim, and there are two buttons: jump in, or call for help.
// Call: help's minutes away. You go home without him. Jump: he climbs you, you fight him to the wall and push him up, and there's nobody left to push you.
// He made it. You didn't. There was a third button: the empty bottle in your hand since the first second. You dropped it, or it was in your other hand.
// Give him anything but you. Facts: docs/research.md. Our own drawings; nobody real. 30 fps, no motion blur.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit, words, tb, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#10202a', RED = '#e8321c', CREAM = '#fff8e8', YEL = '#ffd23f';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const at = (p) => words(p)[0].t0, en = (p) => { const w = words(p); return w[w.length - 1].t1; }, wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;

  // ------------------------------------------------------------------ canvas helpers
  const font = (size, kind = 'cond') => (kind === 'cond' ? `700 condensed ${size}px Bahn` : kind === 'semi' ? `700 semi-condensed ${size}px Bahn` : `700 ${size}px Mono`);
  function txt(g, s, x, y, size, color = INK, o = {}) {
    g.save();
    g.font = font(size, o.kind || 'cond'); g.fillStyle = color; g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic';
    g.globalAlpha *= o.a ?? 1;
    if ('letterSpacing' in g) g.letterSpacing = (o.ls ?? 0) + 'px';
    if (o.fit) { const w = g.measureText(s).width; if (w > o.fit) { size *= o.fit / w; g.font = font(size, o.kind || 'cond'); } }
    if (o.stroke) { g.lineJoin = 'round'; g.strokeStyle = o.stroke; g.lineWidth = size * (o.sw ?? 0.12); g.strokeText(s, x, y); }
    g.fillText(s, x, y);
    g.restore();
  }
  const R = (g, x, y, w, h, r = 0) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
  const lg = (g, x0, y0, x1, y1, ...stops) => { const q = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const rg = (g, x, y, r0, r1, ...stops) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const offscreen = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const hash = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
  const pop = (t, t0) => clamp(hit(t, t0, 'heavy'));
  function title(g, s, y, size, color, t, t0, o = {}) {            // a caption that lands with a small spring
    if (t < t0) return;
    const q = pop(t, t0), sc = lerp(o.from ?? 0.84, 1, q);
    g.save(); g.translate(o.x ?? 513, y); g.scale(sc, sc);
    txt(g, s, 0, 0, size, color, { align: 'center', fit: o.fit ?? 860, stroke: o.stroke ?? INK, sw: o.sw ?? 0.13, a: clamp((t - t0) * 9) * (o.a ?? 1) });
    g.restore();
  }

  let NOFX = false;                                         // true while the film runs backwards: no flashes
  // ------------------------------------------------------------------ the brother: a thin teenager. One face throughout; his skin never changes with the light.
  const BRO = { skin: '#b78259', skinD: '#8d5c3d', skinH: '#d3a077', hair: '#120e0b', jaw: 0.93, ew: 52, eh: 31, brow: 13, browTilt: 5 };
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
    const w = o.ew ?? 45, h = o.eh ?? 25, look = o.look || [0, 0], lid = o.lidC || '#231510', dead = o.dead || 0;
    if (close < 0.92) {
      const up = h * 1.75 * (1 - close), dn = h * 1.05 * (1 - close * 0.72);
      const shape = () => { g.beginPath(); g.moveTo(cx - w, cy + 3); g.quadraticCurveTo(cx - side * 6, cy - up, cx + w, cy + 3); g.quadraticCurveTo(cx + side * 6, cy + dn, cx - w, cy + 3); g.closePath(); };
      g.save(); shape(); g.fillStyle = '#fbf7ee'; g.fill(); shape(); g.clip();
      const ix = cx + look[0], iy = cy - 3 + look[1], ir = (o.ir ?? 19) * lerp(1, 0.86, dead);
      ell(g, ix, iy, ir, ir); g.fillStyle = rg(g, ix, iy, 2, ir, [0, '#4f3421'], [1, '#26170d']); g.fill();
      ell(g, ix, iy, ir * lerp(0.52, 0.34, dead), ir * lerp(0.52, 0.34, dead)); g.fillStyle = '#060404'; g.fill();
      if (dead < 0.5) { ell(g, ix - 6, iy - 7, 5.2, 5.2); g.fillStyle = 'rgba(255,255,255,0.95)'; g.fill(); }
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
    const P0 = [k * (ex - 50), ey - 44 + tilt + by0], P1 = [k * (ex + 6), ey - 66 + by0], P2 = [k * (ex + 56), ey - 44 - tilt * 0.3 + by0 * 0.4];
    g.beginPath(); g.moveTo(P0[0], P0[1]); g.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); g.stroke();
  }
  function head(g, o = {}) {
    const L = BRO, op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw, drop = 104 * op, chin = 232 + drop, ey = -28, ex = 82;
    for (const k of [-1, 1]) { ell(g, k * (hw + 1), -18, 25, 42, k * 0.08); g.fillStyle = L.skin; g.fill(); ell(g, k * (hw + 3), -16, 12, 24, k * 0.08); g.fillStyle = L.skinD; g.fill(); }
    const path = () => {
      g.beginPath(); g.moveTo(-hw, -40);
      g.bezierCurveTo(-hw - 4, -216, -100, -266, 0, -266); g.bezierCurveTo(100, -266, hw + 4, -216, hw, -40);
      g.bezierCurveTo(hw + 4, 58, 142 - 16 * op, 150 + 44 * op, 80 - 6 * op, 205 + 82 * op);
      g.bezierCurveTo(56, chin - 4, 26, chin, 0, chin); g.bezierCurveTo(-26, chin, -56, chin - 4, -80 + 6 * op, 205 + 82 * op);
      g.bezierCurveTo(-142 + 16 * op, 150 + 44 * op, -hw - 4, 58, -hw, -40); g.closePath();
    };
    path(); g.fillStyle = lg(g, -hw, -200, hw, 240, [0, L.skinH], [0.45, L.skin], [1, L.skinD]); g.fill();
    g.save(); path(); g.clip();
    g.fillStyle = rg(g, 0, -40, 150, 330, [0, 'rgba(90,45,25,0)'], [1, 'rgba(90,45,25,0.3)']); g.fillRect(-300, -300, 600, 700);
    g.restore();
    const my = 118 + drop * 0.2;
    if (o.grin > 0) {
      const w = lerp(50, 92, o.grin), u = 10 + 44 * o.grin;
      g.beginPath(); g.moveTo(-w, my - 16); g.quadraticCurveTo(0, my + u * 1.7, w, my - 16); g.quadraticCurveTo(0, my + 2, -w, my - 16); g.closePath(); g.fillStyle = '#fbf7ee'; g.fill(); g.strokeStyle = '#5a2b20'; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke();
    } else mouth(g, my, op, { lip: '#83503f', w0: o.w0 ?? 40, frown: o.frown ?? 0, smile: o.smile ?? 0 });
    const ny = 44;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 34, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 20, ny - 18); g.quadraticCurveTo(k * 29, ny, k * 23, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, k * 12, ny + 9, 7.5, 4.3, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.14)'; ell(g, -5, ny - 8, 10, 15); g.fill();
    const eo = { ew: L.ew, eh: L.eh, ir: 20, look: o.look, dead: o.dead || 0 };
    eye(g, -1, -ex, ey, close, eo); eye(g, 1, ex, ey, close, eo);
    g.strokeStyle = L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt - (o.worry || 0);       // worry raises the inner ends: pleading, not angry
    browLine(g, -1, ex, ey, tilt, by0); browLine(g, 1, ex, ey, tilt, by0);
    const hh = hw + 7;
    if (o.dry) {                                            // dry: soft and full, a boy who's been home for hours
      g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hh, -44); g.bezierCurveTo(-hh - 26, -268, -112, -338, 14, -332); g.bezierCurveTo(152, -332, hh + 28, -252, hh, -44);
      g.bezierCurveTo(hh - 20, -124, 150, -176, 102, -192); g.bezierCurveTo(36, -212, -30, -192, -94, -208); g.bezierCurveTo(-142, -176, -hh + 24, -124, -hh, -44); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,100,90,0.32)'; g.lineWidth = 5; g.lineCap = 'round'; for (const [a, b, c, d] of [[-110, -262, -40, -300], [-20, -292, 60, -290], [90, -262, 138, -214]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2, Math.min(b, d) - 16, c, d); g.stroke(); }
      return;
    }
    // wet hair: a cap, and clumps stuck down over the forehead
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(-hh, -30);
    g.bezierCurveTo(-hh - 14, -250, -100, -312, 8, -304); g.bezierCurveTo(130, -304, hh + 16, -236, hh, -30);
    const front = [[hh - 12, -118], [hh - 40, -92], [hh - 62, -172], [98, -98], [66, -186], [34, -88], [-4, -190], [-40, -92], [-74, -182], [-112, -102], [-hh + 62, -170], [-hh + 34, -96], [-hh + 12, -120]];
    let px = hh, py = -30;
    for (const [x, y] of front) { g.quadraticCurveTo((px + x) / 2, (py + y) / 2 - 8, x, y); px = x; py = y; }
    g.quadraticCurveTo(-hh + 2, -80, -hh, -30); g.closePath(); g.fill(); g.strokeStyle = L.hair; g.lineWidth = 11; g.lineJoin = 'round'; g.stroke();
    g.strokeStyle = 'rgba(190,220,235,0.34)'; g.lineWidth = 6; g.lineCap = 'round';
    for (const [x0, y0, x1, y1] of [[-120, -252, -60, -196], [-40, -282, -8, -212], [60, -280, 76, -216], [132, -232, 118, -176]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 12, (y0 + y1) / 2 - 12, x1, y1); g.stroke(); }
    const t = o.t ?? 0;
    for (let i = 0; i < 9; i++) {
      const x = (hash(i, 1) - 0.5) * 2 * hw * 0.84, sp = 60 + hash(i, 2) * 90, y = -170 + (((t + hash(i, 3) * 7) * sp) % 390), r = 3.5 + hash(i, 4) * 4;
      g.fillStyle = 'rgba(232,248,255,0.8)'; ell(g, x, y, r * 0.8, r * 1.5); g.fill();
    }
  }
  function bro(g, x, y, s, o = {}) {                        // chest up
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.roll || 0);
    const by = 168;
    g.fillStyle = lg(g, -300, by, 300, by + 500, [0, '#ffcf3a'], [1, '#e9a31a']);
    const shirt = () => { g.beginPath(); g.moveTo(-360, by + 1100); g.lineTo(-360, by + 420); g.bezierCurveTo(-360, by + 170, -230, by + 120, -84, by + 86); g.lineTo(84, by + 86); g.bezierCurveTo(230, by + 120, 360, by + 170, 360, by + 420); g.lineTo(360, by + 1100); g.closePath(); };
    shirt(); g.fill();
    if (!o.dry) { g.save(); shirt(); g.clip(); g.fillStyle = 'rgba(160,100,10,0.22)'; g.fillRect(-360, by + 300, 720, 800); g.restore(); }
    const nw = 58;
    g.fillStyle = lg(g, -70, 0, 70, 0, [0, BRO.skinD], [0.55, BRO.skin], [1, BRO.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 8, by + 96); g.quadraticCurveTo(0, by + 176, nw + 8, by + 96); g.lineTo(nw, 120); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,35,20,0.28)'; g.beginPath(); g.moveTo(-nw, 150); g.quadraticCurveTo(0, 235, nw, 150); g.lineTo(nw, 120); g.lineTo(-nw, 120); g.closePath(); g.fill();
    if (o.towel) { g.fillStyle = lg(g, -200, by + 60, 200, by + 200, [0, '#fbfaf3'], [1, '#d9d5c6']); g.beginPath(); g.moveTo(-220, by + 180); g.bezierCurveTo(-170, by + 70, -74, by + 62, -60, by + 80); g.quadraticCurveTo(0, by + 150, 60, by + 80); g.bezierCurveTo(74, by + 62, 170, by + 70, 220, by + 180); g.quadraticCurveTo(150, by + 260, 92, by + 460); g.lineTo(30, by + 440); g.quadraticCurveTo(10, by + 250, 0, by + 196); g.quadraticCurveTo(-10, by + 250, -30, by + 440); g.lineTo(-92, by + 460); g.quadraticCurveTo(-150, by + 260, -220, by + 180); g.closePath(); g.fill(); g.strokeStyle = 'rgba(120,110,90,0.3)'; g.lineWidth = 4; g.stroke(); }
    head(g, o);
    g.restore();
  }
  function limb(g, x0, y0, x1, y1, x2, y2, w, col = BRO.skin, colD = BRO.skinD) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = colD; g.lineWidth = w + 7; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, x2, y2); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, x2, y2); g.stroke();
  }
  function palm(g, x, y, s, rot, o = {}) {                 // an open hand; +y is the fingers' way
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    const col = o.col || BRO.skin, colD = o.colD || BRO.skinD;
    g.lineCap = 'round';
    const fingers = [[-60, -6, -82, 118, 30], [-22, 8, -30, 150, 32], [18, 8, 24, 152, 32], [58, -2, 76, 126, 29]];
    for (const [a, b, c, d, w] of fingers) { g.strokeStyle = colD; g.lineWidth = w + 6; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    g.strokeStyle = colD; g.lineWidth = 38; g.beginPath(); g.moveTo(84, -44); g.lineTo(138, 26); g.stroke(); g.strokeStyle = col; g.lineWidth = 32; g.beginPath(); g.moveTo(84, -44); g.lineTo(138, 26); g.stroke();
    R(g, -86, -92, 176, 112, 46); g.fillStyle = colD; g.fill(); R(g, -82, -88, 168, 104, 42); g.fillStyle = col; g.fill();
    g.strokeStyle = 'rgba(70,35,20,0.3)'; g.lineWidth = 4; for (const [a, b] of [[-40, 14], [0, 18], [40, 14]]) { g.beginPath(); g.moveTo(a, b - 12); g.lineTo(a, b + 8); g.stroke(); }
    g.restore();
  }

  // ------------------------------------------------------------------ you: an arm with a red thread on the wrist, the bottle, the phone
  const ME = { col: '#ba8560', colD: '#8e5e3f' };
  function bottle(g, x, y, s, rot, o = {}) {                // a big empty clear 5-litre water bottle with a moulded handle. No label. Origin: its middle.
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    const body = () => { g.beginPath(); g.moveTo(-40, -220); g.bezierCurveTo(-46, -180, -128, -176, -130, -112); g.lineTo(-132, 196); g.bezierCurveTo(-132, 236, -100, 246, -70, 246); g.lineTo(70, 246); g.bezierCurveTo(100, 246, 132, 236, 132, 196); g.lineTo(130, -112); g.bezierCurveTo(128, -176, 46, -180, 40, -220); g.closePath(); };
    g.globalAlpha *= o.a ?? 1;
    body(); g.fillStyle = 'rgba(214,240,250,0.5)'; g.fill();
    g.save(); body(); g.clip();
    g.fillStyle = lg(g, -132, 0, 132, 0, [0, 'rgba(255,255,255,0.65)'], [0.22, 'rgba(255,255,255,0.1)'], [0.7, 'rgba(120,190,215,0.16)'], [1, 'rgba(70,140,175,0.34)']); g.fillRect(-140, -230, 280, 480);
    g.strokeStyle = 'rgba(70,130,160,0.34)'; g.lineWidth = 6; for (const y2 of [-60, 20, 100, 180]) { g.beginPath(); g.moveTo(-140, y2); g.quadraticCurveTo(0, y2 + 14, 140, y2); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.7)'; R(g, -100, -120, 22, 270, 11); g.fill();
    g.restore();
    body(); g.strokeStyle = o.line || '#5b8ea6'; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke();
    g.strokeStyle = o.line || '#5b8ea6'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(-108, -142); g.bezierCurveTo(-190, -150, -196, -30, -130, -26); g.stroke();
    g.strokeStyle = 'rgba(226,245,252,0.92)'; g.lineWidth = 15; g.beginPath(); g.moveTo(-108, -142); g.bezierCurveTo(-190, -150, -196, -30, -130, -26); g.stroke();
    R(g, -40, -238, 80, 30, 6); g.fillStyle = 'rgba(214,240,250,0.8)'; g.fill(); g.strokeStyle = '#5b8ea6'; g.lineWidth = 5; g.stroke();
    R(g, -52, -290, 104, 56, 10); g.fillStyle = lg(g, -52, 0, 52, 0, [0, '#3c82d8'], [0.5, '#2a66bb'], [1, '#1b4a94']); g.fill(); g.strokeStyle = 'rgba(12,40,90,0.7)'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 3; for (let i = -40; i <= 40; i += 16) { g.beginPath(); g.moveTo(i, -284); g.lineTo(i, -240); g.stroke(); }
    g.restore();
  }
  function myArm(g, x0, y0, x1, y1, w = 96) {
    limb(g, x0, y0, (x0 + x1) / 2, (y0 + y1) / 2, x1, y1, w, ME.col, ME.colD);
    const a = Math.atan2(y1 - y0, x1 - x0), nx = Math.cos(a), ny = Math.sin(a), px = -ny, py = nx, q = 34;
    const tx = x1 - nx * q, ty = y1 - ny * q;
    g.strokeStyle = '#d0242a'; g.lineWidth = 9; g.lineCap = 'butt'; g.beginPath(); g.moveTo(tx - px * w * 0.52, ty - py * w * 0.52); g.lineTo(tx + px * w * 0.52, ty + py * w * 0.52); g.stroke();
    g.strokeStyle = '#f4d24a'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx - px * w * 0.52, ty - py * w * 0.52); g.lineTo(tx + px * w * 0.52, ty + py * w * 0.52); g.stroke();
  }
  function fist(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    R(g, -74, -66, 150, 132, 54); g.fillStyle = ME.colD; g.fill(); R(g, -70, -62, 142, 124, 50); g.fillStyle = ME.col; g.fill();
    g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const y0 = -44 + i * 32; g.strokeStyle = ME.colD; g.lineWidth = 34; g.beginPath(); g.moveTo(-34, y0); g.lineTo(70, y0); g.stroke(); g.strokeStyle = ME.col; g.lineWidth = 28; g.beginPath(); g.moveTo(-34, y0); g.lineTo(70, y0); g.stroke(); }
    g.strokeStyle = ME.colD; g.lineWidth = 42; g.beginPath(); g.moveTo(-64, 14); g.lineTo(18, -34); g.stroke(); g.strokeStyle = ME.col; g.lineWidth = 35; g.beginPath(); g.moveTo(-64, 14); g.lineTo(18, -34); g.stroke();
    g.restore();
  }
  const FX0 = 128, FY0 = 1252, BS = 0.74;                   // where your fist is on the first frame; the bottle's scale
  function handAndBottle(g, t, o = {}) {
    const dx = o.dx || 0, dy = o.dy || 0, sw = Math.sin(t * 1.3) * 3, BX = FX0 + 95 + dx, BY = FY0 + 130 + dy + sw, rot = (o.rot ?? 0.04);
    myArm(g, FX0 - 210 + dx, FY0 + 900 + dy, FX0 - 28 + dx, FY0 + 70 + dy + sw, 104);
    if (!o.noBottle) bottle(g, BX, BY, BS, rot);
    fist(g, FX0 + dx, FY0 + 22 + dy + sw, 0.82, -0.25);
  }
  function phone(g, x, y, s, rot, secs = 0) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    R(g, -112, -226, 224, 452, 36); g.fillStyle = '#12161b'; g.fill();
    R(g, -100, -212, 200, 424, 26); g.fillStyle = lg(g, 0, -212, 0, 212, [0, '#1d8a63'], [1, '#0f5240']); g.fill();
    txt(g, '112', 0, -60, 108, CREAM, { align: 'center' });
    const m = Math.floor(secs / 60), sc = Math.floor(secs % 60);
    txt(g, secs >= 1 ? 'CONNECTED' : 'CALLING', 0, -8, 38, '#c9f0df', { align: 'center', kind: 'semi' });
    txt(g, `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`, 0, 60, 58, CREAM, { align: 'center', kind: 'semi' });
    if (secs >= 1) txt(g, 'HELP IS COMING', 0, 98, 26, '#c9f0df', { align: 'center', kind: 'semi' });
    ell(g, 0, 142, 42, 42); g.fillStyle = RED; g.fill();
    g.restore();
  }
  function phoneHand(g, x, y, rot = 0.1, s = 0.92, secs = 0) {
    const w = 104 * Math.pow(s / 0.92, 0.55), sq = s / 0.92;
    myArm(g, x + 150 * sq + 130, y + 1400, x + 30 * sq, y + 210 * sq, w);
    phone(g, x, y, s, rot, secs);
    // fingers round the phone's left edge, low down, clear of the numbers; thumb up its right side
    const fy = 110 * s, fw = 30 * sq, step = 44 * sq;
    g.lineCap = 'round'; g.strokeStyle = ME.colD; g.lineWidth = fw + 6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - 124 * s, y + fy + i * step); g.lineTo(x - 90 * s, y + fy + 2 + i * step); g.stroke(); }
    g.strokeStyle = ME.col; g.lineWidth = fw; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - 124 * s, y + fy + i * step); g.lineTo(x - 90 * s, y + fy + 2 + i * step); g.stroke(); }
    g.strokeStyle = ME.colD; g.lineWidth = 42 * sq; g.beginPath(); g.moveTo(x + 124 * s, y + 230 * s); g.lineTo(x + 112 * s, y + 90 * s); g.stroke(); g.strokeStyle = ME.col; g.lineWidth = 35 * sq; g.beginPath(); g.moveTo(x + 124 * s, y + 230 * s); g.lineTo(x + 112 * s, y + 90 * s); g.stroke();
  }

  // ------------------------------------------------------------------ the canal
  let FAR = null;
  function makeFar() {                                     // the far bank seen across the canal, painted once
    const c = offscreen(1500, 760), g = c.getContext('2d'), r = mulberry32(33);
    g.fillStyle = lg(g, 0, 0, 0, 600, [0, '#4cb7f0'], [0.62, '#9fe0fa'], [1, '#dcf5fa']); g.fillRect(0, 0, 1500, 620);
    const cloud = (x, y, s) => { g.fillStyle = 'rgba(255,255,255,0.94)'; for (const [a, b, q] of [[-90, 8, 52], [-34, -14, 72], [34, -4, 62], [92, 10, 46], [0, 18, 70]]) { ell(g, x + a * s, y + b * s, q * s, q * s * 0.78); g.fill(); } };
    cloud(250, 170, 1.25); cloud(1120, 140, 1.3); cloud(760, 270, 0.8);
    for (let i = 0; i < 34; i++) { const x = i * 46 + r() * 26, q = 54 + r() * 44; g.fillStyle = ['#4aa563', '#3f9a5b', '#57b26a'][i % 3]; ell(g, x, 470 - r() * 34, q, q * 0.9); g.fill(); }
    const house = (x, w, h, col, roof) => { g.fillStyle = col; g.fillRect(x, 516 - h, w, h); g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(x + w * 0.62, 516 - h, w * 0.38, h); g.fillStyle = roof; g.fillRect(x - 6, 516 - h - 10, w + 12, 12); g.fillStyle = '#2d3a44'; for (let i = 0; i < 2; i++) g.fillRect(x + 14 + i * w * 0.42, 516 - h + 24, w * 0.22, h * 0.34); };
    house(180, 150, 104, '#f4a9b8', '#e3e0d4'); house(344, 118, 130, '#9fd5ee', '#e6e2d6'); house(1020, 170, 118, '#f6d27a', '#e3e0d4');
    g.fillStyle = '#20262b'; R(g, 366, 346, 54, 46, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(372, 352, 8, 36);       // a black water tank
    for (let i = 0; i < 16; i++) { const x = i * 96 + r() * 44, q = 62 + r() * 46; g.fillStyle = ['#2f8a4c', '#39985a', '#2a7f47'][i % 3]; ell(g, x, 508 - r() * 16, q, q * 0.62); g.fill(); }
    g.fillStyle = lg(g, 0, 496, 0, 536, [0, '#7cc65c'], [1, '#5fae4b']); g.fillRect(0, 496, 1500, 42);
    g.fillStyle = lg(g, 0, 536, 0, 640, [0, '#e8dfc8'], [0.74, '#d3c8ad'], [1, '#8f9a88']); g.fillRect(0, 536, 1500, 106);
    g.strokeStyle = 'rgba(110,100,80,0.28)'; g.lineWidth = 3; for (let x = -40; x < 1500; x += 150) { g.beginPath(); g.moveTo(x + 20, 536); g.lineTo(x, 640); g.stroke(); }
    return c;
  }
  const wave = (x, t, a = 1) => a * (9 * Math.sin(x * 0.011 + t * 1.7) + 6 * Math.sin(x * 0.023 - t * 2.3 + 1.2) + 3.5 * Math.sin(x * 0.051 + t * 3.1 + 2.1));
  function ripples(g, y0, y1, t, o = {}) {
    const n = o.n ?? 26, rows = o.rows ?? 26;
    g.lineCap = 'round';
    for (let j = 0; j < rows; j++) {
      const u = j / (rows - 1), y = lerp(y0, y1, Math.pow(u, 1.55)), L = lerp(30, 170, u), lw = lerp(2.2, 7, u);
      for (let i = 0; i < n; i++) {
        const h = hash(i, j + 7), v = 18 + h * 40, x = ((h * 1700 + t * v * (j % 2 ? 1 : -1)) % 1500 + 1500) % 1500 - 200, yy = y + Math.sin(x * 0.02 + t * 2 + j) * lerp(1, 5, u), tw = 0.5 + 0.5 * Math.sin(t * (1.2 + h * 2) + h * 40);
        g.strokeStyle = i % 3 === 0 ? `rgba(8,90,105,${(o.dark ?? 0.2) * tw})` : `rgba(255,255,255,${(o.light ?? 0.42) * tw})`;
        g.lineWidth = lw; g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + L * 0.5, yy + 3 * Math.sin(h * 9), x + L * (0.6 + h * 0.5), yy); g.stroke();
      }
    }
  }
  function waterBack(g, y0, t, o = {}) {
    g.fillStyle = lg(g, 0, y0, 0, 1920, [0, '#84e2d4'], [0.22, '#3fc4bd'], [0.6, '#18a5a6'], [1, '#0f8e96']); g.fillRect(-300, y0, W + 600, 1920 - y0 + 400);
    ripples(g, y0 + 8, 1900, t, o);
  }
  function frontWater(g, yw, t, o = {}) {
    const a = o.a ?? 0.82, amp = o.amp ?? 1, xs = [];
    for (let x = -300; x <= W + 300; x += 16) xs.push([x, yw + wave(x, t, amp)]);
    g.beginPath(); xs.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineTo(W + 300, 2300); g.lineTo(-300, 2300); g.closePath();
    g.fillStyle = lg(g, 0, yw - 20, 0, yw + 720, [0, `rgba(84,206,196,${a})`], [0.3, `rgba(24,165,166,${a + 0.1})`], [1, `rgba(15,142,150,${Math.min(1, a + 0.16)})`]); g.fill();
    g.beginPath(); xs.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = 'rgba(255,255,255,0.86)'; g.lineWidth = o.lw ?? 8; g.lineJoin = 'round'; g.stroke();
    g.beginPath(); xs.forEach(([x, y], i) => (i ? g.lineTo(x, y + 13) : g.moveTo(x, y + 13))); g.strokeStyle = 'rgba(255,255,255,0.26)'; g.lineWidth = 5; g.stroke();
  }
  function rings(g, x, y, t, o = {}) {
    for (let i = 0; i < 4; i++) {
      const u = ((t * 0.55 + i / 4) % 1), rx = lerp(o.r0 ?? 250, o.r1 ?? 640, u);
      g.strokeStyle = `rgba(255,255,255,${0.42 * (1 - u) * (o.a ?? 1)})`; g.lineWidth = lerp(8, 3, u); ell(g, x, y, rx, rx * 0.17); g.stroke();
    }
  }
  function nearEdge(g, y) {                                 // the top of the concrete wall you're standing on
    g.fillStyle = lg(g, 0, y, 0, y + 400, [0, '#efe5cc'], [1, '#d9cbaa']); g.fillRect(-300, y, W + 600, 700);
    g.fillStyle = 'rgba(90,76,50,0.45)'; g.fillRect(-300, y - 2, W + 600, 9);
    g.fillStyle = '#6f8f7f'; g.fillRect(-300, y - 26, W + 600, 26);
  }
  const HY = 880, WATER0 = 770, FARY = 136;
  function cross(g, t, o = {}) {                            // the view across the canal from the top of the wall
    g.save();
    const z = o.zoom ?? 1, ox = o.ox ?? 540, oy = o.oy ?? 860;
    g.translate(ox, oy); g.scale(z, z); g.translate(-ox + (o.x || 0), -oy + (o.y || 0));
    if (!FAR) FAR = makeFar();
    g.fillStyle = '#4cb7f0'; g.fillRect(-300, -300, W + 600, 600);
    g.drawImage(FAR, -210, FARY);
    waterBack(g, WATER0, t);
    if (!o.noBro) {
      const by = o.broY ?? HY, s = o.broS ?? 1, yw = o.yw ?? (by + 138 * s);
      rings(g, 540, yw, t);
      arms(g, 540, by, s, t, o);
      bro(g, 540, by, s, { t, op: o.op ?? 0.3, look: o.look ?? [0, 3], worry: o.worry ?? 14, browY: o.browY ?? -6, roll: o.roll ?? -0.03, close: o.close ?? 0, dead: o.dead ?? 0, smile: o.smile, grin: o.grin });
      if (o.hug) o.hug(yw, by);
      frontWater(g, yw, t, { a: 0.8 });
      if (o.over) o.over(yw, by);
    }
    if (o.edge !== false) nearEdge(g, 1560);
    g.restore();
  }
  function arms(g, cx, by, s, t, o = {}) {                 // pressing down at the surface, as the arms of a drowning person do
    for (const k of [-1, 1]) {
      if (k < 0 && o.noLeft) continue;
      const ph = Math.sin(t * 3.6 + (k > 0 ? 1.4 : 0)), sx = cx + k * 250 * s, sy = by + 300 * s, hx = cx + k * (400 + 18 * ph) * s, hy = by + (186 - 18 * ph) * s;
      limb(g, sx, sy, cx + k * 372 * s, by + 330 * s, hx, hy, 66 * s);
      palm(g, hx, hy, 0.72 * s, k * 1.3 + Math.PI + k * 0.2);
    }
  }

  // ------------------------------------------------------------------ timing
  let T = null;
  function times() {
    if (T) return T;
    T = { end: tb('end') };
    for (let i = 1; i <= 27; i++) { const p = 'n' + String(i).padStart(2, '0'); T[p] = at(p); T[p + 'e'] = en(p); }
    T.call = wi('n04', 2); T.flat = T.n04e + 0.06; T.rw0 = T.n05e + 0.6; T.rw1 = T.n06 - 0.02;
    T.open = T.n06e + 0.02; T.leap = T.open + 0.33; T.splash = T.open + 0.7; T.reach = T.n07 - 0.05;
    T.grab = T.n08 - 0.3; T.under = wi('n08', 3) + 0.02; T.surface = T.n10 - 0.42; T.fight = T.n11 - 0.12; T.up = T.n12 - 0.06; T.climb2 = wi('n12', 6) - 0.04; T.slip0 = T.n13 - 0.14; T.look = T.n14 - 0.26;
    T.n16b = at('n16b'); T.n16be = en('n16b'); T.rw2 = T.n16be + 0.55; T.rw3 = T.n17 - 0.04; T.proof = T.n19 - 0.08; T.split = wi('n19', 6) - 0.08; T.told = T.n20 - 0.08; T.back = T.n21 - 0.14; T.th0 = wi('n21', 3); T.land = T.th0 + 0.8; T.home = T.n24 - 0.1;
    return T;
  }

  // ------------------------------------------------------------------ the first frame's pieces
  function button(g, n, label, x, y, w, h, o = {}) {
    g.save(); g.globalAlpha *= o.a ?? 1;
    if (o.dx || o.s) { g.translate(x + w / 2 + (o.dx || 0), y + h / 2); g.scale(o.s ?? 1, o.s ?? 1); g.translate(-(x + w / 2), -(y + h / 2)); }
    R(g, x + 6, y + 10, w, h, 34); g.fillStyle = 'rgba(8,30,40,0.36)'; g.fill();
    R(g, x, y, w, h, 34); g.fillStyle = o.fill || CREAM; g.fill(); g.strokeStyle = INK; g.lineWidth = 8; if (o.dash) g.setLineDash([26, 20]); g.stroke(); g.setLineDash([]);
    ell(g, x + 66, y + h / 2, 44, 44); g.fillStyle = o.badge || INK; g.fill();
    txt(g, n, x + 66, y + h / 2 + 24, 66, o.badge ? INK : YEL, { align: 'center' });
    txt(g, label, x + 126, y + h / 2 + 26, 76, INK, { fit: w - 150 });
    g.restore();
  }
  const BTN = [[444, 1168, 498, 130], [444, 1322, 498, 130]], BTN3 = [444, 1014, 498, 130];
  function frameZero(g, t, o = {}) {
    const TT = times();
    const dip = o.noDip ? 0 : 74 * Math.exp(-Math.pow((t - (TT.n02 + 0.45)) / 0.26, 2)) + 36 * Math.exp(-Math.pow((t - (TT.n03e + 0.55)) / 0.22, 2));
    const by = HY + 12 * Math.sin(t * 2.5) + dip;
    cross(g, t, { broY: by, yw: HY + 130, op: 0.3 + 0.13 * Math.sin(t * 5.1), roll: -0.03 + 0.02 * Math.sin(t * 1.6), close: o.noDip ? 0 : clamp(dip / 60), ...o.cross });
  }
  function words0(g, a = 1) {
    txt(g, 'YOUR BROTHER', 513, 400, 150, INK, { align: 'center', fit: 860, a });
    txt(g, 'IS DROWNING', 513, 538, 150, RED, { align: 'center', fit: 860, stroke: CREAM, sw: 0.09, a });
  }
  // ------------------------------------------------------------------ attempt one: you call
  function shotPick(g, t) {
    const TT = times();
    const up = sstep(TT.call, TT.call + 0.4, t), sec = 70 * sstep(TT.call + 0.3, TT.flat, t), calm = sstep(TT.call + 0.8, TT.flat, t);
    frameZero(g, t, { cross: { op: 0.3 * (1 - calm) + 0.13 * Math.sin(t * 5.1) * (1 - calm) } });
    handAndBottle(g, t);
    words0(g, 1 - sstep(TT.call, TT.call + 0.2, t));
    const hot = sstep(TT.n03e, TT.n03e + 0.4, t) * (1 - sstep(TT.call - 0.1, TT.call, t));
    const ex = pop(t, TT.call + 0.05);
    const a = t < TT.call ? 1 : 1 - ex;
    button(g, '1', 'JUMP IN', ...BTN[0], { s: 1 + 0.012 * hot * Math.sin(t * 9), a, dx: 700 * (t < TT.call ? 0 : ex) });
    button(g, '2', 'CALL FOR HELP', ...BTN[1], { s: 1 + 0.012 * hot * Math.sin(t * 9 + 2), a, dx: 700 * (t < TT.call ? 0 : ex), fill: t >= TT.call - 0.02 ? YEL : CREAM });
    if (up > 0) { g.save(); g.fillStyle = `rgba(16,32,42,${0.14 * up})`; g.fillRect(0, 0, W, H); g.restore(); phoneHand(g, 560, lerp(2000, 960, up), -0.02, 1.9, sec); }
  }
  function shotFlat(g, t) {
    const TT = times(), down = sstep(TT.flat, TT.flat + 0.34, t);
    cross(g, t, { noBro: true });
    handAndBottle(g, t, { dy: 40 });
    phoneHand(g, 560 + 280 * down, lerp(960, 1560, down), -0.02 + 0.2 * down, lerp(1.9, 0.92, down), 70);
  }
  function attemptOne(g, t) { const TT = times(); if (t < TT.flat) shotPick(g, t); else shotFlat(g, t); }
  function tape(g, t) { g.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 7; i++) { const y = ((t * 3100 + i * 311) % 2100) - 100; g.fillRect(0, y, W, 16); } }
  function shotRewindA(g, t) {
    const TT = times(), u = clamp((t - TT.rw0) / (TT.rw1 - TT.rw0)), e = u * u * (3 - 2 * u);
    NOFX = true; attemptOne(g, lerp(TT.flat + 0.3, 0.5, e)); NOFX = false; tape(g, t);
  }

  // ------------------------------------------------------------------ attempt two: you jump
  function shotLeap(g, t) {
    const TT = times(), u = sstep(TT.leap - 0.18, TT.splash, t), tip = sstep(TT.leap - 0.05, TT.splash, t);
    frameZero(g, t, { noDip: true, cross: { zoom: 1 + 1.25 * tip * tip, oy: lerp(860, 1160, tip) } });
    const open = sstep(TT.open, TT.open + 0.08, t), dt = t - TT.open, gr = 2900;
    let bx = FX0 + 95, by = FY0 + 130, rot = 0.04;
    if (dt > 0) {
      const fy = 1520 - by, t1 = Math.sqrt(2 * fy / gr);
      if (dt < t1) { by += 0.5 * gr * dt * dt; rot += dt * 2.2; bx -= dt * 40; }
      else { const d2 = dt - t1, v = 420, hop = Math.max(0, v * d2 - 0.5 * gr * d2 * d2); by = 1520 - hop; rot += t1 * 2.2 + d2 * 3.2; bx += d2 * 120 - t1 * 40; }
    }
    if (u < 0.9) {
      const shift = 300 * tip, dy = 340 * tip;
      if (dt > 0) bottle(g, bx, by + shift, BS, rot);
      myArm(g, FX0 - 210, FY0 + 900 + dy, FX0 - 28, FY0 + 70 + dy, 104);
      if (dt <= 0) bottle(g, bx, by, BS, rot);
      if (open < 0.5) fist(g, FX0, FY0 + 22 + dy, 0.82, -0.25); else palm(g, FX0 + 10, FY0 + 20 + dy, 0.72, Math.PI + 0.4, ME);
    }
    words0(g, 1 - sstep(TT.open - 0.08, TT.open + 0.1, t));
    const ex = pop(t, TT.open - 0.05);
    button(g, '1', 'JUMP IN', ...BTN[0], { dx: 700 * ex, a: 1 - ex, fill: YEL });
    button(g, '2', 'CALL FOR HELP', ...BTN[1], { dx: 700 * ex, a: 1 - ex });
    if (!NOFX && t > TT.splash - 0.02) { g.fillStyle = `rgba(255,255,255,${0.55 * sstep(TT.splash - 0.04, TT.splash, t)})`; g.fillRect(0, 0, W, H); }
  }
  function surfaceFront(g, L, t) {                          // the water against your face
    const xs = []; for (let x = -40; x <= W + 40; x += 14) xs.push([x, L + wave(x * 0.6, t * 1.5, 2.1)]);
    g.beginPath(); xs.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineTo(W + 40, 2300); g.lineTo(-40, 2300); g.closePath();
    g.fillStyle = lg(g, 0, L, 0, L + 620, [0, 'rgba(46,190,188,0.96)'], [1, 'rgba(10,120,136,1)']); g.fill();
    g.beginPath(); xs.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 11; g.stroke();
  }
  function level(g, t, o = {}) {                            // your eye-line at the water. L: where the surface crosses the frame
    const L = o.L ?? 1140, bx = o.bx ?? 540, by = o.by ?? 830, s = o.s ?? 1;
    g.save(); g.translate(0, o.ty || 0);
    if (!FAR) FAR = makeFar();
    g.fillStyle = '#4cb7f0'; g.fillRect(-100, -300, W + 200, 900);
    g.save(); g.translate(540, 520); g.scale(1.5, 1.5); g.translate(-540, -520 + 64); g.drawImage(FAR, -210, -6); g.restore();
    const y0 = 786;
    g.fillStyle = lg(g, 0, y0, 0, L + 60, [0, '#57ccc4'], [1, '#18a5a6']); g.fillRect(-300, y0, W + 600, Math.max(0, L - y0 + 300));
    ripples(g, y0 + 6, Math.max(y0 + 40, L + 40), t, { rows: 14, n: 20, light: 0.5 });
    if (!o.noArms) arms(g, bx, by, s, t, {});
    bro(g, bx, by, s, { t, op: o.op ?? 0.34, look: o.look ?? [0, 3], worry: o.worry ?? 14, browY: -6, roll: o.roll ?? 0, close: o.close ?? 0, dead: o.dead ?? 0 });
    frontWater(g, by + 138 * s, t, { a: 0.78, amp: 0.8 });
    surfaceFront(g, L, t);
    if (o.top) o.top();
    g.restore();
  }
  function strokeArm(g, k, u, L) {
    const reach = Math.sin(u * Math.PI), hx = 540 + k * lerp(470, 150, reach), hy = lerp(L + 240, L - 90, reach);
    myArm(g, 540 + k * 640, 2060, hx - k * 18, hy + 60, 112);
    palm(g, hx, hy, 0.95, Math.PI + k * 0.16, ME);
  }
  function droplets(g, t, t0, n = 24, cx = 540, cy = 1200) {
    const d = t - t0; if (d < 0 || d > 1.2) return;
    for (let i = 0; i < n; i++) {
      const a = hash(i, 11) * TAU, v = 520 + hash(i, 12) * 1200, x = cx + Math.cos(a) * v * d, y = cy + Math.sin(a) * v * d * 0.8 + 1400 * d * d, r = lerp(9, 20, hash(i, 13)) * (1 - d * 0.6);
      g.fillStyle = 'rgba(245,252,255,0.9)'; ell(g, x, y, r, r * 1.2); g.fill();
    }
  }
  function shotSwim(g, t) {
    const TT = times(), u = clamp((t - TT.splash) / (TT.reach - TT.splash)), s = lerp(0.82, 1.22, u), by = lerp(815, 830, u), L = 1140 + 26 * Math.sin(t * 6);
    level(g, t, { L, s, by, op: 0.34 + 0.15 * Math.sin(t * 5.2), top() { const ph = (t - TT.splash) * 1.9; if (u < 1) { strokeArm(g, -1, (ph % 1), L); strokeArm(g, 1, ((ph + 0.5) % 1), L); } } });
    if (t > TT.reach - 0.05) { const q = pop(t, TT.reach); for (const k of [-1, 1]) { myArm(g, 540 + k * 620, 2040, 540 + k * lerp(420, 330, q), lerp(1500, 1190, q), 112); palm(g, 540 + k * lerp(400, 310, q), lerp(1420, 1120, q), 1.0, Math.PI + k * 0.1, ME); } }
    const fl = 0.55 * Math.exp(-Math.max(0, t - TT.splash) * 9); if (!NOFX && fl > 0.01) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
    droplets(g, t, TT.splash, 30);
  }
  function shotClimb(g, t) {
    const TT = times(), u = sstep(TT.grab, TT.under, t), lift = sstep(TT.under - 0.1, TT.under + 0.25, t);
    const L = lerp(1140, -240, lift), s = lerp(1.22, 1.8, u), by = lerp(830, 740, u), ty = 90 * u;
    level(g, t, { L, s, by, noArms: true, op: 0.42 + 0.2 * Math.sin(t * 7), look: [0, lerp(3, -16, u)], worry: 16, dead: u, ty,
      top() {
        const q = sstep(TT.grab - 0.05, TT.under - 0.02, t);
        for (const k of [-1, 1]) {                       // your hands, still on him, pushed down and away
          const yy = lerp(1120, 1700, q); myArm(g, 540 + k * 620, 2040 + 300 * q, 540 + k * lerp(330, 380, q), yy + 70, 112); palm(g, 540 + k * lerp(310, 360, q), yy, 1.0, Math.PI + k * 0.1, ME);
        }
        g.save(); g.beginPath(); g.rect(-300, -3000, W + 600, L + 3000); g.clip();   // as you go under, his arms are above the surface: out of sight
        for (const k of [-1, 1]) {                       // his arms, from his shoulders, up over the water and round your head
          const sx = 540 + k * 250 * s, sy = by + 300 * s, hx = 540 + k * lerp(430, 300, q), hy = lerp(by + 120, 150, q), ex = 540 + k * lerp(520, 470, q), ey = lerp(by + 320, by - 60, q);
          limb(g, sx, sy, ex, ey, hx, hy, 78); palm(g, hx, hy, 1.25, Math.PI + k * lerp(0.9, 0.35, q));
        }
        g.restore();
      } });
  }
  function underwater(g, t, o = {}) {
    const top = o.top ?? 300;
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#b8f4ea'], [0.2, '#57d6cf'], [0.62, '#16a6ad'], [1, '#0b7f96']); g.fillRect(0, 0, W, H);
    g.fillStyle = rg(g, o.sx ?? 620, top - 120, 30, 620, [0, 'rgba(255,255,240,0.9)'], [1, 'rgba(255,255,240,0)']); g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x = 60 + i * 165 + Math.sin(t * 0.7 + i) * 40, w0 = 40 + 26 * hash(i, 3), w1 = 150 + 110 * hash(i, 5), sk = (x - 540) * 0.46;
      g.fillStyle = lg(g, 0, top - 80, 0, 1700, [0, `rgba(255,255,230,${0.2 + 0.06 * Math.sin(t * 1.3 + i)})`], [1, 'rgba(255,255,230,0)']);
      g.beginPath(); g.moveTo(x - w0, top - 80); g.lineTo(x + w0, top - 80); g.lineTo(x + w1 + sk, 1700); g.lineTo(x - w1 + sk, 1700); g.closePath(); g.fill();
    }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 9; g.beginPath(); for (let x = -20; x <= W + 20; x += 14) { const y = top + wave(x, t * 1.3, 1.6); x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  }
  function bubbles(g, t, t0, n = 26, o = {}) {
    for (let i = 0; i < n; i++) {
      const b0 = t0 + hash(i, 21) * (o.spread ?? 1.6); if (t < b0) continue;
      const d = t - b0, x = (o.x ?? 540) + (hash(i, 22) - 0.5) * (o.w ?? 800) + Math.sin(d * 5 + i) * 18, y = (o.y ?? 1700) - d * (340 + hash(i, 23) * 460), r = 7 + hash(i, 24) * 26;
      if (y < 200) continue;
      g.strokeStyle = 'rgba(255,255,255,0.86)'; g.lineWidth = 4; ell(g, x, y, r, r); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.75)'; ell(g, x - r * 0.35, y - r * 0.35, r * 0.24, r * 0.24); g.fill();
    }
  }
  // a leg coming down at you: it gets bigger as it gets nearer (thin at the hip, thick at the shin, a big foot)
  function taper(g, x0, y0, w0, x1, y1, w1, col) {
    const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
    g.beginPath(); g.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); g.arc(x1, y1, w1 / 2, a + Math.PI / 2, a - Math.PI / 2, true); g.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.arc(x0, y0, w0 / 2, a - Math.PI / 2, a + Math.PI / 2, true); g.closePath();
    g.fillStyle = col; g.fill();
  }
  function leg(g, hx, hy, kx, ky, fx, fy) {
    for (const [c, e] of [[BRO.skinD, 8], [BRO.skin, 0]]) { taper(g, hx, hy, 96 + e, kx, ky, 128 + e, c); taper(g, kx, ky, 128 + e, fx, fy, 142 + e, c); }
    g.save(); g.translate(fx, fy + 54); g.rotate((fx - kx) * 0.002);                // the sole, toes toward you
    ell(g, 0, 26, 112, 136); g.fillStyle = BRO.skinD; g.fill(); ell(g, 0, 24, 104, 128); g.fillStyle = '#c99a72'; g.fill();
    for (let i = 0; i < 5; i++) { const x = -78 + i * 39, r = i === 0 ? 30 : 24 - i * 1.4; ell(g, x, 150 - Math.abs(i - 1) * 6, r, r * 1.1); g.fillStyle = BRO.skinD; g.fill(); ell(g, x, 148 - Math.abs(i - 1) * 6, r - 4, r * 1.1 - 4); g.fillStyle = '#c99a72'; g.fill(); }
    g.restore();
  }
  function legsAbove(g, k1, k2, by = 0) {
    g.save(); g.translate(0, by);
    leg(g, 440, 330, 380 + 18 * k1, 640, 400 + 46 * k1, 900 + 34 * k1);
    leg(g, 640, 330, 700 + 18 * k2, 620, 680 + 46 * k2, 880 + 34 * k2);
    R(g, 330, 70, 420, 300, 80); g.fillStyle = lg(g, 330, 0, 750, 0, [0, '#2b56c4'], [1, '#1c3a93']); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(536, 150, 8, 220);
    g.fillStyle = 'rgba(255,207,58,0.96)'; R(g, 320, -240, 440, 340, 80); g.fill();
    g.fillStyle = 'rgba(160,100,10,0.28)'; g.fillRect(320, 40, 440, 60);
    g.restore();
  }
  function shotUnder(g, t) {
    const TT = times();
    underwater(g, t, { top: 230 });
    legsAbove(g, Math.sin(t * 7.2), Math.sin(t * 7.2 + 2.2), lerp(-500, 0, sstep(TT.under, TT.under + 0.3, t)));
    for (const k of [-1, 1]) { const h = Math.sin(t * 5 + k) * 26; myArm(g, 540 + k * 700, 2040, 540 + k * 300, 1500 + h, 118); palm(g, 540 + k * 280, 1410 + h, 1.05, Math.PI + k * 0.25, ME); }
    bubbles(g, t, TT.under, 34, { y: 1560, w: 760 });
  }
  function shotBlank(g, t) {
    const TT = times(), u = clamp((t - TT.surface) / (TT.fight - TT.surface));
    level(g, t, { L: 1540 + 30 * Math.sin(t * 5), s: lerp(2.0, 2.3, u), by: 800, op: 0.32 + 0.1 * Math.sin(t * 6.3), look: [-16, 4], dead: 1, worry: 2, close: 0.08 });
    const fl = Math.exp(-Math.max(0, t - TT.surface) * 12); if (!NOFX && fl > 0.01) { g.fillStyle = `rgba(255,255,255,${fl * 0.5})`; g.fillRect(0, 0, W, H); }
    if (t >= wi('n10', 2) - 0.04) title(g, "HE DOESN'T KNOW IT'S YOU", 1470, 104, CREAM, t, wi('n10', 2) - 0.04, { stroke: INK, sw: 0.12, fit: 840 });
  }
  // the wall: smooth concrete, wet at the bottom, one lip at the top
  let WALL = null;
  function makeWall() {
    const c = offscreen(2400, 1700), g = c.getContext('2d'), r = mulberry32(7);
    g.fillStyle = lg(g, 0, 0, 0, 420, [0, '#58bdf2'], [1, '#c8effb']); g.fillRect(0, 0, 2400, 440);
    for (let i = 0; i < 38; i++) { const x = i * 68 + r() * 40, q = 80 + r() * 70; g.fillStyle = ['#4aa563', '#3f9a5b', '#57b26a'][i % 3]; ell(g, x, 300 - r() * 50, q, q * 0.9); g.fill(); }
    g.fillStyle = lg(g, 0, 330, 0, 410, [0, '#7cc65c'], [1, '#5fae4b']); g.fillRect(0, 330, 2400, 90);
    g.fillStyle = '#f3ead4'; g.fillRect(0, 404, 2400, 26); g.fillStyle = 'rgba(70,60,40,0.3)'; g.fillRect(0, 428, 2400, 6);
    g.fillStyle = lg(g, 0, 430, 0, 1700, [0, '#e9e0ca'], [0.55, '#d8cdb3'], [0.8, '#a9ab92'], [1, '#6f8a80']); g.fillRect(0, 430, 2400, 1270);
    g.strokeStyle = 'rgba(110,100,80,0.22)'; g.lineWidth = 5; for (let x = 120; x < 2400; x += 520) { g.beginPath(); g.moveTo(x, 434); g.lineTo(x - 40, 1700); g.stroke(); }
    g.lineCap = 'round'; for (let i = 0; i < 90; i++) { const x = r() * 2400, h = 90 + r() * 260, w = 5 + r() * 12; g.strokeStyle = `rgba(50,100,84,${0.08 + r() * 0.16})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, 1700); g.quadraticCurveTo(x + (r() - 0.5) * 16, 1700 - h / 2, x + (r() - 0.5) * 22, 1700 - h); g.stroke(); }
    return c;
  }
  function wallView(g, t, o = {}) {                          // o.z, o.ty: how much wall, and how far up it you're looking
    if (!WALL) WALL = makeWall();
    const z = o.z ?? 1;
    g.fillStyle = '#58bdf2'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(540, 0); g.scale(z, z); g.translate(-1200, o.ty ?? -60); g.drawImage(WALL, 0, 0); g.restore();
  }
  // from behind: wet yellow T-shirt, wet hair, arms up on the wall
  function broBack(g, x, y, s, reach, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    for (const k of [-1, 1]) { limb(g, k * 200, 40, k * 300, -300 * reach - 40, k * 210, -640 * reach - 60, 66); palm(g, k * 208, -700 * reach - 70, 0.7, Math.PI + k * 0.1); }
    g.fillStyle = BRO.skinD; g.fillRect(-60, -110, 120, 100);
    g.fillStyle = lg(g, -280, -40, 280, 500, [0, '#ffcf3a'], [1, '#d99512']); g.beginPath(); g.moveTo(-250, 60); g.bezierCurveTo(-240, -40, -120, -70, 0, -70); g.bezierCurveTo(120, -70, 240, -40, 250, 60); g.lineTo(220, 620); g.lineTo(-220, 620); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(150,90,10,0.3)'; g.lineWidth = 8; for (const [a, b, c, d] of [[-160, 60, -40, 300], [150, 30, 40, 330], [-120, 360, 110, 430]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 + 20, (b + d) / 2, c, d); g.stroke(); }
    g.fillStyle = lg(g, -200, 620, 200, 620, [0, '#2b56c4'], [1, '#1c3a93']); R(g, -220, 610, 440, 280, 40); g.fill();
    for (const k of [-1, 1]) { const fx = k * 100 + Math.sin(t * 7 + k) * 12; limb(g, k * 120, 860, k * 130, 1040, fx, 1260, 88); ell(g, fx, 1296, 54, 70); g.fillStyle = BRO.skinD; g.fill(); ell(g, fx, 1292, 48, 64); g.fillStyle = '#c99a72'; g.fill(); }
    for (const k of [-1, 1]) { ell(g, k * 172, -220, 22, 38); g.fillStyle = BRO.skin; g.fill(); }
    g.fillStyle = BRO.hair; ell(g, 0, -260, 178, 190); g.fill();
    g.strokeStyle = 'rgba(190,220,235,0.3)'; g.lineWidth = 7; g.lineCap = 'round'; for (const [a, b, c, d] of [[-100, -360, -70, -240], [-10, -400, 0, -250], [80, -370, 70, -240]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 + 12, (b + d) / 2, c, d); g.stroke(); }
    g.restore();
  }
  // it takes everything you've got: the water keeps going over your eyes, his back in front of you, the wall coming
  function shotFight(g, t) {
    const TT = times(), u = clamp((t - TT.fight) / (TT.up - TT.fight)), up = sstep(TT.up + 0.05, TT.climb2 + 0.1, t), gone = sstep(TT.climb2 + 0.5, TT.climb2 + 0.85, t), out = sstep(TT.climb2 + 0.6, TT.slip0 - 0.1, t);
    const z = lerp(0.8, 1.3, u), slap = Math.max(0, Math.sin(t * 5.6) * Math.sin(t * 2.1 + 1)) * (1 - up);
    const shove = sstep(TT.climb2 - 0.08, TT.climb2 + 0.08, t) * (1 - sstep(TT.climb2 + 0.62, TT.slip0 - 0.05, t));
    const sh = (shove > 0.5 && gone < 0.5) ? Math.sin(t * 61) * 14 * Math.exp(-Math.max(0, t - TT.climb2) * 3) : 0;
    g.save(); g.translate(sh * 0.4, sh);
    const L = lerp(1500 + 18 * Math.sin(t * 6) - 780 * slap * slap, -200, shove);
    wallView(g, t, { z, ty: lerp(40, -170, u) });
    const wob = Math.sin(t * 8) * 22 * (1 - up);
    broBack(g, 540 + wob, lerp(1020, 960, up) - 1500 * gone * gone - 1400 * out, lerp(1.0, 1.15, u), lerp(0.25, 1, sstep(0, 0.6, u)), t);
    surfaceFront(g, L, t);
    if (shove > 0 && gone < 1) { const fy = lerp(-560, 560, sstep(TT.climb2 - 0.1, TT.climb2 + 0.08, t)) - 1500 * gone; g.save(); g.translate(540, fy); g.scale(2.3, 2.3); ell(g, 0, 26, 112, 136); g.fillStyle = BRO.skinD; g.fill(); ell(g, 0, 24, 104, 128); g.fillStyle = '#c99a72'; g.fill(); for (let i = 0; i < 5; i++) { const x = -78 + i * 39, r = i === 0 ? 30 : 24 - i * 1.4; ell(g, x, 150 - Math.abs(i - 1) * 6, r, r * 1.1); g.fillStyle = BRO.skinD; g.fill(); ell(g, x, 148 - Math.abs(i - 1) * 6, r - 4, r * 1.1 - 4); g.fillStyle = '#c99a72'; g.fill(); } limb(g, 0, -900, -6, -420, 0, -10, 150); g.restore(); }
    if (t < TT.climb2 - 0.04) for (const k of [-1, 1]) { const push = sstep(TT.up - 0.02, TT.climb2 - 0.05, t), yy = lerp(1500, 760, push) + Math.sin(t * 6 + k) * 16; myArm(g, 540 + k * 640, 2100, 540 + k * lerp(300, 180, push), yy + 150, 118); palm(g, 540 + k * lerp(260, 150, push), yy, 1.15, Math.PI + k * 0.1, ME); }
    else if (shove > 0.5) bubbles(g, t, TT.climb2, 22, { y: 1500, w: 700, spread: 0.5 });
    g.restore();
  }
  // your hand on the wet wall, and it goes
  function shotSlip(g, t) {
    const TT = times(), a = sstep(TT.slip0, TT.slip0 + 0.2, t), sl = sstep(TT.n13 + 0.5, TT.n13e + 0.55, t), L = lerp(1500, 1120, sstep(TT.n13 + 0.5, TT.look, t)) + 24 * Math.sin(t * 4);
    wallView(g, t, { z: 1.7, ty: -640 });
    const y0 = 660, y1 = 1320, y = lerp(y0, y1, sl);
    const yy = lerp(1800, y, a); myArm(g, 620, 2200, 548, yy + 170, 118); palm(g, 540, yy, 1.25, Math.PI, ME);
    surfaceFront(g, L, t);
  }
  // looking up from under the water: a bright circle of sky, and him in it
  let WINC = null;
  function shotLook(g, t) {
    const TT = times(), u = clamp((t - TT.look) / (TT.n16be + 0.5 - TT.look));
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#39c4c2'], [0.5, '#149fa8'], [1, '#0a7f95']); g.fillRect(0, 0, W, H);
    const shut = sstep(wi('n16b', 3) - 0.08, wi('n16b', 3) + 0.3, t), cy = lerp(640, 560, u), rx = lerp(480, 330, u), ry = rx * 1200 / 1080, sc = rx / 540;
    if (!WINC) WINC = offscreen(1080, 1200);
    const w = WINC.getContext('2d'); w.setTransform(1, 0, 0, 1, 0, 0); w.globalAlpha = 1; w.fillStyle = lg(w, 0, 0, 0, 900, [0, '#5fc0ef'], [1, '#bfe9f6']); w.fillRect(0, 0, 1080, 1200);
    w.fillStyle = '#e9dfc7'; w.beginPath(); w.moveTo(0, 900); w.quadraticCurveTo(540, 840, 1080, 900); w.lineTo(1080, 1200); w.lineTo(0, 1200); w.closePath(); w.fill();
    const lx = Math.sin(t * 1.5) * 34, enter = sstep(TT.look + 0.05, TT.look + 0.6, t);
    w.globalAlpha = 1 - shut; bro(w, 540, lerp(1560, 600, enter), 1.3, { t, op: 0.16, look: [lx, 10], worry: 18, browY: -8, roll: Math.sin(t * 1.5) * 0.06 });
    w.globalAlpha = 1; w.fillStyle = 'rgba(233,223,199,1)'; w.beginPath(); w.moveTo(0, 1010); w.quadraticCurveTo(540, 980, 1080, 1010); w.lineTo(1080, 1200); w.lineTo(0, 1200); w.closePath(); w.fill();
    g.save(); g.beginPath();
    for (let a = 0; a <= 1.001; a += 0.02) { const th = a * TAU, wob = 1 + 0.02 * Math.sin(th * 7 + t * 3), x = 540 + Math.cos(th) * rx * wob, y = cy + Math.sin(th) * ry * wob; a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.closePath(); g.clip();
    const x0 = 540 - rx, y0 = cy - ry, hs = 2 * ry / 1200, st = 3;
    for (let y = 0; y < 1200; y += st) { const dx = (Math.sin(y * 0.018 + t * 3.1) * 9 + Math.sin(y * 0.047 - t * 2.1) * 4) * sc; g.drawImage(WINC, 0, y, 1080, st, x0 + dx, y0 + y * hs, 2 * rx, st * hs + 1); }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg(g, 540, cy, rx * 0.99, rx * 1.4 + 1, [0, 'rgba(210,255,250,0)'], [0.06, 'rgba(210,255,250,0.3)'], [1, 'rgba(210,255,250,0)']); g.beginPath(); g.rect(0, 0, W, H); g.ellipse(540, cy, rx * 1.02 + 0.5, ry * 1.02 + 0.5, 0, 0, TAU, true); g.fill('evenodd'); g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 7; g.beginPath(); for (let a = 0; a <= 1.001; a += 0.02) { const th = a * TAU, wob = 1 + 0.02 * Math.sin(th * 7 + t * 3), x = 540 + Math.cos(th) * rx * wob, y = cy + Math.sin(th) * ry * wob; a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.closePath(); g.stroke();
    bubbles(g, t, TT.look, 9, { y: 1500, w: 340, spread: 2.2 });
    title(g, 'HE MADE IT.', 1240, 176, CREAM, t, TT.n15 - 0.04, { stroke: '#0a6b7c', sw: 0.08 });
    title(g, "YOU DIDN'T.", 1460, 214, YEL, t, TT.n16 - 0.04, { stroke: '#0a6b7c', sw: 0.08 });
  }
  function attemptTwo(g, t) {
    const TT = times();
    if (t < TT.splash) shotLeap(g, t);
    else if (t < TT.grab) shotSwim(g, t);
    else if (t < TT.under + 0.3) shotClimb(g, t);
    else if (t < TT.surface) shotUnder(g, t);
    else if (t < TT.fight) shotBlank(g, t);
    else if (t < TT.slip0) shotFight(g, t);
    else if (t < TT.look) shotSlip(g, t);
    else shotLook(g, t);
  }
  function shotRewindB(g, t) {
    const TT = times(), u = clamp((t - TT.rw2) / (TT.rw3 - TT.rw2)), e = u * u * (3 - 2 * u);
    NOFX = true; attemptTwo(g, lerp(TT.n16be, TT.open - 0.1, e)); NOFX = false; tape(g, t);
  }

  // ------------------------------------------------------------------ the third button
  function grey(g, a = 1) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${a})`; g.fillRect(0, 0, W, H); g.restore(); }
  function ring(g, x, y, r, k, lw = 12) { if (k <= 0) return; g.strokeStyle = RED; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke(); }
  function shotFrozen(g, t) {
    const TT = times(), f = 0.5, g0 = sstep(TT.rw3, TT.rw3 + 0.3, t), col = sstep(TT.n18e + 0.28, TT.n18e + 0.56, t), push = 1 + 0.03 * clamp((t - TT.rw3) / 4);
    g.save(); g.translate(540, 900); g.scale(push, push); g.translate(-540, -900);
    frameZero(g, f, { noDip: true }); handAndBottle(g, f); words0(g, 1 - sstep(TT.n17, TT.n17 + 0.2, t));
    grey(g, g0); g.fillStyle = `rgba(250,248,240,${0.26 * g0})`; g.fillRect(-100, -100, W + 200, H + 200);
    if (col > 0) { g.save(); g.globalAlpha = col; handAndBottle(g, f); g.restore(); }
    const fall = sstep(TT.n18e + 0.2, TT.n18e + 0.55, t), dy = fall * fall * 900;
    button(g, '1', 'JUMP IN', BTN[0][0], BTN[0][1] + dy * 1.12, BTN[0][2], BTN[0][3], { fill: g0 > 0.5 ? '#eeeae0' : CREAM });
    button(g, '2', 'CALL FOR HELP', BTN[1][0], BTN[1][1] + dy * 1.25, BTN[1][2], BTN[1][3], { fill: g0 > 0.5 ? '#eeeae0' : CREAM });
    if (t >= TT.n17e - 0.02) { const q = pop(t, TT.n17e - 0.02); button(g, '?', '', BTN3[0], BTN3[1] + dy, BTN3[2], BTN3[3], { s: q, a: clamp(q * 3), dash: true, fill: 'rgba(255,255,255,0.0)' }); }
    ring(g, FX0 + 100, FY0 + 118, 262, sstep(TT.n18e + 0.25, TT.n18e + 0.62, t), 14);
    g.restore();
  }
  // full frame, one after the other, each with the ring on it
  function shotProof(g, t) {
    const TT = times();
    if (t < TT.split) {
      const u = clamp((t - TT.proof) / (TT.split - TT.proof));
      shotLeap(g, lerp(TT.open - 0.12, TT.open + 0.52, u));
      const dt = Math.max(0, lerp(TT.open - 0.12, TT.open + 0.52, u) - TT.open), fy = 1520 - (FY0 + 130), gr = 2900, t1 = Math.sqrt(2 * fy / gr);
      const by = dt < t1 ? FY0 + 130 + 0.5 * gr * dt * dt : 1520 - Math.max(0, 420 * (dt - t1) - 0.5 * gr * (dt - t1) * (dt - t1));
      ring(g, FX0 + 95 - dt * 20, by, 250, 1, 12);
    } else {
      shotPick(g, TT.call + 0.55 + (t - TT.split) * 0.2);
      ring(g, FX0 + 100, FY0 + 118, 262, 1, 12);
    }
  }
  // back in colour, moving, the ring still on it: where the first frame's words were, these
  function shotTold(g, t) {
    const TT = times();
    frameZero(g, t);
    handAndBottle(g, t);
    const pd = sstep(TT.told, TT.told + 0.32, t); if (pd < 1) phoneHand(g, 560 + 300 * pd, lerp(960, 2300, pd), -0.02 + 0.2 * pd, lerp(1.9, 0.92, pd), 70);
    ring(g, FX0 + 100, FY0 + 118, 262, 1, 12);
    if (t >= wi('n20', 5) - 0.04) { title(g, 'NOBODY', 400, 150, INK, t, wi('n20', 5) - 0.04, { stroke: CREAM, sw: 0.07 }); title(g, 'TOLD YOU', 538, 150, RED, t, wi('n20', 7) - 0.04, { stroke: CREAM, sw: 0.09 }); }
    if (t >= TT.n20e - 0.12) { const q = pop(t, TT.n20e - 0.12); button(g, '3', 'THROW IT', ...BTN3, { s: q, a: clamp(q * 2), fill: YEL, badge: CREAM }); }
  }
  function football(g, x, y, r) { ell(g, x, y, r, r); g.fillStyle = '#f7f5ee'; g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke(); g.fillStyle = INK; const pent = (px, py, q, rot) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i * TAU / 5; const X = px + Math.cos(a) * q, Y = py + Math.sin(a) * q; i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.closePath(); g.fill(); }; pent(x, y, r * 0.3, -Math.PI / 2); g.save(); ell(g, x, y, r - 2, r - 2); g.clip(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; pent(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86, r * 0.28, a); } g.restore(); }
  function jerrycan(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); R(g, -56, -60, 112, 130, 12); g.fillStyle = '#ffc62e'; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); R(g, 16, -84, 36, 26, 6); g.fillStyle = '#d24a1f'; g.fill(); g.stroke(); g.lineWidth = 9; g.beginPath(); g.moveTo(-40, -60); g.quadraticCurveTo(-30, -96, 4, -60); g.stroke(); g.restore(); }
  function bag(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); R(g, -60, -56, 120, 130, 26); g.fillStyle = '#d9483a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); R(g, -44, 8, 88, 52, 12); g.fillStyle = '#b8352a'; g.fill(); g.stroke(); g.lineWidth = 9; g.beginPath(); g.moveTo(-28, -56); g.quadraticCurveTo(0, -100, 28, -56); g.stroke(); g.restore(); }
  function shotThrow(g, t) {
    const TT = times(), th0 = TT.th0, land = TT.land, dt = t - land, hold = sstep(land + 0.06, land + 0.4, t);
    const breathe = sstep(TT.n23 - 0.2, TT.n23 + 0.3, t), knows = sstep(wi('n23', 4) - 0.1, wi('n23', 4) + 0.55, t);
    const by = HY + 14 * Math.sin(t * 2.5) - 70 * hold - 26 * breathe, zoom = 1 + 0.5 * sstep(TT.n23 - 0.3, TT.n23e, t);
    const BX = 205, bob = 8 * Math.sin(t * 2.6);
    const op = lerp(0.34 + 0.12 * Math.sin(t * 5.1), 0.46 + 0.28 * Math.sin(t * 6.2), hold) * (1 - knows * 0.92);
    cross(g, t, {
      broY: by, yw: HY + 130, zoom, oy: 900, ox: 500, op, look: [0, lerp(3, 7, knows)], worry: lerp(14, 20, knows), browY: lerp(-6, -12, knows), close: 0, smile: knows * 0.6, roll: -0.03 + 0.06 * hold, noLeft: hold > 0.5,
      hug(yw) { if (t >= land) bottle(g, BX, yw - 22 + bob, 0.62, 0.86); },
      over(yw, b1) {                                        // his arm comes down on it and locks over the top, out to the side, away from his face
        if (hold <= 0.5) return;
        const k = (hold - 0.5) * 2, sx = 540 - 250, sy = b1 + 300, ex = lerp(170, 246, k), ey = lerp(yw + 30, yw - 70, k), hx = lerp(130, 92, k), hy = lerp(yw + 18, yw - 18 + bob, k);
        limb(g, sx, sy, ex, ey, hx, hy, 62); palm(g, hx - 2, hy + 4, 0.62, Math.PI / 2 + 0.25);
      },
    });
    const a0 = sstep(TT.back + 0.05, th0, t), a1 = sstep(th0, th0 + 0.2, t), rel = th0 + 0.086;   // a1 = 0.4: the hand lets go
    if (t < th0 + 0.28) {
      const dx = -40 * a0 + 150 * a1, dy = 120 * a0 - 210 * a1;
      if (t < rel) handAndBottle(g, t, { dx, dy, rot: 0.04 - 0.35 * a0 + 0.7 * a1 });
      else { myArm(g, FX0 - 210, FY0 + 900, FX0 - 28 + dx, FY0 + 70 + dy, 104); palm(g, FX0 + dx, FY0 + dy, 0.76, Math.PI + 0.3, ME); }
    }
    if (t >= rel && t < land) {                             // from where the hand let go, a low lob that lands by his side, never across his face
      const u = (t - rel) / (land - rel), x = lerp(FX0 + 115, BX, u), y = lerp(FY0 + 166, HY + 108, u) - 260 * Math.sin(u * Math.PI);
      bottle(g, x, y, lerp(0.74, 0.62, u), lerp(-0.03, 0.86, u));
    }
    if (dt >= 0 && dt < 0.8) for (let i = 0; i < 16; i++) { const a = -Math.PI * hash(i, 41), v = 280 + 360 * hash(i, 42), x = BX + Math.cos(a) * v * dt, y = HY + 100 + Math.sin(a) * v * dt + 900 * dt * dt, r = 6 + 10 * hash(i, 43); g.fillStyle = 'rgba(245,252,255,0.9)'; ell(g, x, y, r, r * 1.2); g.fill(); }
    if (t < land - 0.3) {
      const q = pop(t, TT.n20e - 0.12), fade = 1 - sstep(th0 + 0.15, th0 + 0.45, t);
      button(g, '1', 'JUMP IN', ...BTN[0], { a: 0.5 * fade }); button(g, '2', 'CALL FOR HELP', ...BTN[1], { a: 0.5 * fade });
      button(g, '3', 'THROW IT', ...BTN3, { s: q, a: clamp(q * 2) * fade, fill: YEL, badge: CREAM });
    }
    const fout = 1 - sstep(TT.n22 + 0.1, TT.n22 + 0.35, t);
    if (t >= wi('n21', 8) - 0.02) {
      title(g, 'ANYTHING THAT FLOATS.', 352, 104, CREAM, t, wi('n21', 8) - 0.02, { a: fout, fit: 840 }); title(g, 'NOT YOU.', 470, 128, YEL, t, wi('n21', 10) - 0.02, { a: fout });
      const a = fout; g.save(); g.globalAlpha *= a;
      const p1 = pop(t, wi('n21', 8)), p2 = pop(t, wi('n21', 8) + 0.1), p3 = pop(t, wi('n21', 8) + 0.2);
      if (p1 > 0) football(g, 560, 1290, 88 * p1); if (p2 > 0) jerrycan(g, 720, 1290, 1.05 * p2); if (p3 > 0) bag(g, 860, 1296, 0.95 * p3);
      g.restore();
    }
    const ph = sstep(wi('n22', 11) - 0.2, wi('n22', 11) + 0.25, t) * (1 - sstep(TT.n23 - 0.2, TT.n23 + 0.2, t));
    if (ph > 0) phoneHand(g, 760, lerp(2000, 1290, ph), 0.12, 0.96, Math.max(0, t - (wi('n22', 11) - 0.2)));
  }
  function shotHome(g, t) {
    const TT = times();
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#f6c98f'], [1, '#eeb077']); g.fillRect(0, 0, W, H);
    R(g, 40, 640, 250, 380, 12); g.fillStyle = lg(g, 0, 640, 0, 1020, [0, '#2d4f8f'], [0.6, '#e88f6a'], [1, '#f7c978']); g.fill(); g.strokeStyle = '#8d5a33'; g.lineWidth = 16; g.stroke();
    g.strokeStyle = '#8d5a33'; g.lineWidth = 10; g.beginPath(); g.moveTo(165, 640); g.lineTo(165, 1020); g.moveTo(40, 830); g.lineTo(290, 830); g.stroke();
    g.fillStyle = '#c98f5c'; R(g, 24, 1018, 282, 18, 6); g.fill();
    bottle(g, 214, 948, 0.27, 0.02);                        // it came home too
    const br = 3 * Math.sin(t * 1.4);
    bro(g, 540, HY + br, 1, { t, dry: true, towel: true, look: [0, 3], worry: 2, browY: -2, smile: 0.9, op: 0 });
    // your phone comes up where the two buttons were on the first frame; the words people will send
    const up = sstep(TT.n26 - 0.15, TT.n26 + 0.3, t), y0 = lerp(2100, 1120, up);
    if (up > 0) {
      myArm(g, 860, y0 + 1300, 780, y0 + 560, 118);
      R(g, 60, y0, 890, 1100, 54); g.fillStyle = '#12161b'; g.fill();
      R(g, 76, y0 + 16, 858, 1068, 42); g.fillStyle = '#0f1a1f'; g.fill();
      if (t < TT.n27 - 0.04) { R(g, 106, y0 + 54, 800, 96, 30); g.fillStyle = '#1e2c33'; g.fill(); if (Math.floor(t * 2.4) % 2 === 0) { g.fillStyle = '#5ee0a8'; g.fillRect(140, y0 + 74, 8, 56); } }
      const m0 = TT.n27, wds = words('n27'), L1 = ["If I'm ever drowning,", "don't jump in.", 'Throw something', 'that floats.'], cut = [0, 4, 7, 9];
      const shown = (k) => (t >= (wds[cut[k]] ? wds[cut[k]].t0 : Infinity) - 0.04);
      if (t >= m0 - 0.04) {
        const q = pop(t, m0 - 0.04), by = y0 + 42;
        g.save(); g.translate(0, (1 - q) * 30); g.globalAlpha *= clamp(q * 3);
        R(g, 100, by, 820, 362, 34); g.fillStyle = '#1d8a63'; g.fill();
        L1.forEach((s0, k) => { if (shown(k)) txt(g, s0, 146, by + 84 + k * 80, 80, CREAM, { kind: 'semi', fit: 740 }); });
        g.restore();
      }
    }
    if (t >= TT.n25 - 0.04 && t < TT.n26 - 0.1) { title(g, 'NOBODY TOLD THEM', 400, 128, INK, t, TT.n25 - 0.04, { stroke: CREAM, sw: 0.07 }); title(g, 'EITHER.', 530, 128, INK, t, wi('n25', 3) - 0.04, { stroke: CREAM, sw: 0.07 }); }
    if (t >= wi('n26', 1) - 0.04) title(g, 'TELL THEM.', 470, 190, RED, t, wi('n26', 1) - 0.04, { stroke: CREAM, sw: 0.09 });
    const out = sstep(TT.end - 0.3, TT.end, t);
    if (out > 0) { g.fillStyle = `rgba(7,9,12,${out})`; g.fillRect(0, 0, W, H); }
  }

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g, TT = times();
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.clearRect(0, 0, W, H);
      g.save();
      if (t < TT.rw0) attemptOne(g, t);
      else if (t < TT.rw1) shotRewindA(g, t);
      else if (t < TT.rw2) attemptTwo(g, t);
      else if (t < TT.rw3) shotRewindB(g, t);
      else if (t < TT.proof) shotFrozen(g, t);
      else if (t < TT.told) shotProof(g, t);
      else if (t < TT.back) shotTold(g, t);
      else if (t < TT.home) shotThrow(g, t);
      else shotHome(g, t);
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
