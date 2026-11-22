// Reel 47 Close Your Eyes: the picture, in the neon look (engine/neon47) with the case file (engine/casefile.js).
// Every shot is timed from the placed voices (film/words.js, from place_vo.py + plan_vo.py) and each voice's loudness
// and pitch line (film/env.js, from env.py). A pure function of t: any frame paints the same in any order. Drawings and
// the camera are held on twos (LAB.held); only a tube's light may change on single frames, as a real sign's does.
//
// Shots: 1 the cash machine (POV: his whisper, your PIN, the cash, his gloved hand) · 2 the line-up behind frosted
// glass, numbers lit as each man speaks, the ring that runs out · 3 the pitch board (five pitch lines; his whisper's
// stays dark glass) and the two replays (the SH lights in both) · 4 back to the line-up, four lit; voice vs SH ·
// 5 the two endings, side by side · 6 the dare · 7 the case file's ending (engine/casefile.js) · the end card.
(() => {
  const { W, H, rnd, rs, clamp, lerp, E, held, frameOf } = LAB;
  const NE = window.NEON, CF = window.CASEFILE;
  const deg = Math.PI / 180;

  // ---------------------------------------------------------------- the clock, from the placed words
  const WD = {};
  for (const w of window.WORDS || []) (WD[w.p] = WD[w.p] || []).push(w);
  const P = (id) => { const ws = WD[id]; if (!ws) throw new Error(`no placed words for ${id}`); return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, w: ws }; };
  const word = (id, i) => WD[id][Math.min(i, WD[id].length - 1)];
  const END = C.bt('end');
  const ENV = window.ENV || {};
  const envAt = (id, t, key = 'rms') => { const e = ENV[id]; if (!e) return 0; const i = Math.floor((t - e.t0) * 30); return i >= 0 && i < e[key].length ? e[key][i] : 0; };
  const T = {
    turn: word('W1', 1).t0,                    // "turn": the frame snaps back
    pin: P('W2').t0 + 0.55,                    // your PIN, four keys, as he tells you where to look
    cash: P('W2').t1 + 0.12,                   // the notes come out
    grab: P('W2').t1 + 0.42,                   // his hand
    lineup: P('N02').t0 - 0.10,                // cut on "Close your eyes"
    charged: word('N03', 10).t0,               // "charged"
    ring0: P('N09').t1 + 0.05, ring1: P('N09').t1 + 2.05,
    board: P('N10').t0 - 0.30,
    rows: P('N12').t0 + 0.2, nopitch: word('N12', 6).t0,    // "no pitch"
    glint: P('N13').t0 + 0.4,
    back: P('N15').t0 - 0.12,
    split: P('N17').t0 - 0.25, right: P('N18').t0 - 0.1,
    dare: P('N19').t0 - 0.25, mention: P('N20').t0,
  };
  const SPEAK = [1, 2, 3, 4, 5].map((k) => ({ k, n: P(`N0${k + 3}`), v: P(`L${k}`) }));   // "One." + his line, ...

  // ---------------------------------------------------------------- helpers
  const rr = (x0, y0, x1, y1, r, n = 5) => {          // a rounded rectangle, closed
    const pts = [];
    const arc = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (Math.PI / 2) * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(x1 - r, y0 + r, -Math.PI / 2); arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, Math.PI / 2); arc(x0 + r, y0 + r, Math.PI);
    return pts;
  };
  const circ = (cx, cy, r, n = 28, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const mj = (x) => { x = clamp(x); return x * x * x * (10 - 15 * x + 6 * x * x); };   // minimum jerk
  const lit = (t, t0) => (t < t0 ? 0 : NE.on(t, t0));                                // a tube catching at t0
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

  // ---------------------------------------------------------------- the camera (on twos)
  function camAt(t) {
    let x = 0, y = 0, s = 1, r = 0;
    if (t < T.lineup) {
      const out = E.out(clamp(t / 0.36)) * (1 - clamp((t - T.turn) / 0.1));          // turning towards him...
      const settle = t > T.turn + 0.1 ? Math.sin(Math.PI * clamp((t - T.turn - 0.1) / 0.3)) * (1 - clamp((t - T.turn - 0.1) / 0.3)) : 0;
      x = 46 * out - 12 * settle; r = -1.3 * deg * out;                                // ...and snapping back on "turn"
      s = 1 + 0.035 * E.inOut(clamp((t - P('N01').t0) / (P('N01').t1 - P('N01').t0)))
        + 0.03 * E.out(clamp((t - P('W2').t0) / 0.3));                                 // "Look straight ahead": closer
      const grab = clamp((t - T.grab) / 0.6);
      x += 6 * Math.sin(Math.PI * grab) * (1 - grab);                                   // his hand brushes you
    } else if (t < T.board) s = 1 + 0.03 * E.inOut(clamp((t - T.lineup) / (T.board - T.lineup)));
    else if (t < T.back) s = 1 + 0.02 * E.inOut(clamp((t - T.board) / (T.back - T.board)));
    else if (t < T.split) s = 1.03 - 0.03 * E.out(clamp((t - T.back) / 0.5));
    return { x, y, s, r };
  }

  // ---------------------------------------------------------------- shot 1: the cash machine
  const ATM = { x0: 190, y0: 528, x1: 890, y1: 1306, sx0: 236, sy0: 576, sx1: 844, sy1: 1056 };
  const KEYS = Array.from({ length: 12 }, (_, i) => ({ x: 456 + (i % 3) * 84, y: 1100 + Math.floor(i / 3) * 46 }));
  const PIN = [4, 7, 1, 9].map((d, i) => ({ key: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10][d], t: T.pin + 0.16 * i }));
  function atmFills(g, t) {
    // the screen: dark glass lit faintly from inside; the two of you in it, against the street light behind you
    const { sx0, sy0, sx1, sy1 } = ATM;
    g.save();
    g.beginPath(); g.rect(sx0, sy0, sx1 - sx0, sy1 - sy0); g.clip();
    // the glass is lit from behind you: a street lamp's glow, so the two of you are dark shapes against it
    const gr = g.createRadialGradient(sx0 + 470, sy0 + 120, 30, sx0 + 380, sy0 + 260, 520);
    gr.addColorStop(0, 'rgba(150,230,235,0.85)'); gr.addColorStop(0.45, 'rgba(60,150,165,0.75)'); gr.addColorStop(1, 'rgba(10,36,46,0.92)');
    g.fillStyle = gr; g.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
    const leave = E.inOut(clamp((t - T.grab - 0.35) / 0.7));                           // he steps back out of the glass
    const lean = E.out(clamp(t / 0.3));                                                 // frame 0: already leaning in
    const breath = Math.sin(t * 2 * Math.PI / 3.2) * 2;
    // HIM: hooded, behind your left shoulder (the screen's left), leaning in to your ear, half hidden by your head
    if (leave < 1) {
      g.save(); g.globalAlpha = 1 - leave;
      g.translate(-170 * leave, -10 * leave);
      g.translate(500, 860); g.rotate((10 + 4 * lean) * deg); g.translate(-500, -860);
      g.fillStyle = 'rgba(4,3,10,0.97)';
      g.beginPath();                                                                     // the hood: a rounded peak over his head
      g.moveTo(370, 930); g.bezierCurveTo(352, 800, 380, 700, 470, 668 + breath); g.bezierCurveTo(552, 690, 580, 790, 568, 930); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(268, 1060); g.quadraticCurveTo(300, 948, 420, 920); g.lineTo(520, 918); g.quadraticCurveTo(610, 950, 640, 1060); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(200,150,255,0.8)'; g.lineWidth = 5;                         // the lamp catches the hood's edge
      g.beginPath(); g.moveTo(366, 880); g.bezierCurveTo(356, 790, 384, 702, 470, 670 + breath); g.bezierCurveTo(520, 682, 548, 712, 560, 760); g.stroke();
      g.restore();
    }
    // YOU: nearer the glass, a little right of centre, head and shoulders
    g.fillStyle = 'rgba(2,6,10,0.98)';
    g.beginPath(); g.ellipse(612, 852 + breath * 0.5, 78, 94, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(580, 920, 64, 50);
    g.beginPath(); g.moveTo(430, 1060); g.quadraticCurveTo(462, 966, 572, 952); g.lineTo(652, 952); g.quadraticCurveTo(770, 966, 800, 1060); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(170,240,255,0.6)'; g.lineWidth = 4;
    g.beginPath(); g.ellipse(612, 852, 78, 94, 0, Math.PI * 1.15, Math.PI * 1.88); g.stroke();
    // his gloved hand on your left shoulder (the screen's left), fingers over the top
    const lift = clamp((t - T.grab + 0.06) / 0.1);                                      // it lifts as his real hand reaches in
    if (lift < 1) {
      g.save(); g.globalAlpha = 1 - lift;
      g.fillStyle = 'rgba(6,3,12,0.98)';
      g.beginPath(); g.moveTo(476, 1060); g.lineTo(470, 990);
      for (let i = 0; i < 4; i++) { const x = 482 + i * 22; g.lineTo(x, 958 - (i === 1 || i === 2 ? 6 : 0)); g.quadraticCurveTo(x + 10, 944, x + 20, 960); }
      g.lineTo(574, 1000); g.lineTo(566, 1060); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(200,150,255,0.7)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(470, 990); for (let i = 0; i < 4; i++) { const x = 482 + i * 22; g.lineTo(x, 958 - (i === 1 || i === 2 ? 6 : 0)); g.quadraticCurveTo(x + 10, 944, x + 20, 960); } g.stroke();
      g.restore();
    }
    g.restore();
  }
  function atmTubes(S, t) {
    const { x0, y0, x1, y1, sx0, sy0, sx1, sy1 } = ATM;
    S.tube(rr(x0, y0, x1, y1, 38), 'cyan', 0.8 * NE.tired(t, 'housing', 0.15), 9, { closed: true });
    S.tube(rr(sx0, sy0, sx1, sy1, 12), 'white', 0.5, 6, { closed: true });
    tx(S, 'CASH', 540, 538, 28, 'pink', NE.tired(t, 'cashsign', 0.35) * 0.8);          // a small sign in the housing's top
    for (let i = 0; i < KEYS.length; i++) {                                           // the keypad: your PIN, four keys
      const p = PIN.find((q) => q.key === i), on = p && t >= p.t && t < p.t + 0.14;
      S.tube(circ(KEYS[i].x, KEYS[i].y, 16, 18), on ? 'yellow' : 'white', on ? 1 : 0.3, 5, { closed: true });
    }
    const out = clamp((t - T.cash) / 0.3), taken = clamp((t - T.grab - 0.2) / 0.45);
    S.tube([[400, 1276], [680, 1276]], out > 0 && taken < 1 ? 'green' : 'orange', out > 0 && taken < 1 ? 1 : 0.5, 7);
    if (out > 0 && taken < 1) {                                                          // the notes fan out
      for (let i = 0; i < 3; i++) {
        const ox = (i - 1) * 26 - 300 * mj(taken), oy = 1282 + 46 * E.out(out) + i * 6 - 40 * mj(taken);
        S.push(540 + ox, oy, (i - 1) * 5 * deg - 20 * deg * mj(taken), 1);
        S.tube(rr(-95, 0, 95, 76, 6, 2), 'green', 0.9, 5, { closed: true });
        S.tube(circ(0, 38, 16, 14), 'green', 0.7, 4, { closed: true });
        S.pop();
      }
    }
    // his gloved hand, from behind your left shoulder: in, closes on the notes, gone
    const reach = mj(clamp((t - T.grab) / 0.32)), back = mj(clamp((t - T.grab - 0.42) / 0.4));
    if (reach > 0 && back < 1) {
      const hx = lerp(-120, 440, reach) - 620 * back, hy = lerp(1560, 1330, reach) + Math.sin(Math.PI * reach) * -50 + 140 * back;
      const shut = clamp((t - T.grab - 0.3) / 0.1);
      glove(S, hx, hy, -28 * deg + 12 * deg * back, shut);
    }
  }
  function glove(S, x, y, rot, shut) {
    S.push(x, y, rot, 1.7);                                                          // big enough to read on a phone
    S.tube([[-40, 60], [-46, -6], [-30, -30], [40, -30], [52, -4], [48, 60]], 'violet', 1, 7);   // the back of the glove
    for (let i = 0; i < 4; i++) {
      const fx = -30 + i * 22, L = (i === 1 || i === 2 ? 62 : 52) * (1 - 0.55 * shut);
      S.tube([[fx, -28], [fx + 2, -28 - L], [fx + 14, -28 - L - 4], [fx + 16, -28]], 'violet', 1, 6);
    }
    S.tube([[48, 6], [80, -10 - 20 * (1 - shut)], [88, -30 * (1 - shut)]], 'violet', 1, 6);         // the thumb
    S.tube([[-44, 60], [50, 60], [52, 88], [-46, 88], [-44, 60]], 'violet', 0.8, 6);              // the cuff
    S.pop();
  }

  // ---------------------------------------------------------------- shot 2 and 4: the line-up behind frosted glass
  const PANEL = { x0: 120, y0: 540, x1: 940, y1: 1160 };
  const SLOT = (k) => PANEL.x0 + (PANEL.x1 - PANEL.x0) * (k - 0.5) / 5;
  function speaker(t) {                       // who's speaking now (0 = nobody), and his voice's loudness
    for (const s of SPEAK) if (t >= s.v.t0 - 0.05 && t <= s.v.t1 + 0.12) return { k: s.k, a: envAt(`L${s.k}`, t) };
    return { k: 0, a: 0 };
  }
  function lineupFills(g, t, mode) {
    const th = held(t, 2), { x0, y0, x1, y1 } = PANEL;
    const sp = mode === 'reveal' ? { k: 4, a: 0.6 } : speaker(t);
    const power = mode === 'off' ? 0 : 1;
    // the backlight, and a soft pool of light behind whoever is speaking (the same for each man)
    const bg = g.createLinearGradient(0, y0, 0, y1);
    bg.addColorStop(0, `rgba(150,180,220,${0.5 * power})`); bg.addColorStop(1, `rgba(70,90,130,${0.4 * power})`);
    g.fillStyle = bg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let k = 1; k <= 5; k++) {
      const hot = sp.k === k ? (mode === 'reveal' ? 1 : 0.55 + 0.45 * sp.a) : 0;
      if (hot <= 0) continue;
      const rg = g.createRadialGradient(SLOT(k), y0 + 170, 10, SLOT(k), y0 + 220, 220);
      const c = mode === 'reveal' ? '255,90,150' : '200,235,255';
      rg.addColorStop(0, `rgba(${c},${0.55 * hot * power})`); rg.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = rg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    // five men the same height and build, behind the glass, blurred by it; each breathes and shifts his weight
    const s = scratch();
    s.g.fillStyle = 'rgba(4,6,16,0.94)';
    for (let k = 1; k <= 5; k++) {
      const cx = SLOT(k) + 3 * Math.sin(th * 0.7 + k * 1.9), br = 1 + 0.007 * Math.sin(th * 2 * Math.PI / (3.4 + k * 0.23) + k);
      const dim = mode === 'reveal' && k !== 4 ? 0.55 : 1;
      s.g.globalAlpha = dim;
      s.g.save(); s.g.translate(cx, y1); s.g.scale(1, br); s.g.translate(-cx, -y1);
      s.g.beginPath(); s.g.ellipse(cx, y0 + 168, 46, 56, 0, 0, Math.PI * 2); s.g.fill();
      s.g.fillRect(cx - 18, y0 + 210, 36, 40);
      s.g.beginPath(); s.g.moveTo(cx - 78, y1 + 10); s.g.lineTo(cx - 76, y0 + 300); s.g.quadraticCurveTo(cx - 72, y0 + 252, cx - 30, y0 + 244);
      s.g.lineTo(cx + 30, y0 + 244); s.g.quadraticCurveTo(cx + 72, y0 + 252, cx + 76, y0 + 300); s.g.lineTo(cx + 78, y1 + 10); s.g.closePath(); s.g.fill();
      s.g.restore();
    }
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    g.globalAlpha = 0.25 + 0.75 * power; g.filter = 'blur(7px)'; g.drawImage(s.c, 0, 0); g.filter = 'none'; g.globalAlpha = 1;
    g.globalAlpha = 0.9 * power + 0.1; g.drawImage(frost(), x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    g.restore();
  }
  function lineupTubes(S, t, mode) {
    const { x0, y0, x1, y1 } = PANEL, sp = mode === 'reveal' ? { k: 4, a: 1 } : speaker(t);
    const off = mode === 'off' ? NE.off(t, T.board) : 1;
    S.tube(rr(x0, y0, x1, y1, 10), 'white', 0.55 * off, 6, { closed: true });
    tx(S, 'POLICE', 540, 300, 44, 'cyan', 0.8 * NE.tired(t, 'police', 0.25) * off);
    wanted(S, t, off);
    for (const s of SPEAK) {                                                             // the numbers, lit as they're called
      const on = mode === 'reveal' ? 1 : lit(t, s.n.t0 - 0.06);
      const k = mode === 'reveal' ? (s.k === 4 ? 1 : 0.22) : (sp.k === s.k ? 1 : on * 0.55);
      tx(S, String(s.k), SLOT(s.k), 444, 64, mode === 'reveal' && s.k === 4 ? 'pink' : 'cyan', Math.max(dark, k * off));
      if (sp.k === s.k && mode !== 'reveal') {                                            // his voice, as a wave under his place
        const pts = [], amp = 8 + 40 * sp.a, cx = SLOT(s.k);
        for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([cx - 70 + 140 * u, 1214 + Math.sin(u * 18 + t * 26) * amp * Math.sin(Math.PI * u)]); }
        S.tube(pts, 'cyan', 1, 5, { smooth: true });
      }
    }
  }
  function wanted(S, t, k) {                    // the man with the mole, hidden once: a WANTED poster, top right, small and soft
    S.push(872, 296, 2 * deg, 1);
    const q = 0.38 * k;
    S.tube(rr(-50, 0, 50, 128, 4, 2), 'white', q, 4, { closed: true });
    tx(S, 'WANTED', 0, 8, 14, 'white', q, { w: 3 });
    S.tube(circ(0, 80, 23, 18), 'white', q, 4, { closed: true });                         // his face
    S.tube([[-26, 62], [-23, 50], [0, 45], [23, 50], [26, 62], [-26, 62]], 'red', 0.5 * k, 5);   // the cap first
    S.tube([[26, 62], [40, 64]], 'red', 0.5 * k, 5);                                     // its brim
    S.tube(circ(10, 86, 2, 8), 'white', q, 3, { closed: true });                          // the mole: his left cheek, the screen's right
    S.pop();
  }

  // ---------------------------------------------------------------- shot 3: the pitch board and the replays
  const ROWS = { x0: 190, x1: 900, y: [600, 712, 824, 936, 1048], wy: 1190 };
  const shOf = (id) => { const ws = WD[id], st = ws.find((w) => /^straight/i.test(w.w)); const e = ENV[id]; return e ? { u0: (st.t0 - e.t0) / (e.rms.length / 30), u1: (st.t0 + 0.11 - e.t0) / (e.rms.length / 30) } : { u0: 0.3, u1: 0.36 }; };
  function boardTubes(S, t) {
    const show = (i) => lit(t, T.rows + 0.22 * i);
    // five pitch lines: each man's real melody (F0 from his line), drawn where he's voiced, gaps where he isn't
    for (let k = 1; k <= 5; k++) {
      const e = ENV[`L${k}`], y = ROWS.y[k - 1], on = show(k - 1);
      tx(S, String(k), 140, y - 26, 48, 'cyan', Math.max(dark, 0.8 * on));
      if (!e) continue;
      const n = e.f0.length, seg = [];
      const flush = () => { if (seg.length > 1) S.tube(seg.slice(), k === 4 && t >= T.back - 0.5 ? 'pink' : 'cyan', Math.max(dark, on), 6, { smooth: true }); seg.length = 0; };
      for (let i = 0; i < n; i++) {
        const f = e.f0[i];
        if (f > 0) seg.push([lerp(ROWS.x0, ROWS.x1, i / (n - 1)), y + 40 - clamp((f - 80) / 110) * 80]);
        else flush();
      }
      flush();
    }
    // his whisper: the same words, no pitch at all: dark glass, flat
    const wy = ROWS.wy;
    // "He never let you hear it": his whisper's tube tries to light, sputters, and dies
    const nv = word('N11', 1).t0 - 0.05, try_ = t >= nv ? NE.flick(t, nv, [0.6, 0.6, 0.1, 0.1, 0.45, 0.45, 0.03]) : 0;
    const wave = [];
    for (let i = 0; i <= 48; i++) { const u = i / 48, a = envAt('W2', ENV.W2 ? ENV.W2.t0 + u * ENV.W2.rms.length / 30 : 0); wave.push([lerp(ROWS.x0, ROWS.x1, u), wy + Math.sin(u * 60) * 30 * a]); }
    S.tube(t < T.rows ? wave : [[ROWS.x0, wy], [ROWS.x1, wy]], 'violet', Math.max(dark, try_ || 0), 8, { smooth: true });
    if (t >= nv && t < nv + 0.5) NE.sparks(S, 540, wy, t, nv + 0.16, 'dead', 10, 0.32);
    tx(S, 'HIS WHISPER', 540, wy + 34, 30, 'violet', Math.max(dark, 0.75 * lit(t, T.board + 0.2)));
    if (t >= T.nopitch && t < P('N13').t1 + 0.1) tx(S, 'NO PITCH', 540, 1330, 70, 'pink', lit(t, T.nopitch - 0.05) * (t > P('N13').t1 - 0.25 ? NE.off(t, P('N13').t1 - 0.2) : 1));
    // one thing came through: the SH, in his whisper and in number four's line
    const sw = shOf('W2'), s4 = shOf('L4');
    const g1 = clamp((t - T.glint) / 0.3);
    const play = (id, row, y) => {                                                          // a playhead in time with a replay
      const p = P(id); if (t < p.t0 - 0.05 || t > p.t1 + 0.4) return null;
      const u = clamp((t - p.t0 + 0.1) / (p.t1 - p.t0 + 0.2));
      const x = lerp(ROWS.x0, ROWS.x1, u);
      S.tube([[x, y - 46], [x, y + 46]], 'white', 0.9, 4);
      return u;
    };
    const uw = play('RW', 0, wy), u4 = play('R4', 4, ROWS.y[3] + 0);
    const shSeg = (sh, y, flash) => S.tube([[lerp(ROWS.x0, ROWS.x1, sh.u0), y], [lerp(ROWS.x0, ROWS.x1, sh.u1 + 0.04), y]], 'green', flash, 12);
    if (g1 > 0) shSeg(sw, wy, Math.max(0.35 * g1, uw != null && uw >= sw.u0 - 0.03 && uw <= sw.u1 + 0.08 ? 1 : 0, t > P('R4').t1 ? 1 : 0));
    if (t >= P('R4').t0 - 0.05) shSeg(s4, ROWS.y[3] + 10, Math.max(0.35, u4 != null && u4 >= s4.u0 - 0.03 && u4 <= s4.u1 + 0.08 ? 1 : 0, t > P('R4').t1 ? 1 : 0));
    if (t >= P('N14').t0 - 0.05) {                                                           // SHTRAIGHT, the SH lit
      const on = lit(t, P('N14').t0 - 0.05);
      tx(S, 'SHTRAIGHT', 540, 1330, 92, 'white', (i) => (i < 2 ? 0 : on));
      tx(S, 'SHTRAIGHT', 540, 1330, 92, 'green', (i) => (i < 2 ? on : 0));
    }
  }

  // ---------------------------------------------------------------- shot 4's diagram: a voice buzzes; an S doesn't
  function cordsTubes(S, t) {
    const p = P('N16'), on = lit(t, p.t0 - 0.05), buzzOff = t > word('N16', 3).t0 ? NE.off(t, word('N16', 4).t0) : 1;
    const y = 1330;
    const zz = [], hiss = [];
    for (let i = 0; i <= 30; i++) { const u = i / 30; zz.push([200 + 260 * u, y + (i % 2 ? -22 : 22) * Math.sin(Math.PI * u)]); }
    S.tube(zz, 'pink', Math.max(dark, on * buzzOff), 6);
    tx(S, 'VOICE', 330, y + 52, 34, 'pink', Math.max(dark, on * buzzOff));
    for (let i = 0; i < 14; i++) { const x = 620 + (i * 21 + (frameOf(t) >> 1) * 7) % 280; hiss.push([x, y + rs('h', i) * 16]); }
    for (const [x, yy] of hiss) S.tube([[x, yy], [x + 9, yy]], 'green', on, 5);
    tx(S, 'S · SH', 760, y + 52, 34, 'green', on);
  }

  // ---------------------------------------------------------------- shot 5: the two endings
  function figure(S, x, y, col, k, o = {}) {        // a neon man: head, body, arms, legs; o.walk: 0/1 stride, o.label, o.s scale
    S.push(x, y, 0, o.s || 1);
    S.tube(circ(0, -150, 24, 18), col, k, 5, { closed: true });
    S.tube([[-30, -112], [30, -112], [36, -10], [-36, -10], [-30, -112]], col, k, 5);
    const st = o.walk == null ? 0 : (o.walk ? 1 : -1);
    S.tube([[-18, -10], [-18 - 12 * st, 70]], col, k, 5); S.tube([[18, -10], [18 + 12 * st, 70]], col, k, 5);
    S.tube([[-30, -104], [-44 + 10 * st, -30]], col, k, 5); S.tube([[30, -104], [44 - 10 * st, -30]], col, k, 5);
    if (o.label) tx(S, o.label, 0, -88, 36, col, k);
    S.pop();
  }
  function bars(S, x0, x1, y0, y1, u, k) {
    const n = 5, w = (x1 - x0);
    for (let i = 0; i < n; i++) { const x = x0 + w * (i + 0.5) / n + (1 - u) * w * 1.1; if (x < x1 + 2) S.tube([[x, y0], [x, y1]], 'white', k, 6); }
    if (u > 0.95) { S.tube([[x0, y0], [x1, y0]], 'white', k, 6); S.tube([[x0, y1], [x1, y1]], 'white', k, 6); }
  }
  function splitTubes(S, t) {
    const L = t < T.right ? 1 : 0.32, R = t < T.right ? 0.22 : 1;
    S.tube([[540, 320], [540, 1480]], 'white', 0.5, 4);
    tx(S, 'PICKED 4', 290, 330, 44, 'cyan', L);
    figure(S, 290, 1030, 'pink', L, { label: '4', s: 1.5 });
    bars(S, 170, 410, 740, 1150, mj(clamp((t - word('N17', 4).t0) / 0.5)), L);              // "caught him"
    tx(S, 'PICKED', 745, 330, 36, 'cyan', R); tx(S, 'ANYONE ELSE', 745, 380, 36, 'cyan', R);
    tx(S, 'EXIT', 872, 520, 40, 'green', R);
    const walk = mj(clamp((t - word('N18', 3).t0) / 1.4));                                   // "he walks": out by the EXIT
    if (walk < 1) figure(S, lerp(680, 900, walk), 880 - 60 * walk, 'pink', R * (1 - clamp((walk - 0.75) / 0.25)), { label: '4', s: 1.15, walk: walk > 0 ? (held(t, 2) * 4 | 0) % 2 : null });
    figure(S, 745, 1330, 'white', R, { label: '?', s: 1.2 });
    bars(S, 640, 850, 1060, 1430, mj(clamp((t - word('N18', 9).t0) / 0.5)), R);             // "goes to jail"
  }

  // ---------------------------------------------------------------- shot 6: the dare, and the key object (the S)
  const PHONE = { x0: 560, y0: 640, x1: 860, y1: 1180 };
  const S_ON_PHONE = { x: 710, y: 960 };
  function dareTubes(S, t, fade) {
    const k = fade, hx = 300, hy = 880;
    // a friend, eyes shut, smiling, one earbud in, wired to the phone: the friend who never forgets a voice
    S.tube(circ(hx, hy, 98, 30), 'white', k, 6, { closed: true });
    S.tube(circ(hx, hy - 8, 104, 16, -0.95 * Math.PI, -0.05 * Math.PI), 'white', k * 0.7, 6);   // hair
    S.tube(circ(hx - 34, hy - 4, 16, 8, 0.15 * Math.PI, 0.85 * Math.PI), 'white', k, 5);       // eyes shut
    S.tube(circ(hx + 34, hy - 4, 16, 8, 0.15 * Math.PI, 0.85 * Math.PI), 'white', k, 5);
    S.tube(circ(hx, hy + 30, 26, 10, 0.2 * Math.PI, 0.8 * Math.PI), 'white', k, 5);           // a knowing smile
    S.tube([[hx - 150, hy + 230], [hx - 120, hy + 140], [hx - 40, hy + 112], [hx + 40, hy + 112], [hx + 120, hy + 140], [hx + 150, hy + 230]], 'white', k * 0.8, 6, { smooth: true });
    S.tube(circ(hx + 100, hy + 6, 12, 10), 'cyan', k, 5, { closed: true });                  // the earbud
    S.tube([[hx + 104, hy + 18], [hx + 130, hy + 140], [hx + 200, hy + 230], [PHONE.x0 + 40, PHONE.y1]], 'cyan', k * 0.75, 4, { smooth: true });
    for (let i = 0; i < 2; i++) {                                                            // the sound in her ear
      const ph = ((t * 1.4 + i / 2) % 1);
      S.tube(circ(hx + 100, hy + 6, 22 + 26 * ph, 8, -0.3 * Math.PI, 0.3 * Math.PI), 'cyan', k * (1 - ph) * 0.8, 4);
    }
    S.tube(rr(PHONE.x0, PHONE.y0, PHONE.x1, PHONE.y1, 34), 'cyan', k, 8, { closed: true });  // the phone, playing this test
    S.tube([[680, 676], [740, 676]], 'cyan', k * 0.7, 5);
    tx(S, '1 2 3 4 5', 710, 740, 34, 'cyan', k * (t < T.mention ? 0.9 : 0.4));
    for (let i = 0; i < 5; i++) S.tube(circ(616 + i * 47, 830, 13, 10), 'white', k * 0.5, 4, { closed: true });
  }
  function keyS(S, x, y, s, k) { tx(S, 'S', x, y - 60 * s, 120 * s, 'green', k); }

  // ---------------------------------------------------------------- shot 7: the case file (engine/casefile.js), in neon
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
  function caseFront(g, t) {                                   // then 47's cover over it, then 48 on top: each solid
    const E1 = CF.ending(t, END, { from: S_ON_PHONE });
    if (E1.a.on) { solid(g, E1.a, coverPts(E1.a.open)); const S2 = NE.sign(); folderCover(S2, E1.a, 47, '', 1); S2.flush(g, { wall: false }); }
    if (E1.b.on) {
      solid(g, E1.b, CF.shape());
      const S3 = NE.sign(); folderBack(S3, E1.b, 1); folderCover(S3, { ...E1.b, open: 0 }, 48, CF.label(window.NEXT_LABEL || ''), 1);
      S3.flush(g, { wall: false });
    }
  }

  // ---------------------------------------------------------------- the frame-0 case tab (engine/casefile.js), in neon
  function caseTab(U, t) {
    const p = CF.tab(t); if (!p.on) return;
    const A = CF.TAB, sb = A.stamp;
    const k = p.k < 1 ? (t >= CF.T.tabOut ? NE.off(t, CF.T.tabOut) * p.k : p.k) : 1;   // it goes out like a sign
    U.push(A.x, A.y + p.dy, 0, 1);
    U.tube(CF.tabShape(), 'orange', 0.78 * k, 6, { closed: true });
    U.pop();
    U.push(sb.x + sb.w / 2, sb.y + p.dy + sb.h / 2, sb.rot, 1);
    tx(U, CF.words(47), 0, -19, 38, 'red', 0.85 * k);
    U.pop();
  }

  // ---------------------------------------------------------------- the screen-fixed words of the first shot
  function hookTubes(U, t) {
    // SOUND ON, small, top right, with a drawn speaker
    const k = t < T.lineup ? 1 : 0;
    if (!k) return;
    U.tube([[634, 322], [646, 322], [660, 310], [660, 350], [646, 338], [634, 338], [634, 322]], 'yellow', 0.8, 4);
    U.tube(circ(664, 330, 12, 8, -0.35 * Math.PI, 0.35 * Math.PI), 'yellow', 0.65, 4);
    U.tube(circ(664, 330, 21, 10, -0.35 * Math.PI, 0.35 * Math.PI), 'yellow', 0.5, 4);
    tx(U, 'SOUND ON', 812, 312, 34, 'yellow', 0.78, { block: false });
    // the game, from 1 s
    const offW = t > P('N01').t1 ? NE.off(t, P('N01').t1 + 0.2) : 1;                      // both leave as the narrator finishes
    if (t >= 1.0) tx(U, "YOU'LL PICK HIM BY HIS VOICE", 540, 446, 32, 'white', lit(t, 1.0) * 0.88 * offW);
    // his words, as he whispers them: the whole line readable on frame 0, each word full as it's said
    const ws = P('W1').w, kw = (i) => (i === 0 || t >= ws[i].t0 - 0.03 ? 1 : 0.55);
    const off = t > P('N01').t1 ? NE.off(t, P('N01').t1 + 0.2) : 1;
    tx(U, "DON'T TURN", 540, 1346, 80, 'white', (i) => (i < 5 ? kw(0) : kw(1)) * off, { block: false });
    tx(U, 'AROUND.', 540, 1444, 80, 'white', kw(2) * off, { block: false });
  }

  // ---------------------------------------------------------------- the frame
  LAB.film({
    to: 'end', start: false,
    draw(g, t) {
      const th = held(t, 2);
      const cam = camAt(th), M = camM(cam);
      const S = NE.sign(), U = NE.sign();
      g.save(); g.setTransform(...M);
      g.drawImage(NE.wall(), -90, -160, W + 180, H + 320);
      if (t < T.lineup) atmFills(g, th);
      else if (t < T.board) lineupFills(g, th, 'line');
      else if (t < T.back) { if (t < T.board + 0.3) lineupFills(g, th, 'off'); }
      else if (t < T.split) lineupFills(g, th, 'reveal');
      g.restore();
      S.push(M[4], M[5], cam.r, cam.s);
      if (t < T.lineup) atmTubes(S, th);
      else if (t < T.board) lineupTubes(S, t, 'line');
      else if (t < T.back) { if (t < T.board + 0.3) lineupTubes(S, t, 'off'); boardTubes(S, t); }
      else if (t < T.split) { lineupTubes(S, t, 'reveal'); cordsTubes(S, t); }
      else if (t < T.dare) splitTubes(S, th);
      else {
        const fade = 1 - clamp((t - (END + CF.T.a0 - 0.25)) / 0.3);                         // the friend and phone go before the folder rises
        if (fade > 0) dareTubes(S, t, fade);
        if (t >= T.mention && t < END + CF.T.drop0) keyS(S, S_ON_PHONE.x, S_ON_PHONE.y, 1, lit(t, T.mention + 0.35));
        caseBack(S, t);
      }
      S.pop();
      S.flush(g, { wall: false });
      if (t >= T.dare) caseFront(g, t);
      if (t < T.lineup) hookTubes(U, t);
      if (t >= T.lineup && t < T.board) {
        if (t < T.charged) tx(U, 'CLOSE YOUR EYES', 540, 1290, 58, 'pink', lit(t, P('N02').t0 - 0.04));
        else if (t < P('N09').t0) tx(U, 'CHARGED TONIGHT', 540, 1290, 58, 'yellow', lit(t, T.charged - 0.04) * (t > P('N03').t1 + 0.4 ? 0.55 : 1));
        if (t >= P('N09').t0 - 0.04) {
          tx(U, 'PICK ONE', 540, 1290, 64, 'yellow', lit(t, P('N09').t0 - 0.04));
          const u = clamp((t - T.ring0) / (T.ring1 - T.ring0));
          if (u < 1) U.tube(circ(540, 1430, 58, 40, -Math.PI / 2 + u * Math.PI * 2, Math.PI * 1.5), 'yellow', 0.95, 7);
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
