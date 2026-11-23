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

  // the outline recorder: the helpers below build the canvas path and a Path2D copy of it, so fill() can cut a piece's
  // pale core on the edges that face the light. Any other beginPath() on the context voids the copy (never stale).
  let REC = null, REC_ID = 0, SERIAL = 0;
  const CP = CanvasRenderingContext2D.prototype;
  if (!CP.__rcPatched) { const bp = CP.beginPath; CP.beginPath = function () { this.__rec = 0; return bp.call(this); }; CP.__rcPatched = true; }
  function begin(g) { g.beginPath(); REC = new Path2D(); REC_ID = ++SERIAL; }
  function to(g, x, y, first) { if (first) { g.moveTo(x, y); REC.moveTo(x, y); } else { g.lineTo(x, y); REC.lineTo(x, y); } }
  function close(g) { g.closePath(); REC.closePath(); g.__rec = REC_ID; }

  // a hand-cut ellipse as a path (rx, ry, rotation rot). cut: slow wobble as a fraction of the radius; tear: fibre teeth
  function blob(g, cx, cy, rx, ry, rot = 0, seed = 1, cut = 0.055, tear = 0) {
    const n = Math.max(16, Math.min(96, Math.round((rx + ry) * 0.55)));
    const f = loopNoise(seed), c = Math.cos(rot), s = Math.sin(rot);
    begin(g);
    for (let i = 0; i < n; i++) {
      const th = (i / n) * TAU;
      const k = 1 + cut * f(th) + (tear ? tear * tooth(seed, i) : 0);
      const x = Math.cos(th) * rx * k, y = Math.sin(th) * ry * k;
      to(g, cx + x * c - y * s, cy + x * s + y * c, i === 0);
    }
    close(g);
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
    begin(g);
    pts.forEach(([x, y, th], i) => {
      const k = 1 + cut * f(th + i * 0.37);
      to(g, x1 + (x * c - y * s) * (i % 2 ? k : 1), y1 + (x * s + y * c) * (i % 2 ? k : 1), i === 0);
    });
    close(g);
  }

  // a closed polygon (list of [x, y]) with a hand-cut wobble added along each edge
  function poly(g, pts, seed = 5, amp = 2.0) {
    const r = mulberry32(seed * 31 + 3);
    begin(g);
    pts.forEach(([x, y], i) => {
      const jx = (r() - 0.5) * amp * 2, jy = (r() - 0.5) * amp * 2;
      to(g, x + jx, y + jy, i === 0);
    });
    close(g);
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
    begin(g);
    top.forEach(([x, y], i) => to(g, x, y, i === 0));
    for (let i = bot.length - 1; i >= 0; i--) to(g, bot[i][0], bot[i][1], false);
    close(g);
  }

  // fill the current path with a paper colour and a soft cast shadow below it (light from the upper left)
  function fill(g, color, o = {}) {
    g.save();
    if (o.shadow !== false) {                       // a crisp contact shadow: paper lying just above the layer below
      const d = (o.lift ?? 3) * SHADOW_K;
      g.shadowColor = o.shadowColor || 'rgba(16, 34, 52, 0.36)';
      g.shadowBlur = o.blur ?? d * 0.6;
      g.shadowOffsetX = d * 0.5; g.shadowOffsetY = d * 0.75;
    }
    g.globalAlpha *= o.alpha ?? 1;
    g.fillStyle = color; g.fill();
    g.shadowColor = 'transparent';
    // the cut core: where the scissors went through, the paper's pale middle shows, on the edges facing the light
    // (upper left). The piece's own outline, shifted down-right by a pixel or two, covers it everywhere else.
    const core = o.rim !== false && o.shadow !== false && g.globalAlpha > 0.985 && REC && g.__rec === REC_ID;
    if (core) {
      const path = REC;
      g.save(); g.clip();
      const m = g.getTransform(), sc = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
      const k = clamp(1.0 * Math.sqrt(sc) * (o.coreW ?? 1), 0.9, 2.6);
      g.globalAlpha = 0.62; g.fillStyle = '#fffaf0'; g.fillRect(-1e5, -1e5, 2e5, 2e5);
      g.globalAlpha = 1; g.setTransform(m.a, m.b, m.c, m.d, m.e + k, m.f + k); g.fillStyle = color; g.fill(path);
      g.restore();
    }
    if (o.texture !== false && PIECE) {             // its own sheet of paper: mottle and fibres
      g.save(); g.clip();
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = o.texA ?? 0.85;
      g.fillStyle = patternFor(g, PIECE);
      g.fillRect(-3000, -3000, 9000, 9000);
      g.restore();
    }
    if (!core && o.rim !== false && o.shadow !== false) {   // where the core can't be cut: a faint even edge
      g.strokeStyle = 'rgba(255, 252, 240, 0.35)'; g.lineWidth = o.rimW ?? 1.2; g.lineJoin = 'round';
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
  let SHADOW_K = (typeof window !== 'undefined' && window.SHADOW_K) || 1.5;   // how far pieces stand off the layer below (crisp, so they read at phone size)
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

  window.PAPER = { TAU, loopNoise, tooth, blob, limb, poly, strip, fill, fibreTile, paperTile, usePieceTexture, grain, twos, setShadow: (k) => (SHADOW_K = k) };
})();
