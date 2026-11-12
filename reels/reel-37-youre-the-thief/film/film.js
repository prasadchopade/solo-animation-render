// Reel 37 · You're the Thief (working title). Tests desk, an episode of "You're the test subject", built round Season 1's thief.
// You're him for one take: the maroon cap's brim over your eyes, a glass of chai in your hand, the golden lane in front of the
// stall. Four men walk up it, numbered: the same height, the same bag, the same phone. Pick who you rob. They pass you one at a
// time, then walk away in a row while a clock runs. Same bag, same phone: so what did you go by? Take everything else away (the
// lab's point-light walkers) and you still know which one's yours: you picked a walk. Men in prison for assault picked walks
// like number three's, and number three is only tired. Then the view leaves his head: the real thief stops, looks back over
// his shoulder at you, and his eye is frame 0 again. No end card: the film is a loop (the user's one-off exception, 13 Nov 2026).
// Facts: docs/research.md. The rig and the lane are this reel's own (rig.js, world.js). Our own drawings; nobody real. 30 fps.
(() => {
  const { W, H, scene, canvas, clamp, lerp, el, mulberry32 } = C;
  const R = window.RIG, WD = window.WORLD, K = window.KIT;
  const { hit, clear } = K, { sstep, mix, TAU, PI, wrap } = R;
  C.fonts = ['700 condensed 100px Bahn', '700 semi-condensed 46px Bahn', '600 semi-condensed 64px Bahn', '400 30px Mono', '700 30px Mono'];
  const INK = '#14130f', RED = '#e2301a', YEL = '#ffd34a', CREAM = '#fff6e2', NIGHT = '#0b0e1a';
  const NA = C.noise1(3711), NB = C.noise1(3712), NC = C.noise1(3713);
  const ease = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const seg = (a, b, t) => ease((t - a) / (b - a));

  // ------------------------------------------------------------------ canvas helpers (the series' own, from reels 20–34)
  const font = (size, kind = 'cond') => (kind === 'cond' ? `700 condensed ${size}px Bahn` : kind === 'semi' ? `700 semi-condensed ${size}px Bahn` : kind === 'mono' ? `700 ${size}px Mono` : `400 ${size}px Mono`);
  function txt(g, s, x, y, size, color = INK, o = {}) {
    g.save();
    g.font = font(size, o.kind || 'cond'); g.fillStyle = color; g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic';
    g.globalAlpha *= o.a ?? 1;
    if ('letterSpacing' in g) g.letterSpacing = (o.ls ?? 0) + 'px';
    if (o.fit) { const w = g.measureText(s).width; if (w > o.fit) { size *= o.fit / w; g.font = font(size, o.kind || 'cond'); } }
    if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
    if (o.stroke) { g.lineJoin = 'round'; g.strokeStyle = o.stroke; g.lineWidth = size * (o.sw ?? 0.12); g.strokeText(s, x, y); }
    g.fillText(s, x, y);
    g.restore();
  }
  const RR = (g, x, y, w, h, r = 0) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
  const lg = WD.lg, rg = WD.rg;
  const offscreen = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const BUFS = []; const buf = (i) => BUFS[i] || (BUFS[i] = offscreen(W, H));
  const fresh = (c) => { const q = c.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalAlpha = 1; q.globalCompositeOperation = 'source-over'; q.filter = 'none'; q.clearRect(0, 0, W, H); return q; };
  const DRY = offscreen(4, 4).getContext('2d');      // somewhere to "draw" a figure when only its measurements are wanted
  const pop = (t, t0) => clamp(hit(t, t0, 'heavy'));
  function title(g, s, y, size, color, t, t0, o = {}) {            // a caption that lands with a small spring
    if (t < t0) return;
    const q = pop(t, t0);
    g.save(); g.translate(o.x ?? 515, y); g.scale(lerp(0.86, 1, q), lerp(0.86, 1, q));
    txt(g, s, 0, 0, size, color, { align: 'center', fit: o.fit ?? 860, stroke: o.stroke ?? INK, sw: o.sw ?? 0.14, a: clamp((t - t0) * 8) * (o.a ?? 1) });
    g.restore();
  }
  function tileNo(g, x, y, n, s = 72, a = 1) { if (a <= 0.003) return; g.save(); g.globalAlpha *= a; RR(g, x - s / 2, y - s / 2, s, s, s * 0.14); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = Math.max(2, s * 0.07); g.stroke(); txt(g, String(n), x, y + s * 0.3, s * 0.82, '#fff9ea', { kind: 'mono', align: 'center' }); g.restore(); }
  function ring(g, x, y, r, k, lw = 11, col = YEL) {
    if (k <= 0) return;
    g.save(); g.strokeStyle = INK; g.lineWidth = lw + 8; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r, -PI / 2, -PI / 2 + TAU * k); g.stroke();
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(x, y, r, -PI / 2, -PI / 2 + TAU * k); g.stroke(); g.restore();
  }
  function vignette(g, k = 1) { g.fillStyle = rg(g, 540, 900, 560, 1250, [0, 'rgba(40,16,10,0)'], [1, `rgba(40,16,10,${(0.34 * k).toFixed(3)})`]); g.fillRect(0, 0, W, H); }
  const flashAt = (t, t0) => { const d = t - t0; return d < 0 ? 0 : Math.exp(-d * 11) * 0.9; };
  // motion blur, drawn in, for the whip pans only: the frame as the average of n moments across most of a frame
  function blurred(g, t, n, fn, shutter = 0.85) {
    if (n <= 1) return fn(g, t);
    const acc = fresh(buf(1)), tmp = buf(2); let out;
    for (let i = 0; i < n; i++) {
      const b = fresh(tmp); out = fn(b, t + ((i + 0.5) / n - 0.5) * shutter / 30);
      acc.globalAlpha = 1 / (i + 1); acc.drawImage(tmp, 0, 0);
    }
    g.drawImage(buf(1), 0, 0);
    return out;
  }

  // ------------------------------------------------------------------ the cast
  // Four men of about thirty: one skin, one height, one build, the same short-sleeved shirt in four colours, the same grey backpack,
  // the same phone in the same back pocket. They differ in their hair and in how they walk, and in nothing else (research.md).
  const SKIN = { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983' }, SAME = { bag: '#8f959c', phone: '#ece8df' };
  const LOOKS = [
    { ...SKIN, ...SAME, hair: '#17110d', style: 'part', shirt: '#5a9be6', leg: '#2b3140', shoe: '#5a3a26', sole: '#e9e2d2' },
    { ...SKIN, ...SAME, hair: '#15100c', style: 'curly', shirt: '#f2766a', leg: '#3a3f4b', shoe: '#f1ede4', sole: '#ffffff' },
    { ...SKIN, ...SAME, hair: '#17110d', style: 'short', shirt: '#b59be8', leg: '#34313c', shoe: '#2c2622', sole: '#d8d0c0' },
    { ...SKIN, ...SAME, hair: '#15100c', style: 'buzz', shirt: '#f4cb4f', leg: '#27304a', shoe: '#1d1712', sole: '#cfc7b6' },
  ];
  // ONE strides: long steps, heel to toe, the whole body in it. TWO bounces: springy knees, loose arms, his head bobbing. THREE trudges:
  // short slow steps, feet lifted and put down flat, arms hanging, his head a little down (the studies' "easy" profile, and a tired
  // man's). FOUR hurries: quick small steps, leaning into it, elbows up.
  const STYLES = [
    R.style({ stride: 1.38, cad: 1.00, duty: 0.60, roll: 1, stepH: 0.05, pelYaw: 0.14, pelRoll: 0.05, sway: 0.02, chestYaw: 0.17, arm: 0.5, elbow: 0.2, elbowDyn: 0.45, lean: 0.06, headStab: 0.9 }),
    R.style({ stride: 1.20, cad: 1.04, duty: 0.58, roll: 1, toeK: 1.12, heelOff: 0.5, stepH: 0.075, dip: 0.04, pelYaw: 0.12, pelRoll: 0.07, sway: 0.03, chestYaw: 0.15, arm: 0.46, elbow: 0.45, elbowDyn: 0.5, lean: 0.03, nod: 0.05, headStab: 0.5, ph0: 0.3 }),
    R.style({ stride: 0.90, cad: 0.88, duty: 0.68, roll: 0.12, heelOff: 0.22, stepH: 0.105, stepW: 0.10, hipMax: 0.835, pelYaw: 0.02, pelRoll: 0.015, sway: 0.03, chestYaw: 0.0, arm: 0.06, elbow: 0.1, elbowDyn: 0.05, lean: 0.11, slump: 1, headPitch: 0.24, headFwd: 0.05, ph0: 0.55 }),
    R.style({ stride: 1.00, cad: 1.36, duty: 0.60, roll: 0.6, stepH: 0.04, pelYaw: 0.06, pelRoll: 0.03, sway: 0.012, chestYaw: 0.09, arm: 0.5, armBias: -0.08, elbow: 0.9, elbowDyn: 0.32, ab: 0.14, lean: 0.14, shrug: 0.02, headFwd: 0.04, ph0: 0.8 }),
  ];
  const FACES = [{ smile: 0.25 }, { smile: 0.7, browY: 0.03 }, { lid: 0.75, smile: -0.35, browTilt: -0.05 }, { browTilt: 0.07, smile: -0.15 }];
  const V = STYLES.map((s) => s.stride * s.cad);   // metres a second: 1.38, 1.25, 0.79, 1.36
  // Season 1's thief (reels 20–35): the maroon cap, the mole on his left cheek, the thin moustache, stubble, the green shirt.
  const THIEF = { skin: '#b27a54', skinD: '#8a583a', skinH: '#cf9a72', hair: '#15100c', style: 'short', cap: true, capTurn: 0.38, must: 0.075, stub: 0.6, brow: 0.085, browTilt: 0.05, ew: 0.23, eh: 0.118, mole: [0.47, -0.42], shirt: '#37a18a', leg: '#20262f', shoe: '#121212', sole: '#3a3a3a' };
  const PROWL = R.style({ stride: 1.0, cad: 0.792, duty: 0.63, roll: 0.9, stepH: 0.045, pelYaw: 0.08, pelRoll: 0.04, sway: 0.02, chestYaw: 0.1, arm: 0.3, elbow: 0.25, elbowDyn: 0.3, lean: 0.04, headStab: 0.92 });

  // ------------------------------------------------------------------ timing (the narration's words set it once there's a voice; until then, a plan)
  const TT = (() => {
    const T = { w1a: 2.45, w1b: 2.80, cross: [3.30, 4.55, 5.95, 7.25], w2a: 7.95, w2b: 8.35, clock0: 10.3, clock1: 13.3,
      bag: 13.75, phone: 14.65, dots0: 16.9, dots1: 18.6, picked: 22.1, three: 28.0, back0: 29.3, back1: 30.6, rub0: 32.4, rub1: 35.6,
      pull0: 35.8, pull1: 37.7, stop0: 38.0, stop1: 38.7, turn0: 38.5, turn1: 39.8, push0: 41.2, END: C.DUR };
    T.m1 = (T.w1a + T.w1b) / 2; T.m2 = (T.w2a + T.w2b) / 2; T.F = T.clock1;
    return T;
  })();

  // ------------------------------------------------------------------ where everyone is
  const EYE = [-1.5, 1.18, 0];                       // his seat at the stall: the lane's shaded side
  const XA = [1.25, 0.55, -0.15, -0.85], ZA0 = [-11.0, -11.6, -10.6, -11.9];   // coming up the lane at you (number one on your left)
  const XB = [0.60, 0.50, 0.45, 0.65];                                            // crossing in front of the stall, one at a time
  const XC = [-1.05, -0.35, 0.35, 1.05], ZC0 = [6.2, 6.2, 7.4, 6.2];             // walking away in a row
  const ZF = ZC0.map((z, i) => z + V[i] * (TT.F - TT.m2));                         // where the clock stops them
  const SG = [[-0.86, 2.08], [0.80, 2.08], [-0.86, 0], [0.80, 0]], SGZ = 12;     // the dark stage: two rows of two, side on
  const worldClock = (t) => (t < TT.back0 ? Math.min(t, TT.F) : t - (TT.back0 - TT.F));   // the lane stops with the clock, and starts again when it comes back
  const AHEAD = [13, 11, 0, 12];                     // how far on the others have got by the time the lane comes back
  const trackOf = (i) => (t) => {
    if (t < TT.m1) return { x: XA[i], z: ZA0[i] + V[i] * t, h: 0, tg: t };
    if (t < TT.m2) return { x: XB[i], z: V[i] * (t - TT.cross[i]), h: 0, tg: t };
    if (t < TT.dots0) { const tw = worldClock(t); return { x: XC[i], z: ZC0[i] + V[i] * (tw - TT.m2), h: 0, tg: tw }; }
    const tg = TT.F + Math.max(0, t - TT.dots0 - 0.1);                        // they start walking again as the lane goes dark
    const lane = (tt) => ({ x: XC[i], z: ZF[i] + AHEAD[i] + V[i] * (tt - TT.back0), y: 0, h: 0 });
    if (t < TT.back0 || (i !== 2 && t < TT.back1)) { const u = seg(TT.dots0, TT.dots1, t); return { x: lerp(XC[i], SG[i][0], u), z: lerp(ZF[i], SGZ, u), y: SG[i][1] * u, h: (PI / 2) * u, tg }; }
    if (i !== 2) return { ...lane(t), tg };
    const u = seg(TT.back0, TT.back1, t), L = lane(t);                           // number three walks out of the dark, back into the lane
    const rub = seg(TT.rub0, TT.rub0 + 0.7, t) * (1 - seg(TT.rub1 - 0.7, TT.rub1, t));
    return { x: lerp(SG[i][0], L.x, u), z: lerp(SGZ, L.z, u), y: SG[i][1] * (1 - u), h: (PI / 2) * (1 - u), tg,
      pose: rub > 0.001 ? { arms: { r: { wrist: [-0.085, 0.215, -0.025], pole: [-0.25, 0.25, -1], w: rub } }, headPitch: -0.2 * rub + 0.05 * rub * Math.sin(t * 2.2), headTilt: 0.1 * rub * Math.sin(t * 1.7), shrug: 0.025 * rub } : null };
  };
  const MEN = [0, 1, 2, 3].map((i) => ({ i, S: STYLES[i], look: LOOKS[i], track: trackOf(i), face: FACES[i] }));
  // the thief on his feet: 3.2 m behind number three and to his right. He stops, and turns to look back over his left shoulder
  // at you: his face comes round into the frame, the mole on the cheek towards you.
  const z3 = (t) => ZF[2] + V[2] * (t - TT.back0), TX = XC[2] + 0.75;
  const thiefTrack = (t) => {
    const d = TT.stop1 - TT.stop0, tau = clamp(t - TT.stop0, 0, d), zs = z3(Math.min(t, TT.stop0)) - 3.2 + V[2] * (tau - tau * tau / (2 * d));
    const walk = 1 - tau / d, tn = seg(TT.turn0 + 0.15, TT.turn1, t), hd = seg(TT.turn0, TT.turn0 + 0.8, t), hold = seg(TT.turn1 - 0.1, TT.push0 + 0.5, t);
    return { x: TX, z: zs, h: -1.2 * tn - 0.12 * hold, tg: Math.min(t, TT.stop0 + d * 0.5),
      pose: { walk, twist: -0.45 * seg(TT.turn0 + 0.1, TT.turn1 - 0.1, t) - 0.08 * hold, headYaw: -1.0 * hd - 0.3 * hold, headTilt: -0.05 * hd, headPitch: 0.05 * hd, shrug: 0.01 * hd }, hd, hold };
  };
  const THF = { i: 9, S: PROWL, look: THIEF, track: thiefTrack };
  const thiefFace = (t) => { const tr = thiefTrack(t), k = tr.hd, bk = Math.floor((t + 0.37) / 2.9), bu = (t + 0.37) - bk * 2.9, blink = t > TT.push0 - 0.2 ? 0 : bu < 0.07 ? bu / 0.07 : bu < 0.16 ? 1 - (bu - 0.07) / 0.09 : 0;
    return { look: [0.035 * k * (1 - tr.hold), -0.004], smile: 0.1 + 0.3 * tr.hold, smirk: 0.45 * k + 0.5 * tr.hold, browUp: 0.05 * tr.hold, lid: 0.25, close: blink }; };
  function jointWorld(M, t, name) { const tr = M.track(t), J = R.skel(M.S, tr.tg, tr.pose || {}), p = J[name], sh = Math.sin(tr.h), ch = Math.cos(tr.h); return [tr.x + sh * p[0] - ch * p[2], p[1] + (tr.y || 0), tr.z + ch * p[0] + sh * p[2]]; }

  // ------------------------------------------------------------------ the market: people far up and down the lane, soft, never near the four
  // None of them is in the four's colours, in a cap or with a backpack; none comes within about ten metres of you.
  const XLOOK = [
    { skin: '#b57d58', skinD: '#8c5a3a', skinH: '#cc9a74', hair: '#1a1410', style: 'short', long: true, kurta: true, shirt: '#e77fa8', leg: '#f3e6d8', shoe: '#8a3a2a', sole: '#8a3a2a' },
    { skin: '#c48a5c', skinD: '#9a6640', skinH: '#d9a47a', hair: '#1a1410', style: 'short', bun: true, kurta: true, shirt: '#4a6fd8', leg: '#f6efe2', shoe: '#5a3a2a', sole: '#5a3a2a' },
    { skin: '#a8714d', skinD: '#80522f', skinH: '#c08a64', hair: '#120d0a', style: 'short', shirt: '#f1ede4', leg: '#4b4f5a', shoe: '#2b2420', sole: '#2b2420' },
    { skin: '#bd8a64', skinD: '#946243', skinH: '#d8a983', hair: '#17110d', style: 'buzz', shirt: '#a8683c', leg: '#2f3442', shoe: '#e8e6e0', sole: '#e8e6e0' },
    { skin: '#c99068', skinD: '#a06a46', skinH: '#ddb08c', hair: '#1a1410', style: 'short', long: true, kurta: true, shirt: '#7a59b8', leg: '#d9d4c8', shoe: '#3a2b20', sole: '#3a2b20' },
    { skin: '#b57d58', skinD: '#8c5a3a', skinH: '#cc9a74', hair: '#17110d', style: 'curly', shirt: '#d2462f', leg: '#3a3f4b', shoe: '#f0ece4', sole: '#f0ece4' },
    { skin: '#a8714d', skinD: '#80522f', skinH: '#c08a64', hair: '#8a8580', style: 'short', bun: true, kurta: true, shirt: '#e05a6f', leg: '#f3e6d8', shoe: '#5a3a2a', sole: '#5a3a2a' },
    { skin: '#c48a5c', skinD: '#9a6640', skinH: '#d9a47a', hair: '#17110d', style: 'short', shirt: '#2f3f6e', leg: '#4b4f5a', shoe: '#2b2420', sole: '#2b2420' },
  ];
  const EXTRAS = (() => {
    const r = mulberry32(3737), out = [];
    const add = (o) => out.push({ i: 100 + out.length, S: R.style({ stride: 1.05 + r() * 0.3, cad: 0.9 + r() * 0.16, arm: 0.28 + r() * 0.2, chestYaw: 0.08 + r() * 0.06, ph0: r() }), look: XLOOK[out.length % XLOOK.length], ...o });
    // up the lane behind the four as they come (he's looking that way only at the start)
    for (let k = 0; k < 7; k++) { const x = -1.7 + r() * 3.4, z0 = -27 - r() * 17, dir = r() > 0.45 ? 1 : -1, kid = k === 4; add({ lo: -9, hi: TT.m1, x, z0, dir, kid, stand: k === 2 || k === 6 }); }
    // down the lane ahead of them: some walking on, some stopped at a shop
    for (let k = 0; k < 9; k++) { const stand = k % 3 === 0, x = stand ? (r() > 0.5 ? 1 : -1) * (1.55 + r() * 0.35) : -1.6 + r() * 3.2, z0 = stand ? 27 + r() * 18 : 21 + r() * 16; add({ lo: TT.m2 - 0.4, hi: 999, x, z0, dir: stand ? 0 : (k === 1 || k === 5 ? -1 : 1), stand, kid: k === 7 }); }
    for (const e of out) {
      const v = e.S.stride * e.S.cad * (e.kid ? 0.72 : 1);
      e.track = (t) => {
        const tw = worldClock(t), z = e.z0 + (e.stand ? 0 : e.dir * v * (tw - Math.max(0, e.lo)));
        return { x: e.x, z: Math.min(z, 47.2), h: e.stand ? (e.x > 0 ? PI / 2 : -PI / 2) : e.dir > 0 ? 0 : PI, tg: tw, scale: e.kid ? 0.7 : 1, pose: e.stand ? { walk: 0 } : null };
      };
      e.on = (t) => t >= e.lo && t < e.hi && !(e.dir < 0 && e.lo > 0 && t >= TT.dots0) && e.track(t).z < 46.8;   // the ones coming this way are gone by the time the lane comes back
    }
    return out;
  })();

  // ------------------------------------------------------------------ the camera
  const mixc = (a, b, u) => { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], u); return o; };
  const DOTCAM = { x: 0, y: 1.9, z: SGZ - 26, yaw: 0, pitch: 0, roll: 0, f: 6500, cx: 515, cy: 1005 };
  function camPOV(t) {
    const A = (tt) => {                               // looking up the lane at the four of them (a long lens: his eyes have settled on them)
      let gx = 0, gz = 0; for (let i = 0; i < 4; i++) { gx += XA[i] / 4; gz += (ZA0[i] + V[i] * tt) / 4; }
      return { x: EYE[0], y: EYE[1], z: EYE[2], yaw: Math.atan2(gx - EYE[0], gz - EYE[2]) + 0.004 * NA(tt * 0.5), pitch: 0.002 * NB(tt * 0.5), roll: 0.003 * NC(tt * 0.4), f: lerp(3400, 2850, clamp(tt / TT.w1a)), cx: 515, cy: 865 };
    };
    const B = (tt) => {                               // across the lane: each man crosses in front of him, and his eyes go with each a little
      let s = 0, w = 0; for (let i = 0; i < 4; i++) { const z = V[i] * (tt - TT.cross[i]), k = Math.exp(-((z / 1.0) ** 2)); s += k * Math.atan(z / 2.05); w += k; }
      return { x: EYE[0], y: EYE[1], z: EYE[2], yaw: PI / 2 - 0.42 * s / Math.max(0.7, w), pitch: 0.002 * NB(tt * 0.5), roll: 0.003 * NC(tt * 0.4), f: 1080, cx: 540, cy: 880 };
    };
    const Cc = (tt) => {                              // he's on his feet and after them: the four from behind, walking into the sun
      const tw = Math.min(tt, TT.F), u = tw - TT.m2, hold = tt - tw;
      return { x: -0.3 + 0.02 * Math.sin(u * PI * 1.9), y: 1.56 + 0.022 * Math.sin(u * TAU * 1.9) * (hold > 0 ? Math.exp(-hold * 6) : 1), z: 0.3 + 1.1 * u, yaw: 0.02 + 0.006 * NA(tt * 0.5), pitch: 0.002 * NB(tt * 0.5), roll: 0.004 * NC(tt * 0.4), f: 2050 * (1 + 0.05 * sstep(TT.F, TT.F + 1.4, tt)), cx: 528, cy: 770 };
    };
    if (t < TT.w1a) return A(t);
    if (t < TT.w1b) return mixc(A(t), B(t), seg(TT.w1a, TT.w1b, t));
    if (t < TT.w2a) return B(t);
    if (t < TT.w2b) return mixc(B(t), Cc(t), seg(TT.w2a, TT.w2b, t));
    return Cc(t);
  }
  const pullU = (t) => 1 - Math.pow(1 - clamp((t - TT.pull0) / (TT.pull1 - TT.pull0)), 2.4);   // out fast, settling
  const PULL = (t) => lerp(-0.1, 1.34, pullU(t));       // how far behind his eyes the view is
  function camEnd(t) {                                // his eyes again, on number three's back; then out of his head, and behind him
    const tr = thiefTrack(t), hj = jointWorld(THF, Math.min(t, TT.stop0), 'head');
    const u = pullU(t), bd = PULL(t), hz = hj[2] + (tr.z - thiefTrack(Math.min(t, TT.stop0)).z);
    const px = lerp(hj[0], tr.x, u * 0.8) - 0.24 * u, py = lerp(hj[1] + 0.02, 1.62, u * 0.8) + 0.03 * u, pz = lerp(hz, tr.z, u * 0.8) - bd;
    const push = seg(TT.turn1, TT.push0, t);
    return { x: px, y: py, z: pz + 0.06 * push, yaw: lerp(Math.atan2(XC[2] - TX, 3.2), 0.035, u) + 0.004 * NA(t * 0.5), pitch: 0.002 * NB(t * 0.5), roll: 0.004 * NC(t * 0.4), f: 1400 * (1 + 0.05 * push), cx: 540, cy: lerp(800, 770, u) };
  }
  function camAt(t) {
    if (t < TT.dots0) return camPOV(t);
    if (t < TT.back0) return mixc(camPOV(TT.dots0), DOTCAM, seg(TT.dots0, TT.dots1, t));
    if (t < TT.back1) {                               // back down to the lane: the view swings in behind number three, and keeps him in the middle
      const u = seg(TT.back0, TT.back1, t), c = mixc(DOTCAM, camEnd(t), u), tr = MEN[2].track(t);
      const aim = Math.atan2(tr.x - c.x, tr.z - c.z), k = Math.sin(PI * u);
      c.yaw = lerp(c.yaw, aim, k); c.f = Math.exp(lerp(Math.log(DOTCAM.f), Math.log(camEnd(t).f), u));
      return c;
    }
    return camEnd(t);
  }

  // ------------------------------------------------------------------ the lane with everyone in it
  // o.dof: how soft the lane is behind the people; o.bg: a canvas filter for the lane (the far wall, close up, is loud);
  // o.cast: who's in it; o.alpha(m): how solid each is; o.dark: 0–1, the lane gone dark
  function drawLane(g, t, o = {}) {
    const cam = R.camera(o.cam || camAt(t)), tw = worldClock(t), dark = o.dark || 0;
    const cast = (o.cast || MEN).map((m) => { const tr = m.track(t), q = cam.toCam(tr.x, 0.9 + (tr.y || 0), tr.z); return { m, z: q[2], a: o.alpha ? o.alpha(m) : 1 }; }).filter((a) => a.z > (a.m === THF ? 0.13 : 0.3) && a.a > 0.003).sort((a, b) => b.z - a.z);
    const filt = [o.dof > 0.3 ? `blur(${o.dof.toFixed(2)}px)` : '', o.bg || ''].join(' ').trim();
    if (dark < 0.999) {
      const gb = filt ? fresh(buf(0)) : g;
      WD.world(gb, cam, tw);
      const far = EXTRAS.filter((e) => e.on(t)).map((e) => { const tr = e.track(t), q = cam.toCam(tr.x, 0.9, tr.z); return { e, z: q[2] }; }).filter((a) => a.z > 9).sort((a, b) => b.z - a.z);
      for (const a of far) R.shadow(gb, cam, a.e, t, { a: 0.2 });
      for (const a of cast) if (!(a.m.track(t).y > 0.01)) R.shadow(gb, cam, a.m, t, { a: 0.26 * a.a });
      for (const a of far) R.figure(gb, cam, a.e, t, {});
      if (filt) { g.save(); g.filter = filt; g.drawImage(buf(0), 0, 0); g.restore(); }
    }
    if (dark > 0) { g.fillStyle = R.rgba(NIGHT, dark); g.fillRect(-4000, -4000, 9000, 9000); }
    const F = {};
    for (const a of cast) {
      const face = a.m === THF ? thiefFace(t) : a.m.face, fo = { face, ...(o.fig ? o.fig(a.m) : {}) };
      if (a.a < 0.999 || fo.blur > 0.4) {               // faint or soft: drawn whole into a buffer first, so his limbs don't show through each other
        F[a.m.i] = R.figure(fresh(buf(4)), cam, a.m, t, fo);
        g.save(); g.globalAlpha *= a.a; if (fo.blur > 0.4) g.filter = `blur(${fo.blur.toFixed(1)}px)`; g.drawImage(buf(4), 0, 0); g.restore();
      } else F[a.m.i] = R.figure(g, cam, a.m, t, fo);
    }
    if (dark < 0.999 && !o.noLight) { g.save(); g.globalAlpha *= 1 - dark; WD.light(g, cam, tw); g.restore(); }
    return { cam, F };
  }

  // ------------------------------------------------------------------ you: the cap's brim, your hand, your chai (reel 20's glass and hand)
  function glass(g, x, y, s, rot, a = 1) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= a;
    g.fillStyle = 'rgba(245,240,230,0.28)'; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.lineTo(72, 130); g.lineTo(-72, 130); g.closePath(); g.fill();
    g.save(); g.beginPath(); g.moveTo(-90, -74); g.lineTo(90, -74); g.lineTo(70, 124); g.lineTo(-70, 124); g.closePath(); g.clip();
    g.fillStyle = lg(g, -90, -74, 90, 124, [0, '#d08a3e'], [1, '#8d4f1c']); g.fillRect(-100, -80, 200, 210);
    g.fillStyle = 'rgba(255,235,200,0.28)'; g.fillRect(-90, -74, 180, 14);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 4; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 27, -120); g.lineTo(i * 20, 128); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.stroke();
    g.restore();
  }
  function chaiHand(g, x, y, s, rot) {              // his right hand as he sees it: the arm from the lower right, the fingers round the glass, the thumb in front
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = lg(g, 110, 110, 520, 720, [0, '#c08a62'], [1, '#8a583a']);
    g.beginPath(); g.moveTo(92, 110); g.bezierCurveTo(100, 66, 190, 40, 226, 84); g.lineTo(660, 680); g.lineTo(340, 860); g.closePath(); g.fill();
    g.fillStyle = lg(g, -130, -40, 110, 110, [0, '#b98058'], [1, '#99643f']);
    for (let i = 0; i < 4; i++) { RR(g, -122 + i * 4, -48 + i * 42, 240, 38, 19); g.fill(); }
    ell(g, 128, 34, 84, 104); g.fillStyle = lg(g, 60, -60, 200, 130, [0, '#cb966f'], [1, '#a46c48']); g.fill();
    glass(g, 0, 0, 1, 0);
    g.save(); g.translate(150, 16); g.rotate(PI + 0.2);
    RR(g, 0, -27, 176, 54, 27); g.fillStyle = lg(g, 0, -27, 0, 27, [0, '#d4a07a'], [1, '#b47e58']); g.fill();
    g.strokeStyle = 'rgba(90,50,30,0.35)'; g.lineWidth = 2.5; g.stroke();
    RR(g, 138, -17, 32, 34, 12); g.fillStyle = '#e8c8b0'; g.fill();
    g.restore();
    g.restore();
  }
  function steam(g, x, y, t, a = 0.5, s = 1) {
    g.save(); g.strokeStyle = `rgba(255,255,255,${a * 0.5})`; g.lineWidth = 12 * s; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const ph = t * 1.1 + k * 2.1; g.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, px = x + ((k - 1) * 34 + Math.sin(ph + u * 5) * 18 * u) * s, py = y - u * 200 * s; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.globalAlpha = 0.5; g.stroke(); }
    g.restore();
  }
  function brim(g, t, k = 1) {                       // the underside of the maroon cap's brim, across the top of what he sees
    if (k <= 0) return;
    const dy = (k > 1 ? 1950 * (k - 1) : -300 * (1 - k)) + 5 * NA(t * 0.6), tilt = 0.012 * NB(t * 0.5);
    g.save(); g.translate(540, dy); g.rotate(tilt);
    if (k > 1) { g.fillStyle = '#2a0a10'; g.fillRect(-900, -2300, 1800, 2230); }
    g.beginPath(); g.moveTo(-700, -80); g.lineTo(700, -80); g.lineTo(700, 96); g.bezierCurveTo(420, 176, 180, 214, 0, 216); g.bezierCurveTo(-180, 214, -420, 176, -700, 96); g.closePath();
    g.fillStyle = lg(g, 0, -40, 0, 216, [0, '#2a0a10'], [0.7, '#4a111b'], [1, '#6a1c28']); g.fill();
    g.strokeStyle = 'rgba(163,43,61,0.9)'; g.lineWidth = 9; g.beginPath(); g.moveTo(-700, 96); g.bezierCurveTo(-420, 176, -180, 214, 0, 216); g.bezierCurveTo(180, 214, 420, 176, 700, 96); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3; g.setLineDash([18, 12]); g.beginPath(); g.moveTo(-700, 70); g.bezierCurveTo(-420, 150, -180, 188, 0, 190); g.bezierCurveTo(180, 188, 420, 150, 700, 70); g.stroke(); g.setLineDash([]);
    g.fillStyle = lg(g, 0, 190, 0, 330, [0, 'rgba(40,10,14,0.34)'], [1, 'rgba(40,10,14,0)']); g.fillRect(-700, 150, 1400, 190);
    g.restore();
  }
  function hands(g, t) {                             // the glass in his hand, low in the frame; it goes down as he turns to watch them cross
    const dn = sstep(TT.w1a - 0.1, TT.w1b + 0.1, t), gone = sstep(TT.w2a - 0.15, TT.w2a + 0.2, t);
    if (gone >= 1) return;
    const x = lerp(790, 860, dn) + 6 * NA(t * 0.7), y = lerp(1500, 1690, dn) + 700 * gone + 5 * NB(t * 0.8);
    g.save(); steam(g, x - 10, y - 150, t, 0.42); chaiHand(g, x, y, 1.18, -0.06 + 0.02 * NC(t * 0.6)); g.restore();
  }

  // ------------------------------------------------------------------ 1 · his eyes: the four come up the lane, cross in front of him, and walk away while the clock runs
  const tileAt = (f) => { const hd = f.P.head, s = hd[2]; return [hd[0], hd[1] - 0.30 * s, s]; };
  function shotPOV(g, t) {
    const whip = (t > TT.w1a - 0.02 && t < TT.w1b + 0.02) || (t > TT.w2a - 0.02 && t < TT.w2b + 0.02), fz = sstep(TT.F, TT.F + 0.35, t);
    const look = (tt) => (tt < TT.w1a ? { dof: 3 } : tt < TT.w1b ? {} : tt < TT.w2a ? { dof: 9, bg: 'saturate(0.55) brightness(1.03)' } : tt < TT.w2b ? {} : { dof: 2.2 + 3.3 * fz, bg: fz > 0.01 ? `saturate(${(1 - 0.55 * fz).toFixed(3)}) brightness(${(1 - 0.1 * fz).toFixed(3)})` : '' });
    const { cam, F } = blurred(g, t, whip ? 14 : 1, (gg, tt) => drawLane(gg, tt, look(tt)));
    vignette(g, 0.9);
    // numbers over their heads
    for (const m of MEN) {
      const f = F[m.i]; if (!f) continue;
      const [x, y, s] = tileAt(f);
      let size = clamp(0.2 * s, 64, 118), a = whip ? 0 : 1, q = 1;
      if (t >= TT.m1 && t < TT.m2) { size = 112; q = pop(t, TT.cross[m.i] - 0.95); a *= clamp((x + 30) / 60) * clamp((1110 - x) / 60); }
      else if (t >= TT.m2) q = pop(t, TT.w2b + 0.05 + m.i * 0.1);
      g.save(); g.translate(x, Math.max(y, 330)); g.scale(lerp(0.6, 1, q), lerp(0.6, 1, q)); tileNo(g, 0, 0, m.i + 1, size, a * clamp(q * 3)); g.restore();
    }
    const up = sstep(TT.dots0 - 0.2, TT.dots0 + 0.5, t);                      // the cap goes as the view leaves the street
    brim(g, t, 1 - up);
    hands(g, t);
    // frame 0: the role, big, out with the first line
    const out = sstep(TT.w1a - 0.45, TT.w1a - 0.2, t);
    if (out < 1) { g.save(); g.globalAlpha = 1 - out; txt(g, "YOU'RE THE", 515, 400, 104, CREAM, { align: 'center', stroke: INK, sw: 0.14 }); txt(g, 'THIEF', 515, 590, 230, YEL, { align: 'center', fit: 860, stroke: INK, sw: 0.12 }); g.restore(); }
    if (t >= TT.clock0 - 0.6 && t < TT.F) {
      title(g, 'WHICH ONE?', 1330, 128, CREAM, t, TT.clock0 - 0.6, { stroke: INK, sw: 0.12 });
      const left = Math.min(Math.ceil(TT.clock1 - TT.clock0), Math.max(0, Math.ceil(TT.clock1 - t - 1e-3)));
      g.save(); g.translate(515, 1440); RR(g, -110, -44, 220, 88, 12); g.fillStyle = '#121212'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
      txt(g, '00:0' + left, 0, 27, 68, left <= 1 ? '#ff4a30' : '#ffb347', { kind: 'mono', align: 'center' }); g.restore();
    }
    if (t >= TT.F) {
      // the same bag, four times; then the same phone, four times
      const kb = sstep(TT.bag - 0.05, TT.bag + 0.3, t) * (1 - sstep(TT.phone - 0.25, TT.phone - 0.05, t)), kp = sstep(TT.phone - 0.05, TT.phone + 0.3, t) * (1 - sstep(TT.dots0 - 0.3, TT.dots0, t));
      for (const m of MEN) { const f = F[m.i]; if (!f) continue; if (kb > 0 && f.bagC) ring(g, f.bagC[0], f.bagC[1], Math.max(f.bagC[2], f.bagC[3]) * 1.12, kb, 9); if (kp > 0 && f.phoneC) ring(g, f.phoneC[0], f.phoneC[1], f.phoneC[2] * 1.5, kp, 8); }
      if (t < TT.phone - 0.1) title(g, 'SAME BAG', 1330, 150, YEL, t, TT.bag - 0.04, { stroke: INK, sw: 0.12 });
      else if (t < TT.dots0) title(g, 'SAME PHONE', 1330, 150, YEL, t, TT.phone - 0.04, { stroke: INK, sw: 0.12 });
      const fl = flashAt(t, TT.F) * 0.3; if (fl > 0.003) { g.fillStyle = `rgba(255,253,244,${fl.toFixed(3)})`; g.fillRect(0, 0, W, H); }
    }
  }

  // ------------------------------------------------------------------ 2 · everything else taken away: four walks, in dots
  function shotDots(g, t) {
    const inn = seg(TT.dots0, TT.dots1, t), back = seg(TT.back0, TT.back1, t);
    const dark = sstep(TT.dots0, TT.dots0 + 0.9, t) * (1 - sstep(TT.back0 + 0.15, TT.back1, t));
    const body = (m) => (t < TT.back0 ? 1 - sstep(TT.dots0 + 0.3, TT.dots0 + 1.05, t) : m.i === 2 ? sstep(TT.back0 + 0.25, TT.back0 + 0.95, t) : 0);
    const dim = sstep(TT.three - 0.15, TT.three + 0.35, t);
    const dota = (m) => sstep(TT.dots0 + 0.2, TT.dots0 + 0.95, t) * (m.i === 2 ? 1 - sstep(TT.back0 + 0.45, TT.back0 + 1.05, t) : (1 - 0.8 * dim) * (1 - sstep(TT.back0, TT.back0 + 0.5, t)));
    const { cam, F } = drawLane(g, t, { dark, alpha: body, dof: 2.2 + 3.3 * (1 - back), bg: back < 1 && dark < 0.999 ? 'saturate(0.6)' : '' });
    // the stage: a line of ground under each row, a soft pool of light
    if (dark > 0.02) {
      g.save(); g.globalAlpha = dark * (1 - back);
      g.fillStyle = rg(g, 515, 1000, 80, 900, [0, 'rgba(60,70,120,0.22)'], [1, 'rgba(60,70,120,0)']); g.fillRect(0, 0, W, H);
      for (const yy of [0, 2.08]) { const a = cam.P(-2.4, yy, SGZ), b = cam.P(2.4, yy, SGZ); if (!a || !b) continue; g.strokeStyle = 'rgba(255,231,168,0.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(a[0], a[1] + 4); g.lineTo(b[0], b[1] + 4); g.stroke(); }
      g.restore();
    }
    const DF = {};
    for (const m of MEN) { const a = dota(m); if (a > 0.003) DF[m.i] = R.dots(g, cam, m, t, { alpha: a, r: 0.034, trail: 2 }); }
    // their numbers stay with them
    for (const m of MEN) {
      const f = DF[m.i] || F[m.i]; if (!f) continue;
      const [x, y, s] = tileAt(f), side = inn * (1 - (m.i === 2 ? back : 0));
      const a = m.i === 2 ? 1 - sstep(TT.back1 - 0.6, TT.back1 - 0.1, t) : (1 - 0.6 * dim) * (1 - sstep(TT.back0, TT.back0 + 0.5, t));
      tileNo(g, lerp(x, x - 0.62 * s, side), lerp(y, f.P.head[1], side), m.i + 1, lerp(clamp(0.2 * s, 64, 118), 78, side), a);
      if (m.i === 2) ring(g, lerp(x, x - 0.62 * s, side), f.P.head[1], 62, sstep(TT.three - 0.05, TT.three + 0.4, t) * (1 - sstep(TT.back0, TT.back0 + 0.4, t)), 9);
    }
    if (t >= TT.picked - 0.04 && t < TT.back0 + 0.3) { const a = 1 - sstep(TT.back0 - 0.1, TT.back0 + 0.3, t); title(g, 'YOU PICKED', 372, 96, CREAM, t, TT.picked - 0.04, { stroke: INK, sw: 0.14, a }); title(g, 'A WALK', 500, 150, YEL, t, TT.picked + 0.18, { stroke: INK, sw: 0.12, a }); }
    vignette(g, 0.9 * (1 - dark));
    if (t > TT.back0) brim(g, t, sstep(TT.back0 + 0.55, TT.back1, t));          // his eyes again
  }

  // ------------------------------------------------------------------ 3 · behind number three; then out of the thief's head, and he looks back at you
  const CASTE = [...MEN, THF];
  function shotEnd(g, t, o = {}) {
    const bd = PULL(t), u = pullU(t);
    const alpha = (m) => (m === THF ? (bd > 0.24 ? 1 : 0) : 1);
    const fig = (m) => (m === THF ? { blur: 18 * (1 - sstep(0.24, 1.0, bd)), near: true } : {});
    const r = drawLane(g, t, { cast: CASTE, alpha, fig, dof: lerp(2.2, 3.4, u), ...o });
    if (!o.plain) {
      vignette(g, 0.95);
      // the cap comes down over his eyes, and what's left is the back of it, going away from you
      const dn = sstep(TT.pull0 - 0.04, TT.pull0 + 0.16, t), lift = sstep(0.26, 0.52, bd);
      if (lift < 1) { g.save(); g.globalAlpha = 1 - lift; brim(g, t, 1 + dn); g.restore(); }
    }
    return r;
  }
  // The eye, close: drawn for this shot, to the same measurements as the rig's eye, so the one can take over from the other.
  // (ax, ay): the iris' centre; r: its radius on screen; E: the rig's numbers for this eye (head units), wf: how far it's turned.
  function macroEye(g, ax, ay, r, E, a, t) {
    if (a <= 0.003) return;
    const u = r / 0.098, wf = E.wf, cx = ax - E.ix * u * wf, cy = ay + E.iy * u, ew = E.ew * u * wf, up = E.up * u, dn = E.dn * u, k = E.k;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = lg(g, 0, cy - 5 * r, 0, cy + 6 * r, [0, '#7d4f33'], [0.3, '#a9714c'], [0.6, '#b27a54'], [1, '#96623f']); g.fillRect(0, 0, W, H);
    g.fillStyle = rg(g, cx, cy - 0.5 * r, r, 5.5 * r, [0, 'rgba(60,26,14,0.34)'], [1, 'rgba(60,26,14,0)']); g.fillRect(0, 0, W, H);          // the socket's shade
    g.strokeStyle = '#15100c'; g.lineWidth = 0.86 * r; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - k * 2.7 * r * wf, cy - 2.25 * r); g.quadraticCurveTo(cx + k * 0.4 * r, cy - 3.5 * r, cx + k * 3.3 * r * wf, cy - 2.75 * r); g.stroke();   // his brow
    g.fillStyle = lg(g, 0, cy - 7 * r, 0, cy - 2.6 * r, [0, 'rgba(40,10,6,0.6)'], [1, 'rgba(40,10,6,0)']); g.fillRect(0, 0, W, cy - 2.6 * r);     // the cap's shade
    const shape = () => { g.beginPath(); g.moveTo(cx - ew, cy + 0.16 * r); g.quadraticCurveTo(cx - k * 0.03 * u, cy - up, cx + ew, cy + 0.16 * r); g.quadraticCurveTo(cx + k * 0.03 * u, cy + dn, cx - ew, cy + 0.16 * r); g.closePath(); };
    g.strokeStyle = 'rgba(70,32,18,0.5)'; g.lineWidth = 0.12 * r; g.beginPath(); g.moveTo(cx - ew * 0.96, cy - 0.3 * r); g.quadraticCurveTo(cx, cy - up - 0.75 * r, cx + ew * 1.02, cy - 0.2 * r); g.stroke();   // the crease of the lid
    g.save(); shape(); g.fillStyle = '#f7f1e4'; g.fill(); shape(); g.clip();
    g.fillStyle = rg(g, cx, cy, ew * 0.5, ew * 1.1, [0, 'rgba(120,70,50,0)'], [1, 'rgba(120,70,50,0.35)']); g.fillRect(cx - ew * 1.2, cy - up * 1.2, ew * 2.4, (up + dn) * 1.4);
    // the iris: brown, with its fibres, a dark rim, the pupil
    g.fillStyle = rg(g, ax, ay, r * 0.2, r, [0, '#6b4526'], [0.62, '#4f3421'], [0.9, '#2e1c10'], [1, '#1c1109']); ell(g, ax, ay, r * wf, r); g.fill();
    const rr = mulberry32(3771); g.lineCap = 'butt';
    for (let i = 0; i < 90; i++) { const an = i / 90 * TAU + rr() * 0.05, r0 = r * (0.5 + rr() * 0.1), r1 = r * (0.8 + rr() * 0.17); g.strokeStyle = rr() > 0.5 ? `rgba(160,110,60,${(0.1 + rr() * 0.22).toFixed(3)})` : `rgba(30,16,8,${(0.1 + rr() * 0.2).toFixed(3)})`; g.lineWidth = r * (0.012 + rr() * 0.02); g.beginPath(); g.moveTo(ax + Math.cos(an) * r0 * wf, ay + Math.sin(an) * r0); g.lineTo(ax + Math.cos(an) * r1 * wf, ay + Math.sin(an) * r1); g.stroke(); }
    g.fillStyle = '#060404'; ell(g, ax, ay, r * 0.52 * wf, r * 0.52); g.fill();
    g.fillStyle = lg(g, 0, cy - up, 0, cy - up * 0.2, [0, 'rgba(30,14,8,0.5)'], [1, 'rgba(30,14,8,0)']); g.fillRect(cx - ew * 1.2, cy - up * 1.2, ew * 2.4, up * 1.1);       // the lid's shadow on the eye
    g.restore();
    g.strokeStyle = '#1a0f0a'; g.lineWidth = 0.38 * r; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - ew, cy + 0.16 * r); g.quadraticCurveTo(cx - k * 0.03 * u, cy - up, cx + ew, cy + 0.16 * r); g.stroke();   // the lash line
    g.strokeStyle = 'rgba(60,28,16,0.45)'; g.lineWidth = 0.1 * r; g.beginPath(); g.moveTo(cx - ew * 0.86, cy + 0.26 * r); g.quadraticCurveTo(cx + k * 0.03 * u, cy + dn + 0.2 * r, cx + ew * 0.86, cy + 0.26 * r); g.stroke();
    g.restore();
  }
  // 4 · into his eye, and what's in it is frame 0
  function shotPush(g, t) {
    const cam = R.camera(camAt(t)), face = thiefFace(t);
    const dry = R.figure(DRY, cam, THF, t, { face });
    const e = ((dry && dry.eyes) || []).slice().sort((a, b) => b.nz - a.nz)[0] || { x: 600, y: 640, r: 14, wf: 1, k: 1 };
    const u = clamp((t - TT.push0) / (TT.END - TT.push0)), win0 = 0.49 * e.r, kEnd = 1190 / win0, k = Math.exp(Math.log(kEnd) * Math.pow(u, 1.5));
    const ax = lerp(e.x, 540, sstep(0, 0.55, u)), ay = lerp(e.y, 900, sstep(0, 0.55, u)), mk = sstep(4.5, 9, k);
    if (mk < 1) {
      g.save(); g.translate(ax, ay); g.scale(k, k); g.translate(-e.x, -e.y);
      shotEnd(g, t, { plain: true, noLight: true });
      g.restore();
      const la = 1 - sstep(1.3, 3.5, k); if (la > 0.003) { g.save(); g.globalAlpha = la; WD.light(g, cam, worldClock(t)); g.restore(); }
      vignette(g, 0.95);
    }
    // the rig's own numbers for this eye, so the close drawing sits exactly on it
    const sn = Math.sin(dry ? dry.psiH : -0.5), cl = Math.max(face.close || 0, (face.lid || 0) * 0.55), eh = THIEF.eh;
    const E = { wf: lerp(e.wf, 1, sstep(8, 40, k)), ix: face.look[0] + sn * 0.05, iy: 0.016 + face.look[1], ew: THIEF.ew, up: eh * 1.75 * (1 - cl), dn: eh * 1.05 * (1 - cl * 0.72), k: e.k };
    macroEye(g, ax, ay, e.r * k, E, mk, t);
    // the pupil is a window: his eyes, at the stall, a moment before frame 0
    const rp = win0 * k, a = sstep(20, 70, rp);
    if (a > 0.003) {
      const win = fresh(buf(3)); win.save(); shotPOV(win, t - TT.END); win.restore();
      g.save(); g.beginPath(); g.ellipse(ax, ay, rp * E.wf, rp, 0, 0, TAU); g.clip(); g.globalAlpha = a; g.drawImage(buf(3), 0, 0);
      g.globalAlpha = 1; g.fillStyle = rg(g, ax, ay, rp * 0.7, rp, [0, 'rgba(8,5,4,0)'], [1, `rgba(8,5,4,${(0.9 * (1 - sstep(650, 1150, rp))).toFixed(3)})`]); g.fillRect(0, 0, W, H);
      g.restore();
    }
    const cl2 = 1 - sstep(60, 260, rp);                // the light on his eye, until the window takes over
    if (cl2 > 0.003 && mk > 0) { g.save(); g.globalAlpha = mk * cl2; g.fillStyle = '#fffdf6'; ell(g, ax - 0.36 * e.r * k, ay - 0.46 * e.r * k, 0.15 * e.r * k, 0.1 * e.r * k, -0.5); g.fill(); g.restore(); }
  }

  // ================================================================ the film
  if (!window.TL.lab) {
    scene({
      name: 'film', from: 'hook', to: 'end',
      build(root, S) { S.g = canvas(root); },
      run(t, b, S) {
        const g = S.g; clear(g);
        g.save();
        if (t < TT.dots0) shotPOV(g, t);
        else if (t < TT.back1) shotDots(g, t);
        else if (t < TT.push0) shotEnd(g, t);
        else shotPush(g, t);
        g.restore();
      },
    });
    scene({
      name: 'fx', from: 'hook', to: 'end',
      build(root, S) { const cv = el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:0.05` }, root); S.g = cv.getContext('2d'); S.tiles = K.grainTiles(); },
      run(t, b, S) {
        const f = Math.round(t * 30), r = mulberry32(1000 + f), g = S.g; clear(g);
        const pat = g.createPattern(S.tiles[f % 4], 'repeat'), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
        g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256);
      },
    });
  } else {
    // LAB (timeline.json "lab": true): the four walks and the thief on the spot, from the side, the front and behind
    const mk = (i, h, x, y) => ({ i, S: i < 4 ? STYLES[i] : PROWL, look: i < 4 ? LOOKS[i] : THIEF, face: FACES[i] || { smirk: 0.6, smile: 0.2 }, track: (t) => ({ x, z: 0, h: h + (window.TL.labspin ? t * 0.9 : 0), y, tg: t }) });
    const ROWS = [[PI / 2, 3.78], [window.TL.lab34 ? PI - 0.75 : PI, 1.89], [0, 0]], ALL = [], who = window.TL.labthief ? [4, 4, 4, 4] : [0, 1, 2, 3];
    ROWS.forEach(([h, y]) => { for (let i = 0; i < 4; i++) ALL.push(mk(who[i], h + (window.TL.labthief ? i * 0.5 : 0), -1.14 + i * 0.76, y)); });
    scene({
      name: 'lab', from: 'hook', to: 'end',
      build(root, S) { S.g = canvas(root); },
      run(t, b, S) {
        const g = S.g; clear(g); g.fillStyle = '#f3e6cf'; g.fillRect(0, 0, W, H);
        const cam = R.camera({ x: 0, y: 2.78, z: -30, yaw: 0, pitch: 0, f: 9900, cx: 540, cy: 960 }), lt = { x: 0.6, back: 0, front: 0.4 };
        for (const [, y] of ROWS) { const a = cam.P(-2, y, 0), bb = cam.P(2, y, 0); g.strokeStyle = 'rgba(80,60,40,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(bb[0], bb[1]); g.stroke(); }
        for (const w of ALL) R.figure(g, cam, w, t, { light: lt, face: w.face });
        if (window.TL.labdots) { g.fillStyle = 'rgba(12,14,24,0.86)'; g.fillRect(0, 0, W, H); for (const w of ALL) R.dots(g, cam, w, t); }
      },
    });
  }
  C.start();
})();
