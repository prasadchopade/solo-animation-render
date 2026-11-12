// Reel 37 · You're the Thief: the lane. The series' golden-hour market street (reels 20–34), rebuilt as a place a camera can
// stand anywhere in and look any way: up the lane into the low sun, across it at the shop fronts, or back down it.
// Metres. X across the lane (the chai stall's wall is at -LW), Y up, Z along it; the sun is low at the +Z end, a little to
// the stall's side, so the far wall is lit and the stall's wall is in shade. Pure functions of the camera and a clock.
(() => {
  const C = window.C, R = window.RIG, { clamp, lerp, mulberry32 } = C, { mix, poly3, line3, sstep, TAU, PI } = R;
  const LW = 2.3, ZA = -48, ZB = 48, HAZE = '#f8d4a2', SHADE = '#45303a';
  const NA = C.noise1(3701), NB = C.noise1(3702);
  const lg = (g, x0, y0, x1, y1, ...stops) => { const q = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const rg = (g, x, y, r0, r1, ...stops) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const GOODS = ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#b94fd0', '#4fb06a', '#f2f0e6', '#2d5fae'];
  const KINDS = ['cloth', 'grocery', 'pots', 'sweets', 'shut', 'tailor', 'fruit', 'chemist', 'grocery', 'cloth', 'toys', 'shut'];
  const WALLS = { '-1': ['#eaa597', '#f0cf86', '#92cfc5', '#cbb7e6', '#f2bf8f', '#e9b3c6'], '1': ['#f6c48e', '#9fcfee', '#f4adc0', '#ecdc7e', '#c5b8ea', '#f3a98f'] };
  const AWN = ['stripeR', '#2b6fb3', '#e2a92a', 'stripeB', '#c2453a', '#7a59b8', null];
  const NAMES = { cloth: 'SAREES', grocery: 'KIRANA', pots: 'STEEL', sweets: 'SWEETS', tailor: 'TAILORS', fruit: 'FRESH FRUIT', chemist: 'CHEMIST', toys: 'TOYS' };
  const SIGNC = [['#fff3cf', '#7a1f1f'], ['#0f7a4a', '#ffffff'], ['#b5341f', '#fff6d6'], ['#1f3f7a', '#ffe9a8'], ['#f4efe0', '#23302a']];
  const SHOPS = (() => {
    const r = mulberry32(3705), out = [];
    for (const side of [-1, 1]) {
      let z = ZA, i = side > 0 ? 3 : 0;
      while (z < ZB) {
        const len = 2.1 + r() * 1.1, kind = KINDS[i % KINDS.length];
        out.push({ side, z0: z, z1: Math.min(ZB, z + len), kind, h: 3.7 + r() * 2.3, col: WALLS[side][i % 6], aw: AWN[(i * 3 + (side > 0 ? 2 : 0)) % AWN.length], seed: (r() * 1e6) | 0, sign: SIGNC[i % SIGNC.length] });
        z += len; i++;
      }
    }
    return out;
  })();
  const STRINGS = (() => { const out = []; for (let z = ZA + 3, i = 0; z < ZB; z += 5.4, i++) out.push([z + (i % 2) * 0.8, i % 2 ? 'bulbs' : 'bunt', 4.25 + (i % 3) * 0.2, 3.65 + (i % 3) * 0.15]); return out; })();
  const LITTER = (() => { const r = mulberry32(3788), out = []; for (let i = 0; i < 520; i++) { const c = r(); out.push({ X: (r() - 0.5) * 2 * (LW - 0.15), Z: ZA + r() * (ZB - ZA), rot: r() * 3, k: c > 0.3 ? 0 : 1, col: c > 0.55 ? '#f39a1e' : c > 0.3 ? '#f7c52b' : r() > 0.5 ? '#7fa83e' : '#c79a4a' }); } return out; })();

  function world(g, cam, tw, o = {}) {
    const W = C.W, H = C.H, lt = R.lightOf(cam);
    const horizon = cam.cy + cam.f * Math.tan(cam.pitch);
    const dist = (x, z) => Math.hypot(x - cam.x, z - cam.z);
    const hazeAt = (d) => clamp((d - 3.5) / 34) * (0.5 + 0.22 * lt.back);
    // ---- the sky: warm towards the sun, dusk-violet away from it
    const ts = 0.5 + 0.5 * Math.cos(cam.yaw - Math.atan2(R.SUN[0], R.SUN[2]));
    g.fillStyle = lg(g, 0, horizon - 1500, 0, horizon + 4, [0, mix('#8a86cc', '#e9814f', ts)], [0.55, mix('#dba2c0', '#f6b877', ts)], [0.84, mix('#f6cdb4', '#fcdcac', ts)], [1, mix('#fbdcbf', '#fde7c2', ts)]);
    g.fillRect(-200, -400, W + 400, horizon + 404 + 400);
    const sun = cam.P(cam.x + R.SUN[0] * 900, cam.y + R.SUN[1] * 900, cam.z + R.SUN[2] * 900);
    if (sun) {
      const rr = Math.max(500, cam.f * 0.55);
      g.fillStyle = rg(g, sun[0], sun[1], 4, rr, [0, 'rgba(255,248,215,0.95)'], [0.16, 'rgba(255,226,160,0.66)'], [1, 'rgba(255,200,140,0)']); g.fillRect(sun[0] - rr, sun[1] - rr, rr * 2, rr * 2);
      g.fillStyle = '#fff6da'; g.beginPath(); g.arc(sun[0], sun[1], Math.max(22, cam.f * 0.03), 0, TAU); g.fill();
    }
    // ---- the streets across both ends of the lane
    for (const [z, seed] of [[ZB + 3, 3719], [ZA - 3, 3723]]) {
      const r = mulberry32(seed), cols = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#e88aa0'], hz = hazeAt(dist(0, z)) + 0.2;
      for (let X = -16, i = 0; X < 16; i++) {
        const w = 2.6 + r() * 2.2, hgt = 6 + r() * 6;
        poly3(g, cam, [[X, 0, z], [X + w, 0, z], [X + w, hgt, z], [X, hgt, z]], mix(cols[i % 6], HAZE, clamp(hz + 0.25)));
        for (let wy = hgt - 1.2; wy > 2; wy -= 1.7) for (let wx = X + 0.4; wx < X + w - 0.7; wx += 1.0) if (r() > 0.45) poly3(g, cam, [[wx, wy, z], [wx + 0.5, wy, z], [wx + 0.5, wy - 0.8, z], [wx, wy - 0.8, z]], mix('#ffe2a0', HAZE, 0.35));
        X += w;
      }
    }
    // ---- the floor
    if (poly3(g, cam, [[-LW, 0, ZA - 3], [LW, 0, ZA - 3], [LW, 0, ZB + 3], [-LW, 0, ZB + 3]], null)) {
      g.fillStyle = lg(g, 0, horizon, 0, horizon + 1300, [0, '#ecd4ab'], [0.1, '#dcc197'], [0.42, '#bfa382'], [1, '#9c8064']); g.fill();
      g.save(); g.clip();
      if (sun) { g.fillStyle = rg(g, sun[0], horizon + 8, 10, Math.max(700, cam.f * 0.5), [0, 'rgba(255,226,170,0.6)'], [1, 'rgba(255,226,170,0)']); g.fillRect(-400, horizon, W + 800, 1600); }
      poly3(g, cam, [[-LW, 0, ZA], [-LW + 1.05, 0, ZA], [-LW + 1.05, 0, ZB], [-LW, 0, ZB]], 'rgba(70,40,48,0.17)');   // the stall wall's shade
      // paving joints
      g.strokeStyle = 'rgba(70,55,35,0.2)'; g.lineWidth = 2; g.beginPath();
      const z0 = Math.max(ZA, Math.floor((cam.z - 26) / 0.62) * 0.62), z1 = Math.min(ZB, cam.z + 26);
      for (let z = z0; z < z1; z += 0.62) line3(g, cam, [-LW, 0, z], [LW, 0, z]);
      for (let i = -5; i <= 5; i++) line3(g, cam, [i * 0.4, 0, Math.max(ZA, cam.z - 30)], [i * 0.4, 0, Math.min(ZB, cam.z + 30)]);
      g.stroke();
      for (const p of LITTER) {
        if (Math.abs(p.Z - cam.z) > 16 || Math.abs(p.X - cam.x) > 9) continue;
        const q = cam.P(p.X, 0, p.Z); if (!q || q[2] > 1400 || q[2] < 28) continue; const s = q[2];
        g.save(); g.translate(q[0], q[1]); g.scale(1, 0.42); g.rotate(p.rot); g.fillStyle = p.col;
        if (p.k === 0) { g.beginPath(); g.ellipse(0, 0, 0.018 * s, 0.01 * s, 0, 0, TAU); g.fill(); } else { g.beginPath(); g.moveTo(-0.05 * s, 0); g.quadraticCurveTo(0, -0.022 * s, 0.05 * s, 0); g.quadraticCurveTo(0, 0.022 * s, -0.05 * s, 0); g.fill(); }
        g.restore();
      }
      g.restore();
    }
    // ---- the shops, furthest first
    const order = SHOPS.map((sh) => [dist(sh.side * LW, (sh.z0 + sh.z1) / 2), sh]).filter((a) => a[0] < 60).sort((a, b) => b[0] - a[0]);
    for (const [d, sh] of order) shop(g, cam, sh, tw, hazeAt(d), d);
    // ---- strings across the lane
    for (const [z, kind, yEnd, yMid] of STRINGS.map((s) => [Math.abs(s[0] - cam.z), s]).sort((a, b) => b[0] - a[0]).map((a) => a[1])) {
      const d = Math.abs(z - cam.z); if (d > 44) continue;
      const hz = hazeAt(d), N = kind === 'bunt' ? 16 : 11, pt = (u) => [lerp(-LW, LW, u), yEnd - (yEnd - yMid) * 4 * u * (1 - u), z];
      g.strokeStyle = 'rgba(30,25,20,0.6)'; g.lineWidth = Math.max(1, 0.008 * cam.f / Math.max(1, d)); g.beginPath();
      for (let i = 0; i < 16; i++) line3(g, cam, pt(i / 16), pt((i + 1) / 16)); g.stroke();
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N, w = pt(u), p = cam.P(w[0], w[1], w[2]); if (!p) continue; const s = p[2];
        if (kind === 'bunt') { const fl = 0.02 * Math.sin(tw * 3.1 + i * 1.7 + z) * s; g.fillStyle = mix(['#ff7fb0', '#ffd84a', '#5ab8ff', '#fff6e0'][i % 4], HAZE, hz); g.beginPath(); g.moveTo(p[0] - 0.08 * s, p[1]); g.lineTo(p[0] + 0.08 * s, p[1]); g.lineTo(p[0] + fl, p[1] + 0.17 * s); g.closePath(); g.fill(); }
        else bulb(g, p[0], p[1] + 0.02 * s, s, 0.8 + 0.2 * Math.sin(tw * 2.3 + i));
      }
    }
  }
  function bulb(g, x, y, s, k = 1) {
    const r = Math.max(2, 0.08 * s);
    g.fillStyle = rg(g, x, y, 0, r * 2.2, [0, `rgba(255,214,130,${(0.55 * k).toFixed(3)})`], [1, 'rgba(255,214,130,0)']); g.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
    g.fillStyle = '#fff2c4'; g.beginPath(); g.ellipse(x, y, Math.max(1.4, 0.018 * s), Math.max(1.8, 0.022 * s), 0, 0, TAU); g.fill();
  }
  // a board's letters, drawn on the board's own plane (an affine fit to three of its corners)
  function boardText(g, cam, a, b, c, text, col, o = {}) {      // a: top-left, b: top-right, c: bottom-left, in the world
    const A = cam.P(...a), B = cam.P(...b), Cc = cam.P(...c); if (!A || !B || !Cc) return;
    const w = 100 * (o.aspect || 4), h = 100;
    g.save(); g.transform((B[0] - A[0]) / w, (B[1] - A[1]) / w, (Cc[0] - A[0]) / h, (Cc[1] - A[1]) / h, A[0], A[1]);
    g.font = '700 condensed 70px Bahn'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col;
    const tw = g.measureText(text).width, k = Math.min(1, (w * 0.86) / tw); g.translate(w / 2, h * 0.54); g.scale(k, 1); g.fillText(text, 0, 0);
    g.restore();
  }
  function shop(g, cam, sh, tw, hz, d) {
    const sd = sh.side, X = sd * LW, z0 = sh.z0, z1 = sh.z1, len = z1 - z0, r = mulberry32(sh.seed);
    const tone = (c, k = 0) => mix(sd > 0 ? mix(c, '#fff0d8', 0.1 + k) : mix(c, SHADE, 0.24 - k), HAZE, hz);
    const q = (za, zb, ya, yb, fill, dx = 0) => poly3(g, cam, [[X - sd * dx, ya, za], [X - sd * dx, ya, zb], [X - sd * dx, yb, zb], [X - sd * dx, yb, za]], fill);
    const near = d < 26;
    q(z0, z1, 0, sh.h, tone(sh.col));
    q(z0, z1, sh.h - 0.08, sh.h, tone('#ffffff', 0.1));
    q(z0, z0 + 0.05, 0, sh.h, 'rgba(0,0,0,0.13)');
    if (sh.h > 4.2) { const nw = Math.max(1, Math.round(len / 0.9)); for (let j = 0; j < nw; j++) { const za = z0 + (j + 0.22) * len / nw, zb = z0 + (j + 0.78) * len / nw; q(za, zb, 3.35, 4.1, tone('#3a3f4a')); q(za + 0.04, zb - 0.04, 3.39, 4.06, r() > 0.5 ? mix('#ffd38a', HAZE, hz) : tone('#5a6070')); q(za - 0.03, zb + 0.03, 3.29, 3.35, tone('#ffffff', 0.05)); } }
    // the step up into the shop
    poly3(g, cam, [[X, 0.16, z0 + 0.05], [X - sd * 0.34, 0.16, z0 + 0.05], [X - sd * 0.34, 0.16, z1 - 0.05], [X, 0.16, z1 - 0.05]], tone('#cdbfae'));
    q(z0 + 0.05, z1 - 0.05, 0, 0.16, tone('#a89886'), 0.34);
    if (sh.kind === 'shut') { q(z0 + 0.1, z1 - 0.1, 0.16, 2.78, tone('#8d9197')); if (near) for (let y = 0.3; y < 2.78; y += 0.125) q(z0 + 0.1, z1 - 0.1, y, y + 0.025, tone('#6f747b')); q(z0 + 0.07, z1 - 0.07, 2.78, 3.12, tone('#7b8087')); return; }
    q(z0 + 0.1, z1 - 0.1, 0.16, 2.72, tone('#2a211d', -0.1));          // the shop's dark mouth
    if (near) {
      g.save(); if (q(z0 + 0.1, z1 - 0.1, 0.16, 2.72, null)) g.clip();
      const n = Math.max(3, Math.round(len / 0.36));
      for (let j = 0; j < n; j++) {
        const za = z0 + 0.1 + (j + 0.1) * (len - 0.2) / n, zb = za + 0.8 * (len - 0.2) / n, c = mix(GOODS[(j + sh.seed) % GOODS.length], '#3a2c26', 0.34);
        if (sh.kind === 'cloth') q(za, zb, 0.3, 2.55 - (j % 3) * 0.29, tone(c), -0.3);
        else if (sh.kind === 'pots') { for (let y = 0.5; y < 2.4; y += 0.47) { const p = cam.P(X + sd * 0.28, y + 0.13, (za + zb) / 2); if (!p) continue; g.fillStyle = tone(mix(j % 2 ? '#a9aeb4' : '#c3c7cc', '#3a2c26', 0.3)); g.beginPath(); g.ellipse(p[0], p[1], 0.13 * p[2], 0.105 * p[2], 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.ellipse(p[0] - 0.045 * p[2], p[1] - 0.033 * p[2], 0.033 * p[2], 0.018 * p[2], 0, 0, TAU); g.fill(); } }
        else if (sh.kind === 'sweets') { q(za, zb, 0.78, 1.28, tone('#f3e2b8'), -0.22); q(za, zb, 1.28, 1.38, tone(['#f0a640', '#f4d36a', '#e86f6f', '#f7ebd0'][j % 4]), -0.22); }
        else if (sh.kind === 'fruit') { q(za, zb, 0.56, 1.1, tone(['#f2c230', '#f08a24', '#e2412f', '#7fb33d'][j % 4]), -0.13); q(za, zb, 1.1, 1.2, tone('#8a5a2c'), -0.13); }
        else if (sh.kind === 'toys') { for (let y = 0.4; y < 2.5; y += 0.4) q(za, zb, y, y + 0.3, tone(GOODS[(j * 5 + Math.round(y * 5)) % GOODS.length]), -0.28); }
        else { for (let y = 0.3; y < 2.45; y += 0.47) q(za, zb, y, y + 0.29, tone(mix(GOODS[(j * 3 + Math.round(y / 0.47) + sh.seed) % GOODS.length], '#3a2c26', 0.36)), -0.29); }
      }
      q(z0 + 0.1, z1 - 0.1, 0.16, 2.72, 'rgba(28,16,12,0.2)');
      // a bulb hanging in the mouth
      const bp = cam.P(X - sd * 0.05, 2.35, (z0 + z1) / 2); if (bp) bulb(g, bp[0], bp[1], bp[2], 0.85);
      g.restore();
    }
    // the board over the mouth, with the shop's trade on it
    q(z0 + 0.07, z1 - 0.07, 2.76, 3.14, tone(sh.sign[0], 0.04), 0.02);
    if (near && d < 16 && NAMES[sh.kind]) { const a = sd > 0 ? z1 - 0.12 : z0 + 0.12, b = sd > 0 ? z0 + 0.12 : z1 - 0.12; boardText(g, cam, [X - sd * 0.03, 3.12, a], [X - sd * 0.03, 3.12, b], [X - sd * 0.03, 2.78, a], NAMES[sh.kind], mix(sh.sign[1], HAZE, hz), { aspect: Math.abs(b - a) / 0.34 }); }
    if (sh.aw) {                                       // the awning out over the lane
      const a0 = 3.28, a1 = 2.84, out = 0.5, ns = Math.max(4, Math.round(len / 0.25));
      for (let m = 0; m < ns; m++) {
        const za = z0 + 0.04 + m * (len - 0.08) / ns, zb = za + (len - 0.08) / ns;
        const c = sh.aw === 'stripeR' ? (m % 2 ? '#f6efe2' : '#d9402f') : sh.aw === 'stripeB' ? (m % 2 ? '#f6efe2' : '#2f6fb0') : sh.aw;
        poly3(g, cam, [[X, a0, za], [X, a0, zb], [X - sd * out, a1, zb], [X - sd * out, a1, za]], tone(c));
      }
      poly3(g, cam, [[X - sd * out, a1, z0 + 0.04], [X - sd * out, a1, z1 - 0.04], [X - sd * out, a1 - 0.07, z1 - 0.04], [X - sd * out, a1 - 0.07, z0 + 0.04]], 'rgba(0,0,0,0.16)');
    }
    if (near && (sh.kind === 'grocery' || sh.kind === 'fruit')) {   // sacks and crates on the step
      for (let j = 0; j < 3; j++) { const za = z0 + 0.22 + j * (len - 0.44) / 3, zb = za + (len - 0.44) / 4; q(za, zb, 0.16, 0.74, tone('#a8784a'), 0.42); poly3(g, cam, [[X - sd * 0.42, 0.74, za], [X - sd * 0.42, 0.74, zb], [X - sd * 0.12, 0.84, zb], [X - sd * 0.12, 0.84, za]], tone(['#e8c34a', '#d2462f', '#f0e6c8'][j % 3])); }
    }
    if (near && (sh.kind === 'cloth' || sh.kind === 'toys') && sh.aw) {   // things hanging under the awning
      for (let j = 0; j < 4; j++) { const zz = z0 + (j + 0.5) * len / 4, p0 = cam.P(X - sd * 0.36, 2.8, zz), p1 = cam.P(X - sd * 0.36, 2.2, zz); if (!p0 || !p1) continue; const wv = 0.03 * Math.sin(tw * 2.1 + j + sh.seed); g.save(); g.translate(p0[0], p0[1]); g.rotate(wv); g.fillStyle = mix(GOODS[(j + 2 + sh.seed) % GOODS.length], HAZE, hz); const w = 0.17 * p0[2], hh = p1[1] - p0[1]; g.beginPath(); g.roundRect(-w / 2, 0, w, hh, w * 0.2); g.fill(); g.restore(); }
    }
  }
  // the low sun's shafts and the dust turning in them (drawn over everyone; strongest when you look into the sun)
  function light(g, cam, tw) {
    const lt = R.lightOf(cam), k = lt.back; if (k < 0.08) return;
    const sun = cam.P(cam.x + R.SUN[0] * 900, cam.y + R.SUN[1] * 900, cam.z + R.SUN[2] * 900); if (!sun) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [a0, a1, al] of [[1.02, 1.16, 0.06], [1.34, 1.42, 0.045], [1.56, 1.68, 0.055], [1.86, 1.95, 0.04], [2.2, 2.3, 0.04]]) {
      const L = 2800; g.fillStyle = lg(g, sun[0], sun[1], sun[0] + Math.cos((a0 + a1) / 2) * L, sun[1] + Math.sin((a0 + a1) / 2) * L, [0, `rgba(255,214,150,${(al * k).toFixed(3)})`], [1, 'rgba(255,214,150,0)']);
      g.beginPath(); g.moveTo(sun[0], sun[1]); g.lineTo(sun[0] + Math.cos(a0) * L, sun[1] + Math.sin(a0) * L); g.lineTo(sun[0] + Math.cos(a1) * L, sun[1] + Math.sin(a1) * L); g.closePath(); g.fill();
    }
    const r = mulberry32(3723);
    for (let i = 0; i < 70; i++) { const x0 = r() * C.W, y0 = 200 + r() * 1400, sp = 8 + r() * 14, ph = r() * TAU, x = x0 + NA(tw * 0.25 + i) * 40, y = ((y0 - tw * sp) % 1400 + 1400) % 1400 + 200, a = (0.22 + 0.22 * Math.sin(tw * 1.7 + ph)) * k; g.fillStyle = `rgba(255,236,190,${a.toFixed(3)})`; g.beginPath(); g.arc(x, y, 2.2 + (i % 3), 0, TAU); g.fill(); }
    g.restore();
  }
  window.WORLD = { world, light, bulb, LW, ZA, ZB, HAZE, lg, rg };
})();
