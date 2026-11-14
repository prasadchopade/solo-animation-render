// Reel 39 · Let Him Through?: the faces (this reel's own). Reel 37's RIG.head3, a head that turns all the way round, grown
// for faces this big and this close: ears with a shape (how far they stand out, a free or an attached lobe, a folded rim),
// a beard, weight, a receding hairline, big curly hair, white hair, the lines of age; a bust under the head; and the
// passport photo of any of them, in a passport photo's flat light. Ears are the reel's clue: in pair 4 they are the only
// thing that differs between the man and his photo, and in every other pair they match (docs/script.md).
// Head units: 1 = half the skull's width, y up, the origin in the middle of the head. psi: 0 he faces you, + turned to
// your right, ±π the back of his head. Every function is a pure function of its arguments (the render contract).
(() => {
  const C = window.C, { clamp, lerp } = C;
  const RG = window.RIG, { mix, rgba, sstep, TAU, PI } = RG;
  const SHD = '#3a2440';
  const SK = [0, 0.32, -0.10, 1.0, 0.98, 1.14];
  const HAIR = {                                      // the hairline's latitude (degrees) at the front, the temple corner, by the ear, behind it, the nape; thickness
    short: { line: [44, 16, 2, -12, -58], vol: 0.07 },
    part: { line: [46, 20, 4, -10, -55], vol: 0.12, part: 1 },
    curly: { line: [42, 18, -2, -18, -58], vol: 0.19, curl: 1, even: 1 },
    afro: { line: [38, 12, 0, -16, -56], vol: 0.42, curl: 1.6, even: 1 },
    buzz: { line: [47, 22, 0, -16, -58], vol: 0.025, thin: 0.42, even: 1 },
    swept: { line: [47, 21, 2, -12, -58], vol: 0.2, part: 1, wave: 1 },
  };
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    const up = []; for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  const R1 = C.mulberry32(3901), STR = Array.from({ length: 420 }, () => [R1(), R1(), R1(), R1()]);   // fixed strands for beards (made once)

  // the ear's outline in its own coordinates: u across from the root (0) to the rim (1), v up (−1 the lobe's foot, 1 the top)
  const EAR_TOP = [[0.04, 0.80], [0.14, 0.97], [0.36, 1.03], [0.60, 0.96], [0.80, 0.80], [0.94, 0.55], [1.0, 0.25], [0.98, -0.05], [0.90, -0.32], [0.78, -0.52]];
  const LOBE_FREE = [[0.70, -0.70], [0.58, -0.90], [0.42, -1.0], [0.26, -0.96], [0.15, -0.82], [0.10, -0.66], [0.04, -0.62]];
  const LOBE_ATT = [[0.66, -0.66], [0.52, -0.76], [0.38, -0.82], [0.24, -0.84], [0.12, -0.83], [0.04, -0.80], [0.0, -0.76]];
  const ANTI = [[0.46, 0.80], [0.66, 0.50], [0.72, 0.10], [0.60, -0.28], [0.40, -0.46]];

  // ------------------------------------------------------------------ the head
  function head(g, x, y, R, psi, L, o = {}) {
    const cs = Math.cos(psi), sn = Math.sin(psi), pitch = o.pitch || 0, flat = o.flat || 0;
    const lt = o.light || { x: -0.6, back: 0 }, lx = lt.x >= 0 ? 1 : -1;
    const fat = L.fat || 0, jawW = L.jawW || 1;
    const JW = [0, -0.50 - 0.07 * fat - 0.04 * (L.chin || 0), 0.15, 0.80 * jawW + 0.21 * fat, 0.80 + 0.06 * fat + 0.06 * (L.chin || 0), 0.84 + 0.08 * fat];
    const FC = [0, -0.10, 0.02, 0.98 + 0.05 * fat, 1.22, 1.03];
    const rot = (p) => [p[0] * cs + p[2] * sn, p[1], -p[0] * sn + p[2] * cs];
    const sil = (E) => { const c = rot([E[0], E[1], E[2]]); return { x: c[0], y: c[1], rx: Math.hypot(E[3] * cs, E[5] * sn), ry: E[4] }; };
    const sk = sil(SK), jw = sil(JW), dyF = -0.34 * pitch * cs, back = clamp(-cs * 1.25 - 0.1);
    jw.y += 0.3 * back; jw.ry *= 1 - 0.3 * back; jw.rx *= 1 - 0.16 * back;
    const pts = [];
    for (let i = 0; i < 30; i++) { const a = i / 30 * TAU; pts.push([sk.x + sk.rx * Math.cos(a), sk.y + sk.ry * Math.sin(a)]); pts.push([jw.x + jw.rx * Math.cos(a), jw.y + jw.ry * Math.sin(a) + dyF * 0.4]); }
    const H = hull(pts), outline = () => { g.beginPath(); H.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
    const bl = lt.back || 0;
    const skin = mix(L.skin, SHD, 0.16 * bl), skinD = mix(L.skinD, SHD, 0.2 * bl), skinH = mix(L.skinH, L.skin, 0.6 * bl);
    const hairC = mix(L.hair, '#d8d4cc', L.grey || 0);
    g.save(); g.translate(x, y); g.rotate((o.tilt || 0) - pitch * sn * 0.85); g.scale(R, -R); g.lineJoin = 'round'; g.lineCap = 'round';
    const zs = (fx, fy) => FC[2] + FC[5] * Math.sqrt(Math.max(0, 1 - (fx / FC[3]) ** 2 - ((fy - FC[1]) / FC[4]) ** 2));
    const fpt = (fx, fy) => { const z = zs(fx, fy), n = [fx / FC[3] ** 2, (fy - FC[1]) / FC[4] ** 2, (z - FC[2]) / FC[5] ** 2], nl = Math.hypot(n[0], n[1], n[2]) || 1, p = rot([fx, fy, z]); return [p[0], p[1] + dyF, (-n[0] * sn + n[2] * cs) / nl]; };

    // ---- the ears: a shaped ear on each side, its root tucked behind the cheek; how far it stands out is an angle
    const E = L.ear || {}, eH = 0.31 * (E.h ?? 1), eW = 0.42 * (E.w ?? 1), beta = (14 + 50 * (E.out ?? 0.35)) * PI / 180, eY = -0.06 + (E.y || 0), lobeK = E.lobe ?? 0.5;
    const OUTL = EAR_TOP.concat(LOBE_FREE.map((p, i) => [lerp(LOBE_ATT[i][0], p[0], lobeK), lerp(LOBE_ATT[i][1], p[1], lobeK) * (1 + 0.12 * (E.lobeL || 0) * lobeK)]), [[0.0, -0.40], [0.0, 0.40]]);
    const e3 = (k, u, v) => { const c = rot([k * (0.90 + u * eW * Math.sin(beta)), eY + v * eH + u * 0.03, -0.12 - u * eW * Math.cos(beta)]); return [c[0], c[1] + dyF * 0.5, c[2]]; };
    const ear = (k, a = 1) => {
      if (a <= 0.003) return;
      const nz = rot([k * Math.cos(beta), 0, Math.sin(beta)])[2], face = clamp(nz * 1.4 + 0.15);    // how much of the bowl faces you
      const sh = mix(skin, skinD, 0.32 + 0.2 * (1 - face)), dk = mix(skinD, '#3a1d12', 0.38);
      g.save(); g.globalAlpha *= a;
      g.fillStyle = sh; g.beginPath(); OUTL.forEach((q, i) => { const p = e3(k, q[0], q[1]); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); g.fill();
      if (face > 0.05) {
        g.globalAlpha *= clamp(face * 1.6);
        // the bowl (concha), darker, and the little flap in front of it (tragus)
        g.fillStyle = mix(dk, sh, 0.25); g.beginPath();
        for (let i = 0; i <= 20; i++) { const th = i / 20 * TAU, p = e3(k, 0.32 + 0.19 * Math.cos(th), -0.10 + 0.36 * Math.sin(th)); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
        g.closePath(); g.fill();
        g.fillStyle = mix(sh, skinH, 0.3); g.beginPath(); for (let i = 0; i <= 12; i++) { const th = i / 12 * TAU, p = e3(k, 0.13 + 0.06 * Math.cos(th), -0.12 + 0.13 * Math.sin(th)); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.closePath(); g.fill();
        // the ridge inside the rim (antihelix), lit
        g.strokeStyle = mix(sh, skinH, 0.55); g.lineWidth = 0.045; g.beginPath(); ANTI.forEach((q, i) => { const p = e3(k, q[0], q[1]); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
        // the rim's inner edge, a shadow just inside the outline
        g.strokeStyle = rgba(dk, 0.55); g.lineWidth = 0.028; g.beginPath(); for (let i = 1; i < 9; i++) { const q = EAR_TOP[i], p = e3(k, lerp(0.42, q[0], 0.84), lerp(0.05, q[1], 0.86)); if (i > 1) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.stroke();
        if (E.fold) {                                  // a rim folded over at the top: a heavy band along it
          g.strokeStyle = rgba(mix(dk, sh, 0.2), 0.75 * E.fold); g.lineWidth = 0.075 * E.fold; g.beginPath();
          for (let i = 1; i < 6; i++) { const q = EAR_TOP[i], p = e3(k, lerp(0.30, q[0], 0.9), lerp(0.20, q[1], 0.9)); if (i > 1) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.stroke();
        }
      }
      g.restore();
      // the outline itself, thin and warm
      g.save(); g.globalAlpha *= a * 0.8; g.strokeStyle = mix(skinD, '#3a1d12', 0.35); g.lineWidth = 0.028; g.beginPath(); OUTL.slice(0, EAR_TOP.length + LOBE_FREE.length).forEach((q, i) => { const p = e3(k, q[0], q[1]); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke(); g.restore();
    };
    if (L.long) { g.fillStyle = mix(hairC, '#000000', 0.12); g.beginPath(); g.ellipse(sk.x - sn * 0.22, -0.62 + 0.25 * (1 - L.long), 1.16, 1.12 + 0.55 * L.long, 0, 0, TAU); g.fill(); }
    if (!L.long || L.long < 0.6) for (const k of [-1, 1]) ear(k);

    // ---- the face
    outline();
    if (flat) { g.fillStyle = mix(skin, skinH, 0.35 * flat); g.fill(); }
    else { const q0 = g.createLinearGradient(lx * 1.0, 1.1, -lx * 0.9, -1.1); q0.addColorStop(0, skinH); q0.addColorStop(0.45, skin); q0.addColorStop(1, skinD); g.fillStyle = q0; g.fill(); }
    g.save(); outline(); g.clip();
    if (Math.abs(sn) > 0.02 && cs > -0.3) {
      const e = Math.sign(sn) * 1.05, q = g.createLinearGradient(e, 0, e - Math.sign(sn) * 1.05, 0); q.addColorStop(0, `rgba(70,32,18,${(0.3 * Math.abs(sn)).toFixed(3)})`); q.addColorStop(1, 'rgba(70,32,18,0)'); g.fillStyle = q; g.fillRect(-2, -2, 4, 4);
    }
    if (!flat) {                                       // the side away from the light, and the soft round of the cheeks
      const q = g.createLinearGradient(-lx * 1.1, 0, -lx * 0.2, 0); q.addColorStop(0, 'rgba(70,32,18,0.16)'); q.addColorStop(1, 'rgba(70,32,18,0)'); g.fillStyle = q; g.fillRect(-2, -2, 4, 4);
    }
    if (fat > 0.05 && cs > 0) {                        // full cheeks: a warm round under each eye, and a crease under the chin
      for (const k of [-1, 1]) { const c = fpt(k * 0.55, -0.38); if (c[2] < 0.1) continue; g.fillStyle = `rgba(255,190,150,${(0.10 * fat).toFixed(3)})`; g.beginPath(); g.ellipse(c[0], c[1], 0.28, 0.2, 0, 0, TAU); g.fill(); }
    }
    if (L.stub && cs > -0.3) { const q = g.createLinearGradient(0, -0.3, 0, -1.2); q.addColorStop(0, 'rgba(30,22,18,0)'); q.addColorStop(1, `rgba(30,22,18,${(0.36 * L.stub).toFixed(3)})`); g.fillStyle = q; g.fillRect(-2, -1.5, 4, 1.2); }
    const ex = o.look || [0, 0], close = Math.max(o.close || 0, 0), lid = o.lid || 0;
    // the lines of age: the forehead, round the eyes, from the nose to the mouth
    const age = L.lines || 0;
    if (age > 0.02 && cs > 0.1) {
      g.strokeStyle = rgba(mix(skinD, '#4a2416', 0.3), 0.35 * age); g.lineWidth = 0.022;
      for (const fy of [0.60, 0.70, 0.80]) { g.beginPath(); let on = false; for (let i = 0; i <= 8; i++) { const fx = -0.42 + 0.84 * i / 8, p = fpt(fx, fy + 0.025 * Math.sin(i * 0.9 + fy * 9)); if (p[2] < 0.1) { on = false; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; } g.stroke(); }
      for (const k of [-1, 1]) for (const d of [-0.06, 0.02, 0.1]) { const a0 = fpt(k * 0.72, 0.06 + d), a1 = fpt(k * 0.84, 0.08 + d * 1.6); if (a0[2] < 0.1) continue; g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a1[0], a1[1]); g.stroke(); }
    }
    if ((L.folds || 0) > 0.02 && cs > 0.1) {           // from the nose's wings down to the corners of the mouth
      g.strokeStyle = rgba(mix(skinD, '#4a2416', 0.3), 0.4 * L.folds); g.lineWidth = 0.03;
      for (const k of [-1, 1]) { g.beginPath(); let on = false; for (let i = 0; i <= 6; i++) { const u = i / 6, p = fpt(k * lerp(0.24, 0.40, u), lerp(-0.38, -0.80, u)); if (p[2] < 0.1) { on = false; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; } g.stroke(); }
    }
    g.restore();

    // ---- the beard: from the sideburns down the cheeks to below the jaw; the lips cut back in; strands inside it
    const bd = L.beard || 0;
    if (bd > 0.01 && cs > -0.6) {
      const bg = L.beardGrey ?? L.grey ?? 0, bc = mix(mix(L.beardC || L.hair, '#3a3430', 0.25), '#cfcac2', bg * 0.75), bv = 0.035 + 0.075 * bd;
      // the top edge, across the face: sideburn, down the cheek, under the cheekbone, into the moustache's corner
      const top = [[-0.93, 0.10], [-0.91, -0.04], [-0.86, -0.20], [-0.78, -0.34], [-0.65, -0.46], [-0.50, -0.53], [-0.36, -0.57]];
      const edge = [];
      for (const [fx, fy] of top) { const p = Math.abs(fx) > 0.94 ? (() => { const c = rot([fx, fy, -0.02]); return [c[0], c[1] + dyF]; })() : fpt(fx, fy); edge.push(p); }
      const edgeR = top.slice().reverse().map(([fx, fy]) => (Math.abs(fx) > 0.94 ? (() => { const c = rot([-fx, fy, -0.02]); return [c[0], c[1] + dyF]; })() : fpt(-fx, fy)));
      const mid0 = fpt(0, -0.58);
      const below = () => { g.beginPath(); edge.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.lineTo(mid0[0], mid0[1]); edgeR.forEach((p) => g.lineTo(p[0], p[1])); g.lineTo(2.4, -0.2); g.lineTo(2.4, -3.2); g.lineTo(-2.4, -3.2); g.lineTo(-2.4, -0.2); g.closePath(); };
      const shape = () => {                            // the head's outline and the chin's fullness, as one path
        g.beginPath(); H.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
        const N = 36, cy0 = jw.y - bv * 0.35 + dyF * 0.4; g.moveTo(jw.x - (jw.rx * 0.92 + bv * 0.5), cy0);
        for (let i = 0; i <= N; i++) { const a = -PI + i / N * PI, rr = 1 + 0.02 * Math.sin(i * 3.1) * bd; g.lineTo(jw.x + (jw.rx * 0.92 + bv * 0.5) * rr * Math.cos(a), cy0 + (jw.ry + bv * 1.15) * rr * Math.sin(a)); }
        g.closePath();
      };
      g.save(); g.globalAlpha *= clamp(bd * 1.8);
      below(); g.clip();
      shape(); g.fillStyle = bc; g.fill();
      shape(); g.clip();
      // shading: darker under the jaw, lighter on the cheeks
      const q = g.createLinearGradient(0, -0.3, 0, jw.y - jw.ry - bv); q.addColorStop(0, rgba(mix(bc, '#ffffff', 0.08), 0.0)); q.addColorStop(1, rgba(mix(bc, '#000000', 0.35), 0.55)); g.fillStyle = q; g.fillRect(-2, -2.5, 4, 2.5);
      g.lineWidth = 0.02;
      for (let i = 0; i < 380; i++) {
        const [r1, r2, r3, r4] = STR[i], px = lerp(-1.15, 1.15, r1), py = lerp(0.25, jw.y - jw.ry - bv, r2);
        const light = r3 > 0.62 - 0.4 * bg;
        g.strokeStyle = light ? rgba(mix(bc, '#f6f2ec', 0.55 + 0.35 * bg), 0.32 + 0.45 * bg) : rgba(mix(bc, '#0c0806', 0.5), 0.45);
        const ang = -PI / 2 + px * 0.5 + (r4 - 0.5) * 0.7; g.beginPath(); g.moveTo(px, py); g.lineTo(px + 0.06 * Math.cos(ang), py + 0.06 * Math.sin(ang)); g.stroke();
      }
      g.restore();
    }

    // ---- the mouth, wrapped round the face; lips when he's close enough to see them
    if (cs > -0.35) {
      const sm = o.smile || 0, my = -0.74 - 0.03 * fat, N = 9, mw = 0.27 * (L.mouthW || 1);
      const mp = (u) => fpt(u * mw, my + sm * 0.09 * u * u - sm * 0.03 + (o.smirk || 0) * 0.07 * Math.max(0, u * Math.sign(sn || 1)) + (o.open || 0) * 0 );
      if (bd > 0.3) {                                  // inside a beard the lips show as a warm band
        g.fillStyle = mix(skinD, '#7a2f26', 0.35); g.beginPath();
        for (let i = 0; i < N; i++) { const p = mp(-1 + 2 * i / (N - 1)); if (i) g.lineTo(p[0], p[1] + 0.012); else g.moveTo(p[0], p[1] + 0.012); }
        for (let i = N - 1; i >= 0; i--) { const u = -1 + 2 * i / (N - 1), p = mp(u); g.lineTo(p[0], p[1] - 0.07 * (1 - u * u * 0.7)); }
        g.closePath(); g.fill();
      } else if (L.lip !== 0) {                        // the lower lip's soft shadow
        g.fillStyle = rgba(mix(skinD, '#6a2a20', 0.3), 0.32); const c = mp(0); g.beginPath(); g.ellipse(c[0], c[1] - 0.06, mw * 0.62, 0.045 * (L.lip || 1), 0, 0, TAU); g.fill();
      }
      g.strokeStyle = '#3c1d18'; g.lineWidth = 0.034; g.beginPath(); let on = false;
      for (let i = 0; i < N; i++) { const p = mp(-1 + 2 * i / (N - 1)); if (p[2] < 0.06) { on = false; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; }
      g.stroke();
      if (L.must || bd > 0.3) {                        // the moustache: thick in the middle, thinning to the corners
        const th0 = L.must || 0.12 * bd, mc = mix(L.mustC || L.beardC || L.hair, '#d8d4cc', L.mustGrey ?? L.beardGrey ?? L.grey ?? 0);
        const upp = [], low = []; for (let i = 0; i < 13; i++) { const uu = -1 + i / 6, fx = uu * (0.31 + 0.05 * bd), p = fpt(fx, -0.585 - 0.07 * uu * uu); if (p[2] < 0.06) continue; const th = th0 * (1 - 0.6 * Math.pow(Math.abs(uu), 1.5)); upp.push([p[0], p[1] + th * 0.62]); low.push([p[0], p[1] - th * 0.42]); }
        if (upp.length > 2) { g.fillStyle = mc; g.beginPath(); upp.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (let j = low.length - 1; j >= 0; j--) g.lineTo(low[j][0], low[j][1]); g.closePath(); g.fill();
          g.strokeStyle = rgba(mix(mc, '#000000', 0.4), 0.5); g.lineWidth = 0.014; for (let j = 1; j < upp.length - 1; j += 1) { const a = upp[j], b = low[j]; g.beginPath(); g.moveTo(lerp(a[0], b[0], 0.15), lerp(a[1], b[1], 0.15)); g.lineTo(lerp(a[0], b[0], 0.85) + 0.01, lerp(a[1], b[1], 0.85)); g.stroke(); } }
      }
    }
    // ---- the eyes, the brows
    for (const k of [-1, 1]) {
      const e = fpt(k * 0.43, 0.06); if (e[2] < 0.13) continue;
      if (o.out) { const a = (o.tilt || 0) - pitch * sn * 0.85, ca = Math.cos(a), sa = Math.sin(a), wf0 = clamp(e[2] * 1.12, 0.22, 1), px = e[0] + wf0 * (ex[0] + sn * 0.05), py = e[1] + 0.016 + ex[1]; (o.out.eyes = o.out.eyes || []).push({ k, x: x + R * (px * ca + py * sa), y: y + R * (px * sa - py * ca), r: 0.098 * R }); }
      const wf = clamp(e[2] * 1.12, 0.22, 1), ew = L.ew ?? 0.235, eh = L.eh ?? 0.13, cl = Math.max(close, (lid + (L.lid || 0)) * 0.55), up = eh * 1.75 * (1 - cl), dn = eh * 1.05 * (1 - cl * 0.72);
      g.save(); g.translate(e[0], e[1]); g.scale(wf, 1);
      if ((L.bags || 0) > 0.02) { g.strokeStyle = rgba(mix(skinD, '#4a2416', 0.3), 0.35 * L.bags); g.lineWidth = 0.022; g.beginPath(); g.moveTo(-ew * 0.8, -dn - 0.05); g.quadraticCurveTo(0, -dn - 0.12, ew * 0.8, -dn - 0.05); g.stroke(); }
      if (cl < 0.92) {
        const shape = () => { g.beginPath(); g.moveTo(-ew, -0.016); g.quadraticCurveTo(-k * 0.03, up, ew, -0.016); g.quadraticCurveTo(k * 0.03, -dn, -ew, -0.016); g.closePath(); };
        g.save(); shape(); g.fillStyle = flat ? '#fdfaf2' : '#fbf7ee'; g.fill(); shape(); g.clip();
        const ix = ex[0] + sn * 0.05, iy = 0.016 + ex[1], ir = 0.098;
        const qi = g.createRadialGradient(ix, iy, 0.01, ix, iy, ir); qi.addColorStop(0, '#4f3421'); qi.addColorStop(1, '#26170d'); g.fillStyle = qi; g.beginPath(); g.arc(ix, iy, ir, 0, TAU); g.fill();
        g.fillStyle = '#060404'; g.beginPath(); g.arc(ix, iy, ir * 0.52, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(ix - 0.032, iy + 0.038, flat ? 0.03 : 0.025, 0, TAU); g.fill();
        g.fillStyle = 'rgba(40,20,10,0.16)'; g.fillRect(-ew, up * 0.45, ew * 2, up);
        g.restore();
        g.strokeStyle = '#231510'; g.lineWidth = 0.036; g.beginPath(); g.moveTo(-ew, -0.016); g.quadraticCurveTo(-k * 0.03, up, ew, -0.016); g.stroke();
        g.strokeStyle = 'rgba(40,20,10,0.3)'; g.lineWidth = 0.014; g.beginPath(); g.moveTo(-ew * 0.82, -0.022); g.quadraticCurveTo(k * 0.03, -dn, ew * 0.82, -0.022); g.stroke();
      } else { g.strokeStyle = '#231510'; g.lineWidth = 0.04; g.beginPath(); g.moveTo(-ew * 0.92, -0.005); g.quadraticCurveTo(0, -0.07, ew * 0.92, -0.005); g.stroke(); }
      g.restore();
    }
    g.strokeStyle = mix(L.browC || L.hair, '#d8d4cc', L.browGrey ?? (L.grey || 0) * 0.7); g.lineWidth = L.brow ?? 0.075;
    for (const k of [-1, 1]) {
      const tilt = (o.browTilt ?? L.browTilt ?? 0), by = 0.31 + (o.browY || 0) + (k * Math.sign(sn || 1) > 0 ? (o.browUp || 0) : 0); g.beginPath(); let on = false;
      for (let i = 0; i < 5; i++) { const u = i / 4, fx = k * lerp(0.17, 0.69, u), p = fpt(fx, by - tilt * (1 - u) + (L.browArch ?? 0.04) * Math.sin(PI * u)); if (p[2] < 0.1) { on = false; continue; } if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; }
      g.stroke();
    }
    // ---- the nose in front: a shadow and nostrils (they fade as he turns; side-on the nose is its own shape, below)
    const nw = L.noseW || 1, nL = L.noseL || 0;
    if (cs > 0.25) { const a = clamp((cs - 0.25) * 2.2), nb = fpt(0, -0.36 - nL); g.fillStyle = `rgba(90,45,25,${((flat ? 0.12 : 0.2) * a).toFixed(3)})`; g.beginPath(); g.ellipse(nb[0] + sn * 0.22, nb[1] + 0.03, 0.19 * nw, 0.05, 0, 0, TAU); g.fill(); g.fillStyle = `rgba(74,36,22,${(0.8 * a).toFixed(3)})`; for (const k of [-1, 1]) { const p = fpt(k * 0.07 * nw, -0.335 - nL); g.beginPath(); g.ellipse(p[0] + sn * 0.2, p[1], 0.043 * Math.max(0.4, cs) * nw, 0.025, 0, 0, TAU); g.fill(); }
      if (!flat) { g.strokeStyle = `rgba(90,45,25,${(0.25 * a).toFixed(3)})`; g.lineWidth = 0.02; const s0 = fpt(-lx * 0.1, 0.0), s1 = fpt(-lx * 0.13, -0.28); g.beginPath(); g.moveTo(s0[0], s0[1]); g.quadraticCurveTo(s1[0] - lx * 0.02, (s0[1] + s1[1]) / 2, s1[0], s1[1]); g.stroke(); } }
    if (cs > -0.25 && Math.abs(sn) > 0.12) {
      const a = clamp((Math.abs(sn) - 0.12) * 3) * clamp((cs + 0.25) * 4), b = fpt(0, 0.04), nb = fpt(0, -0.42), tp = rot([0, -0.29, zs(0, -0.29) + 0.25]), sg = Math.sign(sn);
      g.globalAlpha = a; g.fillStyle = mix(skin, skinD, 0.3 + 0.5 * Math.abs(sn) * clamp(cs + 0.3)); g.beginPath(); g.moveTo(b[0] - sg * 0.04, b[1]); g.quadraticCurveTo(tp[0] + sg * 0.02, tp[1] + dyF + 0.17, tp[0], tp[1] + dyF); g.quadraticCurveTo(tp[0] - sg * 0.02, nb[1] + 0.005, nb[0] - sg * 0.05, nb[1]); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(90,45,25,0.35)'; g.lineWidth = 0.022; g.beginPath(); g.moveTo(tp[0] - sg * 0.01, tp[1] + dyF - 0.02); g.quadraticCurveTo(tp[0] - sg * 0.07, nb[1] + 0.01, nb[0] - sg * 0.06, nb[1]); g.stroke(); g.globalAlpha = 1;
    }

    // ---- the hair: the skull above the hairline
    const patch = (line, vol, fill, hs2 = {}) => {
      const lat = (phi) => { const a = Math.abs(phi) * 180 / PI, [f, tc, e, be, np] = line; return (a < 38 ? f : a < 66 ? lerp(f, tc, sstep(38, 66, a)) : a < 92 ? lerp(tc, e, sstep(66, 92, a)) : a < 112 ? lerp(e, be, sstep(92, 112, a)) : lerp(be, np, sstep(112, 150, a))) * PI / 180; };
      const N = 96, vis = [], hp = [];
      for (let i = 0; i < N; i++) {
        const phi = -PI + (i + 0.5) / N * TAU, th = lat(phi), c = Math.cos(th);
        const p3 = [SK[3] * c * Math.sin(phi), SK[1] + SK[4] * Math.sin(th), SK[2] + SK[5] * c * Math.cos(phi)], n = [p3[0] / SK[3] ** 2, 0, (p3[2] - SK[2]) / SK[5] ** 2], p = rot(p3);
        vis.push(-n[0] * sn + n[2] * cs > 0); hp.push([p[0], p[1] + dyF * 0.5]);
      }
      let i0 = -1; for (let i = 0; i < N; i++) if (vis[i] && !vis[(i + N - 1) % N]) { i0 = i; break; }
      if (i0 < 0) return null;
      const run = []; for (let j = 0; j < N && vis[(i0 + j) % N]; j++) run.push(hp[(i0 + j) % N]);
      const Aa = run[0], Bb = run[run.length - 1], tau = (p) => Math.atan2((p[1] - sk.y - dyF * 0.5) / sk.ry, (p[0] - sk.x) / sk.rx);
      const t0 = tau(Bb), t1 = tau(Aa), dpos = ((t1 - t0) % TAU + TAU) % TAU, top = ((PI / 2 - t0) % TAU + TAU) % TAU, d = top <= dpos ? dpos : dpos - TAU;
      const v = 1 + vol, arc = [], cu = hs2.curl || 0;
      for (let j = 0; j <= 36; j++) { const a = t0 + d * j / 36, bump = cu ? 0.045 * cu * Math.sin(j * 2.1 + 0.6) : (hs2.rough || 0.012) * (Math.sin(j * 5.3 + 1.1) + 0.5 * Math.sin(j * 11.7)), vv = hs2.even ? v : 1 + vol * (0.25 + 0.75 * clamp(Math.sin(a) * 1.25)) + (hs2.wave ? 0.05 * clamp(Math.cos(a) * (L.partSide || 1)) * clamp(Math.sin(a) * 2) : 0); arc.push([sk.x + sk.rx * (vv + bump) * Math.cos(a), sk.y + dyF * 0.5 + sk.ry * (vv + bump) * Math.sin(a)]); }
      g.fillStyle = fill; g.beginPath(); run.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); arc.forEach((p) => g.lineTo(p[0], p[1])); g.closePath(); g.fill();
      if (cu) { for (let j = 1; j <= 35; j += 2) { const p = arc[j]; g.beginPath(); g.arc(lerp(p[0], sk.x, 0.08), lerp(p[1], sk.y, 0.08), 0.13 + 0.07 * cu, 0, TAU); g.fill(); } }
      return { arc, d, run };
    };
    const hs = HAIR[L.style] || HAIR.short, rc = L.recede || 0;
    const line = hs.line.map((v, i) => v + (i === 0 ? 17 * rc : i === 1 ? 30 * rc : 0));
    const hc = hs.thin ? mix(hairC, L.skin, hs.thin) : hairC;
    const hp0 = patch(line, (hs.vol + (L.vol || 0)) * (1 - 0.35 * rc), hc, hs);
    if (hp0 && cs > -0.5) {                             // texture, inside the hair: layers that follow its shape, curls, or stubble
      const { run, arc } = hp0, nR = run.length, nA = arc.length, vol0 = hs.vol + (L.vol || 0);
      const at = (u, v) => { const a = run[Math.min(nR - 1, Math.max(0, Math.round(u * (nR - 1))))], b = arc[Math.min(nA - 1, Math.max(0, Math.round((1 - u) * (nA - 1))))]; return [lerp(a[0], b[0], v), lerp(a[1], b[1], v)]; };
      g.save(); g.beginPath(); run.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); arc.forEach((p) => g.lineTo(p[0], p[1])); g.closePath(); g.clip();
      const dark = mix(hc, '#050302', 0.45), lite = mix(hc, '#fff6e8', hairC === L.hair && !(L.grey > 0.3) ? 0.28 : 0.5);
      if (hs.thin) {                                    // a buzz cut: the scalp shows through a stipple of short hair
        g.fillStyle = rgba(dark, 0.55); for (let i = 0; i < 260; i++) { const [r1, r2] = STR[i], p = at(r1, 0.08 + 0.9 * r2); g.beginPath(); g.arc(p[0], p[1], 0.012 + 0.008 * STR[i + 1][0], 0, TAU); g.fill(); }
      } else if (hs.curl) {                             // curls: little dark arcs and lit tops
        g.lineWidth = 0.026;
        for (let i = 0; i < 70 + 50 * (hs.curl > 1 ? 1 : 0); i++) { const [r1, r2, r3] = STR[i], p = at(r1, 0.12 + 0.85 * r2), rr = 0.05 + 0.03 * r3; g.strokeStyle = rgba(r3 > 0.5 ? lite : dark, 0.6); g.beginPath(); g.arc(p[0], p[1], rr, PI * (0.1 + r3), PI * (1.2 + r3)); g.stroke(); }
      } else {                                          // straight hair: long layered strokes following the hair's shape, swept to one side
        const sw = (L.partSide || 1) * 0.06;
        for (let li = 0; li < 7; li++) {
          const v = 0.16 + li * 0.12, u0 = STR[li][0] * 0.12, u1 = 1 - STR[li][1] * 0.12;
          g.strokeStyle = rgba(li % 2 ? lite : dark, li % 2 ? (L.grey > 0.3 ? 0.55 : 0.32) : 0.45); g.lineWidth = 0.02 + 0.012 * (li % 3);
          g.beginPath(); let on = false;
          for (let j = 0; j <= 24; j++) { const u = lerp(u0, u1, j / 24); if (STR[li * 25 + j][2] < 0.12) { on = false; continue; } const p = at(u, v + sw * Math.sin(PI * u)); if (on) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); on = true; }
          g.stroke();
        }
      }
      g.restore();
      if (hs.part && cs > -0.2) { g.globalAlpha = clamp((cs + 0.2) * 3); const pp = fpt(0.34 * (L.partSide || 1), 0.99), pq = rot([0.42 * (L.partSide || 1), SK[1] + SK[4] * 0.93 + vol0 * 0.5, SK[2] + 0.2]); g.strokeStyle = mix(hairC, L.skin, 0.45); g.lineWidth = 0.028; g.beginPath(); g.moveTo(pp[0], pp[1] + 0.02); g.lineTo(pq[0], pq[1]); g.stroke(); g.globalAlpha = 1; }
      if (!hs.thin && !hs.curl) {                       // a few hairs out of place at the edge, so it reads as hair and not a cap
        g.strokeStyle = rgba(hc, 0.85); g.lineWidth = 0.016;
        for (let i = 0; i < 14; i++) { const j = 2 + Math.floor(STR[i + 40][0] * (nA - 4)), p = arc[j], q = arc[Math.min(nA - 1, j + 1)], nx = p[0] - sk.x, ny = p[1] - sk.y, nl = Math.hypot(nx, ny) || 1, ln = 0.03 + 0.04 * STR[i + 40][1]; g.beginPath(); g.moveTo(p[0] - nx / nl * 0.02, p[1] - ny / nl * 0.02); g.quadraticCurveTo(p[0] + nx / nl * ln, p[1] + ny / nl * ln, q[0] + nx / nl * ln * 0.6, q[1] + ny / nl * ln * 0.6); g.stroke(); }
      }
    }
    if (hp0 && !flat && (bl > 0.05 || Math.abs(lt.x) > 0.25)) {
      const { arc, d } = hp0; g.strokeStyle = `rgba(255,236,200,${(0.18 + 0.35 * bl).toFixed(3)})`; g.lineWidth = 0.045; g.beginPath(); const j0 = lx > 0 ? (d > 0 ? 0 : 18) : (d > 0 ? 18 : 0);
      for (let j = j0; j <= j0 + 18; j++) { const p = arc[j]; if (j === j0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); } g.stroke();
    }
    if (L.bun) { const b0 = rot([0, 0.95, -0.95]); g.fillStyle = hairC; g.beginPath(); g.arc(b0[0], b0[1] + dyF * 0.5, 0.36, 0, TAU); g.fill(); g.strokeStyle = rgba(mix(hairC, '#000000', 0.4), 0.5); g.lineWidth = 0.025; g.beginPath(); g.arc(b0[0], b0[1] + dyF * 0.5, 0.22, 0.4, 2.6); g.stroke(); }
    // the ear on your side, once it has come round onto the head
    if (!L.long || L.long < 0.6) for (const k of [-1, 1]) { const c = rot([k * 0.97, 0, -0.16]); if (c[2] > 0.2) ear(k, sstep(0.2, 0.55, c[2])); }
    g.restore();
  }

  // ------------------------------------------------------------------ the bust: shoulders, a collar, the neck, then the head
  // (x, y): the middle of the head; R: head units in px. L.shirt, L.collar ('shirt' | 'tee' | 'cardigan' | 'kurta'), L.check.
  function bust(g, x, y, R, L, o = {}) {
    const fat = L.fat || 0, flat = o.flat || 0, sw = (1.95 + 0.45 * fat + 0.15 * (L.broad || 0)) * R, ny = y + (1.18 + 0.05 * fat) * R, by = y + (o.deep || 3.4) * R;
    const lx = (o.light || { x: -0.6 }).x >= 0 ? 1 : -1;
    g.save();
    // shoulders and chest
    const shirt = L.shirt || '#6a8fc0', shirtD = mix(shirt, '#1a1420', 0.28);
    g.beginPath(); g.moveTo(x - sw, by); g.bezierCurveTo(x - sw, ny + 0.75 * R, x - sw * 0.75, ny + 0.32 * R, x - 0.62 * R, ny + 0.12 * R); g.lineTo(x + 0.62 * R, ny + 0.12 * R); g.bezierCurveTo(x + sw * 0.75, ny + 0.32 * R, x + sw, ny + 0.75 * R, x + sw, by); g.closePath();
    if (flat) g.fillStyle = mix(shirt, '#ffffff', 0.08 * flat); else { const q = g.createLinearGradient(x + lx * sw, 0, x - lx * sw, 0); q.addColorStop(0, mix(shirt, '#fff4e0', 0.12)); q.addColorStop(0.55, shirt); q.addColorStop(1, shirtD); g.fillStyle = q; }
    g.fill();
    if (L.check && (L.checkA ?? 1) > 0.01) {          // a checked shirt: two sets of soft stripes, clipped to the shirt
      g.save(); g.clip(); g.strokeStyle = rgba(L.check, 0.5 * (L.checkA ?? 1)); g.lineWidth = 0.09 * R;
      for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(x + i * 0.34 * R, ny); g.lineTo(x + i * 0.34 * R, by); g.stroke(); }
      for (let j = 0; j < 9; j++) { g.beginPath(); g.moveTo(x - sw, ny + 0.2 * R + j * 0.34 * R); g.lineTo(x + sw, ny + 0.2 * R + j * 0.34 * R); g.stroke(); }
      g.restore();
    }
    // the neck, shaded under the jaw
    const nw = (0.52 + 0.14 * fat) * R, skinN = mix(L.skin, L.skinD, 0.35);
    g.fillStyle = skinN; g.beginPath(); g.moveTo(x - nw, y + 0.55 * R); g.lineTo(x - nw * 1.06, ny + 0.28 * R); g.quadraticCurveTo(x, ny + 0.62 * R, x + nw * 1.06, ny + 0.28 * R); g.lineTo(x + nw, y + 0.55 * R); g.closePath(); g.fill();
    g.fillStyle = rgba(L.skinD, flat ? 0.25 : 0.5); g.beginPath(); g.ellipse(x, y + (0.98 + 0.06 * fat) * R, nw * 1.05, 0.2 * R, 0, 0, TAU); g.fill();
    // the collar
    const col = L.collar || 'shirt', cc = L.collarC || mix(shirt, '#ffffff', 0.18);
    if (col === 'shirt') {
      g.fillStyle = cc; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(x + k * nw * 1.08, ny - 0.02 * R); g.lineTo(x + k * nw * 1.35, ny + 0.36 * R); g.lineTo(x + k * 0.08 * R, ny + 0.66 * R); g.lineTo(x + k * 0.04 * R, ny + 0.4 * R); g.closePath(); g.fill(); }
      g.strokeStyle = rgba('#000000', 0.18); g.lineWidth = 0.025 * R; g.beginPath(); g.moveTo(x, ny + 0.5 * R); g.lineTo(x, by); g.stroke();
      g.fillStyle = rgba('#ffffff', 0.55); for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + 0.05 * R, ny + (0.9 + i * 0.55) * R, 0.035 * R, 0, TAU); g.fill(); }
    } else if (col === 'tee') {
      g.strokeStyle = mix(shirt, '#000000', 0.2); g.lineWidth = 0.09 * R; g.beginPath(); g.ellipse(x, ny + 0.2 * R, nw * 1.15, 0.36 * R, 0, 0.1, PI - 0.1); g.stroke();
    } else if (col === 'cardigan') {
      g.fillStyle = L.under || '#f2efe6'; g.beginPath(); g.moveTo(x - nw * 1.1, ny + 0.1 * R); g.lineTo(x, ny + 1.6 * R); g.lineTo(x + nw * 1.1, ny + 0.1 * R); g.closePath(); g.fill();
      g.fillStyle = mix(L.under || '#f2efe6', '#000000', 0.12); for (const k of [-1, 1]) { g.beginPath(); g.moveTo(x + k * nw * 1.05, ny); g.lineTo(x + k * nw * 1.4, ny + 0.3 * R); g.lineTo(x + k * 0.1 * R, ny + 0.5 * R); g.closePath(); g.fill(); }
      g.fillStyle = mix(shirt, '#000000', 0.3); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + 0.24 * R, ny + (1.8 + i * 0.5) * R, 0.05 * R, 0, TAU); g.fill(); }
    } else if (col === 'kurta') {
      g.strokeStyle = mix(shirt, '#000000', 0.22); g.lineWidth = 0.05 * R; g.beginPath(); g.moveTo(x - nw * 1.05, ny + 0.12 * R); g.quadraticCurveTo(x, ny + 0.36 * R, x + nw * 1.05, ny + 0.12 * R); g.stroke();
      g.beginPath(); g.moveTo(x, ny + 0.3 * R); g.lineTo(x, ny + 1.3 * R); g.stroke();
    }
    if (L.strap) {                                     // a bag strap across the chest
      g.strokeStyle = L.strap; g.lineWidth = 0.2 * R; g.beginPath(); g.moveTo(x - sw * 0.62, ny + 0.2 * R); g.lineTo(x + sw * 0.55, by); g.stroke();
    }
    g.restore();
    head(g, x, y, R, o.psi || 0, L, o);
  }

  // ------------------------------------------------------------------ the passport photo of a look
  // (x, y) the photo's top left, w its width; 35 × 45, the head about two thirds of it, a pale even ground, flat flash.
  const PH = 45 / 35;
  function photo(g, x, y, w, L, o = {}) {
    const h = w * PH, R = w * 0.30;
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    const bgq = g.createLinearGradient(x, y, x, y + h); bgq.addColorStop(0, '#e9eef1'); bgq.addColorStop(1, '#d5dde2'); g.fillStyle = bgq; g.fillRect(x, y, w, h);
    const PL = { ...L, skinH: mix(L.skinH, '#ffffff', 0.12), skin: mix(L.skin, L.skinH, 0.25) };
    bust(g, x + w / 2, y + h * 0.46, R, PL, { flat: 1, light: { x: 0, back: 0 }, look: [0, 0], ...(o.face || {}) });
    // the flash on a print: a soft sheen, and a faint grain of the paper
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.ellipse(x + w * 0.38, y + h * 0.3, w * 0.5, h * 0.4, -0.4, 0, TAU); g.fill();
    g.restore();
    g.save(); g.strokeStyle = 'rgba(30,34,40,0.35)'; g.lineWidth = Math.max(1, w * 0.008); g.strokeRect(x, y, w, h); g.restore();
    return { h, R, cx: x + w / 2, cy: y + h * 0.46 };
  }

  // ------------------------------------------------------------------ two looks, k of the way from a to b
  const NUM = ['fat', 'jawW', 'chin', 'grey', 'recede', 'vol', 'beard', 'beardGrey', 'must', 'mustGrey', 'ew', 'eh', 'brow', 'browTilt', 'lines', 'folds', 'bags', 'stub', 'noseW', 'mouthW', 'lip', 'broad'];
  const COL = ['skin', 'skinD', 'skinH', 'hair', 'beardC', 'mustC', 'browC', 'shirt'];
  function blend(a, b, k) {
    const out = { ...(k < 0.5 ? a : b) };
    for (const f of NUM) if (f in a || f in b) out[f] = lerp(a[f] ?? 0, b[f] ?? 0, k);
    for (const f of COL) if (a[f] && b[f]) out[f] = mix(a[f], b[f], k);
    if (a.ear || b.ear) { const ea = a.ear || {}, eb = b.ear || {}, e = {}; for (const f of ['h', 'w', 'out', 'y', 'lobe', 'fold', 'lobeL']) e[f] = lerp(ea[f] ?? (f === 'h' || f === 'w' ? 1 : f === 'out' ? 0.35 : f === 'lobe' ? 0.5 : 0), eb[f] ?? (f === 'h' || f === 'w' ? 1 : f === 'out' ? 0.35 : f === 'lobe' ? 0.5 : 0), k); out.ear = e; }
    return out;
  }

  window.FACE = { head, bust, photo, blend, PH };
})();
