// Reel 47 Close Your Eyes: the picture, in the neon look (engine/neon47) with the case file (engine/casefile.js).
// Every shot is timed from the placed voices (film/words.js, from place_vo.py + plan_vo.py) and each voice's loudness
// and pitch line (film/env.js, from env.py). A pure function of t: any frame paints the same in any order. Drawings,
// characters and the camera are held on twos (LAB.held); only a tube's light may change on single frames, as a real
// sign's does.
//
// Shots: 1 the cash machine (POV: his whisper, your PIN, the cash, his gloved hand) · 2 the line-up behind frosted
// glass · 3 the twist: his voice, big, on a monitor; it flatlines on "never"; one green sound still moves · 4 the two
// replays, each word lit as it's said with its wave under it · 5 cut on "four": the glass clears on four · 6 the why:
// five pitch lines and his flat whisper; the hiss in each, and his slides up onto four's · 7 the endings: four in a
// cell; then the man you picked in one, four walking out · 8 the dare: a friend with an earbud; the SH, kept from her ·
// 9 the case file (engine/casefile.js) · the end card.
// Motion test 4 (23 Nov) answers the third fresh review: "hiss" for "the S" (heard as "ass"); a silence before the
// answer, and the answer as a picture (cut on "four" to the line-up, held 2 s); the twist and the why given motion and
// a picture; the line-up's idle three times bigger, with one step into the light for whoever speaks; frame 0's game line
// and SOUND ON at 54 px, a keypad, a card and a finger; a stopwatch, not a ring; the endings' legs and feet; the key
// object is the SH, and it comes from above, not from the friend's phone.
(() => {
  const { W, H, rnd, rs, clamp, lerp, E, held, frameOf } = LAB;
  const NE = window.NEON, CF = window.CASEFILE;
  const deg = Math.PI / 180, TAU = Math.PI * 2;

  // ---------------------------------------------------------------- the clock, from the placed words
  const WD = {};
  for (const w of window.WORDS || []) (WD[w.p] = WD[w.p] || []).push(w);
  const P = (id) => { const ws = WD[id]; if (!ws) throw new Error(`no placed words for ${id}`); return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, w: ws }; };
  const word = (id, i) => WD[id][Math.min(i, WD[id].length - 1)];
  const wordOf = (id, re) => { const w = (WD[id] || []).find((x) => re.test(x.w)); if (!w) throw new Error(`no word ${re} in ${id}`); return w; };
  const END = C.bt('end');
  const ENV = window.ENV || {};
  const envAt = (id, t, key = 'rms') => { const e = ENV[id]; if (!e) return 0; const i = Math.floor((t - e.t0) * 30); return i >= 0 && i < e[key].length ? e[key][i] : 0; };
  const T = {
    turn: word('W1', 1).t0,                    // "turn": the frame snaps back
    pin: P('W2').t0 + 0.5,                     // your PIN, as he tells you where to look
    cash: P('W2').t1 + 0.15,                   // the notes come out
    grab: P('W2').t1 + 0.55,                   // his hand
    lineup: P('N02').t0 - 0.10,                // cut on "Close your eyes"
    charged: wordOf('N03B', /charged/i).t0,    // "Whoever you pick is charged tonight."
    bar0: P('N09').t1 + 0.05, bar1: P('N09').t1 + 2.05,
    twist: P('N10').t0 - 0.2,                  // "I told you to remember his voice.": the line-up goes dark
    remember: wordOf('N10', /^remember/i).t0, his: wordOf('N10', /^his/i).t0, voiceW: wordOf('N10', /^voice/i).t0,
    never: word('N11', 1).t0 - 0.05,           // "He never let you hear it.": it flatlines
    came: wordOf('N13', /^came/i).t0,          // "But one thing came through."
    listen: P('N13B').t0,                      // "Listen."
    replay: P('RW').t0 - 0.2,                  // the replays
    hearS: wordOf('N14', /^hiss/i).t0,         // "Hear the hiss?" then a silence
    four: wordOf('N15', /^four/i).t0,          // "It's number four."
    answer: wordOf('N15', /^four/i).t0 - 0.03, // cut on "four" to four, lit, in the line-up
    why: P('N12').t0 - 0.15,                   // "He whispered, and a whisper has no pitch, because your vocal cords don't vibrate."
    whispered: word('N12', 1).t0, no: wordOf('N12', /^no\b/i).t0, pitch: wordOf('N12', /^pitch/i).t0,
    cords: wordOf('N12', /^cords/i).t0, vib1: wordOf('N12', /^vibrate/i).t1,
    s: wordOf('N16', /^hiss/i).t0,             // "That hiss never uses your vocal cords, so a whisper barely changes it."
    barely: wordOf('N16', /^barely/i).t0,
    end1: P('N17').t0 - 0.25, picked: wordOf('N17', /^picked/i).t0, four1: wordOf('N17', /^four/i).t0, caught: wordOf('N17', /^caught/i).t0,
    end2: P('N18').t0 - 0.15, didnt: wordOf('N18', /^didn/i).t0, walks: wordOf('N18', /^walks/i).t0, jail: wordOf('N18', /^jail/i).t0, nobody: wordOf('N18', /^nobody/i).t0,
    dare: P('N19').t0 - 0.25, friend: wordOf('N19', /^friend/i).t0, sWord: wordOf('N20', /^hiss/i).t0,
  };
  const SPEAK = [1, 2, 3, 4, 5].map((k) => ({ k, n: P(`N0${k + 3}`), v: P(`L${k}`) }));   // "One." + his line, ...

  // ---------------------------------------------------------------- helpers
  const rr = (x0, y0, x1, y1, r, n = 5) => {          // a rounded rectangle, closed
    const pts = [];
    const arc = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (Math.PI / 2) * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(x1 - r, y0 + r, -Math.PI / 2); arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, Math.PI / 2); arc(x0 + r, y0 + r, Math.PI);
    return pts;
  };
  const circ = (cx, cy, r, n = 28, a0 = 0, a1 = TAU) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const mj = (x) => { x = clamp(x); return x * x * x * (10 - 15 * x + 6 * x * x); };   // minimum jerk
  const lit = (t, t0) => (t < t0 ? 0 : NE.on(t, t0));                                // a tube catching at t0
  const outAt = (t, t1) => (t < t1 ? 1 : NE.off(t, t1));                             // a tube going out at t1
  const offFlick = (t, t1) => (t < t1 ? 1 : NE.flick(t, t1, [0.55, 0.55, 0.12, 0.12, 0.4, 0.4, 0]));   // a sign cut out: two dips, then dark
  const dark = 0.03;                                                                 // unlit glass, still visible
  const MAROON = '#8e1b3a';                                                          // his cap, in a tube
  // neon lettering for words: no painted-out glass between the letters (it reads as stray lines at phone size)
  const tx = (Sg, str, cx, top, h, col, k, o = {}) => Sg.text(str, cx, top, h, col, k, { block: false, ...o });
  function camM(c) {
    const cx = W / 2, cy = H / 2, a = c.s * Math.cos(c.r), b = c.s * Math.sin(c.r);
    return [a, b, -b, a, cx + c.x - (a * cx - b * cy), cy + c.y - (b * cx + a * cy)];
  }
  const SCR = {};
  const scratch = (key = 'a') => {
    let c = SCR[key]; if (!c) { c = SCR[key] = document.createElement('canvas'); c.width = W; c.height = H; }
    const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    return { c, g };
  };
  // frosted glass: soft, low mottling (fine per-pixel grain shimmered as the camera moved)
  const frost = () => LAB.tex('frost47b', W, H, (g) => {
    const w = 216, h = 384, sm = document.createElement('canvas'); sm.width = w; sm.height = h;
    const sg = sm.getContext('2d'), im = sg.createImageData(w, h), d = im.data, R = C.mulberry32(4747);
    for (let i = 0; i < w * h; i++) { const v = 200 + R() * 55; d[i * 4] = v; d[i * 4 + 1] = v + 6; d[i * 4 + 2] = v + 18; d[i * 4 + 3] = 20 + R() * 30; }
    sg.putImageData(im, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.filter = 'blur(3px)'; g.drawImage(sm, 0, 0, W, H); g.filter = 'none';
  });
  // the hooded head and shoulders (him, in the glass), as a path at scale s with its top at (cx, top)
  function hoodPath(g, cx, top, s = 1) {
    g.beginPath();
    g.moveTo(cx - 100 * s, top + 262 * s); g.bezierCurveTo(cx - 118 * s, top + 132 * s, cx - 90 * s, top + 32 * s, cx, top);
    g.bezierCurveTo(cx + 82 * s, top + 22 * s, cx + 110 * s, top + 122 * s, cx + 98 * s, top + 262 * s);
    g.quadraticCurveTo(cx + 190 * s, top + 280 * s, cx + 210 * s, top + 392 * s); g.lineTo(cx - 212 * s, top + 392 * s);
    g.quadraticCurveTo(cx - 192 * s, top + 280 * s, cx - 100 * s, top + 262 * s); g.closePath();
  }
  // the line-up's man, standing, feet at (cx, foot): the same build as behind the glass, with legs and feet. o.walk 0..3
  // (a stride in four drawings), o.slump (0..1), o.look (-1..1: his head turned), o.idle (time: his weight shifts from
  // foot to foot and he breathes; o.ph sets where in that he is)
  function manPts(cx, foot, s, o = {}) {
    const st = o.walk == null ? 0 : [1, 0, -1, 0][o.walk % 4], bob = (o.walk != null && o.walk % 2 === 1 ? -8 : 0) * s;
    const ph = o.ph || 0, it = o.idle;
    const sway = it == null ? 0 : 8 * s * Math.sin(it * TAU / 4.6 + ph) + 3 * s * Math.sin(it * TAU / 2.3 + ph * 1.9);
    const br = it == null ? 0 : 5 * s * Math.sin(it * TAU / 3.3 + ph * 1.3);
    const sl = (o.slump || 0) * 26 * s, y = (v) => foot + (v + bob / s) * s, up = (v) => y(v) - br;
    const hx = cx + sway;                                                                 // the hips and everything above
    return {
      head: { x: hx + (o.look || 0) * 10 * s, y: up(-570) + sl, rx: 46 * s, ry: 56 * s, tilt: (o.look || 0) * 10 * deg + (o.slump || 0) * 14 * deg },
      body: [[hx - 74 * s, y(-236)], [hx - 72 * s, up(-430) + sl * 0.6], [hx - 30 * s, up(-476) + sl], [hx + 30 * s, up(-476) + sl], [hx + 72 * s, up(-430) + sl * 0.6], [hx + 74 * s, y(-236)]],
      legL: [[hx - 40 * s, y(-236)], [cx - 40 * s + st * 30 * s, y(0)]], legR: [[hx + 40 * s, y(-236)], [cx + 40 * s - st * 30 * s, y(0)]],
      neck: [hx - 17 * s, up(-524) + sl, 34 * s, 50 * s], s,
    };
  }
  function manFill(g, m) {
    g.fillStyle = 'rgba(6,5,12,0.98)';
    g.save(); g.translate(m.head.x, m.head.y); g.rotate(m.head.tilt); g.beginPath(); g.ellipse(0, 0, m.head.rx, m.head.ry, 0, 0, TAU); g.fill(); g.restore();
    g.fillRect(...m.neck);
    g.beginPath(); g.moveTo(...m.body[0]); for (const p of m.body.slice(1)) g.lineTo(...p); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(6,5,12,0.98)'; g.lineCap = 'round'; g.lineWidth = 52 * m.s;
    for (const L of [m.legL, m.legR]) { g.beginPath(); g.moveTo(...L[0]); g.lineTo(...L[1]); g.stroke(); }
    for (const L of [m.legL, m.legR]) { g.beginPath(); g.ellipse(L[1][0], L[1][1] + 16 * m.s, 36 * m.s, 16 * m.s, 0, 0, TAU); g.fill(); }   // shoes
  }
  function manRim(S, m, col, k) {
    const h = m.head, pts = [];
    for (let i = 0; i <= 18; i++) { const a = Math.PI * (0.8 + 1.4 * i / 18) + h.tilt; pts.push([h.x + Math.cos(a) * h.rx, h.y + Math.sin(a) * h.ry]); }
    S.tube(pts, col, k, 5, { smooth: true });
    S.tube(m.body.slice(0, 3), col, k, 5); S.tube(m.body.slice(3), col, k, 5);
    // the legs' outer edges and the shoes, so he doesn't end at the waist on a phone
    const hw = 26 * m.s;
    for (const [L, sg] of [[m.legL, -1], [m.legR, 1]]) {
      S.tube([[L[0][0] + sg * hw, L[0][1] + 6], [L[1][0] + sg * hw, L[1][1]]], col, k * 0.8, 5);
      S.tube([[L[1][0] - 36 * m.s, L[1][1] + 30 * m.s], [L[1][0] + 36 * m.s, L[1][1] + 30 * m.s]], col, k * 0.8, 5);
    }
  }

  // ---------------------------------------------------------------- the camera (on twos)
  const PANEL = { x0: 170, y0: 560, x1: 910, y1: 1150 };
  const SLOT = (k) => PANEL.x0 + (PANEL.x1 - PANEL.x0) * (k - 0.5) / 5;
  function camAt(t) {
    let x = 0, y = 0, s = 1, r = 0;
    if (t < T.lineup) {
      // frame 0: you start to turn towards him (the scene slides right), and snap back on "turn"
      const out = E.out(clamp(t / 0.36)) * (1 - clamp((t - T.turn) / 0.1));
      const k = clamp((t - T.turn - 0.1) / 0.32), settle = t > T.turn + 0.1 ? Math.sin(Math.PI * k) * (1 - k) : 0;
      x = 95 * out - 16 * settle; s = 1 - 0.05 * out;
      s += 0.05 * E.inOut(clamp((t - P('N01').t0) / (P('N01').t1 - P('N01').t0)));       // closer while you're told
      s += 0.03 * E.out(clamp((t - P('W2').t0) / 0.3));                                   // "Look straight ahead": closer
      x += 8 * Math.sin(t * 0.9) * clamp(t - 1.2);                                         // a held breath's drift
      const grab = clamp((t - T.grab) / 0.7); x += 12 * Math.sin(Math.PI * grab) * (1 - grab);   // his hand brushes you
    } else if (t < T.twist) { s = 1 + 0.06 * E.inOut(clamp((t - T.lineup) / (T.twist - T.lineup))); y = -10 * clamp((t - T.lineup) / 12); }
    else if (t < T.replay) {                                   // the twist: in on his voice; a jolt as it dies
      s = 1 + 0.06 * E.inOut(clamp((t - T.twist) / (T.never - T.twist))) + 0.02 * E.inOut(clamp((t - T.listen) / 0.6));
      if (t >= T.never && t < T.never + 0.27) x = [6, -5, 3, -2][Math.min(3, Math.floor((t - T.never) * 15))];
    }
    else if (t < T.answer) s = 1 + 0.05 * E.inOut(clamp((t - T.replay) / (T.answer - T.replay)));
    else if (t < T.why) { s = 1 + 0.12 * E.out(clamp((t - T.answer) / 1.2)); x = -(SLOT(4) - W / 2) * (s - 1); y = -(800 - H / 2) * (s - 1); }   // in on four
    else if (t < T.end1) s = 1 + 0.10 * E.inOut(clamp((t - T.why) / (T.end1 - T.why)));                // a push on the chart
    else if (t < T.end2) s = 1 + 0.04 * E.inOut(clamp((t - T.end1) / (T.end2 - T.end1)));
    else if (t < T.dare) s = 1 + 0.03 * E.inOut(clamp((t - T.end2) / (T.dare - T.end2)));
    else s = 1 + 0.035 * E.inOut(clamp((t - (END + CF.T.land1)) / 1.7));                  // the case file: push in on 48
    return { x, y, s, r };
  }

  // ---------------------------------------------------------------- shot 1: the cash machine
  const ATM = { x0: 214, y0: 528, x1: 866, y1: 1306, sx0: 236, sy0: 576, sx1: 844, sy1: 1056 };
  const KEYS = Array.from({ length: 12 }, (_, i) => ({ x: 456 + (i % 3) * 84, y: 1092 + Math.floor(i / 3) * 44 }));
  const PIN = [4, 7, 1, 9].map((d, i) => ({ key: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10][d], t: T.pin + 0.17 * i }));
  function atmFills(g, t) {
    const { sx0, sy0, sx1, sy1 } = ATM;
    g.save();
    g.beginPath(); g.rect(sx0, sy0, sx1 - sx0, sy1 - sy0); g.clip();
    // the glass is lit from behind you, a street lamp's glow, so the two of you are dark shapes against it
    const gr = g.createRadialGradient(sx0 + 470, sy0 + 120, 30, sx0 + 380, sy0 + 260, 520);
    gr.addColorStop(0, 'rgba(150,230,235,0.85)'); gr.addColorStop(0.45, 'rgba(60,150,165,0.75)'); gr.addColorStop(1, 'rgba(10,36,46,0.92)');
    g.fillStyle = gr; g.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
    const breath = Math.sin(t * TAU / 2.6) * 7;                                           // he breathes; you can see it
    const lean = E.out(clamp((t + 0.15) / 0.4));                                          // on "Don't" he leans in to your ear
    const reach = mj(clamp((t - T.grab) / 0.4)) * (1 - mj(clamp((t - T.grab - 0.55) / 0.4)));   // his shoulder dips as his hand reaches
    const step = mj(clamp((t - T.grab - 0.75) / 0.6));                                    // then he steps back, out of the glass
    if (step < 1) {
      g.save();
      g.translate(470 - 320 * step, 940); g.rotate((12 * lean - 4 * step + 6 * reach) * deg); g.scale(1 - 0.12 * step, 1 - 0.12 * step); g.translate(-470, -940);
      g.translate(26 * lean + 24 * reach, 8 * lean + breath * 0.6 + 30 * reach);
      g.fillStyle = 'rgba(4,3,10,0.98)'; hoodPath(g, 470, 662, 1); g.fill();
      g.strokeStyle = 'rgba(205,160,255,0.85)'; g.lineWidth = 5;                          // the lamp catches the hood's edge
      g.beginPath(); g.moveTo(370, 924); g.bezierCurveTo(352, 794, 380, 694, 470, 662); g.bezierCurveTo(520, 672, 548, 700, 562, 750); g.stroke();
      g.restore();
    }
    // YOU: nearer the glass, right of centre; a rim of light on the side towards him, so the two heads never merge
    const flinch = 6 * Math.sin(Math.PI * clamp(t / 0.45));                                // you flinch at his voice
    g.fillStyle = 'rgba(2,6,10,0.98)';
    g.beginPath(); g.ellipse(624 + flinch, 852 + breath * 0.25, 78, 94, 0, 0, TAU); g.fill();
    g.fillRect(592, 920, 64, 50);
    g.beginPath(); g.moveTo(442, 1060); g.quadraticCurveTo(474, 966, 584, 952); g.lineTo(664, 952); g.quadraticCurveTo(782, 966, 812, 1060); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(170,240,255,0.75)'; g.lineWidth = 5;
    g.beginPath(); g.ellipse(624 + flinch, 852, 78, 94, 0, Math.PI * 0.62, Math.PI * 1.55); g.stroke();
    // his gloved hand on your left shoulder (the screen's left): four fingers over it, tightening on "robbing"
    const lift = mj(clamp((t - T.grab + 0.08) / 0.16)), grip = E.out(clamp((t - wordOf('N01', /^robbing/i).t0) / 0.2)) * 7;
    if (lift < 1) {
      g.save(); g.translate(0, -60 * lift); g.globalAlpha = 1 - lift;
      g.fillStyle = 'rgba(8,3,14,0.99)';
      const fx = (i) => 486 + i * 26, fy = (i) => 946 + grip - (i === 1 || i === 2 ? 8 : 0);
      g.beginPath(); g.moveTo(478, 1060); g.lineTo(470, 990);
      for (let i = 0; i < 4; i++) { g.lineTo(fx(i), fy(i) + 14); g.quadraticCurveTo(fx(i) + 12, fy(i) - 6, fx(i) + 24, fy(i) + 14); }
      g.lineTo(590, 1000); g.lineTo(584, 1060); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(205,160,255,0.95)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(470, 992); for (let i = 0; i < 4; i++) { g.lineTo(fx(i), fy(i) + 14); g.quadraticCurveTo(fx(i) + 12, fy(i) - 6, fx(i) + 24, fy(i) + 14); } g.stroke();
      g.restore();
    }
    g.restore();
  }
  function atmTubes(S, t) {
    const { x0, y0, x1, y1, sx0, sy0, sx1, sy1 } = ATM;
    S.tube(rr(x0, y0, x1, y1, 38), 'cyan', 0.8 * NE.tired(t, 'housing', 0.15), 9, { closed: true });
    S.tube(rr(sx0, sy0, sx1, sy1, 12), 'white', 0.5, 6, { closed: true });
    LAB.scenery(() => tx(S, 'CASH', 540, 534, 36, 'pink', NE.tired(t, 'cashsign', 0.35) * 0.85));
    // the keypad, three by four; four keys light as your PIN goes in, four stars on the glass
    for (let i = 0; i < KEYS.length; i++) {
      const p = PIN.find((q) => q.key === i), on = p && t >= p.t && t < p.t + 0.16, K = KEYS[i];
      S.tube(rr(K.x - 30, K.y - 16, K.x + 30, K.y + 16, 8, 2), on ? 'yellow' : 'white', on ? 1 : 0.34, 4, { closed: true });
    }
    // the card slot, your card in it
    S.tube([[700, 1100], [834, 1100]], 'white', 0.6, 6);
    S.tube(rr(718, 1100, 816, 1166, 8, 2), 'cyan', 0.62, 4, { closed: true });
    S.tube([[718, 1120], [816, 1120]], 'cyan', 0.4, 4);
    const stars = PIN.filter((p) => t >= p.t).length, gone = clamp((t - T.cash) / 0.2);
    if (stars > 0 && gone < 1) { const str = '* * * *'.slice(0, stars * 2 - 1); tx(S, str, 540 - NE.textWidth('* * * *', 52) / 2 + NE.textWidth(str, 52) / 2, 612, 52, 'white', 1 - gone); }
    const out = clamp((t - T.cash) / 0.3), taken = clamp((t - T.grab - 0.45) / 0.5);
    S.tube([[400, 1262], [680, 1262]], out > 0 && taken < 1 ? 'green' : 'orange', out > 0 && taken < 1 ? 1 : 0.5, 7);
    if (out > 0 && taken < 1) {                                                          // the notes fan out
      for (let i = 0; i < 3; i++) {
        const ox = (i - 1) * 30 - 330 * mj(taken), oy = 1266 + 44 * E.out(out) + i * 6 - 40 * mj(taken);
        S.push(540 + ox, oy, (i - 1) * 5 * deg - 22 * deg * mj(taken), 1.15);
        S.tube(rr(-95, 0, 95, 70, 6, 2), 'green', 0.95, 5, { closed: true });
        S.tube(circ(0, 35, 15, 14), 'green', 0.75, 4, { closed: true });
        S.pop();
      }
    }
    // his gloved hand, from behind your left shoulder: in, closes on the notes, out with them
    const reach = mj(clamp((t - T.grab) / 0.4)), back = mj(clamp((t - T.grab - 0.55) / 0.5));
    if (reach > 0 && back < 1) {
      const hx = lerp(-200, 470, reach) - 720 * back, hy = lerp(1180, 1290, reach) - Math.sin(Math.PI * reach) * 50 + 40 * back;
      glove(S, hx, hy, -30 * deg + 14 * deg * back, clamp((t - T.grab - 0.38) / 0.12));
    }
  }
  function glove(S, x, y, rot, shut) {
    S.push(x, y, rot, 2.0);
    S.tube([[-40, 60], [-46, -6], [-30, -30], [40, -30], [52, -4], [48, 60]], 'violet', 1, 7);   // the back of the glove
    for (let i = 0; i < 4; i++) {
      const fx = -30 + i * 22, L = (i === 1 || i === 2 ? 62 : 52) * (1 - 0.55 * shut);
      S.tube([[fx, -28], [fx + 2, -28 - L], [fx + 14, -28 - L - 4], [fx + 16, -28]], 'violet', 1, 6);
    }
    S.tube([[48, 6], [80, -10 - 20 * (1 - shut)], [88, -30 * (1 - shut)]], 'violet', 1, 6);         // the thumb
    S.tube([[-44, 60], [50, 60], [52, 88], [-46, 88], [-44, 60]], 'violet', 0.8, 6);              // the cuff
    S.pop();
  }
  // your fingertip on the keys (your right hand, from below): in, four presses, out; on twos
  function fingerAt(t) {
    const t0 = PIN[0].t - 0.25, tOut = PIN[3].t + 0.12;
    if (t < t0 || t > tOut + 0.25) return null;
    let x, y, press = 0;
    if (t < PIN[0].t - 0.02) { const u = mj((t - t0) / 0.23), k = KEYS[PIN[0].key]; x = k.x + 60 * (1 - u); y = k.y + 300 * (1 - u); }
    else if (t >= tOut) { const u = mj((t - tOut) / 0.25), k = KEYS[PIN[3].key]; x = k.x + 60 * u; y = k.y + 300 * u; }
    else {
      let j = 0; while (j < 3 && t >= PIN[j + 1].t - 0.02) j++;
      const k = KEYS[PIN[j].key];
      if (j < 3 && t > PIN[j].t + 0.1) {
        const n = KEYS[PIN[j + 1].key], u = mj((t - PIN[j].t - 0.1) / (PIN[j + 1].t - 0.12 - PIN[j].t));
        x = lerp(k.x, n.x, u); y = lerp(k.y, n.y, u) - 12 * Math.sin(Math.PI * u);
      } else { x = k.x; y = k.y; press = t >= PIN[j].t && t < PIN[j].t + 0.1 ? 1 : 0; }
    }
    return { x, y: y + 4 * press };
  }
  function fingerFront(g, t, M) {                                // drawn over the keys, so it hides what it covers
    const f = fingerAt(t); if (!f) return;
    // your index finger from the tip to the knuckle, widening, and the back of your hand below it
    const tip = [f.x + 4, f.y + 18], kn = [tip[0] + 64, tip[1] + 250], hand = [kn[0] + 46, kn[1] + 96];
    const ux = (kn[0] - tip[0]) / Math.hypot(kn[0] - tip[0], kn[1] - tip[1]), uy = (kn[1] - tip[1]) / Math.hypot(kn[0] - tip[0], kn[1] - tip[1]);
    const nx = -uy, ny = ux;                                                              // the finger's left side (towards the screen's light)
    g.save(); g.setTransform(...M);
    g.fillStyle = 'rgba(4,6,12,0.99)';
    g.beginPath(); g.moveTo(tip[0] - nx * 29, tip[1] - ny * 29); g.lineTo(kn[0] - nx * 38, kn[1] - ny * 38); g.lineTo(kn[0] + nx * 38, kn[1] + ny * 38); g.lineTo(tip[0] + nx * 29, tip[1] + ny * 29); g.closePath(); g.fill();
    g.beginPath(); g.arc(tip[0], tip[1], 29, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(hand[0], hand[1], 112, 86, -0.35, 0, TAU); g.fill();
    g.restore();
    const S2 = NE.sign(); S2.push(M[4], M[5], 0, Math.hypot(M[0], M[1]));
    const a = Math.atan2(-uy, -ux);
    S2.tube([...circ(tip[0], tip[1], 29, 10, a - Math.PI / 2, a), [kn[0] + nx * 38, kn[1] + ny * 38]], 'cyan', 0.7, 4);   // the lamp along its edge
    S2.pop(); S2.flush(g, { wall: false });
  }

  // ---------------------------------------------------------------- shots 2 and 5: the line-up behind frosted glass
  const PHASE = [0, 2.1, 4.4, 1.3, 3.5];                                                  // the same life for each man, out of step
  function speaker(t) {                       // who's speaking now (0 = nobody), and his voice's loudness
    for (const s of SPEAK) if (t >= s.v.t0 - 0.05 && t <= s.v.t1 + 0.12) return { k: s.k, a: envAt(`L${s.k}`, t) };
    return { k: 0, a: 0 };
  }
  // whoever speaks steps towards the glass: the same step for every man (in before his line, back after it)
  function stepOf(t, k) {
    const v = SPEAK[k - 1].v;
    return mj(clamp((t - v.t0 + 0.3) / 0.25)) * (1 - mj(clamp((t - v.t1 - 0.08) / 0.35)));
  }
  // one man's pose: his weight from foot to foot, a lean from the ankles, his breath, his head turning; the same
  // amounts for every man, out of step with each other
  function poseOf(t, k, still = 1) {
    const ph = PHASE[k - 1];
    return {
      sway: still * (16 * Math.sin(t * TAU / 5.3 + ph) + 6 * Math.sin(t * TAU / 2.9 + ph * 2.1)),
      lean: still * 2.2 * deg * Math.sin(t * TAU / 6.1 + ph * 0.7),
      br: 1 + 0.035 * Math.sin(t * TAU / 3.6 + ph * 1.7),
      tilt: still * 9 * deg * Math.sin(t * TAU / 4.4 + ph * 0.9),
    };
  }
  function lineupMan(c, k, t, st, still = 1) {
    const { y0, y1 } = PANEL, p = poseOf(t, k, still), cx = SLOT(k) + p.sway, sc = 1 + 0.08 * st, foot = y1 + 10 * st;
    c.save();
    c.translate(cx, foot); c.rotate(p.lean); c.scale(sc, sc * p.br); c.translate(-cx, -y1);
    c.save(); c.translate(cx, y0 + 230); c.rotate(p.tilt); c.translate(-cx, -(y0 + 230));
    c.beginPath(); c.ellipse(cx, y0 + 168, 44, 54, 0, 0, TAU); c.fill();
    c.restore();
    c.fillRect(cx - 17, y0 + 208, 34, 40);
    c.beginPath(); c.moveTo(cx - 72, y1 + 10); c.lineTo(cx - 70, y0 + 300); c.quadraticCurveTo(cx - 66, y0 + 252, cx - 28, y0 + 244);
    c.lineTo(cx + 28, y0 + 244); c.quadraticCurveTo(cx + 66, y0 + 252, cx + 70, y0 + 300); c.lineTo(cx + 72, y1 + 10); c.closePath(); c.fill();
    c.restore();
  }
  function lineupFills(g, t, mode, fade = 1) {
    const { x0, y0, x1, y1 } = PANEL, rev = mode === 'reveal';
    const sp = rev ? { k: 4, a: 0.6 } : speaker(t);
    const open = rev ? mj(clamp((t - T.answer) / 0.4)) : 0;                               // the glass clears on four
    const power = (rev ? 0.5 : 1) * fade;
    const bg = g.createLinearGradient(0, y0, 0, y1);
    bg.addColorStop(0, `rgba(150,180,220,${0.5 * power})`); bg.addColorStop(1, `rgba(70,90,130,${0.4 * power})`);
    g.fillStyle = bg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let k = 1; k <= 5; k++) {                                                        // a pool of light behind whoever speaks, pulsing with him
      const hot = sp.k === k ? (rev ? 1 : 0.35 + 0.65 * sp.a) : 0;
      if (hot <= 0) continue;
      const rg = g.createRadialGradient(SLOT(k), y0 + 170, 10, SLOT(k), y0 + 220, rev ? 260 : 210);
      const c = rev ? '255,90,150' : '200,235,255';
      rg.addColorStop(0, `rgba(${c},${0.7 * hot * fade})`); rg.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = rg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    // the men behind the glass (blurred); whoever has stepped towards it, less so
    const far = scratch('far'), near = scratch('near');
    far.g.fillStyle = near.g.fillStyle = 'rgba(4,6,16,0.94)';
    let nearAny = false;
    for (let k = 1; k <= 5; k++) {
      if (rev && k === 4) continue;                                                       // four is drawn sharp, below
      const st = rev ? 0 : stepOf(t, k), c = st > 0.01 ? near.g : far.g;
      if (st > 0.01) nearAny = true;
      c.globalAlpha = rev ? 0.4 : 1;
      lineupMan(c, k, t, st);
    }
    const hx = SLOT(4), hw = 84 * open;
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); if (open > 0) g.rect(hx - hw, y0, 2 * hw, y1 - y0); g.clip('evenodd');
    g.globalAlpha = (0.35 + 0.65 * power) * fade; g.filter = 'blur(7px)'; g.drawImage(far.c, 0, 0);
    if (nearAny) { g.filter = 'blur(3px)'; g.drawImage(near.c, 0, 0); }
    g.filter = 'none';
    if (rev && open < 1) { const s4 = scratch('four'); s4.g.fillStyle = 'rgba(4,6,16,0.96)'; lineupMan(s4.g, 4, t, 0, 0.3); g.filter = 'blur(7px)'; g.drawImage(s4.c, 0, 0); g.filter = 'none'; }
    g.globalAlpha = (0.9 * power + 0.1) * fade; g.drawImage(frost(), x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    g.restore();
    if (rev && open > 0) {                                                                // through the cleared glass: four, sharp, against the pink
      g.save(); g.beginPath(); g.rect(hx - hw, y0, 2 * hw, y1 - y0); g.clip();
      g.fillStyle = 'rgba(4,3,10,0.99)'; lineupMan(g, 4, t, 0, 0.3);
      g.restore();
    }
  }
  function lineupTubes(S, t, th, mode, fade = 1) {
    const { x0, y0, x1, y1 } = PANEL, rev = mode === 'reveal', sp = rev ? { k: 4, a: 1 } : speaker(th);
    S.tube(rr(x0, y0, x1, y1, 10), 'white', 0.55 * fade, 6, { closed: true });
    tx(S, 'POLICE', 540, 336, 44, 'cyan', 0.8 * NE.tired(t, 'police', 0.25) * fade);
    for (const s of SPEAK) {                                                             // the numbers, lit as they're called
      const on = rev ? 1 : lit(t, s.n.t0 - 0.06);
      const k = rev ? (s.k === 4 ? lit(t, T.answer) : 0.15) : (sp.k === s.k ? 1 : on * 0.55);
      tx(S, String(s.k), SLOT(s.k), 444, 64, rev && s.k === 4 ? 'pink' : 'cyan', Math.max(dark, k * fade));
      if (sp.k === s.k && !rev) {                                                        // his voice, as a wave under his place
        const pts = [], amp = 8 + 40 * sp.a, cx = SLOT(s.k);
        for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([cx - 66 + 132 * u, 1206 + Math.sin(u * 18 + th * 26) * amp * Math.sin(Math.PI * u)]); }
        S.tube(pts, 'cyan', fade, 5, { smooth: true });
      }
    }
    if (rev) {
      const open = mj(clamp((th - T.answer) / 0.4)), hx = SLOT(4), hw = 84 * open;
      if (open > 0.05) for (const ex of [hx - hw, hx + hw]) S.tube([[ex, y0 + 6], [ex, y1 - 6]], 'white', 0.45, 4);   // the edges of the cleared glass
      tx(S, 'NUMBER 4', 540, 1250, 80, 'pink', lit(t, T.answer));
    }
  }

  // ---------------------------------------------------------------- shot 3: his voice, big; it flatlines on "never"; one sound came through
  const MON = { x0: 180, x1: 900, y0: 700, y1: 1220, cy: 960 };
  const W2SH = (() => {                                       // where his SH is in "Look shtraight ahead" (0..1 of the line)
    const e = ENV.W2, w = wordOf('W2', /straight/i); if (!e) return { a: 0.3, b: 0.45 };
    const d = e.rms.length / 30; return { a: (w.t0 - e.t0) / d, b: (w.t0 + 0.2 - e.t0) / d };
  })();
  function monitorTubes(S, t, th) {
    const { x0, x1, y0, y1, cy } = MON, e = ENV.W2;
    const on = lit(t, T.twist + 0.1);
    S.tube(rr(x0 - 12, y0, x1 + 12, y1, 18), 'white', 0.3 * on, 5, { closed: true });  // the monitor
    for (const gy of [cy - 130, cy + 130]) S.tube([[x0 + 10, gy], [x1 - 10, gy]], 'white', 0.1 * on, 3);
    const rise = E.out(clamp((th - T.twist - 0.1) / 0.6)), dead = t >= T.never;
    const N = 150, pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, a = e ? e.rms[Math.min(e.rms.length - 1, Math.floor(u * e.rms.length))] : 0.5;
      const amp = dead ? 0 : 230 * a * rise, hiss = dead ? 3 * Math.sin(i * 2.3 + th * 40) : 0;
      pts.push([lerp(x0, x1, u), cy + Math.sin(u * 95 + th * 11) * amp * Math.pow(Math.sin(Math.PI * u), 0.3) + hiss]);
    }
    const k = !dead ? on * 0.95 : NE.flick(t, T.never, [0.7, 0.7, 0.15, 0.15, 0.5, 0.5, 0.3]);
    S.tube(pts, 'violet', Math.max(dark, k * (t >= T.listen ? 0.5 : 1)), 8, { smooth: true });
    if (t >= T.never && t < T.never + 0.5) NE.sparks(S, 540, cy, t, T.never + 0.1, 'dead', 14, 0.4);
    // "But one thing came through": where his SH was, the line still moves, in green; on "Listen." it swells
    if (t >= T.came - 0.05) {
      const sw = t >= T.listen ? 1 + 0.6 * E.out(clamp((th - T.listen) / 0.3)) : 1;
      const xa = lerp(x0, x1, W2SH.a), xb = lerp(x0, x1, W2SH.b), q = [];
      for (let i = 0; i <= 24; i++) { const u = i / 24; q.push([lerp(xa, xb, u), cy + Math.sin(i * 2.1 + th * 47) * 26 * sw * Math.sin(Math.PI * u)]); }
      S.tube(q, 'green', lit(t, T.came - 0.05), 9);
    }
  }
  function twistText(U, t) {                                   // frame 0's words again, said this time; they die with his voice
    if (t < T.remember - 0.04) return;
    const k = t < T.never ? 1 : NE.flick(t, T.never, [0.7, 0.7, 0.15, 0.15, 0.4, 0.4, 0]);
    if (!(k > 0)) return;
    const kw = (i) => (i < 8 ? lit(t, T.remember - 0.04) : i < 12 ? lit(t, T.his - 0.04) : lit(t, T.voiceW - 0.04));
    tx(U, 'REMEMBER HIS VOICE', 530, 560, 54, 'violet', (i) => kw(i) * k * 0.95);
  }

  // ---------------------------------------------------------------- shot 4: the two replays: each word lit as it's said, its wave under it
  const RP = [{ id: 'RW', top: 560, col: 'violet', label: 'WHAT YOU HEARD' }, { id: 'R4', top: 940, col: 'cyan', label: 'ONE OF THE FIVE' }];
  const NUM_Y = 1290;
  function clueWord(S, t, th, r) {
    const { id, top, col, label } = r, w = wordOf(id, /straight/i), p = P(id), e = ENV[id];
    if (t < p.t0 - 0.12) return;                                                         // nothing before his voice plays
    tx(S, label, 540, top - 80, 54, col, lit(t, p.t0 - 0.12) * 0.9);
    const u = clamp((th - w.t0) / Math.max(0.2, w.t1 - w.t0));                          // how far through "straight" he is
    const said = th >= w.t0 - 0.02, shHot = th >= w.t0 - 0.02 && th < w.t0 + 0.22;
    const hs = t >= T.hearS - 0.05;                                                      // "Hear the hiss?": the SH swells, the rest steps back
    const pop = hs ? 1 + 0.22 * E.out(clamp((th - T.hearS + 0.05) / 0.2)) : 1;
    const breathe = hs ? 0.85 + 0.15 * Math.sin((th - T.hearS) * TAU / 1.2) : 1;
    const rest = hs ? 0.45 : 0.95;
    const h = 92, u6 = h / 6, L = 540 - NE.textWidth('SHTRAIGHT', h) / 2, shW = NE.textWidth('SH', h);
    const trC = L + 11.2 * u6 + NE.textWidth('TRAIGHT', h) / 2 + 14 * (pop - 1) / 0.22;
    // only what he has said is drawn: no letter shows, lit or dark, before his voice reaches it
    tx(S, 'TRAIGHT', trC, top, h, col, (i) => (said && i / 7 <= u + 0.05 ? rest : 0));
    if (said) { S.push(L + shW, top + h / 2, 0, pop); tx(S, 'SH', -shW / 2, -h / 2, h, 'green', shHot ? 1 : hs ? breathe : 0.8); S.pop(); }   // it grows to the left, away from the T
    // his voice as a wave, drawn as it plays (a recording: it stays once drawn); the SH part of it green
    if (!e) return;
    const n = e.rms.length, dur = n / 30, prog = clamp((th - e.t0) / dur), cy = top + h + 84;
    const sa = (w.t0 - e.t0) / dur, sb = (w.t0 + 0.2 - e.t0) / dur, N = 110, all = [], shp = [];
    for (let i = 0; i <= Math.floor(N * prog); i++) {
      const v = i / N, a = e.rms[Math.min(n - 1, Math.floor(v * n))], q = [lerp(170, 910, v), cy + Math.sin(i * 1.9 + (id === 'RW' ? 0 : 1.3)) * 50 * a];
      all.push(q); if (v >= sa && v <= sb) shp.push(q);
    }
    if (all.length > 1) S.tube(all, col, 0.8, 5);
    if (shp.length > 1) S.tube(shp, 'green', hs ? breathe : 0.95, hs ? 9 : 6);
  }
  function numbersRow(S, t) {                                  // one of these five: the same for all of them until "four"
    if (t < P('R4').t0 - 0.12) return;
    for (let k = 1; k <= 5; k++) tx(S, String(k), 540 + (k - 3) * 130, NUM_Y, 70, 'cyan', 0.4 * lit(t, P('R4').t0 - 0.12));
  }

  // ---------------------------------------------------------------- shot 6: the why: five pitch lines; his has none; the hiss in each
  const ROWS = { x0: 190, x1: 900, y: [540, 660, 780, 900, 1020], wy: 1160 };
  const gapOf = (id) => {         // where the S (or SH) sits on a line: from the start of "straight" until the voice comes back
    const e = ENV[id]; if (!e) return null;
    const w = wordOf(id, /straight/i), n = (e.f0 || e.rms).length, i0 = Math.max(0, Math.round((w.t0 - e.t0) * 30));
    let i1 = i0 + 1; while (i1 < Math.min(n - 1, i0 + 6) && !(e.f0[i1] > 0)) i1++;
    return { a: i0 / (n - 1), b: Math.max(i0 + 2, i1) / (n - 1) };
  };
  function chartTubes(S, t, th) {
    const t0 = T.why + 0.1;
    const flare = t >= T.s - 0.05 ? 1 + 0.6 * Math.sin(Math.PI * clamp((th - T.s + 0.05) / 0.35)) : 1;   // the marks flare once on "hiss"
    const pulse = 0.8 + 0.2 * Math.sin((th - T.s) * TAU / 1.2);
    const vib = th >= T.cords - 0.05 && th < T.vib1 + 0.1;                                // "vocal cords ... vibrate": the five lines buzz
    const link = mj(clamp((th - T.barely) / 0.6)), locked = th >= T.barely + 0.6;
    for (let k = 1; k <= 5; k++) {
      const id = `L${k}`, e = ENV[id], y = ROWS.y[k - 1], d0 = t0 + 0.12 * (k - 1), u = clamp((th - d0) / 0.5);
      const hot = !locked || k === 4 ? 1 : 0.4;                                            // once it locks, the others step back
      tx(S, String(k), 140, y - 26, 48, k === 4 ? 'pink' : 'cyan', Math.max(dark, 0.85 * lit(t, d0) * hot));
      if (!e) continue;
      const n = e.f0.length, seg = [], col = k === 4 ? 'pink' : 'cyan';
      const flush = () => { if (seg.length > 1) S.tube(seg.slice(), col, 0.95 * hot, 6, { smooth: true }); seg.length = 0; };
      const nDraw = Math.floor(u * (n - 1));                                              // each line traces itself left to right
      for (let i = 0; i <= nDraw; i++) {
        const f = e.f0[i], jy = vib ? (Math.floor(th * 15) % 2 ? 1 : -1) * 8 * Math.sin(i * 1.7 + k) : 0;
        if (f > 0) seg.push([lerp(ROWS.x0, ROWS.x1, i / (n - 1)), y + 40 - clamp((f - 80) / 110) * 80 + jy]); else flush();
      }
      flush();
      // "That hiss never uses your vocal cords": where each voice stops for its hiss; four's green (his SH), the others white
      const gp = t >= T.s - 0.05 && gapOf(id);
      if (gp) S.tube([[lerp(ROWS.x0, ROWS.x1, gp.a), y + 8], [lerp(ROWS.x0, ROWS.x1, gp.b), y + 8]], k === 4 ? 'green' : 'white', lit(t, T.s + 0.04 * k) * (k === 4 ? pulse : 0.6) * hot, 14 * flare);
    }
    // his whisper: the same words, flat, no pitch at all
    const wy = ROWS.wy;
    S.tube([[ROWS.x0, wy], [ROWS.x1, wy]], 'violet', Math.max(dark, 0.7 * lit(t, T.whispered - 0.04)), 8);
    if (t >= T.whispered - 0.04) tx(S, 'HIS WHISPER', 540, wy + 30, 48, 'violet', lit(t, T.whispered - 0.04) * 0.85);
    if (t >= T.no - 0.04) { const dn = t > T.s - 0.6 ? 0.45 : 1; tx(S, 'NO PITCH', 540, 1300, 70, 'pink', (i) => (i < 2 ? lit(t, T.no - 0.04) : lit(t, T.pitch - 0.04)) * dn); }
    // the hiss in his whisper, green; on "barely changes it" it rises and locks onto four's
    if (t >= T.s - 0.05) {
      const gw = gapOf('W2'), g4 = gapOf('L4');
      const xa = lerp(ROWS.x0, ROWS.x1, gw.a), xb = lerp(ROWS.x0, ROWS.x1, gw.b);
      S.tube([[xa, wy], [xb, wy]], 'green', lit(t, T.s + 0.25) * pulse, 14 * flare);
      if (link > 0) {
        const ya = ROWS.y[3] + 8, a4 = lerp(ROWS.x0, ROWS.x1, g4.a), b4 = lerp(ROWS.x0, ROWS.x1, g4.b);
        const cx = lerp((xa + xb) / 2, (a4 + b4) / 2, link), cy = lerp(wy, ya, link), hw = lerp((xb - xa) / 2, (b4 - a4) / 2, link);
        if (!locked) { S.tube([[(xa + xb) / 2, wy], [cx, cy]], 'green', 0.35, 3); S.tube([[cx - hw, cy], [cx + hw, cy]], 'green', 1, 16); }
        else S.tube(rr(a4 - 24, ya - 32, b4 + 24, ya + 32, 14, 3), 'green', NE.flick(t, T.barely + 0.6, [1, 1, 0.45, 0.45, 1]) ?? 1, 5, { closed: true });
      }
    }
  }

  // ---------------------------------------------------------------- shot 7: the two endings, big, in real places
  function bars(S, x0, x1, y0, y1, u, k) {
    const n = 6, w = (x1 - x0);
    for (let i = 0; i < n; i++) { const x = x0 + w * (i + 0.5) / n + (1 - u) * w * 1.15; if (x < x1 + 2) S.tube([[x, y0], [x, y1]], 'white', k, 7); }
    if (u > 0.95) { S.tube([[x0, y0], [x1, y0]], 'white', k, 7); S.tube([[x0, y1], [x1, y1]], 'white', k, 7); }
  }
  function ending1(g, S, t) {                                    // "If you picked four, you caught him by one sound."
    tx(S, 'PICKED 4', 540, 330, 52, 'cyan', (i) => (i < 6 ? lit(t, T.picked - 0.04) : lit(t, T.four1 - 0.04)));
    const shut = mj(clamp((t - T.caught) / 0.5)), slump = mj(clamp((t - T.caught - 0.6) / 0.7));
    const m = manPts(540, 1410, 1.25, { slump, idle: t, ph: 0.7, look: 0.3 * Math.sin(t * TAU / 3.1) * (1 - slump) });
    manFill(g, m); manRim(S, m, 'pink', 1);
    if (t >= T.four1 - 0.04) tx(S, '4', m.body[2][0] + 30 * 1.25, 1410 - 360 * 1.25, 80, 'pink', lit(t, T.four1 - 0.04));
    bars(S, 300, 780, 560, 1440, shut, 1);
  }
  function ending2(g, S, t) {                                    // "If you didn't, he walks, and the man you picked goes to jail for a voice nobody heard."
    tx(S, "IF YOU DIDN'T", 540, 330, 48, 'cyan', lit(t, T.didnt - 0.04));
    // the man you picked, in a cell on the left: he watches four walk out, the bars close on "jail", he grips them, and
    // on "nobody" his head goes down
    const jail = mj(clamp((t - T.jail) / 0.5)), grip = clamp((t - T.jail - 0.5) / 0.3), down = mj(clamp((t - T.nobody) / 0.6));
    const wk = clamp((t - T.walks) / 1.9);
    const look = wk > 0.05 && wk < 1 ? 0.9 : 0.3 * Math.sin(t * TAU / 2.7) * (1 - grip);
    const inn = manPts(290, 1420, 0.95, { idle: t, ph: 2.2, look, slump: 0.85 * down });
    manFill(g, inn); manRim(S, inn, 'white', 0.9);
    tx(S, '?', inn.body[2][0] + 30 * 0.95, 1420 - 360 * 0.95, 70, 'white', 0.9);
    bars(S, 120, 460, 760, 1450, jail, 0.95);
    if (grip > 0) for (const hx of [214, 366]) { g.fillStyle = 'rgba(6,5,12,0.98)'; g.beginPath(); g.ellipse(hx, 1000 - 10 * (1 - grip), 22, 28, 0, 0, TAU); g.fill(); S.tube(circ(hx, 1000 - 10 * (1 - grip), 22, 12, Math.PI, TAU), 'white', 0.8 * grip, 4); }
    // the station door on the right, EXIT over it
    S.tube([[770, 1450], [770, 720], [930, 720], [930, 1450]], 'green', 0.75, 7);
    tx(S, 'EXIT', 850, 652, 46, 'green', 0.95);
    // four walks out: a stride in four drawings on twos, a bob, one glance back at the cell, and through the door
    if (wk < 1) {
      const x = lerp(560, 860, mj(wk)), dr = Math.floor(held(t, 2) * 7.5) % 4;
      const lk = wk > 0.35 && wk < 0.6 ? -1 : 0;
      const m = manPts(x, 1420, 0.95, wk > 0 ? { walk: dr, look: lk } : { idle: t, ph: 4.1 });
      const fade = 1 - clamp((x - 820) / 40);
      g.save(); g.globalAlpha = fade; manFill(g, m); g.restore();
      manRim(S, m, 'pink', fade);
      tx(S, '4', m.body[2][0] + 30 * 0.95, 1420 - 360 * 0.95, 70, 'pink', fade);
    }
  }

  // ---------------------------------------------------------------- shot 8: the dare: a friend in silhouette, an earbud
  const PH = { cx: 740, cy: 920, s: 0.82 };                    // her phone, smaller than her head
  const KEY_FROM = { x: 540, y: 430 };                         // where the SH appears, above them both: kept from her
  // her profile, facing the phone: back of the head, brow, nose, lips, chin, neck, shoulders
  const FACE = [[260, 1080], [228, 960], [236, 860], [292, 784], [372, 772], [418, 812], [426, 852], [452, 902], [428, 918], [436, 940], [426, 952], [432, 972], [418, 1000], [380, 1022], [372, 1080], [470, 1130], [520, 1300], [120, 1300], [170, 1120]];
  function portrait(S, k) {      // the man with the mole, once: a framed photo on her wall (no text), small and soft
    S.push(150, 430, -3 * deg, 1);
    const q = 0.38 * k;
    S.tube(rr(-52, 0, 52, 132, 6, 2), 'white', q, 4, { closed: true });
    S.tube(circ(0, 82, 24, 18), 'white', q, 4, { closed: true });                          // his face
    S.tube([[-27, 64], [-24, 52], [0, 46], [24, 52], [27, 64], [-27, 64]], MAROON, 0.6 * k, 5);   // the maroon cap first
    S.tube([[27, 64], [42, 66]], MAROON, 0.6 * k, 5);                                     // its brim
    S.tube(circ(10, 88, 2, 8), 'white', q, 3, { closed: true });                          // the mole: his left cheek, the screen's right
    S.pop();
  }
  function dareFills(g, t, fade) {
    const nod = 4 * Math.sin(t * TAU / 1.1) * clamp((t - T.friend) / 0.3);
    g.save(); g.globalAlpha = fade; g.translate(0, nod);
    g.fillStyle = 'rgba(6,5,12,0.98)'; g.beginPath(); g.moveTo(...FACE[0]); for (const p of FACE.slice(1)) g.lineTo(...p); g.closePath(); g.fill();
    g.restore();
  }
  function dareTubes(S, t, th, fade) {
    const k = fade, nod = 4 * Math.sin(th * TAU / 1.1) * clamp((th - T.friend) / 0.3);
    portrait(S, k);
    S.push(0, nod, 0, 1);
    S.tube(FACE.slice(2, 15), 'white', k, 6, { smooth: true });                            // the light along her face
    const shut = mj(clamp((th - T.friend) / 0.25));                                       // eyes open, then shut as she listens
    if (shut < 0.5) S.tube(circ(392, 846, 7, 8), 'white', k, 4, { closed: true });
    else S.tube([[380, 850], [392, 856], [404, 850]], 'white', k, 4, { smooth: true });
    const bud = mj(clamp((th - T.friend + 0.35) / 0.35));                                 // the earbud goes in
    const bx = lerp(420, 300, bud), by = lerp(1060, 880, bud);
    S.tube(circ(bx, by, 14, 10), 'cyan', k, 5, { closed: true });
    S.pop();
    const pe = [PH.cx + (640 - PH.cx) * PH.s, PH.cy + (1180 - PH.cy) * PH.s];             // the cable's end, at the phone's foot
    S.tube([[bx + 4, by + 14 + nod], [330, 1040], [470, 1160], pe], 'cyan', k * 0.75, 4, { smooth: true });
    if (bud >= 1) for (let i = 0; i < 2; i++) {
      const ph = ((th * 1.4 + i / 2) % 1);
      S.tube(circ(300, 880 + nod, 24 + 28 * ph, 8, 0.65 * Math.PI, 1.35 * Math.PI), 'cyan', k * (1 - ph) * 0.8, 4);
    }
    S.push(PH.cx, PH.cy, 0, PH.s);                                                        // the phone, playing this test
    S.tube(rr(-140, -260, 140, 260, 34), 'cyan', k, 8, { closed: true });
    S.tube([[-30, -224], [30, -224]], 'cyan', k * 0.7, 5);
    const playing = Math.floor(th * 2.5) % 5;                                                // its line-up, one number after another
    for (let i = 0; i < 5; i++) tx(S, String(i + 1), -90 + i * 45, -170, 34, 'cyan', k * (i === playing && t < T.sWord ? 1 : 0.35));
    for (let i = 0; i < 5; i++) S.tube(circ(-90 + i * 45, -70, 13, 10), 'white', k * (i === playing && t < T.sWord ? 0.9 : 0.4), 4, { closed: true });
    S.pop();
  }
  function keySH(S, x, y, s, k) { tx(S, 'SH', x, y - 60 * s, 120 * s, 'green', k); }

  // ---------------------------------------------------------------- shot 9: the case file (engine/casefile.js), in neon
  // Draw order (casefile.js): folder 47's back and the SH → 47's cover, solid, with its stamp → 48 whole, solid, on top.
  const solid = (g, pose, pts) => {
    g.save(); g.translate(pose.cx, pose.cy); g.rotate(pose.rot);
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) g.lineTo(q[0], q[1]); g.closePath();
    g.fillStyle = 'rgba(12,10,14,0.97)'; g.fill(); g.restore();
  };
  const coverPts = (open) => { const c = CF.cover(), d = CF.FOLDER.coverDrop * (open || 0); return rr(c.x0 + 4, c.y0 + d, c.x1 - 4, c.y1, 10, 2); };
  function folderBack(S, pose, k) { S.push(pose.cx, pose.cy, pose.rot, 1); S.tube(CF.shape(), 'orange', k, 8, { closed: true }); S.pop(); }
  function folderCover(S, pose, n, lab, k) {
    const d = CF.FOLDER.coverDrop * (pose.open || 0), sb = CF.stampBox();
    S.push(pose.cx, pose.cy, pose.rot, 1);
    S.tube(coverPts(pose.open), 'orange', k, 8, { closed: true });
    S.push(sb.x + sb.w / 2, sb.y + d + sb.h / 2, sb.rot, 1);
    const sk = k * (pose.stamp == null ? 1 : pose.stamp);                              // the stamp lights once it has settled
    S.tube(rr(-sb.w / 2, -sb.h / 2, sb.w / 2, sb.h / 2, 6, 2), 'red', Math.max(dark, sk), 6, { closed: true });
    if (sk > 0.01) tx(S, CF.words(n), 0, -26, 52, 'red', sk);
    S.pop();
    if (lab && sk > 0.01) { const lb = CF.labelBox(); tx(S, lab, lb.x + lb.w / 2, lb.y + d, 34, 'orange', sk); }
    S.pop();
  }
  function caseBack(S, t) {                                    // in the main pass: 47's back, and the SH on its way in
    const E1 = CF.ending(t, END, { from: KEY_FROM });
    if (E1.a.on) folderBack(S, E1.a, 1);
    if (E1.drop.on) keySH(S, E1.drop.x, E1.drop.y, E1.drop.s, 1);
  }
  function caseFront(g, t, M) {                                // then 47's cover over it, then 48 on top: each solid
    const E1 = CF.ending(t, END, { from: KEY_FROM }), sc = Math.hypot(M[0], M[1]);
    if (E1.a.on) {
      g.save(); g.setTransform(...M); solid(g, E1.a, coverPts(E1.a.open)); g.restore();
      const S2 = NE.sign(); S2.push(M[4], M[5], 0, sc); folderCover(S2, E1.a, 47, '', 1); S2.pop(); S2.flush(g, { wall: false });
    }
    if (E1.b.on) {
      g.save(); g.setTransform(...M); solid(g, E1.b, CF.shape()); g.restore();
      const S3 = NE.sign(); S3.push(M[4], M[5], 0, sc);
      folderBack(S3, E1.b, 1); folderCover(S3, { ...E1.b, open: 0 }, 48, CF.label(window.NEXT_LABEL || ''), 1);
      S3.pop(); S3.flush(g, { wall: false });
    }
  }

  // ---------------------------------------------------------------- the frame-0 case tab (engine/casefile.js), in neon
  const TAB_OUT = T.lineup - 0.3;                              // kept up through the robbery, then it cuts out like a sign
  function caseTab(U, t) {
    const p = CF.tab(t, { out: TAB_OUT }); if (!p.on) return;
    const A = CF.TAB, sb = A.stamp;
    const k = t < TAB_OUT ? 1 : (NE.flick(t, TAB_OUT, [0.6, 0.6, 0.2, 0.2, 0.45, 0.45, 0]) ?? 1) * p.k;
    if (!(k > 0)) return;
    U.push(A.x, A.y + p.dy, 0, 1);
    U.tube(CF.tabShape(), 'orange', 0.78 * k, 6, { closed: true });
    U.pop();
    U.push(sb.x + sb.w / 2, sb.y + p.dy + sb.h / 2, sb.rot, 1);
    tx(U, CF.words(47), 0, -19, 38, 'red', 0.85 * k);
    U.pop();
  }

  // ---------------------------------------------------------------- the screen-fixed words of the first shot
  function hookTubes(U, t) {
    // SOUND ON in a pill, top right, with a drawn speaker: the instruction, on frame 0
    const px0 = 430, px1 = 940, py0 = 288, py1 = 386, sx = px0 + 58, sy = (py0 + py1) / 2;
    U.tube(rr(px0, py0, px1, py1, 49, 5), 'yellow', 0.75, 5, { closed: true });
    U.tube([[sx - 26, sy - 14], [sx - 10, sy - 14], [sx + 8, sy - 32], [sx + 8, sy + 32], [sx - 10, sy + 14], [sx - 26, sy + 14], [sx - 26, sy - 14]], 'yellow', 0.92, 5);
    U.tube(circ(sx + 14, sy, 16, 8, -0.33 * Math.PI, 0.33 * Math.PI), 'yellow', 0.8, 5);
    U.tube(circ(sx + 14, sy, 28, 10, -0.33 * Math.PI, 0.33 * Math.PI), 'yellow', 0.65, 5);
    tx(U, 'SOUND ON', px1 - 26 - NE.textWidth('SOUND ON', 54) / 2, sy - 27, 54, 'yellow', 0.95);
    // the game, lit on frame 0 (the narrator's own words, said at the end of his first line): each word full as it's said
    const offW = offFlick(t, P('N01').t1 + 0.2), n1 = P('N01').w;
    const said = (re) => { const w = n1.find((x) => re.test(x.w)); return w && t >= w.t0 - 0.03 ? 1 : 0.8; };
    tx(U, 'REMEMBER HIS VOICE', 530, 404, 54, 'violet', (i) => (i < 8 ? said(/^remember/i) : i < 12 ? said(/^his/i) : said(/^voice/i)) * offW);
    // his words, as he whispers them: the whole line readable on frame 0, each word full as it's said
    const ws = P('W1').w, kw = (i) => (i === 0 || t >= ws[i].t0 - 0.03 ? 1 : 0.55);
    tx(U, "DON'T TURN", 540, 1338, 80, 'white', (i) => (i < 5 ? kw(0) : kw(1)) * offW);
    tx(U, 'AROUND.', 540, 1432, 80, 'white', kw(2) * offW);
  }
  function stopwatch(U, t, k) {                                // the time to pick: a stopwatch, not a letter
    const u = clamp((held(t, 2) - T.bar0) / (T.bar1 - T.bar0)), wx = 796, wy = 1316, r = 54;
    U.tube(circ(wx, wy, r, 36), 'white', 0.85 * k, 6, { closed: true });
    U.tube([[wx, wy - r], [wx, wy - r - 12]], 'white', 0.85 * k, 6);
    U.tube([[wx - 14, wy - r - 16], [wx + 14, wy - r - 16]], 'white', 0.85 * k, 7);
    if (u < 1) {
      U.tube(circ(wx, wy, r - 15, 30, -Math.PI / 2 + u * TAU, 1.5 * Math.PI), 'yellow', 0.95 * k, 9);   // the time left
      const a = -Math.PI / 2 + u * TAU; U.tube([[wx, wy], [wx + Math.cos(a) * (r - 8), wy + Math.sin(a) * (r - 8)]], 'white', 0.9 * k, 4);
    }
  }

  // ---------------------------------------------------------------- the frame
  LAB.film({
    to: 'end', start: false,
    draw(g, t) {
      const th = held(t, 2);
      const cam = camAt(th), M = camM(cam);
      const S = NE.sign(), U = NE.sign();
      S.push(M[4], M[5], cam.r, cam.s);                                                    // the camera, for every tube that follows
      const lineFade = t < T.twist ? 1 : offFlick(t, T.twist);                             // the line-up's lights go out on the twist
      const dareFade = 1 - clamp((t - (END + CF.T.a0 - 0.25)) / 0.3);                       // the friend and phone go before the folder rises
      g.save(); g.setTransform(...M);
      g.drawImage(NE.wall(), -260, -200, W + 520, H + 400);
      if (t < T.lineup) atmFills(g, th);
      else if (t < T.twist + 0.3) { if (lineFade > 0) lineupFills(g, th, 'line', lineFade); }
      else if (t >= T.answer && t < T.why) lineupFills(g, th, 'reveal');
      else if (t >= T.end1 && t < T.end2) ending1(g, S, th);
      else if (t >= T.end2 && t < T.dare) ending2(g, S, th);
      else if (t >= T.dare && dareFade > 0) dareFills(g, th, dareFade);
      g.restore();
      if (t < T.lineup) atmTubes(S, th);
      else if (t < T.twist + 0.3 && lineFade > 0) lineupTubes(S, t, th, 'line', lineFade);
      if (t >= T.twist && t < T.replay) monitorTubes(S, t, th);
      else if (t >= T.replay && t < T.answer) { for (const r of RP) clueWord(S, t, th, r); numbersRow(S, t); }
      else if (t >= T.answer && t < T.why) lineupTubes(S, t, th, 'reveal');
      else if (t >= T.why && t < T.end1) chartTubes(S, t, th);
      else if (t >= T.dare) {
        if (dareFade > 0) dareTubes(S, t, th, dareFade);
        if (t >= T.sWord - 0.02 && t < END + CF.T.drop0) keySH(S, KEY_FROM.x, KEY_FROM.y, 1, lit(t, T.sWord - 0.02));   // the SH: kept from her
        caseBack(S, t);
      }
      S.pop();
      S.flush(g, { wall: false });
      if (t < T.lineup) fingerFront(g, th, M);
      if (t >= T.dare) caseFront(g, t, M);
      if (t < T.lineup) hookTubes(U, t);
      if (t >= T.lineup && t < T.twist + 0.3 && lineFade > 0) {
        if (t < T.charged) tx(U, 'CLOSE YOUR EYES', 540, 1290, 58, 'pink', lit(t, P('N02').t0));
        else if (t < P('N03B').t1 + 1.3) tx(U, 'CHARGED TONIGHT', 540, 1290, 58, 'yellow', lit(t, T.charged - 0.04) * outAt(t, P('N03B').t1 + 1.0));
        if (t >= P('N09').t0 - 0.04) {
          const k = lit(t, P('N09').t0 - 0.04) * lineFade;
          tx(U, 'PICK ONE', 450, 1290, 64, 'yellow', k);
          stopwatch(U, t, k);
        }
      }
      if (t >= T.twist && t < T.replay) twistText(U, t);
      caseTab(U, t);
      U.flush(g, { wall: false });
      LAB.safeOverlay(g);
    },
  });
  UI.endcard();
  C.start();
})();
