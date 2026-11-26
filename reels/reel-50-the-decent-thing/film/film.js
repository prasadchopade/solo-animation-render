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
  const { P, WEAR, person, wallet, phone, bag, bangles, lathi, bench, card, head2, torso, legs, bobOf, limb, handS } = LN;
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
    T.freeze = en('c03') + 0.1;
    T.cards = T.freeze + 0.25;
    T.ring = en('v03b');
    T.unfreeze = at('v04') - 0.02;
    T.grab = T.unfreeze;
    T.copBack = T.unfreeze + 1.5;
    T.lilIn = T.unfreeze + 1.0;
    T.cutH = at('v05') - 0.3;
    T.push = T.cutH;                                     // she pushes through to him
    T.give = at('v05b') - 0.2;                           // she takes it from his hand
    T.phoneLift = at('v05b') + 0.5;                      // behind them, the man who said sorry takes the loud man's phone
    T.replay = en('v05b') + 0.3;
    T.rDrop = T.replay + 1.95; T.rEyes = T.replay + 3.55;
    T.now = en('v06') + 0.35;
    T.letGo = T.now + 0.15; T.copGo = T.now + 0.6; T.collar = T.now + 1.1;
    T.look = atW('v07', /thief/) - 0.25;                // his eyes find the man who said sorry, who smiles back
    T.shrug = at('v07b') + 0.4;
    T.heGo = en('v07b') - 0.3;
    T.pocket = en('v07b') + 0.12;
    T.reachPh = T.pocket + 0.3; T.empty = T.pocket + 0.95; T.pat = T.pocket + 1.6;
    T.stroll = en('v08') + 0.12;
    T.sorry2 = at('c04') - 0.25;
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
    // the glass: at his chest, lifted to you on the toast, to his lips on the sip
    const gw = lerp2(lerp2(UP(x, y, s, -170, 640), UP(x, y, s, -120, 470), toast), UP(x, y, s, -30, 300), sip);
    person(g, { L: P.thief, wear: WEAR.thief, x, y, s, turn, tilt: L.tilt - 0.03 * toast,
      face: { smile: 0.42 + 0.22 * toast, look, close: Math.max(blink(tc, 4.1), 0.85 * sip), browUp: 0.3 * toast },
      arms: [{ w: gw, a: -PI / 2 - 0.1, pose: 'fist', front: true, holdUnder: glassUnder(s) },
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
    const k = [[T.cutB - 0.15, -160], [T.bump - 0.05, 380], [T.lift + 0.12, 640], [en('c01') + 0.7, 1260]];
    let i = 0; while (i < k.length - 2 && tc > k[i + 1][0]) i++;
    const u = clamp((tc - k[i][0]) / (k[i + 1][0] - k[i][0]));
    return lerp(k[i][1], k[i + 1][1], i === 1 ? u : mj(u) * 0.3 + u * 0.7);
  }
  function shotBangle(g, t, T, o = {}) {
    const tc = on2(t);
    g.save(); cam(g, t, o);
    g.drawImage(LN.bangleStall(), 0, 0);
    g.save(); g.beginPath(); g.rect(0, 0, W, 1192); g.clip();                      // he stands behind his counter (its top at y 1192)
    person(g, { L: P.bangle, wear: WEAR.bangle, x: 850, y: 700, s: 0.3, turn: -0.35, face: { smile: 0.4, look: [-10, 4], close: blink(tc, 1.7) },
      arms: [{ w: [790, 1150], pose: 'rest', a: 1.3 }, { w: [925, 1155], pose: 'rest', a: 1.8 }] });
    g.restore();
    const hx = himB(tc, T), hy = 790, hs = 0.5, behind = hx < BW.x + 250;
    const sorry = win(tc, at('c01') - 0.08, at('c01') + 0.12, en('c01') - 0.05, en('c01') + 0.3);
    const inBag = win(tc, T.lift - 0.22, T.lift - 0.05, T.lift + 0.06, T.lift + 0.24);
    const hasW = tc >= T.lift && tc < T.pocket1 + 0.2;
    const drawHim = () => {
      const bob = 6 * Math.abs(Math.sin(tc * 5.4)), rest0 = UP(hx, hy, hs, -300, 1180), pock = UP(hx, hy, hs, -200, 1080);
      const w0 = inBag > 0 ? lerp2(rest0, [BAGP[0] + 6, BAGP[1] - 8], inBag) : hasW ? lerp2([BAGP[0] + 20, BAGP[1]], pock, ramp(tc, T.lift + 0.22, T.pocket1 + 0.15)) : rest0;
      person(g, { L: P.lilac, wear: WEAR.lilac, x: hx, y: hy + bob, s: hs, turn: sorry > 0.1 ? -0.45 * sorry + 0.3 * (1 - sorry) : 0.3,
        face: { smile: 0.45 + 0.35 * sorry, browUp: 0.7 * sorry, browIn: 0.5 * sorry, look: sorry > 0.2 ? [-16, 4] : [10, 2], op: talk(tc, ['c01'], 0.3), close: blink(tc, 2.2) },
        arms: [{ w: w0, pose: inBag > 0.4 || hasW ? 'pinch' : 'rest', hold: hasW ? (gg, A, h) => wallet(gg, A.w[0] + 0.3 * h, A.w[1] + 0.28 * h, 0.34, 1.0) : null },
               { w: lerp2(UP(hx, hy, hs, 300, 1180), UP(hx, hy, hs, 250, 90), sorry), pose: sorry > 0.4 ? 'open' : 'rest', a: sorry > 0.4 ? -1.5 : null }] });
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
  const DROP = [560, 1318], DROPFROM = 1190;           // where the wallet lands, and the height it falls from
  const MOLE = { x: 838, y: 880, s: 0.46 };   // his cap's edge left of x 950            // the man with the mole at the chai stall
  function himC(tc, T) {
    const k = [[T.cutC - 0.35, -180], [T.drop, 520], [T.drop + 1.6, 1260]];
    let i = tc > k[1][0] ? 1 : 0; const u = clamp((tc - k[i][0]) / (k[i + 1][0] - k[i][0]));
    return tc > k[2][0] ? 1260 : lerp(k[i][1], k[i + 1][1], u);
  }
  function moleSeated(g, tc, T, o = {}) {
    const L = life(7.1, tc, 1), { x, y, s } = MOLE;
    const glassW = o.glassW || UP(x, y, s, -120, 820);
    person(g, { L: P.thief, wear: WEAR.thief, x: x + (o.dx || 0), y: y + 3 * L.breath - (o.rise || 0), s, turn: o.turn ?? -0.45,
      face: { smile: o.smile ?? 0.25, look: o.look || [-14, 3], close: blink(tc, 4.1), browUp: o.browUp || 0, browIn: o.browIn || 0 },
      arms: [{ w: o.w0 || glassW, pose: o.pose0 || 'fist', a: o.a0 ?? (o.w0 ? null : -PI / 2 - 0.1), front: true, hold: o.hold0 !== undefined ? o.hold0 : null, holdUnder: o.hold0 !== undefined ? null : glassUnder(s) },
             { w: UP(x + (o.dx || 0), y - (o.rise || 0), s, 330, 1180), pose: 'rest' }] });
  }
  function shotBench(g, t, T, o = {}) {
    const tc = on2(t);
    g.save(); cam(g, t, o);
    g.save(); g.translate(-LX, 0); g.drawImage(LN.laneWide(), 0, 0); g.restore();
    // the constable: upstage, ambling right to left, swinging his lathi; level with the bench as the wallet goes
    const cu = (tc - (T.drop - 1.9)) / 3.8, cxp = lerp(1180, -260, cu), cs = 0.34, cyp = 640;
    if (cu > -0.1 && cu < 1.1) {
      const ph = cu * 3.4, sw = Math.sin(ph * TAU);
      person(g, { L: P.cop, wear: WEAR.cop, x: cxp, y: cyp + bobOf(ph) * cs, s: cs, turn: -0.35, legs: { ph, dir: -1 }, face: { look: [-10, 2], close: blink(tc, 5.1) },
        arms: [{ w: UP(cxp, cyp, cs, -300 + 120 * sw, 1170), pose: 'fist', hold: (gg, A) => lathi(gg, A.w[0], A.w[1] - 10, 0.26, 0.35 + 0.2 * sw) },
               { w: UP(cxp, cyp, cs, 300 - 120 * sw, 1170), pose: 'rest' }] });
    }
    // the man who said sorry: left to right behind the bench; the wallet slips from his hand over it; then into the crowd
    const hx = himC(tc, T), hs = 0.44, into = 0, hy = 690;
    const dropped = tc >= T.drop, glanceC = win(tc, T.drop - 0.5, T.drop - 0.32, T.drop + 0.1, T.drop + 0.35);
    if (hx > -400 && into < 0.98) {
      const ph = (hx + 180) / 260, sw = Math.sin(ph * TAU);
      const over = win(tc, T.drop - 0.4, T.drop - 0.18, T.drop + 0.02, T.drop + 0.16);   // the hand leaves the wallet at once (nothing near a dropped clue)
      const w1 = lerp2(UP(hx, hy, hs, 300 - 110 * sw, 1170), [DROP[0] + 30, DROPFROM], over);
      g.save(); g.globalAlpha = 1 - into;
      person(g, { L: P.lilac, wear: WEAR.lilac, x: hx, y: hy + bobOf(ph) * hs, s: hs, turn: lerp(0.3, -0.5, glanceC) * (1 - into), legs: { ph, dir: 1 },
        face: { smile: 0.25, look: glanceC > 0.3 ? [-18, -4] : [12, 2], close: blink(tc, 2.2) },
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
    const S1 = UP(x, y, s, 40, 470), S2 = UP(x, y, s, -40, 480);
    limb(g, S1, UP(x, y, s, 60 + 330 * sw, 980 - 160 * Math.abs(sw)), s, WEAR.thief, P.thief.skin, { pole: [0.7, 0.6] });
    g.save(); g.translate(x, y + 1130 * s); g.scale(s, s); legs(g, WEAR.thief, ph, -1, 1.8, { lean: 0.12 }); g.restore();
    g.save(); g.translate(x, y); g.rotate(-0.1); g.scale(s, s); torso(g, P.thief, WEAR.thief, -1);
    g.translate(-25, 0); D.headProfile(g, P.thief, { smile: o.smile ?? 0.05, close: blink(tc, 4.1), browUp: o.browUp ?? 0.2 }); g.restore();
    const Wn = held ? (o.up ? UP(x, y, s, -300, 470 + 30 * Math.sin(ph * TAU * 2)) : UP(x, y, s, -560, 700 + 40 * Math.sin(ph * TAU * 2))) : UP(x, y, s, -320 * sw, 980);
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
      const w0 = reach > 0 ? lerp2(GL, [DROP[0] + 22, DROP[1] - 20], reach) : picked ? UP(x, y - 60 * stand, s, -150, 760) : lerp2(rest, [GL[0], GL[1] - 10], down);
      moleSeated(g, tc, T, { w0, pose0: reach > 0.4 ? 'pinch' : picked ? 'pinch' : 'fist', a0: picked || reach > 0.4 ? null : -PI / 2 - 0.1, rise: 70 * stand, turn: lerp(-0.45, -0.75, stand), dx: -20 * reach,
        look: tc < T.stand ? [-20, 13] : [-20, -2], browIn: 0.5 * stand, browUp: 0.3, smile: 0.1,
        hold0: picked ? (gg, A, h) => wallet(gg, A.w[0] + 0.3 * h * Math.cos(A.ang), A.w[1] + 0.3 * h * Math.sin(A.ang), 0.3, A.ang) : down < 0.5 ? (gg, A) => glassUnder(MOLE.s)(gg, A) : null });
    } else {
      const ru = clamp((tc - T.run) / 0.75);
      runner(g, tc, lerp(MOLE.x - 40, -420, ru * ru), MOLE.y - 50, MOLE.s, (tc - T.run) * 2.8, true);
    }
    g.restore();
  }

  // ================================================================ E · "My wallet!" "Chor!" (and G, H, J, K after, in the same place)
  const X = {                                          // bystanders (new): a man in stripes, a woman in a red saree, an old man
    stripe: { L: { skin: '#a8724e', skinD: '#82563a', skinH: '#c48e68', hair: '#100c09', style: 'buzz', must: null, stub: 0, brow: 13, browTilt: 2, jaw: 0.96, ew: 41, eh: 21 }, wear: { kind: 'tee', top: '#d8e0ea', topL: '#ffffff', topD: '#9aa6b4', sleeve: 'short', legs: '#3a3632', shoe: '#2a2018' } },
    basket: { L: { skin: '#bb8a64', skinD: '#956648', skinH: '#d6a882', hair: '#160f0b', style: 'long', must: null, stub: 0, brow: 11, browTilt: 4, jaw: 0.88, ew: 44, eh: 24, lips: '#a05050', lash: true }, wear: { kind: 'saree', top: '#2f4f8f', saree: '#b03050', sareeL: '#d05878', sareeD: '#7a1a34', border: '#f2e6c8', sleeve: 'blouse', shoe: '#5a3020' } },   // no saffron or mustard (the checklist, 29)
    old: { L: { skin: '#b5835e', skinD: '#8f6043', skinH: '#d09e79', hair: '#9a9590', style: 'long', must: null, stub: 0, brow: 11, browTilt: 4, jaw: 0.95, ew: 40, eh: 21, lips: '#8a4a4a' }, wear: { kind: 'saree', top: '#6a3a5a', saree: '#22345e', sareeL: '#3a5288', sareeD: '#141f3a', border: '#c9b07a', sleeve: 'blouse', shoe: '#3a2418' } },   // an older woman (no lookalike of the bangle seller)
  };
  const backPocket = (x, y, s, tu) => UP(x, y, s, (tu <= 0 ? 1 : -1) * 318 * (1 - 0.3 * Math.abs(tu)) + 40 * tu, 1060);   // at his outer hip, sticking out past him   // the phone, up out of his back pocket at the hip away from his turn
  function veg(g, tc) { g.drawImage(LN.vegStall(), 0, 0); person(g, { L: P.veg, wear: WEAR.veg, x: 190, y: 700, s: 0.32, turn: 0.35, face: { look: [10, 4], close: blink(tc, 6.2) } }); }
  function baskets(g) {
    g.fillStyle = lg(g, 0, 1440, 0, 1920, [0, '#6e5236'], [1, '#3e2c1c']); g.fillRect(-60, 1480, W + 120, 520);
    for (let i = 0; i < 7; i++) { const bx = -40 + i * 175; g.fillStyle = '#b07a3a'; g.beginPath(); g.moveTo(bx, 1460); g.lineTo(bx + 160, 1460); g.lineTo(bx + 140, 1580); g.lineTo(bx + 20, 1580); g.closePath(); g.fill(); g.strokeStyle = 'rgba(70,40,15,0.5)'; g.lineWidth = 4; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(bx + 6 + k * 3, 1482 + k * 26); g.lineTo(bx + 154 - k * 3, 1482 + k * 26); g.stroke(); }
      const r = mulberry32(i + 5); for (let k = 0; k < 14; k++) { ell(g, bx + 30 + r() * 100, 1460 - r() * 26, 17, 16); g.fillStyle = ['#d9342b', '#b07a3a', '#e8b632', '#c9a24a'][i % 4]; g.fill(); } }
  }
  const VW = { x: 225, y: 840, s: 0.56 };              // the woman at the vegetable stall (left)
  const LM = { x: 735, y: 700, s: 0.6 };               // the loud man (right): high enough that his hip pocket shows over the crates
  const STOP = 545;                                    // where the running man ends up, between them
  // the loud man's trousers and back pocket (his hip shows above the crates): drawn under him, the phone up out of the pocket
  function hips(g, x, y, s, tu, withPhone) {
    const hx = x + 40 * tu * s, w = 330 * s * (1 - 0.2 * Math.abs(tu)), top = y + 1080 * s, bot = y + 1420 * s;
    g.fillStyle = WEAR.loud.legs; R(g, hx - w, top, 2 * w, bot - top, 18 * s); g.fill();
    const px = hx + (tu <= 0 ? 1 : -1) * w * 0.62, py = top + 60 * s;
    g.fillStyle = mix(WEAR.loud.legs, '#000000', 0.35); R(g, px - 62 * s, py, 124 * s, 120 * s, 10 * s); g.fill();   // the back pocket
    if (withPhone) phone(g, px, py - 18 * s, 0.4, 0.08);
    return [px, py];
  }
  function shotShout(g, t, T) {
    const tc = on2(t);
    g.save(); cam(g, t, { z: 1 + 0.06 * ramp(tc, T.chor, T.freeze), cx: 520, cy: 960, still: tc >= T.freeze - 0.05 });
    veg(g, tc);
    // she: her hand into the bag to pay, nothing in it, "My wallet!", round to the right
    const rch = ramp(tc, T.reach, T.reach + 0.3), alarm = ramp(tc, T.wallet - 0.12, T.wallet + 0.08), tw = ramp(tc, T.turn, T.turn + 0.3);
    const bp = UP(VW.x, VW.y, VW.s, 330, 700);
    person(g, { L: P.woman, wear: WEAR.woman, x: VW.x, y: VW.y, s: VW.s, turn: lerp(-0.35, 0.55, tw),
      face: { op: talk(tc, ['c02'], 0.55) + 0.2 * alarm, browUp: 1.1 * alarm, browIn: 0.3 * alarm, look: tw > 0.5 ? [18, 0] : [2, 14], close: blink(tc, 3.3) * (1 - alarm) },
      arms: [{ w: UP(VW.x, VW.y, VW.s, -290, 1170), pose: 'rest' }, { w: lerp2(UP(VW.x, VW.y, VW.s, 300, 1150), [bp[0] - 4, bp[1] + 26], rch * (1 - 0.7 * tw)), pose: rch > 0.5 && tw < 0.5 ? 'open' : 'rest' }] });
    bag(g, bp[0], bp[1], 0.56, { wallet: false, sx: VW.x + VW.s * 150, sy: VW.y + VW.s * 400 });   // over her hand: her fingers go in
    // the loud man, at the right, weighing onions; round to the running man and pointing at his face ("Chor! Chor!")
    const tn = ramp(tc, T.chor - 0.3, T.chor - 0.05), pt = ramp(tc, T.chor - 0.15, T.chor + 0.08), lmT = lerp(-0.3, -0.5, tn);
    hips(g, LM.x, LM.y, LM.s, lmT, true);
    // he comes running in from the right, past the loud man, towards her, the wallet held out
    if (tc >= T.arrive) { const ru = clamp((tc - T.arrive) / 0.9); runner(g, tc, lerp(1260, STOP, 1 - (1 - ru) * (1 - ru)), 770, 0.52, (tc - T.arrive) * 2.8, true, { browUp: 0.35, up: true }); }
    const aim = [STOP - 30, 840];                                                   // the running man's face
    person(g, { L: P.loud, wear: WEAR.loud, x: LM.x, y: LM.y, s: LM.s, turn: lmT, tilt: 0.04 * pt,
      face: { op: talk(tc, ['c03'], 0.6) + 0.2 * pt, browIn: 0.9 * pt, frown: 0.6 * pt, look: tn > 0.5 ? [-18, 4] : [-12, 10], close: blink(tc, 1.9) },
      arms: [{ w: lerp2(UP(LM.x, LM.y, LM.s, -290, 1170), aim, 0.62 * pt), pose: pt > 0.5 ? 'point' : 'rest', a: pt > 0.5 ? Math.atan2(aim[1] - 1000, aim[0] - 640) : null, front: true },
             { w: UP(LM.x, LM.y, LM.s, 300, 1170), pose: 'rest' }] });
    baskets(g);
    g.restore();
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

  // ================================================================ G · the grab; H · the handback (and the phone); J · let go
  function shotHeld(g, t, T, phase) {
    const tc = on2(t), hand = phase === 'hand', now = phase === 'now';
    g.save(); cam(g, t, hand ? { z: 1.06, cx: 470, cy: 1000 } : { z: 1.0, cx: 520, cy: 960 });
    veg(g, tc);
    // behind: an older woman in a navy saree and a woman with a basket, watching (soft)
    for (const e of [{ ...X.old, x: 860, y: 690, s: 0.33, turn: -0.4, look: [-14, 4] }, { ...X.basket, x: 95, y: 700, s: 0.33, turn: 0.4, look: [16, 4] }]) {
      g.save(); g.globalAlpha = 0.9; person(g, { L: e.L, wear: e.wear, x: e.x, y: e.y, s: e.s, turn: e.turn, face: { look: e.look, close: blink(tc, e.x * 0.01) } }); g.restore();
    }
    const MX = STOP, MY = 800, MS = 0.6, LMX = LM.x - 20, LMY = LM.y, LMS = LM.s, LMT = -0.5;
    const free = ramp(tc, T.letGo, T.letGo + 0.35), holding = tc < T.letGo + 0.2;
    const lift = win(tc, T.phoneLift - 0.32, T.phoneLift - 0.08, T.phoneLift + 0.05, T.phoneLift + 0.32), took = tc >= T.phoneLift;
    // the constable: up from behind the crowd at the grab; a shrug when she lets him go, and back the way he came
    const cin = ramp(tc, T.copBack, T.copBack + 0.6), cgo = ramp(tc, T.copGo, T.copGo + 0.9);
    if (!hand && cin > 0 && cgo < 1) { g.save(); g.globalAlpha = cin * (1 - cgo); const cx2 = 655 + 30 * cgo, cs = 0.4;
      person(g, { L: P.cop, wear: WEAR.cop, x: cx2, y: 650 - 20 * cin, s: cs, turn: -0.3, face: { look: [-14, 6], browIn: 0.4 * (1 - cgo), close: blink(tc, 5.1), smile: 0.3 * cgo } }); g.restore(); }
    // the man who said sorry: in the crowd behind the loud man from lilIn (he steps out of it); the phone at the loud man's hip
    const lx = 820, ly = 690, ls = 0.4, lin = ramp(tc, T.lilIn, T.lilIn + 0.5);
    if (tc >= T.lilIn) {
      const smile = now ? 0.35 + 0.45 * win(tc, T.look + 0.15, T.look + 0.35, T.shrug + 0.4, T.shrug + 0.8) : 0.3;
      g.save(); g.globalAlpha = lin;
      person(g, { L: P.lilac, wear: WEAR.lilac, x: lx, y: ly, s: ls, turn: -0.35, face: { smile, look: now && tc > T.look ? [-18, 2] : [-10, 6], close: blink(tc, 2.2) },
        arms: [{ w: took && lift <= 0 ? UP(lx, ly, ls, -150, 900) : UP(lx, ly, ls, -300, 1170), pose: took ? 'hold' : 'rest',
                 hold: took && lift <= 0 ? (gg, A, h) => phone(gg, A.w[0] + 0.25 * h * Math.cos(A.ang), A.w[1] + 0.25 * h * Math.sin(A.ang), 0.26, A.ang + PI / 2) : null }, { w: UP(lx, ly, ls, 300, 1170), pose: 'rest' }] });
      g.restore();
    }
    // the loud man, at the man with the mole's right shoulder, his fist in his collar; the phone up out of his back pocket
    const pocket = hips(g, LMX - 30 * free, LMY, LMS, LMT, !took);
    person(g, { L: P.loud, wear: WEAR.loud, x: LMX - 30 * free, y: LMY, s: LMS, turn: LMT,
      face: { op: phase === 'grab' ? 0.15 : 0.05, browIn: holding ? 0.8 : 0.2, browUp: 0.5 * free, frown: holding ? 0.4 : 0, look: [-14, 4], close: blink(tc, 1.9), smile: 0.15 * free },
      arms: [{ w: holding ? UP(MX, MY, MS, 210, 460) : UP(LMX, LMY, LMS, -290, 1170), pose: holding ? 'fist' : 'rest', behind: holding }, { w: UP(LMX, LMY, LMS, 300, 1170), pose: 'rest' }] });
    // the lift, drawn over the loud man while the hand is at his pocket: in plain view, never pointed at (fair on a rewatch)
    if (tc >= T.lilIn && (lift > 0 || (took && tc < T.phoneLift + 0.35))) {
      const S = UP(lx, ly, ls, -0.7 * 285 - 14, 470), backU = took ? ramp(tc, T.phoneLift, T.phoneLift + 0.35) : 0;
      const Wp = lerp2([pocket[0] + 4, pocket[1] - 10], UP(lx, ly, ls, -150, 900), backU);
      const E = limb(g, S, Wp, ls, WEAR.lilac, P.lilac.skin, { pole: [0.2, 1] }), an = Math.atan2(Wp[1] - E[1], Wp[0] - E[0]), h = handS(ls);
      D.hand(g, Wp[0], Wp[1], an, h, 'pinch', { left: true, skin: P.lilac.skin });
      if (took) phone(g, Wp[0] + 0.25 * h * Math.cos(an), Wp[1] + 0.25 * h * Math.sin(an), 0.26, an + PI / 2);
    }
    // the man in stripes, behind his left shoulder, has his left arm (the grab)
    if (phase === 'grab') person(g, { L: X.stripe.L, wear: X.stripe.wear, x: 360, y: 760, s: 0.46, turn: 0.45, face: { op: 0.2, browIn: 0.7, look: [16, 2], close: blink(tc, 3.7) },
      arms: [{ w: UP(360, 760, 0.46, -290, 1170), pose: 'rest' }, { w: UP(MX, MY, MS, -300, 700), pose: 'fist', front: true }] });
    // she, at the left (where the freeze left her): pushes in, takes her wallet from his hand, looks at it, at him; nods; he's let go
    const take = ramp(tc, T.give - 0.12, T.give + 0.15), tip = UP(MX, MY, MS, -330, 680);
    const wx = hand ? lerp(VW.x - 40, VW.x + 20, ramp(tc, T.push, T.push + 0.6)) : now ? VW.x + 20 : VW.x - 40, wy = VW.y + 10, ws = 0.58;
    const herHand = take > 0 && (hand || now) ? lerp2(UP(wx, wy, ws, 300, 1100), [tip[0] + 10, tip[1] + 12], take < 1 ? take : 1 - 0.75 * ramp(tc, T.give + 0.4, T.give + 0.9)) : UP(wx, wy, ws, 300, 1100);
    const nod = win(tc, T.letGo - 0.4, T.letGo - 0.25, T.letGo, T.letGo + 0.2);
    person(g, { L: P.woman, wear: WEAR.woman, x: wx, y: wy, s: ws, turn: 0.45, tilt: 0.08 * nod,
      face: { op: phase === 'grab' ? 0.15 : 0, look: hand && take > 0.5 && tc < T.give + 1.0 ? [6, 16] : [18, -2], browUp: phase === 'grab' ? 0.8 : 0.6 * (1 - take) + 0.6 * win(tc, T.give + 0.9, T.give + 1.2, T.replay, T.replay + 1), browIn: 0.3 * (1 - take), smile: 0.45 * ramp(tc, T.give + 1.1, T.give + 1.5) + (now ? 0.4 : 0), close: blink(tc, 3.3) },
      arms: [{ w: UP(wx, wy, ws, -290, 1170), pose: 'rest' }, { w: herHand, pose: take > 0.4 ? 'pinch' : 'rest', hold: (take >= 0.55 && (hand || now)) ? (gg, A, h) => wallet(gg, A.w[0] + 0.32 * h * Math.cos(A.ang), A.w[1] + 0.32 * h * Math.sin(A.ang), 0.4, A.ang + PI / 2) : null }] });
    // the man with the mole, in front: held, the wallet up in his hand; out to her; let go: his collar, his cap, the look, the shrug
    const strug = holding && !hand ? Math.sin(tc * 8) : 0;
    const coll = win(tc, T.collar, T.collar + 0.2, T.collar + 0.7, T.collar + 0.9), shrug = win(tc, T.shrug, T.shrug + 0.2, T.shrug + 0.55, T.shrug + 0.85), go = ramp(tc, T.heGo, T.heGo + 1.1);
    const mx = MX + 6 * strug + 520 * go * go, my = MY - 26 * shrug, ma = 1 - ramp(tc, T.heGo + 0.6, T.heGo + 1.1);
    const holdW = phase === 'grab' || (hand && tc < T.give);
    const w0 = phase === 'grab' ? UP(mx, my, MS, -200, 420) : hand ? (tc < T.give + 0.25 ? lerp2(UP(MX, MY, MS, -200, 560), tip, ramp(tc, T.push, T.push + 0.6)) : UP(mx, my, MS, -280, 1000))
      : (coll > 0 ? UP(mx, my, MS, 120, 330) : UP(mx, my, MS, -280, 1000));
    g.save(); g.globalAlpha = ma;
    person(g, { L: P.thief, wear: WEAR.thief, x: mx, y: my, s: MS, tilt: 0.04 * strug, turn: now ? (tc > T.look && tc < T.shrug + 0.7 ? 0.4 : -0.1) : -0.2,
      face: { op: phase === 'grab' ? 0.12 : 0, browUp: phase === 'grab' ? 0.9 : hand ? 0.5 : 0.25 + 0.7 * shrug, browIn: phase === 'grab' ? 0.45 : 0, smile: now ? 0.2 + 0.35 * shrug : hand && tc > T.give ? 0.35 : 0.05,
        look: now ? (tc > T.look && tc < T.shrug + 0.7 ? [18, -2] : [-6, 3]) : hand ? [-18, 4] : [-12, -6], close: blink(tc, 4.1) },
      arms: [{ w: w0, pose: holdW || coll > 0 ? 'pinch' : 'rest', front: true,
               hold: holdW ? (gg, A, h) => wallet(gg, A.w[0] + 0.32 * h * Math.cos(A.ang), A.w[1] + 0.32 * h * Math.sin(A.ang), 0.4, A.ang + PI / 2) : null },
             { w: shrug > 0 ? UP(mx, my, MS, 330, 600) : UP(mx, my, MS, 280, 1000), pose: shrug > 0.3 ? 'open' : 'rest', a: shrug > 0.3 ? -1.0 : null, front: true }] });
    g.restore();
    // her hand over his as she takes the wallet; the loud man's fist in his collar
    if ((hand || now) && take > 0 && take < 1) D.hand(g, herHand[0], herHand[1], -0.6, handS(ws), 'pinch', { left: false, skin: P.woman.skin });
    if (holding) grip(g, ...UP(MX, MY, MS, 210, 460), -2.3, LMS, P.loud.skin, false);
    baskets(g);
    g.restore();
  }

  // ================================================================ K · his back pocket: nothing
  function shotPocket(g, t, T) {
    const tc = on2(t);
    g.save(); cam(g, t, { z: 1.0, cx: 540, cy: 960 });
    veg(g, tc);
    const x = 560, y = 620, s = 0.66, tu = -0.35;
    const reach = win(tc, T.reachPh, T.reachPh + 0.2, T.empty - 0.15, T.empty + 0.05), look = ramp(tc, T.empty, T.empty + 0.2), pat = ramp(tc, T.pat, T.pat + 0.15);
    const round = pat * Math.sin((tc - T.pat) * 3.2), pt = Math.sin((tc - T.pat) * 14) * pat;
    const pk = hips(g, x, y, s, tu, false);                                       // the pocket, empty
    person(g, { L: P.loud, wear: WEAR.loud, x, y, s, turn: tu + 0.4 * round,
      face: { op: 0.22 * look, browUp: 1.2 * look, browIn: 0.25, look: reach > 0.3 ? [16, 14] : look > 0.5 && pat < 0.5 ? [4, 16] : pat > 0.5 ? [18 * Math.sin((tc - T.pat) * 3.2), 2] : [-6, 6], close: blink(tc, 1.9) },
      arms: [{ w: pat > 0 ? UP(x, y, s, -150, 820 + 30 * pt) : UP(x, y, s, -290, 1170), pose: pat > 0 ? 'flat' : 'rest' },
             { w: reach > 0.05 ? lerp2(UP(x, y, s, 300, 1170), [pk[0], pk[1] + 30], reach) : look > 0 && pat < 0.5 ? UP(x, y, s, 140, 640) : pat > 0 ? UP(x, y, s, 200, 1080 + 30 * pt) : UP(x, y, s, 300, 1170),
               pose: reach > 0.5 ? 'flat' : look > 0 && pat < 0.5 ? 'open' : pat > 0 ? 'flat' : 'rest', a: look > 0 && pat < 0.5 && reach < 0.05 ? -1.9 : null, front: true }] });
    baskets(g);
    g.restore();
  }

  // ================================================================ I · the replay: the lift and the drop again, sepia, the eyes that saw them
  function shotReplay(g, t, T) {
    const u = t - T.replay, sc = (a, b) => clamp((u - a) / (b - a));
    g.save(); g.filter = 'sepia(0.75) saturate(0.8) contrast(1.05)';
    if (t < T.rDrop) shotBangle(g, lerp(T.bump - 0.4, T.lift + 0.6, sc(0, T.rDrop - T.replay)), T, { z: 1.6, f: [BAGP[0] - 10, BAGP[1] - 250], still: true });
    else if (t < T.rEyes) shotBench(g, lerp(T.drop - 0.95, T.drop + 0.45, sc(T.rDrop - T.replay, T.rEyes - T.replay)), T, { z: 1.4, f: [DROP[0] - 20, 960], still: true });
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

  // ================================================================ L · down the lane: "Sorry, sorry."
  function shotStroll(g, t, T) {
    const tc = on2(t);
    g.save(); cam(g, t, { z: 1.0 });
    g.save(); g.translate(-LX + 500, 0); g.drawImage(LN.laneWide(), 0, 0); g.restore();
    bench(g, BEN.x + 500, BEN.y, BEN.w, 1);
    const u = (tc - T.stroll) / (T.last - T.stroll), hx = lerp(830, 60, u), ph = u * 4.4, hs = 0.46, hy = 700;
    const sorry = win(tc, T.sorry2 - 0.05, T.sorry2 + 0.12, en('c04') - 0.1, en('c04') + 0.2);
    const ox = lerp(-160, 1120, clamp((tc - T.stroll + 0.15) / (T.last - T.stroll + 0.3))), ou = (ox + 160) / 300;
    person(g, { L: X.basket.L, wear: X.basket.wear, x: ox, y: 720 + bobOf(ou) * 0.42, s: 0.42, turn: 0.3, legs: { ph: ou, dir: 1 }, face: { look: sorry > 0.3 ? [-16, 2] : [10, 2], close: blink(tc, 3.1), smile: 0.1 },
      arms: [{ w: UP(ox, 720, 0.42, -290, 1170), pose: 'rest' }, { w: UP(ox, 720, 0.42, 300, 1100), pose: 'fist' }] });
    person(g, { L: P.lilac, wear: WEAR.lilac, x: hx, y: hy + bobOf(ph) * hs, s: hs, turn: sorry > 0.2 ? 0.4 : -0.3, legs: { ph, dir: -1 },
      face: { smile: 0.45 + 0.3 * sorry, browUp: 0.5 * sorry, look: sorry > 0.2 ? [16, 2] : [-4, 15], op: talk(tc, ['c04'], 0.3), close: blink(tc, 2.2) },
      arms: [{ w: UP(hx, hy, hs, -170, 840), pose: 'hold', hold: (gg, A, h) => phone(gg, A.w[0] + 0.2 * h * Math.cos(A.ang), A.w[1] + 0.2 * h * Math.sin(A.ang) - 0.1 * h, 0.3, A.ang + PI / 2 + 0.3 * Math.sin(tc * 2)) },
             { w: sorry > 0.2 ? lerp2(UP(hx, hy, hs, 300, 1170), UP(hx, hy, hs, 250, 90), sorry) : UP(hx, hy, hs, 300, 1170), pose: sorry > 0.4 ? 'open' : 'rest', a: sorry > 0.4 ? -1.5 : null }] });
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
      else if (t < T.cutH) shotHeld(g, t, T, 'grab');
      else if (t < T.replay) shotHeld(g, t, T, 'hand');
      else if (t < T.now) shotReplay(g, t, T);
      else if (t < T.pocket) shotHeld(g, t, T, 'now');
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
