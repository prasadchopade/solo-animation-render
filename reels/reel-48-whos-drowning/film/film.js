// Reel 48 Who's Drowning?: a crowded beach in cut paper, seen from straight above. Sixteen numbered people; one of
// them, number nine, Maya, is drowning, and she makes no sound.
// The world (film/beach.js) is a pure function of WORLD time; the film runs world time forward, then backward to the
// first frame (the rewind), then forward again from 0 (the replay after "Now look."). The camera, the tags and the
// frame-0 line run on FILM time. Every beat is keyed to the placed voice (film/timing.js, from place_vo.py).
// No timers, no Math.random, nothing mutated in run(): any frame paints the same in any order.
(() => {
  const { scene, canvas, clamp, lerp, W, H } = C;
  const U = window.UI, P = window.PAPER, B = window.BEACH;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn'];
  P.usePieceTexture(true);

  // ------------------------------------------------------------------ the clock, from the placed voice
  const TM = window.TIMING;
  const line = (id) => TM.lines[id];
  const clean = (w) => w.toLowerCase().replace(/[^a-z']/g, '');
  function word(id, w, k = 0) {                       // the k-th occurrence of word w in line id: its onset
    const ws = line(id).words.filter((x) => clean(x.w) === w);
    if (!ws.length) throw new Error(`no "${w}" in ${id}`);
    return ws[Math.min(k, ws.length - 1)].t0;
  }
  const T = {
    ring0: TM.ring0, ring1: TM.ring1,
    help: line(TM.boy).start, wave: line('c02').start,
    reveal: line('n07').start, under: word('n08', 'under'),
    noise: line('n09').start, boy: word('n10', 'boy'), man: word('n10', 'man'), boat: word('n10', 'boat'),
    found: line('n11').start, there: line('n12').start,
    c03: line('c03').start, c04: line('c04').start, c05: line('c05').start, c05e: line('c05').end,
    why: line('n13').start, breathe: word('n13', 'breathe'), pushing: word('n13', 'pushing'), whyEnd: line('n13').end,
    shout: line('n14').start, sure: line('n15').start, sureEnd: line('n15').end,
    cough: TM.cough, rewind0: TM.rewind0, rewind1: TM.rewind1, look: line('n16').start, end: TM.end,
  };
  // the lifeguard's run, in world time: she's up as the narrator says her friends didn't see; off the chair before the scream
  T.lgStand = T.found + 0.25; T.lgJump = T.there + 0.1;
  T.lgRun = T.lgJump + 0.35; T.lgWade = T.lgRun + 1.35; T.lgDive = T.lgWade + 1.35; T.lgSwim = T.lgDive + 0.45;
  T.reach = T.shout + 0.35;                          // she gets there as "So don't wait for a shout." begins
  T.tow = T.reach + 0.9; T.hand = T.sure + 1.2;
  T.set2 = [T.lgSwim + 2.2, T.lgSwim + 4.6];         // a set of waves comes through while she swims
  window.STORY_T = T;                                // (read by the review tools)

  // ------------------------------------------------------------------ easing and keys
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

  // ------------------------------------------------------------------ world time: forward, the rewind, the replay
  function worldTime(t) {
    if (t < T.rewind0) return t;
    if (t < T.rewind1) { const u = (t - T.rewind0) / (T.rewind1 - T.rewind0); return T.rewind0 * (1 - ease(u)); }
    return t - T.rewind1;
  }

  // ------------------------------------------------------------------ the people's story (all in world time)
  const MAYA = { x: 330, y: 692 };
  const LOOK = (fx, fy, tx, ty) => Math.atan2(tx - fx, -(ty - fy));          // 0 = towards the sea, + clockwise
  const BREATH = 3.3;
  // Maya after the answer: up for the push-in, under on "under", her own breaths, under while her friend calls her,
  // one breath on "breathe", her arms pushing on "pushing", then held up by the tube, towed, a cough.
  function maya(wt) {
    if (wt < T.reveal) return null;
    const cyc = (t0, t) => { const u = ((t - t0) / BREATH) % 1; return u < 0.32 ? Math.sin((u / 0.32) * Math.PI / 2) * 0.85 : u < 0.5 ? 0.85 : u < 0.78 ? 0.85 * (1 - (u - 0.5) / 0.28) : 0; };
    let s, press = 0.3;
    if (wt < T.under - 0.2) s = 0.85;
    else if (wt < T.under + 0.4) s = 0.85 * (1 - ramp(wt, T.under - 0.2, T.under + 0.4));
    else if (wt < T.under + 1.1) s = 0;
    else if (wt < T.c03 - 0.6) { s = cyc(T.under + 1.1, wt); press = s > 0.1 && s < 0.84 ? 1 : 0.25; }
    else {
      // under as her friend turns and calls; a short bob; one breath on "breathe"; her arms push on "pushing"; a last, weaker one
      s = keys(wt, [[T.c03 - 0.6, 0.8], [T.c03 - 0.2, 0], [T.c05e + 0.8, 0], [T.c05e + 1.2, 0.55], [T.c05e + 1.7, 0.55], [T.c05e + 2.2, 0],
        [T.breathe - 0.7, 0], [T.breathe - 0.1, 0.85], [T.breathe + 0.5, 0.85], [T.breathe + 0.9, 0],
        [T.pushing - 0.3, 0], [T.pushing + 0.2, 0.6], [T.pushing + 0.9, 0.6], [T.pushing + 1.4, 0],
        [T.reach - 1.2, 0], [T.reach - 0.8, 0.35], [T.reach - 0.4, 0.1]])[0];
      press = s > 0.05 ? 1 : 0.4;
    }
    const held = ramp(wt, T.reach, T.reach + 0.8);
    const tow = ramp(wt, T.tow, T.hand + 0.6);
    const cough = Math.max(win(wt, T.cough - 0.05, T.cough + 0.1, T.cough + 0.35, T.cough + 0.6), 0.8 * win(wt, T.cough + 0.75, T.cough + 0.85, T.cough + 1.0, T.cough + 1.25));
    return { s: Math.max(s, held), press: press * (1 - held), held, cough, dx: 74 * tow, dy: 58 * tow };
  }
  function friend(n, wt) {
    if (n === 4) {
      const p = { x: 462, y: 824 };
      if (wt < T.c03 - 0.35) return null;
      const toMaya = LOOK(p.x, p.y, MAYA.x, MAYA.y), toShore = LOOK(p.x, p.y, 178, 1452);
      const callShore = win(wt, T.c05 - 0.15, T.c05 + 0.05, T.c05e + 1.0, T.c05e + 1.5);
      const look = lerp(lerp(p.rot ?? 1.2, toMaya, ramp(wt, T.c03 - 0.35, T.c03 + 0.05)), toShore, callShore);
      const mh = maya(wt), hand = mh ? { x: MAYA.x + mh.dx + 26, y: MAYA.y + mh.dy + 62 } : null;
      return { stop: 1, look, shout: callShore, armsUp: Math.min(1, callShore + 0.55 * ramp(wt, T.c05e + 1.2, T.c05e + 1.6) * (1 - ramp(wt, T.hand - 0.8, T.hand - 0.4))),
               reach: hand ? { ...hand, k: ramp(wt, T.hand - 0.6, T.hand) } : null };
    }
    if (n === 13) {
      const p = { x: 606, y: 866 };
      if (wt < T.c04 - 0.25) return null;
      return { stop: 1, look: LOOK(p.x, p.y, MAYA.x, MAYA.y), shout: 0, armsUp: 0.5 * ramp(wt, T.c05e + 0.4, T.c05e + 0.9) * (1 - ramp(wt, T.hand - 0.5, T.hand)) };
    }
    return null;
  }
  // the lifeguard: on her chair; standing with her whistle; off the chair, across the sand, through the shallows, a dive,
  // a swim (a set of waves breaks over her), then behind Maya with the tube across Maya's chest, and the tow to the sandbar
  function lifeguard(wt) {
    const toMaya = LOOK(178, 1452, MAYA.x, MAYA.y);
    if (wt < T.lgStand) return { mode: 'chair', look: 0.1 };
    if (wt < T.lgJump) return { mode: 'stand', k: ramp(wt, T.lgStand, T.lgStand + 0.3), look: lerp(0.1, toMaya, ramp(wt, T.lgStand, T.lgStand + 0.4)) };
    // a clear lane: off the chair, along the wet sand above the sandcastle, into the water between the duck float and the
    // woman in the hat, past her friends on the sandbar, and up behind Maya
    const path = [[T.lgJump, 214, 1410], [T.lgRun, 268, 1380], [T.lgWade, 440, 1352], [T.lgDive, 444, 1206], [T.lgSwim, 440, 1150], [T.reach, MAYA.x, MAYA.y + 96]];
    let i = 1; while (i < path.length - 1 && wt >= path[i][0]) i++;
    const [t0, x0, y0] = path[i - 1], [t1, x1, y1] = path[i];
    let u = clamp((wt - t0) / (t1 - t0));
    if (i === path.length - 1) {                       // the swim: steady, held back while the set breaks over her
      const slow = (a) => a - 0.35 * clamp((a - 0.25) / 0.3) * clamp((0.75 - a) / 0.3);
      u = clamp(slow(u) / slow(1));
    } else u = i === 1 ? ease(u) : u;
    const x = lerp(x0, x1, u), y = lerp(y0, y1, u), dir = LOOK(x0, y0, x1, y1);
    const mode = i === 1 || i === 2 ? 'run' : i === 3 ? 'wade' : i === 4 ? 'dive' : 'swim';
    if (wt >= T.reach) {
      const mh = maya(wt), hx = MAYA.x + mh.dx, hy = MAYA.y + mh.dy;
      const tube = { x: hx, y: hy + 58, len: 96, rot: 0 };
      return wt < T.tow ? { mode: 'hold', x: hx, y: hy + 96, dir: 0, tube }
        : { mode: 'tow', x: hx + 10, y: hy + 104, dir: 2.2, u: wt * 0.7, tube };
    }
    const strokeU = mode === 'run' ? wt * 2.6 : mode === 'wade' ? wt * 1.7 : wt * 0.95;
    const L = { mode, x, y, dir, u: strokeU, splash: mode === 'dive' ? u : 0 };
    if (mode === 'swim' || mode === 'dive') {           // the tube trails on its line
      const bx = x - Math.sin(dir) * 120, by = y + Math.cos(dir) * 120;
      L.tube = { x: bx + 6 * Math.sin(wt * 2.1), y: by, len: 90, rot: dir + Math.PI / 2 + 0.2 * Math.sin(wt * 1.3), line: [x + 14, y + 18] };
    }
    return L;
  }
  const ctx = {
    // No. 6 yells "Help!" and flails, then bobs about; after "Time." his brother dunks him on "boy" and they laugh
    boy(wt) {
      const d = T.boy + 0.2;
      const flail = clamp((wt - (T.help - 0.2)) / 0.2) * clamp((T.help + 1.3 - wt) / 0.3);
      const laugh = clamp((wt - (d + 0.6)) / 0.2) * clamp((d + 4.0 - wt) / 0.5);
      const reach = clamp((wt - d) / 0.35) * clamp((d + 1.0 - wt) / 0.3);
      const dunk = clamp((wt - (d + 0.3)) / 0.12) * clamp((d + 1.1 - wt) / 0.12);
      return { flail, laugh, dunk, reach };
    },
    waving(wt) { return Math.max(clamp((wt - (T.wave - 0.3)) / 0.25) * clamp((T.wave + 3.2 - wt) / 0.4), clamp((wt - (T.man - 0.3)) / 0.25) * clamp((T.man + 2.8 - wt) / 0.4)); },
    boatWave(wt) { return clamp((wt - (T.boat + 0.1)) / 0.2) * clamp((T.boat + 2.6 - wt) / 0.3); },
    lifeguard, maya, friend,
    sets: [[12.6, 15.8], T.set2],
  };

  // ------------------------------------------------------------------ the camera (film time)
  function camAt(cx, cy, s) { return { s, x: -s * (cx - W / 2), y: -s * (cy - H / 2) }; }
  const K = [
    [0, 540, 960, 1.0],
    [T.ring0 + 6.0, 540, 960, 1.0],
    [T.ring0 + 8.2, 470, 880, 1.06],                 // one wide drift across the deep water, everyone in frame
    [T.ring0 + 10.2, 600, 900, 1.05],
    [T.ring0 + 11.8, 540, 960, 1.0],
    [T.reveal - 0.05, 540, 960, 1.0],
    [T.reveal + 1.2, 330, 730, 2.3],                 // "It's number nine."
    [T.noise, 330, 730, 2.3],
    [T.noise + 0.7, 560, 960, 1.15],                 // "Did you go for the noise?"
    [T.boy - 0.4, 560, 960, 1.15],
    [T.boy + 0.15, 830, 1150, 2.0],                  // the boy
    [T.man - 0.4, 830, 1150, 2.0],
    [T.man + 0.15, 800, 690, 1.3],                   // the man and his boat
    [T.found - 0.2, 800, 690, 1.3],
    [T.found + 0.9, 420, 1010, 1.35],                // her friends, and the lifeguard on her chair
    [T.c05e + 0.3, 400, 990, 1.42],
  ];
  function camera(t) {
    let [cx, cy, s] = keys(t, K);
    // the race: frame the lifeguard and Maya together, closer as the gap closes
    if (t > T.c05e) {
      const L = lifeguard(t), mx = MAYA.x, my = MAYA.y;
      const lx = L.x ?? 178, ly = L.y ?? 1452;
      const d = Math.hypot(lx - mx, ly - my);
      const rc = [(lx + mx) / 2, (ly + my) / 2 + 40, clamp(1500 / (d + 520), 1.42, 2.0)];
      const end = [370 + 0.5 * maya(t).dx, 760 + 0.5 * maya(t).dy, 1.85];
      const k = ramp(t, T.c05e + 0.3, T.c05e + 1.2);
      const k2 = ramp(t, T.reach - 0.4, T.reach + 0.6);
      [cx, cy, s] = [0, 1, 2].map((j) => lerp(lerp([cx, cy, s][j], rc[j], k), end[j], k2));
    }
    // the rewind takes the camera back to the full view; the replay holds it
    if (t > T.rewind0) {
      const k = ramp(t, T.rewind0, T.rewind1 - 0.2);
      [cx, cy, s] = [lerp(cx, 540, k), lerp(cy, 960, k), lerp(s, 1.0, k)];
    }
    return camAt(cx, cy, s);
  }

  // ------------------------------------------------------------------ the tags, the frame-0 line, the ring (film time)
  function tagAlpha(t) {
    const back = ramp(t, T.rewind1 - 0.5, T.rewind1);                    // all back for the first frame again
    const others = (1 - ramp(t, T.reveal, T.reveal + 0.6)) * (t < T.rewind0 ? 1 : 0);
    const nine = (1 - ramp(t, T.c03 - 0.1, T.c03 + 0.4)) * (t < T.rewind0 ? 1 : 0);   // her number gives way to her name
    return (n) => Math.max(n === 9 ? nine : others, back);
  }
  function uiAlpha(t) {
    if (t >= T.rewind1 - 0.3) return ramp(t, T.rewind1 - 0.3, T.rewind1);
    return 1 - ramp(t, T.ring1 + 0.35, T.ring1 + 0.9);
  }
  function label(g, t, a) {
    if (a <= 0.01) return;
    const x0 = 64, y0 = 290, w = 684, h = 86;
    const tile = label.tile || (label.tile = P.fibreTile(256, 77, 0.8));
    g.save(); g.globalAlpha = a;
    const pts = []; for (let k = 0; k <= 24; k++) pts.push([lerp(x0, x0 + w, k / 24), y0 + h / 2 + 1.5 * Math.sin(k * 0.9)]);
    P.strip(g, pts, h, 61, 0.05); P.fill(g, '#fffdf7', { lift: 6 });
    P.strip(g, pts, h, 61, 0.05); P.grain(g, tile, 0.5, true);
    g.fillStyle = B.COL.navy; g.font = '700 condensed 66px Bahn'; g.fontStretch = 'condensed';
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('ONE OF THEM IS DROWNING.', x0 + 24, y0 + h / 2 + 4);
    g.restore();
  }
  function ring(g, t, a) {
    if (a <= 0.01) return;
    const cx = 858, cy = 334, R = 58, r = 37;
    const k = t >= T.rewind1 ? 0 : clamp((P.twos(t) - T.ring0) / (T.ring1 - T.ring0));    // 0 full .. 1 gone
    g.save(); g.globalAlpha = a;
    P.blob(g, cx, cy, R + 8, R + 8, 0, 71, 0.02); P.fill(g, '#fffdf7', { lift: 6 });
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.arc(cx, cy, r, 0, Math.PI * 2, true); g.fillStyle = 'rgba(27,42,68,0.12)'; g.fill();
    if (k < 1) {
      const a0 = -Math.PI / 2 + k * Math.PI * 2, a1 = Math.PI * 1.5;
      g.beginPath(); g.arc(cx, cy, R, a0, a1); g.arc(cx, cy, r, a1, a0, true); g.closePath();
      P.fill(g, B.COL.coral, { lift: 3 });
    }
    g.restore();
  }

  // ------------------------------------------------------------------ the film: one continuous paper world
  scene({
    name: 'beach', from: 'hook', to: 'end',
    build(root, S) { S.g = canvas(root); },
    run(t, b, S) {
      const g = S.g;
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      const wt = worldTime(t);
      B.paint(g, wt, { ctx, cam: camera(t), tags: tagAlpha(t) });
      const a = uiAlpha(t);
      label(g, t, a); ring(g, t, a);
      g.restore();
    },
  });

  // every reel ends with the Root Cause end card ('end' → 'done', 3.0 s, engine/endcard)
  U.endcard();
  C.start();
})();
