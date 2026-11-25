// Reel 48 Who's Drowning?: a crowded beach in cut paper, seen from straight above. Sixteen numbered people; one of
// them, number nine, Maya, is drowning, and she makes no sound.
// The world (film/beach.js) is a pure function of WORLD time. The film runs world time forward; holds it still on the
// ring's end (the freeze, until "It's number nine…"); runs it on; then back to the first frame (the sheet lifted off);
// then forward again from 0 (the replay, under "You were looking at her…"). The camera, the tags and the frame-0 line
// run on FILM time.
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
    half: TM.ring0 + 7.5, last: TM.ring1 - 2.7,                       // the ring's thump and its red (no countdown words)
    reveal: line('n02').start,                                        // "It's number nine, and she hasn't made a sound."
    mouth: line('n03').start, above: word('n03', 'above'), under: line('n03').end - 0.1,   // "Her mouth is only above the water…"
    boyR: line('c01r').start, boyRe: line('c01r').end, manR: line('c02r').start, manRe: line('c02r').end,   // their calls again
    found: line('n04').start, lg: line('n05').start, has: word('n05', 'has'),
    c03: line('c03').start, c03e: line('c03').end, c04: line('c04').start, c04e: line('c04').end, c05: line('c05').start, c05e: line('c05').end,
    why: line('n06').start, nobody: word('n06', 'nobody'), pushing: word('n06', 'help'), whyEnd: line('n06').end,
    sure: line('n07').start, sureEnd: line('n07').end,
    cough: TM.cough, rewind0: TM.rewind0, rewind1: TM.rewind1, look: line('n08').start, end: TM.end,
  };
  const drowning = word('n01', 'drowning');

  // ------------------------------------------------------------------ world time: the freeze, the rewind, the replay
  const step = (x) => Math.round(x * 15) / 15;                       // whole steps of the twos, so the drawings keep their rhythm
  const F = step(T.reveal - T.ring1);                                // the freeze lasts from the ring's end to "It's number nine…"
  const R = step(T.rewind1);
  const W0 = (t) => (t < T.ring1 ? t : t < T.reveal ? T.ring1 : t - F);
  // story times in world time: after the freeze, every beat sits F earlier in the world
  const S = {};
  for (const [k, v] of Object.entries(T)) S[k] = v >= T.reveal - 1e-6 ? v - F : v;
  S.throw = S.boyRe + 0.35;                                          // the boys: the water leaves his hand after his "Help!"
  S.boatW = S.manRe + 0.2;                                           // the towel swung back from the boat
  S.lgStand = S.has - 0.1; S.whistle = S.has + 0.1; S.point = S.has + 0.25;    // "But the lifeguard has.": on her feet on "has"
  S.friendsStop = S.whistle + 0.35;                                  // the whistle stops her friends' splashing
  S.lgJump = S.has + 1.2; S.lgLand = S.lgJump + 0.45;                // off the chair just before the cut back to her friends
  S.lgWade = S.lgLand + 0.85; S.lgDive = S.lgWade + 1.4; S.lgSwim = S.lgDive + 0.35;   // run, wade to chest depth, dive, swim
  S.reach = S.sure + 0.25;                                           // the tube lifts her on "So if someone…"
  // her approach: a body length short she comes upright, hauls the tube in hand over hand on its line, and as "…for help."
  // ends kicks in behind Maya pushing it across her chest; she grips its ends and tows her in to the sandbar
  S.short = S.reach - 1.75; S.haul = S.short + 0.3; S.push = S.reach - 0.6;
  S.tow = S.reach + 0.9; S.towEnd = S.cough - 0.3; S.hand = S.tow + 0.55 * (S.towEnd - S.tow);
  T.reachF = S.reach + F; T.pointF = S.point + F; T.jumpF = S.lgJump + F;   // (film time)
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
  const TOW = { dx: 40, dy: 172 };                                   // the tow: in over the sandbar's edge, to her friend
  const LOOK = (fx, fy, tx, ty) => Math.atan2(tx - fx, -(ty - fy));          // 0 = towards the sea, + clockwise
  const turnTo = (a, b, k) => a + (((((b - a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI) * k;   // the short way round
  // Maya after the answer: from wherever the freeze caught her (rising), up for the push-in; low just before "Her
  // mouth…", up on "above the water", under as the line ends; her own breaths while the camera's away; up with her mouth
  // at the water as her friend calls her name (she can't answer), short dips between, never under for long; one breath on
  // "nobody", her arms pushing on "help"; the tube lifts her; the tow; two coughs; her right hand goes to her friend's.
  function maya(wt) {
    if (wt < S.reveal) return null;
    let s, press;
    if (wt < S.under + 1.4) {
      const n0 = B.mayaState(S.reveal);
      s = keys(wt, [[S.reveal, n0.s], [S.reveal + 0.5, 0.85], [S.mouth - 0.8, 0.85], [S.mouth - 0.2, 0.12], [S.above - 0.3, 0.12], [S.above + 0.15, 0.9],
        [S.under - 0.2, 0.85], [S.under + 0.35, 0], [S.under + 0.95, 0], [S.under + 1.4, 0.85]])[0];
      press = keys(wt, [[S.reveal, n0.press], [S.reveal + 0.6, 0.35], [S.mouth - 0.3, 0.35], [S.above - 0.3, 1], [S.above + 0.35, 0.4],
        [S.under + 0.8, 0.35], [S.under + 1.0, 1]])[0];
    } else if (wt < S.c03 - 1.2) {
      const nat = B.mayaState(wt); s = nat.s; press = nat.press;
    } else if (wt < S.reach) {
      s = keys(wt, [[S.c03 - 1.2, B.mayaState(S.c03 - 1.2).s], [S.c03 - 0.5, 0.78], [S.c03e + 0.1, 0.78], [S.c03e + 0.42, 0.1], [S.c04 - 0.12, 0.1], [S.c04 + 0.3, 0.8],
        [S.c04e + 0.1, 0.8], [S.c05 - 0.05, 0.15], [S.c05 + 0.4, 0.15], [S.c05 + 0.85, 0.78], [S.c05 + 1.6, 0.78], [S.c05 + 1.95, 0.12], [S.c05 + 2.5, 0.12],
        [S.nobody - 0.15, 0.85], [S.nobody + 0.35, 0.85], [S.nobody + 0.65, 0.55],
        [S.pushing - 0.2, 0.55], [S.pushing + 0.35, 0.75], [S.reach, 0.75]])[0];
      press = s > 0.05 ? 1 : 0.45;
    } else { s = 1; press = 0; }
    const held = ramp(wt, S.reach, S.reach + 0.7);
    const tow = ramp(wt, S.tow, S.towEnd);
    const pulse = (t0) => win(wt, t0 - 0.02, t0 + 0.07, t0 + 0.12, t0 + 0.42);      // a cough: a sharp jerk, easing back
    const cough = Math.max(pulse(S.cough), 0.85 * pulse(S.cough + 0.45));
    const spray = [(wt - S.cough) / 0.55, (wt - S.cough - 0.45) / 0.55];
    const dx = TOW.dx * tow, dy = TOW.dy * tow;
    const handR = { x: MAYA.x + dx + 55, y: MAYA.y + dy + 30, k: ramp(wt, S.hand - 0.5, S.hand) };
    const eyeOpen = ramp(wt, S.reveal + 0.6, S.reveal + 0.9), lids = win(wt, S.reach + 0.25, S.reach + 0.5, S.reach + 1.6, S.reach + 1.85), smile = ramp(wt, S.hand + 0.05, S.hand + 0.3);
    return { s: Math.max(s, held), press: press * (1 - held), held, cough, spray, dx, dy, handR, eyeOpen, lids, smile };
  }
  // her friends. No. 4: the whistle stops her splashing and turns her to the shore; "Mayaa?", arms open, looking round;
  // "Mayaa!", she sees her: a startle and a lunge, the arm nearer Maya reaching for her; "Mayaa!", leaning in harder.
  // When the tow brings Maya in, she steps to meet her and takes her hand. She stays on the sandbar: only the lifeguard
  // goes in.
  function friend(n, wt) {
    if (n === 4) {
      const p = { x: 462, y: 824 };
      if (wt < S.friendsStop) return null;
      const toMaya = LOOK(p.x, p.y, MAYA.x, MAYA.y), toShore = LOOK(p.x, p.y, 178, 1452);
      const turn0 = ramp(wt, S.friendsStop, S.friendsStop + 0.55);    // to the whistle
      const turn = ramp(wt, S.c03 - 0.45, S.c03 + 0.1);                // looking round for her
      const spot = ramp(wt, S.c04 - 0.3, S.c04 - 0.08);
      const look = turnTo(turnTo(turnTo(1.2, toShore, turn0), -1.75, turn), toMaya, spot);
      const shout = Math.max(0.6 * win(wt, S.c03 - 0.1, S.c03 + 0.05, S.c03e, S.c03e + 0.25), win(wt, S.c04 - 0.1, S.c04 + 0.05, S.c04e, S.c04e + 0.25),
        win(wt, S.c05 - 0.1, S.c05 + 0.05, S.c05e, S.c05e + 0.3));
      const open = win(wt, S.c03 - 0.25, S.c03 + 0.1, S.c03e + 0.1, S.c04 - 0.35);
      const startle = win(wt, S.c04 - 0.2, S.c04 - 0.12, S.c04 - 0.08, S.c04 + 0.12);
      const lunge = win(wt, S.c04 - 0.1, S.c04 + 0.18, S.c05e + 0.6, S.c05e + 1.1);
      const lean = win(wt, S.c05 - 0.15, S.c05 + 0.1, S.c05e + 0.3, S.c05e + 0.8);   // the third call: leaning in harder
      const waveShore = 0;
      const armsUp = 0.55 * ramp(wt, S.c05e + 0.9, S.c05e + 1.3) * (1 - ramp(wt, S.hand - 1.4, S.hand - 1.0));
      const mh = maya(wt), dyH = maya(S.hand).dy;
      const stepK = ramp(wt, S.hand - 1.2, S.hand - 0.2), follow = ramp(wt, S.hand, S.hand + 0.3);
      const lx = Math.sin(toMaya), ly = -Math.cos(toMaya), push = 16 * lunge + 8 * lean - 6 * startle;
      const dx = lx * push + 6 * stepK, dy = ly * push + 34 * stepK + (mh.dy - dyH) * follow;
      const reach = { x: mh.handR.x, y: mh.handR.y, k: ramp(wt, S.hand - 0.7, S.hand) };
      return { stop: 1, look, toMaya, shout, open, startle, lunge, waveShore, armsUp, reach, dx, dy };
    }
    if (n === 13) {                                     // the whistle stops her too; on "Mayaa?" she looks at her friend, then at Maya: hands to her mouth
      const p = { x: 606, y: 866 };
      if (wt < S.friendsStop + 0.1) return null;
      const look = turnTo(turnTo(turnTo(-1.9, LOOK(p.x, p.y, 178, 1452), ramp(wt, S.friendsStop + 0.1, S.friendsStop + 0.65)),
        LOOK(p.x, p.y, 462, 824), ramp(wt, S.c03 - 0.1, S.c03 + 0.3)), LOOK(p.x, p.y, MAYA.x, MAYA.y), ramp(wt, S.c04 - 0.2, S.c04 + 0.15));
      const worried = ramp(wt, S.c04 - 0.1, S.c04 + 0.3) * (1 - ramp(wt, S.hand + 0.3, S.hand + 0.8)), toM = LOOK(p.x, p.y, MAYA.x, MAYA.y);
      return { stop: 1, look, shout: 0, armsUp: 0, worried, dx: -Math.sin(toM) * 10 * worried, dy: Math.cos(toM) * 10 * worried };   // a half-step back
    }
    return null;
  }
  // the lifeguard: on her chair scanning the whole water (her body turns with her scan, and now and then she shades her
  // eyes); after the freeze her eyes settle on Maya; on "has" she's on her feet: one long whistle blast, and her arm
  // points at Maya. Off the chair just before the cut back to the friends. A dive; a crawl, the tube a body length behind
  // on its line. She comes in on Maya's left, never head-on: a body length off she comes upright facing her, hauls the
  // tube in hand over hand round her side, and as "…for help." ends kicks in beside Maya sliding it across her chest. She
  // grips its end and Maya's shoulder, turns to the shore, and tows her in beside her with a sidestroke.
  const P0 = { x: MAYA.x - 170, y: MAYA.y + 10 };                    // where she stops: a body length off Maya's left
  const SIDE = { x: -66, y: 12 };                                    // beside her, heads level and apart
  const SWIM_DIR = LOOK(400, 980, P0.x, P0.y);
  const TRAIL = [P0.x - Math.sin(SWIM_DIR) * 190, P0.y + Math.cos(SWIM_DIR) * 190];   // where the tube lies when she stops
  function lifeguard(wt) {
    const toMaya = LOOK(178, 1440, MAYA.x, MAYA.y);
    if (wt < S.lgStand) {
      const scan = 0.75 * Math.sin(wt * 0.55) + 0.25 * Math.sin(wt * 1.3);
      const c = (wt + 1.5) % 6.2, shade = win(c, 0.4, 0.75, 2.1, 2.45);
      return { mode: 'chair', look: lerp(scan, toMaya, ramp(wt, S.reveal, S.reveal + 1.0)), turn: 0.35 * scan * (1 - ramp(wt, S.reveal, S.reveal + 1.0)), shade };
    }
    if (wt < S.lgJump) {
      return { mode: 'stand', k: ramp(wt, S.lgStand, S.lgStand + 0.3), look: toMaya, pointAt: toMaya, blast: (wt - S.whistle - 0.05) / 0.6,
        whistle: win(wt, S.whistle - 0.2, S.whistle, S.lgJump - 0.45, S.lgJump - 0.15), point: win(wt, S.point - 0.2, S.point + 0.12, S.lgJump - 0.35, S.lgJump - 0.05) };
    }
    if (wt < S.lgLand) {                                // the hop off the chair
      const u = (wt - S.lgJump) / (S.lgLand - S.lgJump);
      return { mode: 'hop', x: lerp(178, 226, ease(u)), y: lerp(1430, 1400, ease(u)), dir: LOOK(178, 1430, 226, 1400), u: 0.25, air: Math.sin(u * Math.PI) };
    }
    const path = [[S.lgLand, 226, 1400], [S.lgWade, 420, 1262], [S.lgDive, 410, 1020], [S.lgSwim, 400, 980], [S.short, P0.x, P0.y]];
    if (wt < S.short) {
      let i = 1; while (i < path.length - 1 && wt >= path[i][0]) i++;
      const [t0, x0, y0] = path[i - 1], [t1, x1, y1] = path[i];
      const u0 = clamp((wt - t0) / (t1 - t0)), u = i === path.length - 1 ? 1 - (1 - u0) * (1 - u0) : u0;   // slowing into her stop
      const x = lerp(x0, x1, u), y = lerp(y0, y1, u), dir = LOOK(x0, y0, x1, y1);
      const mode = i === 1 ? 'run' : i === 2 ? 'wade' : i === 3 ? 'dive' : 'swim';
      const L = { mode, x, y, dir, u: mode === 'run' ? wt * 2.7 : mode === 'wade' ? wt * 1.8 : wt * 1.05, splash: mode === 'dive' ? u : 0 };
      if (mode === 'swim' || mode === 'dive') {           // the tube trails a body length behind on its line
        const calm = 1 - ramp(wt, S.short - 0.6, S.short);  // (its wobble settles as she slows, so the haul starts from rest)
        const bx = x - Math.sin(dir) * 190, by = y + Math.cos(dir) * 190;
        L.tube = { x: bx + 6 * Math.sin(wt * 2.1) * calm, y: by, len: 92, rot: dir + Math.PI / 2 + 0.2 * Math.sin(wt * 1.3) * calm, line: [x + 14, y + 18] };
      }
      return L;
    }
    if (wt < S.haul) {                                  // coming upright, turning to face Maya
      const k = ramp(wt, S.short, S.haul);
      return { mode: 'rise', k, x: P0.x, y: P0.y, dir: turnTo(SWIM_DIR, Math.PI / 2, k), tube: { x: TRAIL[0], y: TRAIL[1] - 10 * k, len: 92, rot: SWIM_DIR + Math.PI / 2, line: [P0.x + 8, P0.y + 18] } };
    }
    if (wt < S.push) {                                  // hand over hand: three pulls bring the tube round her right side to the front
      const n = 3, v = ((wt - S.haul) / (S.push - S.haul)) * n, i = Math.min(n - 1, Math.floor(v)), f = v - i;
      const prog = clamp((i + ease(clamp(f / 0.8))) / n);
      const A = [TRAIL[0], TRAIL[1] - 10], C2 = [P0.x + 30, P0.y + 118], E = [P0.x + 58, P0.y + 44];
      const bz = (a, c, e, q) => (1 - q) * (1 - q) * a + 2 * (1 - q) * q * c + q * q * e;
      return { mode: 'haul', x: P0.x, y: P0.y, dir: Math.PI / 2, pull: v,
        tube: { x: bz(A[0], C2[0], E[0], prog), y: bz(A[1], C2[1], E[1], prog), len: 92, rot: lerp(SWIM_DIR + Math.PI / 2, 0, prog), line: prog < 0.97 ? [P0.x + 10, P0.y + 16] : null } };
    }
    const mh = maya(wt), M = { x: MAYA.x + mh.dx, y: MAYA.y + mh.dy };
    if (wt < S.reach) {                                 // on "pushing": she kicks in beside Maya, sliding the tube across her chest
      const k = ramp(wt, S.push, S.reach);
      return { mode: 'push', k, x: lerp(P0.x, M.x + SIDE.x, k), y: lerp(P0.y, M.y + SIDE.y, k), dir: Math.PI / 2, mayaW: M,
        tube: { x: lerp(P0.x + 58, M.x, k), y: lerp(P0.y + 44, M.y + 58, k), len: 92, rot: 0 } };
    }
    const towK = ramp(wt, S.tow - 0.2, S.tow + 0.3);
    return { mode: 'hold', grip: ramp(wt, S.reach, S.reach + 0.4), towK, tow: towK * (1 - ramp(wt, S.towEnd - 0.3, S.towEnd)), mayaW: M,
      x: M.x + SIDE.x, y: M.y + SIDE.y, dir: turnTo(Math.PI / 2, Math.PI, towK), tube: { x: M.x, y: M.y + 58, len: 92, rot: 0 } };
  }
  const ctx = {
    // No. 6: a crouch, "Help!", arms flung up, flailing; then bobbing and slapping the water; his brother jumps at the
    // shout and turns to him. After the answer, his same "Help!" again, flailing; then the water he throws at his brother
    // flies, and they both laugh.
    boy(wt) {
      const flail = Math.max(win(wt, T.help - 0.12, T.help + 0.12, T.help + 1.1, T.help + 1.5), win(wt, S.boyR - 0.12, S.boyR + 0.1, S.boyRe + 0.05, S.boyRe + 0.3));
      const face = Math.max(win(wt, T.help - 0.3, T.help + 0.15, T.help + 1.1, T.help + 1.6), win(wt, S.boyR - 0.3, S.boyR + 0.1, S.boyRe + 0.05, S.boyRe + 0.35));
      const th = (wt - (S.throw - 0.38)) / 1.0;                       // the water leaves his hand at S.throw
      return { flail, face, help: T.help, throwK: th > 0 && th < 1 ? th : 0,
        laugh: win(wt, S.throw + 0.0, S.throw + 0.45, S.throw + 2.75, S.throw + 3.35), broLaugh: win(wt, S.throw + 0.2, S.throw + 0.6, S.throw + 2.85, S.throw + 3.45),
        flinch: win(wt, S.throw + 0.08, S.throw + 0.2, S.throw + 1.95, S.throw + 2.55),
        broStartle: win(wt, T.help + 0.05, T.help + 0.14, T.help + 0.45, T.help + 0.95), broTurn: win(wt, T.help + 0.1, T.help + 0.45, T.help + 2.3, T.help + 2.9) };
    },
    waving(wt) {
      const W1 = T.wave + 3.18;                                          // his second wave in the search
      const a = win(wt, T.wave - 0.2, T.wave + 0.15, T.wave + 3.0, T.wave + 3.4), b = win(wt, S.manR - 0.2, S.manR + 0.15, S.manR + 2.2, S.manR + 2.6);
      const e = win(wt, W1, W1 + 0.25, W1 + 1.1, W1 + 1.4);
      return { k: Math.max(a, b, e), t0: wt < W1 - 0.6 ? T.wave - 0.2 : wt < W1 + 1.9 ? W1 - 0.2 : S.manR - 0.2 };
    },
    boatWave(wt) { return win(wt, S.boatW - 0.15, S.boatW + 0.15, S.boatW + 2.4, S.boatW + 2.8); },
    lifeguard, maya, friend,
    // No. 7: after the answer she stops her chatting gestures; on her friend's third call she turns to look
    bystander(n, wt) { return n === 7 ? { quiet: ramp(wt, S.reveal, S.reveal + 0.5), look: LOOK(566, 640, MAYA.x, MAYA.y), k: ramp(wt, S.c05 - 0.05, S.c05 + 0.45) } : null; },
    sets: [[12.6, 15.8]],
  };

  // ------------------------------------------------------------------ the camera (film time)
  // Moves stay slow enough not to strobe; long jumps are cuts (two keys a millisecond apart). After "Time." every story
  // beat is framed close enough to read on a phone (about 3x).
  function camAt(cx, cy, s) { return { s, x: -s * (cx - W / 2), y: -s * (cy - H / 2) }; }
  const CUT1 = T.boyR - 0.2, CUT2 = T.manR - 0.2, CUT2B = T.manRe + 0.05, CUT3 = T.found - 0.12, CUT4 = T.lg - 0.12, CUT5 = T.jumpF + 0.13;
  const BX = 280 + 13 * S.boatW - 30;                 // the boat, where it is when the towel swings (beach.js: x = 280 + 13 t)
  const K = [
    [0, 540, 960, 1.0],
    [drowning, 540, 960, 1.0],
    [drowning + 0.7, 548, 952, 1.02],                // a breath in on "drowning"
    [T.ring0 + 6.0, 548, 952, 1.02],
    [T.ring0 + 7.5, 560, 900, 1.04],                 // one wide drift while she's up; every tag stays inside x 950
    [T.ring0 + 8.5, 540, 960, 1.0],                  // back before she slips under
    [T.reveal, 540, 960, 1.0],                       // the freeze holds the whole beach
    [T.reveal + 2.5, 330, 704, 4.4],                 // "It's number nine…": in on her, centred, close (2.5 s: no judder)
    [CUT1, 330, 704, 4.4],
    [CUT1 + 0.001, 831, 1210, 3.4],                  // cut: the boys alone, close: his same "Help!", the water thrown, the laugh
    [CUT2, 831, 1210, 3.4],
    [CUT2 + 0.001, 838, 930, 2.4],                   // cut: the man, waving: his same "Hey! Over here!"
    [CUT2B, 838, 930, 2.4],
    [CUT2B + 0.001, BX + 12, 240, 3.6],              // cut: the boat far out, a striped towel swung back
    [CUT3, BX + 20, 240, 3.6],
    [CUT3 + 0.001, 470, 820, 2.3],                   // cut: "Maya's friends are right there…": the three of them, inside x 950
    [CUT4, 464, 814, 2.36],                          // (a slow push while it's said)
    [CUT4 + 0.001, 172, 1480, 3.6],                  // cut: "But the lifeguard has.": on her chair, close (no one else in it)
    [CUT5, 172, 1480, 3.6],
    [CUT5 + 0.001, 470, 820, 2.3],                   // cut: her friends, stopped by the whistle
    [T.c05e + 0.2, 480, 830, 2.45],                  // a slow push through her three calls
  ];
  function camera(t) {
    if (t >= T.rewind0) return camAt(540, 960, 1.0);  // the replay: the first frame's full view
    let [cx, cy, s] = keys(t, K);
    // the race: frame the lifeguard and Maya together, close; then settle on the rescue and follow the tow
    if (t > T.c05e + 0.2) {
      const wt = W0(t);
      const L = lifeguard(wt), mh = maya(wt) || { dx: 0, dy: 0 };
      const mx = MAYA.x + mh.dx, my = MAYA.y + mh.dy, lx = L.x ?? 178, ly = L.y ?? 1452;
      const d = Math.hypot(lx - mx, ly - my);
      const rc = [(lx + mx) / 2, (ly + my) / 2 + 110, clamp(1800 / (d + 480), 2.2, 2.8)];
      const end = [mx - 20, my + 110, 3.0];                // the pair large, framed low so the floater, No. 2, stays out
      const k = ramp(t, T.c05e + 0.2, T.c05e + 1.6), k2 = ramp(t, T.reachF - 0.6, T.reachF + 0.5);
      [cx, cy, s] = [0, 1, 2].map((j) => lerp(lerp([cx, cy, s][j], rc[j], k), end[j], k2));
    }
    return camAt(cx, cy, s);
  }

  // ------------------------------------------------------------------ the tags and the frame-0 line (film time): paper
  // lifted off by hand and carried out of the frame, never faded; carried back in and set down at the end of the rewind
  const LIFT_ORDER = [14, 2, 1, 12, 5, 10, 8, 3, 16, 7, 13, 4, 11, 6, 15];
  const setDown = (t) => (t < T.rewind0 ? 0 : t >= R ? 1 : ramp(t, R - 0.75, R - 0.05));
  function tagLift(t) {
    const back = setDown(t);
    return (n) => {
      let off;
      if (n === 9) off = clamp((t - (T.found + 0.05)) / 1.05);               // her number gives way to her name ("Maya's friends…")
      else { const t0 = T.ring1 + 0.05 + 0.02 * LIFT_ORDER.indexOf(n); off = clamp((t - t0) / 0.88); }   // one after another, gone by 18.1 s
      return t >= T.rewind0 ? 1 - back : off;
    };
  }
  const uiLift = (t) => (t >= T.rewind0 ? 1 - setDown(t) : clamp((t - (T.ring1 + 0.3)) / 0.9));
  const ringLift = (t) => (t >= T.rewind0 ? 1 - setDown(t) : clamp((t - (T.ring1 + 0.05)) / 0.8));   // it goes with its last piece
  function label(g, t, k) {
    if (k >= 0.999) return;
    const x0 = 64, y0 = 290, w = 684, h = 86;
    const tile = label.tile || (label.tile = P.fibreTile(256, 77, 0.8));
    const up = ease(clamp(k / 0.25)), cc = clamp((k - 0.25) / 0.75), away = cc * cc;
    g.save();
    g.translate(x0 + w / 2 - 120 * away, y0 + h / 2 - 24 * up - 560 * away); g.rotate(-0.05 * up - 0.18 * away);
    g.scale(1 + 0.06 * up, 1 + 0.06 * up); g.translate(-(x0 + w / 2), -(y0 + h / 2));
    const pts = []; for (let i = 0; i <= 24; i++) pts.push([lerp(x0, x0 + w, i / 24), y0 + h / 2 + 1.5 * Math.sin(i * 0.9)]);
    P.strip(g, pts, h, 61, 0.05); P.fill(g, '#fffdf7', { lift: 6 + 24 * up });
    P.strip(g, pts, h, 61, 0.05); P.grain(g, tile, 0.5, true);
    g.fillStyle = B.COL.navy; g.font = '700 condensed 66px Bahn'; g.fontStretch = 'condensed';
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('ONE OF THEM IS DROWNING.', x0 + 24, y0 + h / 2 + 4);
    g.restore();
  }
  // the clock: a paper lifebuoy torn into 15 pieces, one a second, each scrap flicking off and out of the frame; the
  // last goes at 15 s, and the world freezes. Halfway it thumps; near the end what's left turns red and trembles.
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
    const gap = 15 / (N - 1), tornAt = (i) => (replay ? Infinity : T.ring0 + i * gap);   // the first on "fifteen", the last at 15 s
    const last = Math.floor((tt - T.ring0) / gap + 1e-6);
    const jolt = !replay && last >= 0 && last < N ? 2.5 * Math.max(0, 1 - (tt - tornAt(last)) / 0.2) : 0;
    const half = replay ? 0 : win(tt, T.half - 0.05, T.half + 0.07, T.half + 0.17, T.half + 0.5);    // halfway: a thump
    const hurry = replay ? 0 : ramp(tt, T.last - 0.1, T.last + 0.15) * (1 - ramp(tt, T.ring1 - 0.05, T.ring1 + 0.05));
    const tremble = hurry * (Math.floor(tt * 15) % 2 ? 1 : -1) * 0.03;                                  // the last seconds
    const col = hurry > 0.5 ? '#e5352a' : B.COL.coral;
    const up = ease(clamp(k / 0.25)), cc = clamp((k - 0.25) / 0.75), away = cc * cc;
    g.save();
    g.translate(cx + 160 * away, cy - jolt - 24 * up - 520 * away); g.rotate(0.08 * up + 0.3 * away + tremble + 0.1 * half);
    const sc = (1 + 0.08 * up) * (1 + 0.16 * half); g.scale(sc, sc); g.translate(-cx, -cy);
    P.blob(g, cx, cy, R2 + 8, R2 + 8, 0, 71, 0.02); P.fill(g, '#fffdf7', { lift: 6 + 24 * up });
    g.beginPath(); g.arc(cx, cy, R2, 0, TAU); g.arc(cx, cy, r, 0, TAU, true); g.fillStyle = 'rgba(27,42,68,0.12)'; g.fill();
    for (let i = 0; i < N; i++) {
      const a0 = -Math.PI / 2 + (i / N) * TAU, a1 = -Math.PI / 2 + ((i + 1) / N) * TAU;
      const u = (tt - tornAt(i)) / 0.65;
      if (u < 0) { chunkPath(g, cx, cy, R2, r, a0, a1, 300 + i); P.fill(g, col, { lift: 3 }); }
      else if (u < 1) {                                  // the scrap flies off, up and to the right, out of the frame
        const am = (a0 + a1) / 2, rm = (R2 + r) / 2 + 30 * u;
        g.save();
        g.translate(cx + Math.cos(am) * rm + 420 * u * u, cy + Math.sin(am) * rm - 40 * u - 520 * u * u);
        g.rotate((i % 2 ? 1 : -1) * 3.2 * u);
        chunkPath(g, -Math.cos(am) * (R2 + r) / 2, -Math.sin(am) * (R2 + r) / 2, R2, r, a0, a1, 300 + i);
        P.fill(g, B.COL.coral, { lift: 3 + 16 * u });
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
      if (t >= T.rewind0 && t < R) {
        // back to the start: the last picture is lifted off like a sheet of paper and carried away, and underneath is
        // the first frame, the line and the ring and every tag in place (no fast rewind: it strobed and teleported)
        B.paint(g, 0, { ctx, cam: camAt(540, 960, 1.0), tags: () => 0 });
        label(g, R, 0); ring(g, R, 0);
        const off = S2.off || (S2.off = Object.assign(document.createElement('canvas'), { width: W, height: H }));
        const o = off.getContext('2d');
        o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H);
        B.paint(o, W0(T.rewind0), { ctx, cam: camera(T.rewind0 - 0.001), tags: tagLift(T.rewind0 - 0.001) });
        o.restore();
        const u = (t - T.rewind0) / (R - T.rewind0), up = ease(clamp(u / 0.3)), away = ease(clamp((u - 0.3) / 0.7));
        g.save();
        g.translate(W / 2 - 1250 * away, H / 2 - 520 * away); g.rotate(-0.28 * away - 0.02 * up);
        g.scale(1 + 0.045 * up, 1 + 0.045 * up); g.translate(-W / 2, -H / 2);
        g.shadowColor = 'rgba(16, 34, 52, 0.45)'; g.shadowBlur = 8 + 26 * up; g.shadowOffsetX = 16 * up; g.shadowOffsetY = 24 * up;
        g.drawImage(off, 0, 0);
        g.shadowColor = 'transparent';
        g.strokeStyle = 'rgba(255, 252, 240, 0.85)'; g.lineWidth = 5; g.strokeRect(2.5, 2.5, W - 5, H - 5);   // the sheet's cut edge
        g.restore();
      } else {
        B.paint(g, worldTime(t), { ctx, cam: camera(t), tags: tagLift(t) });
        label(g, t, uiLift(t)); ring(g, t, ringLift(t));
      }
      g.restore();
    },
  });

  // every reel ends with the Root Cause end card ('end' → 'done', 3.0 s, engine/endcard)
  U.endcard();
  C.start();
})();
