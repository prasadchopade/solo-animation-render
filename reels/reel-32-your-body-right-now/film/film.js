// Reel 32 · working title "Your Body, Right Now". A second-slot pilot, not an episode of the series. Four lines to read in your mother's voice; the fourth won't play.
// The film's one law: a BUBBLE is inside your head (its tail goes into his ear, nobody speaks); a WAVEFORM is real. The only waveform is the last shot.
// Sources and care: docs/research.md. Our own drawings; nobody real. 30 fps, no motion blur. Every frame is a pure function of t.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT, F = window.FACE;
  const { hit, tb, words } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono', '900 100px Her'].concat(['NDeva', 'NBeng', 'NTaml', 'NTelu', 'NKnda', 'NMlym', 'NGujr', 'NGuru', 'NOrya', 'NUrdu'].map((f) => `900 100px ${f}`));
  const TAU = Math.PI * 2;
  const INK = '#14130f', CREAM = '#fff8ea', YEL = '#ffcf3f', YEL2 = '#ffbe2e', RED = '#e2301a', TEAL = '#1f9e9a', WOOD = '#b5763f', WOODD = '#8a5529', SKY = '#7fc8ee';
  const SK = { h: '#dcae87', m: '#c48e68', d: '#9b6847' };
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
  const R = (g, x, y, w, h, r = 0) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const lg = (g, x0, y0, x1, y1, ...stops) => { const q = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const rg = (g, x, y, r0, r1, ...stops) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const offscreen = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // a value that moves through keys: [[t, value, dur?], ...], from init; pure in t
  const ramp = (t, init, list) => { let v = init; for (const [ti, val, d = 0.16] of list) { if (t < ti) break; v = lerp(v, val, sstep(ti, ti + d, t)); } return v; };

  const font = (size, kind = 'cond') => (kind === 'cond' ? `700 condensed ${size}px Bahn` : kind === 'semi' ? `700 semi-condensed ${size}px Bahn` : kind === 'mono' ? `700 ${size}px Mono` : kind === 'her' ? `900 ${size}px Her` : `900 ${size}px ${kind}`);
  function txt(g, s, x, y, size, color = INK, o = {}) {
    g.save();
    g.font = font(size, o.kind || 'cond'); g.fillStyle = color; g.textAlign = o.align || 'center'; g.textBaseline = 'alphabetic';
    if (o.rtl) g.direction = 'rtl';
    g.globalAlpha *= o.a ?? 1;
    if (o.fit) { const w = g.measureText(s).width; if (w > o.fit) { size *= o.fit / w; g.font = font(size, o.kind || 'cond'); } }
    if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
    if (o.stroke) { g.lineJoin = 'round'; g.strokeStyle = o.stroke; g.lineWidth = size * (o.sw ?? 0.14); g.strokeText(s, x, y); }
    g.fillText(s, x, y);
    g.restore();
  }

  // ------------------------------------------------------------------ timing, from the narration
  const at = (p) => words(p)[0].t0;
  const wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;
  const en = (p) => { const w = words(p); return w[w.length - 1].t1; };
  let T = null;
  function times() {
    if (T) return T;
    T = { end: tb('end') };
    for (let i = 1; i <= 16; i++) { const id = 'n' + String(i).padStart(2, '0'); T[id] = at(id); T[id + 'e'] = en(id); }
    T.q1 = T.n01e - 0.1;                                 // the words land in the empty bubble as she finishes saying "voice"
    T.lang0 = wi('n02', 10) - 0.05;                      // "...in ENGLISH": the bubble starts changing language
    T.lang1 = T.n03 - 0.1;
    T.cap2 = wi('n02', 11) - 0.05;                       // "How many of you..."
    T.cap3 = T.n03 - 0.05;
    T.d1 = wi('n03', 2) - 0.05;                          // "four" of these: the dots
    T.side = T.n04 - 0.1;
    T.sit = T.n04e + 0.08;                               // SIT UP STRAIGHT
    T.snap = T.sit + 0.18;
    T.tick = wi('n05', 2) + 0.02;
    T.front2 = T.n06 - 0.12;
    T.guests = wi('n06', 7) - 0.32;
    T.wait = T.n06e + 0.08;                              // WAIT TILL WE GET HOME
    T.freeze = T.wait + 0.22;
    T.xray = T.n07 - 0.12;
    T.drop = wi('n07', 7) - 0.05;                        // "...goes straight to your STOMACH"
    T.last = T.n08 - 0.12;
    T.ily = T.n08e + 0.14;                               // I LOVE YOU: the fan stops, and there's real silence
    T.slip = T.n09 - 0.36;                               // the letters start to go in the silence, just before "Strange"
    T.built = T.n10 - 0.1;
    T.tiny = T.n11 - 0.12;
    T.multi = wi('n12', 5) - 0.06;                       // "...has she said THIS?"
    T.same = T.n13 - 0.04;                               // every bubble turns over
    T.shelf = T.n14 - 0.14;
    T.phone = T.n15 - 0.12;
    T.q2 = T.n16 - 0.05;
    T.call = T.n16e + 0.28;                              // his thumb
    T.ear = T.call + 0.34;                               // cut: phone at his ear, it rings
    T.pick = T.ear + 1.1;                                // she answers: the timer starts
    T.w1 = T.pick + 0.22;                                // WHAT HAPPENED?
    T.w2 = T.pick + 1.42;                                // HAVE YOU EATEN?
    return T;
  }

  // ------------------------------------------------------------------ the people
  const HIM = F.LOOK({ tone: 1, hv: 0.92, hm: 0.72, hp: 0.32, hs: 0, hf: 0.28, collar: 0, shirt: [34, 158, 152], shirtD: [20, 116, 114], stub: 0.1, iris: 19.5, lookY: 3 });
  const GUESTS = [
    F.LOOK({ tone: 2, hv: 0.24, hs: 0.74, hf: 0, must: 0.92, specs: 1, collar: 1, shirt: [238, 232, 216], shirtD: [204, 196, 174], smile: 0.04, browY: 6, open: 1.16, button: 1 }),
    F.LOOK({ tone: 1, her: 1, part: 1, nape: 1, hv: 0.34, hs: 0, hf: 0, hm: 0, bindi: 1, ear: 1, pallu: 1, palluC: [206, 44, 96], palluD: [150, 28, 72], shirt: [226, 188, 66], shirtD: [188, 148, 40], collar: 0, smile: 0, browY: 8, open: 1.14 }),
    F.LOOK({ tone: 0, her: 1, part: 1, hgrey: 0.86, hv: 0.3, hs: 0, hf: 0, hm: 0, specs: 1, old: 1, ear: 1, stud: 1, pallu: 1, palluC: [66, 140, 96], palluD: [42, 102, 70], shirt: [230, 214, 182], shirtD: [196, 176, 140], collar: 0, smile: -0.08, browY: 10, open: 1.2 }),
  ];
  const PHOTO = F.LOOK({ tone: 1, her: 1, part: 1, hgrey: 0.72, hv: 0.3, hs: 0, hf: 0, hm: 0, old: 0.8, bindi: 1, bindiC: 1, ear: 1, stud: 1, pallu: 1, palluC: [120, 92, 172], palluD: [86, 62, 132], shirt: [214, 196, 226], shirtD: [172, 152, 190], collar: 0, smile: 0.62, lidLow: 0.7, open: 0.82 });

  const BLINKS = (() => { const r = mulberry32(32), out = []; let t = 1.3; while (t < 90) { out.push(t); t += 2.1 + r() * 2.8; } return out; })();
  const blink = (t) => { for (const b of BLINKS) { if (t < b - 0.1) return 0; if (t < b + 0.14) return Math.exp(-Math.pow((t - b) / 0.07, 2)); } return 0; };

  // his pose over the frontal shots
  function himPose(t, base) {
    const TT = times();
    const P = { ...HIM, ...base };
    P.open = (P.open ?? 1) * (1 - 0.95 * blink(t));
    P.roll = (P.roll || 0) + Math.sin(t * 0.93 + 1) * 0.012;
    P.yaw = (P.yaw || 0) + Math.sin(t * 0.71) * 0.022;
    return P;
  }
  const draw = (g, P, x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s); F.draw(g, P); g.restore(); };
  // his ear, where a bubble's tail ends. k = +1: the ear on the viewer's right
  function earOf(P, x, y, s, k = 1) {
    const hw = 186 * P.jaw, ex = k * (hw + 1) - P.yaw * 15, ey = -18 - P.pitch * 8;
    const dy = ey - 190, c = Math.cos(P.roll), sn = Math.sin(P.roll);
    return [x + s * (ex * c - dy * sn), y + s * (ex * sn + dy * c + 190)];
  }

  // ------------------------------------------------------------------ the fan: it turns until she's meant to say the one thing
  function fanAngle(t) {
    const TT = times(), w = 15;
    if (t < TT.ily) return w * t;
    return w * TT.ily + (w / 3.2) * (1 - Math.exp(-3.2 * (t - TT.ily)));
  }
  function fan(g, x, y, s, t) {
    const a = fanAngle(t);
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#c9c4b8'; R(g, -9, -190, 18, 150, 5); g.fill();
    for (let i = 0; i < 3; i++) {
      const th = a + i * TAU / 3, c = Math.cos(th), sn = Math.sin(th), bx = c * 300, by = sn * 62;
      g.fillStyle = c * sn > 0 ? '#efe9db' : '#d8d1bf';
      g.beginPath(); g.moveTo(c * 40 - sn * 30, sn * 8 + c * 9); g.lineTo(bx - sn * 58, by + c * 16); g.lineTo(bx + sn * 58, by - c * 16); g.lineTo(c * 40 + sn * 30, sn * 8 - c * 9); g.closePath(); g.fill();
    }
    g.fillStyle = '#b9b3a4'; ell(g, 0, 0, 74, 34); g.fill(); g.fillStyle = '#e5dfd0'; ell(g, 0, -6, 58, 22); g.fill();
    g.restore();
  }

  // ------------------------------------------------------------------ his room (seen from the foot of the bed). Her handwriting is on everything he owns.
  const tape = (g, s, x, y, w, rot, size = 30) => {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = '#f2e6c6'; R(g, -w / 2, -24, w, 48, 3); g.fill(); g.strokeStyle = 'rgba(120,90,40,0.25)'; g.lineWidth = 1.5; g.stroke();
    g.font = `900 ${size}px Her`; g.fillStyle = '#2b3f8c'; g.textAlign = 'center'; g.fillText(s, 0, size * 0.34);
    g.restore();
  };
  function headboard(g) {
    g.fillStyle = lg(g, 0, 1292, 0, 1344, [0, '#c98a4f'], [1, '#9a6230']); g.fillRect(-20, 1292, W + 40, 50);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(-20, 1296, W + 40, 6);
    for (const x of [26, 1010]) { g.fillStyle = lg(g, x, 0, x + 54, 0, [0, '#a86b35'], [1, '#7c4b20']); R(g, x, 1236, 54, 520, 10); g.fill(); g.fillStyle = '#c98a4f'; ell(g, x + 27, 1236, 33, 22); g.fill(); }
  }
  let ROOM = null;
  function makeRoom() {
    const c = offscreen(W, H), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#ffd653'], [0.6, '#ffc93a'], [1, '#f9b62c']); g.fillRect(0, 0, W, H);
    const r = mulberry32(320);
    g.strokeStyle = 'rgba(160,110,10,0.05)'; g.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 + r() * 90, y + r() * 8); g.stroke(); }
    // the door, standing open, on the viewer's left
    g.fillStyle = '#5f7ea3'; g.fillRect(-20, 360, 266, 1360);
    g.fillStyle = lg(g, 0, 360, 0, 1720, [0, '#6f8db0'], [1, '#4b6688']); g.fillRect(-20, 360, 266, 1360);
    g.fillStyle = 'rgba(255,240,200,0.14)'; g.beginPath(); g.moveTo(-20, 1720); g.lineTo(246, 1720); g.lineTo(150, 1290); g.lineTo(-20, 1290); g.closePath(); g.fill();
    g.fillStyle = WOOD; g.fillRect(246, 330, 34, 1400); g.fillRect(-20, 330, 300, 34);
    g.fillStyle = WOODD; g.fillRect(274, 330, 6, 1400);
    // her note, stuck to the frame of the door
    tape(g, 'LOCK THE GAS', 170, 760, 190, -0.04, 25);
    // the shelf on the viewer's right
    g.fillStyle = WOOD; R(g, 806, 1006, 300, 20, 3); g.fill(); g.fillStyle = WOODD; g.fillRect(806, 1026, 300, 6);
    // a steel tiffin
    for (let i = 0; i < 3; i++) { g.fillStyle = lg(g, 816, 0, 956, 0, [0, '#c7ccd2'], [0.4, '#f2f4f6'], [1, '#9aa1a9']); R(g, 816, 930 - i * 58, 140, 54, 8); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2; g.stroke(); }
    g.fillStyle = '#a9afb6'; R(g, 878, 796, 16, 40, 5); g.fill(); g.strokeStyle = '#a9afb6'; g.lineWidth = 8; g.beginPath(); g.moveTo(832, 852); g.quadraticCurveTo(886, 770, 940, 852); g.stroke();
    tape(g, 'HEAT IT FIRST', 886, 950, 160, 0.03, 21);
    // a jar of pickle
    g.fillStyle = 'rgba(190,80,30,0.92)'; R(g, 972, 870, 88, 136, 16); g.fill(); g.fillStyle = '#d43a2c'; R(g, 978, 846, 76, 30, 6); g.fill();
    tape(g, '1 SPOON', 1016, 940, 96, -0.05, 21);
    // a sticking-plaster of a calendar
    g.fillStyle = '#fbf7ec'; R(g, 796, 1052, 150, 216, 6); g.fill(); g.fillStyle = RED; R(g, 796, 1052, 150, 48, 6); g.fill();
    g.font = '700 condensed 34px Bahn'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('NOVEMBER', 871, 1088);
    g.fillStyle = 'rgba(30,30,30,0.5)'; for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { ell(g, 818 + x * 27, 1122 + y * 24, 6, 6); g.fill(); }
    tape(g, 'CALL ON SUNDAY', 866, 1250, 158, 0.04, 18);
    headboard(g);
    // the pillow behind him
    g.fillStyle = lg(g, 0, 1380, 0, 1900, [0, '#fbf5e8'], [1, '#dcd3bd']); g.beginPath(); g.moveTo(120, 1660); g.bezierCurveTo(110, 1470, 170, 1392, 300, 1386); g.bezierCurveTo(430, 1372, 650, 1372, 780, 1386); g.bezierCurveTo(910, 1392, 970, 1470, 960, 1660); g.closePath(); g.fill();
    // the sheet
    g.fillStyle = lg(g, 0, 1640, 0, 1920, [0, '#3f6db4'], [1, '#2c5192']); g.fillRect(0, 1640, W, 280);
    g.fillStyle = 'rgba(255,255,255,0.16)'; for (let x = -40; x < W; x += 92) { g.save(); g.translate(x, 1640); g.transform(1, 0, 0.32, 1, 0, 0); g.fillRect(0, 0, 34, 280); g.restore(); }
    ROOM = c;
  }

  // ------------------------------------------------------------------ the bubble
  function bubbleShape(g, x, y, w, h, tail) {
    const r = Math.min(h / 2, 104);
    g.beginPath();
    if (tail) {
      const [tx, ty, bx] = tail, b0 = clamp(bx - 40, x + r, x + w - r - 80), b1 = b0 + 96;
      const up = ty < y;
      if (up) { g.roundRect(x, y, w, h, r); return; }
      g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      g.lineTo(b1, y + h);
      g.quadraticCurveTo(lerp(b1, tx, 0.4) + 34, lerp(y + h, ty, 0.5), tx, ty);
      g.quadraticCurveTo(lerp(b0, tx, 0.42) - 22, lerp(y + h, ty, 0.44), b0, y + h);
      g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
    } else g.roundRect(x, y, w, h, r);
  }
  // o: cx cy w h, tail [x, y, baseX], k (pop), a, fill, ink, lw, draw(g, innerW)
  function bubble(g, o) {
    const { cx, cy, w, h } = o, k = o.k ?? 1, a = o.a ?? 1;
    if (k <= 0.01 || a <= 0.01) return;
    g.save(); g.globalAlpha *= a;
    g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy);
    const x = cx - w / 2, y = cy - h / 2;
    bubbleShape(g, x + 7, y + 11, w, h, null); g.fillStyle = 'rgba(70,40,0,0.22)'; g.fill();
    bubbleShape(g, x, y, w, h, o.tail); g.fillStyle = o.fill || CREAM; g.fill();
    g.strokeStyle = o.ink || INK; g.lineWidth = o.lw ?? 9; g.lineJoin = 'round'; g.stroke();
    if (o.draw) o.draw(g);
    g.restore();
  }
  const pop = (t, t0) => (t < t0 ? 0 : clamp(lerp(0.72, 1, hit(t, t0 + 0.05, 'heavy'))));
  // two-line words, centred in a bubble
  function say(g, lines, cx, cy, size, w, color = INK, o = {}) {
    const n = lines.length, lh = size * (o.lh ?? 1.02), y0 = cy - (n - 1) * lh / 2 + size * 0.35;
    lines.forEach((s, i) => txt(g, s, cx, y0 + i * lh, size, color, { kind: o.kind || 'her', fit: w }));
  }

  // the other languages she might have said it in. (Each is read aloud by someone in the comments.)
  const LANGS = [
    ['சாப்பிட்டியா?', 'NTaml'], ['খেয়েছিস?', 'NBeng'], ['खाना खाया?', 'NDeva'], ['తిన్నావా?', 'NTelu'], ['കഴിച്ചോ?', 'NMlym'], ['ಊಟ ಆಯ್ತಾ?', 'NKnda'], ['जेवण झालं का?', 'NDeva'],
    ['જમી લીધું?', 'NGujr'], ['ਰੋਟੀ ਖਾ ਲਈ?', 'NGuru'], ['کھانا کھایا؟', 'NUrdu', true], ['ଖାଇଲୁ କି?', 'NOrya'], ['¿YA COMISTE?', 'her'],
  ];
  function sayLang(g, i, cx, cy, size, w) {
    const [s, kind, rtl] = LANGS[i % LANGS.length];
    txt(g, s, cx, cy + size * 0.34, size, INK, { kind, rtl, fit: w });
  }

  // ------------------------------------------------------------------ the four dots
  function dots(g, t) {
    const TT = times();
    if (t < TT.d1) return;
    const a = sstep(TT.d1, TT.d1 + 0.12, t) * (1 - sstep(TT.multi - 0.1, TT.multi + 0.05, t));
    if (a <= 0) return;
    const on = [TT.q1, TT.sit, TT.wait, TT.ily], x0 = 513 - 3 * 34;
    g.save(); g.globalAlpha *= a;
    for (let i = 0; i < 4; i++) {
      const x = x0 + i * 68, y = 298, f = t >= on[i] ? hit(t, on[i], 'heavy') : 0, fail = i === 3 && t >= TT.slip;
      g.fillStyle = 'rgba(255,255,255,0.75)'; ell(g, x, y, 22, 22); g.fill();
      g.strokeStyle = INK; g.lineWidth = 6; ell(g, x, y, 22, 22); g.stroke();
      if (f > 0.01) { g.fillStyle = fail ? RED : INK; ell(g, x, y, 15 * f, 15 * f); g.fill(); }
      if (fail) { g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 7, y - 7); g.lineTo(x + 7, y + 7); g.moveTo(x + 7, y - 7); g.lineTo(x - 7, y + 7); g.stroke(); }
    }
    g.restore();
  }

  function phoneHands(g, x, y, s, rot) {             // the back of his phone, held in both hands
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, -130, 0, 130, 0, [0, '#23262c'], [0.5, '#3a3f47'], [1, '#1b1e23']); R(g, -130, -250, 260, 500, 36); g.fill();
    g.fillStyle = '#14161a'; R(g, -106, -226, 88, 96, 20); g.fill(); g.fillStyle = '#2d3640'; ell(g, -84, -204, 16, 16); g.fill(); ell(g, -40, -204, 16, 16); g.fill(); ell(g, -62, -160, 16, 16); g.fill();
    for (const k of [-1, 1]) {
      g.fillStyle = lg(g, k * 110, -120, k * 240, 200, [0, SK.h], [1, SK.d]);
      for (let i = 0; i < 4; i++) { R(g, k > 0 ? 112 : -170, -70 + i * 62, 58, 54, 26); g.fill(); }
      R(g, k > 0 ? 130 : -260, -130, 130, 460, 60); g.fill();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ 1 · frontal: the first line
  const SLOUCH = { cx: 540, cy: 1238, s: 1.22 };
  function frontBack(g, t, c = {}) {
    if (!ROOM) makeRoom();
    const z = c.z ?? 1, ox = c.ox ?? 540, oy = c.oy ?? 1100;
    g.save(); g.translate(ox, oy); g.scale(z, z); g.translate(-ox, -oy);
    g.drawImage(ROOM, 0, 0);
    g.restore();
    fan(g, 540, 148, 1, t);
  }
  function shotOne(g, t) {
    const TT = times();
    frontBack(g, t);
    const hear = sstep(TT.q1, TT.q1 + 0.3, t);
    const P = himPose(t, {
      pitch: ramp(t, 0.42, [[TT.q1, 0.14, 0.3]]), roll: -0.05, lookY: ramp(t, 12, [[TT.q1, 0, 0.24]]), lookX: ramp(t, 0, [[TT.q1 + 0.05, 20, 0.2], [TT.n02 + 0.2, 0, 0.3], [TT.lang0, 12, 0.2]]),
      browY: ramp(t, 2, [[TT.q1, -8, 0.2], [TT.n02, 4, 0.3]]), smile: ramp(t, 0.02, [[TT.q1 + 0.2, 0.18, 0.4], [TT.n02, 0.46, 0.3]]), grin: ramp(t, 0, [[TT.n02 + 0.1, 0.28, 0.3], [TT.lang0, 0, 0.3]]),
    });
    draw(g, P, SLOUCH.cx, SLOUCH.cy, SLOUCH.s);
    phoneHands(g, 540, 1868, 0.66, -0.02);
    // the top words, three in turn
    const cap = t < TT.cap2 ? ['READ THIS IN', "YOUR MOTHER'S VOICE", 112, 128] : t < TT.cap3 ? ['HOW MANY OF YOU', 'HEARD ENGLISH?', 118, 132] : ["I'VE GOT FOUR OF THESE.", "ONE WON'T WORK.", 96, 138];
    const c0 = t < TT.cap2 ? -1 : t < TT.cap3 ? TT.cap2 : TT.cap3, ck = c0 < 0 ? 1 : lerp(0.9, 1, hit(t, c0, 'heavy'));
    g.save(); g.translate(513, 450); g.scale(ck, ck); g.translate(-513, -450);
    const dy = t >= TT.cap3 ? 18 : 0;                    // the dots are up there by now
    txt(g, cap[0], 513, 396 + dy, cap[2], INK, { fit: 866, stroke: 'rgba(255,248,234,0.9)', sw: 0.12 });
    txt(g, cap[1], 513, 506 + dy, cap[3], t >= TT.cap2 ? RED : INK, { fit: 866, stroke: 'rgba(255,248,234,0.9)', sw: 0.12 });
    g.restore();
    const [ex, ey] = earOf(P, SLOUCH.cx, SLOUCH.cy, SLOUCH.s, 1);
    const cy = 708, h = 280;
    bubble(g, {
      cx: 505, cy, w: 836, h, tail: [ex + 2, ey - 10, 690], draw(q) {
        if (t < TT.q1) return;
        const k = hit(t, TT.q1 - 0.02, 'heavy');
        q.save(); q.translate(505, cy); q.scale(lerp(0.8, 1, k), lerp(0.8, 1, k)); q.translate(-505, -cy);
        if (t < TT.lang0) say(q, ['HAVE YOU', 'EATEN?'], 505, cy, 128, 760);
        else {
          const i = Math.floor((t - TT.lang0) / 0.3);
          if (t >= TT.lang1) say(q, ['HAVE YOU', 'EATEN?'], 505, cy, 128, 760);
          else sayLang(q, i, 505, cy, 150, 740);
        }
        q.restore();
      },
    });
    dots(g, t);
  }

  // ------------------------------------------------------------------ 2 · side on: SIT UP STRAIGHT
  let SIDE = null;
  function makeSide() {
    const c = offscreen(W, H), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#ffd653'], [1, '#ffc437']); g.fillRect(0, 0, W, H);
    // the open door: nobody
    g.fillStyle = lg(g, 0, 700, 0, 1560, [0, '#6f8db0'], [1, '#4b6688']); g.fillRect(70, 700, 300, 860);
    g.fillStyle = 'rgba(255,240,200,0.14)'; g.beginPath(); g.moveTo(70, 1560); g.lineTo(370, 1560); g.lineTo(300, 1290); g.lineTo(70, 1290); g.closePath(); g.fill();
    g.fillStyle = WOOD; g.fillRect(44, 672, 30, 900); g.fillRect(44, 672, 356, 30); g.fillRect(370, 672, 30, 900);
    // the floor and the bed
    g.fillStyle = '#c98c52'; g.fillRect(0, 1560, W, 360);
    g.fillStyle = lg(g, 0, 1380, 0, 1560, [0, '#3f6db4'], [1, '#2c5192']); R(g, 330, 1390, 800, 200, 26); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.16)'; for (let x = 360; x < W; x += 74) g.fillRect(x, 1390, 26, 200);
    g.fillStyle = WOODD; g.fillRect(380, 1580, 40, 120); g.fillRect(960, 1580, 40, 120);
    SIDE = c;
  }
  const thick = (g, a, b, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  function sideMan(g, u, t, look) {
    const Hp = [820, 1330], K0 = [572, 1170], Ft = [438, 1372];
    const N = [lerp(676, 816, u), lerp(1040, 878, u)], Cc = [lerp(992, 826, u), lerp(1150, 1104, u)];
    // legs
    g.fillStyle = '#34343f';
    thick(g, Hp, K0, 128, '#3d4256'); thick(g, K0, Ft, 96, '#3d4256');
    g.fillStyle = '#e8e2d2'; R(g, 372, 1352, 120, 54, 22); g.fill();
    // torso
    g.strokeStyle = lg(g, 640, 900, 1000, 1400, [0, '#2fb1aa'], [1, '#17827e']); g.lineWidth = 196; g.lineCap = 'round'; g.beginPath(); g.moveTo(Hp[0], Hp[1]); g.quadraticCurveTo(Cc[0], Cc[1], N[0], N[1]); g.stroke();
    // the neck
    const a = lerp(0.46, -0.03, u), HC = [N[0] + lerp(-92, -34, u), N[1] + lerp(-92, -130, u)];
    thick(g, N, [HC[0] + 8, HC[1] + 60], 88, SK.d);
    // the arm and the phone
    const S = [N[0] + lerp(-6, 8, u), N[1] + 44], handY = lerp(1088, 1228, u), W2 = [lerp(560, 628, u), handY];
    const El = [lerp(720, 790, u), lerp(1210, 1300, u)];
    g.save(); g.translate(W2[0] - 22, W2[1] - 8); g.rotate(lerp(-0.34, 0.9, u)); g.fillStyle = '#1b1e23'; R(g, -32, -118, 64, 160, 12); g.fill(); g.restore();
    thick(g, S, El, 84, '#27a29c'); thick(g, El, W2, 62, SK.m); g.fillStyle = SK.m; ell(g, W2[0] - 6, W2[1], 42, 36); g.fill();
    // the head, in profile, facing the door
    g.save(); g.translate(HC[0], HC[1]); g.rotate(-a);
    const skin = lg(g, -130, -120, 110, 130, [0, SK.h], [1, SK.d]);
    g.fillStyle = skin; g.beginPath(); g.moveTo(-48, -130); g.bezierCurveTo(-96, -128, -122, -86, -122, -50); g.lineTo(-156, 14); g.bezierCurveTo(-160, 26, -146, 32, -128, 32); g.lineTo(-124, 52); g.bezierCurveTo(-140, 60, -136, 72, -122, 76); g.bezierCurveTo(-124, 96, -112, 124, -74, 128); g.bezierCurveTo(-20, 130, 60, 120, 102, 60); g.bezierCurveTo(138, 8, 130, -96, 72, -126); g.closePath(); g.fill();
    g.fillStyle = '#17110d'; g.beginPath(); g.moveTo(-112, -92); g.bezierCurveTo(-130, -128, -92, -176, -30, -170); g.bezierCurveTo(46, -192, 150, -130, 138, -18); g.bezierCurveTo(132, 36, 112, 62, 84, 74); g.bezierCurveTo(92, 26, 62, -14, 34, -30); g.bezierCurveTo(-14, -60, -60, -78, -112, -92); g.closePath(); g.fill();
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-90 + i * 34, -150 - 8 * Math.sin(i)); g.lineTo(-70 + i * 34, -192 - 12 * Math.cos(i * 2)); g.lineTo(-52 + i * 34, -152); g.closePath(); g.fill(); }
    g.fillStyle = SK.m; ell(g, 44, 2, 25, 37); g.fill(); g.fillStyle = SK.d; ell(g, 46, 4, 12, 22); g.fill();
    const lx = look.x;
    g.fillStyle = '#fbf7ee'; ell(g, -84, -22, 25, look.open * 17); g.fill();
    g.fillStyle = '#26170d'; ell(g, -88 + lx, -22, 13, 13 * Math.min(1, look.open)); g.fill();
    g.fillStyle = '#fff'; ell(g, -92 + lx, -27, 4, 4); g.fill();
    g.strokeStyle = '#231510'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-110, -30); g.quadraticCurveTo(-84, -48 * look.open, -60, -28); g.stroke();
    g.strokeStyle = '#17110d'; g.lineWidth = 12; g.beginPath(); g.moveTo(-118, -60 + look.brow); g.quadraticCurveTo(-92, -82 + look.brow, -62, -66 + look.brow); g.stroke();
    g.strokeStyle = '#6e3a30'; g.lineWidth = 6; g.beginPath(); g.moveTo(-122, 56); g.quadraticCurveTo(-98, 62 + look.mouth, -78, 54); g.stroke();
    g.restore();
    return { ear: [HC[0] + 44 * Math.cos(a) + 2 * Math.sin(a), HC[1] - 44 * Math.sin(a) + 2 * Math.cos(a)], N, Cc, Hp };
  }
  function shotSide(g, t) {
    const TT = times();
    if (!SIDE) makeSide();
    g.drawImage(SIDE, 0, 0);
    const u0 = t < TT.snap ? 0 : (hit(t, TT.snap, { response: 0.11, damping: 0.42 }));
    const u = clamp(u0, -0.1, 1.2) * (1 - 0.0 * t);
    const look = { x: ramp(t, 0, [[TT.snap + 0.1, -9, 0.1]]), open: ramp(t, 0.8, [[TT.snap - 0.04, 1.32, 0.06]]) * (1 - blink(t + 0.6)), brow: ramp(t, 8, [[TT.snap, -14, 0.08], [TT.n05, -6, 0.3]]), mouth: ramp(t, 3, [[TT.snap, -7, 0.1]]) };
    const r = sideMan(g, u, t, look);
    // the back as a line: a banana, then a ruler, then a tick
    if (t >= TT.n04 + 0.08) {
      const a = sstep(TT.n04 + 0.08, TT.n04 + 0.3, t);
      g.save(); g.globalAlpha *= a * 0.92; g.setLineDash([26, 22]); g.strokeStyle = u > 0.8 ? '#17a54a' : RED; g.lineWidth = 10; g.lineCap = 'round';
      const off = 118; g.beginPath(); g.moveTo(r.Hp[0] + off, r.Hp[1] - 14); g.quadraticCurveTo(r.Cc[0] + off * 1.04, r.Cc[1], r.N[0] + off * 1.05, r.N[1] - 8); g.stroke(); g.restore();
    }
    if (t >= TT.tick) {
      const k = hit(t, TT.tick, 'heavy'), x = r.N[0] + 214, y = r.N[1] + 210;
      g.save(); g.translate(x, y); g.scale(k, k); g.fillStyle = '#17a54a'; ell(g, 0, 0, 64, 64); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-28, 2); g.lineTo(-8, 24); g.lineTo(30, -24); g.stroke(); g.restore();
    }
    if (t >= TT.sit) {
      const k = pop(t, TT.sit);
      bubble(g, { cx: 490, cy: 496, w: 760, h: 270, k, tail: [r.ear[0], r.ear[1] - 16, 620], draw(q) { say(q, ['SIT UP', 'STRAIGHT.'], 490, 496, 118, 680); } });
    }
    dots(g, t);
    if (t >= TT.snap && t < TT.snap + 0.3) { g.strokeStyle = 'rgba(20,19,15,0.55)'; g.lineWidth = 8; g.lineCap = 'round'; const a = 1 - (t - TT.snap) / 0.3; g.globalAlpha = a; for (const dx of [-40, 0, 40]) { g.beginPath(); g.moveTo(r.N[0] + dx, r.N[1] - 256); g.lineTo(r.N[0] + dx, r.N[1] - 306); g.stroke(); } g.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ 3 · guests, and what she says about them
  function shotGuests(g, t) {
    const TT = times();
    frontBack(g, t);
    // the guests rise behind the bed, chewing, and stop chewing
    const G = [[172, 1000, 0.5, 0.0], [890, 960, 0.54, 0.09], [300, 780, 0.42, 0.18]];
    const stop = TT.freeze;
    [2, 0, 1].forEach((i) => {
      const [x, y, s, d] = G[i], k = t < TT.guests + d ? 0 : hit(t, TT.guests + d, { response: 0.22, damping: 0.55 });
      if (k <= 0.005) return;
      const chew = t < stop ? Math.abs(Math.sin((t + i * 0.6) * 11)) : 0;
      const P = { ...GUESTS[i], open: GUESTS[i].open * (1 - 0.9 * blink(t + i * 1.7)), grin: 0.07 + chew * 0.09, lookX: i === 1 ? -10 : 14, lookY: 10, roll: (i - 1) * 0.04 };
      g.save(); g.beginPath(); g.rect(0, 0, W, 1310); g.clip(); draw(g, P, x, y + (1 - k) * 360, s); g.restore();
    });
    headboard(g);
    { const P0 = ROOM; g.save(); g.beginPath(); g.moveTo(120, 1660); g.bezierCurveTo(110, 1470, 170, 1392, 300, 1386); g.bezierCurveTo(430, 1372, 650, 1372, 780, 1386); g.bezierCurveTo(910, 1392, 970, 1470, 960, 1660); g.closePath(); g.clip(); g.drawImage(P0, 0, 0); g.restore(); }
    const up = sstep(TT.freeze - 0.08, TT.freeze + 0.06, t);
    const P = himPose(t, {
      pitch: 0.02, roll: lerp(0.05, 0, up), yaw: ramp(t, 0, [[TT.guests, -0.16, 0.2], [TT.freeze, 0, 0.1]]), open: lerp(1, 1.34, up), iris: lerp(19.5, 14.5, up), lookX: ramp(t, 0, [[TT.guests, -17, 0.16], [TT.freeze, 0, 0.1]]), lookY: 3,
      browY: lerp(-4, -18, up), browIn: lerp(0, -8, up), press: lerp(0.15, 0.8, up), smile: lerp(0.12, -0.2, up), sweat: up,
    });
    const cx = 540 + (t >= TT.freeze ? Math.sin(t * 60) * 2.2 * up : 0), cy = 1200, s = 1.25;
    draw(g, P, cx, cy, s);
    if (t >= TT.wait) {
      const k = pop(t, TT.wait), [ex, ey] = earOf(P, cx, cy, s, 1);
      bubble(g, { cx: 513, cy: 500, w: 860, h: 320, k, tail: [ex + 2, ey - 10, 700], fill: '#fff1e6', draw(q) { say(q, ['WAIT TILL', 'WE GET HOME.'], 513, 500, 120, 790, '#b3200f'); } });
    }
    dots(g, t);
  }

  // ------------------------------------------------------------------ 4 · the stomach
  function stomach(g, x, y, s, squash) {
    g.save(); g.translate(x, y); g.scale(s * (1 + squash * 0.22), s * (1 - squash * 0.28));
    g.fillStyle = lg(g, -70, -90, 90, 90, [0, '#ff9fa8'], [1, '#e2536a']);
    g.beginPath(); g.moveTo(-34, -96); g.bezierCurveTo(-18, -100, -6, -86, -8, -64); g.bezierCurveTo(44, -86, 104, -56, 106, 14); g.bezierCurveTo(108, 78, 40, 106, -22, 96); g.bezierCurveTo(-92, 86, -112, 18, -70, -22); g.bezierCurveTo(-58, -34, -46, -60, -34, -96); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,20,44,0.45)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-40, 30); g.quadraticCurveTo(20, 66, 74, 18); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.45)'; ell(g, 38, -36, 22, 12, -0.5); g.fill();
    g.restore();
  }
  function shotStomach(g, t) {
    const TT = times();
    frontBack(g, t);
    const P = himPose(t, { pitch: -0.02, open: 1.24, iris: 15, browY: -14, press: 0.5, smile: -0.2, sweat: 1, lookY: 6 });
    draw(g, P, 540, 640, 0.84);
    // the X-ray panel over his middle
    const x = 276, y = 900, w = 528, h = 636;
    g.save(); R(g, x, y, w, h, 40); g.fillStyle = lg(g, 0, y, 0, y + h, [0, '#123e72'], [1, '#0b2748']); g.fill(); g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
    g.clip();
    g.strokeStyle = 'rgba(190,230,255,0.82)'; g.lineWidth = 13; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) for (const k of [-1, 1]) { const yy = y + 44 + i * 66; g.beginPath(); g.moveTo(540 + k * 18, yy); g.quadraticCurveTo(540 + k * 190, yy - 18, 540 + k * 210, yy + 54); g.stroke(); }
    g.fillStyle = 'rgba(190,230,255,0.6)'; for (let i = 0; i < 11; i++) { R(g, 524, y + 14 + i * 58, 32, 42, 8); g.fill(); }
    const fall = t < TT.drop ? 0 : Math.min(1, Math.pow((t - TT.drop) / 0.32, 2));
    const yS = lerp(y + 190, y + 532, fall), land = t >= TT.drop + 0.32 ? Math.exp(-(t - TT.drop - 0.32) * 12) * Math.cos((t - TT.drop - 0.32) * 34) : 0;
    if (t >= TT.drop && t < TT.drop + 0.32) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 7; for (const dx of [-70, 0, 70]) { g.beginPath(); g.moveTo(540 + dx, yS - 150); g.lineTo(540 + dx, yS - 96); g.stroke(); } }
    stomach(g, 540, yS, 1.28, land);
    g.restore();
    dots(g, t);
  }

  // ------------------------------------------------------------------ 5 · "Last one." I LOVE YOU, and it comes apart
  const ILY_FONTS = ['900 Xpx Her', '700 condensed Xpx Bahn', '700 Xpx Mono', '900 Xpx Her', '700 semi-condensed Xpx Bahn'];
  const CHIP = ['#fff8ea', '#ffe07a', '#d3f0ff', '#ffd2c6', '#e6e0ff', '#d6f5d8', '#fff8ea', '#ffe07a'];
  function ransom(g, cx, cy, size, q, t) {
    const L = 'I LOVE YOU', r = mulberry32(77);
    g.save(); g.font = `900 ${size}px Her`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const widths = [...L].map((c) => g.measureText(c).width), tot = widths.reduce((a, b) => a + b, 0);
    let x = cx - tot / 2;
    const items = [...L].map((c, i) => { const it = { c, w: widths[i], x, rx: r(), ry: r(), rr: r(), rc: r(), rf: r() }; x += widths[i]; return it; }).filter((it) => it.c !== ' ');
    const place = (it) => { g.translate(it.x + it.w / 2 + lerp(0, (it.rx - 0.5) * 14, q), cy + lerp(0, (it.ry - 0.5) * 70, q)); g.rotate(lerp(0, (it.rr - 0.5) * 0.42, q)); };
    // the paper chips first, then every letter on top, so no letter hides another
    if (q > 0.02) for (const it of items) {
      g.save(); place(it); g.globalAlpha = clamp(q * 1.5); g.fillStyle = CHIP[Math.floor(it.rc * CHIP.length)]; R(g, -it.w / 2 - 7, -size * 0.74, it.w + 14, size * 1.02, 6); g.fill(); g.strokeStyle = 'rgba(20,19,15,0.75)'; g.lineWidth = 4; g.stroke(); g.restore();
    }
    for (const it of items) {
      g.save(); place(it); g.fillStyle = INK; g.textAlign = 'center';
      g.font = q > 0.3 ? ILY_FONTS[Math.floor(it.rf * ILY_FONTS.length)].replace('X', Math.round(size * (0.8 + 0.14 * it.rx))) : `900 ${size}px Her`;
      g.fillText(it.c, 0, size * 0.1); g.restore();
    }
    g.restore();
  }
  function shotLast(g, t) {
    const TT = times();
    frontBack(g, t, { z: lerp(1, 1.1, sstep(TT.ily, TT.tiny, t)) });
    const trying = sstep(TT.ily + 0.5, TT.ily + 1.0, t) * (1 - sstep(TT.slip + 0.4, TT.slip + 0.9, t));
    const P = himPose(t, {
      pitch: 0.02, roll: lerp(0, 0.1, trying), yaw: lerp(0, 0.12, trying), lookX: lerp(0, 18, trying), lookY: lerp(2, -10, trying), browIn: lerp(0, 16, trying), browY: lerp(-2, 3, trying), press: lerp(0.08, 0.55, trying),
      smile: ramp(t, 0.1, [[TT.ily, 0.02, 0.3], [TT.slip + 0.5, 0.1, 0.5]]),
    });
    const cx = 540, cy = lerp(1160, 1200, sstep(TT.ily, TT.tiny, t)), s = 1.34;
    draw(g, P, cx, cy, s);
    if (t >= TT.ily) {
      const k = pop(t, TT.ily), [ex, ey] = earOf(P, cx, cy, s, 1), q = sstep(TT.slip, TT.slip + 0.7, t);
      const yy = 570;
      bubble(g, { cx: 513, cy: yy, w: 840, h: 280, k, tail: [ex + 2, ey - 10, 700], draw(c) { ransom(c, 513, yy + 40, 136, q, t); } });
    }
    dots(g, t);
  }

  // ------------------------------------------------------------------ 6 · everything she has ever said goes in
  const SAID = ['EAT', 'JACKET', 'BETA', 'CALL ME', 'STOP', 'COME HOME', 'SLEEP', 'WHERE ARE YOU', 'DRINK WATER', 'TAKE AN UMBRELLA', 'COVER YOUR HEAD', 'WHO IS THAT', 'WASH YOUR HANDS', 'SIT PROPERLY', 'HAVE YOU EATEN?', 'NOT NOW', 'BE CAREFUL', 'WHEN WILL YOU COME', 'HAVE YOU EATEN?', 'LOCK THE GAS', 'YOU LOOK THIN', 'HAVE YOU EATEN?', 'EAT SOMETHING', 'HEAT IT FIRST', 'I AM NOT ANGRY', 'WHO WILL MARRY YOU', 'HAVE YOU EATEN?', 'ENOUGH PHONE', 'WEAR SLIPPERS', 'HAVE YOU EATEN?'];
  function shotBuilt(g, t) {
    const TT = times();
    const zc = 1 + 0.04 * sstep(TT.built, TT.tiny, t);
    g.save(); g.translate(540, 1150); g.scale(zc, zc); g.translate(-540, -1150);
    frontBack(g, t, { z: 1.1 });
    const P = himPose(t, { pitch: -0.08, lookY: -8, lookX: 6, browY: -4, smile: 0.1 });
    const cx = 540, cy = 1200, s = 1.34;
    draw(g, P, cx, cy, s);
    const [ex, ey] = earOf(P, cx, cy, s, 1), r = mulberry32(55), dur = TT.tiny - TT.built;
    SAID.forEach((w, i) => {
      const x0 = 110 + r() * 800, y0 = 400 + r() * 500, t0 = TT.built + (i / SAID.length) * (dur - 0.5), u = clamp((t - t0) / 0.95), e = u * u;
      if (u <= 0 || u >= 1) return;
      const x = lerp(x0, ex, e) + Math.sin(u * 5 + i) * 18 * (1 - e), y = lerp(y0, ey, e) - Math.sin(u * 3.2) * 34 * (1 - e), k = clamp(u * 7) * lerp(1, 0.14, e);
      g.save(); g.translate(x, y); g.scale(k, k);
      g.font = '700 semi-condensed 58px Bahn'; const tw = g.measureText(w).width + 72;
      R(g, -tw / 2, -54, tw, 108, 54); g.fillStyle = CREAM; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
      g.fillStyle = INK; g.textAlign = 'center'; g.fillText(w, 0, 20);
      g.restore();
    });
    g.restore();
    dots(g, t);
  }

  // ------------------------------------------------------------------ 7 · how many times
  function shotTiny(g, t) {
    const TT = times();
    const zc = 1 + 0.06 * sstep(TT.tiny, TT.multi, t);   // a slow push in on him while he counts
    g.save(); g.translate(540, 1150); g.scale(zc, zc); g.translate(-540, -1150);
    frontBack(g, t, { z: 1.1 });
    const P = himPose(t, { pitch: -0.1, lookY: -8, browY: -3, smile: 0.02 });
    draw(g, P, 540, 1250, 1.34);
    g.restore();
    const k = lerp(1, 0.3, sstep(TT.tiny, TT.tiny + 0.4, t));
    bubble(g, { cx: 513, cy: 720, w: 840 * k, h: 280 * k, draw(c) { ransom(c, 513, 720 + 32 * k, lerp(136, 112, sstep(TT.tiny, TT.tiny + 0.4, t)) * k, 1 - sstep(TT.tiny, TT.tiny + 0.25, t), t); } });
    if (t >= TT.tiny + 0.2) { const c = lerp(0.9, 1, hit(t, TT.tiny + 0.2, 'heavy')); g.save(); g.translate(513, 440); g.scale(c, c); g.translate(-513, -440); txt(g, 'HOW MANY TIMES', 513, 432, 120, INK, { fit: 866, stroke: 'rgba(255,248,234,0.9)', sw: 0.12 }); txt(g, 'HAS SHE SAID THAT?', 513, 540, 112, RED, { fit: 866, stroke: 'rgba(255,248,234,0.9)', sw: 0.12 }); g.restore(); }
    dots(g, t);
  }

  // the same bubble in every language, baked; one canvas each, so a screen full of them is cheap
  const BB = { W: 440, H: 210, list: null, ily: null };
  function bakeBubbles() {
    if (BB.list) return;
    const mk = (fn) => {
      const c = offscreen(BB.W, BB.H), g = c.getContext('2d');
      g.fillStyle = 'rgba(70,40,0,0.22)'; R(g, 16, 18, BB.W - 28, BB.H - 30, 66); g.fill();
      g.fillStyle = CREAM; R(g, 10, 8, BB.W - 28, BB.H - 30, 66); g.fill(); g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
      fn(g, BB.W / 2 - 4, BB.H / 2 - 7); return c;
    };
    BB.list = [mk((g, x, y) => say(g, ['HAVE YOU', 'EATEN?'], x, y, 62, 360))];
    for (let i = 0; i < LANGS.length; i++) BB.list.push(mk((g, x, y) => sayLang(g, i, x, y, 76, 366)));
    BB.ily = mk((g, x, y) => say(g, ['I LOVE', 'YOU'], x, y, 74, 360));
  }
  // where each bubble of the crowd sits, and when
  let CROWD = null;
  function crowd() {
    if (CROWD) return CROWD;
    const r = mulberry32(417), big = [], small = [];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) {
      const off = j % 2 ? 62 : -34;
      big.push({ x: clamp(238 + i * 276 + off + (r() - 0.5) * 22, 190, 806), y: 352 + j * 148 + (r() - 0.5) * 16, s: 0.7 + r() * 0.07, rot: (r() - 0.5) * 0.08, o: r(), z: 1, d: Math.hypot(i - 1, j - 2) });
    }
    for (let k = 0; k < 12; k++) small.push({ x: 120 + r() * 800, y: 300 + r() * 720, s: 0.4 + r() * 0.12, rot: (r() - 0.5) * 0.16, o: r() * 0.9 + 0.1, z: 0, d: 2 + r() });
    const out = [...small, ...big].sort((a, b) => a.o - b.o);
    out.forEach((b, i) => { b.lang = i % 3 === 0 ? 0 : 1 + (i % LANGS.length); });
    // the first one is always the English one, in the middle
    const first = big[7]; first.o = -1; first.lang = 0;
    out.sort((a, b) => a.o - b.o);
    CROWD = out; return out;
  }
  function shotCrowd(g, t) {
    const TT = times();
    frontBack(g, t, { z: 1.1 });
    bakeBubbles();
    const P = himPose(t, { pitch: -0.08, lookY: -8, open: lerp(1, 1.14, sstep(TT.multi, TT.same, t)), browY: -10, smile: ramp(t, 0.02, [[TT.same + 0.2, 0.24, 0.5]]), wet: ramp(t, 0, [[TT.same + 0.3, 1, 0.5]]) });
    draw(g, P, 540, 1356, 1.34);
    const list = crowd(), n = list.length, span = (TT.n13 - 0.62) - TT.multi;
    const order = list.map((b, i) => [b, i]).sort((a, b) => a[0].z - b[0].z);
    order.forEach(([b, i]) => {
      const u = i / (n - 1), t0 = TT.multi + span * (1 - Math.pow(1 - u, 1.7));
      if (t < t0) return;
      const k = hit(t, t0, 'heavy');
      // on "It's the same sentence" every one turns over: near the middle first
      const flip0 = TT.same + b.d * 0.05, fu = clamp((t - flip0) / 0.22), sx = fu <= 0 ? 1 : fu >= 1 ? 1 : Math.abs(Math.cos(fu * Math.PI));
      const img = fu > 0.5 ? BB.ily : BB.list[b.lang];
      g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.scale(b.s * k * sx, b.s * k);
      g.drawImage(img, -BB.W / 2, -BB.H / 2);
      g.restore();
    });
    if (t >= TT.same) { const c = lerp(0.9, 1, hit(t, TT.same, 'heavy')); g.save(); g.translate(513, 1450); g.scale(c, c); g.translate(-513, -1450); txt(g, "IT'S THE SAME SENTENCE", 513, 1490, 116, CREAM, { fit: 866, stroke: INK, sw: 0.14 }); g.restore(); }
  }

  // ------------------------------------------------------------------ 8 · some of you can only hear it this way now
  let SHELF = null;
  function makeShelf() {
    const c = offscreen(W, H), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#f5ead2'], [1, '#e5d4b4']); g.fillRect(0, 0, W, H);
    g.fillStyle = rg(g, 513, 900, 100, 900, [0, 'rgba(255,214,120,0.34)'], [1, 'rgba(255,214,120,0)']); g.fillRect(0, 0, W, H);
    // the shelf
    g.fillStyle = WOOD; R(g, 90, 1370, 900, 28, 4); g.fill(); g.fillStyle = WOODD; g.fillRect(90, 1398, 900, 8);
    // the frame, on the wall
    g.fillStyle = 'rgba(0,0,0,0.2)'; R(g, 300, 586, 440, 560, 8); g.fill();
    g.fillStyle = lg(g, 288, 574, 730, 1130, [0, '#8d5a2c'], [1, '#633c1a']); R(g, 288, 574, 440, 560, 8); g.fill();
    g.fillStyle = '#efe6d2'; g.fillRect(320, 606, 376, 496);
    g.save(); g.beginPath(); g.rect(320, 606, 376, 496); g.clip();
    g.fillStyle = '#c9d6dc'; g.fillRect(320, 606, 376, 496);
    draw(g, PHOTO, 508, 860, 0.74);
    g.restore();
    // a string of marigolds round the frame
    const gar = [[300, 590], [352, 568], [408, 556], [468, 550], [508, 552], [548, 550], [608, 556], [664, 568], [716, 590]];
    const r = mulberry32(9);
    const mari = (x, y, s) => { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = 24 * s; g.fillStyle = i % 2 ? '#f6a11c' : '#ee8a12'; ell(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 18 * s, 18 * s); g.fill(); } g.fillStyle = '#ffc24a'; ell(g, x, y, 22 * s, 22 * s); g.fill(); g.fillStyle = 'rgba(200,100,0,0.55)'; ell(g, x, y, 11 * s, 11 * s); g.fill(); };
    const steps = 24, dr = (x0, y0, x1, y1, sag, n) => { for (let i = 0; i <= n; i++) { const u = i / n; mari(lerp(x0, x1, u), lerp(y0, y1, u) + sag * Math.sin(u * Math.PI), 0.92 + r() * 0.12); } };
    dr(292, 600, 724, 600, -46, 11);
    dr(282, 612, 366, 1148, 40, 14); dr(734, 612, 652, 1148, -40, 14);
    dr(366, 1148, 652, 1148, 34, 8);
    ell(g, 508, 1262, 1, 1);
    // a small lamp on the shelf
    g.fillStyle = lg(g, 462, 1320, 556, 1370, [0, '#d9a441'], [1, '#a2741f']); g.beginPath(); g.moveTo(452, 1330); g.quadraticCurveTo(508, 1396, 564, 1330); g.closePath(); g.fill();
    SHELF = c;
  }
  function shotShelf(g, t) {
    const TT = times();
    if (!SHELF) makeShelf();
    const z = lerp(1, 1.05, sstep(TT.shelf, TT.phone, t));
    g.save(); g.translate(513, 900); g.scale(z, z); g.translate(-513, -900); g.drawImage(SHELF, 0, 0);
    const fl = 1 + 0.08 * Math.sin(t * 13) + 0.05 * Math.sin(t * 29);
    g.fillStyle = rg(g, 508, 1296, 2, 90 * fl, [0, 'rgba(255,214,120,0.75)'], [1, 'rgba(255,214,120,0)']); ell(g, 508, 1296, 90 * fl, 90 * fl); g.fill();
    g.fillStyle = '#ffb32e'; g.beginPath(); g.moveTo(508, 1262 - 8 * fl); g.bezierCurveTo(528, 1298, 516, 1330, 508, 1330); g.bezierCurveTo(500, 1330, 488, 1298, 508, 1262 - 8 * fl); g.closePath(); g.fill();
    g.restore();
    const k = pop(t, TT.shelf + 0.34);
    bubble(g, { cx: 513, cy: 416, w: 700, h: 220, k, draw(q) { say(q, ['HAVE YOU', 'EATEN?'], 513, 416, 92, 600); } });
  }

  // ------------------------------------------------------------------ 9 · the original, and the one question
  function phoneScreen(g, t, press) {
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#1a2430'], [1, '#0b0f14']); g.fillRect(0, 0, W, H);
    const cx = 513;
    g.fillStyle = lg(g, cx - 180, 600, cx + 180, 960, [0, '#ffb86b'], [1, '#ef7b52']); ell(g, cx, 780, 176, 176); g.fill();
    txt(g, 'M', cx, 852, 218, '#fff8ea', { kind: 'cond' });
    txt(g, 'MUMMY', cx, 1110, 166, '#fff8ea', { kind: 'cond' });
    txt(g, 'mobile', cx, 1176, 46, 'rgba(255,255,255,0.55)', { kind: 'semi' });
    const by = 1392, s = 1 - 0.1 * press;
    g.save(); g.translate(cx, by); g.scale(s, s); g.fillStyle = '#19a95a'; ell(g, 0, 0, 112, 112); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 28; g.lineCap = 'round'; g.beginPath(); g.moveTo(-46, -36); g.quadraticCurveTo(-32, 28, 36, 46); g.stroke(); g.restore();
    return { cx, by };
  }
  function thumb(g, x, y, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = lg(g, -80, 0, 90, 0, [0, SK.d], [0.5, SK.h], [1, SK.m]); R(g, -72, -18, 150, 720, 70); g.fill();
    g.fillStyle = 'rgba(255,240,226,0.82)'; R(g, -44, 4, 96, 96, 38); g.fill();
    g.restore();
  }
  function shotPhone(g, t) {
    const TT = times();
    const press = sstep(TT.call - 0.08, TT.call, t);
    const { cx, by } = phoneScreen(g, t, press);
    const q = sstep(TT.q2, TT.q2 + 0.18, t);
    // "still have the original"
    const a0 = sstep(TT.phone, TT.phone + 0.14, t) * (1 - q);
    if (a0 > 0) { txt(g, 'YOU STILL HAVE', 513, 384, 116, '#fff8ea', { fit: 860, a: a0 }); txt(g, 'THE ORIGINAL', 513, 500, 130, '#ffd653', { fit: 860, a: a0 }); }
    if (q > 0) { txt(g, 'ONE RECORDING', 513, 384, 124, '#fff8ea', { a: q, fit: 860 }); txt(g, 'OF HER ASKING?', 513, 500, 124, '#ff8a5c', { a: q, fit: 860 }); }
    const th = t < TT.q2 ? 1 : 1 - sstep(TT.q2, TT.call, t);
    thumb(g, cx + 34 + 280 * th, by + 34 + 460 * th, -0.3 - 0.2 * th);
  }

  // ------------------------------------------------------------------ 10 · the only real thing in the film
  function waveform(g, x, y, w, h, t, on) {
    const n = 46, step = w / n;
    for (let i = 0; i < n; i++) {
      const e = on * (0.42 + 0.58 * Math.abs(Math.sin(t * 7.7 + i * 0.62) * Math.cos(t * 3.3 - i * 0.27))), hh = Math.max(9, e * h * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.7 + t * 19))));
      g.fillStyle = '#19a95a'; R(g, x + i * step, y - hh / 2, step * 0.56, hh, step * 0.28); g.fill();
    }
  }
  function earPhone(g, ex, ey, s) {                    // the phone against his ear, and the hand holding it
    g.save(); g.translate(ex, ey); g.rotate(-0.2); g.scale(s, s);
    g.fillStyle = '#1b1e23'; R(g, -44, -180, 86, 340, 22); g.fill();
    g.fillStyle = lg(g, -130, -40, 60, 200, [0, SK.h], [1, SK.d]);
    R(g, -116, 12, 170, 160, 70); g.fill();
    for (let i = 0; i < 4; i++) { R(g, -134, -62 + i * 58, 118, 52, 26); g.fill(); }
    g.restore();
    // the arm, down to the bottom of the frame
    g.strokeStyle = lg(g, ex - 200, ey, ex - 260, H, [0, SK.m], [1, SK.d]); g.lineWidth = 118; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 12, ey + 120 * s); g.quadraticCurveTo(ex - 200, ey + 420, ex - 240, H + 60); g.stroke();
  }
  function shotCall(g, t) {
    const TT = times();
    frontBack(g, t, { z: 1.04 });
    const picked = t >= TT.pick, u = sstep(TT.pick, TT.pick + 0.2, t);
    const laugh = sstep(TT.w1 + 0.1, TT.w1 + 0.5, t), soft = sstep(TT.w2 + 0.1, TT.w2 + 0.6, t);
    const P = himPose(t, {
      pitch: 0.04, roll: -0.08, yaw: 0.06, lookX: 0, lookY: 2, grin: laugh * (1 - soft) * 0.62, smile: lerp(0.0, 0.5, Math.max(laugh, soft)),
      browY: lerp(0, -6, laugh), browIn: lerp(0, 4, soft), lidLow: lerp(0, 0.7, laugh), open: lerp(1, 0.04, sstep(TT.w2 + 0.2, TT.w2 + 0.65, t)), wet: 0.6,
    });
    if (P.open < 0.06) P.open = 0.04;
    const cx = 540, cy = 1236, s = 1.3;
    draw(g, P, cx, cy, s);
    const [ex, ey] = earOf(P, cx, cy, s, -1);
    earPhone(g, ex - 4, ey + 8, 1.12);
    // the top: who, how long, and proof that it's real
    const yy = 300, h = 470;
    g.save(); g.fillStyle = '#10161c'; R(g, 86, yy, 854, h, 44); g.fill();
    txt(g, 'MUMMY', 513, yy + 94, 86, 'rgba(255,255,255,0.9)', { kind: 'cond' });
    if (!picked) {
      const a = 0.45 + 0.55 * Math.abs(Math.sin((t - TT.ear) * 5.8));
      txt(g, 'CALLING', 513, yy + 256, 124, '#ffd653', { a });
      for (let i = 0; i < 3; i++) { const d = clamp(((t - TT.ear) * 2.4 + i * 0.33) % 1); g.strokeStyle = `rgba(255,214,83,${0.6 * (1 - d)})`; g.lineWidth = 7; ell(g, 513, yy + 230, 140 + d * 180, 60 + d * 72); g.stroke(); }
    } else {
      const sec = Math.floor((t - TT.pick) + 1e-6), mm = '00:' + String(sec).padStart(2, '0');
      txt(g, mm, 513, yy + 214, 124, '#fff', { kind: 'mono' });
      waveform(g, 186, yy + 296, 660, 118, t, u);
    }
    g.restore();
    // what she says: not a bubble this time. The real one is plain words under the waveform.
    if (t >= TT.w1) {
      const a = 1 - sstep(TT.w2 - 0.1, TT.w2, t);
      if (a > 0) txt(g, 'WHAT HAPPENED?', 513, yy + h + 110, 128, INK, { fit: 860, a: a * clamp((t - TT.w1) * 8), stroke: 'rgba(255,248,234,0.95)', sw: 0.14 });
    }
    if (t >= TT.w2) txt(g, 'HAVE YOU EATEN?', 513, yy + h + 110, 128, INK, { fit: 860, a: clamp((t - TT.w2) * 8), stroke: 'rgba(255,248,234,0.95)', sw: 0.14 });
  }

  // ------------------------------------------------------------------ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g, TT = times();
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.clearRect(0, 0, W, H);
      g.save();
      if (t < TT.side) shotOne(g, t);
      else if (t < TT.front2) shotSide(g, t);
      else if (t < TT.xray) shotGuests(g, t);
      else if (t < TT.last) shotStomach(g, t);
      else if (t < TT.built) shotLast(g, t);
      else if (t < TT.tiny) shotBuilt(g, t);
      else if (t < TT.multi - 0.08) shotTiny(g, t);
      else if (t < TT.shelf) shotCrowd(g, t);
      else if (t < TT.phone) shotShelf(g, t);
      else if (t < TT.ear) shotPhone(g, t);
      else shotCall(g, t);
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
      K.clear(g);
      const pat = g.createPattern(S.tiles[f % 4], 'repeat'), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
      g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256);
    },
  });

  window.UI.endcard();
  C.start();
})();
