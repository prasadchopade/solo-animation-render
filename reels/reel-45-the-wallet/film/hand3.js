// Reel 45 · The Wallet: hands in 3D, for close-ups (new for this reel). The brief: "hands are the stars ... fingers that bend, a
// thumb that flicks notes, a grip with weight"; at phone size 42's hands read as "a blocky brown square", and 37's mittens as
// "sloppy". A hand here is a wrist frame (where it is, which way the fingers point, which way the back of the hand faces) and a
// pose (each finger's three joints and its spread, the thumb's four numbers). Its bones are placed in the world and drawn as
// tapered, shaded capsules under the reel's camera, returned as primitives that film.js sorts far to near with the props.
// Units are metres; every function is a pure function of its arguments (nothing is kept between frames).
(() => {
  const R = window.RIG, { mix, rgba } = R, D = Math.PI / 180, PI = Math.PI, TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  // vectors
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const madd = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const norm = (a) => { const l = len(a) || 1e-9; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const ortho = (v, u) => norm(sub(v, mul(u, dot(v, u))));          // v made perpendicular to the unit vector u
  // turn a towards b (both unit) by at most maxA radians, then by the fraction k of what's left
  function towards(a, b, k, maxA = PI) {
    const c = clamp(dot(a, b), -1, 1), ang = Math.acos(c); if (ang < 1e-5) return a;
    const use = Math.min(ang * k, maxA), w = ortho(b, a);
    return norm(add(mul(a, Math.cos(use)), mul(w, Math.sin(use))));
  }

  // ------------------------------------------------------------------ the hand's bones (metres, a man's hand drawn a little large)
  // u: from the wrist to the middle knuckle; s: towards the thumb; n: out of the back of the hand
  const FINGERS = [
    { u: 0.094, s: 0.030, n: 0.000, L: [0.046, 0.027, 0.021], r: [0.0104, 0.0095, 0.0087] },   // index
    { u: 0.098, s: 0.009, n: 0.002, L: [0.050, 0.031, 0.022], r: [0.0108, 0.0099, 0.0089] },   // middle
    { u: 0.094, s: -0.012, n: 0.001, L: [0.047, 0.029, 0.021], r: [0.0101, 0.0093, 0.0085] },  // ring
    { u: 0.085, s: -0.031, n: -0.002, L: [0.037, 0.022, 0.019], r: [0.0090, 0.0083, 0.0077] }, // little
  ];
  const THUMB = { base: [0.017, 0.021, -0.011], L: [0.044, 0.034, 0.029], r: [0.0168, 0.0128, 0.0112] };   // its first bone is the ball of the thumb
  // poses, in degrees: f = each finger's [knuckle, middle joint, end joint, spread (+ towards the thumb)]; t = the thumb's
  // [out to the side in the palm's plane, out in front of the palm, its middle joint, its end joint]
  const POSE = {
    relax: { f: [[18, 26, 14, 5], [22, 32, 16, 0], [26, 38, 18, -5], [30, 44, 22, -10]], t: [28, 30, 18, 16] },
    open: { f: [[4, 4, 2, 10], [3, 3, 2, 2], [4, 4, 2, -6], [6, 6, 3, -15]], t: [46, 12, 6, 6] },
    hover: { f: [[10, 14, 8, 8], [10, 15, 8, 1], [12, 17, 9, -6], [14, 19, 10, -13]], t: [40, 18, 10, 10] },
    flat: { f: [[3, 5, 3, 3], [3, 5, 3, 0], [3, 5, 3, -3], [4, 6, 3, -7]], t: [22, 8, 8, 8] },
    cup: { f: [[28, 30, 16, 4], [30, 33, 17, 0], [32, 36, 19, -4], [36, 40, 21, -8]], t: [30, 38, 18, 16] },
    grip: { f: [[60, 72, 42, 3], [64, 76, 44, 0], [68, 80, 46, -3], [72, 82, 48, -6]], t: [18, 52, 28, 26] },
    wrap: { f: [[46, 56, 30, 3], [48, 58, 32, 0], [52, 62, 34, -3], [56, 66, 36, -6]], t: [22, 46, 22, 18] },    // round a fold of notes or a wallet's edge
    tray: { f: [[20, 20, 10, 3], [20, 20, 10, 0], [24, 24, 12, -3], [28, 28, 14, -6]], t: [16, 62, 22, 18] },   // a flat thing lying across the fingers, the thumb on top
    pinch: { f: [[36, 30, 16, 1], [38, 32, 18, -3], [62, 82, 52, -5], [68, 88, 56, -9]], t: [24, 46, 22, 16] },
    point: { f: [[4, 5, 3, 2], [78, 98, 60, 0], [82, 100, 62, -3], [86, 100, 62, -6]], t: [8, 40, 42, 32] },    // the forefinger, from the thumb's side; the thumb tucked against the middle finger
    fist: { f: [[84, 100, 60, 2], [88, 104, 62, 0], [90, 106, 62, -2], [92, 106, 62, -4]], t: [6, 44, 48, 40] },
  };
  const copyPose = (P) => ({ f: P.f.map((x) => x.slice()), t: P.t.slice() });
  function blend(a, b, u) {                                          // two poses (or names), u of the way from a to b
    const A = typeof a === 'string' ? POSE[a] : a, B = typeof b === 'string' ? POSE[b] : b;
    return { f: A.f.map((x, i) => x.map((v, j) => lerp(v, B.f[i][j], u))), t: A.t.map((v, j) => lerp(v, B.t[j], u)) };
  }

  // the bones in the world: W the wrist, u the fingers' way, n the back of the hand's (made perpendicular to u), side +1 his right
  // hand, -1 a left hand; k scales the whole hand
  function bones(W, u, n, side, P, k = 1) {
    u = norm(u); n = ortho(n, u);
    const s = side > 0 ? cross(u, n) : cross(n, u);
    const at = (a, b, c) => [W[0] + (u[0] * a + s[0] * b + n[0] * c) * k, W[1] + (u[1] * a + s[1] * b + n[1] * c) * k, W[2] + (u[2] * a + s[2] * b + n[2] * c) * k];
    const H = { W, u, n, s, k, side, fingers: [], thumb: null };
    FINGERS.forEach((F, i) => {
      const [m, p, d, ab] = P.f[i], a = ab * D, d0 = norm(add(mul(u, Math.cos(a)), mul(s, Math.sin(a))));
      let th = 0, q = at(F.u, F.s, F.n); const J = [q], dors = [];
      for (const [ang, L] of [[m, F.L[0]], [p, F.L[1]], [d, F.L[2]]]) {
        th += ang * D; const dir = add(mul(d0, Math.cos(th)), mul(n, -Math.sin(th)));
        dors.push(add(mul(d0, Math.sin(th)), mul(n, Math.cos(th))));  // the back of that bone
        q = madd(q, dir, L * k); J.push(q);
      }
      H.fingers.push({ J, r: F.r.map((x) => x * k), dors, d0 });
    });
    const [rad, pal, mc, ip] = P.t;
    const B = at(...THUMB.base);
    const t0 = norm(add(mul(u, Math.cos(rad * D)), mul(s, Math.sin(rad * D))));
    const m0 = norm(add(mul(t0, Math.cos(pal * D)), mul(n, -Math.sin(pal * D))));
    const J1 = madd(B, m0, THUMB.L[0] * k);
    const C = at(0.078, -0.004, -0.034);                               // in front of the middle of the palm: where the thumb curls to
    const q0 = ortho(norm(sub(C, J1)), m0);
    const J = [B, J1], dors = [ortho(n, m0)]; let q = J1, ph = 0;
    for (const [ang, L] of [[mc, THUMB.L[1]], [ip, THUMB.L[2]]]) {
      ph += ang * D; const dir = add(mul(m0, Math.cos(ph)), mul(q0, Math.sin(ph)));
      dors.push(norm(add(mul(m0, Math.sin(ph)), mul(q0, -Math.cos(ph)))));   // the side away from where it curls: the nail's side
      q = madd(q, dir, L * k); J.push(q);
    }
    H.thumb = { J, r: THUMB.r.map((x) => x * k), dors };
    // the palm block: a back that's nearly flat, a front that's fleshy at the ball of the thumb and the heel of the hand
    const pp = [];
    for (const [a, b, c] of [[-0.004, 0.026, 0.010], [-0.004, -0.028, 0.010], [0.05, -0.036, 0.009], [0.05, 0.034, 0.009],
      [0.0, 0.024, -0.012], [0.0, -0.025, -0.012], [0.045, -0.034, -0.017], [0.075, -0.034, -0.012], [0.035, 0.032, -0.019],
      [0.05, -0.039, -0.002], [0.04, 0.038, -0.004], [0.012, 0.031, -0.006], [0.012, -0.031, -0.002]]) pp.push(at(a, b, c));
    for (const F of FINGERS) { const w = F.s > 0.02 ? 0.008 : F.s < -0.02 ? -0.007 : 0; pp.push(at(F.u - 0.005, F.s + w, 0.008), at(F.u - 0.008, F.s + w, -0.012)); }
    pp.push(madd(B, m0, THUMB.L[0] * k * 0.55), madd(madd(B, m0, THUMB.L[0] * k * 0.3), n, -0.008 * k));   // the web to the thumb
    H.palm = pp; H.palmC = at(0.05, 0, 0); H.thenar = at(0.03, 0.026, -0.016);
    H.tip = (i) => (i < 4 ? H.fingers[i].J[3] : H.thumb.J[3]);         // a fingertip in the world
    H.pad = (i, off = 0.6) => {                                         // the pad of a fingertip, a little in from its end, on the palm's side
      const F = i < 4 ? H.fingers[i] : H.thumb, a = F.J[2], b = F.J[3], d = norm(sub(b, a)), dv = F.dors[2];
      return madd(madd(b, d, -F.r[2] * off), dv, -F.r[2] * 0.85);
    };
    return H;
  }

  // a frame for a hand: fingers along fwd (bent no more than maxA from the forearm's way, as a wrist allows), back of the hand up
  function frame(el, wr, fwd, back, maxA = 1.15) {
    const fa = norm(sub(wr, el)), u = towards(fa, norm(fwd), 1, maxA);
    return { u, n: ortho(back, u) };
  }

  // ------------------------------------------------------------------ drawing
  // a tapered capsule between two screen points (radii in px), with a soft lit side and an outline
  function capsule(g, a, b, ra, rb, c0, c1, edge, ew, lx) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx), dr = L > 1e-3 ? clamp((ra - rb) / L, -0.95, 0.95) : 0, ph = Math.acos(dr);   // where the outer tangents touch
    g.beginPath(); g.arc(a[0], a[1], ra, ang + ph, ang - ph); g.arc(b[0], b[1], rb, ang - ph, ang + ph); g.closePath();
    let nx = -dy / (L || 1), ny = dx / (L || 1); if (nx * lx - ny * 0.6 < 0) { nx = -nx; ny = -ny; }
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, r = Math.max(ra, rb);
    const q = g.createLinearGradient(mx + nx * r, my + ny * r, mx - nx * r, my - ny * r);
    q.addColorStop(0, c0); q.addColorStop(0.5, mix(c0, c1, 0.45)); q.addColorStop(1, c1);
    g.fillStyle = q; g.fill();
    if (ew > 0) { g.lineWidth = ew; g.strokeStyle = edge; g.stroke(); }
  }
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    const up = []; for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  function roundPath(g, pts, k = 0.5) {                               // a closed, rounded path through screen points
    const n = pts.length; if (n < 3) return;
    const m = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
    let p = m(n - 1); g.beginPath(); g.moveTo(p[0], p[1]);
    for (let i = 0; i < n; i++) { const q = m(i), c = pts[i]; g.quadraticCurveTo(c[0], c[1], q[0], q[1]); p = q; }
    g.closePath();
  }

  // the primitives of one hand: [{ z, draw(g) }]. look: { skin, skinD, palm, nail }; lt: the light (RIG.lightOf(cam)); o.a: opacity
  function prims(cam, H, look, lt, o = {}) {
    const out = [], P = (p) => cam.P(p[0], p[1], p[2]);
    const [c0, c1] = R.tone(look.skin, lt), lx = lt.x >= 0 ? 1 : -1;
    const edge = rgba(mix(c1, '#1e0e08', 0.55), 0.8), alpha = o.a ?? 1;
    const toCam = (v) => cam.dirCam(v[0], v[1], v[2]);
    const backVis = toCam(H.n)[2] < 0;                                // the back of the hand is towards you
    const palmCol = R.tone(look.palm || mix(look.skin, '#f3c9ae', 0.38), lt);
    const nailCol = look.nail || mix(look.skin, '#f7dccb', 0.6);
    const pw = (p) => { const q = P(p); return q; };
    // the palm
    const pts = H.palm.map(pw);
    if (pts.every((q) => q)) {
      const hz = cam.toCam(H.palmC[0], H.palmC[1], H.palmC[2])[2];
      out.push({ z: hz + (o.zBias || 0), draw: (g) => {
        g.save(); g.globalAlpha = alpha;
        const hp = hull(pts.map((q) => [q[0], q[1]])); roundPath(g, hp);
        const pc = P(H.palmC), sc = pc[2], r = 0.05 * sc;
        const [a0, a1] = backVis ? [c0, c1] : palmCol;
        const q = g.createLinearGradient(pc[0] + lx * r, pc[1] - r * 0.6, pc[0] - lx * r, pc[1] + r * 0.6);
        q.addColorStop(0, a0); q.addColorStop(1, a1); g.fillStyle = q; g.fill();
        g.lineWidth = Math.max(0.8, 0.0016 * sc); g.strokeStyle = edge; g.stroke();
        g.save(); roundPath(g, hp); g.clip();
        if (backVis) {                                                // knuckles and the tendons' faint lines
          g.strokeStyle = rgba(mix(c1, '#2a140c', 0.3), 0.28); g.lineWidth = Math.max(0.7, 0.0018 * sc); g.lineCap = 'round';
          for (let i = 0; i < 4; i++) { const F = FINGERS[i], a = P(add(H.W, add(mul(H.u, 0.03 * H.k), mul(H.s, F.s * 0.6 * H.k)))), b = P(H.fingers[i].J[0]); if (a && b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(lerp(a[0], b[0], 0.85), lerp(a[1], b[1], 0.85)); g.stroke(); } }
          g.fillStyle = rgba(mix(c0, '#fff3e6', 0.5), 0.45);
          for (let i = 0; i < 4; i++) { const k = P(H.fingers[i].J[0]); if (k) { g.beginPath(); g.ellipse(k[0], k[1], H.fingers[i].r[0] * k[2] * 0.75, H.fingers[i].r[0] * k[2] * 0.5, 0, 0, TAU); g.fill(); } }
        } else {                                                      // the palm's lines and the ball of the thumb
          g.strokeStyle = rgba(mix(palmCol[1], '#3a1a10', 0.4), 0.35); g.lineWidth = Math.max(0.7, 0.0015 * sc); g.lineCap = 'round';
          const crease = (a, b, c) => { const A = P(a), B = P(b), Cc = P(c); if (A && B && Cc) { g.beginPath(); g.moveTo(A[0], A[1]); g.quadraticCurveTo(B[0], B[1], Cc[0], Cc[1]); g.stroke(); } };
          const at = (a, b, c = -0.0075) => add(H.W, add(add(mul(H.u, a * H.k), mul(H.s, b * H.k)), mul(H.n, c * H.k)));
          crease(at(0.072, -0.03), at(0.07, -0.005), at(0.062, 0.022));
          crease(at(0.055, -0.03), at(0.05, -0.005), at(0.06, 0.02));
          crease(at(0.07, 0.025), at(0.035, 0.012), at(0.01, 0.012));
          const tn = P(H.thenar); if (tn) { g.fillStyle = rgba(mix(palmCol[0], '#ffffff', 0.25), 0.25); g.beginPath(); g.ellipse(tn[0], tn[1], 0.016 * tn[2], 0.012 * tn[2], 0, 0, TAU); g.fill(); }
        }
        g.restore(); g.restore();
      } });
    }
    // the fingers and the thumb, a capsule a bone
    const digits = [...H.fingers.map((F, i) => ({ F, i })), { F: H.thumb, i: 4 }];
    for (const { F, i } of digits) {
      for (let b = 0; b < 3; b++) {
        const A = F.J[b], B = F.J[b + 1], pa = P(A), pb = P(B); if (!pa || !pb) continue;
        const z = (cam.toCam(A[0], A[1], A[2])[2] + cam.toCam(B[0], B[1], B[2])[2]) / 2 - (b === 0 && i < 4 ? 0.002 : 0) + (i < 4 ? (o.zBias || 0) : 0);   // o.zBias: the palm and fingers behind something held (the thumb stays)
        const ra = F.r[b] * pa[2], rb = (b < 2 ? F.r[b + 1] : F.r[2] * 0.92) * pb[2];
        const dorsV = toCam(F.dors[b])[2] < 0.05;
        const tip = b === 2;
        out.push({ z, draw: (g) => {
          g.save(); g.globalAlpha = alpha;
          const shadeK = i === 4 ? 0.05 : 0.04 * i;
          capsule(g, pa, pb, ra, rb, mix(c0, c1, shadeK), mix(c1, '#2a1810', 0.08 + shadeK), edge, Math.max(0.7, 0.07 * Math.min(ra, rb)), lx);
          if (dorsV && b === 1) {                                     // a crease over the middle joint
            g.strokeStyle = rgba(mix(c1, '#2a140c', 0.4), 0.3); g.lineWidth = Math.max(0.6, 0.08 * ra); g.lineCap = 'round';
            const dx = pb[0] - pa[0], dy = pb[1] - pa[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, cx = pa[0] + dx * 0.12, cy = pa[1] + dy * 0.12;
            g.beginPath(); g.moveTo(cx + nx * ra * 0.55, cy + ny * ra * 0.55); g.quadraticCurveTo(cx + dx / L * ra * 0.3, cy + dy / L * ra * 0.3, cx - nx * ra * 0.55, cy - ny * ra * 0.55); g.stroke();
          }
          if (tip && dorsV) {                                          // the nail, on the back of the last bone
            const dv = F.dors[2], nb = madd(lerp3(A, B, 0.6), dv, F.r[2] * 0.62), q = P(nb), e2 = P(madd(B, dv, F.r[2] * 0.5));
            if (q && e2) {
              const ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]), facing = clamp(-toCam(dv)[2] * 1.3, 0.25, 1), w = F.r[2] * q[2] * 0.78 * facing, h = F.r[2] * q[2] * 1.05;
              g.translate((q[0] + e2[0]) / 2, (q[1] + e2[1]) / 2); g.rotate(ang);
              g.fillStyle = nailCol; g.beginPath(); g.ellipse(0, 0, h, w, 0, 0, TAU); g.fill();
              g.strokeStyle = rgba(mix(c1, '#3a1a10', 0.3), 0.35); g.lineWidth = Math.max(0.5, 0.05 * h); g.stroke();
              g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-h * 0.2, -w * 0.25, h * 0.35, w * 0.22, 0, 0, TAU); g.fill();
            }
          }
          g.restore();
        } });
      }
    }
    return out;
  }

  window.HAND3 = { POSE, blend, copyPose, bones, frame, prims, capsule, hull, roundPath, v: { add, sub, mul, madd, dot, cross, len, norm, lerp3, ortho, towards } };
})();
