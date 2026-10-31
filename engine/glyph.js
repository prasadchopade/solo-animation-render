// glyph.js — Glyph, the channel's mascot: the Root Cause mark come alive. His spine is the mark's stem, the two leaves grow
// from his small round head, his legs are its roots; the orange dot is not on him, it is what he digs for. Cream tubes with
// an ink outline, so he reads on light and dark sets. He acts (he never speaks); a calm narrator explains. Each reel can
// dress him (outfit): a costume that fits the story, always our own design (no real logos, suits or likenesses).
// A pure function of the pose: nothing is kept between frames.
//
//   GLYPH.draw(g, pose)   pose: {
//     x, y         ground contact (px)                     s: scale (1 ≈ 340 px tall, leaves included)
//     t, seed      seconds (breath, blinks, leaf sway, cape); a per-shot blink offset
//     mood         neutral | skeptical | shocked | aha | worried | smug | determined | happy | sad
//     mouth        override: flat | slant | smile | grin | o | smirk | wavy | yell
//     look [x, y]  −1..1    blink 0..1    lean (rad, about the feet)    squash (> 0 squashes, < 0 stretches)    flip
//     curve        the spine's bend, −1..1 (+ bows toward screen right)
//     armL, armR   [angle from straight down (+ out / up), elbow bend] | { e: [x, y], h: [x, y] } | 'cross'
//     legL, legR   { k: [x, y], f: [x, y] } knee and foot (default: standing)
//     walk         a phase (rad): marching in place, feet lifting in turn, the body bobbing, arms swinging
//     drill        0..1 his roots twist together into a spinning drill under him (the dive)
//     palm         0..1 both leaf-hands come up over his eyes (can't watch)
//     prop, propL  (g) => draws in the right / left hand's space
//     leaves       false: no stem and leaves (another hero drawn in his style, not Glyph)
//     outfit       a wardrobe entry (GLYPH.OUTFITS.name or an object): { suit, legs, head, gloves, boots, cape, coat, scarf, mask,
//                  glasses, beard, emblem, hat (wings | fedora | toque | driver | horned | pith | woolcap | ironhelm), hatC, band, tie } }
//   GLYPH.OUTFITS, GLYPH.P (palette), GLYPH.props (hammer, …)
(() => {
  const TAU = Math.PI * 2;
  const P = { ink: '#1f2a24', line: '#f3eee4', leaf: '#6fae5a', vein: '#3f7a3a', dot: '#ff8a1f', inside: '#3a1c1c' };

  // ------------------------------------------------------------------ drawing helpers
  function leafShape(g, len, wid) {
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(-wid * 0.5, -len * 0.16, -wid * 0.58, -len * 0.7, 0, -len);
    g.bezierCurveTo(wid * 0.58, -len * 0.7, wid * 0.5, -len * 0.16, 0, 0); g.closePath();
  }
  function leaf(g, x, y, rot, len, wid, fill, lw = 4.5, vein = null) {
    g.save(); g.translate(x, y); g.rotate(rot); leafShape(g, len, wid); g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = P.ink; g.stroke();
    if (vein) { g.strokeStyle = vein; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -len * 0.12); g.lineTo(0, -len * 0.8); g.stroke(); }
    g.restore();
  }
  function limb(sx, sy, side, a, b, l1, l2) {
    const a1 = side * a, ex = sx + Math.sin(a1) * l1, ey = sy + Math.cos(a1) * l1;
    const a2 = a1 + side * b; return [[sx, sy], [ex, ey], [ex + Math.sin(a2) * l2, ey + Math.cos(a2) * l2]];
  }
  function armPts(v, sx, sy, side, d, l1, l2) {
    if (v && v.e) return [[sx, sy], v.e, v.h];
    const p = Array.isArray(v) ? v : typeof v === 'number' ? [v, d[1]] : d;
    return limb(sx, sy, side, p[0], p[1], l1, l2);
  }
  function path3(g, p) {                                     // a soft limb through three points (bent at the middle one)
    g.beginPath(); g.moveTo(p[0][0], p[0][1]);
    g.quadraticCurveTo(2 * p[1][0] - (p[0][0] + p[2][0]) / 2, 2 * p[1][1] - (p[0][1] + p[2][1]) / 2, p[2][0], p[2][1]);
  }
  function tube(g, p, w, fill, ow = 4.5) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    path3(g, p); g.lineWidth = w + ow * 2; g.strokeStyle = P.ink; g.stroke();
    path3(g, p); g.lineWidth = w; g.strokeStyle = fill; g.stroke();
  }
  const mid = (p, k) => {                                    // a point k (0..1) along a 3-point soft limb
    const c = [2 * p[1][0] - (p[0][0] + p[2][0]) / 2, 2 * p[1][1] - (p[0][1] + p[2][1]) / 2], u = 1 - k;
    return [u * u * p[0][0] + 2 * u * k * c[0] + k * k * p[2][0], u * u * p[0][1] + 2 * u * k * c[1] + k * k * p[2][1]];
  };
  function brow(g, cx, y, side, inner, outer, len, lw) {
    g.lineWidth = lw; g.strokeStyle = P.ink; g.lineCap = 'round';
    const xi = cx - side * len * 0.45, xo = cx + side * len * 0.55;
    g.beginPath(); g.moveTo(xi, y + inner); g.quadraticCurveTo((xi + xo) / 2, y + (inner + outer) / 2 - lw * 0.6, xo, y + outer); g.stroke();
  }
  function mouth(g, kind, x, y, w) {
    g.lineWidth = 4; g.strokeStyle = P.ink; g.lineCap = 'round'; g.lineJoin = 'round';
    const h = w / 2;
    if (kind === 'flat') { g.beginPath(); g.moveTo(x - h * 0.8, y); g.lineTo(x + h, y); g.stroke(); }
    else if (kind === 'slant') { g.beginPath(); g.moveTo(x - h, y + 2); g.lineTo(x + h, y - 3); g.stroke(); }
    else if (kind === 'smile') { g.beginPath(); g.moveTo(x - h, y - 2); g.quadraticCurveTo(x, y + h * 0.75, x + h, y - 2); g.stroke(); }
    else if (kind === 'sad') { g.beginPath(); g.moveTo(x - h, y + 3); g.quadraticCurveTo(x, y - h * 0.6, x + h, y + 3); g.stroke(); }
    else if (kind === 'grin') { g.beginPath(); g.moveTo(x - h, y - 3); g.quadraticCurveTo(x, y + h * 1.15, x + h, y - 3); g.closePath(); g.fillStyle = P.inside; g.fill(); g.stroke(); }
    else if (kind === 'o' || kind === 'yell') { const k = kind === 'yell' ? 1.5 : 1; g.beginPath(); g.ellipse(x, y + 2, h * 0.42 * k, h * 0.55 * k, 0, 0, TAU); g.fillStyle = P.inside; g.fill(); g.stroke(); }
    else if (kind === 'smirk') { g.beginPath(); g.moveTo(x - h * 0.8, y); g.quadraticCurveTo(x + h * 0.3, y + 3, x + h, y - 5); g.stroke(); }
    else if (kind === 'wavy') { g.beginPath(); g.moveTo(x - h, y); g.bezierCurveTo(x - h * 0.5, y - 4, x - h * 0.15, y + 4, x + h * 0.2, y); g.bezierCurveTo(x + h * 0.5, y - 4, x + h * 0.8, y + 3, x + h, y); g.stroke(); }
  }
  function idleBlink(t, seed) { const per = 3.4, ph = (t + seed * 1.37) % per; return ph < 0.12 ? Math.sin((ph / 0.12) * Math.PI) : 0; }
  function necktie(g, x, y, k, col) {
    g.save(); g.translate(x, y); g.lineJoin = 'round'; g.lineWidth = 3.5; g.strokeStyle = P.ink;
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-18, -7); g.lineTo(-3, 0); g.lineTo(-8, 7); g.closePath(); g.moveTo(18, -7); g.lineTo(3, 0); g.lineTo(8, 7); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = col; g.beginPath(); g.moveTo(-6, -1); g.lineTo(6, -1); g.lineTo(4, 6); g.lineTo(-4, 6); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-4, 6); g.lineTo(4, 6); g.lineTo(9, 34 * k); g.lineTo(0, 44 * k); g.lineTo(-9, 34 * k); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }

  // ------------------------------------------------------------------ the face per mood: [browL [inner, outer], browR, mouth, eye scale]
  const FACE = {
    neutral: [null, null, 'flat', 1], skeptical: [[-6, -8], [2, 1], 'slant', 1], shocked: [[-8, -6], [-8, -6], 'o', 1.25],
    aha: [[-6, -6], [-6, -6], 'smile', 1.1], worried: [[-5, 2], [-5, 2], 'wavy', 1], smug: [[1, -3], [-1, -4], 'smirk', 0.9],
    determined: [[4, -2], [4, -2], 'flat', 1], happy: [[-3, -3], [-3, -3], 'grin', 1], sad: [[-5, 3], [-5, 3], 'sad', 0.95],
  };

  // ------------------------------------------------------------------ the wardrobe (our own designs only)
  const OUTFITS = {
    plain: {},
    // the channel's own superhero: a leaf cape, a forest suit, a dark mask, the orange dot on his chest
    leafhero: { suit: '#2f5d3a', legs: '#2f5d3a', gloves: '#6fae5a', boots: '#1f2a24', cape: { c: '#6fae5a', d: '#3f7a3a', leaf: true }, mask: { type: 'domino', c: '#1f2a24' }, emblem: 'dot' },
    // a classic caped hero: navy suit, red cape, gloves and boots, a domino mask, the dot as the emblem
    hero: { suit: '#2b4aa0', legs: '#2b4aa0', gloves: '#d23a2a', boots: '#d23a2a', cape: { c: '#d23a2a', d: '#9c2a1f' }, mask: { type: 'domino', c: '#d23a2a' }, emblem: 'dot' },
    // an armoured suit: red and gold, a gold face plate, the dot glowing in his chest like a power core
    armor: { suit: '#b8322a', legs: '#b8322a', gloves: '#e0b040', boots: '#e0b040', head: '#b8322a', mask: { type: 'plate', c: '#e0b040' }, emblem: 'core' },
    // quick-change nods for the hook (one hint each; colours and a prop, never the real design)
    nodArmor: { suit: '#b8322a', legs: '#b8322a', gloves: '#e0b040', boots: '#e0b040', head: '#b8322a', mask: { type: 'plate', c: '#e0b040' }, emblem: 'core' },
    nodThunder: { suit: '#56677e', legs: '#56677e', boots: '#3a4554', cape: { c: '#c0392b', d: '#8e2a20' }, hat: 'wings' },
    nodCat: { suit: '#232030', legs: '#232030', gloves: '#232030', boots: '#232030', head: '#232030', mask: { type: 'ears', c: '#232030' }, emblem: 'necklace' },
    nodSpider: { suit: '#c62f2a', legs: '#2a50c8', gloves: '#c62f2a', boots: '#c62f2a', head: '#c62f2a', mask: { type: 'web', c: '#c62f2a' } },
    intern: { tie: '#b5322a' },
    // reel 6 (Michelin): the anonymous inspector, the chef, the 1900 motorist
    inspector: { suit: '#3b3f48', legs: '#2c2f36', gloves: '#3b3f48', coat: { c: '#b8945c', d: '#8a6d3f', belt: true }, hat: 'fedora', hatC: '#4a4038', band: '#2a2420', glasses: 'shades' },
    chef: { suit: '#fbf9f4', legs: '#2b2b33', coat: { c: '#fbf9f4', d: '#d9d3c6', short: true, buttons: '#1f2a24' }, scarf: { c: '#c0392b' }, hat: 'toque' },
    // reel 7 (Viking horns): the myth's horned Viking, the archaeologist, a real Viking (no helmet: too dear)
    vikingMyth: { suit: '#4a6278', legs: '#5a4632', gloves: '#7a5a3a', boots: '#3a2a1e', cape: { c: '#8a5c38', d: '#5a3a22', fur: true }, hat: 'horned', beard: '#c8742e' },
    archaeologist: { suit: '#c8b48a', legs: '#8a7a5a', gloves: '#7a5a3a', boots: '#4a3424', coat: { c: '#bfa77a', d: '#9c8660', short: true, pockets: true }, scarf: { c: '#2e7d6e' }, hat: 'pith' },
    vikingReal: { suit: '#7a6248', legs: '#5a4a3a', gloves: '#7a5a3a', boots: '#3a2a1e', coat: { c: '#8a7050', d: '#6a5238', short: true, belt: true }, hat: 'woolcap', hatC: '#6b5a48', beard: '#a8642a' },
    motorist: { suit: '#6e5038', legs: '#3a342e', gloves: '#5a3a24', boots: '#2a1a10', coat: { c: '#d8c59a', d: '#a8946a' }, scarf: { c: '#c0392b', long: true }, hat: 'driver', hatC: '#6b4426' },
  };
  const outfitOf = (o) => (typeof o === 'string' ? OUTFITS[o] || {} : o || {});

  function cape(g, C, t, nx, sx) {                           // behind him, from the shoulders to the knees, rippling
    const top = -190, bot = -36, w0 = 18, w1 = 74, ph = t * 3.1;
    const wave = (u) => 7 * Math.sin(ph + u * 4) + 4 * Math.sin(ph * 1.7 + u * 7);
    g.fillStyle = C.c; g.strokeStyle = P.ink; g.lineWidth = 4.5; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(sx - w0, top);
    if (C.leaf) {                                            // a leaf: pointed at the bottom, a vein down the middle
      g.bezierCurveTo(sx - w1 - 10, top + 50, sx - w1 + wave(0), bot - 30, sx + 4 + wave(0.5), bot + 26);
      g.bezierCurveTo(sx + w1 + wave(1), bot - 30, sx + w1 + 10, top + 50, sx + w0, top);
    } else {
      g.lineTo(sx - w1 + wave(0) * 0.6, bot + wave(0));
      for (let k = 1; k <= 4; k++) { const u = k / 4, x = sx - w1 + 2 * w1 * u; g.quadraticCurveTo(x - w1 / 4, bot + 12 + wave(u - 0.12), x + wave(u) * 0.6, bot + wave(u)); }
      g.lineTo(sx + w0, top);
    }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C.d; g.beginPath(); g.moveTo(sx - w0 + 4, top + 6); g.lineTo(sx - 10, bot - 10 + wave(0.4)); g.lineTo(sx + 10, bot - 10 + wave(0.6)); g.lineTo(sx + w0 - 4, top + 6); g.closePath(); g.globalAlpha *= 0.5; g.fill(); g.globalAlpha /= 0.5;
    if (C.leaf) { g.strokeStyle = C.d; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, top + 10); g.lineTo(sx + 3 + wave(0.5) * 0.8, bot + 14); g.stroke(); }
    if (C.fur) {                                             // a fur cloak: tufts along the hem, a thick collar
      g.strokeStyle = C.d; g.lineWidth = 3; for (let k = 0; k < 9; k++) { const x = sx - w1 + 10 + k * (2 * w1 - 20) / 8; g.beginPath(); g.moveTo(x, bot - 12 + wave(k / 8)); g.lineTo(x + 4, bot - 30 + wave(k / 8)); g.stroke(); }
      g.fillStyle = '#c9a77a'; g.strokeStyle = P.ink; g.lineWidth = 3.5; g.beginPath(); for (let k = 0; k < 7; k++) { const x = sx - 34 + k * 11.3, y = top + 4 + Math.sin(k * 1.7) * 3; g.moveTo(x + 11, y); g.arc(x, y, 11, 0, TAU); } g.fill(); g.stroke();
    }
  }

  function coat(g, C, nx, cv) {                              // a coat from the shoulders: long (trench, duster) or short (chef's jacket)
    const tx = nx * 0.95, ty = -198, by = C.short ? -92 : -40, wt = 24, wb = C.short ? 34 : 50, mx = cv * 30;
    g.fillStyle = C.c; g.strokeStyle = P.ink; g.lineWidth = 4.5; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(tx - wt, ty); g.quadraticCurveTo(mx - wt - 16, -130, -wb, by); g.lineTo(wb, by); g.quadraticCurveTo(mx + wt + 16, -130, tx + wt, ty); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = C.d; g.lineWidth = 3.5; g.beginPath(); g.moveTo(tx, ty + 6); g.quadraticCurveTo(cv * 22 + 2, -130, 3, by); g.stroke();   // the front edge
    g.fillStyle = C.d; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(tx + d * 3, ty + 2); g.lineTo(tx + d * 22, ty + 4); g.lineTo(tx + d * 6, ty + 42); g.closePath(); g.fill(); }   // lapels
    if (C.belt) { const yb = -122, bx = cv * 24; g.fillStyle = C.d; g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.roundRect(bx - 42, yb - 7, 84, 14, 3); g.fill(); g.stroke();
      g.fillStyle = '#c9a54a'; g.beginPath(); g.roundRect(bx - 9, yb - 9, 18, 18, 3); g.fill(); g.stroke(); }
    if (C.pockets) { g.fillStyle = C.d; g.strokeStyle = P.ink; g.lineWidth = 2.5; for (const d of [-1, 1]) { g.beginPath(); g.roundRect(cv * 20 + d * 14 - 11, -166, 22, 20, 3); g.fill(); g.stroke(); } }
    if (C.buttons) { g.fillStyle = C.buttons; for (const [dx, dy] of [[-11, -176], [11, -176], [-12, -150], [12, -150], [-13, -124], [13, -124]]) { g.beginPath(); g.arc(cv * 24 * ((dy + 210) / 120) + dx, dy, 4.2, 0, TAU); g.fill(); } }
  }
  function scarf(g, C, nx, t) {                              // a neckerchief; long: two tails streaming to the side
    g.fillStyle = C.c; g.strokeStyle = P.ink; g.lineWidth = 3.5; g.lineJoin = 'round';
    if (C.long) {
      const w = (u) => 6 * Math.sin(t * 5 + u * 3);
      for (const [dy, len] of [[0, 1], [10, 0.8]]) { g.beginPath(); g.moveTo(nx + 6, -200 + dy); g.quadraticCurveTo(nx + 40 * len, -206 + dy + w(0.4), nx + 76 * len, -196 + dy + w(1)); g.lineTo(nx + 74 * len, -184 + dy + w(1)); g.quadraticCurveTo(nx + 40 * len, -192 + dy + w(0.4), nx + 6, -188 + dy); g.closePath(); g.fill(); g.stroke(); }
    }
    g.beginPath(); g.ellipse(nx, -198, 22, 9, 0, 0, TAU); g.fill(); g.stroke();
    if (!C.long) { g.beginPath(); g.moveTo(nx - 10, -194); g.lineTo(nx + 10, -194); g.lineTo(nx + 2, -172); g.closePath(); g.fill(); g.stroke(); }
  }
  const HAT_TOP = { fedora: -64, toque: -102, driver: -36, horned: -40, pith: -60, woolcap: -46, ironhelm: -40 };      // where the leaves come out of each hat (from the head's centre)
  function hat(g, W, nx, hy) {
    const kind = W.hat; g.strokeStyle = P.ink; g.lineWidth = 4; g.lineJoin = 'round';
    if (kind === 'fedora') {
      g.fillStyle = W.hatC || '#4a4038';
      g.beginPath(); g.moveTo(nx - 30, hy - 24); g.quadraticCurveTo(nx - 32, hy - 62, nx - 8, hy - 64); g.quadraticCurveTo(nx, hy - 56, nx + 8, hy - 64); g.quadraticCurveTo(nx + 32, hy - 62, nx + 30, hy - 24); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = W.band || '#2a2420'; g.fillRect(nx - 30, hy - 36, 60, 11); g.strokeRect(nx - 30, hy - 36, 60, 11);
      g.fillStyle = W.hatC || '#4a4038'; g.beginPath(); g.ellipse(nx, hy - 24, 54, 9, 0, 0, TAU); g.fill(); g.stroke();
    } else if (kind === 'toque') {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.moveTo(nx - 28, hy - 26); g.bezierCurveTo(nx - 56, hy - 70, nx - 40, hy - 108, nx - 14, hy - 100); g.bezierCurveTo(nx - 6, hy - 116, nx + 14, hy - 116, nx + 18, hy - 100);
      g.bezierCurveTo(nx + 44, hy - 106, nx + 56, hy - 70, nx + 28, hy - 26); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#d9d3c6'; g.lineWidth = 3; for (const dx of [-14, 0, 14]) { g.beginPath(); g.moveTo(nx + dx, hy - 30); g.lineTo(nx + dx * 1.3, hy - 86); g.stroke(); }
      g.fillStyle = '#ffffff'; g.strokeStyle = P.ink; g.lineWidth = 4; g.beginPath(); g.roundRect(nx - 30, hy - 40, 60, 18, 4); g.fill(); g.stroke();
    } else if (kind === 'horned') {                          // the myth: an iron cap with two big cow horns
      for (const d of [-1, 1]) {
        g.fillStyle = '#f1e6cf'; g.strokeStyle = P.ink; g.lineWidth = 4;
        g.beginPath(); g.moveTo(nx + d * 24, hy - 14); g.quadraticCurveTo(nx + d * 78, hy - 18, nx + d * 80, hy - 94); g.quadraticCurveTo(nx + d * 58, hy - 46, nx + d * 28, hy - 34); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(80,60,30,0.3)'; g.lineWidth = 3; for (const k of [0.3, 0.55]) { const x0 = nx + d * (26 + 44 * k), y0 = hy - 16 - 30 * k; g.beginPath(); g.moveTo(x0, y0 - 2); g.lineTo(x0 + d * 6, y0 - 16); g.stroke(); }
      }
      g.fillStyle = '#8a96a4'; g.strokeStyle = P.ink; g.lineWidth = 4; g.beginPath(); g.arc(nx, hy - 4, 35, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#6b7684'; g.beginPath(); g.roundRect(nx - 37, hy - 14, 74, 11, 3); g.fill(); g.stroke();
      g.fillStyle = '#c9cfd6'; for (const dx of [-24, -8, 8, 24]) { g.beginPath(); g.arc(nx + dx, hy - 8, 2.6, 0, TAU); g.fill(); }
    } else if (kind === 'pith') {                            // an archaeologist's pith helmet
      g.fillStyle = W.hatC || '#d8c9a0'; g.strokeStyle = P.ink; g.lineWidth = 4;
      g.beginPath(); g.ellipse(nx, hy - 20, 56, 11, 0, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(nx - 34, hy - 22); g.bezierCurveTo(nx - 34, hy - 68, nx + 34, hy - 68, nx + 34, hy - 22); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#8a7a5a'; g.fillRect(nx - 34, hy - 34, 68, 8); g.strokeRect(nx - 34, hy - 34, 68, 8);
      g.fillStyle = '#b8a97e'; g.beginPath(); g.arc(nx, hy - 58, 5, 0, TAU); g.fill(); g.stroke();
    } else if (kind === 'woolcap') {                         // a plain wool cap (what most Vikings could afford)
      g.fillStyle = W.hatC || '#6b5a48'; g.strokeStyle = P.ink; g.lineWidth = 4;
      g.beginPath(); g.moveTo(nx - 35, hy - 6); g.bezierCurveTo(nx - 38, hy - 56, nx + 30, hy - 66, nx + 36, hy - 8); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.roundRect(nx - 36, hy - 16, 72, 12, 4); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(nx - 22 + k * 11, hy - 20); g.lineTo(nx - 18 + k * 9, hy - 50); g.stroke(); }
    } else if (kind === 'ironhelm') {                        // a plain round iron helmet with a spectacle guard (as at Gjermundbu)
      g.fillStyle = '#7d8894'; g.strokeStyle = P.ink; g.lineWidth = 4;
      g.beginPath(); g.arc(nx, hy - 2, 36, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#5d6774'; g.lineWidth = 6; g.beginPath(); g.moveTo(nx, hy - 38); g.lineTo(nx, hy - 4); g.stroke();
      g.strokeStyle = '#5d6774'; g.lineWidth = 5; for (const d of [-1, 1]) { g.beginPath(); g.arc(nx + d * 11, hy - 2, 10, 0, TAU); g.stroke(); }
      g.lineWidth = 7; g.beginPath(); g.moveTo(nx, hy - 6); g.lineTo(nx, hy + 10); g.stroke();
    } else if (kind === 'driver') {                          // a leather motoring cap with goggles pushed up on it
      g.fillStyle = W.hatC || '#6b4426';
      g.beginPath(); g.arc(nx, hy - 2, 36, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(nx + 36, hy + 10); g.quadraticCurveTo(nx + 30, hy + 4, nx + 28, hy - 6); g.lineTo(nx - 28, hy - 6); g.quadraticCurveTo(nx - 30, hy + 4, nx - 36, hy + 10); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#3a2414'; g.lineWidth = 5; g.beginPath(); g.moveTo(nx - 34, hy - 18); g.lineTo(nx + 34, hy - 18); g.stroke();
      for (const d of [-1, 1]) { g.fillStyle = '#b9d6e2'; g.strokeStyle = P.ink; g.lineWidth = 4; g.beginPath(); g.arc(nx + d * 13, hy - 20, 10, 0, TAU); g.fill(); g.stroke();
        g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.arc(nx + d * 13, hy - 20, 6, Math.PI * 1.1, Math.PI * 1.5); g.stroke(); }
    }
  }
  function shades(g, nx, hy, look) {                         // dark glasses: the inspector's disguise
    g.fillStyle = '#1b1d22'; g.strokeStyle = P.ink; g.lineWidth = 3;
    for (const d of [-1, 1]) { g.beginPath(); g.roundRect(nx + d * 12 - 11 + look[0] * 2, hy - 9, 22, 14, 5); g.fill(); g.stroke(); }
    g.beginPath(); g.moveTo(nx - 2, hy - 4); g.lineTo(nx + 2, hy - 4); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(nx + d * 12 - 6, hy - 6); g.lineTo(nx + d * 12 - 1, hy - 6); g.stroke(); }
  }

  // ------------------------------------------------------------------ the rig
  function draw(g, o = {}) {
    const t = o.t ?? 0, mood = o.mood || 'neutral', F = FACE[mood] || FACE.neutral, W = outfitOf(o.outfit);
    const s = o.s ?? 1, walk = o.walk, drill = Math.max(0, Math.min(1, o.drill ?? 0)), palm = o.palm ?? 0;
    const bob = walk != null ? -Math.abs(Math.sin(walk)) * 7 : 0;
    const sq = (o.squash ?? 0) + 0.012 * Math.sin(t * 2.1 + (o.seed ?? 0));
    g.save(); g.globalAlpha *= o.alpha ?? 1;
    g.translate(o.x ?? 0, (o.y ?? 0) + bob * s); g.scale(s * (o.flip ? -1 : 1), s); g.rotate(o.lean ?? 0); g.scale(1 + sq * 0.5, 1 - sq);
    const cv = o.curve ?? 0, nx = cv * 26, hy = -232, sx = nx * 0.82, sy = -180;
    const suit = W.suit || P.line, legC = W.legs || suit, headC = W.head || P.line;
    if (W.cape) cape(g, W.cape, t, nx, sx);
    // legs (the mark's roots): standing, posed, marching, or twisted into a drill
    for (const d of [-1, 1]) {
      let k = [d * 30, -44], f = [d * 36, -8];
      const ov = d < 0 ? o.legL : o.legR;
      if (ov) { k = ov.k; f = ov.f; }
      else if (walk != null) { const lift = Math.max(0, Math.sin(walk) * -d) * 22; k = [d * (30 + lift * 0.3), -44 - lift * 0.8]; f = [d * 36, -8 - lift]; }
      if (drill > 0) { k = [k[0] * (1 - drill) + d * 9 * drill, k[1] * (1 - drill) - 42 * drill]; f = [f[0] * (1 - drill) + d * 3 * drill, f[1] * (1 - drill) - 12 * drill]; }
      const p = [[d * 6, -76], k, f];
      tube(g, p, 12, legC);
      if (W.boots) { const q = [mid(p, 0.62), mid(p, 0.82), f]; g.lineCap = 'round'; path3(g, q); g.lineWidth = 12; g.strokeStyle = W.boots; g.stroke(); }
      if (drill < 0.5) { g.strokeStyle = P.ink; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(f[0], f[1]); g.lineTo(f[0] + d * 14, f[1] + 7); g.moveTo(f[0], f[1]); g.lineTo(f[0] - d * 6, f[1] + 8); g.stroke(); }
    }
    if (drill > 0.01) {                                      // three root strands spinning into a point
      const len = 70 * drill, sp = t * 22;
      for (let i = 0; i < 3; i++) {
        const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8, r = 16 * (1 - u) * drill; pts.push([Math.sin(sp + i * TAU / 3 + u * 5) * r, -20 + u * len]); }
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (const [lw, c] of [[11, P.ink], [5, legC]]) { g.lineWidth = lw; g.strokeStyle = c; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
      }
    }
    // the spine (the stem), the emblem, a tie
    tube(g, [[0, -80], [cv * 34, -140], [nx, -200]], 16, suit, 5);
    const cx = cv * 22, cy = -150;
    if (W.emblem === 'dot' || W.emblem === 'core') {
      if (W.emblem === 'core') { const gr = g.createRadialGradient(cx, cy, 2, cx, cy, 30); gr.addColorStop(0, 'rgba(255,170,80,0.85)'); gr.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gr; g.fillRect(cx - 30, cy - 30, 60, 60); }
      g.fillStyle = W.emblem === 'core' ? '#ffe2b8' : '#ffffff'; g.beginPath(); g.arc(cx, cy, 13, 0, TAU); g.fill(); g.lineWidth = 3.5; g.strokeStyle = P.ink; g.stroke();
      g.fillStyle = P.dot; g.beginPath(); g.arc(cx, cy, 7.5, 0, TAU); g.fill();
    } else if (W.emblem === 'necklace') { g.strokeStyle = '#c9c4d8'; g.lineWidth = 4; g.beginPath(); g.arc(nx, -204, 16, 0.4, Math.PI - 0.4); g.stroke(); }
    if (W.coat) coat(g, W.coat, nx, cv);
    if (W.tie) necktie(g, nx * 0.9, -196, 0.75, W.tie);
    if (W.scarf && !W.scarf.long) scarf(g, W.scarf, nx, t);
    // arms, ending in leaf hands (or gloves)
    const handC = W.gloves || P.leaf;
    const hand = (p) => { const [ex, ey] = p[1], [hx, hy2] = p[2], a = Math.atan2(hy2 - ey, hx - ex) + Math.PI / 2; leaf(g, hx, hy2, a, 22, 15, handC, 3.5); };
    if (palm < 0.01) {
      let pl, pr;
      if (o.armL === 'cross' || o.armR === 'cross') { pl = [[sx - 4, sy], [sx - 40, sy + 40], [sx + 22, sy + 52]]; pr = [[sx + 4, sy], [sx + 40, sy + 42], [sx - 20, sy + 60]]; }
      else { pl = armPts(o.armL, sx - 4, sy, -1, [0.42, 0.3], 42, 38); pr = armPts(o.armR, sx + 4, sy, 1, [0.42, 0.3], 42, 38); }
      if (walk != null && !o.armL && !o.armR) { const sw = 0.5 * Math.sin(walk); pl = limb(sx - 4, sy, -1, 0.35 + sw, 0.3, 42, 38); pr = limb(sx + 4, sy, 1, 0.35 - sw, 0.3, 42, 38); }
      tube(g, pl, 11, suit, 4); hand(pl); tube(g, pr, 11, suit, 4); hand(pr);
      if (o.propL) { g.save(); g.translate(pl[2][0], pl[2][1]); o.propL(g); g.restore(); }
      if (o.prop) { g.save(); g.translate(pr[2][0], pr[2][1]); o.prop(g); g.restore(); }
    }
    // the head: a stem, the two leaves of the mark, the round node
    const sway = 0.05 * Math.sin(t * 1.6 + 5);
    const lt = W.hat && HAT_TOP[W.hat] != null ? HAT_TOP[W.hat] : null;
    if (o.leaves !== false && lt == null) {
      g.lineCap = 'round'; g.strokeStyle = P.ink; g.lineWidth = 12; g.beginPath(); g.moveTo(nx, hy - 26); g.lineTo(nx, hy - 40); g.stroke(); g.strokeStyle = P.line; g.lineWidth = 5; g.stroke();
      leaf(g, nx, hy - 38, -0.72 + sway + (o.leafL ?? 0), 64, 46, P.leaf, 4.5, P.vein); leaf(g, nx + 1, hy - 36, 0.64 + sway * 0.8 + (o.leafR ?? 0), 50, 38, P.leaf, 4.5, P.vein);
    }
    if (W.mask && W.mask.type === 'ears') {
      g.fillStyle = W.mask.c; g.strokeStyle = P.ink; g.lineWidth = 4; g.lineJoin = 'round';
      for (const d of [-1, 1]) { g.beginPath(); g.moveTo(nx + d * 14, hy - 28); g.lineTo(nx + d * 24, hy - 50); g.lineTo(nx + d * 30, hy - 20); g.closePath(); g.fill(); g.stroke(); }
    }
    g.fillStyle = headC; g.beginPath(); g.arc(nx, hy, 34, 0, TAU); g.fill(); g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke();
    // the face (under any mask)
    const blink = Math.min(1, (o.blink ?? 0) + idleBlink(t, o.seed ?? 0)), look = o.look || [0, 0], er = 4.8 * F[3];
    const dark = headC !== P.line, eyeC = dark ? '#f3eee4' : P.ink;
    const M = W.mask && W.mask.type;
    if (M === 'domino') {
      g.fillStyle = W.mask.c; g.strokeStyle = P.ink; g.lineWidth = 3.5; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(nx - 31, hy - 10); g.quadraticCurveTo(nx, hy - 18, nx + 31, hy - 10); g.lineTo(nx + 36, hy - 15); g.lineTo(nx + 30, hy + 6); g.quadraticCurveTo(nx, hy + 9, nx - 30, hy + 6); g.lineTo(nx - 36, hy - 15); g.closePath(); g.fill(); g.stroke();
    }
    if (M === 'web') {                                       // a web mask: lines over the head, two big white eyes
      g.save(); g.beginPath(); g.arc(nx, hy, 33, 0, TAU); g.clip(); g.strokeStyle = 'rgba(20,10,10,0.55)'; g.lineWidth = 2.2;
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(nx, hy); g.lineTo(nx + Math.cos(a) * 40, hy + Math.sin(a) * 40); g.stroke(); }
      for (const r of [12, 24]) { g.beginPath(); g.arc(nx, hy, r, 0, TAU); g.stroke(); }
      g.restore(); g.fillStyle = '#ffffff'; g.strokeStyle = P.ink; g.lineWidth = 3;
      for (const d of [-1, 1]) { g.beginPath(); g.ellipse(nx + d * 13 + look[0] * 3, hy - 4 + look[1] * 2, 9, 12, d * 0.5, 0, TAU); g.fill(); g.stroke(); }
    } else if (M === 'plate') {
      g.fillStyle = W.mask.c; g.strokeStyle = P.ink; g.lineWidth = 3.5; g.beginPath(); g.roundRect(nx - 24, hy - 16, 48, 44, [8, 8, 16, 16]); g.fill(); g.stroke();
      g.fillStyle = '#fff6e0'; for (const d of [-1, 1]) { g.beginPath(); g.roundRect(nx + d * 11 - 7 + look[0] * 3, hy - 6 + look[1] * 2, 14, 5, 2); g.fill(); }
    } else {
      for (const d of [-1, 1]) {
        const ex = nx + d * 11 + look[0] * 5, ey = hy - 2 + look[1] * 4;
        if (M === 'domino') { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(nx + d * 12, hy - 2, 8.5, 6.5, 0, 0, TAU); g.fill(); }
        if (W.glasses === 'shades') { /* hidden behind the dark glasses */ }
        else if (blink > 0.6) { g.strokeStyle = eyeC; g.lineWidth = 3.5; g.beginPath(); g.moveTo(ex - 5, ey); g.lineTo(ex + 5, ey); g.stroke(); }
        else { g.fillStyle = M === 'domino' ? P.ink : eyeC; g.beginPath(); g.arc(ex, ey, M === 'domino' ? Math.min(er, 4.2) : er, 0, TAU); g.fill(); }
        const b = d < 0 ? F[0] : F[1];
        if (b && M !== 'domino') { g.save(); if (dark) g.strokeStyle = eyeC; brow(g, nx + d * 11, hy - 14, d, b[0], b[1], 14, 3.5); g.restore(); }
        if (b && M === 'domino') brow(g, nx + d * 13, hy - 20, d, b[0] * 0.8, b[1] * 0.8, 16, 4);
      }
      g.save(); if (dark) { g.strokeStyle = eyeC; } mouth(g, o.mouth || F[2], nx + 2 + look[0] * 3, hy + 15, 14); g.restore();
      if (W.glasses === 'shades') shades(g, nx, hy, look);
    }
    if (W.scarf && W.scarf.long) scarf(g, W.scarf, nx, t);
    if (W.beard) {                                           // a braided beard under the mouth
      g.fillStyle = W.beard; g.strokeStyle = P.ink; g.lineWidth = 3.5; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(nx - 26, hy + 12); g.quadraticCurveTo(nx - 30, hy + 44, nx - 6, hy + 52); g.lineTo(nx, hy + 74); g.lineTo(nx + 6, hy + 52); g.quadraticCurveTo(nx + 30, hy + 44, nx + 26, hy + 12); g.quadraticCurveTo(nx, hy + 26, nx - 26, hy + 12); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2.5; for (const yy of [56, 64]) { g.beginPath(); g.moveTo(nx - 4, hy + yy); g.lineTo(nx + 4, hy + yy + 3); g.stroke(); }
      g.save(); if (headC !== P.line) { g.strokeStyle = '#f3eee4'; } mouth(g, o.mouth || F[2], nx + 2 + look[0] * 3, hy + 15, 14); g.restore();
    }
    if (lt != null) {                                        // a hat, and the leaves growing out of its top
      hat(g, W, nx, hy);
      if (o.leaves !== false) {
        g.lineCap = 'round'; g.strokeStyle = P.ink; g.lineWidth = 12; g.beginPath(); g.moveTo(nx, hy + lt + 10); g.lineTo(nx, hy + lt - 4); g.stroke(); g.strokeStyle = P.line; g.lineWidth = 5; g.stroke();
        leaf(g, nx, hy + lt - 2, -0.72 + sway + (o.leafL ?? 0), 64, 46, P.leaf, 4.5, P.vein); leaf(g, nx + 1, hy + lt, 0.64 + sway * 0.8 + (o.leafR ?? 0), 50, 38, P.leaf, 4.5, P.vein);
      }
    }
    if (W.hat === 'wings') {                                 // a round helmet with two little wings
      g.fillStyle = '#9aa6b2'; g.strokeStyle = P.ink; g.lineWidth = 4; g.beginPath(); g.arc(nx, hy - 6, 35, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill(); g.stroke();
      for (const d of [-1, 1]) {                             // a wing: three feathers swept up and out
        g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(nx + d * 30, hy - 16);
        g.quadraticCurveTo(nx + d * 52, hy - 30, nx + d * 66, hy - 62); g.quadraticCurveTo(nx + d * 56, hy - 50, nx + d * 50, hy - 50);
        g.quadraticCurveTo(nx + d * 58, hy - 38, nx + d * 60, hy - 30); g.quadraticCurveTo(nx + d * 48, hy - 30, nx + d * 44, hy - 28);
        g.quadraticCurveTo(nx + d * 50, hy - 20, nx + d * 50, hy - 14); g.quadraticCurveTo(nx + d * 40, hy - 12, nx + d * 30, hy - 16); g.closePath(); g.fill(); g.stroke();
      }
    }
    // hands over the eyes
    if (palm >= 0.01) {
      for (const d of [-1, 1]) {
        const rest = limb(sx + d * 4, sy, d, 0.42, 0.3, 42, 38);
        const hx = rest[2][0] + (nx + d * 20 - rest[2][0]) * palm, hy2 = rest[2][1] + (hy - 2 - rest[2][1]) * palm;
        const p = [[sx + d * 4, sy], [sx + d * (40 + 6 * palm), sy - 10 * palm + 30 * (1 - palm)], [hx, hy2]];
        tube(g, p, 11, suit, 4);
        g.save(); g.translate(hx, hy2); g.rotate(-d * (Math.PI / 2 + 0.15) * palm + (1 - palm) * (Math.PI - d * 0.7)); leafShape(g, 22 + 14 * palm, 15 + 9 * palm); g.fillStyle = handC; g.fill(); g.lineWidth = 3.5; g.strokeStyle = P.ink; g.stroke(); g.restore();
      }
    }
    g.restore();
  }

  // ------------------------------------------------------------------ props (drawn in a hand's space)
  const props = {
    shield(g) {                                              // a round wooden shield, painted, with an iron boss
      g.save(); g.translate(-6, 6); g.fillStyle = '#c8a46a'; g.strokeStyle = P.ink; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 50, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#b5322a'; for (let k = 0; k < 4; k += 2) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 48, k * Math.PI / 2, (k + 1) * Math.PI / 2); g.closePath(); g.fill(); }
      g.strokeStyle = '#7a5a3a'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(Math.cos(a) * 14, Math.sin(a) * 14); g.lineTo(Math.cos(a) * 48, Math.sin(a) * 48); g.stroke(); }
      g.fillStyle = '#8a96a4'; g.strokeStyle = P.ink; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fill(); g.stroke(); g.restore();
    },
    brush(g) {                                               // an archaeologist's brush
      g.save(); g.rotate(-0.7); g.lineCap = 'round'; g.lineWidth = 9; g.strokeStyle = P.ink; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -40); g.stroke(); g.lineWidth = 5; g.strokeStyle = '#a8764a'; g.stroke();
      g.fillStyle = '#e8d9b0'; g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.roundRect(-9, -64, 18, 26, 4); g.fill(); g.stroke(); g.restore();
    },
    trowel(g) {
      g.save(); g.rotate(-0.5); g.lineCap = 'round'; g.lineJoin = 'round';
      g.lineWidth = 11; g.strokeStyle = P.ink; g.beginPath(); g.moveTo(0, -14); g.lineTo(0, 16); g.stroke(); g.lineWidth = 6; g.strokeStyle = '#c98a4a'; g.stroke();
      g.fillStyle = '#9aa6ae'; g.strokeStyle = P.ink; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-12, 18); g.lineTo(12, 18); g.quadraticCurveTo(14, 44, 0, 62); g.quadraticCurveTo(-14, 44, -12, 18); g.closePath(); g.fill(); g.stroke(); g.restore();
    },
    operaGlasses(g) {                                        // a lorgnette for the opera
      g.save(); g.rotate(0.3); g.strokeStyle = P.ink; g.lineWidth = 4; g.fillStyle = '#c9a54a';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -34); g.stroke();
      for (const d of [-1, 1]) { g.beginPath(); g.arc(d * 13, -44, 11, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#bfe0ee'; g.beginPath(); g.arc(d * 13, -44, 6, 0, TAU); g.fill(); g.fillStyle = '#c9a54a'; }
      g.restore();
    },
    notebook(g) {                                            // the inspector's little notebook and pencil
      g.save(); g.rotate(-0.2); g.fillStyle = '#f4efe2'; g.strokeStyle = P.ink; g.lineWidth = 3.5; g.beginPath(); g.roundRect(-16, -40, 34, 44, 3); g.fill(); g.stroke();
      g.strokeStyle = '#9aa4ae'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-10, -30 + k * 9); g.lineTo(12, -30 + k * 9); g.stroke(); }
      g.restore();
    },
    guide(g) {                                               // a red guide book (ours: no logo)
      g.save(); g.rotate(-0.15); g.fillStyle = '#c0392b'; g.strokeStyle = P.ink; g.lineWidth = 4; g.beginPath(); g.roundRect(-24, -64, 48, 66, 4); g.fill(); g.stroke();
      g.fillStyle = '#f3d9a0'; g.fillRect(-14, -50, 28, 4); g.fillRect(-14, -42, 20, 3); g.restore();
    },
      hammer(g) {                                              // a short stone mallet (a nod, not anyone's hammer)
      g.save(); g.rotate(0.2); g.lineCap = 'round';
      g.lineWidth = 11; g.strokeStyle = P.ink; g.beginPath(); g.moveTo(0, 6); g.lineTo(0, -46); g.stroke(); g.lineWidth = 5; g.strokeStyle = '#8a5a36'; g.stroke();
      g.fillStyle = '#9aa6b2'; g.strokeStyle = P.ink; g.lineWidth = 4; g.beginPath(); g.roundRect(-24, -74, 48, 32, 5); g.fill(); g.stroke();
      g.restore();
    },
  };

  window.GLYPH = { draw, OUTFITS, FACE, P, props, leaf, leafShape };
})();
