// Reel 50 · The Decent Thing. Tests desk. You know the man with the mole is a thief; a polite man in lilac bumps a woman at the
// bangle stall ("Sorry, sorry!"), drops her red wallet on a bench as a constable passes, and the man with the mole picks it up
// and runs, the way she went. "My wallet!" "Chor!" Who stole her wallet? He was running after her to give it back; while the
// lane holds him, the man who said sorry takes the loud man's phone. Script: docs/script.md (draft 3.1, approved 26 Nov).
// Facts: docs/research.md. The drawings: film/draw.js (reel 49's kit) and film/lane.js (this reel's people and places).
// Every action is keyed to a placed word (film/words.js): the voice sets the clock. Hands and arms are keyed 2D poses on arcs
// (minimum jerk, a settle on a fling), no rig (HQ's brief, after reel 45); an arm is never longer than its two segments.
// People are posed on twos; the camera moves on ones. Positions are in head units (u) from a person's head centre, times s.
// Copied from reel 49 (tag source/reel-49-the-con, film/film.js), by name: mj, settle, win, life, blink, talk, lookSeq.
// 30 fps. Every frame is a pure function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp, mulberry32 } = C;
  const K = window.KIT, U = window.UI, D = window.DRAW, LN = window.LANE;
  const { TAU, PI, sstep, txt, R, ell, lg, rg, mix, glass, steam } = D;
  const { P, WEAR, person, personBack, wallet, phone, bag, bangles, lathi, bench, card, head2, torso, legs, bobOf, limb, handS, glassHeld, HIP } = LN;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn'];

  // ------------------------------------------------------------------ motion helpers (reel 49, from reel 42)
  const mj = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const win = (t, a, b, c, d) => mj((t - a) / (b - a)) * (1 - mj((t - c) / (d - c)));
  const ramp = (t, a, b) => mj((t - a) / (b - a));
  function life(seed, t, k = 1) {
    const s = (hz, ph) => Math.sin(TAU * (hz * t + ph));
    const b = s(0.26, seed * 0.37), w1 = s(0.09, seed * 0.71);
    return { breath: b * k, tilt: 0.02 * w1 * k };
  }
  const on2 = (t) => Math.floor(t * 15 + 1e-6) / 15;
  function blink(t, seed) { const n = Math.floor(t / 3.4), r = mulberry32(n * 7 + Math.round(seed * 10)), t0 = n * 3.4 + 0.4 + r() * 2.4; return win(t, t0, t0 + 0.05, t0 + 0.1, t0 + 0.16); }
  function talk(t, ids, amp) {
    for (const p of ids) for (const w of WD(p)) if (t >= w.t0 && t <= w.t1) { const u = (t - w.t0) / Math.max(0.08, w.t1 - w.t0), syl = Math.max(1, Math.round((w.t1 - w.t0) / 0.18)); return amp * (0.35 + 0.65 * Math.abs(Math.sin(u * PI * syl))); }
    return 0;
  }
  const easeL = (t, seq) => { let i = 0; for (let j = 0; j < seq.length; j++) if (t >= seq[j][0]) i = j; const a = seq[Math.max(0, i - 1)], b = seq[i], u = mj((t - b[0]) / 0.2); return i === 0 ? b[1] : [lerp(a[1][0], b[1][0], u), lerp(a[1][1], b[1][1], u)]; };
  const lerp2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
  // a keyed path [[t, value], …] (a point or a number), eased between keys: hands travel, never jump
  function keyed(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const u = mj((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])), a = keys[i - 1][1], b = keys[i][1]; return Array.isArray(a) ? [lerp(a[0], b[0], u), lerp(a[1], b[1], u)] : lerp(a, b, u); }
    return keys[keys.length - 1][1];
  }
  const UP = (x, y, s, ux, uy) => [x + ux * s, y + uy * s];

  // ------------------------------------------------------------------ the clock: every action keyed to a placed word
  const WD = (p) => K.words(p);
  const at = (p, i = 0) => { const w = WD(p); return w.length ? w[Math.min(i, w.length - 1)].t0 : 0; };
  const en = (p) => { const w = WD(p); return w.length ? w[w.length - 1].t1 : 0; };
  const atW = (p, re, k = 0) => { const w = WD(p).filter((x) => re.test(x.w.toLowerCase())); return w.length ? w[Math.min(k, w.length - 1)].t0 : at(p); };
  let T = null;
  function times() {
    if (T) return T;
    T = {};
    T.toast = 0.7; T.eyesL = 1.3;                       // frame 0: he lifts his glass to you; his eyes slide to the lane
    T.cutB = en('v01') + 0.22;
    T.bump = at('c01') - 0.3;                           // the shoulder, then "Sorry, sorry!"
    T.lift = at('c01') + 0.05;                          // his hand at her bag's mouth, out with the wallet
    T.pocket1 = at('c01') + 0.55;                       // into his trouser pocket while the other hand apologises
    T.sheGo = en('c01') + 0.1;
    T.cutC = at('v02') + 0.12;
    T.drop = atW('v02', /somebody/) - 0.05;             // as the constable passes, a beat before "lose": no line names it
    T.cutD = en('v02') + 0.08;
    T.glassDown = T.cutD + 0.12; T.pick = T.cutD + 0.5; T.stand = T.cutD + 0.9; T.run = T.cutD + 1.2;
    T.cutE = at('c02') - 0.45;
    T.reach = T.cutE + 0.05;
    T.wallet = at('c02');                               // "My wallet!"
    T.turn = en('c02') - 0.1;
    T.arrive = en('c02') - 0.25;                        // he comes running in from the right
    T.chor = at('c03');
    T.cutE2 = en('c02') - 0.15;                          // E2: the loud man (number 1: he needs the screen time), over "wallet!"
    T.cutE3 = atW('c03', /chor/, 1) + 0.15;             // E3: the running man, during the second "Chor!"
    T.freeze = en('c03') + 0.1;
    T.cards = T.freeze + 0.25;
    T.ring = en('v03b');
    T.unfreeze = at('v04') - 0.02;
    T.grab = T.unfreeze;
    T.copBack = T.unfreeze + 1.5;
    T.lilIn = T.unfreeze + 1.0;
    T.cutH = at('v05') - 0.3;
    T.push = T.cutH;                                     // she pushes through to him
    T.give = en('v05') + 0.02;                           // the wallet in her hand: the flat in cues.py, at the end of v05
    T.phoneLift = at('v05b') + 0.5;                      // behind them, the man who said sorry takes the loud man's phone
    T.replay = en('v05b') + 0.3;
    T.rDrop = T.replay + 1.95; T.rEyes = T.replay + 3.55;
    T.now = en('v06') + 0.35;
    T.letGo = T.now + 0.15; T.copGo = T.now + 0.6; T.collar = T.now + 1.1;
    T.look = en('v07') - 0.1;                           // his eyes go right: the cut to the man in lilac follows the look
    T.cutJ2 = at('v07b') - 0.05; T.cutJ3 = atW('v07b', /way/) - 0.02;
    T.shrug = atW('v07b', /way/) + 0.15;
    T.heGo = en('v07b') - 0.3;
    T.pocket = en('v07b') + 0.12;
    T.reachPh = T.pocket + 0.3; T.empty = T.pocket + 0.95; T.pat = T.pocket + 1.6;
    T.stroll = en('v08') + 0.12;
    T.sorry2 = at('c04') - 0.25; T.brush = at('c04') - 0.14;   // the shoulder: the whoosh in cues.py
    T.last = en('c04') + 0.35;
    T.end = K.tb('end');
    return T;
  }

  // ------------------------------------------------------------------ the camera: zoom z around (cx, cy), or centre a world point (o.f)
  function cam(g, t, o = {}) {
    const z = o.z || 1, d = o.still ? 0 : 1;
    if (o.f) { g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-o.f[0], -o.f[1]); return; }
    const cx = o.cx ?? 540, cy = o.cy ?? 960;
    g.translate(cx, cy); g.scale(z, z); g.translate(-cx + 3 * Math.sin(t * 0.4) * d, -cy + 2 * Math.cos(t * 0.33) * d);
  }
  const grip = (g, x, y, a, s, skin, left) => D.hand(g, x, y, a, handS(s), 'fist', { left, skin });
  // a glass held in a fist: the glass first, the fist over its base (pose 'fist', the hand pointing up)
  const glassUnder = (k) => (gg, A) => { const h = handS(k), c = Math.cos(A.ang), sn = Math.sin(A.ang); glass(gg, A.w[0] + c * 0.3 * h, A.w[1] + sn * 0.3 * h - 0.25 * h, 0.5 * k / 0.62, 0.02); };

  // ================================================================ A · frame 0, and M · the last look: the chai stall
  function shotChai(g, t, T, last) {
    const tc = on2(t), L = life(7.1, tc, 1);
    g.save();
    cam(g, t, { z: last ? 1.02 + 0.02 * ramp(t, T.last, T.end) : 1 + 0.03 * clamp(t / 2), cx: 560, cy: 980 });
    g.drawImage(LN.chaiStall(), 0, 0);
    steam(g, 75, 650, t, 0.55);
    const s = 0.9, x = 560, y = 905 + 4 * L.breath;
    let look = [0, 3], turn = 0.05, toast = 0, sip = 0;
    if (!last) { toast = win(tc, T.toast, T.toast + 0.25, 1.55, 1.85); look = tc < T.eyesL ? [0, 3] : [-17, 4]; turn = tc < T.eyesL ? 0.05 : 0.05 - 0.17 * ramp(tc, T.eyesL, T.eyesL + 0.3); }
    else { const lt = tc - T.last; look = lt < 0.8 ? [-18, 2] : [0, 3]; turn = lt < 0.8 ? -0.15 : -0.15 + 0.2 * ramp(lt, 0.8, 1.1); sip = win(lt, 1.35, 1.65, 2.05, 2.35); }
    // the glass: at his chest, lifted to you on the toast, to his lips on the sip; held in his fingers, the elbow at his side
    const gsc = 0.5 * s / 0.62, G = lerp2(lerp2(UP(x, y, s, -105, 555), UP(x, y, s, -80, 420), toast), UP(x, y, s, -10, 175), sip);
    const gw = [G[0] - 118 * gsc, G[1] + 66 * gsc], gE = lerp2(lerp2(UP(x, y, s, -400, 860), UP(x, y, s, -390, 760), toast), UP(x, y, s, -330, 700), sip);
    person(g, { L: P.thief, wear: WEAR.thief, x, y, s, turn, tilt: L.tilt - 0.03 * toast,
      face: { smile: 0.42 + 0.22 * toast, look, close: Math.max(blink(tc, 4.1), 0.85 * sip), browUp: 0.3 * toast },
      arms: [{ w: gw, E: gE, pose: 'none', front: true, hold: (gg, A) => glassHeld(gg, A.w[0], A.w[1], gsc, P.thief.skin, -1, -0.04) },
             { w: UP(x, y, s, 330, 1250), pose: 'rest' }] });
    g.restore();
    if (!last && t < 1.75) {
      g.globalAlpha = 1 - sstep(1.55, 1.75, t);
      txt(g, 'YOU KNOW', 540, 384, 92, '#fff6e2', { align: 'center', stroke: '#14100a', sw: 0.16 });
      txt(g, "HE'S A THIEF", 540, 504, 134, '#ffd34a', { align: 'center', fit: 760, stroke: '#14100a', sw: 0.14 });   // outline inside x 950
      g.globalAlpha = 1;
    }
  }

  // ================================================================ B · the bump at the bangle stall
  const BW = { x: 360, y: 830, s: 0.6 };              // the woman
  const BAGP = UP(BW.x, BW.y, BW.s, 330, 700);         // her bag's mouth, at her waist on her left side, clear of her and the cart
  function himB(tc, T) {                               // the man who said sorry: in from the left, squeezing behind her, out right
    const k = [[T.cutB - 0.15, -160], [T.bump - 0.05, 380], [T.lift + 0.12, 640], [en('c01') - 0.1, 690], [en('c01') + 0.75, 1260]];
    let i = 0; while (i < k.length - 2 && tc > k[i + 1][0]) i++;
    const u = clamp((tc - k[i][0]) / (k[i + 1][0] - k[i][0]));
    return lerp(k[i][1], k[i + 1][1], i === 1 ? u : mj(u) * 0.3 + u * 0.7);
  }
  function shotBangle(g, t, T, o = {}) {   // o.noSeller: the replay's close-up leaves him out (his face would cross x 950)
    const tc = on2(t);
    g.save(); cam(g, t, o);
    g.drawImage(LN.bangleStall(), 0, 0);
    if (!o.noSeller) { g.save(); g.beginPath(); g.rect(0, 0, W, 1192); g.clip();                      // he stands behind his counter (its top at y 1192)
    person(g, { L: P.bangle, wear: WEAR.bangle, x: 868, y: 700, s: 0.3, turn: -0.35, face: { smile: 0.4, look: [-10, 4], close: blink(tc, 1.7) },
      arms: [{ w: [808, 1150], pose: 'rest', a: 1.3 }, { w: [940, 1155], pose: 'rest', a: 1.8 }] });
    g.restore(); }
    const hx = himB(tc, T), hy = 790, hs = 0.5, behind = hx < BW.x + 250;
    const sorry = win(tc, at('c01') - 0.08, at('c01') + 0.12, en('c01') - 0.12, en('c01') + 0.12);
    const inBag = win(tc, T.lift - 0.22, T.lift - 0.05, T.lift + 0.06, T.lift + 0.24);
    const hasW = tc >= T.lift && tc < T.pocket1 + 0.2;
    const drawHim = () => {
      const bob = 6 * Math.abs(Math.sin(tc * 5.4)), rest0 = UP(hx, hy, hs, -300, 1180), pock = UP(hx, hy, hs, -200, 1080);
      const w0 = inBag > 0 ? lerp2(rest0, [BAGP[0] + 6, BAGP[1] - 8], inBag) : hasW ? lerp2([BAGP[0] + 20, BAGP[1]], pock, ramp(tc, T.lift + 0.22, T.pocket1 + 0.15)) : rest0;
      person(g, { L: P.lilac, wear: WEAR.lilac, x: hx, y: hy + bob, s: hs, turn: sorry > 0.1 ? -0.45 * sorry + 0.3 * (1 - sorry) : 0.3,
        face: { smile: 0.45 + 0.35 * sorry, browUp: 0.7 * sorry, browIn: 0.5 * sorry, look: sorry > 0.2 ? [-16, 4] : [10, 2], op: talk(tc, ['c01'], 0.3), close: blink(tc, 2.2) },
        arms: [{ w: w0, pose: inBag > 0.4 || hasW ? 'pinch' : 'rest', hold: hasW ? (gg, A, h) => wallet(gg, A.w[0] + 0.3 * h, A.w[1] + 0.28 * h, 0.34, 1.0) : null },
               { w: lerp2(UP(hx, hy, hs, 300, 1180), UP(hx, hy, hs, 265, 290), sorry), pose: sorry > 0.4 ? 'open' : 'rest', a: sorry > 0.4 ? -1.5 : null }] });
    };
    const drawLift = () => {
      const hs2 = hs, S = UP(hx, hy + 6 * Math.abs(Math.sin(tc * 5.4)), hs2, -0.7 * 285 + 40 * 0.3, 470), rest0 = UP(hx, hy, hs2, -300, 1180), pock = UP(hx, hy, hs2, -200, 1080);
      const W0 = inBag > 0 ? lerp2(rest0, [BAGP[0] + 6, BAGP[1] - 8], inBag) : lerp2([BAGP[0] + 20, BAGP[1]], pock, ramp(tc, T.lift + 0.22, T.pocket1 + 0.15));
      const E = limb(g, S, W0, hs2, WEAR.lilac, P.lilac.skin, { pole: [-0.3, 1] }), a = Math.atan2(W0[1] - E[1], W0[0] - E[0]), h = handS(hs2);
      D.hand(g, W0[0], W0[1], a, h, inBag > 0.4 || hasW ? 'pinch' : 'rest', { left: true, skin: P.lilac.skin });
      if (hasW) wallet(g, W0[0] + 0.3 * h * Math.cos(a), W0[1] + 0.3 * h * Math.sin(a), 0.34, a + PI / 2);
    };
    if (behind) drawHim();
    // she: bangles up to the light; a smile back on "sorry"; then off up the lane, left
    const go = ramp(tc, T.sheGo, T.sheGo + 0.9), sx = BW.x - 720 * go * go, sy = BW.y + 8 * Math.abs(Math.sin(go * 9)) * (go > 0 && go < 1 ? 1 : 0);
    const jolt = win(tc, T.bump, T.bump + 0.06, T.bump + 0.16, T.bump + 0.36), up = 1 - ramp(tc, T.sheGo - 0.3, T.sheGo + 0.1);
    const lookW = tc < T.bump + 0.1 ? [-14, -10] : tc < en('c01') + 0.15 ? [16, 2] : [-16, 2];
    const turnW = tc < T.bump ? -0.2 : tc < T.sheGo ? 0.35 : -0.45;
    person(g, { L: P.woman, wear: WEAR.woman, x: sx + 14 * jolt, y: sy - 6 * jolt, s: BW.s, turn: turnW, tilt: 0.04 * jolt,
      face: { smile: 0.4 + 0.3 * win(tc, at('c01') + 0.2, at('c01') + 0.4, en('c01'), en('c01') + 0.3), look: lookW, close: blink(tc, 3.3), browUp: 0.4 * jolt },
      arms: [{ w: lerp2(UP(sx, sy, BW.s, -300, 1180), UP(sx, sy, BW.s, -250, -160), up), pose: 'hold', a: up > 0.5 ? -PI / 2 - 0.1 : null, hold: (gg, A, h) => bangles(gg, A.w[0] + 0.1 * h * Math.cos(A.ang + PI / 2), A.w[1] - 0.6 * h * up - 0.1 * h, 0.9, 0.12) },
             { w: UP(sx, sy, BW.s, 330, 1140), pose: 'rest' }] });
    const bx = sx + (BAGP[0] - BW.x), by = BAGP[1] + (sy - BW.y);
    bag(g, bx + 14 * jolt, by, 0.6, { wallet: tc < T.lift, sx: sx + BW.s * 150, sy: sy + BW.s * 400, rot: 0.05 * jolt });
    // his lifting arm, over her, while it's at her bag (otherwise her body would hide the lift: it must be there to see on a rewatch)
    if (behind && (inBag > 0 || hasW)) drawLift();
    if (!behind) drawHim();
    // the near side of the lane: a cart of bangle boxes along the bottom
    g.fillStyle = lg(g, 0, 1500, 0, 1920, [0, '#7a4a28'], [1, '#4a2c16']); g.fillRect(-60, 1530, W + 120, 520);
    const cols = ['#e8413a', '#f0c32a', '#2fa5d6', '#c2366b', '#7a4fc6', '#ffffff'];
    for (let i = 0; i < 9; i++) { const bx2 = -20 + i * 130; g.fillStyle = '#efe2c4'; R(g, bx2, 1500, 118, 70, 8); g.fill(); for (let k = 0; k < 5; k++) { g.strokeStyle = cols[(i + k) % cols.length]; g.lineWidth = 8; g.beginPath(); g.ellipse(bx2 + 22 + k * 19, 1526, 11, 18, 0, 0, TAU); g.stroke(); } }
    g.restore();
  }

  // ================================================================ C · the drop: the bench by the chai stall, the constable passing
  const LX = 1060;                                     // the wide lane's x at the frame's left
  const BEN = { x: 110, y: 1330, w: 620 };
  const DROP = [455, 1318], DROPFROM = 1190;   // clear of the seated man's elbow (the review: the release was hidden)           // where the wallet lands, and the height it falls from
  const MOLE = { x: 838, y: 880, s: 0.46 };   // his cap's edge left of x 950            // the man with the mole at the chai stall
  function himC(tc, T) {
    if (tc <= T.drop) return lerp(-180, 420, clamp((tc - (T.cutC - 0.35)) / (T.drop - (T.cutC - 0.35))));
    return lerp(420, 470, mj(clamp((tc - T.drop) / 0.5))) - 900 * Math.pow(clamp((tc - T.drop - 0.5) / 1.6), 1.6);   // a step on, then back up the lane, left
  }
  function moleSeated(g, tc, T, o = {}) {
    const L = life(7.1, tc, 1), { x, y, s } = MOLE, px = x + (o.dx || 0), py = y + 3 * L.breath - (o.rise || 0), gsc = 0.5 * s / 0.62;
    const G = UP(px, py, s, -105, 590), glassW = [G[0] - 118 * gsc, G[1] + 66 * gsc];
    const glassArm = !o.w0;
    person(g, { L: P.thief, wear: WEAR.thief, x: px, y: py, s, turn: o.turn ?? -0.45, legs: { seated: true, rise: (o.rise || 0) / s },
      face: { smile: o.smile ?? 0.25, look: o.look || [-14, 3], close: blink(tc, 4.1), browUp: o.browUp || 0, browIn: o.browIn || 0 },
      arms: [glassArm ? { w: glassW, E: UP(px, py, s, -400, 860), pose: 'none', front: true, hold: (gg, A) => glassHeld(gg, A.w[0], A.w[1], gsc, P.thief.skin, -1) }
                      : { w: o.w0, E: o.E0, Eu: o.Eu0 ?? 1, pose: o.pose0 || 'pinch', a: o.a0 ?? null, front: true, hold: o.hold0 || null },
             { w: UP(x, y, s, 175, HIP + 150), E: UP(px, py, s, 330, 880), pose: 'rest', a: 1.45 }] });   // his free hand on his knee (the knees stay put as he rises)
  }
  function shotBench(g, t, T, o = {}) {
    const tc = on2(t);
    g.save(); cam(g, t, o);
    g.save(); g.translate(-LX, 0); g.drawImage(LN.laneWide(), 0, 0); g.restore();
    // the constable: on his beat between the bench and the stall, strolling slowly, swinging his lathi, looking up the lane
    // (his boots in cues.py, every 0.52 s); the man in lilac sees him ahead as he reaches the bench
    { const cxp = lerp(615, 565, clamp((tc - T.cutC) / (T.cutD - T.cutC))), cs = 0.34, cyp = 620, ph = (tc - at('v02') - 0.2) / 1.04, sw = Math.sin(ph * TAU);
      person(g, { L: P.cop, wear: WEAR.cop, x: cxp, y: cyp + bobOf(ph, 0.5) * cs, s: cs, turn: -0.15, legs: { ph, dir: -1, amp: 0.5 }, face: { look: [10, -3], close: blink(tc, 5.1) },
        arms: [{ w: UP(cxp, cyp, cs, -300 + 60 * sw, 1170), pose: 'fist', hold: (gg, A) => lathi(gg, A.w[0], A.w[1] - 10, 0.26, 0.35 + 0.2 * sw) },
               { w: UP(cxp, cyp, cs, 300 - 60 * sw, 1170), pose: 'rest' }] }); }
    // the man who said sorry: left to right behind the bench; the wallet slips from his hand over it; then into the crowd
    const hx = himC(tc, T), back = tc > T.drop + 0.45, hs = back ? lerp(0.44, 0.38, clamp((tc - T.drop - 0.45) / 1.6)) : 0.44, into = 0, hy = back ? lerp(690, 650, clamp((tc - T.drop - 0.45) / 1.6)) : 690;
    const dropped = tc >= T.drop, glanceC = win(tc, T.drop - 0.5, T.drop - 0.32, T.drop + 0.1, T.drop + 0.35);
    if (hx > -400 && into < 0.98) {
      const ph = (hx + 180) / 260, sw = Math.sin(ph * TAU);
      const over = win(tc, T.drop - 0.4, T.drop - 0.18, T.drop + 0.02, T.drop + 0.16);   // the hand leaves the wallet at once (nothing near a dropped clue)
      const w1 = lerp2(UP(hx, hy, hs, 300 - 110 * sw, 1170), [DROP[0] + 30, DROPFROM], over);
      g.save(); g.globalAlpha = 1 - into;
      person(g, { L: P.lilac, wear: WEAR.lilac, x: hx, y: hy + bobOf(ph) * hs, s: hs, turn: back ? -0.45 : lerp(0.3, 0.55, glanceC) * (1 - into), legs: { ph, dir: back ? -1 : 1 },
        face: { smile: 0.25, look: glanceC > 0.3 ? [18, -5] : [12, 2], close: blink(tc, 2.2) },
        arms: [{ w: UP(hx, hy, hs, -300 + 110 * sw, 1170), pose: 'rest' },
               { w: w1, pose: over > 0.3 && !dropped ? 'pinch' : 'rest', hold: !dropped ? (gg, A, h) => wallet(gg, A.w[0] + 0.25 * h, A.w[1] + 0.3 * h, 0.3, 1.15) : null }] });
      g.restore();
    }
    bench(g, BEN.x, BEN.y, BEN.w, 1);
    if (dropped && !(o.picked)) { const fall = clamp((tc - T.drop) / 0.14); wallet(g, DROP[0], lerp(DROPFROM + 40, DROP[1], fall * fall), 0.42, 0.12, { sq: lerp(0.9, 0.55, fall), shadow: fall > 0.7 }); }
    // the man with the mole: his eyes on the man in lilac, then on the wallet as it lands
    const lookM = easeL(tc, [[0, [-6, 2]], [T.cutC + 0.6, [-18, 3]], [T.drop - 0.5, [-18, 8]], [T.drop + 0.15, [-20, 13]]]);
    if (!o.noMole) moleSeated(g, tc, T, { look: lookM, browUp: 0.35 * ramp(tc, T.drop + 0.05, T.drop + 0.25) });
    g.restore();
  }

  // ================================================================ D · the pick-up and the run
  function runner(g, tc, x, y, s, ph, held = true, o = {}) {   // the man with the mole running to the left, in profile (the mole shows)
    const bob = bobOf(ph, 1.8) * s, sw = Math.sin(ph * TAU);
    g.save(); g.translate(0, bob);
    const S1 = UP(x, y, s, 40, 440), S2 = UP(x, y, s, -40, 450);
    { const Wb = UP(x, y, s, 60 + 330 * sw, 980 - 160 * Math.abs(sw)), Eb = limb(g, S1, Wb, s, WEAR.thief, P.thief.skin, { pole: [0.7, 0.6] });
      D.hand(g, Wb[0], Wb[1], Math.atan2(Wb[1] - Eb[1], Wb[0] - Eb[0]), handS(s), 'fist', { left: true, skin: P.thief.skin }); }
    g.save(); g.translate(x, y + HIP * s); g.scale(s, s); legs(g, WEAR.thief, ph, -1, 1.8, { lean: 0.12, tu: -0.6 }); g.restore();
    g.save(); g.translate(x, y); g.rotate(-0.1); g.scale(s, s); torso(g, P.thief, WEAR.thief, -1);
    g.translate(-25, 0); D.headProfile(g, P.thief, { smile: o.smile ?? 0.05, close: blink(tc, 4.1), browUp: o.browUp ?? 0.2 }); g.restore();
    const Wn = held ? (o.up ? UP(x, y, s, -190, 640 + 30 * Math.sin(ph * TAU * 2)) : UP(x, y, s, -560, 700 + 40 * Math.sin(ph * TAU * 2))) : UP(x, y, s, -320 * sw, 980);
    limb(g, S2, Wn, s, WEAR.thief, P.thief.skin, { pole: [0.2, 1] });
    D.hand(g, Wn[0], Wn[1], PI + 0.2, handS(s), held ? 'pinch' : 'rest', { left: false, skin: P.thief.skin });
    if (held) wallet(g, Wn[0] - 0.75 * handS(s), Wn[1] - 0.05 * handS(s), 0.62 * s, -0.15);
    g.restore();
  }
  function shotPick(g, t, T) {
    const tc = on2(t);
    g.save(); cam(g, t, { z: 1.3, f: [700, 1080], still: true });
    g.save(); g.translate(-LX, 0); g.drawImage(LN.laneWide(), 0, 0); g.restore();
    bench(g, BEN.x, BEN.y, BEN.w, 1);
    const picked = tc >= T.pick, down = ramp(tc, T.glassDown - 0.1, T.glassDown + 0.18);
    const reach = win(tc, T.pick - 0.3, T.pick - 0.06, T.pick + 0.08, T.pick + 0.34), stand = ramp(tc, T.stand, T.stand + 0.3);
    const GL = [700, 1296];                                                        // his glass, put down on the bench's end
    if (!picked) wallet(g, DROP[0], DROP[1], 0.42, 0.12, { sq: 0.55, shadow: true });
    if (down >= 0.5) glass(g, GL[0], GL[1] - 30, 0.24, 0);
    if (tc < T.run) {
      const { x, y, s } = MOLE, rest = UP(x, y, s, -120, 820);
      const gsc = 0.5 * s / 0.62, G0 = UP(x, y, s, -105, 590), hold0 = [G0[0] - 118 * gsc, G0[1] + 66 * gsc];
      const D2 = [DROP[0] + 22, DROP[1] - 20], up2 = ramp(tc, T.pick + 0.05, T.pick + 0.45);
      const w0 = picked ? lerp2(D2, UP(x, y - 70 * stand, s, -170, 700), up2) : reach > 0 ? lerp2([GL[0] - 30, GL[1] - 20], D2, reach) : lerp2(hold0, [GL[0] - 30, GL[1] - 20], down);
      const glassIn = !picked && reach <= 0 && down < 0.5;
      moleSeated(g, tc, T, { w0, E0: UP(x, y - 70 * stand, s, -360, 900), Eu0: picked ? up2 : 0, pose0: glassIn ? 'none' : 'pinch', rise: 70 * stand, turn: lerp(-0.45, -0.75, stand), dx: -20 * reach,
        look: tc < T.stand ? [-20, 13] : [-20, -2], browIn: 0.5 * stand, browUp: 0.3, smile: 0.1,
        hold0: picked ? (gg, A, h) => wallet(gg, A.w[0] + 0.3 * h * Math.cos(A.ang), A.w[1] + 0.3 * h * Math.sin(A.ang), 0.3, A.ang) : glassIn ? (gg, A) => glassHeld(gg, A.w[0], A.w[1], gsc, P.thief.skin, -1) : null });
    } else {
      const ru = clamp((tc - T.run) / 0.75);
      runner(g, tc, lerp(MOLE.x - 40, -420, ru * ru), MOLE.y - 50, MOLE.s, (tc - T.run) * 2.8, true);
    }
    g.restore();
  }

  // ================================================================ E · "My wallet!" "Chor!" (and G, H, J, K after, in the same place)
  const X = {                                          // bystanders (new): a man in stripes, a woman in a red saree, an old man
    stripe: { L: { skin: '#a8724e', skinD: '#82563a', skinH: '#c48e68', hair: '#100c09', style: 'buzz', must: null, stub: 0, brow: 13, browTilt: 2, jaw: 0.96, ew: 41, eh: 21 }, wear: { kind: 'tee', top: '#d8e0ea', topL: '#ffffff', topD: '#9aa6b4', sleeve: 'short', legs: '#3a3632', shoe: '#2a2018' } },
    basket: { L: { skin: '#a87650', skinD: '#82583a', skinH: '#c4926a', hair: '#3a3430', style: 'short', must: null, stub: 0, brow: 12, browTilt: 2, jaw: 1.0, ew: 40, eh: 22, lips: '#8a4a4a' }, wear: { kind: 'saree', top: '#2a4a5a', saree: '#9a4a2a', sareeL: '#b86a4a', sareeD: '#6a2a14', border: '#f2e6c8', sleeve: 'blouse', shoe: '#5a3020' } },   // short grey-black hair, a rust saree and a slate blouse: none of the victim's colours   // no saffron or mustard (the checklist, 29)
    old: { L: { skin: '#b5835e', skinD: '#8f6043', skinH: '#d09e79', hair: '#9a9590', style: 'long', must: null, stub: 0, brow: 11, browTilt: 4, jaw: 0.95, ew: 40, eh: 21, lips: '#8a4a4a' }, wear: { kind: 'saree', top: '#6a3a5a', saree: '#22345e', sareeL: '#3a5288', sareeD: '#141f3a', border: '#c9b07a', sleeve: 'blouse', shoe: '#3a2418' } },   // an older woman (no lookalike of the bangle seller)
  };
  const backPocket = (x, y, s, tu) => UP(x, y, s, (tu <= 0 ? 1 : -1) * 318 * (1 - 0.3 * Math.abs(tu)) + 40 * tu, 1060);   // at his outer hip, sticking out past him   // the phone, up out of his back pocket at the hip away from his turn
  function greens(g, x, y, s) {                     // a round cane basket of greens and tomatoes, held by its rim at (x, y)
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#4f8a36'; for (let i = 0; i < 7; i++) { ell(g, -90 + i * 30, -26 - 14 * Math.sin(i * 1.3), 30, 22, 0.3 * i); g.fill(); }
    g.fillStyle = '#d9342b'; for (const [px, py] of [[-50, -16], [12, -22], [62, -12]]) { ell(g, px, py, 20, 18); g.fill(); }
    g.fillStyle = lg(g, 0, -10, 0, 110, [0, '#c99a5a'], [1, '#8a6232']); g.beginPath(); g.moveTo(-120, -6); g.quadraticCurveTo(-110, 104, 0, 112); g.quadraticCurveTo(110, 104, 120, -6); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(90,60,30,0.5)'; g.lineWidth = 6; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-114 + k * 5, 22 + k * 28); g.quadraticCurveTo(0, 42 + k * 30, 114 - k * 5, 22 + k * 28); g.stroke(); }
    g.strokeStyle = '#7a5226'; g.lineWidth = 10; g.beginPath(); g.ellipse(0, -6, 120, 22, 0, 0, TAU); g.stroke();
    g.restore();
  }
  function veg(g, tc) { g.drawImage(LN.vegStall(), 0, 0); person(g, { L: P.veg, wear: WEAR.veg, x: 190, y: 700, s: 0.32, turn: 0.35, face: { look: [10, 4], close: blink(tc, 6.2) } }); }
  function baskets(g) {
    g.fillStyle = lg(g, 0, 1440, 0, 1920, [0, '#6e5236'], [1, '#3e2c1c']); g.fillRect(-60, 1480, W + 120, 520);
    for (let i = 0; i < 7; i++) { const bx = -40 + i * 175; g.fillStyle = '#b07a3a'; g.beginPath(); g.moveTo(bx, 1460); g.lineTo(bx + 160, 1460); g.lineTo(bx + 140, 1580); g.lineTo(bx + 20, 1580); g.closePath(); g.fill(); g.strokeStyle = 'rgba(70,40,15,0.5)'; g.lineWidth = 4; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(bx + 6 + k * 3, 1482 + k * 26); g.lineTo(bx + 154 - k * 3, 1482 + k * 26); g.stroke(); }
      const r = mulberry32(i + 5); for (let k = 0; k < 14; k++) { ell(g, bx + 30 + r() * 100, 1460 - r() * 26, 17, 16); g.fillStyle = ['#d9342b', '#b07a3a', '#e8b632', '#c9a24a'][i % 4]; g.fill(); } }
  }
  // the rework (27 Nov): close-ups over soft backgrounds, one or two people acting per shot
  function bgSoft(g, img, z, fx, fy, ox = 0) { g.save(); g.translate(540, 960); g.scale(z, z); g.translate(-fx, -fy); g.drawImage(img, ox, 0); g.restore(); }
  const haze = (g, a) => { g.fillStyle = `rgba(214,178,138,${a})`; g.fillRect(0, 0, W, H); };
  const still = (on) => ({ ph: 0.25, dir: 1, amp: 0.12, ...(on || {}) });     // standing legs (mostly off the frame's bottom in a close-up)
  function shotShout(g, t, T) {
    const tc = on2(t);
    if (t < T.cutE2) shoutHer(g, t, tc, T); else if (t < T.cutE3) shoutLoud(g, t, tc, T); else shoutRun(g, t, tc, T);
  }
  // E1 · her: a hand into the bag to pay; nothing in it; "My wallet!"; round to the sound of running feet
  function shoutHer(g, t, tc, T) {
    const u = t - T.cutE;
    bgSoft(g, LN.vegSoft(), 1.35, 410, 860);
    const x = 400, y = 640, s = 0.8;
    const rch = ramp(tc, T.reach, T.reach + 0.28), rum = tc > T.reach + 0.28 && tc < T.wallet ? Math.sin((tc - T.reach) * 26) : 0;
    const alarm = ramp(tc, T.wallet - 0.1, T.wallet + 0.06), up = ramp(tc, at('c02', 1) - 0.12, at('c02', 1) + 0.08), tw = ramp(tc, en('c02') - 0.22, en('c02'));
    const bp = UP(x, y, s, 330, 790), mouthB = [bp[0] - 12, bp[1] - 64], chest = UP(x, y, s, 215, 650);   // the bag's mouth, at her hip
    const kIn = [[T.reach, UP(x, y, s, 300, 1150)], [T.reach + 0.28, mouthB], [at('c02', 1) - 0.12, mouthB], [at('c02', 1) + 0.1, chest]];
    const inBag = keyed(tc, kIn), aIn = keyed(tc, [[T.reach + 0.28, PI / 2 + 0.15], [at('c02', 1) - 0.12, PI / 2 + 0.15], [at('c02', 1) + 0.1, -PI / 2 + 0.3]]);
    if (rum && up < 0.05) inBag[1] += 8 * rum;
    g.save(); cam(g, t, { z: 1 + 0.03 * clamp(u / 1.4), cx: 420, cy: 900 });
    person(g, { L: P.woman, wear: WEAR.woman, x, y, s, turn: lerp(lerp(0.2, -0.05, alarm), 0.45, tw), tilt: -0.03 * (1 - alarm), legs: still(),
      face: { op: talk(tc, ['c02'], 0.6) + 0.15 * alarm, browUp: 1.1 * alarm, browIn: 0.3 * alarm, look: tw > 0.5 ? [18, 0] : alarm > 0.5 && up < 0.5 ? [4, 18] : up > 0.5 ? [0, 2] : [8, 16], close: blink(tc, 3.3) * (1 - alarm) },
      arms: [{ w: UP(x, y, s, -280, 1110), pose: 'rest' }, { w: inBag, pose: rch > 0.4 ? 'open' : 'rest', a: aIn, au: rch, front: true }] });
    bag(g, bp[0], bp[1], s, { wallet: false, sx: x + s * 120, sy: y + s * 380 });   // over her hand: her fingers go in
    g.restore();
  }
  // E2 · the loud man: round at the feet, pointing off to the left, "Chor! Chor!"
  function shoutLoud(g, t, tc, T) {
    bgSoft(g, LN.vegSoft(), 1.5, 715, 860);
    const x = 600, y = 650, s = 0.8;
    const tn = ramp(tc, T.cutE2 + 0.02, T.cutE2 + 0.2), pt = ramp(tc, T.chor - 0.2, T.chor + 0.02);
    const aim = UP(x, y, s, -560, 330);                                            // off to the left, at the running man
    g.save(); cam(g, t, { z: 1.0 + 0.05 * pt, cx: 560, cy: 860 });
    person(g, { L: P.loud, wear: WEAR.loud, x, y, s, turn: lerp(0.35, -0.5, tn), tilt: -0.05 * pt, legs: still(),
      face: { op: talk(tc, ['c03'], 0.75) + 0.2 * pt, browIn: 0.9 * pt, frown: 0.6 * pt, browUp: 0.4 * tn * (1 - pt), look: tn > 0.5 ? [-18, 2] : [10, 14], close: blink(tc, 1.9) * (1 - tn) },
      arms: [{ w: lerp2(UP(x, y, s, -280, 1120), aim, pt), pose: pt > 0.4 ? 'point' : 'rest', a: pt > 0.4 ? PI + 0.15 : null, front: true },
             { w: UP(x, y, s, 300, 1140), pose: 'rest' }] });
    g.restore();
  }
  // E3 · the man with the mole, running in with the wallet held up; the loud man's finger in from the right; the freeze lands here
  function shoutRun(g, t, tc, T) {
    const u = clamp((t - T.cutE3) / (T.freeze - T.cutE3)), e = 1 - (1 - u) * (1 - u);
    bgSoft(g, LN.vegSoft(), 1.3, 600 - 100 * u, 880);
    const x = lerp(760, 560, e), y = 690, s = 0.66;
    runner(g, tc, x, y, s, (tc - T.cutE3) * 2.6 * (1 - 0.4 * u) + 0.3, true, { browUp: 0.75, up: true, smile: 0 });
  }

  // ================================================================ F · the pick: four faces, numbered, a ring that runs out
  const LINE4 = [['loud', 0.1, -0.1], ['thief', 0.3, 0], ['bangle', 0.35, 0.05], ['lilac', 0.5, 0.05]];
  function shotPick4(g, t, T) {
    g.save(); shotShout(g, T.freeze - 1 / 30, T); g.restore();
    const dim = ramp(t, T.freeze, T.freeze + 0.25);
    g.fillStyle = `rgba(16,22,32,${0.84 * dim})`; g.fillRect(0, 0, W, H);
    if (t < T.freeze + 0.1) { g.fillStyle = `rgba(255,255,255,${0.45 * (1 - (t - T.freeze) / 0.1)})`; g.fillRect(0, 0, W, H); }
    const zp = 1 + 0.035 * clamp((t - T.cards) / (T.unfreeze - T.cards));
    g.save(); g.translate(540, 990); g.scale(zp, zp); g.translate(-540, -990);
    LINE4.forEach(([k, sm, tu], i) => {
      const a = ramp(t, T.cards + i * 0.09, T.cards + i * 0.09 + 0.3), cx = 80 + (i % 2) * 440, cy = 545 + Math.floor(i / 2) * 455 + 60 * (1 - a);
      if (a <= 0) return;
      g.save(); g.globalAlpha = a;
      card(g, cx, cy, 410, 430, i + 1, (gg) => { gg.save(); gg.translate(210, 205); gg.scale(0.5, 0.5); torso(gg, P[k], WEAR[k], tu); head2(gg, P[k], { smile: sm, turn: tu, look: [0, 2], close: blink(t, i + 1) }); gg.restore(); });
      g.restore();
    });
    g.restore();
    const qa = ramp(t, T.cards + 0.2, T.cards + 0.5);
    g.globalAlpha = qa; txt(g, 'WHO STOLE', 540, 400, 92, '#fff6e2', { align: 'center' }); txt(g, 'HER WALLET?', 540, 506, 112, '#ffd34a', { align: 'center' }); g.globalAlpha = 1;
    const q0 = at('v03b'), rr = clamp((t - q0) / (T.unfreeze - q0)), ra = ramp(t, q0 - 0.2, q0);   // a dial that drains from the question to the unfreeze
    if (ra > 0) { g.save(); g.globalAlpha = ra; const cx = 540, cy = 1478, r = 42;
      g.fillStyle = 'rgba(255,255,255,0.16)'; ell(g, cx, cy, r, r); g.fill();
      g.fillStyle = '#ffd34a'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r - 6, -PI / 2, -PI / 2 + TAU * (1 - rr)); g.closePath(); g.fill();
      g.strokeStyle = '#fff6e2'; g.lineWidth = 5; ell(g, cx, cy, r, r); g.stroke(); g.restore(); }
  }

  // ================================================================ G · the grab: the loud man's fist in his collar; the wallet held up high
  function shotGrab(g, t, T) {
    const tc = on2(t), u = t - T.grab, z = 1 + 0.05 * clamp(u / (T.cutH - T.grab));
    g.save(); g.translate(500, 900); g.scale(z, z); g.translate(-500, -900);
    bgSoft(g, LN.vegSoft(), 1.25, 520, 900);
    haze(g, 0.12);
    const rel = ramp(tc, T.cutH - 0.55, T.cutH - 0.25);                            // he lets go as she pushes through (the whoosh)
    const shake = (1 - rel) * Math.sin(u * 7) * (0.45 + 0.55 * Math.exp(-u * 0.9));
    const x = 400 + 10 * shake, y = 720 + 4 * Math.abs(shake), s = 0.68;
    const lk = easeL(tc, [[0, [16, 2]], [at('v04', 8) - 0.1, [0, 3]], [en('v04') - 0.45, [-16, 2]]]);   // at the loud man; at you on "everyone here knows"; to her, coming
    person(g, { L: P.thief, wear: WEAR.thief, x, y, s, turn: 0.2 - 0.25 * ramp(tc, en('v04') - 0.5, en('v04')), tilt: 0.04 * shake, legs: still(),
      face: { op: 0.08 + 0.06 * Math.abs(shake), browUp: 0.85 - 0.3 * ramp(tc, at('v04', 8), at('v04', 8) + 0.4), browIn: 0.35, look: lk, close: blink(tc, 4.1), smile: 0.05 },
      arms: [{ w: UP(x, y, s, -300, -150), E: UP(x, y, s, -470, 180), Eu: 1, pose: 'pinch', a: -PI / 2 - 0.1, au: 1, front: true,
               hold: (gg, A, h) => wallet(gg, A.w[0] + 0.6 * h * Math.cos(A.ang), A.w[1] + 0.6 * h * Math.sin(A.ang), 0.5 * s / 0.62, 0.1) },
             { w: UP(x, y, s, 290, 1150), pose: 'rest' }] });
    const lx = 790 + 6 * shake, ly = 640, ls = 0.6, col = UP(x, y, s, 115, 410);
    person(g, { L: P.loud, wear: WEAR.loud, x: lx, y: ly, s: ls, turn: -0.5, legs: still(),
      face: { browIn: 0.2 + 0.7 * (1 - rel), frown: 0.5 * (1 - rel), look: [-16, 4], close: blink(tc, 1.9), op: 0.04 },
      arms: [{ w: lerp2(col, UP(lx, ly, ls, -290, 1150), rel), pose: rel > 0.5 ? 'rest' : 'fist', a: PI + 0.25, au: 1 - rel, front: true },
             { w: UP(lx, ly, ls, 300, 1150), pose: 'rest' }] });
    baskets(g);
    g.restore();
  }

  // ================================================================ H · the handback; behind them, the phone
  // Her and him, the wallet passing from his hand to hers in the middle of the frame. Behind them, the loud man is back at the
  // onions with his back to us, the phone up out of his back pocket; the man in lilac, beside him, watches the two of them with
  // a smile while his hand drops to that pocket and comes away with it. Silent, never pointed at: there on a rewatch.
  function shotHand(g, t, T) {
    const tc = on2(t), u = t - T.cutH;
    g.save(); cam(g, t, { z: 1.0 + 0.03 * clamp(u / 5), cx: 500, cy: 980, still: true });
    veg(g, tc);
    const LB = { x: 430, y: 545, s: 0.36 }, LL = { x: 646, y: 552, s: 0.36 };
    const reachP = ramp(tc, T.phoneLift - 0.42, T.phoneLift - 0.1), took = tc >= T.phoneLift, back = ramp(tc, T.phoneLift + 0.05, T.phoneLift + 0.45);
    const ph0 = UP(LB.x, LB.y, LB.s, 140, HIP - 30);                              // the phone's top, up out of his right back pocket
    personBack(g, { L: P.loud, wear: WEAR.loud, x: LB.x, y: LB.y + 2 * Math.sin(tc * 1.3), s: LB.s, turn: 0.18 + 0.12 * Math.sin(tc * 0.7), phone: took ? 0 : 1, armsIn: true,
      arms: [{ w: UP(LB.x, LB.y, LB.s, -120, 860 + 20 * Math.sin(tc * 2.1)), E: UP(LB.x, LB.y, LB.s, -330, 760) }, { w: UP(LB.x, LB.y, LB.s, 120, 860 - 20 * Math.sin(tc * 2.1)), E: UP(LB.x, LB.y, LB.s, 330, 760) }] });
    const restL = UP(LL.x, LL.y, LL.s, -290, 1150), side = UP(LL.x, LL.y, LL.s, -240, 1110);
    const wL = took ? lerp2([ph0[0] + 2, ph0[1] - 2], side, back) : lerp2(restL, [ph0[0] + 2, ph0[1] - 2], reachP);
    person(g, { L: P.lilac, wear: WEAR.lilac, x: LL.x, y: LL.y, s: LL.s, turn: -0.35, legs: still(),
      face: { smile: 0.4 + 0.15 * ramp(tc, T.give, T.give + 0.4), look: [-16, 8], close: blink(tc, 2.2) },
      arms: [{ w: wL, pose: reachP > 0.6 || took ? 'pinch' : 'rest', front: true, hold: took ? (gg, A, h) => phone(gg, A.w[0] + 0.3 * h * Math.cos(A.ang), A.w[1] + 0.3 * h * Math.sin(A.ang), 0.24, A.ang + PI / 2) : null },
             { w: UP(LL.x, LL.y, LL.s, 300, 1150), pose: 'rest' }] });
    haze(g, 0.12);
    // in front: she pushes in and takes her wallet from his hand; he gives it, glad
    const push = ramp(tc, T.push, T.push + 0.6), sx = lerp(120, 205, push), sy = 790, ss = 0.6, MX = 790, MY = 780, MS = 0.6;
    const out = ramp(tc, T.cutH + 0.25, T.cutH + 0.95), meet = ramp(tc, T.give - 0.3, T.give), keep = ramp(tc, T.give + 0.22, T.give + 0.75);
    const HP = [548, 1180], hasHer = tc >= T.give;
    const hisW = hasHer ? lerp2(HP, UP(MX, MY, MS, -280, 1130), ramp(tc, T.give + 0.2, T.give + 0.8)) : lerp2(UP(MX, MY, MS, -170, 640), HP, out);
    const herW = hasHer ? lerp2([HP[0] - 86, HP[1] + 6], UP(sx, sy, ss, 140, 650), keep) : lerp2(UP(sx, sy, ss, 255, 1130), [HP[0] - 86, HP[1] + 6], meet);
    const relief = ramp(tc, T.give + 0.05, T.give + 0.35), smileS = ramp(tc, T.give + 0.5, T.give + 0.9), nod = win(tc, T.give + 1.2, T.give + 1.35, T.give + 1.45, T.give + 1.65);
    const wal = (gg, A, h) => wallet(gg, A.w[0] + 0.42 * h * Math.cos(A.ang), A.w[1] + 0.42 * h * Math.sin(A.ang), 0.4, A.ang + PI / 2);
    person(g, { L: P.thief, wear: WEAR.thief, x: MX, y: MY, s: MS, turn: -0.4, legs: still(),
      face: { browUp: 0.55 - 0.25 * relief, look: hasHer && keep < 1 ? [-14, 12] : [-16, 2], smile: 0.1 + 0.25 * relief + 0.2 * smileS, close: blink(tc, 4.1) },
      arms: [{ w: hisW, pose: hasHer ? 'rest' : 'pinch', front: true, hold: hasHer ? null : wal }, { w: UP(MX, MY, MS, 290, 1130), pose: 'rest' }] });
    person(g, { L: P.woman, wear: WEAR.woman, x: sx, y: sy, s: ss, turn: 0.45, tilt: 0.07 * nod, legs: still(),
      face: { browIn: 0.35 * (1 - relief), browUp: 0.5 * relief * (1 - smileS), look: hasHer && keep < 0.9 ? [8, 16] : [16, -2], smile: 0.5 * smileS, close: blink(tc, 3.3) },
      arms: [{ w: UP(sx, sy, ss, -280, 1130), pose: 'rest' }, { w: herW, pose: meet > 0.6 ? 'pinch' : 'rest', front: true, pole: [0.6, 1], hold: hasHer ? wal : null }] });
    baskets(g);
    g.restore();
  }

  // ================================================================ J · let go: close-ups (him; the man in lilac, the phone into his shirt pocket; his shrug)
  function shotNow(g, t, T) {
    const tc = on2(t);
    if (t < T.cutJ2) nowMole(g, t, tc, T, false); else if (t < T.cutJ3) nowLilac(g, t, tc, T); else nowMole(g, t, tc, T, true);
  }
  function nowMole(g, t, tc, T, late) {
    bgSoft(g, LN.vegSoft(), 1.55, 470, 880);
    if (!late) { const cgo = ramp(tc, T.copGo, T.copGo + 1.4); if (cgo < 1) { const cx = lerp(330, -200, cgo);
      person(g, { L: P.cop, wear: WEAR.cop, x: cx, y: 600, s: 0.42, turn: -0.35, legs: cgo > 0 ? { ph: cgo * 3, dir: -1 } : still(), face: { look: [-14, 4], smile: 0.2, close: blink(tc, 5.1) } }); } }
    haze(g, 0.14);
    const s = late ? 1.0 : 1.2, go = late ? ramp(tc, T.heGo, T.heGo + 0.45) : 0, x = (late ? 500 : 514) - 780 * go * go, y = late ? 690 : 712;
    const free = ramp(tc, T.letGo, T.letGo + 0.3);
    const c0 = T.collar, th = atW('v07', /thief/), brow = win(tc, th - 0.08, th + 0.12, en('v07') - 0.1, en('v07') + 0.2), eyesR = late ? 0 : ramp(tc, T.look, T.look + 0.15);
    const busy = late ? 0 : keyed(tc, [[c0, 0], [c0 + 0.2, 1], [c0 + 1.25, 1], [c0 + 1.45, 0]]), capT = late ? 0 : keyed(tc, [[c0 + 0.7, 0], [c0 + 0.95, 1], [c0 + 1.2, 1], [c0 + 1.45, 0]]);
    const su = late ? keyed(tc, [[T.shrug, 0], [T.shrug + 0.2, 1], [T.shrug + 0.45, 1], [T.shrug + 0.7, 0]]) : 0;
    const look = late ? (go > 0 ? [-18, 2] : tc < T.shrug ? [18, -2] : [0, 3]) : eyesR > 0.5 ? [18, -2] : brow > 0.3 ? [0, 3] : busy > 0.3 ? [-4, 12] : [6, 2];
    const restL = UP(x, y, s, -290, 1150), restLE = UP(x, y, s, -320, 790), restR = UP(x, y, s, 290, 1150), restRE = UP(x, y, s, 320, 790);
    const collW = UP(x, y, s, -150, 440), collE = UP(x, y, s, -340, 840), capW = UP(x, y, s, -165, -110), capE = UP(x, y, s, -430, 430);
    let armL, armR;
    if (!late) {
      const K = (a, b, c) => [[c0, a], [c0 + 0.25, b], [c0 + 0.65, b], [c0 + 0.95, c], [c0 + 1.2, c], [c0 + 1.5, a]];
      armL = { w: keyed(tc, K(restL, collW, capW)), E: keyed(tc, K(restLE, collE, capE)), Eu: 1, a: keyed(tc, K(PI / 2, -0.75, -0.35)), au: busy, pose: busy > 0.5 ? 'pinch' : 'rest' };
      armR = { w: restR, E: restRE, Eu: 1, pose: 'rest' };
    } else {
      armL = { w: lerp2(restL, UP(x, y, s, -300, 650), su), E: lerp2(restLE, UP(x, y, s, -390, 920), su), Eu: 1, a: lerp(PI / 2, PI + 1.2, su), au: 1, pose: su > 0.4 ? 'open' : 'rest' };
      armR = { w: lerp2(restR, UP(x, y, s, 300, 650), su), E: lerp2(restRE, UP(x, y, s, 390, 920), su), Eu: 1, a: lerp(PI / 2, -1.2, su), au: 1, pose: su > 0.4 ? 'open' : 'rest' };
    }
    person(g, { L: P.thief, wear: WEAR.thief, x, y: y - 26 * su, s, turn: go > 0 ? -0.6 * go : -0.05 + 0.1 * eyesR, tilt: 0.03 * su, legs: still(),
      face: { smile: 0.15 + 0.35 * brow + 0.35 * su + 0.1 * free, browUp: 0.2 + 0.6 * brow + 0.7 * su, look, close: blink(tc, 4.1), capUp: 0.15 * capT },
      arms: [{ ...armL, front: true }, { ...armR, front: true }] });
  }
  function nowLilac(g, t, tc, T) {
    bgSoft(g, LN.vegSoft(), 1.6, 735, 860);
    haze(g, 0.1);
    const x = 500, y = 700, s = 1.15, t0 = T.cutJ2, tu = -0.25;
    const nod = win(tc, t0 + 0.2, t0 + 0.32, t0 + 0.42, t0 + 0.6);
    const lift = ramp(tc, t0 + 0.3, t0 + 0.62), down = ramp(tc, t0 + 0.62, t0 + 0.8), off = ramp(tc, t0 + 0.92, t0 + 1.1);
    const pk = UP(x, y, s, (110 + 60) * 0.925 - 10, 195 + 330);                     // his shirt pocket's mouth
    const phW = lerp2(lerp2(UP(x, y, s, 300, 1150), [pk[0] + 70, pk[1] + 150], lift), [pk[0] + 70, pk[1] + 230], down);
    const wHand = off > 0 ? lerp2([pk[0] + 70, pk[1] + 230], UP(x, y, s, 300, 1150), off) : phW;
    person(g, { L: P.lilac, wear: WEAR.lilac, x, y, s, turn: tu, tilt: 0.05 * nod, legs: still(),
      face: { smile: 0.55, look: [-16, 2], close: blink(tc, 2.2) },
      arms: [{ w: UP(x, y, s, -290, 1150), pose: 'rest' }, { w: wHand, E: UP(x, y, s, 360, 900), pose: off > 0 ? 'rest' : 'none', a: off > 0 ? null : -PI / 2 - 0.5, front: true }] });
    // the phone: in his fingers in front of his chest, then down into the pocket, its top left showing beside the pen
    if (lift > 0) {
      const h = handS(s), an = -PI / 2 - 0.5, tip = [wHand[0] + 0.62 * h * Math.cos(an), wHand[1] + 0.62 * h * Math.sin(an)];
      const inPk = [pk[0] + 4, pk[1] + 36 * s], ph = off > 0 ? inPk : lerp2(tip, inPk, down), ps = 0.5 * s / 0.9;
      if (down > 0) { g.save(); g.beginPath(); g.rect(0, 0, W, pk[1] + 128 * s); g.clip(); phone(g, ph[0], ph[1], ps, 0.04); g.restore();
        g.save(); g.translate(x, y); g.scale(s, s); g.translate(40 * tu, 0); g.scale(1 - 0.3 * Math.abs(tu), 1);
        g.fillStyle = mix(WEAR.lilac.top, '#ffffff', 0.06); R(g, 110, 195 + 330, 120, 130, 8); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 5; g.stroke();
        g.fillStyle = '#1d3f8a'; R(g, 186, 195 + 280, 16, 90, 6); g.fill(); g.fillStyle = '#c9cdd2'; R(g, 186, 195 + 280, 16, 22, 4); g.fill();
        g.restore(); }
      if (off <= 0) { D.hand(g, wHand[0], wHand[1], an, h, 'pinch', { left: false, skin: P.lilac.skin }); if (down <= 0) phone(g, ph[0], ph[1], ps, -0.3); }
    }
  }

  // ================================================================ K · his back pocket: nothing (from behind; far up the lane, the man in lilac)
  function shotPocket(g, t, T) {
    const tc = on2(t), kz = ramp(t, atW('v08', /never/), en('v08'));
    g.save(); g.translate(540, 900); g.scale(1 + 0.05 * kz, 1 + 0.05 * kz); g.translate(-540, -900);
    bgSoft(g, LN.laneSoft(), 1.15, 760, 900);
    const fu = clamp((tc - T.pocket) / (T.stroll - T.pocket)), fx = lerp(790, 835, fu), fy = lerp(720, 700, fu), fs = lerp(0.2, 0.18, fu);
    personBack(g, { L: P.lilac, wear: WEAR.lilac, x: fx, y: fy, s: fs, walk: (tc - T.pocket) / 0.92,
      arms: [null, { w: UP(fx, fy, fs, 250, 1020), pose: 'pinch', a: PI / 2 - 0.4, hold: (gg, A, h) => phone(gg, A.w[0] + 0.3 * h * Math.cos(A.ang), A.w[1] + 0.3 * h * Math.sin(A.ang), 0.12, A.ang + PI / 2) }] });
    haze(g, 0.06);
    // the loud man: his hand to his back pocket (the first slap), in, out empty; the other pocket (the second); hands on his hips, looking round
    const x = 520, y = 560, s = 0.7, e0 = en('v07b');
    const toR = ramp(tc, T.pocket + 0.02, e0 + 0.4), dipR = win(tc, e0 + 0.42, e0 + 0.5, e0 + 0.56, e0 + 0.62), outR = ramp(tc, e0 + 0.6, e0 + 0.95);
    const toL = ramp(tc, e0 + 0.55, e0 + 0.75), upL = ramp(tc, e0 + 0.85, e0 + 1.1), hipL = ramp(tc, e0 + 1.6, e0 + 1.95);
    const pR = UP(x, y, s, 137, HIP + 70), pL = UP(x, y, s, -137, HIP + 70), hipR = UP(x, y, s, 300, HIP - 20), hipLp = UP(x, y, s, -300, HIP - 20);
    let wR = lerp2(UP(x, y, s, 300, 1180), pR, toR); wR = [wR[0], wR[1] + 22 * dipR];
    if (outR > 0) wR = lerp2([pR[0], pR[1] + 22 * dipR], hipR, outR);
    const wL = lerp2(lerp2(lerp2(UP(x, y, s, -300, 1180), pL, toL), UP(x, y, s, -470, 600), upL), hipLp, hipL);
    const lookT = easeL(tc, [[0, [0, 0]], [e0 + 0.62, [0.55, 0]], [e0 + 0.95, [-0.6, 0]], [at('v08', 5), [0.65, 0]], [atW('v08', /never/) + 0.2, [0.1, 0]], [en('v08') - 0.1, [-0.5, 0]]])[0];
    personBack(g, { L: P.loud, wear: WEAR.loud, x, y, s, turn: lookT, tilt: 0.03 * Math.sin(tc * 1.1), dip: dipR > 0.05 ? 1 : 0,
      arms: [{ w: wL, E: lerp2(UP(x, y, s, -420, 790), UP(x, y, s, -450, 820), hipL), Eu: Math.max(upL, hipL), pose: upL > 0.4 && hipL < 0.5 ? 'open' : toL > 0.5 ? 'flat' : 'rest',
               a: hipL > 0 ? lerp(1.5 * PI + 0.1, PI / 2 + 0.6, hipL) : lerp(PI / 2, 1.5 * PI + 0.1, upL), au: Math.max(toL, upL) },
             { w: wR, E: UP(x, y, s, 450, 820), Eu: outR, pose: dipR > 0 || toR > 0.5 ? 'flat' : 'rest', a: lerp(PI / 2, PI / 2 - 0.6, outR), au: toR }] });
    g.restore();
  }

  // ================================================================ I · the replay: the lift and the drop again, sepia, the eyes that saw them
  function shotReplay(g, t, T) {
    const u = t - T.replay, sc = (a, b) => clamp((u - a) / (b - a));
    g.save(); g.filter = 'sepia(0.75) saturate(0.8) contrast(1.05)';
    if (t < T.rDrop) shotBangle(g, lerp(T.bump - 0.4, T.lift + 0.6, sc(0, T.rDrop - T.replay)), T, { z: 1.45, f: [BAGP[0] + 30, BAGP[1] - 195], still: true, noSeller: true });
    else if (t < T.rEyes) shotBench(g, lerp(T.drop - 0.95, T.drop + 0.45, sc(T.rDrop - T.replay, T.rEyes - T.replay)), T, { z: 1.4, f: [690, 960], still: true });
    else {
      g.save(); cam(g, t, { z: 2.3, f: [MOLE.x - 30, MOLE.y - 10], still: true });
      g.save(); g.translate(-LX, 0); g.drawImage(LN.laneWide(), 0, 0); g.restore();
      moleSeated(g, on2(t), T, { look: easeL(u, [[0, [-18, 3]], [T.rEyes - T.replay + 0.3, [-20, 13]]]), browUp: 0.3 });
      g.restore();
    }
    g.restore();
    g.fillStyle = rg(g, 540, 960, 500, 1150, [0, 'rgba(40,24,10,0)'], [1, 'rgba(40,24,10,0.55)']); g.fillRect(0, 0, W, H);
    const r = mulberry32(Math.floor(t * 30)); g.strokeStyle = 'rgba(255,245,220,0.25)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const x = r() * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + r() * 20 - 10, H); g.stroke(); }
    if (u < 0.3) { g.fillStyle = `rgba(255,255,255,${0.4 * (1 - u / 0.3)})`; g.fillRect(0, 0, W, H); }
    txt(g, '◀◀', 130, 1500, 84, 'rgba(255,246,226,0.9)', { align: 'center', stroke: 'rgba(20,12,6,0.6)', sw: 0.1 });   // bottom left, off the faces
  }

  // ================================================================ L · down the lane, from behind: "Sorry, sorry."
  // The man in lilac walks away up the lane, the phone in his hand; a shopper coming the other way brushes his shoulder; he
  // half turns (his specs, his smile), a hand up: "Sorry, sorry." His feet land with the steps in cues.py (every 0.46 s).
  function shotStroll(g, t, T) {
    const tc = on2(t), u = clamp((tc - T.stroll) / (T.last - T.stroll));
    g.save(); cam(g, t, { z: 1.0 });
    g.save(); g.translate(-640, 0); g.drawImage(LN.laneWide(), 0, 0); g.restore();
    const ph = (tc - (en('v08') + 0.15)) / 0.92 + 0.5;
    const hx = lerp(560, 470, u), hy = lerp(640, 540, u), hs = lerp(0.62, 0.46, u);
    const brush = win(tc, T.brush - 0.06, T.brush, T.brush + 0.1, T.brush + 0.35);
    const turnH = win(tc, T.brush + 0.05, T.brush + 0.25, en('c04') - 0.1, en('c04') + 0.25);
    const su = clamp((tc - T.stroll + 0.2) / (T.last - T.stroll + 0.4)), sb = (T.brush - T.stroll + 0.2) / (T.last - T.stroll + 0.4), shx = su < sb ? lerp(330, 236, su / sb) : lerp(236, -260, Math.pow((su - sb) / (1 - sb), 1.3)), shy = lerp(600, 900, su * su), shs = lerp(0.42, 0.78, su * su);
    const shopper = () => person(g, { L: X.basket.L, wear: X.basket.wear, x: shx, y: shy, s: shs, turn: 0.15, legs: { ph: su * 3.2, dir: 1, amp: 0.8 },
      face: { look: tc > T.brush ? [16, -2] : [4, 4], browIn: 0.4 * ramp(tc, T.brush, T.brush + 0.2), close: blink(tc, 3.1) },
      arms: [{ w: UP(shx, shy, shs, -290, 1150), pose: 'rest' }, { w: UP(shx, shy, shs, 300, 1100), pose: 'fist', a: PI / 2, hold: (gg, A, h) => greens(gg, A.w[0], A.w[1] + 0.32 * h, shs * 0.95) }] });
    const passed = shy + 1795 * shs > hy + 1795 * hs;
    if (!passed) shopper();
    personBack(g, { L: P.lilac, wear: WEAR.lilac, x: hx - 10 * brush, y: hy, s: hs, turn: -0.75 * turnH, walk: ph, tilt: -0.04 * turnH,
      arms: [{ w: lerp2(UP(hx, hy, hs, -300, 1180), UP(hx, hy, hs, -360, 380), turnH), E: UP(hx, hy, hs, -470, 760), Eu: turnH, pose: turnH > 0.4 ? 'open' : 'rest', a: -PI / 2 - 0.25, au: turnH },
             { w: UP(hx, hy, hs, 255 + 25 * Math.sin(ph * TAU), 1010), pose: 'pinch', a: PI / 2 - 0.5,
               hold: (gg, A, h) => phone(gg, A.w[0] + 0.32 * h * Math.cos(A.ang), A.w[1] + 0.32 * h * Math.sin(A.ang), 0.3 * hs / 0.62, A.ang + PI / 2) }] });
    if (passed) shopper();
    g.restore();
  }

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g, T = times();
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.clearRect(0, 0, W, H);
      g.save();
      if (t < T.cutB) shotChai(g, t, T, false);
      else if (t < T.cutC) shotBangle(g, t, T);
      else if (t < T.cutD) shotBench(g, t, T);
      else if (t < T.cutE) shotPick(g, t, T);
      else if (t < T.freeze) shotShout(g, t, T);
      else if (t < T.unfreeze) shotPick4(g, t, T);
      else if (t < T.cutH) shotGrab(g, t, T);
      else if (t < T.replay) shotHand(g, t, T);
      else if (t < T.now) shotReplay(g, t, T);
      else if (t < T.pocket) shotNow(g, t, T);
      else if (t < T.stroll) shotPocket(g, t, T);
      else if (t < T.last) shotStroll(g, t, T);
      else shotChai(g, t, T, true);
      g.restore();
    },
  });
  U.endcard();
  U.grain();
  C.start();
})();
