// Reel 29 · one man's face, a pure function of its numbers. Every photo on the table is this one rig with the same bones: the same skull, eyes,
// nose and ears, the same skin. What changes between photos is only what changes in a life: expression, the way he holds his head, his hair,
// spectacles, a moustache, a shave, a shirt. Any two looks can be mixed (mix), which is how four men become one.
// Our own drawing; nobody real. Head units: nose bridge near (0, 0), skull about ±186 wide, chin at +232.
window.FACE = (() => {
  const TAU = Math.PI * 2;
  const lerp = (a, b, x) => a + (b - a) * x;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
  const lg = (g, x0, y0, x1, y1, ...stops) => { const q = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const rg = (g, x, y, r0, r1, ...stops) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  // his skin never changes: the four "men" are one tone by construction
  const SKIN = { h: '#dcae87', m: '#c48e68', d: '#9b6847', ear: '#b67f5a', earD: '#94603f', line: '#3c1d18' };
  const HAIR = '#17110d';
  const hairC = (P) => { const a = [23, 17, 13], b = [205, 200, 192], u = P.hgrey; return rgb([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]); };

  // the numbers: every look fills in the ones it cares about, on top of NEUTRAL
  const NEUTRAL = {
    yaw: 0, pitch: 0, roll: 0, jaw: 1,
    browY: 0, browIn: 0, browOut: 0, open: 1, lookX: 0, lookY: 2, lidLow: 0, bags: 0, wet: 0, iris: 18,
    smile: 0.04, grin: 0, press: 0, must: 0, stub: 0, specs: 0,
    hv: 0.46, hm: 0, hp: -0.25, hs: 0.15, hf: 0.08, hgrey: 0, long: 0, bun: 0, wrinkle: 0, her: 0,
    shirt: [176, 182, 190], shirtD: [130, 136, 146], collar: 1, button: 0, pen: 0,
  };
  const LOOK = (o) => ({ ...NEUTRAL, ...o });
  function mix(A, B, u) {
    const out = {};
    for (const k of Object.keys(NEUTRAL)) {
      const a = A[k], b = B[k];
      out[k] = Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], u)) : lerp(a, b, u);
    }
    return out;
  }

  // eyes ---------------------------------------------------------------------------------------------
  function eye(g, k, cx, cy, P, scale = 1) {
    const w = 46 * scale, h = 25, open = Math.max(0, P.open);
    if (open < 0.06) {                                // shut
      g.strokeStyle = '#231510'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - w * 0.94, cy + 2); g.quadraticCurveTo(cx, cy + 12, cx + w * 0.94, cy + 2); g.stroke();
      return;
    }
    const up = h * 1.72 * open, dn = h * 1.02 * (1 - 0.62 * P.lidLow) * clamp(open * 1.3, 0.2, 1.15);
    const lift = 5 * P.lidLow;
    const shape = () => { g.beginPath(); g.moveTo(cx - w, cy + 3); g.quadraticCurveTo(cx - k * 6, cy - up, cx + w, cy + 3); g.quadraticCurveTo(cx + k * 6, cy + dn - lift, cx - w, cy + 3); g.closePath(); };
    if (P.bags > 0) {                                  // a night without sleep, under the eye
      ell(g, cx, cy + 26, w * 0.92, 16); g.fillStyle = `rgba(92,48,44,${0.34 * P.bags})`; g.fill();
      g.strokeStyle = `rgba(80,40,30,${0.5 * P.bags})`; g.lineWidth = 3.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - w * 0.74, cy + 26); g.quadraticCurveTo(cx, cy + 46, cx + w * 0.74, cy + 26); g.stroke();
    }
    g.save(); shape(); g.fillStyle = '#fbf7ee'; g.fill(); shape(); g.clip();
    const ix = cx + P.lookX, iy = cy - 3 + P.lookY, ir = P.iris;
    ell(g, ix, iy, ir, ir); g.fillStyle = rg(g, ix, iy, 2, ir, [0, '#553822'], [1, '#26170d']); g.fill();
    ell(g, ix, iy, ir * 0.52, ir * 0.52); g.fillStyle = '#060404'; g.fill();
    ell(g, ix - 6, iy - 7, 4.8, 4.8); g.fillStyle = 'rgba(255,255,255,0.94)'; g.fill();
    if (P.wet > 0) { ell(g, ix + 6, iy + 8, 3.6, 3.2); g.fillStyle = `rgba(255,255,255,${0.8 * P.wet})`; g.fill(); }
    g.fillStyle = 'rgba(40,20,10,0.16)'; g.fillRect(cx - w, cy - up - 3, w * 2, up * 0.62);
    if (P.wet > 0) { g.fillStyle = `rgba(190,225,240,${0.34 * P.wet})`; g.beginPath(); g.moveTo(cx - w, cy + 3); g.quadraticCurveTo(cx + k * 6, cy + dn - lift, cx + w, cy + 3); g.lineTo(cx + w, cy + dn + 8); g.lineTo(cx - w, cy + dn + 8); g.closePath(); g.fill(); }
    g.restore();
    g.strokeStyle = '#231510'; g.lineCap = 'round'; g.lineWidth = 6.5;
    g.beginPath(); g.moveTo(cx - w, cy + 3); g.quadraticCurveTo(cx - k * 6, cy - up, cx + w, cy + 3); g.stroke();
    g.strokeStyle = 'rgba(70,35,20,0.26)'; g.lineWidth = 3;                // the fold above
    g.beginPath(); g.moveTo(cx - w * 0.82, cy - up * 0.42 - 12); g.quadraticCurveTo(cx - k * 6, cy - up - 13, cx + w * 0.82, cy - up * 0.42 - 12); g.stroke();
    g.strokeStyle = 'rgba(40,20,10,0.32)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(cx - w * 0.82, cy + 4); g.quadraticCurveTo(cx + k * 6, cy + dn - lift, cx + w * 0.82, cy + 4); g.stroke();
    if (P.lidLow > 0 && !P.her) {                      // the crinkle of a real smile
      g.strokeStyle = `rgba(90,50,30,${0.42 * P.lidLow})`; g.lineWidth = 3.2;
      const ox = k > 0 ? cx + w + 8 : cx - w - 8, d = k > 0 ? 1 : -1;
      for (const a of [-14, 0, 14]) { g.beginPath(); g.moveTo(ox, cy + a * 0.4); g.lineTo(ox + d * 20, cy + a); g.stroke(); }
    }
  }

  // a brow is a tapered shape along an arc. His right brow (viewer's left, k = -1) has a small nick through it, in every photo.
  function brow(g, k, ex, ey, P) {
    const in0 = [k * (ex - 50), ey - 41 + P.browY - P.browIn];
    const ctl = [k * (ex + 6), ey - 62 + P.browY + 0.25 * P.browIn];
    const out = [k * (ex + 56), ey - 40 + P.browY * 0.45 + P.browOut];
    const at = (u) => [(1 - u) * (1 - u) * in0[0] + 2 * (1 - u) * u * ctl[0] + u * u * out[0], (1 - u) * (1 - u) * in0[1] + 2 * (1 - u) * u * ctl[1] + u * u * out[1]];
    const piece = (a, b) => {
      const top = [], bot = [], n = 18;
      for (let i = 0; i <= n; i++) {
        const u = lerp(a, b, i / n), [x, y] = at(u), th = lerp(9.5, 3.2, Math.pow(u, 1.25)) * (P.her ? 0.5 : 1);
        top.push([x, y - th]); bot.push([x, y + th * 0.82]);
      }
      g.beginPath(); g.moveTo(top[0][0], top[0][1]); for (let i = 1; i <= n; i++) g.lineTo(top[i][0], top[i][1]);
      for (let i = n; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]); g.closePath(); g.fill();
    };
    g.fillStyle = hairC(P);
    if (k < 0 && !P.noCut) {
      piece(0, 0.54); piece(0.7, 1);
      const [sx, sy] = at(0.615);
      g.strokeStyle = 'rgba(255,230,206,0.8)'; g.lineWidth = 3.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(sx + 6, sy - 24); g.lineTo(sx - 7, sy + 23); g.stroke();
    } else piece(0, 1);
  }

  // mouth --------------------------------------------------------------------------------------------
  function mouth(g, cx, cy, P) {
    const G = P.grin, press = P.press, s = P.smile;
    const w0 = 44 + 10 * press + 8 * Math.max(0, s);
    const lineA = 1 - sstep(0.03, 0.14, G);
    if (lineA > 0) {
      g.strokeStyle = rgb([60, 29, 24], lineA); g.lineCap = 'round'; g.lineWidth = lerp(6, 7.5, press);
      g.beginPath(); g.moveTo(cx - w0, cy - s * 14); g.quadraticCurveTo(cx, cy + 3 + s * 15, cx + w0, cy - s * 14); g.stroke();
      if (press < 0.5) { g.strokeStyle = rgb([125, 70, 59], lineA * (1 - press * 2) * 0.55); g.lineWidth = 4.5; g.beginPath(); g.moveTo(cx - w0 * 0.5, cy + 15 + s * 8); g.quadraticCurveTo(cx, cy + 22 + s * 10, cx + w0 * 0.5, cy + 15 + s * 8); g.stroke(); }
      if (press > 0) { g.strokeStyle = `rgba(70,35,20,${0.26 * press})`; g.lineWidth = 3; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(cx + k * (w0 + 3), cy - 8); g.quadraticCurveTo(cx + k * (w0 + 10), cy, cx + k * (w0 + 4), cy + 8); g.stroke(); } }
    }
    if (G > 0.02) {
      const w = 48 + 46 * G, ey = cy - 22 * G, top = 6 * G, bot = 70 * G;
      const shape = () => { g.beginPath(); g.moveTo(cx - w, ey); g.bezierCurveTo(cx - w * 0.6, ey + top + 6, cx + w * 0.6, ey + top + 6, cx + w, ey); g.bezierCurveTo(cx + w * 0.72, ey + bot * 1.36, cx - w * 0.72, ey + bot * 1.36, cx - w, ey); g.closePath(); };
      g.save(); shape(); g.fillStyle = '#2a0f0d'; g.fill(); shape(); g.clip();
      g.fillStyle = '#f8f3e6'; g.fillRect(cx - w - 4, ey - 8, 2 * w + 8, top + bot * 0.56 + 10);
      g.strokeStyle = 'rgba(120,100,84,0.34)'; g.lineWidth = 2.2; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(cx + i * 21, ey); g.lineTo(cx + i * 20, ey + bot * 0.6); g.stroke(); }
      ell(g, cx, ey + bot * 1.16, w * 0.5, bot * 0.3); g.fillStyle = '#9b4f48'; g.fill();
      g.restore();
      shape(); g.strokeStyle = '#6e3a30'; g.lineWidth = 5.5; g.lineJoin = 'round'; g.stroke();
    }
  }
  function moustache(g, cx, cy, amt, col) {
    if (amt <= 0.01) return;
    const w = 26 + 44 * amt, th = 8 + 24 * amt;
    g.save(); g.globalAlpha *= sstep(0, 0.4, amt);
    g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - 44);
    g.bezierCurveTo(cx - 18, cy - 52, cx - w * 0.72, cy - 48, cx - w, cy - 6);
    g.bezierCurveTo(cx - w * 0.7, cy - 44 + th, cx - 24, cy - 42 + th, cx, cy - 34 + th * 0.3);
    g.bezierCurveTo(cx + 24, cy - 42 + th, cx + w * 0.7, cy - 44 + th, cx + w, cy - 6);
    g.bezierCurveTo(cx + w * 0.72, cy - 48, cx + 18, cy - 52, cx, cy - 44); g.closePath(); g.fill();
    g.restore();
  }
  function specs(g, ex, ey, cx0, P) {
    const a = P.specs; if (a <= 0.01) return;
    g.save(); g.globalAlpha *= sstep(0, 0.5, a);
    const dy = (1 - a) * -46;
    g.strokeStyle = '#17141a'; g.lineWidth = 10; g.lineJoin = 'round';
    for (const k of [-1, 1]) {
      const x = cx0 + k * ex, w = 68, h = 54;
      g.beginPath(); g.roundRect(x - w, ey - h + dy + 2, 2 * w, 2 * h - 2, 22);
      g.fillStyle = 'rgba(215,235,245,0.14)'; g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - w + 16, ey - h + 12 + dy); g.lineTo(x - w + 44, ey - h + 12 + dy); g.stroke();
      g.strokeStyle = '#17141a'; g.lineWidth = 10;
      g.beginPath(); g.moveTo(x + k * w, ey - 22 + dy); g.lineTo(x + k * (w + 54), ey - 30 + dy); g.stroke();
    }
    g.beginPath(); g.moveTo(cx0 - ex + 68, ey - 10 + dy); g.quadraticCurveTo(cx0, ey - 30 + dy, cx0 + ex - 68, ey - 10 + dy); g.stroke();
    g.restore();
  }

  // the hair: one contour from numbers, so it can flow from one cut to another
  const tri = (x) => { const f = x - Math.floor(x); return f < 0.5 ? f * 2 : 2 - f * 2; };
  function hair(g, P, hw) {
    const hx = hw + 8, top = 266 + lerp(16, 76, P.hv), N = 72, pts = [];
    const cy = -74;
    for (let i = 0; i <= N; i++) {                     // over the top, from his right temple to his left
      const a = lerp(Math.PI * 1.035, Math.PI * 1.965, i / N), sx = Math.cos(a), sy = Math.sin(a);
      const edge = Math.min(1, Math.min(i, N - i) / 8);
      const puff = 1 + 0.03 * P.hv * Math.sin(i * 0.2);
      let dr = P.hm * edge * (12 + 34 * tri(i * 0.145 + 0.2) * tri(i * 0.052 + 0.1));
      dr *= 1 - 0.3 * Math.abs(sx);
      pts.push([sx * (hx + 12 * P.hv + dr * 0.8) * puff, cy + sy * (top + cy + dr)]);
    }
    const hairline = [], n2 = 44, px = P.hp * 118;
    for (let i = 0; i <= n2; i++) {                    // across the forehead, right to left
      const x = lerp(hx - 2, -hx + 2, i / n2), ax = Math.abs(x) / hx;
      let y = lerp(-208 - 12 * P.hs, -92, Math.pow(ax, 3.4));
      y += P.hf * 58 * Math.exp(-Math.pow((x - px * 0.5) / 120, 2));
      y -= 15 * Math.exp(-Math.pow((x - px) / 16, 2)) * (1 - P.hm);   // the parting
      y += P.hm * (12 * tri(i * 0.33 + 0.1) + 12 * tri(i * 0.11)) * (1 - Math.pow(ax, 4));
      hairline.push([x, y]);
    }
    g.fillStyle = hairC(P); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    for (let i = 0; i < hairline.length; i++) g.lineTo(hairline[i][0], hairline[i][1]);
    g.closePath(); g.fill();
    if (!P.her) for (const k of [-1, 1]) {             // sideburns
      g.beginPath(); g.moveTo(k * (hx + 2), -112); g.lineTo(k * (hx - 1), -46); g.lineTo(k * (hx - 21), -58); g.lineTo(k * (hx - 26), -116); g.closePath(); g.fill();
    }
    // the sheen, combed the way the hair goes
    g.save(); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); for (let i = 0; i < hairline.length; i++) g.lineTo(hairline[i][0], hairline[i][1]); g.closePath(); g.clip();
    g.strokeStyle = `rgba(255,255,255,${0.04 + 0.08 * P.hs})`; g.lineCap = 'round'; g.lineWidth = 4.5;
    for (let i = -7; i <= 7; i++) {
      if (i % 2 && Math.abs(i) > 2) continue;              // uneven, like hair
      const x0 = i * 26 + px * 0.25 + 5 * Math.sin(i * 2.3), y0 = -196 - 8 * Math.cos(i * 0.21), len = 70 + 34 * Math.abs(Math.sin(i * 1.7));
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + i * 7, y0 - len * 0.44, x0 + i * 14, y0 - len); g.stroke();
    }
    if (P.hs < 0.8 && P.hm < 0.6) { g.strokeStyle = `rgba(255,255,255,${0.24 * (1 - P.hm)})`; g.lineWidth = 3.5; g.beginPath(); g.moveTo(px, -212); g.quadraticCurveTo(px * 1.05, -260, px * 1.14, -300); g.stroke(); }
    g.restore();
  }

  // a head and shoulders, drawn around (0, 0). o: { blank } draws no face (for a figure far away)
  function draw(g, P, o = {}) {
    const hw = 186 * P.jaw, ex = 80, ey = -28 - P.pitch * 15;
    const fx = P.yaw * 24, chin = 232 + 10 * P.grin, by = 168;
    g.save();
    if (P.long > 0.01) {                               // long hair falls behind the shoulders, rounded
      g.save(); g.translate(0, 190); g.rotate(P.roll); g.translate(0, -190);
      g.fillStyle = hairC(P); g.beginPath(); g.moveTo(-220, -120);
      g.bezierCurveTo(-262, 20, -262, 190, -214, 300); g.bezierCurveTo(-180, 372, 180, 372, 214, 300); g.bezierCurveTo(262, 190, 262, 20, 220, -120); g.closePath(); g.fill();
      g.restore();
    }
    // the bust: it barely moves when the head does
    if (o.bust !== false) {
      g.fillStyle = lg(g, -330, by, 330, by + 600, [0, rgb(P.shirt)], [1, rgb(P.shirtD)]);
      g.beginPath(); g.moveTo(-340, by + 900); g.lineTo(-340, by + 430); g.bezierCurveTo(-336, by + 200, -230, by + 130, -96, by + 96); g.lineTo(96, by + 96); g.bezierCurveTo(230, by + 130, 336, by + 200, 340, by + 430); g.lineTo(340, by + 900); g.closePath(); g.fill();
      const nw = 70;
      g.fillStyle = lg(g, -80, 0, 80, 0, [0, SKIN.d], [0.55, SKIN.m], [1, SKIN.d]);
      g.beginPath(); g.moveTo(-nw, 120); g.lineTo(-nw - 8, by + 118); g.quadraticCurveTo(0, by + 210, nw + 8, by + 118); g.lineTo(nw, 120); g.closePath(); g.fill();
      g.fillStyle = 'rgba(70,35,20,0.28)'; g.beginPath(); g.moveTo(-nw, 150); g.quadraticCurveTo(0, 235, nw, 150); g.lineTo(nw, 120); g.lineTo(-nw, 120); g.closePath(); g.fill();
      // the collar: 1 a shirt, 0 a round neck
      if (P.collar > 0.5) {
        const a = sstep(0.5, 1, P.collar);
        g.save(); g.globalAlpha *= a; g.fillStyle = lg(g, -180, by + 60, 180, by + 220, [0, rgb(P.shirt.map((v) => Math.min(255, v + 22)))], [1, rgb(P.shirt)]);
        for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 8, by + 200); g.lineTo(k * 92, by + 62); g.lineTo(k * 182, by + 104); g.lineTo(k * 126, by + 222); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 4; g.stroke(); }
        g.restore();
      }
      if (P.collar < 0.5) { const a = 1 - sstep(0, 0.5, P.collar); g.strokeStyle = rgb(P.shirtD, a); g.lineWidth = 16; g.beginPath(); g.moveTo(-92, by + 96); g.quadraticCurveTo(0, by + 196, 92, by + 96); g.stroke(); }
      if (P.button > 0.01) { g.save(); g.globalAlpha *= P.button; g.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 3; i++) { ell(g, 0, by + 232 + i * 92, 9, 9); g.fill(); } g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-22, by + 200); g.lineTo(-22, by + 900); g.moveTo(22, by + 200); g.lineTo(22, by + 900); g.stroke(); g.restore(); }
      if (P.pen > 0.01) { g.save(); g.globalAlpha *= P.pen; g.translate(170, by + 280); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(-62, 0, 124, 8); g.fillStyle = '#1b3fa8'; g.beginPath(); g.roundRect(-8, -56, 16, 62, 5); g.fill(); g.fillStyle = '#d0d4da'; g.fillRect(-3, -66, 6, 14); g.restore(); }
    }

    g.translate(0, 190); g.rotate(P.roll); g.translate(0, -190);
    if (P.bun > 0.01) { g.fillStyle = hairC(P); ell(g, 0, -326, 82, 62); g.fill(); }
    // ears: the far one tucks behind the head, the near one comes round
    for (const k of [-1, 1]) {
      const ex2 = k * (hw + 1) - P.yaw * 15, wE = 25 * (1 - k * P.yaw * 0.34);
      ell(g, ex2, -18 - P.pitch * 8, wE, 42, k * 0.08); g.fillStyle = SKIN.m; g.fill();
      ell(g, ex2 + k * 2, -16 - P.pitch * 8, wE * 0.48, 24, k * 0.08); g.fillStyle = SKIN.d; g.fill();
    }
    const path = () => {
      g.beginPath(); g.moveTo(-hw, -40);
      g.bezierCurveTo(-hw - 4, -216, -100, -266, 0, -266); g.bezierCurveTo(100, -266, hw + 4, -216, hw, -40);
      g.bezierCurveTo(hw + 4, 58, 152, 150, 88, 205);
      g.bezierCurveTo(60, chin - 4, 28, chin, 0, chin); g.bezierCurveTo(-28, chin, -60, chin - 4, -88, 205);
      g.bezierCurveTo(-152, 150, -hw - 4, 58, -hw, -40); g.closePath();
    };
    path(); g.fillStyle = lg(g, -hw, -200, hw, 240, [0, SKIN.h], [0.45, SKIN.m], [1, SKIN.d]); g.fill();
    g.save(); path(); g.clip();
    g.fillStyle = rg(g, fx, -40, 150, 330, [0, 'rgba(90,45,25,0)'], [1, 'rgba(90,45,25,0.3)']); g.fillRect(-300, -300, 600, 700);
    if (P.stub > 0.01) {
      g.fillStyle = lg(g, 0, 56, 0, 190, [0, 'rgba(30,22,18,0)'], [1, `rgba(30,22,18,${0.5 * P.stub})`]); g.fillRect(-300, 56, 600, 320);
      let s = 5; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      g.fillStyle = `rgba(20,14,10,${0.42 * P.stub})`;
      for (let i = 0; i < 170; i++) { const x = (rnd() - 0.5) * 2 * hw * 0.92, y = 82 + rnd() * 150; if (Math.abs(x) < 118 || y > 130) { ell(g, x + fx * 0.6, y, 1.9, 1.9); g.fill(); } }
    }
    if (P.grin > 0.02) { for (const k of [-1, 1]) { g.fillStyle = `rgba(255,190,160,${0.2 * P.grin})`; ell(g, k * 104 + fx, 58, 42, 26); g.fill(); } }
    g.restore();

    if (!o.blank) {
      const my = 118 - P.pitch * 18, ny = 44 - P.pitch * 15, nx = P.yaw * 36;
      if (P.grin > 0.02 || P.press > 0.02) {           // the folds from the nose to the mouth
        const a = Math.max(0.42 * P.grin, 0.05 * P.press, 0.32 * P.wrinkle);
        g.strokeStyle = `rgba(90,50,30,${a})`; g.lineWidth = 4; g.lineCap = 'round';
        for (const k of [-1, 1]) { g.beginPath(); g.moveTo(fx + k * 46, ny + 14); g.quadraticCurveTo(fx + k * (82 + 26 * P.grin), my - 18, fx + k * (72 + 34 * P.grin), my + 16); g.stroke(); }
      }
      mouth(g, fx * 1.05, my, P);
      if (P.her && P.grin < 0.1) {                       // her lips
        const w = 40, cx = fx * 1.05, sm = P.smile * 12;
        g.fillStyle = '#b4453f'; g.beginPath(); g.moveTo(cx - w, my - sm); g.quadraticCurveTo(cx - 14, my - 15 - sm * 0.2, cx, my - 7); g.quadraticCurveTo(cx + 14, my - 15 - sm * 0.2, cx + w, my - sm);
        g.quadraticCurveTo(cx, my + 24 + sm * 0.5, cx - w, my - sm); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(60,20,20,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - w, my - sm); g.quadraticCurveTo(cx, my + 4 + sm * 0.9, cx + w, my - sm); g.stroke();
      }
      moustache(g, fx * 1.05, my, P.must, hairC(P));
      g.fillStyle = 'rgba(90,45,25,0.22)'; ell(g, nx, ny + 15, 36, 9); g.fill();
      g.strokeStyle = 'rgba(90,45,25,0.26)'; g.lineWidth = 3.5; g.lineCap = 'round';
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(nx * 0.8 + k * 22, ny - 18); g.quadraticCurveTo(nx + k * 31, ny, nx + k * 25, ny + 10); g.stroke(); }
      for (const k of [-1, 1]) { ell(g, nx + k * 13, ny + 9, 8, 4.6, k * 0.25); g.fillStyle = '#4a2416'; g.fill(); }
      g.fillStyle = 'rgba(255,240,226,0.1)'; ell(g, nx - 5, ny - 8, 10, 15); g.fill();
      for (const k of [-1, 1]) eye(g, k, fx + k * ex, ey, P, 1 - k * P.yaw * 0.07);
      for (const k of [-1, 1]) { g.save(); g.translate(fx, 0); brow(g, k, ex, ey, P); g.restore(); }
      specs(g, ex, ey, fx, P);
    }
    hair(g, P, hw);
    g.restore();
  }

  return { NEUTRAL, LOOK, mix, draw, SKIN };
})();
