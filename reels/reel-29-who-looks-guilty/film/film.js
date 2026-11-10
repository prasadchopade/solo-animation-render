// Reel 29 · Who Looks Guilty (working title). "You're the test subject." Four photos on a table, one claim: one man here killed someone. You get one
// second to pick him, then you choose who you'd trust with your house keys. It's the same man. (Todorov & Porter 2014, Jenkins et al. 2011, Willis &
// Todorov 2006: docs/research.md.) Every face is film/face.js with the same bones and the same skin. Our own drawings; nobody real.
// Series furniture from reels 20-27: the chai glass and the spoon, the marker, the title type. 30 fps, no motion blur except the camera's glides.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT, F = window.FACE;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', PAPER = '#fbf7ec', YEL = '#ffd34a', CREAM = '#fff6e2', MARK = '#e11d17', ORANGE = '#ff5a3a';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  // ------------------------------------------------------------------ canvas helpers (the series' own)
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
  function title(g, s, y, size, color, t, t0, o = {}) {
    if (t < t0) return;
    const q = pop(t, t0);
    g.save(); g.translate(o.x ?? 513, y); g.scale(lerp(0.86, 1, q), lerp(0.86, 1, q));
    txt(g, s, 0, 0, size, color, { align: 'center', fit: o.fit ?? 860, stroke: o.stroke ?? INK, sw: o.sw ?? 0.14, a: clamp((t - t0) * 8) * (o.a ?? 1) });
    g.restore();
  }
  function shakeAt(t, list, amp = 26) {
    let a = 0; for (const t0 of list) if (t >= t0) a = Math.max(a, amp * Math.exp(-(t - t0) * 11));
    if (a < 0.2) return [0, 0];
    const r = mulberry32(Math.round(t * 30) * 7 + 3);
    return [(r() - 0.5) * 2 * a, (r() - 0.5) * 2 * a];
  }
  const rgbS = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const flashAt = (t, t0, amt = 0.9) => { const d = t - t0; return d < 0 ? 0 : Math.exp(-d * 11) * amt; };
  const hexa = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const mixHex = (a, b, u) => { const A = hexa(a), B = hexa(b); return `rgb(${lerp(A[0], B[0], u) | 0},${lerp(A[1], B[1], u) | 0},${lerp(A[2], B[2], u) | 0})`; };

  // ------------------------------------------------------------------ the man: one set of bones, four days
  const LOOKS = [
    F.LOOK({ yaw: -0.6, pitch: 0.08, roll: -0.05, jaw: 0.97, open: 0.9, lookX: 27, lookY: 5, browY: -3, browIn: 3, press: 0.72, smile: -0.08, hv: 0.3, hp: -0.85, hs: 0, hf: 0.62, shirt: [206, 214, 232], shirtD: [160, 172, 198], collar: 1 }),
    F.LOOK({ yaw: 0.22, pitch: -0.06, roll: 0.085, jaw: 1.02, open: 0.82, lidLow: 0.95, lookY: 0, browY: 9, browIn: 3, grin: 1, smile: 0.7, hv: 0.8, hp: 0.55, hf: 0, hs: 0.3, shirt: [196, 44, 60], shirtD: [146, 28, 44], collar: 1 }),
    F.LOOK({ yaw: 0, pitch: -0.6, roll: 0, jaw: 1.04, open: 1.34, iris: 14.5, lookY: -4, browY: -19, browIn: -16, browOut: 5, press: 0.55, smile: -0.25, must: 1, stub: 0.15, hv: 0.05, hp: 0, hs: 1, hf: 0, shirt: [62, 66, 82], shirtD: [34, 36, 48], collar: 1 }),
    F.LOOK({ yaw: 0.36, pitch: -0.34, roll: 0.06, jaw: 0.97, open: 0.84, lookY: 4, wet: 1, bags: 1, browY: 5, browIn: 25, browOut: -9, press: 0.42, smile: -0.36, stub: 0.72, hv: 0.5, hm: 1, hp: 0.2, hf: 0.9, hs: 0, shirt: [58, 112, 176], shirtD: [36, 78, 130], collar: 0 }),
  ];
  const NEUT = F.LOOK({ hv: 0.42, hp: -0.3, hs: 0.1, hf: 0.08, smile: 0.02, shirt: [214, 210, 200], shirtD: [172, 168, 156], collar: 1 });
  const BACK = ['#7fc8ee', '#ffd043', '#3dbfa9', '#ff9d8f'], NBACK = '#f0e2c6';
  const DATES = ['02 JUN', '15 MAR', '28 NOV', '09 JAN'];
  const SCL = [0.74, 0.65, 0.8, 0.7], DY = [0.5, 0.56, 0.5, 0.54], NSCL = 0.76, NDY = 0.54;
  const ROT = [-0.022, 0.016, 0.014, -0.018];
  const CW = 412, CH = 500, CC = [[302, 736], [730, 736], [302, 1252], [730, 1252]];

  // where a thing on the face sits, in the photo's own units (the photo's centre at 0, 0)
  const faceAt = (n, x, y) => [SCL[n] * x, (DY[n] - 0.5) * CH + SCL[n] * y];
  const MARKS = [
    { pos: faceAt(0, -2, -30), rx: 150, ry: 62, note: "WON'T LOOK AT YOU" },
    { pos: faceAt(1, 10, 132), rx: 112, ry: 74, note: "CAN'T STOP SMILING" },
    { pos: faceAt(2, 0, -40), rx: 160, ry: 66, note: "HASN'T BLINKED" },
    { pos: faceAt(3, 22, -44), rx: 150, ry: 66, note: 'LOOKS SORRY' },
  ];
  // the eyebrow's cut in head units, for a given look (the point on his right brow at u = 0.615, through his pose)
  function cutAt(P) {
    const ex = 80, ey = -28 - P.pitch * 15, k = -1;
    const in0 = [k * (ex - 50), ey - 41 + P.browY - P.browIn], ctl = [k * (ex + 6), ey - 62 + P.browY + 0.25 * P.browIn], out = [k * (ex + 56), ey - 40 + P.browY * 0.45 + P.browOut];
    const u = 0.615, x = (1 - u) * (1 - u) * in0[0] + 2 * (1 - u) * u * ctl[0] + u * u * out[0], y = (1 - u) * (1 - u) * in0[1] + 2 * (1 - u) * u * ctl[1] + u * u * out[1];
    const fx = P.yaw * 24, a = P.roll, X = x + fx, Y = y - 190;
    return [X * Math.cos(a) - Y * Math.sin(a), X * Math.sin(a) + Y * Math.cos(a) + 190];
  }

  // a hand-drawn ring, drawn on by u
  function ring(g, cx, cy, rx, ry, u, seed = 1, color = MARK, lw = 12) {
    if (u <= 0) return;
    const N = 72, total = 1.14;
    g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i <= Math.round(N * u); i++) {
      const v = (i / N) * total, a = -1.1 + v * TAU, w = 1 + 0.035 * Math.sin(v * 9 + seed) + 0.018 * Math.sin(v * 23 + seed * 2) + v * 0.06;
      const x = cx + Math.cos(a) * rx * w, y = cy + Math.sin(a) * ry * w;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  function note(g, s, x, y, a, size = 64, rot = -0.03, fit = 372) {
    if (a <= 0) return;
    txt(g, s, x, y, size, MARK, { align: 'center', fit, stroke: PAPER, sw: 0.2, a, rot });
  }

  // one photo, centred on (0, 0). o: P, back, scale, dy, tab, date, blank, ring, noteA
  function photo(g, n, o = {}) {
    const P = o.P || LOOKS[n], w = CW, h = CH;
    g.save();
    g.fillStyle = 'rgba(0,0,0,0.3)'; R(g, -w / 2 + 8, -h / 2 + 12, w, h, 8); g.fill();
    g.fillStyle = PAPER; R(g, -w / 2, -h / 2, w, h, 8); g.fill();
    g.save(); g.beginPath(); g.rect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32); g.clip();
    g.fillStyle = o.back || BACK[n]; g.fillRect(-w / 2, -h / 2, w, h);
    if (!o.blank) { g.translate(0, (o.dy ?? DY[n]) * h - h / 2); const s = o.scale ?? SCL[n]; g.scale(s, s); F.draw(g, P); }
    g.restore();
    const outerR = n % 2 === 1;                          // photos 2 and 4 are on the right: their tab and date go to the right edge
    if ((o.date ?? 1) > 0) txt(g, DATES[n], outerR ? w / 2 - 30 : -w / 2 + 30, h / 2 - 32, 36, '#ffb238', { kind: 'mono', align: outerR ? 'right' : 'left', stroke: 'rgba(40,20,0,0.8)', sw: 0.18, a: o.date ?? 1 });
    if ((o.tab ?? 1) > 0) {
      const tx = outerR ? w / 2 - 96 : -w / 2 + 24;
      g.save(); g.globalAlpha *= o.tab ?? 1;
      g.fillStyle = '#121212'; R(g, tx, -h / 2 + 24, 72, 72, 10); g.fill();
      txt(g, String(n + 1), tx + 36, -h / 2 + 80, 58, '#fff9ea', { kind: 'mono', align: 'center' });
      g.restore();
    }
    if (o.ring > 0) { const m = MARKS[n]; ring(g, m.pos[0], m.pos[1], m.rx * SCL[n], m.ry * SCL[n], o.ring, n * 2 + 1, MARK, 10); }
    if (o.noteA > 0) note(g, MARKS[n].note, 0, h / 2 - 84, o.noteA, 56);
    g.restore();
  }

  // ------------------------------------------------------------------ the table
  let TB = null;
  function makeTable() {
    const c = offscreen(W, H), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#c08a50'], [0.5, '#b47d45'], [1, '#93622f']); g.fillRect(0, 0, W, H);
    const r = mulberry32(29);
    g.strokeStyle = 'rgba(70,40,18,0.1)'; g.lineWidth = 2;
    for (let i = 0; i < 90; i++) { const y = r() * H, x0 = r() * W; g.beginPath(); g.moveTo(x0, y); g.bezierCurveTo(x0 + 120, y + 8 * r(), x0 + 240, y - 8 * r(), x0 + 320 + r() * 260, y + 4 * r()); g.stroke(); }
    g.fillStyle = 'rgba(70,40,18,0.22)'; for (const y of [250, 560, 870, 1180, 1490, 1800]) g.fillRect(0, y, W, 4);
    g.fillStyle = rg(g, 513, 900, 240, 1180, [0, 'rgba(255,232,186,0.32)'], [0.6, 'rgba(255,232,186,0.04)'], [1, 'rgba(40,18,6,0.34)']); g.fillRect(0, 0, W, H);
    // the open file the photos lie on
    g.fillStyle = 'rgba(0,0,0,0.24)'; R(g, 62, 462, 942, 1100, 18); g.fill();
    g.fillStyle = lg(g, 0, 452, 0, 1550, [0, '#f0d6a4'], [1, '#dcb97c']); R(g, 52, 452, 942, 1098, 18); g.fill();
    g.strokeStyle = 'rgba(120,84,36,0.32)'; g.lineWidth = 3; g.beginPath(); g.moveTo(52, 994); g.lineTo(994, 994); g.stroke();
    TB = { c };
  }
  function key(g, x, y, rot, c1, c2) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = lg(g, -30, 0, 30, 0, [0, c1], [1, c2]); ell(g, 0, 0, 31, 31); g.fill();
    g.fillStyle = 'rgba(16,10,6,0.8)'; ell(g, 0, -10, 9.5, 9.5); g.fill();
    g.fillStyle = lg(g, -9, 20, 9, 20, [0, c1], [1, c2]); R(g, -9, 22, 18, 118, 3); g.fill();
    g.fillStyle = c2; for (const [yy, w] of [[92, 19], [108, 12], [126, 22]]) g.fillRect(9, yy, w, 10);
    g.restore();
  }
  function keysArt(g, x, y, s, rot, sway = 0) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.strokeStyle = '#d7dce4'; g.lineWidth = 9; ell(g, 0, -44, 38, 38); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.arc(0, -44, 38, -2.6, -1.4); g.stroke();
    g.save(); g.translate(0, -12); g.rotate(sway);
    key(g, -10, 8, 0.42, '#f0c24a', '#b98a1c');
    key(g, 12, 8, -0.36, '#e3e7ee', '#9aa2ae');
    g.restore();
    g.restore();
  }
  function glass(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
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
    g.fillStyle = lg(g, 300, 400, 660, 860, [0, '#34466e'], [1, '#1f2c4a']); g.beginPath(); g.moveTo(300, 420); g.lineTo(470, 300); g.lineTo(1400, 1620); g.lineTo(1120, 1800); g.closePath(); g.fill();
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

  // ------------------------------------------------------------------ timing
  const at = (p) => words(p)[0].t0;
  const wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;
  const en = (p) => { const w = words(p); return w[w.length - 1].t1; };
  let T = null;
  function times() {
    if (T) return T;
    T = { end: tb('end') };
    for (let i = 1; i <= 19; i++) { const id = 'n' + String(i).padStart(2, '0'); T[id] = at(id); T[id + 'e'] = en(id); }
    T.c1 = T.n03; T.buzz1 = T.c1 + 1;                    // the first second, real
    T.keys = wi('n04', 12) - 0.12;                       // "your house KEYS"
    T.c2 = wi('n09', 4); T.buzz2 = T.c2 + 1;             // the second second: "Pick him"
    T.m0 = wi('n11', 2) - 0.1; T.m1 = T.m0 + 1.75;       // the four become one
    T.brow = wi('n13', 3);
    T.browAll = wi('n13', 7) - 0.05;
    T.tenth = wi('n15', 5) - 0.02;
    T.reasons = wi('n15', 11) - 0.05;
    T.you = T.n18 - 0.05;
    return T;
  }

  // the camera over the table: world point (x, y) at the screen's centre, zoom z
  const WIDE = { x: 540, y: 960, z: 1 };
  const SHOT = [[1.8, 470, 870], [1.66, 590, 850], [1.92, 500, 950], [1.74, 560, 930]];
  const camFor = (k) => { const [z, sx, sy] = SHOT[k], [cx, cy] = CC[k]; return { x: cx - (sx - 540) / z, y: cy - (sy - 960) / z, z }; };
  function camera(t) {
    const TT = times(), ids = ['n05', 'n06', 'n07', 'n08'];
    const list = [[TT.n05 - 0.42, TT.n05 - 0.02, WIDE, camFor(0)]];
    for (let k = 1; k < 4; k++) list.push([TT[ids[k]] - 0.38, TT[ids[k]] - 0.02, camFor(k - 1), camFor(k)]);
    list.push([TT.n08e + 0.06, TT.n08e + 0.44, camFor(3), WIDE]);
    let c = WIDE;
    for (const [a, b, A, B] of list) {
      if (t >= b) c = B;
      else if (t >= a) { const u = sstep(a, b, t); c = { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), z: lerp(A.z, B.z, u) }; }
      else break;
    }
    return c;
  }
  const apply = (g, c) => { g.translate(540, 960); g.scale(c.z, c.z); g.translate(-c.x, -c.y); };

  function clockDisc(g, x, y, r, u, digit, red) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,0.32)'; ell(g, 6, 10, r, r); g.fill();
    g.fillStyle = INK; ell(g, 0, 0, r, r); g.fill();
    g.strokeStyle = 'rgba(255,246,226,0.2)'; g.lineWidth = 12; ell(g, 0, 0, r - 12, r - 12); g.stroke();
    if (u > 0) { g.strokeStyle = red ? '#ff4a30' : YEL; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, r - 12, -Math.PI / 2, -Math.PI / 2 + TAU * u); g.stroke(); }
    if (digit) {                                         // says it's a time, not a fifth number
      txt(g, digit, 0, r * 0.22, r * 0.92, red ? '#ff5a3a' : CREAM, { kind: 'mono', align: 'center' });
      txt(g, 'SEC', 0, r * 0.62, r * 0.34, red ? '#ff5a3a' : YEL, { kind: 'cond', align: 'center', ls: 2 });
    }
    g.restore();
  }
  function centre(g, t) {
    const TT = times(), X = 516, Y = 994;
    if (t < TT.buzz1 + 0.6) {
      const u = 1 - clamp((t - TT.c1) / 1), done = t >= TT.buzz1 - 0.001, k = 1 - sstep(TT.buzz1 + 0.34, TT.buzz1 + 0.6, t);
      const [sx, sy] = shakeAt(t, [TT.buzz1], 14);
      g.save(); g.translate(X + sx, Y + sy); g.scale(k, k); clockDisc(g, 0, 0, 86, u, done ? '0' : '1', done); g.restore();
    }
    if (t >= TT.keys - 0.3) {
      const yy = lerp(-560, 0, sstep(TT.keys - 0.3, TT.keys, t)), sc = clamp(hit(t, TT.keys, 'heavy'));
      g.save(); g.translate(X, Y);
      const sw = t > TT.keys ? 0.14 * Math.exp(-(t - TT.keys - 0.1) * 3.4) * Math.sin((t - TT.keys) * 16) : 0;
      if (t >= TT.keys) {
        const u2 = t >= TT.c2 ? 1 - clamp((t - TT.c2) / 1) : 1, done2 = t >= TT.buzz2 - 0.001;
        const [sx2, sy2] = shakeAt(t, [TT.buzz2], 14);
        g.save(); g.translate(sx2, sy2); g.scale(lerp(0.6, 1, sc), lerp(0.6, 1, sc)); clockDisc(g, 0, 0, 112, u2, null, done2); g.restore();
      }
      g.translate(0, yy); keysArt(g, 0, 8, 0.84, 0.1, sw);
      g.restore();
    }
  }

  // ------------------------------------------------------------------ 1 · the table, the two picks
  function tableWorld(q, t, c) {
    const TT = times();
    q.save(); apply(q, c);
    q.drawImage(TB.c, 0, 0);
    const ids = ['n05', 'n06', 'n07', 'n08'];
    const fade = 1 - sstep(TT.n08e + 0.06, TT.n08e + 0.4, t);
    for (let n = 0; n < 4; n++) {
      q.save(); q.translate(CC[n][0], CC[n][1]); q.rotate(ROT[n]);
      const r0 = TT[ids[n]] + 0.12, u = sstep(r0, r0 + 0.42, t);
      photo(q, n, { ring: fade > 0.02 ? u : 0, noteA: sstep(r0 + 0.1, r0 + 0.3, t) * fade });
      q.restore();
    }
    { const a = 1 - sstep(1.03, 1.3, c.z); if (a > 0) { q.save(); q.globalAlpha *= a; centre(q, t); q.restore(); } }
    if (t < TT.keys + 1) { chaiHand(q, 884, 1730, 0.92, -0.04); steam(q, 878, 1640, t, 0.45); }
    else { glass(q, 884, 1750, 0.9, 0); steam(q, 878, 1660, t, 0.45); }
    q.restore();
  }
  let SCR = null;
  function shotTable(g, t) {
    const TT = times();
    if (!TB) makeTable();
    const c = camera(t), c2 = camera(t + 1 / 30), moving = Math.abs(c.z - c2.z) > 0.002 || Math.abs(c.x - c2.x) > 0.6 || Math.abs(c.y - c2.y) > 0.6;
    if (moving) {
      if (!SCR) SCR = offscreen(W, H);
      const q = SCR.getContext('2d'), n = 10;
      for (let i = 0; i < n; i++) {
        q.setTransform(1, 0, 0, 1, 0, 0); q.globalAlpha = 1; q.clearRect(0, 0, W, H);
        const tt = t + (i / n) * (0.6 / 30);
        tableWorld(q, tt, camera(tt));
        g.globalAlpha = 1 / (i + 1); g.drawImage(SCR, 0, 0);
      }
      g.globalAlpha = 1;
    } else tableWorld(g, t, c);
    // the headline
    if (t < TT.keys - 0.04) {
      txt(g, 'ONE MAN HERE', 516, 372, 124, CREAM, { align: 'center', stroke: INK, sw: 0.14 });
      txt(g, 'KILLED SOMEONE', 516, 470, 124, YEL, { align: 'center', fit: 860, stroke: INK, sw: 0.14 });
    } else if (t < TT.n10 - 0.04) {
      const small = sstep(TT.n05 - 0.42, TT.n05 - 0.02, t) * (1 - sstep(TT.n08e + 0.06, TT.n08e + 0.44, t));
      title(g, 'WHO DO YOU TRUST', 372 - small * 42, lerp(112, 80, small), CREAM, t, TT.keys - 0.04);
      title(g, 'WITH YOUR KEYS?', 470 - small * 62, lerp(124, 92, small), YEL, t, TT.keys + 0.04);
    } else {
      title(g, 'ONE KILLER', 372, 124, ORANGE, t, TT.n10 - 0.04);
      if (t >= wi('n10', 4) - 0.05) title(g, 'ONE MAN YOU TRUST', 470, 118, YEL, t, wi('n10', 4) - 0.05);
    }
    return flashAt(t, TT.buzz1, 0.22) + flashAt(t, TT.buzz2, 0.22);
  }

  // ------------------------------------------------------------------ 2 · the four become one
  const MS = [];
  function layer(i) { if (!MS[i]) MS[i] = offscreen(W, H); const q = MS[i].getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalAlpha = 1; q.clearRect(0, 0, W, H); return q; }
  const BIG = { x: 513, y: 918, s: 1.82 };
  function tabsRow(g, a, lit = -1) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    for (let i = 0; i < 4; i++) {
      g.save(); g.translate(-CW / 2 + 24 + i * 78, -CH / 2 + 24); g.scale(0.86, 0.86);
      g.fillStyle = lit === i ? MARK : '#121212'; R(g, 0, 0, 72, 72, 10); g.fill();
      txt(g, String(i + 1), 36, 56, 58, '#fff9ea', { kind: 'mono', align: 'center' });
      g.restore();
    }
    g.restore();
  }
  function shotMerge(g, t) {
    const TT = times();
    if (!TB) makeTable();
    const v = clamp((t - TT.m0) / (TT.m1 - TT.m0)), slide = sstep(0.0, 0.4, v), conv = sstep(0.22, 0.97, v), over = sstep(0.1, 0.36, v);
    g.drawImage(TB.c, 0, 0);
    const dim = sstep(0, 0.4, v);
    if (dim > 0) { g.fillStyle = `rgba(16,12,8,${0.42 * dim})`; g.fillRect(0, 0, W, H); }
    [2, 0, 3, 1].forEach((n, k) => {
      const q = layer(k);
      q.save(); q.translate(lerp(CC[n][0], BIG.x, slide), lerp(CC[n][1], BIG.y, slide)); q.rotate(lerp(ROT[n], 0, slide)); const s = lerp(1, BIG.s, slide); q.scale(s, s);
      photo(q, n, { P: F.mix(LOOKS[n], NEUT, conv), back: mixHex(BACK[n], NBACK, conv), scale: lerp(SCL[n], NSCL, conv), dy: lerp(DY[n], NDY, conv), tab: 1 - slide, date: 1 - slide });
      q.restore();
      g.globalAlpha = lerp(1, 1 / (k + 1), over);
      g.drawImage(MS[k], 0, 0);
    });
    g.globalAlpha = 1;
    title(g, "IT'S THE SAME MAN.", 400, 122, YEL, t, TT.m0 + 0.02);
    return 0;
  }

  // ------------------------------------------------------------------ 3 · one man. The cut in his eyebrow.
  function aliveP(t, base, t0) {
    const shut = Math.abs(t - (t0 + 0.75)) < 0.055;
    return { ...base, open: base.open * (shut ? 0.02 : 1), lookX: base.lookX + 4 * Math.sin(t * 0.9), lookY: base.lookY + 2 * Math.sin(t * 1.4 + 1) };
  }
  function bigPhoto(g, P, back, t, o = {}) {
    g.save(); g.translate(BIG.x, BIG.y); const s = BIG.s * (o.z ?? 1); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.3)'; R(g, -CW / 2 + 8, -CH / 2 + 12, CW, CH, 8); g.fill();
    g.fillStyle = PAPER; R(g, -CW / 2, -CH / 2, CW, CH, 8); g.fill();
    g.save(); g.beginPath(); g.rect(-CW / 2 + 16, -CH / 2 + 16, CW - 32, CH - 32); g.clip();
    g.fillStyle = back; g.fillRect(-CW / 2, -CH / 2, CW, CH);
    g.translate(0, NDY * CH - CH / 2); g.scale(NSCL, NSCL); F.draw(g, P);
    if (o.cut > 0) { const [x, y] = cutAt(P); ring(g, x, y, 62, 56, o.cut, 3, MARK, 13); }
    g.restore();
    tabsRow(g, o.tabs ?? 1, o.lit ?? -1);
    g.restore();
  }
  function shotOne(g, t) {
    const TT = times();
    if (!TB) makeTable();
    g.drawImage(TB.c, 0, 0); g.fillStyle = 'rgba(16,12,8,0.42)'; g.fillRect(0, 0, W, H);
    const push = sstep(TT.brow - 0.3, TT.brow + 0.35, t);
    g.save();
    if (push > 0) {                                      // in on the eyebrow
      const [cx, cy] = cutAt(NEUT), wx = BIG.x + BIG.s * NSCL * cx, wy = BIG.y + BIG.s * (NDY * CH - CH / 2 + NSCL * cy), z = lerp(1, 3.1, push);
      g.translate(lerp(wx, 513, push), lerp(wy, 850, push)); g.scale(z, z); g.translate(-wx, -wy);
    }
    bigPhoto(g, aliveP(t, NEUT, TT.n12), NBACK, t, { cut: sstep(TT.brow + 0.05, TT.brow + 0.45, t), tabs: sstep(TT.m1, TT.m1 + 0.2, t) * (1 - push) });
    g.restore();
    if (t < TT.n13 - 0.05) {
      txt(g, 'ONE MAN HERE', 516, 372, 124, CREAM, { align: 'center', stroke: INK, sw: 0.14, a: clamp((t - TT.m1 + 0.1) * 8) });
      if (t >= TT.n12 + 0.25) ring(g, 268, 332, 112, 70, sstep(TT.n12 + 0.25, TT.n12 + 0.6, t), 2, MARK, 12);
    }
    return flashAt(t, TT.m1, 0.55);
  }
  function grid(g, t, cb) {
    if (!TB) makeTable();
    g.drawImage(TB.c, 0, 0);
    for (let n = 0; n < 4; n++) { g.save(); g.translate(CC[n][0], CC[n][1]); g.rotate(ROT[n]); cb(n); g.restore(); }
  }
  function shotCuts(g, t) {
    const TT = times();
    grid(g, t, (n) => {
      const r0 = TT.browAll + 0.08 + n * 0.3, u = sstep(r0, r0 + 0.2, t);
      photo(g, n);
      if (u > 0) { const [x, y] = cutAt(LOOKS[n]), px = SCL[n] * x, py = (DY[n] - 0.5) * CH + SCL[n] * y; ring(g, px, py, 50, 46, u, n + 3, MARK, 9); }
    });
    title(g, 'THE SAME GAP', 372, 124, YEL, t, TT.browAll);
    title(g, 'IN ALL FOUR', 470, 110, CREAM, t, TT.browAll + 0.16);
    return flashAt(t, TT.browAll, 0.3);
  }
  // the one face flows through its four days
  function shotFlow(g, t) {
    const TT = times();
    if (!TB) makeTable();
    g.drawImage(TB.c, 0, 0); g.fillStyle = 'rgba(16,12,8,0.42)'; g.fillRect(0, 0, W, H);
    const a = TT.n14 - 0.15, b = TT.n14e + 0.2, seq = [0, 1, 2, 3], L = (b - a) / seq.length;
    const v = (t - a) / L, i = clamp(Math.floor(v), 0, seq.length - 1), f = sstep(0.35, 0.65, v - Math.floor(v));
    const nxt = i + 1 < seq.length ? LOOKS[seq[i + 1]] : NEUT;
    const P = t < a ? F.mix(NEUT, LOOKS[0], sstep(a - 0.25, a, t)) : F.mix(LOOKS[seq[i]], nxt, t > b ? 1 : f);
    const backNow = t < a ? mixHex(NBACK, BACK[0], sstep(a - 0.25, a, t)) : mixHex(BACK[seq[i]], i + 1 < seq.length ? BACK[seq[i + 1]] : NBACK, t > b ? 1 : f);
    bigPhoto(g, P, backNow, t, { lit: t < a ? -1 : (f < 0.5 ? i : Math.min(3, i + 1)) });
    title(g, 'YOU STARED AT IT', 372, 110, CREAM, t, TT.n14 - 0.02);
    title(g, 'FOR 24 SECONDS', 470, 124, YEL, t, wi('n14', 4) - 0.05);
    return 0;
  }
  // a tenth of a second, then the reasons
  function shotReasons(g, t) {
    const TT = times(), f = Math.round(t * 30), f0 = Math.ceil(TT.tenth * 30), lit = f >= f0 && f < f0 + 3, faces = lit || t >= TT.reasons;
    grid(g, t, (n) => {
      const r0 = TT.reasons + n * 0.2, u = sstep(r0, r0 + 0.25, t);
      photo(g, n, { blank: !faces, ring: u, noteA: u });
    });
    if (t < TT.reasons - 0.05) {
      title(g, 'A TENTH OF', 372, 124, CREAM, t, TT.n15 - 0.02);
      title(g, 'A SECOND', 470, 124, YEL, t, TT.tenth - 0.04);
      txt(g, 'Willis & Todorov, 2006', 516, 1530, 34, 'rgba(46,30,12,0.92)', { kind: 'semi', align: 'center', a: clamp((t - TT.n15) * 4) });
    } else {
      title(g, 'THEN I HANDED YOU', 372, 104, CREAM, t, TT.reasons - 0.02);
      title(g, 'FOUR REASONS', 470, 124, YEL, t, TT.reasons + 0.1);
    }
    return 0;
  }
  function shotPhoto(g, t) {
    const TT = times();
    if (!TB) makeTable();
    const u = sstep(TT.n16 - 0.06, TT.n16 + 0.3, t);
    grid(g, t, (n) => { photo(g, n, {}); });
    g.fillStyle = `rgba(12,10,8,${0.76 * u})`; g.fillRect(0, 0, W, H);
    title(g, 'YOU NEVER', 750, 150, CREAM, t, TT.n16 - 0.02);
    title(g, 'JUDGED HIM.', 905, 180, CREAM, t, wi('n16', 2) - 0.05);
    const pw = wi('n16', 4) - 0.05;
    if (t >= pw) { title(g, 'YOU JUDGED', 1110, 130, YEL, t, pw); title(g, 'A PHOTO.', 1290, 200, YEL, t, wi('n16', 6) - 0.05); }
    return flashAt(t, wi('n16', 6) - 0.05, 0.26);
  }

  // ------------------------------------------------------------------ 4 · the villain photo, and your Aadhaar
  const WM = (o) => F.LOOK({ long: 1, hv: 0.42, hp: 0.5, hf: 0.2, hs: 0.1, shirt: [240, 180, 66], shirtD: [204, 142, 40], collar: 0, noCut: 1, ...o });
  const FAN = [
    WM({ grin: 0.8, smile: 0.5, lidLow: 0.7, open: 0.86, browY: 7, roll: 0.05, shirt: [120, 196, 212], shirtD: [86, 156, 176] }),
    WM({ yaw: -0.4, lookX: 16, smile: 0.2, shirt: [120, 170, 226], shirtD: [86, 130, 190] }),
    WM({ yaw: 0.2, pitch: -0.62, roll: -0.06, open: 0.66, iris: 16, lookX: -10, lookY: -8, browY: -18, browIn: -22, browOut: 8, smile: 0.34, hv: 0.3, hs: 0.8, shirt: [38, 38, 50], shirtD: [20, 20, 28] }),
    WM({ smile: 0.1, open: 1.04, browY: 4, shirt: [232, 112, 120], shirtD: [190, 80, 90] }),
    WM({ yaw: 0.32, pitch: 0.1, smile: 0.32, shirt: [178, 150, 220], shirtD: [136, 110, 180] }),
  ];
  const GLARE = { browY: -12, browIn: -18, browOut: 5, open: 0.8, press: 0.8, smile: -0.5, pitch: -0.42, noCut: 1 };
  const STARE = { browY: 10, browIn: 2, open: 1.42, iris: 13.5, press: 0.6, smile: -0.12, pitch: 0.1, noCut: 1 };
  const IDS = [
    F.LOOK({ ...GLARE, hgrey: 1, bun: 1, hv: 0.2, hp: 0, hf: 0, hs: 0.6, wrinkle: 1, shirt: [176, 72, 92], shirtD: [130, 50, 70], collar: 0, jaw: 0.96 }),
    F.LOOK({ ...STARE, hv: 0.42, hp: -0.7, hf: 0.5, jaw: 0.92, shirt: [236, 240, 246], shirtD: [196, 204, 216], collar: 1 }),
    F.LOOK({ ...GLARE, must: 0.6, hv: 0.3, hp: 0.6, hs: 0.3, shirt: [132, 150, 176], shirtD: [96, 114, 140], collar: 1 }),
    F.LOOK({ ...STARE, long: 1, hv: 0.42, hp: 0.3, hf: 0.2, shirt: [196, 120, 190], shirtD: [150, 84, 148], collar: 0 }),
    F.LOOK({ ...GLARE, hgrey: 1, hv: 0.1, hs: 1, wrinkle: 1, must: 0.5, shirt: [226, 222, 212], shirtD: [186, 180, 168], collar: 0, jaw: 0.97 }),
    F.LOOK({ ...STARE, hv: 0.8, hm: 0.5, hp: 0.2, stub: 0.3, shirt: [100, 110, 150], shirtD: [70, 80, 116], collar: 0 }),
  ];
  function shotVillain(g, t) {
    const TT = times();
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#3a2a55'], [1, '#1d1530']); g.fillRect(0, 0, W, H);
    const t0 = TT.n17, pull = sstep(wi('n17', 3) - 0.2, wi('n17', 4), t);
    [0, 1, 3, 4, 2].forEach((i, zi) => {
      const pos = i - 2, deal = sstep(t0 - 0.1 + zi * 0.03, t0 + 0.22 + zi * 0.03, t), isV = i === 2;
      const x = 513 + pos * lerp(0, 150, deal), y = 1000 + Math.abs(pos) * 26, rot = pos * 0.16 * deal;
      g.save(); g.translate(lerp(x, 513, isV ? pull : 0), lerp(y, 880, isV ? pull : 0)); g.rotate(lerp(rot, 0, isV ? pull : 0)); const s = lerp(0.9, isV ? 1.7 : 0.9, isV ? pull : 0); g.scale(s, s);
      const back = isV ? mixHex('#c9b6f2', '#ff3b2a', pull) : ['#ffd043', '#7fc8ee', '#c9b6f2', '#ffc5bd', '#bfead9'][i];
      photo(g, 0, { P: FAN[i], back, scale: 0.72, dy: 0.54, tab: 0, date: 0 });
      g.restore();
    });
    title(g, "EVERYONE'S GOT A", 372, 108, CREAM, t, t0 - 0.02);
    title(g, 'VILLAIN PHOTO', 470, 124, ORANGE, t, wi('n17', 3) - 0.05);
    txt(g, 'IN ONE STUDY, ALL 20 PEOPLE HAD ONE.', 513, 1432, 50, CREAM, { kind: 'semi', align: 'center', fit: 840, a: clamp((t - t0 - 0.1) * 5) });
    txt(g, 'NEVER THEIR DATING PHOTO.', 513, 1486, 50, YEL, { kind: 'semi', align: 'center', fit: 840, a: clamp((t - t0 - 0.1) * 5) });
    txt(g, 'Todorov & Porter, 2014', 513, 1530, 30, 'rgba(255,246,226,0.75)', { kind: 'semi', align: 'center', a: clamp((t - t0 - 0.1) * 5) });
    return flashAt(t, t0 - 0.05, 0.3);
  }
  function shotID(g, t) {
    const TT = times();
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#f4efe2'], [1, '#e2dac6']); g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(90,90,120,0.14)'; g.lineWidth = 2; for (let y = 40; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const cols = [96, 376, 656], rows = [500, 1010], w = 272, h = 490;
    IDS.forEach((P, i) => {
      const c = i % 3, r = i < 3 ? 0 : 1, t0 = TT.you + i * 0.05, k = pop(t, t0);
      g.save(); g.translate(cols[c] + w / 2, rows[r] + h / 2); g.rotate((i % 2 ? 1 : -1) * 0.012); g.scale(lerp(1.3, 1, k), lerp(1.3, 1, k)); g.globalAlpha = clamp((t - t0) * 12);
      g.fillStyle = 'rgba(0,0,0,0.25)'; R(g, -w / 2 + 6, -h / 2 + 8, w, h, 4); g.fill();
      g.fillStyle = '#fff'; R(g, -w / 2, -h / 2, w, h, 4); g.fill();
      g.save(); g.beginPath(); g.rect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20); g.clip();
      g.fillStyle = '#cfe3f2'; g.fillRect(-w / 2, -h / 2, w, h); g.translate(0, 40); g.scale(0.58, 0.58); F.draw(g, P);
      g.restore();
      g.restore();
    });
    title(g, 'YOURS IS ON YOUR', 372, 108, INK, t, TT.you - 0.02, { stroke: '#f4efe2', sw: 0.02 });
    title(g, 'AADHAAR', 470, 130, RED, t, wi('n18', 4) - 0.05, { stroke: '#f4efe2', sw: 0.02 });
    return flashAt(t, TT.you, 0.28);
  }

  // ------------------------------------------------------------------ 5 · and he's still got your keys
  function shotEnd(g, t) {
    const TT = times(), t0 = TT.n19;
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#b77a40'], [1, '#5e3819']); g.fillRect(0, 0, W, H);
    const u = sstep(t0 + 0.2, TT.n19e - 0.1, t), z = lerp(1.18, 1.42, sstep(t0 - 0.2, TT.end, t));
    const P = F.mix(NEUT, { ...NEUT, grin: 1, smile: 0.7, lidLow: 0.95, open: 0.82, browY: 9, browIn: 3, lookY: 0, roll: 0.05, yaw: 0.14 }, u);
    g.save(); g.translate(470, 860); g.scale(z, z); g.translate(0, 160); g.scale(1.34, 1.34); g.translate(0, -160);
    F.draw(g, P);
    g.restore();
    const lift = sstep(t0 + 0.3, t0 + 0.8, t);
    if (lift > 0) {
      const hx = lerp(960, 806, lift), hy = lerp(1900, 862, lift), sw = 0.18 * Math.sin((t - t0) * 6.5) * Math.exp(-(t - t0) * 0.6);
      g.save();
      // the sleeve and the forearm, from the bottom right corner
      g.strokeStyle = lg(g, hx, hy, 1120, 1960, [0, '#c98e68'], [0.44, '#b47c58'], [0.4401, rgbS(NEUT.shirt)], [1, rgbS(NEUT.shirtD)]); g.lineWidth = 128; g.lineCap = 'round';
      g.beginPath(); g.moveTo(hx + 34, hy + 66); g.lineTo(1160, 2040); g.stroke();
      // your keys, hanging from his finger and thumb
      g.save(); g.translate(hx - 22, hy + 56); g.rotate(sw); keysArt(g, 0, 78, 1.72, 0, -sw * 0.6); g.restore();
      // the fist: four fingers over the ring
      g.fillStyle = lg(g, hx - 90, hy - 90, hx + 90, hy + 90, [0, '#dba67f'], [1, '#b47c58']);
      R(g, hx - 86, hy - 62, 172, 134, 48); g.fill();
      g.strokeStyle = 'rgba(90,50,30,0.42)'; g.lineWidth = 4; g.lineCap = 'round';
      for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(hx - 86 + i * 43, hy - 58); g.lineTo(hx - 86 + i * 43, hy + 6); g.stroke(); }
      g.fillStyle = lg(g, hx - 80, hy, hx + 40, hy + 50, [0, '#e4b08a'], [1, '#c48e68']); R(g, hx - 92, hy + 2, 132, 50, 25); g.fill();
      g.restore();
    }
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
      if (t < TT.m0) fl = shotTable(g, t);
      else if (t < TT.m1) fl = shotMerge(g, t);
      else if (t < TT.browAll) fl = shotOne(g, t);
      else if (t < TT.n14 - 0.3) fl = shotCuts(g, t);
      else if (t < TT.n15 - 0.1) fl = shotFlow(g, t);
      else if (t < TT.n16 - 0.1) fl = shotReasons(g, t);
      else if (t < TT.n17 - 0.08) fl = shotPhoto(g, t);
      else if (t < TT.you - 0.05) fl = shotVillain(g, t);
      else if (t < TT.n19 - 0.1) fl = shotID(g, t);
      else fl = shotEnd(g, t);
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
