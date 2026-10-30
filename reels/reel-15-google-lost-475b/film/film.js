// Reel 15 · Google Lost $475 Billion in a Day. Alphabet's worst day since its 2004 listing (29 Oct 2026, −12.6%,
// about $475 billion of market value), told as a paradox and its answer: sales +25%, Cloud +103%, so why the crash?
// The answer is in your search bar: search ads pay half of Google's bills, more searches now end in an AI answer that
// Google says earns less, and the AI bill is $51 billion a quarter (free cash flow below zero two quarters running).
// Google is paying for the AI that eats into its own search ads; the reel ends by typing Wall Street's question into a
// search bar. Every number on screen is from Alphabet's Q3 2026 release and call, or Yahoo Finance / MarketBeat
// (docs/research.md); the chart joins real prices only. Our own drawings: no logos, no real interface.
// Type in the text zone lit as the voice says it, mono sources, hard cuts, grain, as in AI171. 30 fps, no motion blur.
(() => {
  const { W, H, put, reg, el, scene, canvas, clamp, lerp, ease, mulberry32 } = C;
  const K = window.KIT;
  const { st, hit, tb, words, cam, clear, drift, kick, font } = K;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn', '400 30px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI, eio = ease.inOut, eo = ease.out;
  const X0 = 80, TZ = 1222;
  const INK = '#ece8e1', INK2 = '#8d949c', INK3 = '#3b434c', BG = '#07090c', ACC = '#ff3b1f', GRN = '#3ddc84', AMB = '#ffb23a', BLU = '#7fb0ff', VIO = '#b590ff';

  // ------------------------------------------------------------------ timing (the narration's words; estimates until the voice is placed)
  const FB = { s01: 0.5, s02: 5.0, s03: 7.3, s04: 11.0, s05: 13.5, s06: 15.4, s07: 20.7, s08: 25.8, s09: 28.8, s10: 34.5, s11: 37.2, s12: 41.5, s13: 45.4, s14: 47.4 };
  const has = (p) => words(p).length > 0;
  const at = (p) => (has(p) ? words(p)[0].t0 : FB[p]);
  const wi = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t0 : at(p) + 0.3 * i);
  const we = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t1 : at(p) + 0.3 * i + 0.26);
  const wv = (p, ...ix) => ix.map((i) => wi(p, i));
  const lastE = (p) => (has(p) ? words(p)[words(p).length - 1].t1 : at(p) + 2.5);
  const LINES = ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10', 's11', 's12', 's13', 's14'];
  let T = null;
  let LBL = null;                                              // the label layer (above the text zone's shade), set every frame
  function times() {
    if (T) return T;
    const t = {
      a: Object.fromEntries(LINES.map((p) => [p, at(p)])),
      dollars: wi('s01', 8), day: wi('s01', 11), nvidia: wi('s02', 1), grown: wi('s03', 6), pct25: wi('s03', 7), cloud: wi('s04', 1), doubled: wi('s04', 5),
      crash: wi('s05', 3), bar6: wi('s06', 6), half: wi('s06', 7), ads6: wi('s06', 14), aimode: wi('s07', 6), answers: wi('s07', 12),
      admitted: wi('s08', 2), less: wi('s08', 6), bill: wi('s09', 3), fifty: wi('s09', 4), months: wi('s09', 9), centres: wi('s09', 12),
      day10: wi('s10', 6), quarters: wi('s11', 1), spent: wi('s11', 6), brought: wi('s11', 11), paying: wi('s12', 1), eating: wi('s12', 7), ads12: wi('s12', 11),
      broke: wi('s13', 3), question: wi('s14', 6), q0: wi('s14', 7), qEnd: lastE('s14'), end: tb('end'),
    };
    const a = t.a;
    // the cuts (14 shots), each on a phrase of the voice, a beat before it
    t.cut = [0, ...LINES.slice(1).map((p) => a[p] - 0.15), t.end];
    T = t; return T;
  }

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
  const TONE = { red: ['var(--accent)', 'rgba(255,59,31,0.7)'], green: ['var(--green)', 'rgba(61,220,132,0.7)'], amber: ['var(--amber)', 'rgba(255,178,58,0.7)'], blue: ['var(--blue)', 'rgba(127,176,255,0.7)'] };
  function light(t, L, times, acc = []) {
    const [on1, off1] = TONE[L.tone || 'red'];
    L.words.forEach((w, i) => {
      const on = t >= times[Math.min(i, times.length - 1)] - 0.04, a = acc.includes(i);
      put(w, { css: { color: a ? (on ? on1 : off1) : (on ? '' : 'rgba(236,232,225,0.78)') } });
    });
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
    const c = { s: (o.s0 ?? 1) + (o.push ?? 0.04) * eio(clamp(u / d)), x: dr.x + kx, y: dr.y + ky, ox: 540, oy: o.oy ?? 760 };
    cam(g, c); return c;
  }
  const screen = (g) => g.setTransform(1, 0, 0, 1, 0, 0);
  function ground(g, col = BG) { g.fillStyle = col; g.fillRect(-400, -400, W + 800, H + 800); }
  function grid(g, a = 0.06) {
    g.strokeStyle = `rgba(141,148,156,${a})`; g.lineWidth = 1;
    for (let x = 40; x < W; x += 80) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x, H + 200); g.stroke(); }
    for (let y = 40; y < H; y += 80) { g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); }
  }
  function mlabel(g, s, x, y, a = 1, o = {}) {                 // drawn on the label layer, with g's transform and alpha
    if (a <= 0.01) return;
    const q = LBL || g, size = o.size || 26;
    q.save(); q.setTransform(g.getTransform()); q.globalAlpha = g.globalAlpha * a; font(q, size, o.w || 700, 'normal', 'Mono'); q.letterSpacing = '0.06em'; q.textAlign = o.align || 'left';
    if (o.bg) { const w = q.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; q.fillStyle = o.bg === true ? 'rgba(7,9,12,0.82)' : o.bg; q.fillRect(x0 - 12, y - size * 0.95, w + 24, size * 1.38); }
    q.fillStyle = o.c || INK; q.fillText(s, x, y); q.restore();
  }
  const eyebrow = (g, s, t, t0, c = INK2) => { screen(g); mlabel(g, s, X0, 330, clamp((t - t0) / 0.25), { size: 30, c, bg: 'rgba(7,9,12,0.6)' }); };
  function big(g, s, x, y, size, c, o = {}) {                  // display type on the canvas
    if ((o.a ?? 1) <= 0.005) return;
    g.save(); g.globalAlpha *= o.a ?? 1; font(g, size, o.w || 700, o.stretch || 'condensed', o.fam || 'Bahn'); g.textAlign = o.align || 'left';
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur ?? 40; }
    g.fillStyle = c; g.fillText(s, x, y); g.restore();
  }
  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const pulse = (t, t0, w = 0.09) => Math.exp(-(((t - t0) / w) ** 2));
  function coin(g, x, y, r, a = 1) {                          // a gold coin, $ on its face
    if (a <= 0.01) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = '#b97a14'; g.beginPath(); g.arc(x, y + r * 0.12, r, 0, TAU); g.fill();
    const gr = g.createLinearGradient(x - r, y - r, x + r, y + r); gr.addColorStop(0, '#ffd77a'); gr.addColorStop(1, '#f0a529');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(120,70,10,0.55)'; g.lineWidth = Math.max(1, r * 0.1); g.beginPath(); g.arc(x, y, r * 0.78, 0, TAU); g.stroke();
    font(g, r * 1.25, 700, 'condensed'); g.textAlign = 'center'; g.fillStyle = '#7a4a08'; g.fillText('$', x, y + r * 0.44); g.restore();
  }
  function sparkle(g, x, y, r, c, a = 1, rot = 0) {           // a four-point star: the AI's mark in this reel (our own)
    if (a <= 0.01) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.fillStyle = c; g.beginPath();
    for (let k = 0; k < 4; k++) { const th = k * PI / 2; g.lineTo(Math.cos(th) * r, Math.sin(th) * r); g.quadraticCurveTo(0, 0, Math.cos(th + PI / 4) * r * 0.16, Math.sin(th + PI / 4) * r * 0.16); }
    g.closePath(); g.fill(); g.restore();
  }
  function glass(g, x, y, r, c) {                              // a magnifying glass
    g.save(); g.strokeStyle = c; g.lineWidth = r * 0.28; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(x + r * 0.72, y + r * 0.72); g.lineTo(x + r * 1.55, y + r * 1.55); g.stroke(); g.restore();
  }
  function arrowHead(g, x, y, ang, s, c) {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = c; g.beginPath(); g.moveTo(s, 0); g.lineTo(-s * 0.7, s * 0.7); g.lineTo(-s * 0.7, -s * 0.7); g.closePath(); g.fill(); g.restore();
  }

  // ------------------------------------------------------------------ the crash (real prices: MarketBeat, 29 Oct 2026)
  const P_PREV = 324.89, P_LOW = 280.36, P_CLOSE = 283.82, LOSS = 475e9;
  const CH = { x0: 120, xa: 470, x1: 930, y0: 600, y1: 1110, p0: 272, p1: 332 };
  const py = (p) => lerp(CH.y1, CH.y0, (p - CH.p0) / (CH.p1 - CH.p0));
  const pathP = (x) => (x <= CH.xa ? P_PREV : P_PREV + (P_CLOSE - P_PREV) * (1 - Math.pow(1 - clamp((x - CH.xa) / (CH.x1 - CH.xa)), 2.6)));
  function crashChart(g, k, a = 1, o = {}) {                  // k: how far the line has drawn (0..1)
    g.save(); g.globalAlpha *= a;
    g.strokeStyle = 'rgba(141,148,156,0.18)'; g.lineWidth = 2;
    for (const p of [280, 300, 320]) { const y = py(p); g.beginPath(); g.moveTo(CH.x0, y); g.lineTo(CH.x1 + 30, y); g.stroke(); mlabel(g, `$${p}`, CH.x1 + 36, y + 9, a * 0.9, { size: 24, c: INK2 }); }
    g.setLineDash([10, 10]); g.strokeStyle = 'rgba(255,59,31,0.45)'; g.beginPath(); g.moveTo(CH.xa, py(P_LOW)); g.lineTo(CH.x1, py(P_LOW)); g.stroke(); g.setLineDash([]);
    if (!o.bare) mlabel(g, `DAY'S LOW $${P_LOW}`, CH.xa + 10, py(P_LOW) + 34, a * clamp((k - 0.7) / 0.2), { size: 24, c: 'rgba(255,120,100,0.9)' });
    const xEnd = lerp(CH.x0, CH.x1, clamp(k)), N = 140;
    // the fall, filled
    g.beginPath(); g.moveTo(CH.xa, py(P_PREV));
    for (let i = 0; i <= N; i++) { const x = lerp(CH.xa, Math.max(CH.xa, xEnd), i / N); g.lineTo(x, py(pathP(x))); }
    g.lineTo(Math.max(CH.xa, xEnd), py(P_PREV)); g.closePath();
    const gf = g.createLinearGradient(0, py(P_PREV), 0, py(P_CLOSE)); gf.addColorStop(0, 'rgba(255,59,31,0)'); gf.addColorStop(1, 'rgba(255,59,31,0.28)'); g.fillStyle = gf; g.fill();
    // the line
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); for (let i = 0; i <= N; i++) { const x = lerp(CH.x0, xEnd, i / N); i ? g.lineTo(x, py(pathP(x))) : g.moveTo(x, py(pathP(x))); }
    g.strokeStyle = 'rgba(255,59,31,0.35)'; g.lineWidth = 22; g.stroke();
    g.strokeStyle = ACC; g.lineWidth = 7; g.stroke();
    const hy = py(pathP(xEnd));
    g.fillStyle = '#fff'; g.beginPath(); g.arc(xEnd, hy, 9, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,59,31,0.35)'; g.beginPath(); g.arc(xEnd, hy, 26, 0, TAU); g.fill();
    g.restore();
    if (!o.bare) {
      mlabel(g, `28 OCT CLOSE $${P_PREV}`, CH.x0, py(P_PREV) - 26, a, { size: 26, c: INK });
      mlabel(g, 'THU 29 OCT', (CH.xa + CH.x1) / 2, CH.y1 + 50, a, { size: 24, c: INK2, align: 'center' });
      mlabel(g, 'WED 28 OCT', (CH.x0 + CH.xa) / 2, CH.y1 + 50, a, { size: 24, c: INK2, align: 'center' });
      const kc = clamp((k - 0.96) / 0.04);
      mlabel(g, `CLOSE $${P_CLOSE} · −12.6%`, CH.x1, py(P_CLOSE) - 34, a * kc, { size: 28, c: ACC, align: 'right', bg: 'rgba(7,9,12,0.75)' });
    }
  }
  function shHook(g, t) {                                       // 0 · Google just lost $475 billion. In one day.
    const T = times(), k = lerp(0.42, 1, eo(clamp((t + 0.2) / Math.max(1, T.dollars + 0.2))));
    shotCam(g, t, 0, { push: 0.05, oy: 860, kicks: [[0.02, 14], [T.day - 0.05, 8]] });
    ground(g, '#090b0f'); grid(g, 0.05);
    crashChart(g, k);
    screen(g);
    const v = LOSS * eo(clamp((t + 0.4) / Math.max(1, T.dollars + 0.25)));
    big(g, `−$${fmt(v)}`, 540, 520, 112, ACC, { align: 'center', glow: 'rgba(255,59,31,0.55)', blur: 46 });
    mlabel(g, 'ALPHABET (GOOGLE) · STOCK MARKET VALUE LOST', 540, 572, 1, { size: 26, c: INK2, align: 'center' });
    eyebrow(g, 'ALPHABET (GOOGL) · THU 29 OCT 2026', t, -0.3);
  }
  function shRank(g, t) {                                       // 1 · only Nvidia has ever lost more
    const T = times(); shotCam(g, t, 1, { push: 0.03 });
    ground(g, '#090b0f'); grid(g, 0.05);
    screen(g);
    mlabel(g, 'BIGGEST ONE-DAY LOSSES OF STOCK MARKET VALUE', X0, 470, clamp((t - T.cut[1] + 0.12) / 0.2), { size: 28, c: INK2 });
    mlabel(g, 'US-LISTED COMPANIES · YAHOO FINANCE / BLOOMBERG DATA', X0, 508, clamp((t - T.cut[1] + 0.12) / 0.2), { size: 22, c: INK3 });
    const rows = [['#1 NVIDIA', 593, 'MON 27 JAN 2025 · DEEPSEEK', INK, T.cut[1] - 0.1], ['#2 ALPHABET (GOOGLE)', 475, 'THU 29 OCT 2026', ACC, T.nvidia + 0.25]];
    rows.forEach(([name, v, when, c, t0], i) => {
      const y = 600 + i * 230, kk = eo(clamp((t - t0) / 0.5)); if (t < t0) return;
      big(g, name, X0, y, 58, c, { a: clamp((t - t0) / 0.15) });
      const w = 640 * (v / 593) * kk;
      g.fillStyle = c === ACC ? ACC : 'rgba(236,232,225,0.85)'; g.fillRect(X0, y + 26, w, 70);
      big(g, `−$${Math.round(v * kk)}B`, X0 + w + 18, y + 84, 64, c, { a: kk > 0.05 ? 1 : 0 });
      mlabel(g, when, X0, y + 132, clamp((t - t0 - 0.2) / 0.2), { size: 24, c: INK2 });
    });
  }
  function bars2(g, t, t0, a, b, labs, col, maxH = 420) {      // two bars, last year vs this year
    const base = 1080, w = 230, xs = [270, 590], m = Math.max(a, b);
    [a, b].forEach((v, i) => {
      const kk = eo(clamp((t - t0 - i * 0.25) / 0.45)), h = maxH * (v / m) * kk;
      g.fillStyle = i ? col : 'rgba(141,148,156,0.55)'; g.fillRect(xs[i], base - h, w, h);
      if (kk > 0.02) big(g, labs[i][1], xs[i] + w / 2, base - h - 24, 56, i ? col : INK2, { align: 'center' });
      mlabel(g, labs[i][0], xs[i] + w / 2, base + 46, clamp((t - t0) / 0.2), { size: 26, c: INK2, align: 'center' });
    });
    g.strokeStyle = 'rgba(141,148,156,0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(200, base); g.lineTo(890, base); g.stroke();
  }
  function shSales(g, t) {                                      // 2 · sales had just grown 25%
    const T = times(); shotCam(g, t, 2, { push: 0.04 });
    ground(g, '#090b0f'); grid(g, 0.05);
    crashChart(g, 1, 0.12, { bare: true });                     // the crash, still there behind it
    screen(g);
    const kp = eo(clamp((t - (T.cut[2] + 0.25)) / Math.max(0.6, T.pct25 + 0.1 - T.cut[2] - 0.25)));   // counts from the cut, lands on "twenty-five"
    big(g, `+${Math.round(25 * kp)}%`, 540, 560, 190, GRN, { align: 'center', a: clamp((t - T.cut[2] + 0.12) / 0.2), glow: 'rgba(61,220,132,0.35)' });
    mlabel(g, 'ALPHABET REVENUE · JUL–SEP, YEAR ON YEAR', 540, 612, clamp((t - T.cut[2] + 0.12) / 0.2), { size: 26, c: INK2, align: 'center' });
    bars2(g, t, T.a.s03 + 0.2, 102.3, 127.6, [['Q3 2025', '$102.3B'], ['Q3 2026', '$127.6B']], GRN, 340);
  }
  function shCloud(g, t) {                                      // 3 · cloud more than doubled
    const T = times(); shotCam(g, t, 3, { push: 0.04 });
    ground(g, '#090b0f'); grid(g, 0.05);
    crashChart(g, 1, 0.12, { bare: true });
    screen(g);
    const kp = eo(clamp((t - (T.cut[3] + 0.2)) / Math.max(0.6, T.doubled + 0.1 - T.cut[3] - 0.2)));   // lands on "doubled"
    big(g, `+${Math.round(103 * kp)}%`, 540, 560, 190, GRN, { align: 'center', a: clamp((t - T.cut[3] + 0.12) / 0.2), glow: 'rgba(61,220,132,0.35)' });
    mlabel(g, 'GOOGLE CLOUD REVENUE · YEAR ON YEAR', 540, 612, clamp((t - T.cut[3] + 0.12) / 0.2), { size: 26, c: INK2, align: 'center' });
    bars2(g, t, T.a.s04 + 0.1, 15.2, 30.7, [['Q3 2025', '$15.2B'], ['Q3 2026', '$30.7B']], GRN, 380);
  }
  function shWhy(g, t) {                                        // 4 · so why the crash?
    const T = times(); shotCam(g, t, 4, { push: 0.05, kicks: [[T.crash - 0.04, 10]] });
    ground(g, '#090b0f'); grid(g, 0.05);
    screen(g);
    const k1 = eo(clamp((t - T.cut[4] + 0.12) / 0.3)), k2 = eo(clamp((t - (T.crash - 0.15)) / 0.3));
    arrowHead(g, 300, 530 - 40 * k1, -PI / 2, 64, GRN);
    big(g, 'SALES +25%', 300, 690, 84, GRN, { align: 'center', a: k1 });
    big(g, 'CLOUD +103%', 300, 790, 84, GRN, { align: 'center', a: k1 });
    arrowHead(g, 780, 490 + 40 * k2, PI / 2, 64, ACC);
    big(g, 'STOCK', 780, 690, 84, ACC, { align: 'center', a: k2 });
    big(g, '−12.6%', 780, 790, 84, ACC, { align: 'center', a: k2 });
    g.fillStyle = 'rgba(141,148,156,0.3)'; g.fillRect(538, 470, 4, 380 * k1);
    big(g, '?', 540, 1080, 210, INK, { align: 'center', a: clamp((t - (T.crash + 0.05)) / 0.15) });
  }

  // ------------------------------------------------------------------ the search page (our own drawing, not Google's)
  const PANEL = { x: 150, y: 400, w: 780, h: 760 };
  const QUERY = 'best phone under 30000';
  function panelBase(g, typed, caret) {
    const { x, y, w, h } = PANEL;
    g.fillStyle = 'rgba(0,0,0,0.45)'; rr(g, x + 10, y + 18, w, h, 44); g.fill();
    g.fillStyle = '#12161c'; rr(g, x, y, w, h, 44); g.fill();
    g.strokeStyle = '#262d36'; g.lineWidth = 2; rr(g, x, y, w, h, 44); g.stroke();
    g.fillStyle = '#20262e'; rr(g, x + 34, y + 40, w - 68, 96, 48); g.fill();
    glass(g, x + 92, y + 82, 15, '#9aa3ad');
    font(g, 40, 600, 'semi-condensed'); g.textAlign = 'left'; g.fillStyle = '#e8eaed'; g.fillText(typed, x + 134, y + 102);
    if (caret) { const cw = g.measureText(typed).width; g.fillStyle = '#e8eaed'; g.fillRect(x + 138 + cw, y + 66, 3, 46); }
  }
  function result(g, x, y, w, ad, k) {                         // one search result (grey text bars), an ad if flagged
    g.save(); g.globalAlpha *= k;
    if (ad) { g.fillStyle = 'rgba(255,178,58,0.10)'; rr(g, x - 16, y - 34, w + 32, 136, 18); g.fill(); g.strokeStyle = 'rgba(255,178,58,0.55)'; g.lineWidth = 2; rr(g, x - 16, y - 34, w + 32, 136, 18); g.stroke(); font(g, 24, 700, 'semi-condensed'); g.fillStyle = AMB; g.fillText('Sponsored', x, y - 6); }
    g.fillStyle = BLU; rr(g, x, y + (ad ? 8 : -10), w * 0.62, 26, 8); g.fill();
    g.fillStyle = '#5b636d'; rr(g, x, y + (ad ? 50 : 32), w * 0.92, 16, 6); g.fill(); rr(g, x, y + (ad ? 76 : 58), w * 0.7, 16, 6); g.fill();
    g.restore();
    if (ad) coin(g, x + w - 26, y + 34, 26, k);
  }
  function results(g, t, t0, dy = 0, coinsT = null, clipBottom = PANEL.y + PANEL.h - 20) {
    const { x, y, w } = PANEL, X = x + 56, RW = w - 112;
    g.save(); g.beginPath(); g.rect(x, y + 150, w, clipBottom - y - 150); g.clip();
    const items = [[1, 0], [1, 1], [0, 2], [0, 3], [0, 4]];
    let yy = y + 230 + dy;
    for (const [ad, k] of items) { result(g, X, yy, RW, ad, eo(clamp((t - t0 - k * 0.08) / 0.25))); yy += ad ? 160 : 118; }
    if (coinsT != null) {                                       // coins rising off the ads
      const r = mulberry32(17);
      for (let i = 0; i < 14; i++) { const s0 = coinsT + r() * 1.6, u = (t - s0) / 0.9; if (u < 0 || u > 1) continue; const ad = i % 2, cx = X + RW - 26 + (r() - 0.5) * 30, cy = y + 230 + dy + ad * 160 + 34 - u * 150; coin(g, cx, cy, 18, (1 - u) * 0.9); }
    }
    g.restore();
  }
  function shSearch(g, t) {                                     // 5 · the answer is in your search bar
    const T = times(); shotCam(g, t, 5, { push: 0.03 });
    ground(g, '#090b0f'); grid(g, 0.04);
    screen(g);
    const n = Math.round(QUERY.length * clamp((t - T.cut[5] - 0.05) / Math.max(0.6, T.bar6 - T.cut[5] - 0.1)));
    panelBase(g, QUERY.slice(0, n), Math.floor(t * 2.2) % 2 === 0 || n < QUERY.length);
    results(g, t, T.bar6 + 0.1, 0, T.half);
    const kH = eo(clamp((t - (T.half - 0.1)) / 0.35));
    if (kH > 0) {                                               // half of all revenue
      g.save(); g.globalAlpha = kH; g.fillStyle = 'rgba(7,9,12,0.86)'; rr(g, 610, 900, 300, 210, 24); g.fill(); g.strokeStyle = 'rgba(255,178,58,0.6)'; g.lineWidth = 2; rr(g, 610, 900, 300, 210, 24); g.stroke(); g.restore();
      const cx = 690, cy = 1005, R = 52;
      g.save(); g.globalAlpha = kH; g.lineWidth = 22; g.strokeStyle = '#2a3038'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
      g.strokeStyle = AMB; g.beginPath(); g.arc(cx, cy, R, -PI / 2, -PI / 2 + TAU * 0.497 * eo(clamp((t - T.half) / 0.6))); g.stroke(); g.restore();
      big(g, '50%', 760, 1028, 70, AMB, { a: kH });
      mlabel(g, 'OF ALL REVENUE', 760, 1066, kH, { size: 20, c: INK2 });
    }
    eyebrow(g, 'SEARCH & OTHER: $63.4B OF $127.6B · Q3 2026', t, T.half - 0.2);
  }
  function aiCard(g, t, k, typeK) {                            // the AI answer, growing under the search bar
    const { x, y, w } = PANEL, X = x + 34, Y = y + 160, Wd = w - 68, Hc = 430 * eo(k);
    if (Hc < 2) return Y;
    const gr = g.createLinearGradient(X, Y, X + Wd, Y + Hc); gr.addColorStop(0, BLU); gr.addColorStop(1, VIO);
    g.fillStyle = 'rgba(28,32,46,0.96)'; rr(g, X, Y, Wd, Hc, 26); g.fill();
    g.strokeStyle = gr; g.lineWidth = 4; rr(g, X, Y, Wd, Hc, 26); g.stroke();
    g.save(); g.beginPath(); g.rect(X, Y, Wd, Hc); g.clip();
    sparkle(g, X + 50, Y + 54, 24, '#cfe0ff', 1, t * 1.2);
    font(g, 34, 700, 'semi-condensed'); g.textAlign = 'left'; g.fillStyle = '#dfe7ff'; g.fillText('AI Mode', X + 92, Y + 66);
    const rows = [0.92, 0.86, 0.95, 0.7, 0.9, 0.62];
    rows.forEach((f, i) => { const kk = clamp(typeK * rows.length - i); if (kk <= 0) return; g.fillStyle = i % 3 === 0 ? '#c9d3e6' : '#8f9ab0'; rr(g, X + 40, Y + 116 + i * 48, (Wd - 80) * f * kk, 20, 8); g.fill(); });
    g.restore();
    return Y + Hc;
  }
  function shAIMode(g, t) {                                     // 6 · more searches now happen in AI Mode
    const T = times(); shotCam(g, t, 6, { push: 0.03 });
    ground(g, '#090b0f'); grid(g, 0.04);
    screen(g);
    panelBase(g, QUERY, false);
    const k = clamp((t - (T.aimode - 0.2)) / 0.6), typeK = clamp((t - T.aimode) / Math.max(0.8, T.answers - T.aimode + 0.6));
    const push = 470 * eo(k);
    results(g, t, -10, push, null);                             // the links (and their ads) pushed down and out
    aiCard(g, t, k, typeK);
    if (k > 0.3) for (let i = 0; i < 5; i++) sparkle(g, 210 + ((i * 173) % 660), 620 + ((i * 97) % 300) - 60 * Math.sin(t * 2 + i), 7 + (i % 3) * 3, '#cfe0ff', 0.25 + 0.2 * Math.sin(t * 5 + i), t + i);
    eyebrow(g, "AI MODE: GOOGLE'S AI ANSWERS IN PLACE OF LINKS", t, T.cut[6] + 0.05);
  }
  function shLess(g, t) {                                       // 7 · and Google admitted AI Mode earns less
    const T = times(); shotCam(g, t, 7, { push: 0.04 });
    ground(g, '#090b0f'); grid(g, 0.05);
    screen(g);
    const k = eo(clamp((t - T.cut[7] + 0.15) / 0.35));
    g.save(); g.globalAlpha = k; g.fillStyle = '#10141a'; rr(g, 90, 470, 900, 560, 30); g.fill(); g.strokeStyle = '#262d36'; g.lineWidth = 2; rr(g, 90, 470, 900, 560, 30); g.stroke(); g.restore();
    big(g, '“', 140, 640, 200, INK3, { a: k });
    const L1 = ['…the strong growth in AI Mode', 'queries had an impact because of'], L2a = 'the ', L2b = 'lower monetization', L3 = 'we were seeing in AI Mode.”';
    g.save(); g.globalAlpha = k; font(g, 50, 600, 'semi-condensed'); g.textAlign = 'left'; g.fillStyle = INK;
    g.fillText(L1[0], 150, 640); g.fillText(L1[1], 150, 704);
    g.fillText(L2a, 150, 768); const w0 = g.measureText(L2a).width;
    const kl = clamp((t - (T.less - 0.2)) / 0.3); g.fillStyle = kl > 0 ? ACC : INK; g.fillText(L2b, 150 + w0, 768);
    if (kl > 0) { const wl = g.measureText(L2b).width; g.fillStyle = ACC; g.fillRect(150 + w0, 782, wl * eo(kl), 5); }
    g.fillStyle = INK; g.fillText(L3, 150, 832); g.restore();
    mlabel(g, 'PHILIPP SCHINDLER, GOOGLE · Q3 EARNINGS CALL, 28 OCT 2026', 150, 920, k, { size: 22, c: INK2 });
    mlabel(g, "GOOGLE HASN'T SAID HOW MUCH LESS", 150, 975, clamp((t - (T.less + 0.1)) / 0.3), { size: 24, c: AMB });
  }

  // ------------------------------------------------------------------ the bill: a data centre corridor, from inside
  function racks(g, t, push) {                                  // one-point perspective: rack fronts receding to (540, VY)
    const VX = 540, VY = 700, n = 9;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = n - 1; i >= 0; i--) {
        const z0 = 1 + i * 0.55 - push, z1 = z0 + 0.5; if (z1 <= 0.12) continue;
        const s0 = 1 / Math.max(0.12, z0), s1 = 1 / Math.max(0.12, z1);
        const xa = VX + side * 220 * s0, xb = VX + side * 220 * s1, ya0 = VY - 330 * s0, ya1 = VY - 330 * s1, yb0 = VY + 380 * s0, yb1 = VY + 380 * s1;
        g.fillStyle = i % 2 ? '#151a21' : '#12171d'; g.beginPath(); g.moveTo(xa, ya0); g.lineTo(xb, ya1); g.lineTo(xb, yb1); g.lineTo(xa, yb0); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(70,82,96,0.6)'; g.lineWidth = 1.5; g.stroke();
        const r = mulberry32(31 + i * 7 + (side > 0 ? 100 : 0));
        for (let row = 0; row < 14; row++) for (let c = 0; c < 4; c++) {                // the servers' lights
          const u = (c + 0.5) / 4, v = (row + 0.6) / 14.5, lx = lerp(xa, xb, u), ly = lerp(lerp(ya0, ya1, u), lerp(yb0, yb1, u), v);
          const on = Math.sin(t * (3 + r() * 6) + r() * 9) > 0.1, c2 = r() < 0.75 ? '120,220,255' : '61,220,132';
          g.fillStyle = `rgba(${c2},${on ? 0.9 : 0.15})`; g.fillRect(lx - 2, ly - 2, Math.max(2, 4 * lerp(s0, s1, u)), Math.max(2, 3 * lerp(s0, s1, u)));
        }
      }
    }
    const gl = g.createRadialGradient(540, VY, 10, 540, VY, 260); gl.addColorStop(0, 'rgba(120,200,255,0.35)'); gl.addColorStop(1, 'rgba(120,200,255,0)'); g.fillStyle = gl; g.fillRect(280, VY - 260, 520, 520);
    g.fillStyle = '#0b0e12'; g.beginPath(); g.moveTo(VX - 1100, VY + 1650); g.lineTo(VX, VY); g.lineTo(VX + 1100, VY + 1650); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,200,255,0.12)'; g.lineWidth = 2; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(VX, VY); g.lineTo(VX + k * 360, VY + 1650); g.stroke(); }
  }
  function shBill(g, t) {                                       // 8 · the bill: $51 billion in three months
    const T = times(); shotCam(g, t, 8, { push: 0.05, oy: 700 });
    ground(g, '#07090c');
    racks(g, t, 0.55 * clamp((t - T.cut[8]) / Math.max(1, T.cut[9] - T.cut[8])));
    screen(g);
    const v = 51355e6 * eo(clamp((t - (T.cut[8] + 0.2)) / Math.max(0.8, T.fifty + 0.55 - T.cut[8] - 0.2)));   // spins through "the bill:", lands on "billion"
    g.fillStyle = 'rgba(7,9,12,0.72)'; rr(g, 70, 400, 940, 210, 26); g.fill();
    big(g, `$${fmt(v)}`, 540, 520, 116, AMB, { align: 'center', glow: 'rgba(255,178,58,0.4)' });
    mlabel(g, 'CAPEX · JUL–SEP 2026 · SERVERS, CHIPS, DATA CENTRES', 540, 572, 1, { size: 24, c: INK2, align: 'center' });
    mlabel(g, 'A YEAR EARLIER: $24.0B', 540, 1150, clamp((t - (T.months - 0.1)) / 0.3), { size: 28, c: INK, align: 'center', bg: 'rgba(7,9,12,0.8)' });
  }
  function shDay(g, t) {                                        // 9 · over half a billion dollars a day
    const T = times(); shotCam(g, t, 9, { push: 0.04 });
    ground(g, '#090b0f'); grid(g, 0.05);
    screen(g);
    const u = clamp((t - T.cut[9] - 0.1) / Math.max(0.8, T.day10 + 0.1 - T.cut[9] - 0.1)), cx = 540, cy = 820, R = 230;   // one full day by "day."
    g.strokeStyle = '#2a3038'; g.lineWidth = 26; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    g.strokeStyle = AMB; g.beginPath(); g.arc(cx, cy, R, -PI / 2, -PI / 2 + TAU * u); g.stroke();
    for (let h = 0; h < 24; h++) { const th = -PI / 2 + h / 24 * TAU; g.fillStyle = h % 6 ? '#3b434c' : INK2; g.fillRect(cx + Math.cos(th) * (R - 44) - 3, cy + Math.sin(th) * (R - 44) - 3, 6, 6); }
    g.save(); g.translate(cx, cy); g.rotate(u * TAU); g.fillStyle = INK; g.fillRect(-4, -R + 60, 8, R - 60); g.restore();
    g.fillStyle = INK; g.beginPath(); g.arc(cx, cy, 12, 0, TAU); g.fill();
    big(g, `$${fmt(558e6 * u)}`, 540, 510, 108, AMB, { align: 'center', glow: 'rgba(255,178,58,0.35)' });
    mlabel(g, '24 HOURS', cx, cy + 12, 1, { size: 26, c: INK2, align: 'center', bg: 'rgba(7,9,12,0.8)' });
    mlabel(g, '$51.4 BILLION ÷ 92 DAYS', 540, 562, 1, { size: 24, c: INK2, align: 'center' });
  }
  function shCash(g, t) {                                       // 10 · two quarters in a row, more cash out than in
    const T = times(); shotCam(g, t, 10, { push: 0.04 });
    ground(g, '#090b0f'); grid(g, 0.05);
    screen(g);
    const zero = 860, sc = 11, data = [['Q4 2025', 24.6], ['Q1 2026', 10.1], ['Q2 2026', -5.9], ['Q3 2026', -9.1]], w = 150, x0 = 150, gap = 70;
    mlabel(g, 'FREE CASH FLOW, $ BILLION', X0, 455, clamp((t - T.cut[10] + 0.12) / 0.2), { size: 28, c: INK2 });
    mlabel(g, 'CASH FROM THE BUSINESS − CASH SPENT ON BUILDING', X0, 492, clamp((t - T.cut[10] + 0.12) / 0.2), { size: 22, c: INK3 });
    g.strokeStyle = INK2; g.lineWidth = 3; g.beginPath(); g.moveTo(110, zero); g.lineTo(980, zero); g.stroke();
    data.forEach(([q, v], i) => {
      const t0 = T.cut[10] - 0.1 + i * 0.3 + (i >= 2 ? Math.max(0, T.spent - T.cut[10] - 1.0) : 0), kk = eo(clamp((t - t0) / 0.45)), h = Math.abs(v) * sc * kk, x = x0 + i * (w + gap);
      if (t < t0) return;
      g.fillStyle = v > 0 ? GRN : ACC; v > 0 ? g.fillRect(x, zero - h, w, h) : g.fillRect(x, zero, w, h);
      big(g, `${v > 0 ? '+' : '−'}$${Math.abs(v).toFixed(1)}B`, x + w / 2, v > 0 ? zero - h - 18 : zero + h + 62, 48, v > 0 ? GRN : ACC, { align: 'center', a: clamp(kk * 3) });
      mlabel(g, q, x + w / 2, v > 0 ? zero + 40 : zero - 18, clamp((t - t0) / 0.2), { size: 22, c: INK2, align: 'center' });
    });
  }
  function shLoop(g, t) {                                       // 11 · paying for the AI that's eating into its search ads
    const T = times(); shotCam(g, t, 11, { push: 0.04 });
    ground(g, '#090b0f'); grid(g, 0.05);
    screen(g);
    const cx = 540, cy = 760, R = 290, node = [-PI / 2, PI / 6, 5 * PI / 6], P = (th, r = R) => [cx + Math.cos(th) * r, cy + Math.sin(th) * r];
    const kIn = eo(clamp((t - T.cut[11] + 0.15) / 0.4)), kEat = clamp((t - (T.eating - 0.15)) / 0.3);
    const arc = (a0, a1, c, k, wid = 10) => { g.strokeStyle = c; g.lineWidth = wid; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, R, a0, lerp(a0, a1, k)); g.stroke(); if (k > 0.98) arrowHead(g, ...P(a1), a1 + PI / 2, 20, c); };
    arc(node[0] + 0.32, node[1] - 0.32, AMB, kIn);                                     // ads → data centres (pays for)
    arc(node[1] + 0.32, node[2] - 0.32, BLU, eo(clamp((t - T.cut[11] - 0.35) / 0.4)));  // data centres → AI Mode
    const k3 = eo(clamp((t - (T.eating - 0.5)) / 0.5));
    arc(node[2] + 0.32, node[0] + 2 * PI - 0.62, ACC, k3, 12);                        // AI Mode → eats the ads
    // coins travelling to the data centres
    for (let i = 0; i < 6; i++) { const u = ((t * 0.6 + i / 6) % 1), th = lerp(node[0] + 0.32, node[1] - 0.32, u); coin(g, ...P(th), 16, kIn * 0.9); }
    // the mouth, biting the ads
    if (k3 > 0.95) { const th = node[0] + 2 * PI - 0.5, [mx, my] = P(th), open = 0.35 + 0.35 * Math.abs(Math.sin((t - T.eating) * 9)); g.save(); g.translate(mx, my); g.rotate(th + PI / 2); g.fillStyle = ACC; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 40, open, TAU - open); g.closePath(); g.fill(); g.restore(); }
    const shrink = 1 - 0.18 * clamp((t - T.eating) / 1.2) - 0.05 * Math.abs(Math.sin((t - T.eating) * 9)) * (t > T.eating ? 1 : 0);
    const nodes = [['SEARCH ADS', AMB, 0], ['AI DATA CENTRES', BLU, 1], ['AI MODE', VIO, 2]];
    nodes.forEach(([name, c, i]) => {
      const [x, y] = P(node[i]), r = (i === 0 ? 96 * shrink : 96) * kIn;
      g.fillStyle = '#12161c'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = c; g.lineWidth = 5; g.stroke();
      if (i === 0) coin(g, x, y - 6, 40 * shrink * kIn, kIn);
      if (i === 1) for (let k = 0; k < 3; k++) { g.fillStyle = '#2a3542'; g.fillRect(x - 40, y - 36 + k * 26, 80, 18); g.fillStyle = 'rgba(120,220,255,0.9)'; g.fillRect(x + 22, y - 31 + k * 26, 8, 8); }
      if (i === 2) sparkle(g, x, y, 42 * kIn, '#d8c8ff', kIn, t * 0.8);
      mlabel(g, name, x, y + (i === 0 ? -126 : 140), kIn, { size: 28, c, align: 'center', bg: 'rgba(7,9,12,0.8)' });
    });
    mlabel(g, 'PAYS FOR', ...P(PI * 1.85 + 0.1, R + 64), kIn, { size: 22, c: AMB, align: 'center' });
    mlabel(g, 'EATS INTO', ...P(PI * 1.2, R + 70), kEat, { size: 24, c: ACC, align: 'center', bg: 'rgba(7,9,12,0.8)' });
  }
  function shBroke(g, t) {                                      // 12 · Google isn't going broke
    const T = times(); shotCam(g, t, 12, { push: 0.03 });
    ground(g, '#090b0f'); grid(g, 0.05);
    screen(g);
    const k = eo(clamp((t - T.cut[12] + 0.2) / 0.5));
    for (let i = 0; i < 12; i++) {                              // a stack of gold bars rising
      const kk = eo(clamp((t - T.cut[12] + 0.12 - i * 0.05) / 0.35)), row = Math.floor(i / 3), col = i % 3, x = 330 + col * 150 + (row % 2) * 75, y = 1000 - row * 62 - 30 * (1 - kk);
      if (kk <= 0) continue;
      g.save(); g.globalAlpha = kk; const gr = g.createLinearGradient(x, y, x, y + 54); gr.addColorStop(0, '#ffd77a'); gr.addColorStop(1, '#c98a1d'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(x + 14, y); g.lineTo(x + 126, y); g.lineTo(x + 140, y + 54); g.lineTo(x, y + 54); g.closePath(); g.fill(); g.restore();
    }
    big(g, '$265 BILLION', 540, 560, 132, AMB, { align: 'center', a: k, glow: 'rgba(255,178,58,0.3)' });
    mlabel(g, 'CASH & INVESTMENTS · 30 SEP 2026', 540, 612, k, { size: 26, c: INK2, align: 'center' });
    mlabel(g, 'STILL WORTH $3.47 TRILLION AFTER THE DROP', 540, 1150, clamp((t - (T.broke - 0.2)) / 0.3), { size: 26, c: INK, align: 'center', bg: 'rgba(7,9,12,0.8)' });
  }
  const QQ = ['is', "google's", 'ai', 'eating', 'google?'];
  function shQuestion(g, t) {                                   // 13 · is Google's AI eating Google?
    const T = times(); shotCam(g, t, 13, { push: 0.05 });
    ground(g, '#090b0f'); grid(g, 0.04);
    screen(g);
    const x = 90, y = 640, w = 900, h = 130, k = eo(clamp((t - T.cut[13] + 0.15) / 0.35));
    g.save(); g.globalAlpha = k; g.fillStyle = '#20262e'; rr(g, x, y, w, h, 65); g.fill(); g.strokeStyle = '#3a4350'; g.lineWidth = 2; rr(g, x, y, w, h, 65); g.stroke(); g.restore();
    glass(g, x + 72, y + 58, 20, '#9aa3ad');
    const shown = QQ.filter((_, i) => t >= wi('s14', 7 + i) - 0.03).join(' ');
    font(g, 58, 600, 'semi-condensed'); g.textAlign = 'left'; g.fillStyle = '#e8eaed'; g.fillText(shown, x + 130, y + 84);
    const cw = g.measureText(shown).width; if (Math.floor(t * 2.2) % 2 === 0 || (t > T.q0 - 0.1 && t < T.qEnd + 0.2)) { g.fillStyle = '#e8eaed'; g.fillRect(x + 136 + cw, y + 34, 4, 64); }
    const kT = clamp((t - (T.qEnd + 0.15)) / 0.3);                    // the AI, thinking
    if (kT > 0) { sparkle(g, 540, 930, 46, '#d8c8ff', kT, t * 3); for (let d = 0; d < 3; d++) { g.fillStyle = `rgba(216,200,255,${(0.3 + 0.7 * (Math.sin(t * 8 - d) * 0.5 + 0.5)) * kT})`; g.beginPath(); g.arc(500 + d * 40, 1010, 8, 0, TAU); g.fill(); } }
    mlabel(g, "WALL STREET'S QUESTION", 540, 560, clamp((t - (T.question - 0.2)) / 0.3), { size: 28, c: INK2, align: 'center' });
  }
  const SHOTS = [shHook, shRank, shSales, shCloud, shWhy, shSearch, shAIMode, shLess, shBill, shDay, shCash, shLoop, shBroke, shQuestion];

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) {
      S.g = canvas(root); under(root); S.g2 = canvas(root);       // the scene, the text zone's shade, the labels
      const L = (text, y, size, o = {}) => Object.assign(line(root, text, { x: X0, y, size, ...o }), { tone: o.tone });
      S.L = {
        h0a: L('Google just lost', TZ - 16, 128), h0b: L('$475 billion in a day.', TZ + 124, 104, { accent: [0, 1] }),
        h1a: L('Only Nvidia lost more.', TZ - 16, 99, { accent: [1] }),
        h2a: L('Yet sales grew 25%.', TZ - 16, 106, { accent: [3], tone: 'green' }),
        h3a: L('Cloud more than doubled.', TZ - 16, 85, { accent: [3], tone: 'green' }),
        h4a: L('So why the crash?', TZ - 16, 119, { accent: [3] }),
        h5a: L("It's in your search bar.", TZ - 16, 95), h5b: L('Half its money: search ads.', TZ + 108, 80, { accent: [3, 4], tone: 'amber' }),
        h6a: L('AI Mode just answers you.', TZ - 16, 84, { accent: [0, 1], tone: 'blue' }),
        h7a: L('AI Mode earns less.', TZ - 16, 115, { accent: [3] }),
        h8a: L('The bill: $51 billion', TZ - 16, 109, { accent: [2, 3], tone: 'amber' }), h8b: L('in three months.', TZ + 118, 109),
        h9a: L('$558 million a day.', TZ - 16, 118, { accent: [0, 1], tone: 'amber' }),
        h10a: L('Two quarters running:', TZ - 16, 95), h10b: L('more cash out than in.', TZ + 108, 95, { accent: [2] }),
        h11a: L('Paying for the AI', TZ - 16, 118), h11b: L('eating its search ads.', TZ + 118, 100, { accent: [0] }),
        h12a: L("Google isn't going broke.", TZ - 16, 88),
        h13a: L('One question.', TZ - 16, 132),
      };
      for (const k of ['h0b', 'h2a', 'h8a', 'h9a']) S.L[k].words.forEach((w) => w.classList.add('tnum'));
    },
    run(t, b, S) {
      const T = times(), L = S.L, g = S.g, c = T.cut; clear(g); clear(S.g2); LBL = S.g2;
      let i = 0; while (i < SHOTS.length - 1 && t >= c[i + 1]) i++;
      SHOTS[i](g, t);
      const out = (k) => c[k + 1] - 0.05;
      const R = (Lx, tins, tout, lit, acc = []) => { rise(t, Lx, tins.map((x) => x - 0.06), tout); light(t, Lx, lit, acc); };
      rise(t, L.h0a, [-0.5, -0.45, -0.4], out(0)); light(t, L.h0a, wv('s01', 0, 1, 2));
      R(L.h0b, wv('s01', 3, 7, 9, 11), out(0), wv('s01', 3, 7, 9, 11), [0, 1]);
      R(L.h1a, wv('s02', 0, 1, 4, 5), out(1), wv('s02', 0, 1, 4, 5), [1]);
      R(L.h2a, [wi('s03', 0), wi('s03', 3), T.grown, T.pct25], out(2), [wi('s03', 0), wi('s03', 3), T.grown, T.pct25], [3]);
      R(L.h3a, wv('s04', 1, 3, 4, 5), out(3), wv('s04', 1, 3, 4, 5), [3]);
      R(L.h4a, wv('s05', 0, 1, 2, 3), out(4), wv('s05', 0, 1, 2, 3), [3]);
      R(L.h5a, wv('s06', 0, 3, 4, 5, 6), out(5), wv('s06', 0, 3, 4, 5, 6)); R(L.h5b, wv('s06', 7, 10, 10, 13, 14), out(5), wv('s06', 7, 10, 10, 13, 14), [3, 4]);
      R(L.h6a, [T.aimode, wi('s07', 7), wi('s07', 11), T.answers, wi('s07', 13)], out(6), [T.aimode, wi('s07', 7), wi('s07', 11), T.answers, wi('s07', 13)], [0, 1]);
      R(L.h7a, wv('s08', 3, 4, 5, 6), out(7), wv('s08', 3, 4, 5, 6), [3]);
      R(L.h8a, wv('s09', 0, 3, 4, 5), out(8), wv('s09', 0, 3, 4, 5), [2, 3]); R(L.h8b, wv('s09', 7, 8, 9), out(8), wv('s09', 7, 8, 9));
      R(L.h9a, wv('s10', 1, 3, 5, 6), out(9), wv('s10', 1, 3, 5, 6), [0, 1]);
      R(L.h10a, wv('s11', 0, 1), out(10), wv('s11', 0, 1)); R(L.h10b, wv('s11', 7, 8, 9, 12), out(10), wv('s11', 7, 8, 9, 12), [2]);
      R(L.h11a, wv('s12', 1, 2, 3, 5), out(11), wv('s12', 1, 2, 3, 5)); R(L.h11b, wv('s12', 7, 9, 10, 11), out(11), wv('s12', 7, 9, 10, 11), [0]);
      R(L.h12a, wv('s13', 0, 1, 2, 3), out(12), wv('s13', 0, 1, 2, 3));
      R(L.h13a, wv('s14', 5, 6), T.end - 0.05, wv('s14', 5, 6));
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
