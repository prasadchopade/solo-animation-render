// Reel 31 · The Last 1,000 (working title). Episode 1 of a voted serial; not an episode of "You're the test subject".
// You're the ship. Two people are drowning inside you and you've got the power to open one door: the last doctor or the last engineer.
// You get five seconds. It freezes on the last one. Two job titles and you were ready to drown one of them. They're Meera and Ravi, you
// married them, she's due in three weeks. She says open his door, he says open hers. Your second's up. One, or two? Nothing is resolved.
// Fiction. Our own drawings; nobody real. The face rig's method comes from reels 19, 20, 25 (tags); these characters are new. 30 fps, no motion blur.
(() => {
  const { W, H, scene, canvas, clamp, lerp, mulberry32 } = C;
  const K = window.KIT;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#10202c', RED = '#e23a2a', PAPER = '#fff9ec', YEL = '#ffcf33', NAVY = '#123049', TEAL = '#14a39a', ORG = '#f47a20', AQUA = '#2fcbe0', CREAM = '#fff1d6';
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
  const pop = (t, t0) => clamp(hit(t, t0, 'heavy'));

  // ------------------------------------------------------------------ the rig: mouth and eyes (method from reels 19, 20, 25)
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

  // ------------------------------------------------------------------ the people. New for this reel.
  const MEERA = { skin: '#c98f68', skinD: '#9e6a49', skinH: '#e6b892', hair: '#15100d', style: 'bun', brow: 10, browTilt: -4, jaw: 0.93, ew: 49, eh: 29, lip: '#a53c44', ear: true, lidW: 8 };
  const RAVI = { skin: '#b67e58', skinD: '#8b5a3b', skinH: '#d49f78', hair: '#14100c', style: 'crop', must: 'thin', stub: 0.35, brow: 16, browTilt: -6, jaw: 1.02, ew: 44, eh: 25, oil: true };
  const RAVI_OLD = { ...RAVI, hair: '#8e8a84', browC: '#6e6a64', stub: 0.8, stubC: '150,146,140', must: 'grey', oil: false, lines: true, eh: 22 };
  const TARA = { skin: '#c48a60', skinD: '#9a6444', skinH: '#e0b08a', hair: '#15100d', style: 'braids', brow: 8, browTilt: -2, jaw: 0.84, ew: 56, eh: 35, lip: '#b0505a' };
  const AMMA = { skin: '#bb8560', skinD: '#92603f', skinH: '#d8a881', hair: '#5a5550', style: 'bun', brow: 10, browTilt: 8, jaw: 0.98, ew: 40, eh: 22, lip: '#8a3a3e', specs: true };
  const APPA = { skin: '#a8724e', skinD: '#7f5234', skinH: '#c48f6a', hair: '#4a4642', style: 'bald', must: 'thick', brow: 15, browTilt: 8, jaw: 1.04, ew: 38, eh: 21, specs: true };

  function wetBeads(g, seed, n, hw) {
    const r = mulberry32(seed);
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = 0.45 + r() * 0.5, x = Math.cos(a) * hw * d, y = -60 + Math.sin(a) * 180 * d, s = 2.6 + r() * 3.4;
      g.fillStyle = 'rgba(232,248,255,0.85)'; ell(g, x, y, s, s * 1.5); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.95)'; ell(g, x - s * 0.3, y - s * 0.5, s * 0.32, s * 0.42); g.fill();
    }
  }
  function head(g, L, o = {}) {
    const op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw, drop = 104 * op, chin = 232 + drop, ey = -28, ex = 80, hh = hw + 6;
    // hair behind the head
    if (L.style === 'braids') { g.strokeStyle = L.hair; g.lineCap = 'round'; for (const k of [-1, 1]) { g.lineWidth = 40; g.beginPath(); g.moveTo(k * (hw - 6), -30); g.quadraticCurveTo(k * (hw + 44), 150, k * (hw + 20), 300); g.stroke(); g.fillStyle = '#e8473a'; ell(g, k * (hw + 20), 310, 24, 15); g.fill(); } }
    if (L.style === 'bun') { ell(g, 6, -300, 92, 70); g.fillStyle = L.hair; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 5; ell(g, 6, -300, 62, 42); g.stroke(); }
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
    if (L.stub) { const c = L.stubC || '30,22,18'; g.fillStyle = lg(g, 0, 56, 0, 190, [0, `rgba(${c},0)`], [1, `rgba(${c},${0.34 * L.stub})`]); g.fillRect(-300, 56, 600, 320); const r = mulberry32(5); g.fillStyle = `rgba(${c},${0.34 * L.stub})`; for (let i = 0; i < 70; i++) { ell(g, (r() - 0.5) * 2 * hw * 0.9, 120 + r() * 120, 1.7, 1.7); g.fill(); } }
    if (L.oil) { g.fillStyle = 'rgba(28,24,26,0.75)'; g.beginPath(); g.moveTo(92, 44); g.bezierCurveTo(130, 30, 150, 52, 158, 92); g.bezierCurveTo(132, 74, 116, 82, 92, 44); g.fill(); ell(g, 124, 106, 9, 6, 0.4); g.fill(); }
    if (L.lines) { g.strokeStyle = 'rgba(70,40,25,0.42)'; g.lineWidth = 5; g.lineCap = 'round'; for (const y of [-152, -128]) { g.beginPath(); g.moveTo(-104, y); g.quadraticCurveTo(0, y - 12, 104, y); g.stroke(); } for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 52, 88); g.quadraticCurveTo(k * 92, 110, k * 96, 150); g.stroke(); g.beginPath(); g.moveTo(k * (ex + 26), ey + 40); g.quadraticCurveTo(k * ex, ey + 60, k * (ex - 34), ey + 46); g.stroke(); } }
    g.restore();
    const my = 118 + drop * 0.2;
    mouth(g, my, op, { lip: L.lip || '#83503f', line: L.lip ? '#7c2830' : undefined, lw0: L.lip ? 9 : 6, w0: o.w0 ?? 44, frown: o.frown ?? 0, smile: o.smile ?? 0 });
    if (L.must) {
      const big = L.must === 'thick', th = big ? 24 : 13, w = big ? 62 : 52;
      g.fillStyle = L.must === 'grey' ? '#a8a49d' : L.hair; g.beginPath(); g.moveTo(0, 74); g.bezierCurveTo(-18, 66, -w * 0.72, 70, -w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(-w * 0.7, 74 + th, -24, 76 + th, 0, 84 + th * 0.3); g.bezierCurveTo(24, 76 + th, w * 0.7, 74 + th, w, my - 10 + (big ? 4 : 0)); g.bezierCurveTo(w * 0.72, 70, 18, 66, 0, 74); g.closePath(); g.fill();
    }
    const ny = 44;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 22, ny - 18); g.quadraticCurveTo(k * 31, ny, k * 25, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, k * 13, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    const eo = { ew: L.ew, eh: L.eh, ir: 19, look: o.look, lidW: L.lidW };
    eye(g, -1, -ex, ey, close, eo); eye(g, 1, ex, ey, close, eo);
    g.strokeStyle = L.browC || L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt + (o.worry || 0);
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (ex - 48), ey - 40 + tilt + by0); g.quadraticCurveTo(k * (ex + 6), ey - 60 + by0, k * (ex + 54), ey - 40 - tilt * 0.3 + by0 * 0.4); g.stroke(); }
    g.fillStyle = L.hair;
    if (L.style === 'bun' || L.style === 'braids') {
      g.beginPath(); g.moveTo(-hh, -30); g.bezierCurveTo(-hh - 8, -230, -90, -300, 0, -292); g.bezierCurveTo(90, -300, hh + 8, -230, hh, -30); g.bezierCurveTo(hh - 14, -110, 120, -180, 0, -206); g.bezierCurveTo(-120, -180, -hh + 14, -110, -hh, -30); g.closePath(); g.fill();
      if (o.wet !== 0 && L.style === 'bun') {   // wet strands come loose
        g.strokeStyle = L.hair; g.lineWidth = 8; g.lineCap = 'round';
        for (const [x0, y0, cx, cy, x1, y1] of [[-150, -130, -196, -30, -176, 70], [150, -130, 198, -40, 182, 54], [-96, -190, -142, -110, -128, -44]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); }
      }
    } else if (L.style === 'crop') {
      g.beginPath(); g.moveTo(-hh, -44); g.bezierCurveTo(-hh - 10, -226, -96, -292, 6, -290); g.bezierCurveTo(128, -292, hh + 12, -226, hh, -44);
      g.bezierCurveTo(hh - 12, -112, 160, -150, 128, -176); g.lineTo(104, -148); g.lineTo(84, -188); g.lineTo(52, -152); g.lineTo(26, -196); g.lineTo(-8, -156); g.lineTo(-38, -196); g.lineTo(-70, -156); g.lineTo(-100, -186); g.bezierCurveTo(-136, -160, -hh + 16, -118, -hh, -44); g.closePath(); g.fill();
    } else if (L.style === 'bald') {
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * hh, -36); g.bezierCurveTo(k * (hh + 12), -120, k * (hh - 8), -170, k * (hh - 44), -196); g.bezierCurveTo(k * (hh - 44), -130, k * (hh - 24), -80, k * hh, -36); g.fill(); }
    }
    if (L.ear) { for (const k of [-1, 1]) { ell(g, k * (hw + 2), 26, 9, 9); g.fillStyle = '#e4bd55'; g.fill(); } }
    if (L.specs) {
      g.strokeStyle = '#2a2320'; g.lineWidth = 7;
      for (const k of [-1, 1]) { g.fillStyle = 'rgba(255,255,255,0.1)'; R(g, k * ex - 66, ey - 46, 132, 92, 34); g.fill(); g.stroke(); }
      g.beginPath(); g.moveTo(-ex + 66, ey - 8); g.quadraticCurveTo(0, ey - 22, ex - 66, ey - 8); g.moveTo(-ex - 66, ey - 10); g.lineTo(-hw, ey - 16); g.moveTo(ex + 66, ey - 10); g.lineTo(hw, ey - 16); g.stroke();
    }
    if (o.beads) wetBeads(g, o.beads, 16, hw);
  }
  // from the chest up: a white coat and a stethoscope, or an orange boiler suit
  function bust(g, L, o = {}) {
    const by = 168, kind = o.kind;
    const body = () => { g.beginPath(); g.moveTo(-350, by + 900); g.lineTo(-350, by + 330); g.bezierCurveTo(-340, by + 170, -230, by + 120, -96, by + 90); g.lineTo(96, by + 90); g.bezierCurveTo(230, by + 120, 340, by + 170, 350, by + 330); g.lineTo(350, by + 900); g.closePath(); };
    if (kind === 'coat') {
      body(); g.fillStyle = '#16a79c'; g.fill();                                                        // scrubs
      g.fillStyle = lg(g, -340, by, 340, by + 500, [0, '#ffffff'], [1, '#dfe7ec']);
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 350, by + 900); g.lineTo(k * 350, by + 330); g.bezierCurveTo(k * 340, by + 170, k * 230, by + 120, k * 110, by + 92); g.lineTo(k * 64, by + 220); g.lineTo(k * 70, by + 900); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(30,60,80,0.22)'; g.lineWidth = 5; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 110, by + 92); g.lineTo(k * 64, by + 220); g.lineTo(k * 70, by + 900); g.stroke(); }
      g.strokeStyle = '#26323c'; g.lineWidth = 13; g.lineCap = 'round'; g.beginPath(); g.moveTo(-104, by + 96); g.bezierCurveTo(-120, by + 250, -30, by + 330, 12, by + 356); g.moveTo(104, by + 96); g.bezierCurveTo(120, by + 250, 40, by + 330, 12, by + 356); g.stroke();
      ell(g, 12, by + 390, 30, 30); g.fillStyle = '#b9c3cc'; g.fill(); g.strokeStyle = '#26323c'; g.lineWidth = 8; g.stroke();
    } else if (kind === 'suit') {
      body(); g.fillStyle = lg(g, -340, by, 340, by + 500, [0, '#fb8b2c'], [1, '#d7621a']); g.fill();
      g.fillStyle = '#c4551a'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 92, by + 80); g.lineTo(k * 14, by + 210); g.lineTo(k * 84, by + 226); g.lineTo(k * 178, by + 104); g.closePath(); g.fill(); }
      g.strokeStyle = '#8f3f12'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, by + 200); g.lineTo(0, by + 900); g.stroke();
      g.fillStyle = 'rgba(28,24,26,0.5)'; ell(g, 190, by + 240, 40, 22, 0.5); g.fill();
    } else if (o.body) { body(); g.fillStyle = o.body; g.fill(); }
    const nw = 70;
    g.fillStyle = lg(g, -80, 0, 80, 0, [0, L.skinD], [0.55, L.skin], [1, L.skinD]);
    g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 8, by + 110); g.quadraticCurveTo(0, by + 200, nw + 8, by + 110); g.lineTo(nw, 120); g.closePath(); g.fill();
    g.fillStyle = 'rgba(70,35,20,0.28)'; g.beginPath(); g.moveTo(-nw, 150); g.quadraticCurveTo(0, 235, nw, 150); g.lineTo(nw, 120); g.lineTo(-nw, 120); g.closePath(); g.fill();
    g.save(); g.rotate(o.roll || 0); head(g, L, o); g.restore();
  }

  // ------------------------------------------------------------------ the water
  function wave(x, t, level, seed) { return level + Math.sin(x * 0.012 + t * 2.1 + seed) * 8 + Math.sin(x * 0.031 - t * 3.2 + seed * 2) * 4; }
  function waterPath(g, w, h, t, level, seed) { g.beginPath(); g.moveTo(-10, h + 10); g.lineTo(-10, wave(-10, t, level, seed)); for (let x = 0; x <= w + 10; x += 12) g.lineTo(x, wave(x, t, level, seed)); g.lineTo(w + 10, h + 10); g.closePath(); }
  function waterBack(g, w, h, t, level, seed) { waterPath(g, w, h, t * 0.8, level - 16, seed + 2); g.fillStyle = '#7fe0ec'; g.fill(); }
  function waterFront(g, w, h, t, level, seed) {
    waterPath(g, w, h, t, level, seed); g.fillStyle = lg(g, 0, level, 0, level + 260, [0, 'rgba(47,203,224,0.92)'], [1, 'rgba(14,134,178,0.97)']); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); for (let x = 0; x <= w + 10; x += 12) { const y = wave(x, t, level, seed); if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 4; g.lineCap = 'round';
    const r = mulberry32(seed * 97 + 3); for (let i = 0; i < 9; i++) { const x = r() * w, y = level + 40 + r() * 120, l = 26 + r() * 50; g.beginPath(); g.moveTo(x + Math.sin(t * 1.3 + i) * 10, y); g.lineTo(x + l + Math.sin(t * 1.3 + i) * 10, y); g.stroke(); }
  }
  function drops(g, w, h, t, seed, x0, x1, top, level, n = 16) {
    const r = mulberry32(seed);
    for (let i = 0; i < n; i++) {
      const sp = 0.7 + r() * 0.6, ph = r(), x = lerp(x0, x1, r()), s = 4 + r() * 6, u = (t * sp + ph) % 1, y = lerp(top, level + 8, u * u);
      g.fillStyle = 'rgba(190,240,250,0.95)'; g.beginPath(); g.moveTo(x, y - s * 2.1); g.quadraticCurveTo(x + s, y, x, y + s); g.quadraticCurveTo(x - s, y, x, y - s * 2.1); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.95)'; ell(g, x - s * 0.3, y, s * 0.28, s * 0.4); g.fill();
    }
  }

  // ------------------------------------------------------------------ the photo on both walls: taken from above, by the ship
  function photoScene(g, w, h, t, o = {}) {
    // deck planks
    g.fillStyle = '#e8b878'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,70,30,0.32)'; g.lineWidth = Math.max(1, h * 0.006); for (let i = 1; i < 11; i++) { g.beginPath(); g.moveTo(0, h * i / 11); g.lineTo(w, h * i / 11); g.stroke(); }
    // the crowd, in a ring, looking up
    const r = mulberry32(61), cols = ['#3e6fb0', '#e0543f', '#2c9b86', '#e8a22a', '#8b5fb8', '#d84f86', '#5a6b78'];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * TAU + r() * 0.1, d = 0.62 + r() * 0.3, x = w / 2 + Math.cos(a) * w * 0.5 * d, y = h * 0.52 + Math.sin(a) * h * 0.46 * d, s = h * 0.052 * (0.85 + r() * 0.3);
      const hop = Math.sin(t * 7 + i * 1.7) * s * 0.12 * (o.live ?? 0);
      g.fillStyle = cols[i % cols.length]; ell(g, x, y + s * 0.9 + hop, s * 1.05, s * 0.8); g.fill();
      g.fillStyle = ['#c58c64', '#b47c56', '#a06c48', '#d09a72'][i % 4]; ell(g, x, y + hop, s * 0.72, s * 0.72); g.fill();
      g.fillStyle = '#1a1411'; ell(g, x, y - s * 0.34 + hop, s * 0.7, s * 0.42); g.fill();
    }
    // garlands strung across
    g.strokeStyle = '#f0872a'; g.lineWidth = h * 0.012;
    for (const yy of [0.1, 0.9]) { g.beginPath(); g.moveTo(0, h * yy); g.quadraticCurveTo(w / 2, h * (yy + (yy < 0.5 ? 0.1 : -0.1)), w, h * yy); g.stroke(); }
    if (o.couple !== false) {
      // bride and groom, from above, faces turned up to you, waving
      const s = h / 1000;
      g.save(); g.translate(w / 2 - 190 * s, h * 0.5); g.scale(s * 0.68, s * 0.68); bust(g, MEERA, { body: '#d32f3a', smile: 1, op: 0, look: [0, -6], wet: 0, w0: 58, roll: 0.09, worry: 2, browY: -6 }); garland(g, 0, 250); g.restore();
      g.save(); g.translate(w / 2 + 190 * s, h * 0.5); g.scale(s * 0.72, s * 0.72); bust(g, { ...RAVI, oil: false, stub: 0 }, { body: '#f4e7c8', smile: 1, op: 0, look: [0, -6], w0: 58, roll: -0.09, worry: 4, browY: -6 }); garland(g, 0, 250); g.restore();
    }
  }
  function garland(g, x, y) { for (let i = 0; i < 15; i++) { const a = Math.PI * (i / 14), px = x + Math.cos(a) * 124, py = y + Math.sin(a) * 120 - 40; ell(g, px, py, 19, 19); g.fillStyle = i % 2 ? '#f3932b' : '#ffd043'; g.fill(); } }
  function framedPhoto(g, x, y, w, h, t, o = {}) {
    g.save(); g.translate(x, y); g.rotate(o.rot ?? 0);
    g.fillStyle = 'rgba(0,0,0,0.18)'; R(g, -w / 2 - 6, -h / 2 - 2, w + 20, h + 20, 6); g.fill();
    g.fillStyle = '#7a4a24'; R(g, -w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 6); g.fill();
    g.save(); R(g, -w / 2, -h / 2, w, h, 3); g.clip(); g.translate(-w / 2, -h / 2); photoScene(g, w, h, t); g.restore();
    g.restore();
  }

  // ------------------------------------------------------------------ the two rooms, in feed space (1000 x 530)
  const FW = 1000, FH = 530;
  const PH1 = { x: 690, y: 124, w: 150, h: 112, rot: -0.02 }, PH2 = { x: 322, y: 134, w: 150, h: 112, rot: 0.03 };
  const HD1 = { x: 440, y: 262, s: 0.76 }, HD2 = { x: 620, y: 262, s: 0.76 };
  function door(g, x, y, w, h, tint) {
    R(g, x, y, w, h, 26); g.fillStyle = lg(g, x, y, x + w, y + h, [0, '#8fa3b2'], [1, '#5f7686']); g.fill(); g.strokeStyle = '#3c5262'; g.lineWidth = 10; g.stroke();
    g.fillStyle = '#3c5262'; for (const [px, py] of [[x + 24, y + 24], [x + w - 24, y + 24], [x + 24, y + h - 24], [x + w - 24, y + h - 24], [x + 24, y + h / 2], [x + w - 24, y + h / 2]]) { ell(g, px, py, 8, 8); g.fill(); }
    const cx = x + w / 2, cy = y + h * 0.42; g.strokeStyle = tint || '#d6372a'; g.lineWidth = 16; ell(g, cx, cy, 58, 58); g.stroke(); g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.3; g.beginPath(); g.moveTo(cx - Math.cos(a) * 58, cy - Math.sin(a) * 58); g.lineTo(cx + Math.cos(a) * 58, cy + Math.sin(a) * 58); g.stroke(); }
  }
  function lamp(g, x, y, on, t) { ell(g, x, y, 22, 22); g.fillStyle = on ? (Math.sin(t * 12) > 0 ? '#ff4632' : '#b52a1e') : '#7a2a24'; g.fill(); g.strokeStyle = '#3c5262'; g.lineWidth = 6; g.stroke(); }
  function arm(g, x, y, sleeve, skin, a) { g.lineCap = 'round'; g.strokeStyle = sleeve; g.lineWidth = 70; g.beginPath(); g.moveTo(x, y + 220); g.lineTo(x + 40 * a, y + 40); g.stroke(); ell(g, x + 40 * a, y, 46, 42); g.fillStyle = skin; g.fill(); g.strokeStyle = 'rgba(70,35,20,0.4)'; g.lineWidth = 4; for (let i = -2; i < 2; i++) { g.beginPath(); g.moveTo(x + 40 * a + i * 18 + 8, y - 30); g.lineTo(x + 40 * a + i * 18 + 8, y - 8); g.stroke(); } }
  function roomMeera(g, S) {
    const { t, level } = S;
    g.fillStyle = lg(g, 0, 0, 0, FH, [0, '#ffe7d9'], [1, '#ffd2bd']); g.fillRect(0, 0, FW, FH);
    g.fillStyle = '#7fd2c6'; g.fillRect(0, 0, FW, 30); g.fillRect(0, 360, FW, 12);
    g.fillStyle = '#cfe8e6'; R(g, 24, 132, 136, 220, 10); g.fill(); g.strokeStyle = '#6ea8a6'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#e8473a'; g.fillRect(84, 170, 18, 66); g.fillRect(60, 194, 66, 18);
    door(g, 790, 54, 196, 430, TEAL); lamp(g, 768, 210, true, t);
    framedPhoto(g, PH1.x, PH1.y, PH1.w, PH1.h, 0, { rot: PH1.rot });
    waterBack(g, FW, FH, t, level, 1);
    g.save(); g.translate(HD1.x + (S.dx || 0), HD1.y + (S.dy || 0)); g.scale(HD1.s, HD1.s); bust(g, MEERA, { kind: 'coat', op: S.op, close: S.close, look: S.look, worry: S.worry ?? -14, browY: S.browY, roll: S.roll, beads: 7, frown: S.frown ?? 0.6, smile: S.smile }); g.restore();
    if (S.arm != null) arm(g, 640, lerp(330, 262, S.arm), '#ffffff', MEERA.skin, S.arm);
    waterFront(g, FW, FH, t, level, 1);
    drops(g, FW, FH, S.td ?? t, 11, 770, 830, 60, level, 18);
    if (S.prop !== false) { g.save(); g.translate(150 + Math.sin(t * 0.8) * 20, level + 6 + Math.sin(t * 1.5) * 5); g.rotate(-0.2 + Math.sin(t) * 0.05); g.fillStyle = '#b98a58'; R(g, -48, -14, 96, 22, 4); g.fill(); g.fillStyle = '#fff'; g.fillRect(-36, -18, 72, 10); g.restore(); }
  }
  function roomRavi(g, S) {
    const { t, level } = S;
    g.fillStyle = lg(g, 0, 0, 0, FH, [0, '#ffd978'], [1, '#ffc14f']); g.fillRect(0, 0, FW, FH);
    g.lineCap = 'butt'; g.strokeStyle = '#2d6b8a'; g.lineWidth = 30; g.beginPath(); g.moveTo(-10, 36); g.lineTo(FW + 10, 36); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-10, 29); g.lineTo(FW + 10, 29); g.stroke();
    g.strokeStyle = '#2d6b8a'; g.lineWidth = 26; g.beginPath(); g.moveTo(870, 36); g.lineTo(870, 540); g.moveTo(955, 36); g.lineTo(955, 540); g.stroke();
    for (const x of [120, 500, 740]) { g.fillStyle = '#1f4f68'; g.fillRect(x, 18, 22, 36); }
    ell(g, 912, 220, 58, 58); g.fillStyle = PAPER; g.fill(); g.strokeStyle = '#1f4f68'; g.lineWidth = 12; g.stroke(); g.strokeStyle = RED; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(912, 220); g.lineTo(912 + 42 * Math.cos(-0.5 + Math.sin(t * 9) * 0.2), 220 + 42 * Math.sin(-0.5 + Math.sin(t * 9) * 0.2)); g.stroke();
    door(g, 30, 74, 186, 420, ORG); lamp(g, 236, 262, true, t + 0.3);
    framedPhoto(g, PH2.x, PH2.y, PH2.w, PH2.h, 0, { rot: PH2.rot });
    waterBack(g, FW, FH, t, level, 4);
    g.save(); g.translate(HD2.x + (S.dx || 0), HD2.y + (S.dy || 0)); g.scale(HD2.s, HD2.s); bust(g, RAVI, { kind: 'suit', op: S.op, close: S.close, look: S.look, worry: S.worry ?? -14, browY: S.browY, roll: S.roll, beads: 9, frown: S.frown ?? 0.6, smile: S.smile }); g.restore();
    if (S.arm != null) arm(g, 400, lerp(330, 262, S.arm), '#ee7a22', RAVI.skin, -S.arm);
    waterFront(g, FW, FH, t, level, 4);
    drops(g, FW, FH, S.td ?? t, 23, 200, 250, 96, level, 18);
    if (S.prop !== false) { g.save(); g.translate(800 + Math.sin(t * 0.7) * 24, level + 8 + Math.sin(t * 1.4) * 5); g.rotate(0.15 + Math.sin(t) * 0.05); g.fillStyle = '#3a3531'; R(g, -44, -24, 60, 42, 10); g.fill(); R(g, -44, 2, 92, 20, 8); g.fill(); g.restore(); }
  }
  function feed(g, x, y, w, h, draw, S, o = {}) {
    const k = w / FW, hh = h / k;
    g.save(); g.translate(x, y); g.scale(k, k);
    g.save(); R(g, 0, 0, FW, hh, 30); g.clip();
    g.fillStyle = '#0e86b2'; g.fillRect(0, 0, FW, hh);
    if (o.zoom) { g.translate(o.zoom.cx, o.zoom.cy); g.scale(o.zoom.s, o.zoom.s); g.translate(-o.zoom.fx, -o.zoom.fy); }
    draw(g, S);
    g.restore();
    g.strokeStyle = NAVY; g.lineWidth = 12; R(g, 0, 0, FW, hh, 30); g.stroke();
    if (o.cam) { const rec = o.rec !== false; g.fillStyle = 'rgba(16,32,44,0.72)'; R(g, FW - 214, 18, 192, 44, 12); g.fill(); ell(g, FW - 192, 40, 9, 9); g.fillStyle = rec ? '#ff4632' : '#7a2a24'; g.fill(); txt(g, o.cam, FW - 174, 53, 34, '#fff', { kind: 'mono' }); }
    g.restore();
  }
  function noSignal(g, x, y, w, h, t) {
    g.save(); R(g, x, y, w, h, 26); g.clip();
    g.fillStyle = '#20262c'; g.fillRect(x, y, w, h);
    const r = mulberry32(5000 + Math.round(t * 30));
    for (let i = 0; i < 900; i++) { const v = 90 + r() * 165, px = x + r() * w, py = y + r() * h, ww = 3 + r() * 16; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(px, py, ww, 3 + r() * 3); }
    g.fillStyle = 'rgba(20,26,32,0.55)'; g.fillRect(x, y, w, h);
    g.restore();
    txt(g, 'NO SIGNAL', x + w / 2, y + h / 2 + 34, 104, '#fff', { align: 'center', stroke: 'rgba(16,32,44,0.9)', sw: 0.1 });
    g.strokeStyle = NAVY; g.lineWidth = 12; R(g, x, y, w, h, 26); g.stroke();
  }
  function plate(g, x, y, n, word, col, o = {}) {
    const s = o.s ?? 1;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.font = font(86); const w = g.measureText(word).width + 150;
    g.fillStyle = 'rgba(16,32,44,0.22)'; R(g, 5, 7, w, 104, 20); g.fill();
    g.fillStyle = PAPER; R(g, 0, 0, w, 104, 20); g.fill(); g.strokeStyle = NAVY; g.lineWidth = 7; g.stroke();
    ell(g, 56, 52, 40, 40); g.fillStyle = col; g.fill(); txt(g, String(n), 56, 80, 76, '#fff', { align: 'center' });
    txt(g, word, 116, 84, 86, NAVY);
    g.restore();
  }
  function band(g, s, x, y, size, bg, fg, q = 1, rot = -0.03) {
    g.save(); g.translate(x, y); g.rotate(rot); const sc = lerp(1.5, 1, clamp(q)); g.scale(sc, sc); g.globalAlpha *= clamp(q * 4);
    g.font = font(size); const w = g.measureText(s).width + size * 0.7;
    R(g, -w / 2, -size * 0.62, w, size * 1.2, size * 0.17); g.fillStyle = bg; g.fill(); g.strokeStyle = PAPER; g.lineWidth = size * 0.075; g.stroke();
    txt(g, s, 0, size * 0.34, size, fg, { align: 'center' });
    g.restore();
  }
  function bubble(g, s, x, y, size, q, side = 1, col = PAPER, ink = NAVY) {
    if (q <= 0) return;
    const L = Array.isArray(s) ? s : [s];
    g.save(); g.translate(x, y); const sc = lerp(0.4, 1, clamp(q)); g.scale(sc, sc); g.globalAlpha *= clamp(q * 4);
    g.font = font(size); const w = Math.max(...L.map((u) => g.measureText(u).width)) + size * 0.8, h = size * (0.42 + 0.98 * L.length);
    g.fillStyle = col; g.strokeStyle = NAVY; g.lineWidth = Math.max(4, size * 0.09); g.lineJoin = 'round';
    g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, size * 0.46); g.fill(); g.stroke();
    const tx = side * w * 0.26; g.beginPath(); g.moveTo(tx - side * size * 0.3, h / 2 - 3); g.lineTo(tx + side * size * 0.5, h / 2 + size * 0.46); g.lineTo(tx + side * size * 0.42, h / 2 - 3); g.fill(); g.stroke();
    g.fillRect(Math.min(tx - side * size * 0.3, tx + side * size * 0.42) + 3, h / 2 - 9, Math.abs(size * 0.72) - 6, 10);
    L.forEach((u, i) => txt(g, u, 0, -h / 2 + size * 0.98 * (i + 1) + size * 0.02, size, i === 0 && L.length > 1 ? RED : ink, { align: 'center' }));
    g.restore();
  }
  function tag(g, s, x, y, size, bg = RED, fg = '#fff') { g.font = font(size); const w = g.measureText(s).width + size * 0.7; R(g, x, y, w, size * 1.22, 14); g.fillStyle = bg; g.fill(); g.strokeStyle = PAPER; g.lineWidth = 6; g.stroke(); txt(g, s, x + size * 0.35, y + size * 0.96, size, fg); }

  // ------------------------------------------------------------------ the counter and the frozen second
  function wheel(g, x, y, w, h, v) {
    g.save(); R(g, x, y, w, h, 10); g.clip();
    g.fillStyle = lg(g, x, y, x, y + h, [0, '#dfe4e6'], [0.5, '#ffffff'], [1, '#dfe4e6']); g.fillRect(x, y, w, h);
    const base = Math.floor(v), f = v - base;
    for (let k = 0; k <= 1; k++) txt(g, String((base + k) % 10), x + w / 2, y + h * 0.84 + (k - f) * h, h * 0.92, NAVY, { align: 'center' });
    g.fillStyle = lg(g, x, y, x, y + h, [0, 'rgba(16,32,44,0.32)'], [0.28, 'rgba(16,32,44,0)'], [0.72, 'rgba(16,32,44,0)'], [1, 'rgba(16,32,44,0.32)']); g.fillRect(x, y, w, h);
    g.restore();
    g.strokeStyle = NAVY; g.lineWidth = 5; R(g, x, y, w, h, 10); g.stroke();
  }
  function odometer(n) { const out = []; for (const p of [1000, 100, 10, 1]) { const base = Math.floor(n / p) % 10, fr = p === 1 ? n % 1 : Math.max(0, (n % p) - (p - 1)); out.push(base + fr); } return out; }
  const CX = 50, CY = 284;
  function counter(g, n) {
    const h = 110, w = 88, wy = CY + 13;
    g.save();
    g.fillStyle = 'rgba(16,32,44,0.25)'; R(g, CX + 5, CY + 7, 800, 136, 24); g.fill();
    g.fillStyle = NAVY; R(g, CX, CY, 800, 136, 24); g.fill();
    const d = odometer(Math.max(0, n)), x0 = CX + 16;
    wheel(g, x0, wy, w, h, d[0]);
    txt(g, ',', x0 + w + 8, wy + 100, 96, PAPER);
    for (let i = 1; i < 4; i++) wheel(g, x0 + w + 32 + (i - 1) * (w + 8), wy, w, h, d[i]);
    const tx = x0 + 4 * w + 2 * 8 + 32 + 22;
    txt(g, 'PEOPLE LEFT', tx, CY + 66, 66, YEL); txt(g, 'ON EARTH', tx, CY + 122, 54, PAPER);
    g.restore();
  }
  function hud(g, t, n) {
    counter(g, n);
    if (t >= times().ship) { R(g, 860, 292, 92, 124, 16); g.fillStyle = RED; g.fill(); g.strokeStyle = PAPER; g.lineWidth = 6; g.stroke(); txt(g, '1', 906, 372, 92, '#fff', { align: 'center' }); txt(g, 'SEC LEFT', 906, 402, 22, '#fff', { align: 'center', kind: 'semi' }); }
  }
  function countDisc(g, n, q) { ell(g, 504, 986, 124, 124); g.fillStyle = 'rgba(16,32,44,0.3)'; g.fill(); g.save(); g.translate(500, 980); const s = lerp(1.35, 1, q); g.scale(s, s); ell(g, 0, 0, 120, 120); g.fillStyle = RED; g.fill(); g.strokeStyle = PAPER; g.lineWidth = 13; g.stroke(); txt(g, String(n), 0, 70, 196, '#fff', { align: 'center' }); g.restore(); }

  function surround(g) {
    g.fillStyle = YEL; g.fillRect(0, 0, W, H);
    const bar = (y0, y1) => { g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.clip(); g.fillStyle = NAVY; for (let x = -200; x < W + 200; x += 120) { g.beginPath(); g.moveTo(x, y1); g.lineTo(x + 60, y1); g.lineTo(x + 60 + (y1 - y0), y0); g.lineTo(x + (y1 - y0), y0); g.closePath(); g.fill(); } g.restore(); };
    bar(214, 262); bar(1544, 1592);
  }

  // ------------------------------------------------------------------ timing
  const memo = {};
  function times() {
    if (memo.T) return memo.T;
    const at = (p) => words(p)[0].t0, en = (p) => words(p)[words(p).length - 1].t1, wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;
    const T = { at, en, wi };
    T.count0 = en('n02') + 0.05; T.freeze = en('r01') + 0.12; T.step = (T.freeze - T.count0) / 4; T.end = tb('end');
    T.parents0 = at('n02') - 0.06; T.parents1 = wi('n02', 9) - 0.06;
    T.stop = at('n04'); T.its = wi('n04', 8);
    T.ship = at('n05') - 0.12; T.you = wi('n05', 0); T.callU = wi('n05', 12);
    T.degree = at('n07') - 0.14; T.degW = wi('n07', 9);
    T.power = at('n06') - 0.1; T.most = wi('n06', 11);
    T.if1 = at('n10') - 0.12; T.tara = wi('n10', 11) - 0.06; T.dark = wi('n10', 20) - 0.06;
    T.photo = at('n08') - 0.12; T.nameM = wi('n08', 1); T.nameR = wi('n08', 3); T.ring = wi('n08', 5) - 0.05; T.merge = wi('n08', 7) - 0.08; T.nM = T.merge + 0.45; T.nR = T.nM + 0.2;
    T.scan = at('n09') - 0.14;
    T.if2 = at('n11') - 0.12; T.safeW = wi('n11', 3); T.ship2 = wi('n11', 2) - 0.1; T.cot = wi('n11', 5) - 0.08; T.old = wi('n11', 10) - 0.08;
    T.last = at('n12') - 0.14;
    memo.T = T; return T;
  }
  function talkP(t, pid, amp = 0.3) {
    for (const w of words(pid)) if (t >= w.t0 && t <= w.t1) {
      const syl = Math.max(1, (w.w.toLowerCase().match(/[aeiouy]+/g) || []).length), u = (t - w.t0) / Math.max(0.05, w.t1 - w.t0), v = 0.6 + 0.4 * Math.abs(Math.sin(w.t0 * 37.1));
      return 0.05 + amp * v * Math.pow(Math.abs(Math.sin(Math.PI * u * syl)), 0.8);
    }
    return 0;
  }

  // ================================================================ the feeds: what you, the ship, see
  const F1 = { x: 40, y: 430, w: 1000, h: 530 }, F2 = { x: 40, y: 1000, w: 1000, h: 530 };
  function twoFeeds(g, t, o = {}) {
    const T = times(), tw = Math.min(t, T.freeze), f1 = o.f1 || F1, f2 = o.f2 || F2, level = lerp(476, 432, sstep(0, T.freeze, tw));
    const b1 = Math.sin(tw * 13) > 0.4 ? 0.2 : 0, b2 = Math.sin(tw * 11 + 1) > 0.4 ? 0.2 : 0;
    feed(g, f1.x, f1.y, f1.w, f1.h, roomMeera, { t: tw, level, op: 0.26 + b1 + talkP(tw, 'm01', 0.42), look: [0, -7], arm: 0.5 + 0.5 * Math.sin(tw * 9) }, o.z ? { cam: 'CAM 12', zoom: { cx: HD1.x, cy: 265, s: o.z, fx: HD1.x, fy: 265 } } : { cam: 'CAM 12' });
    feed(g, f2.x, f2.y, f2.w, f2.h, roomRavi, { t: tw + 0.7, level: level + 4, op: 0.3 + b2 + talkP(tw, 'r01', 0.42), look: [0, -7], arm: 0.5 + 0.5 * Math.sin(tw * 10 + 2) }, o.z ? { cam: 'CAM 41', zoom: { cx: HD2.x, cy: 265, s: o.z, fx: HD2.x, fy: 265 } } : { cam: 'CAM 41' });
  }
  const P1 = { x: F1.x + 24, y: F1.y + 24, s: 0.86 }, P2 = { x: F2.x + 34, y: F2.y + 412, s: 0.86 };
  function plates(g, a, b) { plate(g, P1.x, P1.y, 1, a, TEAL, { s: P1.s }); plate(g, P2.x, P2.y, 2, b, ORG, { s: P2.s }); }

  // 0 to the freeze and just after: frame 0, your parents, the count, "Stop"
  function shotOpen(g, t) {
    const T = times(), z = 1 + 0.035 * sstep(T.freeze, T.ship, t);
    surround(g);
    g.save(); g.translate(500, 980); g.scale(z, z); g.translate(-500, -980);
    twoFeeds(g, t);
    plates(g, 'DOCTOR', 'ENGINEER');
    if (t < T.count0) band(g, 'SAVE ONE', 500, 980, 122, RED, '#fff');
    else if (t < T.freeze) { const i = Math.floor((t - T.count0) / T.step); countDisc(g, 5 - i, pop(t, T.count0 + i * T.step)); }
    else { countDisc(g, 1, 1); if (t >= T.stop && t < T.its - 0.05) band(g, 'STOP', 500, 980, 150, RED, '#fff', pop(t, T.stop)); }
    shouts(g, t);
    g.restore();
    const kc = pop(t, 1.15);
    if (kc > 0.002) { g.save(); g.globalAlpha *= clamp(kc * 3); g.translate(0, lerp(-46, 0, kc)); hud(g, t, 1000); g.restore(); }
  }
  function shouts(g, t) {
    const T = times(), tb1 = T.at('m01'), tb2 = T.at('r01');
    if (t >= tb1) bubble(g, ['AMMA!', 'OPEN HIS!'], 730, F1.y + 318, 76, pop(t, tb1), -1);
    if (t >= tb2) bubble(g, ['AMMA!', 'OPEN HERS!'], 300, F2.y + 300, 76, pop(t, tb2), 1);
  }

  // "Your parents have been asking you this for years"
  function shotParents(g, t) {
    const T = times(), u = (t - T.parents0);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#ffdca3'], [1, '#ffc97e']); g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffe9c4'; R(g, 372, 330, 340, 300, 12); g.fill(); g.strokeStyle = '#b8763c'; g.lineWidth = 12; g.stroke(); g.beginPath(); g.moveTo(542, 330); g.lineTo(542, 630); g.moveTo(372, 480); g.lineTo(712, 480); g.stroke();
    // they lean in, one after the other
    const k1 = pop(t, T.parents0 + 0.05), k2 = pop(t, T.parents0 + 0.22);
    g.save(); g.translate(292, lerp(1100, 860, k1)); g.scale(1.04, 1.04); bust(g, AMMA, { body: '#2f8f7f', op: 0.1 + 0.16 * Math.abs(Math.sin(u * 9)), look: [10, 2], worry: 6, browY: -6, wet: 0 }); g.restore();
    g.save(); g.translate(776, lerp(1100, 880, k2)); g.scale(1.04, 1.04); bust(g, APPA, { body: '#e7e0cf', op: 0.1 + 0.14 * Math.abs(Math.sin(u * 7 + 2)), look: [-10, 2], worry: 6, browY: -6 }); g.restore();
    // the table
    g.fillStyle = lg(g, 0, 1280, 0, 1560, [0, '#c98443'], [1, '#a4652c']); g.fillRect(0, 1280, W, 700); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(0, 1280, W, 12);
    // what each holds up
    g.save(); g.translate(120, lerp(1500, 1040, k1)); g.rotate(-0.1);
    g.strokeStyle = '#26323c'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-36, -128); g.quadraticCurveTo(-34, -58, 0, -36); g.quadraticCurveTo(34, -58, 36, -128); g.stroke();
    g.lineWidth = 15; g.beginPath(); g.moveTo(0, -36); g.lineTo(0, 92); g.quadraticCurveTo(2, 148, 44, 158); g.stroke();
    for (const k of [-1, 1]) { ell(g, k * 36, -134, 11, 11); g.fillStyle = '#b9c3cc'; g.fill(); }
    ell(g, 66, 164, 36, 36); g.fillStyle = '#b9c3cc'; g.fill(); g.strokeStyle = '#26323c'; g.lineWidth = 9; g.stroke(); ell(g, 66, 164, 16, 16); g.fillStyle = '#7f8c96'; g.fill();
    ell(g, -4, 40, 58, 46); g.fillStyle = AMMA.skin; g.fill(); g.restore();
    g.save(); g.translate(948, lerp(1500, 1020, k2)); g.rotate(0.2);
    g.fillStyle = '#9aa7b0'; g.strokeStyle = '#3c5262'; g.lineWidth = 7; R(g, -22, -120, 44, 270, 10); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -150, 62, 0.6, TAU - 0.6 - Math.PI * 0 ); g.lineTo(0, -150); g.closePath(); g.fill(); g.stroke(); ell(g, 0, 168, 62, 44); g.fillStyle = APPA.skin; g.fill(); g.restore();
    band(g, 'DOCTOR OR ENGINEER?', 490, 1380, 112, NAVY, YEL, pop(t, T.parents0 + 0.35));
  }

  // ------------------------------------------------------------------ the ship, drawn once
  let SHIP = null;
  const ROOM_A = { x: 176, y: 1226, w: 158, h: 84 }, ROOM_B = { x: 768, y: 1226, w: 158, h: 84 };
  function makeShip() {
    const c = offscreen(W, H), g = c.getContext('2d'), rooms = [];
    g.fillStyle = lg(g, 0, 0, 0, 1130, [0, '#38b6f2'], [0.65, '#9fe0fb'], [1, '#e8f9ff']); g.fillRect(0, 0, W, 1130);
    g.fillStyle = rg(g, 900, 560, 40, 260, [0, 'rgba(255,245,180,1)'], [0.25, 'rgba(255,236,150,0.75)'], [1, 'rgba(255,236,150,0)']); g.fillRect(600, 260, 560, 560);
    g.fillStyle = 'rgba(255,255,255,0.9)'; for (const [x, y, s] of [[160, 640, 1], [760, 470, 0.7], [980, 740, 0.8]]) { for (const [dx, dy, r] of [[-70, 0, 38], [-20, -22, 52], [44, -6, 42], [92, 8, 28]]) { ell(g, x + dx * s, y + dy * s, r * s, r * s); g.fill(); } g.fillRect(x - 100 * s, y, 216 * s, 24 * s); }
    g.fillStyle = lg(g, 0, 1130, 0, H, [0, '#1fb3d0'], [0.55, '#0d7fae'], [1, '#07517f']); g.fillRect(0, 1130, W, H - 1130);
    const r = mulberry32(31), pg = ['#3e6fb0', '#e0543f', '#2c9b86', '#e8a22a', '#8b5fb8', '#d84f86', '#5a6b78', '#c0552a'];
    const peg = (x, y, s) => { g.fillStyle = pg[Math.floor(r() * pg.length)]; R(g, x - 7 * s, y - 15 * s, 14 * s, 24 * s, 6 * s); g.fill(); g.fillStyle = ['#c58c64', '#b47c56', '#a06c48', '#d09a72'][Math.floor(r() * 4)]; ell(g, x, y - 22 * s, 7 * s, 7 * s); g.fill(); g.fillStyle = '#1a1411'; ell(g, x, y - 26 * s, 6.6 * s, 4 * s); g.fill(); };
    const pal = ['#ffe9c4', '#ffdcb0', '#fff3d9', '#ffd7c2', '#e9f5d8', '#d9f0f5', '#ffe2ea'];
    const roomsRow = (x0, x1, y, h, wMin, wMax, skip) => { let x = x0, i = 0; while (x < x1 - 30) { const w = Math.min(wMin + r() * (wMax - wMin), x1 - x); if (!(skip && skip(x, w))) { g.fillStyle = pal[Math.floor(r() * pal.length)]; R(g, x, y, w - 6, h, 5); g.fill(); g.strokeStyle = 'rgba(16,48,73,0.45)'; g.lineWidth = 3; g.stroke(); rooms.push({ x, y, w: w - 6, h }); const n = 2 + Math.floor(r() * 3); for (let k = 0; k < n; k++) peg(x + 12 + (k + 0.5) * ((w - 28) / n), y + h - 12, 1.0 + r() * 0.15); } x += w; i++; } };
    // the mast and the radio, the funnel
    g.strokeStyle = '#3c5262'; g.lineWidth = 9; g.beginPath(); g.moveTo(420, 540); g.lineTo(420, 450); g.stroke(); g.lineWidth = 5; for (const y of [462, 482, 502]) { g.beginPath(); g.moveTo(400, y); g.lineTo(440, y); g.stroke(); } ell(g, 420, 450, 9, 9); g.fillStyle = RED; g.fill();
    g.fillStyle = lg(g, 650, 0, 740, 0, [0, '#ffcf33'], [1, '#e8a412']); g.beginPath(); g.moveTo(640, 660); g.lineTo(652, 470); g.lineTo(738, 470); g.lineTo(750, 660); g.closePath(); g.fill(); g.fillStyle = NAVY; g.fillRect(650, 470, 90, 26); g.fillStyle = RED; g.fillRect(644, 560, 102, 28);
    // superstructure
    g.fillStyle = '#f8f7f2'; g.strokeStyle = NAVY; g.lineWidth = 7; R(g, 340, 540, 300, 130, 14); g.fill(); g.stroke(); R(g, 230, 668, 620, 110, 8); g.fill(); g.stroke(); R(g, 196, 776, 700, 112, 8); g.fill(); g.stroke();
    g.fillStyle = '#7fd2e6'; R(g, 360, 556, 260, 44, 10); g.fill(); g.strokeStyle = NAVY; g.lineWidth = 4; g.stroke();
    roomsRow(244, 840, 684, 84, 74, 104); roomsRow(212, 884, 792, 84, 74, 104);
    // the hull: open along the left, the name on the bow
    const hull = () => { g.beginPath(); g.moveTo(52, 884); g.lineTo(1050, 884); g.bezierCurveTo(1036, 1040, 1000, 1240, 960, 1338); g.lineTo(136, 1338); g.bezierCurveTo(92, 1240, 64, 1040, 52, 884); g.closePath(); };
    hull(); g.fillStyle = lg(g, 0, 884, 0, 1338, [0, '#ef5032'], [1, '#c9331f']); g.fill();
    g.save(); hull(); g.clip();
    const row2 = (x, w) => x + w > 640;
    roomsRow(92, 640, 900, 92, 76, 104); roomsRow(110, 640, 1006, 92, 76, 104);
    roomsRow(128, 952, 1116, 92, 78, 110);
    roomsRow(150, 950, 1226, 92, 82, 118, (x, w) => (x < ROOM_A.x + ROOM_A.w && x + w > ROOM_A.x) || (x < ROOM_B.x + ROOM_B.w && x + w > ROOM_B.x));
    g.restore();
    hull(); g.strokeStyle = NAVY; g.lineWidth = 10; g.stroke();
    g.font = font(150); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('AMMA', 802, 1056);
    // deck rail, flags
    g.strokeStyle = NAVY; g.lineWidth = 5; for (let x = 910; x < 1046; x += 22) { g.beginPath(); g.moveTo(x, 884); g.lineTo(x, 854); g.stroke(); } g.beginPath(); g.moveTo(906, 856); g.lineTo(1048, 856); g.stroke();
    for (let i = 0; i < 6; i++) peg(922 + i * 22, 882, 1.1);
    for (let i = 0; i < 6; i++) peg(70 + i * 22, 882, 1.1);
    // a long dark shape under you, near the tear
    g.fillStyle = 'rgba(4,28,48,0.55)'; g.beginPath(); g.moveTo(600, 1440); g.bezierCurveTo(740, 1390, 1000, 1400, 1120, 1436); g.bezierCurveTo(1000, 1500, 760, 1498, 600, 1440); g.closePath(); g.fill();
    // the tear in the hull
    g.fillStyle = '#16202a'; g.beginPath(); g.moveTo(420, 1338); g.lineTo(460, 1296); g.lineTo(492, 1318); g.lineTo(528, 1282); g.lineTo(572, 1316); g.lineTo(604, 1338); g.closePath(); g.fill();
    SHIP = { c, rooms };
  }
  const ship = () => { if (!SHIP) makeShip(); return SHIP; };
  function seaFront(g, t) {
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 6; g.lineCap = 'round';
    for (const [x0, x1] of [[-20, 96], [1002, 1100]]) { g.beginPath(); for (let x = x0; x <= x1; x += 8) { const y = 1130 + Math.sin(x * 0.06 + t * 2) * 6; if (x === x0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }
  }
  function smoke(g, t) { for (let i = 0; i < 6; i++) { const u = ((t * 0.22 + i / 6) % 1), x = 695 - u * 240 + Math.sin(u * 9 + i) * 10, y = 460 - u * 150, r = 18 + u * 56; ell(g, x, y, r, r * 0.8); g.fillStyle = `rgba(245,245,240,${0.8 * (1 - u)})`; g.fill(); } }
  const lerpRect = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

  function shipBase(g, t, p) {
    g.drawImage(ship().c, 0, 0); smoke(g, t); seaFront(g, t);
    if (p < 0.28) { g.save(); g.globalAlpha = 1 - p / 0.28; surround(g); g.restore(); }
  }
  function shipFeeds(g, t, p) { twoFeeds(g, t, { f1: lerpRect(F1, ROOM_A, p), f2: lerpRect(F2, ROOM_B, p) }); }
  function shotShip(g, t) {
    const T = times(), p = sstep(T.ship, T.ship + 0.8, t), z = 1 + 0.03 * sstep(T.ship + 0.8, T.degree + 0.2, t);
    g.save(); g.translate(540, 1050); g.scale(z, z); g.translate(-540, -1050);
    shipBase(g, t, p);
    shipFeeds(g, t, p);
    const r2 = mulberry32(77), rooms = ship().rooms;
    for (let i = 0; i < 9; i++) { const R0 = rooms[Math.floor(r2() * rooms.length)], tt = T.callU + 0.06 * i + r2() * 0.2, side = r2() > 0.5 ? 1 : -1; if (t >= tt) bubble(g, 'AMMA', Math.min(900, R0.x + R0.w / 2), R0.y - 18, 40, pop(t, tt), side); }
    g.restore();
    if (t >= T.you) {
      const q = pop(t, T.you);
      g.save(); g.translate(70, 610); g.scale(lerp(0.5, 1, q), lerp(0.5, 1, q)); g.globalAlpha *= clamp(q * 4);
      txt(g, 'YOU', 0, 0, 190, RED, { stroke: PAPER, sw: 0.1 });
      g.strokeStyle = RED; g.lineWidth = 24; g.lineCap = 'round'; g.beginPath(); g.moveTo(180, 30); g.quadraticCurveTo(250, 70, 286, 112); g.stroke();
      g.fillStyle = RED; g.beginPath(); g.moveTo(322, 158); g.lineTo(240, 124); g.lineTo(304, 68); g.closePath(); g.fill();
      g.restore();
    }
    hud(g, t, 1000);
  }
  function shotPower(g, t) {
    const T = times();
    g.drawImage(ship().c, 0, 0); smoke(g, t); seaFront(g, t);
    const r = mulberry32(19), S = ship();
    for (const R0 of S.rooms) { const off = T.power + 0.1 + (R0.y - 684) / 640 * 1.3 + r() * 0.28, k = clamp((t - off) / 0.08); if (k > 0) { g.fillStyle = `rgba(10,22,40,${0.9 * k})`; g.fillRect(R0.x, R0.y, R0.w, R0.h); } }
    shipFeeds(g, t, 1);
    if (t >= T.most) {
      const q = pop(t, T.most);
      band(g, 'YOUR VOTES PICK THE DOOR', 480, 1420, 88, NAVY, YEL, q, -0.02);
      g.save(); g.globalAlpha *= clamp(q * 3);
      g.fillStyle = TEAL; R(g, 110, 1486, 370, 52, 14); g.fill(); g.fillStyle = ORG; R(g, 492, 1486, 370, 52, 14); g.fill();
      txt(g, '1  ?', 130, 1530, 50, '#fff'); txt(g, '?  2', 842, 1530, 50, '#fff', { align: 'right' });
      g.restore();
    }
    hud(g, t, 1000);
  }

  function shotDegree(g, t) {
    const T = times(), z = 1.035 - 0.035 * sstep(T.degree, T.degree + 0.5, t), fl = t >= T.degW;
    surround(g);
    g.save(); g.translate(500, 980); g.scale(z, z); g.translate(-500, -980);
    twoFeeds(g, t, { z: 1 + 0.32 * sstep(T.degree, T.degree + 0.7, t) });
    plates(g, fl ? 'M.B.B.S.' : 'DOCTOR', fl ? 'B.TECH' : 'ENGINEER');
    g.restore();
    hud(g, t, 1000);
  }

  // ------------------------------------------------------------------ the photo, and the wedding it came from
  function liveWedding(g, x, y, w, h, t, live) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y);
    photoScene(g, w, h, t, { live });
    if (live > 0) {
      // rice in the air
      const r = mulberry32(14); g.fillStyle = '#fff';
      for (let i = 0; i < 80; i++) { const a = r() * TAU, sp = 0.7 + r() * 0.6, ph = r(), u = (t * sp * 0.6 + ph) % 1, rad = lerp(0.55, 0.08, u), px = w / 2 + Math.cos(a) * w * rad, py = h * 0.5 + Math.sin(a) * h * rad * 0.95 - Math.sin(u * Math.PI) * 60; ell(g, px, py, 6, 4, a); g.fill(); }
      // the little girl with the flowers
      g.save(); g.translate(w / 2, h * 0.87); g.scale(h / 3300, h / 3300); bust(g, TARA, { body: '#ffd043', look: [0, -8], smile: 1, op: 0.12, wet: 0 }); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = i % 2 ? 62 : 34; ell(g, Math.cos(a) * rr, 300 + Math.sin(a) * rr * 0.8, 32, 32); g.fillStyle = i % 3 === 0 ? '#ff7aa2' : i % 3 === 1 ? '#f3932b' : '#ffffff'; g.fill(); } ell(g, 0, 300, 26, 26); g.fillStyle = '#ffd043'; g.fill(); g.restore();
      // waves, up at you
      const wv = Math.sin(t * 9) * 26, s = h / 1100;
      for (const [hx, hy, col, sk] of [[w / 2 - 440 * s, h * 0.26, '#d32f3a', MEERA.skin], [w / 2 + 440 * s, h * 0.26, '#f4e7c8', RAVI.skin]]) { const dir = hx < w / 2 ? 1 : -1; g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 58 * s; g.beginPath(); g.moveTo(hx + dir * 54 * s, hy + 370 * s); g.quadraticCurveTo(hx - dir * 26 * s, hy + 220 * s, hx + wv * s, hy + 62 * s); g.stroke(); g.fillStyle = sk; ell(g, hx + wv * s, hy, 44 * s, 52 * s); g.fill(); g.strokeStyle = 'rgba(70,35,20,0.4)'; g.lineWidth = 4 * s; for (let i = -2; i < 2; i++) { g.beginPath(); g.moveTo(hx + wv * s + i * 17 * s + 8 * s, hy - 44 * s); g.lineTo(hx + wv * s + i * 17 * s + 8 * s, hy - 14 * s); g.stroke(); } }
    }
    g.restore();
  }
  function shotPhoto(g, t) {
    const T = times(), m = sstep(T.merge, T.merge + 0.55, t);
    const big = { x: 36, y: 446, w: 1008, h: 1070 };
    if (m < 1) {
      surround(g); twoFeeds(g, t); plates(g, t >= T.nameM ? 'MEERA' : 'M.B.B.S.', t >= T.nameR ? 'RAVI' : 'B.TECH'); shouts(g, t);
      if (t >= T.ring && m <= 0) {
        const q = pop(t, T.ring);
        for (const [F, P] of [[F1, PH1], [F2, PH2]]) { const k = F.w / FW; g.strokeStyle = RED; g.lineWidth = 11; ell(g, F.x + P.x * k, F.y + P.y * k, (P.w * 0.9) * k * lerp(1.6, 1, q), (P.h * 0.95) * k * lerp(1.6, 1, q), 0); g.stroke(); }
      }
    }
    if (m > 0) {
      g.fillStyle = `rgba(214,160,100,${clamp(m * 2)})`; g.fillRect(0, 0, W, H);
      g.save(); g.globalAlpha *= clamp(m * 2); g.strokeStyle = 'rgba(120,70,30,0.32)'; g.lineWidth = 6; for (let y = 0; y < H; y += 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.restore();
      for (const [F, P] of [[F1, PH1], [F2, PH2]]) {
        const k = F.w / FW, a = { x: F.x + (P.x - P.w / 2) * k, y: F.y + (P.y - P.h / 2) * k, w: P.w * k, h: P.h * k }, q = lerpRect(a, big, m);
        liveWedding(g, q.x, q.y, q.w, q.h, t, m >= 1 ? 1 : 0);
      }
      if (m >= 1) {
        // the deck carries on above and below the picture
        g.strokeStyle = PAPER; g.lineWidth = 20; g.strokeRect(big.x, big.y, big.w, big.h);
        if (t >= T.nM) bubble(g, 'MEERA', 300, 620, 84, pop(t, T.nM), 1, PAPER, TEAL);
        if (t >= T.nR) bubble(g, 'RAVI', 800, 620, 84, pop(t, T.nR), -1, PAPER, ORG);
      }
    }
    hud(g, t, 1000);
  }

  // ------------------------------------------------------------------ the scan
  function shotScan(g, t) {
    const T = times(), beat = 2.47, b = Math.pow(Math.max(0, Math.sin(t * beat * TAU)), 6);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#0e8e97'], [1, '#0b6a80']); g.fillRect(0, 0, W, H);
    // the fan of the scan
    g.save(); g.beginPath(); g.moveTo(495, 440); g.lineTo(1040, 1200); g.quadraticCurveTo(495, 1560, -50, 1200); g.closePath(); g.clip();
    g.fillStyle = rg(g, 495, 960, 40, 760, [0, '#fff6df'], [0.6, '#ffdfb5'], [1, '#f7b488']); g.fillRect(0, 400, W, 1300);
    const r = mulberry32(3); g.fillStyle = 'rgba(255,255,255,0.3)'; for (let i = 0; i < 260; i++) { ell(g, r() * W, 440 + r() * 1100, 2 + r() * 6, 1 + r() * 3, 0.3); g.fill(); }
    // the baby
    g.save(); g.translate(495, 960); g.rotate(0.12); g.scale(1.55, 1.55);
    g.fillStyle = '#e3895f'; g.beginPath(); g.moveTo(-40, -30); g.bezierCurveTo(70, -90, 170, -10, 150, 90); g.bezierCurveTo(130, 180, 20, 210, -50, 150); g.bezierCurveTo(-120, 100, -110, 10, -40, -30); g.fill();
    ell(g, -70, -96, 94, 86, -0.3); g.fill();
    g.strokeStyle = '#e3895f'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, 40); g.quadraticCurveTo(-60, 60, -92, 0); g.stroke(); g.beginPath(); g.moveTo(110, 130); g.quadraticCurveTo(20, 210, -30, 150); g.stroke();
    g.fillStyle = '#c86c47'; ell(g, -110, -96, 7, 7); g.fill(); g.strokeStyle = '#c86c47'; g.lineWidth = 5; g.beginPath(); g.moveTo(-128, -58); g.quadraticCurveTo(-112, -44, -98, -56); g.stroke();
    // the heart
    const hs = 1 + b * 0.4; g.save(); g.translate(30, 40); g.scale(hs, hs); g.fillStyle = '#ff3b50'; g.beginPath(); g.moveTo(0, 26); g.bezierCurveTo(-46, -8, -22, -40, 0, -16); g.bezierCurveTo(22, -40, 46, -8, 0, 26); g.fill(); g.restore();
    g.restore();
    g.restore();
    txt(g, '148', 700, 540, 120, PAPER); txt(g, 'BEATS A MINUTE', 700, 590, 40, YEL, { kind: 'semi' });
    band(g, 'DUE IN 3 WEEKS', 495, 1440, 118, RED, '#fff', pop(t, T.scan + 0.15));
    const up = win(t, T.scan + 0.5, T.if2 - 0.45, 0.4);
    hud(g, t, 1000 + 0.62 * up);
  }

  // ------------------------------------------------------------------ the engine: it's what you run on
  function engineBg(g, t, o = {}) {
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#7d3216'], [0.5, '#b65219'], [1, '#6a2a14']); g.fillRect(0, 0, W, H);
    g.strokeStyle = '#3a1a10'; g.lineWidth = 46; g.lineCap = 'butt'; for (const y of [470, 1490]) { g.beginPath(); g.moveTo(-10, y); g.lineTo(W + 10, y); g.stroke(); }
    const p = o.still ? 0.4 : (Math.sin(t * 7) + 1) / 2;
    for (let i = 0; i < 4; i++) { const x = 120 + i * 230, y = 700 + (i % 2 ? p : 1 - p) * 120; g.fillStyle = '#42211a'; R(g, x, 520, 150, 640, 16); g.fill(); g.fillStyle = lg(g, x, 0, x + 150, 0, [0, '#ffb04a'], [1, '#d7621a']); R(g, x + 16, y, 118, 200, 12); g.fill(); g.strokeStyle = '#42211a'; g.lineWidth = 8; g.strokeRect(x + 16, y + 40, 118, 0.01); g.fillStyle = 'rgba(255,255,255,0.2)'; R(g, x + 26, y + 10, 30, 180, 8); g.fill(); }
    g.fillStyle = '#42211a'; R(g, 60, 1160, 960, 240, 26); g.fill();
    const a = o.still ? 0.8 : t * 3; g.save(); g.translate(540, 1280); g.rotate(a); g.strokeStyle = '#ffb04a'; g.lineWidth = 26; ell(g, 0, 0, 96, 96); g.stroke(); g.lineWidth = 18; for (let i = 0; i < 3; i++) { const q = i / 3 * TAU; g.beginPath(); g.moveTo(-Math.cos(q) * 92, -Math.sin(q) * 92); g.lineTo(Math.cos(q) * 92, Math.sin(q) * 92); g.stroke(); } g.restore();
  }
  // if Meera lives: his feed goes; a fifteen-year-old has forty days; the ship
  function shotIf1(g, t) {
    const T = times();
    if (t < T.tara) {
      surround(g); twoFeeds(g, t); noSignal(g, F2.x, F2.y, F2.w, F2.h, t); plates(g, 'M.B.B.S.', 'B.TECH');
      tag(g, 'IF THE DOCTOR LIVES', 230, 952, 66);
      hud(g, t, 999);
      return;
    }
    const u = t - T.tara;
    engineBg(g, t, { still: true });
    const d = Math.max(0, 40 - Math.floor(u * 2.6));
    g.fillStyle = PAPER; R(g, 590, 500, 340, 340, 18); g.fill(); g.strokeStyle = NAVY; g.lineWidth = 9; g.stroke(); g.fillStyle = RED; R(g, 590, 500, 340, 70, 18); g.fill(); txt(g, 'DAYS LEFT', 760, 556, 56, '#fff', { align: 'center' }); txt(g, String(d), 760, 790, 220, NAVY, { align: 'center' });
    g.save(); g.translate(330, 1040); g.scale(1.12, 1.12); bust(g, TARA, { kind: 'suit', look: [0, -8], worry: -18, op: 0.05, frown: 0.5, wet: 0 }); g.restore();
    g.save(); g.translate(350, 1400); g.rotate(-0.05); g.fillStyle = '#d7dde3'; R(g, -250, -130, 500, 270, 12); g.fill(); g.fillStyle = PAPER; R(g, -240, -124, 236, 250, 8); g.fill(); R(g, 4, -124, 236, 250, 8); g.fill(); g.strokeStyle = '#9fb4c0'; g.lineWidth = 3; for (let y = -96; y < 120; y += 34) { g.beginPath(); g.moveTo(-226, y); g.lineTo(-18, y); g.moveTo(18, y); g.lineTo(226, y); g.stroke(); } for (const k of [-1, 1]) { ell(g, k * 270, 40, 60, 46); g.fillStyle = TARA.skin; g.fill(); } g.restore();
    tag(g, 'IF THE DOCTOR LIVES', 70, 460, 74);
    band(g, 'AGE 15', 790, 930, 84, YEL, NAVY, pop(t, T.tara + 0.1), 0.03);
    hud(g, t, 999);
  }
  function shipDark(g, t, a0, dark) {
    const S = ship();
    g.drawImage(S.c, 0, 0);
    g.fillStyle = `rgba(6,18,44,${0.84 * dark})`; g.fillRect(0, 0, W, H);
    const r = mulberry32(9);
    for (const R0 of S.rooms) { const off = a0 + r() * 1.5; if (t < off) { g.fillStyle = `rgba(255,214,120,${0.92 * dark})`; g.fillRect(R0.x, R0.y, R0.w, R0.h); } }
  }
  function shotDark(g, t) {
    const T = times(), u = clamp((t - T.dark) / (T.photo - T.dark));
    const tilt = 0.05 * sstep(0.15, 1, u), sink = 90 * sstep(0.2, 1, u);
    g.save(); g.fillStyle = '#04122e'; g.fillRect(0, 0, W, H); g.translate(540, 1100 + sink); g.rotate(tilt); g.translate(-540, -1100); shipDark(g, t, T.dark + 0.2, sstep(0, 0.2, u)); g.restore();
    tag(g, 'IF THE DOCTOR LIVES', 70, 460, 74);
    hud(g, t, Math.round(lerp(999, 0, Math.pow(sstep(0.2, 0.92, u), 1.3))));
  }
  // if door 2: you're safe
  function shotIf2(g, t) {
    const T = times();
    if (t < T.ship2) {
      surround(g); twoFeeds(g, t); noSignal(g, F1.x, F1.y, F1.w, F1.h, t); plates(g, 'MEERA', 'RAVI');
      tag(g, 'IF RAVI LIVES', 320, 952, 66);
      hud(g, t, 999);
      return;
    }
    if (t < T.cot) {
      g.drawImage(ship().c, 0, 0); smoke(g, t); seaFront(g, t);
      band(g, "YOU'RE SAFE", 480, 680, 130, '#1b9e6a', '#fff', pop(t, T.safeW));
    } else if (t < T.old) {
      g.fillStyle = lg(g, 0, 0, 0, H, [0, '#ffe7d9'], [1, '#ffd2bd']); g.fillRect(0, 0, W, H); g.fillStyle = '#7fd2c6'; g.fillRect(0, 430, W, 26);
      // the cot, empty; a mobile turning
      const u = t - T.cot, cx = 500, cy = 1150;
      g.strokeStyle = '#b98a58'; g.lineWidth = 16; g.lineCap = 'round'; R(g, cx - 300, cy - 180, 600, 300, 18); g.stroke(); for (let x = -260; x <= 260; x += 62) { g.beginPath(); g.moveTo(cx + x, cy - 180); g.lineTo(cx + x, cy + 120); g.stroke(); } g.lineWidth = 22; g.beginPath(); g.moveTo(cx - 290, cy + 120); g.lineTo(cx - 290, cy + 250); g.moveTo(cx + 290, cy + 120); g.lineTo(cx + 290, cy + 250); g.stroke();
      g.fillStyle = PAPER; R(g, cx - 258, cy + 40, 516, 60, 12); g.fill();
      g.strokeStyle = '#6ea8a6'; g.lineWidth = 8; g.beginPath(); g.moveTo(cx, 560); g.lineTo(cx, 660); g.stroke();
      for (let i = 0; i < 4; i++) { const a = u * 0.9 + i / 4 * TAU, x = cx + Math.cos(a) * 150, yy = 690 + Math.sin(a) * 26; g.strokeStyle = '#6ea8a6'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 660); g.lineTo(x, yy); g.stroke(); g.fillStyle = ['#ffcf33', '#ef5032', '#14a39a', '#8b5fb8'][i]; ell(g, x, yy + 34, 26, 26); g.fill(); }
      band(g, 'NO DOCTOR. NO BABY.', 500, 1440, 104, NAVY, '#fff', pop(t, T.cot + 0.15));
    } else {
      engineBg(g, t);
      const u = t - T.old, up = sstep(0.9, 2.3, u);
      // the photo taped to a pipe
      g.save(); g.translate(790, 590); g.rotate(0.06); g.fillStyle = PAPER; R(g, -116, -92, 232, 184, 4); g.fill(); g.save(); g.beginPath(); g.rect(-104, -80, 208, 150); g.clip(); g.translate(-104, -80); photoScene(g, 208, 150, 0); g.restore(); g.fillStyle = 'rgba(255,240,180,0.7)'; g.fillRect(-46, -108, 92, 34); g.restore();
      g.save(); g.translate(440, lerp(1090, 1040, up)); g.scale(1.3, 1.3); bust(g, RAVI_OLD, { kind: 'suit', look: [0, lerp(14, -8, up)], close: lerp(0.5, 0.18, up), worry: 2, op: 0, frown: 0.2, browY: lerp(8, 0, up), roll: lerp(0.05, 0, up), w0: 34 }); g.restore();
    }
    tag(g, 'IF RAVI LIVES', 70, 460, 74);
    hud(g, t, Math.round(lerp(999, 871, sstep(T.old + 0.1, T.last - 0.1, t))));
  }

  // ------------------------------------------------------------------ the question, as it started
  function shotEnd(g, t) {
    const T = times(), z = 1 + 0.03 * sstep(T.last, T.end, t), e1 = T.en('n12');
    surround(g);
    g.save(); g.translate(500, 980); g.scale(z, z); g.translate(-500, -980);
    twoFeeds(g, t, { z: 1.1 });
    plates(g, 'MEERA', 'RAVI');
    if (t < e1) band(g, 'MEERA OR RAVI?', 500, 980, 112, RED, '#fff', pop(t, T.wi('n12', 2) - 0.1));
    else band(g, 'VOTE 1 OR 2', 500, 980, 128, RED, YEL, pop(t, e1));
    g.restore();
    if (t >= e1 + 0.05) { const q = pop(t, e1 + 0.05); g.save(); g.globalAlpha *= clamp(q * 3); tag(g, 'EPISODE 2 IN 2 DAYS', 430, 1444, 60, NAVY, YEL); g.restore(); }
    hud(g, t, lerp(1000, 999.5, sstep(T.last, T.last + 1.2, t)));
  }

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g, T = times();
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.clearRect(0, 0, W, H);
      g.save();
      if (t >= T.parents0 && t < T.parents1) shotParents(g, t);
      else if (t < T.ship) shotOpen(g, t);
      else if (t < T.degree) shotShip(g, t);
      else if (t < T.power) shotDegree(g, t);
      else if (t < T.if1) shotPower(g, t);
      else if (t < T.dark) shotIf1(g, t);
      else if (t < T.photo) shotDark(g, t);
      else if (t < T.scan) shotPhoto(g, t);
      else if (t < T.if2) shotScan(g, t);
      else if (t < T.last) shotIf2(g, t);
      else shotEnd(g, t);
      g.restore();
    },
  });

  scene({
    name: 'fx', from: 'hook', to: 'end',
    build(root, S) {
      const cv = C.el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:0.05` }, root);
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
