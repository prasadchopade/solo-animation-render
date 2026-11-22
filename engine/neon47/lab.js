// engine/neon47/lab.js: the Style Lab's canvas layer, brought into main for reel 47 Close Your Eyes (23 Nov 2026).
// Copied from branch claude/style-lab-31f05c, lab/engines/core/lab.js at 8cf5b67. The same two opt-in changes as
// engine/riso46/lab.js, so the lab's own calls behave as before: film() takes `to` (a mark or beat where the film stops,
// so the end card can follow) and `start: false` (the reel calls UI.endcard() and C.start() itself). Nothing else differs.
// Its own copy, so reel 47 never depends on another reel's files.
//
// THE STYLE LAB's layer on our engine (core.js, copied unchanged from engine/core.js). Canvas films, each frame a pure
// function of t, painted on one full-frame canvas and sealed in g.save()/g.restore().
//
// What it deliberately leaves out: kit.js's palette, the template's camera drift and push-in, the springs that ease every
// move in and settle it. Motion here is keyed poses with chosen eases (anticipation, overshoot, hard stops where a stop
// should be hard), drawings held on twos or threes, and physics baked before playback (engines/physics).
//
// Loads after motion.js, film/data.js and core.js. Exposes window.LAB.
(() => {
  const { W, H, FPS, scene } = C;

  // ------------------------------------------------------------------ time
  // The frame t paints, and time held on n's: n = 2 is "on twos" (15 drawings a second at 30 fps), n = 3 "on threes".
  const frameOf = (t) => Math.round(t * FPS + 1e-6);
  const held = (t, n = 2) => Math.floor(frameOf(t) / n) * n / FPS;
  const drawing = (t, n = 2) => Math.floor(frameOf(t) / n);        // which drawing is on screen: seeds the boil

  // ------------------------------------------------------------------ seeded randomness (pure: no state, no order)
  function hash(...k) {
    let h = 0x811c9dc5;
    for (const v of k) {
      const s = typeof v === 'string' ? v : String(Math.round(v * 1000));
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
      h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
    }
    h = Math.imul(h ^ (h >>> 16), 0x297a2d39); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  const rnd = (...k) => hash(...k);                 // [0, 1)
  const rs = (...k) => hash(...k) * 2 - 1;          // [-1, 1)
  // smooth value noise: n1(seed)(x) and n2(seed)(x, y), both in [-1, 1]
  const sm = (f) => f * f * (3 - 2 * f);
  const n1 = (seed) => (x) => { const i = Math.floor(x), f = sm(x - i); return rs(seed, i) * (1 - f) + rs(seed, i + 1) * f; };
  const n2 = (seed) => (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = sm(x - i), fy = sm(y - j);
    const a = rs(seed, i, j), b = rs(seed, i + 1, j), c = rs(seed, i, j + 1), d = rs(seed, i + 1, j + 1);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };

  // ------------------------------------------------------------------ eases and keyed poses (no springs)
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const E = {
    lin: (x) => x,
    in: (x) => x * x * x,
    out: (x) => 1 - Math.pow(1 - x, 3),
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    sine: (x) => 0.5 - 0.5 * Math.cos(Math.PI * x),
    in2: (x) => x * x, out2: (x) => 1 - (1 - x) * (1 - x),
    expoOut: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    // anticipation: dips back before it goes (a wind-up), and overshoot: passes the pose and comes back once
    back: (x, k = 1.70158) => x * x * ((k + 1) * x - k),
    overshoot: (x, k = 1.70158) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2),
    bounce: (x) => {   // a ball dropped onto a floor: the hard contacts a physics bake would give
      const n = 7.5625, d = 2.75;
      if (x < 1 / d) return n * x * x;
      if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
      if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
      return n * (x -= 2.625 / d) * x + 0.984375;
    },
    hold: (x) => (x < 1 ? 0 : 1),   // a cut: the pose changes on the key, no in-between
  };
  // keys: [[t, value, ease?], ...] sorted by t; the ease shapes the move INTO that key. Numbers or arrays of numbers.
  function key(t, ks) {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) {
      const [t1, v1, e] = ks[i];
      if (t < t1) {
        const [t0, v0] = ks[i - 1];
        const f = (typeof e === 'function' ? e : E[e || 'inOut'])(clamp((t - t0) / (t1 - t0)));
        return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], f)) : lerp(v0, v1, f);
      }
    }
    return ks[ks.length - 1][1];
  }
  const seg = (t, t0, t1, e = 'lin') => (typeof e === 'function' ? e : E[e])(clamp((t - t0) / (t1 - t0)));
  const pulse = (t, t0, t1) => (t >= t0 && t < t1 ? 1 : 0);
  // a loop's time: the frame at t = dur is frame 0 again
  const loopT = (t, dur) => { let u = t % dur; if (u < 0) u += dur; return dur - u <= 0.5 / FPS ? 0 : u; };

  // ------------------------------------------------------------------ textures: offscreen canvases cached by key
  // The content depends on the key alone, so a cache built in any frame order paints the same pixels.
  const TEX = new Map();
  function tex(key, w, h, paint) {
    if (!TEX.has(key)) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      paint(c.getContext('2d'), w, h, c);
      TEX.set(key, c);
    }
    return TEX.get(key);
  }
  // per-pixel paint into an offscreen canvas: fn(x, y) → [r, g, b, a] (0–255)
  function pixels(key, w, h, fn) {
    return tex(key, w, h, (g) => {
      const im = g.createImageData(w, h), d = im.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const p = fn(x, y), o = (y * w + x) * 4;
        d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2]; d[o + 3] = p[3] ?? 255;
      }
      g.putImageData(im, 0, 0);
    });
  }

  // ------------------------------------------------------------------ geometry helpers
  // a closed or open path through points, with each point nudged by a boil offset (a hand redrawing the line)
  function boilPts(pts, seed, amp) {
    return pts.map(([x, y], i) => [x + rs(seed, i, 1) * amp, y + rs(seed, i, 2) * amp]);
  }
  // resample a polyline to points every `step` px (so a boil wobbles along the line, not only at the corners)
  function resample(pts, step = 12, closed = false) {
    const P = closed ? [...pts, pts[0]] : pts, out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const [x0, y0] = P[i], [x1, y1] = P[i + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step));
      for (let k = 0; k < n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
    }
    if (!closed) out.push(P[P.length - 1]);
    return out;
  }
  function pathOf(g, pts, closed = true) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    if (closed) g.closePath();
  }
  // a smooth closed curve through points (Catmull-Rom → Bézier)
  function smoothPath(g, pts, closed = true, k = 0.5) {
    const n = pts.length, P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k / 3, p1[1] + (p2[1] - p0[1]) * k / 3,
        p2[0] - (p3[0] - p1[0]) * k / 3, p2[1] - (p3[1] - p1[1]) * k / 3, p2[0], p2[1]);
    }
    if (closed) g.closePath();
  }

  // ------------------------------------------------------------------ the frame
  // Safe zones (CLAUDE.md): words and the subject stay inside top ≥ 269, right ≤ 950, bottom ≤ 1536.
  const SAFE = { top: 269, right: 950, bottom: 1536, left: 60 };
  // ?safecheck: every piece of text drawn this frame reports its box in frame pixels, for scripts/safe_check.mjs.
  // fillText and strokeText on a full-frame canvas are caught here (with the context's transform); lettering drawn
  // another way (neon tube, pixel blocks) reports itself through LAB.textBox. Text baked once into a cached texture
  // is only seen on the frame that builds it.
  const SAFE_CHECK = new URLSearchParams(location.search).has('safecheck'), BOXES = [];
  window.__textBoxes = BOXES;
  let SCENERY = 0;
  function textBox(text, x0, y0, x1, y1) { if (SAFE_CHECK) BOXES.push({ text: String(text), x0, y0, x1, y1, scenery: SCENERY > 0 }); }
  // scenery(fn): text drawn inside is part of the world (a blackboard, a page the camera crops), not a caption. The
  // check lists it apart and doesn't fail on it, so mark only what the camera is meant to cut.
  function scenery(fn) { SCENERY++; try { return fn(); } finally { SCENERY--; } }
  if (SAFE_CHECK) for (const fn of ['fillText', 'strokeText']) {
    const orig = CanvasRenderingContext2D.prototype[fn];
    CanvasRenderingContext2D.prototype[fn] = function (text, x, y, ...rest) {
      if (this.canvas.width === W && this.canvas.height === H && this.globalAlpha > 0 && String(text).trim()) {
        const m = this.measureText(text), T = this.getTransform();
        const xs = [x - m.actualBoundingBoxLeft, x + m.actualBoundingBoxRight], ys = [y - m.actualBoundingBoxAscent, y + m.actualBoundingBoxDescent];
        const P = xs.flatMap((px) => ys.map((py) => [T.a * px + T.c * py + T.e, T.b * px + T.d * py + T.f]));
        textBox(text, Math.min(...P.map((q) => q[0])), Math.min(...P.map((q) => q[1])), Math.max(...P.map((q) => q[0])), Math.max(...P.map((q) => q[1])));
      }
      return orig.call(this, text, x, y, ...rest);
    };
  }
  // film({ draw(g, t), post?(g, t) }): one full-frame canvas; every frame starts from a clean, identity-transformed context
  function film(def) {
    scene({
      name: 'film', from: 0, to: def.to ?? 1e6,
      build(root, S) { S.g = C.canvas(root); },
      run(t, b, S) {
        const g = S.g;
        BOXES.length = 0;
        g.save();
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
        g.clearRect(0, 0, W, H);
        def.draw(g, t);
        g.restore();
        if (def.post) { g.save(); def.post(g, t); g.restore(); }
      },
    });
    if (def.start !== false) C.start();
  }
  // a debug overlay of the safe zones (?safe in the URL)
  const SHOW_SAFE = new URLSearchParams(location.search).has('safe');
  function safeOverlay(g) {
    if (!SHOW_SAFE) return;
    g.save(); g.fillStyle = 'rgba(255,0,80,0.22)';
    g.fillRect(0, 0, W, SAFE.top); g.fillRect(SAFE.right, 0, W - SAFE.right, H); g.fillRect(0, SAFE.bottom, W, H - SAFE.bottom);
    g.restore();
  }

  window.LAB = { W, H, FPS, SAFE, frameOf, held, drawing, hash, rnd, rs, n1, n2, clamp, lerp, E, key, seg, pulse, loopT,
    tex, pixels, boilPts, resample, pathOf, smoothPath, film, safeOverlay, textBox, scenery };
})();
