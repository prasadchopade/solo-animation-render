// Reel 13 · Mosquito Magnet. A new approach for the channel (the user, 2026-10-29: "make a new reel with different
// approach"): the reel is the mosquito's point of view. Thermal vision (people as heat on a low-res sensor, an ironbow
// palette), a targeting HUD (sensor readouts; a reticle that sweeps, hesitates and locks in signal red), then the 2022
// Cell study told as a tournament (64 nylon stockings, two-at-a-time duels, a leaderboard, Subject 33 against last
// place), a microscope dive into skin oil and its acids, a sense of smell glitching out, three years of calendar, and
// back to the terrace lock of frame 0. Kept from AI171: the name in the first word, hard cuts on phrases (16 shots),
// type in the text zone (y 1200–1520) lit as the voice says it, mono data and sources, grain and a vignette. No ROOT
// CAUSE headline or root mark mid-reel; the end card closes it. 30 fps, no motion blur. Pure functions of t.
(() => {
  const { W, H, put, reg, el, scene, canvas, clamp, lerp, ease, mulberry32 } = C;
  const K = window.KIT;
  const { st, hit, tb, words, cam, clear, drift, kick, font } = K;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn', '400 30px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI, eio = ease.inOut, eo = ease.out;
  const X0 = 80, TZ = 1222;
  const INK = '#ece8e1', INK2 = '#8d949c', BG = '#07090c', BG2 = '#0e1217', ACC = '#ff3b1f', AMB = '#ffb23a';

  // ------------------------------------------------------------------ timing (the narration's words; estimates until the voice is placed)
  const FB = { s01: 0.3, s02: 4.15, s03: 7.3, s04: 10.3, s05: 14.5, s06: 18.45, s07: 23.25, s08: 27.1, s09: 30.15, s10: 33.45, s11: 38.3, s12: 42.4, s13: 45.85 };
  const has = (p) => words(p).length > 0;
  const at = (p) => (has(p) ? words(p)[0].t0 : FB[p]);
  const wi = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t0 : at(p) + 0.3 * i);
  const we = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t1 : at(p) + 0.3 * i + 0.26);
  const wv = (p, ...ix) => ix.map((i) => wi(p, i));
  const LINES = ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10', 's11', 's12', 's13'];
  let T = null;
  function times() {
    if (T) return T;
    const t = {
      a: Object.fromEntries(LINES.map((p) => [p, at(p)])),
      people1: wi('s01', 3), hundred: wi('s01', 5), more1: wi('s01', 7), others: wi('s01', 9),
      isnt: wi('s02', 4), sweet: wi('s02', 6), blood: wi('s02', 7), bloodE: we('s02', 7),
      before: wi('s03', 3), tasted: wi('s03', 5), drop: wi('s03', 7), dropE: we('s03', 7),
      breath: wi('s04', 3), ten: wi('s04', 5), away: wi('s04', 7), then4: wi('s04', 8), heat: wi('s04', 10),
      everyone: wi('s05', 1), breathes: wi('s05', 2), warm: wi('s05', 5), so: wi('s05', 6), why: wi('s05', 7), you5: wi('s05', 8),
      lab: wi('s06', 4), sixty: wi('s06', 5), wore: wi('s06', 7), nylon: wi('s06', 8), arms: wi('s06', 12),
      dengue: wi('s07', 1), chose: wi('s07', 3), two: wi('s07', 6), time7: wi('s07', 9),
      one8: wi('s08', 0), kept: wi('s08', 2), winning: wi('s08', 3), winningE: we('s08', 3), subject: wi('s08', 4), thirty: wi('s08', 5), thirtyE: we('s08', 5),
      hundred9: wi('s09', 1), attractive: wi('s09', 4), last: wi('s09', 6), place: wi('s09', 7), placeE: we('s09', 7),
      skin: wi('s10', 1), certain: wi('s10', 6), acids: wi('s10', 7), and10: wi('s10', 8), follow: wi('s10', 10), smell10: wi('s10', 12),
      damaged: wi('s11', 4), smell11: wi('s11', 7), still11: wi('s11', 8), found: wi('s11', 9), them11: wi('s11', 10),
      three: wi('s12', 1), later: wi('s12', 3), magnets: wi('s12', 5), still12: wi('s12', 7), magnetsE: we('s12', 8),
      pick13: wi('s13', 4), theyll: wi('s13', 6), next: wi('s13', 9), too: wi('s13', 11), end: tb('end'),
    };
    const a = t.a;
    // the cuts (16 shots): each on a phrase of the voice, a beat before it
    t.cut = [0, a.s02 - 0.13, a.s03 - 0.15, a.s04 - 0.15, t.then4 - 0.13, a.s05 - 0.15, a.s06 - 0.15, a.s07 - 0.15, a.s08 - 0.15,
      a.s09 - 0.06, a.s10 - 0.15, t.and10 - 0.12, a.s11 - 0.15, t.still11 - 0.12, a.s12 - 0.42, a.s13 - 0.15, t.end];
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
      'linear-gradient(180deg, rgba(7,9,12,0.55) 0px, rgba(7,9,12,0) 300px, rgba(7,9,12,0) 960px, rgba(7,9,12,0.78) 1190px, rgba(7,9,12,0.88) 100%),' +
      'radial-gradient(ellipse 90% 75% at 50% 42%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%)' }, root);
  }

  // ------------------------------------------------------------------ canvas helpers
  function shotCam(g, t, i, o = {}) {                           // every hold drifts and pushes in; impacts kick. Returns the camera.
    const T = times(), u = t - T.cut[i], d = Math.max(0.5, T.cut[i + 1] - T.cut[i]), dr = drift(t, o.drift ?? 6);
    let kx = 0, ky = 0; for (const [k0, a] of o.kicks || []) { const q = kick(t, k0, a); kx += q.x; ky += q.y; }
    const c = { s: (o.s0 ?? 1) + (o.push ?? 0.05) * eio(clamp(u / d)), x: dr.x + kx, y: dr.y + ky, ox: 540, oy: o.oy ?? 740 };
    cam(g, c); return c;
  }
  const proj = (c, x, y) => [c.ox + c.s * (x - c.ox) + c.x, c.oy + c.s * (y - c.oy) + c.y];
  const screen = (g) => g.setTransform(1, 0, 0, 1, 0, 0);
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
  const eyebrow = (g, s, t, t0, c = INK2) => mlabel(g, s, X0, 330, clamp((t - t0) / 0.25), { size: 26, c, bg: 'rgba(7,9,12,0.6)' });
  function stamp(g, x, y, k, text, color, rot = -0.08, size = 70) {
    if (k <= 0.005) return;
    const s = 1 + 0.6 * (1 - eo(clamp(k / 0.6)));
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= clamp(k * 3);
    font(g, size, 700, 'condensed'); g.textAlign = 'center'; const w = g.measureText(text).width + 50;
    g.strokeStyle = color; g.lineWidth = 7; g.strokeRect(-w / 2, -size * 0.72, w, size * 1.29); g.fillStyle = color; g.fillText(text, 0, size * 0.32); g.restore();
  }
  function keyXY(keys, t) {                                     // [[t, x, y], ...] eased between keys
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) { const [t0, a0, b0] = keys[i - 1], [t1, a1, b1] = keys[i], k = eio(clamp((t - t0) / (t1 - t0))); return [lerp(a0, a1, k), lerp(b0, b1, k)]; }
    }
    return keys[keys.length - 1].slice(1);
  }

  // ------------------------------------------------------------------ thermal vision: a low-res heat field through an ironbow palette
  const HS = 0.25, HM = 60, HW = Math.round((W + 2 * HM) * HS), HH = Math.round((H + 2 * HM) * HS);
  const heatC = document.createElement('canvas'); heatC.width = HW; heatC.height = HH; const hg = heatC.getContext('2d', { willReadFrequently: true });
  const thC = document.createElement('canvas'); thC.width = HW; thC.height = HH; const tg = thC.getContext('2d', { willReadFrequently: true });
  const LUT = (() => {
    const S = [[0, [6, 4, 14]], [40, [26, 10, 60]], [80, [72, 14, 106]], [120, [142, 26, 120]], [154, [210, 48, 92]], [184, [242, 98, 42]], [212, [255, 162, 32]], [238, [255, 224, 104]], [255, [255, 252, 236]]];
    const o = new Uint8Array(256 * 3);
    for (let v = 0; v < 256; v++) {
      let i = 0; while (i < S.length - 2 && v > S[i + 1][0]) i++;
      const [a, ca] = S[i], [b, cb] = S[i + 1], u = clamp((v - a) / (b - a));
      for (let k = 0; k < 3; k++) o[v * 3 + k] = Math.round(lerp(ca[k], cb[k], u));
    }
    return o;
  })();
  const gray = (v) => { const c = Math.round(255 * clamp(v)); return `rgb(${c},${c},${c})`; };
  // paint(h) draws grey heat (0 cold … 1 hottest) in frame coordinates; the sensor's noise is seeded per frame
  function thermal(g, t, paint, o = {}) {
    hg.setTransform(1, 0, 0, 1, 0, 0); hg.globalAlpha = 1; hg.globalCompositeOperation = 'source-over'; hg.filter = 'none';
    hg.fillStyle = '#000'; hg.fillRect(0, 0, HW, HH);
    hg.setTransform(HS, 0, 0, HS, HM * HS, HM * HS);
    paint(hg);
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, HW, HH);
    tg.filter = `blur(${o.blur ?? 1.4}px)`; tg.drawImage(heatC, 0, 0); tg.filter = 'none';
    const im = tg.getImageData(0, 0, HW, HH), d = im.data, r = mulberry32(7000 + Math.round(t * 30)), nz = o.noise ?? 6, gain = o.gain ?? 1;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.max(0, Math.min(255, Math.round(d[i] * gain + (r() - 0.5) * 2 * nz))) * 3;
      d[i] = LUT[v]; d[i + 1] = LUT[v + 1]; d[i + 2] = LUT[v + 2]; d[i + 3] = 255;
    }
    tg.putImageData(im, 0, 0);
    g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(thC, -HM, -HM, W + 2 * HM, H + 2 * HM); g.restore();
  }

  // the terrace: five friends at night, string lights, the city beyond (all heat; the magnet is index 2)
  const PEOPLE = [
    { x: 150, y: 700, s: 0.88, face: 0.82, hair: 0.34, body: 0.48, ph: 0.3, glasses: 1 },
    { x: 352, y: 606, s: 0.98, face: 0.85, hair: 0.32, body: 0.45, ph: 1.7, chai: 1 },
    { x: 560, y: 655, s: 1.1, face: 0.87, hair: 0.33, body: 0.53, ph: 2.9 },
    { x: 772, y: 616, s: 0.95, face: 0.84, hair: 0.36, body: 0.49, ph: 4.1 },
    { x: 962, y: 706, s: 0.86, face: 0.82, hair: 0.34, body: 0.46, ph: 5.3, cap: 1 },
  ];
  const MAG = 2, ORDER = [4, 0, 3, 1, 2];
  const head = (p, t) => [p.x, p.y + Math.sin(t * 1.7 + p.ph) * 3];
  const mouth = (p, t) => { const [x, y] = head(p, t); return [x, y + 40 * p.s]; };
  const BLD = (() => { const r = mulberry32(31), o = []; let x = -60; while (x < W + 60) { const w = 90 + r() * 140, h = 160 + r() * 260; o.push([x, 900 - h, w, h + 400]); x += w + 10 + r() * 30; } return o; })();
  const WIN = (() => { const r = mulberry32(32), o = []; for (const [x, y, w, h] of BLD) for (let k = 0; k < 6; k++) if (r() < 0.5) o.push([x + 12 + r() * (w - 30), y + 20 + r() * Math.min(200, h - 420 + 400 - 60)]); return o; })();
  function personHeat(h, p, t, k = 1) {
    const [x, y] = head(p, t);
    h.save(); h.translate(x, y); h.scale(p.s, p.s);
    h.fillStyle = gray(p.body * k);                                            // clothes: cooler than skin
    h.beginPath(); h.moveTo(-56, 92); h.bezierCurveTo(-122, 104, -152, 168, -160, 262); h.lineTo(-176, 760); h.lineTo(176, 760); h.lineTo(160, 262);
    h.bezierCurveTo(152, 168, 122, 104, 56, 92); h.closePath(); h.fill();
    h.fillStyle = gray(p.face * 0.94 * k); h.fillRect(-30, 46, 60, 70);         // neck
    h.fillStyle = gray(p.face * k); h.beginPath(); h.ellipse(0, 0, 60, 76, 0, 0, TAU); h.fill();
    h.fillStyle = gray(p.hair * k); h.beginPath(); h.ellipse(0, -30, 66, 56, 0, PI * 1.03, TAU * 0.985); h.fill();
    h.fillStyle = gray(Math.min(1, p.face * 1.12) * k);                         // the inner corners of the eyes: the hottest skin
    h.beginPath(); h.ellipse(-20, 2, 11, 7, 0, 0, TAU); h.ellipse(20, 2, 11, 7, 0, 0, TAU); h.fill();
    h.fillStyle = gray(p.face * 0.78 * k); h.beginPath(); h.ellipse(0, 26, 9, 12, 0, 0, TAU); h.fill();   // the nose tip runs cool
    if (p.glasses) { h.fillStyle = gray(0.3 * k); h.beginPath(); h.roundRect(-46, -12, 38, 28, 8); h.roundRect(8, -12, 38, 28, 8); h.fill(); h.fillRect(-10, -4, 20, 6); }   // glass blocks heat: lenses read cold
    if (p.cap) { h.fillStyle = gray(0.24 * k); h.beginPath(); h.ellipse(0, -44, 70, 44, 0, PI, TAU); h.fill(); h.fillRect(-70, -48, 150, 16); }
    if (p.chai) { h.fillStyle = gray(0.8 * k); h.beginPath(); h.ellipse(122, 338, 34, 26, 0, 0, TAU); h.fill(); h.fillStyle = gray(1); h.fillRect(104, 284, 36, 50); }   // a glass of chai
    h.restore();
  }
  function terraceHeat(h, t, o = {}) {
    h.fillStyle = gray(0.05); h.fillRect(-HM, -HM, W + 2 * HM, H + 2 * HM);
    h.fillStyle = gray(0.12); for (const [x, y, w, hh] of BLD) h.fillRect(x, y, w, hh);
    h.fillStyle = gray(0.34); for (const [x, y] of WIN) h.fillRect(x, y, 12, 16);
    h.strokeStyle = gray(0.2); h.lineWidth = 3; h.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40, x = lerp(-40, W + 40, u), y = 410 + 96 * Math.sin(PI * u); if (i) h.lineTo(x, y); else h.moveTo(x, y); } h.stroke();
    for (let i = 0; i < 15; i++) { const u = (i + 0.5) / 15, x = lerp(-40, W + 40, u), y = 418 + 96 * Math.sin(PI * u); h.fillStyle = gray(0.97); h.beginPath(); h.arc(x, y, 9, 0, TAU); h.fill(); }
    h.fillStyle = gray(0.19); h.fillRect(-HM, 930, W + 2 * HM, H);               // the parapet still holds the day's heat
    for (const i of ORDER) personHeat(h, PEOPLE[i], t, o.k ? o.k(i) : 1);
  }

  // ------------------------------------------------------------------ the HUD (screen-fixed: the mosquito's own display)
  function corners(g, x, y, w, h, c, lw = 5, len = 38) {
    g.save(); g.strokeStyle = c; g.lineWidth = lw; g.lineCap = 'square'; g.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = x + sx * w / 2, cy = y + sy * h / 2;
      g.moveTo(cx, cy - sy * len); g.lineTo(cx, cy); g.lineTo(cx - sx * len, cy);
    }
    g.stroke(); g.restore();
  }
  // the reticle at (x, y): k = lock (0 searching, white → 1 locked, red); size in px
  function reticle(g, x, y, w, h, k, t, label = '') {
    const c = k > 0.5 ? ACC : 'rgba(236,232,225,0.92)', grow = 1 + 0.45 * (1 - eo(clamp(k)));
    g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 6;
    corners(g, x, y, w * grow, h * grow, c, k > 0.5 ? 6 : 4);
    g.strokeStyle = c; g.lineWidth = 2; g.beginPath();
    g.moveTo(x - 18, y); g.lineTo(x - 6, y); g.moveTo(x + 6, y); g.lineTo(x + 18, y); g.moveTo(x, y - 18); g.lineTo(x, y - 6); g.moveTo(x, y + 6); g.lineTo(x, y + 18); g.stroke();
    g.restore();
    if (label) mlabel(g, label, x - w * grow / 2, y - h * grow / 2 - 18, 1, { size: 30, c: k > 0.5 ? ACC : INK, bg: 'rgba(7,9,12,0.75)' });
  }
  // the sensor panel (bottom left, above the text zone): CO2 · HEAT · ODOUR, levels 0..1, a red tick when a sense "fires"
  function sensors(g, lv, t, o = {}) {
    const x0 = X0, y0 = 1004, names = ['CO₂', 'HEAT', 'ODOUR'];          // above the text zone's scrim, so it stays bright
    g.save(); g.globalAlpha *= o.a ?? 1;
    g.fillStyle = 'rgba(7,9,12,0.62)'; g.fillRect(x0 - 14, y0 - 34, 610, 92);
    names.forEach((n, i) => {
      const x = x0 + i * 200, v = clamp(lv[i]);
      mlabel(g, n, x, y0, 1, { size: 24, c: o.bad === i ? ACC : INK2 });
      for (let k = 0; k < 8; k++) { g.fillStyle = k < Math.round(v * 8) ? (o.hot === i || o.bad === i ? ACC : INK) : 'rgba(141,148,156,0.3)'; g.fillRect(x + k * 20, y0 + 14, 14, 22); }
    });
    g.restore();
  }
  function hudTop(g, left, right, t, a = 1) {
    mlabel(g, left, X0, 330, a, { size: 28, c: INK, bg: 'rgba(7,9,12,0.6)' });
    if (right) mlabel(g, right, 940, 330, a, { size: 28, c: INK2, align: 'right', bg: 'rgba(7,9,12,0.6)' });
  }
  const blink = (t, hz = 2) => (Math.floor(t * hz * 2) % 2 === 0 ? 1 : 0.35);

  // breath: CO2 seen as warm smoke from every mouth (the mosquito's sense, not the camera's), drawn over the heat
  const PUFFS = (() => { const r = mulberry32(41), o = []; for (let i = 0; i < 26; i++) o.push({ ph: r(), dx: (r() - 0.5) * 2, w: 0.6 + r() * 0.8 }); return o; })();
  function breath(g, t, k, o = {}) {
    if (k <= 0.01) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    PEOPLE.forEach((p, pi) => {
      const [mx, my] = mouth(p, t), big = o.big && pi === MAG ? 1.7 : 1;
      for (const q of PUFFS) {
        const age = (q.ph + t * 0.45 + pi * 0.17) % 1, x = mx + q.dx * 40 * age + Math.sin(t * 1.3 + q.ph * 9) * 26 * age, y = my - age * 520 * p.s;
        const r = (16 + 90 * age) * q.w * p.s * big, a = 0.22 * k * Math.sin(PI * age) * (o.col ? 1 : 1);
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, o.col ? `rgba(${o.col},${a.toFixed(3)})` : `rgba(255,170,60,${a.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,170,60,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
    });
    g.restore();
  }

  // a mosquito (our own drawing): side view, wings flickering at the frame rate; s = scale (1 ≈ 220 px long)
  function mosquito(g, x, y, s, t, o = {}) {
    g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(s * (o.flip ? -1 : 1), s);
    const ink = o.c || INK, fr = Math.round(t * 30);
    g.strokeStyle = ink; g.lineCap = 'round'; g.lineWidth = 3;
    for (const [x0, a1, a2] of [[-14, 2.3, 2.9], [0, 1.7, 1.6], [14, 0.9, 0.35]]) {             // six legs, long and kinked
      for (const side of [-1, 1]) { g.beginPath(); g.moveTo(x0, 8); g.lineTo(x0 + Math.cos(a1) * 60 * side * 0.6, 8 + Math.sin(a1) * 60); g.lineTo(x0 + Math.cos(a2) * 110 * side * 0.7, 8 + 100); g.stroke(); }
    }
    g.fillStyle = ink;
    g.beginPath(); g.ellipse(-62, 6, 54, 13, -0.12, 0, TAU); g.fill();                         // abdomen
    g.beginPath(); g.ellipse(0, 0, 26, 18, 0, 0, TAU); g.fill();                                // thorax
    g.beginPath(); g.arc(30, -2, 12, 0, TAU); g.fill();                                         // head
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(40, 0); g.lineTo(96, 18); g.stroke();             // proboscis
    g.lineWidth = 1.5; g.beginPath(); g.moveTo(38, -8); g.lineTo(70, -30); g.moveTo(36, -10); g.lineTo(62, -38); g.stroke();   // antennae
    const flap = fr % 2 ? -0.5 : 0.25;                                                          // ~400 beats a second: a blur between two poses
    g.fillStyle = o.wing || 'rgba(236,232,225,0.35)';
    g.save(); g.rotate(flap); g.beginPath(); g.ellipse(-30, -26, 52, 12, -0.25, 0, TAU); g.fill(); g.restore();
    g.restore();
  }
  // a nylon stocking (a soft tube with a heel), n = its number tag
  function stocking(g, x, y, s, c, n, o = {}) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = c; g.beginPath(); g.moveTo(-16, -40); g.lineTo(16, -40); g.lineTo(16, 18); g.quadraticCurveTo(16, 34, 34, 36); g.quadraticCurveTo(44, 38, 42, 46);
    g.quadraticCurveTo(38, 54, 10, 52); g.quadraticCurveTo(-16, 50, -16, 26); g.closePath(); g.fill();
    g.fillStyle = 'rgba(7,9,12,0.35)'; g.fillRect(-16, -40, 32, 8);
    g.restore();
    if (n != null) mlabel(g, String(n), x, y + 58 * s + 22, o.a ?? 1, { size: o.size || 20, c: o.nc || INK2, align: 'center', w: 400 });
  }

  // ------------------------------------------------------------------ the shots
  function lockOn(T, t) {                                       // the hook's sweep: left friend → … → the magnet, locked on "hundred"
    const P = (i) => head(PEOPLE[i], t);
    return keyXY([[-0.2, ...P(0)], [0.75, ...P(1)], [1.25, ...P(3)], [T.hundred - 0.32, ...P(4)], [T.hundred - 0.06, ...P(MAG)]], t);
  }
  function shHook(g, t) {                                       // 0 · the terrace: the reticle sweeps, hesitates, locks
    const T = times(), c = shotCam(g, t, 0, { push: 0.06, kicks: [[T.hundred - 0.06, 9]] });
    thermal(g, t, (h) => terraceHeat(h, t));
    screen(g);
    const [hx, hy] = lockOn(T, t), [sx, sy] = proj(c, hx, hy), k = clamp((t - (T.hundred - 0.06)) / 0.22);
    reticle(g, sx, sy, 190, 230, k, t, k > 0.5 ? 'TARGET LOCKED' : 'SCANNING');
    if (k > 0.5) mlabel(g, '×100', sx + 120, sy + 30, clamp((t - T.hundred) / 0.2), { size: 44, c: ACC, bg: 'rgba(7,9,12,0.7)' });
    hudTop(g, '◉ HOST SEEKING', 'AEDES AEGYPTI · ♀', t, 1);
  }
  function shMyth(g, t) {                                       // 1 · "sweet blood": a drop, a sugar sparkle, stamped MYTH
    const T = times(), c = shotCam(g, t, 1, { push: 0.04, kicks: [[T.bloodE + 0.04, 12]] });
    ground(g); grid(g);
    const k = hit(t, T.cut[1] + 0.05, 'playful'), x = 540, y = 690, s = 1.6 * clamp(k, 0, 1.15);
    g.save(); g.translate(x, y); g.scale(s, s);
    const gr = g.createLinearGradient(0, -170, 0, 120); gr.addColorStop(0, '#ff6a4d'); gr.addColorStop(1, '#8f1222');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -170); g.bezierCurveTo(30, -110, 120, -30, 120, 40); g.arc(0, 40, 120, 0, PI); g.bezierCurveTo(-120, -30, -30, -110, 0, -170); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-48, 10, 18, 40, 0.3, 0, TAU); g.fill();
    g.restore();
    const sw = clamp((t - T.sweet) / 0.3);                     // sugar sparkles on "sweet"
    if (sw > 0) { g.save(); g.globalAlpha *= sw * (1 - clamp((t - T.bloodE - 0.05) / 0.3) * 0.7); g.fillStyle = INK;
      for (const [dx, dy, r] of [[-170, -150, 14], [180, -90, 10], [150, 120, 12], [-190, 80, 9], [40, -250, 8]]) { const q = r * (1 + 0.3 * Math.sin(t * 9 + dx)); g.beginPath(); g.moveTo(x + dx, y + dy - q * 2); g.lineTo(x + dx + q * 0.5, y + dy); g.lineTo(x + dx, y + dy + q * 2); g.lineTo(x + dx - q * 0.5, y + dy); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x + dx - q * 2, y + dy); g.lineTo(x + dx, y + dy + q * 0.5); g.lineTo(x + dx + q * 2, y + dy); g.lineTo(x + dx, y + dy - q * 0.5); g.closePath(); g.fill(); }
      g.restore(); }
    mlabel(g, '"SWEET BLOOD"?', 540, 420, clamp((t - (T.cut[1] + 0.1)) / 0.25), { size: 40, align: 'center', c: INK });
    stamp(g, 540, 1000, clamp((t - (T.bloodE + 0.04)) / 0.25), 'MYTH', ACC, -0.1, 96);
    eyebrow(g, 'NO EVIDENCE BLOOD SUGAR DRAWS MOSQUITOES · THE CONVERSATION', t, T.cut[1] + 0.1);
  }
  function shBefore(g, t) {                                     // 2 · they choose from afar, before any blood
    const T = times(), u = clamp((t - T.cut[2]) / Math.max(0.8, T.cut[3] - T.cut[2])), c = shotCam(g, t, 2, { s0: 0.72, push: 0.1, oy: 760 });
    thermal(g, t, (h) => terraceHeat(h, t), { noise: 8 });
    screen(g);
    const [sx, sy] = proj(c, ...head(PEOPLE[MAG], t)), k = clamp((t - (T.before - 0.08)) / 0.2);
    reticle(g, sx, sy, 140, 168, 1, t, k > 0.5 ? 'TARGET CHOSEN' : 'TARGET LOCKED');
    const range = lerp(8.4, 6.1, u);
    mlabel(g, `RANGE ${range.toFixed(1)} M`, sx + 90, sy + 12, 1, { size: 26, c: INK, bg: 'rgba(7,9,12,0.7)' });
    mlabel(g, 'BLOOD TASTED: 0.0 µL', X0, 1075, clamp((t - (T.tasted - 0.1)) / 0.25), { size: 34, c: ACC, bg: 'rgba(7,9,12,0.75)' });
    hudTop(g, '◉ APPROACH', 'NO CONTACT YET', t, 1);
  }
  function shBreath(g, t) {                                     // 3 · your breath, from about ten metres
    const T = times(), c = shotCam(g, t, 3, { push: 0.05 });
    thermal(g, t, (h) => terraceHeat(h, t));
    breath(g, t, clamp((t - (T.breath - 0.2)) / 0.5));
    screen(g);
    const kR = clamp((t - (T.ten - 0.1)) / 0.4);              // the range ring: ~10 m
    if (kR > 0) { g.save(); g.globalAlpha *= kR; g.strokeStyle = AMB; g.lineWidth = 3; g.setLineDash([14, 12]); g.beginPath(); g.arc(540, 1700, 1180 * eo(kR), PI * 1.08, PI * 1.92); g.stroke(); g.restore();
      mlabel(g, '~10 M', 540, 1700 - 1180 * eo(kR) - 18, kR, { size: 40, c: AMB, align: 'center', bg: 'rgba(7,9,12,0.7)' }); }
    sensors(g, [clamp((t - T.breath) / 0.6), 0.1, 0.1], t, { hot: 0 });
    hudTop(g, '◉ CO₂ PLUME DETECTED', 'VAN BREUGEL ET AL. 2015', t, 1);
  }
  function shHeat(g, t) {                                       // 4 · then your heat, up close
    const T = times(), c = shotCam(g, t, 4, { push: 0.07, oy: 760 });
    thermal(g, t, (h) => {                                     // the classic thermal picture: an open hand
      h.fillStyle = gray(0.07); h.fillRect(-HM, -HM, W + 2 * HM, H + 2 * HM);
      h.save(); h.translate(540, 820); h.rotate(-0.06);
      h.fillStyle = gray(0.84); h.beginPath(); h.roundRect(-125, 150, 250, 900, 110); h.fill();            // wrist and forearm
      h.strokeStyle = gray(0.95); h.lineWidth = 12; for (const dx of [-40, 34]) { h.beginPath(); h.moveTo(dx, 1000); h.bezierCurveTo(dx - 10, 700, dx + 14, 420, dx * 0.6, 200); h.stroke(); }   // veins run hot
      h.fillStyle = gray(0.9); h.beginPath(); h.ellipse(0, 40, 175, 200, 0, 0, TAU); h.fill();             // the palm
      for (const [a, len, w] of [[-0.42, 270, 66], [-0.14, 318, 68], [0.13, 330, 68], [0.4, 290, 62]]) {   // four fingers, spread
        h.save(); h.rotate(a); h.fillStyle = gray(0.86); h.beginPath(); h.roundRect(-w / 2, -150 - len, w, len + 40, w / 2); h.fill();
        h.fillStyle = gray(0.72); h.beginPath(); h.roundRect(-w / 2 + 4, -150 - len + 2, w - 8, 70, (w - 8) / 2); h.fill(); h.restore();   // fingertips run cooler
      }
      h.save(); h.translate(-150, 60); h.rotate(-1.05); h.fillStyle = gray(0.86); h.beginPath(); h.roundRect(-34, -230, 68, 250, 34); h.fill();   // the thumb
      h.fillStyle = gray(0.72); h.beginPath(); h.roundRect(-30, -228, 60, 64, 30); h.fill(); h.restore();
      h.restore();
    }, { noise: 5 });
    screen(g);
    const shim = clamp((t - (T.heat - 0.2)) / 0.4);
    if (shim > 0) { g.save(); g.globalAlpha *= 0.6 * shim; g.strokeStyle = AMB; g.lineWidth = 3;                  // heat rising off the skin
      for (let k = 0; k < 6; k++) { const x0 = 300 + k * 96, ph = t * 3 + k, base = 360 - ((t * 120 + k * 40) % 60); g.beginPath(); for (let y = 0; y < 200; y += 10) { const x = x0 + Math.sin(y * 0.05 + ph) * 12; if (y) g.lineTo(x, base - y); else g.moveTo(x, base); } g.stroke(); }
      g.restore(); }
    const [sx, sy] = proj(c, 540, 760);
    reticle(g, sx, sy, 420, 560, 1, t, 'SKIN 34 °C');
    mlabel(g, 'RANGE < 1 M', sx + 230, sy - 250, 1, { size: 30, c: INK, bg: 'rgba(7,9,12,0.7)', align: 'right' });
    sensors(g, [1, clamp((t - T.heat) / 0.4), 0.1], t, { hot: 1 });
    hudTop(g, '◉ HEAT SIGNATURE', 'CLOSE RANGE ONLY', t, 1);
  }
  function shEveryone(g, t) {                                   // 5 · everyone breathes, everyone's warm: so why you?
    const T = times(), c = shotCam(g, t, 5, { push: 0.04 });
    thermal(g, t, (h) => terraceHeat(h, t));
    breath(g, t, 0.75);
    screen(g);
    PEOPLE.forEach((p, i) => {                                  // every friend passes both tests
      const [x, y] = proj(c, ...head(p, t)), k = clamp((t - (T.everyone + 0.08 * i)) / 0.2), k2 = clamp((t - (T.warm - 0.1 + 0.06 * i)) / 0.2);
      mlabel(g, 'CO₂ ✓', x - 50, y - 120 * p.s, k, { size: 22, c: INK, bg: 'rgba(7,9,12,0.7)' });
      mlabel(g, 'HEAT ✓', x - 50, y - 120 * p.s + 30, k2, { size: 22, c: INK, bg: 'rgba(7,9,12,0.7)' });
    });
    const hop = Math.floor(Math.max(0, t - T.cut[5]) / 0.32), seq = [0, 3, 1, 4, 2, 0, 3, 1], q = t < T.why - 0.1 ? seq[hop % seq.length] : MAG;   // the reticle can't decide
    const [rx, ry] = proj(c, ...head(PEOPLE[q], t));
    reticle(g, rx, ry + 10, 170, 210, 0, t, t < T.why - 0.1 ? 'NO PREFERENCE' : '');
    const kq = clamp((t - (T.why - 0.1)) / 0.2);
    if (kq > 0) { g.save(); g.globalAlpha *= kq; font(g, 150, 700, 'condensed'); g.textAlign = 'center'; g.fillStyle = ACC; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 12; g.fillText('?', rx, ry + 60); g.restore(); }
    hudTop(g, '◉ 5 TARGETS · ALL WARM · ALL BREATHING', '', t, 1);
  }
  const GRID = Array.from({ length: 64 }, (_, i) => ({ n: i + 1, x: 140 + (i % 8) * 114, y: 450 + Math.floor(i / 8) * 88 }));
  function shLab(g, t) {                                        // 6 · the lab: 64 people, nylon stockings
    const T = times(); shotCam(g, t, 6, { push: 0.04 });
    ground(g, '#0a0f14'); grid(g, 0.08);
    const span = Math.max(0.6, T.sixty - 0.1 - (T.cut[6] + 0.05));                    // the grid fills from the cut: 64 by "sixty-four"
    GRID.forEach((q, i) => { const k = hit(t, T.cut[6] + 0.05 + span * i / 63, 'playful'); if (k <= 0.01) return; stocking(g, q.x, q.y, 0.62 * clamp(k, 0, 1.2), 'rgba(236,232,225,0.82)', q.n, { a: clamp(k), size: 18 }); });
    const kN = clamp((t - (T.nylon - 0.1)) / 0.3);
    mlabel(g, 'WORN ON THE FOREARM · 6 HOURS A DAY', X0, 1160, kN, { size: 26, c: AMB, bg: true });
    eyebrow(g, 'ROCKEFELLER UNIVERSITY, NEW YORK · CELL, 2022', t, T.cut[6] + 0.05);
  }
  // the duels: two stockings in a two-choice box; the mosquitoes fly to one. Subject 33 keeps winning.
  const DUELS = [[12, 33, 1], [33, 7, 0], [41, 19, 0], [58, 33, 1], [33, 26, 0]];   // [left, right, winner side]
  const SWARM = (() => { const r = mulberry32(51), o = []; for (let i = 0; i < 26; i++) o.push({ d: r(), y: (r() - 0.5) * 120, x: (r() - 0.5) * 150, w: r() * TAU, sp: 0.6 + r() * 0.5 }); return o; })();
  function shDuel(g, t) {                                       // 7 · two at a time
    const T = times(); shotCam(g, t, 7, { push: 0.04 });
    ground(g, '#0a0f14'); grid(g, 0.08);
    const x0 = 80, x1 = 1000, y = 790, hgt = 520;
    g.fillStyle = 'rgba(236,232,225,0.04)'; g.fillRect(x0, y - hgt / 2, x1 - x0, hgt);
    g.strokeStyle = 'rgba(236,232,225,0.7)'; g.lineWidth = 4; g.strokeRect(x0, y - hgt / 2, x1 - x0, hgt);
    g.strokeStyle = 'rgba(236,232,225,0.4)'; g.lineWidth = 3; g.strokeRect(480, y - 90, 120, 180);       // the release cage, centre
    mlabel(g, 'RELEASE', 540, y + 130, 1, { size: 24, c: INK2, align: 'center' });
    const t0 = Math.max(T.chose - 0.3, T.cut[7] + 0.1), per = Math.max(0.55, (T.cut[8] - 0.1 - t0) / DUELS.length);
    const n = clamp(Math.floor((t - t0) / per), 0, DUELS.length - 1), u = clamp((t - t0 - n * per) / per), [L, R, win] = DUELS[n];
    const wins = DUELS.slice(0, n + (u > 0.7 ? 1 : 0)).filter(([a, b, w]) => (w ? b : a) === 33).length;
    stocking(g, x0 + 110, y + 20, 2.1, L === 33 ? ACC : 'rgba(236,232,225,0.85)', null);
    stocking(g, x1 - 130, y + 20, 2.1, R === 33 ? ACC : 'rgba(236,232,225,0.85)', null);
    mlabel(g, `#${L}`, x0 + 110, y - 150, 1, { size: 48, c: L === 33 ? ACC : INK, align: 'center' });
    mlabel(g, `#${R}`, x1 - 130, y - 150, 1, { size: 48, c: R === 33 ? ACC : INK, align: 'center' });
    if (t >= t0) for (const q of SWARM) {                       // they leave the cage and pick a side
      const side = q.d < 0.82 ? win : 1 - win, v = eio(clamp((u - q.d * 0.25) * 1.6 * q.sp)), tx = side ? x1 - 260 : x0 + 240;
      const mx = lerp(540, tx + q.x, v) + Math.sin(t * 7 + q.w) * 12, my = y + q.y * 1.6 * v + Math.cos(t * 6 + q.w) * 10;
      mosquito(g, mx, my, 0.24, t + q.w, { flip: side === 0, c: INK });
    }
    mlabel(g, `ROUND ${n + 1}`, X0, 470, 1, { size: 34, c: INK2 });
    mlabel(g, `#33 WINS: ${wins}`, 940, 470, clamp((t - t0) / 0.3), { size: 34, c: ACC, align: 'right' });
    eyebrow(g, 'TWO-CHOICE TEST · AEDES AEGYPTI, THE DENGUE MOSQUITO', t, T.cut[7] + 0.05);
  }
  const BOARD = [[7, 0.24], [26, 0.21], [41, 0.17], [19, 0.12], [33, 1], [58, 0.09]];        // the starting order; 33 is 5th
  function shWinner(g, t) {                                     // 8 · one volunteer kept winning: Subject 33
    const T = times(); shotCam(g, t, 8, { push: 0.04, kicks: [[T.thirtyE + 0.04, 10]] });
    ground(g, '#0a0f14'); grid(g, 0.08);
    const climb = eio(clamp((t - (T.kept - 0.1)) / Math.max(0.5, T.winningE - T.kept + 0.05)));   // 33 climbs from 5th to 1st by the ding
    BOARD.forEach(([n, v], i) => {
      const rank = n === 33 ? 4 - 4 * climb : i < 4 ? i + clamp(4 * climb - 3 + i) : i;      // each row steps down as 33 passes it
      const ry = 440 + rank * 112;
      const k = hit(t, T.cut[8] + 0.04 + i * 0.05, 'default'); if (k <= 0.01) return;
      const red = n === 33;
      g.save(); g.globalAlpha *= clamp(k * 3);
      g.fillStyle = red ? 'rgba(255,59,31,0.16)' : 'rgba(236,232,225,0.05)'; g.fillRect(X0, ry - 62, 860, 92);
      mlabel(g, `SUBJECT ${n}`, X0 + 24, ry, 1, { size: 36, c: red ? ACC : INK });
      g.fillStyle = red ? ACC : 'rgba(236,232,225,0.55)'; g.fillRect(X0 + 340, ry - 30, 330 * v * eo(clamp(k)), 30);
      g.restore();
    });
    const kC = clamp((t - (T.thirtyE + 0.04)) / 0.25);                                   // #1 lands with the ding, after "thirty-three."
    if (kC > 0) stamp(g, 868, 425, kC, '#1', ACC, -0.08, 64);
    eyebrow(g, 'MOST ATTRACTIVE TO MOSQUITOES · ROUND-ROBIN', t, T.cut[8] + 0.05);
  }
  function shMargin(g, t) {                                     // 9 · 100× more attractive than last place
    const T = times(); shotCam(g, t, 9, { push: 0.04, kicks: [[T.placeE + 0.05, 12]] });
    ground(g, '#0a0f14'); grid(g, 0.08);
    mlabel(g, 'SUBJECT 33', X0, 420, clamp((t - T.cut[9]) / 0.08), { size: 36, c: ACC });
    for (let i = 0; i < 100; i++) {                             // 100 mosquitoes for #33, from the cut through "hundred"
      const k = clamp((t - (T.cut[9] + i * Math.max(0.003, (T.hundred9 + 0.3 - T.cut[9]) / 100))) / 0.15); if (k <= 0) continue;
      mosquito(g, X0 + 30 + (i % 10) * 88, 480 + Math.floor(i / 10) * 52, 0.17 * k, t + i, { c: ACC, wing: 'rgba(255,143,120,0.4)' });
    }
    const kL = clamp((t - (T.last - 0.1)) / 0.25);              // …one for last place
    mlabel(g, 'LAST PLACE', X0, 1060, kL, { size: 36, c: INK2 });
    if (kL > 0) mosquito(g, X0 + 330, 1050, 0.17 * kL, t, { c: INK2 });
    stamp(g, 690, 1050, clamp((t - (T.placeE + 0.05)) / 0.25), 'MAGNET', ACC, -0.08, 74);
    eyebrow(g, 'MOST VS LEAST ATTRACTIVE · ~100×', t, T.cut[9] + 0.05);
  }
  // the skin, under a microscope: oil on the surface, acids in the oil (–COOH), their smell rising
  const ACIDS = (() => { const r = mulberry32(61), o = []; for (let i = 0; i < 18; i++) o.push({ x: 120 + r() * 840, y: 560 + r() * 330, a: r() * TAU, d: r() }); return o; })();
  const OIL = (() => { const r = mulberry32(62), o = []; for (let i = 0; i < 9; i++) o.push([100 + i * 105 + r() * 40, 960 + r() * 10, 40 + r() * 30]); return o; })();
  function acid(g, x, y, s, rot, a) {                           // a carboxyl group, drawn plainly: C, =O, –OH, a tail
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= a;
    g.strokeStyle = 'rgba(236,232,225,0.85)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-70, 0); g.lineTo(-38, -18); g.lineTo(-6, 0); g.moveTo(0, 0); g.lineTo(30, -26); g.moveTo(6, 4); g.lineTo(36, -22); g.moveTo(0, 0); g.lineTo(32, 22); g.stroke();
    for (const [cx, cy, r, c] of [[0, 0, 15, '#cfd3d8'], [34, -30, 15, ACC], [36, 26, 15, ACC], [56, 40, 9, '#ffffff'], [-38, -18, 12, '#8d949c'], [-72, 0, 12, '#8d949c']]) { g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); }
    g.restore();
  }
  function skinBase(g, t) {
    ground(g, '#0b0d12');
    const surf = (x) => 980 + 14 * Math.sin(x * 0.012 + 0.6) + 8 * Math.sin(x * 0.031);
    g.fillStyle = '#3a2a2a'; g.beginPath(); g.moveTo(-400, H + 400); for (let x = -400; x <= W + 400; x += 20) g.lineTo(x, surf(x)); g.lineTo(W + 400, H + 400); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,178,58,0.55)'; g.lineWidth = 3; g.beginPath(); for (let x = -400; x <= W + 400; x += 20) { if (x === -400) g.moveTo(x, surf(x)); else g.lineTo(x, surf(x)); } g.stroke();
    g.fillStyle = 'rgba(255,178,58,0.75)'; for (const [x, , r] of OIL) { g.beginPath(); g.ellipse(x, surf(x) - r * 0.25, r, r * 0.42, 0, PI, TAU); g.fill(); }   // drops of skin oil
    g.fillStyle = '#2a1e1f'; for (let k = 0; k < 3; k++) { const x = 240 + k * 300; g.beginPath(); g.ellipse(x, surf(x) + 16, 16, 26, 0, 0, TAU); g.fill(); }  // pores
    return surf;
  }
  function shSkin(g, t) {                                       // 10 · their skin: far more of certain acids
    const T = times(); shotCam(g, t, 10, { push: 0.1, oy: 900 });
    skinBase(g, t);
    ACIDS.forEach((q, i) => {
      const k = hit(t, T.certain - 0.25 + q.d * 0.6, 'playful'); if (k <= 0.01) return;
      acid(g, q.x + Math.sin(t * 0.8 + q.a) * 10, q.y - (t - T.cut[10]) * 14 + Math.cos(t + q.a) * 6, 0.62 * clamp(k, 0, 1.2), q.a + t * 0.2, clamp(k));
    });
    mlabel(g, '–COOH', 760, 520, clamp((t - (T.acids - 0.1)) / 0.3), { size: 40, c: ACC, bg: true });
    mlabel(g, 'SKIN OIL (SEBUM)', 600, 1060, clamp((t - (T.skin)) / 0.3), { size: 26, c: AMB, bg: true });
    eyebrow(g, 'CARBOXYLIC ACIDS · FAR HIGHER ON THE MAGNETS’ SKIN', t, T.cut[10] + 0.05);
  }
  const SCENT = (() => { const r = mulberry32(71), o = []; for (let i = 0; i < 90; i++) o.push({ x: 80 + r() * 920, ph: r(), sp: 0.25 + r() * 0.3, r: r() }); return o; })();
  function shFollow(g, t) {                                     // 11 · and mosquitoes follow that smell
    const T = times(); shotCam(g, t, 11, { push: 0.05, oy: 800 });
    skinBase(g, t);
    const wisp = (k, x0, ph) => Array.from({ length: 40 }, (_, i) => { const u = i / 39; return [x0 + Math.sin(u * 7 + ph + t * 1.4) * 60 * u, 960 - u * 700]; });
    const W1 = wisp(0, 560, 0.5);
    g.save(); g.globalCompositeOperation = 'lighter';           // the smell itself: specks rising off the skin, densest over the plume
    for (const q of SCENT) {
      const age = (q.ph + t * q.sp) % 1, x = q.x + Math.sin(t * 1.2 + q.ph * 9) * 30 * age + (560 - q.x) * 0.35 * age, y = 960 - age * 760;
      g.fillStyle = `rgba(255,178,58,${(0.5 * Math.sin(PI * age)).toFixed(3)})`; g.beginPath(); g.arc(x, y, 3 + 5 * q.r, 0, TAU); g.fill();
    }
    g.restore();
    g.save(); g.lineCap = 'round';
    for (const [x0, ph, a] of [[300, 1.3, 0.25], [560, 0.5, 0.75], [820, 2.2, 0.25]]) {
      const P = wisp(0, x0, ph); g.strokeStyle = `rgba(255,178,58,${a})`; g.lineWidth = 26; g.globalAlpha = 0.5; g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      g.lineWidth = 8; g.globalAlpha = 1; g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    }
    g.restore();
    const u = eio(clamp((t - (T.follow - 0.5)) / Math.max(0.9, T.cut[12] - T.follow + 0.3))), idx = Math.round(lerp(39, 6, u));   // down the plume, upwind, zig-zagging
    const [mx, my] = W1[idx], [nx] = W1[Math.max(0, idx - 1)];
    for (let k = idx + 1; k < 39; k += 3) { g.fillStyle = 'rgba(236,232,225,0.5)'; g.beginPath(); g.arc(W1[k][0], W1[k][1], 4, 0, TAU); g.fill(); }
    mosquito(g, mx, my, 0.85, t, { rot: nx >= mx ? 0.55 : -0.55, flip: nx < mx, c: INK });            // nose down the plume, facing its way
    screen(g); sensors(g, [1, 1, clamp((t - T.cut[11]) / 0.5)], t, { hot: 2 });
    eyebrow(g, 'MOSQUITOES DETECT ACIDS WITH THEIR ANTENNAE', t, T.cut[11] + 0.05);
  }
  function glitchFrame(g, t, amt) {                             // the sense of smell breaking: bands shifted, the frame torn
    if (amt <= 0.01) return;
    const r = mulberry32(900 + Math.round(t * 30)), img = g.canvas;
    screen(g);
    for (let k = 0; k < 9; k++) {
      const y = Math.floor(r() * H), h = 20 + Math.floor(r() * 90), dx = Math.round((r() - 0.5) * 120 * amt);
      g.drawImage(img, 0, y, W, h, dx, y, W, h);
    }
    g.save(); g.globalAlpha = 0.18 * amt; g.fillStyle = '#ffffff'; for (let k = 0; k < 140; k++) g.fillRect(r() * W, r() * H, 2 + r() * 8, 2); g.restore();
  }
  function shGlitch(g, t) {                                     // 12 · even with a damaged sense of smell…
    const T = times(), c = shotCam(g, t, 12, { push: 0.04 });
    thermal(g, t, (h) => terraceHeat(h, t), { noise: 14, gain: 0.92 });
    const amt = clamp((t - (T.damaged - 0.1)) / 0.25) * (0.6 + 0.4 * Math.sin(t * 23) ** 2);
    glitchFrame(g, t, amt);
    screen(g);
    mlabel(g, 'OLFACTION: DAMAGED', X0, 925, clamp((t - (T.damaged - 0.05)) / 0.2) * blink(t, 3), { size: 40, c: ACC, bg: 'rgba(7,9,12,0.8)' });
    sensors(g, [1, 1, lerp(0.5, 0.05, clamp((t - T.damaged) / 0.4))], t, { bad: 2 });
    hudTop(g, '◉ SIGNAL LOST', 'GENE-EDITED MOSQUITOES', t, 1);
    const [rx, ry] = proj(c, ...head(PEOPLE[Math.floor(t * 5) % 5], t));
    reticle(g, rx + Math.sin(t * 31) * 14, ry, 170, 210, 0, t, '');
  }
  function shFound(g, t) {                                      // 13 · …still found them
    const T = times(), c = shotCam(g, t, 13, { push: 0.06, kicks: [[T.found - 0.06, 11]] });
    thermal(g, t, (h) => terraceHeat(h, t), { noise: 9 });
    glitchFrame(g, t, 0.35 * (1 - clamp((t - T.found) / 0.5)));
    screen(g);
    const [sx, sy] = proj(c, ...head(PEOPLE[MAG], t)), k = clamp((t - (T.found - 0.06)) / 0.2);
    const [jx, jy] = proj(c, ...head(PEOPLE[3], t));
    reticle(g, lerp(jx, sx, eio(k)), lerp(jy, sy, eio(k)), 190, 230, k, t, k > 0.5 ? 'TARGET FOUND' : '');
    sensors(g, [1, 1, 0.05], t, { bad: 2 });
    hudTop(g, '◉ HOST SEEKING', 'OLFACTION: DAMAGED', t, 1);
  }
  function shYears(g, t) {                                      // 14 · three years later, still magnets
    const T = times(); shotCam(g, t, 14, { push: 0.04 });
    ground(g, '#0a0f14'); grid(g, 0.08);
    const fl = clamp((t - (T.a.s12 - 0.4)) / 0.33) * 2, n = Math.min(2, Math.floor(fl)), fu = fl - Math.floor(fl);      // three pages in the gap, with their sounds
    const x = 140, y = 470, w = 520, h = 420;
    g.fillStyle = '#151b22'; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(236,232,225,0.6)'; g.lineWidth = 3; g.strokeRect(x, y, w, h);
    g.fillStyle = ACC; g.fillRect(x, y, w, 70);
    for (let k = 0; k < 4; k++) { g.fillStyle = '#d9dde1'; g.fillRect(x + 70 + k * 120, y - 22, 16, 44); }
    font(g, 190, 700, 'condensed'); g.textAlign = 'center'; g.fillStyle = INK; g.fillText(String(n + 1), x + w / 2, y + 330);
    mlabel(g, 'YEAR', x + w / 2, y + 140, 1, { size: 40, c: INK2, align: 'center' });
    if (n < 2 && fu > 0.02) { g.save(); g.translate(x, y + 70); g.scale(1, 1 - eio(clamp(fu * 1.4))); g.fillStyle = '#1d242c'; g.fillRect(0, 0, w, h - 70); g.restore(); }   // a page turns
    const kB = clamp((t - (T.magnetsE + 0.05)) / 0.25);                                  // STILL lands after "magnets.", with its stamp
    g.save(); g.globalAlpha *= clamp((t - (T.cut[14] + 0.1)) / 0.2);
    g.fillStyle = 'rgba(255,59,31,0.16)'; g.fillRect(700, 560, 240, 230); g.strokeStyle = ACC; g.lineWidth = 3; g.strokeRect(700, 560, 240, 230);
    mlabel(g, 'SUBJECT 33', 820, 620, 1, { size: 26, c: ACC, align: 'center' });
    font(g, 130, 700, 'condensed'); g.textAlign = 'center'; g.fillStyle = ACC; g.fillText('#1', 820, 760); g.restore();
    stamp(g, 820, 900, kB, 'STILL', ACC, -0.08, 60);
    eyebrow(g, 'THE SAME PEOPLE, TESTED AGAIN OVER UP TO 3 YEARS', t, T.cut[14] + 0.05);
  }
  function shLoop(g, t) {                                       // 15 · they'll pick you next year too: the lock of frame 0
    const T = times(), c = shotCam(g, t, 15, { push: 0.06, kicks: [[T.next - 0.06, 9]] });
    thermal(g, t, (h) => terraceHeat(h, t));
    screen(g);
    const P = (i) => head(PEOPLE[i], t), [hx, hy] = keyXY([[T.cut[15], ...P(4)], [T.pick13 - 0.1, ...P(1)], [T.next - 0.08, ...P(MAG)]], t), [sx, sy] = proj(c, hx, hy);
    const k = clamp((t - (T.next - 0.08)) / 0.2);
    reticle(g, sx, sy, 190, 230, k, t, k > 0.5 ? 'TARGET LOCKED · AGAIN' : 'SCANNING');
    hudTop(g, '◉ HOST SEEKING', 'NEXT YEAR', t, 1);
  }
  const SHOTS = [shHook, shMyth, shBefore, shBreath, shHeat, shEveryone, shLab, shDuel, shWinner, shMargin, shSkin, shFollow, shGlitch, shFound, shYears, shLoop];

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) {
      S.g = canvas(root); under(root);
      const L = (text, y, size, o = {}) => line(root, text, { x: X0, y, size, ...o });
      S.L = {
        h0a: L('Mosquitoes love', TZ - 16, 130), h0b: L('some people 100× more.', TZ + 124, 92, { accent: [2] }),
        h1a: L("It isn't", TZ - 16, 140), h1b: L('your sweet blood.', TZ + 134, 120, { accent: [1, 2] }),
        h2a: L('They pick you', TZ - 16, 130), h2b: L('before a drop.', TZ + 124, 130, { accent: [0] }),
        h3a: L('Your breath:', TZ - 16, 140), h3b: L('from 10 metres.', TZ + 134, 120, { accent: [1, 2] }),
        h4a: L('Then your heat.', TZ - 16, 140, { accent: [2] }),
        h5a: L('Everyone breathes.', TZ - 16, 110), h5b: L("Everyone's warm.", TZ + 114, 110),
        h5c: L('So why you?', TZ - 16, 170, { accent: [2] }),
        h6x: L('A New York lab.', TZ - 16, 120),
        h6a: L('64 people.', TZ - 16, 150, { accent: [0] }), h6b: L('Nylon stockings.', TZ + 134, 120),
        h7a: L('Dengue mosquitoes', TZ - 16, 120), h7b: L('chose, two at a time.', TZ + 114, 96, { accent: [1] }),
        h8a: L('One kept winning.', TZ - 16, 120), h8b: L('Subject 33.', TZ + 114, 170, { accent: [1] }),
        h9a: L('100× more attractive', TZ - 16, 108, { accent: [0] }), h9b: L('than last place.', TZ + 114, 120),
        h10a: L('Their skin:', TZ - 16, 150), h10b: L('far more of certain acids.', TZ + 134, 80, { accent: [3, 4] }),
        h10c: L('Mosquitoes follow', TZ - 16, 120), h10d: L('that smell.', TZ + 114, 150, { accent: [1] }),
        h11a: L('A damaged', TZ - 16, 140), h11b: L('sense of smell…', TZ + 134, 120, { accent: [2] }),
        h11c: L('still found them.', TZ - 16, 130, { accent: [1] }),
        h12a: L('3 years later:', TZ - 16, 140, { accent: [0, 1] }), h12b: L('still magnets.', TZ + 134, 130, { accent: [1] }),
        h13a: L('If they always pick you,', TZ - 16, 92),
        h13b: L("they'll pick you", TZ - 16, 130), h13c: L('next year too.', TZ + 124, 140, { accent: [0, 1] }),
      };
      S.L.h0b.words[2].classList.add('tnum'); S.L.h9a.words[0].classList.add('tnum');
      S.m6 = mono(root, 'DE OBALDIA ET AL. · CELL 2022 · 64 VOLUNTEERS', X0, TZ + 262, 28);
      S.m10 = mono(root, 'CARBOXYLIC ACIDS · MADE IN SKIN OIL', X0, TZ + 262, 28, 'var(--accent)');
    },
    run(t, b, S) {
      const T = times(), L = S.L, g = S.g, c = T.cut; clear(g);
      let i = 0; while (i < SHOTS.length - 1 && t >= c[i + 1]) i++;
      SHOTS[i](g, t);
      const out = (k) => c[k + 1] - 0.05;
      const R = (Lx, tins, tout, lit, acc = []) => { rise(t, Lx, tins.map((x) => x - 0.06), tout); light(t, Lx, lit, acc); };
      // 0 · the hook: frame 0 already reads the name; the voice lights it
      rise(t, L.h0a, [-0.5, -0.45], out(0)); light(t, L.h0a, wv('s01', 0, 1));
      R(L.h0b, wv('s01', 2, 3, 5, 7), out(0), wv('s01', 2, 3, 5, 7), [2]);
      R(L.h1a, wv('s02', 3, 4), out(1), wv('s02', 3, 4)); R(L.h1b, wv('s02', 5, 6, 7), out(1), wv('s02', 5, 6, 7), [1, 2]);
      R(L.h2a, wv('s03', 0, 1, 2), out(2), wv('s03', 0, 1, 2)); R(L.h2b, wv('s03', 3, 6, 7), out(2), wv('s03', 3, 6, 7), [0]);
      R(L.h3a, wv('s04', 2, 3), out(3), wv('s04', 2, 3)); R(L.h3b, wv('s04', 4, 5, 6), out(3), wv('s04', 4, 5, 6), [1, 2]);
      R(L.h4a, wv('s04', 8, 9, 10), out(4), wv('s04', 8, 9, 10), [2]);
      R(L.h5a, wv('s05', 1, 2), T.so - 0.12, wv('s05', 1, 2)); R(L.h5b, wv('s05', 4, 5), T.so - 0.12, wv('s05', 4, 5));
      R(L.h5c, wv('s05', 6, 7, 8), out(5), wv('s05', 6, 7, 8), [2]);
      R(L.h6x, wv('s06', 1, 2, 3, 4), T.sixty - 0.12, wv('s06', 1, 2, 3, 4));
      R(L.h6a, wv('s06', 5, 6), out(6), wv('s06', 5, 6), [0]); R(L.h6b, wv('s06', 8, 9), out(6), wv('s06', 8, 9));
      enter(t, S.m6, T.sixty + 0.1, out(6));
      R(L.h7a, wv('s07', 1, 2), out(7), wv('s07', 1, 2)); R(L.h7b, wv('s07', 3, 6, 7, 8, 9), out(7), wv('s07', 3, 6, 7, 8, 9), [1]);
      R(L.h8a, wv('s08', 0, 2, 3), T.subject - 0.12, wv('s08', 0, 2, 3)); R(L.h8b, wv('s08', 4, 5), out(8), wv('s08', 4, 5), [1]);
      R(L.h9a, wv('s09', 1, 3, 4), out(9), wv('s09', 1, 3, 4), [0]); R(L.h9b, wv('s09', 5, 6, 7), out(9), wv('s09', 5, 6, 7));
      R(L.h10a, wv('s10', 0, 1), out(10), wv('s10', 0, 1)); R(L.h10b, wv('s10', 3, 4, 5, 6, 7), out(10), wv('s10', 3, 4, 5, 6, 7), [3, 4]);
      enter(t, S.m10, T.acids + 0.05, out(10));
      R(L.h10c, wv('s10', 9, 10), out(11), wv('s10', 9, 10)); R(L.h10d, wv('s10', 11, 12), out(11), wv('s10', 11, 12), [1]);
      R(L.h11a, wv('s11', 3, 4), out(12), wv('s11', 3, 4)); R(L.h11b, wv('s11', 5, 6, 7), out(12), wv('s11', 5, 6, 7), [2]);
      R(L.h11c, wv('s11', 8, 9, 10), out(13), wv('s11', 8, 9, 10), [1]);
      R(L.h12a, wv('s12', 1, 2, 3), out(14), wv('s12', 1, 2, 3), [0, 1]); R(L.h12b, wv('s12', 7, 8), out(14), wv('s12', 7, 8), [1]);
      R(L.h13a, wv('s13', 1, 2, 3, 4, 5), T.theyll - 0.12, wv('s13', 1, 2, 3, 4, 5));
      R(L.h13b, wv('s13', 6, 7, 8), T.end - 0.05, wv('s13', 6, 7, 8)); R(L.h13c, wv('s13', 9, 10, 11), T.end - 0.05, wv('s13', 9, 10, 11), [0, 1]);
    },
  });

  // ================================================================ finish: grain (seeded, per frame), as in AI171
  scene({
    name: 'fx', from: 'hook', to: 'end',
    build(root, S) {
      const cv = el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:0.09` }, root);
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
