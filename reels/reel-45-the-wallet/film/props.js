// Reel 45 · The Wallet: the props, in 3D, as primitives ({ z: depth, draw(g) }) that film.js sorts far to near with the hands.
// Your wallet (a worn brown leather bifold that opens on its spine), our own notes (the size and colours of Indian notes; no
// portrait, emblem, numeral or security mark copied, and no ₹2,000), a plain card, a steel key (not brass: the token is the only
// gold thing; with every prop gold in reel 42 the biscuits read as the watch), a folded slip, the brass chai token, and his
// glass of chai with its steam. Every function is a pure function of its arguments. Units are metres.
(() => {
  const R = window.RIG, H3 = window.HAND3, { mix, rgba } = R, { add, sub, mul, madd, dot, cross, norm, lerp3, ortho } = H3.v;
  const INK = H3.INK, inkW = H3.inkW;                 // after motion test 5: the film's 2D look, flat colour and an ink line round each thing
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const zOf = (cam, p) => cam.toCam(p[0], p[1], p[2])[2];
  const rot = (v, axis, a) => {                                         // Rodrigues: v turned a radians about the unit axis
    const c = Math.cos(a), s = Math.sin(a), k = axis, d = dot(k, v), x = cross(k, v);
    return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)];
  };

  // ------------------------------------------------------------------ textures (drawn once, the same every time)
  const TEX = {};
  function mk(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
  function seeded(s) { return () => { s |= 0; s = s + 0x6d2b79f5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // a note: 150 x 66 mm at 4 px a mm. base: the paper's colour; ink: its printing; band: the panel at one end
  function noteTex(base, ink, band, seed) {
    return mk(600, 264, (g, w, h) => {
      const r = seeded(seed);
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      // (flat: no gloss)
      g.fillStyle = band; g.fillRect(0, 0, 118, h);                                        // the panel at the left end
      g.strokeStyle = ink; g.globalAlpha = 0.28; g.lineWidth = 1.4;                         // fine wavy lines across
      for (let y = 18; y < h - 10; y += 9) { g.beginPath(); for (let x = 0; x <= w; x += 10) { const yy = y + 3.5 * Math.sin(x * 0.045 + y * 0.3); x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
      g.globalAlpha = 0.55; g.lineWidth = 2;                                                // a rosette of rings (ours)
      for (let k = 0; k < 9; k++) { g.beginPath(); for (let a = 0; a <= TAU + 0.01; a += 0.05) { const rr = 22 + k * 7 + 4 * Math.sin(a * 12 + k); const x = 250 + rr * Math.cos(a), y = 132 + rr * Math.sin(a) * 0.92; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = mix(base, '#ffffff', 0.45);                          // the empty window at the right
      g.beginPath(); g.ellipse(478, 128, 54, 70, 0, 0, TAU); g.fill();
      g.strokeStyle = ink; g.globalAlpha = 0.35; g.lineWidth = 3; g.stroke();
      g.globalAlpha = 0.6; g.fillStyle = ink; g.fillRect(360, 0, 10, h);                    // a printed bar (not a thread)
      g.globalAlpha = 0.5; g.strokeStyle = ink; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
      // (flat: no speckled wear)
      g.globalAlpha = 1; g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();   // the fold it's carried in
    });
  }
  function tex(name) {
    if (TEX[name]) return TEX[name];
    if (name === 'n500') TEX[name] = noteTex('#b9b8a8', '#4f5246', '#a7a493', 5);
    else if (name === 'n500b') TEX[name] = noteTex('#b3b5a6', '#4d5044', '#a2a08f', 9);
    else if (name === 'n100') TEX[name] = noteTex('#b8a9d6', '#4c3f6e', '#a493c8', 13);
    else if (name === 'n200') TEX[name] = noteTex('#e9bf55', '#6b4a12', '#ddb04a', 17);
    else if (name === 'token') TEX[name] = mk(256, 256, (g) => {                           // the chai token: brass, a glass with steam stamped in it
      g.fillStyle = '#e2b54a'; g.beginPath(); g.arc(128, 128, 127, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.arc(128, 128, 127, 0, TAU); g.clip(); g.fillStyle = '#b8862a'; g.beginPath(); g.rect(0, 0, 256, 256); g.arc(108, 104, 132, 0, TAU, true); g.fill(); g.restore();   // one hard shadow
      g.strokeStyle = '#7a5210'; g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 108, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,240,190,0.7)'; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 102, PI * 1.05, PI * 1.75); g.stroke();
      g.fillStyle = '#8a5e12'; g.beginPath(); g.moveTo(92, 104); g.lineTo(164, 104); g.lineTo(154, 190); g.lineTo(102, 190); g.closePath(); g.fill();   // the glass
      g.fillStyle = '#c9952e'; g.beginPath(); g.moveTo(100, 130); g.lineTo(156, 130); g.lineTo(150, 182); g.lineTo(106, 182); g.closePath(); g.fill();
      g.strokeStyle = '#8a5e12'; g.lineWidth = 7; g.lineCap = 'round';
      for (const x of [108, 128, 148]) { g.beginPath(); g.moveTo(x, 92); g.bezierCurveTo(x - 12, 78, x + 12, 66, x, 50); g.stroke(); }   // steam
    });
    else if (name === 'card') TEX[name] = mk(340, 214, (g, w, h) => {                       // a plain card: no logo, no words
      g.fillStyle = '#e9ecef'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#3d6fb0'; g.fillRect(0, 0, w, 54);
      g.fillStyle = '#d7b24a'; g.fillRect(28, 82, 52, 40); g.strokeStyle = '#9b7a22'; g.lineWidth = 2; g.strokeRect(28, 82, 52, 40);
      g.fillStyle = '#9aa3ad'; for (let i = 0; i < 4; i++) g.fillRect(28 + i * 66, 150, 52, 10); g.fillRect(28, 178, 140, 8);
    });
    else if (name === 'leather') TEX[name] = mk(256, 256, (g, w, h) => {                    // the inside of the wallet
      g.fillStyle = '#8a5434'; g.fillRect(0, 0, w, h);
    });
    return TEX[name];
  }

  // ------------------------------------------------------------------ drawing helpers
  // a texture on a screen triangle (affine; the triangle is grown a hair so neighbours meet without a seam)
  function texTri(g, img, p0, p1, p2, t0, t1, t2) {
    const cx = (p0[0] + p1[0] + p2[0]) / 3, cy = (p0[1] + p1[1] + p2[1]) / 3, gr = (p) => { const dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * 0.7, p[1] + dy / l * 0.7]; };
    const a = gr(p0), b = gr(p1), c = gr(p2);
    const [u0, v0] = t0, [u1, v1] = t1, [u2, v2] = t2, d = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1); if (Math.abs(d) < 1e-9) return;
    const A = (p0[0] * (v1 - v2) + p1[0] * (v2 - v0) + p2[0] * (v0 - v1)) / d, B = (p0[1] * (v1 - v2) + p1[1] * (v2 - v0) + p2[1] * (v0 - v1)) / d;
    const Cc = (p0[0] * (u2 - u1) + p1[0] * (u0 - u2) + p2[0] * (u1 - u0)) / d, Dd = (p0[1] * (u2 - u1) + p1[1] * (u0 - u2) + p2[1] * (u1 - u0)) / d;
    const E = (p0[0] * (u1 * v2 - u2 * v1) + p1[0] * (u2 * v0 - u0 * v2) + p2[0] * (u0 * v1 - u1 * v0)) / d, F = (p0[1] * (u1 * v2 - u2 * v1) + p1[1] * (u2 * v0 - u0 * v2) + p2[1] * (u0 * v1 - u1 * v0)) / d;
    g.save(); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.clip();
    g.transform(A, B, Cc, Dd, E, F); g.drawImage(img, 0, 0); g.restore();
  }
  // a quad of world points (corners in order) as a filled face; returns the screen points or null
  function face(g, cam, pts, fill, stroke, lw) {
    const q = pts.map((p) => cam.P(p[0], p[1], p[2])); if (q.some((x) => !x)) return null;
    g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke === 'ink') { g.lineWidth = inkW(q[0][2]) * (lw || 1); g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); }
    else if (stroke) { g.lineWidth = lw || 1; g.strokeStyle = stroke; g.stroke(); }
    return q;
  }
  const facing = (cam, p, n) => { const c = cam.toCam(p[0], p[1], p[2]), d = cam.dirCam(n[0], n[1], n[2]); return -(c[0] * d[0] + c[1] * d[1] + c[2] * d[2]) / (Math.hypot(c[0], c[1], c[2]) || 1); };   // > 0: the face looks at you
  // a light on a face: n its normal, lt the light (RIG.lightOf); k how much
  function shadeOf(cam, base, n, lt, k = 1) {
    const d = cam.dirCam(n[0], n[1], n[2]), L = [lt.x, 0.55, -0.6], l = Math.hypot(...L), lam = clamp((-d[0] * -L[0] / l + -d[1] * L[1] / l + -d[2] * L[2] / l) * 0.5 + 0.5);
    const [c0, c1] = R.tone(base, lt); return mix(c1, c0, clamp(lam * k + (1 - k) * 0.6));
  }

  // ------------------------------------------------------------------ a sheet (a note, the card, the slip): a strip of points along its length
  // spine(x) gives the centre line in the world (x from -0.5 to 0.5 of its length), across is the width's way; the texture runs along it
  function sheet(cam, img, spine, across, w, n = 8, o = {}) {
    const P = [], Q = [];
    for (let i = 0; i <= n; i++) { const x = -0.5 + i / n, c = spine(x), a = typeof across === 'function' ? across(x) : across; P.push(madd(c, a, -w / 2)); Q.push(madd(c, a, w / 2)); }
    const zs = P.map((p) => zOf(cam, p)), z = zs.reduce((a, b) => a + b, 0) / zs.length;
    return { z: z + (o.dz || 0), draw: (g) => {
      const ps = P.map((p) => cam.P(p[0], p[1], p[2])), qs = Q.map((p) => cam.P(p[0], p[1], p[2])); if (ps.some((x) => !x) || qs.some((x) => !x)) return;
      g.save(); if (o.a != null) g.globalAlpha *= o.a;
      const iw = img.width, ih = img.height;
      for (let i = 0; i < n; i++) {
        const u0 = i / n * iw, u1 = (i + 1) / n * iw;
        texTri(g, img, ps[i], ps[i + 1], qs[i + 1], [u0, ih], [u1, ih], [u1, 0]);
        texTri(g, img, ps[i], qs[i + 1], qs[i], [u0, ih], [u1, 0], [u0, 0]);
      }
      if (o.shade) {                                                    // a shadow across it (in a pocket, under a thumb)
        g.beginPath(); ps.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (let i = qs.length - 1; i >= 0; i--) g.lineTo(qs[i][0], qs[i][1]); g.closePath();
        g.fillStyle = `rgba(30,14,6,${o.shade})`; g.fill();
      }
      g.lineWidth = inkW(ps[0][2]) * 0.5; g.strokeStyle = INK; g.lineJoin = 'round';
      g.beginPath(); ps.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (let i = qs.length - 1; i >= 0; i--) g.lineTo(qs[i][0], qs[i][1]); g.closePath(); g.stroke();
      g.restore();
    } };
  }

  // ------------------------------------------------------------------ the notes: a fold of seven, as the wallet holds them
  const NOTES = ['n200', 'n200', 'n200', 'n200', 'n200', 'n200', 'n200'];   // after test 8: all one note, so no turn of the stack ever changes the cash's colour (it was mixed).   // both outside notes alike: a turning stack never swaps its face (gold outside since test 6: the cash reads as cash, and the same colour all along)
  const SK = 1.3;                                     // the props drawn a third over life size, so they read at phone size against his hands
  const NL = 0.150 * SK, NW = 0.066 * SK, NT = 0.00045;
  // a stack of notes. frame: { O (the middle of the bottom note), L (along the length), S (across), N (up) }; each note i may have
  // { dx (slid along L), dy (along S), lift (its free end raised, 0..1, at end e = +1 or -1), fold (folded about its middle, radians) }
  function notes(cam, F, per = [], o = {}) {
    const out = [];
    NOTES.forEach((name, i) => {
      const p = per[i] || {}; if (p.hide) return;
      const base = madd(madd(madd(F.O, F.N, p.nz ?? i * NT * (o.spread ?? 1)), F.L, p.dx || 0), F.S, p.dy || 0);
      const fold = (p.fold ?? o.fold) || 0, lift = p.lift || 0, e = p.e || 1, curl = p.curl ?? 0.6;
      const spine = (x) => {                                           // x from -0.5 to 0.5 of the note's length
        const s = x * NL;
        let pt = madd(base, F.L, s);
        if (fold) {                                                     // the half on the -L side folds up and over (the closed wallet)
          if (s < 0) { const ang = fold * clamp(-s / 0.012), r = 0.004; const d = rot(F.L, F.S, -ang); pt = madd(madd(base, F.N, r * (1 - Math.cos(ang))), d, s); }
        }
        if (lift) {                                                     // its free end curls up (counting): from mid-length out
          const k = clamp((x * e - 0.05) / 0.45); const a = lift * curl * PI * k * k;
          pt = madd(madd(pt, F.N, Math.sin(a) * NL * 0.32 * k), F.L, -e * (1 - Math.cos(a)) * NL * 0.22 * k);
        }
        return pt;
      };
      out.push(sheet(cam, tex(name), spine, F.S, NW, lift ? 10 : 6, { dz: -(p.rank ?? i) * 1e-4 * (o.order ?? 1) + (p.zb || 0) + (o.zBias || 0), edge: 'rgba(50,50,40,0.6)', shade: p.shade }));
    });
    return out;
  }

  // ------------------------------------------------------------------ the wallet: a bifold on its spine
  // W: { O (the middle of the spine), A (along the spine: the wallet's height), B (across, the back leaf's way), N (out of the back
  // leaf's inside), open (0 shut ... PI flat open), gap (how thick what's inside is, when shut) }
  const WW = 0.112 * SK, WH = 0.092 * SK, WT = 0.005;
  const LEATHER = '#6e3f22', LEATHER_IN = '#8a5434', EDGE = '#3c1e0e';
  function leafFrame(Wt, which) {
    const { O, A, B, N } = Wt, th = Wt.open ?? 0, gap = Wt.gap ?? 0.008;
    if (which === 'back') return { o: O, b: B, n: N };
    const bf = add(mul(B, Math.cos(th)), mul(N, Math.sin(th))), nf = mul(add(mul(N, Math.cos(th)), mul(B, -Math.sin(th))), -1);
    return { o: madd(O, N, gap * (1 + Math.cos(th)) / 2 + WT), b: bf, n: nf };
  }
  // the six faces of one leaf (a thin slab); returns primitives
  function leaf(cam, Wt, which, lt, o = {}) {
    const { o: Lo, b, n } = leafFrame(Wt, which), A = Wt.A, h = WH / 2;
    const c = (x, y, z) => madd(madd(madd(Lo, b, x), A, y), n, z);
    const ins = [c(0, -h, 0), c(WW, -h, 0), c(WW, h, 0), c(0, h, 0)];                 // the inside face (towards n)
    const out = [c(0, -h, -WT), c(WW, -h, -WT), c(WW, h, -WT), c(0, h, -WT)];         // the outside
    const prims = [], z = zOf(cam, c(WW / 2, 0, -WT / 2));
    const inVis = facing(cam, c(WW / 2, 0, 0), n) > 0;
    prims.push({ z: z + (o.dz || 0), draw: (g) => {
      // the edges (the slab's thickness), then the face you see
      const sides = [[0, 1], [1, 2], [2, 3], [3, 0]];
      for (const [i, j] of sides) face(g, cam, [ins[i], ins[j], out[j], out[i]], mix(EDGE, LEATHER, 0.35), 'ink', 0.8);
      const f = inVis ? ins : out, nn = inVis ? n : mul(n, -1);
      const q = face(g, cam, f, shadeOf(cam, inVis ? LEATHER_IN : LEATHER, nn, lt, 0.8), 'ink', 0.8);
      if (!q) return;
      g.save(); g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.clip();
      if (inVis) {                                                      // the leather's grain, then pockets
        g.strokeStyle = rgba(INK, 0.7); g.lineWidth = inkW(q[0][2]) * 0.5;
        for (const y of (which === 'back' ? [] : [-0.012, 0.008])) { const a = cam.P(...c(0.004, y, 0.0005)), bb = cam.P(...c(WW - 0.006, y, 0.0005)); if (a && bb) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(bb[0], bb[1]); g.stroke(); } }
      } else {                                                          // a little wear on the outside
        // (flat: no sheen)
      }
      g.setLineDash([Math.max(2, q[0][2] * 0.003), Math.max(1.5, q[0][2] * 0.0022)]); g.strokeStyle = rgba('#d8a878', 0.55); g.lineWidth = Math.max(0.8, q[0][2] * 0.0009);   // the stitching
      const s0 = 0.005, z0 = inVis ? 0.0004 : -WT - 0.0004, st = [c(s0, -h + s0, z0), c(WW - s0, -h + s0, z0), c(WW - s0, h - s0, z0), c(s0, h - s0, z0)].map((p) => cam.P(p[0], p[1], p[2]));
      if (st.every((x) => x)) { g.beginPath(); st.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke(); }
      g.setLineDash([]); g.restore();
    } });
    return { prims, inVis, c, z };
  }
  // the bill pocket's front: a band of leather across a leaf's inside, below where the notes show (drawn in front of the notes)
  function pocketFront(cam, Wt, which, lt, hFrac = 0.62) {
    const { o: Lo, b, n } = leafFrame(Wt, which), A = Wt.A, h = WH / 2, y1 = -h + WH * hFrac;
    const c = (x, y, z) => madd(madd(madd(Lo, b, x), A, y), n, z);
    const pts = [c(0.002, -h + 0.002, 0.0026), c(WW - 0.002, -h + 0.002, 0.0026), c(WW - 0.002, y1, 0.0026), c(0.002, y1, 0.0026)];
    const vis = facing(cam, c(WW / 2, 0, 0), n) > 0;
    return { z: zOf(cam, c(WW / 2, -h / 2, 0.003)) - 0.0006, vis, draw: (g) => {
      if (!vis) return;
      const q = face(g, cam, pts, shadeOf(cam, mix(LEATHER_IN, '#a86a44', 0.25), n, lt, 0.8), 'ink', 0.6); if (!q) return;
      g.strokeStyle = rgba(INK, 0.45); g.lineWidth = inkW(q[0][2]) * 0.4; g.beginPath(); g.moveTo(q[3][0], q[3][1] + 2); g.lineTo(q[2][0], q[2][1] + 2); g.stroke();
      g.setLineDash([Math.max(2, q[0][2] * 0.003), Math.max(1.5, q[0][2] * 0.0022)]); g.strokeStyle = rgba('#d8a878', 0.5); g.lineWidth = Math.max(0.8, q[0][2] * 0.0008);
      const a = cam.P(...c(0.005, y1 - 0.004, 0.003)), bb = cam.P(...c(WW - 0.005, y1 - 0.004, 0.003)); if (a && bb) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(bb[0], bb[1]); g.stroke(); }
      g.setLineDash([]);
    } };
  }
  // the whole wallet: leaves, the card (front leaf), the key (front leaf), the slip, the notes (unless they've been taken), the token
  // (once it's in). o: { notes: per-note states or null when they're out, token: 0..1 how far into its slot (or null), lt }
  function wallet(cam, Wt, lt, o = {}) {
    const P = [];
    const back = leaf(cam, Wt, 'back', lt), front = leaf(cam, Wt, 'front', lt, { dz: (Wt.open ?? 0) < 1.2 ? -0.001 : 0 });
    P.push(...back.prims, ...front.prims);
    const th = Wt.open ?? 0;
    if (th > 0.06) {                                                    // inside things show as it opens (faded in, so nothing pops)
      const inA = clamp((th - 0.08) / 0.45);
      const fr = leafFrame(Wt, 'front'), A = Wt.A, h = WH / 2;
      // the card in the front leaf's top slot, its top third showing
      const cardO = madd(madd(fr.o, fr.b, WW * 0.5), A, h * 0.18), cardP = sheet(cam, tex('card'), (x) => madd(madd(cardO, fr.b, x * 0.084 * SK), fr.n, 0.0016), A, 0.053 * SK, 2, { dz: -0.0004, edge: 'rgba(60,70,80,0.5)' });
      // the token, slipped in behind the card (o.token: 0 above the slot ... 1 in, its top edge still showing a little)
      if (o.token != null && front.inVis) {
        const tk = o.token, Ot = madd(madd(madd(fr.o, fr.b, WW * 0.66), A, h * 0.28 + 0.03 * (1 - tk)), fr.n, 0.0011 + 0.004 * (1 - tk));
        P.push(...token(cam, Ot, fr.n, A, lt, { dz: tk < 0.6 ? -0.0012 : -0.0002, r: 0.0135 * SK, a: inA }).map((q) => ({ ...q, slot: 1, tok: 1 })));   // (after test 8: faded with the inside, so a shut wallet never shows it)   // once it's been pushed up, in front of the card
      }
      if (front.inVis) P.push({ ...cardP, slot: 1, card: 1, z: cardP.z - 0.002, draw: (g) => { g.save(); g.globalAlpha *= inA; cardP.draw(g); g.restore(); } });   // (after test 6: only with its inside to you)
      // the steel key's head and the slip of paper, in the lower slot
      const kO = madd(madd(madd(fr.o, fr.b, WW * 0.24), A, -h * 0.28), fr.n, 0.002);
      if (front.inVis) P.push({ slot: 1, z: zOf(cam, kO) - 0.0005, draw: (g) => { const p = cam.P(...kO); if (!p) return; const u = p[2]; g.fillStyle = '#9aa2aa'; g.beginPath(); g.arc(p[0], p[1] - 0.008 * u, 0.011 * u, 0, TAU); g.strokeStyle = INK; g.lineWidth = inkW(u) * 0.6; g.stroke(); g.fill(); g.fillStyle = 'rgba(40,40,45,0.7)'; g.beginPath(); g.arc(p[0], p[1] - 0.01 * u, 0.003 * u, 0, TAU); g.fill(); } });
      if (front.inVis) { const pf = pocketFront(cam, Wt, 'front', lt, 0.55); P.push({ ...pf, slot: 1, z: pf.z - 0.002, draw: (g) => { g.save(); g.globalAlpha *= inA; pf.draw(g); g.restore(); } }); }
      const slipO = madd(madd(fr.o, fr.b, WW * 0.62), A, -h * 0.18);
      if (front.inVis) P.push({ ...sheet(cam, mk2('slip'), (x) => madd(madd(slipO, fr.b, x * 0.06 * SK), fr.n, 0.0018), A, 0.03 * SK, 2, { dz: -0.0003, edge: 'rgba(80,80,70,0.5)' }), slot: 1 });
      // the bill pocket on the back leaf, and the notes standing in it
      if (o.notes) {
        const NB = { O: madd(madd(Wt.O, Wt.A, -h + NW / 2 + 0.006 + (o.notesUp || 0)), Wt.N, 0.0012), L: Wt.B, S: Wt.A, N: Wt.N };
        // when open flat the notes run across both leaves; as it shuts they fold about the spine
        NB.O = madd(NB.O, Wt.B, 0);
        P.push(...notes(cam, NB, o.notes, { fold: PI - th, spread: 1, zBias: 0.002 }).map((q) => ({ ...q, note: 1, draw: (g) => { g.save(); g.globalAlpha *= inA; q.draw(g); g.restore(); } })));
      }
      { const pb = pocketFront(cam, Wt, 'back', lt, 0.62); P.push({ ...pb, slot: 1, z: pb.z - 0.002, draw: (g) => { g.save(); g.globalAlpha *= inA; pb.draw(g); g.restore(); } }); }
      // with its inside to you, the card, the slots, the key, the slip and the token are always in front of the notes (a depth sort of
      // their middles could flip as the camera moved)
      if ((front.inVis || back.inVis) && o.slotFront !== false) { const zn = Math.min(...P.filter((q) => q.note).map((q) => q.z)); if (isFinite(zn)) for (const q of P) if (q.slot) q.z = Math.min(q.z, zn - 0.0005); }
      { const cd = P.find((q) => q.card); if (cd) for (const q of P) if (q.tok) q.z = Math.min(q.z, cd.z - 0.0003); }   // after test 7: the token always in front of the card (it jumped through it on "Plus a chai")
    }
    if (th < 0.5 && o.notes && o.edgeShow !== false) {                  // shut (or nearly): the notes' edge shows along the top
      const fr = leafFrame(Wt, 'back'), A = Wt.A, h = WH / 2, e0 = madd(madd(fr.o, A, h + 0.003), fr.n, 0.003), e1 = madd(e0, fr.b, WW * 0.86);
      const edA = 1 - clamp((th - 0.08) / 0.4);
      P.push({ z: zOf(cam, e0) + 0.0015, draw: (g) => { const a = cam.P(...madd(e0, fr.b, 0.008)), b = cam.P(...e1); if (!a || !b) return; g.save(); g.globalAlpha *= edA; g.strokeStyle = '#e0b84e'; g.lineCap = 'round'; g.lineWidth = Math.max(2, 0.0055 * a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = '#e9bf55'; g.lineWidth = Math.max(1, 0.0018 * a[2]); g.beginPath(); g.moveTo(a[0], a[1] - 0.0015 * a[2]); g.lineTo(lerp(a[0], b[0], 0.7), lerp(a[1], b[1], 0.7) - 0.0015 * a[2]); g.stroke(); g.restore(); } });
    }
    return P;
  }
  function mk2(name) {
    if (TEX[name]) return TEX[name];
    if (name === 'slip') TEX[name] = mk(240, 120, (g, w, h) => { g.fillStyle = '#f2ecdc'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(60,60,90,0.45)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(16, 24 + i * 24); g.lineTo(16 + 120 + 70 * Math.sin(i * 2.1), 24 + i * 24); g.stroke(); } g.strokeStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); });
    return TEX[name];
  }

  // ------------------------------------------------------------------ the chai token: a brass disc
  function token(cam, C0, n, up, lt, o = {}) {
    const r = o.r || 0.014, nn = norm(n), a1 = ortho(up, nn), a2 = cross(nn, a1);
    const z = zOf(cam, C0) + (o.dz || 0);
    return [{ z, draw: (g) => {
      const c = cam.P(...C0), p1 = cam.P(...madd(C0, a1, r)), p2 = cam.P(...madd(C0, a2, r)); if (!c || !p1 || !p2) return;
      const e = cam.P(...madd(C0, nn, -0.0025));                       // its edge, the side away from you
      g.save(); if (o.a != null) g.globalAlpha *= o.a;
      const iw = inkW(c[2]) * 0.6;
      if (e) { g.fillStyle = '#6e4a0e'; g.beginPath(); g.ellipse(e[0], e[1], Math.hypot(p1[0] - c[0], p1[1] - c[1]), Math.hypot(p2[0] - c[0], p2[1] - c[1]), Math.atan2(p1[1] - c[1], p1[0] - c[0]), 0, TAU); g.strokeStyle = INK; g.lineWidth = iw * 2; g.stroke(); g.fill(); }
      g.save(); g.transform(p1[0] - c[0], p1[1] - c[1], p2[0] - c[0], p2[1] - c[1], c[0], c[1]); g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.restore(); g.strokeStyle = INK; g.lineWidth = iw * 2; g.stroke();
      g.transform(p1[0] - c[0], p1[1] - c[1], p2[0] - c[0], p2[1] - c[1], c[0], c[1]);   // the unit disc onto the screen
      g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.clip(); g.drawImage(tex('token'), -1, -1, 2, 2);
      const sh = facing(cam, C0, nn); g.fillStyle = `rgba(255,248,220,${(0.22 * clamp(sh)).toFixed(3)})`; g.fillRect(-1, -1, 2, 1);
      g.restore();
    } }];
  }

  // ------------------------------------------------------------------ his glass of chai, and its steam
  // C0: the middle of its base; ax: its axis (up when it stands); lt; o.fill: how full (0..1); o.t: the clock, for the steam
  function glass(cam, C0, ax, lt, o = {}) {
    const H = 0.072, rb = 0.022, rt = 0.029, A = norm(ax), side = ortho([1, 0, 0], A), z = zOf(cam, madd(C0, A, H / 2));
    const fill = o.fill ?? 0.78;
    return [{ z: z + (o.dz || 0), draw: (g) => {
      const b = cam.P(...C0), t = cam.P(...madd(C0, A, H)), f = cam.P(...madd(C0, A, H * fill)); if (!b || !t || !f) return;
      const ell = (c, r, ctr) => { const s = c[2] * r, tilt = Math.abs(cam.dirCam(A[0], A[1], A[2])[2]); return [s, s * Math.max(0.12, tilt), Math.atan2(t[1] - b[1], t[0] - b[0]) + PI / 2]; };
      const [bx, by, ba] = ell(b, rb), [tx, ty] = ell(t, rt), [fx, fy] = ell(f, lerp(rb, rt, fill));
      const ang = ba;
      g.save(); g.translate(0, 0);
      const outline = (x0, y0, w0, x1, y1, w1) => { const dx = Math.cos(ang), dy = Math.sin(ang); g.beginPath(); g.moveTo(x0 - dx * w0, y0 - dy * w0); g.lineTo(x1 - dx * w1, y1 - dy * w1); g.lineTo(x1 + dx * w1, y1 + dy * w1); g.lineTo(x0 + dx * w0, y0 + dy * w0); g.closePath(); };
      // the chai inside
      outline(b[0], b[1], bx * 0.92, f[0], f[1], fx * 0.95); g.fillStyle = shadeOf(cam, '#b07848', [1, 0, -0.4], lt, 0.7); g.fill();
      g.fillStyle = shadeOf(cam, '#c99466', [0, 1, 0], lt, 0.6); g.beginPath(); g.ellipse(b[0], b[1], bx * 0.92, by * 0.92, ang, 0, PI); g.fill();
      g.fillStyle = '#d9b48a'; g.beginPath(); g.ellipse(f[0], f[1], fx * 0.95, fy * 0.95, ang, 0, TAU); g.fill();               // the top of the tea
      g.fillStyle = 'rgba(245,225,195,0.65)'; g.beginPath(); g.ellipse(f[0], f[1], fx * 0.95, fy * 0.95, ang, 0, TAU); g.ellipse(f[0], f[1], fx * 0.72, fy * 0.7, ang, 0, TAU); g.fill('evenodd');   // the froth at its edge
      // the glass: clear, faceted, catching the light
      outline(b[0], b[1], bx, t[0], t[1], tx); g.fillStyle = 'rgba(230,240,245,0.16)'; g.fill(); g.strokeStyle = rgba(INK, 0.85); g.lineWidth = inkW(t[2]) * 0.6; g.lineJoin = 'round'; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = Math.max(1, 0.0016 * t[2]);
      for (let k = -3; k <= 3; k++) { const u = k / 4, dx = Math.cos(ang), dy = Math.sin(ang); g.beginPath(); g.moveTo(b[0] + dx * bx * u, b[1] + dy * bx * u); g.lineTo(t[0] + dx * tx * u, t[1] + dy * tx * u); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = Math.max(1.2, 0.0022 * t[2]); g.beginPath(); g.ellipse(t[0], t[1], tx, ty, ang, 0, TAU); g.stroke();   // the rim
      g.fillStyle = 'rgba(255,255,255,0.5)'; { const dx = Math.cos(ang), dy = Math.sin(ang); g.beginPath(); g.moveTo(b[0] - dx * bx * 0.62, b[1] - dy * bx * 0.62); g.lineTo(t[0] - dx * tx * 0.62, t[1] - dy * tx * 0.62); g.lineTo(t[0] - dx * tx * 0.45, t[1] - dy * tx * 0.45); g.lineTo(b[0] - dx * bx * 0.48, b[1] - dy * bx * 0.48); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = Math.max(1, 0.002 * b[2]); g.beginPath(); g.ellipse(b[0], b[1], bx, by, ang, 0, PI); g.stroke();   // the thick base
      g.restore();
    } }];
  }
  // steam off a hot surface: soft wisps that rise and sway (a pure function of t). top: where it rises from; k: how much
  function steam(cam, top, t, k = 1, o = {}) {
    if (k <= 0.01) return [];
    const z = zOf(cam, top) - 0.001;
    return [{ z: z + (o.dz || 0), draw: (g) => {
      const p0 = cam.P(...top); if (!p0) return;
      g.save(); g.lineCap = 'round';
      for (let w = 0; w < (o.n || 3); w++) {
        const ph = w * 2.1 + (o.seed || 0), life = ((t * 0.55 + w / 3 + (o.seed || 0) * 0.13) % 1 + 1) % 1, h = (o.h || 0.11) * (0.35 + life);
        g.beginPath(); const N = 14;
        for (let i = 0; i <= N; i++) {
          const v = i / N, y = -v * h, x = Math.sin(v * 5.2 + t * 1.7 + ph) * 0.012 * (0.3 + v) + Math.sin(t * 0.9 + ph) * 0.006 * v + (w - 1) * 0.008;
          const q = cam.P(top[0] + x, top[1] - y, top[2]); if (!q) continue; i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
        }
        const a = 0.3 * k * Math.sin(PI * life) * (o.a ?? 1);
        g.strokeStyle = `rgba(255,250,240,${a.toFixed(3)})`; g.lineWidth = Math.max(2, 0.009 * p0[2]); g.stroke();
      }
      g.restore();
    } }];
  }

  window.PROPS = { tex, texTri, face, facing, shadeOf, sheet, notes, wallet, leafFrame, token, glass, steam, rot, NOTES, NL, NW, NT, WW, WH, WT, SK };
})();
