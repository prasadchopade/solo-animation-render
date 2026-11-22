// Reel 47 Close Your Eyes: the picture, in the neon look (engine/neon47) with the case file (engine/casefile.js).
// Every shot is timed from the placed voices (film/words.js, from place_vo.py + plan_vo.py) and each voice's loudness
// and pitch line (film/env.js, from env.py). A pure function of t: any frame paints the same in any order. Drawings,
// characters and the camera are held on twos (LAB.held); only a tube's light may change on single frames, as a real
// sign's does.
//
// Shots: 1 the cash machine (POV: his whisper, your PIN, the cash, his gloved hand) · 2 the line-up behind frosted
// glass · 3 the twist: his whisper glows and dies · 4 the two replays: SHTRAIGHT lights as it's said, the SH green ·
// 5 the answer: four lit · 6 the why: five pitch lines and his flat whisper; the gaps where an S lives · 7 the two
// endings · 8 the dare · 9 the case file's ending (engine/casefile.js) · the end card.
// Motion test 2 (23 Nov), after the fresh review of motion test 1: a real turn at frame 0, life in every hold, the
// answer before the why, the clue big enough to read, silhouettes instead of sign icons, text only with its words.
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
    cash: P('W2').t1 + 0.12,                   // the notes come out
    grab: P('W2').t1 + 0.42,                   // his hand
    lineup: P('N02').t0 - 0.10,                // cut on "Close your eyes"
    charged: word('N03', 10).t0,               // "charged"
    bar0: P('N09').t1 + 0.05, bar1: P('N09').t1 + 2.05,
    twist: P('N10').t0 - 0.2,                  // "I told you to remember his voice."
    never: word('N11', 1).t0 - 0.05,           // "He never let you hear it."
    replay: P('RW').t0 - 0.2,                  // the replays ("But one thing came through. Listen." is over the dimmed line-up)
    answer: P('N15').t0 - 0.1,                 // "Number four."
    why: P('N12').t0 - 0.15,                   // "He whispered, and a whisper has no pitch..."
    whispered: word('N12', 1).t0, nopitch: word('N12', 6).t0,
    s: word('N16', 1).t0,                      // "An S never uses your vocal cords..."
    split: P('N17').t0 - 0.25, right: P('N18').t0 - 0.05,
    dare: P('N19').t0 - 0.25, friend: wordOf('N19', /^friend/i).t0, sWord: word('N20', 4).t0,
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
  // the hooded head and shoulders (him: in the glass, and in the endings), as a path at scale s with its top at (cx, top)
  function hoodPath(g, cx, top, s = 1) {
    g.beginPath();
    g.moveTo(cx - 100 * s, top + 262 * s); g.bezierCurveTo(cx - 118 * s, top + 132 * s, cx - 90 * s, top + 32 * s, cx, top);
    g.bezierCurveTo(cx + 82 * s, top + 22 * s, cx + 110 * s, top + 122 * s, cx + 98 * s, top + 262 * s);
    g.quadraticCurveTo(cx + 190 * s, top + 280 * s, cx + 210 * s, top + 392 * s); g.lineTo(cx - 212 * s, top + 392 * s);
    g.quadraticCurveTo(cx - 192 * s, top + 280 * s, cx - 100 * s, top + 262 * s); g.closePath();
  }
  // a bareheaded man's head and shoulders, the same build
  function headPath(g, cx, top, s = 1) {
    g.beginPath(); g.ellipse(cx, top + 92 * s, 70 * s, 88 * s, 0, 0, TAU);
    g.moveTo(cx - 34 * s, top + 168 * s); g.lineTo(cx + 34 * s, top + 168 * s); g.lineTo(cx + 34 * s, top + 214 * s); g.lineTo(cx - 34 * s, top + 214 * s); g.closePath();
    g.moveTo(cx - 200 * s, top + 352 * s); g.quadraticCurveTo(cx - 172 * s, top + 222 * s, cx - 50 * s, top + 206 * s); g.lineTo(cx + 50 * s, top + 206 * s);
    g.quadraticCurveTo(cx + 172 * s, top + 222 * s, cx + 200 * s, top + 352 * s); g.closePath();
  }

  // ---------------------------------------------------------------- the camera (on twos)
  function camAt(t) {
    let x = 0, y = 0, s = 1, r = 0;
    if (t < T.lineup) {
      // frame 0: you start to turn towards him (the scene slides right and tilts), and snap back on "turn"
      const out = E.out(clamp(t / 0.36)) * (1 - clamp((t - T.turn) / 0.1));
      const k = clamp((t - T.turn - 0.1) / 0.32), settle = t > T.turn + 0.1 ? Math.sin(Math.PI * k) * (1 - k) : 0;
      x = 110 * out - 16 * settle; r = -3 * deg * out; s = 1 - 0.03 * out;
      s += 0.05 * E.inOut(clamp((t - P('N01').t0) / (P('N01').t1 - P('N01').t0)));       // closer while you're told
      s += 0.03 * E.out(clamp((t - P('W2').t0) / 0.3));                                   // "Look straight ahead": closer
      x += 8 * Math.sin(t * 0.9) * clamp(t - 1.2);                                         // a held breath's drift
      const grab = clamp((t - T.grab) / 0.6); x += 10 * Math.sin(Math.PI * grab) * (1 - grab);   // his hand brushes you
    } else if (t < T.twist) { s = 1 + 0.06 * E.inOut(clamp((t - T.lineup) / (T.twist - T.lineup))); y = -10 * clamp((t - T.lineup) / 12); }
    else if (t < T.replay) s = 1.06 - 0.02 * E.inOut(clamp((t - T.twist) / 1.5));
    else if (t < T.answer) s = 1 + 0.025 * E.inOut(clamp((t - T.replay) / (T.answer - T.replay)));
    else if (t < T.why) s = 1.0 + 0.05 * E.out(clamp((t - T.answer) / 1.2));
    else if (t < T.split) s = 1 + 0.03 * E.inOut(clamp((t - T.why) / (T.split - T.why)));
    else if (t < T.dare) s = 1 + 0.02 * E.inOut(clamp((t - T.split) / (T.dare - T.split)));
    else s = 1 + 0.035 * E.inOut(clamp((t - (END + CF.T.land1)) / 1.7));                  // the case file: push in on 48
    return { x, y, s, r };
  }

  // ---------------------------------------------------------------- shot 1: the cash machine
  const ATM = { x0: 190, y0: 528, x1: 890, y1: 1306, sx0: 236, sy0: 576, sx1: 844, sy1: 1056 };
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
    const breath = Math.sin(t * TAU / 3.2) * 4;
    const lean = E.out(clamp((t + 0.15) / 0.4));                                          // on "Don't" he leans in to your ear
    const step = mj(clamp((t - T.grab - 0.4) / 0.6));                                     // after the cash he steps back, out of the glass
    if (step < 1) {
      g.save();
      g.translate(470 - 300 * step, 940); g.rotate((12 * lean - 4 * step) * deg); g.scale(1 - 0.12 * step, 1 - 0.12 * step); g.translate(-470, -940);
      g.translate(18 * lean, 8 * lean + breath * 0.5);
      g.fillStyle = 'rgba(4,3,10,0.98)'; hoodPath(g, 470, 662, 1); g.fill();
      g.strokeStyle = 'rgba(205,160,255,0.85)'; g.lineWidth = 5;                          // the lamp catches the hood's edge
      g.beginPath(); g.moveTo(370, 924); g.bezierCurveTo(352, 794, 380, 694, 470, 662); g.bezierCurveTo(520, 672, 548, 700, 562, 750); g.stroke();
      g.restore();
    }
    // YOU: nearer the glass, right of centre; a rim of light on the side towards him, so the two heads never merge
    g.fillStyle = 'rgba(2,6,10,0.98)';
    g.beginPath(); g.ellipse(624, 852 + breath * 0.3, 78, 94, 0, 0, TAU); g.fill();
    g.fillRect(592, 920, 64, 50);
    g.beginPath(); g.moveTo(442, 1060); g.quadraticCurveTo(474, 966, 584, 952); g.lineTo(664, 952); g.quadraticCurveTo(782, 966, 812, 1060); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(170,240,255,0.75)'; g.lineWidth = 5;
    g.beginPath(); g.ellipse(624, 852, 78, 94, 0, Math.PI * 0.62, Math.PI * 1.55); g.stroke();
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
    const out = clamp((t - T.cash) / 0.3), taken = clamp((t - T.grab - 0.2) / 0.45);
    S.tube([[400, 1262], [680, 1262]], out > 0 && taken < 1 ? 'green' : 'orange', out > 0 && taken < 1 ? 1 : 0.5, 7);
    if (out > 0 && taken < 1) {                                                          // the notes fan out
      for (let i = 0; i < 3; i++) {
        const ox = (i - 1) * 26 - 300 * mj(taken), oy = 1266 + 40 * E.out(out) + i * 6 - 30 * mj(taken);
        S.push(540 + ox, oy, (i - 1) * 5 * deg - 20 * deg * mj(taken), 1);
        S.tube(rr(-95, 0, 95, 70, 6, 2), 'green', 0.9, 5, { closed: true });
        S.tube(circ(0, 35, 15, 14), 'green', 0.7, 4, { closed: true });
        S.pop();
      }
    }
    // his gloved hand, from behind your left shoulder: in, closes on the notes, gone
    const reach = mj(clamp((t - T.grab) / 0.32)), back = mj(clamp((t - T.grab - 0.42) / 0.4));
    if (reach > 0 && back < 1) {
      const hx = lerp(-160, 450, reach) - 660 * back, hy = lerp(1350, 1290, reach) - Math.sin(Math.PI * reach) * 40 + 40 * back;
      glove(S, hx, hy, -28 * deg + 12 * deg * back, clamp((t - T.grab - 0.3) / 0.1));
    }
  }
  function glove(S, x, y, rot, shut) {
    S.push(x, y, rot, 1.5);
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
    const power = mode === 'dim' ? 0.4 : 1;
    const bg = g.createLinearGradient(0, y0, 0, y1);
    bg.addColorStop(0, `rgba(150,180,220,${0.5 * power})`); bg.addColorStop(1, `rgba(70,90,130,${0.4 * power})`);
    g.fillStyle = bg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let k = 1; k <= 5; k++) {                                                        // a pool of light behind whoever speaks
      const hot = sp.k === k ? (mode === 'reveal' ? 1 : 0.55 + 0.45 * sp.a) : 0;
      if (hot <= 0) continue;
      const rg = g.createRadialGradient(SLOT(k), y0 + 170, 10, SLOT(k), y0 + 220, 210);
      const c = mode === 'reveal' ? '255,90,150' : '200,235,255';
      rg.addColorStop(0, `rgba(${c},${0.6 * hot})`); rg.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = rg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    // five men the same height and build behind the glass: each breathes, shifts his weight and tilts his head, the
    // same amount for every man (so nothing on screen picks one), out of step with each other
    const s = scratch();
    s.g.fillStyle = 'rgba(4,6,16,0.94)';
    for (let k = 1; k <= 5; k++) {
      const ph = PHASE[k - 1], cx = SLOT(k) + 7 * Math.sin(t * TAU / 5.3 + ph);
      const br = 1 + 0.02 * Math.sin(t * TAU / 3.6 + ph * 1.7), tilt = 3.5 * deg * Math.sin(t * TAU / 4.4 + ph * 0.9);
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
    const dim = mode === 'dim' ? 0.45 : 1;
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

  // ---------------------------------------------------------------- shot 3: his whisper glows, then dies on "never"
  function whisperWave(S, t, th) {
    const e = ENV.W2, x0 = 170, x1 = 910, y = 1300;
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const u = i / 64, a = e ? e.rms[Math.min(e.rms.length - 1, Math.floor(u * e.rms.length))] : 0.5;
      pts.push([lerp(x0, x1, u), y + Math.sin(u * 70 + th * 9) * 78 * a * Math.sin(Math.PI * u)]);
    }
    const k = t < T.never ? lit(t, P('N10').t0 - 0.05) * 0.95 : NE.flick(t, T.never, [0.6, 0.6, 0.1, 0.1, 0.45, 0.45, 0.03]);
    S.tube(pts, 'violet', Math.max(dark, k), 8, { smooth: true });
    if (t >= T.never && t < T.never + 0.5) NE.sparks(S, 540, y, t, T.never + 0.16, 'dead', 12, 0.34);
  }

  // ---------------------------------------------------------------- shot 4: the two replays, the word lit as it's said
  function clueWord(S, t, id, top, col, label) {
    const w = wordOf(id, /straight/i), p = P(id);
    if (t < p.t0 - 0.12) return;                                                         // nothing before his voice plays
    tx(S, label, 540, top - 62, 32, col, lit(t, p.t0 - 0.12) * 0.85);
    const u = clamp((t - w.t0) / Math.max(0.2, w.t1 - w.t0));                          // how far through "straight" he is
    const said = t >= w.t0 - 0.02, shHot = t >= w.t0 - 0.02 && t < w.t0 + 0.22;
    const pulse = t >= P('N14').t0 - 0.05 && t < P('N14').t1 + 0.1 ? 1 : 0;              // "Shtraight.": both SH flare
    // only what he has said is drawn: no letter shows, lit or dark, before his voice reaches it
    tx(S, 'SHTRAIGHT', 540, top, 92, col, (i) => (i >= 2 && said && (i - 2) / 7 <= u + 0.05 ? 0.95 : 0));
    tx(S, 'SHTRAIGHT', 540, top, 92, 'green', (i) => (i < 2 && said ? (shHot || pulse ? 1 : 0.7) : 0));
  }

  // ---------------------------------------------------------------- shot 6: the why: five pitch lines; his has none
  const ROWS = { x0: 190, x1: 900, y: [540, 660, 780, 900, 1020], wy: 1160 };
  function chartTubes(S, t) {
    const t0 = word('N12', 0).t0;
    for (let k = 1; k <= 5; k++) {
      const e = ENV[`L${k}`], y = ROWS.y[k - 1], d0 = t0 + 0.14 * (k - 1), u = clamp((t - d0) / 0.55);
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
      // "An S never uses your vocal cords": the gaps where the voice stops inside his line light green
      if (t >= T.s - 0.05) {
        let i = 0;
        const first = e.f0.findIndex((f) => f > 0), last = n - 1 - [...e.f0].reverse().findIndex((f) => f > 0);
        for (i = first; i < last; i++) {
          if (e.f0[i] > 0) continue;
          let j = i; while (j < last && !(e.f0[j] > 0)) j++;
          S.tube([[lerp(ROWS.x0, ROWS.x1, i / (n - 1)), y + 10], [lerp(ROWS.x0, ROWS.x1, Math.max(i + 0.6, j - 1) / (n - 1)), y + 10]], 'green', lit(t, T.s + 0.05 * k), 9);
          i = j;
        }
      }
    }
    // his whisper: the same words, no pitch at all, flat dark glass; the SH in it lights green with the others
    const wy = ROWS.wy;
    S.tube([[ROWS.x0, wy], [ROWS.x1, wy]], 'violet', dark, 8);
    if (t >= T.whispered) tx(S, 'HIS WHISPER', 540, wy + 30, 32, 'violet', lit(t, T.whispered) * 0.85);
    if (t >= T.nopitch) tx(S, 'NO PITCH', 540, 1270, 70, 'pink', lit(t, T.nopitch - 0.05) * (t > T.s - 0.6 ? 0.45 : 1));
    if (t >= T.s - 0.05) {
      const e = ENV.W2, w = wordOf('W2', /straight/i);
      const u0 = e ? (w.t0 - e.t0) / (e.rms.length / 30) : 0.3;
      S.tube([[lerp(ROWS.x0, ROWS.x1, u0), wy], [lerp(ROWS.x0, ROWS.x1, u0 + 0.07), wy]], 'green', lit(t, T.s + 0.3), 12);
    }
  }

  // ---------------------------------------------------------------- shot 7: the two endings, in silhouette
  function man(g, S, cx, top, s, hooded, rim, k, o = {}) {      // a filled figure with a neon rim; o.walk: drawing 0..3, o.slump
    g.save(); g.globalAlpha = k;
    g.fillStyle = 'rgba(6,5,12,0.98)';
    const dy = (o.slump || 0) * 14 * s;
    g.save(); g.translate(0, dy);
    if (hooded) hoodPath(g, cx, top, s); else headPath(g, cx, top, s);
    g.fill(); g.restore();
    // legs below the shoulders (a walk: four drawings)
    const L = (o.walk == null ? [0, 0] : [[-1, 1], [0, 0], [1, -1], [0, 0]][o.walk % 4]);
    const hip = top + 392 * s + dy, foot = hip + 230 * s;
    g.strokeStyle = 'rgba(6,5,12,0.98)'; g.lineCap = 'round'; g.lineWidth = 46 * s;
    g.beginPath(); g.moveTo(cx - 52 * s, hip); g.lineTo(cx - 52 * s + L[0] * 46 * s, foot); g.stroke();
    g.beginPath(); g.moveTo(cx + 52 * s, hip); g.lineTo(cx + 52 * s + L[1] * 46 * s, foot); g.stroke();
    g.fillStyle = 'rgba(6,5,12,0.98)'; g.fillRect(cx - 150 * s, top + 380 * s + dy, 300 * s, 40 * s);
    g.restore();
    // the rim: the head's and shoulders' edge, in neon
    const pts = [];
    if (hooded) { pts.push([cx - 100 * s, top + 262 * s], [cx - 112 * s, top + 140 * s], [cx - 70 * s, top + 40 * s], [cx, top], [cx + 70 * s, top + 34 * s], [cx + 104 * s, top + 130 * s], [cx + 98 * s, top + 262 * s]); }
    else { for (let i = 0; i <= 16; i++) { const a = Math.PI * (1 + i / 16); pts.push([cx + Math.cos(a) * 70 * s, top + 92 * s + Math.sin(a) * 88 * s]); } }
    S.tube(pts.map(([x, y]) => [x, y + dy]), rim, k, 5, { smooth: true });
    if (o.label) tx(S, o.label, cx, top + 286 * s + dy, 72 * s, rim, k);
  }
  function bars(S, x0, x1, y0, y1, u, k) {
    const n = 5, w = (x1 - x0);
    for (let i = 0; i < n; i++) { const x = x0 + w * (i + 0.5) / n + (1 - u) * w * 1.1; if (x < x1 + 2) S.tube([[x, y0], [x, y1]], 'white', k, 6); }
    if (u > 0.95) { S.tube([[x0, y0], [x1, y0]], 'white', k, 6); S.tube([[x0, y1], [x1, y1]], 'white', k, 6); }
  }
  function splitDraw(g, S, t) {
    const L = t < T.right ? 1 : 0.32, R = t < T.right ? 0 : 1;
    S.tube([[540, 320], [540, 1470]], 'white', 0.5, 4);
    tx(S, 'PICKED 4', 290, 330, 44, 'cyan', L);
    const caught = mj(clamp((t - wordOf('N17', /caught/i).t0) / 0.5));
    man(g, S, 290, 700, 0.5, true, 'pink', L, { label: '4', slump: mj(clamp((t - wordOf('N17', /caught/i).t0 - 0.7) / 0.6)) });
    bars(S, 160, 420, 680, 1060, caught, L);                                               // "caught him"
    if (R > 0) {
      const r = lit(t, T.right);
      tx(S, 'PICKED', 745, 330, 36, 'cyan', r); tx(S, 'ANYONE ELSE', 745, 380, 36, 'cyan', r);
      S.tube([[830, 1020], [830, 640], [930, 640], [930, 1020]], 'green', 0.7 * r, 6);          // the station door
      tx(S, 'EXIT', 880, 586, 36, 'green', r);
      const wk = clamp((t - wordOf('N18', /walks/i).t0) / 1.5);                               // "he walks": out through the door
      if (wk < 1) {
        const x = lerp(650, 880, mj(wk)), fade = 1 - clamp((x - 850) / 40);
        g.save(); g.beginPath(); g.rect(560, 300, 270 + 100 * (x < 840 ? 1 : 0), 1200); g.clip();
        man(g, S, x, 700, 0.42, true, 'pink', r * fade, { label: '4', walk: wk > 0 ? Math.floor(held(t, 2) * 7.5) : null });
        g.restore();
      }
      const jail = mj(clamp((t - wordOf('N18', /jail/i).t0) / 0.5));                        // "goes to jail"
      man(g, S, 700, 1110, 0.42, false, 'white', r, { label: '?' });
      bars(S, 600, 800, 1100, 1450, jail, r);
    }
  }

  // ---------------------------------------------------------------- shot 8: the dare, the S, and the WANTED poster
  const PHONE = { x0: 560, y0: 640, x1: 860, y1: 1180 };
  const S_ON_PHONE = { x: 710, y: 960 };
  function wanted(S, k) {    // the man with the mole, hidden once: a WANTED poster behind the friend, small and soft
    S.push(196, 418, -3 * deg, 1);
    const q = 0.36 * k;
    S.tube(rr(-50, 0, 50, 128, 4, 2), 'white', q, 4, { closed: true });
    tx(S, 'WANTED', 0, 8, 14, 'white', q, { w: 3 });
    S.tube(circ(0, 80, 23, 18), 'white', q, 4, { closed: true });                         // his face
    S.tube([[-26, 62], [-23, 50], [0, 45], [23, 50], [26, 62], [-26, 62]], 'red', 0.45 * k, 5);   // the cap first
    S.tube([[26, 62], [40, 64]], 'red', 0.45 * k, 5);                                     // its brim
    S.tube(circ(10, 86, 2, 8), 'white', q, 3, { closed: true });                          // the mole: his left cheek, the screen's right
    S.pop();
  }
  function dareTubes(S, t, th, fade) {
    const k = fade, hx = 300, hy = 880 + 4 * Math.sin(th * TAU / 1.1) * clamp((t - T.friend) / 0.3);   // she nods along
    wanted(S, k);
    S.tube(circ(hx, hy, 98, 30), 'white', k, 6, { closed: true });
    S.tube(circ(hx, hy - 8, 104, 16, -0.95 * Math.PI, -0.05 * Math.PI), 'white', k * 0.7, 6);   // hair
    const shut = mj(clamp((t - T.friend) / 0.25));                                           // eyes open, then shut as she listens
    for (const ex of [-34, 34]) {
      if (shut < 0.5) S.tube(circ(hx + ex, hy - 10, 9, 10), 'white', k, 5, { closed: true });
      else S.tube(circ(hx + ex, hy - 4, 16, 8, 0.15 * Math.PI, 0.85 * Math.PI), 'white', k, 5);
    }
    S.tube(circ(hx, hy + 30, 26, 10, 0.2 * Math.PI, 0.8 * Math.PI), 'white', k, 5);           // a knowing smile
    S.tube([[hx - 150, hy + 230], [hx - 120, hy + 140], [hx - 40, hy + 112], [hx + 40, hy + 112], [hx + 120, hy + 140], [hx + 150, hy + 230]], 'white', k * 0.8, 6, { smooth: true });
    const bud = mj(clamp((t - T.friend + 0.35) / 0.35));                                     // the earbud goes in
    const bx = lerp(hx + 200, hx + 100, bud), by = lerp(hy + 200, hy + 6, bud);
    S.tube(circ(bx, by, 12, 10), 'cyan', k, 5, { closed: true });
    S.tube([[bx + 4, by + 12], [hx + 130, hy + 140], [hx + 200, hy + 230], [PHONE.x0 + 40, PHONE.y1]], 'cyan', k * 0.75, 4, { smooth: true });
    if (bud >= 1) for (let i = 0; i < 2; i++) {
      const ph = ((t * 1.4 + i / 2) % 1);
      S.tube(circ(hx + 100, hy + 6, 22 + 26 * ph, 8, -0.3 * Math.PI, 0.3 * Math.PI), 'cyan', k * (1 - ph) * 0.8, 4);
    }
    S.tube(rr(PHONE.x0, PHONE.y0, PHONE.x1, PHONE.y1, 34), 'cyan', k, 8, { closed: true });  // the phone, playing this test
    S.tube([[680, 676], [740, 676]], 'cyan', k * 0.7, 5);
    const playing = Math.floor(th * 2.5) % 5;                                                // its line-up, one number after another
    for (let i = 0; i < 5; i++) tx(S, String(i + 1), 616 + i * 47, 730, 34, 'cyan', k * (i === playing && t < T.sWord ? 1 : 0.35));
    for (let i = 0; i < 5; i++) S.tube(circ(616 + i * 47, 830, 13, 10), 'white', k * (i === playing && t < T.sWord ? 0.9 : 0.4), 4, { closed: true });
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
    const E1 = CF.ending(t, END, { from: S_ON_PHONE });
    g.save(); g.setTransform(...M);
    if (E1.a.on) { solid(g, E1.a, coverPts(E1.a.open)); g.restore(); const S2 = NE.sign(); S2.push(M[4], M[5], 0, Math.hypot(M[0], M[1])); folderCover(S2, E1.a, 47, '', 1); S2.pop(); S2.flush(g, { wall: false }); g.save(); g.setTransform(...M); }
    if (E1.b.on) {
      solid(g, E1.b, CF.shape()); g.restore();
      const S3 = NE.sign(); S3.push(M[4], M[5], 0, Math.hypot(M[0], M[1]));
      folderBack(S3, E1.b, 1); folderCover(S3, { ...E1.b, open: 0 }, 48, CF.label(window.NEXT_LABEL || ''), 1);
      S3.pop(); S3.flush(g, { wall: false });
      return;
    }
    g.restore();
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
    // the game, readable on frame 0, full from 0.65 s; it leaves with his words when the narrator finishes
    const offW = outAt(t, P('N01').t1 + 0.2);
    tx(U, "YOU'LL PICK HIM BY HIS VOICE", 540, 446, 32, 'white', (t < 0.65 ? 0.55 : Math.max(0.55, lit(t, 0.65))) * 0.9 * offW);
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
      g.save(); g.setTransform(...M);
      g.drawImage(NE.wall(), -260, -200, W + 520, H + 400);
      if (t < T.lineup) atmFills(g, th);
      else if (t < T.twist) lineupFills(g, th, 'line');
      else if (t < T.replay) lineupFills(g, th, 'dim');
      else if (t >= T.answer && t < T.why) lineupFills(g, th, 'reveal');
      g.restore();
      S.push(M[4], M[5], cam.r, cam.s);
      if (t < T.lineup) atmTubes(S, th);
      else if (t < T.twist) lineupTubes(S, t, th, 'line');
      else if (t < T.replay) { lineupTubes(S, t, th, 'dim'); whisperWave(S, t, th); }
      else if (t < T.answer) { clueWord(S, t, 'RW', 640, 'violet', 'WHAT YOU HEARD'); clueWord(S, t, 'R4', 1010, 'pink', 'NUMBER 4'); }
      else if (t < T.why) lineupTubes(S, t, th, 'reveal');
      else if (t < T.split) chartTubes(S, t);
      else if (t < T.dare) { g.save(); g.setTransform(...M); splitDraw(g, S, th); g.restore(); }
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
        else if (t < P('N03').t1 + 1.3) tx(U, 'CHARGED TONIGHT', 540, 1290, 58, 'yellow', lit(t, T.charged - 0.04) * outAt(t, P('N03').t1 + 1.0));
        if (t >= P('N09').t0 - 0.04) {
          tx(U, 'PICK ONE', 540, 1290, 64, 'yellow', lit(t, P('N09').t0 - 0.04));
          const u = clamp((held(t, 2) - T.bar0) / (T.bar1 - T.bar0)), half = 210 * (1 - u);     // a bar that runs out to its middle
          if (u < 1) U.tube([[540 - half, 1400], [540 + half, 1400]], 'yellow', 0.95, 8);
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
