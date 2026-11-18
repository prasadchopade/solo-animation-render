// Reel 43 · Guard His Shoes. Tests desk, an episode (4 pm IST). POV: you're the groom's younger brother at a North Indian wedding,
// his gold juttis in your arms at the edge of the mandap's sheet, while five of the bride's sisters and cousins, numbered, try
// a trick every round of the fire. They get the shoes, ask a lakh, come down to ₹21,000, and the price was in their mehendi from
// the start. docs/script.md has the beats; the clock is film/timing.js (place_vo.py sets it from the placed voice).
// The rig is reel 42's (film/rig.js, extended for a wedding); the tent is this reel's own (film/world.js). From reel 42's film.js,
// only what the brief names: life, hermite, springE, grab, bow, move, armTrack, walkK, accLean, headAt and blink (with the small
// easing helpers they stand on), thiefBody/thiefPose as the model for a figure with weight, and the thief as 42 draws him.
// Movement is physics + staging (the user on 42): moves ease with no jolt, gestures overshoot and settle, heads turn on a
// damped spring, and skirts, plaits, dupattas and earrings hang off the body on springs of their own. Our own drawings; nobody
// real. 30 fps. Every frame is a pure function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp } = C;
  const R = window.RIG, WD = window.WORLD, U = window.UI, { sstep, mix, rgba, TAU, PI } = R;
  const T = window.TIMING;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '800 100px Brico', '700 100px Brico', 'italic 600 60px Fraun', '600 60px Fraun'];
  R.setSun([-0.42, 0.85, -0.6]);                       // the tent's lamps: high, in front of the five, a little to your left

  // ------------------------------------------------------------------ reel 42's helpers (named in the brief), and what they stand on
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
  // a person kneeling or standing is never quite still: breath, a slow shift of weight, a look that drifts (reel 42's life)
  function life(seed, t, k = 1, per = 0) {
    const s = (hz, ph) => Math.sin(TAU * ((per ? Math.round(hz * per) / per : hz) * t + ph));
    const b = s(0.26, seed * 0.37), w1 = s(0.09, seed * 0.71), w2 = s(0.14, seed * 0.29 + 0.2), h1 = s(0.19, seed * 0.53), h2 = s(0.31, seed * 0.17 + 0.4);
    return { shrug: 0.009 * b * k, lean: (0.011 * b + 0.015 * w1) * k, twist: 0.04 * w2 * k, headYaw: (0.045 * h1 + 0.02 * h2) * k, headPitch: (0.024 * h2 - 0.014 * b) * k, headTilt: 0.028 * w1 * k };
  }
  // a path through stops: [t, s, v] keys, Hermite between them (reel 42's)
  function hermite(ks) {
    return (t) => {
      let i = 0; while (i < ks.length - 2 && t > ks[i + 1][0]) i++;
      const [t0, s0, v0] = ks[i], [t1, s1, v1] = ks[i + 1], d = t1 - t0, u = clamp((t - t0) / d), u2 = u * u, u3 = u2 * u;
      return [(2 * u3 - 3 * u2 + 1) * s0 + (u3 - 2 * u2 + u) * d * v0 + (-2 * u3 + 3 * u2) * s1 + (u3 - u2) * d * v1,
        ((6 * u2 - 6 * u) * s0 + (3 * u2 - 4 * u + 1) * d * v0 + (-6 * u2 + 6 * u) * s1 + (3 * u2 - 2 * u) * d * v1) / d];
    };
  }
  function local(tr, P) { const sh = Math.sin(tr.h), ch = Math.cos(tr.h), dX = P[0] - tr.x, dZ = P[2] - tr.z; return [dX * sh + dZ * ch, P[1], -dX * ch + dZ * sh]; }
  // the wrist that puts the middle of the hand on P (world), relative to the chest; pole: where the elbow points (reel 42's grab)
  function grab(J0, tr, side, P, pole, w = 1, back = 0.06) {
    const sc = tr.scale || 1, q0 = local(tr, P), q = [q0[0] / sc, (q0[1] - (tr.y || 0)) / sc, q0[2] / sc], sh = side === 'l' ? J0.shL : J0.shR, d = [q[0] - sh[0], q[1] - sh[1], q[2] - sh[2]], n = Math.hypot(...d) || 1;
    return { wrist: [q[0] - d[0] / n * back - J0.chest[0], q[1] - d[1] / n * back - J0.chest[1], q[2] - d[2] / n * back - J0.chest[2]], pole, w };
  }
  const body = (wr, pole, w = 1) => ({ wrist: wr, pole, w });
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
    let st = null; for (let j = 0; j < i; j++) st = move(st, keys[j], keys[j + 1][0], J0, side, ease0);
    return move(st, keys[i], t, J0, side, ease0);
  }
  // reel 42's walkK and accLean, given the walker's own path (s(t), its speed): how much of the walk is in the body, and the lean
  // of a body that speeds up or stops (a damped spring on its acceleration)
  function walkK(t, path, v0 = 0.5) { let s = 0, Wt = 0; for (let k = 0; k < 12; k++) { const tau = k * 0.04, w = Math.exp(-tau / 0.13); s += w * clamp(Math.abs(path(t - tau)[1]) / v0); Wt += w; } return s / Wt; }
  const AZ = 0.42, AW = TAU * 1.5, AWD = AW * Math.sqrt(1 - AZ * AZ), ADT = 0.03;
  const AIMP = Array.from({ length: 34 }, (_, k) => Math.exp(-AZ * AW * k * ADT) * Math.sin(AWD * k * ADT)), ASUM = AIMP.reduce((a, b) => a + b, 0);
  function accLean(t, path) { const acc = (u) => (path(u + 0.02)[1] - path(u - 0.02)[1]) / 0.04; let x = 0; for (let k = 1; k < AIMP.length; k++) x += AIMP[k] * -acc(t - k * ADT); return 0.055 * x / ASUM; }
  // a head follows its keyed looks as a head does: a quick turn overshoots a touch and settles (reel 42's headAt, given the keys)
  const HZ = 0.55, HW = TAU * 2.4, HWD = HW * Math.sqrt(1 - HZ * HZ), HDT = 0.025;
  const HIMP = Array.from({ length: 22 }, (_, k) => Math.exp(-HZ * HW * k * HDT) * Math.sin(HWD * k * HDT));
  const HSUM = HIMP.reduce((a, b) => a + b, 0), HLAG = HIMP.reduce((a, b, k) => a + b * k * HDT, 0) / HSUM;
  function headAt(t, KS) { const n = KS[0].length - 1, out = new Array(n).fill(0); for (let k = 1; k < HIMP.length; k++) { const v = key(t + HLAG - k * HDT, KS); for (let j = 0; j < n; j++) out[j] += HIMP[k] * v[j]; } return out.map((v) => v / HSUM); }
  function blink(t, seed) {                          // now and then, not like a clock: once in each 3.5 s, somewhere in it
    const P = 3.5, x = t + seed * 7.3, n = Math.floor(x / P), h = (Math.abs(Math.sin(n * 12.9898 + seed * 78.233)) * 43758.5453) % 1, u = x - n * P - (0.3 + 2.6 * h);
    return u < 0 || u > 0.15 ? 0 : u < 0.07 ? sstep(0, 0.07, u) : 1 - sstep(0.08, 0.15, u);
  }
  // ------------------------------------------------------------------ springs for what hangs off a body (this reel's physics)
  // A damped spring's displacement behind a moving point: the convolution of the point's own acceleration with the spring's
  // impulse response, so it is a pure function of t (cloth, a plait, an earring)
  function lagOf(sig, t, hz = 1.6, z = 0.25, n = 36, dt = 1 / 36) {
    const w = TAU * hz, wd = w * Math.sqrt(1 - z * z); let y = 0;
    for (let k = 1; k <= n; k++) { const tau = k * dt, h = Math.exp(-z * w * tau) * Math.sin(wd * tau); y += h * (sig(t - tau + dt) - 2 * sig(t - tau) + sig(t - tau - dt)) / (dt * dt); }
    return -y * dt / wd;
  }
  const shotT = (t, a) => t - a;

  // ------------------------------------------------------------------ the cast (everyone new, designed for this reel)
  // Skins share one range and nobody is darker than the season's thief; no saffron or green in anyone's clothes; red is the
  // bride's alone. Five lehengas, five silhouettes: a plait over her left shoulder (1), open waves (2), a plait over her right
  // shoulder and a rose (3), a high ponytail and her dupatta knotted round her waist like someone about to run (4), two plaits
  // with ribbons (5, about twelve).
  const LK = (o) => ({ headK: 0.16, handK: 0.062, style: 'fem', fem: true, sleeve: 'short', henna: true, kajal: true, lash: true, brow: 0.055, browTilt: -0.02, jawW: 0.86, jawH: 1.04, ew: 0.255, eh: 0.15, noseK: 0.45, leg: '#2a2a2a', shoe: '#2a2a2a', sole: '#555555', ...o });
  const SIS = [
    { n: 1, seed: 1.1, col: '#2f4fd6', look: LK({ skin: '#c98f63', skinD: '#9c6440', skinH: '#e2ab82', hair: '#16100c', braid: 1, tassel: '#f0479a', tikka: '#c8243a', jhumka: true, lip: '#b0283f', bindi: '#9e1b32', shirt: '#2f4fd6', trim: '#f2c84b', skirt: { col: '#2f4fd6', border: '#e9b53c', hem: 0.44 }, dupatta: { style: 'sash', col: '#f0479a' }, bangles: ['#f0479a', '#f2c84b', '#2f4fd6', '#f2c84b', '#f0479a'] }) },
    { n: 2, seed: 2.3, col: '#df2f86', look: LK({ skin: '#c0855a', skinD: '#935c3a', skinH: '#daa276', hair: '#24160f', style: 'fem', waves: true, jhumka: '#df2f86', lip: '#c2185b', bindi: '#2a1a40', shirt: '#df2f86', trim: '#f2c84b', skirt: { col: '#df2f86', border: '#efc04a', hem: 0.44 }, dupatta: { style: 'sash', col: '#f2c14e', border: '#fff0b0' }, bangles: ['#f2c14e', '#df2f86', '#f2c14e', '#ffffff'] }) },
    { n: 3, seed: 3.7, col: '#7b3fd2', look: LK({ skin: '#cf9a70', skinD: '#a06c48', skinH: '#e6b48a', hair: '#140e0a', braid: -1, tassel: '#f2c84b', rose: { col: '#d8263c', side: 1 }, tikka: '#2f4fd6', lip: '#9c2a4a', bindi: '#7b3fd2', shirt: '#7b3fd2', trim: '#f2c84b', skirt: { col: '#7b3fd2', border: '#e9b53c', hem: 0.44 }, dupatta: { style: 'sash', col: '#efe7da', border: '#e9b53c' }, bangles: ['#7b3fd2', '#f2c84b', '#7b3fd2', '#f2c84b'] }) },
    { n: 4, seed: 4.9, col: '#2ba3e8', look: LK({ skin: '#c08658', skinD: '#915c3a', skinH: '#d8a074', hair: '#130d09', pony: '#ff8fc2', jhumka: true, lip: '#c0504d', bindi: '#c8243a', shirt: '#2ba3e8', trim: '#f2c84b', skirt: { col: '#2ba3e8', border: '#f0c24a', hem: 0.42 }, dupatta: { style: 'waist', col: '#ff8fc2' }, bangles: ['#ff8fc2', '#ffffff', '#ff8fc2'] }) },
    { n: 5, seed: 5.3, col: '#f7bb24', kid: true, look: LK({ headK: 0.158, jawW: 0.92, jawH: 0.98, ew: 0.27, eh: 0.165, lash: false, skin: '#cb9164', skinD: '#9a6242', skinH: '#e2ac80', hair: '#120c08', style: 'kid', plaits: true, ribbon: '#d8263c', kajal: false, lip: '#a65a50', blush: true, brow: 0.05, shirt: '#f7bb24', trim: '#df2f86', skirt: { col: '#f7bb24', border: '#df2f86', inner: '#b8283f', hem: 0.36 }, bangles: ['#df2f86', '#2f4fd6'] }) },
  ];
  const GROOM = { headK: 0.155, handK: 0.058, ew: 0.245, eh: 0.14, noseK: 0.7, bare: true, skin: '#c08a5e', skinD: '#8e5c3c', skinH: '#d29e78', hair: '#16100c', style: 'short', must: 0.06, brow: 0.075, safa: { col: '#e5487f', band: '#f2c84b', stone: '#c8243a' }, sherwani: true, kurta: true, sleeve: 'long', shirt: '#f3e4c2', leg: '#f6eedc', shoe: '#c08a62', sole: '#d4a07a', dupatta: { style: 'stole', col: '#c8243a' } };
  const BRIDE = LK({ headK: 0.15, skin: '#c4906a', skinD: '#986848', skinH: '#dcaa86', hair: '#140e0a', veil: { col: '#c8102e', border: '#f2c84b' }, tikka: '#c8102e', jhumka: true, lip: '#a8102e', bindi: '#a8102e', shirt: '#c8102e', trim: '#f2c84b', skirt: { col: '#c8102e', border: '#f2c84b', hem: 0.5 }, bangles: ['#c8102e', '#f8f0e0', '#c8102e', '#f8f0e0', '#c8102e', '#f2c84b'] });
  const PANDIT = { headK: 0.15, handK: 0.056, skin: '#b88358', skinD: '#8c5a38', skinH: '#d09c74', hair: '#8e8a84', style: 'part', must: 0.1, brow: 0.07, kurta: true, sleeve: 'long', shirt: '#efe2a4', skirt: { col: '#f7f2e8', border: '#e9c46a', hem: 0.5 }, leg: '#f7f2e8', shoe: '#b88358', sole: '#c99a72' };
  const YOU = { headK: 0.15, handK: 0.058, skin: '#b98256', skinD: '#8e5a38', skinH: '#d29c74', hair: '#120c08', style: 'short', brow: 0.075, kurta: true, sherwani: false, sleeve: 'long', shirt: '#24346a', skirt: { col: '#f4efe4', border: '#f4efe4', hem: 0.46, band: 0.001 }, leg: '#f4efe4', shoe: '#b98256', sole: '#c99a72' };
  // the season's thief, as reel 42 draws him (its LOOK.thief)
  const THIEF = { headK: 0.15, handK: 0.058, skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', style: 'short', cap: true, must: 0.07, stub: 0.55, mole: [0.44, -0.48], brow: 0.08, browTilt: 0.03, shirt: '#37a18a', leg: '#20262f', shoe: '#141414', sole: '#d8d0c0' };
  const GUESTS = [
    { x: -4.4, z: 8.7, seed: 7.1, look: { headK: 0.15, handK: 0.056, skin: '#b27f58', skinD: '#87583a', skinH: '#cc9a74', hair: '#d8d2c8', style: 'part', must: 0.11, brow: 0.07, kurta: true, sleeve: 'long', shirt: '#f4f0e8', leg: '#f4f0e8', shoe: '#5a3a24', sole: '#8a6a50' } },
    { x: -3.5, z: 9.2, seed: 8.3, look: LK({ headK: 0.15, skin: '#bd885f', skinD: '#906040', skinH: '#d6a47e', hair: '#3a3430', kajal: false, lip: '#9a3a40', bindi: '#9e1b32', shirt: '#9a2f8f', skirt: { col: '#9a2f8f', border: '#e9b53c', hem: 0.4 }, dupatta: { style: 'sash', col: '#9a2f8f', border: '#e9b53c' }, bangles: ['#f2c84b', '#f2c84b'] }) },
    { x: 1.3, z: 9.4, seed: 9.7, phone: true, look: { headK: 0.15, handK: 0.056, skin: '#b5805a', skinD: '#8a5a3a', skinH: '#ce9a74', hair: '#16100c', style: 'part', brow: 0.075, kurta: true, sleeve: 'long', shirt: '#9fb3c8', leg: '#eae2d2', shoe: '#3a2a20', sole: '#6a5a48' } },
    { x: -1.4, z: 9.5, seed: 6.2, look: LK({ headK: 0.15, skin: '#c18c64', skinD: '#956242', skinH: '#d8a680', hair: '#16100c', lip: '#b03a50', shirt: '#e8a2c0', skirt: { col: '#e8a2c0', border: '#efc04a', hem: 0.4 }, dupatta: { style: 'sash', col: '#ffffff' } }) },
  ];
  const STY = {
    still: R.style({ stride: 0.5, cad: 1 }),
    walk: R.style({ stride: 1.0, cad: 1, arm: 0.2, chestYaw: 0.08, lean: 0.03, headStab: 0.9, nod: 0.008, stepH: 0.03 }),   // round the fire, unhurried
    girl: R.style({ stride: 1.05, cad: 1, arm: 0.5, armLag: 0.08, elbow: 0.3, elbowDyn: 0.5, chestYaw: 0.2, pelYaw: 0.14, pelRoll: 0.07, sway: 0.03, lean: 0.07, leanOsc: 0.02, headStab: 0.6, nod: 0.02, dip: 0.02 }),
  };
  const FIG = [];                                      // each sister's figure, as last drawn this frame (for her number)

  // ------------------------------------------------------------------ the camera: your eyes, sitting at the sheet's edge
  const EYE = [0, 0.8, 0];
  function povCam(t, o = {}) {
    const br = Math.sin(TAU * 0.24 * t + 0.4), sw = 0.005 * Math.sin(TAU * 0.11 * t + 1.1) + 0.003 * Math.sin(TAU * 0.29 * t);
    return R.camera({ x: (o.x ?? EYE[0]) + (o.dx || 0), y: (o.y ?? EYE[1]) + 0.004 * br + (o.dy || 0), z: (o.z ?? EYE[2]) + (o.dz || 0), yaw: (o.yaw || 0) + sw * (o.still ? 0.3 : 1), pitch: (o.pitch ?? -0.1) + 0.003 * br + (o.dp || 0), roll: (o.roll || 0) + 0.003 * Math.sin(TAU * 0.13 * t), f: o.f ?? 1050 });
  }
  const faceTo = (x, z, cx = 0, cz = 0) => Math.atan2(cx - x, cz - z);

  // ------------------------------------------------------------------ the couple, round the fire
  // seven rounds, finished as the seventh bud opens; they are on the west side (the fire beside them) when the groom looks back
  const RAD = 0.9, RKEYS = [[-1, 0.0], [2.8, 0.69], [11.0, 2.0], [T.bloom7, 7]], RND_P = (T.bloom7 - 2.8) / 6.31;
  const roundsAt = (t) => clamp(t < -1 ? 0 : k1(Math.min(t, T.bloom7), RKEYS), 0, 7);
  const coupleSpeed = (t) => [roundsAt(t), (roundsAt(t + 0.02) - roundsAt(t - 0.02)) / 0.04];
  function coupleTr(t, who) {                          // who 0 the bride (a step ahead), 1 the groom
    const n = roundsAt(t), th = TAU * n + (who === 0 ? 0.55 : 0), [fx, , fz] = WD.FIRE;
    return { x: fx + RAD * Math.sin(th), z: fz + RAD * Math.cos(th), h: th + PI / 2, tg: RAD * TAU * n / STY.walk.stride + (who ? 0.5 : 0) };
  }

  // ------------------------------------------------------------------ props
  // one jutti, side on: the heel at the origin, the toe along +x, L long, up is -y; its toe curls up and back over itself
  function jutti(g, L, k = 0, tw = 0) {
    const gold = mix('#f2c24e', '#7a4a10', k), goldL = mix('#fff1b0', '#a87a30', k), goldD = mix('#9a6414', '#3a2206', k);
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    // the inside, seen from above through the low opening: the shadowed lining, a pale insole
    g.fillStyle = mix('#5a3410', '#1a0e04', k); g.beginPath(); g.moveTo(0.05 * L, -0.175 * L); g.quadraticCurveTo(0.25 * L, -0.235 * L, 0.46 * L, -0.215 * L); g.quadraticCurveTo(0.3 * L, -0.14 * L, 0.06 * L, -0.15 * L); g.closePath(); g.fill();
    g.fillStyle = mix('#e8c890', '#4a3010', k); g.beginPath(); g.moveTo(0.09 * L, -0.172 * L); g.quadraticCurveTo(0.25 * L, -0.215 * L, 0.42 * L, -0.205 * L); g.quadraticCurveTo(0.28 * L, -0.165 * L, 0.1 * L, -0.16 * L); g.closePath(); g.fill();
    // the sole: a dark leather edge, thicker at the heel
    g.fillStyle = mix('#4e2c12', '#1a0e04', k);
    g.beginPath(); g.moveTo(-0.01 * L, -0.03 * L); g.quadraticCurveTo(-0.005 * L, 0.035 * L, 0.1 * L, 0.04 * L); g.lineTo(0.8 * L, 0.035 * L); g.quadraticCurveTo(0.97 * L, 0.025 * L, 1.04 * L, -0.08 * L); g.lineTo(1.01 * L, -0.085 * L); g.quadraticCurveTo(0.93 * L, 0.0, 0.8 * L, 0.0); g.lineTo(0.1 * L, 0.0); g.closePath(); g.fill();
    // the upper
    const up = () => { g.beginPath(); g.moveTo(0.0, -0.005 * L); g.quadraticCurveTo(-0.02 * L, -0.11 * L, 0.035 * L, -0.185 * L); g.quadraticCurveTo(0.2 * L, -0.15 * L, 0.36 * L, -0.15 * L); g.quadraticCurveTo(0.43 * L, -0.15 * L, 0.48 * L, -0.235 * L);
      g.quadraticCurveTo(0.68 * L, -0.27 * L, 0.88 * L, -0.17 * L); g.quadraticCurveTo(0.98 * L, -0.12 * L, 1.03 * L, -0.105 * L); g.lineTo(1.0 * L, -0.05 * L); g.quadraticCurveTo(0.92 * L, -0.002 * L, 0.8 * L, -0.002 * L); g.lineTo(0.1 * L, -0.002 * L); g.closePath(); };
    up(); const q = g.createLinearGradient(0, -0.27 * L, 0, 0); q.addColorStop(0, goldL); q.addColorStop(0.45, gold); q.addColorStop(1, goldD); g.fillStyle = q; g.fill();
    g.strokeStyle = mix('#6a3a0c', '#200e02', k); g.lineWidth = Math.max(1, 0.008 * L); g.stroke();
    // the curled toe: a tongue up from the tip and back over itself, with a little tassel
    g.fillStyle = gold; g.beginPath(); g.moveTo(1.0 * L, -0.09 * L); g.quadraticCurveTo(1.09 * L, -0.12 * L, 1.07 * L, -0.22 * L); g.quadraticCurveTo(1.05 * L, -0.3 * L, 0.985 * L, -0.28 * L); g.quadraticCurveTo(0.95 * L, -0.26 * L, 0.985 * L, -0.235 * L); g.quadraticCurveTo(1.02 * L, -0.215 * L, 1.02 * L, -0.17 * L); g.quadraticCurveTo(1.01 * L, -0.13 * L, 0.97 * L, -0.115 * L); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = mix('#c8243a', '#3a0a10', k); g.beginPath(); g.arc(0.975 * L, -0.255 * L, 0.018 * L, 0, TAU); g.fill();
    // the embroidery: maroon piping round the opening, a paisley on the vamp, rows of tiny sequins that catch the light
    g.strokeStyle = mix('#8a1a2a', '#2a0608', k); g.lineWidth = Math.max(1, 0.014 * L);
    g.beginPath(); g.moveTo(0.035 * L, -0.18 * L); g.quadraticCurveTo(0.2 * L, -0.145 * L, 0.36 * L, -0.145 * L); g.quadraticCurveTo(0.43 * L, -0.145 * L, 0.48 * L, -0.228 * L); g.stroke();
    g.save(); up(); g.clip();
    const rosette = (cx, cy, r, col) => {             // a flower in zari: five petals, a gold heart
      g.fillStyle = col; for (let i = 0; i < 5; i++) { const an = i / 5 * TAU - PI / 2; g.beginPath(); g.ellipse(cx + Math.cos(an) * r * 0.55, cy + Math.sin(an) * r * 0.55, r * 0.5, r * 0.3, an, 0, TAU); g.fill(); }
      g.fillStyle = goldL; g.beginPath(); g.arc(cx, cy, r * 0.3, 0, TAU); g.fill(); g.fillStyle = mix('#c8243a', '#3a0810', k); g.beginPath(); g.arc(cx, cy, r * 0.14, 0, TAU); g.fill();
    };
    rosette(0.7 * L, -0.15 * L, 0.06 * L, mix('#a8203a', '#3a0810', k));
    for (const [x, y] of [[0.57, -0.13], [0.83, -0.115], [0.62, -0.06], [0.79, -0.05]]) rosette(x * L, y * L, 0.028 * L, mix('#c8243a', '#3a0810', k));
    g.strokeStyle = mix('#a8203a', '#3a0810', k); g.lineWidth = Math.max(1, 0.01 * L); g.beginPath(); g.moveTo(0.08 * L, -0.06 * L); g.quadraticCurveTo(0.3 * L, -0.08 * L, 0.5 * L, -0.06 * L); g.stroke();
    g.beginPath(); g.moveTo(0.1 * L, -0.025 * L); g.lineTo(0.9 * L, -0.02 * L); g.stroke();
    for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) {
      const x = (0.1 + i * 0.05 + j * 0.025) * L, y = (-0.035 - j * 0.045) * L - (i > 6 ? 0.03 * L : 0), tw0 = 0.5 + 0.5 * Math.sin(TAU * 0.9 * tw + i * 1.7 + j * 2.3 + L * 0.01);
      g.fillStyle = `rgba(255,252,235,${(0.35 + 0.6 * tw0 * tw0 * tw0).toFixed(3)})`; g.beginPath(); g.arc(x, y, Math.max(0.7, 0.008 * L), 0, TAU); g.fill();
    }
    const hl = g.createLinearGradient(0, -0.27 * L, 0, -0.1 * L); hl.addColorStop(0, 'rgba(255,255,240,0.35)'); hl.addColorStop(1, 'rgba(255,255,240,0)'); g.fillStyle = hl; g.fillRect(0.45 * L, -0.3 * L, 0.5 * L, 0.2 * L);
    g.restore();
    g.restore();
  }
  function pair(g, x, y, L, ang, tw, sep = 1) {        // the two of them, the far one a touch behind and up
    g.save(); g.translate(x, y); g.rotate(ang);
    g.save(); g.translate(0.08 * L * sep, -0.1 * L * sep); g.rotate(-0.04 * sep); jutti(g, L, 0.28, tw + 3); g.restore();
    jutti(g, L, 0, tw);
    g.restore();
  }
  // your arms (POV): navy kurta sleeves with gold at the cuffs, a hand round each end of his juttis, held to your chest.
  // A: { x, y, rot, s, sq (a squeeze), elb (-1..1: the elbows' clap), open (0..1: you let go), shoes (are they there),
  //      drop (0..1: they fall into your lap) }
  const NAVY = '#26366e', NAVYD = '#141c3c', CUFF = '#e3b23c', MYSKIN = '#c08a5e', MYSKIND = '#93603c';
  const rotAbout = (p, c, a) => [c[0] + (p[0] - c[0]) * Math.cos(a) - (p[1] - c[1]) * Math.sin(a), c[1] + (p[0] - c[0]) * Math.sin(a) + (p[1] - c[1]) * Math.cos(a)];
  function forearm(g, e, w, wE, wW) {                  // elbow to wrist: a sleeve that tapers, its gold cuff
    const dx = w[0] - e[0], dy = w[1] - e[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const P = (u, k) => [e[0] + dx * u + nx * k * lerp(wE, wW, u), e[1] + dy * u + ny * k * lerp(wE, wW, u)];
    g.beginPath(); g.moveTo(...P(0, -1)); g.quadraticCurveTo(...P(0.5, -1.07), ...P(1, -1)); g.lineTo(...P(1, 1)); g.quadraticCurveTo(...P(0.5, 1.05), ...P(0, 1)); g.closePath();
    const q = g.createLinearGradient(...P(0.5, -1), ...P(0.5, 1)); q.addColorStop(0, mix(NAVY, '#ffffff', 0.18)); q.addColorStop(0.5, NAVY); q.addColorStop(1, NAVYD); g.fillStyle = q; g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 3; g.lineCap = 'round';
    for (const u of [0.35, 0.6]) { g.beginPath(); g.moveTo(...P(u, -0.75)); g.quadraticCurveTo(...P(u + 0.05, -0.1), ...P(u - 0.02, 0.5)); g.stroke(); }   // creases
    g.beginPath(); g.moveTo(...P(0.86, -1.02)); g.lineTo(...P(1.0, -1.0)); g.lineTo(...P(1.0, 1.0)); g.lineTo(...P(0.86, 1.02)); g.closePath(); g.fillStyle = CUFF; g.fill();
    g.strokeStyle = '#a87a1c'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#fff2c0'; for (let i = -2; i <= 2; i++) { const p = P(0.93, i * 0.38); g.beginPath(); g.arc(p[0], p[1], 3.6, 0, TAU); g.fill(); }
    return { ux, uy, nx, ny, P, L };
  }
  function myHand(g, w, ang, s, grip = 1, side = 1) {  // the back of your hand from above, its fingers over the edge of what it holds
    g.save(); g.translate(w[0], w[1]); g.rotate(ang); g.lineCap = 'round'; g.lineJoin = 'round';
    const sk = (k) => mix(MYSKIN, MYSKIND, k), edge = 'rgba(80,40,20,0.55)';
    g.beginPath(); g.moveTo(-0.05 * s, -0.42 * s); g.quadraticCurveTo(0.5 * s, -0.56 * s, 0.98 * s, -0.42 * s); g.quadraticCurveTo(1.08 * s, 0, 0.98 * s, 0.44 * s); g.quadraticCurveTo(0.5 * s, 0.56 * s, -0.05 * s, 0.4 * s); g.closePath();
    const q = g.createLinearGradient(0, -0.5 * s, 0, 0.5 * s); q.addColorStop(0, sk(0.0)); q.addColorStop(1, sk(0.35)); g.fillStyle = q; g.fill(); g.strokeStyle = edge; g.lineWidth = 0.035 * s; g.stroke();
    for (let i = 0; i < 4; i++) {                       // four fingers: out from the knuckles, then over the edge and out of sight
      const y = (-0.33 + i * 0.22) * s, len = (0.62 - Math.abs(i - 1.3) * 0.08) * s * (0.55 + 0.45 * (1 - grip)), x0 = 0.95 * s, bend = side * 0.22 * grip;
      const x1 = x0 + len * Math.cos(bend), y1 = y + len * Math.sin(bend);
      g.strokeStyle = edge; g.lineWidth = 0.25 * s; g.beginPath(); g.moveTo(x0 - 0.05 * s, y); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = sk(0.12 + 0.05 * i); g.lineWidth = 0.2 * s; g.stroke();
      g.fillStyle = sk(0.0); g.beginPath(); g.arc(x0, y, 0.11 * s, 0, TAU); g.fill();                 // a knuckle
      g.strokeStyle = 'rgba(90,45,25,0.35)'; g.lineWidth = 0.02 * s; g.beginPath(); const mx = lerp(x0, x1, 0.55), my = lerp(y, y1, 0.55); g.moveTo(mx - 0.03 * s, my - 0.07 * s); g.lineTo(mx + 0.03 * s, my + 0.07 * s); g.stroke();
      if (grip < 0.6) { g.fillStyle = mix(MYSKIN, '#ffe6d6', 0.5); g.beginPath(); g.ellipse(x1 - 0.04 * s, y1, 0.07 * s, 0.06 * s, 0, 0, TAU); g.fill(); }   // a nail, once the hand opens
    }
    g.strokeStyle = edge; g.lineWidth = 0.27 * s; g.beginPath(); g.moveTo(0.2 * s, -0.4 * s * side); g.quadraticCurveTo(0.45 * s, -0.68 * s * side, 0.75 * s, -0.66 * s * side); g.stroke();   // the thumb, along the near side
    g.strokeStyle = sk(0.2); g.lineWidth = 0.22 * s; g.stroke();
    g.restore();
  }
  function povArms(g, A, t) {
    const ox = A.x ?? 540, oy = A.y ?? 1300, s = A.s ?? 1, sq = A.sq || 0, elb = A.elb || 0, op = A.open || 0;
    g.save(); g.translate(ox, oy); g.rotate(A.rot || 0); g.scale(s, s);
    if (A.shoes !== false) { const dr = A.drop || 0; g.save(); g.translate(0, 950 * dr * dr); g.rotate(0.7 * dr); pair(g, -305 + 10 * sq, 70, 600 * (1 - 0.02 * sq), -0.12, t); g.restore(); }
    let wL = [-270 + 24 * sq, 150], eL = [-600, 640], wR = [262 - 24 * sq, 118], eR = [590, 640];
    eL = rotAbout(eL, wL, 0.32 * elb); eR = rotAbout(eR, wR, -0.32 * elb);           // the elbows' clap: they swing in and out
    if (op > 0) { wL = [wL[0] - 170 * op, wL[1] + 230 * op]; wR = [wR[0] + 170 * op, wR[1] + 230 * op]; }
    const aL = forearm(g, eL, wL, 82, 64), aR = forearm(g, eR, wR, 84, 66);
    myHand(g, aL.P(1, 0), Math.atan2(aL.uy, aL.ux) - 0.35 + 0.5 * op, 100, 1 - op, 1);
    myHand(g, aR.P(1, 0), Math.atan2(aR.uy, aR.ux) + 0.35 - 0.5 * op, 102, 1 - op, -1);
    g.restore();
  }

  // a sister's hand in close-up: the palm towards you (k 1) or its back (k -1), turning between; fingers up along ang; the
  // mehendi on it (a medallion in the palm with the price inside, vines, dyed fingertips; on the back, a lighter vine)
  const HEN = '#8a3412', HENL = '#b8561e';
  function palm(g, x, y, r, ang, o = {}) {
    const k = o.k ?? 1, th = o.thumb ?? 1, sk = o.skin || '#c08a62', skD = o.skinD || '#956240', wig = o.wig, kk = Math.max(0.12, Math.abs(k)), face = k >= 0;
    g.save(); g.translate(x, y); g.rotate(ang + PI / 2); g.scale(kk, 1);           // local: fingers up (-y), the palm's width along x
    const sd = (face ? th : -th);                     // which side the thumb is on, seen from where you are
    const shade = (a) => mix(sk, skD, a);
    // fingers: index on the thumb's side; each curls in turn when they wiggle (a curl towards you shortens it)
    const F = [[0.62, 1.32, 0.33], [0.2, 1.48, 0.35], [-0.22, 1.38, 0.34], [-0.6, 1.08, 0.3]];
    const tips = [];
    F.forEach(([fx, fl, fw], i) => {
      const cu = wig != null ? Math.max(0, Math.sin(wig * TAU - i * 0.95)) ** 2 : (o.curl || 0);
      const len = fl * r * (1 - 0.42 * cu), bx = fx * r * sd, by = -1.42 * r, spread = (o.spread ?? 0.08) * (i - 1.5) * sd;
      const ex = bx + Math.sin(spread) * len, ey = by - Math.cos(spread) * len;
      g.lineCap = 'round'; g.strokeStyle = shade(0.45); g.lineWidth = fw * r + 2; g.beginPath(); g.moveTo(bx, by + 0.1 * r); g.lineTo(ex, ey); g.stroke();
      g.strokeStyle = shade(0.08 + 0.04 * i); g.lineWidth = fw * r; g.stroke();
      tips.push([bx, by, ex, ey, fw * r, len]);
      if (face) {                                     // creases at the joints, the dyed tip
        g.strokeStyle = 'rgba(90,40,20,0.3)'; g.lineWidth = Math.max(1, 0.02 * r);
        for (const u of [0.36, 0.66]) { const px = lerp(bx, ex, u), py = lerp(by, ey, u); g.beginPath(); g.moveTo(px - fw * r * 0.35, py); g.lineTo(px + fw * r * 0.35, py); g.stroke(); }
        g.strokeStyle = HEN; g.lineWidth = fw * r * 0.96; g.beginPath(); g.moveTo(lerp(bx, ex, 0.72), lerp(by, ey, 0.72)); g.lineTo(ex, ey); g.stroke();
        g.strokeStyle = HENL; g.lineWidth = Math.max(1, 0.03 * r); for (const u of [0.42, 0.55]) { const px = lerp(bx, ex, u), py = lerp(by, ey, u); g.beginPath(); g.moveTo(px - fw * r * 0.4, py); g.quadraticCurveTo(px, py - 0.05 * r, px + fw * r * 0.4, py); g.stroke(); }
      } else {                                        // nails
        g.fillStyle = mix(sk, '#ffe8e0', 0.45); g.beginPath(); g.ellipse(lerp(bx, ex, 0.88), lerp(by, ey, 0.88), fw * r * 0.3, fw * r * 0.22, 0, 0, TAU); g.fill();
      }
    });
    // the palm (or the back of the hand)
    g.beginPath(); g.moveTo(-0.78 * r * sd, -1.45 * r); g.quadraticCurveTo(-0.95 * r * sd, -0.5 * r, -0.62 * r * sd, 0.35 * r); g.lineTo(0.55 * r * sd, 0.38 * r); g.quadraticCurveTo(0.98 * r * sd, -0.4 * r, 0.82 * r * sd, -1.45 * r); g.quadraticCurveTo(0.0, -1.62 * r, -0.78 * r * sd, -1.45 * r); g.closePath();
    const q = g.createLinearGradient(-r, 0, r, 0); q.addColorStop(0, shade(face ? 0.05 : 0.25)); q.addColorStop(1, shade(face ? 0.3 : 0.45)); g.fillStyle = q; g.fill();
    g.strokeStyle = shade(0.55); g.lineWidth = Math.max(1, 0.03 * r); g.stroke();
    // the thumb, from the heel of the hand, out to its side
    const tb = [0.72 * r * sd, -0.35 * r], tt = [1.28 * r * sd, -1.1 * r + (wig != null ? 0.12 * r * Math.sin(wig * TAU + 1) : 0)];
    g.strokeStyle = shade(0.5); g.lineWidth = 0.42 * r + 2; g.beginPath(); g.moveTo(...tb); g.quadraticCurveTo(1.15 * r * sd, -0.45 * r, ...tt); g.stroke();
    g.strokeStyle = shade(0.15); g.lineWidth = 0.42 * r; g.stroke();
    if (face) { g.strokeStyle = HEN; g.lineWidth = 0.4 * r; g.beginPath(); g.moveTo(lerp(tb[0], tt[0], 0.75), lerp(tb[1], tt[1], 0.75)); g.lineTo(...tt); g.stroke(); }
    if (face && r > 18) {
      // palm lines, then the mehendi: a medallion in the middle with the price inside it, petals, dots, a vine to the wrist
      g.strokeStyle = 'rgba(110,50,25,0.28)'; g.lineWidth = Math.max(1, 0.02 * r);
      g.beginPath(); g.moveTo(-0.7 * r * sd, -1.0 * r); g.quadraticCurveTo(0, -0.75 * r, 0.75 * r * sd, -1.05 * r); g.stroke();
      g.beginPath(); g.moveTo(0.55 * r * sd, -1.2 * r); g.quadraticCurveTo(0.2 * r * sd, -0.4 * r, 0.45 * r * sd, 0.2 * r); g.stroke();
      const mc = [0, -0.62 * r], mr = 0.52 * r, pl = o.plain || 0, hen = mix(HEN, '#4a1404', 0.6 * pl);
      g.globalAlpha = 1 - 0.55 * pl;
      g.strokeStyle = HENL; g.lineWidth = Math.max(1, 0.028 * r);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.ellipse(mc[0] + Math.cos(a) * mr * 1.18, mc[1] + Math.sin(a) * mr * 1.18, 0.16 * r, 0.07 * r, a, 0, TAU); g.stroke(); }
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.fillStyle = HEN; g.beginPath(); g.arc(mc[0] + Math.cos(a) * mr * 1.42, mc[1] + Math.sin(a) * mr * 1.42, Math.max(0.8, 0.025 * r), 0, TAU); g.fill(); }
      g.strokeStyle = HEN; g.lineWidth = Math.max(1, 0.03 * r); g.beginPath(); g.moveTo(0, -0.62 * r + mr * 1.5); for (let i = 0; i < 6; i++) { const yy = -0.62 * r + mr * 1.5 + i * 0.12 * r; g.quadraticCurveTo((i % 2 ? 0.12 : -0.12) * r, yy + 0.06 * r, 0, yy + 0.12 * r); } g.stroke();
      g.globalAlpha = 1;
      g.strokeStyle = hen; g.lineWidth = Math.max(1, 0.04 * r); g.beginPath(); g.arc(mc[0], mc[1], mr, 0, TAU); g.stroke();
      g.lineWidth = Math.max(1, 0.018 * r); g.beginPath(); g.arc(mc[0], mc[1], mr * 0.86, 0, TAU); g.stroke();
      if (o.text) {                                   // the price, written into it in henna (it reads the right way up for you)
        g.save(); g.translate(mc[0], mc[1]); g.scale(1 / kk, 1); g.rotate(-(ang + PI / 2)); g.scale(kk, 1);
        g.fillStyle = hen; g.font = `italic 600 ${Math.round(0.33 * r)}px Fraun`; g.textAlign = 'center'; g.textBaseline = 'middle';
        if (pl > 0.01) { g.shadowColor = `rgba(255,214,140,${(0.9 * pl).toFixed(3)})`; g.shadowBlur = 0.25 * r * pl; }
        g.fillText(o.text, 0, 0.02 * r); g.shadowBlur = 0;
        g.restore();
      }
    } else if (!face && r > 18) {                     // the back: a lighter vine down the middle finger and a band at the wrist
      g.strokeStyle = HENL; g.globalAlpha = 0.85; g.lineWidth = Math.max(1, 0.025 * r);
      g.beginPath(); g.moveTo(0.2 * r * sd, -2.6 * r); for (let i = 0; i < 8; i++) { const yy = -2.6 * r + i * 0.3 * r; g.quadraticCurveTo((0.2 + (i % 2 ? 0.12 : -0.12)) * r * sd, yy + 0.15 * r, 0.2 * r * sd * (1 - i / 9), yy + 0.3 * r); } g.stroke();
      for (let i = 0; i < 5; i++) { const yy = -0.9 * r + i * 0.18 * r; g.beginPath(); g.arc(0.05 * r * sd, yy, 0.06 * r, 0, TAU); g.stroke(); }
      g.beginPath(); g.moveTo(-0.6 * r * sd, 0.2 * r); g.quadraticCurveTo(0, 0.32 * r, 0.55 * r * sd, 0.22 * r); g.stroke();
      g.globalAlpha = 1;
    }
    g.restore();
  }
  // the rig's hook for a hand the film draws itself (o.bigHand): the palm at the wrist, fingers bent up from the forearm
  const bigHandOf = (s, o) => (g, el, wr) => {
    let ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]); let d = (o.up ?? -PI / 2) - ang; while (d > PI) d -= TAU; while (d < -PI) d += TAU; ang += d * (o.bend ?? 0.8);
    const r = s.look.handK * wr[2] * 0.72;
    palm(g, wr[0] + Math.cos(ang) * r * 0.25, wr[1] + Math.sin(ang) * r * 0.25, r, ang, { skin: s.look.skin, skinD: s.look.skinD, ...o });
  };

  // a jalebi: an orange spiral, glossy with syrup, held at its top between finger and thumb
  function jalebi(g, x, y, s, rot, bite = 0) {
    g.save(); g.translate(x, y); g.rotate(rot); g.lineCap = 'round';
    const pts = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU * 2.6, r = s * (0.08 + 0.36 * i / 80); pts.push([Math.cos(a) * r, Math.sin(a) * r + s * 0.5]); }
    const n = Math.round(pts.length * (1 - 0.28 * bite));
    const draw = (w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); for (let i = 0; i < n; i++) (i ? g.lineTo(...pts[i]) : g.moveTo(...pts[i])); g.stroke(); };
    draw(s * 0.13, '#b8520c'); draw(s * 0.1, '#f08a1c'); draw(s * 0.035, 'rgba(255,240,180,0.75)');
    if (bite > 0.5) { const e = pts[n - 1]; g.fillStyle = '#f7c45a'; g.beginPath(); g.arc(e[0], e[1], s * 0.05, 0, TAU); g.fill(); }
    g.restore();
  }
  // a phone held out: its screen, a call coming in from MUMMY
  function phone(g, x, y, s, rot, o = {}) {
    g.save(); g.translate(x, y); g.rotate(rot); const w = 0.46 * s, h = 0.94 * s;
    g.fillStyle = '#1b1d24'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 0.07 * s); g.fill();
    if (o.back) {                                     // its back: a camera and a flash
      g.fillStyle = '#2c2f3a'; g.beginPath(); g.roundRect(-w / 2 + 0.03 * s, -h / 2 + 0.03 * s, w - 0.06 * s, h - 0.06 * s, 0.06 * s); g.fill();
      g.fillStyle = '#0c0d10'; g.beginPath(); g.roundRect(-w / 2 + 0.06 * s, -h / 2 + 0.06 * s, 0.17 * s, 0.26 * s, 0.05 * s); g.fill();
      g.fillStyle = o.flash ? '#ffffff' : '#d8d0b0'; g.beginPath(); g.arc(-w / 2 + 0.29 * s, -h / 2 + 0.11 * s, 0.03 * s, 0, TAU); g.fill();
      g.restore(); return;
    }
    const sc = g.createLinearGradient(0, -h / 2, 0, h / 2); sc.addColorStop(0, o.flash ? '#ffffff' : '#3c4f8f'); sc.addColorStop(1, o.flash ? '#fffbe8' : '#1c2340');
    g.fillStyle = sc; g.beginPath(); g.roundRect(-w / 2 + 0.025 * s, -h / 2 + 0.025 * s, w - 0.05 * s, h - 0.05 * s, 0.06 * s); g.fill();
    if (!o.flash) {
      const ring = 0.5 + 0.5 * Math.sin(TAU * 1.6 * (o.t || 0));
      g.fillStyle = `rgba(255,255,255,${(0.08 + 0.12 * ring).toFixed(3)})`; g.beginPath(); g.arc(0, -0.17 * s, 0.13 * s + 0.03 * s * ring, 0, TAU); g.fill();
      g.fillStyle = '#f2a0c0'; g.beginPath(); g.arc(0, -0.17 * s, 0.1 * s, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); const hx = 0, hy = -0.175 * s, hs = 0.055 * s;   // a heart
      g.moveTo(hx, hy + hs * 0.9); g.bezierCurveTo(hx - hs * 1.4, hy, hx - hs * 0.7, hy - hs * 1.1, hx, hy - hs * 0.35); g.bezierCurveTo(hx + hs * 0.7, hy - hs * 1.1, hx + hs * 1.4, hy, hx, hy + hs * 0.9); g.fill();
      g.fillStyle = '#ffffff'; g.font = `700 condensed ${Math.round(0.14 * s)}px Bahn`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MUMMY', 0, 0.03 * s);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = `700 condensed ${Math.round(0.06 * s)}px Bahn`; g.fillText('CALLING', 0, 0.11 * s);
      g.fillStyle = '#e8384a'; g.beginPath(); g.arc(-0.11 * s, 0.31 * s, 0.05 * s, 0, TAU); g.fill();
      g.fillStyle = '#4a8ef0'; g.beginPath(); g.arc(0.11 * s, 0.31 * s, 0.05 * s, 0, TAU); g.fill();
    }
    g.restore();
  }
  // the card they write the price on: lines of amounts, each crossed out in turn as they come down; the last one circled
  function card(g, x, y, s, rot, C2) {
    g.save(); g.translate(x, y); g.rotate(rot); const w = 1.0 * s, h = 0.72 * s;
    g.fillStyle = 'rgba(40,20,10,0.25)'; g.beginPath(); g.roundRect(-w / 2 + 0.02 * s, -h / 2 + 0.03 * s, w, h, 0.04 * s); g.fill();
    g.fillStyle = '#fbf7ee'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 0.04 * s); g.fill();
    g.strokeStyle = '#e3b23c'; g.lineWidth = Math.max(1, 0.012 * s); g.beginPath(); g.roundRect(-w / 2 + 0.03 * s, -h / 2 + 0.03 * s, w - 0.06 * s, h - 0.06 * s, 0.03 * s); g.stroke();
    const lines = C2.lines || [];
    const n = lines.length, lh = n > 1 ? h * 0.78 / n : h * 0.5;
    lines.forEach((Ln, i) => {
      const yy = n > 1 ? -h / 2 + h * 0.11 + lh * (i + 0.5) : 0, big = i === n - 1, size = (n > 1 ? lh * (big ? 0.82 : 0.62) : 0.3 * s);
      g.save(); g.font = `800 ${Math.round(size)}px Brico`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = g.measureText(Ln.text).width, wr = Ln.write ?? 1;
      g.beginPath(); g.rect(-tw / 2 - 4, yy - size, (tw + 8) * wr, size * 2); g.clip();
      g.fillStyle = Ln.dim ? 'rgba(30,24,20,0.45)' : '#1e1814'; g.fillText(Ln.text, 0, yy + size * 0.04);
      g.restore();
      if (Ln.cross > 0) { g.strokeStyle = '#c8243a'; g.lineWidth = Math.max(2, size * 0.1); g.lineCap = 'round'; g.beginPath(); g.moveTo(-tw / 2 - 6, yy + size * 0.05); g.lineTo(-tw / 2 - 6 + (tw + 12) * Ln.cross, yy - size * 0.05); g.stroke(); }
      if (Ln.ring > 0) { g.strokeStyle = '#c8243a'; g.lineWidth = Math.max(2, size * 0.07); g.beginPath(); g.ellipse(0, yy, tw * 0.62, size * 0.66, -0.05, -PI / 2, -PI / 2 + TAU * Ln.ring); g.stroke(); }
    });
    g.restore();
  }
  // money: plain notes in a fan (no real banknote's design), and the shagun envelope
  function notes(g, x, y, s, rot, n = 5, spread = 0.12) {
    g.save(); g.translate(x, y); g.rotate(rot);
    for (let i = 0; i < n; i++) { g.save(); g.rotate((i - (n - 1) / 2) * spread); g.fillStyle = i % 2 ? '#b9b0c8' : '#aaa2bc'; g.beginPath(); g.roundRect(-0.07 * s, -0.42 * s, 0.14 * s, 0.42 * s, 0.01 * s); g.fill(); g.strokeStyle = 'rgba(60,50,80,0.4)'; g.lineWidth = 1; g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(0, -0.3 * s, 0.035 * s, 0, TAU); g.stroke(); g.restore(); }
    g.restore();
  }
  function envelope(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); const w = 0.5 * s, h = 0.26 * s;
    g.fillStyle = '#f8f0e0'; g.fillRect(-w / 2, -h / 2, w, h); g.strokeStyle = '#c8243a'; g.lineWidth = Math.max(1, 0.02 * s); g.strokeRect(-w / 2 + 0.02 * s, -h / 2 + 0.02 * s, w - 0.04 * s, h - 0.04 * s);
    g.fillStyle = '#e3b23c'; g.beginPath(); g.arc(0, 0, 0.05 * s, 0, TAU); g.fill();
    g.restore();
  }
  // a chai glass for the man by the gate
  const glassHold = (g, el, wr) => { const u = wr[2], ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]), x = wr[0] + Math.cos(ang) * 0.03 * u, y = wr[1] + Math.sin(ang) * 0.03 * u - 0.05 * u; g.fillStyle = 'rgba(230,240,245,0.85)'; g.fillRect(x - 0.025 * u, y - 0.05 * u, 0.05 * u, 0.1 * u); g.fillStyle = '#c77a36'; g.fillRect(x - 0.022 * u, y - 0.015 * u, 0.044 * u, 0.06 * u); };

  // ------------------------------------------------------------------ the HUD: the title, the numbers, the rounds, the ring
  function title(g, text, y, a, size = 120, col = '#ffffff') {
    if (a <= 0.001) return;
    g.save(); g.globalAlpha = a; g.font = `700 condensed ${size}px Bahn`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.lineJoin = 'round'; g.lineWidth = size * 0.16; g.strokeStyle = 'rgba(40,12,30,0.55)'; g.strokeText(text, 515, y);
    g.fillStyle = col; g.fillText(text, 515, y); g.restore();
  }
  function badge(g, x, y, n, col, a = 1, s = 1) {
    if (a <= 0.001) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(30,10,20,0.35)'; g.beginPath(); g.arc(2, 3, 27, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 27, 0, TAU); g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#1e1814'; g.font = '700 condensed 40px Bahn'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 0, 2); g.restore();
  }
  function badges(g, a, o = {}) {
    for (let i = 0; i < 5; i++) {
      const F = FIG[i]; if (!F || (o.only != null && o.only !== i)) continue;
      const hx = F.P.head[0], hy = Math.max(F.P.head[1] - F.headR * 1.42 - 34, 300);
      let hid = false; for (let j = 0; j < 5; j++) { const Q = FIG[j]; if (j === i || !Q || Q.P.head[3] > F.P.head[3]) continue; if (Math.hypot(Q.P.head[0] - hx, Q.P.head[1] - hy) < Q.headR * 1.25) hid = true; }   // behind a nearer face: leave it off
      if (!hid) badge(g, hx, hy, i + 1, SIS[i].col, a * (o.k ? o.k[i] : 1), o.s || 1);
    }
  }
  const BLOOMS = ['bloom1', 'bloom2', 'bloom3', 'bloom4', 'bloom5', 'bloom6', 'bloom7'];
  function buds(g, t, a = 1) {                         // seven marigold buds on a thread across the top: one opens each round
    if (a <= 0.001) return; g.save(); g.globalAlpha = a;
    const x0 = 230, x1 = 800, y = 430;
    g.strokeStyle = 'rgba(255,240,210,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 - 40, y - 14); g.quadraticCurveTo(515, y + 22, x1 + 40, y - 14); g.stroke();
    for (let i = 0; i < 7; i++) {
      const u = i / 6, x = lerp(x0, x1, u), yy = y - 14 + 36 * u * (1 - u) * 2 * 0.5 + 14, tb = T[BLOOMS[i]], p = springE((t - tb) / 0.42);
      g.save(); g.translate(x, yy + 18);
      g.strokeStyle = 'rgba(255,240,210,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -18); g.lineTo(0, -4); g.stroke();
      if (p <= 0.001) {                               // a closed bud
        g.fillStyle = '#c98a1c'; g.beginPath(); g.ellipse(0, 6, 9, 12, 0, 0, TAU); g.fill(); g.fillStyle = '#f2b52a'; g.beginPath(); g.ellipse(0, 9, 6.5, 8, 0, 0, TAU); g.fill();
      } else {                                        // open: a marigold, its petals in rings
        const r = 24 * p;
        for (let k = 0; k < 3; k++) { const rr = r * (1 - k * 0.28); g.fillStyle = ['#d8680e', '#f08a1c', '#f7b52a'][k]; for (let j = 0; j < 10; j++) { const an = j / 10 * TAU + k * 0.3 + (1 - p) * 1.2; g.beginPath(); g.ellipse(Math.cos(an) * rr * 0.55, 8 + Math.sin(an) * rr * 0.55, rr * 0.42, rr * 0.3, an, 0, TAU); g.fill(); } }
        g.fillStyle = '#ffe07a'; g.beginPath(); g.arc(0, 8, r * 0.22, 0, TAU); g.fill();
        if (t - tb < 0.5) { g.strokeStyle = `rgba(255,236,170,${(0.8 * (1 - (t - tb) / 0.5)).toFixed(3)})`; g.lineWidth = 3; g.beginPath(); g.arc(0, 8, r * (1 + 1.4 * (t - tb)), 0, TAU); g.stroke(); }
      }
      g.restore();
    }
    g.restore();
  }
  function ringOut(g, cx, cy, r, u, a = 1) {            // the pick's ring: it runs out round them
    if (a <= 0.001) return; g.save(); g.globalAlpha = a;
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
    g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, r, -PI / 2, -PI / 2 + TAU * (1 - clamp(u))); g.stroke();
    g.restore();
  }

  // ------------------------------------------------------------------ the world layer: the tent, the mandap, the couple and the
  // pandit at the fire, the guests, the gate and the man by it; drawn into its own canvas and laid down soft
  function coupleJobs(g, cam, t, jobs, o = {}) {
    const brT = coupleTr(t, 0), grT = coupleTr(t, 1), wk = clamp(walkK(t, coupleSpeed, 0.11)), lfb = life(9.1, t, 0.6), lfg = life(9.7, t, 0.6);
    const lookBack = o.lookBack || 0, after = ease(T.bloom7 - 0.1, T.bloom7 + 0.7, t);
    const psiG = Math.atan2(cam.x - grT.x, cam.z - grT.z) - grT.h;
    let pg = psiG; while (pg > PI) pg -= TAU; while (pg < -PI) pg += TAU;
    const gHead = lookBack * pg * 0.85 + after * pg * 0.8, gTwist = (lookBack * 0.35 + after * 0.4) * Math.sign(pg);
    const grPose = { walk: wk, lean: 0.02 + lfg.lean, twist: gTwist + lfg.twist, headYaw: gHead + lfg.headYaw, headPitch: 0.04 + lfg.headPitch, headTilt: lfg.headTilt, arms: { r: body([0.22, -0.3, -0.12], [0, -1, -0.6], 0.6) } };
    const brPose = { walk: wk, lean: 0.03 + lfb.lean, twist: lfb.twist, headYaw: lfb.headYaw - 0.1, headPitch: 0.16 + lfb.headPitch, headTilt: lfb.headTilt, arms: { l: body([0.2, -0.28, 0.1], [0, -1, 0.6], 0.7), r: body([0.22, -0.26, -0.08], [0, -1, -0.6], 0.7) } };
    const dB = cam.toCam(brT.x, 1, brT.z)[2], dG = cam.toCam(grT.x, 1, grT.z)[2];
    let FB = null, FG = null;
    jobs.push({ d: dB, fn: () => { FB = R.figure(g, cam, { S: STY.walk, look: BRIDE }, t, { tr: brT, pose: brPose, face: { smile: 0.25, lid: 0.35, close: blink(t, 0.7) }, hemLag: [0.06 * wk, 0] }); } });
    jobs.push({ d: dG, fn: () => { FG = R.figure(g, cam, { S: STY.walk, look: GROOM }, t, { tr: grT, pose: grPose, face: { smile: 0.2 - 0.25 * (o.worry || 0), browY: 0.03 * (o.worry || 0), close: blink(t, 1.9), look: [0, -0.02 * (o.worry || 0)] }, handPose: { l: o.point ? 'point' : 'relax', r: 'relax' } }); } });
    // the knot that ties them (gathbandhan): the end of her dupatta to his stole
    jobs.push({ d: Math.min(dB, dG) - 0.01, fn: () => {
      if (!FB || !FG || after > 0.98) return; const a = FG.P.pel, b = FB.P.shL[3] < FB.P.shR[3] ? FB.P.shL : FB.P.shR, s = (a[2] + b[2]) / 2;
      g.strokeStyle = '#c8243a'; g.lineWidth = Math.max(1.5, 0.05 * s); g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 0.25 * s, b[0], b[1]); g.stroke();
      g.strokeStyle = '#f2c84b'; g.lineWidth = Math.max(1, 0.012 * s); g.stroke();
    } });
  }
  function panditJob(g, cam, t, jobs) {
    const [fx, , fz] = WD.FIRE, tr = { x: fx - 0.2, z: fz + 1.3, h: PI + 0.15, tg: 0, y: WD.PH }, lf = life(12.3, t, 0.8);
    const off = (t % 3.4) / 3.4, reach = win(off, 0.55, 0.68, 0.78, 0.92);   // now and then, an offering into the fire
    const pose = { walk: 0, sink: 0.5, sit: 0.1, lean: 0.12 + 0.12 * reach + lf.lean, twist: lf.twist, headYaw: lf.headYaw, headPitch: 0.2 + lf.headPitch, arms: { r: body([0.25 + 0.2 * reach, -0.2 - 0.05 * reach, -0.1], [0, -1, -0.6]), l: body([0.18, -0.32, 0.12], [0, -1, 0.6]) } };
    jobs.push({ d: cam.toCam(tr.x, 1, tr.z)[2], fn: () => R.figure(g, cam, { S: STY.still, look: PANDIT }, t, { tr, pose, kneel: 1, face: { op: 0.12 + 0.12 * Math.max(0, Math.sin(TAU * 3.1 * t)), lid: 0.5, smile: 0.1 }, rim: 0.4 }) });
  }
  function guestJob(g, cam, t, G, jobs) {
    const tr = { x: G.x, z: G.z, h: faceTo(G.x, G.z, WD.M[0], WD.M[2]), tg: 0 }, lf = life(G.seed, t, 1);
    const arms = G.phone ? { r: body([0.3, 0.12, -0.05], [0, -0.5, -1]), l: body([0.3, 0.1, 0.05], [0, -0.5, 1]) } : undefined;
    jobs.push({ d: cam.toCam(G.x, 1, G.z)[2], fn: () => R.figure(g, cam, { S: STY.still, look: G.look }, t, { tr, pose: { walk: 0, lean: lf.lean, twist: lf.twist, headYaw: lf.headYaw, headPitch: lf.headPitch, arms }, face: { smile: 0.4, close: blink(t, G.seed) }, held: G.phone ? { side: -1, a: 1 } : null, rim: 0.3 }) });
  }
  function thiefJob(g, cam, t, jobs) {
    if (t < T.wide - 0.3) return;
    const x = WD.CHAI[0] + 0.85, z = WD.CHAI[2] - 0.12, tr = { x, z, h: faceTo(x, z, -0.6, 0.2), tg: 0 }, lf = life(1.3, t, 1);
    const sip = win(t, T.sip - 0.35, T.sip - 0.05, T.sip + 0.55, T.sip + 0.95), raise = win(t, T.glass - 0.2, T.glass + 0.25, T.glass + 1.1, T.glass + 1.6);
    const wr = [lerp(lerp(0.22, 0.12, sip), 0.34, raise), lerp(lerp(-0.12, 0.2, sip), 0.32, raise), lerp(-0.12, -0.04, sip)];
    const pose = { walk: 0, lean: lf.lean, twist: lf.twist - 0.1, headYaw: lf.headYaw, headPitch: lf.headPitch - 0.05 * raise + 0.08 * sip, arms: { r: body(wr, [0.1, -1, -0.6]) } };
    jobs.push({ d: cam.toCam(x, 1, z)[2], fn: () => R.figure(g, cam, { S: STY.still, look: THIEF }, t, { tr, pose, face: { smile: 0.3 + 0.4 * raise, smirk: 0.4, close: Math.max(blink(t, 0.3), 0.5 * sip) }, hold: { r: glassHold }, handPose: { r: 'grip' }, rim: 0.5 }) });
  }
  function world(gb, cam, t, o = {}) {
    gb.setTransform(1, 0, 0, 1, 0, 0); gb.clearRect(0, 0, W, H);
    gb.save();
    WD.floor(gb, cam); WD.walls(gb, cam, t); WD.gate(gb, cam, t); WD.chai(gb, cam, t);
    const back = [];
    if (o.thief !== false) thiefJob(gb, cam, t, back);
    for (const G of GUESTS) guestJob(gb, cam, t, G, back);
    back.sort((a, b) => b.d - a.d); for (const j of back) j.fn();
    WD.platform(gb, cam); WD.canopy(gb, cam, t, 'back');
    for (const p of WD.PILLARS.slice(2)) WD.pillar(gb, cam, p[0], p[1], t, p[0] * 3);
    const jobs = [];
    if (o.couple !== false) coupleJobs(gb, cam, t, jobs, o);
    panditJob(gb, cam, t, jobs);
    jobs.push({ d: cam.toCam(WD.FIRE[0], 0.4, WD.FIRE[2])[2], fn: () => WD.fire(gb, cam, t) });
    jobs.sort((a, b) => b.d - a.d); for (const j of jobs) j.fn();
    for (const p of WD.PILLARS.slice(0, 2)) WD.pillar(gb, cam, p[0], p[1], t, p[0] * 3);
    WD.canopy(gb, cam, t, 'front');
    if (o.extra) o.extra(gb, cam);
    gb.restore();
  }

  // ------------------------------------------------------------------ the five: one as a draw job, from her state over time
  // st(t) → { x, z, h?, y?, walk?, tg?, sink, lean, twist, shrug, headYaw, headPitch, headTilt, kneel, flare, arms(J0, tr),
  //            face, hands, wiggle, thumb, bigHand, hold, holdBehind, life }
  const KNEEL = { sink: 0.44, sit: 0.06 };
  const restArms = () => ({ l: body([0.14, -0.42, 0.13], [0.1, -1, 0.7]), r: body([0.14, -0.42, -0.13], [0.1, -1, -0.7]) });
  function sisJob(g, cam, i, t, stf, extra = {}) {
    const s = SIS[i], st = stf(t), sc = s.kid ? 0.8 : 0.95;
    const tr = { x: st.x, z: st.z, h: st.h ?? faceTo(st.x, st.z, cam.x, cam.z), tg: st.tg || 0, scale: sc, y: st.y || 0 };
    const lf = life(s.seed, t, st.life ?? 1);
    const pose = { walk: st.walk || 0, dyn: st.walk || 0, sink: st.sink ?? (s.kid ? 0.4 : KNEEL.sink), sit: st.sit ?? KNEEL.sit, lean: (st.lean ?? 0.2) + lf.lean, twist: (st.twist || 0) + lf.twist, shrug: (st.shrug || 0) + lf.shrug, headYaw: (st.headYaw || 0) + lf.headYaw, headPitch: (st.headPitch ?? 0.12) + lf.headPitch, headTilt: (st.headTilt || 0) + lf.headTilt };
    const J0 = R.skel(st.walk ? STY.girl : STY.still, tr.tg, pose);
    pose.arms = st.arms ? st.arms(J0, tr) : restArms();
    // what hangs off her: her skirt's hem lags her travel; the plait, the waves and the jhumkas swing as her head turns and leans
    const hx = lagOf((u) => stf(u).x, t, 1.1, 0.3), hz = lagOf((u) => stf(u).z, t, 1.1, 0.3), sh = Math.sin(tr.h), ch = Math.cos(tr.h);
    const hemLag = [clamp(hx * sh + hz * ch, -0.25, 0.25), clamp(-hx * ch + hz * sh, -0.25, 0.25)];
    const sway = (u) => { const q = stf(u); return (q.headYaw || 0) * 0.8 + (q.twist || 0) * 0.6 + (q.headTilt || 0) * 0.8 + (q.lean ?? 0.2) * 0.3 + (q.x || 0) * 0.6; };
    const earSwing = clamp(lagOf(sway, t, 1.7, 0.16) * 3.2 + 0.06 * Math.sin(TAU * 0.6 * t + s.seed), -0.9, 0.9);
    const hairSwing = clamp(lagOf(sway, t, 1.0, 0.3) * 2.2, -0.8, 0.8);
    const face = { smile: 0.55, close: blink(t, s.seed), ...(st.face || {}), earSwing, hairSwing };
    const d = cam.toCam(tr.x, 1.0 + (tr.y || 0), tr.z)[2] + (extra.bias || 0);
    return { d, fn: () => {
      const F = R.figure(g, cam, { S: st.walk ? STY.girl : STY.still, look: s.look }, t, { tr, pose, face, kneel: st.kneel ?? (st.walk ? 0 : 1), flare: st.flare || 0, hemLag, hemPh: s.seed * 2, dupSwing: hairSwing,
        handPose: st.hands, wiggle: st.wiggle, thumb: st.thumb, handUp: st.handUp, bigHand: st.bigHand, hold: st.hold, holdBehind: st.holdBehind, overHead: st.overHead, rim: 0.4, near: true });
      FIG[i] = F;
    } };
  }
  const draw = (jobs) => { jobs.sort((a, b) => b.d - a.d); for (const j of jobs) j.fn(); };
  // the five round you on the sheet, as at frame 0: an arc, the middle ones further back
  const ARC = [[-0.6, 1.62], [-0.36, 1.95], [-0.05, 2.05], [0.25, 1.95], [0.47, 1.66]];
  const kneelAt = (p, o = {}) => (u) => ({ x: p[0], z: p[1], lean: 0.2, headPitch: 0.14, ...o, ...(typeof o.fn === 'function' ? o.fn(u) : {}) });

  // ------------------------------------------------------------------ the frame
  function frame(g, S, t) {
    for (let i = 0; i < 5; i++) FIG[i] = null;
    const shots = [
      [0, shotHook], [T.fire0, shotFire], [T.palms0, shotPalms], [T.r1, shotJalebi], [T.couple, shotCouple], [T.five, shotPhone],
      [T.pick, shotPick], [T.r3, shotDupatta], [T.r4, shotDance], [T.r5, shotSelfie], [T.baby, shotBaby], [T.lap, shotLap],
      [T.card, shotCard], [T.laugh, shotLaugh], [T.wide, shotWide], [T.haggle, shotHaggle], [T.eye, shotEye], [T.does, shotDoes],
      [T.palms1, shotTurn], [T.cmp, shotCompare], [T.ruffle, shotRuffle], [T.back, shotBack],
    ];
    let k = 0; for (let i = 0; i < shots.length; i++) if (t >= shots[i][0]) k = i;
    const [t0, fn] = shots[k];
    fn(g, S, t, t - t0);
    // the rounds: seven buds across the top, from the first round to the last (they stay through the wide)
    const ba = win(t, T.bloom1 - 0.35, T.bloom1 - 0.05, T.wide + 1.4, T.wide + 1.8) * (t >= T.pick && t < T.r3 ? 0.0 : 1) * (t >= T.lap && t < T.card ? 1 : 1);
    buds(g, t, ba);
  }
  // lay the world down soft (the focus is on the five)
  function soft(g, S, blur) { g.save(); if (blur > 0.3) g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(S.bg.canvas, 0, 0); g.restore(); }
  function warmth(g, a = 0.18) {                       // the tent's warm light over everything, darker at the edges
    const q = g.createRadialGradient(540, 820, 200, 540, 900, 1250); q.addColorStop(0, 'rgba(255,200,120,0)'); q.addColorStop(1, `rgba(60,20,30,${a})`); g.fillStyle = q; g.fillRect(0, 0, W, H);
  }

  // A · frame 0: GUARD HIS SHOES, the five lean in over you and his juttis
  function shotHook(g, S, t, u) {
    const cam = povCam(t, { yaw: 0.0, pitch: -0.115, f: lerp(1040, 1080, ease(0, 1.8, u)) });
    world(S.bg, cam, t, {}); soft(g, S, 5);
    const G0 = [0.55, 0.85, 0.4, 0.7, 0.9], TL0 = [0.12, -0.06, 0.1, -0.12, 0.08];
    const jobs = ARC.map((p, i) => sisJob(g, cam, i, t, kneelAt(p, { lean: 0.27, headPitch: 0.18, headTilt: TL0[i], face: { smile: 0.8, grin: G0[i], browUp: i === 1 ? 0.06 : 0, wink: 0, look: [(2 - i) * 0.015, -0.05] } })));
    draw(jobs); warmth(g);
    povArms(g, { sq: 0.4 + 0.3 * Math.sin(TAU * 0.6 * t) }, t);
    badges(g, 1);
    title(g, 'GUARD HIS SHOES', 395, 1 - ease(T.fire0 - 0.2, T.fire0, t));
  }
  // B · the mandap: the groom, barefoot at the fire, looks back at you and his shoes
  function shotFire(g, S, t, u) {
    const tr = coupleTr(t, 1), aim = [tr.x * 0.6 + WD.FIRE[0] * 0.4, 1.05, tr.z * 0.7 + WD.FIRE[2] * 0.3];
    const yaw = Math.atan2(aim[0], aim[2]), pitch = Math.atan2(aim[1] - EYE[1], Math.hypot(aim[0], aim[2]));
    const cam = povCam(t, { yaw, pitch, f: lerp(2100, 2250, ease(0, 2, u)), still: true });
    const look = win(u, 0.3, 0.75, 1.6, 2.1);
    world(S.bg, cam, t, { lookBack: look, worry: look }); soft(g, S, 0.6);
    warmth(g, 0.15);
  }
  // C · the five wiggle their hennaed fingers at you, hands up by their faces; number three's comes right up to your eyes (the
  // price already in every palm: in hers, close enough to read if you stop the film); then they rub their fingers: money
  const PALMS = [[-0.5, 1.32], [-0.27, 1.58], [0.0, 1.12], [0.27, 1.55], [0.49, 1.28]];
  function palmsState(i, u) {
    const p = PALMS[i], up = ease(0.05 + 0.07 * i, 0.45 + 0.07 * i, u), rub = ease(T.pays - T.palms0, T.pays - T.palms0 + 0.3, u);
    const wg = (k) => 2.4 * u + i * 0.37 + k * 0.45 + 1.6 * rub * u;
    return { x: p[0], z: p[1], lean: i === 2 ? 0.36 : 0.28, headPitch: 0.14, headTilt: [0.1, -0.08, 0.06, -0.1, 0.12][i] + 0.06 * rub * Math.sin(TAU * 2 * u), face: { smile: 0.9, grin: 0.55 + 0.35 * rub, browUp: 0.05, look: [(2 - i) * 0.02, -0.03] },
      arms: (J0, tr) => {
        if (i === 2) return { r: grab(J0, tr, 'r', [0.0, 0.62, 0.46], [0.25, -0.6, -1], up), l: body([0.14, 0.2, 0.27], [0, -0.4, 1], up) };
        return { l: body([0.13, 0.18, 0.27], [0, -0.4, 1], up), r: body([0.13, 0.18, -0.27], [0, -0.4, -1], up) };
      },
      hands: { l: 'open', r: 'open' }, overHead: { l: true, r: true }, curl: 0.5 * rub, wiggle: { l: wg(0), r: wg(1) } };
  }
  function shotPalms(g, S, t, u, replay = 0) {
    const cam = povCam(t, { yaw: 0.0, pitch: -0.14 - 0.02 * ease(0, 1, u), f: 1020 });
    world(S.bg, cam, t, { thief: false }); soft(g, S, 6);
    const jobs = [0, 1, 2, 3, 4].map((i) => sisJob(g, cam, i, t, (uu) => {
      const st = palmsState(i, uu - (t - u));
      st.bigHand = { l: bigHandOf(SIS[i], { text: '₹21,000', thumb: -1, wig: st.wiggle.l, curl: st.curl, plain: replay, bend: 0.85 }), r: bigHandOf(SIS[i], { text: '₹21,000', thumb: 1, wig: st.wiggle.r, curl: st.curl, plain: replay, bend: 0.85 }) };
      return st;
    }));
    draw(jobs); warmth(g);
    povArms(g, { sq: 0.7 + 0.2 * Math.sin(TAU * 1.1 * t) }, t);
  }
  // D · round 1: number three swings a jalebi under your nose; you bite it off without letting go
  function shotJalebi(g, S, t, u) {
    const tb = T.bite - T.r1, lunge = win(u, tb - 0.12, tb, tb + 0.12, tb + 0.45), chew = u > tb ? 0.012 * Math.sin(TAU * 4 * (u - tb)) * Math.exp(-(u - tb) * 1.5) : 0;
    const cam = povCam(t, { yaw: 0.02, pitch: -0.12 - 0.08 * lunge, dz: 0.2 * lunge, dy: -0.04 * lunge + chew, f: 1000 });
    world(S.bg, cam, t, {}); soft(g, S, 6);
    const bit = u > tb ? 1 : 0;
    const jobs = ARC.map((p, i) => {
      if (i !== 2) return sisJob(g, cam, i, t, kneelAt(p, { lean: 0.22, face: { smile: 0.7, look: [0.02 * (2 - i), -0.03] } }));
      return sisJob(g, cam, 2, t, (uu) => {
        const v = uu - (t - u), swing = Math.sin(TAU * 0.9 * v) * 0.08 * (1 - bit);
        return { x: -0.06, z: 0.98, lean: 0.4, headPitch: 0.12, headTilt: -0.12 + 0.05 * Math.sin(TAU * 0.9 * v), face: { smile: bit ? 0.1 : 0.85, grin: bit ? 0 : 0.6, smirk: bit ? 0 : 0.3, op: bit ? 0.5 * ease(tb, tb + 0.15, v) : 0, wide: bit ? 0.8 * ease(tb, tb + 0.15, v) : 0, look: [0, -0.05] },
          arms: (J0, tr) => ({ r: grab(J0, tr, 'r', [0.08 + swing, 0.9, 0.42], [0.3, -0.6, -1]), l: body([0.14, -0.42, 0.13], [0.1, -1, 0.7]) }),
          hands: { r: 'grip', l: 'relax' }, overHead: { r: true }, bigHand: { r: (g2, el, wr) => { const r = SIS[2].look.handK * wr[2] * 0.72; palm(g2, wr[0] + 0.2 * r, wr[1] + 0.3 * r, r, PI * 0.62, { k: -0.75, thumb: 1, curl: 0.75, skin: SIS[2].look.skin, skinD: SIS[2].look.skinD }); } }, holdBehind: { r: true }, hold: { r: (g2, el, wr) => { const sw = Math.sin(TAU * 0.9 * v) * 0.25 * (1 - bit); jalebi(g2, wr[0] - 0.03 * wr[2], wr[1] + 0.06 * wr[2], 0.11 * wr[2], sw, bit); } } };
      });
    });
    draw(jobs); warmth(g);
    povArms(g, { sq: 0.9, y: 1330 + 40 * lunge }, t);
    title(g, 'JOOTA CHUPAI', 395, ease(T.jtitle - 0.05, T.jtitle + 0.15, t) * (1 - ease(T.couple - 0.2, T.couple, t)), 120);
  }
  // E · the couple walk round the fire (far, unhurried; never the joke)
  function shotCouple(g, S, t, u) {
    const ax = WD.FIRE[0] + 0.1, az = WD.FIRE[2] + 0.4;
    const cam = povCam(t, { yaw: Math.atan2(ax, az), pitch: Math.atan2(1.05 - EYE[1], Math.hypot(ax, az)), f: lerp(1650, 1760, ease(0, 1.4, u)), still: true });
    world(S.bg, cam, t, {}); soft(g, S, 0.4); warmth(g, 0.15);
  }
  // F · five sisters; and round 2: number one holds her phone out to you: MUMMY is calling. You don't look.
  function shotPhone(g, S, t, u) {
    const cam = povCam(t, { yaw: 0.03, pitch: -0.115, f: 1060 });
    world(S.bg, cam, t, {}); soft(g, S, 5);
    const r2 = T.r2 - T.five, give = T.bloom2 - T.five - 0.35;
    const jobs = ARC.map((p, i) => {
      if (i !== 0) return sisJob(g, cam, i, t, kneelAt(p, { lean: 0.24, face: { smile: 0.75, look: [i < 3 ? -0.05 : -0.08, -0.02] }, fn: (uu) => ({ headYaw: 0.25 * win(uu - (t - u), r2 + 0.2, r2 + 0.5, give, give + 0.4) }) }));
      return sisJob(g, cam, 0, t, (uu) => {
        const v = uu - (t - u), out = ease(r2, r2 + 0.4, v) * (1 - ease(give, give + 0.45, v)), shake = 0.012 * Math.sin(TAU * 7 * v) * out;
        return { x: -0.5 + 0.12 * out, z: 1.45 - 0.3 * out, lean: 0.24 + 0.15 * out, headYaw: -0.15 * out, headPitch: 0.1, face: { smile: 0.6 + 0.3 * out - 0.5 * ease(give, give + 0.3, v), browUp: 0.05 * out, look: [0.04 * out, -0.03] },
          arms: (J0, tr) => ({ l: out > 0.01 ? grab(J0, tr, 'l', [-0.02 + shake, 0.8, 0.5], [0.2, -1, 0.7], out) : null, r: body([0.14, -0.42, -0.13], [0.1, -1, -0.7]) }),
          hands: { l: 'grip', r: 'relax' }, overHead: { l: true }, holdBehind: { l: true }, hold: { l: (g2, el, wr) => { if (out > 0.02) phone(g2, wr[0] + 0.03 * wr[2], wr[1] - 0.16 * wr[2], 0.2 * wr[2], 0.1, { t: v }); } } };
      });
    });
    draw(jobs); warmth(g);
    povArms(g, { sq: 0.6 }, t);
    badges(g, 1, { s: 1 + 0.12 * win(u, 0.05, 0.2, 0.35, 0.6) });
  }
  // G · the pick: the five, level, hands down; a ring runs out round them
  function shotPick(g, S, t, u) {
    const cam = povCam(t, { yaw: 0.05, pitch: -0.07, f: 1000, still: true });
    world(S.bg, cam, t, {}); soft(g, S, 6);
    const row = [-0.58, -0.29, 0.0, 0.29, 0.58];
    const jobs = row.map((x, i) => sisJob(g, cam, i, t, kneelAt([x, 1.62], { lean: 0.2, headPitch: 0.06, headTilt: [0.08, -0.05, 0.03, -0.07, 0.06][i], face: { smile: 0.6, grin: [0.2, 0, 0.3, 0.1, 0.25][i], look: [0, -0.01] } })));
    draw(jobs); warmth(g, 0.22);
    povArms(g, { sq: 0.5, y: 1400 }, t);
    badges(g, 1, { s: 1.15 });
    const ringU = (t - T.ring0) / (T.ring1 - T.ring0);
    ringOut(g, 492, 735, 448, ringU, ease(T.ring0 - 0.2, T.ring0, t) * (1 - ease(T.ring1 - 0.1, T.ring1 + 0.05, t)));
  }
  // H · round 3: number two throws her dupatta over your head; you pull it off
  function shotDupatta(g, S, t, u) {
    const cam = povCam(t, { yaw: 0.02, pitch: -0.11, f: 1050 });
    world(S.bg, cam, t, {}); soft(g, S, 5);
    const jobs = ARC.map((p, i) => sisJob(g, cam, i, t, kneelAt(p, { lean: 0.22, face: { smile: 0.8, look: [0, -0.02] }, fn: (uu) => (i === 1 ? { lean: 0.22 + 0.2 * win(uu - (t - u), 0, 0.2, 0.45, 0.7), twist: -0.3 * win(uu - (t - u), 0, 0.2, 0.45, 0.7) } : {}) })));
    draw(jobs); warmth(g);
    povArms(g, { sq: 0.8 }, t);
    // the dupatta: it flies at you, drapes, then is pulled off to the right
    const on = ease(0.15, 0.45, u), off = ease(0.85, 1.25, u), k = on * (1 - off);
    if (k > 0.001) {
      g.save(); g.globalAlpha = 0.86 * k; g.translate(1300 * off, -800 * (1 - on) + 120 * off); g.rotate(0.15 * off);
      const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#f7cf6a'); q.addColorStop(1, '#e0a83a'); g.fillStyle = q;
      g.beginPath(); g.moveTo(-200, -100); for (let i = 0; i <= 12; i++) { const x = -200 + i * 125, y = H + 60 + 40 * Math.sin(i * 1.3 + u * 6); g.lineTo(x, y); } g.lineTo(W + 300, -100); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(160,100,20,0.35)'; g.lineWidth = 18; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-100 + i * 150, -100); g.quadraticCurveTo(-60 + i * 150 + 30 * Math.sin(i + u * 3), H / 2, -100 + i * 150, H + 80); g.stroke(); }
      g.fillStyle = 'rgba(255,248,215,0.9)'; for (let i = 0; i < 60; i++) { const x = (i * 97) % (W + 200) - 100, y = (i * 173) % H; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); }
      g.restore();
      if (off > 0.01 && off < 0.99) myHand(g, [700 + 600 * off, 900 + 200 * off], -0.4, 120, 0.8, 1);
    }
  }
  // I · round 4: number four starts a dance and everyone claps; you clap with your elbows
  function shotDance(g, S, t, u) {
    const cam = povCam(t, { yaw: 0.0, pitch: -0.03, f: 960 });
    world(S.bg, cam, t, {}); soft(g, S, 5);
    const beat = (v) => Math.sin(TAU * 2.1 * v);
    const jobs = ARC.map((p, i) => {
      if (i !== 3) return sisJob(g, cam, i, t, kneelAt(p, { lean: 0.12, face: { smile: 0.9, op: 0.15 }, fn: (uu) => { const v = uu - (t - u), c = Math.max(0, beat(v)); return { arms: () => ({ l: body([0.3, -0.05 - 0.02 * c, 0.05 + 0.06 * c], [0.2, -1, 0.7]), r: body([0.3, -0.05 - 0.02 * c, -0.05 - 0.06 * c], [0.2, -1, -0.7]) }), hands: { l: 'clap', r: 'clap' } }; } }));
      return sisJob(g, cam, 3, t, (uu) => {
        const v = uu - (t - u), up = ease(0, 0.3, v), spin = ease(0.45, 1.15, v), b = beat(v);
        return { x: 0.1, z: 1.75, sink: 0.44 * (1 - up), lean: 0.05 + 0.04 * b, kneel: 1 - up, h: faceTo(0.1, 1.75) + TAU * spin, flare: 0.35 * Math.sin(PI * spin), shrug: 0.03 * b, headTilt: 0.12 * b, face: { smile: 1, op: 0.3, look: [0, 0] },
          arms: () => ({ l: body([0.12, 0.34 + 0.05 * b, 0.22], [0, 0.4, 1]), r: body([0.12, 0.34 - 0.05 * b, -0.22], [0, 0.4, -1]) }), hands: { l: 'open', r: 'open' } };
      });
    });
    draw(jobs); warmth(g);
    povArms(g, { sq: 0.6, elb: Math.sin(TAU * 2.1 * u) }, t);
  }
  // J · round 5: number one snaps a selfie with you; the flash; you blink, still holding
  function shotSelfie(g, S, t, u) {
    const cam = povCam(t, { yaw: -0.05, pitch: -0.1, f: 1000 });
    world(S.bg, cam, t, {}); soft(g, S, 5);
    const fl = T.flash - T.r5;
    const jobs = ARC.map((p, i) => {
      if (i !== 0) return sisJob(g, cam, i, t, kneelAt(p, { lean: 0.22, face: { smile: 0.8, look: [-0.06, 0] } }));
      return sisJob(g, cam, 0, t, (uu) => {
        const v = uu - (t - u), inn = ease(0, 0.4, v);
        return { x: lerp(-0.6, -0.34, inn), z: lerp(1.6, 0.62, inn), lean: 0.2, headTilt: 0.25 * inn, headYaw: -0.3 * inn, face: { smile: 1, op: 0.2, look: [0.05, 0] },
          arms: (J0, tr) => ({ l: grab(J0, tr, 'l', [0.05, 1.08, 0.55], [0.2, -0.5, 1], inn), r: body([0.14, -0.42, -0.13], [0.1, -1, -0.7]) }),
          hands: { l: 'grip' }, hold: { l: (g2, el, wr) => phone(g2, wr[0], wr[1] - 0.06 * wr[2], 0.2 * wr[2], -0.1, { flash: v > fl && v < fl + 0.12 }) } };
      }, { bias: -0.3 });
    });
    draw(jobs); warmth(g);
    povArms(g, { sq: 0.9 }, t);
    const f = win(u, fl, fl + 0.02, fl + 0.06, fl + 0.4);
    if (f > 0.001) { g.fillStyle = `rgba(255,255,250,${f.toFixed(3)})`; g.fillRect(0, 0, W, H); }
    lids(g, win(u, fl + 0.05, fl + 0.12, fl + 0.22, fl + 0.34));
  }
  function lids(g, k) {                                // your eyelids, closing from above and below
    if (k <= 0.001) return; g.fillStyle = '#120a0c';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H * 0.52 * k); g.quadraticCurveTo(540, H * 0.6 * k, 0, H * 0.52 * k); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, H); g.lineTo(W, H); g.lineTo(W, H - H * 0.5 * k); g.quadraticCurveTo(540, H - H * 0.58 * k, 0, H - H * 0.5 * k); g.closePath(); g.fill();
  }
  // K · round 6: the twelve-year-old plants a baby in your arms; it grabs your nose; your arms go to the baby
  function baby(g, x, y, s, t, o = {}) {
    g.save(); g.translate(x, y); g.rotate(o.rot || 0);
    // the blanket
    g.fillStyle = '#f6eee0'; g.beginPath(); g.ellipse(0, 0.55 * s, 0.75 * s, 0.6 * s, 0, 0, TAU); g.fill();
    g.strokeStyle = '#e8338a'; g.lineWidth = 0.05 * s; g.beginPath(); g.ellipse(0, 0.55 * s, 0.7 * s, 0.55 * s, 0, PI * 1.1, PI * 1.9); g.stroke();
    // the head: round, chubby, a curl of hair, a black nazar dot by the temple
    const sk = '#c99570', skD = '#a37050';
    g.fillStyle = sk; g.beginPath(); g.ellipse(0, 0, 0.5 * s, 0.47 * s, 0, 0, TAU); g.fill();
    g.fillStyle = skD; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(k * 0.48 * s, 0.02 * s, 0.08 * s, 0.11 * s, 0, 0, TAU); g.fill(); }
    g.strokeStyle = '#1a120c'; g.lineWidth = 0.06 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(-0.05 * s, -0.44 * s); g.quadraticCurveTo(0.12 * s, -0.62 * s, 0.1 * s, -0.42 * s); g.stroke();
    g.fillStyle = '#1a120c'; g.beginPath(); g.arc(-0.33 * s, -0.22 * s, 0.035 * s, 0, TAU); g.fill();
    const gl = o.giggle || 0;
    for (const k of [-1, 1]) {                        // big shiny eyes
      g.fillStyle = '#1a120c'; g.beginPath(); g.ellipse(k * 0.17 * s, -0.02 * s, 0.075 * s, 0.085 * s * (1 - 0.6 * gl), 0, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(k * 0.17 * s - 0.025 * s, -0.05 * s, 0.025 * s, 0, TAU); g.fill();
    }
    g.fillStyle = 'rgba(235,110,100,0.35)'; for (const k of [-1, 1]) { g.beginPath(); g.arc(k * 0.3 * s, 0.12 * s, 0.09 * s, 0, TAU); g.fill(); }
    g.fillStyle = '#8a2a2a'; g.beginPath(); g.ellipse(0, 0.2 * s, 0.09 * s, 0.05 * s + 0.05 * s * gl, 0, 0, TAU); g.fill();
    g.restore();
  }
  function fist(g, x, y, s) { g.fillStyle = '#c99570'; g.beginPath(); g.ellipse(x, y, 0.5 * s, 0.42 * s, 0, 0, TAU); g.fill(); g.strokeStyle = '#a37050'; g.lineWidth = 0.05 * s; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x - 0.2 * s + i * 0.2 * s, y - 0.15 * s, 0.12 * s, PI, TAU); g.stroke(); } }
  function shotBaby(g, S, t, u) {
    const tn = T.nose - T.baby, ta = T.armsGo - T.baby, tug = win(u, tn, tn + 0.1, tn + 0.5, tn + 1.0);
    const cam = povCam(t, { yaw: 0.02 - 0.04 * tug, pitch: -0.12 - 0.1 * tug, f: 1020, roll: 0.05 * tug * Math.sin(TAU * 3 * u) });
    world(S.bg, cam, t, {}); soft(g, S, 6);
    const jobs = ARC.map((p, i) => {
      if (i === 4) return sisJob(g, cam, 4, t, (uu) => { const v = uu - (t - u), inn = ease(0, 0.5, v) * (1 - ease(ta + 0.3, ta + 0.9, v)); return { x: lerp(0.47, 0.22, inn), z: lerp(1.66, 0.8, inn), lean: 0.3 + 0.1 * inn, face: { smile: 1, look: [-0.05, -0.04] }, arms: (J0, tr) => ({ l: grab(J0, tr, 'l', [0.05, 0.74, 0.42], [0.2, -1, 0.8], inn), r: grab(J0, tr, 'r', [0.12, 0.7, 0.42], [0.2, -1, -0.8], inn) }), hands: { l: 'open', r: 'open' } }; }, { bias: -0.2 });
      if (i === 3) return sisJob(g, cam, 3, t, (uu) => { const v = uu - (t - u), go = ease(ta - 0.2, ta + 0.5, v); return { x: lerp(0.25, -0.75, go), z: lerp(1.95, 1.4, go), lean: 0.2 + 0.25 * win(v, ta - 0.2, ta, ta + 0.3, ta + 0.6), face: { smile: 0.6, look: [0, -0.05] } }; });
      return sisJob(g, cam, i, t, kneelAt(p, { lean: 0.22, face: { smile: 0.85, look: [0.04, -0.04] } }));
    });
    draw(jobs); warmth(g);
    const hand = ease(ta, ta + 0.45, u);
    povArms(g, { sq: 0.3 * (1 - hand), open: hand, drop: ease(ta + 0.1, ta + 0.6, u), y: 1330 + 30 * tug }, t);
    const bx = lerp(880, 540, ease(0.05, 0.6, u)), by = lerp(1000, 1130, ease(0.05, 0.6, u)) + 60 * tug;
    baby(g, bx, by, 390, t, { giggle: win(u, tn + 0.1, tn + 0.3, tn + 1.2, tn + 1.5), rot: -0.12 + 0.12 * ease(0.05, 0.6, u) + 0.1 * tug });
    if (tug > 0.01) fist(g, bx - 10 + 60 * tug, by - 210 - 360 * tug, 130 + 60 * tug);
  }
  // L · your lap: the baby, and no shoes. You look up: number four by the pillar, twirling his juttis; the others dance round her
  function shotLap(g, S, t, u) {
    const tu = T.up - T.lap, look = springE((u - tu) / 0.6);
    const cam = povCam(t, { yaw: lerp(0.0, -0.22, look), pitch: lerp(-0.95, -0.02, look), f: lerp(950, 1150, look) });
    world(S.bg, cam, t, {}); soft(g, S, look > 0.5 ? 2.5 : 6);
    const PIL = WD.PILLARS[0], c4 = [PIL[0] + 0.25, PIL[1] - 0.45];
    const jobs = [0, 1, 2, 3, 4].map((i) => {
      if (i === 3) return sisJob(g, cam, 3, t, (uu) => { const v = uu - (t - u); return { x: c4[0], z: c4[1], kneel: 0, sink: 0, walk: 0, lean: 0.05, headTilt: 0.1 * Math.sin(TAU * 1.2 * v), face: { smile: 1, smirk: 0.6, look: [0.05, 0] }, arms: () => ({ r: body([0.16, 0.5, -0.16], [0, 0.4, -1]), l: body([0.1, -0.1, 0.25], [0, -1, 0.8]) }), hands: { r: 'point', l: 'relax' }, overHead: { r: true },
        hold: { r: (g2, el, wr) => { const a = TAU * 1.6 * v; g2.save(); g2.translate(wr[0], wr[1] - 0.08 * wr[2]); const L = 0.36 * wr[2]; g2.rotate(a); g2.translate(-0.15 * L, 0); jutti(g2, L, 0, v); g2.rotate(PI * 0.9); jutti(g2, L, 0.2, v + 1); g2.restore(); } } }; });
      const ph = i / 4 * TAU;
      return sisJob(g, cam, i, t, (uu) => { const v = uu - (t - u), a = ph + 0.9 * v, x = c4[0] + 0.85 * Math.sin(a), z = c4[1] + 0.85 * Math.cos(a); return { x, z, kneel: 0, sink: 0, walk: 0.7, tg: v * 1.6 + i, lean: 0.06, h: a + PI / 2, face: { smile: 1, op: 0.25 }, arms: () => ({ l: body([0.15, 0.3, 0.25], [0, 0.4, 1]), r: body([0.15, 0.3, -0.25], [0, 0.4, -1]) }), hands: { l: 'open', r: 'open' } }; });
    });
    draw(jobs); warmth(g);
    // looking down: the baby in your arms, your lap, the sheet, no shoes
    if (look < 0.98) {
      g.save(); g.globalAlpha = 1; g.translate(0, 1500 * look);
      povArms(g, { open: 0.75, shoes: false, y: 1380 }, t);
      baby(g, 520, 1120, 300, t, { giggle: 0.6, rot: 0.05 });
      g.restore();
    }
    badges(g, ease(T.four - 0.1, T.four + 0.2, t), { only: 3, s: 1.1 });
  }
  // M · number one holds up a card: one lakh
  function shotCard(g, S, t, u) {
    const cam = povCam(t, { yaw: 0.0, pitch: -0.1, f: 1050 });
    world(S.bg, cam, t, {}); soft(g, S, 6);
    const up = springE((t - T.lakh + 0.25) / 0.45);
    const jobs = [[-0.5, 1.9], [-0.25, 2.1], [0.05, 2.2], [0.3, 2.05], [0.52, 1.85]].map((p, i) => {
      if (i === 0) return sisJob(g, cam, 0, t, () => ({ x: 0.0, z: 1.08, lean: 0.22, headPitch: 0.08, face: { smile: 0.8, grin: 0.4 * clamp(up), browUp: 0.06, look: [0, -0.01] }, arms: (J0, tr) => ({ l: grab(J0, tr, 'l', [-0.15, lerp(0.3, 0.55, clamp(up)), 0.76], [0.2, -1, 0.7]), r: grab(J0, tr, 'r', [0.15, lerp(0.3, 0.55, clamp(up)), 0.76], [0.2, -1, -0.7]) }), hands: { l: 'grip', r: 'grip' }, overHead: { l: true, r: true }, holdBehind: { l: true },
        hold: { l: (g2, el, wr) => card(g2, wr[0] + 0.15 * wr[2], wr[1] - 0.12 * wr[2], 0.42 * wr[2], 0.03, { lines: [{ text: '₹1,00,000' }] }) } }), { bias: -0.5 });
      if (i === 3) return sisJob(g, cam, 3, t, kneelAt(p, { lean: 0.15, face: { smile: 0.9, smirk: 0.5 }, arms: () => ({ r: body([0.2, 0.32, -0.15], [0, 0.4, -1]), l: body([0.14, -0.42, 0.13], [0.1, -1, 0.7]) }), hands: { r: 'grip' }, hold: { r: (g2, el, wr) => pair(g2, wr[0] - 0.15 * wr[2], wr[1] + 0.02 * wr[2], 0.27 * wr[2], -0.2, t, 0.6) } }));
      return sisJob(g, cam, i, t, kneelAt(p, { lean: 0.2, face: { smile: 0.85, look: [0, -0.02] } }));
    });
    draw(jobs); warmth(g);
  }
  // N · you laugh; they walk off with the shoes
  function shotLaugh(g, S, t, u) {
    const tw = T.walk - T.laugh, la = win(u, 0, 0.08, 0.6, 0.95), bounce = 0.012 * la * Math.abs(Math.sin(TAU * 3.2 * u));
    const cam = povCam(t, { yaw: 0.04, pitch: -0.08 + 0.05 * la, dy: bounce, f: 980 });
    world(S.bg, cam, t, {}); soft(g, S, 5);
    const jobs = [[-0.42, 1.25], [-0.25, 1.9], [0.05, 2.0], [0.3, 1.85], [0.5, 1.6]].map((p, i) => sisJob(g, cam, i, t, (uu) => {
      const v = uu - (t - u), rise = ease(tw - 0.1 + i * 0.06, tw + 0.35 + i * 0.06, v), go = Math.max(0, v - (tw + 0.3 + i * 0.06));
      const head = faceTo(p[0], p[1]) + PI * 0.92 * ease(tw + 0.15 + i * 0.06, tw + 0.6 + i * 0.06, v), d = 1.15 * go * go / (go + 0.5);
      return { x: p[0] + Math.sin(head) * d, z: p[1] + Math.cos(head) * d, h: head, kneel: 1 - rise, sink: (SIS[i].kid ? 0.4 : 0.44) * (1 - rise), walk: clamp(go * 3), tg: d / 1.05, lean: 0.12 - 0.08 * rise, face: { smile: 0.9, smirk: 0.4 },
        hands: i === 3 ? { r: 'grip' } : undefined, arms: i === 3 ? () => ({ r: body([0.22, 0.25, -0.14], [0, 0.3, -1]) }) : undefined,
        hold: i === 3 ? { r: (g2, el, wr) => pair(g2, wr[0] - 0.15 * wr[2], wr[1], 0.27 * wr[2], -0.2, t, 0.6) } : undefined };
    }));
    draw(jobs); warmth(g);
    povArms(g, { open: 0.6, shoes: false, y: 1480 + 25 * Math.sin(TAU * 3.2 * u) * la }, t);
  }
  // O · the wide: the last round; the groom, barefoot, looks at you; and far back by the gate, a man in a maroon cap, sipping
  function shotWide(g, S, t, u) {
    const cam = R.camera({ x: -1.0 + 0.12 * ease(0, 2, u), y: 2.35, z: -1.7, yaw: 0.33, pitch: -0.165, f: 1000 });
    const youJob = (jobs) => jobs.push({ d: cam.toCam(0, 1, 0)[2], fn: () => R.figure(S.bg, cam, { S: STY.still, look: YOU }, t, { tr: { x: 0, z: 0, h: 0.05, tg: 0 }, pose: { walk: 0, sink: 0.5, sit: 0.1, lean: 0.05, headYaw: 0.2, headPitch: -0.05, arms: restArms() }, kneel: 1, face: {} }) });
    world(S.bg, cam, t, { extra: (gb, c) => { const j = []; youJob(j); sisWalkers(gb, c, t, j); j.sort((a, b) => b.d - a.d); for (const x of j) x.fn(); } });
    soft(g, S, 0.5); warmth(g, 0.16);
  }
  function sisWalkers(g, cam, t, jobs) {                // the five on their way off the sheet with the shoes, towards the left
    for (let i = 0; i < 5; i++) {
      const h = -0.45 + 0.05 * i;
      jobs.push(sisJob(g, cam, i, t, (uu) => { const vv = uu - T.walk, dd = 0.9 + 0.62 * vv; return { x: -0.35 + 0.28 * i + Math.sin(h) * dd, z: 1.4 + 0.3 * i + Math.cos(h) * dd, h, walk: 1, kneel: 0, sink: 0, tg: dd / 1.05 + i * 0.3, lean: 0.08, face: { smile: 0.9 },
        hands: i === 3 ? { r: 'grip' } : undefined, arms: i === 3 ? () => ({ r: body([0.22, 0.25, -0.14], [0, 0.3, -1]) }) : undefined, hold: i === 3 ? { r: (g2, el, wr) => pair(g2, wr[0] - 0.15 * wr[2], wr[1], 0.27 * wr[2], -0.2, t, 0.6) } : undefined }; }));
    }
  }
  // P · they come down: fifty-one, thirty-one, twenty-one; you lean in, they lean back
  function haggleLines(t) {
    const w = (a) => ease(a, a + 0.45, t), x = (a) => ease(a - 0.35, a, t);
    const L = [{ text: '₹1,00,000', cross: x(T.c51), dim: t > T.c51 }];
    if (t > T.c51) L.push({ text: '₹51,000', write: w(T.c51), cross: x(T.c31), dim: t > T.c31 });
    if (t > T.c31) L.push({ text: '₹31,000', write: w(T.c31), cross: x(T.c21), dim: t > T.c21 });
    if (t > T.c21) L.push({ text: '₹21,000', write: w(T.c21), ring: ease(T.c21 + 0.6, T.c21 + 1.1, t) });
    return L;
  }
  function shotHaggle(g, S, t, u) {
    const lean = (a) => win(t, a - 0.5, a - 0.25, a + 0.15, a + 0.5);
    const inn = Math.max(lean(T.c51), lean(T.c31), lean(T.c21));
    const cam = povCam(t, { yaw: 0.0, pitch: -0.1, f: 1050, dz: 0.12 * inn, dy: 0.03 * inn });
    world(S.bg, cam, t, {}); soft(g, S, 6);
    const lines = haggleLines(t);
    const jobs = [[-0.5, 1.9], [-0.25, 2.1], [0.05, 2.2], [0.3, 2.05], [0.52, 1.85]].map((p, i) => {
      if (i === 0) return sisJob(g, cam, 0, t, () => ({ x: 0.0, z: 1.1, lean: 0.22 - 0.2 * inn, headPitch: 0.08, face: { smile: 0.6 + 0.3 * inn, grin: 0.3 * inn, browUp: 0.06 * inn, look: [0, -0.01] }, arms: (J0, tr) => ({ l: grab(J0, tr, 'l', [-0.16, 0.55, 0.8 + 0.06 * inn], [0.2, -1, 0.7]), r: grab(J0, tr, 'r', [0.16, 0.55, 0.8 + 0.06 * inn], [0.2, -1, -0.7]) }), hands: { l: 'grip', r: 'grip' }, overHead: { l: true, r: true }, holdBehind: { l: true },
        hold: { l: (g2, el, wr) => card(g2, wr[0] + 0.16 * wr[2], wr[1] - 0.16 * wr[2], 0.46 * wr[2], 0.03, { lines }) } }), { bias: -0.5 });
      return sisJob(g, cam, i, t, kneelAt(p, { lean: 0.2 - 0.16 * inn, face: { smile: 0.8, look: [0, -0.02] }, hands: i === 3 ? { r: 'grip' } : undefined, arms: i === 3 ? () => ({ r: body([0.2, 0.2, -0.15], [0, 0.4, -1]), l: body([0.14, -0.42, 0.13], [0.1, -1, 0.7]) }) : undefined, hold: i === 3 ? { r: (g2, el, wr) => pair(g2, wr[0] - 0.15 * wr[2], wr[1] + 0.02 * wr[2], 0.27 * wr[2], -0.2, t, 0.6) } : undefined }));
    });
    draw(jobs); warmth(g);
  }
  // Q · eye to eye, the ₹21,000 card between you
  function shotEye(g, S, t, u) {
    const cam = povCam(t, { yaw: 0.0, pitch: -0.02, y: 0.95, f: 1150, dz: 0.08 * ease(0, 3, u) });
    world(S.bg, cam, t, {}); soft(g, S, 7);
    const q = ease(T.ans - 0.9, T.ans - 0.5, t);
    const row = [-0.46, -0.23, 0.0, 0.23, 0.46];
    const jobs = row.map((x, i) => sisJob(g, cam, i, t, kneelAt([x, 1.35 + (i % 2) * 0.08], { lean: 0.28, headPitch: 0.02, face: { smile: 0.5 + 0.3 * q, browUp: 0.07 * q, look: [0, 0] } })));
    draw(jobs); warmth(g, 0.22);
    card(g, 515, 1240, 430, -0.03, { lines: haggleLines(t) });
  }
  // R · he does: the groom hands over an envelope; number four kneels and puts the juttis on his feet; you puff up; their hands rise
  function shotDoes(g, S, t, u) {
    const tf = T.feet - T.does, tl = T.lift - T.does, puff = ease(T.puff - T.does, T.puff - T.does + 0.4, u);
    const cam = povCam(t, { yaw: 0.16, pitch: 0.08 + 0.04 * puff, f: 880, dy: 0.05 * puff });
    const gx = 0.62, gz = 1.6, env = ease(0.0, 0.35, u) * (1 - ease(0.8, 0.95, u));
    world(S.bg, cam, t, { couple: false }); soft(g, S, 5);
    const jobs = [];
    jobs.push({ d: cam.toCam(gx, 1, gz)[2], fn: () => R.figure(g, cam, { S: STY.still, look: GROOM }, t, { tr: { x: gx, z: gz, h: faceTo(gx, gz, 0.0, 0.9), tg: 0 }, pose: { walk: 0, lean: 0.06 + 0.04 * env, headPitch: 0.22, headYaw: -0.1, arms: { r: body([0.3 + 0.18 * env, -0.12 + 0.1 * env, -0.12], [0.1, -1, -0.6]), l: body([0.05, -0.42, 0.14], [0, -1, 0.6]) } }, face: { smile: 0.75, grin: 0.25, close: blink(t, 1.9) }, handPose: { r: 'grip' }, hold: { r: (g2, el, wr) => { if (env > 0.05) envelope(g2, wr[0], wr[1] - 0.05 * wr[2], 0.45 * wr[2], 0.25); } } }) });
    const P5 = [[0.12, 1.32], [-0.32, 1.55], [-0.1, 1.85], null, [-0.55, 1.25]];
    const rise = ease(tl, tl + 0.45, u);
    for (let i = 0; i < 5; i++) {
      if (i === 3) {                                  // at his side, his juttis going back on
        const k = ease(tf - 0.4, tf, u), x4 = gx + 0.36, z4 = gz - 0.05;
        jobs.push(sisJob(g, cam, 3, t, () => ({ x: x4, z: z4, h: faceTo(x4, z4, gx, gz - 0.12), lean: 0.5, headPitch: 0.4, headYaw: 0.25, face: { smile: 0.7, grin: 0.3 }, arms: (J0, tr) => ({ l: grab(J0, tr, 'l', [gx + 0.02, 0.06, gz - 0.1], [0.2, -1, 0.7], k), r: grab(J0, tr, 'r', [gx + 0.08, 0.06, gz - 0.16], [0.2, -1, -0.7], k) }), hands: { l: 'grip', r: 'grip' } })));
        continue;
      }
      const p = P5[i];
      jobs.push(sisJob(g, cam, i, t, kneelAt(p, { lean: 0.2, headPitch: 0.02, face: { smile: 0.8 + 0.2 * rise, grin: 0.4 * rise, look: [0.04, 0.03] }, arms: (J0, tr) => (i === 0 ? { r: grab(J0, tr, 'r', [gx - 0.2, 0.95 + 0.0 * env, gz - 0.45], [0.2, -1, -0.7], env * (1 - rise)), l: body([0.18, 0.08 + 0.3 * rise, 0.2], [0, -0.3, 1], rise) } : { l: body([0.18, 0.08 + 0.3 * rise, 0.2], [0, -0.3, 1], rise), r: body([0.18, 0.08 + 0.3 * rise, -0.2], [0, -0.3, -1], rise) }), hands: { l: 'open', r: 'open' }, thumb: { l: 1, r: -1 }, overHead: { l: true, r: true } })));
    }
    jobs.push({ d: cam.toCam(gx, 0.1, gz - 0.12)[2] - 0.02, fn: () => { const p = cam.P(gx - 0.02, 0.025, gz - 0.12); if (!p) return; const on = ease(tf - 0.1, tf + 0.35, u); pair(g, p[0] - 0.13 * p[2], p[1] - 0.02 * p[2] - 0.35 * p[2] * (1 - on), 0.27 * p[2], -0.06, t, 0.35); } });
    draw(jobs); warmth(g);
  }
  // S · they show you their hands: five palms turn at once and fill the frame; the price in the swirls of every one
  function shotTurn(g, S, t, u) {
    const push = ease(T.mehendi - T.palms1, T.plain - T.palms1 + 0.8, u);
    const cam = povCam(t, { yaw: 0.0, pitch: -0.05, f: 1050, dz: 0.1 * push });
    world(S.bg, cam, t, {});
    const jobs = [-0.46, -0.23, 0.0, 0.23, 0.46].map((x, i) => sisJob(S.bg, cam, i, t, kneelAt([x, 1.5 + (i % 2) * 0.08], { lean: 0.24, headPitch: 0.04, face: { smile: 0.9, grin: 0.5, look: [0, 0] }, arms: () => ({ l: body([0.3, 0.1, 0.12], [0, -0.5, 1]), r: body([0.3, 0.1, -0.12], [0, -0.5, -1]) }) })));
    draw(jobs); soft(g, S, 7);
    warmth(g, 0.2);
    const turn = ease(T.turn - T.palms1, T.turn - T.palms1 + 0.4, u), plain = ease(T.plain - T.palms1, T.plain - T.palms1 + 0.5, u), k = 1 + 0.1 * push;
    const xs = [150, 330, 515, 700, 878], ys = [1000, 930, 975, 925, 1005];
    for (let i = 0; i < 5; i++) {
      const sI = SIS[i], x = 515 + (xs[i] - 515) * k, y = 960 + (ys[i] - 960) * k, r = 88 * k * (sI.kid ? 0.86 : 1), bx = 515 + (xs[i] - 515) * 0.55, by = y + 4.2 * r;
      // the forearm, back and down towards her (it narrows away from you), bangles at the wrist
      const wx = x + 6, wy = y + 0.42 * r, dx = bx - wx, dy = by - wy, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      g.save(); g.beginPath(); g.moveTo(wx + nx * 0.56 * r, wy + ny * 0.56 * r); g.lineTo(bx + nx * 0.4 * r, by + ny * 0.4 * r); g.lineTo(bx - nx * 0.4 * r, by - ny * 0.4 * r); g.lineTo(wx - nx * 0.56 * r, wy - ny * 0.56 * r); g.closePath();
      const q = g.createLinearGradient(wx + nx * 0.56 * r, wy + ny * 0.56 * r, wx - nx * 0.56 * r, wy - ny * 0.56 * r); q.addColorStop(0, sI.look.skinH); q.addColorStop(0.5, sI.look.skin); q.addColorStop(1, sI.look.skinD); g.fillStyle = q; g.fill();
      (sI.look.bangles || []).forEach((c, j) => { const u2 = 0.1 + j * 0.055, px = wx + dx * u2, py = wy + dy * u2, w2 = lerp(0.56, 0.4, u2) * r; g.strokeStyle = mix(c, '#000000', 0.25); g.lineWidth = 0.13 * r; g.beginPath(); g.moveTo(px + nx * w2 * 1.05, py + ny * w2 * 1.05); g.lineTo(px - nx * w2 * 1.05, py - ny * w2 * 1.05); g.stroke(); g.strokeStyle = c; g.lineWidth = 0.09 * r; g.stroke(); });
      g.restore();
      palm(g, x, y, r, -PI / 2 + (i - 2) * 0.07, { k: lerp(-1, 1, turn), thumb: i < 2 ? 1 : -1, skin: sI.look.skin, skinD: sI.look.skinD, text: '₹21,000', plain, spread: 0.12 });
    }
  }
  // T · the lakh card beside the ₹21,000 card: the 21 looks tiny
  function shotCompare(g, S, t, u) {
    const cam = povCam(t, { yaw: 0.0, pitch: -0.1, f: 1050 });
    world(S.bg, cam, t, {}); soft(g, S, 12);
    g.fillStyle = 'rgba(30,12,24,0.35)'; g.fillRect(0, 0, W, H);
    const a = springE(u / 0.5), b = springE((u - 0.45) / 0.5);
    card(g, 400, 860, 560 * clamp(a, 0, 1.1), -0.06, { lines: [{ text: '₹1,00,000' }] });
    card(g, 770, 1140, 210 * clamp(b, 0, 1.1), 0.05, { lines: [{ text: '₹21,000', ring: ease(1.0, 1.5, u) }] });
  }
  // U · the groom ruffles your hair; the five split the notes; by the gate the man in the maroon cap raises his glass
  function shotRuffle(g, S, t, u) {
    const rf = win(u, 0.0, 0.25, 0.6, 0.9), tilt = ease(0.4, 1.0, u);
    const cam = povCam(t, { yaw: lerp(0.08, 0.26, tilt), pitch: lerp(-0.04, -0.07, tilt) - 0.05 * rf * Math.sin(TAU * 4 * u), roll: 0.03 * rf * Math.sin(TAU * 4 * u), f: 1050 });
    world(S.bg, cam, t, {}); soft(g, S, 3.5);
    const C0 = [0.15, 2.05];
    const jobs = [0, 1, 2, 3, 4].map((i) => { const a = i / 5 * TAU + 0.6, x = C0[0] + 0.55 * Math.sin(a), z = C0[1] + 0.55 * Math.cos(a); return sisJob(g, cam, i, t, () => ({ x, z, h: faceTo(x, z, C0[0], C0[1]), lean: 0.35, headPitch: 0.3, face: { smile: 1, op: 0.15 }, arms: (J0, tr) => ({ r: grab(J0, tr, 'r', [C0[0] + 0.2 * Math.sin(a), 0.5, C0[1] + 0.2 * Math.cos(a)], [0.2, -1, -0.7]) }), hands: { r: 'grip' }, hold: { r: (g2, el, wr) => notes(g2, wr[0], wr[1], 0.5 * wr[2], -0.3, 3 + (i % 2), 0.15) } })); });
    draw(jobs); warmth(g);
    // his hand, over your head
    if (rf > 0.01) { g.save(); g.translate(560 + 40 * Math.sin(TAU * 4 * u), -120 + 330 * rf); g.rotate(PI * 0.97); const s = 1.0; g.fillStyle = '#b9855c'; g.beginPath(); g.ellipse(0, 0, 230 * s, 170 * s, 0, 0, TAU); g.fill(); for (let i = 0; i < 4; i++) { g.strokeStyle = '#a5714c'; g.lineWidth = 78 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(-150 + i * 100, 80); g.lineTo(-170 + i * 110, 300 + 20 * Math.sin(i + u * 9)); g.stroke(); g.strokeStyle = '#b9855c'; g.lineWidth = 64 * s; g.stroke(); } g.fillStyle = '#f3e4c2'; g.fillRect(-260, -420, 520, 300); g.fillStyle = '#e3b23c'; g.fillRect(-260, -150, 520, 36); g.restore(); }
  }
  // V · back to line 2's shot: their fingers, and the price you can find now
  function shotBack(g, S, t, u) {
    const tt = T.palms0 + u;
    shotPalms(g, S, tt, u, ease(0.4, 1.3, u) * 0.6);
  }

  // ------------------------------------------------------------------ the scene
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) {
      S.g = canvas(root);
      const c = document.createElement('canvas'); c.width = W; c.height = H; S.bg = c.getContext('2d');
    },
    run(t, b, S) {
      const g = S.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      g.save(); g.fillStyle = '#2a1a22'; g.fillRect(0, 0, W, H);
      frame(g, S, t);
      g.restore();
    },
  });
  U.endcard();
  U.grain(0.06);
  C.start();
})();
