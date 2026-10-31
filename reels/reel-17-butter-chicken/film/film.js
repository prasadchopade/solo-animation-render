// Reel 17 · Butter Chicken's Two Inventors. Butter chicken is credited to Kundan Lal, and there were two: Kundan Lal
// Gujral and Kundan Lal Jaggi, friends from Peshawar who, after Partition, ran one restaurant in Delhi, Moti Mahal.
// Their families now run rival chains and have been in the Delhi High Court since 2024 (a 2,752-page suit). The Gujrals
// say: Peshawar, leftover chicken saved in a gravy for the next day; the Jaggis say: Delhi, late guests and too little
// chicken. Too much or too little, it began with leftovers. Nearly three years on, no verdict; whoever wins, butter
// chicken was invented by Kundan Lal (the last line is the first: the reel loops). Facts: docs/research.md.
// The founders are never drawn with faces: silhouettes and nameplates only. Our own drawings throughout, no logos.
// Type in the text zone lit as the voice says it, as in AI171. 30 fps, no motion blur.
(() => {
  const { W, H, put, el, scene, canvas, clamp, lerp, ease, mulberry32 } = C;
  const K = window.KIT;
  const { st, hit, tb, words, cam, clear, drift, kick, font } = K;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn', '400 30px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI, eio = ease.inOut, eo = ease.out;
  const X0 = 80, TZ = 1222;
  const INK = '#f3ebdf', INK2 = '#a39686', ACC = '#ff3b1f', BUT = '#ffb52e', CREAM = '#fff2d8';

  // ------------------------------------------------------------------ timing (the narration's words; estimates until the voice is placed)
  const FB = { s01: 0.3, s02: 3.05, s03: 6.45, s04: 11.1, s05: 16.15, s06: 20.0, s07: 22.85, s08: 27.6, s09: 31.85, s10: 37.2, s11: 41.45, s12: 46.5, s13: 49.95, s14: 52.6 };
  const has = (p) => words(p).length > 0;
  const at = (p) => (has(p) ? words(p)[0].t0 : FB[p]);
  const wi = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t0 : at(p) + 0.32 * i);
  const wv = (p, ...ix) => ix.map((i) => wi(p, i));
  const lastE = (p) => (has(p) ? words(p)[words(p).length - 1].t1 : at(p) + 0.32 * 7);
  const LINES = ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10', 's11', 's12', 's13', 's14'];
  let T = null, LBL = null;
  function times() {
    if (T) return T;
    const t = {
      a: Object.fromEntries(LINES.map((p) => [p, at(p)])),
      kundan1: wi('s01', 5), problem: wi('s02', 3), two: wi('s02', 6),
      gujral: wi('s03', 2), jaggi: wi('s03', 6), friends: wi('s03', 8), pesh3: wi('s03', 10),
      partition: wi('s04', 0), delhi4: wi('s04', 4), where: wi('s04', 5), one4: wi('s04', 8), together: wi('s04', 10), moti: wi('s04', 11),
      famous: wi('s05', 5), nehru: wi('s05', 7),
      families: wi('s06', 2), rival: wi('s06', 4),
      y2024: wi('s07', 2), court7: wi('s07', 7), who: wi('s07', 9), bc7: wi('s07', 11),
      lawsuit: wi('s08', 1), n2: wi('s08', 3), n7: wi('s08', 5), n50: wi('s08', 8), pages: wi('s08', 9), long8: wi('s08', 10), e8: lastE('s08'),
      gujrals: wi('s09', 1), pesh9: wi('s09', 3), leftover: wi('s09', 4), saved: wi('s09', 6), gravy: wi('s09', 9), next: wi('s09', 12),
      jaggis: wi('s10', 1), delhi10: wi('s10', 3), late: wi('s10', 4), guests: wi('s10', 5), little10: wi('s10', 8), chicken10: wi('s10', 9),
      much: wi('s11', 1), little11: wi('s11', 5), either: wi('s11', 6), root: wi('s11', 9), leftovers: wi('s11', 12),
      years: wi('s12', 2), court12: wi('s12', 5), decided: wi('s12', 8), e12: lastE('s12'),
      whoever: wi('s13', 1), wins: wi('s13', 2), certain: wi('s13', 6),
      kundan14: wi('s14', 5), end14: lastE('s14'), end: tb('end'),
    };
    // one shot per line, and a cut inside s04 (the train, then the restaurant)
    t.cut = [0, t.a.s02 - 0.15, t.a.s03 - 0.15, t.a.s04 - 0.15, t.where - 0.12, ...LINES.slice(4).map((p) => t.a[p] - 0.15), t.end];
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
  const TONE = { red: ['#ff3b1f', 'rgba(255,59,31,0.7)'], butter: ['#ffb52e', 'rgba(255,181,46,0.7)'] };
  function light(t, L, times, acc = []) {
    L.words.forEach((w, i) => {
      const on = t >= times[Math.min(i, times.length - 1)] - 0.04, tone = acc.includes(i) ? L.tone || 'red' : null;
      put(w, { css: { color: tone ? (on ? TONE[tone][0] : TONE[tone][1]) : (on ? '' : 'rgba(243,235,223,0.78)') } });
    });
  }
  function under(root) {
    return el('div', { class: 'abs', style: `width:${W}px;height:${H}px;pointer-events:none;background:` +
      'linear-gradient(180deg, rgba(13,9,7,0.5) 0px, rgba(13,9,7,0) 300px, rgba(13,9,7,0) 1000px, rgba(13,9,7,0.8) 1200px, rgba(13,9,7,0.92) 100%)' }, root);
  }

  // ------------------------------------------------------------------ canvas helpers
  function shotCam(g, t, i, o = {}) {
    const T = times(), u = t - T.cut[i], d = Math.max(0.5, T.cut[i + 1] - T.cut[i]), dr = drift(t, o.drift ?? 4);
    let kx = 0, ky = 0; for (const [k0, a] of o.kicks || []) { const q = kick(t, k0, a); kx += q.x; ky += q.y; }
    const c = { s: (o.s0 ?? 1) + (o.push ?? 0.035) * eio(clamp(u / d)), x: dr.x + kx + (o.px ?? 0) * eio(clamp(u / d)), y: dr.y + ky, ox: o.ox ?? 540, oy: o.oy ?? 760 };
    cam(g, c); return c;
  }
  const screen = (g) => g.setTransform(1, 0, 0, 1, 0, 0);
  function mlabel(g, s, x, y, a = 1, o = {}) {                 // drawn on the label layer, with g's transform and alpha
    if (a <= 0.01) return;
    const q = LBL || g, size = o.size || 26;
    q.save(); q.setTransform(g.getTransform()); q.globalAlpha = g.globalAlpha * a; font(q, size, o.w || 700, 'normal', 'Mono'); q.letterSpacing = '0.06em'; q.textAlign = o.align || 'left';
    if (o.bg) { const w = q.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; q.fillStyle = o.bg === true ? 'rgba(13,9,7,0.82)' : o.bg; q.fillRect(x0 - 12, y - size * 0.95, w + 24, size * 1.38); if (o.edge) { q.strokeStyle = o.edge; q.lineWidth = 2; q.strokeRect(x0 - 12, y - size * 0.95, w + 24, size * 1.38); } }
    q.fillStyle = o.c || INK; q.fillText(s, x, y); q.restore();
  }
  const eyebrow = (g, s, t, t0, c = INK2) => { screen(g); mlabel(g, s, X0, 330, clamp((t - t0) / 0.25), { size: 30, c, bg: 'rgba(13,9,7,0.6)' }); };
  function big(g, s, x, y, size, c, o = {}) {
    if ((o.a ?? 1) <= 0.005) return;
    g.save(); g.globalAlpha *= o.a ?? 1; font(g, size, o.w || 700, o.stretch || 'condensed', o.fam || 'Bahn'); g.textAlign = o.align || 'left';
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur ?? 40; }
    g.fillStyle = c; g.fillText(s, x, y); g.restore();
  }
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const hex = (c) => (c.startsWith('#') ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c.match(/\d+/g).slice(0, 3).map(Number));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
  const rgba = (c, a) => { const A = hex(c); return `rgba(${A[0]},${A[1]},${A[2]},${Math.max(0, a).toFixed(3)})`; };
  const pop = (t, t0, d = 0.3) => eo(clamp((t - t0) / d));
  function glow(g, x, y, r, col, a) { if (a <= 0.005) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  function blob(g, pts) {                                     // a smooth closed curve through the points
    const n = pts.length; g.beginPath(); g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    g.closePath();
  }

  // ------------------------------------------------------------------ the set: a warm room, a wooden table
  function wall(g, top = '#120a07', bot = '#2c170c', gl = null) {
    const gr = g.createLinearGradient(0, -300, 0, 1300); gr.addColorStop(0, top); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(-400, -400, W + 800, H + 800);
    if (gl) glow(g, gl[0], gl[1], gl[2], gl[3], gl[4]);
  }
  function table(g, y0 = 830) {
    const top = g.createLinearGradient(0, y0, 0, y0 + 760); top.addColorStop(0, '#5e3519'); top.addColorStop(0.35, '#3b2010'); top.addColorStop(1, '#160b05');
    g.fillStyle = top; g.fillRect(-400, y0, W + 800, 1700);
    g.strokeStyle = 'rgba(18,7,2,0.35)'; g.lineWidth = 2;
    for (let k = -9; k <= 9; k++) { g.beginPath(); g.moveTo(540 + k * 95, y0); g.lineTo(540 + k * 430, y0 + 1200); g.stroke(); }
    g.fillStyle = 'rgba(255,196,130,0.14)'; g.fillRect(-400, y0, W + 800, 3);
  }

  // ------------------------------------------------------------------ the dish
  function piece(g, x, y, w, h, rot, seed, o = {}) {           // a chunk of tandoori chicken: charred, glossy (o.dry: dull and cracked; o.sub: sunk in gravy)
    const r = mulberry32(seed), pts = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, k = 0.8 + r() * 0.4; pts.push([Math.cos(a) * w * k, Math.sin(a) * h * k]); }
    g.save(); g.translate(x, y); g.rotate(rot); blob(g, pts);
    const gr = g.createLinearGradient(0, -h, 0, h);
    if (o.dry) { gr.addColorStop(0, '#b77a52'); gr.addColorStop(1, '#6a3c20'); } else { gr.addColorStop(0, '#ea8644'); gr.addColorStop(0.55, '#bb4c1d'); gr.addColorStop(1, '#6a2a10'); }
    g.fillStyle = gr; g.fill();
    g.save(); g.clip(); g.fillStyle = o.dry ? 'rgba(48,24,10,0.45)' : 'rgba(45,14,4,0.6)';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse((r() - 0.5) * w * 1.6, (r() - 0.65) * h * 1.4, w * (0.08 + r() * 0.1), h * (0.06 + r() * 0.08), r() * 3, 0, TAU); g.fill(); }
    if (o.dry) { g.strokeStyle = 'rgba(36,16,6,0.7)'; g.lineWidth = 2.5; for (let i = 0; i < 5; i++) { const cx = (r() - 0.5) * w, cy = (r() - 0.5) * h; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + (r() - 0.5) * w * 0.7, cy + (r() - 0.5) * h * 0.7); g.stroke(); } }
    g.restore();
    if (!o.dry) { g.fillStyle = 'rgba(255,226,184,0.38)'; g.beginPath(); g.ellipse(-w * 0.25, -h * 0.42, w * 0.3, h * 0.15, -0.25, 0, TAU); g.fill(); }
    if (o.sub) { const gg = g.createLinearGradient(0, h * 0.05, 0, h * 0.95); gg.addColorStop(0, 'rgba(234,101,38,0)'); gg.addColorStop(1, 'rgba(226,96,36,0.97)'); g.fillStyle = gg; blob(g, pts); g.fill(); }
    g.restore();
  }
  function steam(g, x, y, w, t, a = 1) {                       // wisps rising, soft
    if (a <= 0.01) return;
    g.save(); g.lineCap = 'round'; g.filter = 'blur(8px)';
    for (let k = 0; k < 4; k++) {
      const ph = (t * 0.3 + k * 0.27) % 1, x0 = x + (k - 1.5) * w * 0.24, h = 320;
      g.strokeStyle = `rgba(255,244,230,${(a * 0.24 * Math.sin(PI * ph)).toFixed(3)})`; g.lineWidth = 30 - 14 * ph;
      g.beginPath();
      for (let s = 0; s <= 14; s++) { const u = s / 14, yy = y - 30 - ph * 140 - u * h * (0.5 + 0.5 * ph), xx = x0 + Math.sin(u * 4.5 + t * 1.1 + k * 2.1) * 30 * (0.3 + u); s ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
      g.stroke();
    }
    g.restore();
  }
  function leaf(g, x, y, s, rot) {                             // a coriander leaf
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.fillStyle = '#4f9a34';
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.ellipse(k * 7, -Math.abs(k) * 2 - 4, 8, 6, k * 0.6, 0, TAU); g.fill(); }
    g.fillStyle = '#3a7a26'; g.fillRect(-1, 0, 2, 9); g.restore();
  }
  function bowl(g, x, y, R, t, o = {}) {                       // a copper handi of butter chicken: (x, y) the rim's centre, seen from the table
    const k = 0.4;
    g.save(); g.translate(x, y);
    let gr = g.createRadialGradient(0, R * 0.84, R * 0.1, 0, R * 0.84, R * 1.25); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, R * 0.86, R * 1.25, R * 0.34, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(0, 0, R, R * k, 0, 0, PI);                        // the front of the rim, then the belly
    g.bezierCurveTo(-R * 1.0, R * 0.5, -R * 0.62, R * 0.86, 0, R * 0.86);
    g.bezierCurveTo(R * 0.62, R * 0.86, R * 1.0, R * 0.5, R, 0); g.closePath();
    gr = g.createLinearGradient(-R, 0, R, 0);
    gr.addColorStop(0, '#3a1a0a'); gr.addColorStop(0.22, '#a5552a'); gr.addColorStop(0.36, '#f2b47c'); gr.addColorStop(0.5, '#c06a34'); gr.addColorStop(0.8, '#6a3016'); gr.addColorStop(1, '#2a1206');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(40,16,4,0.45)'; g.lineWidth = R * 0.022; g.beginPath(); g.ellipse(0, R * 0.16, R * 0.985, R * k * 1.1, 0, 0.15, PI - 0.15); g.stroke();
    g.fillStyle = '#4a200c'; g.beginPath(); g.ellipse(0, 0, R * 0.97, R * k * 0.97, 0, 0, TAU); g.fill();
    const sy = R * 0.05, sr = R * 0.92, sk = k * 0.92;
    g.save(); g.beginPath(); g.ellipse(0, sy, sr, sr * sk, 0, 0, TAU); g.clip();
    gr = g.createRadialGradient(-sr * 0.25, sy - sr * sk * 0.4, sr * 0.05, 0, sy, sr * 1.05);
    gr.addColorStop(0, '#ff9a48'); gr.addColorStop(0.45, '#ea6526'); gr.addColorStop(0.85, '#b8441a'); gr.addColorStop(1, '#7a2a0c');
    g.fillStyle = gr; g.fillRect(-sr, sy - sr, sr * 2, sr * 2);
    const P = [[-0.5, -0.05, 0.17], [-0.14, 0.45, 0.16], [0.42, 0.25, 0.17], [0.56, -0.3, 0.14], [-0.3, -0.55, 0.13], [0.1, -0.5, 0.12], [-0.66, 0.36, 0.12]];
    P.forEach(([px, py, ps], i) => piece(g, px * sr, sy + py * sr * sk, ps * R * 1.25, ps * R * 0.72, ((i * 1.37) % 1) - 0.5, 50 + i, { sub: true }));
    const rot = t * 0.12;                                        // the cream, slowly turning
    g.strokeStyle = 'rgba(255,240,214,0.85)'; g.lineWidth = R * 0.022; g.lineCap = 'round'; g.beginPath();
    for (let s = 0; s <= 90; s++) { const a = s / 90 * 2.6 * PI, q = sr * (0.05 + 0.075 * a), px = R * 0.1 + Math.cos(a + rot) * q, py = sy - R * 0.03 + Math.sin(a + rot) * q * sk; s ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke();
    const melt = clamp(o.melt ?? 0.3), bx = -R * 0.18, by = sy - R * 0.12, bw = R * 0.2 * (1 - 0.45 * melt);   // the butter
    glow(g, bx, by + 4, R * 0.32, '#ffd27a', 0.35 + 0.3 * melt);
    g.fillStyle = '#f7cf5e'; g.beginPath(); g.moveTo(bx - bw, by); g.lineTo(bx + bw * 0.2, by - bw * 0.42); g.lineTo(bx + bw, by - bw * 0.05); g.lineTo(bx - bw * 0.2, by + bw * 0.38); g.closePath(); g.fill();
    g.fillStyle = '#fff1b8'; g.beginPath(); g.moveTo(bx - bw * 0.8, by - bw * 0.04); g.lineTo(bx + bw * 0.15, by - bw * 0.36); g.lineTo(bx + bw * 0.75, by - bw * 0.07); g.lineTo(bx - bw * 0.15, by + bw * 0.24); g.closePath(); g.fill();
    const rl = mulberry32(77); for (let i = 0; i < 9; i++) leaf(g, (rl() - 0.5) * sr * 1.5, sy + (rl() - 0.5) * sr * sk * 1.4, R / 210, rl() * 6);
    g.fillStyle = 'rgba(255,236,210,0.16)'; g.beginPath(); g.ellipse(-sr * 0.4, sy - sr * sk * 0.55, sr * 0.3, sr * sk * 0.12, -0.1, 0, TAU); g.fill();
    g.restore();
    gr = g.createLinearGradient(-R, 0, R, 0); gr.addColorStop(0, '#6a4a1a'); gr.addColorStop(0.3, '#f4d08a'); gr.addColorStop(0.55, '#b8863e'); gr.addColorStop(1, '#4a3010');
    g.strokeStyle = gr; g.lineWidth = R * 0.06; g.beginPath(); g.ellipse(0, 0, R, R * k, 0, 0, TAU); g.stroke();
    g.restore();
    if (o.steam !== false) steam(g, x, y - R * 0.05, R * 1.2, t, o.steamA ?? 1);
  }
  function plate(g, x, y, s, name, o = {}) {                   // a brass desk nameplate (our drawing); (x, y) = the middle of its base
    if ((o.a ?? 1) <= 0.01) return;
    g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(s, s); g.globalAlpha *= o.a ?? 1;
    const w = 600, h = 190, subA = o.sub ? clamp(o.subA ?? 0) : 0, top = -22 - h;
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(0, 10, w * 0.56, 22, 0, 0, TAU); g.fill();
    g.fillStyle = '#2e1a0e'; rr(g, -w / 2 - 24, -22, w + 48, 30, 8); g.fill(); g.fillStyle = 'rgba(255,200,140,0.18)'; g.fillRect(-w / 2 - 20, -22, w + 40, 3);
    const face = () => { g.beginPath(); g.moveTo(-w / 2 + 14, top); g.lineTo(w / 2 - 14, top); g.lineTo(w / 2, -22); g.lineTo(-w / 2, -22); g.closePath(); };
    const gr = g.createLinearGradient(0, top, 0, -22); gr.addColorStop(0, '#fbe3a4'); gr.addColorStop(0.35, '#e0ae58'); gr.addColorStop(0.75, '#a87430'); gr.addColorStop(1, '#6e4a1c');
    g.fillStyle = gr; face(); g.fill();
    g.strokeStyle = 'rgba(255,246,214,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-w / 2 + 16, top + 3); g.lineTo(w / 2 - 16, top + 3); g.stroke();
    g.strokeStyle = 'rgba(90,58,20,0.75)'; g.lineWidth = 3; g.strokeRect(-w / 2 + 34, top + 18, w - 68, h - 36);
    if (o.shine != null) {
      g.save(); face(); g.clip(); const sx = lerp(-w * 0.9, w * 0.9, o.shine), sg = g.createLinearGradient(sx - 90, 0, sx + 90, 0);
      sg.addColorStop(0, 'rgba(255,255,240,0)'); sg.addColorStop(0.5, 'rgba(255,255,240,0.55)'); sg.addColorStop(1, 'rgba(255,255,240,0)'); g.fillStyle = sg; g.fillRect(-w, top, 2 * w, h); g.restore();
    }
    const ty = lerp(top + h / 2 + 30, top + h / 2 - 4, subA);
    font(g, 86, 700, 'condensed'); g.textAlign = 'center';
    g.fillStyle = 'rgba(255,240,200,0.45)'; g.fillText(name, 1.5, ty + 2); g.fillStyle = '#3a2408'; g.fillText(name, 0, ty);
    if (subA > 0.01) { g.globalAlpha *= subA; font(g, 52, 700, 'condensed'); g.fillStyle = 'rgba(255,240,200,0.45)'; g.fillText(o.sub, 1.5, ty + 58); g.fillStyle = '#6a2a10'; g.fillText(o.sub, 0, ty + 56); }
    g.restore();
  }

  // ------------------------------------------------------------------ people: silhouettes only, never faces
  function man(g, x, y, s, o = {}) {                           // a man in a kurta, standing; (x, y) = his feet
    g.save(); g.translate(x, y); g.scale(o.flip ? -s : s, s); g.fillStyle = o.c || '#2a1d12';
    g.fillRect(-28, -175, 22, 175); g.fillRect(6, -175, 22, 175);
    g.beginPath(); g.moveTo(-52, -420); g.lineTo(52, -420); g.lineTo(70, -150); g.lineTo(-70, -150); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-50, -418); g.quadraticCurveTo(-86, -400, -84, -250); g.lineTo(-64, -246); g.lineTo(-58, -380); g.closePath(); g.fill();
    if (o.arm) { g.beginPath(); g.moveTo(50, -418); g.quadraticCurveTo(95, -390, 120, -330); g.lineTo(104, -318); g.lineTo(58, -372); g.closePath(); g.fill(); }
    else { g.beginPath(); g.moveTo(50, -418); g.quadraticCurveTo(86, -400, 84, -250); g.lineTo(64, -246); g.lineTo(58, -380); g.closePath(); g.fill(); }
    g.fillRect(-13, -452, 26, 36); g.beginPath(); g.ellipse(0, -490, 34, 42, 0, 0, TAU); g.fill();
    if (o.cap) { g.beginPath(); g.ellipse(0, -524, 36, 14, 0, PI, TAU); g.fill(); g.fillRect(-36, -526, 72, 10); }
    g.restore();
  }
  function bust(g, x, y, s, c = '#1a100a') {                   // a diner: head and shoulders
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = c;
    g.beginPath(); g.ellipse(0, -70, 26, 32, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-60, 30); g.quadraticCurveTo(-58, -30, 0, -34); g.quadraticCurveTo(58, -30, 60, 30); g.closePath(); g.fill(); g.restore();
  }

  // ------------------------------------------------------------------ Peshawar: an old photograph (our drawing)
  function tandoor(g, x, y, s, t, heat = 1) {                  // a clay tandoor, its mouth glowing
    g.save(); g.translate(x, y); g.scale(s, s);
    const gr = g.createLinearGradient(-110, 0, 110, 0); gr.addColorStop(0, '#4a2a16'); gr.addColorStop(0.4, '#9a6038'); gr.addColorStop(1, '#3a2010');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-120, 0); g.quadraticCurveTo(-130, -150, -60, -190); g.lineTo(60, -190); g.quadraticCurveTo(130, -150, 120, 0); g.closePath(); g.fill();
    const f = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3);
    glow(g, 0, -190, 170, '#ff8a2a', 0.55 * heat * f);
    g.fillStyle = mix('#2a0c04', '#ffb04a', heat * f); g.beginPath(); g.ellipse(0, -190, 62, 16, 0, 0, TAU); g.fill();
    g.restore();
  }
  function photo(g, x, y, w, h, t, o = {}) {                   // an old photograph: two friends by a tandoor, as silhouettes
    g.save(); g.translate(x, y); g.rotate(o.rot ?? -0.035);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(-w / 2 + 18, -h / 2 + 24, w, h);
    const r0 = mulberry32(9); g.fillStyle = '#e8dec6'; g.beginPath();                         // the deckled border
    for (let i = 0; i <= 60; i++) { const u = i / 60; g.lineTo(-w / 2 + u * w, -h / 2 + (r0() - 0.5) * 6); }
    for (let i = 0; i <= 90; i++) { const u = i / 90; g.lineTo(w / 2 + (r0() - 0.5) * 6, -h / 2 + u * h); }
    for (let i = 0; i <= 60; i++) { const u = i / 60; g.lineTo(w / 2 - u * w, h / 2 + (r0() - 0.5) * 6); }
    for (let i = 0; i <= 90; i++) { const u = i / 90; g.lineTo(-w / 2 + (r0() - 0.5) * 6, h / 2 - u * h); }
    g.closePath(); g.fill();
    const iw = w - 60, ih = h - 60 - 90, ix = -iw / 2, iy = -h / 2 + 30;
    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    let gr = g.createLinearGradient(0, iy, 0, iy + ih); gr.addColorStop(0, '#5e4a33'); gr.addColorStop(0.62, '#8c7350'); gr.addColorStop(0.63, '#4a3a28'); gr.addColorStop(1, '#2e2418');
    g.fillStyle = gr; g.fillRect(ix, iy, iw, ih);
    g.strokeStyle = 'rgba(40,28,16,0.35)'; g.lineWidth = 2;                                   // brick courses
    for (let yy = iy + 24; yy < iy + ih * 0.62; yy += 34) { g.beginPath(); g.moveTo(ix, yy); g.lineTo(ix + iw, yy); g.stroke(); for (let xx = ix + ((yy / 34) % 2) * 40; xx < ix + iw; xx += 80) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 34); g.stroke(); } }
    tandoor(g, 0, iy + ih * 0.7, ih / 560, t, 0.8);
    man(g, -iw * 0.24, iy + ih * 0.98, ih / 600, { c: '#2b2016' });
    man(g, iw * 0.24, iy + ih * 0.98, ih / 640, { c: '#2b2016', flip: true, cap: true });
    gr = g.createRadialGradient(0, iy + ih / 2, ih * 0.2, 0, iy + ih / 2, ih * 0.8); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(30,18,8,0.6)'); g.fillStyle = gr; g.fillRect(ix, iy, iw, ih);
    const r = mulberry32(400 + Math.round(t * 12)); g.strokeStyle = 'rgba(240,225,190,0.25)'; g.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { const sx = ix + r() * iw; g.beginPath(); g.moveTo(sx, iy); g.lineTo(sx + (r() - 0.5) * 20, iy + ih); g.stroke(); }
    for (let k = 0; k < 16; k++) { g.fillStyle = `rgba(20,12,6,${(0.2 + r() * 0.3).toFixed(2)})`; g.beginPath(); g.arc(ix + r() * iw, iy + r() * ih, 1 + r() * 2.5, 0, TAU); g.fill(); }
    g.restore();
    g.fillStyle = 'rgba(120,80,30,0.14)'; g.fillRect(-w / 2, -h / 2, w, h);                 // the paper has yellowed
    font(g, 40, 700, 'normal', 'Mono'); g.textAlign = 'center';
    if ((o.l ?? 0) > 0) { g.save(); g.globalAlpha *= o.l; g.fillStyle = '#3a2a18'; g.fillText('K.L. GUJRAL', -iw * 0.24, h / 2 - 38); g.restore(); }
    if ((o.r ?? 0) > 0) { g.save(); g.globalAlpha *= o.r; g.fillStyle = '#3a2a18'; g.fillText('K.L. JAGGI', iw * 0.24, h / 2 - 38); g.restore(); }
    g.restore();
  }

  // ------------------------------------------------------------------ 1947: the train; Moti Mahal; the dining room
  function wheel(g, x, y, r, t) { g.save(); g.translate(x, y); g.rotate(t * 7); g.fillStyle = '#140b06'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(150,100,60,0.55)'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(k * PI / 2) * r * 0.85, Math.sin(k * PI / 2) * r * 0.85); g.stroke(); } g.restore(); }
  function train(g, x, y, s, t) {                              // a steam train heading right; (x, y) = the engine's nose on the rails
    g.save(); g.translate(x, y); g.scale(s, s); const ink = '#140b06'; g.fillStyle = ink;
    for (let c = 0; c < 4; c++) {
      const cx = -480 - c * 330;
      rr(g, cx - 150, -150, 300, 118, 10); g.fill(); g.fillRect(cx - 156, -164, 312, 16);
      for (let d = -110; d <= 110; d += 55) { g.fillStyle = 'rgba(255,186,104,0.8)'; g.fillRect(cx + d - 15, -130, 30, 32); g.fillStyle = ink; }
      wheel(g, cx - 92, -24, 24, t); wheel(g, cx + 92, -24, 24, t); g.fillStyle = ink; g.fillRect(cx + 150, -70, 34, 10);
    }
    g.fillRect(-310, -206, 124, 176); g.fillRect(-322, -220, 148, 18);
    rr(g, -196, -154, 196, 114, 52); g.fill(); g.fillRect(-64, -236, 36, 96); g.fillRect(-74, -244, 56, 14);
    g.beginPath(); g.moveTo(0, -44); g.lineTo(44, -6); g.lineTo(0, -6); g.closePath(); g.fill();
    wheel(g, -256, -36, 40, t); wheel(g, -152, -36, 40, t); wheel(g, -58, -28, 28, t);
    g.fillStyle = 'rgba(255,214,140,0.95)'; g.beginPath(); g.arc(-4, -120, 12, 0, TAU); g.fill(); glow(g, -4, -120, 70, '#ffcf80', 0.35);
    g.restore();
  }
  function facade(g, t, o = {}) {                              // Moti Mahal, Daryaganj, 1947 (our drawing): an arcaded front at dusk
    const sk = g.createLinearGradient(0, 0, 0, 900); sk.addColorStop(0, '#1b1230'); sk.addColorStop(1, '#4a2a2a'); g.fillStyle = sk; g.fillRect(-400, -400, W + 800, 1400);
    g.fillStyle = '#2a1a12'; g.fillRect(70, 250, 940, 820);                                    // the building
    g.fillStyle = '#3a2418'; g.fillRect(70, 250, 940, 18); g.fillRect(70, 560, 940, 14);
    for (let i = 0; i < 4; i++) {                                                               // upper windows, arched
      const wx = 150 + i * 225; g.fillStyle = 'rgba(255,190,110,0.55)'; g.beginPath(); g.moveTo(wx, 500); g.lineTo(wx, 360); g.arc(wx + 55, 360, 55, PI, TAU); g.lineTo(wx + 110, 500); g.closePath(); g.fill();
      g.strokeStyle = '#1a0f09'; g.lineWidth = 6; g.beginPath(); g.moveTo(wx + 55, 305); g.lineTo(wx + 55, 500); g.moveTo(wx, 420); g.lineTo(wx + 110, 420); g.stroke();
    }
    const kS = o.sign ?? 1;                                                                     // the signboard
    g.save(); g.globalAlpha *= kS; g.fillStyle = '#7a1a10'; rr(g, 150, 590, 780, 130, 10); g.fill(); g.strokeStyle = '#d6a85a'; g.lineWidth = 6; rr(g, 150, 590, 780, 130, 10); g.stroke();
    font(g, 104, 700, 'condensed'); g.textAlign = 'center'; g.shadowColor = 'rgba(255,210,140,0.6)'; g.shadowBlur = 24 * kS; g.fillStyle = CREAM; g.fillText('MOTI MAHAL', 540, 690); g.restore();
    for (let i = 0; i < 3; i++) {                                                               // three arches, lit
      const ax = 130 + i * 290, aw = 240, ay = 760; g.fillStyle = i === 1 ? '#ffb05a' : 'rgba(255,176,90,0.75)';
      g.beginPath(); g.moveTo(ax, 1070); g.lineTo(ax, ay + 110); g.arc(ax + aw / 2, ay + 110, aw / 2, PI, TAU); g.lineTo(ax + aw, 1070); g.closePath(); g.fill();
    }
    tandoor(g, 540, 1070, 0.9, t, 1); bust(g, 470, 1070, 1.1, '#2a1208'); bust(g, 800, 1080, 1.0, '#1e0d06');
    for (let k = 0; k <= 22; k++) { const u = k / 22, lx = lerp(90, 990, u), ly = 252 + 30 * Math.sin(PI * u); g.fillStyle = rgba('#ffd27a', 0.6 + 0.4 * Math.sin(t * 3 + k * 1.3)); g.beginPath(); g.arc(lx, ly, 4, 0, TAU); g.fill(); }
    g.fillStyle = '#100906'; g.fillRect(-400, 1070, W + 800, 900);
    man(g, 250, 1150, 0.42, { c: '#0b0604' }); man(g, 330, 1160, 0.44, { c: '#0b0604', flip: true }); man(g, 900, 1150, 0.4, { c: '#0b0604', cap: true });
  }
  function dining(g, t, o = {}) {                              // inside, the 1950s: a full room; one chair with a white cap and a red rose
    wall(g, '#1a0d08', '#3a1d0e', [540, 380, 700, '#ffb060', 0.25]);
    for (let i = 0; i < 3; i++) { const ax = 140 + i * 300; g.fillStyle = 'rgba(255,190,110,0.12)'; g.beginPath(); g.moveTo(ax, 700); g.lineTo(ax, 380); g.arc(ax + 100, 380, 100, PI, TAU); g.lineTo(ax + 200, 700); g.closePath(); g.fill(); }
    for (let i = 0; i < 3; i++) { glow(g, 240 + i * 300, 300, 120, '#ffcf80', 0.5); g.fillStyle = '#ffe2a8'; g.beginPath(); g.arc(240 + i * 300, 300, 10, 0, TAU); g.fill(); }
    const tableAt = (x, y, s) => { g.fillStyle = '#efe6d6'; g.beginPath(); g.ellipse(x, y, 150 * s, 40 * s, 0, 0, TAU); g.fill(); g.fillStyle = '#d8ccb8'; g.fillRect(x - 150 * s, y, 300 * s, 70 * s); };
    for (const [x, y, s] of [[200, 690, 0.6], [540, 690, 0.6], [880, 690, 0.6]]) { bust(g, x - 70, y - 10, 0.75); bust(g, x + 70, y - 10, 0.75); tableAt(x, y, s); }
    for (const [x, y, s] of [[300, 840, 0.85], [800, 840, 0.85]]) { bust(g, x - 90, y - 10, 1.0, '#140a05'); bust(g, x + 95, y - 12, 1.0, '#140a05'); tableAt(x, y, s); }
    const cl = g.createLinearGradient(0, 930, 0, 1300); cl.addColorStop(0, '#e9dfcc'); cl.addColorStop(1, '#6a5f50'); g.fillStyle = cl; g.fillRect(-400, 930, W + 800, 600); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(-400, 930, W + 800, 6);   // the front table's cloth
    bowl(g, 380, 960, 110, t, { steamA: 0.8 });
    const kC = o.cap ?? 0;                                                                      // the cap and the rose, on "Nehru"
    if (kC > 0) {
      g.save(); g.globalAlpha *= kC; g.translate(740, 985 - 30 * (1 - kC));
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(0, 6, 120, 18, 0, 0, TAU); g.fill();
      g.fillStyle = '#f6f3ec'; g.beginPath(); g.moveTo(-110, 0); g.lineTo(-92, -70); g.quadraticCurveTo(0, -96, 92, -70); g.lineTo(110, 0); g.closePath(); g.fill();
      g.strokeStyle = '#d8d2c4'; g.lineWidth = 4; g.beginPath(); g.moveTo(-104, -22); g.lineTo(104, -22); g.stroke(); g.beginPath(); g.moveTo(-60, -84); g.quadraticCurveTo(0, -60, 60, -84); g.stroke();
      g.translate(150, -6); g.strokeStyle = '#2f6a22'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(60, -10); g.stroke();
      g.fillStyle = '#c4161c'; g.beginPath(); g.arc(-6, -4, 20, 0, TAU); g.fill(); g.fillStyle = '#e8303a'; g.beginPath(); g.arc(-10, -8, 11, 0, TAU); g.fill();
      g.restore();
    }
  }

  // ------------------------------------------------------------------ today: rival restaurants; the court; the lawsuit
  function store(g, x0, x1, name, fam, col, t, o = {}) {       // a restaurant front (our drawing), filling x0..x1
    const w = x1 - x0, cx = (x0 + x1) / 2;
    g.fillStyle = mix(col, '#000000', 0.55); g.fillRect(x0, 200, w, 900);
    g.fillStyle = col; g.fillRect(x0 + 20, 330, w - 40, 150);
    font(g, Math.min(96, (w - 80) / name.length * 1.9), 700, 'condensed'); g.textAlign = 'center'; g.shadowColor = rgba(CREAM, 0.5); g.shadowBlur = 18; g.fillStyle = CREAM; g.fillText(name, cx, 440); g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,196,120,0.75)'; rr(g, x0 + 50, 540, w - 100, 380, 10); g.fill();
    g.fillStyle = mix(col, '#000000', 0.7); g.fillRect(cx - 4, 540, 8, 380); g.fillRect(x0 + 50, 720, w - 100, 8);
    bust(g, x0 + w * 0.32, 920, 1.0, '#1a0e08'); bust(g, x0 + w * 0.7, 925, 0.95, '#1a0e08');
    g.fillStyle = '#0f0805'; g.fillRect(x0, 1000, w, 200);
    mlabel(g, fam, cx, 520, o.fa ?? 1, { size: 24, c: INK, align: 'center', bg: 'rgba(13,9,7,0.75)' });
  }
  function courtroom(g, t) {                                   // the bench, panelled walls, the scales above
    wall(g, '#0f1218', '#1d222b', [540, 300, 600, '#c9a25a', 0.12]);
    for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 3; g.strokeRect(40 + i * 170, 220, 150, 420); }
    g.fillStyle = '#4a2a16'; g.fillRect(150, 640, 780, 260); g.fillStyle = '#5e3820'; g.fillRect(130, 620, 820, 34);   // the bench
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) g.strokeRect(190 + i * 180, 690, 150, 170);
    g.fillStyle = '#2a1408'; rr(g, 470, 430, 140, 200, 18); g.fill();                         // the empty chair
    scalesIcon(g, 540, 330, 0.9);
  }
  function scalesIcon(g, x, y, s) {                            // the scales of justice, in brass
    g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = '#c9a25a'; g.fillStyle = '#c9a25a'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(0, -60); g.lineTo(0, 60); g.moveTo(-90, -40); g.lineTo(90, -40); g.stroke();
    for (const sx of [-90, 90]) { g.beginPath(); g.moveTo(sx, -40); g.lineTo(sx - 30, 20); g.moveTo(sx, -40); g.lineTo(sx + 30, 20); g.stroke(); g.beginPath(); g.ellipse(sx, 22, 36, 9, 0, 0, PI); g.fill(); }
    g.fillRect(-30, 58, 60, 10); g.beginPath(); g.arc(0, -66, 9, 0, TAU); g.fill(); g.restore();
  }
  function pages(g, x, y, n, t, o = {}) {                      // a stack of n sheets standing on (x, y), drawn as layers
    const per = 0.25, hgt = n * per, r = mulberry32(31);
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(0, 6, 210, 20, 0, 0, TAU); g.fill();
    const sway = (o.sway ?? 0) * Math.sin(t * 2.2) * hgt / 900;
    for (let k = 0; k < Math.ceil(n / 25); k++) {
      const yy = -k * 25 * per, dx = (r() - 0.5) * 10 + sway * k * 25 * per / Math.max(1, hgt);
      g.fillStyle = k % 2 ? '#ece6da' : '#e2dbcd'; g.fillRect(-190 + dx, yy - 25 * per, 380, 25 * per + 0.6);
      g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(-190 + dx, yy - 1, 380, 1);
    }
    g.restore();
    return hgt;
  }

  // ------------------------------------------------------------------ the two versions: kitchens, clocks, crowds, scales, calendars
  function clockFace(g, x, y, r, hh, mm, a = 1) {
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.fillStyle = '#efe6d6'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = r * 0.08; g.stroke();
    g.fillStyle = '#3a2a1a'; for (let k = 0; k < 12; k++) { const a2 = k / 12 * TAU; g.fillRect(Math.cos(a2) * r * 0.78 - 3, Math.sin(a2) * r * 0.78 - 3, 6, 6); }
    const ha = ((hh % 12) + mm / 60) / 12 * TAU - PI / 2, ma = mm / 60 * TAU - PI / 2;
    g.strokeStyle = '#1a120a'; g.lineCap = 'round'; g.lineWidth = r * 0.09; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ha) * r * 0.5, Math.sin(ha) * r * 0.5); g.stroke();
    g.lineWidth = r * 0.06; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ma) * r * 0.75, Math.sin(ma) * r * 0.75); g.stroke(); g.restore();
  }
  function pot(g, x, y, R, t, o = {}) {                        // a cooking pot of gravy, seen from above-front (bowl() without the garnish)
    bowl(g, x, y, R, t, { melt: o.melt ?? 0.9, steamA: o.steamA ?? 0.8 });
  }
  function tray(g, x, y, w, n, t, o = {}) {                    // a steel tray of tandoori chicken pieces
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(0, 14, w * 0.55, 24, 0, 0, TAU); g.fill();
    const gr = g.createLinearGradient(0, -30, 0, 20); gr.addColorStop(0, '#d8dde2'); gr.addColorStop(1, '#7a8088'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, w / 2, 40, 0, 0, TAU); g.fill();
    g.fillStyle = '#a4aab2'; g.beginPath(); g.ellipse(0, -4, w / 2 - 16, 30, 0, 0, TAU); g.fill();
    g.restore();
    for (let i = 0; i < n; i++) { const off = o.off ? o.off(i) : [0, 0, 1]; if (off[2] <= 0) continue; piece(g, x + (i - (n - 1) / 2) * (w / (n + 0.6)) + off[0], y - 14 + off[1], 46, 28, (i * 0.7) % 1 - 0.5, 90 + i, { dry: o.dry }); }
  }
  function balance(g, cx, cy, tilt, t, o = {}) {               // a big balance: a beam on a post, two pans on chains; o.left / o.right draw their loads
    const L = 300, a = tilt * 0.22;
    g.save(); g.strokeStyle = '#c9a25a'; g.fillStyle = '#c9a25a'; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy - 20); g.lineTo(cx, cy + 560); g.stroke(); g.fillRect(cx - 120, cy + 556, 240, 22);
    const ends = [-1, 1].map((sd) => [cx + Math.cos(a) * L * sd, cy + Math.sin(a) * L * sd]);
    g.beginPath(); g.moveTo(ends[0][0], ends[0][1]); g.lineTo(ends[1][0], ends[1][1]); g.stroke();
    g.beginPath(); g.arc(cx, cy, 16, 0, TAU); g.fill();
    ends.forEach(([ex, ey], i) => {
      const py = ey + 250; g.lineWidth = 3; g.strokeStyle = 'rgba(214,170,96,0.8)';
      g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex - 110, py); g.moveTo(ex, ey); g.lineTo(ex + 110, py); g.stroke();
      const gr = g.createLinearGradient(0, py - 10, 0, py + 40); gr.addColorStop(0, '#f2cf86'); gr.addColorStop(1, '#8a5e24');
      g.fillStyle = gr; g.beginPath(); g.ellipse(ex, py, 130, 22, 0, 0, PI); g.lineTo(ex - 130, py); g.fill();
      g.fillStyle = '#e8c070'; g.beginPath(); g.ellipse(ex, py, 130, 16, 0, 0, TAU); g.fill();
      const fn = i === 0 ? o.left : o.right; if (fn) fn(ex, py);
    });
    g.restore();
  }
  function calendar(g, x, y, s, top, big2, a = 1, o = {}) {    // a wall calendar page: the month on top, a big number below
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(o.rot ?? 0); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(-150, -180, 316, 380);
    g.fillStyle = '#f2ece0'; g.fillRect(-160, -190, 320, 380); g.fillStyle = '#b8261a'; g.fillRect(-160, -190, 320, 90);
    font(g, 54, 700, 'condensed'); g.textAlign = 'center'; g.fillStyle = '#fff4e4'; g.fillText(top, 0, -128);
    font(g, 200, 700, 'condensed'); g.fillStyle = '#2a1f16'; g.fillText(big2, 0, 130);
    g.fillStyle = '#3a2a1a'; for (const hx of [-90, 90]) { g.beginPath(); g.arc(hx, -190, 10, 0, TAU); g.fill(); }
    g.restore();
  }
  function stampMark(g, x, y, s, text, col, k, rot = -0.14) {  // a rubber-stamp mark that slams down (k 0..1)
    if (k <= 0) return;
    const sc = s * (1 + 0.6 * (1 - eo(clamp(k / 0.5))));
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.globalAlpha *= clamp(k * 3);
    font(g, 86, 700, 'condensed'); const w = g.measureText(text).width + 50;
    g.fillStyle = 'rgba(13,9,7,0.55)'; g.fillRect(-w / 2, -62, w, 112); g.strokeStyle = col; g.lineWidth = 9; g.strokeRect(-w / 2, -62, w, 112);
    g.textAlign = 'center'; g.fillStyle = col; g.fillText(text, 0, 28); g.restore();
  }

  // ------------------------------------------------------------------ the shots
  function shBowl(g, t) {                                      // 0 · butter chicken was invented by Kundan Lal
    const T = times(), c = shotCam(g, t, 0, { push: 0.06, oy: 700 });
    wall(g, '#140b07', '#2e180c', [540, 500, 760, '#ff9a48', 0.22]); table(g, 830);
    bowl(g, 540, 700, 330, t, { melt: 0.2 + t * 0.12 });
    const kP = hit(t, T.kundan1 - 0.08, 'heavy');
    plate(g, 540, 1075 + 260 * (1 - kP), 0.82, 'KUNDAN LAL', { a: clamp(kP * 3), shine: clamp((t - T.kundan1) / 0.9) });
    eyebrow(g, 'BUTTER CHICKEN · MURGH MAKHANI', t, -0.4);
  }
  function shTwo(g, t) {                                       // 1 · there's just one problem: there were two of them
    const T = times(); shotCam(g, t, 1, { push: 0.03, oy: 900, kicks: [[T.two - 0.05, 10]] });
    wall(g, '#140b07', '#2e180c', [540, 520, 760, '#ff9a48', 0.18]); table(g, 830);
    bowl(g, 540, 640, 250, t, { melt: 0.5 });
    const k2 = hit(t, T.two - 0.06, 'heavy'), dx = 300 * eio(clamp(k2));
    plate(g, 540 - dx, 1075, 0.7, 'KUNDAN LAL', { shine: 0.5 + 0.5 * Math.sin(t) });
    if (k2 > 0.01) plate(g, 540 + dx, 1075, 0.7, 'KUNDAN LAL', { a: clamp(k2 * 2.5), shine: clamp((t - T.two) / 0.8) });
    screen(g); mlabel(g, '×2', 540, 900, pop(t, T.two + 0.1), { size: 44, c: ACC, align: 'center', bg: 'rgba(13,9,7,0.7)' });
  }
  function shPhoto(g, t) {                                     // 2 · Kundan Lal Gujral and Kundan Lal Jaggi: two friends from Peshawar
    const T = times(); shotCam(g, t, 2, { push: 0.07, oy: 640, drift: 3 });
    wall(g, '#120b07', '#24150c', [540, 640, 700, '#ffb070', 0.14]);
    photo(g, 540, 720, 800, 800, t, { l: pop(t, T.gujral - 0.05), r: pop(t, T.jaggi - 0.05) });
    const fl = 1 - clamp((t - T.cut[2]) / 0.35); if (fl > 0) { screen(g); g.fillStyle = `rgba(255,248,236,${(0.85 * fl).toFixed(3)})`; g.fillRect(0, 0, W, H); }
    eyebrow(g, 'PESHAWAR · THE 1930s (OUR DRAWING)', t, T.cut[2] + 0.05);
  }
  function shTrain(g, t) {                                     // 3 · 1947: Partition brought them to Delhi
    const T = times(), u = clamp((t - T.cut[3]) / Math.max(1, T.cut[4] - T.cut[3])); shotCam(g, t, 3, { push: 0.02, oy: 760, drift: 2 });
    const sk = g.createLinearGradient(0, 0, 0, 900); sk.addColorStop(0, '#24152e'); sk.addColorStop(0.6, '#7a3a26'); sk.addColorStop(1, '#c8682e'); g.fillStyle = sk; g.fillRect(-400, -400, W + 800, 1400);
    glow(g, 540, 860, 520, '#ffb060', 0.45);
    g.fillStyle = '#1a0e08'; g.fillRect(-400, 860, W + 800, 1100);
    g.strokeStyle = '#3a2416'; g.lineWidth = 6; g.beginPath(); g.moveTo(-400, 872); g.lineTo(W + 400, 872); g.stroke();
    const nx = lerp(-180, 1260, u);                                                             // the engine's nose
    for (let k = 0; k < 16; k++) {                                                              // its smoke, puffed every 0.2 s, drifting back and up
      const born = Math.floor((t - T.cut[3]) / 0.2) * 0.2 - k * 0.2 + T.cut[3], age = t - born; if (age < 0 || age > 3) continue;
      const bu = clamp((born - T.cut[3]) / Math.max(1, T.cut[4] - T.cut[3])), bx = lerp(-180, 1260, bu) - 46 * 0.62;
      g.save(); g.filter = 'blur(10px)'; g.fillStyle = `rgba(70,52,46,${(0.38 * (1 - age / 3)).toFixed(3)})`; g.beginPath(); g.arc(bx - age * 90, 872 - 150 - age * 70, 22 + age * 34, 0, TAU); g.fill(); g.restore();
    }
    train(g, nx, 872, 0.62, t);
    screen(g);
    for (const [x, s] of [[120, 'PESHAWAR'], [960, 'DELHI']]) { mlabel(g, s, x, 960, 1, { size: 28, c: INK, align: 'center', bg: 'rgba(13,9,7,0.7)' }); }
    big(g, '1947', 540, 560, 260, rgba(CREAM, 0.9), { align: 'center', a: pop(t, T.cut[3] + 0.05, 0.4), glow: 'rgba(255,170,90,0.4)' });
    mlabel(g, 'PARTITION', 540, 640, pop(t, T.partition, 0.3), { size: 34, c: INK2, align: 'center' });
  }
  function shFacade(g, t) {                                    // 4 · where they ran one restaurant together: Moti Mahal
    const T = times(); shotCam(g, t, 4, { push: 0.05, oy: 640 });
    facade(g, t, { sign: clamp((t - (T.moti - 0.25)) / 0.25) * 0.85 + 0.15 });
    eyebrow(g, 'DARYAGANJ, DELHI · 1947', t, T.cut[4] + 0.05);
    screen(g); mlabel(g, 'GUJRAL + JAGGI · PARTNERS', 540, 1000, pop(t, T.one4 - 0.1), { size: 28, c: BUT, align: 'center', bg: 'rgba(13,9,7,0.75)' });
  }
  function shDining(g, t) {                                    // 5 · its butter chicken got so famous, even Nehru came to eat
    const T = times(); shotCam(g, t, 5, { push: 0.05, oy: 900 });
    dining(g, t, { cap: pop(t, T.nehru - 0.1, 0.35) });
    screen(g); mlabel(g, 'JAWAHARLAL NEHRU, PRIME MINISTER', 740, 880, pop(t, T.nehru + 0.15), { size: 26, c: INK, align: 'center', bg: 'rgba(13,9,7,0.75)' });
    eyebrow(g, 'MOTI MAHAL · THE 1950s', t, T.cut[5] + 0.05);
  }
  function shRivals(g, t) {                                    // 6 · today, their families run rival restaurants
    const T = times(), kV = hit(t, T.rival - 0.06, 'heavy'); shotCam(g, t, 6, { push: 0.03, oy: 700, kicks: [[T.rival - 0.04, 12]] });
    wall(g, '#0d0907', '#1a120c');
    const sep = 30 * (1 - eo(clamp((t - T.cut[6]) / 0.4)));
    store(g, 40 - sep, 530, 'MOTI MAHAL', 'THE GUJRAL FAMILY', '#8a1c12', t, { fa: pop(t, T.families - 0.1) });
    store(g, 550, 1040 + sep, 'DARYAGANJ', 'THE JAGGI FAMILY', '#1f5a52', t, { fa: pop(t, T.families + 0.05) });
    g.fillStyle = '#0d0907'; g.fillRect(530, 150, 20, 1000);
    if (kV > 0.01) { g.save(); g.translate(540, 760); g.scale(1 + 0.5 * (1 - kV), 1 + 0.5 * (1 - kV)); g.globalAlpha = clamp(kV * 3); g.fillStyle = '#0d0907'; g.beginPath(); g.arc(0, 0, 96, 0, TAU); g.fill(); g.strokeStyle = ACC; g.lineWidth = 8; g.stroke(); font(g, 100, 700, 'condensed'); g.textAlign = 'center'; g.fillStyle = ACC; g.fillText('VS', 0, 36); g.restore(); }
    eyebrow(g, 'TODAY · TWO CHAINS', t, T.cut[6] + 0.05);
  }
  function shCourt(g, t) {                                     // 7 · since 2024, in court over who invented butter chicken
    const T = times(); shotCam(g, t, 7, { push: 0.05, oy: 700, kicks: [[T.court7 - 0.05, 9]] });
    courtroom(g, t);
    plate(g, 270, 1080, 0.55, 'GUJRAL', { shine: 0.3 }); plate(g, 810, 1080, 0.55, 'JAGGI', { shine: 0.7 });
    const kB = pop(t, T.bc7 - 0.1, 0.35);
    if (kB > 0) { bowl(g, 540, 600 - 40 * (1 - kB), 120, t, { steamA: kB }); }
    screen(g);
    mlabel(g, 'EXHIBIT A', 540, 520, pop(t, T.bc7 + 0.2), { size: 26, c: BUT, align: 'center', bg: 'rgba(13,9,7,0.75)', edge: BUT });
    mlabel(g, 'DELHI HIGH COURT · CS(COMM) 26/2024', 540, 960, pop(t, T.court7 - 0.05), { size: 26, c: INK, align: 'center', bg: 'rgba(13,9,7,0.8)' });
    mlabel(g, 'RUPA GUJRAL & ORS. v. DARYAGANJ HOSPITALITY PVT. LTD.', 540, 1000, pop(t, T.court7 + 0.1), { size: 20, c: INK2, align: 'center' });
    eyebrow(g, 'SINCE JANUARY 2024', t, T.y2024 - 0.1);
  }
  function shStack(g, t) {                                     // 8 · the lawsuit is 2,752 pages long
    const T = times(), u = eio(clamp((t - (T.n2 - 0.15)) / Math.max(0.6, T.pages - T.n2 + 0.1)));
    const n = Math.round(2752 * u); shotCam(g, t, 8, { push: 0.02, oy: 1000, kicks: [[T.e8 + 0.06, 7]] });
    courtroom(g, t); g.fillStyle = 'rgba(13,9,7,0.55)'; g.fillRect(-400, -400, W + 800, 1600);
    const hgt = pages(g, 470, 1100, Math.max(25, n), t, { sway: 1 });
    bowl(g, 810, 1050, 95, t, { steamA: 0.7 });
    screen(g);
    big(g, n.toLocaleString('en-IN'), 470, Math.max(400, 1100 - hgt - 60), 120, BUT, { align: 'center', glow: 'rgba(255,181,46,0.4)' });
    mlabel(g, 'PAGES', 470, Math.max(445, 1100 - hgt - 15), pop(t, T.n2), { size: 30, c: INK, align: 'center', bg: 'rgba(13,9,7,0.6)' });
    mlabel(g, 'THE LAWSUIT · SOURCE: NPR, REUTERS', 540, 1160, pop(t, T.lawsuit), { size: 22, c: INK2, align: 'center' });
  }
  function shGujral(g, t) {                                    // 9 · the Gujrals say: Peshawar; leftover chicken, saved in a gravy for the next day
    const T = times(); shotCam(g, t, 9, { push: 0.04, oy: 760 });
    const day = eio(clamp((t - (T.next - 0.1)) / 0.5));
    wall(g, mix('#0c0a14', '#2a1a0c', day), mix('#1a1420', '#4a2a12', day));
    g.fillStyle = mix('#1a2440', '#ffd890', day); g.fillRect(700, 300, 220, 260); g.strokeStyle = '#1a0f08'; g.lineWidth = 10; g.strokeRect(700, 300, 220, 260); g.beginPath(); g.moveTo(810, 300); g.lineTo(810, 560); g.stroke();
    if (day < 0.5) { g.fillStyle = rgba('#f4f0e0', 1 - 2 * day); g.beginPath(); g.arc(770, 360, 24, 0, TAU); g.fill(); } else { glow(g, 810, 430, 300, '#ffd890', (day - 0.5) * 0.8); g.fillStyle = rgba('#fff3c4', (day - 0.5) * 2); g.beginPath(); g.arc(860, 470, 34, 0, TAU); g.fill(); }
    clockFace(g, 200, 380, 70, day > 0.5 ? 9 : 11, day > 0.5 ? 0 : 40);
    table(g, 830); tandoor(g, 210, 860, 0.9, t, 0.35);
    const kL = pop(t, T.leftover - 0.1), drop = clamp((t - (T.saved - 0.1)) / 0.6);
    tray(g, 470, 900, 380, 4, t, { dry: true, off: (i) => { const d = clamp(drop * 1.6 - i * 0.2); return [lerp(0, 330 - (470 + (i - 1.5) * 82), eio(d)), -180 * Math.sin(PI * d) + 40 * eio(d), 1 - clamp((d - 0.85) / 0.15)]; } });
    pot(g, 800, 880, 150, t, { steamA: 0.3 + 0.7 * clamp(drop * 2) });
    screen(g);
    mlabel(g, "THE GUJRAL FAMILY'S ACCOUNT", 540, 400, pop(t, T.gujrals - 0.1), { size: 28, c: BUT, align: 'center', bg: 'rgba(13,9,7,0.8)', edge: BUT });
    mlabel(g, 'PESHAWAR', 470, 470, pop(t, T.pesh9 - 0.05), { size: 26, c: INK, align: 'center', bg: 'rgba(13,9,7,0.7)' });
    mlabel(g, 'LEFTOVER, DRYING OUT', 470, 1010, kL * (1 - clamp(drop * 3)), { size: 24, c: INK2, align: 'center', bg: 'rgba(13,9,7,0.7)' });
    mlabel(g, 'THE NEXT DAY', 810, 610, day, { size: 26, c: INK, align: 'center', bg: 'rgba(13,9,7,0.7)' });
  }
  function shJaggi(g, t) {                                     // 10 · the Jaggis say: Delhi; late guests, and too little chicken
    const T = times(); shotCam(g, t, 10, { push: 0.04, oy: 760 });
    wall(g, '#120a07', '#2e1a0e', [540, 500, 700, '#ffb060', 0.18]);
    g.fillStyle = '#1a0e08'; g.fillRect(620, 300, 300, 560);                                   // the door, opening on "late guests"
    const kD = eio(clamp((t - (T.late - 0.2)) / 0.45));
    g.fillStyle = '#0a0604'; g.fillRect(640, 320, 260, 540); g.fillStyle = 'rgba(255,200,120,0.15)'; g.fillRect(640, 320, 260, 540);
    g.fillStyle = '#5a3218'; g.fillRect(640, 320, 260 * (1 - 0.8 * kD), 540);
    const kG = clamp((t - (T.guests - 0.25)) / 0.9);
    for (let i = 0; i < 7; i++) { const u = clamp(kG * 1.6 - i * 0.1); if (u <= 0) continue; man(g, lerp(780, 160 + i * 92, eo(u)), 880, 0.36 + (i % 3) * 0.02, { c: '#120905', cap: i % 3 === 1 }); }
    clockFace(g, 230, 380, 70, 10, 55);
    table(g, 860);
    const kL = pop(t, T.little10 - 0.1), kS = clamp((t - (T.chicken10 + 0.1)) / 0.7);
    g.fillStyle = '#efe6d6'; g.beginPath(); g.ellipse(400, 990, 200, 54, 0, 0, TAU); g.fill();
    for (let i = 0; i < 3; i++) piece(g, 330 + i * 70, 978, 44, 26, i * 0.4, 120 + i);
    if (kS > 0) { g.save(); g.globalAlpha = clamp(kS * 2); g.fillStyle = '#e8622a'; g.beginPath(); g.ellipse(400, 992, 190 * eo(kS), 48 * eo(kS), 0, 0, TAU); g.fill(); g.restore(); for (let i = 0; i < 3; i++) piece(g, 330 + i * 70, 980, 44, 26, i * 0.4, 120 + i, { sub: true }); }
    screen(g);
    mlabel(g, "THE JAGGI FAMILY'S ACCOUNT", 540, 400, pop(t, T.jaggis - 0.1), { size: 28, c: BUT, align: 'center', bg: 'rgba(13,9,7,0.8)', edge: BUT });
    mlabel(g, 'DELHI', 780, 470, pop(t, T.delhi10 - 0.05), { size: 26, c: INK, align: 'center', bg: 'rgba(13,9,7,0.7)' });
    mlabel(g, 'TOO LITTLE', 400, 1110, kL, { size: 28, c: ACC, align: 'center', bg: 'rgba(13,9,7,0.75)' });
  }
  function shScales(g, t) {                                    // 11 · too much chicken, or too little; either way, the root cause was leftovers
    const T = times(); shotCam(g, t, 11, { push: 0.03, oy: 700 });
    wall(g, '#120a07', '#2a170c', [540, 500, 700, '#ffb060', 0.14]);
    const wob = Math.sin((t - T.cut[11]) * 3.2) * Math.exp(-(t - T.cut[11]) * 0.9);
    let tilt = lerp(1, -1, eio(clamp((t - (T.little11 - 0.2)) / 0.5))) * 0.8 + 0.25 * wob;
    const kE = eio(clamp((t - (T.either - 0.1)) / 0.7)); tilt = lerp(tilt, 0, kE);
    const pour = eio(clamp((t - (T.root - 0.35)) / 0.75));
    balance(g, 540, 340, tilt, t, {
      left: (x, y) => { for (let i = 0; i < 6; i++) { const d = clamp(pour * 1.4 - i * 0.07); if (d >= 1) continue; const sx = x - 70 + (i % 3) * 70, sy = y - 18 - Math.floor(i / 3) * 30; piece(g, lerp(sx, 515 + (i % 3) * 22, d), lerp(sy, 1005, d) - 170 * Math.sin(PI * d), 38, 24, i + d * 3, 140 + i); } },
      right: (x, y) => { const d = clamp(pour * 1.4 - 0.2); if (d >= 1) return; piece(g, lerp(x, 565, d), lerp(y - 18, 1005, d) - 170 * Math.sin(PI * d), 40, 25, 0.3 + d * 3, 150); },
    });
    if (kE > 0) pot(g, 540, 1020, 130 + 20 * pour, t, { steamA: kE });
    screen(g);
    mlabel(g, 'TOO MUCH', 250, 720, pop(t, T.much - 0.05) * (1 - kE), { size: 30, c: INK, align: 'center', bg: 'rgba(13,9,7,0.7)' });
    mlabel(g, 'TOO LITTLE', 830, 720, pop(t, T.little11 - 0.05) * (1 - kE), { size: 30, c: INK, align: 'center', bg: 'rgba(13,9,7,0.7)' });
    mlabel(g, 'LEFTOVERS', 540, 900, pop(t, T.leftovers - 0.05), { size: 40, c: BUT, align: 'center', bg: 'rgba(13,9,7,0.8)', edge: BUT });
  }
  const DATES = [['JAN 2024', '16'], ['MAY 2024', '29'], ['JUL 2024', '25'], ['MAR 2026', '13'], ['MAY 2026', '18'], ['JUL 2026', '21'], ['SEP 2026', '23'], ['DEC 2026', '3']];   // dates in the court's orders
  function shCalendar(g, t) {                                  // 12 · nearly three years on, the court still hasn't decided
    const T = times(); shotCam(g, t, 12, { push: 0.04, oy: 700, kicks: [[T.e12 + 0.1, 8]] });
    courtroom(g, t); g.fillStyle = 'rgba(13,9,7,0.6)'; g.fillRect(-400, -400, W + 800, 1600);
    const u = clamp((t - (T.cut[12] + 0.1)) / Math.max(0.8, T.court12 - T.cut[12])), k = Math.min(DATES.length - 1, Math.floor(u * (DATES.length - 1) + 0.0001));
    for (let i = 0; i <= k; i++) { const dt = DATES[i]; calendar(g, 540 + (i - k) * 14, 640 + (i - k) * 10, 1.25, dt[0], dt[1], i === k ? 1 : 0.5, { rot: ((i * 0.37) % 0.12) - 0.06 }); }
    stampMark(g, 540, 640, 0.9, 'NO VERDICT', ACC, clamp((t - (T.e12 - 0.07)) / 0.35));   // lands in the gap after "decided.", with its stamp
    screen(g); mlabel(g, 'NEXT HEARING: 3 DEC 2026 · DELHI HC ORDER OF 23 SEP 2026', 540, 1000, pop(t, T.decided + 0.2), { size: 22, c: INK, align: 'center', bg: 'rgba(13,9,7,0.8)' });
  }
  function shCertain(g, t) {                                   // 13 · but whoever wins, one thing is certain
    const T = times(); shotCam(g, t, 13, { push: 0.05, oy: 700 });
    wall(g, '#0c0806', '#1e110a', [540, 520, 620, '#ffcf80', 0.3]);
    g.save(); g.globalCompositeOperation = 'lighter'; const sp = g.createLinearGradient(0, 0, 0, 1100); sp.addColorStop(0, 'rgba(255,214,150,0.16)'); sp.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = sp; g.beginPath(); g.moveTo(470, -100); g.lineTo(610, -100); g.lineTo(1000, 1100); g.lineTo(80, 1100); g.closePath(); g.fill(); g.restore();
    balance(g, 540, 400, 0.18 * Math.sin((t - T.cut[13]) * 2.4) * Math.exp(-(t - T.cut[13]) * 1.1), t, {
      left: (x, y) => plate(g, x, y - 2, 0.42, 'KUNDAN LAL', { sub: 'GUJRAL', subA: 1, shine: 0.4 }),
      right: (x, y) => plate(g, x, y - 2, 0.42, 'KUNDAN LAL', { sub: 'JAGGI', subA: 1, shine: 0.6 }),
    });
  }
  function shFinale(g, t) {                                    // 14 · butter chicken was invented by Kundan Lal (the first line again)
    const T = times(); shotCam(g, t, 14, { push: 0.04, oy: 700, kicks: [[T.kundan14 - 0.05, 8]] });
    wall(g, '#140b07', '#2e180c', [540, 500, 760, '#ff9a48', 0.22]); table(g, 830);
    bowl(g, 540, 700, 330, t, { melt: 0.2 + (t - T.cut[14]) * 0.12 });
    const kM = eio(clamp((t - (T.kundan14 - 0.45)) / 0.45)), sA = 1 - clamp((t - (T.a.s14 + 0.1)) / 0.4);
    plate(g, 540 - 300 * (1 - kM), 1075, lerp(0.7, 0.82, kM), 'KUNDAN LAL', { sub: 'GUJRAL', subA: sA, shine: clamp((t - T.kundan14) / 0.9) });
    if (kM < 1) plate(g, 540 + 300 * (1 - kM), 1075, lerp(0.7, 0.82, kM), 'KUNDAN LAL', { sub: 'JAGGI', subA: sA, a: 1 - kM });
  }
  const SHOTS = [shBowl, shTwo, shPhoto, shTrain, shFacade, shDining, shRivals, shCourt, shStack, shGujral, shJaggi, shScales, shCalendar, shCertain, shFinale];

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) {
      S.g = canvas(root); under(root); S.g2 = canvas(root);       // the scene, the text zone's shade, the labels
      const L = (text, y, size, o = {}) => Object.assign(line(root, text, { x: X0, y, size, ...o }), { tone: o.tone });
      S.L = {
        h0a: L('Butter chicken was', TZ - 16, 112), h0b: L('invented by Kundan Lal.', TZ + 116, 90, { accent: [2, 3], tone: 'butter' }),
        h1a: L('Just one problem:', TZ - 16, 120), h1b: L('there were two.', TZ + 120, 120, { accent: [2], tone: 'red' }),
        h2a: L('Gujral and Jaggi.', TZ - 16, 120, { accent: [0, 2], tone: 'butter' }), h2b: L('Friends from Peshawar.', TZ + 120, 104),
        h3a: L('1947: Partition.', TZ - 16, 120), h3b: L('Delhi. Moti Mahal.', TZ + 120, 116, { accent: [1, 2], tone: 'butter' }),
        h4a: L('So famous,', TZ - 16, 130), h4b: L('even Nehru came.', TZ + 124, 120, { accent: [1], tone: 'butter' }),
        h5a: L('Today:', TZ - 16, 130), h5b: L('rival restaurants.', TZ + 124, 120, { accent: [0], tone: 'red' }),
        h6a: L('Since 2024,', TZ - 16, 130), h6b: L('in court.', TZ + 124, 130, { accent: [1], tone: 'red' }),
        h7a: L('The lawsuit:', TZ - 16, 130), h7b: L('2,752 pages.', TZ + 124, 130, { accent: [0], tone: 'butter' }),
        h8a: L('The Gujrals: Peshawar.', TZ - 16, 100, { accent: [1, 2], tone: 'butter' }), h8b: L('Leftovers, saved for later.', TZ + 112, 92),
        h9a: L('The Jaggis: Delhi.', TZ - 16, 112, { accent: [1, 2], tone: 'butter' }), h9b: L('Late guests, little chicken.', TZ + 116, 92),
        h10a: L('Too much, or too little:', TZ - 16, 100), h10b: L('it began with leftovers.', TZ + 112, 100, { accent: [3], tone: 'butter' }),
        h11a: L('Nearly three years on:', TZ - 16, 104), h11b: L('no verdict.', TZ + 116, 130, { accent: [0, 1], tone: 'red' }),
        h12a: L('But whoever wins,', TZ - 16, 120), h12b: L('one thing is certain.', TZ + 120, 112),
        h13a: L('Butter chicken was', TZ - 16, 112), h13b: L('invented by Kundan Lal.', TZ + 116, 90, { accent: [2, 3], tone: 'butter' }),
      };
      for (const k of ['h3a', 'h6a', 'h7b']) S.L[k].words.forEach((w) => w.classList.add('tnum'));
    },
    run(t, b, S) {
      const T = times(), L = S.L, g = S.g, c = T.cut; clear(g); clear(S.g2); LBL = S.g2;
      let i = 0; while (i < SHOTS.length - 1 && t >= c[i + 1]) i++;
      SHOTS[i](g, t);
      const out = (p) => { const k = LINES.indexOf(p); return k < LINES.length - 1 ? T.a[LINES[k + 1]] - 0.2 : T.end - 0.05; };
      const R = (Lx, tins, tout, lit, acc = []) => { rise(t, Lx, tins.map((x) => x - 0.06), tout); light(t, Lx, lit, acc); };
      rise(t, L.h0a, [-0.5, -0.45, -0.4], out('s01')); light(t, L.h0a, wv('s01', 0, 1, 2));
      R(L.h0b, wv('s01', 3, 4, 5, 6), out('s01'), wv('s01', 3, 4, 5, 6), [2, 3]);
      R(L.h1a, wv('s02', 1, 2, 3), out('s02'), wv('s02', 1, 2, 3)); R(L.h1b, wv('s02', 4, 5, 6), out('s02'), wv('s02', 4, 5, 6), [2]);
      R(L.h2a, wv('s03', 2, 3, 6), out('s03'), wv('s03', 2, 3, 6), [0, 2]); R(L.h2b, wv('s03', 8, 9, 10), out('s03'), wv('s03', 8, 9, 10));
      R(L.h3a, [T.cut[3] + 0.05, T.partition], out('s04'), [T.cut[3] + 0.05, T.partition]); R(L.h3b, [T.delhi4, T.moti, wi('s04', 12)], out('s04'), [T.delhi4, T.moti, wi('s04', 12)], [1, 2]);
      R(L.h4a, wv('s05', 4, 5), out('s05'), wv('s05', 4, 5)); R(L.h4b, wv('s05', 6, 7, 8), out('s05'), wv('s05', 6, 7, 8), [1]);
      R(L.h5a, wv('s06', 0), out('s06'), wv('s06', 0)); R(L.h5b, wv('s06', 4, 5), out('s06'), wv('s06', 4, 5), [0]);
      R(L.h6a, wv('s07', 1, 2), out('s07'), wv('s07', 1, 2)); R(L.h6b, wv('s07', 6, 7), out('s07'), wv('s07', 6, 7), [1]);
      R(L.h7a, wv('s08', 0, 1), out('s08'), wv('s08', 0, 1)); R(L.h7b, [T.n2, T.pages], out('s08'), [T.n50, T.pages], [0]);
      R(L.h8a, wv('s09', 0, 1, 3), out('s09'), wv('s09', 0, 1, 3), [1, 2]); R(L.h8b, wv('s09', 4, 6, 10, 12), out('s09'), wv('s09', 4, 6, 10, 12));
      R(L.h9a, wv('s10', 0, 1, 3), out('s10'), wv('s10', 0, 1, 3), [1, 2]); R(L.h9b, wv('s10', 4, 5, 8, 9), out('s10'), wv('s10', 4, 5, 8, 9));
      R(L.h10a, wv('s11', 0, 1, 3, 4, 5), out('s11'), wv('s11', 0, 1, 3, 4, 5)); R(L.h10b, [T.either, T.root, T.root + 0.1, T.leftovers], out('s11'), [T.either, T.root, T.root + 0.1, T.leftovers], [3]);
      R(L.h11a, wv('s12', 0, 1, 2), out('s12'), wv('s12', 0, 1, 2)); R(L.h11b, [wi('s12', 6), wi('s12', 6) + 0.05], out('s12'), [T.decided, T.decided], [0, 1]);
      R(L.h12a, wv('s13', 0, 1, 2), out('s13'), wv('s13', 0, 1, 2)); R(L.h12b, wv('s13', 3, 4, 5, 6), out('s13'), wv('s13', 3, 4, 5, 6));
      R(L.h13a, wv('s14', 0, 1, 2), T.end - 0.05, wv('s14', 0, 1, 2)); R(L.h13b, wv('s14', 3, 4, 5, 6), T.end - 0.05, wv('s14', 3, 4, 5, 6), [2, 3]);
    },
  });

  // ================================================================ finish: grain (seeded, per frame), as in AI171
  scene({
    name: 'fx', from: 'hook', to: 'end',
    build(root, S) {
      const cv = el('canvas', { width: W, height: H, style: `width:${W}px;height:${H}px;mix-blend-mode:overlay;opacity:0.07` }, root);
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
