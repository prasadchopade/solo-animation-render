// Reel 42 · What Did He Take? (working title). Tests desk, a Trial Reel: a seamless loop of 22 s with no voice and no end card
// (the user's calls, 17 Nov; on 18 Nov: longer, and a side to him other than stealing). One tracking shot along a chai stall at
// golden hour: the season's thief walks through and takes five things (a lad's chai, an uncle's watch and wallet, the chaiwala's
// samosa, a man's phone), pays the chaiwala for a packet of biscuits with the uncle's own money, and crouches by the stray asleep
// in front of the shutter to share it. The street repeats every L metres and the film every T seconds: whoever he robs is behind
// him and off screen by the end, the stall ahead of him is the stall at frame 0, and his feet land where they did.
// docs/script.md has the beats; docs/shotlist.md the shot. The rig is reel 37's (film/rig.js, extended); the street is reel 37's
// lane with reel 36's stall (film/world.js). Our own drawings; nobody real. 30 fps. Every frame is a pure function of t, sealed
// in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp } = C;
  const R = window.RIG, WD = window.WORLD, U = window.UI, { sstep, mix, TAU } = R;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn'];
  const T = C.DUR, L = WD.L, PI = Math.PI;
  R.setSun([0.55, 0.42, -1]);                          // low, ahead of him (frame left) and a little on the camera's side
  const VARIANT = (window.TL && window.TL.variant) || '', PHY = VARIANT !== 'rig';   // physics + staging is the reel (the user, 18 Nov); 'rig': draft 6's motion

  // ------------------------------------------------------------------ small helpers
  // Motion (draft 5, the user on draft 4: "make the body movement smooth ... nice and natural"): every move eases with minimum
  // jerk (no jolt at either end); keyed values run on a smooth curve through their keys that never overshoots, so a turn only
  // stops where it turns back or holds, not at every key; and nobody is ever quite still (life(), below).
  const mj = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const ease = (a, b, t) => mj((t - a) / (b - a));
  const win = (t, a, b, c, d) => ease(a, b, t) * (1 - ease(c, d, t));
  const key = (t, ks) => {                            // through [t, v0, v1, ...]: a monotone cubic (as scipy's pchip)
    const n = ks.length; if (t <= ks[0][0]) return ks[0].slice(1); if (t >= ks[n - 1][0]) return ks[n - 1].slice(1);
    let i = 0; while (i < n - 2 && t > ks[i + 1][0]) i++;
    const a = ks[i], b = ks[i + 1], h = b[0] - a[0]; if (h <= 1e-9) return b.slice(1);
    const u = (t - a[0]) / h, u2 = u * u, u3 = u2 * u, out = [];
    const slope = (k, j) => {
      if (k <= 0 || k >= n - 1) return 0;
      const h0 = ks[k][0] - ks[k - 1][0], h1 = ks[k + 1][0] - ks[k][0]; if (h0 <= 1e-9 || h1 <= 1e-9) return 0;
      const d0 = (ks[k][j] - ks[k - 1][j]) / h0, d1 = (ks[k + 1][j] - ks[k][j]) / h1;
      if (d0 * d1 <= 0) return 0;
      const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0; return (w1 + w2) / (w1 / d0 + w2 / d1);
    };
    for (let j = 1; j < a.length; j++) out.push((2 * u3 - 3 * u2 + 1) * a[j] + (u3 - 2 * u2 + u) * h * slope(i, j) + (-2 * u3 + 3 * u2) * b[j] + (u3 - u2) * h * slope(i + 1, j));
    return out;
  };
  const k1 = (t, ks) => key(t, ks)[0];
  const mod = (x, m) => ((x % m) + m) % m;
  const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const lg = WD.lg;
  const probe = (name, F) => { const Q = window.PROBE; if (Q && F) Q[name] = { head: F.P.head.slice(0, 2), headR: F.headR, wrL: F.P.wrL.slice(0, 2), wrR: F.P.wrR.slice(0, 2), elL: F.P.elL.slice(0, 2), elR: F.P.elR.slice(0, 2), pel: F.P.pel.slice(0, 2) }; };   // for measuring motion; off unless a script sets window.PROBE
  // A person standing is never quite still: breath (about 15 a minute: the shoulders rise, the chest leans), a slow shift of
  // weight, a look that drifts. k scales it; per (the thief's loop, 22 s) rounds each rhythm to a whole number of cycles in the
  // loop, so he's the same at T as at 0. The stall's people run on their own clocks and need no rounding.
  function life(seed, t, k = 1, per = 0) {
    const s = (hz, ph) => Math.sin(TAU * ((per ? Math.round(hz * per) / per : hz) * t + ph));
    const b = s(0.26, seed * 0.37), w1 = s(0.09, seed * 0.71), w2 = s(0.14, seed * 0.29 + 0.2), h1 = s(0.19, seed * 0.53), h2 = s(0.31, seed * 0.17 + 0.4);
    return { shrug: 0.009 * b * k, lean: (0.011 * b + 0.015 * w1) * k, twist: 0.04 * w2 * k, headYaw: (0.045 * h1 + 0.02 * h2) * k, headPitch: (0.024 * h2 - 0.014 * b) * k, headTilt: 0.028 * w1 * k };
  }
  // ------------------------------------------------------------------ his walk: a Hermite path through his stops
  // Six strides a loop, and every stop on a step where both feet are down (a phase of .06 or .56), so his feet never slide and
  // land at T exactly where they were at 0.
  function hermite(ks) {
    return (t) => {
      let i = 0; while (i < ks.length - 2 && t > ks[i + 1][0]) i++;
      const [t0, s0, v0] = ks[i], [t1, s1, v1] = ks[i + 1], d = t1 - t0, u = clamp((t - t0) / d), u2 = u * u, u3 = u2 * u;
      return [(2 * u3 - 3 * u2 + 1) * s0 + (u3 - 2 * u2 + u) * d * v0 + (-2 * u3 + 3 * u2) * s1 + (u3 - u2) * d * v1,
        ((6 * u2 - 6 * u) * s0 + (3 * u2 - 4 * u + 1) * d * v0 + (-6 * u2 + 6 * u) * s1 + (3 * u2 - 2 * u) * d * v1) / d];
    };
  }
  const STR = L / 6;
  const PATH = hermite([[0, 0, 0.98], [0.85, STR * 0.56, 0], [2.35, STR * 0.56, 0], [3.0, STR * 1.06, 0], [5.6, STR * 1.06, 0],
    [6.75, STR * 2.06, 0], [7.95, STR * 2.06, 0], [9.0, STR * 3.06, 0], [11.55, STR * 3.06, 0], [12.65, STR * 4.06, 0], [19.3, STR * 4.06, 0], [T, L, 0.98]]);
  const sAt = (t) => { const n = Math.floor(t / T); return PATH(t - n * T)[0] + n * L; };

  // ------------------------------------------------------------------ the stall's people and things (period-local metres)
  const GLASS = [-1.87, 1.02, -0.92];                 // the lad's chai, on the counter's front, along from his right hand
  const TRAY = [-1.92, 1.02, -1.85];                  // the chaiwala's samosas
  const STACK = [-1.9, 1.02, -2.86];                  // packets of biscuits, stacked at the counter's end
  const FLICK = [-1.56, 1.46, -2.94], CATCH = [-2.28, 1.5, -2.7];   // the note: from his fingers to the chaiwala's
  const DOG = { x: -1.2, z: -4.84 }, DS = 1.3;        // the stray, asleep on the pavement in front of the shutter, nose to the stall (DS: its size)
  const PA = { x: -1.6, z: -0.5 }, PB = { x: -1.52, z: -1.6 }, PCW = { x: -2.62, z: -2.4 }, PC = { x: -0.82, z: -2.42 };
  // looks: everyone shares the season's skin range (no one darker than the thief); no saffron or green; no class ladder
  const LOOK = {
    thief: { headK: 0.15, handK: 0.058, skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', style: 'short', cap: true, must: 0.07, stub: 0.55, mole: [0.44, -0.48], brow: 0.08, browTilt: 0.03, shirt: '#37a18a', leg: '#20262f', shoe: '#141414', sole: '#d8d0c0' },
    A: { headK: 0.15, handK: 0.058, skin: '#b98258', skinD: '#8f5c3c', skinH: '#d3a07a', hair: '#1b130d', style: 'curly', brow: 0.075, shirt: '#c9403a', leg: '#3b4f74', shoe: '#ece8de', sole: '#ffffff' },
    B: { headK: 0.15, handK: 0.058, skin: '#ad7650', skinD: '#85553a', skinH: '#c8946c', hair: '#77736d', style: 'part', must: 0.12, brow: 0.085, shirt: '#a4c8e8', kurta: true, sleeve: 'long', leg: '#eee7d8', shoe: '#6b4a2e', sole: '#c9b28f', girth: 1.24, watch: { side: -1 } },
    C: { headK: 0.15, handK: 0.058, skin: '#b07650', skinD: '#86553a', skinH: '#cc9670', hair: '#120d09', style: 'short', brow: 0.075, shirt: '#e690ad', leg: '#474c58', shoe: '#2a221c', sole: '#8a7a68' },
    CW: { headK: 0.15, handK: 0.058, skin: '#a8714b', skinD: '#7f5134', skinH: '#c48e66', hair: '#2b2622', style: 'buzz', must: 0.1, brow: 0.08, shirt: '#ece6d8', sleeve: 'none', leg: '#5a4a6a', shoe: '#3a2a20', sole: '#7a6a58', girth: 0.92 },
  };
  const STY = {
    thief: PHY ? R.style({ stride: STR, cad: 1, arm: 0.52, armLag: 0.08, elbow: 0.3, elbowDyn: 0.55, chestYaw: 0.26, pelYaw: 0.16, pelRoll: 0.07, sway: 0.03, lean: 0.07, leanOsc: 0.02, headStab: 0.6, nod: 0.025, dip: 0.022 })   // 'physics': a walk with more give in it
      : R.style({ stride: STR, cad: 1, arm: 0.34, chestYaw: 0.14, lean: 0.045, headStab: 0.85 }),
    still: R.style({ stride: 0.5, cad: 1 }),
  };

  // ------------------------------------------------------------------ the camera: at the height of his eyes, across the lane
  // (down by the stray it comes in closer, lower, and looks down at the two of them)
  const thiefZ = (t) => -sAt(t);
  function camAt(t) {
    let z = 0; const n = 12; for (let i = 0; i < n; i++) z += thiefZ(t + (i / (n - 1) - 0.5) * 1.4); z /= n;
    const tt = mod(t, T);
    // his head inside the safe zones (x ≤ 950, y ≥ 269) at every frame (measured, 18 Nov): the camera eases him left as he walks off
    // after the bump (7.5–8.4), stays a little wider and further left by the stray, and rises with him as he stands for the shh (17.4)
    const off = k1(tt, [[0, -0.17], [1.0, -0.24], [2.3, -0.16], [3.0, 0.02], [4.1, 0.02], [4.6, -0.2], [5.4, -0.2], [5.9, -0.08], [6.3, -0.2], [6.7, -0.27], [7.0, -0.285], [7.45, -0.258], [7.8, -0.135], [8.15, 0.0], [8.5, 0.075], [9.0, 0.21], [9.3, 0.3], [11.3, 0.32], [12.2, 0.3], [13.3, -0.44], [17.4, -0.44], [18.2, -0.30], [19.8, -0.12], [T, -0.17]]);
    const f = k1(tt, [[0, 2050], [2.3, 2050], [3.0, 1560], [4.2, 1560], [4.7, 1700], [5.5, 1700], [6.2, 2000], [8.4, 2000], [9.3, 1850], [11.4, 1850], [12.4, 1900], [13.4, 1220], [18.4, 1220], [19.8, 2050], [T, 2050]]);
    const low = k1(tt, [[0, 0], [12.4, 0], [13.4, 1], [17.4, 1], [18.3, 0.72], [19.8, 0], [T, 0]]);
    return R.camera({ x: lerp(1.15, 0.62, low), y: lerp(1.5, 0.98, low), z: z + off, yaw: -PI / 2, pitch: lerp(-0.05, -0.12, low), f, cx: 540, cy: 960 });
  }

  // ------------------------------------------------------------------ arms: a hand to a place in the world, or near his own body
  function local(tr, P) { const sh = Math.sin(tr.h), ch = Math.cos(tr.h), dX = P[0] - tr.x, dZ = P[2] - tr.z; return [dX * sh + dZ * ch, P[1], -dX * ch + dZ * sh]; }
  // the wrist that puts the middle of the hand on P (world), relative to the chest; pole: where the elbow points
  function grab(J0, tr, side, P, pole, w = 1, back = 0.06) {
    const q = local(tr, P), sh = side === 'l' ? J0.shL : J0.shR, d = [q[0] - sh[0], q[1] - sh[1], q[2] - sh[2]], n = Math.hypot(...d) || 1;
    return { wrist: [q[0] - d[0] / n * back - J0.chest[0], q[1] - d[1] / n * back - J0.chest[1], q[2] - d[2] / n * back - J0.chest[2]], pole, w };
  }
  const body = (wr, pole, w = 1) => ({ wrist: wr, pole, w });
  const blendArm = (a, b, u) => (!a ? (b ? { ...b, w: b.w * u } : null) : !b ? { ...a, w: a.w * (1 - u) } : { wrist: lerp3(a.wrist, b.wrist, u), pole: lerp3(a.pole, b.pole, u), w: lerp(a.w, b.w, u) });
  // An arm's moves: keys [t, fn(J0, t) → arm (or null: let it swing, or hang), ease (s), kind ('g': a gesture, flung, which
  // overshoots a touch and settles), bow]. Each move starts from where the hand really is (one that begins before the last has
  // settled carries on from there, so nothing jumps), eases in and out with no jolt, and the wrist travels an arc that bows out
  // from the body, as an arm's does, not a straight line.
  const springE = (u) => (u <= 0 ? 0 : u < 0.72 ? 1.06 * mj(u / 0.72) : 1 + 0.06 * (1 - mj((u - 0.72) / 0.28)));   // out past the mark and back, no jolt at either end
  function bow(a, b, f, side, amt) {                  // the wrist's path from a to b, bowed outwards and up
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
    const p = [a[0] + d[0] * f, a[1] + d[1] * f, a[2] + d[2] * f]; if (L2 < 4e-4) return p;
    let n = [0.2, 0.5, side * 0.85]; const k = (n[0] * d[0] + n[1] * d[1] + n[2] * d[2]) / L2; n = [n[0] - k * d[0], n[1] - k * d[1], n[2] - k * d[2]];
    const g = clamp(f), h = amt * Math.sqrt(L2) * 4 * g * (1 - g) / (Math.hypot(n[0], n[1], n[2]) || 1);
    return [p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h];
  }
  function move(from, k, t, J0, side, ease0) {
    const to = k[1] ? k[1](J0, t) : null, u = (t - k[0]) / (k[2] ?? ease0), f = k[3] === 'g' ? springE(u) : mj(u), c = clamp(f);
    if (!from && !to) return null;
    if (!from) return { ...to, w: to.w * Math.min(f, 1.06) };
    if (!to) return { ...from, w: from.w * (1 - c) };
    return { wrist: bow(from.wrist, to.wrist, f, side, k[4] ?? 0.16), pole: lerp3(from.pole, to.pole, c), w: lerp(from.w, to.w, c) };
  }
  function armTrack(t, J0, keys, side = 1, ease0 = 0.26) {
    let i = -1; for (let j = 0; j < keys.length; j++) if (t >= keys[j][0]) i = j;
    if (i < 0) return null;
    let st = null; for (let j = 0; j < i; j++) st = move(st, keys[j], keys[j + 1][0], J0, side, ease0);   // where the hand is as each move begins
    return move(st, keys[i], t, J0, side, ease0);
  }
  // the middle of a hand on screen (for things held in it)
  const handAt = (el, wr, k = 0.055) => { const dx = wr[0] - el[0], dy = wr[1] - el[1], n = Math.hypot(dx, dy) || 1; return [wr[0] + dx / n * k * wr[2], wr[1] + dy / n * k * wr[2], Math.atan2(dy, dx)]; };

  // ------------------------------------------------------------------ props, drawn on screen at s px per metre
  function samosa(g, x, y, s, rot = 0, bite = 0) {
    const u = s * 0.075; g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath();
    if (bite > 0.5) { g.moveTo(-u * 0.42, -u * 0.25); g.arc(0, -u * 0.62, u * 0.42, 2.6, 0.54, true); }
    else { g.moveTo(-u * 0.12, -u * 1.02); g.quadraticCurveTo(0, -u * 1.15, u * 0.12, -u * 1.02); }
    g.quadraticCurveTo(u * 0.55, -u * 0.25, u * 1.15, u * 0.72); g.quadraticCurveTo(0, u * 1.08, -u * 1.15, u * 0.72); g.quadraticCurveTo(-u * 0.55, -u * 0.25, bite > 0.5 ? -u * 0.42 : -u * 0.12, bite > 0.5 ? -u * 0.25 : -u * 1.02); g.closePath();
    const q = g.createLinearGradient(-u, -u, u, u); q.addColorStop(0, '#f6cf78'); q.addColorStop(0.5, '#dd9c3e'); q.addColorStop(1, '#a5601e'); g.fillStyle = q; g.fill();
    g.strokeStyle = 'rgba(110,55,15,0.6)'; g.lineWidth = Math.max(1, u * 0.09); g.stroke();
    g.strokeStyle = 'rgba(255,236,190,0.55)'; g.lineWidth = Math.max(1, u * 0.07); g.beginPath(); g.moveTo(-u * 0.95, u * 0.66); g.quadraticCurveTo(0, u * 0.9, u * 0.95, u * 0.66); g.stroke();
    if (bite > 0.5) { g.fillStyle = '#f3e3a8'; g.beginPath(); g.ellipse(0, -u * 0.2, u * 0.3, u * 0.12, 0, 0, TAU); g.fill(); g.fillStyle = '#9ac25a'; g.beginPath(); g.arc(-u * 0.08, -u * 0.18, u * 0.05, 0, TAU); g.arc(u * 0.12, -u * 0.22, u * 0.045, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(255,240,200,0.6)'; for (const [bx, by] of [[-0.3, 0.2], [0.25, 0.05], [0.05, 0.45], [-0.55, 0.5]]) { if (bite > 0.5 && by < 0.1) continue; g.beginPath(); g.arc(bx * u, by * u, u * 0.06, 0, TAU); g.fill(); }
    g.restore();
  }
  function phone(g, x, y, s, rot = 0) {
    const w = 0.082 * s, h = 0.165 * s; g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = '#1d2433'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, w * 0.18); g.fill();
    g.fillStyle = '#3c4a66'; g.beginPath(); g.roundRect(-w / 2 + w * 0.09, -h / 2 + w * 0.12, w * 0.82, h - w * 0.24, w * 0.1); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(-w * 0.32, -h * 0.4); g.lineTo(-w * 0.05, -h * 0.4); g.lineTo(-w * 0.32, -h * 0.05); g.closePath(); g.fill();
    g.restore();
  }
  function wallet(g, x, y, s, rot = 0, open = 0) {
    const w = 0.135 * s, h = 0.1 * s; g.save(); g.translate(x, y); g.rotate(rot);
    if (open > 0.05) {
      for (const sd of [-1, 1]) { g.save(); g.scale(sd, 1); g.rotate(0.12 * open); g.fillStyle = '#6b3b1d'; g.beginPath(); g.roundRect(0, -h / 2, w * 0.95, h, h * 0.12); g.fill(); g.restore(); }
      g.fillStyle = '#b9d7a8'; g.fillRect(-w * 0.75, -h * 0.62, w * 0.6, h * 0.5); g.fillStyle = '#9fc493'; g.fillRect(-w * 0.62, -h * 0.72, w * 0.55, h * 0.5);
      g.fillStyle = '#d9c38a'; g.fillRect(w * 0.15, -h * 0.66, w * 0.6, h * 0.48);
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = Math.max(1, 0.004 * s); g.beginPath(); g.moveTo(0, -h / 2); g.lineTo(0, h / 2); g.stroke();
    } else {
      const q = g.createLinearGradient(0, -h / 2, 0, h / 2); q.addColorStop(0, '#8a4f28'); q.addColorStop(1, '#5a3118'); g.fillStyle = q;
      g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h * 0.14); g.fill();
      g.strokeStyle = 'rgba(255,220,170,0.45)'; g.lineWidth = Math.max(1, 0.003 * s); g.setLineDash([0.008 * s, 0.006 * s]); g.beginPath(); g.roundRect(-w / 2 + 0.008 * s, -h / 2 + 0.008 * s, w - 0.016 * s, h - 0.016 * s, h * 0.1); g.stroke(); g.setLineDash([]);
    }
    g.restore();
  }
  function note(g, x, y, s, rot = 0, sq = 1) {          // a banknote, a little over life size: no real note's design, no numbers
    const w = 0.15 * s, h = 0.072 * s; g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, sq);
    g.fillStyle = '#b9d7a8'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 0.006 * s); g.fill();
    g.strokeStyle = '#5f8a5a'; g.lineWidth = Math.max(1, 0.004 * s); g.strokeRect(-w / 2 + 0.008 * s, -h / 2 + 0.008 * s, w - 0.016 * s, h - 0.016 * s);
    g.fillStyle = 'rgba(255,255,240,0.75)'; g.beginPath(); g.ellipse(w * 0.24, 0, h * 0.24, h * 0.28, 0, 0, TAU); g.fill();
    g.fillStyle = '#7fa874'; g.beginPath(); g.arc(-w * 0.2, 0, h * 0.22, 0, TAU); g.fill();
    g.restore();
  }
  function biscuitAt(g, x, y, s, rot = 0) {              // one glucose biscuit: golden, rounded, pricked
    const w = 0.056 * s, h = 0.04 * s; g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = '#dfa64e'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 0.007 * s); g.fill();
    g.strokeStyle = 'rgba(140,80,20,0.6)'; g.lineWidth = Math.max(1, 0.0025 * s); g.stroke();
    g.fillStyle = 'rgba(255,235,190,0.35)'; g.fillRect(-w * 0.42, -h * 0.4, w * 0.84, h * 0.16);
    g.fillStyle = 'rgba(125,66,18,0.65)'; for (const [a, b] of [[-0.28, -0.12], [0, -0.12], [0.28, -0.12], [-0.28, 0.2], [0, 0.2], [0.28, 0.2]]) { g.beginPath(); g.arc(a * w, b * h, Math.max(0.6, 0.0023 * s), 0, TAU); g.fill(); }
    g.restore();
  }
  function packet(g, x, y, s, rot = 0, open = 0, left = 3, sq = 1) {   // a packet of glucose biscuits: yellow, a red band, crimped ends; no brand
    const w = 0.165 * s, h = 0.066 * s, cut = open > 0.05 ? 0.016 * s : 0; g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, sq);
    if (open > 0.05) for (let i = 0; i < left; i++) biscuitAt(g, -w / 2 + cut - (0.012 + 0.008 * i) * s * open, -h * 0.16 + i * 0.016 * s, s, PI / 2 + 0.2 - i * 0.16);
    g.fillStyle = lg(g, 0, -h / 2, 0, h / 2, [0, '#ffe58a'], [0.5, '#f6c22f'], [1, '#c8901b']);
    g.beginPath(); g.roundRect(-w / 2 + cut, -h / 2, w - cut, h, 0.008 * s); g.fill();
    g.fillStyle = '#d6402c'; g.fillRect(-w * 0.1, -h / 2, w * 0.28, h);
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(-w / 2 + cut + 0.01 * s, -h * 0.38, w - cut - 0.02 * s, h * 0.12);
    g.fillStyle = '#e9b32a';
    for (const e of open > 0.05 ? [1] : [-1, 1]) { g.beginPath(); g.moveTo(e * w / 2, -h / 2); for (let i = 0; i <= 8; i++) g.lineTo(e * (w / 2 + (i % 2 ? 0.011 : 0.003) * s), -h / 2 + h * i / 8); g.lineTo(e * (w / 2 - 0.012 * s), h / 2); g.lineTo(e * (w / 2 - 0.012 * s), -h / 2); g.closePath(); g.fill(); }
    if (open > 0.05) { g.strokeStyle = '#b07a14'; g.lineWidth = Math.max(1, 0.003 * s); g.beginPath(); for (let i = 0; i <= 6; i++) { const yy = -h / 2 + h * i / 6, xx = -w / 2 + cut + (i % 2 ? -0.006 : 0.004) * s; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
    g.restore();
  }
  function tumbler(g, x, y, s, rot = 0) {
    const w = 0.08 * s, h = 0.1 * s; g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [0, '#d9dde2'], [0.35, '#f4f6f8'], [0.6, '#a9afb7'], [1, '#6e747c']);
    g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w * 0.4, h / 2); g.lineTo(-w * 0.4, h / 2); g.closePath(); g.fill();
    g.fillStyle = '#5f646b'; g.beginPath(); g.ellipse(0, -h / 2, w / 2, w * 0.12, 0, 0, TAU); g.fill();
    g.restore();
  }
  function handOver(g, el, wr, look, k = 0.058) {
    const s = wr[2], [x, y, a] = handAt(el, wr, 0.9 * k), r = k * s;
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = mix(look.skin, '#fff0d2', 0.08); g.beginPath(); g.ellipse(0, 0, r * 1.2, r * 0.84, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(90,50,30,0.35)'; g.lineWidth = Math.max(1, r * 0.07); g.lineCap = 'round';
    for (const kk of [-0.34, 0.02, 0.38]) { g.beginPath(); g.moveTo(r * 0.5, r * kk); g.lineTo(r * 1.12, r * kk * 0.9); g.stroke(); }
    g.restore();
  }
  function gripFingers(g, x, y, s, rot, look, n = 4) {     // curled fingers across something held (the hand behind it)
    const r = 0.058 * s, ew = Math.max(0.8, r * 0.07), c0 = mix(look.skin, '#fff0d2', 0.06), c1 = mix(look.skin, '#000000', 0.22);
    g.save(); g.translate(x, y); g.rotate(rot); g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const yy = (i - (n - 1) / 2) * 0.34 * r, w = (0.36 - 0.02 * i) * r;
      g.beginPath(); g.moveTo(-0.62 * r, yy + 0.04 * r); g.lineTo(0.6 * r, yy - 0.04 * r);
      g.lineWidth = w + 2 * ew; g.strokeStyle = 'rgba(60,30,18,0.7)'; g.stroke(); g.lineWidth = w; g.strokeStyle = mix(c0, c1, 0.08 * i); g.stroke();
      g.fillStyle = 'rgba(255,240,224,0.45)'; g.beginPath(); g.arc(0.62 * r, yy - 0.04 * r, w * 0.22, 0, TAU); g.fill();
    }
    g.restore();
  }
  function goldGlint(g, x, y, s, a = 1) {                 // the watch in his fist: a glint of gold between the fingers
    g.save(); g.globalAlpha *= a; g.fillStyle = '#e8b632'; g.beginPath(); g.ellipse(x, y, 0.032 * s, 0.017 * s, 0.4, 0, TAU); g.fill();
    g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(x - 0.008 * s, y - 0.004 * s, 0.007 * s, 0, TAU); g.fill(); g.restore();
  }
  function newspaper(g, pts) {                             // four screen corners (tl, tr, br, bl); no readable words
    const [a, b, c, d] = pts; g.save();
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath();
    g.fillStyle = '#ece6d6'; g.fill(); g.strokeStyle = 'rgba(80,70,60,0.5)'; g.lineWidth = 2; g.stroke(); g.clip();
    const P = (u, v) => [a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v];
    const quad = (u0, v0, u1, v1, col) => { const p = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]; g.beginPath(); g.moveTo(...p[0]); for (let i = 1; i < 4; i++) g.lineTo(...p[i]); g.closePath(); g.fillStyle = col; g.fill(); };
    quad(0.06, 0.06, 0.94, 0.17, '#3b3632');
    quad(0.06, 0.22, 0.46, 0.5, '#b8b2a6');
    for (let i = 0; i < 9; i++) { quad(0.52, 0.23 + i * 0.075, 0.94, 0.26 + i * 0.075, 'rgba(70,64,58,0.55)'); }
    for (let i = 0; i < 5; i++) { quad(0.06, 0.56 + i * 0.075, 0.46, 0.59 + i * 0.075, 'rgba(70,64,58,0.55)'); }
    g.strokeStyle = 'rgba(80,70,60,0.35)'; g.lineWidth = 2; const m0 = P(0.5, 0), m1 = P(0.5, 1); g.beginPath(); g.moveTo(...m0); g.lineTo(...m1); g.stroke();
    g.restore();
  }
  function trayOfSamosas(g, cam, P, n) {
    const p = cam.P(P[0], P[1], P[2]); if (!p) return; const s = p[2];
    g.fillStyle = lg(g, p[0] - 0.16 * s, 0, p[0] + 0.16 * s, 0, [0, '#c9ced4'], [0.5, '#f0f2f4'], [1, '#9aa1a9']); g.beginPath(); g.ellipse(p[0], p[1], 0.17 * s, 0.035 * s, 0, 0, TAU); g.fill();
    const spots = [[-0.085, -0.03], [0, -0.032], [0.085, -0.03], [-0.045, -0.085], [0.045, -0.085], [0, -0.135]];
    for (let i = 0; i < Math.min(n, spots.length); i++) samosa(g, p[0] + spots[i][0] * s, p[1] + spots[i][1] * s, s * 0.85, (i % 2 ? 0.15 : -0.12));
  }

  // ------------------------------------------------------------------ the stray: asleep until it smells the biscuits
  // Drawn side-on, its nose to +Z (frame right, towards the stall and him), in its own metres: x forward, y up, the origin on the
  // ground under its chest. An Indian street dog: fawn, a pale bib and muzzle, upright ears, a curled tail.
  const WAGF = (u) => k1(u, [[12.9, 0], [13.15, 2.2], [13.9, 2.2], [14.0, 4.2], [14.8, 4.2], [14.95, 0.5], [15.9, 0.5], [16.3, 4.2], [16.85, 4.2], [17.0, 1.6], [17.5, 1.6], [17.65, 4.2]]);
  const WAG = (() => {                                 // the tail's phase: the integral of how fast it wags, so it never jumps
    const dt = 0.01, n = Math.ceil((2 * T + 30) / dt), tab = new Float64Array(n + 1);
    for (let i = 1; i <= n; i++) tab[i] = tab[i - 1] + TAU * WAGF(i * dt - dt / 2) * dt;
    return (u) => { const x = clamp(u / dt, 0, n - 1), i = Math.floor(x); return lerp(tab[i], tab[i + 1], x - i); };
  })();
  function dogState(tau) {
    const lift = sstep(12.3, 12.6, tau), fwd = win(tau, 13.62, 13.8, 13.95, 14.15), stare = win(tau, 14.9, 15.05, 15.75, 15.95);
    const bliss = win(tau, 16.76, 17.06, 17.42, 17.68), eat = ease(16.22, 16.55, tau) * (1 - bliss);
    const snap = win(tau, 13.84, 13.88, 13.93, 13.98);
    const chew = (tau >= 13.97 && tau < 14.85) || (tau >= 16.5 && bliss < 0.05);
    const jaw = Math.max(0.9 * snap, chew ? 0.32 * Math.max(0, Math.sin(TAU * 4.6 * tau)) : 0, 0.22 * bliss);
    const sniff = (win(tau, 12.45, 12.55, 13.25, 13.4) + win(tau, 13.6, 13.66, 13.84, 13.88) + 0.6 * win(tau, 15.88, 15.95, 16.2, 16.3)) * (0.5 + 0.5 * Math.sin(TAU * 7 * tau));
    const eyes = tau < 12.38 ? 0 : 1 - Math.max(bliss, blink(tau, 2.2) * (1 - bliss));
    const twitch = win(tau, 12.1, 12.14, 12.18, 12.25) * (1 - lift);
    const ears = clamp(lerp(0.05, 1, lift) - 0.6 * bliss + 0.15 * stare - 0.2 * eat) + 0.35 * twitch;
    return { lift, fwd, stare, bliss, eat, jaw, sniff, eyes, ears, lick: win(tau, 15.15, 15.2, 15.32, 15.4), paw: win(tau, 15.38, 15.52, 15.72, 15.88),
      happy: Math.max(chew ? 1 : 0, bliss, eat), wag: WAG(tau), amp: clamp(WAGF(tau) / 2.2) * lift, br: 1 + 0.03 * Math.sin(tau * 2.4) * (1 - lift), asleep: tau < 12.38 };
  }
  function dogHead(d) {                                // the head's centre and angle (+ = nose up), dog-local
    return { x: lerp(0.1, 0.075, d.lift) + 0.06 * d.fwd + 0.015 * d.eat, y: lerp(0.115, 0.345, d.lift) + 0.025 * d.fwd - 0.235 * d.eat + 0.03 * d.bliss,
      a: lerp(-0.12, 0, d.lift) + 0.15 * d.fwd - 0.55 * d.eat + 0.14 * d.bliss + 0.06 * d.stare };
  }
  const dogPt = (Hd, hx, hy, dz = 0) => { const c = Math.cos(Hd.a), s = Math.sin(Hd.a); return [DOG.x, DS * (Hd.y + hx * s + hy * c), DOG.z + dz + DS * (Hd.x + hx * c - hy * s)]; };
  const OFFER = (() => { const p = dogPt(dogHead(dogState(13.9)), 0.17, -0.01); return [p[0] + 0.02, p[1] + 0.01, p[2] + 0.045]; })();   // where he holds the biscuit out
  const GROUND = [DOG.x + 0.02, 0.03, DOG.z + DS * 0.22];   // where he puts the packet down: between its front paws
  function cap2(g, a, b, ra, rb, fill) { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); g.beginPath(); g.arc(a[0], a[1], ra, ang + PI / 2, ang - PI / 2); g.arc(b[0], b[1], rb, ang - PI / 2, ang + PI / 2); g.closePath(); g.fillStyle = fill; g.fill(); }
  function dogEar(g, bx, by, rot, fill, inner, edge) {    // broad, upright, a soft point
    g.save(); g.translate(bx, by); g.rotate(rot);
    g.beginPath(); g.moveTo(-0.034, -0.006); g.quadraticCurveTo(-0.042, 0.05, -0.024, 0.084); g.quadraticCurveTo(-0.008, 0.106, 0.008, 0.084); g.quadraticCurveTo(0.028, 0.05, 0.034, 0.008); g.closePath();
    g.fillStyle = fill; g.fill(); if (edge) { g.strokeStyle = edge; g.lineWidth = 0.005; g.stroke(); }
    if (inner) { g.fillStyle = inner; g.beginPath(); g.moveTo(-0.02, 0.006); g.quadraticCurveTo(-0.024, 0.05, -0.01, 0.078); g.quadraticCurveTo(0.008, 0.05, 0.018, 0.012); g.closePath(); g.fill(); }
    g.restore();
  }
  // between(): drawn after its far foreleg and before the rest (the packet he leaves it, between its front paws)
  function strayDog(g, cam, tau, dz, between) {
    const d = dogState(tau), Hd = dogHead(d);
    const p0 = cam.P(DOG.x, 0, DOG.z + dz), p1 = cam.P(DOG.x, 0, DOG.z + dz + 0.5); if (!p0 || !p1 || p0[2] < 30) return;
    const s = p0[2] * DS, sx = p1[0] >= p0[0] ? 1 : -1;
    const FUR = '#c87a3e', FURD = '#9a5226', FURL = '#f6ddb6', DARK = '#24150f', EDGE = 'rgba(70,35,15,0.55)', br = d.br;
    const frame = () => { g.translate(p0[0], p0[1]); g.scale(s * sx, -s); g.lineJoin = 'round'; g.lineCap = 'round'; };
    g.save(); frame();
    const out = (w = 0.006) => { g.strokeStyle = EDGE; g.lineWidth = w; g.stroke(); };
    g.fillStyle = 'rgba(60,35,30,0.24)'; g.beginPath(); g.ellipse(-0.07, 0.004, 0.31, 0.03, 0, 0, TAU); g.fill();       // its shadow
    // the tail: wrapped round its feet while it sleeps; once it's awake, a curl over its back that wags
    const sw = Math.sin(d.wag) * d.amp, lf = d.lift;
    const tB = [-0.31, lerp(0.08, 0.15, lf)], tC = [lerp(-0.4, -0.42, lf) + 0.03 * sw, lerp(0.0, 0.35, lf)], tE = [lerp(-0.2, -0.26, lf) + 0.08 * sw, lerp(0.012, 0.34, lf) - 0.015 * Math.abs(sw)];
    const tail = () => {
      g.beginPath(); g.moveTo(...tB); g.quadraticCurveTo(...tC, ...tE);
      g.strokeStyle = EDGE; g.lineWidth = 0.066; g.stroke(); g.strokeStyle = FUR; g.lineWidth = 0.054; g.stroke();
      g.strokeStyle = mix(FUR, FURL, 0.55); g.lineWidth = 0.018; g.beginPath(); g.moveTo(tB[0] + 0.01, tB[1] - 0.005); g.quadraticCurveTo(tC[0] + 0.02, tC[1] - 0.02, tE[0], tE[1] - 0.012); g.stroke();
    };
    if (lf > 0.5) tail();
    cap2(g, [0.0, 0.07], [0.16, 0.034], 0.03, 0.024, mix(FUR, '#000000', 0.22));                                         // the far foreleg
    g.fillStyle = mix(FURL, '#000000', 0.18); g.beginPath(); g.ellipse(0.176, 0.026, 0.032, 0.021, 0, 0, TAU); g.fill();
    if (between) { g.restore(); between(); g.save(); frame(); }
    // the body: a deep chest, its back, the rump; paler underneath
    g.beginPath(); g.moveTo(0.04, 0.02); g.quadraticCurveTo(0.075, 0.17, -0.01, 0.225 * br); g.quadraticCurveTo(-0.13, 0.205 * br, -0.255, 0.21 * br);
    g.quadraticCurveTo(-0.355, 0.195, -0.34, 0.07); g.quadraticCurveTo(-0.325, 0.0, -0.245, 0.004); g.lineTo(0.0, 0.006); g.closePath();
    g.fillStyle = lg(g, 0, 0.23, 0, 0, [0, FURD], [0.4, FUR], [1, mix(FUR, FURL, 0.45)]); g.fill(); out();
    g.strokeStyle = 'rgba(255,226,168,0.6)'; g.lineWidth = 0.012; g.beginPath(); g.moveTo(0.02, 0.2); g.quadraticCurveTo(-0.13, 0.214 * br, -0.255, 0.216 * br); g.stroke();   // the low sun along its back
    g.fillStyle = FURL; g.beginPath(); g.ellipse(0.035, 0.1, 0.034, 0.08, -0.2, 0, TAU); g.fill();                                       // its bib
    // the hind leg, folded, and its paw forward along the ground
    g.beginPath(); g.ellipse(-0.222, 0.1, 0.105, 0.09, 0.15, 0, TAU); g.fillStyle = lg(g, -0.22, 0.19, -0.22, 0.0, [0, FUR], [1, mix(FUR, FURD, 0.35)]); g.fill(); out();
    g.strokeStyle = 'rgba(90,45,20,0.35)'; g.lineWidth = 0.006; g.beginPath(); g.arc(-0.218, 0.095, 0.077, 1.9, 3.3); g.stroke();
    cap2(g, [-0.15, 0.03], [-0.082, 0.024], 0.03, 0.026, FUR); out(0.004); g.fillStyle = FURL; g.beginPath(); g.ellipse(-0.072, 0.022, 0.022, 0.016, 0, 0, TAU); g.fill();
    if (lf <= 0.5) tail();
    // the near foreleg (it lifts a paw: please?)
    const el = [0.055, 0.058 + 0.03 * d.paw], pw = [lerp(0.19, 0.15, d.paw), lerp(0.026, 0.155, d.paw)];
    cap2(g, [-0.005, 0.09], el, 0.036, 0.031, FUR); cap2(g, el, pw, 0.031, 0.024, FUR); out(0.004);
    g.fillStyle = FURL; g.beginPath(); g.ellipse(pw[0] + 0.01, pw[1], 0.034, 0.022, 0.5 * d.paw, 0, TAU); g.fill(); out(0.004);
    g.strokeStyle = 'rgba(90,45,20,0.5)'; g.lineWidth = 0.004; for (const k of [-0.007, 0.008]) { g.beginPath(); g.moveTo(pw[0] + 0.028, pw[1] + k); g.lineTo(pw[0] + 0.042, pw[1] + k * 0.8); g.stroke(); }
    // the neck, then the head
    cap2(g, [-0.035, 0.16], [Hd.x - 0.03, Hd.y - 0.012], 0.085, 0.068, FUR);
    cap2(g, [0.01, 0.1], [Hd.x + 0.005, Hd.y - 0.05], 0.04, 0.034, mix(FUR, FURL, 0.6));                                // the throat, paler
    g.save(); g.translate(Hd.x, Hd.y); g.rotate(Hd.a);
    const er = lerp(-1.0, 0.0, clamp(d.ears)) + 0.25 * Math.sin(tau * 40) * win(tau, 12.1, 12.14, 12.18, 12.25);
    dogEar(g, -0.02, 0.05, er + 0.16, mix(FURD, '#000000', 0.1), null, null);                                            // the far ear
    g.beginPath(); g.ellipse(-0.005, 0.005, 0.074, 0.064, 0, 0, TAU); g.fillStyle = lg(g, 0, 0.07, 0, -0.06, [0, mix(FUR, FURD, 0.3)], [1, FUR]); g.fill(); out();   // the skull
    // the muzzle: a soft step down from the brow to a black nose (a little shorter than a fox's)
    g.save(); g.translate(0.03, 0); g.scale(0.88, 1); g.translate(-0.03, 0);
    g.beginPath(); g.moveTo(0.028, 0.044); g.quadraticCurveTo(0.06, 0.03, 0.138, 0.016); g.quadraticCurveTo(0.164, 0.006, 0.16, -0.016); g.quadraticCurveTo(0.156, -0.034, 0.138, -0.036); g.quadraticCurveTo(0.09, -0.05, 0.035, -0.052); g.quadraticCurveTo(0.0, -0.04, 0.028, 0.044); g.closePath();
    g.fillStyle = FUR; g.fill(); out();
    g.fillStyle = mix(FUR, FURL, 0.28); g.beginPath(); g.moveTo(0.02, -0.012); g.quadraticCurveTo(0.09, -0.012, 0.155, -0.022); g.quadraticCurveTo(0.14, -0.05, 0.05, -0.054); g.quadraticCurveTo(0.0, -0.046, 0.02, -0.012); g.closePath(); g.fill();   // pale lips and cheek
    // the lower jaw, opening to take a biscuit or to chew
    g.save(); g.translate(0.045, -0.04); g.rotate(-0.45 * d.jaw);
    if (d.jaw > 0.05) { g.fillStyle = '#6e2a30'; g.beginPath(); g.moveTo(0, 0.004); g.lineTo(0.104, 0.012); g.lineTo(0.1, -0.012); g.lineTo(0, -0.012); g.closePath(); g.fill(); }
    g.beginPath(); g.moveTo(0, 0.0); g.quadraticCurveTo(0.06, -0.006, 0.102, -0.002); g.quadraticCurveTo(0.106, -0.02, 0.09, -0.027); g.quadraticCurveTo(0.03, -0.033, 0.0, -0.024); g.closePath(); g.fillStyle = mix(FUR, FURL, 0.12); g.fill(); out(0.004);
    g.restore();
    if (d.bliss > 0.3 || d.lick > 0.02) { const k = Math.max(d.lick, d.bliss * 0.6); g.fillStyle = '#e27a8a'; g.beginPath(); g.ellipse(0.146 + 0.014 * d.lick, -0.038 + 0.032 * d.lick, 0.007 + 0.017 * k, 0.011, 0.6 + 0.6 * d.lick, 0, TAU); g.fill(); }   // its tongue
    const nz = 0.0035 * d.sniff;
    g.fillStyle = DARK; g.beginPath(); g.ellipse(0.155 + nz, 0.0, 0.021, 0.016, -0.25, 0, TAU); g.fill();                   // the nose, sniffing
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(0.151 + nz, 0.007, 0.007, 0.004, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(60,30,20,0.75)'; g.lineWidth = 0.005; g.beginPath(); g.moveTo(0.146, -0.03); g.quadraticCurveTo(0.1, -0.04, 0.066, -0.032 + 0.016 * d.happy); g.stroke();   // a dog's smile
    g.restore();
    const ex = 0.052, ey = 0.018;
    if (d.eyes > 0.15) {
      g.fillStyle = '#2a160e'; g.beginPath(); g.ellipse(ex, ey, 0.019, 0.017 * d.eyes * (1 + 0.2 * d.stare), 0.1, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + 0.006, ey + 0.006, 0.0055, 0, TAU); g.fill(); g.beginPath(); g.arc(ex - 0.005, ey - 0.005, 0.0025, 0, TAU); g.fill();
    } else {
      g.strokeStyle = '#2a160e'; g.lineWidth = 0.006; g.beginPath(); g.moveTo(ex - 0.017, ey); g.quadraticCurveTo(ex, ey + (d.asleep ? -0.011 : 0.013), ex + 0.017, ey); g.stroke();   // shut: asleep, or bliss
    }
    g.fillStyle = 'rgba(250,228,190,0.8)'; g.beginPath(); g.ellipse(ex - 0.006, ey + 0.032 + 0.01 * d.stare, 0.014, 0.007, -0.2, 0, TAU); g.fill();   // the tan brow
    dogEar(g, -0.045, 0.045, er, FUR, '#e9a487', EDGE);                                                                    // the near ear
    g.restore();
    g.restore();
  }
  function groundPacket(g, cam, tau, dz) {             // the packet he leaves it, on the ground in front of its paws
    if (tau < 16.2) return;
    const p = cam.P(GROUND[0], 0.012, GROUND[2] + dz); if (!p) return;
    packet(g, p[0], p[1] - 0.026 * p[2], p[2], 0.06, 1, tau < 17.0 ? 3 : tau < 19.0 ? 2 : 1, 0.8);
  }

  // ------------------------------------------------------------------ the thief: what his body and face do, second by second
  // How much of his walk is in his body (the arms' swing, the roll of his hips and chest): it falls away as he stops, a moment
  // after he does, so his arms swing on and come to rest at his sides instead of freezing mid-swing, and comes back as he goes.
  function walkK(t) { let s = 0, W = 0; for (let k = 0; k < 12; k++) { const tau = k * 0.04, w = Math.exp(-tau / 0.13); s += w * clamp(PATH(mod(t - tau, T))[1] / 0.5); W += w; } return s / W; }
  const AZ = 0.42, AW = TAU * 1.5, AWD = AW * Math.sqrt(1 - AZ * AZ), ADT = 0.03;
  const AIMP = Array.from({ length: 34 }, (_, k) => Math.exp(-AZ * AW * k * ADT) * Math.sin(AWD * k * ADT)), ASUM = AIMP.reduce((a, b) => a + b, 0);
  const accel = (t) => (PATH(mod(t + 0.02, T))[1] - PATH(mod(t - 0.02, T))[1]) / 0.04;
  function accLean(t) { let x = 0; for (let k = 1; k < AIMP.length; k++) x += AIMP[k] * -accel(t - k * ADT); return 0.055 * x / ASUM; }   // ('physics')
  function thiefBody(t) {                              // his trunk: a crouch by the stray, the twist and lean of his hands' work, a sigh, his breath
    const down = win(t, 12.8, 13.42, 17.68, 18.26), bend = win(t, 12.7, 13.22, 17.5, 18.08), push = win(t, 17.46, 17.62, 17.76, 18.0);   // he leans before he sinks, and leans in to push himself up
    const reach = win(t, 13.35, 13.6, 13.95, 14.2) + 0.8 * win(t, 15.85, 16.05, 16.25, 16.45) + 0.6 * win(t, 16.5, 16.7, 17.45, 17.6);
    const wk = walkK(t), lf = life(1.3, t, 1 - 0.75 * wk, T);
    const out = {
      sink: 0.42 * down, sit: 0.1 * down, dyn: wk, headTilt: lf.headTilt, lf,
      lean: k1(t, [[0, 0], [0.8, 0], [1.0, 0.07], [1.15, 0], [1.9, 0], [2.0, 0.06], [2.2, 0], [2.92, 0], [3.0, -0.03], [3.12, 0.02], [3.3, 0], [5.95, 0], [6.08, 0.08], [6.24, 0], [6.85, 0], [6.95, -0.06], [7.2, 0], [11.1, 0], [11.25, 0.05], [11.4, 0], [T, 0]]) + bend * (0.4 + 0.14 * reach) + 0.1 * push + lf.lean,
      twist: k1(t, [[0, 0], [4.35, 0], [4.55, -0.2], [5.25, -0.2], [5.5, 0], [10.82, 0], [10.95, 0.32], [11.4, 0.32], [11.6, 0], [T, 0]]) + lf.twist,
      shrug: 0.06 * win(t, 15.44, 15.62, 15.68, 15.86) - 0.035 * win(t, 15.68, 15.86, 16.0, 16.22) + 0.025 * win(t, 2.95, 3.05, 3.25, 3.5) + lf.shrug,
    };
    if (PHY) {                                         // 'physics': his weight, a deeper crouch with his hips back, his chest turned to you
      const face = 1 - 0.8 * Math.max(win(t, 2.95, 3.3, 5.45, 5.85), win(t, 6.7, 6.9, 7.85, 8.2), win(t, 10.7, 10.85, 11.5, 11.7));   // to you, except while he deals with someone
      out.lean += accLean(t) + 0.16 * down; out.sink += 0.05 * down; out.sit += 0.1 * down; out.twist += -0.32 * face;
    }
    return out;
  }
  // where he looks, keyed; headAt() lets the head follow its keys as a head does: a quick turn overshoots a touch and settles
  // (a damped spring, its delay taken back so the looks land when they're keyed)
  const HEAD = [[0, -0.28, 0], [0.75, -0.2, 0], [0.95, 0.42, -0.12], [1.15, 0.2, 0.05], [1.4, 0.05, 0.3], [1.9, 0.05, 0.3], [2.1, 0.3, -0.05], [2.45, -0.15, 0], [3.0, 0.05, 0], [3.4, 0.12, 0.02], [4.3, 0.12, 0], [4.55, -0.95, 0.05], [5.25, -0.9, 0.05], [5.5, 0.2, -0.05], [5.85, -0.2, 0], [6.0, 0.75, 0.16], [6.45, 0.8, 0.14], [6.75, 0.1, 0], [6.9, 0.05, -0.05], [7.5, 0.0, 0], [7.95, -0.25, 0], [9.05, -0.1, -0.15], [9.3, 0.0, -0.42], [9.95, 0.0, -0.4], [10.3, -0.2, 0], [10.45, -1.3, 0.02], [10.82, -1.3, 0.02],
    [10.98, 0.75, -0.05], [11.3, 0.65, -0.12], [11.5, 0.05, -0.2], [11.8, 0.0, -0.38], [12.2, 0.0, -0.3], [12.6, 0.0, -0.32], [13.3, -0.12, -0.3], [14.5, -0.12, -0.3], [14.65, -0.22, -0.05], [15.4, -0.22, -0.08], [15.55, -0.1, -0.32], [16.0, -0.05, -0.38], [17.5, -0.18, -0.36], [17.75, 0.0, -0.1], [18.12, -0.1, 0], [18.32, -1.3, 0.04], [19.0, -1.3, 0.04], [19.25, -0.28, 0], [T, -0.28, 0]];
  const HZ = 0.55, HW = TAU * 2.4, HWD = HW * Math.sqrt(1 - HZ * HZ), HDT = 0.025;
  const HIMP = Array.from({ length: 22 }, (_, k) => Math.exp(-HZ * HW * k * HDT) * Math.sin(HWD * k * HDT));
  const HSUM = HIMP.reduce((a, b) => a + b, 0), HLAG = HIMP.reduce((a, b, k) => a + b * k * HDT, 0) / HSUM;
  function headAt(t) { let y = 0, p = 0; for (let k = 1; k < HIMP.length; k++) { const v = key(mod(t + HLAG - k * HDT, T), HEAD); y += HIMP[k] * v[0]; p += HIMP[k] * v[1]; } return [y / HSUM, p / HSUM]; }
  function thiefPose(t, tr, J0, places, bodyP) {
    const { M, Bwrist, Bback, Bpocket, Cshoulder, Chand } = places;
    const knee = (side) => [tr.x + (side === 'l' ? 0.13 : -0.13), 0.47, tr.z - 0.24];
    const PK = [0.22, -0.34, -0.03];                   // crouched, the packet in his far hand, low by his knees
    const shhWrist = (J, u) => {                      // under his lips and a little in front: the forefinger then crosses them
      const yaw = headAt(u)[0] + life(1.3, u, 1 - 0.75 * walkK(u), T).headYaw, f = [Math.cos(yaw), 0, -Math.sin(yaw)], H = J.head, C = J.chest;
      return body([H[0] + f[0] * 0.19 - C[0], H[1] - 0.25 - C[1], H[2] + f[2] * 0.19 - C[2]], [0.3, -1, 0.9]);
    };
    // the right hand (far side, towards the counter)
    const r = armTrack(t, J0, [
      [0.78, (J) => grab(J, tr, 'r', GLASS_W(tr, 0.06), [0.2, -1, -0.8]), 0.32],
      [1.12, (J) => body([0.2, 0.035, -0.03], [0.5, -1, -0.9]), 0.3],                                         // to his lips
      [1.95, (J) => grab(J, tr, 'r', GLASS_W(tr, 0.06), [0.2, -1, -0.8]), 0.26],                           // back on the counter
      [2.26, null, 0.3],
      [2.78, () => body([0.12, -0.24, -0.16], [-0.1, -1, -0.6]), 0.26],                                      // a breath in ...
      [3.0, () => body([0.32, 0.2, -0.4], [-0.2, -1, -0.6]), 0.42, 'g'],                                  // ... arms open, forwards and up: an old friend!
      [3.42, (J) => grab(J, tr, 'r', [M[0], M[1] + 0.045 * Math.sin((t - 3.42) * 15) * win(t, 3.45, 3.6, 4.0, 4.25), M[2]], [0.1, -1, -0.6]), 0.24], // the handshake
      [4.3, (J) => grab(J, tr, 'r', Bback(t), [0.3, -0.4, -1]), 0.28],                                      // the hug, his hand round the uncle's far side
      [5.32, (J) => grab(J, tr, 'r', [Bback(t)[0] + 0.12, 1.42, Bback(t)[2] + 0.12], [0, -1, -0.6]), 0.22],   // a pat on the shoulder as he lets go
      [5.62, null, 0.34],
      [6.0, (J) => grab(J, tr, 'r', [TRAY[0] + 0.02, TRAY[1] + 0.12, TRAY[2] + places.dz], [0.3, -1, -0.8]), 0.2],   // a samosa off the plate
      [6.24, () => body([0.24, -0.2, -0.02], [0.2, -1, -0.8]), 0.2],                                        // passed to his other hand
      [6.52, null, 0.3],
      [6.93, (J) => grab(J, tr, 'r', Cshoulder(t), [0.2, -0.6, -1]), 0.19],                                 // steadies the man in pink
      [7.4, () => body([0.2, -0.3, -0.2], [0.2, -1, -0.8]), 0.32, 'g'],                                   // palms up: sorry
      [7.8, null, 0.36],
      [9.22, () => body([0.26, -0.06, -0.075], [0.2, -1, -0.8]), 0.22],                                      // the wallet, open in front of him
      [9.9, () => body([0.3, 0.02, -0.05], [0.2, -1, -0.8]), 0.18],                                         // a note out of it
      [10.3, () => body([0.2, 0.24, -0.1], [0.3, -0.6, -0.8]), 0.26, 'g'],                                  // held up by his face: watch this
      [10.84, (J) => grab(J, tr, 'r', FLICK, [0.2, -0.6, -0.9]), 0.14],                                     // flicked over the counter to the chaiwala
      [11.15, (J) => grab(J, tr, 'r', [STACK[0] + 0.03, STACK[1] + 0.12, STACK[2]], [0.2, -1, -0.8]), 0.17],  // and a packet of biscuits off the stack
      [11.45, () => body([0.27, -0.05, -0.04], [0.2, -1, -0.8]), 0.24],                                     // torn open
      [12.2, () => body([0.14, -0.28, -0.12], [0, -1, -0.6]), 0.34],                                      // carried
      [12.9, () => body(PK, [0.3, -1, -0.8]), 0.4],                                                         // crouched: the packet low, by his knees
      [15.85, (J) => grab(J, tr, 'r', [GROUND[0], GROUND[1] + 0.05, GROUND[2]], [0.3, -0.6, -0.8]), 0.36],  // the whole packet, down between its paws
      [16.35, (J) => grab(J, tr, 'r', knee('r'), [0.3, -1, -0.8]), 0.3],
      [17.4, null, 0.5],
    ], -1);
    // the left hand (near side, towards you)
    const l = armTrack(t, J0, [
      [2.1, () => body([0.12, 0.17, 0.07], [0.2, -1, 0.8]), 0.36],                                            // dabs his moustache
      [2.48, null, 0.38],
      [2.8, () => body([0.12, -0.24, 0.16], [-0.1, -1, 0.6]), 0.26],                                      // a breath in ...
      [3.04, () => body([0.32, 0.2, 0.4], [-0.2, -1, 0.6]), 0.42, 'g'],                                   // ... arms open
      [3.5, (J) => grab(J, tr, 'l', Bwrist(t), [0.3, -1, 0.6]), 0.24],                                      // over the uncle's wrist: the watch
      [4.3, (J) => grab(J, tr, 'l', [Bback(t)[0] + 0.3, 1.46, Bback(t)[2] + 0.05], [0.2, 0.2, 1]), 0.28],   // the hug, over the uncle's shoulder
      [5.3, (J) => grab(J, tr, 'l', Bpocket(t), [0.1, -1, 0.7]), 0.17],                                     // down to the kurta pocket: the wallet
      [5.48, () => body([0.0, -0.44, 0.2], [-0.4, -1, 0.5]), 0.27],                                          // into his own pocket
      [5.78, null, 0.32],
      [6.24, () => body([0.24, -0.2, 0.04], [0.2, -1, 0.8]), 0.2],                                          // takes the samosa
      [6.5, () => body([0.12, -0.36, 0.13], [0, -1, 0.6]), 0.24],                                          // holds it low
      [6.88, (J) => grab(J, tr, 'l', Chand(t), [0.4, -0.6, 0.8]), 0.14],                                     // catches the man in pink's hand: the swap
      [7.14, () => body([0.0, -0.44, 0.2], [-0.4, -1, 0.5]), 0.24],     // the phone straight into his pocket
      [7.42, () => body([0.24, -0.1, 0.3], [0.2, -1, 0.8]), 0.3, 'g'],    // palms up, empty: sorry
      [7.88, null, 0.36],
      [8.98, () => body([0.0, -0.44, 0.2], [-0.4, -1, 0.5]), 0.24],                                         // the uncle's wallet out of his pocket
      [9.22, () => body([0.26, -0.06, 0.075], [0.2, -1, 0.8]), 0.26],
      [10.0, () => body([0.0, -0.44, 0.2], [-0.4, -1, 0.5]), 0.24],                                         // and back in
      [10.28, null, 0.32],
      [11.4, () => body([0.27, -0.05, 0.06], [0.2, -1, 0.8]), 0.38],                                         // tears the packet open
      [12.2, null, 0.34],
      [12.98, () => body([PK[0] + 0.03, PK[1] + 0.03, PK[2] + 0.04], [0.3, -1, 0.8]), 0.3],                // crouched: a biscuit out of the packet
      [13.3, (J) => grab(J, tr, 'l', OFFER, [0.4, -0.7, 0.9]), 0.38],                                       // held out to the stray
      [14.02, (J) => grab(J, tr, 'l', knee('l'), [0.3, -1, 0.8]), 0.3],
      [14.28, () => body([PK[0] + 0.03, PK[1] + 0.03, PK[2] + 0.04], [0.3, -1, 0.8]), 0.2],                 // another
      [14.48, () => body([0.2, 0.035, 0.03], [0.5, -1, 0.9]), 0.24],                                       // one for him
      [14.9, (J) => grab(J, tr, 'l', knee('l'), [0.3, -1, 0.8]), 0.3],
      [16.45, (J, u) => { const p = dogPt(dogHead(dogState(17.2)), -0.012, 0.078); return grab(J, tr, 'l', [p[0], p[1] + 0.014 * Math.sin(TAU * 4.5 * u), p[2] + 0.018 * Math.sin(TAU * 4.5 * u + 1.2)], [0.3, -0.3, 0.9]); }, 0.34],   // a scratch behind its ears
      [17.42, null, 0.5],
      [17.94, (J, u) => shhWrist(J, u), 0.56, 'g'],                                                        // shh
      [19.02, null, 0.42],
    ], 1);
    const arms = {}; if (r) arms.r = r; if (l) arms.l = l;
    // the head: where he looks (with a little drift of his own while he stands), and the face he wears
    const [hy, hp] = headAt(t), lf = bodyP.lf;
    const headYaw = hy + lf.headYaw, headPitch = hp + lf.headPitch;
    const face = {
      smile: k1(t, [[0, 0.2], [2.0, 0.2], [2.3, 0.6], [2.6, 0.25], [3.05, 0.3], [3.3, 1.0], [5.5, 0.9], [5.9, 0.35], [6.0, 0.6], [6.5, 0.5], [6.85, 0.2], [6.95, 0], [7.4, 0], [7.5, 0.45], [7.9, 0.3], [9.3, 0.2], [9.6, 0.5], [10.0, 0.3], [10.4, 0.55], [10.9, 0.55], [11.1, 0.45], [11.5, 0.3], [12.6, 0.3], [13.5, 0.45], [14.0, 0.75], [14.5, 0.6], [14.85, 0.35], [15.4, 0.35], [15.55, 0.05], [15.95, 0.15], [16.3, 0.7], [16.6, 0.95], [17.55, 0.95], [18.15, 0.6], [18.35, 0.55], [19.0, 0.55], [19.4, 0.25], [T, 0.2]]),
      smirk: k1(t, [[0, 0.25], [10.3, 0.25], [10.5, 0.9], [10.85, 0.9], [11.2, 0.25], [13.3, 0.25], [13.6, 0], [18.15, 0], [18.35, 0.5], [19.0, 0.5], [19.4, 0.25], [T, 0.25]]),
      close: Math.max(win(t, 1.4, 1.5, 1.85, 1.95) * 0.85, blink(t, 0.3), win(t, 14.9, 15.0, 15.25, 15.35) * 0.55, win(t, 15.6, 15.68, 15.8, 15.9) * 0.75, win(t, 16.95, 17.08, 17.3, 17.45) * 0.45),
      browY: k1(t, [[0, 0], [3.2, 0], [3.35, 0.05], [5.5, 0.04], [5.8, 0], [6.9, 0], [6.98, 0.07], [7.3, 0.03], [7.5, 0], [9.4, 0], [9.55, 0.06], [9.9, 0.02], [10.1, 0], [15.45, 0], [15.6, 0.05], [16.0, 0.02], [16.3, 0], [T, 0]]),
      browUp: k1(t, [[0, 0], [10.4, 0], [10.55, 0.06], [10.85, 0.06], [11.1, 0], [18.28, 0], [18.42, 0.06], [19.0, 0.06], [19.2, 0], [T, 0]]),
      op: Math.max(win(t, 2.0, 2.06, 2.2, 2.3) * 0.32, win(t, 6.95, 7.0, 7.15, 7.3) * 0.45, win(t, 9.45, 9.55, 9.7, 9.85) * 0.22, t >= 14.85 && t < 15.45 ? 0.16 * Math.max(0, Math.sin(TAU * 3.4 * t)) * win(t, 14.85, 14.9, 15.38, 15.45) : 0, win(t, 17.05, 17.12, 17.3, 17.4) * 0.3),
      wide: Math.max(win(t, 6.95, 7.0, 7.25, 7.4) * 0.6, win(t, 9.45, 9.55, 9.75, 9.9) * 0.4),
      wink: Math.max(win(t, 4.82, 4.9, 5.02, 5.1), win(t, 18.6, 18.66, 18.78, 18.86)),
      look: key(t, [[0, 0.02, 0], [0.9, 0.04, -0.02], [1.4, 0, 0], [4.55, 0, 0], [4.62, 0.03, 0], [5.2, 0.03, 0], [5.4, 0, 0], [10.45, 0, 0], [10.6, 0.03, 0], [10.85, 0.03, 0], [11.0, 0, 0], [18.32, 0, 0], [18.45, 0.03, 0], [19.0, 0.03, 0], [19.2, 0, 0], [T, 0, 0]]),
    };
    return { pose: { arms, headYaw, headPitch, ...bodyP }, face };
  }
  const GLASS_W = (tr, up = 0) => [GLASS[0], GLASS[1] + up, GLASS[2] + (tr.dz || 0)];
  function blink(t, seed) {                          // now and then, not like a clock: once in each 3.5 s, somewhere in it
    const P = 3.5, x = t + seed * 7.3, n = Math.floor(x / P), h = (Math.abs(Math.sin(n * 12.9898 + seed * 78.233)) * 43758.5453) % 1, u = x - n * P - (0.3 + 2.6 * h);
    return u < 0 || u > 0.15 ? 0 : u < 0.07 ? sstep(0, 0.07, u) : 1 - sstep(0.08, 0.15, u);
  }

  // ------------------------------------------------------------------ one frame
  scene({
    name: 'street', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      g.save();
      const cam = camAt(t), tw = t;
      WD.back(g, cam, tw);
      const ks = WD.periods(cam);
      // ---- each period's stall people (and its stray), at their own clock (tau = t + k T: the same moment of every pass)
      const jobs = [];                                  // [depth (X), draw fn]
      for (const k of ks) {
        const tau = t + k * T, dz = k * L;
        if (tau < -6 || tau > T + 8) continue;
        jobs.push(...stallPeople(g, cam, tau, dz, k));
      }
      // the chaiwala first (behind the counter), then the counter, then everyone in front of it, furthest first
      for (const j of jobs.filter((j) => j.behind)) j.fn();
      WD.counter(g, cam, tw, (g2, k, dz) => counterItems(g2, cam, t + k * T, dz));
      // ---- the thief
      const tt = mod(t, T), tr = { x: thiefX(tt), z: thiefZ(t), h: PI, tg: sAt(t) / STR, dz: 0 };
      const bodyP = thiefBody(tt);
      const J0 = R.skel(STY.thief, tr.tg, bodyP);
      const places = interactionPlaces(t, tt);
      const { pose, face } = thiefPose(tt, tr, J0, places, bodyP);
      const W0 = { S: STY.thief, look: LOOK.thief };
      const hold = thiefHold(tt);
      R.shadow(g, cam, W0, t, { tr, pose, a: 0.2 });
      for (const j of jobs.filter((j) => !j.behind && j.shadow)) j.shadow();
      const front = jobs.filter((j) => !j.behind);
      const mode = tt >= 4.3 && tt < 5.4 ? 'hug' : tt >= 6.88 && tt < 7.62 ? 'catch' : null;
      const handPose = thiefHands(tt, hold), overHead = { l: (tt >= 14.42 && tt < 14.98) || (tt >= 18.04 && tt < 19.1) };
      front.push({ x: tr.x, fn: () => { const F = R.figure(g, cam, W0, t, { tr, pose, face, hold: hold.h, holdBehind: hold.b, handPose, overHead, skipArm: mode === 'hug' ? -1 : mode === 'catch' ? 1 : undefined }); probe('thief', F); if (F) for (const o of hold.over) o(g, F); } });
      if (mode === 'hug') front.push({ x: places.Bx - 0.02, fn: () => R.figure(g, cam, W0, t, { tr, pose, face, hold: hold.h, handPose, onlyArm: -1 }) });
      if (mode === 'catch') front.push({ x: places.Cx + 0.02, fn: () => R.figure(g, cam, W0, t, { tr, pose, face, hold: hold.h, handPose, onlyArm: 1 }) });
      // the note in the air, flicked over the counter (it flutters as it goes)
      if (tt >= 10.98 && tt < 11.3) { const u = sstep(10.98, 11.3, tt), P = lerp3(FLICK, CATCH, u); P[1] += 0.14 * Math.sin(PI * u); front.push({ x: P[0], fn: () => { const p = cam.P(P[0], P[1], P[2]); if (p) note(g, p[0], p[1], p[2], -0.4 + 2.2 * u, 0.35 + 0.65 * Math.abs(Math.cos(u * 9))); } }); }
      front.sort((a, b) => a.x - b.x);
      for (const j of front) j.fn();
      WD.awning(g, cam, tw);
      g.restore();
    },
  });

  // ------------------------------------------------------------------ where the others' hands and bodies are, for his hands
  function thiefX(tt) { return k1(tt, [[0, -1.06], [0.45, -1.06], [0.85, -1.16], [2.35, -1.16], [2.8, -1.1], [3.0, -1.12], [4.2, -1.12], [4.45, -1.2], [5.3, -1.2], [5.6, -1.12], [5.9, -1.2], [6.25, -1.24], [6.6, -1.1], [7.95, -1.06], [8.5, -1.25], [10.6, -1.25], [10.85, -1.34], [11.4, -1.34], [11.75, -1.2], [12.65, -1.04], [19.3, -1.04], [19.75, -0.86], [20.9, -0.9], [T, -1.06]]); }
  function bState(tau) {                               // the uncle: where he stands and which way he faces
    const turn = win(tau, 3.05, 3.35, 5.5, 5.8), step = sstep(3.05, 3.4, tau), inn = win(tau, 4.2, 4.42, 5.3, 5.5), back = sstep(5.42, 5.7, tau);
    return { x: lerp(lerp(PB.x, -1.4, step) + 0.08 * inn, -1.56, back), z: lerp(lerp(PB.z, -1.72, step) + 0.24 * inn, -1.66, back), h: lerp(PI / 2, 0.05, turn) };
  }
  function cState(tau) {                               // the man in pink: bumped forward a step at 6.85
    const bump = sstep(6.86, 7.05, tau);
    return { x: PC.x, z: PC.z - 0.06 * bump, h: PI, lean: 0.34 * win(tau, 6.86, 6.96, 7.08, 7.45) };
  }
  function interactionPlaces(t, tt) {
    const bs = bState(tt), cs = cState(tt);
    const M = [lerp(-1.18, -1.2, 0.5), 1.02, lerp(-1.06, bs.z, 0.5)];
    return {
      M, dz: 0, Bx: bs.x, Cx: cs.x,
      Bwrist: (t2) => [M[0] + 0.07, M[1] + 0.02, M[2] - 0.08],
      Bback: (t2) => [bs.x - 0.12, 1.36 + 0.035 * Math.sin(t2 * 18) * win(t2, 4.6, 4.7, 5.1, 5.2), bs.z - 0.2],
      Bpocket: () => [bs.x + 0.2, 0.98, bs.z + 0.02],
      Cshoulder: () => [cs.x - 0.17, 1.42, cs.z + 0.05],
      Chand: () => [cs.x + lerp(0.12, 0.36, ease(6.86, 7.05, tt)), lerp(1.62, 1.3, ease(6.88, 7.1, tt)), cs.z + 0.04],
    };
  }
  function thiefHands(tt, hold) {                    // relax (walking), grip (holding), open (arms wide, a hug, palms up), point (shh)
    const p = { l: hold.h.l ? 'grip' : 'relax', r: hold.h.r ? 'grip' : 'relax' }, inW = (a, b) => tt >= a && tt < b;
    if (inW(2.95, 3.45)) { p.l = 'open'; p.r = 'open'; }
    if (inW(3.42, 4.3)) p.r = 'grip';                 // the handshake
    if (inW(3.5, 3.98)) p.l = 'open';                 // over the uncle's wrist
    if (inW(4.3, 5.32)) p.r = 'open';                 // the hug
    if (inW(0.85, 1.12) || inW(5.95, 6.12) || inW(6.9, 7.4) || inW(10.95, 11.15)) p.r = 'open';
    if (inW(7.4, 7.86)) { p.l = 'open'; p.r = 'open'; }
    if (inW(17.94, 19.05)) p.l = 'point';
    return p;
  }
  // what's in his hands: the glass, the watch, the wallet, the samosa, the phone; the note, the biscuits
  function thiefHold(tt) {
    const h = {}, b = {}, over = [];
    if ((tt >= 1.12 && tt < 1.3) || (tt >= 1.95 && tt < 2.12)) h.r = (g, el, wr) => { const [x, y] = handAt(el, wr, 0.03); WD.glass(g, x, y - 0.03 * wr[2], wr[2] * 0.00052, tt < 1.5 ? 1 : 0); };
    if (tt >= 1.3 && tt < 1.95) over.push((g, F) => {                    // the glass tipped to his lips, his fingers round it
      const [x, y] = handAt(F.P.elR, F.P.wrR, 0.03), s = F.P.wrR[2], tip = sstep(1.3, 1.5, tt) * (1 - sstep(1.8, 1.95, tt)), fill = 1 - sstep(1.5, 1.85, tt);
      g.save(); g.translate(x - 0.01 * s, y - 0.035 * s); g.rotate(-1.05 * tip); WD.glass(g, 0, 0, s * 0.00052, fill);
      gripFingers(g, 0, 0.03 * s, s, 0, LOOK.thief, 3); g.restore();
    });
    if (tt >= 3.98 && tt < 5.62) h.l = (g, el, wr) => { const [x, y] = handAt(el, wr, 0.04); goldGlint(g, x, y, wr[2], 0.9); };
    if (tt >= 5.4 && tt < 5.64) h.l = (g, el, wr) => { const [x, y, a] = handAt(el, wr, 0.05); wallet(g, x, y, wr[2], a + PI / 2); };
    if (tt >= 6.12 && tt < 6.4) h.r = (g, el, wr) => { const [x, y, a] = handAt(el, wr, 0.06); samosa(g, x, y, wr[2], a - PI / 2); };
    if (tt >= 6.4 && tt < 7.1) h.l = (g, el, wr) => { const [x, y, a] = handAt(el, wr, 0.06); samosa(g, x, y, wr[2], a - PI / 2); };
    if (tt >= 7.1 && tt < 7.38) { h.l = (g, el, wr) => { const [x, y, a] = handAt(el, wr, 0.045); phone(g, x, y, wr[2], a + PI / 2); }; b.l = true; }
    if (tt >= 9.12 && tt < 10.22) h.l = (g, el, wr) => { const [x, y, a] = handAt(el, wr, 0.06); wallet(g, x + 0.05 * wr[2], y, wr[2], 0, sstep(9.3, 9.45, tt) * (1 - sstep(9.95, 10.05, tt))); };
    if (tt >= 9.92 && tt < 10.98) h.r = (g, el, wr) => { const [x, y, a] = handAt(el, wr, 0.05); note(g, x, y - 0.02 * wr[2], wr[2], a + PI / 2 + 0.3); };
    if (tt >= 11.3 && tt < 16.18) h.r = (g, el, wr) => { const [x, y, a] = handAt(el, wr, 0.045); packet(g, x, y, wr[2], tt < 12.3 ? a + PI / 2 : 0.2, sstep(11.85, 12.1, tt), 3); };
    if ((tt >= 13.08 && tt < 13.94) || (tt >= 14.38 && tt < 14.88)) h.l = (g, el, wr) => { const [x, y, a] = handAt(el, wr, 0.05); biscuitAt(g, x, y, wr[2], a + 0.4); };
    return { h, b, over };
  }

  // ------------------------------------------------------------------ the stall's people, in one period at its own clock
  function stallPeople(g, cam, tau, dz, k) {
    const out = [];
    // the chaiwala
    {
      const go = win(tau, 10.95, 11.2, 12.95, 13.4);                               // a step along the counter for the note
      const tr = { x: PCW.x, z: PCW.z - 0.26 * go + dz, h: PI / 2, tg: 0.25, y: 0.32 };
      const lf = life(4.1, tau, 1 - 0.7 * win(tau, 5.4, 5.6, 7.0, 7.2));
      const J0 = R.skel(STY.still, tr.tg, { walk: 0, lean: lf.lean, twist: lf.twist, shrug: lf.shrug });
      const hiAt = (u) => win(u, 5.66, 6.0, 6.55, 6.86), hi = hiAt(tau), pour = win(tau, 5.45, 5.75, 6.75, 7.05);
      const count = win(tau, 7.25, 7.45, 8.2, 8.45), up = win(tau, 11.5, 11.72, 12.22, 12.42);
      const RR = [0.3, -0.25, -0.22], RL = [0.32, -0.27, 0.2];
      const r = armTrack(tau, J0, [
        [-20, () => body(RR, [0.2, -1, -0.8]), 0.01],
        [5.4, (J, u) => body([0.32 + 0.05 * hiAt(u), lerp(0.05, 0.68, hiAt(u)), -0.2], [0.2, -1, -0.8]), 0.34],                       // the long pour, the tumbler up high
        [6.95, () => body(RR, [0.2, -1, -0.8]), 0.32],
        [7.25, (J, u) => grab(J, tr, 'r', [TRAY[0] + 0.02, 1.12 + 0.03 * Math.abs(Math.sin(u * 9)), TRAY[2] + dz], [0.3, -1, -0.6]), 0.24],   // counts his samosas
        [8.25, () => body(RR, [0.2, -1, -0.8]), 0.34],
        [11.04, (J) => grab(J, tr, 'r', [CATCH[0], CATCH[1], CATCH[2] + dz], [0.2, -1, -0.8]), 0.22],                              // catches the note
        [11.46, () => body([0.2, 0.62, -0.12], [0.3, -0.2, -1]), 0.36, 'g'],                                                             // holds it up to the light
        [12.36, () => body([0.12, -0.12, 0.02], [0, -1, -0.6]), 0.32],                                                                    // pockets it
        [12.82, () => body(RR, [0.2, -1, -0.8]), 0.36],
      ], -1);
      const l = armTrack(tau, J0, [[-20, () => body(RL, [0.2, -1, 0.8]), 0.01], [5.4, () => body([0.34, -0.2, 0.12], [0.2, -1, 0.8]), 0.32], [6.98, () => body(RL, [0.2, -1, 0.8]), 0.34]], 1);
      const pose = { walk: 0, arms: { r, l }, lean: lf.lean, twist: lf.twist, shrug: lf.shrug, headTilt: lf.headTilt,
        headYaw: lerp(0, -0.3, hi) + 0.5 * count + 0.5 * win(tau, 10.85, 11.0, 11.4, 11.6) + lf.headYaw, headPitch: lerp(0, 0.18, hi) - 0.35 * count + 0.42 * up + lf.headPitch };
      const beam = win(tau, 12.25, 12.4, 13.6, 14.4);
      const face = { look: [0, 0], close: blink(tau, 0.9), wink: 0.8 * up, browTilt: 0.08 * count, smile: Math.max(0.2 * (1 - count), 0.9 * beam), op: 0.25 * win(tau, 11.25, 11.3, 11.45, 11.55), wide: 0.4 * win(tau, 11.25, 11.3, 11.5, 11.6) };
      const W1 = { S: STY.still, look: LOOK.CW };
      const noteN = tau >= 11.28 && tau < 12.62;
      out.push({ behind: true, x: tr.x, fn: () => {
        const hold = pour > 0.01 ? { r: (g2, el, wr) => { const [x, y] = handAt(el, wr, 0.04); tumbler(g2, x, y, wr[2], 0.5 * hi); }, l: (g2, el, wr) => { const [x, y] = handAt(el, wr, 0.04); tumbler(g2, x, y, wr[2]); } }
          : noteN ? { r: (g2, el, wr) => { const [x, y, a] = handAt(el, wr, 0.05); note(g2, x, y - 0.03 * wr[2], wr[2], up > 0.5 ? 0.15 : a + PI / 2); } } : null;
        const handPose = { r: pour > 0.01 || noteN ? 'grip' : 'relax', l: pour > 0.01 ? 'grip' : 'relax' };
        const F = R.figure(g, cam, W1, 0, { tr, pose, face, hold, handPose }); if (k === 0) probe('chaiwala', F);
        if (F && hi > 0.02) {                          // the long pour: a ribbon of chai from the high tumbler to the low one
          const a = handAt(F.P.elR, F.P.wrR, 0.06), b = handAt(F.P.elL, F.P.wrL, 0.02);
          g.save(); g.globalAlpha = hi; g.lineCap = 'round';
          const x0 = a[0] - 0.035 * a[2], y0 = a[1] - 0.02 * a[2], x1 = b[0], y1 = b[1] - 0.05 * b[2];
          g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 - 0.08 * a[2], (y0 + y1) / 2, x1, y1);
          g.strokeStyle = '#b8732e'; g.lineWidth = Math.max(5, 0.032 * a[2]); g.stroke();
          g.strokeStyle = '#e09a4c'; g.lineWidth = Math.max(3, 0.018 * a[2]); g.stroke();
          g.strokeStyle = 'rgba(255,236,200,0.75)'; g.lineWidth = Math.max(1.5, 0.006 * a[2]); g.stroke();
          g.fillStyle = 'rgba(255,240,210,0.7)'; for (let i = 0; i < 4; i++) { const u = mod(tau * 2.2 + i * 0.27, 1), x = lerp(x0, x1, u) - 0.08 * a[2] * 4 * u * (1 - u), y = lerp(y0, y1, u); g.beginPath(); g.arc(x, y, Math.max(1.5, 0.006 * a[2]), 0, TAU); g.fill(); }
          g.restore();
        }
        if (F && up > 0.3) {                           // the low sun through the note he's holding up
          const [x, y] = handAt(F.P.elR, F.P.wrR, 0.05), s2 = F.P.wrR[2]; g.save(); g.globalAlpha = 0.45 * up; g.fillStyle = WD.rg(g, x, y - 0.03 * s2, 0, 0.12 * s2, [0, 'rgba(255,250,215,0.9)'], [1, 'rgba(255,250,215,0)']); g.fillRect(x - 0.12 * s2, y - 0.15 * s2, 0.24 * s2, 0.24 * s2); g.restore();
        }
      } });
    }
    // the lad with the newspaper
    {
      const tr = { x: PA.x, z: PA.z + dz, h: PI / 2, tg: 0.25 };
      const lf = life(2.7, tau, 1);
      const J0 = R.skel(STY.still, tr.tg, { walk: 0, lean: lf.lean, twist: lf.twist, shrug: lf.shrug });
      const read = 1 - ease(2.85, 3.12, tau), look = ease(3.8, 4.05, tau);           // he lowers the paper, sips nothing, and looks into the glass
      const G = [GLASS[0], GLASS[1] + 0.06, GLASS[2] + dz];
      const l = armTrack(tau, J0, [[-20, () => body([0.3, 0.1, 0.25], [0.1, -1, 0.8]), 0.01], [2.85, () => body([0.05, -0.36, 0.17], [-0.2, -1, 0.6]), 0.45]], 1);
      const r = armTrack(tau, J0, [
        [-20, () => body([0.3, 0.1, -0.25], [0.1, -1, -0.8]), 0.01],
        [2.85, () => body([0.18, -0.16, -0.2], [0, -1, -0.6]), 0.2],
        [3.0, (J) => grab(J, tr, 'r', G, [0, -1, -0.8]), 0.24],                                              // picks up his glass
        [3.3, () => body([0.14, 0.13, -0.05], [0.4, -1, -0.8]), 0.3],                                     // to his lips: nothing in it
        [3.78, (J, u) => body([0.26, -0.03 + 0.02 * Math.sin(u * 9) * win(u, 4.3, 4.4, 4.8, 4.9), -0.06], [0.2, -1, -0.8]), 0.28],   // and stares into it
      ], -1);
      const headPitch = k1(tau, [[0, -0.12], [2.85, -0.12], [3.12, 0], [3.38, 0], [3.56, 0.28], [3.75, 0.28], [4.05, -0.42], [5.0, -0.42], [5.3, -0.17], [6.6, -0.17], [6.9, -0.42], [T + 9, -0.42]]) + lf.headPitch;
      const headYaw = k1(tau, [[0, 0], [2.85, 0], [3.1, 0.45], [3.32, 0.45], [3.5, 0.05], [5.0, 0.05], [5.3, 0.55], [5.9, 0.55], [6.2, -0.35], [6.6, -0.35], [6.9, 0.05], [T + 9, 0.05]]) + lf.headYaw;
      const pose = { walk: 0, arms: { l, r }, headPitch, headYaw, lean: lf.lean, twist: lf.twist, shrug: lf.shrug, headTilt: lf.headTilt };
      const face = { look: [0, -0.05 * read], close: blink(tau, 0.4), browY: 0.07 * look, op: 0.24 * look * (1 - ease(4.9, 5.2, tau)), wide: 0.4 * look, smile: 0.25 * read, browTilt: 0.06 * ease(5.0, 5.3, tau) };
      const W1 = { S: STY.still, look: LOOK.A };
      const holdA = tau >= 3.24 ? { r: (g2, el, wr) => { const [x, y] = handAt(el, wr, 0.035), s2 = wr[2], tip = win(tau, 3.4, 3.55, 3.78, 3.92); g2.save(); g2.translate(x, y - 0.03 * s2); g2.rotate(0.9 * tip); WD.glass(g2, 0, 0, s2 * 0.00052, 0); g2.restore(); } } : {};
      const handA = { l: read > 0.5 ? 'grip' : 'relax', r: read > 0.5 || tau >= 3.06 ? 'grip' : 'relax' }, overAh = { r: tau >= 3.24 && tau < 4.0 };
      out.push({ x: PA.x, shadow: () => R.shadow(g, cam, W1, 0, { tr, pose, a: 0.18 }), fn: () => {
        const F = R.figure(g, cam, W1, 0, { tr, pose, face, hold: holdA, handPose: handA, overHead: overAh }); if (k === 0) probe('lad', F);
        if (!F) return;
        {                                              // the paper: open in front of his face, then lowered and folded into his left hand
          const P = (f, u, l2) => { const w3 = F.w3([F.J.chest[0] + f, F.J.chest[1] + u, F.J.chest[2] + l2]); return cam.P(w3[0], w3[1], w3[2]); };
          const open = [P(0.3, 0.42, 0.3), P(0.3, 0.42, -0.3), P(0.3, -0.08, -0.3), P(0.3, -0.08, 0.3)];
          const fold = ease(2.85, 3.2, tau), [hx, hy, ha] = handAt(F.P.elL, F.P.wrL, 0.05), s2 = F.P.wrL[2];
          const ca = Math.cos(ha), sa = Math.sin(ha), q = (a, b) => [hx + ca * a * s2 - sa * b * s2, hy + sa * a * s2 + ca * b * s2];
          const shut = [q(0.2, -0.07), q(0.2, 0.07), q(-0.12, 0.07), q(-0.12, -0.07)];     // folded small, along his hand
          if (open.every(Boolean)) newspaper(g, open.map((p, i) => [lerp(p[0], shut[i][0], fold), lerp(p[1], shut[i][1], fold)]));
        }
      } });
    }
    // the uncle
    {
      const bs = bState(tau);
      const tr = { x: bs.x, z: bs.z + dz, h: bs.h, tg: 0.25 };
      const lf = life(3.3, tau, 1 - win(tau, 3.3, 3.45, 5.3, 5.5));                 // still while he's shaking hands and hugging
      const J0 = R.skel(STY.still, tr.tg, { walk: 0, lean: lf.lean, twist: lf.twist, shrug: lf.shrug });
      const check = win(tau, 2.7, 2.85, 3.0, 3.15), shake = win(tau, 3.35, 3.5, 4.2, 4.35), hug = win(tau, 4.3, 4.5, 5.25, 5.45);
      const stare = ease(5.86, 5.98, tau);                                          // "what time is it?" ... nothing on his wrist
      const M = [-1.19, 1.02 + 0.045 * Math.sin((tau - 3.42) * 15) * win(tau, 3.45, 3.6, 4.0, 4.25), lerp(-1.06, bs.z, 0.5) + dz];
      const RRU = [0.12, -0.32, -0.2], RLU = [0.12, -0.32, 0.2];
      const r = armTrack(tau, J0, [
        [-20, () => body(RRU, [0, -1, -0.6]), 0.01],
        [2.66, () => body([0.28, 0.0, -0.06], [0.3, -1, -0.8]), 0.2],                                       // checks his watch
        [3.0, () => body(RRU, [0, -1, -0.6]), 0.2],
        [3.32, (J) => grab(J, tr, 'r', [M[0] - 0.04, M[1], M[2] - 0.04], [0.2, -1, -0.6]), 0.2],            // the handshake
        [4.28, (J, u) => grab(J, tr, 'r', [-1.1, 1.38 + 0.03 * Math.sin(u * 11) * win(u, 4.3, 4.5, 5.25, 5.45), -0.88 + dz], [0.2, 0.2, -1]), 0.26],   // the hug
        [5.28, (J, u) => body([0.26, 0.02 + 0.03 * Math.sin(u * 3) * ease(5.86, 5.98, u), -0.05], [0.3, -1, -0.8]), 0.44],   // what time is it?
        [8.0, () => body(RRU, [0, -1, -0.6]), 0.45],
      ], -1);
      const l = armTrack(tau, J0, [[-20, () => body(RLU, [0, -1, 0.6]), 0.01], [4.28, () => body([0.15, -0.05, 0.45], [0, -1, 0.8]), 0.26], [5.28, () => body(RLU, [0, -1, 0.6]), 0.34]], 1);
      const headPitch = k1(tau, [[0, 0], [2.7, 0], [2.85, -0.42], [3.0, -0.42], [3.15, 0], [5.58, 0], [5.68, -0.42], [5.74, -0.42], [5.84, -0.18], [5.98, -0.42], [6.5, -0.42], [6.7, 0], [7.0, 0], [7.2, -0.42], [8.0, -0.42], [8.4, 0], [T + 9, 0]]) + lf.headPitch;
      const headYaw = k1(tau, [[0, 0], [3.3, 0], [3.5, 0.08], [4.3, 0.08], [4.5, -0.42], [5.25, -0.42], [5.45, 0], [6.5, 0], [6.75, 0.7], [7.05, 0.7], [7.25, 0], [8.2, 0], [8.6, 0.6], [9.6, 0.6], [10.2, -0.3], [T + 9, -0.3]]) + lf.headYaw;
      const face = { look: [0, 0], close: blink(tau, 0.1), smile: 0.7 * Math.max(shake, hug, win(tau, 5.4, 5.6, 5.9, 6.2) * 0.6), browY: 0.05 * Math.max(shake * 0.8, hug * 0.6) + 0.08 * stare, browTilt: 0.06 * (1 - stare), wide: 0.5 * stare, op: 0.34 * win(tau, 5.88, 5.98, 7.2, 7.6) };
      const W1 = { S: STY.still, look: LOOK.B };
      const pose = { walk: 0, arms: { r, l }, headPitch, headYaw, lean: lf.lean, twist: lf.twist, shrug: lf.shrug, headTilt: lf.headTilt };
      const hasWallet = tau < 5.42;
      out.push({ x: bs.x, shadow: () => R.shadow(g, cam, W1, 0, { tr, pose, a: 0.18 }), fn: () => {
        const F = R.figure(g, cam, W1, 0, { tr, pose, face, watchA: tau < 3.95 ? 1 : 0, handPose: { r: tau >= 3.33 && tau < 4.28 ? 'grip' : tau >= 4.28 && tau < 5.3 ? 'open' : 'relax', l: tau >= 4.28 && tau < 5.3 ? 'open' : 'relax' } }); if (k === 0) probe('uncle', F);
        if (F && hasWallet) {                           // the wallet's top, out of his right kurta pocket
          const w3 = F.w3([F.J.hR[0] + 0.02, F.J.hR[1] - 0.03, F.J.hR[2] - 0.11]), p = cam.P(w3[0], w3[1], w3[2]);
          if (p && Math.cos(F.psi + PI / 2) > -0.2) wallet(g, p[0], p[1], p[2] * 0.9, 0.1);
        }
      } });
    }
    // the man in pink, on the phone
    {
      const cs = cState(tau);
      const tr = { x: cs.x, z: cs.z + dz, h: cs.h, tg: 0.25 };
      const lf = life(5.9, tau, 1 - win(tau, 6.8, 6.9, 7.5, 7.8));
      const J0 = R.skel(STY.still, tr.tg, { walk: 0, lean: cs.lean + lf.lean, twist: lf.twist, shrug: lf.shrug });
      const fly = win(tau, 6.86, 6.95, 7.2, 7.45), look = ease(9.1, 9.35, tau), bite = win(tau, 9.85, 10.0, 10.08, 10.25);
      const talkW = (1 - win(tau, 6.78, 6.9, 7.75, 7.95)) * (1 - ease(9.0, 9.2, tau));   // on the phone (then on the samosa)
      const ear = [0.0, 0.2, 0.15], gest = (u) => [0.28 + 0.05 * Math.sin(u * 2.3), -0.05 + 0.08 * Math.sin(u * 3.1), -0.16 + 0.06 * Math.cos(u * 1.9)];
      const l = armTrack(tau, J0, [
        [-20, () => body(ear, [0.2, -0.3, 1]), 0.01],
        [6.86, (J, u) => grab(J, tr, 'l', [cs.x + lerp(0.12, 0.36, ease(6.86, 7.05, u)), lerp(1.62, 1.3, ease(6.88, 7.1, u)), cs.z + 0.04 + dz], [0, -0.6, 1]), 0.08],   // he stumbles: his phone hand flies out
        [7.46, () => body(ear, [0.2, -0.3, 1]), 0.4],                                                      // the samosa to his ear
        [9.08, (J, u) => body([0.2, 0.12 + 0.05 * win(u, 9.85, 10.0, 10.08, 10.25), 0.06], [0.3, -1, 0.8]), 0.28],   // looks at it; bites it
      ], 1);
      const r = armTrack(tau, J0, [
        [-20, (J, u) => body(gest(u), [0.2, -1, -0.8]), 0.01],
        [6.85, () => body([0.05, 0.12, -0.48], [0, -0.5, -1]), 0.16, 'g'],                                  // flung out for balance
        [7.2, () => body([0.24, 0.0, -0.32], [0.2, -1, -0.8]), 0.18, 'g'],                                  // "it's fine"
        [7.62, (J, u) => body(gest(u), [0.2, -1, -0.8]), 0.34],                                           // talking again
        [9.0, () => body([0.15, -0.3, -0.2], [0, -1, -0.6]), 0.38],
      ], -1);
      const headYaw = k1(tau, [[0, 0], [7.2, 0], [7.35, -0.9], [7.6, -0.9], [7.8, 0], [9.1, 0], [9.3, 0.15], [T + 9, 0.15]]) + lf.headYaw;
      const headPitch = 0.04 * Math.sin(tau * 2.7) * talkW - 0.3 * look * (1 - bite) + lf.headPitch;
      const op = Math.max(talkW * (0.12 + 0.2 * Math.max(0, Math.sin(tau * 13) * Math.sin(tau * 3.7 + 1))), 0.45 * fly, 0.5 * bite, tau > 10.25 ? 0.12 * Math.max(0, Math.sin(tau * 11)) * (1 - ease(11.6, 12, tau)) : 0);
      const face = { look: [0, 0], close: blink(tau, 0.6), op, wide: Math.max(0.6 * fly, 0.5 * look * (1 - ease(10.2, 10.6, tau))), browY: 0.06 * Math.max(fly, look), smile: 0.4 * ease(10.25, 10.45, tau) };
      const W1 = { S: STY.still, look: LOOK.C };
      const pose = { walk: 0, arms: { l, r }, headYaw, headPitch, lean: cs.lean + lf.lean, twist: lf.twist, shrug: lf.shrug, headTilt: lf.headTilt };
      const holdC = { l: (g2, el, wr) => { const [x, y, a] = handAt(el, wr, 0.05), s2 = wr[2]; if (tau < 7.1) phone(g2, x + 0.012 * s2, y - 0.04 * s2, s2, a + PI / 2 + 0.25); else samosa(g2, x + 0.01 * s2, y - 0.03 * s2, s2, a - PI / 2, tau >= 10.0 ? 1 : 0); } };
      const handC = { l: 'grip', r: tau >= 7.2 && tau < 7.7 ? 'open' : 'relax' }, overCh = { l: tau < 6.9 || tau >= 7.62 };
      out.push({ x: cs.x, shadow: () => R.shadow(g, cam, W1, 0, { tr, pose: { walk: 0 }, a: 0.18 }), fn: () => { const F = R.figure(g, cam, W1, 0, { tr, pose, face, hold: holdC, handPose: handC, overHead: overCh }); if (k === 0) probe('pink', F); } });
    }
    // the stray in front of the shutter, and the packet he leaves it
    out.push({ x: DOG.x, fn: () => strayDog(g, cam, tau, dz, () => groundPacket(g, cam, tau, dz)) });
    return out;
  }
  // the things on the counter that change: the lad's glass (until he picks it up), the samosa plate, the biscuits
  function counterItems(g, cam, tau, dz) {
    if (tau < 1.12 || (tau >= 2.12 && tau < 3.24)) { const p = cam.P(GLASS[0], GLASS[1], GLASS[2] + dz); if (p) WD.glass(g, p[0], p[1] - 0.062 * p[2], p[2] * 0.00052, tau < 1.12 ? 1 : 0); }
    trayOfSamosas(g, cam, [TRAY[0], TRAY[1], TRAY[2] + dz], tau < 6.12 ? 6 : 5);
    const n = tau < 11.3 ? 3 : 2;
    for (let i = 0; i < n; i++) { const p = cam.P(STACK[0], STACK[1], STACK[2] + dz); if (p) packet(g, p[0], p[1] - (0.034 + i * 0.062) * p[2], p[2], 0, 0, 0, 0.92); }
  }

  // ------------------------------------------------------------------ the question: on frame 0 and again at the end
  scene({
    name: 'title', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      const a = Math.max(1 - sstep(2.1, 2.5, t), sstep(19.4, 19.8, t));
      if (a < 0.003) return;
      g.save(); g.globalAlpha = a;
      g.fillStyle = lg(g, 0, 160, 0, 620, [0, 'rgba(24,12,10,0.55)'], [0.6, 'rgba(24,12,10,0.3)'], [1, 'rgba(24,12,10,0)']); g.fillRect(0, 160, W, 460);
      const line = (s, y, size, col) => { g.font = `700 condensed ${size}px Bahn`; g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#1a0f0b'; g.lineWidth = size * 0.16; g.strokeText(s, 510, y); g.fillStyle = col; g.fillText(s, 510, y); };
      line('WHAT DID HE TAKE?', 412, 120, '#ffd34a');   // 120 px: at 128 its outline reached x 966, past the safe line at 950 (measured, 18 Nov)
      line('5 THINGS', 505, 74, '#fff6e2');
      g.restore();
    },
  });
  U.grain(0.06);
  C.start();
})();
