// Reel 49 · The Con (working title). Tests desk. A customer in a maroon cap (the season's thief, silent) pays for a 10-rupee chai
// with a 500, cuts the uncle's count off with a 10 coin, gets his 500 back, taps the change, raises an eyebrow, and walks off with
// 490 of the uncle's money. "So. How much did he steal?" The replay, from straight above; closing time; why; the next stall.
// Script: docs/script.md (draft 3, approved 23 Nov). Facts: docs/research.md. The drawings are film/draw.js.
// Every action is keyed to a placed word (film/words.js): the voice sets the clock. Hands and arms are keyed 2D poses on arcs
// (minimum jerk, a settle at the end of a fling), no rig. People are posed on twos; the camera moves on ones.
// Copied from reel 42 (tag source/reel-42-what-did-he-take, film/film.js), by name: mj, key, life. 30 fps. Every frame is a pure
// function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp, mulberry32 } = C;
  const K = window.KIT, D = window.DRAW;
  const { TAU, PI, sstep, txt, R, lg, mix, MEN, FLAT, note, coin, tin, hand, arm, fanOf, glass, steam } = D;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn'];

  // ------------------------------------------------------------------ motion helpers (reel 42: mj, key, life)
  const mj = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
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
  function life(seed, t, k = 1) {                     // nobody is ever quite still: breath, a weight shift, a drifting look
    const s = (hz, ph) => Math.sin(TAU * (hz * t + ph));
    const b = s(0.26, seed * 0.37), w1 = s(0.09, seed * 0.71), h1 = s(0.19, seed * 0.53), h2 = s(0.31, seed * 0.17 + 0.4);
    return { breath: b * k, lean: (0.011 * b + 0.015 * w1) * k, look: (h1 * 0.6 + h2 * 0.4) * k, tilt: 0.02 * w1 * k };
  }
  // new: easings for the hands. ein accelerates into a slap; settle overshoots a little and comes back (a flung move)
  const ein = (u) => { u = clamp(u); return u * u * u; };
  const settle = (u) => { u = clamp(u); return u >= 1 ? 1 : 1 - Math.exp(-5.5 * u) * Math.cos(7.5 * u) * (1 - u * 0.5); };
  const win = (t, a, b, c, d) => mj((t - a) / (b - a)) * (1 - mj((t - c) / (d - c)));
  // new: a keyed 2D track. keys: [{t, d, x, y, a, fs?, pose?, bow?, ease?, swap?}]: from key i-1's values to key i's, starting at
  // t and taking d seconds, along an arc (bow: how far the path bulges, as a share of its length). A pose (the hand's shape)
  // changes at swap (default halfway).
  function trackAt(t, keys) {
    let i = 0; for (let j = 0; j < keys.length; j++) if (t >= keys[j].t) i = j;
    const k = keys[i], p = i > 0 ? keys[i - 1] : k, u = k.d ? clamp((t - k.t) / k.d) : 1, f = (k.ease || mj)(u);
    const o = {};
    for (const nm of ['x', 'y', 'a', 'fs', 'ex', 'ey']) if (k[nm] != null) o[nm] = p[nm] != null ? lerp(p[nm], k[nm], f) : k[nm];
    o.pose = u < (k.swap ?? 0.5) ? (p.pose ?? k.pose) : k.pose;
    if (k.bow && i > 0) { const dx = k.x - p.x, dy = k.y - p.y, L = Math.hypot(dx, dy) || 1, c = clamp(f), h = k.bow * L * 4 * c * (1 - c); o.x += (dy / L) * h; o.y += (-dx / L) * h; }
    o.u = u; o.i = i;
    return o;
  }
  const on2 = (t) => Math.floor(t * 15 + 1e-6) / 15;  // people are posed on twos

  // ------------------------------------------------------------------ the clock: every action keyed to a placed word
  const WD = (p) => K.words(p);
  const at = (p, i = 0) => { const w = WD(p); return w.length ? w[Math.min(i, w.length - 1)].t0 : 0; };
  const en = (p) => { const w = WD(p); return w.length ? w[w.length - 1].t1 : 0; };
  const atW = (p, re, k = 0) => { const w = WD(p).filter((x) => re.test(x.w.toLowerCase())); return w.length ? w[Math.min(k, w.length - 1)].t0 : at(p); };
  let T = null;
  function times() {
    if (T) return T;
    T = {};
    T.slap = 0.15;
    T.dbl = at('u01') - 0.25;                                     // the double take: the note, the customer, the note
    T.sigh = en('u01') - 0.1;
    T.wad = en('u01') - 0.25;                                     // the wad out of the tin, as he finishes the line
    T.lick = T.wad + 0.15;                                        // a lick of the thumb
    T.c = [at('u02') + 0.05, at('u03') + 0.05, at('u04') + 0.05]; // each note lands as its count is said
    T.cut = en('u05') - 0.04;                                     // the coin's slap cuts the count off
    T.point = T.cut + 0.25;
    T.sweep = atW('u06', /change/) - 0.05;                        // "you have change?": the coin into the tin
    T.take500 = atW('u06', /take/);                               // "Then take your five hundred back": the 500 goes over
    T.give = en('u06') - 0.05;                                    // the 500 meets his hand
    T.pocket = T.give + 0.2;
    T.tap = [T.pocket + 0.4, T.pocket + 0.7, T.pocket + 1.0];     // one, two, three
    T.brow = T.tap[2] + 0.2;
    T.sorry = at('u07');
    T.c2 = [at('u08') + 0.05, at('u09') + 0.05];
    T.gather = en('u09') + 0.12;
    T.sip = T.gather + 0.55;
    T.toast = at('u10') - 0.25;
    T.go = at('u10') + 0.2;
    T.q = at('n04');
    T.replay = at('n05') - 0.12;
    T.r500 = atW('n06', /came/);
    T.r450 = atW('n06', /counted/);
    T.rCoin = atW('n07', /^ten/);
    T.rBack = atW('n07', /went/);
    T.rBrow = atW('n08', /eyebrow/);
    T.r470 = atW('n08', /seventy/);
    T.r490 = atW('n08', /ninety/);
    T.closing = at('n09') - 0.2;
    T.jaw = atW('n09', /ninety/);
    T.street = at('n10') - 0.15;
    T.juggle = at('n12') - 0.2;
    T.drop = atW('n12', /^one/);
    T.chalk = at('n13') - 0.2;
    T.next = at('c01') - 0.95;
    T.end = K.tb('end');
    return T;
  }

  // ------------------------------------------------------------------ the counter's layout (the morning two-shot)
  const UN = D.UN, TH = D.TH;
  const TIN = [450, 1040];                            // the cash tin, centre back, between the uncle's hands
  const N500 = [430, 1360];                           // where his 500 lies, in front of the uncle
  const COIN = [470, 1250];                           // where the coin lands
  const PILE = [[652, 1452, '200', -0.04], [640, 1366, '200', 0.04], [628, 1280, '50', -0.03], [616, 1194, '20', 0.05], [604, 1108, '20', -0.04]];
  const WAD = ['200', '200', '50', '20', '20', '100', '100'];   // the wad he deals from, front first; the two 100s stay his
  const POCKET = [TH.x + 64, TH.y + 470];             // the thief's shirt pocket (his left chest, the side we see)
  const GLASS = [800, 1075];
  const US = { r: [UN.x - 190, UN.y + 285], l: [UN.x + 190, UN.y + 285] };
  const TS = [TH.x + 40, TH.y + 270];
  const UA = { skin: MEN.s2.skin }, TA = { skin: MEN.thief.skin, short: true };
  // an elbow that always bends outwards: halfway along the arm, pushed out by bend × its length (no IK, no flips)
  const elbow = (S, Wr, bend) => { const mx = lerp(S[0], Wr[0], 0.48), my = lerp(S[1], Wr[1], 0.48), dx = Wr[0] - S[0], dy = Wr[1] - S[1]; return [mx - dy * bend, my + dx * bend]; };

  // the uncle's right hand (screen-left): at rest, then the wad out of the tin, held while he deals, back in the tin at the end
  function uRightKeys(T) {
    return [
      { t: 0, x: 230, y: 1170, a: 1.62, fs: 0.86, pose: 'flat', ex: 100, ey: 1010 },
      { t: T.wad, d: 0.32, x: TIN[0] - 30, y: TIN[1] + 10, a: 1.2, fs: 0.9, pose: 'fist', bow: 0.15, ex: 170, ey: 1000 },
      { t: T.wad + 0.34, d: 0.3, x: 300, y: 1240, a: -PI / 2 + 0.1, fs: 1, pose: 'fist', bow: -0.1, ease: settle, ex: 130, ey: 1290 },
      { t: T.gather - 0.1, d: 0.4, x: TIN[0] - 40, y: TIN[1] + 20, a: 1.3, fs: 0.9, pose: 'fist', bow: 0.12, ex: 170, ey: 1000 },
      { t: T.gather + 0.35, d: 0.35, x: 230, y: 1170, a: 1.62, fs: 0.86, pose: 'flat', ex: 100, ey: 1010 },
    ];
  }
  // the uncle's left hand (screen-right): the lick, five notes dealt with a slap each, the coin into the tin, the 500 handed back, the wave
  function uLeftKeys(T) {
    const ks = [{ t: 0, x: 570, y: 1070, a: 1.5, fs: 0.86, pose: 'flat' }];
    ks.push({ t: T.lick, d: 0.2, x: UN.x + 70, y: UN.y + 180, a: -2.2, fs: 0.95, pose: 'fist', bow: -0.2 });
    ks.push({ t: T.lick + 0.32, d: 0.18, x: 360, y: 1120, a: -0.3, fs: 1, pose: 'pinch', bow: 0.1 });
    const deal = (tl, i) => {                                       // pull the front note off the wad, carry it, slap it down
      const [px, py] = PILE[i];
      ks.push({ t: tl - 0.42, d: 0.16, x: 362, y: 1112, a: -0.3, fs: 1, pose: 'pinch' });
      ks.push({ t: tl - 0.24, d: 0.24, x: px - 70, y: py - 12, a: 0.2, fs: 1, pose: 'flat', swap: 0.9, bow: 0.22, ease: ein });
      ks.push({ t: tl + 0.04, d: 0.16, x: px - 90, y: py - 70, a: 0.4, fs: 0.95, pose: 'rest' });
    };
    T.c.forEach((tl, i) => deal(tl, i));
    ks.push({ t: T.cut + 0.05, d: 0.2, x: 520, y: 1150, a: 1.1, fs: 0.9, pose: 'open' });
    ks.push({ t: T.sweep, d: 0.22, x: COIN[0] + 40, y: COIN[1] + 10, a: PI - 0.3, fs: 0.95, pose: 'flat', bow: 0.1 });
    ks.push({ t: T.sweep + 0.24, d: 0.26, x: TIN[0] + 50, y: TIN[1] + 20, a: PI - 0.6, fs: 0.95, pose: 'flat', bow: -0.15 });
    ks.push({ t: T.take500 - 0.1, d: 0.28, x: N500[0] + 70, y: N500[1] - 20, a: 0.15, fs: 1, pose: 'pinch', bow: 0.1 });
    ks.push({ t: T.take500 + 0.25, d: 0.5, x: 560, y: 1150, a: -0.05, fs: 1, pose: 'pinch', bow: 0.2, ease: settle });
    ks.push({ t: T.give + 0.2, d: 0.3, x: 560, y: 1080, a: 1.3, fs: 0.9, pose: 'rest' });
    T.c2.forEach((tl, j) => deal(tl, 3 + j));
    ks.push({ t: T.go - 0.35, d: 0.3, x: UN.x + 260, y: UN.y + 210, a: -1.65, fs: 1, pose: 'open', bow: 0.15 });
    ks.push({ t: T.go + 0.9, d: 0.4, x: 570, y: 1070, a: 1.5, fs: 0.86, pose: 'flat' });
    return ks;
  }
  // the thief's near (left) hand: the slap, the coin, the point, the 500 into his pocket, the taps, the notes gathered into a fan
  function tLeftKeys(T) {
    return [
      { t: 0, x: 740, y: 1250, a: PI + 0.1, fs: 1, pose: 'flat' },
      { t: 0.0, d: T.slap, x: 720, y: N500[1] - 8, a: PI + 0.1, fs: 1, pose: 'flat', ease: ein },
      { t: T.slap + 0.45, d: 0.45, x: 820, y: 1330, a: PI + 0.45, fs: 1, pose: 'rest', bow: -0.12 },
      { t: T.cut - 0.4, d: 0.24, x: COIN[0] + 120, y: COIN[1] - 40, a: PI + 0.15, fs: 1, pose: 'pinch', bow: -0.15 },
      { t: T.cut - 0.14, d: 0.14, x: COIN[0] + 92, y: COIN[1] - 4, a: PI + 0.1, fs: 1, pose: 'flat', ease: ein },
      { t: T.point, d: 0.22, x: N500[0] + 190, y: N500[1] - 40, a: PI - 0.2, fs: 1, pose: 'point' },
      { t: T.point + 0.5, d: 0.25, x: 780, y: 1180, a: -1.2, fs: 1, pose: 'point', bow: 0.1 },
      { t: T.give - 0.32, d: 0.3, x: 760, y: 1150, a: PI + 0.05, fs: 1, pose: 'pinch', ease: settle },
      { t: T.pocket, d: 0.36, x: POCKET[0] + 60, y: POCKET[1] - 10, a: -1.9, fs: 1, pose: 'pinch', bow: 0.2 },
      { t: T.pocket + 0.4, d: 0.22, x: 830, y: 1330, a: PI + 0.45, fs: 1, pose: 'rest' },
      { t: T.tap[0] - 0.16, d: 0.16, x: PILE[0][0] + 160, y: PILE[0][1] - 20, a: PI - 0.4, fs: 1, pose: 'point' },
      { t: T.tap[1] - 0.16, d: 0.16, x: PILE[1][0] + 160, y: PILE[1][1] - 20, a: PI - 0.4, fs: 1, pose: 'point' },
      { t: T.tap[2] - 0.16, d: 0.16, x: PILE[2][0] + 160, y: PILE[2][1] - 20, a: PI - 0.4, fs: 1, pose: 'point' },
      { t: T.tap[2] + 0.35, d: 0.3, x: 830, y: 1320, a: PI + 0.45, fs: 1, pose: 'rest' },
      { t: T.gather, d: 0.3, x: PILE[2][0] + 120, y: PILE[2][1], a: PI + 0.1, fs: 1, pose: 'flat', bow: 0.1 },
      { t: T.gather + 0.32, d: 0.34, x: 700, y: 1200, a: -PI / 2 - 0.4, fs: 1, pose: 'fist', bow: -0.1, ease: settle },
      { t: T.go + 0.1, d: 0.5, x: 760, y: 1240, a: -PI / 2 - 0.2, fs: 1, pose: 'fist' },
    ];
  }
  const tapDip = (t, T) => { let d = 0; for (const tt of T.tap) d = Math.max(d, Math.exp(-Math.pow((t - tt) / 0.06, 2))); return d; };
  const slapAt = (t, t0) => (t >= t0 && t < t0 + 0.35 ? Math.exp(-(t - t0) * 14) : 0);

  // ------------------------------------------------------------------ the faces: keyed, posed on twos
  function blink(t, seed) { const n = Math.floor(t / 3.4), r = mulberry32(n * 7 + Math.round(seed * 10)), t0 = n * 3.4 + 0.4 + r() * 2.4; return win(t, t0, t0 + 0.05, t0 + 0.1, t0 + 0.16); }
  function talk(t, ids, amp) {                       // the mouth opens and closes with the syllables of the words being said
    for (const p of ids) for (const w of WD(p)) if (t >= w.t0 && t <= w.t1) { const u = (t - w.t0) / Math.max(0.08, w.t1 - w.t0), syl = Math.max(1, Math.round((w.t1 - w.t0) / 0.18)); return amp * (0.35 + 0.65 * Math.abs(Math.sin(u * PI * syl))); }
    return 0;
  }
  function uncleFace(t, T) {
    const L = life(3.3, t, 1), F = {}; let lx = 12, ly = 8;
    const startle = sstep(T.slap, T.slap + 0.12, t) * (1 - sstep(0.9, 1.4, t));
    const dt = t - T.dbl;
    if (dt > 0 && dt < 1.0) { const q = Math.round(k1(dt, [[0, 0], [0.18, 1], [0.42, 1], [0.55, 2], [0.8, 2], [0.92, 0]])); lx = [6, 16, -4][q] ?? 6; ly = [10, 0, 10][q] ?? 10; }
    F.look = [lx + 4 * L.look, ly];
    F.op = talk(t, ['u01', 'u02', 'u03', 'u04', 'u05', 'u06', 'u07', 'u08', 'u09', 'u10'], 0.26) + 0.3 * startle;
    const sigh = win(t, T.sigh, T.sigh + 0.15, T.wad + 0.2, T.wad + 0.4);
    F.close = Math.max(0.8 * sigh, blink(t, 2.3));
    let wince = 0; for (const tl of [...T.c, ...T.c2]) wince = Math.max(wince, win(t, tl - 0.05, tl + 0.02, tl + 0.2, tl + 0.4));
    F.browIn = 0.8 * wince + 0.9 * win(t, T.brow, T.brow + 0.15, T.c2[1] + 0.2, T.c2[1] + 0.5);
    const joy = win(t, T.cut + 0.1, T.cut + 0.25, T.give + 0.3, T.give + 0.6);
    F.smile = Math.max(1.0 * joy, 0.35 * win(t, T.sorry, T.sorry + 0.2, T.c2[1], T.c2[1] + 0.3), 1.0 * win(t, T.toast, T.toast + 0.2, T.replay, T.replay + 1));
    F.browUp = Math.max(0.9 * startle, 0.5 * win(t, T.dbl, T.dbl + 0.2, T.sigh - 0.2, T.sigh), 0.6 * joy, 0.4 * win(t, T.brow, T.brow + 0.15, T.sorry + 0.3, T.sorry + 0.6));
    F.frown = 0.4 * wince;
    if (t > T.c[0] - 0.5 && t < T.cut) F.look = [8, 11];
    if (t > T.c2[0] - 0.5 && t < T.c2[1] + 0.3) F.look = [10, 11];
    if (t > T.brow - 0.1 && t < T.sorry + 0.2) F.look = [17, 0];
    if (t > T.go - 0.4) F.look = [16, 0];
    F.tilt = L.tilt + 0.05 * win(t, T.sorry, T.sorry + 0.15, T.sorry + 0.9, T.sorry + 1.1) - 0.04 * sigh;
    F.dy = 6 * sigh + 3 * L.breath - 8 * startle;
    F.tongue = win(t, T.lick + 0.16, T.lick + 0.2, T.lick + 0.28, T.lick + 0.32);
    return F;
  }
  function thiefFace(t, T) {
    const L = life(7.1, t, 1), F = {};
    F.browUp = win(t, T.brow, T.brow + 0.12, T.c2[0] - 0.1, T.c2[0] + 0.2);
    F.smile = 0.35 + 0.3 * win(t, T.give, T.give + 0.2, T.tap[0], T.tap[0] + 0.3) + 0.25 * F.browUp + 0.5 * win(t, T.toast, T.toast + 0.2, 99, 100);
    F.close = Math.max(blink(t, 4.1), 0.9 * win(t, T.sip, T.sip + 0.12, T.sip + 0.45, T.sip + 0.55));
    F.look = t > T.tap[0] - 0.2 && t < T.brow ? 0.6 : 0;
    F.tilt = L.tilt + 0.06 * F.browUp - 0.08 * win(t, T.sip, T.sip + 0.15, T.sip + 0.45, T.sip + 0.6);
    return F;
  }

  // ------------------------------------------------------------------ shot 1: the counter, morning (the con, and the question)
  let BG0 = null;
  function stall(opt) { D.setBG(null); D.makeStall(opt); return D.stallBG(); }
  function money500(t, T, ul, tl) {                   // where the 500 is: his hand, the counter, the uncle's hand, his hand, his pocket
    if (t < T.slap) return { where: 'thief', x: tl.x - 290, y: tl.y + 8, r: -0.06, sq: lerp(0.95, FLAT, t / T.slap) };
    if (t < T.take500 + 0.12) return { where: 'counter', x: N500[0], y: N500[1], r: -0.06 };
    if (t < T.give) { const u = clamp((t - T.take500 - 0.12) / 0.4); return { where: 'uncle', x: ul.x + 140, y: ul.y + 8, r: lerp(-0.06, 0.02, u), sq: lerp(FLAT, 0.95, u) }; }
    if (t < T.pocket + 0.3) { const u = clamp((t - T.pocket) / 0.36); return { where: 'thief', x: tl.x - 130 * (1 - u), y: tl.y + 6, r: lerp(0.02, -1.3, u), sq: lerp(0.95, 0.8, u) }; }
    return { where: 'pocket' };
  }
  function coinAt(t, T) {
    if (t < T.cut - 0.14) return { where: 'thief' };
    if (t < T.sweep + 0.24) return { where: 'counter', x: COIN[0], y: COIN[1] };
    if (t < T.sweep + 0.4) { const u = clamp((t - T.sweep - 0.24) / 0.16); return { where: 'counter', x: lerp(COIN[0], TIN[0] + 20, u), y: lerp(COIN[1], TIN[1] - 10, u) }; }
    return { where: 'tin' };
  }
  function dust(g, x, y, s) {                          // a slap: a puff of lines out from under the note
    g.save(); g.strokeStyle = `rgba(255,250,235,${0.85 * s})`; g.lineWidth = 6; g.lineCap = 'round';
    for (const a of [-2.75, -2.35, -0.8, -0.4, 2.55, 0.55]) { const r0 = 150 + 30 * (1 - s), r1 = r0 + 40 * s; g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * 0.42); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.42); g.stroke(); }
    g.restore();
  }
  function heldNote(g, h, ang, skin, left, drawNote) { hand(g, h[0], h[1], ang, 185, 'hold', { left, skin, part: 'under' }); drawNote(); hand(g, h[0], h[1], ang, 185, 'hold', { left, skin, part: 'over' }); }
  function shotCounter(g, t, T) {
    if (!BG0) BG0 = stall({});
    const tc = on2(t), L = life(1.7, t, 1);
    const push = sstep(T.tap[0] - 0.6, T.brow + 0.2, t) * (1 - sstep(T.sorry + 0.6, T.c2[1] + 0.2, t));
    const z = 1 + (t > T.slap ? 0.035 * Math.exp(-(t - T.slap) * 6) : 0) + 0.25 * mj(push);
    const sh = t > T.slap && t < T.slap + 0.5 ? 9 * Math.exp(-(t - T.slap) * 11) * Math.sin((t - T.slap) * 62) : 0;
    const shc = t > T.cut && t < T.cut + 0.4 ? 5 * Math.exp(-(t - T.cut) * 12) * Math.sin((t - T.cut) * 70) : 0;
    const cx = lerp(540, 620, mj(push)), cy = lerp(960, 1000, mj(push));
    g.save(); g.translate(cx, cy + sh + shc); g.scale(z, z); g.translate(-cx + 3 * Math.sin(t * 0.4), -cy + 2 * Math.cos(t * 0.33));
    g.drawImage(BG0, 0, 0);
    steam(g, 75, 650, t, 0.55);
    const fU = uncleFace(tc, T), fT = thiefFace(tc, T);
    const goX = 480 * mj((tc - T.go) / 0.7), here = goX < 470;
    const ur = trackAt(tc, uRightKeys(T)), ul = trackAt(tc, uLeftKeys(T)), tl = trackAt(tc, tLeftKeys(T));
    D.uncleBody(g, fU, { dy: fU.dy });
    if (here) { g.save(); g.translate(goX, 0); D.thiefBody(g, fT, { pocket500: tc > T.pocket + 0.3, sip: tc > T.sip - 0.15 ? { up: mj((tc - T.sip + 0.15) / 0.3), toast: mj((tc - T.toast) / 0.3) } : null }); g.restore(); }
    D.counter(g);
    tin(g, TIN[0], TIN[1], 0.8, { coin: tc > T.sweep + 0.4 });
    if (tc < T.sip - 0.15) glass(g, GLASS[0], GLASS[1], 0.48, 0);
    const dealtBy = (i) => (i < 3 ? T.c[i] : T.c2[i - 3]);
    const m = money500(tc, T, ul, tl);
    if (m.where === 'counter') { note(g, 500, m.x, m.y, m.r, FLAT); if (tc > T.slap) dust(g, m.x, m.y, slapAt(tc, T.slap)); }
    const c = coinAt(tc, T); if (c.where === 'counter') { coin(g, c.x, c.y, 40, FLAT); if (tc > T.cut - 0.14) dust(g, c.x, c.y, 0.5 * slapAt(tc, T.cut - 0.02)); }
    const gat = clamp((tc - T.gather) / 0.32);
    for (let i = 0; i < 5; i++) {
      const tl0 = dealtBy(i); if (tc < tl0 || gat >= 1) continue;
      const [px, py, d, r] = PILE[i], s = slapAt(tc, tl0), gx = lerp(px, tl.x - 60, mj(gat)), gy = lerp(py, tl.y, mj(gat));
      note(g, d, gx, gy, r * (1 - gat), FLAT, { k: 0.9 });
      if (s > 0.05) dust(g, px, py, s);
    }
    // arms
    const dip = 18 * tapDip(tc, T), Wt = [tl.x + goX, tl.y + dip], Wr = [ur.x, ur.y], Wl = [ul.x, ul.y];
    if (here) { const S = [TS[0] + goX, TS[1]]; arm(g, S, elbow(S, Wt, 0.22), Wt, TA); }
    arm(g, US.r, ur.ex != null ? [ur.ex, ur.ey] : elbow(US.r, Wr, -0.2), Wr, { ...UA, foldSide: -1 });
    arm(g, US.l, elbow(US.l, Wl, 0.2), Wl, UA);
    // the uncle's right hand and the wad: the notes fan up from his fist; dealt notes leave it
    const sk = { u: MEN.s2.skin, t: MEN.thief.skin };
    if (tc >= T.wad + 0.2 && tc < T.gather + 0.2) { const left = WAD.filter((d, i) => i >= 5 || tc < dealtBy(i) - 0.26); fanOf(g, left, ur.x, ur.y - 100, -0.34, 0.1, 0.6, ur.a, sk.u, false); }
    else hand(g, ur.x, ur.y, ur.a, 185, ur.pose, { skin: sk.u, fs: ur.fs });
    // the uncle's left hand: a note on its way to the pile (his thumb on top), the 500 going back, or empty
    let inHand = null;
    for (let i = 0; i < 5; i++) { const tl0 = dealtBy(i); if (tc >= tl0 - 0.26 && tc < tl0) inHand = i; }
    if (inHand != null) { const [, , d, r] = PILE[inHand], u = clamp((tc - (dealtBy(inHand) - 0.26)) / 0.26); heldNote(g, Wl, ul.a, sk.u, true, () => note(g, d, ul.x + 70, ul.y + 14, lerp(-0.3, r, u), lerp(0.95, FLAT, u), { k: 0.9, shadow: false })); }
    else if (m.where === 'uncle') heldNote(g, Wl, ul.a, sk.u, true, () => note(g, 500, m.x, m.y, m.r, m.sq, { shadow: false, lift: 0.5 }));
    else hand(g, ul.x, ul.y, ul.a, 185, ul.pose, { left: true, skin: sk.u, fs: ul.fs });
    // the thief's hand: the 500 (frame 0, and on its way to his pocket), the coin, the fan of the uncle's notes
    if (here) {
      if (m.where === 'thief') heldNote(g, Wt, tl.a, sk.t, true, () => note(g, 500, m.x + goX, m.y + dip, m.r, m.sq, { shadow: false }));
      else if (gat > 0) fanOf(g, ['200', '200', '50', '20', '20'], Wt[0], Wt[1] - 100, -0.55, lerp(0.02, 0.22, mj(gat)), 0.64, tl.a, sk.t, true);
      else { if (c.where === 'thief') coin(g, Wt[0] - 64, Wt[1] + 6, 36, 0.9, { shadow: false }); hand(g, Wt[0], Wt[1], tl.a, 190, tl.pose, { left: true, skin: sk.t }); }
    }
    g.restore();
    if (t >= T.q - 0.1 && t < T.replay) { const q = clamp(K.hit(t, T.q)); g.save(); g.translate(540, 380); g.scale(lerp(0.9, 1, q), lerp(0.9, 1, q)); g.globalAlpha = clamp((t - T.q + 0.1) * 8); txt(g, 'HOW MUCH', 0, 0, 128, '#fff6e2', { align: 'center', stroke: '#14100a', sw: 0.14 }); txt(g, 'DID HE STEAL?', 0, 120, 128, '#ffd34a', { align: 'center', fit: 900, stroke: '#14100a', sw: 0.14 }); g.restore(); }
  }

  // ------------------------------------------------------------------ shot 2: the replay, from straight above
  // The counter as a table: the uncle's side at the top (his tin, his hands from the top edge), his side at the bottom (his hand
  // from the bottom right). Only the uncle's notes are edged, in his orange; the count over his side counts only them.
  const UNC = '#ff8a1f';
  function shotAbove(g, t, T) {
    const tc = on2(t);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#b98048'], [1, '#a46c3a']); g.fillRect(0, 0, W, H);
    const r = mulberry32(3); g.strokeStyle = 'rgba(70,40,18,0.3)'; g.lineWidth = 3; for (let i = 1; i < 9; i++) { g.beginPath(); g.moveTo(0, i * 220); g.lineTo(W, i * 220); g.stroke(); }
    g.strokeStyle = 'rgba(70,40,18,0.1)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { const y = r() * H, x = r() * W; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 80, y + 4, x + 200, y - 2); g.stroke(); }
    const zoom = 1 + 0.04 * sstep(T.replay, T.closing, t); g.save(); g.translate(540, 960); g.scale(zoom, zoom); g.translate(-540, -960);
    // the two sides, and where the money crosses
    const MID = 930;
    g.strokeStyle = 'rgba(255,240,215,0.45)'; g.setLineDash([22, 18]); g.lineWidth = 5; g.beginPath(); g.moveTo(40, MID); g.lineTo(1040, MID); g.stroke(); g.setLineDash([]);
    const la = clamp((t - T.replay - 0.2) * 4);
    txt(g, "THE UNCLE'S SIDE", 80, MID - 26, 52, UNC, { stroke: '#2a1608', sw: 0.14, a: la });
    txt(g, 'HIS SIDE', 80, MID + 70, 52, '#fff6e2', { stroke: '#2a1608', sw: 0.14, a: la });
    tin(g, 230, 560, 1.05);
    // his 500: across to the uncle's side ("came down"), and back ("went back")
    const down = mj((tc - T.r500) / 0.45), back = mj((tc - T.rBack) / 0.5);
    const p500 = [lerp(lerp(790, 740, down), 790, back), lerp(lerp(1330, 640, down), 1330, back)];
    // the uncle's five notes, one by one from his tin to the customer's side
    const dest = [[230, 1100], [420, 1130], [600, 1160], [310, 1250], [500, 1280]], ds = ['200', '200', '50', '20', '20'];
    const tOut = [T.r450, T.r450 + 0.38, T.r450 + 0.76, T.r470, T.r490];
    let count = 0, any = false;
    for (let i = 0; i < 5; i++) {
      const u = mj((tc - tOut[i]) / 0.42); if (u > 0) any = true; if (u > 0.99) count += +ds[i];
      if (u > 0) { const x = lerp(230, dest[i][0], u), y = lerp(520, dest[i][1], u) - 60 * Math.sin(u * PI); note(g, ds[i], x, y, (i % 2 ? 0.06 : -0.05) * u, 1, { tag: UNC, shadow: false }); }
    }
    // his coin: to the uncle's tin, for the chai
    const cu = mj((tc - T.rCoin) / 0.45);
    coin(g, lerp(880, 300, cu), lerp(1330, 470, cu) - 120 * Math.sin(cu * PI), 44, 1, { shadow: false });
    if (t > T.rCoin + 0.45) txt(g, 'FOR THE CHAI', 300, 410, 44, '#fff6e2', { align: 'center', stroke: '#2a1608', sw: 0.14, a: clamp((t - T.rCoin - 0.45) * 4) * (1 - clamp((t - T.rBrow) * 3)) });
    note(g, 500, p500[0], p500[1], 0.04, 1, { shadow: false });
    // the uncle's dealing hand, from the top edge, riding each note out; his raised-eyebrow finger, from the bottom right
    const nowI = tOut.findIndex((t0) => tc >= t0 - 0.1 && tc < t0 + 0.45);
    if (nowI >= 0) { const u = mj((tc - tOut[nowI]) / 0.42), x = lerp(230, dest[nowI][0], u) + 70, y = lerp(520, dest[nowI][1], u) - 60 * Math.sin(u * PI) - 40; arm(g, [520, -60], [x + 40, y - 300], [x, y], UA); hand(g, x, y, PI / 2 + 0.3, 200, 'hold', { left: true, skin: MEN.s2.skin, part: 'over' }); }
    if (t > T.rBrow - 0.2 && t < T.r490 + 0.2) { const a = clamp((t - T.rBrow + 0.2) * 5) * (1 - clamp((t - T.r490) * 4)), tap = Math.exp(-Math.pow((tc - T.rBrow - 0.3) / 0.08, 2)); g.save(); g.globalAlpha = a; const hx = 860, hy = 1260 + 14 * tap; arm(g, [1150, 1900], [1040, 1520], [hx, hy], TA); hand(g, hx, hy, PI + 0.55, 220, 'point', { left: true, skin: MEN.thief.skin }); g.restore(); }
    // the count over the customer's side: only the uncle's notes
    if (any) {
      const glow = t > T.r490 + 0.4 ? 0.5 + 0.5 * Math.sin((t - T.r490) * 5) : 0;
      R(g, 160, 1370, 400, 136, 68); g.fillStyle = 'rgba(20,14,10,0.86)'; g.fill();
      txt(g, String(count), 360, 1478, 118, count === 490 ? UNC : '#fff6e2', { align: 'center' });
      if (glow > 0) { g.save(); g.globalAlpha = 0.35 * glow; R(g, 150, 1360, 420, 156, 78); g.strokeStyle = UNC; g.lineWidth = 12; g.stroke(); g.restore(); }
    }
    g.restore();
  }

  // ------------------------------------------------------------------ shot 3: closing time. The tin counted, counted again, the jaw drop
  let BGN = null;
  function shotClosing(g, t, T) {
    if (!BGN) BGN = stall({ night: true });
    const tc = on2(t), d = t - T.closing;
    g.save(); const z = 1.0 + 0.1 * mj(d / 2.4); g.translate(380, 760); g.scale(z, z); g.translate(-380, -760);
    g.drawImage(BGN, 0, 0);
    const jaw = mj((tc - T.jaw) / 0.18), recount = win(tc, T.closing + 0.2, T.closing + 0.4, T.jaw - 0.3, T.jaw);
    D.uncleBody(g, { look: [0, 30 - 30 * jaw], op: 0.85 * jaw, browUp: 1.1 * jaw, close: blink(tc, 1.2) * (1 - jaw), browIn: 0.6 * recount * (1 - jaw), dy: -10 * jaw }, { night: true });
    D.counter(g, { night: true });
    tin(g, TIN[0], TIN[1], 0.8, { coin: true });
    const flick = (tc * 6) % 1, cnt = tc < T.jaw;
    const Wr = [TIN[0] - 170, TIN[1] + 220 + (cnt ? 6 * Math.sin(flick * TAU) : 0)], Wl = [TIN[0] + 120, TIN[1] + 100 - (cnt ? 14 * mj(flick) : -40 * jaw)];
    arm(g, US.r, [110, 1290], Wr, { ...UA, foldSide: -1 }); arm(g, US.l, elbow(US.l, Wl, 0.2), Wl, UA);
    fanOf(g, ['100', '100', '20', '50'], Wr[0], Wr[1] - 100, -0.34, 0.1, 0.6, 0, MEN.s2.skin, false);
    hand(g, Wl[0], Wl[1], cnt ? -0.4 : 1.4, 185, cnt ? 'pinch' : 'open', { left: true, skin: MEN.s2.skin });
    g.restore();
    g.fillStyle = 'rgba(10,14,30,0.18)'; g.fillRect(0, 0, W, H);
  }

  // ------------------------------------------------------------------ shot 4: the street. He walks away, the uncle's notes fanned in his hand
  function shotStreet(g, t, T) {
    const d = t - T.street;
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#f2a868'], [0.45, '#f6cf98'], [1, '#c9b49a']); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 7; i++) {
      const u = i / 7, y0 = lerp(380, 820, u), h = lerp(700, 120, u), c = ['#3fa7a0', '#d96f6a', '#e8b84a', '#7c86c6', '#c9845a', '#58a56a', '#d96f6a'][i];
      g.globalAlpha = 0.85;
      g.fillStyle = c; g.beginPath(); g.moveTo(0, y0 - h * 0.6); g.lineTo(lerp(330, 470, u), lerp(420, 860, u) - h * 0.3); g.lineTo(lerp(330, 470, u), lerp(420, 860, u) + 200 - u * 120); g.lineTo(0, y0 + h); g.closePath(); g.fill();
      g.fillStyle = mix(c, '#ffffff', 0.12); g.beginPath(); g.moveTo(W, y0 - h * 0.6); g.lineTo(lerp(750, 610, u), lerp(420, 860, u) - h * 0.3); g.lineTo(lerp(750, 610, u), lerp(420, 860, u) + 200 - u * 120); g.lineTo(W, y0 + h); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
    g.fillStyle = lg(g, 0, 900, 0, H, [0, '#8a7a68'], [1, '#6b5d4f']); g.beginPath(); g.moveTo(470, 900); g.lineTo(610, 900); g.lineTo(W + 200, H); g.lineTo(-200, H); g.closePath(); g.fill();
    const walk = on2(d) * 1.7, s = lerp(0.74, 0.42, mj(d / 3.6)), x = 540 + 10 * Math.sin(walk * PI), y = lerp(1700, 1260, mj(d / 3.6));
    D.thiefBack(g, x, y, s, walk, { fan: true });
  }

  // ------------------------------------------------------------------ shot 5: the juggle. Four things at once; a fifth; the 450 falls into his palm
  function shotJuggle(g, t, T) {
    if (!BG0) BG0 = stall({});
    const tc = on2(t), d = tc - T.juggle;
    g.drawImage(BG0, 0, 0); g.fillStyle = 'rgba(40,30,60,0.35)'; g.fillRect(0, 0, W, H);
    const cx = UN.x + 40, cy = 470, rx = 230, ry = 170, sp = 1.1;
    const extra = mj((tc - (T.drop - 1.0)) / 0.5), fall = mj((tc - T.drop) / 0.6);
    D.uncleBody(g, { look: [8 * Math.sin(d * sp * TAU / 2), -26], op: 0.15 + 0.2 * fall, browUp: 0.4 + 0.8 * fall, close: 0 }, {});
    D.counter(g);
    const kinds = ['500', '450', 'coin', 'glass'];
    for (let i = 0; i < 4; i++) {
      const a = (d * sp + i / 4) * TAU, x = cx + rx * Math.cos(a), y = cy - ry * Math.abs(Math.sin(a)) + 40;
      if (i === 1 && fall > 0) { juggleItem(g, '450', lerp(x, 860, fall), lerp(y, 1240, fall) - 220 * Math.sin(fall * PI), fall * 2.4); continue; }
      juggleItem(g, kinds[i], x, y, a);
    }
    if (extra > 0 && fall < 1) { const qx = lerp(980, cx + 120, extra), qy = lerp(900, 360, extra) - 120 * Math.sin(extra * PI); g.save(); g.globalAlpha = 1 - fall; txt(g, '?', qx, qy, 150, '#ffd34a', { align: 'center', stroke: '#14100a', sw: 0.12 }); g.restore(); }
    for (const [S, sgn] of [[US.r, -1], [US.l, 1]]) { const Wh = [cx + sgn * 170, 860 + 20 * Math.sin(d * sp * TAU + (sgn > 0 ? PI : 0))]; arm(g, S, elbow(S, Wh, sgn * 0.2), Wh, UA); hand(g, Wh[0], Wh[1], -PI / 2 + sgn * 0.3, 185, 'open', { left: sgn > 0, skin: MEN.s2.skin }); }
    const pa = mj((tc - (T.drop - 0.3)) / 0.3); if (pa > 0) { g.save(); g.globalAlpha = pa; D.palmUp(g, 900, 1290, 1.0, MEN.thief.skin); g.restore(); }
  }
  function juggleItem(g, kind, x, y, a) {
    g.save(); g.translate(x, y); g.rotate(Math.sin(a) * 0.4);
    if (kind === '500') note(g, 500, 0, 0, 0, 1, { shadow: false, k: 0.62 });
    else if (kind === '450') { note(g, '50', 16, 10, 0.08, 1, { shadow: false, k: 0.56 }); note(g, '200', 8, 4, -0.04, 1, { shadow: false, k: 0.56 }); note(g, '200', 0, 0, 0, 1, { shadow: false, k: 0.56 }); }
    else if (kind === 'coin') coin(g, 0, 0, 42, 1, { shadow: false });
    else glass(g, 0, 0, 0.42, 0);
    g.restore();
  }

  // ------------------------------------------------------------------ shot 6: the chalkboard. ONE DEAL AT A TIME, under CHAI 10/-
  function shotChalk(g, t, T) {
    const d = t - T.chalk;
    g.fillStyle = '#4a3322'; g.fillRect(0, 0, W, H);
    R(g, 90, 520, 900, 760, 22); g.fillStyle = '#23302a'; g.fill(); g.strokeStyle = '#8a6a3f'; g.lineWidth = 26; g.stroke();
    const r = mulberry32(11); g.fillStyle = 'rgba(255,255,255,0.04)'; for (let i = 0; i < 260; i++) g.fillRect(110 + r() * 860, 540 + r() * 720, 30 + r() * 90, 3);
    txt(g, 'CHAI 10/-', 540, 720, 150, '#f4efe0', { align: 'center' });
    const shown = Math.min(4, Math.max(0, Math.floor((d - 0.25) / 0.42) + 1));
    let n = 0;
    for (const [ln, y] of [['ONE DEAL', 930], ['AT A TIME', 1130]]) { let line = ''; for (const p of ln.split(' ')) { if (n < shown) line += (line ? ' ' : '') + p; n++; } if (line) txt(g, line, 540, y, 150, '#fff8d8', { align: 'center' }); }
    const hx = lerp(260, 820, clamp((d - 0.25) / 1.7)), hy = d < 1.1 ? 960 : 1160;
    if (d < 2.4) { hand(g, hx + 40, hy + 40, -2.3, 230, 'pinch', { left: true, skin: MEN.s2.skin }); R(g, hx - 6, hy - 8, 46, 18, 6); g.fillStyle = '#f6f2e6'; g.fill(); }
  }

  // ------------------------------------------------------------------ shot 7: the next stall. The same 500, a new counter
  let BGX = null;
  function shotNext(g, t, T) {
    if (!BGX) BGX = stall({ next: true });
    const tc = on2(t), d = tc - T.next, slapT = 0.15;
    g.drawImage(BGX, 0, 0);
    const startle = sstep(slapT, slapT + 0.12, d);
    D.uncleBody(g, { look: [16, 18], browUp: 0.9 * startle, op: talk(tc, ['c01'], 0.26) + 0.2 * startle, close: blink(tc, 5.3) }, { who: 'next' });
    D.thiefBody(g, { smile: 0.45 }, {});
    D.counter(g, { next: true });
    const e = ein(clamp(d / slapT)), x = lerp(640, 620, e), y = lerp(1260, N500[1] - 8, e);
    note(g, 500, N500[0], lerp(1290, N500[1], e), -0.06, FLAT, { lift: Math.max(0, 1 - d / slapT) * 1.4 });
    if (d > slapT) dust(g, N500[0], N500[1], slapAt(d, slapT));
    const Wt = [x, y]; arm(g, TS, elbow(TS, Wt, 0.22), Wt, TA); hand(g, x, y, PI + 0.1, 190, 'flat', { left: true, skin: MEN.thief.skin });
    fanOf(g, ['200', '200', '50', '20', '20'], TH.x + 40, TH.y + 420, -0.5, 0.2, 0.55, -PI / 2, MEN.thief.skin, true);
  }

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g, T = times();
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.setLineDash([]); g.filter = 'none'; g.clearRect(0, 0, W, H);
      g.save();
      if (t < T.replay) shotCounter(g, t, T);
      else if (t < T.closing) shotAbove(g, t, T);
      else if (t < T.street) shotClosing(g, t, T);
      else if (t < T.juggle) shotStreet(g, t, T);
      else if (t < T.chalk) shotJuggle(g, t, T);
      else if (t < T.next) shotChalk(g, t, T);
      else shotNext(g, t, T);
      if (t < 2.4) { g.globalAlpha = 1 - sstep(1.9, 2.4, t); txt(g, "IT'S A CON.", 540, 340, 70, '#fff6e2', { align: 'center', stroke: '#14100a', sw: 0.16 }); txt(g, 'WATCH THE MONEY', 540, 458, 132, '#ffd34a', { align: 'center', fit: 860, stroke: '#14100a', sw: 0.14 }); g.globalAlpha = 1; }
      g.restore();
    },
  });
  scene({
    name: 'fx', from: 'hook', to: 'end',
    build(root, S) {
      const cv = C.el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:0.05` }, root);
      S.g = cv.getContext('2d'); S.tiles = K.grainTiles();
    },
    run(t, b, S) {
      const f = Math.round(t * 30), r = mulberry32(1000 + f), g = S.g;
      K.clear(g);
      const pat = g.createPattern(S.tiles[f % 4], 'repeat'), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
      g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256);
    },
  });

  window.UI.endcard();
  C.start();
})();
