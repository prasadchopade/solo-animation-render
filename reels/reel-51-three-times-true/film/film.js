// Reel 51 · Three Times True. Tests desk. You're at a chai stall in an old bazaar. A barber leans in: "You there, keep a hand on your
// wallet. There's a pickpocket at the east gate." Behind him, in the first second, the man in the maroon cap (the season's thief, silent,
// no stubble) lifts a wallet at a fruit cart and walks off to the west gate. A student says it, then a rickshaw driver. "So where's the
// pickpocket?" The answer, replayed; the warning was his; three warnings, one man; every hand that went to a pocket, yours too; the police
// grab a man running for his bus while he walks back through the pockets; at your stall he starts it again. Script: docs/script.md
// (draft 3, approved 26 Nov). Facts: docs/research.md. The lane is film/world.js; people are r36.js's figure (reel 41); the close-ups use
// draw.js (reel 49). Every action is keyed to a placed word (film/words.js). Every frame is a pure function of t, sealed in save/restore.
// Copied from reel 49 (tag source/reel-49-the-con, film/film.js), by name: mj, key, k1, life, settle, win, on2, blink, talk.
(() => {
  const { W, H, scene, canvas, clamp, lerp, mulberry32 } = C;
  const K = window.KIT, U = window.UI, WD = window.WORLD, R = window.R36, D = window.DRAW;
  const PI = Math.PI, TAU = PI * 2;
  const { txt, lg, rg, mix, ell, hand, headProfile, MEN } = D;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn'];

  // ------------------------------------------------------------------ motion helpers (reel 49's, from reel 42)
  const mj = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const key = (t, ks) => {
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
  function life(seed, t, k = 1) {
    const s = (hz, ph) => Math.sin(TAU * (hz * t + ph));
    const b = s(0.26, seed * 0.37), w1 = s(0.09, seed * 0.71), h1 = s(0.19, seed * 0.53), h2 = s(0.31, seed * 0.17 + 0.4);
    return { breath: b * k, lean: (0.011 * b + 0.015 * w1) * k, look: (h1 * 0.6 + h2 * 0.4) * k, tilt: 0.02 * w1 * k };
  }
  const settle = (u) => { u = clamp(u); return u >= 1 ? 1 : 1 - Math.exp(-5.5 * u) * Math.cos(7.5 * u) * (1 - u * 0.5); };
  const win = (t, a, b, c, d) => mj((t - a) / (b - a)) * (1 - mj((t - c) / (d - c)));
  function blink(t, seed) { const n = Math.floor(t / 3.4), r = mulberry32(n * 7 + Math.round(seed * 10)), t0 = n * 3.4 + 0.4 + r() * 2.4; return win(t, t0, t0 + 0.05, t0 + 0.1, t0 + 0.16); }

  // ------------------------------------------------------------------ the clock: every action keyed to a placed word
  const WDS = (p) => K.words(p);
  const at = (p, i = 0) => { const w = WDS(p); return w.length ? w[Math.min(i, w.length - 1)].t0 : 0; };
  const en = (p) => { const w = WDS(p); return w.length ? w[w.length - 1].t1 : 0; };
  const atW = (p, re, k = 0) => { const w = WDS(p).filter((x) => re.test(x.w.toLowerCase())); return w.length ? w[Math.min(k, w.length - 1)].t0 : at(p); };
  function talk(t, ids, amp = 0.42) {                  // the mouth opens and closes with the syllables of the words being said
    for (const p of ids) for (const w of WDS(p)) if (t >= w.t0 && t <= w.t1) { const u = (t - w.t0) / Math.max(0.08, w.t1 - w.t0), syl = Math.max(1, Math.round((w.t1 - w.t0) / 0.18)); return amp * (0.35 + 0.65 * Math.abs(Math.sin(u * PI * syl))); }
    return 0;
  }
  const HEADS = {};                                // this frame: each named person's head on screen {x, y, s} (their bubbles hang off it)
  let T = null;
  function times() {
    if (T) return T;
    T = {};
    T.wallet = atW('c01', /wallet/); T.east1 = atW('c01', /east/); T.c01e = en('c01');
    T.c02 = at('c02'); T.pick2 = atW('c02', /pickpocket/); T.east2 = atW('c02', /east/); T.c02e = en('c02');
    T.c03 = at('c03'); T.pick3 = atW('c03', /pickpocket/); T.police = atW('c03', /police/); T.c03e = en('c03');
    T.q = at('n01'); T.qe = en('n01');
    T.n02 = at('n02'); T.west = atW('n02', /west/); T.wallet2 = atW('n02', /wallet/); T.first = atW('n02', /first/);
    T.n03 = at('n03'); T.warning = atW('n03', /warning/); T.his = atW('n03', /his/);
    T.n04 = at('n04b'); T.one = atW('n04b', /^one/); T.times3 = atW('n04b', /times/);
    T.n05 = at('n05c'); T.witn = atW('n05c', /witnesses/); T.notone = atW('n05c', /^not/); T.seen = atW('n05c', /seen/);
    T.n05d = at('n05d'); T.every = atW('n05d', /every/); T.hand = atW('n05d', /^hand/); T.pocket = atW('n05d', /pocket/); T.yours = atW('n05d', /yours/);
    T.n07 = at('n07'); T.ran = atW('n07', /^ran/); T.grab = atW('n07', /grabbed/); T.running = atW('n07', /running/);
    T.n08 = at('n08b'); T.through = atW('n08b', /through/); T.touch = atW('n08b', /touch/);
    T.c04 = at('c04'); T.wallet4 = atW('c04', /wallet/); T.c04e = en('c04');
    T.end = K.tb('end');
    // the shots
    T.s2 = T.east1 + 0.32;              // the pan east starts, following the barber's point
    T.s4 = T.c03e + 0.25;               // on to the east gate
    T.s5 = T.n02 - 0.44;                // the whip back west (inside the question's quiet), and the replay
    T.s6 = en('n02') + 0.02;            // the rewind, in the gap after "...first second."
    T.s6b = T.n03 - 0.04;               // the whisper, in the barber's chair
    T.s7 = T.n04 - 0.12;                // the thread
    T.s8 = en('n04b') + 0.06;           // three witnesses (their bubbles pop in the gap)
    T.s9 = T.n05d - 0.12;               // his view: the pats
    T.s10 = T.n07 - 0.2;                // the east gate
    T.s11 = T.n08 - 0.08;               // the lifts
    T.s12 = T.n08 + 3.55;               // your stall, and it starts again
    return T;
  }

  // ------------------------------------------------------------------ the cast (r36.js figures: L the face, D the clothes). Our own people.
  const SK = (skin, skinD, skinH) => ({ skin, skinD, skinH });
  const THIEF = { L: { ...R.THIEF, stub: 0 }, D: R.TEAL };            // the season's thief, without the stubble (the user, reel 49)
  const BARBER = { L: { ...SK('#b07a56', '#86583a', '#c9966f'), hair: '#e6e0d6', mHair: '#cfc8bc', style: 'part', must: 'mid', brow: 19, browTilt: 9, jaw: 1.06, chinK: 1.08, ew: 40, eh: 20, noseW: 1.2 },
    D: { a: '#bfe3d0', b: '#8fc6ac', collar: '#a9d6be', sleeve: 'long', buttons: 'rgba(40,70,60,0.4)', leg: '#4a4038', shoe: '#2a1d14' } };
  const STUDENT = { L: { ...SK('#b88259', '#8f5d3c', '#d09d76'), hair: '#1a1410', style: 'pony', jaw: 0.9, chinK: 0.92, ew: 47, eh: 26, brow: 11, browTilt: -2 },
    D: { a: '#e0558f', b: '#b83a6e', sleeve: 'short', kameez: true, leg: '#3a5a9a', shoe: '#f2f0e6' } };
  const DRIVER = { L: { ...SK('#9c6a48', '#74492c', '#b9855e'), hair: '#17110d', style: 'crew', must: 'thick', stub: 0.25, brow: 18, browTilt: 4, jaw: 1.1, chinK: 1.05, ew: 42, eh: 21 },
    D: { a: '#9aa3ad', b: '#737d88', collar: '#87909a', sleeve: 'short', gamchha: true, leg: '#3b3a40', shoe: '#2a1d14' } };
  const CHAI = { L: { ...SK('#a9744f', '#80522f', '#c38d66'), hair: '#8d8780', style: 'knot', jaw: 0.98, chinK: 1.0, ew: 42, eh: 22, brow: 12, browTilt: 1 },
    D: { a: '#2d5fae', b: '#1f4682', sleeve: 'short', pallu: '#3a72c4', border: '#e9b3c6', leg: '#2d5fae', shoe: '#6a3a2a' } };
  const RUNNER = { L: { ...SK('#b9845c', '#90603c', '#d2a07a'), hair: '#15100c', style: 'spiky', jaw: 0.92, chinK: 0.9, ew: 48, eh: 27, brow: 12, browTilt: -1 },
    D: { a: '#f4dc5a', b: '#d8bc3a', sleeve: 'short', leg: '#3a5a9a', shoe: '#e8e6e0' } };
  const COP2 = { L: { ...R.COP.L, must: 'mid', style: 'crew', jaw: 1.0, ew: 44, eh: 22 }, D: R.COP.D };
  const CROWD = [
    { L: { ...SK('#a8714d', '#80522f', '#c08a64'), hair: '#2a1d15', style: 'short', must: 'mid', brow: 16, browTilt: 3, jaw: 1.08, ew: 42, eh: 21 }, D: { a: '#f4f0e6', b: '#d4cdbd', sleeve: 'long', placket: '#c9b48a', leg: '#4a3f36', shoe: '#2a1d14' } },
    { L: { ...SK('#c08b66', '#956446', '#d6a682'), hair: '#1d1510', style: 'knot', jaw: 0.92, ew: 45, eh: 24, brow: 11, browTilt: -2 }, D: { a: '#7a59b8', b: '#5a3f94', sleeve: 'short', pallu: '#9b7ad6', border: '#f0c23c', leg: '#7a59b8', shoe: '#6a3a2a' } },
    { L: { ...SK('#93613f', '#6c4428', '#ad7a56'), hair: '#120d0a', style: 'curls', beard: { c: '#1a120d', k: 'full' }, brow: 17, browTilt: 2, jaw: 1.1, ew: 44, eh: 23 }, D: { a: '#5ab8ff', b: '#3a8fd0', sleeve: 'short', leg: '#2f3442', shoe: '#1d1a17' } },
    { L: { ...SK('#b57d58', '#8c5a3a', '#cc9a74'), hair: '#9a948c', mHair: '#c4beb4', style: 'short', must: 'thick', brow: 20, browTilt: 9, jaw: 1.04, ew: 41, eh: 20 }, D: { a: '#e8b84a', b: '#c99a2e', sleeve: 'long', sweater: '#6f4a2a', leg: '#3f3a36', shoe: '#2a1d14' } },
    { L: { ...SK('#a46f4b', '#7c4f31', '#bf8a63'), hair: '#1a130e', style: 'spiky', brow: 12, browTilt: 3, jaw: 0.92, ew: 47, eh: 27 }, D: { a: '#c98a4a', b: '#a86c32', sleeve: 'short', leg: '#2f3442', shoe: '#e8e6e0' } },
    { L: { ...SK('#bd8761', '#916142', '#d4a07a'), hair: '#1a1410', style: 'long', braid: true, jaw: 0.9, ew: 45, eh: 25, brow: 11, browTilt: -2 }, D: { a: '#2fa5d6', b: '#1f7fae', sleeve: 'short', kameez: true, dupatta: '#f6efe0', leg: '#f3e6d8', shoe: '#8a3a2a' } },
    { L: { ...SK('#8f5e3d', '#694226', '#a97754'), hair: '#17110d', style: 'part', must: 'thin', brow: 15, browTilt: 5, jaw: 1.0, ew: 43, eh: 22 }, D: { a: '#c2453a', b: '#9a2f26', collar: '#ae3a30', sleeve: 'short', leg: '#4a4038', shoe: '#2a1d14' } },
    { L: { ...SK('#b9845c', '#90603c', '#d2a07a'), hair: '#15100c', style: 'short', jaw: 0.9, chinK: 0.86, ew: 50, eh: 29, brow: 11, browTilt: -2 }, D: { a: '#a8b4e8', b: '#8090c8', sleeve: 'short', leg: '#3a5a9a', shoe: '#e8e6e0' } },
  ];
  const VICTIM = CROWD[0];                          // the man at the fruit cart whose wallet goes first (white kurta, a red wallet)

  // ------------------------------------------------------------------ placing people: r36.drawPerson through the lane's camera (millimetres)
  const mm = (v) => v * 1000;
  function person(g, c, P, X, Z, a, o = {}, Y = 0) { return R.drawPerson(g, c, P, mm(X), mm(Y), mm(Z), a, { breath: 0, ...o }); }
  function headLocal(c, X, Z, a, wx, wy, wz) {        // a world point in a figure's head frame (for armIK); the figure stands at (X, Z)
    const v = R.personView(c, mm(X), 0, mm(Z), a), p = c.P(wx, wy, wz); if (!v || !p) return null;
    const s = v.s, hx = v.x, hy = v.y - 1594 * s; return [(p[0] - hx) / s, (p[1] - hy) / s];
  }
  const facing = (fx, fz, tx, tz) => { const az = Math.atan2(tx - fx, tz - fz); return PI - az; };   // the angle a that faces (tx, tz)
  const walkPos = (t, t0, t1, A, B) => { const u = clamp((t - t0) / (t1 - t0)); return [lerp(A[0], B[0], u), lerp(A[1], B[1], u), u]; };
  const arm = (k, x, y, reach, prefer, handPose, w) => ({ ...R.armIK({ yaw: 0 }, k, x, y, reach, prefer), hand: handPose, w });
  const R36R = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

  // ------------------------------------------------------------------ the frame-0 staging, as story time τ (the replay and the rewind reuse it)
  const FRUIT = { victim: [-3.39, -0.4], thief0: [-2.99, -0.07], cart: [-6.15, 0.35], gate: [-8.8, 2.0], look: [-3.6, -2.6] };
  const CHAIR = WD.BCHAIR;                          // the barber's chair, by the west gate's end of the north row
  function thiefLane(tau, c) {                       // where the thief is and what he does, τ in seconds from frame 0
    const [vx, vz] = FRUIT.victim, a0 = facing(FRUIT.thief0[0], FRUIT.thief0[1], FRUIT.look[0] + 0.4, FRUIT.look[1]);
    if (tau < -0.45) {                               // before frame 0: up out of the barber's chair and across to the man at the stall
      const A = [CHAIR.x + 0.4, CHAIR.z - 0.6], [x, z] = walkPos(tau, -3.2, -0.45, A, FRUIT.thief0);
      return { X: x, Z: z, a: facing(A[0], A[1], FRUIT.thief0[0], FRUIT.thief0[1]), o: { walk: 1, phase: tau * 5.6 } };
    }
    if (tau < 1.25) {
      // the lift: his near hand to the man's back pocket, out with the red wallet, up across his own chest and into his pocket;
      // then he looks back over his shoulder, at you
      const reach = win(tau, -0.4, 0.08, 0.36, 0.62), lift = win(tau, 0.36, 0.56, 0.82, 1.02), look = win(tau, 0.86, 1.0, 1.16, 1.32);
      const wp = walletAt(tau);
      const pk = headLocal(c, ...FRUIT.thief0, a0, ...wp) || [-300, 760];
      const ar = { ...R.armIK({ yaw: 0 }, -1, pk[0] + 30, pk[1] - 10, 60, 'down'), hand: tau > 0.12 && tau < 0.9 ? 'grip' : 'relax', w: Math.max(reach, lift) };
      return { X: FRUIT.thief0[0], Z: FRUIT.thief0[1], a: a0, o: { arms: { l: ar }, headYaw: -0.45 + 0.75 * look, look: [-16 + 30 * look, 10 - 10 * look], smile: 0.2 + 0.25 * look }, wallet: tau < 1.0 };
    }
    const [x, z, u] = walkPos(tau, 1.25, 4.6, FRUIT.thief0, FRUIT.gate), a = facing(FRUIT.thief0[0], FRUIT.thief0[1], FRUIT.gate[0], FRUIT.gate[1]);
    return { X: x, Z: z, a: u < 1 ? a : facing(x, z, WD.YOU.x, WD.YOU.z), o: { walk: u < 1 ? 1 : 0, phase: tau * 5.6, smile: 0.3 } };
  }
  // the red wallet's path: in the man's back pocket (on the side next to the thief), out, up across the thief's chest, down into his pocket
  function walletAt(tau) {
    const [vx, vz] = FRUIT.victim, [tx, tz] = FRUIT.thief0;
    const P0 = [vx + 0.17, 0.7, vz + 0.12], P1 = [lerp(vx, tx, 0.55), 0.86, lerp(vz, tz, 0.55) + 0.12], P2 = [tx - 0.06, 1.12, tz - 0.16], P3 = [tx + 0.02, 0.72, tz - 0.2];
    if (tau < 0.36) return P0;
    if (tau < 0.56) { const u = mj((tau - 0.36) / 0.2); return P0.map((v, i) => lerp(v, P1[i], u)); }
    if (tau < 0.78) { const u = mj((tau - 0.56) / 0.22); return P1.map((v, i) => lerp(v, P2[i], u)); }
    const u = mj((tau - 0.78) / 0.22); return P2.map((v, i) => lerp(v, P3[i], u));
  }
  function victimLane(tau) {
    const [x, z] = FRUIT.victim;
    return { X: x, Z: z, a: facing(x, z, FRUIT.look[0], FRUIT.look[1]), o: { headYaw: -0.55 + 0.1 * Math.sin(tau * 1.3), look: [-18, 2], arms: { r: { a1: 0.45, a2: 1.3, hand: 'grip', w: 1 } } } };
  }
  // the crowd at the west gate and along the lane: loops, so nobody is frozen; few caps, a prop or two
  const GATE_CROWD = (() => { const r = mulberry32(5131), out = []; for (let i = 0; i < 9; i++) out.push({ P: CROWD[(i + 1) % CROWD.length], x: -9.2 + r() * 2.6, z: 0.4 + r() * 3.8, a: r() * TAU, sp: 0.2 + r() * 0.5, ph: r() * 6, moves: r() > 0.45 }); return out; })();
  const MID_CROWD = (() => { const r = mulberry32(5137), out = []; for (let i = 0; i < 7; i++) out.push({ P: CROWD[(i + 3) % CROWD.length], x: -1.5 + i * 2.1 + r() * 0.8, z: 2.6 + r() * 2.6, a: r() * TAU, sp: 0.15 + r() * 0.3, ph: r() * 6, moves: r() > 0.3 }); return out; })();
  function crowdAt(tau, list) {
    return list.map((p) => {
      const dx = p.moves ? 0.7 * Math.sin(tau * p.sp + p.ph) : 0;
      return { P: p.P, X: p.x + dx, Z: p.z, a: p.moves ? (Math.cos(tau * p.sp + p.ph) > 0 ? -PI / 2 : PI / 2) : p.a, o: { walk: p.moves ? 0.7 : 0, phase: tau * 4.2 + p.ph, headYaw: 0.3 * Math.sin(tau * 0.7 + p.ph), breath: 6 * Math.sin(tau * 1.6 + p.ph) } };
    });
  }

  // ------------------------------------------------------------------ props: the wallet, the fruit cart, the auto, a sling bag
  function wallet(g, c, X, Y, Z, rot = 0, k = 1) {
    const p = c.P(X, Y, Z); if (!p) return; const s = p[2] / 1000 * k;
    g.save(); g.translate(p[0], p[1]); g.rotate(rot); g.scale(s, s);
    g.fillStyle = '#d8262c'; R36R(g, -70, -46, 140, 92, 14); g.fill(); g.fillStyle = '#a81a22'; R36R(g, -70, -6, 140, 12, 4); g.fill();
    g.strokeStyle = '#ffd34a'; g.lineWidth = 8; g.beginPath(); g.moveTo(-56, -32); g.lineTo(56, -32); g.stroke();
    g.restore();
  }
  function fruitCart(g, c) {
    const [x, z] = FRUIT.cart, P2 = WD.poly, hx = 0.85, hz = 0.5;
    for (const k of [-1, 1]) {
      const p = c.P(x + k * 0.5, 0.32, z - hz - 0.02); if (!p) continue; const s = p[2] / 1000;
      g.strokeStyle = '#3a2614'; g.lineWidth = 34 * s; g.beginPath(); g.arc(p[0], p[1], 300 * s, 0, TAU); g.stroke();
      g.lineWidth = 12 * s; for (let i = 0; i < 6; i++) { const an = i * PI / 3; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + Math.cos(an) * 290 * s, p[1] + Math.sin(an) * 290 * s); g.stroke(); }
    }
    P2(g, c, [[x - hx, 0.7, z - hz], [x + hx, 0.7, z - hz], [x + hx, 0.7, z + hz], [x - hx, 0.7, z + hz]], '#9a6838');
    P2(g, c, [[x - hx, 0.52, z - hz], [x + hx, 0.52, z - hz], [x + hx, 0.7, z - hz], [x - hx, 0.7, z - hz]], '#6a4020');
    P2(g, c, [[x + hx, 0.52, z - hz], [x + hx, 0.52, z + hz], [x + hx, 0.7, z + hz], [x + hx, 0.7, z - hz]], '#7a4a24');
    WD.line3(g, c, [x + hx, 0.6, z], [x + hx + 0.7, 0.85, z], '#5a3a1a', 10);
    const r = mulberry32(5150), fruit = [];
    for (let i = 0; i < 60; i++) { const u = r(), v = r(), px = x - hx + 0.1 + u * (hx * 2 - 0.2), pz = z - hz + 0.1 + v * (hz * 2 - 0.2), py = 0.76 + 0.22 * Math.sin(u * PI) * Math.sin(v * PI); fruit.push([px, py, pz, i]); }
    fruit.sort((a, b) => Math.hypot(b[0] - c.X0, b[2] - c.Z0) - Math.hypot(a[0] - c.X0, a[2] - c.Z0));
    for (const [px, py, pz, i] of fruit) { const p = c.P(px, py, pz); if (!p) continue; const s = p[2] / 1000; g.fillStyle = i % 4 === 0 ? '#e8712a' : '#f39a1e'; ell(g, p[0], p[1], 62 * s, 58 * s); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; ell(g, p[0] - 18 * s, p[1] - 18 * s, 16 * s, 14 * s); g.fill(); }
    for (let i = 0; i < 4; i++) { const p = c.P(x + 0.45 + i * 0.08, 0.98, z - 0.1); if (!p) continue; const s = p[2] / 1000; g.strokeStyle = '#f0c32a'; g.lineWidth = 40 * s; g.lineCap = 'round'; g.beginPath(); g.arc(p[0], p[1] + 60 * s, 120 * s, PI * 1.1, PI * 1.9); g.stroke(); }
  }
  // the student's sling bag on her left hip (screen side k), its front pocket towards us; drawn over her figure at its screen point
  function slingBag(g, v, k = -1, lift = 0) {
    const s = v.s, x = v.x + k * 230 * s, y = v.y - 1594 * s + (900 - lift * 120) * s;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = '#a8761e'; g.lineWidth = 22; g.beginPath(); g.moveTo(-k * 170, -720); g.quadraticCurveTo(-k * 60, -380, 0, -110); g.stroke();
    g.fillStyle = '#f0c32a'; R36R(g, -140, -110, 280, 210, 40); g.fill(); g.fillStyle = '#d9a82a'; R36R(g, -120, -40, 240, 120, 26); g.fill();
    g.strokeStyle = '#a8761e'; g.lineWidth = 8; g.beginPath(); g.moveTo(-100, -40); g.lineTo(100, -40); g.stroke();
    g.restore();
  }
  // the auto-rickshaw, from the front: the canopy and the cab behind the driver, the driver, then the windscreen frame and the body over him
  const AUTO = { x: 5.8, z: 3.1 };
  function auto(g, c, t, k, at = AUTO) {             // k: {lean, pat, thumb, talk}; at: where it stands (the diagram moves it)
    const p = c.P(at.x, 0, at.z); if (!p) return; const s = p[2] / 1000;
    const back = () => {
      g.save(); g.translate(p[0], p[1]); g.scale(s, s); g.lineJoin = 'round';
      g.fillStyle = 'rgba(30,20,12,0.25)'; ell(g, 0, 0, 900, 120); g.fill();
      g.fillStyle = '#26262a'; g.beginPath(); g.moveTo(-700, -1700); g.lineTo(700, -1700); g.lineTo(640, -700); g.lineTo(-640, -700); g.closePath(); g.fill();   // the cab's dark inside
      for (const kk of [-1, 1]) { g.fillStyle = '#141414'; R36R(g, kk * 760 - 80, -380, 160, 390, 60); g.fill(); }
      g.restore();
    };
    const front = () => {
      g.save(); g.translate(p[0], p[1]); g.scale(s, s); g.lineJoin = 'round';
      g.fillStyle = '#1f1f22'; g.beginPath(); g.moveTo(-760, -1880); g.quadraticCurveTo(0, -2100, 760, -1880); g.lineTo(790, -1690); g.lineTo(-790, -1690); g.closePath(); g.fill();   // the canopy
      g.fillStyle = 'rgba(190,225,240,0.16)'; g.beginPath(); g.moveTo(-540, -1640); g.lineTo(540, -1640); g.lineTo(520, -1060); g.lineTo(-520, -1060); g.closePath(); g.fill();   // the windscreen glass
      g.strokeStyle = '#1f1f22'; g.lineWidth = 46; g.beginPath(); g.moveTo(-560, -1660); g.lineTo(560, -1660); g.lineTo(540, -1040); g.lineTo(-540, -1040); g.closePath(); g.stroke();
      g.fillStyle = '#f0c32a'; g.beginPath(); g.moveTo(-640, -1040); g.lineTo(640, -1040); g.lineTo(720, -200); g.lineTo(-720, -200); g.closePath(); g.fill();      // the yellow front
      g.fillStyle = '#d9a82a'; g.beginPath(); g.moveTo(-640, -1040); g.lineTo(640, -1040); g.lineTo(650, -960); g.lineTo(-650, -960); g.closePath(); g.fill();
      g.fillStyle = '#fff6d0'; ell(g, 0, -640, 92, 92); g.fill(); g.strokeStyle = '#2a2a2a'; g.lineWidth = 16; g.stroke();                                         // the headlamp
      g.fillStyle = '#141414'; R36R(g, -110, -230, 220, 240, 60); g.fill();                                                                                         // the front wheel
      g.restore();
    };
    back();
    // the driver: seated behind the screen (his feet below the floor, so his head sits at a seated height); he leans out to his right
    const a = facing(at.x, at.z, c.X0, c.Z0);
    const arms = { l: arm(-1, -150, 800, 0, 'in', 'flat', k.pat), r: arm(1, 260, -240, 60, 'out', 'point', k.thumb) };
    const lx = at.x + 0.2 - 0.32 * k.lean, lz = at.z - 0.05 + 0.25 * k.lean;
    const dv = R.drawPerson(g, c, DRIVER, mm(lx), mm(-0.42), mm(lz), a, { breath: 0, legs: false, arms, op: k.talk, close: blink(t, 3.3), headYaw: 0.15 * k.lean, lean: -0.16 * k.lean, look: [6, 0] });
    if (dv) HEADS.driver = { x: dv.x, y: dv.y - 1594 * dv.s, s: dv.s };
    front();
  }

  // ------------------------------------------------------------------ overlays: titles, speech bubbles, rings, the thread
  function title(g, lines, y, size, t, t0, t1) {
    const a = sstep(t0 - 0.01, t0 + 0.12, t) * (1 - sstep(t1 - 0.25, t1, t)), pop = t0 >= 0 ? 0.85 + 0.15 * settle((t - t0) / 0.3) : 1;
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(540, y); g.scale(pop, pop);
    lines.forEach((ln, i) => txt(g, ln.s, 0, i * size * 0.98 + (ln.dy || 0), ln.size || size, ln.col || '#fff6e2', { align: 'center', stroke: '#14100a', sw: 0.15, fit: 860 }));
    g.restore();
  }
  // a speech bubble with words in it, its tail towards (tx, ty); pops in at t0, gone by t1 (a = 1 holds it)
  function bubble(g, x, y, tx, ty, s, t, t0, t1, k = 1) {
    const a = sstep(t0 - 0.02, t0 + 0.06, t) * (1 - sstep(t1 - 0.2, t1, t)); if (a <= 0) return;
    const sc = k * (0.6 + 0.4 * settle((t - t0) / 0.28));
    bubbleAt(g, x, y, tx, ty, s, sc, a);
  }
  function bubbleAt(g, x, y, tx, ty, s, sc, a = 1) {
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(sc, sc);
    const w = 330, h = 120;
    g.fillStyle = '#fffaf0'; g.strokeStyle = '#14100a'; g.lineWidth = 7; g.lineJoin = 'round';
    g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 54); g.fill(); g.stroke();
    const dx = (tx - x) / sc, dy = (ty - y) / sc, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, bx = ux * 40, by = uy * 30;
    if (L > 30) {
      g.beginPath(); g.moveTo(bx + nx * 26, by + ny * 26); g.lineTo(ux * Math.min(L, 150), uy * Math.min(L, 150)); g.lineTo(bx - nx * 26, by - ny * 26); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fffaf0'; g.beginPath(); g.roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 50); g.fill();
    }
    txt(g, s, 0, 24, 74, '#c0262c', { align: 'center' });
    g.restore();
  }
  function speakerBubble(g, id, t, t0, t1, side = -1, k = 1) {
    const h = HEADS[id]; if (!h) return;
    const r = 200 * h.s, bx = clamp(h.x + side * (r + 120 * k), 230, 850), by = clamp(h.y - r - 110 * k, 340, 1380);
    bubble(g, bx, by, h.x + side * 0.25 * r, h.y + 0.45 * r, 'EAST GATE', t, t0, t1, k);
  }
  const MAROON = '#8e2433';
  function ring(g, x, y, r, k, lw = 10, col = MAROON) {
    if (k <= 0) return; const u = settle(k);
    g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r * (0.7 + 0.3 * u), -PI / 2, -PI / 2 + TAU * clamp(k * 1.6)); g.stroke(); g.restore();
  }
  // the warning, as one maroon thread through points, drawn up to a share k of its length, a bead travelling at its tip
  function thread(g, pts, k, lw = 9) {
    if (k <= 0 || pts.length < 2) return;
    const seg = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let left = L * clamp(k);
    g.save(); g.strokeStyle = MAROON; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([]);
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); let tip = pts[0];
    for (let i = 1; i < pts.length && left > 0; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], u = Math.min(1, left / seg[i - 1]), mx = (ax + bx) / 2, my = Math.min(ay, by) - 0.18 * seg[i - 1];
      // a sagging curve from a to b, cut at u (de Casteljau)
      const q0 = [lerp(ax, mx, u), lerp(ay, my, u)], q1 = [lerp(mx, bx, u), lerp(my, by, u)], e = [lerp(q0[0], q1[0], u), lerp(q0[1], q1[1], u)];
      g.quadraticCurveTo(q0[0], q0[1], e[0], e[1]); tip = e; left -= seg[i - 1];
    }
    g.stroke();
    if (k < 1) { g.fillStyle = '#f0c32a'; ell(g, tip[0], tip[1], lw * 1.4, lw * 1.4); g.fill(); }
    g.restore();
  }
  // a frame's grade: o.sat (saturation), o.warm (sepia), o.cool, o.dim; the rewind's tracking lines
  function grade(g, o = {}) {
    if (o.dim) { g.fillStyle = `rgba(20,14,24,${o.dim})`; g.fillRect(0, 0, W, H); }
    if (o.warm) { g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = `rgba(150,105,60,${o.warm})`; g.fillRect(0, 0, W, H); g.restore(); }
    if (o.cool) { g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = `rgba(70,105,150,${o.cool})`; g.fillRect(0, 0, W, H); g.restore(); }
  }
  function vignette(g, k = 1) { g.fillStyle = rg(g, 540, 960, 560, 1250, [0, 'rgba(30,12,10,0)'], [1, `rgba(30,12,10,${0.5 * k})`]); g.fillRect(0, 0, W, H); }

  // ------------------------------------------------------------------ you: your left hand on your left trouser pocket (POV)
  function myPat(g, k, pat, opts = {}) {             // k: how far into view; pat: 0..1 the taps; opts.stop: the hand stops short
    if (k <= 0) return;
    const y0 = H - 700 * k + (opts.dy || 0);
    g.save();
    if (!opts.handOnly) {
      const leg = () => { g.beginPath(); g.moveTo(-60, H + 60); g.bezierCurveTo(-60, y0 + 380, 20, y0 + 120, 190, y0 + 40); g.bezierCurveTo(300, y0 - 10, 430, y0 + 30, 470, y0 + 120); g.bezierCurveTo(520, y0 + 330, 520, y0 + 560, 560, H + 60); g.closePath(); };
      leg(); g.fillStyle = lg(g, 0, y0, 300, H, [0, '#c4ad7d'], [0.6, '#a8915f'], [1, '#8a744a']); g.fill();
      g.save(); leg(); g.clip();
      g.fillStyle = 'rgba(60,40,15,0.16)'; g.beginPath(); g.moveTo(380, y0); g.bezierCurveTo(470, y0 + 200, 470, y0 + 500, 520, H + 60); g.lineTo(700, H + 60); g.lineTo(700, y0); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(60,40,15,0.5)'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, y0 + 150); g.bezierCurveTo(110, y0 + 230, 190, y0 + 330, 230, y0 + 470); g.stroke();
      g.fillStyle = 'rgba(60,40,15,0.12)'; g.beginPath(); g.moveTo(40, y0 + 150); g.bezierCurveTo(110, y0 + 230, 190, y0 + 330, 230, y0 + 470); g.lineTo(-60, y0 + 600); g.lineTo(-60, y0 + 150); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(60,40,15,0.3)'; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(300, y0 + 30); g.bezierCurveTo(360, y0 + 260, 380, y0 + 500, 420, H); g.stroke(); g.setLineDash([]);
      g.restore();
    }
    const tap = Math.abs(Math.sin(pat * PI * 2)), hx = (opts.hx ?? 150) + 8 * tap, hy = (opts.hy ?? (y0 + 330)) - 40 * tap;
    hand(g, hx, hy, opts.a ?? -1.15, opts.s ?? 250, opts.pose || 'flat', { skin: '#b9845c', left: true });
    g.restore();
  }

  // ================================================================ shots 1–4: the lane, POV, one continuous look (frame 0 to the pick)
  function povCam(t) {
    const yaw = k1(t, [[0, -64], [T.s2, -63], [T.s2 + 1.2, -40], [T.c02 + 1.4, -14], [T.east2, 30], [T.c02e - 0.2, 48], [T.c03 + 0.2, 53.5], [T.c03e - 0.3, 54.5], [T.s4 + 0.6, 84], [T.n02, 86]]);
    const f = k1(t, [[0, 1300], [T.s2, 1300], [T.c02 + 1.4, 1050], [T.c02e, 1200], [T.c03 + 0.3, 2250], [T.c03e, 2350], [T.s4 + 0.7, 1900], [T.n02, 1960]]);
    const dip = win(t, T.wallet + 0.05, T.wallet + 0.3, T.wallet + 0.72, T.wallet + 1.02);
    const L = life(1.7, t, 1);
    return { yaw: yaw + 0.25 * L.look, f, hz: 1060 - 330 * dip + 4 * L.breath, dip };
  }
  // everyone in the lane at story time τ, for camera c, in the pass the world asks for ('beyond' a gate, or 'lane')
  function lanePeople(tau, o = {}) {
    return (g, c, pass) => {
      const list = [];
      if (!o.noCrowd) { list.push(...crowdAt(tau, GATE_CROWD), ...crowdAt(tau, MID_CROWD)); }
      if (!o.noThief) { const th = thiefLane(tau, c); list.push({ ...th, P: THIEF, id: 'thief', th }); }
      if (!o.noVictim) list.push({ ...victimLane(tau), P: VICTIM, id: 'victim' });
      list.push({ id: 'cart', X: FRUIT.cart[0], Z: FRUIT.cart[1], draw: (gg, cc) => fruitCart(gg, cc) });
      list.push({ id: 'chair', X: CHAIR.x, Z: CHAIR.z, draw: (gg, cc) => WD.barberChair(gg, cc) });
      if (!o.noStudent) list.push(...studentLane(tau));
      if (!o.noAuto) list.push(...driverLane(tau));
      if (!o.noEast) list.push(...eastGate(tau));
      if (o.extra) list.push(...o.extra);
      const beyondG = (p) => p.X < WD.GW.x - 0.2 || p.X > WD.GE.x + 0.2;
      const mine = list.filter((p) => (pass === 'beyond' ? beyondG(p) : !beyondG(p)));
      mine.sort((a, b) => Math.hypot(b.X - c.X0, b.Z - c.Z0) - Math.hypot(a.X - c.X0, a.Z - c.Z0));
      for (const p of mine) {
        if (p.draw) { p.draw(g, c); continue; }
        const v = person(g, c, p.P, p.X, p.Z, p.a, p.o);
        if (v && p.id) HEADS[p.id] = { x: v.x, y: v.y - 1594 * v.s * (p.o && p.o.scale || 1), s: v.s };
        if (p.id === 'thief' && p.th && p.th.wallet) { const w = walletAt(tau); wallet(g, c, w[0], w[1], w[2], 0.3 - 0.9 * clamp((tau - 0.36) / 0.6), 1.5); }
        if (p.id === 'student' && v) slingBag(g, v, v.front ? 1 : -1, p.grip || 0);
        if (o.after) o.after(g, c, p, v);
      }
    };
  }
  function shotLane(g, t) {
    const pc = povCam(t), c = WD.cam({ x: WD.YOU.x, z: WD.YOU.z, eye: 1.6, yaw: pc.yaw, f: pc.f, hz: pc.hz });
    WD.lane(g, c, { tw: t, people: lanePeople(t) });
    barberClose(g, c, t);
    myPat(g, sstep(T.wallet + 0.1, T.wallet + 0.35, t) * (1 - sstep(T.wallet + 0.75, T.wallet + 1.0, t)), clamp((t - T.wallet - 0.3) / 0.36));
    return c;
  }
  // the barber: just in front of you, a little to the right, facing you; leaning in, a pat on his breast pocket, then east past your shoulder
  const BARB = { x: -1.26, z: -0.07 };
  function barberClose(g, c, t) {
    if (t > T.c02 + 1.2) return;
    const a = facing(BARB.x, BARB.z, WD.YOU.x, WD.YOU.z), L = life(2.3, t);
    const pat = win(t, T.wallet - 0.25, T.wallet - 0.05, T.wallet + 0.35, T.wallet + 0.55);
    const pt = win(t, T.east1 - 0.28, T.east1 - 0.05, T.c02 + 0.4, T.c02 + 0.8);
    const arms = { l: arm(-1, -120, 520, 30, 'in', 'flat', pat), r: arm(1, 760, 120, 120, 'out', 'point', pt) };
    const v = person(g, c, BARBER, BARB.x, BARB.z, a, { arms, op: talk(t, ['c01']), close: blink(t, 2.1), lean: -0.07 + 0.02 * L.lean, headYaw: 0.12 * pt + 0.04 * L.look, tilt: 0.04, look: [8 * pt, 0], browUp: 0.3 * win(t, T.east1 - 0.2, T.east1, T.east1 + 0.5, T.east1 + 0.9), breath: 8 * L.breath });
    if (v) HEADS.barber = { x: v.x, y: v.y - 1594 * v.s, s: v.s };
  }
  // the student: by the cart at frame 0 (she hears it), then off east past you, telling the driver on her way
  const STU = { a: [-4.04, 1.15], b: [-0.6, 0.75], c: [4.5, 1.75], d: [9.5, 2.0] };
  function studentLane(t) {
    if (t > T.s4 + 2.5) return [];
    let x, z, walking = 1, a;
    if (t < T.c02 - 0.3) { [x, z] = STU.a; walking = 0; a = facing(x, z, BARB.x, BARB.z); }
    else if (t < T.c02 + 1.4) { [x, z] = walkPos(t, T.c02 - 0.3, T.c02 + 1.4, STU.a, STU.b); a = facing(STU.a[0], STU.a[1], STU.b[0], STU.b[1]); }
    else if (t < T.c02e - 0.2) { [x, z] = walkPos(t, T.c02 + 1.4, T.c02e - 0.2, STU.b, STU.c); a = facing(STU.b[0], STU.b[1], STU.c[0], STU.c[1]); }
    else { [x, z] = walkPos(t, T.c02e - 0.2, T.s4 + 2.5, STU.c, STU.d); a = facing(STU.c[0], STU.c[1], STU.d[0], STU.d[1]); }
    const grip = win(t, T.pick2 - 0.2, T.pick2, T.east2 + 0.4, T.east2 + 0.7), pt = win(t, T.east2 - 0.15, T.east2 + 0.05, T.c02e - 0.4, T.c02e);
    const arms = { l: arm(-1, -230, 860, 0, 'in', 'grip', grip), r: arm(1, 560, 60, 120, 'out', 'point', pt) };
    const toYou = t > T.c02 - 0.3 && t < T.c02e - 0.6 ? 0.55 : t >= T.c02e - 0.6 && t < T.c02e + 0.4 ? -0.5 : 0;
    return [{ P: STUDENT, X: x, Z: z, a, id: 'student', grip, o: { walk: walking, phase: t * 6.2, arms, op: talk(t, ['c02'], 0.38), headYaw: toYou, close: blink(t, 4.2) } }];
  }
  const autoAt = (g, c, t, x, z) => auto(g, c, t, { lean: 0, pat: 0, thumb: 0, talk: 0 }, { x, z });
  function driverLane(t) {
    const pat = win(t, T.pick3 - 0.2, T.pick3, T.pick3 + 0.5, T.pick3 + 0.75), thumb = win(t, T.c03 - 0.1, T.c03 + 0.12, T.c03 + 0.9, T.c03 + 1.2);
    const lean = win(t, T.c03 - 0.5, T.c03 - 0.1, T.c03e, T.c03e + 0.5);
    return [{ id: 'auto', X: AUTO.x, Z: AUTO.z, draw: (gg, cc) => auto(gg, cc, t, { lean, pat, thumb, talk: talk(t, ['c03'], 0.42) }) }];
  }
  // the east gate: people drift there, then gather when the whistle goes; a policeman jogs in
  const EG_CROWD = (() => { const r = mulberry32(5141), out = []; for (let i = 0; i < 12; i++) out.push({ P: CROWD[i % CROWD.length], x: 13.0 + r() * 2.4, z: 0.5 + r() * 3.6, a: -PI / 2 + (r() - 0.5) * 1.4, ph: r() * 6 }); return out; })();
  function eastGate(t) {
    const out = [], gather = sstep(T.police - 0.4, T.police + 1.6, t);
    for (const p of EG_CROWD) {
      const x = lerp(p.x - 2.6, p.x, gather), walking = gather > 0 && gather < 1 ? 1 : 0;
      out.push({ P: p.P, X: x, Z: p.z, a: walking ? PI / 2 : PI / 2 + 0.4 * Math.sin(p.ph), o: { walk: walking, phase: t * 5 + p.ph, headYaw: 0.3 * Math.sin(t + p.ph), breath: 6 * Math.sin(t * 1.6 + p.ph) } });
    }
    const cop = clamp((t - T.police) / 2.2);
    if (t > T.police - 0.2) out.push({ P: R.COP, X: lerp(17.4, 14.6, cop), Z: 2.2, a: -PI / 2, o: { walk: cop < 1 ? 1 : 0, run: cop < 1 ? 0.6 : 0, phase: t * 8, arms: { r: { a1: 2.4, a2: 0.4, hand: 'fist', w: win(t, T.police, T.police + 0.2, T.police + 0.9, T.police + 1.2) } } } });
    return out;
  }

  // ================================================================ shot 5: the whip back west, and frame 0 again, slowed
  let SMEAR = null;
  function smear(g, n, dx) {                         // a whip pan's blur: the frame laid over itself, shifted
    if (!SMEAR) { SMEAR = document.createElement('canvas'); SMEAR.width = W; SMEAR.height = H; }
    const s = SMEAR.getContext('2d'); s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, W, H); s.drawImage(g.canvas, 0, 0);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); for (let i = 1; i <= n; i++) { g.globalAlpha = 0.5 / i; g.drawImage(SMEAR, dx * i / n, 0); g.drawImage(SMEAR, -dx * i / n, 0); } g.restore();
  }
  function shotReplay(g, t) {
    const w = clamp((t - T.s5) / 0.36), whip = w < 1;
    let tau, c;
    if (whip) {                                      // from the east gate to frame 0's view in a third of a second
      const yaw = lerp(86, -64, mj(w)), f = lerp(1960, 1300, mj(w));
      c = WD.cam({ x: WD.YOU.x, z: WD.YOU.z, eye: 1.6, yaw, f, hz: 1060 }); tau = 0;
      WD.lane(g, c, { tw: t, people: lanePeople(0, { noStudent: true, noAuto: true }) });
      smear(g, 4, 140 * Math.sin(w * PI));
      return;
    }
    tau = clamp((t - T.s5 - 0.42) * 0.42, 0, 1.75);                         // the replay: frame 0's lift at less than half speed
    const z = sstep(T.s5 + 0.4, T.wallet2 - 0.2, t);
    c = WD.cam({ x: WD.YOU.x, z: WD.YOU.z, eye: 1.6, yaw: lerp(-64, -70.5, z), f: lerp(1300, 2300, z), hz: lerp(1060, 860, z) });
    WD.lane(g, c, { tw: t, people: lanePeople(tau, { noStudent: false, noAuto: true, noEast: true }) });
    barberClose(g, c, tau);
    grade(g, { warm: 0.22 });
    vignette(g, 0.7);
    // the ring round the lift: his hand and the red wallet, as "wallet" is said
    const wp = walletAt(tau), hp = c.P(...wp);
    if (hp) ring(g, hp[0], hp[1], 130, clamp((t - T.wallet2 + 0.15) / 0.45), 12);
    replayMark(g, t, '0:01');
  }
  function replayMark(g, t, s) {                     // a small timecode, top left inside the safe area: this is the first second, again
    g.save(); g.globalAlpha = 0.9; R36R(g, 90, 300, 150, 62, 12); g.fillStyle = 'rgba(20,14,10,0.6)'; g.fill();
    g.fillStyle = '#e2301a'; ell(g, 122, 331, 11, 11); g.fill();
    txt(g, s, 196, 350, 44, '#fff6e2', { align: 'center', kind: 'semi' }); g.restore();
  }

  // ================================================================ shot 6: the rewind past the start, to the whisper in the barber's chair
  function shotRewind(g, t) {
    const u = clamp((t - T.s6) / (T.s6b - T.s6)), tau = lerp(1.75, -3.2, mj(u));
    const c = WD.cam({ x: WD.YOU.x, z: WD.YOU.z, eye: 1.6, yaw: lerp(-70.5, -56, mj(u)), f: lerp(2300, 1400, mj(u)), hz: lerp(860, 1000, mj(u)) });
    WD.lane(g, c, { tw: t, people: lanePeople(tau, { noAuto: true, noEast: true }) });
    grade(g, { cool: 0.45, dim: 0.12 });
    const r = mulberry32(Math.floor(t * 30));                                // tracking lines
    g.save(); for (let i = 0; i < 5; i++) { const y = r() * H; g.fillStyle = `rgba(255,255,255,${0.08 + r() * 0.12})`; g.fillRect(0, y, W, 6 + r() * 18); } g.restore();
    g.save(); g.fillStyle = 'rgba(255,255,255,0.92)'; for (const dx of [0, 60]) { g.beginPath(); g.moveTo(150 + dx, 300); g.lineTo(150 + dx, 380); g.lineTo(96 + dx, 340); g.closePath(); g.fill(); } g.restore();   // ◀◀
  }
  // the whisper: a close-up. He's in the red chair under a white cape, fresh-shaven, his cap on, in profile (his left cheek, the mole); the
  // barber bends to him with the razor still in his hand, and he says it into his ear. A warm, older grade: before the video began.
  let BG6 = null;
  function shotWhisper(g, t) {
    if (!BG6) {                                       // the barber's corner behind them, out of focus (built once)
      BG6 = document.createElement('canvas'); BG6.width = W; BG6.height = H; const b = BG6.getContext('2d');
      const c = WD.cam({ x: CHAIR.x + 1.2, z: CHAIR.z - 2.6, eye: 1.3, yaw: -18, f: 1500, hz: 1150 });
      WD.lane(b, c, { tw: 0 }); b.filter = 'blur(10px)'; b.drawImage(BG6, 0, 0); b.filter = 'none';
    }
    g.drawImage(BG6, 0, 0);
    const k = clamp((t - T.s6b) / 0.4), L = life(5.2, t);
    const lean = sstep(T.s6b - 0.1, T.warning - 0.25, t);                   // he leans up towards the barber's ear
    const say = win(t, T.warning - 0.2, T.warning, T.his + 0.2, T.his + 0.45);
    // the chair's back, behind him at the right
    g.save(); g.fillStyle = '#9a1c26'; R36R(g, 720, 760, 300, 900, 70); g.fill(); g.fillStyle = '#c8303a'; R36R(g, 740, 780, 260, 120, 50); g.fill(); g.restore();
    // the barber, bending in from the left: three-quarter towards us, his head tilted so his ear is at the thief's lips; the razor up
    R.figure(g, BARBER, 300, 900 + 30 * (1 - k), 0.74, { yaw: 0.3, headYaw: 0.45, tilt: 0.2 + 0.03 * L.tilt, lean: 0.12, close: blink(t, 2.6), look: [-10, 6], browUp: 0.7 * say, op: 0.1 * say, breath: 6 * L.breath,
      arms: { r: arm(1, 220, 330, 40, 'out', 'grip', 1), l: arm(-1, -240, 880, 0, 'down', 'relax', 1) } });
    const rz = [168, 1560];
    g.save(); g.translate(rz[0], rz[1]); g.rotate(-2.6); g.fillStyle = '#e8eaee'; R36R(g, -9, -100, 22, 100, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-7, -96, 6, 90); g.fillStyle = '#5a3a22'; R36R(g, -11, 0, 26, 84, 10); g.fill(); g.restore();
    // his body under the white cape
    g.save(); g.translate(720, 1240);
    g.fillStyle = lg(g, -300, -200, 300, 700, [0, '#ffffff'], [1, '#d9d4ca']); g.beginPath(); g.moveTo(-170, -130); g.quadraticCurveTo(10, -200, 190, -120); g.bezierCurveTo(300, 80, 330, 420, 340, 760); g.lineTo(-380, 760); g.bezierCurveTo(-360, 420, -300, 80, -170, -130); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(140,130,120,0.35)'; g.lineWidth = 6; for (const x of [-170, -40, 100, 220]) { g.beginPath(); g.moveTo(x * 0.4, -90); g.quadraticCurveTo(x, 300, x * 1.2, 760); g.stroke(); }
    g.restore();
    // his head, in profile, facing left (his left cheek, the mole, to us), tilting up to the barber as he leans
    const hx = 770 - 30 * lean, hy = 960 - 30 * lean;
    g.save(); g.translate(hx, hy); g.rotate(-0.14 * lean + 0.02 * L.tilt); g.scale(0.8, 0.8);
    headProfile(g, MEN.thief, { smile: 0.25 + 0.35 * say, close: blink(t, 6.1) * 0.9, lookY: -0.5 * lean, look: -0.5, browUp: 0.15 * say });
    g.restore();
    // a fleck of shaving foam left under his jaw, behind the mole
    g.save(); g.fillStyle = 'rgba(255,255,255,0.92)'; for (const [x, y, r] of [[hx + 30, hy + 175, 20], [hx + 56, hy + 168, 15], [hx + 6, hy + 186, 13]]) { ell(g, x, y, r, r * 0.8); g.fill(); } g.restore();
    // the warning leaving his lips for the barber's ear: the first of the thread
    const mouth = [hx - 0.8 * 172, hy + 0.8 * 118], earB = [568, 935];
    thread(g, [mouth, [lerp(mouth[0], earB[0], 0.5) - 14, lerp(mouth[1], earB[1], 0.5)], earB], clamp((t - T.warning + 0.05) / 0.45), 7);
    grade(g, { warm: 0.3 });
    vignette(g, 0.8);
    replayMark(g, t, '\u22120:20');
  }

  // ================================================================ shot 7: the thread, from above: one man, through three mouths, to your ear
  // a high camera over the south rooftops, looking across the lane: the barber's chair (him, whispering; the barber), the student, the
  // auto (the driver), and you at the stall. The world dims; they stay bright. Then the three EAST GATE bubbles slide back to his mouth.
  function diagramCam() { return WD.cam({ x: -0.3, z: -5.0, eye: 6.8, yaw: -5, f: 740, hz: 170 }); }
  const DG = {
    thief: { x: CHAIR.x, z: CHAIR.z - 0.1 }, barber: { x: CHAIR.x + 0.75, z: CHAIR.z - 0.5 }, student: { x: -0.6, z: 3.8 },
    driver: { x: 3.2, z: 3.6 }, you: { x: WD.YOU.x, z: WD.YOU.z },
  };
  function diagramPeople(t) {
    const c = diagramCam(), at3 = (p, y) => c.P(p.x, y, p.z);
    return {
      c,
      draw(g) {
        const ppl = [
          { P: THIEF, ...DG.thief, a: facing(DG.thief.x, DG.thief.z, DG.barber.x, DG.barber.z), o: { smile: 0.4 }, Y: -0.45 },
          { P: BARBER, ...DG.barber, a: facing(DG.barber.x, DG.barber.z, DG.thief.x, DG.thief.z), o: { lean: 0.12 } },
          { P: STUDENT, ...DG.student, a: facing(DG.student.x, DG.student.z, DG.you.x, DG.you.z), o: {} },
          { P: VICTIM, x: DG.you.x, z: DG.you.z, a: facing(DG.you.x, DG.you.z, DG.barber.x, DG.barber.z), o: {}, you: true },
        ].sort((a, b) => Math.hypot(b.x - c.X0, b.z - c.Z0) - Math.hypot(a.x - c.X0, a.z - c.Z0));
        for (const p of ppl) { if (p.you) youFigure(g, c, p); else person(g, c, p.P, p.x, p.z, p.a, p.o, p.Y || 0); }
        autoAt(g, c, t, DG.driver.x, DG.driver.z);
      },
      mouth: (who) => { const p = DG[who], h = who === 'thief' ? 1.15 : who === 'driver' ? 1.2 : 1.5; return at3(p, h); },
      ear: (who) => { const p = DG[who], h = who === 'driver' ? 1.32 : 1.64; return at3(p, h); },
    };
  }
  function youFigure(g, c, p) {                       // you, from above and behind: a figure in a plain shirt, with a chai glass
    person(g, c, { L: { ...SK('#b9845c', '#90603c', '#d2a07a'), hair: '#1a130e', style: 'short', jaw: 0.96, ew: 44, eh: 23, brow: 13, browTilt: 2 }, D: { a: '#4f7fe0', b: '#2f58b0', sleeve: 'short', leg: '#8a744a', shoe: '#2a1d14' } }, p.x, p.z, p.a, { arms: { l: arm(-1, -150, 800, 0, 'in', 'flat', 1) } });
  }
  function shotThread(g, t) {
    const dp = diagramPeople(t), c = dp.c;
    WD.lane(g, c, { tw: t, people: (gg, cc, pass) => { if (pass === 'lane') { fruitCart(gg, cc); WD.barberChair(gg, cc); } } });
    g.fillStyle = 'rgba(28,18,30,0.3)'; g.fillRect(0, 0, W, H);                                 // the world dims; they don't
    dp.draw(g);
    const P = (p) => (p ? [p[0], p[1]] : [540, 960]);
    const path = [P(dp.mouth('thief')), P(dp.ear('barber')), P(dp.mouth('barber')), P(dp.ear('student')), P(dp.mouth('student')), P(dp.ear('driver')), P(dp.mouth('driver')), P(dp.ear('you'))];
    const k = clamp((t - T.s7 - 0.1) / (T.one - T.s7 - 0.35));
    thread(g, path, k, 22);
    // the three bubbles: each appears as the thread reaches its teller, then all three slide back along it to his mouth and become one
    const merge = sstep(T.one - 0.15, T.times3 + 0.05, t), m = P(dp.mouth('thief'));
    const tell = [['barber', 2 / 7], ['student', 4 / 7], ['driver', 6 / 7]];
    for (const [who, share] of tell) {
      const q = P(dp.mouth(who)), x = lerp(q[0] + 20, m[0] + 40, merge), y = lerp(q[1] - 170, m[1] - 190, merge);
      const shown = clamp((k - share) / 0.06);
      if (shown > 0 && merge < 0.98) bubbleAt(g, x, y, lerp(q[0], m[0], merge), lerp(q[1], m[1], merge), 'EAST GATE', 0.62 * (0.7 + 0.3 * shown), shown);
    }
    if (merge > 0.9) bubbleAt(g, m[0] + 40, m[1] - 190, m[0], m[1], 'EAST GATE', 0.8 + 0.08 * Math.sin(clamp((t - T.times3) / 0.5) * PI), clamp((merge - 0.9) / 0.1));
    // names, small, so the diagram reads at once
    const tag = (who, s) => { const q = P(dp.ear(who)); txt(g, s, q[0], q[1] + (who === 'you' ? 150 : 95), 50, '#fff6e2', { align: 'center', kind: 'semi', stroke: '#14100a', sw: 0.2 }); };
    g.save(); g.globalAlpha = clamp((t - T.s7) / 0.3) * (1 - merge * 0.6); tag('barber', 'BARBER'); tag('student', 'STUDENT'); tag('driver', 'DRIVER'); tag('you', 'YOU'); g.restore();
  }

  // ================================================================ shot 8: "They sounded like three witnesses": the three of them, pointing east,
  // sure of it; behind them, far off under the west gate, the man in the maroon cap, whom none of them has seen
  let BG8 = null;
  function shotWitnesses(g, t) {
    if (!BG8) {
      BG8 = document.createElement('canvas'); BG8.width = W; BG8.height = H; const b = BG8.getContext('2d');
      const c = WD.cam({ x: 2.2, z: 1.6, eye: 1.7, yaw: -86, f: 1500, hz: 1060 });
      WD.lane(b, c, { tw: 0, people: (gg, cc, pass) => { if (pass === 'lane') { for (const p of crowdAt(0, GATE_CROWD)) person(gg, cc, p.P, p.X, p.Z, p.a, p.o); } } });
      b.filter = 'blur(5px)'; b.drawImage(BG8, 0, 0); b.filter = 'none';
    }
    g.drawImage(BG8, 0, 0);
    // the thief, sharp, small, at the gate: he touches his brim (the one moment he's shown it)
    const c = WD.cam({ x: 2.2, z: 1.6, eye: 1.7, yaw: -86, f: 1500, hz: 1060 });
    const tip = win(t, T.seen - 0.3, T.seen - 0.05, T.seen + 0.6, T.seen + 0.9);
    person(g, c, THIEF, -8.2, 1.12, facing(-8.2, 1.12, 2.2, 1.6), { smile: 0.45, arms: { r: arm(1, 140, -170, 30, 'out', 'flat', tip) } });
    g.fillStyle = 'rgba(30,20,28,0.18)'; g.fillRect(0, 0, W, H);
    // the three, close, in a row, each pointing to the right of the frame (east), each with their words
    const enter = (i) => mj((t - T.s8 - 0.08 * i) / 0.4), L = (i) => life(3 + i, t);
    const row = [[BARBER, 190, 1.0, 0.0], [STUDENT, 490, 0.95, 0.12], [DRIVER, 790, 1.0, 0.24]];
    row.forEach(([P, x, s, dl], i) => {
      const e = enter(i), sure = 0.5 + 0.5 * win(t, T.witn - 0.2 + dl, T.witn + dl, 99, 100);
      R.figure(g, P, x, 1330 + 60 * (1 - e), 0.52 * s, { yaw: 0.25, headYaw: 0.35, close: blink(t, 2 + i), look: [16, -2], smile: 0.1, browUp: 0.25 * sure, breath: 6 * L(i).breath, tilt: 0.03 * L(i).tilt,
        arms: { r: arm(1, 330, 330, 80, 'out', 'point', e), l: { a1: 0.12, a2: 0.2, hand: 'relax', w: 1 } } });
      bubble(g, x + 30, 1060, x + 30, 1190, 'EAST GATE', t, T.s8 + 0.15 + 0.12 * i, 99, 0.6);
    });
  }

  // ================================================================ shot 9: his view. The four pats, ringed: the barber's breast pocket, the
  // student's bag, the driver's pouch, and your pocket. He watches from the left, in profile.
  function shotPats(g, t) {
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#3a1720'], [1, '#22101a']); g.fillRect(0, 0, W, H);
    const show = (i) => (i < 3 ? sstep(T.every + 0.28 * i - 0.1, T.every + 0.28 * i + 0.15, t) : sstep(T.yours - 0.12, T.yours + 0.12, t));
    const cells = [[100, 690], [520, 690], [100, 1100], [520, 1100]], cw = 400, ch = 380;
    const L = life(9, t), last = show(3);
    // him, at the top right, in profile facing left: his eyes go down to the panels, and on "yours too" to the last one
    g.save(); g.translate(780, 520); g.rotate(0.02 * L.tilt + 0.05 * last); g.scale(0.62, 0.62);
    headProfile(g, MEN.thief, { smile: 0.2 + 0.3 * last, close: blink(t, 7.7) * 0.8, look: -0.6 - 0.3 * last, lookY: 0.6 + 0.4 * last, browUp: 0.3 * last });
    g.restore();
    cells.forEach(([x, y], i) => {
      const k = show(i); if (k <= 0) return;
      g.save(); g.globalAlpha = k; g.translate(x, y + 30 * (1 - k));
      R36R(g, 0, 0, cw, ch, 22); g.fillStyle = ['#f7dcc4', '#f6d0de', '#dfe4ea', '#e9dfc9'][i]; g.fill();
      g.save(); R36R(g, 0, 0, cw, ch, 22); g.clip();
      if (i < 3) {
        const P = [BARBER, STUDENT, DRIVER][i], sc = 0.36, hy = 150;
        const pose = i === 0 ? { l: arm(-1, -120, 520, 30, 'in', 'flat', 1) } : i === 1 ? { l: arm(-1, -230, 860, 0, 'in', 'grip', 1) } : { l: arm(-1, -150, 800, 0, 'in', 'flat', 1) };
        R.figure(g, P, cw / 2, hy, sc, { arms: pose, headYaw: 0.2, close: blink(t, 3 + i), op: 0.12 });
        if (i === 1) slingBag(g, { x: cw / 2, y: hy + 1594 * sc, s: sc }, -1, 0);
        const pk = i === 0 ? [cw / 2 - 40, hy + sc * 520] : i === 1 ? [cw / 2 - 85, hy + sc * 890] : [cw / 2 - 52, hy + sc * 800];
        ring(g, pk[0], pk[1], 70, clamp((t - (T.every + 0.28 * i)) / 0.35), 10);
      } else {
        g.save(); g.translate(60, -760); g.scale(0.6, 0.6); myPat(g, 1, 0.25, { dy: 0 }); g.restore();
        ring(g, 158, 172, 96, clamp((t - T.yours) / 0.35), 11);
      }
      g.restore();
      g.strokeStyle = i === 3 ? '#ffd34a' : 'rgba(255,240,220,0.5)'; g.lineWidth = i === 3 ? 7 : 4; R36R(g, 0, 0, cw, ch, 22); g.stroke();
      R36R(g, 18, ch - 78, 170, 60, 14); g.fillStyle = 'rgba(20,12,16,0.72)'; g.fill();
      txt(g, ['BARBER', 'STUDENT', 'DRIVER', 'YOU'][i], 103, ch - 32, 42, i === 3 ? '#ffd34a' : '#fff6e2', { align: 'center', kind: 'semi' });
      g.restore();
    });
  }

  // ================================================================ shot 10: the east gate. The police and the crowd close on a young man running
  // for the bus with his tiffin; a hand on his collar, the tiffin spills, the bus goes
  function shotEast(g, t) {
    const c = WD.cam({ x: 9.3, z: 1.5, eye: 1.55, yaw: 88 + 0.6 * Math.sin(t * 0.7), f: 1150, hz: 1100 });
    const grab = T.grab + 0.05, held = t > grab;
    const run = clamp((t - T.s10) / (grab - T.s10));
    const rx = held ? lerp(13.2, 12.9, clamp((t - grab) / 0.3)) : lerp(10.6, 13.2, run), rz = 1.35;
    const busX = 21.5 + 3.6 * sstep(T.grab + 0.25, T.running + 0.8, t);
    const extra = [];
    // the bus, beyond the arch: its back, pulling away
    extra.push({ id: 'bus', X: busX, Z: 2.3, draw: (gg, cc) => bus(gg, cc, busX) });
    // the runner: running east (his back to us), then, held, he turns to face us, arms out: it's only his lunch
    const turn = sstep(grab + 0.15, grab + 0.55, t);
    extra.push({ P: RUNNER, X: rx, Z: rz, a: turn > 0.5 ? facing(rx, rz, c.X0, c.Z0) : PI / 2, o: { walk: held ? 0 : 1, run: held ? 0 : 0.85, phase: t * 9, op: held ? 0.35 * win(t, grab + 0.4, grab + 0.6, 99, 100) : 0, browUp: held ? 0.9 : 0, worry: held ? 1 : 0,
      arms: held ? { l: arm(-1, -420, 300, 80, 'out', 'open', turn), r: arm(1, 420, 300, 80, 'out', 'open', turn) } : { r: arm(1, 200, 700, 0, 'down', 'grip', 1) } }, id: 'runner' });
    // the two policemen: one from the right, grabbing his collar; one behind him
    const c1 = clamp((t - T.s10 - 0.3) / (grab - T.s10 - 0.3));
    extra.push({ P: R.COP, X: lerp(14.6, rx + 0.55, c1), Z: lerp(3.6, rz + 0.45, c1), a: facing(14.6, 3.6, rx, rz), o: { walk: c1 < 1 ? 1 : 0, run: c1 < 1 ? 0.7 : 0, phase: t * 9, arms: { r: arm(1, -380, 180, 120, 'out', 'grip', held ? 1 : 0.3) }, frown: 0.6 } });
    extra.push({ P: COP2, X: lerp(15.8, rx + 0.9, c1), Z: lerp(1.0, rz - 0.4, c1), a: facing(15.8, 1.0, rx, rz), o: { walk: c1 < 1 ? 1 : 0, run: c1 < 1 ? 0.6 : 0, phase: t * 8.4, frown: 0.5 } });
    // the crowd, pointing at him
    for (const p of EG_CROWD.slice(0, 8)) {
      const x = p.x - 0.8, a = facing(x, p.z, rx, rz), pt = sstep(grab + 0.1, grab + 0.4, t);
      extra.push({ P: p.P, X: x, Z: p.z, a, o: { arms: { r: arm(1, 480, 120, 120, 'out', 'point', pt * (p.ph > 3 ? 1 : 0)) }, breath: 6 * Math.sin(t * 1.6 + p.ph) } });
    }
    WD.lane(g, c, { tw: t, people: lanePeople(t, { noThief: true, noVictim: true, noStudent: true, noAuto: true, noEast: true, noCrowd: true, extra, after: (gg, cc, p, v) => { if (p.id === 'runner' && v) tiffin(gg, cc, t, rx, rz, grab); } }) });
  }
  function tiffin(g, c, t, rx, rz, grab) {          // a steel tiffin carrier: in his hand while he runs, then three tiers rolling apart
    const fall = clamp((t - grab) / 0.6);
    for (let i = 0; i < 3; i++) {
      const x = rx - 0.2 + (fall > 0 ? fall * (0.4 + 0.5 * i) * (i % 2 ? 1 : -0.6) : 0), y = fall > 0 ? Math.max(0.12, 0.65 - fall * 0.9 + 0.1 * Math.sin(fall * PI) - i * 0.0) : 0.65 - i * 0.14;
      const p = c.P(x, y, rz - 0.25 + 0.2 * i * fall); if (!p) continue; const s = p[2] / 1000;
      g.save(); g.translate(p[0], p[1]); g.rotate(fall * (1.5 + i)); g.fillStyle = '#c9ced6'; R36R(g, -90, -60, 180, 120, 30); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; R36R(g, -70, -50, 40, 100, 14); g.fill(); g.strokeStyle = '#8f949b'; g.lineWidth = 8; g.strokeRect(-90, -8, 180, 4); g.restore();
    }
  }
  function bus(g, c, X) {                             // the back of a red-and-cream bus beyond the east gate
    const P2 = WD.poly, z0 = 1.0, z1 = 3.6, h = 3.1;
    P2(g, c, [[X, 0.35, z0], [X, 0.35, z1], [X, h, z1], [X, h, z0]], '#c23a30');
    P2(g, c, [[X - 0.01, 1.6, z0 + 0.15], [X - 0.01, 1.6, z1 - 0.15], [X - 0.01, 2.6, z1 - 0.15], [X - 0.01, 2.6, z0 + 0.15]], '#3a4652');
    P2(g, c, [[X - 0.01, 1.0, z0], [X - 0.01, 1.0, z1], [X - 0.01, 1.3, z1], [X - 0.01, 1.3, z0]], '#f4ead2');
    for (const z of [z0 + 0.3, z1 - 0.3]) { const p = c.P(X - 0.02, 0.8, z); if (p) { const s = p[2] / 1000; g.fillStyle = '#ffb02a'; ell(g, p[0], p[1], 70 * s, 50 * s); g.fill(); } }
  }

  // ================================================================ shot 11: the lifts. Looking west down the lane from near the east gate: the
  // three of them face us, craning past us at the commotion; he walks up through them from the west, a hand into each pocket, and back
  const S11 = { cam: { x: 9.4, z: 1.7, eye: 1.7, yaw: -91, f: 1250, hz: 1120 }, barber: [3.3, 2.81], student: [4.76, 0.46], driver: [6.0, 1.53],
    at: [[-1.1, 1.68], [3.44, 2.36], [4.86, 0.97], [5.83, 1.21]] };
  function shotLifts(g, t) {
    const c = WD.cam(S11.cam);
    const lt = [T.n08 + 0.85, T.n08 + 1.55, T.n08 + 2.25];                  // each lift
    const path = S11.at;
    let x, z, a, walking = 1;
    const seg = (i, t0, t1) => { const [px, pz, u] = walkPos(t, t0, t1, path[i], path[i + 1]); x = px; z = pz; a = facing(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]); walking = u < 1 ? 1 : 0; };
    if (t < lt[0] - 0.15) seg(0, T.s11, lt[0] - 0.15);
    else if (t < lt[1] - 0.15) seg(1, lt[0] + 0.15, lt[1] - 0.15);
    else if (t < lt[2] - 0.15) seg(2, lt[1] + 0.15, lt[2] - 0.15);
    else { const back = clamp((t - lt[2] - 0.35) / 1.6); [x, z] = [lerp(path[3][0], 1.6, back), lerp(path[3][1], -0.6, back)]; a = back > 0 ? facing(path[3][0], path[3][1], 1.6, -0.6) : facing(path[3][0], path[3][1], 0, 1.5); walking = back > 0 && back < 1 ? 1 : 0; }
    // which pocket now: his near hand darts in and out
    let dart = 0, which = -1; for (let i = 0; i < 3; i++) { const d = win(t, lt[i] - 0.18, lt[i] - 0.02, lt[i] + 0.12, lt[i] + 0.28); if (d > dart) { dart = d; which = i; } }
    const extra = [];
    const crane = (i) => ({ headYaw: 0.25 * Math.sin(t * 0.8 + i), look: [10 * Math.sin(t + i), -8], lean: 0.05, browUp: 0.4, breath: 6 * Math.sin(t * 1.7 + i) });
    extra.push({ P: BARBER, X: S11.barber[0], Z: S11.barber[1], a: facing(S11.barber[0], S11.barber[1], c.X0 + 3, c.Z0), o: crane(0), id: 'barber' });
    extra.push({ P: STUDENT, X: S11.student[0], Z: S11.student[1], a: facing(S11.student[0], S11.student[1], c.X0 + 3, c.Z0), o: crane(1), id: 'student' });
    extra.push({ P: DRIVER, X: S11.driver[0], Z: S11.driver[1], a: facing(S11.driver[0], S11.driver[1], c.X0 + 3, c.Z0), o: crane(2), id: 'driver' });
    const POCKET = [[S11.barber[0] + 0.14, 1.22, S11.barber[1] - 0.2], [S11.student[0] + 0.12, 0.98, S11.student[1] + 0.26], [S11.driver[0] + 0.12, 0.95, S11.driver[1] - 0.22]];
    let ar = null;
    if (which >= 0) { const hl = headLocal(c, x, z, a, ...POCKET[which]); if (hl) { const side = hl[0] < 0 ? -1 : 1; ar = { [side < 0 ? 'l' : 'r']: arm(side, hl[0], hl[1], 60, 'down', 'grip', dart) }; } }
    extra.push({ P: THIEF, X: x, Z: z, a, o: { walk: walking, phase: t * 5.6, smile: 0.35, arms: ar || {} }, id: 'thief' });
    WD.lane(g, c, { tw: t, people: lanePeople(t, { noThief: true, noVictim: true, noStudent: true, noAuto: true, noEast: true, extra, after: (gg, cc, p, v) => {
      if (!v) return;
      if (p.id === 'student') slingBag(gg, v, 1, 0);
      // a quick maroon ring on each pocket as his hand comes out of it (the pocket they patted: shot 9's rings)
      const i = ['barber', 'student', 'driver'].indexOf(p.id); if (i < 0) return;
      const pk = [[-60, 520], [230, 900], [-150, 800]][i], s = v.s, hx = v.x, hy = v.y - 1594 * s;
      ring(gg, hx + pk[0] * s * (v.front ? 1 : -1), hy + pk[1] * s, 280 * s, clamp((t - lt[i] + 0.05) / 0.3) * (1 - sstep(lt[i] + 0.6, lt[i] + 0.9, t)), 8);
    } }) });
  }

  // ================================================================ shot 12: your stall. He comes past you to the chaiwala, whispers, walks back
  // to the west gate; she turns and leans in to you, the barber's pose from frame 0: "You there, keep a hand on your wallet." Your hand starts
  // for your pocket and stops halfway, and at the gate he has turned round: he's watching it.
  const S12 = { you: [0.75, -1.1], chai: [-0.9, -2.05], lean: [-0.75, -1.75], gate: [-3.54, -0.85] };
  function shotStall(g, t) {
    const L = life(1.7, t), c = WD.cam({ x: S12.you[0], z: S12.you[1], eye: 1.6, yaw: -96 + 0.3 * L.look, f: 980, hz: 1150 + 3 * L.breath });
    const s0 = T.s12, whisper = [s0 + 0.55, s0 + 1.35], leave = whisper[1] + 0.1;
    // the thief: in from the right, to her, the whisper, then off west down the lane, and at the end he turns to watch
    let x, z, a, walking = 1, o = { smile: 0.35 };
    const A = [2.6, 1.0], B = [-0.55, -1.25];
    if (t < whisper[0]) { [x, z] = walkPos(t, s0 - 0.2, whisper[0], A, B); a = facing(A[0], A[1], B[0], B[1]); }
    else if (t < leave) { [x, z] = B; a = facing(B[0], B[1], S12.lean[0] - 0.2, S12.lean[1] - 0.3); walking = 0; o = { smile: 0.5, lean: 0.12, headYaw: -0.3 }; }
    else { const u = clamp((t - leave) / (T.c04e - leave)); [x, z] = [lerp(B[0], S12.gate[0], u), lerp(B[1], S12.gate[1], u)]; a = u < 1 ? facing(B[0], B[1], S12.gate[0], S12.gate[1]) : facing(S12.gate[0], S12.gate[1], c.X0, c.Z0); walking = u < 1 ? 1 : 0; o = { smile: 0.45, look: [0, 0] }; }
    const turnBack = sstep(T.c04e + 0.05, T.c04e + 0.4, t);
    if (turnBack > 0) { a = facing(S12.gate[0], S12.gate[1], c.X0, c.Z0); walking = 0; o = { smile: 0.5, browUp: 0.3 * turnBack }; }
    // the chaiwala: at her counter; she bends to listen, then turns to you and leans over the counter
    const toYou = sstep(leave - 0.1, T.c04 - 0.1, t), listen = win(t, whisper[0] - 0.1, whisper[0] + 0.1, whisper[1], whisper[1] + 0.25);
    const cx = lerp(S12.chai[0], S12.lean[0], toYou), cz = lerp(S12.chai[1], S12.lean[1], toYou);
    const extra = [
      { P: THIEF, X: x, Z: z, a, o: { walk: walking, phase: t * 5.6, ...o }, id: 'thief' },
      { P: CHAI, X: cx, Z: cz, a: toYou > 0.5 ? facing(cx, cz, c.X0, c.Z0) : facing(cx, cz, B[0], B[1]), o: { lean: -0.2 * toYou + 0.1 * listen, op: talk(t, ['c04'], 0.4), close: blink(t, 5.5), browUp: 0.4 * listen, headYaw: -0.25 * listen, look: [6 * toYou, 0], breath: 6 * L.breath,
        arms: { r: arm(1, 300, 980, 0, 'down', 'flat', toYou), l: arm(-1, -300, 980, 0, 'down', 'flat', toYou) } }, id: 'chai' },
    ];
    WD.lane(g, c, { tw: t, people: lanePeople(t, { noThief: true, noVictim: true, noStudent: true, noAuto: true, noEast: true, extra }) });
    // your hand: up from the bottom towards your pocket, and it stops short
    const rise = sstep(T.wallet4 - 0.1, T.wallet4 + 0.35, t), stop = sstep(T.wallet4 + 0.35, T.wallet4 + 0.5, t);
    if (rise > 0) myPat(g, 1, 0, { handOnly: true, hx: 760 - 30 * rise, hy: H + 140 - 440 * rise + 24 * stop, a: -1.95, s: 260, pose: stop > 0.5 ? 'rest' : 'flat' });
  }

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g; times();
      for (const k in HEADS) delete HEADS[k];
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.clearRect(0, 0, W, H);
      g.save();
      if (t < T.s5) shotLane(g, t);
      else if (t < T.s6) shotReplay(g, t);
      else if (t < T.s6b) shotRewind(g, t);
      else if (t < T.s7) shotWhisper(g, t);
      else if (t < T.s8) shotThread(g, t);
      else if (t < T.s9) shotWitnesses(g, t);
      else if (t < T.s10) shotPats(g, t);
      else if (t < T.s11) shotEast(g, t);
      else if (t < T.s12) shotLifts(g, t);
      else shotStall(g, t);
      g.restore();
      // the words: the dare on frame 0; each warning's EAST GATE; the question
      g.save();
      if (t < T.s5) {
        title(g, [{ s: 'SPOT THE', size: 92 }, { s: 'PICKPOCKET', col: '#ffd34a', size: 128, dy: 14 }], 345, 92, t, -1, T.wallet + 0.1);
        speakerBubble(g, 'barber', t, T.east1 - 0.04, T.east1 + 1.25, -1, 1);
        speakerBubble(g, 'student', t, T.east2 - 0.04, T.east2 + 1.1, -1, 0.85);
        speakerBubble(g, 'driver', t, T.c03 - 0.04, T.c03 + 1.1, -1, 0.85);
        title(g, [{ s: "WHERE'S THE", size: 96 }, { s: 'PICKPOCKET?', col: '#ffd34a', size: 140, dy: 18 }], 360, 96, t, T.q - 0.05, T.n02 + 0.1);
      }
      g.restore();
    },
  });
  U.endcard();
  U.grain(0.06);
  C.start();
})();
