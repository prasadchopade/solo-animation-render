// Reel 43 · Guard His Shoes: the wedding, in metres, for the rig's free camera (film/rig.js). Our own drawing; this reel's own.
// A tent of ivory drapes lit warm, marigold strings hanging from it, fairy lights along the walls; a white sheet on the floor
// where the family sits (you sit at its near edge, x 0, z 0); the mandap ahead: a low platform, four pillars wrapped in
// marigolds, a pink canopy with strings of marigolds round its edge, and the fire in its copper kund at the centre. At the
// back on the right, the gate (an arch of flowers onto the night) with a chai counter just inside it.
// Every function is a pure function of its arguments and t.
(() => {
  const R = window.RIG, { mix, rgba, TAU, PI } = R, { clamp, lerp } = window.C;
  const M = [0.35, 0, 5.0];                           // the mandap's centre on the floor
  const PH = 0.16, HALF = 1.6, PILLAR = 2.75;         // platform height, half its width, pillar height above the platform
  const FIRE = [M[0], PH, M[2]];                      // the kund's centre, on the platform
  const GATE = { x0: 5.0, x1: 6.5, z: 10.0, h: 3.0 }; // the gate, in the back wall at the far right (out of frame 0; clear of the mandap in the wide)
  const CHAI = [5.0, 0, 9.35];                       // the chai counter's front, just inside the gate
  const WALL = { z: 10.0, x: 7.0, h: 5.2 };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // ------------------------------------------------------------------ sprites, made once (pure: the same pixels every load)
  const sprite = (r, col, a) => { const c = document.createElement('canvas'); c.width = c.height = r * 2; const g = c.getContext('2d'); const q = g.createRadialGradient(r, r, 0, r, r, r); q.addColorStop(0, rgba(col, a)); q.addColorStop(0.25, rgba(col, a * 0.5)); q.addColorStop(1, rgba(col, 0)); g.fillStyle = q; g.fillRect(0, 0, r * 2, r * 2); return c; };
  const GLOW = sprite(64, '#ffd88a', 1), FIREGLOW = sprite(128, '#ff9a3a', 0.9), WARM = sprite(128, '#ffcf7a', 0.55);
  const glowAt = (g, spr, x, y, r, a = 1) => { if (r < 0.5) return; g.globalAlpha = a; g.drawImage(spr, x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; };

  // ------------------------------------------------------------------ the floor, the sheet, the platform
  function floor(g, cam) {
    R.poly3(g, cam, [[-WALL.x, 0, -3], [WALL.x, 0, -3], [WALL.x, 0, WALL.z], [-WALL.x, 0, WALL.z]], '#b98f6a');
    // the white sheet where the family sits: cream, a faint woven check
    const sh = [[-3.6, 0.008, -1.2], [3.6, 0.008, -1.2], [3.6, 0.008, 7.4], [-3.6, 0.008, 7.4]];
    R.poly3(g, cam, sh, '#f4ecdc');
    g.strokeStyle = 'rgba(190,160,120,0.16)'; g.lineWidth = 1;
    for (let z = -1.2; z <= 7.4; z += 0.6) { g.beginPath(); R.line3(g, cam, [-3.6, 0.01, z], [3.6, 0.01, z]); g.stroke(); }
    for (let x = -3.6; x <= 3.6; x += 0.6) { g.beginPath(); R.line3(g, cam, [x, 0.01, -1.2], [x, 0.01, 7.4]); g.stroke(); }
    // a soft warm pool of light round the mandap
    const c = cam.P(M[0], 0.01, M[2]); if (c) glowAt(g, WARM, c[0], c[1], 6.5 * c[2], 0.5);
  }
  function platform(g, cam) {
    const x0 = M[0] - HALF, x1 = M[0] + HALF, z0 = M[2] - HALF, z1 = M[2] + HALF;
    R.poly3(g, cam, [[x0, PH, z0], [x1, PH, z0], [x1, PH, z1], [x0, PH, z1]], '#f7e6c4');
    R.poly3(g, cam, [[x0, 0, z0], [x1, 0, z0], [x1, PH, z0], [x0, PH, z0]], '#c9772e');        // its front face, a marigold-orange skirt
    R.poly3(g, cam, [[x0, 0, z0], [x0, 0, z1], [x0, PH, z1], [x0, PH, z0]], '#b5662a');
    R.poly3(g, cam, [[x1, 0, z0], [x1, 0, z1], [x1, PH, z1], [x1, PH, z0]], '#b5662a');
    g.strokeStyle = '#f2c84b'; g.lineWidth = 2; g.beginPath(); R.line3(g, cam, [x0, PH, z0], [x1, PH, z0]); g.stroke();
    // a rangoli round the kund: rings of coloured powder and petals (pink, yellow, white, blue; no green)
    const ring = (r, col, w) => { g.strokeStyle = col; const c = cam.P(FIRE[0], PH + 0.003, FIRE[2]); if (!c) return; g.lineWidth = Math.max(1, w * c[2]); g.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, p = cam.P(FIRE[0] + r * Math.cos(a), PH + 0.004, FIRE[2] + r * Math.sin(a)); if (!p) continue; if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.stroke(); };
    ring(0.62, '#e8338a', 0.05); ring(0.72, '#f5c030', 0.04); ring(0.8, '#ffffff', 0.025); ring(0.88, '#3d6fd8', 0.035);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, p = cam.P(FIRE[0] + 0.97 * Math.cos(a), PH + 0.005, FIRE[2] + 0.97 * Math.sin(a)); if (!p) continue; g.fillStyle = i % 2 ? '#f08a24' : '#e8338a'; g.beginPath(); g.ellipse(p[0], p[1], 0.05 * p[2], 0.02 * p[2], 0, 0, TAU); g.fill(); }
  }

  // ------------------------------------------------------------------ marigolds
  const MARI = ['#f08a1c', '#f7b52a', '#e8721a', '#f7c84a'];
  function bead(g, p, r, col) {                        // one marigold: a ruffled ball, lit from above
    if (!p) return; const rr = r * p[2]; if (rr < 0.6) return;
    if (rr < 2.5) { g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], rr, 0, TAU); g.fill(); return; }
    g.fillStyle = mix(col, '#7a2c08', 0.35); g.beginPath(); g.arc(p[0], p[1] + rr * 0.08, rr, 0, TAU); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1] - rr * 0.06, rr * 0.86, 0, TAU); g.fill();
    if (rr > 5) { g.strokeStyle = mix(col, '#7a2c08', 0.3); g.lineWidth = Math.max(0.6, rr * 0.08); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.arc(p[0] + Math.cos(a) * rr * 0.45, p[1] + Math.sin(a) * rr * 0.4 - rr * 0.06, rr * 0.32, a + 1, a + 3.6); g.stroke(); } }
    g.fillStyle = mix(col, '#fff3c0', 0.45); g.beginPath(); g.arc(p[0] - rr * 0.25, p[1] - rr * 0.35, rr * 0.3, 0, TAU); g.fill();
  }
  function string(g, cam, x, y0, z, len, t, seed, r = 0.035, sway = 1) {   // a hanging string of marigolds (a ladi), swaying a little
    const n = Math.max(3, Math.round(len / (r * 1.9))), ph = hash(seed) * TAU;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), d = 0.012 * sway * u * u * Math.sin(TAU * 0.25 * t + ph) * len;
      bead(g, cam.P(x + d, y0 - u * len, z + d * 0.4), r, MARI[(i + seed) % 4]);
    }
    const e = cam.P(x, y0 - len - r, z); if (e && e[2] * r > 1.5) { g.fillStyle = '#c8243a'; g.beginPath(); g.arc(e[0], e[1], r * 0.8 * e[2], 0, TAU); g.fill(); }   // a rose at the end
  }

  // ------------------------------------------------------------------ the tent: drapes, strings, fairy lights
  function walls(g, cam, t) {
    // the back wall: ivory drapes in folds, lit warm, darker towards the top
    const N = 28;
    for (let i = 0; i < N; i++) {
      const x0 = -WALL.x + (2 * WALL.x) * i / N, x1 = -WALL.x + (2 * WALL.x) * (i + 1) / N;
      if (x0 >= GATE.x0 - 0.05 && x1 <= GATE.x1 + 0.05) {        // the gate's opening: the night outside, fairy lights in it
        R.poly3(g, cam, [[x0, GATE.h, WALL.z], [x1, GATE.h, WALL.z], [x1, WALL.h, WALL.z], [x0, WALL.h, WALL.z]], i % 2 ? '#efe2c8' : '#e2d2b4');
        R.poly3(g, cam, [[x0, 0, WALL.z + 0.02], [x1, 0, WALL.z + 0.02], [x1, GATE.h, WALL.z + 0.02], [x0, GATE.h, WALL.z + 0.02]], '#1b1730');
        continue;
      }
      R.poly3(g, cam, [[x0, 0, WALL.z], [x1, 0, WALL.z], [x1, WALL.h, WALL.z], [x0, WALL.h, WALL.z]], i % 2 ? '#f1e5cc' : '#e4d4b5');
    }
    // the side walls
    for (const sx of [-1, 1]) for (let i = 0; i < 16; i++) {
      const z0 = -3 + (WALL.z + 3) * i / 16, z1 = -3 + (WALL.z + 3) * (i + 1) / 16;
      R.poly3(g, cam, [[sx * WALL.x, 0, z0], [sx * WALL.x, 0, z1], [sx * WALL.x, WALL.h, z1], [sx * WALL.x, WALL.h, z0]], i % 2 ? '#eadcc0' : '#dccaa8');
    }
    // the ceiling: swags of pink and ivory from the middle out
    R.poly3(g, cam, [[-WALL.x, WALL.h, -3], [WALL.x, WALL.h, -3], [WALL.x, WALL.h, WALL.z], [-WALL.x, WALL.h, WALL.z]], '#e9d6b6');
    for (let i = 0; i < 12; i++) { const z0 = -3 + i * 1.1; R.poly3(g, cam, [[-WALL.x, WALL.h - 0.02, z0], [WALL.x, WALL.h - 0.02, z0], [WALL.x, WALL.h - 0.02, z0 + 0.45], [-WALL.x, WALL.h - 0.02, z0 + 0.45]], '#e7a2b8'); }
    // a warm wash on the back wall behind the mandap
    const c = cam.P(M[0], 2.2, WALL.z - 0.05); if (c) glowAt(g, WARM, c[0], c[1], 7 * c[2], 0.6);
    // marigold strings down the back wall, in a row near the top
    for (let i = 0; i < 26; i++) { const x = -6.6 + i * 0.52; if (x > GATE.x0 - 0.2 && x < GATE.x1 + 0.2) continue; string(g, cam, x, WALL.h - 0.1, WALL.z - 0.08, 1.2 + 0.5 * hash(i + 3), t, i, 0.05, 0.3); }
    // fairy lights: three loops along the back wall, twinkling slowly
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 70; i++) {
        const u = i / 69, x = -WALL.x + 2 * WALL.x * u, sag = 0.35 * Math.sin(PI * ((u * 6) % 1)), y = 3.6 - row * 0.55 - sag;
        const p = cam.P(x, y, WALL.z - 0.12); if (!p) continue;
        const tw = 0.65 + 0.35 * Math.sin(TAU * (0.4 + 0.3 * hash(i + row * 70)) * t + hash(i * 7 + row) * TAU);
        glowAt(g, GLOW, p[0], p[1], 0.22 * p[2], 0.55 * tw);
        g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(p[0], p[1], Math.max(0.8, 0.018 * p[2]), 0, TAU); g.fill();
      }
    }
  }

  // ------------------------------------------------------------------ the gate and the chai counter by it
  function gate(g, cam, t) {
    // the night through the arch: fairy lights strung on trees outside
    for (let i = 0; i < 40; i++) {
      const x = GATE.x0 + 0.1 + (GATE.x1 - GATE.x0 - 0.2) * hash(i + 11), y = 0.6 + 2.2 * hash(i + 23), p = cam.P(x, y, WALL.z + 3);
      if (!p) continue; const tw = 0.5 + 0.5 * Math.sin(TAU * 0.5 * t + i);
      glowAt(g, GLOW, p[0], p[1], 0.3 * p[2], 0.6 * tw);
    }
    // the arch: two posts wrapped in marigolds, a garland across the top
    for (const x of [GATE.x0, GATE.x1]) for (let k = 0; k < 34; k++) bead(g, cam.P(x + 0.06 * Math.cos(k * 1.3), k * 0.09, WALL.z - 0.1 + 0.06 * Math.sin(k * 1.3)), 0.06, MARI[k % 4]);
    for (let k = 0; k <= 22; k++) { const u = k / 22, x = lerp(GATE.x0, GATE.x1, u), y = GATE.h + 0.25 * Math.sin(PI * u); bead(g, cam.P(x, y, WALL.z - 0.1), 0.07, MARI[k % 4]); }
  }
  function chai(g, cam, t, part = 'all') {
    const [x, , z] = CHAI, top = 0.92;
    // the counter: a table with a pink skirt, a stove, a big kettle, a stack of glasses
    R.poly3(g, cam, [[x - 0.6, top, z - 0.3], [x + 0.6, top, z - 0.3], [x + 0.6, top, z + 0.3], [x - 0.6, top, z + 0.3]], '#efe6d6');
    R.poly3(g, cam, [[x - 0.6, 0, z - 0.3], [x + 0.6, 0, z - 0.3], [x + 0.6, top, z - 0.3], [x - 0.6, top, z - 0.3]], '#d9537a');
    g.strokeStyle = '#f2c84b'; g.lineWidth = 1.5; g.beginPath(); R.line3(g, cam, [x - 0.6, top - 0.06, z - 0.31], [x + 0.6, top - 0.06, z - 0.31]); g.stroke();
    const k = cam.P(x - 0.25, top + 0.2, z); if (k) {                      // the kettle, copper
      const r = 0.15 * k[2]; const q = g.createLinearGradient(k[0] - r, 0, k[0] + r, 0); q.addColorStop(0, '#f0a86a'); q.addColorStop(0.5, '#b8642c'); q.addColorStop(1, '#6e3412');
      g.fillStyle = q; g.beginPath(); g.ellipse(k[0], k[1], r, r * 1.05, 0, 0, TAU); g.fill();
      g.strokeStyle = '#6e3412'; g.lineWidth = Math.max(1, 0.02 * k[2]); g.beginPath(); g.moveTo(k[0] + r * 0.8, k[1]); g.quadraticCurveTo(k[0] + r * 1.6, k[1] - r * 0.3, k[0] + r * 1.7, k[1] - r * 0.9); g.stroke();
      for (let i = 0; i < 3; i++) { const ph = (t * 0.35 + i / 3) % 1; g.strokeStyle = `rgba(255,255,255,${(0.25 * (1 - ph)).toFixed(3)})`; g.lineWidth = Math.max(1, 0.03 * k[2]); g.beginPath(); g.moveTo(k[0] + r * 1.7, k[1] - r * 1.0 - ph * r * 2.2); g.quadraticCurveTo(k[0] + r * (1.9 + 0.3 * Math.sin(ph * 6)), k[1] - r * 1.5 - ph * r * 2.2, k[0] + r * 1.7, k[1] - r * 2.0 - ph * r * 2.2); g.stroke(); }   // steam
    }
    for (let i = 0; i < 5; i++) { const p = cam.P(x + 0.12 + i * 0.075, top + 0.05, z - 0.12); if (!p) continue; g.fillStyle = 'rgba(230,240,245,0.8)'; g.fillRect(p[0] - 0.025 * p[2], p[1] - 0.05 * p[2], 0.05 * p[2], 0.1 * p[2]); g.fillStyle = '#c77a36'; g.fillRect(p[0] - 0.022 * p[2], p[1] - 0.01 * p[2], 0.044 * p[2], 0.06 * p[2]); }
  }

  // ------------------------------------------------------------------ the mandap: pillars, canopy, the fire
  const PILLARS = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [M[0] + a * (HALF - 0.08), M[2] + b * (HALF - 0.08)]);
  function pillar(g, cam, px, pz, t, seed) {
    const a = cam.P(px, PH, pz), b = cam.P(px, PH + PILLAR, pz); if (!a || !b) return;
    const r = 0.09; const q = g.createLinearGradient(a[0] - r * a[2], 0, a[0] + r * a[2], 0); q.addColorStop(0, '#fff1d6'); q.addColorStop(0.6, '#e8cfa0'); q.addColorStop(1, '#b8945c');
    g.fillStyle = q; g.beginPath(); g.moveTo(a[0] - r * a[2], a[1]); g.lineTo(b[0] - r * b[2], b[1]); g.lineTo(b[0] + r * b[2], b[1]); g.lineTo(a[0] + r * a[2], a[1]); g.closePath(); g.fill();
    // marigolds wound round it in a spiral, and a band of red roses at a third of its height
    for (let k = 0; k < 70; k++) {
      const h = PH + 0.05 + k * (PILLAR - 0.1) / 70, an = k * 0.9 + seed, p = cam.P(px + 0.105 * Math.cos(an), h, pz + 0.105 * Math.sin(an));
      if (!p) continue; const cz = cam.toCam(px + 0.105 * Math.cos(an), h, pz + 0.105 * Math.sin(an))[2], c0 = cam.toCam(px, h, pz)[2];
      if (cz > c0 + 0.02) continue;                    // the far side of the pillar is behind it
      bead(g, p, 0.045, (k % 9 === 4) ? '#c8243a' : MARI[k % 4]);
    }
  }
  function canopy(g, cam, t, part) {                    // part 'back': the far edge and the sides; 'front': the near edge
    const y = PH + PILLAR, x0 = M[0] - HALF, x1 = M[0] + HALF, z0 = M[2] - HALF, z1 = M[2] + HALF;
    if (part === 'back') R.poly3(g, cam, [[x0, y + 0.25, z0], [x1, y + 0.25, z0], [x1, y + 0.25, z1], [x0, y + 0.25, z1]], '#c9406e');
    const edge = (a, b, k0) => {                       // a valance of pink, scalloped, edged in gold, with marigold strings
      const n = 9;
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n, p0 = [lerp(a[0], b[0], u0), y + 0.25, lerp(a[1], b[1], u0)], p1 = [lerp(a[0], b[0], u1), y + 0.25, lerp(a[1], b[1], u1)];
        const m = [(p0[0] + p1[0]) / 2, y - 0.22, (p0[2] + p1[2]) / 2];
        const A = cam.P(...p0), B = cam.P(...p1), Cc = cam.P(...m), D0 = cam.P(p0[0], y - 0.02, p0[2]), D1 = cam.P(p1[0], y - 0.02, p1[2]); if (!A || !B || !Cc || !D0 || !D1) continue;
        g.fillStyle = i % 2 ? '#e0457e' : '#d23a72'; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(D1[0], D1[1]); g.quadraticCurveTo(Cc[0], Cc[1] + (Cc[1] - (D0[1] + D1[1]) / 2), D0[0], D0[1]); g.closePath(); g.fill();
        g.strokeStyle = '#f2c84b'; g.lineWidth = Math.max(1, 0.025 * Cc[2]); g.beginPath(); g.moveTo(D1[0], D1[1]); g.quadraticCurveTo(Cc[0], Cc[1] + (Cc[1] - (D0[1] + D1[1]) / 2), D0[0], D0[1]); g.stroke();
        string(g, cam, p0[0], y - 0.05, p0[2], 0.75 + 0.25 * hash(k0 + i), t, k0 + i, 0.038);
      }
    };
    if (part === 'back') { edge([x0, z1], [x1, z1], 10); edge([x0, z0], [x0, z1], 30); edge([x1, z0], [x1, z1], 50); }
    else edge([x0, z0], [x1, z0], 70);
  }
  // the fire: a copper kund, flames that lick and lean, sparks, and the glow it throws
  function fire(g, cam, t, k = 1) {
    const [fx, fy, fz] = FIRE, w0 = 0.29, w1 = 0.2, h = 0.26;
    const top = [[fx - w0, fy + h, fz - w0], [fx + w0, fy + h, fz - w0], [fx + w0, fy + h, fz + w0], [fx - w0, fy + h, fz + w0]];
    R.poly3(g, cam, [[fx - w1, fy, fz - w1], [fx + w1, fy, fz - w1], [fx + w0, fy + h, fz - w0], [fx - w0, fy + h, fz - w0]], '#b4622a');
    R.poly3(g, cam, [[fx - w1, fy, fz - w1], [fx - w1, fy, fz + w1], [fx - w0, fy + h, fz + w0], [fx - w0, fy + h, fz - w0]], '#8a4418');
    R.poly3(g, cam, [[fx + w1, fy, fz - w1], [fx + w1, fy, fz + w1], [fx + w0, fy + h, fz + w0], [fx + w0, fy + h, fz - w0]], '#8a4418');
    R.poly3(g, cam, top, '#5a2a10');
    g.strokeStyle = '#f0b060'; g.lineWidth = 1.5; g.beginPath(); R.line3(g, cam, top[0], top[1]); g.stroke();
    const base = cam.P(fx, fy + h, fz); if (!base) return;
    const s = base[2];
    glowAt(g, FIREGLOW, base[0], base[1] - 0.25 * s, 1.6 * s, 0.7 * k);
    // the flames: tongues from the logs, each its own flicker (sums of sines: no randomness between frames)
    const tongues = 7;
    for (let L = 0; L < 3; L++) {
      const col = ['#ff6a1a', '#ffa22e', '#ffe27a'][L], hk = [1, 0.72, 0.45][L], wk = [1, 0.7, 0.42][L];
      for (let i = 0; i < tongues; i++) {
        const u = (i + 0.5) / tongues - 0.5, ph = hash(i * 3 + L) * TAU;
        const fl = 0.75 + 0.25 * Math.sin(TAU * (2.1 + 0.6 * hash(i)) * t + ph) + 0.12 * Math.sin(TAU * 5.3 * t + ph * 2);
        const ht = (0.42 + 0.22 * Math.cos(u * PI)) * fl * hk * k, wd = 0.11 * wk;
        const lean = 0.05 * Math.sin(TAU * 0.7 * t + ph) + 0.03 * Math.sin(TAU * 1.9 * t);
        const b0 = cam.P(fx + u * 0.42, fy + h, fz), tp = cam.P(fx + u * 0.3 + lean, fy + h + ht, fz); if (!b0 || !tp) continue;
        const ww = wd * b0[2];
        g.fillStyle = col; g.globalAlpha = 0.92;
        g.beginPath(); g.moveTo(b0[0] - ww, b0[1]); g.bezierCurveTo(b0[0] - ww * 1.1, b0[1] - (b0[1] - tp[1]) * 0.45, tp[0] - ww * 0.2, tp[1] + (b0[1] - tp[1]) * 0.25, tp[0], tp[1]);
        g.bezierCurveTo(tp[0] + ww * 0.25, tp[1] + (b0[1] - tp[1]) * 0.3, b0[0] + ww * 1.1, b0[1] - (b0[1] - tp[1]) * 0.4, b0[0] + ww, b0[1]); g.closePath(); g.fill();
        g.globalAlpha = 1;
      }
    }
    for (let i = 0; i < 9; i++) {                       // sparks, rising and fading on their own loops
      const ph = (t * (0.5 + 0.4 * hash(i + 40)) + hash(i)) % 1, p = cam.P(fx + 0.25 * (hash(i + 9) - 0.5) + 0.08 * Math.sin(ph * 6 + i), fy + h + 0.1 + ph * 0.9, fz);
      if (!p) continue; g.fillStyle = `rgba(255,220,140,${(0.9 * (1 - ph)).toFixed(3)})`; g.beginPath(); g.arc(p[0], p[1], Math.max(0.7, 0.01 * p[2]), 0, TAU); g.fill();
    }
  }

  window.WORLD = { M, PH, HALF, PILLAR, FIRE, GATE, CHAI, WALL, PILLARS, floor, platform, walls, gate, chai, pillar, canopy, fire, bead, string, glowAt, GLOW, WARM, FIREGLOW, MARI, hash };
})();
