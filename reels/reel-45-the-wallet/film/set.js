// Reel 45 · The Wallet: the set, new for this reel. Early evening (reel 42 is golden hour): a chai stall under a blue tarp with
// one warm bulb, a wooden bench in front of it, and to the left a street that runs away to a corner with a lamp post, its shops
// lit, the sky going from peach to blue. World units are metres; the ground is y = 0, the bench runs along x, the street along z.
// Every function draws with the reel's camera and is a pure function of its arguments.
(() => {
  const R = window.RIG, { mix, rgba } = R, P3 = R.poly3, TAU = Math.PI * 2, PI = Math.PI;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // ------------------------------------------------------------------ where things are
  const BENCH = { x0: -1.55, x1: 0.70, z0: 0.0, z1: 0.40, y: 0.46 };
  const COUNTER = { x0: -0.25, x1: 3.0, z0: 1.30, z1: 1.95, y: 0.98 };
  const BACKWALL = 3.0;
  const SIDE = { x0: 0.80, x1: 1.36, z0: -0.30, z1: 1.30, y: 0.98 };   // the stall's side counter, along his left (the bench's end against it)
  const KETTLE = { x: 1.02, z: 0.30, y: 1.04, r: 0.19, h: 0.40 };   // a big steel stall kettle on a low stand, on the side counter at his left shoulder
  const BULB = [1.25, 2.12, 1.55];
  const ROAD = { x0: -7.6, x1: -2.0, y: -0.15 }, KERB = 0, FARX = -9.6, NEARX = -1.6;   // both pavements at y 0, the road a kerb lower
  const CORNER = { x: -2.35, z: 11.6 };                              // where you stop: the lamp post at the side lane's mouth

  // a box with its visible faces shaded (colours: top, side x, side z), drawn far face first
  function box(g, cam, x0, x1, y0, y1, z0, z1, top, sx, sz, o = {}) {
    const F = [];
    if (cam.y > y1) F.push([[[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], top]);
    if (cam.y < y0 && o.bottom) F.push([[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], o.bottom]);
    if (cam.x < x0) F.push([[[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], sx]);
    if (cam.x > x1) F.push([[[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], sx]);
    if (cam.z < z0) F.push([[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], sz]);
    if (cam.z > z1) F.push([[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], sz]);
    for (const [pts, c] of F) if (c) P3(g, cam, pts, c);
  }
  const glowAt = (g, cam, p, r, col, a) => { const q = cam.P(p[0], p[1], p[2]); if (!q) return; const rr = Math.max(2, r * q[2]); const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], rr, 0, TAU); g.fill(); };

  // ------------------------------------------------------------------ the sky and the far street (the back layer)
  function sky(g, cam, W, H) {
    const hz = cam.P(cam.x + Math.sin(cam.yaw) * 1000, cam.y, cam.z + Math.cos(cam.yaw) * 1000), y = hz ? hz[1] : H * 0.4;
    const q = g.createLinearGradient(0, y - 1400, 0, y + 200);
    q.addColorStop(0, '#1d2a4f'); q.addColorStop(0.45, '#3d4f80'); q.addColorStop(0.78, '#a3809a'); q.addColorStop(0.93, '#f0a77c'); q.addColorStop(1, '#f6c08e');
    g.fillStyle = q; g.fillRect(0, 0, W, H);
  }
  // a facade: a vertical rectangle in the plane x = X (facing +x or -x), from z0 to z1, up to height h, with floors of windows
  function facade(g, cam, X, z0, z1, h, col, seed, face = 1) {
    if (!P3(g, cam, [[X, 0, z0], [X, h, z0], [X, h, z1], [X, 0, z1]], col)) return;
    const fl = Math.floor((h - 3.2) / 3.0), nw = Math.max(1, Math.floor((z1 - z0) / 2.2));
    for (let f = 0; f < fl; f++) for (let w = 0; w < nw; w++) {
      const k = seed * 31 + f * 7 + w, lit = hash(k) < 0.42, wz0 = z0 + (w + 0.28) * (z1 - z0) / nw, wz1 = wz0 + (z1 - z0) / nw * 0.44, y0 = 3.6 + f * 3.0, y1 = y0 + 1.5;
      P3(g, cam, [[X + face * 0.01, y0, wz0], [X + face * 0.01, y1, wz0], [X + face * 0.01, y1, wz1], [X + face * 0.01, y0, wz1]], lit ? mix('#ffcf8a', '#ff9f5a', hash(k + 3)) : mix(col, '#1a1c2c', 0.45));
      if (hash(k + 9) < 0.3) P3(g, cam, [[X + face * 0.25, y0 - 0.15, wz0 - 0.1], [X + face * 0.25, y0 + 0.05, wz0 - 0.1], [X + face * 0.25, y0 + 0.05, wz1 + 0.1], [X + face * 0.25, y0 - 0.15, wz1 + 0.1]], mix(col, '#20202a', 0.3));   // a balcony's lip
    }
    // the shop at its foot: a lit opening or a painted shutter, and a board above (no words)
    const sh = hash(seed + 0.5) < 0.6, b0 = z0 + 0.4, b1 = z1 - 0.4;
    P3(g, cam, [[X + face * 0.02, 0.05, b0], [X + face * 0.02, 2.6, b0], [X + face * 0.02, 2.6, b1], [X + face * 0.02, 0.05, b1]], sh ? '#f2c27e' : mix('#7a8a9a', col, 0.3));
    if (sh) P3(g, cam, [[X + face * 0.03, 0.05, b0 + 0.3], [X + face * 0.03, 2.2, b0 + 0.3], [X + face * 0.03, 2.2, b1 - 0.3], [X + face * 0.03, 0.05, b1 - 0.3]], '#ffe0a8');
    P3(g, cam, [[X + face * 0.06, 2.75, b0], [X + face * 0.06, 3.35, b0], [X + face * 0.06, 3.35, b1], [X + face * 0.06, 2.75, b1]], ['#c0392b', '#2e6da4', '#e2b33c', '#7b3fa0', '#2a8a7a'][Math.floor(hash(seed + 2) * 5)]);
  }
  function far(g, cam, t) {
    // the road and both pavements
    const RY = ROAD.y;
    P3(g, cam, [[ROAD.x0, RY, -8], [ROAD.x1, RY, -8], [ROAD.x1, RY, 90], [ROAD.x0, RY, 90]], '#4b4a55');
    P3(g, cam, [[FARX, 0, -8], [ROAD.x0, 0, -8], [ROAD.x0, 0, 90], [FARX, 0, 90]], '#8b8790');
    P3(g, cam, [[ROAD.x0, RY, -8], [ROAD.x0, 0, -8], [ROAD.x0, 0, 90], [ROAD.x0, RY, 90]], '#6c6870');
    // the kerb on our side, striped black and yellow
    for (let z = -6; z < 60; z += 0.6) { const k = Math.round((z + 6) / 0.6) % 2; P3(g, cam, [[ROAD.x1, ROAD.y, z], [ROAD.x1, 0, z], [ROAD.x1, 0, z + 0.6], [ROAD.x1, ROAD.y, z + 0.6]], k ? '#d9b23a' : '#24242a'); }
    // the far side's buildings, furthest first
    const blocks = [[60, 90, 11, '#8a6a74'], [48, 60, 9, '#6f7a8c'], [38, 48, 12, '#9a7b62'], [29, 38, 8.5, '#7d6f86'], [21, 29, 10, '#b08a6a'], [13, 21, 7.5, '#6d8090'], [6, 13, 9.5, '#a07a7a'], [-1, 6, 8, '#82748a'], [-8, -1, 10, '#8c8070']];
    blocks.forEach(([z0, z1, h, c], i) => facade(g, cam, FARX, z0, z1, h, c, i + 1, 1));
    // our side, beyond the stall: building fronts along the street (facing -x), and the lane's mouth at the corner
    const ours = [[60, 90, 10, '#7a7086'], [40, 60, 8, '#9a8070'], [24, 40, 9, '#6e7c8a'], [13.6, 24, 7.5, '#a58670'], [3.0, 10.9, 8.5, '#8a7480']];
    ours.forEach(([z0, z1, h, c], i) => facade(g, cam, NEARX, z0, z1, h, c, i + 20, -1));
    P3(g, cam, [[NEARX, 0.002, 10.9], [NEARX + 6, 0.002, 10.9], [NEARX + 6, 0.002, 13.6], [NEARX, 0.002, 13.6]], '#5b5764');    // the side lane's floor
    // the lamp post at the corner, lit
    const L = CORNER; P3(g, cam, [[L.x - 0.05, 0, L.z], [L.x - 0.05, 4.6, L.z], [L.x + 0.05, 4.6, L.z], [L.x + 0.05, 0, L.z]], '#2a2a32');
    P3(g, cam, [[L.x, 4.55, L.z - 0.04], [L.x - 0.9, 4.6, L.z - 0.04], [L.x - 0.9, 4.66, L.z - 0.04], [L.x, 4.62, L.z - 0.04]], '#2a2a32');
    glowAt(g, cam, [L.x - 0.85, 4.5, L.z], 1.6, '#ffc274', 0.55); glowAt(g, cam, [L.x - 0.85, 4.5, L.z], 0.28, '#fff3d8', 0.95);
    // a pool of its light on the pavement
    const q = cam.P(L.x - 0.5, 0.01, L.z); if (q) { const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], 2.2 * q[2]); gr.addColorStop(0, 'rgba(255,190,110,0.32)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.save(); g.translate(q[0], q[1]); g.scale(1, 0.32); g.translate(-q[0], -q[1]); g.beginPath(); g.arc(q[0], q[1], 2.2 * q[2], 0, TAU); g.fill(); g.restore(); }
    // an auto-rickshaw parked on the far side (black and yellow), and a few lit stalls' glows down the street
    autoRick(g, cam, -6.6, 17.5);
    for (const [x, z, c] of [[-8.9, 9, '#ffd28a'], [-8.9, 24, '#ffbf7a'], [-2.2, 30, '#ffd9a0'], [-8.9, 41, '#ffc78a']]) glowAt(g, cam, [x, 2.0, z], 2.2, c, 0.35);
  }
  function autoRick(g, cam, x, z) {
    const y0 = 0.18;
    box(g, cam, x - 0.65, x + 0.65, y0, 1.1, z - 1.2, z + 1.2, '#e8c23a', '#d4a828', '#c99a22');
    box(g, cam, x - 0.62, x + 0.62, 1.1, 1.75, z - 1.0, z + 0.9, '#1e1e24', '#2a2a30', '#26262c');
    for (const [dx, dz] of [[-0.6, -0.9], [0.6, -0.9], [0, 1.05]]) { const q = cam.P(x + dx, 0.2, z + dz); if (q) { g.fillStyle = '#141418'; g.beginPath(); g.ellipse(q[0], q[1], 0.2 * q[2] * 0.4, 0.2 * q[2], 0, 0, TAU); g.fill(); } }
  }

  // ------------------------------------------------------------------ our pavement (the mid layer: under the bench and the stall)
  function pavement(g, cam) {
    P3(g, cam, [[ROAD.x1, KERB, -8], [6, KERB, -8], [6, KERB, BACKWALL], [ROAD.x1, KERB, BACKWALL]], '#9b958f');
    P3(g, cam, [[ROAD.x1, KERB, BACKWALL], [NEARX, KERB, BACKWALL], [NEARX, KERB, 60], [ROAD.x1, KERB, 60]], '#958f8a');
    g.strokeStyle = 'rgba(60,50,50,0.18)'; g.lineWidth = 1.2;                   // the slabs' joints
    for (let x = -1.8; x < 4; x += 0.6) { g.beginPath(); if (R.line3(g, cam, [x, KERB + 0.001, -6], [x, KERB + 0.001, BACKWALL])) g.stroke(); }
    for (let z = -6; z < BACKWALL; z += 0.6) { g.beginPath(); if (R.line3(g, cam, [ROAD.x1, KERB + 0.001, z], [4, KERB + 0.001, z])) g.stroke(); }
    // the stall's warm light on the ground in front of it
    const q = cam.P(0.9, KERB + 0.01, 0.6); if (q) { const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], 2.4 * q[2]); gr.addColorStop(0, 'rgba(255,196,120,0.30)'); gr.addColorStop(1, 'rgba(255,196,120,0)'); g.fillStyle = gr; g.save(); g.translate(q[0], q[1]); g.scale(1, 0.4); g.translate(-q[0], -q[1]); g.beginPath(); g.arc(q[0], q[1], 2.4 * q[2], 0, TAU); g.fill(); g.restore(); }
  }

  // ------------------------------------------------------------------ the stall (the mid layer)
  // o.behind(g): the chaiwala, drawn between the back wall and the counter; o.kettleView(g, x, y, w, h): what the kettle reflects
  function stall(g, cam, t, o = {}) {
    const C = COUNTER, Y = KERB;
    // the building it stands in front of: a wall with a shutter half up, and the back of the stall
    P3(g, cam, [[NEARX, Y, BACKWALL], [4.5, Y, BACKWALL], [4.5, 7.5, BACKWALL], [NEARX, 7.5, BACKWALL]], '#7f6d78');
    P3(g, cam, [[-0.3, Y, BACKWALL - 0.01], [3.1, Y, BACKWALL - 0.01], [3.1, 2.5, BACKWALL - 0.01], [-0.3, 2.5, BACKWALL - 0.01]], '#5d4a3e');
    // shelves on the back wall: jars, a row of glasses, packets (no brands)
    for (const sy of [1.45, 1.85]) {
      box(g, cam, -0.2, 3.0, sy - 0.03, sy, BACKWALL - 0.32, BACKWALL - 0.02, '#8a6a4a', '#6e5238', '#7a5c40');
      for (let i = 0; i < 9; i++) {
        const x = -0.05 + i * 0.34, k = hash(i * 3.1 + sy), col = ['#d9a84a', '#c7543a', '#e8d6a8', '#6aa0c8', '#e0b060'][Math.floor(k * 5)];
        box(g, cam, x, x + 0.18, sy, sy + 0.2 + 0.08 * k, BACKWALL - 0.26, BACKWALL - 0.08, mix(col, '#ffffff', 0.2), mix(col, '#000000', 0.15), col);
      }
    }
    if (o.behind) o.behind(g);
    // the counter: its top, then its painted front (a red panel with a cream band)
    box(g, cam, C.x0, C.x1, Y, C.y - 0.04, C.z0, C.z1, null, '#8f3a30', '#a8443a');
    box(g, cam, C.x0 - 0.03, C.x1 + 0.03, C.y - 0.04, C.y, C.z0 - 0.03, C.z1, '#c9b8a0', '#8a7a68', '#b0a088');
    P3(g, cam, [[C.x0, 0.62, C.z0 - 0.002], [C.x1, 0.62, C.z0 - 0.002], [C.x1, 0.74, C.z0 - 0.002], [C.x0, 0.74, C.z0 - 0.002]], '#ead9b4');
    for (let x = C.x0 + 0.35; x < C.x1; x += 0.8) { const q = cam.P(x, 0.68, C.z0 - 0.004); if (q) { g.fillStyle = '#a8443a'; g.beginPath(); g.arc(q[0], q[1], 0.035 * q[2], 0, TAU); g.fill(); } }
    // on the counter: a stove with a big pan of chai, a tray of glasses, a jar of rusks, a stack of glasses
    box(g, cam, 1.55, 1.95, C.y, C.y + 0.1, 1.45, 1.8, '#3a3a40', '#2a2a30', '#303036');
    const pan = cam.P(1.75, C.y + 0.1, 1.62); if (pan) { const s = pan[2]; g.fillStyle = '#9aa2aa'; g.beginPath(); g.ellipse(pan[0], pan[1] - 0.09 * s, 0.17 * s, 0.05 * s, 0, 0, TAU); g.fill(); g.fillRect(pan[0] - 0.17 * s, pan[1] - 0.09 * s, 0.34 * s, 0.09 * s); g.fillStyle = '#c8905a'; g.beginPath(); g.ellipse(pan[0], pan[1] - 0.09 * s, 0.15 * s, 0.042 * s, 0, 0, TAU); g.fill(); g.fillStyle = '#6a7078'; g.beginPath(); g.ellipse(pan[0], pan[1], 0.17 * s, 0.05 * s, 0, 0, PI); g.fill(); }
    box(g, cam, 2.2, 2.6, C.y, C.y + 0.02, 1.4, 1.7, '#b8bcc0', '#8a8e92', '#9a9ea2');
    for (let i = 0; i < 6; i++) { const q = cam.P(2.26 + (i % 3) * 0.12, C.y + 0.02, 1.47 + Math.floor(i / 3) * 0.12); if (q) { const s = q[2]; g.fillStyle = 'rgba(200,140,80,0.85)'; g.fillRect(q[0] - 0.025 * s, q[1] - 0.06 * s, 0.05 * s, 0.06 * s); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = Math.max(1, 0.004 * s); g.strokeRect(q[0] - 0.026 * s, q[1] - 0.075 * s, 0.052 * s, 0.075 * s); } }
    const jar = cam.P(2.75, C.y, 1.5); if (jar) { const s = jar[2]; g.fillStyle = 'rgba(220,235,240,0.35)'; g.fillRect(jar[0] - 0.08 * s, jar[1] - 0.26 * s, 0.16 * s, 0.26 * s); g.fillStyle = '#d8a050'; for (let i = 0; i < 5; i++) g.fillRect(jar[0] - 0.06 * s, jar[1] - (0.04 + i * 0.045) * s, 0.12 * s, 0.03 * s); g.fillStyle = '#c0392b'; g.fillRect(jar[0] - 0.085 * s, jar[1] - 0.3 * s, 0.17 * s, 0.05 * s); }
    // the kettle (with what it reflects) at the counter's front corner
    // the side counter at his left: its painted front faces the bench, the kettle stands on it
    const S2 = SIDE;
    box(g, cam, S2.x0, S2.x1, Y, S2.y - 0.04, S2.z0, S2.z1, null, '#a8443a', '#8f3a30');
    box(g, cam, S2.x0 - 0.03, S2.x1, S2.y - 0.04, S2.y, S2.z0 - 0.03, S2.z1, '#c9b8a0', '#b0a088', '#8a7a68');
    P3(g, cam, [[S2.x0 - 0.002, 0.62, S2.z0], [S2.x0 - 0.002, 0.74, S2.z0], [S2.x0 - 0.002, 0.74, S2.z1], [S2.x0 - 0.002, 0.62, S2.z1]], '#ead9b4');
    box(g, cam, S2.x0 + 0.08, S2.x0 + 0.34, S2.y, S2.y + 0.05, S2.z0 + 0.42, S2.z0 + 0.76, '#2c2c30', '#232327', '#28282c');   // the kettle's stand
    kettle(g, cam, t, o.kettleView);
    // the tarp over it all, and the bulb
    const aw = (x, y, z) => [x, y, z];
    P3(g, cam, [aw(-0.6, 2.62, BACKWALL), aw(3.4, 2.62, BACKWALL), aw(3.4, 2.28, -0.1), aw(-0.6, 2.28, -0.1)], '#2f5f9e');
    P3(g, cam, [aw(-0.6, 2.28, -0.1), aw(3.4, 2.28, -0.1), aw(3.4, 2.1, -0.12), aw(-0.6, 2.1, -0.12)], '#264f86');
    for (const x of [-0.5, 3.3]) P3(g, cam, [[x, Y, -0.05], [x + 0.06, Y, -0.05], [x + 0.06, 2.3, -0.05], [x, 2.3, -0.05]], '#5a4a3a');   // the bamboo poles
    const b = cam.P(...BULB); if (b) { g.strokeStyle = '#222'; g.lineWidth = Math.max(1, 0.004 * b[2]); g.beginPath(); const top = cam.P(BULB[0], 2.5, BULB[2]); if (top) { g.moveTo(top[0], top[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
    glowAt(g, cam, BULB, 1.2, '#ffc27a', 0.5); glowAt(g, cam, BULB, 0.09, '#fffbe8', 1);
  }

  // the kettle: a tall steel body with a dome lid, a curved spout and a handle; its side shows a warped picture of what's in front
  // of it (reflect(g2, w, h): draw that picture, as the kettle sees it, into a w x h canvas; film.js draws him in it)
  let KCANVAS = null;
  function kettle(g, cam, t, reflect) {
    const K = KETTLE, base = cam.P(K.x, K.y, K.z), top = cam.P(K.x, K.y + K.h, K.z); if (!base || !top) return;
    const s = (base[2] + top[2]) / 2, rw = K.r * s, x = (base[0] + top[0]) / 2, y0 = base[1], y1 = top[1], tilt = Math.abs(Math.sin(cam.pitch)) * 0.32 + 0.12;
    // the stand
    const st = cam.P(K.x, KERB + 0.83, K.z); if (st) { g.fillStyle = '#2c2c30'; g.fillRect(x - rw * 0.85, y0, rw * 1.7, Math.max(2, 0.06 * s)); }
    // the spout, round the left and up (behind or in front, by where you are)
    const sp = (u) => { const a = PI + 0.15; const cx = K.x + Math.sin(a) * K.r, cz = K.z + Math.cos(a) * K.r; return [cx - 0.16 * u - 0.03 * Math.sin(u * PI), K.y + 0.08 + 0.22 * u * u + 0.04 * u, cz]; };
    const spout = () => { g.strokeStyle = '#8f979f'; g.lineCap = 'round'; g.lineWidth = Math.max(3, 0.038 * s); g.beginPath(); for (let i = 0; i <= 12; i++) { const q = cam.P(...sp(i / 12)); if (q) i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(1, 0.01 * s); g.stroke(); };
    spout();
    // the body: a cylinder, its picture warped onto it
    const W = Math.max(4, Math.round(rw * 2)), H = Math.max(4, Math.round(y0 - y1));
    g.save();
    g.beginPath(); g.ellipse(x, y1, rw, rw * tilt, 0, PI, TAU); g.lineTo(x + rw, y0); g.ellipse(x, y0, rw, rw * tilt, 0, 0, PI); g.closePath();
    const body = g.createLinearGradient(x - rw, 0, x + rw, 0);
    body.addColorStop(0, '#3e434a'); body.addColorStop(0.18, '#c9d0d6'); body.addColorStop(0.32, '#f4f7fa'); body.addColorStop(0.42, '#8a929a'); body.addColorStop(0.7, '#5a6068'); body.addColorStop(0.86, '#b8c0c6'); body.addColorStop(1, '#3a3f45');
    g.fillStyle = body; g.fill();
    g.clip();
    if (reflect && W > 8 && H > 8) {
      if (!KCANVAS) KCANVAS = document.createElement('canvas');
      const kc = KCANVAS; if (kc.width !== 512 || kc.height !== 512) { kc.width = 512; kc.height = 512; }
      const kg = kc.getContext('2d'); kg.setTransform(1, 0, 0, 1, 0, 0); kg.clearRect(0, 0, 512, 512);
      reflect(kg, 512, 512);
      // a cylinder squeezes towards its edges: draw the picture in thin vertical strips, each placed by the curve
      const N = 48; g.globalAlpha = 0.8; g.filter = 'saturate(0.62) contrast(1.08) brightness(0.95)';
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N, m0 = Math.sin((u0 - 0.5) * PI) * 0.5 + 0.5, m1 = Math.sin((u1 - 0.5) * PI) * 0.5 + 0.5;   // where a strip of the picture lands across the body
        const sx = u0 * 512, sw = 512 / N, dx = x - rw + m0 * 2 * rw, dw = Math.max(0.5, (m1 - m0) * 2 * rw) + 0.6;
        const bulge = 1 + 0.12 * Math.cos((u0 - 0.5) * PI);       // the middle bulges towards you
        const dh = (y0 - y1) * bulge, dy = y1 - (dh - (y0 - y1)) / 2;
        g.drawImage(kc, sx, 0, sw, 512, dx, dy, dw, dh);
      }
      g.globalAlpha = 1; g.filter = 'none';
      // the steel's own shine over the picture
      const sh = g.createLinearGradient(x - rw, 0, x + rw, 0);
      sh.addColorStop(0, 'rgba(14,18,24,0.85)'); sh.addColorStop(0.1, 'rgba(40,46,56,0.35)'); sh.addColorStop(0.16, 'rgba(255,255,255,0.0)'); sh.addColorStop(0.22, 'rgba(255,255,255,0.55)'); sh.addColorStop(0.26, 'rgba(255,255,255,0.12)');
      sh.addColorStop(0.7, 'rgba(160,176,196,0.0)'); sh.addColorStop(0.84, 'rgba(255,255,255,0.28)'); sh.addColorStop(0.88, 'rgba(255,255,255,0.05)'); sh.addColorStop(0.94, 'rgba(30,36,44,0.4)'); sh.addColorStop(1, 'rgba(14,18,24,0.9)');
      g.fillStyle = sh; g.fillRect(x - rw, y1 - rw, rw * 2, y0 - y1 + rw * 2);
      const vt = g.createLinearGradient(0, y1, 0, y0); vt.addColorStop(0, 'rgba(255,255,255,0.18)'); vt.addColorStop(0.12, 'rgba(255,255,255,0)'); vt.addColorStop(0.85, 'rgba(0,0,0,0)'); vt.addColorStop(1, 'rgba(10,12,16,0.45)');
      g.fillStyle = vt; g.fillRect(x - rw, y1 - rw, rw * 2, y0 - y1 + rw * 2);
    }
    g.restore();
    // the rims and the dome lid, the knob; the handle in an arch over the top
    g.strokeStyle = 'rgba(40,44,50,0.8)'; g.lineWidth = Math.max(1, 0.006 * s);
    g.beginPath(); g.ellipse(x, y0, rw, rw * tilt, 0, 0, PI); g.stroke();
    { const lq = g.createLinearGradient(x - rw, 0, x + rw, 0); lq.addColorStop(0, '#5a6068'); lq.addColorStop(0.3, '#e6ebef'); lq.addColorStop(0.55, '#9aa2aa'); lq.addColorStop(1, '#4a5058'); g.fillStyle = lq; }
    g.beginPath(); g.ellipse(x, y1, rw, rw * tilt, 0, 0, TAU); g.fill(); g.stroke();
    { const dq = g.createLinearGradient(x - rw, y1 - rw * 0.6, x + rw, y1); dq.addColorStop(0, '#6a7078'); dq.addColorStop(0.35, '#f0f3f6'); dq.addColorStop(0.6, '#a8b0b8'); dq.addColorStop(1, '#565c64'); g.fillStyle = dq; }
    g.beginPath(); g.ellipse(x, y1 - 0.02 * s, rw * 0.78, rw * 0.6, 0, PI, TAU); g.fill(); g.strokeStyle = 'rgba(40,44,50,0.6)'; g.stroke();
    g.fillStyle = '#2a2a2e'; g.beginPath(); g.arc(x, y1 - 0.075 * s, 0.022 * s, 0, TAU); g.fill();
    g.strokeStyle = '#30343a'; g.lineWidth = Math.max(2, 0.016 * s); g.beginPath(); g.ellipse(x, y1 - 0.04 * s, rw * 0.92, rw * 0.9, 0, PI * 1.08, PI * 1.92); g.stroke();
    // steam off its spout
    const tip = sp(1); window.PROPS && window.PROPS.steam(cam, tip, t, 0.8, { h: 0.18, seed: 4, n: 2 }).forEach((p) => p.draw(g));
  }

  // ------------------------------------------------------------------ the bench (with him, the near-middle layer)
  function bench(g, cam) {
    const B = BENCH, Y = KERB, wood = '#9a6a3e', woodD = '#6e4a2a', woodL = '#b88654';
    // legs and the rail under the seat
    for (const x of [B.x0 + 0.12, B.x1 - 0.12]) for (const z of [B.z0 + 0.05, B.z1 - 0.05]) box(g, cam, x - 0.03, x + 0.03, Y, B.y - 0.035, z - 0.03, z + 0.03, woodD, woodD, mix(woodD, '#000000', 0.15));
    box(g, cam, B.x0 + 0.1, B.x1 - 0.1, 0.22, 0.26, B.z0 + 0.17, B.z0 + 0.23, woodD, woodD, woodD);
    box(g, cam, B.x0 + 0.05, B.x1 - 0.05, B.y - 0.07, B.y - 0.035, B.z0 + 0.03, B.z1 - 0.03, woodD, woodD, woodD);
    // three slats, gaps between them
    for (const [a, b] of [[0, 0.118], [0.141, 0.259], [0.282, 0.40]]) {
      box(g, cam, B.x0, B.x1, B.y - 0.035, B.y, B.z0 + a, B.z0 + b, woodL, wood, woodD);
      g.strokeStyle = 'rgba(80,50,30,0.25)'; g.lineWidth = 1;                // the grain
      for (let k = 0; k < 3; k++) { g.beginPath(); if (R.line3(g, cam, [B.x0 + 0.05, B.y + 0.001, B.z0 + a + 0.03 + k * 0.03], [B.x1 - 0.05, B.y + 0.001, B.z0 + a + 0.03 + k * 0.03])) g.stroke(); }
    }
  }

  window.SET = { BENCH, COUNTER, SIDE, KETTLE, BULB, ROAD, CORNER, BACKWALL, NEARX, FARX, KERB, box, sky, far, pavement, stall, kettle, bench, glowAt };
})();
