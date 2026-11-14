// Reel 38 · Draw Him. Tests desk, "You're the test subject", Season 1's thief. You saw his face for a second while he snatched your
// chain at the chai stall. A police artist draws him from your answers: you don't know, so you guess, and the pencil makes each guess
// a line. You take the drawing to a line of five. Number four is the drawing's twin; number two is the man. Four goes to jail; two
// walks out and has chai under his own WANTED poster. The script: docs/script.md. Facts: docs/research.md.
// The face rig, the bodies and the lane are the series' (lib36.js, copied from reel 36). New here: the sheet, a camera that can ride
// behind a pencil's tip, the pencil and the hand, a drawing that is built stroke by stroke (pencil.js), and every shot below.
// Our own drawings; nobody real. 30 fps. Every frame is a pure function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const K = window.KIT, Q = window.R36, PEN = window.PEN;
  const { txt, R, ell, lg, rg, sstep, figure, head, armIK, wristOf, blinkAt, title, ring, winK, key, buf, bulb, mix, INK, RED, YEL, CREAM, SKIN, THIEF, THIEF0, THIEFB } = Q;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI;
  const reset = (g) => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.globalCompositeOperation = 'source-over'; };

  // ------------------------------------------------------------------ timing (the motion test's estimates; the placed voice replaces them)
  const T0 = {
    snap: 0.5, gone: 1.5, one: 2.8, drain: 2.9, st0: 4.1, master: 5.0,     // "You're the only one who saw the thief's face," "for about one second."
    a1: 4.5, a1e: 5.8,                                                    // "Quick, before he fades."
    ride0: 5.9, ov1: 6.0, ov2: 6.65, face0: 7.6, nod: 9.1,                // "Round face, or long?" · "You don't know, so you guess."
    swing0: 9.45, jaw0: 9.5, jaw1: 10.25, rub0: 10.3, blow: 10.72,        // "Round."
    fl0: 10.95, top0: 11.45, fl1: 12.2,
    q2: 12.2, fing0: 13.6, tap: 14.85, dot: 15.1,                         // "And the mole. Which cheek?" · "This one."
    shade0: 15.6, cap0: 16.05, cap1: 16.8, tear: 16.9, up: 17.6,          // "That's him?" · "You can't say it isn't."
    wipe: 19.8, line0: 20.0, pass0: 20.3, pass1: 23.3, wide: 23.9,        // "Now pick him." "Whoever you pick goes to jail."
    c3: 24.1, c2: 24.95, c1: 25.8, tw0: 26.8,                             // 3, 2, 1
    side: 30.0, back: 33.0,                                               // "Picked number four? You picked the drawing, and so did the police: he's only here because he looks like it."
    rew0: 34.2, rew1: 35.6, ring: 35.75, card: 36.3, two: 36.6,           // "But the man you saw" … "is number two."
    cop0: 38.0, shake: 40.2, thumb: 41.2, out: 41.8,                      // "Picked him? You were right, and nobody believed you: he doesn't look like the drawing."
    cuff0: 43.2, click: 44.2,                                             // "So number four goes to jail for two of your guesses, because a pencil can't draw 'not sure'."
    cell0: 49.6,                                                          // "In 1984, a tip told police that Kirk Bloodsworth looked like their sketch. DNA freed him more than eight years later."
    cor0: 56.8, stall0: 60.2, sip: 63.6, end: 66.5,                       // "And number two? He's having chai under a picture of your guess."
  };
  const T = Object.assign({}, T0, window.TIMING || {});

  // ------------------------------------------------------------------ the cast
  // The thief is the season's. The five share his skin and his age (the desk); they differ in jaw, brows, eyes, hair and what's on the
  // lip. Two and four are the only moles: two is the man (the mole on his left cheek, the screen's right); four is the drawing.
  const WHITE = { a: '#f6f2e8', b: '#d6cfbf', collar: '#e6dfd0', sleeve: 'short', buttons: 'rgba(0,0,0,0.22)', leg: '#3a3f4b', shoe: '#211a16' };
  const M1 = { ...SKIN, hair: '#17110d', style: 'part', must: 'thick', specs: '#2a2420', brow: 13, browTilt: 5, jaw: 0.92, chinK: 1.06, ew: 41, eh: 21 };
  const M3 = { ...SKIN, hair: '#9a948c', mHair: '#c4beb4', style: 'short', must: 'mid', stub: 0.15, brow: 19, browTilt: 9, jaw: 1.04, chinK: 1.1, ew: 42, eh: 21, noseW: 1.22 };
  const M4 = { ...SKIN, hair: '#17110d', style: 'short', must: 'mid', stub: 0.2, brow: 12, browTilt: 2, jaw: 1.14, chinK: 0.86, ew: 46, eh: 25, noseW: 1.08, mole: [-84, 62], moleR: 13 };
  const M5 = { ...SKIN, hair: '#1a130e', style: 'crew', must: 'mid', beard: { c: '#1a130e', k: 'full' }, brow: 16, browTilt: 4, jaw: 1.0, ew: 44, eh: 23 };
  const FIVE = [M1, Q.THIEF_BARE, M3, M4, M5].map((L) => ({ L, D: WHITE }));
  const KHAKI = { a: '#c2ab72', b: '#9c8656', collar: '#b09a62', sleeve: 'short', buttons: 'rgba(60,40,20,0.5)', leg: '#9c8656', shoe: '#2a1d14' };
  const ART = { L: { skin: '#c48a5c', skinD: '#9a6640', skinH: '#d9a47a', hair: '#8d8983', mHair: '#ece8df', style: 'part', must: 'thick', brow: 17, browTilt: 3, jaw: 1.04, chinK: 1.02, ew: 42, eh: 21, specs: '#3b3f46', specsSq: true }, D: KHAKI };
  const COP = { L: { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983', hair: '#17110d', style: 'bun', jaw: 0.94, ew: 45, eh: 24, brow: 12, browTilt: 1 }, D: KHAKI };
  const SKN = ['#d2a17c', '#b27a54', '#8a583a'];             // your own hand
  const talk = (t, a, b, k = 1) => winK(t, a, a + 0.08, b - 0.06, b) * k * (0.05 + 0.11 * Math.abs(Math.sin(t * 17.3)) * (0.6 + 0.4 * Math.sin(t * 6.1)));

  // ------------------------------------------------------------------ the drawing: number four's face, stroke by stroke
  const FL = PEN.faceLines(M4);
  const S = [];
  const add = (p, t0, dur, o = {}) => { S.push(PEN.prep({ p, t0, t1: t0 + dur, w: o.w ?? 5, a: o.a ?? 0.82, col: o.col, out: o.out, noTip: o.noTip, seed: S.length * 13 + 5 })); return t0 + dur; };
  const wob = (pts, k, seed) => { const r = mulberry32(seed); let a = 0, b = 0; return pts.map((p) => { a += (r() - 0.5) * k; b += (r() - 0.5) * k; a *= 0.86; b *= 0.86; return [p[0] + a, p[1] + b]; }); };
  // the two ovals he tries first: faint, round and long; rubbed out when the jaw is in
  add(wob(PEN.arc(0, -22, 214, 240, -1.9, -1.9 + TAU * 1.14, 46), 5, 11), T.ov1, 0.56, { w: 4, a: 0.34, out: [T.rub0 + 0.02, T.rub0 + 0.4] });
  add(wob(PEN.arc(0, -8, 172, 296, -1.25, -1.25 + TAU * 1.12, 46), 5, 12), T.ov2, 0.56, { w: 4, a: 0.34, out: [T.rub0 + 0.02, T.rub0 + 0.4] });
  add(FL.jaw, T.jaw0, T.jaw1 - T.jaw0, { w: 7.5, a: 0.92 });
  {                                                            // the flurry: everything else in the face, fitted into its window
    const q = [];
    const put = (p, d, o) => q.push([p, d, o || {}]);
    FL.ears.forEach((p) => put(p, 0.05, { w: 5 })); FL.neck.forEach((p) => put(p, 0.04, { w: 5 })); FL.shoulders.forEach((p) => put(p, 0.06, { w: 5.5 }));
    put(FL.crown, 0.13, { w: 6.5, a: 0.9 }); put(FL.brim, 0.12, { w: 6, a: 0.9 }); put(FL.seam, 0.04, { w: 3.5, a: 0.5 });
    FL.brows.forEach((p) => { for (const dy of [-3, 0, 3]) put(p.map((v) => [v[0], v[1] + dy]), 0.028, { w: 5, a: 0.75 }); });
    FL.lidsUp.forEach((p) => put(p, 0.05, { w: 5.5, a: 0.9 })); FL.lidsDn.forEach((p) => put(p, 0.04, { w: 3, a: 0.5 }));
    FL.iris.forEach((p) => put(p, 0.05, { w: 4 })); FL.pupil.forEach((p) => put(p, 0.05, { w: 5.5, a: 0.95 }));
    FL.nose.forEach((p, i) => put(p, 0.032, { w: i > 3 ? 3 : 4.5, a: i > 3 ? 0.45 : 0.8 })); FL.mouth.forEach((p, i) => put(p, 0.045, { w: i ? 3 : 5, a: i ? 0.45 : 0.85 }));
    put(FL.must, 0.09, { w: 4 }); FL.mustFill.forEach((p) => put(p, 0.011, { w: 4.5, a: 0.8 })); FL.brimFill.forEach((p) => put(p, 0.012, { w: 4, a: 0.7 }));
    const tot = q.reduce((a, b) => a + b[1], 0), k = (T.fl1 - T.fl0 - 0.06) / tot; let t = T.fl0;
    for (const [p, d, o] of q) t = add(p, t, d * k, o);
  }
  add(FL.mole, T.dot, 0.34, { w: 6, a: 0.96 });
  { let t = T.shade0; for (const p of [...FL.shade, ...FL.shade2, ...FL.neckShade]) t = add(p, t, 0.0105, { w: 3.2, a: 0.42 }); }
  { const n = FL.capFill.length, d = (T.cap1 - T.cap0) / n; FL.capFill.forEach((p, i) => add(p, T.cap0 + i * d, d * 0.92, { w: 9, a: 0.72, col: 'm' })); }
  const MOVES = [[T.fl1 + 0.05, 150, 130, 70], [T.q2 + 0.55, 84, 40, 34], [T.q2 + 1.15, -84, 40, 34], [T.q2 + 1.75, 84, 40, 34], [T.fing0 + 0.3, 250, 250, 110], [T.tap + 0.05, 250, 250, 110],
    [T.dot + 0.5, -40, 120, 60], [T.cap0 - 0.07, 380, 150, 150], [T.cap1 + 0.05, 300, -60, 110]];
  const DIR = (() => { const v = [0.52, 0.42, 0.74], l = Math.hypot(...v); return v.map((x) => x / l); })();
  const tipAt = (t) => PEN.tipAt(S, t, MOVES);
  const penCol = (t) => (t >= T.cap0 - 0.07 ? 'm' : 'g');
  // the pencil in his hand, as this camera sees it. o.ghosts: the hand a moment ago, twice (his hand in three places at once)
  function penNow(g, c, t, o = {}) {
    const one = (tt, a) => {
      const tp = o.tip || tipAt(tt), lean = 0.10 * Math.sin(tt * 9.1) + (o.lean || 0), dir = [DIR[0] + lean * 0.5, DIR[1] - lean * 0.3, DIR[2]];
      const e3 = c.P(tp[0] + 640, tp[1] + 600, 360) || [1500, 2300];
      PEN.held(g, c, [tp[0], tp[1], tp[2] + (o.z || 0)], dir, o.elbow || [e3[0], e3[1]], { col: penCol(tt), a, skin: [ART.L.skinH, ART.L.skin, ART.L.skinD], ...o });
    };
    if (o.ghosts) { one(t - 0.066, 0.22); one(t - 0.033, 0.4); }
    one(t, 1);
  }
  // what's left of his face in your head, on the sheet: the man himself, grey and soft, going
  let GHOST = null;
  function ghost(g, c, a, blur) {
    if (a < 0.01) return;
    if (!GHOST) { GHOST = Q.offscreen(900, 1000); const b = GHOST.getContext('2d'); b.translate(450, 520); figure(b, THIEF0, 0, 0, 1, { legs: false, rim: 0, cap: 1, look: [0, 2], frown: 0.2 }); }
    PEN.affine(g, c, 0, 0, (sc) => { g.globalAlpha *= a; g.filter = `blur(${(blur * Math.min(1.5, sc)).toFixed(1)}px) grayscale(0.82) contrast(0.82)`; g.drawImage(GHOST, -450, -520); });
  }
  const ghostA = (t) => key(t, [[T.drain, 0], [3.8, 0.78], [T.ride0, 0.6], [T.face0, 0.42], [T.swing0, 0.3], [T.fl0, 0.16], [T.q2 + 0.2, 0]])[0];
  const ghostB = (t) => key(t, [[T.drain, 8], [3.6, 22], [T.ride0, 30], [T.swing0, 40], [T.q2, 50]])[0];
  // a flat sheet facing us, the finished drawing on it: the face's centre at (x, y)
  function sheetAt(g, x, y, sc, rot, o = {}) {
    const c = PEN.cam({ tx: 0, ty: 0, d: 1500 / sc, f: 1500, cx: x, cy: y, roll: rot });
    g.save(); g.globalAlpha *= o.paper ?? 1; PEN.sheet(g, c, { shadow: o.shadow, flecks: sc > 0.55 }); g.restore();
    if (o.wanted) PEN.affine(g, c, 0, 0, () => { txt(g, 'WANTED', 0, -356, 150, '#b3261c', { align: 'center', ls: 5 }); g.strokeStyle = '#b3261c'; g.lineWidth = 9; g.strokeRect(-356, -486, 712, 992); });
    PEN.strokes(g, c, S, o.t ?? 99, { a: o.ink ?? 1 });
    return c;
  }
  // your hand under a sheet's lower corner, and the thumb over it
  function myHand(g, x, y, sc, layer) {
    g.save(); g.translate(x, y); g.scale(sc, sc);
    if (layer === 'back') { g.fillStyle = lg(g, -200, 0, 200, 500, [0, '#4a6a94'], [1, '#2c4466']); g.beginPath(); g.moveTo(-250, 190); g.lineTo(60, 120); g.lineTo(200, 900); g.lineTo(-330, 900); g.closePath(); g.fill(); g.fillStyle = lg(g, -120, -60, 120, 200, [0, SKN[0]], [1, SKN[1]]); ell(g, -60, 110, 150, 120, -0.3); g.fill(); }
    else { g.strokeStyle = SKN[1]; g.lineCap = 'round'; g.lineWidth = 74; g.beginPath(); g.moveTo(-110, 110); g.quadraticCurveTo(-40, 20, 40, -40); g.stroke(); g.fillStyle = 'rgba(255,240,226,0.5)'; ell(g, 34, -34, 24, 28, -0.9); g.fill(); }
    g.restore();
  }

  // ================================================================ shot 1 · the chai stall: the snatch, on frame 0
  const F0 = { x: 520, y: 990, s: 1.42 };
  const NECK = [250, 1990];
  function hookPose(t) {
    const d = t - T.snap, yank = sstep(-0.1, 0.03, d), turn = sstep(0.14, 0.34, d), run = sstep(0.2, 1.0, d);
    const o = { yaw: lerp(-0.1, 0.92, turn), headYaw: lerp(0.07, 0.22, turn), back: turn > 0.62, faceMix: 1 - sstep(0.45, 0.7, turn), look: [lerp(2, -4, yank), 3], frown: 0.26, smirk: 0.55 * (1 - yank), smile: 0.12,
      browY: 3, close: 0, walk: 2.2 * run, phase: d * 15, legs: false, cap: 1, rim: 1, tilt: -0.05 + 0.09 * yank, op: 0.04 + 0.05 * yank };
    const fx = lerp(lerp(205, 250, yank), 180, turn), fy = lerp(lerp(285, 250, yank), 240, turn);
    o.arms = { r: { ...armIK(o, 1, fx, fy, 46), hand: 'fist', w: 1 - 0.5 * run } };
    return { x: F0.x + 34 * yank + 1560 * Math.pow(run, 1.5), y: F0.y + 16 * run, s: F0.s * (1 + 0.1 * run), o, yank, turn, run, d };
  }
  const BEADS = (() => { const r = mulberry32(3838), out = []; for (let i = 0; i < 18; i++) out.push({ vx: (r() - 0.35) * 900, vy: -300 - r() * 900, r: 9 + r() * 6, ph: r() * 6, fl: 1510 + r() * 60 }); return out; })();
  function bead(g, x, y, r) { g.fillStyle = '#b5811a'; ell(g, x, y + r * 0.12, r, r); g.fill(); g.fillStyle = rg(g, x - r * 0.3, y - r * 0.3, 1, r, [0, '#fff3b0'], [0.5, '#f4c53a'], [1, '#d99a1c']); ell(g, x, y, r * 0.92, r * 0.92); g.fill(); }
  function chain(g, a, b, sag = 0, n) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]); n = n || Math.max(2, Math.round(len / 30));
    for (let i = 0; i <= n; i++) { const u = i / n; bead(g, lerp(a[0], b[0], u), lerp(a[1], b[1], u) + sag * Math.sin(u * PI), 12); }
  }
  function stallTop(g, tw) {                                   // the tarp over you, and its bulbs
    g.fillStyle = lg(g, 0, 60, 0, 300, [0, '#2b6fb3'], [1, '#1f4f82']); g.beginPath(); g.moveTo(-300, -40); g.lineTo(1400, -40); g.lineTo(1400, 200);
    for (let i = 0; i <= 10; i++) { const x = 1400 - i * 170; g.quadraticCurveTo(x - 85, 290, x - 170, 212); } g.lineTo(-300, -40); g.closePath(); g.fill();
    for (let i = 0; i < 8; i++) { const x = 40 + i * 150, y = 262 + 24 * Math.sin(i * 1.1 + 0.4 * Math.sin(tw * 1.3 + i)); g.strokeStyle = 'rgba(30,25,20,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 208); g.lineTo(x, y - 14); g.stroke(); bulb(g, x, y, 0.55, 0.85 + 0.15 * Math.sin(tw * 2 + i)); }
  }
  function lane(g, tw, dx, dy, blur) {                         // the series' lane, soft, behind whoever's at the stall
    const bg = buf(0), gb = bg.getContext('2d'); reset(gb); gb.clearRect(0, 0, W, H);
    gb.save(); gb.translate(dx, dy + 150); Q.setView(1400, 900); Q.world(gb, 1400, tw); Q.light(gb, tw); Q.setView(1400, 0); gb.restore();
    g.save(); g.filter = `blur(${blur}px)`; g.drawImage(bg, 0, 0); g.restore();
    g.fillStyle = 'rgba(255,190,120,0.10)'; g.fillRect(0, 0, W, H);
  }
  function counter(g) { g.fillStyle = lg(g, 0, 1500, 0, 1920, [0, '#9a6a3c'], [1, '#6a4423']); g.fillRect(-300, 1500, 1700, 500); g.fillStyle = 'rgba(255,236,200,0.22)'; g.fillRect(-300, 1500, 1700, 10); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 6; i++) g.fillRect(-300 + i * 290, 1500, 5, 500); }
  function hookTitles(g, t) { const a = 1 - sstep(T.gone + 0.2, T.gone + 0.6, t); if (a > 0) { title(g, 'ONLY YOU SAW', 372, 118, CREAM, t, -1, { a }); title(g, 'HIS FACE', 490, 138, YEL, t, -1, { a }); } title(g, 'ONE SECOND', 470, 170, CREAM, t, T.one, { a: 1 - sstep(3.3, 3.7, t) }); }
  function shotHook(g, t, o = {}) {
    const th = hookPose(t), d = th.d, tw = t, sh = Q.shakeAt(t, [[T.snap, 16]]), pan = -520 * sstep(T.snap + 0.3, T.gone + 0.5, t);
    lane(g, tw, sh[0] * 0.4 + pan * 0.6, sh[1] * 0.4, lerp(6, 3, sstep(T.gone, T.gone + 0.6, t)));
    g.save(); g.translate(sh[0] + pan * 0.25, sh[1]); stallTop(g, tw); g.restore();
    g.save(); g.translate(sh[0], sh[1]);
    if (o.cap !== undefined) th.o.cap = o.cap;
    figure(g, THIEF0, th.x, th.y, th.s, th.o);
    g.save(); g.translate(-sh[0] * 0.4, -sh[1] * 0.4); counter(g); g.restore();
    // the chain: taut from your neck to his fist, side-on; it snaps, the long end falls back to you, the short end goes with him
    const w = wristOf(th.o, 1), dir = [-Math.sin(w.ang), Math.cos(w.ang)], fist = [th.x + (w.x + dir[0] * 50) * th.s, th.y + (w.y + dir[1] * 50) * th.s];
    if (d < 0) { const tr = 2.5 * Math.sin(t * 90) * th.yank; chain(g, [NECK[0], NECK[1]], [fist[0], fist[1] + tr], -3 * (1 - th.yank)); }
    else {
      const brk = [lerp(NECK[0], fist[0], 0.62), lerp(NECK[1], fist[1], 0.62)], fall = sstep(0, 0.22, d);
      if (fall < 1) chain(g, NECK, [lerp(brk[0], NECK[0], fall), lerp(brk[1], NECK[1] - 60, fall)], 40 * fall);
      const sw = 0.9 * Math.exp(-d * 3) * Math.sin(d * 14) + 0.5 * th.run; chain(g, fist, [fist[0] + 150 * Math.sin(sw + 0.5), fist[1] + 150 * Math.cos(sw + 0.5)], 0, 6);
      for (const b of BEADS) {                                 // loose beads: up, over, down onto the counter, a bounce or two, a roll
        const tf = (-b.vy + Math.sqrt(b.vy * b.vy + 2 * 2600 * Math.max(1, b.fl - brk[1]))) / 2600;
        let x = brk[0] + b.vx * Math.min(d, tf + 0.5) * (d > tf ? 0.7 : 1), y;
        if (d < tf) y = brk[1] + b.vy * d + 1300 * d * d; else { const q = d - tf; y = b.fl - Math.abs(Math.sin(q * 11)) * 120 * Math.exp(-q * 5); x += 40 * (1 - Math.exp(-q * 2)) * Math.sign(b.vx); }
        if (x > -40 && x < W + 40) bead(g, x, y, b.r);
      }
    }
    g.restore();
    if (!o.noTitle) hookTitles(g, t);
    return th;
  }

  // ================================================================ the station: the sheet, the artist, the pencil
  const CLOSE0 = { tx: 0, ty: -10, d: 800, el: PI / 2, f: 1500, cx: 540, cy: 960 };
  const MASTER = { tx: 30, ty: 60, d: 2750, az: -0.36, el: 0.9, f: 1500, cx: 640, cy: 1230 };
  const TOP = { tx: 0, ty: 30, d: 1070, el: PI / 2, f: 1500, cx: 540, cy: 930 };
  function wall(g, o = {}) {                                   // a government office: cream over blue-grey, a tube light, a clock
    const dy = o.dado ?? 760;
    g.fillStyle = lg(g, 0, 0, 0, dy, [0, '#f6e9c9'], [1, '#ecdcb6']); g.fillRect(0, 0, W, dy);
    g.fillStyle = lg(g, 0, dy, 0, H, [0, '#7f9bb0'], [1, '#5f7a90']); g.fillRect(0, dy, W, H - dy);
    g.fillStyle = '#4f6a80'; g.fillRect(0, dy - 8, W, 16);
    g.fillStyle = rg(g, o.lx ?? 620, 200, 20, 900, [0, 'rgba(255,255,240,0.5)'], [1, 'rgba(255,255,240,0)']); g.fillRect(0, 0, W, 1100);
  }
  function clock(g, x, y, r, t) {
    g.fillStyle = '#2f3540'; ell(g, x, y, r + 10, r + 10); g.fill(); g.fillStyle = '#fbf6ea'; ell(g, x, y, r, r); g.fill();
    g.strokeStyle = '#2f3540'; g.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.lineWidth = i % 3 ? 3 : 6; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82); g.lineTo(x + Math.cos(a) * r * 0.93, y + Math.sin(a) * r * 0.93); g.stroke(); }
    const hand = (a, l, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); g.stroke(); };
    hand(1.9, r * 0.5, 8, '#2f3540'); hand(4.4, r * 0.72, 6, '#2f3540');
    const sec = Math.floor(t) + sstep(0, 0.12, t - Math.floor(t)); hand(sec * TAU / 60 + 0.6, r * 0.8, 3, RED);
  }
  function desk(g) { g.fillStyle = lg(g, 0, 0, W, H, [0, '#9a6a3e'], [1, '#6f4826']); g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(60,30,10,0.16)'; g.lineWidth = 6; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-50, 120 + i * 230); g.bezierCurveTo(300, 80 + i * 230, 700, 180 + i * 230, 1130, 110 + i * 230); g.stroke(); } }
  function board(g, c) {                                       // the drawing board under the sheet, and the clip that holds it
    const S0 = PEN.SHEET, m = 70;
    if (PEN.poly(g, c, [[S0.x0 - m + 20, S0.y0 - m - 40 + 26], [S0.x1 + m + 20, S0.y0 - m - 40 + 26], [S0.x1 + m + 20, S0.y1 + m + 26], [S0.x0 - m + 20, S0.y1 + m + 26]])) { g.fillStyle = 'rgba(40,24,10,0.3)'; g.fill(); }
    if (PEN.poly(g, c, [[S0.x0 - m, S0.y0 - m - 40], [S0.x1 + m, S0.y0 - m - 40], [S0.x1 + m, S0.y1 + m], [S0.x0 - m, S0.y1 + m]], 0)) { g.fillStyle = '#5d6b5a'; g.fill(); g.strokeStyle = '#46523f'; g.lineWidth = 6; g.stroke(); }
  }
  function clip(g, c) { if (PEN.poly(g, c, [[-130, -574], [130, -574], [130, -494], [-130, -494]], 6)) { g.fillStyle = '#b9bec5'; g.fill(); g.strokeStyle = '#7d848d'; g.lineWidth = 3; g.stroke(); } if (PEN.poly(g, c, [[-96, -564], [96, -564], [96, -540], [-96, -540]], 8)) { g.fillStyle = '#e6e9ed'; g.fill(); } }
  function paper(g, c, t, o = {}) { board(g, c); PEN.sheet(g, c, {}); clip(g, c); const lie = sstep(0.5, 0.85, c.o.el ?? PI / 2); ghost(g, c, ghostA(t) * (o.gk ?? 1) * lie, ghostB(t)); PEN.strokes(g, c, S, t, o); }
  // his face, big: the acting. p: figure options on top of the defaults
  function artist(g, t, x, y, s, p = {}) {
    const say = talk(t, T.a1, T.a1e) + talk(t, T.ride0, T.ride0 + 1.3) + talk(t, T.jaw0, T.jaw0 + 0.5) + talk(t, T.q2, T.q2 + 1.7) + talk(t, T.dot, T.dot + 0.6) + talk(t, T.up + 0.1, T.up + 0.8);
    figure(g, ART, x, y, s, { legs: false, rim: 1, close: blinkAt(t, 3, 2.7), op: say, arms: { r: { a1: 0.02, a2: 0.05, hand: 'hidden' }, l: { a1: 0.05, a2: 0.1 } }, breath: 3 * Math.sin(t * 1.4), ...p });
  }
  // 3.9–5.9: the white settles into a sheet; we pull back to his shoulder; he turns to you
  function shotMaster(g, t) {
    const u = sstep(T.st0, T.master, t), c = PEN.cam(PEN.mixCam(CLOSE0, MASTER, u)), tw = t;
    wall(g, { dado: 700, lx: 700 }); clock(g, 838, 400, 84, t);
    g.fillStyle = lg(g, 0, 900, 0, H, [0, '#a06f42'], [1, '#6f4826']); g.beginPath(); g.moveTo(-40, 1010); g.lineTo(W + 40, 880); g.lineTo(W + 40, H); g.lineTo(-40, H); g.closePath(); g.fill();
    const turn = sstep(T.a1 - 0.25, T.a1 + 0.2, t), ax = 262, tap = Math.abs(Math.sin((t - T.a1) * 9)) * sstep(T.a1 + 0.3, T.a1 + 0.5, t) * (1 - sstep(T.ride0 - 0.3, T.ride0, t));
    artist(g, t, ax, 590, 0.9, { yaw: lerp(0.62, 0.3, turn), headYaw: lerp(0.3, -0.34, turn), look: [lerp(10, -3, turn), lerp(9, 0, turn)], browY: -9 * turn, browUp: 8 * turn, tilt: 0.05 * turn, frown: 0.1 });
    const sx = ax + 250 * 0.9, sy = 590 + 350 * 0.9, tp = [150 - 60 * turn, 210 + 30 * turn, 6 + 26 * tap], gp = c.P(tp[0] + DIR[0] * 215, tp[1] + DIR[1] * 215, tp[2] + DIR[2] * 215) || [700, 1300], elb = [lerp(sx, gp[0], 0.34) + 40, lerp(sy, gp[1], 0.34) + 230];
    paper(g, c, t);
    const arm = sstep(0.55, 0.95, u);
    g.save(); g.globalAlpha = arm; g.strokeStyle = lg(g, sx, sy, elb[0], elb[1], [0, KHAKI.a], [1, KHAKI.b]); g.lineCap = 'round'; g.lineWidth = 128; g.beginPath(); g.moveTo(sx, sy); g.lineTo(elb[0], elb[1]); g.stroke();
    penNow(g, c, t, { tip: tp, elbow: elb, k: 1.5, cuff: false }); g.restore();
  }
  // 5.9–7.6: low over the sheet. Two faint ovals, a round one and a long one; the tip goes round each
  function rideBG(g, hz, az) {
    g.fillStyle = lg(g, 0, 0, 0, hz, [0, '#e9d8b0'], [1, '#f6ead0']); g.fillRect(0, 0, W, hz + 2);
    for (const [a, c0, w] of [[0.4, 'rgba(255,255,255,0.55)', 520], [2.6, 'rgba(90,120,150,0.30)', 700], [4.6, 'rgba(160,110,70,0.28)', 600]]) { let dx = ((a - az + PI * 3) % TAU) - PI; const x = 540 + dx * 900; g.fillStyle = rg(g, x, hz - 260, 10, w, [0, c0], [1, 'rgba(255,255,255,0)']); g.fillRect(x - w, 0, w * 2, hz); }
    g.fillStyle = lg(g, 0, hz, 0, H, [0, '#b5855a'], [1, '#8a5a34']); g.fillRect(0, hz, W, H - hz);
  }
  function shotOvals(g, t) {
    const tp = tipAt(t), u = sstep(T.ride0, T.face0, t), unsure = sstep(T.ov2 + 0.6, T.face0, t);
    const o = { tx: tp[0] * 0.5, ty: tp[1] * 0.5 + 40, d: lerp(1050, 880, u), az: 0.3 + 0.16 * Math.sin((t - T.ride0) * 1.7), el: 0.42, f: 1250, cx: 540, cy: 1180, roll: 0.07 * unsure * Math.sin((t - T.ov2) * 5.2) - 0.02 };
    const c = PEN.cam(o);
    rideBG(g, o.cy - o.f * Math.tan(o.el) - 30, o.az);
    paper(g, c, t); penNow(g, c, t, { k: 1.5 });
  }
  // 7.6–9.45: he looks at you over his spectacles and waits. You don't know. He nods: a guess will do
  function shotFace(g, t) {
    const u = sstep(T.face0, T.swing0, t), nod = winK(t, T.nod, T.nod + 0.14, T.nod + 0.2, T.nod + 0.42), down = sstep(T.nod + 0.12, T.swing0, t), z = 1 + 0.05 * u;
    g.save(); g.translate(540, 900); g.scale(z, z); g.translate(-540, -900);
    wall(g, { dado: 1180, lx: 300 }); clock(g, 850, 430, 108, t);
    g.fillStyle = '#d7c79a'; R(g, 86, 330, 250, 330, 6); g.fill(); g.fillStyle = '#fbf6ea'; R(g, 104, 348, 214, 294, 3); g.fill(); g.fillStyle = 'rgba(60,60,70,0.25)'; for (let i = 0; i < 7; i++) g.fillRect(128, 384 + i * 34, 166 - (i % 3) * 40, 8);
    const wait = 1 - down;
    artist(g, t, 520, 880 + 26 * nod, 1.46, { yaw: 0.06, headYaw: -0.05, look: [0, lerp(-5, 12, down)], browY: -12 * wait + 4 * down, browUp: 16 * wait * (0.6 + 0.4 * Math.sin(t * 2.2)), tilt: 0.05 * wait + 0.03 * nod, smile: 0.06, frown: 0.05, close: Math.max(blinkAt(t, 3, 2.7), 0.35 * down) });
    // his pencil, tapping the edge of the board while he waits
    const tap = Math.abs(Math.sin((t - T.face0) * 7.5)) * wait, c = PEN.cam({ tx: 0, ty: 0, d: 1500, el: PI / 2, f: 1500, cx: 900, cy: 1700 });
    g.fillStyle = '#5d6b5a'; g.beginPath(); g.moveTo(560, 1640); g.lineTo(1200, 1560); g.lineTo(1200, 2000); g.lineTo(520, 2000); g.closePath(); g.fill();
    PEN.held(g, c, [-130, -80, 10 + 40 * tap], [0.3, 0.5, 0.81], [1250, 2150], { skin: [ART.L.skinH, ART.L.skin, ART.L.skinD], k: 2.3, len: 700 });
    g.restore();
  }
  // 9.45–10.3: one dark line round a round jaw; the camera rides behind the tip and swings with it, then lifts
  function shotSwing(g, t) {
    const u = clamp((t - T.jaw0) / (T.jaw1 - T.jaw0)), e = u * u * (3 - 2 * u), tp = tipAt(t), up = sstep(0.45, 1, u);
    const az = PI * 0.96 + PI * 0.78 * e, o = { tx: tp[0] - Math.sin(az) * 30, ty: tp[1] - Math.cos(az) * 30, d: lerp(560, 1500, up * up), az, el: lerp(0.3, 0.72, up), f: 1200, cx: 540, cy: lerp(1260, 1040, up), roll: 0.1 * Math.sin(e * PI) };
    const c = PEN.cam(o);
    rideBG(g, o.cy - o.f * Math.tan(o.el) - 30, az);
    paper(g, c, t); penNow(g, c, t, { k: 1.5 });
  }
  // 10.3–10.95: the long oval is rubbed out; he blows the crumbs at us
  const CRUMB = (() => { const r = mulberry32(3851), out = []; for (let i = 0; i < 26; i++) out.push({ x: (r() - 0.5) * 420, y: 180 + r() * 170, r: 5 + r() * 7, t: r() * 0.35, vx: (r() - 0.5) * 900, vy: 500 + r() * 900, vz: 500 + r() * 1100 }); return out; })();
  function crumbs(g, c, t) {
    const list = [];
    for (const k of CRUMB) { const born = T.rub0 + 0.04 + k.t; if (t < born) continue; const d = Math.max(0, t - T.blow - k.t * 0.2), fly = d * d * 3 + d; list.push([k.x + k.vx * fly, k.y + k.vy * fly, k.r, 1 - sstep(0.25, 0.5, d), k.vz * fly]); }
    PEN.specks(g, c, list, (a) => `rgba(120,112,118,${0.8 * a})`);
  }
  function shotRub(g, t) {
    const u = sstep(T.rub0, T.fl0, t), c = PEN.cam({ tx: 0, ty: 60, d: lerp(1750, 1500, u), az: -0.12, el: 1.08, f: 1500, cx: 540, cy: 1010 });
    desk(g); paper(g, c, t);
    const rub = sstep(T.rub0, T.rub0 + 0.06, t) * (1 - sstep(T.blow - 0.1, T.blow, t)), ph = (t - T.rub0) * 26, tp = [-120 * Math.cos(ph) * (0.6 + 0.4 * Math.sin(ph * 0.31)), 250 + 46 * Math.sin(ph * 0.5), 60 * (1 - rub)];
    crumbs(g, c, t);
    if (t < T.blow + 0.05) penNow(g, c, t, { tip: tp, flip: true, k: 1.5, lean: 0.3 });
    const b = winK(t, T.blow, T.blow + 0.06, T.blow + 0.12, T.blow + 0.3);    // his breath: a soft gust across the sheet, at us
    if (b > 0.01) { g.save(); g.globalAlpha = 0.32 * b; g.strokeStyle = '#ffffff'; g.lineCap = 'round'; g.lineWidth = 9; for (let i = 0; i < 3; i++) { const k = (t - T.blow) * 2.6, x = 380 + i * 150, y = 1150 + 520 * k + i * 30; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 26 - i * 26, y + 90, x - 16 + i * 40, y + 190); g.stroke(); } g.restore(); }
  }
  // 10.95–11.45: under the sheet, looking up through it. His face above, the lines arriving as shadows
  function shotUnder(g, t) {
    const c = PEN.cam({ tx: 0, ty: 0, d: 1500, el: PI / 2, f: 1500, cx: 540, cy: 1160 });
    g.fillStyle = '#f3dfb4'; g.fillRect(0, 0, W, H);
    const fb = buf(3), gb = fb.getContext('2d'); reset(gb); gb.clearRect(0, 0, W, H);
    figure(gb, ART, 540, 330, 2.3, { legs: false, rim: 0, look: [0, 12], close: 0.2, yaw: 0.05, arms: { r: { a1: 0.02, a2: 0.05, hand: 'hidden' }, l: { a1: 0.02, a2: 0.05, hand: 'hidden' } } });
    g.save(); g.globalAlpha = 0.5; g.filter = 'blur(20px) brightness(0.45) sepia(0.6)'; g.drawImage(fb, 0, 0); g.restore();
    g.save(); g.filter = 'blur(7px)'; g.fillStyle = 'rgba(255,250,225,0.55)'; for (const k of [-1, 1]) { R(g, 540 + k * 186 - 118, 196, 236, 140, 30); g.fill(); } g.restore();
    g.fillStyle = rg(g, 540, 1000, 80, 1150, [0, 'rgba(255,246,214,0.62)'], [1, 'rgba(232,198,140,0.35)']); g.fillRect(0, 0, W, H);
    const r = mulberry32(3877); g.strokeStyle = 'rgba(150,110,60,0.14)'; g.lineWidth = 2; for (let i = 0; i < 170; i++) { const x = r() * W, y = r() * H, a = r() * TAU, l = 14 + r() * 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    PEN.strokes(g, c, S, t, { mirror: true, col: [84, 58, 34], a: 0.9 });
    const tp = tipAt(t), p = c.P(-tp[0], tp[1]), q = c.P(-tp[0] - 420, tp[1] + 330);
    if (p && q) { g.save(); g.filter = 'blur(9px)'; g.strokeStyle = 'rgba(70,45,20,0.34)'; g.lineCap = 'round'; g.lineWidth = 60; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.fillStyle = 'rgba(60,40,20,0.3)'; ell(g, q[0] - 40, q[1] + 60, 230, 170); g.fill(); g.restore(); g.fillStyle = 'rgba(50,32,14,0.8)'; ell(g, p[0], p[1], 11, 11); g.fill(); }
  }
  // 11.45–17.6: straight down. The flurry; the tip over one cheek, then the other; your finger; the dot; the cap in maroon
  function finger(g, x, y, press) {
    g.save(); g.translate(x, y); g.rotate(-0.12); g.scale(1 - 0.04 * press, 1 - 0.04 * press);
    g.fillStyle = lg(g, -120, 500, 120, 900, [0, '#4a6a94'], [1, '#2c4466']); R(g, -150, 560, 330, 700, 60); g.fill();
    g.fillStyle = lg(g, -100, 200, 140, 700, [0, SKN[0]], [1, SKN[1]]); R(g, -110, 300, 250, 420, 100); g.fill();
    g.fillStyle = lg(g, -40, 0, 60, 380, [0, SKN[0]], [0.6, SKN[1]], [1, SKN[2]]); R(g, -42, 0, 84, 400, 42); g.fill();
    g.fillStyle = 'rgba(255,240,228,0.6)'; R(g, -27, 10, 54, 66, 24); g.fill();
    g.strokeStyle = 'rgba(110,55,30,0.22)'; g.lineWidth = 4; for (const yy of [150, 250]) { g.beginPath(); g.moveTo(-30, yy); g.quadraticCurveTo(0, yy + 9, 30, yy); g.stroke(); }
    g.restore();
  }
  const DUST = (() => { const r = mulberry32(3899), out = []; for (let i = 0; i < 20; i++) { const a = r() * TAU, d = 26 + r() * 46; out.push([M4.mole[0] + Math.cos(a) * d, M4.mole[1] + Math.sin(a) * d * 0.9, 1.6 + r() * 2.4, r()]); } return out; })();
  function shotTop(g, t) {
    const wide = sstep(T.shade0 - 0.1, T.cap0, t), inn = sstep(T.fl1 - 0.2, T.q2 + 0.5, t);
    const c = PEN.cam({ tx: 0, ty: lerp(lerp(-10, 30, inn), -50, wide), d: lerp(lerp(1250, 1070, inn), 1230, wide), el: PI / 2, f: 1500, cx: 540, cy: 930, roll: 0.012 * Math.sin(t * 0.9) });
    desk(g); paper(g, c, t);
    const dk = sstep(T.dot + 0.05, T.dot + 0.35, t); if (dk > 0) PEN.specks(g, c, DUST.map((d) => [lerp(M4.mole[0], d[0], dk), lerp(M4.mole[1], d[1], dk), d[2], 0.75 * dk]), (a) => `rgba(40,40,46,${a})`);
    // your finger: in from below, between the two cheeks, then onto the one at our left
    const fk = sstep(T.fing0, T.fing0 + 0.3, t) * (1 - sstep(T.dot + 0.25, T.dot + 0.6, t));
    if (fk > 0) {
      const wav = key(t, [[T.fing0, 0.2], [T.fing0 + 0.42, 0.85], [T.fing0 + 0.78, -0.5], [T.fing0 + 1.02, 0.25], [T.tap, -1], [T.tap + 9, -1]])[0], press = winK(t, T.tap - 0.04, T.tap + 0.05, T.tap + 0.12, T.tap + 0.3);
      const p = c.P(84 * wav, 62 + 74), y = lerp(H + 40, p[1] - 10 * press, fk);
      g.fillStyle = 'rgba(60,40,24,0.16)'; ell(g, p[0] + 22, y + 46, 52, 30); g.fill(); finger(g, p[0], y, press);
    }
    if (t < T.tear - 0.05) penNow(g, c, t, { ghosts: t < T.fl1 || (t > T.shade0 && t < T.cap1), k: 1.42 });
  }
  // 16.9–19.8: he tears it off and holds it up to you, his eyes over the top edge. That's him?
  const HELD = { x: 510, y: 1130, sc: 1.0 };
  function fingersOn(g, x, y, k) { for (let i = 0; i < 4; i++) { g.fillStyle = lg(g, 0, y - 10, 0, y + 90, [0, ART.L.skinH], [1, ART.L.skin]); R(g, x + k * (i * 40) - 17, y - 12 + (i % 2) * 5, 34, 86 - i * 6, 17); g.fill(); g.fillStyle = 'rgba(255,240,226,0.5)'; R(g, x + k * (i * 40) - 10, y + 44 - i * 6 + (i % 2) * 5, 20, 24, 9); g.fill(); } }
  function shotHeld(g, t, o = {}) {
    const u = sstep(T.tear, T.up, t), jolt = Q.kick(t, T.tear, 0.05, 30, 9), push = sstep(T.up, T.wipe, t);
    const sc = lerp(1.22, HELD.sc, u) * (1 + 0.035 * push), x = lerp(540, HELD.x, u), y = lerp(990, HELD.y, u), top = y - 520 * sc;
    if (u < 1) desk(g);
    g.save(); g.globalAlpha = u; wall(g, { dado: 1250, lx: 500 }); clock(g, 880, 520, 70, t); g.restore();
    const ask = sstep(T.up, T.up + 0.25, t);
    g.save(); g.globalAlpha = sstep(0.25, 0.7, u);
    artist(g, t, x + 6, lerp(top + 190, top - 34, sstep(0.3, 1, u)) - 8 * ask, 1.04, { yaw: 0, headYaw: 0, look: [0, lerp(8, 1, ask)], browY: -14 * ask, browUp: 6 * ask, tilt: -0.045 * ask, arms: { r: { a1: 0.02, a2: 0.05, hand: 'hidden' }, l: { a1: 0.02, a2: 0.05, hand: 'hidden' } } });
    g.restore();
    const c = sheetAt(g, x, y, sc, jolt, { t });
    const a = c.P(-390, -520), b = c.P(390, -520);
    g.save(); g.globalAlpha = sstep(0.4, 0.9, u); fingersOn(g, a[0] + 40, a[1], 1); fingersOn(g, b[0] - 40, b[1], -1); g.restore();
  }

  // ================================================================ the line: five men behind glass
  // Three stand on a step at the back (1, 3, 5), two in front of it (2, 4), so every face is big enough to read on a phone. Two and four,
  // the only two worth choosing between, stand level with each other.
  const POS = [{ x: 150, y: 560, s: 0.55 }, { x: 325, y: 850, s: 0.64 }, { x: 500, y: 560, s: 0.55 }, { x: 675, y: 850, s: 0.64 }, { x: 850, y: 560, s: 0.55 }];
  const SILL = 1180;
  const WIDE = { z: 1, cx: 540, cy: 700 };
  const closeOn = (i, dx = 0, dy = 0) => { const z = i % 2 ? 1.3 : 1.5; return { z, cx: POS[i].x + dx, cy: POS[i].y - 55 / z + dy }; };
  const mixV = (a, b, u) => ({ z: lerp(a.z, b.z, u), cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u) });
  const toScreen = (v, x, y) => [540 + (x - v.cx) * v.z, 700 + (y - v.cy) * v.z];
  // v: the view. o.pose(i, base): a man's pose, or null to leave him out; o.after(g): drawn in the room in front of them
  function lineRoom(g, t, v, o = {}) {
    g.save(); g.beginPath(); g.rect(0, 0, W, SILL); g.clip();
    g.translate(540, 700); g.scale(v.z, v.z); g.translate(-v.cx, -v.cy);
    g.fillStyle = lg(g, 0, 100, 0, 960, [0, '#f7ebcc'], [1, '#eedfb8']); g.fillRect(-500, -300, 2100, 1280);
    g.fillStyle = lg(g, 0, 960, 0, 1500, [0, '#86a1b5'], [1, '#6b879c']); g.fillRect(-500, 960, 2100, 800); g.fillStyle = '#58748a'; g.fillRect(-500, 954, 2100, 12);
    g.fillStyle = '#e9eef0'; R(g, 280, 196, 480, 22, 11); g.fill(); g.fillStyle = rg(g, 520, 210, 10, 620, [0, 'rgba(255,255,244,0.6)'], [1, 'rgba(255,255,244,0)']); g.fillRect(-200, 100, 1500, 700);
    const disc = (i) => { const p = POS[i], y = i % 2 ? p.y - p.s * 266 - 48 : 372; g.fillStyle = '#23262d'; ell(g, p.x, y, 34, 34); g.fill(); g.strokeStyle = '#fff6e2'; g.lineWidth = 3; g.stroke(); txt(g, String(i + 1), p.x, y + 20, 58, '#fff6e2', { kind: 'mono', align: 'center' }); };
    const man = (i) => {
      const base = { legs: false, rim: 1, yaw: 0, close: blinkAt(t, i + 4, 3.1 + i * 0.37), look: [0, 0], breath: 2 * Math.sin(t * 1.3 + i * 1.7) };
      const p = o.pose ? o.pose(i, base) : base; if (!p) return;
      figure(g, FIVE[i], POS[i].x + (p.dx || 0), POS[i].y + (p.dy || 0), POS[i].s, p);
    };
    for (const i of [0, 2, 4]) { g.fillStyle = 'rgba(120,96,60,0.16)'; ell(g, POS[i].x + 18, POS[i].y + 30, 130, 190); g.fill(); disc(i); }
    for (const i of [0, 2, 4]) man(i);
    g.fillStyle = 'rgba(60,44,30,0.10)'; g.fillRect(-500, 700, 2100, 700);                      // the back row sits a little in shade
    for (const i of [1, 3]) man(i);
    for (const i of [1, 3]) if (!(o.pose && o.pose(i, {}) === null)) disc(i);
    if (o.after) o.after(g);
    g.restore();
    // the glass, the frame, your side of it
    g.save(); g.globalAlpha = 0.07; g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(120, 0); g.lineTo(330, 0); g.lineTo(-220, SILL); g.lineTo(-430, SILL); g.closePath(); g.fill(); g.beginPath(); g.moveTo(790, 0); g.lineTo(870, 0); g.lineTo(330, SILL); g.lineTo(250, SILL); g.closePath(); g.fill(); g.restore();
    g.fillStyle = '#20242c'; g.fillRect(0, 0, W, 236); g.fillRect(0, 0, 26, SILL); g.fillRect(W - 26, 0, 26, SILL); g.fillStyle = '#343a45'; g.fillRect(0, 226, W, 10);
    g.fillStyle = lg(g, 0, SILL, 0, H, [0, '#2c323d'], [1, '#191c23']); g.fillRect(0, SILL, W, H - SILL); g.fillStyle = '#4a5260'; g.fillRect(0, SILL, W, 14); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, SILL + 14, W, 10);
  }
  const INHAND = { x: 250, y: 1290, sc: 0.5, rot: -0.06 };
  function inHand(g, p, o = {}) { myHand(g, p.x - 250 * p.sc, p.y + 500 * p.sc, p.sc * 1.2, 'back'); sheetAt(g, p.x, p.y, p.sc, p.rot, o); myHand(g, p.x - 250 * p.sc, p.y + 500 * p.sc, p.sc * 1.2, 'front'); }
  // 19.8–26.8: the sheet comes down into your hand and the line is behind it. Along them, close; then all five; 3, 2, 1
  function passView(e) {                                         // from one face to the next, 1 to 5
    const k = clamp(e) * 4, i = Math.min(3, Math.floor(k)), u = sstep(0, 1, k - i), a = POS[i], b = POS[i + 1], z = 1.42;
    return { z, cx: lerp(a.x, b.x, u), cy: lerp(a.y, b.y, u) - 55 / z };
  }
  function shotLine(g, t) {
    const pu = clamp((t - T.pass0) / (T.pass1 - T.pass0)), back = sstep(T.pass1, T.wide, t), v = mixV(passView(pu), WIDE, back);
    lineRoom(g, t, v);
    // the wipe: the held sheet swings up over the lens, and comes down into your hand
    const w0 = sstep(T.wipe, T.line0, t), w1 = sstep(T.line0, T.pass0 + 0.25, t);
    if (t < T.line0) { shotHeld(g, T.wipe - 0.01); const sc = lerp(HELD.sc * 1.035, 2.2, w0); sheetAt(g, lerp(HELD.x, 540, w0), lerp(HELD.y, 960, w0), sc, 0.05 * w0, {}); return; }
    const p = { x: lerp(540, INHAND.x, w1), y: lerp(960, INHAND.y, w1), sc: lerp(2.2, INHAND.sc, w1), rot: lerp(0.05, INHAND.rot, w1) + 0.012 * Math.sin(t * 1.1) };
    if (w1 > 0.6) inHand(g, p); else sheetAt(g, p.x, p.y, p.sc, p.rot, {});
    for (const [n, a, b] of [['3', T.c3, T.c2], ['2', T.c2, T.c1], ['1', T.c1, T.tw0]]) {
      if (t < a || t >= b) continue;
      const q = Q.pop(t, a), k = clamp((t - a) / (b - a));
      g.save(); g.translate(742, 1362); g.scale(lerp(0.7, 1, q), lerp(0.7, 1, q)); ring(g, 0, 0, 132, 1 - k, 12, n === '1' ? RED : YEL); txt(g, n, 0, 76, 224, CREAM, { align: 'center', stroke: INK, sw: 0.1 }); g.restore();
    }
  }
  // 26.8–34.2: your hand lifts the drawing to the glass, over number four. Every line lands on him
  function shotTwin(g, t) {
    const inn = sstep(T.tw0, T.tw0 + 0.7, t), side = sstep(T.side, T.side + 0.6, t), back = sstep(T.back, T.back + 0.7, t), hold = inn * (1 - back);
    const v = mixV(WIDE, closeOn(3, 20 + 120 * side), hold), hd = toScreen(v, POS[3].x, POS[3].y);
    lineRoom(g, t, v, { pose: (i, b) => (i === 3 ? { ...b, look: [lerp(0, 9, side) * (1 - back), 0] } : b) });
    const on = sstep(T.tw0 + 0.15, T.tw0 + 0.95, t) * (1 - back), clear = sstep(T.tw0 + 1.2, T.tw0 + 2.0, t) * (1 - side);
    const p = { x: lerp(lerp(INHAND.x, hd[0], on), 770, side * (1 - back)), y: lerp(INHAND.y, hd[1] + 14 * side, on), sc: lerp(lerp(INHAND.sc, POS[3].s * 1.3, on), 0.62, side * (1 - back)), rot: lerp(INHAND.rot, 0.02 * side, on) };
    if (on < 0.05) inHand(g, p); else { sheetAt(g, p.x, p.y, p.sc, p.rot, { paper: 1 - 0.74 * clear, shadow: clear < 0.3 }); const th = [p.x - 390 * p.sc + 36, p.y + 430 * p.sc]; if (th[1] < H) myHand(g, th[0], Math.min(th[1], 1560), 0.5, 'front'); }
    title(g, 'THE DRAWING', 1470, 150, YEL, t, T.tw0 + 1.0, { a: 1 - back });
  }
  // 34.2–36.3: the film runs backwards to frame 0, and stops on his face. A red pencil rings the mole
  const FREEZE = 0.3;
  function molePt(th, L = THIEF) { const o = th.o, sp = Math.sin(clamp(o.yaw || 0, -0.95, 0.95)), hx = th.x + 150 * sp * 0.42 * th.s, yw = clamp((o.headYaw || 0) + clamp(o.yaw || 0, -0.95, 0.95) * 0.6, -1.15, 1.15), Rf = 186 * L.jaw * 1.04; const mx = Rf * Math.sin(Math.asin(L.mole[0] / Rf) + yw), ct = Math.cos(o.tilt || 0), st = Math.sin(o.tilt || 0); return [hx + (mx * ct - L.mole[1] * st) * th.s, th.y + (mx * st + L.mole[1] * ct) * th.s]; }
  function redRing(g, x, y, r, k) { if (k <= 0) return; g.save(); g.lineCap = 'round'; for (const [w, a, j] of [[13, 0.9, 0], [6, 0.5, 4]]) { g.strokeStyle = `rgba(214,40,30,${a})`; g.lineWidth = w; g.beginPath(); for (let i = 0; i <= 40 * k; i++) { const a2 = -1.9 + i / 40 * TAU * 1.08, rr = r * (1 + 0.05 * Math.sin(i * 0.5 + j)); const px = x + Math.cos(a2) * rr * 1.08, py = y + Math.sin(a2) * rr; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); } g.restore(); }
  function shotRewind(g, t) {
    const u = sstep(T.rew0, T.rew1, t), tr = lerp(T.tw0 - 0.2, FREEZE, Math.pow(u, 0.7));
    if (tr > FREEZE + 0.001) { early(g, tr); g.save(); const r = mulberry32(Math.round(t * 30) + 77); g.fillStyle = 'rgba(190,215,255,0.10)'; g.fillRect(0, 0, W, H); for (let i = 0; i < 9; i++) { const y = r() * H; g.fillStyle = `rgba(255,255,255,${0.10 + 0.25 * r()})`; g.fillRect(0, y, W, 3 + r() * 16); } g.restore(); txt(g, '◀◀', 96, 372, 96, CREAM, { kind: 'mono', stroke: INK, sw: 0.14 }); return; }
    const th = shotHook(g, FREEZE, { noTitle: true }), m = molePt(th);
    redRing(g, m[0], m[1], 50, sstep(T.ring, T.ring + 0.3, t));
  }
  // 36.3–38.0: the frame becomes a card and comes to number two. The cap lifts off the card: the same bare crown, the mole on the same cheek
  function shotCard(g, t) {
    const u = sstep(T.card, T.two, t), v = closeOn(1, -150), capU = sstep(T.two + 0.25, T.two + 0.85, t), hd = toScreen(v, POS[1].x, POS[1].y), hs = POS[1].s * v.z;
    lineRoom(g, t, v, { pose: (i, b) => (i === 1 ? { ...b, look: [-7 * sstep(T.two + 0.9, T.two + 1.2, t), 0], smirk: 0.3 * capU, smile: 0.06 * capU } : b) });
    // the card: frame 0, cropped to him
    const k = lerp(1, 0.6, u), cx = lerp(540, 272, u), cy = lerp(960, 742, u), cw = lerp(W, 460, u), ch = lerp(H, 600, u), rad = 34 * u;
    g.save(); g.translate(cx, cy); g.rotate(-0.045 * u);
    g.fillStyle = 'rgba(0,0,0,0.3)'; R(g, -cw / 2 + 10, -ch / 2 + 14, cw, ch, rad); g.fill();
    g.save(); R(g, -cw / 2, -ch / 2, cw, ch, rad); g.clip(); g.scale(k, k); g.translate(-lerp(540, F0.x + 20, u), -lerp(960, F0.y - 40, u));
    const th = shotHook(g, FREEZE, { noTitle: true, cap: 1 - capU * 0.999 }), m = molePt(th); redRing(g, m[0], m[1], 50, 1);
    g.restore();
    if (u > 0.02) { g.strokeStyle = '#fffaf0'; g.lineWidth = 12 * u; R(g, -cw / 2, -ch / 2, cw, ch, rad); g.stroke(); }
    g.restore();
    redRing(g, hd[0] + 84 * hs, hd[1] + 62 * hs, 36, sstep(T.two + 0.95, T.two + 1.25, t));
    title(g, 'THE MAN', 1470, 150, YEL, t, T.two + 0.2);
  }
  // 38.0–43.2: you hold the drawing up beside him. The constable looks from one to the other, shakes her head, and thumbs him out
  const COPS = 0.72;
  function shotCop(g, t) {
    const inn = sstep(T.cop0, T.cop0 + 0.5, t), v = mixV(closeOn(1, -150), closeOn(1, 55), inn), go = sstep(T.out, T.cuff0 - 0.1, t), sh = winK(t, T.shake, T.shake + 0.1, T.thumb - 0.2, T.thumb), th = sstep(T.thumb, T.thumb + 0.25, t);
    const lookS = sstep(T.cop0 + 0.6, T.cop0 + 0.9, t) * (1 - sstep(T.cop0 + 1.5, T.cop0 + 1.8, t));
    lineRoom(g, t, v, {
      pose: (i, b) => (i === 1 ? { ...b, dx: -700 * go * go, yaw: -0.85 * sstep(0, 0.3, go), walk: 1.1 * sstep(0.1, 0.4, go), phase: go * 9, smirk: 0.35, smile: 0.08, look: [lerp(0, -8, th), 0] } : b),
      after: (gg) => {
        const o = { legs: false, rim: 1, yaw: 0.55, headYaw: lerp(0.5, 0.1, lookS) + 0.22 * sh * Math.sin((t - T.shake) * 13), look: [lerp(6, 16, lookS), 2], frown: 0.18 + 0.2 * sh, close: blinkAt(t, 9, 3.3), browY: 4 * sh, breath: 2 * Math.sin(t * 1.5) };
        o.arms = { r: { ...armIK(o, 1, lerp(250, 150, th) - 40 * Math.sin((t - T.thumb) * 11) * th * Math.exp(-(t - T.thumb) * 2.2), lerp(560, 110, th), 60, 'out'), hand: 'point', w: th } };
        o.tilt = -0.07 * th;
        figure(gg, COP, lerp(POS[1].x - 560, POS[1].x - 318, inn), POS[1].y + 34, COPS, o);
      },
    });
    const p = { x: 806, y: 1010 - 130 * inn, sc: 0.52, rot: 0.05 - 0.02 * Math.sin(t * 1.3) };
    inHand(g, p);
  }
  // 43.2–49.6: the cuffs go on number four. He looks at the drawing, then at us
  function shotCuffs(g, t) {
    const pan = sstep(T.cuff0, T.cuff0 + 0.7, t), v = mixV(closeOn(1, 55), closeOn(3, 0, 44), pan), up = sstep(T.cuff0 + 0.5, T.click - 0.15, t), ck = sstep(T.click, T.click + 0.12, t);
    const toDraw = sstep(T.click + 0.5, T.click + 0.9, t) * (1 - sstep(T.click + 1.9, T.click + 2.3, t)), toUs = sstep(T.click + 1.9, T.click + 2.3, t);
    let wr = null;
    lineRoom(g, t, v, {
      pose: (i, b) => {
        if (i === 1) return null;
        if (i !== 3) return b;
        const o = { ...b, look: [lerp(0, -12, toDraw), lerp(lerp(0, 9, ck * (1 - toDraw) * (1 - toUs)), 7, toDraw)], worry: 9 * ck, browY: -5 * ck, op: 0.07 * ck + 0.05 * toUs, tilt: 0.03 * toUs, close: (b.close || 0) * (1 - ck) };
        o.arms = { l: { ...armIK(o, -1, -58, 400, 50), hand: 'fist', w: up }, r: { ...armIK(o, 1, 58, 400, 50), hand: 'fist', w: up } };
        wr = [-1, 1].map((k) => { const w = wristOf(o, k); return [POS[3].x + w.x * POS[3].s, POS[3].y + (w.y + (o.breath || 0)) * POS[3].s]; });
        return o;
      },
      after: (gg) => {
        const o = { legs: false, rim: 1, yaw: 0.6, headYaw: 0.35, look: [10, 8], frown: 0.25, close: blinkAt(t, 9, 3.3) };
        o.arms = { l: { ...armIK(o, -1, 380, 470, 50, 'down'), hand: 'grip', w: up * (1 - sstep(T.click + 0.3, T.click + 0.8, t)) } };
        figure(gg, COP, lerp(POS[1].x - 318, POS[3].x - 388, pan), POS[3].y + 40, COPS, o);
        if (wr && ck > 0) { gg.save(); gg.globalAlpha = ck; gg.strokeStyle = '#8f96a0'; gg.lineWidth = 6; gg.beginPath(); gg.moveTo(wr[0][0], wr[0][1]); gg.lineTo(wr[1][0], wr[1][1]); gg.stroke(); for (const w of wr) { gg.strokeStyle = '#59606b'; gg.lineWidth = 16; gg.beginPath(); gg.ellipse(w[0], w[1], 38, 19, 0, 0, TAU); gg.stroke(); gg.strokeStyle = '#dfe4ea'; gg.lineWidth = 7; gg.beginPath(); gg.ellipse(w[0], w[1] - 3, 38, 19, 0, PI * 1.05, PI * 1.8); gg.stroke(); } gg.restore(); }
      },
    });
    const p = { x: lerp(806, INHAND.x, pan), y: lerp(880, INHAND.y, pan), sc: lerp(0.52, INHAND.sc, pan), rot: lerp(0.05, INHAND.rot, pan) };
    inHand(g, p);
    const f = Q.flashAt(t, T.click, 14) * 0.25; if (f > 0.01) { g.fillStyle = `rgba(255,255,255,${f})`; g.fillRect(0, 0, W, H); }
  }
  // 49.6–56.8: a cell. It has happened: one name, two years
  function shotCell(g, t) {
    const d = t - T.cell0, inn = sstep(0, 0.35, d);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#1d2633'], [1, '#0e131b']); g.fillRect(0, 0, W, H);
    g.fillStyle = '#f1e2b8'; R(g, 640, 330, 190, 150, 8); g.fill(); g.fillStyle = '#1d2633'; for (let i = 1; i < 4; i++) g.fillRect(640 + i * 47.5 - 5, 330, 10, 150);
    g.save(); g.globalAlpha = 0.16; g.fillStyle = '#f6e7bc'; g.beginPath(); g.moveTo(640, 480); g.lineTo(830, 480); g.lineTo(620, 1560); g.lineTo(140, 1560); g.closePath(); g.fill(); g.restore();
    g.fillStyle = '#28303d'; g.fillRect(0, 1290, W, 630); g.fillStyle = '#3a4352'; R(g, 250, 1180, 560, 46, 8); g.fill(); g.fillStyle = '#2c3441'; g.fillRect(290, 1226, 26, 130); g.fillRect(744, 1226, 26, 130);
    figure(g, FIVE[3], 520, 850 + 6 * Math.sin(t * 0.9), 0.5, { legs: true, back: true, yaw: 0.25, tilt: 0.09, lean: 0.03, rim: 0.6 });
    g.fillStyle = 'rgba(14,19,27,0.45)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 7; i++) { const x = 70 + i * 157 - (1 - inn) * (1300 - i * 60), k = Q.kick(t, T.cell0 + 0.33, 5, 40, 12); g.fillStyle = lg(g, x - 24, 0, x + 24, 0, [0, '#59626f'], [0.35, '#aab3bf'], [1, '#3b434f']); g.fillRect(x - 22 + k, 0, 44, H); }
    g.fillStyle = lg(g, 0, 596, 0, 660, [0, '#aab3bf'], [1, '#48505c']); g.fillRect(-10 - (1 - inn) * 1300, 600, W + 20, 56); g.fillRect(-10 - (1 - inn) * 1300, 1560, W + 20, 60);
    title(g, 'KIRK BLOODSWORTH', 420, 128, CREAM, t, T.cell0 + 1.5, { fit: 840 });
    const yk = sstep(T.cell0 + 2.2, T.cell0 + 6.0, t);
    if (t > T.cell0 + 2.0) { const a = clamp((t - T.cell0 - 2.0) * 6), x0 = 196, x1 = 830, y = 1430; txt(g, '1984', x0, y - 40, 110, CREAM, { align: 'center', stroke: INK, sw: 0.12, a }); for (let i = 0; i <= 9; i++) { const on = yk * 9 >= i; g.fillStyle = on ? YEL : 'rgba(255,246,226,0.25)'; ell(g, lerp(x0 + 130, x1 - 130, i / 9), y - 76, on ? 13 : 8, on ? 13 : 8); g.fill(); } txt(g, '1993', x1, y - 40, 110, yk >= 1 ? YEL : 'rgba(255,246,226,0.3)', { align: 'center', stroke: INK, sw: 0.12, a }); title(g, 'FREED BY DNA', y + 80, 86, YEL, t, T.cell0 + 6.0, { fit: 700 }); }
  }
  // 56.8–60.2: the corridor. The artist pins the poster up; number two takes his cap, walks past it, and they nod
  function shotCorridor(g, t) {
    const d = t - T.cor0, u = clamp(d / (T.stall0 - T.cor0));
    wall(g, { dado: 1120, lx: 760 });
    g.fillStyle = lg(g, 0, 1560, 0, H, [0, '#b9a98a'], [1, '#8f8069']); g.fillRect(0, 1560, W, H - 1560); g.fillStyle = '#45596b'; g.fillRect(0, 1548, W, 16);
    g.fillStyle = '#6a4a2c'; R(g, 46, 372, 560, 760, 10); g.fill(); g.fillStyle = '#c99a62'; R(g, 64, 390, 524, 724, 4); g.fill();
    for (const [x, y, w, h, c, r] of [[90, 410, 120, 150, '#f4efe0', -0.04], [470, 420, 100, 130, '#f7e7a8', 0.05], [96, 960, 130, 130, '#dfeaf2', 0.03], [460, 980, 110, 110, '#f4efe0', -0.05]]) { g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(r); g.fillStyle = c; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = 'rgba(60,60,70,0.25)'; for (let i = 0; i < 4; i++) g.fillRect(-w / 2 + 12, -h / 2 + 22 + i * 24, w - 24 - (i % 2) * 20, 6); g.fillStyle = RED; ell(g, 0, -h / 2 + 10, 6, 6); g.fill(); g.restore(); }
    sheetAt(g, 326, 772, 0.55, 0.015, { wanted: true });
    for (const k of [-1, 1]) { g.fillStyle = '#d23a2a'; ell(g, 326 + k * 196, 500, 9, 9); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; ell(g, 326 + k * 196 - 3, 497, 3, 3); g.fill(); }
    // him: in from the left, the cap coming down onto his head, past his own poster, a nod, out
    const wx = lerp(-230, 1330, Math.pow(u, 1.05)), capOn = sstep(0.05, 0.3, u), nod = winK(u, 0.5, 0.56, 0.6, 0.7);
    const o = { legs: true, rim: 1, yaw: 0.62, headYaw: lerp(0.1, -0.5, sstep(0.36, 0.5, u)) + 0.5 * sstep(0.72, 0.85, u), walk: 1.25, phase: d * 6.2, look: [lerp(4, -6, sstep(0.36, 0.5, u)), 0], smirk: 0.5, smile: 0.1, tilt: 0.09 * nod, headBob: 14 * nod, close: blinkAt(t, 2, 2.9), cap: { lift: 250 * (1 - capOn), rot: -0.5 * (1 - capOn), dx: 60 * (1 - capOn), a: 1 } };
    o.arms = { r: { ...armIK(o, 1, lerp(120, 170, capOn), lerp(-420, -150, capOn), 40, 'out'), hand: 'grip', w: 1 - sstep(0.3, 0.44, u) } };
    figure(g, THIEF0, wx, 800, 0.6, o);
    // the artist, close, his back half to us: he presses the last pin, steps back, sees a man go by, nods
    const see = sstep(0.4, 0.52, u), an = winK(u, 0.56, 0.62, 0.66, 0.76);
    artist(g, t, lerp(830, 870, sstep(0.1, 0.4, u)), 980 + 16 * an, 1.02, { yaw: -0.72, headYaw: lerp(-0.42, 0.28, see) * (1 - sstep(0.8, 0.95, u)) - 0.3 * sstep(0.8, 0.95, u), look: [lerp(-12, -6, see), -2], smile: 0.25, browY: -4 * see, tilt: 0.05 * an,
      arms: { l: { a1: 0.05, a2: 0.1 }, r: { a1: 0.05, a2: 0.1 } } });
    const out = sstep(0.9, 1, u); if (out > 0) { g.fillStyle = `rgba(255,250,236,${out})`; g.fillRect(0, 0, W, H); }
  }
  // 60.2–66.5: the chai stall. His poster on the wall, the mole on the wrong cheek, and him beside it with a glass of chai
  function shotStall(g, t) {
    const d = t - T.stall0, tw = t, z = 1 + 0.035 * sstep(0, T.end - T.stall0, d);
    g.save(); g.translate(540, 900); g.scale(z, z); g.translate(-540, -900);
    lane(g, tw, -60, 0, 5); stallTop(g, tw);
    // the stall's side wall: planks, and the poster pasted on it
    g.fillStyle = lg(g, 30, 0, 540, 0, [0, '#8a5d34'], [1, '#a5733f']); g.fillRect(-40, 330, 590, 1300); g.fillStyle = 'rgba(40,20,8,0.22)'; for (let i = 0; i < 5; i++) g.fillRect(-40 + i * 118 + 112, 330, 6, 1300); g.fillStyle = 'rgba(40,20,8,0.3)'; g.fillRect(550, 330, 16, 1300); g.fillStyle = '#5b3a1c'; g.fillRect(-40, 322, 606, 18);
    sheetAt(g, 282, 900, 0.6, -0.03, { wanted: true });
    g.fillStyle = 'rgba(250,240,200,0.6)'; for (const [x, y, r] of [[58, 596, -0.7], [522, 582, 0.7], [44, 1228, 0.7], [506, 1216, -0.7]]) { g.save(); g.translate(x, y); g.rotate(r); g.fillRect(-36, -12, 72, 24); g.restore(); }
    // him
    const glance = winK(t, T.stall0 + 1.5, T.stall0 + 1.8, T.stall0 + 2.5, T.stall0 + 2.8), sip = winK(t, T.sip, T.sip + 0.4, T.sip + 1.1, T.sip + 1.5);
    const o = { legs: true, rim: 1, yaw: 0, headYaw: -0.06 - 0.3 * glance, look: [-13 * glance, 1], smirk: 0.55, smile: 0.14 + 0.1 * (1 - sip), close: Math.max(blinkAt(t, 2, 2.9), 0.25 * sip), cap: 1, tilt: -0.05 * sip + 0.03 * glance, browUp: 10 * sstep(T.stall0 + 2.7, T.stall0 + 3.0, t) * (1 - sip), glassK: 0.6, hands: { l: 'glass' } };
    o.arms = { l: { ...armIK(o, -1, lerp(-175, -128, sip), lerp(420, 300, sip), 60), hand: 'glass' } };
    figure(g, THIEF0, 760, 792, 0.6, o);
    Q.steam(g, 760 + lerp(-175, -128, sip) * 0.6, 792 + lerp(420, 300, sip) * 0.6 - 60, tw, 0.5, 0.5 * (1 - sip));
    counter(g);
    g.restore();
    const inn = 1 - sstep(0, 0.35, d); if (inn > 0) { g.fillStyle = `rgba(255,250,236,${inn})`; g.fillRect(0, 0, W, H); }
  }

  // ================================================================ the cut
  // the drain: the colour goes out of the stall, the edges go soft, and what's left of his face settles onto white: a sheet of paper
  function shotDrain(g, t) {
    const k = sstep(T.drain, 3.75, t), fb = buf(4), gb = fb.getContext('2d'); reset(gb); gb.clearRect(0, 0, W, H);
    gb.save(); shotHook(gb, t, { noTitle: true }); gb.restore();
    g.save(); g.filter = `grayscale(${k.toFixed(3)}) blur(${(k * 16).toFixed(1)}px)`; g.drawImage(fb, 0, 0); g.restore();
    const c = PEN.cam(CLOSE0), w = sstep(3.15, 4.05, t);
    g.save(); g.globalAlpha = w; PEN.sheet(g, c, { shadow: false }); g.restore();
    ghost(g, c, ghostA(t), ghostB(t));
    hookTitles(g, t);
  }
  function early(g, t) {                                       // everything up to the pick (the rewind plays these backwards)
    if (t < T.drain) return shotHook(g, t);
    if (t < T.st0) return shotDrain(g, t);
    if (t < T.ride0) return shotMaster(g, t);
    if (t < T.face0) return shotOvals(g, t);
    if (t < T.swing0) return shotFace(g, t);
    if (t < T.rub0) return shotSwing(g, t);
    if (t < T.fl0) return shotRub(g, t);
    if (t < T.top0) return shotUnder(g, t);
    if (t < T.tear) return shotTop(g, t);
    if (t < T.wipe) return shotHeld(g, t);
    return shotLine(g, t);
  }
  function frame(g, t) {
    if (t < T.tw0) return early(g, t);
    if (t < T.rew0) return shotTwin(g, t);
    if (t < T.card) return shotRewind(g, t);
    if (t < T.cop0) return shotCard(g, t);
    if (t < T.cuff0) return shotCop(g, t);
    if (t < T.cell0) return shotCuffs(g, t);
    if (t < T.cor0) return shotCell(g, t);
    if (t < T.stall0) return shotCorridor(g, t);
    return shotStall(g, t);
  }
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S0) { S0.g = canvas(root); },
    run(t, b, S0) { const g = S0.g; reset(g); g.clearRect(0, 0, W, H); g.save(); frame(g, t); g.restore(); },
  });
  scene({
    name: 'fx', from: 'hook', to: 'end',
    build(root, S0) { const cv = el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:0.05` }, root); S0.g = cv.getContext('2d'); S0.tiles = K.grainTiles(); },
    run(t, b, S0) {
      const f = Math.round(t * 30), r = mulberry32(1000 + f), g = S0.g; K.clear(g); g.save();
      const pat = g.createPattern(S0.tiles[f % 4], 'repeat'), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
      g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256); g.restore();
    },
  });
  window.UI.endcard();
  C.start();
})();
