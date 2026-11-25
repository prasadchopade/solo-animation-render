// Reel 49 · The Con. Tests desk. A customer in a maroon cap (the season's thief, silent) pays for a 10-rupee chai with a 500, cuts the
// uncle's count off with a 10 coin, gets his 500 back, taps the change, raises an eyebrow, and walks off with 490 of the uncle's money.
// "So. How much did he steal?" The replay, from straight above; closing time; the street; why (four things at once); the board; the
// next stall. Script: docs/script.md (draft 3, approved 23 Nov). Facts: docs/research.md. The drawings are film/draw.js.
// Every action is keyed to a placed word (film/words.js): the voice sets the clock. Hands and arms are keyed 2D poses on arcs (minimum
// jerk, a settle at the end of a fling), no rig. An elbow is keyed, or set from a pole, and an arm's two segments are never longer than
// nominal (build 3: the review saw arms stretch). A held note is held by an end or an edge, so its number always shows. People are
// posed on twos; the camera moves on ones.
// Copied from reel 42 (tag source/reel-42-what-did-he-take, film/film.js), by name: mj, key, life. 30 fps. Every frame is a pure
// function of t, sealed in save()/restore().
(() => {
  const { W, H, scene, canvas, clamp, lerp, mulberry32 } = C;
  const K = window.KIT, D = window.DRAW;
  const { TAU, PI, sstep, txt, R, lg, rg, mix, MEN, NOTE, FLAT, note, coin, tin, hand, arm, fanOf, glass, steam } = D;
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
  // easings for the hands: ein accelerates into a slap; settle overshoots a little and comes back (a flung move)
  const ein = (u) => { u = clamp(u); return u * u * u; };
  const settle = (u) => { u = clamp(u); return u >= 1 ? 1 : 1 - Math.exp(-5.5 * u) * Math.cos(7.5 * u) * (1 - u * 0.5); };
  const win = (t, a, b, c, d) => mj((t - a) / (b - a)) * (1 - mj((t - c) / (d - c)));
  // a keyed 2D track. keys: [{t, d, x, y, a, fs?, ex?, ey?, pose?, bow?, ease?, swap?}]: from key i-1's values to key i's, starting at
  // t and taking d seconds, along an arc (bow: how far the path bulges, as a share of its length). The hand's pose changes at swap.
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
  const shake = (t, t0, amp, dec, hz) => (t > t0 && t < t0 + 0.5 ? amp * Math.exp(-(t - t0) * dec) * Math.sin((t - t0) * hz) : 0);
  const pulse = (t, t0, w) => Math.exp(-Math.pow((t - t0) / w, 2));
  const tipOf = (w, a, L) => [w[0] + Math.cos(a) * L, w[1] + Math.sin(a) * L];
  const fromTip = (p, a, L) => [p[0] - Math.cos(a) * L, p[1] - Math.sin(a) * L];
  const lerp2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];

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
    T.look1 = 1.28; T.look2 = 1.5; T.look3 = 1.64; T.snap = 1.8;      // the double take: down at the note, up at him, down, the snap
    T.sipA = 1.95;                                                    // the customer sips his chai while the uncle stares at him
    T.point500 = at('u01') + 0.02;                                    // "Five hundred?": a finger at the note
    T.shrug = at('u01') + 0.32;                                       // the customer: a small shrug
    T.board = atW('u01', /ten|rupee/) - 0.06;                         // "ten-rupee": a jab at the CHAI 10/- board behind him
    T.palms = atW('u01', /chai/) + 0.02;                              // "chai?": palms up
    T.sigh = en('u01');
    T.wad = en('u01') - 0.02;                                         // the change, counted out of the tin before he deals it
    T.lick = en('u01') + 0.15;                                        // a lick of the thumb
    T.c = [at('u02') + 0.05, at('u03') + 0.05, at('u04') + 0.05];     // each note slapped down on its count
    T.reach4 = at('u05') - 0.05;                                      // a 20, pulled for "Four-sev—"
    T.cut = en('u05') - 0.3;                                          // the coin's slap lands as 'sev' dies (measured: the voice is gone by 10.05 s)
    T.coinUp = T.cut - 0.85;                                          // his hand down to his own trouser pocket for the coin
    T.back20 = T.cut + 0.32;                                          // the 20 back onto the wad
    T.sweep = atW('u06', /change/) - 0.12;                            // "you have change?": the coin picked up, into the tin
    T.point = atW('u06', /change/) + 0.3;                             // his finger at his own 500
    T.beckon = atW('u06', /^then/) - 0.3;                             // his hand: give it back
    T.take500 = atW('u06', /take/);                                   // "Then take your five hundred back"
    T.give = atW('u06', /back/) + 0.08;                               // he takes it on "back"
    T.ear = T.give + 0.06; T.tucked = T.ear + 0.38;                   // straight up to his temple, under the edge of his cap
    T.tap = [T.tucked + 0.36, T.tucked + 0.63, T.tucked + 0.9];       // one, two, three
    T.brow = T.tap[2] + 0.18;                                         // the eyebrow: a dip, up past the top, settle; held 20 frames, nothing else moving
    T.sorry = at('u07'); T.sorry1 = atW('u07', /sorry/, 0); T.sorry2 = atW('u07', /sorry/, 1);
    T.flinch = T.sorry - 0.16;                                        // then the uncle gets it
    T.c2 = [at('u08') + 0.05, at('u09') + 0.05];
    T.gather = en('u09') + 0.12;
    T.sip = T.gather + 0.3;
    T.toast = at('u10') + 0.02;
    T.wave = at('u10') - 0.05;
    T.go = en('u10') - 0.1;
    T.wipe = T.wave + 1.75;                                           // alone, content, he wipes the counter while we're asked
    T.q = at('n04');
    T.replay = at('n05') - 0.12;
    T.rIn = at('n05') - 0.1;                                          // "Nothing was hidden.": everything set out where it began, in plain view
    T.r500 = atW('n06', /came/);
    T.r450 = atW('n06', /counted/);
    T.rCoin = atW('n07', /^ten/);
    T.rBack = atW('n07', /went/);
    T.rBrow = atW('n08', /eyebrow/);
    T.r470 = atW('n08', /seventy/);
    T.r490 = atW('n08', /ninety/);
    T.rAns = atW('n09', /ninety/);
    T.closing = en('n09') + 0.15;
    T.jaw = T.closing + 1.0;
    T.street = en('n10') + 0.12;
    T.juggle = at('n12') - 0.2;
    T.more = atW('n12', /^one$/);                                     // "...handing the uncle one more."
    T.chalk = at('n13') - 0.2;
    T.write = [atW('n13', /^one$/) - 0.08, atW('n13', /^deal/) - 0.06, atW('n13', /^at$/) - 0.05, atW('n13', /^a$/) - 0.03, atW('n13', /^time/) - 0.03];
    T.next = at('c01') - 1.1;
    T.endBrow = en('c01') + 0.08;
    T.end = K.tb('end');
    return T;
  }

  // ------------------------------------------------------------------ the counter's layout (the morning two-shot), in screen pixels
  const UN = D.UN, TH = D.TH;
  const TIN = [400, 1010];                            // the cash tin, at the back, in front of the uncle
  const N500 = [400, 1335];                           // his 500, on the uncle's side of the counter
  const KP = 0.9;                                     // the change's notes, on the counter
  const PILE = [[716, 1422, '200', -0.04], [710, 1336, '200', 0.04], [704, 1250, '50', -0.03], [698, 1164, '20', 0.05], [692, 1078, '20', -0.04]];
  const WAD = ['200', '200', '50', '20', '20'];       // exactly the change for a 500: counted out of the tin before he deals it
  const COIN = [760, 1015];                           // clear wood at the back, by the customer: where the coin lands
  const HO = [650, 1105];                             // where the 500 changes hands, above the change
  const STACK = [778, 1258], STACKR = 908;            // where he sweeps the change together: their right ends lined up at STACKR
  const EAR5 = [TH.x + 80 * TH.s, TH.y - 80 * TH.s];  // his 500 under the edge of his cap, above his ear (draw.js headProfile, ear500)
  const US = { r: [UN.x - 190, UN.y + 285], l: [UN.x + 190, UN.y + 285] };
  const TS = [TH.x + 40, TH.y + 270];
  const UA = { skin: MEN.s2.skin }, TA = { skin: MEN.thief.skin, short: true };
  // the wad, fanned up in the uncle's right hand
  const WADW = [250, 1080], WADK = 0.6, WADS = 160, WADA = -0.3, WADD = 0.09;
  const FANB = [WADW[0], WADW[1] - 0.29 * WADS];
  const FRONT = (() => { const a = WADA, d = NOTE['200'].w * WADK * 0.32; return [FANB[0] + d * Math.sin(a), FANB[1] - d * Math.cos(a)]; })();   // the front note's centre
  const GRABTIP = [FRONT[0] + 78 * Math.cos(WADA), FRONT[1] + 78 * Math.sin(WADA)];                     // the front note's right end
  const PINCH = 146, FLATL = 170;                     // wrist to fingertips: a pinch, a flat hand (at 185)
  const AG = PI + 0.2, AS = PI / 2 - 0.3, A500 = PI / 2 + 0.25;   // the dealing hand plucks from the right, slaps down and to the right; the 500 by its top edge
  const GRABW = fromTip(GRABTIP, AG, PINCH);
  const slapTip = (i) => [PILE[i][0] + 86, PILE[i][1] - 28];   // the flat fingers land on the note's window side, clear of its number
  const slapW = (i) => fromTip(slapTip(i), AS, FLATL);
  const slapE = (i) => lerp2([560, 1140], [640, 830], i / 4);                                     // the far notes are slapped from higher up
  const endHeld = (tip, a, d, k) => { const hw = (NOTE[d].w * k) / 2; return { c: tipOf(tip, a, hw - 9), r: a - PI }; };   // a note pinched by its right end
  const dealtAt = (i) => (i < 3 ? T.c[i] : T.c2[i - 3]);

  // ------------------------------------------------------------------ arms: the elbow keyed, or set from a pole; never longer than nominal
  const LA = 290;
  function autoElbow(S, Wr, pole, L = LA) {
    const dx = Wr[0] - S[0], dy = Wr[1] - S[1], d = Math.hypot(dx, dy) || 1;
    let nx = -dy / d, ny = dx / d; const dot = nx * pole[0] + ny * pole[1]; if (dot < 0) { nx = -nx; ny = -ny; }
    const h = Math.min(Math.sqrt(Math.max(0, L * L - d * d / 4)), 0.22 * d + 30) * clamp(Math.abs(dot) / 0.3);
    return [(S[0] + Wr[0]) / 2 + nx * h, (S[1] + Wr[1]) / 2 + ny * h];
  }
  function fitElbow(S, E, Wr, L = LA) {               // pull the elbow in until neither segment is longer than L
    let e = [E[0], E[1]];
    for (let k = 0; k < 4; k++) for (const P of [S, Wr]) { const dx = e[0] - P[0], dy = e[1] - P[1], d = Math.hypot(dx, dy); if (d > L) e = [P[0] + (dx / d) * L, P[1] + (dy / d) * L]; }
    return e;
  }
  function limb(g, S, tr, Wr, pole, opt, dS = [0, 0], L = LA) {
    const E0 = tr.ex != null ? [tr.ex + dS[0] * 0.6, tr.ey + dS[1] * 0.6] : autoElbow(S, Wr, pole, L);
    arm(g, S, fitElbow(S, E0, Wr, L), Wr, opt);
  }
  const POLE = { ul: [-0.55, 0.83], ur: [0.55, 0.83], t: [0.7, 0.7] };

  // ------------------------------------------------------------------ the uncle's right hand (screen-left): the wad
  function uRightKeys(T) {
    const REST = { x: 205, y: 1165, a: 0.5, pose: 'rest', ex: 100, ey: 1060 };
    const HOLD = { x: WADW[0], y: WADW[1], a: -PI / 2 + 0.12, pose: 'hold', ex: 178, ey: 1172 };
    const WVR = { x: 130, y: 770, a: -1.4, pose: 'open', ex: 70, ey: 990 };
    return [
      { t: 0, ...REST },
      { t: T.slap, d: 0.1, ...REST, y: 1132, ey: 1030 },                                                         // the startle
      { t: T.slap + 0.35, d: 0.3, ...REST },
      { t: T.palms - 0.04, d: 0.16, x: 205, y: 1040, a: -1.3, pose: 'open', ex: 92, ey: 1085, ease: settle },     // "chai?": palm up
      { t: T.wad, d: 0.14, x: 335, y: 990, a: 0.7, pose: 'fist', ex: 175, ey: 1085 },                             // into the tin
      { t: T.wad + 0.16, d: 0.26, ...HOLD, bow: -0.12, ease: settle },                                           // out with the change
      { t: T.flinch, d: 0.08, ...HOLD, y: WADW[1] - 22 },
      { t: T.flinch + 0.2, d: 0.2, ...HOLD },
      { t: T.c2[1] - 0.2, d: 0.3, ...REST },                                                                     // empty: down
      // "Come again!": a wave with this hand, on his own side (clear of the customer's raised glass)
      { t: T.wave - 0.22, d: 0.22, ...WVR, ease: settle },
      ...[0, 1, 2, 3].map((k) => ({ t: T.wave + 0.16 + k * 0.26, d: 0.13, ...WVR, x: WVR.x + (k % 2 ? 14 : -14), a: WVR.a + (k % 2 ? 0.26 : -0.26) })),
      { t: T.wave + 1.3, d: 0.16, ...WVR },
      { t: T.wave + 1.6, d: 0.4, ...REST },
    ];
  }
  // the uncle's left hand (screen-right): the gestures, the lick, the deals, the coin into the tin, the 500 handed back, the apology, the wave
  function uLeftKeys(T) {
    const ks = [];
    const REST = { x: 590, y: 1070, a: PI - 0.55, pose: 'rest', ex: 610, ey: 1000 };
    ks.push({ t: 0, ...REST });
    ks.push({ t: T.slap, d: 0.1, ...REST, x: 600, y: 1040, ey: 975 });                                          // the startle
    ks.push({ t: T.slap + 0.35, d: 0.3, ...REST });
    const P5 = { x: 560, y: 1110, a: 2.25, pose: 'point', ex: 640, ey: 1040 };                                  // "Five hundred?": at the note
    ks.push({ t: T.point500 - 0.2, d: 0.2, ...P5, ease: settle });
    ks.push({ t: T.point500 + 0.36, d: 0.08, ...P5, x: 548, y: 1128 });
    ks.push({ t: T.point500 + 0.46, d: 0.1, ...P5 });
    const BD = { x: 640, y: 880, a: -PI / 2 - 0.25, pose: 'point', ex: 640, ey: 1060 };                         // "ten-rupee": at the board
    ks.push({ t: T.board - 0.3, d: 0.3, ...BD, bow: 0.12 });
    ks.push({ t: T.board + 0.1, d: 0.07, ...BD, x: 636, y: 860 });
    ks.push({ t: T.board + 0.18, d: 0.08, ...BD });
    ks.push({ t: T.board + 0.28, d: 0.07, ...BD, x: 636, y: 860 });
    ks.push({ t: T.board + 0.36, d: 0.08, ...BD });
    ks.push({ t: T.palms - 0.04, d: 0.16, x: 640, y: 990, a: -1.8, pose: 'open', ex: 640, ey: 1090, ease: settle });   // "chai?"
    ks.push({ t: T.lick, d: 0.16, x: 352, y: 754, a: -2.3, pose: 'fist', ex: 520, ey: 1010, bow: 0.1 });          // a lick of the thumb
    // a deal: plucked off the front of the wad (from above), swung across and slapped down, the hand straight off it
    const grab = (tl) => ks.push({ t: tl - 0.46, d: 0.16, x: GRABW[0], y: GRABW[1], a: AG, pose: 'pinch', ex: 560, ey: 1060, bow: 0.06 });
    const slap = (tl, i) => { const w = slapW(i), e = slapE(i); ks.push({ t: tl - 0.24, d: 0.24, x: w[0], y: w[1], a: AS, pose: 'flat', swap: 0.7, ease: ein, bow: 0.12, ex: e[0], ey: e[1] }); };
    const lift = (tl, i) => { const e = slapE(i); ks.push({ t: tl + 0.04, d: 0.34, x: GRABW[0] + 40, y: GRABW[1] + 24, a: AG - 0.15, pose: 'rest', bow: -0.16, ex: lerp(e[0], 560, 0.6), ey: lerp(e[1], 1060, 0.6) }); };
    for (let i = 0; i < 3; i++) { grab(T.c[i]); slap(T.c[i], i); lift(T.c[i], i); }
    // the fourth: a 20, wound up for a big slap on "Four-sev—", frozen by the coin, then back onto the wad
    grab(T.reach4 + 0.46);
    ks.push({ t: T.reach4 + 0.2, d: T.cut - T.reach4 - 0.23, x: 640, y: 960, a: PI + 0.3, pose: 'pinch', ex: 720, ey: 1010, bow: -0.08 });
    ks.push({ t: T.cut, d: 0.06, x: 646, y: 946, a: PI + 0.32, pose: 'pinch', ex: 724, ey: 998 });               // the jolt
    ks.push({ t: T.back20, d: 0.22, x: GRABW[0], y: GRABW[1], a: AG, pose: 'pinch', ex: 560, ey: 1060, bow: 0.08 });
    // "you have change?": the coin picked up off the wood by the wall, and dropped in the tin
    const cw = fromTip([COIN[0] - 26, COIN[1] + 2], 0.15, PINCH), tw = fromTip([430, 952], 2.17, PINCH);
    ks.push({ t: T.sweep, d: 0.14, x: cw[0], y: cw[1], a: 0.15, pose: 'pinch', ex: 470, ey: 990, bow: 0.1 });
    ks.push({ t: T.sweep + 0.18, d: 0.24, x: tw[0], y: tw[1], a: 2.17, pose: 'pinch', ex: 600, ey: 760, bow: 0.12 });
    ks.push({ t: T.sweep + 0.5, d: 0.2, x: 560, y: 1000, a: PI - 0.5, pose: 'rest', ex: 610, ey: 960 });
    // "Then take your five hundred back": picked up by its top edge, lifted, held out to him
    const pw = fromTip([N500[0] + 70, N500[1] - 36], A500, PINCH), hw = fromTip([HO[0] + 70, HO[1] - 51], A500, PINCH);
    ks.push({ t: T.take500 - 0.23, d: 0.23, x: pw[0], y: pw[1], a: A500, pose: 'pinch', ex: 590, ey: 1080 });
    ks.push({ t: T.take500 + 0.02, d: 0.2, x: pw[0] + 8, y: pw[1] - 95, a: A500, pose: 'pinch', ex: 600, ey: 960 });
    ks.push({ t: T.take500 + 0.24, d: 0.66, x: hw[0], y: hw[1], a: A500, pose: 'pinch', ex: 680, ey: 780, bow: 0.1 });
    ks.push({ t: T.give + 0.06, d: 0.32, ...REST, bow: -0.1 });
    // the flinch at his eyebrow; "Arre": a slap to the forehead; "sorry, sorry!": his hand on his heart, a bow each
    ks.push({ t: T.sorry - 0.16, d: 0.16, x: 430, y: 512, a: PI + 0.3, pose: 'flat', ex: 600, ey: 720, ease: ein, bow: 0.15 });
    const SR = { x: 500, y: 880, a: PI + 0.2, pose: 'flat', ex: 600, ey: 1000 };
    ks.push({ t: T.sorry1 - 0.14, d: 0.14, ...SR, ease: settle });
    ks.push({ t: T.sorry2 - 0.08, d: 0.08, ...SR, x: 494, y: 892 });
    ks.push({ t: T.sorry2 + 0.02, d: 0.12, ...SR });
    // the two 20s, in a hurry
    for (let j = 0; j < 2; j++) { grab(T.c2[j]); slap(T.c2[j], 3 + j); lift(T.c2[j], 3 + j); }
    ks.push({ t: T.c2[1] + 0.3, d: 0.3, ...REST });
    const WP = (k) => ({ x: 520 + 62 * Math.cos(k * 1.4), y: 1250 + 30 * Math.sin(k * 1.4), a: PI - 0.35, pose: 'flat', ex: 600, ey: 1080 });
    ks.push({ t: T.wipe, d: 0.3, ...WP(0) });
    for (let k = 1; T.wipe + 0.3 + (k - 1) * 0.15 < T.replay; k++) ks.push({ t: T.wipe + 0.3 + (k - 1) * 0.15, d: 0.15, ...WP(k), ease: (u) => u });
    return ks;
  }
  // the customer's near (left) hand: the slap, the coin, the point, the beckon, the 500 to his ear, the taps, the change gathered
  function tLeftKeys(T) {
    const REST = { x: 930, y: 1320, a: PI - 0.3, fs: 0.7, pose: 'rest', ex: 1000, ey: 1160 };
    const S0 = { x: N500[0] + 168, y: N500[1] - 2, a: PI, fs: 1, pose: 'hold', ex: 800, ey: 1170 };
    const cHold = fromTip([COIN[0] + 70, COIN[1] - 140], PI - 0.9, PINCH), cSlap = fromTip([COIN[0] + 26, COIN[1] - 18], PI - 0.9, 176);
    const tapW = (i) => fromTip([PILE[i][0] + 62, PILE[i][1] - 6], PI - 0.9, 176);
    const ks = [
      { t: 0, ...S0, x: S0.x + 20, y: S0.y - 72, ey: 1110 },                                                    // frame 0: coming down
      { t: 0, d: T.slap, ...S0, ease: ein },
      { t: T.slap + 0.03, d: 0.2, x: S0.x + 70, y: S0.y - 120, a: PI - 0.45, fs: 1, pose: 'rest', ex: 820, ey: 1080, ease: settle },
      { t: T.slap + 0.4, d: 0.45, ...REST, bow: -0.1 },
      // the coin: out of his own trouser pocket, up, slapped down on the clear wood, his hand straight off it
      { t: T.coinUp, d: 0.22, x: 940, y: 1420, a: PI / 2 + 0.25, fs: 1, pose: 'fist', ex: 985, ey: 1150 },
      { t: T.coinUp + 0.26, d: 0.34, x: cHold[0], y: cHold[1], a: PI - 0.9, fs: 1, pose: 'pinch', ex: 990, ey: 760, bow: 0.12 },
      { t: T.cut - 0.14, d: 0.12, x: cSlap[0], y: cSlap[1], a: PI - 0.9, fs: 1, pose: 'point', swap: 0.4, ex: 985, ey: 770, ease: ein },
      { t: T.cut + 0.03, d: 0.2, x: 935, y: 760, a: PI - 1.1, fs: 1, pose: 'rest', ex: 1000, ey: 700, ease: settle },
      { t: T.cut + 0.3, d: 0.36, ...REST },
      // his finger at his own 500, twice; then his hand, open: give it back
      { t: T.point - 0.24, d: 0.24, x: 800, y: 1110, a: 2.75, fs: 1, pose: 'point', ex: 905, ey: 1060, ease: settle },
      { t: T.point + 0.14, d: 0.07, x: 788, y: 1116, a: 2.75, fs: 1, pose: 'point', ex: 900, ey: 1060 },
      { t: T.point + 0.21, d: 0.08, x: 800, y: 1110, a: 2.75, fs: 1, pose: 'point', ex: 905, ey: 1060 },
      { t: T.beckon, d: 0.14, x: 850, y: 1125, a: PI - 0.12, fs: 1, pose: 'open', ex: 935, ey: 1060 },
      { t: T.beckon + 0.16, d: 0.1, x: 856, y: 1125, a: PI - 0.12, fs: 1, pose: 'rest', ex: 935, ey: 1060 },
      { t: T.beckon + 0.28, d: 0.1, x: 850, y: 1125, a: PI - 0.12, fs: 1, pose: 'open', ex: 935, ey: 1060 },
      { t: T.beckon + 0.4, d: 0.1, x: 856, y: 1125, a: PI - 0.12, fs: 1, pose: 'rest', ex: 935, ey: 1060 },
      { t: T.beckon + 0.52, d: 0.12, x: 850, y: 1125, a: PI - 0.12, fs: 1, pose: 'open', ex: 935, ey: 1060 },
      // the 500 taken by its end, on "back", and straight up under the edge of his cap (the hand stays behind it, to its right)
      { t: T.give - 0.3, d: 0.28, x: HO[0] + 168, y: HO[1], a: PI, fs: 1, pose: 'hold', ex: 905, ey: 1040 },
      { t: T.ear, d: T.tucked - T.ear, x: EAR5[0] + 150 * 0.434 + 18, y: EAR5[1], a: PI, fs: 1, pose: 'hold', ex: 1000, ey: 760, bow: -0.08 },
      // away to the right and down, then one, two, three: the three notes tapped, window side; then still, poised, for the eyebrow
      { t: T.tucked + 0.02, d: 0.12, x: 975, y: 700, a: PI - 0.7, fs: 1, pose: 'rest', ex: 1010, ey: 880 },
      { t: T.tucked + 0.14, d: 0.2, x: tapW(0)[0], y: tapW(0)[1], a: PI - 0.9, fs: 1, pose: 'point', swap: 0.3, ex: 965, ey: 1100, bow: 0.08 },
      { t: T.tap[1] - 0.15, d: 0.13, x: tapW(1)[0], y: tapW(1)[1], a: PI - 0.9, fs: 1, pose: 'point', ex: 962, ey: 1020 },
      { t: T.tap[2] - 0.15, d: 0.13, x: tapW(2)[0], y: tapW(2)[1], a: PI - 0.9, fs: 1, pose: 'point', ex: 958, ey: 940 },
      { t: T.tap[2] + 0.06, d: 0.12, x: tapW(2)[0] + 24, y: tapW(2)[1] - 30, a: PI - 0.85, fs: 1, pose: 'point', ex: 960, ey: 930 },
      { t: T.sorry + 0.25, d: 0.4, ...REST },
      // the change: swept together under a flat hand, lifted by its end, fanned
      { t: T.gather - 0.3, d: 0.3, x: STACKR + 10, y: STACK[1] - 16, a: PI + 0.1, fs: 1, pose: 'flat', ex: 1010, ey: 1160 },
      { t: T.gather, d: 0.27, x: STACKR + 18, y: STACK[1], a: PI, fs: 1, pose: 'hold', swap: 0.8, ex: 1010, ey: 1170 },
      { t: T.gather + 0.29, d: 0.26, x: 870, y: 1120, a: PI + 0.55, fs: 1, pose: 'hold', ex: 960, ey: 1150, ease: settle },
    ];
    return ks;
  }
  const tapDip = (t, T) => { let d = 0; for (const tt of T.tap) d = Math.max(d, pulse(t, tt, 0.05)); return d; };
  const slapAt = (t, t0) => (t >= t0 && t < t0 + 0.35 ? Math.exp(-(t - t0) * 14) : 0);

  // ------------------------------------------------------------------ the faces: keyed, posed on twos
  function blink(t, seed) { const n = Math.floor(t / 3.4), r = mulberry32(n * 7 + Math.round(seed * 10)), t0 = n * 3.4 + 0.4 + r() * 2.4; return win(t, t0, t0 + 0.05, t0 + 0.1, t0 + 0.16); }
  function talk(t, ids, amp) {                       // the mouth opens and closes with the syllables of the words being said
    for (const p of ids) for (const w of WD(p)) if (t >= w.t0 && t <= w.t1) { const u = (t - w.t0) / Math.max(0.08, w.t1 - w.t0), syl = Math.max(1, Math.round((w.t1 - w.t0) / 0.18)); return amp * (0.35 + 0.65 * Math.abs(Math.sin(u * PI * syl))); }
    return 0;
  }
  function lookSeq(t, seq) { let v = seq[0][1]; for (const [t0, l] of seq) if (t >= t0) v = l; return v; }
  // where the uncle's eyes go (head units: the iris stays inside the eye, |x| ≤ 20, -10 ≤ y ≤ 12), and his face and body, beat by beat
  const LK = { th: [17, 0], n5: [6, 11], pile: [12, 11], wad: [-9, 11], coin: [18, 5], board: [20, -4], tin: [5, 10], ho: [14, 7], up: [-2, -8] };
  function uncleFace(t, T) {
    const L = life(3.3, t, 1), F = {}, B = {};
    F.look = lookSeq(t, [[0, LK.th], [T.slap + 0.05, LK.n5], [T.look1, LK.n5], [T.look2, LK.th], [T.look3, LK.n5], [T.snap, LK.th], [T.board - 0.15, LK.board], [T.palms, LK.th],
      [T.sigh + 0.05, LK.wad], [T.c[0] - 0.24, LK.pile], [T.c[1] - 0.46, LK.wad], [T.c[1] - 0.24, LK.pile], [T.c[2] - 0.46, LK.wad], [T.c[2] - 0.24, LK.pile],
      [T.reach4, LK.wad], [T.reach4 + 0.2, LK.pile], [T.cut + 0.02, LK.coin], [at('u06') + 0.1, LK.th], [T.sweep + 0.06, LK.coin], [T.sweep + 0.3, LK.tin],
      [T.point, LK.th], [T.take500 - 0.2, LK.n5], [T.take500 + 0.3, LK.ho], [T.give, LK.th], [T.tap[0] - 0.1, LK.pile], [T.tap[2] + 0.12, LK.th],
      [T.c2[0] - 0.46, LK.wad], [T.c2[0] - 0.24, LK.pile], [T.c2[1] - 0.46, LK.wad], [T.c2[1] - 0.24, LK.pile], [T.gather, LK.th]]);
    const startle = win(t, T.slap, T.slap + 0.08, T.slap + 0.4, T.slap + 0.8);
    const snap = win(t, T.snap, T.snap + 0.06, T.point500 - 0.2, T.point500 + 0.1);         // the double take's snap: wide eyes held to "Five"
    const peeved = win(t, T.point500, T.point500 + 0.15, T.palms - 0.05, T.palms + 0.1);    // "Five hundred? For a ten-rupee"
    const incred = win(t, T.palms - 0.05, T.palms + 0.08, T.sigh, T.sigh + 0.15);           // "chai?"
    const sigh = win(t, T.sigh, T.sigh + 0.12, T.lick, T.lick + 0.15);
    let wince = 0; T.c.forEach((tl, i) => { wince = Math.max(wince, [0.75, 1.0, 1.3][i] * win(t, tl - 0.18, tl + 0.02, tl + 0.42, tl + 0.68)); });   // each one hurts more
    T.c2.forEach((tl, i) => { wince = Math.max(wince, [0.6, 0.8][i] * win(t, tl - 0.16, tl + 0.02, tl + 0.28, tl + 0.48)); });
    const windup = win(t, T.reach4 + 0.2, T.reach4 + 0.5, T.cut, T.cut + 0.05);              // "Four-sev—": gearing up for a big one
    const cutJ = win(t, T.cut, T.cut + 0.06, T.cut + 0.35, T.cut + 0.55);                   // the coin's slap: a jolt
    const joy = win(t, at('u06') - 0.05, at('u06') + 0.15, T.give + 0.2, T.give + 0.5);      // "Oh, you have change?" — delighted
    const puzzle = win(t, T.tap[0], T.tap[0] + 0.15, T.flinch, T.flinch + 0.1);             // one, two, three: what? (and frozen through the eyebrow)
    const still = win(t, T.brow - 0.1, T.brow, T.flinch - 0.02, T.flinch);                  // nothing on him moves while the eyebrow goes up
    const dtk = (u) => k1(u, [[T.look1 - 0.01, 0], [T.look1 + 0.07, 1], [T.look2, 1], [T.look2 + 0.06, -0.4], [T.look3, -0.4], [T.look3 + 0.05, 1], [T.snap, 1], [T.snap + 0.06, -1.6], [T.snap + 0.26, -1.15], [T.point500 - 0.1, -0.9], [T.point500 + 0.2, 0]]);
    const dd = t > T.look1 - 0.01 && t < T.point500 + 0.2 ? dtk(t) : 0;                     // +1: his head down at the note; negative: up and back at the customer
    const flinch = win(t, T.flinch, T.flinch + 0.06, T.flinch + 0.25, T.flinch + 0.45);
    const oops = win(t, T.sorry - 0.12, T.sorry + 0.08, T.c2[1] + 0.2, T.c2[1] + 0.5);      // embarrassed: inner brows up, a sheepish grin
    const bow = Math.max(win(t, T.sorry1 - 0.06, T.sorry1 + 0.08, T.sorry1 + 0.18, T.sorry1 + 0.34), win(t, T.sorry2 - 0.06, T.sorry2 + 0.08, T.sorry2 + 0.2, T.sorry2 + 0.4));
    const glad = win(t, T.gather, T.gather + 0.2, 99, 100);                                 // a done deal
    const beam = win(t, T.wave - 0.1, T.wave + 0.1, T.wave + 1.5, T.wave + 1.9);            // "Come again!"
    const wiping = win(t, T.wipe, T.wipe + 0.3, 99, 100), wc = clamp(wince);
    F.op = talk(t, ['u01', 'u02', 'u03', 'u04', 'u05', 'u06', 'u07', 'u08', 'u09', 'u10'], 0.26) + 0.3 * startle + 0.3 * Math.max(0, -dd) * snap + 0.22 * cutJ + 0.3 * flinch;
    F.grit = wc;                                                                             // teeth bared through the count
    const bl = blink(t, 2.3) * (1 - still);
    F.close = Math.max(bl, 0.8 * sigh, 0.8 * wc, 0.35 * wiping) - 0.3 * startle - 0.42 * snap - 0.3 * cutJ - 0.35 * flinch - 0.15 * incred;
    F.browUp = 1.0 * startle + 1.25 * snap + 0.45 * peeved + 1.0 * incred + 0.35 * windup + 0.95 * cutJ + 0.7 * joy + 0.25 * puzzle + 1.1 * flinch + 0.55 * oops + 0.5 * beam;
    F.browIn = 0.6 * peeved + 1.4 * wince + 0.5 * sigh + 0.55 * puzzle + 0.95 * oops + 0.3 * windup;
    F.smile = Math.max(1.0 * joy, 0.6 * oops, 0.55 * glad, 1.0 * beam, 0.7 * wiping) * (1 - wc);
    F.frown = 0.35 * peeved;
    F.tilt = (L.tilt * (1 - still)) - 0.05 * sigh + 0.06 * bow + 0.04 * oops - 0.07 * wince + 0.03 * puzzle + 0.05 * Math.max(0, dd) - 0.04 * Math.max(0, -dd) + 0.03 * wiping * Math.sin(t * 7);
    F.tongue = win(t, T.lick + 0.12, T.lick + 0.15, T.lick + 0.24, T.lick + 0.28);
    B.dy = 3 * L.breath * (1 - still) - 10 * startle + 9 * dd + 8 * sigh + 16 * bow - 9 * flinch - 5 * cutJ + 3 * wiping * Math.abs(Math.sin(t * 7));
    B.dx = -9 * Math.max(0, dd) + 13 * Math.max(0, -dd) + 7 * peeved + 4 * windup - 10 * wince;
    B.shrug = 1.0 * startle + 1.3 * incred - 0.6 * sigh + 0.5 * cutJ + 0.6 * flinch + 0.5 * wince + 0.25 * Math.max(0, -dd - 1);
    return { F, B };
  }
  function thiefFace(t, T) {
    const L = life(7.1, t, 1), F = {};
    const bw = t - T.brow, browK = bw <= 0 ? 0 : k1(bw, [[0, 0], [0.07, -0.35], [0.14, 1.2], [0.24, 0.95], [0.3, 1.0]]);
    const brow = browK * (1 - mj((t - T.sorry2) / 0.3));
    const sipA = win(t, T.sipA + 0.2, T.sipA + 0.3, T.sipA + 0.75, T.sipA + 0.85), sip = win(t, T.sip + 0.25, T.sip + 0.35, T.sip + 0.6, T.sip + 0.7);
    F.browUp = brow;
    F.smile = 0.35 + 0.3 * win(t, T.give, T.give + 0.2, T.tap[0], T.tap[0] + 0.3) + 0.35 * brow + 0.45 * win(t, T.gather + 0.3, T.gather + 0.5, 99, 100);
    F.close = Math.max(blink(t, 4.1) * (t > T.brow - 0.3 && t < T.sorry + 0.3 ? 0 : 1), 0.92 * sipA, 0.92 * sip);
    const down = (t > T.coinUp && t < T.cut + 0.3) || (t > T.tap[0] - 0.4 && t < T.brow - 0.05) || (t > T.c2[0] - 0.4 && t < T.gather + 0.3);
    F.lookY = down ? 1.4 : 0;
    F.look = 0;
    F.tilt = L.tilt * (t > T.brow - 0.1 && t < T.flinch ? 0 : 1) - 0.07 * Math.max(sipA, sip) - 0.03 * (down ? 1 : 0);
    F.ear500 = t >= T.tucked + 0.15;
    return F;
  }

  // ------------------------------------------------------------------ shot 1: the counter, morning (the con, and the question)
  let BG0 = null;
  function stall(opt) { D.setBG(null); D.makeStall(opt); return D.stallBG(); }
  function dust(g, x, y, s) {                          // a slap: a puff of lines out from under the note
    g.save(); g.strokeStyle = `rgba(255,250,235,${0.85 * s})`; g.lineWidth = 6; g.lineCap = 'round';
    for (const a of [-2.75, -2.35, -0.8, -0.4, 2.55, 0.55]) { const r0 = 150 + 30 * (1 - s), r1 = r0 + 40 * s; g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * 0.42); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.42); g.stroke(); }
    g.restore();
  }
  function handShadow(g, x, y, ang, s, a = 0.24) {
    if (y < D.CF + 20) return;
    const cx = x + Math.cos(ang) * s * 0.42 + 8, cy = y + Math.sin(ang) * s * 0.42 + 12;
    g.save(); g.translate(cx, cy); g.rotate(ang); g.fillStyle = rg(g, 0, 0, 4, s * 0.5, [0, 'rgba(40,20,8,' + a + ')'], [1, 'rgba(40,20,8,0)']); g.scale(1, 0.55); g.beginPath(); g.arc(0, 0, s * 0.5, 0, TAU); g.fill(); g.restore();
  }
  function held(g, Wr, a, s, skin, left, draw, thumb = true) { hand(g, Wr[0], Wr[1], a, s, 'hold', { left, skin, part: 'under' }); draw(); if (thumb) hand(g, Wr[0], Wr[1], a, s, 'hold', { left, skin, part: 'over' }); }
  // notes held by their right ends, fanned from the one grip (the change in his hand, after the gather)
  function gripFan(g, Wr, a, ds, k, spread, skin, left, sq = 0.95) {
    const gp = tipOf(Wr, a, 18), r0 = a - PI, n = ds.length;
    hand(g, Wr[0], Wr[1], a, 190, 'hold', { left, skin, part: 'under' });
    for (let i = 0; i < n; i++) { const r = r0 - (n - 1 - i) * spread, hw = (NOTE[ds[i]].w * k) / 2; note(g, ds[i], gp[0] - Math.cos(r) * hw, gp[1] - Math.sin(r) * hw + (n - 1 - i) * 7 * (1 - clamp(spread / 0.08)), r, sq, { shadow: false, k }); }
    hand(g, Wr[0], Wr[1], a, 190, 'hold', { left, skin, part: 'over' });
  }
  function uncleRig(T) { return { ur: uRightKeys(T), ul: uLeftKeys(T), tl: tLeftKeys(T) }; }
  let RIG = null;
  function shotCounter(g, t, T) {
    if (!BG0) BG0 = stall({});
    if (!RIG) RIG = uncleRig(T);
    const tc = on2(t);
    // the camera: a kick on each slap; a push-in that keeps every note in view for his eyebrow; a slow push on the question
    const push = sstep(T.tap[0] - 0.5, T.brow, t) * (1 - sstep(T.sorry2 + 0.2, T.c2[0] + 0.4, t));
    const qp = sstep(T.go + 0.6, T.replay, t);
    const z = 1 + (t > T.slap ? 0.035 * Math.exp(-(t - T.slap) * 6) : 0) + 0.15 * mj(push) + 0.05 * qp;
    let sh = shake(t, T.slap, 9, 11, 62) + shake(t, T.cut - 0.02, 6, 12, 70); for (const tl of [...T.c, ...T.c2]) sh += shake(t, tl, 2.5, 14, 70);
    const cx = lerp(lerp(540, 690, mj(push)), 520, qp), cy = lerp(lerp(960, 1090, mj(push)), 1000, qp), drift = 1 - mj(push);
    g.save(); g.translate(cx, cy + sh); g.scale(z, z); g.translate(-cx + 3 * Math.sin(t * 0.4) * drift, -cy + 2 * Math.cos(t * 0.33) * drift);
    g.drawImage(BG0, 0, 0);
    steam(g, 75, 650, t, 0.55);
    const { F: fU, B } = uncleFace(tc, T), fT = thiefFace(tc, T);
    // the customer: leaning in for the slap, a small shrug, and off to the right at the end with a bob in his walk
    const lean = -32 * (1 - mj((tc - T.slap - 0.05) / 0.5)), sgo = mj((tc - T.go) / 0.75), goX = 520 * sgo, bobY = -10 * Math.abs(Math.sin(sgo * PI * 3)) * (sgo > 0 && sgo < 1 ? 1 : 0);
    const shr = -10 * win(tc, T.shrug, T.shrug + 0.12, T.shrug + 0.3, T.shrug + 0.5), here = goX < 500;
    const thX = lean + goX, thY = shr + bobY;
    const dU = [B.dx, (B.dy || 0) * UN.s - (B.shrug || 0) * 14];
    const ur = trackAt(tc, RIG.ur), ul = trackAt(tc, RIG.ul), tl = trackAt(tc, RIG.tl);
    D.uncleBody(g, fU, { dy: B.dy, dx: B.dx, shrug: B.shrug });
    const sipUp = Math.max(mj((tc - T.sipA) / 0.3) * (1 - mj((tc - T.sipA - 0.8) / 0.3)), mj((tc - T.sip) / 0.3));
    const toast = Math.max(mj((tc - T.toast) / 0.3), 0.3 * win(tc, T.palms - 0.06, T.palms + 0.1, T.palms + 0.45, T.palms + 0.65));   // "chai?": a little lift of the glass
    if (here) { g.save(); g.translate(thX, thY); D.thiefBody(g, fT, { sip: { up: sipUp * (1 - toast), toast } }); g.restore(); }
    D.counter(g);
    tin(g, TIN[0], TIN[1], 0.8, { coin: tc >= T.sweep + 0.5 });
    // money on the counter: his 500, the coin, the change
    const on500 = tc >= T.slap && tc < T.take500;
    if (on500) { note(g, 500, N500[0], N500[1], 0, FLAT); dust(g, N500[0], N500[1], slapAt(tc, T.slap)); }
    const coinOn = tc >= T.cut - 0.02 && tc < T.sweep + 0.14;
    if (coinOn) { coin(g, COIN[0], COIN[1], 46, FLAT); dust(g, COIN[0], COIN[1], 0.45 * slapAt(tc, T.cut - 0.02)); }
    if (tc >= T.sweep + 0.42 && tc < T.sweep + 0.52) { const u = (tc - T.sweep - 0.42) / 0.1; coin(g, 430, lerp(970, 1000, u), 34, lerp(0.9, 0.6, u), { shadow: false }); }   // into the tin
    const gat = clamp((tc - T.gather) / 0.27), lifted = tc >= T.gather + 0.27;
    if (!lifted) for (let i = 0; i < 5; i++) {
      const tl0 = dealtAt(i); if (tc < tl0) continue;
      const [px, py, d, r] = PILE[i], gi = mj(clamp(gat * 1.4 - (4 - i) * 0.1)), sx = STACKR - (NOTE[d].w * KP) / 2, sy = STACK[1] + (4 - i) * 7;   // swept together, far notes first, their right ends lined up
      note(g, d, lerp(px, sx, gi), lerp(py, sy, gi), lerp(r, 0, gi), FLAT, { k: KP });
      if (gat <= 0) dust(g, px, py, slapAt(tc, tl0));
    }
    // shadows of hands on the wood
    const dip = 18 * tapDip(tc, T), Wt = [tl.x + thX, tl.y + thY + dip], Wr = [ur.x + dU[0], ur.y + dU[1]], Wl = [ul.x + dU[0] * 0.4, ul.y + dU[1] * 0.4];
    const onTable = (p) => p === 'flat' || p === 'rest' || p === 'point' || p === 'open';
    const fanOn = tc >= T.wad + 0.16 && tc < T.c2[1] - 0.3;
    if (onTable(ur.pose) && !fanOn && ur.y > 1100) handShadow(g, Wr[0], Wr[1], ur.a, 185);
    if (onTable(ul.pose) && ul.y > 1050) handShadow(g, Wl[0], Wl[1], ul.a, 185, 0.24 * clamp((ul.y - 1050) / 100));
    if (here && onTable(tl.pose) && tl.y > 1050) handShadow(g, Wt[0], Wt[1] - dip, tl.a, 190, (0.24 - 0.14 * tapDip(tc, T)) * clamp((tl.y - 1050) / 100));
    // arms
    const Su = { r: [US.r[0] + dU[0], US.r[1] + dU[1]], l: [US.l[0] + dU[0], US.l[1] + dU[1]] }, St = [TS[0] + thX, TS[1] + thY];
    if (here) limb(g, St, tl, Wt, POLE.t, TA, [thX, thY]);
    limb(g, Su.r, ur, Wr, POLE.ur, { ...UA, foldSide: -1 }, dU);
    limb(g, Su.l, ul, Wl, POLE.ul, UA, dU);
    const sk = { u: MEN.s2.skin, t: MEN.thief.skin };
    // the uncle's right hand: the change fanned up out of the tin, the dealt notes leaving it (and the 20 that went back, back on it)
    if (fanOn) {
      const left = WAD.filter((d, i) => tc < dealtAt(i) - 0.3 && !(i === 3 && tc >= T.reach4 + 0.16 && tc < T.back20 + 0.22));
      const gr = mj((tc - T.wad - 0.16) / 0.26), k = lerp(0.42, WADK, gr), da = lerp(0, WADD, gr);
      if (left.length) fanOf(g, left, Wr[0], Wr[1] - 0.29 * WADS, WADA, da, k, 0, sk.u, false, WADS);
      else hand(g, Wr[0], Wr[1], ur.a, 185, 'rest', { skin: sk.u });
    } else hand(g, Wr[0], Wr[1], ur.a, 185, ur.pose, { skin: sk.u, fs: ur.fs });
    // the uncle's left hand: a note on its way to the pile, the coin, his 500 held out by its top edge, or empty
    let drawn = false;
    const dealing = [0, 1, 2, 3, 4].find((i) => tc >= dealtAt(i) - 0.3 && tc < dealtAt(i));
    if (dealing != null) {
      const i = dealing, tl0 = dealtAt(i), u = ein(clamp((tc - (tl0 - 0.24)) / 0.24)), [px, py, d, r] = PILE[i];
      const b = bowOff({ x: FRONT[0], y: FRONT[1] }, { x: px, y: py }, u, 0.12), c = [lerp(FRONT[0], px, u) + b[0], lerp(FRONT[1], py, u) + b[1]];
      if (u < 0.7) hand(g, Wl[0], Wl[1], ul.a, 185, ul.pose, { left: true, skin: sk.u, part: 'under' });
      note(g, d, c[0], c[1], lerp(WADA, r, u), lerp(1, FLAT, u), { k: lerp(WADK, KP, u), shadow: u > 0.6 });
      hand(g, Wl[0], Wl[1], ul.a, 185, ul.pose, { left: true, skin: sk.u, part: u < 0.7 ? 'over' : undefined });
      drawn = true;
    } else if (tc >= T.reach4 + 0.16 && tc < T.back20 + 0.22) {                                          // the 20, wound up, frozen, put back
      const up = mj((tc - T.reach4 - 0.16) / 0.3), k = lerp(WADK, 0.78, up), h = endHeld(tipOf(Wl, ul.a, PINCH), ul.a, '20', k);
      hand(g, Wl[0], Wl[1], ul.a, 185, ul.pose, { left: true, skin: sk.u, part: 'under' });
      note(g, '20', h.c[0], h.c[1], h.r, 0.95, { k, shadow: false });
      hand(g, Wl[0], Wl[1], ul.a, 185, ul.pose, { left: true, skin: sk.u, part: 'over' }); drawn = true;
    } else if (tc >= T.sweep + 0.14 && tc < T.sweep + 0.42) {                                            // the coin in his fingers
      const tip = tipOf(Wl, ul.a, PINCH - 8); coin(g, tip[0], tip[1], 36, 0.9, { shadow: false });
    } else if (tc >= T.take500 && tc < T.give) {                                                         // his 500, by its top edge
      const tip = tipOf(Wl, ul.a, PINCH), up = mj((tc - T.take500) / 0.2), sq = lerp(FLAT, 0.95, up), hh = (NOTE[500].w / 4.4) * sq;
      if (here && tc >= T.give - 0.3) hand(g, Wt[0], Wt[1], tl.a, 190, 'hold', { left: true, skin: sk.t, part: 'under' });   // his fingers come in under it
      note(g, 500, tip[0] - 70, tip[1] + hh - 14, 0, sq, { shadow: up < 0.5 });
    }
    if (tc >= T.wipe) { const rc = tipOf(Wl, ul.a, 90), rr = mulberry32(9); g.save(); g.translate(rc[0], rc[1]); g.rotate(0.2 * Math.sin(tc * 3)); g.fillStyle = '#e9e2cf'; g.strokeStyle = 'rgba(110,100,80,0.6)'; g.lineWidth = 3; g.beginPath(); for (let k = 0; k <= 10; k++) { const an = (k / 10) * TAU, rad = 78 + 12 * (rr() - 0.5); k ? g.lineTo(Math.cos(an) * rad, Math.sin(an) * rad * 0.55) : g.moveTo(Math.cos(an) * rad, Math.sin(an) * rad * 0.55); } g.closePath(); g.fill(); g.stroke(); g.restore(); }   // the rag
    if (!drawn) hand(g, Wl[0], Wl[1], ul.a, 185, ul.pose, { left: true, skin: sk.u, fs: ul.fs });
    // the customer's hand: his 500 (frame 0; taken back, up to his ear), the coin, the change in a fan
    if (here) {
      if (tc < T.slap) {
        const u = clamp(tc / T.slap), c = tipOf(Wt, tl.a, 168);
        held(g, Wt, tl.a, 190, sk.t, true, () => note(g, 500, c[0], c[1], 0, lerp(0.95, FLAT, ein(u)), { shadow: false }));
      } else if (tc >= T.give && tc < T.tucked + 0.15) {
        const u = mj((tc - T.ear) / (T.tucked - T.ear)), ks = lerp(1, 0.434, u), c = tc < T.tucked ? tipOf(Wt, tl.a, 150 * ks + 18) : EAR5;
        const behind = tc >= T.ear + 0.18;                                                               // his hand goes behind the note as it reaches his temple
        if (behind) { hand(g, Wt[0], Wt[1], tl.a, 190, tl.pose, { left: true, skin: sk.t, part: tc < T.tucked ? 'under' : undefined }); note(g, 500, c[0], c[1], 0, lerp(0.95, 1, u), { shadow: false, k: ks }); }
        else held(g, Wt, tl.a, 190, sk.t, true, () => note(g, 500, c[0], c[1], tl.a - PI, lerp(0.95, 1, u), { shadow: false, k: ks }));
      } else if (tc >= T.give - 0.3 && tc < T.give) {
        hand(g, Wt[0], Wt[1], tl.a, 190, 'hold', { left: true, skin: sk.t, part: 'over' });                // only his thumb on top of it
      } else if (tc >= T.coinUp + 0.2 && tc < T.cut - 0.02) {
        hand(g, Wt[0], Wt[1], tl.a, 190, tl.pose, { left: true, skin: sk.t, fs: tl.fs });
        const tip = tipOf(Wt, tl.a, PINCH - 6); coin(g, tip[0], tip[1], 42, 0.95, { shadow: false });
      } else if (tc >= T.gather && !lifted) {
        hand(g, Wt[0], Wt[1], tl.a, 190, tl.pose, { left: true, skin: sk.t });
      } else if (lifted) {
        const lu = mj((tc - T.gather - 0.27) / 0.2), fu = mj((tc - T.gather - 0.4) / 0.25);
        gripFan(g, Wt, tl.a, WAD, lerp(KP, 0.82, fu), lerp(0, 0.17, fu), sk.t, true, lerp(FLAT, 0.95, lu));
      } else hand(g, Wt[0], Wt[1], tl.a, 190, tl.pose, { left: true, skin: sk.t, fs: tl.fs });
    }
    g.restore();
    if (t >= T.q - 0.1 && t < T.replay) {
      const q = clamp(K.hit(t, T.q)); g.save(); g.translate(540, 380); g.scale(lerp(0.9, 1, q), lerp(0.9, 1, q)); g.globalAlpha = clamp((t - T.q + 0.1) * 8);
      txt(g, 'HOW MUCH', 0, 0, 128, '#fff6e2', { align: 'center', stroke: '#14100a', sw: 0.14 }); txt(g, 'DID HE STEAL?', 0, 120, 128, '#ffd34a', { align: 'center', fit: 800, stroke: '#14100a', sw: 0.14 }); g.restore();
    }
  }

  // ------------------------------------------------------------------ shot 2: the replay, from straight above
  // The counter as a table: the uncle's side at the top (his tin), the customer's at the bottom. Only the uncle's notes are edged, in his
  // orange; the count over the customer's side counts only them, and only from the first note out (the review of build 3: the end state
  // and its 490 showed before the viewer had answered). On "Nothing was hidden" everything is set out where it began; the camera drifts,
  // each thing pulses as it is named, flies on an arc and lands with a bounce; at the end the uncle's notes gather by the count.
  const UNC = '#ff8a1f';
  const RT = { tin: [230, 560], h500: [720, 1420], u500: [700, 640], hcoin: [820, 1270], tcoin: [300, 470], out: [230, 520] };
  const DEST = [[220, 1060, '200'], [460, 1075, '200'], [700, 1090, '50'], [340, 1232, '20'], [580, 1246, '20']];
  const KR = 0.82;
  function inset(g, t, T, cx, cy, r, a) {             // his face in a bubble: the raised eyebrow, seen up close
    if (a <= 0) return;
    const s = lerp(0.6, 1, settle(a));
    g.save(); g.translate(cx, cy); g.scale(s, s); g.globalAlpha = clamp(a * 3);
    g.beginPath(); g.arc(0, 0, r + 12, 0, TAU); g.fillStyle = '#fff6e2'; g.fill();
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.save(); g.clip();
    g.fillStyle = lg(g, 0, -r, 0, r, [0, '#6a4a30'], [1, '#2e2016']); g.fillRect(-r, -r, 2 * r, 2 * r);
    const bw = t - T.rBrow + 0.04, bu = bw <= 0 ? 0 : k1(bw, [[0, 0], [0.07, -0.35], [0.14, 1.2], [0.24, 0.95], [0.3, 1.0], [0.9, 1.0], [1.0, 0.55], [1.1, 1.15], [1.2, 1.0]]);
    g.save(); g.translate(18, 34); g.scale(0.62, 0.62);
    g.fillStyle = '#2f8f7a'; g.beginPath(); g.ellipse(60, 330, 220, 120, 0, 0, TAU); g.fill();
    g.fillStyle = MEN.thief.skinD; g.beginPath(); g.roundRect(-40, 150, 150, 190, 40); g.fill();
    g.rotate(-0.04 * clamp(bu));
    D.headProfile(g, MEN.thief, { browUp: bu, smile: 0.35 + 0.45 * clamp(bu), close: blink(t, 6.2) * (bw > 0 ? 0 : 1), ear500: true });
    g.restore(); g.restore();
    g.beginPath(); g.arc(0, 0, r + 6, 0, TAU); g.strokeStyle = '#14100a'; g.lineWidth = 6; g.stroke();
    g.restore();
  }
  function shotAbove(g, t, T) {
    const tc = on2(t);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#b98048'], [1, '#a46c3a']); g.fillRect(0, 0, W, H);
    const dr = t - T.replay, zoom = 1 + 0.06 * mj(dr / 1.6) + 0.04 * sstep(T.rBack, T.closing, t), dcx = 30 * Math.sin(dr * 0.6), dcy = 10 * Math.sin(dr * 0.45 + 1.1);
    g.save(); g.translate(540, 1300); g.scale(zoom, zoom); g.translate(-540 + dcx, -1300 + dcy);           // a slow drift that keeps the count and his 500 inside the safe area
    const r = mulberry32(3); g.strokeStyle = 'rgba(70,40,18,0.3)'; g.lineWidth = 3; for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(-100, i * 220); g.lineTo(W + 100, i * 220); g.stroke(); }
    g.strokeStyle = 'rgba(70,40,18,0.1)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { const y = r() * H, x = r() * W; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 80, y + 4, x + 200, y - 2); g.stroke(); }
    const MID = 930;
    g.strokeStyle = 'rgba(255,240,215,0.45)'; g.setLineDash([22, 18]); g.lineWidth = 5; g.beginPath(); g.moveTo(40, MID); g.lineTo(1040, MID); g.stroke(); g.setLineDash([]);
    const la = clamp((t - T.replay - 0.2) * 4);
    txt(g, "THE UNCLE'S SIDE", 110, MID - 26, 52, UNC, { stroke: '#2a1608', sw: 0.14, a: la });
    txt(g, 'HIS SIDE', 110, MID + 70, 52, '#fff6e2', { stroke: '#2a1608', sw: 0.14, a: la });
    // set out on "Nothing was hidden": the tin, his 500, his coin, each popping into place
    const pop = (t0) => { const u = clamp((tc - t0) / 0.28); return u <= 0 ? 0 : settle(u); };
    const bump = (t1) => 1 + 0.08 * Math.max(0, 1 - Math.abs(tc - t1) / 0.15);                     // the bounce of a landing
    const namedPulse = (t0, t1) => (tc >= t0 && tc < t1 ? 1 + 0.07 * Math.abs(Math.sin((tc - t0) * PI * 3)) : 1);   // a thing pulses while it is named
    const pTin = pop(T.rIn), p5 = pop(T.rIn + 0.18), pC = pop(T.rIn + 0.36);
    const coinIn = tc >= T.rCoin + 0.6;                                                              // in the uncle's tin once the chai is paid
    if (pTin > 0) { g.save(); g.translate(RT.tin[0], RT.tin[1]); g.scale(pTin, pTin); tin(g, 0, 0, 1.05, { coin: coinIn }); g.restore(); }
    // his 500: down to the uncle's side ("came down"), and back ("went back")
    const dn = mj((tc - T.r500) / 0.6), bk = mj((tc - T.rBack) / 0.6);
    const p500 = lerp2(lerp2(RT.h500, RT.u500, dn), RT.h500, bk), a500 = 110 * Math.sin(dn * PI) * (1 - bk) + 110 * Math.sin(bk * PI);
    const s500 = p5 * namedPulse(atW('n06', /^his/), T.r500) * namedPulse(atW('n07', /^his/), T.rBack) * bump(T.r500 + 0.6) * bump(T.rBack + 0.6);
    // the uncle's five notes: his hand reaches into the tin first, then rides each one out
    const TOUT = [T.r450, T.r450 + 0.42, T.r450 + 0.84, T.r470, T.r490], FL = 0.6;
    const gatherU = mj((tc - T.r490 - FL - 0.25) / 0.6), GPOS = [[370, 1215], [385, 1205], [400, 1195], [415, 1185], [430, 1175]];
    let count = 0, show = false;
    for (let i = 0; i < 5; i++) {
      const [dx, dy, dd] = DEST[i];
      let p = null, rot = (i % 2 ? 0.06 : -0.05), sc = 1;
      const u = mj((tc - TOUT[i]) / FL);
      if (u > 0) { show = true; p = [lerp(RT.out[0], dx, u), lerp(RT.out[1], dy, u) - 70 * Math.sin(u * PI)]; rot *= u; sc = bump(TOUT[i] + FL); if (u > 0.99) count += +dd; }
      if (p && gatherU > 0) { p = lerp2(p, GPOS[i], gatherU); rot = lerp(rot, -0.04 + i * 0.02, gatherU); }
      if (p) { g.save(); g.translate(p[0], p[1]); g.scale(sc, sc); note(g, dd, 0, 0, rot, 1, { tag: UNC, shadow: false, k: KR }); g.restore(); }
    }
    // his coin: on his side, then to the uncle's tin, for the chai
    if (!coinIn && pC > 0) {
      const cu = mj((tc - T.rCoin) / 0.6), cp = [lerp(RT.hcoin[0], RT.tcoin[0], cu), lerp(RT.hcoin[1], RT.tcoin[1], cu) - 130 * Math.sin(cu * PI)];
      const cs = pC * namedPulse(atW('n07', /^then/), T.rCoin);
      g.save(); g.translate(cp[0], cp[1]); g.scale(cs, cs); coin(g, 0, 0, 46, 1, { shadow: false }); g.restore();
    }
    if (t > T.rCoin + 0.6) txt(g, 'FOR THE CHAI', 300, 410, 44, '#fff6e2', { align: 'center', stroke: '#2a1608', sw: 0.14, a: clamp((t - T.rCoin - 0.6) * 4) * (1 - clamp((t - T.rBrow + 0.6) * 3)) });
    if (p5 > 0) { g.save(); g.translate(p500[0], p500[1] - a500); g.scale(s500, s500); note(g, 500, 0, 0, 0.04, 1, { shadow: false }); g.restore(); }
    // the uncle's dealing hand, from the top edge: into the tin, then riding each note out by its top edge, then away
    const nowI = TOUT.findIndex((t0) => tc >= t0 - 0.3 && tc < t0 + FL + 0.2);
    if (nowI >= 0) {
      const t0 = TOUT[nowI], [dx, dy] = DEST[nowI], u = mj((tc - t0) / FL), pre = mj((tc - t0 + 0.3) / 0.25), post = mj((tc - t0 - FL) / 0.2);
      const nx = lerp(RT.out[0], dx, u), ny = lerp(RT.out[1], dy, u) - 70 * Math.sin(u * PI) - 260 * (1 - pre) - 400 * post;
      const tip = [nx + 60, ny - 44], aH = PI / 2 + 0.2, Wr = fromTip(tip, aH, 165), S = [Wr[0] + 260, -180];
      arm(g, S, fitElbow(S, [Wr[0] + 120, Wr[1] - 330], Wr, 560), Wr, { ...UA, w0: 52, w1: 46, w2: 34 });
      hand(g, Wr[0], Wr[1], aH, 210, 'pinch', { left: true, skin: MEN.s2.skin });
    }
    // the raised eyebrow, up close
    inset(g, t, T, 715, 548, 140, clamp((t - T.rBrow + 0.62) / 0.25) * (1 - clamp((t - T.r470 + 0.15) / 0.2)));
    // the count over his side: only the uncle's notes. On the answer, it grows
    if (show && count > 0) {
      const ans = settle(clamp((t - T.rAns + 0.05) / 0.35)), glow = t > T.r490 + 0.4 ? 0.5 + 0.5 * Math.sin((t - T.r490) * 5) : 0, sc = 1 + 0.22 * ans;
      g.save(); g.translate(360, 1400); g.scale(sc, sc);
      R(g, -200, -68, 400, 136, 68); g.fillStyle = 'rgba(20,14,10,0.86)'; g.fill();
      txt(g, String(count), 0, 40, 118, count === 490 ? UNC : '#fff6e2', { align: 'center' });
      if (glow > 0) { g.globalAlpha = 0.35 * glow; R(g, -210, -78, 420, 156, 78); g.strokeStyle = UNC; g.lineWidth = 12; g.stroke(); }
      g.restore();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ shot 3: closing time. The thin float counted, counted again, the jaw drop
  let BGN = null;
  function shotClosing(g, t, T) {
    if (!BGN) BGN = stall({ night: true });
    const tc = on2(t), d = t - T.closing;
    g.save(); const z = 1.0 + 0.1 * mj(d / 2.3); g.translate(380, 820); g.scale(z, z); g.translate(-380, -820);
    g.drawImage(BGN, 0, 0);
    const jaw = mj((tc - T.jaw) / 0.16), flicks = [0.12, 0.42, 0.72, 0.86, 1.0].map((x) => T.closing + x * (T.jaw - T.closing) * 0.94);
    const intoTin = win(tc, T.closing + 0.5, T.closing + 0.56, T.closing + 0.62, T.closing + 0.68);
    let fl = 0; for (const f of flicks) fl = Math.max(fl, pulse(tc, f, 0.05));
    const look = jaw > 0 ? [0, -3] : intoTin > 0.5 ? LK.tin : LK.wad;
    D.uncleBody(g, { look, op: 0.12 * fl + 0.85 * jaw, browUp: 1.15 * jaw + 0.3 * intoTin, close: Math.max(blink(tc, 1.2), 0) * (1 - jaw) - 0.38 * jaw, browIn: (0.5 + 0.3 * intoTin) * (1 - jaw), dy: -12 * jaw }, { night: true, dy: -12 * jaw, shrug: 0.8 * jaw });
    D.counter(g, { night: true });
    tin(g, TIN[0], TIN[1], 0.8, { coin: true, empty: true });
    const dU = [0, -12 * jaw * UN.s - 0.8 * jaw * 14];
    const Wr = [WADW[0], WADW[1] + dU[1]];
    const Sr = [US.r[0], US.r[1] + dU[1]], Sl = [US.l[0], US.l[1] + dU[1]];
    arm(g, Sr, fitElbow(Sr, [178, 1172 + dU[1]], Wr), Wr, { ...UA, foldSide: -1 });
    const Wl = [GRABW[0] + 10 * fl + 60 * jaw, GRABW[1] + dU[1] - 12 * fl - 60 * jaw];
    arm(g, Sl, fitElbow(Sl, [560, 1060 + dU[1]], Wl), Wl, UA);
    fanOf(g, ['20', '50'], Wr[0], Wr[1] - 0.29 * WADS, WADA - 0.35 * jaw, WADD + 0.12 * jaw, WADK, 0, MEN.s2.skin, false, WADS);
    hand(g, Wl[0], Wl[1], jaw > 0 ? AG + 0.6 : AG, 185, jaw > 0 ? 'open' : 'pinch', { left: true, skin: MEN.s2.skin });
    g.restore();
    g.fillStyle = 'rgba(10,14,30,0.18)'; g.fillRect(0, 0, W, H);
  }

  // ------------------------------------------------------------------ shot 4: the street. He walks away, the uncle's notes fanned in his hand
  function shotStreet(g, t, T) {
    const d = t - T.street, span = T.juggle - T.street;
    g.save(); const z = 1 + 0.04 * mj(d / span); g.translate(540, 1100); g.scale(z, z); g.translate(-540, -1100);
    g.drawImage(D.makeStreet(), 0, 0);
    for (const [px, c, ph] of [[150, '#d9582a', 0.3], [880, '#7c86c6', 0.8]]) { const bx = px + 14 * Math.sin((t + ph) * 0.8); g.fillStyle = c; g.beginPath(); g.roundRect(bx - 13, 846, 26, 56, 10); g.fill(); g.fillStyle = '#b98460'; g.beginPath(); g.arc(bx, 836, 11, 0, TAU); g.fill(); g.fillStyle = '#2a2e36'; g.fillRect(bx - 10, 900, 8, 34); g.fillRect(bx + 2, 900, 8, 34); }
    const u = mj(d / (span + 0.6)), walk = on2(d) * 1.8, s = lerp(0.62, 0.36, u), x = lerp(560, 640, u), y = lerp(1905, 1300, u);
    D.thiefBack(g, x, y, s, walk, { fan: true, ear500: true });
    g.restore();
  }

  // ------------------------------------------------------------------ shot 5: the juggle. Four things at once; one more; the 450 falls into his palm
  function shotJuggle(g, t, T) {
    if (!BG0) BG0 = stall({});
    const tc = on2(t), d = tc - T.juggle;
    const Z = 1.12, ZC = [400, 900], SH = 120, toS = (p) => [ZC[0] + (p[0] - ZC[0]) * Z, ZC[1] + (p[1] + SH - ZC[1]) * Z];
    // the shower: up from his left hand (screen-right), high over his head (never across his face), down into his right hand, back across low
    const JX = 150, P = 2.4, HR = [UN.x + JX + 380, 950], HL = [UN.x + JX - 380, 950], PEAK = 250, OFF = 0.268;   // he stands mid-frame here, his hands wide
    const path = (u) => {
      if (u < 0.72) { const v = u / 0.72; return [lerp(HR[0], HL[0], v), lerp(HR[1], HL[1], v) - 4 * (HR[1] - PEAK) * v * (1 - v), v]; }
      const v = (u - 0.72) / 0.28; return [lerp(HL[0], HR[0], v), lerp(HL[1], HR[1], v) - 4 * 70 * v * (1 - v), -1];
    };
    const phase = (i) => (((d / P) + i / 4 + OFF) % 1 + 1) % 1;
    const kinds = ['500', '450', 'coin', '20'];
    const fall = mj((tc - T.more) / 0.55), qIn = mj((tc - T.more + 0.55) / 0.55);
    // catches and throws, for the hands
    let dipL = 0, liftR = 0; for (let i = 0; i < 4; i++) { const u = phase(i); dipL = Math.max(dipL, pulse(u, 0.72, 0.035)); liftR = Math.max(liftR, pulse(u, 0.0, 0.04), pulse(u, 1.0, 0.04)); }
    // his eyes on whatever is highest
    let hi = 0, hy = 9999; for (let i = 0; i < 4; i++) { const p = path(phase(i)); if (p[1] < hy && !(i === 1 && fall > 0)) { hy = p[1]; hi = p[0]; } }
    const lx = clamp((hi - UN.x - JX) / 12, -18, 18), ly = clamp((hy - 520) / 40, -9, 11);
    g.save(); g.translate(ZC[0], ZC[1]); g.scale(Z, Z); g.translate(-ZC[0], -ZC[1]);
    g.drawImage(BG0, 0, 0); g.fillStyle = 'rgba(40,30,60,0.35)'; g.fillRect(0, 0, W, H);
    g.translate(0, SH);
    const panic = mj((tc - T.more) / 0.15), sway = Math.sin((d / P) * TAU * 4);                    // he sways with every throw
    D.uncleBody(g, { look: fall > 0 && fall < 1 ? [18, 11] : [lx, ly], op: 0.1 + 0.45 * panic, browUp: 0.3 + 0.9 * panic, close: -0.25 * panic, browIn: 0.7 * (1 - panic), tongue: 0.55 * (1 - panic), smile: 0, tilt: clamp((hi - UN.x - JX) / 3000, -0.08, 0.08) * (1 - panic) }, { dx: JX + 10 * sway * (1 - panic), dy: 4 * Math.abs(sway) - 8 * panic, shrug: 0.5 * panic });
    D.counter(g);
    const sk = MEN.s2.skin, WL = [HL[0] + 10 * sway, HL[1] + 30 * dipL + 50], WRr = [HR[0] + 10 * sway, HR[1] - 40 * liftR + 50];
    const SrJ = [US.r[0] + JX + 10 * sway, US.r[1]], SlJ = [US.l[0] + JX + 10 * sway, US.l[1]];
    arm(g, SrJ, fitElbow(SrJ, [SrJ[0] - 60, 1090], WL), WL, { ...UA, foldSide: -1 }); arm(g, SlJ, fitElbow(SlJ, [SlJ[0] + 60, 1090], WRr), WRr, UA);
    hand(g, WL[0], WL[1], -PI / 2 + 0.35, 185, 'open', { skin: sk }); hand(g, WRr[0], WRr[1], -PI / 2 - 0.35, 185, 'open', { left: true, skin: sk });
    for (let i = 0; i < 4; i++) {
      const p = path(phase(i));
      if (i === 1 && tc >= T.more) continue;
      juggleItem(g, kinds[i], p[0], p[1], phase(i) * TAU);
    }
    if (tc >= T.more) { const p = path(phase(1)); g.save(); g.translate(p[0], p[1]); g.rotate(0.4 * Math.sin(tc * 6)); txt(g, '?', 0, 50, 168, '#ffd34a', { align: 'center', stroke: '#14100a', sw: 0.12 }); g.restore(); }   // the question takes its place
    g.restore();
    // one more: the customer's hand, in from the right edge on his own arm, tosses a question in; it knocks the 450 out
    const handIn = mj((tc - T.more + 1.0) / 0.35), toss = mj((tc - T.more + 0.6) / 0.08), qa = toS(path(phase(1)));
    const TH0 = [lerp(1150, 880, handIn), lerp(1400, 1220, handIn) - 50 * toss * (1 - mj((tc - T.more + 0.45) / 0.15))];
    const qs = [lerp(TH0[0] - 70, qa[0], qIn), lerp(TH0[1] - 70, qa[1], qIn) - 180 * Math.sin(qIn * PI)];
    const palmT = mj((tc - T.more + 0.3) / 0.2), pout = mj((tc - T.more - 0.8) / 0.3);
    const PX = lerp(TH0[0] - 40, 830, palmT) + 320 * pout, PY = lerp(TH0[1], 1310, palmT) + 120 * pout, PR = -0.65;
    if (handIn > 0 && palmT < 0.5) { const S = [TH0[0] + 330, TH0[1] + 380]; arm(g, S, fitElbow(S, [TH0[0] + 170, TH0[1] + 230], TH0), TH0, TA); hand(g, TH0[0], TH0[1], PI + 0.6 - 0.9 * toss, 190, toss > 0.5 ? 'open' : 'pinch', { left: true, skin: MEN.thief.skin }); }
    if (tc < T.more && (qIn > 0 || (handIn > 0 && toss < 0.5))) { const q = qIn > 0 ? qs : [TH0[0] - 60, TH0[1] - 60]; g.save(); g.translate(q[0], q[1]); g.rotate(0.4 * Math.sin(tc * 6)); txt(g, '?', 0, 50, 150 * lerp(0.7, 1.12, qIn), '#ffd34a', { align: 'center', stroke: '#14100a', sw: 0.12 }); g.restore(); }
    if (palmT >= 0.5) {                                                                             // turned palm up, on his arm from the right edge
      g.save(); g.translate(PX, PY); g.rotate(PR); D.palmUp(g, 0, 0, 0.95, MEN.thief.skin); g.restore();
      const fe = [PX + Math.sin(-PR) * 0 + 300 * 0.95 * Math.sin(-PR), PY + 300 * 0.95 * Math.cos(PR)];
      g.save(); g.fillStyle = '#2f8f7a'; g.beginPath(); const an = Math.atan2(fe[1] - PY, fe[0] - PX), e2 = [fe[0] + Math.cos(an) * 260, fe[1] + Math.sin(an) * 260];
      g.arc(fe[0], fe[1], 58, an + PI / 2, an - PI / 2); g.arc(e2[0], e2[1], 62, an - PI / 2, an + PI / 2); g.closePath(); g.fill(); g.restore();   // his short teal sleeve, off to the right
    }
    if (tc >= T.more) {
      const s0 = toS(path((((T.more - T.juggle) / P + 0.25 + OFF) % 1 + 1) % 1)), land = [PX + 10, PY - 80];
      const p = fall < 1 ? [lerp(s0[0], land[0], fall), lerp(s0[1], land[1], fall) - 160 * Math.sin(fall * PI)] : land;
      g.save(); g.translate(p[0], p[1]); g.rotate(lerp(0.6, 0, fall)); g.scale(Z * lerp(1, 0.8, fall), Z * lerp(1, 0.8, fall));
      for (const [d2, ox, oy, rr] of [['50', 18, 14, 0.08], ['200', 9, 7, -0.04], ['200', 0, 0, 0]]) note(g, d2, ox, oy, rr, lerp(1, 0.8, fall), { shadow: false, k: 0.56 });
      g.restore();
    }
  }
  function juggleItem(g, kind, x, y, a) {
    g.save(); g.translate(x, y); g.rotate(Math.sin(a) * 0.4);
    if (kind === '500') note(g, 500, 0, 0, 0, 1, { shadow: false, k: 0.55 });
    else if (kind === '450') { note(g, '50', 16, 10, 0.08, 1, { shadow: false, k: 0.5 }); note(g, '200', 8, 4, -0.04, 1, { shadow: false, k: 0.5 }); note(g, '200', 0, 0, 0, 1, { shadow: false, k: 0.5 }); }
    else if (kind === 'coin') coin(g, 0, 0, 40, 1, { shadow: false });
    else note(g, '20', 0, 0, 0, 1, { shadow: false, k: 0.5 });
    g.restore();
  }

  // ------------------------------------------------------------------ shot 6: the board. ONE DEAL AT A TIME, under CHAI 10/-, as it is said
  function shotChalk(g, t, T) {
    const tc = on2(t), d = t - T.chalk;
    g.save(); const z = 1 + 0.05 * mj(d / 3.7); g.translate(540, 980); g.scale(z, z); g.translate(-540, -980);
    g.fillStyle = lg(g, 0, 0, 0, H, [0, '#5a3d27'], [1, '#3a281a']); g.fillRect(0, 0, W, H);
    { const rr = mulberry32(19); for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.05 + rr() * 0.06) + ')'; g.fillRect(i * 80 + rr() * 20, 0, 3, H); } }
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, 150); g.quadraticCurveTo(540, 230, 1090, 150); g.stroke();
    for (let i = 0; i < 9; i++) { const u = i / 8, bx = lerp(30, 1050, u), by = 150 + 80 * Math.sin(u * PI) - 6; g.fillStyle = rg(g, bx, by + 8, 2, 60, [0, 'rgba(255,214,130,0.6)'], [1, 'rgba(255,214,130,0)']); g.fillRect(bx - 70, by - 60, 140, 140); g.fillStyle = '#fff2c4'; g.beginPath(); g.ellipse(bx, by + 8, 9, 11, 0, 0, TAU); g.fill(); }
    R(g, 90, 400, 900, 1080, 22); g.fillStyle = '#23302a'; g.fill(); g.strokeStyle = '#8a6a3f'; g.lineWidth = 26; g.stroke();
    const r = mulberry32(11); g.fillStyle = 'rgba(255,255,255,0.04)'; for (let i = 0; i < 360; i++) g.fillRect(110 + r() * 860, 420 + r() * 1040, 30 + r() * 90, 3);
    { const rr = mulberry32(5); for (let k = 0; k < 4; k++) txt(g, 'CHAI 10/-', 540 + (rr() - 0.5) * 5, 680 + (rr() - 0.5) * 4, 170, 'rgba(244,239,224,0.45)', { align: 'center' }); }
    g.fillStyle = lg(g, 0, 1530, 0, H, [0, '#c98f55'], [1, '#a86f3e']); g.fillRect(0, 1530, W, H - 1530); g.fillStyle = 'rgba(255,230,190,0.35)'; g.fillRect(0, 1528, W, 6);   // the counter's edge
    tin(g, 230, 1700, 0.9, { coin: true, empty: true });
    const chalk = (s, x, y, size) => { const rr = mulberry32(s.length * 31 + y); for (let k = 0; k < 4; k++) txt(g, s, x + (rr() - 0.5) * 5, y + (rr() - 0.5) * 4, size, 'rgba(255,250,228,0.42)', { align: 'center', rot: (rr() - 0.5) * 0.012 }); };
    // each word chalked across as it is said: the reveal runs along the line, word by word
    const DUR = [0.26, 0.26, 0.12, 0.08, 0.38], SZ = 150;
    g.font = D.font(SZ);
    const LINES = [{ s: 'ONE DEAL', y: 1010, w: [0, 1] }, { s: 'AT A TIME', y: 1250, w: [2, 3, 4] }];
    let tip = null;
    for (const ln of LINES) {
      const words = ln.s.split(' '), full = g.measureText(ln.s).width, x0 = 540 - full / 2;
      let rx = x0, any = false;
      words.forEach((wd, j) => {
        g.font = D.font(SZ);
        const pre = g.measureText(words.slice(0, j).join(' ') + (j ? ' ' : '')).width, ww = g.measureText(wd).width, p = clamp((tc - T.write[ln.w[j]]) / DUR[ln.w[j]]);
        if (p > 0) { any = true; rx = x0 + pre + ww * p; tip = [rx, ln.y - 52]; }
      });
      if (any) { g.save(); g.beginPath(); g.rect(0, ln.y - 170, rx + 4, 230); g.clip(); chalk(ln.s, 540, ln.y, SZ); g.restore(); }
    }
    { const rr = mulberry32(77); g.fillStyle = '#23302a'; for (let i = 0; i < 900; i++) { const x = 130 + rr() * 820, y = 850 + rr() * 440; g.fillRect(x, y, 2 + rr() * 5, 1.5 + rr() * 2); } }
    // the uncle's hand and forearm, in from the bottom right: two taps on the board, the writing, then away
    g.font = D.font(SZ); const firstX = 540 - g.measureText('ONE DEAL').width / 2, lastX = 540 + g.measureText('AT A TIME').width / 2;
    const tapT = [atW('n13', /shopkeepers/) + 0.05, atW('n13', /shopkeepers/) + 0.4];
    let tp;
    if (tc < T.write[0] - 0.25) {
      const inn = mj((tc - T.chalk - 0.15) / 0.5), tap = Math.max(pulse(tc, tapT[0], 0.05), pulse(tc, tapT[1], 0.05));
      tp = [lerp(1150, 300, inn) - 16 * tap, lerp(1700, 880, inn) - 10 * tap];
    } else if (tc < T.write[0]) tp = lerp2([300, 880], [firstX, 1010 - 52], mj((tc - T.write[0] + 0.25) / 0.22));
    else if (tc < T.write[4] + DUR[4] + 0.05) tp = tip || [firstX, 1010 - 52];
    else { const out = mj((tc - T.write[4] - DUR[4] - 0.05) / 0.35); tp = [lerp(lastX, 1200, out), lerp(1250 - 52, 1900, out)]; }
    if (tp[1] < 1850) {
      const a = -2.35, L = 160, Wr = fromTip(tp, a, L), E = [Wr[0] + 210, Wr[1] + 380], S = [E[0] + 160, E[1] + 420];
      arm(g, S, E, Wr, { ...UA, w0: 58, w1: 50, w2: 38 });
      hand(g, Wr[0], Wr[1], a, 230, 'pinch', { left: true, skin: MEN.s2.skin });
      g.save(); g.translate(tp[0], tp[1]); g.rotate(a); R(g, -10, -9, 52, 18, 6); g.fillStyle = '#f6f2e6'; g.fill(); g.restore();   // the chalk
    }
    g.restore();
  }

  // ------------------------------------------------------------------ shot 7: the next stall. The same 500, from behind his ear; a new counter
  let BGX = null;
  function shotNext(g, t, T) {
    if (!BGX) BGX = stall({ next: true });
    const tc = on2(t), d = tc - T.next;
    const SLAPN = T.next + 0.58;
    const pe = sstep(T.endBrow - 0.9, T.endBrow + 0.6, t), z = 1 + 0.2 * mj(pe) + (t > SLAPN ? 0.03 * Math.exp(-(t - SLAPN) * 6) : 0);
    const cx = lerp(540, 760, mj(pe)), cy = lerp(960, 800, mj(pe)), sh = shake(t, SLAPN, 8, 11, 62);
    g.save(); g.translate(cx, cy + sh); g.scale(z, z); g.translate(-cx, -cy);
    g.drawImage(BGX, 0, 0);
    // the next chaiwala: the same jolt, the same finger at the note, the same jab at the board, the same palms
    const cw = (re) => atW('c01', re), startle = win(tc, SLAPN, SLAPN + 0.08, SLAPN + 0.4, SLAPN + 0.8);
    const fv = cw(/^five/), tr = cw(/ten|rupee/), ch = cw(/chai/);
    const look = lookSeq(tc, [[0, LK.th], [SLAPN + 0.05, LK.n5], [fv - 0.4, LK.th], [tr - 0.15, LK.board], [ch, LK.th]]);
    const incred = win(tc, ch - 0.05, ch + 0.08, ch + 0.5, ch + 0.7);
    D.uncleBody(g, { look, browUp: 1.0 * startle + 0.5 * win(tc, fv, fv + 0.15, ch, ch + 0.2) + 0.9 * incred, browIn: 0.5 * win(tc, fv, fv + 0.15, ch, ch + 0.2), op: talk(tc, ['c01'], 0.26) + 0.3 * startle, close: blink(tc, 5.3) - 0.3 * startle, frown: 0.3 * win(tc, fv, fv + 0.15, ch, ch + 0.2) }, { who: 'next', dy: -10 * startle, shrug: startle + 1.2 * incred });
    const tf = { smile: 0.4, close: blink(tc, 8.2) * (tc > T.endBrow - 0.4 ? 0 : 1), ear500: tc < T.next + 0.12, look: 0, lookY: 0 };
    const sipN = win(tc, fv + 0.05, fv + 0.35, fv + 0.75, fv + 1.05);
    tf.close = Math.max(tf.close, 0.92 * win(tc, fv + 0.3, fv + 0.4, fv + 0.7, fv + 0.8));
    // his eyebrow, at us: the eye slides back toward the camera, the brow goes up, the corner of the mouth with it
    const ebw = tc - T.endBrow, eb = ebw <= 0 ? 0 : k1(ebw, [[0, 0], [0.07, -0.35], [0.14, 1.2], [0.24, 0.95], [0.3, 1.0]]), gl = mj((tc - T.endBrow + 0.3) / 0.2);
    tf.look = 3 * gl; tf.browUp = eb; tf.smile = 0.4 + 0.45 * clamp(eb);
    D.thiefBody(g, tf, { sip: { up: sipN, toast: 0 } });
    D.counter(g, { next: true });
    // his hand: the 500 drawn from behind his ear, unfolded on the way down, slapped down by its end
    const keysN = [
      { t: 0, x: EAR5[0] + 150 * 0.434 + 18, y: EAR5[1], a: PI, pose: 'hold', ex: 1000, ey: 760 },
      { t: T.next + 0.12, d: 0.4, x: N500[0] + 168, y: N500[1] - 74, a: PI, pose: 'hold', ex: 815, ey: 1120, bow: -0.12 },
      { t: SLAPN - 0.06, d: 0.06, x: N500[0] + 168, y: N500[1] - 2, a: PI, pose: 'hold', ex: 800, ey: 1170, ease: ein },
      { t: SLAPN + 0.03, d: 0.2, x: N500[0] + 238, y: N500[1] - 122, a: PI - 0.45, pose: 'rest', ex: 820, ey: 1080, ease: settle },   // straight off it
      { t: SLAPN + 0.45, d: 0.45, x: 930, y: 1320, a: PI - 0.3, fs: 0.7, pose: 'rest', ex: 1000, ey: 1160, bow: -0.1 },
    ];
    const tl = trackAt(tc, keysN), Wt = [tl.x, tl.y];
    if (tc >= SLAPN) { note(g, 500, N500[0], N500[1], 0, FLAT); dust(g, N500[0], N500[1], slapAt(tc, SLAPN)); }
    // the chaiwala's hands: the right resting, the left pointing, jabbing, palm up
    const NA = { skin: D.NEXTMAN.skin, sleeve: '#dfe4ec' };
    const ulN = trackAt(tc, [
      { t: 0, x: 590, y: 1070, a: PI - 0.55, pose: 'rest', ex: 610, ey: 1000 },
      { t: SLAPN, d: 0.1, x: 600, y: 1040, a: PI - 0.55, pose: 'rest', ex: 612, ey: 975 },
      { t: SLAPN + 0.3, d: 0.3, x: 590, y: 1070, a: PI - 0.55, pose: 'rest', ex: 610, ey: 1000 },
      { t: fv - 0.2, d: 0.2, x: 560, y: 1110, a: 2.25, pose: 'point', ex: 640, ey: 1040, ease: settle },
      { t: tr - 0.3, d: 0.3, x: 640, y: 880, a: -PI / 2 - 0.25, pose: 'point', ex: 640, ey: 1060, bow: 0.12 },
      { t: tr + 0.12, d: 0.07, x: 636, y: 860, a: -PI / 2 - 0.25, pose: 'point', ex: 640, ey: 1060 },
      { t: tr + 0.2, d: 0.08, x: 640, y: 880, a: -PI / 2 - 0.25, pose: 'point', ex: 640, ey: 1060 },
      { t: ch - 0.04, d: 0.16, x: 640, y: 990, a: -1.8, pose: 'open', ex: 640, ey: 1090, ease: settle },
    ]);
    const urN = trackAt(tc, [{ t: 0, x: 205, y: 1165, a: 0.5, pose: 'rest', ex: 100, ey: 1060 }, { t: ch - 0.04, d: 0.16, x: 205, y: 1040, a: -1.3, pose: 'open', ex: 92, ey: 1085, ease: settle }]);
    const dN = [0, -10 * startle * UN.s - (startle + 1.2 * incred) * 14];
    const SrN = [US.r[0], US.r[1] + dN[1]], SlN = [US.l[0], US.l[1] + dN[1]];
    if (ulN.pose === 'rest') handShadow(g, ulN.x, ulN.y, ulN.a, 185);
    limb(g, TS, tl, Wt, POLE.t, TA);
    limb(g, SrN, urN, [urN.x, urN.y], POLE.ur, { ...NA, foldSide: -1 }, dN);
    limb(g, SlN, ulN, [ulN.x, ulN.y], POLE.ul, NA, dN);
    hand(g, urN.x, urN.y, urN.a, 185, urN.pose, { skin: NA.skin });
    hand(g, ulN.x, ulN.y, ulN.a, 185, ulN.pose, { left: true, skin: NA.skin });
    if (tc < SLAPN) {
      const u = mj((tc - T.next - 0.12) / 0.4), ks = lerp(0.434, 1, u), c = tipOf(Wt, tl.a, 150 * ks + 18);
      if (tc >= T.next + 0.12) held(g, Wt, tl.a, 190, MEN.thief.skin, true, () => note(g, 500, c[0], c[1], 0, lerp(1, 0.95, u), { shadow: false, k: ks }));
      else hand(g, Wt[0], Wt[1], tl.a, 190, 'hold', { left: true, skin: MEN.thief.skin, part: 'under' });
    } else hand(g, Wt[0], Wt[1], tl.a, 190, tl.pose, { left: true, skin: MEN.thief.skin, fs: tl.fs });
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
      if (t < T.replay) shotCounter(g, t, T);
      else if (t < T.closing) shotAbove(g, t, T);
      else if (t < T.street) shotClosing(g, t, T);
      else if (t < T.juggle) shotStreet(g, t, T);
      else if (t < T.chalk) shotJuggle(g, t, T);
      else if (t < T.next) shotChalk(g, t, T);
      else shotNext(g, t, T);
      if (t < 2.4) { g.globalAlpha = 1 - sstep(1.9, 2.4, t); txt(g, "IT'S A CON.", 535, 340, 70, '#fff6e2', { align: 'center', stroke: '#14100a', sw: 0.16 }); txt(g, 'WATCH THE MONEY', 535, 458, 132, '#ffd34a', { align: 'center', fit: 800, stroke: '#14100a', sw: 0.14 }); g.globalAlpha = 1; }
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

  // no end card (the user, 25 Nov: "remove the end card"): the film ends on his eyebrow and loops back to frame 0
  C.start();
})();
