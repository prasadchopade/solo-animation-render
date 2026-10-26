// ui.js — type, captions and finishing helpers shared by every reel (loads after core.js, type.js, kit.js).
// Pure functions of t: nothing here keeps state between frames. (reels/reel-1-ai171-short predates this file and keeps its
// own copies of the same helpers inside its film.js.)
(() => {
  const C = window.C, K = window.KIT;
  const { W, H, put, reg, el, scene, clamp, lerp, mulberry32 } = C;
  const { st, hit, words } = K;

  // a masked display line (words rise through it): TYPE.line with the display class
  const line = (parent, text, o) => TYPE.line(parent, text, { cls: 'display', ...o });

  // words rise at absolute seconds (one per word, or a start + stagger); lift out from tout (seconds)
  function rise(t, L, tins, tout = null, o = {}) {
    const preset = o.preset || 'heavy', below = L.size * 1.45, above = -L.size * 1.45;
    L.words.forEach((w, i) => {
      const ti = Array.isArray(tins) ? tins[Math.min(i, tins.length - 1)] : tins + i * (o.stagger ?? 0.05);
      let y = below * (1 - hit(t, ti, preset));
      if (tout != null) y += above * st(t, tout - 0.15 + i * 0.015, 'snappy');
      put(w, { y, hide: y >= below * 0.999 || y <= above * 0.999 });
    });
  }

  // a small data / source label (Inconsolata, upper case), registered hidden
  const mono = (parent, html, x, y, size = 30, color = 'var(--ink-2)', extra = '') =>
    reg(el('div', { class: 'abs mono', style: `left:${x}px;top:${y}px;font-size:${size}px;color:${color};${extra}` }, parent, html), { o: 0 });

  // an element that rises in (opacity snaps in ≤ 4 frames) and lifts out at `out`
  function enter(t, e, t0, o = {}) {
    const p = hit(t, t0, o.preset || 'default'), ex = o.out != null ? st(t, o.out - 0.14, 'snappy') : 0;
    const op = clamp(p * 5) * (1 - clamp(ex * 1.6));
    put(e, { o: op, y: (o.dy ?? 36) * (1 - p) - (o.dyOut ?? 36) * ex, x: o.dx ? o.dx * (1 - p) : 0, s: o.grow ? lerp(o.grow, 1, p) : 1 });
    return p;
  }

  // a VO phrase (window.WORDS) as wrapped words, each its own mask; acc = word indices in the accent colour
  function wblock(parent, pid, o) {
    const size = o.size || 62;
    const d = el('div', { class: `abs ${o.cls || 'ui'}`, style: `left:${o.x}px;top:${o.y}px;width:${o.w || 860}px;font-size:${size}px;${o.css || ''}` }, parent);
    reg(d, { hide: true });
    const ws = words(pid).map((w, i) => {
      const outer = el('span', { class: 'cw' }, d), inner = el('span', {}, outer, w.w);
      if (o.acc && o.acc.includes(i)) inner.style.color = 'var(--accent)';
      if (o.cap && i === 0) inner.textContent = w.w[0].toUpperCase() + w.w.slice(1);
      d.appendChild(document.createTextNode(' '));
      return { inner: reg(inner, { y: 0 }), t0: w.t0 };
    });
    return { el: d, ws, size, t0: ws.length ? ws[0].t0 : Infinity };
  }
  // words rise as they are spoken; the phrase leaves on a hard cut at `out`
  function wrun(t, B, out) {
    const live = t >= B.t0 - 0.25 && t < out;
    put(B.el, { hide: !live });
    if (!live) return;
    B.ws.forEach((w) => { const p = hit(t, w.t0, 'snappy'); put(w.inner, { y: B.size * 1.25 * (1 - p), hide: p < 0.002 }); });
  }

  // vignette + text-zone scrim, BELOW a scene's type (call right after the scene's canvas)
  function under(root, o = {}) {
    const sc = o.scrim ?? 0.82;
    return el('div', { class: 'abs', style: `width:${W}px;height:${H}px;pointer-events:none;background:` +
      `linear-gradient(180deg, rgba(7,9,12,0) 0px, rgba(7,9,12,0) ${o.from ?? 1020}px, rgba(7,9,12,${sc * 0.85}) ${(o.from ?? 1020) + 200}px, rgba(7,9,12,${sc}) 100%),` +
      `radial-gradient(ellipse 90% 75% at 50% 42%, rgba(0,0,0,0) 58%, rgba(0,0,0,${o.vig ?? 0.5}) 100%)` }, root);
  }
  function grid(g, a = 0.07) {
    g.strokeStyle = `rgba(141,148,156,${a})`; g.lineWidth = 1;
    for (let x = 40; x < W; x += 80) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x, H + 200); g.stroke(); }
    for (let y = 40; y < H; y += 80) { g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); }
  }

  // global caption band: every listed VO phrase, in order, each on screen until the next starts (or its `out`)
  // list: [[pid, out?, accentIdx?], ...] — or 'all' for every phrase in window.WORDS
  function captions(list = 'all', o = {}) {
    const ids = list === 'all' ? [...new Set((window.WORDS || []).map((w) => w.p))].map((p) => [p]) : list;
    scene({
      name: 'captions', from: 'hook', to: o.to || 'end',
      build(root, S) {
        S.B = ids.map(([pid, out, acc], i) => {
          const B = wblock(root, pid, { x: o.x ?? 80, y: o.y ?? 1290, size: o.size ?? 66, acc });
          const next = ids[i + 1] ? words(ids[i + 1][0])[0] : null;
          return { B, out: out ?? (next ? next.t0 - C.leadFor('snappy') : C.bt(o.to || 'end')) };
        });
      },
      run(t, b, S) { for (const { B, out } of S.B) wrun(t, B, out); },
    });
  }

  // finishing grain, stepped on the frame clock (constant across one frame's motion-blur samples); stops at the end card
  function grain(opacity = 0.09, to = 'end') {
    scene({
      name: 'fx', from: 'hook', to,
      build(root, S) {
        const c = el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:${opacity}` }, root);
        S.g = c.getContext('2d'); S.tiles = K.grainTiles();
      },
      run(t, b, S) {
        const f = Math.floor(Math.round(t * 60) / 2), r = mulberry32(1000 + f), g = S.g;
        K.clear(g);
        const pat = g.createPattern(S.tiles[f % 4], 'repeat'), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
        g.translate(-ox, -oy); g.fillStyle = pat; g.fillRect(0, 0, W + 256, H + 256);
      },
    });
  }

  // the Root Cause end card (engine/endcard/endcard.js, loaded by the reel's index.html): 'end' → 'done', 3.0 s
  function endcard() {
    if (!window.ENDCARD) throw new Error('load ../../../engine/endcard/endcard.js in film/index.html (after core.js)');
    scene({ name: 'endcard', from: 'end', to: 'done', build(root, S) { ENDCARD.build(root, S); }, run(t, b, S) { ENDCARD.run(t - C.bt('end'), S); } });
  }

  window.UI = { line, rise, mono, enter, wblock, wrun, under, grid, captions, grain, endcard };
})();
