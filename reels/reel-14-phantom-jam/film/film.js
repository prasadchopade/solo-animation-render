// Reel 14 · The Jam With No Cause. A new kind of reel for the channel: everything that moves is a real simulation
// (engine/traffic.js; the four scenarios in film/scenarios.js): drivers follow the Intelligent Driver Model and react a
// beat late, so a jam can appear from nothing. Night, from above: a Bengaluru road whose jam has nothing at its front;
// Sugiyama's 2008 ring (22 cars, one rule) where one driver touches the brakes and the followers amplify it to a stop;
// the jam travelling backwards at bicycle speed while every car drives forwards; the drivers' braking, car by car; Stern's
// 2018 ring where one self-driving car holding a steady speed dissolves the waves; back on the road, "you" leave a gap and
// the lane behind you stops braking — then you tap the brakes and a new jam starts behind you (the loop to frame 0).
// Type in the text zone lit as the voice says it, mono sources, hard cuts, grain, as in AI171. Every vehicle position on
// screen comes from the simulation; where a shot runs faster or slower than real time, a SIM clock says so.
// 30 fps, no motion blur. Pure functions of t (the simulations are precomputed once, deterministically).
(() => {
  const { W, H, put, reg, el, scene, canvas, clamp, lerp, ease, mulberry32 } = C;
  const K = window.KIT, SC = window.SCENARIOS;
  const { st, hit, tb, words, cam, clear, drift, kick, font } = K;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn', '400 30px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI, eio = ease.inOut, eo = ease.out;
  const X0 = 80, TZ = 1222;
  const INK = '#ece8e1', INK2 = '#8d949c', BG = '#07090c', ACC = '#ff3b1f', CYAN = '#5fd4ff', AMB = '#ffb23a';

  // ------------------------------------------------------------------ the simulations (computed once)
  const RING = SC.sugiyama(), STERN = SC.stern(), ROAD = SC.road(3), FIX = SC.roadFix();
  const kmh = (v) => Math.max(0, Math.round(v * 3.6));
  const DIPS = Array.from({ length: 5 }, (_, k) => RING.minV((RING.n - k) % RING.n, RING.tp, RING.tp + 3 + 1.8 * k));   // the slowed car, then 4 followers

  // ------------------------------------------------------------------ timing (the narration's words; estimates until the voice is placed)
  const FB = { s01: 0.45, s02: 3.25, s03: 8.25, s04: 13.15, s05: 17.45, s06: 20.7, s07: 27.1, s08: 31.4, s09: 34.3, s10: 39.6, s11: 45.6, s12: 47.1, s13: 51.8 };
  const has = (p) => words(p).length > 0;
  const at = (p) => (has(p) ? words(p)[0].t0 : FB[p]);
  const wi = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t0 : at(p) + 0.3 * i);
  const we = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t1 : at(p) + 0.3 * i + 0.26);
  const wv = (p, ...ix) => ix.map((i) => wi(p, i));
  const lastE = (p) => (has(p) ? words(p)[words(p).length - 1].t1 : at(p) + 2.5);
  const LINES = ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10', 's11', 's12', 's13'];
  let T = null;
  function times() {
    if (T) return T;
    const t = {
      a: Object.fromEntries(LINES.map((p) => [p, at(p)])),
      cause: wi('s01', 6), front: wi('s02', 4), accident: wi('s02', 6), signal: wi('s02', 8), pothole: wi('s02', 12), potholeE: we('s02', 12),
      japan: wi('s03', 6), nothing: wi('s03', 12), cars: wi('s04', 1), circle: wi('s04', 3), rule: wi('s04', 5), steady: wi('s04', 8),
      slowed: wi('s05', 3), little: wi('s05', 7), behind: wi('s06', 2), late: wi('s06', 6), braked: wi('s06', 8), harder: wi('s06', 9), next: wi('s06', 11),
      harder2: wi('s06', 12), still: wi('s06', 13), until: wi('s06', 14), stopped: wi('s06', 16), stoppedE: we('s06', 16), backwards: wi('s07', 4), bicycle: wi('s07', 10), knew: wi('s08', 6),
      road9: wi('s09', 6), us: wi('s09', 8), late9: wi('s09', 13), yr10: wi('s10', 1), car10: wi('s10', 6), steady10: wi('s10', 14),
      faded: wi('s11', 2), gap: wi('s12', 3), ends: wi('s12', 10), jam12: wi('s12', 12), starts: wi('s13', 4), end: tb('end'),
    };
    const a = t.a;
    // the cuts (13 shots), each on a phrase of the voice, a beat before it
    t.cut = [0, a.s02 - 0.12, a.s03 - 0.15, a.s04 - 0.15, a.s05 - 0.15, a.s06 - 0.15, a.s07 - 0.15, a.s08 - 0.15, a.s09 - 0.15,
      a.s10 - 0.15, a.s11 - 0.15, a.s12 - 0.15, a.s13 - 0.15, t.end];
    // film time → simulation time, per scenario (keys on the voice's words; always forwards)
    t.mapRoad = [[0, 12], [t.cut[2], 12 + t.cut[2]]];
    t.mapRing = [[t.cut[2], 0.5], [t.slowed - 0.15, 10], [t.little, 11.4], [t.behind, 11.9], [t.harder, 12.6], [t.next, 13.3], [t.stopped, 15.3],
      [t.cut[6], 16], [t.cut[7], 24], [t.cut[8], 27]];
    t.mapStern9 = [[t.cut[9], 26], [t.cut[10], 39]];                            // the waves, before the car takes over at 40 s
    t.mapStern10 = [[t.cut[10], 112], [t.cut[11], 116]];                        // 70 s later: calm
    t.mapFix = [[t.cut[11], 46], [t.starts - 0.2, 61], [t.end, 64.5]];
    T = t; return T;
  }
  const keyed = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1] + (t - keys[0][0]);
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [a0, b0] = keys[i - 1], [a1, b1] = keys[i]; return lerp(b0, b1, (t - a0) / Math.max(1e-6, a1 - a0)); }
    const [aN, bN] = keys[keys.length - 1]; return bN + (t - aN);
  };

  // ------------------------------------------------------------------ type (DOM, the text zone), as in AI171
  const line = (parent, text, o) => TYPE.line(parent, text, { cls: 'display', ...o });
  function rise(t, L, tins, tout = null, o = {}) {
    const preset = o.preset || 'heavy', below = L.size * 1.45, above = -L.size * 1.45;
    L.words.forEach((w, i) => {
      const ti = Array.isArray(tins) ? tins[Math.min(i, tins.length - 1)] : tins + i * (o.stagger ?? 0.05);
      let y = below * (1 - hit(t, ti, preset));
      if (tout != null) y += above * st(t, tout - 0.15 + i * 0.015, 'snappy');
      put(w, { y, hide: y >= below * 0.999 || y <= above * 0.999 });
    });
  }
  function light(t, L, times, acc = []) {
    L.words.forEach((w, i) => {
      const on = t >= times[Math.min(i, times.length - 1)] - 0.04, a = acc.includes(i);
      put(w, { css: { color: a ? (on ? 'var(--accent)' : 'rgba(255,59,31,0.7)') : (on ? '' : 'rgba(236,232,225,0.78)') } });
    });
  }
  const mono = (parent, html, x, y, size = 30, color = 'var(--ink-2)') =>
    reg(el('div', { class: 'abs mono', style: `left:${x}px;top:${y}px;font-size:${size}px;color:${color}` }, parent, html), { o: 0 });
  function enter(t, e, t0, out) {
    const p = hit(t, t0, 'default'), ex = out != null ? st(t, out - 0.14, 'snappy') : 0;
    put(e, { o: clamp(p * 5) * (1 - clamp(ex * 1.6)), y: 24 * (1 - p) - 24 * ex });
  }
  function under(root) {
    return el('div', { class: 'abs', style: `width:${W}px;height:${H}px;pointer-events:none;background:` +
      'linear-gradient(180deg, rgba(7,9,12,0.6) 0px, rgba(7,9,12,0) 320px, rgba(7,9,12,0) 960px, rgba(7,9,12,0.8) 1190px, rgba(7,9,12,0.9) 100%),' +
      'radial-gradient(ellipse 90% 75% at 50% 42%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%)' }, root);
  }

  // ------------------------------------------------------------------ canvas helpers
  function shotCam(g, t, i, o = {}) {
    const T = times(), u = t - T.cut[i], d = Math.max(0.5, T.cut[i + 1] - T.cut[i]), dr = drift(t, o.drift ?? 5);
    let kx = 0, ky = 0; for (const [k0, a] of o.kicks || []) { const q = kick(t, k0, a); kx += q.x; ky += q.y; }
    const c = { s: (o.s0 ?? 1) + (o.push ?? 0.04) * eio(clamp(u / d)), x: dr.x + kx, y: dr.y + ky, ox: 540, oy: o.oy ?? 740 };
    cam(g, c); return c;
  }
  const screen = (g) => g.setTransform(1, 0, 0, 1, 0, 0);
  const proj = (c, x, y) => [c.ox + c.s * (x - c.ox) + c.x, c.oy + c.s * (y - c.oy) + c.y];
  function ground(g, col = BG) { g.fillStyle = col; g.fillRect(-400, -400, W + 800, H + 800); }
  function grid(g, a = 0.06) {
    g.strokeStyle = `rgba(141,148,156,${a})`; g.lineWidth = 1;
    for (let x = 40; x < W; x += 80) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x, H + 200); g.stroke(); }
    for (let y = 40; y < H; y += 80) { g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); }
  }
  function mlabel(g, s, x, y, a = 1, o = {}) {
    if (a <= 0.01) return;
    const size = o.size || 26;
    g.save(); g.globalAlpha *= a; font(g, size, o.w || 700, 'normal', 'Mono'); g.letterSpacing = '0.06em'; g.textAlign = o.align || 'left';
    if (o.bg) { const w = g.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; g.fillStyle = o.bg === true ? 'rgba(7,9,12,0.82)' : o.bg; g.fillRect(x0 - 12, y - size * 0.95, w + 24, size * 1.38); }
    g.fillStyle = o.c || INK; g.fillText(s, x, y); g.restore();
  }
  const eyebrow = (g, s, t, t0, c = INK2) => { screen(g); mlabel(g, s, X0, 330, clamp((t - t0) / 0.25), { size: 26, c, bg: 'rgba(7,9,12,0.6)' }); };
  function stamp(g, x, y, k, text, color, rot = -0.08, size = 64) {
    if (k <= 0.005) return;
    const s = 1 + 0.6 * (1 - eo(clamp(k / 0.6)));
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= clamp(k * 3);
    font(g, size, 700, 'condensed'); g.textAlign = 'center'; const w = g.measureText(text).width + 46;
    g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(-w / 2, -size * 0.72, w, size * 1.29); g.fillStyle = color; g.fillText(text, 0, size * 0.32); g.restore();
  }
  function simClock(g, tSim, rate, t) {                         // honest time: the simulation's own clock, and how fast it plays
    screen(g);
    const r = rate > 1.15 ? `${rate.toFixed(rate < 10 ? 1 : 0)}× SPEED` : rate < 0.87 ? 'SLOW MOTION' : 'REAL TIME';
    mlabel(g, `SIM ${tSim.toFixed(1).padStart(5, ' ')} S · ${r}`, 940, 330, 1, { size: 24, c: INK2, align: 'right', bg: 'rgba(7,9,12,0.6)' });
  }
  const rateOf = (keys, t) => (keyed(keys, t + 0.05) - keyed(keys, t - 0.05)) / 0.1;

  // ------------------------------------------------------------------ vehicles, from above, at night (our own drawings)
  const PAINT = ['#d9dde1', '#bfc4c9', '#8d949c', '#ece8e1', '#4a5058', '#9c2a1c', '#2c3d5a', '#e6e1d6', '#a3abb3', '#e7e4dc'];
  const WIDTH = { car: 1.8, suv: 1.95, auto: 1.35, bike: 0.75, bus: 2.5 };
  function brakeOf(a, v) { return Math.max(clamp((-a - 0.25) / 1.6), v < 0.6 ? 0.85 : 0); }
  // centre (x, y) in px, heading ang (0 = up), px per metre s; o: { brake 0..1, paint, mark: colour of a highlight ring }
  function vehicle(g, kind, len, x, y, ang, s, o = {}) {
    const L = len * s, Wd = (WIDTH[kind] || 1.8) * s, br = o.brake || 0;
    g.save(); g.translate(x, y); g.rotate(ang);
    if (o.beams !== false) {                                    // headlights on the road ahead
      const gr = g.createLinearGradient(0, -L / 2, 0, -L / 2 - 9 * s);
      gr.addColorStop(0, 'rgba(255,236,190,0.22)'); gr.addColorStop(1, 'rgba(255,236,190,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-Wd * 0.45, -L / 2); g.lineTo(-Wd * 1.1, -L / 2 - 9 * s); g.lineTo(Wd * 1.1, -L / 2 - 9 * s); g.lineTo(Wd * 0.45, -L / 2); g.closePath(); g.fill();
    }
    if (br > 0.02) {                                            // brake lights glow on the road behind
      const gr = g.createRadialGradient(0, L / 2, 0, 0, L / 2, (2.4 + 2.6 * br) * s);
      gr.addColorStop(0, `rgba(255,40,24,${(0.55 * br).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,40,24,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, L / 2, (2.4 + 2.6 * br) * s, 0, TAU); g.fill();
    }
    if (o.mark) { g.strokeStyle = o.mark; g.lineWidth = Math.max(2, 0.22 * s); g.beginPath(); g.ellipse(0, 0, Wd * 0.95, L * 0.72, 0, 0, TAU); g.stroke(); }
    if (kind === 'bike') {
      g.fillStyle = '#20242a'; g.beginPath(); g.roundRect(-Wd * 0.22, -L / 2, Wd * 0.44, L, Wd * 0.2); g.fill();
      g.fillStyle = o.paint || '#c9cdd2'; g.beginPath(); g.ellipse(0, L * 0.06, Wd * 0.48, L * 0.2, 0, 0, TAU); g.fill();       // the rider
      g.fillStyle = o.helmet || '#e7e4dc'; g.beginPath(); g.arc(0, -L * 0.05, Wd * 0.3, 0, TAU); g.fill();
      g.fillStyle = '#fff3cf'; g.fillRect(-Wd * 0.1, -L / 2 - 0.1 * s, Wd * 0.2, 0.18 * s);
      g.fillStyle = br > 0.02 ? `rgba(255,${60 - 40 * br | 0},40,1)` : '#7a1a12'; g.fillRect(-Wd * 0.12, L / 2 - 0.12 * s, Wd * 0.24, 0.16 * s);
      g.restore(); return;
    }
    if (kind === 'auto') {                                      // a Bengaluru auto: a black canopy, a yellow-green body, one front wheel
      g.fillStyle = '#2e7d32'; g.beginPath(); g.moveTo(0, -L / 2); g.lineTo(Wd * 0.42, -L * 0.18); g.lineTo(Wd / 2, L / 2); g.lineTo(-Wd / 2, L / 2); g.lineTo(-Wd * 0.42, -L * 0.18); g.closePath(); g.fill();
      g.fillStyle = '#e8d21d'; g.beginPath(); g.moveTo(0, -L / 2 + 0.1 * s); g.lineTo(Wd * 0.34, -L * 0.2); g.lineTo(-Wd * 0.34, -L * 0.2); g.closePath(); g.fill();
      g.fillStyle = '#16181c'; g.beginPath(); g.roundRect(-Wd * 0.47, -L * 0.16, Wd * 0.94, L * 0.62, 0.25 * s); g.fill();
      g.fillStyle = '#fff3cf'; g.beginPath(); g.arc(0, -L / 2 + 0.25 * s, 0.13 * s, 0, TAU); g.fill();
    } else {
      const body = o.paint || PAINT[0], R = 0.45 * s;
      g.fillStyle = kind === 'bus' ? '#3d6fa8' : body; g.beginPath(); g.roundRect(-Wd / 2, -L / 2, Wd, L, R); g.fill();
      if (kind === 'bus') {
        g.fillStyle = '#d8dde3'; g.fillRect(-Wd * 0.42, -L / 2 + 0.6 * s, Wd * 0.84, L - 1.2 * s);
        g.fillStyle = '#9aa3ab'; g.fillRect(-Wd * 0.25, -L * 0.1, Wd * 0.5, L * 0.18);
      } else {
        g.fillStyle = 'rgba(20,28,40,0.85)'; g.beginPath(); g.roundRect(-Wd * 0.4, -L * 0.24, Wd * 0.8, L * 0.17, 0.2 * s); g.fill();   // windscreen
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.roundRect(-Wd * 0.38, -L * 0.06, Wd * 0.76, L * 0.34, 0.2 * s); g.fill();  // roof
        g.fillStyle = 'rgba(20,28,40,0.8)'; g.beginPath(); g.roundRect(-Wd * 0.36, L * 0.3, Wd * 0.72, L * 0.1, 0.15 * s); g.fill();   // rear window
      }
      g.fillStyle = '#fff3cf'; g.fillRect(-Wd * 0.42, -L / 2, Wd * 0.2, 0.18 * s); g.fillRect(Wd * 0.22, -L / 2, Wd * 0.2, 0.18 * s);
    }
    const tl = br > 0.02 ? `rgb(255,${(70 - 50 * br) | 0},${(50 - 30 * br) | 0})` : '#6e1710';
    g.fillStyle = tl; g.fillRect(-Wd * 0.44, L / 2 - 0.2 * s, Wd * 0.24, 0.2 * s); g.fillRect(Wd * 0.2, L / 2 - 0.2 * s, Wd * 0.24, 0.2 * s);
    g.restore();
  }
  const paintOf = (sim, i, salt = 0) => PAINT[(i * 7 + salt * 3) % PAINT.length];

  // ------------------------------------------------------------------ the road (Bengaluru, at night): travel is up the screen
  const LANE = 3.6;
  const laneX = (l, s) => 540 + (l - 1) * LANE * s;
  // world position x (m along the road) → screen y, for a camera at cx (m) with s px/m and the camera's anchor ay (px)
  const ry = (x, cx, s, ay = 960) => ay - (x - cx) * s;
  function roadBg(g, cx, s, o = {}) {
    const ay = o.ay ?? 960, half = (1.5 * LANE + 2.4) * s;
    g.fillStyle = '#0b0d10'; g.fillRect(-400, -400, W + 800, H + 800);
    const top = cx + (ay + 400) / s, bot = cx - (H - ay + 400) / s;
    g.fillStyle = '#16191e'; g.fillRect(540 - half, -400, half * 2, H + 800);                                    // asphalt
    g.fillStyle = '#1f2329'; g.fillRect(540 - half - 2.6 * s, -400, 2.6 * s, H + 800); g.fillRect(540 + half, -400, 2.6 * s, H + 800);   // footpaths
    g.strokeStyle = 'rgba(236,232,225,0.55)'; g.lineWidth = Math.max(1.5, 0.15 * s);
    g.beginPath(); g.moveTo(540 - 1.5 * LANE * s, -400); g.lineTo(540 - 1.5 * LANE * s, H + 400); g.moveTo(540 + 1.5 * LANE * s, -400); g.lineTo(540 + 1.5 * LANE * s, H + 400); g.stroke();
    g.strokeStyle = 'rgba(236,232,225,0.4)';                                                                      // lane dashes, fixed to the road
    for (const lx of [540 - 0.5 * LANE * s, 540 + 0.5 * LANE * s]) {
      for (let x = Math.floor(bot / 9) * 9; x < top; x += 9) { const y0 = ry(x, cx, s, ay), y1 = ry(x + 3, cx, s, ay); g.beginPath(); g.moveTo(lx, y0); g.lineTo(lx, y1); g.stroke(); }
    }
    for (let x = Math.floor(bot / 34) * 34; x < top; x += 34) {                                                    // streetlights: warm pools
      for (const side of [-1, 1]) {
        const lx = 540 + side * (half + 1.3 * s), y = ry(x + (side > 0 ? 17 : 0), cx, s, ay), rr = 9 * s;
        const gr = g.createRadialGradient(lx, y, 0, lx, y, rr); gr.addColorStop(0, 'rgba(255,170,80,0.14)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(lx, y, rr, 0, TAU); g.fill();
        g.fillStyle = '#ffd59a'; g.beginPath(); g.arc(lx, y, Math.max(2, 0.3 * s), 0, TAU); g.fill();
      }
    }
    for (let x = Math.floor(bot / 13) * 13; x < top; x += 13) {                                                    // trees along the footpath
      for (const side of [-1, 1]) {
        const h = Math.sin(x * 12.9898 + side * 78.233) * 43758.5453, jx = (h - Math.floor(h)) - 0.5;
        g.fillStyle = 'rgba(28,44,32,0.92)'; g.beginPath(); g.arc(540 + side * (half + (4 + jx * 2) * s), ry(x + 6 * side, cx, s, ay), (2.6 + jx) * s, 0, TAU); g.fill();
      }
    }
  }
  function roadCars(g, sims, tSim, cx, s, o = {}) {
    const ay = o.ay ?? 960, top = cx + (ay + 200) / s, bot = cx - (H - ay + 200) / s;
    sims.forEach((sim, l) => {
      const st8 = sim.state(tSim), Lr = sim.L;
      for (let i = 0; i < sim.n; i++) {
        let x = st8.x[i]; x -= Math.floor((x - bot) / Lr) * Lr;                 // the loop: draw each vehicle once, nearest the camera
        if (x > top || x < bot) continue;
        const mark = o.mark && o.mark(l, i);
        vehicle(g, sim.kind[i], sim.len[i], laneX(l, s), ry(x, cx, s, ay), 0, s, { brake: brakeOf(st8.a[i], st8.v[i]), paint: paintOf(sim, i, l), mark, helmet: PAINT[(i + l) % PAINT.length] });
      }
    });
  }
  // where the slow part of a lane is (m): the queue's back and front at tSim
  function slowSpan(sim, tSim, vMax = 2.5) {
    const s8 = sim.state(tSim); let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < sim.n; i++) if (s8.v[i] < vMax) { lo = Math.min(lo, s8.x[i]); hi = Math.max(hi, s8.x[i]); }
    return [lo, hi];
  }

  // ------------------------------------------------------------------ the ring (a test track, from above)
  function ringBg(g, cx, cy, R, s, o = {}) {
    ground(g, '#0a0d11'); grid(g, 0.05);
    const w = 6 * s;
    g.fillStyle = '#16191e'; g.beginPath(); g.arc(cx, cy, R + w / 2, 0, TAU); g.arc(cx, cy, R - w / 2, 0, TAU, true); g.fill();
    g.strokeStyle = 'rgba(236,232,225,0.5)'; g.lineWidth = Math.max(1.5, 0.15 * s);
    g.beginPath(); g.arc(cx, cy, R + w / 2, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, R - w / 2, 0, TAU); g.stroke();
    for (let k = 0; k < 24; k++) {                                                                               // cones on the inside edge
      const th = k / 24 * TAU, x = cx + Math.cos(th) * (R - w / 2 - 1.2 * s), y = cy - Math.sin(th) * (R - w / 2 - 1.2 * s);
      g.fillStyle = AMB; g.beginPath(); g.arc(x, y, Math.max(2.5, 0.3 * s), 0, TAU); g.fill();
    }
    if (o.label) mlabel(g, o.label, cx, cy + 10, o.labelA ?? 1, { size: 26, c: INK2, align: 'center' });
  }
  const ringPos = (sim, x, cx, cy, R) => { const th = (x / sim.L) * TAU + PI / 2; return [cx + Math.cos(th) * R, cy - Math.sin(th) * R, -(th - PI / 2)]; };
  function ringCars(g, sim, tSim, cx, cy, R, s, o = {}) {
    const st8 = sim.state(tSim);
    for (let i = 0; i < sim.n; i++) {
      const [x, y, ang] = ringPos(sim, st8.x[i], cx, cy, R);
      vehicle(g, 'car', sim.len[i], x, y, ang, s, { brake: brakeOf(st8.a[i], st8.v[i]), paint: o.paint ? o.paint(i) : PAINT[i % PAINT.length], mark: o.mark && o.mark(i), beams: o.beams });
    }
    return st8;
  }
  function tag(g, x, y, text, c = INK, a = 1, size = 26) { mlabel(g, text, x, y, a, { size, c, align: 'center', bg: 'rgba(7,9,12,0.8)' }); }

  // ------------------------------------------------------------------ the shots
  const RS = 9.5, RR = (RING.L / TAU) * RS;                    // the ring at 9.5 px/m: radius ≈ 348 px
  const SR = 8.6, SRR = (STERN.L / TAU) * SR;
  function shHook(g, t) {                                       // 0 · a Bengaluru jam, close: brake lights to the horizon
    const T = times(), tS = keyed(T.mapRoad, t), [back] = slowSpan(ROAD[1], tS);
    shotCam(g, t, 0, { push: 0.05, oy: 960 });
    const s = 26, cx = back + 22;
    roadBg(g, cx, s); roadCars(g, ROAD, tS, cx, s);
    eyebrow(g, 'BENGALURU · A TRAFFIC SIMULATION · 315 VEHICLES', t, -0.3);
  }
  function shRace(g, t) {                                       // 1 · follow it to the front: nothing there
    const T = times(), tS = keyed(T.mapRoad, t), [b0, f0] = slowSpan(ROAD[1], tS);
    const u = eio(clamp((t - T.cut[1]) / Math.max(1.2, T.pothole - 0.4 - T.cut[1])));
    const cx = lerp(b0 + 22, f0 + 55, u), s = lerp(26, 13, u) / (1 + 3.2 * Math.sin(PI * u));   // pull out mid-race, land close at the front
    shotCam(g, t, 1, { push: 0.0, oy: 960 });
    roadBg(g, cx, s); roadCars(g, ROAD, tS, cx, s);
    if (u > 0.2 && u < 0.85) { screen(g); g.save(); g.globalAlpha = 0.25 * Math.sin(PI * (u - 0.2) / 0.65); g.strokeStyle = INK; g.lineWidth = 2;  // speed lines
      const r = mulberry32(Math.round(t * 30)); for (let k = 0; k < 18; k++) { const x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 90 + r() * 120); g.stroke(); } g.restore(); }
    screen(g);
    const items = [['ACCIDENT', T.accident], ['SIGNAL', T.signal], ['POTHOLE', T.pothole]];
    items.forEach(([w, tw], k) => { const kk = clamp((t - (tw - 0.05)) / 0.22); if (kk > 0) { mlabel(g, w, 300, 520 + k * 120, kk, { size: 44, c: INK, bg: 'rgba(7,9,12,0.75)' }); stamp(g, 640, 505 + k * 120, kk, 'NONE', ACC, -0.06, 44); } });
    eyebrow(g, 'NOTHING BLOCKS THIS ROAD: NO OBSTACLE IN THE SIMULATION', t, T.cut[1] + 0.1);
    simClock(g, tS, 1, t);
  }
  function ringShot(g, t, i, o = {}) {                          // the ring, as the shots 2–7 frame it
    const T = times(), tS = keyed(T.mapRing, t), rate = rateOf(T.mapRing, t);
    const c = shotCam(g, t, i, { push: o.push ?? 0.04, oy: 760, s0: o.s0 ?? 1, kicks: o.kicks });
    const cx = 540, cy = 760;
    ringBg(g, cx, cy, RR, RS, { label: o.label, labelA: o.labelA });
    const s8 = ringCars(g, RING, tS, cx, cy, RR, RS, { mark: (k) => (k === RING.slowed && o.markSlowed ? AMB : null) });
    return { tS, rate, s8, cx, cy, c };
  }
  function shJapan(g, t) {                                      // 2 · 2008, Japan: a jam out of nothing
    const T = times(); ringShot(g, t, 2, { label: 'JAPAN · 2008', labelA: clamp((t - (T.japan - 0.2)) / 0.3) });
    eyebrow(g, 'SUGIYAMA ET AL. · NEW JOURNAL OF PHYSICS · 2008', t, T.cut[2] + 0.05);
    simClock(g, keyed(T.mapRing, t), rateOf(T.mapRing, t), t);
  }
  function shRule(g, t) {                                       // 3 · 22 cars, one circle, one rule
    const T = times(), { tS, rate } = ringShot(g, t, 3, { label: '230 M · 22 CARS', labelA: 1 });
    screen(g);
    const kR = clamp((t - (T.rule - 0.1)) / 0.3);
    mlabel(g, 'ONE RULE: KEEP A STEADY SPEED', 540, 1185, kR, { size: 30, c: INK, align: 'center', bg: 'rgba(7,9,12,0.8)' });
    eyebrow(g, 'THE TRACK AND THE CARS, SIMULATED', t, T.cut[3] + 0.05);
    simClock(g, tS, rate, t);
  }
  function shOne(g, t) {                                        // 4 · then one driver slowed down: just a little
    const T = times(), { tS, rate, s8, cx, cy, c } = ringShot(g, t, 4, { markSlowed: true, s0: 1.0, push: 0.12 });
    const [x, y] = proj(c, ...ringPos(RING, s8.x[RING.slowed], cx, cy, RR));
    screen(g);
    const k = clamp((t - (T.slowed - 0.3)) / 0.3);
    tag(g, x, y - 80, `THIS DRIVER · ${kmh(s8.v[RING.slowed])} KM/H`, AMB, k, 28);
    eyebrow(g, `EVERY CAR AT ${kmh(RING.vSteady)} KM/H · THEN ONE BRAKES GENTLY`, t, T.cut[4] + 0.05);
    simClock(g, tS, rate, t);
  }
  function shCascade(g, t) {                                    // 5 · each one behind brakes harder, until someone stops
    const T = times(), { tS, rate, s8, cx, cy, c } = ringShot(g, t, 5, { markSlowed: true, s0: 1.0, push: 0.05, kicks: [[T.stopped - 0.05, 10]] });
    screen(g);
    const show = [[1, T.behind], [2, T.harder], [3, T.next], [4, T.until]];                         // followers 1..4 by the words
    for (const [k, tw] of show) {
      const i = (RING.n - k) % RING.n, [x, y] = proj(c, ...ringPos(RING, s8.x[i], cx, cy, RR)), a = clamp((t - (tw - 0.1)) / 0.25);
      const v = kmh(s8.v[i]); if (a <= 0) continue;
      tag(g, x + (x < cx ? -90 : 90), y, v <= 1 ? 'STOPPED' : `${v} KM/H`, v <= 1 ? ACC : INK, a, 26);
    }
    eyebrow(g, 'EACH DRIVER REACTS 0.6 S LATE (THE MODEL)', t, T.cut[5] + 0.05);
    simClock(g, tS, rate, t);
  }
  function bicycle(g, x, y, ang, sc, c) {                     // facing ang (canvas angle of travel); kept wheels-down
    const left = Math.cos(ang) < 0;
    g.save(); g.translate(x, y); g.rotate(left ? ang + PI : ang); g.scale(left ? -sc : sc, sc); g.strokeStyle = c; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.arc(-26, 10, 16, 0, TAU); g.stroke(); g.beginPath(); g.arc(26, 10, 16, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(-26, 10); g.lineTo(-4, -12); g.lineTo(18, -12); g.lineTo(26, 10); g.moveTo(-4, -12); g.lineTo(2, 10); g.lineTo(-26, 10); g.moveTo(18, -12); g.lineTo(14, -24); g.lineTo(6, -24); g.stroke();
    g.restore();
  }
  function shBackwards(g, t) {                                  // 6 · the jam moves backwards at bicycle speed
    const T = times(), { tS, rate, s8, cx, cy } = ringShot(g, t, 6, { push: 0.03, s0: 0.95 });
    // the jam's middle: the circular mean of the slow cars' angles
    let sx = 0, sy = 0, c = 0; for (let i = 0; i < RING.n; i++) if (s8.v[i] < 2.2) { const th = (s8.x[i] / RING.L) * TAU; sx += Math.cos(th); sy += Math.sin(th); c++; }
    if (c) {
      const th = Math.atan2(sy, sx) + PI / 2, R2 = RR + 120, bx = cx + Math.cos(th) * R2, by = cy - Math.sin(th) * R2;
      const kB = clamp((t - (T.bicycle - 0.25)) / 0.3);
      bicycle(g, bx, by, -th + PI / 2, 1.3, `rgba(255,59,31,${(0.35 + 0.65 * kB).toFixed(3)})`);            // it rides the other way (clockwise)
      g.save(); g.strokeStyle = 'rgba(255,59,31,0.7)'; g.lineWidth = 6; g.lineCap = 'round';                  // the jam's direction: backwards
      g.beginPath(); g.arc(cx, cy, RR + 70, -th + 0.05, -th + 0.55); g.stroke();
      const ea = -th + 0.55, ex = cx + Math.cos(ea) * (RR + 70), ey = cy + Math.sin(ea) * (RR + 70);
      g.translate(ex, ey); g.rotate(ea); g.fillStyle = 'rgba(255,59,31,0.9)'; g.beginPath(); g.moveTo(0, 16); g.lineTo(-13, -8); g.lineTo(13, -8); g.closePath(); g.fill(); g.restore();
      g.save(); g.strokeStyle = 'rgba(236,232,225,0.55)'; g.lineWidth = 4; g.setLineDash([10, 12]);             // the cars' direction: forwards
      g.beginPath(); g.arc(cx, cy, RR - 70, -th - 0.5, -th - 0.05, false); g.stroke();
      const fa = -th - 0.5, fx = cx + Math.cos(fa) * (RR - 70), fy = cy + Math.sin(fa) * (RR - 70);
      g.setLineDash([]); g.translate(fx, fy); g.rotate(fa + PI); g.fillStyle = 'rgba(236,232,225,0.75)'; g.beginPath(); g.moveTo(0, 14); g.lineTo(-11, -7); g.lineTo(11, -7); g.closePath(); g.fill(); g.restore();
      screen(g); mlabel(g, 'THE JAM', bx, by + 70, 1, { size: 26, c: ACC, align: 'center', bg: 'rgba(7,9,12,0.8)' });
    }
    eyebrow(g, 'ON HIGHWAYS JAMS TRAVEL BACK AT 15 ± 5 KM/H · HERE ~10', t, T.cut[6] + 0.05);
    simClock(g, tS, rate, t);
  }
  function shNeverKnew(g, t) {                                  // 7 · the driver who started it never knew
    const T = times(), tS = keyed(T.mapRing, t), rate = rateOf(T.mapRing, t), s8a = RING.state(tS);
    const [x0, y0] = ringPos(RING, s8a.x[RING.slowed], 540, 760, RR);
    const z = 1.9; shotCam(g, t, 7, { push: 0.04, oy: 760 });
    g.translate(540, 760); g.scale(z, z); g.translate(-x0, -y0);                   // follow the car that started it
    ringBg(g, 540, 760, RR, RS);
    const s8 = ringCars(g, RING, tS, 540, 760, RR, RS, { mark: (k) => (k === RING.slowed ? AMB : null) });
    screen(g);
    tag(g, 540, 640, `THIS DRIVER · ${kmh(s8.v[RING.slowed])} KM/H · NO IDEA`, AMB, clamp((t - (T.cut[7] + 0.1)) / 0.25), 28);
    let jamBehind = 0; for (let i = 0; i < RING.n; i++) if (s8.v[i] < 2.2) jamBehind++;
    mlabel(g, `${jamBehind} CARS STOPPED BEHIND, OUT OF SIGHT`, 540, 1150, clamp((t - (T.knew - 0.2)) / 0.25), { size: 26, c: ACC, align: 'center', bg: 'rgba(7,9,12,0.8)' });
    eyebrow(g, 'THE SIMULATION, FOLLOWING THE FIRST CAR', t, T.cut[7] + 0.05);
    simClock(g, tS, rate, t);
  }
  function shWhy(g, t) {                                        // 8 · the root cause: each of us brakes harder than the one ahead
    const T = times(); shotCam(g, t, 8, { push: 0.04, oy: 760 });
    ground(g, '#0a0d11'); grid(g, 0.06);
    const vs = kmh(RING.vSteady), names = ['THE FIRST DRIVER', 'BEHIND', 'NEXT', 'NEXT', 'NEXT'];
    mlabel(g, 'HOW MUCH EACH DRIVER SLOWED (KM/H)', X0, 470, clamp((t - (T.cut[8] + 0.05)) / 0.25), { size: 28, c: INK2 });
    DIPS.forEach((v, k) => {
      const d = vs - kmh(v), y = 560 + k * 112, kk = clamp((t - (T.cut[8] + 0.15 + k * 0.22)) / 0.3);
      if (kk <= 0) return;
      mlabel(g, names[k], X0, y + 34, kk, { size: 26, c: k === 0 ? AMB : INK });
      g.fillStyle = k === 4 ? ACC : 'rgba(236,232,225,0.85)'; g.fillRect(X0 + 300, y + 6, (560 * d / vs) * eo(kk), 40);
      mlabel(g, kmh(v) < 1 ? `−${d} · STOPPED` : `−${d}`, X0 + 312 + (560 * d / vs) * eo(kk), y + 36, kk, { size: 28, c: k === 4 ? ACC : INK });
    });
    const kL = clamp((t - (T.late9 - 0.2)) / 0.3);
    mlabel(g, 'EACH REACTS A BEAT LATE, SO EACH BRAKES HARDER', X0, 1150, kL, { size: 26, c: ACC, bg: 'rgba(7,9,12,0.8)' });
    eyebrow(g, 'FROM THE SIMULATION ABOVE', t, T.cut[8] + 0.05);
  }
  function sternShot(g, t, i, calm) {                           // 9–10 · 2018: one self-driving car holds a steady speed
    const T = times(), map = calm ? T.mapStern10 : T.mapStern9, tS = keyed(map, t), rate = rateOf(map, t);
    const c = shotCam(g, t, i, { push: 0.04, oy: 760 });
    ringBg(g, 540, 760, SRR, SR, { label: calm ? 'NO WAVES' : '260 M · 22 CARS', labelA: 1 });
    const s8 = ringCars(g, STERN, tS, 540, 760, SRR, SR, { paint: (k) => (k === STERN.av ? CYAN : PAINT[k % PAINT.length]), mark: (k) => (k === STERN.av ? CYAN : null) });
    const [x, y] = proj(c, ...ringPos(STERN, s8.x[STERN.av], 540, 760, SRR));
    screen(g);
    tag(g, x, y + (y > 760 ? 80 : -70), tS >= STERN.tc ? 'SELF-DRIVING · STEADY' : 'SELF-DRIVING', CYAN, 1, 26);
    let stopped = 0; for (let k = 0; k < STERN.n; k++) if (s8.v[k] < 0.8) stopped++;
    mlabel(g, `STOPPED NOW: ${stopped}`, 540, 1185, 1, { size: 28, c: stopped ? ACC : INK, align: 'center', bg: 'rgba(7,9,12,0.8)' });
    eyebrow(g, calm ? 'THE 2018 EXPERIMENT: UP TO 40% LESS FUEL' : 'STERN ET AL. · UNIVERSITY OF ARIZONA · 2018', t, T.cut[i] + 0.05);
    simClock(g, tS, rate, t);
  }
  function fixShot(g, t, i) {                                   // 11–12 · you leave a gap … or start the next jam
    const T = times(), tS = keyed(T.mapFix, t), rate = rateOf(T.mapFix, t), you = FIX[1].state(tS).x[FIX[1].av];
    const c = shotCam(g, t, i, { push: 0.03, oy: 960, kicks: i === 12 ? [[T.starts - 0.1, 8]] : [] });
    const s = 7.2, cx = you + 52, P = (x, y) => proj(c, x, y);
    roadBg(g, cx, s, { ay: 760 }); roadCars(g, FIX, tS, cx, s, { ay: 760, mark: (l, k) => (l === 1 && k === FIX[1].av ? INK : null) });
    screen(g);
    const [lx1, yy] = P(laneX(1, s), ry(you, cx, s, 760));
    tag(g, lx1, yy + 60, i === 12 && tS >= FIX[1].tTap ? 'YOU · BRAKE' : 'YOU', i === 12 && tS >= FIX[1].tTap ? ACC : INK, 1, 28);
    if (i === 11) {
      const kG = clamp((t - (T.gap - 0.2)) / 0.3);
      if (kG > 0) {                                             // the gap ahead of you
        const ahead = FIX[1].state(tS); let gx = Infinity; for (let k = 0; k < FIX[1].n; k++) { let d = ahead.x[k] - you; d -= Math.floor(d / FIX[1].L) * FIX[1].L; if (d > 1 && d < gx) gx = d; }
        const y1 = P(0, ry(you + gx - 2, cx, s, 760))[1], y0 = yy - 22;
        g.save(); g.globalAlpha = kG; g.strokeStyle = INK; g.lineWidth = 3; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(lx1 + 30, y0); g.lineTo(lx1 + 30, y1); g.stroke(); g.restore();
        mlabel(g, 'A GAP', lx1 + 46, (y0 + y1) / 2, kG, { size: 26, c: INK, bg: 'rgba(7,9,12,0.8)' });
      }
      mlabel(g, 'BEHIND YOU: NO BRAKING', 540, 1185, clamp((t - (T.ends - 0.2)) / 0.3), { size: 28, c: INK, align: 'center', bg: 'rgba(7,9,12,0.8)' });
    }
    eyebrow(g, 'BENGALURU · SIMULATED · THE MIDDLE LANE IS YOU', t, T.cut[i] + 0.05);
    simClock(g, tS, rate, t);
  }
  const SHOTS = [shHook, shRace, shJapan, shRule, shOne, shCascade, shBackwards, shNeverKnew, shWhy,
    (g, t) => sternShot(g, t, 9, false), (g, t) => sternShot(g, t, 10, true), (g, t) => fixShot(g, t, 11), (g, t) => fixShot(g, t, 12)];

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) {
      S.g = canvas(root); under(root);
      const L = (text, y, size, o = {}) => line(root, text, { x: X0, y, size, ...o });
      S.L = {
        h0a: L('This Bengaluru', TZ - 16, 130), h0b: L('traffic jam has no cause.', TZ + 124, 92, { accent: [3, 4] }),
        h1a: L('Follow it to the front.', TZ - 16, 104),
        h2a: L('2008, Japan:', TZ - 16, 130), h2b: L('a jam out of nothing.', TZ + 124, 110, { accent: [4] }),
        h3a: L('22 cars. One circle.', TZ - 16, 116), h3b: L('One rule: steady speed.', TZ + 114, 110, { accent: [2, 3] }),
        h4a: L('One driver slows.', TZ - 16, 124), h4b: L('Just a little.', TZ + 124, 124, { accent: [2] }),
        h5a: L('The one behind', TZ - 16, 124), h5b: L('brakes harder.', TZ + 124, 124, { accent: [1] }),
        h5c: L('Harder still,', TZ - 16, 124), h5d: L('until someone stops.', TZ + 124, 110, { accent: [2] }),
        h6a: L('The jam moves', TZ - 16, 140), h6b: L('backwards.', TZ + 134, 150, { accent: [0] }),
        h7a: L('The driver who started it', TZ - 16, 92), h7b: L('never knew.', TZ + 104, 140, { accent: [1] }),
        h8a: L('Not the road.', TZ - 16, 140), h8b: L('Us, braking too late.', TZ + 134, 110, { accent: [2, 3] }),
        h9a: L('2018: one self-driving car', TZ - 16, 92), h9b: L('held a steady speed.', TZ + 104, 110, { accent: [2, 3] }),
        h10a: L('The waves faded.', TZ - 16, 150, { accent: [2] }),
        h11a: L('Leave a gap.', TZ - 16, 150), h11b: L('End a jam.', TZ + 134, 150, { accent: [0] }),
        h12a: L('Or start one.', TZ - 16, 170, { accent: [1] }),
      };
      S.L.h2a.words[0].classList.add('tnum'); S.L.h9a.words[0].classList.add('tnum'); S.L.h3a.words[0].classList.add('tnum');
    },
    run(t, b, S) {
      const T = times(), L = S.L, g = S.g, c = T.cut; clear(g);
      let i = 0; while (i < SHOTS.length - 1 && t >= c[i + 1]) i++;
      SHOTS[i](g, t);
      const out = (k) => c[k + 1] - 0.05;
      const R = (Lx, tins, tout, lit, acc = []) => { rise(t, Lx, tins.map((x) => x - 0.06), tout); light(t, Lx, lit, acc); };
      rise(t, L.h0a, [-0.5, -0.45], out(0)); light(t, L.h0a, wv('s01', 0, 1));
      R(L.h0b, wv('s01', 2, 3, 4, 5, 6), out(0), wv('s01', 2, 3, 4, 5, 6), [3, 4]);
      R(L.h1a, wv('s02', 0, 1, 2, 3, 4), out(1), wv('s02', 0, 1, 2, 3, 4));
      R(L.h2a, [wi('s03', 1), T.japan], out(2), [wi('s03', 1), T.japan]); R(L.h2b, wv('s03', 8, 9, 10, 11, 12), out(2), wv('s03', 8, 9, 10, 11, 12), [4]);
      R(L.h3a, wv('s04', 0, 1, 2, 3), out(3), wv('s04', 0, 1, 2, 3)); R(L.h3b, wv('s04', 4, 5, 8, 9), out(3), wv('s04', 4, 5, 8, 9), [2, 3]);
      R(L.h4a, wv('s05', 1, 2, 3), out(4), wv('s05', 1, 2, 3)); R(L.h4b, wv('s05', 5, 6, 7), out(4), wv('s05', 5, 6, 7), [2]);
      R(L.h5a, wv('s06', 0, 1, 2), T.next - 0.12, wv('s06', 0, 1, 2)); R(L.h5b, [T.braked, T.harder], T.next - 0.12, [T.braked, T.harder], [1]);
      R(L.h5c, [T.harder2, T.still], out(5), [T.harder2, T.still]); R(L.h5d, [T.until, wi('s06', 15), T.stopped], out(5), [T.until, wi('s06', 15), T.stopped], [2]);
      R(L.h6a, wv('s07', 1, 2, 3), out(6), wv('s07', 1, 2, 3)); R(L.h6b, [T.backwards], out(6), [T.backwards], [0]);
      R(L.h7a, wv('s08', 0, 1, 2, 3, 4), out(7), wv('s08', 0, 1, 2, 3, 4)); R(L.h7b, wv('s08', 5, 6), out(7), wv('s08', 5, 6), [1]);
      R(L.h8a, wv('s09', 4, 5, 6), out(8), wv('s09', 4, 5, 6)); R(L.h8b, wv('s09', 8, 9, 12, 13), out(8), wv('s09', 8, 9, 12, 13), [2, 3]);
      R(L.h9a, [T.yr10, wi('s10', 4), wi('s10', 5), T.car10], out(9), [T.yr10, wi('s10', 4), wi('s10', 5), T.car10]);
      R(L.h9b, wv('s10', 12, 13, 14, 15), out(9), wv('s10', 12, 13, 14, 15), [2, 3]);
      R(L.h10a, wv('s11', 0, 1, 2), out(10), wv('s11', 0, 1, 2), [2]);
      R(L.h11a, wv('s12', 1, 2, 3), out(11), wv('s12', 1, 2, 3)); R(L.h11b, [T.ends, wi('s12', 11), T.jam12], out(11), [T.ends, wi('s12', 11), T.jam12], [0]);
      R(L.h12a, [wi('s13', 0), T.starts, wi('s13', 5)], T.end - 0.05, [wi('s13', 0), T.starts, wi('s13', 5)], [1]);
    },
  });

  // ================================================================ finish: grain (seeded, per frame), as in AI171
  scene({
    name: 'fx', from: 'hook', to: 'end',
    build(root, S) {
      const cv = el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:0.08` }, root);
      S.g = cv.getContext('2d'); S.tiles = K.grainTiles();
    },
    run(t, b, S) {
      const f = Math.round(t * 30), r = mulberry32(1000 + f), g = S.g;
      clear(g);
      const pat = g.createPattern(S.tiles[f % 4], 'repeat'), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
      g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256);
    },
  });

  window.UI.endcard();
  C.start();
})();
