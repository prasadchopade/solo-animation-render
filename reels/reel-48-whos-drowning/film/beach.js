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
  // (0 = towards the sea / top of frame, + clockwise); tag: where their number sits from the head
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
    { n: 14, kind: 'stander', x: 140, y: 936, skin: 4, hair: 2, suit: 'blue', rot: -0.1, T: 3.4, ph: 0.3 },
    { n: 8, kind: 'breast', x: 664, y: 1012, skin: 0, hair: 4, suit: 'coral', rot: -0.15, T: 1.9, ph: 0.1, style: 'flowercap' },
    { n: 6, kind: 'flailer', x: 778, y: 1130, skin: 1, hair: 0, suit: 'yellow', rot: 0.1, T: 0.5, ph: 0.0 },
    { n: 15, kind: 'brother', x: 884, y: 1156, skin: 1, hair: 0, suit: 'teal', rot: -1.0, T: 1.3, ph: 0.4 },
    { n: 10, kind: 'ringkid', x: 332, y: 1160, skin: 3, hair: 2, suit: 'pink', rot: 0.0, T: 2.2, ph: 0.2 },
    { n: 5, kind: 'mum', x: 236, y: 1206, skin: 3, hair: 2, suit: 'purple', rot: 0.9, T: 2.6, ph: 0.7, style: 'glassesUp' },
    { n: 12, kind: 'wader', x: 548, y: 1232, skin: 0, hair: 5, suit: 'navy', rot: 0.0, T: 3.0, ph: 0.5 },
  ];
  PEOPLE.forEach((p, i) => { p.seed = 100 + i * 37; p.skinC = SKIN[p.skin]; p.hairC = HAIR[p.hair]; p.suitC = COL[p.suit]; });

  // Maya's breath cycle: up (mouth out, one breath), then under. Irregular, never the same twice in a row.
  // returns s: 0 = face under, 1 = most of the face out; press: 0..1 as her arms push down
  function mayaCycle(t) {
    const r = (k) => { const q = mulberry32(5000 + k); return q(); };
    // cycle starts: a seeded irregular sequence of 3.6–5.4 s cycles, the first one already under way at t = 0
    let t0 = -1.2, k = 0;
    while (true) { const T = 3.6 + r(k) * 1.8; if (t < t0 + T) { const u = (t - t0) / T; return { u, k, T }; } t0 += T; k++; if (k > 200) return { u: 0, k, T: 4 }; }
  }
  function mayaState(t) {
    const { u } = mayaCycle(t);
    // 0.00–0.30 rising (arms press), 0.30–0.48 out (a breath), 0.48–0.78 sinking, 0.78–1.00 under
    let s;
    if (u < 0.3) s = Math.sin((u / 0.3) * Math.PI / 2);
    else if (u < 0.48) s = 1 - 0.12 * ((u - 0.3) / 0.18);
    else if (u < 0.78) s = 0.88 * (1 - (u - 0.48) / 0.3);
    else s = 0;
    const press = u < 0.34 ? Math.sin((u / 0.34) * Math.PI) : 0.25 * Math.max(0, Math.sin(((u - 0.34) / 0.66) * Math.PI * 3));
    return { s: clamp(s), press, u };
  }

  // the small ripples a person leaves: rings that grow and fade, one every period
  function ripples(g, x, y, rx, ry, t, period, seed, strength = 1) {
    for (let k = 0; k < 2; k++) {
      const u = ((t / period + k * 0.5 + (seed % 7) * 0.13) % 1);
      const a = (1 - u) * 0.55 * strength;
      if (a < 0.02) continue;
      g.save();
      g.globalAlpha = a; g.strokeStyle = COL.foam; g.lineWidth = 2.2;
      blob(g, x, y, rx * (1 + u * 0.9), ry * (1 + u * 0.9), 0, seed + k, 0.06, 0);
      g.stroke();
      g.restore();
    }
  }

  // ------------------------------------------------------------------ body parts (top-down)
  // a head seen from above, face level: hair on top, a sliver of face on the side it looks towards
  function headTop(g, x, y, r, p, look, o = {}) {
    const st = o.style ?? p.style, L = o.lift ?? 3;
    const capped = st === 'cap' || st === 'flowercap';
    g.save();
    blob(g, x, y, r, r * 1.05, look, p.seed + 1, 0.04);
    fill(g, st === 'bald' ? mix(p.skinC, '#ff6f61', 0.3) : p.skinC, { lift: L });
    const back = (k) => [x - Math.sin(look) * r * k, y + Math.cos(look) * r * k];   // towards the back of the head
    if (st !== 'bald') {
      g.save();
      blob(g, x, y, r, r * 1.05, look, p.seed + 1, 0.04); g.clip();
      const [hx, hy] = back(capped ? 0.2 : 0.42);
      blob(g, hx, hy, r * (capped ? 1.12 : 1.08), r * 1.0, look, p.seed + 2, st === 'curly' ? 0.2 : 0.08);
      g.fillStyle = st === 'cap' ? (p.capC || COL.pink) : st === 'flowercap' ? '#fbfbf6' : p.hairC; g.fill();
      g.restore();
    } else {   // a sunburnt crown with a shine
      blob(g, x - r * 0.25, y - r * 0.3, r * 0.3, r * 0.18, -0.6, p.seed + 4, 0.1); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill();
    }
    if (st === 'curly') for (let i = 0; i < 9; i++) {
      const a = look + Math.PI + (i - 4) * 0.42;
      blob(g, x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92, r * 0.28, r * 0.28, 0, p.seed + 50 + i, 0.1);
      fill(g, p.hairC, { lift: L + 0.5, rim: false });
    }
    if (st === 'bun') { const [bx, by] = back(0.78); blob(g, bx, by, r * 0.46, r * 0.43, 0, p.seed + 60, 0.08); fill(g, p.hairC, { lift: L + 2 }); }
    if (st === 'braids') for (const s2 of [-1, 1]) {
      const [bx, by] = back(0.85), px = Math.cos(look) * s2 * r * 0.42, py = Math.sin(look) * s2 * r * 0.42;
      limb(g, bx + px, by + py, bx + px - Math.sin(look) * r * 1.15, by + py + Math.cos(look) * r * 1.15, r * 0.2, r * 0.13, p.seed + 70 + s2, 0.15);
      fill(g, p.hairC, { lift: L + 0.5 });
    }
    if (st === 'flowercap') for (let i = 0; i < 3; i++) {
      const a = (i * TAU) / 3 + 0.5;
      const fx = x + Math.cos(a) * r * 0.42, fy = y + Math.sin(a) * r * 0.42;
      blob(g, fx, fy, r * 0.42, r * 0.42, a, p.seed + 80 + i, 0.22); fill(g, COL.pink, { lift: L + 1 });
      blob(g, fx, fy, r * 0.14, r * 0.14, 0, p.seed + 85 + i, 0.1); fill(g, COL.yellow, { lift: L + 1.5, rim: false });
    }
    if (st === 'glassesUp') for (const s2 of [-1, 1]) {
      const px = Math.cos(look) * s2 * r * 0.36, py = Math.sin(look) * s2 * r * 0.36;
      blob(g, x + px, y + py, r * 0.3, r * 0.22, look, p.seed + 90 + s2, 0.06); fill(g, COL.navy, { lift: L + 1 });
    }
    // nose tip on the face side
    const nx = x + Math.sin(look) * r * 0.98, ny = y - Math.cos(look) * r * 0.98;
    blob(g, nx, ny, r * 0.16, r * 0.14, look, p.seed + 3, 0.1);
    fill(g, mix(p.skinC, '#000000', 0.08), { shadow: false });
    g.restore();
  }

  // hair floating round a head that lies back in the water: a soft fan of tapering locks, drifting slowly
  function hairFan(g, x, y, r, color, tt, seed, alpha = 0.85) {
    for (let i = 0; i < 8; i++) {
      const a0 = -Math.PI / 2 + (i - 3.5) * 0.3;
      const L = r * (1.05 + 0.3 * sin(i * 2.3 + seed * 0.01 + 1)), w0 = r * 0.44;
      const left = [], right = [];
      for (let k = 0; k <= 8; k++) {
        const u = k / 8;
        const a = a0 + 0.5 * sin(u * 2.6 + i * 1.7 + tt * 0.9) * u;
        const d = r * 0.75 + L * u;
        const cx2 = x + Math.cos(a) * d, cy2 = y - r * 0.15 + Math.sin(a) * d;
        const w = w0 * (1 - 0.6 * u), nx = -Math.sin(a), ny = Math.cos(a);
        left.push([cx2 + nx * w, cy2 + ny * w]); right.push([cx2 - nx * w, cy2 - ny * w]);
      }
      g.beginPath();
      left.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py)));
      for (let k = right.length - 1; k >= 0; k--) g.lineTo(right[k][0], right[k][1]);
      g.closePath();
      fill(g, color, { lift: 0.5, rim: false, alpha });
    }
  }

  // a face turned up to the sky (seen whole): used for Maya, the floater, the boy shouting
  function faceUp(g, x, y, r, p, o = {}) {
    const lift = o.lift ?? 3;
    // hair spread round the head, floating
    if (o.hairSpread) hairFan(g, x, y, r, o.hairColor || p.hairC, o.tt || 0, p.seed, o.hairAlpha ?? 0.85);
    blob(g, x, y, r * 0.92, r * 1.08, 0, p.seed + 5, 0.035);
    fill(g, o.skin || p.skinC, { lift, shadow: o.shadow });
    // hairline across the top of the face
    g.save();
    blob(g, x, y, r * 0.92, r * 1.08, 0, p.seed + 5, 0.035); g.clip();
    blob(g, x, y - r * 1.02, r * 1.05, r * 0.5, 0, p.seed + 6, 0.12);
    g.fillStyle = o.hairColor || p.hairC; g.fill();
    if (o.strand) {      // a wet strand across the forehead
      P.limb(g, x - r * 0.7, y - r * 0.55, x + r * 0.15, y - r * 0.18, r * 0.12, r * 0.07, p.seed + 7, 0.2);
      g.fillStyle = o.hairColor || p.hairC; g.fill();
    }
    g.restore();
    const ink = o.ink || mix(p.skinC, '#1b1410', 0.72);
    g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round';
    if (o.glasses) {
      blob(g, x - r * 0.38, y - r * 0.12, r * 0.3, r * 0.22, 0, p.seed + 8, 0.06); g.fillStyle = COL.navy; g.fill();
      blob(g, x + r * 0.38, y - r * 0.12, r * 0.3, r * 0.22, 0, p.seed + 9, 0.06); g.fill();
      g.lineWidth = 2.2; g.strokeStyle = COL.navy; g.beginPath(); g.moveTo(x - r * 0.1, y - r * 0.14); g.lineTo(x + r * 0.1, y - r * 0.14); g.stroke();
    } else if (o.eyes === 'closed') {
      g.lineWidth = Math.max(1.6, r * 0.09);
      for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * r * 0.36, y - r * 0.12, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
    } else {
      for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * r * 0.36, y - r * 0.1, r * 0.085, 0, TAU); g.fill(); }
    }
    // mouth
    const m = o.mouth ?? 0.3;   // 0 closed .. 1 wide open
    if (m > 0.05) {
      blob(g, x, y + r * 0.5, r * (0.18 + 0.14 * m), r * (0.08 + 0.2 * m), 0, p.seed + 10, 0.1);
      g.fillStyle = '#5a1f1a'; g.fill();
    } else {
      g.lineWidth = Math.max(1.6, r * 0.08); g.beginPath(); g.arc(x, y + r * 0.38, r * 0.2, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    }
  }

  // an upright body below its head, foreshortened: shoulders, a torso, hips, legs (top-down with a slight tilt)
  function torsoPath(g, x, y, sw, len, rot, seed) {
    g.save(); g.translate(x, y); g.rotate(rot);
    poly(g, [[-sw / 2, 0], [sw / 2, 0], [sw * 0.4, len * 0.6], [sw * 0.34, len], [-sw * 0.34, len], [-sw * 0.4, len * 0.6]], seed, 1.0);
    g.restore();
  }

  // ------------------------------------------------------------------ each person: two passes, 'under' and 'above'
  const DRAW = {};

  // Maya: upright, head back, face to the sky, mouth at the water; arms out to her sides pressing down; no kick
  DRAW.maya = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const ov = ctx && ctx.maya ? ctx.maya(tt) : null;               // the story's choreography, after the answer
    const nat = mayaState(tt);
    const st = ov ? { s: ov.s ?? nat.s, press: ov.press ?? nat.press } : nat;
    const held = ov && ov.held ? ov.held : 0, cough = ov && ov.cough ? ov.cough : 0;
    const x = p.x + 2 * sin(tt * 0.7) + (ov && ov.dx ? ov.dx / FIG : 0);
    const y = p.y + 3 * (1 - st.s) * (1 - held) + 2 * wave(tt, 3.1) + (ov && ov.dy ? ov.dy / FIG : 0) - 2 * cough;
    const r = 21;
    const d = depthAt(x, y);
    // the T of her arms, or (held) her hands on the tube across her chest
    const armPts = (s2, press) => {
      const sp = 0.55 + 0.25 * press;
      const sx = x + s2 * 20, sy = y + 18;
      const ex0 = sx + s2 * 34, ey0 = sy + 10 - 6 * press;
      const hx0 = ex0 + s2 * 28 * sp, hy0 = ey0 + 4 - 8 * press;
      const ex = lerp(ex0, x + s2 * 34, held), ey = lerp(ey0, y + 40, held);
      const hx = lerp(hx0, x + s2 * 22, held), hy = lerp(hy0, y + 50, held);
      return { sx, sy, ex, ey, hx, hy };
    };
    if (pass === 'under') {
      // her body, straight down below her head, fading into the deep water
      g.save(); g.globalAlpha = 0.55;
      torsoPath(g, x, y + 16, 46, 44, 0, p.seed + 20); g.fillStyle = under(p.suitC, d + 0.6); g.fill();
      g.restore();
      for (const s2 of [-1, 1]) {
        const A = armPts(s2, st.press);
        g.save(); g.globalAlpha = 0.9;
        limb(g, A.sx, A.sy, A.ex, A.ey, 7, 6, p.seed + 21 + s2); g.fillStyle = under(p.skinC, d * 0.6); g.fill();
        limb(g, A.ex, A.ey, A.hx, A.hy, 6, 5, p.seed + 23 + s2); g.fill();
        blob(g, A.hx, A.hy, 7, 6, 0, p.seed + 25 + s2, 0.1); g.fill();
        g.restore();
      }
      // the whole face, under the sheet (seen through the water when she sinks)
      g.save(); g.globalAlpha = 0.95;
      faceUp(g, x, y, r, p, { tt, hairSpread: true, strand: true, eyes: 'closed', mouth: 0.25, shadow: false,
        skin: under(p.skinC, 0.55), hairColor: under(p.hairC, 0.4), ink: under('#3a2418', 0.4) });
      g.restore();
    } else if (pass === 'above') {
      // her arms at the surface, pressing down: half out of the water, laced with foam (or, held, resting on the tube)
      for (const s2 of [-1, 1]) {
        const A = armPts(s2, st.press);
        limb(g, A.sx, A.sy, A.ex, A.ey, 7, 6, p.seed + 21 + s2); fill(g, mix(p.skinC, WATER, 0.1), { lift: 1.2 + 2 * held });
        limb(g, A.ex, A.ey, A.hx, A.hy, 6, 5, p.seed + 23 + s2); fill(g, mix(p.skinC, WATER, (0.1 + 0.12 * (1 - st.press)) * (1 - held)), { lift: 1.2 + 2 * held });
        if (held > 0.5) { blob(g, A.hx, A.hy, 6.5, 6, 0, p.seed + 27 + s2, 0.1); fill(g, p.skinC, { lift: 4 }); }
        if (held < 0.5) {
          g.save(); g.globalAlpha = 0.85 * (1 - held * 2); g.strokeStyle = COL.foam; g.lineWidth = 2; g.lineCap = 'round';
          for (const u of [0.28, 0.6, 0.92]) {
            const qx = lerp(A.sx, A.hx, u), qy = lerp(A.sy, A.hy, u);
            g.beginPath(); g.moveTo(qx - 3, qy - 8); g.quadraticCurveTo(qx + s2 * 4, qy, qx - 3, qy + 8); g.stroke();
          }
          g.restore();
        }
      }
      // her hair floats at the surface round her head, whether her face is out or under
      hairFan(g, x, y, r, mix(p.hairC, WATER_DEEP, 0.18), tt, p.seed, 0.85);
      // the part of her face above the water: an island round her nose and mouth that shrinks as she sinks
      if (st.s > 0.02) {
        const k = Math.max(st.s, held);
        g.save();
        blob(g, x, y + r * 0.22 * (1 - held), r * (0.25 + 0.75 * k) + 4 * held, r * (0.3 + 0.85 * k) + 4 * held, 0, p.seed + 30 + Math.floor(tt * 7.5) % 3, 0.12);
        g.clip();
        faceUp(g, x, y, r, p, { tt, strand: held < 0.5, eyes: k > 0.75 ? 'open' : 'closed', mouth: cough > 0.3 ? 0.95 : 0.35 + 0.5 * st.press * (1 - held), lift: 2 + 2 * held });
        g.restore();
        g.save(); g.globalAlpha = 0.85; g.strokeStyle = COL.foam; g.lineWidth = 2.2;
        blob(g, x, y + r * 0.22 * (1 - held), r * (0.25 + 0.75 * k) + 5.5 * held + 1.5, r * (0.3 + 0.85 * k) + 5.5 * held + 1.5, 0, p.seed + 31, 0.12); g.stroke();
        g.restore();
      }
      // a cough: a little spray of water off her mouth
      if (cough > 0.05) {
        for (let i = 0; i < 6; i++) {
          const rr = mulberry32(p.seed * 17 + i);
          const a = -Math.PI / 2 + (rr() - 0.5) * 1.6, dd = 10 + 26 * cough * (0.6 + rr() * 0.6);
          g.save(); g.globalAlpha = 0.9 * (1 - cough * 0.6);
          blob(g, x + cos(a) * dd, y + r * 0.5 + sin(a) * dd, 2.5 + rr() * 2.5, 2 + rr() * 2, a, p.seed + 160 + i, 0.2); fill(g, COL.foam, { lift: 6 });
          g.restore();
        }
      }
      // splashes where her hands press near the surface
      if (held < 0.3) for (const s2 of [-1, 1]) {
        const A = armPts(s2, st.press);
        if (st.press > 0.35) {
          g.save(); g.globalAlpha = clamp((st.press - 0.35) * 2.2) * 0.9;
          for (let i = 0; i < 4; i++) {
            const a = -Math.PI / 2 + (i - 1.5) * 0.7 + s2 * 0.4;
            blob(g, A.hx + cos(a) * 9, A.hy + sin(a) * 9, 4.5, 3, a, p.seed + 60 + i, 0.2);
            fill(g, COL.foam, { lift: 1.5 });
          }
          g.restore();
        }
        ripples(g, A.hx, A.hy, 9, 7, tt, 1.3, p.seed + 70 + s2, 0.8);
      }
      ripples(g, x, y + 8, 26, 22, tt, 1.6, p.seed + 80, 0.9);
    }
    return { x, y, under: st.s < 0.02 && held < 0.5 };
  };

  // the floater: on her back, flat on the surface, arms and legs spread, sunglasses, still (quiet, face up, and fine)
  DRAW.floater = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + 3 * sin(tt * 0.3), y = p.y + 2 * wave(tt, p.T, p.ph);
    const rot = p.rot + 0.06 * sin(tt * 0.25);
    const d = depthAt(x, y);
    g.save(); g.translate(x, y); g.rotate(rot);
    if (pass === 'under') {
      for (const s of [-1, 1]) {   // arms out, legs apart, a little under
        limb(g, s * 22, 22, s * 62, 6, 7, 6, p.seed + 1 + s); g.fillStyle = under(p.skinC, Math.min(d, 1.2) * 0.5); g.fill();
        limb(g, s * 12, 86, s * 30, 150, 10, 7, p.seed + 3 + s); g.fill();
      }
    } else if (pass === 'above') {
      // torso and face out of the water (crisp)
      torsoPath(g, 0, 18, 50, 72, 0, p.seed + 5); fill(g, p.suitC, { lift: 2 });
      blob(g, 0, 50, 20, 10, 0, p.seed + 6, 0.08); fill(g, mix(p.suitC, '#ffffff', 0.25), { shadow: false });
      for (const s of [-1, 1]) { blob(g, s * 18, 148, 6, 8, 0, p.seed + 7 + s, 0.1); fill(g, p.skinC, { lift: 1.5 }); }  // toes up
      faceUp(g, 0, 0, 20, p, { glasses: true, mouth: 0.0, lift: 2, hairSpread: true, tt, hairAlpha: 0.85 });
      ripples(g, 0, 70, 50, 100, tt, 2.6, p.seed + 9, 0.5);
    }
    g.restore();
    return { x, y };
  };

  // front crawl, heading left across the channel
  DRAW.crawl = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x - 3 * tt, y = p.y + 2 * wave(tt, 2.3, 0.2);
    const ph = (tt / p.T + p.ph) % 1;
    g.save(); g.translate(x, y); g.rotate(p.rot);
    if (pass === 'under') {
      torsoPath(g, 0, 16, 44, 70, 0, p.seed + 1); g.fillStyle = under(p.suitC, 0.9); g.fill();
      for (const s of [-1, 1]) { limb(g, s * 10, 86, s * 12 + 4 * wave(tt, 0.5, s * 0.25), 150, 9, 7, p.seed + 2 + s); g.fillStyle = under(p.skinC, 1.1); g.fill(); }
      // the arm under water, pulling back
      const a = ph < 0.5 ? ph * 2 : (ph - 0.5) * 2;
      const side = ph < 0.5 ? 1 : -1;
      limb(g, side * 18, 16, side * 22, lerp(-50, 70, a), 7, 6, p.seed + 5); g.fillStyle = under(p.skinC, 0.8); g.fill();
    } else if (pass === 'above') {
      // the recovering arm swings forward out of the water
      const a = ph < 0.5 ? ph * 2 : (ph - 0.5) * 2;
      const side = ph < 0.5 ? -1 : 1;
      const ax = side * (22 + 26 * sin(a * Math.PI)), ay = lerp(70, -55, a);
      limb(g, side * 18, 14, ax, ay, 7.5, 6.5, p.seed + 6); fill(g, p.skinC, { lift: 4 });
      blob(g, 0, 22, 18, 22, 0, p.seed + 7, 0.06); fill(g, p.suitC, { lift: 1.5 });    // the back at the surface
      headTop(g, 0, 0, 21, p, 0.6 * sin(TAU * ph) * (side), { lift: 2 });
      g.restore(); g.save();
      // kick foam at the feet
      g.translate(x, y); g.rotate(p.rot);
      for (let i = 0; i < 5; i++) {
        const u = ((tt * 3 + i * 0.21) % 1);
        g.save(); g.globalAlpha = 0.85 * (1 - u);
        blob(g, (i - 2) * 6, 150 + u * 26, 6 + u * 4, 4 + u * 3, 0, p.seed + 20 + i, 0.25); fill(g, COL.foam, { lift: 1 });
        g.restore();
      }
    }
    g.restore();
    if (pass === 'above') ripples(g, x, y, 30, 24, tt, 1.1, p.seed + 30, 0.6);
    return { x, y };
  };

  // snorkeler: face down, a tube up, fins kicking
  DRAW.snorkel = (g, p, t, pass) => {
    const tt = tw(t);
    const dive = tt > 10.4 && tt < 12.0;            // under: only his shape through the water
    if (dive && pass === 'above') {
      const u = (tt - 10.4) / 1.6;
      if (u < 0.25) {                               // fins flip up as he goes down
        g.save(); g.translate(p.x, p.y + 150);
        limb(g, -10, 0, -12, -26, 9, 6, p.seed + 91); fill(g, COL.sky, { lift: 6 });
        limb(g, 10, 0, 12, -26, 9, 6, p.seed + 92); fill(g, COL.sky, { lift: 6 });
        g.restore();
      }
      ripples(g, p.x, p.y + 60, 30, 40, tt, 0.8, p.seed + 93, 1);
      return { x: p.x, y: p.y };
    }
    if (pass === 'above' && tt >= 12.0 && tt < 12.8) {   // the spout from his tube as he surfaces
      const u = (tt - 12.0) / 0.8;
      for (let i = 0; i < 6; i++) {
        g.save(); g.globalAlpha = 1 - u;
        blob(g, p.x + 10 + (i - 2.5) * 5 * u, p.y - 40 - 26 * Math.sin(u * Math.PI) - i * 4, 4, 4, 0, p.seed + 94 + i, 0.2);
        fill(g, COL.foam, { lift: 10 });
        g.restore();
      }
    }
    const x = p.x + 3 * sin(tt * 0.2), y = p.y - 3 * tt * 0.2 + 1.5 * wave(tt, 2.9);
    g.save(); g.translate(x, y); g.rotate(p.rot);
    if (pass === 'under') {
      torsoPath(g, 0, 16, 46, 72, 0, p.seed + 1); g.fillStyle = under(p.suitC, 1.1); g.fill();
      for (const s of [-1, 1]) {
        const k = 6 * wave(tt, p.T, s * 0.25);
        limb(g, s * 11, 86, s * 12 + k, 148, 9, 7, p.seed + 2 + s); g.fillStyle = under(p.skinC, 1.3); g.fill();
        blob(g, s * 12 + k, 168, 11, 22, 0.1 * s, p.seed + 4 + s, 0.08); g.fillStyle = under(COL.sky, 1.0); g.fill();   // fins
        limb(g, s * 20, 22, s * 26, 80, 7, 6, p.seed + 6 + s); g.fillStyle = under(p.skinC, 1.2); g.fill();          // arms by the sides
      }
      headTop(g, 0, 0, 18, { ...p, skinC: under(p.skinC, 1.0), hairC: under(p.hairC, 0.9) }, Math.PI, { lift: 0 });
    } else if (pass === 'above') {
      blob(g, 0, 26, 16, 20, 0, p.seed + 8, 0.08); fill(g, p.suitC, { lift: 1.5 });     // the back breaks the surface
      limb(g, 8, -4, 10, -34, 4.5, 4, p.seed + 9, 0.04); fill(g, COL.yellow, { lift: 6 }); // the tube sticks up
      blob(g, 10, -36, 5.5, 5.5, 0, p.seed + 10, 0.05); fill(g, COL.red, { lift: 6 });
      for (const s of [-1, 1]) {                                                         // splashes at the fins
        const u = ((tt / p.T + (s > 0 ? 0 : 0.5)) % 1);
        g.save(); g.globalAlpha = 0.8 * (1 - u);
        blob(g, s * 12, 176 + u * 12, 7, 5, 0, p.seed + 11 + s, 0.25); fill(g, COL.foam, { lift: 1 });
        g.restore();
      }
    }
    g.restore();
    if (pass === 'above') ripples(g, x, y + 20, 24, 30, tt, 1.8, p.seed + 30, 0.45);
    return { x, y };
  };

  // treading water in the deep, upright, chatting: head level, arms sculling in front under water, legs kicking
  DRAW.tread = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + 2 * sin(tt * 0.4 + p.ph * 6), y = p.y + 2.5 * wave(tt, p.T, p.ph);
    const look = p.rot + 0.12 * sin(tt * 0.9 + p.ph * 5);
    const d = depthAt(x, y);
    if (pass === 'under') {
      g.save(); g.globalAlpha = 0.6;
      torsoPath(g, x, y + 14, 48, 46, 0, p.seed + 1); g.fillStyle = under(p.suitC, d * 0.8); g.fill();
      for (const s of [-1, 1]) {      // sculling: forearms sweep in small arcs in front of the chest
        const a = look + s * (0.9 + 0.35 * wave(tt, 1.2, s * 0.25));
        const ex = x + s * 22, ey = y + 18;
        limb(g, ex, ey, ex + sin(a) * 40, ey - cos(a) * 20 + 10, 7, 6, p.seed + 2 + s); g.fillStyle = under(p.skinC, d * 0.55); g.fill();
      }
      for (const s of [-1, 1]) {      // the legs kick, faint below
        const k = 7 * wave(tt, 0.7, s * 0.5);
        g.save(); g.globalAlpha = 0.45;
        limb(g, x + s * 10, y + 58, x + s * 14 + k, y + 96, 9, 7, p.seed + 4 + s); g.fillStyle = under(p.skinC, d * 1.1 + 0.6); g.fill();
        g.restore();
      }
      g.restore();
    } else if (pass === 'above') {
      blob(g, x, y + 14, 27, 12, 0, p.seed + 6, 0.06); fill(g, p.skinC, { lift: 1.5 });   // shoulders at the surface
      const laughUp = p.n === 16 ? clamp(Math.sin(TAU * (tt / 6.8 + 0.1)) * 4 - 3) : 0;
      const duck = p.n === 16 && tt > 6.3 && tt < 7.3;
      if (duck) ripples(g, x, y, 26, 22, tt, 0.4, p.seed + 33, 1);
      else if (laughUp > 0.5) faceUp(g, x, y - 2, 20, p, { mouth: 0.8, eyes: 'closed', lift: 4 });
      else headTop(g, x, y, 20, p, look, { lift: 3 });
      // a hand comes up now and then while she talks
      const gest = clamp(sin(TAU * (tt / 5.5 + p.ph)) * 3 - 2);
      if (gest > 0) {
        const s = p.rot > 0 ? 1 : -1;
        limb(g, x + s * 22, y + 12, x + s * 30 + sin(look) * 24, y - 6 - 10 * gest, 6, 5, p.seed + 8); fill(g, p.skinC, { lift: 4 });
      }
      ripples(g, x, y + 10, 30, 22, tt, 1.4, p.seed + 30, 0.6);
      // little swirls from the kick behind
      ripples(g, x, y + 44, 14, 10, tt, 0.7, p.seed + 31, 0.35);
    }
    return { x, y };
  };

  // the two friends: chest-deep on the sandbar, facing each other, splashing (loud, and fine)
  DRAW.splash = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const R = ctx && ctx.friend ? ctx.friend(p.n, tt) : null;       // {stop, look, shout, armsUp, reach: {x, y, k}}
    const stop = R ? R.stop || 0 : 0;
    const x = p.x + 2 * sin(tt * 0.5 + p.ph * 3), y = p.y + 2 * wave(tt, 2.2, p.ph);
    const look = R && R.look != null ? R.look : p.rot;
    const ph = (tt / p.T + p.ph) % 1;          // one sweep of the arm per period
    const side = Math.floor(tt / p.T + p.ph) % 2 ? 1 : -1;
    const d = depthAt(x, y);
    if (pass === 'under') {
      torsoPath(g, x, y + 14, 50, 48, 0, p.seed + 1); g.fillStyle = under(p.suitC, d * 0.5); g.fill();
      for (const s of [-1, 1]) {
        limb(g, x + s * 10, y + 58, x + s * 12, y + 92, 9, 8, p.seed + 2 + s); g.fillStyle = under(p.skinC, d * 0.6); g.fill();
      }
      // shadow on the sandbar floor
      g.save(); g.globalAlpha = 0.16; blob(g, x + 26, y + 70, 30, 44, 0.3, p.seed + 5, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      blob(g, x, y + 12, 28, 13, 0, p.seed + 6, 0.06); fill(g, p.skinC, { lift: 1.5 });
      if (stop < 0.5) {
        // the splashing arm sweeps across the surface towards the other one; the other arm rests
        const sw = Math.sin(ph * Math.PI);
        const base = look + side * 1.2;
        const a = base - side * 1.6 * ph;
        const ax = x + sin(a) * 52, ay = y + 10 - cos(a) * 36;
        limb(g, x + side * 20, y + 12, ax, ay, 7, 6, p.seed + 7); fill(g, p.skinC, { lift: 3 + 3 * sw });
        limb(g, x - side * 20, y + 12, x - side * 34, y + 30, 7, 6, p.seed + 8); fill(g, p.skinC, { lift: 2 });
      } else {
        // stopped: arms up and waving for help, or one arm reaching out, or both resting
        const up = R.armsUp || 0, rk = R.reach;
        for (const s2 of [-1, 1]) {
          let ex, ey, lift = 2;
          if (rk && s2 === -1 && rk.k > 0) { ex = lerp(x - 30, p.x + (rk.x - p.x) / FIG, rk.k); ey = lerp(y + 30, p.y + (rk.y - p.y) / FIG, rk.k); lift = 3; }
          else if (up > 0) {
            const a2 = look + s2 * (0.35 + 0.25 * wave(tt, 0.45, s2 > 0 ? 0 : 0.5));
            ex = x + s2 * 18 + sin(a2) * 44 * up; ey = y + 8 - cos(a2) * 44 * up; lift = 4 + 6 * up;
          } else { ex = x + s2 * 34; ey = y + 30; }
          limb(g, x + s2 * 20, y + 12, ex, ey, 7, 6, p.seed + 7 + s2); fill(g, p.skinC, { lift });
          blob(g, ex, ey, 6.5, 6.5, 0, p.seed + 11 + s2, 0.1); fill(g, p.skinC, { lift });
        }
      }
      if (R && R.shout > 0.3) faceUp(g, x, y, 20, p, { mouth: 0.9, eyes: 'open', lift: 4 });
      else headTop(g, x, y, 20, p, look + 0.15 * sin(tt * 3) * (1 - stop), { lift: 3 });
      // the sheet of water thrown at the friend: white paper drops flying along `look`
      if (stop < 0.5 && ph > 0.25 && ph < 0.95) {
        const u = (ph - 0.25) / 0.7;
        for (let i = 0; i < 9; i++) {
          const rr = mulberry32(p.seed * 13 + i + Math.floor(tt / p.T) * 101);
          const spread = (rr() - 0.5) * 0.9, dist = 30 + u * (70 + rr() * 50);
          const dx = sin(look + spread) * dist, dy = -cos(look + spread) * dist * 0.8 - 18 * Math.sin(u * Math.PI);
          g.save(); g.globalAlpha = 0.95 * (1 - u * 0.7);
          blob(g, x + dx, y + dy, 4 + rr() * 6, 3 + rr() * 4, rr() * 3, p.seed + 40 + i, 0.25); fill(g, COL.foam, { lift: 4 + 8 * Math.sin(u * Math.PI) });
          g.restore();
        }
      }
      ripples(g, x, y + 16, 34, 26, tt, 0.9, p.seed + 30, 0.7);
    }
    return { x, y };
  };

  // the lifeguard once she's off her chair. ctx.lifeguard(t) = {mode, x, y, dir, u, tube}; x, y is her head (world).
  // dir: the way she's heading (0 = out to sea); u: her stroke or stride phase. She draws herself 25 % up like everyone.
  DRAW.lifeguard = (g, p, t, pass, ctx) => {
    const L = ctx && ctx.lifeguard ? ctx.lifeguard(t) : null;
    if (!L || L.mode === 'chair' || L.mode === 'stand') return { x: p.x, y: p.y };
    const tt = tw(t), x = L.x, y = L.y, dir = L.dir || 0, u = L.u || 0;
    const red = p.suitC, skin = p.skinC;
    const inWater = L.mode !== 'run';
    g.save(); g.translate(x, y); g.rotate(dir);
    if (L.mode === 'run' || L.mode === 'wade') {
      const k = Math.sin(TAU * u), hop = L.mode === 'run' ? 1 : 0.6;
      if (pass === (inWater ? 'under' : 'above')) {                       // legs: a stride along the way she runs
        for (const s2 of [-1, 1]) {
          const fy = 40 + 46 - 30 * k * s2 * hop;
          limb(g, s2 * 9, 44, s2 * 11, fy, 9, 7, p.seed + 40 + s2);
          if (inWater) { g.fillStyle = under(skin, 0.3); g.fill(); } else fill(g, skin, { lift: 3 });
        }
      }
      if (pass === 'above') {
        torsoPath(g, 0, 12, 44, 34, 0, p.seed + 41); fill(g, red, { lift: 5 });
        for (const s2 of [-1, 1]) {                                        // arms swing against the legs
          const hy = 16 + 28 * k * s2;
          limb(g, s2 * 20, 14, s2 * 26, hy, 6.5, 5.5, p.seed + 42 + s2); fill(g, skin, { lift: 6 });
        }
        limb(g, 26, 16 + 28 * k, 30, 16 + 28 * k + 70, 7, 7, p.seed + 45, 0.03); fill(g, '#e5352a', { lift: 6 });   // the tube in her hand
        headTop(g, 0, 0, 19, p, 0, { lift: 6 });
        if (L.mode === 'wade') {                                           // splashes kicked up at each step
          for (let i = 0; i < 6; i++) {
            const rr = mulberry32(p.seed * 7 + i + Math.floor(tt * 7.5) * 13);
            g.save(); g.globalAlpha = 0.9;
            blob(g, (rr() - 0.5) * 70, 50 + rr() * 50, 4 + rr() * 5, 3 + rr() * 4, rr() * 3, p.seed + 60 + i, 0.25); fill(g, COL.foam, { lift: 4 });
            g.restore();
          }
        }
      }
    } else if (L.mode === 'dive' || L.mode === 'swim' || L.mode === 'tow') {
      const ph = u % 1, side = ph < 0.5 ? -1 : 1, a = ph < 0.5 ? ph * 2 : (ph - 0.5) * 2;
      if (pass === 'under') {
        torsoPath(g, 0, 16, 44, 70, 0, p.seed + 1); g.fillStyle = under(red, 0.7); g.fill();
        for (const s2 of [-1, 1]) { limb(g, s2 * 10, 86, s2 * 12 + 5 * wave(tt, 0.4, s2 * 0.25), 150, 9, 7, p.seed + 2 + s2); g.fillStyle = under(skin, 0.9); g.fill(); }
        limb(g, -side * 18, 16, -side * 22, lerp(-50, 70, a), 7, 6, p.seed + 5); g.fillStyle = under(skin, 0.7); g.fill();
      } else {
        const ax = side * (22 + 26 * Math.sin(a * Math.PI)), ay = lerp(70, -55, a);
        limb(g, side * 18, 14, ax, ay, 7.5, 6.5, p.seed + 6); fill(g, skin, { lift: 4 });
        blob(g, 0, 22, 18, 22, 0, p.seed + 7, 0.06); fill(g, red, { lift: 1.5 });
        headTop(g, 0, 0, 20, { ...p, style: 'cap', capC: '#ffc233' }, 0.5 * Math.sin(TAU * ph), { lift: 2 });
        for (let i = 0; i < 5; i++) {                                     // kick foam
          const w2 = ((tt * 3 + i * 0.21) % 1);
          g.save(); g.globalAlpha = 0.85 * (1 - w2);
          blob(g, (i - 2) * 6, 150 + w2 * 26, 6 + w2 * 4, 4 + w2 * 3, 0, p.seed + 20 + i, 0.25); fill(g, COL.foam, { lift: 1 });
          g.restore();
        }
        if (L.mode === 'dive') {                                           // the splash where she went in
          for (let i = 0; i < 10; i++) {
            const rr = mulberry32(p.seed * 11 + i), aa = rr() * TAU, dd = 30 + 50 * (L.splash || 0) * rr();
            g.save(); g.globalAlpha = 0.95 * (1 - (L.splash || 0) * 0.5);
            blob(g, cos(aa) * dd, 40 + sin(aa) * dd, 5 + rr() * 6, 4 + rr() * 5, aa, p.seed + 80 + i, 0.25); fill(g, COL.foam, { lift: 6 });
            g.restore();
          }
        }
      }
    } else if (L.mode === 'hold') {
      // behind her (towards the shore), her arms round the tube across Maya's chest
      if (pass === 'under') {
        torsoPath(g, 0, 16, 46, 50, 0, p.seed + 1); g.fillStyle = under(red, 0.8); g.fill();
        for (const s2 of [-1, 1]) { limb(g, s2 * 10, 60, s2 * 14 + 6 * wave(tt, 0.6, s2 * 0.3), 104, 9, 7, p.seed + 2 + s2); g.fillStyle = under(skin, 1.0); g.fill(); }
      } else {
        blob(g, 0, 12, 26, 12, 0, p.seed + 3, 0.06); fill(g, skin, { lift: 2 });
        headTop(g, 0, 0, 19, { ...p, style: 'cap', capC: '#ffc233' }, 0, { lift: 3 });
      }
    }
    g.restore();
    // the tube on its line: trailing behind her as she swims, then across Maya's chest
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

  // the man waving at the boat: waist-deep, both arms up, facing the sea; his shadow and feet show on the sand
  DRAW.waver = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const x = p.x, y = p.y + 1.5 * wave(tt, 2.8);
    const waving = ctx && ctx.waving ? ctx.waving(t) : 0;   // 0 still .. 1 waving hard
    const d = depthAt(x, y);
    if (pass === 'under') {
      for (const s of [-1, 1]) {
        limb(g, x + s * 12, y + 50, x + s * 15, y + 92, 10, 8, p.seed + 1 + s); g.fillStyle = under(p.skinC, d * 0.4); g.fill();
        blob(g, x + s * 15, y + 96, 8, 6, 0, p.seed + 3 + s, 0.1); g.fill();
      }
      blob(g, x, y + 46, 22, 12, 0, p.seed + 5, 0.06); g.fillStyle = under(p.suitC, d * 0.35); g.fill();   // shorts under
      g.save(); g.globalAlpha = 0.18; blob(g, x + 34, y + 84, 28, 60, 0.35, p.seed + 6, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      torsoPath(g, x, y + 12, 56, 32, 0, p.seed + 7); fill(g, p.skinC, { lift: 3 });
      for (const s of [-1, 1]) {
        const a = s * (0.25 + 0.4 * waving * (0.5 + 0.5 * wave(tt, 0.5, s > 0 ? 0 : 0.5))) + (1 - waving) * s * 2.6;
        const L = 30 + 30 * waving;
        const ex = x + s * 24 + sin(a) * L, ey = y + 10 - cos(a) * L * (0.4 + 0.8 * waving);
        limb(g, x + s * 24, y + 12, ex, ey, 8, 7, p.seed + 8 + s); fill(g, p.skinC, { lift: 4 + 6 * waving });
        blob(g, ex, ey, 7.5, 7.5, 0, p.seed + 10 + s, 0.1); fill(g, p.skinC, { lift: 4 + 6 * waving });
      }
      headTop(g, x, y, 21, p, p.rot, { lift: 4 });
      ripples(g, x, y + 40, 32, 18, tt, 1.5, p.seed + 30, 0.6);
    }
    return { x, y };
  };

  // the man standing chest-deep with his arms folded, looking out (quiet, upright, and fine): his feet show on the sand
  DRAW.stander = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x, y = p.y + 1.2 * wave(tt, p.T, p.ph);
    const look = p.rot + 0.25 * sin(tt * 0.35);
    const d = depthAt(x, y);
    if (pass === 'under') {
      torsoPath(g, x, y + 22, 54, 40, 0, p.seed + 1); g.fillStyle = under(p.suitC, d * 0.45); g.fill();
      for (const s of [-1, 1]) {
        limb(g, x + s * 12, y + 60, x + s * 15, y + 98, 10, 8, p.seed + 2 + s); g.fillStyle = under(p.skinC, d * 0.5); g.fill();
        blob(g, x + s * 15, y + 102, 8, 6, 0, p.seed + 4 + s, 0.1); g.fill();
      }
      g.save(); g.globalAlpha = 0.2; blob(g, x + 36, y + 90, 30, 64, 0.35, p.seed + 6, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      blob(g, x, y + 16, 31, 14, 0, p.seed + 7, 0.06); fill(g, p.skinC, { lift: 2 });            // shoulders
      limb(g, x - 24, y + 22, x + 22, y + 26, 7.5, 7.5, p.seed + 8); fill(g, mix(p.skinC, '#000', 0.06), { lift: 3 });   // folded arms
      limb(g, x + 24, y + 20, x - 20, y + 30, 7.5, 7.5, p.seed + 9); fill(g, p.skinC, { lift: 3.5 });
      // a white cap; he tips his head back to watch the gull go over
      const up = clamp((tt - 4.4) / 0.4) * clamp((8.6 - tt) / 0.5);
      if (up > 0.5) {
        faceUp(g, x, y - 3, 21, p, { mouth: 0.0, lift: 4, hairColor: COL.white });
        blob(g, x, y - 27, 14, 7, 0, p.seed + 10, 0.08); fill(g, '#e9eef0', { lift: 4.5 });
      } else {
        headTop(g, x, y, 21, { ...p, hairC: COL.white }, look, { lift: 3 });
        const bx = x + sin(look) * 20, by = y - cos(look) * 20;
        blob(g, bx, by, 13, 8, look, p.seed + 10, 0.08); fill(g, '#e9eef0', { lift: 3.5 });
      }
      ripples(g, x, y + 24, 36, 18, tt, 2.0, p.seed + 30, 0.55);
    }
    return { x, y };
  };

  // breaststroke, heading out: head up, arms sweeping, frog kick
  DRAW.breast = (g, p, t, pass) => {
    const tt = tw(t);
    const ph = (tt / p.T + p.ph) % 1;
    const glide = ph < 0.4 ? ph / 0.4 : 1;
    const x = p.x + 2 * sin(tt * 0.3), y = p.y - 8 * tt * 0.25 - 6 * Math.sin(glide * Math.PI);
    g.save(); g.translate(x, y); g.rotate(p.rot);
    if (pass === 'under') {
      torsoPath(g, 0, 18, 44, 66, 0, p.seed + 1); g.fillStyle = under(p.suitC, 0.45); g.fill();
      const out = ph < 0.4 ? Math.sin((ph / 0.4) * Math.PI) : 0;
      for (const s of [-1, 1]) {
        limb(g, s * 18, 18, s * (16 + 30 * out), -30 + 40 * out, 7, 6, p.seed + 2 + s); g.fillStyle = under(p.skinC, 0.75); g.fill();
        const kick = ph > 0.45 ? Math.sin(((ph - 0.45) / 0.55) * Math.PI) : 0;
        limb(g, s * 10, 84, s * (14 + 20 * kick), 120 + 10 * (1 - kick), 9, 7, p.seed + 4 + s); g.fillStyle = under(p.skinC, 0.95); g.fill();
      }
    } else if (pass === 'above') {
      blob(g, 0, 22, 20, 14, 0, p.seed + 6, 0.06); fill(g, p.suitC, { lift: 1.5 });
      headTop(g, 0, 0, 19, p, 0, { lift: 3 });
    }
    g.restore();
    if (pass === 'above') ripples(g, x, y + 10, 30, 22, tt, p.T, p.seed + 30, 0.6);
    return { x, y };
  };

  // the boy who fakes "HELP!": waist-deep in the shallows, arms flailing, face up shouting; then laughing; dunked
  DRAW.flailer = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const S = ctx && ctx.boy ? ctx.boy(t) : { flail: 0, laugh: 0, dunk: 0 };
    const x = p.x + 3 * S.flail * sin(tt * 9), y = p.y + 1.5 * wave(tt, 1.7) + 10 * S.dunk;
    const d = depthAt(x, y);
    if (pass === 'under') {
      for (const s of [-1, 1]) {
        limb(g, x + s * 11, y + 50, x + s * 14, y + 86, 9, 7, p.seed + 1 + s); g.fillStyle = under(p.skinC, d * 0.4); g.fill();
      }
      blob(g, x, y + 44, 20, 11, 0, p.seed + 3, 0.06); g.fillStyle = under(p.suitC, d * 0.35); g.fill();
      g.save(); g.globalAlpha = 0.18; blob(g, x + 30, y + 76, 24, 50, 0.35, p.seed + 4, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
      if (S.dunk > 0.5) faceUp(g, x, y, 18, p, { mouth: 0.2, eyes: 'closed', shadow: false, skin: under(p.skinC, 0.5), hairColor: under(p.hairC, 0.5) });
    } else if (pass === 'above') {
      if (S.dunk > 0.5) { ripples(g, x, y + 6, 30, 24, tt, 0.5, p.seed + 31, 1); return { x, y }; }
      torsoPath(g, x, y + 12, 50, 30, 0, p.seed + 5); fill(g, p.skinC, { lift: 3 });
      for (const s of [-1, 1]) {
        const a = s * (0.4 + 0.9 * S.flail * (0.5 + 0.5 * wave(tt, 0.36, s > 0 ? 0 : 0.5))) + (1 - S.flail) * s * 2.4;
        const L = 28 + 26 * S.flail;
        const ex = x + s * 22 + sin(a) * L, ey = y + 10 - cos(a) * L * (0.4 + 0.7 * S.flail);
        limb(g, x + s * 22, y + 12, ex, ey, 7, 6, p.seed + 6 + s); fill(g, p.skinC, { lift: 4 + 6 * S.flail });
        blob(g, ex, ey, 7, 7, 0, p.seed + 8 + s, 0.1); fill(g, p.skinC, { lift: 4 + 6 * S.flail });
      }
      if (S.flail > 0.3 || S.laugh > 0.3) faceUp(g, x, y, 19, p, { mouth: 0.9, eyes: S.laugh > 0.5 ? 'closed' : 'open', lift: 4 });
      else headTop(g, x, y, 19, p, p.rot, { lift: 3 });
      // the splashes of flailing arms
      if (S.flail > 0.2) {
        for (let i = 0; i < 6; i++) {
          const rr = mulberry32(p.seed * 7 + i + Math.floor(tt * 7.5) * 31);
          g.save(); g.globalAlpha = 0.9 * S.flail;
          blob(g, x + (rr() - 0.5) * 110, y + (rr() - 0.7) * 70, 4 + rr() * 5, 3 + rr() * 4, rr() * 3, p.seed + 50 + i, 0.25); fill(g, COL.foam, { lift: 5 });
          g.restore();
        }
      }
      ripples(g, x, y + 30, 30, 18, tt, 0.6 + 0.6 * (1 - S.flail), p.seed + 30, 0.7 + 0.3 * S.flail);
    }
    return { x, y };
  };

  // his brother: waist-deep beside him; reaches over and dunks him
  DRAW.brother = (g, p, t, pass, ctx) => {
    const tt = tw(t);
    const S = ctx && ctx.boy ? ctx.boy(t) : { flail: 0, laugh: 0, dunk: 0, reach: 0 };
    const x = p.x - 12 * S.reach, y = p.y + 1.5 * wave(tt, 1.9, 0.3);
    const d = depthAt(x, y);
    if (pass === 'under') {
      for (const s of [-1, 1]) { limb(g, x + s * 10, y + 46, x + s * 13, y + 80, 8, 7, p.seed + 1 + s); g.fillStyle = under(p.skinC, d * 0.4); g.fill(); }
      blob(g, x, y + 40, 18, 10, 0, p.seed + 3, 0.06); g.fillStyle = under(p.suitC, d * 0.35); g.fill();
      g.save(); g.globalAlpha = 0.18; blob(g, x + 28, y + 70, 22, 46, 0.35, p.seed + 4, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      torsoPath(g, x, y + 11, 46, 28, 0, p.seed + 5); fill(g, p.skinC, { lift: 3 });
      const tx = p.x + (PEOPLE_BY[6].x - p.x) / FIG, ty = p.y + (PEOPLE_BY[6].y - p.y) / FIG;
      for (const s of [-1, 1]) {
        const rx = lerp(x + s * 30, tx + s * 10, S.reach), ry = lerp(y + 26, ty + 2, S.reach);
        limb(g, x + s * 20, y + 11, rx, ry, 6.5, 5.5, p.seed + 6 + s); fill(g, p.skinC, { lift: 3 + 3 * S.reach });
      }
      headTop(g, x, y, 17, p, p.rot, { lift: 3 });
      ripples(g, x, y + 26, 26, 16, tt, 1.2, p.seed + 30, 0.6);
    }
    return { x, y };
  };

  // the small kid in a pink ring, and his mum standing beside him holding it (quiet, and fine)
  DRAW.ringkid = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + 3 * sin(tt * 0.5), y = p.y + 2 * wave(tt, p.T, p.ph);
    if (pass === 'under') {
      for (const s of [-1, 1]) { limb(g, x + s * 7, y + 26, x + s * 9 + 4 * wave(tt, 0.9, s * 0.3), y + 56, 6, 5, p.seed + 1 + s); g.fillStyle = under(p.skinC, 0.5); g.fill(); }
    } else if (pass === 'above') {
      // the duck float: a yellow ring with a duck's head at the front and a tail behind
      blob(g, x, y + 14, 40, 34, 0, p.seed + 2, 0.03); fill(g, COL.yellow, { lift: 3 });
      blob(g, x, y + 54, 12, 9, 0, p.seed + 9, 0.1); fill(g, COL.yellow, { lift: 3 });
      blob(g, x, y - 26, 17, 16, 0, p.seed + 10, 0.05); fill(g, COL.yellow, { lift: 5 });
      blob(g, x, y - 44, 8, 7, 0, p.seed + 11, 0.1); fill(g, COL.orange, { lift: 5.5 });
      for (const s2 of [-1, 1]) { g.beginPath(); g.arc(x + s2 * 7, y - 30, 2.6, 0, TAU); g.fillStyle = COL.navy; g.fill(); }
      blob(g, x, y + 14, 20, 16, 0, p.seed + 3, 0.05); g.fillStyle = under(p.suitC, 0.4); g.fill();   // the hole, water inside
      for (const s of [-1, 1]) { limb(g, x + s * 12, y + 10, x + s * 32, y + 4, 5, 4.5, p.seed + 4 + s); fill(g, p.skinC, { lift: 4 }); }  // arms on the ring
      headTop(g, x, y, 14, p, p.rot + 0.3 * sin(tt * 0.6), { lift: 4 });
    }
    return { x, y };
  };
  DRAW.mum = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x, y = p.y + 1.2 * wave(tt, p.T, p.ph);
    const d = depthAt(x, y);
    if (pass === 'under') {
      for (const s of [-1, 1]) { limb(g, x + s * 11, y + 48, x + s * 13, y + 84, 9, 8, p.seed + 1 + s); g.fillStyle = under(p.skinC, d * 0.4); g.fill(); }
      blob(g, x, y + 42, 21, 11, 0, p.seed + 3, 0.06); g.fillStyle = under(p.suitC, d * 0.35); g.fill();
      g.save(); g.globalAlpha = 0.18; blob(g, x + 30, y + 76, 24, 50, 0.35, p.seed + 4, 0.1); g.fillStyle = COL.shade; g.fill(); g.restore();
    } else if (pass === 'above') {
      torsoPath(g, x, y + 12, 50, 30, 0, p.seed + 5); fill(g, p.suitC, { lift: 3 });
      blob(g, x, y + 10, 26, 10, 0, p.seed + 6, 0.06); fill(g, p.skinC, { lift: 2 });
      const k = { x: p.x + (PEOPLE_BY[10].x - p.x) / FIG, y: p.y + (PEOPLE_BY[10].y - p.y) / FIG };
      limb(g, x + 20, y + 12, k.x - 34, k.y + 18, 7, 6, p.seed + 7); fill(g, p.skinC, { lift: 4 });   // a hand on the ring
      limb(g, x - 20, y + 12, x - 30, y + 34, 7, 6, p.seed + 8); fill(g, p.skinC, { lift: 3 });
      headTop(g, x, y, 19, p, p.rot, { lift: 3 });
      ripples(g, x, y + 30, 32, 18, tt, 1.8, p.seed + 30, 0.55);
    }
    return { x, y };
  };

  // the older woman wading knee-deep at the shore in a wide straw hat, arms out for balance
  DRAW.wader = (g, p, t, pass) => {
    const tt = tw(t);
    const x = p.x + 10 * sin(tt * 0.12), y = p.y;
    if (pass === 'under') {
      for (const s of [-1, 1]) { limb(g, x + s * 12, y + 56, x + s * 15, y + 94, 9, 7, p.seed + 1 + s); g.fillStyle = under(p.skinC, 0.25); g.fill(); }
    } else if (pass === 'above') {
      torsoPath(g, x, y + 14, 50, 46, 0, p.seed + 3); fill(g, p.suitC, { lift: 4 });
      for (const s of [-1, 1]) {
        const a = s * (1.55 + 0.15 * wave(tt, 2.4, s * 0.3));
        limb(g, x + s * 22, y + 16, x + s * 22 + sin(a) * 50, y + 16 - cos(a) * 20, 7, 6, p.seed + 4 + s); fill(g, p.skinC, { lift: 5 });
      }
      // the hat covers her head from above
      blob(g, x, y, 31, 30, 0.2, p.seed + 6, 0.05); fill(g, COL.straw, { lift: 6 });
      g.save(); g.strokeStyle = 'rgba(150, 100, 40, 0.35)'; g.lineWidth = 1.4;
      for (let i = 1; i < 3; i++) { blob(g, x, y, 31 - i * 8, 30 - i * 8, 0.2, p.seed + 6, 0.05); g.stroke(); }
      g.restore();
      blob(g, x, y, 16, 15, 0.2, p.seed + 7, 0.05); fill(g, mix(COL.straw, '#ffffff', 0.15), { lift: 2 });
      ripples(g, x, y + 70, 30, 14, tt, 1.1, p.seed + 30, 0.9);
      limb(g, x - 20, y + 2, x + 20, y + 2, 3.5, 3.5, p.seed + 8, 0.02); g.fillStyle = COL.coral; g.fill();   // the ribbon
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
    blob(g, 316, 1424, 54, 40, 0, 941, 0.08); g.fillStyle = COL.wet; g.fill();
    blob(g, 316, 1424, 40, 28, 0, 942, 0.06); fill(g, '#e0c48c', { lift: 4 });
    for (const [dx, dy] of [[-22, -12], [22, -12], [-22, 14], [22, 14]]) { blob(g, 316 + dx, 1424 + dy, 11, 11, 0, 943 + dx + dy, 0.08); fill(g, '#e8cf99', { lift: 7 }); }
    blob(g, 316, 1424, 15, 15, 0, 947, 0.06); fill(g, '#ecd6a4', { lift: 9 });
    limb(g, 316, 1424, 318, 1392, 1.6, 1.6, 948, 0.02); fill(g, '#7a5a3a', { lift: 12 });
    poly(g, [[318, 1392], [344, 1399], [318, 1406]], 949, 1); fill(g, COL.coral, { lift: 12 });
    blob(g, 384, 1408, 17, 17, 0, 950, 0.05); fill(g, COL.red, { lift: 6 });
    blob(g, 384, 1408, 12, 12, 0, 951, 0.05); g.fillStyle = mix(COL.red, '#000000', 0.25); g.fill();
    limb(g, 262, 1452, 238, 1480, 3, 3, 952, 0.04); fill(g, '#7a5a3a', { lift: 3 });
    blob(g, 268, 1446, 10, 13, 0.6, 953, 0.06); fill(g, COL.navy, { lift: 3 });
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
      const lp = { seed: 930, skinC: SKIN[1], hairC: HAIR[4], suitC: COL.red };
      const standing = LG.mode === 'stand' ? (LG.k ?? 1) : 0;
      g.save(); g.translate(cx, cy - 10); g.scale(FIG * (1 + 0.12 * standing), FIG * (1 + 0.12 * standing)); g.translate(-cx, -(cy - 10));
      torsoPath(g, cx, cy - 8 - 8 * standing, 46, 30, 0, 931); fill(g, COL.red, { lift: 14 + 8 * standing });
      for (const s2 of [-1, 1]) {
        const toMouth = standing > 0.5 && s2 > 0;                          // the whistle to her mouth
        const ex = toMouth ? cx + 8 : cx + s2 * 30, ey = toMouth ? cy - 34 : cy + 14 - 10 * standing;
        limb(g, cx + s2 * 20, cy - 6 - 8 * standing, ex, ey, 6.5, 5.5, 932 + s2); fill(g, lp.skinC, { lift: 15 + 10 * standing });
      }
      headTop(g, cx, cy - 12 - 10 * standing, 18, lp, LG.look ?? 0.1, { lift: 15 + 10 * standing });
      if (standing > 0.5) { blob(g, cx + 6, cy - 36, 5, 4, 0, 935, 0.1); fill(g, '#cfd6da', { lift: 26 }); }
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
  function paintSwell(g, t) {
    const tt = tw(t);
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
        const big = 1 + 0.9 * Math.max(0, ...SETS.map(([a, b]) => clamp((tt - a) / 0.8) * clamp((b - tt) / 1.2)));
        if (run.length > 2) { strip(g, run, (9 + 5 * Math.sin(k)) * big, 320 + i * 17 + k, 0.55); fill(g, COL.foam, { lift: 2 * big, alpha: 0.92 }); }
        run = [];
      };
      pts.forEach((pt, k) => {
        const gap = mulberry32(400 + i * 97 + k + Math.floor(tt / SWELL.T) * 13)() < 0.16;
        if (broken[k] && !gap) run.push(pt); else flush(k);
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
      g.save(); g.translate(x, y); g.globalAlpha = 0.95 * k; g.fillStyle = COL.foam;
      const s = 4 + 5 * k;
      g.beginPath(); g.moveTo(0, -s * 1.6); g.lineTo(s * 0.35, -s * 0.35); g.lineTo(s * 1.6, 0); g.lineTo(s * 0.35, s * 0.35);
      g.lineTo(0, s * 1.6); g.lineTo(-s * 0.35, s * 0.35); g.lineTo(-s * 1.6, 0); g.lineTo(-s * 0.35, -s * 0.35); g.closePath(); g.fill();
      g.restore();
    }
  }

  // the boat passing beyond the channel, and its wake; someone on it waves back
  function paintBoat(g, t, ctx) {
    const tt = tw(t);
    const bx = 660 + 10 * tt, by = 436 + 2 * wave(tt, 2.2);
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
    headTop(g, -44, 0, 12, bp, Math.PI / 2, { lift: 4 });
    if (wave2 > 0) { const a = -0.4 + 0.6 * wave(tt, 0.5); limb(g, -44, -8, -44 + sin(a) * 26, -8 - cos(a) * 26, 4.5, 4, 641); fill(g, bp.skinC, { lift: 7 }); }
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
  const TAG_AT = { 2: [0, -58], 15: [40, -50], 5: [-46, -40], 3: [44, -40] };
  function paintTags(g, t, pos, o = {}) {
    for (const p of PEOPLE) {
      const q = pos[p.n]; if (!q) continue;
      const a = o.alpha ? o.alpha(p.n) : 1;
      if (a <= 0.01) continue;
      const [ox, oy] = TAG_AT[p.n] || [40, -46];
      const x = q.x + ox, y = q.y + oy;
      const tr = mulberry32(1000 + p.n), rad = 29.5 + tr() * 3, rot = (tr() - 0.5) * 0.16;
      g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot);
      blob(g, 0, 0, rad, rad * (0.96 + tr() * 0.06), tr() * 3, 1000 + p.n, 0.06); fill(g, COL.white, { lift: 4, texA: 0.5 });
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
      g.save(); g.translate(p.x, p.y); g.scale(lk, lk); g.translate(-p.x, -p.y);
      const q = DRAW[p.kind](g, p, t, 'under', ctx);
      g.restore();
      pos[p.n] = { ...q, x: p.x + (q.x - p.x) * FIG, y: p.y + (q.y - p.y) * FIG };
    }
    lifeguardPass(g, t, ctx, 'under');
    g.restore();
    paintSheet(g, t);
    paintSwell(g, t);
    paintBeach(g, t, ctx);
    paintGlints(g, t, pos);
    paintBoat(g, t, ctx);
    // above the water
    for (const p of PEOPLE) {
      const lk = FIG * (1 + 0.05 * lift(p.x, p.y, tw(t)));
      g.save(); g.translate(p.x, p.y); g.scale(lk, lk); g.translate(-p.x, -p.y);
      DRAW[p.kind](g, p, t, 'above', ctx);
      g.restore();
    }
    lifeguardPass(g, t, ctx, 'above');
    paintGulls(g, t);
    paintTags(g, t, pos, { alpha: opts.tags });
    // one sheet of paper fibre over the whole picture, so every piece reads as paper
    grain(g, TILE, 0.35, false, 0, 0);
    g.restore();
    return pos;
  }

  window.BEACH = { paint, PEOPLE, PEOPLE_BY, COL, mayaState, shoreY, edgeY, depthAt };
})();
