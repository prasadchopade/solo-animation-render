// Reel 45 · The Wallet. Tests desk, a Season 1 episode. One continuous shot, no cuts: you've left your wallet on a chai-stall
// bench beside the man with the mole and the maroon cap. He opens it, sets the cash on one knee and the empty wallet on the
// other (the pick), counts the notes while the study's numbers come up, sees himself in the stall's steel kettle on "see
// themselves as a thief", pockets it ... and holds it out to you when you come back. It's all there, plus a brass chai token he
// slipped in while the numbers were up. docs/script.md has the beats; every beat is set from the placed voice (film/timing.js,
// written by place_vo.py). The rig is reel 42's (film/rig.js); the hands are new and 3D (film/hand3.js); the props
// (film/props.js) and the set (film/set.js) are new. Our own drawings; nobody real. 30 fps. Every frame is a pure function of
// t, sealed in save()/restore().
// The objects lead and the hands hold on: the wallet, the notes, the token and the glass each have a path with weight (a lift
// that dips and settles, a flop open, a slap shut), and each hand either holds one of them by a grip or moves on its own, on an
// arc with minimum jerk (reel 42's armTrack, here in 3D with the hand's turn and pose eased along with it).
(() => {
  const { W, H, scene, canvas } = C;
  const R = window.RIG, H3 = window.HAND3, PR = window.PROPS, ST = window.SET, T = window.TIMING;
  const { sub, mul, madd, dot, cross, norm, lerp3, ortho, towards } = H3.v;
  const add = (...vs) => vs.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]);
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = R.sstep, wrap = R.wrap, mix = R.mix;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn'];
  R.setSun([0.62, 0.72, -0.32]);                        // the key light: the stall's bulb, high on his left (the screen's right), a little your side
  R.setTones('#ffe6bf', '#2c2a48');                     // warm light, cool evening shade
  const K = T;

  // ------------------------------------------------------------------ motion helpers (reel 42's, by name: the brief allows them)
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
  // a person sitting is never quite still: breath, a slow shift of weight, a look that drifts (reel 42's life())
  function life(seed, t, k = 1) {
    const s = (hz, ph) => Math.sin(TAU * (hz * t + ph));
    const b = s(0.26, seed * 0.37), w1 = s(0.09, seed * 0.71), w2 = s(0.14, seed * 0.29 + 0.2), h1 = s(0.19, seed * 0.53), h2 = s(0.31, seed * 0.17 + 0.4);
    return { shrug: 0.009 * b * k, lean: (0.011 * b + 0.015 * w1) * k, twist: 0.04 * w2 * k, headYaw: (0.045 * h1 + 0.02 * h2) * k, headPitch: (0.024 * h2 - 0.014 * b) * k, headTilt: 0.028 * w1 * k };
  }
  const springE = (u) => (u <= 0 ? 0 : u < 0.72 ? 1.06 * mj(u / 0.72) : 1 + 0.06 * (1 - mj((u - 0.72) / 0.28)));   // out past the mark and back, no jolt at either end
  function bow(a, b, f, side, amt) {                  // a hand's path from a to b, bowed outwards and up (reel 42's, its sideways set by the hand)
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
    const p = [a[0] + d[0] * f, a[1] + d[1] * f, a[2] + d[2] * f]; if (L2 < 4e-4) return p;
    let n = [0.25 * side, 0.7, -0.35]; const k = (n[0] * d[0] + n[1] * d[1] + n[2] * d[2]) / L2; n = [n[0] - k * d[0], n[1] - k * d[1], n[2] - k * d[2]];
    const g = clamp(f), h = amt * Math.sqrt(L2) * 4 * g * (1 - g) / (Math.hypot(n[0], n[1], n[2]) || 1);
    return [p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h];
  }
  function blink(t, seed) {                          // now and then, not like a clock: once in each 3.5 s, somewhere in it (reel 42)
    const P = 3.5, x = t + seed * 7.3, n = Math.floor(x / P), h = (Math.abs(Math.sin(n * 12.9898 + seed * 78.233)) * 43758.5453) % 1, u = x - n * P - (0.3 + 2.6 * h);
    return u < 0 || u > 0.15 ? 0 : u < 0.07 ? sstep(0, 0.07, u) : 1 - sstep(0.08, 0.15, u);
  }
  // a damped spring on a keyed value (reel 42's headAt, made general): quick turns overshoot a touch and settle, landing on time
  const HZ = 0.55, HW = TAU * 2.4, HWD = HW * Math.sqrt(1 - HZ * HZ), HDT = 0.025;
  const HIMP = Array.from({ length: 22 }, (_, k) => Math.exp(-HZ * HW * k * HDT) * Math.sin(HWD * k * HDT));
  const HSUM = HIMP.reduce((a, b) => a + b, 0), HLAG = HIMP.reduce((a, b, k) => a + b * k * HDT, 0) / HSUM;
  function sprung(t, f) { let acc = null; for (let k = 1; k < HIMP.length; k++) { const v = f(t + HLAG - k * HDT); if (!acc) acc = v.map(() => 0); for (let j = 0; j < v.length; j++) acc[j] += HIMP[k] * v[j]; } return acc.map((x) => x / HSUM); }
  const WORDS = window.WORDS || [];
  const word = (w, k = 0) => { let n = 0; for (const x of WORDS) if (x.w.replace(/[^A-Za-z]/g, '').toLowerCase() === w) { if (n === k) return x.t0; n++; } return 0; };

  // ------------------------------------------------------------------ the people's looks
  // everyone shares the season's skin range (nobody darker than him); no saffron or green; only he wears a cap
  const LOOK = {
    thief: { headK: 0.15, handK: 0.058, skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', style: 'short', cap: true, must: 0.07, stub: 0.55, mole: [0.44, -0.48], brow: 0.08, browTilt: 0.03, shirt: '#37a18a', leg: '#20262f', shoe: '#141414', sole: '#d8d0c0' },
    you: { headK: 0.14, skin: '#6b4026', skinD: '#4f2e1b', skinH: '#84553a', hair: '#1a120c', style: 'short', brow: 0.075, shirt: '#2f6fd6', sleeve: 'long', leg: '#2a3346', shoe: '#e8e4dc', sole: '#ffffff', bag: '#4a4f5a', phone: '#202228' },
    cw: { headK: 0.15, skin: '#ad7650', skinD: '#85553a', skinH: '#c8946c', hair: '#8a8580', style: 'part', must: 0.16, brow: 0.09, shirt: '#7d8c9e', leg: '#3c3a44', shoe: '#2a221c', sole: '#7a6a58', girth: 1.12 },
    cyc: { headK: 0.15, skin: '#b07650', skinD: '#86553a', skinH: '#cc9670', hair: '#120d09', style: 'curly', brow: 0.075, shirt: '#d8d2c4', leg: '#4b4a5c', shoe: '#2a221c', sole: '#8a7a68' },
  };
  const HANDLOOK = { thief: { skin: '#b27a54', skinD: '#8a583a' }, you: { skin: '#6b4026', skinD: '#4f2e1b', palm: '#b07a58' } };   // after test 6: darker than his, so your hand is yours even before its sleeve shows

  // ------------------------------------------------------------------ him, seated
  const H0 = PI + 0.16;                                 // facing you, turned a little to his right (the wallet's side, the street's)
  const FWD = [Math.sin(H0), 0, Math.cos(H0)], LEFT = [-Math.cos(H0), 0, Math.sin(H0)], UP = [0, 1, 0];
  const SIT = 0.40, PELV = [0.30, 0, 0.22];
  const TR = { x: PELV[0] + FWD[0] * SIT, z: PELV[2] + FWD[2] * SIT, h: H0, tg: 0 };
  const STY = R.style({ stride: 0.5, cad: 1, stepW: 0.25, toeOut: 0.1, headStab: 0.85, lean: 0.07, nod: 0, sway: 0, pelYaw: 0, pelRoll: 0, chestYaw: 0, arm: 0, elbow: 0.5, elbowDyn: 0, armBias: 0.1 });
  const FEET = { l: [0.05, 0.075, 0], r: [0.05, 0.075, 0], wl: 1, wr: 1 };
  const SEAT = { walk: 0, sink: 0.30, sit: SIT, feet: FEET };
  const w3 = (p, tr = TR) => { const sh = Math.sin(tr.h), ch = Math.cos(tr.h); return [tr.x + (sh * p[0] - ch * p[2]), p[1], tr.z + (ch * p[0] + sh * p[2])]; };
  const local = (P, tr = TR) => { const sh = Math.sin(tr.h), ch = Math.cos(tr.h), dX = P[0] - tr.x, dZ = P[2] - tr.z; return [dX * sh + dZ * ch, P[1], -dX * ch + dZ * sh]; };
  const J0 = R.skel(STY, 0, SEAT);
  const KNEE_R = madd(w3(J0.knR), UP, 0.07), KNEE_L = madd(w3(J0.knL), UP, 0.07);
  const THIGH_R = madd(lerp3(w3(J0.hR), w3(J0.knR), 0.62), UP, 0.08), THIGH_L = madd(lerp3(w3(J0.hL), w3(J0.knL), 0.62), UP, 0.08);
  const LAP = lerp3(THIGH_R, THIGH_L, 0.5);
  const HEADP = w3(J0.head);

  // ------------------------------------------------------------------ frames for things (the wallet: O spine-middle, A along the spine, B across, N out of its inside)
  const fixB = (f) => ({ ...f, B: norm(cross(f.N, f.A)) });           // keeps N = A x B
  const mkF = (O, A, N) => { A = norm(A); N = ortho(N, A); return fixB({ O, A, N }); };
  const mkFN = (O, A, N) => { N = norm(N); A = ortho(A, N); return fixB({ O, A, N }); };   // keeps N (the tilt), squares the spine to it
  // a frame's turn as a quaternion (columns x, y, z right-handed), so turns ease the short way round and never flip
  function m2q(x, y, z) {
    const m00 = x[0], m01 = y[0], m02 = z[0], m10 = x[1], m11 = y[1], m12 = z[1], m20 = x[2], m21 = y[2], m22 = z[2], tr = m00 + m11 + m22;
    if (tr > 0) { const S = Math.sqrt(tr + 1) * 2; return [0.25 * S, (m21 - m12) / S, (m02 - m20) / S, (m10 - m01) / S]; }
    if (m00 > m11 && m00 > m22) { const S = Math.sqrt(1 + m00 - m11 - m22) * 2; return [(m21 - m12) / S, 0.25 * S, (m01 + m10) / S, (m02 + m20) / S]; }
    if (m11 > m22) { const S = Math.sqrt(1 + m11 - m00 - m22) * 2; return [(m02 - m20) / S, (m01 + m10) / S, 0.25 * S, (m12 + m21) / S]; }
    const S = Math.sqrt(1 + m22 - m00 - m11) * 2; return [(m10 - m01) / S, (m02 + m20) / S, (m12 + m21) / S, 0.25 * S];
  }
  function q2cols(q) { const [w, x, y, z] = q; return [[1 - 2 * (y * y + z * z), 2 * (x * y + w * z), 2 * (x * z - w * y)], [2 * (x * y - w * z), 1 - 2 * (x * x + z * z), 2 * (y * z + w * x)], [2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y)]]; }
  function slerp(a, b, u) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; if (d < 0) { b = b.map((v) => -v); d = -d; }
    if (d > 0.9995) { const r = a.map((v, i) => v + (b[i] - v) * u), l = Math.hypot(...r); return r.map((v) => v / l); }
    const th = Math.acos(d), s0 = Math.sin((1 - u) * th) / Math.sin(th), s1 = Math.sin(u * th) / Math.sin(th);
    return a.map((v, i) => v * s0 + b[i] * s1);
  }
  function lerpFrame(a, b, u) { const q = slerp(m2q(a.A, a.B, a.N), m2q(b.A, b.B, b.N), clamp(u)), [A, B, N] = q2cols(q); return { ...a, ...b, O: lerp3(a.O, b.O, u), A, B, N }; }
  const turnFrame = (f, axis, ang) => ({ ...f, A: PR.rot(f.A, axis, ang), B: PR.rot(f.B, axis, ang), N: PR.rot(f.N, axis, ang) });
  const turnY = (v, a) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
  // the wallet on the bench where you sat (to his right): shut, the edge of the notes towards you
  const W_BENCH = (() => { const A = norm([-0.34, 0, -0.94]), f = mkF([0.0, ST.BENCH.y + PR.WT + 0.0005, 0.085], A, UP); return { ...f, O: madd(f.O, f.B, -PR.WW * 0.5) }; })();
  // on a knee: the spine across the thigh, the inside up and tipped towards his face
  const onKnee = (Kp, tip, rot) => { const A = norm(turnY(mul(FWD, -1), rot)), N = norm(add(UP, mul(FWD, -tip))); const f = mkFN(madd(Kp, N, PR.WT + 0.003), A, N); return { ...f, O: madd(f.O, f.B, -PR.WW * 0.5) }; };
  const W_RKNEE = onKnee(KNEE_R, -0.55, 0.2);
  const W_LKNEE_OLD = (() => { const N = norm(add(UP, mul(FWD, 0.62))), f = mkFN(madd(madd(KNEE_L, UP, PR.WT + 0.03), FWD, -0.05), FWD, N); return f; })();   // (before test 8) on his left knee, the spine across it at the back, the back leaf towards you
  const W_LKNEE = onKnee(madd(madd(KNEE_L, UP, 0.01), LEFT, 0.09), -0.55, -0.2);   // (after test 8: 9 cm further out, clear of the cash he counts; at the twist '40%' sat on the cash)   // after test 7: on his left knee as it lay on his right, the inside up and tipped to you (it now lies here from 2.5 s, cash and all)
  // in his left hand over his lap, open, tipped to him
  const W_LHAND = (() => { const c = madd(madd(LAP, UP, 0.11), FWD, 0.13), N = norm(add(mul(FWD, 0.1), UP)), A = norm(add(mul(FWD, 1), mul(UP, -0.1))); const f = mkF(c, A, N); return { ...f, O: madd(f.O, LEFT, -0.0) }; })();
  // after test 6: the open wallet over the middle of his lap, tipped up towards you as it lay on his knee, so the cash shows
  const W_LHAND2 = onKnee(madd(madd(LAP, UP, 0.11), FWD, 0.13), -0.55, 0.05);
  // his shirt's left breast pocket: A up, N out of his chest
  const POCK = (() => { const c = w3(J0.chest); return mkF(madd(madd(madd(c, FWD, 0.118), LEFT, 0.082), UP, -0.07), UP, norm(add(FWD, mul(UP, -0.06)))); })();
  const W_POCKET = (() => { const f = mkF(POCK.O, POCK.A, POCK.N); return { ...f, O: madd(madd(madd(f.O, f.B, -PR.WW * 0.5), f.N, -0.012), f.A, 0.03) }; })();
  // the pocket as it is at t: it moves with his chest as he leans and turns (W_POCKET is where it is when he sits up; motion test 5
  // left the wallet there while he leant back to drink, so it hung on his shirt above the pocket)
  function pocketAt(t) {
    const Jl = R.skel(STY, 0, bodyAt(t)), ch = w3(Jl.chest), lat = norm(sub(w3(Jl.shL), w3(Jl.shR))), up = norm(sub(ch, w3(Jl.pel))), fw = norm(cross(up, lat));
    const f = mkF(madd(madd(madd(ch, fw, 0.118), lat, 0.082), up, -0.07), up, norm(add(fw, mul(up, -0.06))));
    return { ...f, O: madd(madd(madd(f.O, f.B, -PR.WW * 0.5), f.N, -0.012), f.A, 0.03) };
  }
  // held low in his right hand, shut, as he looks round
  const W_RLOW = (() => { const c = madd(madd(THIGH_R, UP, 0.07), FWD, 0.05), N = norm(add(mul(FWD, 0.55), mul(UP, 0.83))), A = norm(add(mul(LEFT, -0.2), mul(FWD, 0.83), mul(UP, -0.55))); return mkF(c, A, N); })();   // (after test 7: tipped to you; lying flat it was edge-on, then flipped face-on going up to the pocket)
  // the camera, as you, standing over him (the end of the arc): the hold-out is set from it
  const POV = { x: 0.24, y: 1.58, z: -0.80 };
  const toYou = norm(sub([POV.x, POV.y, POV.z], HEADP));
  const toYouH = norm([toYou[0], 0, toYou[2]]);
  const W_OUT = (() => { const c = madd(madd(madd(HEADP, toYouH, 0.44), UP, -0.17), LEFT, -0.04), N = norm(add(UP, mul(toYouH, 0.9))), A = norm(cross(toYouH, UP)); const f = mkF(c, A, N); return { ...f, O: madd(f.O, f.B, -0.02) }; })();   // held out to you at his chest, its face tipped to you

  // ------------------------------------------------------------------ the camera
  // an orbit about a target: keys [t, target x, y, z, distance, round him (rad: 0 in front of him, + towards his left), up (rad),
  // focal length (px), where the target sits on screen (cx, cy)]. Between keys a monotone cubic, so it eases and never overshoots.
  const WB_C = () => madd(W_BENCH.O, W_BENCH.B, PR.WW * 0.5);
  function camKeys() {
    const k = [], hk = HEADP, wb = WB_C(), lap = LAP, kt = [ST.KETTLE.x, ST.KETTLE.y + 0.17, ST.KETTLE.z];
    const mid = (a, b, u = 0.5) => lerp3(a, b, u);
    // 0 · the find: your wallet and his hand low and big, his face above, leaning over it
    k.push([0, 0.2, 0.95, 0.0, 0.92, 0.3, 0.0, 950, 600, 820]);   // from a little to his left: the street behind him, and you walking off down it
    k.push([1.4, 0.2, 0.95, 0.0, 0.88, 0.27, 0.02, 960, 600, 820]);
    // 1 · the cash: eases in on his lap and the open wallet
    k.push([K.open, 0.16, 0.82, -0.05, 0.86, 0.12, 0.12, 960, 600, 900]);
    k.push([K.handoff, 0.18, 0.82, -0.05, 0.88, 0.06, 0.14, 960, 590, 900]);
    // 2 · the pick: square on to him; both knees and his face
    k.push([K.cash, 0.25, 0.80, -0.05, 0.88, -0.05, 0.18, 960, 540, 880]);
    k.push([K.scales + 1.1, 0.25, 0.80, -0.05, 0.85, -0.04, 0.18, 970, 540, 880]);
    // 3 · the study: a slow push in on the count, the wallet still in frame
    k.push([K.pickup + 0.6, 0.24, 0.80, -0.06, 0.94, -0.12, 0.22, 930, 540, 960]);
    k.push([K.p40, 0.24, 0.80, -0.06, 0.88, 0.0, 0.24, 960, 540, 960]);
    k.push([K.stop, 0.24, 0.80, -0.06, 0.84, 0.08, 0.24, 985, 540, 950]);
    // 4 · why: up to his face, round to his left, the kettle beside his head
    k.push([K.square + 0.9, 0.25, 0.86, -0.04, 0.86, 0.08, 0.2, 960, 540, 900]);
    k.push([K.weigh, 0.34, 1.0, 0.04, 0.86, -0.05, 0.12, 940, 540, 860]);
    k.push([K.rack1, 0.62, 1.22, 0.22, 0.92, -0.1, 0.06, 820, 520, 820]);
    k.push([word('see') + 0.4, 0.72, 1.22, 0.24, 0.9, -0.08, 0.06, 1000, 470, 820]);   // as the focus lands, the camera pushes in on the kettle
    k.push([K.catch, 0.74, 1.22, 0.25, 0.86, -0.07, 0.06, 1070, 455, 820]);
    // 5 · the turn: back to his real face
    k.push([K.smile + 0.25, ...mid(hk, lap, 0.2), 0.78, 0.36, 0.08, 1060, 540, 820]);
    // 6 · the temptation: his hands and the wallet, then the arc round to his front, rising to your eyes
    k.push([K.slap, ...mid(hk, lap, 0.45), 0.80, 0.42, 0.12, 1020, 540, 900]);
    k.push([K.arc0, ...mid(hk, lap, 0.42), 0.82, 0.62, 0.12, 1000, 540, 900]);
    k.push([lerp(K.arc0, K.arc1, 0.5), ...mid(hk, lap, 0.38), 0.92, 0.3, 0.38, 990, 540, 900]);
    k.push([K.arc1, ...mid(hk, lap, 0.32), 0.78, -0.04, 0.62, 1000, 540, 820]);
    // 7 · you, standing over him; his hand comes to the lens
    k.push([K.holdOut, ...mid(hk, lap, 0.32), 0.78, -0.04, 0.60, 1000, 540, 800]);
    k.push([K.letGo + 0.6, ...mid(hk, lap, 0.32), 0.78, -0.04, 0.62, 1000, 540, 820]);
    // 9 · the last picture: down to the wallet in your hands, then up to him
    k.push([K.down, ...mid(hk, lap, 0.32), 0.78, -0.04, 0.62, 1000, 540, 820]);
    k.push([K.openW + 0.3, ...mid(hk, lap, 0.32), 0.78, -0.04, 0.62, 1000, 540, 820]);
    k.push([K.up, ...mid(hk, lap, 0.32), 0.78, -0.04, 0.62, 1000, 540, 820]);
    k.push([K.brim, ...mid(hk, lap, 0.32), 0.76, -0.04, 0.6, 1010, 540, 820]);
    k.push([K.end, ...mid(hk, lap, 0.32), 0.75, -0.04, 0.6, 1015, 540, 820]);
    return k;
  }
  // after motion test 5 ("too AI slop"): the camera holds, then moves with purpose. A key that only drifts from the one before
  // becomes a hold; a real move happens in the last 0.9 s before its key (eased in and out), with a hold before it. The swing
  // round to your eyes (arc0 to arc1) keeps its own timing.
  function holdsAndMoves(k) {
    const out = [k[0].slice()];
    for (let i = 1; i < k.length; i++) {
      const a = out[out.length - 1], b = k[i].slice(), gap = b[0] - a[0], inArc = b[0] > K.arc0 + 0.01 && a[0] < K.arc1 - 0.01;
      const small = Math.abs(b[4] - a[4]) < 0.07 && Math.abs(b[5] - a[5]) < 0.13 && Math.abs(b[6] - a[6]) < 0.05 && Math.abs(b[7] - a[7]) < 60 && Math.abs(b[8] - a[8]) < 40 && Math.abs(b[9] - a[9]) < 40 && Math.hypot(b[1] - a[1], b[2] - a[2], b[3] - a[3]) < 0.06;
      if (!inArc && small) { for (let j = 1; j < 10; j++) b[j] = a[j]; out.push(b); continue; }
      const mag = Math.abs(b[5] - a[5]) + Math.abs(b[6] - a[6]) + 1.5 * Math.hypot(b[1] - a[1], b[2] - a[2], b[3] - a[3]) + Math.abs(b[4] - a[4]);
      const mv = Math.min(gap * 0.75, 0.75 + 0.45 * clamp(mag / 0.9));   // after test 6: big moves take longer (the whip back from the kettle was 45 px a frame)
      if (!inArc && gap > mv + 0.25) { const h = a.slice(); h[0] = b[0] - mv; out.push(h); }
      out.push(b);
    }
    return out;
  }
  const CAMK = holdsAndMoves(camKeys()), LENS = 1.8, ZOOM = 1.2;
  const NX = C.noise1(11), NY = C.noise1(23), NZ = C.noise1(37);
  function camAt(t) {
    const [tx, ty, tz, d0, az, el, f0, cx, cy] = window.CAMOVR || key(t, CAMK);
    const zf = window.CAMOVR ? 1 : lerp(lerp(1.3, LENS, ease(K.open - 1.0, K.open, t)), 1, ease(K.arc0, K.arc1, t));   // the longer lens, from further back (a little wider at the start, so you're seen walking off)
    // and closer in on him and his hands (his face and the wallet fill the frame, not his knees), but not at the start (you walking
    // off down the street) or while the kettle is the picture; each change rides the camera move that's happening anyway
    const zIn = window.CAMOVR ? 0 : ease(K.open - 0.9, K.open, t) * (1 - ease(K.weigh - 0.9, K.weigh, t)) + ease(K.smile - 0.65, K.smile + 0.25, t) * (1 - ease(K.arc0, K.arc1, t));
    const d = d0 * zf, f = f0 * zf * (1 + (ZOOM - 1) * zIn);
    const a = H0 - az, dir = [Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)];
    const hand = 0;                                       // (after motion test 5: no hand-held wobble)
    const X = tx + dir[0] * d + NX(t * 0.35) * 0.006 * hand, Y = ty + dir[1] * d + NY(t * 0.33 + 4) * 0.005 * hand, Z = tz + dir[2] * d + NZ(t * 0.3 + 9) * 0.004 * hand;
    const ddx = tx - X, ddy = ty - Y, ddz = tz - Z, tilt = window.CAMOVR ? 0 : -0.62 * (ease(K.down - 0.3, K.openW + 0.3, t) * (1 - ease(K.up - 0.1, K.up + 0.75, t)));
    return R.camera({ x: X, y: Y, z: Z, yaw: Math.atan2(ddx, ddz), pitch: Math.atan2(ddy, Math.hypot(ddx, ddz)) + tilt, roll: NX(t * 0.21 + 30) * 0.004 * hand, f, cx, cy: cy + 140 * (tilt / -0.62) });
  }
  const camPos = (c) => [c.x, c.y, c.z];
  const camFwd = (c) => [Math.sin(c.yaw) * Math.cos(c.pitch), Math.sin(c.pitch), Math.cos(c.yaw) * Math.cos(c.pitch)];

  // ------------------------------------------------------------------ the wallet's path
  // frame 0: your wallet is in his right hand, just picked up off the bench: it rises to his chest (its weight dips his wrist as it
  // arrives), half open like a book towards him, the notes standing up out of it; then onto his knee, where his thumb flops it open
  const W_HAND1 = (() => { const c = madd(madd(madd(LAP, UP, 0.26), FWD, 0.13), LEFT, -0.06); const f = mkF(c, norm(add(UP, mul(FWD, 0.22))), norm(add(mul(FWD, -1), mul(UP, 0.22)))); return { ...f, O: madd(f.O, f.B, -PR.WW * 0.5) }; })();
  const W_HAND0 = { ...W_HAND1, O: madd(madd(madd(W_HAND1.O, UP, -0.22), LEFT, -0.12), FWD, -0.04) };
  function walletAt(t) {
    let f = W_HAND1;
    { const u = clamp(t / 0.85), e = mj(u), dip = 0.022 * Math.sin(PI * clamp((t - 0.62) / 0.42)) * (t > 0.62 ? 1 : 0);
      const bob = 0.006 * Math.sin(TAU * 0.6 * t);
      f = lerpFrame(W_HAND0, W_HAND1, e); f = { ...f, O: madd(f.O, UP, -dip + bob * clamp((t - 1) / 0.5)) }; }
    // after test 7: onto his left knee, and left there through the draw (no handoff: carried across his lap it went through his
    // palms, and at the draw it turned upright and jumped)
    if (t >= K.open - 1.0) f = lerpFrame(f, W_LKNEE, ease(K.open - 1.0, K.open - 0.05, t));
    // after test 8: it stays on his knee while the notes go back in and he slaps it shut (lifted into his hand it tumbled)
    if (t >= K.slap + 0.12) f = lerpFrame(W_LKNEE, W_RLOW, ease(K.slap + 0.12, K.slap + 0.75, t));
    if (t >= K.pocket - 0.4) {                          // up to the pocket, and down into it
      const WP = pocketAt(t), above = { ...WP, O: madd(WP.O, WP.A, 0.05) };
      f = lerpFrame(lerpFrame(W_RLOW, above, ease(K.pocket - 0.75, K.pocket + 0.1, t)), WP, ease(K.pocket + 0.05, K.pocket + 0.38, t));
    }
    if (t >= K.reach + 0.22) {                          // out of it, and held out to you, to the lens
      const WP = pocketAt(t), above = { ...WP, O: madd(WP.O, WP.A, 0.09) };
      f = lerpFrame(lerpFrame(WP, above, ease(K.reach + 0.22, K.reach + 0.5, t)), W_OUT, ease(K.reach + 0.45, K.holdOut, t));
      const tug = 0.016 * Math.sin(PI * clamp((t - K.take - 0.05) / 0.5)) - 0.006 * Math.sin(TAU * clamp((t - K.take - 0.1) / 0.4));
      f = { ...f, O: madd(f.O, toYou, tug) };
      if (t >= K.letGo) f = lerpFrame(f, yourWallet(t), ease(K.letGo, K.letGo + 0.5, t));
    }
    let open = 1.35;                                    // how open: like a book towards him, then flopped open by his thumb; slapped shut; opened by you
    if (t >= K.open) open = lerp(1.35, PI * 0.92, springE((t - K.open) / 0.42));
    if (t >= K.slap) { const u = clamp((t - K.slap) / 0.16); open = PI * 0.92 * (1 - u * u * (3 - 2 * u)) + 0.07 * Math.sin(PI * clamp((t - K.slap - 0.16) / 0.16)) * (t > K.slap + 0.16 ? 1 : 0); }
    const OPEN_Y = K.down - 1.0;                       // after test 6: you open it below the frame, then bring it up
    if (t >= OPEN_Y) open = PI * 0.78 * springE((t - OPEN_Y) / 0.8);
    return { ...f, open, gap: 0.009 };
  }
  // where you hold your wallet (camera-relative: you're the camera from the arc's end on)
  function yourWalletOld(t) {
    const cam = camAt(t), C0 = camPos(cam), fw = camFwd(cam), right = norm(cross(UP, fw)), upc = norm(cross(fw, right));   // (after test 6: cross(fw, UP) is the camera's left here; your right hand was drawn on the left)
    const look = ease(K.down, K.openW + 0.3, t) * (1 - ease(K.up, K.up + 0.5, t));
    const near = lerp(0.42, 0.34, look), down = lerp(-0.30, -0.16, look);
    const O = madd(madd(madd(C0, fw, near), upc, down), right, 0.04);
    const A = norm(add(mul(right, -1), mul(upc, 0.15))), N = norm(add(mul(fw, -1), mul(upc, 0.35)));
    const f = mkF(O, A, N); return f;
  }

  function yourWallet(t) {
    const cam = camAt(t), C0 = camPos(cam), fw = camFwd(cam), right = norm(cross(UP, fw)), upc = norm(cross(fw, right));   // (after test 6: cross(fw, UP) is the camera's left here; your right hand was drawn on the left)
    const look = ease(K.down, K.openW + 0.2, t) * (1 - ease(K.up, K.up + 0.5, t));
    const away = ease(K.letGo + 0.5, K.letGo + 1.2, t) * (1 - ease(K.down - 0.5, K.down, t));   // lowered out of the frame while he talks, then up to open it
    const gone = ease(K.up, K.up + 0.55, t);           // and down out of the frame again as you look up at him
    const near = lerp(0.40, 0.36, look), down = lerp(-0.34, -0.06, look) - 0.42 * away - 0.5 * gone;
    const O = madd(madd(madd(C0, fw, near), upc, down), right, lerp(0.07, 0.0, look));
    const N = norm(add(mul(fw, -1), mul(upc, lerp(0.15, 0.55, look)))), A = norm(add(upc, mul(fw, 0.3)));
    const closer = ease(K.token - 0.3, K.up, t) * (1 - gone);
    let f = mkF(madd(O, fw, -0.025 * closer), A, N); f = turnFrame(f, right, -0.14 * closer);
    const opened = ease(K.down - 1.0, K.down - 0.3, t) * (1 - gone);   // centred on the spine once it's open
    return { ...f, O: madd(f.O, f.B, -PR.WW * 0.5 * (1 - Math.max(look, opened))) };
  }
  // ------------------------------------------------------------------ the notes' path (a stack: O its middle, L along, S across, N up)
  const nf = (O, L, N) => { L = norm(L); N = ortho(N, L); return { O, L, S: norm(cross(N, L)), N }; };
  const NUP = 0.055;                                 // after test 7: how far the notes stand up out of the bill pocket (was 0.03), so the cash shows
  function notesInWallet(w, up = 0.03) {               // standing in the bill pocket, their top edge showing
    const h = PR.WH / 2; return { O: madd(madd(w.O, w.A, -h + PR.NW / 2 + 0.006 + up), w.N, 0.0012), L: w.B, S: w.A, N: w.N };
  }
  const N_RKNEE = nf(madd(madd(KNEE_R, UP, 0.012), FWD, -0.02), norm(add(mul(LEFT, -1), mul(FWD, 0.25))), norm(add(UP, mul(FWD, 0.6))));   // across his right knee, tipped up to you
  const N_COUNT = nf(madd(madd(madd(LAP, UP, 0.12), FWD, 0.10), LEFT, -0.07), norm(add(mul(LEFT, -0.8), mul(FWD, 0.3))), norm(add(mul(FWD, 0.6), mul(UP, 0.8))));
  const N_PALM = nf(madd(madd(madd(LAP, UP, 0.1), FWD, 0.12), LEFT, -0.06), norm(add(mul(LEFT, -0.6), mul(FWD, 0.5))), norm(add(mul(FWD, 0.45), UP)));
  const lerpNF = (a, b, u) => { const q = slerp(m2q(a.L, a.S, a.N), m2q(b.L, b.S, b.N), clamp(u)), [L, S, N] = q2cols(q); return { O: lerp3(a.O, b.O, u), L, S, N }; };
  function notesAt(t, w) {
    // in the wallet until two fingers draw them out; laid on his right knee; picked up and counted; squared; weighed; back in
    if (t < K.draw) return { where: 'wallet', up: NUP + 0.015 * (1 - ease(K.open - 0.3, K.open + 0.2, t)) + 0.012 * win(t, K.riffle, K.riffle + 0.2, K.riffle + 0.9, K.riffle + 1.1) };
    const inW = notesInWallet(w, NUP);
    if (t < K.draw + 0.95) {
      const u1 = ease(K.draw, K.draw + 0.38, t), u2 = ease(K.draw + 0.35, K.draw + 0.95, t);
      const outW = { ...inW, O: madd(inW.O, inW.S, 0.075 * u1) };
      const f = lerpNF(outW, N_RKNEE, u2); return { where: 'free', f: { ...f, O: madd(f.O, UP, 0.05 * Math.sin(PI * u2)) }, bend: 0.5 * Math.sin(PI * u1) + 0.25 * Math.sin(PI * u2), zb: 0.012 * (1 - ease(K.draw + 0.2, K.draw + 0.34, t)), fold: (PI - w.open) * (1 - u1) };
    }
    if (t < K.pickup) return { where: 'free', f: N_RKNEE, drape: 1 };
    if (t < K.weigh - 0.4) {                             // the count, in his right hand
      const u = ease(K.pickup, K.pickup + 0.55, t); let f = lerpNF(N_RKNEE, N_COUNT, u);
      f = { ...f, O: madd(f.O, UP, 0.04 * Math.sin(PI * u)) };
      const tap = (t0) => 0.03 * Math.sin(PI * clamp((t - t0) / 0.16));   // squared: the edge tapped on his knee
      const sq = t > K.square ? ease(K.square, K.square + 0.25, t) * (1 - ease(K.square + 0.9, K.square + 1.3, t)) : 0;
      if (sq > 0) f = lerpNF(f, { ...N_RKNEE, O: madd(madd(N_RKNEE.O, UP, 0.07), N_RKNEE.S, 0.0), N: norm(add(UP, mul(FWD, 0.6))) }, sq);
      f = { ...f, O: madd(f.O, UP, -tap(K.square + 0.3) - tap(K.square + 0.62)) };
      return { where: 'free', f, count: true };
    }
    if (t < K.slide) {                                   // weighed in his palm, then resting there
      const u = ease(K.weigh - 0.4, K.weigh, t); let f = lerpNF(N_COUNT, N_PALM, u);
      const bounce = 0.02 * Math.max(0, Math.sin(TAU * clamp((t - K.weigh) / 0.9) * 2)) * (t > K.weigh && t < K.weigh + 0.9 ? 1 : 0);
      return { where: 'free', f: { ...f, O: madd(f.O, UP, bounce) } };
    }
    if (t < K.slide + 0.55) {                            // slid back into the wallet
      const u = ease(K.slide, K.slide + 0.55, t), tgt = { ...inW, O: madd(inW.O, inW.S, 0.06 * (1 - u)) };
      return { where: 'free', f: lerpNF(N_PALM, tgt, u), bend: 0.2 * Math.sin(PI * u), zb: 0.012 * ease(K.slide + 0.3, K.slide + 0.45, t), fold: (PI - w.open) * u };
    }
    return { where: 'wallet', up: 0.03 };
  }
  // the count: which note is under his thumb, and how far each has gone (a fan that he squares as he goes)
  const NN = PR.NOTES.length, GATHER = 0.45, CYCLE = (K.stop - K.count0) / 2, FLICK = (CYCLE - GATHER) / NN, FAN = 0.026;   // two full passes, ending as "half did" lands
  // which pass, how far into it, and whether it's flicking or gathering (the count stops on "half did", the pile is squared after)
  function countPhase(t) {
    const tc = clamp(Math.min(t, K.stop) - K.count0, 0, 1e9), p = Math.floor(tc / CYCLE), tau = tc - p * CYCLE;
    const stopped = t >= K.stop, gather = stopped ? ease(K.square, K.square + 0.35, t) : tau > NN * FLICK ? mj((tau - NN * FLICK) / GATHER) : 0;
    const c = Math.min(NN, Math.floor(Math.min(tau, NN * FLICK) / FLICK)), ph = tau < NN * FLICK ? (tau - c * FLICK) / FLICK : 1;
    return { p, c, ph, gather, stopped };
  }
  function countState(t) {
    const per = []; for (let i = 0; i < NN; i++) per.push({});
    if (t < K.count0 || t > K.square + 1.3) return per;
    const { p, c, ph, gather, stopped } = countPhase(t);
    for (let i = 0; i < NN; i++) {
      const r = p % 2 ? NN - 1 - i : i, m = NN - 1 - r;   // its place in the stack this pass (0 the bottom) and its turn to be counted (0 first)
      const fl = m === c && !stopped ? clamp(ph * 1.35) : m < c ? 1 : 0;   // how far it has gone over
      const e = mj(fl), nzA = r * NT, nzB = (NN + m) * NT, back = gather;
      per[i] = { rank: lerp(r, NN + m, e) * (1 - back) + (NN - 1 - r) * back,
        nz: lerp(lerp(nzA, nzB, e), m * NT + NT * 0.5, back * e),
        dx: lerp(FAN * e + 0.0025 * m * e, 0, back), lift: m === c && !stopped && fl < 1 ? Math.sin(PI * fl) : 0, e: 1, curl: 0.55, zb: m === c && fl > 0 && fl < 1 ? -0.003 : 0 };
    }
    return per;
  }
  const NT = PR.NT;

  // ------------------------------------------------------------------ the token's path (brass, on the bench by his glass; into your wallet)
  const TOK_BENCH = [0.58, ST.BENCH.y + 0.002, 0.07];
  const GD = 1.15;                                   // after test 7: his glass goes down on the bench at 1.15 s (was 4.3), before the wallet comes to his left knee
  function tokenAt(t, w) {
    if (t < K.tok0 + 0.35) return { where: 'bench', O: TOK_BENCH, n: UP };
    const slotTop = PR.leafFrame(w, 'front'), h = PR.WH / 2;
    const slot = madd(madd(madd(slotTop.o, slotTop.b, PR.WW * 0.66), w.A, h * 0.28 + 0.03), slotTop.n, 0.006);
    if (t < K.tok1 + 0.2) { const u = ease(K.tok0 + 0.35, K.tok1 + 0.2, t); const p = lerp3(madd(TOK_BENCH, UP, 0.012), slot, u); return { where: 'hand', O: madd(p, UP, 0.08 * Math.sin(PI * u)), n: towards(UP, slotTop.n, u) }; }
    const k = 0.1 * ease(K.tok1 + 0.2, K.tok2, t);    // after test 6: tucked into the slot's mouth in front of the card and left there, in full view; nothing moves it after
    const O = madd(madd(madd(slotTop.o, slotTop.b, PR.WW * 0.66), w.A, h * 0.28 + 0.03 * (1 - k)), slotTop.n, 0.0011 + 0.004 * (1 - k));
    return { where: 'wallet', k, O, n: slotTop.n };
  }

  // ------------------------------------------------------------------ the glass's path (his chai)
  const G_THIGH = madd(madd(THIGH_L, UP, 0.005), FWD, 0.02), G_BENCH = [0.6, ST.BENCH.y, 0.2];
  function glassAt(t, J) {
    const lips = madd(madd(madd(w3(J.head), FWD, 0.13), UP, -0.12), LEFT, 0.05);   // (after test 7: from his left, his face clear)
    let p = G_THIGH, ax = UP;
    const leg = (a, b, t0, d) => { const u = ease(t0, t0 + d, t); return [lerp3(a, b, u), u]; };
    if (t >= GD) [p] = leg(G_THIGH, G_BENCH, GD, 0.55);
    if (t >= K.sip) { const [q, u] = leg(G_BENCH, lips, K.sip, 0.65); p = q; ax = towards(UP, norm(add(mul(FWD, -0.6), UP)), ease(K.sip + 0.45, K.sip + 0.75, t) * (1 - ease(K.sip + 1.3, K.sip + 1.6, t))); }
    if (t >= K.sip + 1.4) [p] = leg(lips, G_THIGH, K.sip + 1.4, 0.6);
    if (t >= K.glassDown2) [p] = leg(G_THIGH, G_BENCH, K.glassDown2, 0.5);
    if (t >= K.lean) [p] = leg(G_BENCH, madd(G_THIGH, FWD, 0.05), K.lean, 0.6);
    const S2 = K.E_n16 + 0.05;                          // a sip between his lines
    if (t >= S2 && t < S2 + 1.5) { const up = ease(S2, S2 + 0.45, t) * (1 - ease(S2 + 0.95, S2 + 1.45, t)); p = lerp3(madd(G_THIGH, FWD, 0.05), lips, up); ax = towards(UP, norm(add(mul(FWD, -0.6), UP)), ease(S2 + 0.35, S2 + 0.55, t) * (1 - ease(S2 + 0.85, S2 + 1.05, t))); }
    // (after test 8: no last sip; he settles after the cap touch, looking at you, for the last second)
    return { p, ax };
  }

  // ------------------------------------------------------------------ hands: grips and moves
  // a state: { W (wrist), u (the fingers' way), n (the back of the hand's), pose, pole (the elbow's way, in his frame) }
  const P = H3.POSE, blendP = H3.blend;
  const POLE_R = [0.15, -1, -0.75], POLE_L = [0.15, -1, 0.75];
  // the palm's middle sits ~5.5 cm from the wrist along u, and ~1.4 cm below its back (along -n)
  const palmTo = (C0, u, n, lift = 0.0) => madd(madd(C0, u, -0.052), n, 0.016 + lift);
  // his right hand over the wallet on the bench (o: 0 hovering, 1 closed)
  function gripTop(f, close, hov = 0) {
    const C0 = madd(madd(madd(f.O, f.B, PR.WW * 0.52 - 0.075 * hov), f.N, 0.018 + 0.07 * hov), f.A, 0.03 * hov), u = norm(add(f.B, mul(f.N, -0.15 - 0.3 * hov))), n = norm(add(f.N, mul(f.A, 0.15)));
    return { W: palmTo(C0, u, n, 0.012 * (1 - close)), u, n, pose: blendP('hover', { f: [[16, 44, 32, 4], [16, 46, 32, 0], [18, 48, 34, -4], [20, 50, 36, -8]], t: [14, 52, 24, 14] }, close), pole: POLE_R };
  }
  // a hand holding the wallet up from below: the palm on the back leaf's outside, the fingers up it, the thumb round the free edge
  function gripBottom(f) {
    const C0 = madd(madd(f.O, f.B, PR.WW * 0.62), f.A, -PR.WH * 0.5 - 0.012), u = norm(add(mul(f.N, -1), mul(f.A, -0.15))), n = norm(add(mul(f.A, -1), mul(f.N, 0.2)));
    return { W: madd(madd(C0, u, -0.045), f.N, 0.03), u, n, pose: blendP('wrap', 'grip', 0.35), pole: POLE_R };
  }
  // his right hand at the wallet's free edge on his knee: fingers under, the thumb on top, ready to flip it open
  function gripEdge(f, flip) {
    const edge = madd(madd(f.O, f.B, PR.WW * 0.98), f.N, 0.004), u = norm(add(mul(f.B, -0.25), mul(f.A, 0.0), mul(FWD, -0.9))), n = norm(add(f.N, mul(FWD, 0.2)));
    const th = blendP({ f: [[30, 30, 14, 3], [32, 32, 15, 0], [36, 34, 16, -3], [40, 36, 18, -6]], t: [18, 46, 18, 16] }, { f: [[30, 30, 14, 3], [32, 32, 15, 0], [36, 34, 16, -3], [40, 36, 18, -6]], t: [40, 20, 4, 4] }, flip);
    return { W: madd(madd(edge, u, -0.075), n, 0.01), u, n, pose: th, pole: POLE_R };
  }
  // a hand holding a wallet's leaf from behind, the thumb inside (his left hand, your left hand)
  function gripLeaf(f, which, side) {
    const L = PR.leafFrame(f, which), mid = madd(madd(L.o, L.b, PR.WW * 0.88), f.A, -PR.WH * 0.15);
    const u = norm(add(f.A, mul(L.b, 0.35))), n = mul(L.n, -1);
    return { W: madd(madd(mid, u, -0.07), n, 0.016), u, n, pose: blendP('wrap', 'tray', 0.6), pole: side > 0 ? POLE_L : POLE_R };
  }
  // the right hand's fingertips on the notes' top edge (the riffle), or pinching them out
  function gripNotesTop(nf0, pinch) {
    const top = madd(nf0.O, nf0.S, PR.NW / 2), u = norm(add(mul(nf0.S, -0.4), mul(nf0.N, -0.9))), n = norm(add(nf0.S, mul(nf0.N, -0.2)));
    return { W: madd(madd(top, u, -0.11), nf0.L, 0.0), u, n, pose: blendP('relax', 'pinch', pinch), pole: POLE_R };
  }
  // the notes lying across his fingers, the thumb on top (the count; the weighing)
  function gripTray(nf0, thumb = 0) {
    const u = norm(add(mul(nf0.L, -0.2), mul(nf0.S, -1))), n = mul(nf0.N, -1);
    const C0 = madd(madd(nf0.O, nf0.L, 0.05), nf0.N, -0.006);
    const pose = H3.copyPose(P.tray); pose.t[2] += 26 * thumb; pose.t[3] += 30 * thumb; pose.t[1] -= 10 * thumb;
    return { W: madd(madd(C0, u, -0.05), n, -0.01), u, n, pose, pole: POLE_R };
  }
  const lifted = (s, dir, d) => ({ ...s, W: madd(s.W, dir, d) });   // a grip, moved off along dir (before a hand leaves a thing)
  // a hand resting on a knee (relaxed, palm down)
  const restKnee = (Kp, side) => { const hip = side > 0 ? THIGH_L : THIGH_R, p = lerp3(hip, Kp, 0.15), u = norm(add(FWD, mul(LEFT, 0.15 * side), mul(UP, -0.45))), n = norm(add(UP, mul(FWD, 0.25), mul(LEFT, 0.2 * side))); return { W: madd(madd(madd(p, u, -0.05), UP, 0.035), LEFT, 0.04 * side), u, n, pose: 'relax', pole: side > 0 ? POLE_L : POLE_R }; };
  // a hand round the glass
  function gripGlass(g, side) {
    const c = madd(g.p, g.ax, 0.035), out = norm(ortho(add(mul(FWD, -1), mul(LEFT, side * 0.5)), g.ax)), u = norm(add(mul(out, -0.3), mul(LEFT, -side), mul(g.ax, 0.1))), n = norm(add(out, mul(g.ax, 0.2)));
    return { W: madd(madd(c, out, -0.055), u, -0.045), u: norm(add(u, mul(out, 0.3))), n: ortho(n, u), pose: 'grip', pole: [-0.3, -0.9, 0.5 * side] };
  }
  // fingertips on the token (a pinch)
  function gripPinch(p, side) { const u = norm(add(FWD, mul(UP, -0.8), mul(LEFT, -0.2 * side))), n = norm(add(UP, mul(FWD, 0.3))); return { W: madd(madd(p, u, -0.115), n, 0.02), u, n, pose: 'pinch', pole: [-0.75, -0.15, 0.65 * side] }; }
  // a flat hand on his chest (the pats), or slapping the wallet shut
  const flatOn = (p, nrm, fu, side) => { const n = norm(nrm), u = ortho(fu, n); return { W: madd(madd(p, u, -0.06), n, 0.016), u, n, pose: 'flat', pole: side > 0 ? POLE_L : POLE_R }; };
  // the right hand's forefinger at the brim of his cap (from the thumb's side, the thumb tucked)
  function gripBrim(J) {
    const hd = w3(J.head), tip = madd(madd(madd(hd, toYouH, 0.17), UP, 0.15), LEFT, -0.15), u = norm(add(mul(UP, 0.7), mul(toYouH, 0.4), mul(LEFT, -0.35))), n = norm(add(mul(LEFT, -0.8), mul(toYouH, 0.4)));
    return { W: madd(tip, u, -0.175), u, n: ortho(n, u), pose: 'point', pole: [0.3, -0.7, -0.9] };
  }
  // his right hand holding the wallet out by its spine end: the thumb on top, the fingers under
  function gripOffer(f, open = 0) {
    const C0 = madd(madd(f.O, f.B, 0.028), f.N, -PR.WT * 0.5), u = norm(add(f.B, mul(f.N, -0.15))), n0 = norm(mul(f.A, 1));
    const n = dot(n0, LEFT) > 0 ? mul(n0, -1) : n0;
    return { W: madd(madd(C0, u, -0.085), f.N, -0.012), u, n: ortho(n, u), pose: blendP(blendP('wrap', 'pinch', 0.4), 'relax', open), pole: [0.5, -0.8, -0.6] };   // (after test 8: relaxed, not spread, as he lets go)
  }
  // your right hand on the far end of it: from below, the thumb on top
  function gripYours(f, cam, close) {
    const fw = camFwd(cam), right = norm(cross(UP, fw)), C0 = madd(madd(f.O, f.B, PR.WW - 0.03), f.N, -PR.WT * 0.5);   // (the camera's right; see yourHome)
    const u = norm(add(mul(f.B, -1), mul(UP, 0.25))), n0 = norm(add(right, mul(UP, -0.3))), n = ortho(n0, u);
    return { W: madd(madd(C0, u, -0.085), f.N, -0.01), u, n, pose: blendP('relax', blendP('wrap', 'grip', 0.3), close), pole: [0, -1, 0] };
  }

  // the moves: [t0, ease (s), state(t, ctx), kind ('g' a flung gesture that overshoots and settles; else minimum jerk), bow]
  function rightMoves() {
    return [
      [-1, 0.2, (t, c) => gripBottom(c.w)],
      [K.open - 0.5, 0.3, (t, c) => gripEdge(c.w, ease(K.open - 0.05, K.open + 0.12, t) * (1 - ease(K.open + 0.25, K.open + 0.6, t)))],
      [K.riffle - 0.25, 0.5, (t, c) => { const g = gripNotesTop(notesInWallet(c.w, NUP), 0.2); const s = clamp((t - K.riffle - 0.2) / 0.8); return { ...g, W: madd(g.W, c.w.B, 0.07 * (s - 0.5)) }; }],
      [K.handoff + 0.25, 0.45, () => restKnee(KNEE_R, -1)],
      [K.handoff + 0.85, 0.45, (t, c) => { const g = gripNotesTop(notesInWallet(c.w, NUP), 0.25); return { ...g, W: madd(g.W, c.w.B, 0.02 * Math.sin(TAU * 0.8 * (t - K.handoff))) }; }],
      [K.handoff + 1.55, 0.4, () => restKnee(KNEE_R, -1)],
      [K.draw - 0.3, 0.3, (t, c) => gripNotesTop(notesInWallet(c.w, NUP), 1)],
      [K.draw, 0.22, (t, c) => (c.n.f ? gripNotesTop(c.n.f, 1) : gripNotesTop(notesInWallet(c.w, NUP), 1))],
      [K.draw + 0.95, 0.35, () => ({ ...restKnee(madd(KNEE_R, FWD, 0.02), -1), pose: 'hover' })],
      [K.pickup - 0.3, 0.3, (t, c) => gripTray(c.n.f || N_RKNEE, 0)],
      [K.count0, 0.1, (t, c) => gripTray(c.n.f, countThumb(t))],
      [K.weigh - 0.45, 0.4, (t, c) => ({ ...gripTray(c.n.f, 0), pose: blendP('cup', 'tray', 0.4) })],
      [K.slide - 0.1, 0.2, (t, c) => gripTray(c.n.f || N_PALM, 0)],
      [K.slide + 0.55, 0.22, (t, c) => flatOn(madd(PR.leafFrame(c.w, 'back').o, c.w.N, 0.03), c.w.N, c.w.B, -1)],
      [K.slap - 0.06, 0.08, (t, c) => flatOn(madd(madd(c.w.O, c.w.B, PR.WW * 0.5), c.w.N, 0.02), c.w.N, c.w.B, -1), 'g'],
      [K.slap + 0.12, 0.3, (t, c) => gripTop(c.w, 1)],
      [K.pocket + 0.4, 0.3, () => ({ ...flatOn(madd(POCK.O, POCK.N, 0.03), POCK.N, add(UP, mul(LEFT, 0.6)), -1), pose: 'relax' })],
      [K.pat1 - 0.12, 0.12, () => flatOn(madd(POCK.O, POCK.N, 0.022), POCK.N, add(UP, mul(LEFT, 0.6)), -1)],
      [K.pat1 + 0.06, 0.12, () => flatOn(madd(POCK.O, POCK.N, 0.06), POCK.N, add(UP, mul(LEFT, 0.6)), -1)],
      [K.pat2 - 0.12, 0.12, () => flatOn(madd(POCK.O, POCK.N, 0.022), POCK.N, add(UP, mul(LEFT, 0.6)), -1)],
      [K.pat2 + 0.08, 0.45, () => restKnee(KNEE_R, -1)],
      [K.reach - 0.3, 0.35, (t, c) => gripTop(c.w, 0.9)],
      [K.reach + 0.2, 0.1, (t, c) => gripTop(c.w, 1)],
      [K.reach + 0.45, 0.4, (t, c) => gripOffer(c.w, 0)],
      [K.letGo - 0.05, 0.22, (t) => { const g = gripOffer(walletAt(K.letGo - 0.06), 1); return { ...g, W: madd(madd(g.W, toYouH, -0.05 * ease(K.letGo, K.letGo + 0.3, t)), UP, -0.02 * ease(K.letGo, K.letGo + 0.3, t)) }; }],
      [K.letGo + 0.2, 0.55, () => restKnee(KNEE_R, -1)],
      [word('work') - 0.35, 0.4, () => ({ W: madd(madd(madd(THIGH_R, UP, 0.12), FWD, 0.12), LEFT, -0.06), u: norm(add(FWD, mul(LEFT, -0.4))), n: mul(UP, -1), pose: blendP('open', 'relax', 0.4), pole: POLE_R }), 'g'],   // palm up: what can I say
      [word('work') + 0.55, 0.6, () => ({ W: madd(madd(madd(w3(J0.pel), FWD, 0.04), LEFT, -0.2), UP, 0.1), u: norm(add(mul(FWD, -0.2), mul(UP, -1))), n: norm(add(mul(FWD, -1), mul(LEFT, -0.3))), pose: 'flat', pole: [-0.6, -0.4, -0.8] })],
      [K.brim - 0.2, 0.55, (t, c) => gripBrim(c.J), 'g', 0.0],    // (after test 7: once his face is in view; straight up, not swung out)
      [K.brim + 0.85, 0.5, () => restKnee(KNEE_R, -1)],
    ];
  }
  function leftMoves() {
    return [
      [-1, 0.2, (t, c) => gripGlass(c.g, 1)],
      [GD + 0.55, 0.3, () => ({ ...restKnee(madd(KNEE_L, LEFT, 0.06), 1), pose: 'relax' })],   // after test 7: the glass down before the wallet comes to his knee; then his hand rests beside it
      [K.tok0 - 0.05, 0.4, () => gripPinch(madd(TOK_BENCH, UP, 0.012), 1)],
      [K.tok0 + 0.35, 0.05, (t, c) => gripPinch(c.tk.O || TOK_BENCH, 1)],
      [K.tok2 + 0.05, 0.18, (t, c) => lifted(gripPinch(c.tk.O, 1), c.w.N, 0.07)],   // after test 6: off the wallet first
      [K.tok2 + 0.23, 0.4, () => restKnee(madd(KNEE_L, LEFT, 0.06), 1)],
      // (after test 8: his left hand stays resting while the notes go back in; it had reached across his belly)
      [K.sip - 0.3, 0.3, (t, c) => gripGlass(c.g, 1)],
      [K.glassDown2 + 0.5, 0.35, () => restKnee(KNEE_L, 1)],
      [K.lean - 0.3, 0.3, (t, c) => gripGlass(c.g, 1)],
    ];
  }
  // the thumb's flick on each note
  function countThumb(t) { if (t < K.count0 || t > K.stop) return 0; const { ph, gather } = countPhase(t); return Math.sin(PI * clamp(ph * 1.35)) ** 2 * (1 - gather); }
  // where a hand is: each move starts from where the hand really is when it begins, and eases there along an arc
  function handAt(moves, t, ctxAt, side) {
    let i = -1; for (let j = 0; j < moves.length; j++) if (t >= moves[j][0]) i = j;
    if (i < 0) i = 0;
    const st = (j, tt) => { const s = moves[j][2](tt, ctxAt(tt)); return { ...s, pose: typeof s.pose === 'string' ? P[s.pose] : s.pose }; };
    const go = (from, j, tt) => {
      const m = moves[j], to = st(j, tt); if (!from) return to;
      const u = (tt - m[0]) / Math.max(0.01, m[1]), f = m[3] === 'g' ? springE(u) : mj(u), c = clamp(f);
      return { W: bow(from.W, to.W, f, side, m[4] ?? 0.12), u: towards(from.u, to.u, c), n: towards(from.n, to.n, c), pose: blendP(from.pose, to.pose, c), pole: lerp3(from.pole, to.pole, c) };
    };
    let s = null; for (let j = 0; j < i; j++) s = go(s, j, moves[j + 1][0]);
    return go(s, i, t);
  }
  function yourHome(t, side) {                          // below the frame, where your hands wait
    const cam = camAt(t), C0 = camPos(cam), fw = camFwd(cam), right = norm(cross(UP, fw)), upc = norm(cross(fw, right));   // (after test 6: cross(fw, UP) is the camera's left here; your right hand was drawn on the left)
    return { W: madd(madd(madd(C0, fw, 0.48), upc, -0.8), right, 0.27 * side), u: norm(add(fw, mul(upc, 0.7))), n: norm(add(mul(right, 0.6 * side), mul(upc, 0.3), mul(fw, -0.3))), pose: 'relax', pole: [0, -1, 0] };
  }
  // a hand holding an open wallet's leaf like a book: behind it, the fingers hidden, the thumb lying across its inside
  const BOOK = { f: [[14, 16, 8, 3], [14, 16, 8, 0], [16, 18, 9, -3], [18, 20, 10, -6]], t: [34, 48, 10, 8] };
  function yourGrip(f, which, side) {
    const L = PR.leafFrame(f, which), u = norm(add(f.A, mul(L.b, 0.15))), n = mul(L.n, -1);
    const P0 = madd(madd(madd(L.o, L.b, PR.WW - 0.03), f.A, -0.018), L.n, -(PR.WT + 0.014));
    return { W: madd(P0, u, -0.05), u, n, pose: BOOK, pole: [0, -1, 0] };
  }
  function yourRightMoves() {
    return [
      [-1, 0.2, (t) => yourHome(t, 1)],
      [K.yours - 0.15, 0.65, (t, c) => gripYours(c.w, camAt(t), 0)],   // (after test 7: slower)
      [K.take - 0.1, 0.14, (t, c) => gripYours(c.w, camAt(t), 1)],
      [K.down - 1.1, 0.5, (t, c) => yourGrip(c.w, 'back', 1)],     // after test 6: the right-hand leaf, below the frame
      [K.up + 0.6, 0.45, (t) => yourHome(t, 1)],
    ];
  }
  function yourLeftMoves() {
    return [
      [-1, 0.2, (t) => yourHome(t, -1)],
      [K.down - 1.1, 0.5, (t, c) => yourGrip(c.w, 'front', -1)],   // after test 6: the left-hand leaf, below the frame
      [K.L_n19 - 0.15, 0.2, (t, c) => { const g = yourGrip(c.w, 'front', -1); return { ...g, W: madd(g.W, c.w.A, 0.012 * Math.abs(Math.sin(TAU * 2.2 * (t - K.L_n19 + 0.15))) * (1 - ease(K.E_n19, K.E_n19 + 0.2, t))) }; }],
      [K.up + 0.6, 0.45, (t) => yourHome(t, -1)],
    ];
  }
  const RMOVES = rightMoves(), LMOVES = leftMoves(), YRMOVES = yourRightMoves(), YLMOVES = yourLeftMoves();

  // ------------------------------------------------------------------ his body and his look
  function bodyAt(t) {
    const lf = life(1.3, t, 1);
    // his trunk: bent over your wallet at first, turned to it; upright to talk numbers; turned to the kettle; round, left and right;
    // leaning back at the end
    const lean = k1(t, [[0, 0.40], [K.close + 0.2, 0.42], [K.lift + 0.6, 0.30], [K.open, 0.24], [K.handoff, 0.2], [K.scales, 0.18], [K.pickup + 0.4, 0.24], [K.stop, 0.22],
      [K.square + 0.8, 0.14], [K.turnK, 0.08], [K.rack2 + 0.5, 0.06], [K.slide, 0.18], [K.slap + 0.3, 0.12], [K.pocket, 0.08], [K.sip, 0.04], [K.lookUp, 0.02],
      [K.reach, 0.06], [K.holdOut, 0.14], [K.letGo + 0.4, 0.03], [K.lean + 1.5, -0.24], [K.L_n18, -0.22], [K.brim, -0.16], [K.end, -0.17]]) + lf.lean;
    const twist = k1(t, [[0, 0.34], [K.close + 0.2, 0.36], [K.lift + 0.7, 0.12], [K.open, 0.05], [K.handoff, 0.0], [K.turnK - 0.2, 0.0], [K.turnK + 0.35, -0.16], [K.rack2, -0.16],
      [K.rack2 + 0.5, 0.0], [K.lookL - 0.15, 0.0], [K.lookL + 0.2, -0.26], [K.lookL + 0.4, -0.26], [K.lookR + 0.15, 0.22], [K.pocket - 0.2, 0.12], [K.pocket + 0.3, 0.0], [K.end, 0.0]]) + lf.twist;
    const tokLean = win(t, K.tok0 - 0.2, K.tok0 + 0.2, K.tok1, K.tok1 + 0.4);   // he leans to his left for the token on the bench
    const shrug = 0.03 * win(t, K.smile, K.smile + 0.3, K.smile + 0.6, K.smile + 1.0) + 0.045 * win(t, K.L_n18 - 0.05, K.L_n18 + 0.2, K.L_n18 + 0.45, K.L_n18 + 0.8) + lf.shrug;
    const cnt = win(t, K.count0, K.count0 + 0.6, K.stop - 0.4, K.stop + 0.2), sway = cnt * (0.03 * Math.sin(TAU * 0.33 * (t - K.count0)) + 0.012 * Math.sin(TAU * 0.71 * (t - K.count0) + 1.3));   // after test 8: alive through the count
    return { ...SEAT, lean: lean + 0.1 * tokLean + sway, twist: twist - 0.16 * tokLean + cnt * 0.04 * Math.sin(TAU * 0.21 * (t - K.count0) + 0.7), shrug, headTilt: lf.headTilt + 0.05 * win(t, K.lookUp, K.lookUp + 0.4, K.glassDown2, K.glassDown2 + 0.4), lf };
  }
  // what he looks at, second by second (world points), and his face
  function gazeAt(t) {
    const w = walletAt(t), mid = madd(w.O, w.B, PR.WW * 0.5), cam = camAt(t), you = camPos(cam);
    const street = [-2.6, 1.3, 9], stall = [1.9, 1.5, 2.4], cyc = [-4.4, 1.2, 6], kettle = [ST.KETTLE.x, ST.KETTLE.y + 0.18, ST.KETTLE.z];
    const ks = [];
    ks.push([0, ...mid]);
    ks.push([K.glance - 0.15, ...mid]); ks.push([K.glance, ...street]); ks.push([K.glance + 0.5, ...street]); ks.push([K.glance + 0.75, ...mid]);
    ks.push([K.cash - 0.4, ...mid]);
    ks.push([K.cash, ...madd(KNEE_R, UP, 0.02)]); ks.push([K.empty + 0.3, ...madd(KNEE_L, UP, 0.02)]);
    ks.push([K.scales + 0.25, ...madd(KNEE_R, UP, 0.02)]); ks.push([K.scales + 0.65, ...madd(KNEE_L, UP, 0.02)]); ks.push([K.scales + 1.05, ...madd(KNEE_R, UP, 0.02)]);
    ks.push([K.pickup + 0.2, ...N_COUNT.O]); ks.push([K.tok0 - 0.1, ...N_COUNT.O]);
    ks.push([K.stop + 0.15, ...N_COUNT.O]); ks.push([K.square + 0.8, ...madd(KNEE_R, UP, 0.05)]);
    ks.push([K.weigh, ...N_PALM.O]);
    ks.push([K.turnK - 0.05, ...N_PALM.O]); ks.push([K.turnK + 0.35, ...kettle]); ks.push([K.rack2, ...kettle]);
    ks.push([K.rack2 + 0.4, ...you]); ks.push([K.smile + 0.6, ...you]);
    ks.push([K.slide - 0.2, ...mid]); ks.push([K.slap + 0.1, ...mid]);
    ks.push([K.lookL - 0.05, ...stall]); ks.push([K.lookL + 0.4, ...stall]); ks.push([K.lookR + 0.12, ...cyc]); ks.push([K.lookR + 0.42, ...cyc]);
    ks.push([K.pocket + 0.3, ...madd(POCK.O, UP, 0.05)]); ks.push([K.pat2 + 0.2, ...madd(POCK.O, UP, 0.05)]);
    ks.push([K.sip + 0.4, ...madd(HEADP, FWD, 0.6)]);
    ks.push([K.lookUp - 0.2, ...madd(HEADP, FWD, 0.6)]); ks.push([K.lookUp + 0.2, ...you]);
    ks.push([K.reach, ...madd(POCK.O, UP, 0.0)]); ks.push([K.reach + 0.35, ...you]);
    ks.push([K.end, ...you]);
    return ks;
  }
  function headLook(t, J, bodyP) {
    const ks = gazeAt(t).map((k) => [k[0], ...aimAt([k[1], k[2], k[3]], J, bodyP.twist)]);
    const [yaw, pitch] = sprung(t, (tt) => key(tt, ks));
    const { ph, gather } = countPhase(t), counting = t > K.count0 && t < K.stop ? 1 - gather : 0;   // a small nod with each note he counts
    const cnt = 0.06 * Math.sin(PI * clamp(ph * 1.35)) * counting;   // (after test 8: a nod you can see)
    const nod = 0.16 * Math.sin(PI * clamp((t - word('work') + 0.05) / 0.45)) * (t > word('work') - 0.05 && t < word('work') + 0.4 ? 1 : 0);
    const shake = 0.11 * Math.sin(TAU * 2.2 * (t - K.L_n18)) * win(t, K.L_n18 - 0.05, K.L_n18 + 0.12, K.L_n18 + 0.75, K.L_n18 + 0.95);   // no: that's stealing
    return [yaw + bodyP.lf.headYaw + shake, pitch + bodyP.lf.headPitch + nod + cnt];
  }
  function aimAt(Q, J, tw = 0) {
    const Hd = w3(J.head), dx = Q[0] - Hd[0], dz = Q[2] - Hd[2], dy = Q[1] - Hd[1];
    return [clamp(wrap(Math.atan2(dx, dz) - H0 - tw), -1.2, 1.15), clamp(-Math.atan2(dy, Math.hypot(dx, dz)) * 0.85, -0.6, 0.75)];
  }
  function faceAt(t) {
    // his acting, beat by beat (nobody speaks: his lips never move as if talking, so Meta's Hindi dub stays possible)
    const shifty = win(t, K.lookL - 0.15, K.lookL + 0.05, K.lookL + 0.6, K.lookL + 0.75) - win(t, K.lookR - 0.15, K.lookR + 0.05, K.lookR + 0.5, K.lookR + 0.65);
    return {
      close: Math.max(blink(t, 0.3), 0.45 * win(t, K.sip + 0.5, K.sip + 0.65, K.sip + 1.1, K.sip + 1.25), 0.45 * win(t, K.back + 0.5, K.back + 0.65, K.back + 1.2, K.back + 1.35)),
      smile: 0.15 + 0.85 * win(t, K.smile - 0.1, K.smile + 0.7, K.slide, K.slide + 0.5) + 0.3 * win(t, K.pat1, K.pat1 + 0.3, K.sip, K.sip + 0.4)
        + 0.25 * win(t, K.letGo, K.letGo + 0.3, K.lean + 1, K.lean + 1.5) + 0.5 * win(t, K.brim - 0.3, K.brim, K.end, K.end + 1),
      smirk: 0.35 * win(t, -1, 0, K.open - 0.2, K.open + 0.2) + 0.25 * win(t, K.count0, K.count0 + 0.5, K.p40, K.p40 + 0.4) + 0.5 * win(t, K.smile, K.smile + 0.6, K.slide, K.slide + 0.4)
        + 0.6 * win(t, K.take - 0.05, K.take + 0.15, K.letGo - 0.05, K.letGo + 0.25) + 0.4 * win(t, K.brim - 0.2, K.brim + 0.2, K.end, K.end + 1),
      browY: 0.06 * win(t, K.open + 0.1, K.open + 0.3, K.riffle + 0.6, K.riffle + 1.0) + 0.05 * win(t, K.stop - 0.05, K.stop + 0.12, K.stop + 0.7, K.stop + 1.0)
        + 0.05 * win(t, K.catch - 0.05, K.catch + 0.1, K.catch + 0.5, K.catch + 0.8) + 0.05 * win(t, K.lookUp - 0.05, K.lookUp + 0.2, K.glassDown2, K.glassDown2 + 0.3),
      browTilt: 0.06 * win(t, K.turnK + 0.3, K.turnK + 0.6, K.catch - 0.1, K.catch + 0.1),
      wide: 0.45 * win(t, K.catch - 0.05, K.catch + 0.08, K.catch + 0.45, K.catch + 0.7) + 0.2 * win(t, K.stop - 0.05, K.stop + 0.1, K.stop + 0.4, K.stop + 0.7),
      look: [0.05 * shifty, 0],
    };
  }

  // ------------------------------------------------------------------ you, in the street (from behind, soft): out to the corner, a pat, a spin, back
  const YOU_PATH = [[-0.5, 0.45], [-1.0, 1.8], [-1.9, 3.2], [-2.6, 4.2], [-2.75, 10.9]];   // off the bench, past the counter's end behind him, into the street, to the corner
  // ... a polyline walked at a speed set by time: arc length s(t)
  const segLen = YOU_PATH.slice(1).map((p, i) => Math.hypot(p[0] - YOU_PATH[i][0], p[1] - YOU_PATH[i][1])), PATHLEN = segLen.reduce((a, b) => a + b, 0);
  const along = (PTS, LEN, s) => { s = clamp(s, 0, LEN.reduce((a, b) => a + b, 0)); let i = 0; while (i < LEN.length - 1 && s > LEN[i]) { s -= LEN[i]; i++; } const a = PTS[i], b = PTS[i + 1], u = s / LEN[i]; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.atan2(b[0] - a[0], b[1] - a[1])]; };
  const at = (s) => along(YOU_PATH, segLen, s);
  const BACK_PATH = [[-2.75, 10.9], [-2.6, 4.2], [-2.1, 1.2], [-1.4, -0.9]], backLen = BACK_PATH.slice(1).map((p, i) => Math.hypot(p[0] - BACK_PATH[i][0], p[1] - BACK_PATH[i][1])), BACKLEN = backLen.reduce((a, b) => a + b, 0);   // back down the street and round to stand in front of him
  const YSTY = R.style({ stride: 1.12, cad: 0.86, lean: 0.03, arm: 0.3 });
  const LANE_PATH = [[-2.75, 10.9], [-2.2, 11.9], [-0.9, 12.4]], laneLen = LANE_PATH.slice(1).map((p, i) => Math.hypot(p[0] - LANE_PATH[i][0], p[1] - LANE_PATH[i][1])), LANELEN = laneLen.reduce((a, b) => a + b, 0);
  function youTrack(t) {
    // out: from the bench (s = 0 at t = -3.2) at an amble, phone in hand; stops at the corner at K.corner
    const s0 = (tt) => PATHLEN * (1 - Math.pow(1 - clamp((tt + 3.2) / (K.corner + 3.2)), 1.6));
    if (t < K.spin) {
      const s = s0(t), [x, z, h] = at(s);
      const pat = ease(K.pat - 0.25, K.pat, t), patB = 0.03 * Math.sin(TAU * 4 * clamp((t - K.pat) / 0.5)) * (t > K.pat && t < K.pat + 0.5 ? 1 : 0);
      const front = ease(K.pat + 1.6, K.pat + 2.0, t), drop = ease(K.spin - 0.9, K.spin - 0.5, t);
      const arms = pat > 0.001 ? { r: { wrist: lerp3(lerp3([0.05, -0.42, -0.2], [-0.15, -0.36 + patB, -0.1], pat), [0.1, -0.4, -0.13], front), pole: [-0.2, -1, -0.6], w: 1 - drop },
        l: { wrist: [0.1, -0.4, 0.13], pole: [-0.2, -1, 0.6], w: front * (1 - drop) } } : undefined;
      return { x, z, h, tg: s / YSTY.stride, walk: 1 - ease(K.corner - 0.6, K.corner, t), arms, headPitch: 0.25 * front * (1 - drop) };
    }
    // after test 6: after the spin, into the side lane at the corner, out of sight behind the stall; not seen coming back
    if (t >= K.spin) {
      const u = ease(K.spin + 0.3, K.spin + 1.9, t), s = LANELEN * u, [x, z, h] = along(LANE_PATH, laneLen, s);
      return { x, z, h, tg: s / YSTY.stride + PATHLEN / YSTY.stride, walk: win(t, K.spin + 0.25, K.spin + 0.45, K.spin + 1.7, K.spin + 1.95) };
    }
    // (before test 6) the spin, then back, hurrying: down the street and towards the bench, gone from the shot before the arc ends
    const back = clamp((t - K.spin - 0.35) / (K.arc1 - 0.5 - K.spin - 0.35)), sb = BACKLEN * mj(back);
    const [x, z, h0] = along(BACK_PATH, backLen, sb), turn = 1 - ease(K.spin, K.spin + 0.45, t);
    return { x, z, h: h0 + PI * turn, tg: sb / YSTY.stride + PATHLEN / YSTY.stride, walk: ease(K.spin + 0.3, K.spin + 0.7, t), fast: 1 };
  }

  // ------------------------------------------------------------------ the chaiwala (behind the main counter): a long pour, stirring; at the
  // temptation his back is turned to us, reaching to his shelf
  const CW = { x: 1.95, z: 2.42 }, CWSTY = R.style({ stride: 0.5, cad: 1, stepW: 0.12, headStab: 0.8, lean: 0.05, arm: 0, elbow: 0.6, elbowDyn: 0 });
  function chaiwala(g, cam, t) {
    const back = ease(K.lookL - 1.1, K.lookL - 0.45, t) * (1 - ease(K.pocket + 1.4, K.pocket + 2.1, t));
    const tr = { x: CW.x, z: CW.z, h: PI + back * PI * 0.97, tg: 0 };
    const lf = life(4.1, t, 1), pour = win(t, -1, -0.5, 6.2, 6.8) + win(t, 15.5, 16.0, 19.0, 19.6) + win(t, 44.0, 44.5, 48.5, 49.0);
    const ph = TAU * 0.9 * t, stir = (1 - pour) * (1 - back);
    const arms = {
      r: { wrist: [0.32 + 0.04 * Math.cos(ph) * stir, lerp(-0.14, 0.42, pour) + 0.4 * back + 0.02 * Math.sin(ph) * stir, -0.12 + 0.04 * Math.sin(ph) * stir], pole: [0.1, -1, -0.8], w: 1 },
      l: { wrist: [0.3, lerp(-0.2, -0.36, pour) + 0.1 * back, 0.14], pole: [0.1, -1, 0.8], w: 1 },
    };
    const F = R.figure(g, cam, { S: CWSTY, look: LOOK.cw }, t, { tr, pose: { walk: 0, arms, lean: lf.lean + 0.05, twist: lf.twist, shrug: lf.shrug, headYaw: lf.headYaw + 0.2 * Math.sin(t * 0.4), headPitch: 0.25 + lf.headPitch }, face: { close: blink(t, 2.2), smile: 0.1 }, handPose: { l: 'grip', r: 'grip' } });
    if (F && pour > 0.05) {                              // the tea, in a long arc from the pan to the glass
      const a = F.P.wrR, b = F.P.wrL; g.save(); g.globalAlpha = clamp(pour * 1.5); g.strokeStyle = '#c08a52'; g.lineCap = 'round'; g.lineWidth = Math.max(1.5, 0.012 * a[2]);
      g.beginPath(); g.moveTo(a[0] + 0.03 * a[2], a[1]); g.quadraticCurveTo(a[0] + 0.06 * a[2], (a[1] + b[1]) / 2, b[0] + 0.02 * b[2], b[1] - 0.04 * b[2]); g.stroke(); g.restore();
    }
  }
  // ------------------------------------------------------------------ the cyclist: down the street towards the stall as he looks right, looking away
  const CYSTY = R.style({ stride: 0.5, cad: 1, stepW: 0.11, hipMax: 0.86, headStab: 0.9, lean: 0.38, arm: 0 });
  function cyclist(g, cam, t) {
    const t0 = K.lookR - 1.6, t1 = K.lookR + 1.6; if (t < t0 - 0.2 || t > t1 + 0.2) return;
    const u = clamp((t - t0) / (t1 - t0)), z = lerp(15, -1.5, u), x = -4.6, y0 = ST.ROAD.y;
    const tr = { x, z, h: PI, tg: 0, y: y0 };
    const ph = TAU * 1.3 * t, cr = 0.17, crank = [0.06, 0.3];
    const feet = { l: [crank[0] + cr * Math.cos(ph), crank[1] + cr * Math.sin(ph), 0], r: [crank[0] + cr * Math.cos(ph + PI), crank[1] + cr * Math.sin(ph + PI), 0], wl: 1, wr: 1 };
    const arms = { l: { wrist: [0.5, -0.02, 0.22], pole: [0, -1, 1], w: 1 }, r: { wrist: [0.5, -0.02, -0.22], pole: [0, -1, -1], w: 1 } };
    // the bicycle (in his own frame: forward, up; x across), a dark blue frame, black tyres
    const W3 = (f, up, l = 0) => { const sh = Math.sin(tr.h), ch = Math.cos(tr.h); return [tr.x + (sh * f - ch * l), up + y0, tr.z + (ch * f + sh * l)]; };
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const wheel = (cf) => { g.strokeStyle = '#141418'; const q0 = cam.P(...W3(cf, 0.33)); if (!q0) return; g.lineWidth = Math.max(1.5, 0.035 * q0[2]); g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, q = cam.P(...W3(cf + 0.33 * Math.cos(a), 0.33 + 0.33 * Math.sin(a))); if (q) i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); };
    wheel(-0.48); wheel(0.6);
    g.strokeStyle = '#2a3f7a'; const fr0 = cam.P(...W3(0, 0.5)); g.lineWidth = Math.max(1.5, 0.028 * (fr0 ? fr0[2] : 10));
    for (const [a, b] of [[[-0.48, 0.33], [0.06, 0.3]], [[0.06, 0.3], [-0.14, 0.82]], [[-0.14, 0.82], [-0.48, 0.33]], [[-0.14, 0.82], [0.5, 0.8]], [[0.06, 0.3], [0.5, 0.8]], [[0.5, 0.8], [0.6, 0.33]], [[0.5, 0.8], [0.46, 1.0]]]) { g.beginPath(); if (R.line3(g, cam, W3(...a), W3(...b))) g.stroke(); }
    g.restore();
    R.figure(g, cam, { S: CYSTY, look: LOOK.cyc }, t, { tr, pose: { walk: 0, sit: 0.14, sink: 0.0, feet, arms, headYaw: -0.95, headPitch: -0.05 }, face: { close: blink(t, 3.3) }, handPose: { l: 'grip', r: 'grip' } });
  }
  // ------------------------------------------------------------------ the scene
  scene({
    name: 'take', from: 'hook', to: 'end',
    build(root, S) {
      S.g = canvas(root);
      S.L = {}; for (const k of ['bg', 'mid', 'fig', 'near']) { const c = document.createElement('canvas'); c.width = W; c.height = H; S.L[k] = c; }
    },
    run(t0, b, S) {
      const g = S.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      const cam = camAt(t0), lt = R.lightOf(cam);
      // after motion test 5: the cast (him, you, the hands, the props, the passers-by) on twos, 15 drawings a second, as hand-drawn
      // animation is; the camera and the words on ones. Everything placed in the world uses the drawing's time (camQ: where the
      // camera was then, for what hangs off it, like your sleeve); only the projection uses the frame's own camera.
      const t = Math.floor(t0 * 15 + 1e-6) / 15, camQ = camAt(t);
      const Lc = (k) => { const c = S.L[k].getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); return c; };
      // ---- things first: where they are now
      const bodyP = bodyAt(t), Jb = R.skel(STY, 0, bodyP);
      const { w, n: nt, tk, g: gl } = ctxAt(t);
      const hr = handAt(RMOVES, t, ctxAt, -1), hl = handAt(LMOVES, t, ctxAt, 1);
      const [hy, hp] = headLook(t, Jb, bodyP);
      const wl = (s) => { const q = local(s.W), C0 = Jb.chest; return { wrist: [q[0] - C0[0], q[1] - C0[1], q[2] - C0[2]], pole: s.pole, w: 1 }; };
      const pose = { ...bodyP, headYaw: hy, headPitch: hp, arms: { r: wl(hr), l: wl(hl) } };

      // ---- the back: sky, the street, you in it
      const gb = Lc('bg'); gb.save(); ST.sky(gb, cam, W, H); ST.far(gb, cam, t);
      if (t < K.pocket + 0.35) { const tr = youTrack(t); R.figure(gb, cam, { S: YSTY, look: LOOK.you }, t, { tr, pose: { walk: tr.walk, arms: tr.arms, headPitch: tr.headPitch || 0 }, held: t < K.corner + 0.6 ? { side: -1, a: 1 } : null, face: { close: blink(t, 1.7) } }); }
      cyclist(gb, cam, t);
      gb.restore();
      // ---- the stall and our pavement
      const Jf = R.skel(STY, 0, pose);
      const gm = Lc('mid'); gm.save(); ST.pavement(gm, cam); ST.stall(gm, cam, t, { behind: (g2) => chaiwala(g2, cam, t), kettleView: (kg, kw, kh) => reflectHim(kg, kw, kh, t, Jf, faceAt(t)) }); gm.restore();
      // ---- him on the bench
      const gf = Lc('fig'); gf.save(); ST.bench(gf, cam);
      // his glass standing on the bench beside him: drawn with the bench, behind him (test 6: his forearm reached over it, and
      // the glass's rim and steam floated on top of the arm)
      const onBench = (t >= GD + 0.55 && t < K.sip) || (t >= K.glassDown2 + 0.5 && t < K.lean);
      if (onBench) for (const p of [...PR.glass(cam, gl.p, gl.ax, lt), ...PR.steam(cam, madd(gl.p, gl.ax, 0.08), t, 1, { h: 0.09, seed: 1 })]) p.draw(gf);
      const sag = ease(K.pocket + 0.1, K.pocket + 0.4, t) * (1 - ease(K.reach + 0.2, K.reach + 0.45, t));   // the cloth sags with the wallet's weight
      const F = R.figure(gf, cam, { S: STY, look: LOOK.thief }, t, { tr: TR, pose, noHands: true, near: true, face: faceAt(t), onTorso: (g2, F2, lt2) => drawPocket(g2, cam, F2, lt2, sag) });
      gf.restore();
      // ---- the near things: the props and the hands, sorted far to near
      const gn = Lc('near'); gn.save();
      const prims = [];
      const inW = nt.where === 'wallet';
      const wp = PR.wallet(cam, w, lt, { notes: inW ? countlessNotes(t) : null, notesUp: inW ? nt.up : 0.03, token: tk.where === 'wallet' ? tk.k : null, slotFront: !(t > K.slide - 0.6 && t < K.slap + 0.5), edgeShow: false });   // (after test 7: no gold edge line on the shut wallet; edge-on it read as a stick)
      prims.push(...wp);
      if (!inW && nt.f) prims.push(...PR.notes(cam, nt.f, nt.count ? countState(t) : bendNotes(nt.bend || 0), { zBias: nt.zb || 0, fold: nt.fold || 0 }));
      if (tk.where !== 'wallet') prims.push(...PR.token(cam, tk.O, tk.n, FWD, lt, { r: 0.0135 }));
      // the pocket's front: in front of all of the wallet in it (the wallet's middle is higher up his chest, so nearer a camera above him)
      if (F && walletInPocket(t)) { const pq = pocketQuad(F, sag), z = Math.min(cam.toCam(...pq.mid)[2] - 0.006, Math.min(...wp.map((q) => q.z)) - 0.001); prims.push({ z, draw: (g2) => drawPocket(g2, cam, F, lt, sag, true) }); }   // the pocket's front over the wallet in it
      const his = t > K.letGo + 0.45 ? [] : prims;          // after the hand-back his things (his hands, his glass) are drawn with him
      if (!onBench) {
        his.push(...PR.glass(cam, gl.p, gl.ax, lt));
        his.push(...PR.steam(cam, madd(gl.p, gl.ax, 0.08), t, 1 - 0.8 * win(t, K.sip, K.sip + 0.4, K.sip + 1.4, K.sip + 1.8), { h: 0.09, seed: 1 }));
      }
      if (F) {
        const WR = F.w3(F.J.wrR), WL = F.w3(F.J.wrL);
        his.push(...H3.prims(cam, H3.bones(WR, hr.u, hr.n, 1, hr.pose, 1.0), HANDLOOK.thief, lt, { wrist: F.w3(F.J.elR) }));
        his.push(...H3.prims(cam, H3.bones(WL, hl.u, hl.n, -1, hl.pose, 1.0), HANDLOOK.thief, lt, { wrist: F.w3(F.J.elL) }));
      }
      if (t > K.arc1 - 0.3) {
        for (const [mv, side] of [[YRMOVES, 1], [YLMOVES, -1]]) {
          const hs = handAt(mv, t, ctxAt, side); if (hs.W[1] < -1) continue;
          const Hb = H3.bones(hs.W, hs.u, hs.n, side, hs.pose, 1.0);
          prims.push(...H3.prims(cam, Hb, HANDLOOK.you, lt, { zBias: 0.035 * win(t, K.down, K.down + 0.5, K.up + 0.6, K.up + 0.9) }));
          prims.push(...yourSleeve(cam, hs, side, lt, camQ));
        }
      }
      prims.sort((a, b) => b.z - a.z); for (const p of prims) p.draw(gn);
      if (his !== prims && his.length) { gf.save(); his.sort((a, b) => b.z - a.z); for (const p of his) p.draw(gf); gf.restore(); }
      gn.restore();
      // ---- compose: no blur (the user, on motion test 5); the far street and the stall pushed back with a flat haze, as a
      // painted background is, so he and the hands stand out by their ink. The haze lifts off the stall while the kettle is the picture.
      const head = F ? F.w3(F.J.head) : HEADP, handsC = lerp3(hr.W, hl.W, 0.5);
      const { fd, kd } = focusAt(t, cam, head, w.O);
      const dist = (p) => Math.max(0.2, cam.toCam(p[0], p[1], p[2])[2]);
      const coc = (d) => Math.min(16, kd * Math.abs(1 / Math.max(0.2, d) - 1 / fd));
      const yours = ease(K.letGo, K.letGo + 0.5, t) * (1 - ease(K.letGo + 0.6, K.letGo + 1.1, t) * (1 - ease(K.down - 0.5, K.down, t))) * (1 - ease(K.up, K.up + 0.5, t));
      const layers = [['bg', 12], ['mid', dist([ST.KETTLE.x, ST.KETTLE.y + 0.18, ST.KETTLE.z])], ['fig', dist(head)], ['near', lerp(dist(lerp3(w.O, handsC, 0.5)), dist(w.O), yours)]];
      g.save();
      const ketK = ease(K.rack1 - 0.4, K.rack1 + 0.2, t) * (1 - ease(K.rack2, K.rack2 + 0.55, t));
      const haze = { bg: 0.2, mid: 0.07 * (1 - ketK) };
      for (const [k] of layers) { g.drawImage(S.L[k], 0, 0); if (haze[k] > 0.002) { g.fillStyle = `rgba(238,228,216,${haze[k].toFixed(3)})`; g.fillRect(0, 0, W, H); } }
      g.restore();
      if (window.PROBE) window.PROBE.at = { t, fd, kd, blur: layers.map(([k]) => [k, 0]) };
      // ---- the words on screen: the question, the pick's two labels and their numbers, the study's size
      texts(g, t0, cam, w, nt);
      if (F) { const q = (p) => { const r = cam.P(p[0], p[1], p[2]); return r ? [Math.round(r[0]), Math.round(r[1]), Math.round(r[2])] : null; }; const hd = F.w3(F.J.head);
        window.SCREEN = { t, psiH: +F.psiH.toFixed(2), yawH: +F.J.yawH.toFixed(2), hy: +hy.toFixed(2), head: q(hd), headR: Math.round(F.headR), capTop: q(madd(hd, UP, 0.2)), chin: q(madd(hd, UP, -0.17)), wallet: q(madd(madd(w.O, w.B, PR.WW * 0.5), w.N, 0.01)), walletW: (() => { const a = q(w.O), b2 = q(madd(w.O, w.B, PR.WW)); return a && b2 ? Math.round(Math.hypot(a[0] - b2[0], a[1] - b2[1])) : null; })(), hr: q(hr.W), hl: q(hl.W), kneeR: q(KNEE_R), kneeL: q(KNEE_L), kettle: q([ST.KETTLE.x, ST.KETTLE.y + 0.18, ST.KETTLE.z]), text: (window.TEXTBOX || []).map((b) => [b.text, b.box.map(Math.round)]) }; }
    },
  });
  // ------------------------------------------------------------------ type (key words and numbers only), kept inside the safe zones
  // (x 80-950, y 269-1536, measured with the outline); every box drawn is logged in window.TEXTBOX for the check
  const SAFE = { x0: 80, x1: 950, y0: 269, y1: 1536 };
  function label(g, text, x, y, size, o = {}) {
    window.KIT.font(g, size, 700, 'condensed');
    const m = g.measureText(text), ow = o.ow ?? Math.max(4, size * 0.075);
    let x0 = o.align === 'center' ? x - m.width / 2 : o.align === 'right' ? x - m.width : x;
    const L = x0 - m.actualBoundingBoxLeft - ow, Rr = x0 + m.actualBoundingBoxRight + ow, Tp = y - m.actualBoundingBoxAscent - ow, Bt = y + m.actualBoundingBoxDescent + ow;
    let dx = 0, dy = 0;                                  // nudged inside the safe area
    if (L < SAFE.x0) dx = SAFE.x0 - L; if (Rr + dx > SAFE.x1) dx = SAFE.x1 - Rr;
    if (Tp < SAFE.y0) dy = SAFE.y0 - Tp; if (Bt + dy > SAFE.y1) dy = SAFE.y1 - Bt;
    x0 += dx; y += dy;
    if ((o.a ?? 1) <= 0.003) return;
    g.save(); g.globalAlpha = o.a ?? 1; g.lineJoin = 'round'; g.miterLimit = 2;
    if (o.clipY != null) { g.beginPath(); g.rect(0, o.clipY[0], W, o.clipY[1] - o.clipY[0]); g.clip(); }
    g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = size * 0.12; g.shadowOffsetY = size * 0.03;
    g.strokeStyle = o.stroke || 'rgba(16,12,22,0.92)'; g.lineWidth = ow * 2; g.strokeText(text, x0, y);
    g.shadowColor = 'rgba(0,0,0,0)'; g.fillStyle = o.color || '#ffffff'; g.fillText(text, x0, y);
    g.restore();
    (window.TEXTBOX = window.TEXTBOX || []).push({ text, box: [L + dx, Tp + dy, Rr + dx, Bt + dy], a: o.a ?? 1 });
  }
  // a word that swaps for another: the old one rises out, the new one rises in (a hit as it lands)
  function swapLabel(g, a, b, t0, x, y, size, t, o = {}) {
    const u = clamp((t - t0) / 0.26), pop = 1 + 0.18 * Math.sin(PI * clamp((t - t0 - 0.12) / 0.3)) * (t > t0 ? 1 : 0);
    if (u < 1) label(g, a, x, y - size * 0.6 * mj(u), size, { ...o, a: (o.a ?? 1) * (1 - mj(u)) });
    if (u > 0) label(g, b, x, y + size * 0.6 * (1 - mj(u)), size * (o.bigB || 1) * pop, { ...o, color: o.colorB || '#ffd34d', a: (o.a ?? 1) * mj(u) });
  }
  function texts(g, t, cam, w, nt) {
    window.TEXTBOX = [];
    g.save();
    // the question, on frame 0, till the third line
    const tq = ease(K.titleOut - 0.05, K.titleOut + 0.3, t);
    if (tq < 1) {
      const a = 1 - tq, lift = -60 * tq;
      label(g, 'WILL HE', 88, 392 + lift, 122, { a });
      label(g, 'GIVE IT', 88, 506 + lift, 122, { a, color: '#ffd34d' });
      label(g, 'BACK?', 88, 620 + lift, 122, { a, color: '#ffd34d' });
    }
    // the pick's labels: by the notes and by the wallet, the same size, level. Each sits by where its thing has been over the last
    // and next 0.4 s (a weighted average), so it rides the big moves but not the taps and squarings of his hands (on twos those made
    // a label jump: motion test 6 at 23.9 s)
    const P2 = (p) => cam.P(p[0], p[1], p[2]);
    const anchors = (tt) => { const c = ctxAt(tt), w2 = c.w, n2 = c.n; return [n2.where === 'wallet' ? madd(madd(w2.O, w2.A, 0.0), w2.N, 0.01) : n2.f.O, madd(madd(w2.O, w2.B, PR.WW * 0.5 * (1 - clamp((w2.open - 2) / 0.8))), w2.N, 0.02)]; };
    const smooth = (k) => { let sw = 0; const a = [0, 0, 0]; for (let i = -4; i <= 4; i++) { const wt = 5 - Math.abs(i), p = anchors(t + i * 0.1)[k]; a[0] += p[0] * wt; a[1] += p[1] * wt; a[2] += p[2] * wt; sw += wt; } return [a[0] / sw, a[1] / sw, a[2] / sw]; };
    const out = ease(K.labelsOut - 0.1, K.labelsOut + 0.25, t);
    if (t > K.cash - 0.1 && out < 1) {
      const nc = smooth(0), q = P2(nc);
      if (q) {
        const inA = ease(K.cash - 0.05, K.cash + 0.15, t);
        swapLabel(g, 'CASH', '51%', K.p51, q[0] - 40, q[1] - 150 + 30 * (1 - inA), 92, t, { a: inA * (1 - out), align: 'center', bigB: 1.25 });
      }
    }
    if (t > K.empty - 0.1 && out < 1) {
      const wc = smooth(1), q = P2(wc);
      if (q) {
        const inA = ease(K.empty - 0.05, K.empty + 0.15, t);
        swapLabel(g, 'EMPTY', '40%', K.p40, q[0] + 30, q[1] - 160 + 30 * (1 - inA), 92, t, { a: inA * (1 - out), align: 'center' });
      }
    }
    // the study's size, small, at the top
    const st = ease(K.stat - 0.05, K.stat + 0.2, t) * (1 - out);
    if (st > 0.003) label(g, '17,303 WALLETS · 40 COUNTRIES', 540, 340 - 20 * (1 - st), 62, { a: st, align: 'center' });
    g.restore();
  }
  // your forearm: from below the frame to your wrist, a blue sleeve with its cuff (never his teal, never bare like his)
  function yourSleeve(cam, hs, side, lt, camG = cam) {
    const C0 = camPos(camG), fw = camFwd(camG), right = norm(cross(UP, fw)), upc = norm(cross(fw, right));   // (after test 6: cross(fw, UP) is the camera's left here; your right hand was drawn on the left)
    const el = madd(madd(madd(C0, fw, 0.26), upc, -0.52), right, 0.2 * side), wr = madd(hs.W, hs.u, -0.012), cuff = lerp3(wr, el, 0.16);
    const z = cam.toCam(...lerp3(wr, el, 0.35))[2] + 0.02;
    return [{ z, draw: (g) => {
      const a = cam.P(...wr), b = cam.P(...el), c = cam.P(...cuff); if (!a || !b || !c) return;
      const [c0, c1] = R.tone(LOOK.you.shirt, lt), lx = lt.x >= 0 ? 1 : -1;
      g.save();
      const iw = H3.inkW(a[2]);                     // the ink under the sleeve and the cuff, then their colour
      g.beginPath(); H3.capSub(g, b, c, 0.05 * b[2] + iw, 0.044 * c[2] + iw); H3.capSub(g, c, a, 0.046 * c[2] + iw, 0.043 * a[2] + iw); g.fillStyle = H3.INK; g.fill('nonzero');
      H3.capsule(g, b, c, 0.05 * b[2], 0.044 * c[2], c0, c1, null, 0, lx);
      g.strokeStyle = H3.INK; g.lineWidth = iw * 0.8; g.beginPath(); H3.capSub(g, c, a, 0.046 * c[2], 0.043 * a[2]); g.stroke();   // the cuff's seam
      H3.capsule(g, c, a, 0.046 * c[2], 0.043 * a[2], mix(c0, '#ffffff', 0.12), mix(c1, '#ffffff', 0.05), null, 0, lx);   // the cuff
      const m = lerp3(wr, cuff, 0.5), q = cam.P(...madd(m, upc, 0.035)); if (q) { g.fillStyle = '#f2f2f4'; g.beginPath(); g.arc(q[0], q[1], 0.006 * q[2], 0, TAU); g.fill(); }   // its button
      g.restore();
    } }];
  }
  // what the kettle sees of him: his head and shoulders against the stall's warm inside, mirrored (a mirror swaps left and right,
  // so his mole shows on the other cheek, as it would). The kettle's curve is set in set.js.
  function reflectHim(kg, w, h, t, J, face) {
    const K0 = [ST.KETTLE.x, ST.KETTLE.y + ST.KETTLE.h * 0.5, ST.KETTLE.z], Hd = w3(J.head);
    const bg = kg.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#24304e'); bg.addColorStop(0.3, '#4a5a82'); bg.addColorStop(0.42, '#c89a80'); bg.addColorStop(0.5, '#f0c090'); bg.addColorStop(0.58, '#4a3e44'); bg.addColorStop(1, '#1e1a20');
    kg.fillStyle = bg; kg.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) { kg.fillStyle = i % 2 ? 'rgba(255,214,150,0.75)' : 'rgba(255,240,200,0.6)'; kg.fillRect(w * (0.05 + i * 0.14), h * 0.47, w * 0.05, h * 0.05); }   // the shops' lights behind him, across the street
    const sp = kg.createRadialGradient(w * 0.78, h * 0.18, 0, w * 0.78, h * 0.18, w * 0.3); sp.addColorStop(0, 'rgba(255,236,190,0.9)'); sp.addColorStop(1, 'rgba(255,236,190,0)'); kg.fillStyle = sp; kg.fillRect(0, 0, w, h);
    kg.save(); kg.translate(w, 0); kg.scale(-1, 1);
    const psiK = -wrap(Math.atan2(K0[0] - Hd[0], K0[2] - Hd[2]) - H0 - J.yawH);   // after test 6: turned back towards him
    const L = LOOK.thief, [c0, c1] = R.tone(L.shirt, { x: 0.3, back: 0, front: 1 });
    const sh = kg.createLinearGradient(0, h * 0.7, 0, h); sh.addColorStop(0, c0); sh.addColorStop(1, c1);
    kg.fillStyle = sh; kg.beginPath(); kg.ellipse(w * 0.5, h * 0.9, w * 0.28, h * 0.2, 0, PI, TAU); kg.fill();
    kg.fillStyle = R.mix(L.skin, L.skinD, 0.4); kg.fillRect(w * 0.46, h * 0.6, w * 0.08, h * 0.12);
    R.head3(kg, w * 0.5, h * 0.46, w * 0.225, clamp(psiK, -0.9, 0.9), L, { pitch: J.pitchH * 0.6, tilt: J.tiltH, light: { x: 0.35, back: 0, front: 1 }, ...face });
    kg.restore();
    kg.fillStyle = 'rgba(255,250,235,0.85)'; kg.beginPath(); kg.ellipse(w * 0.2, h * 0.16, w * 0.05, h * 0.09, -0.2, 0, TAU); kg.fill();   // the bulb, caught in the steel
  }
  // his shirt's left breast pocket, from his chest as it is now: [the four corners (top left, top right, bottom right, bottom left), its middle]
  function pocketQuad(F, sag = 0) {
    const J = F.J, lat = norm(sub(J.shL, J.shR)), up = norm(sub(J.chest, J.pel)), fw = norm(cross(up, lat));
    const c = add(J.chest, mul(fw, 0.112), mul(lat, 0.084), mul(up, -0.07)), w = 0.066, top = 0.05, bot = -0.085 - 0.012 * sag;
    const at = (a, b, d = 0) => F.w3(add(c, mul(lat, a), mul(up, b), mul(fw, d)));
    return { pts: [at(-w, top), at(w, top), at(w * (1 + 0.1 * sag), bot, 0.01 * sag), at(-w * (1 + 0.1 * sag), bot, 0.01 * sag)], mid: at(0, -0.02) };
  }
  function drawPocket(g, cam, F, lt, sag, front = false) {
    const { pts } = pocketQuad(F, sag), q = pts.map((p) => cam.P(p[0], p[1], p[2])); if (q.some((x) => !x)) return;
    const [c0, c1] = R.tone(mix(LOOK.thief.shirt, '#1c3a34', 0.12), lt), sc = q[0][2];
    g.save(); g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    g.fillStyle = mix(c0, c1, 0.25 + 0.3 * sag); g.fill(); g.strokeStyle = H3.INK; g.lineWidth = H3.inkW(sc) * 0.6; g.lineJoin = 'round'; g.stroke();   // flat, inked (the 2D look)
    g.setLineDash([Math.max(2, 0.004 * sc), Math.max(1.5, 0.003 * sc)]); g.strokeStyle = 'rgba(230,255,245,0.35)'; g.lineWidth = Math.max(0.8, 0.0012 * sc);
    g.beginPath(); g.moveTo(lerp(q[0][0], q[1][0], 0.06), lerp(q[0][1], q[1][1], 0.06) + 0.006 * sc); g.lineTo(lerp(q[0][0], q[1][0], 0.94), lerp(q[0][1], q[1][1], 0.94) + 0.006 * sc); g.stroke(); g.setLineDash([]);
    if (front) { g.strokeStyle = H3.INK; g.lineWidth = H3.inkW(sc) * 0.8; g.beginPath(); g.moveTo(q[0][0], q[0][1]); g.lineTo(q[1][0], q[1][1]); g.stroke(); }   // the pocket's lip, over the wallet
    g.restore();
  }
  const walletInPocket = (t) => t > K.pocket + 0.1 && t < K.reach + 0.45;
  // everything the hands may hold, at any moment (the hands' moves ask for it at the times their moves began)
  function ctxAt(tt) { const bp = bodyAt(tt), J = R.skel(STY, 0, bp), w = walletAt(tt); return { w, n: notesAt(tt, w), tk: tokenAt(tt, w), g: glassAt(tt, J), J }; }
  const countlessNotes = (t) => [0.012, 0.004, 0.007, 0.0, 0.007, 0.004, 0.012].map((dy) => ({ dy: dy * (t < K.draw ? 1 : 0) }));   // before he draws them, their tops not quite level, so their colours show
  const bendNotes = (b) => PR.NOTES.map((_, i) => ({ lift: b * (0.6 + 0.06 * i), e: 1, curl: 0.35 }));
  function focusAt(t, cam, head, wl) {
    const dist = (p) => Math.max(0.15, cam.toCam(p[0], p[1], p[2])[2]);
    const kettle = [ST.KETTLE.x, ST.KETTLE.y + ST.KETTLE.h * 0.5, ST.KETTLE.z];
    const face = dist(head), hands = dist(wl), ket = dist(kettle);
    const subj = lerp(hands, face, 0.45);
    const toK = ease(K.rack1, word('see') - 0.02, t) * (1 - ease(K.rack2, K.rack2 + 0.55, t));
    const pov = ease(K.arc1 - 0.6, K.arc1, t), handsNear = Math.max(win(t, K.holdOut - 0.3, K.holdOut, K.letGo + 0.3, K.letGo + 0.8), win(t, K.down, K.down + 0.4, K.up, K.up + 0.4));
    let fd = lerp(subj, ket, toK);
    fd = lerp(fd, lerp(face, hands, handsNear), pov);
    return { fd, kd: lerp(5.5, 11, toK) };
  }

  window.DEBUG45 = { youTrack, camAt, K };                // for probes only (nothing reads it while rendering)
  const U = window.UI;
  U.endcard();
  C.start();
})();
