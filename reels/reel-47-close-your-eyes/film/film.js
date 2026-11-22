// Reel 47 Close Your Eyes: the picture, in the neon look (engine/neon47) with the case file (engine/casefile.js).
// Every shot is timed from the placed voices (film/words.js, from place_vo.py + plan_vo.py) and each voice's loudness
// and pitch line (film/env.js, from env.py). A pure function of t: any frame paints the same in any order. Drawings,
// characters and the camera are held on twos (LAB.held); only a tube's light may change on single frames, as a real
// sign's does.
//
// Shots: 1 the cash machine (POV: his whisper, your PIN, the cash, his gloved hand) · 2 the line-up behind frosted
// glass · 3 the twist: HIS VOICE glows and dies; one green mark survives · 4 the two replays, SHTRAIGHT lit as it's said,
// the numbers waiting below; "four" lights the 4 · 5 four in the line-up · 6 the why: five pitch lines, his whisper flat;
// each S in its gap, green only where it's SH · 7 the endings: four in a cell; then the man you picked in one, four
// walking out · 8 the dare: a friend in silhouette, an earbud · 9 the case file (engine/casefile.js) · the end card.
// Motion test 3 (23 Nov) answers the second fresh review: nothing names number four before "four"; the endings and the
// friend drawn as the line-up's men, big, in real places; the WANTED poster gone (a framed portrait); three times the
// line-up's life; green marks only where it's SH; the theft longer; frame 0's game line lit and bigger.
(() => {
  const { W, H, rnd, rs, clamp, lerp, E, held, frameOf } = LAB;
  const NE = window.NEON, CF = window.CASEFILE;
  const deg = Math.PI / 180, TAU = Math.PI * 2;

  // ---------------------------------------------------------------- the clock, from the placed words
  const WD = {};
  for (const w of window.WORDS || []) (WD[w.p] = WD[w.p] || []).push(w);
  const P = (id) => { const ws = WD[id]; if (!ws) throw new Error(`no placed words for ${id}`); return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, w: ws }; };
  const word = (id, i) => WD[id][Math.min(i, WD[id].length - 1)];
  const wordOf = (id, re) => WD[id].find((w) => re.test(w.w)) || WD[id][0];
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
    twist: P('N10').t0 - 0.2,                  // "I told you to remember his voice."
    voiceW: wordOf('N10', /voice/i).t0,
    never: word('N11', 1).t0 - 0.05,           // "He never let you hear it."
    came: wordOf('N13', /came/i).t0,           // "But one thing came through."
    listen: P('N13B').t0,                      // "Listen."
    replay: P('RW').t0 - 0.2,                  // the replays
    hearS: wordOf('N14', /^S/).t0,             // "Hear the S?"
    four: wordOf('N15', /four/i).t0,           // "It's number four."
    answer: wordOf('N15', /four/i).t1 + 0.2,   // then four, lit, in the line-up
    why: P('N12').t0 - 0.15,                   // "He whispered, and a whisper has no pitch..."
    whispered: word('N12', 1).t0, nopitch: word('N12', 6).t0,
    s: word('N16', 1).t0,                      // "An S never uses your vocal cords..."
    end1: P('N17').t0 - 0.25, picked: wordOf('N17', /picked/i).t0, caught: wordOf('N17', /caught/i).t0,
    end2: P('N18').t0 - 0.15, didnt: wordOf('N18', /didn/i).t0, walks: wordOf('N18', /walks/i).t0, jail: wordOf('N18', /jail/i).t0,
    dare: P('N19').t0 - 0.25, friend: wordOf('N19', /^friend/i).t0, sWord: P('N20').w[P('N20').w.length - 1].t0,
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
  const dark = 0.03;                                                                 // unlit glass, still visible
  const MAROON = '#b4234a';                                                          // his cap, in a tube
  // neon lettering for words: no painted-out glass between the letters (it reads as stray lines at phone size)
  const tx = (Sg, str, cx, top, h, col, k, o = {}) => Sg.text(str, cx, top, h, col, k, { block: false, ...o });
  function camM(c) {
    const cx = W / 2, cy = H / 2, a = c.s * Math.cos(c.r), b = c.s * Math.sin(c.r);
    return [a, b, -b, a, cx + c.x - (a * cx - b * cy), cy + c.y - (b * cx + a * cy)];
  }
  const scratch = (() => { let c; return () => { if (!c) { c = document.createElement('canvas'); c.width = W; c.height = H; } const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; return { c, g }; }; })();
  const frost = () => LAB.tex('frost47', W, H, (g) => {
    const im = g.createImageData(W, H), d = im.data, R = C.mulberry32(4747);
    for (let i = 0; i < W * H; i++) { const v = 200 + R() * 55; d[i * 4] = v; d[i * 4 + 1] = v + 6; d[i * 4 + 2] = v + 18; d[i * 4 + 3] = 18 + R() * 26; }
    g.putImageData(im, 0, 0);
  });
  // the hooded head and shoulders (him, in the glass), as a path at scale s with its top at (cx, top)
  function hoodPath(g, cx, top, s = 1) {
    g.beginPath();
    g.moveTo(cx - 100 * s, top + 262 * s); g.bezierCurveTo(cx - 118 * s, top + 132 * s, cx - 90 * s, top + 32 * s, cx, top);
    g.bezierCurveTo(cx + 82 * s, top + 22 * s, cx + 110 * s, top + 122 * s, cx + 98 * s, top + 262 * s);
    g.quadraticCurveTo(cx + 190 * s, top + 280 * s, cx + 210 * s, top + 392 * s); g.lineTo(cx - 212 * s, top + 392 * s);
    g.quadraticCurveTo(cx - 192 * s, top + 280 * s, cx - 100 * s, top + 262 * s); g.closePath();
  }
  // the line-up's man, standing, feet at (cx, foot): the same build as behind the glass, with legs. o.walk 0..3 (a
  // stride in four drawings), o.bob, o.slump (0..1), o.look (-1..1: his head turned), o.hands ('bars': gripping)
  function manPts(cx, foot, s, o = {}) {
    const st = o.walk == null ? 0 : [1, 0, -1, 0][o.walk % 4], bob = (o.walk != null && o.walk % 2 === 1 ? -8 : 0) * s;
    const sl = (o.slump || 0) * 26 * s, y = (v) => foot + (v + bob / s) * s;
    return {
      head: { x: cx + (o.look || 0) * 10 * s, y: y(-570) + sl, rx: 46 * s, ry: 56 * s, tilt: (o.look || 0) * 10 * deg + (o.slump || 0) * 14 * deg },
      body: [[cx - 74 * s, y(-236)], [cx - 72 * s, y(-430) + sl * 0.6], [cx - 30 * s, y(-476) + sl], [cx + 30 * s, y(-476) + sl], [cx + 72 * s, y(-430) + sl * 0.6], [cx + 74 * s, y(-236)]],
      legL: [[cx - 40 * s, y(-236)], [cx - 40 * s + st * 30 * s, y(0)]], legR: [[cx + 40 * s, y(-236)], [cx + 40 * s - st * 30 * s, y(0)]],
      neck: [cx - 17 * s, y(-524) + sl, 34 * s, 50 * s], s,
    };
  }
  function manFill(g, m) {
    g.fillStyle = 'rgba(6,5,12,0.98)';
    g.save(); g.translate(m.head.x, m.head.y); g.rotate(m.head.tilt); g.beginPath(); g.ellipse(0, 0, m.head.rx, m.head.ry, 0, 0, TAU); g.fill(); g.restore();
    g.fillRect(...m.neck);
    g.beginPath(); g.moveTo(...m.body[0]); for (const p of m.body.slice(1)) g.lineTo(...p); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(6,5,12,0.98)'; g.lineCap = 'round'; g.lineWidth = 52 * m.s;
    for (const L of [m.legL, m.legR]) { g.beginPath(); g.moveTo(...L[0]); g.lineTo(...L[1]); g.stroke(); }
  }
  function manRim(S, m, col, k) {
    const h = m.head, pts = [];
    for (let i = 0; i <= 18; i++) { const a = Math.PI * (0.8 + 1.4 * i / 18) + h.tilt; pts.push([h.x + Math.cos(a) * h.rx, h.y + Math.sin(a) * h.ry]); }
    S.tube(pts, col, k, 5, { smooth: true });
    S.tube(m.body.slice(0, 3), col, k, 5); S.tube(m.body.slice(3), col, k, 5);
  }

  // ---------------------------------------------------------------- the camera (on twos)
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
    else if (t < T.replay) s = 1.06 - 0.02 * E.inOut(clamp((t - T.twist) / 1.5)) + 0.03 * E.inOut(clamp((t - T.listen) / 0.8));
    else if (t < T.answer) s = 1 + 0.03 * E.inOut(clamp((t - T.replay) / (T.answer - T.replay)));
    else if (t < T.why) s = 1.0 + 0.05 * E.out(clamp((t - T.answer) / 1.0));
    else if (t < T.end1) s = 1 + 0.06 * E.inOut(clamp((t - T.why) / (T.end1 - T.why)));                // a slow push on the chart
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
    LAB.scenery(() => tx(S, 'CASH', 540, 538, 28, 'pink', NE.tired(t, 'cashsign', 0.35) * 0.8));
    // the PIN: four keys, and four stars on the glass as each goes in
    for (let i = 0; i < KEYS.length; i++) {
      const p = PIN.find((q) => q.key === i), on = p && t >= p.t && t < p.t + 0.16;
      S.tube(circ(KEYS[i].x, KEYS[i].y, 16, 18), on ? 'yellow' : 'white', on ? 1 : 0.3, 5, { closed: true });
    }
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

  // ---------------------------------------------------------------- shots 2, 3, 5: the line-up behind frosted glass
  const PANEL = { x0: 170, y0: 560, x1: 910, y1: 1150 };
  const SLOT = (k) => PANEL.x0 + (PANEL.x1 - PANEL.x0) * (k - 0.5) / 5;
  const PHASE = [0, 2.1, 4.4, 1.3, 3.5];                                                  // the same life for each man, out of step
  function speaker(t) {                       // who's speaking now (0 = nobody), and his voice's loudness
    for (const s of SPEAK) if (t >= s.v.t0 - 0.05 && t <= s.v.t1 + 0.12) return { k: s.k, a: envAt(`L${s.k}`, t) };
    return { k: 0, a: 0 };
  }
  function lineupFills(g, t, mode) {
    const { x0, y0, x1, y1 } = PANEL;
    const sp = mode === 'reveal' ? { k: 4, a: 0.6 } : mode === 'line' ? speaker(t) : { k: 0, a: 0 };
    const power = mode === 'dim' ? 0.4 : mode === 'low' ? 0.18 : 1;
    const bg = g.createLinearGradient(0, y0, 0, y1);
    bg.addColorStop(0, `rgba(150,180,220,${0.5 * power})`); bg.addColorStop(1, `rgba(70,90,130,${0.4 * power})`);
    g.fillStyle = bg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let k = 1; k <= 5; k++) {                                                        // a pool of light behind whoever speaks, pulsing with him
      const hot = sp.k === k ? (mode === 'reveal' ? 1 : 0.35 + 0.65 * sp.a) : 0;
      if (hot <= 0) continue;
      const rg = g.createRadialGradient(SLOT(k), y0 + 170, 10, SLOT(k), y0 + 220, 210);
      const c = mode === 'reveal' ? '255,90,150' : '200,235,255';
      rg.addColorStop(0, `rgba(${c},${0.7 * hot})`); rg.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = rg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    // five men the same height and build behind the glass: each breathes, shifts his weight and turns his head, the
    // same amount for every man (so nothing on screen picks one), out of step with each other
    const s = scratch();
    s.g.fillStyle = 'rgba(4,6,16,0.94)';
    for (let k = 1; k <= 5; k++) {
      const ph = PHASE[k - 1], cx = SLOT(k) + 18 * Math.sin(t * TAU / 5.3 + ph);
      const br = 1 + 0.035 * Math.sin(t * TAU / 3.6 + ph * 1.7), tilt = 7 * deg * Math.sin(t * TAU / 4.4 + ph * 0.9);
      s.g.globalAlpha = mode === 'reveal' && k !== 4 ? 0.5 : 1;
      s.g.save(); s.g.translate(cx, y1); s.g.scale(1, br); s.g.translate(-cx, -y1);
      s.g.save(); s.g.translate(cx, y0 + 230); s.g.rotate(tilt); s.g.translate(-cx, -(y0 + 230));
      s.g.beginPath(); s.g.ellipse(cx, y0 + 168, 44, 54, 0, 0, TAU); s.g.fill();
      s.g.restore();
      s.g.fillRect(cx - 17, y0 + 208, 34, 40);
      s.g.beginPath(); s.g.moveTo(cx - 72, y1 + 10); s.g.lineTo(cx - 70, y0 + 300); s.g.quadraticCurveTo(cx - 66, y0 + 252, cx - 28, y0 + 244);
      s.g.lineTo(cx + 28, y0 + 244); s.g.quadraticCurveTo(cx + 66, y0 + 252, cx + 70, y0 + 300); s.g.lineTo(cx + 72, y1 + 10); s.g.closePath(); s.g.fill();
      s.g.restore();
    }
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    g.globalAlpha = 0.35 + 0.65 * power; g.filter = 'blur(7px)'; g.drawImage(s.c, 0, 0); g.filter = 'none';
    g.globalAlpha = 0.9 * power + 0.1; g.drawImage(frost(), x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    g.restore();
  }
  function lineupTubes(S, t, th, mode) {
    const { x0, y0, x1, y1 } = PANEL, sp = mode === 'reveal' ? { k: 4, a: 1 } : mode === 'line' ? speaker(th) : { k: 0, a: 0 };
    const dim = mode === 'dim' ? 0.45 : mode === 'low' ? 0.2 : 1;
    S.tube(rr(x0, y0, x1, y1, 10), 'white', 0.55 * dim, 6, { closed: true });
    tx(S, 'POLICE', 540, 336, 44, 'cyan', 0.8 * NE.tired(t, 'police', 0.25) * dim);
    for (const s of SPEAK) {                                                             // the numbers, lit as they're called
      const on = mode === 'reveal' ? 1 : lit(t, s.n.t0 - 0.06);
      const k = mode === 'reveal' ? (s.k === 4 ? 1 : 0.22) : (sp.k === s.k ? 1 : on * 0.55);
      tx(S, String(s.k), SLOT(s.k), 444, 64, mode === 'reveal' && s.k === 4 ? 'pink' : 'cyan', Math.max(dark, k * dim));
      if (sp.k === s.k && mode === 'line') {                                             // his voice, as a wave under his place
        const pts = [], amp = 8 + 40 * sp.a, cx = SLOT(s.k);
        for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([cx - 66 + 132 * u, 1206 + Math.sin(u * 18 + th * 26) * amp * Math.sin(Math.PI * u)]); }
        S.tube(pts, 'cyan', 1, 5, { smooth: true });
      }
    }
  }

  // ---------------------------------------------------------------- shot 3: HIS VOICE glows, dies on "never"; one mark survives
  function whisperWave(S, t, th) {
    const e = ENV.W2, x0 = 170, x1 = 910, y = 1300;
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const u = i / 64, a = e ? e.rms[Math.min(e.rms.length - 1, Math.floor(u * e.rms.length))] : 0.5;
      pts.push([lerp(x0, x1, u), y + Math.sin(u * 70 + th * 9) * 78 * a * Math.sin(Math.PI * u)]);
    }
    const k = t < T.never ? lit(t, P('N10').t0 - 0.05) * 0.95 : NE.flick(t, T.never, [0.6, 0.6, 0.1, 0.1, 0.45, 0.45, 0.03]);
    const low = t >= T.listen ? 0.4 : 1;                                                   // on "Listen." all but the mark goes down
    S.tube(pts, 'violet', Math.max(dark, k * low), 8, { smooth: true });
    if (t >= T.voiceW - 0.05) tx(S, 'HIS VOICE', 540, 1150, 44, 'violet', Math.max(dark, (t < T.never ? lit(t, T.voiceW - 0.05) : k) * low));
    if (t >= T.never && t < T.never + 0.5) NE.sparks(S, 540, y, t, T.never + 0.16, 'dead', 12, 0.34);
    // "But one thing came through": one point on the dead wave lights green, where his SH was; on "Listen." it swells
    if (t >= T.came - 0.05 && e) {
      const w = wordOf('W2', /straight/i), u0 = (w.t0 - e.t0) / (e.rms.length / 30);
      const sw = t >= T.listen ? 1 + 0.5 * E.out(clamp((t - T.listen) / 0.3)) : 1;
      const xa = lerp(x0, x1, u0), xb = lerp(x0, x1, u0 + 0.075), xc = (xa + xb) / 2, hw = (xb - xa) / 2 * sw;
      S.tube([[xc - hw, y], [xc + hw, y]], 'green', lit(t, T.came - 0.05), 12 * sw);
    }
  }

  // ---------------------------------------------------------------- shot 4: the two replays, the word lit as it's said
  const NUM_Y = 1330;
  function clueWord(S, t, id, top, col, label, labelCol) {
    const w = wordOf(id, /straight/i), p = P(id);
    if (t < p.t0 - 0.12) return;                                                         // nothing before his voice plays
    tx(S, label, 540, top - 70, 40, labelCol, lit(t, p.t0 - 0.12) * 0.9);
    const u = clamp((t - w.t0) / Math.max(0.2, w.t1 - w.t0));                          // how far through "straight" he is
    const said = t >= w.t0 - 0.02, shHot = t >= w.t0 - 0.02 && t < w.t0 + 0.22;
    const pop = t >= T.hearS - 0.05 ? 1 + 0.35 * E.out(clamp((t - T.hearS + 0.05) / 0.2)) : 1;   // "Hear the S?": the SH swells
    const rest = t >= T.hearS - 0.05 ? 0.45 : 0.95;                                        // ...and the rest of the word steps back
    const h = 92, u6 = h / 6, L = 540 - NE.textWidth('SHTRAIGHT', h) / 2;
    const shC = L + NE.textWidth('SH', h) / 2, trC = L + 11.2 * u6 + NE.textWidth('TRAIGHT', h) / 2;
    // only what he has said is drawn: no letter shows, lit or dark, before his voice reaches it
    tx(S, 'TRAIGHT', trC, top, h, col, (i) => (said && i / 7 <= u + 0.05 ? rest : 0));
    if (said) { S.push(shC, top + h / 2, 0, pop); tx(S, 'SH', 0, -h / 2, h, 'green', shHot || pop > 1 ? 1 : 0.75); S.pop(); }
  }
  function replayTubes(S, t) {
    clueWord(S, t, 'RW', 640, 'violet', 'WHAT YOU HEARD', 'violet');
    const named = t >= T.four - 0.03;                                                      // nothing names four before "four"
    clueWord(S, t, 'R4', 1010, named ? 'pink' : 'cyan', named ? 'NUMBER 4' : 'ONE OF THE FIVE', named ? 'pink' : 'cyan');
    for (let k = 1; k <= 5; k++) tx(S, String(k), 540 + (k - 3) * 130, NUM_Y, 70, named && k === 4 ? 'pink' : 'cyan', named ? (k === 4 ? lit(t, T.four - 0.03) : 0.2) : 0.4);
  }

  // ---------------------------------------------------------------- shot 6: the why: five pitch lines; his has none
  const ROWS = { x0: 190, x1: 900, y: [540, 660, 780, 900, 1020], wy: 1160 };
  function chartTubes(S, t) {
    const t0 = T.why + 0.08;
    const pulse = 0.75 + 0.25 * Math.sin((t - T.s) * TAU / 1.2);                           // the S marks breathe once they're lit
    for (let k = 1; k <= 5; k++) {
      const e = ENV[`L${k}`], y = ROWS.y[k - 1], d0 = t0 + 0.12 * (k - 1), u = clamp((t - d0) / 0.5);
      tx(S, String(k), 140, y - 26, 48, k === 4 ? 'pink' : 'cyan', Math.max(dark, 0.8 * lit(t, d0)));
      if (!e) continue;
      const n = e.f0.length, seg = [], col = k === 4 ? 'pink' : 'cyan';
      const flush = () => { if (seg.length > 1) S.tube(seg.slice(), col, 0.95, 6, { smooth: true }); seg.length = 0; };
      const nDraw = Math.floor(u * (n - 1));                                              // each line traces itself left to right
      for (let i = 0; i <= nDraw; i++) {
        const f = e.f0[i];
        if (f > 0) seg.push([lerp(ROWS.x0, ROWS.x1, i / (n - 1)), y + 40 - clamp((f - 80) / 110) * 80]); else flush();
      }
      flush();
      // "An S never uses your vocal cords": the gaps where the voice stops: his (four's) green, his SH; the others white
      if (t >= T.s - 0.05) {
        const first = e.f0.findIndex((f) => f > 0), last = n - 1 - [...e.f0].reverse().findIndex((f) => f > 0);
        for (let i = first; i < last; i++) {
          if (e.f0[i] > 0) continue;
          let j = i; while (j < last && !(e.f0[j] > 0)) j++;
          S.tube([[lerp(ROWS.x0, ROWS.x1, i / (n - 1)), y + 10], [lerp(ROWS.x0, ROWS.x1, Math.max(i + 0.6, j - 1) / (n - 1)), y + 10]], k === 4 ? 'green' : 'white', lit(t, T.s + 0.05 * k) * (k === 4 ? pulse : 0.55), 9);
          i = j;
        }
      }
    }
    // his whisper: the same words, no pitch at all, flat dark glass; the SH in it lights green with four's
    const wy = ROWS.wy;
    S.tube([[ROWS.x0, wy], [ROWS.x1, wy]], 'violet', dark, 8);
    if (t >= T.whispered) tx(S, 'HIS WHISPER', 540, wy + 30, 40, 'violet', lit(t, T.whispered) * 0.85);
    if (t >= T.nopitch) tx(S, 'NO PITCH', 540, 1290, 70, 'pink', lit(t, T.nopitch - 0.05) * (t > T.s - 0.6 ? 0.45 : 1));
    if (t >= T.s - 0.05) {
      const e = ENV.W2, w = wordOf('W2', /straight/i);
      const u0 = e ? (w.t0 - e.t0) / (e.rms.length / 30) : 0.3;
      S.tube([[lerp(ROWS.x0, ROWS.x1, u0), wy], [lerp(ROWS.x0, ROWS.x1, u0 + 0.07), wy]], 'green', lit(t, T.s + 0.3) * pulse, 12);
    }
  }

  // ---------------------------------------------------------------- shot 7: the two endings, big, in real places
  function bars(S, x0, x1, y0, y1, u, k) {
    const n = 6, w = (x1 - x0);
    for (let i = 0; i < n; i++) { const x = x0 + w * (i + 0.5) / n + (1 - u) * w * 1.15; if (x < x1 + 2) S.tube([[x, y0], [x, y1]], 'white', k, 7); }
    if (u > 0.95) { S.tube([[x0, y0], [x1, y0]], 'white', k, 7); S.tube([[x0, y1], [x1, y1]], 'white', k, 7); }
  }
  function ending1(g, S, t) {                                    // "If you picked four, you caught him by one sound."
    tx(S, 'PICKED 4', 540, 330, 52, 'cyan', lit(t, T.picked - 0.04));
    const shut = mj(clamp((t - T.caught) / 0.5)), slump = mj(clamp((t - T.caught - 0.6) / 0.7));
    const m = manPts(540, 1420, 1.25, { slump, look: 0.25 * Math.sin(t * TAU / 3.1) * (1 - slump) });
    manFill(g, m); manRim(S, m, 'pink', 1);
    tx(S, '4', 540, 1420 - 360 * 1.25, 80, 'pink', 1);
    bars(S, 300, 780, 560, 1440, shut, 1);
  }
  function ending2(g, S, t) {                                    // "If you didn't, he walks, and the man you picked goes to jail..."
    tx(S, "IF YOU DIDN'T", 540, 330, 48, 'cyan', lit(t, T.didnt - 0.04));
    // the man you picked, in a cell on the left: the bars close on "jail", then he grips them
    const jail = mj(clamp((t - T.jail) / 0.5)), grip = clamp((t - T.jail - 0.5) / 0.3);
    const inn = manPts(290, 1430, 0.95, { look: 0.3 * Math.sin(t * TAU / 2.7) * (1 - grip) });
    manFill(g, inn); manRim(S, inn, 'white', 0.9);
    tx(S, '?', 290, 1430 - 360 * 0.95, 70, 'white', 0.9);
    bars(S, 120, 460, 760, 1450, jail, 0.95);
    if (grip > 0) for (const hx of [214, 366]) { g.fillStyle = 'rgba(6,5,12,0.98)'; g.beginPath(); g.ellipse(hx, 1000 - 10 * (1 - grip), 22, 28, 0, 0, TAU); g.fill(); S.tube(circ(hx, 1000 - 10 * (1 - grip), 22, 12, Math.PI, TAU), 'white', 0.8 * grip, 4); }
    // the station door on the right, EXIT over it
    S.tube([[770, 1450], [770, 720], [930, 720], [930, 1450]], 'green', 0.75, 7);
    tx(S, 'EXIT', 850, 652, 46, 'green', 0.95);
    // four walks out: a stride in four drawings on twos, a bob, one glance back at the cell, and through the door
    const wk = clamp((t - T.walks) / 1.9);
    if (wk < 1) {
      const x = lerp(560, 860, mj(wk)), dr = Math.floor(held(t, 2) * 7.5) % 4;
      const look = wk > 0.35 && wk < 0.6 ? -1 : 0;
      const m = manPts(x, 1440, 0.95, { walk: wk > 0 && wk < 1 ? dr : null, look });
      const fade = 1 - clamp((x - 820) / 40);
      g.save(); g.globalAlpha = fade; manFill(g, m); g.restore();
      manRim(S, m, 'pink', fade);
      tx(S, '4', x, 1440 - 360 * 0.95, 70, 'pink', fade);
    }
  }

  // ---------------------------------------------------------------- shot 8: the dare: a friend in silhouette, an earbud
  const PHONE = { x0: 600, y0: 660, x1: 880, y1: 1180 };
  const S_ON_PHONE = { x: 740, y: 960 };
  // her profile, facing the phone: back of the head, brow, nose, lips, chin, neck, shoulders
  const FACE = [[260, 1080], [228, 960], [236, 860], [292, 784], [372, 772], [418, 812], [426, 852], [452, 902], [428, 918], [436, 940], [426, 952], [432, 972], [418, 1000], [380, 1022], [372, 1080], [470, 1130], [520, 1300], [120, 1300], [170, 1120]];
  function portrait(S, k) {      // the man with the mole, once: a framed photo on her wall (no text), small and soft
    S.push(150, 430, -3 * deg, 1);
    const q = 0.38 * k;
    S.tube(rr(-52, 0, 52, 132, 6, 2), 'white', q, 4, { closed: true });
    S.tube(circ(0, 82, 24, 18), 'white', q, 4, { closed: true });                          // his face
    S.tube([[-27, 64], [-24, 52], [0, 46], [24, 52], [27, 64], [-27, 64]], MAROON, 0.55 * k, 5);   // the maroon cap first
    S.tube([[27, 64], [42, 66]], MAROON, 0.55 * k, 5);                                    // its brim
    S.tube(circ(10, 88, 2, 8), 'white', q, 3, { closed: true });                          // the mole: his left cheek, the screen's right
    S.pop();
  }
  function dareFills(g, t, th, fade) {
    const nod = 4 * Math.sin(th * TAU / 1.1) * clamp((t - T.friend) / 0.3);
    g.save(); g.globalAlpha = fade; g.translate(0, nod);
    g.fillStyle = 'rgba(6,5,12,0.98)'; g.beginPath(); g.moveTo(...FACE[0]); for (const p of FACE.slice(1)) g.lineTo(...p); g.closePath(); g.fill();
    g.restore();
  }
  function dareTubes(S, t, th, fade) {
    const k = fade, nod = 4 * Math.sin(th * TAU / 1.1) * clamp((t - T.friend) / 0.3);
    portrait(S, k);
    S.push(0, nod, 0, 1);
    S.tube(FACE.slice(2, 15), 'white', k, 6, { smooth: true });                            // the light along her face
    const shut = mj(clamp((t - T.friend) / 0.25));                                        // eyes open, then shut as she listens
    if (shut < 0.5) S.tube(circ(392, 846, 7, 8), 'white', k, 4, { closed: true });
    else S.tube([[380, 850], [392, 856], [404, 850]], 'white', k, 4, { smooth: true });
    const bud = mj(clamp((t - T.friend + 0.35) / 0.35));                                  // the earbud goes in
    const bx = lerp(420, 300, bud), by = lerp(1060, 880, bud);
    S.tube(circ(bx, by, 14, 10), 'cyan', k, 5, { closed: true });
    S.pop();
    S.tube([[bx + 4, by + 14 + nod], [330, 1040], [470, 1180], [PHONE.x0 + 40, PHONE.y1]], 'cyan', k * 0.75, 4, { smooth: true });
    if (bud >= 1) for (let i = 0; i < 2; i++) {
      const ph = ((t * 1.4 + i / 2) % 1);
      S.tube(circ(300, 880 + nod, 24 + 28 * ph, 8, 0.65 * Math.PI, 1.35 * Math.PI), 'cyan', k * (1 - ph) * 0.8, 4);
    }
    S.tube(rr(PHONE.x0, PHONE.y0, PHONE.x1, PHONE.y1, 34), 'cyan', k, 8, { closed: true });  // the phone, playing this test
    S.tube([[710, 696], [770, 696]], 'cyan', k * 0.7, 5);
    const playing = Math.floor(th * 2.5) % 5;                                                // its line-up, one number after another
    for (let i = 0; i < 5; i++) tx(S, String(i + 1), 650 + i * 45, 750, 34, 'cyan', k * (i === playing && t < T.sWord ? 1 : 0.35));
    for (let i = 0; i < 5; i++) S.tube(circ(650 + i * 45, 850, 13, 10), 'white', k * (i === playing && t < T.sWord ? 0.9 : 0.4), 4, { closed: true });
  }
  function keyS(S, x, y, s, k) { tx(S, 'S', x, y - 60 * s, 120 * s, 'green', k); }

  // ---------------------------------------------------------------- shot 9: the case file (engine/casefile.js), in neon
  // Draw order (casefile.js): folder 47's back and the S → 47's cover, solid, with its stamp → 48 whole, solid, on top.
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
  function caseBack(S, t) {                                    // in the main pass: 47's back, and the S on its way in
    const E1 = CF.ending(t, END, { from: S_ON_PHONE });
    if (E1.a.on) folderBack(S, E1.a, 1);
    if (E1.drop.on) keyS(S, E1.drop.x, E1.drop.y, E1.drop.s, 1);
  }
  function caseFront(g, t, M) {                                // then 47's cover over it, then 48 on top: each solid
    const E1 = CF.ending(t, END, { from: S_ON_PHONE }), sc = Math.hypot(M[0], M[1]);
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
  function caseTab(U, t) {
    const p = CF.tab(t); if (!p.on) return;
    const A = CF.TAB, sb = A.stamp;
    const k = p.k < 1 ? NE.off(t, CF.T.tabOut) * p.k : 1;                               // it goes out like a sign
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
    U.tube(rr(596, 294, 940, 364, 34, 4), 'yellow', 0.7, 4, { closed: true });
    U.tube([[628, 318], [640, 318], [654, 306], [654, 352], [640, 340], [628, 340], [628, 318]], 'yellow', 0.9, 4);
    U.tube(circ(658, 329, 12, 8, -0.35 * Math.PI, 0.35 * Math.PI), 'yellow', 0.75, 4);
    U.tube(circ(658, 329, 21, 10, -0.35 * Math.PI, 0.35 * Math.PI), 'yellow', 0.6, 4);
    tx(U, 'SOUND ON', 812, 311, 36, 'yellow', 0.92);
    // the game, lit on frame 0; it leaves with his words when the narrator finishes
    const offW = outAt(t, P('N01').t1 + 0.2);
    tx(U, "YOU'LL PICK HIM BY HIS VOICE", 540, 400, 36, 'white', 0.92 * offW);
    // his words, as he whispers them: the whole line readable on frame 0, each word full as it's said
    const ws = P('W1').w, kw = (i) => (i === 0 || t >= ws[i].t0 - 0.03 ? 1 : 0.55);
    tx(U, "DON'T TURN", 540, 1338, 80, 'white', (i) => (i < 5 ? kw(0) : kw(1)) * offW);
    tx(U, 'AROUND.', 540, 1432, 80, 'white', kw(2) * offW);
  }

  // ---------------------------------------------------------------- the frame
  LAB.film({
    to: 'end', start: false,
    draw(g, t) {
      const th = held(t, 2);
      const cam = camAt(th), M = camM(cam);
      const S = NE.sign(), U = NE.sign();
      S.push(M[4], M[5], cam.r, cam.s);                                                    // the camera, for every tube that follows
      g.save(); g.setTransform(...M);
      g.drawImage(NE.wall(), -260, -200, W + 520, H + 400);
      if (t < T.lineup) atmFills(g, th);
      else if (t < T.twist) lineupFills(g, th, 'line');
      else if (t < T.replay) lineupFills(g, th, t >= T.listen ? 'low' : 'dim');
      else if (t >= T.answer && t < T.why) lineupFills(g, th, 'reveal');
      else if (t >= T.why && t < T.why + 0.45) lineupFills(g, th, 'dim');                  // the line-up goes down as the chart comes up
      else if (t >= T.end1 && t < T.end2) ending1(g, S, th);
      else if (t >= T.end2 && t < T.dare) ending2(g, S, th);
      else if (t >= T.dare) { const fade = 1 - clamp((t - (END + CF.T.a0 - 0.25)) / 0.3); if (fade > 0) dareFills(g, t, th, fade); }
      g.restore();
      if (t < T.lineup) atmTubes(S, th);
      else if (t < T.twist) lineupTubes(S, t, th, 'line');
      else if (t < T.replay) { lineupTubes(S, t, th, t >= T.listen ? 'low' : 'dim'); whisperWave(S, t, th); }
      else if (t < T.answer) replayTubes(S, t);
      else if (t < T.why) lineupTubes(S, t, th, 'reveal');
      else if (t < T.end1) { if (t < T.why + 0.45) lineupTubes(S, t, th, 'dim'); chartTubes(S, t); }
      else if (t < T.dare) { /* the endings' tubes were added with their fills */ }
      else {
        const fade = 1 - clamp((t - (END + CF.T.a0 - 0.25)) / 0.3);                         // the friend and phone go before the folder rises
        if (fade > 0) dareTubes(S, t, th, fade);
        if (t >= T.sWord - 0.02 && t < END + CF.T.drop0) keyS(S, S_ON_PHONE.x, S_ON_PHONE.y, 1, lit(t, T.sWord - 0.02));
        caseBack(S, t);
      }
      S.pop();
      S.flush(g, { wall: false });
      if (t >= T.dare) caseFront(g, t, M);
      if (t < T.lineup) hookTubes(U, t);
      if (t >= T.lineup && t < T.twist) {
        if (t < T.charged) tx(U, 'CLOSE YOUR EYES', 540, 1290, 58, 'pink', lit(t, P('N02').t0 - 0.04));
        else if (t < P('N03B').t1 + 1.3) tx(U, 'CHARGED TONIGHT', 540, 1290, 58, 'yellow', lit(t, T.charged - 0.04) * outAt(t, P('N03B').t1 + 1.0));
        if (t >= P('N09').t0 - 0.04) {
          tx(U, 'PICK ONE', 520, 1290, 64, 'yellow', lit(t, P('N09').t0 - 0.04));
          const u = clamp((held(t, 2) - T.bar0) / (T.bar1 - T.bar0));                    // a ring that runs out, beside the words
          if (u < 1) U.tube(circ(820, 1322, 34, 36, -Math.PI / 2 + u * TAU, 1.5 * Math.PI), 'yellow', 0.95, 7);
        }
      }
      caseTab(U, t);
      U.flush(g, { wall: false });
      LAB.safeOverlay(g);
    },
  });
  UI.endcard();
  C.start();
})();
