// engine/neon47/neon.js: the Style Lab's neon look, brought into main for reel 47 Close Your Eyes (23 Nov 2026).
// Copied from branch claude/style-lab-31f05c, lab/engines/neon/neon.js at 8cf5b67. Loads after engine/neon47/lab.js.
// Added for 47 (nothing else changed): the letters and signs the lab's alphabet lacked (B D J K P Q V X Y Z, 0 4-9,
// the apostrophe, colon, dash, comma and middle dot), on the same 4 x 6 single-stroke grid.
//
// THE STYLE LAB · neon: an animated neon sign on a dark brick wall. Glass tubes bent into lines and lit from inside.
// It animates the way real signs do: each pose is its own set of tubes, switched on and off, with the stutter of a
// tube igniting, the odd tired flicker, and black-painted ("blocked out") glass where one letter runs into the next.
// The glow is three passes: a wide spill on the wall (drawn small, blurred, added), a tight halo, then the tube with
// its white-hot core. The lettering is our own single-stroke alphabet, bent like tube; no font is used.
//
// Use, once per frame:  const S = NEON.sign();
//   S.push(x, y, rot, scale) ... S.pop()        a transform for the tubes that follow (they nest)
//   S.tube(pts, 'pink', k, w, { smooth, closed })   one tube; k is its brightness 0..1, w its width in local units
//   S.text('WHICH ONE', cx, top, h, 'pink', k)     a line of tube lettering, centred on cx; k may be (i, ch) => k
//   S.flush(g)                                   paints the wall, the glow and the tubes ({ wall: false }: over a scene)
// Helpers: NEON.flick(t, t0, [k...]) a stutter from t0, NEON.tired(t, key, perSec) the odd dip (at most one a second),
// NEON.sparks(S, ...).
// Loads after lab.js. Exposes window.NEON.
(() => {
  const { W, H, rnd, tex, frameOf, clamp, smoothPath, pathOf } = LAB;
  const COL = { pink: '#ff3d8b', cyan: '#3ae4ff', orange: '#ff8a2a', green: '#5dff74', violet: '#b26bff', yellow: '#ffe04a', white: '#f4f1ff', red: '#ff5038' };
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const GLASS = [58, 54, 66], BLOCK = [5, 4, 8], WHITE = [255, 255, 255];

  // ------------------------------------------------------------------ the wall: dark bricks, cached
  const wall = () => tex('neon-wall', W, H, (g) => {
    g.fillStyle = '#09080c'; g.fillRect(0, 0, W, H);                                           // the mortar
    const bw = 136, bh = 52, m = 8;
    for (let r = 0; r * bh < H + bh; r++) for (let c = -1; c * bw < W + bw; c++) {
      const x = c * bw + (r % 2) * bw / 2, y = r * bh - 18, l = 19 + rnd('brick', r, c) * 10;
      g.fillStyle = `rgb(${Math.round(l + 4)},${Math.round(l)},${Math.round(l + 7)})`; g.fillRect(x + m / 2, y + m / 2, bw - m, bh - m);
    }
    const im = g.getImageData(0, 0, W, H), d = im.data, R = C.mulberry32(17);
    for (let k = 0; k < d.length; k += 4) { const n = (R() - 0.5) * 9; d[k] += n; d[k + 1] += n; d[k + 2] += n; }
    g.putImageData(im, 0, 0);
    const gr = g.createRadialGradient(W / 2, H * 0.5, H * 0.18, W / 2, H * 0.5, H * 0.7);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.65)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  });

  // scratch canvases for the glow, cleared before each use (so nothing carries from one frame to the next)
  const SCR = {};
  function scratch(key, w, h) {
    if (!SCR[key]) { const c = document.createElement('canvas'); c.width = w; c.height = h; SCR[key] = { c, g: c.getContext('2d'), w, h }; }
    const s = SCR[key], g = s.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.clearRect(0, 0, w, h);
    g.lineCap = 'round'; g.lineJoin = 'round';
    return s;
  }
  const path = (g, T) => (T.smooth ? smoothPath(g, T.pts, !!T.closed, 0.5) : pathOf(g, T.pts, !!T.closed));
  // one glow pass: the lit tubes, widened, on a canvas `div` times smaller, blurred, then added onto the frame
  function glow(g, tubes, div, widen, alpha, blur, gain) {
    const a = scratch(`a${div}`, W / div, H / div), b = scratch(`b${div}`, W / div, H / div);
    a.g.setTransform(1 / div, 0, 0, 1 / div, 0, 0);
    for (const T of tubes) if (!T.block && T.k > 0.01) { path(a.g, T); a.g.lineWidth = T.w * widen; a.g.strokeStyle = css(T.col, alpha * T.k); a.g.stroke(); }
    b.g.filter = `blur(${blur}px)`; b.g.drawImage(a.c, 0, 0); b.g.filter = 'none';
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = gain; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(b.c, 0, 0, W, H); g.restore();
  }

  // ------------------------------------------------------------------ lettering: single-stroke capitals on a 4 x 6 grid (y down)
  const dot = (x, y) => Array.from({ length: 8 }, (_, i) => [x + Math.cos(i / 8 * Math.PI * 2) * 0.3, y + Math.sin(i / 8 * Math.PI * 2) * 0.3]);
  const GL = {
    A: [[[0, 6], [0, 1.6], [1.4, 0], [2.6, 0], [4, 1.6], [4, 6]], [[0, 3.6], [4, 3.6]]],
    C: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5]]],
    E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
    F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
    G: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 3.3], [2.2, 3.3]]],
    H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
    I: [[[1, 0], [3, 0]], [[2, 0], [2, 6]], [[1, 6], [3, 6]]],
    L: [[[0, 0], [0, 6], [4, 6]]],
    M: [[[0, 6], [0, 0], [2, 3.2], [4, 0], [4, 6]]],
    N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
    O: [[[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]]],
    R: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[2, 3], [4, 6]]],
    S: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]],
    T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
    U: [[[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]],
    W: [[[0, 0], [0.9, 6], [2, 2.6], [3.1, 6], [4, 0]]],
    '?': [[[0, 1.2], [1, 0], [3, 0], [4, 1], [4, 2], [2, 3.4], [2, 4.4]], [...dot(2, 5.7), dot(2, 5.7)[0]]],
    '.': [[...dot(0.8, 5.7), dot(0.8, 5.7)[0]]],
    1: [[[1, 1.2], [2.2, 0], [2.2, 6]], [[1, 6], [3.4, 6]]],
    2: [[[0, 1.2], [1, 0], [3, 0], [4, 1], [4, 2.2], [0, 6], [4, 6]]],
    3: [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3], [1.5, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]],
    // ---- added for reel 47 (the same grid and stroke style)
    B: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]],
    D: [[[0, 0], [0, 6], [2.5, 6], [4, 4.5], [4, 1.5], [2.5, 0], [0, 0]]],
    J: [[[4, 0], [4, 5], [3, 6], [1, 6], [0, 5]]],
    K: [[[0, 0], [0, 6]], [[4, 0], [0, 3.6]], [[1.3, 2.8], [4, 6]]],
    P: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2.2], [3, 3.2], [0, 3.2]]],
    Q: [[[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]], [[2.5, 4.5], [4.2, 6.3]]],
    V: [[[0, 0], [2, 6], [4, 0]]],
    X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
    Y: [[[0, 0], [2, 3.2], [4, 0]], [[2, 3.2], [2, 6]]],
    Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
    0: [[[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]]],
    4: [[[3, 6], [3, 0], [0, 4.2], [4, 4.2]]],
    5: [[[4, 0], [0.4, 0], [0.2, 2.8], [3, 2.6], [4, 3.6], [4, 5], [3, 6], [1, 6], [0, 5]]],
    6: [[[3.6, 0.3], [2.6, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 3.8], [3, 2.8], [1, 2.8], [0, 3.8]]],
    7: [[[0, 0], [4, 0], [1.6, 6]]],
    8: [[[1, 3], [0, 2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3], [1, 3], [0, 4], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3]]],
    9: [[[0.4, 5.7], [1.4, 6], [3, 6], [4, 5], [4, 1], [3, 0], [1, 0], [0, 1], [0, 2.2], [1, 3.2], [3, 3.2], [4, 2.2]]],
    "'": [[[1, 0], [0.7, 1.7]]],
    ':': [[...dot(0.8, 1.8), dot(0.8, 1.8)[0]], [...dot(0.8, 5.2), dot(0.8, 5.2)[0]]],
    '-': [[[0.4, 3], [3.6, 3]]],
    ',': [[[1, 5.2], [0.5, 6.8]]],
    '·': [[...dot(1.2, 3), dot(1.2, 3)[0]]],
  };
  const ADV = { ' ': 2.8, '.': 2.4, I: 4.6, "'": 2.0, ':': 2.4, ',': 2.4, '·': 3.0 };   // advance in grid units (the rest are 5.6)
  const textWidth = (str, h) => { let w = 0; for (const ch of str) w += (ADV[ch] ?? 5.6); return (w - 1.6) * h / 6; };

  // ------------------------------------------------------------------ the sign: collect tubes, then paint them all at once
  function sign() {
    const tubes = [], stack = [[1, 0, 0, 1, 0, 0]];
    const M = () => stack[stack.length - 1];
    const ap = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    const S = {
      push(tx = 0, ty = 0, rot = 0, sc = 1) {
        const m = M(), c = Math.cos(rot) * sc, s = Math.sin(rot) * sc;
        stack.push([m[0] * c + m[2] * s, m[1] * c + m[3] * s, -m[0] * s + m[2] * c, -m[1] * s + m[3] * c, m[0] * tx + m[2] * ty + m[4], m[1] * tx + m[3] * ty + m[5]]);
        return S;
      },
      pop() { if (stack.length > 1) stack.pop(); return S; },
      tube(pts, col, k = 1, w = 10, opt = {}) {
        if (!opt.block && !(k > 0)) return S;                                                  // fully off: not drawn
        const m = M(), sc = Math.hypot(m[0], m[1]);
        tubes.push({ pts: pts.map((p) => ap(m, p)), col: rgb(COL[col] || col), k: clamp(k), w: w * sc, smooth: opt.smooth, closed: opt.closed, block: opt.block });
        return S;
      },
      text(str, cx, top, h, col, k = 1, opt = {}) {
        const u = h / 6, w = opt.w ?? Math.max(5, h * 0.1), tw = textWidth(str, h);
        let x = cx - tw / 2, prev = null, i = 0, lit = false;
        for (const ch of str) {
          const strokes = GL[ch];
          if (strokes) {
            const kk = typeof k === 'function' ? k(i, ch) : k;
            if (!(kk > 0)) { prev = null; x += (ADV[ch] ?? 5.6) * u; i++; continue; }
            lit = true;
            const pts = strokes.map((s) => s.map(([gx, gy]) => [x + gx * u, top + gy * u]));
            if (prev && opt.block !== false) S.tube([prev, pts[0][0]], '#000000', 0, w, { block: true });   // painted-out glass between letters
            for (const p of pts) S.tube(p, col, kk, w);
            const last = pts[pts.length - 1]; prev = last[last.length - 1];
          } else prev = null;                                                                      // a space breaks the run
          x += (ADV[ch] ?? 5.6) * u; i++;
        }
        if (lit) {                                                                                 // its box, tube included, for the safe check
          const m = M(), P = [[cx - tw / 2 - w / 2, top - w / 2], [cx + tw / 2 + w / 2, top - w / 2], [cx - tw / 2 - w / 2, top + h + w / 2], [cx + tw / 2 + w / 2, top + h + w / 2]].map((p) => ap(m, p));
          LAB.textBox(str, Math.min(...P.map((q) => q[0])), Math.min(...P.map((q) => q[1])), Math.max(...P.map((q) => q[0])), Math.max(...P.map((q) => q[1])));
        }
        return S;
      },
      flush(g, opt = {}) {                                                                       // opt.wall: false = the tubes over a scene you drew
        if (opt.wall !== false) g.drawImage(wall(), 0, 0);
        g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
        for (const T of tubes) if (T.block || T.k < 1) {                                          // blocked-out glass, and glass not fully lit
          path(g, T); g.lineWidth = T.w; g.strokeStyle = T.block ? css(BLOCK, 0.85) : css(GLASS, 0.3 * (1 - T.k)); g.stroke();
        }
        g.restore();
        glow(g, tubes, 8, 6, 0.5, 3, 0.9);                                                         // the spill on the wall (about 24 px)
        glow(g, tubes, 2, 2.6, 0.55, 4, 0.85);                                                     // the halo (about 8 px)
        g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
        for (const T of tubes) if (!T.block && T.k > 0.01) {
          path(g, T);
          g.lineWidth = T.w; g.strokeStyle = css(mix(GLASS, T.col, T.k)); g.stroke();
          g.lineWidth = T.w * 0.4; g.strokeStyle = css(mix(T.col, WHITE, 0.72), T.k); g.stroke();   // the white-hot core
        }
        g.restore();
        tubes.length = 0;
      },
    };
    return S;
  }

  // ------------------------------------------------------------------ switching
  // a stutter from t0: brightness per frame from the list, then its last value (null before t0)
  const flick = (t, t0, seq) => { const f = frameOf(t) - frameOf(t0); return f < 0 ? null : seq[Math.min(f, seq.length - 1)]; };
  const IGNITE = [0.4, 0.15, 0.8, 1];                            // one dip: a stutter, not a strobe
  const on = (t, t0) => flick(t, t0, IGNITE) ?? 0;                     // dark, then a tube catching
  const off = (t, t1) => flick(t, t1, [0.3, 0]) ?? 1;                    // lit, then one dim frame and out
  // a tired tube: steady, but in some seconds it dips once, for two frames. perSec (0..1) is the chance of a dip in a
  // given second; there is never more than one dip in a second, so it can't strobe (no region changes more than three
  // times a second; see scripts/flash_check.py)
  const tired = (t, key, perSec = 0.3) => {
    const f = frameOf(t), s = Math.floor(f / 30), at = s * 30 + 2 * Math.floor(rnd(key, s, 'w') * 14);
    return rnd(key, s) < perSec && f >= at && f < at + 2 ? 0.35 + 0.25 * rnd(key, s, 'd') : 1;
  };
  // sparks where something electrical breaks: short bright dashes flying out and falling, for `dur` s
  function sparks(S, x, y, t, t0, seed, n = 8, dur = 0.3) {
    const u = (t - t0) / dur; if (u < 0 || u > 1) return;
    const f = frameOf(t);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.1 + 0.8 * rnd(seed, i)), r0 = 12 + u * 130 * (0.5 + 0.5 * rnd(seed, i, 'r')), L = 20 * (1 - u) + 6;
      const x0 = x + Math.cos(a) * r0 * (rnd(seed, i, 's') < 0.5 ? -1 : 1), y0 = y + Math.sin(a) * r0 + u * u * 140;
      S.tube([[x0, y0], [x0 + Math.cos(a) * L, y0 + Math.sin(a) * L + 4]], i % 2 ? 'yellow' : 'white', (1 - u) * (0.6 + 0.4 * rnd(seed, i, f)), 5);
    }
  }

  window.NEON = { COL, sign, flick, on, off, tired, sparks, textWidth, wall };
})();
