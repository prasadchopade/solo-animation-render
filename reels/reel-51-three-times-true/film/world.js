// Reel 51 · Three Times True: the old bazaar in true perspective (window.WORLD). Our own drawing, new in this reel: a lane of two-storey
// shops between two stone gates, the west gate 6 m from your chai stall, the east gate 16 m the other way. A pinhole camera stands anywhere
// in it, turns (yaw, in degrees from north towards east) and zooms (f, px). Every surface is a 3D polygon clipped at the near plane and
// projected each frame (nothing is painted into a panorama), so the camera can turn the whole way from one gate to the other, and people are
// placed by the same projection (r36.js's personView, through cam.rig). Units: metres. X east, Y up, Z north. You stand at the origin's
// side of the lane, at your stall's counter. Every function draws from its arguments alone; the world's layout is built once, seeded.
(() => {
  const { W, H, clamp, lerp, mulberry32 } = C;
  const D = window.DRAW;
  const { txt, mix, lg, R, ell } = D;
  const PI = Math.PI, TAU = PI * 2, DEG = PI / 180;

  // ------------------------------------------------------------------ the layout
  const ZS = -2.6, ZN = 6.2;                      // the south row's shopfronts, the north row's
  const GW = { x: -9.5, t: 1.6, o0: 0.6, o1: 4.0, ys: 3.0 };   // the west gate's face, thickness, the opening (Z) and where its arch springs
  const GE = { x: 16.0, t: 1.6, o0: 0.6, o1: 4.0, ys: 3.0 };
  const YOU = { x: 0, z: -1.05, eye: 1.6 };       // your eye, at your stall's counter
  const STALL = { x0: -1.4, x1: 1.6, front: -1.62 };            // your chai stall's counter, on the south row

  // the shops: [x0, x1, kind, name, wall, trim, height]. Names are invented; no brands, nothing sacred, no flag colours side by side.
  const NORTH = [
    [-9.5, -6.0, 'cloth', 'SAREES', '#f2bf8f', '#7a2f5a', 8.0],
    [-6.0, -2.6, 'barber', 'HAIR CUTTING SALOON', '#e9b8a2', '#a8432f', 7.4],
    [-2.6, 1.2, 'cloth', 'CLOTH HOUSE', '#9fcfee', '#2d5fae', 8.6],
    [1.2, 4.6, 'steel', 'STEEL UTENSILS', '#f0cf86', '#8a5a1a', 7.0],
    [4.6, 8.4, 'shut', 'MOBILE REPAIR', '#c5b8ea', '#5b4aa8', 9.2],
    [8.4, 12.0, 'sweets', 'SWEETS', '#f4adc0', '#b5341f', 7.6],
    [12.0, 16.0, 'bangles', 'BANGLES', '#f6c48e', '#7a1f4f', 8.4],
  ];
  const SOUTH = [
    [-9.5, -6.0, 'books', 'BOOKS & PENS', '#cbb7e6', '#3a2f7a', 7.8],
    [-6.0, -3.6, 'shut', '', '#eaa597', '#7a2f2a', 7.2],
    [-3.6, -1.4, 'fruit', 'FRUITS', '#f0cf86', '#2f6a1f', 6.8],
    [1.6, 5.4, 'grocery', 'GENERAL STORE', '#92cfc5', '#1f6a5a', 8.2],
    [5.4, 9.2, 'tailor', 'TAILORS', '#fff3cf', '#7a1f1f', 7.4],
    [9.2, 12.6, 'pots', 'CLAY POTS', '#f2bf8f', '#7a3f18', 8.8],
    [12.6, 16.0, 'chemist', 'CHEMIST', '#e9b3c6', '#0f5a4a', 7.6],
  ];
  const GOODS = ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#b94fd0', '#4fb06a', '#f2f0e6', '#2d5fae', '#d94f8a'];
  const AWN = ['stripeR', '#2b6fb3', '#e2a92a', 'stripeB', '#c2453a', '#7a59b8'];

  // ------------------------------------------------------------------ the camera
  // o: {x, z, eye, yaw (deg, 0 = north, 90 = east), f, hz (the horizon's screen y), cx}. cam.P(X, Y, Z) → [sx, sy, px per metre, depth]
  function cam(o) {
    const th = (o.yaw || 0) * DEG, F = [Math.sin(th), Math.cos(th)], Rv = [Math.cos(th), -Math.sin(th)];
    const cx = o.cx ?? 540, hz = o.hz ?? 1000, f = o.f ?? 1200, eye = o.eye ?? 1.6, X0 = o.x ?? 0, Z0 = o.z ?? 0;
    const toCam = (X, Y, Z) => { const dx = X - X0, dz = Z - Z0; return [dx * Rv[0] + dz * Rv[1], Y - eye, dx * F[0] + dz * F[1]]; };
    const scr = (q) => [cx + f * q[0] / q[2], hz - f * q[1] / q[2]];
    // r36.js's personView and PJ read x, z in millimetres, f, roll and rig.{toCam, scr} (toCam in metres)
    return { yaw: o.yaw || 0, f, hz, cx, eye, X0, Z0, x: X0 * 1000, z: Z0 * 1000, roll: 0, rig: { toCam, scr }, toCam, scr,
      P(X, Y, Z) { const q = toCam(X, Y, Z); if (q[2] < 0.05) return null; const p = scr(q); return [p[0], p[1], f / q[2], q[2]]; } };
  }

  // ------------------------------------------------------------------ polygons: camera space, clipped at the near plane, then projected
  const NEAR = 0.1;
  function clipNear(qs) {
    const out = [];
    for (let i = 0; i < qs.length; i++) {
      const a = qs[i], b = qs[(i + 1) % qs.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR;
      if (ia) out.push(a);
      if (ia !== ib) { const u = (NEAR - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u), NEAR]); }
    }
    return out;
  }
  function sub(g, c, pts) {                         // one sub-path (clipped); false if nothing of it is in front
    const qs = clipNear(pts.map((p) => c.toCam(p[0], p[1], p[2]))); if (qs.length < 3) return false;
    qs.forEach((q, i) => { const p = c.scr(q); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); return true;
  }
  function poly(g, c, pts, fill, stroke, lw) {
    g.beginPath(); if (!sub(g, c, pts)) return false;
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 2; g.stroke(); }
    return true;
  }
  function line3(g, c, a, b, col, lw) {             // a segment, clipped
    let qa = c.toCam(...a), qb = c.toCam(...b);
    if (qa[2] < NEAR && qb[2] < NEAR) return;
    if (qa[2] < NEAR) { const u = (NEAR - qa[2]) / (qb[2] - qa[2]); qa = [lerp(qa[0], qb[0], u), lerp(qa[1], qb[1], u), NEAR]; }
    if (qb[2] < NEAR) { const u = (NEAR - qb[2]) / (qa[2] - qb[2]); qb = [lerp(qb[0], qa[0], u), lerp(qb[1], qa[1], u), NEAR]; }
    const p = c.scr(qa), q = c.scr(qb); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
  }
  // a rectangle in a shopfront's plane: X from xa to xb, Y from ya to yb, at Z (the row's plane, nudged out by dz towards the lane)
  const fr = (xa, xb, ya, yb, z) => [[xa, ya, z], [xb, ya, z], [xb, yb, z], [xa, yb, z]];
  // text painted on a rectangle in a plane: an affine fit to three projected corners (the signs are small; their perspective is mild)
  function planeText(g, c, s, A, B, Dd, size, col, o = {}) {
    const a = c.P(...A), b = c.P(...B), d = c.P(...Dd); if (!a || !b || !d) return;
    const w = 1000, h = 1000 * (o.hk ?? 0.25);
    g.save(); g.transform((b[0] - a[0]) / w, (b[1] - a[1]) / w, (d[0] - a[0]) / h, (d[1] - a[1]) / h, a[0], a[1]);
    txt(g, s, w / 2, h * 0.5 + size * 0.36, size, col, { align: 'center', fit: w * 0.9, stroke: o.stroke, sw: o.sw });
    g.restore();
  }

  // ------------------------------------------------------------------ the sky, and the town beyond the gates
  function sky(g, c) {
    g.fillStyle = lg(g, 0, c.hz - 1700, 0, c.hz + 60, [0, '#e98a5a'], [0.45, '#f4b47a'], [0.85, '#fbd9a6'], [1, '#fde6bf']);
    g.fillRect(0, 0, W, H);
  }
  // beyond a gate: the street goes on, its houses in haze; side = -1 west, +1 east
  const BEYOND = { [-1]: [], [1]: [] };
  (() => {
    for (const side of [-1, 1]) {
      const r = mulberry32(side > 0 ? 5103 : 5101), cols = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#e88aa0'];
      const x0 = side < 0 ? GW.x - GW.t : GE.x + GE.t;
      for (const rowZ of [-3.2, 7.0]) {
        let x = x0;
        for (let i = 0; i < 6; i++) { const w = 3 + r() * 3, h = 7 + r() * 7, xa = side < 0 ? x - w : x, xb = side < 0 ? x : x + w; BEYOND[side].push({ xa, xb, z: rowZ, h, col: cols[(i + (rowZ > 0 ? 2 : 0)) % cols.length], win: r() }); x += side * w; }
      }
    }
  })();
  function beyond(g, c, side) {
    const x0 = side < 0 ? GW.x - GW.t : GE.x + GE.t, x1 = side < 0 ? -44 : 48;
    poly(g, c, [[x0, 0, -4], [x1, 0, -4], [x1, 0, 8], [x0, 0, 8]], side < 0 ? '#dcb98c' : '#d2ab7c');
    // the far end: a haze of houses, so the street doesn't stop at the sky
    const haze = side < 0 ? '#ffe1b8' : '#f7cfa4';
    for (const b of BEYOND[side]) {
      const zf = b.z;
      poly(g, c, fr(b.xa, b.xb, 0, b.h, zf), mix(b.col, haze, 0.38));
      for (let fy = 3.4; fy < b.h - 1; fy += 2.6) for (let fx = b.xa + 0.6; fx < b.xb - 0.9; fx += 1.5) poly(g, c, fr(fx, fx + 0.8, fy, fy + 1.3, zf + (zf > 0 ? -0.01 : 0.01)), mix('#3a4652', haze, 0.45));
    }
  }

  // ------------------------------------------------------------------ the ground: the lane's flagstones, the drains, petals
  const LITTER = (() => { const r = mulberry32(5111), out = []; for (let i = 0; i < 150; i++) { const c = r(); out.push({ x: GW.x + 0.2 + r() * (GE.x - GW.x - 0.4), z: ZS + 0.3 + r() * (ZN - ZS - 0.6), rot: r() * 3, k: c > 0.35 ? 'petal' : 'leaf', col: c > 0.6 ? '#f39a1e' : c > 0.35 ? '#f7c52b' : r() > 0.5 ? '#7fa83e' : '#c79a4a' }); } return out; })();
  function ground(g, c) {
    const a = c.P(GW.x, 0, ZS), b = c.P(GE.x, 0, ZN);
    poly(g, c, [[GW.x, 0, ZS], [GE.x, 0, ZS], [GE.x, 0, ZN], [GW.x, 0, ZN]], '#c99f72');
    // flagstone joints along the lane and across it
    for (let z = ZS + 0.55; z < ZN - 0.2; z += 0.55) line3(g, c, [GW.x, 0.002, z], [GE.x, 0.002, z], 'rgba(110,70,40,0.22)', 2.2);
    for (let x = GW.x + 0.7; x < GE.x; x += 0.7) { const off = (Math.round(x / 0.7) % 2) * 0.275; for (let z = ZS + off; z < ZN - 0.4; z += 1.1) line3(g, c, [x, 0.002, z], [x, 0.002, z + 0.55], 'rgba(110,70,40,0.16)', 2); }
    // the worn middle of the lane, a little lighter
    poly(g, c, [[GW.x, 0.001, 0.9], [GE.x, 0.001, 0.9], [GE.x, 0.001, 3.5], [GW.x, 0.001, 3.5]], 'rgba(255,236,200,0.16)');
    // the drains along both rows
    for (const z of [ZS + 0.18, ZN - 0.18]) poly(g, c, [[GW.x, 0.003, z - 0.14], [GE.x, 0.003, z - 0.14], [GE.x, 0.003, z + 0.14], [GW.x, 0.003, z + 0.14]], 'rgba(60,40,30,0.35)');
    for (const p of LITTER) { const q = c.P(p.x, 0.004, p.z); if (!q || q[3] > 24) continue; const s = q[2] / 1000; ell(g, q[0], q[1], Math.max(1, 34 * s), Math.max(0.8, 16 * s), p.rot); g.fillStyle = p.col; g.fill(); }
  }

  // ------------------------------------------------------------------ a shop: its front, the sign, the goods, the upper floor, an awning
  function shop(g, c, sh, side, i) {
    const [xa, xb, kind, name, wall, trim, h] = sh, z = side > 0 ? ZN : ZS, dz = side > 0 ? -0.012 : 0.012, zf = z + dz, r = mulberry32(5200 + i * 7 + (side > 0 ? 0 : 50));
    if ((side > 0 && c.Z0 > z) || (side < 0 && c.Z0 < z)) return;                                   // seen from behind (a camera over the roofs): skip it
    const shade = (col) => (side > 0 ? col : mix(col, '#5a3b4a', 0.16));    // the south row is in the shade
    poly(g, c, fr(xa, xb, 0, h, z), shade(wall));
    poly(g, c, fr(xa, xb, h - 0.3, h, zf), shade(mix(wall, '#ffffff', 0.25)));                       // the parapet's lip
    poly(g, c, fr(xb - 0.12, xb, 0, h, zf), 'rgba(0,0,0,0.10)');                                     // a seam between houses
    // upper floor: windows with shutters, and on some a little balcony
    const nw = Math.max(1, Math.round((xb - xa) / 1.8));
    for (let k = 0; k < nw; k++) {
      const wx = xa + (k + 0.5) * (xb - xa) / nw, wy = 4.6;
      poly(g, c, fr(wx - 0.46, wx + 0.46, wy, wy + 1.5, zf), shade('#3a4652'));
      poly(g, c, fr(wx - 0.42, wx + 0.42, wy + 0.05, wy + 1.42, zf * 1 + dz), shade(r() > 0.5 ? 'rgba(255,214,140,0.55)' : 'rgba(80,110,130,0.5)'));
      poly(g, c, fr(wx - 0.62, wx - 0.46, wy, wy + 1.5, zf), shade(trim));
      poly(g, c, fr(wx + 0.46, wx + 0.62, wy, wy + 1.5, zf), shade(trim));
      if (h > 8 && r() > 0.4) poly(g, c, fr(wx - 0.5, wx + 0.5, wy + 2.4, wy + 3.4, zf), shade('#3a4652'));
    }
    if (h > 7.8 && r() > 0.35) {                                                                         // a balcony's railing, out from the wall
      const zb = z + (side > 0 ? -0.55 : 0.55);
      poly(g, c, [[xa + 0.3, 4.4, zb], [xb - 0.3, 4.4, zb], [xb - 0.3, 4.5, z], [xa + 0.3, 4.5, z]], shade(mix(trim, '#000000', 0.2)));
      for (let x = xa + 0.35; x < xb - 0.3; x += 0.22) line3(g, c, [x, 4.42, zb], [x, 5.1, zb], shade(mix(trim, '#000000', 0.1)), 2.5);
      line3(g, c, [xa + 0.3, 5.1, zb], [xb - 0.3, 5.1, zb], shade(trim), 4);
    }
    // the shop: a dark opening, goods inside, a rolled shutter, or a closed one
    const sx0 = xa + 0.25, sx1 = xb - 0.25;
    if (kind === 'shut') {
      poly(g, c, fr(sx0, sx1, 0, 2.9, zf), shade('#8a9098'));
      for (let y = 0.15; y < 2.9; y += 0.14) line3(g, c, [sx0, y, zf + dz], [sx1, y, zf + dz], 'rgba(0,0,0,0.18)', 2);
      poly(g, c, fr((sx0 + sx1) / 2 - 0.25, (sx0 + sx1) / 2 + 0.25, 0.1, 0.22, zf + dz), shade('#3d4248'));
    } else {
      poly(g, c, fr(sx0, sx1, 0, 2.9, zf), shade('#2b1d14'));
      const n = Math.max(3, Math.round((sx1 - sx0) / 0.32));
      for (let j = 0; j < n; j++) {                                                                       // shelves of goods in the dark
        const gx = sx0 + 0.1 + j * (sx1 - sx0 - 0.2) / n, gw = (sx1 - sx0 - 0.2) / n * 0.8;
        for (const [y0, y1] of [[1.75, 2.45], [0.95, 1.6]]) poly(g, c, fr(gx, gx + gw, y0 + r() * 0.1, y1 - r() * 0.15, zf + dz), mix(GOODS[(j + i * 3) % GOODS.length], '#3a2c26', 0.35));
      }
      poly(g, c, fr(sx0, sx1, 2.62, 2.9, zf + dz), shade('#7d8086'));                                     // the shutter, rolled up
      poly(g, c, fr(sx0 - 0.05, sx1 + 0.05, 0, 0.75, zf + dz * 2), shade(mix(trim, '#000000', 0.25)));     // the counter's front
    }
    // the sign board over the shop
    if (name) {
      poly(g, c, fr(xa + 0.2, xb - 0.2, 3.05, 3.85, zf + dz), shade(trim));
      poly(g, c, fr(xa + 0.28, xb - 0.28, 3.12, 3.78, zf + dz * 2), shade(kind === 'tailor' ? '#fff3cf' : mix(wall, '#fffaf0', 0.55)));
      const L0 = side > 0 ? xa + 0.28 : xb - 0.28, R0 = side > 0 ? xb - 0.28 : xa + 0.28;   // the south row faces north: its left end, for a reader in the lane, is its east end
      planeText(g, c, name, [L0, 3.78, zf + dz * 3], [R0, 3.78, zf + dz * 3], [L0, 3.12, zf + dz * 3], 175, shade(trim), { hk: 0.66 / (xb - xa - 0.56) });
    }
    // an awning out over the lane (not over the barber's: his is a tree's shade)
    if (kind !== 'barber' && kind !== 'shut') {
      const zo = z + (side > 0 ? -1.15 : 1.15), aw = AWN[(i + (side > 0 ? 0 : 3)) % AWN.length], ns = Math.max(4, Math.round((xb - xa) / 0.45));
      for (let m = 0; m < ns; m++) {
        const a0 = xa + 0.1 + m * (xb - xa - 0.2) / ns, a1 = a0 + (xb - xa - 0.2) / ns;
        const col = aw === 'stripeR' ? (m % 2 ? '#f6efe2' : '#d9402f') : aw === 'stripeB' ? (m % 2 ? '#f6efe2' : '#2f6fb0') : aw;
        poly(g, c, [[a0, 2.98, z + dz], [a1, 2.98, z + dz], [a1, 2.55, zo], [a0, 2.55, zo]], shade(col));
      }
      poly(g, c, [[xa + 0.1, 2.55, zo], [xb - 0.1, 2.55, zo], [xb - 0.1, 2.38, zo], [xa + 0.1, 2.38, zo]], shade(mix(aw.startsWith('stripe') ? '#c23a2a' : aw, '#000000', 0.2)));
    }
    // a water tank on some roofs
    if (r() > 0.45) { const tx = lerp(xa + 0.6, xb - 1.4, r()); poly(g, c, fr(tx, tx + 0.9, h, h + 0.8, z + (side > 0 ? 0.6 : -0.6)), '#23252a'); }
  }

  // the barber's corner: a mirror on the wall, a shelf, the chair (facing west, along the lane), a neem tree's shade
  const BCHAIR = { x: -3.9, z: 5.15 };
  function barberCorner(g, c) {
    const z = ZN - 0.02;
    poly(g, c, fr(-5.4, -4.2, 1.2, 2.3, z), '#7a5a3a'); poly(g, c, fr(-5.32, -4.28, 1.28, 2.22, z - 0.01), '#bfe0ea');      // the mirror
    poly(g, c, fr(-5.3, -4.3, 1.3, 1.6, z - 0.012), 'rgba(255,255,255,0.35)');
    poly(g, c, fr(-5.6, -4.0, 1.05, 1.12, z - 0.15), '#5a3b22');                                                             // the shelf
    for (let k = 0; k < 5; k++) poly(g, c, fr(-5.5 + k * 0.28, -5.38 + k * 0.28, 1.12, 1.32 + (k % 2) * 0.08, z - 0.15), ['#2fa5d6', '#f2f0e6', '#e8413a', '#f0c32a', '#4fb06a'][k]);
  }
  function barberChair(g, c, o = {}) {              // a sprite at its floor point: red seat, chrome stem, the headrest; facing west
    const q = c.P(BCHAIR.x, 0, BCHAIR.z); if (!q) return; const s = q[2] / 1000;
    g.save(); g.translate(q[0], q[1]); g.scale(s, s); g.lineJoin = 'round';
    g.fillStyle = '#b9bec4'; R(g, -60, -520, 120, 520, 20); g.fill(); g.fillStyle = '#8f949b'; ell(g, 0, -6, 260, 50); g.fill();
    g.fillStyle = '#a8202a'; R(g, -330, -900, 640, 300, 60); g.fill(); g.fillStyle = '#c8303a'; R(g, -320, -900, 620, 80, 40); g.fill();   // the seat
    g.fillStyle = '#9a1c26'; R(g, 160, -1500, 200, 680, 70); g.fill();                                                                       // the back, east side
    g.fillStyle = '#b9bec4'; R(g, -360, -980, 640, 46, 20); g.fill(); R(g, -390, -700, 80, 50, 20); g.fill();                                 // armrest, footrest
    g.restore();
  }

  // the gates: a sandstone wall across the lane's end, a round-topped opening, its depth (the reveals and the vault), a parapet, the sign
  function archPts(gt, x, n = 18) {                  // the opening's outline in the gate's face plane (X = x): up one side, over, down
    const r = (gt.o1 - gt.o0) / 2, cz = (gt.o0 + gt.o1) / 2, out = [[x, 0, gt.o0], [x, gt.ys, gt.o0]];
    for (let i = 1; i < n; i++) { const a = PI - PI * i / n; out.push([x, gt.ys + r * Math.sin(a), cz + r * Math.cos(a)]); }
    out.push([x, gt.ys, gt.o1], [x, 0, gt.o1]); return out;
  }
  function gate(g, c, gt, side, label) {
    const xf = gt.x, xb = gt.x + side * gt.t, zA = ZS - 1.4, zB = ZN + 1.4, top = 7.2, sand = '#dca46a', sandD = '#b67e48', sandL = '#f0c48c';
    // the reveals and the vault, seen through the opening
    const ap = archPts(gt, xf), bp = archPts(gt, xb);
    for (let i = 0; i < ap.length - 1; i++) poly(g, c, [ap[i], ap[i + 1], bp[i + 1], bp[i]], i < ap.length / 2 ? sandD : mix(sandD, '#000000', 0.12));
    // the face, with the opening cut out
    g.beginPath();
    sub(g, c, [[xf, 0, zA], [xf, 0, zB], [xf, top, zB], [xf, top, zA]]);
    sub(g, c, ap);
    g.fillStyle = sand; g.fill('evenodd');
    // the arch's moulding, the piers' stones, the parapet
    const r0 = (gt.o1 - gt.o0) / 2, cz = (gt.o0 + gt.o1) / 2;
    for (let i = 0; i < 18; i++) { const a0 = PI - PI * i / 18, a1 = PI - PI * (i + 1) / 18, ro = r0 + 0.32; poly(g, c, [[xf + side * -0.01, gt.ys + r0 * Math.sin(a0), cz + r0 * Math.cos(a0)], [xf - side * 0.01, gt.ys + ro * Math.sin(a0), cz + ro * Math.cos(a0)], [xf - side * 0.01, gt.ys + ro * Math.sin(a1), cz + ro * Math.cos(a1)], [xf - side * 0.01, gt.ys + r0 * Math.sin(a1), cz + r0 * Math.cos(a1)]], i % 2 ? sandL : mix(sandL, sandD, 0.25)); }
    for (const [z0, z1] of [[gt.o0 - 0.5, gt.o0], [gt.o1, gt.o1 + 0.5]]) for (let y = 0; y < gt.ys; y += 0.5) poly(g, c, [[xf - side * 0.01, y, z0], [xf - side * 0.01, y, z1], [xf - side * 0.01, y + 0.46, z1], [xf - side * 0.01, y + 0.46, z0]], (Math.round(y / 0.5) % 2) ? mix(sand, sandL, 0.4) : mix(sand, sandD, 0.15));
    for (let y = 0.9; y < top - 0.3; y += 0.9) line3(g, c, [xf - side * 0.01, y, zA], [xf - side * 0.01, y, gt.o0 - 0.5], 'rgba(120,70,30,0.22)', 2.2);
    for (let y = 0.9; y < top - 0.3; y += 0.9) line3(g, c, [xf - side * 0.01, y, gt.o1 + 0.5], [xf - side * 0.01, y, zB], 'rgba(120,70,30,0.22)', 2.2);
    poly(g, c, [[xf - side * 0.02, top - 0.35, zA], [xf - side * 0.02, top - 0.35, zB], [xf - side * 0.02, top, zB], [xf - side * 0.02, top, zA]], sandL);
    for (let z = zA; z < zB - 0.2; z += 0.7) poly(g, c, [[xf - side * 0.02, top, z], [xf - side * 0.02, top, z + 0.42], [xf - side * 0.02, top + 0.55, z + 0.42], [xf - side * 0.02, top + 0.55, z]], sand);
    // the sign over the arch: a dark board, cream letters
    const sy0 = gt.ys + r0 + 0.5, sy1 = sy0 + 0.82, s0 = cz - 1.6, s1 = cz + 1.6, zz = (z) => [xf - side * 0.03, 0, z];
    poly(g, c, [[xf - side * 0.03, sy0, s0], [xf - side * 0.03, sy0, s1], [xf - side * 0.03, sy1, s1], [xf - side * 0.03, sy1, s0]], '#1f3b35');
    poly(g, c, [[xf - side * 0.035, sy0 + 0.06, s0 + 0.06], [xf - side * 0.035, sy0 + 0.06, s1 - 0.06], [xf - side * 0.035, sy1 - 0.06, s1 - 0.06], [xf - side * 0.035, sy1 - 0.06, s0 + 0.06]], null, '#e9d9b0', 3);
    // the board's left and right ends as seen from the lane: west gate's face looks east, so its left end (for us) is the south end
    const L = side < 0 ? s0 : s1, Rr = side < 0 ? s1 : s0;
    planeText(g, c, label, [xf - side * 0.04, sy1 - 0.08, L], [xf - side * 0.04, sy1 - 0.08, Rr], [xf - side * 0.04, sy0 + 0.08, L], 300, '#f4e9cc', { hk: 0.66 / 3.2 });
    void zz;
  }

  // ------------------------------------------------------------------ strings across the lane: bulbs, and bunting
  const STRINGS = [[-7.2, 'bulbs', 5.3, 0.95], [-4.4, 'bunt', 5.3, 0.95], [-1.2, 'bulbs', 5.3, 0.95], [2.6, 'bunt', 5.3, 0.95], [6.4, 'bulbs', 5.5, 0.8], [10.2, 'bunt', 5.9, 0.6]];   // [x, kind, height at the walls, sag]: the last two hang high, clear of the east gate's sign from your stall
  const BUNT = ['#e8413a', '#f0c32a', '#2fa5d6', '#d94f8a', '#7a59b8', '#f2f0e6'];
  function strings(g, c, tw = 0) {
    for (const [x, kind, yEnd, sag] of STRINGS) {
      const at = (u) => [x + 0.15 * Math.sin(u * PI), yEnd - sag * 4 * u * (1 - u), lerp(ZS, ZN, u)];
      g.strokeStyle = 'rgba(40,30,25,0.75)'; g.lineWidth = 2; g.beginPath(); let started = false;
      for (let i = 0; i <= 24; i++) { const p = c.P(...at(i / 24)); if (!p) { started = false; continue; } if (!started) { g.moveTo(p[0], p[1]); started = true; } else g.lineTo(p[0], p[1]); }
      g.stroke();
      const N = kind === 'bunt' ? 16 : 13;
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N, p = at(u), q = c.P(...p); if (!q) continue; const s = q[2] / 1000;
        if (kind === 'bunt') { const sw = 0.05 * Math.sin(tw * 2.2 + i); poly(g, c, [[p[0] - 0.02, p[1], p[2] - 0.2], [p[0] - 0.02, p[1], p[2] + 0.2], [p[0] + sw, p[1] - 0.42, p[2]]], BUNT[i % BUNT.length]); }
        else { const r = Math.max(2, 55 * s); g.fillStyle = `rgba(255,214,130,0.42)`; ell(g, q[0], q[1] + r * 0.4, r * 1.6, r * 1.6); g.fill(); g.fillStyle = '#fff2c4'; ell(g, q[0], q[1] + r * 0.4, Math.max(1.2, r * 0.45), Math.max(1.6, r * 0.55)); g.fill(); }
      }
    }
  }

  // your stall: the counter on the south row (its painted front faces the lane), the kettle and glasses on it, the blue tarp over it
  function stall(g, c) {
    const x0 = STALL.x0, x1 = STALL.x1, zb = ZS, zf = STALL.front, top = 1.05;
    if (c.Z0 < zb) return;
    poly(g, c, fr(x0, x1, 0, 2.9, zb + 0.01), '#2b1d14');
    poly(g, c, [[x0, top, zb], [x1, top, zb], [x1, top, zf], [x0, top, zf]], '#c99a5e');                 // the counter's top
    poly(g, c, fr(x0, x1, 0, top, zf), '#7a4a24');                                                          // its front
    poly(g, c, fr(x0 + 0.15, x1 - 0.15, 0.12, 0.88, zf + 0.01), '#1f6f8f');
    for (let i = 0; i < 7; i++) { const xx = x0 + 0.35 + i * 0.38; poly(g, c, [[xx, 0.5, zf + 0.02], [xx + 0.12, 0.62, zf + 0.02], [xx, 0.74, zf + 0.02], [xx - 0.12, 0.62, zf + 0.02]], i % 2 ? '#e8712a' : '#f6efe0'); }
    poly(g, c, [[x0 - 0.1, 2.9, zb], [x1 + 0.1, 2.9, zb], [x1 + 0.1, 2.5, zf - 0.5], [x0 - 0.1, 2.5, zf - 0.5]], '#2b6fb3');   // the tarp
    const k = c.P(x0 + 0.55, top, -2.15); if (k) { const s = k[2] / 1000; g.save(); g.translate(k[0], k[1]); g.scale(s, s); g.fillStyle = '#8f949b'; R(g, -110, -280, 220, 280, 40); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; R(g, -90, -260, 30, 220, 14); g.fill(); g.restore(); }
  }

  // ------------------------------------------------------------------ the whole lane for a camera. o.people(g, c, pass): the film's own
  // drawing, called three times: 'beyond' (anyone past a gate, before the gates are drawn over them), 'lane' (everyone in the lane, sorted by
  // the film) and 'over' (nothing of the world after it). o.tw: the world's own clock (the bunting, the steam).
  function lane(g, c, o = {}) {
    sky(g, c);
    beyond(g, c, -1); beyond(g, c, 1);
    if (o.people) o.people(g, c, 'beyond');
    // the shops, far ones first
    const rows = [...NORTH.map((s, i) => ({ s, side: 1, i })), ...SOUTH.map((s, i) => ({ s, side: -1, i }))];
    rows.sort((a, b) => dist(c, (b.s[0] + b.s[1]) / 2, b.side > 0 ? ZN : ZS) - dist(c, (a.s[0] + a.s[1]) / 2, a.side > 0 ? ZN : ZS));
    ground(g, c);
    for (const r of rows) { shop(g, c, r.s, r.side, r.i); if (r.s[2] === 'barber') barberCorner(g, c); }
    // the gates over the ends of the rows
    gate(g, c, GW, -1, 'WEST GATE'); gate(g, c, GE, 1, 'EAST GATE');
    stall(g, c);
    strings(g, c, o.tw || 0);
    if (o.people) o.people(g, c, 'lane');
  }
  const dist = (c, X, Z) => Math.hypot(X - c.X0, Z - c.Z0);

  window.WORLD = { cam, lane, poly, sub, line3, planeText, barberChair, BCHAIR, GW, GE, ZS, ZN, YOU, STALL, NORTH, SOUTH };
})();
