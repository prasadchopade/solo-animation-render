// Reel 16 · Diwali's Missing Colour. Glyph, in a marigold kurta with a sparkler, watches a Diwali sky over an Indian
// city and looks for the one colour it hardly ever shows. Every colour up there is a burning metal (strontium red,
// calcium orange, sodium yellow, barium green); blue comes from copper, and copper's blue is fragile: too hot and it
// washes out to white, too cool and it is too faint, so it lives in a tiny window, coaxed out with chlorine (sometimes
// from plastic). A perfect blue is the holy grail of fireworks. India's twist: barium, the green-maker, has been barred
// from crackers since 2018, so the "green" in green crackers means less pollution. At last a deep blue blooms over the
// rooftops. Facts: docs/research.md. Every burst is a deterministic particle system (seeded, a pure function of t).
// Type in the text zone lit as the voice says it, as in AI171. 30 fps, no motion blur. Our own drawings throughout.
(() => {
  const { W, H, put, reg, el, scene, canvas, clamp, lerp, ease, mulberry32 } = C;
  const K = window.KIT, G = window.GLYPH;
  const { st, hit, tb, words, cam, clear, drift, kick, font } = K;
  C.fonts = ['700 condensed 100px Bahn', '600 semi-condensed 64px Bahn', '700 semi-condensed 46px Bahn', '400 30px Bahn', '400 30px Mono', '700 30px Mono'];
  const TAU = Math.PI * 2, PI = Math.PI, eio = ease.inOut, eo = ease.out;
  const X0 = 80, TZ = 1222;
  const INK = '#ece8e1', INK2 = '#8d949c', INK3 = '#3b434c', ACC = '#ff3b1f';
  const FW = { red: '#ff3d32', orange: '#ff8a1e', yellow: '#ffd42a', green: '#3dff6e', gold: '#ffc46a', white: '#f4f5ff', blue: '#3f72ff', deep: '#2f55ff', purple: '#b84dff', copper: '#e08a52' };

  // ------------------------------------------------------------------ timing (the narration's words; estimates until the voice is placed)
  const FB = { s01: 0.5, s02: 3.1, s03: 6.2, s04: 10.7, s05: 14.0, s06: 15.9, s07: 20.6, s08: 23.5, s09: 28.0, s10: 32.3, s11: 35.6, s12: 38.5, s13: 44.0, s14: 48.3 };
  const has = (p) => words(p).length > 0;
  const at = (p) => (has(p) ? words(p)[0].t0 : FB[p]);
  const wi = (p, i) => (has(p) && words(p)[i] ? words(p)[i].t0 : at(p) + 0.3 * i);
  const wv = (p, ...ix) => ix.map((i) => wi(p, i));
  const lastE = (p) => (has(p) ? words(p)[words(p).length - 1].t1 : at(p) + 2.5);
  const LINES = ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10', 's11', 's12', 's13', 's14'];
  let T = null, LBL = null;
  function times() {
    if (T) return T;
    const t = {
      a: Object.fromEntries(LINES.map((p) => [p, at(p)])),
      colour1: wi('s01', 5), metal: wi('s02', 7), sr: wi('s03', 2), ca: wi('s03', 4), na: wi('s03', 6), ba: wi('s03', 8),
      blue4: wi('s04', 3), find: wi('s04', 7), copper: wi('s05', 3), fragile: wi('s06', 4), hot: wi('s06', 6), white: wi('s06', 12),
      cool: wi('s07', 1), faint: wi('s07', 5), burn: wi('s08', 4), window: wi('s08', 12), chlorine: wi('s09', 3), plastic: wi('s09', 6), glow: wi('s09', 10),
      perfect: wi('s10', 1), grail: wi('s10', 6), india: wi('s11', 2), green11: wi('s11', 3), y2018: wi('s12', 1), banned: wi('s12', 7), barium: wi('s12', 8),
      makes: wi('s12', 12), green12: wi('s12', 13), gc: wi('s13', 4), pollution: wi('s13', 8), colour13: wi('s13', 11),
      deep: wi('s14', 4), blue14: wi('s14', 5), diwali14: wi('s14', 7), hardest: wi('s14', 11), chem: wi('s14', 14), end14: lastE('s14'), end: tb('end'),
    };
    t.cut = [0, ...LINES.slice(1).map((p) => t.a[p] - 0.15), t.end];
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
  const TONE = { red: ['#ff3d32', 'rgba(255,61,50,0.7)'], orange: ['#ff8a1e', 'rgba(255,138,30,0.7)'], yellow: ['#ffd42a', 'rgba(255,212,42,0.7)'],
    green: ['#3dff6e', 'rgba(61,255,110,0.7)'], blue: ['#5b86ff', 'rgba(91,134,255,0.7)'], copper: ['#e08a52', 'rgba(224,138,82,0.7)'], gold: ['#ffc46a', 'rgba(255,196,106,0.7)'] };
  function light(t, L, times, acc = []) {
    L.words.forEach((w, i) => {
      const on = t >= times[Math.min(i, times.length - 1)] - 0.04, tone = (L.tones && L.tones[i]) || (acc.includes(i) ? L.tone || 'red' : null);
      put(w, { css: { color: tone ? (on ? TONE[tone][0] : TONE[tone][1]) : (on ? '' : 'rgba(236,232,225,0.78)') } });
    });
  }
  function under(root) {
    return el('div', { class: 'abs', style: `width:${W}px;height:${H}px;pointer-events:none;background:` +
      'linear-gradient(180deg, rgba(7,9,12,0.5) 0px, rgba(7,9,12,0) 300px, rgba(7,9,12,0) 1000px, rgba(7,9,12,0.78) 1200px, rgba(7,9,12,0.9) 100%)' }, root);
  }

  // ------------------------------------------------------------------ canvas helpers
  function shotCam(g, t, i, o = {}) {
    const T = times(), u = t - T.cut[i], d = Math.max(0.5, T.cut[i + 1] - T.cut[i]), dr = drift(t, o.drift ?? 4);
    let kx = 0, ky = 0; for (const [k0, a] of o.kicks || []) { const q = kick(t, k0, a); kx += q.x; ky += q.y; }
    const c = { s: (o.s0 ?? 1) + (o.push ?? 0.035) * eio(clamp(u / d)), x: dr.x + kx, y: dr.y + ky, ox: 540, oy: o.oy ?? 760 };
    cam(g, c); return c;
  }
  const screen = (g) => g.setTransform(1, 0, 0, 1, 0, 0);
  function mlabel(g, s, x, y, a = 1, o = {}) {                 // drawn on the label layer, with g's transform and alpha
    if (a <= 0.01) return;
    const q = LBL || g, size = o.size || 26;
    q.save(); q.setTransform(g.getTransform()); q.globalAlpha = g.globalAlpha * a; font(q, size, o.w || 700, 'normal', 'Mono'); q.letterSpacing = '0.06em'; q.textAlign = o.align || 'left';
    if (o.bg) { const w = q.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; q.fillStyle = o.bg === true ? 'rgba(7,9,12,0.82)' : o.bg; q.fillRect(x0 - 12, y - size * 0.95, w + 24, size * 1.38); }
    q.fillStyle = o.c || INK; q.fillText(s, x, y); q.restore();
  }
  const eyebrow = (g, s, t, t0, c = INK2) => { screen(g); mlabel(g, s, X0, 330, clamp((t - t0) / 0.25), { size: 30, c, bg: 'rgba(7,9,12,0.55)' }); };
  function big(g, s, x, y, size, c, o = {}) {
    if ((o.a ?? 1) <= 0.005) return;
    g.save(); g.globalAlpha *= o.a ?? 1; font(g, size, o.w || 700, o.stretch || 'condensed', o.fam || 'Bahn'); g.textAlign = o.align || 'left';
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur ?? 40; }
    g.fillStyle = c; g.fillText(s, x, y); g.restore();
  }
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const hex = (c) => (c.startsWith('#') ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c.match(/\d+/g).slice(0, 3).map(Number));   // '#rrggbb' or 'rgb(r,g,b)'
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
  const rgba = (c, a) => { const A = c.startsWith('#') ? hex(c) : c.match(/\d+/g).map(Number); return `rgba(${A[0]},${A[1]},${A[2]},${Math.max(0, a).toFixed(3)})`; };

  // ------------------------------------------------------------------ fireworks: seeded particle bursts (a pure function of t)
  // A burst at (x, y) from t0: n stars thrown round, slowed by drag, pulled by gravity, each a short glowing streak that
  // fades over its life; glitter twinkles; a flash at the start. col may change with time: o.colAt(τ) (the blue that
  // washes out, the blue that fades).
  const GRAV = 150, DRAG = 1.7;
  function starPos(x, y, a, v, tau) { const d = (v / DRAG) * (1 - Math.exp(-DRAG * tau)); return [x + Math.cos(a) * d, y + Math.sin(a) * d + 0.5 * GRAV * tau * tau * 0.55]; }
  function burst(g, x, y, t, t0, o = {}) {
    const tau = t - t0, life = o.life ?? 2.1; if (tau < 0 || tau > life + 0.3) return;
    const n = o.n ?? 110, v = o.v ?? 620, r = mulberry32(o.seed ?? 7), col = o.colAt ? o.colAt(tau) : o.col || FW.gold, bright = o.bright ?? 1, wd = o.width ?? 7;
    const hot = mix(col.startsWith('#') ? col : '#ffffff', '#ffffff', 0.6);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (r() - 0.5) * 0.18, vi = v * (0.78 + r() * 0.34), ph = r() * 9, lf = life * (0.78 + r() * 0.32);
      const u = tau / lf; if (u > 1) continue;
      const tw = o.glitter && u > 0.45 ? 0.35 + 0.65 * Math.max(0, Math.sin(t * 34 + ph * 7)) : 1;
      const fade = Math.pow(1 - u, 1.25) * bright * tw;
      const [x1, y1] = starPos(x, y, a, vi, tau), [xm, ym] = starPos(x, y, a, vi, Math.max(0, tau - 0.09)), [x0, y0] = starPos(x, y, a, vi, Math.max(0, tau - 0.26));
      g.strokeStyle = rgba(col, fade * 0.32); g.lineWidth = wd * 1.9; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();     // the glow
      g.strokeStyle = rgba(col, fade * 0.85); g.lineWidth = wd; g.beginPath(); g.moveTo(xm, ym); g.lineTo(x1, y1); g.stroke();             // the streak
      g.fillStyle = rgba(hot, fade); g.beginPath(); g.arc(x1, y1, wd * 0.72, 0, TAU); g.fill();                                              // the burning star
    }
    if (tau < 0.25) { const k = 1 - tau / 0.25, gr = g.createRadialGradient(x, y, 0, x, y, 200); gr.addColorStop(0, rgba('#ffffff', 0.9 * k * bright)); gr.addColorStop(0.35, rgba(col, 0.5 * k * bright)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 200, 0, TAU); g.fill(); }
    g.restore();
  }
  function skyGlow(g, x, y, col, t, t0, life = 1.6, k = 0.22) {   // the burst lights the sky round it
    const tau = t - t0; if (tau < 0 || tau > life) return;
    const a = k * Math.pow(1 - tau / life, 1.4), R = 640;
    const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
  }
  function rocket(g, x0, y0, x1, y1, t, t0, t1, col = FW.gold) {  // the climb, a fading trail of sparks
    if (t < t0 || t > t1 + 0.05) return;
    const u = clamp((t - t0) / (t1 - t0)), e = 1 - Math.pow(1 - u, 2), hx = lerp(x0, x1, e), hy = lerp(y0, y1, e);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let k = 0; k < 10; k++) { const uu = Math.max(0, e - k * 0.03), px = lerp(x0, x1, uu), py = lerp(y0, y1, uu) + k * 3; g.fillStyle = rgba(col, 0.5 * (1 - k / 10)); g.beginPath(); g.arc(px + Math.sin(k * 3 + t * 20) * 2, py, 4 - k * 0.3, 0, TAU); g.fill(); }
    g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(hx, hy, 5, 0, TAU); g.fill(); g.restore();
  }
  function show(g, t, list) {                                  // a list of { x, y, t0, col, ... }: rockets, glows, bursts
    for (const b of list) { if (b.rise !== false) rocket(g, b.x + (b.dx ?? 0), 1180, b.x, b.y, t, b.t0 - (b.rise ?? 0.7), b.t0, b.col === FW.white ? FW.gold : b.col); skyGlow(g, b.x, b.y, b.glowCol || b.col, t, b.t0, b.life ?? 1.6, b.glow ?? 0.2); }
    for (const b of list) burst(g, b.x, b.y, t, b.t0, b);
  }

  // ------------------------------------------------------------------ the city at night: sky, skyline, lights, diyas
  function sky(g, tint = null, k = 0) {
    const gr = g.createLinearGradient(0, -300, 0, 1300); gr.addColorStop(0, '#05060f'); gr.addColorStop(0.55, '#0b1030'); gr.addColorStop(1, '#1b1730');
    g.fillStyle = gr; g.fillRect(-400, -400, W + 800, H + 800);
    const r = mulberry32(3); g.fillStyle = 'rgba(220,226,255,0.55)';
    for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * 820, s = r() < 0.15 ? 2.2 : 1.3; g.globalAlpha = 0.25 + 0.5 * r(); g.fillRect(x, y, s, s); }
    g.globalAlpha = 1;
    const hz = g.createLinearGradient(0, 760, 0, 1150); hz.addColorStop(0, 'rgba(255,140,60,0)'); hz.addColorStop(1, 'rgba(255,140,60,0.16)'); g.fillStyle = hz; g.fillRect(-400, 760, W + 800, 400);   // the city's glow
    if (tint && k > 0) { g.fillStyle = rgba(tint, 0.12 * k); g.fillRect(-400, -400, W + 800, 1600); }
  }
  function city(g, t, o = {}) {                                // far skyline, near skyline, the rooftop Glyph stands on
    const r = mulberry32(11), lit = o.lit || null, lk = o.lk ?? 0;
    const layer = (y0, hmin, hmax, col, winA, seed) => {
      const q = mulberry32(seed); let x = -60;
      while (x < W + 60) {
        const w = 70 + q() * 110, h = hmin + q() * (hmax - hmin), y = y0 - h;
        g.fillStyle = col; g.fillRect(x, y, w + 1, h + 400);
        if (q() < 0.55) { const tx = x + 12 + q() * (w - 60), tw = 26 + q() * 14; g.fillRect(tx, y - 30, tw, 30); g.fillRect(tx + 4, y - 36, tw - 8, 7); g.fillRect(tx + 3, y - 30, 3, 30); }   // water tanks
        if (q() < 0.12) { g.beginPath(); g.moveTo(x + w * 0.3, y); g.lineTo(x + w * 0.5, y - 70); g.lineTo(x + w * 0.7, y); g.closePath(); g.fill(); g.fillRect(x + w * 0.5 - 2, y - 92, 4, 24); }   // a small temple spire
        for (let wy = y + 18; wy < y0 - 10; wy += 34) for (let wx = x + 12; wx < x + w - 16; wx += 26) {
          if (q() < 0.32) { g.fillStyle = `rgba(255,${190 + Math.floor(q() * 40)},${110 + Math.floor(q() * 50)},${winA * (0.5 + 0.5 * q())})`; g.fillRect(wx, wy, 11, 15); g.fillStyle = col; }
        }
        x += w + 4 + q() * 18;
      }
    };
    layer(1010, 120, 300, '#0d1020', 0.5, 21);
    layer(1110, 60, 220, '#090b16', 0.75, 37);
    // fairy lights strung across the near roofs, twinkling
    for (let s = 0; s < 5; s++) {
      const x0 = -40 + s * 240, x1 = x0 + 260, y0 = 930 + (s % 2) * 40, sag = 46;
      for (let k = 0; k <= 16; k++) {
        const u = k / 16, x = lerp(x0, x1, u), y = y0 + sag * 4 * u * (1 - u), c = ['#ffcf5a', '#ff5a5a', '#7cff8a', '#ffcf5a', '#ff9a3c'][(k + s) % 5];
        g.fillStyle = rgba(c, 0.55 + 0.45 * Math.sin(t * 3 + k * 1.7 + s));
        g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill();
      }
    }
    if (lit && lk > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(lit, 0.16 * lk); g.fillRect(-400, 700, W + 800, 480); g.restore(); }
    // the near rooftop: a parapet with diyas
    g.fillStyle = '#06070c'; g.fillRect(-400, 1118, W + 800, 900);
    g.fillStyle = '#12141c'; g.fillRect(-400, 1108, W + 800, 14);
    for (let i = 0; i < 12; i++) diya(g, 40 + i * 92, 1106, t, i);
  }
  function diya(g, x, y, t, i) {                               // a clay lamp with a flame
    g.fillStyle = '#8a4a26'; g.beginPath(); g.ellipse(x, y, 15, 6, 0, 0, PI); g.fill();
    const f = 1 + 0.12 * Math.sin(t * 13 + i * 2.1) + 0.06 * Math.sin(t * 29 + i);
    const gr = g.createRadialGradient(x, y - 10, 0, x, y - 10, 26); gr.addColorStop(0, 'rgba(255,190,80,0.45)'); gr.addColorStop(1, 'rgba(255,140,40,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y - 10, 26, 0, TAU); g.fill();
    g.fillStyle = '#ffd36a'; g.beginPath(); g.moveTo(x - 4, y - 2); g.quadraticCurveTo(x, y - 22 * f, x + 4, y - 2); g.closePath(); g.fill();
    g.fillStyle = '#fff4cf'; g.beginPath(); g.ellipse(x, y - 5, 1.8, 4 * f, 0, 0, TAU); g.fill();
  }

  // ------------------------------------------------------------------ Glyph, in a marigold kurta, with a sparkler
  const KURTA = { suit: '#e8862e', legs: '#efe6d2', coat: { c: '#e8862e', d: '#b8622a', buttons: '#ffd27a' } };
  const sparkler = (t) => (g) => {                            // the wire, the burning tip, sparks flying (seeded per frame)
    g.save(); g.lineCap = 'round'; g.strokeStyle = '#6b6f78'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(6, -70); g.stroke();
    const r = mulberry32(Math.round(t * 30) + 5); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(6, -70, 0, 6, -70, 30); gr.addColorStop(0, 'rgba(255,240,200,0.95)'); gr.addColorStop(1, 'rgba(255,190,90,0)'); g.fillStyle = gr; g.beginPath(); g.arc(6, -70, 30, 0, TAU); g.fill();
    for (let k = 0; k < 22; k++) { const a = r() * TAU, l = 10 + r() * 34, bx = 6 + Math.cos(a) * (6 + r() * 8), by = -70 + Math.sin(a) * (6 + r() * 8); g.strokeStyle = `rgba(255,${200 + Math.floor(r() * 55)},${120 + Math.floor(r() * 80)},${0.5 + 0.5 * r()})`; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a) * l, by + Math.sin(a) * l); g.stroke(); }
    g.restore();
  };
  function glyph(g, x, y, s, t, o = {}) {
    G.draw(g, { x, y, s, t, seed: o.seed ?? 2, outfit: KURTA, mood: o.mood || 'neutral', look: o.look || [0.1, -0.8], armR: o.armR || [1.55, -0.3], armL: o.armL || [0.35, 0.2],
      prop: o.prop === false ? undefined : sparkler(t), propL: o.propL, lean: o.lean ?? 0, mouth: o.mouth, palm: o.palm, curve: o.curve ?? 0 });
  }

  // ------------------------------------------------------------------ the chemistry: element tiles, the gauge, the molecule
  function tile(g, x, y, s, sym, num, name, col, a = 1) {    // a periodic-table tile, centred on (x, y)
    if (a <= 0.01) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(8,10,18,0.88)'; rr(g, -110, -130, 220, 260, 22); g.fill();
    g.strokeStyle = col; g.lineWidth = 6; rr(g, -110, -130, 220, 260, 22); g.stroke();
    g.shadowColor = col; g.shadowBlur = 30;
    font(g, 34, 700, 'normal', 'Mono'); g.textAlign = 'left'; g.fillStyle = col; g.fillText(String(num), -90, -86);
    font(g, 150, 700, 'condensed'); g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(sym, 0, 50);
    g.shadowBlur = 0; font(g, 30, 700, 'normal', 'Mono'); g.fillStyle = col; g.fillText(name, 0, 108);
    g.restore();
  }
  function gauge(g, x, y, h, v, o = {}) {                      // a thermometer: v 0 (cool) .. 1 (hot); the blue window marked
    const w = 64, wl = o.win || [0.48, 0.6], kW = o.kW ?? 0;
    g.fillStyle = 'rgba(8,10,18,0.9)'; rr(g, x - w / 2 - 14, y - 20, w + 28, h + 120, 40); g.fill();
    const gr = g.createLinearGradient(0, y + h, 0, y); gr.addColorStop(0, '#2a3a7a'); gr.addColorStop(0.5, '#4060ff'); gr.addColorStop(0.75, '#ffffff'); gr.addColorStop(1, '#ffffff');
    g.fillStyle = '#1a1f2e'; rr(g, x - w / 2, y, w, h, 30); g.fill();
    g.save(); rr(g, x - w / 2, y, w, h, 30); g.clip(); g.fillStyle = gr; g.globalAlpha = 0.35; g.fillRect(x - w / 2, y, w, h); g.globalAlpha = 1;
    const lvl = y + h * (1 - v); g.fillStyle = mix('#ff7a3c', '#ff2a1a', v); g.fillRect(x - 14, lvl, 28, y + h - lvl); g.restore();
    g.fillStyle = mix('#ff7a3c', '#ff2a1a', v); g.beginPath(); g.arc(x, y + h + 46, 46, 0, TAU); g.fill();
    if (kW > 0) {                                              // the window
      const ya = y + h * (1 - wl[1]), yb = y + h * (1 - wl[0]);
      g.save(); g.globalAlpha = kW; g.strokeStyle = FW.blue; g.lineWidth = 5; g.strokeRect(x - w / 2 - 8, ya, w + 16, yb - ya); g.fillStyle = 'rgba(63,114,255,0.25)'; g.fillRect(x - w / 2 - 8, ya, w + 16, yb - ya); g.restore();
    }
    g.strokeStyle = 'rgba(236,232,225,0.6)'; g.lineWidth = 3; for (let k = 0; k <= 10; k++) { const yy = y + h * k / 10; g.beginPath(); g.moveTo(x + w / 2 + 4, yy); g.lineTo(x + w / 2 + (k % 5 ? 14 : 24), yy); g.stroke(); }
  }
  function atom(g, x, y, r, col, sym, a = 1) {
    if (a <= 0.01) return;
    g.save(); g.globalAlpha *= a; const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); gr.addColorStop(0, mix(col, '#ffffff', 0.45)); gr.addColorStop(1, col);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    font(g, r * 0.95, 700, 'condensed'); g.textAlign = 'center'; g.fillStyle = '#0b0d14'; g.fillText(sym, x, y + r * 0.33); g.restore();
  }
  function gavel(g, x, y, ang) {                               // a judge's gavel, our drawing
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = '#7a4a2a'; g.fillRect(-10, -10, 230, 20); g.fillStyle = '#5a361e'; rr(g, -70, -46, 120, 92, 14); g.fill();
    g.fillStyle = '#c99a5a'; g.fillRect(-72, -46, 10, 92); g.fillRect(40, -46, 10, 92); g.restore();
  }
  function crackerBox(g, x, y, s, a = 1) {                     // a box of "green crackers": our own label, a leaf
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#1f6b3a'; rr(g, -130, -90, 260, 180, 14); g.fill(); g.strokeStyle = '#7fe0a0'; g.lineWidth = 5; rr(g, -130, -90, 260, 180, 14); g.stroke();
    g.fillStyle = '#7fe0a0'; g.beginPath(); g.ellipse(-62, -8, 34, 18, -0.6, 0, TAU); g.fill(); g.strokeStyle = '#1f6b3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(-88, 12); g.lineTo(-38, -26); g.stroke();
    font(g, 54, 700, 'condensed'); g.textAlign = 'left'; g.fillStyle = '#eafff0'; g.fillText('GREEN', -16, -6); g.fillText('CRACKER', -16, 46); g.restore();
  }

  // ------------------------------------------------------------------ the shots
  const SKY_SHOW = (T) => [                                    // the opening sky: bursts already going on frame 0
    { x: 280, y: 440, t0: -0.45, col: FW.red, seed: 1, rise: false, glow: 0.3 }, { x: 790, y: 380, t0: -0.2, col: FW.gold, seed: 2, glitter: true, rise: false, glow: 0.3 },
    { x: 560, y: 660, t0: -0.05, col: FW.green, seed: 3, rise: false, v: 520 }, { x: 180, y: 760, t0: 0.6, col: FW.white, seed: 4, v: 480 },
    { x: 860, y: 680, t0: 0.95, col: FW.orange, seed: 5 }, { x: 430, y: 330, t0: 1.45, col: FW.red, seed: 6, v: 680 },
    { x: 760, y: 470, t0: 2.0, col: FW.yellow, seed: 7 }, { x: 300, y: 560, t0: 2.5, col: FW.gold, seed: 8, glitter: true },
  ];
  function shSky(g, t) {                                       // 0 · Diwali's sky is missing a colour
    const T = times(); shotCam(g, t, 0, { push: 0.04, oy: 900 });
    sky(g); show(g, t, SKY_SHOW(T)); city(g, t);
    glyph(g, 300, 1112, 0.86, t, { look: [0.3 * Math.sin(t * 0.9), -0.85], mood: t > T.colour1 - 0.1 ? 'skeptical' : 'happy' });
    screen(g); eyebrow(g, 'DIWALI · SUN 8 NOV 2026', t, -0.4);
  }
  function shMetal(g, t) {                                     // 1 · every colour up there is a burning metal
    const T = times(); shotCam(g, t, 1, { push: 0.05, oy: 700 });
    sky(g); const t0 = T.cut[1] + 0.05;
    show(g, t, [{ x: 540, y: 560, t0, col: FW.red, seed: 11, n: 90, v: 520, life: 2.4, glow: 0.3, rise: 0.5 }]);
    city(g, t);
    const k = eo(clamp((t - (T.metal - 0.35)) / 0.4));
    if (k > 0) { atom(g, 540, 560, 52 * k, FW.red, 'Sr', k); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 0.6; atom(g, 540 + Math.cos(a) * 150 * k, 560 + Math.sin(a) * 150 * k, 18 * k, mix(FW.red, '#ffffff', 0.2), '', k * 0.8); } }
    screen(g); mlabel(g, 'METAL SALTS · SINCE THE 1830s', 540, 820, clamp((t - (T.metal - 0.2)) / 0.3), { size: 26, c: INK2, align: 'center', bg: 'rgba(7,9,12,0.6)' });
    eyebrow(g, 'WHAT MAKES THE COLOUR', t, T.cut[1] + 0.05);
  }
  function shPalette(g, t) {                                   // 2 · red strontium, orange calcium, yellow sodium, green barium
    const T = times(); shotCam(g, t, 2, { push: 0.03, oy: 700 });
    sky(g);
    const P = [[FW.red, 'Sr', 38, 'STRONTIUM', T.sr, 290, 450], [FW.orange, 'Ca', 20, 'CALCIUM', T.ca, 790, 430], [FW.yellow, 'Na', 11, 'SODIUM', T.na, 290, 800], [FW.green, 'Ba', 56, 'BARIUM', T.ba, 790, 780]];
    show(g, t, P.map(([col, , , , tw, x, y], i) => ({ x, y, t0: tw - 0.12, col, seed: 20 + i, n: 96, v: 470, life: 2.2, rise: 0.45, glow: 0.28 })));
    city(g, t);
    P.forEach(([col, sym, num, name, tw, x, y]) => { const k = eo(clamp((t - (tw - 0.05)) / 0.3)); tile(g, x, y, 0.8 * (0.8 + 0.2 * k), sym, num, name, col, k); });
    screen(g); eyebrow(g, 'EACH COLOUR, ITS METAL', t, T.cut[2] + 0.05);
  }
  function shNoBlue(g, t) {                                    // 3 · but a true blue? almost impossible to find
    const T = times(); shotCam(g, t, 3, { push: 0.04, oy: 900 });
    sky(g);
    const t0 = T.cut[3];
    show(g, t, [{ x: 250, y: 420, t0: t0 - 0.4, col: FW.red, seed: 31, rise: false }, { x: 820, y: 500, t0: t0 + 0.3, col: FW.green, seed: 32 },
      { x: 540, y: 380, t0: T.blue4 - 0.1, colAt: (tau) => mix(FW.purple, '#d8d0ff', clamp(tau / 1.2) * 0.6), seed: 33, n: 64, v: 400, glow: 0.18, glowCol: FW.purple },
      { x: 330, y: 650, t0: T.find - 0.3, col: FW.gold, seed: 34, glitter: true }]);
    city(g, t);
    glyph(g, 300, 1112, 0.86, t, { look: [Math.sin(t * 1.7) * 0.9, -0.6], mood: 'skeptical', armL: [2.4, -0.9], propL: null });
    screen(g);
    const kq = eo(clamp((t - (T.blue4 + 0.15)) / 0.35));
    big(g, '?', 540, 300 + 130, 150, FW.blue, { align: 'center', a: kq * 0.9, glow: 'rgba(63,114,255,0.6)' });
    mlabel(g, 'THAT ONE? PURPLE, THEN PALE', 540, 560, clamp((t - (T.blue4 + 0.5)) / 0.3), { size: 26, c: INK2, align: 'center', bg: 'rgba(7,9,12,0.6)' });
  }
  function shCopper(g, t) {                                    // 4 · blue comes from copper
    const T = times(); shotCam(g, t, 4, { push: 0.05, oy: 700 });
    sky(g, FW.blue, 0.6);
    show(g, t, [{ x: 540, y: 600, t0: T.copper - 0.1, col: FW.blue, seed: 41, n: 84, v: 470, life: 2.2, glow: 0.3, rise: 0.4 }]);
    city(g, t, { lit: FW.blue, lk: clamp((t - T.copper) / 0.4) * (1 - clamp((t - T.copper - 1.2) / 0.8)) });
    const k = eo(clamp((t - T.cut[4] + 0.1) / 0.35));
    tile(g, 540, 600, 0.9, 'Cu', 29, 'COPPER', FW.copper, k * (1 - 0.6 * clamp((t - T.copper) / 0.5)));
    screen(g); eyebrow(g, 'BLUE: COPPER, AS COPPER CHLORIDE IN THE FLAME', t, T.cut[4] + 0.05);
  }
  function blueAt(heat) {                                      // what the copper star looks like at a heat (0 cool .. 1 hot)
    if (heat > 0.6) return { col: mix(FW.blue, FW.white, clamp((heat - 0.6) / 0.3)), bright: 1 };
    if (heat < 0.45) return { col: FW.blue, bright: 0.18 + 0.82 * clamp(heat / 0.45) };
    return { col: FW.blue, bright: 1 };
  }
  function lab(g, t, i, heat, opts = {}) {                     // the gauge on the left, the copper star on the right
    shotCam(g, t, i, { push: 0.03, oy: 700 });
    sky(g); city(g, t);
    g.fillStyle = 'rgba(5,6,12,0.55)'; g.fillRect(-400, -400, W + 800, 1520);
    gauge(g, 190, 430, 560, heat, { kW: opts.kW ?? 0 });
    const b = blueAt(heat), T = times();
    const r = mulberry32(51), cx = 640, cy = 640;
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 300); gr.addColorStop(0, rgba(b.col.startsWith('#') ? b.col : '#9ab0ff', 0.35 * b.bright)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(cx - 300, cy - 300, 600, 600);
    for (let k = 0; k < 48; k++) {                             // a held burst, slowly turning: the copper star at this heat
      const a = k / 48 * TAU + t * 0.25, len = 140 + r() * 120, flick = 0.75 + 0.25 * Math.sin(t * 9 + k);
      g.strokeStyle = b.col.startsWith('#') ? rgba(b.col, 0.55 * b.bright * flick) : b.col.replace('rgb', 'rgba').replace(')', `,${(0.55 * b.bright * flick).toFixed(3)})`);
      g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); g.stroke();
    }
    g.restore();
    return { b, T };
  }
  function shHot(g, t) {                                       // 5 · copper's blue is fragile: too hot, it washes out to white
    const T = times(), heat = lerp(0.52, 0.95, eio(clamp((t - (T.hot - 0.2)) / Math.max(0.6, T.white - T.hot + 0.2))));
    lab(g, t, 5, heat);
    screen(g);
    mlabel(g, 'HOTTER →', 300, 470, clamp((t - T.hot) / 0.3), { size: 28, c: '#ff6a4a' });
    big(g, heat > 0.75 ? 'WHITE' : 'BLUE', 640, 1010, 96, heat > 0.75 ? FW.white : FW.blue, { align: 'center', glow: heat > 0.75 ? 'rgba(255,255,255,0.5)' : 'rgba(63,114,255,0.6)' });
    eyebrow(g, 'TOO HOT: THE BLUE WASHES OUT (PBS NOVA)', t, T.cut[5] + 0.05);
  }
  function shCool(g, t) {                                      // 6 · too cool, and it's too faint to see
    const T = times(), heat = lerp(0.95, 0.1, eio(clamp((t - T.cut[6]) / Math.max(0.6, T.faint - T.cut[6] + 0.2))));
    lab(g, t, 6, heat);
    screen(g);
    mlabel(g, '← COOLER', 300, 1000, clamp((t - T.cool) / 0.3), { size: 28, c: '#7fa0ff' });
    big(g, heat > 0.75 ? 'WHITE' : heat < 0.3 ? 'FAINT' : 'BLUE', 640, 1010, 96, heat < 0.3 ? 'rgba(63,114,255,0.35)' : FW.blue, { align: 'center' });
    eyebrow(g, 'TOO COOL: IT BARELY GLOWS', t, T.cut[6] + 0.05);
  }
  function shWindow(g, t) {                                    // 7 · fireworks burn hot; blue lives in a tiny window
    const T = times(), kW = eo(clamp((t - (T.window - 0.5)) / 0.4));
    const heat = t < T.burn ? 0.1 + 0.5 * eo(clamp((t - T.cut[7]) / 0.6)) : lerp(0.6, 0.54, clamp((t - T.burn) / 0.8));
    lab(g, t, 7, heat, { kW });
    screen(g);
    if (kW > 0) { mlabel(g, 'THE BLUE WINDOW', 300, 430 + 560 * (1 - 0.54) + 10, kW, { size: 28, c: FW.blue, bg: 'rgba(7,9,12,0.75)' }); mlabel(g, 'WHITE', 300, 520, kW, { size: 24, c: INK }); mlabel(g, 'FAINT', 300, 940, kW, { size: 24, c: '#5a6aa0' }); }
    eyebrow(g, 'HOT ENOUGH TO FLY AND BURST · COOL ENOUGH TO STAY BLUE', t, T.cut[7] + 0.05);
  }
  function shChlorine(g, t) {                                  // 8 · makers add chlorine, sometimes from plastic
    const T = times(); shotCam(g, t, 8, { push: 0.04, oy: 700 });
    sky(g); city(g, t); g.fillStyle = 'rgba(5,6,12,0.6)'; g.fillRect(-400, -400, W + 800, 1520);
    const kC = eo(clamp((t - (T.chlorine - 0.2)) / 0.4)), kP = eo(clamp((t - (T.plastic - 0.2)) / 0.4)), kJ = eo(clamp((t - (T.glow - 0.45)) / 0.5));
    // the plastic: a short length of PVC pipe, shedding chlorine
    g.save(); g.globalAlpha = kP; g.fillStyle = '#d8dde6'; rr(g, 640, 420, 280, 80, 14); g.fill(); g.fillStyle = '#b8bec9'; g.fillRect(640, 420, 28, 80); g.fillStyle = '#9aa1ad'; g.beginPath(); g.ellipse(920, 460, 14, 40, 0, 0, TAU); g.fill(); g.restore();
    mlabel(g, 'PVC PLASTIC', 780, 540, kP, { size: 26, c: INK2, align: 'center' });
    const cuX = lerp(330, 470, kJ), clX = lerp(760, 610, kJ), y = 700;
    atom(g, cuX, y, 86, FW.copper, 'Cu', 1);
    atom(g, clX, y, 70, '#bfe86a', 'Cl', kC);
    if (kJ > 0.6) { const k = (kJ - 0.6) / 0.4; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(540, y, 0, 540, y, 320); gr.addColorStop(0, rgba(FW.blue, 0.55 * k)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(220, y - 320, 640, 640); g.restore(); }
    screen(g);
    mlabel(g, 'CuCl: COPPER CHLORIDE, THE BLUE GLOW', 540, 900, clamp((kJ - 0.6) / 0.4), { size: 28, c: '#9ab4ff', align: 'center', bg: 'rgba(7,9,12,0.75)' });
    eyebrow(g, 'THE RECIPE FOR BLUE', t, T.cut[8] + 0.05);
  }
  function shGrail(g, t) {                                     // 9 · a perfect blue is the holy grail of fireworks
    const T = times(); shotCam(g, t, 9, { push: 0.06, oy: 640 });
    sky(g, FW.deep, 0.8);
    show(g, t, [{ x: 540, y: 560, t0: T.cut[9] + 0.15, col: FW.deep, seed: 61, n: 110, v: 560, life: 2.8, glow: 0.38, rise: 0.5 },
      { x: 540, y: 560, t0: T.cut[9] + 0.55, col: '#8fb0ff', seed: 62, n: 60, v: 300, life: 2.2, glitter: true, rise: false, glow: 0 }]);
    city(g, t, { lit: FW.deep, lk: clamp((t - T.cut[9] - 0.15) / 0.4) });
    glyph(g, 300, 1112, 0.86, t, { look: [0.4, -0.9], mood: 'aha', mouth: 'o' });
    screen(g);
    const kg = eo(clamp((t - (T.grail - 0.2)) / 0.4));
    mlabel(g, 'THE HOLY GRAIL OF FIREWORKS', 540, 920, kg, { size: 30, c: '#bcd0ff', align: 'center', bg: 'rgba(7,9,12,0.6)' });
  }
  function shIndia(g, t) {                                     // 10 · and in India, green has a problem too
    const T = times(); shotCam(g, t, 10, { push: 0.04, oy: 900 });
    sky(g);
    show(g, t, [{ x: 560, y: 470, t0: T.green11 - 0.15, col: FW.green, seed: 71, n: 90, v: 500, life: 2.4, glow: 0.3, rise: 0.55 }, { x: 240, y: 380, t0: T.cut[10] - 0.3, col: FW.gold, seed: 72, rise: false, glitter: true }]);
    city(g, t, { lit: FW.green, lk: clamp((t - T.green11) / 0.4) * 0.8 });
    glyph(g, 300, 1112, 0.86, t, { look: [0.5, -0.8], mood: 'neutral' });
    screen(g); eyebrow(g, 'INDIA', t, T.cut[10] + 0.05);
  }
  function shBan(g, t) {                                       // 11 · 2018: the Supreme Court banned barium; barium makes green
    const T = times(), slam = T.banned - 0.05; shotCam(g, t, 11, { push: 0.03, oy: 700, kicks: [[slam + 0.12, 14]] });
    sky(g); city(g, t); g.fillStyle = 'rgba(5,6,12,0.62)'; g.fillRect(-400, -400, W + 800, 1520);
    const kT = eo(clamp((t - T.cut[11] + 0.1) / 0.35));
    tile(g, 540, 640, 1.0, 'Ba', 56, 'BARIUM', FW.green, kT);
    const u = clamp((t - (slam - 0.35)) / 0.35), ang = lerp(-1.1, 0.05, u * u);
    if (t > slam - 0.6) gavel(g, 770, 420, ang);
    const kS = t > slam ? 1 : 0;
    if (kS) { g.save(); g.translate(540, 640); g.rotate(-0.12); g.strokeStyle = ACC; g.lineWidth = 10; g.strokeRect(-210, -60, 420, 120); font(g, 96, 700, 'condensed'); g.textAlign = 'center'; g.fillStyle = ACC; g.fillText('BANNED', 0, 34); g.restore(); }
    screen(g);
    mlabel(g, 'SUPREME COURT OF INDIA · ORDER OF 31 OCT 2018:', 540, 930, clamp((t - (T.y2018 - 0.1)) / 0.3), { size: 22, c: INK2, align: 'center' });
    mlabel(g, '“BARIUM SALTS IN THE MANUFACTURE OF FIRECRACKERS', 540, 966, clamp((t - (T.y2018 - 0.1)) / 0.3), { size: 22, c: INK, align: 'center' });
    mlabel(g, 'WILL NOT BE USED”', 540, 1000, clamp((t - (T.y2018 - 0.1)) / 0.3), { size: 22, c: INK, align: 'center' });
    mlabel(g, 'BARIUM = GREEN', 540, 1060, clamp((t - (T.makes - 0.1)) / 0.3), { size: 30, c: FW.green, align: 'center', bg: 'rgba(7,9,12,0.8)' });
  }
  function shGreenCracker(g, t) {                              // 12 · the green in green crackers means less pollution, not the colour
    const T = times(); shotCam(g, t, 12, { push: 0.03, oy: 900 });
    sky(g);
    const tB = T.pollution - 0.2;
    show(g, t, [{ x: 600, y: 470, t0: tB, col: FW.gold, seed: 81, n: 80, v: 460, glitter: true, rise: 0.6, dx: 0 }, { x: 600, y: 470, t0: tB + 0.25, col: FW.red, seed: 82, n: 50, v: 300, rise: false }]);
    city(g, t);
    crackerBox(g, 720, 1040, 0.55, eo(clamp((t - T.cut[12] + 0.1) / 0.35)));
    glyph(g, 300, 1112, 0.86, t, { look: t > tB ? [0.6, -0.9] : [0.9, 0.2], mood: t > T.colour13 - 0.3 ? 'skeptical' : 'neutral', prop: false, armR: [1.0, 0.2] });
    screen(g);
    mlabel(g, '"GREEN" = LOWER EMISSIONS (CSIR-NEERI)', 540, 860, clamp((t - (T.pollution - 0.1)) / 0.3), { size: 26, c: '#7fe0a0', align: 'center', bg: 'rgba(7,9,12,0.75)' });
  }
  function shFinale(g, t) {                                    // 13 · spot a deep blue this Diwali: the hardest colour in chemistry
    const T = times(); shotCam(g, t, 13, { push: 0.05, oy: 900 });
    const tb0 = T.blue14 - 0.25, kL = clamp((t - tb0) / 0.5) * (1 - 0.4 * clamp((t - tb0 - 2.6) / 1.5));
    sky(g, FW.deep, kL);
    show(g, t, [{ x: 250, y: 480, t0: T.cut[13] - 0.2, col: FW.red, seed: 91, rise: false }, { x: 820, y: 420, t0: T.cut[13] + 0.3, col: FW.gold, seed: 92, glitter: true },
      { x: 560, y: 520, t0: tb0, col: FW.deep, seed: 93, n: 120, v: 580, life: 3.0, glow: 0.42, rise: 0.6 },
      { x: 560, y: 520, t0: tb0 + 0.4, col: '#a8c0ff', seed: 94, n: 64, v: 320, life: 2.4, glitter: true, rise: false, glow: 0 }]);
    city(g, t, { lit: FW.deep, lk: kL });
    glyph(g, 300, 1112, 0.86, t, { look: t > tb0 ? [0.45, -0.95] : [Math.sin(t * 1.5) * 0.8, -0.6], mood: t > tb0 + 0.2 ? 'happy' : 'skeptical', armL: t > tb0 + 0.3 ? [2.5, -0.6] : [0.35, 0.2] });
  }
  const SHOTS = [shSky, shMetal, shPalette, shNoBlue, shCopper, shHot, shCool, shWindow, shChlorine, shGrail, shIndia, shBan, shGreenCracker, shFinale];

  // ================================================================ the film
  scene({
    name: 'film', from: 'hook', to: 'end',
    build(root, S) {
      S.g = canvas(root); under(root); S.g2 = canvas(root);       // the scene, the text zone's shade, the labels
      const L = (text, y, size, o = {}) => Object.assign(line(root, text, { x: X0, y, size, ...o }), { tone: o.tone, tones: o.tones });
      S.L = {
        h0a: L("Diwali's sky is", TZ - 16, 120), h0b: L('missing a colour.', TZ + 120, 120, { accent: [2], tone: 'blue' }),
        h1a: L('Every colour is', TZ - 16, 120), h1b: L('a burning metal.', TZ + 120, 120, { accent: [2], tone: 'gold' }),
        h2a: L('Red. Orange. Yellow. Green.', TZ - 16, 80, { tones: ['red', 'orange', 'yellow', 'green'] }),
        h3a: L('But a true blue?', TZ - 16, 120, { accent: [3], tone: 'blue' }), h3b: L('Almost impossible.', TZ + 120, 116),
        h4a: L('Blue comes from copper.', TZ - 16, 90, { accent: [3], tone: 'copper' }),
        h5a: L('Too hot:', TZ - 16, 130), h5b: L('blue turns white.', TZ + 124, 116, { accent: [0], tone: 'blue' }),
        h6a: L('Too cool:', TZ - 16, 130), h6b: L('it barely glows.', TZ + 124, 116),
        h7a: L('Blue lives in', TZ - 16, 130), h7b: L('a tiny window.', TZ + 124, 130, { accent: [2], tone: 'blue' }),
        h8a: L('Makers add chlorine,', TZ - 16, 104), h8b: L('even from plastic.', TZ + 116, 112, { accent: [2] }),
        h9a: L('The holy grail', TZ - 16, 130, { accent: [1, 2], tone: 'blue' }), h9b: L('of fireworks.', TZ + 124, 130),
        h10a: L("India's green", TZ - 16, 130, { accent: [1], tone: 'green' }), h10b: L('has a problem too.', TZ + 124, 112),
        h11a: L('2018: barium banned.', TZ - 16, 104, { accent: [2] }), h11b: L('Barium makes green.', TZ + 116, 104, { accent: [2], tone: 'green' }),
        h12a: L('"Green" crackers:', TZ - 16, 116, { accent: [0], tone: 'green' }), h12b: L('less pollution.', TZ + 120, 116),
        h13a: L('Spot a deep blue?', TZ - 16, 120, { accent: [3], tone: 'blue' }), h13b: L('Hardest colour in chemistry.', TZ + 116, 76),
      };
      for (const k of ['h11a']) S.L[k].words.forEach((w) => w.classList.add('tnum'));
    },
    run(t, b, S) {
      const T = times(), L = S.L, g = S.g, c = T.cut; clear(g); clear(S.g2); LBL = S.g2;
      let i = 0; while (i < SHOTS.length - 1 && t >= c[i + 1]) i++;
      SHOTS[i](g, t);
      const out = (k) => c[k + 1] - 0.05;
      const R = (Lx, tins, tout, lit, acc = []) => { rise(t, Lx, tins.map((x) => x - 0.06), tout); light(t, Lx, lit, acc); };
      rise(t, L.h0a, [-0.5, -0.45, -0.4], out(0)); light(t, L.h0a, wv('s01', 0, 1, 2));
      R(L.h0b, wv('s01', 3, 4, 5), out(0), wv('s01', 3, 4, 5), [2]);
      R(L.h1a, wv('s02', 0, 1, 4), out(1), wv('s02', 0, 1, 4)); R(L.h1b, wv('s02', 5, 6, 7), out(1), wv('s02', 5, 6, 7), [2]);
      R(L.h2a, wv('s03', 0, 3, 5, 7), out(2), wv('s03', 0, 3, 5, 7));
      R(L.h3a, wv('s04', 0, 1, 2, 3), out(3), wv('s04', 0, 1, 2, 3), [3]); R(L.h3b, wv('s04', 4, 5), out(3), wv('s04', 4, 5));
      R(L.h4a, wv('s05', 0, 1, 2, 3), out(4), wv('s05', 0, 1, 2, 3), [3]);
      R(L.h5a, wv('s06', 5, 6), out(5), wv('s06', 5, 6)); R(L.h5b, [wi('s06', 2), wi('s06', 9), T.white], out(5), [wi('s06', 2), wi('s06', 9), T.white], [0]);
      R(L.h6a, wv('s07', 0, 1), out(6), wv('s07', 0, 1)); R(L.h6b, wv('s07', 3, 4, 5), out(6), wv('s07', 3, 4, 5));
      R(L.h7a, wv('s08', 7, 8, 9), out(7), wv('s08', 7, 8, 9)); R(L.h7b, wv('s08', 10, 11, 12), out(7), wv('s08', 10, 11, 12), [2]);
      R(L.h8a, wv('s09', 0, 2, 3), out(8), wv('s09', 0, 2, 3)); R(L.h8b, wv('s09', 4, 5, 6), out(8), wv('s09', 4, 5, 6), [2]);
      R(L.h9a, wv('s10', 4, 5, 6), out(9), wv('s10', 4, 5, 6), [1, 2]); R(L.h9b, wv('s10', 7, 8), out(9), wv('s10', 7, 8));
      R(L.h10a, wv('s11', 2, 3), out(10), wv('s11', 2, 3), [1]); R(L.h10b, wv('s11', 4, 5, 6, 7), out(10), wv('s11', 4, 5, 6, 7));
      R(L.h11a, [T.y2018, T.barium, T.banned], out(11), [T.y2018, T.barium, T.banned], [2]); R(L.h11b, wv('s12', 11, 12, 13), out(11), wv('s12', 11, 12, 13), [2]);
      R(L.h12a, [T.gc, wi('s13', 5)], out(12), [T.gc, wi('s13', 5)], [0]); R(L.h12b, wv('s13', 7, 8), out(12), wv('s13', 7, 8));
      R(L.h13a, wv('s14', 2, 3, 4, 5), T.end - 0.05, wv('s14', 2, 3, 4, 5), [3]); R(L.h13b, wv('s14', 11, 12, 13, 14), T.end - 0.05, wv('s14', 11, 12, 13, 14));
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
