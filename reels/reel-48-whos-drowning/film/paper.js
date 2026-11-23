// film/paper.js: the cut-paper toolkit for reel 48 (a beach seen from straight above, made of paper).
// Everything here is a pure function of its arguments and a seed (mulberry32 only), so any frame paints the same in
// any order. Shapes are "hand-cut": their outlines wobble slowly (scissors), torn edges add fibre teeth.
(() => {
  const { mulberry32, clamp, lerp } = C;
  const TAU = Math.PI * 2;

  // smooth periodic noise on a loop (a cut outline's slow wobble): f(theta) in about [-1, 1]
  const loopCache = new Map();
  function loopNoise(seed) {
    if (loopCache.has(seed)) return loopCache.get(seed);
    const r = mulberry32(seed * 7919 + 17);
    const k = [1, 2, 3, 4, 6, 9].map((m) => ({ m, a: (r() * 2 - 1) / Math.sqrt(m), p: r() * TAU }));
    const norm = k.reduce((s, q) => s + Math.abs(q.a), 0) || 1;
    const f = (th) => k.reduce((s, q) => s + q.a * Math.sin(q.m * th + q.p), 0) / norm;
    loopCache.set(seed, f);
    return f;
  }
  // fine fibre teeth for a torn edge: deterministic per point index
  const tooth = (seed, i) => { const r = mulberry32(seed * 131 + i * 977 + 5); return r() - 0.5; };

  // a hand-cut ellipse as a path (rx, ry, rotation rot). cut: slow wobble as a fraction of the radius; tear: fibre teeth
  function blob(g, cx, cy, rx, ry, rot = 0, seed = 1, cut = 0.055, tear = 0) {
    const n = Math.max(16, Math.min(96, Math.round((rx + ry) * 0.55)));
    const f = loopNoise(seed), c = Math.cos(rot), s = Math.sin(rot);
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const th = (i / n) * TAU;
      const k = 1 + cut * f(th) + (tear ? tear * tooth(seed, i) : 0);
      const x = Math.cos(th) * rx * k, y = Math.sin(th) * ry * k;
      const X = cx + x * c - y * s, Y = cy + x * s + y * c;
      if (i) g.lineTo(X, Y); else g.moveTo(X, Y);
    }
    g.closePath();
  }

  // a limb: a capsule from (x1, y1) radius r1 to (x2, y2) radius r2, hand-cut
  function limb(g, x1, y1, x2, y2, r1, r2 = r1, seed = 3, cut = 0.09) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1e-6, a = Math.atan2(dy, dx);
    const f = loopNoise(seed), pts = [];
    const N = 10;
    for (let i = 0; i <= N; i++) {                       // cap at the far end
      const th = -Math.PI / 2 + (i / N) * Math.PI;
      pts.push([L + Math.cos(th) * r2, Math.sin(th) * r2, th]);
    }
    for (let i = 0; i <= N; i++) {                       // cap at the near end
      const th = Math.PI / 2 + (i / N) * Math.PI;
      pts.push([Math.cos(th) * r1, Math.sin(th) * r1, th]);
    }
    const c = Math.cos(a), s = Math.sin(a);
    g.beginPath();
    pts.forEach(([x, y, th], i) => {
      const k = 1 + cut * f(th + i * 0.37);
      const X = x1 + (x * c - y * s) * (i % 2 ? k : 1), Y = y1 + (x * s + y * c) * (i % 2 ? k : 1);
      if (i) g.lineTo(X, Y); else g.moveTo(X, Y);
    });
    g.closePath();
  }

  // a closed polygon (list of [x, y]) with a hand-cut wobble added along each edge
  function poly(g, pts, seed = 5, amp = 2.0) {
    const r = mulberry32(seed * 31 + 3);
    g.beginPath();
    pts.forEach(([x, y], i) => {
      const jx = (r() - 0.5) * amp * 2, jy = (r() - 0.5) * amp * 2;
      if (i) g.lineTo(x + jx, y + jy); else g.moveTo(x + jx, y + jy);
    });
    g.closePath();
  }

  // a torn strip along a polyline (foam, the label): thickness w, both edges torn
  function strip(g, pts, w, seed = 9, tearAmp = 0.35, taper = 0) {
    const top = [], bot = [];
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      const [xa, ya] = pts[Math.max(0, i - 1)], [xb, yb] = pts[Math.min(pts.length - 1, i + 1)];
      let nx = -(yb - ya), ny = xb - xa; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      const t1 = 1 + tearAmp * tooth(seed, i * 2), t2 = 1 + tearAmp * tooth(seed, i * 2 + 1);
      const tp = taper ? Math.pow(Math.max(0.08, Math.sin((Math.PI * i) / Math.max(1, pts.length - 1))), taper) : 1;
      top.push([x + nx * w * 0.5 * t1 * tp, y + ny * w * 0.5 * t1 * tp]);
      bot.push([x - nx * w * 0.5 * t2 * tp, y - ny * w * 0.5 * t2 * tp]);
    }
    g.beginPath();
    top.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]);
    g.closePath();
  }

  // fill the current path with a paper colour and a soft cast shadow below it (light from the upper left)
  function fill(g, color, o = {}) {
    g.save();
    if (o.shadow !== false) {
      const d = o.lift ?? 3;
      g.shadowColor = o.shadowColor || 'rgba(16, 34, 52, 0.32)';
      g.shadowBlur = o.blur ?? d * 2.2;
      g.shadowOffsetX = d * 0.7; g.shadowOffsetY = d;
    }
    g.globalAlpha *= o.alpha ?? 1;
    g.fillStyle = color; g.fill();
    g.shadowColor = 'transparent';
    if (o.texture !== false && PIECE) {             // its own sheet of paper: mottle and fibres
      g.save(); g.clip();
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = o.texA ?? 0.85;
      g.fillStyle = patternFor(g, PIECE);
      g.fillRect(-3000, -3000, 9000, 9000);
      g.restore();
    }
    if (o.rim !== false && o.shadow !== false) {   // coloured paper shows a paler core where it's cut
      g.strokeStyle = 'rgba(255, 252, 240, 0.55)'; g.lineWidth = o.rimW ?? 1.6; g.lineJoin = 'round';
      g.stroke();
    }
    g.restore();
  }

  // paper fibre tiles: seeded speckle and short fibres, multiplied over a sheet. Built once.
  function fibreTile(size, seed, strength = 1) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), r = mulberry32(seed);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, size, size);
    const img = g.getImageData(0, 0, size, size), d = img.data;
    for (let i = 0; i < d.length; i += 4) {                // fine grain
      const v = 255 - Math.floor(r() * 16 * strength);
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    g.putImageData(img, 0, 0);
    g.lineCap = 'round';
    for (let i = 0; i < 260 * strength; i++) {             // fibres
      const x = r() * size, y = r() * size, a = r() * TAU, L = 3 + r() * 11;
      g.strokeStyle = `rgba(90, 80, 70, ${0.05 + r() * 0.08})`; g.lineWidth = 0.6 + r() * 0.8;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * L * 0.5, y + Math.sin(a + 0.6) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.stroke();
    }
    for (let i = 0; i < 40 * strength; i++) {              // lighter flecks
      const x = r() * size, y = r() * size;
      g.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.3})`; g.beginPath(); g.arc(x, y, 0.6 + r() * 1.4, 0, TAU); g.fill();
    }
    return c;
  }

  // a sheet of coloured paper's own texture: soft blotches (visible at phone size) and long fibres, on white, for multiply
  function paperTile(size, seed) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), r = mulberry32(seed);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, size, size);
    for (let i = 0; i < 70; i++) {                         // blotches, wrapped so the tile repeats cleanly
      const x = r() * size, y = r() * size, R = 14 + r() * 46, a = 0.035 + r() * 0.05;
      const dark = r() < 0.7;
      for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, R);
        gr.addColorStop(0, dark ? `rgba(120, 100, 80, ${a})` : `rgba(255, 255, 255, ${a * 2})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(x + ox - R, y + oy - R, R * 2, R * 2);
      }
    }
    const img = g.getImageData(0, 0, size, size), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.floor(r() * 14); d[i] -= v; d[i + 1] -= v; d[i + 2] -= v; }
    g.putImageData(img, 0, 0);
    g.lineCap = 'round';
    for (let i = 0; i < 180; i++) {                        // fibres
      const x = r() * size, y = r() * size, a = r() * TAU, L = 8 + r() * 26;
      const dark = r() < 0.6;
      g.strokeStyle = dark ? `rgba(110, 95, 80, ${0.07 + r() * 0.08})` : `rgba(255, 255, 255, ${0.25 + r() * 0.3})`;
      g.lineWidth = 0.8 + r() * 1.2;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.5) * L * 0.5, y + Math.sin(a + 0.5) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.stroke();
    }
    return c;
  }
  let PIECE = null;
  const patCache = new WeakMap();
  function patternFor(g, tile) {
    let m = patCache.get(g); if (!m) { m = new Map(); patCache.set(g, m); }
    if (!m.has(tile)) m.set(tile, g.createPattern(tile, 'repeat'));
    return m.get(tile);
  }
  function usePieceTexture(on = true) { if (on && !PIECE) PIECE = paperTile(384, 9137); if (!on) PIECE = null; }

  // multiply a tile over the current path (or over everything when no clip is wanted)
  function grain(g, tile, alpha = 0.6, clip = true, ox = 0, oy = 0) {
    g.save();
    if (clip) g.clip();
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = alpha;
    const pat = g.createPattern(tile, 'repeat');
    g.translate(ox, oy);
    g.fillStyle = pat;
    g.fillRect(-ox - 4000, -oy - 4000, 8000, 8000);
    g.restore();
  }

  // time on twos: the picture changes every other frame at 30 fps (15 changes a second), like stop-motion paper
  const twos = (t, fps = 30) => Math.floor(t * fps / 2) * 2 / fps;

  window.PAPER = { TAU, loopNoise, tooth, blob, limb, poly, strip, fill, fibreTile, paperTile, usePieceTexture, grain, twos };
})();
