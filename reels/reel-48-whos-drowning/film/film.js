// Reel 48 Who's Drowning?: a crowded beach in cut paper, seen from straight above. Sixteen numbered people; one of
// them, number nine, Maya, is drowning, and she makes no sound.
// The world (film/beach.js) is a pure function of WORLD time. The film runs world time forward; holds it still on
// "Time." (the freeze, until "It's number nine."); runs it on; then backward to the first frame (the rewind); then
// forward again from 0 (the replay after "Now look."). The camera, the tags and the frame-0 line run on FILM time.
// Every beat is keyed to the placed voice (film/timing.js, from place_vo.py).
// No timers, no Math.random, nothing mutated in run(): any frame paints the same in any order.
(() => {
  const { scene, canvas, clamp, lerp, W, H } = C;
  const U = window.UI, P = window.PAPER, B = window.BEACH;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn'];
  P.usePieceTexture(true);

  // ------------------------------------------------------------------ the clock, from the placed voice (film time)
  const TM = window.TIMING;
  const line = (id) => TM.lines[id];
  const clean = (w) => w.toLowerCase().replace(/[^a-z']/g, '');
  function word(id, w, k = 0) {                       // the k-th occurrence of word w in line id: its onset
    const ws = line(id).words.filter((x) => clean(x.w) === w);
    if (!ws.length) throw new Error(`no "${w}" in ${id}`);
    return ws[Math.min(k, ws.length - 1)].t0;
  }
  const T = {
    ring0: TM.ring0, ring1: TM.ring1, help: line(TM.boy).start, wave: line('c02').start,
    reveal: line('n07').start, under: word('n08', 'under'),
    noise: line('n09').start, boy: word('n10', 'boy'), man: word('n10', 'man'), boat: word('n10', 'boat'),
    found: line('n11').start, there: line('n12').start,
    c03: line('c03').start, c03e: line('c03').end, c04: line('c04').start, c04e: line('c04').end, c05: line('c05').start, c05e: line('c05').end,
    why: line('n13').start, breathe: word('n13', 'breathe'), pushing: word('n13', 'pushing'), whyEnd: line('n13').end,
    shout: line('n14').start, sure: line('n15').start, sureEnd: line('n15').end,
    cough: TM.cough, rewind0: TM.rewind0, rewind1: TM.rewind1, look: line('n16').start, end: TM.end,
  };
  const drowning = word('n01', 'drowning');

  // ------------------------------------------------------------------ world time: the freeze, the rewind, the replay
  const step = (x) => Math.round(x * 15) / 15;                       // whole steps of the twos, so the drawings keep their rhythm
  const F = step(T.reveal - T.ring1);                                // the freeze lasts from "Time." to "It's number nine."
  const R = step(T.rewind1);
  const W0 = (t) => (t < T.ring1 ? t : t < T.reveal ? T.ring1 : t - F);
  // story times in world time: after the freeze, every beat sits F earlier in the world
  const S = {};
  for (const [k, v] of Object.entries(T)) S[k] = v >= T.reveal - 1e-6 ? v - F : v;
  S.lgStand = S.found + 0.3; S.whistle = S.found + 1.0; S.point = S.found + 1.5;
  S.lgJump = S.there + 0.1; S.lgLand = S.lgJump + 0.45;
  S.lgWade = S.lgLand + 1.15; S.lgDive = S.lgWade + 1.0; S.lgSwim = S.lgDive + 0.4;
  S.reach = S.pushing + 0.6;                                         // the tube lifts her as "…pushing her mouth up." ends
  S.duck = S.lgSwim + 2.1;                                           // a breaking wave she ducks under on the way
  S.tow = S.reach + 0.9; S.hand = S.sure + 1.0;
  T.reachF = S.reach + F;                                            // (film time)
  window.STORY_T = { T, S, F };                                      // (read by the review tools)

  const ease = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };            // minimum jerk
  const ramp = (t, a, b) => ease((t - a) / (b - a));
  const win = (t, a0, a1, b0, b1) => ramp(t, a0, a1) * (1 - ramp(t, b0, b1));
  function keys(t, K) {                               // [[t, ...values]] with minimum-jerk moves between keys
    if (t <= K[0][0]) return K[0].slice(1);
    for (let i = 1; i < K.length; i++) {
      if (t < K[i][0]) { const u = ease((t - K[i - 1][0]) / (K[i][0] - K[i - 1][0])); return K[i].slice(1).map((v, j) => lerp(K[i - 1][j + 1], v, u)); }
    }
    return K[K.length - 1].slice(1);
  }
  function worldTime(t) {
    if (t < T.rewind0) return W0(t);
    if (t < R) { const u = (t - T.rewind0) / (R - T.rewind0); return W0(T.rewind0) * (1 - ease(u)); }
    return t - R;
  }

  // ------------------------------------------------------------------ the people's story (all in world time)
  const MAYA = { x: 330, y: 692 };
  const LOOK = (fx, fy, tx, ty) => Math.atan2(tx - fx, -(ty - fy));          // 0 = towards the sea, + clockwise
  const turnTo = (a, b, k) => a + (((((b - a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI) * k;   // the short way round
  // Maya after the answer: up for the push-in, under on "under", her own breaths while the camera's away; up with her
  // mouth at the water as her friend calls her name (she can't answer), short dips between, never under for long;
  // one breath on "breathe", her arms pushing on "pushing"; the tube lifts her; the tow; a cough.
  function maya(wt) {
    if (wt < S.reveal) return null;
    let s, press = 0.35;
    if (wt < S.under + 1.4) {
      s = keys(wt, [[S.reveal, 0.85], [S.under - 0.2, 0.85], [S.under + 0.35, 0], [S.under + 0.95, 0], [S.under + 1.4, 0.85]])[0];
      press = wt > S.under + 0.9 ? 1 : 0.35;
    } else if (wt < S.c03 - 1.2) {
      const nat = B.mayaState(wt); s = nat.s; press = nat.press;
    } else if (wt < S.reach) {
      s = keys(wt, [[S.c03 - 1.2, B.mayaState(S.c03 - 1.2).s], [S.c03 - 0.4, 0.5], [S.c03e + 0.15, 0.5], [S.c03e + 0.5, 0.05], [S.c04 + 0.05, 0.05], [S.c04 + 0.45, 0.45],
        [S.c05 + 0.05, 0.45], [S.c05 + 0.4, 0], [S.c05 + 1.15, 0], [S.c05 + 1.55, 0.6], [S.c05 + 2.0, 0.6], [S.c05 + 2.35, 0],
        [S.breathe - 0.95, 0], [S.breathe - 0.15, 0.85], [S.breathe + 0.45, 0.85], [S.breathe + 0.8, 0.1], [S.pushing - 0.3, 0.1], [S.pushing + 0.2, 0.65], [S.reach, 0.6]])[0];
      press = s > 0.05 ? 1 : 0.45;
    } else s = 1;
    const held = ramp(wt, S.reach, S.reach + 0.7);
    const tow = ramp(wt, S.tow, S.hand + 0.4);
    const cough = Math.max(win(wt, S.cough - 0.05, S.cough + 0.1, S.cough + 0.35, S.cough + 0.6), 0.8 * win(wt, S.cough + 0.75, S.cough + 0.85, S.cough + 1.0, S.cough + 1.25));
    return { s: Math.max(s, held), press: press * (1 - held), held, cough, dx: 58 * tow, dy: 48 * tow };
  }
  function friend(n, wt) {
    if (n === 4) {
      const p = { x: 462, y: 824 };
      if (wt < S.c03 - 0.45) return null;
      const toMaya = LOOK(p.x, p.y, MAYA.x, MAYA.y), toShore = LOOK(p.x, p.y, 178, 1452);
      const turn = ramp(wt, S.c03 - 0.45, S.c03 + 0.1);                   // "Maya?": she looks round, to the beach first
      const spot = ramp(wt, S.c04 - 0.35, S.c04 - 0.05);                  // "Maya!": she's seen her
      const callShore = win(wt, S.c05 - 0.2, S.c05 + 0.05, S.c05e + 0.8, S.c05e + 1.3);
      const look = turnTo(turnTo(turnTo(1.2, -2.2, turn), toMaya, spot), toShore, callShore);
      const shout = Math.max(0.6 * win(wt, S.c03 - 0.1, S.c03 + 0.05, S.c03e, S.c03e + 0.25), win(wt, S.c04 - 0.1, S.c04 + 0.05, S.c04e, S.c04e + 0.25), callShore);
      const mh = maya(wt), hand = mh ? { x: MAYA.x + mh.dx + 30, y: MAYA.y + mh.dy + 66 } : null;
      const stepIn = ramp(wt, S.hand - 1.3, S.hand - 0.3);
      const armsUp = Math.min(1, callShore + 0.55 * ramp(wt, S.c05e + 1.1, S.c05e + 1.5) * (1 - ramp(wt, S.hand - 1.4, S.hand - 1.0)));
      return { stop: 1, look, shout, armsUp, reach: hand ? { ...hand, k: ramp(wt, S.hand - 0.7, S.hand) } : null, dx: -40 * stepIn, dy: -44 * stepIn };
    }
    if (n === 13) {
      const p = { x: 606, y: 866 };
      if (wt < S.c04 - 0.25) return null;
      return { stop: 1, look: LOOK(p.x, p.y, MAYA.x, MAYA.y), shout: 0, armsUp: 0.5 * ramp(wt, S.c05e + 0.4, S.c05e + 0.9) * (1 - ramp(wt, S.hand - 0.5, S.hand)) };
    }
    return null;
  }
  // the lifeguard: on her chair scanning the whole water; after "Time." her eyes settle on Maya; on her feet as the
  // narrator says her friends didn't see; the whistle to her mouth, her arm pointing at Maya; off the chair and down the
  // sand before her friend screams; a dive; a swim (she ducks under a breaking wave), the tube a body length behind on
  // its line; behind Maya with the tube across Maya's chest; the two drift in to the sandbar.
  function lifeguard(wt) {
    const toMaya = LOOK(178, 1440, MAYA.x, MAYA.y);
    if (wt < S.lgStand) {
      const scan = 0.75 * Math.sin(wt * 0.55) + 0.25 * Math.sin(wt * 1.3);
      return { mode: 'chair', look: lerp(scan, toMaya, ramp(wt, S.reveal, S.reveal + 1.0)) };
    }
    if (wt < S.lgJump) {
      return { mode: 'stand', k: ramp(wt, S.lgStand, S.lgStand + 0.35), look: toMaya, pointAt: toMaya,
        whistle: win(wt, S.whistle - 0.25, S.whistle, S.lgJump - 0.45, S.lgJump - 0.15), point: win(wt, S.point - 0.2, S.point + 0.15, S.lgJump - 0.35, S.lgJump - 0.05) };
    }
    if (wt < S.lgLand) {                                // the hop off the chair
      const u = (wt - S.lgJump) / (S.lgLand - S.lgJump);
      return { mode: 'hop', x: lerp(178, 226, ease(u)), y: lerp(1430, 1400, ease(u)), dir: LOOK(178, 1430, 226, 1400), u: 0.25, air: Math.sin(u * Math.PI) };
    }
    const path = [[S.lgLand, 226, 1400], [S.lgWade, 420, 1262], [S.lgDive, 424, 1190], [S.lgSwim, 420, 1130], [S.reach, MAYA.x, MAYA.y + 104]];
    if (wt < S.reach) {
      let i = 1; while (i < path.length - 1 && wt >= path[i][0]) i++;
      const [t0, x0, y0] = path[i - 1], [t1, x1, y1] = path[i];
      const u = clamp((wt - t0) / (t1 - t0));
      const x = lerp(x0, x1, u), y = lerp(y0, y1, u), dir = LOOK(x0, y0, x1, y1);
      const mode = i === 1 ? 'run' : i === 2 ? 'wade' : i === 3 ? 'dive' : 'swim';
      const L = { mode, x, y, dir, u: mode === 'run' ? wt * 2.7 : mode === 'wade' ? wt * 1.8 : wt * 1.35, splash: mode === 'dive' ? u : 0,
        duck: win(wt, S.duck, S.duck + 0.12, S.duck + 0.55, S.duck + 0.7) };
      if (mode === 'swim' || mode === 'dive') {           // the tube trails a body length behind on its line
        const bx = x - Math.sin(dir) * 190, by = y + Math.cos(dir) * 190;
        L.tube = { x: bx + 6 * Math.sin(wt * 2.1), y: by, len: 90, rot: dir + Math.PI / 2 + 0.2 * Math.sin(wt * 1.3), line: [x + 14, y + 18] };
      }
      return L;
    }
    const mh = maya(wt), hx = MAYA.x + mh.dx, hy = MAYA.y + mh.dy;
    return { mode: 'hold', x: hx, y: hy + 104, dir: 0, tube: { x: hx, y: hy + 60, len: 96, rot: 0 } };
  }
  const ctx = {
    // No. 6: a crouch, "Help!", arms flung up, flailing; then bobbing and slapping the water. After "Time.", on "boy",
    // he throws a sheet of water at his brother, who flinches, arms up, and they both laugh.
    boy(wt) {
      const flail = win(wt, T.help - 0.12, T.help + 0.12, T.help + 1.1, T.help + 1.5);
      const th = (wt - (S.boy + 0.05)) / 1.1;
      return { flail, help: T.help, throwK: th > 0 && th < 1 ? th : 0,
        laugh: win(wt, S.boy + 0.35, S.boy + 0.55, S.boy + 3.2, S.boy + 3.8), flinch: win(wt, S.boy + 0.55, S.boy + 0.75, S.boy + 2.4, S.boy + 3.0) };
    },
    waving(wt) {
      const a = win(wt, T.wave - 0.2, T.wave + 0.15, T.wave + 3.0, T.wave + 3.4), b = win(wt, S.man - 0.2, S.man + 0.15, S.man + 2.6, S.man + 3.0);
      return { k: Math.max(a, b), t0: wt < S.man - 0.6 ? T.wave - 0.2 : S.man - 0.2 };
    },
    boatWave(wt) { return win(wt, S.boat - 0.05, S.boat + 0.3, S.boat + 2.4, S.boat + 2.8); },
    lifeguard, maya, friend,
    sets: [[12.6, 15.8], [S.duck - 0.9, S.duck + 1.4]],
  };

  // ------------------------------------------------------------------ the camera (film time)
  function camAt(cx, cy, s) { return { s, x: -s * (cx - W / 2), y: -s * (cy - H / 2) }; }
  const K = [
    [0, 540, 960, 1.0],
    [drowning, 540, 960, 1.0],
    [drowning + 0.7, 548, 952, 1.02],                // a breath in on "drowning"
    [T.ring0 + 6.0, 548, 952, 1.02],
    [T.ring0 + 8.2, 560, 900, 1.04],                 // one wide drift; every tag stays inside x 950
    [T.ring0 + 10.4, 540, 930, 1.03],
    [T.ring0 + 12.0, 540, 960, 1.0],
    [T.reveal, 540, 960, 1.0],                       // the freeze holds the whole beach
    [T.reveal + 1.2, 330, 730, 2.3],                 // "It's number nine."
    [T.noise, 330, 730, 2.3],
    [T.noise + 0.8, 560, 960, 1.15],                 // "Did you go for the noise?"
    [T.boy - 0.55, 560, 960, 1.15],
    [T.boy + 0.2, 830, 1110, 2.0],                   // the boys (a 0.75 s whip)
    [T.man - 0.55, 830, 1110, 2.0],
    [T.man + 0.2, 800, 720, 1.3],                    // the man and his boat
    [T.boat - 0.1, 800, 720, 1.3],
    [T.boat + 0.6, 760, 560, 1.75],                  // in on the boat: a towel waved back
    [T.found - 0.3, 760, 560, 1.75],
    [T.found + 0.9, 330, 1100, 1.25],                // her friends, and the lifeguard on her chair, inside the safe zone
    [T.there - 0.1, 330, 1100, 1.25],
    [T.there + 0.7, 460, 790, 1.85],                 // "They're right there."
    [T.c05e + 0.2, 460, 790, 1.85],
  ];
  function camera(t) {
    let [cx, cy, s] = keys(t, K);
    // the race: pull back to show the lifeguard already in the water, then frame her and Maya together
    if (t > T.c05e + 0.2) {
      const wt = W0(Math.min(t, T.rewind0));
      const L = lifeguard(wt), mh = maya(wt) || { dx: 0, dy: 0 };
      const mx = MAYA.x + mh.dx, my = MAYA.y + mh.dy, lx = L.x ?? 178, ly = L.y ?? 1452;
      const d = Math.hypot(lx - mx, ly - my);
      const rc = [(lx + mx) / 2, (ly + my) / 2 + 30, clamp(1450 / (d + 480), 1.35, 1.95)];
      const end = [mx + 30, my + 70, 1.85];
      const k = ramp(t, T.c05e + 0.2, T.c05e + 1.0), k2 = ramp(t, T.reachF - 0.5, T.reachF + 0.5);
      [cx, cy, s] = [0, 1, 2].map((j) => lerp(lerp([cx, cy, s][j], rc[j], k), end[j], k2));
    }
    if (t > T.rewind0) {                               // the rewind takes the camera back to the full view
      const k = ramp(t, T.rewind0, R - 0.2);
      [cx, cy, s] = [lerp(cx, 540, k), lerp(cy, 960, k), lerp(s, 1.0, k)];
    }
    return camAt(cx, cy, s);
  }

  // ------------------------------------------------------------------ the tags and the frame-0 line (film time): paper
  // lifted off by hand, never faded; set back down at the end of the rewind
  const LIFT_ORDER = [14, 2, 1, 12, 5, 10, 8, 3, 16, 7, 13, 4, 11, 6, 15];
  const setDown = (t) => (t < T.rewind0 ? 0 : t >= R ? 1 : ramp(t, R - 0.45, R - 0.05));
  function tagLift(t) {
    const back = setDown(t);
    return (n) => {
      let off;
      if (n === 9) off = ramp(t, T.c03 + 0.05, T.c03 + 0.5);                // her number gives way to her name
      else { const t0 = T.ring1 + 0.25 + 0.045 * LIFT_ORDER.indexOf(n); off = ramp(t, t0, t0 + 0.35); }
      return t >= T.rewind0 ? 1 - back : off;
    };
  }
  const uiLift = (t) => (t >= T.rewind0 ? 1 - setDown(t) : ramp(t, T.ring1 + 0.3, T.ring1 + 0.75));
  function label(g, t, k) {
    if (k >= 0.999) return;
    const x0 = 64, y0 = 290, w = 684, h = 86;
    const tile = label.tile || (label.tile = P.fibreTile(256, 77, 0.8));
    g.save();
    g.globalAlpha = 1 - Math.pow(clamp((k - 0.5) / 0.5), 2);
    g.translate(x0 + w / 2, y0 + h / 2 - 70 * k * k); g.rotate(-0.06 * k); g.scale(1 + 0.08 * k, 1 + 0.08 * k); g.translate(-(x0 + w / 2), -(y0 + h / 2));
    const pts = []; for (let i = 0; i <= 24; i++) pts.push([lerp(x0, x0 + w, i / 24), y0 + h / 2 + 1.5 * Math.sin(i * 0.9)]);
    P.strip(g, pts, h, 61, 0.05); P.fill(g, '#fffdf7', { lift: 6 + 30 * k });
    P.strip(g, pts, h, 61, 0.05); P.grain(g, tile, 0.5, true);
    g.fillStyle = B.COL.navy; g.font = '700 condensed 66px Bahn'; g.fontStretch = 'condensed';
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('ONE OF THEM IS DROWNING.', x0 + 24, y0 + h / 2 + 4);
    g.restore();
  }
  // the clock: a paper lifebuoy torn into 15 pieces, one a second, each scrap flicking off; the last goes on "Time."
  function chunkPath(g, cx, cy, R2, r, a0, a1, seed) {
    const n = 8, pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push([cx + Math.cos(a) * R2, cy + Math.sin(a) * R2]); }
    for (let i = 0; i <= 4; i++) { const rr = lerp(R2, r, i / 4), j = 0.035 * P.tooth(seed, i); pts.push([cx + Math.cos(a1 + j) * rr, cy + Math.sin(a1 + j) * rr]); }
    for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * (i / n); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    for (let i = 4; i >= 0; i--) { const rr = lerp(R2, r, i / 4), j = 0.035 * P.tooth(seed + 7, i); pts.push([cx + Math.cos(a0 + j) * rr, cy + Math.sin(a0 + j) * rr]); }
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  }
  function ring(g, t, k) {
    if (k >= 0.999) return;
    const cx = 858, cy = 344, R2 = 58, r = 37, N = 15, TAU = Math.PI * 2;
    const tt = P.twos(t), replay = t >= T.rewind0;
    const tornAt = (i) => (replay ? Infinity : T.ring0 + 1 + i);
    const last = Math.floor(tt - T.ring0 - 1);
    const jolt = !replay && last >= 0 && last < N ? 2.5 * Math.max(0, 1 - (tt - tornAt(last)) / 0.2) : 0;
    g.save();
    g.globalAlpha = 1 - Math.pow(clamp((k - 0.5) / 0.5), 2);
    g.translate(cx, cy - jolt - 70 * k * k); g.rotate(0.08 * k); g.scale(1 + 0.1 * k, 1 + 0.1 * k); g.translate(-cx, -cy);
    P.blob(g, cx, cy, R2 + 8, R2 + 8, 0, 71, 0.02); P.fill(g, '#fffdf7', { lift: 6 + 30 * k });
    g.beginPath(); g.arc(cx, cy, R2, 0, TAU); g.arc(cx, cy, r, 0, TAU, true); g.fillStyle = 'rgba(27,42,68,0.12)'; g.fill();
    for (let i = 0; i < N; i++) {
      const a0 = -Math.PI / 2 + (i / N) * TAU, a1 = -Math.PI / 2 + ((i + 1) / N) * TAU;
      const u = (tt - tornAt(i)) / 0.65;
      if (u < 0) { chunkPath(g, cx, cy, R2, r, a0, a1, 300 + i); P.fill(g, B.COL.coral, { lift: 3 }); }
      else if (u < 1) {
        const am = (a0 + a1) / 2, rm = (R2 + r) / 2 + 40 * u + 60 * u * u;
        g.save();
        g.translate(cx + Math.cos(am) * rm, cy + Math.sin(am) * rm - 50 * u + 70 * u * u);
        g.rotate((i % 2 ? 1 : -1) * 3.2 * u); g.globalAlpha *= 1 - u;
        chunkPath(g, -Math.cos(am) * (R2 + r) / 2, -Math.sin(am) * (R2 + r) / 2, R2, r, a0, a1, 300 + i);
        P.fill(g, B.COL.coral, { lift: 3 + 10 * u });
        g.restore();
      }
    }
    g.restore();
  }

  // ------------------------------------------------------------------ the film: one continuous paper world
  scene({
    name: 'beach', from: 'hook', to: 'end',
    build(root, S2) { S2.g = canvas(root); },
    run(t, b, S2) {
      const g = S2.g;
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      B.paint(g, worldTime(t), { ctx, cam: camera(t), tags: tagLift(t) });
      const k = uiLift(t);
      label(g, t, k); ring(g, t, k);
      g.restore();
    },
  });

  // every reel ends with the Root Cause end card ('end' → 'done', 3.0 s, engine/endcard)
  U.endcard();
  C.start();
})();
