// engine/riso46/riso.js: the Style Lab's two-ink risograph look, brought into main for reel 46 Partner in Crime (23 Nov 2026).
// Copied unchanged from branch claude/style-lab-31f05c, lab/engines/riso/riso.js at 8db3368. Loads after engine/riso46/lab.js.
//
// THE STYLE LAB · riso: a two-ink risograph print, animated like a run of prints.
// Each ink is its own layer, drawn as a mask in black, then printed onto paper in its ink with "multiply", so where the
// two overlap they make a dark third colour, as real overprinting does. Every drawing (on threes) is a new pass through
// the machine: each layer lands a few pixels off (misregistration), and the ink's coverage is speckled by a grain that
// shifts with the pass. Tones are halftone dots on each ink's own screen angle. No gradients, no blur.
//
// Loads after lab.js. Exposes window.RISO.
(() => {
  const { W, H, rnd, rs, tex, drawing } = LAB;

  // ink colours (real riso drum colours, approximately): one per idea, never red or blue (the April 2026 button meme)
  const INK = { green: '#00a95c', pink: '#ff48b0', yellow: '#ffe800', orange: '#ff6c2f', purple: '#765ba7', teal: '#00838a' };
  const PAPER = '#f4efe3';

  function layer(name) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    return { name, c, g: c.getContext('2d') };
  }
  const LAYERS = {};
  function ink(name) { return LAYERS[name] || (LAYERS[name] = layer(name)); }

  // paper: warm off-white with fibres and a little tooth (static: printed paper doesn't boil)
  const paper = () => tex('riso-paper', W, H, (g) => {
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) {
      const x = rnd('pf', i) * W, y = rnd('pg', i) * H, l = 2 + rnd('pl', i) * 9, a = rnd('pa', i) * Math.PI;
      g.strokeStyle = `rgba(120,100,70,${0.03 + rnd('po', i) * 0.05})`; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  });
  // grain: speckles where the ink didn't take, a texture twice the frame so each pass can sit at its own offset
  const grain = () => tex('riso-grain', W + 200, H + 200, (g, w, h) => {
    const im = g.createImageData(w, h), d = im.data, r = C.mulberry32(9137);   // one sequential pass: the same texture every time
    for (let i = 0; i < w * h; i++) {
      const v = r();
      d[i * 4 + 3] = v > 0.86 ? 150 + v * 100 : v > 0.7 ? 40 : 0;
    }
    g.putImageData(im, 0, 0);
  });

  // a pass: clear the ink layers; draw(ink) paints masks in black into ink('green').g etc.; print() lays them on paper
  function begin() { for (const k in LAYERS) LAYERS[k].g.clearRect(0, 0, W, H); }
  function print(g, t, order = ['green', 'pink'], { n = 3, mis = 4, seed = 'pass' } = {}) {
    const pass = drawing(t, n);
    g.drawImage(paper(), 0, 0);
    for (let k = 0; k < order.length; k++) {
      const L = LAYERS[order[k]]; if (!L) continue;
      const lg = L.g;
      // speckle the coverage: punch the grain out of the mask at this pass's offset
      lg.save(); lg.globalCompositeOperation = 'destination-out'; lg.globalAlpha = 0.55;
      lg.drawImage(grain(), -Math.floor(rnd(seed, 'gx', k, pass) * 200), -Math.floor(rnd(seed, 'gy', k, pass) * 200));
      lg.restore();
      // colour it: the ink colour where the mask is
      lg.save(); lg.globalCompositeOperation = 'source-in'; lg.fillStyle = INK[order[k]]; lg.fillRect(0, 0, W, H); lg.restore();
      // print it, off-register by a few pixels for this pass
      g.save(); g.globalCompositeOperation = 'multiply';
      g.drawImage(L.c, Math.round(rs(seed, 'mx', k, pass) * mis), Math.round(rs(seed, 'my', k, pass) * mis));
      g.restore();
    }
  }

  // halftone: fill the current path's area (passed as a function that builds a path) with dots on a screen at `angle`
  // (degrees). tone 0–1 is the dots' coverage; cell is the screen's spacing in px
  function halftone(g, pathFn, tone, { angle = 45, cell = 14, x0 = 0, y0 = 0, x1 = W, y1 = H } = {}) {
    if (tone <= 0.01) return;
    g.save(); pathFn(g); g.clip();
    if (tone >= 0.99) { g.fillStyle = '#000'; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.restore(); return; }
    const r = Math.sqrt(tone) * cell * 0.62, a = angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + cell;
    g.fillStyle = '#000'; g.beginPath();
    for (let u = -R; u <= R; u += cell) for (let v = -R; v <= R; v += cell) {
      const px = cx + u * ca - v * sa, py = cy + u * sa + v * ca;
      if (px < x0 - cell || px > x1 + cell || py < y0 - cell || py > y1 + cell) continue;
      g.moveTo(px + r, py); g.arc(px, py, r, 0, Math.PI * 2);
    }
    g.fill(); g.restore();
  }
  // a gradient made of dots: tone runs from t0 at (ax, ay) to t1 at (bx, by), in bands
  function halftoneRamp(g, pathFn, t0, t1, ax, ay, bx, by, opts = {}) {
    const bands = opts.bands || 12;
    for (let i = 0; i < bands; i++) {
      const u0 = i / bands, u1 = (i + 1) / bands, tone = t0 + (t1 - t0) * (u0 + u1) / 2;
      g.save(); pathFn(g); g.clip();   // this band: a strip across the ramp's direction
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      const p0 = [ax + dx * u0, ay + dy * u0], p1 = [ax + dx * u1, ay + dy * u1], E = 4000;
      g.beginPath(); g.moveTo(p0[0] + nx * E, p0[1] + ny * E); g.lineTo(p1[0] + nx * E, p1[1] + ny * E); g.lineTo(p1[0] - nx * E, p1[1] - ny * E); g.lineTo(p0[0] - nx * E, p0[1] - ny * E); g.closePath(); g.clip();
      halftone(g, pathFn, tone, opts);
      g.restore();
    }
  }

  window.RISO = { INK, PAPER, ink, begin, print, halftone, halftoneRamp };
})();
