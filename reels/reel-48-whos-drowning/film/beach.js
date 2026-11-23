// film/beach.js: reel 48's beach, made of paper and seen from straight above (a slight tilt towards the sea, so an
// upright body reads as a short shape below its head). The sea's surface is one translucent sheet: whatever is under
// the water is drawn before the sheet (softened, tinted, fading with depth), whatever is above it after (crisp, with a
// cast shadow). That is how a mouth at the waterline reads from above.
// BEACH.paint(g, t, opts) paints the whole world at time t. A pure function of t: every motion is a function of
// time and a seed, nothing is kept between frames.
(() => {
  const { W, H, clamp, lerp, mulberry32 } = C;
  const P = window.PAPER, { TAU, blob, limb, poly, strip, fill, grain } = P;

  // ------------------------------------------------------------------ palette (few colours, bright and clean)
  const COL = {
    dry: '#f1dcae', dry2: '#e8cd99', wet: '#d6b783', wetLine: '#c9a873',
    floorNear: '#ecd9a8', floorMid: '#d9c495', floorEdge: '#4f9aa3', deep: '#11587c', deepTop: '#0c4265',
    foam: '#fffdf6', shade: '#16304a', navy: '#1b2a44', ink: '#1b2a44',
    coral: '#ff5a47', yellow: '#ffc233', pink: '#ff8db0', green: '#2db36a', purple: '#7a5bd8', teal: '#159f9a',
    white: '#fffdf7', red: '#e5352a', orange: '#ff8a1f', sky: '#7fd6e8', straw: '#e9c46a', blue: '#3d7dd8',
  };
  const SKIN = ['#f4cfa8', '#e3ad7e', '#c88c5d', '#a06a45', '#6e452b'];
  const HAIR = ['#22160f', '#3b2416', '#121212', '#c28a3e', '#7a3418', '#6b6b6b'];

  // ------------------------------------------------------------------ the shore, seen from above (sea at the top)
  const shoreY = (x) => 1352 + 14 * Math.sin(x * 0.012 + 0.5) + 8 * Math.sin(x * 0.031 + 2.0);
  const edgeY = (x) => 744 + 24 * Math.sin(x * 0.009 + 1.3) + 9 * Math.sin(x * 0.027 + 0.4);   // the sandbar's edge
  // depth of the floor below the surface at (x, y), 0 at the waterline, 1 at the edge, 3 in the channel
  function depthAt(x, y) {
    const s = shoreY(x), e = edgeY(x);
    if (y >= s) return 0;
    if (y >= e) return clamp((s - y) / (s - e)) * 0.9 + 0.1;
    return 1 + clamp((e - y) / 40) * 2;
  }

  // ------------------------------------------------------------------ colour helpers
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
  // what a paper colour looks like under the sheet at depth d (tinted towards the water, fainter when deep)
  const WATER = '#2bb5bf', WATER_DEEP = '#0f5a80';
  function under(color, d) {
    const k = d <= 1 ? 0.28 + 0.18 * d : 0.5 + 0.12 * Math.min(2, d - 1);
    return mix(color, d <= 1 ? WATER : WATER_DEEP, k);
  }

  // ------------------------------------------------------------------ textures (built once, seeded)
  let TILE = null, TILE2 = null;
  function tiles() { if (!TILE) { TILE = P.fibreTile(256, 4801, 1.0); TILE2 = P.fibreTile(256, 4802, 0.6); } }

  // ------------------------------------------------------------------ motion helpers
  const sin = Math.sin, cos = Math.cos;
  const wave = (t, T, ph = 0) => sin(TAU * (t / T + ph));
  const tw = (t) => P.twos(t);                         // everything that moves is stepped on twos
  // the swell: crests travel from the top of the frame to the shore; lift(x, y, t) is 0..1 near a crest
  const SWELL = { T: 5.2, speed: 92, set: [12.6, 15.8] };   // a bigger set rolls through at about 13 s
  function crestY(i, t) { return 200 + ((t * SWELL.speed + i * SWELL.T * SWELL.speed) % (SWELL.T * SWELL.speed * 3)) - SWELL.T * SWELL.speed * 0.5; }
  let SETS = [[12.6, 15.8]];
  function lift(x, y, t) {
    let L = 0;
    for (let i = 0; i < 3; i++) {
      const cy = crestY(i, t) + 10 * sin(x * 0.01 + i);
      const d = (y - cy) / 70;
      L = Math.max(L, Math.exp(-d * d));
    }
    const setK = Math.max(0, ...SETS.map(([a, b]) => clamp((t - a) / 0.8) * clamp((b - t) / 1.2)));
    return L * (0.5 + 0.9 * setK);
  }

  // ------------------------------------------------------------------ the people
  // kind: what they're doing; x, y: the head's place (screen, world coordinates); rot: which way they face
  // (0 = towards the sea / top of frame, + clockwise)
  const PEOPLE = [
    { n: 9, kind: 'maya', x: 330, y: 692, skin: 2, hair: 1, suit: 'teal', T: 4.6, ph: 0.15 },
    { n: 2, kind: 'floater', x: 118, y: 486, skin: 0, hair: 3, suit: 'coral', rot: -1.62, T: 6.0, ph: 0.4 },
    { n: 1, kind: 'crawl', x: 700, y: 520, skin: 3, hair: 2, suit: 'navy', rot: -1.57, T: 1.5, ph: 0.0, style: 'cap', capC: '#e5352a' },
    { n: 3, kind: 'snorkel', x: 872, y: 612, skin: 1, hair: 0, suit: 'purple', rot: 0.15, T: 1.1, ph: 0.3 },
    { n: 7, kind: 'tread', x: 536, y: 650, skin: 4, hair: 2, suit: 'yellow', rot: 1.35, T: 2.4, ph: 0.2, style: 'cap', capC: '#ff8db0' },
    { n: 16, kind: 'tread', x: 708, y: 704, skin: 1, hair: 4, suit: 'coral', rot: -1.6, T: 2.7, ph: 0.65, style: 'curly' },
    { n: 4, kind: 'splash', x: 462, y: 824, skin: 1, hair: 0, suit: 'pink', rot: 1.2, T: 0.9, ph: 0.0, style: 'bun' },
    { n: 13, kind: 'splash', x: 606, y: 866, skin: 3, hair: 2, suit: 'yellow', rot: -1.9, T: 0.9, ph: 0.5, style: 'braids' },
    { n: 11, kind: 'waver', x: 838, y: 910, skin: 2, hair: 2, suit: 'navy', rot: -0.2, T: 0.8, ph: 0.0, style: 'bald' },
    { n: 14, kind: 'stander', x: 140, y: 936, skin: 4, hair: 2, suit: 'blue', rot: 3.0, T: 3.4, ph: 0.3, style: 'cap', capC: '#fbfbf6' },
    { n: 8, kind: 'breast', x: 664, y: 1012, skin: 0, hair: 4, suit: 'coral', rot: -0.15, T: 1.9, ph: 0.1, style: 'flowercap' },
    { n: 6, kind: 'flailer', x: 778, y: 1130, skin: 1, hair: 0, suit: 'yellow', rot: 0.1, T: 0.5, ph: 0.0 },
    { n: 15, kind: 'brother', x: 884, y: 1156, skin: 1, hair: 0, suit: 'teal', rot: -1.0, T: 1.3, ph: 0.4 },
    { n: 10, kind: 'ringkid', x: 332, y: 1160, skin: 3, hair: 2, suit: 'pink', rot: -2.0, T: 2.2, ph: 0.2 },
    { n: 5, kind: 'mum', x: 236, y: 1206, skin: 3, hair: 2, suit: 'purple', rot: 0.9, T: 2.6, ph: 0.7, style: 'glassesUp' },
    { n: 12, kind: 'wader', x: 548, y: 1232, skin: 0, hair: 5, suit: 'navy', rot: 0.0, T: 3.0, ph: 0.5 },
  ];
  PEOPLE.forEach((p, i) => { p.seed = 100 + i * 37; p.skinC = SKIN[p.skin]; p.hairC = HAIR[p.hair]; p.suitC = COL[p.suit]; });

  // Maya's breath cycle in the search: up (mouth out, one breath), then under. Irregular, never the same twice in a row.
  function mayaCycle(t) {
    const r = (k) => { const q = mulberry32(5000 + k); return q(); };
    let t0 = -1.2, k = 0;
    while (true) { const T = 3.6 + r(k) * 1.8; if (t < t0 + T) { const u = (t - t0) / T; return { u, k, T }; } t0 += T; k++; if (k > 200) return { u: 0, k, T: 4 }; }
  }
  function mayaState(t) {
    const { u } = mayaCycle(t);
    // 0.00–0.30 rising (arms press), 0.30–0.50 out (a breath), 0.50–0.80 sinking, 0.80–1.00 under (never long)
    let s;
    if (u < 0.3) s = Math.sin((u / 0.3) * Math.PI / 2);
    else if (u < 0.5) s = 1 - 0.12 * ((u - 0.3) / 0.2);
    else if (u < 0.8) s = 0.88 * (1 - (u - 0.5) / 0.3);
    else s = 0;
    const press = u < 0.34 ? Math.sin((u / 0.34) * Math.PI) : 0.25 * Math.max(0, Math.sin(((u - 0.34) / 0.66) * Math.PI * 3));
    return { s: clamp(s), press, u };
  }

  // the small rings a person leaves on the water: thin, growing and fading
  function ripples(g, x, y, rx, ry, t, period, seed, strength = 1) {
    for (let k = 0; k < 2; k++) {
      const u = ((t / period + k * 0.5 + (seed % 7) * 0.13) % 1);
      const a = (1 - u) * 0.5 * strength;
      if (a < 0.02) continue;
      g.save();
      g.globalAlpha = a; g.strokeStyle = COL.foam; g.lineWidth = 1.7;
      blob(g, x, y, rx * (1 + u * 0.9), ry * (1 + u * 0.9), 0, seed + k, 0.07, 0);
      g.stroke();
      g.restore();
    }
  }

  // idle life: where someone's looking drifts, now and then a glance; a weight shift; nobody frozen between moves
  const idleLook = (p, tt) => (p.rot || 0) + 0.32 * sin(tt * 0.37 + p.seed * 0.7) + 0.18 * sin(tt * 1.13 + p.seed * 1.3) * clamp(sin(tt * 0.21 + p.seed) * 3 - 1.5);
  const idleSway = (p, tt) => 2.2 * sin(tt * 0.53 + p.seed * 0.9);
  // a turn the short way round. Seen from above, a face tipped up reads upright only when it faces the shore
  // (down the frame): faces that show their features turn through the shore side, never through the sea side
  const turnTo = (a, b, k) => a + (((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI) * k;
  const ez = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };              // minimum jerk
  const rampT = (t, a, b) => ez((t - a) / (b - a));
  const envT = (t, a0, a1, b0, b1) => rampT(t, a0, a1) * (1 - rampT(t, b0, b1));
  // a move with anticipation and overshoot: 0 -> 1, dipping a little before and passing 1 before it settles
  function snap(t, t0, dur = 0.32) {
    const u = (t - t0) / dur;
    if (u <= -0.35) return 0;
    if (u < 0) return -0.12 * Math.sin((u / -0.35) * Math.PI);                 // the wind-up
    if (u < 1) return ez(u) * 1.12;
    return 1 + 0.12 * Math.exp(-(u - 1) * 4) * Math.cos((u - 1) * 7);          // past the mark, settling
  }

  // ------------------------------------------------------------------ puppet parts: cut paper, pinned at the joints
  // a paper fastener at a joint (it shows in the close shots: these are paper puppets)
  function pin(g, x, y, r = 2.1) {
    g.save();
    g.beginPath(); g.arc(x + 0.5, y + 0.7, r, 0, TAU); g.fillStyle = 'rgba(20, 30, 40, 0.35)'; g.fill();
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = '#c8a24e'; g.fill();
    g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.42, 0, TAU); g.fillStyle = 'rgba(255, 246, 214, 0.9)'; g.fill();
    g.restore();
  }
  // a two-piece limb from the root (sx, sy) to the end (hx, hy): upper piece, lower piece, hand or foot, the joint
  // bending to the outside (away from ox, oy). Under the water it's tinted; above it's lifted paper with a pin.
  function arm2(g, sx, sy, hx, hy, o) {
    const L1 = o.L1 ?? 25, L2 = o.L2 ?? 27;
    const dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 1e-6;
    const dm = clamp(d, Math.abs(L1 - L2) + 2, (L1 + L2) * 0.985);
    const a = Math.atan2(dy, dx);
    const A = Math.acos(clamp((L1 * L1 + dm * dm - L2 * L2) / (2 * L1 * dm), -1, 1));
    const e1 = [sx + Math.cos(a + A) * L1, sy + Math.sin(a + A) * L1], e2 = [sx + Math.cos(a - A) * L1, sy + Math.sin(a - A) * L1];
    const ox = o.ox ?? sx, oy = o.oy ?? sy;
    const J = (o.inside ? -1 : 1) * (Math.hypot(e1[0] - ox, e1[1] - oy) - Math.hypot(e2[0] - ox, e2[1] - oy)) >= 0 ? e1 : e2;
    const ex = sx + Math.cos(a) * dm, ey = sy + Math.sin(a) * dm;
    const r1 = o.r1 ?? 7, r2 = o.r2 ?? 6;
    const paint = (k = 0) => {
      if (o.under) { g.save(); g.globalAlpha *= o.alpha ?? 0.9; g.fillStyle = o.color; g.fill(); g.restore(); }
      else fill(g, k ? mix(o.color, '#000000', 0.06) : o.color, { lift: o.lift ?? 3 });
    };
    limb(g, sx, sy, J[0], J[1], r1, r1 * 0.92, o.seed); paint();
    limb(g, J[0], J[1], ex, ey, r1 * 0.88, r2, o.seed + 1); paint(1);
    if (o.hand !== false) { blob(g, ex + Math.cos(a) * r2 * 0.5, ey + Math.sin(a) * r2 * 0.5, r2 * 1.2, r2 * 1.05, a, o.seed + 2, 0.12); paint(); }
    if (!o.under && o.pins !== false) pin(g, J[0], J[1], o.pinR ?? 2.0);
    return { ex, ey, jx: J[0], jy: J[1] };
  }
  // a torso hung below the shoulders, turned to face f (0 = towards the sea): shoulders sw wide, hips hw, len long
  function torso(g, x, y, f, sw, hw, len, seed) {
    const c = Math.cos(f), s = Math.sin(f);
    const p1 = [x - c * sw / 2, y - s * sw / 2 * 0.5], p2 = [x + c * sw / 2, y + s * sw / 2 * 0.5];
    const p3 = [x + c * hw / 2, y + len + s * hw / 2 * 0.5], p4 = [x - c * hw / 2, y + len - s * hw / 2 * 0.5];
    poly(g, [p1, p2, [lerp(p2[0], p3[0], 0.55) + c * 2, lerp(p2[1], p3[1], 0.55)], p3, p4, [lerp(p4[0], p1[0], 0.45) - c * 2, lerp(p4[1], p1[1], 0.45)]], seed, 1.0);
    return { L: p1, R: p2 };
  }
  const shoulders = (x, y, f, w = 20) => [[x - Math.cos(f) * w, y - Math.sin(f) * w * 0.5], [x + Math.cos(f) * w, y + Math.sin(f) * w * 0.5]];

  // a head from above. look: where the face points (0 = up the screen, + clockwise). tilt: 0 level (the crown, a sliver
  // of face on the look side), 1 tipped right back (the whole face to the sky, chin towards `look`). The face slides in
  // smoothly between: no drawing swaps. expr: blank, strain, laugh, shout, smile, calm, cough.
  function head3(g, x, y, r, p, look, tilt, o = {}) {
    const st = o.style ?? p.style, Lf = o.lift ?? 3, t = clamp(tilt);
    const lx = Math.sin(look), ly = -Math.cos(look), px = -ly, py = lx;
    const capped = st === 'cap' || st === 'flowercap';
    const skin = o.skin || (st === 'bald' ? mix(p.skinC, '#ff6f61', 0.3) : p.skinC);
    const hairC = o.hairColor || (st === 'cap' ? (p.capC || COL.pink) : st === 'flowercap' ? '#fbfbf6' : p.hairC);
    g.save();
    blob(g, x, y, r, r * 1.04, 0, p.seed + 1, 0.04);
    fill(g, skin, { lift: Lf, shadow: o.shadow, rim: o.rim });
    g.save();
    blob(g, x, y, r, r * 1.04, 0, p.seed + 1, 0.04); g.clip();
    if (st === 'bald') {                                          // a sunburnt crown with a shine
      const b = r * 0.45 * (1 - t);
      blob(g, x - lx * b - r * 0.2, y - ly * b - r * 0.25, r * 0.3, r * 0.18, -0.6, p.seed + 4, 0.1); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill();
    } else {
      // hair (or a cap) over the back of the head; it slides back as the head tips up, leaving a hairline at the brow
      const back = r * (0.42 + 0.66 * t) * (capped ? 0.8 : 1);
      blob(g, x - lx * back, y - ly * back, r * (capped ? 1.14 : 1.1), r * (capped ? 1.06 : 1.02), look, p.seed + 2, st === 'curly' ? 0.2 : 0.08);
      g.fillStyle = hairC; g.fill();
      if (st === 'curly') for (let i = 0; i < 9; i++) {
        const a = look + Math.PI + (i - 4) * 0.42, R2 = r * (0.95 - 0.1 * t);
        blob(g, x + Math.sin(a) * R2 - lx * r * 0.5 * t, y - Math.cos(a) * R2 - ly * r * 0.5 * t, r * 0.3, r * 0.3, 0, p.seed + 50 + i, 0.1);
        g.fillStyle = hairC; g.fill();
      }
      if (st === 'flowercap') for (let i = 0; i < 3; i++) {
        const a = (i * TAU) / 3 + 0.5, fx = x - lx * r * 0.5 * t + Math.cos(a) * r * 0.4, fy = y - ly * r * 0.5 * t + Math.sin(a) * r * 0.4;
        blob(g, fx, fy, r * 0.4, r * 0.4, a, p.seed + 80 + i, 0.22); g.fillStyle = COL.pink; g.fill();
        blob(g, fx, fy, r * 0.13, r * 0.13, 0, p.seed + 85 + i, 0.1); g.fillStyle = COL.yellow; g.fill();
      }
    }
    // the face: its centre slides from the edge (level) to the middle (tipped back); features foreshorten along the look
    const fore = 0.18 + 0.82 * t;
    const fc = [x + lx * r * 0.86 * (1 - t), y + ly * r * 0.86 * (1 - t)];
    const F = (u, v) => [fc[0] + lx * u * r * fore + px * v * r, fc[1] + ly * u * r * fore + py * v * r];
    const ink = o.ink || mix(skin, '#1b1410', 0.72);
    const a = clamp((t - 0.1) / 0.3);
    // the nose: always there on the face side
    { const [nx, ny] = F(0.12, 0); blob(g, nx, ny, r * 0.15, r * 0.13 * (0.6 + 0.4 * fore), look, p.seed + 3, 0.1); g.fillStyle = mix(skin, '#000000', 0.1); g.fill(); }
    if (a > 0.01) {
      g.globalAlpha *= a;
      const ex = o.expr || 'blank';
      g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round'; g.lineWidth = Math.max(1.5, r * 0.085);
      const eyes = [F(-0.16, -0.36), F(-0.16, 0.36)];
      const path = (pts) => { g.beginPath(); pts.forEach(([X, Y], i) => (i ? g.lineTo(X, Y) : g.moveTo(X, Y))); };
      const arcPts = (u0, v0, w, h, up, n = 7) => Array.from({ length: n }, (_, i) => { const k = i / (n - 1); return F(u0 - (up ? 1 : -1) * h * Math.sin(k * Math.PI), v0 - w / 2 + w * k); });
      if (o.glasses) {
        for (const [X, Y] of eyes) { g.beginPath(); g.ellipse(X, Y, r * 0.3, r * 0.22 * fore + 0.5, look, 0, TAU); g.fillStyle = COL.navy; g.fill(); }
        path([eyes[0], eyes[1]]); g.strokeStyle = COL.navy; g.stroke(); g.strokeStyle = ink; g.fillStyle = ink;
      } else if (ex === 'laugh') {                                     // squeezed happy eyes
        for (const v of [-0.36, 0.36]) { path(arcPts(-0.12, v, 0.28, 0.09, true)); g.stroke(); }
      } else if (ex === 'calm') {
        for (const v of [-0.36, 0.36]) { path(arcPts(-0.18, v, 0.26, 0.06, false)); g.stroke(); }
      } else if (ex === 'cough') {
        for (const s2 of [-1, 1]) { const v = 0.36 * s2; path([F(-0.24, v - 0.12 * s2), F(-0.16, v + 0.04 * s2), F(-0.08, v - 0.12 * s2)]); g.stroke(); }
      } else if (ex === 'strain') {                                    // under the water: eyes open, straining
        for (const [X, Y] of eyes) { g.beginPath(); g.arc(X, Y, r * 0.15, 0, TAU); g.fillStyle = mix(o.skin || skin, '#ffffff', 0.55); g.fill(); g.beginPath(); g.arc(X, Y, r * 0.075, 0, TAU); g.fillStyle = ink; g.fill(); }
        for (const s2 of [-1, 1]) { path(arcPts(-0.42, 0.36 * s2, 0.26, 0.05, s2 < 0)); g.stroke(); }
      } else {                                                         // open eyes: dots
        for (const [X, Y] of eyes) { g.beginPath(); g.arc(X, Y, r * (ex === 'shout' ? 0.1 : 0.085), 0, TAU); g.fill(); }
        if (ex === 'shout') for (const s2 of [-1, 1]) { path(arcPts(-0.42, 0.36 * s2, 0.28, 0.07, true)); g.stroke(); }
      }
      // the mouth
      g.fillStyle = '#5a1f1a';
      if (ex === 'laugh') {                                            // a wide open grin, round side to the chin
        const pts = [F(0.36, -0.3)]; for (let i = 0; i <= 8; i++) { const k = i / 8; pts.push(F(0.36 + 0.26 * Math.sin(k * Math.PI), -0.3 + 0.6 * k)); }
        path(pts); g.closePath(); g.fill();
        const tg = []; for (let i = 0; i <= 6; i++) { const k = i / 6; tg.push(F(0.5 + 0.1 * Math.sin(k * Math.PI), -0.14 + 0.28 * k)); }
        path(tg); g.closePath(); g.fillStyle = '#e0707a'; g.fill();
        g.globalAlpha *= 0.35; g.fillStyle = '#ff7a6b';
        for (const v of [-0.52, 0.52]) { const [X, Y] = F(0.2, v); g.beginPath(); g.arc(X, Y, r * 0.15, 0, TAU); g.fill(); }
      } else if (ex === 'shout') { const [X, Y] = F(0.46, 0); g.beginPath(); g.ellipse(X, Y, r * 0.17, r * 0.26 * fore + 0.5, look, 0, TAU); g.fill(); }
      else if (ex === 'cough') { const [X, Y] = F(0.46, 0); g.beginPath(); g.ellipse(X, Y, r * 0.16, r * 0.16 * fore + 0.5, look, 0, TAU); g.fill(); }
      else if (ex === 'smile' || ex === 'calm') { path(arcPts(0.4, 0, 0.36, 0.08, false)); g.strokeStyle = ink; g.stroke(); }
      else if (ex === 'strain') {                                      // lips pressed, cheeks puffed
        path([F(0.46, -0.12), F(0.46, 0.12)]); g.strokeStyle = ink; g.stroke();
        g.globalAlpha *= 0.3; g.fillStyle = mix(o.skin || skin, '#000000', 0.25);
        for (const v of [-0.4, 0.4]) { const [X, Y] = F(0.32, v); g.beginPath(); g.arc(X, Y, r * 0.17, 0, TAU); g.fill(); }
      } else {                                                         // blank: the mouth just open
        const m = o.mouth ?? 0.4; const [X, Y] = F(0.46, 0);
        if (m > 0.08) { g.beginPath(); g.ellipse(X, Y, r * (0.11 + 0.06 * m), r * (0.05 + 0.1 * m) * fore + 0.4, look, 0, TAU); g.fill(); }
        else { path([F(0.46, -0.1), F(0.46, 0.1)]); g.strokeStyle = ink; g.stroke(); }
      }
    }
    g.restore();
    // things on top of the head: a bun, braids, sunglasses pushed up (they turn with it)
    if (st === 'bun') { const b = r * (0.8 + 0.3 * t); blob(g, x - lx * b, y - ly * b, r * 0.46, r * 0.43, 0, p.seed + 60, 0.08); fill(g, hairC, { lift: Lf + 2 }); }
    if (st === 'braids') for (const s2 of [-1, 1]) {
      const b = r * (0.85 + 0.2 * t), bx = x - lx * b + px * s2 * r * 0.42, by = y - ly * b + py * s2 * r * 0.42;
      limb(g, bx, by, bx - lx * r * 1.1, by - ly * r * 1.1, r * 0.2, r * 0.13, p.seed + 70 + s2, 0.15); fill(g, hairC, { lift: Lf + 0.5 });
    }
    if (st === 'glassesUp') for (const s2 of [-1, 1]) {
      const b = r * 0.1 * (1 - t);
      blob(g, x - lx * b + px * s2 * r * 0.36, y - ly * b + py * s2 * r * 0.36, r * 0.3, r * 0.22, look, p.seed + 90 + s2, 0.06); fill(g, COL.navy, { lift: Lf + 1 });
    }
    g.restore();
  }

  // hair floating round a head that lies back in the water: a soft fan of tapering locks, drifting slowly
  function hairFan(g, x, y, r, color, tt, seed, alpha = 0.85, dir = -Math.PI / 2, curly = false) {
    for (let i = 0; i < 8; i++) {
      const a0 = dir + (i - 3.5) * 0.3;
      const L = r * (1.05 + 0.3 * sin(i * 2.3 + seed * 0.01 + 1)), w0 = r * (curly ? 0.5 : 0.44);
      const left = [], right = [];
      for (let k = 0; k <= 8; k++) {
        const u = k / 8;
        const a = a0 + (curly ? 0.9 : 0.5) * sin(u * (curly ? 5.5 : 2.6) + i * 1.7 + tt * 0.9) * u;
        const d = r * 0.75 + L * u;
        const cx2 = x + Math.cos(a) * d, cy2 = y - r * 0.15 * Math.sin(-dir) + Math.sin(a) * d;
        const w = w0 * (1 - 0.6 * u), nx = -Math.sin(a), ny = Math.cos(a);
        left.push([cx2 + nx * w, cy2 + ny * w]); right.push([cx2 - nx * w, cy2 - ny * w]);
      }
      g.beginPath();
      left.forEach(([px2, py2], k) => (k ? g.lineTo(px2, py2) : g.moveTo(px2, py2)));
      for (let k = right.length - 1; k >= 0; k--) g.lineTo(right[k][0], right[k][1]);
      g.closePath();
      fill(g, color, { lift: 0.5, rim: false, alpha });
    }
  }

  // ------------------------------------------------------------------ each person: two passes, 'under' and 'above'
  const DRAW = {};
  const MAYA_LOOK = Math.PI;                  // she faces the shore; her head is tipped back, face to the sky

  // Maya: upright, head back, face to the sky; the water line crosses her face and her mouth comes and goes at the
  // surface; arms out to her sides just under the surface, pressing down; no kick. The story can take over her breaths.
  DRAW.maya = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const ov = ctx && ctx.maya ? ctx.maya(tt) : null;
    const nat = mayaState(tt);
    const s = ov ? (ov.s ?? nat.s) : nat.s, press = ov ? (ov.press ?? nat.press) : nat.press;
    const held = ov && ov.held ? ov.held : 0, cough = ov && ov.cough ? ov.cough : 0;
    const x = p.x + 2 * sin(tt * 0.7) + (ov && ov.dx ? ov.dx / FIG : 0);
    const y = p.y + 3 * (1 - s) * (1 - held) + 2 * wave(tt, 3.1) + (ov && ov.dy ? ov.dy / FIG : 0) - 3 * cough;
    const r = 21, d = depthAt(x, y);
    const tilt = 1 - 0.25 * cough;
    // the water line across her face, in face units along the chin (+): +0.62 her mouth and nose out, +0.45 the water
    // at her mouth, -1.15 all under. Held up by the tube, the water drops to her shoulders.
    const wl = lerp(lerp(-1.15, 0.62, ez(s)), 1.4, held);
    const sp = 0.55 + 0.25 * press;
    const armT = (s2) => [lerp(x + s2 * (20 + 58 * sp), x + s2 * 24, held), lerp(y + 30 - 10 * press, y + 52, held)];
    if (pass === 'under') {
      g.save(); g.globalAlpha = 0.5; torso(g, x, y + 14, 0, 46, 36, 40, p.seed + 20); g.fillStyle = under(p.suitC, d + 0.6); g.fill(); g.restore();
      for (const s2 of [-1, 1]) {
        const [hx, hy] = armT(s2);
        arm2(g, x + s2 * 19, y + 17, hx, hy, { L1: 30, L2: 32, color: under(p.skinC, held > 0.5 ? 0.25 : 0.5), under: true, alpha: 0.95, seed: p.seed + 21 + s2 * 3, ox: x, oy: y + 50 });
      }
      hairFan(g, x, y, r, under(p.hairC, 0.45), tt, p.seed, 0.9);
      head3(g, x, y, r, p, MAYA_LOOK, tilt, { expr: s < 0.4 && held < 0.5 ? 'strain' : 'blank', mouth: 0.2, shadow: false,
        skin: under(p.skinC, 0.45), hairColor: under(p.hairC, 0.45), ink: under('#2a1810', 0.3), lift: 0, rim: false });
    } else {
      hairFan(g, x, y, r, mix(p.hairC, WATER_DEEP, 0.18), tt, p.seed, 0.78);
      // the part of her face above the water: everything on the brow side of the water line
      if (wl > -1.12) {
        const lx = Math.sin(MAYA_LOOK), ly = -Math.cos(MAYA_LOOK), px = -ly, py = lx;
        const cx = x + lx * wl * r, cy = y + ly * wl * r;
        g.save();
        g.beginPath(); g.moveTo(cx + px * 300, cy + py * 300); g.lineTo(cx - px * 300, cy - py * 300);
        g.lineTo(cx - px * 300 - lx * 300, cy - py * 300 - ly * 300); g.lineTo(cx + px * 300 - lx * 300, cy + py * 300 - ly * 300); g.closePath();
        g.clip();
        head3(g, x, y, r, p, MAYA_LOOK, tilt, { expr: cough > 0.3 ? 'cough' : 'blank', mouth: s > 0.7 ? 0.5 : 0.25, lift: 2 + 2 * held });
        g.restore();
        // the water's edge across her face (a chord of the head), a fine white line with a little wobble
        if (wl < 1.0) {
          const k = Math.sqrt(Math.max(0, 1 - wl * wl)) * r * 1.02;
          g.save(); g.globalAlpha = 0.85; g.strokeStyle = COL.foam; g.lineWidth = 1.8; g.lineCap = 'round';
          g.beginPath(); g.moveTo(cx - px * k, cy - py * k);
          g.quadraticCurveTo(cx + lx * 2.5 * sin(tt * 5), cy + ly * 2.5 + 1.5 * sin(tt * 4), cx + px * k, cy + py * k); g.stroke();
          g.restore();
        }
      }
      // when she's under, a few bubbles break the surface over her mouth
      if (s < 0.3 && held < 0.3) {
        for (let i = 0; i < 3; i++) {
          const u = ((tt * 1.6 + i * 0.37) % 1);
          g.save(); g.globalAlpha = 0.85 * (1 - u) * (1 - s / 0.3);
          g.strokeStyle = COL.foam; g.lineWidth = 1.4;
          g.beginPath(); g.arc(x + (i - 1) * 6 + 3 * sin(tt * 3 + i), y + r * 0.45 - u * 10, 2.2 + 2.5 * u, 0, TAU); g.stroke();
          g.restore();
        }
      }
      // a cough: water off her mouth
      if (cough > 0.05) {
        const lx = Math.sin(MAYA_LOOK), ly = -Math.cos(MAYA_LOOK);
        const mx = x + lx * 0.46 * r, my = y + ly * 0.46 * r;
        for (let i = 0; i < 6; i++) {
          const rr = mulberry32(p.seed * 17 + i);
          const a = Math.atan2(ly, lx) + (rr() - 0.5) * 1.4, dd = 8 + 22 * cough * (0.6 + rr() * 0.6);
          g.save(); g.globalAlpha = 0.9 * (1 - cough * 0.5);
          blob(g, mx + cos(a) * dd, my + sin(a) * dd, 2.4 + rr() * 2.2, 2 + rr() * 1.8, a, p.seed + 160 + i, 0.2); fill(g, COL.foam, { lift: 5 });
          g.restore();
        }
      }
      // her hands: held, they come up onto the tube; pressing, small splashes and rings at the surface
      for (const s2 of [-1, 1]) {
        const [hx, hy] = armT(s2);
        if (held > 0.45) { blob(g, hx, hy, 6.5, 6, 0, p.seed + 27 + s2, 0.1); fill(g, p.skinC, { lift: 4 }); }
        else {
          if (press > 0.5) {
            g.save(); g.globalAlpha = clamp((press - 0.5) * 2) * 0.55;
            for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.8 + s2 * 0.3; blob(g, hx + cos(a) * 8, hy + sin(a) * 7, 3.2, 2.4, a, p.seed + 60 + i, 0.2); fill(g, COL.foam, { lift: 1.2 }); }
            g.restore();
          }
          ripples(g, hx, hy, 9, 7, tt, 1.3, p.seed + 70 + s2, 0.7);
        }
      }
      ripples(g, x, y + 8, 26, 22, tt, 1.6, p.seed + 80, 0.8);
    }
    return { x, y, under: s < 0.02 && held < 0.5 };
  };

  // the floater: on her back, flat on the surface, arms and legs spread, sunglasses, relaxed (quiet, face up, and fine)
  DRAW.floater = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + 3 * sin(tt * 0.3), y = p.y + 2 * wave(tt, p.T, p.ph);
    const rot = p.rot + 0.06 * sin(tt * 0.25);
    const d = depthAt(x, y);
    g.save(); g.translate(x, y); g.rotate(rot);
    if (pass === 'under') {
      for (const s2 of [-1, 1]) {   // arms out (a hand sculling now and then), legs apart, just under
        const scull = 4 * sin(tt * 1.7 + s2);
        arm2(g, s2 * 20, 22, s2 * 60, 8 + scull, { L1: 26, L2: 26, color: under(p.skinC, Math.min(d, 1.2) * 0.5), under: true, seed: p.seed + 1 + s2 * 4, ox: 0, oy: 60 });
        arm2(g, s2 * 11, 86, s2 * 30, 150, { L1: 34, L2: 34, r1: 9, r2: 7, color: under(p.skinC, Math.min(d, 1.2) * 0.5), under: true, hand: true, seed: p.seed + 11 + s2 * 4, ox: 0, oy: 120, inside: true });
      }
    } else if (pass === 'above') {
      torso(g, 0, 18, 0, 50, 40, 70, p.seed + 5); fill(g, p.suitC, { lift: 2 });
      blob(g, 0, 50, 20, 10, 0, p.seed + 6, 0.08); fill(g, mix(p.suitC, '#ffffff', 0.25), { shadow: false });
      for (const s2 of [-1, 1]) { blob(g, s2 * 18, 148, 6, 8, 0, p.seed + 7 + s2, 0.1); fill(g, p.skinC, { lift: 1.5 }); }   // toes up
      hairFan(g, 0, 0, 20, mix(p.hairC, WATER, 0.1), tt, p.seed, 0.85);
      head3(g, 0, 0, 20, p, Math.PI, 1, { glasses: true, expr: 'calm', lift: 2 });
      ripples(g, 0, 70, 50, 100, tt, 2.6, p.seed + 9, 0.45);
    }
    g.restore();
    return { x, y };
  };

  // front crawl: a slow lap across the channel and back, breathing to the side every third stroke
  function crawlPath(p, tt) {
    const v = 14, tTurn = 16, dur = 1.8;
    if (tt < tTurn) return { x: p.x - v * tt, y: p.y, rot: -Math.PI / 2 };
    if (tt < tTurn + dur) { const u = (tt - tTurn) / dur, a = ez(u); return { x: p.x - v * tTurn - 18 * Math.sin(u * Math.PI), y: p.y - 26 * Math.sin(a * Math.PI / 2), rot: -Math.PI / 2 + Math.PI * a }; }
    return { x: p.x - v * tTurn + v * (tt - tTurn - dur), y: p.y - 26, rot: Math.PI / 2 };
  }
  DRAW.crawl = (g, p, t, pass) => {
    const tt = tw(t);
    const P2 = crawlPath(p, tt);
    const x = P2.x, y = P2.y + 2 * wave(tt, 2.3, 0.2);
    const ph = (tt / p.T + p.ph) % 1;
    const breath = ph < 0.5 && Math.floor(tt / p.T + p.ph) % 3 === 0 ? Math.sin(ph * 2 * Math.PI) : 0;
    g.save(); g.translate(x, y); g.rotate(P2.rot);
    const pull = ph < 0.5 ? 1 : -1, a = ph < 0.5 ? ph * 2 : (ph - 0.5) * 2;
    if (pass === 'under') {
      torso(g, 0, 16, 0, 44, 34, 70, p.seed + 1); g.fillStyle = under(p.suitC, 0.9); g.fill();
      for (const s2 of [-1, 1]) arm2(g, s2 * 10, 86, s2 * 12 + 4 * wave(tt, 0.5, s2 * 0.25), 150, { L1: 32, L2: 32, r1: 9, r2: 7, color: under(p.skinC, 1.1), under: true, seed: p.seed + 2 + s2 * 4, ox: 0, oy: 120 });
      arm2(g, pull * 18, 16, pull * 20, lerp(-46, 72, ez(a)), { L1: 30, L2: 30, color: under(p.skinC, 0.8), under: true, seed: p.seed + 5, ox: 0, oy: 40 });
    } else if (pass === 'above') {
      const side = -pull;                                     // the arm coming over: elbow high, then the hand reaching forward
      const hx = side * (16 + 22 * Math.sin(a * Math.PI)), hy = lerp(72, -52, ez(a));
      arm2(g, side * 18, 14, hx, hy, { L1: 30, L2: 30, color: p.skinC, lift: 3 + 4 * Math.sin(a * Math.PI), seed: p.seed + 6, ox: 0, oy: 20 });
      blob(g, 0, 22, 18, 22, 0, p.seed + 7, 0.06); fill(g, p.suitC, { lift: 1.5 });
      head3(g, 0, 0, 21, p, Math.PI / 2 * breath * (P2.rot > 0 ? -1 : 1), 0.45 * Math.abs(breath), { expr: 'blank', mouth: 0.6, lift: 2 });
      for (let i = 0; i < 5; i++) {
        const u = ((tt * 3 + i * 0.21) % 1);
        g.save(); g.globalAlpha = 0.8 * (1 - u);
        blob(g, (i - 2) * 6, 150 + u * 26, 5 + u * 4, 3.5 + u * 3, 0, p.seed + 20 + i, 0.25); fill(g, COL.foam, { lift: 1 });
        g.restore();
      }
    }
    g.restore();
    if (pass === 'above') ripples(g, x, y, 30, 24, tt, 1.1, p.seed + 30, 0.5);
    return { x, y };
  };

  // snorkeller: face down, a tube up, fins kicking; dives once (the fins tip up and go down), comes up with a spout
  DRAW.snorkel = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + 3 * sin(tt * 0.2), y = p.y - 0.6 * tt + 1.5 * wave(tt, 2.9);
    const dive = envT(tt, 10.3, 10.75, 11.55, 12.0);          // 0 at the surface .. 1 down under
    const tipUp = envT(tt, 10.3, 10.55, 10.6, 10.85);         // the hips and fins tip up as he goes down
    g.save(); g.translate(x, y); g.rotate(p.rot);
    if (pass === 'under') {
      const deep = 1.1 + 1.0 * dive;
      g.save(); g.globalAlpha = 1 - 0.35 * dive;
      torso(g, 0, 16 - 10 * tipUp, 0, 46, 36, 72, p.seed + 1); g.fillStyle = under(p.suitC, deep); g.fill();
      for (const s2 of [-1, 1]) {
        const k = 6 * wave(tt, p.T, s2 * 0.25) * (1 - tipUp);
        arm2(g, s2 * 11, 86 - 20 * tipUp, s2 * 12 + k, 148 - 40 * tipUp, { L1: 32, L2: 32, r1: 9, r2: 7, color: under(p.skinC, deep + 0.2), under: true, hand: false, seed: p.seed + 2 + s2 * 4, ox: 0, oy: 120 });
        blob(g, s2 * 12 + k, 168 - 50 * tipUp, 11, 22, 0.1 * s2, p.seed + 4 + s2, 0.08); g.fillStyle = under(COL.sky, deep - 0.1); g.fill();
        arm2(g, s2 * 20, 22, s2 * 24, 80, { L1: 30, L2: 30, color: under(p.skinC, deep + 0.1), under: true, seed: p.seed + 6 + s2 * 4, ox: 0, oy: 50 });
      }
      head3(g, 0, 0, 18, { ...p, skinC: under(p.skinC, deep), hairC: under(p.hairC, deep - 0.1) }, Math.PI, 0, { lift: 0, shadow: false, rim: false });
      g.restore();
    } else if (pass === 'above') {
      if (dive < 0.35) {
        g.save(); g.globalAlpha = 1 - dive / 0.35;
        blob(g, 0, 26, 16, 20, 0, p.seed + 8, 0.08); fill(g, p.suitC, { lift: 1.5 });
        limb(g, 8, -4, 10, -34, 4.5, 4, p.seed + 9, 0.04); fill(g, COL.yellow, { lift: 6 });
        blob(g, 10, -36, 5.5, 5.5, 0, p.seed + 10, 0.05); fill(g, COL.red, { lift: 6 });
        g.restore();
      }
      if (tipUp > 0.05) {                                     // the fins in the air for a moment
        for (const s2 of [-1, 1]) { blob(g, s2 * 12, 120 - 40 * tipUp, 11, 20 + 8 * tipUp, 0.1 * s2, p.seed + 4 + s2, 0.08); fill(g, COL.sky, { lift: 3 + 10 * tipUp }); }
      }
      for (const s2 of [-1, 1]) {
        const u = ((tt / p.T + (s2 > 0 ? 0 : 0.5)) % 1);
        g.save(); g.globalAlpha = 0.75 * (1 - u) * (1 - dive);
        blob(g, s2 * 12, 176 + u * 12, 6, 4.5, 0, p.seed + 11 + s2, 0.25); fill(g, COL.foam, { lift: 1 });
        g.restore();
      }
      if (tt >= 12.0 && tt < 12.8) {                          // the spout from his tube as he surfaces
        const u = (tt - 12.0) / 0.8;
        for (let i = 0; i < 6; i++) { g.save(); g.globalAlpha = 1 - u; blob(g, 10 + (i - 2.5) * 5 * u, -40 - 26 * Math.sin(u * Math.PI) - i * 4, 4, 4, 0, p.seed + 94 + i, 0.2); fill(g, COL.foam, { lift: 10 }); g.restore(); }
      }
    }
    g.restore();
    if (pass === 'above') ripples(g, x, y + 20, 24, 30, tt, 1.8 - dive, p.seed + 30, 0.45 + 0.4 * dive);
    return { x, y };
  };

  // treading water in the deep, upright, chatting: arms sculling in front under the water, legs kicking below.
  // No. 16 throws her head back laughing now and then, and ducks under once to wet her hair.
  DRAW.tread = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + 2 * sin(tt * 0.4 + p.ph * 6), y = p.y + 2.5 * wave(tt, p.T, p.ph);
    const look = idleLook(p, tt);
    const d = depthAt(x, y);
    const laugh = p.n === 16 ? envT((tt / 6.8 + 0.1) % 1, 0.18, 0.24, 0.32, 0.4) : envT((tt / 7.9 + 0.55) % 1, 0.2, 0.26, 0.31, 0.37) * 0.7;
    const duck = p.n === 16 ? envT(tt, 6.15, 6.45, 7.05, 7.4) : 0;
    const talk = Math.max(0, sin(tt * 9 + p.ph * 7)) * (1 - laugh);
    if (pass === 'under') {
      g.save(); g.globalAlpha = 0.65;
      torso(g, x, y + 14 + 8 * duck, look - (p.rot || 0) * 0, 48, 38, 46, p.seed + 1); g.fillStyle = under(p.suitC, d * 0.8); g.fill();
      for (const s2 of [-1, 1]) {                             // sculling: hands sweep small figure-eights in front
        const k = wave(tt, 1.2, s2 * 0.25);
        arm2(g, x + s2 * 20, y + 18, x + s2 * (30 + 10 * k) + Math.sin(look) * 26, y + 28 - Math.cos(look) * 14 + 6 * k, { L1: 24, L2: 24, color: under(p.skinC, d * 0.6), under: true, alpha: 0.85, seed: p.seed + 2 + s2 * 4, ox: x, oy: y + 40 });
      }
      for (const s2 of [-1, 1]) {                             // the eggbeater kick: each foot turns its own circle
        const a = tt * 7 + (s2 > 0 ? 0 : Math.PI);
        arm2(g, x + s2 * 10, y + 58, x + s2 * (16 + 8 * Math.cos(a)), y + 98 + 6 * Math.sin(a), { L1: 22, L2: 22, r1: 9, r2: 7, color: under(p.skinC, d * 1.0 + 0.4), under: true, alpha: 0.55, seed: p.seed + 4 + s2 * 4, ox: x, oy: y + 70, inside: true });
      }
      g.restore();
      if (duck > 0.4) {                                       // her head under the sheet, her curls floating
        hairFan(g, x, y + 4, 20, under(p.hairC, 0.5), tt, p.seed, 0.85, -Math.PI / 2, true);
        head3(g, x, y + 4, 20, { ...p, skinC: under(p.skinC, 0.55), hairC: under(p.hairC, 0.5) }, look, 0.2, { lift: 0, shadow: false, rim: false });
      }
    } else if (pass === 'above') {
      if (duck < 0.4) {
        blob(g, x, y + 14, 27, 12, look * 0.2, p.seed + 6, 0.06); fill(g, p.skinC, { lift: 1.5 });
        head3(g, x, y, 20, p, look, Math.max(laugh * 0.8, 0.12 * talk), { expr: laugh > 0.3 ? 'laugh' : 'blank', mouth: talk, lift: 3 + 2 * laugh });
        // a hand comes up while she talks
        const gest = clamp(Math.sin(TAU * (tt / 5.5 + p.ph)) * 3 - 2);
        if (gest > 0) {
          const s2 = p.rot > 0 ? 1 : -1;
          arm2(g, x + s2 * 22, y + 12, x + s2 * 34 + Math.sin(look) * 20, y - 2 - 12 * gest, { L1: 22, L2: 22, color: p.skinC, lift: 4, seed: p.seed + 8, ox: x, oy: y + 30 });
        }
      } else {
        for (const s2 of [-1, 1]) {                           // her hands smoothing her hair as she comes up
          blob(g, x + s2 * 18, y - 6, 6, 6, 0, p.seed + 15 + s2, 0.1); fill(g, p.skinC, { lift: 2 });
        }
      }
      ripples(g, x, y + 10, 30, 22, tt, 1.4 - 0.6 * duck, p.seed + 30, 0.55 + 0.4 * duck);
      ripples(g, x, y + 44, 14, 10, tt, 0.7, p.seed + 31, 0.3);   // little swirls from the kick behind
    }
    return { x, y };
  };

  // the two friends: chest-deep on the sandbar, facing each other, splashing (loud, and fine). The story can stop
  // them, turn them (the body turns, then the head), make them shout and wave for help, and reach out.
  DRAW.splash = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const R = ctx && ctx.friend ? ctx.friend(p.n, tt) : null;       // {stop, look, shout, armsUp, reach: {x, y, k}}
    const stop = R ? R.stop || 0 : 0;
    const x = p.x + 2 * sin(tt * 0.5 + p.ph * 3) + (R && R.dx ? R.dx / FIG : 0), y = p.y + 2 * wave(tt, 2.2, p.ph) + (R && R.dy ? R.dy / FIG : 0);
    const look = R && R.look != null ? R.look : p.rot;
    const body = R && R.look != null ? lerp(p.rot, R.look, 0.7) : p.rot - 0.15 * sin(tt * 2 + p.ph);
    const ph = (tt / p.T + p.ph) % 1;                          // one splash per period
    const side = Math.floor(tt / p.T + p.ph) % 2 ? 1 : -1;
    const d = depthAt(x, y);
    const laughing = (1 - stop) * envT((tt / 3.7 + p.ph) % 1, 0.1, 0.18, 0.3, 0.4);
    if (pass === 'under') {
      torso(g, x, y + 14, body - Math.PI / 2 + Math.PI / 2, 50, 40, 48, p.seed + 1); g.fillStyle = under(p.suitC, d * 0.5); g.fill();
      for (const s2 of [-1, 1]) arm2(g, x + s2 * 10, y + 58, x + s2 * 12, y + 92, { L1: 18, L2: 18, r1: 9, r2: 8, color: under(p.skinC, d * 0.6), under: true, seed: p.seed + 2 + s2 * 4, ox: x, oy: y + 70, inside: true });
      g.save(); g.globalAlpha = 0.16; blob(g, x + 26, y + 70, 30, 44, 0.3, p.seed + 5, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      const [SL, SR] = shoulders(x, y + 12, body - 0, 20);
      blob(g, x, y + 12, 28, 13, body * 0.25, p.seed + 6, 0.06); fill(g, p.skinC, { lift: 1.5 });
      if (stop < 0.5) {
        // the splash: wind the arm back, sweep it across the surface at the friend, follow through
        const wind = ph < 0.2 ? -ez(ph / 0.2) : ph < 0.55 ? -1 + 2.4 * ez((ph - 0.2) / 0.35) : 1.4 - 0.4 * ez((ph - 0.55) / 0.45);
        const a = look + side * (1.25 - 0.95 * wind);
        const S = side > 0 ? SR : SL;
        arm2(g, S[0], S[1], x + sin(a) * 54, y + 10 - cos(a) * 40, { L1: 26, L2: 28, color: p.skinC, lift: 3 + 3 * Math.max(0, wind), seed: p.seed + 7, ox: x, oy: y + 20 });
        const O = side > 0 ? SL : SR;
        arm2(g, O[0], O[1], O[0] - side * 14, O[1] + 20, { L1: 22, L2: 22, color: p.skinC, lift: 2, seed: p.seed + 9, ox: x, oy: y + 20 });
      } else {
        const up = R.armsUp || 0, rk = R.reach;
        for (const s2 of [-1, 1]) {
          const S = s2 > 0 ? SR : SL;
          let hx, hy, lift = 2;
          if (rk && s2 === -1 && rk.k > 0) { hx = lerp(S[0] - 14, p.x + (rk.x - p.x) / FIG, rk.k); hy = lerp(S[1] + 20, p.y + (rk.y - p.y) / FIG, rk.k); lift = 3; }
          else if (up > 0) {
            const a2 = look + s2 * (0.35 + 0.28 * wave(tt, 0.45, s2 > 0 ? 0 : 0.5));
            hx = lerp(S[0] + s2 * 8, x + s2 * 18 + sin(a2) * 46, up); hy = lerp(S[1] + 22, y + 6 - cos(a2) * 46, up); lift = 4 + 6 * up;
          } else { hx = S[0] + s2 * 12; hy = S[1] + 22; }
          arm2(g, S[0], S[1], hx, hy, { L1: 26, L2: 28, color: p.skinC, lift, seed: p.seed + 7 + s2 * 4, ox: x, oy: y + 20 });
        }
      }
      const shoutK = R ? R.shout || 0 : 0;
      const toUs = 0.35 + 0.65 * clamp(0.5 - 0.5 * Math.cos(look));     // 1 facing the shore, 0.35 facing the sea
      head3(g, x, y, 20, p, look + 0.12 * sin(tt * 3) * (1 - stop), Math.max(0.45 * laughing, 0.55 * shoutK * toUs, stop * 0.08), { expr: shoutK > 0.3 ? 'shout' : laughing > 0.3 ? 'laugh' : 'blank', mouth: 0.2, lift: 3 + 2 * shoutK });
      // the water thrown at the friend: white paper drops flying along `look`
      if (stop < 0.5 && ph > 0.32 && ph < 0.95) {
        const u = (ph - 0.32) / 0.63;
        for (let i = 0; i < 9; i++) {
          const rr = mulberry32(p.seed * 13 + i + Math.floor(tt / p.T) * 101);
          const spread = (rr() - 0.5) * 0.9, dist = 30 + u * (70 + rr() * 50);
          const dx = sin(look + spread) * dist, dy = -cos(look + spread) * dist * 0.8 - 18 * Math.sin(u * Math.PI);
          g.save(); g.globalAlpha = 0.95 * (1 - u * 0.7);
          blob(g, x + dx, y + dy, 4 + rr() * 6, 3 + rr() * 4, rr() * 3, p.seed + 40 + i, 0.25); fill(g, COL.foam, { lift: 4 + 8 * Math.sin(u * Math.PI) });
          g.restore();
        }
      }
      ripples(g, x, y + 16, 34, 26, tt, 0.9, p.seed + 30, 0.6);
    }
    return { x, y };
  };

  // the man waving at the boat: waist-deep, facing the sea. A dip, both arms up past the mark, waving from the elbows,
  // then down. His feet and shadow show on the sand through the water.
  DRAW.waver = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const W2 = ctx && ctx.waving ? ctx.waving(t) : { k: 0, t0: -9 };
    const up = typeof W2 === 'number' ? W2 : W2.k;
    const dip = typeof W2 === 'number' ? 0 : -Math.min(0, snap(tt, W2.t0, 0.35)) * 4;
    const x = p.x + idleSway(p, tt), y = p.y + 1.5 * wave(tt, 2.8) + dip;
    const d = depthAt(x, y);
    if (pass === 'under') {
      for (const s2 of [-1, 1]) {
        arm2(g, x + s2 * 12, y + 50, x + s2 * 15, y + 94, { L1: 22, L2: 22, r1: 10, r2: 8, color: under(p.skinC, d * 0.4), under: true, seed: p.seed + 1 + s2 * 4, ox: x, oy: y + 70, inside: true });
      }
      blob(g, x, y + 46, 22, 12, 0, p.seed + 5, 0.06); g.fillStyle = under(p.suitC, d * 0.35); g.fill();
      g.save(); g.globalAlpha = 0.18; blob(g, x + 34, y + 84, 28, 60, 0.35, p.seed + 6, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      const f = up > 0.2 ? p.rot : idleLook(p, tt) * 0.4;
      torso(g, x, y + 12, f * 0.3, 56, 44, 32, p.seed + 7); fill(g, p.skinC, { lift: 3 });
      const [SL, SR] = shoulders(x, y + 13, f * 0.3, 24);
      for (const s2 of [-1, 1]) {
        const S = s2 > 0 ? SR : SL;
        const sw = wave(tt, 0.5, s2 > 0 ? 0 : 0.5);            // the forearms swing side to side
        const hx = lerp(S[0] + s2 * 10, S[0] + s2 * (16 + 14 * sw), up), hy = lerp(S[1] + 26, S[1] - 50 - 8 * Math.abs(sw), up);
        arm2(g, S[0], S[1], hx, hy, { L1: 28, L2: 28, r1: 8, r2: 7, color: p.skinC, lift: 4 + 6 * up, seed: p.seed + 8 + s2 * 4, ox: x, oy: y - 10 });
      }
      head3(g, x, y, 21, p, turnTo(idleLook(p, tt), p.rot, clamp(up * 3)), 0.06 + 0.03 * up, { expr: up > 0.3 ? 'shout' : 'blank', lift: 4 });
      ripples(g, x, y + 40, 32, 18, tt, 1.5, p.seed + 30, 0.55);
    }
    return { x, y };
  };

  // the man standing chest-deep with his arms folded, facing the beach; he tips his head back to watch the gull go over
  // (quiet, upright, face up for a moment, and fine). His feet show on the sand.
  DRAW.stander = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + idleSway(p, tt), y = p.y + 1.2 * wave(tt, p.T, p.ph);
    const gull = envT(tt, 4.4, 4.85, 8.2, 8.7);
    const look = turnTo(p.rot + 0.25 * sin(tt * 0.35), Math.PI + 1.3 - 0.66 * (tt - 4.4), gull);   // follows the gull, left to right, chin to the shore
    const d = depthAt(x, y);
    if (pass === 'under') {
      torso(g, x, y + 22, 0, 54, 44, 40, p.seed + 1); g.fillStyle = under(p.suitC, d * 0.45); g.fill();
      for (const s2 of [-1, 1]) arm2(g, x + s2 * 12, y + 60, x + s2 * 15, y + 100, { L1: 20, L2: 20, r1: 10, r2: 8, color: under(p.skinC, d * 0.5), under: true, seed: p.seed + 2 + s2 * 4, ox: x, oy: y + 80, inside: true });
      g.save(); g.globalAlpha = 0.2; blob(g, x + 36, y + 90, 30, 64, 0.35, p.seed + 6, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      blob(g, x, y + 16, 31, 14, 0, p.seed + 7, 0.06); fill(g, p.skinC, { lift: 2 });
      // folded arms: each hand tucked at the other elbow
      arm2(g, x - 24, y + 18, x + 16, y + 30, { L1: 22, L2: 22, color: mix(p.skinC, '#000', 0.06), lift: 3, seed: p.seed + 8, ox: x, oy: y - 20, inside: true });
      arm2(g, x + 24, y + 18, x - 16, y + 26, { L1: 22, L2: 22, color: p.skinC, lift: 3.5, seed: p.seed + 9, ox: x, oy: y - 20, inside: true });
      head3(g, x, y, 21, p, look, 0.75 * gull, { expr: 'smile', lift: 3 + 2 * gull });
      ripples(g, x, y + 24, 36, 18, tt, 2.0, p.seed + 30, 0.5);
    }
    return { x, y };
  };

  // breaststroke, heading out slowly: head up, arms sweeping out and round, frog kick
  DRAW.breast = (g, p, t, pass) => {
    const tt = tw(t);
    const ph = (tt / p.T + p.ph) % 1;
    const glide = ph < 0.4 ? ph / 0.4 : 1;
    const x = p.x + 2 * sin(tt * 0.3), y = p.y - 2 * tt - 6 * Math.sin(glide * Math.PI);
    g.save(); g.translate(x, y); g.rotate(p.rot);
    if (pass === 'under') {
      torso(g, 0, 18, 0, 44, 34, 66, p.seed + 1); g.fillStyle = under(p.suitC, 0.45); g.fill();
      const out = ph < 0.4 ? Math.sin((ph / 0.4) * Math.PI) : 0;
      for (const s2 of [-1, 1]) {
        arm2(g, s2 * 18, 18, s2 * (14 + 34 * out), -32 + 44 * out, { L1: 26, L2: 26, color: under(p.skinC, 0.7), under: true, seed: p.seed + 2 + s2 * 4, ox: 0, oy: 40 });
        const kick = ph > 0.45 ? Math.sin(((ph - 0.45) / 0.55) * Math.PI) : 0;
        arm2(g, s2 * 10, 84, s2 * (14 + 22 * kick), 124 + 6 * (1 - kick), { L1: 24, L2: 24, r1: 9, r2: 7, color: under(p.skinC, 0.9), under: true, seed: p.seed + 4 + s2 * 4, ox: 0, oy: 100, inside: true });
      }
    } else if (pass === 'above') {
      blob(g, 0, 22, 20, 14, 0, p.seed + 6, 0.06); fill(g, p.suitC, { lift: 1.5 });
      head3(g, 0, 0, 19, p, 0, 0.1, { lift: 3 });
    }
    g.restore();
    if (pass === 'above') ripples(g, x, y + 10, 30, 22, tt, p.T, p.seed + 30, 0.55);
    return { x, y };
  };

  // the boy who yells "Help!": waist-deep in the shallows. A crouch, arms flung up past the mark, flailing, face up
  // and shouting; then he bobs and slaps the water, playing. After "Time.", on "boy", he throws a sheet of water at
  // his brother and they both laugh, faces up: what he was doing all along.
  DRAW.flailer = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const S = ctx && ctx.boy ? ctx.boy(t) : { flail: 0, laugh: 0, throwK: 0, help: -9 };
    const crouch = -Math.min(0, snap(tt, S.help - 0.05, 0.3)) * 6;
    const x = p.x + 3 * S.flail * sin(tt * 9), y = p.y + 1.5 * wave(tt, 1.7) + crouch;
    const d = depthAt(x, y);
    if (pass === 'under') {
      for (const s2 of [-1, 1]) arm2(g, x + s2 * 11, y + 50, x + s2 * 14, y + 86, { L1: 18, L2: 18, r1: 9, r2: 7, color: under(p.skinC, d * 0.4), under: true, seed: p.seed + 1 + s2 * 4, ox: x, oy: y + 70, inside: true });
      blob(g, x, y + 44, 20, 11, 0, p.seed + 3, 0.06); g.fillStyle = under(p.suitC, d * 0.35); g.fill();
      g.save(); g.globalAlpha = 0.18; blob(g, x + 30, y + 76, 24, 50, 0.35, p.seed + 4, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      const toBro = Math.atan2(884 - 778, -(1156 - 1130));
      const f = S.throwK > 0 ? lerp(0, toBro * 0.5, S.throwK) : 0;
      torso(g, x, y + 12, f, 50, 40, 30, p.seed + 5); fill(g, p.skinC, { lift: 3 });
      const [SL, SR] = shoulders(x, y + 13, f, 22);
      const fl = Math.max(0, S.flail);
      for (const s2 of [-1, 1]) {
        const Sh = s2 > 0 ? SR : SL;
        const sw = wave(tt, 0.36, s2 > 0 ? 0 : 0.5);
        let hx = Sh[0] + s2 * 12, hy = Sh[1] + 22;                       // down at his sides
        if (fl > 0) { hx = lerp(hx, Sh[0] + s2 * (24 + 16 * sw), fl); hy = lerp(hy, Sh[1] - 40 - 10 * sw, fl); }
        if (S.throwK > 0 && s2 > 0) {                                     // the throw: wound back, then swept at his brother
          const w = S.throwK < 0.35 ? -ez(S.throwK / 0.35) : -1 + 2.2 * ez((S.throwK - 0.35) / 0.4);
          hx = lerp(hx, Sh[0] + 44 + 20 * w, Math.min(1, S.throwK * 3)); hy = lerp(hy, Sh[1] + 6 - 26 * w, Math.min(1, S.throwK * 3));
        }
        arm2(g, Sh[0], Sh[1], hx, hy, { L1: 24, L2: 24, color: p.skinC, lift: 4 + 6 * fl, seed: p.seed + 6 + s2 * 4, ox: x, oy: y + 30 });
      }
      const up = Math.max(fl * 0.8, S.laugh * 0.6);
      const lk = turnTo(turnTo(idleLook(p, tt), Math.PI + 0.35, clamp(fl * 2)), toBro, clamp(S.laugh * 2));
      head3(g, x, y, 19, p, lk, up, { expr: fl > 0.3 ? 'shout' : S.laugh > 0.3 ? 'laugh' : 'blank', lift: 3 + 3 * up });
      if (fl > 0.2) {                                                    // the splashes of flailing arms
        for (let i = 0; i < 6; i++) {
          const rr = mulberry32(p.seed * 7 + i + Math.floor(tt * 7.5) * 31);
          g.save(); g.globalAlpha = 0.9 * fl;
          blob(g, x + (rr() - 0.5) * 110, y + (rr() - 0.7) * 70, 4 + rr() * 5, 3 + rr() * 4, rr() * 3, p.seed + 50 + i, 0.25); fill(g, COL.foam, { lift: 5 });
          g.restore();
        }
      }
      // play between his shouts: a slap of the water every second or so
      const play = clamp(1 - fl * 2) * clamp(1 - S.throwK * 3) * (tt > 3 ? 1 : 0);
      const slapU = ((tt / 1.35) + p.seed * 0.1) % 1;
      if (play > 0 && slapU < 0.45) {
        const side2 = Math.floor(tt / 1.35) % 2 ? 1 : -1, k2 = slapU / 0.45;
        for (let i = 0; i < 5; i++) {
          const rr = mulberry32(p.seed * 9 + i + Math.floor(tt / 1.35) * 17);
          g.save(); g.globalAlpha = 0.9 * (1 - k2) * play;
          blob(g, x + side2 * (36 + 30 * k2 * rr()), y + 20 - 46 * k2 * rr(), 3.5 + rr() * 4, 3 + rr() * 3, rr() * 3, p.seed + 70 + i, 0.25); fill(g, COL.foam, { lift: 3 + 6 * k2 });
          g.restore();
        }
      }
      // the sheet of water he throws at his brother
      if (S.throwK > 0.35 && S.throwK < 1) {
        const u = (S.throwK - 0.35) / 0.65;
        for (let i = 0; i < 12; i++) {
          const rr = mulberry32(p.seed * 21 + i);
          const dist = 30 + u * (60 + rr() * 60), spread = (rr() - 0.5) * 0.7;
          g.save(); g.globalAlpha = 0.95 * (1 - u * 0.6);
          blob(g, x + sin(toBro + spread) * dist, y - cos(toBro + spread) * dist * 0.8 - 20 * Math.sin(u * Math.PI), 4 + rr() * 6, 3 + rr() * 4, rr() * 3, p.seed + 90 + i, 0.25); fill(g, COL.foam, { lift: 4 + 10 * Math.sin(u * Math.PI) });
          g.restore();
        }
      }
      ripples(g, x, y + 30, 30, 18, tt, 0.6 + 0.6 * (1 - fl), p.seed + 30, 0.6 + 0.3 * fl);
    }
    return { x, y };
  };

  // his brother: waist-deep beside him; after "Time." he flinches from the sheet of water, arms up, laughing
  DRAW.brother = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const S = ctx && ctx.boy ? ctx.boy(t) : { laugh: 0, flinch: 0 };
    const fl = S.flinch || 0;
    const x = p.x + 6 * fl, y = p.y + 1.5 * wave(tt, 1.9, 0.3) - 3 * fl;
    const d = depthAt(x, y);
    if (pass === 'under') {
      for (const s2 of [-1, 1]) arm2(g, x + s2 * 10, y + 46, x + s2 * 13, y + 80, { L1: 17, L2: 17, r1: 8, r2: 7, color: under(p.skinC, d * 0.4), under: true, seed: p.seed + 1 + s2 * 4, ox: x, oy: y + 60, inside: true });
      blob(g, x, y + 40, 18, 10, 0, p.seed + 3, 0.06); g.fillStyle = under(p.suitC, d * 0.35); g.fill();
      g.save(); g.globalAlpha = 0.18; blob(g, x + 28, y + 70, 22, 46, 0.35, p.seed + 4, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      const away = 0.6;
      torso(g, x, y + 11, fl * away, 46, 36, 28, p.seed + 5); fill(g, p.skinC, { lift: 3 });
      const [SL, SR] = shoulders(x, y + 12, fl * away, 20);
      for (const s2 of [-1, 1]) {
        const Sh = s2 > 0 ? SR : SL;
        const hx = lerp(Sh[0] + s2 * 12, x - 18 + s2 * 10, fl), hy = lerp(Sh[1] + 22, y - 18, fl);   // arms up, shielding
        arm2(g, Sh[0], Sh[1], hx, hy, { L1: 22, L2: 22, color: p.skinC, lift: 3 + 4 * fl, seed: p.seed + 6 + s2 * 4, ox: x, oy: y + 30 });
      }
      head3(g, x, y, 17, p, turnTo(turnTo(idleLook(p, tt), -2.3, clamp(S.laugh * 2)), 2.5, fl), 0.6 * S.laugh, { expr: S.laugh > 0.3 ? 'laugh' : 'blank', lift: 3 + 2 * fl });
      ripples(g, x, y + 26, 26, 16, tt, 1.2, p.seed + 30, 0.55);
    }
    return { x, y };
  };

  // the small kid in a duck float, and his mum standing beside him holding it (quiet, and fine)
  DRAW.ringkid = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + 3 * sin(tt * 0.5), y = p.y + 2 * wave(tt, p.T, p.ph);
    if (pass === 'under') {
      for (const s2 of [-1, 1]) arm2(g, x + s2 * 7, y + 26, x + s2 * 9 + 4 * wave(tt, 0.9, s2 * 0.3), y + 56, { L1: 15, L2: 15, r1: 6, r2: 5, color: under(p.skinC, 0.5), under: true, seed: p.seed + 1 + s2 * 4, ox: x, oy: y + 40, inside: true });
    } else if (pass === 'above') {
      blob(g, x, y + 14, 40, 34, 0, p.seed + 2, 0.03); fill(g, COL.yellow, { lift: 3 });
      blob(g, x, y + 54, 12, 9, 0, p.seed + 9, 0.1); fill(g, COL.yellow, { lift: 3 });
      blob(g, x, y - 26, 17, 16, 0, p.seed + 10, 0.05); fill(g, COL.yellow, { lift: 5 });
      blob(g, x, y - 44, 8, 7, 0, p.seed + 11, 0.1); fill(g, COL.orange, { lift: 5.5 });
      for (const s2 of [-1, 1]) { g.beginPath(); g.arc(x + s2 * 7, y - 30, 2.6, 0, TAU); g.fillStyle = COL.navy; g.fill(); }
      blob(g, x, y + 14, 20, 16, 0, p.seed + 3, 0.05); g.fillStyle = under(p.suitC, 0.4); g.fill();
      for (const s2 of [-1, 1]) arm2(g, x + s2 * 12, y + 10, x + s2 * 32, y + 4 + 3 * sin(tt * 1.3 + s2), { L1: 12, L2: 12, r1: 5, r2: 4.5, color: p.skinC, lift: 4, seed: p.seed + 4 + s2 * 4, ox: x, oy: y + 30 });
      head3(g, x, y, 14, p, idleLook(p, tt) + 0.3 * sin(tt * 0.6), 0.25, { expr: 'smile', lift: 4 });
    }
    return { x, y };
  };
  DRAW.mum = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + idleSway(p, tt), y = p.y + 1.2 * wave(tt, p.T, p.ph);
    const d = depthAt(x, y);
    if (pass === 'under') {
      for (const s2 of [-1, 1]) arm2(g, x + s2 * 11, y + 48, x + s2 * 13, y + 84, { L1: 18, L2: 18, r1: 9, r2: 8, color: under(p.skinC, d * 0.4), under: true, seed: p.seed + 1 + s2 * 4, ox: x, oy: y + 70, inside: true });
      blob(g, x, y + 42, 21, 11, 0, p.seed + 3, 0.06); g.fillStyle = under(p.suitC, d * 0.35); g.fill();
      g.save(); g.globalAlpha = 0.18; blob(g, x + 30, y + 76, 24, 50, 0.35, p.seed + 4, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      torso(g, x, y + 12, 0.2, 50, 40, 30, p.seed + 5); fill(g, p.suitC, { lift: 3 });
      blob(g, x, y + 10, 26, 10, 0, p.seed + 6, 0.06); fill(g, p.skinC, { lift: 2 });
      const k = { x: p.x + (PEOPLE_BY[10].x - p.x) / FIG, y: p.y + (PEOPLE_BY[10].y - p.y) / FIG };
      arm2(g, x + 20, y + 12, k.x - 34, k.y + 18, { L1: 26, L2: 28, color: p.skinC, lift: 4, seed: p.seed + 7, ox: x, oy: y + 30 });
      arm2(g, x - 20, y + 12, x - 30, y + 34, { L1: 18, L2: 18, color: p.skinC, lift: 3, seed: p.seed + 8, ox: x, oy: y + 20 });
      head3(g, x, y, 19, p, lerp(idleLook(p, tt), 0.95, 0.5), 0.08, { expr: 'smile', lift: 3 });
      ripples(g, x, y + 30, 32, 18, tt, 1.8, p.seed + 30, 0.5);
    }
    return { x, y };
  };

  // the older woman wading knee-deep at the shore in a wide straw hat, arms out for balance; she yelps and hops back
  // when the set's foam reaches her
  DRAW.wader = (g, p, t, pass) => {
    const tt = tw(t);
    const yelp = Math.max(0, snap(tt, 13.1, 0.3)) * envT(tt, 12.9, 13.1, 14.0, 14.6);
    const x = p.x + 10 * sin(tt * 0.12), y = p.y + 8 * yelp;
    if (pass === 'under') {
      for (const s2 of [-1, 1]) arm2(g, x + s2 * 12, y + 56, x + s2 * 15, y + 94, { L1: 20, L2: 20, r1: 9, r2: 7, color: under(p.skinC, 0.25), under: true, seed: p.seed + 1 + s2 * 4, ox: x, oy: y + 75, inside: true });
    } else if (pass === 'above') {
      torso(g, x, y + 14, 0, 50, 42, 46, p.seed + 3); fill(g, p.suitC, { lift: 4 });
      for (const s2 of [-1, 1]) {
        const a = s2 * (1.55 + 0.15 * wave(tt, 2.4, s2 * 0.3)) - s2 * 1.1 * yelp;
        arm2(g, x + s2 * 22, y + 16, x + s2 * 22 + sin(a) * 50, y + 16 - cos(a) * (20 + 26 * yelp), { L1: 26, L2: 26, color: p.skinC, lift: 5 + 4 * yelp, seed: p.seed + 4 + s2 * 4, ox: x, oy: y + 30 });
      }
      blob(g, x, y, 31, 30, 0.2, p.seed + 6, 0.05); fill(g, COL.straw, { lift: 6 });
      g.save(); g.strokeStyle = 'rgba(150, 100, 40, 0.35)'; g.lineWidth = 1.4;
      for (let i = 1; i < 3; i++) { blob(g, x, y, 31 - i * 8, 30 - i * 8, 0.2, p.seed + 6, 0.05); g.stroke(); }
      g.restore();
      blob(g, x, y, 16, 15, 0.2, p.seed + 7, 0.05); fill(g, mix(COL.straw, '#ffffff', 0.15), { lift: 2 });
      limb(g, x - 16, y + 2, x + 16, y + 2, 3, 3, p.seed + 8, 0.02); g.fillStyle = COL.coral; g.fill();
      ripples(g, x, y + 70, 30, 14, tt, 1.1, p.seed + 30, 0.85);
    }
    return { x, y };
  };

  // the lifeguard once she's off her chair. ctx.lifeguard(t) = {mode, x, y, dir, u, air, tube, splash}; x, y is her
  // head (world). Upright (hop, run, wade) she isn't turned to her heading: the stride and the arm swing run along it.
  // Swimming, she lies along it. Holding, she's behind Maya on the shore side, her hands on the tube's ends.
  DRAW.lifeguard = (g, p, t, pass, ctx) => {
    const L = ctx && ctx.lifeguard ? ctx.lifeguard(t) : null;
    if (!L || L.mode === 'chair' || L.mode === 'stand') return { x: p.x, y: p.y };
    const tt = tw(t), x = L.x, y = L.y, dir = L.dir || 0, u = L.u || 0;
    const red = p.suitC, skin = p.skinC, capP = { ...p, style: 'cap', capC: '#ffc233' };
    if (L.mode === 'run' || L.mode === 'wade' || L.mode === 'hop') {
      const inWater = L.mode === 'wade';
      const k = Math.sin(TAU * u), stride = L.mode === 'wade' ? 0.55 : L.mode === 'hop' ? 0.3 : 1;
      const hx = Math.sin(dir), hy = -Math.cos(dir);
      const lean = L.mode === 'run' ? 7 : 3, air = L.air || 0;
      g.save(); g.translate(x + hx * lean, y + hy * lean * 0.5);
      if (air > 0) { g.translate(0, -10 * air); g.scale(1 + 0.12 * air, 1 + 0.12 * air); }
      if (pass === (inWater ? 'under' : 'above')) {                       // legs: knee up, foot back, along the heading
        for (const s2 of [-1, 1]) {
          const st = 22 * k * s2 * stride;
          arm2(g, s2 * 9 - hx * lean, 44, s2 * 11 + hx * st - hx * lean, 88 + hy * st * 0.6 - 6 * air, { L1: 22, L2: 22, r1: 9, r2: 7,
            color: inWater ? under(skin, 0.3) : skin, under: inWater, alpha: 0.9, lift: 3 + 6 * air, seed: p.seed + 40 + s2 * 4, ox: -hx * 40, oy: 66 - hy * 40, pins: false });
        }
      }
      if (pass === 'above') {
        torso(g, 0, 12, 0, 44, 36, 34, p.seed + 41); fill(g, red, { lift: 5 + 6 * air });
        const [SL, SR] = shoulders(0, 14, 0, 21);
        for (const s2 of [-1, 1]) {                                       // arms pump against the legs, elbows bent
          const S = s2 > 0 ? SR : SL, sw = 20 * k * s2 * stride;
          arm2(g, S[0], S[1], S[0] + s2 * 6 - hx * sw, S[1] + 22 - hy * sw * 0.6, { L1: 18, L2: 18, color: skin, lift: 6 + 6 * air, seed: p.seed + 42 + s2 * 4, ox: 0, oy: 40 });
        }
        g.save(); g.translate(-hx * 24 + 14, 34 - hy * 16); g.rotate(dir + Math.PI / 2 + 0.25 * k);   // the tube, swinging on its strap
        limb(g, -34, 0, 34, 0, 7, 7, p.seed + 45, 0.03); fill(g, '#e5352a', { lift: 7 + 6 * air });
        g.restore();
        head3(g, 0, 0, 19, capP, dir, 0.08, { expr: 'blank', lift: 6 + 6 * air });
        if (inWater) {                                                    // the water kicked up at each step
          for (let i = 0; i < 6; i++) {
            const rr = mulberry32(p.seed * 7 + i + Math.floor(tt * 7.5) * 13);
            g.save(); g.globalAlpha = 0.9;
            blob(g, (rr() - 0.5) * 70, 50 + rr() * 50, 4 + rr() * 5, 3 + rr() * 4, rr() * 3, p.seed + 60 + i, 0.25); fill(g, COL.foam, { lift: 4 });
            g.restore();
          }
        } else if (L.mode === 'run' && Math.floor(tt * 7.5) % 2 === 0) {   // a puff of sand kicked up behind
          const rr = mulberry32(p.seed * 3 + Math.floor(tt * 7.5));
          g.save(); g.globalAlpha = 0.55;
          blob(g, -hx * 30 + (rr() - 0.5) * 20, 92 - hy * 18, 9, 5, 0, p.seed + 99, 0.3); g.fillStyle = '#e6cf9c'; g.fill();
          g.restore();
        }
      }
      g.restore();
      return { x, y };
    }
    g.save(); g.translate(x, y); g.rotate(dir);
    if (L.mode === 'dive' || L.mode === 'swim') {
      const ph = u % 1, pull = ph < 0.5 ? 1 : -1, a = ph < 0.5 ? ph * 2 : (ph - 0.5) * 2;
      const duck = L.duck || 0;                                         // under a breaking wave: only her shape through the water
      if (duck > 0.5) {
        if (pass === 'under') { torso(g, 0, 16, 0, 44, 34, 70, p.seed + 1); g.fillStyle = under(red, 1.6); g.fill(); head3(g, 0, 0, 20, { ...capP, skinC: under(skin, 1.4), capC: under('#ffc233', 1.2) }, 0, 0.05, { lift: 0, shadow: false, rim: false }); }
        else ripples(g, 0, 20, 30, 40, tt, 0.5, p.seed + 33, 1);
      } else if (pass === 'under') {
        torso(g, 0, 16, 0, 44, 34, 70, p.seed + 1); g.fillStyle = under(red, 0.7); g.fill();
        for (const s2 of [-1, 1]) arm2(g, s2 * 10, 86, s2 * 12 + 5 * wave(tt, 0.4, s2 * 0.25), 150, { L1: 32, L2: 32, r1: 9, r2: 7, color: under(skin, 0.9), under: true, seed: p.seed + 2 + s2 * 4, ox: 0, oy: 120 });
        arm2(g, pull * 18, 16, pull * 20, lerp(-46, 72, ez(a)), { L1: 30, L2: 30, color: under(skin, 0.7), under: true, seed: p.seed + 5, ox: 0, oy: 40 });
      } else {
        const side = -pull;
        arm2(g, side * 18, 14, side * (16 + 22 * Math.sin(a * Math.PI)), lerp(72, -52, ez(a)), { L1: 30, L2: 30, color: skin, lift: 3 + 4 * Math.sin(a * Math.PI), seed: p.seed + 6, ox: 0, oy: 20 });
        blob(g, 0, 22, 18, 22, 0, p.seed + 7, 0.06); fill(g, red, { lift: 1.5 });
        head3(g, 0, 0, 20, capP, 0.5 * Math.sin(TAU * ph), 0.05, { lift: 2 });
        for (let i = 0; i < 5; i++) {                                     // kick foam
          const w2 = ((tt * 3 + i * 0.21) % 1);
          g.save(); g.globalAlpha = 0.85 * (1 - w2);
          blob(g, (i - 2) * 6, 150 + w2 * 26, 6 + w2 * 4, 4 + w2 * 3, 0, p.seed + 20 + i, 0.25); fill(g, COL.foam, { lift: 1 });
          g.restore();
        }
        if (L.mode === 'dive') {                                          // the splash where she went in
          for (let i = 0; i < 10; i++) {
            const rr = mulberry32(p.seed * 11 + i), aa = rr() * TAU, dd = 30 + 50 * (L.splash || 0) * rr();
            g.save(); g.globalAlpha = 0.95 * (1 - (L.splash || 0) * 0.5);
            blob(g, cos(aa) * dd, 40 + sin(aa) * dd, 5 + rr() * 6, 4 + rr() * 5, aa, p.seed + 80 + i, 0.25); fill(g, COL.foam, { lift: 6 });
            g.restore();
          }
        }
      }
    } else if (L.mode === 'hold') {
      // behind Maya (towards the shore), treading, her hands on the tube's two ends
      if (pass === 'under') {
        torso(g, 0, 16, 0, 46, 38, 46, p.seed + 1); g.fillStyle = under(red, 0.8); g.fill();
        for (const s2 of [-1, 1]) { const a2 = tt * 6 + (s2 > 0 ? 0 : Math.PI); arm2(g, s2 * 10, 60, s2 * (16 + 7 * Math.cos(a2)), 100 + 5 * Math.sin(a2), { L1: 22, L2: 22, r1: 9, r2: 7, color: under(skin, 1.0), under: true, alpha: 0.6, seed: p.seed + 2 + s2 * 4, ox: 0, oy: 80, inside: true }); }
      } else {
        const T2 = L.tube;
        blob(g, 0, 12, 26, 12, 0, p.seed + 3, 0.06); fill(g, skin, { lift: 2 });
        if (T2) for (const s2 of [-1, 1]) {                               // her hands to the tube's ends (her own scale)
          const ex = (T2.x + s2 * (T2.len / 2 - 6) - x) / FIG, ey = (T2.y - y) / FIG;
          arm2(g, s2 * 20, 12, ex, ey, { L1: 26, L2: 28, color: skin, lift: 3, seed: p.seed + 8 + s2 * 4, ox: 0, oy: 30 });
        }
        head3(g, 0, 0, 19, capP, 0, 0.08, { lift: 3 });
        ripples(g, 0, 20, 30, 20, tt, 1.0, p.seed + 31, 0.6);
      }
    }
    g.restore();
    // the tube on its line: trailing a body length behind her as she swims, then across Maya's chest
    if (pass === 'above' && L.tube) {
      const T2 = L.tube;
      if (T2.line) { g.save(); g.strokeStyle = '#f6f1e6'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(T2.line[0], T2.line[1]); g.quadraticCurveTo((T2.line[0] + T2.x) / 2 + 10, (T2.line[1] + T2.y) / 2 + 14, T2.x, T2.y); g.stroke(); g.restore(); }
      g.save(); g.translate(T2.x, T2.y); g.rotate(T2.rot || 0);
      limb(g, -T2.len / 2, 0, T2.len / 2, 0, 9, 9, p.seed + 90, 0.03); fill(g, '#e5352a', { lift: 3 });
      for (const s2 of [-1, 1]) { blob(g, s2 * (T2.len / 2 - 4), 0, 4, 4, 0, p.seed + 91 + s2, 0.1); fill(g, '#2b2b2b', { lift: 3.5, rim: false }); }
      g.restore();
      ripples(g, T2.x, T2.y, T2.len * 0.6, 14, tt, 1.2, p.seed + 95, 0.6);
    }
    return { x, y };
  };

  const PEOPLE_BY = {}; PEOPLE.forEach((p) => (PEOPLE_BY[p.n] = p));
  const LIFEGUARD = { n: 0, kind: 'lifeguard', x: 178, y: 1452, seed: 930, skinC: SKIN[1], hairC: HAIR[4], suitC: '#e5352a', style: null };
  const FIG = 1.25;                     // every person is drawn 25 % up from the sizes above, about their head

  // ------------------------------------------------------------------ the ground: sand, the floor under the water
  function paintFloor(g, t) {
    // deep water everywhere first (the channel and the sea beyond it)
    const gr = g.createLinearGradient(0, -400, 0, 760);
    gr.addColorStop(0, COL.deepTop); gr.addColorStop(1, COL.deep);
    g.fillStyle = gr; g.fillRect(-1200, -1200, W + 2400, 3200);
    // the sandbar: from its edge down to the shore
    const xs = []; for (let x = -1200; x <= W + 1200; x += 24) xs.push(x);
    g.save();
    g.beginPath();
    xs.forEach((x, i) => (i ? g.lineTo(x, edgeY(x)) : g.moveTo(x, edgeY(x))));
    g.lineTo(W + 1200, 2400); g.lineTo(-1200, 2400); g.closePath();
    const gb = g.createLinearGradient(0, 730, 0, 1350);
    gb.addColorStop(0, COL.floorEdge); gb.addColorStop(0.08, COL.floorMid); gb.addColorStop(1, COL.floorNear);
    g.shadowColor = 'rgba(4, 30, 50, 0.45)'; g.shadowBlur = 16; g.shadowOffsetY = -6;
    g.fillStyle = gb; g.fill();
    g.shadowColor = 'transparent';
    g.restore();
    // ripple marks on the sand floor (light bands, very soft)
    g.save(); g.globalAlpha = 0.18; g.strokeStyle = '#fff8e8'; g.lineWidth = 3;
    for (let k = 0; k < 14; k++) {
      const y0 = 792 + k * 40;
      g.beginPath();
      for (let x = -200; x <= W + 200; x += 30) { const y = y0 + 6 * sin(x * 0.05 + k * 1.7); if (x === -200) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
    g.restore();
  }

  // the water's outline (everything seaward of the wash's edge)
  function waterPath(g, t) {
    const surge = 10 * sin(TAU * (tw(t) / 6.4));
    g.beginPath(); g.moveTo(-1200, -1200); g.lineTo(W + 1200, -1200);
    for (let x = W + 1200; x >= -1200; x -= 24) g.lineTo(x, shoreY(x) + surge);
    g.closePath();
  }
  // the water's surface: one translucent sheet over everything below the shoreline, with its cut edge at the sand
  function paintSheet(g, t) {
    const xs = []; for (let x = -1200; x <= W + 1200; x += 24) xs.push(x);
    const surge = 10 * sin(TAU * (t / 6.4));                          // the wash runs up and back
    g.save();
    g.beginPath();
    g.moveTo(-1200, -1200); g.lineTo(W + 1200, -1200);
    for (let i = xs.length - 1; i >= 0; i--) g.lineTo(xs[i], shoreY(xs[i]) + surge);
    g.closePath();
    // shallows lighter, deep a little darker: a vertical gradient on the sheet
    const gs = g.createLinearGradient(0, 300, 0, 1350);
    gs.addColorStop(0, 'rgba(18, 150, 185, 0.34)'); gs.addColorStop(0.42, 'rgba(26, 178, 196, 0.34)'); gs.addColorStop(1, 'rgba(70, 214, 206, 0.30)');
    g.fillStyle = gs; g.fill();
    // fibres in the sheet
    grain(g, TILE2, 0.45, true, 0, 0);
    g.restore();
    // the sheet's edge on the wet sand: a thin white line of foam
    g.save(); g.strokeStyle = COL.foam; g.lineWidth = 4; g.globalAlpha = 0.9;
    g.beginPath(); xs.forEach((x, i) => { const y = shoreY(x) + surge; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
    g.restore();
  }

  function paintSand(g, t) {
    const xs = []; for (let x = -1200; x <= W + 1200; x += 24) xs.push(x);
    g.save();
    g.beginPath();
    xs.forEach((x, i) => (i ? g.lineTo(x, shoreY(x) - 6) : g.moveTo(x, shoreY(x) - 6)));
    g.lineTo(W + 1200, 3200); g.lineTo(-1200, 3200); g.closePath();
    const gs = g.createLinearGradient(0, 1342, 0, 1470);
    gs.addColorStop(0, COL.wet); gs.addColorStop(0.32, COL.wet); gs.addColorStop(0.42, COL.dry2); gs.addColorStop(1, COL.dry);
    g.fillStyle = gs; g.fill();
    grain(g, TILE, 0.55, true, 0, 0);
    g.restore();
  }

  // the beach's things on the sand: towels, umbrellas, the lifeguard's chair
  function paintBeach(g, t, ctx) {
    const tt = tw(t);
    // towels
    const towel = (x, y, w, h, rot, c1, c2, seed) => {
      g.save(); g.translate(x, y); g.rotate(rot);
      poly(g, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], seed, 1.2); fill(g, c1, { lift: 2 });
      const rr = mulberry32(seed * 3 + 1);
      let k = -w / 2 + 6 + rr() * 6;
      while (k < w / 2 - 8) {
        const sw = 8 + rr() * 6, tilt = (rr() - 0.5) * 5;
        poly(g, [[k + tilt, -h / 2 + 3], [k + sw + tilt, -h / 2 + 3], [k + sw - tilt, h / 2 - 3], [k - tilt, h / 2 - 3]], seed + 50 + Math.round(k), 1.4);
        fill(g, c2, { lift: 0.8, rim: false });
        k += sw + 10 + rr() * 9;
      }
      g.restore();
    };
    towel(420, 1468, 90, 150, 0.12, COL.yellow, COL.white, 901);
    towel(690, 1500, 84, 146, -0.08, COL.teal, COL.white, 902);
    towel(1000, 1446, 80, 140, 0.3, COL.coral, COL.white, 903);
    // umbrellas: striped discs with a cast shadow
    const umbrella = (x, y, r, c1, c2, seed) => {
      g.save(); g.globalAlpha = 0.22; blob(g, x + 26, y + 30, r, r * 0.92, 0, seed + 1, 0.04); g.fillStyle = COL.shade; g.fill(); g.restore();
      blob(g, x, y, r, r, 0, seed, 0.05); fill(g, c1, { lift: 8 });
      const ur = mulberry32(seed * 7 + 3);
      for (let i = 0; i < 8; i += 2) {
        const a0 = (i / 8) * TAU + (ur() - 0.5) * 0.08 + 0.03, a1 = ((i + 1) / 8) * TAU + (ur() - 0.5) * 0.08 - 0.03;
        const rr2 = r * (0.93 + ur() * 0.06);
        const pts = [[x + Math.cos((a0 + a1) / 2) * 3, y + Math.sin((a0 + a1) / 2) * 3]];
        for (let k = 0; k <= 6; k++) { const a = a0 + (a1 - a0) * (k / 6); pts.push([x + Math.cos(a) * rr2, y + Math.sin(a) * rr2]); }
        poly(g, pts, seed + 20 + i, 1.2); fill(g, c2, { lift: 1, rim: false });
      }
      blob(g, x, y, 6, 6, 0, seed + 2, 0.05); fill(g, COL.white, { lift: 9 });
    };
    // footprints from the umbrella down to the water
    for (let k = 0; k < 7; k++) {
      const fx = 520 + k * 6 + (k % 2 ? 12 : -12), fy = 1488 - k * 22;
      blob(g, fx, fy, 6, 9, 0.1, 960 + k, 0.1); g.fillStyle = 'rgba(160, 120, 70, 0.28)'; g.fill();
    }
    // a sandcastle with a moat and a plain paper flag (no country's), a red bucket and a blue spade
    blob(g, 84, 1424, 54, 40, 0, 941, 0.08); g.fillStyle = COL.wet; g.fill();
    blob(g, 84, 1424, 40, 28, 0, 942, 0.06); fill(g, '#e0c48c', { lift: 4 });
    for (const [dx, dy] of [[-22, -12], [22, -12], [-22, 14], [22, 14]]) { blob(g, 84 + dx, 1424 + dy, 11, 11, 0, 943 + dx + dy, 0.08); fill(g, '#e8cf99', { lift: 7 }); }
    blob(g, 84, 1424, 15, 15, 0, 947, 0.06); fill(g, '#ecd6a4', { lift: 9 });
    limb(g, 84, 1424, 86, 1392, 1.6, 1.6, 948, 0.02); fill(g, '#7a5a3a', { lift: 12 });
    poly(g, [[86, 1392], [112, 1399], [86, 1406]], 949, 1); fill(g, COL.coral, { lift: 12 });
    blob(g, 40, 1468, 17, 17, 0, 950, 0.05); fill(g, COL.red, { lift: 6 });
    blob(g, 40, 1468, 12, 12, 0, 951, 0.05); g.fillStyle = mix(COL.red, '#000000', 0.25); g.fill();
    limb(g, 118, 1484, 96, 1508, 3, 3, 952, 0.04); fill(g, '#7a5a3a', { lift: 3 });
    blob(g, 124, 1478, 10, 13, 0.6, 953, 0.06); fill(g, COL.navy, { lift: 3 });
    // a book open on the yellow towel, flip-flops beside it
    poly(g, [[396, 1446], [424, 1440], [426, 1478], [398, 1484]], 954, 1); fill(g, COL.white, { lift: 2 });
    poly(g, [[424, 1440], [452, 1446], [450, 1484], [426, 1478]], 955, 1); fill(g, '#f4f1e6', { lift: 2 });
    for (const s2 of [0, 1]) { blob(g, 470 + s2 * 20, 1520 + s2 * 6, 8, 18, 0.2, 956 + s2, 0.08); fill(g, COL.teal, { lift: 2 }); }
    // a striped beach ball by the teal towel
    blob(g, 770, 1446, 19, 19, 0, 958, 0.03); fill(g, COL.white, { lift: 6 });
    g.save(); blob(g, 770, 1446, 19, 19, 0, 958, 0.03); g.clip();
    for (let i = 0; i < 6; i += 2) { g.beginPath(); g.moveTo(770, 1446); g.arc(770, 1446, 24, (i / 6) * TAU, ((i + 1) / 6) * TAU); g.closePath(); g.fillStyle = [COL.coral, COL.teal, COL.yellow][i / 2]; g.fill(); }
    g.restore();
    // a dog chasing the wash up and down the wet sand
    paintDog(g, t);
    umbrella(560, 1440, 74, COL.coral, COL.white, 911);
    umbrella(870, 1520, 66, COL.teal, COL.yellow, 912);
    // the lifeguard's chair: a raised red platform; she sits on it facing the sea
    const LG = ctx && ctx.lifeguard ? ctx.lifeguard(t) : { mode: 'chair' };
    const cx = 178, cy = 1452;
    g.save(); g.globalAlpha = 0.25; poly(g, [[cx - 36 + 30, cy - 40 + 40], [cx + 36 + 30, cy - 40 + 40], [cx + 36 + 30, cy + 46 + 40], [cx - 36 + 30, cy + 46 + 40]], 921, 1); g.fillStyle = COL.shade; g.fill(); g.restore();
    for (const [lx, ly] of [[-32, -36], [32, -36], [-32, 42], [32, 42]]) { blob(g, cx + lx, cy + ly, 6, 6, 0, 922 + lx, 0.05); fill(g, COL.white, { lift: 4 }); }
    poly(g, [[cx - 40, cy - 46], [cx + 40, cy - 46], [cx + 40, cy + 30], [cx - 40, cy + 30]], 924, 1); fill(g, COL.red, { lift: 12 });
    poly(g, [[cx - 40, cy + 30], [cx + 40, cy + 30], [cx + 40, cy + 50], [cx - 40, cy + 50]], 925, 1); fill(g, COL.white, { lift: 10 });
    // the red rescue tube hanging on the chair (until she takes it)
    const onChair = !LG.mode || LG.mode === 'chair' || LG.mode === 'stand';
    if (onChair) { limb(g, cx + 46, cy - 30, cx + 50, cy + 40, 7, 7, 926, 0.03); fill(g, COL.red, { lift: 8 }); }
    if (onChair) {
      // sitting, she scans the water (her head sweeps the whole beach, fair to the test); standing, the whistle goes to
      // her mouth and then her arm points straight at Maya
      const lp = { seed: 930, skinC: SKIN[1], hairC: HAIR[4], suitC: COL.red, style: 'cap', capC: '#ffc233' };
      const k = LG.mode === 'stand' ? (LG.k ?? 1) : 0, point = LG.point || 0, whistle = LG.whistle || 0;
      const hy = cy - 12 - 12 * k;
      g.save(); g.translate(cx, cy - 10); g.scale(FIG * (1 + 0.14 * k), FIG * (1 + 0.14 * k)); g.translate(-cx, -(cy - 10));
      torso(g, cx, cy - 8 - 10 * k, 0, 46, 38, 30, 931); fill(g, COL.red, { lift: 14 + 8 * k });
      const [SL, SR] = shoulders(cx, cy - 6 - 10 * k, 0, 20);
      const look = LG.look ?? 0;
      // left hand: on her knee, then the whistle to her mouth
      arm2(g, SL[0], SL[1], lerp(cx - 28, cx + Math.sin(look) * 14, whistle), lerp(cy + 14 - 10 * k, hy - Math.cos(look) * 14, whistle),
        { L1: 22, L2: 22, color: lp.skinC, lift: 15 + 10 * k, seed: 932, ox: cx, oy: cy + 10 });
      // right hand: on her knee, then pointing at Maya, the arm straight
      arm2(g, SR[0], SR[1], lerp(cx + 28, SR[0] + Math.sin(LG.pointAt ?? look) * 50, point), lerp(cy + 14 - 10 * k, SR[1] - Math.cos(LG.pointAt ?? look) * 50, point),
        { L1: 24, L2: 25, color: lp.skinC, lift: 15 + 10 * k + 6 * point, seed: 936, ox: cx, oy: cy + 10 });
      head3(g, cx, hy, 18, lp, look, 0.12, { lift: 15 + 10 * k });
      if (whistle > 0.5) { blob(g, cx + Math.sin(look) * 18, hy - Math.cos(look) * 18, 4.5, 3.5, look, 935, 0.1); fill(g, '#cfd6da', { lift: 26 }); }
      g.restore();
    }
  }

  // a small paper dog running along the wet sand after the wash, ears flapping
  function paintDog(g, t) {
    const tt = tw(t);
    const u = (tt / 6.4) % 1;                                   // follows the wash's period
    const x = 760 + 120 * Math.sin(TAU * tt / 11), y = shoreY(760) + 40 - 26 * Math.sin(u * Math.PI);
    const dir = Math.cos(TAU * tt / 11) >= 0 ? 1 : -1;            // which way it runs
    const run = wave(tt, 0.36);
    g.save(); g.translate(x, y); g.scale(dir * 1.5, 1.5);
    for (const [lx, ly, k] of [[-14, -9, 1], [-14, 9, -1], [14, -9, -1], [14, 9, 1]]) { limb(g, lx, ly, lx + 9 * run * k, ly + (ly > 0 ? 9 : -9), 3, 2.5, 970 + lx + ly); fill(g, '#b07a45', { lift: 3 }); }
    blob(g, 0, 0, 22, 11, 0, 975, 0.08); fill(g, '#c98d52', { lift: 5 });
    limb(g, -20, 0, -34, -6 + 4 * run, 3.5, 2, 976); fill(g, '#c98d52', { lift: 5 });        // tail
    blob(g, 24, 0, 10, 9, 0, 977, 0.08); fill(g, '#c98d52', { lift: 6 });
    blob(g, 33, 0, 5, 4, 0, 978, 0.1); fill(g, '#3b2a1e', { lift: 6 });                      // nose
    for (const s2 of [-1, 1]) { blob(g, 20, s2 * 9, 6, 4, s2 * (0.5 + 0.3 * run), 979 + s2, 0.1); fill(g, '#8a5a30', { lift: 7 }); }  // ears
    g.restore();
  }

  // ------------------------------------------------------------------ waves: swell lines in the deep, foam where they break
  function paintSwell(g, t, pos, ctx) {
    const tt = tw(t);
    // broken foam parts around anyone standing or swimming in it (laid across someone it reads as a plank)
    const around = Object.values(pos || {}).map((q) => [q.x, q.y + 22]);
    const LGq = ctx && ctx.lifeguard ? ctx.lifeguard(t) : null;
    if (LGq && LGq.mode && LGq.mode !== 'chair' && LGq.mode !== 'stand') around.push([LGq.x, LGq.y + 30]);
    const near = (x, y) => around.some(([qx, qy]) => ((x - qx) / 70) ** 2 + ((y - qy) / 82) ** 2 < 1);
    for (let i = 0; i < 3; i++) {
      const cy = crestY(i, tt);
      if (cy < -100 || cy > 1400) continue;
      const pts = []; for (let x = -100; x <= W + 100; x += 22) pts.push([x, cy + 10 * sin(x * 0.01 + i) + 4 * sin(x * 0.043 + i * 2)]);
      const broken = pts.map(([x, y]) => y > edgeY(x) - 10);
      // a soft lighter band in the deep
      g.save(); g.globalAlpha = 0.16; strip(g, pts, 26, 300 + i, 0.2); g.fillStyle = '#d8fbff'; g.fill(); g.restore();
      // where it has reached the sandbar, it breaks: torn white foam, in pieces
      let run = [];
      const flush = (k) => {
        const big = 1 + 0.6 * Math.max(0, ...SETS.map(([a, b]) => clamp((tt - a) / 0.8) * clamp((b - tt) / 1.2)));
        if (run.length > 2) { strip(g, run, (9 + 5 * Math.sin(k)) * big, 320 + i * 17 + k, 0.55, 0.6); fill(g, COL.foam, { lift: 2 * big, alpha: 0.92 }); }
        run = [];
      };
      pts.forEach((pt, k) => {
        const gap = mulberry32(400 + i * 97 + k + Math.floor(tt / SWELL.T) * 13)() < 0.16;
        if (broken[k] && !gap && !near(pt[0], pt[1])) run.push(pt); else flush(k);
      });
      flush(99);
    }
    // the shore break: a foam band that rushes up and slides back
    const u = (tt / 6.4) % 1;
    const up = Math.sin(u * Math.PI);
    const pts = []; for (let x = -100; x <= W + 100; x += 22) pts.push([x, shoreY(x) - 70 + 52 * up + 6 * sin(x * 0.05 + u * 4)]);
    strip(g, pts, 14 + 10 * up, 501 + Math.floor(tt / 6.4), 0.6); fill(g, COL.foam, { lift: 2, alpha: 0.95 });
    const pts2 = pts.map(([x, y]) => [x, y - 34 + 8 * sin(x * 0.03)]);
    strip(g, pts2, 6, 502 + Math.floor(tt / 6.4), 0.6); fill(g, COL.foam, { lift: 1.5, alpha: 0.7 });
  }

  // sun glints on the deep water: small paper stars that wink on and off
  function paintGlints(g, t, pos) {
    const tt = tw(t);
    for (let i = 0; i < 26; i++) {
      const r0 = mulberry32(700 + i);
      const T = 1.2 + r0() * 2.4, ph = r0();
      const cyc = Math.floor(tt / T + ph);
      const r = mulberry32(700 + i * 131 + cyc * 7919);
      const x = r() * W, y = 300 + r() * 420;
      const u = ((tt / T + ph) % 1);
      if (u > 0.18) continue;
      if (pos && Object.values(pos).some((q) => Math.hypot(q.x - x, q.y - y) < 95)) continue;
      const k = Math.sin((u / 0.18) * Math.PI);
      g.save(); g.translate(x, y); g.globalAlpha = 0.9 * k;
      for (let j = 0; j < 2; j++) {                                          // one or two slivers, torn, lying flat
        const L = (10 + 14 * r()) * (0.6 + 0.4 * k), h = 2 + 1.6 * r(), ox = (r() - 0.5) * 16, oy = j * 6;
        poly(g, [[ox - L / 2, oy], [ox - L * 0.15, oy - h], [ox + L / 2, oy - h * 0.4], [ox + L * 0.2, oy + h * 0.6]], 7000 + i * 13 + j + cyc * 31, 0.8);
        g.fillStyle = COL.foam; g.fill();
      }
      g.restore();
    }
  }

  // the boat passing beyond the channel, and its wake; someone on it waves back
  function paintBoat(g, t, ctx) {
    const tt = tw(t);
    const bx = 660 + 4 * tt, by = 436 + 2 * wave(tt, 2.2);
    const wave2 = ctx && ctx.boatWave ? ctx.boatWave(t) : 0;
    // wake: two white lines spreading behind
    for (const s of [-1, 1]) {
      const pts = []; for (let k = 0; k < 5; k++) pts.push([bx - 70 - k * 26, by + s * (6 + k * 7) + 2 * sin(k + tt * 3)]);
      g.save(); g.globalAlpha = 0.75; strip(g, pts, 5, 610 + (s > 0 ? 1 : 2), 0.6); fill(g, COL.foam, { lift: 1 }); g.restore();
    }
    g.save(); g.translate(bx, by);
    poly(g, [[-70, -24], [36, -26], [78, 0], [36, 26], [-70, 24]], 620, 1); fill(g, COL.white, { lift: 10 });
    poly(g, [[-70, -24], [36, -26], [44, -20], [-64, -18]], 621, 0.8); fill(g, COL.navy, { lift: 0, shadow: false });
    poly(g, [[-20, -14], [14, -14], [14, 14], [-20, 14]], 622, 0.8); fill(g, '#d9e6ea', { lift: 3 });
    const bp = { seed: 640, skinC: SKIN[3], hairC: HAIR[0], suitC: COL.yellow };
    const w = wave2;
    torso(g, -44, 8, 0, 26, 22, 16, 642); fill(g, COL.yellow, { lift: 5 + 3 * w });
    if (w > 0.02) {                                                       // both arms up, a towel swinging between them
      const sw = wave(tt, 0.55);
      const lh = [-44 - 13 + 6 * sw, -16 - 8 * w], rh = [-44 + 13 + 6 * sw, -16 - 8 * w];   // within arm's reach, so the towel is in their hands
      arm2(g, -54, 6, lerp(-58, lh[0], w), lerp(16, lh[1], w), { L1: 15, L2: 15, r1: 4.5, r2: 4, color: bp.skinC, lift: 6 + 4 * w, seed: 643, ox: -44, oy: 20 });
      arm2(g, -34, 6, lerp(-30, rh[0], w), lerp(16, rh[1], w), { L1: 15, L2: 15, r1: 4.5, r2: 4, color: bp.skinC, lift: 6 + 4 * w, seed: 647, ox: -44, oy: 20 });
      if (w > 0.4) {
        const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([lerp(lh[0], rh[0], u), lerp(lh[1], rh[1], u) - 16 * Math.sin(u * Math.PI) - 10 * sw * Math.sin(u * TAU)]); }
        strip(g, pts, 16, 651, 0.12); fill(g, COL.white, { lift: 10 * w });
      }
    }
    head3(g, -44, 0, 12, bp, lerp(Math.PI / 2, 2.89, w), 0.2 * w, { expr: w > 0.3 ? 'laugh' : 'blank', lift: 5 + 3 * w });
    g.restore();
  }

  // gulls crossing high above, and their shadows on the water far below them
  function paintGulls(g, t) {
    const tt = tw(t);
    const fly = (x, y, s, ph, seed) => {
      const flap = wave(tt, 0.42, ph);
      // shadow first (offset, soft)
      g.save(); g.globalAlpha = 0.18; g.translate(x + 90, y + 120); g.scale(s, s);
      blob(g, 0, 0, 10, 26, 0, seed, 0.1); g.fillStyle = COL.shade; g.fill();
      for (const k of [-1, 1]) { limb(g, 0, -2, k * 52, -10 + 12 * flap, 7, 3, seed + k, 0.1); g.fill(); }
      g.restore();
      g.save(); g.translate(x, y); g.scale(s, s);
      for (const k of [-1, 1]) { limb(g, 0, -2, k * 52, -10 + 12 * flap, 7, 3, seed + k, 0.1); fill(g, '#9fb0b8', { lift: 10 }); }
      blob(g, 0, 0, 9, 24, 0, seed, 0.1); fill(g, COL.white, { lift: 12 });
      blob(g, 0, -20, 3, 4, 0, seed + 3, 0.1); fill(g, COL.yellow, { lift: 12 });
      g.restore();
    };
    const u = (tt - 4.0) / 6.0;
    if (u > -0.1 && u < 1.1) fly(lerp(-80, W + 80, u), lerp(980, 620, u), 1.0, 0.1, 801);
    const v = (tt - 24.0) / 7.0;
    if (v > -0.1 && v < 1.1) fly(lerp(W + 80, -80, v), lerp(560, 860, v), 0.85, 0.6, 811);
  }

  // ------------------------------------------------------------------ number tags (white paper discs)
  // every tag sits up and to the right of its person's head; these few sit elsewhere only where that spot is taken
  const TAG_AT = { 2: [0, -58], 6: [-44, -48], 15: [24, -60], 5: [-46, -40], 3: [-46, -40] };   // 6 and 15 each on their outer side (they overlapped); 15 and 3 well inside x 950
  function paintTags(g, t, pos, o = {}) {
    for (const p of PEOPLE) {
      const q = pos[p.n]; if (!q) continue;
      const off = o.lift ? o.lift(p.n) : 0;                     // 0 on the water .. 1 lifted away
      if (off >= 0.999) continue;
      const [ox, oy] = TAG_AT[p.n] || [40, -46];
      const x = q.x + ox, y = q.y + oy - 46 * off * off;
      const tr = mulberry32(1000 + p.n), rad = 29.5 + tr() * 3, rot = (tr() - 0.5) * 0.16 + 0.5 * off * (tr() - 0.5);
      g.save(); g.globalAlpha = 1 - Math.pow(clamp((off - 0.55) / 0.45), 2); g.translate(x, y); g.rotate(rot); g.scale(1 + 0.25 * off, 1 + 0.25 * off);
      blob(g, 0, 0, rad, rad * (0.96 + tr() * 0.06), tr() * 3, 1000 + p.n, 0.06); fill(g, COL.white, { lift: 4 + 26 * off, texA: 0.5 });
      g.fillStyle = COL.navy; g.font = '700 condensed 46px Bahn'; g.fontStretch = 'condensed'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(p.n), 0, 2);
      g.restore();
    }
  }

  // the lifeguard is drawn 25 % up like everyone, about her own head (ctx.lifeguard gives world coordinates)
  function lifeguardPass(g, t, ctx, pass) {
    const L = ctx && ctx.lifeguard ? ctx.lifeguard(t) : null;
    if (!L || L.mode === 'chair' || L.mode === 'stand') return;
    g.save(); g.translate(L.x, L.y); g.scale(FIG, FIG); g.translate(-L.x, -L.y);
    const L2 = { ...L, tube: null };
    DRAW.lifeguard(g, LIFEGUARD, t, pass, { lifeguard: () => L2 });
    g.restore();
    if (pass === 'above' && L.tube) DRAW.lifeguard(g, LIFEGUARD, t, 'above', { lifeguard: () => ({ ...L, mode: 'none' }) }) ;
  }

  // a paper piece set down again by hand on every step: a hair of shift and turn, seeded by the step (never random)
  function handled(g, p, t) {
    const r = mulberry32(p.seed * 977 + Math.floor(t * 15 + 1e-6) * 131 + 7);
    g.translate((r() - 0.5) * 1.6, (r() - 0.5) * 1.6); g.rotate((r() - 0.5) * 0.012);
  }

  // ------------------------------------------------------------------ the whole world
  // opts: { cam: { s, x, y } camera (scale about the frame centre, then a shift), ctx: story callbacks, tags: alpha(n) }
  function paint(g, t, opts = {}) {
    tiles();
    const cam = opts.cam || { s: 1, x: 0, y: 0 };
    const ctx = opts.ctx || {};
    if (ctx.sets) SETS = ctx.sets;
    g.save();
    g.translate(W / 2 + cam.x, H / 2 + cam.y); g.scale(cam.s, cam.s); g.translate(-W / 2, -H / 2);
    paintFloor(g, t);
    paintSand(g, t);
    const pos = {};
    // under the water (clipped to the water, so nothing under it shows on dry sand)
    g.save(); waterPath(g, t); g.clip();
    for (const p of PEOPLE) {
      const lk = FIG * (1 + 0.05 * lift(p.x, p.y, tw(t)));                 // a passing swell lifts them towards the lens
      g.save(); g.translate(p.x, p.y); handled(g, p, t); g.scale(lk, lk); g.translate(-p.x, -p.y);
      const q = DRAW[p.kind](g, p, t, 'under', ctx);
      g.restore();
      pos[p.n] = { ...q, x: p.x + (q.x - p.x) * FIG, y: p.y + (q.y - p.y) * FIG };
    }
    lifeguardPass(g, t, ctx, 'under');
    g.restore();
    paintSheet(g, t);
    paintSwell(g, t, pos, ctx);
    paintBeach(g, t, ctx);
    paintGlints(g, t, pos);
    paintBoat(g, t, ctx);
    // above the water
    for (const p of PEOPLE) {
      const lk = FIG * (1 + 0.05 * lift(p.x, p.y, tw(t)));
      g.save(); g.translate(p.x, p.y); handled(g, p, t); g.scale(lk, lk); g.translate(-p.x, -p.y);
      DRAW[p.kind](g, p, t, 'above', ctx);
      g.restore();
    }
    lifeguardPass(g, t, ctx, 'above');
    paintGulls(g, t);
    paintTags(g, t, pos, { lift: opts.tags });
    // one sheet of paper fibre over the whole picture, so every piece reads as paper
    grain(g, TILE, 0.35, false, 0, 0);
    g.restore();
    return pos;
  }

  window.BEACH = { paint, PEOPLE, PEOPLE_BY, COL, mayaState, shoreY, edgeY, depthAt };
})();
