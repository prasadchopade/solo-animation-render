// Reel 52 · The Missing Word. Tests desk. At a chai stall at opening time the man with the mole and the maroon cap walks off with the
// stall-keeper's supply box behind her back. She rattles off its nine things to a constable ("Slowly, madam."): none of them is tea.
// "Did she say tea?" He reads it back with "and the tea", she nods without listening, and he arrests her own tea man while the thief
// strolls past behind them with the box. On a step, the thief hunts the box for the tea, and looks up at you.
// Script: docs/script.md (draft 3). Facts: docs/research.md. The drawings are film/draw.js.
// Every action is keyed to a placed word (film/words.js): the voice sets the clock. Hands and arms are keyed 2D poses on arcs
// (minimum jerk, a settle at the end of a fling), never longer than nominal; people are posed on twos, the camera moves on ones.
// Copied from reel 49 (tag source/reel-49-the-con, film/film.js), by name, as the brief asks: mj, key, k1, life (reel 42's), ein,
// settle, win, trackAt, bowOff, on2, pulse, tipOf, lerp2, blink, talk, lookSeq, autoElbow, fitElbow (uncleRig's arms), handShadow,
// and thiefFace's eyebrow (re-keyed here as thiefBrow). 30 fps. Every frame is a pure function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp, mulberry32 } = C;
  const K = window.KIT, D = window.DRAW, U = window.UI;
  const { TAU, PI, sstep, txt, R, ell, lg, rg, mix, MEN, hand, arm, crate, stove, saucepan, rack, match, notebookBack, pencil, scrawl,
    page, sack, speaker, stallBack, bench, counterFront, CT, laneBG, LW, stepBG, skBust, coBust, coSide, tmBust, thiefBust, thiefWalk, capsule, LINE } = D;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn'];

  // ------------------------------------------------------------------ motion helpers (reel 42's mj, key, life; reel 49's easings and tracks)
  const mj = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
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
  const ein = (u) => { u = clamp(u); return u * u * u; };
  const settle = (u) => { u = clamp(u); return u >= 1 ? 1 : 1 - Math.exp(-5.5 * u) * Math.cos(7.5 * u) * (1 - u * 0.5); };
  const win = (t, a, b, c, d) => mj((t - a) / (b - a)) * (1 - mj((t - c) / (d - c)));
  function trackAt(t, keys) {
    let i = 0; for (let j = 0; j < keys.length; j++) if (t >= keys[j].t) i = j;
    const k = keys[i], p = i > 0 ? keys[i - 1] : k, u = k.d ? clamp((t - k.t) / k.d) : 1, f = (k.ease || mj)(u);
    const o = {};
    for (const nm of ['x', 'y', 'a', 'fs', 'ex', 'ey']) if (k[nm] != null) o[nm] = p[nm] != null ? lerp(p[nm], k[nm], f) : k[nm];
    o.pose = u < (k.swap ?? 0.5) ? (p.pose ?? k.pose) : k.pose;
    if (k.bow && i > 0) { const b = bowOff(p, k, f, k.bow); o.x += b[0]; o.y += b[1]; }
    o.u = u; o.f = f; o.i = i;
    return o;
  }
  function bowOff(p, k, f, bow) { const dx = k.x - p.x, dy = k.y - p.y, L = Math.hypot(dx, dy) || 1, c = clamp(f), h = bow * L * 4 * c * (1 - c); return [(dy / L) * h, (-dx / L) * h]; }
  const on2 = (t) => Math.floor(t * 15 + 1e-6) / 15;  // people are posed on twos
  const pulse = (t, t0, w) => Math.exp(-Math.pow((t - t0) / w, 2));
  const tipOf = (w, a, L) => [w[0] + Math.cos(a) * L, w[1] + Math.sin(a) * L];
  const lerp2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
  const ramp = (t, a, b) => mj((t - a) / (b - a));

  // ------------------------------------------------------------------ the clock: every action keyed to a placed word
  const WD = (p) => K.words(p);
  const at = (p, i = 0) => { const w = WD(p); return w.length ? w[Math.min(i, w.length - 1)].t0 : 0; };
  const en = (p) => { const w = WD(p); return w.length ? w[w.length - 1].t1 : 0; };
  const atW = (p, re, k = 0) => { const w = WD(p).filter((x) => re.test(x.w.toLowerCase())); return w.length ? w[Math.min(k, w.length - 1)].t0 : at(p); };
  let T = null;
  function times() {
    if (T) return T;
    T = {};
    T.lit = 0.4;                                      // the match flares (it was struck as the film began)
    T.reach = 1.75;                                   // the match to the burner
    T.catch = 2.25;                                   // the stove catches
    T.out = 2.75;                                     // she shakes the match out
    T.lift0 = -0.32;                                  // the thief's lift began before frame 0: frame 0 is mid-lift
    T.carry = 0.62; T.exit = 2.7;                     // he turns away with it and strolls out past the stall's post
    T.turn = en('n01b') + 0.06;                       // she turns to reach behind her
    T.see = T.turn + 0.4;                             // the empty bench
    T.spin = T.see + 0.32;                            // back to us, mouth open
    T.coIn = T.turn + 0.2;                            // the constable hurries in from the left
    T.two = at('c00') - 0.5;                          // the two-shot
    T.lick = T.two + 0.08;                            // he licks his pencil
    T.counts = [/^milk/, /^sugar/, /^ginger/, /^cardamom/, /^cups/, /^strainer/, /^biscuits/, /^kettle/, /^spoons/].map((re) => atW('s01', re));
    T.box = at('s01');                                // "My box!": both hands flung up
    T.listEnd = en('s01');
    T.q = at('n03'); T.qTea = atW('n03', /tea/); T.qEnd = en('n03');
    T.rev = at('n04');
    T.read = at('c01'); T.readTea = atW('c01', /tea/); T.readEnd = en('c01');
    T.nods = [atW('c01', /spoons/) - 0.05, T.readTea + 0.05];   // her absent nods
    T.page = en('c01') + 0.3;                         // the notebook, close
    T.pageOut = atW('n10c', /stuck/) + 0.3;           // back to the two of them
    T.tear = en('n10c') + 0.02;                       // he rips the page out as the line ends (the rip in the gap) and holds it up
    T.zoomIn = T.counts[2] - 0.06; T.zoomOut = T.listEnd + 0.06;   // close on her face and fingers through the middle of the list
    T.nb = atW('n10c', /notebook/);
    T.lane = en('n10c') + 0.5;                        // the lane: he marches with the page held up
    T.whistle = T.lane + 0.25;
    T.teaIn = T.lane + 0.7;                           // the tea man comes on from the right
    T.meet = at('t01') - 0.55;                        // they meet; the page against the sack
    T.grab = at('t01') - 0.12;
    T.exactly = at('c02');
    T.thiefIn = at('t01') + 0.1; T.thiefOut = en('t02s') + 0.35;
    T.morning = at('t02s');
    T.pull = at('t02s') - 0.1;                         // he pulls the tea man back up the lane
    T.back = en('t02s') + 0.3;                         // the stall: they come past her
    T.tm = at('s02b'); T.nod = at('c03');
    T.nodK = [at('c03') + 0.05, at('c03') + 0.42];   // his nod back at her, twice
    T.leave = en('c03') + 0.1;
    T.step = en('c03') + 0.55;                        // the quiet step
    T.dig = T.step + 0.2;                             // the kettle comes up in the gap before "Even he went looking"
    T.even = at('n07b');
    T.look = at('n08') - 0.3;                         // he looks up at you
    T.brow = atW('n08', /nine/) - 0.08;               // his eyebrow (reel 49's key), held to the end
    T.end = K.tb('end');
    return T;
  }

  // ------------------------------------------------------------------ the faces (reel 49's blink, talk, lookSeq)
  function blink(t, seed) { const n = Math.floor(t / 3.4), r = mulberry32(n * 7 + Math.round(seed * 10)), t0 = n * 3.4 + 0.4 + r() * 2.4; return win(t, t0, t0 + 0.05, t0 + 0.1, t0 + 0.16); }
  function talk(t, ids, amp) {
    for (const p of ids) for (const w of WD(p)) if (t >= w.t0 && t <= w.t1) { const u = (t - w.t0) / Math.max(0.08, w.t1 - w.t0), syl = Math.max(1, Math.round((w.t1 - w.t0) / 0.18)); return amp * (0.35 + 0.65 * Math.abs(Math.sin(u * PI * syl))); }
    return 0;
  }
  // the thief's raised eyebrow (reel 49's thiefFace: a dip, up past the top, settle; held)
  function thiefBrow(t, t0) { const bw = t - t0; return bw <= 0 ? 0 : k1(bw, [[0, 0], [0.07, -0.35], [0.14, 1.2], [0.24, 0.95], [0.3, 1.0]]); }

  // ------------------------------------------------------------------ arms (reel 49's uncleRig machinery: an elbow from a pole, never longer than nominal)
  function autoElbow(S, Wr, pole, L) {
    const dx = Wr[0] - S[0], dy = Wr[1] - S[1], d = Math.hypot(dx, dy) || 1;
    let nx = -dy / d, ny = dx / d; const dot = nx * pole[0] + ny * pole[1]; if (dot < 0) { nx = -nx; ny = -ny; }
    const h = Math.min(Math.sqrt(Math.max(0, L * L - d * d / 4)), 0.22 * d + 30) * clamp(Math.abs(dot) / 0.3);
    return [(S[0] + Wr[0]) / 2 + nx * h, (S[1] + Wr[1]) / 2 + ny * h];
  }
  function fitElbow(S, E, Wr, L) {
    let e = [E[0], E[1]];
    for (let k = 0; k < 4; k++) for (const P of [S, Wr]) { const dx = e[0] - P[0], dy = e[1] - P[1], d = Math.hypot(dx, dy); if (d > L) e = [P[0] + (dx / d) * L, P[1] + (dy / d) * L]; }
    return e;
  }
  // a whole arm and hand: shoulder S, the hand's track tr {x, y, a, pose}, pole for the elbow, sc the person's scale
  function limb(g, S, tr, pole, sc, opt, hopt = {}) {
    const L = 300 * sc, Wr = [tr.x, tr.y];
    const E0 = tr.ex != null ? [tr.ex, tr.ey] : autoElbow(S, Wr, pole, L);
    arm(g, S, fitElbow(S, E0, Wr, L), Wr, { ...opt, w0: 40 * sc * 1.1, w1: 36 * sc * 1.1, w2: 27 * sc * 1.1 });
    if (!hopt.noHand) hand(g, tr.x, tr.y, tr.a, (hopt.size || 200) * sc, tr.pose, { skin: opt.skin, left: hopt.left, bangle: hopt.bangle, fs: tr.fs, thumbOver: hopt.thumbOver });
  }
  function handShadow(g, x, y, ang, s, a = 0.24) {                              // reel 49's: a soft shadow under a hand over the counter
    const cx = x + Math.cos(ang) * s * 0.42 + 8, cy = y + Math.sin(ang) * s * 0.42 + 12;
    g.save(); g.translate(cx, cy); g.rotate(ang); g.fillStyle = rg(g, 0, 0, 4, s * 0.5, [0, 'rgba(40,20,8,' + a + ')'], [1, 'rgba(40,20,8,0)']); g.scale(1, 0.55); g.beginPath(); g.arc(0, 0, s * 0.5, 0, TAU); g.fill(); g.restore();
  }
  const SKA = { skin: MEN.sk.skin, sleeve: MEN.sk.blouse, short: true };
  const COA = { skin: MEN.co.skin, sleeve: MEN.co.khaki, long: true };
  const TMA = { skin: MEN.tm.skin, sleeve: MEN.tm.shirt, long: true };
  const THA = { skin: MEN.thief.skin, sleeve: MEN.thief.shirt, short: true };

  // on-screen words: white and yellow, a dark outline (reel 49's)
  function bigWord(g, s, x, y, size, col, a = 1, o = {}) { txt(g, s, x, y, size, col, { align: o.align || 'center', stroke: '#14100a', sw: 0.16, a, fit: o.fit }); }

  // ------------------------------------------------------------------ shot 1: the stall at opening time (and shot 5, the same stall later)
  const SK1 = { x: 330, y: 720, s: 0.88 };
  const SKS = { r: [SK1.x - 0.88 * 255, SK1.y + 0.88 * 420], l: [SK1.x + 0.88 * 255, SK1.y + 0.88 * 420] };
  const BENCH = 1150, CRATE0 = [800, BENCH - 81];     // the crate on the bench
  const TH1 = { x: 810, y: 770, s: 0.56 };
  const STOVE = [330, 1388];
  function skFace1(t, T) {
    const L = life(2.1, t, 1), F = {};
    const turn = win(t, T.turn, T.turn + 0.28, T.spin, T.spin + 0.16);
    const shock = ramp(t, T.spin, T.spin + 0.12);
    F.yaw = 0.72 * turn - 0.08 * shock;
    F.look = t < T.turn ? [2, 14] : t < T.spin ? [20, -2] : [-14, -2];
    F.close = Math.max(blink(t, 1.3) * (1 - shock), 0) - 0.32 * shock;
    F.browUp = 0.15 * turn + 1.15 * shock; F.browIn = 0.3 * (1 - shock) * (t < T.turn ? 1 : 0) + 0.5 * shock;
    F.op = 0.5 * shock * (1 - 0.3 * Math.sin(t * 9));
    F.tilt = L.tilt + 0.04 * turn;
    return F;
  }
  function skArms1(t, T) {
    // her right hand (screen left) holds the matchbox, then rests; her left hand (screen right) strikes, lights the burner, shakes the
    // match out, reaches behind her for the box that isn't there; then both hands fly up
    const r = trackAt(t, [
      { t: -1, x: 252, y: 1350, a: -0.3, pose: 'hold' },
      { t: T.out + 0.2, d: 0.35, x: 205, y: 1400, a: 0.2, pose: 'rest' },
      { t: T.spin, d: 0.16, x: 250, y: 965, a: -1.3, pose: 'open', ease: settle },
    ]);
    const l = trackAt(t, [
      { t: -1, x: 445, y: 1330, a: -0.6, pose: 'pinch' },
      { t: T.lit - 0.26, d: 0.22, x: 335, y: 1322, a: -0.5, pose: 'pinch', ease: ein, bow: 0.12 },
      { t: T.lit + 0.08, d: 0.4, x: 415, y: 1268, a: -0.55, pose: 'pinch', bow: -0.1 },
      { t: T.reach, d: 0.4, x: 352, y: 1346, a: -0.35, pose: 'pinch', bow: 0.1 },
      { t: T.catch + 0.15, d: 0.3, x: 425, y: 1292, a: -0.6, pose: 'pinch', ease: settle },
      { t: T.out + 0.25, d: 0.3, x: 482, y: 1398, a: -0.2, pose: 'rest' },
      { t: T.turn + 0.05, d: 0.3, x: 720, y: 1135, a: -0.15, pose: 'open', bow: 0.15 },
      { t: T.spin, d: 0.16, x: 430, y: 965, a: -1.85, pose: 'open', ease: settle },
    ]);
    const shake = t > T.out && t < T.out + 0.3 ? Math.sin((t - T.out) * 50) * 14 * (1 - (t - T.out) / 0.3) : 0;
    l.x += shake;
    return { r, l };
  }
  function drawStall(g, t, T, o = {}) {
    g.drawImage(stallBack(), 0, 0);
    let crateAt = null, thief = null;
    if (o.thief && t < T.exit + 0.2) {
      const lift = 46 * mj((t - T.lift0) / 0.62), go = mj((t - T.carry) / (T.exit - T.carry)), x = TH1.x + 560 * go, bob = 9 * Math.abs(Math.sin((t - T.carry) * 6.2)) * (go > 0 && go < 1 ? 1 : 0);
      crateAt = [CRATE0[0] + 570 * go, CRATE0[1] - lift - 30 * go - bob];
      const f = { look: t < T.carry ? [2, 2] : [18, 0], smile: 0.45, close: blink(t, 4.1), browOne: 0.35 * win(t, -1, -0.5, T.carry - 0.1, T.carry + 0.2), yaw: 0.45 * go, tilt: 0.02 * Math.sin(t * 2) };
      thief = { x, y: TH1.y - bob, f };
      thiefBust(g, x, TH1.y - bob, TH1.s, f);
    }
    bench(g, BENCH);
    if (crateAt) {
      crate(g, crateAt[0], crateAt[1], 0.85, { tilt: -0.03 + 0.05 * mj((t - T.carry) / 0.4) });
      const S = [[thief.x - TH1.s * 255, thief.y + TH1.s * 420], [thief.x + TH1.s * 255, thief.y + TH1.s * 420]], hw = 0.85 * 150;
      limb(g, S[0], { x: crateAt[0] - hw + 6, y: crateAt[1] - 20, a: 0.15, pose: 'grip' }, [-0.6, 0.8], TH1.s, THA, { size: 200 });
      limb(g, S[1], { x: crateAt[0] + hw - 6, y: crateAt[1] - 24, a: PI - 0.15, pose: 'grip' }, [0.6, 0.8], TH1.s, THA, { size: 200, left: true });
    }
  }
  function counterThings(g, t, flame) { stove(g, STOVE[0], STOVE[1], 0.85, flame, t); saucepan(g, 590, 1374, 0.66); rack(g, 860, 1336, 0.82); }
  function shotStall(g, t, T) {
    const d = K.drift(t, 5);
    g.save();
    g.translate(540 + d.x, 960 + d.y); g.scale(1 + 0.012 * t, 1 + 0.012 * t); g.translate(-540, -960);
    drawStall(g, t, T, { thief: true });
    const tp = on2(t), F = skFace1(tp, T), L = life(2.1, tp, 1);
    skBust(g, SK1.x, SK1.y + 3 * L.breath, SK1.s, F, { lean: L.lean });
    counterFront(g);
    counterThings(g, t, ramp(t, T.catch, T.catch + 0.2));
    const A = skArms1(tp, T);
    limb(g, SKS.r, A.r, [-0.9, 0.45], SK1.s, SKA, { size: 190, bangle: true });
    if (t < T.out + 0.5) { g.fillStyle = '#c4462e'; R(g, A.r.x + 12, A.r.y - 34, 74, 48, 6); g.fill(); g.fillStyle = '#f3e2b0'; R(g, A.r.x + 16, A.r.y - 30, 66, 13, 3); g.fill(); }   // the matchbox
    const mf = t < T.lit - 0.04 ? 0 : t < T.out + 0.05 ? 1 : 0;
    if (t < T.out + 0.4) match(g, A.l.x + 22, A.l.y - 18, -0.9 + (t > T.out ? 0.4 : 0), mf * (t < T.catch ? 1 : 0.8), t);
    limb(g, SKS.l, A.l, [0.9, 0.45], SK1.s, SKA, { size: 190, left: true, bangle: true });
    if (t > T.coIn) {
      const u = mj((t - T.coIn) / 0.5), x = lerp(-320, 30, u), bob = 10 * Math.abs(Math.sin(t * 8)) * (1 - u);
      coSide(g, x, 740 - bob, 0.9, { look: 0.4, close: blink(t, 6.2), op: 0, tilt: -0.04 * (1 - u) });
    }
    g.restore();
    const a = 1 - sstep(2.9, 3.3, t);
    if (a > 0) { speaker(g, 150, 360, 0.95, '#ffd34a'); bigWord(g, 'REMEMBER EVERY WORD', 228, 392, 92, '#fff6e2', a, { align: 'left', fit: 700 }); }
  }

  // ------------------------------------------------------------------ shot 2: the two-shot (the list, the question, the readback)
  let BLUR = null;
  function stallBlur() {
    if (BLUR) return BLUR;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.filter = 'blur(9px)'; g.translate(540, 900); g.scale(1.55, 1.55); g.translate(-500, -640); g.drawImage(stallBack(), 0, 0); bench(g, BENCH);
    g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.fillStyle = 'rgba(30,18,10,0.28)'; g.fillRect(0, 0, W, H);
    BLUR = c; return c;
  }
  const CO2 = { x: 280, y: 740, s: 0.82 }, SK2 = { x: 770, y: 720, s: 0.84 };
  function shotTwo(g, t, T) {
    const tp = on2(t);
    const close = t >= T.zoomIn && t < T.zoomOut;
    const push = close ? 1.42 + 0.03 * ramp(t, T.zoomIn, T.zoomOut) : 1 + 0.05 * ramp(t, T.two, T.listEnd) + 0.05 * ramp(t, T.q - 0.1, T.qEnd + 0.4) - 0.04 * ramp(t, T.pageOut, T.lane);
    const d = K.drift(t, 4), cxy = close ? [780, 1010] : [540, 900];
    g.save(); g.translate(cxy[0] + d.x, cxy[1] + d.y); g.scale(push, push); g.translate(-cxy[0], -cxy[1]);
    g.drawImage(stallBlur(), 0, 0);
    // ---- the constable, side-on, facing her: the notebook in his near hand, the pencil in the far one behind it
    const Lc = life(5.2, tp, 1);
    const writing = tp > T.box && tp < T.q - 0.05 ? 1 : 0, readingTea = win(tp, T.readTea - 0.05, T.readTea + 0.05, T.readEnd + 0.1, T.readEnd + 0.3);
    const lookUp = win(tp, T.q - 0.15, T.q + 0.05, T.rev + 0.2, T.rev + 0.5) + win(tp, T.two - 1, T.two - 0.5, T.box - 0.2, T.box + 0.1);
    const fC = { look: 0.6, lookY: 1.3 * (1 - lookUp), close: blink(tp, 6.2), op: talk(tp, ['c00', 'c01'], 0.42), smile: 0.1, tilt: Lc.tilt + 0.05 * (1 - lookUp), browUp: 0.3 * win(tp, T.q - 0.1, T.q + 0.1, T.rev, T.rev + 0.2) };
    // the far arm and pencil hand, behind the notebook
    const NB = [528, 1052];
    const scrib = writing * (Math.sin(tp * 47) * 10 + Math.sin(tp * 23) * 6) + readingTea * Math.sin(tp * 40) * 9;
    const penY = writing ? ((tp - T.box) * 38) % 60 : 0;
    const pen = { x: NB[0] + 36 + scrib, y: NB[1] - 96 + penY, a: 1.25, pose: 'pen' };
    const licking = win(tp, T.lick, T.lick + 0.15, T.lick + 0.35, T.lick + 0.55);
    if (licking > 0) { pen.x = lerp(pen.x, CO2.x + 150, licking); pen.y = lerp(pen.y, CO2.y + 110, licking); pen.a = lerp(pen.a, 2.2, licking); }
    const rip = t >= T.pageOut ? mj((tp - T.tear) / 0.35) : 0, reach = t >= T.pageOut ? mj((tp - T.tear + 0.45) / 0.35) : 0;
    const PG = [lerp(NB[0], 508, rip), lerp(NB[1] - 10, 770, rip)], pgA = lerp(-0.12, 0.06, rip);
    if (reach > 0) { pen.x = lerp(pen.x, PG[0] + 10, reach); pen.y = lerp(pen.y, PG[1] - 118, reach); pen.a = lerp(pen.a, -1.45, reach); pen.pose = reach > 0.6 ? 'pinch' : 'pen'; }
    limb(g, [CO2.x + 60, CO2.y + 0.86 * 360], pen, [0.6, 0.8], CO2.s, COA, { size: 190 });
    if (reach < 0.5) pencil(g, pen.x + 40, pen.y + 30, pen.a + 0.3, 1.0);
    coSide(g, CO2.x, CO2.y + 4 * Lc.breath, CO2.s, fC, { lean: -0.02 });
    // the notebook, its back to us, held up in his near hand
    notebookBack(g, NB[0], NB[1], -0.12, 1.25);
    if (rip > 0) {                                        // the torn page, turned to us: the end of the list in his hand, TEA last
      g.save(); g.translate(PG[0], PG[1]); g.rotate(pgA); g.scale(1.25, 1.25);
      g.fillStyle = 'rgba(40,20,8,0.25)'; R(g, -66, -92, 140, 200, 3); g.fill();
      g.fillStyle = '#f1e8d2'; R(g, -70, -100, 140, 200, 3); g.fill();
      g.strokeStyle = '#e9e1cf'; g.lineWidth = 3; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(-60 + i * 20, -100, 5, 0, PI); g.stroke(); }   // the ragged top
      g.strokeStyle = 'rgba(70,110,170,0.35)'; g.lineWidth = 1.5; for (let y = -70; y < 100; y += 30) { g.beginPath(); g.moveTo(-70, y); g.lineTo(70, y); g.stroke(); }
      scrawl(g, 'KETTLE', -54, 8, 24, 1, { seed: 11, lw: 2.6 }); scrawl(g, 'SPOONS', -54, 38, 24, 1, { seed: 24, lw: 2.6 }); scrawl(g, 'TEA', -54, 68, 24, 1, { seed: 37, lw: 2.6 });
      g.strokeStyle = '#24305e'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-56, 74); g.lineTo(-8, 73); g.stroke();
      g.restore();
    }
    limb(g, [CO2.x - 20, CO2.y + 0.86 * 380], { x: NB[0] - 70, y: NB[1] + 96, a: -1.2, pose: 'hold' }, [-0.4, 0.9], CO2.s, COA, { size: 200, left: true });
    // ---- the stall-keeper, facing him: the list on her fingers, then nine up, then her eyes down the lane as she nods
    const Ls = life(1.7, tp, 1), listing = tp >= T.box && tp < T.listEnd + 0.1;
    const out = win(tp, T.listEnd - 0.1, T.listEnd + 0.2, T.read - 0.2, T.read + 0.1);          // out of breath, nine fingers up
    const away = ramp(tp, T.read - 0.1, T.read + 0.25);
    let nodY = 0; for (const tn of T.nods) nodY += 30 * win(tp, tn, tn + 0.14, tn + 0.22, tn + 0.42);
    const fS = {
      yaw: -0.32 + 0.6 * away, look: away > 0.5 ? [18, 2] : [-16, -2], close: blink(tp, 1.3) * (listing ? 0.3 : 1) + 0.15 * away,
      op: talk(tp, ['s01'], 0.52) + 0.14 * out, browIn: listing ? 0.6 : 0.25, browUp: listing ? 0.3 : 0.1 * out, tilt: Ls.tilt + 0.06 * nodY / 30,
    };
    skBust(g, SK2.x, SK2.y + 5 * Ls.breath + 6 * out * Math.sin(tp * 7) + nodY, SK2.s, fS, { lean: Ls.lean });
    // her counting hands, in front of her chest: the right hand (screen left) one to five, then the left (screen right) one to four
    const c = T.counts, nR = c.filter((x) => tp >= x - 0.04).length;
    const poseR = tp < T.box ? 'rest' : nR === 0 ? 'open' : 'c' + Math.min(5, nR), poseL = nR < 6 ? (tp < c[5] - 0.3 ? 'rest' : 'c0') : 'c' + Math.min(4, nR - 5);
    const pump = (i) => (tp >= c[i] - 0.04 && tp < c[i] + 0.25 ? -16 * Math.sin(((tp - c[i] + 0.04) / 0.29) * PI) : 0);
    let pr = 0, pl = 0; for (let i = 0; i < 9; i++) { if (i < 5) pr += pump(i); else pl += pump(i); }
    const downAt = T.read - 0.05;
    const upR = ramp(tp, T.box - 0.12, T.box + 0.12) * (1 - ramp(tp, downAt, downAt + 0.35)), upL = ramp(tp, c[5] - 0.4, c[5] - 0.1) * (1 - ramp(tp, downAt, downAt + 0.35));
    const fling = settle((tp - T.box + 0.05) / 0.3) * (tp < c[0] - 0.05 ? 1 : 0);
    const SR = [SK2.x - SK2.s * 255, SK2.y + SK2.s * 420], SL = [SK2.x + SK2.s * 255, SK2.y + SK2.s * 420];
    const hR = { x: lerp(SK2.x - 175, SK2.x - 195, upR) - 40 * fling, y: lerp(SK2.y + 650, SK2.y + 300, upR) + pr - 60 * fling, a: lerp(-0.4, -PI / 2 - 0.18, upR), pose: poseR,
      ex: lerp(SK2.x - 300, SK2.x - 300, upR), ey: lerp(SK2.y + 560, SK2.y + 530, upR) };
    const hL = { x: lerp(SK2.x + 170, SK2.x + 15, upL) + 40 * fling, y: lerp(SK2.y + 660, SK2.y + 315, upL) + pl - 60 * fling, a: lerp(-2.6, -PI / 2 + 0.18, upL), pose: poseL,
      ex: lerp(SK2.x + 300, SK2.x + 235, upL), ey: lerp(SK2.y + 570, SK2.y + 545, upL) };
    limb(g, SR, hR, [-0.9, 0.3], SK2.s, SKA, { size: 215, bangle: true });
    limb(g, SL, hL, [0.9, 0.3], SK2.s, SKA, { size: 215, left: true, bangle: true });
    g.restore();
    // the question
    const qa = ramp(t, T.q, T.q + 0.12) * (1 - ramp(t, T.rev - 0.1, T.rev + 0.1));
    if (qa > 0) { const pop = 1 + 0.08 * Math.max(0, 1 - Math.abs(t - T.qTea - 0.08) / 0.12); g.save(); g.translate(540, 380); g.scale(pop, pop); bigWord(g, 'DID SHE SAY TEA?', 0, 40, 118, '#ffd34a', qa, { fit: 820 }); g.restore(); }
  }

  // ------------------------------------------------------------------ shot 3: his notebook, close (KETTLE, SPOONS, TEA)
  const PX = 600, PY = 1470, PS = 1.62;                // the page, close on its three words
  function shotPage(g, t, T) {
    const u = t - T.page, push = 1 + 0.06 * ramp(t, T.page, T.page + 1.2) + 0.08 * ramp(t, T.nb - 0.2, T.nb + 0.5);
    g.drawImage(stallBlur(), 0, 0); g.fillStyle = 'rgba(20,12,6,0.35)'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(560, 980); g.scale(push, push); g.translate(-560, -980);
    const done = 0.78 + 0.22 * mj(u / 0.4);
    const tips = page(g, PX, PY, PS, [['KETTLE', 1], ['SPOONS', 1], ['TEA', done]], { rot: -0.03 });
    // one underline once the word is done; then the hand lifts away and leaves TEA in view
    const ul = mj((u - 0.45) / 0.3), lift = mj((u - 0.8) / 0.5);
    g.save(); g.translate(PX, PY); g.rotate(-0.03); g.scale(PS, PS);
    g.strokeStyle = '#24305e'; g.lineWidth = 8.5; g.lineCap = 'round';
    const y0 = -500 + 2 * 150 + 20;
    if (ul > 0) { g.beginPath(); g.moveTo(-262, y0); g.lineTo(lerp(-262, 40, ul), y0 - 6 * ul); g.stroke(); }
    g.restore();
    const tp = tips[2] ? tips[2].tip : [0, 0], pp = ul > 0 ? [lerp(-262, 40, ul), y0 - 6 * ul] : tp;
    const sx = PX + PS * (pp[0] * Math.cos(-0.03) - pp[1] * Math.sin(-0.03)), sy = PY + PS * (pp[0] * Math.sin(-0.03) + pp[1] * Math.cos(-0.03));
    if (lift < 1) D.penHand(g, sx + 520 * lift, sy + 640 * lift, 1.9, MEN.co.skin, MEN.co.khaki, -0.95 + 0.15 * lift);
    g.restore();
  }

  // ------------------------------------------------------------------ shot 4: the lane (the march, the tea man, the thief walking past)
  // the tea man carries the sack in his arms, TEA to us; the constable on the left, the tea man on the right, and between them, further
  // back and higher, the thief strolls through the gap with the box under his arm
  function teaMan(g, x, y, s, f, hug = 0) {
    tmBust(g, x, y, s, f);
    sack(g, x - 10, y + s * 560, s * 0.82, -0.05);
    const L = [x - s * 245, y + s * 410], Rr = [x + s * 245, y + s * 410];
    limb(g, L, { x: x - s * 190 + 10 * hug, y: y + s * 600, a: 0.3, pose: 'grip' }, [-0.9, 0.3], s, TMA, { size: 200 });
    limb(g, Rr, { x: x + s * 180 - 10 * hug, y: y + s * 620, a: PI - 0.3, pose: 'grip' }, [0.9, 0.3], s, TMA, { size: 200, left: true });
  }
  function shotLane(g, t, T) {
    const tp = on2(t);
    const camX = lerp(0, 940, ramp(t, T.lane, T.meet)) - 240 * ramp(t, T.pull, T.back + 0.4);
    g.drawImage(laneBG(), -camX, 0);
    if (t > T.thiefIn && t < T.thiefOut) {
      const u = (t - T.thiefIn) / (T.thiefOut - T.thiefIn), x = lerp(-260, 1330, u), walk = (t - T.thiefIn) * 1.9;
      thiefWalk(g, x, 600, 0.5, { look: 0.3, close: blink(t, 4.4), smile: 0.45, tilt: 0.02 }, walk);
    }
    const marching = t < T.meet, pulling = t > T.pull;
    const cx = 190 + (pulling ? -50 * ramp(t, T.pull, T.back) : 0), stride = marching ? (t - T.lane) * 2.2 : pulling ? (t - T.pull) * 2.2 : 0;
    const bobC = (marching || pulling) ? 12 * Math.abs(Math.sin(stride * PI)) : 0;
    const Lc = life(5.2, tp, 1), whistle = win(t, T.whistle, T.whistle + 0.1, T.whistle + 0.5, T.whistle + 0.6);
    const check = win(tp, T.meet, T.meet + 0.15, T.grab, T.grab + 0.15);
    const fC = { look: check > 0.5 ? 0.9 : 0.4, lookY: check > 0.5 ? 0.7 : 0, close: blink(tp, 6.2), op: talk(tp, ['c02'], 0.45), smile: 0.2 + 0.4 * win(tp, T.exactly - 0.1, T.exactly + 0.1, T.back, T.back + 1), browUp: 0.4 * check, tilt: Lc.tilt - 0.04 * whistle };
    const tmIn = ramp(t, T.teaIn, T.meet + 0.1);
    const tx = lerp(1300, 820, tmIn) - (pulling ? 50 * ramp(t, T.pull, T.back) : 0), strideT = t < T.meet ? (t - T.teaIn) * 2.1 : pulling ? (t - T.pull) * 2.2 : 0;
    const bobT = (t < T.meet || pulling) ? 11 * Math.abs(Math.sin(strideT * PI)) : 0;
    const alarm = ramp(tp, T.grab - 0.1, T.grab + 0.1);
    const fT = { yaw: -0.42, look: [-16, 0], close: blink(tp, 3.7) - 0.25 * alarm, op: talk(tp, ['t01', 't02s'], 0.5), browUp: 0.9 * alarm, browIn: 0.5 * alarm, smile: 0.2 * (1 - alarm), tilt: 0.04 * alarm * Math.sin(t * 5) };
    if (t > T.teaIn - 0.05) teaMan(g, tx, 730 - bobT, 0.72, fT, alarm);
    coSide(g, cx, 730 - bobC, 0.76, fC, { lean: marching ? 0.04 : pulling ? -0.06 : 0 });
    if (whistle > 0) { g.save(); g.translate(cx + 0.76 * 210, 730 - bobC + 0.76 * 128); g.rotate(-0.2); g.fillStyle = '#c9cfd5'; R(g, -6, -18, 58, 30, 12); g.fill(); g.strokeStyle = '#7d848b'; g.lineWidth = 3; g.stroke(); g.restore(); }
    const holdUp = { x: cx + 190, y: 860 - bobC, a: -1.1, pose: 'hold' };
    const grabbed = { x: tx - 0.72 * 300, y: 730 - bobT + 0.72 * 560, a: 0.15, pose: 'grip' };
    const g2 = ramp(t, T.grab - 0.12, T.grab + 0.08), hp = { x: lerp(holdUp.x, grabbed.x, g2), y: lerp(holdUp.y, grabbed.y, g2), a: lerp(holdUp.a, grabbed.a, g2), pose: g2 > 0.5 ? 'grip' : 'hold' };
    if (g2 < 0.6) { g.save(); g.translate(hp.x + 20, hp.y - 150); g.rotate(-0.08); g.fillStyle = '#f1e8d2'; R(g, -80, -110, 160, 220, 4); g.fill(); g.strokeStyle = 'rgba(70,110,170,0.35)'; g.lineWidth = 2; for (let y = -80; y < 110; y += 36) { g.beginPath(); g.moveTo(-80, y); g.lineTo(80, y); g.stroke(); } scrawl(g, 'TEA', -56, 92, 40, 1, { seed: 37, lw: 4 }); g.restore(); }
    limb(g, [cx - 10, 730 - bobC + 0.76 * 380], hp, [0.3, 0.9], 0.76, COA, { size: 200, left: true });
  }

  // ------------------------------------------------------------------ shot 5: back at the stall ("He's my tea man!" "You nodded.")
  function shotBack(g, t, T) {
    const tp = on2(t);
    g.save(); const d = K.drift(t, 4); g.translate(d.x, d.y);
    drawStall(g, t, T, {});
    const Ls = life(2.1, tp, 1), lean = ramp(tp, T.tm - 0.2, T.tm + 0.1) * (1 - 0.6 * ramp(tp, T.nod + 0.3, T.nod + 0.7));
    const deflate = ramp(tp, T.nod + 0.3, T.nod + 0.8);
    const fS = { yaw: 0.45 * lean + 0.2, look: [16, -2 + 10 * deflate], close: blink(tp, 1.3) + 0.25 * deflate, op: talk(tp, ['s02b'], 0.55), browUp: 0.8 * lean * (1 - deflate), browIn: 0.6 * lean + 0.4 * deflate, frown: 0.4 * deflate, tilt: Ls.tilt - 0.05 * deflate };
    skBust(g, SK1.x + 20 * lean, SK1.y + 3 * Ls.breath + 18 * deflate, SK1.s, fS, { lean: 0.04 * lean });
    counterFront(g);
    counterThings(g, t, 1);
    const out = { x: lerp(482, 560, lean), y: lerp(1398, 1250, lean), a: lerp(-0.2, -0.45, lean), pose: lean > 0.5 ? 'point' : 'rest' };
    limb(g, SKS.r, { x: 205, y: 1400, a: 0.2, pose: 'rest' }, [-0.9, 0.45], SK1.s, SKA, { size: 190, bangle: true });
    limb(g, SKS.l, out, [0.9, 0.45], SK1.s, SKA, { size: 190, left: true, bangle: true });
    // the constable marches the tea man past, right to left: the tea man in front with his sack, the constable behind him with his arm
    const come = ramp(t, T.back, T.tm - 0.1), go = ramp(t, T.leave, T.leave + 1.4);
    const tx = lerp(1250, 630, come) - 950 * go, cx = tx + 250;
    const walking = come < 1 || go > 0, bob = walking ? 11 * Math.abs(Math.sin(t * 2.2 * PI)) : 0;
    let nodY = 0; for (const tn of T.nodK) nodY += 24 * win(tp, tn, tn + 0.1, tn + 0.16, tn + 0.3);
    const fC = { look: 0.5, lookY: 0.2, close: blink(tp, 6.2), op: talk(tp, ['c03'], 0.45), smile: 0.3, tilt: 0.08 * nodY / 24 };
    coSide(g, cx, 600 - bob + nodY * 0.5, 0.74, fC, { face: 'left' });
    const fT = { yaw: -0.35, look: [-14, 4], close: blink(tp, 3.7), op: 0, browUp: 0.5, browIn: 0.6, frown: 0.3 };
    teaMan(g, tx, 810 - bob, 0.66, fT, 1);
    g.restore();
  }

  // ------------------------------------------------------------------ shot 6: the quiet step (he hunts the box for the tea; the eyebrow)
  function shotStep(g, t, T) {
    const tp = on2(t);
    g.save(); const d = K.drift(t, 4); g.translate(540 + d.x, 960 + d.y); const push = 1 + 0.05 * ramp(t, T.look - 0.2, T.look + 0.6); g.scale(push, push); g.translate(-540, -960);
    g.drawImage(stepBG(), 0, 0);
    const t0 = T.dig;
    const kLift = win(tp, t0 + 0.05, t0 + 0.45, t0 + 1.05, t0 + 1.4);           // the kettle up and out, looked under, put back
    const peer = win(tp, t0 + 0.4, t0 + 0.6, t0 + 1.0, t0 + 1.2);               // his head over the crate
    const dig = ramp(tp, t0 + 1.35, t0 + 1.55) * (1 - ramp(tp, T.look - 0.05, T.look + 0.15));
    const look = ramp(tp, T.look, T.look + 0.25);
    const brow = thiefBrow(tp, T.brow) * 1.25;
    const f = { look: look > 0.5 ? [0, 0] : kLift > 0.5 && peer < 0.3 ? [-14, 6] : [6 * Math.sin(tp * 3), 17], close: blink(tp, 4.4) * (tp > T.brow - 0.3 ? 0 : 1),
      smile: 0.15 + 0.3 * look, browIn: 0.55 * dig + 0.3 * peer, browOne: brow, tilt: 0.05 * (dig + peer) - 0.03 * look + 0.04 * look * Math.min(1, brow) };
    const bodyY = 680 + 24 * peer + 16 * dig - 16 * look;
    thiefBust(g, 540, bodyY, 0.82, f);
    const CR = [540, 1340], sc = 1.5;
    const jig = dig > 0 ? Math.sin(tp * 11) : 0, jig2 = dig > 0 ? Math.sin(tp * 8.3 + 1) : 0;
    const kdy = -150 * kLift, kdx = -190 * kLift;
    // his arms: the right (screen left) lifts the kettle by its handle; both dig after; on the look up, they rest on the crate's rim
    const S1 = [540 - 0.82 * 255, bodyY + 0.82 * 420], S2 = [540 + 0.82 * 255, bodyY + 0.82 * 420];
    const kHandle = [CR[0] + sc * (-40 + kdx / sc), CR[1] + sc * (-89 - 90) + kdy];
    const rim = CR[1] - sc * 95;
    const hA = look > 0.5 ? { x: CR[0] - 150, y: rim + 4, a: 0.2, pose: 'rest' } : kLift > 0.02 ? { x: kHandle[0] - 6, y: kHandle[1] + 10, a: -0.2, pose: 'grip' } : { x: CR[0] - 70 + 30 * jig * dig, y: rim + 60 + 20 * dig, a: 1.2, pose: 'grip' };
    const hB = look > 0.5 ? { x: CR[0] + 150, y: rim + 4, a: PI - 0.2, pose: 'rest' } : { x: CR[0] + 80 - 30 * jig2 * dig, y: rim + 50 + 30 * dig, a: PI - 1.2, pose: 'grip' };
    const inBox = (h) => h.y > rim + 20;
    limb(g, S1, hA, [-0.7, 0.6], 0.82, THA, { noHand: inBox(hA) });
    limb(g, S2, hB, [0.7, 0.6], 0.82, THA, { noHand: inBox(hB), left: true });
    crate(g, CR[0], CR[1], sc, { kdx: kdx + 18 * jig * dig, krot: 0.1 * jig2 * dig - 0.15 * kLift, kdy: kdy + 8 * Math.abs(jig) * dig, pdx: -14 * jig2 * dig, prot: 0.12 * jig * dig });
    if (kLift > 0.02) hand(g, hA.x, hA.y, hA.a, 0.82 * 200, 'grip', { skin: MEN.thief.skin });
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
      if (t < T.two) shotStall(g, t, T);
      else if (t < T.page) shotTwo(g, t, T);
      else if (t < T.pageOut) shotPage(g, t, T);
      else if (t < T.lane) shotTwo(g, t, T);
      else if (t < T.back) shotLane(g, t, T);
      else if (t < T.step) shotBack(g, t, T);
      else shotStep(g, t, T);
      g.restore();
    },
  });

  U.endcard();
  U.grain(0.06);
  C.start();
})();
