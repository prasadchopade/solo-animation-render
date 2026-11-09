// Reel 28 · You're the Alibi. Episode 6 of "You're the test subject".
// Your best friend is locked up for robbing a watch shop, and you're his only alibi. Where were you last Tuesday at 7:40? You don't really remember:
// for you it was just another Tuesday. While the officer takes a call, he reminds you: the stall, the rain, your ginger chai, what you paid. The officer
// asks, you know the answers, and they're the same as his statement. But everything you know about that night, he told you. YOUR MEMORY becomes HIS STORY.
// So where was he? The photo sharpens: he was here. You just set a robber free. Then the last test: the chaiwala, old or young? You never saw him: one question put him there. Facts: docs/research.md. Our own drawings, nobody real. 30 fps, no blur.
// The film never says what you pressed: timers end, the buttons fade together, nothing is highlighted.
// The plant: a steel watch with its shop tag still on, on his left wrist, showing while he grips the bars (frame 0). Nothing else on either wrist.
// The face rig (mouth, eye, head) is from reels 19, 20 and 25; the characters are new.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT;
  const { hit, tb, words, clear } = K;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2;
  const INK = '#14130f', RED = '#e2301a', PAPER = '#fbf7ec', YEL = '#ffd34a', CREAM = '#fff6e2';
  const WALL = '#f8dc8e', WALL2 = '#f2c565', DADO = '#2aa08f', DADO2 = '#1c7b70', CELL = '#1f7078', CELLD = '#12505a';
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
  function shakeAt(t, list, amp = 24) {
    let a = 0; for (const t0 of list) if (t >= t0) a = Math.max(a, amp * Math.exp(-(t - t0) * 11));
    if (a < 0.2) return [0, 0];
    const r = mulberry32(Math.round(t * 30) * 7 + 3);
    return [(r() - 0.5) * 2 * a, (r() - 0.5) * 2 * a];
  }
  const flashAt = (t, t0) => { const d = t - t0; return d < 0 ? 0 : Math.exp(-d * 11) * 0.92; };
  const pop = (t, t0) => clamp(hit(t, t0, 'heavy'));
  function title(g, s, y, size, color, t, t0, o = {}) {            // a caption that lands with a small spring
    if (t < t0) return;
    const q = t0 < 0 ? 1 : pop(t, t0);
    g.save(); g.translate(o.x ?? 513, y); g.scale(lerp(0.86, 1, q), lerp(0.86, 1, q));
    txt(g, s, 0, 0, size, color, { align: 'center', fit: o.fit ?? 860, stroke: o.stroke ?? INK, sw: o.sw ?? 0.14, a: (t0 < 0 ? 1 : clamp((t - t0) * 8)) * (o.a ?? 1) });
    g.restore();
  }

  // ------------------------------------------------------------------ the mouth and the eyes (the rig of reels 19, 20, 23 and 25)
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
      if (o.wet) { g.fillStyle = `rgba(190,226,245,${0.75 * o.wet})`; g.beginPath(); g.moveTo(cx - w, cy + 3); g.quadraticCurveTo(cx + side * 6, cy + dn + 2, cx + w, cy + 3); g.quadraticCurveTo(cx + side * 6, cy + dn * 0.4, cx - w, cy + 3); g.fill(); }
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
  // The friend: a round young face, wet eyes, a great deal of curly hair. The officer: bald on top, grey at the sides, a huge moustache.
  const FR = { skin: '#cd9670', skinD: '#a26c4a', skinH: '#e8bb98', hair: '#17110d', style: 'curly', must: null, stub: 0.12, brow: 14, browTilt: -13, jaw: 0.96, ew: 50, eh: 29 };
  const OF = { skin: '#a8704c', skinD: '#7a4c30', skinH: '#c6906a', hair: '#7b766f', style: 'bald', must: 'huge', stub: 0.1, brow: 20, browTilt: 7, jaw: 1.08, ew: 40, eh: 19 };
  const OLD = { skin: '#c79a78', skinD: '#a0745a', skinH: '#ddb496', hair: '#e8e4dc', style: 'bald', must: null, stub: 0, brow: 13, browTilt: -14, jaw: 0.94, ew: 48, eh: 30, specs: true };

  function curls(g, hw, color, seed, front) {
    const r = mulberry32(seed);
    g.fillStyle = color;
    if (!front) {
      for (let i = 0; i <= 24; i++) {
        const a = Math.PI * (1 + i / 24), rx = hw + 34 + r() * 18, ry = 262 + r() * 22;
        ell(g, Math.cos(a) * rx, -44 + Math.sin(a) * ry, 58 + r() * 16, 56 + r() * 16); g.fill();
      }
      ell(g, 0, -150, hw + 30, 170); g.fill();
      return;
    }
    ell(g, 0, -262, hw - 4, 66); g.fill();
    for (let i = 0; i < 8; i++) { const u = i / 7, x = -hw * 0.82 + u * hw * 1.64; ell(g, x, -268 + Math.abs(u - 0.5) * 40 + r() * 10, 54, 48); g.fill(); }
    for (let i = 0; i < 10; i++) { const u = i / 9, x = -hw + 8 + u * (2 * hw - 16), y = -214 + Math.abs(u - 0.5) * 70 + r() * 12; ell(g, x, y, 48 + r() * 12, 42 + r() * 10); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 6; g.lineCap = 'round';
    const r2 = mulberry32(seed + 1);
    for (let i = 0; i < 18; i++) { const a = Math.PI * (1.08 + r2() * 0.84), rr = 0.75 + r2() * 0.3, x = Math.cos(a) * (hw + 30) * rr, y = -60 + Math.sin(a) * 280 * rr; g.beginPath(); g.arc(x, y, 22 + r2() * 12, -2.5, -0.9); g.stroke(); }
  }
  function tears(g, k, t) {
    if (k <= 0) return;
    g.save(); g.globalAlpha *= k;
    for (const [x, off] of [[-92, 0.0], [92, 0.7]]) {
      g.fillStyle = 'rgba(205,236,250,0.5)'; R(g, x - 5, 2, 10, 130, 5); g.fill();
      const u = ((t * 0.55 + off) % 1), y = 12 + u * 150, s = 1 - u * 0.25;
      g.fillStyle = 'rgba(215,240,252,0.95)'; g.beginPath(); g.moveTo(x, y - 20 * s); g.quadraticCurveTo(x + 13 * s, y + 2, x, y + 11 * s); g.quadraticCurveTo(x - 13 * s, y + 2, x, y - 20 * s); g.fill();
      g.fillStyle = '#fff'; ell(g, x - 3 * s, y - 1, 2.8 * s, 4 * s); g.fill();
    }
    g.restore();
  }
  function head(g, L, o = {}) {
    const op = o.op ?? 0, close = o.close ?? 0, hw = 186 * L.jaw, drop = 104 * op, chin = 232 + drop, ey = -28, ex = 80;
    if (L.style === 'curly') curls(g, hw, L.hair, 21, false);
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
    if (L.stub) { g.fillStyle = lg(g, 0, 56, 0, 190, [0, 'rgba(30,22,18,0)'], [1, `rgba(30,22,18,${0.34 * L.stub})`]); g.fillRect(-300, 56, 600, 320); }
    g.restore();
    const my = 118 + drop * 0.2;
    mouth(g, my, op, { lip: L.lip || '#83503f', w0: o.w0 ?? 44, frown: o.frown ?? 0, smile: o.smile ?? 0 });
    if (L.must === 'huge') {
      g.fillStyle = '#1f1a16';
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 2, 72); g.bezierCurveTo(k * 40, 54, k * 120, 66, k * 158, my - 42); g.bezierCurveTo(k * 178, my - 56, k * 190, my - 78, k * 184, my - 92); g.bezierCurveTo(k * 206, my - 70, k * 204, my - 28, k * 170, my - 8); g.bezierCurveTo(k * 120, my + 24, k * 40, my + 12, k * 2, 104); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 4; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 26, 80); g.quadraticCurveTo(k * 92, 76, k * 150, my - 44); g.stroke(); }
    }
    const ny = 44;
    g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, 0, ny + 15, 36, 9); g.fill();
    g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 22, ny - 18); g.quadraticCurveTo(k * 31, ny, k * 25, ny + 10); g.stroke(); }
    for (const k of [-1, 1]) { ell(g, k * 13, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
    g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, -5, ny - 8, 10, 15); g.fill();
    const eo = { ew: L.ew, eh: L.eh, ir: 17, look: o.look, lidW: L.lidW, wet: o.wet };
    eye(g, -1, -ex, ey, close, eo); eye(g, 1, ex, ey, close, eo);
    g.strokeStyle = L.style === 'bald' && L.must ? '#26201c' : L.hair; g.lineCap = 'round'; g.lineWidth = L.brow;
    const by0 = o.browY || 0, tilt = L.browTilt + (o.worry || 0);
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (ex - 48), ey - 40 + tilt + by0); g.quadraticCurveTo(k * (ex + 6), ey - 60 + by0, k * (ex + 54), ey - 40 - tilt * 0.3 + by0 * 0.4); g.stroke(); }
    if (L.style === 'curly') curls(g, hw, L.hair, 37, true);
    else if (L.style === 'bald') {
      g.fillStyle = 'rgba(255,255,255,0.2)'; ell(g, -46, -206, 70, 32, -0.2); g.fill();
      g.fillStyle = L.hair; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * (hw + 4), -120); g.bezierCurveTo(k * (hw + 26), -96, k * (hw + 28), -30, k * (hw + 6), 4); g.bezierCurveTo(k * (hw - 16), -28, k * (hw - 16), -88, k * (hw + 4), -120); g.fill(); }
    }
    if (L.specs) { g.strokeStyle = '#2a2320'; g.lineWidth = 7; for (const k of [-1, 1]) { R(g, k * ex - 62, ey - 44, 124, 88, 30); g.stroke(); } g.beginPath(); g.moveTo(-ex + 62, ey - 8); g.quadraticCurveTo(0, ey - 22, ex - 62, ey - 8); g.stroke(); }
    if (o.tears) tears(g, o.tears, o.t || 0);
  }
  const blinkAt = (t, p = 3.3, off = 1.1) => (((t + off) % p) < 0.11 ? 1 : 0);          // never on frame 0
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

  // ------------------------------------------------------------------ timing: the narration's words
  const at = (p) => words(p)[0].t0;
  const wi = (p, i) => words(p)[Math.min(i, words(p).length - 1)].t0;
  const en = (p) => { const w = words(p); return w[w.length - 1].t1; };
  let T = null;
  function times() {
    if (T) return T;
    T = {
      n01e: en('n01'), f00: at('f00'), f00e: en('f00'), n02: at('n02'), n02e: en('n02'), o01: at('o01'), where: wi('o01', 4), o01e: en('o01'),
      n03: at('n03'), blurry: wi('n03', 6), ofR: wi('n03', 8), n03e: en('n03'), has: at('n03a'), n03ae: en('n03a'), n03b: at('n03b'), just: wi('n03b', 10), n03be: en('n03b'),
      f01: at('f01'), stallW: wi('f01', 6), rain: wi('f01', 10), chai: wi('f01', 13), paid: wi('f01', 16), twenty: wi('f01', 17), rem: at('f01r'), f01e: en('f01r'),
      n04: at('n04'), n04e: en('n04'),
      o02: at('o02'), drink: wi('o02', 9), o02e: en('o02'), o03: at('o03'), o03e: en('o03'), o04: at('o04'), o04e: en('o04'),
      n06: at('n06'), told: wi('n06', 6), n06e: en('n06'), n06b: at('n06b'), n06be: en('n06b'), n07: at('n07'), n07e: en('n07'),
      o05: at('o05'), goW: wi('o05', 2), o05e: en('o05'), n08: at('n08'), robber: wi('n08', 3), n08e: en('n08'),
      f02: at('f02'), f02e: en('f02'), o06: at('o06'), chaiW: wi('o06', 3), oldW: wi('o06', 5), o06e: en('o06'), n12: at('n12'), n12e: en('n12'), n13: at('n13'), n13e: en('n13'), n14: at('n14'), n14e: en('n14'), end: tb('end'),
    };
    T.q0 = T.where - 0.05;                                 // the first buttons land
    T.q0e = T.n03b - 0.1;                                  // ... and go as your memory comes up, empty
    T.q4 = T.oldW - 0.05; T.q4e = T.n12 - 0.1;             // old or young
    T.ring = T.n03be + 0.12;                               // the desk phone, in the gap
    T.q1 = T.drink - 0.1; T.q1e = T.o03 - 0.1;              // what did you drink
    T.q2 = T.o03 + 0.25; T.q2e = T.o04 - 0.1;              // what did you pay
    return T;
  }

  // ------------------------------------------------------------------ the buttons and the timer (nothing here ever picks for you)
  function buttons(g, t, t0, tOut, labels, widths, y = 1456) {
    if (t < t0 || t > tOut + 0.3) return;
    const gap = 24, total = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
    let x = 513 - total / 2;
    labels.forEach((s, i) => {
      const w = widths[i], k = clamp(hit(t, t0 + i * 0.07, 'heavy')), sc = lerp(0.6, 1, k), gone = clamp((t - tOut) / 0.25);
      g.save(); g.translate(x + w / 2, y); g.scale(sc, sc); g.globalAlpha *= clamp((t - t0 - i * 0.07) * 8) * (1 - gone);
      R(g, -w / 2, -56, w, 112, 20); g.fillStyle = PAPER; g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
      txt(g, s, 0, 25, 70, INK, { align: 'center', fit: w - 30 });
      g.restore();
      x += w + gap;
    });
  }
  function timerBar(g, t, t0, t1, y = 1372) {
    if (t < t0 || t >= t1) return;
    const u = clamp((t1 - t) / (t1 - t0));
    R(g, 120, y, 786, 20, 10); g.fillStyle = 'rgba(20,16,10,0.6)'; g.fill();
    R(g, 120, y, 786 * u, 20, 10); g.fillStyle = u < 0.35 ? '#ff4a30' : '#ffb347'; g.fill();
  }

  // ------------------------------------------------------------------ the lock-up: the world is 1080 x 1920; the friend's head at (513, 850)
  const HEADX = 513, HEADY = 850, HEADS = 1.12, HANDY = 1132, GRIPL = 288, GRIPR = 738;
  const ANG = 0.49;                                        // the forearms slope out from the bars, so his wrist shows beside the bar
  function cellBack(g) {
    g.fillStyle = lg(g, 0, -600, 0, 2400, [0, '#3a97a0'], [0.42, CELL], [1, CELLD]); g.fillRect(-1200, -1600, 3500, 6000);
    g.fillStyle = 'rgba(255,250,210,0.09)'; g.beginPath(); g.moveTo(-200, 120); g.lineTo(420, -400); g.lineTo(980, -400); g.lineTo(240, 1800); g.lineTo(-400, 1800); g.closePath(); g.fill();
  }
  function bar(g, x, y0, y1, bw = 46) {
    g.fillStyle = lg(g, x - bw / 2, 0, x + bw / 2, 0, [0, '#2a2e36'], [0.3, '#8e949e'], [0.55, '#c6cad2'], [1, '#2f333b']); g.fillRect(x - bw / 2, y0, bw, y1 - y0);
  }
  function rail(g, y, x0, x1) {
    g.fillStyle = lg(g, 0, y - 24, 0, y + 24, [0, '#2a2e36'], [0.42, '#a3a8b1'], [1, '#2f333b']); g.fillRect(x0, y - 24, x1 - x0, 48);
  }
  // the door: bars 138 to 888 on a rail; open = 1 has slid them right out of the frame
  function bars(g, open = 0) {
    for (const x of [-12, 1038]) bar(g, x, -1200, 2500);
    rail(g, 225, -1200, 11); rail(g, 1490, -1200, 11); rail(g, 225, 1015, 2400); rail(g, 1490, 1015, 2400);
    rail(g, -1020, -1200, 2400);
    g.save(); g.translate(open * 1300, 0);
    for (const x of [138, 288, 738, 888]) bar(g, x, -1200, 2500);
    rail(g, 225, 115, 911); rail(g, 1490, 115, 911);
    g.restore();
  }
  function torso(g, sway = 0) {
    g.fillStyle = FR.skinD; R(g, -74, 180, 148, 150, 40); g.fill();
    g.beginPath(); g.moveTo(-96, 262); g.bezierCurveTo(-240, 288, -420, 310, -470, 520); g.lineTo(-510, 1400); g.lineTo(510, 1400); g.lineTo(470, 520); g.bezierCurveTo(420, 310, 240, 288, 96, 262); g.closePath();
    g.fillStyle = lg(g, -420, 300, 420, 1100, [0, '#f0614f'], [1, '#c4311f']); g.fill();
    g.fillStyle = '#9f2415'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 8, 330); g.lineTo(k * 92, 248); g.lineTo(k * 142, 300); g.lineTo(k * 50, 396); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-7, 350, 14, 1050);
    g.fillStyle = '#fff1dd'; for (let i = 0; i < 6; i++) { ell(g, 0, 430 + i * 130, 11, 11); g.fill(); }
  }
  function forearm(g, x, side, tr) {           // from the grip, down and out. side -1 (his right, screen left), +1 (his left, screen right, with the watch)
    const dx = Math.sin(ANG) * side, dy = Math.cos(ANG), y = HANDY + tr;
    const px = (d) => [x + dx * d, y + dy * d];
    const seg = (d0, d1, w, c) => { g.lineCap = 'round'; g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(...px(d0)); g.lineTo(...px(d1)); g.stroke(); };
    seg(30, 460, 118, '#c58f6a');                                      // forearm, bare to the cuff
    seg(30, 300, 92, '#d9a780');
    seg(330, 1000, 150, '#d9442f');                                    // the sleeve, pushed up by gripping
    const [cx, cy] = px(330); g.save(); g.translate(cx, cy); g.rotate(-ANG * side); R(g, -80, -14, 160, 28, 8); g.fillStyle = '#9f2415'; g.fill(); g.restore();
  }
  function watch(g, t, tr) {
    const d = 158, x = GRIPR + Math.sin(ANG) * d, y = HANDY + tr + Math.cos(ANG) * d;
    g.save(); g.translate(x, y); g.rotate(-ANG);
    R(g, -66, -25, 132, 50, 8); g.fillStyle = lg(g, 0, -25, 0, 25, [0, '#eef2f6'], [0.5, '#b1b9c2'], [1, '#7c848d']); g.fill();
    g.strokeStyle = 'rgba(60,70,80,0.5)'; g.lineWidth = 2.5; for (let i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(i * 12, -25); g.lineTo(i * 12, 25); g.stroke(); }
    ell(g, 0, 0, 46, 46); g.fillStyle = lg(g, -40, -40, 40, 40, [0, '#f4f6f9'], [1, '#868e98']); g.fill(); g.strokeStyle = '#4d565f'; g.lineWidth = 5; g.stroke();
    ell(g, 0, 0, 36, 36); g.fillStyle = '#18222e'; g.fill();
    g.strokeStyle = '#f2f4f7'; g.lineCap = 'round'; g.lineWidth = 5; const hA = (7 + 40 / 60) / 12 * TAU - Math.PI / 2, mA = 40 / 60 * TAU - Math.PI / 2;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(hA) * 19, Math.sin(hA) * 19); g.stroke(); g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(mA) * 28, Math.sin(mA) * 28); g.stroke();
    g.restore();
    // the shop's tag, on a string from the strap, hanging straight down
    const sw = Math.sin(t * 2.3) * 0.14 + Math.sin(tr * 1.4) * 0.05;
    const sx = x - 6, sy = y + 44;
    g.save(); g.translate(sx, sy); g.rotate(sw);
    g.strokeStyle = '#f4efe2'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(8, 26, 2, 48); g.stroke();
    g.translate(2, 48); g.scale(1.4, 1.4);
    R(g, -25, 0, 50, 70, 7); g.fillStyle = '#e9e1cc'; g.fill(); g.strokeStyle = '#8f8670'; g.lineWidth = 2.5; g.stroke();
    ell(g, 0, 11, 5, 5); g.fillStyle = '#7d7564'; g.fill();
    txt(g, '₹', 0, 56, 42, '#7d1f14', { align: 'center' });
    g.restore();
  }
  function palm(g, x, tr, c = '#c98e68') { ell(g, x, HANDY + tr + 18, 66, 80); g.fillStyle = c; g.fill(); }
  function fingers(g, x, tr, side) {
    const y = HANDY + tr;
    for (let i = 0; i < 4; i++) { const yy = y - 58 + i * 34; R(g, x - 62, yy, 124, 32, 16); g.fillStyle = lg(g, 0, yy, 0, yy + 32, [0, '#e6b895'], [1, '#c48c66']); g.fill(); g.strokeStyle = 'rgba(90,50,30,0.35)'; g.lineWidth = 2.5; g.stroke(); R(g, x + side * 34, yy + 6, 22, 20, 8); g.fillStyle = '#f4dcc8'; g.fill(); }
    ell(g, x - side * 44, y + 72, 30, 42, side * 0.5); g.fillStyle = '#d9a780'; g.fill();
  }
  // the lock-up with him in it. o: { z, cx, cy, px, py, op, look, close, tears, worry, frown, smile, grip, door }
  function lockup(g, t, o = {}) {
    const z = o.z ?? 1, cx = o.cx ?? HEADX, cy = o.cy ?? HEADY, px = o.px ?? HEADX, py = o.py ?? HEADY;
    g.save(); g.translate(px, py); g.scale(z, z); g.translate(-cx, -cy);
    cellBack(g);
    const tr = (o.grip ?? 1) * (Math.sin(t * 17) * 1.6 + Math.sin(t * 29.3) * 1.2);
    const breathe = Math.sin(t * 1.6) * 3;
    g.save(); g.translate(HEADX, HEADY + 8 + breathe); g.scale(HEADS, HEADS); torso(g); g.restore();
    const gR = o.gripR ?? 0, dR = (1 - gR) * 640;           // his left hand, with the watch: 1 on the bars, 0 down out of the frame
    if (o.grip !== 0) { forearm(g, GRIPL, -1, tr); palm(g, GRIPL, tr); if (gR > 0) { forearm(g, GRIPR, 1, tr + dR); watch(g, t, tr + dR); if (gR > 0.6) palm(g, GRIPR, tr + dR); } }
    if (gR <= 0 && o.grip !== 0) { g.lineCap = 'round'; g.strokeStyle = '#d9442f'; g.lineWidth = 158; g.beginPath(); g.moveTo(HEADX + 474, HEADY + 600); g.lineTo(HEADX + 560, HEADY + 1800); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 8; g.beginPath(); g.moveTo(HEADX + 396, HEADY + 700); g.lineTo(HEADX + 470, HEADY + 1800); g.stroke(); }
    g.save(); g.translate(HEADX + (o.dx ?? 0), HEADY + breathe + (o.dy ?? 0)); g.rotate(o.roll ?? 0); g.scale(HEADS, HEADS);
    head(g, FR, { op: o.op ?? 0, close: Math.max(o.close ?? 0, blinkAt(t)), look: o.look ?? [0, 2], worry: o.worry ?? 0, frown: o.frown ?? 0.9, smile: o.smile ?? 0, tears: o.tears ?? 0, wet: o.wet ?? 0, t });
    g.restore();
    bars(g, 0);
    if (o.grip !== 0) { fingers(g, GRIPL, tr, -1); if (gR > 0.6) fingers(g, GRIPR, tr + dR, 1); }
    g.restore();
  }

  // ------------------------------------------------------------------ the officer at his desk. The world: his head at (470, 790)
  function wallBack(g) {
    g.fillStyle = lg(g, 0, 200, 0, 1000, [0, WALL], [1, WALL2]); g.fillRect(-400, -400, 2000, 1400);
    g.fillStyle = lg(g, 0, 1000, 0, 1600, [0, DADO], [1, DADO2]); g.fillRect(-400, 1000, 2000, 1400);
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(-400, 994, 2000, 8);
  }
  function calendar(g, x, y, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.02);
    R(g, -100, -130, 200, 262, 8); g.fillStyle = '#fffdf6'; g.fill(); g.strokeStyle = '#b6ad96'; g.lineWidth = 3; g.stroke();
    R(g, -100, -130, 200, 54, [8, 8, 0, 0]); g.fillStyle = RED; g.fill();
    g.fillStyle = '#c9c1ad'; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { g.fillRect(-82 + c * 34, -56 + r * 42, 24, 26); }
    g.strokeStyle = RED; g.lineWidth = 5; ell(g, -82 + 34 + 12, -56 + 42 * 2 + 13, 24, 24); g.stroke();
    g.restore();
  }
  function fan(g, x, y, t) {
    g.fillStyle = '#4a4d52'; g.fillRect(x - 6, y - 400, 12, 400);
    g.save(); g.translate(x, y); g.scale(1, 0.22);
    for (let i = 0; i < 3; i++) { g.rotate(t * 7 + i * TAU / 3); ell(g, 190, 0, 170, 42); g.fillStyle = 'rgba(80,84,92,0.75)'; g.fill(); }
    g.restore();
    ell(g, x, y, 44, 28); g.fillStyle = '#50545b'; g.fill();
  }
  function officerBody(g) {
    g.beginPath(); g.moveTo(-104, 226); g.bezierCurveTo(-260, 250, -470, 280, -510, 500); g.lineTo(-540, 1100); g.lineTo(540, 1100); g.lineTo(510, 500); g.bezierCurveTo(470, 280, 260, 250, 104, 226); g.closePath();
    g.fillStyle = lg(g, -460, 260, 460, 800, [0, '#c8b27c'], [1, '#9c8552']); g.fill();
    g.fillStyle = '#ad9561'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 6, 300); g.lineTo(k * 100, 214); g.lineTo(k * 158, 268); g.lineTo(k * 48, 372); g.closePath(); g.fill(); }
    g.fillStyle = '#7e6b3f'; for (const k of [-1, 1]) { R(g, k * 340 - 90, 306, 180, 44, 12); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(-7, 330, 14, 800);
    g.fillStyle = '#f0e8d0'; for (let i = 0; i < 5; i++) { ell(g, 0, 400 + i * 130, 11, 11); g.fill(); }
    for (const k of [-1, 1]) { R(g, k * 260 - 110, 470, 220, 150, 12); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fill(); }
  }
  function desk(g, y = 1310) {
    g.fillStyle = lg(g, 0, y, 0, y + 600, [0, '#a4683a'], [1, '#6e4120']); g.fillRect(-400, y, 2000, 800);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-400, y, 2000, 7);
  }
  function deskPhone(g, x, y, t, off) {        // off = the receiver is lifted
    R(g, x - 96, y - 52, 192, 92, 22); g.fillStyle = '#c8342a'; g.fill();
    ell(g, x, y - 6, 40, 30); g.fillStyle = '#ddd'; g.fill();
    if (!off) { R(g, x - 110, y - 86, 220, 36, 18); g.fillStyle = '#a32318'; g.fill(); for (const k of [-1, 1]) { ell(g, x + k * 102, y - 64, 26, 30); g.fillStyle = '#a32318'; g.fill(); } }
  }
  function backCell(g, t) {                    // behind the officer, the friend, small, at the bars
    g.save(); g.beginPath(); g.rect(700, 300, 500, 720); g.clip();
    g.fillStyle = lg(g, 0, 300, 0, 1020, [0, '#4ba8ae'], [1, CELL]); g.fillRect(700, 300, 500, 720);
    g.save(); g.translate(838, 690); g.scale(0.34, 0.34);
    torso(g);
    head(g, FR, { look: [-12, 2], close: blinkAt(t, 3.7, 0.3), worry: -4, frown: 0.9 });
    g.restore();
    g.restore();
    for (const x of [738, 838, 938]) bar(g, x, 300, 1010, 22);
    rail(g, 340, 700, 1200); rail(g, 960, 700, 1200);
  }
  function officer(g, t, o = {}) {
    const z = o.z ?? 1, cx = o.cx ?? 470, cy = o.cy ?? 790, px = o.px ?? 470, py = o.py ?? 790, look = o.look ?? [0, 3];
    g.save(); g.translate(px, py); g.scale(z, z); g.translate(-cx, -cy);
    wallBack(g); calendar(g, 200, 460, 0.8); fan(g, 300, 268, t);
    if (o.back !== false) backCell(g, t);
    const b = Math.sin(t * 1.1) * 2.5, off = o.phone ?? 0;
    g.save(); g.translate(470 + (o.dx ?? 0) * off, 790 + b); g.scale(1.04, 1.04); g.rotate((o.roll ?? 0) * off);
    officerBody(g);
    g.save(); g.translate(0, 0);
    head(g, OF, { op: o.op ?? 0, close: Math.max(o.close ?? 0, blinkAt(t, 4.1, 2)), look: off > 0.5 ? [-16, -6] : look, frown: 0.3, browY: o.browY ?? 0 });
    g.restore();
    if (off > 0) receiver(g, off);
    g.restore();
    desk(g);
    register(g, 300, 1370, t, 0.8);
    deskPhone(g, 760, 1362, t, off > 0.5);
    g.restore();
  }
  function receiver(g, a) {                     // the handset at his ear, his hand round it, the sleeve coming up from the desk
    g.save(); g.globalAlpha *= a; g.translate(214, -6); g.rotate(0.1);
    R(g, 22, 120, 170, 900, 70); g.fillStyle = '#b39d68'; g.fill();
    g.strokeStyle = '#d8362a'; g.lineCap = 'round'; g.lineWidth = 56; g.beginPath(); g.moveTo(-12, -104); g.quadraticCurveTo(58, 0, -12, 112); g.stroke();
    for (const y of [-112, 120]) { ell(g, -24, y, 52, 46, 0.2); g.fillStyle = '#d8362a'; g.fill(); }
    for (let i = 0; i < 4; i++) { R(g, -38, -46 + i * 34, 124, 32, 16); g.fillStyle = lg(g, 0, -46 + i * 34, 0, -14 + i * 34, [0, '#c6906a'], [1, '#a06b48']); g.fill(); }
    ell(g, 86, 34, 66, 92); g.fillStyle = '#a8704c'; g.fill();
    g.restore();
  }
  function insetOfficer(g, t, x, y, r) {        // while he whispers: the officer, on the phone, not listening
    g.save(); ell(g, x, y, r + 7, r + 7); g.fillStyle = INK; g.fill(); ell(g, x, y, r, r); g.clip();
    g.fillStyle = lg(g, 0, y - r, 0, y + r, [0, WALL], [1, WALL2]); g.fillRect(x - r, y - r, 2 * r, 2 * r);
    g.translate(x - 8, y - 2); g.scale(0.36, 0.36); g.rotate(0.06);
    officerBody(g);
    head(g, OF, { op: 0.08 + 0.08 * Math.abs(Math.sin(t * 7)), look: [-16, -6], close: blinkAt(t, 3.1, 0.4), frown: 0.2 });
    receiver(g, 1);
    g.restore();
  }
  function register(g, x, y, t, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#7a2c1f'; R(g, -250, -96, 500, 196, 10); g.fill();
    g.fillStyle = '#fbf6e4'; R(g, -238, -86, 234, 176, 4); g.fill(); R(g, 4, -86, 234, 176, 4); g.fill();
    g.strokeStyle = 'rgba(70,120,190,0.32)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { for (const x0 of [-226, 16]) { g.beginPath(); g.moveTo(x0, -60 + i * 26); g.lineTo(x0 + 210, -60 + i * 26); g.stroke(); } }
    g.restore();
  }

  // ------------------------------------------------------------------ the thought cloud: your head is just below the frame
  const PUFFS = [[-0.36, 0.02, 0.2], [-0.22, -0.2, 0.22], [0.02, -0.28, 0.27], [0.26, -0.18, 0.22], [0.38, 0.05, 0.2], [0.24, 0.22, 0.24], [-0.02, 0.26, 0.27], [-0.26, 0.2, 0.23]];
  function cloud(g, cx, cy, w, h, k, o = {}) {
    if (k <= 0) return;
    g.save(); g.translate(cx, cy + (1 - k) * 90); g.scale(lerp(0.72, 1, k), lerp(0.72, 1, k)); g.globalAlpha *= clamp(k * 2);
    const tailX = o.tailX ?? 0;
    for (const [px, py, r] of [[tailX * 0.5 - 0.02, 0.58, 0.05], [tailX * 0.75 - 0.05, 0.72, 0.035], [tailX - 0.07, 0.84, 0.024]]) { ell(g, px * w, py * h, r * w * 1.15, r * w * 1.15); g.strokeStyle = INK; g.lineWidth = 12; g.stroke(); g.fillStyle = '#fff'; g.fill(); }
    for (const pass of [0, 1]) for (const [px, py, r] of PUFFS) { ell(g, px * w, py * h, r * w + (pass ? 0 : 7), r * h * 1.75 + (pass ? 0 : 7)); g.fillStyle = pass ? '#fff' : INK; g.fill(); }
    R(g, -w * 0.4, -h * 0.34, w * 0.8, h * 0.68, 40); g.fillStyle = '#fff'; g.fill();
    g.restore();
  }
  function cloudLabel(g, cx, cy, t, strikeT = 1e9, size = 60) {
    const s = 'YOUR MEMORY';
    g.font = font(size); const w = g.measureText(s).width, x0 = cx - w / 2;
    txt(g, s, cx, cy, size, INK, { align: 'center' });
    if (t >= strikeT) {
      const k = clamp((t - strikeT) / 0.14);
      g.save(); g.strokeStyle = RED; g.lineWidth = size * 0.13; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 - size * 0.12, cy - size * 0.32); g.lineTo(x0 - size * 0.12 + (w + size * 0.24) * k, cy - size * 0.38); g.stroke(); g.restore();
      if (k >= 1) { const q = pop(t, strikeT + 0.14); g.save(); g.translate(cx, cy + size * 1.06); g.rotate(-0.05); g.scale(lerp(0.7, 1, q), lerp(0.7, 1, q)); txt(g, 'HIS STORY', 0, 0, size * 1.24, RED, { align: 'center', a: clamp((t - strikeT - 0.14) * 8) }); g.restore(); }
    }
  }
  // what's in it
  function stall(g, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#6a4326'; g.fillRect(-160, -130, 14, 260); g.fillRect(146, -130, 14, 260);
    g.save(); g.beginPath(); g.moveTo(-190, -148); g.lineTo(190, -148); g.lineTo(190, -72); for (let i = 0; i < 8; i++) { const x1 = 190 - (i + 1) * 47.5; g.quadraticCurveTo(x1 + 24, -48, x1, -72); } g.closePath(); g.clip();
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fff6e2' : '#d8362a'; g.fillRect(-190 + i * 47.5, -160, 47.5, 140); }
    g.restore();
    g.fillStyle = lg(g, 0, 50, 0, 130, [0, '#b77a3d'], [1, '#855324']); g.fillRect(-176, 50, 352, 82);
    R(g, -90, -4, 96, 58, 12); g.fillStyle = '#b8bcc2'; g.fill(); ell(g, -42, -8, 32, 12); g.fillStyle = '#d7dade'; g.fill();
    g.strokeStyle = '#6d5a3c'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, -72); g.lineTo(40, -30); g.stroke();
    ell(g, 40, -16, 16, 20); g.fillStyle = '#ffe9a6'; g.fill(); ell(g, 40, -16, 40, 44); g.fillStyle = 'rgba(255,233,166,0.25)'; g.fill();
    g.restore();
  }
  function glass(g, x, y, s, t = 0) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(245,240,230,0.5)'; g.beginPath(); g.moveTo(-60, -80); g.lineTo(60, -80); g.lineTo(46, 80); g.lineTo(-46, 80); g.closePath(); g.fill(); g.strokeStyle = 'rgba(120,100,70,0.55)'; g.lineWidth = 4; g.stroke();
    g.save(); g.beginPath(); g.moveTo(-56, -50); g.lineTo(56, -50); g.lineTo(44, 76); g.lineTo(-44, 76); g.closePath(); g.clip();
    g.fillStyle = lg(g, -56, -50, 56, 76, [0, '#d59a55'], [1, '#a4632a']); g.fillRect(-60, -60, 120, 150); g.restore();
    g.restore();
  }
  function ginger(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#d9b777'; ell(g, -18, 0, 26, 18, 0.4); g.fill(); ell(g, 14, -6, 22, 16, -0.3); g.fill(); ell(g, 10, 14, 18, 13, 0.2); g.fill(); g.strokeStyle = '#a98a50'; g.lineWidth = 3; g.beginPath(); g.moveTo(-34, -4); g.lineTo(-4, 8); g.stroke(); g.restore(); }
  function note(g, x, y, s, rot = 0) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    R(g, -120, -58, 240, 116, 8); g.fillStyle = lg(g, -120, 0, 120, 0, [0, '#e8b04e'], [1, '#c98a2a']); g.fill(); g.strokeStyle = '#7d5a1c'; g.lineWidth = 4; g.stroke();
    R(g, -106, -44, 212, 88, 4); g.strokeStyle = 'rgba(100,70,20,0.55)'; g.lineWidth = 2.5; g.stroke();
    txt(g, '₹20', 0, 24, 74, '#4f3710', { align: 'center' });
    g.restore();
  }
  function rain(g, x0, y0, x1, y1, t, n = 34) {
    const r = mulberry32(77);
    g.strokeStyle = 'rgba(74,152,214,0.85)'; g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const sx = r(), sp = 0.8 + r() * 0.5, ph = r();
      const u = ((t * sp + ph) % 1), x = lerp(x0, x1, sx) - u * 40, y = lerp(y0, y1, u);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 11, y + 32); g.stroke();
    }
  }

  // ------------------------------------------------------------------ the photo: the shop at 7:40, sharp only for you
  let SHOP = null;
  function clockFace(g, x, y, r2, rim) {
    ell(g, x, y, r2, r2); g.fillStyle = rim; g.fill();
    ell(g, x, y, r2 * 0.82, r2 * 0.82); g.fillStyle = '#fffaf0'; g.fill();
    g.strokeStyle = '#3a3a3a'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * r2 * 0.7, y + Math.sin(a) * r2 * 0.7); g.lineTo(x + Math.cos(a) * r2 * 0.78, y + Math.sin(a) * r2 * 0.78); g.stroke(); }
    const hA = (7 + 40 / 60) / 12 * TAU - Math.PI / 2, mA = 40 / 60 * TAU - Math.PI / 2;
    g.lineCap = 'round'; g.strokeStyle = '#111'; g.lineWidth = r2 * 0.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(hA) * r2 * 0.42, y + Math.sin(hA) * r2 * 0.42); g.stroke();
    g.lineWidth = r2 * 0.07; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(mA) * r2 * 0.66, y + Math.sin(mA) * r2 * 0.66); g.stroke();
    ell(g, x, y, r2 * 0.07, r2 * 0.07); g.fillStyle = '#111'; g.fill();
  }
  function shop() {
    if (SHOP) return SHOP;
    const c = offscreen(W, H), g = c.getContext('2d');
    g.fillStyle = lg(g, 0, 0, 0, 1250, [0, '#f6e4b4'], [1, '#e9c67e']); g.fillRect(0, 0, W, 1300);
    g.fillStyle = '#b77a3d'; g.fillRect(0, 1240, W, 700);
    const rims = ['#7d4a24', '#2f6f73', '#a8282a', '#d39a2a', '#39475c', '#6e7a3a'];
    let k = 0;
    for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) { const x = 90 + col * 176 + (row % 2 ? 40 : 0), y = 470 + row * 176; clockFace(g, x, y, 76 - (k % 3) * 6, rims[k++ % rims.length]); }
    // the sign
    R(g, 400, 276, 540, 96, 10); g.fillStyle = '#b3261e'; g.fill();
    txt(g, 'WATCHES & CLOCKS', 670, 346, 70, '#fff3d6', { align: 'center', fit: 500 });
    // the counter and its glass, one pane smashed, wristwatches on show
    g.fillStyle = lg(g, 0, 1030, 0, 1330, [0, '#8a5a30'], [1, '#5f3c1e']); g.fillRect(0, 1030, W, 300);
    g.fillStyle = 'rgba(205,232,240,0.6)'; g.fillRect(30, 1042, W - 60, 170);
    for (let i = 0; i < 10; i++) {
      const x = 74 + i * 104, hA = (7 + 40 / 60) / 12 * TAU - Math.PI / 2, mA = 40 / 60 * TAU - Math.PI / 2;
      R(g, x - 17, 1058, 34, 136, 8); g.fillStyle = i % 2 ? '#5b3a22' : '#7e848c'; g.fill();
      ell(g, x, 1126, 33, 33); g.fillStyle = '#e8ecf0'; g.fill(); g.strokeStyle = '#59616b'; g.lineWidth = 4; g.stroke();
      g.strokeStyle = '#222'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, 1126); g.lineTo(x + Math.cos(hA) * 15, 1126 + Math.sin(hA) * 15); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(x, 1126); g.lineTo(x + Math.cos(mA) * 23, 1126 + Math.sin(mA) * 23); g.stroke();
    }
    g.strokeStyle = '#fff'; g.lineWidth = 4; for (const [a, b, c2, d] of [[60, 1042, 130, 1130], [130, 1130, 90, 1190], [130, 1130, 210, 1060], [130, 1130, 260, 1200]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); }
    // the owner behind the counter, hands up
    g.save(); g.translate(846, 860); g.scale(0.42, 0.42); g.fillStyle = '#e6e2d6'; R(g, -310, 230, 620, 460, 60); g.fill(); head(g, OLD, { op: 0.25, look: [0, 4], frown: 0, worry: -3 }); g.restore();
    for (const k2 of [-1, 1]) { g.lineCap = 'round'; g.strokeStyle = '#e6e2d6'; g.lineWidth = 48; g.beginPath(); g.moveTo(846 + k2 * 108, 985); g.lineTo(846 + k2 * 172, 838); g.stroke(); g.fillStyle = '#c79a78'; ell(g, 846 + k2 * 176, 790, 42, 54); g.fill(); for (let i = 0; i < 4; i++) { R(g, 846 + k2 * 176 - 32 + i * 18, 722, 15, 50, 7); g.fill(); } }
    // him, in front of it, looking straight up into the camera: narrower shoulders, trousers, arms that reach
    g.fillStyle = '#35456a'; R(g, 300, 1560, 276, 420, 30); g.fill();
    g.save(); g.translate(430, 800); g.scale(0.62, 0.62);
    g.save(); g.scale(0.74, 1); torso(g); g.restore();
    head(g, FR, { op: 0, look: [0, -12], frown: 0.1, worry: 6, smile: 0.12 });
    g.restore();
    // his right arm reaches into the smashed case; his left hand carries the sack
    g.lineCap = 'round';
    g.strokeStyle = '#d9442f'; g.lineWidth = 78; g.beginPath(); g.moveTo(232, 1096); g.lineTo(150, 1170); g.stroke();
    g.strokeStyle = '#c58f6a'; g.lineWidth = 60; g.beginPath(); g.moveTo(150, 1170); g.lineTo(124, 1236); g.stroke(); g.fillStyle = '#d9a780'; ell(g, 120, 1256, 44, 48); g.fill();
    g.strokeStyle = '#d9442f'; g.lineWidth = 78; g.beginPath(); g.moveTo(628, 1096); g.lineTo(700, 1170); g.stroke();
    g.strokeStyle = '#c58f6a'; g.lineWidth = 60; g.beginPath(); g.moveTo(700, 1170); g.lineTo(762, 1222); g.stroke();
    g.fillStyle = '#d9c28e'; g.beginPath(); g.moveTo(748, 1236); g.bezierCurveTo(650, 1282, 650, 1392, 766, 1396); g.bezierCurveTo(892, 1396, 900, 1282, 804, 1236); g.closePath(); g.fill(); g.strokeStyle = '#a58a55'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#7e848c'; R(g, 756, 1214, 22, 66, 6); g.fill(); R(g, 786, 1218, 22, 58, 6); g.fill();
    ell(g, 770, 1208, 26, 26); g.fillStyle = '#18222e'; g.fill(); g.strokeStyle = '#b1b9c2'; g.lineWidth = 6; g.stroke();
    g.strokeStyle = '#f4efe2'; g.lineWidth = 3; g.beginPath(); g.moveTo(760, 1228); g.lineTo(742, 1268); g.stroke();
    R(g, 722, 1268, 40, 56, 5); g.fillStyle = '#e9e1cc'; g.fill(); g.strokeStyle = '#8f8670'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#d9a780'; ell(g, 782, 1236, 42, 36); g.fill();
    SHOP = c;
    return c;
  }
  // a mosaic of the shop into (x, y, w, h) from a source rect: block = how many output pixels each block is
  let TMP = null;
  function mosaic(g, x, y, w, h, block, grey, sx = 0, sy = 0, sw = W, sh = H) {
    const src = shop();
    if (block <= 1.5) { g.save(); if (grey > 0) g.filter = `grayscale(${grey}) contrast(0.9)`; g.drawImage(src, sx, sy, sw, sh, x, y, w, h); g.restore(); return; }
    const tw = Math.max(2, Math.round(w / block)), th = Math.max(2, Math.round(h / block));
    if (!TMP) TMP = offscreen(4, 4);
    TMP.width = tw; TMP.height = th;
    const q = TMP.getContext('2d'); q.imageSmoothingEnabled = true; q.imageSmoothingQuality = 'medium';
    q.filter = grey > 0 ? `grayscale(${grey}) contrast(0.85) brightness(1.04)` : 'none';
    q.drawImage(src, sx, sy, sw, sh, 0, 0, tw, th);
    g.save(); g.imageSmoothingEnabled = false; g.drawImage(TMP, 0, 0, tw, th, x, y, w, h); g.restore();
  }
  function stampText(g, s, x, y, size = 40) { txt(g, s, x, y, size, '#fff', { kind: 'mono', stroke: '#000', sw: 0.2 }); }

  // ------------------------------------------------------------------ the shots
  const titleLines = (g, t, a = 1) => {
    g.save(); g.globalAlpha *= a;
    txt(g, "YOU'RE HIS", 513, 366, 110, CREAM, { align: 'center', stroke: INK, sw: 0.14 });
    txt(g, 'ONLY ALIBI', 513, 526, 172, YEL, { align: 'center', fit: 860, stroke: INK, sw: 0.14 });
    g.restore();
  };
  function shotFirst(g, t) {                     // frame 0, his plea, "locked up"
    const TT = times();
    const cut = t >= TT.n02 - 0.05;                  // a small jump in on "Your best friend's": his left hand is off the bars from here
    const z = (cut ? 1.1 : 1) + 0.02 * sstep(cut ? TT.n02 : 0, cut ? TT.n02e : TT.n02, t), bang = t >= TT.f00 ? Math.exp(-(t - TT.f00) * 7) : 0;
    const [sx, sy] = shakeAt(t, [TT.f00], 12);
    g.save(); g.translate(sx, sy);
    lockup(g, t, { z, cy: 900, py: 900, op: Math.max(talkP(t, 'f00') * 1.5, t < TT.f00 ? 0.05 : 0), tears: 1, wet: 1, dy: -bang * 10, frown: 0.9, gripR: cut ? 0 : 1 });
    g.restore();
    const out = sstep(TT.n02 - 0.1, TT.n02 + 0.08, t);
    if (out < 1) titleLines(g, t, 1 - out);
    if (t >= TT.n02 + 0.1) title(g, 'LOCKED UP', 372, 110, CREAM, t, TT.n02 + 0.1);
    if (t >= TT.n02 + 0.1) title(g, 'FOR ROBBERY', 520, 150, YEL, t, TT.n02 + 0.22);
    return 0;
  }
  function askLabel(g, t, t0) {
    const TT = times();
    title(g, 'LAST TUESDAY, 7:40 PM', 356, 92, CREAM, t, t0);
    if (t >= TT.where) title(g, 'WHERE WERE YOU?', 500, 134, YEL, t, TT.where);
  }
  const WHERE = ['AT HOME', 'OUT', "CAN'T REMEMBER"], WHEREW = [224, 140, 440];
  const DRINK = ['COFFEE', 'GINGER CHAI', "CAN'T REMEMBER"], DRINKW = [180, 290, 340];
  const PAID = ['₹10', '₹20', '₹50'], PAIDW = [260, 260, 260];
  const AGE = ['OLD', 'YOUNG', "CAN'T REMEMBER"], AGEW = [170, 230, 400];
  function printPhoto(g, x, y, w, h, t, rot = 0) {     // the police's picture: grey, a mosaic, the stamp the only sharp thing on it
    g.save(); g.translate(x, y); g.rotate(rot);
    R(g, -w / 2 - 16, -h / 2 - 16, w + 32, h + 32, 6); g.fillStyle = '#fbf8ee'; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.stroke();
    mosaic(g, -w / 2, -h / 2, w, h, w / 16, 1, 0, 380, W, H * 0.58);
    stampText(g, 'TUE 19:40', -w / 2 + 16, h / 2 - 16, 36);
    g.restore();
  }
  function shotPrint(g, t) {                     // "All the police have is a blurry photo of the robber."
    const TT = times();
    officer(g, t, { z: 1 + 0.03 * sstep(TT.n03, TT.has, t), look: [-6, 6], cy: 800, py: 800 });
    const k = pop(t, TT.n03 - 0.1); printPhoto(g, 513, lerp(1500, 1040, k), 660, 462, t, -0.03);
    title(g, 'BLURRY PHOTO', 356, 96, CREAM, t, TT.blurry);
    title(g, 'OF THE ROBBER', 500, 138, YEL, t, TT.blurry + 0.2);
    return 0;
  }
  function shotAsk(g, t) {                       // "Last Tuesday, seven forty. Where were you?" The choices, alone with the clock.
    const TT = times();
    officer(g, t, { z: 1 + 0.04 * sstep(TT.o01, TT.n03b, t), op: talkP(t, 'o01') * 1.05, look: [0, 3], cy: 800, py: 800 });
    askLabel(g, t, TT.o01 - 0.02);
    buttons(g, t, TT.q0, TT.q0e, WHERE, WHEREW);
    timerBar(g, t, TT.q0 + 0.2, TT.q0e);
    return 0;
  }
  function comp(z = 0.85, py = 640) { return { z, cy: HEADY, py }; }
  function shotThink(g, t) {                     // "All he has is you."
    const TT = times();
    const z = lerp(0.92, 1.02, sstep(TT.has - 0.1, TT.n03ae + 0.3, t));
    lockup(g, t, { z, cy: HEADY, py: 650, op: 0, tears: 1, wet: 1, look: [0, 2 + Math.sin(t * 2) * 2] });
    title(g, 'ALL HE HAS', 356, 96, CREAM, t, TT.has + 0.02);
    title(g, 'IS YOU', 492, 156, YEL, t, TT.has + 0.24);
    return 0;
  }
  // the whole frame: what you remember of that night. o: { k, z, full, strike }
  function bigMemory(g, t, o = {}) {
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#a6dfe6'], [1, '#6cc0ca']); g.fillRect(0, 0, W, H);
    const z = o.z ?? 1, k = o.k ?? 1, q = clamp((k - 0.5) * 2);
    g.save(); g.translate(513, 900); g.scale(z, z); g.translate(-513, -900);
    cloud(g, 513, 930, 1000, 1040, k);
    g.save(); g.globalAlpha *= q;
    if (o.full) {
      g.save(); g.beginPath(); g.ellipse(513, 960, 470, 410, 0, 0, TAU); g.clip(); rain(g, 60, 640, 980, 1380, t, 30); g.restore();
      stall(g, 370, 890, 1.25, t);
      glass(g, 735, 930, 1.25); ginger(g, 642, 1016, 0.85);
      note(g, 513, 1200, 1.35, 0.06);
    } else {
      txt(g, 'LAST TUESDAY 7:40 PM', 513, 542, 70, '#59656e', { align: 'center' });
      if (!o.noQ) txt(g, '?', 513, 1110, 560, '#dbe7ea', { align: 'center', a: 0.75 + 0.25 * Math.sin(t * 3.1) });
    }
    cloudLabel(g, 513, 448, t, o.strike ?? 1e9, 132);
    g.restore();
    g.restore();
  }
  function shotMemory(g, t) {                    // "But you don't really remember, because for you it was just another Tuesday."
    const TT = times();
    bigMemory(g, t, { k: pop(t, TT.n03b - 0.05), z: lerp(1, 1.05, sstep(TT.n03b, TT.n03be + 0.3, t)) });
    if (t >= TT.just) { title(g, 'JUST ANOTHER', 1336, 112, INK, t, TT.just, { stroke: '#fff', sw: 0.12 }); title(g, 'TUESDAY', 1478, 150, RED, t, TT.just + 0.14, { stroke: '#fff', sw: 0.12 }); }
    return 0;
  }
  function shotPhone(g, t) {                     // the desk phone rings; he turns away to take it
    const TT = times(), up = sstep(TT.ring, TT.ring + 0.3, t), [sx, sy] = t < TT.ring + 0.4 ? [Math.sin(t * 90) * 2, 0] : [0, 0];
    g.save(); g.translate(sx, sy);
    officer(g, t, { z: 1.02, cy: 800, py: 800, phone: up, dx: -30, roll: 0.05 });
    g.restore();
    return 0;
  }
  function cloudThings(g, t, TT, cx, cy, s = 1, alpha = 1) {          // what he says, landing in your head; each arrives from his mouth
    g.save(); g.globalAlpha *= alpha;
    g.save(); g.beginPath(); g.ellipse(cx, cy, 340 * s, 165 * s, 0, 0, TAU); g.clip();
    if (t >= TT.rain) rain(g, cx - 360 * s, cy - 180 * s, cx + 360 * s, cy + 180 * s, t * 1.3);
    g.restore();
    const landed = (t0, x, y, draw) => { if (t < t0) return; const q = clamp((t - t0) / 0.2), e = q * q * (3 - 2 * q); const X = lerp(513, x, e), Y = lerp(850, y, e), sc = lerp(0.5, 1, e) * (1 + 0.14 * Math.sin(Math.PI * clamp((t - t0 - 0.2) / 0.22))); g.save(); g.translate(X, Y); g.scale(sc, sc); draw(); g.restore(); };
    landed(TT.stallW, cx - 165 * s, cy - 2, () => stall(g, 0, 0, 0.7 * s, t));
    landed(TT.chai, cx + 92 * s, cy + 18, () => { glass(g, 0, 0, 0.75 * s); ginger(g, -58 * s, 56 * s, 0.6 * s); });
    landed(TT.twenty, cx + 262 * s, cy + 42, () => note(g, 0, 0, 0.62 * s, 0.1));
    g.restore();
  }
  function shotPlead(g, t) {                     // the officer's on the phone, and he reminds you. What he says lands in your memory: its own panel, the blue of the full-frame shots.
    const TT = times(), lean = sstep(TT.f01 - 0.2, TT.f01 + 0.3, t);
    lockup(g, t, { z: lerp(0.96, 1.12, lean), cy: 860, py: 640, op: (talkP(t, 'f01') + talkP(t, 'f01r')) * 0.85, tears: 1, wet: 1, look: [0, 3], frown: 0.5 });
    g.fillStyle = lg(g, 0, 1020, 0, H, [0, '#a6dfe6'], [1, '#6cc0ca']); g.fillRect(0, 1020, W, H - 1020);
    g.fillStyle = INK; g.fillRect(0, 1012, W, 10);
    cloud(g, 513, 1322, 860, 330, 1);
    cloudLabel(g, 513, 1186, t, 1e9, 68);
    cloudThings(g, t, TT, 513, 1346);
    insetOfficer(g, t, 820, 402, 122);
    R(g, 690, 514, 260, 62, 16); g.fillStyle = INK; g.fill();
    txt(g, 'ON THE PHONE', 820, 561, 46, CREAM, { align: 'center', fit: 236 });
    return 0;
  }
  function shotNow(g, t) {                       // "And now you do."
    const TT = times();
    bigMemory(g, t, { full: true, z: lerp(1, 1.05, sstep(TT.n04, TT.o02, t)) });
    return 0;
  }
  function shotQuiz(g, t) {                      // the officer's two easy questions
    const TT = times();
    const lean = t < TT.o03 - 0.1 ? lerp(1, 1.06, sstep(TT.o02, TT.q1e, t)) : lerp(1.03, 1.1, sstep(TT.o03, TT.q2e, t));
    officer(g, t, { z: lean, cy: 800, py: 800, op: talkP(t, 'o02') + talkP(t, 'o03') });
    if (t < TT.q1 - 0.02) title(g, 'HE SAYS: CHAI STALL', 400, 104, CREAM, t, wi('o02', 5));
    else if (t < TT.o03 - 0.1) title(g, 'WHAT DID YOU DRINK?', 400, 110, YEL, t, TT.q1 - 0.02);
    else title(g, 'HOW MUCH DID YOU PAY?', 400, 110, YEL, t, TT.o03 - 0.02);
    buttons(g, t, TT.q1, TT.q1e, DRINK, DRINKW);
    timerBar(g, t, TT.q1 + 0.2, TT.q1e);
    buttons(g, t, TT.q2, TT.q2e, PAID, PAIDW);
    timerBar(g, t, TT.q2 + 0.2, TT.q2e);
    return 0;
  }
  function shotRegister(g, t) {                  // his statement, in the officer's register: SAME
    const TT = times();
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#a4683a'], [1, '#6e4120']); g.fillRect(0, 0, W, H);
    g.save(); g.translate(513, 900); g.rotate(-0.015);
    R(g, -420, -560, 840, 1120, 14); g.fillStyle = '#7a2c1f'; g.fill();
    R(g, -396, -536, 792, 1072, 6); g.fillStyle = '#fcf7e6'; g.fill();
    g.strokeStyle = 'rgba(70,120,190,0.3)'; g.lineWidth = 3; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(-370, -470 + i * 72); g.lineTo(370, -470 + i * 72); g.stroke(); }
    const ink = '#1d3a7a';
    txt(g, 'HIS STATEMENT', -350, -412, 66, RED, { kind: 'semi' });
    txt(g, 'TUE 7:40 PM', -350, -268, 70, ink, { kind: 'semi', rot: -0.01 });
    txt(g, 'CHAI STALL', -350, -196, 70, ink, { kind: 'semi', rot: -0.01 });
    txt(g, 'RAINING', -350, -124, 70, ink, { kind: 'semi', rot: 0.005 });
    txt(g, 'YOU: GINGER CHAI', -350, 20, 96, ink, { kind: 'semi', rot: -0.01, fit: 620 });
    txt(g, 'YOU PAID ₹20', -350, 136, 96, ink, { kind: 'semi', rot: 0.005, fit: 620 });
    if (t >= TT.o04) {                              // the stamp comes down on "Same"
      const u = clamp((t - TT.o04) / 0.1), sc = lerp(2.4, 1, u * u);
      g.save(); g.translate(120, 340); g.rotate(-0.14); g.scale(sc, sc); g.globalAlpha *= u;
      R(g, -222, -112, 444, 224, 20); g.strokeStyle = RED; g.lineWidth = 17; g.stroke();
      txt(g, 'SAME', 0, 66, 186, RED, { align: 'center' });
      g.restore();
    }
    g.restore();
    return 0;
  }
  function shotHis(g, t) {                       // "Everything you know about that night, he told you."
    const TT = times();
    bigMemory(g, t, { full: true, strike: TT.told, z: lerp(1, 1.06, sstep(TT.n06, TT.n06e + 0.4, t)) });
    return 0;
  }
  function shotWhere(g, t) {                     // "So where was he, really?" The police's print, full frame.
    const TT = times(), z = 1 + 0.06 * sstep(TT.n06b - 0.1, TT.n07, t);
    g.save(); g.translate(513, 900); g.scale(z, z); g.translate(-513, -900);
    mosaic(g, 0, 0, W, H, 66, 1);
    g.restore();
    stampText(g, 'CAM 2', 90, 330, 46); stampText(g, 'TUE 19:40', 90, 388, 60);
    title(g, 'SO WHERE WAS HE?', 1470, 124, YEL, t, TT.n06b + 0.02);
    return 0;
  }
  function shotHere(g, t) {                      // the photo sharpens, for you alone
    const TT = times(), u = clamp((t - (TT.n07 - 0.05)) / 0.42);
    const block = lerp(66, 1, sstep(0, 1, u)), grey = 1 - sstep(0.3, 1, u), z = lerp(1.06, 1, sstep(0, 1, u));
    g.save(); g.translate(513, 900); g.scale(z, z); g.translate(-513, -900);
    mosaic(g, 0, 0, W, H, block, grey);
    g.restore();
    stampText(g, 'CAM 2', 90, 330, 46); stampText(g, 'TUE 19:40', 90, 388, 60);
    if (u > 0.82) { const a = sstep(0.82, 1, u); g.save(); g.globalAlpha *= a; txt(g, 'HE WAS HERE', 513, 1512, 128, YEL, { align: 'center', fit: 700, stroke: INK, sw: 0.14 }); g.restore(); }
    return flashAt(t, TT.n07 + 0.1) * 0.45;
  }
  function shotGo(g, t) {                        // the officer lets him go; the print is still a blur in his hand
    const TT = times();
    const open = sstep(TT.goW, TT.goW + 0.55, t), [sx, sy] = shakeAt(t, [TT.goW + 0.4], 18);
    g.save(); g.translate(sx, sy);
    g.save(); g.translate(513, 700); g.scale(0.75, 0.75); g.translate(-513, -850);
    cellBack(g);
    g.save(); g.translate(HEADX, HEADY + 10); g.scale(HEADS, HEADS); torso(g); head(g, FR, { look: [-16, 4], close: blinkAt(t, 2.8, 0.9), frown: 0, smile: 0.1, op: 0 }); g.restore();
    bars(g, open);
    g.restore();
    g.save(); g.translate(262, 1030); g.scale(0.8, 0.8); officerBody(g); head(g, OF, { op: talkP(t, 'o05'), close: blinkAt(t, 4, 3), look: [14, 2], frown: 0.1 }); g.restore();
    desk(g, 1330);
    printPhoto(g, 640, 1400, 320, 224, t, 0.04);
    g.restore();
    title(g, 'ALIBI CONFIRMED', 400, 118, YEL, t, TT.o05);
    return 0;
  }
  function walker(g, t, s, x, y, o = {}) {       // he walks at you: body, then all face
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#35456a'; R(g, -300, 1100, 600, 1400, 80); g.fill();
    torso(g);
    g.lineCap = 'round'; g.strokeStyle = '#d9442f'; g.lineWidth = 132; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 436, 470); g.lineTo(k * 530, 860); g.stroke(); g.beginPath(); g.moveTo(k * 530, 860); g.lineTo(k * 310, 1130); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 8; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 372, 560); g.lineTo(k * 440, 860); g.stroke(); }
    g.fillStyle = '#35456a'; R(g, -498, 1096, 996, 1500, 30); g.fill();
    head(g, FR, { op: o.op ?? 0, close: Math.max(o.close ?? 0, blinkAt(t, 3.6, 1.7)), look: o.look ?? [0, 0], frown: o.frown ?? 0, smile: o.smile ?? 0, worry: o.worry ?? 12 });
    g.restore();
  }
  function shotWalk(g, t) {                      // You just set a robber free. He arrives, fills the frame, and the smile comes.
    const TT = times(), u = sstep(TT.n08 - 0.2, TT.n08e + 0.45, t);
    const s = lerp(0.66, 1.62, u), bob = Math.sin(t * 7) * 10 * (1 - sstep(0.85, 1, u)), y = lerp(700, 850, u);
    g.save(); g.translate(513, 700); g.scale(0.75, 0.75); g.translate(-513, -850);
    cellBack(g); bars(g, 1);
    g.restore();
    const smirk = sstep(TT.n08e + 0.1, TT.f02 - 0.05, t);
    walker(g, t, s, 513, y + bob, { smile: lerp(0.08, 0.95, smirk), close: 0.22 * smirk, look: [0, -1], worry: lerp(12, 20, smirk) });
    title(g, 'YOU JUST SET', 356, 96, CREAM, t, TT.n08 + 0.02); title(g, 'A ROBBER FREE', 500, 146, YEL, t, TT.robber);
    return 0;
  }
  function shotShoulder(g, t) {                  // Next time, I'll pay.
    const TT = times(), u = sstep(TT.f02, TT.f02 + 0.25, t), past = sstep(TT.f02e - 0.1, TT.f02e + 0.4, t);
    const [sx, sy] = shakeAt(t, [TT.f02 + 0.05], 16);
    g.save(); g.translate(sx, sy);
    g.save(); g.translate(513, 700); g.scale(0.75, 0.75); g.translate(-513, -850);
    cellBack(g); bars(g, 1);
    g.restore();
    walker(g, t, lerp(1.62 + 0.3 * u, 2.4, past), lerp(513, 1500, past), 850 + 40 * u, { op: talkP(t, 'f02') * 1.05, smile: 0.5, look: [0, 2] });
    g.restore();
    if (t >= TT.f02 + 0.05 && past < 0.3) title(g, "NEXT TIME, I'LL PAY", 400, 112, YEL, t, TT.f02 + 0.05);
    return 0;
  }
  function emptyCell(g, t) {
    g.save(); g.translate(513, 700); g.scale(0.75, 0.75); g.translate(-513, -850);
    cellBack(g); bars(g, 1);
    g.restore();
  }
  function imagined(g, x, y, s, a) {             // the man you added: no face, because he's whoever you pictured
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= a;
    g.fillStyle = '#9fb3ba';
    ell(g, 0, -150, 70, 86); g.fill();
    g.beginPath(); g.moveTo(-40, -70); g.bezierCurveTo(-130, -60, -170, -20, -180, 60); g.lineTo(-190, 320); g.lineTo(190, 320); g.lineTo(180, 60); g.bezierCurveTo(170, -20, 130, -60, 40, -70); g.closePath(); g.fillStyle = lg(g, 0, 120, 0, 320, [0, '#9fb3ba'], [1, 'rgba(159,179,186,0)']); g.fill();
    g.fillStyle = '#9fb3ba'; g.strokeStyle = '#9fb3ba'; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 56; g.beginPath(); g.moveTo(150, 10); g.lineTo(250, 84); g.lineTo(300, 14); g.stroke();
    ell(g, 322, -30, 62, 52); g.fill();
    g.beginPath(); g.moveTo(376, -44); g.lineTo(438, -84); g.lineTo(446, -68); g.lineTo(374, -8); g.closePath(); g.fill();
    g.restore();
  }
  function shotAgain(g, t) {                     // "One more thing. The chaiwala. Old or young?" Your empty memory, then the man you just pictured. "You never saw him. One question put him there."
    const TT = times(), z = lerp(1, 1.05, sstep(TT.o06, TT.n13e + 0.4, t));
    const man = sstep(TT.n12, TT.n12 + 0.5, t);
    bigMemory(g, t, { k: pop(t, TT.o06 - 0.05), z, noQ: man > 0.02 });
    g.save(); g.translate(513, 900); g.scale(z, z); g.translate(-513, -900);
    if (man > 0) imagined(g, 470, 960, 0.95, man);
    if (t >= TT.n13) {
      const k = clamp((t - TT.n13) / 0.3);
      g.save(); g.strokeStyle = RED; g.lineWidth = 11; g.setLineDash([24, 18]); g.lineDashOffset = -t * 30; g.globalAlpha *= k; ell(g, 470, 880, 250, 320); g.stroke(); g.setLineDash([]); g.restore();
    }
    g.restore();
    if (t < TT.n12 - 0.05) {
      if (t >= TT.chaiW && t < TT.q4) title(g, 'THE CHAIWALA', 1470, 124, INK, t, TT.chaiW, { stroke: '#fff', sw: 0.12 });
      if (t >= TT.q4) title(g, 'OLD OR YOUNG?', 1290, 120, RED, t, TT.q4, { stroke: '#fff', sw: 0.12 });
      buttons(g, t, TT.q4, TT.q4e, AGE, AGEW);
      timerBar(g, t, TT.q4 + 0.2, TT.q4e);
    }
    else if (t < TT.n13 - 0.05) title(g, 'YOU NEVER SAW HIM', 1470, 112, INK, t, TT.n12, { stroke: '#fff', sw: 0.12 });
    else { title(g, 'ONE QUESTION', 1336, 112, INK, t, TT.n13, { stroke: '#fff', sw: 0.12 }); title(g, 'PUT HIM THERE', 1478, 136, RED, t, wi('n13', 2), { stroke: '#fff', sw: 0.12 }); }
    return 0;
  }
  function shotText(g, t) {                      // your phone: you try it on a friend; they add the chaiwala too
    const TT = times();
    emptyCell(g, t);
    g.fillStyle = 'rgba(10,20,24,0.22)'; g.fillRect(0, 0, W, H);
    const up = pop(t, TT.n14 - 0.05), y = lerp(H + 300, 880, up);
    g.save(); g.translate(513, y);
    R(g, -340, -600, 680, 1240, 60); g.fillStyle = '#181a1f'; g.fill();
    R(g, -312, -572, 624, 1184, 40); g.fillStyle = '#ecf1ea'; g.fill();
    R(g, -312, -572, 624, 134, [40, 40, 0, 0]); g.fillStyle = '#2aa08f'; g.fill();
    ell(g, -240, -505, 44, 44); g.fillStyle = '#d7e6e0'; g.fill();                       // nobody in particular
    ell(g, -240, -519, 17, 17); g.fillStyle = '#6f8a83'; g.fill(); ell(g, -240, -483, 28, 18); g.fill();
    txt(g, 'ROHAN', -180, -484, 62, '#fff', { kind: 'semi', fit: 460 });
    R(g, -286, 470, 572, 104, 46); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#c9cfc8'; g.lineWidth = 3; g.stroke();
    if (t >= TT.n14 + 0.3) {
      const q = pop(t, TT.n14 + 0.3);
      g.save(); g.translate(280, -270); g.scale(q, q);
      R(g, -520, -160, 520, 330, 34); g.fillStyle = '#c8f2d4'; g.fill();
      txt(g, 'You had ginger chai', -490, -62, 62, INK, { kind: 'semi' }); txt(g, 'last Tuesday,', -490, 36, 62, INK, { kind: 'semi' }); txt(g, 'remember?', -490, 134, 62, INK, { kind: 'semi' });
      g.restore();
    }
    const r = TT.n14e + 0.15;
    if (t >= r) {
      const q = pop(t, r);
      g.save(); g.translate(-280, 170); g.scale(q, q);
      R(g, 0, -116, 500, 262, 34); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#c9cfc8'; g.lineWidth = 3; g.stroke();
      txt(g, 'Yes! That old', 34, -14, 76, INK, { kind: 'semi' }); txt(g, 'chaiwala, right?', 34, 92, 76, INK, { kind: 'semi' });
      g.restore();
    }
    g.restore();
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
      if (t < TT.n03 - 0.08) fl = shotFirst(g, t);
      else if (t < TT.has - 0.05) fl = shotPrint(g, t);
      else if (t < TT.o01 - 0.08) fl = shotThink(g, t);
      else if (t < TT.n03b - 0.06) fl = shotAsk(g, t);
      else if (t < TT.n03be + 0.06) fl = shotMemory(g, t);
      else if (t < TT.f01 - 0.1) fl = shotPhone(g, t);
      else if (t < TT.f01e + 0.16) fl = shotPlead(g, t);
      else if (t < TT.o02 - 0.1) fl = shotNow(g, t);
      else if (t < TT.o04 - 0.08) fl = shotQuiz(g, t);
      else if (t < TT.n06 - 0.08) fl = shotRegister(g, t);
      else if (t < TT.n06b - 0.08) fl = shotHis(g, t);
      else if (t < TT.n07 - 0.05) fl = shotWhere(g, t);
      else if (t < TT.o05 - 0.1) fl = shotHere(g, t);
      else if (t < TT.n08 - 0.15) fl = shotGo(g, t);
      else if (t < TT.f02 - 0.05) fl = shotWalk(g, t);
      else if (t < TT.o06 - 0.1) fl = shotShoulder(g, t);
      else if (t < TT.n14 - 0.1) fl = shotAgain(g, t);
      else fl = shotText(g, t);
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
