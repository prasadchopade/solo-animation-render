// Reel 44 · One Word (working title). Tests desk, an episode for the 4 pm IST slot: a crash you're the only witness to, an
// officer whose printed form asks where the broken glass was, and the 1974 study of one word ("smashed") that put glass into
// people's memories. docs/script.md has the beats; the voice's placed lines (film/timing.js, written by place_vo.py) are the
// picture's clock. The street, the cart, the rickshaw, the fruit and the crash's physics are film/street.js; the bodies are
// reel 42's rig (film/rig.js). Our own drawings; nobody real. 30 fps. Every frame is a pure function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp } = C;
  const R = window.RIG, S = window.STREET, U = window.UI, { sstep, mix, rgba, TAU } = R, PI = Math.PI;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '700 30px Mono'];
  const TM = window.TIMING || {}, END = window.END || C.bt('end');
  const A = (id) => (TM[id] ? TM[id].a : 0), B = (id) => (TM[id] ? TM[id].b : 0);
  const WD = (id, i) => { const w = TM[id] && TM[id].w; return w ? w[Math.min(i, w.length - 1)][1] : A(id); };   // the start of word i of a line

  // ------------------------------------------------------------------ copied from reel 42's film/film.js (HQ's brief, point 8):
  // life, hermite, springE, grab, bow, move, armTrack, walkK, accLean, headAt and blink, with the small helpers they stand on
  // (mj, ease, win, key, k1, mod, lerp3, local, body). walkK, accLean and headAt take the path or keys they read as an argument
  // here (in 42 they read the thief's own); nothing else in them is changed.
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
  function life(seed, t, k = 1, per = 0) {
    const s = (hz, ph) => Math.sin(TAU * ((per ? Math.round(hz * per) / per : hz) * t + ph));
    const b = s(0.26, seed * 0.37), w1 = s(0.09, seed * 0.71), w2 = s(0.14, seed * 0.29 + 0.2), h1 = s(0.19, seed * 0.53), h2 = s(0.31, seed * 0.17 + 0.4);
    return { shrug: 0.009 * b * k, lean: (0.011 * b + 0.015 * w1) * k, twist: 0.04 * w2 * k, headYaw: (0.045 * h1 + 0.02 * h2) * k, headPitch: (0.024 * h2 - 0.014 * b) * k, headTilt: 0.028 * w1 * k };
  }
  function hermite(ks) {
    return (t) => {
      let i = 0; while (i < ks.length - 2 && t > ks[i + 1][0]) i++;
      const [t0, s0, v0] = ks[i], [t1, s1, v1] = ks[i + 1], d = t1 - t0, u = clamp((t - t0) / d), u2 = u * u, u3 = u2 * u;
      return [(2 * u3 - 3 * u2 + 1) * s0 + (u3 - 2 * u2 + u) * d * v0 + (-2 * u3 + 3 * u2) * s1 + (u3 - u2) * d * v1,
        ((6 * u2 - 6 * u) * s0 + (3 * u2 - 4 * u + 1) * d * v0 + (-6 * u2 + 6 * u) * s1 + (3 * u2 - 2 * u) * d * v1) / d];
    };
  }
  function local(tr, P) { const sh = Math.sin(tr.h), ch = Math.cos(tr.h), dX = P[0] - tr.x, dZ = P[2] - tr.z; return [dX * sh + dZ * ch, P[1], -dX * ch + dZ * sh]; }
  function grab(J0, tr, side, P, pole, w = 1, back = 0.06) {
    const q = local(tr, P), sh = side === 'l' ? J0.shL : J0.shR, d = [q[0] - sh[0], q[1] - sh[1], q[2] - sh[2]], n = Math.hypot(...d) || 1;
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
    let st = null; for (let j = 0; j < i; j++) st = move(st, keys[j], keys[j + 1][0], J0, side, ease0);   // where the hand is as each move begins
    return move(st, keys[i], t, J0, side, ease0);
  }
  // how much of the walk is in the body: it falls away as he stops, a moment after he does (path: a hermite → [s, speed])
  function walkK(t, PATH) { let s = 0, W = 0; for (let k = 0; k < 12; k++) { const tau = k * 0.04, w = Math.exp(-tau / 0.13); s += w * clamp(PATH(t - tau)[1] / 0.5); W += w; } return s / W; }
  const AZ = 0.42, AW = TAU * 1.5, AWD = AW * Math.sqrt(1 - AZ * AZ), ADT = 0.03;
  const AIMP = Array.from({ length: 34 }, (_, k) => Math.exp(-AZ * AW * k * ADT) * Math.sin(AWD * k * ADT)), ASUM = AIMP.reduce((a, b) => a + b, 0);
  const accel = (t, PATH) => (PATH(t + 0.02)[1] - PATH(t - 0.02)[1]) / 0.04;
  function accLean(t, PATH) { let x = 0; for (let k = 1; k < AIMP.length; k++) x += AIMP[k] * -accel(t - k * ADT, PATH); return 0.055 * x / ASUM; }   // the trunk's lag behind a start or a stop
  const HZ = 0.55, HW = TAU * 2.4, HWD = HW * Math.sqrt(1 - HZ * HZ), HDT = 0.025;
  const HIMP = Array.from({ length: 22 }, (_, k) => Math.exp(-HZ * HW * k * HDT) * Math.sin(HWD * k * HDT));
  const HSUM = HIMP.reduce((a, b) => a + b, 0), HLAG = HIMP.reduce((a, b, k) => a + b * k * HDT, 0) / HSUM;
  function headAt(t, HEAD) { let y = 0, p = 0; for (let k = 1; k < HIMP.length; k++) { const v = key(t + HLAG - k * HDT, HEAD); y += HIMP[k] * v[0]; p += HIMP[k] * v[1]; } return [y / HSUM, p / HSUM]; }
  function blink(t, seed) {                          // now and then, not like a clock: once in each 3.5 s, somewhere in it
    const P = 3.5, x = t + seed * 7.3, n = Math.floor(x / P), h = (Math.abs(Math.sin(n * 12.9898 + seed * 78.233)) * 43758.5453) % 1, u = x - n * P - (0.3 + 2.6 * h);
    return u < 0 || u > 0.15 ? 0 : u < 0.07 ? sstep(0, 0.07, u) : 1 - sstep(0.08, 0.15, u);
  }

  // ------------------------------------------------------------------ the people (everyone in the season's skin range; no saffron or green on anyone)
  const LOOK = {
    // the old fruit seller: white hair, a big white moustache, a faded blue shirt, a red-and-white gamchha on his shoulder; no glasses
    old: { headK: 0.155, handK: 0.058, skin: '#ab7650', skinD: '#83543a', skinH: '#c8946c', hair: '#e8e2d8', style: 'part', must: 0.17, brow: 0.095, browTilt: -0.05, shirt: '#5f86ad', leg: '#6e6152', shoe: '#5b3b24', sole: '#a08060', girth: 0.94 },
    // the traffic constable: khaki, a peaked cap (drawn over the head), heavy brows; reads his form and never looks up
    cop: { headK: 0.155, handK: 0.058, skin: '#b07650', skinD: '#86553a', skinH: '#cc9670', hair: '#15110d', style: 'buzz', must: 0.13, brow: 0.1, browTilt: 0.06, shirt: '#c4a86f', leg: '#8e7a4e', shoe: '#121214', sole: '#2a2a2e', girth: 1.04,
      police: { crown: '#b39d67', band: '#33271c' }, uniform: { belt: '#4a2e1a', buckle: '#c9a33a', cord: '#f2eee4' } },
    // the driver: young, curly hair, a grey shirt
    driver: { headK: 0.155, handK: 0.058, skin: '#b98258', skinD: '#8f5c3c', skinH: '#d3a07a', hair: '#1b130d', style: 'curly', brow: 0.08, shirt: '#8c96a3', leg: '#3e3a36', shoe: '#2a221c', sole: '#8a7a68', must: 0.05 },
    // the season's thief, as reel 42 draws him (its LOOK.thief), in the background once
    thief: { headK: 0.15, handK: 0.058, skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', style: 'short', cap: true, must: 0.07, stub: 0.55, mole: [0.44, -0.48], brow: 0.08, browTilt: 0.03, shirt: '#37a18a', leg: '#20262f', shoe: '#141414', sole: '#d8d0c0' },
  };
  const STY = {
    old: R.style({ stride: 0.9, cad: 0.95, arm: 0.3, lean: 0.07, slump: 0.6, headFwd: 0.03, stepH: 0.035 }),
    cop: R.style({ stride: 1.12, cad: 0.94, arm: 0.1, chestYaw: 0.05, pelYaw: 0.07, pelRoll: 0.04, sway: 0.016, lean: -0.01, headPitch: 0, headStab: 0.92, nod: 0.004, slump: 0 }),   // upright, measured (the reading tilt is in each pose)
    still: R.style({ stride: 0.5, cad: 1 }),
  };

  // ------------------------------------------------------------------ the crash's clock
  // Frame 0 is the instant before the hit, with time nearly stopped (the rickshaw creeps the last foot while the voice sets
  // it up); as "Watch closely" ends, time ramps up to real speed over a third of a second and the hit plays in real time.
  const T_HIT = B('n02') + 0.06, RAMP0 = T_HIT - 0.06, RAMP1 = T_HIT + 0.32, SLOW = 0.012;
  const ramp = (t) => { if (t <= RAMP0) return 0; const d = RAMP1 - RAMP0; if (t >= RAMP1) return d / 2 + (t - RAMP1); const u = (t - RAMP0) / d; return d * (u * u * u - u * u * u * u / 2); };
  const crashT = (t) => SLOW * (t - T_HIT) + (1 - SLOW) * (ramp(t) - ramp(T_HIT));
  // the shots
  const SH = {
    crash: [0, A('n04') - 0.08],                      // 1-3: the frozen instant, the crash, the aftermath (one camera)
    speed: [WD('n05', 6) - 0.1, A('n06') - 0.55],     // 4b: the speed line, from "going when it smashed"; he writes a beat after
    write: B('n05') + 0.35,
    pick: [A('n06') - 0.55, A('n07')],                // 5: the form turned to you; the ring runs out
    glide: [A('n07'), A('n09')],                      // 6: the real road, low and slow
    taps: [A('n09'), A('n11')],                       // 7a: his pen on the form
    ghost: WD('n09', 5) - 0.1,                        // "...if there was any": the box that isn't there
    mem: [A('n11'), A('n15') - 0.12],                 // 7b: the memory, apart and rebuilt; the word, and its shards
    word: WD('n13', 6) - 0.1,                         // it falls on "whatever it's just heard"
    y74: [A('n15') - 0.12, A('n17') - 0.1],          // 8: 1974
    year: WD('n15', 1) - 0.1, smashW: WD('n15', 7) - 0.08, hitW: WD('n15', 9) - 0.08, week: WD('n15', 14), hands: WD('n15', 17),
    court: [A('n17') - 0.1, A('n18') - 0.08],        // 9: the court
    walk: [A('n18') - 0.08, B('n18') + 0.25],        // 10a: out here
    ck0: B('n18') + 0.25, ck1: B('n20') + 0.45,      // 10b: the checkpoint
    glass: WD('n19', 6) - 0.15,                      // his windscreen, close (from "the police are now looking")
    gather: [B('n20') + 0.45, A('n21') - 0.15],      // the old man, gathering his oranges
    last: [A('n21') - 0.15, END],                     // 11: the last picture
  };

  // ------------------------------------------------------------------ the old man in the crash
  // Placing the last orange (slowly, while time is nearly stopped), then the leap back from the falling cart onto the shop's
  // step, where he sits down hard; he looks at his fruit, down the road where it went, and at you.
  const OLD0 = { x: 0.02, z: S.ROAD_W + 0.1 };
  const APEX = (() => { const b = S.BODIES.find((b) => b.last); return S.at(S.cartState(0).P, b.local); })();
  // what he does (crash seconds): a startled hop back at the hit, frozen with his hands up while the rickshaw goes past, two
  // steps forward to catch his cart as it goes over (too late), his hands to his head; then he looks at his fruit (real time)
  const OLDZ = hermite([[-1, OLD0.z, 0], [0.04, OLD0.z, 0], [0.34, OLD0.z + 0.5, 0], [0.64, OLD0.z + 0.5, 0], [1.02, OLD0.z + 0.06, -0.4], [1.2, OLD0.z + 0.02, 0], [99, OLD0.z + 0.02, 0]]);
  const OLD_ARMS = (side) => [
    [-9, (J) => null, 0.3],
    [0.02, () => body([0.16, 0.42, side * 0.22], [0.1, -1, side * 0.9]), 0.16, 'g'],          // up, palms out: the bang
    [0.66, (J, u) => { const b = barAt(u); return grab(J, OLD_TR(u), side > 0 ? 'l' : 'r', [b[0] + side * 0.28, b[1], b[2]], [0.3, -0.7, side * 0.8], 1, 0.05); }, 0.3],   // reaching for the cart
    [1.12, () => body([0.38, 0.06, side * 0.2], [0.2, -1, side * 0.8]), 0.3],                // it's gone out of his reach
    [1.5, () => body([0.02, 0.3, side * 0.16], [0.1, 0.2, side * 1]), 0.42],                 // hands to his head
    [2.5, null, 0.7],
  ];
  const barAt = (u) => S.at(S.cartState(u).P, [0, S.CART.barY, 0]);
  const OLD_TR = (u) => ({ x: OLD0.x, z: OLDZ(Math.max(0, u))[0], h: PI, tg: 0 });
  function oldMan(t, tau, cam) {
    const place = clamp(t / (T_HIT - 0.4));                       // his own slow clock for the placing
    const u = tau > 0 ? tau : 0, z = OLDZ(u)[0], lf = life(2.2, t, 0.6);
    const stepK = Math.abs(z - OLD0.z) / 0.9;
    const tr = { x: OLD0.x, z, h: PI, tg: -stepK };
    const lean0 = lerp(0.5, 0.46, place);                          // bent over the cart, reaching for the top of the pyramid
    // where he looks, in real time after the crash: at his fruit, down the road where it went, then at you
    const tA = A('n03'), tB = A('n04');
    const toCam = cam ? R.wrap(Math.atan2(cam.x - OLD0.x, cam.z - z) - PI) : 0, road = -1.05;
    const after = k1(t, [[0, 0], [tA + 0.35, 0], [tA + 0.8, 1], [tB - 0.15, 1], [tB + 0.35, 2], [99, 2]]);   // 0 his fruit, 1 down the road, 2 you
    const lookYaw = tau <= 0 ? 0 : u < 0.62 ? 0.55 * ease(0.08, 0.35, u) : u < 2.2 ? 0 : after < 1 ? road * after : lerp(road, toCam, after - 1);
    const lookPitch = tau <= 0 ? -0.5 : u < 0.62 ? 0.1 : u < 1.5 ? -0.25 : u < 2.2 ? -0.42 : after < 1 ? lerp(-0.45, -0.02, after) : lerp(-0.02, -0.08, after - 1);
    const pose = {
      walk: u > 0.62 && u < 1.1 ? 0.45 : 0, dyn: 0.4,
      lean: (tau <= 0 ? lean0 : lerp(lean0, -0.2, ease(0.0, 0.1, u)) + 0.5 * win(u, 0.62, 0.9, 1.15, 1.6) - 0.12 * win(u, 1.5, 1.7, 2.3, 2.8)) + lf.lean,
      sink: 0.06 * win(u, 0.0, 0.04, 0.3, 0.4) + 0.08 * win(u, 0.8, 1.0, 1.2, 1.5),
      headPitch: lerp(lookPitch, lookPitch, 1) + lf.headPitch, headYaw: lookYaw + lf.headYaw, twist: lf.twist, shrug: 0.08 * win(u, 0.0, 0.06, 0.4, 0.6) + 0.06 * win(u, 1.5, 1.7, 2.3, 2.6),
    };
    const J0 = R.skel(STY.old, tr.tg, pose);
    const hl = [APEX[0] + 0.07, APEX[1] + 0.04 * (1 - place) + 0.01, APEX[2] - 0.01], hr = [APEX[0] - 0.07, APEX[1] + 0.04 * (1 - place) + 0.01, APEX[2] - 0.01];
    const arms = {};
    if (tau <= 0.02) { arms.l = grab(J0, tr, 'l', hl, [0.3, -0.8, 0.8], 1, 0.05); arms.r = grab(J0, tr, 'r', hr, [0.3, -0.8, -0.8], 1, 0.05); }
    else {
      const from = (side) => grab(J0, tr, side > 0 ? 'l' : 'r', side > 0 ? hl : hr, [0.3, -0.8, side * 0.8], 1, 0.05);
      for (const side of [1, -1]) { const keys = OLD_ARMS(side); keys[0] = [-9, () => from(side), 0.3]; const a = armTrack(u, J0, keys, side, 0.26); if (a) arms[side > 0 ? 'l' : 'r'] = a; }
    }
    pose.arms = arms;
    const face = {
      look: tau <= 0 ? [0, -0.05] : [0, 0.03], wide: tau <= 0 ? 0.5 * place : 1 - 0.55 * ease(2.2, 3.0, u),
      op: tau <= 0 ? 0.08 : 0.6 * win(u, 0.02, 0.07, 0.3, 0.5) + 0.55 * win(u, 0.95, 1.05, 1.4, 1.8),
      browY: tau <= 0 ? 0.05 * place : 0.1 - 0.05 * ease(2.2, 3.0, u), browUp: 0.05 * win(u, 1.5, 1.8, 3, 4), close: blink(t, 0.7) * (tau > 0 && tau < 2 ? 0 : 1),
    };
    const handPose = tau <= 0.02 ? { l: 'grip', r: 'grip' } : u < 1.4 ? { l: 'open', r: 'open' } : { l: 'relax', r: 'relax' };
    return { tr, pose, face, handPose, place };
  }


  // ------------------------------------------------------------------ the traffic constable: he reads his form and never looks up
  const COP = { x0: 3.4, x1: 1.12, z: 5.25 };
  const COPPATH = hermite([[-99, COP.x0, 0], [B('n04') - 0.45, COP.x0, -0.4], [A('n05') + 0.2, COP.x1, 0], [999, COP.x1, 0]]);
  function copState(t, cam) {
    const s = COPPATH(t), x = s[0];
    const turn = ease(A('n05') - 0.1, A('n05') + 0.5, t), face = cam ? Math.atan2(cam.x - x, cam.z - COP.z) : -2.4;
    const tr = { x, z: COP.z, h: lerp(-PI / 2, face + 0.75, turn), tg: (COP.x0 - x) / STY.cop.stride * 2 };
    const wk = walkK(t, COPPATH), lf = life(3.1, t, 1 - wk);
    const pose = { walk: Math.min(1, wk * 1.2), dyn: wk, lean: -0.01 + lf.lean * 0.6 + accLean(t, COPPATH) * 0.6, twist: lf.twist * 0.5, shrug: lf.shrug, headPitch: 0.36 + lf.headPitch * 0.3, headYaw: 0.08 * lf.headYaw };
    const J0 = R.skel(STY.cop, tr.tg, pose);
    const board = BOARD;
    const pointAt = cam ? (() => { const d = [cam.x + 0.4 - x, 0, cam.z - COP.z], n = Math.hypot(d[0], d[2]); return [x + d[0] / n * 0.5 + 0.08, 1.2, COP.z + d[2] / n * 0.5]; })() : null;   // the pen held out at you, in front of his chest
    const pt0 = A('n05') + 0.45, pt1 = B('n05') - 0.15, sc0 = B('n05') + 0.25;
    const r = armTrack(t, J0, [
      [-99, () => body([board[0] + 0.01, board[1] + 0.02, -0.05], [0.2, -1, -0.8]), 0.3],
      [pt0, (J, u) => (pointAt ? grab(J, tr, 'r', [pointAt[0], pointAt[1] + 0.035 * Math.sin((u - pt0) * 14) * win(u, pt0 + 0.3, pt0 + 0.45, pt1 - 0.6, pt1 - 0.3), pointAt[2]], [0.2, -1, -0.9], 1, 0.02) : null), 0.36, 'g'],     // the pen at you, wagging, eyes still on the form
      [pt1, () => body([board[0] + 0.01, board[1] + 0.03, -0.03], [0.2, -1, -0.8]), 0.3],                // back to the form to write
      [sc0, (J, u) => body([board[0] + 0.01 + 0.02 * Math.sin(u * 31), board[1] + 0.03 + 0.008 * Math.sin(u * 19), -0.02 + 0.03 * Math.sin(u * 23)], [0.2, -1, -0.8]), 0.12],
      [sc0 + 0.75, () => body([board[0] + 0.01, board[1] + 0.02, -0.05], [0.2, -1, -0.8]), 0.25],
    ], -1);
    const l = { wrist: [BOARD[0] - 0.02, BOARD[1] - 0.1, BOARD[2] + 0.11], pole: [0.1, -1, 0.9], w: 1 };   // his left hand holds the board's lower edge
    pose.arms = { l, r };
    return { tr, pose, face: { look: [0.0, -0.05], lid: 0.85, close: blink(t, 2.1) * 0.7, browY: -0.02 }, board };   // eyes lowered to his form
  }
  function copFigure(g, cam, t, items) {
    const st = copState(t, cam), W0 = { S: STY.cop, look: LOOK.cop };
    const q = cam.toCam(st.tr.x, 1, st.tr.z); if (q[2] < 0.3) return;
    items.push({ d: q[2], fn: () => {
      R.shadow(g, cam, W0, t, { tr: st.tr, pose: st.pose, a: 0.22, len: 1.4 });
      const F = R.figure(g, cam, W0, t, { tr: st.tr, pose: st.pose, face: st.face, handPose: { l: 'grip', r: 'grip' }, rim: 0.6, hold: { r: (g2, el, wr) => pen(g2, el, wr) } });
      if (!F) return;
      clipboardBack(g, cam, st, F, W0, t, () => R.figure(g, cam, W0, t, { tr: st.tr, pose: st.pose, face: st.face, handPose: { l: 'grip', r: 'grip' }, rim: 0.6, onlyArm: 1 }));
    } });
  }
  const BOARD = [0.27, -0.06, 0.04];                   // the board's middle, from his chest (forward, up, left)
  function pen(g, el, wr) {                         // a ballpoint between his fingers: blue body, a steel clip, a white end
    const dx = wr[0] - el[0], dy = wr[1] - el[1], n = Math.hypot(dx, dy) || 1, u = wr[2], ux = dx / n, uy = dy / n;
    const a = Math.atan2(uy, ux) - 0.55, x = wr[0] + ux * 0.045 * u, y = wr[1] + uy * 0.045 * u;
    g.save(); g.translate(x, y); g.rotate(a); g.lineCap = 'round';
    g.strokeStyle = '#1f2f5c'; g.lineWidth = Math.max(1.6, 0.011 * u); g.beginPath(); g.moveTo(-0.05 * u, 0); g.lineTo(0.065 * u, 0); g.stroke();
    g.strokeStyle = '#f1efe8'; g.beginPath(); g.moveTo(-0.068 * u, 0); g.lineTo(-0.05 * u, 0); g.stroke();
    g.strokeStyle = '#b9bcc2'; g.lineWidth = Math.max(1, 0.004 * u); g.beginPath(); g.moveTo(-0.045 * u, -0.006 * u); g.lineTo(-0.01 * u, -0.006 * u); g.stroke();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.moveTo(0.065 * u, -0.004 * u); g.lineTo(0.08 * u, 0); g.lineTo(0.065 * u, 0.004 * u); g.closePath(); g.fill();
    g.restore();
  }
  // the clipboard, held up in front of him, tilted to his eyes: from the front the paper and the clip, from behind its hardboard
  function clipboardBack(g, cam, st, F, W0, t, fig) {
    if (Math.cos(F.psi) < -0.15) return;                // seen from behind: it's in front of him, out of sight
    const { tr } = st, sh = Math.sin(tr.h), ch = Math.cos(tr.h), J = F.J, y0 = tr.y || 0;
    const w3 = (p) => [tr.x + sh * p[0] - ch * p[2], p[1] + y0, tr.z + ch * p[0] + sh * p[2]];
    const c = [J.chest[0] + st.board[0], J.chest[1] + st.board[1], J.chest[2] + st.board[2]];
    const al = 0.62, ax = [0, 0, 1], ay = [Math.sin(al), Math.cos(al), 0], nn = [-Math.cos(al), Math.sin(al), 0];   // across, up the board, and its face (towards his eyes)
    const pt = (a, b, d = 0) => w3([c[0] + ax[0] * a + ay[0] * b + nn[0] * d, c[1] + ax[1] * a + ay[1] * b + nn[1] * d, c[2] + ax[2] * a + ay[2] * b + nn[2] * d]);
    const P = (a, b, d = 0) => { const w = pt(a, b, d); return cam.P(w[0], w[1], w[2]); };
    const nw = (() => { const a = pt(0, 0, 0), b = pt(0, 0, 1); return [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; })(), cw = pt(0, 0, 0);
    const facing = (cam.x - cw[0]) * nw[0] + (cam.y - cw[1]) * nw[1] + (cam.z - cw[2]) * nw[2] > 0;
    const quad = (k, col, edge) => { if (k.some((q) => !q)) return; g.beginPath(); k.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fillStyle = col; g.fill(); if (edge) { g.strokeStyle = edge; g.lineWidth = 1.5; g.stroke(); } };
    const hw = 0.115, hh = 0.155, th = 0.007;
    g.save(); g.lineJoin = 'round';
    // its edge (thickness), then the face you can see
    quad([P(-hw, -hh, -th), P(hw, -hh, -th), P(hw, -hh, th), P(-hw, -hh, th)], '#5e3c20');
    quad([P(hw, -hh, -th), P(hw, hh, -th), P(hw, hh, th), P(hw, -hh, th)], '#6a4424');
    if (!facing) quad([P(-hw, -hh, -th), P(hw, -hh, -th), P(hw, hh, -th), P(-hw, hh, -th)], '#8a5a33', '#5a3a1f');
    else {
      quad([P(-hw, -hh, th), P(hw, -hh, th), P(hw, hh, th), P(-hw, hh, th)], '#8a5a33', '#5a3a1f');
      quad([P(-hw + 0.01, -hh + 0.012, th + 0.001), P(hw - 0.01, -hh + 0.012, th + 0.001), P(hw - 0.01, hh - 0.03, th + 0.001), P(-hw + 0.01, hh - 0.03, th + 0.001)], '#f1ede2');
      g.strokeStyle = 'rgba(40,46,60,0.35)'; g.lineWidth = 1.2;
      for (let i = 0; i < 7; i++) { const b = hh - 0.07 - i * 0.034, p0 = P(-hw + 0.025, b, th + 0.002), p1 = P(hw - 0.03 - 0.03 * (i % 3), b, th + 0.002); if (p0 && p1) { g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); } }
    }
    // the steel clip across the top, on whichever side faces you
    const cd = facing ? th + 0.006 : -th - 0.006;
    quad([P(-0.05, hh - 0.045, cd), P(0.05, hh - 0.045, cd), P(0.05, hh + 0.012, cd), P(-0.05, hh + 0.012, cd)], '#8c8f95', '#5d6066');
    g.restore();
    if (fig) fig();                                     // his hand back over the board's edge
  }


  // ------------------------------------------------------------------ the driver, seated, carried by his rickshaw
  function driverFigure(g, cam, rk, t, o = {}) {
    const seat = [1.0, 0.36, 0];                                    // his pelvis's place in the rickshaw (forward, up, left), feet on its floor
    const J = R.skel(STY.still, 0, { walk: 0, sink: 0.36, sit: 0.36, lean: o.lean ?? 0.14, headPitch: o.pitch ?? 0, headYaw: o.yaw ?? 0, headTilt: (o.tilt || 0) - rk.roll * 0.4 });
    const bar = (s) => [1.42 - seat[0], 1.0 - 0.3, s * 0.28];          // the handlebar's grips, from his feet's frame
    const arms = { l: { wrist: S.sub(bar(1), J.chest).map((v, i) => v + (i === 0 ? -0.04 : 0)), pole: [0, -1, 0.9], w: 1 }, r: { wrist: S.sub(bar(-1), J.chest).map((v, i) => v + (i === 0 ? -0.04 : 0)), pole: [0, -1, -0.9], w: 1 } };
    const J2 = R.skel(STY.still, 0, { walk: 0, sink: 0.36, sit: 0.36, lean: o.lean ?? 0.14, headPitch: o.pitch ?? 0, headYaw: o.yaw ?? 0, headTilt: (o.tilt || 0) - rk.roll * 0.4, arms });
    // his joints carried by the rickshaw's whole pose (its roll and pitch too), handed to the rig as joints from elsewhere
    const P = rk.P, pel = S.at(P, [seat[0], 0.3, seat[2]]), h = rk.h, sh = Math.sin(h), ch = Math.cos(h);
    const Jw = { ...J2 };
    for (const k of ['pel', 'chest', 'neck', 'head', 'shL', 'shR', 'elL', 'elR', 'wrL', 'wrR', 'hL', 'hR', 'knL', 'knR', 'anL', 'anR', 'heL', 'heR', 'toL', 'toR']) {
      const j = J2[k], w = S.at(P, [seat[0] + j[0], 0.3 + j[1], seat[2] + j[2]]), dX = w[0] - pel[0], dZ = w[2] - pel[2];
      Jw[k] = [sh * dX + ch * dZ, w[1], -ch * dX + sh * dZ];
    }
    const tr = { x: pel[0], z: pel[2], h, tg: 0 };
    return R.figure(g, cam, { S: STY.still, look: LOOK.driver }, t, { tr, J: Jw, face: o.face || {}, handPose: { l: 'grip', r: 'grip' }, rim: 0.4 });
  }

  // ------------------------------------------------------------------ the season's thief, hidden once: his back to the road at the chai stall
  const CHAI = { x: -6.6, z: 6.9 };
  function thiefCameo(g, cam, t, out) {
    const tr = { x: CHAI.x + 0.62, z: CHAI.z - 0.28, h: -0.55, tg: 0 };
    const sip = win(mod(t, 5.2), 0.6, 1.1, 2.4, 2.9), lf = life(5.5, t, 1);
    const J0 = R.skel(STY.still, 0, { walk: 0, lean: lf.lean, twist: lf.twist, shrug: lf.shrug, headPitch: 0.25 * sip - 0.05, headYaw: lf.headYaw * 0.5 });
    const lips = [J0.head[0] + 0.13, J0.head[1] - 0.06, J0.head[2] - 0.04], low = [0.3, -0.1, -0.1];
    const arms = { r: { wrist: lerp3(S.sub(low, [0, 0, 0]), S.sub(lips, J0.chest), sip), pole: [0.3, -1, -0.8], w: 1 } };
    const pose = { walk: 0, lean: lf.lean, twist: lf.twist, shrug: lf.shrug, headPitch: 0.25 * sip - 0.05, headYaw: lf.headYaw * 0.5, arms };
    const q = cam.toCam(tr.x, 1, tr.z);
    out.push({ d: q[2], fn: () => {
      g.save(); g.filter = 'blur(1.6px)';                // soft: he's not what the shot is about
      R.shadow(g, cam, { S: STY.still, look: LOOK.thief }, t, { tr, pose, a: 0.16, len: 1.2 });
      R.figure(g, cam, { S: STY.still, look: LOOK.thief }, t, { tr, pose, handPose: { r: 'grip', l: 'relax' }, rim: 0.5, hold: { r: (g2, el, wr) => chaiGlass(g2, el, wr) } });
      g.restore();
    } });
  }
  function chaiGlass(g, el, wr) {                     // a small chai glass in his fingers: whole, the tea in it
    const dx = wr[0] - el[0], dy = wr[1] - el[1], n = Math.hypot(dx, dy) || 1, u = wr[2], x = wr[0] + dx / n * 0.05 * u, y = wr[1] + dy / n * 0.05 * u;
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(214,232,236,0.55)'; g.beginPath(); g.moveTo(-0.028 * u, -0.05 * u); g.lineTo(0.028 * u, -0.05 * u); g.lineTo(0.022 * u, 0.04 * u); g.lineTo(-0.022 * u, 0.04 * u); g.closePath(); g.fill();
    g.fillStyle = '#c07a3a'; g.beginPath(); g.moveTo(-0.026 * u, -0.02 * u); g.lineTo(0.026 * u, -0.02 * u); g.lineTo(0.022 * u, 0.038 * u); g.lineTo(-0.022 * u, 0.038 * u); g.closePath(); g.fill();
    g.restore();
  }
  function chaiStall(cam, t) {                        // a little stall on the pavement: a wooden counter, a stove, a big kettle, steam
    const P = S.pose([CHAI.x, S.KERB_H, CHAI.z], PI / 2), f = [];
    f.push(...S.box(P, 0, 0.45, 0, 0.55, 0.45, 0.32, '#8a5a34', { top: '#a8784a' }));
    f.push(...S.box(P, 0.15, 0.95, 0, 0.2, 0.05, 0.18, '#3a3a3c'));
    f.push(...S.tube(P, [0.15, 1.0, 0], [0.15, 1.2, 0], 0.11, '#b8b4ac', 10));
    f.push(...S.tube(P, [0.15, 1.2, 0], [0.15, 1.24, 0], 0.06, '#9a968e', 8));
    f.push(...S.box(P, -0.38, 0.97, 0.05, 0.1, 0.07, 0.1, '#c9a24a'));        // a tin of biscuits (tin, not a glass jar)
    return f;
  }

  // ------------------------------------------------------------------ the crash wide: frame 0 to the officer
  // The witness stands at the near kerb, a little to the right, looking across and up the road the rickshaw comes down.
  function camCrash(t) {
    // frame 0 to the hit: a slow drift in; the hit: a jolt, a small flinch, then still (a witness who can't look away)
    const pre = clamp(t / T_HIT), tau = crashT(t), after = Math.max(0, t - T_HIT);
    const shake = t > T_HIT ? 0.014 * Math.exp(-after / 0.16) * Math.sin(after * 66) * ease(T_HIT, T_HIT + 0.04, t) : 0, flinch = win(tau, 0.0, 0.12, 0.5, 1.4);
    return R.camera({
      x: lerp(3.42, 3.3, mj(pre)) + 0.06 * flinch, y: 1.5 + shake - 0.02 * flinch, z: lerp(-0.45, -0.3, mj(pre)) - 0.08 * flinch,
      yaw: -0.75 + 0.03 * ease(0.3, 1.6, tau) + shake * 0.4, pitch: -0.012, f: lerp(1280, 1340, mj(pre)), cx: 540, cy: 960,
    });
  }
  // the twist: the real road, low and slow, from the left end of the mess to the cart (the rickshaw long gone)
  function camGlide(t) {
    const u = clamp((t - SH.glide[0]) / (SH.glide[1] - SH.glide[0] + 0.5)), e = 0.35 * u + 0.65 * mj(u);
    return R.camera({ x: lerp(-2.0, 1.9, e), y: lerp(0.5, 0.42, e), z: lerp(0.55, 0.75, e), yaw: lerp(0.42, 0.12, e), pitch: -0.2, f: 1250, cx: 540, cy: 960 });
  }

  // the old man on the shop's step, and the officer who comes to him (a medium two-shot; the witness has crossed the road)
  function camStep(t) {
    const k = ease(A('n04') - 0.1, A('n04') + 2.6, t), j = ease(B('n04') - 0.3, A('n05') + 0.4, t);
    return R.camera({ x: lerp(-2.25, -2.2, k) + 0.12 * j, y: 1.52, z: lerp(2.5, 2.62, k) - 0.05 * j, yaw: lerp(0.78, 0.8, k) + 0.07 * j, pitch: -0.035, f: lerp(2500, 2580, k) - 260 * j, cx: 540, cy: 960 });
  }


  function crashFrame(g, t, cam, o = {}) {
    const tau = o.tau ?? crashT(t), L = o.layer, want = (k) => !L || L === k;
    // the street behind (soft), then everything on it in depth order
    if (want('bg')) S.drawItems(g, cam, S.faceItems(cam, S.STATIC));
    const items = [];
    if (want('bg')) { S.faceItems(cam, S.awnings(t), items); S.faceItems(cam, chaiStall(cam, t), items); if (!o.noThief) thiefCameo(g, cam, t, items); }
    const cs = S.cartState(tau), rk = S.rkState(tau);
    // shadows on the ground first: the cart's, the rickshaw's, the fruit's, his
    if (want('cart')) groundShadow(g, cam, cs.P, [[-1.0, -0.5], [1.0, -0.5], [1.0, 0.5], [-1.0, 0.5]], 1.4, 0.24);
    if (want('rk') && tau < 3.5) groundShadow(g, cam, rk.P, [[-0.45, -0.62], [1.95, -0.3], [1.95, 0.3], [-0.45, 0.62]], 1.8, 0.28);
    // the cart and its wheels
    if (want('cart')) { S.faceItems(cam, S.cartFaces(cs.P), items); S.cartWheels(g, cam, cs.P, cs.spin, items); }
    // the rickshaw: its body, wheels, the driver, then its glass and front over him
    if (want('rk') && !o.noRk && tau < 3.6) rickshawItems(g, cam, rk, t, tau, items);
    // the fruit and the scale
    if (want('fruit') || want('cart')) fruitItems(g, cam, tau, t, items, L);
    // the old man
    if (!o.noOld && want('old')) {
      const om = oldMan(t, tau, cam), W0 = { S: STY.old, look: LOOK.old };
      const q = cam.toCam(om.tr.x, 1, om.tr.z);
      items.push({ d: q[2] + 0.05, fn: () => {
        R.shadow(g, cam, W0, t, { tr: om.tr, pose: om.pose, a: 0.22, len: 1.4 });
        const F = R.figure(g, cam, W0, t, { tr: om.tr, pose: om.pose, face: om.face, handPose: om.handPose, rim: 0.6 });
        if (F && !(tau > 0.02)) {                    // the last orange, between his hands until he lets go of it
          const b = S.BODIES.findIndex((b) => b.last), p = APEX, pp = [p[0], p[1] + 0.04 * (1 - om.place), p[2]];
          S.orange(g, cam, pp, S.ORANGE_R, S.bodyAt(0, b).q);
          R.figure(g, cam, W0, t, { tr: om.tr, pose: om.pose, face: om.face, handPose: om.handPose, rim: 0.6, onlyArm: 1 });
          R.figure(g, cam, W0, t, { tr: om.tr, pose: om.pose, face: om.face, handPose: om.handPose, rim: 0.6, onlyArm: -1 });
        }
        gamchha(g, cam, F);
      } });
    }
    if (o.extra) o.extra(items);
    S.drawItems(g, cam, items);
  }
  function groundShadow(g, cam, P, pts, len, a) {     // a body's shadow, cast away from the sun onto the road
    const d = [-S.SUN[0] / S.SUN[1], 0, -S.SUN[2] / S.SUN[1]], w = pts.map(([x, z]) => S.at(P, [x, 0, z])).map((p) => [p[0], 0.004 + S.groundY(p[0], p[2]), p[2]]);
    const far = w.map((p) => [p[0] + d[0] * 0.35 * len, p[1], p[2] + d[2] * 0.35 * len]);
    const all = w.concat(far).map((p) => cam.P(p[0], p[1], p[2])); if (all.some((p) => !p)) return;
    const hull = hull2(all);
    g.save(); g.filter = 'blur(6px)'; g.fillStyle = `rgba(42,30,44,${a})`; g.beginPath(); hull.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); g.restore();
  }
  function hull2(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    const up = []; for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  function gamchha(g, cam, F) {                       // his red-and-white checked cloth, folded over his right shoulder
    if (!F) return;
    const n = F.P.neck, a = F.P.shR, c = F.P.chest, p = F.P.pel, s = a[2];
    if (Math.cos(F.psi) < -0.2) return;               // from behind it's on his back: not drawn
    const l2 = (u, v, k) => [lerp(u[0], v[0], k), lerp(u[1], v[1], k)];
    const t0 = l2(n, a, 0.42), t1 = l2(n, a, 0.98), dx = (p[0] - c[0]) * 0.42, dy = (p[1] - c[1]) * 0.42;
    const pts = [[t0[0], t0[1] - 0.012 * s], [t1[0], t1[1] - 0.016 * s], [t1[0] + dx * 0.9, t1[1] + dy], [t0[0] + dx * 1.05, t0[1] + dy * 1.08]];
    g.save(); g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath();
    g.fillStyle = '#c4423a'; g.fill(); g.clip();
    g.strokeStyle = 'rgba(255,238,224,0.7)'; g.lineWidth = Math.max(1, 0.006 * s);
    const ux = t1[0] - t0[0], uy = t1[1] - t0[1];
    for (let k = 1; k < 4; k++) { const q0 = [t0[0] + ux * k / 4, t0[1] + uy * k / 4]; g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q0[0] + dx * 1.1, q0[1] + dy * 1.1); g.stroke(); }
    for (let k = 1; k < 5; k++) { const q0 = [t0[0] + dx * k / 5, t0[1] + dy * k / 5]; g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q0[0] + ux, q0[1] + uy); g.stroke(); }
    g.fillStyle = 'rgba(80,20,20,0.25)'; g.fillRect(-9999, -9999, 1, 1);
    g.restore();
    g.strokeStyle = 'rgba(90,20,18,0.5)'; g.lineWidth = Math.max(1, 0.006 * s); g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.stroke();
  }
  function rickshawItems(g, cam, rk, t, tau, items) {
    const P = rk.P, faces = S.rickshawFaces(P);
    S.faceItems(cam, faces, items);
    for (const [x, z] of [[0, S.RK.rearZ], [0, -S.RK.rearZ], [S.RK.frontX, 0]]) {
      const it = S.wheelItem(g, cam, S.at(P, [x, S.RK.rw, z]), S.dirOf(P, [0, 0, 1]), S.RK.rw, -rk.spin, { w: 0.05, spokes: 0, rimK: 0.62, rimC: '#7d7a75', rimIn: '#4a4845', hub: '#2a2a2c', cap: '#9a968e' });
      if (it) items.push(it);
    }
    const dq = cam.toCam(...S.at(P, [1.0, 1.0, 0]));
    items.push({ d: dq[2], fn: () => {
      const face = tau > 0.03 && tau < 1.6 ? { wide: 1, op: 0.5 * win(tau, 0.04, 0.1, 0.6, 0.9), browY: 0.08 } : {};
      driverFigure(g, cam, rk, t, { face, lean: tau > 0 && tau < 0.4 ? 0.3 : 0.14, pitch: tau > 0.05 && tau < 0.5 ? -0.2 : 0 });
    } });
    const fq = cam.toCam(...S.at(P, [1.62, 1.2, 0]));
    items.push({ d: fq[2] - 0.05, fn: () => {
      const glintA = win(tau, S.PAPAYA_HIT.tau + 0.02, S.PAPAYA_HIT.tau + 0.08, S.PAPAYA_HIT.tau + 0.32, S.PAPAYA_HIT.tau + 0.45);
      S.rickshawFront(g, cam, P, { wiper: rk.wiper, glint: lerp(-0.2, 1.2, clamp((tau - S.PAPAYA_HIT.tau) / 0.5)), glintA, hlK: 0.7, splat: (g2, Sx) => splat(g2, Sx, tau) });
      charmAt(g, cam, rk, tau, t);
    } });
  }
  // the lemon and chillies swing with the rickshaw: a pendulum driven by its speeding up and slowing down
  const CHARM = (() => { const out = [], dt = 1 / 480; let th = -0.25, om = 0; for (let i = 0; i <= 480 * 4.5; i++) { const tau = i * dt, a = (S.rkState(tau + 0.005).sp - S.rkState(tau - 0.005).sp) / 0.01; out.push(th); om += (-(9.81 / 0.2) * Math.sin(th) - (a / 0.2) * Math.cos(th) - 2.2 * om) * dt; th += om * dt; } return out; })();
  function charmAt(g, cam, rk, tau, t) {
    const th = tau <= 0 ? -0.25 + 0.02 * Math.sin(t * 1.3) : CHARM[Math.min(CHARM.length - 1, Math.floor(tau * 480))];
    S.charm(g, cam, rk.P, th, 0.1 * Math.sin(t * 2.1) * (tau <= 0 ? 0.3 : 1));
  }
  // the papaya on the glass: it lands, squashes, runs a little, and the wiper smears it once into a fan (nothing else touches the glass)
  function splat(g, Sx, tau) {
    const t0 = S.PAPAYA_HIT.tau; if (tau < t0) return;
    const u = tau - t0, [cu, cv] = S.PAPAYA_HIT.uv, sq = mj(u / 0.05);
    const wipeA = S.rkState(tau).wiper, swept = tau > S.WIPE[0], done = tau > S.WIPE[2];
    const P = (du, dv) => Sx(S.wsPt(cu + du, cv + dv));
    const blob = (rx, ry, wob, col, seed, dy = 0) => {
      g.beginPath();
      for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, r = 1 + wob * (Math.sin(a * 5 + seed) * 0.5 + Math.sin(a * 9 + seed * 2) * 0.3), q = P(Math.cos(a) * rx * r, Math.sin(a) * ry * r + dy); if (!q) return; if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }
      g.closePath(); g.fillStyle = col; g.fill();
    };
    const clean = done ? 0 : swept ? 1 - clamp(wipeA / 1.95 * 1.6) : 1;
    if (clean > 0.01) {
      g.globalAlpha = clean;
      // drips running down the glass
      for (let k = 0; k < 4; k++) { const dx = -0.08 + k * 0.055, l = clamp((u - 0.05) * (0.25 + 0.12 * k)) * 0.16; const a = P(dx, -0.02), b = P(dx, -0.04 - l); if (a && b) { g.strokeStyle = '#ef8f2e'; g.lineCap = 'round'; g.lineWidth = Math.max(1.5, 0.018 * a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
      blob(0.16 * sq + 0.02, 0.16 * sq + 0.02, 0.22, '#9fbf3a', 1.3);                // skin, burst open
      blob(0.13 * sq + 0.015, 0.13 * sq + 0.015, 0.25, '#f39a2c', 2.1);             // the orange flesh
      blob(0.07 * sq + 0.01, 0.06 * sq + 0.01, 0.2, '#f6b04a', 3.4, 0.01);
      g.fillStyle = '#1a120c';                                                     // black seeds, plainly a papaya
      for (let k = 0; k < 16; k++) { const a = k * 2.39, d = 0.012 + 0.05 * S.hash(k + 40), q = P(Math.cos(a) * d * sq, Math.sin(a) * d * sq + 0.005); if (q) { g.beginPath(); g.arc(q[0], q[1], Math.max(1, 0.012 * q[2]), 0, TAU); g.fill(); } }
      g.globalAlpha = 1;
    }
    if (swept) {                                       // the wiper's fan: an orange smear swept along its arc
      const k = done ? 1 : clamp(wipeA / 1.95 * 1.6), pv = [S.WIPER.u, 0.03];
      g.globalAlpha = 0.6 * k;
      g.beginPath();
      const arc = (r, a0, a1, n = 16) => { const pts = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), q = Sx(S.wsPt(pv[0] - Math.cos(a) * r / 0.86, pv[1] + Math.sin(a) * r / 0.53)); if (q) pts.push(q); } return pts; };
      const outer = arc(0.42, 0.25, 1.85), inner = arc(0.16, 1.85, 0.25);
      [...outer, ...inner].forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath();
      g.fillStyle = '#e8902f'; g.fill();
      g.globalAlpha = 0.5 * k; g.strokeStyle = '#d06a1a'; g.lineWidth = 1.5;
      for (const r of [0.22, 0.28, 0.34, 0.39]) { const pts = arc(r, 0.35, 1.75); g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); }
      g.globalAlpha = 0.8 * k; g.fillStyle = '#1a120c';
      for (let i = 0; i < 6; i++) { const a = 0.5 + i * 0.22, r = 0.3 + 0.06 * S.hash(i + 9), q = Sx(S.wsPt(pv[0] - Math.cos(a) * r / 0.86, pv[1] + Math.sin(a) * r / 0.53)); if (q) { g.beginPath(); g.arc(q[0], q[1], Math.max(1, 0.01 * q[2]), 0, TAU); g.fill(); } }
      g.globalAlpha = 1;
    }
  }
  function fruitItems(g, cam, tau, t, items, layer) {
    const halves = S.melonHalves(tau);
    S.BODIES.forEach((b, i) => {
      if (b.last && tau <= 0.02) return;              // in his hands (drawn with him)
      const s = S.bodyAt(tau, i); if (!s.on) return;
      if (b.kind === 'melon' && halves) return;
      if (layer) { const onCart = S.toLocal(S.cartState(tau).P, s.p)[1] > S.CART.top - 0.05 && Math.abs(S.toLocal(S.cartState(tau).P, s.p)[2]) < 0.7; if ((layer === 'cart') !== onCart) return; }
      const q = cam.toCam(s.p[0], s.p[1], s.p[2]); if (q[2] < 0.2) return;
      items.push({ d: q[2], fn: () => {
        if (b.kind === 'orange') { S.shadowDisc(g, cam, s.p, b.r, 0.32); S.orange(g, cam, s.p, b.r, s.q); }
        else if (b.kind === 'papaya') { S.shadowDisc(g, cam, s.p, 0.1, 0.3, 1.3); S.papaya(g, cam, s.p, s.q); }
        else if (b.kind === 'melon') { S.shadowDisc(g, cam, s.p, b.r, 0.34); S.melon(g, cam, s.p, b.r, s.q); }
        else if (b.kind === 'weight') { S.shadowDisc(g, cam, s.p, 0.035, 0.3); S.weight(g, cam, s.p, s.q); }
        else if (b.kind === 'banana') {
          const hk = tau < b.lets ? S.at(S.cartState(tau).P, b.hang) : null, d = hk ? S.nrm(S.sub(s.p, hk)) : S.qrot(s.q, [0, -1, 0]);
          if (hk) { const a = cam.P(...hk), c = cam.P(...s.p); if (a && c) { g.strokeStyle = '#6b5a2a'; g.lineWidth = Math.max(1, 0.006 * a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.stroke(); } }
          S.shadowDisc(g, cam, s.p, 0.12, 0.25); S.banana(g, cam, hk ? s.p : S.add(s.p, S.mul(d, -0.12)), d);
        } else if (b.kind === 'pan') {
          const beam = S.bodyAt(tau, S.BODIES.findIndex((x) => x.kind === 'beam'));
          const onG = s.p[1] < S.groundY(s.p[0], s.p[2]) + 0.09, n = onG ? S.nrm([0.25 * Math.sin(t * 9 + i) * Math.exp(-Math.max(0, tau - 1) * 2), 1, 0.1]) : [0, 1, 0];
          if (!onG) { const a = cam.P(...beam.p), c = cam.P(...s.p); if (a && c) { g.strokeStyle = 'rgba(80,70,50,0.8)'; g.lineWidth = Math.max(1, 0.004 * a[2]); g.beginPath(); for (const dx of [-0.08, 0, 0.08]) { const e = cam.P(s.p[0] + dx, s.p[1], s.p[2]); if (e) { g.moveTo(a[0], a[1]); g.lineTo(e[0], e[1]); } } g.stroke(); } }
          S.shadowDisc(g, cam, s.p, 0.13, 0.28); S.pan(g, cam, s.p, n);
        } else if (b.kind === 'beam') {
          const hk = tau < b.lets ? S.at(S.cartState(tau).P, b.hang) : null, a = cam.P(s.p[0] - 0.24, s.p[1], s.p[2]), c = cam.P(s.p[0] + 0.24, s.p[1], s.p[2]);
          if (a && c) { g.strokeStyle = '#8a7432'; g.lineCap = 'round'; g.lineWidth = Math.max(1.5, 0.018 * a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.stroke(); }
          if (hk) { const h = cam.P(...hk), m = cam.P(...s.p); if (h && m) { g.strokeStyle = 'rgba(80,70,50,0.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(h[0], h[1]); g.lineTo(m[0], m[1]); g.stroke(); } }
        }
      } });
    });
    if (halves) for (const h of halves) { const q = cam.toCam(...h.p); items.push({ d: q[2], fn: () => { S.shadowDisc(g, cam, h.p, h.r, 0.34); S.melonHalf(g, cam, h.p, h.r, h.n); } }); }
    // the papaya in the air, on its way to the glass
    const fi = S.BODIES.findIndex((b) => b.flies), fs = S.bodyAt(tau, fi);
    if (tau > 0 && tau < S.PAPAYA_HIT.tau && fs.on) { const q = cam.toCam(...fs.p); items.push({ d: q[2] - 0.3, fn: () => S.papaya(g, cam, fs.p, fs.q) }); }
  }
  // speed lines behind the rickshaw in the frozen instant (they stream, so the frame is never still)
  function speedLines(g, cam, t) {
    const tau = crashT(t), k = 1 - ease(T_HIT - 0.05, T_HIT + 0.25, t); if (k <= 0) return;
    const rk = S.rkState(tau), P = rk.P;
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const y = 0.35 + 0.17 * i, z = (S.hash(i + 2) - 0.5) * 1.1, ph = mod(t * 0.9 + S.hash(i) * 3, 1);
      const a = S.at(P, [-0.6 - 0.2 * ph - 1.2 * S.hash(i + 5), y, z]), b = S.at(P, [-0.6 - 0.2 * ph - 1.2 * S.hash(i + 5) - 0.9 - 0.6 * S.hash(i + 8), y, z]);
      const p = cam.P(...a), q = cam.P(...b); if (!p || !q) continue;
      g.strokeStyle = `rgba(255,250,235,${(0.55 * k * Math.sin(PI * ph)).toFixed(3)})`; g.lineWidth = 3 + 3 * S.hash(i + 11);
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
    }
    g.restore();
  }


  // ------------------------------------------------------------------ his form: the questions are printed on it
  // Drawn flat, close to the lens: a clipboard (hardboard, a matte clip) and a printed accident form. Its only words are the
  // key ones: SPEED ___ km/h, then BROKEN GLASS with a box either side of a drawing of the cart, LEFT and RIGHT, and no box
  // for none. Everything else printed on it is grey bars (no other words on screen).
  const INK = '#1f2a44', PAPER = '#f3efe4', FORM_W = 800, FORM_H = 1040;
  function fbar(g, x, y, w, h = 14, a = 0.28) { g.fillStyle = `rgba(40,44,52,${a})`; g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fill(); }
  function cartIcon(g, cx, cy, k) {                  // the cart, side-on, in printed line: a bed, two wheels, a heap of fruit
    g.save(); g.translate(cx, cy); g.scale(k, k); g.strokeStyle = INK; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-95, 0); g.lineTo(95, 0); g.lineTo(95, -16); g.moveTo(-95, 0); g.lineTo(-95, -16); g.stroke();
    g.beginPath(); g.moveTo(95, -6); g.lineTo(130, -24); g.stroke();
    for (const x of [-55, 55]) { g.beginPath(); g.arc(x, 30, 28, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, 30, 4, 0, TAU); g.fill(); }
    g.beginPath(); g.moveTo(-60, -10); g.quadraticCurveTo(0, -78, 60, -10); g.stroke();
    for (const [x, y] of [[-30, -22], [0, -22], [30, -22], [-15, -44], [15, -44], [0, -62]]) { g.beginPath(); g.arc(x, y, 13, 0, TAU); g.stroke(); }
    g.restore();
  }
  function tickBox(g, x, y, s0) { g.strokeStyle = INK; g.lineWidth = 7; g.strokeRect(x - s0 / 2, y - s0 / 2, s0, s0); }
  // the form's own layout, in its own pixels (0,0 its top-left; FORM_W x FORM_H)
  function formPage(g, o) {
    g.fillStyle = PAPER; g.fillRect(0, 0, FORM_W, FORM_H);
    g.strokeStyle = 'rgba(31,42,68,0.08)'; g.lineWidth = 1; for (let y = 120; y < FORM_H; y += 34) { g.beginPath(); g.moveTo(30, y); g.lineTo(FORM_W - 30, y); g.stroke(); }
    // the header: a plain round stamp (no emblem), the form's title as bars, a rule
    g.strokeStyle = 'rgba(31,42,68,0.45)'; g.lineWidth = 4; g.beginPath(); g.arc(80, 74, 36, 0, TAU); g.stroke(); g.beginPath(); g.arc(80, 74, 24, 0, TAU); g.stroke();
    fbar(g, 140, 50, 380, 20, 0.45); fbar(g, 140, 84, 250, 14); fbar(g, 560, 52, 190, 14); fbar(g, 560, 82, 140, 14);
    g.fillStyle = 'rgba(31,42,68,0.6)'; g.fillRect(30, 130, FORM_W - 60, 5);
    // filled-in lines above (date, place), as bars and blue scribbles
    fbar(g, 40, 160, 90); scrib(g, 150, 152, 180, 1, 11); fbar(g, 400, 160, 80); scrib(g, 500, 152, 200, 1, 23);
    // SPEED ___ km/h
    g.fillStyle = INK; g.font = '700 condensed 64px Bahn'; g.textBaseline = 'alphabetic'; g.fillText('SPEED', 40, 278);
    g.fillStyle = INK; g.fillRect(232, 282, 300, 5); g.font = '600 semi-condensed 54px Bahn'; g.fillText('km/h', 548, 278);
    if (o.speed > 0) scrib(g, 250, 228, 250, o.speed, 7, 1.3);
    g.fillStyle = 'rgba(31,42,68,0.6)'; g.fillRect(30, 330, FORM_W - 60, 3);
    // BROKEN GLASS: a box either side of the cart, and nothing for none
    g.fillStyle = INK; g.font = '700 condensed 118px Bahn'; g.textAlign = 'center'; g.fillText('BROKEN GLASS', FORM_W / 2, 470); g.textAlign = 'left';
    cartIcon(g, FORM_W / 2, 640, 1.05);
    tickBox(g, 120, 640, 112); tickBox(g, FORM_W - 120, 640, 112);
    g.fillStyle = INK; g.font = '700 condensed 74px Bahn'; g.textAlign = 'center'; g.fillText('LEFT', 120, 775); g.fillText('RIGHT', FORM_W - 120, 775); g.textAlign = 'left';
    if (o.ghost > 0) {                                // after the twist: the box that isn't there
      g.save(); g.globalAlpha = o.ghost; g.setLineDash([16, 12]); g.strokeStyle = '#c0392b'; g.lineWidth = 6; g.strokeRect(FORM_W / 2 - 56, 790, 112, 112); g.restore();
    }
    g.fillStyle = 'rgba(31,42,68,0.6)'; g.fillRect(30, 930, FORM_W - 60, 3);
    fbar(g, 40, 970, 160); fbar(g, 480, 970, 260); fbar(g, 40, 1004, 110, 12, 0.18);
  }
  function scrib(g, x, y, w, k, seed, big = 1) {    // a blue-ink scribble, written left to right up to k (illegible on purpose)
    g.save(); g.strokeStyle = '#2a4aa0'; g.lineWidth = 5 * big; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); const n = 40;
    for (let i = 0; i <= n * clamp(k); i++) { const u = i / n, px = x + u * w, py = y + 26 * big + Math.sin(u * 23 + seed) * 14 * big + Math.sin(u * 61 + seed * 2) * 6 * big; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke(); g.restore();
  }
  // the clipboard in the frame: board, clip, page; pose = { x, y, rot, s } (its centre), and what's written
  function clipboard(g, P0, o) {
    g.save(); g.translate(P0.x, P0.y); g.rotate(P0.rot || 0); g.scale(P0.s, P0.s);
    g.fillStyle = 'rgba(30,20,14,0.35)'; g.beginPath(); g.roundRect(-FORM_W / 2 - 40 + 14, -FORM_H / 2 - 70 + 22, FORM_W + 80, FORM_H + 110, 26); g.fill();
    g.fillStyle = '#8a5a33'; g.beginPath(); g.roundRect(-FORM_W / 2 - 40, -FORM_H / 2 - 70, FORM_W + 80, FORM_H + 110, 26); g.fill();
    g.strokeStyle = '#6a4224'; g.lineWidth = 4; g.stroke();
    g.save(); g.translate(-FORM_W / 2, -FORM_H / 2); formPage(g, o); g.restore();
    // the clip: matte steel, no shine
    g.fillStyle = '#7d7f84'; g.beginPath(); g.roundRect(-150, -FORM_H / 2 - 92, 300, 92, 18); g.fill();
    g.fillStyle = '#6a6c71'; g.beginPath(); g.roundRect(-110, -FORM_H / 2 - 18, 220, 40, 10); g.fill();
    g.fillStyle = '#5a5c60'; g.beginPath(); g.arc(0, -FORM_H / 2 - 60, 16, 0, TAU); g.fill();
    g.restore();
  }
  const SKIN = LOOK.cop.skin, KHAKI = LOOK.cop.shirt;
  function copHandEdge(g, x, y, rot, s0 = 1) {      // his fingers curled over the board's edge, a khaki cuff below
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s0, s0);
    g.fillStyle = mix(KHAKI, '#000000', 0.12); g.beginPath(); g.roundRect(-70, 40, 140, 220, 30); g.fill();
    g.fillStyle = mix(SKIN, '#000000', 0.08); g.beginPath(); g.roundRect(-58, -40, 116, 110, 40); g.fill();
    g.fillStyle = SKIN; for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(-52 + i * 27, -72, 24, 70, 12); g.fill(); g.strokeStyle = mix(SKIN, '#3a1a0c', 0.4); g.lineWidth = 2; g.stroke(); }
    g.restore();
  }
  function penHand(g, x, y, rot, tap = 0, k = 1) {   // his right hand, the pen in it, its nib at (x, y)
    g.save(); g.translate(x, y - 22 * tap); g.rotate(rot); g.scale(k, k);
    // the forearm: tapering to the wrist, the khaki cuff of his sleeve
    g.fillStyle = mix(SKIN, '#000000', 0.06); g.beginPath(); g.moveTo(-10, 230); g.quadraticCurveTo(-36, 420, -50, 640); g.lineTo(120, 640); g.quadraticCurveTo(100, 420, 78, 236); g.closePath(); g.fill();
    g.fillStyle = mix(KHAKI, '#000000', 0.08); g.beginPath(); g.moveTo(-46, 520); g.lineTo(118, 512); g.lineTo(140, 760); g.lineTo(-70, 760); g.closePath(); g.fill();
    g.strokeStyle = mix(KHAKI, '#000000', 0.3); g.lineWidth = 6; g.beginPath(); g.moveTo(-48, 530); g.lineTo(120, 522); g.stroke();
    // the pen
    g.fillStyle = '#1d2a4a'; g.beginPath(); g.moveTo(0, 0); g.lineTo(9, 26); g.lineTo(-9, 26); g.closePath(); g.fill();
    g.fillStyle = '#25345a'; g.beginPath(); g.roundRect(-11, 24, 22, 200, 8); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(-6, 32, 4, 180);
    // the hand round it: the back of the hand, two curled fingers in front, the thumb along it
    g.fillStyle = SKIN; g.beginPath(); g.ellipse(40, 200, 58, 74, 0.35, 0, TAU); g.fill();
    g.fillStyle = mix(SKIN, '#000000', 0.12); for (let i = 0; i < 2; i++) { g.beginPath(); g.ellipse(4 + i * 6, 120 + i * 34, 30, 17, 0.3, 0, TAU); g.fill(); }
    g.fillStyle = mix(SKIN, '#ffffff', 0.08); g.beginPath(); g.ellipse(-18, 150, 15, 40, -0.15, 0, TAU); g.fill();
    g.strokeStyle = mix(SKIN, '#3a1a0c', 0.45); g.lineWidth = 3; g.beginPath(); g.ellipse(40, 200, 58, 74, 0.35, 0, TAU); g.stroke();
    g.restore();
  }
  // the background behind the board: his khaki shirt, close and soft, and his cap's peak and eyes over the top
  function formBackdrop(g, t, o = {}) {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#cdb98f'); gr.addColorStop(1, '#a8935f');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); g.filter = 'blur(6px)';
    g.fillStyle = mix(KHAKI, '#000000', 0.15); g.fillRect(500, 0, 14, H);   // the placket
    for (let i = 0; i < 5; i++) { g.fillStyle = '#e8dcc0'; g.beginPath(); g.arc(507, 160 + i * 380, 14, 0, TAU); g.fill(); }
    g.strokeStyle = '#efe6d0'; g.lineWidth = 10; g.beginPath(); g.moveTo(140, 0); g.quadraticCurveTo(300, 600, 520, 820); g.stroke();   // the whistle's cord
    g.restore();
  }
  function peekOver(g, x, y, s0, look = 0) {         // his cap and eyes, just over the board's top edge, reading it
    g.save(); g.translate(x, y); g.scale(s0, s0);
    // his forehead and brows, the eyes lowered to the form
    g.fillStyle = LOOK.cop.skin; g.beginPath(); g.ellipse(0, 70, 172, 150, 0, PI, TAU); g.fill();
    g.fillStyle = mix(LOOK.cop.skin, '#000000', 0.1); g.beginPath(); g.ellipse(0, 70, 172, 40, 0, PI, TAU); g.fill();
    g.strokeStyle = '#15110d'; g.lineWidth = 15; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 26, 6); g.quadraticCurveTo(k * 70, -6, k * 112, 4); g.stroke(); }
    g.fillStyle = '#2a1a12'; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(k * 68 + look * 8, 40, 32, 9, 0, 0, PI); g.fill(); }
    // the cap: band, crown flaring to a flat top (higher in front), the badge, the black visor
    g.fillStyle = '#33271c'; g.beginPath(); g.moveTo(-182, -6); g.quadraticCurveTo(0, 26, 182, -6); g.lineTo(184, -62); g.quadraticCurveTo(0, -34, -184, -62); g.closePath(); g.fill();
    const cg = g.createLinearGradient(-230, -160, 230, -40); cg.addColorStop(0, '#c9b47e'); cg.addColorStop(0.55, '#b39d67'); cg.addColorStop(1, '#8a774a');
    g.fillStyle = cg; g.beginPath(); g.moveTo(-184, -60); g.quadraticCurveTo(0, -30, 184, -60); g.lineTo(236, -150); g.quadraticCurveTo(0, -212, -236, -150); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,46,24,0.6)'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#d6b04a'; g.beginPath(); g.ellipse(0, -96, 26, 30, 0, 0, TAU); g.fill(); g.fillStyle = '#8a6a1c'; g.beginPath(); g.ellipse(0, -96, 12, 14, 0, 0, TAU); g.fill();
    g.fillStyle = '#121216'; g.beginPath(); g.moveTo(-170, 0); g.quadraticCurveTo(0, 30, 170, 0); g.quadraticCurveTo(150, 54, 0, 66); g.quadraticCurveTo(-150, 54, -170, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-150, 46); g.quadraticCurveTo(0, 72, 150, 46); g.stroke();
    g.restore();
  }

  // shot 4b: over his shoulder, the speed line; the pen waits on the blank, then he writes your answer
  function shotSpeed(g, t) {
    const t0 = SH.speed[0], t1 = SH.speed[1], u = t - t0;
    const g0 = g.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, '#7a746a'); g0.addColorStop(1, '#5d5850'); g.fillStyle = g0; g.fillRect(0, 0, W, H);   // the road, far below
    g.save(); g.filter = 'blur(5px)'; for (let i = 0; i < 9; i++) { const x = 80 + S.hash(i + 3) * 920, y = 1300 + S.hash(i + 9) * 500; g.fillStyle = '#e8862a'; g.beginPath(); g.arc(x, y, 34, 0, TAU); g.fill(); } g.restore();   // his fruit, out of focus
    const lift = t > t1 - 0.22 ? ease(t1 - 0.22, t1, t) : 0;               // he turns the board round to you
    const P0 = { x: 596 - 10 * Math.sin(u * 0.8), y: 1650, rot: -0.05 + 0.012 * Math.sin(u * 0.7), s: 1.45 };
    const sp = ease(SH.write, SH.write + 0.65, t);
    clipboard(g, P0, { speed: sp, ghost: 0 });
    copHandEdge(g, P0.x - 640, P0.y - 300, 0.15, 1.2);
    // his left forearm across the board's lower half, holding it against him (the next question is under it)
    g.save(); g.translate(0, -40); g.fillStyle = mix(KHAKI, '#000000', 0.06);
    g.beginPath(); g.moveTo(-60, 1470); g.quadraticCurveTo(520, 1395, 1140, 1440); g.lineTo(1140, 1990); g.lineTo(-60, 1990); g.closePath(); g.fill();
    g.strokeStyle = mix(KHAKI, '#000000', 0.25); g.lineWidth = 6; g.beginPath(); g.moveTo(-60, 1500); g.quadraticCurveTo(520, 1425, 1140, 1470); g.stroke();
    g.fillStyle = mix(KHAKI, '#000000', 0.18); g.beginPath(); g.roundRect(820, 1560, 70, 46, 10); g.fill(); g.restore();
    // the pen: hovering on the blank, writing, then away
    const loc = (fx, fy) => { const c = Math.cos(P0.rot), s_ = Math.sin(P0.rot), x = (fx - FORM_W / 2) * P0.s, y = (fy - FORM_H / 2) * P0.s; return [P0.x + x * c - y * s_, P0.y + x * s_ + y * c]; };
    const wx = lerp(250, 500, sp), [px, py] = loc(t < SH.write ? 255 : wx, 252 + (t > SH.write && sp < 1 ? Math.sin(t * 40) * 10 : 0));
    penHand(g, px, py, -0.5 + 0.1 * Math.sin(t * 3), 0);
  }
  // shot 5 (and 7a): the form turned to you; the pen hovers dead centre over the cart; a ring runs out, with no numbers
  function shotPick(g, t, mode) {
    formBackdrop(g, t);
    const t0 = mode === 'pick' ? SH.pick[0] : SH.taps[0], u = t - t0;
    const inK = mode === 'pick' ? springE((t - t0) / 0.42) : 1;
    const P0 = { x: 540, y: 1000 + (1 - Math.min(1, inK)) * 900 - 18 * Math.sin(u * 0.6), rot: -0.025 + 0.01 * Math.sin(u * 0.5) + (1 - Math.min(1, inK)) * 0.5, s: 1.0 };
    const ghost = mode === 'taps' ? ease(SH.ghost, SH.ghost + 0.35, t) : 0;
    peekOver(g, 560, P0.y - FORM_H / 2 - 92, 0.9, 0);
    clipboard(g, P0, { speed: 1, ghost });
    copHandEdge(g, P0.x - FORM_W / 2 - 26, P0.y + 80, 0.25, 0.75);
    copHandEdge(g, P0.x + FORM_W / 2 + 26, P0.y + 60, -0.25, 0.75);
    const loc = (fx, fy) => { const c = Math.cos(P0.rot), s_ = Math.sin(P0.rot), x = (fx - FORM_W / 2) * P0.s, y = (fy - FORM_H / 2) * P0.s; return [P0.x + x * c - y * s_, P0.y + x * s_ + y * c]; };
    if (mode === 'pick') {
      const [px, py] = loc(FORM_W / 2, 560 + 6 * Math.sin(u * 2.3));
      const ring = clamp((t - B('n06')) / (A('n07') - B('n06') - 0.05));
      if (t > B('n06') - 0.1 && ring < 1) {          // the ring round the pen: a clock with no numbers
        const rr = 92, a0 = -PI / 2;
        g.save(); g.lineCap = 'round';
        g.strokeStyle = 'rgba(20,24,34,0.35)'; g.lineWidth = 22; g.beginPath(); g.arc(px, py, rr, 0, TAU); g.stroke();
        g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.beginPath(); g.arc(px, py, rr, a0 + TAU * ring, a0 + TAU); g.stroke();
        g.restore();
      }
      penHand(g, px + 4, py, 0.45, 0);
    } else {
      // the taps: the space where a box for none would be ("He never asked if there was any"), then LEFT and RIGHT ("where it was")
      const keys = [[SH.taps[0], FORM_W / 2, 600], [SH.ghost - 0.25, FORM_W / 2, 846], [A('n10') + 0.1, 120, 640], [A('n10') + 0.75, FORM_W - 120, 640], [999, FORM_W - 120, 640]];
      let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
      const a = keys[i], b = keys[i + 1], m = ease(b[0] - 0.28, b[0], t);
      const fx = lerp(a[1], b[1], m), fy = lerp(a[2], b[2], m), tap = win(t - b[0], 0, 0.05, 0.08, 0.16) + win(t - b[0], 0.18, 0.22, 0.26, 0.34);
      const [px, py] = loc(fx, fy);
      penHand(g, px + 4, py, 0.45, -tap * 0.6);
    }
  }


  // ------------------------------------------------------------------ what your brain did: the memory, rebuilt (shot 7b)
  // The crash at the moment of the hit, redrawn as a memory (sepia, paper): it comes apart into flat paper pieces and puts
  // itself back together; then the word SMASHED drops onto the remembered road and breaks into shards made of its own
  // letters, so the only "glass" in the film is the word. The real street stays clean on every frame; this is the memory.
  const MEM_TAU = 0.2, MEM_LAYERS = ['bg', 'fruit', 'cart', 'old', 'rk'];
  const memCam = () => R.camera({ x: 3.3, y: 1.5, z: -0.3, yaw: -0.72, pitch: -0.012, f: 1340, cx: 540, cy: 960 });
  // each piece: where it goes while the memory is apart (dx, dy px, turn, lift), and how it comes back "a little wrong"
  const MEM_MOVE = { bg: [0, 40, 0.0, 0.0], fruit: [-90, -260, -0.12, 0.08], cart: [120, 160, 0.08, 0.06], old: [210, -230, 0.14, 0.07], rk: [-200, 120, -0.1, 0.09] };
  const MEM_WRONG = { bg: [0, 0, 0], fruit: [0, -8, 0], cart: [6, 4, 0.015], old: [-10, 0, -0.02], rk: [14, -6, 0.025] };
  const WORD = 'SMASHED';
  const SHARDS = (() => {                             // each letter cut into angular pieces by a few seeded lines
    const out = [];
    for (let li = 0; li < WORD.length; li++) {
      let polys = [[[0, 0], [1, 0], [1, 1], [0, 1]]];
      for (let c = 0; c < 3; c++) {
        const a = S.hash(li * 13 + c) * PI, px = 0.3 + 0.4 * S.hash(li * 7 + c + 1), py = 0.3 + 0.4 * S.hash(li * 5 + c + 2), nx = Math.cos(a), ny = Math.sin(a), next = [];
        for (const P of polys) {                        // split each polygon by the line through (px, py) with normal (nx, ny)
          const A_ = [], B_ = [], side = (q) => (q[0] - px) * nx + (q[1] - py) * ny;
          for (let i = 0; i < P.length; i++) {
            const p0 = P[i], p1 = P[(i + 1) % P.length], s0 = side(p0), s1 = side(p1);
            if (s0 >= 0) A_.push(p0); else B_.push(p0);
            if ((s0 >= 0) !== (s1 >= 0)) { const k = s0 / (s0 - s1), q = [p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k]; A_.push(q); B_.push(q); }
          }
          if (A_.length > 2) next.push(A_); if (B_.length > 2) next.push(B_);
        }
        polys = next;
      }
      polys.forEach((P, k) => { const c = P.reduce((m, q) => [m[0] + q[0] / P.length, m[1] + q[1] / P.length], [0, 0]); out.push({ li, P, c, seed: li * 31 + k }); });
    }
    return out;
  })();
  function memoryShot(g, t, S0) {
    const u = t - SH.mem[0], cam = memCam(), tau = MEM_TAU;
    const apart = win(t, A('n12') - 0.1, A('n12') + 0.9, A('n13') + 0.1, A('n13') + 1.3);   // "doesn't replay ... It rebuilds it"
    const wrong = ease(A('n13') + 0.6, A('n13') + 1.4, t);
    const sepia = ease(SH.mem[0] - 0.05, SH.mem[0] + 0.6, t);
    // the memory's paper: warm, a little faded
    g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, W, H);
    for (const L of MEM_LAYERS) {
      const c = S0.mem[L], cg = c.getContext('2d');
      cg.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, W, H);
      cg.save(); crashFrame(cg, SH.mem[0], cam, { tau, layer: L, noThief: L !== 'bg' }); cg.restore();
      const [mx, my, mr, ml] = MEM_MOVE[L], [wx, wy, wr] = MEM_WRONG[L], k = apart, sc = 1 + ml * k;
      const ox = mx * k + wx * wrong, oy = my * k + wy * wrong, rot = mr * k + wr * wrong;
      g.save(); g.translate(540 + ox, 960 + oy); g.rotate(rot); g.scale(sc, sc); g.translate(-540, -960);
      // a paper cut-out: a white border round the piece, and its shadow, once it lifts off the page
      if (L !== 'bg' && k > 0.01) {
        const sil = S0.memSil, sg = sil.getContext('2d'); sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, W, H);
        sg.globalCompositeOperation = 'source-over'; sg.drawImage(c, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#f6eedc'; sg.fillRect(0, 0, W, H); sg.globalCompositeOperation = 'source-over';
        g.save(); g.globalAlpha = 0.35 * k; g.filter = 'blur(10px)'; g.drawImage(sil, 14 * k, 22 * k); g.restore();
        g.save(); g.filter = 'brightness(0.12)'; g.globalAlpha = 0.28 * k; g.drawImage(sil, 10 * k, 16 * k); g.restore();
        for (const [dx, dy] of [[-7, 0], [7, 0], [0, -7], [0, 7], [-5, -5], [5, -5], [-5, 5], [5, 5]]) g.drawImage(sil, dx, dy);
      }
      g.filter = `sepia(${(0.85 * sepia).toFixed(3)}) saturate(${(1 - 0.35 * sepia).toFixed(3)}) contrast(${(1 - 0.08 * sepia).toFixed(3)})`;
      g.drawImage(c, 0, 0); g.filter = 'none';
      g.restore();
    }
    // the word drops onto the remembered road and breaks into its own letters' shards
    wordShards(g, t, cam);
    // the memory's edges: a soft warm vignette and paper grain
    const vg = g.createRadialGradient(540, 960, 400, 540, 960, 1200); vg.addColorStop(0, 'rgba(120,80,40,0)'); vg.addColorStop(1, `rgba(90,60,30,${(0.45 * sepia).toFixed(3)})`);
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function wordShards(g, t, cam) {
    // SMASHED falls upright, facing you, readable; it strikes the remembered road and breaks: each letter's pieces tip over
    // and lie flat on the road a little apart, like glass, still close enough to read as the word's letters
    const tDrop = SH.word, tHit = tDrop + 0.62; if (t < tDrop) return;
    const C0 = [0.9, 2.55];                            // where it lands, on the road in front of the cart (inside the safe zones)
    const rgt = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)], away = [Math.sin(cam.yaw), 0, Math.cos(cam.yaw)];   // across the view, and into it
    const Wm = 2.2;                                    // the word's width (metres)
    g.save(); g.font = '700 condensed 300px Bahn'; g.textBaseline = 'alphabetic';
    const widths = [...WORD].map((ch) => g.measureText(ch).width), tw = widths.reduce((a, b) => a + b, 0), k = Wm / tw, Hm = 230 * k;
    const lx = []; { let x = 0; for (const w of widths) { lx.push(x); x += w; } }
    const fall = clamp((t - tDrop) / (tHit - tDrop)), drop = 2.3 * (1 - fall * fall);
    for (const sh of SHARDS) {
      const li = sh.li, cw = widths[li], ox = lx[li] - tw / 2;
      const px = ox + sh.c[0] * cw, py = (1 - sh.c[1]) * 230;                  // the shard's centre in the word (font px, y up from the baseline)
      const after = Math.max(0, t - tHit), tip = mj(clamp((after - 0.02 * (S.hash(sh.seed) * 4)) / 0.34));   // upright -> flat
      const spread = (1 - Math.exp(-after / 0.2)), dir = (S.hash(sh.seed + 1) - 0.5) * 0.5, out = (0.04 + 0.12 * S.hash(sh.seed + 2)) * spread;
      // the shard's centre in the world: on the upright word, then lying where it fell (a little forward of the word, spread)
      const u0 = px * k, v0 = py * k;
      const up = [u0 * rgt[0], drop + v0, u0 * rgt[2]], flat = [u0 * rgt[0] + away[0] * (-v0 * 0.55) + rgt[0] * out * Math.sign(px + 0.001), 0.004, u0 * rgt[2] + away[2] * (-v0 * 0.55) + rgt[2] * out * Math.sign(px + 0.001)];
      const c3 = [C0[0] + lerp(up[0], flat[0], tip), lerp(up[1], flat[1], tip) + 0.15 * Math.sin(PI * tip) * (after > 0 ? 1 : 0), C0[1] + lerp(up[2], flat[2], tip)];
      // its own axes: across stays across; "up the letter" turns from straight up to pointing back at you along the road
      const ang = tip * PI / 2, ey = [-away[0] * Math.sin(ang), Math.cos(ang), -away[2] * Math.sin(ang)];
      const p0 = cam.P(...c3), pa = cam.P(c3[0] + rgt[0] * 0.01, c3[1], c3[2] + rgt[2] * 0.01), pb = cam.P(c3[0] + ey[0] * 0.01, c3[1] + ey[1] * 0.01, c3[2] + ey[2] * 0.01);
      if (!p0 || !pa || !pb) continue;
      const ea = [(pa[0] - p0[0]) * 100 * k, (pa[1] - p0[1]) * 100 * k], eb = [(pb[0] - p0[0]) * 100 * k, (pb[1] - p0[1]) * 100 * k];
      g.save(); g.setTransform(ea[0], ea[1], -eb[0], -eb[1], p0[0], p0[1]); g.rotate(dir * spread);
      g.translate(-px, py);
      g.beginPath(); sh.P.forEach((q, i) => { const X = ox + q[0] * cw, Y = -(1 - q[1]) * 230; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath();
      g.save(); g.clip(); g.fillStyle = '#fbf5e6'; g.fillText(WORD[li], ox, 0); g.restore();
      if (after > 0) { g.lineJoin = 'round'; g.strokeStyle = `rgba(255,253,244,${(0.95 * clamp(after * 5)).toFixed(3)})`; g.lineWidth = 7; g.stroke(); g.strokeStyle = 'rgba(110,80,45,0.5)'; g.lineWidth = 2.5; g.stroke(); }
      g.restore();
      if (after <= 0) { /* whole: a thin dark outline so it reads over the sepia */ }
    }
    if (t < tHit) {                                    // the falling word's outline, so it reads over the pale street
      const c3 = [C0[0], drop + Hm / 2, C0[1]], p0 = cam.P(...c3);
    }
    g.restore();
  }



  // ------------------------------------------------------------------ 1974 (shot 8): the study, in a lecture hall
  // Two blocks of 50 students watch a short film of a car crash (no glass in it). A week later, asked "did you see any broken
  // glass?", 7 of the 50 asked with "hit" said yes, and 16 of the 50 asked with "smashed" (Loftus & Palmer 1974, experiment 2).
  // Seen from the back of the hall: heads and shoulders in seventies hair, the projector's beam over them.
  const HALL = (() => {
    const rows = [1.6, 2.7, 3.8, 4.9, 6.0], seats = [];
    const shirts = ['#c8902e', '#8a4b2a', '#3f6f6a', '#d9c9a3', '#5a6f9a', '#6b4a3a', '#b5654a', '#7a7a3a', '#a8584a', '#46607a'];
    const hairs = ['#2a1a12', '#5a3a22', '#8a5a2a', '#c9a45a', '#3a2a20', '#7a3a1a', '#1a1410', '#6a4a2a'];
    const skins = ['#e2b590', '#c98f66', '#a8714b', '#f0c9a8', '#8a5a3a', '#d8a47c'];
    rows.forEach((z, ri) => { for (const side of [-1, 1]) for (let k = 0; k < 10; k++) { const n = seats.length, h = (q) => S.hash(n * 7.3 + q);
      seats.push({ z, x: side * (0.62 + k * 0.62) + (h(1) - 0.5) * 0.08, side, ri, k, shirt: shirts[Math.floor(h(2) * shirts.length)], hair: hairs[Math.floor(h(3) * hairs.length)], skin: skins[Math.floor(h(4) * skins.length)], style: Math.floor(h(5) * 5), lean: (h(6) - 0.5) * 0.1, tall: 0.92 + 0.14 * h(7) }); } });
    return seats;
  })();
  const hallCam = (t) => {
    const push = ease(A('n16') - 0.25, B('n16') + 0.6, t), drift = ease(SH.y74[0], SH.y74[1], t);
    return R.camera({ x: 0.1 - 0.2 * drift, y: lerp(2.35, 2.5, push), z: lerp(-0.2, 3.4, push) + 0.35 * drift, yaw: 0, pitch: lerp(-0.07, 0.05, push), f: lerp(820, 1100, push), cx: 540, cy: lerp(1060, 960, push) });
  };
  function hallRaisers() {                             // who raises a hand: 7 on the HIT side, 16 on the SMASHED side, among those you can see
    const cam = hallCam(SH.hands + 0.5), vis = (st) => { const p = cam.P(st.x, 1.1, st.z); return p && p[0] > 110 && p[0] < 970; };
    const pick = (side, n) => { const c = HALL.filter((st) => st.side === side && vis(st)).sort((a, b) => S.hash(a.x * 9 + a.z) - S.hash(b.x * 9 + b.z)); return new Set(c.slice(0, n)); };
    return { l: pick(-1, 7), r: pick(1, 16) };
  }
  let RAISE = null;
  function hallShot(g, t) {
    RAISE = RAISE || hallRaisers();
    const cam = hallCam(t);
    // the room: dark panelled walls, the floor stepping up towards us, the screen at the front
    g.fillStyle = '#1c130e'; g.fillRect(0, 0, W, H);
    const P = (x, y, z) => cam.P(x, y, z);
    const poly = (pts, c) => { const q = pts.map((p) => P(...p)); if (q.some((v) => !v)) return; g.beginPath(); q.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fillStyle = c; g.fill(); };
    poly([[-7.5, 0, -1], [7.5, 0, -1], [7.5, 0, 9], [-7.5, 0, 9]], '#2a1d16');
    poly([[-7.5, 0, -1], [-7.5, 6, -1], [-7.5, 6, 9], [-7.5, 0, 9]], '#3a281c');
    poly([[7.5, 0, -1], [7.5, 6, -1], [7.5, 6, 9], [7.5, 0, 9]], '#35251a');
    poly([[-7.5, 0, 9], [7.5, 0, 9], [7.5, 6, 9], [-7.5, 6, 9]], '#2e2118');
    for (let i = -7; i <= 7; i += 1.5) { const a = P(i, 0.9, 9), b = P(i, 5.5, 9); if (a && b) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
    // the screen and the film on it: two boxy cars, one runs into the other; it loops, and on "There wasn't any" it stops
    const sc = [P(-2.0, 1.7, 8.95), P(2.0, 1.7, 8.95), P(2.0, 4.3, 8.95), P(-2.0, 4.3, 8.95)];
    if (sc.every((v) => v)) {
      g.save(); g.beginPath(); sc.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath();
      g.fillStyle = '#e8e2d2'; g.fill(); g.clip();
      const frz = t > A('n16') - 0.1, ft = frz ? 1.35 : mod(t - SH.y74[0], 2.4);
      const sx = (u) => lerp(sc[0][0], sc[1][0], u), sy = (v) => lerp(sc[0][1], sc[3][1], v), sw = sc[1][0] - sc[0][0], sh_ = sc[0][1] - sc[3][1];
      g.fillStyle = '#b8b2a2'; g.fillRect(sx(0), sy(0.32), sw, sh_ * 0.32);                      // the film's road
      g.fillStyle = '#d8d2c4'; g.fillRect(sx(0), sy(1.0), sw, sh_ * 0.4);
      const car = (u, v, w, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(sx(u), sy(v + 0.24), sw * w, sh_ * 0.2, sh_ * 0.03); g.fill(); g.beginPath(); g.roundRect(sx(u + w * 0.2), sy(v + 0.4), sw * w * 0.56, sh_ * 0.18, sh_ * 0.03); g.fill(); g.fillStyle = 'rgba(230,226,214,0.55)'; g.fillRect(sx(u + w * 0.26), sy(v + 0.36), sw * w * 0.2, sh_ * 0.1); g.fillRect(sx(u + w * 0.5), sy(v + 0.36), sw * w * 0.2, sh_ * 0.1); g.fillStyle = '#24201c'; for (const k of [0.2, 0.8]) { g.beginPath(); g.arc(sx(u + w * k), sy(v + 0.06), sh_ * 0.075, 0, TAU); g.fill(); } };
      const a = clamp(ft / 1.2), hitK = ft > 1.2 ? 1 : 0;
      car(lerp(-0.35, 0.16, mj(a)) + (hitK ? 0.015 * Math.sin((ft - 1.2) * 40) * Math.exp(-(ft - 1.2) * 6) : 0), 0.22, 0.36, '#5a5650');
      car(0.52 + (hitK ? 0.05 * (1 - Math.exp(-(ft - 1.2) * 5)) : 0), 0.24, 0.34, '#7a756c');
      // the old film's flicker and scratches
      g.fillStyle = `rgba(30,24,18,${(0.06 + 0.05 * S.hash(Math.floor(t * 24))).toFixed(3)})`; g.fillRect(sx(0), sy(1), sw, sh_);
      g.strokeStyle = 'rgba(40,30,20,0.25)'; g.lineWidth = 1.5; const sxp = sx(S.hash(Math.floor(t * 12))); g.beginPath(); g.moveTo(sxp, sy(1)); g.lineTo(sxp + 4, sy(0)); g.stroke();
      g.restore();
    }
    // the projector's beam, from behind you, over everyone's heads, to the screen; dust in it
    const pj = P(0.6, 3.9, -1.6), s0 = P(-2.0, 4.3, 8.95), s1 = P(2.0, 4.3, 8.95), s2 = P(2.0, 1.7, 8.95), s3 = P(-2.0, 1.7, 8.95);
    if (s0 && s1 && s2 && s3) {
      const src = pj || [540, -200];
      const gr = g.createLinearGradient(src[0], src[1], (s0[0] + s2[0]) / 2, (s0[1] + s2[1]) / 2); gr.addColorStop(0, 'rgba(255,240,200,0.32)'); gr.addColorStop(1, 'rgba(255,240,200,0.06)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(src[0] - 30, src[1]); g.lineTo(s0[0], s0[1]); g.lineTo(s3[0], s3[1]); g.lineTo(src[0] + 30, src[1]); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(src[0] - 30, src[1]); g.lineTo(s1[0], s1[1]); g.lineTo(s2[0], s2[1]); g.lineTo(src[0] + 30, src[1]); g.closePath(); g.fill();
      for (let i = 0; i < 40; i++) { const u = S.hash(i), v = mod(S.hash(i + 50) + t * 0.03 * (0.5 + S.hash(i + 9)), 1), a = [lerp(src[0], lerp(s0[0], s1[0], u), v), lerp(src[1], lerp(s0[1], s2[1], S.hash(i + 70)), v)]; g.fillStyle = `rgba(255,245,215,${(0.3 + 0.4 * S.hash(i + 3)).toFixed(3)})`; g.beginPath(); g.arc(a[0], a[1], 1.5 + 1.5 * S.hash(i + 4), 0, TAU); g.fill(); }
    }
    // the wall calendar: a week of pages flips over on "a week later"
    const cal = [P(6.6, 3.0, 7.6), P(7.4, 3.0, 6.8), P(7.4, 1.9, 6.8), P(6.6, 1.9, 7.6)];
    if (cal.every((v) => v) && cal[0][0] < 1080) {
      const flips = clamp((t - SH.week) / 0.7) * 7, day = 14 + Math.floor(flips);
      g.save(); g.beginPath(); cal.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fillStyle = '#efe6d2'; g.fill(); g.clip();
      g.fillStyle = '#b8392b'; g.fillRect(Math.min(cal[0][0], cal[3][0]) - 5, Math.min(cal[0][1], cal[1][1]) - 5, 200, (cal[3][1] - cal[0][1]) * 0.25 + 5);
      const cx = (cal[0][0] + cal[1][0] + cal[2][0] + cal[3][0]) / 4, cy = (cal[0][1] + cal[1][1] + cal[2][1] + cal[3][1]) / 4 + 10;
      g.fillStyle = '#2a201a'; g.font = `700 condensed ${Math.round((cal[3][1] - cal[0][1]) * 0.5)}px Bahn`; g.textAlign = 'center'; g.fillText(String(day), cx, cy + 20); g.textAlign = 'left';
      const ph = flips % 1; if (flips > 0 && flips < 7) { g.fillStyle = 'rgba(239,230,210,0.9)'; g.fillRect(cal[0][0], cal[0][1], cal[1][0] - cal[0][0], (cal[3][1] - cal[0][1]) * (1 - ph)); }
      g.restore();
    }
    // the students, front row first; each a head and shoulders over a seat back; some hands go up
    const handsT = SH.hands;
    for (let ri = 4; ri >= 0; ri--) {
      const row = HALL.filter((st) => st.ri === ri).sort((a, b) => Math.abs(b.x) - Math.abs(a.x));
      for (const st of row) student(g, cam, st, t, (st.side < 0 ? RAISE.l : RAISE.r).has(st) ? handsT + 0.06 * S.hash(st.x * 3 + st.z) * 10 : null);
      // the seat backs of this row
      const a = P(-7.4, 0.95, row[0].z + 0.3), b = P(7.4, 0.95, row[0].z + 0.3), c = P(7.4, 0.55, row[0].z + 0.3), d = P(-7.4, 0.55, row[0].z + 0.3);
      if (a && b && c && d) { g.fillStyle = '#4a2f1e'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); g.fillStyle = '#5c3a24'; g.fillRect(Math.min(a[0], d[0]), a[1], Math.abs(b[0] - a[0]), 4); }
    }
    // the words: the year, which block heard which word, and how many said they saw broken glass
    hallText(g, t, cam);
    // a seventies film look: warm, a little faded, grain is added later; a vignette
    const vg = g.createRadialGradient(540, 900, 300, 540, 960, 1150); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,6,2,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function student(g, cam, st, t, raiseAt) {
    const base = cam.P(st.x, 0.95 * st.tall, st.z); if (!base) return;
    const k = base[2], x = base[0], y = base[1], lf = 0.02 * Math.sin(t * 0.8 + st.x * 3 + st.z);
    if (x < -80 || x > 1160) return;
    const rimL = 'rgba(255,230,180,0.35)';
    // a raised arm, behind the head on its side
    const up = raiseAt != null ? springE((t - raiseAt) / 0.4) : 0, sd = S.hash(st.x * 5) > 0.5 ? 1 : -1;
    const sh = [x + sd * 0.17 * k, y - 0.28 * k];
    if (up > 0.01) {
      const hx = sh[0] + sd * 0.06 * k, hy = sh[1] - lerp(0.05, 0.58, Math.min(1, up)) * k - 0.04 * (up - 1) * k;
      g.strokeStyle = st.shirt; g.lineCap = 'round'; g.lineWidth = 0.09 * k; g.beginPath(); g.moveTo(sh[0], sh[1] + 0.04 * k); g.lineTo(lerp(sh[0], hx, 0.55), lerp(sh[1], hy, 0.55)); g.stroke();
      g.strokeStyle = st.skin; g.lineWidth = 0.07 * k; g.beginPath(); g.moveTo(lerp(sh[0], hx, 0.5), lerp(sh[1], hy, 0.5)); g.lineTo(hx, hy); g.stroke();
      g.fillStyle = st.skin; g.beginPath(); g.ellipse(hx, hy - 0.05 * k, 0.05 * k, 0.07 * k, 0, 0, TAU); g.fill();
    }
    // shoulders and back
    g.fillStyle = st.shirt; g.beginPath(); g.moveTo(x - 0.23 * k, y); g.quadraticCurveTo(x - 0.24 * k, y - 0.3 * k, x - 0.08 * k, y - 0.33 * k); g.lineTo(x + 0.08 * k, y - 0.33 * k); g.quadraticCurveTo(x + 0.24 * k, y - 0.3 * k, x + 0.23 * k, y); g.closePath(); g.fill();
    g.strokeStyle = rimL; g.lineWidth = 0.012 * k; g.stroke();
    // head and hair, from behind
    const hx = x + lf * k + st.lean * k, hy = y - 0.46 * k, r = 0.105 * k;
    g.fillStyle = st.skin; g.beginPath(); g.arc(hx, hy, r, 0, TAU); g.fill();
    g.fillStyle = st.hair; g.beginPath();
    if (st.style === 0) g.arc(hx, hy - 0.01 * k, r * 1.55, 0, TAU);                                      // an afro
    else if (st.style === 1) { g.ellipse(hx, hy + 0.02 * k, r * 1.08, r * 1.05, 0, PI, TAU); g.rect(hx - r * 1.08, hy + 0.02 * k, r * 2.16, 0.2 * k); }   // long, straight, down past the shoulders
    else if (st.style === 2) g.ellipse(hx, hy - 0.005 * k, r * 1.18, r * 1.12, 0, 0, TAU);                // shaggy
    else if (st.style === 3) g.ellipse(hx, hy - 0.02 * k, r * 1.02, r * 1.0, 0, 0, TAU);                  // short
    else { g.ellipse(hx, hy, r * 1.12, r * 1.08, 0, 0, TAU); }
    g.fill();
    g.strokeStyle = 'rgba(255,230,180,0.3)'; g.lineWidth = 0.01 * k; g.beginPath(); g.arc(hx, hy, r * (st.style === 0 ? 1.55 : 1.1), -2.6, -0.5); g.stroke();
  }
  function hallText(g, t, cam) {
    const big = (txt, x, y, size, a, col = '#f4ead2') => { if (a <= 0.005) return; g.save(); g.globalAlpha = a; g.font = `700 condensed ${size}px Bahn`; g.textAlign = 'center'; g.lineWidth = size * 0.08; g.strokeStyle = 'rgba(20,12,6,0.75)'; g.strokeText(txt, x, y); g.fillStyle = col; g.fillText(txt, x, y); g.restore(); };
    const rise = (t0) => mj(clamp((t - t0) / 0.25));
    const fade = 1 - ease(A('n16') - 0.3, A('n16') + 0.1, t);
    big('1974', 540, 470 - 20 * (1 - rise(SH.year)), 230, rise(SH.year) * fade);
    // which word each half was asked with
    const lp = [270, 1150], rp = [752, 1150];         // both inside the safe zones (SMASHED's right edge under x 950)
    if (lp && rp) {
      big('HIT', lp[0], lp[1] - 20 * (1 - rise(SH.hitW)), 120, rise(SH.hitW) * fade);
      big('SMASHED', rp[0], rp[1] - 20 * (1 - rise(SH.smashW)), 108, rise(SH.smashW) * fade, '#ffd27a');
      // how many said yes, a week later: 7 of 50, 16 of 50
      const c = clamp((t - SH.hands) / 1.0);
      if (t > SH.hands) {
        big(String(Math.round(7 * c)), lp[0], lp[1] + 190, 190, fade); big('OF 50', lp[0], lp[1] + 255, 54, fade * 0.9);
        big(String(Math.round(16 * c)), rp[0], rp[1] + 190, 190, fade, '#ffd27a'); big('OF 50', rp[0], rp[1] + 255, 54, fade * 0.9);
      }
    }
  }


  // ------------------------------------------------------------------ the court (shot 9): one quick insert
  // An Indian courtroom: no jury, no gavel; the judge at the bench in a black coat and white bands. A question's word floats
  // from the lawyer to the witness box; the judge raises a palm; the word stops, drops and crumbles.
  const JUDGE = { headK: 0.15, skin: '#b07a52', skinD: '#87573a', skinH: '#c99670', hair: '#d6d0c6', style: 'part', brow: 0.09, browTilt: 0.05, must: 0.05 };
  const WIT = { headK: 0.15, skin: '#b98258', skinD: '#8f5c3c', skinH: '#d3a07a', hair: '#1b130d', style: 'short', brow: 0.08 };
  const LAWYER = { headK: 0.15, skin: '#ab7650', skinD: '#83543a', skinH: '#c8946c', hair: '#18120d', style: 'part', brow: 0.08 };
  function courtShot(g, t) {
    const u = t - SH.court[0], stopT = WD('n17', 4) - 0.12;
    const push = mj(clamp(u / 3.2));
    g.save(); g.translate(540, 960); g.scale(1 + 0.05 * push, 1 + 0.05 * push); g.translate(-540, -960);
    // the panelled wall
    const wg = g.createLinearGradient(0, 0, 0, H); wg.addColorStop(0, '#5a3420'); wg.addColorStop(1, '#7a4a2c'); g.fillStyle = wg; g.fillRect(-60, -60, W + 120, H + 120);
    for (let x = -40; x < W + 60; x += 150) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, 0, 8, H); g.fillStyle = 'rgba(255,220,170,0.06)'; g.fillRect(x + 10, 0, 4, H); }
    // a ceiling fan, turning
    g.save(); g.translate(540, 300); g.fillStyle = '#3a2a1e'; g.fillRect(-6, -120, 12, 120);
    for (let i = 0; i < 3; i++) { const a = t * 7 + i * TAU / 3; g.fillStyle = '#4a3828'; g.beginPath(); g.ellipse(Math.cos(a) * 120, Math.sin(a) * 18, 130, 22 * Math.abs(Math.sin(a)) + 6, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#2a1e14'; g.beginPath(); g.ellipse(0, 0, 34, 16, 0, 0, TAU); g.fill(); g.restore();
    // the judge, behind the bench: black coat, white bands
    const jx = 540, jy = 690, jr = 92;
    g.fillStyle = '#16161a'; g.beginPath(); g.moveTo(jx - 230, 1010); g.quadraticCurveTo(jx - 200, jy + 110, jx - 70, jy + 90); g.lineTo(jx + 70, jy + 90); g.quadraticCurveTo(jx + 200, jy + 110, jx + 230, 1010); g.closePath(); g.fill();
    g.fillStyle = '#f2efe6'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(jx + k * 6, jy + 100); g.lineTo(jx + k * 34, jy + 100); g.lineTo(jx + k * 26, jy + 190); g.lineTo(jx + k * 8, jy + 190); g.closePath(); g.fill(); }
    const palm = springE((t - stopT) / 0.3);
    // his raised palm: stop
    if (palm > 0.01) {
      const hx = jx + 210, hy = lerp(980, 640, Math.min(1, palm));
      g.fillStyle = '#16161a'; g.beginPath(); g.moveTo(jx + 150, jy + 160); g.quadraticCurveTo(hx - 10, hy + 160, hx - 40, hy + 70); g.lineTo(hx + 40, hy + 80); g.quadraticCurveTo(hx + 30, hy + 200, jx + 190, jy + 240); g.closePath(); g.fill();
      g.fillStyle = JUDGE.skin; g.beginPath(); g.roundRect(hx - 48, hy - 40, 96, 110, 30); g.fill();
      for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(hx - 46 + i * 24, hy - 110 + Math.abs(i - 1.5) * 10, 21, 80, 10); g.fill(); }
      g.beginPath(); g.ellipse(hx - 58, hy + 10, 18, 42, -0.5, 0, TAU); g.fill();
    }
    R.head3(g, jx, jy, jr, 0, JUDGE, { pitch: -0.05, look: [0.06 * (1 - palm), 0], browY: 0.04 * palm, close: blink(t, 4.2) });
    // the bench, with files tied in red tape
    g.fillStyle = '#8a5532'; g.fillRect(-60, 1000, W + 120, 300); g.fillStyle = '#a5693e'; g.fillRect(-60, 990, W + 120, 26);
    for (let i = 0; i < 4; i++) { g.fillStyle = ['#d8c49a', '#c9b48a', '#e2d2a8', '#bfa77a'][i]; g.fillRect(120 + i * 6, 930 - i * 22, 170, 24); g.fillStyle = '#b8392b'; g.fillRect(190 + i * 6, 930 - i * 22, 10, 24); }
    for (let x = 0; x < W; x += 180) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, 1030, 6, 270); }
    // the witness box and the witness, at the right
    g.fillStyle = '#6a3e24'; g.fillRect(700, 1250, 330, 330); g.fillStyle = '#8a5532'; g.fillRect(690, 1236, 350, 30);
    g.fillStyle = '#5a7a9a'; g.beginPath(); g.ellipse(865, 1250, 110, 70, 0, PI, TAU); g.fill();
    R.head3(g, 865, 1150, 68, -0.9, WIT, { pitch: 0.05, look: [-0.05, 0], wide: palm > 0.5 ? 0 : 0.3, close: blink(t, 6.6) });
    // the lawyer, from behind, in the foreground at the left: black coat, his hand up as he asks
    g.fillStyle = '#18181c'; g.beginPath(); g.moveTo(-40, H); g.lineTo(-40, 1390); g.quadraticCurveTo(60, 1260, 210, 1250); g.quadraticCurveTo(360, 1260, 470, 1400); g.lineTo(500, H); g.closePath(); g.fill();
    g.fillStyle = '#18181c'; g.beginPath(); g.moveTo(400, 1330); g.quadraticCurveTo(470, 1200, 520, 1140); g.lineTo(560, 1170); g.quadraticCurveTo(520, 1270, 450, 1400); g.closePath(); g.fill();
    g.fillStyle = LAWYER.skin; g.beginPath(); g.ellipse(548, 1132, 30, 38, 0.6, 0, TAU); g.fill();
    R.head3(g, 215, 1150, 108, PI - 0.35, LAWYER, {});
    // the word: out of his question, across to the witness; it stops at the judge's palm, drops, and crumbles
    const t0 = SH.court[0] + 0.25, flyK = clamp((Math.min(t, stopT) - t0) / (stopT - t0 + 0.35)), drop = Math.max(0, t - stopT - 0.08);
    if (t > t0) {
      const wx = lerp(470, 700, mj(flyK)), wy = lerp(1080, 1010, mj(flyK)) + 0.5 * 1800 * drop * drop;
      g.save(); g.font = '700 condensed 120px Bahn'; g.textAlign = 'center';
      const letters = [...WORD], wdt = letters.map((c) => g.measureText(c).width), tw = wdt.reduce((a, b) => a + b, 0);
      let x = wx - tw / 2;
      letters.forEach((c, i) => {
        const cx = x + wdt[i] / 2; x += wdt[i];
        const crumble = clamp(drop * 2.2 - 0.05 * i), fall = crumble * crumble * 260 * (0.7 + 0.6 * S.hash(i + 40)), rot = (S.hash(i + 41) - 0.5) * 1.6 * crumble;
        g.save(); g.globalAlpha = 1 - clamp(crumble * 1.3 - 0.3); g.translate(cx + (S.hash(i + 42) - 0.5) * 60 * crumble, wy + fall); g.rotate(rot);
        g.lineWidth = 10; g.strokeStyle = 'rgba(20,12,6,0.8)'; g.strokeText(c, 0, 40); g.fillStyle = '#ffd27a'; g.fillText(c, 0, 40);
        g.restore();
      });
      g.restore();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ out here (shot 10a): he walks on, nose in his form
  const WALK2 = (u) => [6.0 + 1.1 * u, 1.1];
  function camWalk(t) { const x = WALK2(t - A('n18'))[0]; return R.camera({ x: x - 0.9, y: 1.42, z: 2.65, yaw: 0.4, pitch: -0.06, f: 1500, cx: 540, cy: 960 }); }
  function walkFigure(g, cam, t, items) {
    const u = t - A('n18'), x = WALK2(u)[0], tr = { x, z: 5.4, h: PI / 2, tg: (x - 6) / STY.cop.stride * 2 }, lf = life(3.3, t, 0.3);
    const pose = { walk: 1, lean: -0.01 + lf.lean * 0.5, headPitch: 0.36, headYaw: 0.05 * lf.headYaw, arms: { l: { wrist: [BOARD[0] - 0.02, BOARD[1] - 0.1, BOARD[2] + 0.11], pole: [0.1, -1, 0.9], w: 1 }, r: { wrist: [BOARD[0] + 0.01, BOARD[1] + 0.02, -0.05], pole: [0.2, -1, -0.8], w: 1 } } };
    const W0 = { S: STY.cop, look: LOOK.cop }, q = cam.toCam(x, 1, 5.4);
    items.push({ d: q[2], fn: () => { R.shadow(g, cam, W0, t, { tr, pose, a: 0.22, len: 1.4 }); const F = R.figure(g, cam, W0, t, { tr, pose, face: { look: [0, -0.05], lid: 0.85 }, handPose: { l: 'grip', r: 'grip' }, rim: 0.6, hold: { r: (g2, el, wr) => pen(g2, el, wr) } }); if (F) clipboardBack(g, cam, { tr, board: BOARD }, F, W0, t, () => R.figure(g, cam, W0, t, { tr, pose, face: {}, handPose: { l: 'grip', r: 'grip' }, rim: 0.6, onlyArm: 1 })); } });
  }

  // ------------------------------------------------------------------ the checkpoint (shots 10b, 11): they look for broken glass
  // Down the road, a barricade; our officer and a colleague stop each rickshaw and peer at its windscreen. Two go through. Then
  // his: green and yellow, the lemon and chillies, its glass whole, a dried orange smear across it (no seeds, no shape). He
  // looks right at the glass, it isn't broken, and he waves it through. The driver smiles, sweating.
  const CK = { x: 24.5, lane: 3.55, stop: 22.6 };
  const COP2 = { headK: 0.155, handK: 0.058, skin: '#a8714b', skinD: '#7f5134', skinH: '#c48e66', hair: '#1a1410', style: 'buzz', brow: 0.09, browTilt: 0.02, shirt: '#bfa36b', leg: '#8a764a', shoe: '#121214', sole: '#2a2a2e', girth: 1.2,
    police: { crown: '#a99360', band: '#33271c' }, uniform: { belt: '#43291a', buckle: '#c9a33a', cord: '#f2eee4' } };
  // the queue: [arrives at the stop, waved on] for each rickshaw, in film seconds
  const Q = [{ arrive: SH.ck0 - 1.4, go: SH.ck0 + 0.4, look: 'black' }, { arrive: SH.ck0 + 0.5, go: WD('n19', 4), look: 'black' }, { arrive: WD('n19', 5), go: B('n20') + 0.3, look: 'ours' }, { arrive: B('n20') + 1.5, go: 999, look: 'black' }];
  function queueX(q, t) {                              // a rickshaw's front along the road: up to the stop, wait, then on
    const dIn = 7.0, vIn = 4.2, aT = q.arrive, gT = q.go;
    if (t < aT) return CK.stop - Math.min(60, (aT - t) * vIn) - 0.0 + 0 * dIn;
    if (t < gT) return CK.stop - 0.25 * Math.exp(-(t - aT) * 6);
    const u = t - gT; return CK.stop + 1.2 * u * u + 0.8 * u;
  }
  function ckRickshaw(g, cam, t, q, items, i) {
    const fx = queueX(q, t), x = fx - 1.84, h = PI / 2 + (i === 2 ? 0.0 : 0.02 * Math.sin(i * 3.1));
    const P = S.pose([x, 0, CK.lane + 0.1 * Math.sin(i * 1.7)], h), ours = q.look === 'ours';
    const rk = { P, spin: x / S.RK.rw, wiper: 0, roll: 0, sp: 0, h };
    const faces = S.rickshawFaces(P, ours ? {} : { green: '#2a2a2e' });
    S.faceItems(cam, faces, items);
    for (const [xx, z] of [[0, S.RK.rearZ], [0, -S.RK.rearZ], [S.RK.frontX, 0]]) { const it = S.wheelItem(g, cam, S.at(P, [xx, S.RK.rw, z]), S.dirOf(P, [0, 0, 1]), S.RK.rw, -rk.spin, { w: 0.05, spokes: 0, rimK: 0.62, rimC: '#7d7a75', rimIn: '#4a4845', hub: '#2a2a2c', cap: '#9a968e' }); if (it) items.push(it); }
    const dq = cam.toCam(...S.at(P, [1.0, 1.0, 0]));
    const nervous = ours ? win(t, q.arrive, q.arrive + 0.4, q.go + 0.2, q.go + 0.8) : 0;
    items.push({ d: dq[2], fn: () => driverFigure(g, cam, rk, t, { face: ours ? { smile: 0.9 * nervous, wide: 0.4 * nervous, browY: 0.05 * nervous, look: [0.05, 0] } : { smile: 0.2 }, lean: 0.12 }) });
    const fq = cam.toCam(...S.at(P, [1.62, 1.2, 0]));
    items.push({ d: fq[2] - 0.05, fn: () => {
      S.rickshawFront(g, cam, P, { wiper: 0, glint: 0.3 + 0.1 * Math.sin(t), glintA: 0, hlK: 0.7, splat: ours ? (g2, Sx) => driedSmear(g2, Sx) : null });
      if (ours) { S.charm(g, cam, P, 0.06 * Math.sin(t * 2.3), 0.05 * Math.sin(t * 1.7)); sweat(g, cam, P, t, nervous); }
    } });
  }
  function driedSmear(g, Sx) {                         // what the wiper left, dried: a pale orange fan, no seeds, no shape
    const pv = [S.WIPER.u, 0.03], arc = (r, a0, a1, n = 18) => { const pts = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), q = Sx(S.wsPt(pv[0] - Math.cos(a) * r / 0.86, pv[1] + Math.sin(a) * r / 0.53)); if (q) pts.push(q); } return pts; };
    const outer = arc(0.42, 0.25, 1.85), inner = arc(0.16, 1.85, 0.25);
    g.save(); g.globalAlpha = 0.42; g.beginPath(); [...outer, ...inner].forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fillStyle = '#d89a52'; g.fill();
    g.globalAlpha = 0.3; g.strokeStyle = '#b8742e'; g.lineWidth = 1.5; for (const r of [0.22, 0.29, 0.35, 0.4]) { const pts = arc(r, 0.35, 1.75); g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); }
    g.restore();
  }
  function sweat(g, cam, P, t, k) {                    // drops on the driver's brow as the officer looks at his glass
    if (k < 0.05) return; const hd = cam.P(...S.at(P, [1.06, 1.42, 0.02])); if (!hd) return;
    const r = 0.012 * hd[2]; g.save(); g.globalAlpha = k;
    for (let i = 0; i < 3; i++) { const ph = mod(t * 0.7 + i * 0.33, 1), x = hd[0] + (i - 1) * 0.045 * hd[2], y = hd[1] - 0.06 * hd[2] + ph * 0.05 * hd[2]; g.fillStyle = 'rgba(200,230,255,0.85)'; g.beginPath(); g.moveTo(x, y - r * 1.6); g.quadraticCurveTo(x + r, y, x, y + r); g.quadraticCurveTo(x - r, y, x, y - r * 1.6); g.fill(); }
    g.restore();
  }
  function barricade(cam) {                            // a striped steel barricade across the far lane, and a cone
    const f = [], P = S.pose([CK.x + 0.4, 0, 1.25], PI / 2 + 0.25);
    for (let i = 0; i < 6; i++) f.push(S.quad(P, [-0.05, 0.55, -0.9 + i * 0.3], [-0.05, 0.55, -0.6 + i * 0.3], [-0.05, 0.95, -0.6 + i * 0.3], [-0.05, 0.95, -0.9 + i * 0.3], i % 2 ? '#e8bd2c' : '#26262a', { two: true }));
    for (const z of [-0.85, 0.85]) f.push(...S.tube(P, [0, 0, z], [0, 1.0, z], 0.035, '#5a5a5e', 6));
    f.push(...S.tube(P, [0, 0.02, -0.85], [0, 0.02, 0.85], 0.04, '#5a5a5e', 6));
    const C = S.pose([CK.x - 0.9, 0, 2.35], 0); f.push(...S.tube(C, [0, 0, 0], [0, 0.5, 0], 0.11, '#e8622a', 8)); f.push(...S.box(C, 0, 0.02, 0, 0.18, 0.02, 0.18, '#2a2a2e'));
    return f;
  }
  function officerAt(g, cam, t, items, who, x, z, bendT, hOver) {   // an officer at the checkpoint, bending to a windscreen when told
    const look = who === 'ours' ? LOOK.cop : COP2, bend = bendT, lf = life(who === 'ours' ? 3.1 : 6.2, t, 1);
    const tr = { x, z, h: hOver ?? (who === 'ours' ? -PI / 2 - 0.62 : -PI / 2 + 0.5), tg: 0 };
    const pose = { walk: 0, lean: -0.01 + 0.48 * bend + lf.lean * 0.5, sink: 0.05 * bend, headPitch: (who === 'ours' ? 0.12 : 0.05) - 0.3 * bend + lf.headPitch * 0.5, headYaw: lf.headYaw, twist: lf.twist * 0.5, shrug: lf.shrug,
      arms: who === 'ours' ? { l: { wrist: [BOARD[0] - 0.02, BOARD[1] - 0.1, BOARD[2] + 0.11], pole: [0.1, -1, 0.9], w: 1 }, r: { wrist: lerp3([0.05, -0.36, -0.17], [0.4, 0.22, -0.3], waveK(t)), pole: [0.2, -1, -0.8], w: 1 } } : { l: { wrist: [-0.17, -0.33, 0.06], pole: [-0.4, -1, 0.5], w: 1 }, r: { wrist: lerp3([-0.17, -0.33, -0.06], [0.4, 0.22, -0.3], waveK2(t)), pole: [0.2, -1, -0.8], w: 1 } } };
    const W0 = { S: STY.cop, look }, q = cam.toCam(x, 1, z);
    items.push({ d: q[2], fn: () => { R.shadow(g, cam, W0, t, { tr, pose, a: 0.22, len: 1.4 }); const hp = { l: who === 'ours' ? 'grip' : 'relax', r: (who === 'ours' ? waveK(t) : waveK2(t)) > 0.3 ? 'open' : 'relax' }; const F = R.figure(g, cam, W0, t, { tr, pose, face: { look: [0, 0.02], close: blink(t, who === 'ours' ? 2.1 : 5.5), browY: 0.03 * bend }, handPose: hp, rim: 0.6 }); if (F && who === 'ours') clipboardBack(g, cam, { tr, board: BOARD }, F, W0, t, () => R.figure(g, cam, W0, t, { tr, pose, face: {}, handPose: hp, rim: 0.6, onlyArm: 1 })); } });
  }
  const waveK = (t) => Q.reduce((m, q, i) => (i >= 1 && q.go < 998 ? Math.max(m, win(t, q.go - 0.35, q.go - 0.15, q.go + 0.35, q.go + 0.6)) : m), 0);
  const waveK2 = (t) => win(t, Q[0].go - 0.35, Q[0].go - 0.15, Q[0].go + 0.35, Q[0].go + 0.6);
  function bendFor(t, who) {                           // bending in to look at the glass of whichever rickshaw is stopped
    let b = 0;
    Q.forEach((q, i) => { if ((who === 'two') === (i === 0)) b = Math.max(b, win(t, q.arrive + 0.15, q.arrive + 0.5, Math.min(q.go, 998) - 0.4, Math.min(q.go, 998) - 0.05)); });
    return b;
  }

  function camCheck(t) {
    if (t < SH.glass) {                                 // the checkpoint wide, from the middle of the road past the barricade
      const u = ease(SH.ck0, SH.glass, t);
      return R.camera({ x: lerp(28.2, 27.6, u), y: 1.55, z: lerp(0.35, 0.5, u), yaw: -PI / 2 + 0.36, pitch: -0.045, f: lerp(1280, 1340, u), cx: 540, cy: 960 });
    }
    const u = ease(SH.glass, SH.ck1, t);                // his windscreen, close: the officer peering at it from the side, the driver behind it
    return R.camera({ x: lerp(24.25, 24.05, u), y: 1.36, z: lerp(2.18, 2.28, u), yaw: lerp(-0.92, -0.9, u), pitch: -0.035, f: lerp(1500, 1580, u), cx: 540, cy: 960 });
  }


  function camLast(t) {                                // the last picture: behind the officer bent to the next windscreen; his rickshaw going away up the road
    const u = ease(SH.last[0], SH.last[0] + 6, t);
    return R.camera({ x: lerp(18.3, 18.55, u), y: 1.6, z: lerp(1.0, 1.05, u), yaw: PI / 2 - 0.27, pitch: -0.03, f: lerp(1450, 1500, u), cx: 540, cy: 960 });
  }



  function checkFrame(g, t, cam) {
    S.drawItems(g, cam, S.faceItems(cam, S.STATIC));
    const items = S.faceItems(cam, S.awnings(t));
    S.faceItems(cam, barricade(cam), items);
    Q.forEach((q, i) => { if (queueX(q, t) > -20 && queueX(q, t) < 80) ckRickshaw(g, cam, t, q, items, i); });
    const last = t >= SH.last[0];
    officerAt(g, cam, t, items, 'ours', last ? CK.stop + 0.5 : CK.stop + 0.42, last ? CK.lane - 1.0 : CK.lane + 0.78, bendFor(t, 'ours'), last ? -0.65 : null);
    officerAt(g, cam, t, items, 'two', last ? CK.stop + 1.2 : CK.stop + 1.1, last ? CK.lane + 1.45 : CK.lane - 1.55, bendFor(t, 'two'), last ? -PI / 2 - 0.3 : null);
    S.drawItems(g, cam, items);
  }

  // ------------------------------------------------------------------ the old man, after (the cost has a face)
  // Back at his cart, crouched in the road, gathering his oranges by hand into his gamchha spread on the road.
  function camGather(t) { const u = ease(SH.gather[0], SH.gather[1], t); return R.camera({ x: lerp(-1.7, -1.62, u), y: 1.25, z: lerp(2.55, 2.65, u), yaw: lerp(0.62, 0.6, u), pitch: -0.22, f: lerp(1650, 1720, u), cx: 540, cy: 960 }); }
  function gatherFigure(g, cam, t, items) {
    const u = t - SH.gather[0], tr = { x: -0.25, z: 4.45, h: PI + 0.35, tg: 0 };
    const reach = 0.5 + 0.5 * Math.sin(u * 2.6 - 1.2), lf = life(2.2, t, 0.5);
    const pose = { walk: 0, sink: 0.46, sit: 0.18, lean: 0.55 + lf.lean, headPitch: -0.45, headYaw: 0.1 * Math.sin(u * 1.3), shrug: lf.shrug,
      arms: { r: { wrist: lerp3([0.42, -0.62, -0.32], [0.36, -0.45, 0.02], reach), pole: [0.3, -1, -0.8], w: 1 }, l: { wrist: [0.36, -0.5, 0.18], pole: [0.3, -1, 0.8], w: 1 } } };
    const W0 = { S: STY.old, look: LOOK.old }, q = cam.toCam(tr.x, 1, tr.z);
    items.push({ d: q[2], fn: () => {
      // the gamchha spread on the road in front of him, with the oranges he has gathered
      const cloth = [[-0.15, 4.05], [0.45, 4.0], [0.5, 3.6], [-0.1, 3.62]].map(([x, z]) => cam.P(x, 0.004, z));
      if (cloth.every((c) => c)) { g.beginPath(); cloth.forEach((c, i) => (i ? g.lineTo(c[0], c[1]) : g.moveTo(c[0], c[1]))); g.closePath(); g.fillStyle = '#c4423a'; g.fill(); g.save(); g.clip(); g.strokeStyle = 'rgba(255,238,224,0.6)'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = cam.P(-0.15 + i * 0.09, 0.005, 4.1), b = cam.P(-0.15 + i * 0.09, 0.005, 3.55); if (a && b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } } g.restore(); }
      for (let i = 0; i < 6; i++) S.orange(g, cam, [0.0 + (i % 3) * 0.12, 0.05 + (i > 2 ? 0.07 : 0), 3.85 - Math.floor(i / 3) * 0.1], 0.052, S.qaxis([0, 1, 0], i));
      R.shadow(g, cam, W0, t, { tr, pose, a: 0.22, len: 1.2 });
      const F = R.figure(g, cam, W0, t, { tr, pose, face: { look: [0, -0.05], close: Math.max(0.25, blink(t, 0.7)), browY: -0.03 }, handPose: { r: 'grip', l: 'relax' }, rim: 0.5, hold: reach > 0.7 ? { r: (g2, el, wr) => { const dx = wr[0] - el[0], dy = wr[1] - el[1], n = Math.hypot(dx, dy) || 1; S.orange(g2, cam, [0, 0, 0], 0, null); g2.fillStyle = '#f08a1c'; g2.beginPath(); g2.arc(wr[0] + dx / n * 0.05 * wr[2], wr[1] + dy / n * 0.05 * wr[2], 0.05 * wr[2], 0, TAU); g2.fill(); } } : null });
      gamchha(g, cam, F);
    } });
  }

  // ------------------------------------------------------------------ the scenes
  const SHOTS = [
    { name: 'wide', a: 0, cam: camCrash },
    { name: 'step', a: A('n04') - 0.08, cam: camStep },
    { name: 'speed', a: SH.speed[0], draw: shotSpeed },
    { name: 'pick', a: SH.pick[0], draw: (g, t) => shotPick(g, t, 'pick') },
    { name: 'glide', a: SH.glide[0], cam: camGlide },
    { name: 'taps', a: SH.taps[0], draw: (g, t) => shotPick(g, t, 'taps') },
    { name: 'mem', a: SH.mem[0], draw: (g, t) => memoryShot(g, t, S0ref) },
    { name: 'y74', a: SH.y74[0], draw: hallShot },
    { name: 'court', a: SH.court[0], draw: courtShot },
    { name: 'walk', a: SH.walk[0], cam: camWalk },
    { name: 'check', a: SH.ck0, cam: camCheck },
    { name: 'gather', a: SH.gather[0], cam: camGather },
    { name: 'last', a: SH.last[0], cam: camLast },
  ];
  let S0ref = null;
  const shotAt = (t) => { let k = 0; for (let i = 0; i < SHOTS.length; i++) if (t >= SHOTS[i].a) k = i; return SHOTS[k]; };
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S0) {
      S0.g = canvas(root); S0ref = S0;
      S0.mem = {}; for (const L of MEM_LAYERS) { const c = document.createElement('canvas'); c.width = W; c.height = H; S0.mem[L] = c; }
      S0.memSil = document.createElement('canvas'); S0.memSil.width = W; S0.memSil.height = H;
      S0.t1 = U.line(root, "YOU'RE THE ONLY", { x: 96, y: 300, size: 116 });
      S0.t2 = U.line(root, 'WITNESS', { x: 92, y: 400, size: 236 });
      for (const L of [S0.t1, S0.t2]) L.el.style.textShadow = '0 3px 10px rgba(8,10,14,0.6), 0 1px 3px rgba(8,10,14,0.5)';
    },
    run(t, b, S0) {
      const g = S0.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      g.save();
      const sh = shotAt(t);
      g.fillStyle = '#d9c7a6'; g.fillRect(0, 0, W, H);
      if (sh.draw) sh.draw(g, t);
      else if (sh.cam) {
        const cam = sh.cam(t);
        if (sh.name === 'check' || sh.name === 'last') checkFrame(g, t, cam);
        else crashFrame(g, t, cam, { tau: sh.name === 'walk' || sh.name === 'gather' ? 6 : undefined, noOld: sh.name === 'glide' || sh.name === 'walk' || sh.name === 'gather', noThief: sh.name !== 'wide',
          extra: sh.name === 'step' ? (items) => copFigure(g, cam, t, items) : sh.name === 'walk' ? (items) => walkFigure(g, cam, t, items) : sh.name === 'gather' ? (items) => gatherFigure(g, cam, t, items) : null });
        if (sh.name === 'wide') speedLines(g, cam, t);
      } else { g.fillStyle = '#20242a'; g.fillRect(0, 0, W, H); }
      g.restore();
      U.rise(t, S0.t1, [-0.4, -0.35], T_HIT - 0.05);
      U.rise(t, S0.t2, [-0.4, -0.35], T_HIT - 0.02);
    },
  });

  // every reel ends with the Root Cause end card ('end' → 'done', 3.0 s, engine/endcard)
  U.endcard();
  U.grain(0.06);
  C.start();
  window.DEBUG = { crashT, T_HIT, SIM_MS: S.SIM_MS() };
})();
