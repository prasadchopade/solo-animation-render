// engine/clean.js · the clean motion-graphics kit (the reel 8 look, the channel's default from reel 9).
// A deep navy ground, flat drawings with no outlines and soft shadows, masked kinetic type, and one accent: the brand's
// orange dot for every pin, strike-through and the root cause. Load after core.js, kit.js and ui.js:
//   <script src="../../../engine/clean.js"></script>
// Canvas helpers take explicit positions; every function is a pure function of its arguments.
//   CLEAN.txt / measure / shadow / chip / pin / bg      drawing
//   CLEAN.head(root, text, y, size, colour, tint)        a centred masked headline (rise it with UI.rise)
//   CLEAN.strike(g, L, i, k, a)                          the orange strike through word i of a headline
//   CLEAN.pres(t, [t0, t1])                              a scene's presence as it pushes in from below and out
//   CLEAN.rootMark(g, x, y, s, k, t)                     the end card's mark drawn in place: the roots grow down to the
//                                                        orange dot at (x, y), the cause (k 0 → 1 draws it)
(() => {
  const { W, H, clamp, ease } = C;
  const TAU = Math.PI * 2, eo = ease.out, eio = ease.inOut;
  const COL = { bg0: '#0c1424', bg1: '#17243e', ink: '#f2ede4', mute: '#8f99ab', acc: '#ff8a1f', accL: '#ffc58f', paper: '#f4efe2', paperInk: '#1b2436' };

  function bg(g, glow = 'rgba(255,210,150,0.075)', gy = 1120) {      // the ground: navy, a soft light behind the subject
    let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, COL.bg1); gr.addColorStop(1, COL.bg0); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(W / 2, gy, 40, W / 2, gy, 950); gr.addColorStop(0, glow); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function shadow(g, x, y, rx, ry, a = 0.35) {
    const gr = g.createRadialGradient(x, y, 2, x, y, rx); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, TAU); g.fill(); g.restore();
  }
  function txt(g, s, x, y, size, o = {}) {
    g.font = `${o.w ?? 700} ${size}px ${o.f ?? 'Bahn'}`; g.fontStretch = o.st ?? 'condensed'; g.letterSpacing = o.ls ?? '0px';
    g.fillStyle = o.c ?? COL.ink; g.textAlign = o.a ?? 'center'; g.fillText(s, x, y); g.letterSpacing = '0px';
  }
  function measure(g, s, size, o = {}) {
    g.font = `${o.w ?? 700} ${size}px ${o.f ?? 'Bahn'}`; g.fontStretch = o.st ?? 'condensed'; g.letterSpacing = o.ls ?? '0px';
    const w = g.measureText(s).width; g.letterSpacing = '0px'; return w;
  }
  function chip(g, x, y, k, text, bgc, fg, size = 44, o = {}) {     // a pill label that pops in (k 0 → 1)
    if (k <= 0.01) return;
    const w = measure(g, text, size, o) + size * 0.9, h = size * 1.45;
    g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); g.globalAlpha *= clamp(k * 2.5);
    g.fillStyle = bgc; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h / 2); g.fill();
    txt(g, text, 0, size * 0.36, size, { ...o, c: fg }); g.restore();
  }
  function pin(g, x, y, k, t, r0 = 15) {          // the orange dot as a map pin, a ring pulsing out of it
    if (k <= 0.01) return;
    const r = r0 * k, ph = (t * 1.1) % 1;
    g.save();
    g.strokeStyle = `rgba(255,138,31,${(0.65 * (1 - ph) * clamp(k)).toFixed(3)})`; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r + 46 * ph, 0, TAU); g.stroke();
    g.shadowColor = 'rgba(255,138,31,0.6)'; g.shadowBlur = 18; g.fillStyle = COL.acc; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.shadowBlur = 0; g.fillStyle = '#ffe2c4'; g.beginPath(); g.arc(x - r * 0.28, y - r * 0.3, r * 0.3, 0, TAU); g.fill();
    g.restore();
  }
  function head(root, text, y, size, color, tint = {}) {
    const L = UI.line(root, text, { x: 0, y, size, color });
    L.el.style.width = `${W}px`; L.el.style.textAlign = 'center';
    for (const [i, c] of Object.entries(tint)) L.words[i].style.color = c;
    return L;
  }
  function wordBox(L, i) {                        // a word's layout box (offsets ignore transforms: deterministic)
    L._box = L._box || {};
    if (!L._box[i]) { const e = L.el, w = L.words[i]; L._box[i] = { x: e.offsetLeft + w.offsetLeft, y: e.offsetTop + w.offsetTop, w: w.offsetWidth, h: w.offsetHeight }; }
    return L._box[i];
  }
  function strike(g, L, i, k, a = 1, color = COL.acc) {
    if (k <= 0.001 || a <= 0.001) return;
    const b = wordBox(L, i), y = b.y + b.h * 0.53, x0 = b.x - L.size * 0.05, x1 = b.x + b.w + L.size * 0.05;
    g.save(); g.globalAlpha = a; g.strokeStyle = color; g.lineWidth = L.size * 0.1; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + (x1 - x0) * k, y); g.stroke(); g.restore();
  }
  function pres(t, w) {                           // 0 → 1 as a scene pushes in from below, back to 0 as the next pushes it out
    const [a, b] = w, kin = a < 0 ? 1 : eo(clamp((t - a - 0.05) / 0.4)), kout = eio(clamp((t - b + 0.02) / 0.26));
    return { k: kin * (1 - kout), dy: (1 - kin) * 140 - kout * 180, live: t > a - 0.05 && t < b + 0.3 };
  }

  // the end card's mark (engine/endcard/endcard.js, a 236 × 360 box): a sprout above a ground line, roots below, the main
  // root ending in the orange dot. rootMark draws it so the dot sits at (x, y): the ground and sprout first, then the
  // roots grow down to the cause, then the dot lands and rings. k: 0 → 1 over the whole move.
  const MARK = {
    ground: 'M0,96 L236,96',
    sprout: 'M118,96 L118,40 M118,62 C96,52 82,34 84,14 C104,18 118,34 118,58 M118,48 C134,30 152,22 170,26 C166,46 146,58 118,60',
    main: 'M118,96 L118,170 C118,215 168,212 196,252 C214,278 216,306 214,328',
    sides: [['M118,150 C118,190 86,208 60,232 C44,248 38,268 36,290', 5.5], ['M163,214 C150,232 146,252 148,274', 4.5], ['M70,222 C88,236 94,252 96,268', 4]],
    dot: [214, 336],
  };
  const LEN = {};
  function plen(d) {                              // a path's length (measured once in an SVG element)
    if (LEN[d] == null) {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d);
      LEN[d] = p.getTotalLength();
    }
    return LEN[d];
  }
  const P2 = {};
  const path2 = (d) => P2[d] || (P2[d] = new Path2D(d));
  function stroke(g, d, k, width, color) {
    if (k <= 0.004) return;
    const L = plen(d);
    g.save(); g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([L * clamp(k), L * 2]);
    g.stroke(path2(d)); g.restore();
  }
  function rootMark(g, x, y, s, k, t, o = {}) {
    if (k <= 0.001) return;
    const u = clamp(k) * 1.0, ink = o.ink || '#eef2f6', ink2 = o.ink2 || '#7f8a9a';
    g.save(); g.globalAlpha *= o.a ?? 1; g.translate(x - MARK.dot[0] * s, y - MARK.dot[1] * s); g.scale(s, s);
    stroke(g, MARK.ground, eo(clamp(u / 0.25)), 7, ink);
    stroke(g, MARK.sprout, eo(clamp((u - 0.08) / 0.3)), 7, ink);
    stroke(g, MARK.main, eio(clamp((u - 0.2) / 0.5)), 7, ink);
    MARK.sides.forEach(([d, w], i) => stroke(g, d, eio(clamp((u - 0.3 - 0.06 * i) / 0.4)), w, ink2));
    const dk = clamp((u - 0.68) / 0.12), rk = clamp((u - 0.72) / 0.28);
    if (dk > 0) {
      const [dx, dy] = MARK.dot, r = 20 * (dk < 1 ? eo(dk) * 1.15 : 1 + 0.15 * Math.max(0, 1 - (u - 0.8) * 8));
      g.strokeStyle = `rgba(255,138,31,${(0.9 * (1 - rk) + 0.35 * rk).toFixed(3)})`; g.lineWidth = 3;
      g.beginPath(); g.arc(dx, dy, 20 + 30 * Math.sqrt(rk) + 6 * Math.sin(t * 4) * rk, 0, TAU); g.stroke();
      g.shadowColor = 'rgba(255,138,31,0.7)'; g.shadowBlur = 24 / s; g.fillStyle = COL.acc; g.beginPath(); g.arc(dx, dy, r, 0, TAU); g.fill();
    }
    g.restore();
  }

  window.CLEAN = { COL, bg, shadow, txt, measure, chip, pin, head, wordBox, strike, pres, rootMark, MARK };
})();
