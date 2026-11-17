// Reel 42 · What Did He Take?: the street. Adapted from reel 37's lane (tag source/reel-37-youre-the-thief, film/world.js: the
// floor and its litter, the shop fronts, the boards, the bulbs), changed for a camera that looks ACROSS the lane at one wall
// and tracks along it, and a wall that repeats every L metres so the film loops with no seam. The chai stall is reel 36's
// design (tag source/reel-36-find-him, chaiStall: the dark mouth and its jars, the counter, the kettle on its flame and its
// steam, the glasses, the blue awning with its scallops and bulbs, CHAI 10/-), rebuilt here in this camera's 3D.
// Metres. X across the lane (the building line is at -LW, the camera stands near +LW), Y up, Z along it. Pure functions of
// the camera and a clock.
(() => {
  const C = window.C, R = window.RIG, { clamp, lerp, mulberry32 } = C, { mix, poly3, line3, TAU } = R;
  const LW = 2.3, L = 6.5;
  const lg = (g, x0, y0, x1, y1, ...stops) => { const q = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const rg = (g, x, y, r0, r1, ...stops) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([p, c]) => q.addColorStop(p, c)); return q; };
  const GOODS = ['#e8413a', '#f0c32a', '#2fa5d6', '#e8712a', '#b94fd0', '#4fb06a', '#f2f0e6', '#2d5fae'];

  // ---- one period of the wall (Z is the period's own; everything repeats every L metres)
  // the chai stall: a recess in the building, its counter out in the lane
  const ST = { z0: -3.05, z1: 0.3, back: -3.05, cx0: -2.38, cx1: -1.78, ctop: 1.02 };
  // the rest of the period: a shuttered shop with posters, and a strip of plain wall
  const SHUT = { z0: ST.z1 - L + 0.05, z1: ST.z0 - 0.05 };
  const POSTERS = [[-3.98, 1.05, 0.42, 0.58, "#e8413a", "#fff3cf"], [-3.5, 1.2, 0.36, 0.48, "#2fa5d6", "#ffe9a8"]];
  const LITTER = (() => { const r = mulberry32(4288), out = []; for (let i = 0; i < 90; i++) { const c = r(); out.push({ X: -LW + 0.1 + r() * (2 * LW - 0.2), Z: r() * L, rot: r() * 3, k: c > 0.3 ? 0 : 1, col: c > 0.55 ? '#f39a1e' : c > 0.3 ? '#f7c52b' : r() > 0.5 ? '#7fa83e' : '#c79a4a' }); } return out; })();
  const lit = (c, k = 0) => mix(c, '#fff0d8', 0.06 + k);              // the wall faces the low sun
  const periods = (cam, m = 6) => { const out = []; for (let k = Math.floor((cam.z - m - ST.z1) / L); k <= Math.ceil((cam.z + m - SHUT.z0) / L); k++) out.push(k); return out; };
  const quadX = (g, cam, X, za, zb, ya, yb, fill) => poly3(g, cam, [[X, ya, za], [X, ya, zb], [X, yb, zb], [X, yb, za]], fill);
  const quadY = (g, cam, Y, xa, xb, za, zb, fill) => poly3(g, cam, [[xa, Y, za], [xb, Y, za], [xb, Y, zb], [xa, Y, zb]], fill);
  const quadZ = (g, cam, Z, xa, xb, ya, yb, fill) => poly3(g, cam, [[xa, ya, Z], [xb, ya, Z], [xb, yb, Z], [xa, yb, Z]], fill);

  // the floor, the building line, the shutter, the stall's mouth (everything behind the chaiwala)
  function back(g, cam, tw) {
    if (poly3(g, cam, [[-LW, 0, cam.z - 12], [LW, 0, cam.z - 12], [LW, 0, cam.z + 12], [-LW, 0, cam.z + 12]], null)) {
      const top = cam.P(-LW, 0, cam.z);
      g.fillStyle = lg(g, 0, top ? top[1] : 1300, 0, 1920, [0, '#d5ba90'], [0.5, '#c2a57f'], [1, '#a98c6c']); g.fill();
      g.save(); g.clip();
      poly3(g, cam, [[-LW, 0, cam.z - 12], [-LW + 0.7, 0, cam.z - 12], [-LW + 0.7, 0, cam.z + 12], [-LW, 0, cam.z + 12]], 'rgba(70,40,48,0.10)');
      g.strokeStyle = 'rgba(70,55,35,0.17)'; g.lineWidth = 2; g.beginPath();
      for (let z = Math.floor((cam.z - 9) / 0.65) * 0.65; z < cam.z + 9; z += 0.65) line3(g, cam, [-LW, 0, z], [LW, 0, z]);
      for (let i = -5; i <= 5; i++) line3(g, cam, [i * 0.4, 0, cam.z - 9], [i * 0.4, 0, cam.z + 9]);
      g.stroke();
      for (const k of periods(cam)) for (const p of LITTER) {
        const Z = p.Z + k * L; if (Math.abs(Z - cam.z) > 5) continue;
        const q = cam.P(p.X, 0, Z); if (!q || q[2] < 28) continue; const s = q[2];
        g.save(); g.translate(q[0], q[1]); g.scale(1, 0.42); g.rotate(p.rot); g.fillStyle = p.col;
        if (p.k === 0) { g.beginPath(); g.ellipse(0, 0, 0.018 * s, 0.01 * s, 0, 0, TAU); g.fill(); } else { g.beginPath(); g.moveTo(-0.05 * s, 0); g.quadraticCurveTo(0, -0.022 * s, 0.05 * s, 0); g.quadraticCurveTo(0, 0.022 * s, -0.05 * s, 0); g.fill(); }
        g.restore();
      }
      g.restore();
    }
    for (const k of periods(cam)) {
      const dz = k * L, z0 = ST.z0 + dz, z1 = ST.z1 + dz, s0 = SHUT.z0 + dz, s1 = SHUT.z1 + dz, X = -LW;
      // the building line: the wall over the shutter and round the stall
      quadX(g, cam, X, s0 - 0.05, s1 + 0.05, 0, 5, lit('#c5b8ea'));
      quadX(g, cam, X, s1 + 0.05, z0 + 0.02, 0, 5, lit('#e9b3c6'));
      quadX(g, cam, X, z1 - 0.02, z1 + 0.06, 0, 5, lit('#e9b3c6'));
      quadX(g, cam, X, z0, z1, 3.08, 5, lit('#ecd9a8'));
      // the shutter, and the posters on the wall beside it
      quadX(g, cam, X + 0.01, s0 + 0.1, s1 - 1.15, 0, 2.6, lit("#8d9197"));
      for (let y = 0.2; y < 2.6; y += 0.125) quadX(g, cam, X + 0.011, s0 + 0.1, s1 - 1.15, y, y + 0.025, lit("#6f747b"));
      quadX(g, cam, X + 0.012, s0 + 0.07, s1 - 1.12, 2.6, 2.95, lit("#7b8087"));
      for (const [z, y, w, h, c, c2] of POSTERS) { quadX(g, cam, X + 0.013, z + dz, z + w + dz, y, y + h, mix(c, '#f6ead8', 0.3)); quadX(g, cam, X + 0.014, z + w * 0.12 + dz, z + w * 0.88 + dz, y + h * 0.62, y + h * 0.86, mix(c2, '#f6ead8', 0.2)); quadX(g, cam, X + 0.014, z + w * 0.12 + dz, z + w * 0.7 + dz, y + h * 0.16, y + h * 0.24, mix(c2, '#f6ead8', 0.3)); }
      // the stall's mouth: the back wall, the side walls, the ceiling, the shelves, a bulb
      quadX(g, cam, ST.back, z0 + 0.06, z1 - 0.06, 0, 3.08, '#2e2017');
      quadZ(g, cam, z0 + 0.06, ST.back, X, 0, 3.08, '#3a291d');
      quadZ(g, cam, z1 - 0.06, ST.back, X, 0, 3.08, '#241911');
      quadY(g, cam, 3.08, ST.back, X, z0 + 0.06, z1 - 0.06, '#1d140e');
      // a warm glow from the bulb on the back wall
      { const c = cam.P(ST.back, 2.2, (z0 + z1) / 2 - 0.4); if (c) { const r = 1.9 * c[2]; g.fillStyle = rg(g, c[0], c[1], 0, r, [0, 'rgba(255,190,110,0.32)'], [1, 'rgba(255,190,110,0)']); g.fillRect(c[0] - r, c[1] - r, r * 2, r * 2); } }
      // two shelves of glass jars (biscuits, rusks, sweets), lids in plain colours, no labels
      const JAR = ['#d9a85a', '#e8c98a', '#c9773a', '#f0d9a0', '#b85a3a', '#e6b34a'], LID = ['#c8352d', '#2a6fb0', '#e2a92a', '#8a4fb8'];
      for (const [y0, n] of [[1.36, 9], [1.86, 8]]) {
        quadX(g, cam, ST.back + 0.26, z0 + 0.3, z1 - 0.3, y0 - 0.045, y0, '#6a4528');
        quadY(g, cam, y0, ST.back, ST.back + 0.26, z0 + 0.3, z1 - 0.3, '#7a5230');
        for (let j = 0; j < n; j++) {
          const zc = z0 + 0.45 + (j + 0.5) * (z1 - z0 - 0.9) / n, p = cam.P(ST.back + 0.14, y0, zc); if (!p) continue;
          const s = p[2], w = 0.15 * s, h = (0.22 + 0.04 * ((j * 5 + n) % 3)) * s, x = p[0], y = p[1], ci = (j * 3 + n) % JAR.length;
          g.fillStyle = 'rgba(255,248,235,0.18)'; g.beginPath(); g.roundRect(x - w / 2, y - h, w, h, w * 0.18); g.fill();
          g.fillStyle = mix(JAR[ci], '#2e2017', 0.12); g.beginPath(); g.roundRect(x - w * 0.44, y - h * 0.82, w * 0.88, h * 0.78, w * 0.14); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(x - w * 0.36, y - h * 0.78, w * 0.08, h * 0.66);
          g.fillStyle = mix(LID[(j + n) % LID.length], '#2e2017', 0.1); g.beginPath(); g.roundRect(x - w * 0.42, y - h - 0.035 * s, w * 0.84, 0.045 * s, 0.01 * s); g.fill();
        }
      }
      // strips of snack packets hanging across the front of the mouth (shiny foil, plain colours)
      const PK = ['#d8dde4', '#e2407a', '#f0c32a', '#2fa5d6', '#e8712a'];
      for (let j = 0; j < 13; j++) {
        const zc = z0 + 0.2 + (j + 0.5) * (z1 - z0 - 0.4) / 13, top = cam.P(X - 0.08, 2.78, zc); if (!top) continue;
        const s = top[2], w = 0.1 * s;
        for (let i = 0; i < 4; i++) { const y = top[1] + i * 0.12 * s, c = PK[(j * 2 + i) % PK.length]; g.fillStyle = lg(g, top[0] - w / 2, 0, top[0] + w / 2, 0, [0, mix(c, '#000000', 0.18)], [0.45, mix(c, '#ffffff', 0.35)], [1, mix(c, '#000000', 0.25)]); g.beginPath(); g.roundRect(top[0] - w / 2, y, w, 0.11 * s, 0.012 * s); g.fill(); }
      }
      { const a = cam.P(X - 0.08, 2.78, z0 + 0.15), b = cam.P(X - 0.08, 2.78, z1 - 0.15); if (a && b) { g.strokeStyle = 'rgba(30,22,16,0.8)'; g.lineWidth = Math.max(1, 0.008 * a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
      const bp = cam.P(ST.back + 0.6, 2.75, (z0 + z1) / 2 - 0.4); if (bp) { g.strokeStyle = 'rgba(20,14,10,0.8)'; g.lineWidth = 2; const top = cam.P(ST.back + 0.6, 3.08, (z0 + z1) / 2 - 0.4); if (top) { g.beginPath(); g.moveTo(top[0], top[1]); g.lineTo(bp[0], bp[1]); g.stroke(); } bulb(g, bp[0], bp[1], bp[2], 1.2); }
      // the platform he stands on
      quadX(g, cam, ST.cx0 - 0.02, z0 + 0.06, z1 - 0.06, 0, 0.32, '#3e2a1c');
    }
  }
  // the counter and what's on it (in front of the chaiwala, behind the customers). items(k): this period's state
  function counter(g, cam, tw, items) {
    for (const k of periods(cam)) {
      const dz = k * L, z0 = ST.z0 + 0.12 + dz, z1 = ST.z1 - 0.1 + dz, { cx0, cx1, ctop } = ST;
      quadY(g, cam, ctop, cx0, cx1 + 0.04, z0, z1, '#c99a5e');                       // the top, worn pale
      quadY(g, cam, ctop + 0.001, cx1 - 0.05, cx1 + 0.04, z0, z1, '#e2b97c');        // its front lip
      quadZ(g, cam, z1, cx0, cx1 + 0.04, 0, ctop, '#5a3519');                        // its end
      quadX(g, cam, cx1 + 0.04, z0, z1, 0, ctop, '#7a4a24');                         // its front
      for (let i = 1; i < 5; i++) quadX(g, cam, cx1 + 0.041, z0, z1, i * 0.2, i * 0.2 + 0.014, 'rgba(0,0,0,0.16)');
      // CHAI 10/- painted on the front
      boardText(g, cam, [cx1 + 0.042, 0.92, z1 - 2.1], [cx1 + 0.042, 0.92, z1 - 0.5], [cx1 + 0.042, 0.52, z1 - 2.1], 'CHAI 10/-', '#f6ecd2', { aspect: 1.6 / 0.4 });
      // the stove and the kettle at the back of the counter, its flame and its steam
      const kz = z0 + 1.22, kp = cam.P(cx0 + 0.2, ctop, kz);
      if (kp) {
        const s = kp[2];
        g.fillStyle = '#2a2a2e'; g.beginPath(); g.roundRect(kp[0] - 0.16 * s, kp[1] - 0.12 * s, 0.32 * s, 0.12 * s, 0.02 * s); g.fill();
        const fl = 0.85 + 0.15 * Math.sin(tw * 13 + k) * Math.sin(tw * 7.3);
        g.fillStyle = rg(g, kp[0], kp[1] - 0.13 * s, 0, 0.12 * s, [0, `rgba(255,170,60,${0.9 * fl})`], [1, 'rgba(255,120,40,0)']); g.beginPath(); g.ellipse(kp[0], kp[1] - 0.13 * s, 0.13 * s, 0.035 * s, 0, 0, TAU); g.fill();
        g.fillStyle = lg(g, kp[0] - 0.13 * s, 0, kp[0] + 0.13 * s, 0, [0, '#c8ccd2'], [0.4, '#9aa0a8'], [1, '#62676e']);
        g.beginPath(); g.roundRect(kp[0] - 0.13 * s, kp[1] - 0.42 * s, 0.26 * s, 0.29 * s, 0.05 * s); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.roundRect(kp[0] - 0.1 * s, kp[1] - 0.4 * s, 0.035 * s, 0.24 * s, 0.015 * s); g.fill();
        g.strokeStyle = '#6a6e74'; g.lineWidth = 0.02 * s; g.beginPath(); g.arc(kp[0] + 0.13 * s, kp[1] - 0.3 * s, 0.07 * s, -1.2, 1.2); g.stroke();
        steam(g, kp[0], kp[1] - 0.44 * s, tw, s / 900, 0.55);
      }
      // a tray of clean glasses
      for (let i = 0; i < 5; i++) { const p = cam.P(cx0 + 0.3, ctop, z0 + 0.32 + i * 0.075); if (p) glass(g, p[0], p[1] - 0.05 * p[2], p[2] * 0.00042, 0); }
      if (items) items(g, k, dz);
    }
  }
  // the awning out over the lane, and its bulbs (over everyone)
  function awning(g, cam, tw) {
    for (const k of periods(cam)) {
      const dz = k * L, z0 = ST.z0 + dz, z1 = ST.z1 + dz, X = -LW, a0 = 3.06, a1 = 2.6, out = 1.0, ns = 12;
      for (let m = 0; m < ns; m++) {
        const za = z0 - 0.12 + m * (z1 - z0 + 0.24) / ns, zb = za + (z1 - z0 + 0.24) / ns;
        poly3(g, cam, [[X, a0, za], [X, a0, zb], [X + out, a1, zb], [X + out, a1, za]], m % 2 ? '#2a5f97' : '#255688');
      }
      for (let m = 0; m < ns; m++) {
        const za = z0 - 0.12 + m * (z1 - z0 + 0.24) / ns, zb = za + (z1 - z0 + 0.24) / ns;
        const p = cam.P(X + out, a1, za), q = cam.P(X + out, a1, zb), md = cam.P(X + out, a1 - 0.17, (za + zb) / 2);
        if (p && q && md) { g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(md[0], md[1] + (md[1] - p[1]) * 0.7, q[0], q[1]); g.closePath(); g.fillStyle = '#1f4f82'; g.fill(); }
      }
      for (let m = 0; m <= 10; m++) { const zz = z0 + 0.05 + m * (z1 - z0 - 0.1) / 10, p = cam.P(X + out - 0.04, a1 - 0.14 - 0.05 * Math.sin(m / 10 * Math.PI), zz); if (p) bulb(g, p[0], p[1], p[2], 0.85 + 0.15 * Math.sin(tw * 3 + m)); }
    }
  }
  function steam(g, x, y, t, s, a = 0.5) {
    g.save(); g.lineCap = 'round'; g.lineWidth = 0.03 * s * 900; g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
    for (let k = 0; k < 3; k++) { const ph = t * 1.1 + k * 2.1; g.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, px = x + ((k - 1) * 0.06 + Math.sin(ph + u * 5) * 0.03 * u) * s * 900, py = y - u * 0.36 * s * 900; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.globalAlpha = 0.5 * (1 - 0.0); g.stroke(); g.globalAlpha = 1; }
    g.restore();
  }
  // the cutting-chai glass, ribbed (reel 20's, via reel 36). Its centre is the origin; s scales its 240-unit height. fill 0–1
  function glass(g, x, y, s, fill = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(245,240,230,0.42)'; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.lineTo(72, 130); g.lineTo(-72, 130); g.closePath(); g.fill();
    if (fill > 0) { g.save(); const top = lerp(124, -74, fill); g.beginPath(); g.moveTo(-90 + (top + 74) * 0.1, top); g.lineTo(90 - (top + 74) * 0.1, top); g.lineTo(70, 124); g.lineTo(-70, 124); g.closePath(); g.clip(); g.fillStyle = lg(g, -90, -74, 90, 124, [0, '#d08a3e'], [1, '#8d4f1c']); g.fillRect(-100, -80, 200, 210); g.fillStyle = 'rgba(255,235,200,0.3)'; g.fillRect(-90, top, 180, 14); g.restore(); }
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 27, -120); g.lineTo(i * 20, 128); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 7; g.beginPath(); g.moveTo(-96, -120); g.lineTo(96, -120); g.stroke();
    g.strokeStyle = 'rgba(90,70,50,0.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-96, -120); g.lineTo(-72, 130); g.lineTo(72, 130); g.lineTo(96, -120); g.stroke();
    g.restore();
  }
  function bulb(g, x, y, s, k = 1) {
    const r = Math.max(2, 0.08 * s);
    g.fillStyle = rg(g, x, y, 0, r * 2.2, [0, `rgba(255,214,130,${(0.55 * k).toFixed(3)})`], [1, 'rgba(255,214,130,0)']); g.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
    g.fillStyle = '#fff2c4'; g.beginPath(); g.ellipse(x, y, Math.max(1.4, 0.018 * s), Math.max(1.8, 0.022 * s), 0, 0, TAU); g.fill();
  }
  // a board's letters, drawn on the board's own plane (an affine fit to three of its corners) (reel 37's)
  function boardText(g, cam, a, b, c, text, col, o = {}) {
    const A = cam.P(...a), B = cam.P(...b), Cc = cam.P(...c); if (!A || !B || !Cc) return;
    const w = 100 * (o.aspect || 4), h = 100;
    g.save(); g.transform((B[0] - A[0]) / w, (B[1] - A[1]) / w, (Cc[0] - A[0]) / h, (Cc[1] - A[1]) / h, A[0], A[1]);
    g.font = '700 condensed 70px Bahn'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col;
    const tw = g.measureText(text).width, k = Math.min(1, (w * 0.86) / tw); g.translate(w / 2, h * 0.54); g.scale(k, 1); g.fillText(text, 0, 0);
    g.restore();
  }
  window.WORLD = { back, counter, awning, steam, glass, bulb, periods, LW, L, ST, SHUT, lg, rg, GOODS };
})();
