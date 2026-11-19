// Reel 44 · One Word: the street, the cart, the rickshaw, the fruit and the crash. This reel's own drawings: nothing in this
// file comes from another reel (the bodies are drawn by film/rig.js, reel 42's). Units are metres. X runs along the road
// (screen right in the wide), Y up, Z away from the witness: the near kerb at Z = 0, the far kerb at Z = ROAD_W, the
// far pavement, a step, then the shops. The cart stands on the road at the far kerb; the old man behind it on the pavement.
// The crash is a simulation run once at load with a fixed step and no randomness (seeded noise only), recorded at 240 Hz and
// read back by the frame's own time, so seek(t) can paint any frame in any order. Nothing in the street is breakable glass:
// the rickshaw's windscreen stays whole, it has no mirrors, and the only other glass is one chai glass, held, unbroken.
(() => {
  const C = window.C, R = window.RIG, { clamp, lerp } = C, { mix, rgba, sstep, TAU, PI } = R;
  const NEAR = 0.12;

  // ------------------------------------------------------------------ vectors and poses
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const mj = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // A pose: where a thing is and which way its own axes point, [forward, up, left] as the rig's walkers. h is the rig's heading
  // (0 faces +Z, π/2 faces +X); pitch lifts the nose; roll leans it over to its own left.
  function pose(p, h, pitch = 0, roll = 0) {
    let F = [Math.sin(h), 0, Math.cos(h)], U = [0, 1, 0], L = [-Math.cos(h), 0, Math.sin(h)];
    if (pitch) { const c = Math.cos(pitch), s = Math.sin(pitch), F1 = add(mul(F, c), mul(U, s)); U = sub(mul(U, c), mul(F, s)); F = F1; }
    if (roll) { const c = Math.cos(roll), s = Math.sin(roll), U1 = add(mul(U, c), mul(L, s)); L = sub(mul(L, c), mul(U, s)); U = U1; }
    return { p, F, U, L };
  }
  const at = (P, v) => [P.p[0] + v[0] * P.F[0] + v[1] * P.U[0] + v[2] * P.L[0], P.p[1] + v[0] * P.F[1] + v[1] * P.U[1] + v[2] * P.L[1], P.p[2] + v[0] * P.F[2] + v[1] * P.U[2] + v[2] * P.L[2]];
  const dirOf = (P, v) => [v[0] * P.F[0] + v[1] * P.U[0] + v[2] * P.L[0], v[0] * P.F[1] + v[1] * P.U[1] + v[2] * P.L[1], v[0] * P.F[2] + v[1] * P.U[2] + v[2] * P.L[2]];
  const toLocal = (P, w) => { const d = sub(w, P.p); return [dot(d, P.F), dot(d, P.U), dot(d, P.L)]; };
  // turn a pose about a line in the world (a point on it, its unit direction) by angle a (right-handed)
  function turnAbout(P, o, ax, a) {
    const rot = (v) => { const c = Math.cos(a), s = Math.sin(a), d = dot(ax, v); return add(add(mul(v, c), mul(cross(ax, v), s)), mul(ax, d * (1 - c))); };
    return { p: add(o, rot(sub(P.p, o))), F: rot(P.F), U: rot(P.U), L: rot(P.L) };
  }
  // quaternions, for how a rolling fruit is turned
  const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const qrot = (q, v) => { const p = qmul(qmul(q, [0, v[0], v[1], v[2]]), [q[0], -q[1], -q[2], -q[3]]); return [p[1], p[2], p[3]]; };
  const qaxis = (ax, a) => { const s = Math.sin(a / 2); return [Math.cos(a / 2), ax[0] * s, ax[1] * s, ax[2] * s]; };
  const qnorm = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };

  // ------------------------------------------------------------------ light
  const SUN = nrm([-0.42, 0.78, -0.46]);               // towards the morning sun: high, to the left, a little behind the witness
  R.setSun(SUN);
  const SHADE = '#3f3956', LIGHT = '#fff1d0';
  function lit(col, k) {                               // a flat face: k is its normal against the sun (−1 … 1)
    return k < 0.3 ? mix(col, SHADE, 0.46 * clamp((0.3 - k) / 0.8)) : mix(col, LIGHT, 0.2 * clamp((k - 0.3) / 0.7));
  }

  // ------------------------------------------------------------------ drawing faces in depth order
  // A face: { w: [world points], c: colour, n?: normal (else from the points), two?: drawn from both sides, a?: alpha,
  // ed?: an edge colour, fl?: flat (not shaded), d?: depth bias }. Items: { d, fn } drawn among them by depth.
  function faceN(w) { const a = sub(w[1], w[0]), b = sub(w[2], w[0]); let n = cross(a, b); if (w.length > 3) n = add(n, cross(sub(w[2], w[0]), sub(w[3], w[0]))); return nrm(n); }
  function cen(w) { let x = 0, y = 0, z = 0; for (const p of w) { x += p[0]; y += p[1]; z += p[2]; } return [x / w.length, y / w.length, z / w.length]; }
  function faceItems(cam, faces, out = []) {
    const cp = [cam.x, cam.y, cam.z];
    for (const f of faces) {
      const c0 = cen(f.w); let n = f.n || faceN(f.w);
      const vis = dot(n, sub(cp, c0));
      if (vis < 0) { if (!f.two) continue; n = mul(n, -1); }
      const q = cam.toCam(c0[0], c0[1], c0[2]); if (q[2] < NEAR && !f.big) continue;
      out.push({ d: q[2] + (f.d || 0), f, n });
    }
    return out;
  }
  function paintFace(g, cam, it) {
    const f = it.f, col = f.fl ? f.c : lit(f.c, dot(it.n, SUN));
    const q = R.clipNear(f.w.map((p) => cam.toCam(p[0], p[1], p[2]))); if (q.length < 3) return;
    g.beginPath(); for (let i = 0; i < q.length; i++) { const s = cam.scr(q[i]); if (i) g.lineTo(s[0], s[1]); else g.moveTo(s[0], s[1]); } g.closePath();
    if (f.a != null) g.globalAlpha = f.a;
    g.fillStyle = col; g.fill();
    g.lineJoin = 'round'; g.strokeStyle = f.ed || col; g.lineWidth = f.ed ? (f.ew || 1.4) : 0.9; g.stroke();
    if (f.a != null) g.globalAlpha = 1;
  }
  function drawItems(g, cam, items) {
    items.sort((a, b) => b.d - a.d);
    for (const it of items) { if (it.fn) it.fn(); else paintFace(g, cam, it); }
  }
  // building blocks, in an object's own frame (P)
  function quad(P, a, b, c, d, col, o = {}) { return { w: [at(P, a), at(P, b), at(P, c), at(P, d)], c: col, ...o }; }
  function box(P, cx, cy, cz, hx, hy, hz, col, o = {}) {
    const v = (sx, sy, sz) => [cx + sx * hx, cy + sy * hy, cz + sz * hz];
    const top = o.top || col, side = o.side || col, f = [];
    f.push(quad(P, v(-1, 1, -1), v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1), top, o));          // up
    f.push(quad(P, v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1), mix(col, '#000000', 0.3), o));   // down
    f.push(quad(P, v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), v(1, -1, 1), o.front || side, o));  // forward
    f.push(quad(P, v(-1, -1, 1), v(-1, 1, 1), v(-1, 1, -1), v(-1, -1, -1), o.back || side, o)); // back
    f.push(quad(P, v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1), o.left || col, o));   // left
    f.push(quad(P, v(-1, -1, -1), v(-1, 1, -1), v(1, 1, -1), v(1, -1, -1), o.right || col, o)); // right
    return f;
  }
  // a tube between two local points (n sides), for poles, bars and handles
  function tube(P, a, b, r, col, n = 6, o = {}) {
    const A = at(P, a), B = at(P, b), ax = nrm(sub(B, A)), t0 = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = nrm(cross(ax, t0)), v = cross(ax, u), f = [];
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, d0 = add(mul(u, Math.cos(a0) * r), mul(v, Math.sin(a0) * r)), d1 = add(mul(u, Math.cos(a1) * r), mul(v, Math.sin(a1) * r));
      f.push({ w: [add(A, d0), add(B, d0), add(B, d1), add(A, d1)], c: col, ...o });
    }
    return f;
  }
  // a wheel: a tyre, a rim and spokes (turned by spin) in the plane across axle (world); one drawable item
  function wheelItem(g, cam, c, axle, r, spin, o = {}) {
    const q0 = cam.toCam(c[0], c[1], c[2]); if (q0[2] < NEAR) return null;
    return { d: q0[2] + (o.d || 0), fn: () => drawWheel(g, cam, c, axle, r, spin, o) };
  }
  function drawWheel(g, cam, c, axle, r, spin, o) {
    const ax = nrm(axle), t0 = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = nrm(cross(ax, t0)), v = cross(ax, u);
    const ring = (rr, off = 0, N = 28) => { const pts = []; for (let i = 0; i < N; i++) { const a = i / N * TAU, p = add(add(c, mul(ax, off)), add(mul(u, Math.cos(a) * rr), mul(v, Math.sin(a) * rr))), s = cam.P(p[0], p[1], p[2]); if (!s) return null; pts.push(s); } return pts; };
    const path = (pts) => { g.beginPath(); pts.forEach((s, i) => (i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]))); g.closePath(); };
    const w = o.w || 0.05, tyre = o.tyre || '#1c1b1d', hub = o.hub || '#6d6a66';
    const cp = [cam.x, cam.y, cam.z], side = dot(ax, sub(cp, c)) > 0 ? 1 : -1;
    const back = ring(r, -side * w), front = ring(r, side * w); if (!back || !front) return;
    g.fillStyle = mix(tyre, '#000000', 0.2); path(back); g.fill();
    // the tread between the two faces: the hull of both rings is close enough for a round tyre
    g.fillStyle = mix(tyre, '#000000', 0.1); g.beginPath(); for (let i = 0; i < back.length; i++) { g.moveTo(back[i][0], back[i][1]); g.lineTo(front[i][0], front[i][1]); g.lineTo(front[(i + 1) % back.length][0], front[(i + 1) % back.length][1]); g.lineTo(back[(i + 1) % back.length][0], back[(i + 1) % back.length][1]); g.closePath(); } g.fill();
    g.fillStyle = tyre; path(front); g.fill();
    const rim = ring(r * (o.rimK || 0.78), side * w * 1.02); if (!rim) return;
    g.fillStyle = o.rimC || '#8e8a84'; path(rim); g.fill();
    const inner = ring(r * (o.rimK || 0.78) * 0.9, side * w * 1.03); g.fillStyle = o.rimIn || '#2a2a2c'; path(inner); g.fill();
    // spokes
    const ns = o.spokes ?? 12, sc = cam.P(c[0] + ax[0] * side * w, c[1] + ax[1] * side * w, c[2] + ax[2] * side * w); if (!sc) return;
    g.strokeStyle = o.spokeC || '#b9b4ab'; g.lineWidth = Math.max(1, (o.spokeW || 0.008) * sc[2]); g.lineCap = 'round';
    g.beginPath();
    for (let i = 0; i < ns; i++) { const a = spin + i / ns * TAU, p = add(add(c, mul(ax, side * w)), add(mul(u, Math.cos(a) * r * 0.7), mul(v, Math.sin(a) * r * 0.7))), s = cam.P(p[0], p[1], p[2]); if (s) { g.moveTo(sc[0], sc[1]); g.lineTo(s[0], s[1]); } }
    g.stroke();
    g.fillStyle = hub; g.beginPath(); g.arc(sc[0], sc[1], Math.max(1.5, r * 0.16 * sc[2]), 0, TAU); g.fill();
    if (o.cap) { g.fillStyle = o.cap; g.beginPath(); g.arc(sc[0], sc[1], Math.max(1, r * 0.08 * sc[2]), 0, TAU); g.fill(); }
  }

  // ------------------------------------------------------------------ the street (static)
  const ROAD_W = 4.8, KERB_H = 0.16, PAVE_Z = 7.4, STEP_H = 0.4, SHOP_Z = 7.95;
  const PAL = { road: '#7b746c', roadD: '#6a645d', pave: '#c4b59b', paveJ: '#a99a80', kerbY: '#e8bd2c', kerbB: '#26262a', step: '#ad9f88' };
  // the shops along the far side: [x0, x1, plaster, shutter or open, awning colours, signboard]
  const SHOPS0 = [
    [-15.5, -11.8, '#e3c39a', 'open', ['#b8473c', '#efe2c8'], '#2d5d8c'],
    [-11.8, -8.2, '#d7a48d', 'shut', ['#3f6f9e', '#e8dcc4'], '#a33b2e'],
    [-8.2, -4.4, '#e9d8bd', 'open', ['#c9862e', '#f0e4cc'], '#38506e'],
    [-4.4, -0.85, '#cfa69a', 'half', ['#5b4a8c', '#ece0c8'], '#8c3a3a'],
    [-0.85, 2.6, '#e4cfa4', 'shut', ['#a8402f', '#f1e5cb'], '#2f6b78'],
    [2.6, 6.2, '#d9b6a2', 'open', ['#2f6c8e', '#eadfc6'], '#9b6a2a'],
    [6.2, 10.0, '#e7d4b2', 'half', ['#8a3d52', '#efe3c9'], '#355f8a'],
    [10.0, 14.0, '#d3aa94', 'shut', ['#3e7a96', '#e9ddc5'], '#94402f'],
  ];
  const SHOPS = [];
  for (let rep_ = -2; rep_ <= 3; rep_++) for (const sh of SHOPS0) { const d = rep_ * 29.5; SHOPS.push([sh[0] + d, sh[1] + d, ...sh.slice(2)]); }
  const STATIC = (() => {                              // the street's faces, built once (world space)
    const P0 = { p: [0, 0, 0], F: [1, 0, 0], U: [0, 1, 0], L: [0, 0, 1] };   // the world's own frame: forward +X, left +Z
    const f = [], X0 = -70, X1 = 110;
    // ground under everything, then the road, the kerbs, the pavement, the step
    f.push({ w: [[X0, 0, ROAD_W], [X1, 0, ROAD_W], [X1, 0, -6], [X0, 0, -6]], c: PAL.road, n: [0, 1, 0], big: true, d: 1e4 });
    // patches in the asphalt (darker, worn), seeded: no bright specks anywhere on the road
    for (let i = 0; i < 26; i++) {
      const x = -9 + hash(i) * 18, z = 0.4 + hash(i + 50) * (ROAD_W - 0.9), w = 0.4 + hash(i + 90) * 1.4, d = 0.2 + hash(i + 130) * 0.6, a = hash(i + 170) * PI;
      const c = Math.cos(a), s = Math.sin(a), pts = [];
      for (let k = 0; k < 7; k++) { const t = k / 7 * TAU, rr = 0.75 + 0.25 * hash(i * 7 + k); pts.push([x + (Math.cos(t) * w * c - Math.sin(t) * d * s) * rr, 0.001, z + (Math.cos(t) * w * s + Math.sin(t) * d * c) * rr]); }
      f.push({ w: pts.reverse(), c: hash(i + 210) > 0.5 ? PAL.roadD : mix(PAL.road, '#8a8377', 0.5), n: [0, 1, 0], d: 9e3, fl: false });
    }
    // the far kerb: its face striped yellow and black, and its top
    for (let x = X0; x < X1; x += 0.6) {
      const k = Math.round((x - X0) / 0.6) % 2;
      f.push({ w: [[x, 0, ROAD_W], [x, KERB_H, ROAD_W], [x + 0.6, KERB_H, ROAD_W], [x + 0.6, 0, ROAD_W]], c: k ? PAL.kerbY : PAL.kerbB, n: [0, 0, -1], d: 8e3 });
      f.push({ w: [[x, KERB_H, ROAD_W], [x, KERB_H, ROAD_W + 0.22], [x + 0.6, KERB_H, ROAD_W + 0.22], [x + 0.6, KERB_H, ROAD_W]], c: k ? mix(PAL.kerbY, '#ffffff', 0.1) : '#3a3a3e', n: [0, 1, 0], d: 8e3 });
    }
    f.push({ w: [[X0, KERB_H, ROAD_W + 0.22], [X0, KERB_H, PAVE_Z], [X1, KERB_H, PAVE_Z], [X1, KERB_H, ROAD_W + 0.22]], c: PAL.pave, n: [0, 1, 0], big: true, d: 7e3 });
    // the step along the shops
    f.push({ w: [[X0, KERB_H, PAVE_Z], [X0, STEP_H, PAVE_Z], [X1, STEP_H, PAVE_Z], [X1, KERB_H, PAVE_Z]], c: mix(PAL.step, '#000000', 0.12), n: [0, 0, -1], d: 6e3 });
    f.push({ w: [[X0, STEP_H, PAVE_Z], [X0, STEP_H, SHOP_Z], [X1, STEP_H, SHOP_Z], [X1, STEP_H, PAVE_Z]], c: PAL.step, n: [0, 1, 0], d: 6e3 });
    // the near kerb (mostly under the witness)
    for (let x = X0; x < X1; x += 0.6) { const k = Math.round((x - X0) / 0.6) % 2; f.push({ w: [[x + 0.6, 0, 0], [x + 0.6, KERB_H, 0], [x, KERB_H, 0], [x, 0, 0]], c: k ? PAL.kerbY : PAL.kerbB, n: [0, 0, 1], d: 8e3 }); }
    f.push({ w: [[X0, KERB_H, 0], [X1, KERB_H, 0], [X1, KERB_H, -6], [X0, KERB_H, -6]], c: PAL.pave, n: [0, 1, 0], big: true, d: 7e3 });
    // the shops
    for (const [x0, x1, pl, kind, aw, sign] of SHOPS) {
      const wall = (a, b, y0, y1, c, d = 0, n = [0, 0, -1]) => f.push({ w: [[a, y0, SHOP_Z - d], [a, y1, SHOP_Z - d], [b, y1, SHOP_Z - d], [b, y0, SHOP_Z - d]], c, n, d: 5e3 - d * 100 });
      wall(x0, x1, 3.5, 11, pl);                                           // the upper floors
      wall(x0, x0 + 0.32, STEP_H, 3.5, mix(pl, '#000000', 0.06), 0.04);    // pillars
      wall(x1 - 0.32, x1, STEP_H, 3.5, mix(pl, '#000000', 0.06), 0.04);
      wall(x0 + 0.32, x1 - 0.32, 2.9, 3.5, mix(pl, '#ffffff', 0.1), 0.02); // the lintel
      const sx0 = x0 + 0.32, sx1 = x1 - 0.32, top = kind === 'half' ? 1.7 : kind === 'open' ? 2.9 : STEP_H;
      if (kind !== 'shut') wall(sx0, sx1, STEP_H, 2.9, '#3b2f2a', -0.01);  // the dark inside
      if (top < 2.9) wall(sx0, sx1, top, 2.9, '#9aa0a6', 0.01);             // the rolling shutter
      // the signboard over the shutter: a painted board, no words
      f.push({ w: [[x0 + 0.5, 3.62, SHOP_Z - 0.06], [x0 + 0.5, 4.32, SHOP_Z - 0.06], [x1 - 0.5, 4.32, SHOP_Z - 0.06], [x1 - 0.5, 3.62, SHOP_Z - 0.06]], c: sign, n: [0, 0, -1], d: 4e3 });
      // upper windows: wooden shutters in a frame, no glass
      const nw = Math.max(1, Math.round((x1 - x0) / 1.7));
      for (let k = 0; k < nw; k++) {
        const cx = lerp(x0, x1, (k + 0.5) / nw);
        for (const y0 of [5.0, 8.0]) {
          f.push({ w: [[cx - 0.55, y0, SHOP_Z - 0.03], [cx - 0.55, y0 + 1.5, SHOP_Z - 0.03], [cx + 0.55, y0 + 1.5, SHOP_Z - 0.03], [cx + 0.55, y0, SHOP_Z - 0.03]], c: mix(pl, '#5a3f2e', 0.55), n: [0, 0, -1], d: 4e3 });
          f.push({ w: [[cx - 0.46, y0 + 0.08, SHOP_Z - 0.05], [cx - 0.46, y0 + 1.42, SHOP_Z - 0.05], [cx + 0.46, y0 + 1.42, SHOP_Z - 0.05], [cx + 0.46, y0 + 0.08, SHOP_Z - 0.05]], c: hash(x0 * 3 + k + y0) > 0.5 ? '#6e4a34' : '#4a6a7a', n: [0, 0, -1], d: 3.9e3 });
        }
        // a small balcony ledge
        f.push({ w: [[cx - 0.8, 4.9, SHOP_Z], [cx - 0.8, 4.9, SHOP_Z - 0.5], [cx + 0.8, 4.9, SHOP_Z - 0.5], [cx + 0.8, 4.9, SHOP_Z]], c: mix(pl, '#000000', 0.2), n: [0, -1, 0], two: true, d: 3.8e3 });
      }
    }
    // the near side: the same kind of street, facing the road (its own colours and order)
    const NEAR_Z = -2.6;
    for (let i = 0; i < SHOPS.length; i++) {
      const [x0, x1, pl, kind, , sign] = SHOPS[(i + 3) % SHOPS.length], ox = SHOPS[i][0] - x0 + 1.3;
      const a = x0 + ox, b = x1 + ox;
      const wall = (u0, u1, y0, y1, c, d = 0) => f.push({ w: [[u1, y0, NEAR_Z + d], [u1, y1, NEAR_Z + d], [u0, y1, NEAR_Z + d], [u0, y0, NEAR_Z + d]], c, n: [0, 0, 1], d: 5e3 - d * 100 });
      wall(a, b, 3.5, 11, mix(pl, '#d8c8b0', 0.3));
      wall(a, a + 0.32, KERB_H, 3.5, mix(pl, '#000000', 0.06), 0.04); wall(b - 0.32, b, KERB_H, 3.5, mix(pl, '#000000', 0.06), 0.04);
      wall(a + 0.32, b - 0.32, KERB_H, 2.9, kind === 'shut' ? '#9aa0a6' : '#3b2f2a', -0.01);
      wall(a + 0.32, b - 0.32, 2.9, 3.5, mix(pl, '#ffffff', 0.1), 0.02);
      f.push({ w: [[b - 0.5, 3.62, NEAR_Z + 0.06], [b - 0.5, 4.32, NEAR_Z + 0.06], [a + 0.5, 4.32, NEAR_Z + 0.06], [a + 0.5, 3.62, NEAR_Z + 0.06]], c: sign, n: [0, 0, 1], d: 4e3 });
      const nw = Math.max(1, Math.round((b - a) / 1.7));
      for (let k = 0; k < nw; k++) { const cx = lerp(a, b, (k + 0.5) / nw); for (const y0 of [5.0, 8.0]) f.push({ w: [[cx + 0.5, y0, NEAR_Z + 0.04], [cx + 0.5, y0 + 1.45, NEAR_Z + 0.04], [cx - 0.5, y0 + 1.45, NEAR_Z + 0.04], [cx - 0.5, y0, NEAR_Z + 0.04]], c: mix(pl, '#5a3f2e', 0.5), n: [0, 0, 1], d: 3.9e3 }); }
    }
    return f;
  })();
  // things in front of the shops that move or need their own depth: awnings (cloth, striped), the pole and its wires
  function awnings(t) {
    const f = [];
    for (const [x0, x1, , , aw] of SHOPS) {
      const n = Math.max(4, Math.round((x1 - x0) / 0.45)), y0 = 3.05, y1 = 2.62, z0 = SHOP_Z - 0.02, z1 = SHOP_Z - 0.95;
      for (let k = 0; k < n; k++) {
        const a = lerp(x0 + 0.2, x1 - 0.2, k / n), b = lerp(x0 + 0.2, x1 - 0.2, (k + 1) / n), sag = 0.03 * Math.sin(t * 0.9 + x0 + k);
        f.push({ w: [[a, y0, z0], [b, y0, z0], [b, y1 + sag, z1], [a, y1 + sag, z1]], c: aw[k % 2], two: true, d: 0 });
      }
      // the scalloped valance hanging off the front
      for (let k = 0; k < n; k++) { const a = lerp(x0 + 0.2, x1 - 0.2, k / n), b = lerp(x0 + 0.2, x1 - 0.2, (k + 1) / n); f.push({ w: [[a, y1, z1], [b, y1, z1], [(a + b) / 2, y1 - 0.16, z1 - 0.01]], c: aw[k % 2], two: true }); }
    }
    return f;
  }

  // ------------------------------------------------------------------ the cart
  // Its frame: forward along its length (+X when it stands at the kerb), up, left towards the kerb. The bed's top is at 0.82.
  const CART = { L: 0.95, W: 0.47, top: 0.82, wheelR: 0.28, wx: 0.62, wz: 0.53, barY: 1.62, blue: '#2f6cb0', rimC: '#2a5d98', trim: '#d8b23a' };
  function cartFaces(P, o = {}) {
    const f = [], { L, W, top } = CART;
    f.push(...box(P, 0, top - 0.04, 0, L, 0.04, W, CART.blue, { top: '#b98c58' }));   // the bed (its top worn to bare wood)
    for (let k = 1; k < 5; k++) { const z = -W + 2 * W * k / 5; f.push(quad(P, [-L + 0.02, top + 0.002, z - 0.006], [L - 0.02, top + 0.002, z - 0.006], [L - 0.02, top + 0.002, z + 0.006], [-L + 0.02, top + 0.002, z + 0.006], '#8a643a', { d: -0.002 })); }   // the planks' seams
    // the rim boards, painted, with a yellow trim line along their tops
    const rim = (cx, cz, hx, hz) => f.push(...box(P, cx, top + 0.025, cz, hx, 0.025, hz, CART.rimC, { top: CART.trim }));
    rim(0, W - 0.015, L, 0.015); rim(0, -W + 0.015, L, 0.015); rim(L - 0.015, 0, 0.015, W); rim(-L + 0.015, 0, 0.015, W);
    // axles and the under-frame
    for (const x of [-CART.wx, CART.wx]) f.push(...tube(P, [x, CART.wheelR, -CART.wz], [x, CART.wheelR, CART.wz], 0.02, '#3a3632'));
    f.push(...box(P, 0, top - 0.12, 0, L * 0.92, 0.035, 0.05, '#25456e'));
    // the frame: two bamboo poles and the bar across the top
    for (const x of [-0.9, 0.9]) f.push(...tube(P, [x, top, 0], [x, CART.barY + 0.03, 0], 0.024, '#c9a466', 6));
    f.push(...tube(P, [-0.93, CART.barY, 0], [0.93, CART.barY, 0], 0.022, '#c09a5c', 6));
    // the handles at the back end
    for (const z of [-0.33, 0.33]) f.push(...tube(P, [L, top - 0.05, z], [L + 0.32, top + 0.04, z], 0.02, '#8a6a40', 5));
    return f;
  }
  function cartWheels(g, cam, P, spin, out) {
    for (const [x, z] of [[-CART.wx, -CART.wz], [CART.wx, -CART.wz], [-CART.wx, CART.wz], [CART.wx, CART.wz]]) {
      const it = wheelItem(g, cam, at(P, [x, CART.wheelR, z]), dirOf(P, [0, 0, 1]), CART.wheelR, spin * (z > 0 ? 1 : 1), { w: 0.022, spokes: 14, rimK: 0.9, rimC: '#9b968e', rimIn: '#3c3936', spokeC: '#a7a197', spokeW: 0.006 });
      if (it) out.push(it);
    }
  }

  // ------------------------------------------------------------------ the rickshaw
  // Its frame: forward, up, left; the origin on the ground under the middle of the rear axle. Green below, a yellow canvas
  // hood, black trims; one wheel in front, two behind; a single wiper; no mirrors (nothing that could break).
  const RK = { rw: 0.2, rearZ: 0.56, frontX: 1.92, green: '#2f8a4c', greenD: '#226a3a', yellow: '#f2c230', black: '#1e1e21' };
  const RK_PLAN = [[-0.44, 0.6], [0.62, 0.62], [1.28, 0.44], [1.70, 0.31], [1.84, 0.0]];   // the tub's half-width along its length (top view)
  function rkHalfW(x) { for (let i = 1; i < RK_PLAN.length; i++) if (x <= RK_PLAN[i][0]) return lerp(RK_PLAN[i - 1][1], RK_PLAN[i][1], (x - RK_PLAN[i - 1][0]) / (RK_PLAN[i][0] - RK_PLAN[i - 1][0])); return 0; }
  const BELT = (x) => (x < 0.55 ? 0.8 : x < 0.72 ? lerp(0.8, 0.6, (x - 0.55) / 0.17) : x < 1.22 ? 0.6 : lerp(0.6, 1.02, clamp((x - 1.22) / 0.4)));   // the top edge of the green tub
  // the windscreen, as a quad in the rickshaw's frame: bottom left, bottom right, top right, top left (left = +z)
  const WS = { bl: [1.64, 1.06, 0.43], br: [1.64, 1.06, -0.43], tr: [1.5, 1.58, -0.49], tl: [1.5, 1.58, 0.49] };
  const wsPt = (u, v) => {                            // u 0 (its left) … 1 (its right), v 0 (bottom) … 1 (top)
    const b = [lerp(WS.bl[0], WS.br[0], u), lerp(WS.bl[1], WS.br[1], u), lerp(WS.bl[2], WS.br[2], u)], t = [lerp(WS.tl[0], WS.tr[0], u), lerp(WS.tl[1], WS.tr[1], u), lerp(WS.tl[2], WS.tr[2], u)];
    return [lerp(b[0], t[0], v), lerp(b[1], t[1], v), lerp(b[2], t[2], v)];
  };
  const WIPER = { u: 0.42, len: 0.45 };              // its pivot along the bottom edge, and its arm
  function rickshawFaces(P, o = {}) {
    const f = [], G = o.green || RK.green, Y = o.yellow || RK.yellow, B = RK.black;
    // the tub: side panels from the floor up to the beltline, in strips along its length
    const xs = [-0.44, -0.2, 0.1, 0.4, 0.62, 0.8, 1.0, 1.22, 1.42, 1.62, 1.76, 1.84];
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i], b = xs[i + 1], wa = rkHalfW(a), wb = rkHalfW(b), ha = BELT(a), hb = BELT(b), y0 = 0.3;
      for (const s of [1, -1]) f.push(quad(P, [a, y0, s * wa], [b, y0, s * wb], [b, hb, s * wb], [a, ha, s * wa], G, { two: true }));
      f.push(quad(P, [a, y0, -wa], [b, y0, -wb], [b, y0, wb], [a, y0, wa], mix(G, '#000000', 0.35), { two: true }));   // its floor
      if (i < 3) f.push(quad(P, [a, ha, -wa], [b, hb, -wb], [b, hb, wb], [a, ha, wa], mix(G, '#000000', 0.2), { two: true }));   // the deck over the engine, under the seat
    }
    // the black rubbing strip along each side, and a yellow pinstripe over it
    for (let i = 0; i < xs.length - 2; i++) {
      const a = xs[i], b = xs[i + 1], wa = rkHalfW(a) + 0.005, wb = rkHalfW(b) + 0.005;
      for (const s of [1, -1]) f.push(quad(P, [a, 0.42, s * wa], [b, 0.42, s * wb], [b, 0.47, s * wb], [a, 0.47, s * wa], B, { two: true, d: -0.01 }));
      for (const s of [1, -1]) f.push(quad(P, [a, BELT(a) - 0.06, s * wa], [b, BELT(b) - 0.06, s * wb], [b, BELT(b) - 0.035, s * wb], [a, BELT(a) - 0.035, s * wa], Y, { two: true, d: -0.01 }));
    }
    // the back panel, with two round lamps
    f.push(quad(P, [-0.44, 0.3, 0.6], [-0.44, 0.3, -0.6], [-0.44, 0.8, -0.6], [-0.44, 0.8, 0.6], G, { two: true }));
    // the nose: the front cowl's face, slanting back, and its top
    f.push(quad(P, [1.84, 0.3, 0.28], [1.84, 0.3, -0.28], [1.68, 1.06, -0.4], [1.68, 1.06, 0.4], G, { two: true }));
    f.push(quad(P, [1.68, 1.06, 0.4], [1.68, 1.06, -0.4], [1.6, 1.07, -0.44], [1.6, 1.07, 0.44], mix(G, '#000000', 0.15), { two: true }));
    f.push(quad(P, [1.8, 0.52, 0.29], [1.8, 0.52, -0.29], [1.74, 0.78, -0.33], [1.74, 0.78, 0.33], Y, { two: true, d: -0.005 }));   // a yellow band across the nose
    // the front mudguard and fork
    f.push(...tube(P, [1.8, 0.45, 0], [RK.frontX, RK.rw, 0], 0.03, B, 5));
    f.push(quad(P, [1.76, 0.44, 0.1], [1.76, 0.44, -0.1], [2.1, 0.34, -0.1], [2.1, 0.34, 0.1], G, { two: true }));
    // the windscreen's black frame (the glass itself is drawn later, over the driver)
    const fr = (a, b, w = 0.035) => { const A = a, Bv = b, n = 0; f.push(quad(P, [A[0], A[1] - w, A[2]], [Bv[0], Bv[1] - w, Bv[2]], [Bv[0], Bv[1] + w, Bv[2]], [A[0], A[1] + w, A[2]], B, { two: true, d: -0.03 })); };
    fr(WS.bl, WS.br); fr(WS.tl, WS.tr);
    f.push(quad(P, [WS.bl[0], WS.bl[1], WS.bl[2] + 0.035], [WS.tl[0], WS.tl[1], WS.tl[2] + 0.035], [WS.tl[0], WS.tl[1], WS.tl[2] - 0.03], [WS.bl[0], WS.bl[1], WS.bl[2] - 0.03], B, { two: true, d: -0.03 }));
    f.push(quad(P, [WS.br[0], WS.br[1], WS.br[2] + 0.03], [WS.tr[0], WS.tr[1], WS.tr[2] + 0.03], [WS.tr[0], WS.tr[1], WS.tr[2] - 0.035], [WS.br[0], WS.br[1], WS.br[2] - 0.035], B, { two: true, d: -0.03 }));
    // the hood: a canvas roof over a curved profile, from the top of the windscreen to the back
    const prof = [[1.5, 1.6], [1.42, 1.69], [1.2, 1.745], [0.75, 1.77], [0.2, 1.765], [-0.2, 1.73], [-0.42, 1.62], [-0.5, 1.42], [-0.5, 1.12], [-0.47, 0.82]];
    const hw = 0.665;
    for (let i = 0; i < prof.length - 1; i++) {
      const [a0, b0] = prof[i], [a1, b1] = prof[i + 1];
      f.push(quad(P, [a0, b0, hw], [a1, b1, hw], [a1, b1, -hw], [a0, b0, -hw], Y, { two: true, ed: mix(Y, '#6b4a10', 0.35), ew: 1 }));
    }
    // its sides: closed canvas behind the passenger seat, open over the seats and for the driver
    for (const s of [1, -1]) {
      const pts = [[-0.47, 0.8], [-0.5, 1.12], [-0.5, 1.42], [-0.42, 1.62], [-0.2, 1.73], [0.0, 1.75], [0.0, 0.8]];
      f.push({ w: pts.map(([x, y]) => at(P, [x, y, s * hw])), c: mix(Y, '#000000', 0.05), two: true, ed: mix(Y, '#6b4a10', 0.4), ew: 1 });
      // the black rail along the hood's edge, and the pillar by the driver
      f.push(...tube(P, [0.0, 1.74, s * (hw - 0.01)], [1.45, 1.66, s * (hw - 0.02)], 0.018, B, 4));
      f.push(...tube(P, [0.55, 0.8, s * 0.6], [0.55, 1.76, s * 0.64], 0.018, B, 4));
      f.push(...tube(P, [1.45, 1.06, s * 0.43], [1.47, 1.66, s * 0.5], 0.02, B, 4));
    }
    // the passenger bench and its backrest, the driver's seat and the handlebar
    f.push(...box(P, 0.06, 0.74, 0, 0.26, 0.05, 0.55, '#2a2a2e'));
    f.push(...box(P, -0.3, 1.0, 0, 0.05, 0.24, 0.55, '#2a2a2e'));
    f.push(...box(P, 1.06, 0.78, 0, 0.17, 0.05, 0.2, '#2a2a2e'));
    f.push(...tube(P, [1.42, 1.0, 0.3], [1.42, 1.0, -0.3], 0.016, B, 4));
    f.push(...tube(P, [1.42, 1.0, 0], [1.62, 0.8, 0], 0.025, B, 4));
    return f;
  }
  // the parts drawn over the driver: the glass (with the papaya on it), the wiper, the headlamp, the lemon and chillies
  function rickshawFront(g, cam, P, o = {}) {
    const S = (v) => { const w = at(P, v); return cam.P(w[0], w[1], w[2]); };
    const corners = [WS.bl, WS.br, WS.tr, WS.tl].map(S); if (corners.some((c) => !c)) return;
    const path = () => { g.beginPath(); corners.forEach((c, i) => (i ? g.lineTo(c[0], c[1]) : g.moveTo(c[0], c[1]))); g.closePath(); };
    // the glass: whole, faintly blue, with a soft band of reflected sky
    g.save(); path(); g.clip();
    const k = clamp(dot(nrm(dirOf(P, [0.97, 0.26, 0])), SUN) * 0.5 + 0.5);
    g.fillStyle = `rgba(190,215,230,${0.2 + 0.08 * k})`; g.fillRect(-4000, -4000, 9000, 9000);
    // a broad soft reflection that slides across as the glass turns (HQ's note: the glass reads as whole glass)
    const gl = o.glint ?? 0.5, c0 = S(wsPt(gl - 0.18, 0)), c1 = S(wsPt(gl + 0.1, 1));
    if (c0 && c1) {
      const gr = g.createLinearGradient(c0[0], c0[1], c1[0], c1[1]);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, `rgba(255,255,255,${0.2 + 0.25 * (o.glintA ?? 0)})`); gr.addColorStop(0.55, `rgba(255,255,255,${0.12 + 0.3 * (o.glintA ?? 0)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(-4000, -4000, 9000, 9000);
    }
    if (o.splat) o.splat(g, S);
    g.restore();
    // the wiper: an arm from its pivot along the bottom, a blade along it
    const wa = o.wiper || 0, pv = wsPt(WIPER.u, 0.03);
    const tip = (ang, r) => { const u = WIPER.u - Math.cos(ang) * r / 0.86, v = 0.03 + Math.sin(ang) * r / 0.53; return wsPt(u, v); };
    const p0 = S(pv), p1 = S(tip(wa, WIPER.len)), b0 = S(tip(wa, 0.08)), b1 = S(tip(wa, WIPER.len));
    if (p0 && p1) { g.strokeStyle = '#141416'; g.lineCap = 'round'; g.lineWidth = Math.max(1.2, 0.014 * p0[2]); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); g.lineWidth = Math.max(1.6, 0.022 * p0[2]); g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); g.stroke(); g.fillStyle = '#2a2a2e'; g.beginPath(); g.arc(p0[0], p0[1], Math.max(1.5, 0.02 * p0[2]), 0, TAU); g.fill(); }
    // the headlamp: a round lamp in a black ring, whole
    const hl = S([1.79, 0.9, 0]);
    if (hl && dot(sub([cam.x, cam.y, cam.z], at(P, [1.79, 0.9, 0])), P.F) > 0) {
      const r = 0.075 * hl[2]; g.fillStyle = '#1e1e21'; g.beginPath(); g.ellipse(hl[0], hl[1], r * 1.2 * o.hlK, r * 1.2, 0, 0, TAU); g.fill();
      g.fillStyle = '#f6efd8'; g.beginPath(); g.ellipse(hl[0], hl[1], r * o.hlK, r, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(hl[0] - r * 0.25 * o.hlK, hl[1] - r * 0.3, r * 0.3 * o.hlK, r * 0.22, 0, 0, TAU); g.fill();
    }
  }
  // the lemon and seven green chillies on a thread, hanging from the mudguard (angles from the crash's own pendulum)
  function charm(g, cam, P, swing, swingSide = 0) {
    const top = at(P, [1.98, 0.36, 0.06]), dn = (k) => add(top, add(mul(P.U, -Math.cos(swing) * k), add(mul(P.F, Math.sin(swing) * k), mul(P.L, Math.sin(swingSide) * k))));
    const a = cam.P(...top), b = cam.P(...dn(0.2)); if (!a || !b) return;
    const s = a[2];
    g.strokeStyle = '#efe6d0'; g.lineWidth = Math.max(1, 0.004 * s); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) - PI / 2;
    for (let i = 0; i < 4; i++) {                    // the chillies, in pairs down the thread, pointing out and down
      const p = cam.P(...dn(0.03 + i * 0.035)); if (!p) continue;
      for (const sd of [-1, 1]) {
        g.save(); g.translate(p[0], p[1]); g.rotate(ang + sd * (0.55 + 0.1 * i));
        g.fillStyle = '#2f8f2a'; g.beginPath(); g.moveTo(-0.006 * s, 0); g.quadraticCurveTo(-0.01 * s, 0.05 * s, 0.002 * s, 0.075 * s); g.quadraticCurveTo(0.008 * s, 0.04 * s, 0.006 * s, 0); g.closePath(); g.fill();
        g.restore();
      }
    }
    const l = cam.P(...dn(0.2)); if (!l) return;
    const lr = 0.032 * s, q = g.createRadialGradient(l[0] - lr * 0.3, l[1] - lr * 0.35, lr * 0.1, l[0], l[1], lr);
    q.addColorStop(0, '#fff7a8'); q.addColorStop(0.6, '#f1d832'); q.addColorStop(1, '#b89a14');
    g.fillStyle = q; g.beginPath(); g.ellipse(l[0], l[1], lr, lr * 0.82, ang, 0, TAU); g.fill();
    g.fillStyle = '#7a8a1a'; g.beginPath(); g.arc(l[0] + Math.sin(ang) * lr * 0.95, l[1] + Math.cos(ang) * lr * 0.95, Math.max(1, lr * 0.16), 0, TAU); g.fill();
  }

  // ------------------------------------------------------------------ fruit and things, drawn on screen
  function shadowDisc(g, cam, p, r, a = 0.3, k = 1) {   // a soft contact shadow on the ground under p
    const y0 = groundY(p[0], p[2]), q = cam.P(p[0] + SUN[0] * -0.02, y0 + 0.002, p[2]); if (!q) return;
    const h = Math.max(0, p[1] - r - y0), fade = 1 / (1 + h * 6), rr = r * q[2] * (1 + h * 1.5) * k;
    if (rr < 0.5) return;
    const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr * 1.2);
    gr.addColorStop(0, `rgba(40,28,36,${(a * fade).toFixed(3)})`); gr.addColorStop(1, 'rgba(40,28,36,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(q[0], q[1], rr * 1.2, rr * 0.5 * (0.5 + Math.abs(Math.sin(cam.pitch)) * 1.2 + 0.25), 0, 0, TAU); g.fill();
  }
  function orange(g, cam, p, r, q, o = {}) {
    const s = cam.P(p[0], p[1], p[2]); if (!s) return;
    const rr = r * s[2]; if (rr < 0.6) return;
    const L = cam.dirCam(SUN[0], SUN[1], SUN[2]), lx = L[0], ly = -L[1];
    const gr = g.createRadialGradient(s[0] + lx * rr * 0.45, s[1] + ly * rr * 0.45, rr * 0.08, s[0], s[1], rr * 1.02);
    const base = o.col || '#f08a1c';
    gr.addColorStop(0, mix(base, '#ffe1a0', 0.55)); gr.addColorStop(0.5, base); gr.addColorStop(1, mix(base, '#7a3410', 0.55));
    g.fillStyle = gr; g.beginPath(); g.arc(s[0], s[1], rr, 0, TAU); g.fill();
    if (rr > 2.5 && q) {                             // the stem's dimple, turning with the fruit, when it faces you
      const tp = qrot(q, [0, 1, 0]), c = cam.dirCam(tp[0], tp[1], tp[2]);
      if (c[2] < -0.15) { const k = -c[2]; g.fillStyle = `rgba(70,60,20,${(0.75 * k).toFixed(3)})`; g.beginPath(); g.ellipse(s[0] + c[0] * rr * 0.86, s[1] - c[1] * rr * 0.86, rr * 0.16 * Math.max(0.3, k), rr * 0.16, Math.atan2(-c[1], c[0]), 0, TAU); g.fill(); }
      const bt = qrot(q, [0.6, -0.5, 0.62]), cb = cam.dirCam(bt[0], bt[1], bt[2]);   // and a little leaf scar elsewhere
      if (cb[2] < -0.2) { g.fillStyle = 'rgba(150,70,10,0.45)'; g.beginPath(); g.arc(s[0] + cb[0] * rr * 0.8, s[1] - cb[1] * rr * 0.8, rr * 0.09, 0, TAU); g.fill(); }
    }
  }
  function papaya(g, cam, p, q, o = {}) {           // long, pear-shaped, green going to yellow; its long axis is the fruit's own x
    const s = cam.P(p[0], p[1], p[2]); if (!s) return;
    const ax = qrot(q, [1, 0, 0]), e = cam.P(p[0] + ax[0] * 0.16, p[1] + ax[1] * 0.16, p[2] + ax[2] * 0.16); if (!e) return;
    const K = 1.3, dx = (e[0] - s[0]) * K, dy = (e[1] - s[1]) * K, ang = Math.atan2(dy, dx), half = Math.max(Math.hypot(dx, dy), 0.13 * s[2]), r = 0.088 * K * s[2];   // drawn 1.3x its body: at 1x it was 10 px on a phone
    g.save(); g.translate(s[0], s[1]); g.rotate(ang);
    const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#d8d24a'); gr.addColorStop(0.45, '#9fbf3a'); gr.addColorStop(1, '#4f7a22');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-half, 0);
    g.bezierCurveTo(-half, -r * 0.95, half * 0.2, -r * 1.25, half * 0.98, -r * 0.6); g.quadraticCurveTo(half * 1.12, 0, half * 0.98, r * 0.6);
    g.bezierCurveTo(half * 0.2, r * 1.25, -half, r * 0.95, -half, 0); g.closePath(); g.fill();
    g.fillStyle = 'rgba(246,170,52,0.55)'; g.beginPath(); g.ellipse(half * 0.35, -r * 0.2, half * 0.5, r * 0.55, 0, 0, TAU); g.fill();   // ripe yellow-orange on its belly
    g.strokeStyle = 'rgba(60,90,20,0.45)'; g.lineWidth = Math.max(1, r * 0.06); g.beginPath(); g.moveTo(-half * 0.85, -r * 0.2); g.quadraticCurveTo(0, -r * 0.55, half * 0.9, -r * 0.25); g.stroke();
    g.fillStyle = '#5a4a1a'; g.beginPath(); g.arc(-half * 1.0, 0, Math.max(1, r * 0.12), 0, TAU); g.fill();
    g.restore();
  }
  function melon(g, cam, p, r, q) {                  // a whole watermelon: dark green with darker stripes that turn with it
    const s = cam.P(p[0], p[1], p[2]); if (!s) return;
    const rr = r * s[2], L = cam.dirCam(SUN[0], SUN[1], SUN[2]);
    const gr = g.createRadialGradient(s[0] + L[0] * rr * 0.4, s[1] - L[1] * rr * 0.4, rr * 0.1, s[0], s[1], rr);
    gr.addColorStop(0, '#6aa846'); gr.addColorStop(0.6, '#3c7a2c'); gr.addColorStop(1, '#1f4a1c');
    g.fillStyle = gr; g.beginPath(); g.arc(s[0], s[1], rr, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(s[0], s[1], rr, 0, TAU); g.clip();
    g.strokeStyle = 'rgba(20,50,18,0.75)'; g.lineWidth = Math.max(1, rr * 0.13); g.lineCap = 'round';
    for (let k = 0; k < 8; k++) {
      const ph = k / 8 * TAU; g.beginPath(); let on = false;
      for (let j = 0; j <= 14; j++) {
        const th = j / 14 * PI, v = qrot(q, [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]), c = cam.dirCam(v[0], v[1], v[2]);
        if (c[2] > 0.05) { on = false; continue; }
        const x = s[0] + c[0] * rr, y = s[1] - c[1] * rr; if (on) g.lineTo(x, y); else g.moveTo(x, y); on = true;
      }
      g.stroke();
    }
    g.restore();
  }
  function melonHalf(g, cam, p, r, n) {              // half a watermelon; n: the cut face's outward normal (world)
    const s = cam.P(p[0], p[1], p[2]); if (!s) return;
    const rr = r * s[2], cp = [cam.x, cam.y, cam.z], toCam = nrm(sub(cp, p)), faces = dot(n, toCam);
    // the dome: the sphere's outline on the side away from the cut
    const t1 = nrm(cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), t2 = cross(n, t1);
    const disc = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU, w = add(p, add(mul(t1, Math.cos(a) * r), mul(t2, Math.sin(a) * r))), q = cam.P(w[0], w[1], w[2]); if (q) disc.push(q); }
    g.save();
    // the dome as the full circle, clipped to the half-plane behind the cut's ellipse
    const nc = cam.dirCam(n[0], n[1], n[2]), nx = nc[0], ny = -nc[1], nl = Math.hypot(nx, ny) || 1;
    g.beginPath(); g.arc(s[0], s[1], rr, 0, TAU); g.clip();
    g.beginPath(); g.moveTo(s[0] - ny / nl * 3 * rr - nx / nl * 3 * rr, s[1] + nx / nl * 3 * rr - ny / nl * 3 * rr); g.lineTo(s[0] + ny / nl * 3 * rr - nx / nl * 3 * rr, s[1] - nx / nl * 3 * rr - ny / nl * 3 * rr);
    g.lineTo(s[0] + ny / nl * 3 * rr, s[1] - nx / nl * 3 * rr); g.lineTo(s[0] - ny / nl * 3 * rr, s[1] + nx / nl * 3 * rr); g.closePath();
    const gr = g.createRadialGradient(s[0], s[1], rr * 0.1, s[0], s[1], rr); gr.addColorStop(0, '#4f8f36'); gr.addColorStop(1, '#1f4a1c');
    g.fillStyle = gr; g.fill();
    if (disc.length > 8) { g.beginPath(); disc.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill(); }
    g.restore();
    if (disc.length > 8) {
      g.beginPath(); disc.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath();
      if (faces > 0) {                               // the red flesh, a pale rind ring, black seeds
        g.fillStyle = '#e9f0d0'; g.fill();
        const inner = disc.map((q) => [lerp(s[0], q[0], 0.86), lerp(s[1], q[1], 0.86)]);
        g.beginPath(); inner.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath();
        const fl = g.createRadialGradient(s[0], s[1], 0, s[0], s[1], rr); fl.addColorStop(0, '#ff5a6a'); fl.addColorStop(1, '#d8283e'); g.fillStyle = fl; g.fill();
        g.fillStyle = '#1a1210';
        for (let k = 0; k < 9; k++) { const a = k * 2.4 + 0.3, d = 0.35 + 0.35 * hash(k + 3), w = add(p, add(mul(t1, Math.cos(a) * r * d), mul(t2, Math.sin(a) * r * d))), q = cam.P(w[0], w[1], w[2]); if (q) { g.beginPath(); g.ellipse(q[0], q[1], Math.max(0.8, 0.012 * q[2]), Math.max(0.6, 0.008 * q[2]), a, 0, TAU); g.fill(); } }
      } else { g.fillStyle = '#2f6a26'; g.fill(); }
    }
  }
  function banana(g, cam, top, dir, k = 1) {         // a bunch hanging from its stalk: top is where the stalk starts, dir which way it hangs (world)
    const a = cam.P(top[0], top[1], top[2]), b = cam.P(top[0] + dir[0] * 0.2, top[1] + dir[1] * 0.2, top[2] + dir[2] * 0.2); if (!a || !b) return;
    const s = a[2] * k, ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    g.save(); g.translate(a[0], a[1]); g.rotate(ang - PI / 2); g.lineCap = 'round';
    // the stalk, then the fingers in three tiers round it, each curving out and up as bananas grow
    g.strokeStyle = '#5e4a22'; g.lineWidth = Math.max(1.5, 0.026 * s); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 0.17 * s); g.stroke();
    const finger = (y, side, len, bend, shade) => {
      const x0 = side * 0.012 * s, y0 = y * s, x1 = side * (0.05 + len * 0.5) * s, y1 = (y + 0.02) * s, x2 = side * (0.035 + len * 0.6) * s, y2 = (y - len * bend) * s;
      g.lineWidth = Math.max(2, 0.042 * s); g.strokeStyle = mix('#8a6a12', '#000000', 0.1); g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, x2, y2); g.stroke();
      g.lineWidth = Math.max(1.4, 0.03 * s); g.strokeStyle = mix('#f4d23c', '#c9a521', shade); g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, x2, y2); g.stroke();
      g.fillStyle = '#4a3a14'; g.beginPath(); g.arc(x2, y2, Math.max(0.8, 0.011 * s), 0, TAU); g.fill();
    };
    for (let row = 0; row < 3; row++) {
      const y = 0.06 + row * 0.05;
      for (const side of [-1, 1]) for (let j = 0; j < 2; j++) finger(y + j * 0.012, side * (j ? 0.75 : 1), 0.13 - j * 0.025, 0.9 + j * 0.2, row * 0.18 + j * 0.15);
      finger(y + 0.01, 0.15, 0.07, 1.2, row * 0.18 + 0.3);
    }
    g.restore();
  }
  function pan(g, cam, p, n, r = 0.13) {             // a brass pan of the scale: a shallow dish, dull (no shine: nothing that glints on the road)
    const t1 = nrm(cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), t2 = cross(n, t1), pts = [], lip = [];
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, w = add(p, add(mul(t1, Math.cos(a) * r), mul(t2, Math.sin(a) * r))), q = cam.P(w[0], w[1], w[2]); if (!q) return; pts.push(q); }
    const bot = add(p, mul(n, -0.035)), qb = cam.P(bot[0], bot[1], bot[2]); if (!qb) return;
    const cp = [cam.x, cam.y, cam.z], up = dot(n, nrm(sub(cp, p))) > 0;
    g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath();
    g.fillStyle = up ? '#a08a3c' : '#8a7432'; g.fill();
    g.strokeStyle = '#6a5624'; g.lineWidth = Math.max(1, 0.01 * qb[2]); g.stroke();
    if (up) { const c = cam.P(p[0], p[1], p[2]); g.fillStyle = 'rgba(70,52,18,0.35)'; g.beginPath(); g.ellipse(c[0], c[1], Math.abs(pts[0][0] - pts[12][0]) * 0.3 + 1, Math.abs(pts[6][1] - pts[18][1]) * 0.3 + 1, 0, 0, TAU); g.fill(); }
  }
  function weight(g, cam, p, q) {                    // an iron weight: a squat cylinder with a knob
    const s = cam.P(p[0], p[1], p[2]); if (!s) return;
    const ax = qrot(q, [0, 1, 0]), c = cam.dirCam(ax[0], ax[1], ax[2]), r = 0.034 * s[2], ang = Math.atan2(-c[1], c[0]);
    g.save(); g.translate(s[0], s[1]); g.rotate(ang - PI / 2);
    g.fillStyle = '#3a3734'; g.beginPath(); g.roundRect(-r, -r * 0.7, r * 2, r * 1.4, r * 0.3); g.fill();
    g.fillStyle = '#55504a'; g.beginPath(); g.ellipse(0, -r * 0.7, r, r * 0.35 * Math.abs(c[2]) + r * 0.1, 0, 0, TAU); g.fill();
    g.fillStyle = '#2a2826'; g.beginPath(); g.arc(0, -r * 0.95, r * 0.28, 0, TAU); g.fill();
    g.restore();
  }

  // ------------------------------------------------------------------ the ground's height (road, kerb, pavement, step)
  function groundY(x, z) { return z < 0 ? KERB_H : z < ROAD_W ? 0 : z < PAVE_Z ? KERB_H : STEP_H; }

  // ------------------------------------------------------------------ the crash: kinematics of the rickshaw and the cart
  // The crash's own clock is tau (seconds; the hit at 0). The rickshaw's path is given (speeds, headings, its wobble on two
  // wheels); the cart's tip is integrated (a body rocking over its far wheels, tripped by the kerb, under gravity); the fruit,
  // the bananas, the scale and its weights are bodies in a position-based simulation with the ground, the kerb, the cart and
  // the rickshaw as moving boxes, recorded at 240 Hz.
  const V0 = 7.6, H_IMP = PI / 2 - 0.17, WIPE = [0.62, 0.78, 0.96];   // the wiper: up, top, back down (crash seconds; after the windscreen has left the frame, so the splat reads whole until then)            // speed (m/s, about 27 km/h) and heading as it swerves to the kerb
  const CART0 = { x: 0, z: ROAD_W - CART.wz - 0.14, h: PI / 2 };
  // the rickshaw's origin at the hit: its nose's left corner on the cart's left end, a hand's width in from the corner
  const RK_HIT = (() => { const P = pose([0, 0, 0], H_IMP), c = at(P, [1.84, 0, 0.27]); return sub([CART0.x - CART.L - 0.005, 0, CART0.z - CART.W + 0.07], [c[0], 0, c[2]]); })();
  const RKS = (() => {                               // the rickshaw after the hit, integrated once: [tau, x, z, h, speed]
    const out = [], dt = 1 / 480; let x = RK_HIT[0], z = RK_HIT[2], h = H_IMP;
    for (let i = 0; i <= 480 * 4.5; i++) {
      const tau = i * dt;
      // speed: the hit takes some off, he brakes in shock, then he floors it and goes
      const sp = tau < 0.05 ? lerp(V0, 5.8, mj(tau / 0.05)) : tau < 0.3 ? lerp(5.8, 5.4, mj((tau - 0.05) / 0.25)) : lerp(5.4, 11, mj((tau - 0.3) / 1.0));
      // heading: knocked away from the kerb by the glancing blow, then steered straight again
      const hk = 0.24 * mj(tau / 0.08) - 0.21 * mj((tau - 0.22) / 0.55) - 0.06 * mj((tau - 0.85) / 0.5) + 0.025 * Math.sin(tau * 11) * Math.exp(-tau * 3);
      h = H_IMP + hk;
      out.push([tau, x, z, h, sp]);
      x += Math.sin(h) * sp * dt; z += Math.cos(h) * sp * dt;
    }
    return out;
  })();
  function rkState(tau) {                            // { P: pose, spin: wheel angle, wiper, roll, speed }
    let x, z, h, sp;
    if (tau <= 0) { x = RK_HIT[0] + Math.sin(H_IMP) * V0 * tau; z = RK_HIT[2] + Math.cos(H_IMP) * V0 * tau; h = H_IMP; sp = V0; }
    else { const k = Math.min(RKS.length - 2, Math.floor(tau * 480)), u = clamp(tau * 480 - k), a = RKS[k], b = RKS[k + 1]; x = lerp(a[1], b[1], u); z = lerp(a[2], b[2], u); h = lerp(a[3], b[3], u); sp = lerp(a[4], b[4], u); }
    // wobble: up on its left wheels (its right side lifts) as it's knocked away, down hard, a smaller one, settled
    const roll = tau <= 0 ? 0.03 : 0.2 * Math.sin(PI * clamp(tau / 0.5)) ** 1.3 * (tau < 0.5 ? 1 : 0) + 0.07 * Math.sin(PI * clamp((tau - 0.56) / 0.32)) * (tau > 0.56 && tau < 0.88 ? 1 : 0) - 0.012 * Math.exp(-(((tau - 0.52) / 0.03) ** 2));
    const pitch = tau <= 0 ? 0 : -0.06 * Math.sin(PI * clamp(tau / 0.32)) + 0.025 * Math.sin(PI * clamp((tau - 1.05) / 0.7));
    let P = pose([x, 0, z], h, pitch, 0);
    if (Math.abs(roll) > 1e-5) { const o = at(P, [0, 0, RK.rearZ]); P = turnAbout(P, o, P.F, roll); }   // turned about the line of its left wheels
    // the wheels' angle: distance over radius (before the hit, at the swerve's speed)
    const dist = tau <= 0 ? V0 * tau : rkDist(tau);
    const wiper = tau < WIPE[0] ? 0 : tau < WIPE[1] ? 1.95 * mj((tau - WIPE[0]) / (WIPE[1] - WIPE[0])) : tau < WIPE[2] ? 1.95 * (1 - mj((tau - WIPE[1]) / (WIPE[2] - WIPE[1]))) : 0;
    return { P, spin: dist / RK.rw, wiper, roll, sp, h };
  }
  const RKD = (() => { const d = [0]; for (let i = 1; i < RKS.length; i++) d.push(d[i - 1] + RKS[i - 1][4] / 480); return d; })();
  function rkDist(tau) { const k = Math.min(RKD.length - 2, Math.floor(tau * 480)), u = clamp(tau * 480 - k); return lerp(RKD[k], RKD[k + 1], u); }

  // the cart: the clip skids it along the kerb and rocks it back onto its far wheels for a moment; it drops back, and once the
  // rickshaw has gone past it rises onto its road-side wheels, hangs there at the point of balance, and goes over towards the
  // road (and the witness) all at once, under gravity, landing on its side in the road. phi > 0 is over towards the road.
  const TIP = { h: 0.86, w: CART.wz + 0.02, k2: 0.15, land: 1.47, e: 0.2, rise: [0.62, 1.05] };
  const PHI_BAL = Math.atan2(TIP.w, TIP.h);
  const CARTS = (() => {                             // the fall from the point of balance, under gravity: [phi] at 240 Hz from rise[1]
    const out = [], dt = 1 / 960, I = TIP.h * TIP.h + TIP.w * TIP.w + TIP.k2; let phi = PHI_BAL + 0.012, om = 0.22, landed = false, bounces = 0;
    for (let i = 0; i <= 960 * 7; i++) {
      if (i % 4 === 0) out.push(phi);
      om += 9.81 * (TIP.h * Math.sin(phi) - TIP.w * Math.cos(phi)) / I * dt; om *= 1 - 0.15 * dt; phi += om * dt;
      if (phi >= TIP.land && om > 0) { phi = TIP.land; om = -om * TIP.e; bounces++; if (Math.abs(om) < 0.2 || bounces > 3) landed = true; }
      if (landed) { phi = TIP.land; om = 0; }
    }
    return out;
  })();
  function tipAt(tau) {
    if (tau <= 0) return 0;
    const [r0, r1] = TIP.rise;
    if (tau < r0) return -0.055 * Math.sin(PI * clamp(tau / 0.26)) * (tau < 0.26 ? 1 : 0);   // rocked back onto its far wheels, and down
    if (tau < r1) { const u = (tau - r0) / (r1 - r0); return (PHI_BAL + 0.012) * mj(u); }   // up onto its near wheels (once the rickshaw is past), slowing to a hang
    const f = (tau - r1) * 240, k = Math.min(CARTS.length - 2, Math.floor(f)); return lerp(CARTS[k], CARTS[k + 1], clamp(f - k));
  }
  function cartState(tau) {                          // { P: pose of the cart (its origin on the ground under its middle), spin: its wheels' angle, phi }
    if (tau <= 0) return { P: pose([CART0.x, 0, CART0.z], CART0.h), spin: 0, phi: 0, slide: 0 };
    const slide = 0.45 * (1 - Math.exp(-tau / 0.11)), yaw = 0.15 * (1 - Math.exp(-tau / 0.14)), kick = 0.03 * Math.sin(PI * clamp(tau / 0.08)) * (tau < 0.08 ? 1 : 0);
    const phi = tipAt(tau);
    let P = pose([CART0.x + slide, kick, CART0.z + 0.06 * (1 - Math.exp(-tau / 0.1))], CART0.h + yaw);
    // over towards the road it turns about its near wheels' feet; back onto its far wheels, about theirs
    const piv = at(P, [0, 0, phi >= 0 ? -TIP.w : TIP.w]);
    P = turnAbout(P, piv, P.F, -phi);
    const spin = slide / CART.wheelR + (tau > 1.4 ? (tau - 1.4) * 4.5 * Math.exp(-(tau - 1.4) * 0.3) : 0);   // its far wheels spin on in the air
    return { P, spin, phi, slide };
  }

  // ------------------------------------------------------------------ the crash: the bodies
  const ORANGE_R = 0.052;
  const BODIES = [];                                 // { kind, r, m, local (on the cart, before the hit), ... }
  (() => {
    // the pyramid: five layers on a square base, on the middle of the cart; the last orange is the top one
    const s = 2 * ORANGE_R, h = ORANGE_R * Math.SQRT2;
    for (let L = 0; L < 5; L++) {
      const n = 5 - L;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) BODIES.push({ kind: 'orange', r: ORANGE_R, m: 0.2, local: [0.05 + (i - (n - 1) / 2) * s, CART.top + ORANGE_R + L * h, (j - (n - 1) / 2) * s], last: L === 4 });
    }
    // loose oranges round its foot, and a few more along the near edge
    for (let i = 0; i < 8; i++) BODIES.push({ kind: 'orange', r: ORANGE_R, m: 0.2, local: [0.05 + (i < 4 ? -0.34 : 0.36), CART.top + ORANGE_R, (i % 4 - 1.5) * 0.11] });
    // papayas at the left end (the first one, nearest the road, is the one that flies), the watermelon beside them on the road
    // side; each has its own first push off the cart's road side (v0), so they land on the road, where you can see them
    BODIES.push({ kind: 'papaya', r: 0.085, m: 1.0, local: [-0.8, CART.top + 0.085, -0.32], flies: true, yaw: 0.25 });
    BODIES.push({ kind: 'papaya', r: 0.085, m: 1.0, local: [-0.8, CART.top + 0.085, 0.0], yaw: -0.1 });
    BODIES.push({ kind: 'papaya', r: 0.085, m: 1.0, local: [-0.62, CART.top + 0.085, 0.2], yaw: 1.4 });
    BODIES.push({ kind: 'melon', r: 0.16, m: 4.0, local: [-0.56, CART.top + 0.16, -0.18],  });
    // the scale's iron weights, at the right end
    for (let i = 0; i < 3; i++) BODIES.push({ kind: 'weight', r: 0.032, m: 0.5, local: [0.66 + i * 0.07, CART.top + 0.032, -0.3 + i * 0.03],  });
    // the bananas (two bunches) and the scale (its beam and two pans) hang from the bar: each a body on a string
    BODIES.push({ kind: 'banana', r: 0.09, m: 1.2, local: [-0.55, CART.barY - 0.3, 0], hang: [-0.55, CART.barY, 0], L: 0.3, lets: 1.25 });
    BODIES.push({ kind: 'banana', r: 0.09, m: 1.2, local: [-0.22, CART.barY - 0.3, 0], hang: [-0.22, CART.barY, 0], L: 0.3, lets: 99 });
    BODIES.push({ kind: 'beam', r: 0.04, m: 0.6, local: [0.5, CART.barY - 0.16, 0], hang: [0.5, CART.barY, 0], L: 0.16, lets: 1.2 });
    BODIES.push({ kind: 'pan', r: 0.07, m: 0.4, local: [0.28, CART.barY - 0.5, 0], tie: 'beam', tieOff: -0.22, L: 0.34 });
    BODIES.push({ kind: 'pan', r: 0.07, m: 0.4, local: [0.72, CART.barY - 0.5, 0], tie: 'beam', tieOff: 0.22, L: 0.34 });
  })();
  const NB = BODIES.length, REC_HZ = 240, T_END = 6.5, NREC = Math.ceil(T_END * REC_HZ) + 1;
  const REC = { x: new Float32Array(NREC * NB * 3), q: new Float32Array(NREC * NB * 4), on: new Uint8Array(NREC * NB) };
  const SPLIT = { tau: null }, PAPAYA_HIT = { tau: 0.105, uv: [0.36, 0.42] };
  const EVENTS = [];                                  // for the sound: every hard landing and knock, [tau, body, speed m/s, x, y, z, kind (1 ground, 2 cart, 3 kerb or wall, 4 another body, 5 the rickshaw)]
  const SIM_MS = (() => {
    const t0 = performance.now();
    const dt = 1 / 1200, steps = Math.round(T_END / dt), recEvery = 1200 / REC_HZ, g0 = 9.81;
    const X = new Float64Array(NB * 3), Vv = new Float64Array(NB * 3), XP = new Float64Array(NB * 3), VO = new Float64Array(NB * 3);
    const RAD = new Float64Array(NB), IM = new Float64Array(NB), GT = new Float64Array(NB).fill(-9), ST = new Uint8Array(NB);   // ST: 0 on the cart, 1 free, 2 on its string, 3 gone
    const Q = BODIES.map((b, i) => qnorm(qmul(qaxis([0, 1, 0], (b.yaw || 0) + (b.kind === 'papaya' ? 0 : hash(i) * 6)), qaxis([1, 0, 0], b.kind === 'papaya' ? 0 : hash(i + 7) * 6))));
    const Wv = BODIES.map(() => [0, 0, 0]);
    const P0 = cartState(0).P;
    BODIES.forEach((b, i) => { const p = at(P0, b.local); X.set(p, i * 3); RAD[i] = b.r; IM[i] = 1 / b.m; ST[i] = b.hang || b.tie ? 2 : 0; });
    const beamI = BODIES.findIndex((b) => b.kind === 'beam'), flyI = BODIES.findIndex((b) => b.flies), melI = BODIES.findIndex((b) => b.kind === 'melon');
    const fly0 = at(P0, BODIES[flyI].local), hitW = at(rkState(PAPAYA_HIT.tau).P, wsPt(PAPAYA_HIT.uv[0], PAPAYA_HIT.uv[1]));
    const flyV = mul(sub(add(hitW, [0, 0.5 * g0 * PAPAYA_HIT.tau ** 2, 0]), fly0), 1 / PAPAYA_HIT.tau);
    // contacts, kept in flat arrays: body, other body (−1: the world or a moving box), normal, the surface's velocity, kind
    const CMAX = 6000, CI = new Int32Array(CMAX), CJ = new Int32Array(CMAX), CN = new Float64Array(CMAX * 3), CV = new Float64Array(CMAX * 3), CK = new Uint8Array(CMAX);
    let nc = 0; const lastEv = new Float64Array(NB).fill(-9);
    const contact = (i, j, nx, ny, nz, vx, vy, vz, k) => { if (nc >= CMAX) return; CI[nc] = i; CJ[nc] = j; CN[nc * 3] = nx; CN[nc * 3 + 1] = ny; CN[nc * 3 + 2] = nz; CV[nc * 3] = vx; CV[nc * 3 + 1] = vy; CV[nc * 3 + 2] = vz; CK[nc] = k; nc++; };
    // a moving box (pose now Pn, a step ago Po; centre c, half-sizes e in its own frame) pushes body i out of it
    const obbOut = (i, Pn, Po, c, e, kind = 2) => {
      const r = RAD[i], px = XP[i * 3] - Pn.p[0], py = XP[i * 3 + 1] - Pn.p[1], pz = XP[i * 3 + 2] - Pn.p[2];
      const lx = px * Pn.F[0] + py * Pn.F[1] + pz * Pn.F[2] - c[0], ly = px * Pn.U[0] + py * Pn.U[1] + pz * Pn.U[2] - c[1], lz = px * Pn.L[0] + py * Pn.L[1] + pz * Pn.L[2] - c[2];
      if (Math.abs(lx) > e[0] + r || Math.abs(ly) > e[1] + r || Math.abs(lz) > e[2] + r) return;
      const qx = clamp(lx, -e[0], e[0]), qy = clamp(ly, -e[1], e[1]), qz = clamp(lz, -e[2], e[2]), ox = lx - qx, oy = ly - qy, oz = lz - qz, ol = Math.hypot(ox, oy, oz);
      let nx, ny, nz, pen;
      if (ol > 1e-9) { if (ol >= r) return; nx = ox / ol; ny = oy / ol; nz = oz / ol; pen = r - ol; }
      else { const mx = e[0] - Math.abs(lx), my = e[1] - Math.abs(ly), mz = e[2] - Math.abs(lz); nx = ny = nz = 0; if (mx < my && mx < mz) { nx = Math.sign(lx) || 1; pen = mx + r; } else if (my < mz) { ny = Math.sign(ly) || 1; pen = my + r; } else { nz = Math.sign(lz) || 1; pen = mz + r; } }
      if (kind === 5 && ny < -0.3) {                  // a moving vehicle never presses a thing into the road: it shoves it aside, or ahead
        const ex = e[0] + r - Math.abs(lx), ez = e[2] + r - Math.abs(lz);
        if (ez < ex) { nx = 0; ny = 0; nz = Math.sign(lz) || 1; pen = ez; } else { nx = Math.sign(lx) || 1; ny = 0; nz = 0; pen = ex; }
      }
      const wn = [nx * Pn.F[0] + ny * Pn.U[0] + nz * Pn.L[0], nx * Pn.F[1] + ny * Pn.U[1] + nz * Pn.L[1], nx * Pn.F[2] + ny * Pn.U[2] + nz * Pn.L[2]];
      const wl = [c[0] + qx, c[1] + qy, c[2] + qz], a = at(Pn, wl), b = at(Po, wl);
      const pv = Math.min(pen, 0.004);
      XP[i * 3] += wn[0] * pen; XP[i * 3 + 1] += wn[1] * pen; XP[i * 3 + 2] += wn[2] * pen;
      X[i * 3] += wn[0] * (pen - pv); X[i * 3 + 1] += wn[1] * (pen - pv); X[i * 3 + 2] += wn[2] * (pen - pv);
      contact(i, -1, wn[0], wn[1], wn[2], (a[0] - b[0]) / dt, (a[1] - b[1]) / dt, (a[2] - b[2]) / dt, kind);
    };
    const BOXES = [[[0, CART.top - 0.045, 0], [CART.L, 0.045, CART.W]], [[0, CART.top + 0.025, CART.W - 0.015], [CART.L, 0.025, 0.02]], [[0, CART.top + 0.025, -CART.W + 0.015], [CART.L, 0.025, 0.02]],
      [[CART.L - 0.015, CART.top + 0.025, 0], [0.02, 0.025, CART.W]], [[-CART.L + 0.015, CART.top + 0.025, 0], [0.02, 0.025, CART.W]]];
    const RKBOX = [[[0.42, 0.95, 0], [0.88, 0.68, 0.62]], [[1.62, 0.7, 0], [0.32, 0.42, 0.33]]];
    for (let st = 0; st <= steps; st++) {
      const tau = st * dt, cs = cartState(tau), csN = cartState(tau + dt), rs = rkState(tau), rsN = rkState(tau + dt);
      if (st % recEvery === 0) {
        const k = st / recEvery;
        if (k < NREC) for (let i = 0; i < NB; i++) {
          const o = (k * NB + i) * 3;
          if (ST[i] === 0) { const p = at(cs.P, BODIES[i].local); REC.x[o] = p[0]; REC.x[o + 1] = p[1]; REC.x[o + 2] = p[2]; }
          else { REC.x[o] = X[i * 3]; REC.x[o + 1] = X[i * 3 + 1]; REC.x[o + 2] = X[i * 3 + 2]; }
          REC.q.set(Q[i], (k * NB + i) * 4); REC.on[k * NB + i] = ST[i] === 3 ? 0 : 1;
        }
      }
      // the hit: everything on the cart comes loose with the jolt (the cart is shoved out from under it, its left end kicks up)
      // and a burst out of the pyramid. Staging inside the physics: these first speeds are chosen; everything after is simulated.
      if (st === 1) for (let i = 0; i < NB; i++) {
        const b = BODIES[i]; if (ST[i] !== 0 || b.flies) continue;
        ST[i] = 1;
        const lx = b.local[0] - 0.05, ly = b.local[1] - CART.top, lz = b.local[2], orange = b.kind === 'orange';
        const up = (0.25 + 1.0 * ly / 0.3 + 0.45 * hash(i + 1)) * (orange ? 1 : 0.45);
        Vv[i * 3] = 0.9 + lx * (orange ? 1.2 : 0.5) + 0.4 * (hash(i + 3) - 0.5);
        Vv[i * 3 + 1] = up;
        Vv[i * 3 + 2] = 0.15 + 0.35 * hash(i + 4) + lz * (orange ? 1.2 : 0.5);
        if (b.v0) { Vv[i * 3] = b.v0[0]; Vv[i * 3 + 1] = b.v0[1]; Vv[i * 3 + 2] = b.v0[2]; }
        Wv[i] = [(hash(i + 5) - 0.5) * 30, (hash(i + 6) - 0.5) * 20, (hash(i + 8) - 0.5) * 30];
      }
      // a thing let go from its string gets its own first push too
      for (let i = 0; i < NB; i++) { const b = BODIES[i]; if (ST[i] === 2 && b.hang && tau > b.lets && b.v0) { Vv[i * 3] = b.v0[0]; Vv[i * 3 + 1] = b.v0[1]; Vv[i * 3 + 2] = b.v0[2]; } }
      // the papaya: a ballistic flight to the windscreen, then it's on the glass (drawn there, not here)
      if (flyI >= 0 && ST[flyI] !== 3) {
        if (tau >= PAPAYA_HIT.tau) ST[flyI] = 3;
        else if (tau > 0) { ST[flyI] = 1; X[flyI * 3] = fly0[0] + flyV[0] * tau; X[flyI * 3 + 1] = fly0[1] + flyV[1] * tau - 0.5 * g0 * tau * tau; X[flyI * 3 + 2] = fly0[2] + flyV[2] * tau; Q[flyI] = qnorm(qmul(qaxis([0, 0, 1], dt * 9), Q[flyI])); }
      }
      for (let i = 0; i < NB; i++) { const b = BODIES[i]; if (ST[i] === 2 && b.hang && tau > b.lets) ST[i] = 1; }
      // predict
      for (let i = 0; i < NB; i++) {
        const o = i * 3; VO[o] = Vv[o]; VO[o + 1] = Vv[o + 1]; VO[o + 2] = Vv[o + 2];
        if ((ST[i] === 1 || ST[i] === 2) && i !== flyI) { Vv[o + 1] -= g0 * dt; XP[o] = X[o] + Vv[o] * dt; XP[o + 1] = X[o + 1] + Vv[o + 1] * dt; XP[o + 2] = X[o + 2] + Vv[o + 2] * dt; }
        else { XP[o] = X[o]; XP[o + 1] = X[o + 1]; XP[o + 2] = X[o + 2]; }
      }
      nc = 0;
      for (let it = 0; it < 2; it++) {
        for (let i = 0; i < NB; i++) {
          if (!(ST[i] === 1 || ST[i] === 2) || i === flyI) continue;
          const b = BODIES[i], r = RAD[i], o = i * 3;
          if (ST[i] === 2 && b.hang) { const hk = at(csN.P, b.hang), dx = XP[o] - hk[0], dy = XP[o + 1] - hk[1], dz = XP[o + 2] - hk[2], l = Math.hypot(dx, dy, dz); if (l > b.L) { const k = b.L / l; XP[o] = hk[0] + dx * k; XP[o + 1] = hk[1] + dy * k; XP[o + 2] = hk[2] + dz * k; } }
          if (b.tie && beamI >= 0) {
            const bo = beamI * 3, hx = XP[bo] + b.tieOff * 0.7, hy = XP[bo + 1], hz = XP[bo + 2], dx = XP[o] - hx, dy = XP[o + 1] - hy, dz = XP[o + 2] - hz, l = Math.hypot(dx, dy, dz);
            if (l > b.L) { const k = (l - b.L) / l; XP[o] -= dx * k * 0.7; XP[o + 1] -= dy * k * 0.7; XP[o + 2] -= dz * k * 0.7; XP[bo] += dx * k * 0.3; XP[bo + 1] += dy * k * 0.3; XP[bo + 2] += dz * k * 0.3; }
          }
          // the road, the kerb's face, the pavement, the step and the shop wall
          const px = XP[o], py = XP[o + 1], pz = XP[o + 2], gy = groundY(px, pz);
          if (py - r < gy) { XP[o + 1] = gy + r; contact(i, -1, 0, 1, 0, 0, 0, 0, 1); }
          if (pz + r > ROAD_W && pz < ROAD_W && py - r < KERB_H - 0.01) { XP[o + 2] = ROAD_W - r; contact(i, -1, 0, 0, -1, 0, 0, 0, 3); }
          if (pz - r < 0 && pz > 0 && py - r < KERB_H - 0.01) { XP[o + 2] = r; contact(i, -1, 0, 0, 1, 0, 0, 0, 3); }   // the near kerb's face
          if (pz + r > PAVE_Z && pz < PAVE_Z && py - r < STEP_H - 0.01) { XP[o + 2] = PAVE_Z - r; contact(i, -1, 0, 0, -1, 0, 0, 0, 3); }
          if (XP[o + 2] + r > SHOP_Z) { XP[o + 2] = SHOP_Z - r; contact(i, -1, 0, 0, -1, 0, 0, 0, 3); }
          if (ST[i] === 1) {
            for (const [c, e] of BOXES) obbOut(i, csN.P, cs.P, c, e);
            if (tau < 2.5 && b.kind !== 'beam' && b.kind !== 'pan' && b.kind !== 'weight') for (const [c, e] of RKBOX) obbOut(i, rsN.P, rs.P, c, e, 5);
          }
        }
        // fruit against fruit
        for (let i = 0; i < NB; i++) {
          if (ST[i] !== 1 || i === flyI) continue;
          const io = i * 3;
          for (let j = i + 1; j < NB; j++) {
            if (ST[j] !== 1 || j === flyI) continue;
            const jo = j * 3, rr = RAD[i] + RAD[j], dx = XP[jo] - XP[io]; if (dx > rr || dx < -rr) continue;
            const dy = XP[jo + 1] - XP[io + 1]; if (dy > rr || dy < -rr) continue;
            const dz = XP[jo + 2] - XP[io + 2]; if (dz > rr || dz < -rr) continue;
            const l = Math.sqrt(dx * dx + dy * dy + dz * dz); if (l >= rr || l < 1e-9) continue;
            const nx = dx / l, ny = dy / l, nz = dz / l, wi = IM[i], wj = IM[j], c = (rr - l) / (wi + wj);
            XP[io] -= nx * c * wi; XP[io + 1] -= ny * c * wi; XP[io + 2] -= nz * c * wi; XP[jo] += nx * c * wj; XP[jo + 1] += ny * c * wj; XP[jo + 2] += nz * c * wj;
            if (it === 1) contact(i, j, nx, ny, nz, 0, 0, 0, 4);
          }
        }
      }
      // new velocities from the moves, then each contact's bounce and friction
      for (let i = 0; i < NB; i++) { if (!(ST[i] === 1 || ST[i] === 2) || i === flyI) continue; const o = i * 3; Vv[o] = (XP[o] - X[o]) / dt; Vv[o + 1] = (XP[o + 1] - X[o + 1]) / dt; Vv[o + 2] = (XP[o + 2] - X[o + 2]) / dt; const sp = Math.hypot(Vv[o], Vv[o + 1], Vv[o + 2]); if (sp > 6.5) { const k = 6.5 / sp; Vv[o] *= k; Vv[o + 1] *= k; Vv[o + 2] *= k; } }
      for (let c = 0; c < nc; c++) {
        const i = CI[c], j = CJ[c], nx = CN[c * 3], ny = CN[c * 3 + 1], nz = CN[c * 3 + 2], io = i * 3;
        if (j >= 0) {                                    // two bodies: a soft knock
          const jo = j * 3, rx = Vv[jo] - Vv[io], ry = Vv[jo + 1] - Vv[io + 1], rz = Vv[jo + 2] - Vv[io + 2], vn = rx * nx + ry * ny + rz * nz;
          const vo = (VO[jo] - VO[io]) * nx + (VO[jo + 1] - VO[io + 1]) * ny + (VO[jo + 2] - VO[io + 2]) * nz;
          if (vo < -0.3) { const wi = IM[i], wj = IM[j], dv = (-0.3 * vo - vn) / (wi + wj); Vv[io] -= nx * dv * wi; Vv[io + 1] -= ny * dv * wi; Vv[io + 2] -= nz * dv * wi; Vv[jo] += nx * dv * wj; Vv[jo + 1] += ny * dv * wj; Vv[jo + 2] += nz * dv * wj; }
          if (vo < -0.9 && tau - lastEv[i] > 0.05) { EVENTS.push([tau, i, -vo, XP[io], XP[io + 1], XP[io + 2], 4]); lastEv[i] = tau; }
          continue;
        }
        const b = BODIES[i], vsx = CV[c * 3], vsy = CV[c * 3 + 1], vsz = CV[c * 3 + 2];
        let rx = Vv[io] - vsx, ry = Vv[io + 1] - vsy, rz = Vv[io + 2] - vsz;
        const vn = rx * nx + ry * ny + rz * nz, vo = (VO[io] - vsx) * nx + (VO[io + 1] - vsy) * ny + (VO[io + 2] - vsz) * nz;
        const e = b.kind === 'orange' ? 0.42 : b.kind === 'melon' ? 0.3 : b.kind === 'pan' || b.kind === 'beam' ? 0.25 : b.kind === 'weight' ? 0.2 : 0.18;
        if (vo < -0.35) { const d = -e * vo - vn; rx += nx * d; ry += ny * d; rz += nz * d; }
        const vnn = rx * nx + ry * ny + rz * nz, tx = rx - nx * vnn, ty = ry - ny * vnn, tz = rz - nz * vnn, tl = Math.hypot(tx, ty, tz);
        if (tl > 1e-6 && CK[c] !== 5) {
          const round = b.kind === 'orange' || b.kind === 'melon', floor = ny > 0.5;
          const imp = vo < -0.35 ? (round ? 0.22 : 0.55) * tl : 0;            // a bounce takes some of its run off
          const roll = (round ? (b.kind === 'melon' ? 1.4 : 0.55) : b.kind === 'weight' ? 2.6 : 3.4) * dt * (floor ? 1 : 0.35);
          const cut = Math.min(tl, imp + roll) / tl; rx -= tx * cut; ry -= ty * cut; rz -= tz * cut;
        }
        Vv[io] = rx + vsx; Vv[io + 1] = ry + vsy; Vv[io + 2] = rz + vsz;
        { const sp = Math.hypot(Vv[io], Vv[io + 1], Vv[io + 2]); if (sp > 6.5) { const k = 6.5 / sp; Vv[io] *= k; Vv[io + 1] *= k; Vv[io + 2] *= k; } }
        if (CK[c] === 1 || (CK[c] === 2 && ny > 0.6)) GT[i] = tau;
        if (vo < -0.5 && tau - lastEv[i] > 0.05) { EVENTS.push([tau, i, -vo, XP[io], XP[io + 1], XP[io + 2], CK[c]]); lastEv[i] = tau; }
        // the watermelon splits on its second hard landing on the ground
        if (i === melI && CK[c] === 1 && vo < -1.2 && SPLIT.tau == null) { b.hits = (b.hits || 0) + 1; if (b.hits >= 2 || vo < -3.2) { SPLIT.tau = tau; SPLIT.at = [XP[io], XP[io + 1], XP[io + 2]]; SPLIT.v = [Vv[io], 0, Vv[io + 2]]; } }
      }
      for (let i = 0; i < NB; i++) {
        if (!(ST[i] === 1 || ST[i] === 2) || i === flyI) continue;
        const b = BODIES[i], o = i * 3;
        // how it turns: rolling on the ground without slipping, tumbling in the air
        const onG = tau - GT[i] < 2.5 * dt;
        if (onG && (b.kind === 'orange' || b.kind === 'melon')) Wv[i] = [Vv[o + 2] / b.r, 0, -Vv[o] / b.r];   // (up × v) / r
        else if (onG) Wv[i] = mul(Wv[i], 0.9);
        const wl = len(Wv[i]); if (wl > 1e-6) Q[i] = qnorm(qmul(qaxis(mul(Wv[i], 1 / wl), wl * dt), Q[i]));
        if (onG && tau > 1.0 && Vv[o] * Vv[o] + Vv[o + 1] * Vv[o + 1] + Vv[o + 2] * Vv[o + 2] < 2.2e-4) { Vv[o] = Vv[o + 1] = Vv[o + 2] = 0; Wv[i] = [0, 0, 0]; XP[o] = X[o]; XP[o + 1] = X[o + 1]; XP[o + 2] = X[o + 2]; }   // at rest
        X[o] = XP[o]; X[o + 1] = XP[o + 1]; X[o + 2] = XP[o + 2];
      }
      if (SPLIT.tau != null && ST[melI] !== 3) ST[melI] = 3;   // from here on it's two halves (drawn from SPLIT)
    }
    return performance.now() - t0;
  })();
  // the two halves of the watermelon, after it splits: apart along a line, rocking to rest cut side up
  function melonHalves(tau) {
    if (SPLIT.tau == null || tau < SPLIT.tau) return null;
    const u = tau - SPLIT.tau, ax = nrm([1, 0, -0.55]), spread = 0.15 * (1 - Math.exp(-u / 0.12)), drift = mul(SPLIT.v, 0.12 * (1 - Math.exp(-u / 0.2)));
    return [-1, 1].map((sd) => {
      const p = add(add(SPLIT.at, drift), mul(ax, sd * spread)); p[1] = groundY(p[0], p[2]) + 0.075;
      const rock = 1.25 * Math.exp(-u / 0.32) * Math.cos(u * 13 + 0.2), tilt = sd * clamp(rock, -1.4, 1.4);   // from on its side to cut side up
      const n = nrm(add(mul([0, 1, 0], Math.cos(tilt)), mul(mul(ax, sd), Math.sin(Math.abs(tilt)) + (u < 0.08 ? 1.0 : 0))));
      return { p, n, r: 0.16 };
    });
  }
  function bodyAt(tau, i) {                          // a body's place and turn at crash time tau, and whether it's still there
    const f = clamp(tau, 0, T_END - 1e-3) * REC_HZ, k = Math.min(NREC - 2, Math.floor(f)), u = f - k, a = (k * NB + i) * 3, b = ((k + 1) * NB + i) * 3;
    const X = REC.x, Q = REC.q, qa = (k * NB + i) * 4, qb = ((k + 1) * NB + i) * 4;
    let q;
    if (Q[qa] * Q[qb] + Q[qa + 1] * Q[qb + 1] + Q[qa + 2] * Q[qb + 2] + Q[qa + 3] * Q[qb + 3] < 0) q = [Q[qa], Q[qa + 1], Q[qa + 2], Q[qa + 3]];
    else q = qnorm([lerp(Q[qa], Q[qb], u), lerp(Q[qa + 1], Q[qb + 1], u), lerp(Q[qa + 2], Q[qb + 2], u), lerp(Q[qa + 3], Q[qb + 3], u)]);
    return { p: [lerp(X[a], X[b], u), lerp(X[a + 1], X[b + 1], u), lerp(X[a + 2], X[b + 2], u)], q, on: !!(REC.on[k * NB + i] && REC.on[(k + 1) * NB + i]) };
  }

  window.STREET = {
    add, sub, mul, dot, cross, len, nrm, mj, hash, pose, at, dirOf, toLocal, turnAbout, qrot, qmul, qaxis, qnorm,
    SUN, lit, faceItems, paintFace, drawItems, quad, box, tube, wheelItem, drawWheel,
    ROAD_W, KERB_H, PAVE_Z, STEP_H, SHOP_Z, SHOPS, STATIC, awnings, groundY,
    CART, CART0, cartFaces, cartWheels, cartState, TIP,
    RK, rickshawFaces, rickshawFront, charm, rkState, wsPt, WIPER, WS, H_IMP, V0, RK_HIT, WIPE,
    BODIES, bodyAt, melonHalves, SPLIT, PAPAYA_HIT, T_END, SIM_MS: () => SIM_MS, EVENTS, tipAt,
    shadowDisc, orange, papaya, melon, melonHalf, banana, pan, weight, ORANGE_R,
  };
})();
